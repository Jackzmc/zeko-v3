import { CommandInteractionOption, User, GuildMember, GuildChannel, ThreadChannel, CommandInteractionOptionResolver, Role } from 'discord.js'
import { SlashOption, SlashHasDefault, SlashDefaultOption, Integer } from '../types/SlashOptions.js'

interface StoredOptionResult extends CommandInteractionOption {
    value?: number | string | boolean | Integer
}

export interface SlashCommandOptionList {
    [key: string]: StoredOptionResult
}

export default class OptionResult {
    #results: SlashCommandOptionList
    #count: number
    constructor(results: CommandInteractionOptionResolver, options: SlashOption[]) {
        this.#results = {}
        this.#count = 0
        if(options) {
            for(const option of options) {
                const value = results.get(option.name, option.required)
                if(value) {
                    this.#count++
                    this.#results[option.name] = value
                } else if('default' in option) {
                    this.#results[option.name].value = option.default
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
        return this.#results[name].value as string 
    
    }

    getStringLower(name: string): string {
        return this.getString(name)?.toLowerCase()
    }

    getStringUpper(name: string): string {
        return this.getString(name)?.toUpperCase()
    }

    getBoolean(name: string): boolean {
        return this.#results[name].value === "true"
    }

    getInteger(name: string): Integer {
        return Math.round(Number(this.#results[name].value))
    }

    getNumber(name: string) {
        return Number(this.#results[name].value)
    }

    getUser(name: string): User {
        return this.#results[name].user
    }

    getMember(name: string): GuildMember {
        return this.#results[name].member as GuildMember
    }

    getChannel(name: string): GuildChannel | ThreadChannel {
        return this.#results[name].channel as (GuildChannel | ThreadChannel)
    }

    getMentionable(name: string) {
        return this.#results[name].member || this.#results[name].user|| this.#results[name].role
    }

    getRole(name: string): Role {
        return this.#results[name].role as Role
    }

    getOptions(name: string): CommandInteractionOption[] {
        return this.#results[name].options
    }

} 