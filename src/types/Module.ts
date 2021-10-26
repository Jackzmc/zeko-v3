/**
 @module types/Module
 @description The module class
*/

import { Client } from "discord.js";
import Core from "../core/Core.js";
import Logger from '../Logger.js'

export interface ModuleConfig {
    //loadBefore?: string[],
    loadLate?: boolean
}

/**
 * @property {Client} client Discord.js client
 * @property {Logger} logger Logger for class
 * @class
 */

export default class Module {
    protected client: Client;
    protected logger: Logger;
    protected core: Core;

    /**
     * Create a new module
     *
     * @param {Client} client The current discord.js client
     * @param {Logger} logger A logger for the class to use
     */
    constructor(client: Client, logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    static config: ModuleConfig = {}

    /**
     * Called when the discord.js ready event is called for the first time
     *
     * @memberof Module
     */
     // Called when everything is ready (discord.js ready and zeko core is ready)
    ready(): Promise<any> | any {

    }

    onReady() {
        this.core = Core.getInstance()
        return this.ready()
    }

    /**
     * Fired on bot exit or module reload
     *
     * * @param {boolean} [waitable] Can the bot wait for any cleanup, or is it shutting down right now. (Async or not)
     */
    exit?(waitable: boolean): void | Promise<any>;
}