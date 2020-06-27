import path from 'path'
import Logger from '../Logger.js'
let logger, instance;

export default class {
    constructor(client) {
        this.events = {
            core: new Map(),
            custom: new Map(),
        }
        this.client = client;
        logger = new Logger('EventManager',{ type: 'module' });
        instance = this;
    }

    static getInstance() {
        return instance;
    }

    event(name, args) {
        if(name.toLowerCase() === "guildmemberspeaking") return;
        const core = this.getCoreEvent(name);
        const custom = this.getCustomEvent(name);
        if(custom) {
            if(custom.event.before) {
                //get value returned, possibly to cancel ?
                Promise.resolve(custom.event.before(...args))
                .then((r) => {
                    let cancelled = (r instanceof Object) ? r.cancel : false;
                    if(!cancelled && custom.event.after) {
                        if(core) {
                            Promise.resolve(core.event(...args))
                            .then(r => {
                                let cancelled = (r instanceof Object) ? r.cancel : false;
                                if(!cancelled) custom.event.after(...args);
                            }).catch(err => {
                                logger.error(`Core Event ${name} errored: ${process.env.PRODUCTION?err.message:err.stack}`)
                            })
                        }else{
                            custom.event.after(...args)
                        }
                    }
                }).catch(err => {
                    logger.error(`Custom Event ${name} errored: ${err.message}`)
                })
            }
        }else if(core) {
            Promise.resolve(core.event(...args))
            .catch(err => {
                logger.error(`Core Event ${name} errored: ${err.message}`)
            })
        }
        /*logger.debug(JSON.stringify({
            event:name,
            core:core!=null,
            before:custom&&custom.event.before != null,
            after:custom&&custom.event.after != null
        }))*/
    }
    reloadEvent(name) {
        const _this = this;
        return new Promise(async(resolve,reject) => {
            return reject(new Error('Reloading events is currently not supported'))
            try {
                const event = this.getEvent(name,'core') || this.getEvent(name,'custom');
                if(!event) reject(new Error("Could not find event " + name))
                const _path = path.join(
                    _this.client.rootDir,
                    event.config.core?"src/events":"events",
                    event.config.once?`${name}.once.js`:`${name}.js`
                )
                delete require.cache[require.resolve(_path)];

                const event_src = require(_path);
                const _logger = new _this.client.Logger(event.config.name,{type:'event'})
                const event_obj = event.config.core ? event_src.bind(null,_this.client,_logger) : {
                    before:event_src.before?event_src.before.bind(null, _this.client,_logger):null,
                    after:event_src.after?event_src.after.bind(null, _this.client,_logger):null
                }
                _this.events[event.config.core?'core':'custom'][event.config.name] = {
                    event:event_obj,
                    config:event.config
                }
                resolve();
            }catch(err) {
                reject(err);   
            }
        })
    }
    registerEvent(name, opts = {once:false,core:false}) {
        const _this = this;
        return new Promise(async(resolve,reject) => {
            try {
                const filepath = path.join(_this.client.ROOT_DIR,
                    opts.core?"src/events":"events",
                    opts.once?`${name}.once.js`:`${name}.js`
                )
                //delete require.cache[require.resolve(_path)];
                const event_src = await import(`file://${filepath}`);
                const _logger = new Logger(name, { type: 'event'})
                const event_obj = opts.core ? event_src.default.bind(null,_this.client,_logger) : {
                    before:event_src.before?event_src.before.bind(null, _this.client,_logger):null,
                    after:event_src.after?event_src.after.bind(null, _this.client,_logger):null
                }
                const regEvent = {
                    event: event_obj,
                    config: {
                        core: opts.core,
                        name,
                        once: opts.once
                    }
                }
                if(opts.core) {
                    _this.events.core.set(name, regEvent)
                }else{
                    _this.events.custom.set(name, regEvent)
                }
                resolve();
            }catch(err) {
                reject(err);
            }
        })
    }

    getCoreEvent(query) {
        return this.events.core.get(query)
    } 
    getCustomEvent(query) {
        return this.events.custom.get(query)
    }

    getEvents(namesOnly = true) {
        if(namesOnly) {
            return {
                core:Object.keys(this.events.core.values()),
                custom:Object.keys(this.events.custom.values())
            }
        }else{
            return {
                core: this.events.core.values(),
                custom: this.events.custom.values()
            }
        }
    }

}