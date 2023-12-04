/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * type for meal with optional announcement
 */
declare type Meal = {
    /** time the meal starts */
    start: Date
    /** duration of meal in min */
    duration?: number
    /** total amount of carbs in g */
    carbs: number
    /** announcement of meal */
    announcement?: MealAnnouncement
}
export default Meal

/**
 * type for meal announcements
 */
export declare type MealAnnouncement = {
    /** time the announcement is made */
    time: Date
    /** announced starting time of meal */
    start: Date
    /** announced amount of carbs in g */
    carbs: number
}
