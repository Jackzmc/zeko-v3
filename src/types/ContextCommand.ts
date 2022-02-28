import BaseCommand, { CommandConfig } from './BaseCommand.js'
import { Client, ContextMenuInteraction } from 'discord.js';
import { Logger } from 'SlashCommand.js';

export enum ContextMenuType {
    USER = 2,
    MESSAGE = 3
}

export interface ContextCommandConfig extends CommandConfig {
    type: ContextMenuType
}

export default abstract class ContextCommand extends BaseCommand {

    constructor(client: Client, logger: Logger) {
        super(client, logger)
        this.register.context = {}
    }

    abstract onContext(interaction: ContextMenuInteraction): Promise<any> | void;
    abstract contextConfig(): ContextCommandConfig;
}