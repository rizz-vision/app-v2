import io
import json
from PIL import Image
import numpy as np
from google import genai
from google.genai import types
from app.core.config import GEMINI_API_KEY, GEMINI_PRO_MODEL
from app.errors.handlers import ImageQualityError
from app.models.schemas import LLMFeedback, DetectionResult

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


# ── Category-specific system prompts ─────────────────────────────────────────

_BASE_RULES = """Rules:
1. Every sentence must be under 15 words. Write for text-to-speech.
2. Use concrete tactile language: fabric weight, neckline/waistband type, fit, length.
3. Never use vague praise: no "cool", "sharp", "pops", "stylish", "great".
4. State colors precisely: "slate grey", "dusty rose", not just "grey" or "pink".
5. wardrobe_description must be 3-4 sentences suitable for saving to a wardrobe catalogue.
Return ONLY valid JSON matching the schema exactly."""

SYSTEM_PROMPTS = {
    "tops": f"""You are a precise fashion analyst. Analyze the top in the image (t-shirt, shirt, blouse, hoodie, etc.).
Focus on: neckline type, sleeve length and style, fabric weight and texture, fit across shoulders and chest, any print or graphic details.
{_BASE_RULES}""",

    "bottoms": f"""You are a precise fashion analyst. Analyze the bottom in the image (jeans, trousers, shorts, skirt, etc.).
Focus on: garment type, rise (high/mid/low), leg cut (slim/wide/straight/flared), fabric weight and texture, waistband style, length, any detailing (distressing, pleats, pockets).
{_BASE_RULES}""",

    "footwear": f"""You are a precise fashion analyst. Analyze the footwear in the image (shoes, boots, sneakers, sandals, etc.).
Focus on: shoe type, sole style, material (leather, canvas, suede, synthetic), heel height, closure type (laces, buckle, slip-on), color and finish.
{_BASE_RULES}""",

    "outerwear": f"""You are a precise fashion analyst. Analyze the outerwear in the image (jacket, coat, blazer, cardigan, etc.).
Focus on: garment type, fabric weight and warmth, closure style, collar/lapel type, fit across shoulders, length, any hardware or lining details.
{_BASE_RULES}""",

    "dress": f"""You are a precise fashion analyst. Analyze the dress or jumpsuit in the image.
Focus on: silhouette (A-line, bodycon, wrap, shirt dress, etc.), neckline, sleeve length, fabric weight and texture, length (mini/midi/maxi), waist definition, any print or embellishment.
{_BASE_RULES}""",
}

# Fallback for unexpected categories
_DEFAULT_SYSTEM_PROMPT = f"""You are a precise fashion analyst. Analyze the clothing item in the image.
Focus on: garment type, fabric weight and texture, fit, color, and any notable detailing.
{_BASE_RULES}"""

# Per-category focus lines used when building composite multi-label prompts
_CATEGORY_FOCUS = {
    "tops":      "Top (t-shirt, shirt, blouse, hoodie, vest): neckline type, sleeve length, fabric weight, fit across chest and shoulders, any print or graphic detail.",
    "bottoms":   "Bottom (jeans, trousers, shorts, skirt): garment type, rise (high/mid/low), leg cut, fabric weight, waistband style, length, any distressing or pleats.",
    "footwear":  "Footwear (shoes, boots, sneakers, sandals): shoe type, material, sole style, heel height, closure type, color and finish.",
    "outerwear": "Outerwear (jacket, coat, blazer, cardigan): garment type, fabric weight and warmth, closure style, collar/lapel, fit across shoulders, length, any hardware or lining.",
    "dress":     "Dress or jumpsuit: silhouette (A-line, bodycon, wrap, shirt dress), neckline, sleeve length, fabric weight, length (mini/midi/maxi), waist definition, any print or embellishment.",
}


def _build_multi_system_prompt(categories: list[str]) -> str:
    """Build a composite system prompt covering every detected category."""
    focus_lines = "\n".join(
        f"- {_CATEGORY_FOCUS.get(c, c)}" for c in categories
    )
    return (
        "You are a precise fashion analyst. The image contains multiple garment types.\n"
        f"Analyze EACH item separately, in the order listed:\n{focus_lines}\n"
        "Return one garments array entry per item.\n"
        f"{_BASE_RULES}"
    )

MIRROR_SYSTEM_PROMPT = """You are an honest auditory mirror for a visually impaired user.
The user is looking at their reflection. Describe exactly what you see — outfit, grooming, and overall appearance.
Rules:
1. Every sentence must be under 15 words. Write for text-to-speech.
2. Be honest but kind. If something is off, say so clearly and concisely.
3. Never use vague words: no "looks good", "nice", "great". Say WHY.
4. State colors precisely: "slate grey", "dusty rose", not just "grey" or "pink".
5. Grooming observations must be factual. Only mention what you can actually see.
6. If the outfit matches well, say which specific colors/textures work together.
7. personal_appearance: note anything visible — smudges, under-eye circles, hair, collar alignment.
Return ONLY valid JSON matching the schema exactly."""

MIRROR_SCHEMA = {
    "type": "object",
    "properties": {
        "outfit_description": {"type": "string"},
        "outfit_match": {"type": "string"},
        "grooming": {"type": "string"},
        "overall_impression": {"type": "string"},
        "top_fix": {"type": "string"},
    },
    "required": ["outfit_description", "outfit_match", "grooming", "overall_impression", "top_fix"],
}

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "garments": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["name", "description"],
            },
        },
        "color_feedback": {"type": "string"},
        "fit_feedback": {"type": "string"},
        "overall_verdict": {"type": "string"},
        "top_fix": {"type": "string"},
        "occasion_verdict": {"type": "string"},
        "wardrobe_description": {"type": "string"},
        "personal_appearance": {"type": "string"},
    },
    "required": [
        "garments", "color_feedback", "fit_feedback",
        "overall_verdict", "top_fix", "occasion_verdict",
        "wardrobe_description", "personal_appearance",
    ],
}

# Human-readable category labels for prompts
_CATEGORY_LABELS = {
    "tops":      "top (e.g. t-shirt, shirt, blouse, hoodie, vest)",
    "bottoms":   "bottom (e.g. jeans, trousers, shorts, skirt)",
    "footwear":  "footwear (e.g. shoes, boots, sneakers, sandals)",
    "outerwear": "outerwear (e.g. jacket, coat, blazer, cardigan)",
    "dress":     "dress or jumpsuit",
}


def _image_to_bytes(image_rgb: np.ndarray) -> bytes:
    img = Image.fromarray(image_rgb)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def get_feedback(
    image_rgb: np.ndarray,
    detection: DetectionResult,
    occasion: str = "",
    mode: str = "",
) -> LLMFeedback:
    client = _get_client()
    img_bytes = _image_to_bytes(image_rgb)

    if mode == "mirror":
        return _get_mirror_feedback(client, img_bytes, occasion)

    # Build a human-readable list of all detected categories
    detected = detection.categories if detection.categories else [detection.category]
    category_labels = [_CATEGORY_LABELS.get(c, c) for c in detected]
    garment_list = ", ".join(category_labels)

    # Build system prompt: composite for multi-label scenes, category-specific for single items
    primary = detection.category
    if len(detected) > 1:
        system_prompt = _build_multi_system_prompt(detected)
    else:
        system_prompt = SYSTEM_PROMPTS.get(primary, _DEFAULT_SYSTEM_PROMPT)

    context_parts = [
        f"The ML classifier detected these garment types in the image: {garment_list}.",
        "Analyze EACH detected garment separately and return one entry per garment in the garments array.",
    ]
    if occasion:
        context_parts.append(f"The user is dressing for: {occasion}.")

    user_message = " ".join(context_parts)

    try:
        response = client.models.generate_content(
            model=GEMINI_PRO_MODEL,
            contents=[
                types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                user_message,
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=RESPONSE_SCHEMA,
                temperature=0.3,
            ),
        )
        data = json.loads(response.text)
        return LLMFeedback(**data)
    except Exception:
        raise ImageQualityError("llm_parse_failed", "Something went wrong generating your feedback. Please try again.")


def _get_mirror_feedback(client, img_bytes: bytes, occasion: str = "") -> LLMFeedback:
    user_message = "Describe this person's full appearance — outfit, grooming, and overall presentation."
    if occasion:
        user_message += f" They are dressing for: {occasion}."

    try:
        response = client.models.generate_content(
            model=GEMINI_PRO_MODEL,
            contents=[
                types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                user_message,
            ],
            config=types.GenerateContentConfig(
                system_instruction=MIRROR_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=MIRROR_SCHEMA,
                temperature=0.3,
            ),
        )
        data = json.loads(response.text)
        return LLMFeedback(
            garments=[{"name": "Outfit", "description": data.get("outfit_description", "")}],
            color_feedback=data.get("outfit_match", ""),
            fit_feedback=data.get("grooming", ""),
            overall_verdict=data.get("overall_impression", ""),
            top_fix=data.get("top_fix", ""),
            occasion_verdict="",
            wardrobe_description="",
            personal_appearance=data.get("grooming", ""),
            mirror_data=data,
        )
    except Exception:
        raise ImageQualityError("llm_parse_failed", "Something went wrong generating your mirror feedback. Please try again.")
