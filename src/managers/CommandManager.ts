/**
 @namespace Managers
 @module CommandManager
*/
import Logger from '../Logger.js'
import { Client, Collection, ApplicationCommand, Snowflake } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import Command, { CommandConfigOptions, CommandHelpOptions, } from '../types/Command.js';
import SlashCommand from '../types/SlashCommand.js'
import { SlashCommandConfig, SlashOption } from '../types/SlashOptions.js' 
import Manager from './Manager.js';

//TODO: Add disabling/enabling commands, for types/Command: this.setFailstate() or smthn like that

/**
 * See {@link types/Command} for information of CommandConfigOptions and CommandHelpOptions
 * @typedef {Object} RegisteredCommand
 * @property {CommandConfigOptions} config - Command configuration object
 * @property {CommandHelpOptions} help- Command help object
 * @property {?string} group - The group the module belongs to
 * @property {boolean} isCore - Is the command a core command?
 * @property {string} name - The registered name of the command
 * @property {types/Command} command - The actual command class
 */

interface SlashCommandRegistry {
    group?: string
    isCore: boolean
    command: SlashCommand,
    data: SlashCommandConfig,
    guild: Snowflake
}
 
export interface RegisteredSlashCommand extends SlashCommandRegistry {
    slashCommand: ApplicationCommand
}

export interface PendingSlashCommand extends SlashCommandRegistry {
    builder: SlashCommandBuilder,
}

export interface RegisteredLegacyCommand {
    config: CommandConfigOptions
    help: CommandHelpOptions
    group?: string
    isCore: boolean
    name: string
    command: Command
}


export type RegisteredCommand = RegisteredSlashCommand | RegisteredLegacyCommand


export default class CommandManager extends Manager {
    /**
     * Create a new CommandManager
     *
     * @param {Client} client The current discord.js client
     */
    private static instance: CommandManager
    #commands: Collection<string, RegisteredLegacyCommand>
    #aliases: Collection<string, string>
    #slashCommands:  Collection<string, RegisteredSlashCommand>
    #pendingSlash: Record<string, PendingSlashCommand>
    #groups: string[]
    constructor(client: Client) {
        super(client, 'CommandManager')
        this.#commands = new Collection();
        this.#slashCommands = new Collection()
        this.#pendingSlash = {}
        this.#aliases = new Collection();
        this.#groups = [];
        
        CommandManager.instance = this;
    }

    /**
     * Acquire the current instance
     *
     * @static
     * @returns {CommandManager} The current instance
     */
     static getInstance() : CommandManager {
        return this.instance;
    }

    async register(commandClass: any, filename: string, group: string = "default", isCore: boolean): Promise<RegisteredLegacyCommand | PendingSlashCommand> {
        if(!commandClass.default || typeof commandClass.default !== "function") {
            throw new Error('Invalid commandClass: must be a class.')
        }else if(commandClass.default !instanceof Command) {
            throw new Error('commandClass must contain a default Command class.')
        }
        const command: (Command|SlashCommand) = new commandClass.default(this.client, new Logger(`cmd/${filename}`))
        // No clue why the other way around doesn't work (SlashCommand vs. Command)
        if(command instanceof Command) {
            return this.registerLegacyCommand(commandClass, filename, group, isCore)
        } else {
            return this.registerSlashCommand(command, isCore, group)
        }
    }

    /**
     * Registers a command with the CommandManager
     *
     * @param {any} commandClass The display name of the command. Also used as ID
     * @param {string} filename
     * @param {string} [group="default"] The command's group or null/default for misc
     * @param {boolean} isCore Is the plugin a core plugin? 
     * @returns {Promise<RegisteredCommand}
     */
    async registerLegacyCommand(commandClass: any, filename: string, group: string = "default", isCore: boolean): Promise<RegisteredLegacyCommand> {
        if(!commandClass.default || typeof commandClass.default !== "function") {
            throw new Error('Invalid commandClass: must be a class.')
        }else if(commandClass.default !instanceof Command) {
            throw new Error('commandClass must contain a default Command class.')
        }
        try {
            const command: Command = new commandClass.default(this.client, new Logger(`cmd/${filename}`))
            const help = command.help();
            const config = command.config ? command.config() : {}

            const cmdName = (Array.isArray(help.name) && help.name.length > 0 ? help.name.shift() : help.name as string).toLowerCase()
            if(!cmdName) throw new Error('Name field is empty or is an empty array.')

            delete command.help;
            delete command.config;

            const registeredCommand: RegisteredLegacyCommand = {
                help,
                group,
                isCore,
                config,
                command,
                name: cmdName
            }
            this.#commands.set(cmdName.toLowerCase(), registeredCommand);
            if(Array.isArray(help.name) && help.name.length > 0) {
                help.name.forEach(alias => {
                    this.#aliases.set(alias.toLowerCase(), cmdName.toLowerCase())
                })
            }
            //Add to list of groups.
            if(group !== "default" && !this.#groups.includes(group)) {
                this.#groups.push(group)
            }
            return registeredCommand;
        } catch(err) {
            throw err
        }
    }

        /**
     * Registers a command with the CommandManager
     *
     * @param {any} commandClass The display name of the command. Also used as ID
     * @param {string} filename
     * @param {string} [group="default"] The command's group or null/default for misc
     * @param {boolean} isCore Is the plugin a core plugin? 
     * @returns {Promise<RegisteredCommand}
     */
    async registerSlashCommand(command: SlashCommand, isCore: boolean, group: string = "default"): Promise<PendingSlashCommand> {
        try {
            let data = command.slashConfig()
            data.name = data.name.toLowerCase()
            // Overwrite any previousc ommands, such that a custom can overwrite a core command
            delete this.#pendingSlash[data.name]

            let builder: SlashCommandBuilder
            try {
                builder = new SlashCommandBuilder()
                    .setName(data.name)
                    .setDescription(data.description)
                if(data.options) {
                    for(const option of data.options) {
                        builder = this.addSlashOption(builder, option)
                    }
                }
            } catch(err) {
                this.logger.error(`Registering slash command "${data.name}" failed during meta processing: `, err)
                return null
            }
            const pendingCommand: PendingSlashCommand = {
                group,
                isCore,
                command,
                data,
                builder,
                guild: process.env.DISCORD_FORCE_SLASH_GUILD || data.guild
            }

            this.#pendingSlash[data.name] = pendingCommand
            //Add to list of groups.
            if(group !== "default" && !this.#groups.includes(group)) {
                this.#groups.push(group)
            }
            return pendingCommand;
        } catch(err) {
            throw err
        }
    }


    async unregister(command: string): Promise<boolean> {
        const query = command.replace(/.js$/, '');
        const cmd = this.#commands.get(query);
        if(cmd) {
            await cmd.command.exit(true);
            return this.#commands.delete(query);
        }else{
            return false;
        }
    }



    /**
     * Get a command by the name
     *
     * @param {string} name The id/name of the command (one provided in RegisterCommand)
     * @param {boolean} [includeHidden=false] Should hidden commands (cmd.config.hidden) be provided?
     * @returns {?RegisteredCommand}
     */
    getLegacyCommand(name: string, includeHidden:boolean = false) : RegisteredLegacyCommand {
        const command = this.#commands.get(name);
        if(!command) {
            const alias = this.#aliases.get(name);
            if(alias) {
                const command = this.#commands.get(alias)
                if(command && (includeHidden || !command.config.hidden)) {
                    return command
                }else {
                    return null;
                }
            }else{
                return null;
            }
        }else{
            return (!includeHidden && command.config.hidden) ? null : command;
        }
    }

    getCommand(name: string) : RegisteredLegacyCommand | RegisteredSlashCommand | PendingSlashCommand {
        return this.getCommand(name) || this.getSlashCommand(name, true)
    }

    /**
     * Get a collection of commands
     *
     * @param {boolean} includeHidden Should hidden commands be provided?
     * @returns {RegisteredCommand} 
     */
    getCommandsGrouped(includeHidden?: boolean, onlyKeys?: boolean): { [group: string]: RegisteredLegacyCommand[] | string[] } {
        let object = {}
        this.#commands.forEach((cmd,key) => {
            const group = cmd.isCore ? 'core' : ((cmd.group === "default") ? 'misc' : cmd.group);

            if(!object[group]) object[group] = []
            if(includeHidden || (cmd.config && !cmd.config.hidden)) object[group].push(onlyKeys ? key : cmd);
        })
        return object;
    }
    getCommands(includeHidden?: boolean) : Collection<string, RegisteredLegacyCommand> {
        return includeHidden ? this.#commands.filter(v => !v.config.hidden) : this.#commands
    }

    /**
     * Get the the total number of commands registered
     *
     * @readonly
     */
    get commandsCount() : number {
        return this.#commands.size;
    }
    /**
     * Get the the total number of aliases registered
     *
     * @readonly
     */
    get aliasesCount() : number {
        return this.#aliases.size;
    }
    /**
     * Get the list of groups
     *
     * @returns {string[]} List of group names
     */
    getGroups() : string[] {
        return this.#groups
    }

    exit(waitable: boolean): Promise<void[]>  {
        const promises = [];
        this.#commands.forEach(command => {
            if(command.command.exit && typeof command.command.exit === "function") {
                if(waitable) {
                    promises.push(Promise.resolve(command.command.exit(waitable)))
                }else{
                    command.command.exit(waitable)
                }
            }
        })
        return Promise.all(promises)
    }

    private addSlashOption(builder: SlashCommandBuilder, data: SlashOption) {
        function setData(option) {
            option = option.setName(data.name).setDescription(data.description)
            if('choices' in data) {
                if(Array.isArray(data.choices)) {
                    for(const name of data.choices) {
                        option.addChoice(name, name)
                    }
                } else {
                    for(const name in data.choices) {
                        option.addChoice(name, data.choices[name])
                    }
                }
            }
            return option
        }
        switch(data.type) {
            case "BOOLEAN":
                builder.addBooleanOption(setData)
                break
            case "STRING":
                builder.addStringOption(setData)
                break
            case "INTEGER":
                builder.addIntegerOption(setData)
                break
            case "USER":
                builder.addUserOption(setData)
                break
            case "CHANNEL":
                builder.addChannelOption(setData)
                break
            case "NUMBER":
                builder.addNumberOption(setData)
                break
            case "NUMBER":
                builder.addNumberOption(setData)
                break
            case "ROLE":
                builder.addRoleOption(setData)
                break
            case "MENTIONABLE":
                builder.addMentionableOption(setData)
                break    
            case "SUB_COMMAND":
                builder.addSubcommand(setData)
                break    
        }
        return builder
    }

    public async ready() {
        await this.registerPending()
        this.passReady()
    }

    private async registerPending() {
        if(process.env.DISCORD_CLEAR_SLASH_GLOBAL) {
            this.logger.debug(`DISCORD_CLEAR_SLASH_GLOBAL: Clearing all global commands`)
            await this.client.application.commands.set([])
        }
        if(process.env.DISCORD_CLEAR_SLASH_GUILD) {
            this.logger.debug(`DISCORD_CLEAR_SLASH_GUILD: Clearing commands for ${process.env.DISCORD_CLEAR_SLASH_GUILD}`)
            await this.client.application.commands.set([], process.env.DISCORD_FORCE_SLASH_GUILD)
        }
        if(process.env.DISCORD_FORCE_SLASH_GUILD)
            this.logger.debug(`DISCORD_FORCE_SLASH_GUILD was set, using forced-guild ID ${process.env.DISCORD_FORCE_SLASH_GUILD}`)

        for(const slash of Object.values(this.#pendingSlash)) {
            const cmd = await this.client.application.commands.create(slash.builder.toJSON(), slash.guild)
            const registeredCommand: RegisteredSlashCommand = {
                ...slash,
                slashCommand: cmd
            }
            if(process.env.DEBUG_SLASH_REGISTER) {
                this.logger.debug(`Registered /${slash.data.name} with ${slash.data.options?.length} options. guild=${slash.guild}`)
            }
            this.#slashCommands.set(slash.data.name.toLowerCase(), registeredCommand)
        }
    }

    private passReady() {
        for(const registered of this.#slashCommands.values()) {
            registered.command.onReady()
        }
        for(const registered of this.#commands.values()) {
            registered.command.onReady()
        }
    }

    getSlashCommand(name: string, fetchPending: boolean = false): RegisteredSlashCommand | PendingSlashCommand | null {
        const cmd = this.#slashCommands.get(name.toLowerCase())
        if(!cmd && fetchPending) return this.#pendingSlash[name.toLowerCase()]
        return cmd
    }
}

interface SavedSlashCommandData {
    id: Snowflake,
    data: any
}