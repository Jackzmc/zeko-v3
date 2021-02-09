import { Client, EnvVariable } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

interface EnvironmentVariables {
    privilegedIntents?: string[]
}

export default function() {
    let envs: EnvironmentVariables = {}
    //check for discord token and exit if none
    if(!process.env.DISCORD_BOT_TOKEN) {
        console.error('[SEVERE::core] Missing ENV \'DISCORD_BOT_TOKEN\' for discord auth. Exiting...')
        process.exit(1);
    }
    //check for production env and set logging levels
    if(process.env.PRODUCTION) {
        //@ts-ignore
        process.env.LOGGER_DEBUG_LEVEL = 0;
        //@ts-ignore
        process.env.DEBUG_LEVEL = 0;
    }

    if(process.env.DISCORD_INTENTS) {
        const intents = process.env.DISCORD_INTENTS.split(",")
        envs.privilegedIntents = intents
    }

    return envs;
}