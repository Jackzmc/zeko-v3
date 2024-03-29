/**
 @module types/Event
 @description The Event class, custom events inherit
*/

import { Client } from "discord.js";
import Core from "../core/Core.js";
import Logger from '../Logger'

export interface EventConfig {
    intents: number
}

/**
 * @property {Client} client Discord.js client
 * @property {Logger} logger Logger for class
 */
export default class {
    protected client: Client;
    protected logger: Logger;
    protected core: Core

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

    // Called when everything is ready (discord.js ready and zeko core is ready)
    ready(core?: Core): Promise<any> | any {}
    

    //Internal function, don't overwrite
    onReady(core: Core) {
        this.core = Core.getInstance()
        return this.ready(core)
    }

    config?(): Promise<Partial<EventConfig>> | Partial<EventConfig> | null;

    /**
     * Fires before the core event (if exists & this is custom event) is fired. Must return a promise.
     * Return a value of false if core/after events should be cancelled
     *
     * @param {...*} any Any discord.js event properties
     *
     * @returns {Promise<boolean>} Return false to stop event propogating
     */
    before?(...args: any[]): Promise<boolean> | boolean {
        return true
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