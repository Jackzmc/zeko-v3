import Keyv from 'keyv'
import KeyvDatabase from './KeyvDatabase.js'

import { ConnectionSQLDetails } from '../Database';


export default class MySQLDatabase extends KeyvDatabase implements Keyv  {
    private _database: string
    constructor(namespace: string, settings: ConnectionSQLDetails) {
        super(namespace)
        if(!settings.user) settings.user = ""
        if(!settings.password) settings.password = ""
        if(!settings.port) settings.port = 3306
        this._database = settings.database
        const keyv = new Keyv(`mysql://${settings.user}:${settings.password}@${settings.hostname}:${settings.port}/${this._database}`, { namespace });
        keyv.on('error', (err: Error) => {
            this.logger.severe(`KeyV connection error: `, err)
        });
        this.keyv = keyv
    }

    get database() {
        return this._database
    }
}