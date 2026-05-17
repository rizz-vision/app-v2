from pydantic import BaseModel
from typing import Optional


class DetectionResult(BaseModel):
    is_tshirt: bool
    confidence: float
    model_version: str = "efficientnetb3-tshirt-v1"
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
    wardrobe_description: str
    personal_appearance: str = ""


class SpeechSegment(BaseModel):
    id: str
    text: str


class AnalyzeResponse(BaseModel):
    speech_segments: list[SpeechSegment]
    occasion_verdict: str = ""
    wardrobe_description: str
    personal_appearance: str = ""
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
