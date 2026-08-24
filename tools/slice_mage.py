#!/usr/bin/env python3
"""Slice the Necromancer/Mage PNG into puppet parts (head/hood, torso, bell robe, staff-arm, bony hand)
with pivots at the joints. Mirrors slice_puppet.py but for the mage anatomy (bell robe instead of legs)."""
import json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = '/mnt/user-data/uploads/9d7955afad.png'
OUT = '/home/claude/dr/public/assets/enemies/mage'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
rgb = np.array(im).astype(np.int32)
r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
lum = 0.299 * r + 0.587 * g + 0.699 * b
mask = lum < 170   # bordi puliti
lbl, n = ndimage.label(mask)
if n > 0:
    sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
    mask = lbl == (1 + int(np.argmax(sizes)))
# Riempi SOLO i buchi piccoli (occhi/bocca), NON le grandi tasche di sfondo racchiuse
# dal braccio-bastone che incrocia il corpo (che altrimenti diventerebbero bianche).
filled = ndimage.binary_fill_holes(mask)
holes = filled & ~mask
hl, hn = ndimage.label(holes)
if hn > 0:
    for i in range(1, hn + 1):
        comp = hl == i
        if comp.sum() < 4000:   # buco piccolo → è un dettaglio interno (occhi/bocca): riempi
            mask |= comp
alpha = (mask * 255).astype('uint8')
alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2)))
rgba = np.dstack([rgb.astype('uint8'), alpha])
full = Image.fromarray(rgba, 'RGBA')

W, H = im.size
CHAR_ORIGIN_X = 512
CHAR_FEET_Y = 1420
CHAR_TOP_Y = 188
CHAR_H = CHAR_FEET_Y - CHAR_TOP_Y

# name       box=(x0,y0,x1,y1)               pivot(orig)     z
PARTS = {
    'robe':     ((110, 960, 930, 1430),  (512, 1000),  0),   # bell skirt (base, sways)
    'armStaff': ((30,  190, 380, 1080),  (330, 705),   1),   # left arm + staff + orb + flame
    'torso':    ((300, 560, 745, 1010),  (512, 645),   2),   # upper robe (belt, pendant)
    'armHand':  ((640, 800, 975, 1140),  (690, 835),   3),   # right bony hand + sleeve
    'head':     ((320, 185, 705, 640),   (515, 615),   4),   # hood + face void
}

manifest = {
    'name': 'mage', 'charH': CHAR_H, 'originX': CHAR_ORIGIN_X, 'feetY': CHAR_FEET_Y,
    'eyes': [[448, 545], [585, 545]],
    'orb': [175, 360],   # staff orb (per l'overlay di cast)
    'parts': [],
}
SCALE = 0.5

for name, (box, pivot, z) in PARTS.items():
    x0, y0, x1, y1 = box
    crop = full.crop((x0, y0, x1, y1))
    arr = np.array(crop); a = arr[:, :, 3]
    ys, xs = np.where(a > 8)
    if len(xs) == 0:
        continue
    tx0, tx1, ty0, ty1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    crop = crop.crop((tx0, ty0, tx1, ty1))
    ox = pivot[0] - x0 - tx0
    oy = pivot[1] - y0 - ty0
    nw, nh = max(1, round(crop.width * SCALE)), max(1, round(crop.height * SCALE))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    crop.save(os.path.join(OUT, name + '.png'))
    manifest['parts'].append({'name': name, 'z': z, 'w': nw, 'h': nh,
                              'ox': round(ox * SCALE, 1), 'oy': round(oy * SCALE, 1),
                              'ax': pivot[0], 'ay': pivot[1]})

manifest['parts'].sort(key=lambda p: p['z'])
with open(os.path.join(OUT, 'mage.json'), 'w') as f:
    json.dump(manifest, f, indent=1)

# reassembly preview
sheet = Image.new('RGBA', (W, H), (24, 26, 34, 255))
for p in manifest['parts']:
    part = Image.open(os.path.join(OUT, p['name'] + '.png'))
    part_full = part.resize((round(part.width / SCALE), round(part.height / SCALE)), Image.LANCZOS)
    px = int(p['ax'] - p['ox'] / SCALE); py = int(p['ay'] - p['oy'] / SCALE)
    sheet.alpha_composite(part_full, (px, py))
sheet.save('/home/claude/reassembled_mage.png')
for p in manifest['parts']:
    print(f"  {p['name']:9s} {p['w']}x{p['h']} pivot({p['ox']},{p['oy']}) anchor({p['ax']},{p['ay']}) z{p['z']}")
print("charH", CHAR_H, "done")
