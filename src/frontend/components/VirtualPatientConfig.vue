<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import {defineAsyncComponent} from "vue";

// find all model components in folder and load them dynamically
const modelList = require.context('./models/', false, /$/, 'lazy').keys().map(x => { return x.match(/\w+/)[0]})
let modelComponents = {};
let modelInfo = {}
for (let i=modelList.length-1; i>=0; i--) {
	const key = modelList[i];
	// import module dynamically, tell webpack how to name the chunk 
	let model = import(
		/* webpackChunkName: "models_[request]" */ 
		/* webpackMode: "lazy" */
		/* webpackExports: ["default"] */
		`./models/${key}.vue`
	)
	// store component (default export) for async load
	modelComponents[key] = defineAsyncComponent(() => model)
	// fetch meta information (profile) to list model in dropdown menu
	model.then( (result) => {
		if (typeof result.profile !== "undefined") {
			modelInfo[key] = result.profile
		}
		else {
			console.log("missing meta information of model " + key)
		}	
	}) 
}

export default {
	emits: ["patientChanged"],

	components: modelComponents,

	data() {
		return {
			boxactive: false,	// open accordion box
			modelInfo: modelInfo,
			modelList: modelList,
			selectedModel: "UvaPadova",
		}
	},

	updated() {
		this.selectionChanged()
	},

	methods: {

		getPatient() {
			return this.getPatientView().patient
		},
		
		getPatientView() {
			return this.$refs["model"]
		},
		
		selectionChanged() {
			this.patientChanged(this.getPatient())
		},

		patientChanged(newPatient) {
			this.$emit("patientChanged", newPatient)
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
					this.getPatientView().setParameters(content.parameters);
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
					v-tooltip="{content: $t('online_info_tooltip')+' '+selectedModel}"
					target="_blank">
					{{$t("online_info")}}
				</a>
			</small></span>
		</p>
		<Suspense>
			<component
				@patientChanged="patientChanged"
				:is="selectedModel"
				ref="model"
			/>
		</Suspense>
	</div>
</template>

}

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
	online_info_tooltip	: "follow this link to learn more about the model",
}
</i18n>

<i18n locale="de">
{
	"model"				: "Physiologisches Modell auswählen",
	"patientsettings"	: "Virtuelle Patient:in",
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
	online_info_tooltip	: "Unter diesem Link finden Sie Details zum Modell",
}
</i18n>
