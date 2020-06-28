/**
 @module Utils
*/

import {inspect } from 'util';

export default function(client) {
    const token_regex = new RegExp(`(${client.token})`,"g")
    return {
        clean(text) {
            if (typeof(text) !== "string")
               text = inspect(text,{depth:0})
            return text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203))
            .replace(token_regex,"[token]")
        },
        formatBytes(a,b){
            if(0==a)return"0 Bytes";var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]
        }
    }
}