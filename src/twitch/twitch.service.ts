import {TtsService} from "../tts/tts.service";
import {ConfigService} from "../config/config.service";
import Logger from "jblog";
import {SYNTHESIS_PROVIDER} from "../tts/tts.const";
import {WebServer} from "../web/web.server";

export class TwitchService {
    private readonly _tts = new TtsService()
    private readonly _log = new Logger({ scopes: ['TWITCH', 'SERVICE'] })
    private readonly _config = new ConfigService()

    sendChatMessageToWidget(username: string, text: string, color: string | undefined) {
        this._log.info(`Message from ${username}: ${text}`)

        WebServer.broadcastChatMessage({
            text: text,
            user: username,
            color: color ?? '#ffffff'
        })
    }

    processTTSReward(username: string, message: string) {
        if (this._config.config.TWITCH_USER_BLACKLIST.includes(username)) return this._log.warn(`User ${username} is blacklisted`)
        if (message.trim().length === 0) return this._log.warn(`Message from ${username} is empty`)

        const { originalText, provider } = extractProvider(message)

        this._tts.addToAudioQueue(
            `${username} говорит: ${originalText.replaceAll('"', '')}`,
            provider ?? SYNTHESIS_PROVIDER.GOOGLE
        )
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