import 'dotenv/config'
import {IAppConfig} from "./config.type";

export class ConfigService {
    private readonly _app_config: IAppConfig = Object.freeze(this._validateConfig({
        TWITCH_BOT_USERNAME: process.env.TWITCH_BOT_USERNAME,
        TWITCH_BOT_ACCESS_TOKEN: process.env.TWITCH_BOT_ACCESS_TOKEN,
        TWITCH_BOT_CLIENT_ID: process.env.TWITCH_BOT_CLIENT_ID,

        TWITCH_CHANNEL_NAME: process.env.TWITCH_CHANNEL_NAME,
        TWITCH_ACCESS_TOKEN: process.env.TWITCH_ACCESS_TOKEN,
        TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,

        TWITCH_EVENT_REDEEM_TTS_REWARD_ID: process.env.TWITCH_EVENT_REDEEM_TTS_REWARD_ID,
        TWITCH_USER_BLACKLIST: process.env.TWITCH_USER_BLACKLIST
            ? process.env.TWITCH_USER_BLACKLIST.split(',')
            : [],

        CONDA_BAT_PATH: process.env.CONDA_BAT_PATH
    }))
    constructor() {}

    private _validateConfig(config: Partial<IAppConfig>): IAppConfig {
        for (const [key, value] of Object.entries(config)) {
            if (typeof value !== 'boolean' && !value)
                throw new Error(`[CONFIG_SERVICE] Missing value for [${key}] in APP_CONFIG`);

            if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                this._validateConfig(value);
            }
        }

        return config as Required<IAppConfig>;
    }

    get config() {
        return this._app_config
    }
}