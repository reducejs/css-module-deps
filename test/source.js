import test from 'tape'
import Depsify from '../lib/main'
import sink from 'sink-transform'
import path from 'path'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'source')

test('source', function(t) {
  let stream = new Depsify({
    basedir: fixtures(),
  })
  stream.write({ file: './a.css', source: '.a{}' })
  stream.end({ file: './b.css', source: '.b{}' })
  return stream.pipe(sink.obj((rows, done) => {
    t.same(sort(rows), sort([
      { id: fixtures('a.css'), file: fixtures('a.css'), deps: {}, source: '.a{}' },
      { id: fixtures('b.css'), file: fixtures('b.css'), deps: {}, source: '.b{}' },
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
