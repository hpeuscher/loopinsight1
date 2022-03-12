// variance
function variance(arr) {
  let sum = 0;
  let n = arr.length;
  let m = mean(arr);
  for (let i = 0; i < n; i++) {
    sum += arr[i] ** 2;
  }
  return sum / n - m * m;
}

function varianceHB(arr) {
  let sum = 0
  const mu = mean(arr)
  for (const elem of arr) {
    sum += Math.pow(elem - mu, 2)
  }
  return sum / arr.length
}

function mean(arr) {
  let sum = 0;
  for (const elem of arr) {
	  sum += elem
  }
  return sum / arr.length;
}

console.log(variance([1,20,50,2,1]))
console.log(varianceHB([1,20,50,2,1]))