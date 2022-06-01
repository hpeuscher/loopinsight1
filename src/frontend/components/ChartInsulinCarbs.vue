<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import Chart from 'chart.js/auto';
import colors from '../Colors.js';

var chartInsulinCarbs;

export default {
	emits: ["selectLog"],
	data() {
		return {
			boxactive: true,
			controllerOutput: [],
		}
	},
	mounted() {
		const ctx = document.getElementById("canvas_insulin_carbs");
		chartInsulinCarbs = new Chart(ctx, {
			data: {
				datasets: [
					{
						type: "line", 
						yAxisID: 'y', 
						label: this.$t("iir"), 
						borderColor: colors['THURed'], 
						spanGaps: true, 
						stepped: "before",},
					{
						type: "scatter", 
						yAxisID: 'y', 
						label: this.$t("ibolus"), 
						backgroundColor: colors['THURed'], 
						borderColor: colors['THUAnthrazit'], 
						radius: 10, 
						pointStyle: "triangle", 
						rotation: 180
					},
					{
						type: "scatter", 
						yAxisID: 'y', 
						label: this.$t("iob"), 
						borderColor: colors['THUGreen'], 
						backgroundColor: colors['THUGreen'], 
						radius: 2, 
						pointStyle: "circle"
					},
					{
						type: "scatter", 
						yAxisID: 'yG', 
						label: this.$t("totalmeal"), 
						borderColor: colors['THUAnthrazit'], 
						backgroundColor: colors['THUDarkBlue'], 
						radius: 10, pointStyle: "triangle"
					},
					{
						type: "line", 
						yAxisID: 'yG', 
						label: this.$t("carbspermin"), 
						borderColor: colors['THUDarkBlue'], 
						stepped: "before"
					},
				],
			},
			options: {
				layout: {
		            padding: {right: 20},
		        },
				scales: {
					x: {
						type: "time",
						offset: false,
						time: {unit: 'hour'},
					},
					y: {
						title: {display: true, text: "U, U/h"},
						min: 0, 
						ticks: {stepSize: 1},
						suggestedMax: 3, 
					},
					yG: {
						title: {display: true, text: "g, g/min"}, 
						position: 'right',
						min: 0,
						suggestedMax: 30,
						ticks: {stepSize: 10},
						grid: { drawOnChartArea: false},
					},
				},
				plugins: {
					tooltip: {
						callbacks: {
							afterBody: (context) => {
								let t0 = context[0].parsed.x;
								let output = this.controllerOutput[t0];
								this.$emit("selectLog", t0, output);
							},
						},
					},
				},
			},
		});
	},
	methods: {
		setSimulationResults(simResults) {
			this.reset()
			for (const result of simResults) {
				const {t, x, u, y, logData} = result
				this._pushRecord(t, x, u, y, logData)
			}
			this._update
		},
		reset() {
			let datasets = chartInsulinCarbs.data.datasets;
			for (let i=0; i<datasets.length; i++) {
				datasets[i].data = [];
			}
			this.controllerOutput = [];
		},
		_pushRecord(t, _x, u, _y, log)  {
			let datasets = chartInsulinCarbs.data.datasets;
			datasets[0].data.push({x: t, y: u.iir});
			if (u.ibolus > 0) {
				datasets[1].data.push({x:t, y: u.ibolus});
			}
			if (typeof log !== "undefined") {
				datasets[2].data.push({x:t, y:log.IOB});
			}
			this.controllerOutput[t] = log; 

			datasets[3].data.push({x:t, y: u.meal});
			datasets[4].data.push({x:t, y: u.carbs});
		},
		_update(){
			chartInsulinCarbs.update();
		},
	},
}
</script>


<template>
	<div class="lt1box box2 accordionbox" v-bind:class="{boxactive: boxactive}">
		<h3 @click="[boxactive=!boxactive]">{{$t("title")}}</h3>
		<div class="canvasdiv">
			<canvas id="canvas_insulin_carbs" />
		</div>
	</div>
</template>


<i18n locale="en">
{
	"title":		"Insulin dosage and carb intake",
	"iir":			"insulin infusion rate in U/h",
	"ibolus":		"insulin bolus in U",
	"iob":			"calculated IOB in U",
	"totalmeal":	"total meal in g",
	"carbspermin":	"intake in g/min",
}
</i18n>
<i18n locale="de">
{
	"title": 		"Insulindosierung und Mahlzeiten",
	"iir":			"Insulinrate in U/h",
	"ibolus":		"Insulinbolus in U",
	"iob":			"Berechnetes IOB in U",
	"totalmeal":	"Gesamte Mahlzeit in g",
	"carbspermin":	"Aufnahme in g/min",
}
</i18n>
