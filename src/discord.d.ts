declare module "discord.js" {
    interface EnvVariable {
        [envKey: string]: any
    }
    export interface Client {
        PREFIX: string
        ROOT_DIR: string
        managers: any
        utils: any,
        evns: EnvVariable
    }
}