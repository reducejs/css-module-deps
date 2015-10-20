import test from 'tape'
import Depsify from '../lib/main'
import sink from 'sink-transform'
import path from 'path'
import atImport from 'postcss-import'
import vars from 'postcss-advanced-variables'
import url from 'postcss-url'
import postcss from 'postcss'

var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'processor')

test('processor', function(t) {
  let processor = postcss([
    atImport(),
    url(),
    vars(),
  ])
  let stream = new Depsify({
    basedir: fixtures(),
    processor: (result) => {
      return processor.process(result.css, { from: result.from, to: result.from })
        .then((res) => {
          result.css = res.css
        })
    },
  })
  stream.write({ file: './import-url.css' })
  stream.end({ file: './import-and-deps.css' })
  return stream.pipe(sink.obj((rows, done) => {
    t.same(sort(rows), sort([
      {
        deps: {
          './import-url': fixtures('import-url.css'),
        },
        file: fixtures('import-and-deps.css'),
        id: fixtures('import-and-deps.css'),
        source: '.import-and-deps {\n  color: #FF0000;\n}\n\n',
      },
      {
        deps: {},
        file: fixtures('import-url.css'),
        id: fixtures('import-url.css'),
        source: '.dialog {\n  background: url(node_modules/sprites/dialog/sp-dialog.png)\n}\n.importUrl{}\n\n',
      },
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
