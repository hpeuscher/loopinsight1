<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import { defaults } from 'chart.js'

import ControllerConfig from './ControllerConfig.vue'
import VirtualPatientConfig from './VirtualPatientConfig.vue'
import MealTable from './MealTable.vue'
import ChartGlucose from './ChartGlucose.vue'
import ChartInsulinCarbs from './ChartInsulinCarbs.vue'
import ChartControllerOutput from './ChartControllerOutput.vue'
import ChartAGP from './ChartAGP.vue'

let controller = {}

export default {
	props: {
		runSimulation: Function
	},

	beforeMount() {
		// set default options for Chart
		defaults.maintainAspectRatio = false
		defaults.responsive = true
		defaults.animation = false
		defaults.normalized = true
		
		defaults.elements.point.pointStyle = 'line'
		defaults.elements.point.radius = 0
		
		defaults.plugins.tooltip.callbacks.title = (context) => {
			return 't = ' + context[0].label + ' min'
		};

		defaults.plugins.legend.labels.usePointStyle = true
		
		defaults.interaction.mode = 'nearest'
		defaults.interaction.axis = 'xy'
		defaults.interaction.intersect = false
		
		defaults.scale.title.display = true
		defaults.scale.title.text = this.$t('timeaxis')
		defaults.scale.ticks.stepSize = 60
		defaults.scale.beginAtZero = true

		defaults.parsing = false
	},

	components: {
		ControllerConfig,
		VirtualPatientConfig,
		MealTable,
		ChartGlucose,
		ChartInsulinCarbs,
		ChartControllerOutput,
		ChartAGP,
	},

	data() {
		return {
			boxactive: false,
			patientData: {},	// todo
			patientObject: {},	// todo
			meals: {},
			myCharts: [],
			tmax: 600, 
		}
	},
	
	methods: {
		run() {
			this.resetCharts();
			this.runSimulation();
			this.updateCharts();
		},
		getController() {
			return controller;
		},
		getPatient() {
			return this.patientObject;
		},
		getMeals() {
			return JSON.parse(JSON.stringify(this.meals));
		},
		controllerChanged(newController) {
			if (typeof newController !== "undefined") {
				controller = newController
			}
		},
		patientChanged(newPatient) {
			this.patientObject = newPatient;
			this.patientData = Object.assign({}, newPatient);
		},
		mealsChanged(newMeals) {
			this.meals = newMeals;
		},
		resetCharts() {
			// todo
			for (const chart in this.$refs)
			{
				try {
					this.$refs[chart].reset();
				}
				catch {
				}
			}
		},
		propagateSimulationResults(simResults) {
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
					this.$refs[chart]._update();
				}
				catch {
				}
			}
		},

		// callback when mouse hovers over treatment chart
		controllerDataHover(t0, data) {
			if (typeof data == "undefined") {
				return;
			}
			data = JSON.parse(JSON.stringify(data));
			for (const chart in this.$refs)
			{
				try {
					this.$refs[chart].controllerDataHover(t0, data);
				}
				catch {
				}
			}
		},
	},
}
</script>


<template>
	<div id="container">
		<div id="controls" class="box">
			<h2>{{$t("settings")}}</h2>
			<ControllerConfig 
				@controllerChanged="controllerChanged" 
				v-bind:patient="patientData">
			</ControllerConfig>
			<VirtualPatientConfig 
				@patientChanged="patientChanged">
			</VirtualPatientConfig>
			<MealTable 
				@mealsChanged="mealsChanged">
			</MealTable>
			<div id="generalcontrols" 
				class="box2 accordionbox" 
				v-bind:class="{boxactive: boxactive}">
				<h3 @click="[boxactive=!boxactive]">{{$t("general")}}</h3>
				<div id="generaloptions" class="parameterlist">
					<ul>
						<li class="item">
							<label for="tmax">
								<div class="item-description">{{$t("tmax")}}</div>
								<div class="item-input">
									<input v-model.number="tmax" type="number" min="0" step="30">
								</div>
								<div class="item-unit">min</div>
							</label>
						</li>
					</ul>
				</div>
			</div>		
			<div>
				<input type="button" 
					id="startbutton" 
					:value="$t('run')" 
					@click="run"
					v-tooltip="{
						global: true,
						theme: {
							placement: 'bottom',
							width: 'fit-content',
							padding: '2rem'},}">
			</div>
		</div>	
		<div id="results" class="box">
			<h2>{{$t("results")}}</h2>
			<ChartGlucose ref="chartGlucose" />
			<ChartInsulinCarbs ref="chartInsulinCarbs" @selectLog="controllerDataHover" />
			<ChartControllerOutput ref="chartControllerOutput" />
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


}

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
}
</i18n>
