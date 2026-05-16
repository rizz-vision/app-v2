"""
Evaluate the trained EfficientNetB3 model on the local test split.

Usage:
    python ml/evaluate_local.py \
        --model backend/model/tshirt_classifier.keras \
        --threshold backend/model/threshold.json \
        --test-dir data/tshirt_dataset/test
"""

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image
from sklearn.metrics import (
    accuracy_score, roc_auc_score, confusion_matrix,
    classification_report, roc_curve,
)


def load_test_set(test_dir: Path, input_size: int = 300):
    images, labels = [], []
    for label_name, label_idx in [("tshirt", 1), ("not_tshirt", 0)]:
        folder = test_dir / label_name
        for img_path in sorted(folder.glob("*.jpg")):
            img = Image.open(img_path).convert("RGB").resize((input_size, input_size))
            images.append(np.array(img, dtype="float32") / 255.0)
            labels.append(label_idx)
    return np.array(images), np.array(labels)


def find_optimal_threshold(y_true, y_prob, max_fpr: float = 0.02):
    """Return threshold that maximizes F1 while keeping FPR ≤ max_fpr."""
    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    best_thresh, best_f1 = 0.87, 0.0
    for t, fp, tp in zip(thresholds, fpr, tpr):
        if fp > max_fpr:
            continue
        precision = tp / (tp + (1 - tp)) if (tp + (1 - tp)) > 0 else 0
        recall = tp
        f1 = 2 * precision * recall / (precision + recall + 1e-9)
        if f1 > best_f1:
            best_f1, best_thresh = f1, t
    return best_thresh


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="backend/model/tshirt_classifier.keras")
    parser.add_argument("--threshold", default="backend/model/threshold.json")
    parser.add_argument("--test-dir", default="data/tshirt_dataset/test")
    args = parser.parse_args()

    print("Loading model...")
    model = tf.keras.models.load_model(args.model)

    with open(args.threshold) as f:
        threshold = json.load(f)["threshold"]

    print(f"Loading test set from {args.test_dir}...")
    X, y = load_test_set(Path(args.test_dir))
    print(f"Test samples: {len(X)} ({y.sum()} positive, {(1-y).sum()} negative)")

    print("Running inference...")
    probs = model.predict(X, batch_size=32, verbose=1).flatten()
    preds = (probs >= threshold).astype(int)

    print("\n--- Results ---")
    print(f"Accuracy:  {accuracy_score(y, preds):.4f}")
    print(f"AUC-ROC:   {roc_auc_score(y, probs):.4f}")

    cm = confusion_matrix(y, preds)
    tn, fp, fn, tp = cm.ravel()
    fpr = fp / (fp + tn)
    fnr = fn / (fn + tp)
    print(f"FPR (not_tshirt → tshirt): {fpr:.4f}  [target ≤ 0.02]")
    print(f"FNR (tshirt → not_tshirt): {fnr:.4f}  [target ≤ 0.08]")

    print("\nClassification report:")
    print(classification_report(y, preds, target_names=["not_tshirt", "tshirt"]))

    optimal = find_optimal_threshold(y, probs, max_fpr=0.02)
    print(f"\nOptimal threshold (FPR ≤ 2%): {optimal:.4f}  (current: {threshold})")

    targets_met = accuracy_score(y, preds) >= 0.93 and fpr <= 0.02
    print("\n✓ Targets met" if targets_met else "\n✗ Targets NOT met — retrain or adjust threshold")


if __name__ == "__main__":
    main()
