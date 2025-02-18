/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Simulation with changed patient parameters and different models
 */


import UvaPadova_T1DMS from "../../../../src/core/models/UvaPadova_T1DMS.js";
import { patient, sensor, controller, pump, meals, simOptions } from "./ReferenceScenario.js"
import runSimulationAndCreateCSV from './runSimulationAndCreateCSV.js'

// Changed ke (insulin elimination from plasma)
patient.setParameterValues({ke: 0.24})

runSimulationAndCreateCSV(patient, sensor, controller, pump, meals, simOptions,
    './results/DifferentPatientModelCase2.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp }
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
});

// UVA/Padova model as patient
const newPatient = new UvaPadova_T1DMS()
newPatient.setParameterValues({Gpeq: 124.91784824923789})

runSimulationAndCreateCSV(newPatient, sensor, controller, pump, meals, simOptions,
    './results/DifferentPatientModelCase1.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp }
    ]
)