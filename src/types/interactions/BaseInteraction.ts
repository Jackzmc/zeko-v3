import { ActionRowBuilder, AnyComponentBuilder, APIBaseComponent, APIButtonComponent, APISelectMenuComponent, ButtonStyle, ComponentBuilder, ComponentType, MessageActionRowComponentBuilder, Snowflake, TextBasedChannel, TextChannel } from "discord.js";

export interface InteractionResultParams {
    userid?: Snowflake,
    time?: number
}

export const DEFAULT_MAX_INTERACT_TIME = 15000


export default class BaseInteraction<T extends MessageActionRowComponentBuilder> {
    protected builder: ActionRowBuilder<T>;
    protected userId?: Snowflake

    get allowedInteractorId() {
        return this.userId
    }

    setAllowedInteractor(userId: Snowflake) {
        this.userId = userId
    }

    get id() {
        const data = this.builder.components[0].data
        if (data.type === ComponentType.Button && data.style === ButtonStyle.Link) {
            throw new Error("No ID exists for buttons with links")
        }
        // @ts-ignore
        return data.custom_id
    }

    get component() {
        return this.builder
    }

    async getResult(channel: TextChannel, options: InteractionResultParams = {}) {
        if(!options.userid) options.userid = this.userId
        return new Promise((resolve, reject) => {
            const collector = channel.createMessageComponentCollector({ 
                filter: (i: any) => i.customId === this.id && (!options.userid || i.user.id === options.userid), 
                time: options.time || DEFAULT_MAX_INTERACT_TIME,
            });
        
            collector.on('collect', (r) => {
                resolve(r)
                collector.removeAllListeners()
            });
            collector.on('end', (collected, reason) => reject(reason))
        }) 
    }

    async wasPressedIn(channel: TextBasedChannel, options: InteractionResultParams = {}): Promise<boolean> {
        if(!options.userid) options.userid = this.userId
        return new Promise((resolve) => {
            const collector = channel.createMessageComponentCollector({ 
                filter: (i: any) => i.customId === this.id && (!options.userid || i.user.id === options.userid), 
                time: options.time || DEFAULT_MAX_INTERACT_TIME,
            });
        
            collector.on('collect', () => {
                resolve(true)
                collector.removeAllListeners()
            });
            collector.on('end', () => resolve(false))
        }) 
    }

    valueOf() {
        this.component
    }
}