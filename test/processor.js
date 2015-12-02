var test = require('tap').test
var Deps = require('..')
var path = require('path')
var concat = require('concat-stream')
var atImport = require('postcss-import')
var vars = require('postcss-advanced-variables')
var url = require('postcss-url')
var postcss = require('postcss')

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'processor')

test('processor', function(t) {
  t.plan(1)
  var stream = Deps({
    basedir: fixtures(),
    processor: processor,
  })
  stream.write({ file: './import-url.css' })
  stream.end({ file: './import-and-deps.css' })
  run(stream, t)
})

test('processor, from stream', function(t) {
  t.plan(1)
  var stream = Deps({
    basedir: fixtures(),
  })
  stream.write({ processor: processor })
  stream.write({ file: './import-url.css' })
  stream.end({ file: './import-and-deps.css' })
  run(stream, t)
})

function processor(result) {
  var p = postcss([
    atImport(),
    url(),
    vars(),
  ])
  return p.process(result.css, { from: result.from, to: result.from })
    .then(function (res) {
      result.css = res.css
    })
}

function run(stream, t) {
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(sort(rows), sort([
      {
        deps: {
          './import-url': fixtures('import-url.css'),
        },
        file: fixtures('import-and-deps.css'),
        id: fixtures('import-and-deps.css'),
        source: '.import-and-deps {\n  color: #FF0000;\n}\n\n',
      },
      {
        deps: {},
        file: fixtures('import-url.css'),
        id: fixtures('import-url.css'),
        source: '.dialog {\n  background: url(node_modules/sprites/dialog/sp-dialog.png)\n}\n.importUrl{}\n\n',
      },
    ]))
  }))
}

function sort(rows) {
  rows.sort(function (a, b) {
    if (a.file === b.file) {
      return 0
    }
    if (a.file < b.file) {
      return -1
    }
    return 1
  })
  return rows
}
