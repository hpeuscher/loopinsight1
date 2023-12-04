/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { ModuleProfile } from './ModuleProfile.js'
import ParametricModule from './ParametricModule.js'
import Solver from './Solver.js'

/**
 * An interface describing a component of the simulation that accepts input
 * signals and provides output signals.
 * It is reset once before starting the simulation and then updated regularly.
 */
export default interface IOModule extends ParametricModule {
    /**
     * Returns information about the model.
     * @returns {ModuleProfile} Profile.
     */
    getModelInfo(): ModuleProfile

    /**
     * Returns list of inputs used by this module.
     * @returns {Array<string>} List of inputs.
     */
    getInputList(): Array<string>

    /**
     * Returns list of outputs provided by this module.
     * @returns {Array<string>} List of outputs.
     */
    getOutputList(): Array<string>

    /**
     * Resets / re-initializes module to default.
     * @param {Date} t - Current time.
     * @param {number} seed - Random seed
     * @param {Solver} solver - Numerical ODE solver.
     */
    reset(t: Date, seed: number, solver: Solver): void

    /**
     * Updates module and simulates block up to given time t.
     * @param {Date} t - Current time.
     * @param {object | function} input
     */
    update(t: Date, input: object | ((t_: Date) => object)): void

    /**
     * Returns next required update time.
     * @returns {Date | undefined}
     */
    getNextUpdateTime(t: Date): Date | undefined

}
