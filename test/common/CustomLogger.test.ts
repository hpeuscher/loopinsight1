/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import Oref0ConsoleLogger from '../../src/common/Oref0ConsoleLogger.js'

describe('CustomLogger', () => {
    describe('#logObject', () => {
        it("should log an object's values", () => {
            const objectLogger = new Oref0ConsoleLogger()
            const myObj = { a: 1, b: 2 }
            objectLogger.logObject(myObj)
            const messages = objectLogger.messages
            expect(messages).to.deep.equal(['1', '2'])
            //console.log(objectLogger.messages)
        })

        it("should log an array's elements", () => {
            const objectLogger = new Oref0ConsoleLogger()
            const myObj = [3, 4]
            objectLogger.logObject(myObj)
            const messages = objectLogger.messages
            expect(messages).to.deep.equal(['3', '4'])
        })

        it("should log a string", () => {
            const objectLogger = new Oref0ConsoleLogger()
            objectLogger.logObject("42")
            const messages = objectLogger.messages
            expect(messages).to.deep.equal(["42"])
        })

        it("should ignore other data types", () => {
            const objectLogger = new Oref0ConsoleLogger()
            objectLogger.logObject(undefined)
            const messages = objectLogger.messages
            expect(messages).to.be.empty
        })
    })
    describe('#write', () => {
        it("should accept multiple arguments", () => {
            const objectLogger = new Oref0ConsoleLogger()
            objectLogger.write('hello', [3, '4'], "hello", { a: 1, b: { x: 5, y: 6 } })
            expect(objectLogger.messages).to.deep.equal(['hello', '3', '4', 'hello', "{\"a\":1,\"b\":{\"x\":5,\"y\":6}}"])
        })
        it("should join list of strings", () => {
            const objectLogger = new Oref0ConsoleLogger()
            objectLogger.write("A", "B", 42)
            expect(objectLogger.messages).to.deep.equal(["A B 42"])
        })
        it("should accept Uint8Array", () => {
            const objectLogger = new Oref0ConsoleLogger()
            objectLogger.write(new Uint8Array([65, 66, 67]))
            expect(objectLogger.messages).to.deep.equal(['ABC'])
        })
    })

    describe('#clear', () => {
        it("should empty message list", () => {
            const objectLogger = new Oref0ConsoleLogger()
            objectLogger.write('hello', ['3', '4'], "hello", { a: 1, b: { x: 5, y: 6 } })
            objectLogger.clear()
            expect(objectLogger.messages).to.empty
        })

    })


    // describe('#fromResult', () => {
    //     it("should instantiate an InvalidResultError", () => {
    //         const error = InvalidResultError.fromResult({test: 1})
    //         console.log(error.message)
    //         expect(error.name).to.equal('InvalidResultError')
    //         expect(error.message).to.contain.oneOf(['{"test":1}', "{'test':1}"])
    //     })
    // })
    // describe('#fromResult', () => {
    //     it("should work with NaN values", () => {
    //         const error = InvalidResultError.fromResult({test: NaN})
    //         console.log(error.message)
    //     })
    // })
})
