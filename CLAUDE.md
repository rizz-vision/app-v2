# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # fill in GEMINI_API_KEY
uvicorn main:app --reload   # http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Supabase keys (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
npm run dev                         # http://localhost:5173
npm run lint
npm run build
```

### ML / Model
```bash
# Curate dataset from DeepFashion v2
python ml/curate_dataset.py --df2-path /path/to/deepfashion2

# Recalibrate detection threshold without retraining (run notebook)
ml/recalibrate_threshold.ipynb

# Training happens on Kaggle GPU via ml/kaggle_train.ipynb
# Download artifacts → backend/model/tshirt_classifier.keras + backend/model/threshold.json
```

### Deployment
```bash
# Push backend to HuggingFace Spaces (copies backend/ as clean orphan commit)
git push-hf
# or directly:
bash scripts/push-hf.sh

# Register the alias on a fresh clone:
git config alias.push-hf '!scripts/push-hf.sh'
```

Frontend auto-deploys to Vercel on push to `main`. Backend deploys to `rizzvision69/app-v2-space` on HuggingFace.

## Architecture

### Request pipeline (backend)
```
POST /analyze
  → image_ingestion.ingest()     # decode, EXIF-rotate, validate dims/brightness/sharpness
  → tshirt_detector.detect()     # EfficientNetB3 → confidence vs threshold → reject if not t-shirt
  → llm_feedback.get_feedback()  # Gemini multimodal → structured JSON (RESPONSE_SCHEMA)
  → response_shaper.shape()      # LLMFeedback → list[SpeechSegment] (TTS-ready text)
  → AnalyzeResponse
```

Other endpoints (`/quick-scan`, `/outfit-suggestion`, `/context-chat`, `/identify-item`, `/voice-query`) call Gemini directly — they skip the t-shirt detector gate.

### Model loading
`tshirt_detector.py` lazy-loads the Keras model and threshold on the first request. The threshold (default 0.87) is read from `backend/model/threshold.json`; the `.keras` file is stored in Git LFS and deployed via `scripts/push-hf.sh`.

### Frontend navigation
Single-page app with no router. `AppContext` holds `current.screen`; `App.jsx` switches between screen components. Screens: Home, Scan, Mirror, Wardrobe, Outfit, Shopping, EditItem, Auth.

Context hierarchy (outermost → innermost): `AuthProvider` → `AppProvider` → `WardrobeProvider` → `VoiceProvider`.

`WardrobeContext` persists wardrobe items to Supabase (via `frontend/src/services/supabase.js`). Auth is Supabase Auth.

All backend calls go through `frontend/src/services/api.js`, which posts `FormData` to `VITE_API_BASE_URL` (defaults to `http://localhost:8000`). In dev, Vite proxies `/api/*` → port 8000.

### Key config
- `backend/app/core/config.py` — `GEMINI_MODEL` (overridable via env), image quality thresholds, model paths
- `backend/app/errors/handlers.py` — `ImageQualityError` with `error_code` + `user_message`; frontend reads `error_code` to branch behavior
- Gemini LLM responses are always constrained via `response_schema` + `response_mime_type="application/json"` — never free-text parsed

### HuggingFace deploy notes
`scripts/push-hf.sh` creates a throwaway worktree, copies only `backend/`, wires Git LFS for `model/*.keras`, and force-pushes to the `hf-space` remote as branch `main`. The HF Space uses the Docker SDK (`backend/Dockerfile`). Set `GEMINI_API_KEY` in HF Space secrets.
