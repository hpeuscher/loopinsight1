<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import {dateToBrowserLocale} from "../../common/util.js"

export default {
	emits: ["exerciseChanged", "exerciseDelete"],
	
	props: {
		id: Number,			// list number of this exercise
		exercise: Object,	// exercise description
		t0: Date,			// simulation start date
	},
	
	computed: {
		t0String() {
			return dateToBrowserLocale(this.t0)
		},
	},

	watch: {
		"exercise.start": {
			handler: function(val) { 
				this.tStartString = dateToBrowserLocale(this.exercise.start)
			},
			immediate: true,
		}
	},

	methods: {
		changed() {
			this.exercise.start = new Date(this.tStartString)
			this.$emit("exerciseChanged", this.exercise);
		},
		
		exerciseDelete() {
			this.$emit("exerciseDelete", this.exercise);
		},
	},
	
	mounted() {
		this.changed();
	},
}
</script>


<template>
	<h4>{{$t('Exercise')}} #{{id}}
		<input type="button" style="margin-left:1em;"
			:value="$t('delete')" 
			@click="exerciseDelete">
	</h4>
	<ul>
		<li v-tooltip="$t('start_TT')">
			<label for="start" class="exerciselabel">
				<div>{{$t("start")}}:</div>
				<div class="exercisetime">
					<input type="datetime-local" :min="t0String" id="start"
					@change="changed" v-model="tStartString">
				</div>
			</label>
		</li>
		<li v-tooltip="$t('duration_TT')">
			<label for="duration" class="exerciselabel">
				<div>{{$t("duration")}}:</div>
				<div class="exercisevalue">
					<input type="Number" min="0" id="duration"
						@change="changed" v-model.number="exercise.duration">
				</div>
			</label>
		</li>
		<li v-tooltip="$t('intensity_TT')">
			<label for="intensity" class="exerciselabel">
				<div>{{$t("intensity")}}:</div>
				<div class="exercisevalue">
					<input type="Number" min="0" id="intensity"
						@change="changed" v-model.number="exercise.intensity">
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
		
	.exerciselabel div {
		display: inline-block;
		width: 150px;
	}
	.exercisevalue {
		display: inline-block;
	}
	.exercisevalue > input {
		width: 4rem;
		line-height: 1;
	}
	.exercisetime > input {
		width: 10rem;
		font-size: 0.8rem;
	}
</style>

}


<i18n locale="en">
{
	"Exercise"				: "Exercise",
	"delete"				: "delete",
	"start"					: "start time",
	"duration"				: "duration in min",
	"intensity"				: "intensity in %",
	"start_TT"				: "time when the exercise begins",
	"duration_TT"			: "duration of exercise in min",
	"intensity_TT"			: "intensity of exercise in %",
}
</i18n>

<i18n locale="de">
{
	"Exercise"				: "sportliche Aktivität",
	"delete"				: "löschen",
	"start"					: "Startzeit",
	"duration"				: "Dauer in min",
	"intensity"				: "Intensität in %",
	"start_TT"				: "Zeitpunkt zu dem sportliche Aktivität beginnt",
	"duration_TT"			: "Dauer der sportlichen Aktivität in min",
	"intensity_TT"			: "Intensität der sportlichen Aktivität in %",
}
</i18n>
