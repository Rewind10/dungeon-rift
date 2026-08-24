#!/usr/bin/env python3
"""Confronto v1.47 (ombra generica troppo bassa = sembra fluttuare) vs v1.48 (ombra ai piedi)."""
import json, os
from PIL import Image, ImageDraw, ImageFilter
D = '/home/claude/dr/public/assets/enemies/troll_sheet'
man = json.load(open(os.path.join(D, 'troll.json')))
cell, cols = man['cell'], man['cols']
imgs = {k: Image.open(os.path.join(D, man['anims'][k]['file'])).convert('RGBA') for k in man['anims']}

def cellimg(anim, fi):
    c, r = fi % cols, fi // cols
    return imgs[anim].crop((c*cell, r*cell, (c+1)*cell, (r+1)*cell))

def draw(anim, fi, mode, W=250, H=300, label=''):
    A = man['anims'][anim]
    cv = Image.new('RGBA', (W, H), (16, 17, 22, 255))
    r = 40.0
    s = (2.9 * r) / man['charH']
    im = cellimg(anim, fi).resize((int(cell*s), int(cell*s)), Image.LANCZOS)
    cx, cy = W // 2, int(H * 0.80)   # ground point (feet)
    ox = int(cx - A['ax'] * s); oy = int(cy - A['ay'] * s)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    if mode == 'old':
        # generic shadow at y + rr*0.75 (below the feet) -> looks like floating
        ds.ellipse([cx - r*0.9, cy + r*0.75 - r*0.45, cx + r*0.9, cy + r*0.75 + r*0.45], fill=(0, 0, 0, 90))
    else:
        # v1.48 feet shadow at the feet (y=0)
        ds.ellipse([cx - r*0.72, cy - r*0.04 - r*0.24, cx + r*0.72, cy - r*0.04 + r*0.24], fill=(0, 0, 0, 110))
    cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4)))
    cv.alpha_composite(im, (ox, oy))
    # ground reference line
    d = ImageDraw.Draw(cv); d.line([(0, cy), (W, cy)], fill=(70, 80, 100, 120), width=1)
    d.text((6, H-16), label, fill=(230, 210, 180, 255))
    return cv

cells = [
    draw('idle', 0, 'old', label='v1.47 IDLE (ombra staccata)'),
    draw('walk', 6, 'old', label='v1.47 WALK (ombra staccata)'),
    draw('idle', 0, 'new', label='v1.48 IDLE (ombra ai piedi)'),
    draw('walk', 6, 'new', label='v1.48 WALK (ombra ai piedi)'),
]
G = 8; cw, ch = 250, 300
out = Image.new('RGB', (4*cw + 5*G, ch + 2*G), (8, 9, 13))
for i, c in enumerate(cells):
    out.paste(c.convert('RGB'), (G + i*(cw+G), G))
out.save('/mnt/user-data/outputs/troll_fix_preview.png'); print('ok', out.size)
