/** 
@module core:loaders/EventLoader
@description Loads all event files
*/
import { Collection } from "discord.js"
import Chokidar from 'chokidar'
import { promises as fs } from 'fs';
import path from 'path'

import Logger from '../Logger.js'
import EventManager from '../managers/EventManager.js'
import EventEmitter from 'events'

const eventEmitter = new EventEmitter();
const folders = ['src/events','events'];
const IGNORED_EVENTS = ['raw','debug']

export default {
    init(client, log) {
        this.manager = new EventManager(client);
        this.loadEvents(client, log)
        //this.setupWatcher()

        //Catch all events, pass to EventManager
        patchEmitter(client, this.manager)
    },
    setupWatcher() {
        const watch = Chokidar.watch(['src/events','events'], {
            ignored: /(^|[\/\\])\../,
            ignoreInitial: true,
            persistent: true
        })
        .on('add', filepath => {
            log.debug('Detected a new event (',filepath,'). Restart to load')
        })
        .on('change',filepath => {
            const filename = filepath.replace(/^.*[\\\/]/, '')
            .split(".").slice(0,-1).join(".")
            //log.debug(`Watcher: Detected file change for module ${filename}, reloading...`)
            this.manager.reloadEvent(filename, { custom: true })
            .then(() => log.info(`Watcher: Reloaded event ${filename} successfully`))
            .catch(err => {
                log.error(`Watcher: Failed to auto reload event ${filename}: `, err)
            })
        })
    },
    async loadEvents(client, log) {
        let normal = 0, custom = 0
        for(let i=0; i<folders.length; i++) {
            const isCoreEvent = i == 0;
            const folder = folders[i];
            const filepath = path.join(client.ROOT_DIR,folder);
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
                                log.warn(`${prefix}Event ${file} is not setup correctly!`);
                            }
                            return;
                        }

                        //this is probably still broken. Event manager doesnt care about .once. property
                        this.manager.registerEvent(eventName[0], isCoreEvent)
                        .catch(err => {
                            log.error(`Event ${file} was not loaded by EventLoader: \n ${err.stack}`)
                        })
                        //delete require.cache[require.resolve(`${filepath}/${file}`)];
                        if(isCoreEvent) normal++; else custom++;
                    }catch(err) {
                        log.error(`Event ${file} had an error:\n`, err);
                    }
                });
            }).catch(err => {
                if(err.code === "ENOENT") {
                    log.warn(`${folder} directory does not exist.`)
                }else{
                    log.error(`Loading${folder} failed:\n`, err);
                }
            })
        }
        log.success(`Loaded ${normal} core events, ${custom} custom events`)
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