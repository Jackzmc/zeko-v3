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
    constructor(table = 'data') {
        r.tableCreate(table)
        this.r = r;

        fs.mkdir(this.constructor.getDataDirectory(), () => {})

        this.logger = new Logger(`DataManager/${table}`)
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
}