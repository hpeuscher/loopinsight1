/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import IOModule from './IOModule.js'
import { Measurement, PatientOutput, TracedMeasurement } from './Signals.js'

/** A sensor delivers measurements based on physiological patient outputs. */
export default interface Sensor extends IOModule {

    /**
     * Returns list of inputs used by this module.
     * @returns {Array<keyof PatientOutput>} List of inputs.
     */
    getInputList(): Array<keyof PatientOutput>

    /**
     * Returns list of outputs provided by this module.
     * @returns {Array<keyof Measurement>} List of outputs.
     */
    getOutputList(): Array<keyof Measurement>

    /**
     * Compute measurements delivered by sensor.
     * @param {Date} t - Current time.
     * @param {PatientOutput} y - Physiological outputs from patient.
     */
    update(t: Date, y: PatientOutput): Measurement

    /**
     * Returns current measurement values.
     * @returns {TracedMeasurement}
     */
    getOutput(): TracedMeasurement

}

export { Measurement, PatientOutput } from '../types/Signals.js'
