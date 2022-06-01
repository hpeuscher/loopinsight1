<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import ControllerBasalBolus from '../../../core/controllers/BasalBolus.js';

export default {
	props: {
		patient: Object,
	},
	
	emits: ["controllerChanged"],

	data() {
		return {
			version: "1.0.0",
			name: "",
			useBolus: true,
			PreBolusTime: 30,
			CarbFactor: 1.5,
			IIRb: 0,
			bolus: 0,
		}
	},

	watch: {
		"patient.IIReq": {
			handler: function(val) { 
				this.IIRb = Math.round(val*20)/20
				this.valueChanged()
			},
			immediate: true,
		}
	},

	beforeMount() {
		this.name = this.$t("name");
	},

	mounted() {
		this.valueChanged()
	},

	methods: {
		valueChanged() {
			this.$emit("controllerChanged", this.getController())
		},
		
		getController() {
			let controller = new ControllerBasalBolus()
			controller.setParameters(
				this.IIRb,
				this.useBolus, 
				this.PreBolusTime, 
				this.CarbFactor
			)
			return controller
		},

	},
}
</script>


<template>
	<div id="controlleroptions" class="parameterlist">
		<ul>
			<li class="item">
				<label for="IIRb">
					<div class="item-description">{{$t("IIRb")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="IIRb" 
							id="IIRb" min="0" step="0.05" 
							@change="valueChanged">
					</div>
					<div class="item-unit">U/h</div>
				</label>
			</li>
			<li class="item">
				<label for="useBolus">
					<div class="item-description">{{$t("useBolus")}}</div>
					<div class="item-input">
						<input type="checkbox" v-model="useBolus"
							id="useBolus" 
							@change="valueChanged">
					</div>
					<div class="item-unit"></div>
				</label>
			</li>
			<li class="item" v-bind:class="{disabled: !useBolus}">
				<label for="CarbFactor">
					<div class="item-description">{{$t("CarbFactor")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="CarbFactor" 
							id="CarbFactor" min="0" step="0.1" 
							@change="valueChanged">
					</div>
					<div class="item-unit">U/(10g CHO)</div>
				</label>
			</li>
			<li class="item" v-bind:class="{disabled: !useBolus}">
				<label for="PreBolusTime">
					<div class="item-description">{{$t("PreBolusTime")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="PreBolusTime" 
							id="PreBolusTime" min="0" step="5" 
							@change="valueChanged">
					</div>
					<div class="item-unit">min</div>
				</label>
			</li>
		</ul>
	</div>
</template>


<style scoped>
.disabled {
	pointer-events: none;
    opacity: 0.4;
}
</style>


<i18n locale="en">
{
	"name": "Basal rate + bolus",
	"IIRb": "basal rate",
	"useBolus": "bolus with meal",
	"CarbFactor": "carb factor",
	"PreBolusTime": "time between bolus and meal",
}
</i18n>
<i18n locale="de">
{
	"name": "Basalrate + Bolus",
	"IIRb": "Basalrate",
	"useBolus": "Bolus zur Mahlzeit",
	"CarbFactor": "KE-Faktor",
	"PreBolusTime": "Spritz-Ess-Abstand",
}
</i18n>
