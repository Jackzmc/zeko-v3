import CoreEvent from '../core/types/CoreEvent.js'
export default class extends CoreEvent {
    #fired = false

    every(/* args */) {
        if(!this.#fired) {
            this.#fired = true;
            this.core.modules.ready()
            this.core.commands.registerPending()
        }
        //Fires every time.
        this.logger.info(`Bot now ready`);
    }
}