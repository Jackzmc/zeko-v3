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
    async load(): Promise<void> {
        const promises: Promise<ModuleBit>[] = [];
        for(const folder of folders) {
            const isCore = folder.startsWith("src/")
            let filepath = path.join(this.#client.ROOT_DIR, folder);
            try {
                const files = await fs.readdir(filepath, { withFileTypes: true})
                for(const dirent of files) {
                    //If it is a directory, it will be a group
                    let group = null;
                    if(dirent.isDirectory()) {
                        group = dirent.name;
                        const _filepath = path.join(filepath, group);
                        const folderFiles = await fs.readdir(_filepath);
                        for(const filename of folderFiles) {
                            promises.push(loadModule(_filepath, filename, group, isCore))
                        }
                    }else{
                        promises.push(loadModule(filepath, dirent.name, group, isCore));
                    }
                }
            }catch(err) {
                if(err.code === "ENOENT") {
                    this.#logger.warn(`'${folder}' directory does not exist.`)
                }else {
                    this.#logger.error(`Loading ${folder} failed:\n`, err);
                }
            }
        }
        try {
            let moduleBits = await Promise.all(promises)
            moduleBits = moduleBits
            .filter(bit => bit)
            .sort((a: ModuleBit, b: ModuleBit) => {
                if(!a.config.loadLate && b.config.loadLate) return -1;
                if(a.config.loadLate && !b.config.loadLate) return 1;
                return 0;
            })
            await Promise.all(moduleBits.map(async(moduleBit) => {
                await this.#manager.register(moduleBit.module, moduleBit.name, moduleBit.group, moduleBit.isCore)
            }))
            this.#logger.success(`Loaded ${this.#manager.coreLoaded} core modules, ${this.#manager.customLoaded} custom modules`)
            return;
        }catch(err) {
            //TODO: change logic?
            this.#logger.severe('A failure occurred while loading modules.\n', err)
        }
    }
    
}

//Either returns a ModuleBit, or will return null if not a valid module (not js file, starts with _, or not a Module class)
async function loadModule(rootPath: string, filename: string, group?: string, isCore: boolean = false): Promise<ModuleBit> {
    if(filename.split(".").slice(-1)[0] !== "js") return null;
    if(filename.startsWith("_")) return null;

    const module = await import(`file://${path.resolve(rootPath, filename)}`);
    if(!module.default || !module.default.config) return null;
    const config: ModuleConfig = module.default.config || {}
    
    return {
        name: filename,
        module,
        config,
        isCore,
        group
    }
}