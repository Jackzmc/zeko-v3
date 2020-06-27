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
            Promise.resolve(custom.event.before(...args))
            .then(beforeResponse => {
                if(beforeResponse !== true && custom.event.after) {
                    if(core) {
                        Promise.resolve(core.event.every(...args))
                        .then(coreResponse => {
                            if(coreResponse !== true) custom.event.after(...args);
                        }).catch(err => {
                            logger.error(`Core Event ${name} errored: ${process.env.PRODUCTION?err.message:err.stack}`)
                        })
                    }else{
                        custom.event.after(...args)
                    }
                }
            })
        }else if(core) {
            Promise.resolve(core.event.every(...args))
            .catch(err => {
                logger.error(`Core Event ${name} errored: ${err.message}`)
            })
        }
    }
    registerEvent(name, isCore) {
        const _this = this;
        return new Promise(async(resolve,reject) => {
            try {
                const filepath = path.join(_this.client.ROOT_DIR, isCore?"src/events":"events",`${name}.js`)
                //delete require.cache[require.resolve(_path)];
                const event_src = await import(`file://${filepath}`);
                const event = new event_src.default(this.client, new Logger(name))
                
                const registeredEvent = {
                    event,
                    config: {
                        core: isCore,
                        name,
                    }
                }
                if(isCore) {
                    _this.events.core.set(name, registeredEvent)
                }else{
                    _this.events.custom.set(name, registeredEvent)
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