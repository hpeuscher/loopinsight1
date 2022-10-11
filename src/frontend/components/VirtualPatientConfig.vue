<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import countDecimals from "../../common/CountDecimals.js"

export default {
	emits: ["patientChanged"],

	data() {
		return {
			boxactive: false,	// open accordion box
			modelInfo: __LT1_LOCAL_MODELS__,	// provided by webpack define plugin
			modelImports: {},
			selectedModel: "UvaPadova",
			patient: {},
			tooltipStrings: {},
			htmlStrings: {},
			unitStrings: {},
		}
	},

	computed: {
		modelList: function() { return Object.keys(this.modelInfo) },
	},

	beforeMount() {
		// import module dynamically
		for (const key of this.modelList) {
			this.modelImports[key] = () => import(
				/* webpackChunkName: "models_[request]" */ 
				/* webpackMode: "lazy" */
				`../../core/models/${key}`
			)
		}
	},

	mounted() {
		this.selectionChanged()
	},

	methods: {

		getPatient() {
			return this.patient
		},
		
		selectionChanged() {
			const modelModule = this.modelImports[this.selectedModel]()
			modelModule.then( (model) => {
				this.patient = new model.default(/*
				// todo: find a way to keep values that were changed manually
				// but take care of parameters that have the same name but
				// different unit (e.g. Gpeq in UvaPadova <-> Cambridge)
				JSON.parse(JSON.stringify(this.patient.parameters || {}))
				*/)
				this.tooltipStrings = model.i18n[this.$i18n.locale] || model.i18n[this.$i18n.fallbackLocale] 
				this.htmlStrings = model.html || {}
				this.unitStrings = model.units || {}
				this.valuesChanged()
			})
		},

		valuesChanged() {
			this.computeSteadyState()
			this.$emit("patientChanged", this.patient)
		},

		computeSteadyState() {
			this.patient.computeSteadyState()
		},

		loaddefaultpatient() {
			this.patient.setParameters(this.patient.defaultParameters)
			this.valuesChanged()
		},
		
		setParameters(parameters) {
			this.patient.parameters = Object.assign(this.patient.parameters, 
				JSON.parse(JSON.stringify(parameters)))
		},
		
		stepDistance(key) {
			return Math.pow(10, countDecimals(this.patient.parameters[key]))
		},

		parameterTooltip(key) {
			return this.tooltipStrings[key] || key
		},

		parameterUnit(key) {
			return this.unitStrings[key]
		},

		parameterHtml(key) {
			return this.htmlStrings[key] || key
		},

		loadPatient(event) {
			// import model from uploaded JSON file
			if (typeof event === "undefined") {
				return;
			}
			if (typeof event.target === "undefined") {
				return;
			}
			const reader = new FileReader();
			reader.addEventListener('load', (event) => {
				if (!event.isTrusted) {
					console.error("file not trusted");
					return;
				}
				let content = JSON.parse(decodeURIComponent(event.target.result));
				if (Object.values(this.modelInfo).map((x)=>x.id).includes(content.id)) {
					this.selectedModel = content.id;
					//todo: version
					this.patient.setParameters(content.parameters)
					this.selectionChanged()
				}
				else {
					console.error("unknown model or version");
					return;
				}
			});
			reader.readAsText(event.target.files[0]);
		},
		savePatient() {
			// save virtual patient as JSON file
			const now = new Date()
			const nowString = now.toISOString().split(".")[0].replaceAll("-","")
				.replaceAll("T","_").replaceAll(":","").replaceAll(".","");
			const filename = 'LT1_VirtualPatient_'+this.selectedModel+'_'+nowString+'.json';
			const content = 'data:text/plain;charset=utf-8,' 
				+ encodeURIComponent(JSON.stringify({
					id: this.modelInfo[this.selectedModel].id,
					version: this.modelInfo[this.selectedModel].version,
					created: now.toJSON(),
					data: this.getPatient().parameters}));
			let element = document.getElementById('savepatientdownload');
			element.setAttribute('href', content);
			element.setAttribute('download', filename);
			element.click();
		},
	},
}
</script>


<template>
	<div class="box2 accordionbox" v-bind:class="{boxactive: boxactive}">
		<h3 @click="[boxactive=!boxactive]">{{$t("patientsettings")}}</h3>
		<p style="text-align:center;">
			<input type="button" style="margin-right:1em;"
				:value="$t('savepatient')" 
				@click="savePatient">
			<a id="savepatientdownload" style="display:none" />
			<input id="fileInput" type="file"
				style="display:none;" accept=".json"
				@change="loadPatient"/>
			<input type="button"
				:value="$t('loadpatient')" 
				onclick="document.getElementById('fileInput').click();" />
		</p>
		<p>
			<label for="model" class="labelpre">{{$t("model")}}:</label>
		</p>
		<p style="text-align:center;">
			<select id="model" v-model="selectedModel" @change="selectionChanged">
				<option v-for="model in modelInfo"
					:key="model.id"
					:value="model.id">{{model.name}}
				</option>
			</select>
			<span v-if="selectedModel" style="margin-left:5px;"><small>
				<a :href="'https://lt1.org/models/'+selectedModel" 
					v-tooltip="{content: $t('online_info_tooltip')}"
					target="_blank">
					{{$t("online_info")}}
				</a>
			</small></span>
		</p>
		<div>
			<p style="text-align:center;">
				<input type="button" 
					:value="$t('loaddefaultpatient')" 
					@click="loaddefaultpatient">
			</p>

		</div>
		<div id="patientoptions" class="parameterlist">
			<ul>
				<li v-for="(id) in patient.parameterList" class="item" :key="id">
					<label :for="'param'+id" >
						<div class="item-description"
							v-tooltip="{content: parameterTooltip(id)}">
							<span v-html="parameterHtml(id)"></span>
						</div>
						<div class="item-input">
							<input v-model.number=patient.parameters[id] 
								:id="'param'+id"
								type="number" :min=0
								@change="valuesChanged()"
								:step="stepDistance(id)">
						</div>
						<div class="item-unit">{{parameterUnit(id)}}</div>
					</label>
				</li>	
			</ul>
		</div>
	</div>
</template>

<i18n locale="units">
{
	inputs: {
		"meal"			: "g/min",
		"IIR"			: "U/h",
		"bolus"			: "U",
	},
	outputs: {
		"Gp"			: "mg/dl",
		"Gt"			: "mg/dl",
	},
}
</i18n>

<i18n locale="en">
{
	"model"				: "Choose physiological model",
	"patientsettings"	: "Virtual Patient",
	"loaddefaultpatient": "restore default values",
	"savepatient"		: "save patient",
	"loadpatient"		: "load patient",
	inputs: {
		"meal"			: "carbs intake",
		"IIR"			: "rate of subcutaneous insulin infusion",
		"bolus"			: "insulin bolus",
	},
	outputs: {
		"Gp"			: "glucose concentration in plasma",
		"Gt"			: "glucose concentration in tissue",
	},
	online_info			: "online info",
	online_info_tooltip	: "follow this link to learn more about the model.",
	"experimental"		: "Attention. This model is in an experimental stage.",
}
</i18n>

<i18n locale="de">
{
	"model"				: "Physiologisches Modell auswählen",
	"patientsettings"	: "Virtuelle Patient:in",
	"loaddefaultpatient": "Standardwerte wiederherstellen",
	"savepatient"		: "Patient:in speichern",
	"loadpatient"		: "Patient:in laden",
	inputs: {
		"meal"			: "Einnahme von Kohlenhydraten",
		"IIR"			: "Subkutane Insulin-Zufuhrrate",
		"bolus"			: "Insulin-Bolus",
	},
	outputs: {
		"Gp"			: "Glukose-Konzentration im Plasma",
		"Gt"			: "Glukose-Konzentration im Gewebe",
	},
	online_info			: "Online-Info",
	online_info_tooltip	: "Unter diesem Link finden Sie Details zum Modell.",
	"experimental"		: "Achtung! Dieses Modell ist in einem experimentellen Stadium.",
}
</i18n>
