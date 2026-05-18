"""
Curate a balanced t-shirt / not-t-shirt dataset from DeepFashion v2.

Usage:
    python ml/curate_dataset.py --df2-path /path/to/deepfashion2 --out data/tshirt_dataset

Then upload to Kaggle:
    kaggle datasets init -p data/tshirt_dataset
    # edit data/tshirt_dataset/dataset-metadata.json (set title + id)
    kaggle datasets create -p data/tshirt_dataset --dir-mode zip
"""

import argparse
import json
import random
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# DeepFashion v2 category IDs that map to "t-shirt" (positive class)
TSHIRT_CATEGORIES = {1, 2}   # 1=short sleeve top, 2=long sleeve top

# Remaining DF2 categories → negative class
NOT_TSHIRT_CATEGORIES = {3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}

TARGET_PER_CLASS = 20_000   # 20K train per class
VAL_PER_CLASS = 2_000
TEST_PER_CLASS = 2_000

MIN_CROP_DIM = 128
MIN_BRIGHTNESS = 30
MAX_BRIGHTNESS = 225
MIN_SHARPNESS = 80   # Laplacian variance


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
    """bbox: [x1, y1, x2, y2]"""
    try:
        img = np.array(Image.open(img_path).convert("RGB"))
        x1, y1, x2, y2 = bbox
        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            return None
        return crop
    except Exception:
        return None


def load_df2_annotations(df2_root: Path) -> tuple[list, list]:
    """Returns (positive_samples, negative_samples) as list of (img_path, bbox)."""
    positives, negatives = [], []

    for split in ["train", "validation"]:
        anno_dir = df2_root / split / "annos"
        img_dir = df2_root / split / "image"
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
                bbox = item.get("bounding_box")   # [x1, y1, x2, y2]
                if not bbox or len(bbox) != 4:
                    continue

                sample = (img_path, bbox)
                if cat_id in TSHIRT_CATEGORIES:
                    positives.append(sample)
                elif cat_id in NOT_TSHIRT_CATEGORIES:
                    negatives.append(sample)

    return positives, negatives


def save_split(samples: list, out_dir: Path, label: str, count: int, seed: int = 42):
    random.seed(seed)
    random.shuffle(samples)
    samples = samples[:count]
    label_dir = out_dir / label
    label_dir.mkdir(parents=True, exist_ok=True)

    saved = 0
    for img_path, bbox in samples:
        crop = crop_from_annotation(img_path, bbox)
        if crop is None or not is_quality_crop(crop):
            continue
        dest = label_dir / f"{saved:06d}.jpg"
        Image.fromarray(crop).save(dest, quality=95)
        saved += 1

    print(f"  {label}: saved {saved}/{count} to {out_dir.name}/")
    return saved


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--df2-path", required=True, help="Root of DeepFashion v2 dataset")
    parser.add_argument("--out", default="data/tshirt_dataset", help="Output directory")
    args = parser.parse_args()

    df2_root = Path(args.df2_path)
    out_root = Path(args.out)

    print("Loading DeepFashion v2 annotations...")
    positives, negatives = load_df2_annotations(df2_root)
    print(f"Found {len(positives)} positive (t-shirt), {len(negatives)} negative samples")

    # Shuffle with fixed seed for reproducibility
    random.seed(42)
    random.shuffle(positives)
    random.shuffle(negatives)

    # Split indices
    train_pos = positives[:TARGET_PER_CLASS]
    val_pos = positives[TARGET_PER_CLASS:TARGET_PER_CLASS + VAL_PER_CLASS]
    test_pos = positives[TARGET_PER_CLASS + VAL_PER_CLASS:TARGET_PER_CLASS + VAL_PER_CLASS + TEST_PER_CLASS]

    train_neg = negatives[:TARGET_PER_CLASS]
    val_neg = negatives[TARGET_PER_CLASS:TARGET_PER_CLASS + VAL_PER_CLASS]
    test_neg = negatives[TARGET_PER_CLASS + VAL_PER_CLASS:TARGET_PER_CLASS + VAL_PER_CLASS + TEST_PER_CLASS]

    print("\nBuilding train split...")
    save_split(train_pos, out_root / "train", "tshirt", TARGET_PER_CLASS)
    save_split(train_neg, out_root / "train", "not_tshirt", TARGET_PER_CLASS)

    print("Building val split...")
    save_split(val_pos, out_root / "val", "tshirt", VAL_PER_CLASS)
    save_split(val_neg, out_root / "val", "not_tshirt", VAL_PER_CLASS)

    print("Building test split...")
    save_split(test_pos, out_root / "test", "tshirt", TEST_PER_CLASS)
    save_split(test_neg, out_root / "test", "not_tshirt", TEST_PER_CLASS)

    # Write dataset-metadata.json for Kaggle upload
    metadata = {
        "title": "rizzvision-tshirt-dataset",
        "id": "KAGGLE_USERNAME/rizzvision-tshirt-dataset",
        "licenses": [{"name": "CC0-1.0"}],
    }
    with open(out_root / "dataset-metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nDataset ready at {out_root}")
    print("Next: edit dataset-metadata.json (set your Kaggle username), then run:")
    print(f"  kaggle datasets create -p {out_root} --dir-mode zip")


if __name__ == "__main__":
    main()
