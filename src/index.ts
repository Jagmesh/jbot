import {TwitchRouter} from "./twitch/twitch.router";
import {WebServer} from "./web/web.server";

async function bootstrap() {
    new WebServer().start()

    await new TwitchRouter().init()
}

bootstrap()