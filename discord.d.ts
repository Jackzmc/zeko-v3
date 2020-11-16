declare module "discord.js" {
    export interface Client {
        PREFIX: string
        ROOT_DIR: string
        managers: any
        utils: any
    }
}