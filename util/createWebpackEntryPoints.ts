/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


import { findFiles } from './FindLocalModules.js'
import HtmlWebpackPlugin from 'html-webpack-plugin'

// find all files in the /entries folder
const entryNames = await findFiles('./src/frontend/entries/')

const entryConfig = Object.fromEntries(entryNames.map(
    (entry) => [ entry.replace(/\.[^.]*$/, ''), './src/frontend/entries/'+entry]))

// for each entry point, create one webpack HTML plugin
const HtmlPlugins = entryNames.map( function(entry: string) {
    entry = entry.replace(/\.[^.]*$/, '')

    return new HtmlWebpackPlugin({
        template: './src/frontend/assets/template.ejs',
        templateParameters: {
            // the id of the div element in the template is renamed
            // so that app.mount can find it
            appid: entry
        },
        favicon: './src/frontend/assets/images/favicon.png',
        filename: entry + '.html',
        chunks: [entry],
    })
})

// add an index file that is shown by localhost entry
HtmlPlugins.push(new HtmlWebpackPlugin({
    template: './src/frontend/assets/index.ejs',
    templateParameters: {
        // create a list of links to all entry points
        entrypoints: "<ul>" + 
            entryNames.map(entryName => {
                const entry = entryName.replace(/\.[^.]*$/, '')
                return `<li><a href="${entry}.html">${entry}</a></li>`
            }).join("\n")
            + "</ul>"
    },
    favicon: './src/frontend/assets/images/favicon.png',
    filename: 'index.html',
}))

export {entryConfig, HtmlPlugins}
