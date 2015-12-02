var test = require('tap').test
var Deps = require('..')
var path = require('path')
var concat = require('concat-stream')

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'source')

test('entry with source', function(t) {
  t.plan(1)
  var stream = Deps({
    basedir: fixtures(),
  })
  // No file
  stream.write({ id: 'A', source: '.a{}' })
  stream.end({ file: '/b', source: '.b{}' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(sort(rows), sort([
      { id: 'A', file: fixtures('A'), deps: {}, source: '.a{}' },
      { id: '/b', file: '/b', deps: {}, source: '.b{}' },
    ]))
  }))
})

test('same entries', function(t) {
  t.plan(1)
  var stream = Deps({
    basedir: fixtures(),
  })
  // No file
  stream.write({ source: '.a{}' })
  stream.write({ file: '/b', source: '.b{}' })
  stream.end({ file: '/b', source: '.b{}' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(sort(rows), sort([
      { id: fixtures('fake_1.css'), file: fixtures('fake_1.css'), deps: {}, source: '.a{}' },
      { id: '/b', file: '/b', deps: {}, source: '.b{}' },
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
