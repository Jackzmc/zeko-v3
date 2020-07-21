/**
 @module managers/CommandManager
*/
import path from 'path'
import Logger from '../Logger.js'
import { Collection } from 'discord.js';

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

export default class {
    constructor(client) {
        this.commands = new Collection();
        this.aliases = new Collection();
        this.groups = [];
        
        this.client = client;
        this.logger = new Logger('CommandManager');
    }

    /**
     * Registers a command with the CommandManager
     *
     * @param {string} name The display name of the command. Also used as ID
     * @param {boolean} isCore Is the plugin a core plugin? 
     * @param {string} [group="default"] The command's group or null/default for misc
     * @returns {Promise}
     */
    registerCommand(name, isCore, group = "default") {
        const _this = this;
        return new Promise((resolve, reject) => {
            const root =  path.join(_this.client.ROOT_DIR, isCore?'src/commands':'commands')
            const filepath = group == "default" ? path.join(root, `${name}.js`) : path.join(root, `${group}/${name}.js`)

            import(`file://${filepath}`)
            .then(commandObject => {
                const command = new commandObject.default(this.client, new Logger(`cmd/${name}`))
                if(!command.help || !command.run || typeof command.run !== "function" || typeof command.help !== "function") {
                    return reject(new Error("Invalid Command class: Missing valid 'run' or 'help' method"))
                }

                const help = command.help();
                const config = command.config ? command.config() : {}

                const cmdName = Array.isArray(help.name) ? help.name.shift() : help.name
                if(!cmdName) return reject(new Error('Name field is empty or is an empty array.'))

                delete command.help;
                delete command.config;
                const registeredCommand = {
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
                if(group.trim().length > 0 && group !== "default" && !this.groups.includes(group)) {
                    this.groups.push(group)
                }
                resolve()
            
            })
            .catch(err => reject(err))
        })
    }

    /**
     * Get a command by the name
     *
     * @param {string} name The id/name of the command (one provided in RegisterCommand)
     * @param {boolean} [includeHidden=false] Should hidden commands (cmd.config.hidden) be provided?
     * @returns {?RegisteredCommand}
     */
    getCommand(name, includeHidden = false) {
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

    /**
     * Get a collection of commands
     *
     * @param {boolean} grouped Should they be put in a object by group name?
     * @param {boolean} includeHidden Should hidden commands be provided?
     * @param {boolean} onlyKeys True: Only provide keynames. False: Provide CommandContainer
     * @returns {RegisteredCommand} 
     */
    getCommands(grouped, includeHidden, onlyKeys) {
        if(grouped) {
            let object = {}
            this.commands.forEach((cmd,key) => {
                const group = cmd.isCore ? 'core' : ((group === "default") ? 'misc' : cmd.group);

                if(!object[group]) object[group] = []
                if(includeHidden || !cmd.config.hidden) object[group].push(onlyKeys?key:cmd);
            })
            return object;
        }else{
            return includeHidden ? this.commands.filter(v => !v.config.hidden) : this.commands
        }
    }

    /**
     * Get the the total number of commands registered
     *
     * @readonly
     */
    get commandsCount() {
        return this.commands.size;
    }
    /**
     * Get the the total number of aliases registered
     *
     * @readonly
     */
    get aliasesCount() {
        return this.aliases.size;
    }
    /**
     * Get the list of groups
     *
     * @returns {string[]} List of group names
     */
    getGroups() {
        return this.groups
    }

}