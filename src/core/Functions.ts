import { Client } from 'discord.js';
import path from 'path'
import Utils from '../Utils.js'

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function(client: Client) {
    client.PREFIX = process.env.BOT_PREFIX || ">"
    client.ROOT_DIR = path.resolve(__dirname,"../../"); 
    client.managers = {}
    client.utils = Utils(client);
    client.evns = {}
}
