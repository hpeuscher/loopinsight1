<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import AccordionBox from './AccordionBox.vue'
import Chart from 'chart.js/auto'
import { ChartDataset, Point } from 'chart.js'
import 'chartjs-adapter-luxon'
import {
    glucoseColorLine,
    glucoseColorLineSegment
} from '../util/ChartGlucoseColor.js'
import { SimulationResult } from '../../types/SimulationResult.js'
import { BGPrediction, ControllerInternals } from '../../types/Controller.js'

// Chart object
let chartGlucose: Chart

export default defineComponent({
    components: {
        AccordionBox
    },
    data() {
        return {
            preserveOldCurves: false,
            currentDatasetID: 1,
        }
    },
    mounted() {
        const id = "canvas_glucose_concentration"
        const canvas = document.getElementById(id) as HTMLCanvasElement
        chartGlucose = new Chart(canvas.getContext('2d')!, {
            type: "line",
            data: {
                datasets: [
                    <ChartDataset>{
                        type: "line",
                        label: this.$t("prediction"),
                        borderColor: 'rgb(0,0,0,1)',
                        borderDash: [10, 2],
                        borderWidth: 1,
                        spanGaps: true
                    },
                ],
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
                    y: {
                        type: "linear",
                        title: { display: true, text: "mg/dl" },
                        ticks: { stepSize: 20 },
                        min: 40,
                        suggestedMax: 200,
                    },
                },
                plugins: {
                    legend: {
                        //display: false
                        labels: {
                            // no legend for controller prediction
                            filter: (item) => (item.datasetIndex || 0) > 0
                        }
                    },
                },
            },
        })
    },
    methods: {
        reset() {
            let datasets = chartGlucose.data.datasets
            // remove prediction data
            datasets[0].data = []
            if (this.preserveOldCurves) {
                if (datasets.length > this.currentDatasetID) {
                    // make old curve thinner
                    datasets[this.currentDatasetID - 1].borderWidth = 0.5
                    const pointDataset: any = datasets[this.currentDatasetID]	// todo
                    pointDataset.pointRadius = 1
                }
            }
            else {
                // remove all but first (prediction)
                chartGlucose.data.datasets = datasets.slice(0, 1)
                datasets = chartGlucose.data.datasets
            }
            // create new curve
            const id = (datasets.length + 1) / 2
            datasets.push({
                type: "line",
                label: `#${id}: ` + this.$t("actual"),
                tension: 0.5,
                data: [],
                segment: {
                    borderColor: glucoseColorLineSegment
                },
            })
            datasets.push({
                type: "line",
                label: `#${id}: CGM`,
                showLine: false,
                pointRadius: 5,
                pointStyle: "circle",
                pointBorderColor: glucoseColorLine,
                pointBackgroundColor: glucoseColorLine,
                data: [],
            })
            this.currentDatasetID = datasets.length - 1
        },
        setSimulationResults(results: SimulationResult[]) {
            for (const result of results) {
                this._pushRecord(result)
            }
            this.update()
        },
        _pushRecord(result: SimulationResult) {
            // add to glucose plot (most recent simulation)
            chartGlucose.data.datasets[this.currentDatasetID - 1].data
                .push({ x: result.t.valueOf(), y: result.y.Gp })
            if (typeof result.s.CGM !== "undefined") {
                chartGlucose.data.datasets[this.currentDatasetID].data
                    .push({ x: result.t.valueOf(), y: result.s.CGM })
            }
            else if (typeof result.s.SMBG !== "undefined") {
                chartGlucose.data.datasets[this.currentDatasetID].data
                    .push({ x: result.t.valueOf(), y: result.s.SMBG })
            }
        },
        update() {
            // adapt scale only to real glucose diagram, not predictions
            const tmax: any = chartGlucose.data.datasets[1].data.at(-1)
            if (typeof chartGlucose.config.options === "undefined") {
                chartGlucose.config.options = {}
            }
            if (typeof chartGlucose.config.options.scales === "undefined") {
                chartGlucose.config.options.scales = {}
            }
            if (typeof chartGlucose.config.options.scales.x === "undefined") {
                chartGlucose.config.options.scales.x = {}
            }
            chartGlucose.config.options.scales.x.max = tmax?.x || 0
            chartGlucose.update()
        },
        controllerDataHover(t0: Date, data: ControllerInternals) {
            // draw oref0 glucose prediction, if available
            const predBG = data?.predictedBG
            if (typeof predBG !== "undefined") {
                chartGlucose.data.datasets[0].data = predBG.map(
                    (p: BGPrediction) => <Point>{ x: p.t.valueOf(), y: p.Gp })
                this.update()
            }
        },
    },
})
</script>


<template>
    <AccordionBox :title="$t('title')" :initial="true">
        <input type="checkbox" v-model="preserveOldCurves">
        <label for="preserveOldCurves">{{ $t("preserveOldCurves") }}</label>
        <div class="canvas-chart">
            <canvas id="canvas_glucose_concentration" />
        </div>
    </AccordionBox>
</template>



<i18n locale="en">
{
	"title": "Glucose concentration",
	"actual": "actual concentration",
	"prediction": "prediction by algorithm",
	"preserveOldCurves": "preserve old curves",
}
</i18n>
<i18n locale="de">
{
	"title": "Glukosekonzentration",
	"actual": "Tatsächliche Glukosekonzentration",
	"prediction": "Prädiktion des Algorithmus",
	"preserveOldCurves": "Alte Kurven beibehalten",
}
</i18n>
