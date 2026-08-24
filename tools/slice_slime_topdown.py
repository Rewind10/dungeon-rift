#!/usr/bin/env python3
"""Slice the TOP-DOWN acid puddle into a single centered 'body' part.
The source has a BAKED light-gray checkerboard 'transparency' (not real alpha), so we segment the
green puddle (+ its glow) from that background by luminance/saturation. Pivot = image CENTER."""
import json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = '/mnt/user-data/uploads/f3b5cd241f.png'
OUT = '/home/claude/dr/public/assets/enemies/slime'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGB')
rgb = np.array(im).astype(np.int32); r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
lum = 0.299 * r + 0.587 * g + 0.699 * b
mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); sat = mx - mn
bg = (lum > 168) & (sat < 42)                       # baked gray checkerboard
mask = ~bg
# green glow / body = keep; also explicitly include clearly green pixels
mask |= (g > r + 12) & (g > b + 12)
lbl, n = ndimage.label(mask)
if n > 0:
    sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1)); mask = lbl == (1 + int(np.argmax(sizes)))
mask = ndimage.binary_closing(mask, structure=np.ones((5, 5)))
mask = ndimage.binary_fill_holes(mask)

alpha = (mask * 255).astype('uint8')
alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.6)))
alpha = alpha.astype(np.int32); alpha[bg] = 0; alpha = np.clip(alpha, 0, 255).astype('uint8')
full = Image.fromarray(np.dstack([rgb.astype('uint8'), alpha]), 'RGBA')

ys, xs = np.where(mask)
x0, y0 = int(xs.min()) - 2, int(ys.min()) - 2
x1, y1 = int(xs.max()) + 3, int(ys.max()) + 3
crop = full.crop((x0, y0, x1, y1))
SCALE = 0.5
nw, nh = max(1, round(crop.width * SCALE)), max(1, round(crop.height * SCALE))
crop = crop.resize((nw, nh), Image.LANCZOS)
crop.save(os.path.join(OUT, 'body.png'))

manifest = {'name': 'slime', 'topdown': True, 'charH': max(nw, nh), 'originX': 512, 'feetY': 0,
            'parts': [{'name': 'body', 'z': 0, 'w': nw, 'h': nh, 'ox': nw / 2, 'oy': nh / 2, 'ax': 512, 'ay': 0}]}
json.dump(manifest, open(os.path.join(OUT, 'slime.json'), 'w'), indent=1)
print('top-down slime body', nw, 'x', nh)
