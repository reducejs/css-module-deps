var inherits = require('util').inherits
var EventEmitter = require('events')

inherits(State, EventEmitter)

module.exports = State

function State(initiator) {
  this.visited = {}
  this.results = []
  this.initiator = initiator
}

State.prototype.then = function(onFulfilled, onRejected) {
  return this.process().then(onFulfilled, onRejected)
}

State.prototype.catch = function(onRejected) {
  return this.process().catch(onRejected)
}

State.prototype.process = function() {
  var self = this
  if (!this.processed) {
    this.processed = this.initiator()
      .then(function () { return self.results })
  }

  return this.processed
}

