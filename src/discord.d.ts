import { Managers } from "./core/Functions.js";

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
    }
}