/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Simulation with non-ideal sensor
 */


import { patient, sensor, controller, pump, meals, simOptions } from "./ReferenceScenario.js"
import runSimulationAndCreateCSV from './runSimulationAndCreateCSV.js'
import CGM_Breton2008 from '../../../../src/core/sensors/Breton2008.js'

// High sensor noise and unscaled observer covariances
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

const newSensor = new CGM_Breton2008()

runSimulationAndCreateCSV(patient, newSensor, controller, pump, meals, simOptions,
    './results/NonidealSensorCase1.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp },
        {symbol: "CGM", value: (r) => r.s?.CGM }
    ]
)

// High sensor noise and scaled observer covariances
controller.setParameterValues({kaggr: 1, samplingTime: 15,
    processNoise: {
        Q1: 0.1,
        Q2: 0.1,
        x1: 0,
        x2: 0,
        x3: 0,
        S1: 0,
        S2: 0,
        I: 0,
        D1: 0.1,
        D2: 0.1
    },
    measurementNoise: [1e8],
});

runSimulationAndCreateCSV(patient, newSensor, controller, pump, meals, simOptions,
    './results/NonidealSensorCase2.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp },
        {symbol: "CGM", value: (r) => r.s?.CGM }
    ]
)


// Little sensor noise and unscaled observer covariances
/* controller.setParameterValues({kaggr: 1, samplingTime: 15,
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

newSensor.setParameterValues({PACF: 0.1})

runSimulationAndCreateCSV(patient, newSensor, controller, pump, meals, simOptions,
    './results/NonidealSensorCase3.csv',
    [
        {symbol: "G", value: (r) => r.y?.Gp }
    ]
) */