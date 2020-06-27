import chalk from 'chalk'
const USE_12_HOUR = process.env.LOG_12_HOUR !== "undefined"

export default class Logger {
    constructor(name,settings = {}) {
        let prefix;
        switch(settings.type){
            case "mod":
            case "module":
                prefix = "mod/";
                break;
            case "event":
                prefix = "event/";
                break;
            case "command":
            case "cmd":
                prefix = "cmd/";
                break;
        }
        this.mod =  prefix? prefix+name : name
    }

    log(...args) {
        console.log(`[${getDate()}] [${this.mod}]`, ...args)
    }

    warn(...args) {
        console.warn(chalk.yellow(`[${getDate()}] [WARN::${this.mod}]`,...args))
    }
    error(...args) {
        console.error(chalk.red(`[${getDate()}] [ERROR::${this.mod}]`), ...args)
    }
    servere(...args) {
        console.error(chalk.red(`[${getDate()}] [SEVERE::${this.mod}]`), ...args)
        process.exit(1);
    }
    success(...args) {
        console.info(chalk.green(`[${getDate()}] [INFO::${this.mod}]`), ...args)
    }

    debug(...args) {
        if(process.env.NODE_ENV !== "production") {
            console.debug(`[${getDate()}] [DEBUG::${this.mod}]`, ...args)
        }
    }

    info(...args) {
        console.info(`[${getDate()}] [INFO::${this.mod}]`, ...args)
    }

}

function getDate() {
    return new Date().toLocaleTimeString('en-US', {hour12:USE_12_HOUR})
}