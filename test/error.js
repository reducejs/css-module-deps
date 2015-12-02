var test = require('tap').test
var Deps = require('..')
var path = require('path')
var concat = require('concat-stream')

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'source')

test('file not found', function(t) {
  t.plan(1)
  var stream = Deps({
    basedir: fixtures(),
  })
  .on('error', function (err) {
    t.ok(err instanceof Error)
  })
  // No file
  stream.write({ id: 'A', source: '@deps "./b";.a{}' })
  stream.end({ file: '/b', source: '.b{}' })
  stream.pipe(concat({ encoding: 'object' }, function () { }))
})

