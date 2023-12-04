<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import { defaults } from 'chart.js'
import ChartGlucose from './SimpleChartGlucose.vue'
import ChartAGP from '../LT1Main/ChartAGP.vue'
import VirtualPatientUvaPadova from '../../core/models/UvaPadova.js'
import Simulator from '../../core/Simulator.js'
import { SimulationResult } from '../../types/SimulationResult.js'
import StaticInsulinPump from '../../core/actuators/StaticInsulinPump.js'
import CGMSensor from '../../core/sensors/IdealCGM.js'
import ControllerMealBolus from '../../core/controllers/MealBolus.js'
import ControllerConfig from '../LT1Main/ControllerConfig.vue'
import Controller from '../../types/Controller.js'
import ControllerUnion from '../../core/ControllerUnion.js'
import ControllerCSII from '../../core/controllers/CSII.js'

const patient = new VirtualPatientUvaPadova()
const meals = [
    {
        start: new Date(2022, 5, 1, 8, 0, 0),
        duration: 15,
        carbs: 20,
        announcement: {
            start: new Date(2022, 5, 1, 8, 0, 0),
            carbs: 20,
            time: new Date(2022, 5, 1, 0, 0, 0),
        },
    },
]
const options = {
    "t0": new Date(2022, 5, 1, 0, 0, 0),
    "tmax": new Date(2022, 5, 2, 0, 0, 0),
}

// prepare simulator
const sim = new Simulator()
sim.setPatient(patient)
const controller = new ControllerUnion([
    new ControllerMealBolus(),
    new ControllerCSII(),
])
// set basal rate to patient's default
controller.autoConfigure(patient.getPatientProfile())
sim.setController(controller)
sim.setActuator(new StaticInsulinPump())
sim.setSensor(new CGMSensor())
sim.setMeals(meals)
sim.setOptions(options)

export default defineComponent({

    beforeMount() {
        // set default options for Chart
        defaults.maintainAspectRatio = false
        defaults.responsive = true
        defaults.animation = false
        defaults.normalized = true

        defaults.elements.point.pointStyle = 'line'
        defaults.elements.point.radius = 0

        defaults.plugins.legend.labels.usePointStyle = true

        defaults.interaction.mode = 'nearest'
        defaults.interaction.axis = 'xy'
        defaults.interaction.intersect = false

        defaults.parsing = false
    },

    components: {
        ControllerConfig,
        ChartGlucose,
        ChartAGP,
    },

    mounted() {
        this.run()
    },

    methods: {
        run() {
            this.resetCharts()
            sim.runSimulation()

            // propagate results to charts
            const results = sim.getSimulationResults()
            this.propagateSimulationResults(results)
            this.updateCharts()
        },
        controllerChanged(newController: Controller) {
            if (typeof newController !== "undefined") {
                controller.setParameterValues(newController.getParameterValues())
                this.run()
            }
        },
        /** reset charts */
        resetCharts() {
            for (const chart in this.$refs) {
                (<any>this.$refs[chart]).reset?.()
            }
        },
        /** receive and use simulation data */
        propagateSimulationResults(simResults: SimulationResult[]) {
            // dispatch simulation output to charts
            for (const chart in this.$refs) {
                (<any>this.$refs[chart]).setSimulationResults?.(simResults)
            }
        },
        /** update charts */
        updateCharts() {
            for (const chart in this.$refs) {
                (<any>this.$refs[chart]).update?.()
            }
        },
    },
})
</script>


<template>
    <div class="lt1-container">
        <div class="box lt1-controls">
            <p>{{ $t("explanations") }}</p>
            <ControllerConfig ref="mealBolus" 
                :id="'MealBolus'" :version="'2.0.0'" 
                @controllerChanged="controllerChanged"/>
        </div>
        <div class="box lt1-results">
            <ChartGlucose ref="chartGlucose" />
            <ChartAGP ref="chartAGP" />
        </div>
    </div>
</template>


<i18n locale="en">
{
	"explanations":	"Try to choose these settings such that blood glucose spends as much time in range as possible!"
}
</i18n>
<i18n locale="de">
{
	"explanations":	"Versuche, die Einstellungen so zu wählen, dass Du möglichst viel Zeit im Zielbereich verbringst."
}
</i18n>
