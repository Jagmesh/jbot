import EventEmitter from "events";
import {LogService} from "../log/log.service";

export class EventQueueService extends EventEmitter {
    processing: boolean = false
    queue: any[] = []
    private readonly _log: LogService;

    constructor() {
        super()
        this._log = new LogService('EVENT_QUEUE_SERVICE')
    }

    enqueue(eventName: string, eventData: any) {
        this.queue.push({eventName, eventData});
        this._log.write(`Adding event to queue: ${eventName}`)
        this.processQueue();
    }

    processQueue() {
        if (this.processing) return;

        this.processing = true;
        const processNext = () => {
            if (this.queue.length === 0) {
                this.processing = false;
                return;
            }

            const {eventName, eventData} = this.queue.shift();
            this.emit(eventName, eventData);
            this.once('end', () => {
                this._log.write(`Processing of event ${eventName} ended. Processing next event...`)
                setImmediate(processNext);
            })
        };

        processNext();
    }
}