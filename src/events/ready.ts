import CoreEvent from '../core/types/CoreEvent.js'
export default class extends CoreEvent {
    #fired = false

    every(/* args */) {
        if(!this.#fired) {
            // TODO: Delay until this.core.isReady to prevent race-condition
            this.#fired = true;
            Promise.all([
                this.core.modules.ready(),
                this.core.commands.ready(),
                this.core.events.ready()
            ])
        }
        //Fires every time.
        this.logger.info(`Bot now ready`);
    }
}