var Deps = require('..')
var path = require('path')
var postcss = require('postcss')
var url = require('postcss-url')
var atImport = require('postcss-import')
var vars = require('postcss-advanced-variables')
var JSONStream = require('JSONStream')

var fixtures = path.resolve.bind(path, __dirname, 'src')
var processor = postcss([ atImport(), url(), vars() ])

var stream = Deps({ atRuleName: 'external', basedir: fixtures() })
stream.write({
  transform: function (result) {
    return processor.process(result.css, {
      from: result.from,
      to: result.to,
    })
    .then(function (res) {
      result.css = res.css
    })
  },
})
stream.write({ file: './import-url.css' })
stream.end({ file: './import-and-deps.css' })

stream.pipe(
  JSONStream.stringify(false, null, null, 2)
)
.pipe(process.stdout)

