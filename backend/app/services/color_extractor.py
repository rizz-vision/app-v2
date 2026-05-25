"""
Fast garment color extraction using GrabCut segmentation + KMeans.
No ML model required — runs in ~200-500ms on CPU.
"""
import cv2
import numpy as np
from sklearn.cluster import KMeans

# Named color palette (RGB)
_NAMED_COLORS = [
    ("black",   (20,  20,  20)),
    ("white",   (240, 240, 240)),
    ("grey",    (128, 128, 128)),
    ("navy",    (20,  30,  100)),
    ("blue",    (50,  100, 200)),
    ("red",     (200, 30,  30)),
    ("green",   (30,  150, 50)),
    ("beige",   (210, 190, 160)),
    ("brown",   (130, 80,  40)),
    ("yellow",  (230, 210, 30)),
    ("pink",    (230, 130, 160)),
    ("purple",  (120, 40,  160)),
    ("orange",  (230, 110, 30)),
]


def _nearest_color(rgb: tuple) -> str:
    r, g, b = rgb
    best, best_d = "unknown", float("inf")
    for name, (nr, ng, nb) in _NAMED_COLORS:
        d = ((r - nr) ** 2 + (g - ng) ** 2 + (b - nb) ** 2) ** 0.5
        if d < best_d:
            best_d, best = d, name
    return best


def _grabcut_mask(img_rgb: np.ndarray) -> np.ndarray:
    """Returns a binary foreground mask (255=fg, 0=bg) using GrabCut."""
    h, w = img_rgb.shape[:2]
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

    # 10% border margin — lets GrabCut treat the edges as background
    mx, my = max(1, int(w * 0.10)), max(1, int(h * 0.10))
    rect = (mx, my, w - 2 * mx, h - 2 * my)

    mask = np.zeros((h, w), np.uint8)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)

    cv2.grabCut(img_bgr, mask, rect, bgd, fgd, iterCount=5, mode=cv2.GC_INIT_WITH_RECT)

    return np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)


def extract_color(img_rgb: np.ndarray, max_size: int = 300) -> tuple[str, tuple[int, int, int]]:
    """
    Extract the dominant color name and RGB value from a garment image.

    Args:
        img_rgb: H×W×3 numpy array in RGB.
        max_size: Resize longest edge to this before GrabCut (speed).

    Returns:
        (color_name, (r, g, b))
    """
    # Downscale for speed
    h, w = img_rgb.shape[:2]
    if max(h, w) > max_size:
        scale = max_size / max(h, w)
        img_rgb = cv2.resize(img_rgb, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    fg_mask = _grabcut_mask(img_rgb)
    fg_pixels = img_rgb[fg_mask == 255].astype(float)

    # Fallback: center crop if mask too sparse (< 1% of image)
    if len(fg_pixels) < max(100, img_rgb.shape[0] * img_rgb.shape[1] * 0.01):
        cy, cx = img_rgb.shape[0] // 2, img_rgb.shape[1] // 2
        qh, qw = max(1, img_rgb.shape[0] // 4), max(1, img_rgb.shape[1] // 4)
        crop = img_rgb[cy - qh:cy + qh, cx - qw:cx + qw]
        fg_pixels = crop.reshape(-1, 3).astype(float)

    n_clusters = min(3, len(fg_pixels))
    km = KMeans(n_clusters=n_clusters, n_init=5, random_state=0).fit(fg_pixels)
    counts = np.bincount(km.labels_)
    dominant = km.cluster_centers_[np.argmax(counts)].astype(int)
    rgb = (int(dominant[0]), int(dominant[1]), int(dominant[2]))
    return _nearest_color(rgb), rgb
