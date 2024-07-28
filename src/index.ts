import {TwitchRouter} from "./twitch/twitch.router";

async function bootstrap() {
    await new TwitchRouter().init()
}

bootstrap()