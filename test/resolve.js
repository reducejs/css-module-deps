var test = require('tap').test
var Deps = require('..')
var path = require('path')
var concat = require('concat-stream')

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'resolve')

test('resolve', function(t) {
  t.plan(1)
  var stream = Deps({
    basedir: fixtures(),
  })
  stream.end({ file: './a.css' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(sort(rows), sort([
      { id: fixtures('a.css'), file: fixtures('a.css'), deps: { './b': fixtures('b.css') }, source: 'a{}\n' },
      { id: fixtures('b.css'), file: fixtures('b.css'), deps: {}, source: 'b{}\n' },
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
