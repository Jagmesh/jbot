import express from 'express';
import type {Response} from "express";

export const SSERouter = express.Router();

const sseAudioClients = new Set<Response>();
SSERouter.get("/audio", (req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders?.();

    res.write("\n");

    sseAudioClients.add(res);

    req.on("close", () => {
        sseAudioClients.delete(res);
    });
});

const sseChatClients = new Set<Response>();
SSERouter.get("/chat", (req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders?.();

    res.write("\n");

    sseChatClients.add(res);

    req.on("close", () => {
        sseChatClients.delete(res);
    });
});

export function send(event: 'play_audio' | 'chat_message', payload: any) {
    let sse = undefined as Set<Response> | undefined;
    switch (event) {
        case 'play_audio':
            sse = sseAudioClients;
            break;
        case 'chat_message':
            sse = sseChatClients;
            break;
        default:
            throw new Error(`Unknown event ${event}`);
    }

    for (const res of sse) {
        res.write(`event: ${event}\n`);
        // TODO: add id to payload
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
}

