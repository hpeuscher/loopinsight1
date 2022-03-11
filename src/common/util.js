/**
 * computes the coefficien of variation of an array of numbers
 * @param {Array} arr 
 * @returns {number} the coefficien of variation
 */
 function coefficientOfVariation(arr) {
    return std(arr) / mean(arr);
}

/**
 * computes the standard deviation of an array of numbers
 * @param {Array} arr 
 * @returns {number} the standard deviation
 */
 function std(arr) {
    return Math.sqrt(variance(arr));
}

/**
 * computes the variance of an array of numbers
 * @param {Array} arr 
 * @returns {number} the variance
 */
function variance(arr) {
    let sum = 0
    let n = arr.length
    let m = mean(arr)
    for (elem of arr) {
        sum += elem ** 2;
    }
    return sum / n - m * m
}

/**
 * computes the mean value of an array of numbers
 * @param {Array} arr 
 * @returns {number} the mean value
 */
 function mean(arr) {
    let sum = 0
    let n = arr.length
    for (elem of arr) {
        sum += elem
    }
    return sum / arr.length
}

export { mean, variance, std, coefficientOfVariation }