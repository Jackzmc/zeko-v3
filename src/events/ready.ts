import CoreEvent from '../core/types/CoreEvent.js'
export default class extends CoreEvent {
    private fired = false

    async every() {
        this.logger.info(`Discord.js now ready`);
        if(!this.fired) {
            this.fired = true;
            if(this.core.isReady) {
                await this.fireReady()
            } else {
                let timer = setInterval(() => {
                    if(this.core.isReady) {
                        this.fireReady()
                        clearInterval(timer)
                    }
                }, 1000)
            }
        }
        return true
    }

    private async fireReady() {
        await Promise.all([
            this.core.modules._ready(),
            this.core.commands._ready(),
            this.core.events._ready()
        ])
        this.logger.info(`Bot now ready`);
    }
}