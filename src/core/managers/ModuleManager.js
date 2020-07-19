/** 
 @module core:managers/ModuleManager
 @description Manages all registered modules
*/
import path from 'path'
import Logger from '../Logger.js'

let instance, logger;

export default class {
    
    constructor(client) {
        //Prevents custom overriding core modules
        this.modules = {
            core: new Map(),
            custom: new Map()
        }
        this.client = client;
        logger = new Logger("ModuleManager")
        instance = this
    }

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

    //TODO: Strip out .js extenstion incase.
    /**
     * Register a {@link types/Module} in the ModuleManager
     *
     * @param {string} name The name of the module to fetch
     * @param {boolean} isCore Is the module a core module?
     * @param {string} [group] The group (subfolder) of the module
     * @returns Promise<>
     */
    registerModule(name, isCore, group) {
        const _this = this;
        return new Promise(async(resolve,reject) => {
            const root =  path.join(_this.client.ROOT_DIR, isCore?'src/modules':'modules')
            const filepath = group ? path.join(root, `${group}/${name}`) : path.join(root, `${name}`)
            import(`file://${filepath}`)
            .then(moduleFile => {
                const prefix = group ? `${group}/` : ''
                const module = new moduleFile.default(this.client, new Logger(prefix + name))
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
     * @returns {@link types/Module}
     */
    getCustomModule(query) {
        return this.modules.custom.get(query.toLowerCase());
    }

    /**
     * Retrieve a core module by query
     *
     * @param {string} query The name of the module
     * @returns {@link types/Module}
     */
    getCoreModule(query) {
        return this.modules.core.get(query.toLowerCase());
    }

    get coreLoaded() {
        return this.modules.core.size;
    } 
    get customLoaded() {
        return this.modules.custom.size;
    }

    getModules(opts = {names:false}) {
        //{type: 'custom'}
        let filtered;
        if(opts.type) {
            if(opts.type === "custom") {
                filtered = this.modules.filter(v => !v.config.core)
            }else if(opts.type === "core") {
                filtered = this.modules.filter(v => v.config.core);
            }else{
                throw new Error("Unknown type specified of module");
            }
        }else{
            filtered = this.modules;
        }

        if(opts.names) {
            return Object.keys(this.modules)
        }else{
            return this.modules;
        }
    }

    get coreLoaded() {
        return this.modules.core.size;
    } 
    get customLoaded() {
        return this.modules.custom.size;
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
            logger.warn(`Module ${module.config.name} missing dependencies: ${failed_dependencies.join(" ")}`);
        }else if(failed_envs.length > 0) {
            logger.warn(`Module ${module.config.name} missing envs: ${failed_envs.join(" ")}`);
        }
    }
    /////#endregion
}