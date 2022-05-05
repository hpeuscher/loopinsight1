/**
 * computes the coefficient of variation of an array of numbers
 * @param {Array} arr 
 * @returns {number} the coefficient of variation
 */
function coefficientOfVariation(arr) {
    return std(arr) / mean(arr)
}

/**
 * computes the standard deviation of an array of numbers
 * @param {Array} arr 
 * @returns {number} the standard deviation
 */
 function std(arr) {
    return Math.sqrt(variance(arr))
}

/**
 * computes the variance of an array of numbers
 * @param {Array} arr 
 * @returns {number} the variance
 */
function variance(arr) {
    const m = mean(arr)  
    return mean(arr.map(el => (el - m) ** 2))
}

/**
 * computes the mean value of an array of numbers
 * @param {Array} arr 
 * @returns {number} the mean value
 */
 function mean(arr) {
    let sum = 0
    for (const elem of arr) {
        sum += elem
    }
    return sum / arr.length
}

export { mean, variance, std, coefficientOfVariation }