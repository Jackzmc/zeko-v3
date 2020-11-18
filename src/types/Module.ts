/**
 @module types/Module
 @description The module class
*/

import { Client } from "discord.js";
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
     * Fired on bot exit or module reload
     *
     * * @param {boolean} [waitable] Can the bot wait for any cleanup, or is it shutting down right now. (Async or not)
     */
    exit?(waitable: boolean): void | Promise<any>;
}