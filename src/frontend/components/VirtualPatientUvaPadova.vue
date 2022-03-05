<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import VirtualPatientUvaPadova from '../../core/VirtualPatientUvaPadova.js';


// utility function to find significant digit 
// (used for comfortable choice of step size in numeric inputs)
// cf. https://stackoverflow.com/a/27082406
var countDecimals = function(value) {
	let text = Number(value).toExponential();
	let [head, trail] = text.split('e');
	let deg = parseInt(trail, 10);
	if (head.indexOf('.') > -1) {
		let [, trail2] = head.split('.');
		deg = deg - trail2.length;
	}
	return deg;
};

export default {
	emits: ["patientChanged"],
	data() {
		return {
			patient: new VirtualPatientUvaPadova(),
		}
	},
	mounted() {
		this.computeSteadyState();
	},
	methods: {

		// compute derivatives (returns array)
		derivatives(_t, _x, _u) {
			return [];
		},
		computeSteadyState() {
			this.patient.computeSteadyState();
			this.$emit("patientChanged", this.patient);
		},
		// compute outputs (returns object)
		outputs(t, x, u) {
			return this.patient.outputs(t, x, u);
		},
		derivatives(t, x, u) {
			return this.patient.derivatives(t, x, u);
		},
		getInitialState() {
			return this.patient.stateToArray(this.patient.xeq);
		},
		stateToObject(x) {
			return this.patient.stateToObject(x);
		},
		stepDistance(key) {
			return Math.pow(10, countDecimals(this.patient.params[key]));
		},
		loaddefaultpatient() {
			this.patient.setParameters(this.patient.defaults);
		},
		setParams(params) {
			console.log(params);
			this.patient.params = Object.assign(this.patient.params, params);
		},
		getData() {
			return this.patient.params;
		},
	},
}
</script>


<template>
	<p style="text-align:center;">
		<input type="button" 
			:value="$t('loaddefaultpatient')" 
			@click="loaddefaultpatient">
	</p>
	<div id="patientoptions" class="parameterlist">
		<ul>
			<li v-for="(param,id) in patient.paramList" class="item" :key="id">
				<label :for="'param'+id" >
					<div class="item-description"
						v-tooltip="{content: $t('params.'+id)}">
						<span v-html="$t('params.'+id,'html')"></span>
					</div>
					<div class="item-input">
						<input v-model.number=patient.params[id] 
							:id="'param'+id"
							type="number" :min=0
							@change="computeSteadyState()"
							:step="stepDistance(id)">
					</div>
					<div class="item-unit">{{param.unit}}</div>
				</label>
			</li>	
		</ul>
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
		"XL"	: "pmol/l",
		"I_"	: "pmol/l",
		"X"		: "pmol/l",
		"Isc1"	: "pmol/kg",
		"Isc2"	: "pmol/kg",
	},
	inputs: {
		"meal"	: "g/min",
		"IIR"	: "U/h",
		"bolus"	: "U",
	},
	outputs: {
		"G"		: "mg/dl",
	},
	params: {
		"BW"	: "kg",
		"VG" 	: "dl/kg",
		"k1" 	: "1/min",
		"k2" 	: "1/min",
		"VI" 	: "l/kg",
		"m1" 	: "1/min",
		"m2" 	: "1/min",
		"m4" 	: "1/min",
		"m5" 	: "min*kg/pmol",
		"m6" 	: "1",
		"HEb" 	: "1",
		"kmax" 	: "1/min",
		"kmin" 	: "1/min",
		"kabs" 	: "1/min",
		"kgri" 	: "1/min",
		"f" 	: "1",
		"kp1" 	: "mg/kg/min",
		"kp2" 	: "1/min",
		"kp3"	: "mg/kg per pmol/l",
		"kp4"	: "mg/kg/min per pmol/kg",
		"ki"	: "1/min",
		"Fcns"	: "mg/kg/min",
		"Vm0"	: "mg/kg/min",
		"Vmx"	: "mg/kg/min per pmol/l",
		"Km0"	: "mg/kg",
		"p2u"	: "1/min",
		"ke1"	: "1/min",
		"ke2"	: "mg/kg",
		"ka1"	: "1/min",
		"ka2"	: "1/min",
		"kd" 	: "1/min",
	},
	inputs: {
		"RaI"	: "pmol/kg/min",	
		"E"		: "mg/kg/min",
		"EGP"	: "mg/kg/min",
		"Uid"	: "mg/kg/min",
		"Uii"	: "mg/kg/min",
		"I"		: "pmol/l",
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
		"Isc2"	: "I<sub>sc1</sub>",
	},
	params: {
		"BW"	: "BW",
		"VG" 	: "V<sub>G</sub>",
		"k1" 	: "k<sub>1</sub>",
		"k2" 	: "k<sub>2</sub>",
		"VI" 	: "V<sub>I</sub>",
		"m1" 	: "m<sub>1</sub>",
		"m2" 	: "m<sub>2</sub>",
		"m4" 	: "m<sub>4</sub>",
		"m5" 	: "m<sub>4</sub>",
		"m6" 	: "m<sub>6</sub>",
		"HEb" 	: "HE<sub>b</sub>",
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
	inputs: {
		"meal"		: "carbs intake",
		"IIR"		: "rate of subcutaneous insulin infusion",
		"bolus"		: "insulin bolus",
	},
	outputs: {
		"G"			: "glucose concentration",
	},
	params: {
		"BW"		: "body weight",
		"VG" 		: "distribution volume of glucose",
		"k1" 		: "rate parameter from Gp to Gt",
		"k2" 		: "rate parameter from Gt to Gp",
		"VI" 		: "distribution volume of insulin",
		"m1" 		: "rate parameter from Il to Ip",
		"m2" 		: "rate parameter from Ip to Il",
		"m4" 		: "rate parameter from Ip to periphery",
		"m5" 		: "rate parameter of hepatic extraction (slope)",
		"m6" 		: "rate parameter of hepatic extraction (offset)",
		"HEb" 		: "steady-state hepatic extraction of insulin",
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
	inputs: {
		"meal"		: "Einnahme von Kohlenhydraten",
		"IIR"		: "Subkutane Insulin-Zufuhrrate",
		"bolus"		: "Insulin-Bolus",
	},
	outputs: {
		"G"			: "Glukose-Konzentration",
	},
	params: {
		"BW"		: "Körpergewicht",
		"VG" 		: "Verteilungsvolumen der Glukose",
		"k1" 		: "Übergangsgeschwindigkeit von Gp nach Gt",
		"k2" 		: "Übergangsgeschwindigkeit von Gt nach Gp",
		"VI" 		: "Verteilungsvolumen des Insulins",
		"m1" 		: "Übergangsgeschwindigkeit von Il nach Ip",
		"m2" 		: "Übergangsgeschwindigkeit von Ip nach Il",
		"m4" 		: "Übergangsgeschwindigkeit von Ip in die Peripherie",
		"m5" 		: "Geschwindigkeit der hepatischen Extraction (Steigung)",
		"m6" 		: "Geschwindigkeit der hepatischen Extraction (Offset)",
		"HEb" 		: "Hepatische Insulin-Extraktion im Gleichgewicht",
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
