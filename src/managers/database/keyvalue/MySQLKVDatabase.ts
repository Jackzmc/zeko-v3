import Keyv from 'keyv'
import KeyvDatabase from './KeyvDatabase.js'

import { ConnectionSQLDetails } from '../Database';


export default class MySQLDatabase extends KeyvDatabase  {
    private _database: string
    constructor(namespace: string, settings: ConnectionSQLDetails) {
        if(!settings.user) settings.user = ""
        if(!settings.password) settings.password = ""
        if(!settings.port) settings.port = 3306
        super(namespace, `mysql://${settings.user}:${settings.password}@${settings.hostname}:${settings.port}/${settings.database}`)
        this._database = settings.database
    }

    get database() {
        return this._database
    }
}