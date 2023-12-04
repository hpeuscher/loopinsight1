import CopyWebpackPlugin from 'copy-webpack-plugin'
import path from 'path'
import { fileURLToPath } from 'url'
import { VueLoaderPlugin } from 'vue-loader'
import webpack from 'webpack'
import FindLocalModules, { findLocalJson } from './util/FindLocalModules.js'
import {entryConfig, HtmlPlugins} from './util/createWebpackEntryPoints.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  entry: entryConfig,
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    chunkFilename: '[name].bundle.js'
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    extensionAlias: {
      '.js': ['.js', '.ts', '.tsx']
    },
    alias: {
        'vue$': 'vue/dist/vue.esm-browser.js',
        'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js',
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: "tsconfig.json",
            appendTsSuffixTo: [/\.vue$/]
          },
        }],
        exclude: /node_modules/
      },
      { test: /\.vue$/, use: 'vue-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.html$/, use: ['html-loader'] },
      { test: /\.(png|jpg|gif)$/, use: ['file-loader?name=assets/[name].[ext]'] },
      {
        resourceQuery: /blockType=i18n/,
        type: 'javascript/auto',
        loader: '@intlify/vue-i18n-loader'
      },
      {
        resourceQuery: /blockType=svg/,
        type: 'javascript/auto',
        loader: './util/svg-loader.cjs'
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        defaultVendors: false,
      },
    },
  },
  plugins: [
    new webpack.DefinePlugin({
        __LT1_LOCAL_MODELS__: JSON.stringify(
            await FindLocalModules('./src/core/models')
        ),
        __LT1_LOCAL_ACTUATORS__: JSON.stringify(
            await FindLocalModules('./src/core/actuators')
        ),
        __LT1_LOCAL_ACTUATOR_DEVICES__: JSON.stringify(
            await findLocalJson('./src/core/actuators/devices')
        ),
        __LT1_LOCAL_SENSORS__: JSON.stringify(
            await FindLocalModules('./src/core/sensors')
        ),
        __LT1_LOCAL_SENSOR_DEVICES__: JSON.stringify(
            await findLocalJson('./src/core/sensors/devices')
        ),
        __VUE_OPTIONS_API__: false,
        __VUE_PROD_DEVTOOLS__: false
    }),
    new webpack.ProvidePlugin({
        process: 'process/browser.js',
    }),
    new VueLoaderPlugin(),
    ...HtmlPlugins,
    new CopyWebpackPlugin({
      'patterns': [
        { from: './src/frontend/assets/images', to: 'images' },
        { from: './src/frontend/assets/styles', to: 'styles' }
      ]
    }),
  ],
};
