/** 
@module core:loaders/EventLoader
@description Loads all event files
*/
import { promises as fs } from 'fs';
import path from 'path'

import EventManager, { RegisteredCoreEvent, RegisteredCustomEvent } from '../../managers/EventManager.js'
import Logger from '../../Logger.js';
import { Client } from 'discord.js';

const folders = ['src/events','events'];
const IGNORED_EVENTS = ['raw','debug']

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
    async loadEvents() {
        const promises: Promise<RegisteredCoreEvent | RegisteredCustomEvent>[] = [];
        for(let i = 0; i < folders.length; i++) {
            const isCoreEvent = i == 0;
            const folder = folders[i];
            const filepath = path.join(this.#client.ROOT_DIR,folder);
            await fs.readdir(filepath)
            .then(files => {
                files.forEach(file => {
                    if(file.split(".").slice(-1)[0] !== "js") return; //has to be .js file *cough* folder that doesnt exist *cough*
                    const eventName = file.split(".");
                    eventName.pop();
                    try {
                        //TODO: refactor to just have this.#manager.register((Core)Event, name);
                        import(`file://${filepath}/${file}`)
                        .then(eventObject => {
                            //Test for invalid. Only log if there IS content (don't error on empty files)
                            if(!eventObject || !eventObject.default) {
                                if(eventObject.default && typeof eventObject.default !== 'function') {
                                    const prefix = isCoreEvent ? '' : 'Custom '
                                    this.#logger.warn(`${prefix}Event ${file} is not setup correctly!`);
                                }
                                return;
                            }

                            promises.push(this.#manager.registerEvent(eventName[0], isCoreEvent))
                        })
                        //delete require.cache[require.resolve(`${filepath}/${file}`)];
                    }catch(err) {
                        this.#logger.error(`Event ${file} had an error:\n`, err);
                    }
                });
            }).catch(err => {
                if(err.code === "ENOENT") {
                    this.#logger.warn(`'${folder}' directory does not exist.`)
                }else{
                    this.#logger.error(`Loading${folder} failed:\n`, err);
                }
            })
        }
        Promise.all(promises)
        .then(() => {
            this.#logger.success(`Loaded ${this.#manager.coreLoaded} core events, ${this.#manager.customLoaded} custom events`)
        })
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