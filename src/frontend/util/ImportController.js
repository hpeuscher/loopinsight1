/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


/**
 *  wrapper to import backend controller 
 *  with standardized webpack magic comments
 *  and version control
 *  @param {string} id 
 *  @param {string} version 
 */ 
export default function(id, version) {
	// todo: select "latest" version as default
	const filename = id // + "_" + version

	return async function controllerConstructor() {
		const controllerModule = await import(
			/* webpackChunkName: "controllers_[request]" */ 
			/* webpackMode: "lazy" */
			`../../core/controllers/${filename}.js`
		)
		return controllerModule.default
	}

}