import Command, {FlagList} from '../types/Command.js'
import { Message } from 'discord.js';
export default class extends Command {
	run(msg: Message, args: string[], flags: FlagList) {
		msg.channel.send("Ping?")
		.then((m: Message) => {
			m.edit(`Pong! Roundtrip: \`\`${(msg.createdTimestamp - m.createdTimestamp) * -1}ms\`\` Heartbeat: \`\`${Math.round(this.client.ws.ping)}ms\`\``)
		});
	}
	config() {
		return {
			usageIfNotSet: false
		}
	}

	help() {
        return {
            name: ['ping'],
            description: "Show the bot's ping to discord.",
            usage: 'ping',
            flags: {}
        }
    }
}
