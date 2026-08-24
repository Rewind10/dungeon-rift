#!/usr/bin/env python3
"""Slice the Cave Brute PNG into puppet parts (head, torso, 2 HUGE arms, 2 legs).
Pivots for the arms are placed at the SHOULDER joints so they swing like heavy pendulums
(the brute's signature animation). Mirrors slice_puppet.py / slice_mage.py."""
import json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = '/mnt/user-data/uploads/f4e6df6046.png'
OUT = '/home/claude/dr/public/assets/enemies/brute'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
rgb = np.array(im).astype(np.int32)
r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
lum = 0.299 * r + 0.587 * g + 0.699 * b
mask = lum < 150
lbl, n = ndimage.label(mask)
if n > 0:
    sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
    mask = lbl == (1 + int(np.argmax(sizes)))
# fill only small interior holes (eyes/mouth), not big background pockets between arms/legs
filled = ndimage.binary_fill_holes(mask)
holes = filled & ~mask
hl, hn = ndimage.label(holes)
if hn > 0:
    for i in range(1, hn + 1):
        comp = hl == i
        if comp.sum() < 5000:
            mask |= comp
alpha = (mask * 255).astype('uint8')
alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2)))
rgba = np.dstack([rgb.astype('uint8'), alpha])
full = Image.fromarray(rgba, 'RGBA')

W, H = im.size
CHAR_ORIGIN_X = 512
CHAR_FEET_Y = 1220
CHAR_TOP_Y = 234
CHAR_H = CHAR_FEET_Y - CHAR_TOP_Y   # 986

# name       box=(x0,y0,x1,y1)              pivot(orig)     z (0 back .. 3 front)
PARTS = {
    'legR':  ((235, 770, 485, 1226), (405, 815),  0),   # image-left leg
    'legL':  ((545, 770, 795, 1226), (612, 815),  0),   # image-right leg
    'torso': ((285, 360, 735, 1120), (512, 470),  1),   # torso + belly + loincloth
    'armR':  ((18,  322, 415, 1226), (322, 495),  2),   # image-left HUGE arm (pivot @ shoulder; top raised to keep pauldron)
    'armL':  ((630, 322, 1012, 1226),(712, 495),  2),   # image-right HUGE arm (pivot @ shoulder)
    'head':  ((300, 232, 705, 680),  (508, 610),  3),   # head + tusks + ears (on top)
}

manifest = {
    'name': 'brute', 'charH': CHAR_H, 'originX': CHAR_ORIGIN_X, 'feetY': CHAR_FEET_Y,
    'eyes': [[467, 500], [556, 500]],
    'mouth': [512, 600],
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
with open(os.path.join(OUT, 'brute.json'), 'w') as f:
    json.dump(manifest, f, indent=1)

# reassembly preview
sheet = Image.new('RGBA', (W, H), (24, 26, 34, 255))
for p in manifest['parts']:
    part = Image.open(os.path.join(OUT, p['name'] + '.png'))
    part_full = part.resize((round(part.width / SCALE), round(part.height / SCALE)), Image.LANCZOS)
    px = int(p['ax'] - p['ox'] / SCALE); py = int(p['ay'] - p['oy'] / SCALE)
    sheet.alpha_composite(part_full, (px, py))
sheet.save('/home/claude/reassembled_brute.png')
for p in manifest['parts']:
    print(f"  {p['name']:6s} {p['w']}x{p['h']} pivot({p['ox']},{p['oy']}) anchor({p['ax']},{p['ay']}) z{p['z']}")
print("charH", CHAR_H, "done")
