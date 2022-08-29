<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import ExerciseEntry from './ExerciseEntry.vue'
	
var defaultExercise = {
	start: 60,
	duration: 120,
	intensity: 30,
};

var uniqueExerciseId = 1;

export default {
	components: {
		ExerciseEntry
	},
	
	emits: ["exercisesChanged"],

	data() {
		return {
			boxactive: false,
			exercises: [],
		}
	},
	
	props: {
		t0: Date,
	},

	methods: {
		exercisesChanged() {
			this.$emit("exercisesChanged", JSON.parse(JSON.stringify(this.exercises)));
		},
		exerciseChanged(exercise) {
			let id = this.exercises.findIndex(m => m.id==exercise.id);
			this.exercises[id] = exercise;
			this.exercisesChanged();
		},
		addRow() {
			uniqueExerciseId = uniqueExerciseId + 1;
			let newExercise = Object.assign({id: uniqueExerciseId}, 
					JSON.parse(JSON.stringify(defaultExercise)));
			let exerciseStarts = this.exercises.map( (m) => {return m.start.getTime()})
			exerciseStarts.push(this.t0.getTime())
			const lastExercise = Math.max(...exerciseStarts)
			newExercise.start = new Date(lastExercise + 2 * 60 * 60e3)
			this.exercises.push(newExercise);
			this.exercisesChanged();
		},
		deleteExercise(exercise) {
			this.exercises = this.exercises.filter(m => m.id!=exercise.id);
			this.exercisesChanged();
		},
	},

	mounted() {
		// this.addRow();
	},
	
}
</script>


<template>
	<div id="exercisecontrols" class="box2 accordionbox" 
		:class="{boxactive: boxactive}">
		<h3 @click="[boxactive=!boxactive]">{{$t("exercise.title")}}</h3>
		<p style="color:#cc0000">{{$t('experimental')}}</p>
		<hr>
		<ul class="exerciselist">
			<li v-for="(exercise, index) in exercises" :key="'exercise'+index">
				<ExerciseEntry :t0="t0"
				:exercise="exercises[index]" :id="index+1"
					@exerciseChanged="exerciseChanged"
					@exerciseDelete="deleteExercise" />
				<hr>
			</li>
		</ul>
		<p style="text-align:center;">
			<input type="button" :value="$t('addrow')" @click="addRow">
		</p>
	</div>		
</template>


<style lang="css" scoped>
ul.exerciselist {
	list-style:none;
	padding-left:0;
}

</style>


<i18n locale="en">
{
	"exercise.title"	: "Exercises",
	"addrow"			: "add exercise",
	"experimental"		: "Attention. This feature is in an experimental stage. Most physiological models ignore physical activity.",
}
</i18n>

<i18n locale="de">
{
	"exercise.title"	: "Körperliche Aktivität",
	"addrow"			: "Aktivität hinzufügen",
	"experimental"		: "Achtung! Dieses Feature ist in einem experimentellen Stadium. Die meisten physiologischen Modelle ignorieren körperliche Aktivität.",
}
</i18n>
