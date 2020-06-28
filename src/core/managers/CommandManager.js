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

    registerCommand(name, isCore, group = "default") {
        const _this = this;
        return new Promise((resolve, reject) => {
            const root =  path.join(_this.client.ROOT_DIR, isCore?'src/commands':'commands')
            let filepath = group == "default" ? path.join(root, `${name}.js`) : path.join(root, `${group}/${name}.js`)

            import(`file://${filepath}`)
            .then(commandObject => {
                const command = new commandObject.default(this.client, new Logger(`${group}/${name}`))
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
                    config,
                    command
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
            
            })
            .catch(err => reject(err))
        })
    }

    getCommand(name) {
        const command = this.commands.get(name);
        if(!command) {
            const alias = this.aliases.get(name);
            if(alias) {
                return this.commands.get(alias)
            }else{
                return null;
            }
        }else{
            return command;
        }
    }

    getGroups() {
        return this.groups
    }

}