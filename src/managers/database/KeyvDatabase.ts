import Keyv from 'keyv'
import Logger from '../../Logger.js'
import Database from './Database.js'

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ConnectionDetails {
    user?: string
    password?: string
    hostname: string
    port?: number
}

export interface ConnectionSQLDetails extends ConnectionDetails {
    database: string
}


export default abstract class KeyvDatabase extends Database implements Keyv {
    protected keyv: Keyv
    constructor(namespace: string) {
        super(namespace)
    }

    get<T>(key: string, defaultValue?: T): T {
        return this.keyv.get(key) || defaultValue
    }

    set(key: string, value: any, ttlMS?: number): Promise<boolean> {
        return this.keyv.set(key, value, ttlMS)
    }

    setWithTTL(key: string, value: any, ttlMS: number): Promise<boolean> {
        return this.keyv.set(key, value, ttlMS)
    }

    delete(key: string): Promise<boolean> {
        return this.keyv.delete(key)
    }

    clear(): Promise<boolean> {
        return this.keyv.clear()
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
            const subpath = path.resolve(__dirname, '../../../../data');
            fs.mkdir(subpath, { recursive: true }, () => {})
            return subpath
        }
    }
}