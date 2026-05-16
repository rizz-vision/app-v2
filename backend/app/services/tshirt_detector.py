import json
import cv2
import numpy as np
from pathlib import Path
from app.core.config import TSHIRT_MODEL_PATH, TSHIRT_THRESHOLD_PATH, MODEL_INPUT_SIZE
from app.errors.handlers import ImageQualityError
from app.models.schemas import DetectionResult

# Lazy-loaded globals — loaded once on first call
_model = None
_threshold: float = 0.87


def _load():
    global _model, _threshold
    if _model is not None:
        return

    import tensorflow as tf

    model_path = Path(TSHIRT_MODEL_PATH)
    threshold_path = Path(TSHIRT_THRESHOLD_PATH)

    if not model_path.exists():
        raise RuntimeError(f"T-shirt model not found at {model_path}. Train and place the model first.")

    _model = tf.keras.models.load_model(str(model_path))

    if threshold_path.exists():
        with open(threshold_path) as f:
            _threshold = json.load(f).get("threshold", 0.87)


def detect(image_rgb: np.ndarray) -> DetectionResult:
    """Returns DetectionResult. Raises ImageQualityError if not a t-shirt."""
    _load()

    resized = cv2.resize(image_rgb, (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE), interpolation=cv2.INTER_AREA)
    x = resized.astype("float32") / 255.0
    x = np.expand_dims(x, axis=0)

    confidence = float(_model.predict(x, verbose=0)[0][0])
    is_tshirt = confidence >= _threshold

    result = DetectionResult(
        is_tshirt=is_tshirt,
        confidence=round(confidence, 4),
        threshold_used=_threshold,
    )

    if not is_tshirt:
        raise ImageQualityError(
            "not_a_tshirt",
            "I can only analyze t-shirts. Please hold up a t-shirt and try again.",
        )

    return result
