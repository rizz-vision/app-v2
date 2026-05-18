FROM python:3.11-slim

# OpenCV + audio (libsndfile for soundfile) + espeak-ng (Kokoro phonemizer + Tamil TTS fallback)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsndfile1 \
    espeak-ng \
    espeak-ng-data \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir torch==2.4.1+cpu torchvision==0.19.1+cpu \
    -f https://download.pytorch.org/whl/torch_stable.html || true
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV HOST=0.0.0.0
ENV PORT=7860

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
