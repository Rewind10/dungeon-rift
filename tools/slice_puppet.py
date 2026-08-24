#!/usr/bin/env python3
"""Slice the chibi zombie PNG into puppet body parts (head, torso, 2 arms, 2 legs)
with defined pivot points, for the hybrid raster-puppet renderer in Dungeon Rift."""
import json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = '/mnt/user-data/uploads/25cf0732d5.png'
OUT = '/home/claude/dr/public/assets/enemies/ghoul'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
rgb = np.array(im).astype(np.int32)
r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
lum = 0.299 * r + 0.587 * g + 0.699 * b

# --- character mask (dark subject on light baked bg) ---
mask = lum < 150
# keep only the largest connected component (drop stray specks in bg)
lbl, n = ndimage.label(mask)
if n > 0:
    sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
    mask = lbl == (1 + int(np.argmax(sizes)))
# fill interior holes (glowing eyes / mouth) so parts are solid
mask = ndimage.binary_fill_holes(mask)

alpha = (mask * 255).astype('uint8')
# feather the edge slightly for clean compositing
alpha_img = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2))
alpha = np.array(alpha_img)

rgba = np.dstack([rgb.astype('uint8'), alpha])
full = Image.fromarray(rgba, 'RGBA')

W, H = im.size
CHAR_ORIGIN_X = 512            # horizontal center
CHAR_FEET_Y = 1408             # ground line (feet)
CHAR_TOP_Y = 76
CHAR_H = CHAR_FEET_Y - CHAR_TOP_Y  # 1332

# Part boxes in ORIGINAL px: (x0,y0,x1,y1) with pivot (px,py) in original coords.
# Boxes overlap on the pivot side so rotation never reveals a gap (seam-hiding).
PARTS = {
    # name       box                          pivot(orig)     z (draw order, low=back)
    'legR':  ((230, 940, 520, 1420),  (430, 985),  0),   # image-left leg
    'legL':  ((504, 940, 800, 1420),  (595, 985),  0),   # image-right leg
    'armR':  ((60,  560, 340, 1300),  (312, 640),  1),   # image-left arm (behind torso a touch)
    'armL':  ((690, 560, 960, 1300),  (712, 640),  1),   # image-right arm
    'torso': ((288, 520, 736, 1040),  (512, 560),  2),   # body
    'head':  ((190, 60,  824, 610),   (512, 585),  3),   # big head + face
}

manifest = {
    'name': 'ghoul',
    'charH': CHAR_H,
    'originX': CHAR_ORIGIN_X,
    'feetY': CHAR_FEET_Y,
    # eyes for procedural glow overlay (orig px), relative to head pivot
    'eyes': [[392, 486], [578, 486]],
    'mouth': [485, 640],
    'parts': [],
}

SCALE = 0.5  # downscale factor for asset files (keeps them small & crisp)

for name, (box, pivot, z) in PARTS.items():
    x0, y0, x1, y1 = box
    crop = full.crop((x0, y0, x1, y1))
    # trim fully-transparent margins, but keep pivot mapping
    arr = np.array(crop)
    a = arr[:, :, 3]
    ys, xs = np.where(a > 8)
    if len(xs) == 0:
        continue
    tx0, tx1, ty0, ty1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    crop = crop.crop((tx0, ty0, tx1, ty1))
    # pivot within the trimmed part (local px, pre-scale)
    ox = pivot[0] - x0 - tx0
    oy = pivot[1] - y0 - ty0
    # downscale
    nw, nh = max(1, round(crop.width * SCALE)), max(1, round(crop.height * SCALE))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    crop.save(os.path.join(OUT, name + '.png'))
    manifest['parts'].append({
        'name': name, 'z': z,
        'w': nw, 'h': nh,
        'ox': round(ox * SCALE, 1), 'oy': round(oy * SCALE, 1),
        'ax': pivot[0], 'ay': pivot[1],   # pivot in original char space
    })

manifest['parts'].sort(key=lambda p: p['z'])
with open(os.path.join(OUT, 'ghoul.json'), 'w') as f:
    json.dump(manifest, f, indent=1)

# quick contact sheet for review
sheet = Image.new('RGBA', (W, H), (24, 26, 34, 255))
for p in manifest['parts']:
    part = Image.open(os.path.join(OUT, p['name'] + '.png'))
    # place pivots aligned to original anchor for a reassembly preview
    px = int(p['ax'] - p['ox'] / SCALE)
    py = int(p['ay'] - p['oy'] / SCALE)
    part_full = part.resize((round(part.width / SCALE), round(part.height / SCALE)), Image.LANCZOS)
    sheet.alpha_composite(part_full, (px, py))
sheet.save('/home/claude/reassembled.png')
print("parts:", [p['name'] for p in manifest['parts']])
for p in manifest['parts']:
    print(f"  {p['name']:6s} {p['w']}x{p['h']} pivot({p['ox']},{p['oy']}) anchor({p['ax']},{p['ay']}) z{p['z']}")
print("done")
