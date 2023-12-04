<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, toRaw } from 'vue'
import AccordionBox from './AccordionBox.vue'
import ExerciseEntry from './ExerciseEntry.vue'
import Exercise from '../../types/Exercise.js'

export default defineComponent({
    components: {
        AccordionBox, 
        ExerciseEntry
    },

    emits: ["exercisesChanged"],

    data() {
        return {
            exercises: [] as Exercise[],
        }
    },

    props: {
        t0: {type: Date, required: true},
    },

    methods: {
        exercisesChanged() {
            this.$emit("exercisesChanged", toRaw(this.exercises))
        },
        exerciseChanged(id: number, exercise: Exercise) {
            this.exercises[id] = exercise
            this.exercisesChanged()
        },
        addRow() {
            let exerciseStarts = this.exercises.map((m: Exercise) => m.start.getTime())
            exerciseStarts.push(this.t0.getTime())
            const lastExercise = Math.max(...exerciseStarts)
            const newExercise: Exercise = {
                start: new Date(lastExercise + 2 * 60 * 60e3),
                duration: 30,
                intensity: 50,
            }
            this.exercises.push(newExercise)
            this.exercisesChanged()
        },
        exerciseDeleted(id: number) {
            this.exercises.splice(id, 1)
            this.exercisesChanged()
        },
    },

})
</script>


<template>
    <AccordionBox :title="$t('exercise.title')">
        <ul class="exerciselist">
            <li v-for="(_exercise, index) in exercises" :key="'exercise' + index">
                <ExerciseEntry :t0="t0" :exercise="exercises[index]" :id="index" @exerciseChanged="exerciseChanged"
                    @exerciseDeleted="exerciseDeleted" />
                <hr>
            </li>
        </ul>
        <p style="text-align:center;">
            <input type="button" :value="$t('addrow')" @click="addRow">
        </p>
    </AccordionBox>
</template>


<style lang="css" scoped>
ul.exerciselist {
    list-style: none;
    padding-left: 0;
}
</style>


<i18n locale="en">
{
	"exercise.title"	: "Exercises",
	"addrow"			: "add exercise",
}
</i18n>

<i18n locale="de">
{
	"exercise.title"	: "Körperliche Aktivität",
	"addrow"			: "Aktivität hinzufügen",
}
</i18n>
