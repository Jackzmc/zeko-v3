/** 
@module core:loaders/EventLoader
@description Loads all event files
*/
import Chokidar from 'chokidar'
import { promises as fs } from 'fs';
import path from 'path'

import EventManager from '../../managers/EventManager.js'
import EventEmitter from 'events'

const eventEmitter = new EventEmitter();
const folders = ['src/events','events'];
const IGNORED_EVENTS = ['raw','debug']

export default class {
    constructor(client, log) {
        this.manager = new EventManager(client);
        client.managers.EventManager = this.manager;
        this.logger = log;
        this.client = client;
        this.loadEvents()
        //this.setupWatcher()

        //Catch all events, pass to EventManager
        patchEmitter(client, this.manager)
    }
    setupWatcher() {
        const watch = Chokidar.watch(['src/events','events'], {
            ignored: /(^|[\/\\])\../,
            ignoreInitial: true,
            persistent: true
        })
        .on('add', filepath => {
            this.logger.debug('Detected a new event (',filepath,'). Restart to load')
        })
        .on('change',filepath => {
            const filename = filepath.replace(/^.*[\\\/]/, '')
            .split(".").slice(0,-1).join(".")
            //log.debug(`Watcher: Detected file change for module ${filename}, reloading...`)
            this.manager.reloadEvent(filename, { custom: true })
            .then(() => this.logger.info(`Watcher: Reloaded event ${filename} successfully`))
            .catch(err => {
                this.logger.error(`Watcher: Failed to auto reload event ${filename}: `, err)
            })
        })
    }
    async loadEvents() {
        const promises = [];
        for(let i=0; i<folders.length; i++) {
            const isCoreEvent = i == 0;
            const folder = folders[i];
            const filepath = path.join(this.client.ROOT_DIR,folder);
            await fs.readdir(filepath)
            .then(files => {
                files.forEach(async file => {
                    if(file.split(".").slice(-1)[0] !== "js") return; //has to be .js file *cough* folder that doesnt exist *cough*
                    const eventName = file.split(".");
                    eventName.pop();
                    try {
                        const eventObject = await import(`file://${filepath}/${file}`);
                        //Test for invalid. Only log if there IS content (don't error on empty files)
                        if(!eventObject || !eventObject.default) {
                            if(eventObject.default && typeof eventObject.default !== 'function') {
                                const prefix = isCoreEvent ? '' : 'Custom '
                                this.logger.warn(`${prefix}Event ${file} is not setup correctly!`);
                            }
                            return;
                        }

                        //this is probably still broken. Event manager doesnt care about .once. property
                        promises.push(new Promise(resolve => {
                            this.manager.registerEvent(eventName[0], isCoreEvent)
                            .catch(err => {
                                this.logger.error(`Event ${file} was not loaded by EventLoader: \n ${err.stack}`)
                            })
                            .finally(() => resolve())
                        }))
                        //delete require.cache[require.resolve(`${filepath}/${file}`)];
                    }catch(err) {
                        log.error(`Event ${file} had an error:\n`, err);
                    }
                });
            }).catch(err => {
                if(err.code === "ENOENT") {
                    this.logger.warn(`${folder} directory does not exist.`)
                }else{
                    this.logger.error(`Loading${folder} failed:\n`, err);
                }
            })
        }
        Promise.all(promises)
        .then(() => {
            this.logger.success(`Loaded ${this.manager.coreLoaded} core events, ${this.manager.customLoaded} custom events`)
        })
    }
}

//replace client.emit with custom emit that sends events to EventManager
function patchEmitter(emitter, manager) {
	const oldEmit = emitter.emit;
	emitter.emit = function() {
        const args = Array.prototype.slice.call(arguments);
		const name = args.shift();
		//console.log(require('util').inspect(arguments[1],{depth:0}))
        if(!IGNORED_EVENTS.includes(name)) {
            manager.event(name,args)
        }
		oldEmit.apply(emitter, arguments);
    }
    return eventEmitter    
}