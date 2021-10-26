import Keyv from 'keyv'
import Logger from '../Logger.js'

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class SqliteDataManager implements Keyv {
    private logger: Logger
    keyv: Keyv
    private _filepath: String
    constructor(namespace: string, sqlitePath?: string) {
        this.logger = new Logger(`DataManager/${namespace}`)
        if(sqlitePath && !fs.existsSync(sqlitePath)) {
            throw new Error(`Provided path \"${sqlitePath}\" does not exist`)
        }
        else if(!sqlitePath) sqlitePath = path.join(SqliteDataManager.getDataDirectory(), `data.db`)
        this._filepath = sqlitePath
        const keyv = new Keyv(`sqlite://${sqlitePath}`, { namespace });
        keyv.on('error', (err: Error) => {
            this.logger.severe(`KeyV connection error: `, err)
        });
        this.keyv = keyv
    }

    get filepath() {
        return this._filepath
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