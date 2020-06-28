import CoreEvent from '../core/types/CoreEvent.js'
import getopts from 'getopts'

let cmdManager;

export default class extends CoreEvent {
    constructor(client, logger) {
        super(client, logger);
        cmdManager = client.managers.CommandManager;
    }
    every(msg) {
        return new Promise((resolve, reject) => {
            if(msg.author.bot) return resolve(true); //Ignore bots.
            if(msg.content.startsWith(this.client.PREFIX)) {
                const args = msg.content.split(/\s+/g);
                if(args.length === 0) return resolve(true);
                
                if(/\s/.test(this.client.PREFIX)) args.shift(); //shift if prefix has space
                const command_name = /\s/.test(this.client.PREFIX) ? args.shift().toLowerCase() : args.shift().slice(this.client.PREFIX.length).toLowerCase();
                const cmd = cmdManager.getCommand(command_name)
                if(cmd) {
                    try {
                        //parse arguments with getopts package (--flag)
                        const flags_options = parseOptions(cmd.config.flags);
                        const options = getopts(msg.cleanContent.split(/ +/g).slice(1), {
                            boolean: flags_options.boolean,
                            string: flags_options.string, //includes numbers
                            alias: flags_options.aliases,
                            default: flags_options.defaults
                        })
                        const newArgs = options._;
                        let flags = {};
                        //do a final process, parsing number flags as numbers from string, and removing aliases
                        const names = Object.keys(flags_options.aliases).concat(flags_options.boolean,flags_options.string)
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
                            return msg.channel.send(`<HELP IN DEVELOPMENT RIP>`)
                        }
                        Promise.resolve(cmd.command.run(msg, newArgs, options))
                        .then(() => resolve(true))
                        .catch(err => {
                            this.logger.warn(`Command ${cmd.name} had an error:`, err)
                            msg.channel.send('**Command Execution Error**\n`' + err.message + "`")
                            .catch(() => {})
                            resolve(false)
                        })
                    }catch(err) {
                        msg.channel.send('**Command Error**\n`' + err.message + "`")
                        .catch(err => logger.warn("Failed to send command error message",err.message))
                        this.logger.warn(`Command ${cmd.name} had an error:\n    `, err.stack)
                        resolve(false)
                    }
                }
            }
        })
    }
}


function parseOptions(flags = {}) {
	let result = {
		string:[],
		number:{},
		boolean:['help'],
		aliases:{help:'h'},
		defaults:{
			help:false
		}
	}
	for(const key in flags) {
		if(!flags.hasOwnProperty(key)) continue;
		if(typeof(flags[key]) === "object") {
			/*
			{ type: Boolean, aliases: ['t','turbo'] }
			*/
			if(flags[key].type) {
				//again, if alias option only includes 0
				if(flags[key].type === Boolean || (typeof value === "string" && flags[key].type === "boolean")) {
					//Push the first alias
					result.boolean.push(key)
					if(flags[key].default) result.defaults[key] = flags[key].default
				}else if(flags[key].type === String || flags[key].type === "string") {
					result.string.push(key)
					if(flags[key].default) result.defaults[key] = flags[key].default
				}else if(flags[key].type === Number || (typeof value === "string" && flags[key].type.toLowerCase() === "number")) {
					result.string.push(key);
					result.number[key] = flags[key].default;
				}
				if(flags[key].aliases) result.aliases[key] = flags[key].aliases
			} 
		}else if(flags[key] === Boolean || (typeof value === "string" && flags[key].toLowerCase() === "boolean")) {
			result.boolean.push(key);
			result.defaults[key] = false;
		}else if(flags[key] === Number || (typeof value === "string" && flags[key].toLowerCase() === "number")) {
			result.string.push(key);
			result.number[key] = 0;
		}else if(Array.isArray(flags[key])) {
			//if alias option only includes 1 or less ignore
			if(flags[key].length <= 1) continue;
			result.aliases[flags[key][0]] = flags[key].slice(1)
		}else {
			result.string.push(key);
		}
	}
	return result;
}