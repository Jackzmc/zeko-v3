import { ButtonInteraction } from 'discord.js';
import Button from '../types/Button.js';

export default class ButtonManager {
    private buttons: Record<string, Button> = {}

    static instance: ButtonManager

    static getInstance(): ButtonManager {
        if(!ButtonManager.instance) ButtonManager.instance = new ButtonManager()
        return ButtonManager.instance
    }

    onInteract(interaction: ButtonInteraction) {
        const button = this.buttons[interaction.customId]
        if(button) {
            if(!button.allowedInteractorId || button.allowedInteractorId === interaction.user.id) {
                button.emit('pressed', interaction)
                delete this.buttons[interaction.customId]
                return true
            }
        }
        return false
    }

    addButton(button: Button) {
        this.buttons[button.id] = button
    }

}
