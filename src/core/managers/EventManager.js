/**  
  @module core:managers/EventManager
  @description Manages the events, and passes fired events to registered event handlers
*/

import path from 'path'
import Logger from '../Logger.js'
let logger

export default class {
    constructor(client) {
        this.events = {
            core: new Map(),
            custom: new Map(),
        }
        this.client = client;
        logger = new Logger('EventManager',{ type: 'module' });
    }

    
    /**
     * All events fire this method
     *
     * @param {string} name The name of event
     * @param {*} args Any discord.js event arguments
     */
    event(name, args) {
        if(name.toLowerCase() === "guildmemberspeaking") return;
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
                            logger.error(`Core Event ${name} errored: ${process.env.PRODUCTION?err.message:err.stack}`)
                        })
                    }else{
                        custom.event.after(...args)
                    }
                }
            })
        }else if(core) {
            Promise.resolve(core.event.every(...args))
            .catch(err => {
                logger.error(`Core Event ${name} errored: ${err.message}`)
            })
        }
    }


    /**
     * Register an event handler for EventManager
     *
     * @param {string} name Name of the event
     * @param {boolean} isCore Is the event a core event? (Internal use only)
     * @returns Promise<>
     */
    registerEvent(name, isCore) {
        const _this = this;
        return new Promise(async(resolve,reject) => {
            try {
                const filepath = path.join(_this.client.ROOT_DIR, isCore?"src/events":"events",`${name}.js`)
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
                _this.events[type].set(name, registeredEvent)
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
        return this.events.core.get(query)
    } 

    /**
     * Attempt to fetch a custom event by name
     *
     * @param {string} query The name of the event
     * @returns EventObject
     */
    getCustomEvent(query) {
        return this.events.custom.get(query)
    }

    
    /**
     * Returns all events, either name or full object.
     *
     * @param {boolean} [namesOnly=true] Should only the names of the events be provided
     * @returns Array[string] or Array[EventObject]
     */
    getEvents(namesOnly = true) {
        if(namesOnly) {
            return {
                core:Object.keys(this.events.core.values()),
                custom:Object.keys(this.events.custom.values())
            }
        }else{
            return {
                core: this.events.core.values(),
                custom: this.events.custom.values()
            }
        }
    }

}