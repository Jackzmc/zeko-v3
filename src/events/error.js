import CoreEvent from '../core/types/CoreEvent.js'
export default class extends CoreEvent {
    once(/* args */) {
        //Fires only once.
    }
    every(error) {
        //Fires every time.
        this.logger.error(error.code, error)
    }
}