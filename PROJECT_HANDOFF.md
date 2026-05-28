# RizzVision — Complete Project Handoff & Technical Review

**Document Purpose:** Comprehensive handoff for a new team taking over production development.  
**Generated:** 2026-05-28  
**Repo:** https://github.com/rizz-vision/app-v2  
**Live Frontend:** https://rizzvision.vercel.app  
**Live Backend:** https://rizzvision69-app-v2-space.hf.space  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Repository Structure](#2-repository-structure)
3. [Tech Stack](#3-tech-stack)
4. [Feature Architecture](#4-feature-architecture)
5. [ML / AI Components](#5-ml--ai-components)
6. [API Reference](#6-api-reference)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Database Schema](#8-database-schema)
9. [Configuration & Secrets](#9-configuration--secrets)
10. [Deployment](#10-deployment)
11. [Running Locally](#11-running-locally)
12. [Known Issues & Limitations](#12-known-issues--limitations)
13. [What Needs Improvement](#13-what-needs-improvement)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. Executive Summary

**RizzVision** is a voice-first fashion assistant built exclusively for visually impaired users. Every interaction is audio-driven: users speak commands, hear descriptions, and receive styling feedback — no reading or fine motor control required.

### Core Capabilities
| Capability | How |
|---|---|
| Scan & catalog clothing | Camera + EfficientNetB3 (clothing detection) + Gemini (description) |
| Browse saved wardrobe | Supabase DB + Kokoro TTS |
| Get outfit suggestions | Gemini with wardrobe + user profile context |
| Check a purchase in-store | Color harmony rules + Gemini compatibility analysis |
| Full outfit mirror feedback | Gemini vision → grooming + styling notes → TTS |
| Follow-up Q&A on any screen | Context-aware Gemini chat |
| Multilingual | English, Hindi, Tamil |

### Status as of Handoff
- **Frontend:** Production on Vercel, fully functional
- **Backend:** Production on HuggingFace Spaces, fully functional
- **ML Model:** v4 (EfficientNetB3 multi-label), 5 classes, ≥93% accuracy
- **v5 training:** Notebook ready (`ml/v5/`), not yet deployed

---

## 2. Repository Structure

```
app-v2/                                 ← repo root
│
├── backend/                            ← Python FastAPI service
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py               ← ALL endpoint handlers (~800 lines)
│   │   ├── core/
│   │   │   └── config.py               ← Env vars, model paths, thresholds
│   │   ├── services/
│   │   │   ├── clothing_detector.py    ← EfficientNetB3 inference + quality gates
│   │   │   ├── image_ingestion.py      ← EXIF rotation, brightness/sharpness checks
│   │   │   ├── llm_feedback.py         ← Gemini API calls (vision + text)
│   │   │   ├── groq_fallback.py        ← Llama 3.3 70B fallback on Gemini 503
│   │   │   ├── response_shaper.py      ← Convert LLM JSON → TTS-friendly sentences
│   │   │   ├── tts_service.py          ← Kokoro 82M (en/hi) + espeak-ng (ta)
│   │   │   └── color_extractor.py      ← GrabCut + KMeans + HSL color naming/harmony
│   │   ├── models/
│   │   │   └── schemas.py              ← Pydantic response/request models
│   │   └── errors/
│   │       └── handlers.py             ← ImageQualityError + user-facing messages
│   ├── model/                          ← ML artifacts (stored via Git LFS)
│   │   ├── clothing_classifier_v4.keras   (~115 MB)
│   │   └── thresholds_v4.json             (per-class confidence thresholds)
│   ├── main.py                         ← FastAPI app init, CORS, lifespan hooks
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── frontend/                           ← React 18 + Vite SPA
│   ├── src/
│   │   ├── screens/                    ← One file per app screen
│   │   │   ├── HomeScreen.jsx
│   │   │   ├── ScanScreen.jsx
│   │   │   ├── WardrobeScreen.jsx
│   │   │   ├── OutfitScreen.jsx
│   │   │   ├── ShoppingScreen.jsx
│   │   │   ├── MirrorScreen.jsx
│   │   │   ├── ProfileScreen.jsx
│   │   │   ├── EditItemScreen.jsx
│   │   │   ├── IdentifyScreen.jsx
│   │   │   └── AuthScreen.jsx
│   │   ├── components/                 ← Reusable UI components
│   │   │   ├── CameraCapture.jsx       ← Camera access, photo capture
│   │   │   ├── ContextChat.jsx         ← Follow-up Q&A overlay
│   │   │   ├── MicButton.jsx           ← Microphone toggle indicator
│   │   │   ├── GarmentCard.jsx         ← Single item display card
│   │   │   ├── BigButton.jsx           ← Large accessible button
│   │   │   ├── LiveRegions.jsx         ← ARIA live regions for screen readers
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── VoiceIndicator.jsx      ← Listening/processing state
│   │   │   ├── PermissionsGate.jsx     ← Request mic/camera permissions
│   │   │   └── WardrobeCard.jsx        ← Item card in wardrobe list
│   │   ├── contexts/
│   │   │   ├── AppContext.jsx          ← Screen stack, language, description mode
│   │   │   ├── AuthContext.jsx         ← Supabase auth session
│   │   │   ├── WardrobeContext.jsx     ← Items CRUD + Supabase realtime sync
│   │   │   ├── VoiceContext.jsx        ← TTS output, speech recognition, commands
│   │   │   └── ProfileContext.jsx      ← User style preferences
│   │   ├── services/
│   │   │   ├── api.js                  ← Fetch wrapper (FormData → backend)
│   │   │   └── supabase.js             ← Supabase client init
│   │   ├── utils/
│   │   │   ├── constants.js            ← Screen names, colors, occasion list
│   │   │   └── storage.js              ← Supabase wardrobe CRUD + image upload
│   │   ├── voice/
│   │   │   └── commandParser.js        ← Speech-to-command matching
│   │   ├── hooks/
│   │   │   └── useSpeechOutput.jsx
│   │   ├── App.jsx                     ← Screen router (context-based stack)
│   │   └── main.jsx                    ← Entry point, context provider tree
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── ml/                                 ← Model training notebooks
│   ├── v1/                             ← Binary t-shirt classifier (archived)
│   ├── v2/                             ← 3-class softmax (archived)
│   ├── v3/                             ← 5-class multi-label (archived; v4 is an extension)
│   │   └── README.md                   ← Training guide for multi-label approach
│   ├── v4/                             ← Current deployed model training code
│   │   ├── kaggle_curate.ipynb         ← Dataset curation (DeepFashion2)
│   │   └── kaggle_train.ipynb          ← EfficientNetB3 training + threshold calibration
│   └── v5/                             ← Next model (in development, not deployed)
│       └── kaggle_train.ipynb          ← 40K cap, class weights, TPR ≥ 92% target
│
├── scripts/
│   └── push-hf.sh                      ← Deploy backend to HuggingFace Spaces
│
├── documentation/
│   └── future-plans.md                 ← Team roadmap notes
│
├── CLAUDE.md                           ← Development guidelines + architecture notes
├── PROJECT_HANDOFF.md                  ← This document
└── README.md                           ← Project overview + quick start
```

---

## 3. Tech Stack

### Backend
| Component | Library / Service | Version | Role |
|---|---|---|---|
| API framework | FastAPI | 0.115.0 | REST endpoints, async request handling |
| ASGI server | Uvicorn | 0.30.6 | Production server |
| Clothing detection | TensorFlow / Keras | 2.17.0 | EfficientNetB3 multi-label classifier |
| Primary LLM | Google Gemini 2.5 | Latest | Vision analysis, outfit suggestions, Q&A |
| Fallback LLM | Groq (Llama 3.3 70B) | 0.13.1 | Replaces Gemini on HTTP 503 |
| TTS (en, hi) | Kokoro 82M | 0.9.4 | Neural voices: `af_heart` (en), `hf_alpha` (hi) |
| TTS (ta) | espeak-ng | System | Fallback; Kokoro has no Tamil voice |
| Color extraction | scikit-learn KMeans | 1.5.2 | Dominant color from garment pixels |
| Image processing | OpenCV (headless) | 4.x | EXIF rotation, GrabCut foreground seg |
| Image processing | Pillow | 10.4.0 | Open/resize, brightness/sharpness |

### Frontend
| Component | Library / Service | Version | Role |
|---|---|---|---|
| UI framework | React | 18.3.1 | Component tree, context, hooks |
| Build tool | Vite | 5.4.1 | Dev server, HMR, production build |
| Auth + Database | Supabase | 2.45.0 | Auth, PostgreSQL, file storage, realtime |
| Voice input | Web Speech API | Browser native | Continuous speech recognition |
| Voice output | Kokoro (via backend) | — | Audio streamed from `/tts` endpoint |
| Linter | ESLint | 9.9.0 | Code quality |

### Infrastructure
| Resource | Platform | URL |
|---|---|---|
| Frontend hosting | Vercel | https://rizzvision.vercel.app |
| Backend hosting | HuggingFace Spaces | https://rizzvision69-app-v2-space.hf.space |
| Database + Auth | Supabase | Project dashboard |
| Image storage | Supabase Storage | Bucket: `wardrobe-images` |
| Keep-alive | UptimeRobot | Pings `/health` every 5 min |

---

## 4. Feature Architecture

### 4.1 Scan Screen

**Purpose:** Photograph one or more clothing items; classify, describe, and save them.

**Flow:**
```
User speaks "scan" → ScanScreen opens
→ CameraCapture component (MediaDevices API)
→ User taps capture → blob sent to POST /quick-scan
→ Backend:
    1. image_ingestion.py: EXIF rotate, quality gates (brightness, sharpness, size)
    2. clothing_detector.py: EfficientNetB3 inference → category list
    3. llm_feedback.py: Gemini /quick-scan prompt per detected item
       → Returns [{suggested_name, category, color, short_description, long_description}]
    4. response_shaper.py: Format for TTS
← Frontend receives items list
→ VoiceContext.speak() reads each item description aloud
→ User can rename via speech or type
→ WardrobeContext.addItem() → Supabase INSERT + optional image upload
```

**Key files:**
- [frontend/src/screens/ScanScreen.jsx](frontend/src/screens/ScanScreen.jsx)
- [backend/app/api/routes.py](backend/app/api/routes.py) — `/quick-scan` endpoint
- [backend/app/services/clothing_detector.py](backend/app/services/clothing_detector.py)
- [backend/app/services/llm_feedback.py](backend/app/services/llm_feedback.py)

**Multi-item support:** A single photo can yield multiple items (full outfit). The classifier produces a multi-label vector; each detected class maps to one LLM analysis call. All results are returned together.

---

### 4.2 Wardrobe Screen

**Purpose:** Browse, hear, edit, and delete saved wardrobe items.

**Flow:**
```
User speaks "wardrobe" → WardrobeScreen opens
→ WardrobeContext provides items[] (fetched from Supabase on mount)
→ Items listed by category or chronologically
→ User taps/speaks item name → VoiceContext.speak(item.description)
→ Supabase Realtime subscription: auto-refresh on any change
→ Edit: → EditItemScreen (rename, category change)
→ Delete: WardrobeContext.removeItem() → Supabase DELETE
```

**Key files:**
- [frontend/src/screens/WardrobeScreen.jsx](frontend/src/screens/WardrobeScreen.jsx)
- [frontend/src/contexts/WardrobeContext.jsx](frontend/src/contexts/WardrobeContext.jsx)
- [frontend/src/utils/storage.js](frontend/src/utils/storage.js)

---

### 4.3 Outfit Screen

**Purpose:** Get AI-generated outfit suggestions for a specified occasion.

**Flow:**
```
User speaks "outfit" or an occasion → OutfitScreen opens
→ AppContext.language + ProfileContext.profile used for prompt
→ WardrobeContext.items serialized to multi-line text
→ POST /outfit-suggestion
→ Backend:
    1. Gemini prompt includes: wardrobe items, occasion, profile context
    2. Returns suggestion string
    3. If wardrobe empty: general styling advice
← Frontend: VoiceContext.speak(suggestion)
→ ContextChat available for follow-up
```

**Key files:**
- [frontend/src/screens/OutfitScreen.jsx](frontend/src/screens/OutfitScreen.jsx)
- [backend/app/api/routes.py](backend/app/api/routes.py) — `/outfit-suggestion`

---

### 4.4 Shopping Screen

**Purpose:** Point camera at an item in a store; get buy/skip verdict based on wardrobe compatibility.

**Flow:**
```
User speaks "shopping" → ShoppingScreen opens
→ CameraCapture → blob sent to POST /shopping-analyze
→ Backend:
    Fast path (rule-based, ~1ms):
        1. clothing_detector.py: detect item category
        2. color_extractor.py: GrabCut + KMeans → dominant color
        3. color_extractor.py: HSL harmony check vs wardrobe colors
        → If clear match/mismatch: return verdict immediately (fast_path: true)
    Slow path (Gemini, ~1–2s):
        4. If rules inconclusive: Gemini prompt with wardrobe context
        → Returns: buy_verdict, compatible_items[], incompatible_items[], reason
    Color enforcement:
        → Colors in user's "MUST AVOID" profile list → always reject
← Frontend: VoiceContext.speak(verdict + reason)
```

**Key files:**
- [frontend/src/screens/ShoppingScreen.jsx](frontend/src/screens/ShoppingScreen.jsx)
- [backend/app/services/color_extractor.py](backend/app/services/color_extractor.py)
- [backend/app/api/routes.py](backend/app/api/routes.py) — `/shopping-analyze`

---

### 4.5 Mirror Screen

**Purpose:** Point camera at a full outfit (self in mirror); receive comprehensive styling and grooming feedback.

**Flow:**
```
User speaks "mirror" → MirrorScreen opens
→ CameraCapture → blob sent to POST /analyze (mode="mirror")
→ Backend:
    1. image_ingestion.py: quality gates
    2. llm_feedback.py: Gemini 2.5 Pro (higher capability)
       Prompt analyzes:
         - Outfit coordination (color harmony, texture mixing, silhouette)
         - Grooming / personal appearance
         - Overall impression (confident, casual, etc.)
         - Top fix (single most impactful improvement)
    3. response_shaper.py: segment into TTS chunks
← Frontend: VoiceContext.speak(each segment sequentially)
→ ContextChat available for follow-up ("Is this outfit appropriate for a job interview?")
```

**Key files:**
- [frontend/src/screens/MirrorScreen.jsx](frontend/src/screens/MirrorScreen.jsx)
- [backend/app/api/routes.py](backend/app/api/routes.py) — `/analyze` with `mode=mirror`

---

### 4.6 Context Chat

**Purpose:** Multi-turn Q&A available on any result screen for follow-up questions.

**Flow:**
```
User speaks follow-up question → ContextChat component activates
→ Sends to POST /context-chat:
    - question: user's speech
    - feature: current screen name
    - result_context: current screen's last result
    - wardrobe_context: summary of wardrobe items
    - history: last 6 turns [{role, text}]
    - language: en/hi/ta
→ Backend: Gemini prompt with all context → answer string
← Frontend: VoiceContext.speak(answer)
→ Turn added to history (capped at 6 turns)
```

**Key files:**
- [frontend/src/components/ContextChat.jsx](frontend/src/components/ContextChat.jsx)
- [backend/app/api/routes.py](backend/app/api/routes.py) — `/context-chat`

---

### 4.7 Voice Command System

**Purpose:** Allow fully hands-free navigation and control via continuous speech recognition.

**Architecture:**
```
VoiceContext (always running)
├── SpeechRecognition API: continuous listening
├── commandParser.js: transcript → command object
│   └── Commands: NAVIGATE, SAVE_ITEM, REPEAT, STOP, DESCRIBE_ALL, VOICE_QUERY
└── VoiceContext dispatcher: executes command on AppContext / WardrobeContext / etc.
```

**Command examples:**
| Speech | Command | Action |
|---|---|---|
| "scan" / "go to scan" | NAVIGATE → SCAN | Navigate to ScanScreen |
| "go to wardrobe" | NAVIGATE → WARDROBE | Navigate to WardrobeScreen |
| "go home" | NAVIGATE → HOME | Navigate to HomeScreen |
| "repeat that" | REPEAT | Re-speak last TTS output |
| "stop talking" | STOP | Cancel current TTS |
| "save this" | SAVE_ITEM | Trigger save on ScanScreen |
| "read all items" | DESCRIBE_ALL | TTS all wardrobe items |
| Anything else | VOICE_QUERY → POST /voice-query | Ask backend, optionally navigate |

**Key files:**
- [frontend/src/contexts/VoiceContext.jsx](frontend/src/contexts/VoiceContext.jsx)
- [frontend/src/voice/commandParser.js](frontend/src/voice/commandParser.js)

---

### 4.8 Profile Screen

**Purpose:** Store user preferences used to personalize outfit suggestions and shopping verdicts.

**Preferences stored:**
- Body type / silhouette (e.g., pear-shaped, petite, athletic)
- Size (S/M/L/XL or custom)
- Preferred color palette
- Colors to avoid ("MUST AVOID" — enforced in shopping)
- Style personality (classic, streetwear, minimalist, etc.)

**How it's used:**
- `/outfit-suggestion`: `profile_context` field injected into Gemini prompt
- `/shopping-analyze`: MUST AVOID colors trigger instant rejection

**Key files:**
- [frontend/src/screens/ProfileScreen.jsx](frontend/src/screens/ProfileScreen.jsx)
- [frontend/src/contexts/ProfileContext.jsx](frontend/src/contexts/ProfileContext.jsx)

---

### 4.9 Language Support

| Language | Code | Gemini Prompts | TTS Engine | Quality |
|---|---|---|---|---|
| English | `en` | Full | Kokoro (`af_heart`) | High |
| Hindi | `hi` | Full | Kokoro (`hf_alpha`) | High |
| Tamil | `ta` | Full | espeak-ng | Low (robotic) |

Language selected in AppContext; propagated to all API calls and TTS requests.

---

## 5. ML / AI Components

### 5.1 Clothing Classifier (v4 — Current Production)

**Architecture:**
- Base model: EfficientNetB3 (ImageNet pretrained, ~12M parameters)
- Input: 300 × 300 × 3 RGB image (normalized 0–1)
- Output: 5 independent sigmoid probabilities (multi-label, not softmax)
- Classes: `tops`, `bottoms`, `footwear`, `outerwear`, `dress`
- File: `backend/model/clothing_classifier_v4.keras` (~115 MB, stored via Git LFS)

**Why multi-label:** A single photo of a person wearing a shirt, jeans, and sneakers should detect all three. Softmax forces a single winner; sigmoid allows each class to fire independently.

**Training Pipeline (`ml/v4/`):**

*Dataset curation (`kaggle_curate.ipynb`):*
- Source: DeepFashion2 (20K–25K samples per class after filtering)
- Filtering: Remove images with low resolution, excessive background, or label noise
- Augmentation: Random flip, rotation, zoom, brightness shift, hue rotation

*Training (`kaggle_train.ipynb`):*
```
Phase 1 — Warm-up:
  - Freeze all EfficientNetB3 layers
  - Train classification head only
  - Epochs: 5, LR: 1e-3, Loss: BinaryCrossentropy

Phase 2 — Fine-tuning:
  - Unfreeze top 150 layers of EfficientNetB3
  - Epochs: 50
  - LR schedule: Cosine decay (1e-4 → 1e-6)
  - Label smoothing: 0.1
  - Early stopping: patience=10
  - Optimizer: Adam
```

*Threshold calibration:*
- Per-class thresholds set to achieve FPR ≤ 2% on validation set
- Stored in `backend/model/thresholds_v4.json`:
  ```json
  { "tops": 0.95, "bottoms": 0.75, "footwear": 0.80, "outerwear": 0.85, "dress": 0.90 }
  ```

**Inference pipeline (`backend/app/services/clothing_detector.py`):**
```
1. image_ingestion.py:
   - EXIF rotation correction
   - Reject if: dim < 100px or > 5000px, brightness < 35 or > 225, sharpness < 80
2. Resize to 300×300, normalize
3. model.predict() via asyncio.to_thread() (non-blocking)
4. Apply per-class thresholds
5. Return: { categories: [], scores: {}, is_clothing: bool }
```

**Latency:** ~300–500ms on CPU (HuggingFace Spaces T4/P100-equivalent).

---

### 5.2 Model Evolution

| Version | Architecture | Classes | Approach | Status |
|---|---|---|---|---|
| v1 | Custom CNN | 2 (clothing / not) | Binary classification | Archived |
| v2 | EfficientNetB0 | 3 (tops / bottoms / other) | Softmax | Archived |
| v3 | EfficientNetB3 | 5 | Multi-label sigmoid | Archived |
| v4 | EfficientNetB3 | 5 | Multi-label, per-class thresholds | **Production** |
| v5 | EfficientNetB3 | 5+ | 40K cap, class weights, TPR ≥ 92% | Training ready |

---

### 5.3 Gemini Integration

**Model split:**
| Endpoint | Gemini Model | Reason |
|---|---|---|
| `/analyze`, `/mirror` | `gemini-2.5-pro` | High-quality detailed analysis |
| All others | `gemini-2.5-flash` | Speed + cost |

**Structured output:** Every Gemini call uses `response_schema` + `response_mime_type="application/json"`. No regex parsing of free text — guaranteed parseable JSON.

**System prompts are category-aware.** Each clothing category has a dedicated prompt focusing on its relevant attributes:

| Category | Prompt focus |
|---|---|
| `tops` | Neckline, sleeve length/style, fabric, fit across shoulders and chest |
| `bottoms` | Rise, leg cut, fabric, waistband, length, distressing |
| `footwear` | Sole type, material, heel height, closure, formality |
| `outerwear` | Closure type, collar, fit, length, hardware |
| `dress` | Silhouette, neckline, sleeve, fabric, length, waist definition |

**Key file:** [backend/app/services/llm_feedback.py](backend/app/services/llm_feedback.py)

---

### 5.4 Groq Fallback

When Gemini returns HTTP 503 (overloaded):
1. All Gemini calls automatically catch the 503
2. Retry the same prompt via Groq API (Llama 3.3 70B for text; Llama 4 Scout for vision)
3. Response prepended with: `"Gemini is currently experiencing high demand. Switched to backup AI — response may vary slightly."`
4. Zero user-facing error; seamless degradation

**Key file:** [backend/app/services/groq_fallback.py](backend/app/services/groq_fallback.py)

---

### 5.5 Color Extraction & Harmony Engine

**Algorithm (`backend/app/services/color_extractor.py`):**

```
1. GrabCut (OpenCV):
   - Segment garment foreground from background
   - Use center-biased bounding box as seed
   - Iterations: 5

2. KMeans (scikit-learn, k=3):
   - Cluster foreground pixels into 3 dominant colors
   - Pick cluster with most pixels as primary color

3. HSL color naming:
   - Map RGB → HSL
   - Name by hue bucket (red, orange, yellow, green, teal, blue, purple, pink)
   - Adjust for lightness (black < 15, white > 85, grey if saturation < 15)

4. HSL harmony scoring:
   - Analogous: hue diff ≤ 30° → compatible
   - Complementary: hue diff 150–210° → bold but intentional
   - Neutral: low saturation → compatible with anything
   - Clash: saturated colors 30–150° apart → incompatible
```

**Used in:** Shopping fast path (rule-based verdict), Scan color labeling.

---

### 5.6 Text-to-Speech (Kokoro)

**Model:** Kokoro 82M — a lightweight neural TTS model (~82M parameters).

**Voices:**
- English: `af_heart` (female, warm)
- Hindi: `hf_alpha` (female)
- Tamil: Not supported → fallback to `espeak-ng`

**Endpoint:** `POST /tts` — returns raw WAV audio (binary).

**Frontend playback:** The WAV blob is decoded and played via the Web Audio API.

**Segmentation:** Long responses are split into segments by `response_shaper.py` to allow sentence-by-sentence playback with pauses, enabling users to interrupt mid-response.

---

## 6. API Reference

### POST /quick-scan
Lightweight multi-item garment identification. Used by ScanScreen.

**Request:** `multipart/form-data`
- `image` (file, required)
- `language` (string, default: `"en"`)

**Response:**
```json
{
  "items": [
    {
      "suggested_name": "Navy Blue Oxford Shirt",
      "category": "tops",
      "color": "navy blue",
      "short_description": "A navy blue Oxford shirt with a button-down collar.",
      "long_description": "A well-structured navy blue Oxford cloth button-down shirt. The collar features brass buttons and lies flat. The fabric is medium-weight cotton with a slight texture..."
    }
  ],
  "category": "tops",
  "color": "navy blue",
  "short_description": "...",
  "long_description": "..."
}
```

---

### POST /analyze
Full garment analysis or mirror mode. Used by MirrorScreen; also supports deep scan.

**Request:** `multipart/form-data`
- `image` (file, required)
- `occasion` (string, max 200 chars)
- `mode` (string: `""` or `"mirror"`)

**Response:**
```json
{
  "speech_segments": [{ "id": 1, "text": "Your outfit looks well-coordinated." }],
  "detection": {
    "is_clothing": true,
    "categories": ["tops", "bottoms"],
    "category": "tops",
    "scores": { "tops": 0.97, "bottoms": 0.82 },
    "model_version": "v4"
  },
  "wardrobe_description": "A navy Oxford shirt paired with dark slim jeans.",
  "personal_appearance": "...",
  "mirror_data": { ... },
  "latency_ms": 1240
}
```

---

### POST /outfit-suggestion
Generate outfit recommendation from wardrobe.

**Request:** `multipart/form-data`
- `wardrobe_items` (string: newline-delimited item descriptions)
- `occasion` (string, max 200 chars)
- `mode` (string, default: `"general"`)
- `profile_context` (string, max 500 chars)
- `language` (string)

**Response:** `{ "suggestion": "For a casual Friday, pair your navy Oxford with..." }`

---

### POST /shopping-analyze
Buy/skip verdict for an in-store item.

**Request:** `multipart/form-data`
- `image` (file, required)
- `wardrobe_context` (string)
- `profile_context` (string)
- `language` (string)

**Response:**
```json
{
  "speech_segments": [{ "id": 1, "text": "Go ahead and buy it." }],
  "has_wardrobe": true,
  "buy_verdict": "yes",
  "detected_category": "tops",
  "compatible_items": ["Dark slim jeans", "Chinos"],
  "incompatible_items": [],
  "fast_path": true
}
```

---

### POST /context-chat
Multi-turn follow-up Q&A.

**Request:** `multipart/form-data`
- `question` (string, required)
- `feature` (string: current screen name)
- `result_context` (string: last API result as text)
- `wardrobe_context` (string)
- `history` (string: JSON array `[{ "role": "user"|"assistant", "text": "..." }]`)
- `language` (string)

**Response:** `{ "answer": "Yes, that olive jacket would complement your navy Oxford..." }`

---

### POST /describe-frame
Lightweight "what's in frame" preview for camera guidance.

**Request:** `multipart/form-data` — `image` (file)

**Response:** `{ "description": "A blue denim jacket on a white background." }`

---

### POST /identify-item
Match a photo to an existing wardrobe item.

**Request:** `multipart/form-data`
- `image` (file)
- `wardrobe` (string: JSON array of wardrobe items)

**Response:**
```json
{
  "matched_id": "uuid-of-matched-item",
  "confidence": "high",
  "spoken": "This looks like your navy Oxford shirt."
}
```

---

### POST /voice-query
Handle a free-form voice question; optionally navigate.

**Request:** `multipart/form-data`
- `query` (string)
- `app_context` (string: current screen)
- `language` (string)
- `wardrobe_context` (string)

**Response:** `{ "answer": "Your wardrobe has 12 items.", "command": "WARDROBE" }`
- `command`: navigation command to execute (`""` = none)

---

### POST /tts
Convert text to speech audio.

**Request:** `multipart/form-data`
- `text` (string, max 1000 chars)
- `language` (string: `"en"` | `"hi"` | `"ta"`)

**Response:** `audio/wav` binary stream

---

### GET /health / HEAD /health
Health check endpoint.

**Response:** `{ "status": "ok", "version": "2.0.0" }`

---

## 7. Frontend Architecture

### Screen Navigation

No URL router. Navigation is managed by a screen stack in `AppContext`:

```jsx
// AppContext
const [screenStack, setScreenStack] = useState(['HOME'])
const navigate = (screen) => setScreenStack(prev => [...prev, screen])
const goBack = () => setScreenStack(prev => prev.slice(0, -1))
const currentScreen = screenStack[screenStack.length - 1]
```

App.jsx renders the top-of-stack screen component.

### Context Provider Tree

Providers are nested (innermost → outermost at runtime):

```
<AuthProvider>           ← Supabase auth, user session
  <AppProvider>          ← Screen stack, language, description mode (short/long)
    <WardrobeProvider>   ← Items[], CRUD, Supabase realtime sync
      <VoiceProvider>    ← TTS, speech recognition, command dispatch
        <App />
      </VoiceProvider>
    </WardrobeProvider>
  </AppProvider>
</AuthProvider>
```

### Custom Hooks (for consuming contexts)

```jsx
const { currentScreen, navigate, language, descMode } = useApp()
const { user, signOut }                               = useAuth()
const { items, addItem, updateItem, removeItem }      = useWardrobe()
const { speak, listening, isSpeaking, t }             = useVoice()
const { profile, updateProfile }                      = useProfile()
```

- `t(key)` — translation helper: returns string in current language
- `descMode` — `"short"` or `"long"`: controls which Gemini description to speak

### Accessibility Architecture

All UX is designed to work without looking at the screen:

- **ARIA live regions** (`LiveRegions.jsx`): Announce screen changes, errors, results to screen readers
- **Semantic HTML:** Buttons use `role="button"`, inputs labeled, images described
- **No visual-only states:** Every state change has an audio announcement
- **Large touch targets:** `BigButton` has minimum 64px height
- **TTS for everything:** Item names, descriptions, errors, confirmations — all spoken

### Voice Context Details

```
SpeechRecognition (Web Speech API)
  ├── continuous: true
  ├── interimResults: false
  ├── lang: current language code
  └── onresult → commandParser.js → VoiceContext dispatcher

TTS playback:
  ├── Queue: speak() adds to queue, plays sequentially
  ├── Interrupt: stop() cancels current + clears queue
  ├── Segments: Long responses are chunked; each chunk played with small pause
  └── Audio: fetch /tts → blob → AudioContext.decodeAudioData → play
```

---

## 8. Database Schema

### Table: wardrobe_items

```sql
CREATE TABLE wardrobe_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  category    text,          -- 'tops' | 'bottoms' | 'footwear' | 'outerwear' | 'dress'
  type        text,          -- Legacy alias for category (same value, kept for compat)
  color       text,          -- Human-readable color name (e.g., "navy blue")
  description text,          -- Long-form TTS-ready description from Gemini
  image_url   text,          -- Public URL in 'wardrobe-images' Supabase bucket
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_wardrobe_user    ON wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_created ON wardrobe_items(created_at DESC);
```

### Auth: Supabase Managed

Standard `auth.users` table managed by Supabase. Email + password auth. Row-level security (RLS) on `wardrobe_items` ensures users can only read/write their own rows.

### RLS Policies (required — verify in Supabase dashboard)

```sql
-- Users read only their own items
CREATE POLICY "select own items"
  ON wardrobe_items FOR SELECT
  USING (auth.uid() = user_id);

-- Users insert only their own items
CREATE POLICY "insert own items"
  ON wardrobe_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users update only their own items
CREATE POLICY "update own items"
  ON wardrobe_items FOR UPDATE
  USING (auth.uid() = user_id);

-- Users delete only their own items
CREATE POLICY "delete own items"
  ON wardrobe_items FOR DELETE
  USING (auth.uid() = user_id);
```

### Storage: `wardrobe-images` Bucket

- **Path pattern:** `{user_id}/{timestamp}.{ext}`
- **Visibility:** Public (images served directly via URL in the app)
- **Upload:** [frontend/src/utils/storage.js](frontend/src/utils/storage.js) — `uploadWardrobeImage()`
- **Cleanup:** Not currently automated; orphaned images accumulate on item delete

---

## 9. Configuration & Secrets

### Backend Environment Variables

Set these in HuggingFace Spaces → Settings → Repository secrets:

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Google AI Studio API key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Model for most endpoints |
| `GEMINI_PRO_MODEL` | No | `gemini-2.5-pro` | Model for /analyze, /mirror |
| `GROQ_API_KEY` | No | `""` | Groq API key (Llama fallback) |
| `GROQ_TEXT_MODEL` | No | `llama-3.3-70b-versatile` | Groq text model |
| `GROQ_VISION_MODEL` | No | `meta-llama/llama-4-scout-17b-16e-instruct` | Groq vision model |
| `HF_TOKEN` | Yes | — | HuggingFace token (Kokoro model download) |
| `CLOTHING_MODEL_PATH` | No | `model/clothing_classifier_v4.keras` | Model file path |
| `CLOTHING_THRESHOLD_PATH` | No | `model/thresholds_v4.json` | Thresholds file path |
| `MIN_IMAGE_DIM` | No | `100` | Minimum image dimension (px) |
| `MAX_IMAGE_DIM` | No | `5000` | Maximum image dimension (px) |
| `MIN_BRIGHTNESS` | No | `35.0` | Minimum pixel brightness |
| `MAX_BRIGHTNESS` | No | `225.0` | Maximum pixel brightness |
| `MIN_SHARPNESS` | No | `80.0` | Minimum Laplacian variance |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins (comma-separated) |

### Frontend Environment Variables

Set in Vercel project settings → Environment Variables:

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `VITE_API_BASE_URL` | Yes | Backend URL (`https://rizzvision69-app-v2-space.hf.space`) |
| `VITE_SUPABASE_OAUTH_REDIRECT_URL` | No | OAuth redirect (if using OAuth auth) |

### Where to Obtain Secrets

| Secret | Source |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com → API Keys |
| `GROQ_API_KEY` | https://console.groq.com → API Keys |
| `HF_TOKEN` | https://huggingface.co/settings/tokens |
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |

---

## 10. Deployment

### Frontend — Vercel

1. Connect repo (`rizz-vision/app-v2`) to Vercel
2. Set root directory to `frontend/`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables (see section 9)
6. Push to `main` → auto-deploys

### Backend — HuggingFace Spaces

**Manual deploy (recommended for model updates):**
```bash
bash scripts/push-hf.sh
```
This script:
1. Creates a throwaway git worktree
2. Copies `backend/` contents only
3. Configures Git LFS for `.keras` model files
4. Force-pushes to the `hf-space` remote (HuggingFace watches this branch)
5. HuggingFace auto-runs the Dockerfile on push

**GitHub Actions deploy** (on `backend/` file changes to `main`): Configured in `.github/workflows/`.

**HuggingFace Space details:**
- Space name: `rizzvision69/app-v2-space`
- SDK: Docker
- Port: 7860 (Uvicorn listens here)
- Restart policy: Auto (HF manages)

**Keep-alive:** UptimeRobot pings `GET /health` every 5 minutes to prevent the HF Space from sleeping due to inactivity.

### Model Files (Git LFS)

The Keras model (`clothing_classifier_v4.keras`, ~115 MB) is tracked by Git LFS. When deploying:
- `git lfs pull` is required after cloning on a fresh machine
- The push script handles LFS pointers correctly for HF Spaces
- HF Spaces has a 10 GB storage limit (currently well within bounds)

---

## 11. Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git LFS (`git lfs install`)
- espeak-ng (for Tamil TTS testing): `sudo apt install espeak-ng` or Windows equivalent

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # Edit: add GEMINI_API_KEY and HF_TOKEN
git lfs pull                # Download model files (~115 MB)
uvicorn main:app --reload   # http://localhost:8000
```
First request triggers model load (~30s). Subsequent requests are fast.

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # Edit: add Supabase keys + API URL
npm run dev                         # http://localhost:5173
```
The Vite dev server proxies `/api/*` → `http://localhost:8000`.

### Testing the API directly
```bash
# Health check
curl http://localhost:8000/health

# Quick scan (replace photo.jpg with a real image)
curl -X POST http://localhost:8000/quick-scan \
  -F "image=@photo.jpg" \
  -F "language=en"
```

---

## 12. Known Issues & Limitations

| Issue | Severity | Workaround | Root Cause |
|---|---|---|---|
| Tamil TTS uses espeak-ng (robotic voice) | Medium | None; espeak-ng is the fallback | Kokoro 82M has no Tamil voice |
| HF Space sleeps after ~15 min inactivity | Low | UptimeRobot keep-alive pings | HF free tier policy |
| Web Speech API inconsistent across browsers | Medium | None; device/browser dependent | Browser implementation differences |
| No image editing in wardrobe | Low | Re-scan the item | Feature not implemented |
| Orphaned images in storage on item delete | Low | Manual cleanup in Supabase dashboard | Delete hook not implemented |
| Git LFS bandwidth limits | Low | Deploy via script, not frequent clones | Free tier: 1 GB/month |
| `type` column duplicates `category` | Low | Use `category`; `type` is legacy | Not cleaned up to maintain compat |
| Profile preferences stored in-memory only | High | Re-enter on every session | ProfileContext not persisted to DB |

---

## 13. What Needs Improvement

### Critical (block production readiness for serious use)

**1. Profile persistence**  
`ProfileContext` stores preferences only in React state — they are lost on page refresh or new session. This needs to be persisted to a Supabase `user_profiles` table.
- Add `user_profiles` table: `(user_id, body_type, size, preferred_colors, avoid_colors, style_personality)`
- Load on auth, save on profile update

**2. Orphaned storage cleanup**  
When a wardrobe item is deleted, its image in the `wardrobe-images` bucket is not deleted. Accumulates over time.
- Add a Supabase edge function triggered on `wardrobe_items` DELETE to remove the corresponding storage object

**3. Tamil TTS quality**  
espeak-ng output is robotic and unintelligible to many users. Tamil speakers deserve the same quality.
- Option A: ElevenLabs multilingual v2 (paid, ~$0.30/1K chars)
- Option B: Microsoft Azure TTS (Tamil `ta-IN-ValluvarNeural`)
- Option C: Wait for Kokoro Tamil voice (community development)

### High Priority (significant UX impact)

**4. Speech recognition fallback**  
Web Speech API fails silently on some devices and is unavailable in in-app browsers (WhatsApp, Instagram). There is no fallback.
- Add Whisper (via Groq's free Whisper endpoint) as fallback when Web Speech API is unavailable
- Detection: catch `SpeechRecognition` init errors, switch to Whisper

**5. Outfit suggestion with visual context**  
Currently, outfit suggestions are text-only (Gemini reads wardrobe item descriptions). Users without vision benefit more from accurate descriptions, but Gemini could also analyze saved item images for better suggestions.
- Pass `image_url` references from saved items to Gemini in outfit prompts

**6. Supabase image URL expiry**  
Public bucket images served via Supabase CDN do not expire, but if the bucket is made private in the future, presigned URLs would need rotation logic.

### Medium Priority (quality improvements)

**7. Improve `tops` sub-classification**  
Currently all tops are one class. Gemini handles distinctions verbally, but the ML model cannot differentiate shirt vs hoodie vs tank top at the detection stage, which affects threshold calibration and downstream prompting.
- Add `shirt`, `knitwear`, `activewear_top` as sub-classes in v5

**8. Response latency on Gemini Pro**  
`/analyze` and `/mirror` use `gemini-2.5-pro`, which has 1.5–3s latency on complex prompts. Users with slower connections experience noticeable delay before TTS begins.
- Implement streaming responses from Gemini → stream TTS sentence-by-sentence

**9. Context chat history size**  
History is capped at 6 turns and stored in-memory per session. No history across sessions; no history UI.
- Persist chat history to Supabase (optional user setting)
- Increase cap or implement summarization for long conversations

**10. Image size validation on client**  
Currently, oversized images are rejected by the backend quality gate. The error is spoken to the user after a round trip. A client-side pre-check (before upload) would give instant feedback.

### Low Priority (nice to have)

**11. Wardrobe image editing**  
Users cannot crop or re-photograph a saved item without deleting and re-scanning.

**12. Outfit history**  
No record of what outfits were suggested or worn. Could be useful for "What did I wear to the last interview?" queries.

**13. Schema cleanup**  
The `type` column in `wardrobe_items` is redundant with `category`. A migration to remove it would simplify future development.

---

## 14. Future Roadmap

### Short-term (next 1–2 sprints)

| Task | Effort | Impact |
|---|---|---|
| Persist ProfileContext to Supabase | Medium | High (data loss fix) |
| Delete orphaned storage on item delete | Small | Medium (cost + hygiene) |
| Client-side image size validation | Small | Medium (UX) |
| Tamil TTS upgrade (Azure or ElevenLabs) | Medium | High (Tamil users) |

### Medium-term (1–3 months)

| Task | Effort | Impact |
|---|---|---|
| Whisper fallback for speech recognition | Medium | High (browser compat) |
| Stream Gemini Pro responses → stream TTS | Large | High (perceived latency) |
| Train and deploy v5 model (40K cap, class weights) | Large | High (accuracy) |
| Outfit suggestion with image context | Medium | High (suggestion quality) |
| Expand outerwear sub-classes (coat, blazer, sweater) | Large | Medium |

### Long-term (3–6 months)

| Task | Effort | Impact |
|---|---|---|
| Native mobile app (React Native or Capacitor) | XL | High (iOS/Android distribution) |
| Video/live-stream mirror mode | XL | Medium (real-time feedback) |
| Wardrobe sharing / collaborative planning | Large | Medium |
| Seasonal wardrobe rotation suggestions | Medium | Medium |
| On-device ML model (TFLite for offline use) | XL | High (privacy + offline) |

---

## Appendix A: Quick Reference

### Backend Service Map
```
POST /quick-scan          → ScanScreen (primary)
POST /analyze             → MirrorScreen, deep scan
POST /outfit-suggestion   → OutfitScreen
POST /shopping-analyze    → ShoppingScreen
POST /context-chat        → ContextChat (all screens)
POST /describe-frame      → Camera preview
POST /identify-item       → IdentifyScreen
POST /voice-query         → VoiceContext (open-ended queries)
POST /tts                 → VoiceContext (all TTS)
GET  /health              → UptimeRobot, load balancers
```

### Error Codes (ImageQualityError)
| Code | Spoken Message |
|---|---|
| `not_clothing` | "This doesn't look like clothing. Try pointing the camera at a garment." |
| `too_dark` | "The image is too dark. Move to better lighting and try again." |
| `too_bright` | "The image is overexposed. Try reducing glare." |
| `blurry` | "The image is blurry. Hold the camera steady and try again." |
| `image_too_small` | "The image is too small. Move the camera closer." |
| `image_too_large` | "The image file is too large. Try taking a photo at lower resolution." |

### Voice Commands Quick Reference
```
Navigation:   "scan" | "wardrobe" | "outfit" | "shopping" | "mirror" | "home" | "back"
Playback:     "repeat that" | "stop" | "stop talking"
Wardrobe:     "save this" | "read all items" | "delete this"
Free-form:    Anything else → /voice-query → Gemini answer + optional navigation
```

---

*End of handoff document. For questions, see CLAUDE.md for development conventions, or file an issue in the GitHub repository.*
