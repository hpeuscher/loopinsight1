/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Simulation with announced and unannouced meals
 */


import { patient, sensor, controller, pump, meals, simOptions } from "./ReferenceScenario.js"
import runSimulationAndCreateCSV from './runSimulationAndCreateCSV.js'

// Unannouced meal with unscaled observer covariances
controller.setParameterValues({kaggr: 1, samplingTime: 15})

meals[0].announcement.carbs = 0

runSimulationAndCreateCSV(patient, sensor, controller, pump, meals, simOptions,
    './results/AnnouncementofMealsCase2.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp },
        {symbol: "u", value: (r) => r.u?.iir },
    ]
)

controller.setParameterValues({kaggr: 1, samplingTime: 15, 
    processNoise: {
        Q1: 1,
        Q2: 1,
        x1: 1,
        x2: 1,
        x3: 1,
        S1: 1,
        S2: 1,
        I: 1,
        D1: 1,
        D2: 1
    },
    measurementNoise: [4],
})

// Unannouced meal with scaled observer covariances
meals[0].announcement.carbs = 0

runSimulationAndCreateCSV(patient, sensor, controller, pump, meals, simOptions,
    './results/AnnouncementofMealsCase1.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp },
        {symbol: "u", value: (r) => r.u?.iir },
    ]
)

