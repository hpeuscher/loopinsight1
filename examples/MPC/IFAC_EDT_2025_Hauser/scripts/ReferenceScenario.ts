/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Reference scenario
 */

import  { SimulatorOptions } from '../../../../src/core/Simulator.js'
import StaticInsulinPump from '../../../../src/core/actuators/StaticInsulinPump.js'
import ControllerMPC from '../../../../src/core/controllers/MPC_Hovorka2004.js'
import IdealCGM from '../../../../src/core/sensors/IdealCGM.js'
import Cambridge from '../../../../src/core/models/Cambridge.js'


// define the virtual patient
export const patient = new Cambridge({
    Gpeq: 124.91784824923789
})

// define a sensor
export const sensor = new IdealCGM

// define an insulin pump
export const pump = new StaticInsulinPump()

// define a controller/algorithm
export const controller = new ControllerMPC({
    processNoise: {
        Q1: 0.1,
        Q2: 0.1,
        x1: 0,
        x2: 0,
        x3: 0,
        S1: 0,
        S2: 0,
        I: 0,
        D1: 1000,
        D2: 10
    },
    measurementNoise: [100],
    samplingTime: 5,
    kaggr: 1e3,
    targetBG: 110
})

// define a set of meals
export const meals = [
    {
        start: new Date("2024-07-20T08:00:00Z"),
        carbs: 40,
        duration: 15,
        announcement: {
            start: new Date("2024-07-20T08:00:00Z"),
            carbs: 40,
            time: new Date("2024-07-20T00:00:00Z"),
        },
    },
]

// define options
export const simOptions: SimulatorOptions = {
    "t0": new Date("2024-07-20T00:00:00Z"),
    "tmax": new Date("2024-07-20T24:00:00Z"),
}