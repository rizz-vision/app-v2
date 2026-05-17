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
        "color": {"type": "string"},
        "short_description": {"type": "string"},
        "long_description": {"type": "string"},
    },
    "required": ["suggested_name", "category", "color", "short_description", "long_description"],
}


@router.post("/quick-scan", response_model=QuickScanResponse)
async def quick_scan(image: UploadFile = File(...)):
    import io
    from PIL import Image

    raw = await image.read()
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)

    response = _gemini().models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"),
            (
                "Identify the clothing item in this image. Return JSON with:\n"
                "- suggested_name: short item name (e.g. 'Navy Graphic Tee')\n"
                "- category: one of tops/bottoms/outerwear/shoes/accessories/other\n"
                "- color: primary color description\n"
                "- short_description: one sentence, max 15 words, describing what you see (fabric, color, print)\n"
                "- long_description: 3-4 sentences covering fabric feel, cut/fit, graphic/print details if any, "
                "and what occasions or styles it suits. Concrete and tactile — no vague words like 'nice' or 'great'."
            ),
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=QUICK_SCAN_SCHEMA,
            temperature=0.3,
        ),
    )
    data = json.loads(response.text)
    # backward compat field
    data["description"] = data.get("short_description", "")
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
    has_wardrobe = bool(wardrobe_items and wardrobe_items.strip())

    if has_wardrobe:
        prompt = (
            f"You are a personal stylist. The user wants an outfit for: {occasion or 'casual'}.\n"
            f"Their wardrobe:\n{wardrobe_items}\n\n"
            "Suggest a specific outfit using items from their wardrobe. "
            "Name the exact items. Explain why they work together — color, texture, occasion fit. "
            "2-3 short sentences per point. No markdown. No bullet lists."
        )
    else:
        prompt = (
            f"You are a personal stylist. The user wants outfit ideas for: {occasion or 'casual'}.\n"
            "Give 2-3 general outfit ideas with specific garment types, colors, and fabrics. "
            "Keep it practical and concrete — no vague terms like 'nice' or 'stylish'. "
            "2-3 short sentences per idea. No markdown."
        )

    response = _gemini().models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.7),
    )
    return {"suggestion": response.text}


# ---------------------------------------------------------------------------
# Shopping analyze — wardrobe-aware item verdict (Gemini vision)
# ---------------------------------------------------------------------------

SHOPPING_SCHEMA = {
    "type": "object",
    "properties": {
        "item_description": {"type": "string"},
        "wardrobe_match":   {"type": "string"},
        "buy_verdict":      {"type": "string"},
        "suitable_occasions": {"type": "array", "items": {"type": "string"}},
        "top_archetypes":   {"type": "array", "items": {"type": "string"}},
    },
    "required": ["item_description", "wardrobe_match", "buy_verdict", "suitable_occasions", "top_archetypes"],
}


@router.post("/shopping-analyze")
async def shopping_analyze(
    image: UploadFile = File(...),
    wardrobe: Optional[str] = Form(""),
):
    import io
    from PIL import Image as PILImage

    raw = await image.read()
    img = PILImage.open(io.BytesIO(raw)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)

    has_wardrobe = bool(wardrobe and wardrobe.strip() and wardrobe.strip() not in ("[]", ""))

    if has_wardrobe:
        wardrobe_section = f"User's saved wardrobe:\n{wardrobe}"
        match_instruction = (
            "Tell the user which specific wardrobe items this pairs well with and which it would clash with. "
            "Name the items. If nothing pairs, say so honestly."
        )
    else:
        wardrobe_section = "The user has no saved wardrobe items yet."
        match_instruction = (
            "Give a standalone style and fit assessment. "
            "Describe how this item would look and what it generally pairs well with."
        )

    prompt = (
        "You are RizzVision in shopping mode. Your response will be read aloud.\n"
        "Be concise but specific — 1-2 sentences per field. No markdown. No bullet lists.\n"
        "Use concrete tactile language. Never say 'looks good' — say WHY.\n\n"
        f"{wardrobe_section}\n\n"
        "Return JSON with:\n"
        "- item_description: what you see (garment type, color, fabric/texture, cut)\n"
        f"- wardrobe_match: {match_instruction}\n"
        "- buy_verdict: one sentence — is it worth buying for their style?\n"
        "- suitable_occasions: 2-3 occasion strings (e.g. 'casual', 'office', 'evening out')\n"
        "- top_archetypes: 1-2 style archetype strings (e.g. 'minimalist', 'streetwear', 'classic')"
    )

    response = _gemini().models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=buf.getvalue(), mime_type="image/jpeg"),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=SHOPPING_SCHEMA,
            temperature=0.4,
        ),
    )

    try:
        data = json.loads(response.text)
    except Exception:
        data = {
            "item_description": "I can see a clothing item.",
            "wardrobe_match": "Unable to assess compatibility right now.",
            "buy_verdict": "Try again for a full assessment.",
            "suitable_occasions": [],
            "top_archetypes": [],
        }

    segments = []
    if data.get("item_description"):
        segments.append({"id": "item",     "text": data["item_description"]})
    if data.get("wardrobe_match"):
        segments.append({"id": "match",    "text": data["wardrobe_match"]})
    if data.get("buy_verdict"):
        segments.append({"id": "verdict",  "text": data["buy_verdict"]})
    if data.get("suitable_occasions"):
        segments.append({"id": "occasions","text": "Best for: " + ", ".join(data["suitable_occasions"]) + "."})
    if data.get("top_archetypes"):
        segments.append({"id": "archetypes","text": "Style: " + " and ".join(data["top_archetypes"]) + "."})

    return {
        "speech_segments": segments,
        "has_wardrobe": has_wardrobe,
        "suitable_occasions": data.get("suitable_occasions", []),
        "top_archetypes": data.get("top_archetypes", []),
    }


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
