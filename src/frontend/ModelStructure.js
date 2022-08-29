/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

import * as Vue from 'vue'
import ModelStructure from './components/ModelStructure.vue'
import { createI18n } from "vue-i18n"
import VTooltip from 'v-tooltip'
import 'v-tooltip/dist/v-tooltip.css'
   

// prepare Vue app
const LT1VueApp = {
	data() { return {
		selectedModel: "",
	}},
	template: '<ModelStructure :selectedModel="this.selectedModel" />',
	components: {
		ModelStructure,
	},
}


// create
const app = Vue.createApp(LT1VueApp)


// add multi-language support
const i18n = createI18n({
	locale: (document.getElementsByTagName("html")[0].lang || navigator.language.split('-')[0]).substring(0,2),
	fallbackLocale: 'en',
})
app.use(i18n)


// mount
const gui = app.mount('#app')

// add tooltip support
app.use(VTooltip);


// pre-select model through hidden input form, if desired
const selection = document.getElementById("selectedModel")
if (selection !== null) {
	gui.selectedModel=selection.value
}