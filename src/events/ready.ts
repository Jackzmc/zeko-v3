import CoreEvent from '../core/types/CoreEvent.js'
export default class extends CoreEvent {
    once(/* args */) {
        //Fires only once.
        this.client.managers.moduleManager.ready();
    }
    every(/* args */) {
        //Fires every time.
        this.logger.info(`Bot now ready`);
    }
}