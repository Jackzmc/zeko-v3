import { ButtonInteraction } from 'discord.js';
import Button from '../types/Button.js';

export default class ButtonManager {
    private buttons: Record<string, Button> = {}

    static instance: ButtonManager

    static getInstance(): ButtonManager {
        return ButtonManager.instance
    }

    onInteract(interaction: ButtonInteraction) {
        const button = this.buttons[interaction.id]
        if(button) {
            if(!button.allowedInteractorId || button.allowedInteractorId === interaction.user.id) {
                button.emit('pressed', interaction)
                delete this.buttons[interaction.id]
                return true
            }
        }
        return false
    }

}
