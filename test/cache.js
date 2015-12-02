var test = require('tap').test
var Deps = require('..')
var path = require('path')
var concat = require('concat-stream')

var fixtures = path.resolve.bind(path, __dirname)

test('cache', function(t) {
  t.plan(1)
  var cache = {}
  cache[fixtures('./a')] = { source: 'a{}', deps: { './b': fixtures('./b') } }
  cache[fixtures('./b')] = { source: 'b{}', deps: {} }
  var stream = Deps({
    basedir: fixtures(),
    resolve: function (file) {
      return Promise.resolve(fixtures(file))
    },
    cache: cache,
  })
  stream.write({ file: './a' })
  stream.end({ file: './b' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(rows.sort(cmp), [
      { id: fixtures('a'), file: fixtures('a'), deps: { './b': fixtures('b') }, source: 'a{}' },
      { id: fixtures('b'), file: fixtures('b'), deps: {}, source: 'b{}' },
    ].sort(cmp))
  }))
})

test('fileCache', function(t) {
  t.plan(1)
  var stream = Deps({
    resolve: function (file) {
      return Promise.resolve(file)
    },
    fileCache: {
      '/a': 'a{}',
      '/b': 'b{}',
    },
  })
  stream.write({ file: '/a' })
  stream.end({ file: '/b' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(rows, [
      { id: '/a', file: '/a', deps: {}, source: 'a{}' },
      { id: '/b', file: '/b', deps: {}, source: 'b{}' },
    ])
  }))
})

function cmp(a, b) {
  return a.id < b.id ? -1 : 1
}
