"""
ml/v3/curate_dataset.py
-----------------------
Multi-label dataset curation for Rizzvision v3.

Reads full-scene images from multiple fashion datasets and produces
image-level multi-hot labels WITHOUT any cropping.

Output structure
----------------
<out_dir>/
  images/
    train/  val/  test/
  labels_train.csv
  labels_val.csv
  labels_test.csv
  stats.json

CSV columns: filepath, tops, bottoms, footwear, outerwear, dress
             (1 = present in image, 0 = absent)

Supported source datasets
--------------------------
1. DeepFashion2         --df2-path
2. Fashionpedia         --fashionpedia-path
3. iMaterialist 2020    --imat-path
4. Open Images V7       --openimages-path   (footwear only)

Usage
-----
python ml/v3/curate_dataset.py \
    --df2-path          /data/deepfashion2 \
    --fashionpedia-path /data/fashionpedia \
    --imat-path         /data/imat2020 \
    --openimages-path   /data/openimages \
    --out               ml/v3/dataset \
    --val-frac 0.10 \
    --test-frac 0.10 \
    --max-per-class 25000 \
    --seed 42
"""

import argparse
import json
import os
import random
import shutil
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np
from tqdm import tqdm

# ── Label definitions ──────────────────────────────────────────────────────────

LABELS = ["tops", "bottoms", "footwear", "outerwear", "dress"]

# ── DeepFashion2 category → our label ──────────────────────────────────────────
# DF2 category IDs (1-indexed in annotations):
#  1=short_sleeve_top  2=long_sleeve_top  3=short_sleeve_outwear  4=long_sleeve_outwear
#  5=vest              6=sling            7=shorts                 8=trousers
#  9=skirt             10=short_sleeve_dress 11=long_sleeve_dress  12=vest_dress
#  13=sling_dress
DF2_CAT_TO_LABEL = {
    1: "tops", 2: "tops", 5: "tops", 6: "tops",
    3: "outerwear", 4: "outerwear",
    7: "bottoms", 8: "bottoms", 9: "bottoms",
    10: "dress", 11: "dress", 12: "dress", 13: "dress",
}

# ── Fashionpedia / iMaterialist supercategory → our label ─────────────────────
# Based on Fashionpedia ontology supercategories
FASHIONPEDIA_SUPER_TO_LABEL = {
    "Upper-body": "tops",
    "Lower-body": "bottoms",
    "Whole-body": "dress",
    "Outerwear":  "outerwear",
    "Feet":       "footwear",
    # Accessories / head / bags are ignored
}

# Open Images V7 class names (footwear)
OI_FOOTWEAR_CLASSES = {
    "/m/0fly7",   # shoe
    "/m/01b638",  # boot
    "/m/03yfpv",  # sneakers / athletic shoe
    "/m/02gzp",   # sandal
    "/m/0_cp5",   # high heel
    "/m/07mhn",   # sock (excluded below)
}
OI_FOOTWEAR_INCLUDE = {"/m/0fly7", "/m/01b638", "/m/03yfpv", "/m/02gzp", "/m/0_cp5"}


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _make_splits(records, val_frac, test_frac, seed):
    rng = random.Random(seed)
    rng.shuffle(records)
    n = len(records)
    n_test = int(n * test_frac)
    n_val  = int(n * val_frac)
    test   = records[:n_test]
    val    = records[n_test:n_test + n_val]
    train  = records[n_test + n_val:]
    return train, val, test


def _copy_image(src: Path, dst_dir: Path, stem: str) -> str:
    """Copy src to dst_dir/<stem>.jpg (convert if needed). Returns relative path."""
    dst = dst_dir / f"{stem}.jpg"
    if dst.exists():
        return str(dst)
    img = cv2.imread(str(src))
    if img is None:
        return None
    # Resize so the shorter side is at most 800px — keeps full composition, saves disk
    h, w = img.shape[:2]
    scale = min(1.0, 800 / min(h, w))
    if scale < 1.0:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(dst), img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return str(dst)


def _row(filepath, label_set):
    row = {"filepath": filepath}
    for lbl in LABELS:
        row[lbl] = 1 if lbl in label_set else 0
    return row


def _write_csv(rows, path):
    import csv
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["filepath"] + LABELS)
        writer.writeheader()
        writer.writerows(rows)
    print(f"  Wrote {len(rows):,} rows → {path}")


# ──────────────────────────────────────────────────────────────────────────────
# Source readers
# ──────────────────────────────────────────────────────────────────────────────

def read_deepfashion2(df2_root: Path, img_dir: Path, prefix: str) -> list[dict]:
    """
    DF2 directory layout:
      <df2_root>/
        train/image/  train/annos/
        validation/image/  validation/annos/

    Each anno file is a JSON with keys "item1", "item2", … each having "category_id".
    We read full images (no crop) and collect all category_ids → multi-hot label.
    """
    records = []
    for split in ("train", "validation"):
        anno_dir  = df2_root / split / "annos"
        image_dir = df2_root / split / "image"
        if not anno_dir.exists():
            print(f"  [DF2] skipping {split} — not found at {anno_dir}")
            continue
        anno_files = sorted(anno_dir.glob("*.json"))
        print(f"  [DF2] {split}: {len(anno_files):,} annotation files")
        for af in tqdm(anno_files, desc=f"DF2/{split}", leave=False):
            with open(af) as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    continue
            label_set = set()
            for key, val in data.items():
                if not key.startswith("item"):
                    continue
                cat = val.get("category_id")
                lbl = DF2_CAT_TO_LABEL.get(cat)
                if lbl:
                    label_set.add(lbl)
            if not label_set:
                continue
            stem = af.stem  # e.g. "000001"
            # Try common image extensions
            src = None
            for ext in (".jpg", ".JPG", ".png", ".PNG"):
                candidate = image_dir / f"{stem}{ext}"
                if candidate.exists():
                    src = candidate
                    break
            if src is None:
                continue
            unique_stem = f"{prefix}_df2_{split}_{stem}"
            dst = _copy_image(src, img_dir, unique_stem)
            if dst:
                records.append(_row(dst, label_set))
    return records


def read_fashionpedia(fp_root: Path, img_dir: Path, prefix: str) -> list[dict]:
    """
    Fashionpedia layout (COCO-style):
      <fp_root>/
        images/train2020/  images/val2020/
        annotations/instances_attributes_train2020.json
        annotations/instances_attributes_val2020.json
    """
    records = []
    splits = [
        ("train", "train2020", "instances_attributes_train2020.json"),
        ("val",   "val2020",   "instances_attributes_val2020.json"),
    ]
    for split, img_subdir, anno_file in splits:
        anno_path = fp_root / "annotations" / anno_file
        images_path = fp_root / "images" / img_subdir
        if not anno_path.exists():
            print(f"  [Fashionpedia] skipping {split} — {anno_path} not found")
            continue
        with open(anno_path) as f:
            data = json.load(f)
        # Build category_id → supercategory map
        cat_map = {}
        for cat in data.get("categories", []):
            super_cat = cat.get("supercategory", "")
            lbl = FASHIONPEDIA_SUPER_TO_LABEL.get(super_cat)
            if lbl:
                cat_map[cat["id"]] = lbl
        # Build image_id → label_set
        img_labels = defaultdict(set)
        for ann in data.get("annotations", []):
            lbl = cat_map.get(ann.get("category_id"))
            if lbl:
                img_labels[ann["image_id"]].add(lbl)
        # Build image_id → filename
        id_to_file = {img["id"]: img["file_name"] for img in data.get("images", [])}
        print(f"  [Fashionpedia] {split}: {len(img_labels):,} labelled images")
        for img_id, label_set in tqdm(img_labels.items(), desc=f"FP/{split}", leave=False):
            fname = id_to_file.get(img_id)
            if not fname:
                continue
            src = images_path / fname
            if not src.exists():
                continue
            unique_stem = f"{prefix}_fp_{split}_{img_id}"
            dst = _copy_image(src, img_dir, unique_stem)
            if dst:
                records.append(_row(dst, label_set))
    return records


def read_imat2020(imat_root: Path, img_dir: Path, prefix: str) -> list[dict]:
    """
    iMaterialist Fashion 2020 (Kaggle) layout:
      <imat_root>/
        train/   (images)
        test/    (images)
        train.csv  (image_id, ClassId, EncodedPixels)
        label_descriptions.csv  (id, name, supercategory)

    We use train.csv + label_descriptions.csv to build image-level labels.
    """
    import csv
    records = []
    label_desc = imat_root / "label_descriptions.csv"
    train_csv  = imat_root / "train.csv"
    train_imgs = imat_root / "train"
    if not label_desc.exists() or not train_csv.exists():
        print(f"  [iMat2020] skipping — CSVs not found in {imat_root}")
        return records
    # Build label_id → our label
    cat_map = {}
    with open(label_desc) as f:
        for row in csv.DictReader(f):
            super_cat = row.get("supercategory", "")
            lbl = FASHIONPEDIA_SUPER_TO_LABEL.get(super_cat)
            if lbl:
                cat_map[int(row["id"])] = lbl
    # Build image_id → label_set
    img_labels = defaultdict(set)
    with open(train_csv) as f:
        for row in csv.DictReader(f):
            class_ids_raw = row.get("ClassId", "")
            img_id = row["ImageId"]
            for cid_str in class_ids_raw.split():
                try:
                    cid = int(cid_str.split("_")[0])  # strip attribute suffix if any
                    lbl = cat_map.get(cid)
                    if lbl:
                        img_labels[img_id].add(lbl)
                except ValueError:
                    pass
    print(f"  [iMat2020] {len(img_labels):,} labelled train images")
    for img_id, label_set in tqdm(img_labels.items(), desc="iMat", leave=False):
        src = None
        for ext in (".jpg", ".png"):
            c = train_imgs / f"{img_id}{ext}"
            if c.exists():
                src = c
                break
        if not src:
            continue
        unique_stem = f"{prefix}_imat_{img_id}"
        dst = _copy_image(src, img_dir, unique_stem)
        if dst:
            records.append(_row(dst, label_set))
    return records


def read_openimages_footwear(oi_root: Path, img_dir: Path, prefix: str) -> list[dict]:
    """
    Open Images V7 footwear subset.
    Expected layout (download via FiftyOne or oidv6 downloader):
      <oi_root>/
        train/   val/   test/  (image files named by OI image_id)
        annotations/
          oidv6-class-descriptions.csv   (LabelName, DisplayName)
          train-annotations-bbox.csv     (ImageID, LabelName, …)
          validation-annotations-bbox.csv
          test-annotations-bbox.csv

    We only take images that contain at least one footwear annotation.
    Label = {"footwear"} for all such images.
    """
    import csv
    records = []
    ann_files = [
        ("train",      "train-annotations-bbox.csv",      oi_root / "train"),
        ("validation", "validation-annotations-bbox.csv", oi_root / "val"),
        ("test",       "test-annotations-bbox.csv",       oi_root / "test"),
    ]
    for split, ann_fname, split_img_dir in ann_files:
        ann_path = oi_root / "annotations" / ann_fname
        if not ann_path.exists():
            print(f"  [OpenImages] skipping {split} — {ann_path} not found")
            continue
        footwear_img_ids = set()
        with open(ann_path) as f:
            for row in csv.DictReader(f):
                if row.get("LabelName") in OI_FOOTWEAR_INCLUDE:
                    footwear_img_ids.add(row["ImageID"])
        print(f"  [OpenImages] {split}: {len(footwear_img_ids):,} footwear images")
        for img_id in tqdm(footwear_img_ids, desc=f"OI/{split}", leave=False):
            src = None
            for ext in (".jpg", ".png"):
                c = split_img_dir / f"{img_id}{ext}"
                if c.exists():
                    src = c
                    break
            if not src:
                continue
            unique_stem = f"{prefix}_oi_{split}_{img_id}"
            dst = _copy_image(src, img_dir, unique_stem)
            if dst:
                records.append(_row(dst, {"footwear"}))
    return records


# ──────────────────────────────────────────────────────────────────────────────
# Balance
# ──────────────────────────────────────────────────────────────────────────────

def _balance(records, max_per_class, seed):
    """
    Cap the number of images that contribute to each label so no class dominates.
    Images with multiple labels count toward each label's quota simultaneously.
    Uses a greedy pass: sort by label frequency (rarest first) and keep up to
    max_per_class images per label.
    """
    rng = random.Random(seed)
    rng.shuffle(records)
    counts = defaultdict(int)
    kept = []
    for rec in records:
        present = [lbl for lbl in LABELS if rec[lbl] == 1]
        if not present:
            continue
        # Keep if at least one label is still under quota
        if any(counts[lbl] < max_per_class for lbl in present):
            kept.append(rec)
            for lbl in present:
                counts[lbl] += 1
    print(f"\n  After balancing ({max_per_class:,}/class):")
    for lbl in LABELS:
        print(f"    {lbl:12s}: {counts[lbl]:,}")
    return kept


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Curate multi-label clothing dataset for Rizzvision v3")
    parser.add_argument("--df2-path",          type=Path, default=None, help="DeepFashion2 root")
    parser.add_argument("--fashionpedia-path", type=Path, default=None, help="Fashionpedia root")
    parser.add_argument("--imat-path",         type=Path, default=None, help="iMaterialist 2020 root")
    parser.add_argument("--openimages-path",   type=Path, default=None, help="Open Images V7 root")
    parser.add_argument("--out",               type=Path, default=Path("ml/v3/dataset"), help="Output directory")
    parser.add_argument("--val-frac",          type=float, default=0.10)
    parser.add_argument("--test-frac",         type=float, default=0.10)
    parser.add_argument("--max-per-class",     type=int,   default=25000)
    parser.add_argument("--seed",              type=int,   default=42)
    parser.add_argument("--prefix",            type=str,   default="v3", help="Filename prefix for copied images")
    args = parser.parse_args()

    out = args.out
    img_dir = out / "images" / "all"
    img_dir.mkdir(parents=True, exist_ok=True)
    print(f"\nOutput directory: {out}")

    # ── Collect all records ──
    all_records = []

    if args.df2_path:
        print("\n[1/4] Reading DeepFashion2 …")
        all_records += read_deepfashion2(args.df2_path, img_dir, args.prefix)
        print(f"  → {len(all_records):,} records so far")

    if args.fashionpedia_path:
        print("\n[2/4] Reading Fashionpedia …")
        all_records += read_fashionpedia(args.fashionpedia_path, img_dir, args.prefix)
        print(f"  → {len(all_records):,} records so far")

    if args.imat_path:
        print("\n[3/4] Reading iMaterialist 2020 …")
        all_records += read_imat2020(args.imat_path, img_dir, args.prefix)
        print(f"  → {len(all_records):,} records so far")

    if args.openimages_path:
        print("\n[4/4] Reading Open Images (footwear) …")
        all_records += read_openimages_footwear(args.openimages_path, img_dir, args.prefix)
        print(f"  → {len(all_records):,} records so far")

    if not all_records:
        print("\nNo records collected — check your dataset paths.")
        return

    # ── Balance ──
    print(f"\nTotal before balancing: {len(all_records):,}")
    balanced = _balance(all_records, args.max_per_class, args.seed)
    print(f"Total after balancing:  {len(balanced):,}")

    # ── Split ──
    train, val, test = _make_splits(balanced, args.val_frac, args.test_frac, args.seed)
    print(f"\nSplits — train: {len(train):,}  val: {len(val):,}  test: {len(test):,}")

    # Reorganise images into split subdirs
    for split_name, split_records in [("train", train), ("val", val), ("test", test)]:
        split_img_dir = out / "images" / split_name
        split_img_dir.mkdir(parents=True, exist_ok=True)
        for rec in tqdm(split_records, desc=f"Moving → {split_name}", leave=False):
            src = Path(rec["filepath"])
            dst = split_img_dir / src.name
            if not dst.exists():
                shutil.copy2(src, dst)
            rec["filepath"] = str(dst)

    # ── Write CSVs ──
    print("\nWriting CSVs …")
    _write_csv(train, out / "labels_train.csv")
    _write_csv(val,   out / "labels_val.csv")
    _write_csv(test,  out / "labels_test.csv")

    # ── Stats ──
    stats = {
        "total": len(balanced),
        "train": len(train),
        "val":   len(val),
        "test":  len(test),
        "label_counts": {},
    }
    for split_name, split_records in [("train", train), ("val", val), ("test", test)]:
        stats["label_counts"][split_name] = {
            lbl: sum(r[lbl] for r in split_records) for lbl in LABELS
        }
    with open(out / "stats.json", "w") as f:
        json.dump(stats, f, indent=2)
    print(f"\nStats saved → {out / 'stats.json'}")
    print("\nDone!")


if __name__ == "__main__":
    main()
