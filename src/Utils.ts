/**
 @module Utils
 @description A collection of utilities to help development
*/

import { Client } from 'discord.js';
import { inspect } from 'util';

export default function(client: Client) {
    const token_regex = new RegExp(`(${client.token})`,"g")
    return {

        /**
         * Cleans the specified text, removing any mentions and any discord token
         *
         * @param {string} text Text to clean
         * @returns {string} The cleaned text
         */
        clean(text: string) : string{
            if (typeof(text) !== "string")
               text = inspect(text,{depth:0})
            return text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203))
            .replace(token_regex,"[token]")
        },

        /**
         * Formates the number into bytes
         *
         * @param {Number} number The number to format from
         * @param {Number} precision The number of decimal points to keep
         * @returns {string} A human-readable filesize (ex: 20 MB, or 5 GB)
         */
        formatBytes(a: number, b: number): string {
            if(0==a)return"0 Bytes";var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]
        }
    }
}