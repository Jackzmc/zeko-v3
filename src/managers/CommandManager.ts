/**
 @namespace Managers
 @module CommandManager
*/
import path from 'path'
import Logger from '../Logger.js'
import { Client, Collection, ApplicationCommand, Snowflake, ApplicationCommandOption } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import Command, { CommandConfigOptions, CommandHelpOptions, } from '../types/Command.js';
import SlashCommand, { SlashCommandOption, SlashCommandSubOption } from '../types/SlashCommand.js'
import Manager from './Manager.js';
import { mkdir, readFile, writeFile } from 'fs/promises'
import DataManager from './DataManager.js';
import deepEqual from 'deep-equal'

let instance;
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
 
export interface RegisteredSlashCommand {
    group?: string
    isCore: boolean
    command: SlashCommand,
    data: SlashCommandOption,
    slashCommand: ApplicationCommand
}

export interface PendingSlashCommand {
    group?: string
    isCore: boolean
    command: SlashCommand,
    data: SlashCommandOption,
    builder: SlashCommandBuilder,
    guild: Snowflake
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
    #commands: Collection<string, RegisteredLegacyCommand>
    #aliases: Collection<string, string>
    #slashCommands:  Collection<string, RegisteredSlashCommand>
    #pendingSlash: PendingSlashCommand[]
    #groups: string[]
    constructor(client: Client) {
        super(client, 'CommandManager')
        this.#commands = new Collection();
        this.#slashCommands = new Collection()
        this.#pendingSlash = []
        this.#aliases = new Collection();
        this.#groups = [];
        
        instance = this;
    }

    /**
     * Acquire the current instance
     *
     * @static
     * @returns {CommandManager} The current instance
     */
     static getInstance() : CommandManager {
        return instance;
    }

    async register(commandClass: any, filename: string, group: string = "default", isCore: boolean): Promise<RegisteredLegacyCommand | PendingSlashCommand> {
        if(!commandClass.default || typeof commandClass.default !== "function") {
            throw new Error('Invalid commandClass: must be a class.')
        }else if(commandClass.default !instanceof Command) {
            throw new Error('commandClass must contain a default Command class.')
        }
        const command: (Command|SlashCommand) = new commandClass.default(this.client, new Logger(`cmd/${filename}`))
        if('slashConfig' in command) {
            return this.registerSlashCommand(command, isCore, group)
        } else {
            return this.registerLegacy(commandClass, filename, group, isCore)
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
    async registerLegacy(commandClass: any, filename: string, group: string = "default", isCore: boolean): Promise<RegisteredLegacyCommand> {
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
            const data = command.slashConfig()

            let builder = new SlashCommandBuilder()
                .setName(data.name)
                .setDescription(data.description)
            for(const option of data.options) {
                builder = this.addSlashOption(builder, option)
            }
            const pendingCommand: PendingSlashCommand = {
                group,
                isCore,
                command,
                data,
                builder,
                guild: data.guild
            }

            this.#pendingSlash.push(pendingCommand)
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
    getCommand(name: string, includeHidden:boolean = false) : RegisteredLegacyCommand {
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

    private addSlashOption(builder: SlashCommandBuilder, data: SlashCommandSubOption) {
        function setData(option) {
            return option.setName(data.name).setDescription(data.description)
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

    async registerPending() {
        const slashReg = path.join(DataManager.getDataDirectory(), `slash-commands.json`)
        let data: Record<string, SavedSlashCommandData> = {};
        let newData: Record<string, SavedSlashCommandData> = {}
        // Grab slash commands 
        try {
            const raw = await readFile(slashReg, "utf8") //For some dumb reason, readFile from promises still error'd?
            data = JSON.parse(raw)
        } catch(err) { }

        for(const slash of this.#pendingSlash) {
            let cmd: ApplicationCommand;
            if(data[slash.data.name]) {
                const json = slash.builder.toJSON()
                if(deepEqual(json, data[slash.data.name].data)) {
                    cmd = await this.client.application.commands.fetch(data[slash.data.name].id, {
                        guildId: slash.guild
                    })
                    if(cmd) {
                        try {
                            // @ts-ignore
                            cmd = await cmd.edit(json)
                        } catch(err) {
                            this.logger.warn(`Could not update \"${slash.data.name}\": ${err.message}`)
                        }
                        newData[slash.data.name] = { 
                            id: cmd.id,
                            data: json
                        }
                    } else {
                        this.logger.warn(`Not registering command \"${slash.data.name}\", pre-existing command no longer exists.`)
                        continue
                    }
                }
                delete data[slash.data.name]
            } else {
                const json = slash.builder.toJSON()
                cmd = await this.client.application.commands.create(json, slash.guild)
                newData[slash.data.name] = { 
                    id: cmd.id,
                    data: json
                }
                this.logger.debug(`registered new command \"${slash.data.name}\"`)
            }

            const registeredCommand: RegisteredSlashCommand = {
                ...slash,
                slashCommand: cmd
            }
            this.#slashCommands.set(slash.data.name.toLowerCase(), registeredCommand)
        }

        for(const name in data) {
            await this.client.application.commands.delete(data[name].id)
            this.logger.debug(`Deleting slash command \"${name}\" (not defined)`)
        }
        // Save slash commands to edit them:
        try {
            await mkdir(DataManager.getDataDirectory()).catch(() => {})
            await writeFile(slashReg, JSON.stringify(newData))
        } catch(err) { 
            this.logger.warn(`Failed to write slash command id registry file (data/slash-commands.json): ${err}`)
        }
    }

    getSlashCommand(name: string, fetchPending: boolean = false): RegisteredSlashCommand | PendingSlashCommand | null {
        const cmd = this.#slashCommands.get(name.toLowerCase())
        if(!cmd && fetchPending) return this.#pendingSlash.find(v => v.data.name.toLowerCase() === name.toLowerCase())
        return cmd
    }
}

interface SavedSlashCommandData {
    id: Snowflake,
    data: any
}