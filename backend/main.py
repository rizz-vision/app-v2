import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.errors.handlers import register_handlers
from app.services import tts_service

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load Kokoro pipelines in a thread so startup doesn't block the event loop.
    # First real /tts request would trigger this anyway, but doing it at boot means
    # the first user never waits 20-30s for model download.
    logger.info("Warming up Kokoro TTS pipelines…")
    await asyncio.to_thread(tts_service.warmup)
    logger.info("TTS warmup complete.")
    yield


app = FastAPI(title="rizzvision-v2", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

register_handlers(app)
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
