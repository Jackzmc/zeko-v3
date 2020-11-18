import Module from '../types/Module.js';
import { RegisteredCommand } from '../managers/CommandManager.js';
const PREFIX_REGEX = new RegExp(/%(prefix|p)%/,"g")

export default class HelpModule extends Module {
    generateHelpCommand(cmd: RegisteredCommand) {
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
            const value = cmd.help.examples.join("\n").replace(PREFIX_REGEX,this.client.PREFIX)
            fields.push({name:'Examples', value});
        }
        const USAGE_STR = cmd.help.usage ? `\n**Usage: **\`${this.client.PREFIX}${cmd.help.usage.replace(PREFIX_REGEX,"")}\`` : ''

        return {embed:{
            title: `${this.client.PREFIX}${cmd.name}`,
            description: `${cmd.help.description.replace(PREFIX_REGEX,this.client.PREFIX)}${USAGE_STR}`,
            fields
        }}
    }
}