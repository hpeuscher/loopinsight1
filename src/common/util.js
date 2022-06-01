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

/**
 * transforms Date to browser locale String
 * @param {Date} date 
 * @returns {String} formatted date
 */
function dateToBrowserLocale(date) {
	let t = new Date(date)
	t = t.valueOf() - t.getTimezoneOffset() * 60000
	return new Date(t).toISOString().substr(0,19)
}

export { mean, variance, std, coefficientOfVariation, dateToBrowserLocale }