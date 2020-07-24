/**
 @namespace Managers
 @module DataManager
 @description WIP
*/
import r from '../core/Database.js'
import Logger from '../Logger.js'

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class {
    /**
     *  Creates a new rethinkdb instance, with table selected
     * @param {!string} table Name of the table to fetch
     * @returns {RethinkDBInstance}
     */
    constructor(table = 'data') {
        r.tableCreate(table)
        this.r = r;
        const tableInstance = r.table(table)

        fs.mkdir(this.constructor.getDataDirectory(), () => {})

        this.logger = new Logger(`DataManager/${table}`)
        return tableInstance;
    }


    /**
     * Returns internal rethinkdb instance. Useful for using row() method.
     *
     * @returns 
     */
    getInternalRethink() {
        return this.r;
    }

    /**
     * Gets the root data directory or a subdirectory
     * @param {string} [subDirName] A subdirectory to get the path for
     * @param {boolean} [autoCreate] Should the subfolder be autocreated?
     */
    static getDataDirectory(subDirName, autoCreate = false) {
        if(subDirName) {
            const subpath = path.join(this.getDataDirectory(), subDirName.toLowerCase());
            if(autoCreate) {
                fs.mkdir(subpath, { recursive: true }, () => {})
            }
            return subpath;
        }else{
            return path.resolve(__dirname, '../../data');
        }
    }


    /**
     * Get the guild's rethinkdb instance
     *
     * @param {string} guildID discord.js client ID
     * @returns {RethinkDBInstance}
     */
    static getGuildData(guildID) {
        return this.r.db('data').get(guildID)
    }

    /**
     * Get the global data rethinkdb instance
     *
     * @returns {RethinkDBInstance}
     */
     static getGlobalData() {
        return this.r.db('data').get("global")
    }
}