import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY: str = os.environ["GEMINI_API_KEY"]
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
GEMINI_PRO_MODEL: str = os.getenv("GEMINI_PRO_MODEL", "gemini-3.1-pro-preview")

# Groq fallback — optional; set GROQ_API_KEY in Space secrets to enable
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_TEXT_MODEL: str = os.getenv("GROQ_TEXT_MODEL", "llama-3.3-70b-versatile")
GROQ_VISION_MODEL: str = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

CLOTHING_MODEL_PATH: str = os.getenv("CLOTHING_MODEL_PATH", "model/clothing_classifier_v5.keras")
CLOTHING_THRESHOLD_PATH: str = os.getenv("CLOTHING_THRESHOLD_PATH", "model/thresholds_v5.json")

# OpenCV quality gate thresholds
MIN_IMAGE_DIM: int = 100
MAX_IMAGE_DIM: int = 5000
MIN_BRIGHTNESS: float = 35.0
MAX_BRIGHTNESS: float = 225.0
MIN_SHARPNESS: float = 80.0   # Laplacian variance

# EfficientNetB3 native input size
MODEL_INPUT_SIZE: int = 300
