import { SelectMenuInteraction } from 'discord.js';
import Select, { SelectMenuCallback } from '../../types/interactions/Select.js';

interface WatchData {
    select: Select,
    callback: SelectMenuCallback
}

export default class SelectManager {
    private buttons: Record<string, WatchData> = {}

    constructor() {
        if(SelectManager.instance) {
            throw new Error('ButtonManager is a singleton')
        }
        SelectManager.instance = this
    }

    static instance: SelectManager

    static getInstance(): SelectManager {
        return SelectManager.instance
    }

    onInteract(interaction: SelectMenuInteraction, values: string[]) {
        const item = this.buttons[interaction.customId]
        if(item) {
            if(!item.select.allowedInteractorId || item.select.allowedInteractorId === interaction.user.id) {
                item.callback(interaction, values)
                delete this.buttons[interaction.customId]
                return true
            }
        }
        return false
    }

    watch(select: Select, callback: SelectMenuCallback) {
        this.buttons[select.id] = { select, callback }
    }

}
