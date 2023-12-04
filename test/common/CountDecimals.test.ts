/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import countDecimals from '../../src/frontend/util/CountDecimals.js'

describe("#countDecimals", () => {
    expect(countDecimals(1)).to.equal(0)
    expect(countDecimals(2001)).to.equal(0)
    expect(countDecimals(2000)).to.equal(3)
    expect(countDecimals(2000.005)).to.equal(-3)
    expect(countDecimals(0.005)).to.equal(-3)
})