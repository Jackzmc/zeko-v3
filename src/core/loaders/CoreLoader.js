import Collection from 'discord.js'
import EventLoader from './EventLoader.js'
import CommandLoader from './CommandLoader.js'
import ModuleLoader from './ModuleLoader.js'
import Logger from '../Logger.js'
import { promises as fs } from 'fs';

//Purpose: Loads all the other managers.

export default class CoreManager {
    //commands
    /*_commands = new Collection()
    _alias = new Collection()
    _events = new Collection()
    _groups = []*/


    constructor(client) {
        const logger = new Logger('CoreManager');
        try {
            //TODO: Wait for moduleloader to finish, load cmd/event, finally send token
            internalCustomCheck()
            ModuleLoader.init(client, new Logger("ModuleLoader"))

            CommandLoader.init(client, new Logger("CommandLoader"))
            EventLoader.init(client, new Logger("EventLoader"))

            client.login(process.env.DISCORD_BOT_TOKEN)
        }catch(err) {
            logger.servere('Manager loading failure:', err)
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