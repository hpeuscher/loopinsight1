<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import VirtualPatientCambridge from '../../../core/models/Cambridge.js'

import countDecimals from "../../../common/CountDecimals.js"

export const profile = {
	id: "Cambridge",
	version: "0.2.0",
	name: "Cambridge",
}

export default {
	emits: ["patientChanged"],
	data() {
		return {
			...profile,
			patient: new VirtualPatientCambridge(),
		}
	},
	beforeMount() {
		this.name = this.$t("name")
	},
	mounted() {
		this.computeSteadyState()
	},
	methods: {
		computeSteadyState() {
			this.patient.computeSteadyState()
			this.$emit("patientChanged", this.patient)
		},

		stepDistance(key) {
			return Math.pow(10, countDecimals(this.patient.parameters[key]))
		},
		loaddefaultpatient() {
			this.patient.setParameters(this.patient.defaults)
		},
		setParameters(parameters) {
			this.patient.parameters = Object.assign(this.patient.parameters, 
				JSON.parse(JSON.stringify(parameters)))
		},
	},
}
</script>


<template>
	<div>
	<p style="text-align:center;">
		<input type="button" 
			:value="$t('loaddefaultpatient')" 
			@click="loaddefaultpatient">
	</p>
	<div id="patientoptions" class="parameterlist">
		<ul>
			<li v-for="(id) in patient.parameterList" class="item" :key="id">
				<label :for="'param'+id" >
					<div class="item-description"
						v-tooltip="{content: $t('parameters.'+id)}">
						<span v-html="$t('parameters.'+id,'html')"></span>
					</div>
					<div class="item-input">
						<input v-model.number=patient.parameters[id] 
							:id="'param'+id"
							type="number" :min=0
							@change="computeSteadyState()"
							:step="stepDistance(id)">
					</div>
					<div class="item-unit">{{$t('parameters.'+id,'units')}}</div>
				</label>
			</li>	
		</ul>
	</div>
	</div>
</template>


<style lang="css">
#patientoptions label {
	grid-template-columns: 100px 5.5rem auto !important;
}
</style>


<i18n locale="units">
{
	states: {
		"Q1"		: "mmol",
		"Q2"		: "mmol",
		"S1"		: "mU",
		"S2"		: "mU",
		"I"			: "mU/L",
		"x1"		: "1/min",
		"x2"		: "1/min",
		"x3"		: "1",
		"D1"		: "mmol",
		"D2"		: "mmol",
	},
	parameters: {
		"Gpeq"		: "mmol/L",
		"BW"		: "kg",
		"k12"		: "1/min",
		"ka1" 		: "1/min",
		"ka2" 		: "1/min",
		"ka3" 		: "1/min",
		"ke" 		: "1/min",
		"VI" 		: "L/kg",
		"VG"		: "L/kg",
		"AG"		: "1",
		"tmaxG"		: "min",
		"SIT" 		: "1/min/mU/L",
		"SID" 		: "1/min/mU/L",
		"SIE" 		: "1/mU/L",
		"EGP0"		: "mmol/kg/min",
		"F01"		: "mmol/kg/min",
		"tmaxI"		: "min",
	},
	signals: {
	},
}
</i18n>

<i18n locale="html">
{
	states: {
		"Q1"		: "Q<sub>1</sub>",
		"Q2"		: "Q<sub>2</sub>",
		"S1"		: "S<sub>1</sub>",
		"S2"		: "S<sub>2</sub>",
		"I"			: "I",
		"x1"		: "x<sub>1</sub>",
		"x2"		: "x<sub>2</sub>",
		"x3"		: "x<sub>3</sub>",
		"D1"		: "D<sub>1</sub>",
		"D2"		: "D<sub>2</sub>",
	},
	parameters: {
		"Gpeq"		: "G<sub>p,eq</sub>",
		"BW"		: "BW",
		"k12"		: "k<sub>12</sub>",
		"ka1" 		: "k<sub>a1</sub>",
		"ka2" 		: "k<sub>a2</sub>",
		"ka3" 		: "k<sub>a3</sub>",
		"ke" 		: "k<sub>e</sub>",
		"VI" 		: "V<sub>I</sub>",
		"VG"		: "V<sub>G</sub>",
		"AG"		: "A<sub>G</sub>",
		"tmaxG"		: "t<sub>max,G</sub>",
		"SIT" 		: "S<sub>IT</sub>",
		"SID" 		: "S<sub>ID</sub>",
		"SIE" 		: "S<sub>IE</sub>",
		"EGP0"		: "EGP<sub>0</sub>",
		"F01"		: "F<sub>01</sub>",
		"tmaxI"		: "t<sub>max,I</sub>",
	},
	signals: {
	},
}
</i18n>

<i18n locale="en">
{
	"name"			: "Cambridge",
	loaddefaultpatient: "restore default values",
	states: {
		"Q1"		: "mass in accessible compartment (plasma)",
		"Q2"		: "mass in non-accessible compartment",
		"S1"		: "amount of insulin in compartment 1",
		"S2"		: "amount of insulin in compartment 2",
		"I"			: "plasma insulin",
		"x1"		: "insulin action on glucose transport",
		"x2"		: "insulin action on glucose disposal",
		"x3"		: "insulin action on endogenous glucose production",
		"D1"		: "glucose in compartment 1",
		"D2"		: "glucose in compartment 2",
	},
	parameters: {
		"Gpeq"		: "steady-state of glucose in plasma",
		"BW"		: "body weight",
		"k12" 		: "transfer rate from the non-accessible to the accessible compartment",
		"ka1" 		: "deactivation rate",
		"ka2" 		: "deactivation rate",
		"ka3" 		: "deactivation rate",
		"ke"		: "insulin elimination from plasma",
		"VI" 		: "insulin distribution volume",
		"VG" 		: "distribution volume of the accessible compartment",
		"AG"		: "carbohydrate (CHO) bioavailability",
		"tmaxG"		: "time-to-maximum of CHO absorption",
		"SIT" 		: "insulin sensitivity of distribution/transport",
		"SID" 		: "insulin sensitivity of disposal",
		"SIE" 		: "insulin sensitivity of EGP",
		"EGP0"		: "endogenous glucose production (EGP) extrapolated to the zero insulin concentration",
		"F01"		: "non-insulin-dependent glucose ﬂux",
		"tmaxI"		: "time-to-maximum of absorption of subcutaneously injected short-acting insulin",
	},
	signals: {
		"EGP"		: "endogenous glucose production",
	},
}
</i18n>

<i18n locale="de">
{
	"name"			: "Cambridge / Cambridge",
	"loaddefaultpatient": "Standardwerte wiederherstellen",
	states: {
		"Q1"		: "mass in accessible compartment (plasma)",
		"Q2"		: "mass in non-accessible compartment",
		"S1"		: "amount of insulin in compartment 1",
		"S2"		: "amount of insulin in compartment 2",
		"I"			: "plasma insulin",
		"x1"		: "insulin action on glucose transport",
		"x2"		: "insulin action on glucose disposal",
		"x3"		: "insulin action on endogenous glucose production",
		"D1"		: "glucose in compartment 1",
		"D2"		: "glucose in compartment 2",
	},	
	parameters: {
		"Gpeq"		: "Glukose im Plasma im Gleichgewicht",
		"BW"		: "Körpergewicht",
		"k12" 		: "transfer rate from the non-accessible to the accessible compartment",
		"ka1" 		: "deactivation rate",
		"ka2" 		: "deactivation rate",
		"ka3" 		: "deactivation rate",
		"ke"		: "insulin elimination from plasma",
		"VI" 		: "insulin distribution volume",
		"VG" 		: "distribution volume of the accessible compartment",
		"AG"		: "Bioverfügbarkeit der Kohlenhydrate",
		"tmaxG"		: "time-to-maximum of CHO absorption",
		"SIT" 		: "Insulinsensitivität of distribution/transport",
		"SIT" 		: "Insulinsensitivität of distribution/transport",
		"SIT" 		: "Insulinsensitivität of distribution/transport",
		"SID" 		: "Insulinsensitivität of disposal",
		"SIE" 		: "Insulin sensitivity of EGP",
		"EGP0"		: "endogenous glucose production (EGP) extrapolated to the zero insulin concentration",
		"F01"		: "non-insulin-dependent glucose ﬂux",
		"tmaxI"		: "time-to-maximum of absorption of subcutaneously injected short-acting insulin",
	},
	signals: {
		"EGP"		: "endogene Glukoseproduktion",
	},
}
</i18n>


<svg>
{

	subsystems: [
		{x: 60,		y: 110,		width: 330, height: 100, fill: "#DDDDFF", label: { text: "endogenous glucose production" } },
		{x: 400,	y:  10,		width: 320, height: 390, fill: "#FFDDDD", label: { text: "glucose subsystem" } },
		{x: 60,		y: 300,		width: 330, height: 100, fill: "#DDFFCC", label: { text: "insulin pharmacokinetics" } },
		{x: 60,		y: 10,		width: 330, height: 90,  fill: "#FFDD55", label: { text: "meal subsystem" } },
	],

	nodes: {
		"Q1":	{ x: 500,	y: 150,		geometry: {shape: "circle", d: 50} },
		"Q2":	{ x: 600,	y: 150,		geometry: {shape: "circle", d: 50} },
		"S1":	{ x: 150,	y: 350,		geometry: {shape: "circle", d: 50} },
		"S2":	{ x: 250,	y: 350,		geometry: {shape: "circle", d: 50} },
		"I"	:	{ x: 350,	y: 350,		geometry: {shape: "circle", d: 50} },
		"x3":	{ x: 450,	y: 250,		geometry: {shape: "circle", d: 50} },
		"x1":	{ x: 550,	y: 250,		geometry: {shape: "circle", d: 50} },
		"x2":	{ x: 650,	y: 250,		geometry: {shape: "circle", d: 50} },
		"D1":	{ x: 150,	y:  50,		geometry: {shape: "circle", d: 50} },
		"D2":	{ x: 250,	y:  50,		geometry: {shape: "circle", d: 50} },

		"Ra":	{ x: 350,	y:  50,		geometry: {shape: "square", d: 40} },
		"EGP":	{ x: 350,	y:  150,	geometry: {shape: "square", d: 40} },

		"G":	{ x: 500,	y:  50,		geometry: {shape: "square", d: 40, doubleLine: 1},	class: "output" },
	},

	connections: [
		{ type: "arrow",	from: {id: "Q1",	angle:  -30	}, 	to: {id: "Q2",	angle: -150 	}, id: "Q1Q2"},
		{ type: "arrow",	from: {id: "Q2",	angle:  150	}, 	to: {id: "Q1",	angle: 30 		}, label: {text: "k12"} },
		{ type: "arrow",	from: {id: "Q2"					}, 	to: {x: 675, 	y: 150 			}, id: "Q2away", label: {text: ""} },
		{ type: "arrow",	from: {id: "x1"					}, 	to: {id: "Q1Q2"					}, label: {text: ""}, style: "stroke-dasharray: 5 5" },
		{ type: "arrow",	from: {id: "x2"					}, 	to: {id: "Q2away", angle: -90	}, label: {text: ""}, style: "stroke-dasharray: 5 5" },
		{ type: "arrow",	from: {id: "S1"					}, 	to: {id: "S2"					}, label: {text: "tmaxI"} },
		{ type: "arrow",	from: {id: "S2"					}, 	to: {id: "I"					}, label: {text: "tmaxI"} },
		{ type: "arrow",	from: {id: "I"					}, 	to: {x:	385, y: 385				}, label: {text: "ke"} },
		{ type: "arrow",	from: {id: "I",		angle:  20	}, 	to: {id: "x3",	angle:  -110	}, label: {text: "SIE"} },
		{ type: "arrow",	from: {id: "I",		angle:  10	}, 	to: {id: "x1",	angle:  -120	}, label: {text: "SIT"} },
		{ type: "arrow",	from: {id: "I",		angle:  0	}, 	to: {id: "x2",	angle:  -135	}, label: {text: "SID"} },
		{ type: "arrow",	from: {id: "x3"					}, 	to: {x:485, 	y:285			}, label: {text: "ka3"} },
		{ type: "arrow",	from: {id: "x1"					}, 	to: {x:585, 	y:285			}, label: {text: "ka1"} },
		{ type: "arrow",	from: {id: "x2"					}, 	to: {x:685, 	y:285			}, label: {text: "ka2"} },
		{ type: "arrow",	from: {id: "D1"					}, 	to: {id: "D2"					}, label: {text: "tmaxG"} },
		{ type: "arrow",	from: {id: "D2"					}, 	to: {id: "Ra"					}, label: {text: "tmaxG"} },
		{ type: "arrow",	from: {id: "D2"					}, 	to: {x: 285, y: 85				}, label: {text: "tmaxG"} },
		{ type: "arrow",	from: {id: "Ra",	angle:  0	}, 	to: {id: "Q1",	angle:  120		}, },
		{ type: "arrow",	from: {id: "x3",	angle:  105	}, 	to: {id: "EGP",	angle:  -15		}, style: "stroke-dasharray: 5 5" },
		{ type: "arrow",	from: {id: "EGP"				}, 	to: {id: "Q1"					}, },
		{ type: "arrow",	from: {x: 250, y:150			}, 	to: {id: "EGP"					}, label: {text: "EGP0"} },
		{ from: {id: "Q1"}, 	to: {id: "G"} },
	],

	inputs: {
		"CHO":	{ to: {id: "D1", angle: 0 } },
		"iir":	{ to: {id: "S1", angle: 0 } },
	},

}
</svg>