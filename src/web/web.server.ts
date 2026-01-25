import path from "path";
import express = require("express");
import type {Response} from "express";
import Logger from "jblog";

const log = new Logger({scopes: ['WEB_SERVER']});

const sseClients = new Set<Response>();

export class WebServer {
    private readonly _log = log

    static broadcastPlay(urlPath: string) {
        log.info(`Broadcasting play event for ${urlPath}`)
        const payload = JSON.stringify({url: urlPath});

        for (const res of sseClients) {
            res.write(`event: play\n`);
            res.write(`data: ${payload}\n\n`);
        }
    }

    start(port = 3210) {
        const app = express();

        const rootDir = path.join(__dirname, "..", "..");
        const staticDir = path.join(rootDir, "static");
        const uiDir = path.join(rootDir, "ui", "dist");

        app.use(express.static(staticDir));
        app.use(express.static(uiDir));

        app.get("/", (_req, res) => {
            res.sendFile(path.join(uiDir, 'index.html'));
        });

        app.get("/events", (req, res) => {
            res.status(200);
            res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");

            res.flushHeaders?.();

            res.write("\n");

            sseClients.add(res);

            req.on("close", () => {
                sseClients.delete(res);
            });
        });

        const hostName = '127.0.0.1'
        app.listen(port, hostName, (error) => {
            if (error) throw error;
            this._log.success(`Server started on http://${hostName}:${port}`)
        });
    }
}