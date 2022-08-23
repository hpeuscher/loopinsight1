/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


class InvalidResultError extends Error {
    constructor(t,y,x) {
        const message = "Invalid simulation result" +
            " at time t="+ t.toString() + 
            ": " + 
            JSON.stringify({y,x}, function (key, value) {
                if (value !== value) {
                    return 'NaN'
                } 
                return value
            })
        super(message)
        this.name = this.constructor.name
    }
}

export default InvalidResultError;