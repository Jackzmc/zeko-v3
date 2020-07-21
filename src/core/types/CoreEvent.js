/**
 @module core:types/CoreEvent
 @desc The CoreEvent class, core events inherit
*/
export default class {

    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
    }


    /**
     * Is fired when an event is sent.
     *
     * @param {...*} any Any discord.js event properties
     */
    event() {
        
    }

    /**
     * Is fired when an event is sent.
     *
     * @param {...*} any Any discord.js event properties
     */
     once() {

     }
}