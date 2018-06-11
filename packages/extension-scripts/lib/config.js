const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const GenerateJsonPlugin = require('generate-json-webpack-plugin')

const OUTPUT_FOLDER = 'public'

const findDir = dir => path.resolve(dir)

const config = {
  output: {
    path: findDir(OUTPUT_FOLDER),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            presets: [require('@babel/preset-react').default],
            plugins: [
              require('@babel/plugin-proposal-class-properties').default,
              require('@babel/plugin-proposal-object-rest-spread').default,
              require('@babel/plugin-transform-destructuring').default,
              require('@babel/plugin-syntax-dynamic-import').default,
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(OUTPUT_FOLDER, {
      root: process.cwd(),
    }),
    new CopyWebpackPlugin([{ from: 'src/static', to: 'static' }], {}),
  ],
}

const getFilePath = file => findDir(path.resolve('./src', file))

const withoutExt = file => {
  return file
    .split('.')
    .slice(0, -1)
    .join('.')
}

let manifest

if (fs.existsSync(getFilePath('manifest.json'))) {
  manifest = require(getFilePath('manifest.json'))
} else if (fs.existsSync(getFilePath('manifest.js'))) {
  manifest = require(getFilePath('manifest.js'))
} else {
  throw new Error('Please provide manifest.json or js file')
}

config.plugins.push(new GenerateJsonPlugin('manifest.json', manifest))

// Add entries
config.entry = {}

// Background scripts
manifest.background.scripts.forEach(script => {
  config.entry[withoutExt(script)] = getFilePath(script)
})

const checkHtml = html => {
  const base = withoutExt(html)
  const js = getFilePath(base + '.js')
  const index = getFilePath(base + '/index.js')

  if (fs.existsSync(getFilePath(html))) {
  } else if (fs.existsSync(js)) {
    config.entry[base] = js
    config.plugins.push(
      new HtmlWebpackPlugin({
        title: manifest.name,
        filename: html,
        chunks: [base],
      }),
    )
  } else if (fs.existsSync(index)) {
    config.entry[base] = index
    config.plugins.push(
      new HtmlWebpackPlugin({
        title: manifest.name,
        filename: html,
        chunks: [base],
      }),
    )
  } else {
    throw new Error(`Please provide ${html}, ${js} or ${index}`)
  }
}

// BrowserAction popup
if (manifest.browser_action && manifest.browser_action.default_popup) {
  checkHtml(manifest.browser_action.default_popup)
}

// Options page
if (manifest.options_ui && manifest.options_ui.page) {
  checkHtml(manifest.options_ui.page)
}

module.exports = config
