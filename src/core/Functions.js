import path from 'path'
import { fileURLToPath } from 'url'
const moduleURL = new URL(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default function(client, CoreManager) {
    //load internal modules
    //client.Logger = Logger.Logger;
    //client.moduleManager =  new ModuleManager(client)
    //client.eventManager = new EventManager(client)
    //client.permissions = require('../PermissionHelper')

    //client.eventManager.emitter = patchEmitter(client)

    //load variables
    client.PREFIX = process.env.BOT_PREFIX || ">"
    client.ROOT_DIR = path.resolve(__dirname,"../../"); //push root dir into path
    //client.utils = require('../utils.js')(client)
}

import EventEmitter from 'events'
const eventEmitter = new EventEmitter();

function patchEmitter(emitter) {
	const oldEmit = emitter.emit;
  
	emitter.emit = function() {
        const args = Array.prototype.slice.call(arguments);
		const name = args.shift();
		//console.log(require('util').inspect(arguments[1],{depth:0}))
        if(!["raw","debug"].includes(name)) {
            emitter.eventManager.event(name,args)
        }
		oldEmit.apply(emitter, arguments);
    }
    return eventEmitter    
}