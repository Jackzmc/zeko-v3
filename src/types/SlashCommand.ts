/**
 @module types/Command
 @description The Commands class
*/
import Discord, { AutocompleteInteraction, CommandInteraction, Snowflake } from 'discord.js';
import Logger from '../Logger.js'
import OptionResult from '../types/OptionResult.js';

import { SlashCommandConfig, SlashOption, ChannelType, SlashHandlerFunction } from './SlashOptions.js' 

import { Client, ApplicationCommandOptionType, AutocompleteFocusedOption } from 'discord.js';
import Core from '../core/Core.js';

export { 
    OptionResult, 
    CommandInteraction, 
    Logger,
    Client,
    SlashCommandConfig,
    SlashOption,
    ChannelType
}

export default abstract class SlashCommand {
    protected client: Discord.Client;
    protected logger: Logger;
    protected core: Core;
    globalId?: Snowflake
    guildIds?: Record<Snowflake, Snowflake>
    
    /**
     * Create a new command 
     */
    constructor(client: Discord.Client, logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    onRegisteredGlobal?(commandId: Snowflake): any | Promise<any>
    
    onRegistered?(guild: Snowflake, commandId: Snowflake): any | Promise<any>

    /**
     * Called when everything is ready (discord.js ready and bot core is ready)
     */
    ready?(core?: Core): Promise<any> | any

    // Internal ready system, don't overwrite
    onReady(core: Core) {
        this.core = Core.getInstance()
        return this.ready ? this.ready(core) : null
    }

    /**
     * Called everytime a CommandInteraction is sent matching the defined name in slashConfig.
     * @note Will not be called if a provided subcommand has a handler function attached
     */
    abstract run(interaction: CommandInteraction, options?: OptionResult): any | Promise<any>


    /**
     * Called everytime a AutocompleteInteraction is sent matching the defined name in slashConfig.
     * @note Will not be called if a provided subcommand has an autocomplete handler function attached
     */
    onAutocomplete?(interaction: AutocompleteInteraction, focused: AutocompleteFocusedOption): any | Promise<any>

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