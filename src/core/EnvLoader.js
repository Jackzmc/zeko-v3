import dotenv from 'dotenv';

export default function(client) {
    dotenv.config();

    //check for discord token and exit if none
    if(!process.env.DISCORD_BOT_TOKEN) {
        console.error('[SEVERE::core] Missing ENV \'DISCORD_BOT_TOKEN\' for discord auth. Exiting...')
        process.exit(1);
    }
    //check for production env and set logging levels
    if(process.env.PRODUCTION) {
        process.env.LOGGER_DEBUG_LEVEL = 0;
        process.env.DEBUG_LEVEL = 0;
    }
}