/**
 @module core:managers/CommandManager
*/
import path from 'path'
import Logger from '../Logger.js'
import { Collection } from 'discord.js';
let logger;

export default class {
    constructor(client) {
        this.commands = new Collection();
        this.aliases = new Collection();
        this.groups = [];
        this.client = client;
        logger = new Logger('EventManager');
    }

    /**
     * Registers a command with the CommandManager
     *
     * @param {string} name The display name of the command. Also used as ID
     * @param {boolean} isCore Is the plugin a core plugin? 
     * @param {string} [group="default"] The command's group or null/default for misc
     * @returns Promise<>
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
                this.commands.set(cmdName, registeredCommand);
                if(Array.isArray(help.name) && help.name.length > 0) {
                    help.name.forEach(alias => {
                        this.aliases.set(alias, cmdName)
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
     * @param {boolean} includeHidden Should hidden commands (cmd.config.hidden) be provided?
     * @returns CommandContainer
     */
    getCommand(name, includeHidden) {
        const command = this.commands.get(name);
        if(!command) {
            const alias = this.aliases.get(name);
            if(alias) {
                return (!includeHidden && command.config.hidden) ? null : this.commands.get(alias)
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
     * @returns CommandContainer or Object<Groupname, CommandContainer>
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
     * Get the list of groups
     *
     * @returns array of group names
     */
    getGroups() {
        return this.groups
    }

}