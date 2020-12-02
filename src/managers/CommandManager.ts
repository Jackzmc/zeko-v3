/**
 @namespace Managers
 @module CommandManager
*/
import path from 'path'
import Logger from '../Logger.js'
import { Client, Collection } from 'discord.js';
import Command, { CommandConfigOptions, CommandHelpOptions } from '../types/Command.js';

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
 
export interface RegisteredCommand {
    config: CommandConfigOptions
    help: CommandHelpOptions
    group?: string
    isCore: boolean
    name: string
    command: Command
}

export default class CommandManager {
    /**
     * Create a new CommandManager
     *
     * @param {Client} client The current discord.js client
     */
    #commands: Collection<string, RegisteredCommand>
    #aliases: Collection<string, string>
    #groups: string[]
    #client: Client
    #logger: Logger
    constructor(client: Client) {
        this.#commands = new Collection();
        this.#aliases = new Collection();
        this.#groups = [];
        
        this.#client = client;
        this.#logger = new Logger('CommandManager');
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

    /**
     * Registers a command with the CommandManager
     *
     * @param {any} commandClass The display name of the command. Also used as ID
     * @param {string} filename
     * @param {string} [group="default"] The command's group or null/default for misc
     * @param {boolean} isCore Is the plugin a core plugin? 
     * @returns {Promise<RegisteredCommand}
     */
    async register(commandClass: any, filename: string, group: string = "default", isCore: boolean): Promise<RegisteredCommand> {
        if(!commandClass.default || typeof commandClass.default !== "function") {
            throw new Error('Invalid moduleClass: must be a class.')
        }else if(commandClass.default !instanceof Command) {
            throw new Error('commandClass must contain a default Command class.')
        }
        const command: Command = new commandClass.default(this.#client, new Logger(`cmd/${filename}`))
        const help = command.help();
        const config = command.config ? command.config() : {}

        const cmdName = (Array.isArray(help.name) ? help.name.shift() : help.name).toLowerCase()
        if(!cmdName) throw new Error('Name field is empty or is an empty array.')

        delete command.help;
        delete command.config;

        const registeredCommand: RegisteredCommand = {
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
    getCommand(name: string, includeHidden:boolean = false) : RegisteredCommand {
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
    getCommandsGrouped(includeHidden?: boolean, onlyKeys?: boolean): { [group: string]: RegisteredCommand[] | string[] } {
        let object = {}
        this.#commands.forEach((cmd,key) => {
            const group = cmd.isCore ? 'core' : ((cmd.group === "default") ? 'misc' : cmd.group);

            if(!object[group]) object[group] = []
            if(includeHidden || !cmd.config.hidden) object[group].push(onlyKeys ? key : cmd);
        })
        return object;
    }
    getCommands(includeHidden?: boolean) : Collection<string, RegisteredCommand> {
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
}