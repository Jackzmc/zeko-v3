/**
 @module types/Event
 @description The Event class, custom events inherit
*/

import { Client } from "discord.js";
import Logger from '../Logger'

/**
 * @property {Client} client Discord.js client
 * @property {Logger} logger Logger for class
 */
export default class {
    protected client: Client;
    protected logger: Logger;

    /**
     * Create a new event
     *
     * @param {Client} client The current discord.js client
     * @param {Logger} logger A logger for the class to use
     */
    constructor(client: Client, logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    /**
     * Fires before the core event (if exists & this is custom event) is fired. Must return a promise.
     * Return a promise of true if core/after events should be cancelled
     *
     * @param {...*} any Any discord.js event properties
     *
     * @returns {Promise<boolean>} Return a promised true to cancel event
     */
    before?(...args: any[]): Promise<boolean> | void {
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
    after?(...args: any[]): void {

    }

    /**
     * Runs after bot termination or reload.
     *
     * @param {boolean} [waitable] Can the bot wait for any cleanup, or is it shutting down right now. (Async or not)
     */
    exit?(waitable: boolean): void | Promise<any>;
}