const path = require('path')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
let config = require('./config')

config.mode = 'production'
config.watch = false
config.devtool = false
config.plugins.push(new BundleAnalyzerPlugin())

try {
  config = require(path.resolve('./build/prod.js'))(config)
} catch (err) {
  console.log('No custom config')
}

webpack(config, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err)
    console.log(stats.toString())
  }
  // Done processing
})
