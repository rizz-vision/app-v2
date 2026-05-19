import io
import json
from PIL import Image
import numpy as np
from google import genai
from google.genai import types
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL
from app.errors.handlers import ImageQualityError
from app.models.schemas import LLMFeedback, DetectionResult

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


SYSTEM_PROMPT = """You are a precise fashion analyst. Analyze the t-shirt in the image.
Rules:
1. Every sentence must be under 15 words. Write for text-to-speech.
2. Use concrete tactile language: fabric weight, neckline type, sleeve length, fit.
3. Never use vague praise: no "cool", "sharp", "pops", "stylish", "great".
4. State colors precisely: "slate grey", "dusty rose", not just "grey" or "pink".
5. Count only the t-shirt as one garment. Prints/graphics are not separate garments.
6. wardrobe_description must be 3-4 sentences suitable for saving to a wardrobe catalogue.
Return ONLY valid JSON matching the schema exactly."""

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

    context_parts = [
        f"A clothing item ({detection.category}) has been detected with {detection.confidence:.0%} confidence.",
        f"Analyze this {detection.category[:-1] if detection.category.endswith('s') else detection.category} specifically.",
    ]
    if occasion:
        context_parts.append(f"The user is dressing for: {occasion}.")

    user_message = " ".join(context_parts)

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                user_message,
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=RESPONSE_SCHEMA,
                temperature=0.3,
            ),
        )
        data = json.loads(response.text)
        return LLMFeedback(**data)
    except Exception as e:
        raise ImageQualityError("llm_parse_failed", "Something went wrong generating your feedback. Please try again.")


def _get_mirror_feedback(client, img_bytes: bytes, occasion: str = "") -> LLMFeedback:
    user_message = "Describe this person's full appearance — outfit, grooming, and overall presentation."
    if occasion:
        user_message += f" They are dressing for: {occasion}."

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
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
        # Map mirror schema → LLMFeedback fields
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
