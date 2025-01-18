/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { Matrix, Vector } from '../types/CommonTypes.js'
import Jacobian from './Jacobian.js'
import {
    matrixMultiplication,
    transpose,
    vectorTimesScalar,
    matrixAddition,
    vectorAddition,
    scalarMultiplyMatrix,
    eye,
    matrixSubtraction,
    matrixTimesVector,
} from './LinearAlgebra.js'
import LSESolver from './LSESolver.js'
import { PatientInput } from '../types/Patient.js'
import { PatientInputOverTime } from '../types/Signals.js'

const MS_PER_MINUTE = 60e3

/**
 * Class implementin a Continuous-Discrete Extended Kalman Filter (CDEKF) 
 * for state estimation in nonlinear systems.
 */
export default class EKF {
    /** Time step for prediction */
    protected dt: number = 1;
    /** State vector */
    private x: Vector
    /** Covariance matrix */
    private P: Matrix
    /** Continuous process model */
    private f: (t: Date, x: Vector, u: PatientInput) => Vector
    /** Measurement model */
    private g: (t: Date, x: Vector) => number[]

    /**
     * Creates and initializes new instance of CDEKF.
     * 
     * @param {function} f Process model for state evolution
     * @param {function} g Measurement model
     * @param {Vector} x Initial state vector
     * @param {Matrix} P Initial covariance matrix
     */
    constructor(f: typeof this.f, g: typeof this.g, x: Vector, P: Matrix) {
        this.f = f
        this.g = g
        this.x = x
        this.P = P
    }

    /**
     * Prediction step
     * 
     * @param {number} samplingTime The sampling time for the prediction
     * @param {Matrix} Q Covariance of process noise
     */
    public prediction(samplingTime: number, t: Date, u: PatientInputOverTime, Q: Matrix) {
        const tFinal = new Date(t.valueOf() + samplingTime * MS_PER_MINUTE)
        while (t < tFinal) {
            t = new Date(t.valueOf() + this.dt * MS_PER_MINUTE)
            // Compute Jacobian of system function
            const F = new Jacobian((x) => this.f(t, x, u(t)), this.x).getMatrix()

            // State prediction (by Explicit Euler)
            const dx = this.f(t, this.x, u(t))
            this.x = vectorAddition(this.x, vectorTimesScalar(dx, this.dt))

            // Covariance prediction
            const FP = matrixMultiplication(F, this.P)
            const PFT = matrixMultiplication(this.P, transpose(F))
            const dP = matrixAddition(matrixAddition(FP, PFT), Q)
            this.P = matrixAddition(this.P, scalarMultiplyMatrix(this.dt, dP))
        }

        return this.x
    }

    /**
     * Innovation step
     * 
     * @param {Date} t Current time
     * @param {Vector} y Observations
     * @param {Matrix} R Covariance of Measurement noise
     * @returns {Vector} State estimate
     */
    public innovation(t: Date, y: number[], R: Matrix) {
        // Measurement prediction
        const y_pred = this.g(t, this.x)
        const H = new Jacobian((x) => this.g(t, x), this.x).getMatrix()
        /** Innovation */
        const ek = y.map((_yi, i) => y[i] - y_pred[i])

        // Gain calculation
        const HT = transpose(H)
        const HP = matrixMultiplication(H, this.P)
        const HPHT = matrixMultiplication(HP, HT)
        const S = matrixAddition(HPHT, R)
        const solver = new LSESolver(S)
        /** Kalman gain */
        const K = transpose(solver.solveMatrix(HP))

        // Update state
        const Kek = matrixTimesVector(K, ek)
        this.x = vectorAddition(this.x, Kek)

        // Update covariance
        const I = eye(K.length)
        const KH = matrixMultiplication(K, H)
        const KP = matrixSubtraction(I, KH)
        const KPT = transpose(KP)
        const KPPKP = matrixMultiplication(matrixMultiplication(KP, this.P), KPT)
        const KT = transpose(K)
        const KRK = matrixMultiplication(matrixMultiplication(K, R), KT)
        this.P = matrixAddition(KPPKP, KRK)

        // Return estimate
        return this.x
    }
}