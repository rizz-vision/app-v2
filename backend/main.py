import asyncio
import logging
import os
import warnings
from contextlib import asynccontextmanager

# Suppress Python-level deprecation/future warnings from torch and other libs
warnings.filterwarnings("ignore")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.errors.handlers import register_handlers
from app.services import tts_service, clothing_detector

# ── Silence noisy libraries (Python logging layer) ─────────────────────────────
for _lib in ("tensorflow", "absl", "h5py", "keras", "kokoro", "torch",
             "urllib3", "httpx", "httpcore"):
    logging.getLogger(_lib).setLevel(logging.ERROR)

# ── Suppress TF stderr noise via env vars (must be set before TF imports) ──────
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")        # suppress TF C++ logs
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")       # suppress oneDNN warning
os.environ.setdefault("PYTHONWARNINGS", "ignore")          # suppress Python warnings

# ── App logger ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("rizzvision")


# ── Filter health-check pings from access log ───────────────────────────────────
class _HealthFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        return not any(p in msg for p in ("/health", "HEAD /", "GET / "))

logging.getLogger("uvicorn.access").addFilter(_HealthFilter())


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("----------------------------------------")
    logger.info("Rizzvision backend starting")
    logger.info("----------------------------------------")

    logger.info("[1/2] Loading Kokoro TTS (en + hi)...")
    try:
        await asyncio.to_thread(tts_service.warmup)
        logger.info("[1/2] TTS loaded OK")
    except Exception as exc:
        logger.error("[1/2] TTS load FAILED: %s", exc)

    logger.info("[2/2] Loading clothing classifier v3 (115 MB)...")
    try:
        await asyncio.to_thread(clothing_detector._load)
        t = clothing_detector._thresholds
        logger.info(
            "[2/2] Classifier loaded OK  |  tops=%.3f  bottoms=%.3f  "
            "footwear=%.3f  outerwear=%.3f  dress=%.3f",
            t.get("tops", 0), t.get("bottoms", 0),
            t.get("footwear", 0), t.get("outerwear", 0), t.get("dress", 0),
        )
    except Exception as exc:
        logger.error("[2/2] Classifier load FAILED: %s", exc)

    logger.info("----------------------------------------")
    logger.info("All models ready — accepting requests")
    logger.info("----------------------------------------")
    yield
    logger.info("Backend shutting down")


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
