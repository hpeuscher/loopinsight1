/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai';

export let debugLog = "";
export const log_fun = function () {
    let args = [];
    if (typeof arguments === "object") {
        args = Object.values(arguments);
    } else if (typeof arguments === "string") {
        args = [arguments];
    } else if (typeof arguments === "array") {
        args = arguments;
    } else {
        return;
    }

    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] === "string") {
            debugLog = debugLog + args[i].trim() + " "
        }
        else if (typeof args[i] === "object") {
            debugLog = debugLog + JSON.stringify(args[i]) + ";"
        }
        else {
            debugLog = debugLog + JSON.stringify(args[i])
        }
    }
    debugLog = debugLog + ";"
}

function resetDebugLog() {
    debugLog = ""
}

function messages() {
    return debugLog.split(";").map(s => s.trim()).filter(s => s.length != 0)
}



describe('#CustomLogger', () => {
    describe('#logObject', () => {
        it("should concatenate two numbers (?)", () => {
            resetDebugLog()
            log_fun(1, 2)
            const expected = ['12']
            expect(messages()).to.deep.equal(expected)
        })

        it("should correctly log an array", () => {
            resetDebugLog()
            log_fun([1, 2])
            const expected = ['[1,2]']
            expect(messages()).to.deep.equal(expected)
        })

        it("should correctly log a simple string", () => {
            resetDebugLog()
            log_fun("foo")
            const expected = ['foo']
            expect(messages()).to.deep.equal(expected)
        })

        it("should correctly log a simple string with whitespace", () => {
            resetDebugLog()
            log_fun("   foo   ")
            const expected = ['foo']
            expect(messages()).to.deep.equal(expected)
        })

        it("should correctly log a string with a semicolon", () => {
            resetDebugLog()
            log_fun("foo; bar")
            const expected = ['foo', 'bar']
            expect(messages()).to.deep.equal(expected)
        })

        it("should correctly log an object", () => {
            resetDebugLog()
            log_fun({ a: 1 })
            const expected = ['{"a":1}']
            expect(messages()).to.deep.equal(expected)
        })

        it("should correctly log two objects", () => {
            resetDebugLog()
            log_fun({ a: 1 }, { b: 2 })
            const expected = ['{"a":1}', '{"b":2}']
            expect(messages()).to.deep.equal(expected)
        })

        it("should correctly log an object and a simple string", () => {
            resetDebugLog()
            log_fun({ a: 1 }, "foo")
            const expected = ['{"a":1}', 'foo']
            expect(messages()).to.deep.equal(expected)
        })

        it("should correctly log an object and a complex string", () => {
            resetDebugLog()
            log_fun({ a: 1 }, "foo; bar")
            const expected = ['{"a":1}', 'foo', 'bar']
            expect(messages()).to.deep.equal(expected)
        })

        it("should concatenate a simple string and an object (?)", () => {
            resetDebugLog()
            log_fun("foo", { b: 2 })
            const expected = ['foo {"b":2}']
            expect(messages()).to.deep.equal(expected)
        })

        it("should concatenate the last part of complex string with an object (???)", () => {
            resetDebugLog()
            log_fun("foo; bar", { b: 2 })
            const expected = ['foo', 'bar {"b":2}']
            expect(messages()).to.deep.equal(expected)
        })
    })
})
