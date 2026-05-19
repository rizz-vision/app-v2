# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Command execution rules

- **Prefer terminal instructions over self-running commands.** For any operation the user can run themselves (installs, uploads, training, deploys), provide the command and let the user run it rather than executing it directly.
- **For any command Claude does run that is estimated to take over 1 minute**, provide a `curl` or shell one-liner the user can paste into a separate terminal to track progress or verify the result. Example: if running a dataset upload, provide `curl -s https://www.kaggle.com/api/v1/datasets/nitin2807/xyz | jq .status` so the user can monitor it independently.

## About this app

Rizzvision is a **voice-first fashion assistant for visually impaired users**. The entire UX is designed around audio feedback — every screen announces itself on load, every action has a spoken response, and the microphone is always-on. When making changes to any user-facing text, API responses, or UI flows, assume the user cannot see the screen. All text must be TTS-friendly: short sentences, no markdown, no emoji in spoken strings.

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

## Context / Compaction Protocol

**Never use Claude's built-in conversation compaction.** When a session grows long or context needs to be handed off, create a handoff document instead:

1. Write `.claude/handoff-YYYY-MM-DD.md` in this repo (see template below)
2. Commit it: `git commit -m "docs(claude): session handoff YYYY-MM-DD"`
3. Push to `origin main` — the next session starts by reading that file

### Handoff document template
```markdown
# Claude Handoff — YYYY-MM-DD

## What was being worked on
<active task, file paths, what's done and what's next>

## Decisions made this session
<key choices, why, any trade-offs>

## Pending / incomplete
<what still needs doing, in order>

## Gotchas to remember
<bugs found, env quirks, non-obvious facts>

## Last commit
<git log --oneline -3 output>
```

All team members using Claude should read the latest handoff file at the start of each session:
```
cat .claude/handoff-*.md | tail -200
```

## Commit conventions

All commits must follow **Conventional Commits**:

```
<type>(<scope>): <description>

feat:     new feature
fix:      bug fix
docs:     documentation only
chore:    tooling, deps, config
perf:     performance improvement
refactor: code change that neither fixes a bug nor adds a feature
test:     adding or updating tests
ci:       CI/CD changes
```

Examples:
```
feat(scan): add back button to camera phase
fix(tts): wrap generate() in asyncio.to_thread
chore(deps): upgrade google-genai to 1.20.0
```

## HuggingFace Space — Keep-Alive Setup

The HF Space sleeps after ~15 min of inactivity. GitHub Actions cron is unreliable for frequent pings (runs get skipped under load or repo inactivity). Use **UptimeRobot** as the primary keep-alive:

### UptimeRobot (primary — free)
1. Sign in at https://uptimerobot.com with `team.rizzvision@gmail.com`
2. **Add New Monitor**:
   - Monitor type: `HTTP(s)`
   - Friendly name: `Rizzvision HF Space`
   - URL: `https://rizzvision69-app-v2-space.hf.space/health`
   - Monitoring interval: `5 minutes`
   - Alert contacts: add email
3. Save — done. UptimeRobot pings every 5 min guaranteed.

### cron-job.org (alternative — free)
1. Sign up at https://cron-job.org
2. Create job → URL: `https://rizzvision69-app-v2-space.hf.space/health`
3. Schedule: every 5 minutes, method: GET

The `.github/workflows/hf-keepalive.yml` workflow remains as a **backup only** — it fires on GitHub's best-effort schedule but should not be relied upon as the sole keep-alive.

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

## Voice / TTS architecture

The app currently uses the **Web Speech API** (`SpeechSynthesis` + `SpeechRecognition`) — zero cost, no latency, works offline, but voices are robotic and vary by device/browser.

All speech goes through the `speak(text)` function in `VoiceContext.jsx`. Swapping TTS provider means replacing only that function — the rest of the app is unaffected.
