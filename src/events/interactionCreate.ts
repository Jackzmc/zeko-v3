import CoreEvent from '../core/types/CoreEvent.js'
import { Interaction, Client } from 'discord.js'
import Logger from '../Logger.js';

import OptionResult from '../types/OptionResult.js'
import ButtonManager from '../managers/ButtonManager.js';
export default class extends CoreEvent {
    private buttonManager: ButtonManager
    constructor(client: Client, logger: Logger) {
        super(client, logger)
        this.buttonManager = new ButtonManager()
    }

    async every(interaction: Interaction) {
        if (!interaction.isCommand()) return;
        if(interaction.isButton()) {
            if(this.buttonManager.onInteract(interaction)) {
                return false
            }
        }

        if (!interaction.isCommand()) return;

        const slash = this.core.commands.getSlashCommand(interaction.commandName)
        if(!slash) return;
        try {
            let options: OptionResult = new OptionResult(interaction.options, slash.data.options)
            try {
                await slash.command.run(interaction, options)
            } catch(err) {
                const msg = '**Command Error**\n`' + err.message + "`"
                try {
                    if(interaction.replied)
                        await interaction.editReply(msg)
                    else if(interaction.deferred) 
                        await interaction.followUp(msg)
                    else
                        await interaction.reply(msg)
                } catch(err) {
                    this.logger.warn("Failed to send command error message",err.message)
                }
                this.logger.warn(`Command ${slash.data.name} had an error:\n    `, err.stack)
                return false
            }
        } catch(err) {
            this.logger.warn(`Command ${slash.data.name} experienced option parsing error:\n    `, err.stack)
            const msg = `**Internal Error**\n${err.message}`
            if(interaction.replied) await interaction.editReply(msg) 
            else await interaction.reply(msg)
        }
        return true
    }
}