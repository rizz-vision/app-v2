"""
GrabCut segmentation + dominant color extraction test.
Run: python test_grabcut.py
Saves: grabcut_result.png showing original, mask, cropped garment, detected color
"""
import io, urllib.request, time
import numpy as np
import cv2
from PIL import Image
from sklearn.cluster import KMeans

# ── Named color palette ────────────────────────────────────────────────────────
NAMED_COLORS = [
    ("black",     (20,  20,  20)),
    ("white",     (240, 240, 240)),
    ("grey",      (128, 128, 128)),
    ("navy",      (20,  30,  100)),
    ("blue",      (50,  100, 200)),
    ("red",       (200, 30,  30)),
    ("green",     (30,  150, 50)),
    ("beige",     (210, 190, 160)),
    ("brown",     (130, 80,  40)),
    ("yellow",    (230, 210, 30)),
    ("pink",      (230, 130, 160)),
    ("purple",    (120, 40,  160)),
    ("orange",    (230, 110, 30)),
]

def nearest_color(rgb):
    r, g, b = rgb
    best, best_d = "unknown", float("inf")
    for name, (nr, ng, nb) in NAMED_COLORS:
        d = ((r-nr)**2 + (g-ng)**2 + (b-nb)**2) ** 0.5
        if d < best_d:
            best_d, best = d, name
    return best

# ── GrabCut segmentation ───────────────────────────────────────────────────────
def grabcut_segment(img_rgb: np.ndarray) -> np.ndarray:
    """
    Run GrabCut on the centre 80% of the image (assumes garment fills frame).
    Returns foreground-masked RGB image (background pixels set to 0).
    """
    h, w = img_rgb.shape[:2]
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

    # Rect covers the central 80% — leaves a border for GrabCut to treat as background
    margin_x = int(w * 0.10)
    margin_y = int(h * 0.10)
    rect = (margin_x, margin_y, w - 2*margin_x, h - 2*margin_y)

    mask = np.zeros((h, w), np.uint8)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    cv2.grabCut(img_bgr, mask, rect, bgd_model, fgd_model, iterCount=5, mode=cv2.GC_INIT_WITH_RECT)

    # Pixels marked as definite/probable foreground
    fg_mask = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # Apply mask
    result = img_rgb.copy()
    result[fg_mask == 0] = 0
    return result, fg_mask

# ── Dominant color from segmented image ──────────────────────────────────────
def dominant_color(img_rgb: np.ndarray, fg_mask: np.ndarray) -> tuple[tuple, str]:
    """Extract dominant color from foreground pixels only."""
    fg_pixels = img_rgb[fg_mask == 255].astype(float)
    if len(fg_pixels) < 100:
        # Fallback: use center crop if mask is too sparse
        h, w = img_rgb.shape[:2]
        cy, cx = h//2, w//2
        crop = img_rgb[cy-h//4:cy+h//4, cx-w//4:cx+w//4]
        fg_pixels = crop.reshape(-1, 3).astype(float)

    km = KMeans(n_clusters=3, n_init=5, random_state=0).fit(fg_pixels)
    counts = np.bincount(km.labels_)
    dom = km.cluster_centers_[np.argmax(counts)].astype(int)
    return tuple(dom), nearest_color(dom)

# ── Test images ───────────────────────────────────────────────────────────────
TESTS = [
    ("navy shirt",   "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400"),
    ("white tee",    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"),
    ("black jeans",  "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400"),
    ("red hoodie",   "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400"),
]

panels = []
for label, url in TESTS:
    print(f"Testing: {label}")
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            data = r.read()

        img = Image.open(io.BytesIO(data)).convert("RGB").resize((300, 400))
        img_np = np.array(img)

        t0 = time.time()
        segmented, fg_mask = grabcut_segment(img_np)
        rgb, color_name = dominant_color(img_np, fg_mask)
        elapsed = (time.time() - t0) * 1000

        print(f"  {label}: RGB{rgb} => '{color_name}'  ({elapsed:.0f}ms)")

        # Build a visual panel: original | mask | segmented
        mask_3ch = cv2.cvtColor(fg_mask, cv2.COLOR_GRAY2RGB)
        # Color swatch
        swatch = np.full((400, 80, 3), rgb, dtype=np.uint8)
        panel = np.hstack([img_np, mask_3ch, segmented, swatch])
        # Label
        panel_bgr = cv2.cvtColor(panel, cv2.COLOR_RGB2BGR)
        cv2.putText(panel_bgr, f"{label}: {color_name}", (5, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        panels.append(panel_bgr)

    except Exception as e:
        print(f"  {label}: ERROR {e}")

if panels:
    result = np.vstack(panels)
    cv2.imwrite("grabcut_result.png", result)
    print("\nSaved: grabcut_result.png  (original | fg_mask | segmented | color swatch)")
else:
    print("No panels to save.")
