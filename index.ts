import * as Discord from 'discord.js';
import EnvLoader from './src/core/EnvLoader.js'
import CoreLoader from './src/core/loaders/CoreLoader.js'

// Fetch envs and any intents from env variable
const envs = EnvLoader()
const customIntents = new Discord.Intents();
customIntents.add(envs.privilegedIntents as Discord.BitFieldResolvable<Discord.IntentsString,number>[])

// All core logic moved into loader:
new CoreLoader().load(customIntents);


//final error catch area
process.on('error',(err: Error) => {
	console.error(`[ERROR] Ran into critical error: \n${err.message}`);
	process.exit(1)
})
process.on('unhandledRejection', (err:Error) => {
    console.error(`[ERROR] Uncaught Promise Exception \n${err.stack}`);
	process.exit(2)
});
  