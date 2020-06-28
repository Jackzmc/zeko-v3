import { Collection } from "discord.js"
import Chokidar from 'chokidar'
import { promises as fs } from 'fs';
import path from 'path'

import CommandManager from '../managers/CommandManager.js'

const folders = ['src/commands','commands'];

let logger;

export default { 
    init(client, _logger) {
        if(!process.env.DISABLE_LOADER_HOT_RELOAD) {
            this.setupWatcher();
        }
        logger = _logger;
        this.manager = new CommandManager(client)
        client.managers.CommandManager = this.manager;
        this.loadCommands(client, logger)
    },
    setupWatcher() {
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
            filename = filename.split(".").slice(0,-1).join(".")
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
    },
    async loadCommands(client, log) {
        for(let i=0 ; i < folders.length; i++) {
            const isCore = i == 0;
            const folder = folders[i];
            const filepath = path.join(client.ROOT_DIR, folder);
            await fs.readdir(filepath, { withFileTypes:true }) //read directory, returns directs which can check if folder, to support cmd groups
            .then(files => {
                files.forEach(dirent => {
                    if(dirent.isDirectory()) {
                        const sub_filepath = path.join(filepath, dirent.name);
                        fs.readdir(sub_filepath)
                        .then(sub_files => {
                            sub_files.forEach(file => {
                                //ignore files that arent *.js, or have _ prefixed
                                testCommand(this, sub_filepath, file, isCore, dirent.name);
                            })
                        })
                    }else{
                        //same as above, dont run if not *.js or prefixed with _
                        const file = dirent.name;
                        testCommand(this, filepath, file, isCore);
                    }
                });
            })
            .catch(err => {
                if(err.code === 'ENOENT') {
                    log.warn(`${folder} directory does not exist.`)
                }else{
                    log.error(`Loading ${folder} failed:\n    ${process.env.PRODUCTION?err.message:err.stack}`);
                }
            })
        }    
    }
}

async function testCommand(_this, filepath, file, isCore, group) {
    //ignore files that arent *.js, or have _ prefixed
    if(file.split(".").slice(-1)[0] !== "js") return;
    if(file.startsWith("_")) return;
    try {
        const commandObject = await import(`file://${filepath}/${file}`);
        //Test for invalid. Only log if there IS content (don't error on empty files)
        if(!commandObject || !commandObject.default) {
            if(commandObject.default && typeof commandObject.default !== 'function') {
                const prefix = isCore ? '' : 'Custom '
                logger.warn(`${prefix}Command ${file} is not setup correctly!`);
            }
            return;
        }

        const filename = file.split(".").shift();

        //this is probably still broken. Event manager doesnt care about .once. property
        //registerCommand(filename, isCore, [opt] groupName)
        _this.manager.registerCommand(filename, isCore, group)
        .then(() => {
            return isCore ? {core: true} : {custom: true}
        })
        .catch(err => {
            logger.error(`Command ${file} was not loaded by CommandLoader:\n    ${err.stack}`)
        })
    }catch(err) {
        logger.error(`Command ${file} had an error:\n    ${err.stack}`);
    }
}