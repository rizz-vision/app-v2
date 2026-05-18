"""
Groq / Llama fallback for when Gemini returns 503 (high demand).

Provides drop-in replacements for each Gemini call shape used in routes.py:
  - text_json(prompt, schema_hint, system)  → dict
  - vision_json(image_bytes, prompt, schema_hint, system)  → dict
  - text_plain(prompt, system)  → str

All functions raise RuntimeError if GROQ_API_KEY is not set.
"""

import base64
import json
import logging
from app.core.config import GROQ_API_KEY, GROQ_TEXT_MODEL, GROQ_VISION_MODEL

logger = logging.getLogger(__name__)

# Lazy singleton
_client = None


def _groq():
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set — cannot use Groq fallback")
        from groq import Groq
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


FALLBACK_NOTE = "Gemini is currently experiencing high demand. Switched to backup AI — response may vary slightly."


def _extract_json(text: str) -> dict:
    """Best-effort JSON extraction from a model response."""
    text = text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


def text_json(prompt: str, schema_hint: str = "", system: str = "") -> dict:
    """Call Groq with a text prompt; expect JSON back."""
    sys_msg = system or "You are a helpful fashion assistant. Always respond with valid JSON only."
    if schema_hint:
        sys_msg += f"\nReturn exactly this JSON shape: {schema_hint}"

    logger.info("Groq text_json fallback using %s", GROQ_TEXT_MODEL)
    resp = _groq().chat.completions.create(
        model=GROQ_TEXT_MODEL,
        messages=[
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return _extract_json(resp.choices[0].message.content)


def vision_json(image_bytes: bytes, prompt: str, schema_hint: str = "", system: str = "") -> dict:
    """Call Groq vision with an image + text prompt; expect JSON back."""
    sys_msg = system or "You are a helpful fashion assistant. Always respond with valid JSON only."
    if schema_hint:
        sys_msg += f"\nReturn exactly this JSON shape: {schema_hint}"

    b64 = base64.standard_b64encode(image_bytes).decode()
    logger.info("Groq vision_json fallback using %s", GROQ_VISION_MODEL)
    resp = _groq().chat.completions.create(
        model=GROQ_VISION_MODEL,
        messages=[
            {"role": "system", "content": sys_msg},
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    {"type": "text", "text": prompt},
                ],
            },
        ],
        temperature=0.3,
    )
    return _extract_json(resp.choices[0].message.content)


def text_plain(prompt: str, system: str = "") -> str:
    """Call Groq with a text prompt; return plain text."""
    sys_msg = system or "You are a helpful fashion assistant. Keep answers short and concrete."
    logger.info("Groq text_plain fallback using %s", GROQ_TEXT_MODEL)
    resp = _groq().chat.completions.create(
        model=GROQ_TEXT_MODEL,
        messages=[
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
    )
    return resp.choices[0].message.content.strip()
