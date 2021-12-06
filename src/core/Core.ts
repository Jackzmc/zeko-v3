/**
 * @module core:loaders/CoreLoader
 * @desc Loads all the other loaders and setups the client.
 */

import EventLoader from './loaders/EventLoader.js'
import CommandLoader from './loaders/CommandLoader.js'
import ModuleLoader from './loaders/ModuleLoader.js'
import Functions from './Functions.js'
import Logger from '../Logger.js'
import { promises as fs } from 'fs';
import { Client, Intents } from 'discord.js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import ModuleManager from '../managers/ModuleManager.js';
import CommandManager from '../managers/CommandManager.js';
import EventManager from '../managers/EventManager.js';

import SqliteDatabase from '../managers/database/keyvalue/SqliteKVDatabase.js';
import Database from '../managers/database/Database.js'
import MySQLDatabase from '../managers/database/keyvalue/MySQLKVDatabase.js'
import JsonDatabase from '../managers/database/keyvalue/JsonKVDatabase.js'

export enum DatabaseType {
    SQLITE,
    MYSQL,
    JSON
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class Core {
    private static instance: Core;
    private logger: Logger;
    private client: Client;

    private isLoaded: boolean = false
    private shuttingDown: boolean = false

    private commandManager: CommandManager;
    private moduleManager: ModuleManager;
    private eventManager: EventManager;
    private dataManager: Database;
    private dataProvider: DatabaseType

    constructor() {
        this.logger = new Logger( 'Core' );
        this.logger.info(`Start of logging ${new Date().toLocaleDateString()}`)
        Core.instance = this
    }

    static getInstance(): Core {
        return Core.instance
    }

    get isReady() { 
        return this.isLoaded
    }

    get isShuttingDown() {
        return this.shuttingDown
    }
    
    async load(customIntents: Intents) {
        try {
            // Initialize all loaders
            const ROOT_DIR = resolve(__dirname,"../../")
            this.dataManager = this.getDatabase('core')
            const moduleLoader = new ModuleLoader(ROOT_DIR, new Logger("ModuleLoader"));
            const commandLoader = new CommandLoader(ROOT_DIR, new Logger("CommandLoader"));
            const eventLoader = new EventLoader(ROOT_DIR, new Logger("EventLoader"));
            internalCustomCheck()


            // Event loader must be preloaded to grab any intents any event may need
            const { intents, events } = await eventLoader.preload()
            customIntents.add(intents)
            const intentsArray = customIntents.toArray()
            this.logger.info(`Registered ${intentsArray.length} intents ${intentsArray}`)

            // Create client with intents
            this.client = new Client({
                intents: customIntents
            });
            this.client.core = this
            Functions(this.client)

            // Everything's ready, load the loaders
            try {
                await moduleLoader.load(this.client)
                await commandLoader.load(this.client)
                await eventLoader.load(this.client, events)
            } catch(err) {
                this.logger.severe('Failed to load modules', err.stack)
                process.exit(3)
            }

            this.moduleManager = moduleLoader.manager
            this.commandManager = commandLoader.manager
            this.eventManager = eventLoader.manager

            this.client.login(process.env.DISCORD_BOT_TOKEN)

            this.isLoaded = true

            process.on('exit',    () => this.gracefulShutdown(false))
            process.on('SIGTERM', () => this.gracefulShutdown(true))
            process.on('SIGINT',  () => this.gracefulShutdown(true))
            process.on('SIGUSR2', () => this.gracefulShutdown(true))
        } catch (err) {
            this.logger.severe('Manager loading failure:\n', err)
        }

    }

    gracefulShutdown(exit: boolean) {
        if(!this.shuttingDown) {
            this.shuttingDown = true;
            this.logger.info(`Detected shutdown signal (exit=${exit}). Shutting down managers...`)
            Promise.all([
                this.client.managers.moduleManager.exit(exit),
                this.client.managers.commandManager.exit(exit),
                this.client.managers.eventManager.exit(exit)
            ]).then(() => {
                if(exit) process.exit(0)
            })
        }
    }

    private getDatabase(namespace: string): Database {
        const provider = process.env.ZEKO_DB_PROVIDER ? process.env.ZEKO_DB_PROVIDER.toLowerCase() : "sqlite"
        if(provider === "mysql") {
            const settings = {
                hostname: process.env.MYSQL_HOST,
                port: parseInt(process.env.MYSQL_PORT),
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE,
            }
            this.logger.info(`Using database provider: MySQLDatabase`)
            this.dataProvider = DatabaseType.MYSQL
            return new MySQLDatabase(namespace, settings)
        } else if(provider === "json") {
            this.logger.info(`Using database provider: JSONDatabase`)
            this.dataProvider = DatabaseType.JSON
            return new JsonDatabase(namespace)
        } else {
            this.logger.info(`Using database provider: SqliteDatabase`)
            this.dataProvider = DatabaseType.SQLITE
            return new SqliteDatabase(namespace)
        }
    }

    get commands() { 
        return this.commandManager 
    }
    get modules() {
        return this.moduleManager
    }
    get events() {
        return this.eventManager
    }
    get db() {
        return this.dataManager
    }
    get dbProvider() {
        return this.dataProvider
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
  
  