#!/usr/bin/env python3
"""Anteprima v1.37: camminata più aggressiva/lenta, attacco carica→colpo, ombra sfocata alla base.
Rispecchia esattamente la matematica di _ghoulPuppet in renderer.js."""
import json, math, os
from PIL import Image, ImageDraw, ImageFilter

D = '/home/claude/dr/public/assets/enemies/ghoul'
man = json.load(open(os.path.join(D, 'ghoul.json')))
SC = 0.5
parts = {p['name']: p for p in man['parts']}
imgs = {p['name']: Image.open(os.path.join(D, p['name'] + '.png')).convert('RGBA') for p in man['parts']}
ORDER = ['legR', 'legL', 'torso', 'head', 'armR', 'armL']
S = math.sin; PI = math.pi; TAU = 2 * PI
WALK = dict(cad=1.05, leg=37, arm=26, torso=7, head=3, bob=11, sway=4.5)
def bump(x, c, w): return max(0.0, 1 - abs(x - c) / w)


def pose(state, ph, a):
    P = {n: [0.0, 0.0, 0.0] for n in parts}; bob = 0.0; lungeX = 0.0
    if state == 'walk':
        bob = -WALK['bob'] + WALK['bob'] * abs(S(TAU * ph))
        lat = WALK['sway'] * S(TAU * ph)
        P['legR'] = [WALK['leg'] * S(TAU * ph), 0, 0]
        P['legL'] = [WALK['leg'] * S(TAU * ph + PI), 0, 0]
        P['armR'] = [-WALK['arm'] * S(TAU * ph), 0, 0]
        P['armL'] = [-WALK['arm'] * S(TAU * ph + PI), 0, 0]
        P['torso'] = [WALK['torso'] * S(TAU * ph), lat, 0]
        P['head'] = [-WALK['head'] * S(TAU * ph), lat * 0.6, 0]
    else:
        bob = 6 * S(TAU * ph)
        P['head'] = [3 * S(TAU * ph), 0, 2 * S(TAU * ph + .5)]
        P['armR'] = [4 * S(TAU * ph), 0, 0]; P['armL'] = [-4 * S(TAU * ph), 0, 0]
        P['torso'] = [1.5 * S(TAU * ph), 0, 0]
    if a > 0.001:
        wind = bump(a, 0.30, 0.30); strike = bump(a, 0.62, 0.30)
        P['armR'][0] += -30 * wind; P['armR'][2] += -30 * wind
        P['armL'][0] += 30 * wind;  P['armL'][2] += -30 * wind
        P['torso'][0] += -5 * wind; P['head'][2] += -10 * wind
        P['armR'][0] += 74 * strike; P['armR'][2] += 26 * strike
        P['armL'][0] += -74 * strike; P['armL'][2] += 26 * strike
        P['torso'][0] += 11 * strike; P['head'][2] += 24 * strike
        P['legR'][0] += 10 * strike; P['legL'][0] += -10 * strike
        lungeX += 30 * strike
    return P, bob, lungeX


def frame(state, ph, a, W=300, H=380, label=''):
    cv = Image.new('RGBA', (W, H), (12, 14, 20, 255))
    # soft green aura like in-game
    aura = Image.new('RGBA', (W, H), (0, 0, 0, 0)); da = ImageDraw.Draw(aura)
    cx, cy = W // 2, int(H * 0.46)
    for rr, al in [(120, 22), (85, 30), (55, 40)]:
        da.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(120, 255, 110, al))
    cv.alpha_composite(aura.filter(ImageFilter.GaussianBlur(18)))
    P, bob, lungeX = pose(state, ph, a)
    K = 250.0 / man['charH']; OX = man['originX']; OY0 = 890
    rvis = 27.0  # approx in-game r
    # --- grounding shadow (blurred) ---
    fy = (man['feetY'] - OY0) * K
    lift = max(0, -bob) / (WALK['bob'] * 2)
    sw = rvis * 0.62 * (1 - lift * 0.35); sh = rvis * 0.20 * (1 - lift * 0.3)
    sh_img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh_img)
    a_sh = 0.5 - lift * 0.18
    ex = cx + lungeX * K * 0.6
    ds.ellipse([ex - sw, cy + fy - sh, ex + sw, cy + fy + sh], fill=(0, 0, 0, int(255 * a_sh)))
    cv.alpha_composite(sh_img.filter(ImageFilter.GaussianBlur(max(1, rvis * 0.11))))
    # --- parts ---
    for n in ORDER:
        p = parts[n]; im0 = imgs[n]; rot, dx, dy = P[n]
        w = max(1, round(im0.width / SC * K)); h = max(1, round(im0.height / SC * K))
        part = im0.resize((w, h), Image.LANCZOS)
        oxL = p['ox'] / SC * K; oyL = p['oy'] / SC * K
        pad = Image.new('RGBA', (w * 3, h * 3), (0, 0, 0, 0))
        pad.alpha_composite(part, (int(w * 1.5 - oxL), int(h * 1.5 - oyL)))
        pr = pad.rotate(-rot, resample=Image.BICUBIC, center=(w * 1.5, h * 1.5))
        ax = (p['ax'] + dx + lungeX - OX) * K + cx
        ay = (p['ay'] + dy + bob - OY0) * K + cy
        cv.alpha_composite(pr, (int(ax - w * 1.5), int(ay - h * 1.5)))
    # eyes
    dr = ImageDraw.Draw(cv); htr = P['head']
    for (exx, eyy) in man['eyes']:
        wx = (exx - OX + lungeX) * K + cx
        wy = (eyy - OY0 + bob + htr[2]) * K + cy
        for rr, al in [(11, 80), (6, 160), (3, 255)]:
            dr.ellipse([wx - rr, wy - rr, wx + rr, wy + rr], fill=(150, 255, 130, al))
    if label:
        dr.text((10, H - 20), label, fill=(200, 220, 210, 255))
    return cv

cells = [
    frame('walk', 0.0,  0, label='CAMMINATA 0'),
    frame('walk', 0.25, 0, label='CAMMINATA ¼'),
    frame('walk', 0.5,  0, label='CAMMINATA ½'),
    frame('idle', 0.25, 0.30, label='ATTACCO carica'),
    frame('idle', 0.25, 0.62, label='ATTACCO colpo'),
    frame('idle', 0.25, 0, label='IDLE'),
]
gap = 6
strip = Image.new('RGBA', (300 * len(cells) + gap * (len(cells) - 1), 380), (6, 7, 11, 255))
x = 0
for c in cells:
    strip.alpha_composite(c, (x, 0)); x += 300 + gap
strip.convert('RGB').save('/home/claude/v137_strip.png')
print('ok')
