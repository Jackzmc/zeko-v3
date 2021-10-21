/**
 * @module core:loaders/CoreLoader
 * @desc Loads all the other loaders and setups the client.
 */

import EventLoader from './EventLoader.js'
import CommandLoader from './CommandLoader.js'
import ModuleLoader from './ModuleLoader.js'
import SettingsManager from '../../managers/SettingsManager.js';
import Functions from '../Functions.js'
import Logger from '../../Logger.js'
import { promises as fs } from 'fs';
import { Client, Intents } from 'discord.js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class CoreLoader {
    #logger: Logger;
    #client: Client;
    #shuttingDown: boolean = false
    constructor(customIntents: Intents) {
        const logger = new Logger( 'CoreLoader' );
        this.#logger = logger;
        this._load(customIntents)
    }
    async _load(customIntents: Intents) {
        try {
            const ROOT_DIR = resolve(__dirname,"../../")
            const moduleLoader = new ModuleLoader(ROOT_DIR, new Logger("ModuleLoader"));
            const commandLoader = new CommandLoader(ROOT_DIR, new Logger("CommandLoader"));
            const eventLoader = new EventLoader(ROOT_DIR, new Logger("EventLoader"));
            internalCustomCheck()

            const { intents, events } = await eventLoader.preload()
            customIntents.add(intents)
            const client: Client = new Client({
                intents: customIntents
            });
            Functions(client)

            try {
                await moduleLoader.load(client)
                await commandLoader.load(client)
                await eventLoader.load(client, events)
            } catch(err) {
                this.#logger.severe('Failed to load modules', err)
            }
            if(!process.env.ZEKO_DISABLE_SETTINGS)
                // client.managers.settingsManager = new SettingsManager(client);
            
            process.on('exit',    () => this.gracefulShutdown(false))
            process.on('SIGTERM', () => this.gracefulShutdown(true))
            process.on('SIGINT',  () => this.gracefulShutdown(true))
            process.on('SIGUSR2', () => this.gracefulShutdown(true))
        } catch (err) {
            this.#logger.severe('Manager loading failure:\n', err)
        }
    }
    gracefulShutdown(exit: boolean) {
        if(!this.#shuttingDown) {
            this.#shuttingDown = true;
            this.#logger.info(`Detected shutdown signal (exit=${exit}). Shutting down managers...`)
            Promise.all([
                this.#client.managers.moduleManager.exit(exit),
                this.#client.managers.commandManager.exit(exit),
                this.#client.managers.eventManager.exit(exit)
            ]).then(() => {
                if(exit) process.exit(0)
            })
        }
    }
}
async function internalCustomCheck(): Promise<void> {
    return new Promise((resolve, reject) => {
        const folders = ["commands", "events", "modules"]
        folders.forEach(v => {
            fs.readdir(`./${v}`)
                .then(() => {
                    resolve();
                })
                .catch(() => {
                    try {
                        fs.mkdir(`./${v}`)
                    } catch (err) {
                        reject(err);
                    }
                })
        })
    })
}
  
  