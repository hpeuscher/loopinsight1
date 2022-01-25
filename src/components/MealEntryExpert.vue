<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

export default {
	emits: ["mealChanged", "mealDelete"],
	
	props: {
		id: Number,		// number
		meal: Object,
	},
	
	methods: {
		changed() {
			this.$emit("mealChanged", JSON.parse(JSON.stringify(this.meal)));
		},
		
		mealDelete() {
			this.$emit("mealDelete", this.meal);
		},
	},
	
	beforeMount() {
		if (typeof this.meal.announcement == "undefined") {
			this.meal.announcement = {
					start: this.meal.actual.start, 	// time
					carbs: 0, 						// in g
					time: 0,						// time: from the start
				};
		}
	},

}
</script>


<template>
	<h4>{{$t('meal')}} #{{id}}
		<input type="button" style="margin-left:1em;"
			:value="$t('delete')" 
			@click="mealDelete">
	</h4>
	
	<ul style="padding-left:0;">
		<li>{{$t("announcedmeal")}}:</li>
		<ul>
			<li v-tooltip="$t('announcement.start_TT')">
				<div class="meallabel">{{$t("announcement.start")}}:</div>
				<div class="mealvalue"><input type="Number" min="0" 
					v-model.number="meal.announcement.start" 
					@change="changed"></div>
			</li>
			<li v-tooltip="$t('announcement.carbs_TT')">
				<div class="meallabel">{{$t("announcement.carbs")}}:</div>
				<div class="mealvalue"><input type="Number" min="0" 
					v-model.number="meal.announcement.carbs" 
					@change="changed"
					></div>
			</li>
			<li v-tooltip="$t('announcement.time_TT')">
				<div class="meallabel">{{$t("announcement.time")}}:</div>
				<div class="mealvalue"><input type="Number" min="0" 
					v-model.number="meal.announcement.time" 
					@change="changed"
					></div>
			</li>
		</ul>
		<li>{{$t("actualmeal")}}:</li>
		<ul>
			<li v-tooltip="$t('actual.start_TT')">
				<div class="meallabel">{{$t("actual.start")}}:</div>
				<div class="mealvalue"><input type="Number" min="0" 
					v-model.number="meal.actual.start" 
					@change="changed"
					></div>
			</li>
			<li v-tooltip="$t('actual.carbs_TT')">
				<div class="meallabel">{{$t("actual.carbs")}}:</div>
				<div class="mealvalue"><input type="Number" min="0" 
					v-model.number="meal.actual.carbs" 
					@change="changed"
					></div>
			</li>
			<li v-tooltip="$t('actual.duration_TT')">
				<div class="meallabel">{{$t("actual.duration")}}:</div>
				<div class="mealvalue"><input type="Number" min="1" 
					v-model.number="meal.actual.duration" 
					@change="changed"
					></div>
			</li>
		</ul>
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
	"actualmeal"			: "actual meal",
	"announcedmeal"			: "announced meal",
	"actual.start"			: "start time",
	"actual.carbs"			: "carbs",
	"actual.duration"		: "duration",
	"announcement.start"	: "start time",
	"announcement.carbs"	: "carbs",
	"announcement.time"		: "time",
	"actual.start_TT"		: "time when the meal actually started",
	"actual.carbs_TT"		: "mass of carbohydrates actually ingested",
	"actual.duration_TT"	: "actual duration of the meal",
	"announcement.start_TT"	: "time for which the start of the meal was announced",
	"announcement.carbs_TT"	: "announced (estimated) mass of carbohydrates",
	"announcement.time_TT"	: "time at which this meal is announced; from this instant on, the algorithm knows about the upcoming meal. If the announcement time is later than the actual start, the meal is unannounced.",
}
</i18n>

<i18n locale="de">
{
	"meal"					: "Mahlzeit",
	"delete"				: "löschen",
	"actualmeal"			: "Tatsächliche Mahlzeit",
	"announcedmeal"			: "Ankündigung",
	"actual.start"			: "Beginn",
	"actual.carbs"			: "CHO",
	"actual.duration"		: "Dauer",
	"announcement.start"	: "Beginn",
	"announcement.carbs"	: "CHO",
	"announcement.time"		: "Zeitpunkt",
	"actual.start_TT"		: "Zeitpunkt, zu dem die Mahlzeit tatsächlich beginnt",
	"actual.carbs_TT"		: "Masse der tatsächlich aufgenommenen Kohlenhydrate",
	"actual.duration_TT"	: "Tatsächliche Dauer der Mahlzeit",
	"announcement.start_TT"	: "Zeitpunkt, für den der Beginn der Mahlzeit angekündigt war",
	"announcement.carbs_TT"	: "Masse der angekündigten Kohlenhydrate",
	"announcement.time_TT"	: "Zeitpunkt der Ankündigung. Liegt er nach dem tatsächlichen Beginn, handelt es sich um eine unangekündigte Mahlzeit.",
}
</i18n>
