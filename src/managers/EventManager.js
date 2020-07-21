/**  
  @namespace Managers
  @module EventManager
  @description Manages the events, and passes fired events to registered event handlers
*/

import path from 'path'
import Logger from '../Logger.js'
let instance;

/**
 * @typedef {Object} RegisteredEvent
 * @property {RegisteredEventConfig} config - Config options
 * @property {types/Event} event - The actual event class
 */

/**
 * @typedef {Object} RegisteredEventConfig
 * @property {boolean} core - Is event a core event?
 * @property {string} name - The registered name of the event
 */ 

/**
 * @typedef {Object} EventList
 * @property {RegisteredEvent[]|string} core - List of all core events
 * @property {RegisteredEvent[]|string} custom - List of all custom events
 */
 


export default class {
    /**
     * Create a new EventManager
     *
     * @param {Client} client The current discord.js client
     */
    constructor(client) {
        this.events = {
            core: new Map(),
            custom: new Map(),
        }
        this.client = client;
        this.logger = new Logger('EventManager');
        instance = this;
    }

    /**
     * Acquire the current instance
     *
     * @static
     * @returns {EventManager} The current instance
     */
     static getInstance() {
        return instance;
    }

    
    /**
     * All events fire this method
     *
     * @param {string} name The name of event
     * @param {...*} args Any discord.js event arguments
     */
    event(name, args) {
        const core = this.getCoreEvent(name);
        const custom = this.getCustomEvent(name);
        if(custom) {
            Promise.resolve(custom.event.before(...args))
            .then(beforeResponse => {
                if(beforeResponse !== true && custom.event.after) {
                    if(core) {
                        Promise.resolve(core.event.every(...args))
                        .then(coreResponse => {
                            if(coreResponse !== true) custom.event.after(...args);
                        }).catch(err => {
                            this.logger.error(`Core Event ${name} errored: ${process.env.PRODUCTION?err.message:err.stack}`)
                        })
                    }else{
                        custom.event.after(...args)
                    }
                }
            })
        }else if(core) {
            Promise.resolve(core.event.every(...args))
            .catch(err => {
                this.logger.error(`Core Event '${name}' errored:\n`, err)
            })
        }
    }


    /**
     * Register an event handler for EventManager
     *
     * @param {string} name Name of the event
     * @param {boolean} [isCore=false] Is the event a core event? (Internal use only)
     * @returns {Promise}
     */
    registerEvent(name, isCore = false) {
        return new Promise(async(resolve,reject) => {
            try {
                const filepath = path.join(this.client.ROOT_DIR, isCore?"src/events":"events",`${name}.js`)
                //delete require.cache[require.resolve(_path)];
                const event_src = await import(`file://${filepath}`);
                const event = new event_src.default(this.client, new Logger(`event/${name}`))
                if(isCore && (typeof event.every !== "function" && typeof event.once !== "function")) {
                    return reject(new Error("Invalid CoreEvent class: Missing valid 'every' or 'once' method"))
                }else if(!isCore && typeof event.before !== "function" && typeof event.after !== "function") {
                    return reject(new Error("Invalid (Custom) Event class: Missing valid 'before' or 'after' method"))
                }
                
                const registeredEvent = {
                    event,
                    config: {
                        core: isCore,
                        name,
                    }
                }
                const type = isCore ? 'core' : 'custom'
                this.events[type].set(name, registeredEvent)
                resolve();
            }catch(err) {
                reject(err);
            }
        })
    }


    /**
     * Attempt to fetch a core event by name
     *
     * @param {string} query The name of the event
     * @returns EventObject
     */
    getCoreEvent(query) {
        return this.events.core.get(query.toLowerCase())
    } 

    /**
     * Attempt to fetch a custom event by name
     *
     * @param {string} query The name of the event
     * @returns EventObject
     */
    getCustomEvent(query) {
        return this.events.custom.get(query.toLowerCase())
    }

    /**
     * Get the total number of core events loaded
     *
     * @readonly
     */
    get coreLoaded() {
        return this.events.core.size;
    }
    
    /**
     * Get the total number of custom events loaded
     *
     * @readonly
     */
    get customLoaded() {
        return this.events.custom.size;
    }

    
    /**
     * Returns all event objects
     *
     * @returns {EventList} List of registered events
     */
    getEvents() {
        return {
            core: this.events.core.values(),
            custom: this.events.custom.values()
        }
    }

    /**
     * Returns all event names registered
     *
     * @returns {EventList} List of registered events names
     */
    getEventsNames() {
        return {
            core: Object.keys(this.events.core.values()),
            custom: Object.keys(this.events.custom.values())
        }
    }

}