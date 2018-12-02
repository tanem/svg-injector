'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/svg-injector.production.min.js')
} else {
  module.exports = require('./cjs/svg-injector.development.js')
}
