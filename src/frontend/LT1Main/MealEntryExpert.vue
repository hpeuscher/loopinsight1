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
            tActualStartString: "",
            tAnnouncedStartString: "",
            tAnnouncementTimeString: "",
        }
    },

    props: {
        /** number of this meal in the list */
        id: {type: Number, required: true},
        /** time the simulation starts */
        t0: {type: Date, required: true},
        /** current data of meal */
        meal: {type: Object as PropType<Meal>, required: true},
    },

    computed: {
        t0String(): string {
            return dateToBrowserLocale(this.t0)
        },
    },

    watch: {
        "meal.start": {
            handler: function (val) {
                this.tActualStartString = dateToBrowserLocale(val)
            },
            immediate: true,
        },
        "meal.announcement.start": {
            handler: function (val) {
                this.tAnnouncedStartString = dateToBrowserLocale(val)
            },
            immediate: true,
        },
        "meal.announcement.time": {
            handler: function (val) {
                this.tAnnouncementTimeString = dateToBrowserLocale(val)
            },
            immediate: true,
        },
    },

    methods: {
        mealChanged() {
            this.meal.start = new Date(this.tActualStartString)
            this.meal.announcement!.start = new Date(this.tAnnouncedStartString)
            this.meal.announcement!.time = new Date(this.tAnnouncementTimeString)
            this.$emit("mealChanged", this.id, this.meal)
        },

        mealDeleted() {
            this.$emit("mealDeleted", this.id)
        },
    },

})
</script>


<template>
    <h4>{{ $t('meal') }} #{{ id + 1 }}
        <input type="button" style="margin-left:1em;" :value="$t('delete')" @click="mealDeleted">
    </h4>

    <ul style="padding-left:0;">
        <li>{{ $t("announcedmeal") }}:</li>
        <ul class="">
            <li v-tooltip="$t('announcement.start_TT')">
                <label for="actual_start" class="meallabel">
                    <div class="meallabel">{{ $t("announcement.start") }}:</div>
                    <div class="mealtime">
                        <input type="datetime-local" :min="t0String" v-model="tAnnouncedStartString" @change="mealChanged">
                    </div>
                </label>
            </li>
            <li v-tooltip="$t('announcement.carbs_TT')">
                <label for="announced_carbs" class="meallabel">
                    <div class="meallabel">{{ $t("announcement.carbs") }}:</div>
                    <div class="mealvalue">
                        <input type="Number" min="0" v-model.number="meal.announcement!.carbs" @change="mealChanged">
                    </div>
                </label>
            </li>
            <li v-tooltip="$t('announcement.time_TT')">
                <label for="announcement_time" class="meallabel">
                    <div class="meallabel">{{ $t("announcement.time") }}:</div>
                    <div class="mealtime">
                        <input type="datetime-local" :min="t0String" v-model="tAnnouncementTimeString"
                            @change="mealChanged">
                    </div>
                </label>
            </li>
        </ul>
        <li>{{ $t("actualmeal") }}:</li>
        <ul>
            <li v-tooltip="$t('actual.start_TT')">
                <label for="actual_start" class="meallabel">
                    <div class="meallabel">{{ $t("actual.start") }}:</div>
                    <div class="mealtime">
                        <input type="datetime-local" :min="t0String" v-model="tActualStartString" @change="mealChanged">
                    </div>
                </label>
            </li>
            <li v-tooltip="$t('actual.carbs_TT')">
                <label for="actual_carbs" class="meallabel">
                    <div class="meallabel">{{ $t("actual.carbs") }}:</div>
                    <div class="mealvalue">
                        <input type="Number" min="0" v-model.number="meal.carbs" @change="mealChanged">
                    </div>
                </label>
            </li>
            <li v-tooltip="$t('actual.duration_TT')">
                <label for="actual_duration" class="meallabel">
                    <div class="meallabel">{{ $t("actual.duration") }}:</div>
                    <div class="mealvalue">
                        <input type="Number" min="1" v-model.number="meal.duration" @change="mealChanged">
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
    list-style: none;
    padding-left: 1em;
    line-height: 1.75em;
}

.meallabel div {
    display: inline-block;
    width: 120px;
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
