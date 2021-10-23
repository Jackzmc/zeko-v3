import SlashCommand, { SlashCommandOption, OptionResult } from '../types/SlashCommand.js'
import { CommandInteraction, Client } from 'discord.js';
import CommandManager , { RegisteredCommand, RegisteredLegacyCommand } from '../managers/CommandManager.js';
import Logger from "../Logger.js";

const PREFIX_REGEX = new RegExp(/%(prefix|p)%/,"g")

export default class HelpCommand extends SlashCommand {
    constructor(client: Client, logger: Logger) {
        super(client, logger)
    }

    run(inter: CommandInteraction, options: OptionResult) {
        if(options.has("command")) {
            const cmd: RegisteredLegacyCommand = CommandManager.getInstance().getCommand(options.getString("command"), false);
            if(!cmd) return inter.reply("Couldn't find that command");
            return inter.reply({
                embeds: [this.generateHelpCommand(cmd)]
            })
        }else{
            const grouped = this.client.managers.commandManager.getCommands(true)
            //loop the sorted commands
            for(const key in grouped) {
                //make the name pretty, and filter non-hidden groups
                const group_name = key.charAt(0).toUpperCase() + key.slice(1);
                const cmds = grouped[key]
                if(cmds.length === 0) continue;
                //send embed of commands, only if well there is commands
                inter.reply({ 
                    embeds: [{
                        title:`${group_name} Commands`,
                        description: cmds.map((cmd: RegisteredLegacyCommand) => {
                            const desc = cmd.help.description.replace(/\*\*/g,'\\**')
                            return `**${cmd.name}** - ${desc}`
                        }).join("\n")
                    }]
                })
            }
            //clarify (for other users and the author) thats in the dm
            inter.reply("** 📬 Help has been sent to your DM**")
        }
    }

    slashConfig(): SlashCommandOption {
        return {
            name: 'help',
            description: "Get help with the bot and it's commands. Leave blank for a list of commands.",
            guild: "137389758228725761",
            options: [
                {
                    type: "STRING",
                    name: "command",
                    description: "A specific command to find information about",
                    required: false
                }
            ]
        }
    }

    generateHelpCommand(cmd: RegisteredLegacyCommand) {
        let fields = [];
        //print information about flags if not hidden
        if(cmd.help.flags && !cmd.config.hideFlags) {
            const flags = [];
            for(const key in cmd.help.flags) {
                const flag = cmd.help.flags[key];
    
                flags.push(`**[${flag.type}] ${key}** ${flag.description||''}`)
            }
            if(flags.length > 0)
                fields.push({name:'Flags',value: flags.join("\n")})
        }
        //add fields to the embed
        if(cmd.help.fields && Array.isArray(cmd.help.fields)) {
            fields = fields.concat(cmd.help.fields)
        } 
        //add example field, filling in %prefix%
        if(cmd.help.examples && Array.isArray(cmd.help.examples)) {
            const value = cmd.help.examples.join("\n").replace(PREFIX_REGEX, this.client.PREFIX)
            fields.push({name:'Examples', value});
        }
        const USAGE_STR = cmd.help.usage ? `\n**Usage: **\`${this.client.PREFIX}${cmd.help.usage.replace(PREFIX_REGEX,"")}\`` : ''
    
        return {
            title: `${this.client.PREFIX}${cmd.name}`,
            description: `${cmd.help.description.replace(PREFIX_REGEX,this.client.PREFIX)}${USAGE_STR}`,
            fields
        }
    }
}
