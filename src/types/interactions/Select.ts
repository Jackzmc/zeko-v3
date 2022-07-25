import { ActionRowBuilder, EmojiIdentifierResolvable, SelectMenuInteraction, SelectMenuComponentOptionData, SelectMenuBuilder, SelectMenuComponent, ComponentType } from "discord.js";
import BaseInteraction from "./BaseInteraction.js";
import SelectManager from "../../managers/interactions/SelectManager.js";

export interface SelectMenuCallback {
    (interaction: SelectMenuInteraction, values: string[]): void
}

export interface SelectMenuOptions {
    emoji?: EmojiIdentifierResolvable
    disabled?: boolean,
    id?: string,
    placeholder?: string,
    min?: number,
    max?: number
}

export default class Select extends BaseInteraction<SelectMenuBuilder> {
    
    /**
     * Create a new discord.js button component. If no id provided, a random id will be generated
     * @param {string} label The displayed name of the button
     * @param {ButtonOptions} [options={}] Any optional options
     * @memberof Button
     */
    constructor(choices: SelectMenuComponentOptionData[], options: SelectMenuOptions = {}) {
        super()
        if(choices.length == 0) throw new Error('Empty list of options was given. Minimum of one choice must be given')
        else if(!options.id) options.id = Math.random().toString(16).slice(2)
        else if(options.min && options.min >= choices.length) throw new Error('Minimum number of choices cannot be greater than the number of choices')
        else if(options.min && options.max && options.max < options.min) throw new Error('Maximum number of choices cannot be less than the minimum number of choices')
        this.builder = new ActionRowBuilder<SelectMenuBuilder>()
        .addComponents(
            new SelectMenuBuilder()
                .setCustomId(options.id)
                .setPlaceholder(options.placeholder)
                .setDisabled(options.disabled === true)
                .setMinValues(options.min || 1)
                .setMaxValues(Math.min(options.max, choices.length) || 1)
                .addOptions(choices)
        )
    }

    onSelect(callback: SelectMenuCallback) {
        SelectManager.getInstance().watch(this, callback)
    }
}