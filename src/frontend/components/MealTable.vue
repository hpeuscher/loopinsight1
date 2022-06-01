<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import MealEntryBasic from './MealEntryBasic.vue'
import MealEntryExpert from './MealEntryExpert.vue'
	
var defaultMeal = {
	actual: {
		start: 60, 		// time
		duration: 15, 	// in mins
		carbs: 30, 		// in g
	},
	announcement: {
		start: 60, 		// time
		carbs: 30, 		// in g
		time: 0,		// time
	}
};

var uniqueId = 1;

export default {
	components: {
		MealEntryExpert,
		MealEntryBasic,
	},
	
	emits: ["mealsChanged"],

	data() {
		return {
			boxactive: false,
			meals: [],
			expertMode: false,
		}
	},
	
	props: {
		t0: Date,
	},

	methods: {
		mealsChanged() {
			this.$emit("mealsChanged", JSON.parse(JSON.stringify(this.meals)));
		},
		mealChanged(meal) {
			let id = this.meals.findIndex(m => m.id==meal.id);
			this.meals[id] = meal;
			this.mealsChanged();
		},
		addRow() {
			uniqueId = uniqueId + 1;
			let newMeal = Object.assign({id: uniqueId}, 
					JSON.parse(JSON.stringify(defaultMeal)));
			let mealStarts = this.meals.map( (m) => {return m.actual.start.getTime()})
			mealStarts.push(this.t0.getTime())
			const lastMeal = Math.max(...mealStarts)
			newMeal.actual.start = new Date(lastMeal + 2 * 60 * 60e3)
			newMeal.announcement.start = newMeal.actual.start
			newMeal.announcement.time = this.t0
			this.meals.push(newMeal);
			this.mealsChanged();
		},
		deleteMeal(meal) {
			this.meals = this.meals.filter(m => m.id!=meal.id);
			this.mealsChanged();
		},
	},

	mounted() {
		this.addRow();
	},
	
	computed: {
		activeMode() {
			return this.expertMode ? "MealEntryExpert" : "MealEntryBasic";
		},
	},
}
</script>


<template>
	<div id="mealcontrols" class="box2 accordionbox" 
		:class="{boxactive: boxactive}">
		<h3 @click="[boxactive=!boxactive]">{{$t("meal.title")}}</h3>
		<p id="modeSelection">
			<label>
				<input type="radio" name="modeSelection"
					v-on:click="expertMode = false"
					:checked="expertMode == false">
				{{$t("basicMode")}}
			</label>
			<label>
				<input type="radio" name="modeSelection"
					v-on:click="expertMode = true"
					:checked="expertMode == true">
				{{$t("expertMode")}}
			</label>
		</p>
		<hr>
		<ul class="meallist">
			<li v-for="(meal, index) in meals" :key="'meal'+index">
				<component v-bind:is="activeMode" :t0="t0"
				:meal="meals[index]" :id="index+1"
					@mealChanged="mealChanged"
					@mealDelete="deleteMeal" />
				<hr>
			</li>
		</ul>
		<p style="text-align:center;">
			<input type="button" id="addrow"
					:value="$t('addrow')" 
					@click="addRow">
		</p>
	</div>		
</template>


<style lang="css" scoped>
p#modeSelection > label {
	display: inline-block;
	width: 50%;
}

ul.meallist {
	list-style:none;
	padding-left:0;
}

</style>

}


<i18n locale="en">
{

	"meal.title"		: "Meals",
	"addrow"			: "add meal",
	"basicMode"			: "basic mode",
	"expertMode"		: "expert mode",
}
</i18n>

<i18n locale="de">
{
	"meal.title"		: "Mahlzeiten",
	"addrow"			: "Mahlzeit hinzufügen",
	"basicMode"			: "Basismodus",
	"expertMode"		: "Expertenmodus",
}
</i18n>
