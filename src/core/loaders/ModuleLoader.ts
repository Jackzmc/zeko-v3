/** 
@module core:loaders/ModuleLoader
@description Loads all module files
*/
import { Client} from "discord.js"
import { promises as fs } from 'fs';
import path from 'path'

import ModuleManager from '../../managers/ModuleManager.js'
import Logger from "../../Logger.js";
import Module, { ModuleConfig } from '../../types/Module.js';

const folders = ['src/modules','modules'];

interface ModuleBit {
    name: string
    module: Module
    config: ModuleConfig
    group: string
    isCore: boolean
}

export default class {
    #client: Client
    #logger: Logger
    #manager: ModuleManager
    constructor(client: Client, logger: Logger) {
        //this.setupWatcher()
        this.#client = client;
        this.#logger = logger;

        this.#manager = new ModuleManager(client);
        client.managers.ModuleManager = this.#manager;
    }
    async loadModules() {
        return new Promise(async(resolve, reject) => {
            const promises: Promise<ModuleBit>[] = []
            for(let i = 0; i < folders.length; i++) {
                const isCore = i == 0
                const folder = folders[i];
                let filepath = path.join(this.#client.ROOT_DIR, folder);
                //read the folder path, and get dirs. Same as commands fetching basically
                await fs.readdir(filepath, { withFileTypes: true })
                .then(files => {
                    files.forEach(dirent => {
                        if(dirent.isDirectory()) {
                            const group = dirent.name;
                            filepath = path.join(filepath, group);
                            fs.readdir(filepath)
                            .then(groupFiles => {
                                groupFiles.forEach(file => {
                                    if(file.split(".").slice(-1)[0] !== "js") return;
                                    if(file.startsWith("_")) return;

                                    promises.push(loadModule(filepath, file, group, isCore));
                                    
                                })
                            })
                            .catch(err => {
                                this.#logger.error(`Loading group ${dirent.name} failed:\n`, err);
                            })
                        }else {
                            const file = dirent.name;
                            if(file.split(".").slice(-1)[0] !== "js") return;
                            if(file.startsWith("_")) return;

                            promises.push(loadModule(filepath, file, null, isCore));
                        }
                    });
                }).catch(err => {
                    if(err.code === "ENOENT") {
                        this.#logger.warn(`'${folder}' directory does not exist.`)
                    }else {
                        this.#logger.error(`Loading ${folder} failed:\n`, err);
                    }
                })
            }
            Promise.all(promises)
            .then(moduleBits => {
                moduleBits.sort((a: ModuleBit, b: ModuleBit) => {
                    if(!a.config.loadLate && b.config.loadLate) return -1;
                    if(a.config.loadLate && !b.config.loadLate) return 1;
                    return 0;
                })
                .forEach(moduleBit => {
                    this.#manager.register(moduleBit.module, moduleBit.name, moduleBit.group)
                })
            })
            .then(() => {
                this.#logger.success(`Loaded ${this.#manager.coreLoaded} core modules, ${this.#manager.customLoaded} custom modules`)
                resolve()
            }).catch(err => reject(err))
            /*
            Promise.all(promises)
            .then(() => {
                this.#logger.success(`Loaded ${this.#manager.coreLoaded} core modules, ${this.#manager.customLoaded} custom modules`)
            })
            .finally(() => resolve())*/
        })
    }

    
}

function loadModule(rootPath: string, filename: string, group?: string, isCore: boolean = false): Promise<ModuleBit> {
    return new Promise((resolve,reject) => {
        import(`file://${path.resolve(rootPath, filename)}`)
        .then(module => {
            if(!module.default) reject(new Error('Not a valid module, missing default class export.'))
            const config: ModuleConfig = module.default.config || {}
            return resolve({
                name: filename,
                module,
                config,
                isCore,
                group
            })
        }).catch(err => {
            reject(err)
        })
    })
    
    /*modules.push({
        file,
        isCore,
        group: dirent.name
    })*/
}