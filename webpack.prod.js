import { merge } from 'webpack-merge'
import common from './webpack.common.js'

export default merge(common, {
    mode: 'production',
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm-browser.prod.js',
        },
      },
});
