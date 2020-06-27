import EnvLoader from './EnvLoader.js'
import Functions from './Functions.js'
import CoreManager from './managers/CoreManager.js'


export default function(client) {
    EnvLoader(client)
    Functions(client, CoreManager)
    const coreManager = new CoreManager(client);

}