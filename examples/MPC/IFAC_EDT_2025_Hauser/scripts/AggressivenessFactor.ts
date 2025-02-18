/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Simulation with different aggressiveness factors
 */


import { patient, sensor, controller, pump, meals, simOptions } from "./ReferenceScenario.js"
import runSimulationAndCreateCSV from './runSimulationAndCreateCSV.js'

controller.setParameterValues({kaggr: 0.01, samplingTime: 15})

runSimulationAndCreateCSV(patient, sensor, controller, pump, meals, simOptions,
    './results/AggressivenessFactorCase1.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp },
        {symbol: "u", value: (r) => r.u?.iir },
    ]
)

controller.setParameterValues({kaggr: 1e10, samplingTime: 15})

runSimulationAndCreateCSV(patient, sensor, controller, pump, meals, simOptions,
    './results/AggressivenessFactorCase2.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp },
        {symbol: "u", value: (r) => r.u?.iir },
    ]
)