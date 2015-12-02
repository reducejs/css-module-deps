var test = require('tap').test
var Result = require('../lib/result')
var postcss = require('postcss')

test('result', function(t) {
  var row = {
    source: '.a{} @import "c";',
    from: __dirname + '/fake.css',
  }
  var res = new Result(row)
  t.equal(res.css, row.source)
  t.same(res._root, null)

  var newSrc = '.b{} @import "c";'
  res.css = newSrc

  t.equal(
    postcss().process(res.root, { from: row.file }).css,
    newSrc
  )

  res.root.walkAtRules('import', function (rule) {
    rule.remove()
  })

  t.equal(res.css, '.b{}')

  res.root = postcss.parse('a{}')
  t.equal(res.css, 'a{}')

  t.end()
})

