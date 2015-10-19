import test from 'tape'
import Depsify from '../lib/main'
import sink from 'sink-transform'
import path from 'path'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'resolve')

test('resolve', function(t) {
  let stream = new Depsify({
    basedir: fixtures(),
  })
  stream.end({ file: './a' })
  return stream.pipe(sink.obj((rows, done) => {
    t.same(sort(rows), sort([
      { file: fixtures('a.css'), deps: { './b': fixtures('b.css') }, source: 'a{}\n' },
      { file: fixtures('b.css'), deps: {}, source: 'b{}\n' },
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
