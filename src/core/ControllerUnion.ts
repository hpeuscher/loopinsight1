/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import Controller, { ControllerInternals } from '../types/Controller.js'
import { ModuleProfile, ModuleTranslationList } from '../types/ModuleProfile.js'
import {
    ParameterDescriptions, ParameterValues
} from '../types/ParametricModule.js'
import { PatientProfile } from '../types/Patient.js'
import {
    AnnouncementList, ControllerOutput, Measurement, TracedMeasurement
} from '../types/Signals.js'
import Solver from '../types/Solver.js'

/**
 * utility class to easily build combinations of controllers
 */
export default class ControllerUnion implements Controller {

    /** array of controllers to be unified by this instance */
    protected _controllers: Array<Controller>
    /** log messages etc. */
    protected _internals: ControllerInternals = {}
    /** output */
    output: ControllerOutput = {}

    constructor(controllers: Array<Controller> = []) {
        this._controllers = controllers
    }

    getModelInfo(): ModuleProfile {
        // TODO
        return {
            type: "controller",
            id: "ControllerUnion",
            version: "",
            name: "ControllerUnion",
        }
    }

    getI18n() {
        // merge labels
        const i18n_label = this._controllers.reduce(
            (acc, c) => {
                const t = c.getI18n().i18n_label
                for (const locale of Object.keys(t)) {
                    acc[locale] = {...acc[locale], ...t[locale]}
                }
                return acc
            },
            {} as ModuleTranslationList)
        // merge tooltips
        const i18n_tooltip = this._controllers.reduce(
            (acc, c) => {
                const t = c.getI18n().i18n_tooltip
                for (const locale of Object.keys(t)) {
                    acc[locale] = {...acc[locale], ...t[locale]}
                }
                return acc
            },
            {} as ModuleTranslationList)
        return { i18n_label, i18n_tooltip }
    }

    getInputList(): Array<keyof Measurement> {
        return [...new Set(this._controllers.reduce(
            (acc, c) => acc = [...acc, ...c.getInputList()], 
            [] as Array<keyof Measurement>))]
    }

    getOutputList(): Array<keyof ControllerOutput> {
        return [...new Set(this._controllers.reduce(
            (acc, c) => acc = [...acc, ...c.getOutputList()],
            [] as Array<keyof ControllerOutput>))]
    }

    getParameterList(): Array<string> {
        return this._controllers.reduce(
            (acc, c) => acc = [...acc, ...c.getParameterList()],
            [] as Array<string>)
    }

    getParameterDescription(): ParameterDescriptions {
        return this._controllers.reduce(
            (acc, c) => acc = { ...acc, ...c.getParameterDescription() }, {})
    }

    getParameterUnit(id: string) {
        return this.getParameterDescription()[id]?.unit
    }

    getInternals() {
        return this._internals
    }

    restoreDefaultParameterValues() {
        for (const controller of this._controllers) {
            controller.restoreDefaultParameterValues()
        }
    }

    update(
        t: Date,
        s: TracedMeasurement,
        a: AnnouncementList = {},
        c: ControllerOutput = {}
    ): ControllerOutput {

        this._internals = {}
        let myOutput: ControllerOutput = {}

        // merge outputs 
        for (const controller of this._controllers) {
            controller.update(t, s, a, {...c})
            const newOutput: ControllerOutput = controller.getOutput()

            // sum up total bolus (including controllers run before us)
            c.ibolus = (c.ibolus || 0) + (newOutput.ibolus || 0)
            // sum up bolus to be output by this ControllerUnion instance
            myOutput.ibolus = (myOutput.ibolus || 0) + (newOutput.ibolus || 0)
            

            // sum up total basal rate (including controllers run before us)
            if (typeof (c.iir ?? newOutput.iir) !== "undefined") {
                c.iir = (c.iir ?? 0) + (newOutput.iir ?? 0)
            }
            // sum up basal rate to be output by this ControllerUnion instance
            if (typeof (myOutput.iir ?? newOutput.iir) !== "undefined") {
                myOutput.iir = (myOutput.iir ?? 0) + (newOutput.iir ?? 0)
            }

            // merge internal logs
            this._internals.IOB = this._internals.IOB ?? controller.getInternals()?.IOB

            this._internals.predictedBG = this._internals.predictedBG ??
                controller.getInternals()?.predictedBG

            this._internals.debug = [
                ... (this._internals.debug || []),
                ... (controller.getInternals()?.debug || [])]

            this._internals.reason = [
                ... (this._internals.reason || []),
                ... (controller.getInternals()?.reason || [])]

        }
        this.output = myOutput
        return this.output
    }

    getOutput(): ControllerOutput {
        return this.output
    }

    getNextUpdateTime(t: Date) {
        // find earliest timestamp
        const tNext = this._controllers.reduce(
            (acc, c) => 
                Math.min(acc, c.getNextUpdateTime(t)?.valueOf() || Infinity), 
            Infinity)
        if (isFinite(tNext))
            return new Date(tNext)
        return undefined
    }

    reset(t: Date, seed: number, solver: Solver) {
        for (const controller of this._controllers) {
            controller?.reset?.(t, seed, solver)
        }
        this.output = {}
        this._internals = {}
    }

    autoConfigure(profile: PatientProfile) {
        if (typeof profile !== "undefined") {
            for (const controller of this._controllers) {
                controller.autoConfigure?.(profile)
            }
        }
    }

    getDefaultParameterValues() {
        let p: ParameterValues = {}
        for (const controller of this._controllers) {
            p = { ...p, ...controller.getDefaultParameterValues() }
        }
        return p
    }

    getParameterValues(): ParameterValues {
        let p: ParameterValues = {}
        for (const controller of this._controllers) {
            p = { ...p, ...controller.getParameterValues() }
        }
        // console.log("getting from " + this.constructor.name + " " + JSON.stringify(p))
        return p
    }

    evaluateParameterValuesAt(t: Date): ParameterValues {
        let p: ParameterValues = {}
        for (const controller of this._controllers) {
            p = { ...p, ...controller.evaluateParameterValuesAt(t) }
        }
        // console.log("getting from " + this.constructor.name + " " + JSON.stringify(p))
        return p
    }

    setParameterValues(parameters: ParameterValues) {
        for (const controller of this._controllers) {
            // valid parameter ids of this controller
            const controllerParamList = controller.getParameterList()
            // filter given parameters accordingly
            const params = Object.keys(parameters).filter(
                (id) => controllerParamList.includes(id)
            ).map(
                (id) => [id, parameters[id]]
            )
            // console.log("setting in " + controller.constructor.name + " " + JSON.stringify(params))
            // set selected parameters that match respective controller
            controller.setParameterValues(Object.fromEntries(params))
        }
    }
}
