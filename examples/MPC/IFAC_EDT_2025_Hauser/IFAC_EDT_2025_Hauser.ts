/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * This file calls all the examples included in the submission by Hauser et al.
 * to the 1st IFAC Conference on Engineering Diabetes Technology and creates
 * the data of the figures.
 * 
 * Usage:   cd ./examples/MPC/IFAC_EDT_2025_Hauser
 *          node --loader ts-node/esm ./IFAC_EDT_2025_Hauser.ts
 */

import fs from 'fs'
import path from 'path'

const scriptsDir = "./scripts"
const filenames = fs.readdirSync(scriptsDir)

// prepare folder for results
if (!fs.existsSync('./results')) {
    fs.mkdirSync('./results')
}

// run all files
for (let filename of filenames) {
    if (!filename.endsWith("ts")) continue
    console.log(filename)
    const modulePath = `file://${path.resolve(scriptsDir, filename)}`
    await import(modulePath)
}
