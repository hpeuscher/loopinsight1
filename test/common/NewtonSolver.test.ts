/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import NewtonSolver from '../../src/common/NewtonSolver.js'

describe("NewtonSolver", () => {

    const f = (x: number) => x * (x + 1) * (x - 1)
    const solver = new NewtonSolver(f)

    describe("#solve", () => {
        // test scalar function with known zeros
        const inputs = [-3, -0.8, 0, 0.2, 0.8, 3]
        const expected = [-1, -1, 0, 0, 1, 1]

        for (let k: number = 0; k < inputs.length; k++) {
            it("should return " + expected[k] + " for f=x*(x+1)*(x-1) and x0=" + inputs[k], () => {
                const result = solver.solve(inputs[k], 1e-10)
                expect(result - expected[k]).to.lessThan(1e-8)
            })
        }
    })

})