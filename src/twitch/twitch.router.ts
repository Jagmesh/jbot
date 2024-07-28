import * as tmi from 'tmi.js'
import {TtsService} from "../tts/tts.service";
import {LogService} from "../log/log.service";
import {TwitchService} from "./twitch.service";
import {ClassMethodNamesType} from "./twitch.type";
import {ConfigService} from "../config/config.service";


export class TwitchRouter {
    private readonly _client: tmi.Client;
    private readonly _tts: TtsService;
    private readonly _log: LogService;
    private readonly _twitchService: TwitchService;
    private readonly _subscribedEvents: ClassMethodNamesType<TwitchService>[] = [
        'redeem',
    ]
    private readonly _config: ConfigService;

    constructor() {
        this._config = new ConfigService()
        this._client = new tmi.Client({
            options: {debug: true},
            channels: [this._config.config.TWITCH_CHANNEL_NAME]
        });
        this._tts = new TtsService()
        this._log = new LogService('TWITCH', 'ROUTER')
        this._twitchService = new TwitchService()
    }

    async init() {
        await this._client.connect();

        for (const eventName of this._subscribedEvents) {
            this._client.on(eventName, (...args) => {this._twitchService[eventName](...args)})
            this._log.write(`[${eventName}] event registered`)
        }
    }
}


