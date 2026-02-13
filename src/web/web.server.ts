import path from "path";
import express = require("express");
import Logger from "jblog";
import {send, SSERouter} from "./sse/sse.router";

const log = new Logger({scopes: ['WEB_SERVER']});

export class WebServer {
    private readonly _log = log

    static broadcastPlay(urlPath: string) {
        log.info(`Broadcasting play event for ${urlPath}`)
        send('play_audio', {url: urlPath})
    }

    static broadcastChatMessage(data: {
                                    user: string
                                    color: string
                                    text: string
                                }) {
        log.info(`Broadcasting chat message event for {${data.user}: ${data.text}}`)
        send('chat_message', data)
    }

    start(port = 3210) {
        const app = express();

        const rootDir = path.join(__dirname, "..", "..");
        const staticDir = path.join(rootDir, "static");
        const uiDir = path.join(rootDir, "ui", "dist");

        app.use(express.static(staticDir));
        app.use(express.static(uiDir));

        app.use('/sse', SSERouter);

        app.get('/', (_req, res) => {
            res.sendFile(path.join(uiDir, 'index.html'));
        });

        app.get('/chat', (_req, res) => {
            res.sendFile(path.join(uiDir, 'chat.html'));
        });

        const hostName = '127.0.0.1'
        app.listen(port, hostName, (error) => {
            if (error) throw error;
            this._log.success(`Server started on http://${hostName}:${port}`)
            this._log.success(`Chat on http://${hostName}:${port}/chat`)
        });
    }
}