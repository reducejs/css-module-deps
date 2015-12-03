var test = require('tap').test
var State = require('../lib/state')

test('then', function(tt) {

  tt.test('fulfilled', function(t) {
    t.plan(2)

    var state = new State(function () {
      this.results.push(1)
      return Promise.resolve()
    })

    state.then(function (res) {
      t.same(res, [1])
    })

    state.then(function (res) {
      t.equal(res, state.results)
    })
  })

  tt.test('rejected', function(t) {
    t.plan(1)

    var state = new State(function () {
      return Promise.reject('NULL')
    })

    state.then(null, function (err) {
      t.equal(err, 'NULL')
    })
  })

  tt.end()

})

test('catch', function(tt) {

  tt.test('fulfilled', function(t) {
    t.plan(1)

    var state = new State(function () {
      this.results.push(1)
      return Promise.resolve()
    })

    state.catch(function (res) {
      t.equal(res, state.results)
    }).then(function (res) {
      t.same(res, [1])
    })

  })

  tt.test('rejected', function(t) {
    t.plan(1)

    var state = new State(function () {
      return Promise.reject('NULL')
    })

    state.then(function () {
      t.ok(false)
    }).catch(function (err) {
      t.equal(err, 'NULL')
    })

  })

  tt.end()
})

