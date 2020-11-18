/**
 @module types/Command
 @description The Commands class
*/
import { Client, Message } from 'discord.js';
import Logger from '../Logger'

export interface CommandConfigOptions {
    usageIfNotSet?: boolean,
    hideFlags?: boolean
    hidden?: boolean,
    guildOnly?: boolean
}
export interface CommandHelpOptions {
    name: string | string[],
    description: string,
    usage?: string,
    examples?: string | string[],
    fields?: any,
    flags?: CommandFlagOptions
}
export interface CommandFlagOptions {
    [key: string]: CommandFlag;
}
export interface CommandFlag {
    aliases?: string[],
    description?: string
    type: FlagType
    default?: boolean | number | string
    allowedValues?: string[] | number[] //TODO: implement in Message.ts
}
export enum FlagType {
    Boolean,
    Number,
    String
}
export interface FlagList {
    [flag: string]: boolean | number | string;
}
/**
 * @property {Client} client Discord.js client
 * @property {Logger} logger Logger for class
 */
export default abstract class Command {
    protected client: Client;
    protected logger: Logger;
    
    /**
     * Create a new command 
     *
     * @param {Client} client The current discord.js client
     * @param {Logger} logger A logger for the class to use
     */
    constructor(client: Client, logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    /**
     * Fired everytime the bot prefix and command name/aliases are used.
     *
     * @param {string} msg The raw discord.js message
     * @param {string[]} args Any arguments (the message content split by spaces)
     * @param {FlagList} flags Any flags set in a key-value pair
     */
    abstract run(msg: Message, args: string[], flags: FlagList): void;

    /**
     * Sets any settings for the command
     *
     * @returns {CommandConfigOptions} Any settings
     */
    config(): CommandConfigOptions {
        return {
            usageIfNotSet: true,
        }
    }

    /**
     * Sets the meta information for the command
     *
     * @returns {CommandHelpOptions} All help options
     */
    abstract help(): CommandHelpOptions;


    /**
     * Called when the bot is shutting down.
     *
     * @param {boolean} [waitable] Can the bot wait for any cleanup, or is it shutting down right now. (Async or not)
     * @memberof Command
     */
    exit?(waitable?: boolean): void | Promise<any>;
}