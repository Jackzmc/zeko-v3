import { Snowflake } from "discord-api-types";
import { MessageActionRow, TextBasedChannels, TextChannel } from "discord.js";

export interface InteractionResultParams {
    userid?: Snowflake,
    time?: number
}

export const DEFAULT_MAX_INTERACT_TIME = 15000

export default class BaseInteraction {
    protected data: MessageActionRow;
    protected userId?: Snowflake

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

    async getResult(channel: TextChannel, options: InteractionResultParams = {}) {
        if(!options.userid) options.userid = this.userId
        return new Promise((resolve, reject) => {
            const collector = channel.createMessageComponentCollector({ 
                filter: (i: any) => i.customId === this.data.components[0].customId && (!options.userid || i.user.id === options.userid), 
                time: options.time || DEFAULT_MAX_INTERACT_TIME,
            });
        
            collector.on('collect', (r) => {
                resolve(r)
                collector.removeAllListeners()
            });
            collector.on('end', (collected, reason) => reject(reason))
        }) 
    }

    async wasPressedIn(channel: TextBasedChannels, options: InteractionResultParams = {}): Promise<boolean> {
        if(!options.userid) options.userid = this.userId
        return new Promise((resolve) => {
            const collector = channel.createMessageComponentCollector({ 
                filter: (i: any) => i.customId === this.data.components[0].customId && (!options.userid || i.user.id === options.userid), 
                time: options.time || DEFAULT_MAX_INTERACT_TIME,
            });
        
            collector.on('collect', () => {
                resolve(true)
                collector.removeAllListeners()
            });
            collector.on('end', () => resolve(false))
        }) 
    }
}