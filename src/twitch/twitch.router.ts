import { ChatClient } from '@twurple/chat'
import { ApiClient } from '@twurple/api'
import { EventSubWsListener } from '@twurple/eventsub-ws'
import { StaticAuthProvider } from '@twurple/auth'
import { TwitchService } from './twitch.service'
import { ConfigService } from '../config/config.service'
import Logger from 'jblog'

export class TwitchRouter {
    private readonly _log = new Logger({ scopes: ['TWITCH', 'ROUTER'] })
    private readonly _config = new ConfigService()

    private readonly _apiClient: ApiClient
    private readonly _chatClient: ChatClient
    private readonly _eventSub: EventSubWsListener

    private readonly _twitchService: TwitchService

    constructor() {
        const channel = this._config.config.TWITCH_CHANNEL_NAME

        const mainChannelAuthProvider = new StaticAuthProvider(this._config.config.TWITCH_CLIENT_ID, this._config.config.TWITCH_ACCESS_TOKEN)
        this._apiClient = new ApiClient({
            authProvider: mainChannelAuthProvider
        })

        const chatAuthProvider = new StaticAuthProvider(this._config.config.TWITCH_BOT_CLIENT_ID, this._config.config.TWITCH_BOT_ACCESS_TOKEN)
        this._chatClient = new ChatClient({
            authProvider: chatAuthProvider,
            channels: [channel],
            requestMembershipEvents: true
        })

        this._eventSub = new EventSubWsListener({
            apiClient: this._apiClient
        })

        this._twitchService = new TwitchService()
    }

    async init() {
        this._chatClient.connect()
        this._eventSub.start()

        this._registerChatEvents()
        await this._registerEventSubEvents()

        this._log.info('Twurple initialized')
    }

    private _registerChatEvents() {
        this._chatClient.onMessage((channel, user, text, msg) => {
            console.log('channel', channel)
            console.log('user', user)
            console.log('text', text)
            for (const key in msg) {
                // @ts-ignore
                console.log(`msg_key:${key}`, msg[key])
            }

            if (msg.isRedemption) return;

            this._twitchService.sendChatMessageToWidget(msg.userInfo.displayName, text, msg.userInfo.color)
        })

        this._log.info(this._log.highlight('message') + ' event registered')
    }

    private async _registerEventSubEvents() {
        const broadcaster = await this._apiClient.users.getUserByName(
            this._config.config.TWITCH_CHANNEL_NAME
        )

        if (!broadcaster) {
            throw new Error('Broadcaster not found')
        }

        this._eventSub.onChannelRedemptionAdd(
            broadcaster.id,
            event => {
                this._log.info('Redeem event')
                this._log.info(`User ${event.userDisplayName} redeemed ${event.rewardId} with msg "${event.input}"`)

                switch (event.rewardId) {
                    case this._config.config.TWITCH_EVENT_REDEEM_TTS_REWARD_ID:
                        this._twitchService.processTTSReward(event.userDisplayName, event.input)
                        break;
                    default:
                }
            }
        )

        this._log.info(this._log.highlight('redeem') + ' event registered')
    }
}
