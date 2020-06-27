import * as Discord from 'discord.js';
import StartupManager from './src/core/Startup.js';

const client = new Discord.Client({
    disableEveryone: true,
    messageCacheMaxSize: 500,
    messageCacheLifetime: 120,
    messageSweepInterval: 60,
});


new StartupManager(client);

//final error catch area
process.on('error',(err) => {
	console.error(`[ERROR] Ran into critical error: \n${err.message}`);
	process.exit(1)
})