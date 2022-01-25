<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import {defineAsyncComponent} from "vue";

export default {
	props: {
		patient: Object
	},

	components: {
		// todo: lazy loading
		ControllerOref0: defineAsyncComponent(() => 
			import("./ControllerOref0.vue")), 
		ControllerBasalBolus: defineAsyncComponent(() => 
			import("./ControllerBasalBolus.vue")), 
	},

	emits: ["controllerChanged"],

	data() {
		return {
			boxactive: false,
			controller: {},
			controllerList: {
				// todo: detect automatically
				basalbolus: {
					id: "basalbolus",
					filename: "ControllerBasalBolus",
					version: "1.0.0"
				},
				oref0: {
					id: "oref0",
					filename: "ControllerOref0",
					version: "1.0.0"
				},
			},
			controllerId: "oref0",
		}
	},

	methods: {
		controllerChanged(newController) {
			this.controller = newController;
			this.$emit("controllerChanged", newController);
		},

		getController() {
			return this.controller;
		},
	},

	computed: {
		activeController() {
			return this.controllerList[this.controllerId].filename;
		},
	}
}
</script>


<template>
	<div class="box2 accordionbox" v-bind:class="{boxactive: boxactive}">
		<h3 @click="[boxactive=!boxactive]">{{$t("controllersettings")}}</h3>
		<p>
			<label for="algorithm" class="labelpre">{{$t("selectalgo")}}</label>
		</p>
		<p style="text-align:center;">
			<select id="algorithm" v-model="controllerId">
				<option v-for="controller in controllerList"
					:key="controller.id"
					:value="controller.id"
					:innerText="$t(controller.id)"
				></option>
			</select>
		</p>
		<component :is="activeController" 
			v-bind:patient="patient" 
			@controllerChanged="controllerChanged">
		</component>
		<div id="controlleroptions"></div>
	</div>
</template>


<i18n locale="en">
{
	"controllersettings": "Algorithm",
	"selectalgo": "Select algorithm / device / treatment",
	"basalbolus": "Basal rate + bolus",
	"oref0": "OpenAPS (oref0)",
}
</i18n>

<i18n locale="de">
{
	"controllersettings": "Algorithmus",
	"selectalgo": "Algorithmus / Gerät wählen",
	"basalbolus": "Basalrate + Bolus",
	"oref0": "OpenAPS (oref0)",
}
</i18n>
