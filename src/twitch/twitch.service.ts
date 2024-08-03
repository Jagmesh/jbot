import * as tmi from 'tmi.js'
import {Events} from 'tmi.js'
import {TtsService} from "../tts/tts.service";
import {LogService} from "../log/log.service";
import {ConfigService} from "../config/config.service";


export class TwitchService implements Partial<Events> {
    private readonly _tts: TtsService;
    private readonly _log: LogService;
    private readonly _config: ConfigService;

    constructor() {
        this._config = new ConfigService();
        this._tts = new TtsService()
        this._log = new LogService('TWITCH', 'SERVICE')
    }

    redeem(channel: string, username: string, rewardID: string, ...rest: any[]) {
        // there is actually a msg as a last arg here
        const [chatUserState, msg] = rest as unknown as [tmi.ChatUserstate, string]
        this._log.write('Redeem event')
        this._log.write(`User ${username} redeemed ${rewardID} with msg "${msg}"`)
        if (rewardID !== this._config.config.TWITCH_EVENT_REDEEM_TTS_REWARD_ID) return;
        if (this._config.config.TWITCH_USER_BLACKLIST.includes(username)) return;

        this._tts.addToAudioQueue(`${username} говорит: ${msg.replaceAll('\"', '')}`)
    }
}