import { Managers } from "./core/Functions.js";
import Core from './core/Core.js';

declare module "discord.js" {
    interface EnvVariable {
        [envKey: string]: any
    }
    export interface Client {
        PREFIX: string
        ROOT_DIR: string
        managers: Managers
        utils: any,
        evns: EnvVariable
        core: Core
    }
}