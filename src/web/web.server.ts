// src/web/web.server.ts
import path from "path";
import express = require("express");

export function startWebServer(port = 3210) {
    const app = express();

    const staticDir = path.join(__dirname, "..", "..", "static");

    // Раздача статических файлов (player.html, mp3, wav и т.д.)
    app.use(express.static(staticDir));

    // Главная страница
    app.get("/", (_req, res) => {
        res.sendFile(path.join(staticDir, "player.html"));
    });

    app.listen(port, "127.0.0.1", () => {
        // eslint-disable-next-line no-console
        console.log(`[WEB] http://127.0.0.1:${port}/`);
    });
}