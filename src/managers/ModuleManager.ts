/** 
 @namespace Managers
 @module ModuleManager
 @description Manages all registered modules
*/
import { Client } from 'discord.js';
import path from 'path'
import Logger from '../Logger.js'
import Module from '../types/Module.js';

let instance
//TODO: change registerModule(String name, ...) to registerModule(Module module, ...)
 
/**
 * @typedef {Object} RegisteredModule
 * @property {?string} group - The group the module belongs to
 * @property {types/Module} module - The actual module class
 */

 export interface RegisteredModule {
    group?: string
    module: Module
 }


export default class ModuleManager {
    #client: Client;
    #logger: Logger
    #modules: {
        core: Map<string, RegisteredModule>
        custom: Map<string, RegisteredModule>
    }
    /**
     * Create a new ModuleManager
     *
     * @param {Client} client The current discord.js client
     */
    constructor(client: Client) {
        //Prevents custom overriding core modules
        this.#modules = {
            core: new Map(),
            custom: new Map()
        }
        this.#client = client;
        this.#logger = new Logger("ModuleManager")
        instance = this
    }

    /**
     * Acquire the current instance
     *
     * @static
     * @returns {ModuleManager} The current instance
     */
    static getInstance(): ModuleManager {
        return instance;
    }

    /**
     * Reload a module. Not working with ESM Modules
     *
     * @param {string} name Module name
     * @returns Promise<>
     */

    /**
     * Register a {@link types/Module} in the ModuleManager
     *
     * @param {string} name The name of the module to fetch
     * @param {boolean} [isCore=false] Is the module a core module?
     * @param {string} [group] The group (subfolder) of the module
     * @returns {Promise<RegisteredModule} Resolves if success, rejects if err
     */
    registerModule(name: string, isCore: boolean = false, group?: string): Promise<RegisteredModule> {
        return new Promise(async(resolve, reject) => {
            const root =  path.join(this.#client.ROOT_DIR, isCore?'src/modules':'modules')
            const filepath = group ? path.join(root, `${group}/${name}`) : path.join(root, `${name}`)
            import(`file://${filepath}`)
            .then(moduleFile => {
                if(!moduleFile.default || typeof moduleFile.default !== "function") {
                    return reject(new Error("Invalid Module class: Not valid module, no valid constructor"))
                }
                const module: Module = new moduleFile.default(this.#client, new Logger(`mod/${name}`))

                const registeredModule = {
                    group,
                    module
                }

                const type = isCore ? 'core' : 'custom'
                const registeredName = name.toLowerCase().replace('.js', '');
                this.#modules[type].set(registeredName, registeredModule);
                resolve(registeredModule)
            })
            .catch(err => reject(err))
        })
    }
    
    /**
     * Register a {@link types/Module} in the ModuleManager
     *
     * @param {*} moduleClass the module class to attempt to register
     * @param {string} name Name of the module
     * @param {?string} [group] group the module belongs in
     * @param {boolean} [isCore=false] Is the module a core module?
     * @returns {Promise<RegisteredModule>}
     * @memberof ModuleManager
     */
    register(moduleClass: any, name: string, group?: string, isCore: boolean = false): Promise<RegisteredModule> {
        return new Promise(async(resolve, reject) => {
            if(!moduleClass.default || typeof moduleClass.default !== "function") {
                return reject(new Error('Invalid moduleClass: must be a class.'))
            }
            const module: Module = new moduleClass.default(this.#client, new Logger(`mod/${name}`))

            const registeredModule = {
                group,
                module
            }

            const type = isCore ? 'core' : 'custom'
            const registeredName = name.toLowerCase().replace('.js', '');
            this.#modules[type].set(registeredName, registeredModule);
            resolve(registeredModule)
            
        })
    }


    /**
     * Retrieve custom module by query
     *
     * @param {string} query The name of the module
     * @returns {?RegisteredModule}
     */
    getCustomModule(query: string) : RegisteredModule {
        return this.#modules.custom.get(query.toLowerCase());
    }

    /**
     * Retrieve a core module by query
     *
     * @param {string} query The name of the module
     * @returns {?RegisteredModule}
     */
    getCoreModule(query: string) : RegisteredModule {
        return this.#modules.core.get(query.toLowerCase());
    }


    /**
     * Gets the total number of core modules loaded
     *
     * @readonly
     */
    get coreLoaded() : number {
        return this.#modules.core.size;
    } 
    /**
     * Gets the total number of custom modules loaded
     *
     * @readonly
     */
    get customLoaded() : number {
        return this.#modules.custom.size;
    }

    /**
     * Acquire a list of modules
     *
     * @param {Filter} [filter] 
     * @returns {RegisteredModule[]} List of modules
     */
    getModules(filter: "core" | "custom") : RegisteredModule[] {
        //{type: 'custom'}
        if(filter) {
            if(filter === "core") {
                return Array.from(this.#modules.core.values())
            }else {
                return Array.from(this.#modules.custom.values())
            }
        }else{
            return Array.from(this.#modules.core.values()).concat(Array.from(this.#modules.custom.values()))
        }
    }

    /**
     * Get the names of all the loaded modules
     *
     * @param {Filter} [filter] 
     * @returns {string[]} List of modules
     */
    getModulesNames(filter: "core" | "custom") : string[] {
        if(filter) {
            if(filter === "core") {
                return Array.from(this.#modules.core.keys())
            }else {
                return Array.from(this.#modules.custom.keys())
            }
        }else{
            return Array.from(this.#modules.core.keys()).concat(Array.from(this.#modules.custom.keys()))
        }

    }

    /*_reload(module) {
        const _this = this;
        return new Promise(async(resolve,reject) => {
            try {
                //delete this.modules[module.config.name];
                const _logger = new Logger(module.config.name,{type:'module'})
                if(module.exit) await module.exit(this.client,_logger);
                
                const filepath = path.join(_this.client.ROOT_DIR,module.config.core?"src/modules/":"modules/",`${module.config.name}.js`)
                try {
                    delete require.cache[require.resolve(filepath)];
                    const newModule = require(filepath)
                    if(!newModule.config) newModule.config = {}
                    newModule.config.name = module.config.name;
                    newModule.config.core = module.config.core;
                    //do logic on register modules
                    _this.modules[module.config.name] = newModule;
                    if(newModule.init) await newModule.init(_this.client,_logger);
                    resolve();
                } catch(err) {
                    if(err.code === 'ENOENT') {
                        reject(new Error("Module does not exist"))
                    }else{
                        reject(err);
                    }
                }
            }catch(err) {
                reject(err);   
            }
        })
    }*/
}