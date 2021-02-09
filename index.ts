import * as Discord from 'discord.js';
import EnvLoader from './src/core/EnvLoader.js'
import Functions from './src/core/Functions.js'
import CoreLoader from './src/core/loaders/CoreLoader.js'

const intents = new Discord.Intents(Discord.Intents.NON_PRIVILEGED);
const envs = EnvLoader()
intents.add(envs.privilegedIntents as Discord.BitFieldResolvable<Discord.IntentsString>)

const client: Discord.Client = new Discord.Client({
    messageCacheMaxSize: 500,
    messageCacheLifetime: 120,
    messageSweepInterval: 60,
    ws: {intents}
});

client.evns = envs
Functions(client)
new CoreLoader(client);

//final error catch area
process.on('error',(err: Error) => {
	console.error(`[ERROR] Ran into critical error: \n${err.message}`);
	process.exit(1)
})