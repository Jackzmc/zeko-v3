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
    #mod: string;
    /**
     * Creates an instance of Logger.
     * @param {string} name The name to use for logging purposes
     */
    constructor(name: string) {
        this.#mod = name
    }

    /**
     * Normal log
     *
     * @param {...*} args Any arguments to pass to log
     */
    log(...args: any[]): void {
        console.log(`[${getDate()}] [${this.#mod}]`, ...args)
    }

    /**
     * A printed and nice warning message
     *
     * @param {...*} args Any arguments to pass to log
     */
    warn(...args: any[]): void {
        console.warn(chalk.yellow(`[${getDate()}] [WARN::${this.#mod}]`,...args))
    }
    /**
     * Error log
     *
     * @param {...*} args Any arguments to pass to log
     */
    error(...args: any[]): void {
        console.error(chalk.red(`[${getDate()}] [ERROR::${this.#mod}]`), ...args)
    }
    /**
     *  Prints an error and terminates bot
     *
     * @param {...*} args Any arguments to pass to log
     */
    severe(...args: any[]): void {
        console.error(chalk.red(`[${getDate()}] [SEVERE::${this.#mod}]`), ...args)
        process.exit(1);
    }
    /**
     * Prints an info log with green coloring
     *
     * @param {...*} args Any arguments to pass to log
     */
    success(...args: any[]): void {
        console.info(chalk.green(`[${getDate()}] [INFO::${this.#mod}]`), ...args)
    }

    /**
     * Only runs if NODE_ENV is not production
     *
     * @param {...*} args Any arguments to pass to log
     */
    debug(...args: any[]): void {
        if(process.env.NODE_ENV !== "production") {
            console.debug(chalk.magenta(`[${getDate()}] [DEBUG::${this.#mod}]`), ...args)
        }
    }

    /**
     * info log
     *
     * @param {...*} args Any arguments to pass to log
     */
    info(...args: any[]): void {
        console.info(chalk.cyan(`[${getDate()}] [INFO::${this.#mod}]`), ...args)
    }

}

function getDate() : string{
    return new Date().toLocaleTimeString('en-US', {hour12:USE_12_HOUR})
}
