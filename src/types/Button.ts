import { TextChannel, Snowflake, MessageActionRow, MessageButton, MessageButtonStyleResolvable, TextBasedChannels, ButtonInteraction} from "discord.js";
import EventEmitter from "events";
import ButtonManager from "../managers/ButtonManager.js";

interface ButtonResultParams {
    userid?: Snowflake,
    time?: number
}

const DEFAULT_MAX_TIME = 1500

export interface ButtonCallback {
    (interaction: ButtonInteraction): void
}

export default class Button {
    private data: MessageActionRow;
    private userId?: Snowflake
    private callback: ButtonCallback

    constructor(id: string, name: string, type: MessageButtonStyleResolvable = "SECONDARY") {
        this.data = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(id)
                .setLabel(name)
                .setStyle(type)
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