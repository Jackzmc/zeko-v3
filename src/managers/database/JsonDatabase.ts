import Database from './Database.js'

import path from 'path'
import fs from 'fs'

const SAVE_DURATION: number = 100

export default class JsonDatabase extends Database {
    data: object = {}
    private _filepath: string
    private lastSave: number
    constructor(namespace: string, storagePath?: string) {
        super(namespace)
        if(storagePath) {
            if(!storagePath.includes('/')) {
                if(!storagePath.endsWith(".db")) storagePath = `${storagePath}.json`
                storagePath = path.join(JsonDatabase.getDataDirectory(), storagePath)
            }
            // if(!fs.existsSync(sqlitePath)) throw new Error(`Provided path \"${sqlitePath}\" does not exist`)
        }
        else if(!storagePath) storagePath = path.join(JsonDatabase.getDataDirectory(), `data.json`)
        this._filepath = storagePath
        try {
            this.data = JSON.parse(fs.readFileSync(this._filepath, 'utf-8'))
        } catch(err) {
            this.data = {}
        }
    }

    get filepath() {
        return this._filepath
    }

    get<T>(key: string, defaultValue?: T): T {
        return this.data[key] || defaultValue
    }

    async set(key: string, value: any): Promise<boolean> {
        this.data[key] = value
        this.trySave()
        return true
    }

    async delete(key: string): Promise<boolean> {
        delete this.data[key]
        this.trySave()
        return true
    }

    async clear(): Promise<boolean> {
        this.data = {}
        this.save()
        return true
    }

    save() {
        fs.writeFileSync(this._filepath, JSON.stringify(this.data))
    }

    private trySave() {
        if(Date.now() - this.lastSave >= SAVE_DURATION) {
            this.save()
            this.lastSave = Date.now()
        }
    }
}