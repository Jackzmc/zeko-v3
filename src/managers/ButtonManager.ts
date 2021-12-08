import { ButtonInteraction } from 'discord.js';
import Button, { ButtonCallback } from '../types/Button.js';

interface WatchData {
    button: Button,
    callback: ButtonCallback
}

export default class ButtonManager {
    private buttons: Record<string, WatchData> = {}

    static instance: ButtonManager

    static getInstance(): ButtonManager {
        if(!ButtonManager.instance) ButtonManager.instance = new ButtonManager()
        return ButtonManager.instance
    }

    onInteract(interaction: ButtonInteraction) {
        const item = this.buttons[interaction.customId]
        if(item) {
            if(!item.button.allowedInteractorId || item.button.allowedInteractorId === interaction.user.id) {
                item.callback(interaction)
                delete this.buttons[interaction.customId]
                return true
            }
        }
        return false
    }

    watch(button: Button, callback: ButtonCallback) {
        this.buttons[button.id] = { button, callback }
    }

}
