import * as tmi from 'tmi.js'
import {Events} from 'tmi.js'
import {TtsService} from "../tts/tts.service";
import {ConfigService} from "../config/config.service";
import Logger from "jblog";
import {SYNTHESIS_PROVIDER} from "../tts/tts.const";
import {WebServer} from "../web/web.server";

export class TwitchService implements Partial<Events> {
    private readonly _tts: TtsService = new TtsService();
    private readonly _log = new Logger({scopes: ['TWITCH', 'SERVICE']});
    private readonly _config: ConfigService = new ConfigService();

    constructor(readonly _client: tmi.Client) {}

    message(channel: string, tags: tmi.ChatUserstate, message: string, self: boolean, ...rest: any[]) {
        // console.log('channel', channel)
        // console.log('tags', tags)
        // console.log('message', message)
        // console.log('self', self)
        // console.log('rest', rest)

        if (self) return;
        this._log.info(`Message from ${tags.username}: ${message}`)
        WebServer.broadcastChatMessage({
            text: message,
            user: tags["display-name"] || 'unknown',
            color: tags.color || '#ffffff',
        })
    }

    redeem(channel: string, username: string, rewardID: string, ...rest: any[]) {
        // there is actually a msg as a last arg here
        const [_, msg] = rest as unknown as [tmi.ChatUserstate, string]
        this._log.info('Redeem event')
        this._log.info(`User ${username} redeemed ${rewardID} with msg "${msg}"`)
        this._log.info(`Length of message: ${msg.length}`)
        if (rewardID !== this._config.config.TWITCH_EVENT_REDEEM_TTS_REWARD_ID) return;
        if (this._config.config.TWITCH_USER_BLACKLIST.includes(username)) return this._log.warn(`User ${username} is blacklisted`);
        const {originalText, provider} = extractProvider(msg);

        this._tts.addToAudioQueue(`${username} говорит: ${originalText.replaceAll('\"', '')}`, provider ?? SYNTHESIS_PROVIDER.GOOGLE)
    }
}

function extractProvider(text: string): {
    originalText: string,
    provider: SYNTHESIS_PROVIDER | null
}  {
    const splitted = text.split('|')
    if (splitted.length < 2) return { originalText: text, provider: null };
    const provider = splitted[0].trim().toUpperCase()

    return {
        originalText: splitted.slice(1).join('').trim(),
        provider: Object.values(SYNTHESIS_PROVIDER).includes(provider as SYNTHESIS_PROVIDER)
            ? provider as SYNTHESIS_PROVIDER
            : null,
    }
}