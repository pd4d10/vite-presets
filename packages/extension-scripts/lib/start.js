const path = require('path')
const webpack = require('webpack')
const config = require('./config')

config.mode = 'development'
config.watch = true
config.devtool = 'cheap-source-map'

webpack(config, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err, stats.toString())
  }
  // Done processing
})
