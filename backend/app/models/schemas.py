from pydantic import BaseModel
from typing import Optional, Any


class DetectionResult(BaseModel):
    is_clothing: bool
    category: str           # "tops", "bottoms", or "other"
    confidence: float
    model_version: str = "efficientnetb3-clothing-v2"
    threshold_used: float


class GarmentLLM(BaseModel):
    name: str
    description: str


class LLMFeedback(BaseModel):
    garments: list[GarmentLLM]
    color_feedback: str
    fit_feedback: str
    overall_verdict: str
    top_fix: str
    occasion_verdict: str = ""
    wardrobe_description: str = ""
    personal_appearance: str = ""
    mirror_data: Optional[dict[str, Any]] = None


class SpeechSegment(BaseModel):
    id: str
    text: str


class AnalyzeResponse(BaseModel):
    speech_segments: list[SpeechSegment]
    occasion_verdict: str = ""
    wardrobe_description: str = ""
    personal_appearance: str = ""
    mirror_data: Optional[dict[str, Any]] = None
    detection: DetectionResult
    latency_ms: int


class QuickScanResponse(BaseModel):
    suggested_name: str
    category: str
    description: str          # kept for backward compat
    short_description: str    # 1 sentence for quick display/TTS
    long_description: str     # 3-4 sentences stored in wardrobe
    color: str


class ErrorResponse(BaseModel):
    error_code: str
    user_message: str
