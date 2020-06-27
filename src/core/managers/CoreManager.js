import Collection from 'discord.js'
import EventManager from './EventManager.js'
import CommandManager from './CommandManager.js'
import ModuleManager from './ModuleManager.js'
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
            internalCustomCheck()
            CommandManager.init(client, new Logger("CommandManager"))
            EventManager.init(client, new Logger("EventManager"))
            ModuleManager.init(client, new Logger("ModuleManager"))
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