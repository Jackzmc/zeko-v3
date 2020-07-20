/** 
@module core:loaders/ModuleLoader
@description Loads all module files
*/
import { Collection } from "discord.js"
import Chokidar from 'chokidar'
import { promises as fs } from 'fs';
import path from 'path'

import ModuleManager from '../managers/ModuleManager.js'

const folders = ['src/modules','modules'];


export default class {
    constructor(client, logger) {
        //this.setupWatcher()
        this.client = client;
        this.logger = logger;

        this.manager = new ModuleManager(client);
        client.managers.ModuleManager = this.manager;
    }
    setupWatcher() {
        const watch = Chokidar.watch(['src/modules','modules'], {
            ignored: /(^|[\/\\])\../,
            ignoreInitial: true,
            persistent: true
        })
        .on('add', filepath => log.debug('Detected a new module (',filepath,'). Restart to load'))
        .on('change', filepath => {
            if((/(loaders)(\\|\/)/.test(filepath))) return; //dont want it to load core loaders
            const filename = filepath.replace(/^.*[\\\/]/, '')
            .split(".").slice(0,-1).join(".")
            //log.debug(`Watcher: Detected file change for module ${filename}, reloading...`)
            ModuleManager.reloadModule(filename,{custom:true})
            .then(() => {
                log.info(`Watcher: Reloaded module ${filename} successfully`)
            })
            .catch(err => {
                log.error(`Watcher: Failed to auto reload module ${filename}: ${process.env.PRODUCTION?err.message:err.stack}`)
            })
        })
    }
    async loadModules() {
        let custom = 0, core = 0;
        const promises = [];
        for(let i=0;i<folders.length;i++) {
            const isCore = i == 0
            const folder = folders[i];
            const filepath = path.join(this.client.ROOT_DIR, folder);
            //read the folder path, and get dirs. Same as commands fetching basically
            await fs.readdir(filepath,{ withFileTypes : true })
            .then(files => {
                files.forEach(dirent => {
                    if(dirent.isDirectory()) {
                        const sub_filepath = path.join(filepath,dirent.name);
                        fs.readdir(sub_filepath)
                        .then(sub_files => {
                            sub_files.forEach(file => {
                                if(file.split(".").slice(-1)[0] !== "js") return;
                                if(file.startsWith("_")) return;
                                
                                promises.push(new Promise((resolve) => {
                                    this.manager.registerModule(file, isCore, dirent.name)
                                    .catch(err => {
                                        this.logger.error(`Module ${dirent.name}/${file} was not loaded by ModuleManager:\n`, err)
                                    })
                                    .finally(() => resolve())
                                }))
                                
                            })
                        })
                        .catch(err => {
                            this.logger.error(`Loading group ${dirent.name} failed:\n`, err);
                        })
                    }else {
                        const file = dirent.name;
                        if(file.split(".").slice(-1)[0] !== "js") return;
                        if(file.startsWith("_")) return;

                        promises.push(new Promise((resolve) => {
                            this.manager.registerModule(file, isCore, null)
                            .catch(err => {
                                this.logger.error(`Module ${file} was not loaded by ModuleManager:\n`, err)
                            })
                            .finally(() => resolve())
                        }))
                    }
                });
            }).catch(err => {
                if(err.code === "ENOENT") {
                    this.logger.warn(`${folder} directory does not exist.`)
                }else {
                    this.logger.error(`Loading ${folder} failed:\n`, err);
                }
            })
        }
        Promise.all(promises)
        .then(() => {
            this.logger.success(`Loaded ${this.manager.coreLoaded} core modules, ${this.manager.customLoaded} custom modules`)
        })
    }
}
