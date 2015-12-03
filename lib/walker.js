var path = require('path')
var multimatch = require('multimatch')
var debug = require('util').debuglog('deps')

var State = require('./state')
var Result = require('./result')
var createOptions = require('./createOptions')
var RESOLVED = Promise.resolve()

module.exports = Walker

function Walker(opts) {
  this.opts = createOptions(opts)
}

Walker.prototype.loop = function(inputs) {
  debug('loop', inputs)
  var self = this
  var state = new State(function () {
    return Promise.all(
      inputs.map(function (row) {
        row.input = true
        return self.walk(state, row, {
          basedir: self.opts.basedir,
        })
      })
    )
  })

  return state
}

Walker.prototype.walk = function(state, rec, parent) {
  debug('walk', rec.file)
  var self = this
  return RESOLVED.then(function () {
    var visited = self.fromVisited(state, rec)
    if (visited) return visited
    if (hasSource(rec)) {
      return self.fromSource(state, rec)
    }
    return self.fromFile(state, rec, parent)
  }).then(function (row) {
    debug('push', row.file, !row.visited)
    if (!row.visited) {
      if (row.input) delete row.input
      row.id = row.id || row.file
      state.results.push(row)
    }
    return row
  })
}

Walker.prototype.fromVisited = function(state, row) {
  debug('fromVisited', row.file)
  if (state.visited[row.file]) {
    return { file: row.file, visited: true }
  }
  return null
}

// walk from cache, in which `{ file: ..., source: ..., deps: ... }`
Walker.prototype.fromCache = function(state, row) {
  debug('fromCache', row.file)
  var c = this.opts.cache[row.file]
  if (!c) return RESOLVED

  row.source = c.source
  return this.fromDeps(state, row, Object.keys(c.deps))
}

// walk from `source`
Walker.prototype.fromSource = function(state, row) {
  debug('fromSource', row.file)
  var visited = this.fromVisited(state, row)
  if (visited) return visited

  state.visited[row.file] = true

  var self = this
  return this.fromCache(state, row).then(function (r) {
    if (r) return r
    return self.fromRow(state, row)
  })
}

// walk from `{ file: ... }`
Walker.prototype.fromFile = function(state, row, parent) {
  debug('fromFile', row.file)
  var self = this
  return RESOLVED.then(function () {
    // `row.file` has been resolved in `_transform`
    if (row.input) return row.file

      // `row.file` must be resolvable
    return self.opts.resolve(row.file, parent)
  }).then(function (file) {
    row.file = file

    var visited = self.fromVisited(state, row)
    if (visited) return visited

    // Mark it visited before processing
    state.visited[row.file] = true

    return self.fromCache(state, row)
      .then(function (r) {
        if (r) return r
        return self.readFile(state, row.file)
          .then(function (src) {
            row.source = src
            return self.fromRow(state, row)
          })
      })
  })
}

// walk from `{ file: ..., source: ... }`
Walker.prototype.fromRow = function(state, row) {
  debug('fromRow', row.file)
  if (!this.needParse(row)) {
    row.deps = row.deps || {}
    return row
  }
  // Better not to access `result.css` and `result.root` alternatively,
  // stick to one of them
  var result = new Result(row)

  state.emit('result', result)

  var self = this
  return this.opts.transform.reduce(function (p, tr) {
    return p.then(function () {
      return tr(result)
    })
  }, RESOLVED)
  .then(function () {
    var deps = self.detect(result)
    row.source = result.css
    return self.fromDeps(state, row, deps)
  })
}

// walk from `{ file: ..., source: ... }` with `deps`
Walker.prototype.fromDeps = function(state, row, deps) {
  debug('fromDeps', row.file)
  var self = this
  return RESOLVED.then(function () {
    // Return a promise OR the new deps
    return self.opts.dependenciesFilter(deps, row.file)
  })
  .then(function (dependencies) {
    return Promise.all(
      dependencies.map(function (dep) {
        return self.walk(state, { file: dep }, {
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

Walker.prototype.readFile = function(state, file) {
  debug('readFile', file)
  var opts = this.opts
  return RESOLVED.then(function () {
    var fileCache = opts.fileCache
    if (typeof fileCache[file] === 'string') {
      return fileCache[file]
    }

    state.emit('file', file)

    // Return a promise OR the contents
    return opts.readFile(file, 'utf8')
  })
}

Walker.prototype.detect = function(result) {
  debug('detect', result.from)
  var rules = []
  result.root.walkAtRules(this.opts.atRuleName, function (rule) {
    rules.push(rule)
  })
  var deps = rules.map(function (rule) {
    var dep = rule.params.replace(/['"]/g, '').trim()
    rule.remove()
    return dep
  })
  return deps
}

Walker.prototype.needParse = function(row) {
  var noParse = this.opts.noParse
  if (row.noParse) return false
  if (!noParse) return true
  return !multimatch(row.file, noParse).length
}

function hasSource(row) {
  return typeof row.source === 'string'
}

