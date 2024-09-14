/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { isMultipleOfSamplingTime } from '../../common/DateUtility.js'
import LevenbergMarquardt from '../../common/LevenbergMarquardt.js'
import { sumOfSquares } from '../../common/LinearAlgebra.js'
import Controller, {
    AnnouncementList,
    ControllerOutput,
    Measurement,
    TracedMeasurement
} from '../../types/Controller.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import { ParameterDescriptions } from '../../types/ParametricModule.js'
import { PatientInputOverTime } from '../../types/Signals.js'
import AbstractController from '../AbstractController.js'
import Cambridge from '../models/Cambridge.js'
import SolverRK1 from '../solvers/SolverRK1.js'

/**
 * Class that describes nonlinear model predictive controller.
 * 
 * Scientific sources:
 * 
 * [Hovorka, 2004]
 *     Hovorka, R. et al.
 *     "Nonlinear model predictive control of glucose concentration in 
 *      subjects with type 1 diabetes"
 *     Physiological measurement, Volume 25, Number 4, 2004
 */

export const profile: ModuleProfile = {
    type: "controller",
    id: "MPC_Hovorka2004",
    version: "2.1.0",
    name: "MPC (Hovorka 2004)",
}

export default class MPC_Hovorka2004
    extends AbstractController<typeof MPCParameters>
    implements Controller {

    /** time of last update */
    protected _tLast!: Date
    /** optimal control sequence from previous iteration */
    protected u_opt_last!: number[]
    /** observer (patient simulator) */
    protected patient = new Cambridge()
    /** forward Euler solver */
    protected solver = new SolverRK1()


    getParameterDescription() {
        return MPCParameters
    }

    getI18n() {
        return { i18n_label, i18n_tooltip }
    }

    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof Measurement> {
        return ["CGM"]
    }

    getOutputList(): Array<keyof ControllerOutput> {
        return ["iir"]
    }

    override reset(t: Date) {
        super.reset(t)
        this.output = {}
        this._tLast = t

        // reset previous optimal control curve to constant values
        const params = this.evaluateParameterValuesAt(t)
        const u0 = []
        for (let i = 0; i < params.predictionHorizon; i++) {
            u0.push(1)
        }
        this.u_opt_last = u0

        // prepare forward Euler simulation with internal step size 5min
        this.solver.reset(5) // TODO: introduce parameter for this?

        // assume steady state in observer
        this.patient.setInitialState(undefined!)
    }

    update(t: Date, s: TracedMeasurement, a: AnnouncementList = {}) {
        /** parameters */
        const params = this.evaluateParameterValuesAt(t)
        // sampling
        if (isMultipleOfSamplingTime(t, params.samplingTime)) {
            // memorize time of update
            this._tLast = t

            /** measured glucose concentration in mg/dl */
            const G = s.CGM?.() || NaN

            const params = this.evaluateParameterValuesAt(t)
            /** prediction step size */
            const dt = params.predictionStep
            /** relative step size stopping criterion */
            const reltol = 1e-2
            /** initial Levenberg-Marquardt dampening */
            const lambda = 0.01

            // use previous optimal curve as initial values for optimization, 
            // but remove first element and copy last element instead
            let u0 = this.u_opt_last.slice(1)
            u0.push(u0[u0.length - 1])

            // prepare log
            let log: Array<string> = []

            // instanciate and call optimizer
            const u_opt = new LevenbergMarquardt((u) => {

                // step 1: perform simulation for given input sequence u
                const G_pred = this.predict(u, t, dt, a)

                // step 2: compute desired BG values
                let G_target = []
                for (let i = 0; i < params.predictionHorizon; i++) {
                    // TODO: replace by exponential / linear curve starting from current value
                    G_target.push(params.targetBG)  
                }

                // step 3: compute cost functional
                // TODO: add second term from Hovorka's paper, including kaggr
                const J = sumOfSquares(G_target.map((G_, i) => G_target[i] - G_pred[i]))
                return [J]
            }).findMinimum(u0, lambda, reltol, (msg: string) => log.push(msg))

            // store predicted BG levels for interactive visualization
            const G_pred = this.predict(u_opt!, t, dt, a)
            this.internals = {
                predictedBG: G_pred.map((G, k) => {
                    return {
                        Gp: G,
                        t: new Date(t.valueOf() + (k + 1) * dt * MS_PER_MIN)
                    }
                }),
                debug: log,
            }
            // debugging info
            log.unshift("u_opt: " + u_opt?.map((u) => Math.round(u * 1000) / 1000).join(", "))
            log.unshift("G_pred: " + G_pred?.map((G) => Math.round(G * 1000) / 1000).join(", "))

            // store solution for next iteration
            this.u_opt_last = u_opt!

            // output first value
            const iir = u_opt![0]
            this.output = { iir }

            // update observer based on computed control output
            // At the moment this is purely feedforward!
            // TODO: Use feedback G (sensor measurement)! 
            this.predict([iir], t, params.samplingTime, a)
            log.unshift("new observer state: " + JSON.stringify( this.patient.getState()))
            this.patient.setInitialState(this.patient.getState()!)

        }

        return {}
    }

    /**
     * Predict glucose levels for given input sequence
     * @param u - Input sequence.
     * @param t - Initial time.
     * @param dt - Time step in min.
     * @returns Sequence of predicted glucose values. 
     */
    predict(u: number[], t: Date, dt: number, a: AnnouncementList): number[] {
        /** prediction horizon */
        const horizon = u.length
        this.patient.reset(t, 0, this.solver)
        /** predicted glucose values */
        let G_pred = []
        for (let k = 0; k < horizon; k++) {
            /** time of next prediction */
            const t_pred = new Date(t.valueOf() + (k + 1) * dt * MS_PER_MIN)
            /** patient input during next time step */
            const u_t: PatientInputOverTime = (t) => {
                // TODO: take announcements into account
                return { iir: u[k], carbs: momentaryCarbIntake(a, t)  }
            }
            // simulate one time step ahead
            this.patient.update(t_pred, u_t)
            // store predicted glucose value
            G_pred.push(this.patient.getOutput().Gp)
        }
        return G_pred
    }

}

/** Conversion factor from milliseconds to minutes. */
const MS_PER_MIN = 60e3

/**
 * Computes momentary carb intake at given time
 * TODO: This method is copy/paste from Simulator.ts -> clean up!
 * 
 * @param {Date} t - Current time
 * @returns {number} Carb intake in g/min
 */
function momentaryCarbIntake(meals: AnnouncementList, t: Date): number {
    return Object.values(meals).map( (meal) => {
        // assume meal duration of 15min
        const duration = 15
        // see if given time is within meal duration 
        const { start, carbs } = meal
        const tend = new Date(start.valueOf() + duration * MS_PER_MIN)
        return ((t >= start!) && (t < tend)) ? carbs / duration : 0
    })
    // sum up contributions of all meals
    .reduce((acc, next) => acc + next, 0)
}


export const MPCParameters = {
    /** target blood glucose in mg/dl */
    targetBG: { unit: 'mg/dl', default: 120 },
    /** aggressivity factor */
    kaggr: { unit: "1", default: 1, step: 0.1 },
    /** sampling time in minutes */
    samplingTime: { unit: "min", default: 15, min: 5, step: 5 },
    /** prediction horizon (number of steps) */
    predictionHorizon: { unit: "steps", default: 12, step: 1 },
    /** prediction horizon (number of steps) */
    predictionStep: { unit: "min", default: 15, step: 5 },

} satisfies ParameterDescriptions


export const i18n_label = {
    en: {
        "name": "PID controller + bolus",
        "targetBG": "target glucose concentration",
        "samplingTime": "Sampling time",
        "predictionHorizon": "Prediction horizon",
        "predictionStep": "Prediction step size",
        "kaggr": "Aggressivity factor",
    },

    de: {
        "name": "PID-Regler + Bolus",
        "targetBG": "Ziel-Konzentration",
        "samplingTime": "Abtastzeit",
        "predictionHorizon": "Prädiktions-Horizont",
        "predictionStep": "Prädiktions-Schrittweite",
        "kaggr": "Aggressivititäts-Faktor",
    },
}

export const i18n_tooltip = {
    en: {
        "targetBG": "The desired blood glucose concentration the controller tries to reach.",
        "samplingTime": "This defines the time interval after which the controller is called and performs its computations.",
        "predictionHorizon": "This is the number of time steps the controller looks ahead. The total predicted time range is the product of prediction horizon and prediction timestep.",
        "predictionStep": "The duration of one prediction step. The total predicted time range is the product of prediction horizon and prediction timestep.",
        "kaggr": "The higher this value is chosen, the stronger the controller varies basal rate to achieve the desired glucose curve. Smaller values lead to softer course of action.",
    },

    de: {
        "targetBG": "Die gewünschte Blutzuckerkonzentration, die der Regler einzustellen versucht.",
        "samplingTime": "In diesem zeitlichen Abstand wird der Regler aufgerufen und führt seine Berechnungen durch.",
        "predictionHorizon": "So viele Zeitschritte blickt der Regler in die Zukunft. Der gesamte prädizierte Zeitraum ist das Produkt von Prädiktions-Horizont und Prädiktions-Schrittweite.",
        "predictionStep": "Die Dauer eines Prädiktions-Zeitschritts. Der gesamte prädizierte Zeitraum ist das Produkt von Prädiktions-Horizont und Prädiktions-Schrittweite.",
        "kaggr": "Je größer dieser Wert gewählt wird, desto stärker variiert der Regler die Basalrate, um den gewünschten Glukoseverlauf möglichst genau zu erreichen. Für kleinere Werte ist sein Vorgehen behutsamer.",
    }
}
