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

export default class SolverRK4 implements Solver {
    /** fixed time step in minutes */
    protected _timeStep = 1

    reset(defaultTimeStep: number) {
        this._timeStep = defaultTimeStep
    }

    solve(derivatives: Derivatives, tInit: Date, xInit: NamedVector, tFinal: Date): NamedVector {

        let t = tInit.valueOf()
        let dt = this._timeStep
        let x = xInit
        while (t < tFinal.valueOf()) {
            const tNext = Math.min(t + dt * MS_PER_MIN, tFinal.valueOf())
            x = this.performTimeStep(derivatives, t, x, (tNext - t) / MS_PER_MIN)
            t = tNext
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
    performTimeStep(derivatives: Derivatives, t: number, x: NamedVector, dt: number): NamedVector {
        const k1 = timesScalar(derivatives(new Date(t), x), dt)
        const k2 = timesScalar(derivatives(new Date(t + dt * MS_PER_MIN / 2), vectorSum(x, timesScalar(k1, 1 / 2))), dt)
        const k3 = timesScalar(derivatives(new Date(t + dt * MS_PER_MIN / 2), vectorSum(x, timesScalar(k2, 1 / 2))), dt)
        const k4 = timesScalar(derivatives(new Date(t + dt * MS_PER_MIN), vectorSum(x, k3)), dt)

        return vectorSum(x,
            timesScalar(k1, 1 / 6),
            timesScalar(k2, 1 / 3),
            timesScalar(k3, 1 / 3),
            timesScalar(k4, 1 / 6)
        )
    }
}
