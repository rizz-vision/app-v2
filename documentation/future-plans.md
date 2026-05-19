# Rizzvision: Architecture Notes & Future Plans

## What's been built (v2 — complete)

The binary t-shirt detector has been replaced with a full multi-class clothing classifier. All layers of the stack have been updated.

### ML model
- **Model:** EfficientNetB3 3-class softmax (`tops` / `bottoms` / `other`)
- **Dataset:** `nitin2807/rizzvision-clothing-dataset-v2` — 17K tops, 17K bottoms, 7K other (DeepFashion v2)
- **Training:** 2-phase fine-tuning on Kaggle P100. Phase 1: 5 epochs frozen base. Phase 2: 50 epochs, top-150 unfrozen, cosine LR, label smoothing 0.1
- **Results:** 94.87% overall accuracy, FPR < 2% per class at calibrated thresholds
- **Thresholds:** `tops: 0.91`, `bottoms: 0.70`, `other: 0.85` (stored in `thresholds_v2.json`)
- **Training notebook:** `ml/v2/kaggle_train.ipynb`

### Backend
- `clothing_detector.py` — 3-class softmax, per-class threshold gate, `not_clothing` / `low_confidence` error codes
- `llm_feedback.py` — category-aware system prompts (tops focuses on neckline/sleeve, bottoms on rise/cut)
- `/analyze` and `/mirror` use `gemini-2.5-pro` for richer descriptions
- All other endpoints (`/quick-scan`, `/voice-query`, etc.) use `gemini-2.5-flash`

### v1 archive
Old binary t-shirt model files are preserved in `ml/v1/` for reference.

---

## Potential future improvements

### Model — expand class coverage
The current `other` class catches dresses, outerwear, and accessories but doesn't classify them. Future options:

| Addition | Effort | Benefit |
|---|---|---|
| Add `dress` class | Medium — need DF2 dress crops (IDs 10–13) | Enables dress-specific Gemini prompts |
| Add `outerwear` class | Medium — DF2 IDs 3, 4 | Handles jackets/coats properly |
| Fine-grained tops (shirt vs hoodie vs vest) | High — needs much more data | Marginal — Gemini already handles this |

Recommended dataset supplements:
- **Fashionpedia** — 48K images, 27 categories, best for attribute richness
- **iMaterialist Fashion 2020** — strongest for casual bottoms and outerwear
- **ModaNet** — street photography, improves real-world robustness

### Model — improve tops accuracy
Tops FPR sits at 1.50% (close to target). Confusion is mainly tops↔other (87 misclassified as other out of 1738). Options:
- Add more diverse top crops (hoodies, vests, slings) to training set
- Raise `OTHER_TRAIN` cap — currently 8K, which keeps `other` small by design

### Backend — expose category to frontend
`DetectionResult.category` is returned in `/analyze` response but the frontend doesn't currently display or store it. Wardrobe items could be auto-tagged with `tops`/`bottoms` to improve outfit suggestion context.

### TTS — upgrade from Web Speech API
Current TTS is Kokoro (en/hi) + espeak-ng (ta) on the backend. The web app falls back to browser `SpeechSynthesis`. Upgrading to ElevenLabs or a hosted Kokoro instance would give consistent, natural voices across devices — only `speak()` in `VoiceContext.jsx` needs changing.

### Multilingual support
Hindi (hi) and Tamil (ta) are partially wired. Full support requires:
- Gemini prompts localised per language (currently English only)
- Wardrobe descriptions stored in the scan language
- Voice query responses verified by a native speaker
