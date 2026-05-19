"""
Curate a tops / bottoms / other dataset from DeepFashion v2.

Classes
-------
  tops    — short/long sleeve tops, vests, slings (casual wearable tops)
  bottoms — shorts, trousers, skirts
  other   — outerwear, dresses (kept small to teach the model what to ignore)

Usage
-----
    python ml/v2/curate_dataset.py --df2-path /path/to/deepfashion2

Then upload to Kaggle:
    kaggle datasets init -p data/clothing_dataset
    # edit dataset-metadata.json (set title + id)
    kaggle datasets create -p data/clothing_dataset --dir-mode zip
"""

import argparse
import json
import random
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# DeepFashion v2 category mapping
# 1  short sleeve top      → tops
# 2  long sleeve top       → tops
# 3  short sleeve outwear  → other
# 4  long sleeve outwear   → other
# 5  vest                  → tops
# 6  sling                 → tops
# 7  shorts                → bottoms
# 8  trousers              → bottoms
# 9  skirt                 → bottoms
# 10 short sleeve dress    → other
# 11 long sleeve dress     → other
# 12 vest dress            → other
# 13 sling dress           → other

CATEGORY_MAP = {
    1: 'tops', 2: 'tops', 5: 'tops', 6: 'tops',
    7: 'bottoms', 8: 'bottoms', 9: 'bottoms',
    3: 'other', 4: 'other', 10: 'other', 11: 'other', 12: 'other', 13: 'other',
}

CLASSES = ['tops', 'bottoms', 'other']

TARGET_PER_CLASS = 20_000
VAL_PER_CLASS    = 2_000
TEST_PER_CLASS   = 2_000

# Keep 'other' smaller — just enough to teach the model what to reject
OTHER_TRAIN = 8_000
OTHER_VAL   = 800
OTHER_TEST  = 800

MIN_CROP_DIM   = 128
MIN_BRIGHTNESS = 30
MAX_BRIGHTNESS = 225
MIN_SHARPNESS  = 80


def laplacian_sharpness(gray: np.ndarray) -> float:
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def is_quality_crop(crop_rgb: np.ndarray) -> bool:
    h, w = crop_rgb.shape[:2]
    if h < MIN_CROP_DIM or w < MIN_CROP_DIM:
        return False
    gray = cv2.cvtColor(crop_rgb, cv2.COLOR_RGB2GRAY)
    brightness = float(gray.mean())
    if brightness < MIN_BRIGHTNESS or brightness > MAX_BRIGHTNESS:
        return False
    if laplacian_sharpness(gray) < MIN_SHARPNESS:
        return False
    return True


def crop_from_annotation(img_path: Path, bbox: list[int]) -> np.ndarray | None:
    try:
        img = np.array(Image.open(img_path).convert("RGB"))
        x1, y1, x2, y2 = bbox
        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            return None
        return crop
    except Exception:
        return None


def load_df2_annotations(df2_root: Path) -> dict[str, list]:
    """Returns {class_name: [(img_path, bbox), ...]}"""
    samples: dict[str, list] = {c: [] for c in CLASSES}

    for split in ["train", "validation"]:
        anno_dir = df2_root / split / "annos"
        img_dir  = df2_root / split / "image"
        if not anno_dir.exists():
            continue

        for anno_file in sorted(anno_dir.glob("*.json")):
            try:
                with open(anno_file) as f:
                    anno = json.load(f)
            except Exception:
                continue

            img_path = img_dir / anno_file.with_suffix(".jpg").name

            for key, item in anno.items():
                if not isinstance(item, dict) or "category_id" not in item:
                    continue
                cat_id = item["category_id"]
                label  = CATEGORY_MAP.get(cat_id)
                bbox   = item.get("bounding_box")
                if not label or not bbox or len(bbox) != 4:
                    continue
                samples[label].append((img_path, bbox))

    return samples


def save_split(samples: list, out_dir: Path, label: str, count: int, seed: int = 42):
    random.seed(seed)
    random.shuffle(samples)
    label_dir = out_dir / label
    label_dir.mkdir(parents=True, exist_ok=True)

    saved = 0
    for img_path, bbox in samples:
        if saved >= count:
            break
        crop = crop_from_annotation(img_path, bbox)
        if crop is None or not is_quality_crop(crop):
            continue
        Image.fromarray(crop).save(label_dir / f"{saved:06d}.jpg", quality=95)
        saved += 1

    print(f"  {label}: {saved}/{count} saved → {out_dir.name}/")
    return saved


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--df2-path", required=True, help="Root of DeepFashion v2 dataset")
    parser.add_argument("--out", default="data/clothing_dataset")
    args = parser.parse_args()

    df2_root = Path(args.df2_path)
    out_root = Path(args.out)

    print("Loading DeepFashion v2 annotations...")
    samples = load_df2_annotations(df2_root)
    for cls, s in samples.items():
        print(f"  {cls}: {len(s)} samples found")

    random.seed(42)
    for cls in CLASSES:
        random.shuffle(samples[cls])

    train_counts = {'tops': TARGET_PER_CLASS, 'bottoms': TARGET_PER_CLASS, 'other': OTHER_TRAIN}
    val_counts   = {'tops': VAL_PER_CLASS,    'bottoms': VAL_PER_CLASS,    'other': OTHER_VAL}
    test_counts  = {'tops': TEST_PER_CLASS,   'bottoms': TEST_PER_CLASS,   'other': OTHER_TEST}

    def split_samples(cls):
        tr = train_counts[cls]; v = val_counts[cls]; te = test_counts[cls]
        s = samples[cls]
        return s[:tr], s[tr:tr+v], s[tr+v:tr+v+te]

    print("\nBuilding train split...")
    for cls in CLASSES:
        tr, _, _ = split_samples(cls)
        save_split(tr, out_root / "train", cls, train_counts[cls])

    print("Building val split...")
    for cls in CLASSES:
        _, v, _ = split_samples(cls)
        save_split(v, out_root / "val", cls, val_counts[cls])

    print("Building test split...")
    for cls in CLASSES:
        _, _, te = split_samples(cls)
        save_split(te, out_root / "test", cls, test_counts[cls])

    metadata = {
        "title": "rizzvision-clothing-dataset-v2",
        "id": "KAGGLE_USERNAME/rizzvision-clothing-dataset-v2",
        "licenses": [{"name": "CC0-1.0"}],
    }
    with open(out_root / "dataset-metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nDataset ready at {out_root}")
    print("Next: edit dataset-metadata.json (set your Kaggle username), then:")
    print(f"  kaggle datasets create -p {out_root} --dir-mode zip")


if __name__ == "__main__":
    main()
