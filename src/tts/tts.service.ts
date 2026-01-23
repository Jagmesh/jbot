import * as path from "path";
import {EventQueueService} from "../event-queue/event-queue.service";
import {TTS_SYNTHESIZE_EVENT_KEY} from "./tts.const";
import {exec} from "child_process";
import gtts from "node-gtts"
import * as fs from "fs";
import Logger from "jblog";


export class TtsService {
    private readonly _scriptPath: string;
    private _eventQueue: EventQueueService = new EventQueueService();
    private readonly _log = new Logger({scopes: ['TTS_SERVICE']});
    private readonly _entryAudioFilePath: string;

    constructor() {
        this._scriptPath = path.join(__dirname, '..', '..', 'static', 'speak.ps1');
        this._entryAudioFilePath = path.join(__dirname, '..', '..', 'static', 'hello.mp3')

        this._eventQueue.on(TTS_SYNTHESIZE_EVENT_KEY, async (text: string) => {
            this._log.info(`Processing event "${TTS_SYNTHESIZE_EVENT_KEY}" with text: "${text}"...`)
            await this.synthesizeSpeech(text)
            this._log.success(`Event "${TTS_SYNTHESIZE_EVENT_KEY}" finished with text: "${text}"`)
            this._eventQueue.emit('end')
        });
    }

    addToAudioQueue(text: string) {
        this._eventQueue.enqueue(TTS_SYNTHESIZE_EVENT_KEY, text);
    }

    async synthesizeSpeechMicrosoft(text: string): Promise<void | null> {
        const command = `powershell -ExecutionPolicy Bypass -File "${this._scriptPath}" -text "${text}"`;

        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error || stderr) {
                    this._log.error(error || stderr)
                    return reject(error || stderr);
                }

                resolve(stdout ? this._log.info(`Stdout: ${stdout}`) : null)
            })
        });
    }

    async synthesizeSpeech(text: string): Promise<void | null> {
        const filepath = `gtts_${Math.round(Math.random() * 1_000_000)}.wav`

        return new Promise((resolve) => {
            gtts('ru').save(filepath, text, async () => {
                this._log.info('File saved')
                await this._playAudio(this._entryAudioFilePath)
                await this._playAudio(filepath);
                fs.unlink(filepath, (err) => err ? this._log.error(err) : null)
                resolve(null)
            })
        })
    }

    private async _playAudio(filePath: string): Promise<null> {
        this._log.info(`Playing [${filePath}]`)
        const audic = new (await import("audic").then(audic => audic.default))(filePath)
        await audic.play()

        return new Promise(resolve => {
            // @ts-ignore there is such a method
            audic.addEventListener('ended', (event) => {
                this._log.success(`File [${filePath}] playing ended`)
                resolve(null)
            })
        })

    }
}
