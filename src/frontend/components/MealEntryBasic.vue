<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import {dateToBrowserLocale} from "../../common/util.js"

export default {
	emits: ["mealChanged", "mealDelete"],

	data() {
		return {
			withAnnouncement: true,
			tStartString: "",
		}
	},
	
	props: {
		id: Number,		// list number of this meal
		meal: Object,	// meal description
		t0: Date,		// simulation start date
	},
	
	computed: {
		t0String() {
			return dateToBrowserLocale(this.t0)
		},
	},

	watch: {
		"meal.actual.start": {
			handler: function(val) { 
				this.tStartString = dateToBrowserLocale(this.meal.actual.start)
			},
			immediate: true,
		}
	},

	methods: {
		changed() {
			this.meal.actual.start = new Date(this.tStartString)
			if (this.withAnnouncement) {
				this.meal.announcement = {
					start: new Date(this.tStartString), 	// time
					carbs: this.meal.actual.carbs, 	// in g
					time: this.t0,					// time: from the start
				};
			}
			else {
				this.meal.announcement = undefined;
			}
			this.$emit("mealChanged", this.meal);
		},
		
		mealDelete() {
			this.$emit("mealDelete", this.meal);
		},
	},
	
	mounted() {
		this.withAnnouncement = false;
		// check if this meal is announced
		if (typeof this.meal.announcement !== "undefined") {
			if (typeof this.meal.announcement.carbs !== "undefined") {
				if (this.meal.announcement.carbs > 0) {
					this.withAnnouncement = true;
				}
			}
		}
		this.changed();
	},
}
</script>


<template>
	<h4>{{$t('meal')}} #{{id}}
		<input type="button" style="margin-left:1em;"
			:value="$t('delete')" 
			@click="mealDelete">
	</h4>
	<ul class="mealentry">
		<li v-tooltip="$t('actual.start_TT')">
			<label for="actual_start" class="meallabel">
				<div>{{$t("actual.start")}}:</div>
				<div class="mealtime">
					<input type="datetime-local" :min="t0String"
					@change="changed" v-model="tStartString">
				</div>
			</label>
		</li>
		<li v-tooltip="$t('actual.carbs_TT')">
			<label for="actual_carbs" class="meallabel">
				<div>{{$t("actual.carbs")}}:</div>
				<div class="mealvalue">
					<input type="Number" min="0"
						@change="changed" v-model.number="meal.actual.carbs">
				</div>
			</label>
		</li>
		<li>
			<label for="withAnnouncement" class="meallabel">
				<div class="meallabel">{{$t("withAnnouncement")}}:</div>
				<div class="mealvalue">
					<input type="checkbox"
						@change="changed" v-model.number="withAnnouncement">
				</div>
			</label>
		</li>
	</ul>
</template>


<style lang="css" scoped>
	h4 {
		margin-bottom: 0.5em;
	}

	ul {
		list-style:none;
		padding-left:1em;
		line-height:1.75em;
	}
		
	.meallabel div {
		display: inline-block;
		width: 150px;
	}
	.mealvalue {
		display: inline-block;
	}
	.mealvalue > input {
		width: 4rem;
		line-height: 1;
	}
	.mealtime > input {
		width: 10rem;
		font-size: 0.8rem;
	}
</style>

}


<i18n locale="en">
{
	"meal"					: "Meal",
	"delete"				: "delete",
	"withAnnouncement"		: "With announcement",
	"actualmeal"			: "actual meal",
	"actual.start"			: "start time",
	"actual.carbs"			: "carbs in g",
	"actual.start_TT"		: "time when the meal actually started",
	"actual.carbs_TT"		: "mass of carbohydrates actually ingested",
}
</i18n>

<i18n locale="de">
{
	"meal"					: "Mahlzeit",
	"delete"				: "löschen",
	"withAnnouncement"		: "Mit Ankündigung",
	"actualmeal"			: "Tatsächliche Mahlzeit",
	"actual.start"			: "Beginn",
	"actual.carbs"			: "Kohlenhydrate in g",
	"actual.start_TT"		: "Zeitpunkt, zu dem die Mahlzeit tatsächlich beginnt",
	"actual.carbs_TT"		: "Masse der tatsächlich aufgenommenen Kohlenhydrate",
}
</i18n>
