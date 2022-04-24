<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import {defineAsyncComponent} from "vue";

// find all controller components in folder and load them dynamically
const controllerList = require.context('./controllers/', false, /$/).keys().map(x => { return x.match(/\w+/)[0]})
let controllerComponents = {};
for (let i=controllerList.length-1; i>=0; i--) {
	let key = controllerList[i];
	controllerComponents[key] = defineAsyncComponent(() => import("./controllers/"+key+".vue"))
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
			controllerInfo: {},
			controllerList: controllerList,
			selectedController: controllerList[0],
		}
	},

	updated() {
		this.selectionChanged()
	},

	methods: {
		getController() {
			return this.controllerInfo[this.selectedController].ref.controller
		},

		selectionChanged() {
			this.controllerChanged(this.getController())
		},

		controllerChanged(newController) {
			this.$emit("controllerChanged", newController)
		},

		// during rendering of controller components, store information
		// about them (including translated name)
		setControllerRef(el) {
			if (el) {
				const id = el.$["vnode"].key
				if (!this.controllerInfo.hasOwnProperty(id)) {
					this.controllerInfo[id] = {
						id: id,
						name: el.name, 
						version: el.version,
						ref: el,
					}
				}
			}
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
			<component v-for="controller in controllerList"
				:key="controller"
				:patient="patient" 
				@controllerChanged="controllerChanged"
				:ref="setControllerRef"
				:is="controller"
				v-show="selectedController === controller"/>
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
