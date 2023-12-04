/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


/** 
Johnson transformation system according to:

[Breton, JDST, 2008]
    Breton, M.; Kovatchev, B.:
    "Analysis, Modeling, and Simulation of the Accuracy of Continuous Glucose Sensors"
    Journal of Diabetes Science and Technology, Volume 2, Issue 5, 2008

*/

export default function JohnsonTransform(e: number,
    lambda = 15.96, xi = -5.471, delta = 1.6898, gamma = -0.5444): number {

    return xi + lambda * Math.sinh((e - gamma) / delta)
}
