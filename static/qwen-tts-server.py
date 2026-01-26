import argparse
import io
import time
import asyncio
import inspect
import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from qwen_tts import Qwen3TTSModel


def log(*args, **kwargs) -> None:
    print("[QWEN_TTS_SERVER]", *args, **kwargs)


def parse_args():
    parser = argparse.ArgumentParser(description="Mini Qwen3-TTS Server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9000)
    parser.add_argument("--reload", action="store_true")
    return parser.parse_args()


MODEL_ID = "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice"
DEVICE = "cpu"
DTYPE = torch.bfloat16

log("Loading model, this may take a while...")
model = Qwen3TTSModel.from_pretrained(
    MODEL_ID,
    device_map=DEVICE,
    dtype=DTYPE
)
log("Model loaded.")

app = FastAPI(title="Mini Qwen3-TTS Server")


class TTSRequest(BaseModel):
    text: str
    speaker: str = "Ryan"
    language: str = "Auto"


async def _run_with_elapsed_logger(func, *args, **kwargs):
    """
    Запускает blocking-функцию func в executor и параллельно логирует
    прошедшие секунды в консоль до завершения.
    Возвращает результат func(...) и время выполнения в секундах.
    """
    stop = asyncio.Event()
    start = time.time()

    async def ticker():
        sec = 0
        # используем '\r' чтобы перезаписывать строку в консоли
        while not stop.is_set():
            sec += 1
            print(f"[QWEN_TTS_SERVER] Generating... {sec}s", end="\r", flush=True)
            try:
                await asyncio.wait_for(stop.wait(), timeout=1.0)
            except asyncio.TimeoutError:
                continue

    ticker_task = asyncio.create_task(ticker())
    loop = asyncio.get_running_loop()
    try:
        result = await loop.run_in_executor(None, lambda: func(*args, **kwargs))
        elapsed = time.time() - start
        return result, elapsed
    finally:
        stop.set()
        await ticker_task
        # перенос строки, чтобы не затирать следующую строку лога
        print()
        log(f"TTS generation finished (approx {time.time() - start:.2f}s)")


@app.post("/synthesize")
async def synthesize(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        # обычный блокирующий вызов: запускаем и логируем секунды
        (wavs, sr), elapsed = await _run_with_elapsed_logger(
            model.generate_custom_voice,
            text=req.text,
            language=req.language,
            speaker=req.speaker
        )

        log(f"TTS took {elapsed:.2f}s")
        buf = io.BytesIO()
        sf.write(buf, wavs[0], sr, format="WAV")
        buf.seek(0)
        return StreamingResponse(buf, media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    args = parse_args()
    import uvicorn
    uvicorn.run(
        "qwen-tts-server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )
