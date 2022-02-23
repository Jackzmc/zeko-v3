import { TextChannel, Snowflake, MessageActionRow, MessageButton, MessageButtonStyleResolvable, TextBasedChannels, ButtonInteraction, EmojiIdentifierResolvable} from "discord.js";
import EventEmitter from "events";
import ButtonManager from "../managers/ButtonManager.js";

interface ButtonResultParams {
    userid?: Snowflake,
    time?: number
}

const DEFAULT_MAX_TIME = 15000

export interface ButtonCallback {
    (interaction: ButtonInteraction): void
}

export interface ButtonOptions {
    style?: MessageButtonStyleResolvable,
    emoji?: EmojiIdentifierResolvable
    disabled?: boolean,
    id?: string
}

export default class Button {
    private data: MessageActionRow;
    private userId?: Snowflake

    
    /**
     * Create a new discord.js button component. If no id provided, a random id will be generated
     * @param {string} label The displayed name of the button
     * @param {ButtonOptions} [options={}] Any optional options
     * @memberof Button
     */
    constructor(label: string, options: ButtonOptions = {}) {
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