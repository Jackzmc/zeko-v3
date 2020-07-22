/**
 @namespace Managers
 @module SettingsManager
 @description An interface to change/view settings
*/
import Logger from '../Logger.js'
import r from '../core/Database.js'

export default class {
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
    getSettings(guildID, module) {
        const settings = new Settings(guildID, module);
        return settings;
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
        this.db = r.db('zeko').table('settings');
    }

    /**
     * Fetch an individual setting from the database
     *
     * @param {string} guildID A guildID to manage settings for
     * @param {string} name Name of the setting
     * @returns {Promise.<Object>}
     */
    get(guildID, name) {
        return new Promise((resolve, reject) => {
            this.db.get(guildID)(this.module)(name).run()
            .then(result => resolve(result))
            .catch(err => reject(err))
        })
    }

    /**
     * Sets an individual settings's value
     *
     * @param {string} guildID A guildID to manage settings for
     * @param {string} name Name of the setting
     * @param {*} value The new value for the setting
     * @returns {Promise.<Object>}
     */
    set(guildID, name, value) {
        return new Promise((resolve, reject) => {
            this.db.get(guildID).replace({[this.module]: {[name]: value}, guild: guildID}).run()
            .then(result => resolve(result))
            .catch(err => reject(err))
        })
    }

    /**
     * Fetches all settings for category
     *
     * @param {string} guildID A guildID to manage settings for
     * @returns {Promise.<Object>}
     */
    list(guildID) {
        return new Promise((resolve, reject) => {
            this.db.get(guildID)(this.module).run()
            .then(result => resolve(result))
            .catch(err => reject(err))
        })
    }
}