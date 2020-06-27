import Collection from 'discord.js'
import EventManager from './EventManager.js'
import CommandManager from './CommandManager.js'
import ModuleManager from './ModuleManager.js'

import Logger from '../Logger.js'

//Purpose: Loads all the other managers.

export default class CoreManager {
    //commands
    /*_commands = new Collection()
    _alias = new Collection()
    _events = new Collection()
    _groups = []*/


    constructor(client) {
        const logger = new Logger('CoreManager');
        logger.info('Starting up core. ')
        try {
            CommandManager(client, new Logger("CommandManager"))
        }catch(err) {
            logger.servere('Failed to load up a manager.',err.message)
        }
        //CommandManager.Load()
    }

    
}