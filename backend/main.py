import asyncio
import logging
import os
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

_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
if not _ALLOWED_ORIGINS:
    # Default: allow Vercel preview URLs + localhost dev
    _ALLOWED_ORIGINS = [
        "https://rizzvision.vercel.app",
        "https://*.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

register_handlers(app)
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# HuggingFace Spaces pings /?logs=container — return 200 to suppress log noise
@app.get("/")
def root():
    return {"status": "ok"}
