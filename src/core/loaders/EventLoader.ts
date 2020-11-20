/** 
@module core:loaders/EventLoader
@description Loads all event files
*/
import { promises as fs } from 'fs';
import path from 'path'

import EventManager, { RegisteredCoreEvent, RegisteredCustomEvent } from '../../managers/EventManager.js'
import Logger from '../../Logger.js';
import { Client } from 'discord.js';
import CoreLoader from './CoreLoader';
import Event from 'Event.js';
import CoreEvent from '../types/CoreEvent.js';

const folders = ['src/events','events'];
const IGNORED_EVENTS = ['raw','debug']

interface EventBit {
    name: string
    event: Event | CoreEvent
    isCore: boolean
}

export default class {
    #manager: EventManager;
    #logger: Logger
    #client: Client
    constructor(client: Client, log: Logger) {
        this.#manager = new EventManager(client);
        client.managers.EventManager = this.#manager;
        this.#logger = log;
        this.#client = client;
        //this.setupWatcher()

        //Catch all events, pass to EventManager
        patchEmitter(client, this.#manager)
    }
    async load() {
        const promises: Promise<EventBit>[] = [];
        for(const folder of folders) {
            const isCore = folder.startsWith("src")
            let filepath = path.join(this.#client.ROOT_DIR, folder);
            try {
                const files = await fs.readdir(filepath, { withFileTypes: true })
                for(const dirent of files) {
                    promises.push(loadEvent(filepath, dirent.name, isCore));
                }
            }catch(err) {
                if(err.code === "ENOENT") {
                    this.#logger.warn(`'${folder}' directory does not exist.`)
                }else {
                    this.#logger.error(`Loading ${folder} failed:\n`, err);
                }
            }
        }
        try {
            let eventBits = await Promise.all(promises)
            eventBits = eventBits.filter(bit => bit)
            await Promise.all(eventBits.map(async(eventBit) => {
                await this.#manager.register(eventBit.event, eventBit.name, eventBit.isCore)
            }))
            this.#logger.success(`Loaded ${this.#manager.coreLoaded} core events, ${this.#manager.customLoaded} custom events`)
            return;
        }catch(err) {
            //TODO: change logic?
            this.#logger.severe('A failure occurred while loading events.\n', err)
        }
    }
}

//replace client.emit with custom emit that sends events to EventManager
function patchEmitter(emitter: any, manager: EventManager) {
	const oldEmit = emitter.emit;
	emitter.emit = function() {
        const args = Array.prototype.slice.call(arguments);
		const name = args.shift();
        if(!IGNORED_EVENTS.includes(name)) {
            manager.event(name,args)
        }
		oldEmit.apply(emitter, arguments);
    }
    return emitter;
}

async function loadEvent(rootPath: string, filename: string, isCore: boolean): Promise<EventBit> {
    if(filename.split(".").slice(-1)[0] !== "js") return null; 
    if(filename.startsWith("_")) return null;
    const eventName = filename.split(".");
    eventName.pop();

    const event = await import(`file://${path.resolve(rootPath, filename)}`);
    if(!event.default) return null;
    return {
        name: eventName[0],
        event,
        isCore,
    }
}