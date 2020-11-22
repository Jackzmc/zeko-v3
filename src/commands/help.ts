import Command, { FlagList, CommandConfigOptions, CommandHelpOptions } from "../types/Command.js";
import { Message, Client } from 'discord.js';
import CommandManager , { RegisteredCommand } from '../managers/CommandManager.js';
import Logger from "../Logger.js";
import ModuleManager from '../managers/ModuleManager.js';
import HelpModule from '../modules/help.js';

export default class extends Command {
    #generateHelpCommand: Function
    constructor(client: Client, logger: Logger) {
        super(client, logger)
        const helpModule = ModuleManager.getInstance().getCoreModule("help", true) as HelpModule
        if(helpModule) {
            this.#generateHelpCommand = helpModule.generateHelpCommand
        }
    }

    run(msg: Message, args: string[], flags: FlagList) {
        if(args[0]) {
            const cmd: RegisteredCommand = CommandManager.getInstance().getCommand(args[0].toLowerCase(), false);
            if(!cmd) return msg.channel.send("Couldn't find that command");
            return msg.channel.send(this.#generateHelpCommand(cmd))
        }else{
            const grouped = this.client.managers.CommandManager.getCommands(true, false, false)
            //loop the sorted commands
            for(const key in grouped) {
                //make the name pretty, and filter non-hidden groups
                const group_name = key.charAt(0).toUpperCase() + key.slice(1);
                const cmds = grouped[key]
                if(cmds.length === 0) continue;
                //send embed of commands, only if well there is commands
                msg.author.send({embed:{
                    title:`${group_name} Commands`,
                    description: cmds.map((cmd: RegisteredCommand) => {
                        this.logger.debug
                        const desc = cmd.help.description.replace(/\*\*/g,'\\**')
                        return `**${cmd.name}** - ${desc}`
                    }).join("\n")
                }})
            }
            //clarify (for other users and the author) thats in the dm
            msg.channel.send("** 📬 Help has been sent to your DM**")
        }
    }

    config(): CommandConfigOptions {
        return {
            usageIfNotSet: false,
            guildOnly: false
        }
    }

    help(): CommandHelpOptions {
        return {
            name: ['help'],
            description: 'Get help with the bot and it\'s commands. Leave blank for a list of commands.',
            usage: 'help [command]'
        }
    }

    
}

function getType(value: any) {
	if(typeof value === "object") {
		return "Object"
	}else if(value === String || (typeof value === "string" && value.toLowerCase() === "string")) {
		return "String"
	}else if(value === Boolean || (typeof value === "string" && value.toLowerCase() === "boolean")) {
		return "Boolean"
	}else if(value === Number || (typeof value === "string" && value.toLowerCase() === "number")) {
		return "Number";
	}
	return "Unknown";
}