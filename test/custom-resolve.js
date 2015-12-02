var test = require('tap').test
var Deps = require('..')
var path = require('path')
var concat = require('concat-stream')

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'custom-resolve')

test('custom resolve', function(t) {
  t.plan(1)
  var stream = Deps({
    basedir: fixtures(),
    resolve: { extensions: '.scss' },
  })
  stream.end({ file: './a.scss' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(sort(rows), sort([
      { id: fixtures('a.scss'), file: fixtures('a.scss'), deps: { './b': fixtures('b.scss') }, source: 'a{}\n' },
      { id: fixtures('b.scss'), file: fixtures('b.scss'), deps: {}, source: 'b{}\n' },
    ]))
  }))
})

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
