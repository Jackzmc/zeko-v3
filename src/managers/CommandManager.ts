/**
 @namespace Managers
 @module CommandManager
*/
import Logger from '../Logger.js'
import { Client, Collection, Snowflake } from 'discord.js';
import { SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandUserOption } from '@discordjs/builders';
import Command, { CommandConfigOptions, CommandHelpOptions, } from '../types/TraditionalCommand.js';
import jsum from 'jsum'
import SlashCommand from '../types/SlashCommand.js'
import { SlashAutocomplete, SlashAutocompleteHandlerFunction, SlashCommandConfig, SlashOption, SlashSubCommandGroupOption, SlashSubCommandOption, SlashSubOption } from '../types/SlashOptions.js' 
import Manager from './Manager.js';
import Core from '../core/Core.js';
import { SlashHandlerFunction, SlashChoicesOption } from 'SlashOptions';
import { DiscordAPIError } from '@discordjs/rest';

//TODO: Add disabling/enabling commands, for types/Command: this.setFailstate() or smthn like that (issue #6)
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

interface SlashHandlers {
    default: Record<string, SlashHandlerFunction>,
    autocomplete: Record<string, SlashAutocompleteHandlerFunction>
}

interface SlashCommandRegistry {
    group?: string
    isCore: boolean
    command: SlashCommand,
    data: SlashCommandConfig,
    guilds: Snowflake[],
    handlers?: SlashHandlers
}
 
export interface RegisteredGlobalSlashCommand extends SlashCommandRegistry {
    globalCommandId: Snowflake  
}

export interface RegisteredGuildsSlashCommand extends SlashCommandRegistry {
    guildCommandsIds: Record<Snowflake, Snowflake>, //guildID: CommandID
}

export type RegisteredSlashCommand = RegisteredGlobalSlashCommand | RegisteredGuildsSlashCommand

export interface PendingSlashCommand extends SlashCommandRegistry {
    builder: SlashCommandBuilder,
}

export interface RegisteredTraditionalCommand {
    config: CommandConfigOptions
    help: CommandHelpOptions
    group?: string
    isCore: boolean
    name: string
    command: Command
}


export type RegisteredCommand = RegisteredSlashCommand | RegisteredTraditionalCommand
export type SlashCommandOption = SlashCommandBooleanOption | SlashCommandIntegerOption | SlashCommandStringOption | SlashCommandRoleOption | SlashCommandUserOption | SlashCommandNumberOption | SlashCommandChannelOption | SlashCommandMentionableOption | SlashCommandSubcommandBuilder


export default class CommandManager extends Manager {
    /**
     * Create a new CommandManager
     *
     * @param {Client} client The current discord.js client
     */
    private static instance: CommandManager
    private commands: Collection<string, RegisteredTraditionalCommand>
    private aliases: Collection<string, string>
    private slashCommands:  Collection<string, RegisteredSlashCommand>
    private pendingSlash: Record<string, PendingSlashCommand>
    private groups: string[]
    private firstRegisterDone = false
    private core: Core

    constructor(client: Client) {
        super(client, 'CommandManager')
        this.commands = new Collection();
        this.slashCommands = new Collection()
        this.pendingSlash = {}
        this.aliases = new Collection();
        this.groups = [];
        
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

    async register(commandClass: any, filename: string, group: string = "default", isCore: boolean): Promise<RegisteredTraditionalCommand | PendingSlashCommand> {
        if(!commandClass.default || typeof commandClass.default !== "function") {
            throw new Error('Invalid commandClass: must be a class.')
        }else if(commandClass.default !instanceof Command) {
            throw new Error('commandClass must contain a default Command class.')
        }
        const command: (Command|SlashCommand) = new commandClass.default(this.client, new Logger(`cmd/${filename}`))
        // No clue why the other way around doesn't work (SlashCommand vs. Command)
        if(command instanceof Command) {
            return this.registerTraditionalCommand(commandClass, filename, group, isCore)
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
    async registerTraditionalCommand(commandClass: any, filename: string, group: string = "default", isCore: boolean): Promise<RegisteredTraditionalCommand> {
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

            const registeredCommand: RegisteredTraditionalCommand = {
                help,
                group,
                isCore,
                config,
                command,
                name: cmdName
            }
            this.commands.set(cmdName.toLowerCase(), registeredCommand);
            if(Array.isArray(help.name) && help.name.length > 0) {
                help.name.forEach(alias => {
                    this.aliases.set(alias.toLowerCase(), cmdName.toLowerCase())
                })
            }
            //Add to list of groups.
            if(group !== "default" && !this.groups.includes(group)) {
                this.groups.push(group)
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
            delete this.pendingSlash[data.name]
            const handlers: SlashHandlers = {
                default: {},
                autocomplete: {}
            }

            let builder: SlashCommandBuilder
            try {
                builder = new SlashCommandBuilder()
                    .setName(data.name)
                    .setDescription(data.description)
                
                if(data.defaultPermissions)
                   builder.setDefaultPermission(data.defaultPermissions === "ALL")

                const parseOption = (option: SlashSubCommandGroupOption | SlashSubOption) => {
                    if(option.type !== "SUB_COMMAND_GROUP" && "autocomplete" in option) {
                        const { autocomplete, name } = (option as SlashAutocomplete)
                        this.logger.debug(name, 'autocomplete', autocomplete)
                        if(typeof autocomplete === "function")
                            handlers.autocomplete[name] = autocomplete.bind(command)
                    }
                }
                
                if(data.options) {
                    for(const option of data.options) {
                        if(option.type === "SUB_COMMAND") {
                            if(option.handler) {
                                handlers.default[option.name] = option.handler.bind(command)
                            }
                            if(option.options)
                                for(const subOption of option.options) {
                                    parseOption(subOption)
                                }
                        } else {
                            parseOption(option)
                        }
                        builder = this.addSlashOption<SlashCommandBuilder>(builder, option)
                    }
                }

                if(!command.onAutocomplete && process.env.NODE_ENV !== "production" && Object.keys(handlers.autocomplete).length > 0) this.logger.warn(`${data.name}: No fallback autocomplete handler 'onAutocomplete'`)

            } catch(err) {
                this.logger.error(`Registering slash command "${data.name}" failed during meta processing: `, err)
                return null
            }

            const guilds = data.guilds || []
            if(process.env.DISCORD_FORCE_SLASH_GUILD && !guilds.includes(process.env.DISCORD_FORCE_SLASH_GUILD))
                guilds.push(process.env.DISCORD_FORCE_SLASH_GUILD)

            const pendingCommand: PendingSlashCommand = {
                group,
                isCore,
                command,
                data,
                builder,
                guilds,
                handlers
            }

            this.pendingSlash[data.name] = pendingCommand
            //Add to list of groups.
            if(group !== "default" && !this.groups.includes(group)) {
                this.groups.push(group)
            }

            //TODO: Use refactored internal register-logic
            if(this.areCommandsReady) {
                this.registerAllPendingSlash()
            }
            return pendingCommand;
        } catch(err) {
            throw err
        }
    }


    async unregisterTraditional(command: string){
        const query = command.replace(/.js$/, '');
        const cmd = this.commands.get(query);
        if(cmd) {
            if(cmd.command.exit)
                await cmd.command.exit(true)
            return this.commands.delete(query);
        }else{
            return false;
        }
    }

    async unregisterSlash(command: string) {
        const query = command.replace(/.js$/, '');
        const cmd = this.getSlashCommand(query, false)
        if(cmd) {
            if(cmd.command.exit)
                await cmd.command.exit(true)
            this.slashCommands.delete(cmd.data.name)
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
    getTraditionalCommand(name: string, includeHidden:boolean = false) : RegisteredTraditionalCommand {
        const command = this.commands.get(name);
        if(!command) {
            const alias = this.aliases.get(name);
            if(alias) {
                const command = this.commands.get(alias)
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

    getCommand(name: string) : RegisteredTraditionalCommand | RegisteredSlashCommand | PendingSlashCommand {
        return this.getSlashCommand(name, true) || this.getTraditionalCommand(name)
    }

    /**
     * Get a collection of commands
     *
     * @param {boolean} includeHidden Should hidden commands be provided?
     * @returns {RegisteredCommand} 
     */
    getTraditionalCommandsGrouped(includeHidden?: boolean, onlyKeys?: boolean): { [group: string]: RegisteredTraditionalCommand[] | string[] } {
        let object = {}
        this.commands.forEach((cmd,key) => {
            const group = cmd.isCore ? 'core' : ((cmd.group === "default") ? 'misc' : cmd.group);

            if(!object[group]) object[group] = []
            if(includeHidden || (cmd.config && !cmd.config.hidden)) object[group].push(onlyKeys ? key : cmd);
        })
        return object;
    }
    getTraditionalCommands(includeHidden?: boolean) : Collection<string, RegisteredTraditionalCommand> {
        return includeHidden ? this.commands.filter(v => !v.config.hidden) : this.commands
    }

    /**
     * Get the the total number of commands registered
     *
     * @readonly
     */
    get commandsCount() : number {
        return this.commands.size;
    }

    get slashCommandCount() {
        return this.slashCommands.size
    }

    get slashCommandTotalCount() {
        return this.slashCommands.size + Object.keys(this.pendingSlash).length
    }
    /**
     * Get the the total number of aliases registered
     *
     * @readonly
     */
    get aliasesCount() : number {
        return this.aliases.size;
    }
    /**
     * Get the list of groups
     *
     * @returns {string[]} List of group names
     */
    getGroups() : string[] {
        return this.groups
    }

    exit(waitable: boolean): Promise<void[]>  {
        const promises = [];
        this.commands.forEach(command => {
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

    private addSlashOption<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder>(builder: T, data: SlashOption): T {
        function setData(option) {
            option = option.setName(data.name).setDescription(data.description)
            if('required' in data)
                option = option.setRequired(data.required)
            if('choices' in data) {
                if(Array.isArray(data.choices)) {
                    for(const name of data.choices) {
                        option = option.addChoice(name, name)
                    }
                } else {
                    for(const name in data.choices) {
                        option = option.addChoice(name, data.choices[name])
                    }
                }
            }
            return option
        }

        const a = new SlashCommandBuilder()
        switch(data.type) {
            case "BOOLEAN":
                builder.addBooleanOption(setData)
                break
            case "STRING":
                builder.addStringOption(option => setData(option.setAutocomplete(data.autocomplete !== null && data.autocomplete !== undefined)))
                break
            case "INTEGER":
                builder.addIntegerOption(option => setData(option.setAutocomplete(data.autocomplete !== null && data.autocomplete !== undefined)))
                break
            case "USER":
                builder.addUserOption(setData)
                break
            case "CHANNEL":
                builder.addChannelOption(opt => {
                    return setData(opt).addChannelTypes(data.channelTypes)
                })
                break
            case "NUMBER":
                builder.addNumberOption(option => setData(option.setAutocomplete(data.autocomplete !== null && data.autocomplete !== undefined)))
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
                if(builder instanceof SlashCommandBuilder) {
                    builder.addSubcommand(cmd => {
                        cmd = setData(cmd)
                        if(data.options) {
                            for(const option of data.options) {
                                cmd = this.addSlashOption<SlashCommandSubcommandBuilder>(cmd, option)
                            }
                        }
                        return cmd
                    })
                } else {
                    throw new Error("Subcommands can only be added to SlashCommandBuilder")
                }
                break    
            case "SUB_COMMAND_GROUP":
                if(builder instanceof SlashCommandBuilder) {
                    builder.addSubcommandGroup(setData)
                } else {
                    throw new Error("Subcommand groups can only be added to SlashCommandBuilder")
                }
                break    
        }
        return builder
    }

    public async _ready() {
        if(this.core) throw new Error("ready has already been called")
        this.core = Core.getInstance()
        await this.registerAllPendingSlash()
        for(const { command, data } of this.slashCommands.values()) {
            try {
                await command.onReady(this.core)
            } catch(err) {
                this.logger.error(`Slash Command \"${data.name}\" encountered an error on .ready(): `)
                throw err
            }
        }
        for(const { command, name } of this.commands.values()) {
            try {
                await command.onReady(this.core)
            } catch(err) {
                this.logger.error(`Traditional Command \"${name}\" encountered an error on .ready(): `)
                throw err
            }
        }
    }

    // TODO: Split registeration into own methods, direct calling
    // TODO: Optimize, still very slow even with cache
    async registerAllPendingSlash() {
        // TODO: Auto call register on register past areCommandsReady
        if(!this.core) throw Error('Not ready, areCommandsReady must be true before registering pending ')
        if(process.env.DISCORD_CLEAR_SLASH_GLOBAL) {
            this.logger.info(`DISCORD_CLEAR_SLASH_GLOBAL: Clearing all global commands`)
            await this.client.application.commands.set([])
        }
        if(process.env.DISCORD_CLEAR_SLASH_GUILD) {
            this.logger.info(`DISCORD_CLEAR_SLASH_GUILD: Clearing commands for ${process.env.DISCORD_CLEAR_SLASH_GUILD}`)
            await this.client.application.commands.set([], process.env.DISCORD_CLEAR_SLASH_GUILD)
        }
        if(process.env.DISCORD_FORCE_SLASH_GUILD)
            this.logger.info(`DISCORD_FORCE_SLASH_GUILD was set, adding guild ${process.env.DISCORD_FORCE_SLASH_GUILD}`)

        // Process all global commands at once. In future use .set()?
        const globalCommands: Promise<boolean>[] = []
        
        for(const slash of Object.values(this.pendingSlash)) {
            const name = slash.data.name.toLowerCase()
            const discordData = slash.builder.toJSON()
            // Jsum mutates all arrays, so a copy is to be made:
            const discordDataClone = JSON.parse(JSON.stringify(discordData))
            const checksum = jsum.digest(discordDataClone, 'SHA256', 'hex')
            const useChecksum = process.env.DISCORD_FORCE_SLASH_REGISTER === undefined && !slash.data.forceRegister
            if(!slash.guilds || slash.guilds.length === 0) {
                //Global command
                const storedCmd = await this.core.db.get<SavedSlashCommandData>(`commands.global.${name}`, null)
                if(process.env.DEBUG_SLASH_REGISTER == "2")
                    this.logger.log(`${name}: Checksum ${storedCmd.checksum} - New: ${checksum}`)
                if(useChecksum && storedCmd && checksum === storedCmd.checksum) {
                    // No need to re-register, skip
                    if(process.env.DEBUG_SLASH_REGISTER)
                        this.logger.info(`Skipping global /${slash.data.name}: Checksum same (${storedCmd.checksum})`)
                    const registeredCommand: RegisteredSlashCommand = {
                        ...slash,
                        globalCommandId: storedCmd.id
                    }
                    slash.command.globalId = storedCmd.id
                    if(slash.command.onRegisteredGlobal) slash.command.onRegisteredGlobal(storedCmd.id)
                    this.slashCommands.set(name, registeredCommand)
                    
                } else {
                    globalCommands.push(new Promise(async(resolve) => {
                        try {
                            const cmd = await this.client.application.commands.create(discordData)
                            const registeredCommand: RegisteredGlobalSlashCommand = {
                                ...slash,
                                globalCommandId: cmd.id
                            }
                            this.logger.log(`Registered new global /${slash.data.name} with ${slash.data.options?.length} options`)
                            
                            this.core.db.set(`commands.global.${name}`, {
                                checksum,
                                id: cmd.id
                            })
                            slash.command.globalId = cmd.id
                            if(slash.command.onRegisteredGlobal) slash.command.onRegisteredGlobal(cmd.id)
                            this.slashCommands.set(name, registeredCommand)
                        } catch(err) {
                            if(err instanceof DiscordAPIError && err.code === 50001) 
                                this.logger.error(`Missing permissions to register global /${name}`)
                            else
                                this.logger.severe(`Registering global /${name} failed:`, err)
                        }
                        resolve(true)
                    }))
                }
            } else {
                let guildCommands: Record<Snowflake, Snowflake> = {}
                for(const guildID of slash.guilds) {
                    const storedCmd = await this.core.db.get<SavedSlashCommandData>(`commands.guild.${guildID}.${name}`, null)
                    if(process.env.DEBUG_SLASH_REGISTER == "2")
                        this.logger.log(`${name}: Checksum ${storedCmd.checksum} - New: ${checksum}`)
                    if(useChecksum && storedCmd && storedCmd.checksum == checksum) {
                        guildCommands[guildID] = storedCmd.id
                        if(process.env.DEBUG_SLASH_REGISTER)
                            this.logger.info(`Skipping /${slash.data.name} on guild ${guildID}: Checksum same (${storedCmd.checksum})`)
                    } else {
                        try {
                            const cmd = await this.client.application.commands.create(discordData, guildID)
                            this.core.db.set(`commands.guild.${guildID}.${name}`, {
                                checksum,
                                id: cmd.id
                            })
                            guildCommands[guildID] = cmd.id
                            this.logger.log(`Registered new /${slash.data.name} with ${slash.data.options?.length} options on guild ${guildID}`)
                        } catch(err) {
                            if(err instanceof DiscordAPIError && err.code === 50001) 
                                this.logger.error(`Missing permissions to register /${name} for guild id ${guildID}`)
                            else
                                this.logger.severe(`Registering /${name} for guild id ${guildID} failed:`, err)
                        }
                    }
                    if(slash.command.onRegistered) slash.command.onRegistered(guildID, guildCommands[guildID])
                }
                slash.command.guildIds = guildCommands

                const registeredCommand: RegisteredGuildsSlashCommand = {
                    ...slash,
                    guildCommandsIds: guildCommands
                }

                
                this.slashCommands.set(name.toLowerCase(), registeredCommand)
            }
        }
        this.pendingSlash = {}
        await Promise.all(globalCommands)
        this.firstRegisterDone = true
    }

    get areCommandsReady() {
        return this.firstRegisterDone
    }

    getSlashCommand(name: string, fetchPending?: false): RegisteredSlashCommand
    getSlashCommand(name: string, fetchPending: true): RegisteredSlashCommand | PendingSlashCommand | null
    getSlashCommand(name: string, fetchPending: boolean = false): RegisteredSlashCommand | PendingSlashCommand | null {
        const cmd = this.slashCommands.get(name.toLowerCase())
        if(!cmd && fetchPending) return this.pendingSlash[name.toLowerCase()]
        return cmd
    }
}

interface SavedSlashCommandData {
    id: Snowflake,
    checksum: string
}