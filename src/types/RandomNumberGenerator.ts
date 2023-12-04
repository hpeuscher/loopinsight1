/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

export interface UniformRandomNumberGenerator {

    /**
     * set seed for random number generator
     * @param {number} seed
     */
    setSeed(seed: number): void

    /**
     * reset / re-initialize random number generator
     */
    reset(): void

    /**
     * get sample from uniformly distributed PRN
     */
    getUniform(): number

}


export interface NormalRandomNumberGenerator {
    /**
     * set seed for random number generator
     * @param {number} seed
     */
    setSeed(seed: number): void

    /**
     * reset / re-initialize random number generator
     */
    reset(): void

    /**
     * get sample from standard normally distributed PRN
     */
    getNormal(): number
}

/** 
 * common type for patient parameters
 */
export default interface RandomNumberGenerator
    extends UniformRandomNumberGenerator, NormalRandomNumberGenerator {
}
