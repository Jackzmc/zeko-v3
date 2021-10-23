/**
 @module core:Database
 @description Only used for core atm. Exposes rethinkdb instance.
*/
import 'dotenv/config'
import rethinkdb from 'rethinkdbdash'
import Logger from '../Logger.js';


const HOST = process.env.RETHINKDB_HOST||'127.0.0.1'
const PORT = parseInt(process.env.RETHINKDB_PORT)||28015;
const DB = process.env.RETHINKDB_DB;

const logger = new Logger("Database");

const r = rethinkdb({
    host: HOST,
    port: PORT,
    db: DB,
    silent: true
})

let isFirstLoaded = false

r.getPoolMaster().on('healthy', (healthy: boolean) => {
    if(healthy) {
        if(!isFirstLoaded) {
            logger.success(`Connected to rethinkdb database ${DB} for ${HOST}:${PORT}`)
            isFirstLoaded = true;
        }else{
            logger.info('Pool state is now healthy.')
        }
    }else{
        logger.warn('Pool state has changed to unhealthy')
    }
});

r.tableCreate('settings').run().catch(() => {})
r.tableCreate('data').run().catch(() => {})


export default r;