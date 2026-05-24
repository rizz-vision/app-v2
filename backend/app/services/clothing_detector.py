import json
import cv2
import numpy as np
from pathlib import Path
from app.core.config import CLOTHING_MODEL_PATH, CLOTHING_THRESHOLD_PATH, MODEL_INPUT_SIZE
from app.errors.handlers import ImageQualityError
from app.models.schemas import DetectionResult

LABELS = ["tops", "bottoms", "footwear", "outerwear", "dress"]

# Lazy-loaded globals
_model = None
_thresholds: dict[str, float] = {l: 0.5 for l in LABELS}


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
            if "thresholds" in data:
                _thresholds = data["thresholds"]


def detect(image_rgb: np.ndarray) -> DetectionResult:
    """
    Multi-label clothing detector (v3).
    Returns all garment categories detected above their per-class threshold.
    Raises ImageQualityError if no clothing is detected.
    """
    _load()

    resized = cv2.resize(image_rgb, (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE), interpolation=cv2.INTER_AREA)
    # EfficientNet preprocessing: scale to [0,255] float, then preprocess_input handles normalisation
    x = resized.astype("float32")
    x = np.expand_dims(x, axis=0)

    # Import here to avoid loading TF at module level
    from tensorflow.keras.applications.efficientnet import preprocess_input
    x = preprocess_input(x)

    probs = _model.predict(x, verbose=0)[0]   # shape (5,)

    scores = {label: round(float(probs[i]), 4) for i, label in enumerate(LABELS)}
    categories = [label for label in LABELS if scores[label] >= _thresholds.get(label, 0.5)]

    is_clothing = len(categories) > 0
    primary = categories[0] if categories else "not_clothing"

    if not is_clothing:
        raise ImageQualityError(
            "not_clothing",
            "I could not detect any clothing in this image. Please hold up the item and try again.",
        )

    return DetectionResult(
        is_clothing=True,
        categories=categories,
        category=primary,
        scores=scores,
        model_version="efficientnetb3-multilabel-v3",
    )
