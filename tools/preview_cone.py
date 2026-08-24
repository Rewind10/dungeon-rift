#!/usr/bin/env python3
"""Confronto top-down della LARGHEZZA del cono visivo del Negromante + nota sulla velocità di rotazione."""
import math
from PIL import Image, ImageDraw, ImageFilter

def cone_cell(fov_half, turn, label, sub, W=360, H=360):
    im = Image.new('RGBA', (W, H), (14, 15, 22, 255))
    cx, cy = W // 2, H // 2 + 20
    rng = 150
    col = (160, 107, 255)
    # cone fill (facing = up, -90°)
    facing = -math.pi / 2
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dg = ImageDraw.Draw(glow)
    steps = 40
    pts = [(cx, cy)]
    for i in range(steps + 1):
        a = facing - fov_half + (2 * fov_half) * i / steps
        pts.append((cx + math.cos(a) * rng, cy + math.sin(a) * rng))
    dg.polygon(pts, fill=(*col, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(4))
    im.alpha_composite(glow)
    d = ImageDraw.Draw(im)
    # cone edges
    for s in (-1, 1):
        a = facing + s * fov_half
        d.line([(cx, cy), (cx + math.cos(a) * rng, cy + math.sin(a) * rng)], fill=(*col, 220), width=2)
    # arc
    d.arc([cx - rng, cy - rng, cx + rng, cy + rng],
          math.degrees(facing - fov_half), math.degrees(facing + fov_half), fill=(*col, 150), width=2)
    # mage body
    d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=(38, 39, 44, 255), outline=(90, 70, 130, 255))
    d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=col)
    # full angle label
    full = math.degrees(fov_half * 2)
    d.text((10, 8), label, fill=(230, 220, 245, 255))
    d.text((10, 26), f'cono totale {full:.0f}°  (fov {fov_half:.2f} rad)', fill=(190, 175, 210, 255))
    d.text((10, 44), sub, fill=(150, 200, 150, 255))
    # turn arrows (how fast head sweeps): draw dashed sweep
    degps = math.degrees(turn)
    d.text((10, H - 22), f'rotazione testa: {turn:.1f} rad/s  (~{degps:.0f}°/s)', fill=(255, 210, 120, 255))
    return im

cells = [
    cone_cell(0.45, 1.4, 'STRETTO', 'sguardo focalizzato · facile aggirare', ),
    cone_cell(0.55, 1.7, 'PROPOSTO (v1.40)', 'equilibrato · guardingo ma aggirabile'),
    cone_cell(0.62, 2.1, 'ATTUALE (v1.39)', 'più ampio · testa rapida'),
    cone_cell(0.85, 2.6, 'AMPIO', 'copre molto · difficile sfuggire'),
]
gap = 8
strip = Image.new('RGBA', (360 * len(cells) + gap * (len(cells) - 1), 360), (6, 7, 11, 255))
x = 0
for c in cells:
    strip.alpha_composite(c, (x, 0)); x += 360 + gap
strip.convert('RGB').save('/home/claude/cone_compare.png')
print('ok')
