import CoreEvent from '../core/types/CoreEvent.js'
import { Interaction, Client, AutocompleteInteraction } from 'discord.js'
import Logger from '../Logger.js';

import OptionResult from '../types/OptionResult.js'
import ButtonManager from '../managers/interactions/ButtonManager.js';
import SelectManager from '../managers/interactions/SelectManager.js';
import { isInteractionButton } from 'discord-api-types/utils/v9';
export default class extends CoreEvent {
    private buttonManager: ButtonManager
    private selectManager: SelectManager

    constructor(client: Client, logger: Logger) {
        super(client, logger)
        this.buttonManager = new ButtonManager()
        this.selectManager = new SelectManager()
    }

    async every(interaction: Interaction) {
        if(interaction.isButton()) {
            this.logger.debug(`btn press -> ${interaction.id}`)
            if(this.buttonManager.onInteract(interaction)) {
                return false
            }
        } else if(interaction.isSelectMenu()) {
            this.logger.debug(`sel press -> ${interaction.id}`)
            if(this.selectManager.onInteract(interaction, interaction.values)) {
                return false
            }
        }
        if (!interaction.isCommand()) return;
        

        const slash = this.core.commands.getSlashCommand(interaction.commandName)
        if(!slash) return;

        let options: OptionResult = new OptionResult(interaction.options, slash.data.options)

        if(interaction.isAutocomplete()) { 
            const autocomplete: AutocompleteInteraction = interaction //Fix being set to 'never
            const focused = autocomplete.options.getFocused(true)
            const handler = slash.handlers.autocomplete[options.subcommand]
            try {
                if(handler) {
                    await handler(autocomplete, focused)
                } else {
                    await slash.command.onAutocomplete(autocomplete, focused)
                }
            } catch(err) {
                this.logger.error(`[cmd/${slash.data.name}] autocomplete threw an error`, err)
            }
            return
        }

        try {
            const handler = slash.handlers.default[options.subcommand]
            try {
                if(handler)
                    await handler(interaction, options)
                else
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