/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { Vector } from '../../types/CommonTypes.js'
import { isMultipleOfSamplingTime } from '../../common/DateUtility.js'
import LevenbergMarquardt from '../../common/LevenbergMarquardt.js'
import EKF from '../../common/EKF.js'
import Controller, {
    AnnouncementList,
    ControllerOutput,
    Measurement,
    TracedMeasurement
} from '../../types/Controller.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import { ParameterDescriptions } from '../../types/ParametricModule.js'
import { PatientInput, PatientInputOverTime } from '../../types/Signals.js'
import AbstractController from '../AbstractController.js'
import Cambridge, { stateDescription, State, i18n_tooltip as stateTranslation } from '../models/Cambridge.js'
import SolverRK1 from '../solvers/SolverRK1.js'
import { scalarMultiplyDiagonal, eye, vectorToDiagonalMatrix } from '../../common/LinearAlgebra.js'

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
    /** Initialization of observer */
    protected ekf!: EKF
    /** Process noise for Observer */
    protected Q!: number[][]
    /** Measurement noise for Observer */
    protected R!: number[][]

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

        const iir = this.patient.computeIIR?.(120, t) ?? 0.4

        // reset previous optimal control curve to constant values
        const params = this.evaluateParameterValuesAt(t)
        const u0 = []
        for (let i = 0; i < params.predictionHorizon; i++) {
            u0.push(iir)
        }
        this.u_opt_last = u0

        // prepare forward Euler simulation with internal step size 5min
        this.solver.reset(5) // TODO: introduce parameter for this?

        // assume steady state in observer
        this.patient.setInitialState(undefined!)

        // Initialization of Observer 
        // Initial matrix of covariance
        const P_ini = scalarMultiplyDiagonal(eye(10), 0.1)
        // Inital start of observer in steady state
        const x_ini = this.patient.computeSteadyState({
            iir,
            hir: 0,
            carbs: 0,
            exercise: 0,
            meal: 0
        }, t)

        this.ekf = new EKF(
            (t: Date, x: Vector, u: PatientInput) => {
                const state = mapVectorToState(x)
                const derivatives = this.patient.computeDerivatives(t, state, u)
                return Object.values(derivatives)
            },
            (t: Date, x: Vector) => {
                const state = mapVectorToState(x)
                return [this.patient.computeOutput(t, state).Gp]
            },
            mapStateToVector(x_ini),
            P_ini
        )

        // Initialization of process and measurement noise
        this.Q = vectorToDiagonalMatrix(Object.keys(stateDescription).map((k)=><any>params.processNoise[k]))
        this.R = vectorToDiagonalMatrix(params.measurementNoise)
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

            /** prediction step size */
            const dt = params.predictionStep

            //Innovation step of observer
            let x_est = this.ekf.innovation(t, [G], this.R)
            this.patient.setInitialState(mapVectorToState(x_est))

            /** relative step size stopping criterion */
            const reltol = 1e-3
            /** initial Levenberg-Marquardt dampening */
            const lambda = 0.1

            // use previous optimal curve as initial values for optimization, 
            // but remove first element and copy last element instead
            let u0 = this.u_opt_last.slice(1)
            u0.push(u0[u0.length - 1])

            // prepare log
            let log: Array<string> = []

            // compute target trajectory
            const targetprojector = new TargetProjector(
                G, params.predictionHorizon, params.predictionStep,
                params.targetBG)
            const G_target = targetprojector.getTargetTrajectory()

            // instanciate and call optimizer
            const u_opt = new LevenbergMarquardt((u) => {

                // perform simulation for given input sequence u
                const G_pred = this.predict(u, t, dt, a)

                // compute cost functional
                const RG = G_pred.map((G_, i) => G_ - G_target[i])
                const RU = u.slice(1).map((value, index) => (value - u[index]) / Math.sqrt(params.kaggr))
                const R = []
                for (let i = 0; i < G_target.length - 1; i++) {
                    R[2 * i] = RG[i]
                    R[2 * i + 1] = RU[i]
                }
                R.push(RG[RG.length - 1])

                return R
            }).findMinimum(u0, lambda, reltol, (msg: string) =>
                log.push(msg), params.lowerBound, params.upperBound)

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
            log.unshift("u_opt: " + u_opt?.map((u) =>
                Math.round(u * 1000) / 1000).join(", "))
            log.unshift("G_pred: " + G_pred?.map((G) =>
                Math.round(G * 1000) / 1000).join(", "))

            // store solution for next iteration
            this.u_opt_last = u_opt!

            // output first value
            const iir = u_opt![0]
            this.output = { iir }

            // Update step of observer
            const u = (t: Date) => { return { iir: iir, carbs: momentaryCarbIntake(a, t) } }
            this.ekf.prediction(params.samplingTime, t, u, this.Q)
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
                return { iir: u[k], carbs: momentaryCarbIntake(a, t) }
            }
            // simulate one time step ahead
            this.patient.update(t_pred, u_t)
            // store predicted glucose value
            G_pred.push(this.patient.getOutput().Gp)
        }
        return G_pred
    }

}


/**
 * Class to generate target blood glucose trajectory according to [Hovorka 2004]
 */
export class TargetProjector {
    /* Target glucose trajectory array */
    private G_target: number[]

    /**
     * Constructor to create the glucose target trajectory
     * 
     * @param {number} G - Measured glucose concentraiton (mg/dL).
     * @param {number} predictionHorizon - Prediction horizon.
     * @param {number} dt - Time step in minutes.
     * @param {number} targetBG - Target glucose concentration (mg/dL).
     */
    constructor(G: number, predictionHorizon: number, dt: number, targetBG: number) {
        this.G_target = this.computeTargetTrajectory(G, predictionHorizon, dt, targetBG)
    }

    /**
     * Function to compute the reference glucose trajectory
     * 
     * @param {number} G - Measured glucose concentration (mg/dL).
     * @param {number} predictionHorizon - Prediction horizon.
     * @param {number} dt - Time step in minutes.
     * @param {number} targetBG - Target glucose concentration (mg/dL).
     * @returns {number[]} - Simulated reference glucose trajectory.
     */
    private computeTargetTrajectory(G: number, predictionHorizon: number,
        dt: number, targetBG: number): number[] {
        const G_target: number[] = new Array(predictionHorizon).fill(0)
        G_target[0] = G

        // Conversion factor from mmol/L in mg/dL
        const mmolL2mgdL = 18.018

        // Parameters and thresholds based on the Hovorka paper [2004]
        // Threshold at 8 mmol/L
        const threshold_exp = mmolL2mgdL * 8
        // Fast decrease rate (mg/dL per minute)
        const fast_change_rate = (2 * mmolL2mgdL) / 60
        // Slow decrease rate (mg/dL per minute) 
        const slow_change_rate = (1 * mmolL2mgdL) / 60

        for (let i = 1; i <= predictionHorizon; i++) {
            if (G_target[i - 1] > threshold_exp) {
                G_target[i] = Math.max(G_target[i - 1] - fast_change_rate * dt, targetBG)
            } else if (G_target[i - 1] > targetBG) {
                G_target[i] = Math.max(G_target[i - 1] - slow_change_rate * dt, targetBG)
            } else if (G_target[i - 1] < targetBG) {
                const a = Math.pow(0.5, dt / 15)
                const b = 1 - a
                G_target[i] = a * G_target[i - 1] + b * targetBG
            } else {
                G_target[i] = targetBG
            }
        }

        return G_target.slice(1)
    }

    /**
     * Get the computed glucose reference trajectory.
     * 
     * @returns {number[]} - Reference glucose trajectory.
     */
    public getTargetTrajectory(): number[] {
        return this.G_target
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
    return Object.values(meals).map((meal) => {
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

/**
 * Converts a vector to a State.
 * 
 * @param {Vector} x - Input vector with 10 elements representing the state.
 * @returns {State} Mapped patient state from the vector.
 */
function mapVectorToState(x: Vector): State {
    const stateNames = <Array<keyof State>>Object.keys(stateDescription)
    return stateNames.reduce((state, field, index) => {
        state[field] = x[index]
        return state
    }, {} as State)
}


/**
 * Converts a State to a vector.
 *
 * @param {State} state - Input State to be converted.
 * @returns {Vector} The resulting vector representation of the state.
 */
function mapStateToVector(state: State): Vector {
    return Object.values(state)
}


export const MPCParameters = {
    /** target blood glucose in mg/dl */
    targetBG: { unit: 'mg/dl', default: 120 },
    /** aggressivity factor */
    kaggr: { unit: "", default: 1, step: 0.1 },
    /** sampling time in minutes */
    samplingTime: { unit: "min", default: 15, min: 5, step: 5 },
    /** prediction horizon (number of steps) */
    predictionHorizon: { unit: "steps", default: 12, step: 1 },
    /** prediction horizon (number of steps) */
    predictionStep: { unit: "min", default: 15, step: 5 },
    /**  lower constraint of control size */
    lowerBound: { unit: "mg/dL", default: 0, step: 0.1 },
    /**  upper constraint of control size */
    upperBound: { unit: "mg/dL", default: 4, step: 0.1 },
    /** Process noise */
    processNoise: { unit: "1", default: Object.fromEntries(
        Object.keys(stateDescription).map((e) => [e, {default: 1, step: 0.1 }])) },
    /** Measurement noise */
    measurementNoise: { unit: "1", default: new Array(1).fill(4), step: 0.1 },

} satisfies ParameterDescriptions


export const i18n_label = {
    en: {
        "name": "PID controller + bolus",
        "targetBG": "target glucose concentration",
        "samplingTime": "Sampling time",
        "predictionHorizon": "Prediction horizon",
        "predictionStep": "Prediction step size",
        "kaggr": "Aggressivity factor",
        "lowerBound": "lower Bound u",
        "upperBound": "upper Bound u",
        "processNoise": {_: "Process noise"},
        "measurementNoise": "Measurement noise",
    },

    de: {
        "name": "PID-Regler + Bolus",
        "targetBG": "Ziel-Konzentration",
        "samplingTime": "Abtastzeit",
        "predictionHorizon": "Prädiktions-Horizont",
        "predictionStep": "Prädiktions-Schrittweite",
        "kaggr": "Aggressivititäts-Faktor",
        "lowerBound": "untere Grenze u",
        "upperBound": "obere Grenze u",
        "processNoise": {_: "Prozessrauschen"},
        "measurementNoise": "Messrauschen",
    },
}

export const i18n_tooltip = {
    en: {
        "targetBG": "The desired blood glucose concentration the controller tries to reach.",
        "samplingTime": "This defines the time interval after which the controller is called and performs its computations.",
        "predictionHorizon": "This is the number of time steps the controller looks ahead. The total predicted time range is the product of prediction horizon and prediction timestep.",
        "predictionStep": "The duration of one prediction step. The total predicted time range is the product of prediction horizon and prediction timestep.",
        "kaggr": "The higher this value is chosen, the stronger the controller varies basal rate to achieve the desired glucose curve. Smaller values lead to softer course of action.",
        "lowerBound": "This is the lower limit of the control variable..",
        "upperBound": "This is the upper limit of the control variable.",
        "processNoise": {_: "The larger these value is chosen, the more the measurement is trusted. Large values indicate high uncertainty in the respective state of the system.", ...stateTranslation.en},
        "measurementNoise": "The larger this value is chosen, the more the process model is trusted. High values indicate high uncertainties in the measurement model.",
    },

    de: {
        "targetBG": "Die gewünschte Blutzuckerkonzentration, die der Regler einzustellen versucht.",
        "samplingTime": "In diesem zeitlichen Abstand wird der Regler aufgerufen und führt seine Berechnungen durch.",
        "predictionHorizon": "So viele Zeitschritte blickt der Regler in die Zukunft. Der gesamte prädizierte Zeitraum ist das Produkt von Prädiktions-Horizont und Prädiktions-Schrittweite.",
        "predictionStep": "Die Dauer eines Prädiktions-Zeitschritts. Der gesamte prädizierte Zeitraum ist das Produkt von Prädiktions-Horizont und Prädiktions-Schrittweite.",
        "kaggr": "Je größer dieser Wert gewählt wird, desto stärker variiert der Regler die Basalrate, um den gewünschten Glukoseverlauf möglichst genau zu erreichen. Für kleinere Werte ist sein Vorgehen behutsamer.",
        "lowerBound": "Das ist die untere Beschränkung der Stellgröße.",
        "upperBound": "Das ist die obere Beschränkung der Stellgröße.",
        "processNoise": {_: "Je größer dieser Wert gewählt werden, desto mehr wird auf die Messung vertraut. Große Werte bedeuten hohe Unsicherheit im jeweiligen Zustand des Systems.", ...stateTranslation.de},
        "measurementNoise": "Je größer dieser Wert gewählt wird, desto mehr wird auf die Prozessmodell vertraut. Hohe Werte bedeuten hohe Unsicherheiten im Messmodell.",
    }
}