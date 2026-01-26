import {spawn} from "child_process";
import axios from "axios";
import Logger from "jblog";
import { CONDA_ENV_NAME, PY_SERVER_SCRIPT_PATH, QWEN_DEFAULT } from "./qwen.const";
import {ChildProcess} from "node:child_process";
import {ConfigService} from "../../config/config.service";

const log = new Logger({scopes: ['QWEN_SERVICE', 'PYTHON_SERVER']});
let pythonServer: ChildProcess;

export class QwenService {
    static readonly config: ConfigService = new ConfigService();
    static readonly serverEndpoint = `http://${QWEN_DEFAULT.PYTHON_SERVER_HOST}:${QWEN_DEFAULT.PYTHON_SERVER_PORT}`;

    // Запуск сервера Python через conda
    static async init() {
        log.info('Launching python server...');

        pythonServer = spawn(QwenService.config.config.CONDA_BAT_PATH, [
            "activate", CONDA_ENV_NAME,
            "&&",
            "python", PY_SERVER_SCRIPT_PATH, "--host", QWEN_DEFAULT.PYTHON_SERVER_HOST, "--port", QWEN_DEFAULT.PYTHON_SERVER_PORT,
        ], {
            shell: true,
            stdio: "inherit"
        });

        pythonServer.on("close", (code: number) => log.info(`Python server exited with code ${code}`));
        pythonServer.on("error", (err: Error) => {
            log.error(`Python server error: ${err.message}`)
            process.exit(1);
        });
        await QwenService.waitServerInitialization()
    }

    static async waitServerInitialization({
            timeoutMs = 5 * 60_000,
            intervalMs = 500,
        }: {
            timeoutMs?: number;
            intervalMs?: number;
        } = {}
    ): Promise<void> {
        const start = Date.now();

        while (true) {
            try {
                const res = await axios.get(`${QwenService.serverEndpoint}/health`, {
                    timeout: 2000,
                    validateStatus: () => true,
                });

                if (res.status === 200) return log.success(`Python server started successfully on ${QwenService.serverEndpoint}`);
            } catch {}

            if (Date.now() - start > timeoutMs) {
                throw new Error(`Python server startup timeout (${timeoutMs}ms)`);
            }

            await new Promise(r => setTimeout(r, intervalMs));
        }
    }

    static close() {
       return pythonServer?.kill()
    }

    static async synthesizeSpeech(text: string): Promise<Buffer> {
        const payload = {
            text,
            speaker: QWEN_DEFAULT.SPEAKER,
            language: QWEN_DEFAULT.LANGUAGE,
        };

        const response = await axios.post(
            `${QwenService.serverEndpoint}/synthesize`,
            payload,
            {
                responseType: "arraybuffer",
            }
        );

        return Buffer.from(response.data)
    }
}