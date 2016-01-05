var promisify = require('node-promisify')
var resolver = require('custom-resolve')
var mix = require('mixy')

var defaultOpts = {
  main: 'style',
  extensions: '.css',
  symlink: true,
}

exports.style = custom(mix({}, defaultOpts))

exports.custom = custom

function custom(opts) {
  return promisify(resolver(mix({}, defaultOpts, opts)))
}

