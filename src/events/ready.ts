import CoreEvent from '../core/types/CoreEvent.js'
export default class extends CoreEvent {
    #fired = false

    async every(/* args */) {
        this.logger.info(`Discord.js now ready`);
        if(!this.#fired) {
            // TODO: Delay until this.core.isReady to prevent race-condition
            this.#fired = true;
            await Promise.all([
                this.core.modules._ready(),
                this.core.commands._ready(),
                this.core.events._ready()
            ])
            this.logger.info(`Bot now ready`);
        }
        return true
        //Fires every time.
    }
}