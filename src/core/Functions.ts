import { Client } from 'discord.js';
import path from 'path'
import Utils from '../Utils.js'

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import Manager from '../managers/Manager.js';
import CommandManager from '../managers/CommandManager';
import ModuleManager from '../managers/ModuleManager';
import EventManager from '../managers/EventManager';
import SettingsManager from '../managers/SettingsManager.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface Managers {
    commandManager: CommandManager,
    moduleManager: ModuleManager,
    eventManager: EventManager,
    settingsManager: SettingsManager
}

export default function(client: Client) {
    client.PREFIX = process.env.BOT_PREFIX || ">"
    client.ROOT_DIR = path.resolve(__dirname,"../../"); 
    client.managers = {
        commandManager: null,
        moduleManager: null,
        eventManager: null,
        settingsManager: null
    } as Managers
    client.utils = Utils(client);
    client.evns = {}
}
