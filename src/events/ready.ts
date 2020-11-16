import CoreEvent from '../core/types/CoreEvent.js'
export default class extends CoreEvent {
    once(/* args */) {
        //Fires only once.
    }
    every(/* args */) {
        //Fires every time.
        this.logger.info(`Bot now ready`);
    }
}