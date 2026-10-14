"""Generate a printable A4 poster and a plain QR code for the Sattam site."""
import os
from PIL import Image, ImageDraw, ImageFont
import segno

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'src', 'assets', 'posters')
FONT_TA = os.path.join(ROOT, 'src', 'assets', 'fonts', 'NotoSansTamil.ttf')
FONT_EN = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_EN_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
URL = 'https://vishnuu12.github.io/sattam-static-site/'

os.makedirs(OUT, exist_ok=True)
GREEN = (14, 77, 58)
GREEN_D = (8, 42, 32)
GOLD = (201, 118, 27)
INK = (20, 33, 28)
SOFT = (95, 108, 102)
WHITE = (255, 255, 255)


def f(path, size):
    return ImageFont.truetype(path, size)


def centre(d, y, text, font, fill, W):
    w = d.textlength(text, font=font)
    d.text(((W - w) / 2, y), text, font=font, fill=fill)


def main():
    # ---------- plain QR ----------
    qr = segno.make(URL, error='m')
    qr.save(os.path.join(OUT, 'qr.png'), scale=12, border=2, dark='#0e4d3a', light='#ffffff')

    # ---------- A4 poster at 150 dpi ----------
    W, H = 1240, 1754
    img = Image.new('RGB', (W, H), WHITE)
    d = ImageDraw.Draw(img)

    # border
    d.rectangle([0, 0, W, 26], fill=GREEN)
    d.rectangle([0, H - 26, W, H], fill=GOLD)
    d.rectangle([46, 60, W - 46, H - 60], outline=GREEN, width=4)

    y = 120
    centre(d, y, '\u0b9a\u0b9f\u0bcd\u0b9f\u0bae\u0bcd', f(FONT_TA, 92), GREEN, W)
    y += 118
    centre(d, y, 'Sattam', f(FONT_EN_B, 54), GOLD, W)
    y += 92
    centre(d, y, '\u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b89\u0bb0\u0bbf\u0bae\u0bc8\u0b95\u0bb3\u0bc8 \u0b85\u0bb1\u0bbf\u0baf\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd', f(FONT_TA, 58), INK, W)
    y += 78
    centre(d, y, 'Know your rights, in simple Tamil and English', f(FONT_EN, 32), SOFT, W)

    # QR in a framed panel
    q = Image.open(os.path.join(OUT, 'qr.png')).convert('RGB')
    qw = 520
    q = q.resize((qw, qw), Image.NEAREST)
    qx, qy = (W - qw) // 2, 470
    d.rectangle([qx - 26, qy - 26, qx + qw + 26, qy + qw + 26], fill=WHITE, outline=GREEN, width=5)
    img.paste(q, (qx, qy))

    y = qy + qw + 46
    centre(d, y, '\u0b87\u0ba8\u0bcd\u0ba4 QR code-\u0b90 scan \u0b9a\u0bc6\u0baf\u0bcd\u0baf\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd', f(FONT_TA, 48), GREEN, W)
    y += 66
    centre(d, y, 'Scan this code with your phone camera', f(FONT_EN, 30), SOFT, W)
    y += 62
    centre(d, y, 'vishnuu12.github.io/sattam-static-site', f(FONT_EN_B, 30), GOLD, W)

    # topic strip
    y += 76
    d.line([120, y, W - 120, y], fill=(220, 220, 214), width=2)
    y += 40
    topics = [
        '\u0b95\u0bbe\u0bb5\u0bb2\u0bcd \u00b7 \u0b9f\u0bcd\u0bb0\u0bbe\u0b83\u0baa\u0bbf\u0b95\u0bcd \u00b7 \u0b9a\u0bc8\u0baa\u0bb0\u0bcd \u0bae\u0bcb\u0b9a\u0b9f\u0bbf',
        '\u0b9a\u0bae\u0bcd\u0baa\u0bb3\u0bae\u0bcd \u00b7 \u0bb5\u0bbe\u0b9f\u0b95\u0bc8 \u00b7 \u0ba8\u0bc1\u0b95\u0bb0\u0bcd\u0bb5\u0bcb\u0bb0\u0bcd \u00b7 \u0bb5\u0b99\u0bcd\u0b95\u0bbf',
        '\u0b85\u0bb5\u0b9a\u0bb0 \u0b89\u0ba4\u0bb5\u0bbf \u0b8e\u0ba3\u0bcd\u0b95\u0bb3\u0bcd \u00b7 \u0b87\u0bb2\u0bb5\u0b9a \u0b9a\u0b9f\u0bcd\u0b9f \u0b89\u0ba4\u0bb5\u0bbf',
    ]
    for t in topics:
        centre(d, y, t, f(FONT_TA, 36), INK, W)
        y += 52

    centre(d, H - 170, '\u0b87\u0ba4\u0bc1 \u0b87\u0bb2\u0bb5\u0b9a\u0bae\u0bcd \u00b7 \u0baa\u0bca\u0ba4\u0bc1\u0bb5\u0bbe\u0ba9 \u0b9a\u0b9f\u0bcd\u0b9f\u0ba4\u0bcd \u0ba4\u0b95\u0bb5\u0bb2\u0bcd', f(FONT_TA, 40), GREEN, W)
    centre(d, H - 112, 'Free \u00b7 general legal information \u00b7 not legal advice', f(FONT_EN, 28), SOFT, W)

    img.save(os.path.join(OUT, 'poster-a4.png'))
    print('wrote poster-a4.png and qr.png to', os.path.normpath(OUT))


if __name__ == '__main__':
    main()
