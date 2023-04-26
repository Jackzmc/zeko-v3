import { CommandInteractionOption, User, GuildMember, GuildChannel, ThreadChannel, CommandInteractionOptionResolver, Role, CacheType, ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { SlashOption, Integer, SlashSubCommandOption, SlashSubCommandGroupOption } from '../types/SlashOptions.js'

interface StoredOptionResult extends CommandInteractionOption {
    value?: number | string | boolean | Integer
}

export interface SlashCommandOptionList {
    [key: string]: StoredOptionResult
}

export default class OptionResult {
    private results: SlashCommandOptionList
    private count: number
    private subcmd: string
    private subcmdGroup: string
    constructor(results: any, options: SlashOption[]) {
        this.results = {}
        this.count = 0
        if(options) {
            this.subcmd = results.getSubcommand(false)
            this.subcmdGroup = results.getSubcommandGroup(false)
            if(this.subcmd) {
                const subcmdOption = options.find(option => option.name === this.subcmd) as SlashSubCommandOption
                options = subcmdOption.options || []
            } else if(this.subcmdGroup) {
                const subcmdOption = options.find(option => option.name === this.subcmdGroup) as SlashSubCommandGroupOption
                options = subcmdOption.options || []
            }
            for(const option of options) {
                const value = results.get(option.name, ('required' in option) ? option.required : null)
                if(value) {
                    this.count++
                    this.results[option.name] = value
                }
            }
        }
    }

    get valueCount() {
        return this.count
    }

    get optionCount() {
        return Object.keys(this.results).length
    }

    get subcommand() {
        return this.subcmd
    }

    get subcommandGroup() {
        return this.subcmdGroup
    }

    get keys() {
        return Object.keys(this.results)
    }

    get values() {
        return Object.values(this.results)
    }

    *[Symbol.iterator]() {
        for(const key in this.results) {
            yield [ key, this.get(key) ]
        }
    }

    has(name: string) {
        return this.results[name] !== undefined && this.results[name] !== null;
    }

    get(name: string) {
        const result = this.results[name]
        if(!result) return null
        switch(result.type) {
            case ApplicationCommandOptionType.String: return this.getString(name)
            case ApplicationCommandOptionType.Boolean: return this.getBoolean(name)
            case ApplicationCommandOptionType.Integer: return this.getInteger(name)
            case ApplicationCommandOptionType.Number: return this.getNumber(name)
            case ApplicationCommandOptionType.User: return this.getMember(name)
            case ApplicationCommandOptionType.Channel: return this.getChannel(name)
            case ApplicationCommandOptionType.Role: return this.getRole(name)
            case ApplicationCommandOptionType.Mentionable: return this.getMentionable(name)
        }
        return null
    }

    getString(name: string, defaultValue?: string): string {
        return this.results[name]?.value as string ?? defaultValue
    
    }

    getStringLower(name: string, defaultValue?: string): string {
        return this.getString(name)?.toLowerCase() ?? defaultValue
    }

    getStringUpper(name: string, defaultValue?: string): string {
        return this.getString(name)?.toUpperCase() ?? defaultValue
    }

    getBoolean(name: string, defaultValue?: boolean): boolean {
        return this.results[name]?.value as boolean ?? defaultValue
    }

    getInteger(name: string, defaultValue?: Integer): Integer {
        return (this.results[name]?.value) ? Math.round(Number(this.results[name].value)) : defaultValue
    }

    getNumber(name: string, defaultValue?: number) {
        return (this.results[name]?.value) ? Number(this.results[name].value) : defaultValue
    }

    getUser(name: string): User {
        return this.results[name]?.user
    }

    getMember(name: string): GuildMember {
        return this.results[name]?.member as GuildMember
    }

    getChannel<T extends GuildChannel | ThreadChannel>(name: string, type?: ChannelType): T {
        const channel = this.results[name]?.channel
        if(!type) return channel as T
        if(channel.type == type) return channel as T
        return null
    }

    getMentionable(name: string, type?: ApplicationCommandOptionType): GuildMember | User | Role {
        if(type) {
            if(type == ApplicationCommandOptionType.Role && this.results[name].role)    
                return this.results[name].role as Role
            else if(type == ApplicationCommandOptionType.User) {
                return this.results[name].member as GuildMember || this.results[name].user as User || null
            }
        }
        return (this.results[name]?.member || this.results[name].user || this.results[name].role) as (GuildMember | User | Role )
    }

    getRole(name: string): Role {
        return this.results[name]?.role as Role
    }

    getOptions(name: string): CommandInteractionOption[] {
        return this.results[name]?.options
    }

} 