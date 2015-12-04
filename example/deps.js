var Deps = require('..')
var path = require('path')
var url = require('postcss-url')
var atImport = require('postcss-import')
var vars = require('postcss-advanced-variables')
var JSONStream = require('JSONStream')

var fixtures = path.resolve.bind(path, __dirname, 'src')

var stream = Deps({
  atRuleName: 'external',
  basedir: fixtures(),
  processor: [ atImport(), url(), vars() ],
})
stream.end({ file: './import-and-deps.css' })

stream.pipe(
  JSONStream.stringify(false, null, null, 2)
)
.pipe(process.stdout)

