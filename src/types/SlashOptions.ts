import { ApplicationCommandOptionType, AutocompleteFocusedOption, AutocompleteInteraction, CommandInteraction, Snowflake } from 'discord.js'
import { ChannelType } from 'discord-api-types/v9'
import OptionResult from './OptionResult.js'

// Includes elements that are part of official api and not custom to zeko
export type SlashHandlerFunction = (interaction: CommandInteraction, options?: OptionResult) => void | Promise<any>
export type SlashAutocompleteHandlerFunction = (interaction: AutocompleteInteraction, focused: AutocompleteFocusedOption) => void | Promise<any>

export interface SlashOfficialConfig {
    name: string,
    description: string,
    options?: SlashOption[],
}

export interface SlashCommandConfig extends SlashOfficialConfig {
    guilds?: Snowflake[]
    defaultPermissions?: "ALL" | "NONE"
    forceRegister?: boolean
}

export interface SlashOptionBase {
    name: string,
    type: ApplicationCommandOptionType
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
export type AllowedChannelType = ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildCategory | ChannelType.GuildNews | ChannelType.GuildDirectory | ChannelType.GuildNewsThread | ChannelType.GuildPublicThread | ChannelType.GuildPrivateThread | ChannelType.GuildStageVoice
export {
    ChannelType
}

export interface SlashSubCommandOption extends SlashOptionBase {
    type: ApplicationCommandOptionType.Subcommand,
    handler?: SlashHandlerFunction,
    options?: SlashSubOption[]
}

export interface SlashSubCommandGroupOption extends SlashOptionBase {
    type: ApplicationCommandOptionType.SubcommandGroup,
    options?: SlashSubOption[]
}

export interface SlashStringOption extends SlashChoicesOption<string>, SlashAutocomplete  {
    type: ApplicationCommandOptionType.String,
}

export interface SlashIntegerOption extends SlashChoicesOption<Integer>, SlashAutocomplete  {
    type: ApplicationCommandOptionType.Integer,
}

export interface SlashBooleanOption extends SlashOptionValue {
    type: ApplicationCommandOptionType.Boolean,
}

export interface SlashUserOption extends SlashOptionValue {
    type: ApplicationCommandOptionType.User,
}

export interface SlashChannelOption extends SlashOptionValue {
    type: ApplicationCommandOptionType.Channel,
    channelTypes?: AllowedChannelType[] 
}


export interface SlashRoleOption extends SlashOptionValue {
    type: ApplicationCommandOptionType.Role,
}

export interface SlashMentionableOption extends SlashOptionValue {
    type: ApplicationCommandOptionType.Mentionable,
}

export interface SlashNumberOption extends SlashChoicesOption<number>, SlashAutocomplete  {
    type: ApplicationCommandOptionType.Number,
}

// Subcommands do not support nesting:
export type SlashSubOption = SlashStringOption | SlashIntegerOption | SlashBooleanOption | SlashUserOption | SlashChannelOption | SlashRoleOption | SlashMentionableOption | SlashNumberOption
export type SlashOption = SlashSubCommandOption | SlashSubCommandGroupOption | SlashSubOption

export type SlashHasChoices = SlashStringOption | SlashIntegerOption | SlashBooleanOption | SlashNumberOption