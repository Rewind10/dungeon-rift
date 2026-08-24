/* pathfinding.js — flow field (server) */
(function (root, factory) {
  const m = factory((typeof module !== 'undefined' && module.exports) ? require('./constants.js') : root.GAME.Constants);
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Pathfinding = m; }
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';
  function build(grid, w, h, targets) {
    const dist = new Int32Array(w * h).fill(-1); const q = []; let head = 0;
    for (const t of targets) { if (t.gx < 0 || t.gy < 0 || t.gx >= w || t.gy >= h) continue; const i = t.gy * w + t.gx; if (grid[i] === C.T_WALL) continue; if (dist[i] === -1) { dist[i] = 0; q.push(i); } }
    while (head < q.length) { const i = q[head++]; const x = i % w, y = (i / w) | 0; const d = dist[i] + 1;
      if (x + 1 < w) { const j = i + 1; if (dist[j] === -1 && grid[j] !== C.T_WALL) { dist[j] = d; q.push(j); } }
      if (x - 1 >= 0) { const j = i - 1; if (dist[j] === -1 && grid[j] !== C.T_WALL) { dist[j] = d; q.push(j); } }
      if (y + 1 < h) { const j = i + w; if (dist[j] === -1 && grid[j] !== C.T_WALL) { dist[j] = d; q.push(j); } }
      if (y - 1 >= 0) { const j = i - w; if (dist[j] === -1 && grid[j] !== C.T_WALL) { dist[j] = d; q.push(j); } }
    }
    return dist;
  }
  function stepDir(dist, grid, w, h, gx, gy) {
    if (gx < 0 || gy < 0 || gx >= w || gy >= h) return { x: 0, y: 0, d: -1 };
    const here = dist[gy * w + gx]; if (here <= 0) return { x: 0, y: 0, d: here };
    let best = here, bx = gx, by = gy;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      if (ox === 0 && oy === 0) continue; const nx = gx + ox, ny = gy + oy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx; if (grid[ni] === C.T_WALL || dist[ni] < 0) continue;
      if (ox !== 0 && oy !== 0) { if (grid[gy * w + nx] === C.T_WALL || grid[ny * w + gx] === C.T_WALL) continue; }
      if (dist[ni] < best) { best = dist[ni]; bx = nx; by = ny; }
    }
    let dx = bx - gx, dy = by - gy; const l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l, d: here };
  }
  return { build, stepDir };
});
