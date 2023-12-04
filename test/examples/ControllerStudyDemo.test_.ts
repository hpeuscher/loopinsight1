/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import * as childProcess from 'child_process'
import * as path from 'path'

describe('ControllerStudyDemo', () => {
    it("should run without error", () => {
        //        const filename = "./examples/ControllerStudyDemo/ControllerStudyDemo.ts"
        const filename = "./examples/MinimalDemo/MinimalDemoJS.js"
        const scriptPath = path.resolve(filename)

        // run the script using child_process
        //        const process = childProcess.spawn('npx', ["ts-node", scriptPath])
        const process = childProcess.exec("node " + filename)

        process.on('close', (code) => {
            // script should exit with code 0 for success
            expect(code).to.equal(0)
        })
    })
})
