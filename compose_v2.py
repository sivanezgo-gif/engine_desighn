"""
compose_v2.py — Gate 4c re-compose (inspiration-matched style) for Spa Ben Ami

BANNER 310x600:
  - BG: set_b (Floating in Water) — cover crop, NO full-image darken
  - Gradient: bottom 30% only → rgba(20,10,10,0) → rgba(20,10,10,0.65)
  - Top 70%: photo remains bright and visible
  - Text: "הבריחה המושלמת מחכה לך" — WHITE #FFFFFF, Frank Ruehl Bold, large, centered
  - Logo: top-center, 80% opacity
  - Border frame: 1.5px white at 85% opacity, inset 12px
  - NO white halo block behind text

HEADER 1366x200:
  - BG: set_b header — cover crop, bright
  - Gradient: very subtle dark only on left/right edges (16% each), center clear
  - Text: "ספא בן עמי · גליל עליון" — WHITE #FFFFFF, Frank Ruehl Regular, medium, centered
  - NO heavy tint

Fonts: C:/Windows/Fonts/FRANKB.TTF (bold), frank.ttf (regular)
"""

import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ─── Absolute Paths ──────────────────────────────────────────────────────────
BASE = r"C:\Users\sisuke\Downloads\לימודי אוטומציה\claude_workspace\graphic_desighn"
SESSION_DIR = os.path.join(BASE, "output", "spa-ben-ami-20260510-133633")
BG_BANNER   = os.path.join(SESSION_DIR, "backgrounds", "set_b_banner_1024x1984.png")
BG_HEADER   = os.path.join(SESSION_DIR, "backgrounds", "set_b_header_2304x800.png")
LOGO_PATH   = os.path.join(SESSION_DIR, "logo", "logo_original.png")
OUT_BANNER  = os.path.join(SESSION_DIR, "final", "banner_310x600.png")
OUT_HEADER  = os.path.join(SESSION_DIR, "final", "header_1366x200.png")
FONT_BOLD   = r"C:\Windows\Fonts\FRANKB.TTF"
FONT_REG    = r"C:\Windows\Fonts\frank.ttf"

# ─── Design tokens ───────────────────────────────────────────────────────────
WHITE       = (255, 255, 255, 255)
WHITE_RGB   = (255, 255, 255)
GRAD_COLOR  = (20,  10,  10)          # dark warm near-black

# ─── Output dimensions ────────────────────────────────────────────────────────
BANNER_W, BANNER_H = 310, 600
HEADER_W, HEADER_H = 1366, 200


# ─── Helpers ─────────────────────────────────────────────────────────────────

def resize_cover(img: Image.Image, tw: int, th: int) -> Image.Image:
    """Scale image to cover target size, then center-crop."""
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2
    top  = (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except Exception as e:
        print(f"  [warn] font {path} sz{size}: {e}. Using default.")
        return ImageFont.load_default()


def measure_text(draw: ImageDraw.Draw, text: str, font) -> tuple:
    """Return (width, height) of text string."""
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def rtl_fix(text: str) -> str:
    """
    Fix Hebrew RTL rendering in Pillow (no libraqm).
    Pillow without libraqm renders characters left-to-right byte order,
    so Hebrew text appears reversed. Full string reversal corrects this
    for pure Hebrew / Hebrew+punctuation strings.
    """
    return text[::-1]


def draw_centered_text(draw: ImageDraw.Draw, text: str, font,
                        canvas_w: int, y: int,
                        fill=WHITE, shadow: bool = True,
                        is_rtl: bool = True):
    """Draw text horizontally centered at y (top of text), with optional drop shadow.
    Set is_rtl=True for Hebrew/Arabic text to apply RTL reversal fix."""
    if is_rtl:
        text = rtl_fix(text)
    tw, th = measure_text(draw, text, font)
    x = (canvas_w - tw) // 2
    if shadow:
        for dx, dy in [(-1, 2), (0, 2), (1, 2), (0, 3)]:
            draw.text((x + dx, y + dy), text, font=font, fill=(10, 5, 5, 100))
    draw.text((x, y), text, font=font, fill=fill)
    return tw, th


def fit_font_to_width(draw, text, font_path, max_w, start_size, min_size=16, is_rtl=True):
    """Find largest font size where text fits within max_w pixels.
    Applies RTL reversal before measuring for accurate Hebrew text width."""
    measure_text_str = rtl_fix(text) if is_rtl else text
    size = start_size
    while size >= min_size:
        font = load_font(font_path, size)
        tw, _ = measure_text(draw, measure_text_str, font)
        if tw <= max_w:
            return font, size
        size -= 2
    return load_font(font_path, min_size), min_size


def bottom_gradient_overlay(width: int, height: int, fraction: float = 0.30,
                              color=GRAD_COLOR, max_alpha: int = 166) -> Image.Image:
    """
    RGBA overlay: top (1-fraction) is fully transparent.
    Bottom fraction fades from alpha=0 to max_alpha.
    """
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    grad_start = int(height * (1.0 - fraction))
    r, g, b = color
    for y in range(grad_start, height):
        t = (y - grad_start) / max(height - 1 - grad_start, 1)
        a = int(t * max_alpha)
        arr[y, :] = [r, g, b, a]
    return Image.fromarray(arr, "RGBA")


def edge_gradient_overlay(width: int, height: int, edge_frac: float = 0.16,
                            color=GRAD_COLOR, max_alpha: int = 110) -> Image.Image:
    """RGBA overlay: dark edges (left+right), center transparent."""
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    edge_px = int(width * edge_frac)
    r, g, b = color
    for x in range(edge_px):
        t = 1.0 - (x / max(edge_px - 1, 1))
        a = int(t * max_alpha)
        arr[:, x]             = [r, g, b, a]   # left
        arr[:, width - 1 - x] = [r, g, b, a]   # right
    return Image.fromarray(arr, "RGBA")


def draw_inset_frame(canvas: Image.Image, inset: int = 12,
                      line_w: int = 2, opacity: int = 216) -> Image.Image:
    """Draw a thin white inset border frame. Returns new RGBA image."""
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    x0, y0 = inset, inset
    x1, y1 = canvas.width - inset - 1, canvas.height - inset - 1
    draw.rectangle([x0, y0, x1, y1], outline=(255, 255, 255, opacity), width=line_w)
    return Image.alpha_composite(canvas, overlay)


# ─── BANNER ──────────────────────────────────────────────────────────────────

def compose_banner() -> tuple:
    print("Composing banner 310x600...")

    bg = Image.open(BG_BANNER).convert("RGBA")
    canvas = resize_cover(bg, BANNER_W, BANNER_H)

    # Bottom 30% gradient: transparent → rgba(20,10,10,0.65)  [0.65*255≈166]
    grad = bottom_gradient_overlay(BANNER_W, BANNER_H, fraction=0.30, max_alpha=166)
    canvas = Image.alpha_composite(canvas, grad)

    # Logo — top center
    try:
        logo = Image.open(LOGO_PATH).convert("RGBA")
        logo_target_w = int(BANNER_W * 0.50)          # 155px
        ratio = logo.height / logo.width
        logo_h = int(logo_target_w * ratio)
        logo = logo.resize((logo_target_w, logo_h), Image.LANCZOS)
        # 80% opacity
        r, g, b, a = logo.split()
        a = a.point(lambda v: int(v * 0.80))
        logo.putalpha(a)
        lx = (BANNER_W - logo_target_w) // 2
        ly = 28
        canvas.paste(logo, (lx, ly), logo)
        print(f"  Logo: ({lx},{ly}) {logo_target_w}x{logo_h}")
    except Exception as e:
        print(f"  Logo skip: {e}")
        logo_h = 0

    # Headline text — WHITE, Frank Bold
    headline = "הבריחה המושלמת מחכה לך"
    max_text_w = int(BANNER_W * 0.88)           # 273px
    draw_tmp = ImageDraw.Draw(canvas)
    font, fsize = fit_font_to_width(draw_tmp, headline, FONT_BOLD, max_text_w,
                                    start_size=38, min_size=20)
    print(f"  Headline font size: {fsize}")

    # Place text center of the gradient zone (bottom 30%)
    grad_zone_top = int(BANNER_H * 0.70)
    _, th = measure_text(draw_tmp, headline, font)
    text_y = grad_zone_top + (BANNER_H - grad_zone_top - th) // 2 - 6

    draw = ImageDraw.Draw(canvas)
    draw_centered_text(draw, headline, font, BANNER_W, text_y, fill=WHITE, shadow=True)

    # Thin white inset border frame: 1.5px → use 2px (nearest int), 85% opacity = 216
    canvas = draw_inset_frame(canvas, inset=12, line_w=2, opacity=216)

    out = canvas.convert("RGB")
    os.makedirs(os.path.dirname(OUT_BANNER), exist_ok=True)
    out.save(OUT_BANNER, "PNG")
    print(f"  Saved: {OUT_BANNER}  {out.size[0]}x{out.size[1]}")
    return out.size


# ─── HEADER ──────────────────────────────────────────────────────────────────

def compose_header() -> tuple:
    print("Composing header 1366x200...")

    bg = Image.open(BG_HEADER).convert("RGBA")
    canvas = resize_cover(bg, HEADER_W, HEADER_H)

    # Very subtle edge darkening — left/right 16%, center stays bright
    grad = edge_gradient_overlay(HEADER_W, HEADER_H, edge_frac=0.16, max_alpha=110)
    canvas = Image.alpha_composite(canvas, grad)

    # Text: "ספא בן עמי · גליל עליון" — single line, white, Frank Regular
    text = "ספא בן עמי · גליל עליון"
    max_text_w = int(HEADER_W * 0.55)           # 751px — keeps it elegant, not wall-to-wall
    draw_tmp = ImageDraw.Draw(canvas)
    font, fsize = fit_font_to_width(draw_tmp, text, FONT_REG, max_text_w,
                                    start_size=56, min_size=24)
    print(f"  Header text font size: {fsize}")

    _, th = measure_text(draw_tmp, text, font)
    text_y = (HEADER_H - th) // 2 - 4          # slightly above exact center

    draw = ImageDraw.Draw(canvas)
    draw_centered_text(draw, text, font, HEADER_W, text_y, fill=WHITE, shadow=True)

    out = canvas.convert("RGB")
    os.makedirs(os.path.dirname(OUT_HEADER), exist_ok=True)
    out.save(OUT_HEADER, "PNG")
    print(f"  Saved: {OUT_HEADER}  {out.size[0]}x{out.size[1]}")
    return out.size


# ─── MAIN ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    banner_sz = compose_banner()
    header_sz = compose_header()

    print("\n=== COMPOSE COMPLETE ===")
    print(f"banner : {banner_sz[0]}x{banner_sz[1]}  → {OUT_BANNER}")
    print(f"header : {header_sz[0]}x{header_sz[1]}  → {OUT_HEADER}")

    assert banner_sz == (BANNER_W, BANNER_H), f"FAIL banner size {banner_sz}"
    assert header_sz == (HEADER_W, HEADER_H), f"FAIL header size {header_sz}"
    print("Dimension assertions PASSED.")
