import Command from "../types/Command.js";
const PREFIX_REGEX = new RegExp(/%(prefix|p)%/,"g")

export default class extends Command {
    run(msg, args, flags) {
        if(args[0]) {
            const cmd = this.client.managers.CommandManager.getCommand(args[0].toLowerCase(), false);
            if(!cmd) return msg.channel.send("Couldn't find that command");
            return msg.channel.send(this.generateHelpCommand(cmd))
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
                    description: cmds.map(cmd => {
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

    config() {
        return {
            usageIfNotSet: false
        }
    }

    help() {
        return {
            name: ['help'],
            description: 'Get help with the bot and it\'s commands. Leave blank for a list of commands.',
            usage: 'help [command]'
        }
    }

    generateHelpCommand(cmd){
        let fields = [];
        //print information about flags if not hidden
        if(cmd.help.flags && !cmd.config.hideFlags) {
            const flags = [];
            for(const key in cmd.help.flags) {
                const value = cmd.help.flags[key];
                let type = getType(value);
                let description = null;
                //if the value is an object, then parse the sub object 
                if(type === "Object") {
                    //only valid if there is a type attribute
                    if(value.type) {
                        //reset type to the type of flag
                        type = getType(value.type)
                        //set the description if there is one (will be undefined)
                        description = value.description;
                    }else{
                        type = "Object";
                    }
                }
                flags.push(`**[${type}] ${key}** ${description||''}`)
            }
            fields.push({name:'Flags',value:flags.join("\n")})
        }
        //add fields to the embed
        if(cmd.help.fields) {
            fields = fields.concat(cmd.help.fields)
        } 
        //add example field, filling in %prefix%
        if(cmd.help.example) {
            const value = Array.isArray(cmd.help.example) ? cmd.help.example.join("\n") : cmd.help.example
            fields.push({name:'Examples',value:value.replace(PREFIX_REGEX,this.client.PREFIX)});
        }else if(cmd.help.examples) {
            const value = Array.isArray(cmd.help.examples) ? cmd.help.examples.join("\n") : cmd.help.examples
            fields.push({name:'Examples',value:value.replace(PREFIX_REGEX,this.client.PREFIX)});
        }
        const USAGE_STR = cmd.help.usage ? `\n**Usage: **\`${this.client.PREFIX}${cmd.help.usage.replace(PREFIX_REGEX,"")}\`` : ''

        return {embed:{
            title:`${this.client.PREFIX}${cmd.name}`,
            description:`${cmd.help.description.replace(PREFIX_REGEX,this.client.PREFIX)}${USAGE_STR}`,
            fields
        }}
    }
}

function getType(value) {
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