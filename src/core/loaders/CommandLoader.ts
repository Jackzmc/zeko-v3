/**
 @module core:loaders/CommandLoader
 @description Loads the commands from /src/commands and /commands and loads them in [CommandManager]{@link managers/CommandManager}
*/
import Chokidar from 'chokidar'
import { Client } from 'discord.js';
import { promises as fs } from 'fs';
import path from 'path'
import Logger from '../../Logger'

import CommandManager from '../../managers/CommandManager.js'

const folders = ['src/commands','commands'];

export default class{ 
    #client: Client;
    #logger: Logger;
    #manager: CommandManager
    constructor(client: Client, logger: Logger) {
        if(!process.env.DISABLE_LOADER_HOT_RELOAD) {
            //this.setupWatcher();
        }
        this.#client = client;
        this.#logger = logger;
        this.#manager = new CommandManager(client)
        client.managers.CommandManager = this.#manager;
    }
    async loadCommands() {
        const promises = [];
        for(let i=0 ; i < folders.length; i++) {
            const isCore = i == 0;
            const folder = folders[i];
            const filepath = path.join(this.#client.ROOT_DIR, folder);
            await fs.readdir(filepath, { withFileTypes:true }) //read directory, returns directs which can check if folder, to support cmd groups
            .then(files => {
                files.forEach(dirent => {
                    if(dirent.isDirectory()) {
                        const sub_filepath = path.join(filepath, dirent.name);
                        fs.readdir(sub_filepath)
                        .then(sub_files => {
                            sub_files.forEach(file => {
                                //ignore files that arent *.js, or have _ prefixed
                                promises.push(this.testCommand(sub_filepath, file, isCore, dirent.name))
                            })
                        })
                    }else{
                        //same as above, dont run if not *.js or prefixed with _
                        const file = dirent.name;
                        promises.push(this.testCommand(filepath, file, isCore, "default"))
                    }
                });
            })
            .catch(err => {
                if(err.code === 'ENOENT') {
                    this.#logger.warn(`${folder} directory does not exist.`)
                }else{
                    this.#logger.error(`Loading ${folder} failed:\n`, err);
                }
            })
        }
        
        Promise.all(promises)
        .then(() => {
            this.#logger.success(`Loaded ${this.#manager.commandsCount} commands and ${this.#manager.aliasesCount} aliases`)
        })
    }
    private async testCommand(filepath: string, file: string, isCore: boolean, group?: string) {
        //ignore files that arent *.js, or have _ prefixed
        if(file.split(".").slice(-1)[0] !== "js") return;
        if(file.startsWith("_")) return;
        try {
            const commandObject = await import(`file://${filepath}/${file}`);
            //Test for invalid. Only log if there IS content (don't error on empty files)
            if(!commandObject || !commandObject.default) {
                if(commandObject.default && typeof commandObject.default !== 'function') {
                    const prefix = isCore ? '' : 'Custom '
                    this.#logger.warn(`${prefix}Command ${file} is not setup correctly!`);
                }
                return;
            }
    
            const filename = file.split(".").shift();
    
            //this is probably still broken. Event manager doesnt care about .once. property
            //registerCommand(filename, isCore, [opt] groupName)
            return this.#manager.registerCommand(filename, isCore, group)
            .then(() => {
                return isCore ? {core: true} : {custom: true}
            })
            .catch(err => {
                this.#logger.error(`CommandManager failed to load command ${file}:\n`, err)
            })
        }catch(err) {
            this.#logger.error(`Command ${file} had an error:\n`, err)
            return Promise.reject(err);
        }
    }
}