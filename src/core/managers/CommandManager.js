import { Collection } from "discord.js"
import Chokidar from 'chokidar'
import { promises as fs } from 'fs';
import path from 'path'

const groups = []
const commands = new Collection();
const aliases = new Collection();

export default function(client, logger) {
    if(!process.env.DISABLE_LOADER_HOT_RELOAD) {
        const watch = Chokidar.watch(['src/commands','commands'], {
            ignored: /(^|[\/\\])\../,
            ignoreInitial: true,
            persistent: true
        })
        .on('add',_path => {
            logger.debug('Detected a new command (',_path,'). Restart to load')
        })
        .on('change', filepath => {
            //TODO: allow support for group loading
            let filename = filepath.replace(/^.*[\\\/]/, '')
            //Ignore non .js files or starting with _
            if(filename.split(".").slice(-1)[0] !== "js" || filename.startsWith("_")) return;
            filename = file.split(".").slice(0,-1).join(".")
            //set timeout, sometimes it gets a change before file is complete. Should port to the other 2 _watchers
            setTimeout(() => {
                try {
                    //delete command from map, load it, initalize it, and then add it back if successful
                    commands.delete(filename);
                    const command_path = (/(src)(\\|\/)/.test(filepath)) ? path.join(client.ROOT_DIR,"src/commands") : path.join(client.ROOT_DIR,"commands");
                    const filepath = require.resolve(path.join(command_path, filename))
                    delete require.cache[filepath]


                    const command_file = require(filepath)
                    if(command_file.init) {
                        const _logger = new client.Logger(filename, { type:'command' });
                        command_file.init(client, _logger)
                    }
                    if(!command_file.run) logger.warn(`Watcher: File ${filename} is missing run property`)

                    commands.set(filename,command_file);
                    logger.info(`Watcher: Reloaded command ${filename} successfully`)
                }catch(err) {
                    loggger.error(`Watcher: ${filename} Failed Reload: ${process.env.PRODUCTION?err.message:err.stack}`)
                }
            },500)
        })
    }
    loadCommands(client, logger).then(() => {

    })
    .catch(err => {
        logger.servere('Failed to load commands: ', err)
    })
}
const folders = ['src/commands','commands'];
async function loadCommands(client, log) {
    //just set the folders it should load from
    let custom = 0;
    let normal = 0;
    const promises = [];
    for(let i=0 ; i < folders.length; i++) {
        const folder = folders[i];
        const txt_custom = (i==1)?' Custom' : ''; //ugly solution, but checks if its a custom command
        const filepath = path.join(client.ROOT_DIR, folder);
        await fs.readdir(filepath,{ withFileTypes:true }) //read directory, returns directs which can check if folder, to support cmd groups
        .then(files => {
            files.forEach(dirent => {
                if(dirent.isDirectory()) {
                    const sub_filepath = path.join(filepath,dirent.name);
                    fs.readdir(sub_filepath)
                    .then(sub_files => {
                        sub_files.forEach(f => {
                            //ignore files that arent *.js, or have _ prefixed
                            if(f.split(".").slice(-1)[0] !== "js") return;
                            if(f.startsWith("_")) return;
                            promises.push(new Promise((resolve,reject) => {
                                try {
                                    //load file, check required properties (help,config,run)
                                    let props = require(`${sub_filepath}/${f}`);
                                    if(!props.help || !props.config) {
                                        log.warn(`${txt_custom} ${f} has no config or help value.`);
                                        return resolve();
                                    }
                                    if(!props.run) {
                                        log.warn(`${txt_custom} ${f} has no run function.`);
                                        return resolve();
                                    }
                                    props.help.description = props.help.description||'[No description provided]'
                                    props.config.group = dirent.name;
                                    if(!client.commandGroups.includes(dirent.name)) client.commandGroups.push(dirent.name)
                                    props.config.core = (i==0);
                                    //allows support for name to be an array or a single string
                                    if(Array.isArray(props.help.name)) {
                                        if(props.help.name.length === 0) {
                                            log.warn(`${f} has no names or aliases defined.`)
                                        }else{
                                            const name = props.help.name.shift();
                                            props.help.name.forEach(alias => {
                                                client.aliases.set(alias,name);
                                            })
                                            client.commands.set(name,props);
                                        }
                                    }else{
                                        client.commands.set(props.help.name, props);
                                    }
                                    const logger = new client.Logger(props.help.name,{type:'command'})
                                    if(props.init) props.init(client,logger);
                                    if(i==1) custom++; else normal++;
                                    resolve();
                                }catch(err) {
                                    log.error(`${txt_custom} Command ${f} had an error:\n    ${process.env.PRODUCTION?err.message:err.stack}`);
                                    reject(err);
                                }
                            }))
                        })
                    })
                }else{
                    //same as above, dont run if not *.js or prefixed with _
                    const f = dirent.name;
                    if(f.split(".").slice(-1)[0] !== "js") return;
                    if(f.startsWith("_")) return;
                    promises.push(new Promise((resolve,reject) => {
                        try {
                            //load file, check required properties (help,config,run)
                            let props = require(`${filepath}/${f}`);
                            if(!props.help || !props.config) {
                                log.warn(`${txt_custom} ${f} has no config or help value.`);
                                return resolve();
                            }
                            if(!props.run) {
                                log.warn(`${txt_custom} ${f} has no run function.`);
                                return resolve();
                            }
                            props.help.description = props.help.description||'[No description provided]'
                            props.config.core = (i==0);
                            props.config.group = null;
                            //allows support for name to be an array or a single string
                            if(Array.isArray(props.help.name)) {
                                if(props.help.name.length === 0) {
                                    log.warn(`${f} has no names or aliases defined.`)
                                }else{
                                    const name = props.help.name.shift();
                                    props.help.name.forEach(alias => {
                                        client.aliases.set(alias,name);
                                    })
                                    client.commands.set(name,props);
                                }
                            }else{
                                client.commands.set(props.help.name, props);
                            }
                            const logger = new client.Logger(props.help.name,{type:'command'})
                            if(props.init) props.init(client,logger);
                            if(i==1) custom++; else normal++;
                            resolve();
                        }catch(err) {
                            log.error(`${txt_custom} Command ${f} had an error:\n    ${process.env.PRODUCTION?err.message:err.stack}`);
                            reject(err);
                        }
                    }))
                }
            });
        })
        .catch(err => {
            if(err.code === 'ENOENT') {
                log.warn(`${txt_custom} ${folder} directory does not exist.`)
            }else{
                log.error(`Loading${txt_custom} ${folder} failed:\n    ${process.env.PRODUCTION?err.message:err.stack}`);
            }
        })
    }
    Promise.all(promises)
    .then(() => {
        log.success(`Loaded ${normal} core commands, ${custom} custom commands`)
    }).catch(() => {
        //errors are already logged in the promises
    })

}