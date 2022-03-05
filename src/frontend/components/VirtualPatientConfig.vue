<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import {defineAsyncComponent} from "vue";

export default {
	emits: ["patientChanged"],
	data() {
		return {
			boxactive: false,	// open accordion
			modelList: {
				// todo: detect automatically
				uvapadova: {
					id: "uvapadova",
					filename: "VirtualPatientUvaPadova",
					version: "1.0.0",
				},
			},
			modelId: "uvapadova",	// active selection
			modelVersion: "1.0.0",	// active selection
			patient: {},
		}
	},
	methods: {
		patientChanged(newPatient) {
			this.patient = newPatient;
			this.$emit("patientChanged", newPatient);
		},
		getPatient() {
			return this.$refs.patient;
		},
		loadPatient(event) {
			console.log("load virtual patient");
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
				if (Object.values(this.modelList).map((x)=>x.id).includes(content.id)) {
					this.modelId = content.id;
					//todo: version
					this.$refs.patient.setParams(content.data);
				}
			});
			reader.readAsText(event.target.files[0]);
		},
		savePatient() {
			// save virtual patient as JSON file
			let filename = 'LT1VirtualPatient.json';
			let content = 'data:text/plain;charset=utf-8,' 
				+ encodeURIComponent(JSON.stringify({
					id: this.modelId,
					version: this.modelVersion,
					created: Date.now,
					data: this.$refs.patient.getData(),
			}));
			let element = document.getElementById('savepatientdownload');
			element.setAttribute('href', content);
			element.setAttribute('download', filename);
			element.click();
		},
	},
	computed: {
		modelType () {
			// select physiological model component
			return defineAsyncComponent(() => 
				// todo: check version
				import("./"+this.modelList[this.modelId].filename+".vue"))
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
			<select id="model" v-model="modelId" @change="onSelectChange">
				<option v-for="model in modelList"
					:key="model.id"
					:value="model.id"
					:innerText="$t(model.id)"
				></option>
			</select>
		</p>
		<component :is="modelType" 
			@patientChanged="patientChanged" 
			ref="patient" />
	</div>
</template>

}


<i18n locale="en">
{
	"model": "Choose physiological model",
	"patientsettings": "Virtual Patient",
	"uvapadova": "UVA/Padova mockup",
	"savepatient": "save patient",
	"loadpatient": "load patient",
}
</i18n>

<i18n locale="de">
{
	"model": "Physiologisches Modell auswählen",
	"patientsettings": "Virtuelle Patient:in",
	"uvapadova": "UVA/Padova Nachbau",
	"savepatient": "Patient:in speichern",
	"loadpatient": "Patient:in laden",
}
</i18n>
