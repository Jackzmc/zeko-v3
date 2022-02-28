import Discord, { CommandInteraction, Snowflake } from 'discord.js';
import Logger from '../Logger.js'
import OptionResult from '../types/OptionResult.js';

import { SlashOption, ChannelType} from './SlashOptions.js' 

import { Client } from 'discord.js';
import Core from '../core/Core.js';

export { 
    Logger,
    Client,
    ChannelType
}

export interface OfficialCommandConfig {
    name: string,
    description: string,
}

export interface CommandConfig extends OfficialCommandConfig {
    guilds?: Snowflake[]
    defaultPermissions?: "ALL" | "NONE"
    forceRegister?: boolean
}

export interface CommandRegistery  {
    guildIds?: Record<Snowflake, Snowflake>,
    globalId?: Snowflake,
    type: "SLASH" | "CONTEXT_MENU" 
}

export interface DiscordRegistery {
    slash?: CommandRegistery,
    context?: {
        message?: CommandRegistery,
        user?: CommandRegistery
    }
}

export default class ContextCommand {
    protected client: Discord.Client;
    protected logger: Logger;
    protected core: Core;
    register: DiscordRegistery


    constructor(client: Discord.Client, logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    /**
     * Called when everything is ready (discord.js ready and bot core is ready)
     */
    ready?(core?: Core): void | Promise<any>

    _on_ready(core: Core) {
        this.core = Core.getInstance()
        return this.ready ? this.ready(core) : null
    }

    /**
     * Called when the bot is shutting down or the command is being unloaded
     *
     * @param {boolean} [waitable] Can the bot wait for any cleanup, or is it shutting down right now. (Async or not)
     * @memberof Command
     */
    exit?(waitable?: boolean): void | Promise<any>;
}