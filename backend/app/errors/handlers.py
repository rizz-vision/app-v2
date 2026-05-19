from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class ImageQualityError(Exception):
    def __init__(self, error_code: str, user_message: str):
        self.error_code = error_code
        self.user_message = user_message


USER_MESSAGES = {
    "image_too_small": "This image is too small to analyze. Please use a clearer photo.",
    "image_too_large": "This image is too large. Please use a smaller photo.",
    "too_dark": "The photo is too dark. Please move to a brighter area and try again.",
    "too_bright": "The photo is overexposed. Please reduce glare and try again.",
    "blurry": "The photo is blurry. Please hold the camera steady and try again.",
    "not_a_tshirt": "I can only analyze t-shirts. Please hold up a t-shirt and try again.",  # legacy
    "not_clothing": "I could not identify a clothing item. Please hold up a top or bottom and try again.",
    "low_confidence": "The image is not clear enough to identify the clothing. Please try again with better lighting.",
    "llm_parse_failed": "Something went wrong generating your feedback. Please try again.",
    "internal_error": "Something unexpected went wrong. Please try again.",
}


def register_handlers(app: FastAPI):
    @app.exception_handler(ImageQualityError)
    async def image_quality_handler(request: Request, exc: ImageQualityError):
        return JSONResponse(
            status_code=422,
            content={
                "error_code": exc.error_code,
                "user_message": exc.user_message,
            },
        )

    @app.exception_handler(Exception)
    async def generic_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "internal_error",
                "user_message": USER_MESSAGES["internal_error"],
            },
        )
