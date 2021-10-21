import { Client } from "discord.js";
import Logger from '../../Logger.js'
import { EventConfig } from '../../types/Event';
/**
 @module core:types/CoreEvent
 @desc The CoreEvent class, core events inherit
*/
export default class {
    protected client: Client;
    protected logger: Logger;
    constructor(client: Client, logger: Logger) {
        this.client = client;
        this.logger = logger;
    }

    config?(): Promise<Partial<EventConfig>> | Partial<EventConfig> | null;

    /**
     * Is fired when an event is sent.
     *
     * @param {...*} any Any discord.js event properties
     */
    every(...args: any[]) : Promise<boolean> | void {
        
    }

    /**
     * Is fired when an event is sent.
     *
     * @param {...*} any Any discord.js event properties
     */
    once(...args: any[]) : void{

    }

    exit?(waitable?: boolean): void | Promise<any>;
}