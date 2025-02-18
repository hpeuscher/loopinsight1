/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Simulation with different sampling times
 */


import { patient, sensor, controller, pump, meals, simOptions } from "./ReferenceScenario.js"
import runSimulationAndCreateCSV from './runSimulationAndCreateCSV.js'

controller.setParameterValues({samplingTime: 15});

runSimulationAndCreateCSV(patient, sensor, controller, pump, meals, simOptions,
    './results/SamplingTimeCase1.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp }
    ]
)

controller.setParameterValues({samplingTime: 25});

runSimulationAndCreateCSV(patient, sensor, controller, pump, meals, simOptions,
    './results/SamplingTimeCase2.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp }
    ]
)