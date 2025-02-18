/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Simulation of reference scenario
 */

import { patient, sensor, controller, pump, meals, simOptions } from "./ReferenceScenario.js"
import runSimulationAndCreateCSV from './runSimulationAndCreateCSV.js'


runSimulationAndCreateCSV(patient, sensor, controller, pump, meals, simOptions,
    './results/ReferenceScenario.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp },
        {symbol: "u", value: (r) => r.u?.iir },
    ]
) 
