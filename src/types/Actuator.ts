/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import IOModule from './IOModule.js'
import { ControllerOutput, Medication } from './Signals.js'

/** An actuator serves to administer a medication */
export default interface Actuator extends IOModule {

    /**
     * Returns list of inputs used by this module.
     * @returns {Array<keyof ControllerOutput>} List of inputs.
     */
    getInputList(): Array<keyof ControllerOutput>

    /**
     * Returns list of outputs provided by this module.
     * @returns {Array<keyof Medication>} List of outputs.
     */
    getOutputList(): Array<keyof Medication>

    /**
     * Computes medication actually administered by actuator.
     * @param {Date} t - current time
     * @param {ControllerOutput} c - medication requested by controller
     * @returns {Date} Latest time of next update.
     */
    update(t: Date, c: ControllerOutput): Medication

}

export { ControllerOutput, Medication } from '../types/Signals.js'
