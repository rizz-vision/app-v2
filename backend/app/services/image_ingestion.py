import io
import cv2
import numpy as np
from PIL import Image, ExifTags
from app.core.config import MIN_IMAGE_DIM, MAX_IMAGE_DIM, MIN_BRIGHTNESS, MAX_BRIGHTNESS, MIN_SHARPNESS
from app.errors.handlers import ImageQualityError


def _exif_rotate(img: Image.Image) -> Image.Image:
    try:
        exif = img._getexif()
        if exif is None:
            return img
        for tag, value in exif.items():
            if ExifTags.TAGS.get(tag) == "Orientation":
                rotations = {3: 180, 6: 270, 8: 90}
                if value in rotations:
                    img = img.rotate(rotations[value], expand=True)
                break
    except Exception:
        pass
    return img


def ingest(raw_bytes: bytes) -> np.ndarray:
    """Decode, validate, and return an RGB numpy array."""
    try:
        img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception:
        raise ImageQualityError("internal_error", "Could not read the image. Please try again.")

    img = _exif_rotate(img)
    w, h = img.size

    if min(w, h) < MIN_IMAGE_DIM:
        raise ImageQualityError("image_too_small", "This image is too small to analyze. Please use a clearer photo.")
    if max(w, h) > MAX_IMAGE_DIM:
        raise ImageQualityError("image_too_large", "This image is too large. Please use a smaller photo.")

    arr = np.array(img)  # uint8 RGB

    # Brightness check (mean of grayscale)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    brightness = float(gray.mean())
    if brightness < MIN_BRIGHTNESS:
        raise ImageQualityError("too_dark", "The photo is too dark. Please move to a brighter area and try again.")
    if brightness > MAX_BRIGHTNESS:
        raise ImageQualityError("too_bright", "The photo is overexposed. Please reduce glare and try again.")

    # Sharpness check (Laplacian variance)
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if sharpness < MIN_SHARPNESS:
        raise ImageQualityError("blurry", "The photo is blurry. Please hold the camera steady and try again.")

    return arr
