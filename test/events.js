var test = require('tap').test
var Deps = require('..')
var path = require('path')
var concat = require('concat-stream')

test('file', function(t) {
  t.plan(1)

  var files = []
  var stream = Deps({
    resolve: function (file, parent) {
      return path.resolve(parent.basedir, file)
    },
    readFile: function (file) {
      return path.basename(file) + '{}'
    },
  })
  .on('file', function (file) {
    files.push(file)
  })
  stream.write({ file: '/a', source: '@deps "./c";a{}' })
  stream.end({ file: '/b' })

  stream.pipe(concat({ encoding: 'object' }, function () {
    t.same(files, ['/b', '/c'])
  }))
})

test('transform', function(t) {
  t.plan(3)

  var stream = Deps({
    resolve: function (file, parent) {
      return path.resolve(parent.basedir, file)
    },
    readFile: function (file) {
      return path.basename(file) + '{}'
    },
  })
  .on('transform', function (result, file) {
    t.equal(result.from, file)
  })
  stream.write({ file: '/a', source: '@deps "./c";a{}' })
  stream.end({ file: '/b' })

  stream.pipe(concat({ encoding: 'object' }, function () {}))
})

test('error', function(t) {
  t.plan(1)
  var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'source')
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

