import {TwitchRouter} from "./twitch/twitch.router";
import {WebServer} from "./web/web.server";
import {QwenService} from "./tts/qwen/qwen.service";
import Logger from "jblog";

async function bootstrap() {
    ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
        process.on(signal, shutdown);
    });

    await QwenService.init()
    new WebServer().start()

    await new TwitchRouter().init()
}

const shutdown = (signal: any) => {
    new Logger().warn(`Signal ${signal} received, closing...`);
    QwenService.close()

    process.exit(0);
};

bootstrap()