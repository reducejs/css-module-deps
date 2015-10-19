import postcss from 'postcss'
import EventEmitter from 'events'

export default class Result extends EventEmitter {
  constructor(opts = {}) {
    super()
    this.from = opts.file
    this._source = opts.source
    this._root = null
  }
  get root() {
    if (this._root) {
      return this._root
    }
    this._root = postcss.parse(this._source)
    return this._root
  }
  get css() {
    if (!this._root) {
      return this._source
    }
    // a little expensive to get this property
    // but everytime `this.root` changes,
    // it invalidates `this.source`
    return postcss().process(this.root, { from: this.from }).css
  }
  set css(src) {
    this._root = null
    this._source = src
  }
  set root(rt) {
    this._root = rt
  }
}
