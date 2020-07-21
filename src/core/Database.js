/**
 @module core:Database
 @description Only used for core atm. Exposes rethinkdb instance.
*/
import rethinkdb from 'rethinkdbdash'

const r = rethinkdb({
    host: process.env.RETHINKDB_HOST,
    port: parseInt(process.env.RETHINKDB_PORT)||28015,
    db: process.env.RETHINKDB_DB,
    silent: true
})

r.tableCreate('settings').run().catch(() => {})
r.tableCreate('data').run().catch(() => {})

export default function(client, logger) {
    const port = parseInt(process.env.RETHINKDB_PORT)||28015;
    logger.info(`Connecting to rethinkdb on ${process.env.RETHINKDB_HOST}:${port} for database ${process.env.RETHINKDB_DB}`)
    return r
}