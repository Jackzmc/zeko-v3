import Keyv from 'keyv'
import Logger from '../../Logger.js'

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


export default abstract class Database{
    protected logger: Logger
    protected namespace: string
    constructor(namespace: string) {
        this.namespace = namespace
        this.logger = new Logger(`DataManager/${namespace}`)
    }

    abstract get<T>(key: string, defaultValue?: T): Promise<T>

    abstract set(key: string, value: any, ttlMS?: number): Promise<boolean>

    abstract delete(key: string): Promise<boolean>

    abstract clear(): Promise<boolean>

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