var test = require('tap').test
var Deps = require('..')
var path = require('path')
var concat = require('concat-stream')

test('readFile', function(t) {
  t.plan(1)
  var stream = Deps({
    resolve: function (file) {
      return Promise.resolve(file)
    },
    readFile: function (file) {
      return Promise.resolve(path.basename(file) + '{}')
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

