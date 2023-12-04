<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType } from 'vue'
import { dateToBrowserLocale } from '../util/DateConversion.js'
import Meal from '../../types/Meal.js'

export default defineComponent({
    emits: ["mealChanged", "mealDeleted"],

    data() {
        return {
            withAnnouncement: true,
            tStartString: "",
        }
    },

    props: {
        /** number of this meal in the list */
        id: {type: Number, required: true },
        /** time the simulation starts */
        t0: {type: Date, required: true },
        /** current data of meal */
        meal: {type: Object as PropType<Meal>, required: true },
    },

    computed: {
        t0String(): string {
            return dateToBrowserLocale(this.t0)
        },
    },

    watch: {
        "meal.start": {
            handler: function (val) {
                this.tStartString = dateToBrowserLocale((<Meal>this.meal).start)
            },
            immediate: true,
        }
    },

    methods: {
        mealChanged() {
            this.meal.start = new Date(this.tStartString)
            if (this.withAnnouncement) {
                this.meal.announcement = {
                    start: new Date(this.tStartString),
                    carbs: this.meal.carbs,
                    time: this.t0,
                }
            }
            else if (typeof this.meal.announcement !== "undefined") {
                this.meal.announcement.carbs = 0
            }
            this.$emit("mealChanged", this.id, this.meal)
        },

        mealDeleted() {
            this.$emit("mealDeleted", this.id)
        },
    },

    mounted() {
        this.withAnnouncement = false
        // check if this meal is announced
        if (this.meal?.announcement?.carbs || 0 > 0) {
            this.withAnnouncement = true
        }
        this.mealChanged()
    },
})
</script>


<template>
    <h4>{{ $t('meal') }} #{{ id + 1 }}
        <input type="button" style="margin-left:1em;" :value="$t('delete')" @click="mealDeleted">
    </h4>
    <ul class="mealentry">
        <li v-tooltip="$t('actual.start_TT')">
            <label for="actual_start" class="meallabel">
                <div>{{ $t("actual.start") }}:</div>
                <div class="mealtime">
                    <input type="datetime-local" :min="t0String" @change="mealChanged" v-model="tStartString">
                </div>
            </label>
        </li>
        <li v-tooltip="$t('actual.carbs_TT')">
            <label for="actual_carbs" class="meallabel">
                <div>{{ $t("actual.carbs") }}:</div>
                <div class="mealvalue">
                    <input type="Number" min="0" step="5" @change="mealChanged" v-model.number="meal.carbs">
                </div>
            </label>
        </li>
        <li>
            <label for="withAnnouncement" class="meallabel">
                <div class="meallabel">{{ $t("withAnnouncement") }}:</div>
                <div class="mealvalue">
                    <input type="checkbox" @change="mealChanged" v-model.number="withAnnouncement">
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
    list-style: none;
    padding-left: 1em;
    line-height: 1.75em;
}

.meallabel div {
    display: inline-block;
    width: 150px;
}

.mealvalue {
    display: inline-block;
}

.mealvalue>input {
    width: 4rem;
    line-height: 1;
}

.mealtime>input {
    width: 10rem;
    font-size: 0.8rem;
}
</style>

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
