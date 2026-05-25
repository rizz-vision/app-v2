from pydantic import BaseModel
from typing import Optional, Any


class DetectionResult(BaseModel):
    is_clothing: bool
    categories: list[str]   # detected classes e.g. ["tops", "bottoms"]
    category: str           # primary category (first detected) or "not_clothing"
    scores: dict[str, float]
    model_version: str = "efficientnetb3-multilabel-v3"


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


class GarmentScanItem(BaseModel):
    suggested_name: str
    category: str
    color: str
    short_description: str
    long_description: str


class QuickScanResponse(BaseModel):
    items: list[GarmentScanItem]          # all detected garments (multi-scan)
    # Primary item fields kept for backward compat (mirrors items[0])
    suggested_name: str
    category: str
    description: str
    short_description: str
    long_description: str
    color: str


class ErrorResponse(BaseModel):
    error_code: str
    user_message: str
