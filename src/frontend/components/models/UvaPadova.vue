<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import VirtualPatientUvaPadova from '../../../core/models/UvaPadova.js';

import countDecimals from "../../../common/CountDecimals.js"

export const profile = {
	id: "UvaPadova",
	version: "0.2.0",
	name: "UVA/Padova mockup",
}

export default {
	emits: ["patientChanged"],
	data() {
		return {
			...profile,
			patient: new VirtualPatientUvaPadova(),
		}
	},
	beforeMount() {
		this.name = this.$t("name");
	},
	mounted() {
		this.computeSteadyState();
	},
	methods: {
		computeSteadyState() {
			this.patient.computeSteadyState();
			this.$emit("patientChanged", this.patient);
		},
		stepDistance(key) {
			return Math.pow(10, countDecimals(this.patient.parameters[key]));
		},
		loaddefaultpatient() {
			this.patient.setParameters(this.patient.defaults);
		},
		setParameters(parameters) {
			this.patient.parameters = Object.assign(this.patient.parameters, 
				JSON.parse(JSON.stringify(parameters)));
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
		"Gp"	: "mg/kg",
		"Gt"	: "mg/kg",
		"Ip"	: "pmol/kg",
		"Il"	: "pmol/kg",
		"Qsto1"	: "mg",
		"Qsto2"	: "mg",
		"Qgut"	: "mg",
		"XL"	: "pmol/L",
		"I_"	: "pmol/L",
		"X"		: "pmol/L",
		"Isc1"	: "pmol/kg",
		"Isc2"	: "pmol/kg",
	},
	parameters: {
		"BW"	: "kg",
		"Gpeq"	: "mg/kg",
		"VG" 	: "dL/kg",
		"k1" 	: "1/min",
		"k2" 	: "1/min",
		"VI" 	: "l/kg",
		"m1" 	: "1/min",
		"m2" 	: "1/min",
		"m4" 	: "1/min",
		"m5" 	: "min*kg/pmol",
		"m6" 	: "1",
		"HEeq" 	: "1",
		"kmax" 	: "1/min",
		"kmin" 	: "1/min",
		"kabs" 	: "1/min",
		"kgri" 	: "1/min",
		"f" 	: "1",
		"kp1" 	: "mg/kg/min",
		"kp2" 	: "1/min",
		"kp3"	: "mg/kg per pmol/L",
		"kp4"	: "mg/kg/min per pmol/kg",
		"ki"	: "1/min",
		"Fcns"	: "mg/kg/min",
		"Vm0"	: "mg/kg/min",
		"Vmx"	: "mg/kg/min per pmol/L",
		"Km0"	: "mg/kg",
		"p2u"	: "1/min",
		"ke1"	: "1/min",
		"ke2"	: "mg/kg",
		"ka1"	: "1/min",
		"ka2"	: "1/min",
		"kd" 	: "1/min",
	},
	signals: {
		"RaI"	: "pmol/kg/min",	
		"E"		: "mg/kg/min",
		"EGP"	: "mg/kg/min",
		"Uid"	: "mg/kg/min",
		"Uii"	: "mg/kg/min",
		"I"		: "pmol/L",
		"Qsto"	: "mg",
		"Ra"	: "mg/kg/min",
		"S"		: "pmol/kg/min",
		"HE"	: "1",
		"m3"	: "1/min",
	},
}
</i18n>

<i18n locale="html">
{
	states: {
		"Gp"	: "G<sub>p</sub>",
		"Gt"	: "G<sub>t</sub>",
		"Ip"	: "I<sub>p</sub>",
		"Il"	: "I<sub>l</sub>",
		"Qsto1"	: "Q<sub>sto1</sub>",
		"Qsto2"	: "Q<sub>sto2</sub>",
		"Qgut"	: "Q<sub>gut</sub>",
		"XL"	: "X<sub>L</sub>",
		"I_"	: "I'",
		"X"		: "X",
		"Isc1"	: "I<sub>sc1</sub>",
		"Isc2"	: "I<sub>sc2</sub>",
	},
	parameters: {
		"BW"	: "BW",
		"Gpeq"	: "G<sub>p,eq</sub>",
		"VG" 	: "V<sub>G</sub>",
		"k1" 	: "k<sub>1</sub>",
		"k2" 	: "k<sub>2</sub>",
		"VI" 	: "V<sub>I</sub>",
		"m1" 	: "m<sub>1</sub>",
		"m2" 	: "m<sub>2</sub>",
		"m4" 	: "m<sub>4</sub>",
		"m5" 	: "m<sub>4</sub>",
		"m6" 	: "m<sub>6</sub>",
		"HEeq" 	: "HE<sub>eq</sub>",
		"kmax" 	: "k<sub>max</sub>",
		"kmin" 	: "k<sub>min</sub>",
		"kabs" 	: "k<sub>abs</sub>",
		"kgri" 	: "k<sub>gri</sub>",
		"f" 	: "f",
		"kp1" 	: "k<sub>p1</sub>",
		"kp2" 	: "k<sub>p2</sub>",
		"kp3"	: "k<sub>p3</sub>",
		"kp4"	: "k<sub>p4</sub>",
		"ki"	: "k<sub>i</sub>",
		"Fcns"	: "F<sub>cns</sub>",
		"Vm0"	: "V<sub>m0</sub>",
		"Vmx"	: "V<sub>mx</sub>",
		"Km0"	: "K<sub>m0</sub>",
		"p2u"	: "p<sub>2u</sub>",
		"ke1"	: "k<sub>e1</sub>",
		"ke2"	: "k<sub>e2</sub>",
		"ka1"	: "k<sub>a1</sub>",
		"ka2"	: "k<sub>a2</sub>",
		"kd" 	: "k<sub>d</sub>",
	},
	signals: {
		"RaI"	: "R<sub>aI</sub>",
		"E"		: "E",
		"EGP"	: "EGP",
		"Uid"	: "U<sub>id</sub>",
		"Uii"	: "U<sub>ii</sub>",
		"I"		: "I",
		"Qsto"	: "Q<sub>sto</sub>",
		"Ra"	: "R<sub>a</sub>",
		"S"		: "S",
		"HE"	: "HE",
		"m3"	: "m<sub>3</sub>",
	},
}
</i18n>
<i18n locale="en">
{
	"name"			: "UVA/Padova mockup",
	loaddefaultpatient: "restore default values",
	states: {
		"Gp"		: "glucose in plasma",
		"Gt"		: "glucose in tissue",
		"Ip"		: "insulin in plasma",
		"Il"		: "insulin in liver",
		"Qsto1"		: "carbs in stomach, solid phase",
		"Qsto2"		: "carbs in stomach, liquid phase",
		"Qgut"		: "glucose mass in intestine",
		"XL"		: "insulin delay compartment 2",
		"I_"		: "insulin delay compartment 1",
		"X"			: "insulin in the interstitial fluid",
		"Isc1"		: "subcutaneous insulin in compartment 1",
		"Isc2"		: "subcutaneous insulin in compartment 2",
	},
	parameters: {
		"BW"		: "body weight",
		"Gpeq"		: "steady-state of glucose in plasma",
		"VG" 		: "distribution volume of glucose",
		"k1" 		: "rate parameter from Gp to Gt",
		"k2" 		: "rate parameter from Gt to Gp",
		"VI" 		: "distribution volume of insulin",
		"m1" 		: "rate parameter from Il to Ip",
		"m2" 		: "rate parameter from Ip to Il",
		"m4" 		: "rate parameter from Ip to periphery",
		"m5" 		: "rate parameter of hepatic extraction (slope)",
		"m6" 		: "rate parameter of hepatic extraction (offset)",
		"HEeq" 		: "steady-state hepatic extraction of insulin",
		"kmax" 		: "maximal emptying rate of stomach",
		"kmin" 		: "minimal emptying rate of stomach",
		"kabs" 		: "rate constant of intestinal absorption",
		"kgri" 		: "rate of grinding",
		"f" 		: "fraction of intestinal absorption",
		"kp1" 		: "extrapolated at zero glucose and insulin",
		"kp2" 		: "liver glucose effectiveness",
		"kp3"		: "amplitude of insulin action on the liver",
		"kp4"		: "amplitude of portal insulin action on the liver",
		"ki"		: "delay between insulin signal and insulin action",
		"Fcns"		: "glucose uptake by the brain and erythrocytes",
		"Vm0"		: "Michaelis-Menten constant (offset)",
		"Vmx"		: "Michaelis-Menten constant (slope)",
		"Km0"		: "Michaelis-Menten constant (offset)",
		"p2u"		: "insulin action on the peripheral glucose utilization",
		"ke1"		: "glomerular filtration rate",
		"ke2"		: "renal threshold of glucose",
		"ka1"		: "rate constant of nonmonomeric insulin absorption",
		"ka2"		: "rate constant of monomeric insulin absorption",
		"kd" 		: "rate constant of insulin dissociation",
	},
	signals: {
		"RaI"		: "insulin appearance rate",
		"E"			: "renal glucose excretion",
		"EGP"		: "endogenous glucose production",
		"Uid"		: "insulin-dependent glucose utilization",
		"Uii"		: "insulin-independent glucose utilization",
		"I"			: "plasma insulin concentration",
		"Qsto"		: "amount of glucose in the stomach",
		"Ra"		: "appearance rate of glucose in plasma",
		"S"			: "insulin secretion",
		"HE"		: "hepatic extraction",
		"m3"		: "rate constant of insulin degradation in the liver",
	},
}
</i18n>
<i18n locale="de">
{
	"name"			: "UVA/Padova-Modell",
	"loaddefaultpatient": "Standardwerte wiederherstellen",
	states: {
		"Gp"		: "Glukose im Plasma",
		"Gt"		: "Glukose im Gewebe",
		"Ip"		: "Insulin im Plasma",
		"Il"		: "Insulin in der Leber",
		"Qsto1"		: "Kohlenhydrate im Magen, Festphase",
		"Qsto2"		: "Kohlenhydrate im Magen, Flüssigphase",
		"Qgut"		: "Glukose im Darm",
		"XL"		: "Insulin Verzögerungskompartiment 1",
		"I_"		: "Insulin Verzögerungskompartiment 2",
		"X"			: "Insulin in der Interstitialflüssigkeit",
		"Isc1"		: "Subkutanes Insulin im Kompartiment 1",
		"Isc2"		: "Subkutanes Insulin im Kompartiment 2",
	},
	parameters: {
		"BW"		: "Körpergewicht",
		"Gpeq"		: "Glukose im Plasma im Gleichgewicht",
		"VG" 		: "Verteilungsvolumen der Glukose",
		"k1" 		: "Übergangsgeschwindigkeit von Gp nach Gt",
		"k2" 		: "Übergangsgeschwindigkeit von Gt nach Gp",
		"VI" 		: "Verteilungsvolumen des Insulins",
		"m1" 		: "Übergangsgeschwindigkeit von Il nach Ip",
		"m2" 		: "Übergangsgeschwindigkeit von Ip nach Il",
		"m4" 		: "Übergangsgeschwindigkeit von Ip in die Peripherie",
		"m5" 		: "Geschwindigkeit der hepatischen Extraction (Steigung)",
		"m6" 		: "Geschwindigkeit der hepatischen Extraction (Offset)",
		"HEeq" 		: "Hepatische Insulin-Extraktion im Gleichgewicht",
		"kmax" 		: "Maximale Entleerungsrate des Magens",
		"kmin" 		: "Minimale Entleerungsrate des Magens",
		"kabs" 		: "Geschwindigkeit der Absorption im Darm",
		"kgri" 		: "Geschwindigkeit der Zerkleinerung im Magen",
		"f" 		: "Anteil der Absorption im Darm",
		"kp1" 		: "extrapolated at zero glucose and insulin",
		"kp2" 		: "liver glucose effectiveness",
		"kp3"		: "amplitude of insulin action on the liver",
		"kp4"		: "amplitude of portal insulin action on the liver",
		"ki"		: "delay between insulin signal and insulin action",
		"Fcns"		: "glucose uptake by the brain and erythrocytes",
		"Vm0"		: "Michaelis-Menten constant (offset)",
		"Vmx"		: "Michaelis-Menten constant (slope)",
		"Km0"		: "Michaelis-Menten constant (offset)",
		"p2u"		: "insulin action on the peripheral glucose utilization",
		"ke1"		: "glomerular filtration rate",
		"ke2"		: "renal threshold of glucose",
		"ka1"		: "rate constant of nonmonomeric insulin absorption",
		"ka2"		: "rate constant of monomeric insulin absorption",
		"kd" 		: "rate constant of insulin dissociation",
	},
	signals: {
		"RaI"		: "insulin appearance rate",
		"E"			: "renal glucose excretion",
		"EGP"		: "endogenous glucose production",
		"Uid"		: "insulin-dependent glucose utilization",
		"Uii"		: "insulin-independent glucose utilization",
		"I"			: "plasma insulin concentration",
		"Qsto"		: "amount of glucose in the stomach",
		"Ra"		: "appearance rate of glucose in plasma",
		"S"			: "insulin secretion",
		"HE"		: "hepatic extraction",
		"m3"		: "rate constant of insulin degradation in the liver",
	},
}
</i18n>

<svg>
{

	subsystems: [
		{x: 210, y: 110, width: 180, height: 300, fill: "#DDDDFF", label: { text: "insulin subsystem" } },
		{x: 410, y:  10, width: 280, height: 300, fill: "#FFDDDD", label: { text: "glucose subsystem" } },
		{x: -40,  y: 250, width: 230, height: 200, fill: "#DDFFCC", label: { text: "subcutaneous transport" } },
		{x: 60,  y: 10, width: 330, height: 90,  fill: "#FFDD55", label: { text: "meal subsystem" } },
	],

	nodes: {
		"Gp":       { x: 550,   y: 150,     geometry: {shape: "circle", d: 50} },
		"Gt":       { x: 550,   y: 250,     geometry: {shape: "circle", d: 50} },
		"Ip":       { x: 250,   y: 350,     geometry: {shape: "circle", d: 50} },
		"Il":       { x: 350,   y: 350,     geometry: {shape: "circle", d: 50} },
		"Qsto1":    { x: 150,   y: 50,      geometry: {shape: "circle", d: 50} },
		"Qsto2":    { x: 250,   y: 50,      geometry: {shape: "circle", d: 50} },
		"Qgut":     { x: 350,   y: 50,      geometry: {shape: "circle", d: 50} },
		"I_":       { x: 250,   y: 150,     geometry: {shape: "circle", d: 50} },
		"XL":       { x: 350,   y: 150,     geometry: {shape: "circle", d: 50} },
		"X":        { x: 350,   y: 250,     geometry: {shape: "circle", d: 50} },
		"Isc1":     { x:  50,   y: 300,     geometry: {shape: "circle", d: 50} },
		"Isc2":     { x:  50,   y: 400,     geometry: {shape: "circle", d: 50} },

		"G":        { x: 650,   y: 150,     geometry: {shape: "square", d: 40} },
		"Ra":       { x: 450,   y: 50,      geometry: {shape: "square", d: 40} },
		"EGP":      { x: 450,   y: 150,     geometry: {shape: "square", d: 40} },
		"E":        { x: 550,   y: 50,      geometry: {shape: "square", d: 40} },
		"Uid":      { x: 450,   y: 250,     geometry: {shape: "square", d: 40} },
		"Uii":      { x: 650,   y: 50,      geometry: {shape: "square", d: 40} },
		"I":        { x: 250,   y: 250,     geometry: {shape: "square", d: 40} },
		"RaI":      { x: 150,   y: 350,     geometry: {shape: "square", d: 40} },
	},

	connections: [
		{ type: "arrow",	from: {id: "Gp",    angle:  -60		}, 	to: {id: "Gt",		angle: 60	},	label: {text: "k1"} },
		{ type: "arrow",	from: {id: "Gt",    angle:  120		}, 	to: {id: "Gp",		angle: -120	},	label: {text: "k2"} },
		{ type: "arrow",	from: {id: "Qsto1"}, 					to: {id: "Qsto2",				},	label: {text: "kgri"} },
		{ type: "arrow",	from: {id: "Qsto2"}, 					to: {id: "Qgut",				},	label: {text: "kempt"} },
		{ type: "arrow",	from: {id: "Qgut"}, 					to: {id: "Ra",					},	label: {text: "kabs"} },
		{ type: "arrow",	from: {id: "Ra",    angle:  0    	}, 	to: {id: "Gp",		angle: 120 	},	},
		{ type: "arrow",	from: {id: "E",     angle:  270  	}, 	to: {id: "Gp",		angle: 90  	},	},
		{ type: "arrow",	from: {id: "Uii",   angle:  180  	}, 	to: {id: "Gp",		angle: 60  	},	},
		{ type: "arrow",	from: {id: "I_"						}, 	to: {id: "XL"					},	label: {text: "ki"} },
		{ type: "arrow",	from: {id: "I"						}, 	to: {id: "X"					},	label: {text: "p2u"} },
		{ type: "arrow",	from: {id: "I"						}, 	to: {id: "I_"					},	label: {text: ""} },
		{ type: "arrow",	from: {id: "XL"						}, 	to: {id: "EGP"					},	},
		{ type: "arrow",	from: {id: "EGP"}, 						to: {id: "Gp"					},	},
		{ type: "arrow",	from: {x: 450, y: 100, }, 				to: {id: "EGP"					},	label: {text: "kp1"} },
		{ type: "arrow",	from: {id: "Gp",    angle:  150  	}, 	to: {id: "EGP",		angle: 30  	},	label: {text: "kp2"} },
		{ type: "arrow",	from: {id: "X"						}, 	to: {id: "Uid"					},	label: {text: "Vmx"} },
		{ type: "arrow",	from: {x: 450, 	y: 300				},	to: {id: "Uid"					},	label: {text: "Vm0"} },
		{ type: "arrow",	from: {id: "Uid"					}, 	to: {id: "Gt"					},	},
		{ type: "arrow",	from: {id: "Ip",    angle:  30		}, 	to: {id: "Il",		angle: 150 	},	},
		{ type: "arrow",	from: {id: "Il",    angle:  -150	}, 	to: {id: "Ip",		angle: -30 	},	},
		{ type: "arrow",	from: {id: "RaI"					},	to: {id: "Ip",					},	},
		{ type: "arrow",	from: {id: "Isc1",  angle:  -90		}, 	to: {id: "Isc2",	angle: 90  	},	label: {text: "kd"} },
		{ type: "arrow",	from: {id: "Isc1",  angle:  0		}, 	to: {id: "RaI",		angle: 120 	},	label: {text: "ka1"} },
		{ type: "arrow",	from: {id: "Isc2",  angle:  0		}, 	to: {id: "RaI",		angle: -120	},	label: {text: "ka2"} },
		{ from: {id: "Ip", angle: 90}, 	to: {id: "I", angle: -90} },
		{ from: {id: "Gp", angle: 0}, 	to: {id: "G", angle: 180} },
	],

	
	inputs: {
		"CHO":	{ to: {id: "Qsto1", angle: 0 } },
		"iir":	{ to: {id: "Isc1", angle: 0 } },
	},

}
</svg>
