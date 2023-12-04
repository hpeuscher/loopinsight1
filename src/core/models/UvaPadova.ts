/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import SteadyStateFinder from '../../common/SteadyStateFinder.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import ODEPatientModel from '../../types/ODEPatientModel.js'
import {
    TypedPatientState, PatientInput, PatientOutput
} from '../../types/Patient.js'
import AbstractODEPatient, { createPatientFromODE } from '../AbstractODEPatient.js'

export const profile: ModuleProfile = {
    type: "patient",
    id: "UvaPadova_mockup",
    version: "2.0.0",
    name: "UVA/Padova mockup",
    description: "Simplified variant of UVA/Padova."
}

/**
 * @deprecated Use model UvaPadova_T1DMS instead.
 *
 * @description
 * Class representing a virtual patient according to a simplified version of
 * the UVA/Padova model which neglects the effect of glucagon, change of gut
 * absorption speed during the course of a meal, and subcutaneous glucose
 * kinetics.
 * 
 * Scientific sources:
 * 
 * [Dalla Man, IEEE TBME, 2006]
 *     Dalla Man, Ch.; Camilleri, M.; Cobelli, C.
 *     "A System Model of Oral Glucose Absorption: Validation on Gold Standard Data"
 *     IEEE Transactions on Biomedical Engineering, Volume 53, Number 12, December 2006
 * 
 * [Dalla Man, JDST, 2007]
 *     Dalla Man, Ch.; Raimondo, D.M.; Rizza, R. A.; Cobelli, C.
 *     "GIM, Simulation Software of Meal Glucose-Insulin Model." 
 *     Journal of Diabetes Science and Technology, Volume 1, Issue 3, May 2007
 * 
 * [Dalla Man, IEEE TBME, 2007]
 *     Dalla Man, Ch.; Camilleri, M.; Cobelli, C.
 *     "Meal Simulation Model of the Glucose-Insulin System"
 *     IEEE Transactions on Biomedical Engineering, Volume 54, Number 10, October 2007
 * 
 * [Dalla Man, JDST, 2014]
 *     Dalla Man, Ch. et al.
 *     "The UVA/PADOVA Type 1 Diabetes Simulator: New Features"
 *     Journal of Diabetes Science and Technology, Volume 8, Issue 1, 2014
 * 
 */
export class UvaPadova_mockup
    extends AbstractODEPatient
        <typeof stateDescription, typeof parameterDescription>
    implements ODEPatientModel<State> {

    /**
     * Insulin concentration in equilibrium.
     * This value appears in the equations (computeDerivatives), but it is
     * neither a state variable nor a parameter, but part of the steady state.
     */
    Ib: number = NaN

    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof PatientInput> {
        return ["carbs", "iir"]
    }

    getOutputList(): Array<keyof PatientOutput> {
        return ["Gp"]
    }

    getStateDescription() {
        return stateDescription
    }

    getParameterDescription() {
        return parameterDescription
    }
    
    computeSteadyState(u: PatientInput, t: Date): State {
        const helper = new SteadyStateFinder()
        this.Ib = NaN

        const unknownStates: Partial<State> = {
            Gp: 100, Gt: 100, Ip: 1, Il: 1, XL: 1, I_: 1, Isc1: 1, Isc2: 1,
        }
        const knownStates: Partial<State> = {
            Qsto1: 0, Qsto2: 0, Qgut: 0, X: 0,
        }
        
        const xeq = helper.findSteadyState(
            (x: State) => this.computeDerivatives(t, x, u),
            unknownStates, knownStates
        )

        this.Ib = xeq.Ip
        return xeq
    }

    computeDerivatives(_t: Date, x: State, u: PatientInput): State {

        const params = this.getParameterValues()

        // inputs
        /** meal ingestion in mg/min */
        const M = (u.carbs || 0) * 1000
        /** insulin infusion rate in pmol/min */
        const IIR = (u.iir || 0) * pmol_per_U / 60

        // plasma glucose concentration in mg/dl
        // [Dalla Man, JDST, 2014] (A1), [Dalla Man, IEEE TBME, 2007] (1)
        const G: number = x.Gp / params.VG

        // insulin-dependent glucose utilization in mg/kg/min
        // [Dalla Man, IEEE TBME, 2007] (15)
        // special case of risk=0 according to [Dalla Man, JDST, 2014] (A10)
        const Uid: number = (params.Vm0 + params.Vmx * x.X) * x.Gt / (params.Km0 + x.Gt)

        // insulin-independent glucose utilization in mg/kg/min
        // [Dalla Man, JDST, 2014] (A9), [Dalla Man, IEEE TBME, 2007] (14)
        const Uii: number = params.Fcns

        // plasma insulin concentration in in pmol/L
        // [Dalla Man, JDST, 2014] (A2), [Dalla Man, IEEE TBME, 2007] (3)
        const I = x.Ip / params.VI

        // amount of glucose in the stomach in mg
        // [Dalla Man, JDST, 2014] (A3), [Dalla Man, IEEE TBME, 2007] (13)
        const Qsto = x.Qsto1 + x.Qsto2

        // appearance rate of glucose in plasma in mg/kg/min
        // [Dalla Man, JDST, 2014] (A3), [Dalla Man, IEEE TBME, 2007] (13)
        const Ra = params.f * params.kabs * x.Qgut / params.BW

        // endogenous glucose production in mg/kg/min
        // [Dalla Man, JDST, 2014] (A5), [Dalla Man, IEEE TBME, 2007] (10) (Ipo = 0)
        const EGP = Math.max(0, params.kp1 - params.kp2 * x.Gp - params.kp3 * x.XL)

        // renal glucose excretion in mg/kg/min
        // [Dalla Man, JDST, 2014] (A14), [Dalla Man, IEEE TBME, 2007] (27)
        const E = Math.max(params.ke1 * (x.Gp - params.ke2), 0)

        // insulin appearance rate in pmol/kg/min
        // [Dalla Man, JDST, 2014] (A15)
        const Rai = params.ka1 * x.Isc1 + params.ka2 * x.Isc2

        // insulin secretion // [Dalla Man, IEEE TBME, 2007] (8)
        const m3eq = params.HEeq * params.m1 / (1 - params.HEeq)
        const S = m3eq * x.Il + params.m4 * x.Ip // in pmol/kg/min
        // hepatic extraction // [Dalla Man, IEEE TBME, 2007] (4)
        // HE is truncated between 0 and 0.9 to avoid singularity
        const HE = Math.min(0.9, Math.max(0, -params.m5 * S + params.m6))
        // rate constant of insulin degradation in the liver // [Dalla Man, IEEE TBME, 2007] (5)
        const m3 = params.m1 * HE / (1 - HE) // in 1/min

        // rate constant of gastric emptying - simplified placeholder
        // *** todo: replace with better model as described in [Dalla Man, IEEE TBME, 2006]
        const kempt = (params.kmax + params.kmin) / 2 // in 1/min

        // declare vector of derivatives dx/dt
        return {

            // Gp [Dalla Man, JDST, 2014] (A1), [Dalla Man, IEEE TBME, 2007] (1)
            Gp: EGP + Ra - Uii - E - params.k1 * x.Gp + params.k2 * x.Gt,

            // Gt [Dalla Man, JDST, 2014] (A1), [Dalla Man, IEEE TBME, 2007] (1)
            Gt: -Uid + params.k1 * x.Gp - params.k2 * x.Gt,

            // Ip [Dalla Man, JDST, 2014] (A2)
            Ip: -(params.m2 + params.m4) * x.Ip + params.m1 * x.Il + Rai,

            // Il [Dalla Man, JDST, 2014] (A2)
            Il: params.m2 * x.Ip - (params.m1 + m3) * x.Il,

            // Qsto1 [Dalla Man, JDST, 2014] (A3), [Dalla Man, IEEE TBME, 2007] (13)
            Qsto1: -params.kgri * x.Qsto1 + M,

            // Qsto2 [Dalla Man, JDST, 2014] (A3), [Dalla Man, IEEE TBME, 2007] (13)
            Qsto2: -kempt * x.Qsto2 + params.kgri * x.Qsto1,

            // Qgut [Dalla Man, JDST, 2014] (A3), [Dalla Man, IEEE TBME, 2007] (13)
            Qgut: -params.kabs * x.Qgut + kempt * x.Qsto2,

            // XL [Dalla Man, JDST, 2014] (A6), [Dalla Man, IEEE TBME, 2007] (11) (XL = Id)
            XL: -params.ki * (x.XL - x.I_),

            // I' [Dalla Man, JDST, 2014] (A7), [Dalla Man, IEEE TBME, 2007] (11) (I' = I1)
            I_: -params.ki * (x.I_ - I),

            // X [Dalla Man, JDST, 2014] (A11), [Dalla Man, IEEE TBME, 2007] (18)
            X: -params.p2u * x.X + params.p2u * (I - (this.Ib || x.Ip) / params.VI),

            // Isc1 [Dalla Man, JDST, 2014] (A16)
            Isc1: -(params.kd + params.ka1) * x.Isc1 + IIR / params.BW,

            // Isc2 [Dalla Man, JDST, 2014] (A16)
            Isc2: params.kd * x.Isc1 - params.ka2 * x.Isc2,
        }
    }

    computeOutput(_t: Date, x: State): PatientOutput {
        const params = this.getParameterValues()
        return {
            Gp: x.Gp / params.VG,
            Gt: x.Gp / params.VG,	// watch out, subcutaneous kinetics missing
        }
    };

}

/** Conversion factor between pmol insulin and units. */
const pmol_per_U = 6000

/** Description of parameters. */
export const parameterDescription = {
    "Gpeq":     { unit: "mg/dl",     default: 100,	},  // mg/dl
    "BW":       { unit: "kg",     default: 75,    increment: 5},  // 
    "VG":       { unit: "dl/kg",     default: 1.88,	},	// [Dalla Man, IEEE TBME, 2007]
    "k1":       { unit: "1/min",     default: 0.065,	},	// [Dalla Man, IEEE TBME, 2007]
    "k2":       { unit: "1/min",     default: 0.079,	},	// [Dalla Man, IEEE TBME, 2007]
    "VI":       { unit: "l/kg",     default: 0.05,	},	// [Dalla Man, IEEE TBME, 2007]
    "m1":       { unit: "1/min",     default: 0.190,	},	// [Dalla Man, IEEE TBME, 2007]
    "m2":       { unit: "1/min",     default: 0.484,	},	// [Dalla Man, IEEE TBME, 2007]
    "m4":       { unit: "1/min",     default: 0.194,	},	// [Dalla Man, IEEE TBME, 2007]
    "m5":       { unit: "min*kg/pmol",     default: 0.0304,},	// [Dalla Man, IEEE TBME, 2007]
    "m6":       { unit: "1",     default: 0.6471,},	// [Dalla Man, IEEE TBME, 2007]
    "HEeq":     { unit: "1",     default: 0.6,   },  // [Dalla Man, IEEE TBME, 2007]
    "kmax":     { unit: "1/min",     default: 0.0558,},	// [Dalla Man, IEEE TBME, 2007]
    "kmin":     { unit: "1/min",     default: 0.0080,},	// [Dalla Man, IEEE TBME, 2007]
    "kabs":     { unit: "1/min",     default: 0.057,	},	// [Dalla Man, IEEE TBME, 2007]
    "kgri":     { unit: "1/min",     default: 0.0558,},	// [Dalla Man, IEEE TBME, 2007]
    "bmeal":    { unit: "1",     default: 0.69,  },	// [Dalla Man, JDST, 2006]
    "cmeal":    { unit: "1",     default: 0.17,  },	// [Dalla Man, JDST, 2006]
    "f":        { unit: "1",     default: 0.90,  },	// [Dalla Man, IEEE TBME, 2007]
    "kp1":      { unit: "mg/kg/min",     default: 2.7,   },  // [Dalla Man, IEEE TBME, 2007]
    "kp2":      { unit: "1/min",     default: 0.0021,},	// [Dalla Man, IEEE TBME, 2007]
    "kp3":      { unit: "mg/kg per pmol/l",     default: 0.009,	},	// [Dalla Man, IEEE TBME, 2007]
    "kp4":      { unit: "mg/kg/min per pmol/kg",     default: 0.0618,},	// [Dalla Man, IEEE TBME, 2007]
    "ki":       { unit: "1/min",     default: 0.0079,},	// [Dalla Man, IEEE TBME, 2007]
    "Fcns":     { unit: "mg/kg/min",     default: 1,     },  // [Dalla Man, IEEE TBME, 2007]
    "Vm0":      { unit: "mg/kg/min",     default: 2.5,	},  // [Dalla Man, IEEE TBME, 2007]
    "Vmx":      { unit: "mg/kg/min per pmol/l",     default: 0.047,	},	// [Dalla Man, IEEE TBME, 2007]
    "Km0":      { unit: "mg/kg",     default: 225.59,},	// [Dalla Man, IEEE TBME, 2007]
    "p2u":      { unit: "1/min",     default: 0.0331,},	// [Dalla Man, IEEE TBME, 2007]
    "ke1":      { unit: "1/min",     default: 0.0005,},	// [Dalla Man, IEEE TBME, 2007]
    "ke2":      { unit: "mg/kg",     default: 339,	},  // [Dalla Man, IEEE TBME, 2007]
    "ka1":      { unit: "1/min",     default: 0.0018,},	// [Dalla Man, JDST, 2007]
    "ka2":      { unit: "1/min",     default: 0.0182,},	// [Dalla Man, JDST, 2007]
    "kd":       { unit: "1/min",     default: 0.0164,},	// [Dalla Man, JDST, 2007]
}
  
/** Description of state variables. */
export const stateDescription = {
    /** mass in accessible compartment (plasma) in mmol */ 
    Gp: {unit: "mg/kg" },
    /** mass in non-accessible compartment in mmol */
    Gt: {unit: "mg/kg" },
    // /** amount of insulin in compartment 1 in mU */
    // Gs: {unit: "" },
    /** amount of insulin in compartment 2 in mU */
    Ip: {unit: "pmol/kg" },
    /** plasma insulin in mU/L */
    Il: {unit: "pmol/kg" },
    /** insulin action on glucose transport in 1/min */
    Qsto1: {unit: "mg" },
    /** insulin action on glucose disposal in 1/min */
    Qsto2: {unit: "mg" },
    /** insulin action on endogenous glucose production in 1 */
    Qgut: {unit: "mg" },
    /** glucose in compartment 1 in mmol */
    XL: {unit: "pmol/l" },
    /** glucose in compartment 2 in mmol */
    I_: {unit: "pmol/l" },
    /** insulin action on glucose transport in 1/min */
    X: {unit: "pmol/l" },
    /** insulin action on glucose disposal in 1/min */
    Isc1: {unit: "pmol/kg" },
    /** insulin action on endogenous glucose production in 1 */
    Isc2: {unit: "pmol/kg" },
}

/** Type for patient state, i.e. numeric values of the state variables. */
type State = TypedPatientState<typeof stateDescription>
  
/** Use mixin to create Patient from ODEPatientModel. */
export default createPatientFromODE
    <typeof stateDescription, typeof parameterDescription>
    (UvaPadova_mockup)

/** HTML representation of identifiers (state variables, parameters). */
export const html = {
    /* states */
    "Gp": "G<sub>p</sub>",
    "Gt": "G<sub>t</sub>",
    "Ip": "I<sub>p</sub>",
    "Il": "I<sub>l</sub>",
    "Qsto1": "Q<sub>sto1</sub>",
    "Qsto2": "Q<sub>sto2</sub>",
    "Qgut": "Q<sub>gut</sub>",
    "XL": "X<sub>L</sub>",
    "I_": "I'",
    "X": "X",
    "Isc1": "I<sub>sc1</sub>",
    "Isc2": "I<sub>sc2</sub>",
    /* parameters */
    "BW": "BW",
    "Gpeq": "G<sub>p,eq</sub>",
    "VG": "V<sub>G</sub>",
    "k1": "k<sub>1</sub>",
    "k2": "k<sub>2</sub>",
    "VI": "V<sub>I</sub>",
    "m1": "m<sub>1</sub>",
    "m2": "m<sub>2</sub>",
    "m4": "m<sub>4</sub>",
    "m5": "m<sub>5</sub>",
    "m6": "m<sub>6</sub>",
    "HEeq": "HE<sub>eq</sub>",
    "kmax": "k<sub>max</sub>",
    "kmin": "k<sub>min</sub>",
    "kabs": "k<sub>abs</sub>",
    "kgri": "k<sub>gri</sub>",
    "f": "f",
    "kp1": "k<sub>p1</sub>",
    "kp2": "k<sub>p2</sub>",
    "kp3": "k<sub>p3</sub>",
    "kp4": "k<sub>p4</sub>",
    "ki": "k<sub>i</sub>",
    "Fcns": "F<sub>cns</sub>",
    "Vm0": "V<sub>m0</sub>",
    "Vmx": "V<sub>mx</sub>",
    "Km0": "K<sub>m0</sub>",
    "p2u": "p<sub>2u</sub>",
    "ke1": "k<sub>e1</sub>",
    "ke2": "k<sub>e2</sub>",
    "ka1": "k<sub>a1</sub>",
    "ka2": "k<sub>a2</sub>",
    "kd": "k<sub>d</sub>",
    /* signals */
    "RaI": "R<sub>aI</sub>",
    "E": "E",
    "EGP": "EGP",
    "Uid": "U<sub>id</sub>",
    "Uii": "U<sub>ii</sub>",
    "I": "I",
    "Qsto": "Q<sub>sto</sub>",
    "Ra": "R<sub>a</sub>",
    "S": "S",
    "HE": "HE",
    "m3": "m<sub>3</sub>",
}

/** Additional information to be displayed in tooltips. */
export const i18n_tooltip = {
    en: {
        "name": "UVA/Padova mockup",
        /* states */
        "Gp": "glucose in plasma",
        "Gt": "glucose in tissue",
        "Ip": "insulin in plasma",
        "Il": "insulin in liver",
        "Qsto1": "carbs in stomach, solid phase",
        "Qsto2": "carbs in stomach, liquid phase",
        "Qgut": "glucose mass in intestine",
        "XL": "insulin delay compartment 2",
        "I_": "insulin delay compartment 1",
        "X": "insulin in the interstitial fluid",
        "Isc1": "subcutaneous insulin in compartment 1",
        "Isc2": "subcutaneous insulin in compartment 2",
        /* parameters */
        "BW": "body weight",
        "Gpeq": "steady-state of glucose in plasma",
        "VG": "distribution volume of glucose",
        "k1": "rate parameter from Gp to Gt",
        "k2": "rate parameter from Gt to Gp",
        "VI": "distribution volume of insulin",
        "m1": "rate parameter from Il to Ip",
        "m2": "rate parameter from Ip to Il",
        "m4": "rate parameter from Ip to periphery",
        "m5": "rate parameter of hepatic extraction (slope)",
        "m6": "rate parameter of hepatic extraction (offset)",
        "HEeq": "steady-state hepatic extraction of insulin",
        "kmax": "maximal emptying rate of stomach",
        "kmin": "minimal emptying rate of stomach",
        "kabs": "rate constant of intestinal absorption",
        "kgri": "rate of grinding",
        "f": "fraction of intestinal absorption",
        "kp1": "extrapolated at zero glucose and insulin",
        "kp2": "liver glucose effectiveness",
        "kp3": "amplitude of insulin action on the liver",
        "kp4": "amplitude of portal insulin action on the liver",
        "ki": "delay between insulin signal and insulin action",
        "Fcns": "glucose uptake by the brain and erythrocytes",
        "Vm0": "Michaelis-Menten constant (offset)",
        "Vmx": "Michaelis-Menten constant (slope)",
        "Km0": "Michaelis-Menten constant (offset)",
        "p2u": "insulin action on the peripheral glucose utilization",
        "ke1": "glomerular filtration rate",
        "ke2": "renal threshold of glucose",
        "ka1": "rate constant of nonmonomeric insulin absorption",
        "ka2": "rate constant of monomeric insulin absorption",
        "kd": "rate constant of insulin dissociation",
        /* signals */
        "RaI": "insulin appearance rate",
        "E": "renal glucose excretion",
        "EGP": "endogenous glucose production",
        "Uid": "insulin-dependent glucose utilization",
        "Uii": "insulin-independent glucose utilization",
        "I": "plasma insulin concentration",
        "Qsto": "amount of glucose in the stomach",
        "Ra": "appearance rate of glucose in plasma",
        "S": "insulin secretion",
        "HE": "hepatic extraction",
        "m3": "rate constant of insulin degradation in the liver",
    },

    de: {
        "name": "UVA/Padova-Modell",
        /* states */
        "Gp": "Glukose im Plasma",
        "Gt": "Glukose im Gewebe",
        "Ip": "Insulin im Plasma",
        "Il": "Insulin in der Leber",
        "Qsto1": "Kohlenhydrate im Magen, Festphase",
        "Qsto2": "Kohlenhydrate im Magen, Flüssigphase",
        "Qgut": "Glukose im Darm",
        "XL": "Insulin Verzögerungskompartiment 1",
        "I_": "Insulin Verzögerungskompartiment 2",
        "X": "Insulin in der Interstitialflüssigkeit",
        "Isc1": "Subkutanes Insulin im Kompartiment 1",
        "Isc2": "Subkutanes Insulin im Kompartiment 2",
        /* parameters */
        "BW": "Körpergewicht",
        "Gpeq": "Glukose im Plasma im Gleichgewicht",
        "VG": "Verteilungsvolumen der Glukose",
        "k1": "Übergangsgeschwindigkeit von Gp nach Gt",
        "k2": "Übergangsgeschwindigkeit von Gt nach Gp",
        "VI": "Verteilungsvolumen des Insulins",
        "m1": "Übergangsgeschwindigkeit von Il nach Ip",
        "m2": "Übergangsgeschwindigkeit von Ip nach Il",
        "m4": "Übergangsgeschwindigkeit von Ip in die Peripherie",
        "m5": "Geschwindigkeit der hepatischen Extraction (Steigung)",
        "m6": "Geschwindigkeit der hepatischen Extraction (Offset)",
        "HEeq": "Hepatische Insulin-Extraktion im Gleichgewicht",
        "kmax": "Maximale Entleerungsrate des Magens",
        "kmin": "Minimale Entleerungsrate des Magens",
        "kabs": "Geschwindigkeit der Absorption im Darm",
        "kgri": "Geschwindigkeit der Zerkleinerung im Magen",
        "f": "Anteil der Absorption im Darm",
        "kp1": "extrapolated at zero glucose and insulin",
        "kp2": "liver glucose effectiveness",
        "kp3": "amplitude of insulin action on the liver",
        "kp4": "amplitude of portal insulin action on the liver",
        "ki": "delay between insulin signal and insulin action",
        "Fcns": "glucose uptake by the brain and erythrocytes",
        "Vm0": "Michaelis-Menten constant (offset)",
        "Vmx": "Michaelis-Menten constant (slope)",
        "Km0": "Michaelis-Menten constant (offset)",
        "p2u": "insulin action on the peripheral glucose utilization",
        "ke1": "glomerular filtration rate",
        "ke2": "renal threshold of glucose",
        "ka1": "rate constant of nonmonomeric insulin absorption",
        "ka2": "rate constant of monomeric insulin absorption",
        "kd": "rate constant of insulin dissociation",
        /* signals */
        "RaI": "insulin appearance rate",
        "E": "renal glucose excretion",
        "EGP": "endogenous glucose production",
        "Uid": "insulin-dependent glucose utilization",
        "Uii": "insulin-independent glucose utilization",
        "I": "plasma insulin concentration",
        "Qsto": "amount of glucose in the stomach",
        "Ra": "appearance rate of glucose in plasma",
        "S": "insulin secretion",
        "HE": "hepatic extraction",
        "m3": "rate constant of insulin degradation in the liver",
    },
}

/** Description of diagram that illustrates model structure. */
export const diagram = {

    subsystems: [
        { x: 210, y: 110, width: 180, height: 300, fill: "#DDDDFF", label: { text: "insulin subsystem" } },
        { x: 410, y: 10, width: 280, height: 300, fill: "#FFDDDD", label: { text: "glucose subsystem" } },
        { x: -40, y: 250, width: 230, height: 200, fill: "#DDFFCC", label: { text: "subcutaneous transport" } },
        { x: 60, y: 10, width: 330, height: 90, fill: "#FFDD55", label: { text: "meal subsystem" } },
    ],

    nodes: {
        "Gp": { x: 550, y: 150, geometry: { shape: "circle", d: 50 } },
        "Gt": { x: 550, y: 250, geometry: { shape: "circle", d: 50 } },
        "Ip": { x: 250, y: 350, geometry: { shape: "circle", d: 50 } },
        "Il": { x: 350, y: 350, geometry: { shape: "circle", d: 50 } },
        "Qsto1": { x: 150, y: 50, geometry: { shape: "circle", d: 50 } },
        "Qsto2": { x: 250, y: 50, geometry: { shape: "circle", d: 50 } },
        "Qgut": { x: 350, y: 50, geometry: { shape: "circle", d: 50 } },
        "I_": { x: 250, y: 150, geometry: { shape: "circle", d: 50 } },
        "XL": { x: 350, y: 150, geometry: { shape: "circle", d: 50 } },
        "X": { x: 350, y: 250, geometry: { shape: "circle", d: 50 } },
        "Isc1": { x: 50, y: 300, geometry: { shape: "circle", d: 50 } },
        "Isc2": { x: 50, y: 400, geometry: { shape: "circle", d: 50 } },

        "G": { x: 650, y: 150, geometry: { shape: "square", d: 40 } },
        "Ra": { x: 450, y: 50, geometry: { shape: "square", d: 40 } },
        "EGP": { x: 450, y: 150, geometry: { shape: "square", d: 40 } },
        "E": { x: 550, y: 50, geometry: { shape: "square", d: 40 } },
        "Uid": { x: 450, y: 250, geometry: { shape: "square", d: 40 } },
        "Uii": { x: 650, y: 50, geometry: { shape: "square", d: 40 } },
        "I": { x: 250, y: 250, geometry: { shape: "square", d: 40 } },
        "RaI": { x: 150, y: 350, geometry: { shape: "square", d: 40 } },
    },

    connections: [
        { from: { id: "Gp", angle: -60 }, to: { id: "Gt", angle: 60 }, type: "arrow", label: { text: "k1" } },
        { from: { id: "Gt", angle: 120 }, to: { id: "Gp", angle: -120 }, type: "arrow", label: { text: "k2" } },
        { from: { id: "Qsto1" }, to: { id: "Qsto2", }, type: "arrow", label: { text: "kgri" } },
        { from: { id: "Qsto2" }, to: { id: "Qgut", }, type: "arrow", label: { text: "kempt" } },
        { from: { id: "Qgut" }, to: { id: "Ra", }, type: "arrow", label: { text: "kabs" } },
        { from: { id: "Ra", angle: 0 }, to: { id: "Gp", angle: 120 }, type: "arrow", },
        { from: { id: "E", angle: 270 }, to: { id: "Gp", angle: 90 }, type: "arrow", },
        { from: { id: "Uii", angle: 180 }, to: { id: "Gp", angle: 60 }, type: "arrow", },
        { from: { id: "I_" }, to: { id: "XL" }, type: "arrow", label: { text: "ki" } },
        { from: { id: "I" }, to: { id: "X" }, type: "arrow", label: { text: "p2u" } },
        { from: { id: "I" }, to: { id: "I_" }, type: "arrow", label: { text: "" } },
        { from: { id: "XL" }, to: { id: "EGP" }, type: "arrow", },
        { from: { id: "EGP" }, to: { id: "Gp" }, type: "arrow", },
        { from: { x: 450, y: 100 }, to: { id: "EGP" }, type: "arrow", label: { text: "kp1" } },
        { from: { id: "Gp", angle: 150 }, to: { id: "EGP", angle: 30 }, type: "arrow", label: { text: "kp2" } },
        { from: { id: "X" }, to: { id: "Uid" }, type: "arrow", label: { text: "Vmx" } },
        { from: { x: 450, y: 300 }, to: { id: "Uid" }, type: "arrow", label: { text: "Vm0" } },
        { from: { id: "Uid" }, to: { id: "Gt" }, type: "arrow", },
        { from: { id: "Ip", angle: 30 }, to: { id: "Il", angle: 150 }, type: "arrow", },
        { from: { id: "Il", angle: -150 }, to: { id: "Ip", angle: -30 }, type: "arrow", },
        { from: { id: "RaI" }, to: { id: "Ip", }, type: "arrow", },
        { from: { id: "Isc1", angle: -90 }, to: { id: "Isc2", angle: 90 }, type: "arrow", label: { text: "kd" } },
        { from: { id: "Isc1", angle: 0 }, to: { id: "RaI", angle: 120 }, type: "arrow", label: { text: "ka1" } },
        { from: { id: "Isc2", angle: 0 }, to: { id: "RaI", angle: -120 }, type: "arrow", label: { text: "ka2" } },
        { from: { id: "Ip", angle: 90 }, to: { id: "I", angle: -90 } },
        { from: { id: "Gp", angle: 0 }, to: { id: "G", angle: 180 } },
    ],


    inputs: {
        "carbs": { to: { id: "Qsto1", angle: 0 } },
        "iir": { to: { id: "Isc1", angle: 0 } },
    },

}
