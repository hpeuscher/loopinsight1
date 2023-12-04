/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { NamedVector } from '../types/CommonTypes.js'

export default class NamedVectorUtil {

    /**
     * Computes the element-wise sum of named vectors
     * 
     * @param {NamedVector[]} X - Array of vectors
     * @returns {NamedVector} Vector carrying sum of entries.
    */
    static vectorSum(...X: NamedVector[]): NamedVector {
        return X.reduce((a, b) => {
            for (const k in b) {
                if (b.hasOwnProperty(k))
                    a[k] = (a[k] || 0) + b[k]
            }
            return a
        }, {})
    }

    /**
     * Multiplies each element of a named vector by a scalar.
     * 
     * @param {NamedVector} X - Original vector.
     * @param {number} a - Scalar gain.
     * @returns {NamedVector} Product a*X.
    */
    static timesScalar(X: NamedVector, a: number): NamedVector {
        return Object.keys(X).reduce(function (result: NamedVector, key: string): NamedVector {
            result[key] = X[key] * a
            return result
        }, {})
    }

    /**
     * Returns a shallow clone of a NamedVector.
     * 
     * @param nv the object to be cloned
     * @returns a shallow clone of the input array
     */
    static clone<T extends NamedVector>(nv: T): T {
        return { ...nv }
    }

}
