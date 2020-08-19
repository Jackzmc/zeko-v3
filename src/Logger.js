/**
 @module Logger
 @description A custom logger object
*/

import chalk from 'chalk'
const USE_12_HOUR = process.env.LOG_12_HOUR !== "undefined"

/**
 * @class
 */
export default class {

    /**
     * Creates an instance of Logger.
     * @param {string} name The name to use for logging purposes
     */
    constructor(name) {
        this.mod = name
    }

    /**
     * Normal log
     *
     * @param {...*} args Any arguments to pass to log
     */
    log(...args) {
        console.log(`[${getDate()}] [${this.mod}]`, ...args)
    }

    /**
     * A printed and nice warning message
     *
     * @param {...*} args Any arguments to pass to log
     */
    warn(...args) {
        console.warn(chalk.yellow(`[${getDate()}] [WARN::${this.mod}]`,...args))
    }
    /**
     * Error log
     *
     * @param {...*} args Any arguments to pass to log
     */
    error(...args) {
        console.error(chalk.red(`[${getDate()}] [ERROR::${this.mod}]`), ...args)
    }
    /**
     *  Prints an error and terminates bot
     *
     * @param {...*} args Any arguments to pass to log
     */
    severe(...args) {
        console.error(chalk.red(`[${getDate()}] [SEVERE::${this.mod}]`), ...args)
        process.exit(1);
    }
    /**
     * Prints an info log with green coloring
     *
     * @param {...*} args Any arguments to pass to log
     */
    success(...args) {
        console.info(chalk.green(`[${getDate()}] [INFO::${this.mod}]`), ...args)
    }

    /**
     * Only runs if NODE_ENV is not production
     *
     * @param {...*} args Any arguments to pass to log
     */
    debug(...args) {
        if(process.env.NODE_ENV !== "production") {
            console.debug(`[${getDate()}] [DEBUG::${this.mod}]`, ...args)
        }
    }

    /**
     * info log
     *
     * @param {...*} args Any arguments to pass to log
     */
    info(...args) {
        console.info(`[${getDate()}] [INFO::${this.mod}]`, ...args)
    }

}

function getDate() {
    return new Date().toLocaleTimeString('en-US', {hour12:USE_12_HOUR})
}
