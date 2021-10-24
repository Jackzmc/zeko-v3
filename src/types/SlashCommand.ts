/**
 @module types/Command
 @description The Commands class
*/
import Discord, { CommandInteraction } from 'discord.js';
import Logger from '../Logger.js'
import OptionResult from '../types/OptionResult.js';

import { SlashCommandConfig, SlashOption } from './SlashOptions.js' 

import { Client } from 'discord.js'

export { 
    OptionResult, 
    CommandInteraction, 
    Logger,
    Client,
    SlashCommandConfig,
    SlashOption
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
    abstract slashConfig(): SlashCommandConfig;


    /**
     * Called when the bot is shutting down or the command is being unloaded
     *
     * @param {boolean} [waitable] Can the bot wait for any cleanup, or is it shutting down right now. (Async or not)
     * @memberof Command
     */
    exit?(waitable?: boolean): void | Promise<any>;
}