/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

   
// utility function to find significant digit 
// (used for comfortable choice of step size in numeric inputs)
// cf. https://stackoverflow.com/a/27082406

var countDecimals = function(value) {
	let text = Number(value).toExponential();
	let [head, trail] = text.split('e');
	let deg = parseInt(trail, 10);
	if (head.indexOf('.') > -1) {
		let [, trail2] = head.split('.');
		deg = deg - trail2.length;
	}
	return deg;
}

export default countDecimals;