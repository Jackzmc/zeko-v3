/**
 @module core:Database
 @description Only used for core atm. Exposes rethinkdb instance.
*/
import 'dotenv/config.js'
import rethinkdb from 'rethinkdbdash'
import Logger from '../Logger.js';


const HOST = process.env.RETHINKDB_HOST||'127.0.0.1'
const PORT = parseInt(process.env.RETHINKDB_PORT)||28015;
const DB = process.env.RETHINKDB_DB || "zeko";

let _db;

export default function() {
    if(_db) return _db;
    const r = rethinkdb({
        host: HOST,
        port: PORT,
        db: DB,
        silent: true
    })

    r.tableCreate('settings').run().catch(() => {})
    r.tableCreate('data').run().catch(() => {})

    const logger = new Logger("Database");
    logger.info(`Connecting to rethinkdb on ${HOST}:${PORT} for database ${DB}`)

    _db = r
    return r;
}