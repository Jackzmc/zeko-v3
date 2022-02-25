import { MessageActionRow, EmojiIdentifierResolvable, SelectMenuInteraction, MessageSelectOptionData, MessageSelectMenu } from "discord.js";
import BaseInteraction from "interactions/BaseInteraction.js";
import SelectManager from "../../managers/interactions/SelectManager.js";

export interface SelectMenuCallback {
    (interaction: SelectMenuInteraction): void
}

export interface SelectMenuOptions {
    emoji?: EmojiIdentifierResolvable
    disabled?: boolean,
    id?: string,
    placeholder?: string,
    min?: number,
    max?: number
}

export default class Select extends BaseInteraction {
    
    /**
     * Create a new discord.js button component. If no id provided, a random id will be generated
     * @param {string} label The displayed name of the button
     * @param {ButtonOptions} [options={}] Any optional options
     * @memberof Button
     */
    constructor(choices: MessageSelectOptionData[], options: SelectMenuOptions = {}) {
        super()
        if(!options.id) options.id = Math.random().toString(16).slice(2)
        this.data = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(options.id)
                .setPlaceholder(options.placeholder)
                .setDisabled(options.disabled === true)
                .setMinValues(options.min || 1)
                .setMinValues(options.max || 1)
                .addOptions(choices)
        )
    }

    onSelect(callback: SelectMenuCallback) {
        SelectManager.getInstance().watch(this, callback)
    }
}