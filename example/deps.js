var Deps = require('..')
var postcss = require('postcss')
var atImport = require('postcss-import')
var url = require('postcss-url')
var vars = require('postcss-advanced-variables')
var JSONStream = require('JSONStream')
var path = require('path')

var fixtures = path.resolve.bind(path, __dirname, 'src')
var processor = postcss([
  atImport(),
  url(),
  vars(),
])

var stream = new Deps({
  basedir: fixtures(),
  processor: function (result) {
    return processor.process(result.css, { from: result.from, to: result.to })
      .then(function (res) {
        result.css = res.css
      })
  },
})
stream.write({ file: './import-url.css' })
stream.end({ file: './import-and-deps.css' })

stream.pipe(JSONStream.stringify()).pipe(process.stdout)

