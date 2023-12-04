/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import InvalidResultError from '../../src/common/errors/InvalidResultError.js'

describe('InvalidResultError', () => {
    describe('#fromTimeAndResult', () => {
        it("should instantiate an InvalidResultError", () => {
            const t = new Date()
            const error = new InvalidResultError(t, { y: {Gp: 100} })
            expect(error.name).to.equal('Error')
            console.log(error.message)
            expect(error.message).to.contain.oneOf(['{"Gp":100}', "{'Gp':100}"])
            expect(error.message).to.contain("at time")
        })
    })
})
