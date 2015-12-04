var postcss = require('postcss')
var EventEmitter = require('events')

var inherits = require('util').inherits
inherits(Result, EventEmitter)

module.exports = Result

function Result(opts) {
  opts = opts || {}
  this.from = opts.file
  this._source = opts.source
  this._root = null

  Object.defineProperty(this, 'root', {
    get: function () {
      if (this._root) {
        return this._root
      }
      this._root = postcss.parse(this._source, { from: this.from })
      return this._root
    },
    set: function (rt) {
      this._root = rt
    },
  })

  Object.defineProperty(this, 'css', {
    get: function () {
      if (!this._root) {
        return this._source
      }
      // a little expensive to get this property
      // but everytime `this.root` changes,
      // it invalidates `this.source`
      return postcss().process(this.root, { from: this.from }).css
    },
    set: function (src) {
      this._root = null
      this._source = src
    },
  })

}

