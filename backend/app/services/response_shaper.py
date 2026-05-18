import re
from app.models.schemas import LLMFeedback, SpeechSegment


def _clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)             # strip HTML tags
    text = re.sub(r"\*+([^*]+)\*+", r"\1", text)   # strip markdown bold/italic
    text = re.sub(r"\(([^)]+)\)", r"\1", text)       # remove parentheses
    text = re.sub(r"[—–]", ". ", text)               # em/en dash → period
    text = re.sub(r";", ".", text)
    text = re.sub(r"\s+", " ", text).strip()
    if text and not text.endswith((".", "!", "?")):
        text += "."
    return text


def shape(feedback: LLMFeedback, mode: str = "") -> list[SpeechSegment]:
    if mode == "mirror" and feedback.mirror_data:
        return _shape_mirror(feedback.mirror_data)
    return _shape_standard(feedback)


def _shape_mirror(data: dict) -> list[SpeechSegment]:
    segments: list[SpeechSegment] = []
    if data.get("outfit_description"):
        segments.append(SpeechSegment(id="outfit", text=_clean(data["outfit_description"])))
    if data.get("outfit_match"):
        segments.append(SpeechSegment(id="match", text=_clean(data["outfit_match"])))
    if data.get("grooming"):
        segments.append(SpeechSegment(id="grooming", text=_clean(data["grooming"])))
    if data.get("overall_impression"):
        segments.append(SpeechSegment(id="overall", text=_clean(data["overall_impression"])))
    if data.get("top_fix"):
        segments.append(SpeechSegment(id="top_fix", text=_clean(data["top_fix"])))
    return segments


def _shape_standard(feedback: LLMFeedback) -> list[SpeechSegment]:
    segments: list[SpeechSegment] = []

    if feedback.garments:
        garment_text = " ".join(
            f"You are wearing a {g.name}. {g.description}" for g in feedback.garments
        )
        segments.append(SpeechSegment(id="garments", text=_clean(garment_text)))

    if feedback.color_feedback:
        segments.append(SpeechSegment(id="color_feedback", text=_clean(feedback.color_feedback)))

    if feedback.fit_feedback:
        segments.append(SpeechSegment(id="fit_feedback", text=_clean(feedback.fit_feedback)))

    if feedback.overall_verdict:
        segments.append(SpeechSegment(id="overall_verdict", text=_clean(feedback.overall_verdict)))

    if feedback.top_fix:
        segments.append(SpeechSegment(id="top_fix", text=_clean(feedback.top_fix)))

    return segments
