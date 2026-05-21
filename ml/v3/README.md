# Rizzvision ML v3 — Multi-Label Clothing Classifier

## What's different from v2

| | v2 | v3 |
|---|---|---|
| Task | Single-label (tops / bottoms / other) | Multi-label (tops + bottoms + footwear + outerwear + dress) |
| Input | Cropped garment region | Full scene image — no cropping |
| Output head | Softmax (3-class) | Sigmoid (5-class, independent) |
| Loss | Categorical cross-entropy | Binary cross-entropy |
| Use case | Is this one item a top or bottom? | What garments appear in this photo? |

## Labels

`tops` · `bottoms` · `footwear` · `outerwear` · `dress`

An image can carry any combination (e.g. a full outfit photo = tops + bottoms + footwear = 1,1,1,0,0).

## Recommended datasets

| Dataset | Labels available | Notes |
|---|---|---|
| **DeepFashion2** | tops, bottoms, outerwear, dress | Full scene + per-item annotations. Best overall. |
| **Fashionpedia** | all 5 classes | COCO-style, supercategory maps cleanly to our labels. |
| **iMaterialist 2020** | all 5 classes | Kaggle competition; dense pixel labels, easy to derive image-level. |
| **Open Images V7** | footwear | Use shoe/boot/sneaker/sandal classes. ~10K footwear images. |

Target per class (before balancing): **20–25K** images.

## Files

- `curate_dataset.py` — Local curation script. Reads raw datasets, derives image-level multi-hot labels, copies full images (no cropping), outputs train/val/test CSVs.
- `kaggle_train.ipynb` — Kaggle training notebook. EfficientNetB3 + sigmoid head, two-phase training, per-class threshold calibration targeting FPR ≤ 2%.

## Quick start

### 1. Curate locally

```bash
python ml/v3/curate_dataset.py \
    --df2-path          /data/deepfashion2 \
    --fashionpedia-path /data/fashionpedia \
    --imat-path         /data/imat2020 \
    --openimages-path   /data/openimages \
    --out               ml/v3/dataset \
    --max-per-class     25000
```

### 2. Upload to Kaggle

```bash
# Create dataset metadata
kaggle datasets init -p ml/v3/dataset
# Edit ml/v3/dataset/dataset-metadata.json (title, slug)
kaggle datasets create -p ml/v3/dataset
```

### 3. Train on Kaggle

Open `kaggle_train.ipynb` in Kaggle, set `DATASET_DIR` to your dataset slug, run all cells.
Use **P100** accelerator (BATCH_SIZE=32) or **A100** (BATCH_SIZE=48).

### 4. Deploy

Download `clothing_classifier_v3.keras` + `thresholds_v3.json` from Kaggle output → `backend/model/`.

See the deployment checklist at the bottom of `kaggle_train.ipynb`.
