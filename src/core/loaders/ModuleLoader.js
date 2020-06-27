import { Collection } from "discord.js"
import Chokidar from 'chokidar'
import { promises as fs } from 'fs';
import path from 'path'

import ModuleManager from '../managers/ModuleManager.js'

export default {
    init(client, log) {
        this.setupWatcher()
        loadModules(client, log)
        this.manager = new ModuleManager(client);
    },
    setupWatcher() {
        const watch = Chokidar.watch(['src/modules','modules'], {
            ignored: /(^|[\/\\])\../,
            ignoreInitial: true,
            persistent: true
        })
        .on('add', filepath => log.debug('Detected a new module (',filepath,'). Restart to load'))
        .on('change', filepath => {
            if((/(loaders)(\\|\/)/.test(filepath))) return; //dont want it to load core loaders
            const filename = filepath.replace(/^.*[\\\/]/, '')
            .split(".").slice(0,-1).join(".")
            //log.debug(`Watcher: Detected file change for module ${filename}, reloading...`)
            ModuleManager.reloadModule(filename,{custom:true})
            .then(() => {
                log.info(`Watcher: Reloaded module ${filename} successfully`)
            })
            .catch(err => {
                log.error(`Watcher: Failed to auto reload module ${filename}: ${process.env.PRODUCTION?err.message:err.stack}`)
            })
        })
    }
}
const folders = ['src/modules','modules'];
async function loadModules(client, log) {
    let custom = 0;
    let normal = 0;
    const promises = [];
    for(let i=0;i<folders.length;i++) {
        const folder = folders[i];
        const txt_custom = (i==0)?'Custom ' : '';
        const filepath = path.join(client.ROOT_DIR,folder);
        //read the folder path, and get dirs. Same as commands fetching basically
        await fs.readdir(filepath,{withFileTypes:true})
        .then(files => {
            files.forEach(dirent => {
                if(dirent.isDirectory()) {
                    if(dirent.name === "loaders") return; //dont load the loaders with module manager
                    const sub_filepath = path.join(filepath,dirent.name);
                    fs.readdir(sub_filepath)
                    .then(sub_files => {
                        sub_files.forEach(f => {
                            if(f.split(".").slice(-1)[0] !== "js") return;
                            if(f.startsWith("_")) return;
                            promises.push(new Promise((resolve,reject) => {
                                try {
                                    let props = require(`${sub_filepath}/${f}`);
                                    if(!props.config) props.config = {}
                                    props.config.name = f.split(".")[0];
                                    props.config.core = (i==0);
                                    props.config.group = dirent.name;
                                    
                                    client.moduleManager.registerModule(props)
                                    .then(() => {
                                        if(i==0) custom++; else normal++;
                                        resolve();
                                    })
                                    .catch(err => {
                                        log.error(`${txt_custom} Module ${f} was not loaded by ModuleManager: \n ${err.message}`)
                                        reject(err);
                                    })
                                }catch(err) {
                                    log.error(`${txt_custom} Module ${f} had an error:\n    ${err.stack}`);
                                    reject(err);
                                }
                            }))
                        })
                    })
                    .catch(err => {
                        log.error(`Loading group ${dirent.name} failed:\n    ${process.env.PRODUCTION?err.message:err.stack}`);
                    })
                }else {
                    const f = dirent.name;
                    if(f.split(".").slice(-1)[0] !== "js") return;
                    if(f.startsWith("_")) return;
                    promises.push(new Promise((resolve,reject) => {
                        try {
                            let props = require(`${filepath}/${f}`);
                            if(!props.config) props.config = {}
                            props.config.name = f.split(".")[0];
                            props.config.core = (i==0);
                            ModuleManager.registerModule(props)
                            .then(() => {
                                if(i==0) custom++; else normal++;
                                resolve();
                            })
                            .catch(err => {
                                log.error(`${txt_custom} Module ${f} was not loaded by ModuleManager: \n ${process.env.PRODUCTION?err.message:err.stack}`)
                                reject(err);
                            })
                        }catch(err) {
                            log.error(`${txt_custom} Module ${f} had an error:\n    ${process.env.PRODUCTION?err.message:err.stack}`);
                            reject(err);
                        }
                    }))
                }
            });
        }).catch(err => {
            if(err.code === "ENOENT") {
                log.warn(`${txt_custom} ${folder} directory does not exist.`)
            }else {
                log.error(`Loading ${txt_custom}${folder} failed:\n    ${process.env.PRODUCTION?err.message:err.stack}`);
            }
        })
    }
    await Promise.all(promises)
    .then(() => {
        log.success(`Loaded ${normal} core modules, ${custom} custom modules`)
    }).catch(() => {
        //errors are already logged in the promises
    })
}