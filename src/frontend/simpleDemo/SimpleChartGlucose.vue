<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-luxon'
import { glucoseColorLineSegment } from '../util/ChartGlucoseColor.js'
import { SimulationResult } from '../../types/SimulationResult.js'

// Chart object
let minimalGuiChartGlucose: Chart

export default defineComponent({

    mounted() {
        const id = "canvas_minimal_gui_glucose_concentration"
        const canvas = document.getElementById(id) as HTMLCanvasElement
        minimalGuiChartGlucose = new Chart(canvas.getContext('2d')!, {
            type: "line",
            data: {
                datasets: [{
                    type: "line",
                    label: this.$t("actual"),
                    tension: 0.5,
                    data: [],
                    segment: {
                        borderColor: glucoseColorLineSegment
                    },
                }],
            },
            options: {
                layout: {
                    padding: { right: 20 },
                },
                scales: {
                    x: {
                        type: "time",
                        offset: false,
                        time: { unit: 'hour' },
                    },
                    y: {
                        type: "linear",
                        title: { display: true, text: "mg/dl" },
                        ticks: { stepSize: 20 },
                        min: 40,
                        suggestedMax: 200,
                    },
                },
                plugins: {
                    legend: { display: false },
                },
            },
        })
    },
    methods: {
        setSimulationResults(simResults: SimulationResult[]) {
            this.reset()
            for (const result of simResults) {
                minimalGuiChartGlucose.data.datasets[0].data
                    .push({ x: result.t.valueOf(), y: result.y.Gp })
            }
            this.update()
        },
        reset() {
            minimalGuiChartGlucose.data.datasets[0].data = []
        },
        update() {
            minimalGuiChartGlucose.update()
        }
    },
})
</script>


<template>
    <div class="lt1box box2">
        <div class="canvas-chart">
            <canvas id="canvas_minimal_gui_glucose_concentration" style="height:300px" />
        </div>
    </div>
</template>


<i18n locale="en">
{
	"title": "Glucose concentration",
	"actual": "actual concentration",
	"prediction": "prediction by algorithm"
}
</i18n>

<i18n locale="de">
{
	"title": "Glukosekonzentration",
	"actual": "Tatsächliche Glukosekonzentration",
	"prediction": "Prädiktion des Algorithmus"
}
</i18n>
