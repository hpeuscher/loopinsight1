/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import Jacobian from '../../src/common/Jacobian.js'
import { Matrix, Vector } from '../../src/types/CommonTypes.js'
import { assertTolerantMatrixEquality } from '../helper/linalg_helper.js'

describe("Jacobian", () => {

    describe("example of function with N=3", () => {
        const fTest: ((x: Vector) => Vector) = (x) => {
            const eps: number = 1
            const [x1, x2, u1] = x
            const result: Vector = [x1, x1 - eps * Math.pow(1 - x1, 2) * x2 + u1, x1 - 5]
            return result
        }

        it("should produce correct derivatives at [1,1,1]", () => {
            const x0: Vector = [1, 1, 1]
            const jac: Matrix = new Jacobian(fTest, x0).getMatrix()
            assertTolerantMatrixEquality(jac, [[1, 0, 0], [1, 0, 1], [1, 0, 0]], 1e-6)
        })

        it("should produce correct derivatives at [-1,2,2]", () => {
            const x0: Vector = [-1, 2, 2]
            const jac: Matrix = new Jacobian(fTest, x0).getMatrix()
            assertTolerantMatrixEquality(jac, [[1, 0, 0], [9, -4, 1], [1, 0, 0]], 1e-6)
        })
    })

})