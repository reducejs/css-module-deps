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
  t.plan(1)
  let stream = new Depsify({
    basedir: fixtures(),
    processor,
  })
  stream.write({ file: './import-url.css' })
  stream.end({ file: './import-and-deps.css' })
  run(stream, t)
})

test('processor, from stream', function(t) {
  t.plan(1)
  let stream = new Depsify({
    basedir: fixtures(),
  })
  stream.write({ processor })
  stream.write({ file: './import-url.css' })
  stream.end({ file: './import-and-deps.css' })
  run(stream, t)
})

test('processor, with arguments', function(t) {
  t.plan(3)
  let stream = new Depsify({
    basedir: fixtures(),
    processor: [[function (result, a, b) {
      t.same([a, b], [1, 2])
      return processor(result)
    }, 1, 2]],
  })
  stream.write({ file: './import-url.css' })
  stream.end({ file: './import-and-deps.css' })
  run(stream, t)
})

function processor(result) {
  let p = postcss([
    atImport(),
    url(),
    vars(),
  ])
  return p.process(result.css, { from: result.from, to: result.from })
    .then((res) => {
      result.css = res.css
    })
}

function run(stream, t) {
  stream.pipe(sink.obj((rows, done) => {
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
}

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
