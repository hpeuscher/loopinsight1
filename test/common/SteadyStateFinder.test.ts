/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import SteadyStateHelper from '../../src/common/SteadyStateFinder.js'
import { NamedVector } from '../../src/types/CommonTypes.js'

describe("SteadyStateHelper", () => {

    const testee = new SteadyStateHelper()

    describe("anonymize(NamedVector)", () => {
        it("should reduce a NamedVector to an array of values", () => {
            const input = { a: 1, b: 2, c: 3 }
            const output = testee.anonymize(input)
            const expected = [1, 2, 3]
            expect(output).to.deep.equal(expected)
        })
    })

    describe("anonymize(NamedVector[])", () => {
        it("should reduce an array of NamedVectors to a flat array of values", () => {
            const output = testee.anonymize({ a: 1 }, { b: 2, c: 3 })
            const expected = [1, 2, 3]
            expect(output).to.deep.equal(expected)
        })
    })

    describe("assign", () => {
        it("should assign values from a flat array to an array of NamedVectors", () => {
            const x = { a: 0 }
            const u = { b: 0, c: 0 }
            const values = [1, 2, 3]
            testee.assign(values, x, u)
            expect(x).to.deep.equal({ a: 1 })
            expect(u).to.deep.equal({ b: 2, c: 3 })
        })
    })

    // describe("wrapStructuredFunction", () => {
    //     it("should change a function on NamedVectors to map from flat anonymous vectors to flat anonymous vectors", () => {
    //         const add2d = function (v: NamedVector[]) {
    //             return { x: v[0].x + v[1].x, y: v[0].y + v[1].y }
    //         }
    //         const fWrapped = testee.wrapStructuredFunction(add2d, [{ x: 0, y: 0 }, { x: 0, y: 0 }])
    //         expect(fWrapped([0, 0, 1, 2])).to.deep.equal([1, 2])
    //         expect(fWrapped([0, -1, 0, 1])).to.deep.equal([0, 0])
    //     })
    // })

    // TODO: Add test for findSteadyState

    /**
     * Unit test for findSteadyStateAndInput which should find the equilibrium of a model.
     * 
     * The example describes a Van-der-Pol oscillator with an additional input 
     * which can shift the equilibrium away from the origin. We can therefore 
     * introduce an additional condition which demands that the x1 coordinate 
     * of the equilibrium be 5 (instead of 0 as in standard Van-der-Pol).
     */
    describe("findSteadyStateAndInput", () => {
        describe("try to find equilibrium of simple N=2 dynamic system", () => {
            // define conditions for steady state. 
            const fCond: (([x, u]: NamedVector[]) => NamedVector) = ([x, u]: NamedVector[]) => {
                // x is the starting point for the state.
                // u is the starting point for the medication.
                // The function f returns an object.
                // The goal of findSteadyStateAndInput is to vary the values of x and u until all elements of f(x,u) are zero.
                const eps: number = 1
                return {
                    condition1: x.x2,
                    condition2: x.x1 - eps * Math.pow(1 - x.x1, 2) * x.x2 + u.u1,
                    condition3: x.x1 - 5
                }
            }
            const x0: NamedVector = { x1: 1, x2: 1 }
            const u0: NamedVector = { u1: 1 }
            const [xeq, ueq] = testee.findSteadyStateAndInput(
                fCond, x0, u0
            )

            it("should return steady state xeq={x1:5, x2:0}", () => {
                expect(xeq).to.haveOwnProperty("x1")
                expect(Math.pow(xeq.x1 - 5, 2)).to.lessThan(1e-10)
                expect(xeq).to.haveOwnProperty("x2")
                expect(Math.pow(xeq.x2, 2)).to.lessThan(1e-10)
            })
            it("should return steady state input ueq={u1:-5}", () => {
                expect(ueq).to.haveOwnProperty("u1")
                expect(Math.pow(ueq.u1 + 5, 2)).to.lessThan(1e-10)
            })
        })
        describe("check behavior for problem w/o solution", () => {
            // define conditions for steady state. 
            const fCond: (([x, u]: NamedVector[]) => NamedVector) = ([x, u]: NamedVector[]) => {
                // x is the starting point for the state.
                // u is the starting point for the medication.
                // The function f returns an object.
                // The goal of findSteadyStateAndInput is to vary the values of x and u until all elements of f(x,u) are zero.
                const eps: number = 1
                return {
                    condition1: x.x2,
                    condition2: Math.pow(1 - x.x1, 2) + 1,
                    condition3: x.x1 - 5
                }
            }
            const x0: NamedVector = { x1: 1, x2: 1 }
            const u0: NamedVector = { u1: 1 }
            it("should return error", () => {
                expect(() => testee.findSteadyStateAndInput(fCond, x0, u0)).to.throw()
            })
        })
    })
})

