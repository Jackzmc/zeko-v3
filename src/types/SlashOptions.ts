import { ApplicationCommandOptionType, Snowflake } from 'discord.js'
import { ChannelType } from 'discord-api-types/v9'

// Includes elements that are part of official api and not custom to zeko
export interface SlashOfficialConfig {
    name: string,
    description: string,
    options?: SlashOption[],
}

export interface SlashCommandConfig extends SlashOfficialConfig {
    guilds?: Snowflake[]
    disabled?: boolean,
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
    options?: SlashSubOption[]
}

export interface SlashSubCommandGroupOption extends SlashOptionBase {
    type: "SUB_COMMAND_GROUP",
    options?: SlashSubOption[]
}

export interface SlashStringOption extends SlashChoicesOption<string> {
    type: "STRING",
}

export interface SlashIntegerOption extends SlashChoicesOption<Integer>  {
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

export interface SlashNumberOption extends SlashChoicesOption<number> {
    type: "NUMBER",
}

// Subcommands do not support nesting:
export type SlashSubOption = SlashStringOption | SlashIntegerOption | SlashBooleanOption | SlashUserOption | SlashChannelOption | SlashRoleOption | SlashMentionableOption | SlashNumberOption
export type SlashOption = SlashSubCommandOption | SlashSubCommandGroupOption | SlashSubOption

export type SlashHasChoices = SlashStringOption | SlashIntegerOption | SlashBooleanOption | SlashNumberOption