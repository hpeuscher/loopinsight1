<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/


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

// mean value
function mean(arr)
{
	let sum = 0;
	let n = arr.length;
    for (let i = 0; i < n; i++) {
        sum += arr[i];
    }
    return sum / n;
}
   
// variance
function variance(arr)
{
	let sum = 0;
	let n = arr.length;
	let m = mean(arr);
    for (let i = 0; i < n; i++) {
    	sum += arr[i] * arr[i];
    }
    return sum / n - m*m;
}

// standard deviation
function std(arr) {
	return Math.sqrt( variance(arr) );
}
   
// coefficient of variation.
function coefficientOfVariation(arr)
{
	return std(arr) / mean(arr);
}


export default {
	data() {
		return {
			boxactive: true,
			G: [],
			tir_veryhigh: 0,
			tir_high: 0,
			tir_target: 0,
			tir_low: 0,
			tir_verylow: 0,
			t_total: 0,
			tir_height: 2,
			averageGlucose: 0,
			GMI: 0,
			glucoseVariability: 0,
		};
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
			this.G = [];
			this.tir_veryhigh = 0;
			this.tir_high = 0;
			this.tir_target = 0;
			this.tir_low = 0;
			this.tir_verylow = 0;
			this.t_total = 0;
		},
		_update() {
			this.averageGlucose = Math.round(mean(this.G));
			this.GMI = Math.round((3.38 + 0.02345 * this.averageGlucose)*10) / 10;
			this.glucoseVariability = Math.round(100*coefficientOfVariation(this.G));

		},
		// _pushRecord(_t, _x, _u, y, _log) {
		_pushRecord(_t, _x, _u, y, _log) {
			this.G.push(y.G);
			this.t_total++;
			let G = y.G;
			if (G < 54) {
				this.tir_verylow++;
			}
			else if (G < 70) {
				this.tir_low++;
			}
			else if (G > 250) {
				this.tir_veryhigh++;
			}
			else if (G > 180) {
				this.tir_high++;
			}
			else {
				this.tir_target++;
			}
		},
	},
	computed: {
		tir_veryhigh_percent: function() {
			return this.t_total <= 0 ? 0 :
				Math.round(100*this.tir_veryhigh/this.t_total);
		},
		tir_high_percent: function() {
			return this.t_total <= 0 ? 0 :
				Math.round(100*this.tir_high/this.t_total);
		},
		tir_target_percent: function() {
			return this.t_total <= 0 ? 0 :
				Math.round(100*this.tir_target/this.t_total);
		},
		tir_low_percent: function() {
			return this.t_total <= 0 ? 0 :
				Math.round(100*this.tir_low/this.t_total);
		},
		tir_verylow_percent: function() {
			return this.t_total <= 0 ? 0 :
				Math.round(100*this.tir_verylow/this.t_total);
		},
	},
}
</script>


<template>
	<div class="lt1box box2 accordionbox" v-bind:class="{boxactive: boxactive}">
		<h3 @click="[boxactive=!boxactive]">{{$t("title")}}</h3>
		<div id="AGPstatistics" class="agpbox">
			<h4>{{$t('Statistics')}}</h4>
			<div id="AGPstatisticstable">
				<div>{{$t('stats.averageGlucose')}}</div>
				<div>{{averageGlucose}} mg/dL</div>
				<div>{{$t('stats.GMI')}}</div>
				<div>{{GMI}} %</div>
				<div>{{$t('stats.glucoseVariability')}}</div>
				<div>{{glucoseVariability}} %</div>
			</div>
			<div>{{cgmActive}}</div>
		</div>
		<div class="agpbox">
			<h4>{{$t("timeInRanges")}}</h4>
			<table id="tirtable">
			    <colgroup>
					<col style="width: 70px">
					<col>
					<col style="width: 70px">
			    </colgroup>
				<tr>
					<td></td>
					<td>
						{{$t('tir.veryhigh')}} (>250 mg/dL)
					</td>
					<td>
						{{tir_veryhigh_percent}} %
					</td>
				</tr>
				<tr>
					<td style="vertical-align:bottom;">
						<div class="barCell" id="tir_veryhigh" 
							:style="'height: '+tir_veryhigh_percent*tir_height+'px'">
						</div>
						<div class="barCell" id="tir_high" 
							:style="'height: '+tir_high_percent*tir_height+'px'">
						</div>
					</td>
					<td style="vertical-align:bottom;">
						{{$t('tir.high')}} (181-250 mg/dL)
					</td>
					<td style="vertical-align:bottom;">
						{{tir_high_percent}} %
					</td>
				</tr>
				<tr>
					<td>
						<div class="barCell" id="tir_target" 
							:style="'height: '+tir_target_percent*tir_height+'px'">
						</div>
					</td>
					<td>
						{{$t('tir.targetrange')}} (70-180 mg/dL)
					</td>
					<td>
						{{tir_target_percent}} %
					</td>
				</tr>
				<tr>
					<td style="vertical-align:top;">
						<div class="barCell" id="tir_low" 
							:style="'height: '+tir_low_percent*tir_height+'px'">
						</div>
						<div class="barCell" id="tir_verylow" 
							:style="'height: '+tir_verylow_percent*tir_height+'px'">
						</div>
					</td>
					<td style="vertical-align:top;">
						<div style="vertical-align:top;">
							{{$t('tir.low')}} (54-69 mg/dL)
						</div>
					</td>
					<td style="vertical-align:top;">
						<div style="vertical-align:top;">
							{{tir_low_percent}} %
						</div>
					</td>
				</tr>
				<tr>
					<td></td>
					<td>
						{{$t('tir.verylow')}} (&lt;54 mg/dL)
					</td>
					<td>
						{{tir_verylow_percent}} %
					</td>
				</tr>
			</table>
		</div>
	</div>
</template>


<style scoped>
div#AGPstatisticstable {
	display: grid;
	grid-template-columns: auto 70px;
	grid-gap: 10px;
}

table#tirtable {
	width: 100%;
	border-collapse: collapse;
	white-space: nowrap;
	border:none;
}

#tirtable tr,th,td {
	border:none;
}


table#tirtable > div {
}
/* span between TIRs */
table#tirtable td {
	padding: 0;
}
div.barCell {
	width: 50px;
	/*margin: 1px;*/
	border-top: solid 1px white;
}

/* table headers */
div.agpbox {
	display: inline-block;
	vertical-align: top;
	width: 375px;
	margin: 5px;
}

div.agpbox > h4 {
	background-color: rgb(0,0,0,1);
	color: rgb(255,255,255,1);
	padding: 3px;
	font-variant: small-caps;
	margin-top: 0.25em;
}

/* tir colors */
#tir_veryhigh {
	background-color: rgb(233,181,17,1);
}
#tir_high {
	background-color: rgb(250,234,0,1);
}
#tir_target {
	background-color: rgb(120,176,89,1);
}
#tir_low {
	background-color: rgb(194,1,18,1);
}
#tir_verylow {
	background-color: rgb(140,25,22,1);
}

</style>


<i18n locale="en">
{
	"title": "AGP Report",
	"Statistics": "Glucose Statistics and Targets",
	"timeInRanges": "Time in Ranges",
	"tir.veryhigh": "Very High",
	"tir.high": "High",
	"tir.targetrange": "Target Range",
	"tir.low": "Low",
	"tir.verylow": "Very Low",
	"stats.averageGlucose": "Average Glucose",
	"stats.GMI": "Glucose Management Indicator (GMI)",
	"stats.glucoseVariability": "Glucose Variability",
}
</i18n>
<i18n locale="de">
{
	"title": "AGP Report",
	"Statistics": "Glukose-Statistik",
	"timeInRanges": "Zeit in Bereichen",
	"tir.veryhigh": "Sehr hoch",
	"tir.high": "Hoch",
	"tir.targetrange": "Zielbereich",
	"tir.low": "Niedrig",
	"tir.verylow": "Sehr niedrig",
	"stats.averageGlucose": "Mittelwert Glukose",
	"stats.GMI": "Glukosemanagementindikator (GMI)",
	"stats.glucoseVariability": "Glukosevariabilität",
}
</i18n>
