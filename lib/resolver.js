var promisify = require('node-promisify')
var resolver = require('custom-resolve')

exports.style = custom({
  main: 'style',
  extensions: '.css',
  symlink: true,
})

exports.custom = custom

function custom(opts) {
  return promisify(resolver(opts))
}

