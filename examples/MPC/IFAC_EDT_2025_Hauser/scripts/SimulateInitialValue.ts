/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Simulation with different inital start values
 */


import { patient, sensor, controller, pump, meals, simOptions } from "./ReferenceScenario.js"
import runSimulationAndCreateCSV from './runSimulationAndCreateCSV.js'

patient.setParameterValues({Gpeq: 160})

runSimulationAndCreateCSV(patient, sensor, controller, pump, [], simOptions,
    './results/SimulateInitialValueCase1.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp }
    ]
)

patient.setParameterValues({Gpeq: 124.91784824923789})

runSimulationAndCreateCSV(patient, sensor, controller, pump, [], simOptions,
    './results/SimulateInitialValueCase2.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp }
    ]
)

patient.setParameterValues({Gpeq: 110})

runSimulationAndCreateCSV(patient, sensor, controller, pump, [], simOptions,
    './results/SimulateInitialValueCase3.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp }
    ]
)

patient.setParameterValues({Gpeq: 80})

runSimulationAndCreateCSV(patient, sensor, controller, pump, [], simOptions,
    './results/SimulateInitialValueCase4.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp }
    ]
)