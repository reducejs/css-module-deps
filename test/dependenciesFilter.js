var test = require('tap').test
var Deps = require('..')
var concat = require('concat-stream')

test('dependenciesFilter', function(t) {
  t.plan(1)
  var stream = Deps({
    dependenciesFilter: function (deps, from) {
      return from === '/a' ? ['/b'] : []
    },
  })
  stream.write({ file: '/a', source: 'a{}' })
  stream.end({ file: '/b', source: 'b{}' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(rows, [
      { id: '/b', file: '/b', deps: {}, source: 'b{}' },
      { id: '/a', file: '/a', deps: { '/b': '/b' }, source: 'a{}' },
    ])
  }))
})

