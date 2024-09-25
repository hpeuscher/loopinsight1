<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import AccordionBox from './AccordionBox.vue'
import MealEntryBasic from './MealEntryBasic.vue'
import MealEntryExpert from './MealEntryExpert.vue'
import Meal from '../../types/Meal.js'

export default defineComponent({
    components: {
        AccordionBox,
        MealEntryExpert,
        MealEntryBasic,
    },

    emits: ["mealsChanged"],

    data() {
        return {
            meals: [] as Meal[],
            expertMode: false as boolean,
        }
    },

    props: {
        t0: { type: Date, required: true },
    },

    methods: {
        mealsChanged() {
            this.$emit("mealsChanged", this.meals)
        },
        mealChanged(id: number, meal: Meal) {
            this.meals[id] = meal
            this.mealsChanged()
        },
        addRow() {
            const MS_PER_HOUR = 60 * 60e3
            const nextMeal = this.meals.length > 0 ?
                Math.max(...this.meals.map(m => m.start.getTime())) + 5 * MS_PER_HOUR :
                new Date(this.t0).setHours(8,0,0,0)
            const carbs = 30 + ((1 + this.meals.length) % 3) * 10
            const newMeal: Meal = {
                start: new Date(nextMeal),
                duration: 15,
                carbs,
                announcement: {
                    start: new Date(nextMeal),
                    time: this.t0,
                    carbs,
                }
            }
            this.meals.push(newMeal)
            this.mealsChanged()
        },
        mealDeleted(id: number) {
            this.meals.splice(id, 1)
            this.mealsChanged()
        },
    },

    mounted() {
        // add three meals
        this.addRow()
        this.addRow()
        this.addRow()
    },

    computed: {
        activeMode() {
            return this.expertMode ? "MealEntryExpert" : "MealEntryBasic"
        },
    },
})
</script>


<template>
    <AccordionBox :title="$t('meal.title')">
        <p id="modeSelection">
            <label>
                <input type="radio" name="modeSelection" v-on:click="expertMode = false" :checked="!expertMode">
                {{ $t("basicMode") }}
            </label>
            <label>
                <input type="radio" name="modeSelection" v-on:click="expertMode = true" :checked="expertMode">
                {{ $t("expertMode") }}
            </label>
        </p>
        <hr>
        <ul class="meallist">
            <li v-for="(meal, index) in meals" :key="'meal' + index">
                <component v-bind:is="activeMode" :t0="t0" :meal="meals[index]" :id="index" @mealChanged="mealChanged"
                    @mealDeleted="mealDeleted" />
                <hr>
            </li>
        </ul>
        <p style="text-align:center;">
            <input type="button" id="addrow" :value="$t('addrow')" @click="addRow">
        </p>
    </AccordionBox>
</template>


<style lang="css" scoped>
p#modeSelection>label {
    display: inline-block;
    width: 50%;
}

ul.meallist {
    list-style: none;
    padding-left: 0;
}
</style>

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
