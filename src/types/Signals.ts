/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { MealAnnouncement } from './Meal.js'


/** scalar signal value */
export declare type SignalValue = number

/** description of scalar signal */
export declare type SignalDescription = {
    /** signal unit */
    unit?: string,
    /** can this signal exhibit steps? */
    discontinuous?: boolean,
}

/** desciption of whole signal */
export declare type VectorSignalDescription = {
    [id in string]: SignalDescription
}


/** value of specified signal */
export declare type TypedVectorSignalValue<VectorSignalDescription> = {
    [id in keyof VectorSignalDescription]: SignalValue
}

/** time-dependent value of specified signal */
export declare type TypedVectorSignalValueOverTime<VectorSignalDescription> = {
    [id in keyof VectorSignalDescription]: (t: Date) => SignalValue
}



/** 
 * description of controller outputs passed on to actuators
 */
export const ControllerOutputDescription = {
    /** required insulin infusion rate in U/h */
    iir: {unit: 'U/h'},
    /** required insulin bolus in U */
    ibolus: {unit: 'U'},
}

/**
 * type of a signal carrying the supported outputs from a controller
 */
export declare type ControllerOutput = 
    Partial<TypedVectorSignalValue<typeof ControllerOutputDescription>>

/** 
 * description of supported treatments that can be administered by actuator
 */
export const MedicationDescription = {
    /** insulin infusion rate in U/h */
    iir: {unit: 'U/h'},
    /** glucagon infusion rate in U/h */
    hir: {unit: 'U/h'},
}

/**
 * type of a signal carrying supported medications/treatments
 */
export declare type Medication = 
    Partial<TypedVectorSignalValue<typeof MedicationDescription>>

/** 
 * description of signals which influence blood glucose levels but cannot
 * be influenced by controller
 */
export const DisturbanceDescription = {
    /** total consumed meal starting now, in g
     * (this is mainly used for logging/display purposes) */
    meal: {unit: 'g'},
    /** momentary carb intake in g/min */
    carbs: {unit: 'g/min'},
    /** momentary exercise intensity in % */
    exercise: {unit: '%'},
}

/** 
 * Momentary values of a signal which influences blood glucose levels but 
 * cannot be influenced by the controller.
 */
export declare type Disturbance = {
    [id in keyof typeof DisturbanceDescription]?: SignalValue
}

/** 
 * description of all patient inputs, i.e. disturbances and medications
 */
export const PatientInputDescription = {
    ... MedicationDescription,
    ... DisturbanceDescription,
}

/** 
 * Patient inputs, which are composed of medications (administered by actuator)
 * and disturbances (uncontrollable influencing factors like meals).
 */
export declare type PatientInput = Medication & Disturbance

/**
 * Patient inputs as a time-dependent signal.
 * (If signals are not piecewise constant during each step, they must be
 * described as functions over time for the solver.)
 */
export declare type PatientInputOverTime = (t: Date) => PatientInput

/** 
 * Description of patient outputs (as passed on to sensors).
 */
export const PatientOutputDescription = {
    /** plasma glucose in mg/dl */
    Gp: {unit: 'mg/dl'},
    /** tissue glucose in mg/dl */
    Gt: {unit: 'mg/dl'},
}

/**
 * A signal carrying patient outputs.
 */
export declare type PatientOutput = {
    /** plasma glucose in mg/dl */
    Gp: number,
    /** tissue glucose in mg/dl */
    Gt?: number,
} & {
    /** additional physiological outputs */
    [id in string]: number
}

/** 
 * Description of measurements provided by sensors (as passed on to controller)
 */
export const MeasurementDescription = {
    /** continuous glucose measurement in mg/dl */
    CGM: {unit: 'mg/dl'},
    /** self-measured blood glucose in mg/dl */
    SMBG: {unit: 'mg/dl'},
    /** intravenous blood glucose in mg/dl */
    IVBG: {unit: 'mg/dl'},
}

/** 
 * Available measurement values provided by sensors.
 */
export declare type Measurement = Partial<{
    [id in keyof typeof MeasurementDescription]: SignalValue
}>

/** 
 * Measurements to be retrieved by controller.
 * By packing them into functions, their use by the controller can be traced.
 */
export declare type TracedMeasurement = Partial<{
    [id in keyof typeof MeasurementDescription]: () => SignalValue
}>

/** 
 * A list of meal announcements.
 */
export declare type AnnouncementList = {
    [uid in string]: MealAnnouncement
}
