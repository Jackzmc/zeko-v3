/**
 @module types/Module
 @description The module class
*/


/**
 * @property {Client} client Discord.js client
 * @property {Logger} logger Logger for class
 * @class
 */
export default class {
    /**
     * Create a new module
     *
     * @param {Client} client The current discord.js client
     * @param {Logger} logger A logger for the class to use
     */
    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
    }


    /**
     * Fired on bot exit or module reload
     *
     */
    exit() {

    }
}