/**
 @module types/Command
 @description The Commands class
*/
import Discord, { CommandInteraction } from 'discord.js';
import Logger from '../Logger.js'
import OptionResult from '../types/OptionResult.js';

import { SlashCommandConfig, SlashOption } from './SlashOptions.js' 

import { Client } from 'discord.js'
import Core from '../core/Core.js';

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
    protected core: Core;
    
    /**
     * Create a new command 
     */
    constructor(client: Discord.Client, logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    // Called when everything is ready (discord.js ready and zeko core is ready)
    ready(): Promise<any> | any {

    }

    onReady() {
        this.core = Core.getInstance()
        return this.ready()
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
     * @returns {SlashCommandConfig} Slash command registeration data
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