/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import NewtonSolver from '../common/NewtonSolver.js'
import { NamedVector } from '../types/CommonTypes.js'
import { ModuleProfile } from '../types/ModuleProfile.js'
import ODEPatientModel from '../types/ODEPatientModel.js'
import { ParameterDescriptions, TypedParameterValues } from '../types/ParametricModule.js'
import Patient, {
    PatientInput, PatientOutput,
    PatientProfile, PatientState, StateDescription, TypedPatientState
} from '../types/Patient.js'
import { PatientInputOverTime } from '../types/Signals.js'
import Solver, { Derivatives } from '../types/Solver.js'
import AbstractParametricModule from './AbstractParametricModule.js'

/** 
 * Utility abstract class to ease implementation of ODE-based patient model.
 */
export default abstract class AbstractODEPatient
    <S extends StateDescription, P extends ParameterDescriptions>
    extends AbstractParametricModule
    <P, typeof CommonPatientParametersDescription>
    implements ODEPatientModel<TypedPatientState<S>>
{

    abstract getParameterDescription(): P

    override getCommonParameterDescription() {
        return CommonPatientParametersDescription
    }
    
    abstract getModelInfo(): ModuleProfile

    abstract getInputList(): Array<keyof PatientInput>

    abstract getOutputList(): Array<keyof PatientOutput>

    abstract getStateDescription(): S

    abstract computeSteadyState(u: PatientInput, t: Date): TypedPatientState<S>

    abstract computeDerivatives(t: Date, x: TypedPatientState<S>, u: PatientInput)
        : TypedPatientState<S>

    abstract computeOutput(t: Date, x: TypedPatientState<S>): PatientOutput

}

/** Type of class that implements interface ODEPatient. */
type ODEPatientClass<State extends PatientState, P extends ParameterDescriptions> = {
    new(parameters?: Partial<TypedParameterValues<P, typeof CommonPatientParametersDescription>>,
        ...args: any[]): ODEPatientModel<State>
}

/**
 * Uses ODEPatientMixin to create Patient class from ODEPatientModel class.
 * @param {ODEPatientClass} odeModel - 
 *      A class that implements interface ODEPatientModel.
 * @returns A class that implements interface Patient.
 */
export function createPatientFromODE
    <S extends StateDescription,
        P extends ParameterDescriptions>
    (odeModel: ODEPatientClass<TypedPatientState<S>, P>) {

    return class extends odeModel implements Patient {

        /** Mixin which provides additional functionality for simulation */
        private _patient: ODEPatientMixin<TypedPatientState<S>, P> =
            new ODEPatientMixin(this)

        getPatientProfile(): PatientProfile {
            return this._patient.getPatientProfile()
        }

        reset(t: Date, seed: number, solver: Solver) {
            return this._patient.reset(t, seed, solver)
        }

        getInitialState(){
            return this._patient.getInitialState()
        }

        setInitialState(x0: TypedPatientState<S>) {
            return this._patient.setInitialState(x0)
        }

        update(t: Date, input: PatientInputOverTime) {
            return this._patient.update(t, input)
        }

        getOutput(): PatientOutput {
            return this._patient.getOutput()
        }

        getState(): TypedPatientState<S> {
            return this._patient.getState()
        }

        getNextUpdateTime() {
            // no intrinsic stops required
            return undefined
        }
    }
}


/** 
 * Mixin class to add Patient functionality to ODEPatientModel.
 * 
 * @mixin
 */
export class ODEPatientMixin
    <State extends PatientState, Parameters extends ParameterDescriptions> {

    /** current state */
    private x = {} as  State
    /** equilibrium state (state in homeostasis) */
    private xeq = {} as State
    /** initial state at beginning of simulation */
    private x0 = {} as State
    /** information about patient */
    private profile = {} as PatientProfile
    /** time of last update */
    private _tLastUpdate = {} as Date
    /** numerical ode solver */
    private solver = {} as Solver
    /** instance of ODEPatientModel to create a Patient from */
    private _odeModel: ODEPatientModel<State>

    /**
     * Creates a new virtual patient.
     * @param {ODEPatientModel} odeModel - Instance of ODEPatientModel 
     *      to create a Patient from.
     */
    constructor(odeModel: ODEPatientModel<State>) {
        this._odeModel = odeModel
    }

    getParameterDescription() {
        return <Parameters & typeof CommonPatientParametersDescription>{
            ...this._odeModel.getParameterDescription(),
            ...CommonPatientParametersDescription
        }
    }

    /**
     * Computes insulin infusion rate that stabilizes blood glucose at given
     * level. Only used if _odeModel does not provide this function by itself.
     * @param {number} targetBG - Desired blood glucose concentration in mg/dl
     * @param {Date} t - Time
     * @returns {number} Insulin infusion rate
     */
    computeIIR(targetBG: number, t: Date): number {
        if (typeof this._odeModel.computeIIR === "function") {
            return this._odeModel.computeIIR(targetBG, t)
        }
        // if no implementation exists, find iir here using a root-search algo
        const rootFinder = new NewtonSolver((iir: number) => {
            const xeq = this._odeModel.computeSteadyState({ iir }, t)
            return this._odeModel.computeOutput(t, xeq).Gp - targetBG
        })
        return rootFinder.solve(1)
    }

    /**
     * Returns information about the patient to be passed on to the controller.
     * @returns {PatientProfile}
     */
    getPatientProfile(): PatientProfile {
        /** choose midnight as date of interest for time-varying parameters */
        // TODO: compute an average insulin consumption instead??
        const t = new Date(new Date().setHours(0,0,0,0))
        const params = <any>this._odeModel.evaluateParameterValuesAt(t)

        let IIReq: number = NaN

        // determine equilibrium basal rate IIReq
        if (typeof params.IIReq !== "undefined") {
            // it is given as a parameter
            IIReq = params.IIReq
        }
        else if (typeof params?.Gpeq !== "undefined") {
            // try to compute it from given equilibrium glucose level
            try {
                IIReq = this.computeIIR(params.Gpeq, t)
            }
            catch (e) {
                console.warn("computation of equilibrium basal rate failed: " + e)
                IIReq = NaN
            }
        }

        // compute steady state for equilibrium basal rate
        this.xeq = this._odeModel.computeSteadyState({ iir: IIReq }, t)

        this.profile = {
            name: params.name,
            IIReq,
            totalDailyDose: IIReq * 24,
        }
        return this.profile
    }

    /**
     * Resets / re-initializes module to default.
     * @param {Date} t - Current time.
     * @param {number} seed - Random seed
     * @param {Solver} solver - Numerical ODE solver.
     */
    reset(t: Date, _seed: number, solver: Solver) {
        this.solver = solver
        this._tLastUpdate = t
        const profile = this.getPatientProfile()
        this.x = this.getInitialState()
    }

    /**
     * Simulate ahead until given timestamp.
     * @param {Date} t - Current time, i.e. final time for this simulation step
     * @param {PatientInputOverTime} u - 
     *      Treatments and disturbances as a time-dependent function
     */
    update(t: Date, u: PatientInputOverTime) {
        const derivatives: Derivatives = (t_: Date, x_: NamedVector) => {
            return this._odeModel.computeDerivatives(t_, <State>{ ...x_ }, u(t_))
        }
        this.x = <State>this.solver.solve(derivatives, this._tLastUpdate, { ... this.x }, t)

        this._tLastUpdate = t
        if (typeof this._odeModel.updateDiscontinuousStates !== "undefined") {
            this.x = <State>this._odeModel.updateDiscontinuousStates(
                t, { ...this.x }, u(t))
        }
    }

    /**
     * Returns initial state for simulation (typically equilibrium state).
     * @returns {State} Initial - patient state.
     */
    getInitialState(): State {
        return (Object.keys(this.x0 || {}).length > 0)
            ? { ...this.x0 }
            : { ...this.xeq }
    }

    /**
     * Sets initial state for simulation.
     * @param {State} x0 - New initial state.
     */
    setInitialState(x0: State) {
        this.x0 = x0
    }
    
    /**
     * Returns current physiological outputs of virtual patient.
     * @returns {PatientOutput} Patient outputs.
     */
    getOutput(): PatientOutput {
        return this._odeModel.computeOutput(this._tLastUpdate, this.x)
    }

    /**
     * Returns current physiological state of virtual patient.
     * @returns {PatientState} Patient state.
     */
    getState(): State {
        return this.x
    }

}


/** 
 * Description of parameters which are commonly used by patient models.
 * These values are available implicitly in each child of the abstract class,
 * but they are not listed in getParameterList except if you explicitly include
 * them into the parameterDescription. If you do that, you can overwrite the
 * default value, but please note that you may not change the unit. 
 */
export const CommonPatientParametersDescription = {
    name: { unit: "", default: "Jane Doe" },
    /** blood glucose in homeostasis in mg/dl */
    Gpeq: { unit: "mg/dl", default: 100 },
    /** body weight in kg */
    BW: { unit: "kg", default: 75 },
}

