/* mathutils.js — utilità (UMD) */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Math = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const M = {
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
    dist2: (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; },
    len: (x, y) => Math.hypot(x, y),
    norm(x, y) { const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l }; },
    angle: (dx, dy) => Math.atan2(dy, dx),
    turnToward(cur, target, maxStep) { let d = target - cur; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; if (d > maxStep) d = maxStep; if (d < -maxStep) d = -maxStep; return cur + d; },
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    chance: (p) => Math.random() < p,
    circleHit: (ax, ay, ar, bx, by, br) => { const dx = ax - bx, dy = ay - by, r = ar + br; return dx * dx + dy * dy <= r * r; },
    weighted(items) { let total = 0; for (const it of items) total += (it.weight || 0); let r = Math.random() * total; for (const it of items) { r -= (it.weight || 0); if (r <= 0) return it; } return items[items.length - 1]; },
    seedRng(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
  };
  return M;
});
