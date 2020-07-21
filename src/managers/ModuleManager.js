/** 
 @module managers/ModuleManager
 @description Manages all registered modules
*/
import path from 'path'
import Logger from '../Logger.js'

let instance

/**
 * @typedef {Object} RegisteredModule
 * @property {ModuleConfigOptions} config - Module configuration object
 * @property {?string} group - The group the module belongs to
 * @property {types/Module} module - The actual module class
 */

/**
 * Enum for any filtering types
 * @readonly
 * @enum {?string}
 */
const Filter = {
    /** Only show core types */
    CORE: "core",
    /** Only show custom types */
    CUSTOM: "custom",
    /** Show both types */
    ALL: null
};


export default class {
    /**
     * Create a new ModuleManager
     *
     * @param {Client} client The current discord.js client
     */
    constructor(client) {
        //Prevents custom overriding core modules
        this.modules = {
            core: new Map(),
            custom: new Map()
        }
        this.client = client;
        this.logger = new Logger("ModuleManager")
        instance = this
    }


    /**
     * Acquire the current instance
     *
     * @static
     * @returns {ModuleManager} The current instance
     */
    static getInstance() {
        return instance;
    }

    /**
     * Reload a module. Not working with ESM Modules
     *
     * @param {string} name Module name
     * @returns Promise<>
     */
    /*reloadModule(name) {
        return new Promise((resolve,reject) => {
            const module = this.modules[name];
            if(!module) reject(new Error(`ModuleManager: No module found for ${name}`));
            if(module.reloadable != null && !module.reloadable) {
                reject(new Error(`ModuleManager: Module ${name} cannot be reloaded.`))
                logger.warn(`Reloading module ${name} failed: Not Reloadable`)
                return;
            }

            this._reload(module)
            .then(() => {
                logger.info(`Successfully reloaded module ${name}`)
                resolve();
            }).catch(err => {
                logger.error(`Reloading module ${name} failed: ${err.message}`);
                reject(err);
            })
        })
    }*/

    /**
     * Register a {@link types/Module} in the ModuleManager
     *
     * @param {string} name The name of the module to fetch
     * @param {boolean} [isCore=false] Is the module a core module?
     * @param {string} [group] The group (subfolder) of the module
     * @returns {Promise} Resolves if success, rejects if err
     */
    registerModule(name, isCore = false, group) {
        return new Promise(async(resolve,reject) => {
            const root =  path.join(this.client.ROOT_DIR, isCore?'src/modules':'modules')
            const filepath = group ? path.join(root, `${group}/${name}`) : path.join(root, `${name}`)
            import(`file://${filepath}`)
            .then(moduleFile => {
                if(!moduleFile.default || typeof moduleFile.default !== "function") {
                    return reject(new Error("Invalid Module class: Not valid module, no valid constructor"))
                }
                const module = new moduleFile.default(this.client, new Logger(`mod/${name}`))
                if(!module.config || typeof module.config !== "function" ) {
                    return reject(new Error("Invalid Module class: Missing 'config' method"))
                }

                const config = module.config();
                delete module.config;

                const registeredModule = {
                    config,
                    group,
                    module
                }

                const type = isCore ? 'core' : 'custom'
                const registeredName = name.toLowerCase().replace('.js', '');
                this.modules[type].set(registeredName, registeredModule);
                resolve()
            })
            .catch(err => reject(err))
        })
    }


    /**
     * Retrieve custom module by query
     *
     * @param {string} query The name of the module
     * @returns {?RegisteredModule}
     */
    getCustomModule(query) {
        return this.modules.custom.get(query.toLowerCase());
    }

    /**
     * Retrieve a core module by query
     *
     * @param {string} query The name of the module
     * @returns {?RegisteredModule}
     */
    getCoreModule(query) {
        return this.modules.core.get(query.toLowerCase());
    }


    /**
     * Gets the total number of core modules loaded
     *
     * @readonly
     */
    get coreLoaded() {
        return this.modules.core.size;
    } 
    /**
     * Gets the total number of custom modules loaded
     *
     * @readonly
     */
    get customLoaded() {
        return this.modules.custom.size;
    }

    /**
     * Acquire a list of modules
     *
     * @param {Filter} [filter] 
     * @returns {RegisteredModule[]} List of modules
     */
    getModules() {
        //{type: 'custom'}
        if(filter) {
            if(filter === "core") {
                return this.modules.core.values()
            }else {
                return this.modules.custom.values()
            }
        }else{
            return this.modules.core.values().concat(this.modules.custom.values())
        }
    }

    /**
     * Get the names of all the loaded modules
     *
     * @param {Filter} [filter] 
     * @returns {string[]} List of modules
     */
    getModulesNames(filter) {
        if(filter) {
            if(filter === "core") {
                return this.modules.core.keys()
            }else {
                return this.modules.custom.keys()
            }
        }else{
            return this.modules.core.keys().concat(this.modules.custom.keys())
        }

    }

    ///#region PRIVATE METHODS
    _reload(module) {
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
    }
    _moduleCheck(module) {
        const failed_dependencies = [];
        const failed_envs = [];
        if(module.config.dependencies) module.config.dependencies.forEach(v => {
            try {
                require.resolve(v)
            } catch(e) {
                failed_dependencies.push(v);
            }
        })
        if(module.config.envs) module.config.envs.forEach(v => {
            if(!process.env[v]) failed_envs.push(v);
        })
        if(failed_dependencies.length > 0) {
            this.logger.warn(`Module ${module.config.name} missing dependencies: ${failed_dependencies.join(" ")}`);
        }else if(failed_envs.length > 0) {
            this.logger.warn(`Module ${module.config.name} missing envs: ${failed_envs.join(" ")}`);
        }
    }
    /////#endregion
}