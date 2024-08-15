/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ModuleProfileList, ModuleProfile } from '../src/types/ModuleProfile.js'

/**
 * Find local modules (e.g. models, controllers) and extract meta information from them
 * 
 * @param {string} rel_path relative path of directory
 * @param {RegExp} filter (optional) regexp to filter files
 */
export default async function findLocalModules(
    rel_path: string, filter: RegExp = /.*(\.ts?)$/ig) {

    const files = await findFiles(rel_path, filter)
    const modules = await getMetaInformation(rel_path, files)
    return modules
}

/**
 * Find local Json configurations and extract information from them
 * 
 * @param {string} rel_path relative path of directory
 */
export async function findLocalJson(rel_path: string) {

    const files = await findFiles(rel_path, /.*(\.json)$/ig)
    const modules = await getJsonContent(rel_path, files)
    return modules
}


/**
 * Find local files
 * 
 * @param {string} rel_path relative path of directory
 * @param {RegExp} filter (optional) - regexp to filter files
 */
export async function findFiles(
    rel_path: string, 
    filter: RegExp = /.*(\.ts?)/ig) {

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.resolve(path.dirname(__filename), '../'+rel_path)
    const dirCont = fs.readdirSync(__dirname)
    const files = dirCont.filter((f) => f.match(filter))

    if (!files.length) {
        console.warn("No files found at " + rel_path + " for filter " + filter)
        return []
    }
    return files
}

/**
 * Find local folders within folder
 * 
 * @param {string} rel_path relative path of directory
 * @param {string[]} exclude - list of folder names to exclude
 */
export async function findFolders(
    rel_path: string, 
    exclude: Array<string> = []) {

    const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../' + rel_path)
    return (await fs.readdirSync(__dirname, { withFileTypes: true }))
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(folder => !exclude.includes(folder))
}

/**
 * getMetaInformation
 * 
 * @param {string} rel_path relative path of directory
 * @param {Array} files list of filenames to import
 */
export async function getMetaInformation(
    rel_path: string, files: Array<string>): Promise<ModuleProfileList> {
    let allModules: ModuleProfileList = {}

    for (const m of files) {
        // replace .ts extension by .js
        const filename = m.replace(/(\.ts)$/ig, '.js') 
        const moduleName = m.replace(/\.[^.]*$/, '')

        // import module
        const result = await import('../' + rel_path + '/' + filename)
        if (typeof result !== "undefined") {
            // extract profile from module and add it to our list
            const profile: ModuleProfile = result.profile
            allModules[moduleName] = profile
        }
        else {
            console.warn('import failed for ' + rel_path + '/' + filename)
        }
    }
    return allModules
}


/**
 * load contents of JSON files
 * 
 * @param {string} rel_path relative path of directory
 * @param {Array} files list of filenames to import
 */
export async function getJsonContent(
    rel_path: string, files: Array<string>) {
    let allModules: any = {}

    for (const filename of files) {

        const moduleName = filename.replace(/\.[^.]*$/, '')

        // import assertions: https://nodejs.org/api/esm.html#json-modules
        const options = {
            with: {
                type: "json"
            }
        }

        // import JSON file
        const result = await import('../' + rel_path + '/' + filename, options)

        if (typeof result !== "undefined") {
            // extract file contents and add it to our list
            const profile: ModuleProfile = result.default
            allModules[moduleName] = profile
        }
        else {
            console.warn('import failed for ' + rel_path + '/' + filename)
        }
    }
    return allModules
}
