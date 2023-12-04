/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import JohnsonTransform from '../../src/common/JohnsonTransform.js'
import { Vector } from '../../src/types/CommonTypes.js'
import { vectorDifferenceNorm } from '../helper/linalg_helper.js'

describe("#JohnsonTransform", () => {

    let input: Vector = []
    let result: Vector = []
    for (let i = -1; i <= 1; i += 0.1) {
        input.push(i)
        result.push(JohnsonTransform(i, 15.9574, -5.47, 1.6898, -0.5444))
    }

    const expected: Vector = [
        -9.82471358140601,
        -8.85290098945275,
        -7.89293913606123,
        -6.94146515102352,
        -5.99514589822950,
        -5.05066629926102,
        -4.10471772024463,
        -3.15398638128024,
        -2.19514174784272,
        -1.22482486348977,
        -0.239636583004181,
        0.763874335250285,
        1.78922331947362,
        2.84000229942803,
        3.91989228943122,
        5.03267628342447,
        6.18225250728833,
        7.37264807483085,
        8.60803309528667,
        9.89273528174763,
        11.2312551117001
    ]

    expect(vectorDifferenceNorm(result, expected)).to.lessThan(1e-10)

})