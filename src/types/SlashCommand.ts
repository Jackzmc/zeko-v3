/**
 @module types/Command
 @description The Commands class
*/
import Discord, { CommandInteraction } from 'discord.js';
import Logger from '../Logger.js'
import OptionResult from '../types/OptionResult.js';

export interface SlashCommandOption {
    name: string,
    description?: string,
    guild?: Discord.Snowflake
    options?: SlashCommandSubOption[],
}

export interface SlashCommandSubOption {
    name: string,
    type: Discord.ApplicationCommandOptionType,
    required: boolean
    description?: string,
    options?: SlashCommandOption[],
    choices?: Record<string, string>,
    default?: any
}
import { Client } from 'discord.js'

export { 
    OptionResult, 
    CommandInteraction, 
    Logger,
    Client
}

export default abstract class SlashCommand {
    protected client: Discord.Client;
    protected logger: Logger;
    
    /**
     * Create a new command 
     */
    constructor(client: Discord.Client, logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    /**
     * Fired everytime a slash command is used
     *
     * @param {string} msg The raw discord.js message
     * @param {string[]} args Any arguments (the message content split by spaces)
     */
    abstract run(interaction: Discord.CommandInteraction, options?: OptionResult): void;

    /**
     * Sets the setup information for the slash command
     *
     * @returns {SlashCommandOption} Slash command registeration data
     */
    abstract slashConfig(): SlashCommandOption;


    /**
     * Called when the bot is shutting down or the command is being unloaded
     *
     * @param {boolean} [waitable] Can the bot wait for any cleanup, or is it shutting down right now. (Async or not)
     * @memberof Command
     */
    exit?(waitable?: boolean): void | Promise<any>;
}