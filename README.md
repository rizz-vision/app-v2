# rizzvision-v2

T-shirt analysis app powered by EfficientNetB3 + Gemini 2.5 Pro.

## Architecture

```
Image → OpenCV quality gates → EfficientNetB3 (t-shirt detector)
      → [reject if not t-shirt]
      → Gemini 2.5 Pro (description) → TTS speech segments
```

## Structure

```
app-v2/
├── backend/          FastAPI service
├── ml/               Dataset curation + Kaggle training notebook
└── frontend/         React + Vite app
```

## Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # fill in GEMINI_API_KEY
uvicorn main:app --reload   # http://localhost:8000
```

## ML (Training)

```bash
# 1. Curate dataset from local DeepFashion v2
python ml/curate_dataset.py --df2-path /path/to/deepfashion2

# 2. Upload to Kaggle, then run ml/kaggle_train.ipynb on Kaggle GPU

# 3. Download model artifacts → backend/model/
```

## Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in Supabase keys
npm run dev                         # http://localhost:5173
```

## Deployment

**Frontend** — Vercel (auto-deploys on push to `main`).

**Backend** — HuggingFace Spaces (`rizzvision69/app-v2-space`). Deploy with:

```bash
git push-hf
```

This alias (stored in `.git/config`) runs `scripts/push-hf.sh`, which copies `backend/` into a clean orphan worktree, wires up Git LFS for the `.keras` model, and force-pushes to the `hf-space` remote.

> **Note:** The alias is local — on a fresh clone, register it once with:
> ```bash
> git config alias.push-hf '!scripts/push-hf.sh'
> ```

## Targets

- T-shirt detection accuracy: ≥ 93%
- False positive rate: ≤ 2%
- API latency (CPU): ≤ 2s end-to-end
