import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.errors.handlers import register_handlers
from app.services import tts_service, clothing_detector

# ── Logging config ─────────────────────────────────────────────────────────────
# Show INFO+ from our code; suppress noisy third-party logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
# Suppress library noise
for _noisy in ("tensorflow", "absl", "h5py", "keras", "kokoro", "torch",
               "urllib3", "httpx", "httpcore", "uvicorn.access"):
    logging.getLogger(_noisy).setLevel(logging.ERROR)

logger = logging.getLogger("rizzvision")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("🚀 Rizzvision backend starting up")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    # 1. TTS warmup
    logger.info("[1/2] Loading Kokoro TTS pipelines (en + hi)…")
    try:
        await asyncio.to_thread(tts_service.warmup)
        logger.info("[1/2] ✓ TTS ready")
    except Exception as exc:
        logger.error("[1/2] ✗ TTS warmup failed: %s", exc)

    # 2. Clothing classifier
    logger.info("[2/2] Loading clothing classifier v3 (EfficientNetB3, 115 MB)…")
    try:
        await asyncio.to_thread(clothing_detector._load)
        logger.info("[2/2] ✓ Clothing classifier ready — thresholds: %s", clothing_detector._thresholds)
    except Exception as exc:
        logger.error("[2/2] ✗ Clothing classifier failed to load: %s", exc)

    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("✅ All models loaded — accepting requests")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    yield
    logger.info("🛑 Rizzvision backend shutting down")


app = FastAPI(title="rizzvision-v2", version="2.0.0", lifespan=lifespan)

_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
if not _ALLOWED_ORIGINS:
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


@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/")
def root():
    return {"status": "ok"}
