import { Snowflake, MessageActionRow, MessageButton, MessageButtonStyleResolvable, ButtonInteraction, EmojiIdentifierResolvable} from "discord.js";
import ButtonManager from "../../managers/interactions/ButtonManager.js";
import BaseInteraction from './BaseInteraction.js';

export interface ButtonCallback {
    (interaction: ButtonInteraction): void
}

export interface ButtonOptions {
    style?: MessageButtonStyleResolvable,
    emoji?: EmojiIdentifierResolvable
    disabled?: boolean,
    id?: string
}

export default class Button extends BaseInteraction {

    /**
     * Create a new discord.js button component. If no id provided, a random id will be generated
     * @param {string} label The displayed name of the button
     * @param {ButtonOptions} [options={}] Any optional options
     * @memberof Button
     */
    constructor(label: string, options: ButtonOptions = {}) {
        super()
        if(!options.id) options.id = Math.random().toString(16).slice(2)
        this.data = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(options.id)
                .setLabel(label)
                .setStyle(options.style ?? "SECONDARY")
                .setDisabled(options.disabled === true)
                .setEmoji(options.emoji)
        )
    }

    onPress(callback: ButtonCallback) {
        ButtonManager.getInstance().watch(this, callback)
    }
}