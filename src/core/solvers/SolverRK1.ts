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

/**
 * A class providing an explicit Euler numerical solver. 
 */
export default class SolverRK1 implements Solver {
    /** current step size in minutes */
    protected _timeStep = 1

    reset(defaultTimeStep: number) {
        this._timeStep = defaultTimeStep
    }

    solve(
        derivatives: Derivatives,
        tInit: Date,
        xInit: NamedVector,
        tFinal: Date,
    ): NamedVector {

        let t = tInit.valueOf()
        let dt = this._timeStep
        let x = xInit
        while (t < tFinal.valueOf()) {
            const tNext = Math.min(t + dt * MS_PER_MIN, tFinal.valueOf())
            x = this._performTimeStep(derivatives, t, x, (tNext - t) / MS_PER_MIN)
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
    _performTimeStep(
        derivatives: Derivatives,
        t: number,
        x: NamedVector,
        dt: number,
    ): NamedVector {
        return vectorSum(x,
            timesScalar(derivatives(new Date(t), x), dt)
        )
    }
}
