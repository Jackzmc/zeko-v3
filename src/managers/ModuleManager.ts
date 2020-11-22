/** 
 @namespace Managers
 @module ModuleManager
 @description Manages all registered modules
*/
import { Client } from 'discord.js';
import path from 'path'
import Logger from '../Logger.js'
import Module from '../types/Module.js';

let instance: any;
 
/**
 * @typedef {Object} RegisteredModule
 * @property {?string} group - The group the module belongs to
 * @property {types/Module} module - The actual module class
 */

export interface RegisteredModule {
    group?: string
    module: Module,
    isCore: boolean
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
     * Register a {@link Module} in the ModuleManager
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
            }else if(moduleClass.default !instanceof Module) {
                throw new Error('moduleClass must contain a default Module class.')
            }
            const module: Module = new moduleClass.default(this.#client, new Logger(`mod/${name}`))

            const registeredModule = {
                group,
                module,
                isCore
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
    getCustomModule(query: string, moduleOnly: boolean = false) : RegisteredModule | Module {
        if(moduleOnly) {
            const registered = this.#modules.custom.get(query.toLowerCase());
            return registered ? registered.module : null;
        }
        return this.#modules.custom.get(query.toLowerCase());
    }

    /**
     * Retrieve a core module by query
     *
     * @param {string} query The name of the module
     * @returns {?RegisteredModule}
     */
    getCoreModule(query: string, moduleOnly: boolean = false) : RegisteredModule | Module {
        if(moduleOnly) {
            const registered = this.#modules.core.get(query.toLowerCase());
            return registered ? registered.module : null;
        }
        return this.#modules.core.get(query.toLowerCase());
    }


    /**
     * Retrieve either core or custom module, in order.
     *
     * @param {string} query The name of the module
     * @param {boolean} [moduleOnly=false] Should only the module class be returned
     * @returns {(RegisteredModule | Module)}
     * @memberof ModuleManager
     */
    get(query: string, moduleOnly: boolean = false): RegisteredModule | Module {
        const module = this.#modules.core.get(query.toLowerCase()) || this.#modules.custom.get(query.toLowerCase());
        if(!module) return null;
        return moduleOnly ? module.module : module;
    }


    /**
     * Remove a module from manager. Will try core, if does not exist, then custom.
     *
     * @param {string} query Module to remove
     * @returns {boolean} If a module was deleted successfully
     * @memberof ModuleManager
     */
    async unregister(query: string): Promise<boolean> {
        query = query.replace(/.js$/, '');
        const coreMod = this.#modules.core.get(query);
        const customMod = this.#modules.custom.get(query);
        if(coreMod) {
            await coreMod.module.exit(true)
            return this.#modules.core.delete(query);
        }else if(customMod) {
            await customMod.module.exit(true)
            return this.#modules.custom.delete(query);
        }else{
            return null;
        }
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

    
    /**
     * Fired when the bot is shutting down. Runs exit code in any module that has it.
     *
     * @memberof ModuleManager
     */
    async exit(waitable: boolean): Promise<void[]> {
        const promises = [];
        this.#modules.core.forEach(module => {
            if(module.module.exit) {
                promises.push(Promise.resolve(module.module.exit(waitable)));
            }
        })
        this.#modules.custom.forEach(module => {
            if(module.module.exit) {
                promises.push(Promise.resolve(module.module.exit(waitable)));
            }
        })
        return Promise.all(promises)
    }
}