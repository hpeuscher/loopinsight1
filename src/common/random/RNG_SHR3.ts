/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { UniformRandomNumberGenerator } from '../../types/RandomNumberGenerator.js'

export default class RNG_SHR3 implements UniformRandomNumberGenerator {
    private jsr!: number

    /**
     * create new RNG_SHR3 instance
     * 
     * @param {number} seed
     */
    constructor(public seed: number = 1) {
        this.setSeed(seed)
        this.reset()
    }

    setSeed(seed: number) {
        this.seed = Math.max(Math.floor(seed), 1)
    }

    reset(): void {
        // seed generator
        this.jsr = 123456789 ^ this.seed
    }

    getUniform(): number {
        return 0.5 * (1 - this.SHR3() / Math.pow(2, 31))
    }

    /**
     * 3-shift-register generator with period 2^32-1
     *
     * @returns {number} uniformly distributed integer
     */
    private SHR3(): number {
        const jz = this.jsr
        let jzr = this.jsr
        jzr ^= (jzr << 13)
        jzr ^= (jzr >>> 17)
        jzr ^= (jzr << 5)
        this.jsr = jzr
        return (jz + jzr) | 0
    }

}
