/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


// multiply state vector by scalar
function timesScalar(X, a) {
	return Object.keys(X).reduce(function(result, key) {
		result[key] = X[key] * a;
		return result;
	}, {});
};

// compute sum of n vectors
function vectorSum (...X) { 
	return X.reduce((a, b) => {
		for (let k in b) {
			if (b.hasOwnProperty(k))
				a[k] = (a[k] || 0) + b[k];
			}
			return a;
		}, {}
	);
};

// classical fixed-step Runge-Kutta solver
//   derivatives(t,x): function that returns dx/dt
//   t, x: time and state
//   dt: time step
function RK4(derivatives, t, x, dt) {
	var k1 = timesScalar(derivatives(t,x), dt);	
	var k2 = timesScalar(derivatives(t+dt/2,vectorSum(x, timesScalar(k1,1/2))), dt);
	var k3 = timesScalar(derivatives(t+dt/2,vectorSum(x, timesScalar(k2,1/2))), dt);
	var k4 = timesScalar(derivatives(t+dt, vectorSum(x,k3)), dt);
	
	return vectorSum(x, timesScalar(k1,1/6), timesScalar(k2,1/3), timesScalar(k3,1/3), timesScalar(k4,1/6));
}

export default RK4;