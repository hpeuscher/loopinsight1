<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

export default {
	emits: ["mealChanged", "mealDelete"],

	data() {
		return {
			withAnnouncement: true,
		}
	},
	
	props: {
		id: Number,
		meal: Object,
	},
	
	methods: {
		changed() {
			if (this.withAnnouncement) {
				this.meal.announcement = {
					start: this.meal.actual.start, 	// time
					carbs: this.meal.actual.carbs, 	// in g
					time: 0,						// time: from the start
				};
			}
			else {
				this.meal.announcement = undefined;
			}
			this.$emit("mealChanged", JSON.parse(JSON.stringify(this.meal)));
		},
		
		mealDelete() {
			this.$emit("mealDelete", this.meal);
		},
	},
	
	mounted() {
		if (typeof this.meal.announcent != "undefined") {
			this.withAnnouncement = true;
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
	<ul>
		<li v-tooltip="$t('actual.start_TT')">
			<label for="actual_start">
				<div class="meallabel">{{$t("actual.start")}}:</div>
				<div class="mealvalue">
					<input type="Number" min="0" id="actual_start"
					@change="changed" v-model.number="meal.actual.start">
				</div>
			</label>
		</li>
		<li v-tooltip="$t('actual.carbs_TT')">
			<label for="actual_carbs">
				<div class="meallabel">{{$t("actual.carbs")}}:</div>
				<div class="mealvalue">
					<input type="Number" min="0" id="actual_carbs"
						@change="changed" v-model.number="meal.actual.carbs">
				</div>
			</label>
		</li>
		<li>
			<div class="meallabel">{{$t("withAnnouncement")}}:</div>
			<div class="mealvalue">
				<input type="checkbox" id="withAnnouncement"
					@change="changed" v-model.number="withAnnouncement">
			</div>
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
		
	.meallabel {
		display: inline-block;
		width: 180px;
	}
	.mealvalue {
		display: inline-block;
	}
	.mealvalue > input {
		width: 6rem;
		line-height: 1;
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
