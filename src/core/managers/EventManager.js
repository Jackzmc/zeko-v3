import { Collection } from "discord.js"
import Chokidar from 'chokidar'
import { promises as fs } from 'fs';
import path from 'path'


export default {
    init(client, log) {
        this.setupWatcher()
        loadEvents(client, log)
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
            client.eventManager.reloadEvent(filename, { custom: true })
            .then(() => log.info(`Watcher: Reloaded event ${filename} successfully`))
            .catch(err => {
                log.error(`Watcher: Failed to auto reload event ${filename}: `, err)
            })
        })
    }
}

const folders = ['src/events','events'];
async function loadEvents(client, log) {
    let custom = 0;
    let normal = 0;
    for(let i=0;i<folders.length;i++) {
        const folder = folders[i];
        const txt_custom = (i==1)?' Custom' : '';
        const filepath = path.join(client.ROOT_DIR,folder);
        await fs.readdir(filepath)
        .then(files => {
            files.forEach(file => {
                if(file.split(".").slice(-1)[0] !== "js") return; //has to be .js file *cough* folder that doesnt exist *cough*
                const eventName = file.split(".");
                eventName.pop();
                try {
                    const event = require(`${filepath}/${file}`);
                    if(i==0) { //core
                        if(!event || typeof event !== 'function') {
                            return log.warn(`Event ${txt_custom} ${file} is not setup correctly!`);
                        }
                    }else{ //custom
                        if(!event || (!event.before && !event.after)) {
                            return log.warn(`Custom Event ${file} is not setup correctly!`);
                        }
                    }
                    //this is probably still broken. Event manager doesnt care about .once. property
                    const logger = new client.Logger(eventName[0])
                    if(eventName.length >= 2 && eventName[1].toLowerCase() === "once") {
                        client.eventManager.registerEvent(eventName[0],{once:true,core:i==0})
                        .catch(err => {
                            log.error(`${txt_custom} Event ${eventName[0]} was not loaded by EventManager: \n ${err.message}`)
                        })
                    }else{
                        client.eventManager.registerEvent(eventName[0],{once:false,core:i==0})
                        .catch(err => {
                            log.error(`${txt_custom} Event ${eventName[0]} was not loaded by EventManager: \n ${err.message}`)
                        })
                    }
                    
                    delete require.cache[require.resolve(`${filepath}/${file}`)];
                    if(i==1) custom++; else normal++;
                }catch(err) {
                    log.error(`Event${txt_custom} ${file} had an error:\n    ${err.stack}`);
                }
            });
        }).catch(err => {
            if(err.code === "ENOENT") {
                log.warn(`${txt_custom} ${folder} directory does not exist.`)
            }else{
                log.error(`Loading${txt_custom} ${folder} failed:\n    ${err.stack}`);
            }
        })
    }
    log.success(`Loaded ${normal} core events, ${custom} custom events`)
}