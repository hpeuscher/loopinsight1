/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import IOModule from './IOModule.js'
import {
    PatientInput,
    PatientInputOverTime,
    PatientOutput,
    VectorSignalDescription
} from './Signals.js'
import Solver from './Solver.js'

/**
 * Interface to describe a virtual patient.
 */
export default interface Patient extends IOModule {

    /**
     * Returns list of inputs used by this module.
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
     * @returns {VectorSignalDescription} Description of state variables.
     */
    getStateDescription(): VectorSignalDescription
    
    /**
     * return information about the patient to be passed on to the controller
     * @returns {PatientProfile}
     */
    getPatientProfile(): PatientProfile

    /**
     * Resets / re-initializes module to default.
     * @param {Date} t - Current time.
     * @param {number} seed - Random seed
     * @param {Solver} solver - Numerical ODE solver.
     */
    reset(t: Date, seed: number, solver: Solver): void

    /**
     * Updates module during simulation.
     * @param {Date} t - Current time.
     * @param {PatientInputOverTime} input - Input.
     */
    update(t: Date, input: PatientInputOverTime): void

    /**
     * Returns current physiological outputs of virtual patient.
     * @returns {PatientOutput} Patient outputs.
     */
    getOutput(): PatientOutput

    /**
     * Returns current physiological state of virtual patient.
     * @returns {PatientState} Patient state.
     */
    getState(): PatientState

    /** 
     * Sets initial state for simulation. 
     * @param {PatientState} x0 - New initial state.
     */
    setInitialState(x0: PatientState): void
}

export {PatientInput, PatientOutput} from './Signals.js'

/**
 * Type of object which describes the state variables.
 */
export declare type StateDescription = VectorSignalDescription

/** 
 * Type to describe state of patient physiology for given model states.
 */
export declare type TypedPatientState<States extends StateDescription> = {
    [id in keyof States]: number
}

/**
 * General type for state of patient physiology (not specific to a certain model)
 */
export declare type PatientState = {
    [id in string]: number
}

/**
 * Information about a virtual patient that is made available to controller
 */
export declare type PatientProfile = {
    /** patient name */
    name?: string
    /** typical insulin basal rate in U/h */
    IIReq: number
    /** average total daily dose in U */
    totalDailyDose?: number
    /** body weight in kg */
    BW?: number
    /** age in years */
    age?: number
}
