import { Client } from 'discord.js';
import Logger from '../Logger.js';

export interface Registered {
    group?: string
    isCore: boolean
}

export default abstract class Manager {
    /**
     * Create a new EventManager
     *
     * @param {Client} client The current discord.js client
     */
    protected client: Client;
    protected logger: Logger;

    constructor(client: Client, type: string) {
        this.client = client;
        this.logger = new Logger(type);
    }

}