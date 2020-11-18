/**  
  @namespace Managers
  @module EventManager
  @description Manages the events, and passes fired events to registered event handlers
*/

import { Client } from 'discord.js';
import path from 'path'
import Logger from '../Logger.js'
import Event from '../types/Event.js';
import CoreEvent from '../core/types/CoreEvent.js'
let instance;

export interface RegisteredCoreEvent {
    config: RegisteredEventConfig,
    event: CoreEvent
}
export interface RegisteredCustomEvent {
    config: RegisteredEventConfig
    event: Event
}
export interface RegisteredEventConfig {
    core: boolean
    name: string
}


export default class EventManager {
    #client: Client
    #logger: Logger
    #events: {
        core: Map<string, RegisteredCoreEvent>,
        custom: Map<string, RegisteredCustomEvent>
    }
    /**
     * Create a new EventManager
     *
     * @param {Client} client The current discord.js client
     */
    constructor(client: Client) {
        this.#events = {
            core: new Map<string, RegisteredCoreEvent>(),
            custom: new Map<string, RegisteredCustomEvent>()
        }
        this.#client = client;
        this.#logger = new Logger('EventManager');
        instance = this;
    }

    /**
     * Acquire the current instance
     *
     * @static
     * @returns {EventManager} The current instance
     */
     static getInstance(): EventManager {
        return instance;
    }

    
    /**
     * All events fire this method
     *
     * @param {string} name The name of event
     * @param {...*} args Any discord.js event arguments
     */
    event(name: string, args: any[]) {
        const core: RegisteredCoreEvent = this.getCoreEvent(name);
        const custom: RegisteredCustomEvent = this.getCustomEvent(name);
        if(custom) {
            Promise.resolve(custom.event.before(...args) as unknown)
            .then(beforeResponse => {
                if(beforeResponse !== true && custom.event.after) {
                    if(core) {
                        Promise.resolve(core.event.every(...args) as unknown)
                        .then(coreResponse => {
                            if(coreResponse !== true) custom.event.after(...args);
                        }).catch(err => {
                            this.#logger.error(`Core Event ${name} errored: ${process.env.PRODUCTION?err.message:err.stack}`)
                        })
                    }else{
                        custom.event.after(...args)
                    }
                }
            })
        }else if(core) {
            Promise.resolve(core.event.every(...args) as unknown)
            .catch(err => {
                this.#logger.error(`Core Event '${name}' errored:\n`, err)
            })
        }
    }


    /**
     * Register an event handler for EventManager
     *
     * @param {string} name Name of the event
     * @param {boolean} [isCore=false] Is the event a core event? (Internal use only)
     * @returns {Promise<RegisteredCoreEvent | RegisteredCustomEvent}
     */
    registerEvent(name: string, isCore: boolean = false) : Promise<RegisteredCoreEvent | RegisteredCustomEvent> {
        return new Promise((resolve,reject) => {
            const filepath = path.join(this.#client.ROOT_DIR, isCore?"src/events":"events",`${name}.js`)
            //delete require.cache[require.resolve(_path)];
            import(`file://${filepath}`)
            .then(event_src => {
                if(isCore) {
                    const event: CoreEvent = new event_src.default(this.#client, new Logger(`event/${name}`))
                    const registeredEvent = {
                        event, 
                        config: {
                            core: isCore,
                            name
                        }
                    }
                    this.#events.core.set(name, registeredEvent);
                    resolve(registeredEvent)
                }else{
                    const event: Event = new event_src.default(this.#client, new Logger(`event/${name}`))
                    const registeredEvent = {
                        event, 
                        config: {
                            core: isCore,
                            name
                        }
                    }
                    this.#events.custom.set(name, registeredEvent);
                    resolve(registeredEvent)
                }
            })
        })
    }


    /**
     * Attempt to fetch a core event by name
     *
     * @param {string} query The name of the event
     * @returns EventObject
     */
    getCoreEvent(query: string) : RegisteredCoreEvent {
        return this.#events.core.get(query.toLowerCase())
    } 

    /**
     * Attempt to fetch a custom event by name
     *
     * @param {string} query The name of the event
     * @returns EventObject
     */
    getCustomEvent(query: string) : RegisteredCustomEvent {
        return this.#events.custom.get(query.toLowerCase())
    }

    /**
     * Get the total number of core events loaded
     *
     * @readonly
     */
    get coreLoaded() : number {
        return this.#events.core.size;
    }
    
    /**
     * Get the total number of custom events loaded
     *
     * @readonly
     */
    get customLoaded() :number {
        return this.#events.custom.size;
    }

    
    /**
     * Returns all event objects
     *
     * @returns {EventList} List of registered events
     */
    getEvents() : { core: RegisteredCoreEvent[], custom: RegisteredCustomEvent[] } {
        return {
            core: Array.from(this.#events.core.values()),
            custom: Array.from(this.#events.custom.values())
        }
    }

    /**
     * Returns all event names registered
     *
     * @returns {EventList} List of registered events names
     */
    getEventsNames() : { core: string[], custom: string[] } {
        return {
            core: Object.keys(this.#events.core),
            custom: Object.keys(this.#events.custom)
        }
    }

    exit(waitable: boolean) {
        return new Promise((resolve) => {
            const promises = [];
            this.#events.core.forEach(event => {
                if(event.event.exit) {
                    promises.push(Promise.resolve(event.event.exit(waitable)))
                }
            })
            this.#events.custom.forEach(event => {
                if(event.event.exit) {
                    promises.push(Promise.resolve(event.event.exit(waitable)))
                }
            })
            Promise.all(promises)
            .then(() => resolve())
        })
    }

}