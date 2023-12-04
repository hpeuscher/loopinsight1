/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import Simulator from '../../src/core/Simulator.js'
import Exercise from '../../src/types/Exercise.js'
import Meal from '../../src/types/Meal.js'

/**
 * Runs unit tests of the simulator core functions
 * which compute the meal and exercise signals.
 */

describe("Simulator", () => {
    let meals: Meal[] = [
        {
            start: today('08:00'),
            duration: 20,
            carbs: 40,
            announcement: {
                start: today('07:00'),
                carbs: 20,
                time: today('00:00'),
            },
        },
        {
            start: today('17:00'),
            duration: 60,
            carbs: 30,
            announcement: {
                start: today('16:00'),
                carbs: 40,
                time: today('14:00'),
            },
        },
        {
            start: today('12:00'),
            carbs: 0,
            announcement: {
                start: today('12:00'),
                carbs: 30,
                time: today('10:00'),
            },
        },
        {
            start: today('20:00'),
            duration: 10,
            carbs: 0,
        }
    ]

    let exerciseUnits: Exercise[] = [
        {
            start: today('08:00'),
            duration: 20,
            intensity: 70,
        },
        {
            start: today('16:00'),
            duration: 60,
            intensity: 20,
        },
    ]

    // ------------------------------------------------------------------------------------------

    describe("#momentaryCarbIntake", () => {

        const simulator = new Simulator()
        simulator.setMeals(meals)
        const momentaryCarbIntake = (t: Date) =>
            simulator['_momentaryCarbIntake'](t) // workaround to call private method

        it("should return zero before breakfast actually starts", () => {
            expect(momentaryCarbIntake(today('7:59'))).to.equal(0)
            expect(momentaryCarbIntake(yesterday('8:00'))).to.equal(0)
        })

        it("should return zero between meals", () => {
            expect(momentaryCarbIntake(today('12:30'))).to.equal(0)
        })

        it("should return zero after afternoon meal", () => {
            expect(momentaryCarbIntake(today('18:30'))).to.equal(0)
        })

        it("should return 2g/min during breakfast", () => {
            expect(momentaryCarbIntake(today('08:00'))).to.equal(2)
            expect(momentaryCarbIntake(today('08:19'))).to.equal(2)
        })

        it("should return 0.5g/min during afternoon meal", () => {
            expect(momentaryCarbIntake(today('17:00'))).to.equal(0.5)
            expect(momentaryCarbIntake(today('17:59'))).to.equal(0.5)
        })

    })

    // todo: test overlapping meals


    // ------------------------------------------------------------------------------------------

    describe("#newMealStartingAt", () => {

        const simulator = new Simulator()
        simulator.setMeals(meals)
        const newMealStartingAt = (t: Date) =>
            simulator['_newMealStartingAt'](t) // workaround to call private method

        it("should return 0 unless meal starts", () => {
            expect(newMealStartingAt(today('07:10'))).to.equal(0)
            expect(newMealStartingAt(today('08:00:01'))).to.equal(0)
            expect(newMealStartingAt(today('07:00'))).to.equal(0)
            expect(newMealStartingAt(yesterday('08:00'))).to.equal(0)
            expect(newMealStartingAt(today('14:00'))).to.equal(0)
            expect(newMealStartingAt(today('16:00'))).to.equal(0)
        })

        it("should return 0 when zero meal starts", () => {
            expect(newMealStartingAt(today('20:00'))).to.equal(0)
        })

        it("should return 40g when first meal starts", () => {
            expect(newMealStartingAt(today('08:00'))).to.equal(40)
        })

        it("should return 30g when second meal starts", () => {
            expect(newMealStartingAt(today('17:00'))).to.equal(30)
        })
    })



    // ------------------------------------------------------------------------------------------

    describe("#momentaryExerciseIntensity", () => {

        const simulator = new Simulator()
        simulator.setExerciseUnits(exerciseUnits)
        const momentaryExerciseIntensity = (t: Date) =>
            simulator['_momentaryExerciseIntensity'](t) // workaround to call private method

        it("should return zero before first activity starts", () => {
            expect(momentaryExerciseIntensity(today('07:10'))).to.equal(0)
            expect(momentaryExerciseIntensity(yesterday('08:00'))).to.equal(0)
            expect(momentaryExerciseIntensity(today('07:59'))).to.equal(0)
        })

        it("should return zero between activities", () => {
            expect(momentaryExerciseIntensity(today('08:30'))).to.equal(0)
            expect(momentaryExerciseIntensity(today('12:30'))).to.equal(0)
            expect(momentaryExerciseIntensity(today('15:59'))).to.equal(0)
        })

        it("should return zero after second activity", () => {
            expect(momentaryExerciseIntensity(today('17:00'))).to.equal(0)
            expect(momentaryExerciseIntensity(today('18:30'))).to.equal(0)
            expect(momentaryExerciseIntensity(tomorrow('00:00'))).to.equal(0)
        })

        it("should return 70% during first unit", () => {
            expect(momentaryExerciseIntensity(today('08:00'))).to.equal(70)
            expect(momentaryExerciseIntensity(today('08:10'))).to.equal(70)
            expect(momentaryExerciseIntensity(today('08:19'))).to.equal(70)
        })

        it("should return 20% during second unit", () => {
            expect(momentaryExerciseIntensity(today('16:00'))).to.equal(20)
            expect(momentaryExerciseIntensity(today('16:30'))).to.equal(20)
            expect(momentaryExerciseIntensity(today('16:59:30'))).to.equal(20)
        })
    })

    // todo: specify and test behavior for overlapping units
    // todo: intensity should be limited to 0...100
})



const MS_PER_DAY = 24 * 60 * 60 * 1000

export function today(s: string): Date {
    if (s.length === 4) {
        return new Date('2022-05-01T0' + s + ':00Z')
    } else if (s.length === 5) {
        return new Date('2022-05-01T' + s + ':00Z')
    } else if (s.length === 7) {
        return new Date('2022-05-01T0' + s + ':00Z')
    } else if (s.length === 8) {
        return new Date('2022-05-01T' + s + 'Z')
    }
    return new Date(s)
}

export function yesterday(s: string): Date {
    return _add_days(today(s), -1)
}

export function tomorrow(s: string): Date {
    return _add_days(today(s), 1)
}

function _add_days(d: Date, days: number) {
    return new Date(d.valueOf() - days * MS_PER_DAY)
}
