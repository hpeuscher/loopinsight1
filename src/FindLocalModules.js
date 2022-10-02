/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

/**
 * Find local modules (e.g. models, controllers) and extract meta information from them
 * 
 * @param {string} rel_path relative path of directory
 * @param {function} filter (optional) regexp to filter files
 */
async function getMetaInformation(rel_path, filter = /.*\.(js?)/ig) {

	const __filename = fileURLToPath(import.meta.url)
	const __dirname = path.resolve(path.dirname(__filename),  rel_path)
	const dirCont = fs.readdirSync( __dirname ) 
	const files = dirCont.filter( (f) => f.match(filter) )

	let allModules = {}

	for (const m of files) {
		const result = await import(rel_path + '/' + m)
		if (typeof result !== "undefined") {
			const profile = result.profile
			if (typeof profile !== "undefined") {
				if (typeof profile.id !== "undefined") {
					allModules[profile.id] = profile
				}
			}
		}
	}

	return allModules
}

export default getMetaInformation
