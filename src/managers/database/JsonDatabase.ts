import Database from './Database.js'

import path from 'path'
import fs from 'fs'

const SAVE_DURATION: number = 1000

export default class JsonDatabase extends Database {
    data: object = {}
    private _filepath: string
    private lastSave: number = 0
    constructor(namespace: string, storagePath?: string) {
        super(namespace)
        if(storagePath) {
            if(!storagePath.includes('/')) {
                if(!storagePath.endsWith(".json")) storagePath = `${storagePath}.json`
                storagePath = path.join(JsonDatabase.getDataDirectory(), storagePath)
            }
            // if(!fs.existsSync(sqlitePath)) throw new Error(`Provided path \"${sqlitePath}\" does not exist`)
        }
        else if(!storagePath) storagePath = path.join(JsonDatabase.getDataDirectory(), `data.json`)
        this._filepath = storagePath
        try {
            this.data = JSON.parse(fs.readFileSync(this._filepath, 'utf-8'))
        } catch(err) {
            if(err.code === 'ENOENT')
                this.data = {}
            else
                throw err
        }
    }

    get storageDir() {
        return path.dirname(this._filepath)
    }

    get filename() {
        return path.basename(this._filepath)
    }

    get filepath() {
        return this._filepath
    }

    get<T>(key: string, defaultValue?: T): T {
        return this.data[`${this.namespace}/${key}`] || defaultValue
    }

    async set(key: string, value: any): Promise<boolean> {
        this.data[`${this.namespace}/${key}`] = value
        this.trySave()
        return true
    }

    async delete(key: string): Promise<boolean> {
        delete this.data[`${this.namespace}/${key}`]
        this.trySave()
        return true
    }

    async clear(): Promise<boolean> {
        this.data = {}
        this.save()
        return true
    }

    async reload() {
        try {
            this.data = JSON.parse(await fs.promises.readFile(this._filepath, 'utf-8'))
        } catch(err) {
            if(err.code === 'ENOENT')
                this.data = {}
            else
                throw err
        }
    }

    save(replacer?: (this: any, key: string, value: any) => any, space?: string | number) {
        fs.writeFileSync(this._filepath, JSON.stringify(this.data, replacer, space))
    }

    private trySave() {
        if(Date.now() - this.lastSave >= SAVE_DURATION) {
            this.save()
            this.lastSave = Date.now()
        }
    }
}