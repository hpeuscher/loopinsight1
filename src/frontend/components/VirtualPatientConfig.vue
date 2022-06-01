<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import {defineAsyncComponent} from "vue";

// find all model components in folder and load them dynamically
const modelList = require.context('./models/', false, /$/).keys().map(x => { return x.match(/\w+/)[0]})
let modelComponents = {};
for (let i=modelList.length-1; i>=0; i--) {
	const key = modelList[i];
	modelComponents[key] = defineAsyncComponent(() => import("./models/"+key+".vue"))
}

export default {
	emits: ["patientChanged"],

	components: modelComponents,

	data() {
		return {
			boxactive: false,	// open accordion box
			modelInfo: {},
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
			return this.modelInfo[this.selectedModel].ref
		},
		
		selectionChanged() {
			this.patientChanged(this.getPatient())
		},

		patientChanged(newPatient) {
			this.$emit("patientChanged", newPatient)
		},
		
		// during rendering of model components, store information
		// about them (including translated name)
		setModelRef(el) {
			if (el) {
				const id = el.$["vnode"].key
				if (!this.modelInfo.hasOwnProperty(id)) {
					this.modelInfo[id] = {
						filename: id,
						id: el.id,
						name: el.name, 
						version: el.version,
						ref: el,
					}
				}
			}
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
		</p>
		<Suspense>
			<component v-for="model in modelList"
				:key="model"
				@patientChanged="patientChanged"
				:ref="setModelRef"
				:is="model"
				v-show="selectedModel === model"/>
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
		"Gp"			: "Glukose-Konzentration im Gewebe",
	},
}
</i18n>
