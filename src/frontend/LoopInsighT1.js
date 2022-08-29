/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

import * as Vue from 'vue';
import LT1Main from './components/LT1Main.vue';
import Simulator from '../core/Simulator.js';
import { createI18n } from "vue-i18n";
import VTooltip from 'v-tooltip';
import 'v-tooltip/dist/v-tooltip.css';
   
// prepare Vue app
const LT1VueApp = {
	template: '<LT1Main :runSimulation="runSimulation" ref="main" />',
	components: {
		LT1Main,
	},
	data() {
		return {
			runSimulation: () => {
				// dummy, replaced by actual callback
			},
		}
	},
};


// create
const app = Vue.createApp(LT1VueApp);

// add multi-language support
const i18n = createI18n({
	locale: (document.getElementsByTagName("html")[0].lang || navigator.language.split('-')[0]).substring(0,2),
	fallbackLocale: 'en',
});
app.use(i18n);


// add tooltip support
app.use(VTooltip);


// mount
const gui = app.mount('#app');

// prepare simulator
var sim = new Simulator();


// configure callback to run simulation
gui.runSimulation = () => {
	console.log("start simulation");

	sim.setPatient(gui.$refs.main.getPatient())
	sim.setController(gui.$refs.main.getController())
	sim.setMeals(gui.$refs.main.getMeals())
	sim.setOptions(gui.$refs.main.getOptions())
	sim.runSimulation()

	// propagate results to charts
	const results = sim.getSimulationResults()
	gui.$refs.main.propagateSimulationResults(results)
}

