const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
let config = require('./config')

config.mode = 'development'
config.watch = true
config.devtool = 'cheap-source-map'

try {
  const override = require(path.resolve('./build/dev.js'))
  config = override(config)
} catch (err) {
  console.error(err)
  console.log('No custom config')
}

webpack(config, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err)
    console.log(stats.toString())
  }
  // Done processing
})
