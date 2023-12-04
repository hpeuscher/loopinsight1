/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import IOModule from './IOModule.js'
import { PatientProfile } from './Patient.js'
import {
    AnnouncementList,
    ControllerOutput,
    Measurement,
    TracedMeasurement,
} from './Signals.js'


/**
 * A controller serves to compute the required medication based on
 * announcements or measurements.
 */
export default interface Controller extends IOModule {

    /**
     * Returns list of inputs used by this module.
     * @returns {Array<keyof Measurement>} List of inputs.
     */
    getInputList(): Array<keyof Measurement>

    /**
     * Returns list of outputs provided by this module.
     * @returns {Array<keyof ControllerOutput>} List of outputs.
     */
    getOutputList(): Array<keyof ControllerOutput>

    /**
    * Computes required medication.
    * @param {Date} t - Current time.
    * @param {TracedMeasurement} s - Sensor data.
    * @param {AnnouncementList} a - Meal announcements.
    * @param {Measurement} m - Output from parallel controllers called earlier.
    */
    update(
        t: Date,
        s: TracedMeasurement,
        a?: AnnouncementList,
        m?: ControllerOutput
    ): void

    /**
     * Returns previously computed medication.
     * @returns {ControllerOutput}
     */
    getOutput(): ControllerOutput

    /**
    * Returns current internal log messages, computations, predictions, etc.
    * @returns {ControllerInternals}
    */
    getInternals(): ControllerInternals

    /**
    * Uses information about patient to auto-configure parameters.
    * @param {PatientProfile} profile - patient information profile
    */
    autoConfigure?(profile: PatientProfile): void

}

export {
    AnnouncementList,
    ControllerOutput,
    Measurement,
    TracedMeasurement
} from './Signals.js'

/** 
 * Internal controller calculations, logging and debugging information.
 */
export declare type ControllerInternals = {
    /** primary log with main explanation of calculation */
    reason?: string[],
    /** additional output for debugging */
    debug?: string[],
    /** estimated insulin on board in U */
    IOB?: number,
    /** internal blood glucose prediction of controller */
    predictedBG?: Array<BGPrediction>,
}

/** Internal blood glucose prediction element of controller. */
export declare type BGPrediction = {
    /** time */
    t: Date
    /** blood glucose in mg/dl */
    Gp: number
}

