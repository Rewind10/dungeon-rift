/* input.js — tastiera + mouse (dash = tasto destro/Shift) */
(function () {
  'use strict';
  const Input = {
    keys: {}, mouse: { x: 0, y: 0, down: false, right: false }, dashEdge: false,
    init(canvas) {
      this.canvas = canvas;
      window.addEventListener('keydown', (e) => { if (this._typing()) return; this.keys[e.code] = true; if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab','ShiftLeft','ShiftRight'].includes(e.code)) e.preventDefault(); if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.dashEdge = true; });
      window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
      canvas.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; });
      canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this.mouse.down = true; if (e.button === 2) { this.mouse.right = true; this.dashEdge = true; } });
      window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouse.down = false; if (e.button === 2) this.mouse.right = false; });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener('touchstart', (e) => this._touch(e), { passive: false });
      canvas.addEventListener('touchmove', (e) => this._touch(e), { passive: false });
      canvas.addEventListener('touchend', () => { this.mouse.down = false; });
      // v1.10/v1.11 — FIX input: su perdita focus/visibilita azzeriamo lo stato (evita tasti "incollati").
      // NB (v1.11): NON azzerare su 'contextmenu' — il dash usa il tasto destro e cancellava il movimento!
      window.addEventListener('blur', () => this.clearKeys());
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearKeys(); });
      canvas.addEventListener('mouseleave', () => { this.mouse.down = false; });
    },
    clearKeys() { this.keys = {}; this.mouse.down = false; this.mouse.right = false; this.dashEdge = false; },
    _typing() { const el = document.activeElement; return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'); },
    _touch(e) { e.preventDefault(); const r = this.canvas.getBoundingClientRect(); for (const t of e.touches) { const x = t.clientX - r.left, y = t.clientY - r.top; if (x >= r.width * 0.4) { this.mouse.x = x; this.mouse.y = y; this.mouse.down = true; } } },
    moveVec() { let x = 0, y = 0; if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1; if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1; if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1; if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1; return { x, y }; },
    build(px, py) { if (this._typing()) { this.dashEdge = false; return { mx: 0, my: 0, aim: Math.atan2(this.mouse.y - py, this.mouse.x - px), shoot: false, q: false, e: false, dash: false }; } const mv = this.moveVec(); const aim = Math.atan2(this.mouse.y - py, this.mouse.x - px); const shoot = this.mouse.down || !!this.keys['Space']; const dash = this.dashEdge; this.dashEdge = false; return { mx: mv.x, my: mv.y, aim, shoot, q: !!this.keys['KeyQ'], e: !!this.keys['KeyE'], dash }; },
  };
  window.Input = Input;
})();
