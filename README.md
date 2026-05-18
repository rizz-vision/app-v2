# rizzvision-v2

Voice-first fashion assistant for visually impaired users. Point your camera at clothing to get spoken descriptions, build a wardrobe, get outfit suggestions, and shop smarter — all hands-free.

## How it works

```
Camera → OpenCV quality gates → EfficientNetB3 (clothing detector)
       → Gemini 2.5 Flash (vision LLM) → Kokoro TTS (spoken response)
       → [Groq/Llama fallback if Gemini is unavailable]
```

**Voice is always-on.** Every screen announces itself on load, every action has a spoken response, and the microphone listens continuously for navigation commands and questions.

## Features

- **Mirror** — instant outfit feedback read aloud, nothing saved
- **Scan** — identify and save clothing items to your wardrobe
- **Wardrobe** — browse and manage saved items by voice
- **Outfit** — AI stylist suggests outfits from your wardrobe
- **Shopping** — point camera at a potential purchase for a buy/skip verdict
- **Languages** — English, Hindi (हिंदी), Tamil (தமிழ்)

## Structure

```
app-v2/
├── backend/          FastAPI service (Gemini + Kokoro TTS)
├── frontend/         React + Vite SPA
├── ml/               Dataset curation + training notebooks
└── scripts/          Deployment scripts
```

## Local development

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # add GEMINI_API_KEY (required), GROQ_API_KEY (optional fallback)
uvicorn main:app --reload   # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev                         # http://localhost:5173
```

## Deployment

**Frontend** — Vercel, auto-deploys on push to `main`.

**Backend** — HuggingFace Spaces (`rizzvision69/app-v2-space`).
- Auto-deploys via GitHub Actions when `backend/` changes
- Manual deploy: `git push-hf` (or `bash scripts/push-hf.sh`)

On a fresh clone, register the git alias once:
```bash
git config alias.push-hf '!scripts/push-hf.sh'
```

**Required secrets:**

| Where | Key | Purpose |
|-------|-----|---------|
| HF Space | `GEMINI_API_KEY` | Vision LLM |
| HF Space | `GROQ_API_KEY` | Llama fallback when Gemini is down |
| HF Space | `HF_TOKEN` | Authenticated Kokoro model download |
| GitHub Actions | `HF_TOKEN` | Auto-deploy to HF Spaces |

## ML (Training)

```bash
# 1. Curate dataset from DeepFashion v2
python ml/curate_dataset.py --df2-path /path/to/deepfashion2

# 2. Train on Kaggle GPU — open ml/kaggle_train.ipynb on Kaggle
#    or use ml/colab_train.ipynb on Google Colab (recommended)

# 3. Download artifacts → backend/model/tshirt_classifier.keras
#                       → backend/model/threshold.json
```

## Architecture notes

### Backend request pipeline (`/analyze`)
```
image_ingestion.ingest()    # decode, EXIF-rotate, validate dims/brightness/sharpness
tshirt_detector.detect()    # EfficientNetB3 → confidence vs threshold → reject if not clothing
llm_feedback.get_feedback() # Gemini multimodal → structured JSON
response_shaper.shape()     # → list[SpeechSegment] (TTS-ready text)
```

Other endpoints (`/quick-scan`, `/outfit-suggestion`, `/shopping-analyze`, `/voice-query`, `/tts`) call Gemini directly, skipping the detector gate.

### TTS pipeline
- English / Hindi → Kokoro 82M neural voice (`af_heart` / `hf_alpha`)
- Tamil → espeak-ng (Kokoro has no Tamil support)
- Fallback → Web Speech API (browser-native, used when backend is unavailable)

### Gemini fallback
All Gemini endpoints automatically retry with Groq Llama on `503 UNAVAILABLE`. The user hears a spoken notice before the response.

### Frontend navigation
Single-page app, no router. `AppContext` holds a screen stack; `App.jsx` renders the active screen. Context hierarchy: `AuthProvider → AppProvider → WardrobeProvider → VoiceProvider`.

## Targets

- Clothing detection accuracy: ≥ 93%
- False positive rate: ≤ 2%
- API latency (CPU): ≤ 2s end-to-end
