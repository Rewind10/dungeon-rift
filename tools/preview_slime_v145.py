#!/usr/bin/env python3
"""Anteprima v1.45 Melma: STRISCIA (no salto in movimento) + SALTA/sputa nell'attacco. Occhi che si illuminano nel moto."""
import json, math, os
from PIL import Image, ImageDraw, ImageFilter
S = math.sin; TAU = 2 * math.pi
def bump(x, c, w): return max(0.0, 1 - abs(x - c) / w)
D = '/home/claude/dr/public/assets/enemies/slime'
man = json.load(open(os.path.join(D, 'slime.json')))
body = Image.open(os.path.join(D, 'body.png')).convert('RGBA')
p = man['parts'][0]; SC = 0.5; EYE = (166, 255, 58)

def pose(state, t, atk):
    a = atk; wind = bump(a, 0.32, 0.28); strike = bump(a, 0.66, 0.26)
    bob = 0; lungeX = 0; sx = 1; sy = 1; moving = (state == 'crawl')
    if state == 'crawl':
        ph = (t * 1.15) % 1; cr = S(TAU * ph)
        sx = 1 + 0.16 * cr; sy = 1 - 0.11 * cr; bob = 1.5 * abs(cr); lungeX = 6 * S(TAU * ph - 0.6)
    else:
        j = S(TAU * (t * 0.8)); sx = 1 + 0.045 * j; sy = 1 - 0.045 * j; bob = 1.4 * S(TAU * (t * 0.8) + 1)
    if a > 0.001:
        sx += 0.22 * wind - 0.16 * strike; sy += -0.22 * wind + 0.30 * strike; bob += -34 * strike; lungeX += 12 * strike
    return bob, lungeX, sx, sy, max(wind * 0.5, strike), moving

def frame(state, t, atk, W=300, H=340, label=''):
    cv = Image.new('RGBA', (W, H), (12, 16, 14, 255)); K = 220.0 / man['charH']; OX = man['originX']; OY0 = 700
    cx, cy = W // 2, int(H * 0.56); rvis = 30.0
    bob, lungeX, sx, sy, swing, moving = pose(state, t, atk)
    au = Image.new('RGBA', (W, H), (0, 0, 0, 0)); da = ImageDraw.Draw(au); pr = 0.8 + 0.2 * S(t * 3)
    for rr, al in [(120, int(46 * pr)), (85, int(60 * pr)), (55, int(72 * pr))]:
        da.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(*EYE, al))
    cv.alpha_composite(au.filter(ImageFilter.GaussianBlur(20)))
    fy = (man['feetY'] - OY0) * K
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    ds.ellipse([cx - rvis * 0.72 * sx, cy + fy - 7, cx + rvis * 0.72 * sx, cy + fy + 7], fill=(0, 0, 0, 150))
    cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4)))
    w = max(1, round(body.width / SC * K)); h = max(1, round(body.height / SC * K)); part = body.resize((w, h), Image.LANCZOS)
    nw, nh = max(1, int(w * sx)), max(1, int(h * sy)); part = part.resize((nw, nh), Image.LANCZOS)
    oxL = p['ox'] / SC * K * sx; oyL = p['oy'] / SC * K * sy
    ax = (p['ax'] + lungeX - OX) * K + cx; ay = (p['ay'] + bob - OY0) * K + cy
    cv.alpha_composite(part, (int(ax - oxL), int(ay - oyL)))
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dg = ImageDraw.Draw(glow); mv = 1 if moving else 0
    for (ex, ey) in man['eyes']:
        wx = (ex - OX + lungeX) * K + cx; wy = (ey - OY0 + bob) * K + cy; Rr = 6 + swing * 3 + mv * 1.5
        for rr, al in [(Rr * 1.8, int(70 + mv * 40)), (Rr, int(120 + mv * 50))]:
            dg.ellipse([wx - rr, wy - rr, wx + rr, wy + rr], fill=(190, 255, 120, min(255, al)))
        dg.ellipse([wx - 3 + mv * 3, wy - 3, wx + 3 + mv * 3, wy + 3], fill=(240, 255, 210, 255))  # pupilla in avanti
    cv.alpha_composite(glow.filter(ImageFilter.GaussianBlur(2)))
    if atk > 0.4:  # spruzzo d'acido
        d = ImageDraw.Draw(cv)
        for k in range(6):
            aa = -0.6 + k * 0.2; dx = math.cos(aa) * (30 + k * 5); dy = math.sin(aa) * 18 - 20
            d.ellipse([cx + dx - 3, cy + dy - 3, cx + dx + 3, cy + dy + 3], fill=(166, 255, 58, 220))
    d = ImageDraw.Draw(cv)
    if label: d.text((8, H - 18), label, fill=(210, 230, 200, 255))
    return cv

cells = [frame('idle', 0.25, 0, label='IDLE (respira)'),
         frame('crawl', 0.0, 0, label='STRISCIA 0'),
         frame('crawl', 0.33, 0, label='STRISCIA ⅓ (si stira)'),
         frame('crawl', 0.66, 0, label='STRISCIA ⅔ (si contrae)'),
         frame('idle', 0.0, 0.32, label='ATTACCO carica'),
         frame('idle', 0.0, 0.66, label='ATTACCO: SALTA+SPUTA')]
scale = 1.4; cw, ch = int(300 * scale), int(340 * scale); cols = 3; rows = 2; G = 10
Wt = cols * cw + (cols + 1) * G; Ht = rows * ch + (rows + 1) * G
out = Image.new('RGB', (Wt, Ht), (8, 11, 9))
for i, c in enumerate(cells):
    cc = c.resize((cw, ch), Image.LANCZOS); r2 = i // cols; col = i % cols
    out.paste(cc.convert('RGB'), (G + col * (cw + G), G + r2 * (ch + G)))
out.save('/mnt/user-data/outputs/melma_striscia.png'); print('ok', out.size)
