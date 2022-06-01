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
			tActualStartString: "",
			tAnnouncedStartString: "",
			tAnnouncementTimeString: "",
		}
	},
	
	props: {
		id: Number,		// list number of this meal
		meal: Object,	// meal description
		t0: Date,		// simulation start date
	},

	computed: {
		t0String() {
			return {};//dateToBrowserLocale(this.t0)
		},
	},

	watch: {
		"meal.actual.start": {
			handler: function(val) { 
				this.tStartString = dateToBrowserLocale(this.meal.actual.start)
			},
			immediate: true,
		},
		"meal.announcement.start": {
			handler: function(val) { 
				this.tAnnouncedStartString = dateToBrowserLocale(this.meal.announcement.start)
			},
			immediate: true,
		},
		"meal.announcement.time": {
			handler: function(val) { 
				this.tAnnouncementTimeString = dateToBrowserLocale(this.meal.announcement.time)
			},
			immediate: true,
		},
	},

	methods: {
		changed() {
			this.meal.actual.start = new Date(this.tActualStartString)
			this.meal.announcement.start = new Date(this.tAnnouncedStartString)
			this.meal.announcement.time = new Date(this.tAnnouncementTimeString)
			this.$emit("mealChanged", this.meal);
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
	<h4>{{$t('meal')}} #{{id}} ({{meal.id}})
		<input type="button" style="margin-left:1em;"
			:value="$t('delete')" 
			@click="mealDelete">
	</h4>
	
	<ul style="padding-left:0;">
		<li>{{$t("announcedmeal")}}:</li>
		<ul>
			<li v-tooltip="$t('announcement.start_TT')">
				<label for="actual_start" class="meallabel">
					<div class="meallabel">{{$t("announcement.start")}}:</div>
					<div class="mealtime">
						<input type="datetime-local" id="announced_start"
							:min="t0String"
							v-model="tAnnouncedStartString"
							@change="changed">
					</div>
				</label>
			</li>
			<li v-tooltip="$t('announcement.carbs_TT')">
				<label for="announced_carbs" class="meallabel">
					<div class="meallabel">{{$t("announcement.carbs")}}:</div>
					<div class="mealvalue">
						<input type="Number" id="announced_carbs" 
							min="0"
							v-model.number="meal.announcement.carbs"
							@change="changed">
					</div>
				</label>
			</li>
			<li v-tooltip="$t('announcement.time_TT')">
				<label for="announcement_time" class="meallabel">
					<div class="meallabel">{{$t("announcement.time")}}:</div>
					<div class="mealtime">
						<input type="datetime-local" id="announcement_time"
							:min="t0String"
							v-model="tAnnouncementTimeString"
							 @change="changed">
					</div>
				</label>
			</li>
		</ul>
		<li>{{$t("actualmeal")}}:</li>
		<ul>
			<li v-tooltip="$t('actual.start_TT')">
				<label for="actual_start" class="meallabel">
					<div class="meallabel">{{$t("actual.start")}}:</div>
					<div class="mealtime">
						<input type="datetime-local" 
							id="actual_start" 
							:min="t0String"
							v-model="tStartString"
							@change="changed">
					</div>
				</label>
			</li>
			<li v-tooltip="$t('actual.carbs_TT')">
				<label for="actual_carbs" class="meallabel">
					<div class="meallabel">{{$t("actual.carbs")}}:</div>
					<div class="mealvalue">
						<input type="Number" id="actual_carbs"
							min="0" 
							v-model.number="meal.actual.carbs"
							@change="changed">
					</div>
				</label>
			</li>
			<li v-tooltip="$t('actual.duration_TT')">
				<label for="actual_duration" class="meallabel">
					<div class="meallabel">{{$t("actual.duration")}}:</div>
					<div class="mealvalue">
						<input type="Number" id="actual_duration"
							min="1" 
							v-model.number="meal.actual.duration" 
							@change="changed">
					</div>
				</label>
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
