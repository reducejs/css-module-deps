var Transform = require('stream').Transform
var mix = require('mixy')
var path = require('path')
var fs = require('fs')
var promisify = require('node-promisify')
var resolver = require('custom-resolve')
var multimatch = require('multimatch')

var Result = require('./lib/result')
var fsReadFile = promisify(fs.readFile)
var styleResolve = promisify(resolver({
  main: 'style',
  extensions: '.css',
  symlink: true,
}))

var RESOLVED = Promise.resolve()

var inherits = require('util').inherits
inherits(Deps, Transform)

module.exports = Deps

function Deps(opts) {
  if (!(this instanceof Deps)) {
    return new Deps(opts)
  }
  Transform.call(this, { objectMode: true })

  this._visitState = buildState(opts)
}

Deps.prototype._transform = function(row, _, next) {
  var state = this._visitState
  if (row.processor) {
    state.processor.push(row.processor)
    return next()
  }

  // do not modify the original `row`
  row = mix({}, row)

  row.file = row.file || row.id || fakeFile(state)
  row.file = path.resolve(state.basedir, row.file)
  row.input = true

  state.visited[row.file] = row

  next()
}

Deps.prototype._flush = function() {
  var state = this._visitState
  var visited = state.visited
  Object.keys(visited).forEach(function (file) {
    walk(this, visited[file], { basedir: state.basedir })
  }, this)
}

function hasSource(row) {
  // Allow empty source input,
  // whose deps may be added by `this.dependenciesFilter`
  return typeof row.source === 'string'
}

function fakeFile(state) {
  state.fakeOrder = state.fakeOrder || 0
  state.fakeOrder++
  return 'fake_' + state.fakeOrder + '.css'
}

function buildState(opts) {
  var state = {
    basedir: process.cwd(),
    processor: [],

    cache: {},
    fileCache: {},

    readFile: fsReadFile,
    resolve: styleResolve,
    dependenciesFilter: identity,
  }
  state = mix(state, opts)

  state.atRuleName = state.atRuleName || state.atDeps || 'deps'
  state.pending = 0
  state.visited = {}

  if (!Array.isArray(state.processor)) {
    state.processor = [state.processor]
  }

  if (state.resolve && typeof state.resolve !== 'function') {
    state.resolve = promisify(resolver(state.resolve))
  }

  return state
}

function readFile(stream, file) {
  var state = stream._visitState
  var fileCache = state.fileCache
  if (typeof fileCache[file] === 'string') {
    return Promise.resolve(fileCache[file])
  }

  stream.emit('file', file)

  return RESOLVED.then(function () {
    // Return a promise OR the contents
    return state.readFile(file, 'utf8')
  })
}

function fromVisited(state, row) {
  var file = row.file
  var visited = state.visited[file]

  if (visited === true) {
    return { file: file, visited: true }
  }

  return null
}

function fromCache(stream, row) {
  var state = stream._visitState
  var c = state.cache[row.file]
  if (!c) return RESOLVED

  state.visited[row.file] = true
  row.source = c.source
  return parseDeps(stream, row, Object.keys(c.deps))
}

function fromSource(stream, row) {
  var state = stream._visitState
  state.visited[row.file] = true

  return fromCache(stream, row)
    .then(function (r) {
      if (r) return r
      return fromRow(stream, row)
    })
}

function fromRow(stream, row) {
  var state = stream._visitState
  if (!needParse(state, row)) {
    row.deps = row.deps || {}
    return Promise.resolve(row)
  }
  // Better not to access `result.css` and `result.root` alternatively,
  // stick to one of them
  var result = new Result(row)
  // To work with watchify
  // processors which read more files should fire `file` on `result`
  stream.emit('transform', result, row.file)
  return state.processor.concat(function (r) {
    return parseDeps(stream, row, detect(state, r))
  })
  .reduce(function (p, processor) {
    return p.then(function () {
      return processor(result)
    })
  }, RESOLVED)
  .then(function () {
    row.source = result.css
    return row
  })
}

function fromFile(stream, rec, parent) {
  var state = stream._visitState
  return RESOLVED.then(function () {
    // rec.file has been resolved in `_transform`
    if (rec.input) return rec
    return state.resolve(rec.file, parent)
      .then(function (file) {
        rec.file = file
        return rec
      })
  })
  .then(function (row) {
    var visited = fromVisited(state, row)
    if (visited) return visited

    // Mark it visited before processing
    state.visited[row.file] = true

    return fromCache(stream, row).then(function (r) {
      if (r) return r
      return readFile(stream, row.file)
        .then(function (src) {
          row.source = src
          return fromRow(stream, row)
        })
    })
  })
}

function walk(stream, rec, parent) {
  var state = stream._visitState

  ++state.pending

  var visited = fromVisited(state, rec)
  if (visited) {
    visited = Promise.resolve(visited)
  } else if (hasSource(rec)) {
    visited = fromSource(stream, rec)
  } else {
    visited = fromFile(stream, rec, parent)
  }

  return visited.then(function (row) {
    if (!row.visited) {
      if (row.input) delete row.input
      row.id = row.id || row.file
      stream.push(row)
    }
    if (--state.pending === 0) {
      stream.push(null)
    }
    return row
  }, function (err) {
    stream.emit('error', err)
  })
}

function needParse(state, row) {
  if (row.noParse) return false
  if (!state.noParse) return true
  return !multimatch(row.file, state.noParse).length
}

function detect(state, result) {
  var rules = []
  result.root.walkAtRules(state.atRuleName, function (rule) {
    rules.push(rule)
  })
  var deps = rules.map(function (rule) {
    var dep = rule.params.replace(/['"]/g, '').trim()
    rule.remove()
    return dep
  })
  return deps
}

function parseDeps(stream, row, deps) {
  var state = stream._visitState
  return RESOLVED.then(function () {
    // Return a promise OR the new deps
    return state.dependenciesFilter(deps, row.file)
  })
  .then(function (dependencies) {
    return Promise.all(
      dependencies.map(function (dep) {
        return walk(stream, { file: dep }, {
          basedir: path.dirname(row.file),
        })
      })
    )
    .then(function (rows) {
      row.deps = rows.reduce(function (o, r, i) {
        o[dependencies[i]] = r.file
        return o
      }, {})
      return row
    })
  })
}

function identity(v) {
  return v
}

