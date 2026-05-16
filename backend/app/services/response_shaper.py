import re
from app.models.schemas import LLMFeedback, SpeechSegment


def _clean(text: str) -> str:
    text = re.sub(r"\*+([^*]+)\*+", r"\1", text)   # strip markdown bold/italic
    text = re.sub(r"\(([^)]+)\)", r"\1", text)       # remove parentheses
    text = re.sub(r"[—–]", ". ", text)               # em/en dash → period
    text = re.sub(r";", ".", text)
    text = re.sub(r"\s+", " ", text).strip()
    if text and not text.endswith((".", "!", "?")):
        text += "."
    return text


def shape(feedback: LLMFeedback, mode: str = "") -> list[SpeechSegment]:
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

    if mode == "mirror" and feedback.personal_appearance:
        segments.append(SpeechSegment(id="personal_appearance", text=_clean(feedback.personal_appearance)))

    return segments
