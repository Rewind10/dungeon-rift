#!/usr/bin/env python3
"""Slice the NO-MOUTH slime PNG into a single 'body' part (blob) for the crawl+hop puppet.
No 'core' (belly is clean); eyes for the procedural glow overlay. Baked edge-glow masks the cutout."""
import json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = '/mnt/user-data/uploads/68c143a2b8.png'
OUT = '/home/claude/dr/public/assets/enemies/slime'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
rgb = np.array(im).astype(np.int32); r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
lum = 0.299 * r + 0.587 * g + 0.699 * b
mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); sat = mx - mn
bg = (lum > 172) & (sat < 40)                        # baked light-gray checkerboard bg
subj = (lum < 150) | (sat > 85)                      # slime: dark OR strongly saturated green
lbl, n = ndimage.label(subj)
if n > 0:
    sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1)); mask = lbl == (1 + int(np.argmax(sizes)))
else:
    mask = subj
mask = ndimage.binary_closing(mask, structure=np.ones((7, 7)))
mask = ndimage.binary_fill_holes(mask)
mask = ndimage.binary_opening(mask, structure=np.ones((5, 5)))
lbl, n = ndimage.label(mask)
if n > 0:
    sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1)); mask = lbl == (1 + int(np.argmax(sizes)))
alpha = (mask * 255).astype('uint8')
alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.0)))
alpha = alpha.astype(np.int32); alpha[bg] = 0; alpha = np.clip(alpha, 0, 255).astype('uint8')
full = Image.fromarray(np.dstack([rgb.astype('uint8'), alpha]), 'RGBA')

W, H = im.size
ys, xs = np.where(mask)
ORIGIN_X = 512; FEET_Y = int(ys.max()) - 6; TOP_Y = int(ys.min()); CHAR_H = FEET_Y - TOP_Y
SCALE = 0.5
x0, y0, x1, y1 = int(xs.min()) - 6, TOP_Y - 6, int(xs.max()) + 6, FEET_Y + 22
crop = full.crop((x0, y0, x1, y1)); arr = np.array(crop); aa = arr[:, :, 3]
yy, xx = np.where(aa > 8); tx0, tx1, ty0, ty1 = xx.min(), xx.max() + 1, yy.min(), yy.max() + 1
crop = crop.crop((tx0, ty0, tx1, ty1))
ox = ORIGIN_X - x0 - tx0; oy = FEET_Y - y0 - ty0
nw, nh = max(1, round(crop.width * SCALE)), max(1, round(crop.height * SCALE))
crop.resize((nw, nh), Image.LANCZOS).save(os.path.join(OUT, 'body.png'))

# locate the two glowing eyes: bright near-white-green, in the CENTRAL band (exclude the edge-glow at the sides)
band = np.zeros(g.shape, bool); yb0 = int(ys.min() + (ys.max()-ys.min())*0.33); yb1 = int(ys.min() + (ys.max()-ys.min())*0.60)
xC0, xC1 = ORIGIN_X - 170, ORIGIN_X + 170
band[yb0:yb1, xC0:xC1] = True
bright = (g > 215) & (r > 180) & (b > 90) & band & mask
lbl2, n2 = ndimage.label(bright); comps = []
for i in range(1, n2 + 1):
    yy2, xx2 = np.where(lbl2 == i)
    if 120 < len(xx2) < 20000: comps.append((int(xx2.mean()), int(yy2.mean()), len(xx2)))
comps.sort(key=lambda c: -c[2])            # biggest two bright blobs in the center = the eyes
comps = sorted(comps[:2])
eyes = [[comps[0][0], comps[0][1]], [comps[1][0], comps[1][1]]] if len(comps) >= 2 else [[ORIGIN_X-70, (yb0+yb1)//2], [ORIGIN_X+70, (yb0+yb1)//2]]

manifest = {'name': 'slime', 'charH': CHAR_H, 'originX': ORIGIN_X, 'feetY': FEET_Y,
            'eyes': eyes,
            'parts': [{'name': 'body', 'z': 0, 'w': nw, 'h': nh,
                       'ox': round(ox * SCALE, 1), 'oy': round(oy * SCALE, 1), 'ax': ORIGIN_X, 'ay': FEET_Y}]}
json.dump(manifest, open(os.path.join(OUT, 'slime.json'), 'w'), indent=1)
print('body', nw, 'x', nh, 'charH', CHAR_H, 'eyes', eyes)
