import SlashCommand, { SlashCommandConfig, OptionResult, CommandInteraction } from '../types/SlashCommand.js'

export default class extends SlashCommand {
	async run(interact: CommandInteraction, options: OptionResult) {
		await interact.deferReply({ ephemeral: true, fetchReply: true })
		interact.followUp(`Pong! Heartbeat: \`\`${Math.round(this.client.ws.ping)}ms\`\``)
	}
	
	slashConfig(): SlashCommandConfig {
        return {
            name: 'ping',
            description: "Ping pong",
            options: []
        }
    }
}
