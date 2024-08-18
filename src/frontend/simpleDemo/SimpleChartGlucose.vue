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

export default defineComponent({

    setup() {
        // allocate chart as member
        const chart = {} as Chart
        return { chart }
    },
    computed: {
        canvasid(): string {
            return "canvas_minimal_gui"
        },
    },
    mounted() {
        const id = this.canvasid
        const canvas = document.getElementById(id) as HTMLCanvasElement
        const ctx = canvas.getContext('2d')!
        this.chart = new Chart(ctx, {
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
                this.chart.data.datasets[0].data
                    .push({ x: result.t.valueOf(), y: result.y.Gp })
            }
            this.update()
        },
        reset() {
            this.chart.data.datasets[0].data = []
        },
        update() {
            this.chart.update()
        }
    },
})
</script>


<template>
    <div class="lightbox">
        <div class="canvas-chart">
            <canvas :id="canvasid" style="height:300px"></canvas>
        </div>
    </div>
</template>

<style scoped>
.lightbox {
    border: solid;
    border-width: 1px;
    border-color: #aaaaaa;
    padding: .5rem;
    margin-top: 0.5rem;
}

</style>

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
