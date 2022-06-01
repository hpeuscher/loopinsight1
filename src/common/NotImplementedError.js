/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


class NotImplementedError extends Error {
    constructor(className, methodName) {
        super("Method '"+methodName+"' not implemented in class '"+className+"'.")
        this.name = this.constructor.name
    }
}

export default NotImplementedError;