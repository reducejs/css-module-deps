import test from 'tape'
import Depsify from '../lib/main'
import sink from 'sink-transform'
import path from 'path'

var fixtures = path.resolve.bind(path, __dirname)

test('cache', function(t) {
  let stream = new Depsify({
    basedir: fixtures(),
    resolve: (file) => {
      return Promise.resolve(fixtures(file))
    },
    cache: {
      [ fixtures('./a') ]: { source: 'a{}', deps: { './b': fixtures('./b') } },
      [ fixtures('./b') ]: { source: 'b{}', deps: {} },
    },
  })
  stream.write({ file: './a' })
  stream.end({ file: './b' })
  return stream.pipe(sink.obj((rows, done) => {
    t.same(rows.sort(cmp), [
      { id: fixtures('a'), file: fixtures('a'), deps: { './b': fixtures('b') }, source: 'a{}' },
      { id: fixtures('b'), file: fixtures('b'), deps: {}, source: 'b{}' },
    ].sort(cmp))
    done()
  }))
})

function cmp(a, b) {
  return a.id < b.id ? -1 : 1
}
