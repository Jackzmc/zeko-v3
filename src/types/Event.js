/**
 @module types/Event
 @description The Event class, custom events inherit
*/

/**
 * @property {Client} client Discord.js client
 * @property {Logger} logger Logger for class
 */
export default class {
    /**
     * Create a new event
     *
     * @param {Client} client The current discord.js client
     * @param {Logger} logger A logger for the class to use
     */
    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
    }

    /**
     * Fires before the core event (if exists) is fired. Must return a promise.
     * Return a promise of true if core/after events should be cancelled
     *
     * @param {...*} any Any discord.js event properties
     *
     * @returns {Promise<Boolean>} Return true to cancel event
     */
    before(/* args */) {
        return new Promise((resolve,reject) => {
            resolve(false)
        })
    }
    //
     /**
     * Fires after custom before event, and core event fired if not cancelled.
     *
     * @param {...*} any Any discord.js event properties
     *
     */
    after() {

    }

    /**
     * Runs after bot termination or reload.
     *
     */
    exit() {

    }
}