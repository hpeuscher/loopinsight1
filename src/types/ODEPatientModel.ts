/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { ModuleProfile } from './ModuleProfile.js'
import ParametricModule from './ParametricModule.js'
import {
    PatientState, StateDescription, PatientInput, PatientOutput
} from './Patient.js'


// declare type State = PatientState

/**
 * Interface to describe a virtual patient whose physiology is modeled by
 * a system of ordinary differential equations.
 */
export default interface ODEPatientModel<State extends PatientState>
    extends ParametricModule {
    
    /**
     * Returns information about the model.
     * @returns {ModuleProfile} Profile.
     */
    getModelInfo(): ModuleProfile

    /**
     * Returns list of inputs used by this model.
     * @returns {Array<keyof PatientInput>} List of inputs.
     */
    getInputList(): Array<keyof PatientInput>

    /**
     * Returns list of outputs provided by this module.
     * @returns {Array<keyof PatientOutput>} List of outputs.
     */
    getOutputList(): Array<keyof PatientOutput>

    /**
     * Returns description of state variables described by this module.
     * @returns {StateDescription} Description of state variables.
     */
    getStateDescription(): StateDescription

    /**
     * Computes equilibrium (homeostatis) state for given constant inputs
     * @param {PatientInput} u - Constant input (e.g., insulin infusion rate)
     * @param {Date} [t] - Time (equilibrium may depend on time of day)
     * @returns {State} Equilibrium state.
     */
    computeSteadyState(u: PatientInput, t: Date): State

    /**
     * Computes insulin infusion rate that stabilizes blood glucose at given
     * level.
     * @param {number} targetBG - Desired blood glucose concentration in mg/dl
     * @param {Date} t - Time
     * @returns {number} Insulin infusion rate
     */
    computeIIR?(targetBG: number, t: Date): number

    /**
     * Computes changes of discontinuous states during simulation.
     * Override this method if the model possesses state variables whose values
     * exhibit steps, i.e. discontinuous changes.
     * 
     * Background: Discontinuous signals cannot be generated using an ode
     * solver because of their infinite derivatives. This function is called in
     * every time step during simulation and allows discontinuous changes of the
     * state variables.
     * 
     * @param {Date} t - current time
     * @param {State} x - current state vector
     * @param {PatientInput} u - current inputs (treatments and disturbances)
     * @returns {State} updated state vector
     */
    updateDiscontinuousStates?(t: Date, x: State, u: PatientInput): State

    /**
     * Computes derivatives of continuous state variables.
     * 
     * @param {Date} t - Current time
     * @param {State} x - Current state vector
     * @param {PatientInput} u - Current inputs (treatments and disturbances)
     * @returns {State} Derivatives of states in 1/min
     */
    computeDerivatives(t: Date, x: State, u: PatientInput): State

    /**
     * Computes physiological outputs from state variables.
     * 
     * @param {Date} t - Current time
     * @param {State} x - Current state vector
     * @returns {PatientOutput} Patient outputs.
     */
    computeOutput(t: Date, x: State): PatientOutput

}
