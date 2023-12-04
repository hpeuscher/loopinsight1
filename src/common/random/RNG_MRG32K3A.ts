/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/*
Parts of this file have been taken from:
    http://simul.iro.umontreal.ca/rng/MRG32k3a.c

    32-bits Random number generator U(0,1): MRG32k3a
    Author: Pierre L'Ecuyer,
    Source: Good Parameter Sets for Combined Multiple Recursive Random
    Number Generators,
    Shorter version in Operations Research,
    47, 1 (1999), 159--164.
*/

import {UniformRandomNumberGenerator} from '../../types/RandomNumberGenerator.js'

export default class MRG32K3A implements UniformRandomNumberGenerator {
    s10!: number
    s11!: number
    s12!: number
    s20!: number
    s21!: number
    s22!: number

    /**
	 * constructor
	 */
	constructor(){ 
        this.reset()
    }

    /**
     * Sets the seed for the random number generator.
     * @param {number} seed
     */
    setSeed(seed: number) {
        // TODO
    }


    /**
     * Resets / re-initializes the random number generator.
     */
    reset() {
        this.s10 = 3003044714
        this.s11 = 1009181222
        this.s12 = 2909558614
        this.s20 = 3416929855
        this.s21 = 1367079581
        this.s22 = 3126726621
    }
    
    /**
     * Returns next sample from uniformly distributed PRN.
     *
	 * @returns {number} Sample.
	 */    
    getUniform(): number {
        
        const norm = Math.pow(2,32) - 208
        const m1 = 4294967087.0
        const m2 = 4294944443.0
        const a12 =  1403580.0
        const a13n = 810728.0
        const a21 = 527612.0
        const a23n = 1370589.0
        
        /* Component 1 */
        const p1 = (a12 * this.s11 - a13n * this.s10 + m1) % m1
        this.s10 = this.s11
        this.s11 = this.s12
        this.s12 = p1
        
        /* Component 2 */
        const p2 = (a21 * this.s22 - a23n * this.s20 + m2) % m2
        this.s20 = this.s21
        this.s21 = this.s22
        this.s22 = p2
        
        /* Combination */
        let  u = ((p1 - p2) % norm) / norm
        while (u < 0)
            u = u + 1
        return u

    }
    
}

