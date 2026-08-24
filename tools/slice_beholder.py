#!/usr/bin/env python3
"""Slice the BEHOLDER illustration into a single centered 'body' puppet part (raster puppet method).
Source has a BAKED light checkerboard background (no real alpha), like the slime: segment the subject
(dark body + saturated magenta glow/eyes) from that light-gray bg by luminance/saturation.
Pivot = image CENTER (floating billboard). Keeps the baked magenta rim-glow (masks the cutout)."""
import json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = '/mnt/user-data/uploads/6effed628c.png'
ROOT = open('/home/claude/dr49/root.txt').read().strip()
OUT = os.path.join(ROOT, 'public/assets/enemies/beholder')
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
rgb = np.array(im).astype(np.int32)
r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
lum = 0.299 * r + 0.587 * g + 0.699 * b
mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); sat = mx - mn

bg = (lum > 168) & (sat < 42)              # light-gray checkerboard background
subj = ~bg
# largest connected component (drop stray specks)
lbl, n = ndimage.label(subj)
if n > 0:
    sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
    mask = lbl == (1 + int(np.argmax(sizes)))
else:
    mask = subj
mask = ndimage.binary_closing(mask, structure=np.ones((5, 5)))
mask = ndimage.binary_fill_holes(mask)
mask = ndimage.binary_opening(mask, structure=np.ones((3, 3)))
lbl, n = ndimage.label(mask)
if n > 0:
    sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
    mask = lbl == (1 + int(np.argmax(sizes)))

alpha = (mask * 255).astype('uint8')
alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2)))
alpha = alpha.astype(np.int32); alpha[bg] = 0
alpha = np.clip(alpha, 0, 255).astype('uint8')
full = Image.fromarray(np.dstack([rgb.astype('uint8'), alpha]), 'RGBA')

ys, xs = np.where(mask)
x0, y0, x1, y1 = int(xs.min()) - 4, int(ys.min()) - 4, int(xs.max()) + 5, int(ys.max()) + 5
crop = full.crop((x0, y0, x1, y1))
# trim fully transparent margins
arr = np.array(crop); a = arr[:, :, 3]
yy, xx = np.where(a > 8)
tx0, tx1, ty0, ty1 = int(xx.min()), int(xx.max()) + 1, int(yy.min()), int(yy.max()) + 1
crop = crop.crop((tx0, ty0, tx1, ty1))

SCALE = 0.5
nw, nh = max(1, round(crop.width * SCALE)), max(1, round(crop.height * SCALE))
crop = crop.resize((nw, nh), Image.LANCZOS)
crop.save(os.path.join(OUT, 'body.png'))

# central big-eye position (magenta iris): brightest saturated magenta cluster near the vertical center
cx_g = (r > 150) & (b > 120) & (g < 120) & (sat > 80)
cyi, cxi = np.where(cx_g)
if len(cxi):
    # weight toward the central lower half (main eye), exclude top eyestalks
    keep = cyi > (ys.min() + (ys.max() - ys.min()) * 0.40)
    if keep.sum() > 50:
        cxi, cyi = cxi[keep], cyi[keep]
    core_x, core_y = int(np.median(cxi)), int(np.median(cyi))
else:
    core_x, core_y = (x0 + x1) // 2, (y0 + y1) // 2

# store body pivot = image CENTER (billboard). core = main-eye center in ORIGINAL space (for iris overlay).
ox = crop.width / 2.0
oy = crop.height / 2.0
manifest = {
    'name': 'beholder',
    'charH': nh,           # content height (post-scale)
    'originX': 512,
    'feetY': (ty1 + y0),   # approx bottom (orig space)
    'centerX': (x0 + tx0) + crop.width / SCALE / 2.0,
    'centerY': (y0 + ty0) + crop.height / SCALE / 2.0,
    'core': [core_x, core_y],
    'parts': [{'name': 'body', 'z': 0, 'w': nw, 'h': nh,
               'ox': round(ox, 1), 'oy': round(oy, 1), 'ax': 512, 'ay': (ty1 + y0)}],
}
json.dump(manifest, open(os.path.join(OUT, 'beholder.json'), 'w'), indent=1)
print('beholder body', nw, 'x', nh, '| core(orig)', manifest['core'])
print('saved to', OUT)
