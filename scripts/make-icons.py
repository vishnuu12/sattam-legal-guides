"""Generate PWA icons (green rounded square with a white scales symbol)."""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'icons')
os.makedirs(OUT, exist_ok=True)

BRAND = (14, 77, 58, 255)
GOLD = (232, 163, 61, 255)
WHITE = (255, 255, 255, 255)


def rounded(size, radius, fill):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=fill)
    return img


def draw_scales(img, scale, cx, cy):
    """Draw a simple balance scale centred at (cx, cy) with the given scale factor."""
    d = ImageDraw.Draw(img)
    w = max(2, int(16 * scale))
    pole_top = cy - int(150 * scale)
    pole_bot = cy + int(150 * scale)
    # pole
    d.line([(cx, pole_top), (cx, pole_bot)], fill=WHITE, width=w)
    # base
    d.line([(cx - int(80 * scale), pole_bot), (cx + int(80 * scale), pole_bot)], fill=WHITE, width=w)
    d.polygon([(cx, pole_bot + int(40 * scale)), (cx - int(34 * scale), pole_bot),
               (cx + int(34 * scale), pole_bot)], fill=WHITE)
    # beam
    beam_y = pole_top + int(20 * scale)
    d.line([(cx - int(130 * scale), beam_y), (cx + int(130 * scale), beam_y)], fill=WHITE, width=w)
    # pans
    pan_y = beam_y + int(110 * scale)
    pan_w = int(62 * scale)
    for side in (-1, 1):
        px = cx + side * int(130 * scale)
        d.line([(px, beam_y), (px, pan_y)], fill=WHITE, width=max(2, int(8 * scale)))
        d.arc([px - pan_w, pan_y - int(26 * scale), px + pan_w, pan_y + int(40 * scale)],
              0, 180, fill=WHITE, width=max(2, int(10 * scale)))
    # top knob
    d.ellipse([cx - int(16 * scale), pole_top - int(16 * scale),
               cx + int(16 * scale), pole_top + int(16 * scale)], fill=GOLD)


# standard icons
for size in (192, 512):
    img = rounded(size, int(size * 0.22), BRAND)
    draw_scales(img, size / 512.0, size / 2, size / 2 + int(size * 0.02))
    img.save(os.path.join(OUT, f'icon-{size}.png'))

# maskable icon: full-bleed background, symbol inside the safe zone (~80%)
size = 512
img = Image.new('RGBA', (size, size), BRAND)
draw_scales(img, 0.62, size / 2, size / 2)
img.save(os.path.join(OUT, 'icon-maskable-512.png'))

print('icons written to', os.path.normpath(OUT))
for f in sorted(os.listdir(OUT)):
    print(' ', f, os.path.getsize(os.path.join(OUT, f)), 'bytes')
