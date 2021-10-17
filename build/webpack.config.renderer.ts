import path from 'path'
import webpack, { Configuration } from 'webpack'

import htmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import tsImportPluginFactory from 'ts-import-plugin'

import webpackConfigBase from './webpack.config.base'
import devConfig from './dev.config'

const { dist, template, rendererSource: appPath } = devConfig
const { NODE_ENV } = process.env

const styleLoader: any = [{ loader: 'css-loader' }]

//本地和线上包统一样式
styleLoader.unshift({
  loader: MiniCssExtractPlugin.loader,
})

const webpackConfig: Configuration = {
  ...webpackConfigBase,
  target: 'electron-renderer',

  entry: {
    renderer: path.resolve(appPath, 'index.tsx'),
  },

  output: {
    path: path.join(dist, 'renderer'),
    filename: '[name].js',
    chunkFilename: '[name].js',
  },

  module: {
    rules: [
      {
        // 这样可以使用ES6的语法，引入js
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'babel-loader',
            // options: {
            //   presets: ["es2015", "stage-0"],
            //   plugins: ["transform-runtime"],
            // },
            options: {
              presets: [
                '@babel/preset-env', //使用这个预设，会根据浏览器来选择插件转化ES5
                '@babel/preset-react',
              ],
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /(?<!\.d)\.tsx?$/,
        loader: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              getCustomTransformers: () => ({
                before: [tsImportPluginFactory(/** options */)],
              }),
              compilerOptions: {
                module: 'es2015',
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.(sass|scss)$/,
        use: [
          ...styleLoader,
          {
            loader: 'sass-loader',
          },
        ],
      },
      {
        test: /\.(less)$/,
        use: [
          ...styleLoader,
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: styleLoader,
      },
      {
        test: /\.(png|jpe?g|gif|svg|swf|woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'file-loader',
        query: {
          name: '[name].[ext]',
        },
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      },
    ],
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'bundle',
    },
    minimizer: [],
  },

  plugins: [
    ...(webpackConfigBase?.plugins ?? []),
    new htmlWebpackPlugin({
      template: template,
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
      ignoreOrder: true,
    }),
  ] as webpack.Plugin[],
}

if (NODE_ENV === 'development') {
  webpackConfig.plugins?.push(new webpack.HotModuleReplacementPlugin(), new webpack.NoEmitOnErrorsPlugin())
} else if (NODE_ENV === 'production') {
  // @ts-ignore
  webpackConfig.plugins?.push(new OptimizeCSSAssetsPlugin())
}

export default webpackConfig
