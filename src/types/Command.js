/**
 @module types/Command
 @description The Commands class
*/

/**
 * @typedef {Object} CommandConfigOptions
 * @property {boolean} [usageIfNotSet=true] - Should a help message be printed if no arguments are provided?
 * @property {boolean} [hideFlags] - Should any configured flags be hidden in the help menu?
 */

/**
 * @typedef {Object} CommandHelpOptions
 * @property {string|string[]} name The name of the command, or array of aliases (first will be name)
 * @property {string} description The description of the command
 * @property {string} [usage] How to use the command
 * @property {string|string[]} [examples] Any example commands
 * @property {Object} [fields] Any extra discord.js fields to add
 * @property {FlagOptions} [flags] Any flags 
 */

/**
 * @typedef {Object} CommandFlagOptions
 * @property {String|Boolean|Number|Object|string} type The primitive type of the flag, String, Boolean, etc. Can also be string version
 * @property {string} description A description of what the flag does
 * @property {string[]} aliases Any aliases of the flag that can be used
 */

/**
 * @property {Client} client Discord.js client
 * @property {Logger} logger Logger for class
 */
export default class {
    /**
     * Create a new command 
     *
     * @param {Client} client The current discord.js client
     * @param {Logger} logger A logger for the class to use
     */
    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
    }


    /**
     * Fired everytime the bot prefix and command name/aliases are used.
     *
     * @param {string} msg The raw discord.js message
     * @param {string[]} args Any arguments (the message content split by spaces)
     * @param {Object} flags Any flags set in a key-value pair
     */
    run(msg, args, flags) {

    }


    /**
     * Sets any settings for the command
     *
     * @returns {CommandConfigOptions} Any settings
     */
    config() {
        return {
            usageIfNotSet: true,
        }
    }


    /**
     * Sets the meta information for the command
     *
     * @returns {CommandHelpOptions} All help options
     */
    help() {
        return {

        }
    }
    /*help() {
        return {
            name: [],
            description: 'A base command.',
            usage: '',
            flags: {}
        }
    }*/

    exit() {
        
    }
}