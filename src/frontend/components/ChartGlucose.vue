<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/
	
import Chart from 'chart.js/auto';
import 'chartjs-adapter-moment';
import colors from '../Colors.js';

// Chart object
var chartGlucose;

// glucose color
function glucoseColor(ctx) {
	if (ctx.p0.parsed.y < 54 || ctx.p1.parsed.y < 54)
		return 'rgb(140,25,22,1)';	// very low
	if (ctx.p0.parsed.y < 70 || ctx.p1.parsed.y < 70)
		return 'rgb(194,1,18,1)';	// low
	if (ctx.p0.parsed.y > 250 || ctx.p1.parsed.y > 250)
		return 'rgb(233,181,17,1)';	// very high
	if (ctx.p0.parsed.y > 180 || ctx.p1.parsed.y > 180)
		return 'rgb(250,234,0,1)';	// high
	return 'rgb(120,176,89,1)';		// target
}


export default {
	data() {
		return {
			boxactive: true,
			preserveOldCurves: false,
			currentDatasetID: 1,
		};
	},
	mounted() {
		const ctx = document.getElementById("canvas_glucose_concentration");
		chartGlucose = new Chart(ctx, {
			data: {
				datasets: [
					{
						type: "line", 
						label: this.$t("prediction"), 
						borderColor: 'rgb(0,0,0,1)', 
						borderDash: [10, 2], 
						borderWidth: 1, 
						spanGaps: true
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
						type: "linear",
						title: {display: true, text: "mg/dl"},
						ticks: {stepSize: 20},
						min: 40,
						suggestedMax: 200,
					},
				},
				plugins: {
					legend: {display: false},
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
			this._update()
		},
		reset() {
			let datasets = chartGlucose.data.datasets;
			// remove prediction data
			datasets[0].data = [];
			if (this.preserveOldCurves) {
				if (datasets.length > this.currentDatasetID) {
					// make old curve thinner
					datasets[this.currentDatasetID].borderWidth = 0.5;
				}
			}
			else {
				// remove all but first (prediction)
				chartGlucose.data.datasets = datasets.slice(0,1);
				datasets = chartGlucose.data.datasets;
			}
			// create new curve
			datasets.push({
				type: "line", 
				label: this.$t("actual"), 
				tension: 0.5, 
				data: [],
				segment: {
					borderColor: ctx => glucoseColor(ctx),
				},
			});
			this.currentDatasetID = datasets.length - 1;
		},
		_update(){
			chartGlucose.update();
		},
		_pushRecord(t, _x, _u, y, _log)  {
			// glucose (most recent simulation)
			chartGlucose.data.datasets[this.currentDatasetID].data
				.push({x:t.valueOf(), y:y.G});
		},
		controllerDataHover(t0, data) {
			// draw oref0 glucose prediction, if available
			if (typeof data !== "undefined") {
				let predBG = data.predictedBG;
				if (typeof predBG !== "undefined") {
					chartGlucose.data.datasets[0].data = predBG.map(p=>{
						return {x:p.t, y:p.BG}
					});
					this._update();
				}
			}
		},
	},
}
</script>


<template>
	<div class="lt1box box2 accordionbox" v-bind:class="{boxactive: boxactive}">
		<h3 @click="[boxactive=!boxactive]">{{$t("title")}}</h3>
		<input type="checkbox" v-model="preserveOldCurves">
		<label for="preserveOldCurves">{{$t("preserveOldCurves")}}</label>
		<div class="canvasdiv">
			<canvas id="canvas_glucose_concentration" />
		</div>
	</div>
</template>


}


<i18n locale="en">
{
	"title": "Glucose concentration",
	"actual": "actual concentration",
	"prediction": "prediction by algorithm",
	"preserveOldCurves": "preserve old curves",
}
</i18n>
<i18n locale="de">
{
	"title": "Glukosekonzentration",
	"actual": "Tatsächliche Glukosekonzentration",
	"prediction": "Prädiktion des Algorithmus",
	"preserveOldCurves": "Alte Kurven beibehalten",
}
</i18n>
