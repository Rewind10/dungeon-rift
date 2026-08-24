#!/usr/bin/env python3
"""Anteprima v1.46: Bruto (camminata calma, niente tremore) + Melma top-down (pozza fluo che striscia)."""
import json, math, os
from PIL import Image, ImageDraw, ImageFilter
S = math.sin; TAU = 2 * math.pi; PI = math.pi
def bump(x, c, w): return max(0.0, 1 - abs(x - c) / w)

# ---------- BRUTO ----------
BD = '/home/claude/dr/public/assets/enemies/brute'
bman = json.load(open(os.path.join(BD, 'brute.json')))
bparts = {p['name']: p for p in bman['parts']}
bimgs = {p['name']: Image.open(os.path.join(BD, p['name'] + '.png')).convert('RGBA') for p in bman['parts']}
BORDER = ['legR', 'legL', 'torso', 'armR', 'armL', 'head']
W = dict(cad=0.9, leg=30, lift=18, armSwing=14, torso=3, head=1.5, bob=9, sway=4.5, lean=6)

def bpose(ph, atk):
    P = {n: [0.0, 0.0, 0.0] for n in bparts}; bob = 0; lungeX = 0; tilt = 0
    s2 = S(TAU * ph); c2 = S(TAU * ph + PI)
    bob = -W['bob'] * 0.5 + W['bob'] * abs(s2); lat = W['sway'] * s2
    liftR = -W['lift'] * (0.5 - 0.5 * math.cos(TAU * ph)); liftL = -W['lift'] * (0.5 - 0.5 * math.cos(TAU * ph + PI))
    P['legR'] = [W['leg'] * s2, 0, liftR]; P['legL'] = [W['leg'] * c2, 0, liftL]
    P['armR'] = [W['armSwing'] * s2, 0, 0]; P['armL'] = [W['armSwing'] * s2, 0, 0]
    P['torso'] = [W['torso'] * s2, lat, 0]; P['head'] = [-W['head'] * s2, lat * 0.6, 0]; tilt = W['lean']
    return P, bob, lungeX, tilt

def bframe(ph, Wd=320, Hd=400, label=''):
    cv = Image.new('RGBA', (Wd, Hd), (12, 14, 18, 255)); K = 250.0 / bman['charH']; OX = bman['originX']; OY0 = 760
    cx, cy = Wd // 2, int(Hd * 0.52); rvis = 30.0
    au = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); da = ImageDraw.Draw(au)
    for rr, al in [(130, 20), (95, 26), (60, 32)]:
        da.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(255, 170, 70, al))
    cv.alpha_composite(au.filter(ImageFilter.GaussianBlur(20)))
    P, bob, lungeX, tilt = bpose(ph, 0)
    fy = (bman['feetY'] - OY0) * K
    sh = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    ds.ellipse([cx - rvis * 0.8, cy + fy - 8, cx + rvis * 0.8, cy + fy + 8], fill=(0, 0, 0, 140)); cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4)))
    for n in BORDER:
        p = bparts[n]; im0 = bimgs[n]; rot, dx, dy = P[n]; extra = tilt if n in ('torso', 'head') else tilt * 0.4
        w = max(1, round(im0.width / 0.5 * K)); h = max(1, round(im0.height / 0.5 * K)); part = im0.resize((w, h), Image.LANCZOS)
        oxL = p['ox'] / 0.5 * K; oyL = p['oy'] / 0.5 * K
        pad = Image.new('RGBA', (w * 3, h * 3), (0, 0, 0, 0)); pad.alpha_composite(part, (int(w * 1.5 - oxL), int(h * 1.5 - oyL)))
        pr = pad.rotate(-(rot + extra), resample=Image.BICUBIC, center=(w * 1.5, h * 1.5))
        ax = (p['ax'] + dx + lungeX - OX) * K + cx; ay = (p['ay'] + dy + bob - OY0) * K + cy
        cv.alpha_composite(pr, (int(ax - w * 1.5), int(ay - h * 1.5)))
    dr = ImageDraw.Draw(cv); htr = P['head']
    for (exx, eyy) in bman['eyes']:
        wx = (exx - OX) * K + cx; wy = (eyy - OY0 + bob + htr[2]) * K + cy
        for rr, al in [(9, 90), (5, 170), (3, 255)]: dr.ellipse([wx - rr, wy - rr, wx + rr, wy + rr], fill=(255, 190, 90, al))
    if label: dr.text((8, Hd - 18), label, fill=(230, 210, 180, 255))
    return cv

# ---------- MELMA TOP-DOWN ----------
SD = '/home/claude/dr/public/assets/enemies/slime'
sbody = Image.open(os.path.join(SD, 'body.png')).convert('RGBA')
GC = (166, 255, 58)

def sframe(t, moving, atk, Wd=320, Hd=400, label=''):
    cv = Image.new('RGBA', (Wd, Hd), (12, 16, 14, 255)); cx, cy = Wd // 2, Hd // 2
    r = 46.0
    swing = S((atk) * PI)
    base = (r * 2.7) / max(sbody.width, sbody.height)
    w1 = 0.06 * S(t * 1.8)
    sx = base * (1 + w1); sy = base * (1 - w1 * 0.85)
    sx *= (1 + swing * 0.16); sy *= (1 + swing * 0.16)
    if moving: sx *= 1.12; sy *= 0.94
    nw, nh = max(1, int(sbody.width * sx)), max(1, int(sbody.height * sy))
    part = sbody.resize((nw, nh), Image.LANCZOS)
    rot = 0.06 * S(t * 0.9) + (0.12 if moving else 0)
    part = part.rotate(math.degrees(-rot), resample=Image.BICUBIC, expand=True)
    cv.alpha_composite(part, (int(cx - part.width / 2), int(cy - part.height / 2)))
    glow = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); dg = ImageDraw.Draw(glow)
    pr = 0.12 + 0.06 * S(t * 3) + swing * 0.18
    for rr, al in [(int(r * 1.28), int(120 * pr * 4)), (int(r * 1.05), int(90 * pr * 4))]:
        dg.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(*GC, min(255, al)), width=6)
    cv.alpha_composite(glow.filter(ImageFilter.GaussianBlur(6)))
    if atk > 0.4:
        d = ImageDraw.Draw(cv)
        for k in range(7):
            aa = -0.5 + k * 0.18; dx = math.cos(aa) * (46 + k * 6); dy = math.sin(aa) * 22 - 6
            d.ellipse([cx + dx - 3, cy + dy - 3, cx + dx + 3, cy + dy + 3], fill=(166, 255, 58, 220))
    d = ImageDraw.Draw(cv)
    if label: d.text((8, Hd - 18), label, fill=(210, 230, 200, 255))
    return cv

cells = [
    (bframe(0.0, label='BRUTO passo 0'), 0),
    (bframe(0.25, label='BRUTO 1/4 (piede su)'), 0),
    (bframe(0.5, label='BRUTO 1/2'), 0),
    (bframe(0.75, label='BRUTO 3/4 (altro piede)'), 0),
    (sframe(0.4, False, 0, label='MELMA idle (pozza)'), 1),
    (sframe(0.2, True, 0, label='MELMA striscia'), 1),
    (sframe(0.0, False, 0.66, label='MELMA sputo acido'), 1),
]
scale = 1.15; cw, ch = int(320 * scale), int(400 * scale); cols = 4; rows = 2; G = 10
Wt = cols * cw + (cols + 1) * G; Ht = rows * ch + (rows + 1) * G
out = Image.new('RGB', (Wt, Ht), (8, 9, 13))
for i, (c, _) in enumerate(cells):
    cc = c.resize((cw, ch), Image.LANCZOS); r2 = i // cols; col = i % cols
    out.paste(cc.convert('RGB'), (G + col * (cw + G), G + r2 * (ch + G)))
out.save('/mnt/user-data/outputs/v146_preview.png'); print('ok', out.size)
