import { merge } from 'webpack-merge'
import common from './webpack.common.js'
import webpack from 'webpack'

export default merge(common, <webpack.Configuration>{
    mode: 'production',
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm-browser.prod.js',
        },
      },
});
