import test from 'tape'
import Depsify from '../lib/main'
import sink from 'sink-transform'
import path from 'path'

test('readFile', function(t) {
  let stream = new Depsify({
    resolve: (file) => {
      return Promise.resolve(file)
    },
    readFile: (file) => {
      return Promise.resolve(path.basename(file) + '{}')
    },
  })
  stream.write({ file: '/a' })
  stream.end({ file: '/b' })
  return stream.pipe(sink.obj((rows, done) => {
    t.same(rows, [
      { id: '/a', file: '/a', deps: {}, source: 'a{}' },
      { id: '/b', file: '/b', deps: {}, source: 'b{}' },
    ])
    done()
  }))
})
