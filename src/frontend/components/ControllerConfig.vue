<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import {defineAsyncComponent} from "vue";

// find all local controller components
const controllerList = require.context('./controllers/', false, /$/).keys().map(x => { return x.match(/\w+/)[0]})
let controllerImports = {}
let controllerComponents = {}
for (const key of controllerList) {
	// import module dynamically
	controllerImports[key] = import(`./controllers/${key}.vue`)
	controllerComponents[key] = defineAsyncComponent(() => controllerImports[key])
}

export default {
	props: {
		patient: Object
	},

	components: controllerComponents,

	emits: ["controllerChanged"],

	data() {
		return {
			boxactive: false,	// open accordion box
			controllerProfiles: {},
			selectedController: "Oref0",
		}
	},

	beforeMount() {
		for (const key of controllerList) {
			controllerImports[key].then( (controllerModule) => {
				this.controllerProfiles[key] = controllerModule.profile
				// extract name entry from every locale of i18n
				const nameTranslations = controllerModule.default.__i18n.reduce((x,y)=>({ ...x, [y.locale]: {["name."+key]: y.resource.name}}), {})
				// store these information into our translation resource
				for (const locale in nameTranslations) {
					this.$i18n.mergeLocaleMessage(locale, nameTranslations[locale])
				}
			})
		}
	},

	methods: {
		getController() {
			return this.$refs["controller"].getController()
		},

		selectionChanged() {
			this.controllerChanged(this.getController())
		},

		controllerChanged(newController) {
			this.$emit("controllerChanged", newController)
		},

	},
}
</script>


<template>
	<div class="box2 accordionbox" v-bind:class="{boxactive: boxactive}">
		<h3 @click="[boxactive=!boxactive]">{{$t("controllersettings")}}</h3>
		<p>
			<label for="algorithm" class="labelpre">{{$t("selectalgo")}}</label>
		</p>
		<p style="text-align:center;">
			<select id="algorithm" v-model="selectedController" @change="selectionChanged">
				<option v-for="controller in controllerProfiles" 
					:key="controller.id"
					:value="controller.id">{{$t("name."+controller.id)}}
				</option>
			</select>
		</p>
		<Suspense>
			<component
				:patient="patient" 
				@controllerChanged="controllerChanged"
				ref="controller"
				:is="selectedController"
			/>
		</Suspense>
	</div>
</template>


<i18n locale="en">
{
	"controllersettings": "Algorithm",
	"selectalgo": "Select algorithm / device / treatment",
}
</i18n>

<i18n locale="de">
{
	"controllersettings": "Algorithmus",
	"selectalgo": "Algorithmus / Gerät wählen",
}
</i18n>
