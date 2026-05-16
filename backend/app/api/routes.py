import time
from fastapi import APIRouter, File, UploadFile, Form
from typing import Optional
from app.services import image_ingestion, tshirt_detector, llm_feedback, response_shaper
from app.models.schemas import AnalyzeResponse, QuickScanResponse
from app.core.config import GEMINI_MODEL
from app.errors.handlers import ImageQualityError

import json
from google import genai
from google.genai import types
from app.core.config import GEMINI_API_KEY

router = APIRouter()

_client = None


def _gemini():
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


# ---------------------------------------------------------------------------
# Core analysis
# ---------------------------------------------------------------------------

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    image: UploadFile = File(...),
    occasion: Optional[str] = Form(""),
    mode: Optional[str] = Form(""),
):
    t0 = time.time()
    raw = await image.read()

    image_rgb = image_ingestion.ingest(raw)
    detection = tshirt_detector.detect(image_rgb)
    feedback = llm_feedback.get_feedback(image_rgb, detection, occasion=occasion or "", mode=mode or "")
    segments = response_shaper.shape(feedback, mode=mode or "")

    return AnalyzeResponse(
        speech_segments=segments,
        occasion_verdict=feedback.occasion_verdict,
        wardrobe_description=feedback.wardrobe_description,
        personal_appearance=feedback.personal_appearance,
        detection=detection,
        latency_ms=int((time.time() - t0) * 1000),
    )


# ---------------------------------------------------------------------------
# Quick scan — lightweight item identification
# ---------------------------------------------------------------------------

QUICK_SCAN_SCHEMA = {
    "type": "object",
    "properties": {
        "suggested_name": {"type": "string"},
        "category": {"type": "string"},
        "description": {"type": "string"},
        "color": {"type": "string"},
    },
    "required": ["suggested_name", "category", "description", "color"],
}


@router.post("/quick-scan", response_model=QuickScanResponse)
async def quick_scan(image: UploadFile = File(...)):
    import io, numpy as np
    from PIL import Image

    raw = await image.read()
    # Quick scan skips the t-shirt gate — just identify whatever is shown
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)

    response = _gemini().models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"),
            "Identify the clothing item. Return JSON with suggested_name, category, description (one sentence), and color.",
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=QUICK_SCAN_SCHEMA,
            temperature=0.2,
        ),
    )
    data = json.loads(response.text)
    return QuickScanResponse(**data)


# ---------------------------------------------------------------------------
# Outfit suggestion
# ---------------------------------------------------------------------------

@router.post("/outfit-suggestion")
async def outfit_suggestion(
    wardrobe_items: str = Form(""),
    occasion: Optional[str] = Form(""),
    mode: Optional[str] = Form("general"),
):
    prompt = (
        f"Suggest 2-3 outfit combinations. Occasion: {occasion or 'casual'}. "
        f"Available items: {wardrobe_items or 'general wardrobe'}. "
        "Keep suggestions practical and specific. Each sentence under 15 words."
    )
    response = _gemini().models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.7),
    )
    return {"suggestion": response.text}


# ---------------------------------------------------------------------------
# Context chat (follow-up Q&A)
# ---------------------------------------------------------------------------

@router.post("/context-chat")
async def context_chat(
    question: str = Form(...),
    context: Optional[str] = Form(""),
    feature: Optional[str] = Form("scan"),
):
    system = (
        f"You are a fashion assistant helping with {feature}. "
        "Give short, concrete answers under 20 words per sentence."
    )
    response = _gemini().models.generate_content(
        model=GEMINI_MODEL,
        contents=f"Context: {context}\n\nQuestion: {question}",
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.4,
        ),
    )
    return {"answer": response.text}


# ---------------------------------------------------------------------------
# Identify item (match photo to wardrobe)
# ---------------------------------------------------------------------------

@router.post("/identify-item")
async def identify_item(
    image: UploadFile = File(...),
    wardrobe: str = Form("[]"),
):
    import io
    from PIL import Image as PILImage

    raw = await image.read()
    img = PILImage.open(io.BytesIO(raw)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)

    schema = {
        "type": "object",
        "properties": {
            "matched_id": {"type": "string"},
            "confidence": {"type": "string"},
            "spoken": {"type": "string"},
        },
        "required": ["matched_id", "confidence", "spoken"],
    }

    response = _gemini().models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"),
            f"Wardrobe items (JSON): {wardrobe}\n\nWhich item best matches this photo? Return matched_id (or 'none'), confidence (low/medium/high), and a spoken sentence describing the match.",
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0.2,
        ),
    )
    return json.loads(response.text)


# ---------------------------------------------------------------------------
# Voice query
# ---------------------------------------------------------------------------

@router.post("/voice-query")
async def voice_query(
    query: str = Form(...),
    app_context: Optional[str] = Form(""),
):
    system = (
        "You are a voice assistant for a fashion app called Rizzvision. "
        "Answer in 1-2 short sentences. If the user wants to navigate, return a 'command' field."
    )
    schema = {
        "type": "object",
        "properties": {
            "answer": {"type": "string"},
            "command": {"type": "string"},
        },
        "required": ["answer", "command"],
    }
    response = _gemini().models.generate_content(
        model=GEMINI_MODEL,
        contents=f"App context: {app_context}\nUser said: {query}",
        config=types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0.3,
        ),
    )
    return json.loads(response.text)
