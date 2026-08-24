#!/usr/bin/env python3
"""Anteprima v1.43 del Bruto: camminata LUMBERING (distinta dallo zombie) + SLAM overhead (alza pugni -> schianto).
Rispecchia la matematica di PROF.brute in renderer.js."""
import json, math, os
from PIL import Image, ImageDraw, ImageFilter
S = math.sin; TAU = 2 * math.pi; PI = math.pi
def bump(x, c, w): return max(0.0, 1 - abs(x - c) / w)

D = '/home/claude/dr/public/assets/enemies/brute'
man = json.load(open(os.path.join(D, 'brute.json')))
SC = 0.5
parts = {p['name']: p for p in man['parts']}
imgs = {p['name']: Image.open(os.path.join(D, p['name'] + '.png')).convert('RGBA') for p in man['parts']}
ORDER = ['legR', 'legL', 'torso', 'armR', 'armL', 'head']
W = dict(cad=0.72, leg=22, armSwing=8, armRoll=10, torso=3, head=2, bob=12, sway=8, lean=7)

def pose(state, ph, atk):
    P = {n: [0.0, 0.0, 0.0] for n in parts}; bob = 0.0; lungeX = 0.0; tilt = 0.0
    if state == 'walk':
        bob = -W['bob'] + W['bob'] * abs(S(TAU * ph))
        lat = W['sway'] * S(TAU * ph)
        P['legR'] = [W['leg'] * S(TAU * ph), 0, 0]; P['legL'] = [W['leg'] * S(TAU * ph + PI), 0, 0]
        roll = W['armRoll'] * S(TAU * ph)
        P['armR'] = [W['armSwing'] * S(TAU * ph), 0, roll]; P['armL'] = [W['armSwing'] * S(TAU * ph), 0, -roll]
        P['torso'] = [W['torso'] * S(TAU * ph), lat, 0]; P['head'] = [-W['head'] * S(TAU * ph), lat * 0.6, 0]
        tilt = W['lean']
    else:
        bob = 7 * S(TAU * ph)
        P['armR'] = [4 * S(TAU * ph), 0, 0]; P['armL'] = [4 * S(TAU * ph), 0, 0]
        P['torso'] = [1.4 * S(TAU * ph), 0, 0]; P['head'] = [2 * S(TAU * ph + 0.5), 0, 1.4 * S(TAU * ph)]; tilt = 2
    if atk > 0.001:
        wind = bump(atk, 0.30, 0.28); strike = bump(atk, 0.66, 0.26)
        P['armR'][0] += 140 * wind; P['armL'][0] += -140 * wind
        P['head'][2] += -20 * wind; P['torso'][0] += -8 * wind; bob += -16 * wind; tilt += -8 * wind
        P['armR'][0] += 34 * strike; P['armL'][0] += -34 * strike
        P['head'][2] += 26 * strike; P['torso'][0] += 12 * strike; P['legR'][0] += 8 * strike; P['legL'][0] += -8 * strike
        bob += 22 * strike; lungeX += 22 * strike; tilt += 16 * strike
    return P, bob, lungeX, tilt

def frame(state, ph, atk, Wd=320, Hd=400, label=''):
    cv = Image.new('RGBA', (Wd, Hd), (12, 14, 18, 255))
    K = 250.0 / man['charH']; OX = man['originX']; OY0 = 760
    cx, cy = Wd // 2, int(Hd * 0.52); rvis = 30.0
    au = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); da = ImageDraw.Draw(au)
    for rr, al in [(130, 20), (95, 26), (60, 32)]:
        da.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(255, 170, 70, al))
    cv.alpha_composite(au.filter(ImageFilter.GaussianBlur(20)))
    P, bob, lungeX, tilt = pose(state, ph, atk)
    fy = (man['feetY'] - OY0) * K
    lift = max(0, -bob) / (W['bob'] * 2); stretch = 1.25 if state == 'walk' else 1.0
    sw = rvis * 0.72 * stretch * (1 - lift * 0.3); sh = rvis * 0.22 * (1 - lift * 0.3)
    shimg = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); ds = ImageDraw.Draw(shimg)
    ex = cx + lungeX * K * 0.6
    ds.ellipse([ex - sw, cy + fy - sh, ex + sw, cy + fy + sh], fill=(0, 0, 0, 140))
    cv.alpha_composite(shimg.filter(ImageFilter.GaussianBlur(4)))
    for n in ORDER:
        p = parts[n]; im0 = imgs[n]; rot, dx, dy = P[n]
        extra = tilt if n in ('torso', 'head') else tilt * 0.4
        w = max(1, round(im0.width / SC * K)); h = max(1, round(im0.height / SC * K))
        part = im0.resize((w, h), Image.LANCZOS)
        oxL = p['ox'] / SC * K; oyL = p['oy'] / SC * K
        pad = Image.new('RGBA', (w * 3, h * 3), (0, 0, 0, 0))
        pad.alpha_composite(part, (int(w * 1.5 - oxL), int(h * 1.5 - oyL)))
        pr = pad.rotate(-(rot + extra), resample=Image.BICUBIC, center=(w * 1.5, h * 1.5))
        ax = (p['ax'] + dx + lungeX - OX) * K + cx; ay = (p['ay'] + dy + bob - OY0) * K + cy
        cv.alpha_composite(pr, (int(ax - w * 1.5), int(ay - h * 1.5)))
    dr = ImageDraw.Draw(cv); htr = P['head']
    for (exx, eyy) in man['eyes']:
        wx = (exx - OX + lungeX) * K + cx; wy = (eyy - OY0 + bob + htr[2]) * K + cy
        for rr, al in [(9, 90), (5, 170), (3, 255)]:
            dr.ellipse([wx - rr, wy - rr, wx + rr, wy + rr], fill=(255, 190, 90, al))
    if label: dr.text((8, Hd - 18), label, fill=(230, 210, 180, 255))
    return cv

cells = [
    frame('walk', 0.0, 0, label='CAMMINATA 0'),
    frame('walk', 0.25, 0, label='CAMMINATA 1/4'),
    frame('walk', 0.5, 0, label='CAMMINATA 1/2'),
    frame('walk', 0.75, 0, label='CAMMINATA 3/4'),
    frame('idle', 0.25, 0.30, label='SLAM: pugni SU'),
    frame('idle', 0.25, 0.66, label='SLAM: schianto'),
]
gap = 6
strip = Image.new('RGBA', (320 * len(cells) + gap * (len(cells) - 1), 400), (6, 7, 11, 255))
x = 0
for c in cells:
    strip.alpha_composite(c, (x, 0)); x += 320 + gap
strip.convert('RGB').save('/home/claude/brute2_strip.png')
print('ok')
