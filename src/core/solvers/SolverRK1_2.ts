/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import NamedVectorUtil from '../../common/NamedVectorUtil.js'
import { NamedVector } from '../../types/CommonTypes.js'
import Solver, { Derivatives } from '../../types/Solver.js'

const timesScalar = NamedVectorUtil.timesScalar
const vectorSum = NamedVectorUtil.vectorSum
const MS_PER_MIN = 60e3

/** Euclidian norm of vector */
const norm = (x: NamedVector) => Math.sqrt(Object.values(x).reduce(
    (acc, curr) => acc + Math.pow(curr, 2), 0))

/**
 * A class providing a variable-step numerical solver based on RK2 (Heun) and
 * RK1 (exp. Euler). 
 */
export default class SolverRK1_2 implements Solver {
    /** current step size in minutes */
    protected _timeStep = 1
    /** relative tolerance */
    protected _tol = 1e-3

    reset(defaultTimeStep: number) {
        this._timeStep = defaultTimeStep
    }

    solve(
        derivatives: Derivatives, 
        tInit: Date, 
        xInit: NamedVector, 
        tFinal: Date
    ): NamedVector {
        
        let t = tInit.valueOf()
        let x = xInit
        while (t < tFinal.valueOf()) {
            while (true) {
                /** next timestamp is _timeStep ahead, but final time is maximum */
                const tNext = Math.min(t + this._timeStep * MS_PER_MIN, tFinal.valueOf())
                /** actual time step */
                const dt = (tNext - t)/MS_PER_MIN
                /** result of solver step */
                const step = this.performTimeStep(derivatives, t, x, dt)
                if (step.e > this._tol) {
                    // error is above tolerance -> reduce step size and try again
                    this._timeStep /= 2
                }
                else
                {
                    // step is good
                    x = step.x
                    t = tNext
                    // compute estimate for next step size
                    this._timeStep = Math.max(1, Math.min(60, 
                        Math.floor( this._timeStep *  
                        Math.min(2, 0.9 * Math.sqrt(this._tol / 2 / step.e)))))
                    // complete this step
                    break
                }
            }
        }
        return x
    }

    /**
     * Performs single time step.
     * 
     * @param {function} derivatives - Function that returns dx/dt
     * @param {Date} t - Initial time as number.
     * @param {NamedVector} x - Initial state.
     * @param {number} dt - Time step in minutes.
     */
    performTimeStep(derivatives: Derivatives, t: number, x: NamedVector, dt: number) {

        const k1 = timesScalar(derivatives(new Date(t), x), dt)
        const k2 = timesScalar(derivatives(new Date(t + dt * MS_PER_MIN), vectorSum(x, k1)), dt)

        // compute error between Heun (RK2) and explicit Euler (RK1)
        const e = vectorSum(timesScalar(k1, -0.5), timesScalar(k2, 0.5))

        return {
            /** new state */
            x: vectorSum(x, timesScalar(k1, 0.5), timesScalar(k2, 0.5)),
            /** relative error */
            e: norm(e) / norm(x)
        }
    }
}
