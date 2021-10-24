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
    #subcmd: string
    #subcmdGroup: string
    constructor(results: CommandInteractionOptionResolver, options: SlashOption[]) {
        this.#results = {}
        this.#count = 0
        if(options) {
            this.#subcmd = results.getSubcommand(false)
            this.#subcmdGroup = results.getSubcommandGroup(false)
            for(const option of options) {
                const value = results.get(option.name, ('required' in option) ? option.required : null)
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

    get subcommand() {
        return this.#subcmd
    }

    get subcommandGroup() {
        return this.#subcmdGroup
    }

    has(name: string) {
        return this.#results[name] !== undefined && this.#results[name] !== null;
    }

    getString(name: string, defaultValue?: string): string {
        return this.#results[name]?.value as string || defaultValue
    
    }

    getStringLower(name: string, defaultValue?: string): string {
        return this.getString(name)?.toLowerCase() || defaultValue
    }

    getStringUpper(name: string, defaultValue?: string): string {
        return this.getString(name)?.toUpperCase() || defaultValue
    }

    getBoolean(name: string, defaultValue?: boolean): boolean {
        return this.#results[name]?.value === "true" || defaultValue
    }

    getInteger(name: string, defaultValue?: Integer): Integer {
        return (this.#results[name]?.value) ? Math.round(Number(this.#results[name].value)) : defaultValue
    }

    getNumber(name: string, defaultValue?: number) {
        return (this.#results[name]?.value) ?  Number(this.#results[name].value) : defaultValue
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