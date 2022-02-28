/**
 @module types/Command
 @description The Commands class
*/
import BaseCommand from './BaseCommand.js'
import { Message } from 'discord.js';
import Core from '../core/Core.js';

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
export default abstract class Command extends BaseCommand {
    _on_ready(core: Core) {
        this.core = Core.getInstance()
        return this.ready(core)
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
}