<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import {defineAsyncComponent} from "vue";

// find all controller components in folder and load them dynamically
const controllerList = require.context('./controllers/', false, /$/, 'lazy').keys().map(x => { return x.match(/\w+/)[0]})
let controllerComponents = {};
let controllerInfo = {};
for (let i=controllerList.length-1; i>=0; i--) {
	const key = controllerList[i];
	// import module dynamically, tell webpack how to name the chunk 
	let controller = import(
		/* webpackChunkName: "controllers_[request]" */ 
		/* webpackMode: "lazy" */
		/* webpackExports: ["default"] */
		`./controllers/${key}.vue`
	)
	// store component (default export) for async load
	controllerComponents[key] = defineAsyncComponent(() => controller)
	// fetch meta information (profile) to list controller in dropdown menu
	controller.then( (result) => {
		if (typeof result.profile !== "undefined") {
			controllerInfo[key] = result.profile
		}
		else {
			console.log("missing meta information of controller " + key)
		}
	}) 

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
			controllerInfo: controllerInfo,
			controllerList: controllerList,
			selectedController: "Oref0",
		}
	},

	updated() {
		this.selectionChanged()
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
				<option v-for="controller in controllerInfo" 
					:key="controller.id"
					:value="controller.id">{{controller.name}}
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
