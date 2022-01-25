/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

// prepare Vue app
import * as Vue from 'vue';
import LT1Main from './components/LT1Main.vue';

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
import { createI18n } from "vue-i18n";

//const VueI18n = require("vue-i18n");
//const i18n = VueI18n.createI18n({
const i18n = createI18n({
	locale: document.getElementsByTagName("html")[0].lang || navigator.language.split('-')[0],
	fallbackLocale: 'en',
});
app.use(i18n);


// add tooltip support
import VTooltip from 'v-tooltip';
import 'v-tooltip/dist/v-tooltip.css';
app.use(VTooltip);


// mount
const gui = app.mount('#app');

// prepare simulator
import Simulator from './Simulator.js';
var sim = new Simulator();


// configure callback to run simulation
gui.runSimulation = () => {
	console.log("start simulation");
	sim.startSim(
		gui.$refs.main.getPatient(), 
		gui.$refs.main.getController(), 
		gui.$refs.main.getMeals(), 
		gui.$refs.main.pushData, 
		{"tmax": Number(gui.$refs.main.tmax)}
	);
};

