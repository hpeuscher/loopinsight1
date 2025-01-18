<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import AccordionBox from './AccordionBox.vue'
import { SimulationResult } from '../../types/SimulationResult.js'
import Statistics from '../../common/Statistics.js'

export default defineComponent({
    components: {
        AccordionBox,
    },
    data:() => {
        return {
            G: [] as number[],
            tir_veryhigh: 0,
            tir_high: 0,
            tir_target: 0,
            tir_low: 0,
            tir_verylow: 0,
            t_total: 0,
            tir_height: 2,
            averageGlucose: 0,
            GMI: 0,
            glucoseVariability: 0,
        }
    },
    methods: {
        setSimulationResults(simResults: SimulationResult[]) {
            this.reset()
            for (const result of simResults) {
                if (typeof result.s.CGM !== "undefined") {
                    this._pushRecord(result.s.CGM)
                }
            }
            this.update()
        },
        reset() {
            this.G = []
            this.tir_veryhigh = 0
            this.tir_high = 0
            this.tir_target = 0
            this.tir_low = 0
            this.tir_verylow = 0
            this.t_total = 0
        },
        update() {
            this.averageGlucose = Math.round(Statistics.mean(this.G))
            this.GMI = Math.round((3.38 + 0.02345 * this.averageGlucose) * 10) / 10
            this.glucoseVariability = Math.round(
                100 * Statistics.coefficientOfVariation(this.G)
            )
        },
        _pushRecord(G: number) {
            this.G.push(G)
            this.t_total++
            if (G < 54) {
                this.tir_verylow++
            } else if (G < 70) {
                this.tir_low++
            } else if (G > 250) {
                this.tir_veryhigh++
            } else if (G > 180) {
                this.tir_high++
            } else {
                this.tir_target++
            }
        },
    },
    computed: {
        tir_veryhigh_percent: function () {
            return this.t_total <= 0
                ? 0
                : Math.round((100 * this.tir_veryhigh) / this.t_total)
        },
        tir_high_percent: function () {
            return this.t_total <= 0
                ? 0
                : Math.round((100 * this.tir_high) / this.t_total)
        },
        tir_target_percent: function () {
            return this.t_total <= 0
                ? 0
                : Math.round((100 * this.tir_target) / this.t_total)
        },
        tir_low_percent: function () {
            return this.t_total <= 0
                ? 0
                : Math.round((100 * this.tir_low) / this.t_total)
        },
        tir_verylow_percent: function () {
            return this.t_total <= 0
                ? 0
                : Math.round((100 * this.tir_verylow) / this.t_total)
        },
    },
})
</script>


<template>
    <AccordionBox :title="$t('title')" :initial="true">
        <div id="AGPstatistics" class="agpbox">
            <h4>{{ $t("Statistics") }}</h4>
            <div id="AGPstatisticstable">
                <div>{{ $t("stats.averageGlucose") }}</div>
                <div>{{ averageGlucose }} mg/dl</div>
                <div>{{ $t("stats.GMI") }}</div>
                <div>{{ GMI }} %</div>
                <div>{{ $t("stats.glucoseVariability") }}</div>
                <div>{{ glucoseVariability }} %</div>
            </div>
        </div>
        <div class="agpbox">
            <h4>{{ $t("timeInRanges") }}</h4>
            <table id="tirtable">
                <colgroup>
                    <col style="width: 70px" />
                    <col />
                    <col style="width: 70px" />
                </colgroup>
                <tbody>
                    <tr>
                        <td></td>
                        <td>{{ $t("tir.veryhigh") }} (>250 mg/dl)</td>
                        <td>{{ tir_veryhigh_percent }} %</td>
                    </tr>
                    <tr>
                        <td style="vertical-align: bottom">
                            <div class="barCell" id="tir_veryhigh"
                                :style="'height: ' + tir_veryhigh_percent * tir_height + 'px'"></div>
                            <div class="barCell" id="tir_high" :style="'height: ' + tir_high_percent * tir_height + 'px'"></div>
                        </td>
                        <td style="vertical-align: bottom">
                            {{ $t("tir.high") }} (181-250 mg/dl)
                        </td>
                        <td style="vertical-align: bottom">{{ tir_high_percent }} %</td>
                    </tr>
                    <tr>
                        <td>
                            <div class="barCell" id="tir_target" :style="'height: ' + tir_target_percent * tir_height + 'px'">
                            </div>
                        </td>
                        <td>{{ $t("tir.targetrange") }} (70-180 mg/dl)</td>
                        <td>{{ tir_target_percent }} %</td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top">
                            <div class="barCell" id="tir_low" :style="'height: ' + tir_low_percent * tir_height + 'px'"></div>
                            <div class="barCell" id="tir_verylow" :style="'height: ' + tir_verylow_percent * tir_height + 'px'">
                            </div>
                        </td>
                        <td style="vertical-align: top">
                            <div style="vertical-align: top">
                                {{ $t("tir.low") }} (54-69 mg/dl)
                            </div>
                        </td>
                        <td style="vertical-align: top">
                            <div style="vertical-align: top">{{ tir_low_percent }} %</div>
                        </td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>{{ $t("tir.verylow") }} (&lt;54 mg/dl)</td>
                        <td>{{ tir_verylow_percent }} %</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </AccordionBox>
</template>


<style scoped>
div#AGPstatisticstable {
    display: grid;
    grid-template-columns: auto 70px;
    grid-gap: 10px;
}

table#tirtable {
    width: 100%;
    border-collapse: collapse;
    white-space: nowrap;
    border: none;
}

#tirtable tr,
th,
td {
    border: none;
}


/* span between TIRs */
table#tirtable td {
    padding: 0;
}

div.barCell {
    width: 50px;
    /*margin: 1px;*/
    border-top: solid 1px white;
}

/* table headers */
div.agpbox {
    display: inline-block;
    vertical-align: top;
    width: 375px;
    margin: 5px;
}

div.agpbox>h4 {
    background-color: rgb(0, 0, 0, 1);
    color: rgb(255, 255, 255, 1);
    padding: 3px;
    font-variant: small-caps;
    margin-top: 0.25em;
}

/* tir colors */
#tir_veryhigh {
    background-color: rgb(233, 181, 17, 1);
}

#tir_high {
    background-color: rgb(250, 234, 0, 1);
}

#tir_target {
    background-color: rgb(120, 176, 89, 1);
}

#tir_low {
    background-color: rgb(194, 1, 18, 1);
}

#tir_verylow {
    background-color: rgb(140, 25, 22, 1);
}
</style>


<i18n locale="en">
{
	"title": "AGP Report",
	"Statistics": "Glucose Statistics and Targets",
	"timeInRanges": "Time in Ranges",
	"tir.veryhigh": "Very High",
	"tir.high": "High",
	"tir.targetrange": "Target Range",
	"tir.low": "Low",
	"tir.verylow": "Very Low",
	"stats.averageGlucose": "Average Glucose",
	"stats.GMI": "Glucose Management Indicator (GMI)",
	"stats.glucoseVariability": "Glucose Variability",
}
</i18n>
<i18n locale="de">
{
	"title": "AGP Report",
	"Statistics": "Glukose-Statistik",
	"timeInRanges": "Zeit in Bereichen",
	"tir.veryhigh": "Sehr hoch",
	"tir.high": "Hoch",
	"tir.targetrange": "Zielbereich",
	"tir.low": "Niedrig",
	"tir.verylow": "Sehr niedrig",
	"stats.averageGlucose": "Mittelwert Glukose",
	"stats.GMI": "Glukosemanagementindikator (GMI)",
	"stats.glucoseVariability": "Glukosevariabilität",
}
</i18n>
