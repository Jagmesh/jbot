import * as tmi from 'tmi.js'
import {TwitchService} from "./twitch.service";
import {ClassMethodNamesType} from "./twitch.type";
import {ConfigService} from "../config/config.service";
import Logger from 'jblog'

export class TwitchRouter {
    private readonly _client: tmi.Client;
    private readonly _log = new Logger({scopes: ['TWITCH', 'ROUTER']});
    private readonly _twitchService: TwitchService;
    private readonly _config: ConfigService = new ConfigService();

    private readonly _subscribedEvents: ClassMethodNamesType<TwitchService>[] = [
        'redeem',
    ]

    constructor() {
        this._client = new tmi.Client({
            options: { debug: true },
            channels: [this._config.config.TWITCH_CHANNEL_NAME],
            connection: { reconnect: true },
            identity: {
                username: this._config.config.TWITCH_BOT_USERNAME,
                password: this._config.config.TWITCH_BOT_ACCESS_TOKEN
            },
            logger: {
                info: (data) => {
                    this._log.info('[internal]', data)
                },
                warn: (data) => {
                    this._log.warn('[internal]', data)
                },
                error: (data) => {
                    this._log.error('[internal]', data)
                }
            }
        });
        this._twitchService = new TwitchService(this._client);
    }

    async init() {
        await this._client.connect()

        for (const eventName of this._subscribedEvents) {
            this._client.on(eventName, (...args) => {
                this._twitchService[eventName](...args)
            })
            this._log.info(`${this._log.highlight(eventName)} event registered`)
        }
    }
}


