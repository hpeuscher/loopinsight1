/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'

import NewtonRaphsonSolver from '../../src/common/NewtonRaphsonSolver.js'
import { Vector } from '../../src/types/CommonTypes.js'
import { vectorDifferenceNorm } from '../helper/linalg_helper.js'

describe("NewtonRaphtonSolver", () => {

    const f = (x: Vector) => [x[0] * (x[0] + 1) * (x[0] - 1)]
    const solver = new NewtonRaphsonSolver(f)

    /**
     * Unit test for NewtonRaphsonSolver which should find a root of a vector-valued 
     * function.
     * 
     * The example describes a Van-der-Pol oscillator with an additional input 
     * which can shift the equilibrium away from the origin. We can therefore 
     * introduce an additional condition which demands that the x1 coordinate 
     * of the equilibrium be 5 (instead of 0 as in standard Van-der-Pol).
     */
    describe("#solve", () => {
        // test scalar function with known zeros
        const inputs = [[-3], [-0.8], [0], [0.2], [0.8], [3]]
        const expected = [[-1], [-1], [0], [0], [1], [1]]

        for (let k: number = 0; k < inputs.length; k++) {
            it("should return " + expected[k] + " for f=x*(x+1)*(x-1) and x0=" + inputs[k], () => {
                const result = solver.solve(inputs[k], 1e-10)
                expect(result).to.be.an("array")
                expect(vectorDifferenceNorm(result || [], expected[k])).to.lessThan(1e-8)
            })
        }
    })

    // TODO add test with dimension N>1

    describe("#calcSquaredNorm", () => {
        expect(solver.sumOfSquares([-1, 2])).to.equal(5)
        expect(solver.sumOfSquares([0, 3, 4])).to.equal(25)
    })
})