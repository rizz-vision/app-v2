# Future Plans: Multi-Class Clothing Detection

## Is it feasible?

Yes, and the current architecture is reasonably well-positioned for it — but it requires changes at every layer of the stack. Nothing is a quick swap. The scope is closer to a v3 than a patch.

The key insight: the `/quick-scan` endpoint already does open-ended clothing identification via Gemini without any model gate. The hard work is replacing the binary t-shirt detector with a proper multi-class classifier, then wiring the rest of the pipeline to be class-aware.

---

## What needs to change

### 1. ML — Dataset curation (`ml/curate_dataset.py`)

DeepFashion v2 already has 13 categories. The current script collapses them all into binary (t-shirt vs not). The remapping for multi-class would be:

| DF2 category IDs | New class |
|---|---|
| 1 (short sleeve top), 2 (long sleeve top) | `top` |
| 6 (trousers), 7 (shorts) | `bottom` |
| 4 (sling dress), 5 (short sleeve dress), 8 (skirt) | `dress` |
| 3 (short sleeve outwear), 9 (long sleeve outwear) | `outerwear` |
| 10 (vest), 11 (sling) | `top` (merge) |
| 12 (jumpsuits), 13 (short sleeve romper) | `other` |

The `save_split` function doesn't need to change — just the category→class mapping and the output folder structure (one subfolder per class instead of `tshirt/` + `not_tshirt/`).

### 2. ML — Training notebooks (`ml/colab_train.ipynb`, `ml/kaggle_train.ipynb`)

- Output layer: `Dense(1, activation='sigmoid')` → `Dense(N_CLASSES, activation='softmax')`
- Loss: `BinaryFocalCrossentropy` → `CategoricalFocalCrossentropy` (or `SparseCategoricalCrossentropy`)
- Metrics: swap `AUC` for `CategoricalAccuracy` + per-class F1 via a custom callback
- Threshold logic: instead of one global threshold, you need a **per-class confidence threshold** swept independently for each class on the val set
- `threshold.json` becomes a dict: `{"top": 0.72, "bottom": 0.68, "dress": 0.81, ...}`

### 3. Backend — `tshirt_detector.py` → `clothing_detector.py`

The current detector returns `DetectionResult(is_tshirt, confidence, threshold_used)` and hard-rejects anything that isn't a t-shirt. For multi-class:

- Output: `DetectionResult(category: str, confidence: float, all_scores: dict[str, float])`
- Rejection logic changes: reject if `max(all_scores) < threshold[predicted_class]` (low-confidence scan), not if it's the "wrong" category
- `model_version` field on `DetectionResult` should be bumped to `efficientnetb3-multiclass-v1`

### 4. Backend — `llm_feedback.py`

This is the heaviest lift. The current `SYSTEM_PROMPT` and `RESPONSE_SCHEMA` are hardcoded for t-shirts:

- "Analyze the t-shirt in the image"
- Fields like `garments`, `fit_feedback`, `color_feedback` are t-shirt-specific in framing

For multi-class, the prompt needs to be **dynamically constructed** based on the detected category. A bottom has different relevant attributes (rise, leg cut, waistband) than a top (neckline, sleeve length, fit). Options:
  - One prompt per category (simplest, most accurate)
  - Single generic prompt with category injected (less precise but less maintenance)

The `RESPONSE_SCHEMA` can stay structurally similar — `garments`, `color_feedback`, `fit_feedback`, `overall_verdict` still apply — but the system instruction needs to be category-aware.

### 5. Backend — `app/models/schemas.py`

`DetectionResult.is_tshirt: bool` becomes `DetectionResult.category: str`. The `AnalyzeResponse` schema doesn't need to change structurally — `speech_segments`, `wardrobe_description`, etc. still make sense.

### 6. Backend — `app/api/routes.py`

- `tshirt_detector.detect()` call stays the same shape, just returns a richer result
- The `error_code` `"not_a_tshirt"` becomes `"unrecognized_item"` with a more generic message
- `/quick-scan` already works correctly for any item — no change needed

### 7. Frontend

`ScanScreen` and `MirrorScreen` are the main screens affected. Currently they assume the scanned item is a t-shirt. Changes needed:
- Display the detected category (e.g. "Jeans detected") before showing feedback
- The wardrobe save flow in `WardrobeContext` should tag items by category
- `WardrobeScreen` filtering/grouping by category becomes more useful

---

## Recommended approach

Do this in two phases to avoid breaking the live app:

**Phase 1 — Parallel model, same API contract**
Train the multi-class model but gate it behind a feature flag or a new endpoint (`/analyze-v2`). Keep the existing `/analyze` endpoint pointing at the binary t-shirt model. This lets you validate the new model in production without risking the current user flow.

**Phase 2 — Cut over**
Once the multi-class model hits accuracy targets per class (suggested: ≥90% per class, ≤5% FPR), swap `/analyze` to use the new detector and update the frontend.

---

## Data gap to be aware of

DF2 has strong coverage of tops and dresses but **limited diversity for bottoms** — most trouser/shorts crops are formal or fashion-editorial. Real-world jeans and cargos (the primary use case) are underrepresented. Plan to supplement with iMaterialist Fashion or a targeted web scrape for casual bottoms before training.
