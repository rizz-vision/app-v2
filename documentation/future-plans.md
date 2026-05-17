# Future Plans: Multi-Class Clothing Detection

## Is it feasible?

Yes, and the current architecture is reasonably well-positioned for it — but it requires changes at every layer of the stack. Nothing is a quick swap. The scope is closer to a v3 than a patch.

The key insight: the `/quick-scan` endpoint already does open-ended clothing identification via Gemini without any model gate. The hard work is replacing the binary t-shirt detector with a proper multi-class classifier, then wiring the rest of the pipeline to be class-aware.

---

## Recommended datasets

### Primary training data

**DeepFashion v2** (already in use)
- 491K images, 13 fine-grained categories, bounding box annotations
- Strong for tops and dresses. Weak for casual bottoms — most trouser/shorts crops are editorial.
- Use: backbone of all classes. Curate via the existing `ml/curate_dataset.py` pattern.

**Fashionpedia**
- 48K images, 27 apparel categories + 294 fine-grained attributes
- The best single dataset for attribute-level detail (rise, neckline, silhouette, closure type)
- Strong real-world diversity — shot in natural settings, not just runway
- Use: supplement DF2 for every class, especially for attribute-richness in the LLM prompts
- Download: `kaggle datasets download -d validmodel/fashionpedia`

**iMaterialist Fashion 2020**
- 50K images, 228 fine-grained categories collapsed to ~27 practical ones
- Strongest for outerwear and bottoms in casual/streetwear contexts — exactly the gap DF2 leaves
- Use: primary supplement for `bottom` and `outerwear` classes
- Download: `kaggle competitions download -c imaterialist-fashion-2020-fgvc7`

**ModaNet**
- 55K street-photography images with polygon segmentation
- Shot in real urban environments (not studio) — crucial for making the model robust to real phone camera captures
- Use: validation diversity and hard negatives. Not clean enough to be primary train data.
- Download: available via COCO-format annotations on GitHub (eBay/modanet)

### False positive / negative data (non-clothing)

The current binary model uses everything outside its positive class as a negative. For multi-class, you still need an `unknown` / rejection class to catch non-clothing inputs — bags, shoes, accessories, and random objects people might point the camera at.

**Open Images V7 (Google)**
- 9M images across 600 classes. Filter to: bags, shoes, hats, sunglasses, watches, furniture, food, faces
- Use: build a hard-negative `unknown` class. Aim for 8–10K diverse crops.
- Download via `fiftyone` library: `fio download open-images-v7`

**COCO 2017**
- 330K images. Filter to non-fashion categories (person crops without visible clothing focus, objects, food)
- Use: supplement `unknown` class with everyday object false positives
- Download: `wget http://images.cocodataset.org/zips/train2017.zip`

**Accessories from DF2/Fashionpedia**
- Bags, shoes, and hats in fashion datasets are already cropped and labeled — pull them into `unknown` rather than discarding them. This directly trains the model on the most common real-world false positives.

### Recommended class structure and dataset mix

| Class | DF2 IDs | Primary supplement | Target train size |
|---|---|---|---|
| `top` | 1, 2, 10, 11 | Fashionpedia tops | 20K |
| `bottom` | 6, 7 | iMaterialist bottoms | 20K |
| `dress` | 4, 5, 8, 12, 13 | Fashionpedia dresses | 16K |
| `outerwear` | 3, 9 | iMaterialist outerwear | 16K |
| `unknown` | — | Open Images + COCO crops | 10K |

Total: ~82K training images. Val/test: 2K per class each.

---

## How the full process works end-to-end

### Step 1 — Dataset curation

Update `ml/curate_dataset.py` to:
1. Load annotations from DF2, Fashionpedia, and iMaterialist in one pass
2. Map each source's category IDs to the 5-class schema above
3. For `unknown`, sample crops from Open Images and COCO
4. Apply the same quality gates already in the script (brightness, sharpness, min dimension)
5. Output folder structure: `train/top/`, `train/bottom/`, `train/dress/`, `train/outerwear/`, `train/unknown/`
6. Upload to Kaggle as a new dataset (`rizzvision-clothing-dataset`)

### Step 2 — Model training (multi-class)

The training structure stays the same two-phase approach, with these changes:

**Architecture change:**
```
GlobalAveragePooling2D
→ BatchNorm + Dropout(0.5)
→ Dense(256, relu)
→ BatchNorm + Dropout(0.3)
→ Dense(5, softmax)     ← was Dense(1, sigmoid)
```

**Loss:** `SparseCategoricalCrossentropy` with `from_logits=False`. Focal variant (`gamma=2`) still helps since class imbalance will exist between dress/outerwear (fewer) and top/bottom (more).

**Phase 1 (head warmup):** 5 epochs, frozen base, Adam 1e-3. ~25 min on T4.

**Phase 2 (fine-tune top-100 layers):** 40 epochs max with early stopping (patience=8), cosine LR decay 1e-4 → 1e-6. With 82K training images and batch 32 → ~2,560 steps/epoch. Each epoch takes ~8–10 min on T4. Expect early stopping around epoch 20–28, so realistic Phase 2 time is **3–4 hours on T4**, ~1.5 hours on A100.

**Total expected training time:**
| GPU | Phase 1 | Phase 2 (est.) | Total |
|---|---|---|---|
| T4 (Colab free) | 25 min | 3–4 hours | ~4 hours |
| L4 (Colab Pro) | 15 min | 2–2.5 hours | ~2.5 hours |
| A100 (Colab Pro+) | 8 min | 1–1.5 hours | ~1.5 hours |

### Step 3 — Per-class threshold calibration

Instead of one threshold, sweep each class independently on the val set:

```python
thresholds = {}
for cls_idx, cls_name in enumerate(CLASSES):
    cls_mask = (val_labels == cls_idx)
    # treat this class as binary: cls vs all others
    cls_probs = val_probs[:, cls_idx]
    cls_binary = cls_mask.astype(int)
    # sweep for best F1 at FPR <= 5% for this class
    thresholds[cls_name] = sweep_threshold(cls_probs, cls_binary, fpr_cap=0.05)

# threshold.json
# {"top": 0.71, "bottom": 0.68, "dress": 0.79, "outerwear": 0.74, "unknown": 0.60}
```

The `unknown` class threshold is intentionally lower — it's better to reject an ambiguous item than to misclassify it.

### Step 4 — Backend swap

`tshirt_detector.py` → `clothing_detector.py`:
- `detect()` returns `DetectionResult(category, confidence, all_scores, threshold_used)`
- Rejection fires when `confidence < thresholds[predicted_class]`, with `error_code: "unrecognized_item"`
- `model_version: "efficientnetb3-multiclass-v1"`

Everything else in the pipeline (`image_ingestion`, `response_shaper`, `routes.py`) stays the same shape. Only `llm_feedback.py` needs meaningful rework (see System Prompt section below).

### Step 5 — Rollout

Deploy behind `/analyze-v2` first. Run both endpoints in parallel for a period to compare outputs on real traffic. Cut over `/analyze` once per-class accuracy targets are met.

---

## Ideal system prompt for general clothing coverage

System prompts are not the bottleneck here — Gemini handles open-ended clothing description well. The key design principles to preserve from the current prompt:

1. **Short sentences** — every sentence under 15 words, written for TTS
2. **Concrete tactile language** — fabric weight, neckline type, cut, silhouette, not vague praise
3. **Precise color naming** — "slate grey", "dusty rose", not "grey" or "pink"
4. **Structured JSON output** — constrained by `response_schema` so parsing never fails

Here is a recommended system prompt for general multi-class coverage:

```
You are a precise fashion analyst. Analyze the clothing item in the image.

Rules:
1. Every sentence must be under 15 words. Write for text-to-speech.
2. Use concrete tactile language appropriate to the item type:
   - Tops: neckline shape, sleeve length, fabric weight, fit (slim/regular/oversized)
   - Bottoms: rise (high/mid/low-rise), leg cut, length, waistband style
   - Dresses: silhouette (A-line/bodycon/shift), length, neckline, sleeve
   - Outerwear: collar type, closure (zip/button/snap), lining, length
3. State colors precisely: "slate grey", "dusty rose", "off-white". Not "grey" or "pink".
4. Never use vague praise: no "stylish", "cool", "sharp", "great", "pops".
5. wardrobe_description must be 3–4 sentences suitable for a wardrobe catalogue entry.
6. occasion_verdict must name specific real-world settings. Not "casual" alone.
Return ONLY valid JSON matching the schema exactly.
```

The `response_schema` stays identical to the current one — `garments`, `color_feedback`, `fit_feedback`, `overall_verdict`, `top_fix`, `occasion_verdict`, `wardrobe_description`, `personal_appearance` are all universally applicable fields. The user context message is what gets category-specific:

```python
# Injected at call time based on detected category
context_parts = [
    f"A {category} has been detected with {confidence:.0%} confidence.",
    f"Analyze this {category} specifically.",
    CATEGORY_HINTS[category],   # e.g. for bottom: "Focus on rise, leg cut, and length."
]
```

This keeps one system prompt and one schema while giving Gemini the right focus per item type. Clean, low maintenance.

---

## What needs to change (summary)

| Component | Change required | Effort |
|---|---|---|
| `ml/curate_dataset.py` | Remap categories, add new dataset loaders | Medium |
| `ml/colab_train.ipynb` | Softmax output, focal CE loss, per-class threshold sweep | Low |
| `backend/app/services/tshirt_detector.py` | Rename + multi-class output | Low |
| `backend/app/models/schemas.py` | `is_tshirt: bool` → `category: str` | Low |
| `backend/app/services/llm_feedback.py` | Dynamic context injection, `CATEGORY_HINTS` dict | Low |
| `backend/app/api/routes.py` | Update import + error code string | Trivial |
| Frontend (`ScanScreen`, `WardrobeContext`) | Show category label, tag wardrobe items | Medium |

System prompts are not a concern — one prompt handles all categories cleanly with dynamic context injection.

---

## Rollout recommendation

**Phase 1:** Curate dataset + train. Target metrics: ≥90% accuracy per class, ≤5% FPR per class.

**Phase 2:** Deploy as `/analyze-v2`. Run parallel to existing endpoint on real traffic.

**Phase 3:** Cut over `/analyze` once per-class targets confirmed. Deprecate binary t-shirt model.
