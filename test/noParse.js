var test = require('tap').test
var Deps = require('..')
var path = require('path')
var concat = require('concat-stream')

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'source')

test('noParse', function(t) {
  t.plan(1)
  var stream = Deps({
    basedir: fixtures(),
    noParse: ['**/*.css', '!**/f.css'],
  })
  stream.write({ file: './a.css', noParse: true, source: '.a{}' })
  stream.write({ file: './b.css', source: '@deps "nonexist";.b{}' })
  stream.write({ file: './c.css', source: '@deps "nonexist";.c{}' })
  stream.write({ file: './d.css', source: '@deps "nonexist";.d{}' })
  stream.write({ file: './e.css', source: '@deps "nonexist";.e{}' })
  stream.end({ file: './f.css', source: '.f{}' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(sort(rows), sort([
      { id: fixtures('a.css'), file: fixtures('a.css'), noParse: true, deps: {}, source: '.a{}' },
      { id: fixtures('b.css'), file: fixtures('b.css'), deps: {}, source: '@deps "nonexist";.b{}' },
      { id: fixtures('c.css'), file: fixtures('c.css'), deps: {}, source: '@deps "nonexist";.c{}' },
      { id: fixtures('d.css'), file: fixtures('d.css'), deps: {}, source: '@deps "nonexist";.d{}' },
      { id: fixtures('e.css'), file: fixtures('e.css'), deps: {}, source: '@deps "nonexist";.e{}' },
      { id: fixtures('f.css'), file: fixtures('f.css'), deps: {}, source: '.f{}' },
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
