import * as path from "path";
import {EventQueueService} from "../event-queue/event-queue.service";
import {SYNTHESIS_PROVIDER, TTS_SYNTHESIZE_EVENT_KEY} from "./tts.const";
import {exec} from "child_process";
import gtts from "node-gtts"
import Logger from "jblog";
import {WebServer} from "../web/web.server";
import * as fs from "node:fs";
import {QwenService} from "./qwen/qwen.service";
import {getCurrentUnderscoreDateTime} from "./tts.util";

export class TtsService {
    private readonly _staticDir: string;
    private readonly _scriptFilePath: string;
    private _eventQueue: EventQueueService = new EventQueueService();
    private readonly _log = new Logger({scopes: ['TTS_SERVICE']});
    private readonly _entryAudioFilePath: string;
    private readonly _generatedAudiosDirPath: string;

    constructor() {
        this._staticDir = path.join(__dirname, '..', '..', 'static');
        this._scriptFilePath = path.join(this._staticDir, 'speak.ps1');
        this._entryAudioFilePath = path.join(this._staticDir, 'hello.mp3');
        this._generatedAudiosDirPath = path.join(this._staticDir, 'generated');

        this._eventQueue.on(TTS_SYNTHESIZE_EVENT_KEY, async ({text, provider}:{text: string, provider: SYNTHESIS_PROVIDER}) => {
            this._log.info(`Processing event "${TTS_SYNTHESIZE_EVENT_KEY}" with provider "${provider}" and with text: "${text}"...`)
            switch (provider) {
                case SYNTHESIS_PROVIDER.GOOGLE:
                    await this.synthesizeSpeechGoogle(text)
                    break;
                case SYNTHESIS_PROVIDER.MICROSOFT:
                    await this.synthesizeSpeechMicrosoft(text)
                    break;
                case SYNTHESIS_PROVIDER.QWEN:
                    await this.synthesizeSpeechQwen(text)
                    break;
                default:
                    await this.synthesizeSpeechGoogle(text)
            }
            this._log.success(`Event "${TTS_SYNTHESIZE_EVENT_KEY}" finished with text: "${text}"`)
            this._eventQueue.emit('end')
        });
    }

    addToAudioQueue(text: string, provider: SYNTHESIS_PROVIDER) {
        this._eventQueue.enqueue(TTS_SYNTHESIZE_EVENT_KEY, { text, provider });
    }

    async synthesizeSpeechMicrosoft(text: string): Promise<void | null> {
        const command = `powershell -ExecutionPolicy Bypass -File "${this._scriptFilePath}" -text "${text}"`;

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

    async synthesizeSpeechGoogle(text: string): Promise<void | null> {
        const filepath = path.join(this._generatedAudiosDirPath, `gtts_${Math.round(Math.random() * 1_000_000)}.wav`)

        return new Promise((resolve) => {
            gtts('ru').save(filepath, text, async () => {
                this._log.info(`File saved into {${filepath}}`)
                this._playAudio(this._entryAudioFilePath)
                this._playAudio(filepath)
                // TODO: add unlinking audiofiles after web finished playback
                this._log.success(`File {${filepath}} finished`)
                resolve(null)
            })
        })
    }

    async synthesizeSpeechQwen(text: string): Promise<void | null> {
        const filepath = path.join(this._generatedAudiosDirPath, `tts_${getCurrentUnderscoreDateTime()}_${Math.round(Math.random() * 1_000)}.wav`)

        const buffer = await QwenService.synthesizeSpeech(text).catch((error) => this._log.error(error));
        if (!buffer) return;

        await fs.promises.writeFile(filepath, buffer);
        this._log.info(`File saved into {${filepath}}`)

        this._playAudio(this._entryAudioFilePath)
        this._playAudio(filepath)
    }

    private _playAudio(filePath: string): void {
        this._log.info(`Playing [${filePath}]`)
        const rel = path.relative(this._staticDir, filePath);
        WebServer.broadcastPlay('/'+rel)
    }
}