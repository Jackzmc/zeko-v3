import { CommandInteractionOption, User, GuildMember, GuildChannel, ThreadChannel, CommandInteractionOptionResolver } from 'discord.js'
import { SlashCommandSubOption } from '../types/SlashCommand.js'

export interface SlashCommandOptionList {
    [key: string]: string | number | boolean | User | GuildMember | GuildChannel | ThreadChannel | CommandInteractionOption[]
}

export default class OptionResult {
    #results: SlashCommandOptionList[]
    constructor(results: CommandInteractionOptionResolver, options: SlashCommandSubOption[]) {
        console.log(options)
        for(const option of options) {
            this.#results[option.name] = results.get(option.name, option.required)
        }
        console.log('done')
    }

    get size() {
        return Object.keys(this.#results).length
    }

    has(name: string) {
        return this.#results[name] !== undefined;
    }

    getString(name: string) {
        return this.#results[name].option.value;
    }

    getBoolean(name: string) {
        return this.#results[name].option.value;
    }

    getInteger(name: string) {
        return this.#results[name].option.value;
    }

    getUser(name: string): User {
        return this.#results[name].option.user;
    }

    getMember(name: string): GuildMember {
        return this.#results[name].option.member;
    }

    getChannel(name: string): GuildChannel | ThreadChannel {
        return this.#results[name].option.channel;
    }

    getMentionable(name: string) {
        return this.#results[name].option.member || this.#results[name].option.user || this.#results[name].option.role;
    }

    getRole(name: string) {
        return this.#results[name].option.role;
    }

    getOptions(name: string): CommandInteractionOption[] {
        return this.#results[name].option.options;
    }

} 