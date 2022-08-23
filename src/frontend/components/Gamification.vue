<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import { defaults } from 'chart.js';
import { ref } from 'vue'

import ControllerConfig from './GamificationBasalBolus.vue'
import ChartGlucose from './GamificationChartGlucose.vue'
import ChartAGP from './ChartAGP.vue'

import VirtualPatientUvaPadova from '../../core/models/UvaPadova.js'
import Simulator from '../../core/Simulator.js'

let controller = {}
let meals = [
	{
		actual: {
			start: new Date(2022,5,1,8,0,0), 
			duration: 15, 
			carbs: 20, 
		},
		announcement: {
			start: new Date(2022,5,1,8,0,0), 
			carbs: 20, 
			time: new Date(2022,5,1,0,0,0),
		},
	},
]
let options = {
	"t0": new Date(2022,5,1,0,0,0),
	"tmax": new Date(2022,5,2,0,0,0),
}

export default {
	props: {

	},

	beforeMount() {
		// set default options for Chart
		defaults.maintainAspectRatio = false
		defaults.responsive = true
		defaults.animation = false
		defaults.normalized = true
		
		defaults.elements.point.pointStyle = 'line'
		defaults.elements.point.radius = 0
		
		defaults.plugins.legend.labels.usePointStyle = true
		
		defaults.interaction.mode = 'nearest'
		defaults.interaction.axis = 'xy'
		defaults.interaction.intersect = false
		
		defaults.scale.title.display = true
		defaults.scale.title.text = this.$t('timeaxis')

		defaults.parsing = false
	},

	components: {
		ControllerConfig,
		ChartGlucose,
		ChartAGP,
	},

	data() {
		return {
			patientData: {},	// todo
			patientObject: {},	// todo
			myCharts: [],
		}
	},

	mounted() {
		this.patientChanged(new VirtualPatientUvaPadova());
	},
	
	methods: {
		run() {
			this.resetCharts();
				console.log("start simulation");
								
				// prepare simulator
				var sim = new Simulator();

				sim.setPatient(this.getPatient())
				sim.setController(this.getController())
				sim.setMeals(meals)
				sim.setOptions(options)
				sim.runSimulation()

				// propagate results to charts
				const results = sim.getSimulationResults()
				this.propagateSimulationResults(results)
	
			this.updateCharts();
		},
		getController() {
			return controller;
		},
		getPatient() {
			return this.patientObject
		},
		controllerChanged(newController) {
			if (typeof newController !== "undefined") {
				controller = newController
			}
			if (typeof this.patientObject.getInitialState !== "undefined") {
				this.run();
			}
		},
		patientChanged(newPatient) {
			this.patientObject = newPatient;
			this.patientData = Object.assign({}, newPatient);
		},
		resetCharts() {
			for (const chart in this.$refs)
			{
				try {
					this.$refs[chart].reset()
				}
				catch {
				}
			}
		},
		// receive and use simulation data
		propagateSimulationResults(simResults) {
			// dispatch simulation output to charts
			for (const chart in this.$refs)
			{
				try {
					this.$refs[chart].setSimulationResults(simResults);
				}
				catch {
				}
			}
		},
		// update charts after simulation is complete
		updateCharts() {
			for (const chart in this.$refs)
			{
				try {
					this.$refs[chart].update();
				}
				catch {
				}
			}
		},

		// callback when mouse hovers over treatment chart
		controllerDataHover(t0, data) {

		},
	},
}
</script>


<template>
	<div id="container">
		<div id="controls" class="box">
			<p>{{$t("explanations")}}</p>
			<ControllerConfig 
				@controllerChanged="controllerChanged" 
				v-bind:patient="patientData">
			</ControllerConfig>
		</div>	
		<div id="results" class="box">
			<ChartGlucose ref="chartGlucose" />
			<ChartAGP ref="chartAGP" />
		</div>
	</div>
</template>


<style lang="css">
body {
	overflow-y: scroll;
	min-width: 440px;
}

/* for wide screen, show results next to settings. otherwise below */
div#container {
	font-family: ABeeZee, Candara, Helvetica, sans-serif;
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
}
div#controls {
	width: 350px;
	height: min-content;
}
div#results {
	width: 100%;
	max-width: 850px; 
	min-width: 350px;
}
@media screen and (min-width: 850px) {
	div#container {
		flex-wrap: nowrap;
	}
	div#results {
		width: calc(100% - 350px); 
	}
}

#container a {
	cursor: pointer;
}

#container input,select {
	padding: 0.25rem;
	box-sizing: border-box;
}


/* outer boxes */
.box {
	border:solid;
	border-width:1px;
	border-radius:4px;
	border-color:#586067;
	padding:5px;
	margin:5px;
}

/* inner boxes */
.box2 {
	border:solid;
	border-width:1px;
	border-color:#aaaaaa;
	padding:.5rem;
	margin-top:1rem;
}

/* box that can be opened or closed */
.accordionbox {
	height: 1.25rem;
	overflow: hidden;
	box-sizing: content-box;
}
.boxactive {
	height: auto;
	overflow: visible;
}

/* box title */
#container h2	{
	color: #003160;
	margin-left: 0.5rem;
}
#container h3	{
	margin: 0px;
	font-size: 1.25rem;
	line-height: 1.25rem;
	font-weight: bold;
	position: relative;
	margin-bottom: 1rem;
	color: #586067;
}
#container h3	{
	font-size:1.1rem;
	font-weight:bold;
	margin-bottom:0.5rem;
}
#container h4	{
	font-size:1rem;
	font-weight:bold;
	margin-bottom:0.25rem;
}

/* arrow to open or close box content */
#container .accordionbox h3::after {
	position: absolute;
	font-size: 1.25rem;
	right: 0.5rem;
/*    top: -.25em;*/
	transition: all 0.5s;
	content: "\27A6";
	transform: rotate(90deg);
}	
#container .boxactive h3::after {
	content: "\27A5";
	transform: rotate(180deg);
}
	
/* parameter input */
#container .parameterinput	{
	width: 90%;
	line-height: 1;
}

/* parameter list container */
#container .parameterlist	{
	display: block;
/*	grid-template-columns: 200px 5.5rem auto;
	grid-template-rows: auto;
	grid-row-gap: 10px;
	align-items: center;*/
	margin-bottom: 10px;
}
#container .parameterlist label {
	font-size: 0.9rem;
	display: grid;
	grid-template-columns: 50% 5.5rem auto;
	grid-template-rows: auto;
	grid-row-gap: 10px;
	align-items: center;
	margin-bottom: 10px;
}
#container .parameterlist hr {
	width: 80%;
}


#container .parameterlist ul {
	padding: 0;
	width: 100%;
}
#container .parameterlist li {
	display: grid;
	width: 100%;
}
#container .item-description .item-input .item-unit {
	display: inline-grid
}
#container .item-input input {
	width: 6em;
}


/* Chart canvas */
.canvasdiv {
	height:250px;
	width:100%;
	margin-top: 1rem;
}

/* button "run simulation" */
input#startbutton {
	float: right;
	margin: 1rem; 
	padding: 0.5rem; 
	font-size: 1rem; 
	padding: 0.5em;
}

/* tooltip popups */
.v-popper__inner {
	font-family: ABeeZee, Candara, Helvetica, sans-serif;
}

</style>



<i18n locale="en">
{
	"settings": 	"Settings",
	"run": 			"run simulation",
	"general": 		"General options",
	"tmax": 		"Simulation timespan",
	"results":		"Results",
	"timeaxis":		"time in min",
}
</i18n>
<i18n locale="de">
{
	"settings": 	"Einstellungen",
	"run": 			"Simulation starten",
	"general":		"Allgemein",
	"tmax":			"Simulationszeitraum",
	"results":		"Ergebnisse",
	"timeaxis":		"Zeit in min",
	"explanations":	"Versuche, die Einstellungen so zu wählen, dass Du möglichst viel Zeit im Zielbereich verbringst."
}
</i18n>
