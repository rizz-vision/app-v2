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

    context_parts = [
        f"A t-shirt has been detected with {detection.confidence:.0%} confidence.",
        f"Analyze this t-shirt specifically.",
    ]
    if occasion:
        context_parts.append(f"The user is dressing for: {occasion}.")
    if mode == "mirror":
        context_parts.append("Also comment briefly on how the t-shirt fits the person wearing it.")

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
