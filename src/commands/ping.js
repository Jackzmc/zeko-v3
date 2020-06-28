import commonTags from 'common-tags'
import Command from '../types/Command.js'
const {stripIndents} = commonTags;
export default class extends Command {
	run(msg, args, flags) {
		msg.channel.send("Ping?")
		.then(m => {
			m.edit(stripIndents`Pong! Roundtrip: \`\`${(msg.createdTimestamp - m.createdTimestamp) * -1}ms\`\` Heartbeat: \`\`${Math.round(this.client.ws.ping)}ms\`\``)
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
            description: 'Show bot latency',
            usage: 'ping',
            flags: {}
        }
    }
}
