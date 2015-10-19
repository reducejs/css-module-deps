import test from 'tape'
import Result from '../lib/result'
import postcss from 'postcss'

test('result', function(t) {
  let row = {
    source: '.a{} @import "c";',
    from: __dirname + '/fake.css',
  }
  let res = new Result(row)
  t.equal(res.css, row.source)
  t.same(res._root, null)

  let newSrc = '.b{} @import "c";'
  res.css = newSrc

  t.equal(
    postcss().process(res.root, { from: row.file }).css,
    newSrc
  )

  res.root.walkAtRules('import', (rule) => {
    rule.remove()
  })

  t.equal(res.css, '.b{}')

  t.end()
})

