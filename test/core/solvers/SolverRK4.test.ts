/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import SolverRK4 from '../../../src/core/solvers/SolverRK4.js'
import { NamedVector } from '../../../src/types/CommonTypes.js'
import { Derivatives } from '../../../src/types/Solver.js'

const solverRK4 = new SolverRK4()

describe('SolverRK4', () => {
    describe('#solve', () => {
        it("should perform a classic Runge-Kutta solve", () => {

            const derivatives: Derivatives = (t: Date, x: NamedVector): NamedVector => {
                return <NamedVector>{
                    x1: x.x2,
                    x2: Math.sin(x.x1) - 0.1 * x.x2
                }
            }
            const tInit = new Date(2023, 7, 21, 12, 0, 0)
            const tFinal = new Date(2023, 7, 21, 12, 1, 0)
            const xFinal = solverRK4.solve(derivatives, tInit, { x1: 5, x2: 10 }, tFinal)

            describe('check for value of x1', () => {
                it("should exist and match expected solution", () => {
                    expect(xFinal).to.haveOwnProperty("x1")
                    expect(Math.abs(xFinal.x1 - 14.263652950414464)).to.lessThan(1e-8)
                })
            })
            describe('check for value of x2', () => {
                it("should exist and match expected solution", () => {
                    expect(xFinal).to.haveOwnProperty("x2")
                    expect(Math.abs(xFinal.x2 - 8.86905208148586)).to.lessThan(1e-8)
                })
            })
        })
    })
})
