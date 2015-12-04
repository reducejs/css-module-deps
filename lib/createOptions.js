var mix = require('mixy')

var defaultOptions = {
  basedir: process.cwd(),
  cache: {},
  fileCache: {},
  atRuleName: 'external',
  transform: [],
  processor: [],

  readFile: require('./readFile'),
  resolve: require('./resolver').style,
  dependenciesFilter: function (x) {
    return x
  },
}

module.exports = function (opts) {
  return mix(Object.create(defaultOptions), opts)
}

