#!/usr/bin/env python3
"""Anteprima rig del Bruto: focus sull'animazione delle BRACCIA (dondolio pesante in camminata,
slam a due tempi: alza i pugni sopra la testa -> schianta a terra). Stessa matematica che andra' in renderer.js."""
import json, math, os
from PIL import Image, ImageDraw, ImageFilter
S = math.sin; TAU = 2 * math.pi; PI = math.pi
def bump(x, c, w): return max(0.0, 1 - abs(x - c) / w)

D = '/home/claude/dr/public/assets/enemies/brute'
man = json.load(open(os.path.join(D, 'brute.json')))
SC = 0.5
parts = {p['name']: p for p in man['parts']}
imgs = {p['name']: Image.open(os.path.join(D, p['name'] + '.png')).convert('RGBA') for p in man['parts']}
ORDER = ['legR', 'legL', 'torso', 'armR', 'armL', 'head']  # z-order

WALK = dict(cad=0.9, leg=20, arm=24, torso=4, head=2, bob=13, sway=5)

def pose(state, ph, atk):
    P = {n: [0.0, 0.0, 0.0] for n in parts}
    bob = 0.0; lungeX = 0.0; tilt = 0.0
    if state == 'walk':
        bob = -WALK['bob'] + WALK['bob'] * abs(S(TAU * ph))
        lat = WALK['sway'] * S(TAU * ph)
        P['legR'] = [WALK['leg'] * S(TAU * ph), 0, 0]
        P['legL'] = [WALK['leg'] * S(TAU * ph + PI), 0, 0]
        # braccia enormi: grande dondolio in opposizione (firma del bruto)
        P['armR'] = [-WALK['arm'] * S(TAU * ph), 0, 0]
        P['armL'] = [-WALK['arm'] * S(TAU * ph + PI), 0, 0]
        P['torso'] = [WALK['torso'] * S(TAU * ph), lat, 0]
        P['head'] = [-WALK['head'] * S(TAU * ph), lat * 0.6, 0]
        tilt = 3.0
    else:  # idle: respiro pesante, spalle che si alzano, braccia che ciondolano lente
        bob = 7 * S(TAU * ph)
        P['armR'] = [5 * S(TAU * ph), 0, 0]
        P['armL'] = [-5 * S(TAU * ph), 0, 0]
        P['torso'] = [1.4 * S(TAU * ph), 0, 0]
        P['head'] = [2 * S(TAU * ph + 0.5), 0, 1.4 * S(TAU * ph)]
    if atk > 0.001:
        wind = bump(atk, 0.32, 0.30)    # CARICA: si erge e carica i pugni all'indietro/in fuori
        strike = bump(atk, 0.66, 0.26)  # SLAM: tutto il busto affonda in avanti, i pugni guidano lo schianto
        # WIND: spalle su, busto reclinato, pugni cocked verso l'esterno-alto
        P['armR'][0] += 30 * wind          # pugno sx in fuori/su
        P['armL'][0] += -30 * wind         # pugno dx in fuori/su
        P['head'][2] += -14 * wind         # testa su
        P['torso'][0] += -5 * wind
        bob += -12 * wind                  # si erge (sale)
        # STRIKE: schianto — il corpo AFFONDA in avanti/giu, i pugni convergono avanti-basso
        P['armR'][0] += -22 * strike       # pugno sx converge verso il centro/avanti
        P['armL'][0] += 22 * strike        # pugno dx converge verso il centro/avanti
        P['head'][2] += 24 * strike        # testa protesa in basso/avanti
        P['legR'][0] += 7 * strike; P['legL'][0] += -7 * strike
        bob += 20 * strike                 # il corpo si abbatte (affonda)
        lungeX += 34 * strike              # affondo in avanti deciso
        tilt += 12 * strike                # busto/testa si inclinano nello schianto
    return P, bob, lungeX, tilt

def frame(state, ph, atk, W=320, H=380, label=''):
    cv = Image.new('RGBA', (W, H), (12, 14, 18, 255))
    K = 250.0 / man['charH']; OX = man['originX']; OY0 = 760
    cx, cy = W // 2, int(H * 0.5)
    rvis = 30.0
    # amber aura
    au = Image.new('RGBA', (W, H), (0, 0, 0, 0)); da = ImageDraw.Draw(au)
    for rr, al in [(130, 20), (95, 26), (60, 32)]:
        da.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(255, 170, 70, al))
    cv.alpha_composite(au.filter(ImageFilter.GaussianBlur(20)))
    P, bob, lungeX, tilt = pose(state, ph, atk)
    # ground shadow
    fy = (man['feetY'] - OY0) * K
    lift = max(0, -bob) / (WALK['bob'] * 2)
    stretch = 1.25 if state == 'walk' else 1.0
    sw = rvis * 0.72 * stretch * (1 - lift * 0.3); sh = rvis * 0.22 * (1 - lift * 0.3)
    sh_img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh_img)
    ex = cx + lungeX * K * 0.6
    ds.ellipse([ex - sw, cy + fy - sh, ex + sw, cy + fy + sh], fill=(0, 0, 0, 140))
    cv.alpha_composite(sh_img.filter(ImageFilter.GaussianBlur(4)))
    for n in ORDER:
        p = parts[n]; im0 = imgs[n]; rot, dx, dy = P[n]
        extra = tilt if n in ('torso', 'head') else tilt * 0.4
        w = max(1, round(im0.width / SC * K)); h = max(1, round(im0.height / SC * K))
        part = im0.resize((w, h), Image.LANCZOS)
        oxL = p['ox'] / SC * K; oyL = p['oy'] / SC * K
        pad = Image.new('RGBA', (w * 3, h * 3), (0, 0, 0, 0))
        pad.alpha_composite(part, (int(w * 1.5 - oxL), int(h * 1.5 - oyL)))
        pr = pad.rotate(-(rot + extra), resample=Image.BICUBIC, center=(w * 1.5, h * 1.5))
        ax = (p['ax'] + dx + lungeX - OX) * K + cx
        ay = (p['ay'] + dy + bob - OY0) * K + cy
        cv.alpha_composite(pr, (int(ax - w * 1.5), int(ay - h * 1.5)))
    # amber eyes
    dr = ImageDraw.Draw(cv); htr = P['head']
    for (exx, eyy) in man['eyes']:
        wx = (exx - OX + lungeX) * K + cx; wy = (eyy - OY0 + bob + htr[2]) * K + cy
        for rr, al in [(9, 90), (5, 170), (3, 255)]:
            dr.ellipse([wx - rr, wy - rr, wx + rr, wy + rr], fill=(255, 190, 90, al))
    if label:
        dr.text((8, H - 18), label, fill=(230, 210, 180, 255))
    return cv

cells = [
    frame('idle', 0.25, 0, label='IDLE'),
    frame('walk', 0.0, 0, label='CAMMINATA 0'),
    frame('walk', 0.25, 0, label='CAMMINATA ¼'),
    frame('walk', 0.5, 0, label='CAMMINATA ½'),
    frame('idle', 0.25, 0.32, label='SLAM carica (pugni su)'),
    frame('idle', 0.25, 0.66, label='SLAM colpo (schianto)'),
]
gap = 6
strip = Image.new('RGBA', (320 * len(cells) + gap * (len(cells) - 1), 380), (6, 7, 11, 255))
x = 0
for c in cells:
    strip.alpha_composite(c, (x, 0)); x += 320 + gap
strip.convert('RGB').save('/home/claude/brute_strip.png')
print('ok')
