import { Transform } from 'stream'
import mix from 'util-mix'
import path from 'path'
import fs from 'fs'
import Result from './result'
import { run } from 'callback-sequence'
import promisify from 'node-promisify'
import resolver from 'custom-resolve'

var promisifiedReadFile = promisify(fs.readFile)

export default class Depsify extends Transform {
  constructor(opts = {}) {
    super({ objectMode: true })
    this._visited = {}
    this._pending = 0

    this.basedir = opts.basedir || process.cwd()
    this.atDeps = opts.atDeps || 'deps'
    this.cache = opts.cache
    this.processor = [].concat(opts.processor).filter(Boolean)
    this.noParse = [].concat(opts.noParse).filter(Boolean)

    if (opts.readFile) {
      this.readFile = opts.readFile
    }

    if (typeof opts.resolve === 'function') {
      this.resolve = opts.resolve
    } else {
      this.resolve = promisify(resolver(mix({
        packageEntry: 'style',
        extensions: '.css',
        symlinks: true,
      }, opts.resolve)))
    }

    this.paths = opts.paths || process.env.NODE_PATH || ''
    if (typeof this.paths === 'string') {
      this.paths = this.paths.split(
        path.delimiter || (process.platform === 'win32' ? ';' : ':')
      )
    }
    this.paths = this.paths
      .filter(Boolean)
      .map((p) => {
        return path.resolve(this.basedir, p)
      })
    this.top = {
      paths: this.paths,
      basedir: this.basedir,
    }
  }
  _transform(row, _, next) {
    // do not modify the original `row`
    row = mix({}, row)
    row.file = path.resolve(this.basedir, row.file)
    row.input = true
    this._visited[row.file] = row
    next()
  }
  _flush() {
    Object.keys(this._visited).forEach((file) => {
      this.visit(this._visited[file], this.top)
    })
  }
  readFile(file) {
    let s = this.cache && this.cache.source
    if (s) {
      return Promise.resolve(s)
    }
    this.emit('file', file)
    return promisifiedReadFile(file, 'utf8')
  }
  visit(row, parent) {
    ++this._pending
    return this.resolve(row.file, parent)
      .then((file) => {
        row.file = file
        if (this._visited[file] === true) {
          return { file: file }
        }
        // `file` is input, but `row` is created during the traversion,
        // to avoid losing infomation (such as `row.noParse`), visit input instead of `row`
        if (this._visited[file] && !row.input) {
          return { file: file }
        }
        // do not pass this useless information downstream
        delete row.input
        this._visited[file] = true

        if (row.source) {
          return this.process(row)
        }

        let c = this.cache && this.cache[file]
        if (c) {
          row.source = c.source
          return this.parseDeps(row, Object.keys(c.deps))
        }

        return this.readFile(file)
          .then((src) => {
            row.source = src
            return this.process(row)
          })
      }, (err) => {
        if (row.source) {
          return this.process(row)
        }
        throw err
      })
      .then(() => {
        if (row.source) {
          this.push(row)
        }
        if (--this._pending === 0) {
          this.push(null)
        }
        return row
      }, (err) => {
        this.emit('error', err)
      })
  }
  getProcessor(/*file*/) {
    return this.processor
  }
  process(row) {
    if (row.noParse) {
      row.deps = row.deps || {}
      return Promise.resolve(row)
    }
    return new Promise((rs, rj) => {
      // Better not to access `result.css` and `result.root` alternatively,
      // stick to one of them
      let result = new Result(row)
      // To work with watchify
      // processors which read more files should fire `file` on `result`
      this.emit('transform', result, row.file)
      run(
        this.getProcessor(row.file)
          .concat(() => {
            let deps = this.detect(result)
            return this.parseDeps(row, deps)
          })
          .map((p) => {
            return [p, result]
          }),
        (err) => {
          if (err) {
            return rj(err)
          }
          row.source = result.css
          rs(row)
        }
      )
    })
  }
  detect(result) {
    let rules = []
    result.root.walkAtRules(this.atDeps, (rule) => {
      rules.push(rule)
    })
    let deps = rules.map((rule) => {
      let dep = rule.params.replace(/['"]/g, '').trim()
      rule.remove()
      return dep
    })
    return deps
  }
  parseDeps(row, deps) {
    return Promise.all(
      deps.map((dep) => {
        return this.visit({ file: dep }, {
          filename: row.file,
          paths: this.paths,
        })
      })
    )
    .then((rows) => {
      row.deps = rows.reduce((o, r, i) => {
        o[deps[i]] = r.file
        return o
      }, {})
      return row
    })
  }
}

