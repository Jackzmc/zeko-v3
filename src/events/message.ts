import CoreEvent from '../core/types/CoreEvent.js'
import getopts, { ParsedOptions } from 'getopts'
import { CommandFlag, CommandFlagOptions, FlagType } from '../types/Command.js'
import { Client, Message } from 'discord.js';
import Logger from '../Logger.js'
import { RegisteredCommand } from '../managers/CommandManager.js';
import ModuleManager from '../managers/ModuleManager.js';
import HelpModule from '../modules/help.js';

export default class extends CoreEvent {
    #cmdManager: any;
    #generateHelpCommand: Function
    constructor(client: Client, logger: Logger) {
        super(client, logger);
        this.#cmdManager = client.managers.CommandManager;
        const helpModule = ModuleManager.getInstance().getCoreModule("help", true) as HelpModule
        if(helpModule) {
            this.#generateHelpCommand = helpModule.generateHelpCommand
        }else{
            logger.warn('Could not find help module, help method disabled.');
        }
    }
    every(msg: Message): Promise<boolean> {
        return new Promise((resolve) => {
            if(msg.author.bot) return resolve(true); //Ignore bots.
            if(msg.content.startsWith(this.client.PREFIX)) {
                const args = msg.content.split(/\s+/g);
                if(args.length === 0) return resolve(true);
                
                if(/\s/.test(this.client.PREFIX)) args.shift(); //shift if prefix has space
                const command_name: string = /\s/.test(this.client.PREFIX) ? args.shift().toLowerCase() : args.shift().slice(this.client.PREFIX.length).toLowerCase();
                const cmd: RegisteredCommand = this.#cmdManager.getCommand(command_name, true)
                if(cmd) {
                    if(cmd.config.guildOnly && msg.channel.type === "dm") {
                        return msg.channel.send('This commanad only works in guilds.')
                    }
                    try {
                        //parse arguments with getopts package (--flag)
                        const flags_options: FlagParseResult = parseOptions(cmd.help.flags);
                        const options: ParsedOptions = getopts(msg.content.split(/ +/g).slice(1), {
                            boolean: flags_options.boolean,
                            string: flags_options.string, //includes numbers
                            alias: flags_options.aliases,
                            default: flags_options.defaults
                        })
                        const newArgs: string[] = options._;
                        let flags: FlagList = {};
                        //do a final process, parsing number flags as numbers from string, and removing aliases
                        const names = Object.keys(flags_options.aliases).concat(flags_options.boolean,flags_options.string)
                        if(process.env.DEBUG_FLAGS) {
                            this.logger.debug('names', names)
                            this.logger.debug('flag_options', flags_options)
                            this.logger.debug('options', options)
                        }
                        for(const key in options) {
                            
                            if(key === "_") continue;
                            //flags_options.number is object of default values
                            if(!names.includes(key)) continue; //ignore aliases, dont use them
                            if(flags_options.number[key] != null) {
                                //use default if blank/null, otherwise parse
                                if(!options[key] || options[key] == "") {
                                    flags[key] = flags_options.number[key];
                                }else{
                                    flags[key] = parseInt(options[key]);
                                }
                            }else{
                                flags[key] = options[key]
                            }
                        }
                        //show help message if flag: help, or no args & usageIfNotSet is true
                        if(options.help || (cmd.config.usageIfNotSet && newArgs.length == 0)) {
                            //const help = cmdManager.getCommand('help').generateHelpCommand(client,cmd);
                            if(this.#generateHelpCommand) {
                                return msg.channel.send(this.#generateHelpCommand(cmd))
                            }else{
                                return msg.channel.send("Could not print help command at this time.")
                            }
                        }
                        Promise.resolve(cmd.command.run(msg, newArgs, flags))
                        .then(() => resolve(true))
                        .catch(err => {
                            this.logger.warn(`Command ${cmd.name} had an error:`, err.message)
                            msg.channel.send('**Command Execution Error**\n`' + err.message + "`")
                            .catch(() => {})
                            resolve(false)
                        })
                    }catch(err) {
                        msg.channel.send('**Command Error**\n`' + err.message + "`")
                        .catch(err => this.logger.warn("Failed to send command error message",err.message))
                        this.logger.warn(`Command ${cmd.name} had an error:\n    `, err.stack)
                        resolve(false)
                    }
                }
            }
        })
    }
}


function parseOptions(flags: CommandFlagOptions = {}) : FlagParseResult {
	let result = {
		string: [],
		number: {},
		boolean: [ 'help' ],
		aliases: { help: 'h'},
		defaults: {
			help: false
		}
	}
	for(const key in flags) {
        const flag: CommandFlag = flags[key]
        if(!flags.hasOwnProperty(key)) continue;
        switch(flag.type) {
            case FlagType.Number:
                result.string.push(key)
                result.number[key] = flag.default || 0
                break;
            case FlagType.Boolean: 
                result.boolean.push(key)
                result.defaults[key] = flag.default || false
                break;
            case FlagType.String:
                result.string.push(key)
                result.defaults[key] = flag.default || null
                break;
        }
        if(flag.aliases) result.aliases[key] = flag.aliases
	}
	return result;
}

interface FlagParseResult {
    string: string[],
    number: { 
        [key: string]: any
    },
    boolean: string[],
    aliases: {
        [key: string]: any
    },
    defaults: { 
        [key: string]: any
    },
}
interface FlagList {
    [key: string]: string | number | boolean;
}