/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { NamedVector, Vector } from '../types/CommonTypes.js'
import NamedVectorUtil from './NamedVectorUtil.js'
import NewtonRaphsonSolver from './NewtonRaphsonSolver.js'

export type StructuredFunction = (x: NamedVector[]) => NamedVector
export type VectorFunction = (x: Vector) => Vector


export default class SteadyStateFinder {

    /**
     * Finds a steady state of the autonomous state space model x' = f(x), 
     * i.e. for the case that the input is known/given and only the 
     * corresponding equilibrium state is unknown.
     * 
     * @param {StructuredFunction} f - State equation f(x) returning dx/dt as an object
     * @param {Partial<X>} x0 - Initial values of unknown elements of x. 
     *      x0 and xknown must be partitions whole state x.
     * @param {Partial<X>} xknown - Initial values of unknown elements of x.
     *      x0 and xknown must be partitions whole state x.
     * @returns{X} Full state x such that f(x) = 0.
     */
    public findSteadyState<X extends NamedVector, X0 extends Partial<X>> (
        f: (x: X) => X,
        x0: X0, 
        xknown: Partial<X> = {}
    ): X {

        const x = NamedVectorUtil.clone(<NamedVector>x0)
        const z = new NewtonRaphsonSolver(z => {
            this.assign(z, x)
            const dxdt = f(<X>{...x, ...xknown})
            return this.anonymize(<X>Object.fromEntries(Object.keys(x0).map((key)=>[key, dxdt[key]])))
        }).solve(this.anonymize(<NamedVector>x0))

        if (typeof z === "undefined") {
            throw new Error("steady state could not be found.")
        }
        this.assign(z, x)
        return <X>{...x, ...xknown}
    }


    /**
     * Finds a steady state of the state space model x' = f(x, u)
     * 
     * @param {StructuredFunction} f: state equation f(x,u) returning dx/dt as an object
     * @param {X extends NamedVector} x0: initial value of state x
     * @param {U extends NamedVector} x0: initial value of input u
     * @returns x and u such that f(x,u)=0
     */
    public findSteadyStateAndInput<X extends NamedVector, U extends NamedVector>
        (f: ([x, u]: [X, U]) => NamedVector, x0: X, u0: U): [X, U] {

        const [x, u] = [NamedVectorUtil.clone(x0), NamedVectorUtil.clone(u0)]
        const solver = this
        const z = new NewtonRaphsonSolver(function(z: Vector): Vector {
            solver.assign(z, x, u)
            const y: NamedVector = f([NamedVectorUtil.clone(x), NamedVectorUtil.clone(u)])
            return solver.anonymize(y)
        }).solve(this.anonymize(x0, u0))

        if (typeof z === "undefined") {
            throw new Error("steady state could not be found.")
        }

        this.assign(z, x, u)
        return [x, u]
    }

    /**
     * Strips the keys/names off state and input vector and returns them as a 
     * plain vector.
     * 
     * @param {NamedVector} x - Vector with named entries.
     * @param {NamedVector} u - (optional) Additional vector with named entries.
     * @returns {Vector} Array containing only the values.
     */
    public anonymize(x: NamedVector, u: NamedVector = {}): Vector {
        let z: Vector = Object.values(x)
        z.push(...Object.values(u))
        return z
    }

    /**
     * Assigns values of plain vector to a named state (and input) vector
     * 
     * @param {Vector} z - Array containing only the values.
     * @param {NamedVector} x - NamedVector (by reference) to assign the values to.
     * @param {NamedVector} u - NamedVector (by reference) to assign the values to.
     */
    public assign( z: Vector, x: NamedVector, u?: NamedVector): void {
        let index = 0
        for (const key of Object.keys(x)) {
            x[key] = z[index++]
        }
        if (typeof u !== "undefined") {
            for (const key of Object.keys(u)) {
                u[key] = z[index++]
            }
        }
    }
}
