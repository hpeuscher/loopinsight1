/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


import InvalidResultError from '../common/errors/InvalidResultError.js'
import Actuator from '../types/Actuator.js'
import Controller from '../types/Controller.js'
import Exercise from '../types/Exercise.js'
import Meal from '../types/Meal.js'
import Patient, { PatientState } from '../types/Patient.js'
import Sensor from '../types/Sensor.js'
import {
    AnnouncementList,
    ControllerOutput,
    Measurement,
    Medication,
    PatientInput,
    PatientOutput,
    TracedMeasurement
} from '../types/Signals.js'
import { SimulationResult } from '../types/SimulationResult.js'
import Solver from '../types/Solver.js'
import ControllerUnion from './ControllerUnion.js'
import SolverRK1_2 from './solvers/SolverRK1_2.js'

/** Class that describes the main simulator. */
export default class Simulator {

    /** array of meals (including announcements) */
    protected meals: Meal[] = []
    /** array of exercise units */
    protected exercises: Exercise[] = []
    /** virtual patient model to simulate physiology */
    protected patient!: Patient
    /** controller to prescribe treatment */
    protected controller!: Controller
    /** sensor to deliver measurements */
    protected sensor!: Sensor
    /** actuator to administer medication */
    protected actuator!: Actuator
    /** options */
    protected options: SimulatorOptions = { dt: 1 }
    /** results of previous simulation run */
    protected simulationResults: SimulationResult[] = []
    /** callback to propagate simulation results on the fly */
    protected callback: (r: SimulationResult) => void = () => {}
    /** ode solver */
    protected solver: Solver = new SolverRK1_2()


    /** create a new simulator instance */
    public constructor() {
    }

    /**
     * Set virtual patient model
     * @param{Patient} patient - virtual patient
     */
    setPatient(patient: Patient): void {
        this.patient = patient
    }

    /**
     * Sets the controller (which computes medication from measurements).
     * @param{Controller | Controller[]} controller - The controller to prescribe
     *      medication. If an array is handed over, a ControllerUnion instance is
     *      automatically created.
     */
    setController(controller: Controller | Controller[]): void {
        if (Array.isArray(controller)) {
            this.controller = new ControllerUnion(controller)
        }
        else {
            this.controller = controller
        }
    }

    /**
     * Sets the actuator model.
     * @param{Actuator} actuator
     */
    setActuator(actuator: Actuator): void {
        this.actuator = actuator
    }

    /**
     * Sets the sensor model.
     * @param{Sensor} sensor
     */
    setSensor(sensor: Sensor): void {
        this.sensor = sensor
    }

    /**
     * Sets meals (including announcements).
     * @param{Meal[]} meals
     */
    setMeals(meals: Meal[]): void {
        const minMealDuration = 1
        this.meals = meals.map( meal => {
            // make sure duration of meal is strictly positive
            const duration = (typeof meal.duration !== "undefined" && 
            meal.duration >= minMealDuration) ?
            meal.duration : minMealDuration
            meal.duration = duration
            return meal
        })
    }

    /**
     * Sets exercise units.
     * @param{Exercise[]} exercises
     */
    setExerciseUnits(exercises: Exercise[]): void {
        this.exercises = exercises
        const minExerciseDuration = 5
        this.exercises = exercises.map( exercise => {
            // make sure duration of exercise is strictly positive
            const duration = (typeof exercise.duration !== "undefined" && 
            exercise.duration >= minExerciseDuration) ?
            exercise.duration : minExerciseDuration
            exercise.duration = duration
            return exercise
        })
    }

    /**
     * Sets general options for simulation.
     * @param{Partial<SimulatorOptions>} options
     */
    setOptions(options: Partial<SimulatorOptions>): void {
        this.options = { ...this.options, ...options }

        // set time step to at least 1 minute
        if ((this.options.dt || 0) < 1) {
            this.options.dt = 1
        }
        else {
            this.options.dt = Math.ceil(this.options.dt!)
        }
    }

    /**
     * Sets numerical solver.
     * @param{Solver} solver
     */
    setSolver(solver: Solver): void {
        this.solver = solver
    }

    /** 
     * Sets callback to propagate simulation results on the fly.
     * @param{Function} callback - function to propagate result
     */
    setCallback(callback: (r: SimulationResult) => void) {
        this.callback = callback
    }

    /**
     * Performs simulation.
     * @returns{ SimulationResult[] }
     */
    runSimulation(): SimulationResult[] {

        /** initial time of simulation */
        let t: Date = this.options.t0 ?? new Date(Date.now())

        /** stop time of simulation */
        const tmax: Date = this.options.tmax
            ?? new Date(t.valueOf() + 1 * MS_PER_HOUR)

        // reset simulationResults
        this.simulationResults = []

        /** random seed */
        const seed = this.options?.seed || 1

        // reset solver
        this.solver.reset(this.options.dt!)

        // initialize sensor
        this.sensor.reset?.(t, seed + 1, this.solver)

        // initialize controller
        this.controller.reset?.(t, seed + 2, this.solver)

        // initialize actuator
        this.actuator.reset?.(t, seed + 3, this.solver)

        // initialize patient model
        this.patient.reset?.(t, seed + 4, this.solver)

        // initialize simulation variables
        /** internal state of virtual patient compartments */
        let x: PatientState
        /** visible physiological outputs of virtual patient */
        let y: PatientOutput
        /** measurements internally recorded by sensor */
        let s = {} as Measurement
        /** measurements as provided to the controller */
        let sTraced: TracedMeasurement = {}
        /** controller outputs */
        let c = {} as ControllerOutput
        /** medication/treatment administered to virtual patient */
        let medication: Medication = {}
        /** patient input including disturbances (e.g., meals) */
        let u = {} as PatientInput

        // start simulation
        while (t <= tmax) {

            // update virtual patient
            this.patient.update(t, (t: Date) => {
                return {
                    ...medication,
                    carbs: this._momentaryCarbIntake(t),
                    meal: this._newMealStartingAt(t),
                    exercise: this._momentaryExerciseIntensity(t)
                }
            })
            x = this.patient.getState()
            y = this.patient.getOutput()

            // update sensor
            s = this.sensor.update(t, y)
            sTraced = this.sensor.getOutput()

            // compute controller output
            const a = this._getActiveMealAnnouncements(t)
            this.controller.update(t, sTraced, a)
            const cNew = this.controller.getOutput()
            // keep previous infusion rate, if no new value is set by controller
            if (isFinite(cNew.iir!)) {
                c.iir = cNew.iir
            }
            // reset insulin bolus to zero unless new bolus is requested
            if ((cNew.ibolus ?? 0) > 0) {
                c.ibolus = cNew.ibolus
            }
            else {
                delete c.ibolus
            }

            // update actuator
            // TODO: make sure that actuator always processes a bolus, if present
            medication = this.actuator.update(t, c)
            // medication = this.actuator.getOutput() // TODO: remove?

            // other patient inputs (disturbances)
            const carbs = this._momentaryCarbIntake(t)
            const meal = this._newMealStartingAt(t)
            const exercise = this._momentaryExerciseIntensity(t)
            u = { ...medication, carbs, meal, exercise }

            // store results
            const result: SimulationResult = {
                t, x, y,
                u,
                s,
                c: this.controller.getOutput(),
                a,
                log: this.controller.getInternals()
            }
            this.simulationResults.push(result)

            // propagate simulation results on the fly, if required
            this.callback?.(result)

            // validity check
            if (isNaN(y.Gp)) {
                throw new InvalidResultError(t, { y, x, s, c, u })
            }

            // proceed one time step
            t = this._computeNextTime(t)

        }

        return this.simulationResults
    }

    /**
     * Return results of previous simulation run.
     * @returns {SimulationResult[]} Results
     */
    getSimulationResults(): SimulationResult[] {
        return this.simulationResults
    }

    /**
     * Computes momentary carb intake at given time
     * 
     * @param {Date} t - Current time
     * @returns {number} Carb intake in g/min
     */
    protected _momentaryCarbIntake(t: Date): number {
        return this.meals.map( (meal) => {
            // see if given time is within meal duration 
            const { start, duration, carbs } = meal
            const tend = new Date(start.valueOf() + duration! * MS_PER_MIN)
            return ((t >= start!) && (t < tend)) ? carbs / duration! : 0
        })
        // sum up contributions of all meals
        .reduce((acc, next) => acc + next, 0)
    }

    /**
     * Computes time for next simulation step, considering the required stops 
     * by the discrete-time elements of the loop (sensor, controller, actuator)
     * and global events like meal announcements.
     * 
     * @param {Date} t - Current time
     * @returns {Date} Time to stop next.
     */
    protected _computeNextTime(t: Date): Date {
        /** minimal time step in min */
        const dt = this.options.dt || 1

        // proceed by default time step dt
        let tNext = t.valueOf() + dt * MS_PER_MIN
        // for fixed step size, return now
        // return new Date(tNext)

        // consider stops requested by discrete-time systems
        const blocks = [this.sensor, this.controller, this.actuator]
        tNext = blocks.reduce((acc, next) =>
            Math.min(acc, next.getNextUpdateTime(t)?.valueOf() || Infinity),
            t.valueOf() + dt * MS_PER_MIN)

        // consider upcoming events (announcements, carb intake, exercise)
        tNext = Math.min(tNext, 
            this._nextCarbIntakeChange(t),
            this._getTimeOfNextMealAnnouncements(t),
            // TODO exercise
        )

        return new Date(tNext)
    }

    /**
     * Computes time of next change in carb intake
     * 
     * @param {Date} t - Current time
     * @returns {number} Date of next change as number
     */
    protected _nextCarbIntakeChange(t: Date): number {
        return this.meals.reduce( (tNext, meal) => {
            const { start, duration } = meal
            const tend = new Date(start.valueOf() + duration! * MS_PER_MIN)
            if (start > t && start.valueOf() < tNext) 
                tNext = start.valueOf()
            if (tend > t && tend.valueOf() < tNext) 
                tNext = tend.valueOf()
            return tNext
        }, Infinity)
    }

    /**
     * Computes time of next change in physical activity
     * 
     * @param {Date} t - Current time
     * @returns {number} Date of next change as number
     */
    protected _nextExerciseChange(t: Date): number {
        return this.exercises.reduce( (tNext, exercise) => {
            const { start, duration } = exercise
            const tend = new Date(start.valueOf() + duration! * MS_PER_MIN)
            if (start > t && start.valueOf() < tNext) 
                tNext = start.valueOf()
            if (tend > t && tend.valueOf() < tNext) 
                tNext = tend.valueOf()
            return tNext
        }, Infinity)
    }

    /**
     * Computes momentary exercise intensity at given time
     * 
     * @param {Date} t - Time of interest
     * @returns {number} Current exercise intensity in %
     */
    protected _momentaryExerciseIntensity(t: Date): number {
        let intensity = 0
        for (const exercise of this.exercises) {
            const tend = new Date(exercise.start.valueOf() + exercise.duration * MS_PER_MIN)
            if (t >= exercise.start && t < tend) {
                intensity = exercise.intensity
            }
        }
        return intensity
    }

    /**
     * Determines whether a new meal starts at given time t and returns total
     * amount of carbs.
     * @param {Date} t - Time of interest
     * @returns {number} Total amount of carbs in g (zero if no meal starts)
     */
    protected _newMealStartingAt(t: Date): number {
        return this.meals.filter( 
            meal => meal.start.valueOf() === t.valueOf()
        )
        .reduce( (acc, meal) => acc += meal.carbs, 0)
    }

    /** 
     * Returns time of next meal announcement.
     * 
     * @param {Date} t - Current time.
     * @returns {number} Time as number.
     * 
     */
    protected _getTimeOfNextMealAnnouncements(t: Date): number {
        const tMealAnnouncements = this.meals.filter((meal) =>
            (typeof meal?.announcement?.carbs  !== "undefined") &&
            (meal.announcement.carbs > 0) &&
            (typeof meal?.announcement?.time !== "undefined") &&
            (meal.announcement.time > t) 
        ).map((meal) => meal.announcement!.time.valueOf())
        return Math.min(... tMealAnnouncements, Infinity)
    }

    /** 
     * Returns list of meals that are currently (at time t) announced.
     * 
     * From the total list of all announcements, only those are returned whose 
     * time of announcement lies in the past with respect to the current time t.
     * 
     * @param {Date} t - Current time
     * @returns {AnnouncementList} List of active announcements
     * 
     */
    protected _getActiveMealAnnouncements(t: Date): AnnouncementList {
        return <AnnouncementList>Object.fromEntries(
            this.meals.filter((meal) =>
                (meal?.announcement?.carbs || 0 > 0) &&
                (typeof meal?.announcement?.start !== "undefined") &&
                (t >= (meal?.announcement?.time || 0))
            ).map((meal, id) => [id, meal.announcement])
        )
    }

}

/** Type for simulator options. */
export declare type SimulatorOptions = {
    /** simulation time step in min (default: 1) */
    dt?: number
    /** initial simulation time */
    t0?: Date
    /** final simulation time (if missing, one hour will be simulated) */
    tmax?: Date
    /** random seed (default: 1) */
    seed?: number
}

/** Conversion factor from milliseconds to minutes. */
const MS_PER_MIN = 60e3
/** Conversion from milliseconds to hours. */
const MS_PER_HOUR = 3600e3
