import * as tmi from 'tmi.js'
import {Events} from 'tmi.js'
import {TtsService} from "../tts/tts.service";
import {ConfigService} from "../config/config.service";
import Logger from "jblog";


export class TwitchService implements Partial<Events> {
    private readonly _tts: TtsService = new TtsService();
    private readonly _log = new Logger({scopes: ['TWITCH', 'SERVICE']});
    private readonly _config: ConfigService = new ConfigService();


    redeem(channel: string, username: string, rewardID: string, ...rest: any[]) {
        // there is actually a msg as a last arg here
        const [_, msg] = rest as unknown as [tmi.ChatUserstate, string]
        this._log.info('Redeem event')
        this._log.info(`User ${username} redeemed ${rewardID} with msg "${msg}"`)
        this._log.info(`Length of message: ${msg.length}`)
        if (rewardID !== this._config.config.TWITCH_EVENT_REDEEM_TTS_REWARD_ID) return;
        if (this._config.config.TWITCH_USER_BLACKLIST.includes(username)) return;

        this._tts.addToAudioQueue(`${username} говорит: ${msg.replaceAll('\"', '').slice(0, 200)}`)
    }
}