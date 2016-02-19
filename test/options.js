var test = require('tap').test
var Deps = require('..')
var path = require('path')
var concat = require('concat-stream')

test('cache', function(t) {
  var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'cache')
  t.plan(1)
  var cache = {}
  cache[fixtures('./a')] = { source: 'a{}', deps: { './b': fixtures('./b') } }
  cache[fixtures('./b')] = { source: 'b{}', deps: {} }
  var stream = Deps({
    basedir: fixtures(),
    resolve: function (file) {
      return fixtures(file)
    },
    cache: cache,
  })
  stream.write({ file: './a' })
  stream.end({ file: './b' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(rows.sort(cmp), [
      {
        id: fixtures('a'),
        file: fixtures('a'),
        deps: { './b': fixtures('b') },
        source: 'a{}',
      },
      {
        id: fixtures('b'),
        file: fixtures('b'),
        deps: {},
        source: 'b{}',
      },
    ].sort(cmp))
  }))
  function cmp(a, b) {
    return a.id < b.id ? -1 : 1
  }
})

test('dependenciesFilter', function(tt) {
  tt.test('options', function(t) {
    t.plan(1)
    var stream = Deps({
      dependenciesFilter: function (deps, from) {
        return from === '/a' ? ['/b'] : []
      },
    })
    stream.write({ file: '/a', source: 'a{}' })
    stream.end({ file: '/b', source: 'b{}' })
    stream.pipe(concat({ encoding: 'object' }, function (rows) {
      t.same(rows, [
        { id: '/b', file: '/b', deps: {}, source: 'b{}' },
        { id: '/a', file: '/a', deps: { '/b': '/b' }, source: 'a{}' },
      ])
    }))
  })

  tt.test('inputs', function(t) {
    t.plan(1)
    var stream = Deps()
    stream.write({ file: '/a', source: 'a{}' })
    stream.write({ dependenciesFilter: '/a', deps: '/b' })
    stream.end({ file: '/b', source: 'b{}' })
    stream.pipe(concat({ encoding: 'object' }, function (rows) {
      t.same(rows, [
        { id: '/b', file: '/b', deps: {}, source: 'b{}' },
        { id: '/a', file: '/a', deps: { '/b': '/b' }, source: 'a{}' },
      ])
    }))
  })

  tt.end()
})

test('fileCache', function(t) {
  t.plan(1)
  var stream = Deps({
    resolve: function (file) {
      return Promise.resolve(file)
    },
    fileCache: {
      '/a': 'a{}',
      '/b': 'b{}',
    },
  })
  stream.write({ file: '/a' })
  stream.end({ file: '/b' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(rows, [
      { id: '/a', file: '/a', deps: {}, source: 'a{}' },
      { id: '/b', file: '/b', deps: {}, source: 'b{}' },
    ])
  }))
})

test('noParse', function(t) {
  t.plan(1)
  var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'source')
  var stream = Deps({
    basedir: fixtures(),
    noParse: ['**/*.css', '!**/f.css'],
  })
  stream.write({ file: './a.css', noParse: true, source: '.a{}' })
  stream.write({ file: './b.css', source: '@deps "nonexist";.b{}' })
  stream.write({ file: './c.css', source: '@deps "nonexist";.c{}' })
  stream.write({ file: './d.css', source: '@deps "nonexist";.d{}' })
  stream.write({ file: './e.css', source: '@deps "nonexist";.e{}' })
  stream.end({ file: './f.css', source: '.f{}' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(sort(rows), sort([
      { id: fixtures('a.css'), file: fixtures('a.css'), noParse: true, deps: {}, source: '.a{}' },
      { id: fixtures('b.css'), file: fixtures('b.css'), deps: {}, source: '@deps "nonexist";.b{}' },
      { id: fixtures('c.css'), file: fixtures('c.css'), deps: {}, source: '@deps "nonexist";.c{}' },
      { id: fixtures('d.css'), file: fixtures('d.css'), deps: {}, source: '@deps "nonexist";.d{}' },
      { id: fixtures('e.css'), file: fixtures('e.css'), deps: {}, source: '@deps "nonexist";.e{}' },
      { id: fixtures('f.css'), file: fixtures('f.css'), deps: {}, source: '.f{}' },
    ]))
  }))
})

test('readFile', function(t) {
  t.plan(1)
  var stream = Deps({
    readFile: function (file) {
      return path.basename(file) + '{}'
    },
  })
  stream.write({ file: '/a' })
  stream.end({ file: '/b' })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(rows, [
      { id: '/a', file: '/a', deps: {}, source: 'a{}' },
      { id: '/b', file: '/b', deps: {}, source: 'b{}' },
    ])
  }))
})

test('atRuleName', function(t) {
  t.plan(1)

  var stream = Deps({
    atRuleName: 'external',
    fileCache: { '/b.css': 'b{}' },
    resolve: function (file, parent) {
      return path.resolve(parent.basedir, file)
    },
  })
  stream.end({
    file: '/a.css',
    source: '@external "./b.css";a{}',
  })
  stream.pipe(concat({ encoding: 'object' }, function (rows) {
    t.same(
      sort(rows),
      sort([
        {
          id: '/a.css',
          file: '/a.css',
          deps: { './b.css': '/b.css' },
          source: 'a{}',
        },
        {
          id: '/b.css',
          file: '/b.css',
          deps: {},
          source: 'b{}',
        },
      ])
    )
  }))
})

test('resolve', function(tt) {
  tt.test('default', function(t) {
    t.plan(1)
    var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'resolve')
    var stream = Deps({
      basedir: fixtures(),
    })
    stream.end({ file: './a.css' })
    stream.pipe(concat({ encoding: 'object' }, function (rows) {
      t.same(
        sort(rows),
        sort([
          {
            id: fixtures('a.css'),
            file: fixtures('a.css'),
            deps: { './b': fixtures('b.css') },
            source: 'a{}\n',
          },
          {
            id: fixtures('b.css'),
            file: fixtures('b.css'),
            deps: {},
            source: 'b{}\n',
          },
        ])
      )
    }))
  })

  tt.test('custom', function(t) {
    t.plan(1)
    var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'custom-resolve')
    var stream = Deps({
      basedir: fixtures(),
      resolve: { extensions: '.scss' },
    })
    stream.end({ file: './a.scss' })
    stream.pipe(concat({ encoding: 'object' }, function (rows) {
      t.same(
        sort(rows),
        sort([
          {
            id: fixtures('a.scss'),
            file: fixtures('a.scss'),
            deps: { './b': fixtures('b.scss') },
            source: 'a{}\n',
          },
          {
            id: fixtures('b.scss'),
            file: fixtures('b.scss'),
            deps: {},
            source: 'b{}\n',
          },
        ]),
        'custom'
      )
    }))
  })

  tt.end()
})

test('transform', function(tt) {
  var atImport = require('postcss-simple-import')
  var vars = require('postcss-advanced-variables')
  var url = require('postcss-custom-url')
  var postcss = require('postcss')
  var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'transform')

  tt.test('from option', function(t) {
    t.plan(1)
    var stream = Deps({
      basedir: fixtures(),
      transform: transform,
    })
    stream.write({ file: './import-url.css' })
    stream.end({ file: './import-and-deps.css' })
    run(stream, t)
  })

  tt.test('from stream', function(t) {
    t.plan(1)
    var stream = Deps({
      basedir: fixtures(),
    })
    stream.write({ transform: transform })
    stream.write({ file: './import-url.css' })
    stream.end({ file: './import-and-deps.css' })
    run(stream, t)
  })

  tt.end()

  function transform(result) {
    var p = postcss([
      atImport(),
      url(),
      vars(),
    ])
    return p.process(result.css, { from: result.from, to: result.from })
      .then(function (res) {
        result.css = res.css
      })
  }

  function run(stream, t) {
    stream.pipe(concat({ encoding: 'object' }, function (rows) {
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
    }))
  }
})

test('processor', function(tt) {
  var atImport = require('postcss-simple-import')()
  var vars = require('postcss-advanced-variables')()
  var url = require('postcss-custom-url')()

  var fixtures = path.resolve.bind(path, __dirname, 'fixtures', 'transform')

  tt.test('from option', function(t) {
    t.plan(1)
    var stream = Deps({
      basedir: fixtures(),
      processor: [atImport, url, vars],
    })
    stream.end({ file: './import-and-deps.css' })
    run(stream, t)
  })

  tt.test('from stream', function(t) {
    t.plan(1)
    var stream = Deps({
      basedir: fixtures(),
    })
    stream.write({ processor: atImport })
    stream.write({ processor: url })
    stream.write({ processor: vars })
    stream.end({ file: './import-and-deps.css' })
    run(stream, t)
  })

  tt.end()

  function run(stream, t) {
    stream.pipe(concat({ encoding: 'object' }, function (rows) {
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
    }))
  }
})

function sort(rows) {
  rows.sort(function (a, b) {
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

