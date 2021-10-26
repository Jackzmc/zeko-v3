import CoreEvent from '../core/types/CoreEvent.js'
import { Interaction, Client } from 'discord.js'
import Logger from '../Logger.js';

import CommandManager from '../managers/CommandManager.js'
import OptionResult from '../types/OptionResult.js'
export default class extends CoreEvent {
    constructor(client: Client, logger: Logger) {
        super(client, logger)
    }

    async every(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const slash = this.core.commands.getSlashCommand(interaction.commandName)
        if(!slash) return;
        try {
            let options: OptionResult = new OptionResult(interaction.options, slash.data.options)
            try {
                await slash.command.run(interaction, options)
            } catch(err) {
                if(interaction.replied)
                    await interaction.editReply('**Command Error**\n`' + err.message + "`")
                    .catch(err => this.logger.warn("Failed to send command error message",err.message))
                else
                    await interaction.reply('**Command Error**\n`' + err.message + "`")
                    .catch(err => this.logger.warn("Failed to send command error message",err.message))
                this.logger.warn(`Command ${slash.data.name} had an error:\n    `, err.stack)
                return false
            }
        } catch(err) {
            if(interaction.replied)
                await interaction.editReply(err.message)
            else
                await interaction.reply(err.message)
        }
        return true
    }
}