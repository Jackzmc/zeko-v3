/**
 @module types/Command
 @description The Commands class
*/
import Discord, { CommandInteraction } from 'discord.js';
import Logger from '../Logger.js'
import OptionResult from '../types/OptionResult.js';

import { SlashCommandConfig, SlashOption } from './SlashOptions.js' 
import SlashCommand, {} from './SlashCommand.js'

import { Client, Snowflake } from 'discord.js'
import { FlagList, CommandFlagOptions, FlagType, CommandFlag } from './Command.js';
import { SlashStringOption, SlashBooleanOption, SlashNumberOption } from 'SlashOptions';

export { 
    OptionResult, 
    CommandInteraction, 
    Logger,
    Client,
    SlashCommandConfig,
    SlashOption
}

export interface TraditionalConfig {
    name: string,
    description: string,
    usage?: string,
    showUsageIfNoArgs?: boolean
    guildOnly?: boolean
    guild?: Snowflake
}

export default abstract class SlashTraditionalCommand extends SlashCommand {
    public client: Client;
    public logger: Logger;
    private sConfig: TraditionalConfig
    
    /**
     * Create a new command 
     *
     * @param {Client} client The current discord.js client
     * @param {Logger} logger A logger for the class to use
     */
    constructor(client: Client, logger: Logger) {
        super(client, logger)
    }

    run(interaction: Discord.CommandInteraction, options: any) {
        const args = options.has("args") ? options.getString("args").split(/\s/) : null
        if(!args && this.sConfig.showUsageIfNoArgs) {
            const usage = this.sConfig.usage ? `\n**Usage:** \`${this.sConfig.usage}\`` : ''
            return interaction.reply({
                embeds: [
                    {
                        title: `/${this.sConfig.name}`,
                        description: `${this.sConfig.description}${usage}`   
                    }
                ]
            })
        }
        if(this.sConfig.guildOnly && !interaction.inGuild) {
            return interaction.reply({
                embeds: [
                    {
                        title: `/${this.sConfig.name}`,
                        description: `This command can only be used in a server.`
                    }
                ]
            })
        }

        // Grab all options excluding internal args
        let flags: FlagList = {}
        for(const [key, value] of options) {
            if(key === "args") continue
            flags[key] = value
        }

        try {
            Promise.resolve(this.execute(interaction, args, flags))
        } catch(err) {
            this.logger.error(`Command ${this.sConfig.name} returned error: `, err)
            const method = interaction.replied ? 'editReply' : 'reply'
            interaction[method]({
                embeds: [
                    {
                        title: `/${this.sConfig.name}`,
                        description: `Something went wrong. Please try again later.`
                    }
                ]
            })
        }
    }

    /**
     * Fired everytime a slash command is used
     */
    abstract execute(interaction: Discord.CommandInteraction, args: string[], flags?: FlagList): void;

    /**
     * Add any flags to be added
     */
    flags(): CommandFlagOptions {
        return {}
    }

    /**
     * Sets the information for the command
     */
    abstract config(): TraditionalConfig;

    slashConfig(): SlashCommandConfig {
        this.sConfig = this.config()
        const flagKV = this.flags ? this.flags() : {}
        const flags: (SlashStringOption | SlashBooleanOption | SlashNumberOption)[] = []
        for(const key in flagKV) {
            flags.push(this.convertFlagToOption(key, flagKV[key]))
        }
        return {
            name: this.sConfig.name,
            description: this.sConfig.description,
            guild: this.sConfig.guild,
            options: [
                {
                    name: "args",
                    description: "The arguments to pass to the command",
                    type: "STRING",
                    required: false
                },
                ...flags
            ]
        }
    }


    private convertFlagToOption(key: string, flag: CommandFlag) : SlashStringOption | SlashBooleanOption | SlashNumberOption {
        let obj: Partial<SlashStringOption | SlashBooleanOption | SlashNumberOption> = {
            name: key,
            description: flag.description,
            required: false,
        }
        switch(flag.type) {
            case FlagType.Boolean:
                obj.type = "BOOLEAN"
                return obj as SlashBooleanOption
            case FlagType.Number:
                obj.type = "NUMBER"
                return obj as SlashNumberOption
            default:
                obj.type = "STRING"
                return obj as SlashStringOption
        }
    }
    /**
     * Called when the bot is shutting down or the command is being unloaded
     *
     * @param {boolean} [waitable] Can the bot wait for any cleanup, or is it shutting down right now. (Async or not)
     * @memberof Command
     */
    exit?(waitable?: boolean): void | Promise<any>;
}