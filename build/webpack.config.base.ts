import path from 'path'
import webpack, { Configuration } from 'webpack'

import WebpackBar from 'webpackbar'
import TerserPlugin from 'terser-webpack-plugin'
import devConfig from './dev.config'

const { env } = devConfig
const { NODE_ENV, BUILD_ENV = 'dev' } = process.env
const ENV_CONFIG = env[BUILD_ENV]
// console.log(process.env)
const webpackConfig: Configuration = {
  mode: NODE_ENV as 'development' | 'production',

  node: {
    __dirname: true,
    __filename: false,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../app'),
      '@root': path.resolve(__dirname, '../'),
    },
    extensions: ['.ts', '.tsx', '.js'],
  },
  externals: {
    // nodegit: 'commonjs2 nodegit',
    sqlite3: 'commonjs2 sqlite3',
    electronUpdater: 'commonjs2 electron-updater',
  },
  plugins: [
    new webpack.DefinePlugin(
      ((): { [key: string]: any } => {
        const defines = {}
        const variables = Object.assign({}, ENV_CONFIG.variables)
        Object.keys(variables).forEach(key => {
          const val = variables[key]
          defines[`process.env.${key}`] = typeof val === 'string' ? `"${val}"` : JSON.stringify(val)
        })
        defines['$mainApi'] = 'global.__$mainApi'
        defines['$api'] = 'global.__$api'
        defines['$netApi'] = 'global.__$netApi'
        defines['$tools'] = 'global.__$tools'
        defines['$store'] = 'global.__$store'
        defines['$xmpp'] = 'global.__$xmpp'
        defines['$websocket'] = 'global.__$websocket'
        defines['$jsMind'] = 'global.__$jsMind'
        defines['$intl'] = 'global.__$intl'
        return defines
      })()
    ),
    new WebpackBar(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
  ] as webpack.Plugin[],
}

if (NODE_ENV === 'development') {
  webpackConfig.devtool = 'source-map'
} else if (NODE_ENV === 'production') {
  webpackConfig.devtool = 'source-map'
  webpackConfig.optimization?.minimizer?.push(
    // https://github.com/terser-js/terser
    new TerserPlugin({
      terserOptions: {
        compress: {
          warnings: true,
          /* eslint-disable */
          drop_console: true,
        },
      },
    })
  )
}

export default webpackConfig
