import Keyv from 'keyv'
import Database from './Database.js'

import path from 'path'
import fs from 'fs'

export default class SqliteDatabase extends Database implements Keyv  {
    keyv: Keyv
    private _filepath: String
    constructor(namespace: string, sqlitePath?: string) {
        super(namespace)
        if(sqlitePath && !fs.existsSync(sqlitePath)) {
            throw new Error(`Provided path \"${sqlitePath}\" does not exist`)
        }
        else if(!sqlitePath) sqlitePath = path.join(SqliteDatabase.getDataDirectory(), `data.db`)
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
}