/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Helper class to simplify management of events.
 * 
 * At each time step, the simulator provides a list of events (e.g., meals) to 
 * the controller. This list may constantly change. Each announcement
 * has, however, a unique ID which is preserved in the list. This class filters
 * the list of presently available events for entries that are now
 * relevant (i.e., they fulfill some filter criteria) but have not been dealt
 * with before. 
 */
export default class EventManager {

    private _handledEvents: Array<string> = []

    /**
     * Performs reset (treat all events as unhandled)
     */
    reset() {
        this._handledEvents = []
    }

    /**
     * Applies filter to all known events and extract IDs that are now
     * relevant and have not been handled before
     * 
     * @param {EventList} events - all known events
     * @param {FilterFunction} filter - criteria to pick relevant events
     * @returns {Array<string>} list of active events
     */
    update(events: EventList, filter: FilterFunction = (_id) => true)
        : Array<string> {

        if (JSON.stringify(events) === "{}")
            return []

        // find events that satisfy filter and are not yet handled
        const activeIDs = Object.keys(events)
            .filter((uid) => !this._handledEvents.includes(uid))
            .filter(filter)

        // remember ids that are active this time
        for (const id of activeIDs) {
            this._handledEvents.push(id)
        }

        return activeIDs
    }

    /**
     * Returns IDs of events that lie in the future and have not been handled.
     * @param {EventList} events - all known events
     * @returns {Array<string>} list of unhandled events
     */
    getUnhandledEventIDs(events: EventList): Array<string> {
        return Object.keys(events)
            .filter((uid) => !this._handledEvents.includes(uid))
    }
}

/**
 * a filter function that decides whether an entry should be handled now
 */
export type FilterFunction = (id: string) => boolean

/**
 * a list of unique events which should be handled only once
 */
export type EventList<EventType = object> = {
    [uid: number|string]: EventType
}
