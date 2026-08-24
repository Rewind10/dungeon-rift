#!/usr/bin/env python3
"""Anteprima del BEHOLDER raster puppet: corpo ritagliato + iride che segue + eyestalks che avvampano
nel colore dello sguardo attivo + edge-glow. Rispecchia _beholderPuppet in renderer.js."""
import json, math, os
from PIL import Image, ImageDraw, ImageFilter
S = math.sin; PI = math.pi
ROOT = open('/home/claude/dr49/root.txt').read().strip()
D = os.path.join(ROOT, 'public/assets/enemies/beholder')
man = json.load(open(os.path.join(D, 'beholder.json')))
body = Image.open(os.path.join(D, 'body.png')).convert('RGBA')
GAZE = {'weaken': (255, 122, 90), 'slow': (90, 208, 255), 'sunder': (196, 140, 255), 'magenta': (255, 90, 208)}

def frame(t, facing, moving, atk, gk, W=300, H=360, label=''):
    cv = Image.new('RGBA', (W, H), (13, 11, 18, 255)); cx, cy = W // 2, H // 2
    r = 44.0; gc = GAZE.get(gk, GAZE['magenta']); swing = S((atk) * PI)
    base = (2.6 * r) / max(body.width, body.height)
    breath = 0.03 * S(t * 1.7); sx = base * (1 + breath); sy = base * (1 - breath)
    bob = -3 * S(t * 1.7) - swing * r * 0.06
    # aura back
    au = Image.new('RGBA', (W, H), (0, 0, 0, 0)); da = ImageDraw.Draw(au)
    for rr, al in [(120, 40), (85, 54), (55, 66)]:
        da.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(*gc, al))
    cv.alpha_composite(au.filter(ImageFilter.GaussianBlur(20)))
    # shadow
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    ds.ellipse([cx - r * 0.72, cy + r * 1.02 - r * 0.2, cx + r * 0.72, cy + r * 1.02 + r * 0.2], fill=(0, 0, 0, 90))
    cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    # body raster
    nw, nh = max(1, int(body.width * sx)), max(1, int(body.height * sy))
    part = body.resize((nw, nh), Image.LANCZOS)
    cv.alpha_composite(part, (int(cx - nw / 2), int(cy - nh / 2 + bob)))
    d = ImageDraw.Draw(cv)
    # central iris follow + dilating pupil
    coff_x = (man['core'][0] - man['centerX']) * base
    coff_y = (man['core'][1] - man['centerY']) * base + bob
    look = 0.16 * r; fx = math.cos(facing) * look; fy = math.sin(facing) * look
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dg = ImageDraw.Draw(glow)
    irisR = r * (0.42 + swing * 0.06)
    for rr, al in [(irisR, 120), (irisR * 0.6, 150)]:
        dg.ellipse([cx + coff_x + fx * 0.4 - rr, cy + coff_y + fy * 0.4 - rr, cx + coff_x + fx * 0.4 + rr, cy + coff_y + fy * 0.4 + rr], fill=(*gc, al))
    cv.alpha_composite(glow.filter(ImageFilter.GaussianBlur(3)))
    pupR = r * (0.14 + swing * 0.16)
    d.ellipse([cx + coff_x + fx - pupR, cy + coff_y + fy - pupR, cx + coff_x + fx + pupR, cy + coff_y + fy + pupR], fill=(8, 3, 8, 255))
    # eyestalk crown glows
    eg = Image.new('RGBA', (W, H), (0, 0, 0, 0)); de = ImageDraw.Draw(eg)
    NST = 7; act = 0.6 + 0.4 * S(t * 4) + (0.2 if moving else 0) + swing * 0.5
    for i in range(NST):
        a = -PI * 0.5 + (i - (NST - 1) / 2) * 0.42
        rr = r * 1.02; ex = cx + math.cos(a) * rr; ey = cy + math.sin(a) * rr * 1.02 - r * 0.28 + bob
        R0 = r * 0.16 * (0.8 + 0.5 * S(t * 5 + i))
        for k, al in [(R0 * 2.0, int(120 * act)), (R0, int(200 * act))]:
            de.ellipse([ex - k, ey - k, ex + k, ey + k], fill=(*gc, min(255, al)))
        de.ellipse([ex - R0 * 0.42, ey - R0 * 0.42, ex + R0 * 0.42, ey + R0 * 0.42], fill=(255, 240, 251, 255))
    cv.alpha_composite(eg.filter(ImageFilter.GaussianBlur(2)))
    if label:
        d.text((8, H - 18), label, fill=(220, 210, 225, 255))
    return cv

cells = [
    frame(0.2, -0.6, False, 0, 'magenta', label='IDLE'),
    frame(0.6, 0.0, True, 0, 'magenta', label='MOVIMENTO'),
    frame(0.0, 0.4, False, 0.62, 'magenta', label='ATTACCO (pupilla dilata)'),
    frame(0.3, 2.4, True, 0, 'slow', label='SGUARDO slow (blu)'),
    frame(0.3, 2.0, True, 0, 'sunder', label='SGUARDO sunder (viola)'),
    frame(0.3, -1.2, True, 0, 'weaken', label='SGUARDO weaken (ambra)'),
]
scale = 1.25; cw, ch = int(300 * scale), int(360 * scale); cols = 3; rows = 2; G = 10
Wt = cols * cw + (cols + 1) * G; Ht = rows * ch + (rows + 1) * G
out = Image.new('RGB', (Wt, Ht), (8, 7, 12))
for i, c in enumerate(cells):
    cc = c.resize((cw, ch), Image.LANCZOS); rr, col = i // cols, i % cols
    out.paste(cc.convert('RGB'), (G + col * (cw + G), G + rr * (ch + G)))
out.save('/mnt/user-data/outputs/_beholder_preview.png'); print('ok', out.size)
