import {TwitchRouter} from "./twitch/twitch.router";
import {startWebServer} from "./web/web.server";

async function bootstrap() {
    startWebServer(3210);

    await new TwitchRouter().init()
}

bootstrap()