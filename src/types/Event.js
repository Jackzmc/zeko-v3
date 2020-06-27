export default class {
    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
    }

    /**
     * Fires before the core event (if exists) is fired. Must return a promise.
     *
     * @returns Promise
     */
    before(/* args */) {
        return new Promise((resolve,reject) => {
            resolve(false)
        })
    }
    //Things to run AFTER core event fires.
    after() {

    }
}