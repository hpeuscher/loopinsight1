<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import ImportController from "../../util/ImportController.js"

export const profile = {
	id: "MealBolus",
	version: "0.3.0",
}

export default {
	props: {
		patient: Object,
	},
	
	emits: ["controllerChanged"],

	controller: {},

	data() {
		return {
			carbFactor: 1,
			preBolusTime: 15,
		}
	},

	async mounted() {
		const loadController = ImportController("MealBolus", "0.2.0")
		const ControllerMealBolus = await loadController()
		this.controller = new ControllerMealBolus(this.$data)
		this.valueChanged()
	},

	methods: {
		valueChanged() {
			this.controller.carbFactor = this.carbFactor
			this.controller.preBolusTime = this.preBolusTime
			this.$emit("controllerChanged", this.controller)
		},
		
		getController() {
			return this.controller
		},

	},
}
</script>


<template>
	<div id="controlleroptions" class="parameterlist">
		<ul>
			<li class="item">
				<label for="CarbFactor">
					<div class="item-description">{{$t("CarbFactor")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="carbFactor" 
							min="0" step="0.1" 
							@change="valueChanged">
					</div>
					<div class="item-unit">U/(10g CHO)</div>
				</label>
			</li>
			<li class="item">
				<label for="PreBolusTime">
					<div class="item-description">{{$t("PreBolusTime")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="preBolusTime" 
							min="0" step="5" 
							@change="valueChanged">
					</div>
					<div class="item-unit">min</div>
				</label>
			</li>
		</ul>
	</div>
</template>


<i18n locale="en">
{
	"name": "Only meal bolus",
	"CarbFactor": "carb factor",
	"PreBolusTime": "time between bolus and meal",
}
</i18n>

<i18n locale="de">
{
	"name": "Nur Mahlzeitenbolus",
	"CarbFactor": "KE-Faktor",
	"PreBolusTime": "Spritz-Ess-Abstand",
}
</i18n>
