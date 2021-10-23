import { CommandInteractionOption, User, GuildMember, GuildChannel, ThreadChannel, CommandInteractionOptionResolver, Role } from 'discord.js'
import { SlashCommandSubOption } from '../types/SlashCommand.js'

export interface SlashCommandOptionList {
    [key: string]: CommandInteractionOption
}

export default class OptionResult {
    #results: SlashCommandOptionList
    constructor(results: CommandInteractionOptionResolver, options: SlashCommandSubOption[]) {
        this.#results = {}
        for(const option of options) {
            this.#results[option.name] = results.get(option.name, option.required)
        }
    }

    get size() {
        return Object.keys(this.#results).length
    }

    has(name: string) {
        return this.#results[name] !== undefined && this.#results[name] !== null;
    }

    getString(name: string): string {
        return this.has(name) ? this.#results[name].value as string : null
    }

    getBoolean(name: string): boolean {
        return this.has(name) ? this.#results[name].value as boolean : null
    }

    getInteger(name: string) {
        return this.has(name) ? this.#results[name].value as number : null
    }

    getUser(name: string): User {
        return this.has(name) ? this.#results[name].user : null
    }

    getMember(name: string): GuildMember {
        return this.has(name) ? this.#results[name].member as GuildMember : null
    }

    getChannel(name: string): GuildChannel | ThreadChannel {
        return this.has(name) ? this.#results[name].channel as (GuildChannel | ThreadChannel) : null
    }

    getMentionable(name: string) {
        return this.has(name) ? this.#results[name].member || this.#results[name].user|| this.#results[name].role : null
    }

    getRole(name: string): Role {
        return this.has(name) ? this.#results[name].role as Role : null
    }

    getOptions(name: string): CommandInteractionOption[] {
        return this.has(name) ? this.#results[name].options : null
    }

} 