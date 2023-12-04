import path from 'path'
import { fileURLToPath } from 'url'
import { merge } from 'webpack-merge'
import common from './webpack.common.js'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default merge(common, {
    mode: 'development',
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'dist'),
        },
        compress: true,
        port: 8080,
    },
    devtool: 'inline-source-map',
})
