import test from 'tape'
import Depsify from '../lib/main'
import sink from 'sink-transform'
import path from 'path'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'source')

test('noParse', function(t) {
  let stream = new Depsify({
    basedir: fixtures(),
    noParse: [
      './b.css',
      function (file) {
        return path.basename(file, '.css') === 'c'
      },
      /[de]\.css$/,
      10,
    ],
  })
  stream.write({ file: './a.css', noParse: true, source: '.a{}' })
  stream.write({ file: './b.css', source: '@deps "nonexist";.b{}' })
  stream.write({ file: './c.css', source: '@deps "nonexist";.c{}' })
  stream.write({ file: './d.css', source: '@deps "nonexist";.d{}' })
  stream.write({ file: './e.css', source: '@deps "nonexist";.e{}' })
  stream.end({ file: './f.css', source: '.f{}' })
  return stream.pipe(sink.obj((rows, done) => {
    t.same(sort(rows), sort([
      { id: fixtures('a.css'), file: fixtures('a.css'), noParse: true, deps: {}, source: '.a{}' },
      { id: fixtures('b.css'), file: fixtures('b.css'), deps: {}, source: '@deps "nonexist";.b{}' },
      { id: fixtures('c.css'), file: fixtures('c.css'), deps: {}, source: '@deps "nonexist";.c{}' },
      { id: fixtures('d.css'), file: fixtures('d.css'), deps: {}, source: '@deps "nonexist";.d{}' },
      { id: fixtures('e.css'), file: fixtures('e.css'), deps: {}, source: '@deps "nonexist";.e{}' },
      { id: fixtures('f.css'), file: fixtures('f.css'), deps: {}, source: '.f{}' },
    ]))
    done()
  }))
})

function sort(rows) {
  rows.sort((a, b) => {
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
