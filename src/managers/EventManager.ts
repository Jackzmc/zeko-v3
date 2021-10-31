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
import Manager from './Manager.js';
import Core from '../core/Core.js';

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

// Will automatically add intents if any event from list registered
const eventRequiredIntents = {
    "messageCreate": []
}


export default class EventManager extends Manager {
    private static instance: EventManager
    private core: Core
    private events: {
        core: Map<string, RegisteredCoreEvent>,
        custom: Map<string, RegisteredCustomEvent>
    }
    #intents: number = 0
    /**
     * Create a new EventManager
     *
     * @param {Client} client The current discord.js client
     */
    constructor(client: Client) {
        super(client, 'EventManager')
        this.events = {
            core: new Map<string, RegisteredCoreEvent>(),
            custom: new Map<string, RegisteredCustomEvent>()
        }
        EventManager.instance = this;
    }

    /**
     * Acquire the current instance
     *
     * @static
     * @returns {EventManager} The current instance
     */
     static getInstance(): EventManager {
        return this.instance;
    }

    
    /**
     * All events fire this method
     *
     * @param {string} name The name of event
     * @param {...*} args Any discord.js event arguments
     */
    //Optimize, to use list of hooks per discord event? 
    async event(name: string, args: any[]) {
        const core: RegisteredCoreEvent = this.getCoreEvent(name);
        const custom: RegisteredCustomEvent = this.getCustomEvent(name);
        if(custom) {
            const response = await custom.event.before(...args)
            if(!response) return;
        }
        if(core) {
            const response = await core.event.every(...args)
            if(!response) return
        }
        if(custom) {
            await custom.event.after(...args)
        }
    }

    /**
     * Register an event handler for EventManager
     *
     * @param {string} name Name of the event
     * @param {boolean} [isCore=false] Is the event a core event? (Internal use only)
     * @returns {Promise<RegisteredCoreEvent | RegisteredCustomEvent}
     */

    async register(eventClass: any, name: string, isCore: boolean = false) : Promise<RegisteredCoreEvent | RegisteredCustomEvent>{
        if(!eventClass.default || typeof eventClass.default !== "function") {
            throw new Error('Invalid moduleClass: must be a class.')
        }
        const registeredName = name.toLowerCase().replace('.js', '')
        if(isCore) {
            const event: CoreEvent = new eventClass.default(this.client, new Logger(`event/${name}`))
            const registeredEvent: RegisteredCoreEvent = {
                event,
                config: {
                    core: isCore,
                    name: registeredName
                }
            }
            this.events.core.set(registeredName, registeredEvent);
            if(event.config) {
                const config = await event.config()
            }
            return registeredEvent;
        }else{
            const event: Event = new eventClass.default(this.client, new Logger(`event/${name}`))
            const registeredEvent: RegisteredCustomEvent = {
                event,
                config: {
                    core: isCore,
                    name: registeredName
                }
            }
            this.events.custom.set(registeredName, registeredEvent);
            if(event.config) {
                const config = await event.config()
            }
            return registeredEvent;
        }
    }

    async _ready() {
        if(this.core) throw new Error("ready has already been called")
        this.core = Core.getInstance()
        const promises = []
        for(const registered of this.events.core.values()) {
            promises.push(registered.event.onReady(this.core))
        }
        for(const registered of this.events.custom.values()) {
            promises.push(registered.event.onReady(this.core))
        }
        return await Promise.allSettled(promises)
    }


    /**
     * Attempt to fetch a core event by name
     *
     * @param {string} query The name of the event
     * @returns EventObject
     */
    getCoreEvent(query: string) : RegisteredCoreEvent {
        return this.events.core.get(query.toLowerCase())
    } 

    /**
     * Attempt to fetch a custom event by name
     *
     * @param {string} query The name of the event
     * @returns EventObject
     */
    getCustomEvent(query: string) : RegisteredCustomEvent {
        return this.events.custom.get(query.toLowerCase())
    }


    /**
     * Attempt to fetch a core event, if does not exist, then custom event
     *
     * @param {string} query Name of the event
     * @returns {(RegisteredCoreEvent | RegisteredCustomEvent)}
     * @memberof EventManager
     */
    get(query: string): RegisteredCoreEvent | RegisteredCustomEvent {
        return this.events.core.get(query.toLowerCase()) || this.events.custom.get(query.toLowerCase());
    }


    /**
     * Remove an event from manager, events will not be passed to it. Removes from core, if does not exist, then custom
     *
     * @param {string} query The event name
     * @returns {boolean} If event was removed
     * @memberof EventManager
     */
    async unregister(query: string): Promise<boolean> {
        query = query.replace(/.js$/, '');
        const core = this.events.core.get(query);
        const custom = this.events.custom.get(query);
        if(core) {
            await core.event.exit(true)
            return this.events.core.delete(query);
        }else if(custom) {
            await custom.event.exit(true)
            return this.events.custom.delete(query);
        }else{
            return null;
        }
    }

    /**
     * Get the total number of core events loaded
     *
     * @readonly
     */
    get coreLoaded(): number {
        return this.events.core.size;
    }
    
    /**
     * Get the total number of custom events loaded
     *
     * @readonly
     */
    get customLoaded(): number {
        return this.events.custom.size;
    }
    
    /**
     * Returns all event objects
     *
     * @returns {EventList} List of registered events
     */
    getEvents() : { core: RegisteredCoreEvent[], custom: RegisteredCustomEvent[] } {
        return {
            core: Array.from(this.events.core.values()),
            custom: Array.from(this.events.custom.values())
        }
    }

    /**
     * Returns all event names registered
     *
     * @returns {EventList} List of registered events names
     */
    getEventsNames() : { core: string[], custom: string[] } {
        return {
            core: Object.keys(this.events.core),
            custom: Object.keys(this.events.custom)
        }
    }

    async exit(waitable: boolean): Promise<void[]>  {
        const promises = [];
        this.events.core.forEach(event => {
            if(event.event.exit) {
                promises.push(Promise.resolve(event.event.exit(waitable)))
            }
        })
        this.events.custom.forEach(event => {
            if(event.event.exit) {
                promises.push(Promise.resolve(event.event.exit(waitable)))
            }
        })
        return Promise.all(promises)
    }

}