import Discord from 'discord.js';
import EnvLoader from './src/core/EnvLoader.js'
import CoreLoader from './src/core/Core.js'

// Fetch envs and any intents from env variable
const envs = EnvLoader()
const customIntents = []
if(envs.privilegedIntents)
	customIntents.push(envs.privilegedIntents)
// All core logic moved into loader:
new CoreLoader().load(customIntents);


//final error catch area
process.on('error',(err: Error) => {
	console.error(`[ERROR] Ran into critical error: \n${err.message}`);
	process.exit(1)
})
process.on('unhandledRejection', (err:Error) => {
    console.error(`[ERROR] Uncaught Promise Exception \n`, err);
	process.exit(2)
});
  