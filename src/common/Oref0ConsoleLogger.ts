/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Helper class to redirect and log the console output from oref0 controller.
 */
export default class Oref0ConsoleLogger {

    readonly messages: string[] = []

    /**
     * Reset / clear log
     */
    clear() {
        this.messages.length = 0
    }

    /**
     * Function to replace process.stderr.write and console.error
     * @param buffer - Input string or char array
     * @param optionalParams - Optional additional strings and values
     */
    write = (buffer: string | Uint8Array, ...optionalParams: any[]): void => {
        if (typeof buffer !== "string") {
            buffer = new TextDecoder().decode(buffer)
        }
        const first = buffer.split(";")
            .map(s => s.trim())
            .filter(s => s.length != 0)

        if (typeof optionalParams === "object") {
            if (optionalParams.length !== 0) {

                optionalParams = optionalParams.filter((el) => JSON.stringify(el) !== "{}")

                // convert numbers to strings
                optionalParams = optionalParams.map(
                    (el) => (typeof el === "number") ? "" + el : el)

                // stringify objects
                optionalParams = optionalParams.map(
                    (el) => (typeof el === "object" && !(el instanceof Array)) ? JSON.stringify(el) : el)

                // if all are strings, concatenate
                const allTextual = optionalParams.reduce(
                    (acc, curr) => acc && (typeof curr === "string"), true)

                if (allTextual) {
                    optionalParams.map((el) => first.push(el))
                    this.logObject(first.join(" "))
                    return
                }
                else {
                    optionalParams = optionalParams.map((el) => first.push(el))
                }
            }
        }

        first.map(s => this.logObject(s))

    }

    /**
     * Adds new message to buffer.
     * @param rawArgs
     */
    logObject(rawArgs: object | string | any): void {
        let args: any[]
        if (typeof rawArgs === "object") {
            args = Object.values(rawArgs)
        } else if (typeof rawArgs === "string") {
            args = [rawArgs]
        } else {
            return
        }

        let newMessage: string
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === "string") {
                newMessage = args[i].trim()
            }
            else {
                newMessage = JSON.stringify(args[i])
            }
            this.messages.push(newMessage)
        }
    }
}