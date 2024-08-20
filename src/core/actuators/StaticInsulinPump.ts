/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


import NoiseAndError from '../../common/NoiseAndError.js'
import { quantize } from '../../common/UtilityFunctions.js'
import RNG_Ziggurat_SHR3 from '../../common/random/RNG_Ziggurat_SHR3.js'
import Actuator, { ControllerOutput, Medication } from '../../types/Actuator.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import AbstractActuator from '../AbstractActuator.js'

export const profile: ModuleProfile = {
    type: "actuator",
    id: "StaticInsulinPump",
    version: "2.1.0",
    name: "Static insulin pump",
}


/**
 *  Class representing an insulin pump with static, but stochastic behavior.
 */
export default class StaticInsulinPump
    extends AbstractActuator<typeof StaticInsulinPumpParameters> 
    implements Actuator {

    /** iir output in U/h */
    protected IIR!: number
    /** random number generator for noisy error  */ 
    private rng!: RNG_Ziggurat_SHR3
    /** utility class to distort desired signal */
    private noise!: NoiseAndError
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
        return StaticInsulinPumpParameters
    }

    reset(_t: Date, seed: number = 1): void {
        this.rng = new RNG_Ziggurat_SHR3(seed)
        this.noise = new NoiseAndError(this.rng)
        this.tNext = undefined
    }

    override getNextUpdateTime() {
        return this.tNext
    }

    update(t: Date, c: ControllerOutput) {

        let iir = c.iir || 0
        let ibolus = c.ibolus || 0
        const params = this.evaluateParameterValuesAt(t)

        // quantize
        iir = quantize(iir, params.inc_basal)
        ibolus = quantize(ibolus, params.inc_bolus)

        // boundaries
        iir = Math.min(iir, params.max_basal)
        ibolus = Math.min(ibolus, params.max_bolus)

        // add error relative to insulin dose
        iir = this.noise.distortValue(iir,
            params.relerr_basal,
            params.abserr_basal,
            params.bias_basal)
        ibolus = this.noise.distortValue(ibolus,
            ibolus>0 ? params.relerr_bolus : 0,
            ibolus>0 ? params.abserr_bolus : 0)
        
        // disable bolus output after 1 minute
        // TODO: What if the block is called earlier than that?!!
        this.tNext = (ibolus > 0) ? new Date(t.valueOf() + MS_PER_MIN) : undefined
        return { iir: iir + MIN_PER_HOUR * ibolus }
    }
}

const MIN_PER_HOUR = 60
const MS_PER_MIN = 60e3

const StaticInsulinPumpParameters = {
    /** increment of bolus in U */
    inc_bolus:     {unit: "U", default: 0.05},
    /** increment of basal rate in U/h */
    inc_basal:     {unit: "U/h", default: 0.05},
    /** maximal bolus in U */
    max_bolus:     {unit: "U", default: 30},
    /** maximal basal rate in U/h */
    max_basal:     {unit: "U/h", default: 30},
    /** relative error of bolus */
    relerr_bolus:  {unit: "1", default: 0},
    /** standard deviation of noise in bolus */
    abserr_bolus:  {unit: "", default: 0},
    /** constant offset/bias of basal rate in U/h */
    bias_basal:    {unit: "U/h", default: 0},
    /** relative error of basal rate */
    relerr_basal:  {unit: "1", default: 0},
    /** standard deviation of noise in basal rate */
    abserr_basal:  {unit: "U/h", default: 0},
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
        name: "Static insulin pump",
        bias_basal: "Constant bias in basal rate",
        relerr_basal: "Relative error in basal rate",
        abserr_basal: "Standard deviation of noise in basal rate",
        bias_bolus: "Constant bias in bolus",
        relerr_bolus: "Relative error in bolus",
        abserr_bolus: "Standard deviation of noise in bolus",
    },
}

