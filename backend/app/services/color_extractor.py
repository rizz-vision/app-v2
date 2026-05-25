"""
Garment color extraction: GrabCut segmentation + KMeans dominant color.
Color naming uses HSL bucketing (lightness → saturation → hue) for accuracy.
Color harmony uses HSL hue-wheel geometry for compatibility scoring.
"""
import cv2
import numpy as np
from sklearn.cluster import KMeans

# ── Extended named palette (RGB anchor points) ─────────────────────────────────
# Ordered so that dark/light variants come before their mid-tone counterparts —
# the HSL bucketing below uses this only as a last-resort fallback.
_NAMED_COLORS = [
    # Achromatics — matched purely by lightness before hue
    ("black",        (15,  15,  15)),
    ("charcoal",     (54,  54,  54)),
    ("dark grey",    (80,  80,  80)),
    ("grey",         (128, 128, 128)),
    ("light grey",   (192, 192, 192)),
    ("off white",    (235, 230, 220)),
    ("white",        (250, 250, 250)),
    # Blues / navies
    ("navy",         (15,  25,  90)),
    ("dark navy",    (10,  15,  60)),
    ("midnight blue",(20,  30,  110)),
    ("royal blue",   (40,  80,  185)),
    ("blue",         (55,  110, 215)),
    ("sky blue",     (100, 170, 230)),
    ("light blue",   (160, 210, 240)),
    ("cobalt",       (30,  60,  170)),
    ("teal",         (20,  140, 140)),
    ("turquoise",    (50,  190, 190)),
    # Greens
    ("dark green",   (20,  80,  30)),
    ("olive",        (100, 110, 30)),
    ("khaki",        (165, 155, 90)),
    ("green",        (35,  160, 55)),
    ("mint",         (160, 220, 175)),
    ("sage",         (130, 160, 120)),
    # Reds / pinks
    ("burgundy",     (115, 20,  40)),
    ("maroon",       (90,  20,  30)),
    ("red",          (210, 30,  30)),
    ("coral",        (240, 105, 85)),
    ("salmon",       (240, 150, 120)),
    ("pink",         (235, 135, 170)),
    ("hot pink",     (240, 60,  140)),
    ("blush",        (240, 195, 195)),
    ("rose",         (215, 80,  110)),
    # Purples
    ("dark purple",  (75,  20,  100)),
    ("purple",       (125, 45,  165)),
    ("violet",       (145, 60,  190)),
    ("lavender",     (195, 165, 230)),
    ("mauve",        (185, 130, 160)),
    ("lilac",        (205, 170, 220)),
    # Yellows / oranges / browns
    ("mustard",      (200, 165, 30)),
    ("yellow",       (240, 220, 35)),
    ("gold",         (215, 175, 45)),
    ("orange",       (235, 115, 30)),
    ("rust",         (185, 75,  30)),
    ("burnt orange", (200, 90,  40)),
    ("tan",          (205, 170, 120)),
    ("camel",        (195, 145, 85)),
    ("beige",        (220, 200, 170)),
    ("sand",         (215, 195, 155)),
    ("brown",        (135, 80,  40)),
    ("dark brown",   (80,  45,  20)),
    ("chocolate",    (105, 55,  25)),
    # Whites / creams
    ("cream",        (250, 245, 220)),
    ("ivory",        (255, 250, 230)),
]

# ── HSL conversion ─────────────────────────────────────────────────────────────

def _rgb_to_hsl(r: int, g: int, b: int) -> tuple[float, float, float]:
    """Returns (hue 0-360, saturation 0-100, lightness 0-100)."""
    r_, g_, b_ = r / 255.0, g / 255.0, b / 255.0
    cmax, cmin = max(r_, g_, b_), min(r_, g_, b_)
    delta = cmax - cmin
    l = (cmax + cmin) / 2.0

    if delta == 0:
        h, s = 0.0, 0.0
    else:
        s = delta / (1 - abs(2 * l - 1))
        if cmax == r_:
            h = 60 * (((g_ - b_) / delta) % 6)
        elif cmax == g_:
            h = 60 * (((b_ - r_) / delta) + 2)
        else:
            h = 60 * (((r_ - g_) / delta) + 4)

    return h, s * 100, l * 100


def _nearest_color(rgb: tuple) -> str:
    """
    HSL-aware color naming:
      1. Achromatic check by saturation + lightness (handles all greys/blacks/whites/navies)
      2. Lightness buckets for very dark / very light shades
      3. Hue-wheel nearest-neighbor among chromatic colors
    """
    r, g, b = rgb
    h, s, l = _rgb_to_hsl(r, g, b)

    # Step 1 — achromatic: low saturation → grey/black/white family
    if s < 16:
        if l < 10:  return "black"
        if l < 22:  return "charcoal"
        if l < 38:  return "dark grey"
        if l < 58:  return "grey"
        if l < 78:  return "light grey"
        if l < 92:  return "off white"
        return "white"

    # Step 2 — near-achromatic blues (navy: hue 210-250, moderate saturation, dark)
    if 210 <= h <= 260 and s < 75 and l < 30:
        if l < 15: return "dark navy"
        return "navy"

    # Step 3 — very dark chromatic: use lightness-qualified names
    if l < 18:
        if 0   <= h < 30  or h >= 330: return "maroon"
        if 30  <= h < 75:              return "dark brown"
        if 75  <= h < 165:             return "dark green"
        if 165 <= h < 260:             return "dark navy"
        if 260 <= h < 330:             return "dark purple"

    # Step 4 — very light chromatic: pastel / light names
    if l > 82:
        if 0   <= h < 30  or h >= 330: return "blush"
        if 30  <= h < 75:              return "cream"
        if 75  <= h < 165:             return "mint"
        if 165 <= h < 260:             return "light blue"
        if 260 <= h < 330:             return "lavender"

    # Step 5 — chromatic mid-tones: hue-wheel nearest neighbor (Euclidean in HSL)
    best, best_d = "unknown", float("inf")
    for name, (nr, ng, nb) in _NAMED_COLORS:
        nh, ns, nl = _rgb_to_hsl(nr, ng, nb)
        # Weight hue difference on the circular wheel, down-weight lightness slightly
        hue_diff = min(abs(h - nh), 360 - abs(h - nh))
        d = (hue_diff * 1.2) ** 2 + (s - ns) ** 2 + (l - nl) ** 2
        if d < best_d:
            best_d, best = d, name
    return best


# ── Color harmony (HSL hue wheel) ─────────────────────────────────────────────

# Colors that pair with virtually everything
NEUTRAL_COLORS = {
    "black", "charcoal", "dark grey", "grey", "light grey",
    "off white", "white", "cream", "ivory",
    "navy", "dark navy", "midnight blue",
    "beige", "sand", "camel", "tan",
}

def _hue_of(color_name: str) -> float | None:
    """Return the hue (0-360) of a named color, or None if not in palette."""
    for name, (r, g, b) in _NAMED_COLORS:
        if name == color_name:
            h, s, _ = _rgb_to_hsl(r, g, b)
            return h if s >= 12 else None
    return None

def color_harmony(color_a: str, color_b: str) -> str:
    """
    Returns 'complementary' | 'analogous' | 'neutral' | 'clash' | 'unknown'
    based on hue-wheel geometry between two named colors.

    Complementary  : hues 150-210° apart  → strong contrast, intentional pairing
    Analogous      : hues 0-45° apart     → harmonious, safe
    Split-comp     : hues 120-150° apart  → works well (treated as 'analogous')
    Clash zone     : hues 46-119° apart   → typically clashes
    Neutral        : either color is a neutral → always compatible
    """
    if color_a in NEUTRAL_COLORS or color_b in NEUTRAL_COLORS:
        return "neutral"

    ha = _hue_of(color_a)
    hb = _hue_of(color_b)
    if ha is None or hb is None:
        return "unknown"

    diff = min(abs(ha - hb), 360 - abs(ha - hb))

    if diff <= 45:
        return "analogous"        # harmonious
    if 120 <= diff <= 210:
        return "complementary"    # intentional contrast — works
    # 46-119° and 211-255° are the clash zones
    return "clash"


# ── GrabCut segmentation ───────────────────────────────────────────────────────

def _grabcut_mask(img_rgb: np.ndarray) -> np.ndarray:
    """Returns a binary foreground mask (255=fg, 0=bg) using GrabCut."""
    h, w = img_rgb.shape[:2]
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

    mx, my = max(1, int(w * 0.10)), max(1, int(h * 0.10))
    rect = (mx, my, w - 2 * mx, h - 2 * my)

    mask = np.zeros((h, w), np.uint8)
    bgd  = np.zeros((1, 65), np.float64)
    fgd  = np.zeros((1, 65), np.float64)

    cv2.grabCut(img_bgr, mask, rect, bgd, fgd, iterCount=5, mode=cv2.GC_INIT_WITH_RECT)
    return np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)


# ── Public API ─────────────────────────────────────────────────────────────────

def extract_color(img_rgb: np.ndarray, max_size: int = 300) -> tuple[str, tuple[int, int, int]]:
    """
    Extract the dominant garment color name and its RGB value.

    Args:
        img_rgb: H×W×3 numpy array in RGB.
        max_size: Resize longest edge to this before processing (speed).

    Returns:
        (color_name, (r, g, b))
    """
    h, w = img_rgb.shape[:2]
    if max(h, w) > max_size:
        scale = max_size / max(h, w)
        img_rgb = cv2.resize(img_rgb, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    fg_mask   = _grabcut_mask(img_rgb)
    fg_pixels = img_rgb[fg_mask == 255].astype(float)

    # Fallback: center crop if GrabCut mask is too sparse
    if len(fg_pixels) < max(100, img_rgb.shape[0] * img_rgb.shape[1] * 0.01):
        cy, cx = img_rgb.shape[0] // 2, img_rgb.shape[1] // 2
        qh = max(1, img_rgb.shape[0] // 4)
        qw = max(1, img_rgb.shape[1] // 4)
        fg_pixels = img_rgb[cy - qh:cy + qh, cx - qw:cx + qw].reshape(-1, 3).astype(float)

    n_clusters = min(3, len(fg_pixels))
    km = KMeans(n_clusters=n_clusters, n_init=5, random_state=0).fit(fg_pixels)
    counts   = np.bincount(km.labels_)
    dominant = km.cluster_centers_[np.argmax(counts)].astype(int)
    rgb      = (int(dominant[0]), int(dominant[1]), int(dominant[2]))
    return _nearest_color(rgb), rgb
