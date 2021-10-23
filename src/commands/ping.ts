import SlashCommand, { SlashCommandOption, OptionResult } from '../types/Slashcommand.js'
import { CommandInteraction} from 'discord.js';

export default class extends SlashCommand {
	async run(interact: CommandInteraction, options: OptionResult) {
		await interact.deferReply({ ephemeral: true, fetchReply: true })
		interact.followUp(`Pong! Heartbeat: \`\`${Math.round(this.client.ws.ping)}ms\`\``)
	}
	
	slashConfig(): SlashCommandOption {
        return {
            name: 'ping',
            description: "Ping pong",
            guild: "137389758228725761",
            options: []
        }
    }
}
