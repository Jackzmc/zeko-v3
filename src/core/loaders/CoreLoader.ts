/**
 * @module core:loaders/CoreLoader
 * @desc Loads all the other loaders and setups the client.
 */

import EventLoader from './EventLoader.js'
import CommandLoader from './CommandLoader.js'
import ModuleLoader from './ModuleLoader.js'
import SettingsManager from '../../managers/SettingsManager.js';

import Logger from '../../Logger.js'
import { promises as fs } from 'fs';
import { Client } from 'discord.js';

export default class CoreLoader {
    #logger: Logger;
    #client: Client;
    #shuttingDown: boolean = false
    constructor(client: Client ) {
        const logger = new Logger( 'CoreLoader' );
        this.#logger = logger;
        this.#client = client;
        try {
            const moduleLoader = new ModuleLoader(client, new Logger("ModuleLoader"));
            const commandLoader = new CommandLoader(client, new Logger("CommandLoader"));
            const eventLoader = new EventLoader(client, new Logger("EventLoader"));
            //TODO: Wait for moduleloader to finish, load cmd/event, finally send token
            internalCustomCheck()
            moduleLoader.load()
                .then(() => commandLoader.load())
                .then(() => eventLoader.load())
                .catch(err => {
                    logger.severe('Failed to load modules', err)
                })
            client.managers.SettingsManager = new SettingsManager(client);
            client.login(process.env.DISCORD_BOT_TOKEN)
            process.on('exit',    () => this.gracefulShutdown(false))
            process.on('SIGTERM', () => this.gracefulShutdown(true))
            process.on('SIGINT',  () => this.gracefulShutdown(true))
            process.on('SIGUSR2', () => this.gracefulShutdown(true))
        } catch (err) {
            logger.severe('Manager loading failure:\n', err)
        }
    }
    gracefulShutdown(exit: boolean) {
        if(!this.#shuttingDown) {
            this.#shuttingDown = true;
            this.#logger.info(`Detected shutdown signal (exit=${exit}). Shutting down managers...`)
            Promise.all([
                this.#client.managers.ModuleManager.exit(exit),
                this.#client.managers.CommandManager.exit(exit),
                this.#client.managers.EventManager.exit(exit)
            ]).then(() => {
                if(exit) process.exit(0)
            })
        }
    }
}
async function internalCustomCheck() {
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
  
  