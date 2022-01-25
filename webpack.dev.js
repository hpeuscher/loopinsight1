import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { merge } from 'webpack-merge';
import common from './webpack.common.js';

export default merge(common, {
	mode: 'development',
	devtool: 'inline-source-map',
	devServer: {
  		static: {
			directory: path.resolve(__dirname, 'dist'),
		},
		compress: true,
		port: 8080,
	}, 
	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.esm-browser.js',
			'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js',
		},
	},
 });