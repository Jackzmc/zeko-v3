import CoreEvent from '../core/types/CoreEvent.js'
export default class extends CoreEvent {
    #fired = false

    every(/* args */) {
        if(!this.#fired) {
            this.#fired = true;
            this.client.managers.moduleManager.ready();
        }
        //Fires every time.
        this.logger.info(`Bot now ready`);
    }
}