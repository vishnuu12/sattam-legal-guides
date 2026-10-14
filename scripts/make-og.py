"""Generate social preview (Open Graph) images for the Sattam site.

Writes one default card and one card per guide into src/assets/og/.
The build copies that folder into the site.
"""
import json
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'src', 'assets', 'og')
FONT_TA = os.path.join(ROOT, 'src', 'assets', 'fonts', 'NotoSansTamil.ttf')
FONT_EN = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_EN_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

W, H = 1200, 630
GREEN_TOP = (14, 77, 58)
GREEN_BOT = (8, 42, 32)
GOLD = (232, 163, 61)
WHITE = (255, 255, 255)
SOFT = (198, 222, 208)

os.makedirs(OUT, exist_ok=True)


def font(path, size):
    return ImageFont.truetype(path, size)


def gradient():
    img = Image.new('RGB', (W, H), GREEN_TOP)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        c = tuple(int(GREEN_TOP[i] + (GREEN_BOT[i] - GREEN_TOP[i]) * t) for i in range(3))
        d.line([(0, y), (W, y)], fill=c)
    return img


def wrap(draw, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if draw.textlength(trial, font=fnt) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def card(ta_title, en_title, kicker):
    img = gradient()
    d = ImageDraw.Draw(img)
    # gold bar on the left
    d.rectangle([0, 0, 14, H], fill=GOLD)
    x = 76
    max_w = W - x - 76

    y = 84
    if kicker:
        fk = font(FONT_TA, 34)
        d.text((x, y), kicker, font=fk, fill=GOLD)
        y += 58

    ft = font(FONT_TA, 62)
    lines = wrap(d, ta_title, ft, max_w)[:3]
    for ln in lines:
        d.text((x, y), ln, font=ft, fill=WHITE)
        y += 78

    y += 12
    fe = font(FONT_EN_B, 32)
    elines = wrap(d, en_title, fe, max_w)[:2]
    for ln in elines:
        d.text((x, y), ln, font=fe, fill=SOFT)
        y += 44

    # brand line at the bottom
    fb = font(FONT_TA, 36)
    d.text((x, H - 92), '\u0b9a\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', font=fb, fill=GOLD)
    fe2 = font(FONT_EN, 26)
    d.text((x + 190, H - 84), 'Sattam \u00b7 free legal guides in Tamil & English', font=fe2, fill=SOFT)
    d.rectangle([x, H - 40, W - 76, H - 36], fill=(255, 255, 255, 40))
    return img


def main():
    made = []

    # default card
    img = card(
        '\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b89\u0bb0\u0bbf\u0bae\u0bc8\u0b95\u0bb3\u0bcd, \u0b8e\u0bb3\u0bbf\u0baf \u0ba4\u0bae\u0bbf\u0bb4\u0bbf\u0bb2\u0bcd',
        'Everyday Indian law, line by line in Tamil and English',
        '\u0b9a\u0b9f\u0bcd\u0b9f\u0bae\u0bcd \u00b7 Sattam')
    img.save(os.path.join(OUT, 'og-default.png'))
    made.append('og-default.png')

    content_dir = os.path.join(ROOT, 'content')
    for name in sorted(os.listdir(os.path.join(content_dir, 'ta'))):
        if not name.endswith('.json'):
            continue
        slug = name[:-5]
        ta = json.load(open(os.path.join(content_dir, 'ta', name), encoding='utf-8'))
        en_path = os.path.join(content_dir, 'en', name)
        en = json.load(open(en_path, encoding='utf-8')) if os.path.exists(en_path) else {}
        cat = (ta.get('category') or '').replace('-', ' ')
        img = card(ta.get('title', slug), en.get('title', ''), cat)
        img.save(os.path.join(OUT, 'og-' + slug + '.png'))
        made.append('og-' + slug + '.png')

    print('wrote', len(made), 'og images to', os.path.normpath(OUT))


if __name__ == '__main__':
    main()
