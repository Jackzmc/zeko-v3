/**
 @namespace Managers
 @module SettingsManager
 @description An interface to change/view settings
*/
import Logger from '../Logger.js'
import r from '../core/Database.js'

export default class{
    /**
     *  Creates a new SettingsManager instance
     * @param {!Client} client A Discord.JS client instance
     */
    constructor(client) {
        this.client = client;
        this.logger = new Logger('SettingsManager');
    }


    /**
     * Acquire a {@link Settings} class
     *
     * @param {!string} module The name of the module
     */
    getSettings(module) {
        const settings = new Settings(module);
    }

}

/**
 * Represents an individual setting category
 *
 * @class Settings
 */
class Settings {
    constructor(module) {
        this.module = module;
    }

    /**
     * Fetch an option from the database
     *
     * @param {string} name Name of the property
     * @returns {RethinkDBResult}
     */
    get(name) {
        return r.table('settings').get(`${this.module}.${name}`).run()
    }

    /**
     * Sets a property's value
     *
     * @param {string} name Name of the property
     * @param {*} value The value to set for property
     * @returns {RethinkDBResult}
     */
    set(name, value) {
        return r.table('settings').get(`${this.module}`, {[name]: value}).run()
    }
}

/*
SettingsManager.getInstance().getSettings("command")
from cmd:
this.getSettings() => ^ above
this.getSettings().getString()

*/