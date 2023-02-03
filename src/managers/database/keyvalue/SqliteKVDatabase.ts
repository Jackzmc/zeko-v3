import Keyv from 'keyv'
import KeyvDatabase from './KeyvDatabase.js'

import path from 'path'
import fs from 'fs'

export default class SqliteDatabase extends KeyvDatabase  {
    private _filepath: string
    constructor(namespace: string, sqlitePath?: string) {
        if(sqlitePath) {
            if(!sqlitePath.includes('/')) {
                if(!sqlitePath.endsWith(".db")) sqlitePath = `${sqlitePath}.db`
                sqlitePath = path.join(SqliteDatabase.getDataDirectory(), sqlitePath)
            }
            // if(!fs.existsSync(sqlitePath)) throw new Error(`Provided path \"${sqlitePath}\" does not exist`)
        }
        else if(!sqlitePath) sqlitePath = path.join(SqliteDatabase.getDataDirectory(), `data.db`)
        super(namespace, `sqlite://${sqlitePath}`)
        this._filepath = sqlitePath
    }

    get filename() {
        return path.basename(this._filepath)
    }

    get filepath() {
        return this._filepath
    }
    
    async getFilesize() {
        return (await fs.promises.stat(this._filepath)).size
    }
}