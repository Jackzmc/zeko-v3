/**
 * @module core:loaders/CoreLoader
 * @desc Loads all the other loaders and setups the client.
 */

import EventLoader from './EventLoader.js'
import CommandLoader from './CommandLoader.js'
import ModuleLoader from './ModuleLoader.js'
import Logger from '../../Logger.js'
import { promises as fs } from 'fs';

export default class CoreLoader {
    constructor(client) {
        const logger = new Logger('CoreLoader');
        try {
            //TODO: Wait for moduleloader to finish, load cmd/event, finally send token
            internalCustomCheck()
            new ModuleLoader(client, new Logger("ModuleLoader")).loadModules()
            .then(() => {
                new CommandLoader(client, new Logger("CommandLoader"))
                new EventLoader(client, new Logger("EventLoader"))
            })

            client.login(process.env.DISCORD_BOT_TOKEN)
        }catch(err) {
            logger.servere('Manager loading failure:\n', err)
        }
        //CommandManager.Load()
    }

    
}

function internalCustomCheck() {
    return new Promise((resolve,reject) => {
        const folders = ["commands","events","modules"]
        folders.forEach(v => {
            fs.readdir(`./${v}`)
            .then(() => {
                resolve();
            })
            .catch(() => {
                try {
                    fs.mkdir(`./${v}`)
                }catch(err) {
                    reject(err);
                }
            })
        })
    })
}