/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/*
The model implemented in this file is based on:

Eichenlaub, M. et al.
"Patch Pumps: Periodic Insulin Delivery Patterns"
Journal of Diabetes Science and Technology, Volume 17, Issue 4, July 2023
*/

import { quantize } from '../../common/UtilityFunctions.js'
import Actuator, { ControllerOutput, Medication } from '../../types/Actuator.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import AbstractActuator from '../AbstractActuator.js'

export const profile: ModuleProfile = {
    type: "actuator",
    id: "OmnipodDash",
    version: "2.1.0",
    name: "Omnipod Dash",
}

/** 
 * Class describing an Omnipod Dash insulin pump with dynamic model.
 */
export default class OmnipodDash
    extends AbstractActuator<typeof OmnipodDashParameters>
    implements Actuator {

    /** time of last update */
    protected _tLast!: Date
    /** total dose integral in U */
    protected _integral: number = 0
    /** time for next simulation stop */
    protected tNext!: Date | undefined

    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array <keyof ControllerOutput> {
        return ["iir", "ibolus"]
    }

    getOutputList(): Array <keyof Medication> {
        return ["iir"]
    }

    getParameterDescription() {
        return OmnipodDashParameters
    }

    reset(t: Date, seed: number) {
        // reset total dose integrator
        this._integral = this.evaluateParameterValuesAt(t).randomInitialPosition ? seed : 0
        // remember time
        this._tLast = t
        this.tNext = undefined
    }

    override getNextUpdateTime() {
        return this.tNext
    }

    update(t: Date, c: ControllerOutput) {
        const params = this.evaluateParameterValuesAt(t)
        
        let iir = c.iir || 0
        let ibolus = c.ibolus || 0
        
        /** time since last call in min */
        const dt = (t.valueOf() - this._tLast.valueOf()) / MS_PER_MIN
        // memorize time of update
        this._tLast = t

        // quantize
        iir = quantize(iir, params.inc_basal)
        ibolus = quantize(ibolus, params.inc_bolus)

        // boundaries
        iir = Math.min(iir, params.max_basal)
        ibolus = Math.min(ibolus, params.max_bolus)
        
        let totalIIR = iir + ibolus * MIN_PER_HOUR

        if (dt > 0) {
            // add oscillation depending on insulin dose
            totalIIR = this._periodicOscillation(iir * dt / MIN_PER_HOUR + ibolus, t)
                * MIN_PER_HOUR / dt
        }
        else
            totalIIR = iir

        // disable bolus output after 1 minute
        // TODO: What if the block is called earlier than that?!!
        this.tNext = (ibolus > 0) ? new Date(t.valueOf() + MS_PER_MIN) : undefined

        return { iir: totalIIR }
    }

    /**
     * Add periodic oscillation to requested insulin dose.
     * @param {number} insulinDose - requested dose in U
     * @returns {number} insulin dose superposed by oscillation in U
     */
    protected _periodicOscillation(insulinDose: number, t: Date): number {

        const params = this.evaluateParameterValuesAt(t)

        /** DC gain (average delivery per requested unit) */
        const A0 = params.A0
        /** period of one full rotation in U */
        const dosePeriod = params.dosePeriod
        /** increment of internal gear angle */
        const deltaPhi = insulinDose * 2 * Math.PI / dosePeriod

        /** first harmonic oscillation */
        const phi1 = params.phi1 + 2 * Math.PI / dosePeriod * this._integral
        const A1 = params.A1
        /** second harmonic oscillation */
        const phi2 = params.phi2 + 4 * Math.PI / dosePeriod * this._integral
        const A2 = params.A2
        
        /** delivery as superposition */
        const delivery = dosePeriod / (2*Math.PI) * ( A0 * deltaPhi +
            A1   * (- Math.cos(phi1 + deltaPhi) + Math.cos(phi1)) +
            A2/2 * (- Math.cos(phi2 + 2 * deltaPhi) + Math.cos(phi2)) )

        // increase internal counter (wheel position)
        this._integral += insulinDose

        return delivery
    }

}

const MIN_PER_HOUR = 60
const MS_PER_MIN = 60e3

export const OmnipodDashParameters = {
    /** increment of bolus in U */
    inc_bolus: {unit: 'U', default: 0.05},
    /** increment of basal rate in U/h */
    inc_basal: {unit: 'U/h', default: 0.05},
    /** maximal bolus in U */
    max_bolus: {unit: 'U', default: 30},
    /** maximal basal rate in U/h */
    max_basal: {unit: 'U/h', default: 30},
    /** amount of insulin per wheel rotation, in U */
    dosePeriod: {unit: 'U', default: 5},
    /** DC gain (mean value of output per input) */
    A0: {unit: '1', default: 1.0167},
    /** amplitude of first mode oscillation */
    A1: {unit: '1', default: -0.1852},
    /** phase shift of first mode in rad */
    phi1: {unit: 'rad', default: 0},
    /** amplitude of second mode oscillation */
    A2: {unit: '1', default: -0.0633},
    /** phase shift of second mode in rad */
    phi2: {unit: 'rad', default: 0},
    /** use random seed for initial angular position of wheel? */
    randomInitialPosition: {default: false}
}



export const i18n_label = {
    en: {
        inc_bolus: "Bolus increment",
        max_bolus: "Max bolus",
        inc_basal: "Basal rate increment",
        max_basal: "Max basal rate",
        dosePeriod: "Dose per rotation",
        randomInitialPosition: "Random initial position",
    },
}


export const i18n_tooltip = {
    en: {
        dosePeriod: "Amount of insulin delivered over one full mechanical rotation.",
        A0: "DC gain (mean value of output per input)",
        A1: "Amplitude of first mode oscillation",
        phi1: "Phase shift of first mode",
        A2: "Amplitude of second mode oscillation",
        phi2: "Phase shift of second mode",
        randomInitialPosition: "Activate to randomly set the initial wheel position",
    },
}
