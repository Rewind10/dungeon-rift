#!/usr/bin/env python3
"""Anteprima del Troll sprite-sheet come lo rende il gioco: idle, camminata (mirror L/R) e attacco (martellata)."""
import json, os
from PIL import Image, ImageDraw, ImageFilter
D = '/home/claude/dr/public/assets/enemies/troll_sheet'
man = json.load(open(os.path.join(D, 'troll.json')))
cell, cols = man['cell'], man['cols']
imgs = {k: Image.open(os.path.join(D, man['anims'][k]['file'])).convert('RGBA') for k in man['anims']}

def cellimg(anim, fi):
    c, r = fi % cols, fi // cols
    return imgs[anim].crop((c*cell, r*cell, (c+1)*cell, (r+1)*cell))

def draw(anim, fi, flip=False, W=230, H=270, label=''):
    A = man['anims'][anim]
    cv = Image.new('RGBA', (W, H), (14, 15, 20, 255))
    r = 42.0
    s = (2.9 * r) / man['charH']
    im = cellimg(anim, fi)
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    dw = int(cell * s)
    im = im.resize((dw, dw), Image.LANCZOS)
    cx, cy = W // 2, int(H * 0.84)
    ax = A['ax'] if not flip else (cell - A['ax'])
    ox = int(cx - ax * s); oy = int(cy - A['ay'] * s)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    ds.ellipse([cx - r*0.7, cy - 6, cx + r*0.7, cy + 6], fill=(0, 0, 0, 130))
    cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(3)))
    cv.alpha_composite(im, (ox, oy))
    d = ImageDraw.Draw(cv)
    if label: d.text((6, H - 16), label, fill=(230, 210, 180, 255))
    return cv

cells = [
    draw('idle', 0, label='IDLE'),
    draw('walk', 0, label='WALK f0'),
    draw('walk', 6, label='WALK f6'),
    draw('walk', 12, label='WALK f12'),
    draw('walk', 6, flip=True, label='WALK mirror'),
    draw('attack', 0, label='ATTACK f0'),
    draw('attack', 12, label='ATTACK f12'),
    draw('attack', 18, label='ATTACK f18 (colpo)'),
]
cols_out = 4; rows_out = 2; G = 8; cw, ch = 230, 270
out = Image.new('RGB', (cols_out*cw + (cols_out+1)*G, rows_out*ch + (rows_out+1)*G), (8, 9, 13))
for i, c in enumerate(cells):
    rr, cc = i // cols_out, i % cols_out
    out.paste(c.convert('RGB'), (G + cc*(cw+G), G + rr*(ch+G)))
out.save('/mnt/user-data/outputs/troll_sheet_preview.png'); print('ok', out.size)
