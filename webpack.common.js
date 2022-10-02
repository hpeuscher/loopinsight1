import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { VueLoaderPlugin } from 'vue-loader';
import HtmlWebpackPlugin from'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import MomentTimezoneDataPlugin from 'moment-timezone-data-webpack-plugin';
import MomentLocalesPlugin from 'moment-locales-webpack-plugin';
import FindLocalModules from './src/FindLocalModules.js'

export default {
  entry: {
	  index: './src/frontend/LoopInsighT1.js',
	  model: './src/frontend/ModelStructure.js',
	  minimalGui: './src/frontend/MinimalGui.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    chunkFilename: '[name].bundle.js'
  },
  module: {
    rules: [
      { test: /\.vue$/, use: 'vue-loader' },
      { test: /\.css$/, use: [ 'style-loader', 'css-loader' ] },
      { test: /\.html$/, use: ['html-loader'] },
      {
        resourceQuery: /blockType=i18n/,
        type: 'javascript/auto',
        loader: '@intlify/vue-i18n-loader'
      },
      {
        resourceQuery: /blockType=svg/,
        type: 'javascript/auto',
        loader: './src/svg-loader.cjs'
      }
    ],
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
      __LT1_LOCAL_MODELS__: JSON.stringify(await FindLocalModules('./core/models')),
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
    }),
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './src/frontend/assets/index.htm',
      favicon: './src/frontend/assets/images/favicon.png', 
	    filename: 'index.html',
	    chunks: ["index"],
    }),
    new HtmlWebpackPlugin({
      template: './src/frontend/assets/model.htm',
      //templateContent: '<input type="hidden" id="model" value="UvaPadova"/><div id="app"></div>',
      favicon: './src/frontend/assets/images/favicon.png', 
	    filename: 'model.html',
	    chunks: ["model"],
    }),
    new HtmlWebpackPlugin({
      template: './src/frontend/assets/minimalGui.htm',
      favicon: './src/frontend/assets/images/favicon.png',
	    filename: 'minimalGui.html',
	    chunks: ["minimalGui"],
    }),
  	new CopyWebpackPlugin({'patterns': [
        {from:'./src/frontend/assets/images', to:'images'}
    ]}),
    new MomentTimezoneDataPlugin({
      matchZones: ['Etc/UTC'],
    }),
    new MomentLocalesPlugin(),
  ],
};
