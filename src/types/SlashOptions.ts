import { ApplicationCommandOptionType, Snowflake } from 'discord.js'

export interface SlashCommandConfig {
    name: string,
    description: string,
    guild?: Snowflake
    options?: SlashOption[],
}
export type ChannelType = "GUILD_TEXT" | "DM" | "GUILD_VOICE" | "GROUP_DM" | "GUILD_CATEGORY" | "GUILD_NEWS" | "GUILD_STORE" | "GUILD_NEWS_THREAD" | "GUILD_NEWS_THREAD" | "GUILD_PUBLIC_THREAD" |"GUILD_PRIVATE_THREAD" | "GUILD_STAGE_VOICE"

export interface SlashOptionBase {
    name: string,
    type: ApplicationCommandOptionType,
    description: string,
}

export interface SlashOptionValue extends SlashOptionBase {
    required?: boolean
}

export interface SlashDefaultOption<T> extends SlashOptionValue {
    choices?: Record<string, T> | T[],
    default?: T
}

export type Integer = number

export interface SlashSubCommandOption extends SlashOptionBase {
    type: "SUB_COMMAND",
    options: SlashSubOption[]
}

export interface SlashSubCommandGroupOption extends SlashOptionBase {
    type: "SUB_COMMAND_GROUP",
    options: SlashSubOption[]
}

export interface SlashStringOption extends SlashDefaultOption<string> {
    type: "STRING",
}

export interface SlashIntegerOption extends SlashDefaultOption<Integer>  {
    type: "INTEGER",
}

export interface SlashBooleanOption extends SlashDefaultOption<boolean> {
    type: "BOOLEAN",
}

export interface SlashUserOption extends SlashOptionValue {
    type: "USER",
}

export interface SlashChannelOption extends SlashOptionValue {
    type: "CHANNEL",
    channelTypes?: ChannelType[] 
}

export interface SlashRoleOption extends SlashOptionValue {
    type: "ROLE",
}

export interface SlashMentionableOption extends SlashOptionValue {
    type: "MENTIONABLE",
}

export interface SlashNumberOption extends SlashDefaultOption<number> {
    type: "NUMBER",
}

export type SlashOption = SlashSubCommandOption | SlashSubCommandGroupOption | SlashStringOption | SlashIntegerOption | SlashBooleanOption | SlashUserOption | SlashChannelOption | SlashRoleOption | SlashMentionableOption | SlashNumberOption
// Subcommands do not support nesting:
export type SlashSubOption = SlashStringOption | SlashIntegerOption | SlashBooleanOption | SlashUserOption | SlashChannelOption | SlashRoleOption | SlashMentionableOption | SlashNumberOption

export type SlashHasDefault = SlashStringOption | SlashIntegerOption | SlashBooleanOption | SlashNumberOption
export type SlashHasChoices = SlashStringOption | SlashIntegerOption | SlashBooleanOption | SlashNumberOption