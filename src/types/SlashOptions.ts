import { ApplicationCommandOptionChoice, ApplicationCommandOptionType, AutocompleteInteraction, CommandInteraction, Snowflake } from 'discord.js'
import { ChannelType } from 'discord-api-types/v9'
import OptionResult from './OptionResult.js'

// Includes elements that are part of official api and not custom to zeko
export type SlashHandlerFunction = (interaction: CommandInteraction, options?: OptionResult) => void | Promise<any>
export type SlashAutocompleteHandlerFunction = (interaction: AutocompleteInteraction, focused: ApplicationCommandOptionChoice) => void | Promise<any>

export type SlashContextOptions = "MESSAGE" | "USER"

export interface SlashOfficialConfig {
    name: string,
    description: string,
    context?: SlashContextOptions,
    options?: SlashOption[],
}

export interface SlashCommandConfig extends SlashOfficialConfig {
    guilds?: Snowflake[]
    defaultPermissions?: "ALL" | "NONE"
    forceRegister?: boolean
}

export interface SlashOptionBase {
    name: string,
    type: ApplicationCommandOptionType,
    description: string,
}

export interface SlashOptionValue extends SlashOptionBase {
    required?: boolean
}

export interface SlashAutocomplete extends SlashOptionValue {
    autocomplete?: SlashAutocompleteHandlerFunction | boolean | null
}
export interface SlashChoicesOption<T> extends SlashOptionValue {
    choices?: Record<string, T> | T[],
}

export type Integer = number
export type AllowedChannelType = ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildCategory | ChannelType.GuildNews | ChannelType.GuildStore | ChannelType.GuildNewsThread | ChannelType.GuildPublicThread | ChannelType.GuildPrivateThread | ChannelType.GuildStageVoice
export {
    ChannelType
}

export interface SlashSubCommandOption extends SlashOptionBase {
    type: "SUB_COMMAND",
    handler?: SlashHandlerFunction,
    options?: SlashSubOption[]
}

export interface SlashSubCommandGroupOption extends SlashOptionBase {
    type: "SUB_COMMAND_GROUP",
    options?: SlashSubOption[]
}

export interface SlashStringOption extends SlashChoicesOption<string>, SlashAutocomplete  {
    type: "STRING",
}

export interface SlashIntegerOption extends SlashChoicesOption<Integer>, SlashAutocomplete  {
    type: "INTEGER",
}

export interface SlashBooleanOption extends SlashOptionValue {
    type: "BOOLEAN",
}

export interface SlashUserOption extends SlashOptionValue {
    type: "USER",
}

export interface SlashChannelOption extends SlashOptionValue {
    type: "CHANNEL",
    channelTypes?: AllowedChannelType[] 
}


export interface SlashRoleOption extends SlashOptionValue {
    type: "ROLE",
}

export interface SlashMentionableOption extends SlashOptionValue {
    type: "MENTIONABLE",
}

export interface SlashNumberOption extends SlashChoicesOption<number>, SlashAutocomplete  {
    type: "NUMBER",
}

// Subcommands do not support nesting:
export type SlashSubOption = SlashStringOption | SlashIntegerOption | SlashBooleanOption | SlashUserOption | SlashChannelOption | SlashRoleOption | SlashMentionableOption | SlashNumberOption
export type SlashOption = SlashSubCommandOption | SlashSubCommandGroupOption | SlashSubOption

export type SlashHasChoices = SlashStringOption | SlashIntegerOption | SlashBooleanOption | SlashNumberOption