import * as path from "path";
import {EventQueueService} from "../event-queue/event-queue.service";
import {LogService} from "../log/log.service";
import {TTS_SYNTHESIZE_EVENT_KEY} from "./tts.const";
import {exec} from "child_process";

export class TtsService {
    private readonly _scriptPath: string;
    private _eventQueue: EventQueueService;
    private readonly _log: LogService;

    constructor() {
        this._scriptPath = path.join(__dirname, '..', '..', 'static', 'speak.ps1');
        this._log = new LogService('TTS_SERVICE')

        this._eventQueue = new EventQueueService();
        this._eventQueue.on(TTS_SYNTHESIZE_EVENT_KEY, async (text: string) => {
            this._log.write(`Processing event "${TTS_SYNTHESIZE_EVENT_KEY}" with text: "${text}"...`)
            await this.synthesizeSpeech(text)
            this._log.write(`Event "${TTS_SYNTHESIZE_EVENT_KEY}" finished with text: "${text}"`)
            this._eventQueue.emit('end')
        });
    }

    addToAudioQueue(text: string) {
        this._eventQueue.enqueue(TTS_SYNTHESIZE_EVENT_KEY, text);
    }

    async synthesizeSpeech(text: string) {
        const command = `powershell -ExecutionPolicy Bypass -File "${this._scriptPath}" -text "${text}"`;

        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error || stderr) {
                    this._log.error(error || stderr)
                    return reject(error || stderr);
                }

                resolve(stdout ? this._log.write(`Stdout: ${stdout}`) : null)
            })
        });
    }
}
