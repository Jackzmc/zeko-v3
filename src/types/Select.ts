import { TextChannel, Snowflake, MessageActionRow, TextBasedChannels, EmojiIdentifierResolvable, SelectMenuInteraction, MessageSelectOptionData, MessageSelectMenu} from "discord.js";
import SelectManager from "../managers/interactions/SelectManager.js";

interface ButtonResultParams {
    userid?: Snowflake,
    time?: number
}

const DEFAULT_MAX_TIME = 15000

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

export default class Select {
    private data: MessageActionRow;
    private userId?: Snowflake

    
    /**
     * Create a new discord.js button component. If no id provided, a random id will be generated
     * @param {string} label The displayed name of the button
     * @param {ButtonOptions} [options={}] Any optional options
     * @memberof Button
     */
    constructor(label: string, choices: MessageSelectOptionData[], options: SelectMenuOptions = {}) {
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

    get allowedInteractorId() {
        return this.userId
    }

    setAllowedInteractor(userId: Snowflake) {
        this.userId = userId
    }

    get id() {
        return this.data.components[0].customId
    }

    get component() {
        return this.data
    }

    async getResult(channel: TextChannel, options: ButtonResultParams = {}) {
        if(!options.userid) options.userid = this.userId
        return new Promise((resolve, reject) => {
            const collector = channel.createMessageComponentCollector({ 
                filter: (i: any) => i.customId === this.data.components[0].customId && (!options.userid || i.user.id === options.userid), 
                time: options.time || DEFAULT_MAX_TIME,
            });
        
            collector.on('collect', (r) => {
                resolve(r)
                collector.removeAllListeners()
            });
            collector.on('end', (collected, reason) => reject(reason))
        }) 
    }

    async wasPressedIn(channel: TextBasedChannels, options: ButtonResultParams = {}): Promise<boolean> {
        if(!options.userid) options.userid = this.userId
        return new Promise((resolve) => {
            const collector = channel.createMessageComponentCollector({ 
                filter: (i: any) => i.customId === this.data.components[0].customId && (!options.userid || i.user.id === options.userid), 
                time: options.time || DEFAULT_MAX_TIME,
            });
        
            collector.on('collect', () => {
                resolve(true)
                collector.removeAllListeners()
            });
            collector.on('end', () => resolve(false))
        }) 
    }
}