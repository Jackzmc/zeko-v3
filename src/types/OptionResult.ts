import { CommandInteractionOption, User, GuildMember, GuildChannel, ThreadChannel, CommandInteractionOptionResolver, Role } from 'discord.js'
import { SlashCommandOption } from '../types/SlashCommand.js'

export interface SlashCommandOptionList {
    [key: string]: CommandInteractionOption
}

export default class OptionResult {
    #results: SlashCommandOptionList
    #count: number
    constructor(results: CommandInteractionOptionResolver, options: SlashCommandOption[]) {
        this.#results = {}
        this.#count = 0
        if(options) {
            for(const option of options) {
                const value = results.get(option.name, option.required)
                if(value) {
                    this.#count++
                    this.#results[option.name] = value
                } else if(option.default !== undefined) {
                    this.#results[option.name] = option.default
                }
            }
        }
    }

    get valueCount() {
        return this.#count
    }

    get optionCount() {
        return Object.keys(this.#results).length
    }

    has(name: string) {
        return this.#results[name] !== undefined && this.#results[name] !== null;
    }

    getString(name: string): string {
        return this.has(name) ? this.#results[name].value as string : null
    }

    getStringLower(name: string): string {
        return this.getString(name)?.toLowerCase()
    }

    getStringUpper(name: string): string {
        return this.getString(name)?.toUpperCase()
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