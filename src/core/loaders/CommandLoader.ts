/**
 @module core:loaders/CommandLoader
 @description Loads the commands from /src/commands and /commands and loads them in [CommandManager]{@link managers/CommandManager}
*/
import Chokidar from 'chokidar'
import { Client } from 'discord.js';
import { promises as fs } from 'fs';
import path from 'path'
import Logger from '../../Logger.js'

import CommandManager from '../../managers/CommandManager.js'
import Command, { CommandConfigOptions, CommandHelpOptions } from 'Command';

const folders = ['src/commands','commands'];

interface CommandBit {
    name: string
    command: Command
    group: string
    isCore: boolean
}

export default class{ 
    #client: Client;
    #logger: Logger;
    #manager: CommandManager
    constructor(client: Client, logger: Logger) {
        this.#client = client;
        this.#logger = logger;
        this.#manager = new CommandManager(client)
        client.managers.CommandManager = this.#manager;
        if(!process.env.DISABLE_LOADER_HOT_RELOAD) {
            this.setupWatcher()
        }
    }
    
    setupWatcher() {
        const distFolders = folders.map(v => path.join('dist',v))
        Chokidar.watch(distFolders, {
            ignored: /(^|[\/\\])\../,
            ignoreInitial: true,
            persistent: true
        })
        .on('add', filepath => this.#logger.debug('Command was added:', filepath))
        .on('change', (filepath) => {
            const file = filepath.replace(/^.*[\\\/]/, '')
            if(file.split(".").slice(-1)[0] !== "js") return;
            if(file.startsWith("_")) return;
            const filename = file.split(".").slice(0,-1).join(".")

            const command = CommandManager.getInstance().getCommand(filename);
            if(!command) return this.#logger.debug(`command ${filename} not registered. ignoring.`)
            const folder = path.parse(filepath).dir;

            setTimeout(async() => {
                try {
                    //delete command from map, load it, initalize it, and then add it back if successful
                    const result: CommandBit = await loadCommand(folder, file, command.group, command.isCore)
                    if(!result) return this.#logger.debug('bit was null')
                    await CommandManager.getInstance().unregister(filename);
                    await CommandManager.getInstance().register(result.command, result.name, result.group, result.isCore);
                    this.#logger.info(`Watcher: Reloaded command '${filename}' successfully`)
                }catch(err) {
                    this.#logger.error(`Watcher: '${filename}' Failed Reload: ${process.env.PRODUCTION?err.message:err.stack}`)
                }
            },500)
        })
    }
    async load() {
        const promises: Promise<CommandBit>[] = [];
        for(const folder of folders) {
            const isCore = folder.startsWith("src/");
            let filepath = path.join(this.#client.ROOT_DIR, folder);
            try {
                const files = await fs.readdir(filepath, { withFileTypes: true})
                for(const dirent of files) {
                    //If it is a directory, it will be a group
                    let group = null;
                    if(dirent.isDirectory()) {
                        group = dirent.name;
                        const _filepath = path.join(filepath, group);
                        const folderFiles = await fs.readdir(_filepath);
                        for(const filename of folderFiles) {
                            promises.push(loadCommand(_filepath, filename, group, isCore))
                        }
                    }else{
                        promises.push(loadCommand(filepath, dirent.name, group, isCore));
                    }
                }
            }catch(err) {
                if(err.code === "ENOENT") {
                    this.#logger.warn(`'${folder}' directory does not exist.`)
                }else {
                    this.#logger.error(`Loading ${folder} failed:\n`, err);
                }
            }
        }
        try {
            let bits = await Promise.all(promises);
            bits = bits.filter(bit => bit)
            await Promise.all(bits.map(async(bit) => {
                await this.#manager.register(bit.command, bit.name, bit.group, bit.isCore)
            }))
            this.#logger.success(`Loaded ${this.#manager.commandsCount} commands, ${this.#manager.aliasesCount} aliases`)
            return;
        }catch(err) {
            //TODO: change logic?
            this.#logger.severe('A failure occurred while loading commands.\n', err)
        }
    }
}

async function loadCommand(rootPath: string, filename: string, group?: string, isCore: boolean = false): Promise<CommandBit> {
    if(filename.split(".").slice(-1)[0] !== "js") return null;
    if(filename.startsWith("_")) return null;
    const command = await import(`file://${path.resolve(rootPath, filename)}?d=${Date.now()}`);
    if(!command.default) return null;
    return {
        name: filename,
        command,
        isCore,
        group
    }
}