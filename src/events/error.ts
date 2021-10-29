import CoreEvent from '../core/types/CoreEvent.js'
export default class extends CoreEvent {
    every(error) {
        //Fires every time.
        this.logger.error(error.code, error)
        return true
    }
}