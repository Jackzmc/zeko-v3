/**
 @namespace Managers
 @module DataManager
 @description WIP
*/
import r from '../core/Database.js'
import Logger from '../Logger.js'

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class DataManager {
    r: any;
    #logger: Logger;
    #table: string
    /**
     *  Creates a new rethinkdb instance, with table selected
     * @param {!string} table Name of the table to fetch
     * @returns {RethinkDBInstance}
     */
    constructor(table: string = 'data') {
        this.#table = table;
        this.r = r();
        this.r.tableCreate(table)
        fs.mkdir(DataManager.getDataDirectory(), () => {})

        this.#logger = new Logger(`DataManager/${table}`)
    }

    get instance(): any {
        return this.r.table(this.#table)
    }

    get poolCount() {
        return this.r.getPoolMaster().getLength()
    }

    /**
     * Returns internal rethinkdb instance. Useful for using row() method.
     *
     * 
     */
    getInternalRethink(): any {
        return this.r;
    }


    /**
     * Gets the root data directory or a subdirectory
     * @param {string} [subDirName] A subdirectory to get the path for
     * @param {boolean} [autoCreate] Should the subfolder be autocreated?
     */
    static getDataDirectory(subDirName?: string, autoCreate: boolean = false) {
        if(subDirName) {
            const subpath = path.join(this.getDataDirectory(), subDirName.toLowerCase());
            if(autoCreate) {
                fs.mkdir(subpath, { recursive: true }, () => {})
            }
            return subpath;
        }else{
            return path.resolve(__dirname, '../../../data');
        }
    }
}