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
     * Acquire a {@link SettingsCategory} class
     *
     * @param {!string} category The name of the category
     */
    getCategory(category) {
        return new SettingsCategory(category);
    }

}

/**
 * Represents an individual setting category
 *
 * @class SettingsCategory
 */
class SettingsCategory {
    /**
     * Create a new settings category
     * @param {string} category Name of the category
     */
    constructor(category) {
        this.module = category;
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