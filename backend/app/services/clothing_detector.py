import json
import cv2
import numpy as np
from pathlib import Path
from app.core.config import CLOTHING_MODEL_PATH, CLOTHING_THRESHOLD_PATH, MODEL_INPUT_SIZE
from app.errors.handlers import ImageQualityError
from app.models.schemas import DetectionResult

CLASSES = ["tops", "bottoms", "other"]

# Lazy-loaded globals
_model = None
_thresholds: dict[str, float] = {"tops": 0.91, "bottoms": 0.70, "other": 0.85}


def _load():
    global _model, _thresholds
    if _model is not None:
        return

    import tensorflow as tf

    model_path = Path(CLOTHING_MODEL_PATH)
    threshold_path = Path(CLOTHING_THRESHOLD_PATH)

    if not model_path.exists():
        raise RuntimeError(f"Clothing model not found at {model_path}.")

    _model = tf.keras.models.load_model(str(model_path))

    if threshold_path.exists():
        with open(threshold_path) as f:
            data = json.load(f)
            # supports both v2 {"thresholds": {...}} and legacy {"threshold": 0.87}
            if "thresholds" in data:
                _thresholds = data["thresholds"]
            elif "threshold" in data:
                t = data["threshold"]
                _thresholds = {"tops": t, "bottoms": t, "other": t}


def detect(image_rgb: np.ndarray) -> DetectionResult:
    """
    Classifies image as tops / bottoms / other.
    Raises ImageQualityError if confidence is below per-class threshold
    or if predicted class is 'other'.
    """
    _load()

    resized = cv2.resize(image_rgb, (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE), interpolation=cv2.INTER_AREA)
    x = resized.astype("float32") / 255.0
    x = np.expand_dims(x, axis=0)

    probs = _model.predict(x, verbose=0)[0]          # shape (3,)
    class_idx = int(np.argmax(probs))
    category = CLASSES[class_idx]
    confidence = float(probs[class_idx])
    threshold = _thresholds.get(category, 0.70)
    is_clothing = confidence >= threshold and category != "other"

    result = DetectionResult(
        is_clothing=is_clothing,
        category=category,
        confidence=round(confidence, 4),
        threshold_used=threshold,
    )

    if not is_clothing:
        if category == "other":
            raise ImageQualityError(
                "not_clothing",
                "I could not identify a clothing item. Please hold up a top or bottom and try again.",
            )
        raise ImageQualityError(
            "low_confidence",
            "The image is not clear enough to identify the clothing. Please try again with better lighting.",
        )

    return result
