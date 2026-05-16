from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.errors.handlers import register_handlers

app = FastAPI(title="rizzvision-v2", version="2.0.0")

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
