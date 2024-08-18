<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import 'chartjs-adapter-luxon'
import { defineComponent } from 'vue'
import Chart from 'chart.js/auto'
import { ChartDatasetCustomTypesPerDataset } from 'chart.js'
import { SimulationResult } from '../../types/SimulationResult.js'
import AccordionBox from './AccordionBox.vue'

export default defineComponent({

    components: {
        AccordionBox
    },

    data() {
        return {
            
            results: [] as SimulationResult[],
            signals: [] as String[],
        }
    },

    setup() {
        // allocate chart as member
        const chart = {} as Chart
        return { chart }
    },

    computed: {
        canvasid(): string {
            return "canvas_signals"
        },
    },
    
    mounted() {
        const id = this.canvasid
        const canvas = document.getElementById(id) as HTMLCanvasElement
        this.chart = new Chart(canvas.getContext('2d')!, {
            data: {
                datasets: []
            },
            options: {
                layout: {
                    padding: { right: 20 },
                },
                scales: {
                    x: {
                        type: "time",   
                        offset: false,
                        time: {
                            displayFormats: {
                                hour: 'HH:mm'
                            }
                        },
                    },
                },
            },
        })
    },

    methods: {
        setSimulationResults(results: SimulationResult[]) {
            const chart = this.chart
            // remember which signals were set visible or hidden
            const hidden = Object.fromEntries(chart.data.datasets.map(
                (d,id) => [d.label, chart.getDatasetMeta(id).hidden]))
            console.log(hidden)
            // remove all data from chart
            chart.data.datasets = []
            // find available signals
            const signals = Object.keys(results[0].y)
            // create a chart curve dataset for each signal
            for (const id of signals) {
                chart.data.datasets.push(
                    <ChartDatasetCustomTypesPerDataset>{
                        type: "line",
                        data: results.map((result: any) => { return {
                            x: result.t.valueOf(),
                            y: result.y[id] ?? NaN
                        }}),
                        // pointStyle: "circle",
                        // radius: 2,
                        label: id,
                        hidden: hidden[id] ?? false,
                    })
            }
            chart.update()
        },
    },
})
</script>


<template>
    <AccordionBox :title="$t('title')" :initial="false">
        <div class="canvas-chart">
            <canvas :id="canvasid"></canvas>
        </div>
    </AccordionBox>
</template>


<i18n locale="en">
{
	"title":		"Additional signals",
}
</i18n>
<i18n locale="de">
{
	"title": 		"Weitere Signale",
}
</i18n>
