/**
 @module types/Command
 @description The Commands class
*/
import Discord, { ApplicationCommandOptionChoice, AutocompleteInteraction, CommandInteraction, Snowflake } from 'discord.js';
import Logger from '../Logger.js'
import OptionResult from '../types/OptionResult.js';
import BaseCommand, { CommandConfig } from './BaseCommand.js'

import { SlashOption, ChannelType } from './SlashOptions.js' 

import { Client } from 'discord.js';

export { 
    OptionResult, 
    CommandInteraction, 
    Logger,
    Client,
    SlashOption,
    ChannelType,
}

export interface SlashCommandConfig extends CommandConfig {
    options?: SlashOption[],
}

export default abstract class SlashCommand extends BaseCommand {
    /**
     * Create a new command 
     */
    constructor(client: Discord.Client, logger: Logger) {
        super(client, logger)
    }

    onRegisteredGlobalSlash?(commandId: Snowflake): any | Promise<any>
    
    onRegisteredGuildSlash?(guild: Snowflake, commandId: Snowflake): any | Promise<any>

    /**
     * Called everytime a CommandInteraction is sent matching the defined name in slashConfig.
     * @note Will not be called if a provided subcommand has a handler function attached
     */
    abstract run(interaction: CommandInteraction, options?: OptionResult): any | Promise<any>


    /**
     * Called everytime a AutocompleteInteraction is sent matching the defined name in slashConfig.
     * @note Will not be called if a provided subcommand has an autocomplete handler function attached
     */
    onAutocomplete?(interaction: AutocompleteInteraction, focused: ApplicationCommandOptionChoice): any | Promise<any>

    /**
     * Sets the setup information for the slash command
     *
     * @returns {SlashCommandConfig} Slash command registeration data
     */
    abstract slashConfig(): SlashCommandConfig;
}