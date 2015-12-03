var promisify = require('node-promisify')
var fs = require('fs')

module.exports = promisify(fs.readFile)

