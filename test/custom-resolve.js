import test from 'tape'
import Depsify from '../lib/main'
import sink from 'sink-transform'
import path from 'path'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'custom-resolve')

test('custom resolve', function(t) {
  let stream = new Depsify({
    basedir: fixtures(),
    resolve: { extensions: '.scss' },
  })
  stream.end({ file: './a' })
  return stream.pipe(sink.obj((rows, done) => {
    t.same(sort(rows), sort([
      { id: fixtures('a.scss'), file: fixtures('a.scss'), deps: { './b': fixtures('b.scss') }, source: 'a{}\n' },
      { id: fixtures('b.scss'), file: fixtures('b.scss'), deps: {}, source: 'b{}\n' },
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
