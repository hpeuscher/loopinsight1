<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType } from 'vue'
import { dateToBrowserLocale } from '../util/DateConversion.js'
import Exercise from '../../types/Exercise.js'

export default defineComponent({
    emits: ["exerciseChanged", "exerciseDeleted"],

    data() {
        return {
            tStartString: "",
        }
    },

    props: {
        /** number of this exercise unit in the list */
        id: {type: Number, required: true },
        /** time the simulation starts */
        t0: {type: Date, required: true },
        /** current data of exercise unit */
        exercise: {type: Object as PropType<Exercise>, required: true },
    },

    computed: {
        t0String() {
            return dateToBrowserLocale(this.t0)
        },
    },

    watch: {
        "exercise.start": {
            handler: function (val) {
                this.tStartString = dateToBrowserLocale(this.exercise.start)
            },
            immediate: true,
        }
    },

    methods: {
        exerciseChanged() {
            this.exercise.start = new Date(this.tStartString)
            this.$emit("exerciseChanged", this.id, this.exercise)
        },

        exerciseDeleted() {
            this.$emit("exerciseDeleted", this.id)
        },
    },
})
</script>


<template>
    <h4>{{ $t('Exercise') }} #{{ id + 1 }}
        <input type="button" style="margin-left:1em;" :value="$t('delete')" @click="exerciseDeleted">
    </h4>
    <ul class="exerciseentry">
        <li v-tooltip="$t('start_TT')">
            <label for="start" class="exerciselabel">
                <div>{{ $t("start") }}:</div>
                <div class="exercisetime">
                    <input type="datetime-local" :min="t0String" @change="exerciseChanged" v-model="tStartString">
                </div>
            </label>
        </li>
        <li v-tooltip="$t('duration_TT')">
            <label for="duration" class="exerciselabel">
                <div>{{ $t("duration") }}:</div>
                <div class="exercisevalue">
                    <input type="Number" min="0" step="5" @change="exerciseChanged" v-model.number="exercise.duration">
                </div>
            </label>
        </li>
        <li v-tooltip="$t('intensity_TT')">
            <label for="intensity" class="exerciselabel">
                <div>{{ $t("intensity") }}:</div>
                <div class="exercisevalue">
                    <input type="Number" min="0" max="100" step="5" id="intensity" @change="exerciseChanged"
                        v-model.number="exercise.intensity">
                </div>
            </label>
        </li>
    </ul>
</template>


<style lang="css" scoped>
h4 {
    margin-bottom: 0.5em;
}

ul.exerciseentry {
    list-style: none;
    padding-left: 1em;
    line-height: 1.75em;
}

ul.exerciselist li {
    width: 300px;
}

.exerciselabel div {
    display: inline-block;
    width: 150px;
}

.exercisevalue {
    display: inline-block;
}

.exercisevalue>input {
    width: 4rem;
    line-height: 1;
}

.exercisetime>input {
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
