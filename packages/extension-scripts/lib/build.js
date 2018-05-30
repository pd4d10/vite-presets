const path = require('path')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const config = require('./config')

config.mode = 'production'
config.watch = false
config.devtool = false
config.plugins.push(new BundleAnalyzerPlugin())

webpack(config, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err)
  }
  // Done processing
})
