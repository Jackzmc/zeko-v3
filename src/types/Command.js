export default class {
    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
    }

    run(msg, args, flags) {

    }

    config() {
        return {
            usageIfNotSet: true,
        }
    }

    /*help() {
        return {
            name: [],
            description: 'A base command.',
            usage: '',
            flags: {}
        }
    }*/
}