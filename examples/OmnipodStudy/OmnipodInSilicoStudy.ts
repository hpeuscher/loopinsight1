/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * This file performs an in silico study on the effect of the periodic delivery
 * patterns of Omnipod Dash.
 * 
 * REQUIRES T1DMS PATIENT FILES TO BE PRESENT IN /src/core/models/patients/T1DMS/
 * 
 * Usage:   cd ./examples/OmnipodStudy
 *          node --loader ts-node/esm ./OmnipodInSilicoStudy.ts
 */

import * as fs from 'fs'
import Simulator from '../../src/core/Simulator.js'
import OmnipodDash from '../../src/core/actuators/OmnipodDash.js'
import ControllerCSII from '../../src/core/controllers/CSII.js'
import VirtualPatientUvaPadova from '../../src/core/models/UvaPadova_T1DMS.js'
import CGMSensor from '../../src/core/sensors/IdealCGM.js'
import Patient from '../../src/types/Patient.js'


// function for easy call of simulation
function performSimulation(patient: Patient, id: string) {

    // use controller with constant desired basal rate
    const controller = new ControllerCSII()
    controller.autoConfigure?.(patient.getPatientProfile())
    
    // use ideal sensor
    const sensor = new CGMSensor()

    // initialize omnipod dash
    const pump = new OmnipodDash()

    // prepare the simulator
    const sim = new Simulator()
    sim.setPatient(patient)
    sim.setController(controller)
    sim.setMeals([])
    sim.setSensor(sensor)
    sim.setActuator(pump)
    sim.setOptions({
        "t0": new Date("2022-05-01T00:00:00Z"),
        "tmax": new Date("2022-05-03T00:00:00Z"),
    })

    // run simulation
    const results = sim.runSimulation()

    return { id, patient, results }

}

// run simulation
let results: any = {}

for (const group of ['adult', 'adolescent', 'child']) {
    for (let i = 1; i <= 10; i++) {
        const patientName = group + "#" + ("00" + i).slice(-3)

        // TODO: requires T1DMS patients
        const filePatientParameter = fs.readFileSync(
            '../../src/core/models/patients/T1DMS/' + patientName + '.json',
            { encoding: 'utf8' })
        const objPatientParameter = JSON.parse(filePatientParameter)

        // define a patient object
        const patient = new VirtualPatientUvaPadova(objPatientParameter.parameters)

        // perform simulation
        results[patientName] = performSimulation(patient, patientName)
    }
}

// store simulation input and results to JSON file
fs.writeFile("OmnipodInSilicoStudy.json",
    JSON.stringify(results),
    function (err: NodeJS.ErrnoException | null) {
        if (err) {
            throw err
        }
        console.log("Done! Now run preprocessing.")
    }
)
