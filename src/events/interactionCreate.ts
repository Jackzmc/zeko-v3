import CoreEvent from '../core/types/CoreEvent.js'
import { Interaction, Client } from 'discord.js'
import Logger from '../Logger.js';

import CommandManager from '../managers/CommandManager.js'
import OptionResult from '../types/OptionResult.js'
export default class extends CoreEvent {
    #cmdManager: CommandManager
    constructor(client: Client, logger: Logger) {
        super(client, logger)
        this.#cmdManager = CommandManager.getInstance()
    }

    async every(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const slash = this.#cmdManager.getSlashCommand(interaction.commandName)
        if(!slash) return;
        let options: OptionResult = new OptionResult(interaction.options, slash.data.options)
        try {
            await slash.command.run(interaction, options)
        } catch(err) {
            if(!interaction.replied)
                interaction.reply('**Command Error**\n`' + err.message + "`")
                .catch(err => this.logger.warn("Failed to send command error message",err.message))
            this.logger.warn(`Command ${slash.data.name} had an error:\n    `, err.stack)
            return false
        }
        return true
    }
}