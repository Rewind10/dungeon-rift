#!/usr/bin/env python3
"""Anteprima v1.44: Melma Corrosiva — squash&stretch (idle/salto/attacco) + aura verde + nucleo pulsante.
Rispecchia PROF.slime in renderer.js."""
import json, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
S = math.sin; TAU = 2 * math.pi
def bump(x, c, w): return max(0.0, 1 - abs(x - c) / w)

D = '/home/claude/dr/public/assets/enemies/slime'
man = json.load(open(os.path.join(D, 'slime.json')))
body = Image.open(os.path.join(D, 'body.png')).convert('RGBA')
p = man['parts'][0]
SC = 0.5; EYE = (166, 255, 58)

def pose(state, t, atk):
    a = atk; wind = bump(a, 0.34, 0.30); strike = bump(a, 0.66, 0.26)
    bob = 0; lungeX = 0; sx = 1; sy = 1
    if state == 'walk':
        ph = (t * 1.5) % 1; hopY = abs(S(TAU * ph)); flat = 1 - hopY
        bob = -26 * hopY; sx = 1 + 0.18 * flat - 0.12 * hopY; sy = 1 - 0.22 * flat + 0.16 * hopY; lungeX = 7 * S(TAU * ph)
    else:
        j = S(TAU * (t * 0.9)); sx = 1 + 0.05 * j; sy = 1 - 0.05 * j; bob = 2 * S(TAU * (t * 0.9) + 1)
    if a > 0.001:
        sx += 0.24 * wind - 0.12 * strike; sy += -0.26 * wind + 0.20 * strike; bob += -8 * strike; lungeX += 26 * strike
    return bob, lungeX, sx, sy, max(wind * 0.5, strike)

def frame(state, t, atk, W=300, H=360, label=''):
    cv = Image.new('RGBA', (W, H), (12, 16, 14, 255))
    K = 240.0 / man['charH']; OX = man['originX']; OY0 = 706
    cx, cy = W // 2, int(H * 0.52); rvis = 30.0
    bob, lungeX, sx, sy, swing = pose(state, t, atk)
    # green aura (pulsing)
    au = Image.new('RGBA', (W, H), (0, 0, 0, 0)); da = ImageDraw.Draw(au)
    pr = 0.8 + 0.2 * S(t * 3)
    for rr, al in [(120, int(46 * pr)), (85, int(60 * pr)), (55, int(72 * pr))]:
        da.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(*EYE, al))
    cv.alpha_composite(au.filter(ImageFilter.GaussianBlur(20)))
    # ground shadow
    fy = (man['feetY'] - OY0) * K
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    ds.ellipse([cx - rvis * 0.72, cy + fy - 7, cx + rvis * 0.72, cy + fy + 7], fill=(0, 0, 0, 150))
    cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4)))
    # body with squash&stretch around feet line
    w = max(1, round(body.width / SC * K)); h = max(1, round(body.height / SC * K))
    part = body.resize((w, h), Image.LANCZOS)
    # scale sx,sy
    nw, nh = max(1, int(w * sx)), max(1, int(h * sy))
    part = part.resize((nw, nh), Image.LANCZOS)
    oxL = p['ox'] / SC * K * sx; oyL = p['oy'] / SC * K * sy
    ax = (p['ax'] + lungeX - OX) * K + cx; ay = (p['ay'] + bob - OY0) * K + cy
    cv.alpha_composite(part, (int(ax - oxL), int(ay - oyL)))
    # core glow + eyes
    dr = ImageDraw.Draw(cv)
    corex = (man['core'][0] - OX + lungeX) * K + cx; corey = (man['core'][1] - OY0 + bob) * K + cy - (1 - sy) * (p['oy'] / SC * K) * 0
    for rr, al in [(int(rvis * 1.4), 60), (int(rvis * 0.8), 110), (int(rvis * 0.28), 220)]:
        dr.ellipse([corex - rr, corey - rr, corex + rr, corey + rr], fill=(*EYE, al))
    for (ex, ey) in man['eyes']:
        wx = (ex - OX + lungeX) * K + cx; wy = (ey - OY0 + bob) * K + cy
        R = 8 + swing * 3
        for rr, al in [(R * 1.6, 80), (R, 160), (R * 0.5, 255)]:
            dr.ellipse([wx - rr, wy - rr, wx + rr, wy + rr], fill=(230, 255, 190, int(al)))
    if label: dr.text((8, H - 18), label, fill=(210, 230, 200, 255))
    return cv

cells = [
    frame('idle', 0.25, 0, label='IDLE (jiggle)'),
    frame('walk', 0.0, 0, label='SALTO: a terra'),
    frame('walk', 0.25, 0, label='SALTO: in aria'),
    frame('walk', 0.5, 0, label='SALTO: a terra'),
    frame('idle', 0.0, 0.34, label='ATTACCO carica'),
    frame('idle', 0.0, 0.66, label='ATTACCO schizzo'),
]
gap = 6
strip = Image.new('RGBA', (300 * len(cells) + gap * (len(cells) - 1), 360), (6, 9, 7, 255))
x = 0
for c in cells:
    strip.alpha_composite(c, (x, 0)); x += 300 + gap
strip.convert('RGB').save('/home/claude/slime_strip.png')
print('ok')
