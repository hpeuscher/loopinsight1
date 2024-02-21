/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import ModelStructure from '../structureDiagrams/ModelStructure.vue'
import createVueApp from '../util/createVueApp.js'

const app = createVueApp('modelStructure', {
	data() { return {
		selectedModel: "",
	}},
	template: '<ModelStructure :selectedModel="this.selectedModel" />',
	components: {
		ModelStructure,
	},
})

// pre-select model through hidden input form, if desired
const selection = document.getElementById("selectedModel")
if (selection !== null) {
	(<any>app).selectedModel = (<any>selection).value
}
