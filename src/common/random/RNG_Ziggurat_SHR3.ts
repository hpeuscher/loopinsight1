/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import RandomNumberGenerator from '../../types/RandomNumberGenerator.js'
import RNG_SHR3 from './RNG_SHR3.js'

// https://github.com/jamesbloomer/node-ziggurat

export default class RNG_Ziggurat_SHR3 extends RNG_SHR3 implements RandomNumberGenerator {

    private wn = Array(128)
    private fn = Array(128)
    private kn = Array(128)

    /**
     * constructor
     * 
     * @param {number} seed
     */
    constructor(public seed = 1) {
        super(seed)
        this.reset()
    }

    /**
     * reset / re-initialize random number generator
     */
    reset(): void {
        super.reset()
        this.zigset()
    }

    /**
     * get sample from standard normally distributed PRN
     *
     * @returns {number} sample
     */
    getNormal(): number {
        const r = 3.442619855899
        let x
        let y
        while (true) {
            let hz = (1 - this.getUniform() * 2) * Math.pow(2, 31)
            let iz = hz & 127

            if (Math.abs(hz) < this.kn[iz]) {
                return hz * this.wn[iz]
            }

            x = hz * this.wn[iz]
            if (iz == 0) {
                x = (-Math.log(this.getUniform()) / r)
                y = -Math.log(this.getUniform())
                while (y + y < x * x) {
                    x = (-Math.log(this.getUniform()) / r)
                    y = -Math.log(this.getUniform())
                }
                return (hz > 0) ? r + x : -r - x
            }

            if (this.fn[iz] + this.getUniform() * (this.fn[iz - 1] - this.fn[iz])
                < Math.exp(-0.5 * x * x)) {
                return x
            }
        }
    }

    /**
     * initialize ziggurat tables
     */
    zigset(): void {
        this.wn = Array(128)
        this.fn = Array(128)
        this.kn = Array(128)

        const m1 = 2147483648.0 // 2^32
        let dn = 3.442619855899
        let tn = dn
        const vn = 9.91256303526217e-3

        const q = vn / Math.exp(-0.5 * dn * dn)
        this.kn[0] = Math.floor((dn / q) * m1)
        this.kn[1] = 0

        this.wn[0] = q / m1
        this.wn[127] = dn / m1

        this.fn[0] = 1.0
        this.fn[127] = Math.exp(-0.5 * dn * dn)

        for (let i = 126; i >= 1; i--) {
            dn = Math.sqrt(-2.0 * Math.log(vn / dn + Math.exp(-0.5 * dn * dn)))
            this.kn[i + 1] = Math.floor((dn / tn) * m1)
            tn = dn
            this.fn[i] = Math.exp(-0.5 * dn * dn)
            this.wn[i] = dn / m1
        }
    }
}
