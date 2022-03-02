import CoreEvent from '../core/types/CoreEvent.js'

const MAX_TIMEOUT_SEC: number = 20

export default class extends CoreEvent {
    private readyTimeout: number

    async every() {
        this.logger.info(`Discord.js now ready`);
        if(this.readyTimeout === 0) {
            this.readyTimeout = 1;
            if(this.core.isReady) {
                await this.fireReady()
            } else {
                let timer = setInterval(() => {
                    if(this.core.isReady) {
                        this.fireReady()
                        clearInterval(timer)
                    } else if(++this.readyTimeout > MAX_TIMEOUT_SEC) {
                        this.logger.severe('Bot did not initalize in time.')
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