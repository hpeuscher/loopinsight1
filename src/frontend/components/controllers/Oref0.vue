<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import ControllerOref0 from '../../../core/controllers/Oref0.js';
var oref0; // FIXME Referenz zu Controller

export default {
	props: {
		patient: Object,
	},

	emits: ["controllerChanged"],

	data() {
		return {
			version: "1.0.0",
			name: "",
			controller: new ControllerOref0(),
			profile: {
				max_iob: 3.5,
				dia: 6,
				max_daily_basal: 1.3,
				max_basal: 3.5,
				max_bg: 120,
				min_bg: 95,
				sens: 50,
				carb_ratio: 9,
				maxCOB: 120,
			},
			useBolus: true,
			PreBolusTime: 30,
			CarbFactor: 1.5,
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
			this.CarbFactor = Math.round(10 / this.profile.carb_ratio * 100) / 100;
			this.controller.setParameters(this.profile,
				this.useBolus,
				this.PreBolusTime,
				this.CarbFactor)
			this.$emit("controllerChanged", this.controller)
		},
	},
}
</script>


<template>
	<div id="controlleroptions" class="parameterlist">
		<ul>
			<li class="item" v-tooltip="$t('tooltips.useBolus')">
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
			<li class="item" v-tooltip="$t('tooltips.CarbFactor')">
				<label for="CarbFactor">
					<div class="item-description">{{$t("CarbFactor")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="CarbFactor" 
							id="CarbFactor" min="0" step="0.1" class="disabled"
							@change="valueChanged">
					</div>
					<div class="item-unit">U/(10g CHO)</div>
				</label>
			</li>
			<li class="item" v-tooltip="$t('tooltips.PreBolusTime')"
				v-bind:class="{disabled: !useBolus}">
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
			<li><hr></li>
			<li class="item" v-tooltip="$t('tooltips.ISF')">
				<label for="ISF">
					<div class="item-description">{{$t("ISF")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.sens" 
							id="ISF" min="20" step="5" 
							@change="valueChanged">
					</div>
					<div class="item-unit">(mg/dl)/U</div>
				</label>
			</li>
			<li class="item" v-tooltip="$t('tooltips.min_bg')">
				<label for="min_bg">
					<div class="item-description">{{$t("min_bg")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.min_bg" 
							id="min_bg" min="50" step="5" 
							@change="valueChanged">
					</div>
					<div class="item-unit">mg/dl</div>
				</label>
			</li>
			<li class="item" v-tooltip="$t('tooltips.max_bg')">
				<label for="max_bg">
					<div class="item-description">{{$t("max_bg")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.max_bg" 
							id="max_bg" min="100" step="5" 
							change="valueChanged">
					</div>
					<div class="item-unit">mg/dl</div>
				</label>
			</li>
			<li class="item" v-tooltip="$t('tooltips.DIA')">
				<label for="DIA">
					<div class="item-description">{{$t("DIA")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.dia" 
							id="DIA" min="1" step="0.5" 
							@change="valueChanged">
					</div>
					<div class="item-unit">h</div>
				</label>
			</li>
			<li class="item" v-tooltip="$t('tooltips.CR')">
				<label for="CR">
					<div class="item-description">{{$t("CR")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.carb_ratio" 
							id="CR" min="1" step="0.5" 
							@change="valueChanged">
					</div>
					<div class="item-unit">g/U</div>
				</label>
			</li>
			<li class="item" v-tooltip="$t('tooltips.max_iob')">
				<label for="max_iob">
					<div class="item-description">{{$t("max_iob")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.max_iob" 
							id="max_iob" min="1" step="0.1" 
							@change="valueChanged">
					</div>
					<div class="item-unit">U</div>
				</label>
			</li>
			<li class="item" v-tooltip="$t('tooltips.max_basal')">
				<label for="max_basal">
					<div class="item-description">{{$t("max_basal")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.max_basal" 
							id="max_basal" min="1" step="0.1" 
							@change="valueChanged">
					</div>
					<div class="item-unit">U/h</div>
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
	"name": "OpenAPS (oref0)",
	"useBolus": "Patient administers meal bolus",
	"CarbFactor": "carb factor",
	"PreBolusTime": "time between bolus and meal",
	"ISF": "Insulin sensitivity factor (ISF)",
	"min_bg": "minimum BG target",
	"max_bg": "maximum BG target",
	"DIA": "duration of insulin activity (DIA)",
	"CR": "carb ratio (CR)",
	"max_iob": "maximum IOB",
	"max_basal": "maximum basal",
	"tooltips" : {
		"useBolus": "Choose if the virtual patient manually administers a meal bolus.",
		"CarbFactor": "The carb factor defines how much insulin is required to compensate for an amount of carbs. It is coupled with carb ratio.",
		"PreBolusTime": "This defines how much before the meal a bolus is administered.",
		"ISF": "The ISF is used to predict the eventual blood glucose concentration after all remaining insulin on board has taken its effect.",
		"min_bg": "The algorithm tries to keep blood glucose above this value.",
		"max_bg": "The algorithm tries to keep blood glucose below this value.",
		"DIA": "DIA describes how long it takes before insulin that is delivered now has completely taken effect.",
		"CR": "CR is the quotient of carbs and the compensating amount of insulin.",
		"max_iob": "The computed amount of insulin on board (IOB) is capped at this maximum.",
		"max_basal": "The basal rate is capped at this maximum.",
	},
}
</i18n>
<i18n locale="de">
{
	"name": "OpenAPS (oref0)",
	"useBolus": "Bolus zur Mahlzeit",
	"CarbFactor": "KE-Faktor",
	"PreBolusTime": "Spritz-Ess-Abstand",
	"ISF": "Insulin sensitivity factor (ISF)",
	"min_bg": "Untergrenze Zielwert Glukose",
	"max_bg": "Obergrenze Zielwert Glukose",
	"DIA": "Duration of Insulin Activity (DIA)",
	"CR": "carb ratio (CR)",
	"max_iob": "Maximalwert IOB",
	"max_basal": "Maximale Basalrate",
	"tooltips" : {
		"useBolus": "Legt fest, ob vom virtuellen Patienten ein manueller Mahlzeitenbolus abgegeben wird.",
		"CarbFactor": "Der KE-Faktor beschreibt, wie viel Insulin benötigt wird, um eine Kohlenhydrateinheit auszugleichen. Er ist hier an die Einstellung Carb Ratio gekoppelt.",
		"PreBolusTime": "Der Spritz-Ess-Abstand legt fest, wie lange vor der Mahlzeit ein Bolus abgegeben wird.",
		"ISF": "Der ISF dient zur Vorhersage des finalen Glukosespiegels, sobald alles verbleibende Insulin (IOB) seine Wirkung entfaltet hat.",
		"min_bg": "Der Algorithmus versucht den Glukosespiegel über diesem Wert zu halten.",
		"max_bg": "Der Algorithmus versucht den Glukosespiegel unter diesem Wert zu halten.",
		"DIA": "DIA beschreibt, wie lange es dauert, über welchen Zeitraum Insulin, das jetzt abgegeben wird, seine Wirkung entfaltet und abgebaut wird.",
		"CR": "CR is das Verhältnis zwischen Kohlenhydraten und der ausgleichenden Insulinmenge.",
		"max_iob": "Das berechnete im Körper befindliche Insulin (IOB) wird bei diesem Maximum abgeschnitten.",
		"max_basal": "Die Basalrate wird bei diesem Maximum abgeschnitten.",
	},
}
</i18n>
