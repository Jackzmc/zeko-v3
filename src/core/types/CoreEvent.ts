import { Client } from "discord.js";
import Logger from '../../Logger.js'
import { EventConfig } from '../../types/Event';
import Core from "../Core.js";
/**
 @module core:types/CoreEvent
 @desc The CoreEvent class, core events inherit
*/
export default class {
    protected client: Client;
    protected logger: Logger;
    protected core: Core
    constructor(client: Client, logger: Logger) {
        this.client = client;
        this.logger = logger;
        this.core = Core.getInstance()
    }

    // Called when everything is ready (discord.js ready and zeko core is ready)
    ready(core?: Core): Promise<any> | any {

    }

    onReady(core: Core) {
        this.core = Core.getInstance()
        return this.ready(core)
    }

    config?(): Promise<Partial<EventConfig>> | Partial<EventConfig> | null;

    /**
     * Is fired when an event is sent.
     *
     * @param {...*} any Any discord.js event properties
     */
    every(...args: any[]) : Promise<boolean> | boolean {
        return true
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