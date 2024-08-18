<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, toRaw } from 'vue'
import { defaults } from 'chart.js'
import ControllerSelection from './ControllerSelection.vue'
import VirtualPatientSelection from './VirtualPatientSelection.vue'
import SensorSelection from './SensorSelection.vue'
import ActuatorSelection from './ActuatorSelection.vue'
import MealTable from './MealTable.vue'
import ExerciseTable from './ExerciseTable.vue'
import ChartGlucose from './ChartGlucose.vue'
import ChartInsulinCarbs from './ChartInsulinCarbs.vue'
import ChartSignals from './ChartSignals.vue'
import ChartControllerOutput from './ChartControllerOutput.vue'
import SimulationOptionsConfig from './SimulationOptionsConfig.vue'
import ChartAGP from './ChartAGP.vue'
import { SimulationResult } from '../../types/SimulationResult.js'
import Patient, { PatientProfile } from '../../types/Patient.js'
import Controller from '../../types/Controller.js'
import Sensor from '../../types/Sensor.js'
import Actuator from '../../types/Actuator.js'
import Exercise from '../../types/Exercise.js'
import Meal from '../../types/Meal.js'
import Simulator, {SimulatorOptions} from '../../core/Simulator.js'


// prepare simulator
const sim = new Simulator()

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
        ControllerSelection,
        VirtualPatientSelection,
        SensorSelection,
        ActuatorSelection,
        MealTable,
        ExerciseTable,
        SimulationOptionsConfig,
        ChartGlucose,
        ChartInsulinCarbs,
        ChartControllerOutput,
        ChartAGP,
        ChartSignals,
    },

    created() {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key == 'Enter') {
                this.run()
            }
        })
    },

    data() {
        return {
            patient: {} as Patient,
            patientProfile: {} as PatientProfile,
            controller: {} as Controller,
            sensor: {} as Sensor,
            actuator: {} as Actuator,
            meals: [] as Meal[],
            exerciseUnits: [] as Exercise[],
            options: {} as SimulatorOptions,
            myCharts: [],
        }
    },

    methods: {
        run(): void {
            this.resetCharts()
            console.log("start simulation")

            sim.setPatient(this.getPatient())
            sim.setController(this.getController())
            sim.setMeals(this.getMeals())
            sim.setExerciseUnits(this.getExerciseUnits())
            sim.setOptions(this.getOptions())
            sim.setSensor(this.getSensor())
            sim.setActuator(this.getActuator())
            sim.runSimulation()

            // propagate results to charts
            const results = sim.getSimulationResults()
            this.propagateSimulationResults(results)
        },
        getController(): Controller {
            return <Controller>toRaw(this.controller)
        },
        getPatient(): Patient {
            return <Patient>toRaw(this.patient)
        },
        getSensor(): Sensor {
            return <Sensor>toRaw(this.sensor)
        },
        getActuator(): Actuator {
            return <Actuator>toRaw(this.actuator)
        },
        getMeals(): Meal[] {
            return toRaw(this.meals)
        },
        getExerciseUnits(): Exercise[] {
            return toRaw(this.exerciseUnits)
        },
        getOptions(): Object {
            const options = <InstanceType<typeof SimulationOptionsConfig>>
                this.$refs.options
            return toRaw(options.getParameterValues())
        },
        controllerChanged(newController: Controller): void {
            if (typeof newController !== "undefined") {
                console.log("Controller changed")
                console.log(newController)
                this.controller = newController
            }
        },
        patientChanged(newPatient: Patient): void {
            if (typeof newPatient !== "undefined") {
                console.log("Patient changed")
                this.patient = newPatient
                const profile = newPatient?.getPatientProfile?.()
                if (typeof profile !== "undefined") {
                    this.patientProfile = profile
                }
            }
        },
        sensorChanged(newSensor: Sensor): void {
            if (typeof newSensor !== "undefined") {
                console.log("Sensor changed")
                console.log(newSensor)
                this.sensor = newSensor
            }
        },
        actuatorChanged(newActuator: Actuator): void {
            if (typeof newActuator !== "undefined") {
                console.log("Actuator changed")
                this.actuator = newActuator
            }
        },
        mealsChanged(newMeals: Meal[]) {
            this.meals = newMeals
        },
        exercisesChanged(newExercises: Exercise[]) {
            this.exerciseUnits = newExercises
        },
        optionsChanged(newOptions: SimulatorOptions) {
            if (typeof newOptions !== "undefined") {
                console.log("Options changed")
                this.options = newOptions
            }
        },
        resetCharts() {
            for (const chart in this.$refs) {
                (<any>this.$refs[chart]).reset?.()
            }
        },
        propagateSimulationResults(simResults: SimulationResult[]) {
            for (const chart in this.$refs) {
                (<any>this.$refs[chart]).setSimulationResults?.(simResults) 
            }
        },
        /** callback when mouse hovers over medication chart */
        controllerDataHover(t0: Date, data: Object): void {
            if (typeof data === "undefined") {
                return
            }
            for (const chartName in this.$refs) {
                const chart = <any>this.$refs[chartName]
                chart.controllerDataHover?.(t0, toRaw(data))
            }
        },
    },
})
</script>


<template>
    <div class="lt1-container">
        <div class="box lt1-controls">
            <h2>{{ $t("settings") }}</h2>
            <ControllerSelection @controllerChanged="controllerChanged" :patientProfile="patientProfile" ref="controller" />
            <SensorSelection @valueChanged="sensorChanged" />
            <ActuatorSelection @valueChanged="actuatorChanged" />
            <VirtualPatientSelection @patientChanged="patientChanged" />
            <MealTable v-if='options.t0' :t0="options.t0" @mealsChanged="mealsChanged" ref="meals" />
            <ExerciseTable v-if='options.t0' :t0="options.t0" @exercisesChanged="exercisesChanged" />
            <SimulationOptionsConfig @valueChanged="optionsChanged" ref="options" />
            <div style="text-align:center;">
                <input type="button" id="startbutton" :value="$t('run')" @click="run" v-tooltip="{
                    global: true,
                    theme: {
                        placement: 'bottom',
                        width: 'fit-content',
                        padding: '2rem'
                    },
                }">
                <br/>
                <div style="font-size: 0.8em;">
                    {{ $t("shortcut") }}
                </div>
            </div>
        </div>
        <div class="box lt1-results">
            <h2>{{ $t("results") }}</h2>
            <ChartGlucose ref="chartGlucose" />
            <ChartInsulinCarbs ref="chartInsulinCarbs" @selectLog="controllerDataHover" />
            <ChartControllerOutput ref="chartControllerOutput" />
            <ChartSignals ref="chartSignals" />
            <ChartAGP ref="chartAGP" />
        </div>
    </div>
</template>


<style lang="css">

</style>


<i18n locale="en">
{
	"settings": 	"Settings",
	"run": 			"run simulation",
	"results":		"Results",
    "shortcut":     "or press Ctrl+Enter",
}
</i18n>
<i18n locale="de">
{
	"settings": 	"Einstellungen",
	"run": 			"Simulation starten",
	"results":		"Ergebnisse",
    "shortcut":     "oder Strg+Eingabe drücken"
}
</i18n>
