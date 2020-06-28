import path from 'path'
import { fileURLToPath } from 'url'
const moduleURL = new URL(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default function(client) {
    client.PREFIX = process.env.BOT_PREFIX || ">"
    client.ROOT_DIR = path.resolve(__dirname,"../../"); 
    client.managers = {}
}
