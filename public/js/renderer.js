/* renderer.js — Canvas 2D: temi, omini, orb XP, item, casse, fuoco, boon-fx, luci */
(function () {
  'use strict';
  const C = window.GAME.Constants, MU = window.GAME.Math, MON = window.GAME.Monsters.MONSTERS, BOSSES = window.GAME.Monsters.BOSSES, HERO = window.GAME.Heroes.HEROES, ITEMS = window.GAME.Loot.ITEMS;
  const ITEM_BY_ID = {}; for (const it of ITEMS) ITEM_BY_ID[it.id] = it;
  const COIN_COL = {}; for (const c of (C.COINS || [])) COIN_COL[c.id] = { color: c.color, r: c.r };

  // ===== v1.19 — TEXTURE ROCCIA procedurale (bump/rilievo + domain-warp) =====
  function _mkNoise(seed) {
    const perm = new Uint8Array(512); let s = (seed >>> 0) || 1; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const base = []; for (let i = 0; i < 256; i++) base[i] = i;
    for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const t = base[i]; base[i] = base[j]; base[j] = t; }
    for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10); const lerp = (a, b, t) => a + (b - a) * t; const grad = (h, x, y) => ((h & 1) ? x : -x) + ((h & 2) ? y : -y);
    return (x, y) => { const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y); const u = fade(x), v = fade(y); const A = perm[X] + Y, B = perm[X + 1] + Y; return lerp(lerp(grad(perm[A], x, y), grad(perm[B], x - 1, y), u), lerp(grad(perm[A + 1], x, y - 1), grad(perm[B + 1], x - 1, y - 1), u), v) * 0.5 + 0.5; };
  }
  function _mkFbm(seed) { const n = _mkNoise(seed); return (x, y, oct, pers, scale) => { oct = oct || 5; pers = pers || 0.55; scale = scale || 1; let a = 1, f = scale, sum = 0, nm = 0; for (let o = 0; o < oct; o++) { sum += n(x * f, y * f) * a; nm += a; a *= pers; f *= 2; } return sum / nm; }; }
  function _mkWorley(seed, cell) { let s = (seed >>> 0) || 7; const h = (i, j) => { let v = ((i * 73856093) ^ (j * 19349663) ^ (s * 83492791)) >>> 0; v = (v ^ (v >> 13)) >>> 0; return v / 4294967296; }; return (x, y) => { const gx = Math.floor(x / cell), gy = Math.floor(y / cell); let d1 = 1e9, d2 = 1e9; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = gx + i, cy = gy + j, fx = (cx + h(cx, cy)) * cell, fy = (cy + h(cy + 5, cx + 9)) * cell, dd = Math.hypot(x - fx, y - fy); if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; } return (d2 - d1) / cell; }; }
  const _hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const _cl = (v) => v < 0 ? 0 : v > 255 ? 255 : v;
  const _toHex2 = (n) => { n = _cl(Math.round(n)); return n.toString(16).padStart(2, '0'); };
  const _darkenHex = (hex, f) => { const c = _hex(hex); return '#' + _toHex2(c[0] * f) + _toHex2(c[1] * f) + _toHex2(c[2] * f); }; // v1.21 — muri quasi neri
  // genera un canvas quadrato di roccia illuminata (heightmap -> bump). size ~192. moss opzionale.
  function _rockTile(seed, size, baseHex, o) {
    const cv = document.createElement('canvas'); cv.width = size; cv.height = size; const g = cv.getContext('2d');
    const img = g.createImageData(size, size), d = img.data;
    const fbm = _mkFbm(seed), wor = _mkWorley(seed + 3, o.cell), sc = o.scale, warp = o.warp, bump = o.bump, base = _hex(baseHex);
    // 1) heightmap (una passata pesante)
    const hm = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const wx = x + (fbm(x * sc * 0.6 + 50, y * sc * 0.6, 4) - 0.5) * warp; const wy = y + (fbm(x * sc * 0.6, y * sc * 0.6 + 90, 4) - 0.5) * warp;
      let hh = fbm(wx * sc, wy * sc, 6); hh = hh * 0.7 + fbm(wx * sc * 2.4 + 11, wy * sc * 2.4, 4) * 0.3;
      const e = wor(wx, wy); if (e < 0.06) hh -= (0.06 - e) * 3.0;
      const cr = fbm(wx * sc * 0.9 + 100, wy * sc * 0.9, 5); if (cr < 0.26) hh -= (0.26 - cr) * 2.0;
      hm[y * size + x] = hh;
    }
    // 2) shading da normali (luce alto-sinistra)
    const Lx = -0.55, Ly = -0.7, Lz = 0.45; const ll = Math.hypot(Lx, Ly, Lz); const lx = Lx / ll, ly = Ly / ll, lz = Lz / ll;
    const at = (x, y) => hm[((y + size) % size) * size + ((x + size) % size)];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const hC = hm[y * size + x]; const hX = at(x + 1, y) - at(x - 1, y), hY = at(x, y + 1) - at(x, y - 1);
      let nx = -hX * bump, ny = -hY * bump, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      let diff = nx * lx + ny * ly + nz * lz; if (diff < 0) diff = 0; const lightF = 0.4 + diff * 0.95; const spec = Math.pow(diff, 22) * 0.5 * 255;
      const tone = 0.8 + hC * 0.5; let r = base[0] * tone, gg = base[1] * tone, b = base[2] * tone;
      const wet = fbm(x * sc * 0.5 + 40, y * sc * 0.5 + 70, 4); if (wet < 0.36) { const k = (0.36 - wet) * 1.4; r *= (1 - 0.32 * k); gg *= (1 - 0.30 * k); b *= (1 - 0.20 * k); }
      if (o.moss) { const ms = fbm(x * sc * 0.6 + 300, y * sc * 0.6 + 200, 4); if (ms > 0.74) { const k = (ms - 0.74) * 2.4; r = r * (1 - 0.4 * k) + 42 * k; gg = gg * (1 - 0.1 * k) + 78 * k; b = b * (1 - 0.4 * k) + 32 * k; } }
      r = r * lightF + spec; gg = gg * lightF + spec; b = b * lightF + spec;
      const gr = fbm(x * 0.9 + 11, y * 0.9 + 3, 2); if (gr > 0.93) { r += 26; gg += 26; b += 30; }
      const px = (y * size + x) * 4; d[px] = _cl(r); d[px + 1] = _cl(gg); d[px + 2] = _cl(b); d[px + 3] = 255;
    }
    g.putImageData(img, 0, 0); return cv;
  }
  // ===== v1.36→v1.39 — RENDER PUPPET (raster ibrido): sprite scomposto in pezzi (PNG) + overlay vettoriale =====
  // Registry generico dei puppet: ogni voce carica manifest + immagini una sola volta.
  // v1.39 — astratto in PUPPETS[key] + PROF[key] (profilo animazione) così aggiungere un nemico = "manifest + profilo".
  function makePuppet(base, file) {
    return {
      ready: false, man: null, imgs: {}, _started: false, base, file,
      load() {
        if (this._started) return; this._started = true; const self = this;
        fetch(this.base + this.file).then(r => r.json()).then(man => {
          self.man = man; let need = man.parts.length, got = 0;
          man.parts.forEach(p => {
            const im = new Image();
            im.onload = () => { self.imgs[p.name] = im; if (++got >= need) self.ready = true; };
            im.onerror = () => { if (++got >= need) self.ready = (Object.keys(self.imgs).length >= need); };
            im.src = self.base + p.name + '.png';
          });
        }).catch(() => {});
      }
    };
  }
  const PUPPETS = {
    ghoul: makePuppet('assets/enemies/ghoul/', 'ghoul.json'),
    mage:  makePuppet('assets/enemies/mage/',  'mage.json'),
    brute: makePuppet('assets/enemies/brute/', 'brute.json'),
    slime: makePuppet('assets/enemies/slime/', 'slime.json'),
    beholder: makePuppet('assets/enemies/beholder/', 'beholder.json'),  // v1.49 — BEHOLDER (raster puppet)
  };
  const GHOUL = PUPPETS.ghoul; // alias di compatibilità
  // ===== v1.47 — SPRITE SHEET (frame-by-frame): personaggi animati "alla vecchio 2.5D" (griglia di frame) =====
  // Ogni sheet carica il manifest + i PNG (uno per animazione). L'anchor (ax,ay) nella cella è ai PIEDI (grounding).
  function makeSheet(base, file) {
    return {
      ready: false, man: null, imgs: {}, _started: false, base, file,
      load() {
        if (this._started) return; this._started = true; const self = this;
        fetch(this.base + this.file).then(r => r.json()).then(man => {
          self.man = man; const names = Object.keys(man.anims); let need = names.length, got = 0;
          names.forEach(k => { const im = new Image(); im.onload = () => { self.imgs[k] = im; if (++got >= need) self.ready = true; }; im.onerror = () => { if (++got >= need) self.ready = (Object.keys(self.imgs).length >= need); }; im.src = self.base + man.anims[k].file; });
        }).catch(() => {});
      }
    };
  }
  const SHEETS = {
    troll: makeSheet('assets/enemies/troll_sheet/', 'troll.json'),
  };
  const _SIN = Math.sin, _TAU = Math.PI * 2, _PI = Math.PI;
  const _bump = (x, c, w) => Math.max(0, 1 - Math.abs(x - c) / w);
  // ---- PROFILI DI ANIMAZIONE per-nemico ----
  // Ogni profilo espone: OY0 (riga d'ancoraggio verticale), K (scala), order (ordine di disegno),
  // gait ('walk'|'float'), eliteFilter (ctx.filter per gli elite) e pose(t,moving,atk) → {P,bob,lungeX,tilt}.
  const PROF = {
    ghoul: {
      OY0: 890, K: 2.7, gait: 'walk', eliteFilter: 'hue-rotate(-38deg) saturate(1.5) brightness(1.05)',
      order: ['legR', 'legL', 'torso', 'head', 'armR', 'armL'],
      WALK: { cad: 1.05, leg: 37, arm: 26, torso: 7, head: 3, bob: 11, sway: 4.5 },
      pose(t, moving, atk) {
        const S = _SIN, TAU = _TAU, PI = _PI, W = this.WALK;
        const ph = moving ? (t * W.cad) % 1 : (t * 0.55) % 1;
        const a = atk || 0, wind = _bump(a, 0.30, 0.30), strike = _bump(a, 0.62, 0.30);
        const P = { legR: [0, 0, 0], legL: [0, 0, 0], torso: [0, 0, 0], head: [0, 0, 0], armR: [0, 0, 0], armL: [0, 0, 0] };
        let bob = 0, lungeX = 0, tilt = 0;
        if (moving) {
          bob = -W.bob + W.bob * Math.abs(S(TAU * ph));
          const lat = W.sway * S(TAU * ph);
          P.legR = [W.leg * S(TAU * ph), 0, 0]; P.legL = [W.leg * S(TAU * ph + PI), 0, 0];
          P.armR = [-W.arm * S(TAU * ph), 0, 0]; P.armL = [-W.arm * S(TAU * ph + PI), 0, 0];
          P.torso = [W.torso * S(TAU * ph), lat, 0]; P.head = [-W.head * S(TAU * ph), lat * 0.6, 0];
          tilt = 3.5; // v1.39 — leggera inclinazione in avanti nel movimento
        } else {
          bob = 6 * S(TAU * ph);
          P.head = [3 * S(TAU * ph), 0, 2 * S(TAU * ph + 0.5)];
          P.armR = [4 * S(TAU * ph), 0, 0]; P.armL = [-4 * S(TAU * ph), 0, 0];
          P.torso = [1.5 * S(TAU * ph), 0, 0];
        }
        if (a > 0.001) {
          P.armR[0] += -30 * wind; P.armR[2] += -30 * wind; P.armL[0] += 30 * wind; P.armL[2] += -30 * wind;
          P.torso[0] += -5 * wind; P.head[2] += -10 * wind;
          P.armR[0] += 74 * strike; P.armR[2] += 26 * strike; P.armL[0] += -74 * strike; P.armL[2] += 26 * strike;
          P.torso[0] += 11 * strike; P.head[2] += 24 * strike; P.legR[0] += 10 * strike; P.legL[0] += -10 * strike;
          lungeX += 30 * strike; tilt += 6 * strike;
        }
        return { P, bob, lungeX, tilt, swing: Math.max(wind * 0.5, strike) };
      },
      death(p) { // crollo: gambe cedono, busto affonda, testa rotola via
        const P = { legR: [40 * p, -6 * p, 30 * p], legL: [-40 * p, 6 * p, 30 * p], torso: [10 * p, 0, 34 * p], head: [70 * p, 46 * p, 40 * p], armR: [50 * p, 0, 20 * p], armL: [-50 * p, 0, 20 * p] };
        return { P, bob: 26 * p, lungeX: 0, tilt: 0, alpha: 1 - p };
      }
    },
    mage: {
      OY0: 900, K: 2.7, gait: 'float', eliteFilter: 'hue-rotate(20deg) saturate(1.6) brightness(1.12)',
      order: ['robe', 'armStaff', 'torso', 'armHand', 'head'],
      pose(t, moving, atk) {
        const S = _SIN, TAU = _TAU;
        const a = atk || 0, wind = _bump(a, 0.32, 0.30), strike = _bump(a, 0.66, 0.28);
        const fl = t * 0.9; // fluttuazione lenta
        const P = { robe: [0, 0, 0], armStaff: [0, 0, 0], torso: [0, 0, 0], armHand: [0, 0, 0], head: [0, 0, 0] };
        let bob = 5 * S(TAU * fl * 0.5), lungeX = 0, tilt = 0;              // galleggia su/giù
        P.robe = [2.6 * S(TAU * fl * 0.42), 0, 0];                          // veste a campana ondeggia (pendolo)
        P.torso = [1.4 * S(TAU * fl * 0.42), 0, 0];
        P.head = [2.2 * S(TAU * fl * 0.5 + 0.6), 0, 1.5 * S(TAU * fl * 0.5)];
        P.armStaff = [3 * S(TAU * fl * 0.5), 0, 2 * S(TAU * fl * 0.5)];     // bastone dondola
        P.armHand = [-5 * S(TAU * fl * 0.46), 0, 0];
        if (moving) tilt = 2.5;
        if (a > 0.001) { // CAST: alza il bastone (wind) poi proietta (strike) con leggero rinculo
          P.armStaff[0] += -34 * wind; P.armStaff[2] += -16 * wind; P.head[2] += -8 * wind; P.torso[0] += -4 * wind;
          P.armStaff[0] += 18 * strike; P.armHand[0] += -30 * strike; P.armHand[2] += 22 * strike;
          P.head[2] += 12 * strike; P.torso[0] += 6 * strike; bob += -6 * strike; lungeX += 10 * strike; tilt += 4 * strike;
        }
        return { P, bob, lungeX, tilt, swing: Math.max(wind * 0.6, strike), cast: Math.max(wind, strike) };
      },
      death(p) { // la veste si accascia, il cappuccio cade, il bastone crolla
        const P = { robe: [0, 0, 40 * p], armStaff: [-46 * p, -20 * p, 26 * p], torso: [8 * p, 0, 30 * p], armHand: [40 * p, 10 * p, 24 * p], head: [60 * p, 34 * p, 46 * p] };
        return { P, bob: 30 * p, lungeX: 0, tilt: 0, alpha: 1 - p };
      }
    },
    // v1.42 — BRUTO DELLE CAVERNE: tank pesante. Le BRACCIA sono la firma → pivot alla SPALLA, grandi
    // dondolii in camminata e SLAM a due tempi (carica all'indietro → schianto del busto in avanti/giù).
    brute: {
      OY0: 760, K: 2.55, gait: 'walk', eliteFilter: 'hue-rotate(-12deg) saturate(1.6) brightness(1.12)',
      order: ['legR', 'legL', 'torso', 'armR', 'armL', 'head'],   // braccia enormi davanti al busto, testa in cima
      // v1.43 — camminata LUMBERING (distinta dallo zombie): braccia che dondolano poco e IN SINCRONIA (knuckle-drag),
      // grande rollio delle spalle, waddle laterale marcato, busto perennemente proteso in avanti.
      // v1.46 — camminata RIFATTA per togliere il "tremore": UN solo dondolio lento e ampio, gambe con sollevamento
      // MORBIDO (mezzo-coseno, niente scatti), niente rollio nervoso delle spalle, fase SEMPRE continua.
      WALK: { cad: 0.9, leg: 30, lift: 18, armSwing: 14, torso: 3, head: 1.5, bob: 9, sway: 4.5, lean: 6 },
      pose(t, moving, atk) {
        const S = _SIN, TAU = _TAU, PI = _PI, W = this.WALK;
        const ph = (t * W.cad) % 1;                                  // fase CONTINUA (mai reset → niente scatti)
        const a = atk || 0, wind = _bump(a, 0.30, 0.28), strike = _bump(a, 0.66, 0.26);
        const P = { legR: [0, 0, 0], legL: [0, 0, 0], torso: [0, 0, 0], armR: [0, 0, 0], armL: [0, 0, 0], head: [0, 0, 0] };
        let bob = 0, lungeX = 0, tilt = 0;
        if (moving) {
          const s2 = S(TAU * ph), c2 = S(TAU * ph + PI);
          bob = -W.bob * 0.5 + W.bob * Math.abs(s2);                 // ondeggio verticale MORBIDO
          const lat = W.sway * s2;                                   // waddle contenuto
          // gambe: falcata + sollevamento del piede con MEZZO-COSENO (0→1→0 liscio, senza kink)
          const liftR = -W.lift * (0.5 - 0.5 * Math.cos(TAU * ph)), liftL = -W.lift * (0.5 - 0.5 * Math.cos(TAU * ph + PI));
          P.legR = [W.leg * s2, 0, liftR]; P.legL = [W.leg * c2, 0, liftL];
          // braccia enormi: UNICO dondolio lento IN SINCRONIA (niente rollio delle spalle che tremolava)
          P.armR = [W.armSwing * s2, 0, 0]; P.armL = [W.armSwing * s2, 0, 0];
          P.torso = [W.torso * s2, lat, 0]; P.head = [-W.head * s2, lat * 0.6, 0];
          tilt = W.lean;                                             // busto proteso in avanti (knuckle-drag)
        } else { // IDLE: respiro pesante, spalle su/giù, braccia che ciondolano lente
          bob = 7 * S(TAU * ph);
          P.armR = [4 * S(TAU * ph), 0, 0]; P.armL = [4 * S(TAU * ph), 0, 0];
          P.torso = [1.4 * S(TAU * ph), 0, 0]; P.head = [2 * S(TAU * ph + 0.5), 0, 1.4 * S(TAU * ph)]; tilt = 2;
        }
        if (a > 0.001) { // v1.43 — SLAM: ALZA i pugni SOPRA LA TESTA (wind) → li SCHIANTA a terra (strike)
          // WIND: si erge sulle punte, si inarca all'indietro, entrambe le braccia ruotano IN ALTO oltre la testa
          P.armR[0] += 140 * wind; P.armL[0] += -140 * wind;         // pugni sopra la testa (simmetrico)
          P.head[2] += -20 * wind; P.torso[0] += -8 * wind; bob += -16 * wind; tilt += -8 * wind;
          // STRIKE: dai pugni-in-alto SCENDONO a martello convergendo avanti-basso; il corpo SI ABBATTE con forza
          P.armR[0] += 40 * strike; P.armL[0] += -40 * strike;
          P.head[2] += 32 * strike; P.torso[0] += 16 * strike; P.legR[0] += 10 * strike; P.legL[0] += -10 * strike;
          bob += 34 * strike; lungeX += 30 * strike; tilt += 22 * strike; // v1.44 — affondo più profondo e deciso
        }
        return { P, bob, lungeX, tilt, swing: Math.max(wind * 0.6, strike) };
      },
      death(p) { // crolla in avanti: braccia si accasciano, testa cade, il corpo si abbatte
        const P = { legR: [24 * p, -6 * p, 24 * p], legL: [-24 * p, 6 * p, 24 * p], torso: [10 * p, 0, 30 * p], armR: [40 * p, 0, 26 * p], armL: [-40 * p, 0, 26 * p], head: [50 * p, 30 * p, 40 * p] };
        return { P, bob: 30 * p, lungeX: 8 * p, tilt: 10 * p, alpha: 1 - p };
      }
    },
    // v1.45 — MELMA CORROSIVA: un solo pezzo (blob) animato con SQUASH & STRETCH (sx/sy attorno alla base).
    // MOVIMENTO = STRISCIA (peristaltico, resta a terra, NIENTE salto). SALTO solo in ATTACCO (sputa acido).
    // Overlay: occhi che si illuminano nella DIREZIONE DI MOVIMENTO + aura/edge-glow verde + bolle acide.
    beholder: {  // profilo minimale: il render VIVO e' dedicato (_beholderPuppet); qui serve solo alla morte generica
      OY0: 0, K: 2.6, gait: 'float', eliteFilter: 'hue-rotate(-16deg) saturate(1.6) brightness(1.12)',
      order: ['body'],
      pose(t, moving, atk) { const S = _SIN; return { P: { body: [0, 0, 0] }, bob: 4 * S(t * 1.6), lungeX: 0, tilt: 0, sx: 1, sy: 1, swing: 0 }; },
      death(p) { return { P: { body: [0, 0, 0] }, bob: 0, lungeX: 0, tilt: 0, sx: 1 + 0.25 * p, sy: Math.max(0.05, 1 - 0.9 * p), alpha: 1 - p }; }
    },
    slime: {
      OY0: 700, K: 2.5, gait: 'crawl', eliteFilter: 'hue-rotate(-18deg) saturate(1.7) brightness(1.12)',
      order: ['body'],
      pose(t, moving, atk) {
        const S = _SIN, TAU = _TAU;
        const a = atk || 0, wind = _bump(a, 0.32, 0.28), strike = _bump(a, 0.66, 0.26);
        const P = { body: [0, 0, 0] };
        let bob = 0, lungeX = 0, sx = 1, sy = 1;
        if (moving) { // STRISCIA: onda peristaltica — si allunga in avanti poi si contrae, SEMPRE a terra (no hop)
          const ph = (t * 1.15) % 1, cr = S(TAU * ph);
          sx = 1 + 0.16 * cr;                 // si stira/contrae in orizzontale
          sy = 1 - 0.11 * cr;                 // resta basso e schiacciato
          bob = 1.5 * Math.abs(cr);           // pochissimo: NON salta
          lungeX = 6 * S(TAU * ph - 0.6);     // avanzamento pulsante (scivola)
        } else { // IDLE: gelatina che "respira" (jiggle morbido)
          const j = S(TAU * (t * 0.8));
          sx = 1 + 0.045 * j; sy = 1 - 0.045 * j; bob = 1.4 * S(TAU * (t * 0.8) + 1);
        }
        if (a > 0.001) { // ATTACCO: si comprime (carica) → SALTA in alto sputando l'acido (unico momento in cui si stacca da terra)
          sx += 0.22 * wind - 0.16 * strike;
          sy += -0.22 * wind + 0.30 * strike;   // si allunga verso l'alto nel salto
          bob += -34 * strike;                   // SALTO (solo in attacco)
          lungeX += 12 * strike;
        }
        return { P, bob, lungeX, tilt: 0, sx, sy, swing: Math.max(wind * 0.5, strike), moving: !!moving };
      },
      death(p) { // si scioglie: si appiattisce a terra e svanisce
        return { P: { body: [0, 0, 0] }, bob: 6 * p, lungeX: 0, tilt: 0, sx: 1 + 0.55 * p, sy: Math.max(0.05, 1 - 0.85 * p), alpha: 1 - p };
      }
    }
  };
  const R = {
    canvas: null, ctx: null, w: 0, h: 0, dpr: 1, cam: { x: 0, y: 0 }, shake: 0,
    particles: [], floaters: [], flashes: [], chains: [], swings: [], atk: {}, levelUps: [], map: null, mapCanvas: null, minimapCanvas: null, mm: null, torches: [], campfires: [], theme: null, time: 0,
    torch: true, darkCv: null, darkCtx: null, darkScale: 0.5, darkness: 0.86, haloR: 260, dust: [], fog: [], critters: [],  // v1.17/1.23 — torcia + nebbia + animaletti (rune rimosse)
    mAtk: {}, deaths: [],  // v1.26 — animazioni di attacco (per eid) e di morte (sprite effimeri)
    init(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); for (const k in PUPPETS) PUPPETS[k].load(); for (const k in SHEETS) SHEETS[k].load(); this.resize(); window.addEventListener('resize', () => this.resize()); try { this.torch = localStorage.getItem('dr_torch') !== '0'; } catch (_) {} window.addEventListener('keydown', (e) => { if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return; if (e.code === 'KeyL') { this.torch = !this.torch; try { localStorage.setItem('dr_torch', this.torch ? '1' : '0'); } catch (_) {} } }); },
    resize() { this.dpr = Math.min(2, window.devicePixelRatio || 1); this.w = innerWidth; this.h = innerHeight; this.canvas.width = this.w * this.dpr; this.canvas.height = this.h * this.dpr; this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px'; this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); if (!this.darkCv) { this.darkCv = document.createElement('canvas'); this.darkCtx = this.darkCv.getContext('2d'); } this.darkCv.width = Math.max(1, Math.round(this.w * this.darkScale)); this.darkCv.height = Math.max(1, Math.round(this.h * this.darkScale)); },
    setMap(map) { this.map = map; this.theme = map.theme || {}; this._bake(); this._bakeMinimap(); },
    // =====================================================================================
    // v1.76 — LA CAVERNA DIPINTA. Vale solo per le mappe di COMBATTIMENTO: il villaggio ha il suo
    // aspetto e resta com'e'.
    //
    // Le tre regole, misurate sulle battlemap disegnate invece che scelte a occhio:
    //   1. GERARCHIA DEL RUMORE. Il pavimento e' QUIETO (macchie morbide, crepe lunghe, nessun
    //      contorno), i muri sono RUMOROSI (massa scura, massi col contorno spesso, ombra proiettata
    //      dentro la stanza). Se pavimento e muri hanno la stessa grana l'occhio non capisce dove si
    //      cammina — l'ho sbagliato due volte prima di capirlo.
    //   2. LUMINOSITA'. Le battlemap dipinte hanno luminanza mediana 44. Il gioco stava a 18: era
    //      cosi' buio che non si vedeva niente di quello che c'era.
    //   3. DENSITA' DI CONTORNI. Nei riferimenti il 6,6% dei pixel e' un bordo forte; nel gioco
    //      l'1,3%. E' quella la differenza fra "disegnato" e "sfumato".
    //
    // Si cuoce UNA volta quando nasce la mappa, in una tela fuori schermo: a fotogramma e' un solo
    // drawImage, esattamente come prima.
    _bakeCaverna(g, m, T, th) {
      const W = m.w, H = m.h, PW = W * T, PH = H * T;
      let _s = ((m.seed >>> 0) || 1) ^ 0x9e3779b9;
      const rnd = () => (_s = (_s * 1664525 + 1013904223) >>> 0) / 4294967296;
      const rr = (a, b) => a + rnd() * (b - a), ri = (a, b) => Math.floor(rr(a, b + 1));
      const suolo = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m.grid[y * W + x] !== C.T_WALL;
      const mix = (h1, h2, t) => { const a = this._hexToRgb(h1), b = this._hexToRgb(h2);
        return 'rgb(' + Math.round(a.r + (b.r - a.r) * t) + ',' + Math.round(a.g + (b.g - a.g) * t) + ',' + Math.round(a.b + (b.b - a.b) * t) + ')'; };
      // la palette esce dal TEMA, cosi' cripta, lava, ghiaccio, foresta e arcano restano diversi:
      // cambia il modo di disegnare, non l'identita' della mappa
      const base = th.floorB || '#151a26', chiaro = '#c9d2dc', scuro = '#0a0e14';
      const PAV = [mix(base, chiaro, .34), mix(base, chiaro, .28), mix(base, chiaro, .40), mix(base, chiaro, .23), mix(base, chiaro, .45)];
      const ROC = [mix(th.wall || '#1b2036', chiaro, .18), mix(th.wall || '#1b2036', chiaro, .12), mix(th.wallTop || '#262d4a', chiaro, .16)];
      const ROC_T = mix(th.wallTop || '#262d4a', chiaro, .34), ROC_S = mix(th.wall || '#1b2036', scuro, .45);
      const INK = mix(scuro, th.wall || '#1b2036', .18);
      const MUSCO = mix(th.accent || '#4d6b46', scuro, .35);
      const blob = (cx, cy, r, n, jit, ovalY) => { g.beginPath();
        for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rad = r * (1 - jit / 2 + rnd() * jit);
          const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad * (ovalY || 1);
          i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
      const inchiostro = (w) => { g.strokeStyle = INK; g.lineWidth = w; g.lineJoin = 'round'; g.stroke(); };

      // ---- 1. PAVIMENTO, quieto. Si cuoce a parte e si ritaglia sul calpestabile.
      const pav = document.createElement('canvas'); pav.width = PW; pav.height = PH;
      const p = pav.getContext('2d');
      p.fillStyle = PAV[0]; p.fillRect(0, 0, PW, PH);
      const nMac = Math.round(PW * PH / 1750);
      for (let i = 0; i < nMac; i++) { const x = rr(0, PW), y = rr(0, PH), r = rr(34, 150);
        const gr = p.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, PAV[(rnd() * PAV.length) | 0]); gr.addColorStop(1, 'rgba(0,0,0,0)');
        p.globalAlpha = rr(.05, .15); p.fillStyle = gr; p.beginPath(); p.arc(x, y, r, 0, 7); p.fill(); }
      p.globalAlpha = 1; p.lineCap = 'round';
      // crepe: poche, lunghe, sottili. Sono il dettaglio, non il rumore.
      for (let k = 0, nk = Math.round(PW * PH / 82000); k < nk; k++) {
        let x = rr(0, PW), y = rr(0, PH), a = rr(0, 6.28);
        p.strokeStyle = 'rgba(18,24,30,' + rr(.22, .46).toFixed(3) + ')'; p.lineWidth = rr(1.2, 3.2);
        p.beginPath(); p.moveTo(x, y);
        for (let i = 0; i < 16; i++) { a += rr(-.5, .5); x += Math.cos(a) * rr(16, 38); y += Math.sin(a) * rr(16, 38); p.lineTo(x, y); }
        p.stroke(); }
      // giunti di lastrone appena accennati: danno la scala senza fare reticolo
      for (let k = 0, nk = Math.round(PW * PH / 150000); k < nk; k++) {
        let x = rr(0, PW), y = rr(0, PH), a = (ri(0, 1) ? 0 : 1.5708) + rr(-.12, .12);
        p.strokeStyle = 'rgba(26,34,42,.26)'; p.lineWidth = rr(2, 4.5);
        p.beginPath(); p.moveTo(x, y);
        for (let i = 0; i < 6; i++) { a += rr(-.13, .13); x += Math.cos(a) * rr(44, 100); y += Math.sin(a) * rr(44, 100); p.lineTo(x, y); }
        p.stroke(); }
      // terra battuta attorno alle camere: e' quella che disegna i passaggi consumati
      for (const c of (m.camere || [])) { const cx = c.x * T, cy = c.y * T;
        for (let i = 0; i < 40; i++) { const x = cx + rr(-240, 240), y = cy + rr(-175, 175), r = rr(45, 115);
          const gr = p.createRadialGradient(x, y, 0, x, y, r);
          gr.addColorStop(0, mix(base, '#8a7a58', .55)); gr.addColorStop(1, 'rgba(0,0,0,0)');
          p.globalAlpha = rr(.07, .18); p.fillStyle = gr; p.beginPath(); p.arc(x, y, r, 0, 7); p.fill(); } }
      p.globalAlpha = 1;
      g.save(); g.beginPath();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (suolo(x, y)) g.rect(x*T - 6, y*T - 6, T + 12, T + 12);
      g.clip(); g.drawImage(pav, 0, 0); g.restore();

      // ---- 2. MURI, rumorosi.
      const bordo = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (suolo(x, y)) continue;
        for (const d of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])
          if (suolo(x + d[0], y + d[1])) { bordo.push([x, y]); break; } }
      // 2a — l'ombra che la parete getta DENTRO la stanza: e' quella che da' l'altezza alla roccia
      for (let k = 0; k < bordo.length; k++) { const cx = bordo[k][0]*T + T/2, cy = bordo[k][1]*T + T/2;
        const gr = g.createRadialGradient(cx, cy + 16, 6, cx, cy + 16, T * 1.6);
        gr.addColorStop(0, 'rgba(4,7,11,.8)'); gr.addColorStop(1, 'rgba(4,7,11,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy + 16, T * 1.6, 0, 7); g.fill(); }
      // 2b — la massa, quasi nera: e' cosi' che la caverna si stacca di netto dal fondo
      g.fillStyle = mix(th.wall || '#1b2036', scuro, .55);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!suolo(x, y)) g.fillRect(x*T - 1, y*T - 1, T + 2, T + 2);
      // 2c — i massi, SOLO sul bordo, in ordine di profondita' cosi' quelli davanti coprono i dietro
      const massi = [];
      for (let k = 0; k < bordo.length; k++) for (let q = 0; q < 3; q++)
        massi.push({ x: bordo[k][0]*T + T/2 + rr(-19, 19), y: bordo[k][1]*T + T/2 + rr(-19, 19), r: rr(22, 42) });
      massi.sort((a, b) => a.y - b.y);
      for (const mm of massi) {
        g.fillStyle = 'rgba(6,10,14,.5)'; g.beginPath();
        g.ellipse(mm.x + 6, mm.y + mm.r * .5, mm.r, mm.r * .42, 0, 0, 7); g.fill();
        blob(mm.x, mm.y, mm.r, 10, .3, .84); g.fillStyle = ROC[(rnd() * ROC.length) | 0]; g.fill(); inchiostro(3.2);
        blob(mm.x - mm.r*.14, mm.y - mm.r*.26, mm.r*.6, 9, .34, .76);
        g.fillStyle = ROC_T; g.globalAlpha = .5; g.fill(); g.globalAlpha = 1;
        g.strokeStyle = ROC_S; g.lineWidth = 2.2;
        for (let k = 0; k < 2; k++) { g.beginPath();
          let px = mm.x + rr(-mm.r*.6, mm.r*.6), py = mm.y - mm.r*.55;
          g.moveTo(px, py); for (let i = 0; i < 3; i++) { px += rr(-11, 11); py += rr(8, 18); g.lineTo(px, py); } g.stroke(); }
        if (rnd() < .3) { blob(mm.x + rr(-mm.r*.5, mm.r*.5), mm.y - mm.r*.5, rr(7, 14), 8, .5, .7);
          g.fillStyle = MUSCO; g.globalAlpha = .45; g.fill(); g.globalAlpha = 1; }
      }

      // ---- 3. IL PIETRISCO. Senza, il pavimento resta un piazzale: misurato, la densita' di
      // contorni si ferma al 3,5% contro il 6,6% delle battlemap disegnate. Sono massi, macerie e
      // ossa sparse, e valgono la regola gia' pagata sui pilastri del villaggio: un oggetto
      // appoggiato per terra dev'essere PIU' CHIARO del pavimento, se no dall'alto e' una buca.
      const OGG = [mix(base, chiaro, .52), mix(base, chiaro, .46), mix(base, chiaro, .58)];
      const OGG_T = mix(base, chiaro, .70), OGG_S = mix(base, scuro, .30), OSSO = mix(chiaro, '#e8e2c8', .6);
      const masso = (gx, gy, r) => {
        g.fillStyle = 'rgba(8,12,16,.42)'; g.beginPath();
        g.ellipse(gx + 4, gy + r * .5, r, r * .4, 0, 0, 7); g.fill();
        blob(gx, gy, r, 9, .34, .82); g.fillStyle = OGG[(rnd() * OGG.length) | 0]; g.fill(); inchiostro(2.4);
        blob(gx - r*.16, gy - r*.24, r*.55, 8, .36, .74);
        g.fillStyle = OGG_T; g.globalAlpha = .42; g.fill(); g.globalAlpha = 1;
        // la crepa va misurata SUL SASSO: a passo fisso usciva dal contorno e ogni pietra si
        // ritrovava un antenna attaccata. Solo sui massi abbastanza grandi da mostrarla.
        if (r > 9) { g.strokeStyle = OGG_S; g.lineWidth = 1.6; g.beginPath();
          let px2 = gx + rr(-r*.35, r*.35), py2 = gy - r*.5;
          g.moveTo(px2, py2);
          for (let i = 0; i < 3; i++) { px2 += rr(-r*.22, r*.22); py2 += r * .33; g.lineTo(px2, py2); }
          g.stroke(); }
      };
      // dove si puo' appoggiare: serve il 3x3 libero, cosi' niente pietrisco a meta' dentro la roccia
      const posabile = (wx, wy) => { const tx = (wx / T) | 0, ty = (wy / T) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!suolo(tx + dx, ty + dy)) return false;
        return true; };
      const occ = [];
      const posto = (distMin) => { for (let k = 0; k < 60; k++) {
          const wx = rr(T * 2, PW - T * 2), wy = rr(T * 2, PH - T * 2);
          if (!posabile(wx, wy)) continue;
          let male = false;
          for (const o of occ) if (Math.hypot(wx - o[0], wy - o[1]) < distMin) { male = true; break; }
          if (male) continue;
          occ.push([wx, wy]); return [wx, wy]; }
        return null; };
      const K = PW * PH / (1400 * 1000);
      const quanti = (n) => Math.round(n * K);
      // massi singoli, sparsi
      for (let i = 0; i < quanti(15); i++) { const q = posto(95); if (q) masso(q[0], q[1], rr(7, 17)); }
      // grappoli di macerie
      for (let i = 0; i < quanti(7); i++) { const q = posto(210); if (!q) continue;
        for (let k = 0, n = ri(4, 8); k < n; k++) masso(q[0] + rr(-40, 40), q[1] + rr(-30, 30), rr(6, 15)); }
      // ossa: il contrasto chiaro che rompe il grigio
      for (let i = 0; i < quanti(6); i++) { const q = posto(230); if (!q) continue;
        for (let k = 0, n = ri(2, 5); k < n; k++) {
          g.save(); g.translate(q[0] + rr(-38, 38), q[1] + rr(-28, 28)); g.rotate(rr(0, 6.28));
          g.fillStyle = OSSO; g.strokeStyle = INK; g.lineWidth = 1.9;
          g.beginPath(); g.roundRect(-8, -2, 16, 4, 2); g.fill(); g.stroke();
          g.beginPath(); g.arc(-8,-1.8,2.3,0,7); g.arc(-8,1.8,2.3,0,7); g.arc(8,-1.8,2.3,0,7); g.arc(8,1.8,2.3,0,7);
          g.fill(); g.stroke(); g.restore(); } }
      // chiazze scure: sporco, muffa, bruciato. Non hanno contorno: sono pavimento, non oggetti.
      for (let i = 0; i < quanti(11); i++) { const wx = rr(T, PW - T), wy = rr(T, PH - T);
        if (!posabile(wx, wy)) continue;
        blob(wx, wy, rr(30, 62), 11, .4, .68); g.fillStyle = 'rgba(20,26,24,.24)'; g.fill(); }
    },
    _bake() {
      const m = this.map; if (!m) return; const T = m.tile; const th = this.theme || {};
      const fA = th.floorA || '#12161f', fB = th.floorB || '#151a26', wl = th.wall || '#1b2036', wt = th.wallTop || '#262d4a', hz = th.hazard || '#ff5a1e', tint = th.tint || 'rgba(60,90,60,.15)';
      const cv = document.createElement('canvas'); cv.width = m.w * T; cv.height = m.h * T; const g = cv.getContext('2d');
      g.fillStyle = '#0a0c14'; g.fillRect(0, 0, cv.width, cv.height);
      // v1.18 — CAVERNA organica: pavimento "terra" + muri "roccia" (niente griglia), pozze uniche con profondità
      const HSH = (x, y) => { let h = (x * 374761393 + y * 668265263) >>> 0; h = (h ^ (h >> 13)) >>> 0; return (h % 1000) / 1000; };
      const gt = (gx, gy) => (gx < 0 || gy < 0 || gx >= m.w || gy >= m.h) ? C.T_WALL : m.grid[gy * m.w + gx];
      this.hazards = [];
      // STEP A — v1.19 TEXTURE ROCCIA: pavimento e muri con roccia realistica (bump + domain-warp), colorata sul tema
      const seedBase = (m.seed >>> 0) || 1;
      const floorTex = _rockTile(seedBase + 101, 192, fB, { scale: 0.055, warp: 26, bump: 3.4, cell: 96, moss: true });
      const wlDark = _darkenHex(wl, 0.15); // v1.23 — muri quasi neri (contrasto forte col pavimento)
      const wallTex = _rockTile(seedBase + 202, 192, wlDark, { scale: 0.05, warp: 30, bump: 4.0, cell: 110, moss: false });
      const floorPat = g.createPattern(floorTex, 'repeat'), wallPat = g.createPattern(wallTex, 'repeat');
      // pavimento ovunque (sotto ai muri), poi roccia-muro sopra le celle muro
      // v1.76 — le mappe di COMBATTIMENTO passano dalla cottura nuova (caverna dipinta). Il
      // villaggio (m.market) tiene la sua, che e' fatta apposta per le micro-stanze.
      const _nuova = !m.market;
      if (_nuova) this._bakeCaverna(g, m, T, th);
      else { g.fillStyle = floorPat; g.fillRect(0, 0, cv.width, cv.height); }
      if (!_nuova) for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { if (m.grid[y * m.w + x] !== C.T_WALL) continue; const px = x * T, py = y * T; g.save(); g.beginPath(); g.rect(px, py, T, T); g.clip(); g.fillStyle = wallPat; g.fillRect(px, py, T, T); g.restore(); }
      // v1.75 — IL PAVIMENTO DI OGNI STANZA. Il villaggio non e' piu' una sala sola: la taverna ha le assi,
      // la fucina la pietra bruciata, l'antro il suo colore. Senza questo le sei stanze sarebbero sei
      // scatole con lo stesso fondo, e la pianta non si leggerebbe.
      for (const f of (m.floors || [])) {
        for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) {
          if (m.grid[y * m.w + x] === C.T_WALL) continue;
          const px = x * T, py = y * T;
          g.fillStyle = f.col; g.fillRect(px, py, T, T);
          if (f.kind === 'lastre') {  // lastroni squadrati: la piazza e le stanze in pietra
            g.strokeStyle = 'rgba(0,0,0,.24)'; g.lineWidth = 1.4; g.strokeRect(px + 1.5, py + 1.5, T - 3, T - 3);
            g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; g.strokeRect(px + 2.5, py + 2.5, T - 5, T - 5);
          } else if (f.kind === 'terra') {   // battuto: nessuna geometria, solo grana
            for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.05 + Math.random() * 0.07).toFixed(3) + ')';
              g.fillRect(px + Math.random() * T, py + Math.random() * T, 3, 2); }
          }
        }
        // il LEGNO va disegnato sulla stanza intera, non tile per tile: assi lunghe che l'attraversano,
        // con le giunzioni sfalsate. Fatto a mattoncini sembrava un muro appoggiato per terra.
        if (f.kind === 'legno') {
          const X0 = f.x0 * T, Y0 = f.y0 * T, W = (f.x1 - f.x0 + 1) * T, H = (f.y1 - f.y0 + 1) * T;
          g.save(); g.beginPath();
          for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++)
            if (m.grid[y * m.w + x] !== C.T_WALL) g.rect(x * T, y * T, T, T);
          g.clip();
          const asse = T * 0.62;
          for (let yy = Y0; yy < Y0 + H; yy += asse) {
            g.fillStyle = ((yy / asse) | 0) % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)';
            g.fillRect(X0, yy, W, asse);
            g.strokeStyle = 'rgba(0,0,0,.34)'; g.lineWidth = 1.6;
            g.beginPath(); g.moveTo(X0, yy); g.lineTo(X0 + W, yy); g.stroke();
            g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1;
            g.beginPath(); g.moveTo(X0, yy + 1.6); g.lineTo(X0 + W, yy + 1.6); g.stroke();
            const off = (((yy / asse) | 0) % 3) * T * 1.1;
            g.strokeStyle = 'rgba(0,0,0,.30)'; g.lineWidth = 1.4;
            for (let jx = X0 + off; jx < X0 + W; jx += T * 3.2) { g.beginPath(); g.moveTo(jx, yy); g.lineTo(jx, yy + asse); g.stroke(); }
          }
          g.restore();
        }
      }

      // v1.76 — STEP C e C2 sono allineati alla TESSERA: sopra i massi tondi della caverna dipinta
      // uscivano come rettangoli chiari incollati alla roccia. La cottura nuova fa gia' la sua ombra
      // proiettata e la sua faccia in luce, quindi per le mappe di combattimento si saltano.
      if (!_nuova) {
      // STEP C — v1.22 OMBRA MARCATA muro→pavimento: drop-shadow forte + linea di contatto scura = stacco netto
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        if (m.grid[y * m.w + x] === C.T_WALL) continue; const px = x * T, py = y * T;
        if (gt(x, y - 1) === C.T_WALL) { const gr = g.createLinearGradient(0, py, 0, py + T * 0.62); gr.addColorStop(0, 'rgba(0,0,0,.86)'); gr.addColorStop(0.4, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(px, py, T, T * 0.62); g.fillStyle = 'rgba(0,0,0,.9)'; g.fillRect(px, py, T, 3); }
        if (gt(x, y + 1) === C.T_WALL) { const gr = g.createLinearGradient(0, py + T, 0, py + T * 0.55); gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(px, py + T * 0.55, T, T * 0.45); g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(px, py + T - 3, T, 3); }
        if (gt(x - 1, y) === C.T_WALL) { const gr = g.createLinearGradient(px, 0, px + T * 0.55, 0); gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(px, py, T * 0.55, T); g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(px, py, 3, T); }
        if (gt(x + 1, y) === C.T_WALL) { const gr = g.createLinearGradient(px + T, 0, px + T * 0.45, 0); gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(px + T * 0.45, py, T * 0.55, T); g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(px + T - 3, py, 3, T); }
      }
      // STEP C2 — cresta illuminata in cima ai muri esposti
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { if (m.grid[y * m.w + x] !== C.T_WALL) continue; if (gt(x, y - 1) !== C.T_WALL) { const px = x * T, py = y * T; const gr = g.createLinearGradient(0, py, 0, py + T * 0.6); gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(px, py, T, T * 0.6); } }
      // v1.23 — DETTAGLI TERRENO: rocce, ciottoli, buche/crateri (pavimento meno piatto, non bloccanti)
      // v1.56 — nel VILLAGGIO restano solo i ciottoli: massi, buche e crepe facevano sembrare la piazza
      // un crollo, non un posto dove qualcuno vive e vende.
      const village = !!m.market;
      for (let y = 2; y < m.h - 2; y++) for (let x = 2; x < m.w - 2; x++) {
        if (m.grid[y * m.w + x] !== C.T_FLOOR) continue; const px = x * T, py = y * T;
        const r1 = HSH(x * 5 + 1, y * 7 + 2), r2 = HSH(x * 3 + 9, y * 11 + 4), r3 = HSH(x * 13 + 5, y * 2 + 7);
        const cx = px + T * (0.22 + r1 * 0.56), cy = py + T * (0.22 + r2 * 0.56);
        if (r3 < 0.11 && !village) { // masso / roccia
          const ss = 5 + r1 * 6; const gr = g.createLinearGradient(cx, cy - ss, cx, cy + ss); gr.addColorStop(0, '#474d5a'); gr.addColorStop(1, '#232935'); 
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(cx, cy + ss * 0.85, ss * 0.95, ss * 0.4, 0, 0, 7); g.fill();
          g.fillStyle = gr; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - ss, cy + ss * 0.4); g.lineTo(cx - ss * 0.4, cy - ss); g.lineTo(cx + ss * 0.6, cy - ss * 0.6); g.lineTo(cx + ss, cy + ss * 0.3); g.lineTo(cx + ss * 0.2, cy + ss); g.closePath(); g.fill(); g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - ss * 0.4, cy - ss); g.lineTo(cx - ss * 0.5, cy + ss * 0.6); g.stroke();
        } else if (r3 < 0.22 && !village) { // buca / cratere
          const ss = 6 + r2 * 7; g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(cx, cy, ss, ss * 0.72, 0, 0, 7); g.fill();
          const ig = g.createRadialGradient(cx, cy - 1, 1, cx, cy, ss); ig.addColorStop(0, 'rgba(0,0,0,.55)'); ig.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = ig; g.beginPath(); g.ellipse(cx, cy, ss, ss * 0.72, 0, 0, 7); g.fill();
          g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy - 1.5, ss * 0.92, ss * 0.62, 0, Math.PI, 0); g.stroke();
        } else if (r3 < 0.48) { // ciottoli sparsi
          g.fillStyle = r1 > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.22)'; for (let k = 0; k < 3; k++) { const a = r1 * 6.28 + k * 2.1; g.beginPath(); g.arc(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 1.3 + r2 * 1.4, 0, 7); g.fill(); }
        }
      }
      // v1.23 — 2-3 CREPE grandi (fissure profonde, non luminose): molto piu lunghe e larghe delle vecchie
      if (!village) { const sc0 = (m.seed >>> 0) || 1; const rr = (n) => { let z = (sc0 + n * 99991) >>> 0; z = ((z ^ (z >> 13)) * 1274126177) >>> 0; return (z >>> 0) / 4294967296; };
        const nCr = 2 + (rr(0) < 0.5 ? 1 : 0); let made = 0, tries = 0;
        while (made < nCr && tries < 160) { tries++;
          const gx = 3 + ((rr(tries * 3) * (m.w - 6)) | 0), gy = 3 + ((rr(tries * 3 + 1) * (m.h - 6)) | 0);
          if (m.grid[gy * m.w + gx] !== C.T_FLOOR) continue;
          let x = gx * T + T / 2, y = gy * T + T / 2, a = rr(tries + 7) * 6.28; const len = 5.5 + rr(tries + 9) * 0.6; const seg = 26; const pts = [];
          for (let i = 0; i < seg; i++) { pts.push([x, y]); a += (rr(tries * seg + i) - 0.5) * 0.5; x += Math.cos(a) * (len * T / seg); y += Math.sin(a) * (len * T / seg); const cgx = (x / T) | 0, cgy = (y / T) | 0; if (cgx < 1 || cgy < 1 || cgx >= m.w - 1 || cgy >= m.h - 1 || m.grid[cgy * m.w + cgx] === C.T_WALL) break; }
          if (pts.length < 9) continue;
          g.lineCap = 'round'; g.lineJoin = 'round';
          g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 6; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke();
          g.strokeStyle = 'rgba(0,0,0,.9)'; g.lineWidth = 3; g.stroke();
          for (let i = 5; i < pts.length - 2; i += 6) { const bx = pts[i][0], by = pts[i][1]; const ba = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) + (rr(i) < 0.5 ? 1.15 : -1.15); const bl = T * (1.1 + rr(i + 3) * 1.2); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.85)'; g.lineWidth = 1.8; g.stroke(); }
          g.lineCap = 'butt'; made++;
        }
      }
      }   // fine del blocco saltato quando vale la cottura nuova
      // STEP D — POZZE: forma UNICA irregolare (union di cerchi, nessun contorno a "bolle") + conca scura per la PROFONDITÀ
      { const seen = new Uint8Array(m.w * m.h);
        const union = (cells, k) => { g.beginPath(); for (const cc of cells) { const cx = cc[0], cy = cc[1]; const h1 = HSH(cx, cy), h2 = HSH(cx + 5, cy + 9); const ox = (h1 - 0.5) * T * 0.16, oy = (h2 - 0.5) * T * 0.16; const rr = T * k * (1.0 + h1 * 0.14); const bxp = cx * T + T / 2 + ox, byp = cy * T + T / 2 + oy; g.moveTo(bxp + rr, byp); g.arc(bxp, byp, rr, 0, 7); } };
        for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
          if (m.grid[y * m.w + x] !== C.T_HAZARD || seen[y * m.w + x]) continue;
          const cells = []; const st = [[x, y]]; seen[y * m.w + x] = 1; let sx = 0, sy = 0, minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
          while (st.length) { const cur = st.pop(); const cx = cur[0], cy = cur[1]; cells.push([cx, cy]); sx += cx; sy += cy; if (cx < minx) minx = cx; if (cx > maxx) maxx = cx; if (cy < miny) miny = cy; if (cy > maxy) maxy = cy; const nb = [[1,0],[-1,0],[0,1],[0,-1]]; for (const d of nb) { const nx = cx + d[0], ny = cy + d[1]; if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue; const ni = ny * m.w + nx; if (m.grid[ni] === C.T_HAZARD && !seen[ni]) { seen[ni] = 1; st.push([nx, ny]); } } }
          const ccx = (sx / cells.length + 0.5) * T, ccy = (sy / cells.length + 0.5) * T; const bx = (minx - 1) * T, by = (miny - 1) * T, bw = (maxx - minx + 3) * T, bh = (maxy - miny + 3) * T;
          // 1) conca scura scavata nel terreno (bordo del pozzo, un filo più grande)
          union(cells, 1.06); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fill();
          // 2) liquido colorato = UNA forma piena (union), poi profondità (scuro al centro)
          g.save(); union(cells, 0.9); g.clip();
          g.globalAlpha = 0.82; g.fillStyle = hz; g.fillRect(bx, by, bw, bh); g.globalAlpha = 0.34; g.fillStyle = 'rgba(10,14,20,1)'; g.fillRect(bx, by, bw, bh);
          const maxR = Math.max(bw, bh) * 0.6; const dg = g.createRadialGradient(ccx, ccy, 2, ccx, ccy, maxR); dg.addColorStop(0, 'rgba(0,0,0,0.68)'); dg.addColorStop(0.65, 'rgba(0,0,0,0.32)'); dg.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = 1; g.fillStyle = dg; g.fillRect(bx, by, bw, bh);
          // riflesso sul bordo alto (dà volume/superficie), niente contorni interni
          const rg = g.createLinearGradient(0, by, 0, by + bh); rg.addColorStop(0, 'rgba(255,255,255,0.09)'); rg.addColorStop(0.35, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(bx, by, bw, bh);
          g.fillStyle = 'rgba(255,255,255,.10)'; for (const cc of cells) { if (HSH(cc[0] + 2, cc[1] + 2) < 0.3) { g.beginPath(); g.ellipse(cc[0] * T + T / 2 + (HSH(cc[0], cc[1]) - 0.5) * T * 0.4, cc[1] * T + T / 2 - 2, T * 0.16, T * 0.06, 0, 0, 7); g.fill(); } }
          g.restore();
          this.hazards.push({ x: ccx, y: ccy, col: hz, r: Math.min(120, 34 + cells.length * 8) });
        }
      }

      // STEP E — portale (exit)
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { if (m.grid[y * m.w + x] !== C.T_EXIT) continue; const cx = x * T + T / 2, cy = y * T + T / 2; const gr = g.createRadialGradient(cx, cy, 3, cx, cy, T * .7); gr.addColorStop(0, th.accent || '#8be9ff'); gr.addColorStop(1, 'rgba(60,160,255,0)'); g.fillStyle = gr; g.fillRect(cx - T, cy - T, T * 2, T * 2); }

      this.runes = [];
      this.torches = []; this.campfires = []; this.glows = []; this.bigLight = null;
      for (const p of (m.props || [])) {
        if (p.type === 'stall') { this._bakeStall(g, p); continue; }     // v1.57 — banchetto del mercante
        if (p.type === 'bonfire') { this.campfires.push({ x: p.x, y: p.y - 4 }); this.bigLight = { x: p.x, y: p.y - 4, r: 430 }; this._bakeBonfire(g, p); continue; }  // v1.57 — falo': unica sorgente della sala
        if (p.type === 'torch') { this.torches.push(p); continue; }
        if (p.type === 'camp') { this.campfires.push(p); this._bakeCamp(g, p); continue; }
        if (p.type === 'brazier') { this._bakeProp(g, p); this.torches.push({ x: p.x, y: p.y - 6 }); continue; }
        if (p.type === 'candelabra') { this._bakeProp(g, p); const V = window.GAME.Constants.VIS_SCALE || 1; for (const ox of [-10, 0, 10]) this.torches.push({ x: p.x + ox * V, y: p.y - 22 * V }); continue; }
        // v1.75 — prop INVISIBILE: porta solo una luce. Serve a staccare il mercante dalla roccia col
        // suo colore, senza mettergli accanto un oggetto che non c'entra nulla.
        if (p.type === 'glowspot') { this.glows.push({ x: p.x, y: p.y, col: p.col || '#ffb14a', rad: p.gr || 78, a: p.ga || 0.17 }); continue; }
        if (p.type === 'mushroom') { this._bakeProp(g, p); this.glows.push({ x: p.x, y: p.y - 4, col: p.col || (this.theme && this.theme.accent) || '#8bff9a', rad: p.gr || 46, a: p.ga || 0.30 }); continue; }
        if (p.type === 'crystal_cluster') { this._bakeProp(g, p); this.glows.push({ x: p.x, y: p.y - 10, col: p.col || (this.theme && this.theme.accent) || '#8be9ff', rad: p.gr || 64, a: p.ga || 0.34 }); continue; }
        if (p.type === 'altar') { this._bakeProp(g, p); const V = window.GAME.Constants.VIS_SCALE || 1; const sc = (p.s || 1) * V; this.torches.push({ x: p.x - 13 * sc, y: p.y - 15 * sc }); this.torches.push({ x: p.x + 13 * sc, y: p.y - 15 * sc }); this.glows.push({ x: p.x, y: p.y - 1, col: (this.theme && this.theme.accent) || '#ff5a3b', rad: 40, a: 0.22 }); continue; }
        if (p.type === 'hanging_lantern') { this._bakeProp(g, p); const V = window.GAME.Constants.VIS_SCALE || 1; this.torches.push({ x: p.x, y: p.y - 8 * (p.s || 1) * V }); continue; } // v1.24 — lanterna + luce calda
        if (p.type === 'obelisk') { this._bakeProp(g, p); this.glows.push({ x: p.x, y: p.y - 14, col: (this.theme && this.theme.accent) || '#c56bff', rad: 54, a: 0.26 }); continue; }
        if (p.type === 'giant_crystal') { this._bakeProp(g, p); this.glows.push({ x: p.x, y: p.y - 18, col: (this.theme && this.theme.accent) || '#8be9ff', rad: 96, a: 0.4 }); continue; } // v1.25 — landmark luminoso
        if (p.type === 'gem_statue') { this._bakeProp(g, p); this.glows.push({ x: p.x, y: p.y - 2, col: (this.theme && this.theme.accent) || '#c56bff', rad: 46, a: 0.26 }); continue; }
        if (p.type === 'well') { this._bakeProp(g, p); this.glows.push({ x: p.x, y: p.y + 5, col: (this.theme && this.theme.accent) || '#7de0ff', rad: 40, a: 0.18 }); continue; }
        this._bakeProp(g, p);
      }
      // v1.64 — LA FASCIA DELLA FAGLIA dipinta direttamente sulla mappa cotta: il giocatore deve poter
      // vedere DOVE comincia il pericolo prima di entrarci, altrimenti la punizione arriva senza preavviso.
      // Quattro sfumature, una per lato, che partono dalla roccia del bordo e sfumano verso l'interno; negli
      // angoli si sovrappongono e quindi il viola e' piu' carico — esattamente dove la faglia morde il doppio.
      // Essendo cotta qui dentro, a schermo non costa niente: e' gia' dentro l'immagine di sfondo.
      { const M = (C.EDGE_MARGIN || 3) * T, x1 = m.w * T, y1 = m.h * T;
        const stops = (q) => { q.addColorStop(0, 'rgba(122,40,196,0.26)'); q.addColorStop(0.32, 'rgba(122,40,196,0.05)'); q.addColorStop(1, 'rgba(122,40,196,0)'); return q; };
        const d = 2 * T + M;
        g.fillStyle = stops(g.createLinearGradient(0, 0, d, 0)); g.fillRect(0, 0, d, y1);
        g.fillStyle = stops(g.createLinearGradient(x1, 0, x1 - d, 0)); g.fillRect(x1 - d, 0, d, y1);
        g.fillStyle = stops(g.createLinearGradient(0, 0, 0, d)); g.fillRect(0, 0, x1, d);
        g.fillStyle = stops(g.createLinearGradient(0, y1, 0, y1 - d)); g.fillRect(0, y1 - d, x1, d);
      }
      this.mapCanvas = cv;
    },
    _bakeMinimap() {
      const m = this.map; if (!m) return; const px = 3; this.mm = { px, w: m.w, h: m.h };
      const cv = document.createElement('canvas'); cv.width = m.w * px; cv.height = m.h * px; const g = cv.getContext('2d');
      const th = this.theme || {}; const wl = th.wall || '#2a3350';
      g.fillStyle = 'rgba(8,10,18,.92)'; g.fillRect(0, 0, cv.width, cv.height);
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const t = m.grid[y * m.w + x];
        if (t === C.T_WALL) { g.fillStyle = wl; g.fillRect(x * px, y * px, px, px); }
        else if (t === C.T_HAZARD) { g.fillStyle = 'rgba(255,90,30,.5)'; g.fillRect(x * px, y * px, px, px); }
        else { g.fillStyle = 'rgba(150,170,210,.10)'; g.fillRect(x * px, y * px, px, px); }
        // v1.63 — la FASCIA della faglia e' segnata sulla minimappa: cosi' la regola si impara guardando,
        // senza doverla leggere. Tinta piu' forte negli angoli, dove la profondita' e' doppia.
        if (t !== C.T_WALL) {
          const M = C.EDGE_MARGIN || 3;
          const dx = Math.min(x - 2, (m.w - 3) - x), dy = Math.min(y - 2, (m.h - 3) - y);
          const dep = Math.max(0, M - dx) + Math.max(0, M - dy);
          if (dep > 0) { g.fillStyle = 'rgba(170,80,240,' + (0.025 + 0.018 * dep).toFixed(3) + ')'; g.fillRect(x * px, y * px, px, px); }
        }
      }
      this.minimapCanvas = cv;
    },
    _drawMinimap(ctx, world) {
      if (!this.minimapCanvas || !this.mm || !world) return; const px = this.mm.px, T = this.map.tile;
      const mw = this.minimapCanvas.width, mh = this.minimapCanvas.height;
      const pad = 12, ox = pad, oy = this.h - mh - pad - 6;
      ctx.save();
      ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(6,8,14,.6)'; this._rr(ctx, ox - 4, oy - 4, mw + 8, mh + 8, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(140,180,255,.35)'; ctx.lineWidth = 1.5; this._rr(ctx, ox - 4, oy - 4, mw + 8, mh + 8, 6); ctx.stroke();
      ctx.globalAlpha = 1; ctx.drawImage(this.minimapCanvas, ox, oy);
      const w2m = (wx, wy) => ({ x: ox + (wx / T) * px, y: oy + (wy / T) * px });
      // exit
      if (this.map.exit) { const e = w2m(this.map.exit.x * T + T / 2, this.map.exit.y * T + T / 2); ctx.fillStyle = '#8be9ff'; ctx.beginPath(); ctx.arc(e.x, e.y, 2.6 + Math.sin(this.time * 4) * 0.8, 0, 7); ctx.fill(); }
      // v1.23 — mercanti sulla minimappa (sempre visibili quando presenti)
      if (world.merch) { const q = w2m(world.merch.x, world.merch.y); ctx.strokeStyle = '#ffcf4a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(q.x, q.y, 4.5 + Math.sin(this.time * 4) * 1.2, 0, 7); ctx.stroke(); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.4, 0, 7); ctx.fill(); }
      if (world.merchD) { const q = w2m(world.merchD.x, world.merchD.y); ctx.strokeStyle = '#c77dff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(q.x, q.y, 4.5 + Math.sin(this.time * 4) * 1.2, 0, 7); ctx.stroke(); ctx.fillStyle = '#ff2d6b'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.6, 0, 7); ctx.fill(); }
      if (world.gmerch) { const q = w2m(world.gmerch.x, world.gmerch.y); ctx.strokeStyle = '#ffa63c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(q.x, q.y, 5 + Math.sin(this.time * 4) * 1.2, 0, 7); ctx.stroke(); ctx.fillStyle = '#ffcf4a'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.8, 0, 7); ctx.fill(); }  // v1.52 — fabbro del MERCATO
      // monsters
      for (const mo of world.mon) { const q = w2m(mo.x, mo.y); if (mo.tr) { ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.6, 0, 7); ctx.fill(); } else if (mo.b) { ctx.fillStyle = mo.mg ? '#ff2d55' : '#ff5a5a'; ctx.beginPath(); ctx.arc(q.x, q.y, 3.4, 0, 7); ctx.fill(); } else { ctx.fillStyle = mo.el ? '#ffb020' : 'rgba(255,90,90,.85)'; ctx.fillRect(q.x - 1, q.y - 1, 2, 2); } }
      // players
      for (const p of world.players) { if (p.d) continue; const h = HERO[p.h] || HERO.guerriero; const q = w2m(p.x, p.y); const me = world.me && p.i === world.me.i; ctx.fillStyle = me ? '#ffffff' : (h.accent || '#8bd6ff'); ctx.beginPath(); ctx.arc(q.x, q.y, me ? 3 : 2.4, 0, 7); ctx.fill(); if (me) { ctx.strokeStyle = h.accent || '#8bd6ff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(q.x, q.y, 4.6, 0, 7); ctx.stroke(); } }
      ctx.restore();
    },
    // v1.57 — FALO' della sala: cerchio di pietre, cenere, legna. La fiamma la mette _flame() a runtime.
    _bakeBonfire(g, p) {
      g.save(); g.translate(p.x, p.y); g.scale(p.s || 1, p.s || 1);
      g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(0, 8, 44, 17, 0, 0, 7); g.fill();
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, rx = Math.cos(a) * 38, ry = Math.sin(a) * 20 + 4;
        const ss = 7 + ((i * 37) % 5); const gr = g.createLinearGradient(rx, ry - ss, rx, ry + ss);
        gr.addColorStop(0, '#5a5348'); gr.addColorStop(1, '#2d2822');
        g.fillStyle = gr; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2;
        g.beginPath(); g.ellipse(rx, ry, ss, ss * 0.75, a, 0, 7); g.fill(); g.stroke(); }
      const ash = g.createRadialGradient(0, 2, 2, 0, 2, 30); ash.addColorStop(0, '#3a2a1c'); ash.addColorStop(1, 'rgba(40,30,20,0)');
      g.fillStyle = ash; g.beginPath(); g.ellipse(0, 2, 30, 16, 0, 0, 7); g.fill();
      g.strokeStyle = '#4a3520'; g.lineWidth = 7; g.lineCap = 'round';
      for (const a of [-0.5, 0.4, 1.4, 2.4]) { g.save(); g.rotate(a); g.beginPath(); g.moveTo(-22, 6); g.lineTo(20, -6); g.stroke(); g.restore(); }
      g.lineCap = 'butt';
      const em = g.createRadialGradient(0, -2, 1, 0, -2, 26); em.addColorStop(0, 'rgba(255,190,80,.95)'); em.addColorStop(.45, 'rgba(255,110,30,.55)'); em.addColorStop(1, 'rgba(255,70,10,0)');
      g.fillStyle = em; g.beginPath(); g.arc(0, -2, 26, 0, 7); g.fill();
      g.restore();
    },
    // v1.57 — BANCHETTO: deve essere piu' GRANDE del mercante che ci sta dietro (scala dal manifest).
    _bakeStall(g, p) {
      const PAL = {
        smith:     { cloth: '#8a3b2a', cloth2: '#e8d9b0', accent: '#ffb14a' },
        herbalist: { cloth: '#3f6b34', cloth2: '#dfe8b0', accent: '#9fe06a' },
        innkeeper: { cloth: '#8a6a2a', cloth2: '#e8dcb0', accent: '#ffd97a' },
        seer:      { cloth: '#553a7a', cloth2: '#ddd0f0', accent: '#c9a0ff' },
        crier:     { cloth: '#6b3a3a', cloth2: '#e8c9b0', accent: '#ff9a8a' },
      };
      const c = PAL[p.kind] || PAL.crier;
      g.save(); g.translate(p.x, p.y); g.scale(p.s || 1, p.s || 1);
      g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(0, 20, 40, 12, 0, 0, 7); g.fill();
      g.strokeStyle = '#3a2a18'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-32, 18); g.lineTo(-32, -40); g.moveTo(32, 18); g.lineTo(32, -40); g.stroke(); g.lineCap = 'butt';
      for (let i = 0; i < 8; i++) { g.fillStyle = (i % 2) ? c.cloth : c.cloth2;
        g.beginPath(); g.moveTo(-34 + i * 8.5, -40); g.lineTo(-34 + (i + 1) * 8.5, -40); g.lineTo(-34 + i * 8.5 + 4.2, -26); g.closePath(); g.fill(); }
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-34, -40); g.lineTo(34, -40); g.stroke();
      g.fillStyle = '#3b352e'; g.strokeStyle = '#1c1815'; g.lineWidth = 2; this._rr(g, -30, 2, 60, 18, 3); g.fill(); g.stroke();
      const wg = g.createLinearGradient(0, -6, 0, 4); wg.addColorStop(0, '#6b4d2c'); wg.addColorStop(1, '#43301b');
      g.fillStyle = wg; g.strokeStyle = '#241a10'; g.lineWidth = 2; this._rr(g, -34, -8, 68, 12, 3); g.fill(); g.stroke();
      g.save(); g.translate(0, -12);
      if (p.kind === 'smith') { g.fillStyle = '#8f959f'; for (const dx of [-16, -8, 0]) { g.beginPath(); g.moveTo(dx, 4); g.lineTo(dx + 3, -10); g.lineTo(dx + 6, 4); g.closePath(); g.fill(); }
        g.fillStyle = '#5b616b'; this._rr(g, 8, -6, 16, 10, 2); g.fill(); g.strokeStyle = '#2a2e35'; g.lineWidth = 1.5; this._rr(g, 8, -6, 16, 10, 2); g.stroke(); }
      else if (p.kind === 'herbalist') { for (const [dx, col] of [[-18, '#7fd06a'], [-8, '#b06ad0'], [2, '#6ad0c8'], [12, '#d0b86a']]) {
          g.fillStyle = col; this._rr(g, dx, -8, 7, 12, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(dx + 1, -6, 2, 6); }
        g.strokeStyle = '#4e7a3c'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(22, 2); g.lineTo(20 + i * 4, -10); g.stroke(); } }
      else if (p.kind === 'innkeeper') { for (const dx of [-16, -4, 8]) { g.fillStyle = '#c9a35a'; this._rr(g, dx, -8, 9, 12, 2); g.fill(); g.fillStyle = '#f0e2b8'; g.fillRect(dx + 1, -8, 7, 3); }
        g.fillStyle = '#6b4d2c'; this._rr(g, 20, -10, 12, 14, 3); g.fill(); }
      else if (p.kind === 'seer') { g.fillStyle = '#1a1428'; g.beginPath(); g.arc(0, -2, 11, 0, 7); g.fill();
        const og = g.createRadialGradient(-3, -6, 1, 0, -2, 12); og.addColorStop(0, '#e6d0ff'); og.addColorStop(1, 'rgba(150,90,220,.15)');
        g.fillStyle = og; g.beginPath(); g.arc(0, -2, 10, 0, 7); g.fill();
        g.fillStyle = '#d9c8a0'; for (const [dx, rr] of [[-22, -0.3], [-15, 0.25]]) { g.save(); g.translate(dx, 0); g.rotate(rr); this._rr(g, -4, -7, 8, 12, 1); g.fill(); g.restore(); } }
      else { g.fillStyle = '#d9c8a0'; g.strokeStyle = '#8a7a55'; g.lineWidth = 1.5; this._rr(g, -20, -8, 14, 11, 1); g.fill(); g.stroke();
        g.fillStyle = '#b8862a'; g.beginPath(); g.arc(2, -2, 5, 0, 7); g.fill(); g.fillStyle = '#8f959f'; g.beginPath(); g.arc(14, -1, 4, 0, 7); g.fill(); }
      g.restore();
      const lg = g.createRadialGradient(-32, -34, 1, -32, -34, 14); lg.addColorStop(0, 'rgba(255,205,120,.9)'); lg.addColorStop(1, 'rgba(255,150,40,0)');
      g.fillStyle = lg; g.beginPath(); g.arc(-32, -34, 14, 0, 7); g.fill();
      g.fillStyle = '#2a2018'; this._rr(g, -35.5, -39, 7, 10, 2); g.fill(); g.fillStyle = c.accent; this._rr(g, -34, -37, 4, 6, 1); g.fill();
      g.restore();
      const S = p.s || 1;
      this.torches.push({ x: p.x - 32 * S, y: p.y - 34 * S });
    },
    _bakeProp(g, p) { const VIS = (window.GAME.Constants.VIS_SCALE || 1); g.save(); g.translate(p.x, p.y); g.scale((p.s || 1) * VIS, (p.s || 1) * VIS); const rot = (p.r || 0) * Math.PI * 2;
      switch (p.type) {
        case 'signpost': { // v1.56 — cartello del villaggio
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 14, 8, 4, 0, 0, 7); g.fill();
          g.strokeStyle = '#3a2a18'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 13); g.lineTo(0, -14); g.stroke();
          g.fillStyle = '#5a4326'; g.strokeStyle = '#241a10'; g.lineWidth = 2; this._rr(g, -22, -22, 44, 15, 2); g.fill(); g.stroke();
          g.fillStyle = '#f0dcae'; g.font = 'bold 11px Segoe UI'; g.textAlign = 'center'; g.fillText(p.txt || 'MERCATO', 0, -11); g.textAlign = 'left'; break; }
        case 'rock': case 'rockSmall': { const s = p.type === 'rock' ? 14 : 8; g.fillStyle = '#3a4152'; g.strokeStyle = '#242a38'; g.lineWidth = 2; g.beginPath(); g.moveTo(-s, s * .5); g.lineTo(-s * .5, -s); g.lineTo(s * .6, -s * .7); g.lineTo(s, s * .4); g.lineTo(s * .2, s); g.closePath(); g.fill(); g.stroke(); break; }
        case 'bones': { g.strokeStyle = '#cfc9b6'; g.lineWidth = 3; g.lineCap = 'round'; g.rotate(rot); for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * 1.1); g.beginPath(); g.moveTo(-9, 0); g.lineTo(9, 0); g.stroke(); g.restore(); } break; }
        case 'skull': { g.rotate(rot * .3); g.fillStyle = '#d8d2c0'; g.strokeStyle = '#8f8874'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, -1, 7, 0, 7); g.fill(); g.stroke(); g.fillRect(-5, 4, 10, 5); g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(-2.6, -1, 2, 0, 7); g.arc(2.6, -1, 2, 0, 7); g.fill(); break; }
        // ===== v1.75 — L'ARREDO DELLE BOTTEGHE ==============================================
        // Otto mobili nuovi. Prima il gioco aveva solo roba da caverna (casse, barili, ossa, cristalli):
        // con quella non si arreda una taverna ne' una fucina, e le stanze restavano scatole vuote.
        // Tutti visti DALL'ALTO come il resto della mappa, e tutti "cotti" una volta sola nel fondo.
        case 'credenza': { // credenza da taverna: il mobile alto contro il muro, con le bottiglie in fila
          g.rotate(rot > 0.5 ? Math.PI / 2 : 0);
          g.fillStyle = 'rgba(0,0,0,.45)'; this._rr(g, -26, -10, 52, 24, 2); g.fill();
          const cg = g.createLinearGradient(0, -14, 0, 12); cg.addColorStop(0, '#6b4a28'); cg.addColorStop(1, '#33220f');
          g.fillStyle = cg; g.strokeStyle = '#1e1408'; g.lineWidth = 2.2; this._rr(g, -27, -13, 54, 25, 2); g.fill(); g.stroke();
          g.fillStyle = 'rgba(255,255,255,.10)'; this._rr(g, -25, -12, 50, 4, 2); g.fill();
          const BOT = ['#8bd6ff', '#9fe06a', '#ffd97a', '#ff9a8a', '#c9a0ff'];
          for (let i = 0; i < 9; i++) { const bx = -22 + i * 5.4;
            g.fillStyle = BOT[i % BOT.length]; g.globalAlpha = 0.85;
            this._rr(g, bx, -7, 3.2, 8.5, 1); g.fill(); g.globalAlpha = 1;
            g.fillStyle = '#2a1d10'; g.fillRect(bx + 0.9, -9.5, 1.4, 2.6); }
          g.strokeStyle = 'rgba(0,0,0,.30)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-25, 3); g.lineTo(25, 3); g.stroke();
          g.fillStyle = '#c9a35a'; for (const dx of [-13, 13]) { g.beginPath(); g.arc(dx, 8, 1.8, 0, 7); g.fill(); } break; }
        case 'aiuola': {   // mini piantagione: un riquadro di terra con le erbe in FILA, non funghi a caso
          g.fillStyle = 'rgba(0,0,0,.4)'; this._rr(g, -22, -18, 44, 38, 2); g.fill();
          g.fillStyle = '#4a3520'; g.strokeStyle = '#241708'; g.lineWidth = 2.4; this._rr(g, -23, -20, 46, 38, 2); g.fill(); g.stroke();
          g.fillStyle = '#2e2318'; this._rr(g, -19, -16, 38, 30, 1); g.fill();
          for (let i = 0; i < 34; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.06 + Math.random() * 0.10).toFixed(3) + ')';
            g.fillRect(-19 + Math.random() * 38, -16 + Math.random() * 30, 3, 2); }
          const cl3 = p.col || '#9fe06a';
          for (let ry = 0; ry < 3; ry++) for (let cx2 = 0; cx2 < 3; cx2++) {
            const px2 = -12 + cx2 * 12, py2 = -10 + ry * 10;
            g.strokeStyle = 'rgba(30,60,35,.9)'; g.lineWidth = 1.6;
            for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(px2, py2 + 3); g.quadraticCurveTo(px2 + k * 2.5, py2 - 1, px2 + k * 4.5, py2 - 4); g.stroke(); }
            g.fillStyle = cl3; g.globalAlpha = 0.9;
            for (let k = -1; k <= 1; k++) { g.beginPath(); g.ellipse(px2 + k * 4.5, py2 - 4.5, 2.3, 3.4, k * 0.5, 0, 7); g.fill(); }
            g.globalAlpha = 1; }
          break; }
        case 'mortaio': {  // mortaio e pestello: lo strumento che dice "qui si prepara"
          g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(0, 4, 10, 5, 0, 0, 7); g.fill();
          const mg2 = g.createRadialGradient(-2, -2, 1, 0, 0, 10); mg2.addColorStop(0, '#9aa1ad'); mg2.addColorStop(1, '#4a5058');
          g.fillStyle = mg2; g.strokeStyle = '#22262d'; g.lineWidth = 1.8; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill(); g.stroke();
          g.fillStyle = '#2a2f36'; g.beginPath(); g.arc(0, 0, 5.6, 0, 7); g.fill();
          g.fillStyle = p.col || '#9fe06a'; g.globalAlpha = 0.7; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.globalAlpha = 1;
          g.strokeStyle = '#8d97a5'; g.lineWidth = 2.6; g.lineCap = 'round';
          g.beginPath(); g.moveTo(1, -1); g.lineTo(8, -8); g.stroke(); g.lineCap = 'butt'; break; }
        case 'tavolo': {   // tavolo tondo della taverna: piano di assi, ombra, boccali
          g.fillStyle = 'rgba(0,0,0,.42)'; g.beginPath(); g.ellipse(0, 6, 20, 8, 0, 0, 7); g.fill();
          g.fillStyle = '#2e1f10'; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill();          // bordo scuro spesso
          const tg = g.createRadialGradient(-6, -7, 2, 0, 0, 19); tg.addColorStop(0, '#b98d54'); tg.addColorStop(1, '#6d4b28');
          g.fillStyle = tg; g.strokeStyle = '#241708'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, 17, 0, 7); g.fill(); g.stroke();
          g.strokeStyle = 'rgba(0,0,0,.30)'; g.lineWidth = 1.2;
          for (const dx of [-11, -4, 3, 10]) { g.beginPath(); g.moveTo(dx, -Math.sqrt(Math.max(0, 361 - dx * dx))); g.lineTo(dx, Math.sqrt(Math.max(0, 361 - dx * dx))); g.stroke(); }
          g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 16, Math.PI * 1.1, Math.PI * 1.75); g.stroke();
          const boccale = (bx, by) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(bx + 1, by + 1.5, 4.4, 3.4, 0, 0, 7); g.fill();
            g.fillStyle = '#8a6a30'; g.strokeStyle = '#4a3512'; g.lineWidth = 1.2; g.beginPath(); g.arc(bx, by, 4.2, 0, 7); g.fill(); g.stroke();
            g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(bx, by, 2.6, 0, 7); g.fill(); };
          boccale(-7, -5); boccale(6, 4); break; }
        case 'panca': {    // SGABELLO tondo: attorno a un tavolo tondo un'asse non si legge, un cerchio si'
          g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(1, 2.5, 7.5, 6, 0, 0, 7); g.fill();
          const pg = g.createRadialGradient(-2, -2, 1, 0, 0, 7.5); pg.addColorStop(0, '#8a6238'); pg.addColorStop(1, '#4a331b');
          g.fillStyle = pg; g.strokeStyle = '#241708'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill(); g.stroke();
          g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.stroke(); break; }
        case 'bancone': {  // bancone: piano lungo, bordo chiaro e la fascia scura del davanti
          g.rotate(rot > 0.5 ? Math.PI / 2 : 0);
          g.fillStyle = 'rgba(0,0,0,.45)'; this._rr(g, -30, -8, 60, 22, 3); g.fill();
          const bg2 = g.createLinearGradient(0, -12, 0, 12); bg2.addColorStop(0, '#8a6238'); bg2.addColorStop(1, '#3e2a15');
          g.fillStyle = bg2; g.strokeStyle = '#241708'; g.lineWidth = 2.2; this._rr(g, -32, -12, 64, 22, 3); g.fill(); g.stroke();
          g.fillStyle = 'rgba(255,255,255,.12)'; this._rr(g, -30, -11, 60, 4, 2); g.fill();
          g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1.1;
          for (let dx = -22; dx <= 22; dx += 11) { g.beginPath(); g.moveTo(dx, -10); g.lineTo(dx, 8); g.stroke(); } break; }
        case 'scaffale': { // scaffale a muro: tre ripiani e le boccette/libri colorati
          g.rotate(rot > 0.5 ? Math.PI / 2 : 0);
          g.fillStyle = 'rgba(0,0,0,.45)'; this._rr(g, -24, -12, 48, 26, 2); g.fill();
          g.fillStyle = '#3a2a18'; g.strokeStyle = '#1e1408'; g.lineWidth = 2; this._rr(g, -25, -14, 50, 26, 2); g.fill(); g.stroke();
          const COL = p.col ? [p.col, '#d8cdb4', p.col, '#8a6238'] : ['#9fe06a', '#c9a0ff', '#ffd97a', '#8bd6ff'];
          for (let r2 = 0; r2 < 3; r2++) {
            const yy = -11 + r2 * 8.5;
            g.fillStyle = '#5a4226'; g.fillRect(-23, yy + 6, 46, 2);
            for (let i = 0; i < 6; i++) { const xx = -21 + i * 7.2 + ((r2 * 3 + i) % 2) * 1.6;
              g.fillStyle = COL[(i + r2) % COL.length]; g.globalAlpha = 0.85;
              this._rr(g, xx, yy, 4.4, 6.4, 1); g.fill(); g.globalAlpha = 1; } }
          break; }
        case 'incudine': { // incudine: il corno e il ceppo, vista dall'alto
          g.rotate(rot * 0.3);
          g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.ellipse(0, 8, 17, 7, 0, 0, 7); g.fill();
          g.fillStyle = '#3a2a18'; g.strokeStyle = '#1e1408'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 6, 15, 8, 0, 0, 7); g.fill(); g.stroke();
          const ig = g.createLinearGradient(0, -10, 0, 8); ig.addColorStop(0, '#7b828e'); ig.addColorStop(1, '#33383f');
          g.fillStyle = ig; g.strokeStyle = '#181b21'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(-13, -6); g.lineTo(9, -7); g.quadraticCurveTo(19, -3.5, 9, 0); g.lineTo(-13, 3); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = 'rgba(255,255,255,.20)'; this._rr(g, -11, -5.4, 18, 2.6, 1); g.fill();
          g.fillStyle = '#ff8a2b'; g.globalAlpha = 0.55; g.beginPath(); g.arc(-2, -2, 3.4, 0, 7); g.fill(); g.globalAlpha = 1; break; }
        case 'alambicco': { // alambicco dell'erborista: caldaia, collo, boccia verde
          g.fillStyle = 'rgba(0,0,0,.42)'; g.beginPath(); g.ellipse(0, 9, 14, 6, 0, 0, 7); g.fill();
          g.fillStyle = '#4a4e57'; g.strokeStyle = '#1a1d22'; g.lineWidth = 1.8; this._rr(g, -9, 0, 18, 9, 2); g.fill(); g.stroke();
          const cl = p.col || '#9fe06a';
          const vg = g.createRadialGradient(-2, -6, 1, 0, -4, 10); vg.addColorStop(0, '#ffffff'); vg.addColorStop(0.45, cl); vg.addColorStop(1, 'rgba(20,40,25,.85)');
          g.fillStyle = vg; g.strokeStyle = 'rgba(220,235,255,.55)'; g.lineWidth = 1.4;
          g.beginPath(); g.arc(0, -4, 9, 0, 7); g.fill(); g.stroke();
          g.strokeStyle = '#6b6f78'; g.lineWidth = 2.4; g.lineCap = 'round';
          g.beginPath(); g.moveTo(7, -8); g.quadraticCurveTo(15, -10, 14, -1); g.stroke(); g.lineCap = 'butt';
          g.fillStyle = cl; g.globalAlpha = 0.5; g.beginPath(); g.arc(14, 2, 2.6, 0, 7); g.fill(); g.globalAlpha = 1; break; }
        case 'tappeto': {  // tappeto: la stanza della cartomante deve avere un pavimento suo
          g.rotate(rot * 0.06);
          const cl2 = p.col || '#6b3a7a';
          g.globalAlpha = 0.9; g.fillStyle = cl2; this._rr(g, -30, -22, 60, 44, 3); g.fill();
          g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2.4; this._rr(g, -26, -18, 52, 36, 2); g.stroke();
          g.strokeStyle = 'rgba(0,0,0,.30)'; g.lineWidth = 1.4; this._rr(g, -21, -13, 42, 26, 2); g.stroke();
          g.fillStyle = 'rgba(255,255,255,.13)'; g.beginPath(); g.ellipse(0, 0, 11, 8, 0, 0, 7); g.fill();
          g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2;
          for (const sx of [-30, 30]) { g.beginPath(); for (let i = -20; i <= 20; i += 5) { g.moveTo(sx, i); g.lineTo(sx + (sx < 0 ? -4 : 4), i + 2); } g.stroke(); }
          g.globalAlpha = 1; break; }
        case 'rastrelliera': { // rastrelliera d'armi del fabbro: il legno e tre lame appese
          g.rotate(rot > 0.5 ? Math.PI / 2 : 0);
          g.fillStyle = 'rgba(0,0,0,.42)'; this._rr(g, -22, -6, 44, 16, 2); g.fill();
          g.fillStyle = '#4a331b'; g.strokeStyle = '#241708'; g.lineWidth = 2; this._rr(g, -23, -8, 46, 15, 2); g.fill(); g.stroke();
          for (let i = -1; i <= 1; i++) {
            const xx = i * 13;
            g.strokeStyle = '#8d97a5'; g.lineWidth = 3; g.lineCap = 'round';
            g.beginPath(); g.moveTo(xx, -6); g.lineTo(xx, 6); g.stroke();
            g.strokeStyle = '#c2c9d4'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(xx, -5); g.lineTo(xx, 4); g.stroke();
            g.fillStyle = '#5a3d22'; this._rr(g, xx - 2.2, 4, 4.4, 4, 1); g.fill();
          }
          g.lineCap = 'butt'; break; }
        case 'barrel': { g.fillStyle = '#5a3d22'; g.strokeStyle = '#31210f'; g.lineWidth = 2; this._rr(g, -8, -11, 16, 22, 3); g.fill(); g.stroke(); g.strokeStyle = '#8a6a3a'; g.beginPath(); g.moveTo(-8, -4); g.lineTo(8, -4); g.moveTo(-8, 4); g.lineTo(8, 4); g.stroke(); break; }
        case 'web': { g.strokeStyle = 'rgba(220,225,235,.18)'; g.lineWidth = 1; g.rotate(rot); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(i) * 16, Math.sin(i * 1.7) * 16); g.stroke(); } for (let r = 5; r <= 15; r += 5) { g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); } break; }
        case 'pillar': { const th = this.theme || {}; g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 16, 15, 6, 0, 0, 7); g.fill(); g.fillStyle = th.wallTop || '#39406a'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; this._rr(g, -8, 12, 16, 6, 2); g.fill(); g.stroke(); const gr = g.createLinearGradient(-9, 0, 9, 0); gr.addColorStop(0, th.wall || '#2a2f4a'); gr.addColorStop(.5, th.wallTop || '#3d4570'); gr.addColorStop(1, th.wall || '#2a2f4a'); g.fillStyle = gr; this._rr(g, -9, -20, 18, 34, 2); g.fill(); g.stroke(); for (let i = -6; i <= 6; i += 4) { g.strokeStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(i, -18); g.lineTo(i, 12); g.stroke(); } this._rr(g, -11, -26, 22, 8, 2); g.fillStyle = th.wallTop || '#3d4570'; g.fill(); g.stroke(); break; }
        case 'crystal': { const th = this.theme || {}; const col = th.accent || '#8be9ff'; g.rotate(rot * .2); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 12, 12, 5, 0, 0, 7); g.fill(); const spikes = [[0, -22, 6, 12], [-9, -12, 4, 10], [8, -14, 5, 11]]; for (const sp of spikes) { const cx = sp[0], ty = sp[1], w = sp[2], h = sp[3]; g.save(); g.translate(cx, 6); const grd = g.createLinearGradient(0, ty, 0, 0); grd.addColorStop(0, '#ffffff'); grd.addColorStop(.4, col); grd.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = grd; g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, ty); g.lineTo(w, ty + h); g.lineTo(0, 0); g.lineTo(-w, ty + h); g.closePath(); g.fill(); g.stroke(); g.restore(); } break; }
        case 'mushroom': { g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 10, 9, 4, 0, 0, 7); g.fill(); g.fillStyle = '#d8cdb4'; g.strokeStyle = '#0a0c12'; g.lineWidth = 1.5; this._rr(g, -3, -2, 6, 12, 2); g.fill(); g.stroke(); const _th = this.theme || {}; const _gc = p.col || _th.accent || '#8bff9a'; const cap = g.createLinearGradient(0, -12, 0, 0); cap.addColorStop(0, _gc); cap.addColorStop(1, 'rgba(20,40,30,.92)'); g.fillStyle = cap; g.beginPath(); g.ellipse(0, -3, 11, 8, 0, Math.PI, 0); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.85)'; for (const d of [[-5, -5], [4, -6], [0, -3], [7, -3]]) { g.beginPath(); g.arc(d[0], d[1], 1.6, 0, 7); g.fill(); } break; }
        case 'chain': { g.rotate(rot); g.strokeStyle = 'rgba(150,160,175,.5)'; g.fillStyle = 'rgba(120,130,145,.5)'; g.lineWidth = 1.5; for (let i = -14; i <= 14; i += 6) { g.beginPath(); g.ellipse(0, i, 3.2, 4.5, 0, 0, 7); g.stroke(); } break; }
        case 'statue': { const th = this.theme || {}; g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(0, 16, 14, 6, 0, 0, 7); g.fill(); g.fillStyle = th.wallTop || '#3a4260'; g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; this._rr(g, -11, 10, 22, 8, 2); g.fill(); g.stroke(); const bd = g.createLinearGradient(-10, 0, 10, 0); bd.addColorStop(0, '#4a5170'); bd.addColorStop(.5, '#6b7398'); bd.addColorStop(1, '#4a5170'); g.fillStyle = bd; g.beginPath(); g.moveTo(-9, 10); g.lineTo(-6, -10); g.quadraticCurveTo(0, -26, 6, -10); g.lineTo(9, 10); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#5a6288'; g.beginPath(); g.arc(0, -16, 6, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#3a4058'; g.fillRect(-2.2, -18, 1.6, 4); g.fillRect(1, -18, 1.6, 4); break; }
        case 'puddle': { const th = this.theme || {}; const col = th.accent || '#7de0ff'; g.globalAlpha = .5; g.rotate(rot); const grd = g.createRadialGradient(0, 0, 2, 0, 0, 18); grd.addColorStop(0, col); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.beginPath(); g.ellipse(0, 0, 18, 10, 0, 0, 7); g.fill(); g.globalAlpha = .35; g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, 12, 6, 0, 0, 7); g.stroke(); g.globalAlpha = 1; break; }
        case 'lavapool': { g.rotate(rot); const grd = g.createRadialGradient(0, 0, 2, 0, 0, 20); grd.addColorStop(0, '#ffd24a'); grd.addColorStop(.5, '#ff5a1e'); grd.addColorStop(1, 'rgba(120,20,0,0)'); g.fillStyle = grd; g.beginPath(); g.ellipse(0, 0, 20, 12, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,120,30,.5)'; for (const d of [[-6, -2], [5, 1], [0, 3]]) { g.beginPath(); g.arc(d[0], d[1], 2.4, 0, 7); g.fill(); } break; }
        case 'flag': { const th = this.theme || {}; const col = p.col || th.accent || '#c56bff'; g.strokeStyle = '#3a2a18'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-6, 16); g.lineTo(-6, -20); g.stroke(); const wave = Math.sin((p.r || 0) * 6) * 2; g.fillStyle = col; g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-6, -20); g.lineTo(12, -17 + wave); g.lineTo(12, -3 - wave); g.lineTo(-6, -6); g.closePath(); g.fill(); g.stroke(); g.lineCap = 'butt'; break; }
        case 'coffin': { g.rotate(rot); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 16, 13, 5, 0, 0, 7); g.fill(); g.fillStyle = '#4a3722'; g.strokeStyle = '#22160b'; g.lineWidth = 2; g.beginPath(); g.moveTo(-8, -16); g.lineTo(8, -16); g.lineTo(11, 2); g.lineTo(0, 16); g.lineTo(-11, 2); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#6b533a'; g.beginPath(); g.moveTo(-2, -12); g.lineTo(2, -12); g.lineTo(2, -2); g.lineTo(5, -2); g.lineTo(0, 6); g.lineTo(-5, -2); g.lineTo(-2, -2); g.closePath(); g.fill(); break; }
        case 'tomb': { g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(0, 15, 13, 5, 0, 0, 7); g.fill(); const gr = g.createLinearGradient(0, -20, 0, 14); gr.addColorStop(0, '#6a7080'); gr.addColorStop(1, '#3a3f4c'); g.fillStyle = gr; g.strokeStyle = '#20242e'; g.lineWidth = 2; g.beginPath(); g.moveTo(-11, 14); g.lineTo(-11, -8); g.quadraticCurveTo(-11, -20, 0, -20); g.quadraticCurveTo(11, -20, 11, -8); g.lineTo(11, 14); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(20,22,28,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, -6); g.lineTo(6, -6); g.moveTo(0, -12); g.lineTo(0, -1); g.stroke(); g.fillStyle = 'rgba(30,60,40,.5)'; g.fillRect(-11, 10, 22, 4); break; }
        case 'corpse': { g.rotate(rot); g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 6, 15, 5, 0, 0, 7); g.fill(); g.strokeStyle = '#d8d2bf'; g.fillStyle = '#cfc7b0'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.arc(-8, 0, 4.5, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#1a1a20'; g.beginPath(); g.arc(-9, -1, 1, 0, 7); g.arc(-6.5, -1, 1, 0, 7); g.fill(); g.strokeStyle = '#c9c1aa'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-3, -3 + i * 2); g.lineTo(8, -4 + i * 2.2); g.stroke(); } g.lineWidth = 2; g.beginPath(); g.moveTo(2, 1); g.lineTo(11, 6); g.moveTo(2, 3); g.lineTo(10, 9); g.stroke(); g.lineCap = 'butt'; break; }
        case 'torture': { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 16, 12, 5, 0, 0, 7); g.fill(); g.strokeStyle = '#3a2a18'; g.fillStyle = '#5a4326'; g.lineWidth = 3; this._rr(g, -3, -18, 6, 34, 1); g.fill(); g.stroke(); g.strokeStyle = '#2a1e10'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14, -12); g.lineTo(14, -12); g.stroke(); g.save(); g.translate(0, -6); g.rotate((p.r || 0) * 6.28); g.strokeStyle = '#6b6f78'; g.fillStyle = '#4a4e57'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 11, 0, 7); g.stroke(); for (let k = 0; k < 8; k++) { g.save(); g.rotate(k * Math.PI / 4); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -11); g.stroke(); g.beginPath(); g.moveTo(-2, -11); g.lineTo(0, -15); g.lineTo(2, -11); g.fill(); g.restore(); } g.restore(); break; }
        case 'cage': { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 18, 10, 4, 0, 0, 7); g.fill(); g.strokeStyle = '#2a1e10'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, -16); g.stroke(); g.strokeStyle = '#4a4e57'; g.fillStyle = 'rgba(20,22,28,.25)'; g.lineWidth = 2; const sway = Math.sin((p.r || 0) * 6.28 + this.time) * 0.12; g.save(); g.rotate(sway); g.beginPath(); g.arc(0, -14, 9, Math.PI, 0); g.stroke(); for (let x = -9; x <= 9; x += 4.5) { g.beginPath(); g.moveTo(x, -14); g.lineTo(x * 0.7, 10); g.stroke(); } g.beginPath(); g.ellipse(0, 10, 7, 3, 0, 0, 7); g.stroke(); g.fillStyle = '#d8d2c0'; g.beginPath(); g.arc(0, -1, 3.4, 0, 7); g.fill(); g.fillRect(-2.4, 2.2, 4.8, 3); g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(-1.2, -1, 0.9, 0, 7); g.arc(1.2, -1, 0.9, 0, 7); g.fill(); g.strokeStyle = 'rgba(207,199,176,.85)'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-2.6, 4 + i * 1.7); g.lineTo(2.6, 4 + i * 1.7); g.stroke(); } g.restore(); break; }
        case 'brazier': {
          g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 15, 15, 6, 0, 0, 7); g.fill();
          g.strokeStyle = '#26262e'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-8, 15); g.lineTo(-3, 2); g.moveTo(8, 15); g.lineTo(3, 2); g.moveTo(0, 16); g.lineTo(0, 2); g.stroke();
          const bg = g.createLinearGradient(0, -6, 0, 9); bg.addColorStop(0, '#4a4e57'); bg.addColorStop(1, '#22252b'); g.fillStyle = bg; g.strokeStyle = '#14161b'; g.lineWidth = 2; g.beginPath(); g.moveTo(-12, -4); g.quadraticCurveTo(0, 11, 12, -4); g.quadraticCurveTo(0, -1, -12, -4); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#6b6f78'; g.beginPath(); g.ellipse(0, -4, 12, 4, 0, 0, 7); g.fill();
          g.fillStyle = '#5a2a12'; g.beginPath(); g.ellipse(0, -4, 9, 3, 0, 0, 7); g.fill();
          g.fillStyle = '#ff7a2b'; for (const d of [[-5, -4], [3, -5], [0, -3], [6, -3]]) { g.beginPath(); g.arc(d[0], d[1], 2, 0, 7); g.fill(); }
          g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(0, -4, 2.4, 0, 7); g.fill(); g.lineCap = 'butt'; break; }
        case 'candelabra': {
          g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(0, 16, 9, 4, 0, 0, 7); g.fill();
          g.strokeStyle = '#3a2f1e'; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 16); g.lineTo(0, -14); g.stroke();
          g.lineWidth = 2.6; g.beginPath(); g.moveTo(0, -8); g.quadraticCurveTo(-10, -10, -10, -16); g.moveTo(0, -8); g.quadraticCurveTo(10, -10, 10, -16); g.stroke();
          g.fillStyle = '#5a4a2e'; g.beginPath(); g.ellipse(0, 16, 6, 2.4, 0, 0, 7); g.fill();
          g.fillStyle = '#e8dcc0'; g.strokeStyle = '#0a0c12'; g.lineWidth = 1.2; for (const cx of [-10, 0, 10]) { this._rr(g, cx - 2, -22, 4, 7, 1); g.fill(); g.stroke(); }
          g.fillStyle = '#ffd24a'; for (const cx of [-10, 0, 10]) { g.beginPath(); g.arc(cx, -23, 1.4, 0, 7); g.fill(); }
          g.lineCap = 'butt'; break; }
        case 'sack': {
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 12, 11, 5, 0, 0, 7); g.fill();
          const bg = g.createLinearGradient(0, -10, 0, 12); bg.addColorStop(0, '#a9925f'); bg.addColorStop(1, '#6e5c37'); g.fillStyle = bg; g.strokeStyle = '#3d3320'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(-9, 12); g.quadraticCurveTo(-13, -4, -6, -8); g.quadraticCurveTo(-3, -11, 0, -8); g.quadraticCurveTo(3, -11, 6, -8); g.quadraticCurveTo(13, -4, 9, 12); g.quadraticCurveTo(0, 15, -9, 12); g.closePath(); g.fill(); g.stroke();
          g.strokeStyle = '#4a3d24'; g.lineWidth = 2; g.beginPath(); g.moveTo(-6, -8); g.lineTo(6, -8); g.stroke();
          g.fillStyle = '#c9b483'; g.beginPath(); g.moveTo(-3, -8); g.lineTo(0, -13); g.lineTo(3, -8); g.fill();
          g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -6); g.lineTo(0, 12); g.stroke(); break; }
        case 'cratebox': {
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 13, 13, 5, 0, 0, 7); g.fill();
          const bg = g.createLinearGradient(0, -12, 0, 12); bg.addColorStop(0, '#7a5630'); bg.addColorStop(1, '#4a341c'); g.fillStyle = bg; g.strokeStyle = '#241708'; g.lineWidth = 2; this._rr(g, -12, -12, 24, 24, 2); g.fill(); g.stroke();
          g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-12, -4); g.lineTo(12, -4); g.moveTo(-12, 4); g.lineTo(12, 4); g.stroke();
          g.strokeStyle = '#3a2a16'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-12, 12); g.lineTo(12, -12); g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; g.strokeRect(-11, -11, 22, 22); break; }
        case 'demon_statue': {
          const th = this.theme || {}; const eyecol = th.accent || '#ff5a3b';
          g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(0, 20, 16, 7, 0, 0, 7); g.fill();
          g.fillStyle = '#3a3540'; g.strokeStyle = '#17141c'; g.lineWidth = 2; this._rr(g, -13, 14, 26, 8, 2); g.fill(); g.stroke();
          const bg = g.createLinearGradient(-10, -10, 10, 20); bg.addColorStop(0, '#4a4450'); bg.addColorStop(1, '#26222c'); g.fillStyle = bg;
          g.beginPath(); g.moveTo(-10, 14); g.lineTo(-7, -6); g.quadraticCurveTo(-9, -14, -3, -16); g.lineTo(3, -16); g.quadraticCurveTo(9, -14, 7, -6); g.lineTo(10, 14); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#332e3a'; g.beginPath(); g.moveTo(-7, -4); g.lineTo(-16, -10); g.lineTo(-14, 2); g.lineTo(-8, 6); g.closePath(); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(7, -4); g.lineTo(16, -10); g.lineTo(14, 2); g.lineTo(8, 6); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#3a3540'; g.beginPath(); g.arc(0, -18, 5, 0, 7); g.fill(); g.stroke();
          g.strokeStyle = '#1a1720'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-4, -21); g.quadraticCurveTo(-10, -26, -7, -30); g.moveTo(4, -21); g.quadraticCurveTo(10, -26, 7, -30); g.stroke(); g.lineCap = 'butt';
          g.fillStyle = eyecol; g.shadowColor = eyecol; g.shadowBlur = 6; g.beginPath(); g.arc(-2, -18, 1.2, 0, 7); g.arc(2, -18, 1.2, 0, 7); g.fill(); g.shadowBlur = 0; break; }
        case 'stalagmite': { // v1.23 — stalagmite rocciosa dal pavimento
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 10, 10, 4, 0, 0, 7); g.fill();
          const gr = g.createLinearGradient(0, -26, 0, 10); gr.addColorStop(0, '#6a7180'); gr.addColorStop(1, '#2c313d'); g.fillStyle = gr; g.strokeStyle = '#191d26'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(-8, 10); g.quadraticCurveTo(-5, -6, -1, -27); g.quadraticCurveTo(3, -6, 8, 10); g.closePath(); g.fill(); g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1, -27); g.lineTo(-3, 8); g.stroke();
          g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(-1, -27); g.lineTo(3, 7); g.stroke();
          g.fillStyle = gr; g.strokeStyle = '#191d26'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(6, 10); g.quadraticCurveTo(8, 0, 10, -9); g.quadraticCurveTo(12, 2, 13, 10); g.closePath(); g.fill(); g.stroke(); break; }
        case 'skullpile': { // v1.23 — pila di teschi
          g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(0, 12, 18, 6, 0, 0, 7); g.fill();
          const sk = (sx, sy, ss) => { g.save(); g.translate(sx, sy); g.scale(ss, ss); g.fillStyle = '#d8d2c0'; g.strokeStyle = '#8f8874'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, -1, 6, 0, 7); g.fill(); g.stroke(); g.fillRect(-4, 3, 8, 4); g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(-2.2, -1, 1.7, 0, 7); g.arc(2.2, -1, 1.7, 0, 7); g.fill(); g.restore(); };
          sk(-8, 8, 0.9); sk(9, 9, 0.85); sk(0, 10, 1.0); sk(-4, 2, 0.8); sk(6, 1, 0.75); sk(0, -5, 0.72);
          g.strokeStyle = '#cfc9b6'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-15, 10); g.lineTo(-6, 6); g.moveTo(12, 11); g.lineTo(17, 4); g.stroke(); g.lineCap = 'butt'; break; }
        case 'rubble': { // v1.23 — muro crollato / macerie
          const th = this.theme || {}; const bc = th.wallTop || '#39406a', bd = th.wall || '#242a40';
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 12, 21, 6, 0, 0, 7); g.fill();
          const blk = (bx, by, bw, bh, ang) => { g.save(); g.translate(bx, by); g.rotate(ang); const gr = g.createLinearGradient(0, -bh / 2, 0, bh / 2); gr.addColorStop(0, bc); gr.addColorStop(1, bd); g.fillStyle = gr; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.5; this._rr(g, -bw / 2, -bh / 2, bw, bh, 2); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(-bw / 2 + 1, -bh / 2 + 1); g.lineTo(bw / 2 - 1, -bh / 2 + 1); g.stroke(); g.restore(); };
          blk(-10, 6, 16, 11, -0.15); blk(9, 8, 15, 10, 0.2); blk(0, -2, 17, 11, 0.05); blk(-4, 11, 12, 8, 0.32); blk(11, -1, 10, 8, -0.26);
          g.fillStyle = bd; for (const d of [[-17, 10], [17, 12], [-2, 13], [6, -9]]) { g.beginPath(); g.arc(d[0], d[1], 2.2, 0, 7); g.fill(); } break; }
        case 'bigweb': { // v1.23 — ragnatela gigante d'angolo
          g.strokeStyle = 'rgba(225,230,240,.22)'; g.lineWidth = 1.2; g.rotate(rot); const R2 = 28, spk = 7;
          for (let i = 0; i < spk; i++) { const a = (i / spk) * Math.PI * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R2, Math.sin(a) * R2); g.stroke(); }
          for (let ring = 6; ring <= R2; ring += 6) { g.beginPath(); for (let i = 0; i <= spk; i++) { const a = (i / spk) * Math.PI * 2; const rr2 = ring + Math.sin(a * 3) * 1.6; const x = Math.cos(a) * rr2, y = Math.sin(a) * rr2; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }
          g.fillStyle = '#1a1620'; g.beginPath(); g.arc(R2 * 0.4, R2 * 0.22, 2.4, 0, 7); g.fill();
          g.strokeStyle = '#0a0810'; g.lineWidth = 0.8; for (let l = 0; l < 4; l++) { const a = l * 1.4; g.beginPath(); g.moveTo(R2 * 0.4, R2 * 0.22); g.lineTo(R2 * 0.4 + Math.cos(a) * 4, R2 * 0.22 + Math.sin(a) * 4); g.stroke(); } break; }
        case 'crystal_cluster': { // v1.23 — grappolo di cristalli luminosi (v1.75: colore proprio, se il prop ne ha uno)
          const th = this.theme || {}; const col = p.col || th.accent || '#8be9ff'; g.rotate(rot * 0.1);
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 12, 16, 6, 0, 0, 7); g.fill();
          const sp = (cx, ty, w, h) => { g.save(); g.translate(cx, 8); const grd = g.createLinearGradient(0, ty, 0, 0); grd.addColorStop(0, '#ffffff'); grd.addColorStop(.4, col); grd.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = grd; g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, ty); g.lineTo(w, ty + h * 0.5); g.lineTo(0, 0); g.lineTo(-w, ty + h * 0.5); g.closePath(); g.fill(); g.stroke(); g.restore(); };
          sp(0, -30, 7, 14); sp(-11, -18, 5, 12); sp(10, -22, 6, 13); sp(-6, -12, 4, 9); sp(6, -10, 4, 8); break; }
        case 'altar': { // v1.23 — altare rituale con candele
          const th = this.theme || {}; const acc = th.accent || '#ff5a3b';
          g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(0, 16, 22, 7, 0, 0, 7); g.fill();
          g.fillStyle = '#3a3540'; g.strokeStyle = '#17141c'; g.lineWidth = 2; this._rr(g, -20, 10, 40, 8, 2); g.fill(); g.stroke(); this._rr(g, -16, 4, 32, 8, 2); g.fill(); g.stroke();
          const gr = g.createLinearGradient(0, -8, 0, 6); gr.addColorStop(0, '#5a5560'); gr.addColorStop(1, '#2c2833'); g.fillStyle = gr; this._rr(g, -15, -6, 30, 12, 2); g.fill(); g.stroke();
          g.fillStyle = 'rgba(150,20,30,.5)'; g.beginPath(); g.ellipse(0, 0, 9, 4, 0, 0, 7); g.fill();
          const cand = (cx) => { g.fillStyle = '#e8dcc0'; g.strokeStyle = '#0a0c12'; g.lineWidth = 1; this._rr(g, cx - 1.5, -14, 3, 8, 1); g.fill(); g.stroke(); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(cx, -15, 1.7, 0, 7); g.fill(); };
          cand(-13); cand(13);
          g.fillStyle = acc; g.globalAlpha = 0.5; g.beginPath(); g.arc(0, -1, 3.2, 0, 7); g.fill(); g.globalAlpha = 1; break; }
        case 'arch': { // v1.24 — arco diroccato (architettura)
          const th = this.theme || {}; const bc = th.wallTop || '#39406a', bd = th.wall || '#242a40';
          g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(0, 20, 30, 8, 0, 0, 7); g.fill();
          const col = (x, w, h) => { const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, bc); gr.addColorStop(1, bd); g.fillStyle = gr; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2; this._rr(g, x, 20 - h, w, h, 2); g.fill(); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.3)'; for (let yy = 20 - h + 8; yy < 20; yy += 8) { g.beginPath(); g.moveTo(x + 1, yy); g.lineTo(x + w - 1, yy); g.stroke(); } };
          col(-24, 12, 40); col(12, 12, 34);   // pilastri (destro spezzato)
          g.fillStyle = bc; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(0, -20, 24, Math.PI, Math.PI * 1.7, false); g.arc(0, -20, 12, Math.PI * 1.7, Math.PI, true); g.closePath(); g.fill(); g.stroke(); // arco spezzato
          g.fillStyle = bd; for (const d of [[18, 16], [-6, 19], [22, -2]]) { g.beginPath(); g.arc(d[0], d[1], 2.4, 0, 7); g.fill(); } break; }
        case 'stalactite': { // v1.24 — stalattite dal soffitto (appesa in alto)
          const gr = g.createLinearGradient(0, -30, 0, 6); gr.addColorStop(0, '#2c313d'); gr.addColorStop(1, '#6a7180'); g.fillStyle = gr; g.strokeStyle = '#191d26'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(-7, -30); g.quadraticCurveTo(-4, -8, -1, 6); g.quadraticCurveTo(3, -8, 7, -30); g.closePath(); g.fill(); g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1, 6); g.lineTo(-3, -28); g.stroke();
          g.fillStyle = gr; g.strokeStyle = '#191d26'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(6, -30); g.quadraticCurveTo(8, -14, 10, -4); g.quadraticCurveTo(12, -16, 13, -30); g.closePath(); g.fill(); g.stroke();
          const th = this.theme || {}; if (th.id === 'ice') { g.fillStyle = 'rgba(180,230,255,.25)'; g.beginPath(); g.moveTo(-4, -20); g.lineTo(0, 4); g.lineTo(4, -20); g.fill(); }
          g.fillStyle = 'rgba(120,160,200,.35)'; g.beginPath(); g.arc(-1, 7, 1.4, 0, 7); g.fill(); break; } // goccia
        case 'gallows': { // v1.24 — forca / patibolo
          g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 20, 20, 7, 0, 0, 7); g.fill();
          g.strokeStyle = '#3a2a18'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-14, 20); g.lineTo(-14, -26); g.lineTo(10, -26); g.stroke(); // palo + trave
          g.lineWidth = 3; g.beginPath(); g.moveTo(-14, -14); g.lineTo(-4, -20); g.stroke(); // rinforzo
          g.strokeStyle = '#151515'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(8, -26); g.lineTo(8, -12); g.stroke(); // corda
          g.strokeStyle = '#1a1a1a'; g.lineWidth = 2; g.beginPath(); g.arc(8, -9, 3.4, 0, 7); g.stroke(); // cappio
          g.fillStyle = '#d8d2c0'; g.strokeStyle = '#8f8874'; g.lineWidth = 1; g.beginPath(); g.arc(8, -3, 3, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(6.8, -3.4, 0.9, 0, 7); g.arc(9.2, -3.4, 0.9, 0, 7); g.fill(); break; } // teschio appeso
        case 'obelisk': { // v1.24 — obelisco arcano (rune incise, glow)
          const th = this.theme || {}; const acc = th.accent || '#c56bff';
          g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(0, 20, 16, 7, 0, 0, 7); g.fill();
          g.fillStyle = '#2a2433'; g.strokeStyle = '#141019'; g.lineWidth = 2; this._rr(g, -12, 14, 24, 8, 2); g.fill(); g.stroke();
          const gr = g.createLinearGradient(-8, 0, 8, 0); gr.addColorStop(0, '#3a3448'); gr.addColorStop(0.5, '#4e4660'); gr.addColorStop(1, '#2a2434'); g.fillStyle = gr;
          g.beginPath(); g.moveTo(-9, 14); g.lineTo(-5, -26); g.lineTo(0, -32); g.lineTo(5, -26); g.lineTo(9, 14); g.closePath(); g.fill(); g.strokeStyle = '#141019'; g.lineWidth = 2; g.stroke();
          g.strokeStyle = acc; g.lineWidth = 1.4; g.globalAlpha = 0.5 + 0.3 * Math.sin(this.time * 2);
          g.beginPath(); g.moveTo(-2, -6); g.lineTo(2, -10); g.lineTo(-2, -14); g.moveTo(0, 0); g.lineTo(0, -20); g.moveTo(-2, -18); g.lineTo(2, -22); g.stroke(); g.globalAlpha = 1;
          g.fillStyle = acc; g.shadowColor = acc; g.shadowBlur = 8; g.beginPath(); g.arc(0, -30, 2, 0, 7); g.fill(); g.shadowBlur = 0; break; }
        case 'hanging_lantern': { // v1.24 — lanterna appesa (luce calda)
          g.strokeStyle = '#2a2418'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, -30); g.lineTo(0, -14); g.stroke();
          const sw = Math.sin(this.time * 1.5 + p.x) * 1.5; g.save(); g.translate(sw, 0);
          const lg = g.createRadialGradient(0, -8, 1, 0, -8, 16); lg.addColorStop(0, 'rgba(255,200,90,.85)'); lg.addColorStop(1, 'rgba(255,160,40,0)'); g.fillStyle = lg; g.beginPath(); g.arc(0, -8, 16, 0, 7); g.fill();
          g.fillStyle = '#2a2018'; g.strokeStyle = '#0a0c12'; g.lineWidth = 1.4; this._rr(g, -5, -16, 10, 15, 2); g.fill(); g.stroke();
          g.fillStyle = 'rgba(255,214,106,.95)'; this._rr(g, -3, -14, 6, 11, 1); g.fill();
          g.fillStyle = '#3a3018'; g.beginPath(); g.moveTo(-5, -16); g.lineTo(0, -20); g.lineTo(5, -16); g.fill(); g.stroke();
          g.strokeStyle = '#0a0c12'; g.beginPath(); g.arc(0, -21, 2, Math.PI, 0); g.stroke(); g.restore(); break; }
        case 'bloodstain': { // v1.24 — decal a terra (macchia scura irregolare, piatta)
          g.rotate(rot); g.fillStyle = 'rgba(60,10,14,.5)';
          g.beginPath(); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const rr = 10 + Math.sin(i * 2.3) * 5 + (p.r * 4); const x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.72; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.closePath(); g.fill();
          g.fillStyle = 'rgba(40,6,10,.55)'; for (const d of [[13, 6], [-15, -4], [10, -10], [-8, 12]]) { g.beginPath(); g.ellipse(d[0], d[1], 2.6 + p.r * 2, 1.8, 0, 0, 7); g.fill(); }
          g.fillStyle = 'rgba(90,16,20,.35)'; g.beginPath(); g.ellipse(-2, 1, 5, 3.4, 0, 0, 7); g.fill(); break; }
        case 'bridge': { // v1.25 — ponte di legno sopra una fenditura
          g.rotate(rot < 0.5 ? 0 : Math.PI / 2);
          g.fillStyle = 'rgba(0,0,0,.55)'; this._rr(g, -30, -13, 60, 26, 3); g.fill(); // fenditura sotto
          const pg = g.createLinearGradient(0, -13, 0, 13); pg.addColorStop(0, '#7a5630'); pg.addColorStop(1, '#4a341c');
          for (let x = -28; x < 30; x += 8) { g.fillStyle = pg; g.strokeStyle = '#241708'; g.lineWidth = 1.4; this._rr(g, x, -13, 7, 26, 1); g.fill(); g.stroke(); } // assi
          g.strokeStyle = '#2a1c0e'; g.lineWidth = 3; g.beginPath(); g.moveTo(-30, -11); g.lineTo(30, -11); g.moveTo(-30, 11); g.lineTo(30, 11); g.stroke(); // travi laterali
          g.fillStyle = '#8a6a3a'; for (const bx of [-28, -12, 4, 20]) { g.beginPath(); g.arc(bx + 3.5, -11, 1.2, 0, 7); g.arc(bx + 3.5, 11, 1.2, 0, 7); g.fill(); } // chiodi
          g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; for (let x = -24; x < 30; x += 8) { g.beginPath(); g.moveTo(x, -12); g.lineTo(x, 12); g.stroke(); } break; }
        case 'spiral_stairs': { // v1.25 — scala a chiocciola che scende nel buio
          g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(0, 14, 24, 8, 0, 0, 7); g.fill();
          const rg = g.createRadialGradient(0, 0, 3, 0, 0, 22); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.6, 'rgba(0,0,0,.85)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill(); // pozzo buio
          for (let i = 0; i < 9; i++) { const a = i * 0.62, r0 = 22 - i * 1.9; const gr = g.createLinearGradient(0, -3, 0, 3); gr.addColorStop(0, '#5a6070'); gr.addColorStop(1, '#2a3040'); g.save(); g.rotate(a); g.fillStyle = gr; g.strokeStyle = '#171b26'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(r0 * 0.35, -3.4); g.lineTo(r0, -5); g.lineTo(r0, 5); g.lineTo(r0 * 0.35, 3.4); g.closePath(); g.fill(); g.stroke(); g.restore(); } // gradini a spirale
          g.fillStyle = '#3a4050'; g.strokeStyle = '#171b26'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.stroke(); break; } // colonna centrale
        case 'well': { // v1.25 — pozzo/fontana diroccato
          const th = this.theme || {}; const wc = th.accent || '#7de0ff';
          g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(0, 16, 22, 8, 0, 0, 7); g.fill();
          const sg = g.createLinearGradient(0, -4, 0, 16); sg.addColorStop(0, '#5a5f6c'); sg.addColorStop(1, '#2c313c'); g.fillStyle = sg; g.strokeStyle = '#171b24'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 8, 20, 10, 0, 0, 7); g.fill(); g.stroke(); // base
          g.fillStyle = '#0a1016'; g.beginPath(); g.ellipse(0, 5, 14, 7, 0, 0, 7); g.fill(); // buco
          g.fillStyle = wc; g.globalAlpha = 0.35 + 0.15 * Math.sin(this.time * 2); g.beginPath(); g.ellipse(0, 5, 11, 5.4, 0, 0, 7); g.fill(); g.globalAlpha = 1; // acqua
          g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-3, 3.5, 3.5, 1.6, 0, 0, 7); g.fill();
          // mattoni sul bordo
          g.strokeStyle = '#171b24'; g.lineWidth = 1.2; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * 16, 8 + Math.sin(a) * 8); g.lineTo(Math.cos(a) * 20, 8 + Math.sin(a) * 10); g.stroke(); }
          // arco e carrucola
          g.strokeStyle = '#3a2a18'; g.lineWidth = 3; g.beginPath(); g.moveTo(-16, 4); g.lineTo(-14, -18); g.lineTo(14, -18); g.lineTo(16, 4); g.stroke(); g.fillStyle = '#5a4630'; g.beginPath(); g.arc(0, -18, 3, 0, 7); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -15); g.lineTo(0, 2); g.stroke(); break; }
        case 'grate': { // v1.25 — grata/inferriata sul pavimento con vapore
          g.rotate(rot < 0.5 ? 0 : Math.PI / 2);
          g.fillStyle = '#0a0d12'; this._rr(g, -18, -14, 36, 28, 2); g.fill();
          g.fillStyle = 'rgba(0,0,0,.6)'; this._rr(g, -16, -12, 32, 24, 2); g.fill(); // pozzo scuro
          g.strokeStyle = '#2e343f'; g.lineWidth = 3; g.lineCap = 'round';
          for (let x = -14; x <= 14; x += 7) { g.beginPath(); g.moveTo(x, -12); g.lineTo(x, 12); g.stroke(); }
          for (let y = -10; y <= 10; y += 7) { g.beginPath(); g.moveTo(-15, y); g.lineTo(15, y); g.stroke(); }
          g.strokeStyle = '#4a5260'; g.lineWidth = 2.5; g.strokeRect(-16, -12, 32, 24); // cornice
          g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; for (let x = -14; x <= 14; x += 7) { g.beginPath(); g.moveTo(x - 1, -12); g.lineTo(x - 1, 12); g.stroke(); }
          g.fillStyle = '#5a6270'; for (const c of [[-16, -12], [16, -12], [-16, 12], [16, 12]]) { g.beginPath(); g.arc(c[0], c[1], 2, 0, 7); g.fill(); } g.lineCap = 'butt'; break; } // il vapore lo emette il render
        case 'giant_crystal': { // v1.25 — cristallo gigante (landmark luminoso)
          const th = this.theme || {}; const col = th.accent || '#8be9ff';
          g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(0, 20, 20, 8, 0, 0, 7); g.fill();
          const face = (pts, lite) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); const gr = g.createLinearGradient(0, -46, 0, 18); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, col); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.globalAlpha = lite; g.fill(); g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.2; g.stroke(); };
          face([[0, -48], [12, -6], [0, 18], [-3, -6]], 1);      // faccia principale
          face([[0, -48], [-3, -6], [0, 18], [-13, -2]], 0.72);  // faccia sinistra (piu scura)
          face([[0, -48], [12, -6], [7, -30]], 0.9);
          // schegge alla base
          for (const s of [[-16, 10, 6, 16], [15, 12, 5, 12]]) { g.save(); g.translate(s[0], 8); const gr = g.createLinearGradient(0, -s[3], 0, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, col); gr.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = gr; g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -s[3]); g.lineTo(s[2], -s[3] * 0.4); g.lineTo(0, 4); g.lineTo(-s[2], -s[3] * 0.4); g.closePath(); g.fill(); g.stroke(); g.restore(); }
          g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(2, -30); g.lineTo(4, -16); g.lineTo(0, -20); g.closePath(); g.fill(); break; }
        case 'gem_statue': { // v1.25 — statua rituale con gemma incastonata (luminosa)
          const th = this.theme || {}; const gem = th.accent || '#c56bff';
          g.fillStyle = 'rgba(0,0,0,.42)'; g.beginPath(); g.ellipse(0, 22, 18, 7, 0, 0, 7); g.fill();
          g.fillStyle = '#33303a'; g.strokeStyle = '#17141c'; g.lineWidth = 2; this._rr(g, -14, 16, 28, 8, 2); g.fill(); g.stroke(); // base
          const bg = g.createLinearGradient(-10, 0, 10, 0); bg.addColorStop(0, '#4a4652'); bg.addColorStop(.5, '#6a6474'); bg.addColorStop(1, '#3a3640'); g.fillStyle = bg; g.strokeStyle = '#17141c'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(-9, 16); g.lineTo(-7, -8); g.quadraticCurveTo(-9, -18, -4, -22); g.lineTo(4, -22); g.quadraticCurveTo(9, -18, 7, -8); g.lineTo(9, 16); g.closePath(); g.fill(); g.stroke(); // corpo incappucciato
          g.fillStyle = '#2c2833'; g.beginPath(); g.arc(0, -24, 5.5, 0, 7); g.fill(); g.stroke(); // testa
          // braccia che reggono la gemma al petto
          g.strokeStyle = '#4a4652'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-6, -6); g.lineTo(0, -2); g.lineTo(6, -6); g.stroke(); g.lineCap = 'butt';
          // GEMMA luminosa
          g.save(); g.shadowColor = gem; g.shadowBlur = 12; const gg = g.createRadialGradient(0, -2, 0, 0, -2, 6); gg.addColorStop(0, '#ffffff'); gg.addColorStop(0.5, gem); gg.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = gg; g.beginPath(); g.moveTo(0, -8); g.lineTo(5, -2); g.lineTo(0, 4); g.lineTo(-5, -2); g.closePath(); g.fill(); g.restore();
          g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.stroke(); break; }
      }
      g.restore();
    },
    _bakeCamp(g, p) { g.save(); g.translate(p.x, p.y); g.fillStyle = '#4a4030'; g.strokeStyle = '#2a2418'; g.lineWidth = 2; g.beginPath(); g.moveTo(-30, 14); g.lineTo(-14, -14); g.lineTo(2, 14); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = '#1a160e'; g.beginPath(); g.moveTo(-14, -14); g.lineTo(-14, 14); g.stroke(); g.fillStyle = '#3a4152'; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.beginPath(); g.arc(18 + Math.cos(a) * 12, 4 + Math.sin(a) * 8, 3.5, 0, 7); g.fill(); } g.strokeStyle = '#3a2a18'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(12, 6); g.lineTo(24, 2); g.moveTo(13, 2); g.lineTo(23, 8); g.stroke(); g.restore(); p.fx = p.x + 18; p.fy = p.y + 4; },
    burst(x, y, c, n, spd, life) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = MU.rand(spd * 0.3, spd); this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life || 0.5, t: life || 0.5, color: c, r: MU.rand(1.5, 3.5) }); } },
    // v1.61 — DRENAGGIO del Fuoco Fatuo: scintille che RISALGONO dal giocatore verso il fatuo (direzione
    // = chi sta rubando a chi). Riusa il sistema particellare esistente: nessuna passata di disegno nuova.
    drain(fx, fy, tx, ty, c) {
      const col = c || '#7dffea'; const dx = tx - fx, dy = ty - fy; const d = Math.hypot(dx, dy) || 1;
      const nx = dx / d, ny = dy / d;
      for (let i = 0; i < 9; i++) {
        const k = i / 9, sp = MU.rand(150, 260);
        const jx = -ny * MU.rand(-9, 9), jy = nx * MU.rand(-9, 9);
        this.particles.push({ x: fx + nx * d * k * 0.35 + jx, y: fy + ny * d * k * 0.35 + jy,
          vx: nx * sp + jx * 2, vy: ny * sp + jy * 2, life: 0.34, t: 0.34, color: col, r: MU.rand(1.4, 2.8), over: true });
      }
      this.ring(fx, fy, col, 3, 22, 0.3);
    },
    ring(x, y, c, r0, r1, life) { this.flashes.push({ x, y, color: c, r0, r1, life, t: life }); },
    // v1.66 — FENDENTE del guerriero. Il server manda raggio e apertura REALI dell'area che ferisce: il
    // disegno usa quelli e non un'approssimazione, cosi' il giocatore impara la portata guardando, non
    // provando. Dura poco (0.22s) perche' deve leggersi come un colpo, non come una zona.
    swing(x, y, a, rad, half, crit) { this.swings.push({ x, y, a, rad, half, crit: !!crit, t: 0, dur: 0.22 }); },
    // v1.70 — LEVEL UP sopra la testa. Non e' un floater qualunque: resta agganciato al GIOCATORE (che
    // nel frattempo si muove e continua a combattere), sale piano, e sotto ha il numero del livello.
    // Dura 1,6s perche' deve farsi leggere anche in mezzo a un'ondata.
    levelUp(who, lv) { this.levelUps.push({ who, lv: lv || 0, t: 0, dur: 1.6 }); },
    _drawLevelUps(ctx, world) {
      if (!this.levelUps.length) return;
      const r = C.PLAYER_RADIUS * (C.VIS_SCALE || 1);
      for (const L of this.levelUps) {
        const p = (world.players || []).find(x => x.i === L.who); if (!p || p.d) continue;
        const u = L.t / L.dur;
        const su = u < 0.18 ? (u / 0.18) : 1;                 // scatto d'ingresso
        const sc = 0.6 + 0.4 * Math.min(1, su * 1.35);
        const a = u > 0.72 ? (1 - (u - 0.72) / 0.28) : 1;
        const y = p.y - r - 54 - u * 26;
        ctx.save(); ctx.globalAlpha = Math.max(0, a);
        ctx.translate(p.x, y); ctx.scale(sc, sc); ctx.textAlign = 'center';
        ctx.font = 'bold 22px Segoe UI';
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,12,18,.92)'; ctx.strokeText('LEVEL UP', 0, 0);
        const g = this._grad('lvup', () => { const q = ctx.createLinearGradient(0, -16, 0, 6); q.addColorStop(0, '#fff6d0'); q.addColorStop(0.55, '#ffd27a'); q.addColorStop(1, '#e0a52c'); return q; });
        ctx.fillStyle = g; ctx.fillText('LEVEL UP', 0, 0);
        if (L.lv) { ctx.font = 'bold 14px Segoe UI'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,12,18,.92)';
          ctx.strokeText('Lv. ' + L.lv, 0, 17); ctx.fillStyle = '#ffe9a8'; ctx.fillText('Lv. ' + L.lv, 0, 17); }
        ctx.textAlign = 'left'; ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
    // v1.66 — memoria dell'ultimo attacco, per animare l'arco del ladro e il bastone del mago.
    heroAtk(id) { if (id != null) this.atk[id] = 0.20; },
    floater(x, y, text, c, big) { this.floaters.push({ x, y, text, color: c, life: big ? 1.0 : 0.7, t: big ? 1.0 : 0.7, big }); },
    chain(x1, y1, x2, y2) { this.chains.push({ x1, y1, x2, y2, t: 0.18 }); },
    addShake(v) { this.shake = Math.min(20, this.shake + v); },
    fire(x, y, n, up) { for (let i = 0; i < n; i++) { const a = MU.rand(-0.5, 0.5); this.particles.push({ x: x + MU.rand(-6, 6), y: y + MU.rand(-3, 3), vx: Math.sin(a) * 18, vy: -(up || 40) - Math.random() * 30, life: MU.rand(0.4, 0.8), t: 0, fire: true, r: MU.rand(3, 7), over: true }); } },
    render(dt, world) {
      this.time += dt; const ctx = this.ctx; ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, this.w, this.h); if (!this.map || !world) return;
      const me = world.me; if (me) { this.cam.x += (me.x - this.cam.x) * Math.min(1, dt * 8); this.cam.y += (me.y - this.cam.y) * Math.min(1, dt * 8); }
      let sx = 0, sy = 0; if (this.shake > 0.1) { sx = MU.rand(-this.shake, this.shake); sy = MU.rand(-this.shake, this.shake); this.shake *= 0.86; }
      const camX = this.cam.x - this.w / 2 + sx, camY = this.cam.y - this.h / 2 + sy; ctx.save(); ctx.translate(-camX, -camY);
      if (this.mapCanvas) ctx.drawImage(this.mapCanvas, 0, 0);
      this._drawEdgeTendrils(ctx, world);   // v1.64 — i tentacoli escono dalla roccia vicino a te
      for (const tc of this.torches) this._flame(ctx, tc.x, tc.y, 0.8);
      for (const cf of this.campfires) this._flame(ctx, cf.fx || cf.x, cf.fy || cf.y, 1.5);
      if (this.map.exit) {
        const ex = this.map.exit.x * this.map.tile + this.map.tile / 2, ey = this.map.exit.y * this.map.tile + this.map.tile / 2;
        // v1.52 — nel MERCATO il portale e' l'unica via d'uscita: piu' grande, verde, con etichetta EXIT.
        const market = world.phase === 'market';
        const pr = (market ? 46 : 22) + Math.sin(this.time * 3) * (market ? 9 : 5);
        const gr = ctx.createRadialGradient(ex, ey, 2, ex, ey, pr);
        gr.addColorStop(0, market ? 'rgba(180,255,190,.95)' : 'rgba(140,233,255,.9)');
        gr.addColorStop(1, market ? 'rgba(60,220,120,0)' : 'rgba(60,160,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ex, ey, pr, 0, 7); ctx.fill();
        if (market) {
          const pu = 0.55 + 0.45 * Math.sin(this.time * 3);
          ctx.save();
          ctx.strokeStyle = 'rgba(120,255,170,' + (0.45 + pu * 0.45).toFixed(3) + ')'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(ex, ey, 34 + pu * 4, 0, 7); ctx.stroke();
          ctx.globalCompositeOperation = 'lighter';
          const cg = ctx.createLinearGradient(ex, ey - 130, ex, ey);
          cg.addColorStop(0, 'rgba(120,255,170,0)'); cg.addColorStop(1, 'rgba(120,255,170,' + (0.10 + pu * 0.12).toFixed(3) + ')');
          ctx.fillStyle = cg; ctx.fillRect(ex - 17, ey - 130, 34, 130);
          ctx.restore();
          ctx.save(); ctx.textAlign = 'center';
          ctx.font = 'bold 26px Segoe UI'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.85)';
          ctx.strokeText('EXIT', ex, ey - 54);
          ctx.fillStyle = 'rgba(170,255,205,' + (0.75 + pu * 0.25).toFixed(3) + ')'; ctx.fillText('EXIT', ex, ey - 54);
          ctx.font = 'bold 12px Segoe UI'; ctx.lineWidth = 4;
          ctx.strokeText('entra per proseguire', ex, ey - 38);
          ctx.fillStyle = 'rgba(205,255,225,.9)'; ctx.fillText('entra per proseguire', ex, ey - 38);
          ctx.restore(); ctx.textAlign = 'left';
        }
      }
      for (const o of (world.xp || [])) this._drawXp(ctx, o);
      for (const o of (world.coins || [])) this._drawCoin(ctx, o);
      for (const it of (world.items || [])) this._drawItem(ctx, it);
      for (const c of (world.crates || [])) this._drawCrate(ctx, c);
      if (world.merch) this._drawMerchant(ctx, world.merch, me);
      if (world.merchD) this._drawDarkMerchant(ctx, world.merchD, me);
      if (this.map && this.map.village) { for (const n of this.map.village.npcs) { if (!n.shop) this._drawVendor(ctx, n); }
        for (const e of (this.map.village.extras || [])) this._drawVendor(ctx, e, { noLabel: 1 }); }   // v1.75 — gente del villaggio  // v1.56 — abitanti (il fabbro lo disegna _drawGearMerchant)
      if (world.gmerch) this._drawGearMerchant(ctx, world.gmerch, me);
      for (const wd of (world.wdrops || [])) this._drawWeapon(ctx, wd);
      for (const z of (world.zones || [])) { const cc = z.c || '#ff3b3b'; const gr = ctx.createRadialGradient(z.x, z.y, 2, z.x, z.y, z.r); gr.addColorStop(0, 'rgba(255,60,60,' + (0.10 + z.p * 0.28) + ')'); gr.addColorStop(0.75, 'rgba(255,60,60,' + (0.06 + z.p * 0.18) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.fill(); ctx.strokeStyle = cc; ctx.globalAlpha = 0.4 + z.p * 0.55; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(z.x, z.y, z.r * z.p, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      for (const mt of world.met) { ctx.strokeStyle = 'rgba(255,120,40,' + (0.4 + mt.p * 0.5) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mt.x, mt.y, mt.r, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,80,20,' + (mt.p * 0.35) + ')'; ctx.beginPath(); ctx.arc(mt.x, mt.y, mt.r * mt.p, 0, 7); ctx.fill(); }
      for (const o of world.orbs) this._drawOrb(ctx, o);
      this._drawCritters(ctx, camX, camY, dt); // v1.22 — animaletti
      this._drawParticles(ctx, false);
      // v1.64 — SCARTO FUORI INQUADRATURA. Finora mostri e proiettili venivano disegnati TUTTI, anche quelli
      // fuori schermo: la canvas li ritagliava, ma il costo di costruire i tracciati era gia' stato pagato.
      // L'illuminazione lo faceva gia' (light() ha il suo test), il disegno no. Misurato: 11-15% del frame.
      const vx0 = camX - 90, vy0 = camY - 90, vx1 = camX + this.w + 90, vy1 = camY + this.h + 90;
      for (const b of world.bul) { if (b.x < vx0 || b.x > vx1 || b.y < vy0 || b.y > vy1) continue; this._drawBullet(ctx, b); }
      for (const m of world.mon) { if (m.x < vx0 || m.x > vx1 || m.y < vy0 || m.y > vy1) continue; this._drawMonster(ctx, m); }
      this._drawDeaths(ctx); // v1.26 — sprite di morte (crollo/dissolvenza)
      for (const p of world.players) this._drawPlayer(ctx, p, me && p.i === me.i);
      this._drawChains(ctx);
      this._drawParticles(ctx, true); this._drawSwings(ctx); this._drawFlashes(ctx); this._drawFloaters(ctx); this._drawLevelUps(ctx, world);
      this._drawDust(ctx, camX, camY, dt); // v1.16 — pulviscolo ambientale (world-space)
      this._drawFog(ctx, camX, camY, dt); // v1.21 — nebbia volumetrica a strati
      ctx.restore(); this._drawLighting(ctx, world, camX, camY);
      this._drawDarkness(world, camX, camY); // v1.16 — cono torcia + mappa scura (tasto L)
      if (world.bt) { ctx.fillStyle = 'rgba(0,240,200,0.06)'; ctx.fillRect(0, 0, this.w, this.h); ctx.strokeStyle = 'rgba(0,240,200,0.15)'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, this.w - 8, this.h - 8); }
      this._drawEdgeVignette(ctx, world);   // v1.63 — la faglia si chiude dai bordi dello schermo
      this._drawMinimap(ctx, world);
    },
    _flame(ctx, x, y, sc) { const t = this.time; const f = 1 + Math.sin(t * 12 + x) * 0.14 + Math.sin(t * 7.3 + y) * 0.1; const s = sc * f; let gr = ctx.createRadialGradient(x, y, 0, x, y, 26 * s); gr.addColorStop(0, 'rgba(255,150,40,.5)'); gr.addColorStop(1, 'rgba(255,80,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 26 * s, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,120,30,.9)'; ctx.beginPath(); ctx.moveTo(x - 6 * s, y + 4 * s); ctx.quadraticCurveTo(x - 7 * s, y - 8 * s, x, y - 16 * s); ctx.quadraticCurveTo(x + 7 * s, y - 8 * s, x + 6 * s, y + 4 * s); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,225,120,.95)'; ctx.beginPath(); ctx.moveTo(x - 3 * s, y + 2 * s); ctx.quadraticCurveTo(x - 3.5 * s, y - 5 * s, x, y - 11 * s); ctx.quadraticCurveTo(x + 3.5 * s, y - 5 * s, x + 3 * s, y + 2 * s); ctx.closePath(); ctx.fill(); if (Math.random() < 0.25 * sc) this.particles.push({ x: x + MU.rand(-3, 3), y: y - 6 * s, vx: MU.rand(-8, 8), vy: -MU.rand(20, 50), life: MU.rand(0.4, 0.9), t: 0, fire: true, r: MU.rand(1.5, 3) * sc, over: true }); },
    _drawMerchant(ctx, mrc, me) {
      const t = this.time; const x = mrc.x, y = mrc.y; const bob = Math.sin(t * 2) * 1.5;
      // v1.23 — beacon SEMPRE visibile per individuarlo sulla mappa
      const bt = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const bmg = ctx.createLinearGradient(x, y - 78, x, y - 8); bmg.addColorStop(0, 'rgba(255,207,74,0)'); bmg.addColorStop(1, 'rgba(255,207,74,' + (0.10 + bt * 0.12) + ')'); ctx.fillStyle = bmg; ctx.fillRect(x - 7, y - 78, 14, 66); ctx.restore();
      ctx.strokeStyle = 'rgba(255,207,74,' + (0.35 + bt * 0.45) + ')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y + 4, 30 + bt * 5, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x, y + 18, 26, 8, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = '#3a2a18'; ctx.strokeStyle = '#20160b'; ctx.lineWidth = 2; ctx.fillRect(-24, -2, 48, 20); ctx.strokeRect(-24, -2, 48, 20);
      ctx.fillStyle = '#ffcf4a'; ctx.beginPath(); ctx.arc(-14, 2, 3, 0, 7); ctx.arc(-6, 3, 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#7dffea'; this._rr(ctx, 6, -2, 8, 7, 2); ctx.fill(); ctx.fillStyle = '#ff5a7a'; ctx.beginPath(); ctx.arc(18, 2, 3.4, 0, 7); ctx.fill();
      ctx.strokeStyle = '#5a3d20'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26, -2); ctx.lineTo(-30, -34); ctx.moveTo(26, -2); ctx.lineTo(30, -34); ctx.stroke();
      for (let i = 0; i < 6; i++) { ctx.fillStyle = (i % 2) ? '#a9302e' : '#e8d9b0'; ctx.beginPath(); ctx.moveTo(-30 + i * 10, -34); ctx.lineTo(-30 + (i + 1) * 10, -34); ctx.lineTo(-30 + i * 10 + 5, -26); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = '#20160b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-30, -34); ctx.lineTo(30, -34); ctx.stroke();
      const lg = ctx.createRadialGradient(24, -20 + bob, 1, 24, -20 + bob, 14); lg.addColorStop(0, 'rgba(255,200,90,.9)'); lg.addColorStop(1, 'rgba(255,160,40,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(24, -20 + bob, 14, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2018'; this._rr(ctx, 21, -26 + bob, 6, 10, 2); ctx.fill(); ctx.fillStyle = '#ffd66a'; this._rr(ctx, 22.5, -24 + bob, 3, 6, 1); ctx.fill();
      ctx.translate(0, bob);
      ctx.fillStyle = '#5a3a7a'; ctx.strokeStyle = '#2a1740'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(-10, -22, 0, -26); ctx.quadraticCurveTo(10, -22, 13, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a2450'; ctx.beginPath(); ctx.arc(0, -22, 8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#0a0810'; ctx.beginPath(); ctx.arc(0, -19, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(-2.2, -19, 1.4, 0, 7); ctx.arc(2.2, -19, 1.4, 0, 7); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,207,74,' + (0.7 + 0.3 * Math.sin(t * 4)) + ')'; ctx.font = 'bold 17px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('🪙', x, y - 44 + bob); ctx.textAlign = 'left';
      ctx.fillStyle = '#ffe9b0'; ctx.font = 'bold 13px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('\uD83E\uDE99 Mercante', x, y - 60 + bob); ctx.textAlign = 'left';
    },
    // v1.52 — MERCATO: il fabbro dell'equipaggiamento. Forgia + incudine + martello, accento ambra,
    // beacon sempre acceso (sta al centro della mappa, deve leggersi anche col buio della torcia).
    _drawGearMerchant(ctx, mrc, me) {
      const t = this.time, x = mrc.x, y = mrc.y;
      const bt = 0.5 + 0.5 * Math.sin(t * 2.4), flick = 0.65 + 0.35 * Math.sin(t * 11 + x * 0.3);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const bmg = ctx.createLinearGradient(x, y - 96, x, y - 8);
      bmg.addColorStop(0, 'rgba(255,150,60,0)'); bmg.addColorStop(1, 'rgba(255,150,60,' + (0.12 + bt * 0.14).toFixed(3) + ')');
      ctx.fillStyle = bmg; ctx.fillRect(x - 9, y - 96, 18, 84); ctx.restore();
      ctx.strokeStyle = 'rgba(255,170,60,' + (0.30 + bt * 0.45).toFixed(3) + ')'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y + 6, 40 + bt * 6, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(x, y + 20, 34, 10, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(x, y);
      // forgia: braciere con carboni ardenti
      ctx.fillStyle = '#2b2119'; ctx.strokeStyle = '#15100a'; ctx.lineWidth = 2;
      this._rr(ctx, -46, -6, 26, 24, 4); ctx.fill(); ctx.stroke();
      const fg = ctx.createRadialGradient(-33, -6, 1, -33, -6, 20 * flick);
      fg.addColorStop(0, 'rgba(255,220,120,.95)'); fg.addColorStop(0.5, 'rgba(255,130,40,.6)'); fg.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(-33, -6, 20 * flick, 0, 7); ctx.fill();
      // incudine
      ctx.fillStyle = '#3d4048'; ctx.strokeStyle = '#191b20'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-16, 18); ctx.lineTo(-9, 6); ctx.lineTo(-13, 2); ctx.lineTo(-20, 2);
      ctx.lineTo(-22, -4); ctx.lineTo(14, -4); ctx.lineTo(18, 0); ctx.lineTo(12, 4); ctx.lineTo(9, 6);
      ctx.lineTo(16, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = t * 6 + i * 1.7, sx = -4 + Math.cos(a) * 12, sy = -8 - Math.abs(Math.sin(a)) * 12;
        ctx.fillStyle = 'rgba(255,210,90,' + (0.5 + 0.5 * Math.sin(a * 2)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, 7); ctx.fill(); }
      // fabbro dietro l'incudine, martello che batte
      const sw = Math.sin(t * 3.2);
      ctx.translate(24, 0);
      ctx.fillStyle = '#4a3524'; ctx.strokeStyle = '#241a10'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-12, 6); ctx.quadraticCurveTo(-10, -18, 0, -23); ctx.quadraticCurveTo(10, -18, 12, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6b4c30'; ctx.beginPath(); ctx.arc(0, -26, 8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#0d0a07'; ctx.beginPath(); ctx.arc(0, -23, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffb14a'; ctx.beginPath(); ctx.arc(-2.2, -23, 1.5, 0, 7); ctx.arc(2.2, -23, 1.5, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(-10, -10); ctx.rotate(-0.7 + sw * 0.55);
      ctx.strokeStyle = '#5a3d20'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-16, -6); ctx.stroke();
      ctx.fillStyle = '#585c66'; this._rr(ctx, -24, -12, 11, 11, 2); ctx.fill();
      ctx.restore();
      ctx.restore();
      ctx.save(); ctx.textAlign = 'center';
      ctx.font = 'bold 13px Segoe UI'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.8)';
      ctx.strokeText('\uD83D\uDD28 Fabbro \u2014 Emporio', x, y - 62);
      ctx.fillStyle = '#ffe0a8'; ctx.fillText('\uD83D\uDD28 Fabbro \u2014 Emporio', x, y - 62);
      ctx.restore(); ctx.textAlign = 'left';
    },
    // v1.57 — MERCANTE. Taglia DOPPIA rispetto alla v1.56 e piu' dettagliato, ma stesso stile:
    // figura incappucciata, volto in ombra, occhi accesi. Ognuno tiene in mano l'oggetto del suo mestiere.
    // Il fuoco della piazza li illumina da un lato (rimlight caldo) cosi' non sembrano incollati sul fondo.
    // v1.75 — I MERCANTI RIUSANO LA SILHOUETTE DEGLI EROI, ricolorata e DISARMATA (`civile`), con
    // l'attrezzo del mestiere in mano. Il primo tentativo era una sagoma nuova disegnata da zero: vista
    // grande erano uova, perche' testa, torso e mantello avevano la stessa taglia e si fondevano. Quella
    // degli eroi invece e' gia' tarata per la lettura a picco — ed e' l'unico disegno del gioco che sia
    // stato limato fino a convincere. Riusarlo costa niente e tiene insieme lo stile: se un domani un
    // eroe cambia, i mercanti cambiano con lui.
    _vendorBase: { smith: 'guerriero', crier: 'guerriero', innkeeper: 'ladro', herbalist: 'mago', seer: 'mago', patron: 'ladro' },
    _vendorPal: {
      smith:     { cloth: '#8a5a2c', clothDk: '#4a2f14', steelDk: '#4a4038', pelo: '#5a4026', skin: '#e0b183', trim: '#ffb14a' },
      crier:     { cloth: '#6b5a72', clothDk: '#33303f', steelDk: '#5a6070', pelo: '#4a4050', skin: '#e0b48f', trim: '#ff9a8a' },
      innkeeper: { cloth: '#b8863c', clothDk: '#6b4a1c', skin: '#f0c795', wood: '#8a6534', trim: '#ffd97a' },
      herbalist: { body: '#3f6b34', bodyDk: '#1f3a1b', accent: '#9fe06a', orlo: 'rgba(159,224,106,.8)', skin: '#e3c396', trim: '#9fe06a' },
      seer:      { body: '#5a4780', bodyDk: '#2b1f3f', accent: '#c9a0ff', orlo: 'rgba(201,160,255,.8)', skin: '#dcc4ea', trim: '#c9a0ff' },
      patron:    { cloth: '#a08a68', clothDk: '#6b5940', body: '#a08a68', bodyDk: '#6b5940', pelo: '#63513a', skin: '#e6c79c', wood: '#7a5a34', trim: '#e8d9b0' },
    },
    _vendorTool(ctx, kind, r) {
      ctx.save(); ctx.translate(r * 1.15, r * 0.25);
      if (kind === 'smith') {                       // martello da fucina
        ctx.strokeStyle = '#4a3520'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(6, -6); ctx.stroke();
        ctx.fillStyle = '#7b828e'; ctx.strokeStyle = '#22262d'; ctx.lineWidth = 1.4; this._rr(ctx, 4, -11, 9, 7, 1.5); ctx.fill(); ctx.stroke();
      } else if (kind === 'innkeeper') {            // vassoio con i boccali
        ctx.fillStyle = '#5a4326'; ctx.strokeStyle = '#241a10'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(2, 0, 10, 7.5, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c9a35a'; for (const d of [[-3, -2], [4, 1], [0, 3]]) { ctx.beginPath(); ctx.arc(2 + d[0], d[1], 2.6, 0, 7); ctx.fill(); }
      } else if (kind === 'herbalist') {            // mazzo d'erbe
        ctx.strokeStyle = '#4e7a3c'; ctx.lineWidth = 1.6;
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-4, 2); ctx.quadraticCurveTo(2, -2 + k, 7, -6 + k * 3); ctx.stroke(); }
        ctx.fillStyle = '#9fe06a'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(7, -6 + k * 3, 2.2, 3.2, k * 0.4, 0, 7); ctx.fill(); }
      } else if (kind === 'seer') {                 // ventaglio di carte
        for (let k = -1; k <= 1; k++) { ctx.save(); ctx.rotate(k * 0.32);
          ctx.fillStyle = '#efe6ff'; ctx.strokeStyle = '#5a4780'; ctx.lineWidth = 1.2; this._rr(ctx, 0, -5, 7, 10, 1.5); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#c9a0ff'; ctx.beginPath(); ctx.arc(3.5, 0, 1.6, 0, 7); ctx.fill(); ctx.restore(); }
      } else if (kind === 'crier') {                // registro delle taglie
        ctx.fillStyle = '#e8dcc0'; ctx.strokeStyle = '#6b5024'; ctx.lineWidth = 1.4; this._rr(ctx, -4, -7, 12, 14, 1.5); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-2, -4 + k * 4); ctx.lineTo(6, -4 + k * 4); ctx.stroke(); }
      } else {                                      // boccale
        ctx.fillStyle = '#8a6a30'; ctx.strokeStyle = '#4a3512'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(2, 2, 3.6, 0, 7); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    },
    // SEDUTO: niente mantello che svolazza (chi e' seduto non ce l'ha dietro), veste allargata a terra
    // tutt'attorno e le spalle piu' strette. La differenza si legge anche di sfuggita.
    _vendorSeduto(ctx, kind, r, t) {
      const P = this._vendorPal[kind] || this._vendorPal.patron;
      const cor = P.body || P.cloth, corDk = P.bodyDk || P.clothDk;
      ctx.fillStyle = corDk; ctx.strokeStyle = '#07080c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(-r * 0.14, 0, r * 1.05, r * 0.88, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = cor; ctx.strokeStyle = '#07080c'; ctx.lineWidth = 2;
      this._rr(ctx, -r * 0.42, -r * 0.55, r * 0.86, r * 1.1, r * 0.28); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.34); ctx.lineTo(r * 0.28, -r * 0.34); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(r * 0.36, 0, r * 0.38, 0, 7); ctx.fill();
      ctx.fillStyle = P.pelo || corDk; ctx.strokeStyle = '#07080c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(r * 0.4, 0, r * 0.34, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.skin || '#e0be93';
      ctx.beginPath(); ctx.arc(r * 0.47, 0, r * 0.24, -1.3, 1.3); ctx.closePath(); ctx.fill();
      this._vendorTool(ctx, kind, r * 0.62);
    },
    _drawVendor(ctx, n, opts) {
      const o = opts || {}, t = this.time, x = n.x, y = n.y;
      const r = C.PLAYER_RADIUS * (C.VIS_SCALE || 1);
      const base = this._vendorBase[n.kind] || 'ladro';
      const pal = this._vendorPal[n.kind] || this._vendorPal.patron;
      const bob = Math.sin(t * 1.1 + x * 0.03) * 0.9;
      ctx.save(); ctx.translate(x, y + bob);
      this._shadow(ctx, 0, 0, r * (n.seated ? 0.8 : 1));
      ctx.rotate(n.face != null ? n.face : 0);
      if (n.seated) this._vendorSeduto(ctx, n.kind, r, t);
      else { this._hero(ctx, base, r, t + (x * 0.013), false, 0, { pal, civile: 1 }); this._vendorTool(ctx, n.kind, r); }
      ctx.restore();

      if (!o.noLabel) {
        const ny = y - r * 1.5 - 26;
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 14px Segoe UI';
        const label = (o.label || n.name || '');
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(12,9,6,.85)'; ctx.strokeStyle = pal.trim || '#c8a23a'; ctx.lineWidth = 2;
        this._rr(ctx, x - tw / 2 - 10, ny - 11, tw + 20, 22, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f4e3b8'; ctx.fillText(label, x, ny + 1);
        const sub = n.soon ? '— chiuso —' : (n.sub ? '— ' + n.sub + ' —' : '');
        if (sub) { ctx.font = 'bold 11px Segoe UI'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.85)';
          ctx.strokeText(sub, x, ny + 20); ctx.fillStyle = n.soon ? 'rgba(205,195,175,.8)' : 'rgba(255,205,130,.9)'; ctx.fillText(sub, x, ny + 20); }
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.restore();
      }
    },
    // v1.57 — il fabbro e' l'unico mercante attivo: stessa figura degli altri, piu' l'anello-beacon che
    // segnala "qui si compra". Fucina e incudine sono diventate il suo banchetto, disegnato nella mappa.
    _drawGearMerchant(ctx, mrc, me) {
      const t = this.time, x = mrc.x, y = mrc.y, bt = 0.5 + 0.5 * Math.sin(t * 2.4);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const bmg = ctx.createLinearGradient(x, y - 110, x, y - 8);
      bmg.addColorStop(0, 'rgba(255,150,60,0)'); bmg.addColorStop(1, 'rgba(255,150,60,' + (0.10 + bt * 0.12).toFixed(3) + ')');
      ctx.fillStyle = bmg; ctx.fillRect(x - 10, y - 110, 20, 96); ctx.restore();
      ctx.strokeStyle = 'rgba(255,170,60,' + (0.30 + bt * 0.45).toFixed(3) + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, y + 30, 46 + bt * 6, 18 + bt * 3, 0, 0, 7); ctx.stroke();
      this._drawVendor(ctx, { x, y, kind: 'smith', name: 'Fabbro', face: (this.map && this.map.village && this.map.village.smithFace) || 0, sub: 'emporio' });
    },
    // v1.58 — FUNGO SPORIFERO. Immobile per design: tutto il movimento sta nel respiro del cappello e
    // nell'urto di quando sputa le spore. Vettoriale puro, nessun asset.
    _fungusF(ctx, m, r, def, atk) {
      const t = this.time, eye = def.eye || '#c8ff6a';
      const a = atk || 0;
      const puff = a > 0 ? Math.sin(Math.min(1, a) * Math.PI) : 0;         // gonfia -> sgonfia
      const breathe = 1 + Math.sin(t * 1.6 + m.x * 0.02) * 0.035 + puff * 0.30;
      ctx.save();
      // micelio a terra
      ctx.strokeStyle = 'rgba(120,160,80,.22)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) { const an = (i / 7) * 6.283 + m.x * 0.01;
        ctx.beginPath(); ctx.moveTo(0, r * 0.55); ctx.lineTo(Math.cos(an) * r * 1.35, r * 0.55 + Math.sin(an) * r * 0.34); ctx.stroke(); }
      ctx.lineCap = 'butt';
      ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.beginPath(); ctx.ellipse(0, r * 0.62, r * 0.95, r * 0.34, 0, 0, 7); ctx.fill();
      // gambo
      const st = ctx.createLinearGradient(0, -r * 0.2, 0, r * 0.6); st.addColorStop(0, '#d8d0b4'); st.addColorStop(1, '#7d745c');
      ctx.fillStyle = st; ctx.strokeStyle = '#2a2a1e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-r * 0.28, r * 0.6); ctx.quadraticCurveTo(-r * 0.20, 0, -r * 0.22, -r * 0.25);
      ctx.lineTo(r * 0.22, -r * 0.25); ctx.quadraticCurveTo(r * 0.20, 0, r * 0.28, r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      // lamelle luminose sotto il cappello
      ctx.save(); ctx.scale(breathe, breathe);
      const gl = ctx.createRadialGradient(0, -r * 0.18, 1, 0, -r * 0.18, r * 1.05);
      gl.addColorStop(0, this._rgba ? this._rgba(eye, 0.55 + puff * 0.4) : eye); gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(0, -r * 0.14, r * 1.0, r * 0.42, 0, 0, 7); ctx.fill();
      // cappello
      const cg = ctx.createLinearGradient(0, -r * 1.15, 0, -r * 0.1);
      cg.addColorStop(0, '#4a5a34'); cg.addColorStop(1, '#202a16');
      ctx.fillStyle = cg; ctx.strokeStyle = '#12180c'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.ellipse(0, -r * 0.28, r * 1.02, r * 0.78, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      // macchie
      ctx.fillStyle = 'rgba(200,255,120,.55)';
      for (const d of [[-0.44, -0.62, 0.15], [0.30, -0.72, 0.13], [0.62, -0.44, 0.10], [-0.10, -0.86, 0.11]])
        { ctx.beginPath(); ctx.ellipse(d[0] * r, d[1] * r, d[2] * r, d[2] * r * 0.72, 0, 0, 7); ctx.fill(); }
      // occhietti sotto la cuffia
      ctx.fillStyle = eye; ctx.globalAlpha = 0.65 + 0.35 * Math.sin(t * 3);
      ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.12, r * 0.09, 0, 7); ctx.arc(r * 0.18, -r * 0.12, r * 0.09, 0, 7); ctx.fill();
      ctx.globalAlpha = 1; ctx.restore();
      // spore che salgono quando spara
      if (puff > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 9; i++) { const an = (i / 9) * 6.283 + t, rr2 = r * (0.5 + puff * 1.5);
          ctx.fillStyle = this._rgba ? this._rgba(eye, 0.5 * puff) : eye;
          ctx.beginPath(); ctx.arc(Math.cos(an) * rr2, -r * 0.5 + Math.sin(an) * rr2 * 0.5 - puff * r, r * 0.10, 0, 7); ctx.fill(); }
        ctx.restore(); }
      ctx.restore();
    },
    // v1.58 — SFERA D'OSSA. La rotazione e ricavata dallo SPOSTAMENTO REALE (niente frame): rotola davvero,
    // e quando e ferma resta ferma. In carica si schiaccia e vibra.
    _rollerF(ctx, m, r, def, atk) {
      const t = this.time, eye = def.eye || '#ff7a3b';
      this._roll = this._roll || {}; this._rollP = this._rollP || {};
      const prev = this._rollP[m.e]; let step = 0;
      if (prev) step = Math.hypot(m.x - prev.x, m.y - prev.y);
      this._rollP[m.e] = { x: m.x, y: m.y };
      const dir = step > 0.4 ? Math.atan2(m.y - (prev ? prev.y : m.y), m.x - (prev ? prev.x : m.x)) : (m.f || 0);
      this._roll[m.e] = (this._roll[m.e] || 0) + (step / Math.max(6, r)) * (Math.cos(dir) >= 0 ? 1 : -1);
      const spin = this._roll[m.e];
      const a = atk || 0;
      const wind = a > 0 ? Math.sin(Math.min(1, a) * Math.PI) : 0;      // carica: schiaccia e trema
      const sx = 1 + wind * 0.22, sy = 1 - wind * 0.18;
      const shake = wind * 2.4;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0, r * 0.72, r * 0.86, r * 0.3, 0, 0, 7); ctx.fill();
      ctx.translate(Math.sin(t * 40) * shake, Math.cos(t * 37) * shake * 0.6);
      ctx.scale(sx, sy); ctx.rotate(spin);
      // sfera di ossa
      const bg = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r);
      bg.addColorStop(0, '#efe8d2'); bg.addColorStop(0.6, '#cfc7b0'); bg.addColorStop(1, '#6f6857');
      ctx.fillStyle = bg; ctx.strokeStyle = '#3a3527'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke();
      // suture / placche
      ctx.strokeStyle = 'rgba(60,54,40,.75)'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(0, 0, r * (0.92 - k * 0.06), r * (0.34 + k * 0.2), k * 1.05, 0, 7); ctx.stroke(); }
      // spuntoni d'osso
      ctx.fillStyle = '#e6dfc8'; ctx.strokeStyle = '#3a3527'; ctx.lineWidth = 1.6;
      for (let k = 0; k < 6; k++) { const an = (k / 6) * 6.283; ctx.save(); ctx.rotate(an);
        ctx.beginPath(); ctx.moveTo(-r * 0.16, -r * 0.94); ctx.lineTo(0, -r * 1.24); ctx.lineTo(r * 0.16, -r * 0.94); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
      // orbite accese
      ctx.fillStyle = '#171410'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.1, r * 0.19, r * 0.24, -0.2, 0, 7); ctx.ellipse(r * 0.3, -r * 0.1, r * 0.19, r * 0.24, 0.2, 0, 7); ctx.fill();
      const gp = 0.6 + 0.4 * Math.sin(t * 5) + wind * 0.5;
      ctx.fillStyle = this._rgba ? this._rgba(eye, Math.min(1, gp)) : eye;
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.10, 0, 7); ctx.arc(r * 0.3, -r * 0.1, r * 0.10, 0, 7); ctx.fill();
      ctx.restore();
      // scia di polvere mentre rotola
      if (step > 1.2) { ctx.save(); ctx.globalAlpha = 0.28;
        for (let i = 1; i <= 3; i++) { ctx.fillStyle = '#8a8270';
          ctx.beginPath(); ctx.arc(-Math.cos(dir) * r * i * 0.7, -Math.sin(dir) * r * i * 0.7 + r * 0.4, r * (0.3 - i * 0.06), 0, 7); ctx.fill(); }
        ctx.restore(); }
    },
    // v1.61 — NUGOLO DI PIPISTRELLI. Una sola entita', 9 sagome che ORBITANO attorno al centro con fasi
    // diverse (angolo aureo: mai allineate). Ogni pipistrello e' corpo + due ali, e le ali sono UNA SOLA
    // sinusoide di battito: zero cicli di camminata, zero asset. In attacco il nugolo si STRINGE e scatta.
    // NOTA CONTRASTO: su pavimento quasi nero un pipistrello nero sparisce. Il corpo e' quindi GRIGIO-VIOLA
    // con bordo piu' chiaro, e sotto il nugolo c'e' un alone viola tenue che lo fa leggere a colpo d'occhio.
    _batsF(ctx, m, r, def, atk) {
      const t = this.time, eye = def.eye || '#c9a0ff', N = def.swarmN || 9;
      const a = atk || 0;
      const agg = a > 0 ? Math.sin(Math.min(1, a) * Math.PI) : 0;
      ctx.save();
      // ombra: una macchia sola, non 9 — il nugolo legge come UN nemico
      ctx.fillStyle = 'rgba(0,0,0,.30)';
      ctx.beginPath(); ctx.ellipse(0, r * 0.98, r * 0.66 * (1 - agg * 0.25), r * 0.22, 0, 0, 7); ctx.fill();
      // alone di massa: senza, su roccia nera lo sciame e' invisibile
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const hg = ctx.createRadialGradient(0, -r * 0.15, r * 0.2, 0, -r * 0.15, r * 1.45);
      hg.addColorStop(0, this._rgba(eye, 0.13 + agg * 0.10)); hg.addColorStop(1, this._rgba(eye, 0));
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, -r * 0.15, r * 1.45, 0, 7); ctx.fill();
      ctx.restore();
      // ordinamento per profondita': i pipistrelli "dietro" prima, cosi' si sovrappongono giusti
      const list = [];
      for (let i = 0; i < N; i++) {
        const ph = i * 2.399963;
        const rad = r * (0.34 + 0.60 * ((i * 0.37) % 1)) * (1 - agg * 0.38);
        const sp = 1.5 + ((i * 0.53) % 1) * 1.6;
        const an = t * sp + ph;
        list.push({
          x: Math.cos(an) * rad * 1.42,
          y: Math.sin(an * 0.9 + ph) * rad * 0.54 - r * 0.26 + Math.sin(t * 3.1 + i) * r * 0.12,
          s: r * 0.225 * (0.80 + 0.40 * ((i * 0.71) % 1)),
          ph: t * (11 + (i % 4) * 2.3) + i * 1.7,
          fp: Math.cos(an) < 0 ? -1 : 1,
        });
      }
      list.sort((p, q) => p.y - q.y);
      // v1.64 — niente piu' disegno vettoriale per pipistrello: si sceglie la posa dal battito (che e' una
      // sinusoide, quindi periodica) e si copia il fotogramma gia' cotto.
      const FR = this._batFrames(eye);
      for (const b of list) {
        const idx = ((((b.ph / 6.283185) % 1) + 1) % 1 * FR.n) | 0;
        const k = b.s / FR.S;
        ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.fp * k, k);
        ctx.drawImage(FR.frames[idx], -FR.ox, -FR.oy);
        ctx.restore();
      }
      ctx.restore();
    },
    // v1.64 — PIPISTRELLO COTTO. Misurato: il Nugolo costava 116 microsecondi per nemico per frame, TRE volte
    // lo scheletro e quindici volte la melma — di gran lunga il nemico piu' caro del gioco. Il motivo: 9 sagome
    // x (2 gradienti lineari + una ventina di operazioni di path) = 18 gradienti e ~180 operazioni per singolo
    // nugolo, sessanta volte al secondo. Il battito d'ali pero' e' una sinusoide: ha solo N pose distinte.
    // Le disegniamo UNA volta su canvas piccole e poi si fa drawImage, che e' una copia di pixel.
    _batFrames(eye) {
      const key = 'bat|' + eye;
      this._batC = this._batC || {};
      if (this._batC[key]) return this._batC[key];
      const S = 26, N = 12;
      const W = Math.ceil(S * 4.6 + 10), H = Math.ceil(S * 2.5 + 10);
      const ox = W / 2, oy = S * 1.7 + 5;
      const frames = [];
      for (let i = 0; i < N; i++) {
        const up = 0.30 + 0.70 * Math.sin((i / N) * 6.283185);
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const g = cv.getContext('2d'); g.translate(ox, oy);
        this._bat1(g, 0, 0, S, up, eye, 1);
        frames.push(cv);
      }
      const o = { frames, n: N, S, ox, oy };
      this._batC[key] = o; return o;
    },
    // singolo pipistrello: ali = due archi che si aprono/chiudono con `up`, corpo = ellisse, orecchie, occhietti
    _bat1(ctx, x, y, s, up, eye, flip) {
      ctx.save(); ctx.translate(x, y); if (flip < 0) ctx.scale(-1, 1);
      // membrana alare: grigio-viola con bordo chiaro (leggibile su nero) + venature
      const wg = ctx.createLinearGradient(0, -s * 1.1, 0, s * 0.5);
      wg.addColorStop(0, '#6a5c86'); wg.addColorStop(0.55, '#453a5c'); wg.addColorStop(1, '#2b2340');
      ctx.fillStyle = wg; ctx.strokeStyle = '#8e7fb0'; ctx.lineWidth = Math.max(0.7, s * 0.09); ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.1);
      ctx.quadraticCurveTo(-s * 1.35, -s * 1.45 * up, -s * 2.15, -s * 0.22 * up - s * 0.06);
      ctx.quadraticCurveTo(-s * 1.45, s * 0.26, 0, s * 0.34);
      ctx.quadraticCurveTo(s * 1.45, s * 0.26, s * 2.15, -s * 0.22 * up - s * 0.06);
      ctx.quadraticCurveTo(s * 1.35, -s * 1.45 * up, 0, -s * 0.1);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // venature delle ali: due segmenti per lato, danno la lettura di "ala" e non di "macchia"
      ctx.strokeStyle = 'rgba(155,138,190,.55)'; ctx.lineWidth = Math.max(0.5, s * 0.06);
      ctx.beginPath();
      ctx.moveTo(-s * 0.15, -s * 0.02); ctx.lineTo(-s * 1.55, -s * 0.62 * up);
      ctx.moveTo(-s * 0.15, s * 0.06); ctx.lineTo(-s * 1.45, s * 0.12);
      ctx.moveTo(s * 0.15, -s * 0.02); ctx.lineTo(s * 1.55, -s * 0.62 * up);
      ctx.moveTo(s * 0.15, s * 0.06); ctx.lineTo(s * 1.45, s * 0.12);
      ctx.stroke();
      // corpo
      const bg = ctx.createLinearGradient(0, -s * 0.7, 0, s * 0.7);
      bg.addColorStop(0, '#5b4f74'); bg.addColorStop(1, '#241d33');
      ctx.fillStyle = bg; ctx.strokeStyle = '#0f0b18'; ctx.lineWidth = Math.max(0.6, s * 0.07);
      ctx.beginPath(); ctx.ellipse(0, s * 0.06, s * 0.42, s * 0.64, 0, 0, 7); ctx.fill(); ctx.stroke();
      // orecchie
      ctx.fillStyle = '#3d3355';
      ctx.beginPath();
      ctx.moveTo(-s * 0.32, -s * 0.34); ctx.lineTo(-s * 0.20, -s * 0.98); ctx.lineTo(-s * 0.02, -s * 0.40); ctx.closePath();
      ctx.moveTo(s * 0.32, -s * 0.34); ctx.lineTo(s * 0.20, -s * 0.98); ctx.lineTo(s * 0.02, -s * 0.40); ctx.closePath();
      ctx.fill();
      // occhietti accesi
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = eye;
      ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.14, s * 0.13, 0, 7); ctx.arc(s * 0.18, -s * 0.14, s * 0.13, 0, 7); ctx.fill();
      ctx.restore();
      ctx.restore();
    },
    // v1.61 — FUOCO FATUO. Fiamma fredda sospesa: nucleo additivo, lingua di fuoco che sfarfalla (nessun
    // frame: 3 sinusoidi sfasate), 3 scintille in orbita e ondeggio verticale lento. In drenaggio avvampa.
    _wispF(ctx, m, r, def, atk) {
      const t = this.time, eye = def.eye || '#7dffea';
      const a = atk || 0;
      const fl = a > 0 ? Math.sin(Math.min(1, a) * Math.PI) : 0;             // avvampata del drenaggio
      const bob = Math.sin(t * 1.5 + (m.e || 0)) * (def.bobAmp || 6);
      const flick = 0.82 + 0.18 * Math.sin(t * 9.3 + (m.e || 0)) + 0.10 * Math.sin(t * 21.7);
      ctx.save();
      // riflesso a terra: non e' un'ombra, e' luce proiettata (fluttua, non poggia)
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const fg = ctx.createRadialGradient(0, r * 1.5, 1, 0, r * 1.5, r * 1.9);
      fg.addColorStop(0, this._rgba(eye, 0.14 + fl * 0.10)); fg.addColorStop(1, this._rgba(eye, 0));
      ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(0, r * 1.5, r * 1.9, r * 0.6, 0, 0, 7); ctx.fill();
      ctx.restore();
      ctx.translate(0, bob);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      // alone
      const hg = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * (2.5 + fl * 0.7));
      hg.addColorStop(0, this._rgba(eye, (0.34 + fl * 0.30) * flick)); hg.addColorStop(0.45, this._rgba(eye, 0.10 * flick)); hg.addColorStop(1, this._rgba(eye, 0));
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, r * (2.5 + fl * 0.7), 0, 7); ctx.fill();
      // lingua di fiamma: larghezza e punta modulate da tre sinusoidi sfasate
      const hgt = r * (1.55 + 0.22 * Math.sin(t * 6.1) + fl * 0.5);
      const wid = r * (0.62 + 0.08 * Math.sin(t * 7.7 + 1.1));
      const sway = r * 0.16 * Math.sin(t * 4.3 + 0.7);
      ctx.fillStyle = this._rgba(eye, 0.55 * flick);
      ctx.beginPath();
      ctx.moveTo(0, r * 0.55);
      ctx.quadraticCurveTo(-wid, r * 0.1, -wid * 0.55 + sway * 0.5, -hgt * 0.45);
      ctx.quadraticCurveTo(-wid * 0.18 + sway, -hgt * 0.82, sway, -hgt);
      ctx.quadraticCurveTo(wid * 0.18 + sway, -hgt * 0.82, wid * 0.55 + sway * 0.5, -hgt * 0.45);
      ctx.quadraticCurveTo(wid, r * 0.1, 0, r * 0.55);
      ctx.closePath(); ctx.fill();
      // nucleo bianco
      const cg = ctx.createRadialGradient(0, -r * 0.12, 1, 0, -r * 0.12, r * 0.72);
      cg.addColorStop(0, 'rgba(255,255,255,' + (0.92 * flick) + ')'); cg.addColorStop(0.5, this._rgba(eye, 0.7 * flick)); cg.addColorStop(1, this._rgba(eye, 0));
      ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(0, -r * 0.12, r * 0.6, r * 0.74, 0, 0, 7); ctx.fill();
      // due occhietti vuoti dentro il nucleo: da lontano e' una fiamma, da vicino ti guarda
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(4,18,20,' + (0.55 + 0.25 * Math.sin(t * 2.6)) + ')';
      ctx.beginPath(); ctx.ellipse(-r * 0.22, -r * 0.2, r * 0.11, r * 0.16, -0.15, 0, 7);
      ctx.ellipse(r * 0.22, -r * 0.2, r * 0.11, r * 0.16, 0.15, 0, 7); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      // scintille in orbita
      for (let i = 0; i < 3; i++) {
        const an = t * (1.9 + i * 0.6) + i * 2.1, rr2 = r * (1.0 + 0.25 * Math.sin(t * 2 + i));
        ctx.fillStyle = this._rgba(eye, 0.55 + 0.35 * Math.sin(t * 5 + i * 2));
        ctx.beginPath(); ctx.arc(Math.cos(an) * rr2, Math.sin(an) * rr2 * 0.55 - r * 0.1, r * 0.12, 0, 7); ctx.fill();
      }
      ctx.restore();
      ctx.restore();
      // brace che sale, rada (una ogni ~5 frame): la scia che lo rende "vivo" senza costare
      if (Math.random() < 0.22) this.particles.push({ x: m.x + MU.rand(-r * 0.5, r * 0.5), y: m.y + bob - r * 0.3,
        vx: MU.rand(-8, 8), vy: -MU.rand(14, 34), life: 0.6, t: 0.6, color: eye, r: MU.rand(1, 2.2), over: true });
    },
    _drawDarkMerchant(ctx, mrc, me) {
      const t = this.time; const x = mrc.x, y = mrc.y; const bob = Math.sin(t * 1.6) * 1.4; const flick = 0.6 + 0.4 * Math.sin(t * 9 + x);
      // v1.32 — beacon SEMPRE visibile (parità col Mercante Errante): colonna di luce viola/cremisi + anello pulsante
      const bt = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const bmg = ctx.createLinearGradient(x, y - 80, x, y - 8); bmg.addColorStop(0, 'rgba(180,80,255,0)'); bmg.addColorStop(1, 'rgba(180,80,255,' + (0.10 + bt * 0.13) + ')'); ctx.fillStyle = bmg; ctx.fillRect(x - 7, y - 80, 14, 68); const bmg2 = ctx.createLinearGradient(x, y - 80, x, y - 8); bmg2.addColorStop(0, 'rgba(255,45,107,0)'); bmg2.addColorStop(1, 'rgba(255,45,107,' + (0.05 + bt * 0.06) + ')'); ctx.fillStyle = bmg2; ctx.fillRect(x - 4, y - 80, 8, 68); ctx.restore();
      ctx.strokeStyle = 'rgba(199,125,255,' + (0.35 + bt * 0.45) + ')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y + 4, 30 + bt * 5, 0, 7); ctx.stroke();
      // ombra viola
      ctx.fillStyle = 'rgba(40,0,50,.5)'; ctx.beginPath(); ctx.ellipse(x, y + 18, 24, 8, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(x, y);
      // altare di pietra scura
      ctx.fillStyle = '#241026'; ctx.strokeStyle = '#0a040c'; ctx.lineWidth = 2; this._rr(ctx, -22, -2, 44, 20, 3); ctx.fill(); ctx.stroke();
      // rune incise che pulsano
      ctx.strokeStyle = 'rgba(180,80,255,' + flick + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, 8); ctx.lineTo(-8, 2); ctx.lineTo(-14, 2); ctx.moveTo(0, 8); ctx.lineTo(4, 2); ctx.lineTo(0, 2); ctx.lineTo(4, 8); ctx.moveTo(12, 8); ctx.lineTo(16, 2); ctx.stroke();
      // teschi ai lati dell'altare
      ctx.fillStyle = '#d8d2c0'; ctx.beginPath(); ctx.arc(-18, 2, 3.4, 0, 7); ctx.arc(18, 2, 3.4, 0, 7); ctx.fill(); ctx.fillStyle = '#0a040c'; ctx.beginPath(); ctx.arc(-19, 1.6, 1, 0, 7); ctx.arc(-17, 1.6, 1, 0, 7); ctx.arc(17, 1.6, 1, 0, 7); ctx.arc(19, 1.6, 1, 0, 7); ctx.fill();
      // pali ricurvi + lanterna viola sospesa
      ctx.strokeStyle = '#1a0a1e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, -2); ctx.lineTo(28, -30); ctx.quadraticCurveTo(20, -34, 14, -32); ctx.stroke();
      const lg = ctx.createRadialGradient(14, -30 + bob, 1, 14, -30 + bob, 16); lg.addColorStop(0, 'rgba(190,90,255,' + (0.7 + 0.3 * flick) + ')'); lg.addColorStop(1, 'rgba(120,20,160,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(14, -30 + bob, 16, 0, 7); ctx.fill();
      ctx.fillStyle = '#160820'; this._rr(ctx, 11, -35 + bob, 6, 10, 2); ctx.fill(); ctx.fillStyle = '#c77dff'; this._rr(ctx, 12.5, -33 + bob, 3, 6, 1); ctx.fill();
      // relique fluttuanti attorno
      for (let i = 0; i < 3; i++) { const a = t * 1.2 + i * 2.1; const rx = Math.cos(a) * 20, ry = -14 + Math.sin(a) * 6 + bob; ctx.fillStyle = ['#ff2d6b', '#b061ff', '#7dffea'][i]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(rx, ry, 2.4, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      // v1.32 — figura incappucciata scura dietro l'altare (restyle)
      ctx.translate(-2, bob);
      const cg = ctx.createLinearGradient(0, -34, 0, 4); cg.addColorStop(0, '#3a1550'); cg.addColorStop(0.6, '#20102e'); cg.addColorStop(1, '#0a040c'); ctx.fillStyle = cg; ctx.strokeStyle = '#1a0820'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-15, 4); ctx.quadraticCurveTo(-13, -28, 0, -33); ctx.quadraticCurveTo(13, -28, 15, 4); ctx.quadraticCurveTo(0, 10, -15, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      // bordo runico sulla veste
      ctx.strokeStyle = 'rgba(199,125,255,' + (0.3 + 0.3 * flick) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-11, 2); ctx.lineTo(11, 2); ctx.stroke();
      // spalle a punta bordate
      ctx.fillStyle = '#20102e'; ctx.strokeStyle = '#1a0820'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(-20, -16); ctx.lineTo(-9, -11); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(14, -8); ctx.lineTo(20, -16); ctx.lineTo(9, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
      // cappuccio
      ctx.fillStyle = '#20102a'; ctx.strokeStyle = '#0a040c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-9, -24); ctx.quadraticCurveTo(0, -40, 9, -24); ctx.quadraticCurveTo(0, -20, -9, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
      // volto: TESCHIO
      ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.arc(0, -25, 5.6, 0, 7); ctx.fill(); ctx.fillRect(-3.6, -22, 7.2, 4);
      ctx.fillStyle = '#0a040c'; ctx.beginPath(); ctx.arc(-2.3, -26, 1.8, 0, 7); ctx.arc(2.3, -26, 1.8, 0, 7); ctx.fill();
      // occhi ardenti viola dentro le orbite
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#d9a6ff'; ctx.shadowColor = '#c77dff'; ctx.shadowBlur = 9; ctx.beginPath(); ctx.arc(-2.3, -26, 1.0, 0, 7); ctx.arc(2.3, -26, 1.0, 0, 7); ctx.fill(); ctx.restore();
      // mani ossute che presentano la merce
      ctx.strokeStyle = '#e8e0d0'; ctx.lineCap = 'round'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-12, -2); ctx.moveTo(8, -6); ctx.lineTo(12, -2); ctx.stroke();
      ctx.restore();
      // simbolo teschio fluttuante + etichetta se vicino
      ctx.fillStyle = 'rgba(199,125,255,' + (0.7 + 0.3 * Math.sin(t * 4)) + ')'; ctx.font = 'bold 17px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('\uD83D\uDC80', x, y - 46 + bob); ctx.textAlign = 'left';
      // v1.32 — etichetta SEMPRE visibile (come il Mercante Errante), non solo da vicino
      ctx.fillStyle = '#e0b0ff'; ctx.font = 'bold 13px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('\uD83D\uDC80 Mercante Nero', x, y - 62 + bob); ctx.textAlign = 'left';
    },
    _drawXp(ctx, o) { const t = this.time; const y = o.y + Math.sin(t * 6 + o.e) * 1.2; ctx.fillStyle = 'rgba(120,255,180,' + (0.5 + 0.3 * Math.sin(t * 8 + o.e)) + ')'; ctx.beginPath(); ctx.arc(o.x, y, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#eaffe6'; ctx.beginPath(); ctx.arc(o.x, y, 2, 0, 7); ctx.fill(); },
    _drawCoin(ctx, o) { const cc = COIN_COL[o.c] || { color: '#ffcf4a', r: 5 }; const t = this.time; const ph = o.e || 0; const y = o.y + Math.sin(t * 5 + ph) * 1.4; const sq = Math.abs(Math.cos(t * 3 + ph)); const rw = cc.r * (0.4 + 0.6 * sq); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(o.x, o.y + 6, cc.r * 0.9, cc.r * 0.4, 0, 0, 7); ctx.fill(); ctx.fillStyle = cc.color; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(o.x, y, rw, cc.r, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.35 * sq) + ')'; ctx.beginPath(); ctx.ellipse(o.x - rw * 0.3, y - cc.r * 0.3, rw * 0.3, cc.r * 0.35, 0, 0, 7); ctx.fill(); },
    _drawItem(ctx, it) { const def = ITEM_BY_ID[it.id] || {}; const col = def.color || '#ffd24a'; const t = this.time; const y = it.y + Math.sin(t * 2.5 + it.e) * 1.8;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(it.x, it.y + 12, 12, 5, 0, 0, 7); ctx.fill();
      const gr = ctx.createRadialGradient(it.x, y, 2, it.x, y, 26); gr.addColorStop(0, col + 'cc'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 5 + it.e); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(it.x, y, 26, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = col; ctx.strokeStyle = '#0a0c12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(it.x, y, 8, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0a0c12'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(def.glyph || '?', it.x, y + 4); ctx.textAlign = 'left'; },
    _drawCrate(ctx, c) { const t = this.time; const x = c.x, y = c.y + Math.sin(t * 2 + c.e) * 1.2; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 14, 15, 6, 0, 0, 7); ctx.fill(); const gr = ctx.createRadialGradient(x, y, 2, x, y, 30); gr.addColorStop(0, 'rgba(255,200,80,' + (0.28 + 0.12 * Math.sin(t * 4 + c.e)) + ')'); gr.addColorStop(1, 'rgba(255,180,40,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 30, 0, 7); ctx.fill(); ctx.fillStyle = '#6b4a28'; ctx.strokeStyle = '#2c1c0e'; ctx.lineWidth = 2; this._rr(ctx, x - 14, y - 11, 28, 22, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5a3d20'; this._rr(ctx, x - 14, y - 3, 28, 6, 2); ctx.fill(); ctx.strokeStyle = '#b98b4a'; ctx.beginPath(); ctx.moveTo(x - 14, y - 3); ctx.lineTo(x + 14, y - 3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x, y + 11); ctx.stroke(); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(x, y - 1, 3.2, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,235,150,.9)'; ctx.font = 'bold 14px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('?', x, y - 16 + Math.sin(t * 3 + c.e) * 2); ctx.textAlign = 'left'; },
    _drawWeapon(ctx, wd) { const W = window.GAME.Loot.WEAPONS[wd.wt] || {}; const col = W.color || '#ffd24a'; const t = this.time; const x = wd.x, y = wd.y + Math.sin(t * 2.5 + wd.e) * 1.6; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(wd.x, wd.y + 14, 13, 5, 0, 0, 7); ctx.fill(); const gr = ctx.createRadialGradient(x, y, 2, x, y, 30); gr.addColorStop(0, col + 'cc'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 5 + wd.e); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 30, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#0a0c12'; ctx.lineWidth = 2; if (wd.wt === 'scatter') { ctx.fillStyle = col; this._rr(ctx, -10, -4, 20, 8, 2); ctx.fill(); ctx.stroke(); } else if (wd.wt === 'burst') { ctx.fillStyle = col; this._rr(ctx, -9, -3, 16, 6, 2); ctx.fill(); ctx.stroke(); } else { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(0, -7); ctx.lineTo(11, 0); ctx.lineTo(0, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.restore(); for (let i = 0; i < 3; i++) { ctx.fillStyle = i < (wd.lv || 1) ? col : 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(x - 8 + i * 8, y - 15, 2.4, 0, 7); ctx.fill(); } },
    _drawChains(ctx) { for (const c of this.chains) { const a = c.t / 0.18; ctx.strokeStyle = 'rgba(140,220,255,' + a + ')'; ctx.lineWidth = 2.5; ctx.beginPath(); const seg = 4; ctx.moveTo(c.x1, c.y1); for (let i = 1; i < seg; i++) { const t = i / seg; ctx.lineTo(MU.lerp(c.x1, c.x2, t) + MU.rand(-6, 6), MU.lerp(c.y1, c.y2, t) + MU.rand(-6, 6)); } ctx.lineTo(c.x2, c.y2); ctx.stroke(); } },
    // v1.63 — LA FAGLIA AI MARGINI. L'alone si chiude dai bordi dello schermo mentre la carica sale, e
    // la carica comincia a salire APPENA entri nella fascia — cioe' 2.5 secondi PRIMA che il danno inizi.
    // E' un avviso, non un castigo: quando i filamenti compaiono hai gia' perso vita, quando l'alone e'
    // appena accennato sei ancora in tempo. Il valore arriva dallo snapshot (me.eg, 0..1).
    // v1.65 — IL FASCIO DELLA FAGLIA. La prima versione (tentacoli sottili) era troppo timida: si vedeva
    // appena, e un avviso che non si vede non e' un avviso. Rifatta con lo stesso linguaggio visivo del
    // FASCIO DELLO SGUARDO del Beholder, che nel gioco funziona: ventaglio pieno che si allarga dalla
    // sorgente + nucleo pulsante ad alta frequenza + bagliore alla radice.
    // Differenza chiave rispetto ai tentacoli: i filamenti ARRIVANO al giocatore invece di allungarsi a
    // caso. E' la linea che collega causa ed effetto — si capisce a colpo d'occhio che e' QUEL muro a farti
    // male, non "l'aria". In un angolo partono due fasci, uno per lato.
    // le RADICI del fascio: il punto sulla roccia del bordo piu' vicino, per ogni lato entro portata.
    // Serve sia al fascio sia al buio (che deve aprire un buco li', altrimenti l'effetto resta al buio).
    _edgeRoots(me) {
      const m = this.map; if (!m || !me) return [];
      const T = m.tile;
      const x0 = 2 * T, y0 = 2 * T, x1 = (m.w - 2) * T, y1 = (m.h - 2) * T;
      const REACH = (C.EDGE_MARGIN || 3) * T + 150;
      const r = [];
      if (me.x - x0 < REACH) r.push({ x: x0 - T * 0.5, y: me.y });
      if (x1 - me.x < REACH) r.push({ x: x1 + T * 0.5, y: me.y });
      if (me.y - y0 < REACH) r.push({ x: me.x, y: y0 - T * 0.5 });
      if (y1 - me.y < REACH) r.push({ x: me.x, y: y1 + T * 0.5 });
      return r;
    },
    _drawEdgeTendrils(ctx, world) {
      const me = world.me; if (!me) return;
      const lv = me.eg || 0; if (lv <= 0.02) return;
      const m = this.map; if (!m) return;
      const T = m.tile, t = this.time, col = '#b25cff';
      const x0 = 2 * T, y0 = 2 * T, x1 = (m.w - 2) * T, y1 = (m.h - 2) * T;
      const roots = this._edgeRoots(me);
      if (!roots.length) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const r of roots) {
        const dx = me.x - r.x, dy = me.y - r.y;
        const len = Math.max(30, Math.hypot(dx, dy));
        const ang = Math.atan2(dy, dx);
        ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(ang);

        // 1) VENTAGLIO — gradiente in cache su lunghezze arrotondate (niente allocazioni per frame)
        const L = Math.max(40, Math.round(len / 40) * 40);
        const spread = Math.tan(0.40) * len;
        const gr = this._grad('ef|' + L, () => {
          const q = ctx.createLinearGradient(0, 0, L, 0);
          q.addColorStop(0, this._rgba(col, 0.46)); q.addColorStop(0.6, this._rgba(col, 0.12)); q.addColorStop(1, this._rgba(col, 0.02));
          return q;
        });
        ctx.globalAlpha = 0.28 + 0.72 * lv;
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, -spread * 0.55); ctx.lineTo(len, spread * 0.55); ctx.closePath(); ctx.fill();

        // 2) FILAMENTI che arrivano ADDOSSO al giocatore
        ctx.globalAlpha = 1;
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const w1 = Math.sin(t * (2.1 + i * 0.6) + i * 1.9) * len * 0.16;
          const w2 = Math.sin(t * (1.5 + i * 0.5) + i * 2.7) * len * 0.11;
          ctx.strokeStyle = this._rgba(col, (0.30 + 0.50 * lv) * (0.55 + 0.45 * Math.sin(t * 8 + i * 2.1)));
          ctx.lineWidth = 1.8 + 3.2 * lv * (0.5 + 0.5 * ((i * 0.37) % 1));
          ctx.beginPath();
          ctx.moveTo(0, (i - 2) * 9);
          ctx.bezierCurveTo(len * 0.34, w1, len * 0.68, w2, len, 0);
          ctx.stroke();
        }

        // 3) NUCLEO pulsante ad alta frequenza, come la linea centrale dello sguardo del Beholder
        ctx.strokeStyle = this._rgba('#eccfff', (0.30 + 0.55 * lv) * (0.5 + 0.5 * Math.sin(t * 14)));
        ctx.lineWidth = 1.4 + 2.2 * lv;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
        ctx.lineCap = 'butt';

        // 4) BAGLIORE alla radice: la ferita nella roccia da cui esce tutto
        const fg = this._grad('efr', () => {
          const q = ctx.createRadialGradient(0, 0, 2, 0, 0, 110);
          q.addColorStop(0, this._rgba('#e0b3ff', 0.85)); q.addColorStop(0.35, this._rgba(col, 0.35)); q.addColorStop(1, this._rgba(col, 0));
          return q;
        });
        ctx.globalAlpha = (0.35 + 0.65 * lv) * (0.75 + 0.25 * Math.sin(t * 6));
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0, 0, 110, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      ctx.restore();
    },
    _drawEdgeVignette(ctx, world) {
      const me = world.me; if (!me) return;
      const lv = me.eg || 0; if (lv <= 0.01) return;
      const t = this.time, W = this.w, H = this.h;
      const pulse = 0.72 + 0.28 * Math.sin(t * (4 + lv * 10));
      // soglia bassa ALZATA: a lv 0.15 (dentro la finestra di grazia, nessun danno ancora) prima non si
      // vedeva niente, e un avviso invisibile non e' un avviso. Ora l'alone si accende subito e poi si chiude.
      const a = Math.min(0.82, 0.14 + lv * 0.72) * pulse;
      ctx.save();
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (0.55 - lv * 0.26), W / 2, H / 2, Math.max(W, H) * 0.74);
      g.addColorStop(0, 'rgba(120,30,180,0)');
      g.addColorStop(0.6, 'rgba(108,26,168,' + (a * 0.30).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(52,6,96,' + a.toFixed(3) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // filamenti che strisciano verso l'interno: compaiono solo quando il drenaggio morde davvero
      if (lv > 0.34) {
        const k = (lv - 0.34) / 0.66;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(190,110,255,' + (0.16 + 0.22 * k).toFixed(3) + ')';
        ctx.lineCap = 'round';
        for (let i = 0; i < 22; i++) {
          const s = (i * 0.61803) % 1, side = i % 4;
          const len = (26 + 74 * k) * (0.5 + ((i * 0.37) % 1)) * (0.8 + 0.2 * Math.sin(t * 3 + i));
          ctx.lineWidth = 1 + 1.6 * ((i * 0.53) % 1);
          ctx.beginPath();
          if (side === 0) { ctx.moveTo(s * W, 0); ctx.quadraticCurveTo(s * W + len * 0.3, len * 0.5, s * W - len * 0.2, len); }
          else if (side === 1) { ctx.moveTo(s * W, H); ctx.quadraticCurveTo(s * W - len * 0.3, H - len * 0.5, s * W + len * 0.2, H - len); }
          else if (side === 2) { ctx.moveTo(0, s * H); ctx.quadraticCurveTo(len * 0.5, s * H + len * 0.3, len, s * H - len * 0.2); }
          else { ctx.moveTo(W, s * H); ctx.quadraticCurveTo(W - len * 0.5, s * H - len * 0.3, W - len, s * H + len * 0.2); }
          ctx.stroke();
        }
        ctx.lineCap = 'butt';
      }
      ctx.restore();
    },
    // v1.64 — la funzione light() prende il gradiente dalla CACHE: prima ne allocava uno per OGNI sorgente
    // a ogni frame (torce, proiettili, monete, oggetti, giocatori, boss...). ATTENZIONE: questo metodo e' una
    // sola istruzione lunghissima, i commenti vanno sopra la riga, mai in coda.
    _drawLighting(ctx, world, camX, camY) { ctx.save(); const g = ctx; const grA = g.createRadialGradient(this.w / 2, this.h / 2, 80, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.68); grA.addColorStop(0, 'rgba(4,6,12,0.0)'); grA.addColorStop(0.7, 'rgba(3,4,9,0.55)'); grA.addColorStop(1, 'rgba(1,2,6,0.94)'); g.fillStyle = grA; g.fillRect(0, 0, this.w, this.h); g.globalCompositeOperation = 'lighter'; const light = (wx, wy, rad, color, a) => { const x = wx - camX, y = wy - camY; if (x < -rad || y < -rad || x > this.w + rad || y > this.h + rad) return; const R = Math.round(rad); const gr = this._grad('li|' + color + '|' + R, () => { const q = g.createRadialGradient(0, 0, 0, 0, 0, R); q.addColorStop(0, color); q.addColorStop(1, 'rgba(0,0,0,0)'); return q; }); g.globalAlpha = a; g.fillStyle = gr; g.translate(x, y); g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill(); g.translate(-x, -y); }; for (const tc of this.torches) light(tc.x, tc.y, 120, '#ff9a3b', 0.5); for (const cf of this.campfires) light(cf.fx || cf.x, cf.fy || cf.y, 200, '#ff8a2b', 0.55); if (this.bigLight) light(this.bigLight.x, this.bigLight.y, this.bigLight.r, '#ff9a3b', 0.42); for (const hz of (this.hazards || [])) light(hz.x, hz.y, hz.r || 42, hz.col, 0.2); for (const gl of (this.glows || [])) light(gl.x, gl.y, gl.rad, gl.col, gl.a); for (const c of (world.crates || [])) light(c.x, c.y, 60, '#ffcf5a', 0.3); for (const o of (world.coins || [])) light(o.x, o.y, 22, '#ffcf4a', 0.28); if (world.merch) light(world.merch.x, world.merch.y - 6, 150, '#ffcf7a', 0.5); if (world.merchD) { light(world.merchD.x, world.merchD.y - 6, 120, '#9b2cff', 0.45); light(world.merchD.x, world.merchD.y - 6, 60, '#ff2d6b', 0.35); } for (const o of (world.orbs || [])) { if (o.k === 'turret') light(o.x, o.y, 90, '#9fe0ff', 0.3); } for (const it of (world.items || [])) { const d = ITEM_BY_ID[it.id] || {}; light(it.x, it.y, 55, d.color || '#ffd24a', 0.3); } for (const p of world.players) if (!p.d) { const h = HERO[p.h] || HERO.guerriero; light(p.x, p.y, 190, h.accent || '#8bd6ff', 0.30); } for (const b of world.bul) light(b.x, b.y, 26, b.c || '#fff', 0.5); for (const m of world.mon) { if (m.tr) light(m.x, m.y, 90, '#ffd24a', 0.4); else if (m.b) light(m.x, m.y, m.mg ? 170 : 120, m.mg ? '#ff2d55' : '#ff6a3b', 0.2); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; ctx.restore(); },
    // v1.16 — MODALITÀ TORCIA: mappa quasi nera "bucata" da un cono di luce + aloni (tasto L)
    _drawDarkness(world, camX, camY) {
      if (!this.torch || !this.darkCv || !this.map) return;
      // v1.57 — la sala del mercato resta BUIA: la luce la fa il FALO' (vedi this.bigLight piu' sotto).
      const s = this.darkScale, dg = this.darkCtx, W = this.darkCv.width, H = this.darkCv.height;
      dg.setTransform(1, 0, 0, 1, 0, 0); dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, W, H);
      dg.fillStyle = 'rgba(2,3,8,' + this.darkness + ')'; dg.fillRect(0, 0, W, H);
      dg.globalCompositeOperation = 'destination-out';
      // v1.64 — stessa cura degli aloni di luce: gradiente costruito UNA volta attorno all'origine e riusato.
      const halo = (wx, wy, rad, a0) => { const x = (wx - camX) * s, y = (wy - camY) * s, r = Math.round(rad * s); if (x < -r || y < -r || x > W + r || y > H + r) return; const A = Math.round(a0 * 20) / 20; const gr = this._grad('ha|' + r + '|' + A, () => { const q = dg.createRadialGradient(0, 0, 0, 0, 0, r); q.addColorStop(0, 'rgba(0,0,0,' + A + ')'); q.addColorStop(0.6, 'rgba(0,0,0,' + (A * 0.82) + ')'); q.addColorStop(1, 'rgba(0,0,0,0)'); return q; }); dg.fillStyle = gr; dg.translate(x, y); dg.beginPath(); dg.arc(0, 0, r, 0, 7); dg.fill(); dg.translate(-x, -y); };
      // v1.17 — grande alone TONDO attorno a ogni eroe (niente più cono direzionale)
      for (const p of world.players) { if (p.d) continue; halo(p.x, p.y, this.haloR, 0.98); }
      // sorgenti che restano visibili nel buio
      for (const tc of this.torches) halo(tc.x, tc.y, 82, 0.9);
      for (const cf of this.campfires) halo(cf.fx || cf.x, cf.fy || cf.y, 135, 0.92);
      // v1.57 — il FALO' della sala mercato: un unico grande alone circolare che scopre i mercanti
      // e si spegne contro le pareti nere. E' l'unica sorgente della stanza.
      if (this.bigLight) halo(this.bigLight.x, this.bigLight.y, this.bigLight.r, 0.99);
      for (const hz of (this.hazards || [])) halo(hz.x, hz.y, (hz.r || 40) * 0.75, 0.5); // v1.18 — le pozze si intravedono nel buio
      // v1.65 — il fascio della faglia esce dal bordo, cioe' dalla parte piu' buia della mappa: senza un
      // buco nel buio proprio li' l'effetto resterebbe invisibile esattamente dove serve vederlo.
      if (world.me && (world.me.eg || 0) > 0.04) { const lv = world.me.eg; for (const r of this._edgeRoots(world.me)) halo(r.x, r.y, 150, 0.35 + 0.55 * lv); }
      for (const gl of (this.glows || [])) halo(gl.x, gl.y, (gl.rad || 40) * 0.7, 0.55); // v1.20 — funghi bioluminescenti
      if (this.map.exit) { const ex = this.map.exit.x * this.map.tile + this.map.tile / 2, ey = this.map.exit.y * this.map.tile + this.map.tile / 2; halo(ex, ey, 74, 0.85); }
      if (world.merch) halo(world.merch.x, world.merch.y, 140, 0.92);
      if (world.merchD) halo(world.merchD.x, world.merchD.y, 92, 0.85);
      for (const o of (world.orbs || [])) halo(o.x, o.y, 58, 0.7);
      for (const b of (world.bul || [])) halo(b.x, b.y, 20, 0.5); // i proiettili illuminano volando
      for (const m of world.mon) { if (m.b) halo(m.x, m.y, m.mg ? 92 : 72, 0.6); else if (m.el || m.tr) halo(m.x, m.y, 48, 0.5); }
      dg.globalCompositeOperation = 'source-over';
      const ctx = this.ctx; ctx.save(); ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(this.darkCv, 0, 0, W, H, 0, 0, this.w, this.h); ctx.restore();
    },
    // v1.16 — pulviscolo ambientale (dust motes) che fluttua nel fascio di luce
    _drawDust(ctx, camX, camY, dt) {
      const N = 70; const d = this.dust; const margin = 40;
      while (d.length < N) d.push({ x: camX - margin + Math.random() * (this.w + margin * 2), y: camY - margin + Math.random() * (this.h + margin * 2), vx: MU.rand(-6, 6), vy: MU.rand(-4, 10), r: MU.rand(0.5, 1.8), a: MU.rand(0.05, 0.22), ph: Math.random() * 7 });
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const p of d) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.ph += dt;
        // wrap attorno alla camera
        if (p.x < camX - margin) p.x = camX + this.w + margin; else if (p.x > camX + this.w + margin) p.x = camX - margin;
        if (p.y < camY - margin) p.y = camY + this.h + margin; else if (p.y > camY + this.h + margin) p.y = camY - margin;
        const tw = 0.6 + 0.4 * Math.sin(p.ph * 2);
        ctx.globalAlpha = p.a * tw; ctx.fillStyle = '#dfe8ff';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.restore();
    },
    // v1.21 — NEBBIA VOLUMETRICA: strati di foschia che derivano lentamente (world-space, si dirada nel buio)
    _drawFog(ctx, camX, camY, dt) {
      const N = 14; const f = this.fog; const M = 240;
      while (f.length < N) f.push({ x: camX - M + Math.random() * (this.w + M * 2), y: camY - M + Math.random() * (this.h + M * 2), r: MU.rand(130, 260), vx: MU.rand(-9, 9), vy: MU.rand(-5, 5), a: MU.rand(0.05, 0.11), ph: Math.random() * 7 });
      ctx.save();
      for (const p of f) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.ph += dt * 0.3;
        if (p.x < camX - M) p.x = camX + this.w + M; else if (p.x > camX + this.w + M) p.x = camX - M;
        if (p.y < camY - M) p.y = camY + this.h + M; else if (p.y > camY + this.h + M) p.y = camY - M;
        const a = p.a * (0.7 + 0.3 * Math.sin(p.ph));
        const gr = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r);
        gr.addColorStop(0, 'rgba(150,160,185,' + a + ')'); gr.addColorStop(1, 'rgba(150,160,185,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.restore();
    },
    _isWallW(wx, wy) { const m = this.map; if (!m) return false; const gx = (wx / m.tile) | 0, gy = (wy / m.tile) | 0; if (gx < 0 || gy < 0 || gx >= m.w || gy >= m.h) return true; return m.grid[gy * m.w + gx] === C.T_WALL; },
    // v1.22 — ANIMALETTI: ratti/ragni/scarafaggi che sfrecciano a scatti sul pavimento (cosmetici, evitano i muri)
    _drawCritters(ctx, camX, camY, dt) {
      if (!this.map) return; const N = 5, cr = this.critters, m = this.map, M = 60;
      while (cr.length < N) { const wx = camX + Math.random() * this.w, wy = camY + Math.random() * this.h; if (this._isWallW(wx, wy)) continue; cr.push({ x: wx, y: wy, a: Math.random() * 6.28, vx: 0, vy: 0, type: (Math.random() * 3) | 0, st: 0, t: MU.rand(0.2, 1.0), sp: MU.rand(56, 118), ph: Math.random() * 7 }); }
      ctx.save();
      for (let i = cr.length - 1; i >= 0; i--) { const p = cr[i]; p.t -= dt; p.ph += dt;
        if (p.t <= 0) { if (p.st === 0) { p.st = 1; p.t = MU.rand(0.25, 0.7); p.a += MU.rand(-1.4, 1.4); p.vx = Math.cos(p.a) * p.sp; p.vy = Math.sin(p.a) * p.sp; } else { p.st = 0; p.t = MU.rand(0.4, 1.6); p.vx = 0; p.vy = 0; } }
        if (p.st === 1) { const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt; if (this._isWallW(nx, p.y)) { p.vx = -p.vx; p.a = Math.PI - p.a; } else p.x = nx; if (this._isWallW(p.x, ny)) { p.vy = -p.vy; p.a = -p.a; } else p.y = ny; }
        // ricicla se troppo fuori dalla vista
        if (p.x < camX - M || p.x > camX + this.w + M || p.y < camY - M || p.y > camY + this.h + M) { let ok = false; for (let k = 0; k < 8 && !ok; k++) { const wx = camX + Math.random() * this.w, wy = camY + Math.random() * this.h; if (!this._isWallW(wx, wy)) { p.x = wx; p.y = wy; ok = true; } } if (!ok) { cr.splice(i, 1); continue; } }
        const sx = p.x - camX, sy = p.y - camY; const moving = p.st === 1; const bob = moving ? Math.sin(p.ph * 22) * 0.6 : 0;
        ctx.save(); ctx.translate(sx, sy + bob); ctx.rotate(p.a); ctx.scale(1.9, 1.9); // v1.23 animaletti piu grandi
        if (p.type === 0) { // ratto
          ctx.fillStyle = '#2a2530'; ctx.strokeStyle = '#141018'; ctx.lineWidth = 0.8;
          ctx.strokeStyle = '#3a3540'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-9, Math.sin(p.ph * 18) * 2, -12, 0); ctx.stroke(); // coda
          ctx.fillStyle = '#33303a'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, 7); ctx.fill(); // corpo
          ctx.beginPath(); ctx.arc(5, 0, 2.2, 0, 7); ctx.fill(); // testa
          ctx.fillStyle = '#22202a'; ctx.beginPath(); ctx.arc(4.5, -1.6, 1, 0, 7); ctx.arc(4.5, 1.6, 1, 0, 7); ctx.fill(); // orecchie
          ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(6, -0.7, 0.5, 0, 7); ctx.fill(); // occhio
        } else if (p.type === 1) { // ragno
          ctx.strokeStyle = '#15121a'; ctx.lineWidth = 1; const lg = Math.sin(p.ph * 26) * 1.2;
          for (const s of [-1, 1]) for (let l = 0; l < 4; l++) { const ang = (l - 1.5) * 0.5; const bx = Math.cos(ang) * 5, by = s * (2 + Math.abs(Math.sin(ang)) * 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bx, by); ctx.lineTo(bx + Math.cos(ang) * 3, by + s * (2 + lg)); ctx.stroke(); }
          ctx.fillStyle = '#1a1620'; ctx.beginPath(); ctx.arc(-1, 0, 2.4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(2.4, 0, 1.6, 0, 7); ctx.fill();
          ctx.fillStyle = '#c02a2a'; ctx.beginPath(); ctx.arc(3, -0.6, 0.5, 0, 7); ctx.arc(3, 0.6, 0.5, 0, 7); ctx.fill();
        } else { // scarafaggio
          ctx.strokeStyle = '#12100a'; ctx.lineWidth = 1; for (const s of [-1, 1]) for (let l = 0; l < 3; l++) { ctx.beginPath(); ctx.moveTo(-1 + l * 2, s * 2); ctx.lineTo(-2 + l * 2, s * (3.6 + Math.sin(p.ph * 24 + l) * 0.8)); ctx.stroke(); }
          const bg = ctx.createLinearGradient(0, -3, 0, 3); bg.addColorStop(0, '#3b2f16'); bg.addColorStop(1, '#17120a'); ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, 0, 4.4, 3, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = '#0a0806'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-3.5, 0); ctx.lineTo(3.5, 0); ctx.stroke();
          ctx.strokeStyle = '#2a2210'; ctx.beginPath(); ctx.moveTo(4, -1); ctx.lineTo(6.5, -2); ctx.moveTo(4, 1); ctx.lineTo(6.5, 2); ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    },
    _drawParticles(ctx, over) { for (const p of this.particles) { if (!!p.over !== over) continue; if (p.fire) { const life = 1 - (p.t / p.life); let col; if (life < 0.35) col = 'rgba(255,240,160,'; else if (life < 0.7) col = 'rgba(255,140,40,'; else col = 'rgba(90,80,80,'; ctx.fillStyle = col + (0.85 * (1 - life)) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.r * (1.1 - life * 0.6)), 0, 7); ctx.fill(); } else { const a = p.t / p.life; ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.4 + a * 0.6), 0, 7); ctx.fill(); } } ctx.globalAlpha = 1; },
    _drawSwings(ctx) {
      if (!this.swings.length) return;
      for (const sw of this.swings) {
        const u = sw.t / sw.dur, a = 1 - u;
        // il settore si "apre" nel primo terzo dell'animazione: e' quello che da' il senso del movimento
        const grow = Math.min(1, u / 0.34), half = sw.half * (0.35 + 0.65 * grow), rad = sw.rad * (0.72 + 0.28 * grow);
        const R = Math.round(sw.rad);
        const g = this._grad('sw|' + R + '|' + (sw.crit ? 1 : 0), () => {
          const q = ctx.createRadialGradient(0, 0, R * 0.25, 0, 0, R);
          q.addColorStop(0, 'rgba(255,255,255,0)');
          q.addColorStop(0.62, sw.crit ? 'rgba(255,243,107,.30)' : 'rgba(224,165,44,.26)');
          q.addColorStop(1, sw.crit ? 'rgba(255,243,107,.62)' : 'rgba(255,226,160,.55)');
          return q;
        });
        ctx.save(); ctx.translate(sw.x, sw.y); ctx.rotate(sw.a); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rad, -half, half); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = sw.crit ? 'rgba(255,255,255,.95)' : 'rgba(255,236,190,.9)'; ctx.lineWidth = 3 * a + 1;
        ctx.beginPath(); ctx.arc(0, 0, rad, -half, half); ctx.stroke();
        ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    },
    _drawFlashes(ctx) { for (const f of this.flashes) { const a = f.t / f.life; ctx.globalAlpha = a; ctx.strokeStyle = f.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, MU.lerp(f.r0, f.r1, 1 - a), 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; },
    _drawFloaters(ctx) { ctx.textAlign = 'center'; for (const f of this.floaters) { const a = Math.min(1, f.t / f.life * 1.5); ctx.globalAlpha = a; ctx.fillStyle = f.color; ctx.font = (f.big ? 'bold 22px ' : 'bold 15px ') + 'Segoe UI, sans-serif'; ctx.fillText(f.text, f.x, f.y); } ctx.globalAlpha = 1; ctx.textAlign = 'left'; },
    updateFx(dt) { for (const p of this.particles) { p.t += (p.fire ? dt : 0); if (!p.fire) p.t -= dt * 2; p.x += p.vx * dt; p.y += p.vy * dt; if (p.fire) { p.vy += 8 * dt; p.vx *= 0.96; } else { p.vx *= 0.92; p.vy *= 0.92; } } this.particles = this.particles.filter(p => p.fire ? p.t < p.life : p.t > 0); for (const f of this.flashes) f.t -= dt; this.flashes = this.flashes.filter(f => f.t > 0); for (const f of this.floaters) { f.t -= dt; f.y -= 26 * dt; } this.floaters = this.floaters.filter(f => f.t > 0); for (const c of this.chains) c.t -= dt; this.chains = this.chains.filter(c => c.t > 0); for (const sw of this.swings) sw.t += dt; this.swings = this.swings.filter(sw => sw.t < sw.dur); for (const L of this.levelUps) L.t += dt; this.levelUps = this.levelUps.filter(L => L.t < L.dur); for (const k in this.atk) { this.atk[k] -= dt; if (this.atk[k] <= 0) delete this.atk[k]; } for (const k in this.mAtk) { const a = this.mAtk[k]; a.t += dt; if (a.t >= a.dur) delete this.mAtk[k]; } for (const d of this.deaths) d.t += dt; this.deaths = this.deaths.filter(d => d.t < d.dur); },
    _drawOrb(ctx, o) {
      if (o.k === 'turret') { const x = o.x, y = o.y; ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 8, 13, 5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#2a3550'; ctx.strokeStyle = '#0a0c12'; ctx.lineWidth = 2; this._rr(ctx, -10, -2, 20, 12, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#3a4a6a'; this._rr(ctx, -7, -5, 14, 6, 2); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.rotate(o.f || 0); ctx.fillStyle = '#4a5a80'; ctx.strokeStyle = '#0a0c12'; ctx.beginPath(); ctx.arc(0, -4, 6, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a2233'; this._rr(ctx, 0, -6, 16, 4, 1.5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.arc(0, -4, 2.2, 0, 7); ctx.fill(); ctx.restore();
        if (o.tt) { const a = Math.min(1, o.tt / 8); ctx.strokeStyle = 'rgba(159,224,255,' + (0.35 + 0.3 * a) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -2, 15, -Math.PI / 2, -Math.PI / 2 + a * Math.PI * 2); ctx.stroke(); }
        ctx.restore(); return; }
      if (o.k === 'rift') { ctx.save(); ctx.translate(o.x, o.y); const rot = this.time * 3; for (let i = 0; i < 3; i++) { ctx.rotate(rot + i * 2.1); ctx.strokeStyle = 'rgba(0,240,200,' + (0.3 + 0.2 * Math.sin(this.time * 6)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, o.r * (0.5 + i * 0.22), 0.5, 5); ctx.stroke(); } ctx.fillStyle = 'rgba(0,240,200,0.10)'; ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 7); ctx.fill(); ctx.restore(); } },
    _drawBullet(ctx, b) { b = Object.assign({}, b, { r: b.r * 1.35 }); if (b.bb) return this._drawBubble(ctx, b); if (b.ar) return this._drawArrow(ctx, b); if (b.g) { ctx.fillStyle = '#c7f06a'; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, 7); ctx.fill(); ctx.strokeStyle = '#7a9a2b'; ctx.stroke(); return; }
      // v1.19 — proiettile luminoso: scia + alone saturo + nucleo bianco
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = b.c; ctx.globalAlpha = 0.55; ctx.lineWidth = b.r * 1.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - (b.vx || 0) * 0.016, b.y - (b.vy || 0) * 0.016); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.globalAlpha = 0.85; ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.15, 0, 7); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.62, 0, 7); ctx.fill();
      ctx.restore();
      if (b.h) { ctx.strokeStyle = '#ff3b5b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 1.6, 0, 7); ctx.stroke(); } },
    _shadow(ctx, x, y, r) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.75, r * 0.9, r * 0.45, 0, 0, 7); ctx.fill(); },
    // v1.66 — BOLLA D'ENERGIA del mago: sfera translucida con bordo netto e riflesso, non un pallino pieno.
    // La membrana pulsa: e' quello che la distingue a colpo d'occhio dai proiettili dei nemici.
    _drawBubble(ctx, b) {
      const R = b.r * 1.25, pulse = 1 + Math.sin(this.time * 12 + b.e * 0.7) * 0.07;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = this._grad('bub|' + Math.round(R * 10), () => { const q = ctx.createRadialGradient(0, 0, R * 0.15, 0, 0, R * 1.5); q.addColorStop(0, 'rgba(255,255,255,.55)'); q.addColorStop(0.45, 'rgba(0,240,200,.35)'); q.addColorStop(1, 'rgba(0,240,200,0)'); return q; });
      ctx.translate(b.x, b.y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.5, 0, 7); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.translate(b.x, b.y);
      ctx.globalAlpha = 0.35; ctx.fillStyle = b.c || '#00f0c8'; ctx.beginPath(); ctx.arc(0, 0, R * pulse, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.95; ctx.strokeStyle = b.c || '#00f0c8'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, 0, R * pulse, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(-R * 0.32, -R * 0.34, R * 0.26, 0, 7); ctx.fill();
      ctx.globalAlpha = 1; ctx.restore();
    },
    // v1.66 — FRECCIA del ladro: asta, punta e impennaggio orientati sulla traiettoria.
    _drawArrow(ctx, b) {
      const L = Math.max(13, b.r * 3.4), a = b.a != null ? b.a / 100 : 0;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
      ctx.strokeStyle = '#d9c9a3'; ctx.lineWidth = 2; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L * 0.55, 0); ctx.stroke();
      ctx.fillStyle = b.c || '#9ef0b0';
      ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(L * 0.42, -b.r * 0.85); ctx.lineTo(L * 0.42, b.r * 0.85); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = this._rgba(b.c || '#9ef0b0', 0.85); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-L, -b.r * 0.7); ctx.lineTo(-L * 0.55, 0); ctx.lineTo(-L, b.r * 0.7); ctx.stroke();
      ctx.restore();
    },
    _drawPlayer(ctx, p, isMe) {
      const h = HERO[p.h] || HERO.guerriero; const r = C.PLAYER_RADIUS * (C.VIS_SCALE || 1); const x = p.x, y = p.y; this._shadow(ctx, x, y, r);
      if (p.d) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#555'; ctx.fillRect(x - 8, y - 12, 16, 20); ctx.globalAlpha = 1; return; }
      ctx.save(); ctx.translate(x, y);
      if (p.iv) { ctx.strokeStyle = 'rgba(255,235,120,' + (0.5 + 0.4 * Math.sin(this.time * 10)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r + 9, 0, 7); ctx.stroke(); }
      if (p.bar) { ctx.save(); ctx.rotate(p.a); ctx.strokeStyle = 'rgba(120,200,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r + 12, -0.9, 0.9); ctx.stroke(); ctx.restore(); }
      if (p.tb && p.tb.length) { ctx.strokeStyle = 'rgba(255,210,90,' + (0.4 + 0.3 * Math.sin(this.time * 8)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r + 7, 0, 7); ctx.stroke(); }
      if (p.cu) { // v1.28 — aura viola di maledizione + volute
        ctx.strokeStyle = 'rgba(156,107,255,' + (0.45 + 0.35 * Math.sin(this.time * 6)) + ')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, 7); ctx.stroke();
        if (Math.random() < 0.3) this.particles.push({ x: x + MU.rand(-r, r), y: y - r, vx: MU.rand(-8, 8), vy: -MU.rand(14, 30), life: 0.6, t: 0.6, color: '#b98bff', r: 2, over: true });
      }
      if (p.gz) { // v1.34 — debuff dello Sguardo dell'Occhio (colore per tipo)
        const gc = p.gz === 'slow' ? '#5ad0ff' : p.gz === 'sunder' ? '#c48cff' : '#ff7a5a';
        ctx.strokeStyle = this._rgba(gc, 0.4 + 0.35 * Math.sin(this.time * 7)); ctx.lineWidth = 2.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      }
      if (p.ph) ctx.globalAlpha = 0.55; ctx.save(); ctx.rotate(p.a); this._hero(ctx, p.h, r, this.time, !!p.dash, Math.max(0, (this.atk[p.i] || 0)) / 0.20, p); ctx.restore(); ctx.restore(); ctx.globalAlpha = 1;
      if (p.dash) this.particles.push({ x, y, vx: 0, vy: 0, life: 0.25, t: 0.25, color: h.accent, r: 5, over: false });
      const bw = r * 2.6; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - bw / 2, y - r - 22, bw, 5); const hf = Math.max(0, p.hp / p.mhp); ctx.fillStyle = hf > 0.4 ? '#4bd66b' : '#ff4b6b'; ctx.fillRect(x - bw / 2, y - r - 22, bw * hf, 5);
      for (let i = 0; i < (p.lv || 0); i++) { ctx.fillStyle = '#ff5a7a'; ctx.beginPath(); ctx.arc(x - bw / 2 + 4 + i * 9, y - r - 28, 2.6, 0, 7); ctx.fill(); }
      // v1.73 — SOPRA LA TUA TESTA NON C'E' PIU' NULLA. Nome, livello, rango e barra dell'XP sono passati
      // nel box dell'HUD (#heroBox): erano scritte fisse in mezzo all'azione, proprio dove serve vedere.
      // Sopra i COMPAGNI restano: senza, in co-op tre sagome uguali diventano indistinguibili e non si
      // capisce piu' a che punto sono della loro progressione.
      const LV = window.GAME && window.GAME.Levels;
      if (!isMe || p.dn) {
        ctx.textAlign = 'center';
        ctx.fillStyle = isMe ? '#fff' : '#c9d2e6'; ctx.font = 'bold 12px Segoe UI';
        ctx.fillText(p.n + (p.dn ? ' (a terra ' + p.dt + 's)' : ''), x, y - r - 32);
        if (LV && p.lvl && !isMe) {
          const rk = LV.rankName(p.h, p.lvl, p.sp || null), spec = LV.rankForLevel(p.lvl) >= 5;
          ctx.font = '11px Segoe UI'; ctx.fillStyle = spec ? '#ffd27a' : '#8d97ab';
          ctx.fillText('Lv.' + p.lvl + ' · ' + rk, x, y - r - 44);
          if ((p.prg || 0) < 1) { const bw2 = r * 2.6; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - bw2 / 2, y - r - 15, bw2, 2.5); ctx.fillStyle = '#8bd6ff'; ctx.fillRect(x - bw2 / 2, y - r - 15, bw2 * (p.prg || 0), 2.5); }
        }
        ctx.textAlign = 'left';
      }
      if (p.dn) { ctx.strokeStyle = '#ffcf3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 8 + Math.sin(this.time * 6) * 3, 0, 7); ctx.stroke(); }
      if (p.bf) { ctx.fillStyle = 'rgba(255,60,80,.35)'; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, 7); ctx.fill(); }
    },
    _boot(ctx, x, y, r) { this._rr(ctx, x - r * 0.17, y - r * 0.17, r * 0.34, r * 0.34, 3); ctx.fill(); ctx.stroke(); },
    // ===== v1.66 — I TRE EROI, VISTI DALL'ALTO =====================================================
    // Il giocatore e' l'unica cosa del gioco disegnata dall'alto (i nemici sono cartelloni frontali), e
    // il contesto arriva qui gia' ruotato sulla mira: avanti e' +x, i fianchi sono ±y. Le tre classi
    // riusano la stessa impalcatura del vecchio _hero (stivali, braccia come tratti, torso arrotondato,
    // testa a r*0.5) perche' e' quella che si legge alla scala di gioco: cambiano stoffa, sagoma e arma.
    // Le sfumature passano dalla cache _grad: r e' costante, quindi si costruiscono una volta sola e
    // non ogni fotogramma (v1.64 — mai creare gradienti dentro un ciclo per entita').
    // v1.67 — `eq` porta l'equipaggiamento visibile (`wp` arma, `sh` scudo). Si disegna cio' che cambia
    // la SAGOMA — scudo a torre, arco lungo, orbe della bacchetta — perche' e' l'unica differenza che si
    // legge dall'alto a questa scala; il resto (armature, vesti, calzature) si legge nelle statistiche.
    _hero(ctx, id, r, t, dashing, atk, eq) {
      const a = Math.max(0, Math.min(1, atk || 0));
      eq = eq || {};
      // v1.69 — il rango V si vede addosso: e' l'unico che cambia una scelta, quindi e' l'unico che
      // merita di essere riconoscibile a colpo d'occhio anche dai compagni.
      if (eq.sp) this._specSotto(ctx, r, t, eq.sp);
      if (id === 'mago') this._heroMago(ctx, r, t, a, eq);
      else if (id === 'ladro') this._heroLadro(ctx, r, t, a, eq);
      else this._heroGuerriero(ctx, r, t, a, eq);
      if (eq.sp) this._specSopra(ctx, r, t, eq.sp);
      if (dashing) { const h = HERO[id] || HERO.guerriero; ctx.strokeStyle = h.accent || '#9fe0ff'; ctx.globalAlpha = 0.5; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * 1.1, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
    },
    // v1.69 — i due strati della specializzazione: cio' che sta SOTTO il personaggio (aure, mantelli
    // che strisciano a terra) e cio' che sta SOPRA (elmi, bagliori). Disegnarli come strati separati
    // evita di dover riscrivere i tre eroi per sei varianti.
    _specSotto(ctx, r, t, sp) {
      if (sp === 'paladino') {                      // l'aura e' un'informazione di gioco: e' il raggio vero
        const R = 220 * ((C.VIS_SCALE || 1.45) / 1.45), pu = 0.5 + 0.5 * Math.sin(t * 2);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        // alone tenue SOLO attorno ai piedi: l'informazione utile e' il bordo, non la superficie
        ctx.globalAlpha = 0.16 + 0.06 * pu;
        const g = this._grad('sp_pal|' + Math.round(R), () => { const q = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.42); q.addColorStop(0, 'rgba(255,233,168,.5)'); q.addColorStop(1, 'rgba(255,233,168,0)'); return q; });
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 0.42, 0, 7); ctx.fill();
        // il cerchio del raggio: tratteggiato e sottile, si legge senza coprire il campo di battaglia
        ctx.globalAlpha = 0.30 + 0.18 * pu; ctx.strokeStyle = 'rgba(255,233,168,.85)'; ctx.lineWidth = 1.6;
        ctx.setLineDash([10, 9]); ctx.lineDashOffset = -t * 14;
        ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
      } else if (sp === 'stregone') {               // ombra che si allarga sotto i piedi
        ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#1a0a14';
        ctx.beginPath(); ctx.ellipse(-r * 0.2, 0, r * 1.5, r * 1.1, 0, 0, 7); ctx.fill(); ctx.restore();
      }
    },
    _specSopra(ctx, r, t, sp) {
      ctx.save();
      if (sp === 'paladino') {                      // aureola dorata sopra l'elmo
        ctx.strokeStyle = 'rgba(255,220,120,.9)'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.ellipse(r * 0.05, 0, r * 0.62, r * 0.30, 0, 0, 7); ctx.stroke();
      } else if (sp === 'maestro') {                // cresta rossa e lama di luce sull arco
        ctx.fillStyle = '#c0332b'; ctx.strokeStyle = '#0a0c12'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.06); ctx.lineTo(-r * 0.95, -r * 0.02); ctx.lineTo(-r * 0.95, r * 0.02); ctx.lineTo(-r * 0.1, r * 0.06); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,210,122,.55)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, r * 1.25, -0.95, 0.95); ctx.stroke();
      } else if (sp === 'arcimago') {               // rune dorate in orbita larga
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) { const a = t * 0.9 + i * 1.257; ctx.fillStyle = 'rgba(255,214,120,.75)';
          ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.35, r * 0.09, 0, 7); ctx.fill(); }
      } else if (sp === 'stregone') {               // nucleo rosso al posto dell orbe
        ctx.globalCompositeOperation = 'lighter';
        const g = this._grad('sp_str|' + r, () => { const q = ctx.createRadialGradient(r * 1.62, 0, 1, r * 1.62, 0, r * 0.62); q.addColorStop(0, 'rgba(255,255,255,.9)'); q.addColorStop(0.3, 'rgba(255,90,122,.85)'); q.addColorStop(1, 'rgba(255,45,107,0)'); return q; });
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(r * 1.62, 0, r * 0.62, 0, 7); ctx.fill();
      } else if (sp === 'assassino') {              // scia scura e lama alla cintura
        ctx.globalAlpha = 0.55; ctx.fillStyle = '#120a1e';
        ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.5); ctx.quadraticCurveTo(-r * 1.7, 0, -r * 0.2, r * 0.5); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1; ctx.lineCap = 'round';
        ctx.strokeStyle = '#0a0c12'; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.moveTo(-r * 0.02, r * 0.6); ctx.lineTo(r * 0.36, r * 0.72); ctx.stroke();
        ctx.strokeStyle = '#d8d2c8'; ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.moveTo(-r * 0.02, r * 0.6); ctx.lineTo(r * 0.36, r * 0.72); ctx.stroke();
        ctx.lineCap = 'butt';
      } else if (sp === 'cacciatore') {             // seconda faretra e punte accese
        ctx.strokeStyle = '#9ef0b0'; ctx.lineWidth = 1.8;
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-r * 0.75, r * (0.1 + k * 0.22)); ctx.lineTo(-r * 1.15, r * (0.02 + k * 0.3)); ctx.stroke(); }
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(158,240,176,.5)';
        ctx.beginPath(); ctx.arc(-r * 1.18, 0, r * 0.16, 0, 7); ctx.fill();
      }
      ctx.restore();
    },
    // ---- MAGO: il mantello e' la sagoma. La massa della stoffa la fa il VALORE, non il contorno: il
    // primo tentativo aveva panno quasi nero e filo ciano tutt'intorno e da sopra leggeva come un anello.
    _heroMago(ctx, r, t, atk, eq) {
      const _P = (eq && eq.pal) || {};
      const DK = '#0a0c12', body = _P.body || '#16181f', bodyDk = _P.bodyDk || '#05060a', accent = _P.accent || '#00f0c8', skin = _P.skin || '#d8d2c8';
      const sway = Math.sin(t * 5) * 0.12, sw2 = Math.sin(t * 5 + 0.8) * 0.10;
      ctx.lineJoin = 'round';
      const mg = this._grad('h_mag|' + r + '|' + (_P.body || ''), () => { const q = ctx.createLinearGradient(-r * 1.6, -r * 0.6, r * 0.4, r * 0.6); q.addColorStop(0, _P.body || '#20252f'); q.addColorStop(0.55, _P.bodyDk || '#161a22'); q.addColorStop(1, '#0d1016'); return q; });
      ctx.fillStyle = mg; ctx.strokeStyle = DK; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r * 0.30, -r * 0.34);
      ctx.quadraticCurveTo(r * 0.02, -r * 1.02, -r * 0.72, -r * 1.16);
      ctx.quadraticCurveTo(-r * 1.62, -r * 1.08, -r * 1.78, -r * (0.30 + sway));
      ctx.quadraticCurveTo(-r * 1.86, 0, -r * 1.78, r * (0.30 + sw2));
      ctx.quadraticCurveTo(-r * 1.62, r * 1.08, -r * 0.72, r * 1.16);
      ctx.quadraticCurveTo(r * 0.02, r * 1.02, r * 0.30, r * 0.34);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = _P.orlo || 'rgba(0,240,200,.75)'; ctx.lineWidth = 2.2;   // l'accento resta SOLO sull'orlo
      ctx.beginPath(); ctx.moveTo(-r * 0.72, -r * 1.16);
      ctx.quadraticCurveTo(-r * 1.62, -r * 1.08, -r * 1.78, -r * (0.30 + sway));
      ctx.quadraticCurveTo(-r * 1.86, 0, -r * 1.78, r * (0.30 + sw2));
      ctx.quadraticCurveTo(-r * 1.62, r * 1.08, -r * 0.72, r * 1.16); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2;         // due pieghe verso l'orlo
      ctx.beginPath(); ctx.moveTo(-r * 0.30, -r * 0.70); ctx.quadraticCurveTo(-r * 1.00, -r * 0.80, -r * 1.42, -r * 0.46); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.30, r * 0.70); ctx.quadraticCurveTo(-r * 1.00, r * 0.80, -r * 1.42, r * 0.46); ctx.stroke();
      ctx.fillStyle = '#0a0b10'; ctx.strokeStyle = DK; ctx.lineWidth = 2; this._boot(ctx, -r * 0.5, -r * 0.34, r); this._boot(ctx, -r * 0.5, r * 0.34, r);
      ctx.strokeStyle = body; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.34;
      ctx.beginPath(); ctx.moveTo(0, -r * 0.45); ctx.lineTo(r * 0.7, -r * 0.14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, r * 0.45); ctx.lineTo(r * 0.7, r * 0.14); ctx.stroke();
      ctx.lineCap = 'butt'; ctx.lineWidth = 2; ctx.strokeStyle = DK;
      const gr = this._grad('h_torso|mag|' + r + '|' + (_P.body || ''), () => { const q = ctx.createLinearGradient(-r * 0.6, 0, r * 0.4, 0); q.addColorStop(0, bodyDk); q.addColorStop(1, body); return q; });
      ctx.fillStyle = gr; this._rr(ctx, -r * 0.65, -r * 0.55, r * 1.15, r * 1.1, r * 0.4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = accent; ctx.globalAlpha = 0.75; ctx.fillRect(-r * 0.5, -r * 0.06, r * 0.9, r * 0.12); ctx.globalAlpha = 1;
      ctx.fillStyle = '#0a0b10'; ctx.strokeStyle = accent; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-r * 0.30, 0, r * 0.16, 0, 7); ctx.fill(); ctx.stroke();
      const _civM = !!(eq && eq.civile);   // v1.75 — il civile non impugna nulla
      if (!_civM) {
      ctx.fillStyle = '#2a1d10'; ctx.strokeStyle = DK; ctx.lineWidth = 1.5;   // bastone
      this._rr(ctx, r * 0.45, -r * 0.06, r * 1.05, r * 0.12, 2); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';                   // orbe: divampa quando lancia
      const orb = { mag_scettro: ['163,140,255', 0.62], mag_bastone: ['127,251,228', 0.76] }[eq && eq.wp] || ['0,240,200', 0.50];
      const og = this._grad('h_orb|' + r + '|' + orb[0], () => { const q = ctx.createRadialGradient(r * 1.62, 0, 1, r * 1.62, 0, r * orb[1]); q.addColorStop(0, 'rgba(255,255,255,.95)'); q.addColorStop(0.28, 'rgba(' + orb[0] + ',.85)'); q.addColorStop(1, 'rgba(' + orb[0] + ',0)'); return q; });
      ctx.globalAlpha = 0.75 + 0.25 * atk; ctx.fillStyle = og; ctx.beginPath(); ctx.arc(r * 1.62, 0, r * (orb[1] + 0.34 * atk), 0, 7); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = skin; ctx.strokeStyle = DK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r * 0.05, 0, r * 0.5, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0c0d12'; ctx.strokeStyle = DK; ctx.lineWidth = 2;     // cappuccio a punta
      ctx.beginPath(); ctx.moveTo(r * 0.16, -r * 0.46); ctx.quadraticCurveTo(-r * 0.55, -r * 0.52, -r * 1.06, -r * 0.10);
      ctx.quadraticCurveTo(-r * 1.12, 0, -r * 1.06, r * 0.10);
      ctx.quadraticCurveTo(-r * 0.55, r * 0.52, r * 0.16, r * 0.46); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = accent; ctx.globalAlpha = 0.5; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r * 0.02, 0, r * 0.42, -2.0, 2.0); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#05060a'; ctx.fillRect(r * 0.22, -r * 0.30, r * 0.16, r * 0.60);
      ctx.fillStyle = accent; ctx.globalAlpha = 0.55; ctx.fillRect(r * 0.30, -r * 0.24, r * 0.04, r * 0.48); ctx.globalAlpha = 1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';                   // rune orbitanti
      for (let i = 0; i < 3; i++) { const ang = t * (1.1 + i * 0.35) + i * 2.1; ctx.fillStyle = 'rgba(0,240,200,.5)'; ctx.beginPath(); ctx.arc(Math.cos(ang) * r * 1.05, Math.sin(ang) * r * 0.95, r * 0.07, 0, 7); ctx.fill(); }
      ctx.restore();
    },
    // ---- GUERRIERO: armatura abbozzata (pochi solchi, non dettagli) e scudo ad arco ")" davanti.
    // Gli spallacci sono volutamente PIU SCURI del pettorale: con lo stesso acciaio la figura diventava
    // un grumo di grigi. L'elmo, al contrario, e' PIU CHIARO, altrimenti la testa spariva nel torace.
    _heroGuerriero(ctx, r, t, atk, eq) {
      const _P = (eq && eq.pal) || {};
      const DK = '#0a0c12', clothDk = _P.clothDk || '#243516', cloth = _P.cloth || '#3f5a2c', steelDk = _P.steelDk || '#3a424e';
      const sway = Math.sin(t * 5) * 0.12;
      ctx.lineJoin = 'round';
      ctx.fillStyle = steelDk; ctx.strokeStyle = DK; ctx.lineWidth = 2; this._boot(ctx, -r * 0.5, -r * 0.34, r); this._boot(ctx, -r * 0.5, r * 0.34, r);
      const armPlate = (y0, y1, x1) => {                                       // bracciali segmentati
        ctx.strokeStyle = '#2c333d'; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.32;
        ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.6;
        for (let k = 1; k <= 2; k++) { const u = k / 3; ctx.beginPath(); ctx.moveTo(x1 * u - r * 0.05, y0 + (y1 - y0) * u - r * 0.16); ctx.lineTo(x1 * u + r * 0.05, y0 + (y1 - y0) * u + r * 0.16); ctx.stroke(); }
      };
      armPlate(-r * 0.45, -r * 0.30, r * 0.62); armPlate(r * 0.45, r * 0.16, r * 0.70);
      ctx.strokeStyle = DK; ctx.lineWidth = 2;
      const gr = this._grad('h_torso|gue|' + r, () => { const q = ctx.createLinearGradient(-r * 0.6, 0, r * 0.4, 0); q.addColorStop(0, clothDk); q.addColorStop(1, cloth); return q; });
      ctx.fillStyle = gr; this._rr(ctx, -r * 0.65, -r * 0.55, r * 1.15, r * 1.1, r * 0.4); ctx.fill(); ctx.stroke();
      const pg = this._grad('h_plate|' + r, () => { const q = ctx.createLinearGradient(-r * 0.5, -r * 0.4, r * 0.3, r * 0.4); q.addColorStop(0, '#3a424e'); q.addColorStop(0.5, '#7f8895'); q.addColorStop(1, '#c2c9d4'); return q; });
      ctx.fillStyle = pg; this._rr(ctx, -r * 0.36, -r * 0.34, r * 0.74, r * 0.68, r * 0.26); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.42)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-r * 0.30, -r * 0.30); ctx.lineTo(r * 0.24, -r * 0.24); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.32, 0); ctx.lineTo(r * 0.28, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.30, r * 0.30); ctx.lineTo(r * 0.24, r * 0.24); ctx.stroke();
      const sp = this._grad('h_spall|' + r, () => { const q = ctx.createLinearGradient(-r * 0.3, 0, r * 0.3, 0); q.addColorStop(0, '#20262e'); q.addColorStop(1, '#525b68'); return q; });
      for (const sgy of [-1, 1]) { ctx.fillStyle = sp; ctx.strokeStyle = DK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(-r * 0.14, sgy * r * 0.60, r * 0.30, r * 0.21, sgy * 0.3, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.strokeStyle = DK; ctx.lineWidth = 2;
      // v1.75 — CIVILE: la stessa sagoma senza scudo e senza elmo. La usano i mercanti, che condividono
      // il linguaggio degli eroi (spalle, corazza, mantello) ma non vanno in battaglia.
      const _civ = !!(eq && eq.civile);
      if (!_civ) {
      ctx.save(); ctx.translate(r * (0.30 + 0.22 * atk), -r * 0.14 + sway * 3);  // scudo: si protende nel colpo
      // scudo a torre: copre di piu' (arco piu' ampio) ed e' piu' spesso. E' l'unico pezzo d'armatura che
      // cambia la sagoma vista dall'alto, quindi vale la pena disegnarlo diverso.
      const torre = eq && eq.sh === 'gue_torre';
      const RS = r * (torre ? 0.94 : 0.86), TH = r * (torre ? 0.38 : 0.26), A0 = torre ? -1.45 : -1.15, A1 = -A0;
      const sgd = this._grad('h_scudo|' + r + '|' + (torre ? 't' : 'n'), () => { const q = ctx.createLinearGradient(RS - TH, 0, RS + TH * 0.6, 0); q.addColorStop(0, '#3f4650'); q.addColorStop(0.55, '#8d97a5'); q.addColorStop(1, '#c9d1dc'); return q; });
      ctx.fillStyle = sgd; ctx.strokeStyle = DK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, RS + TH / 2, A0, A1); ctx.arc(0, 0, RS - TH / 2, A1, A0, true); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#c8a23a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, RS + TH / 2 - 2, A0 + 0.05, A1 - 0.05); ctx.stroke();
      ctx.fillStyle = '#c8a23a'; ctx.strokeStyle = DK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(RS, 0, r * 0.11, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e6ecf4';
      const riv = torre ? 1.05 : 0.72;
      ctx.beginPath(); ctx.arc(Math.cos(-riv) * RS, Math.sin(-riv) * RS, r * 0.05, 0, 7); ctx.arc(Math.cos(riv) * RS, Math.sin(riv) * RS, r * 0.05, 0, 7); ctx.fill();
      if (torre) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, RS, A0 + 0.12, A1 - 0.12); ctx.stroke(); }
      ctx.restore();
      }
      if (_civ) {   // testa scoperta: capelli e la fetta di viso davanti, al posto dell'elmo
        ctx.fillStyle = _P.pelo || '#4a3520'; ctx.strokeStyle = DK; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(r * 0.05, 0, r * 0.44, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = _P.skin || '#c79b6a';
        ctx.beginPath(); ctx.arc(r * 0.12, 0, r * 0.3, -1.25, 1.25); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(r * 0.26, -r * 0.1, r * 0.045, 0, 7); ctx.arc(r * 0.26, r * 0.1, r * 0.045, 0, 7); ctx.fill();
        return;
      }
      const hg = this._grad('h_elmo|' + r, () => { const q = ctx.createLinearGradient(-r * 0.5, -r * 0.4, r * 0.4, r * 0.4); q.addColorStop(0, '#6e7784'); q.addColorStop(0.5, '#aeb6c2'); q.addColorStop(1, '#e2e7ee'); return q; });
      ctx.fillStyle = hg; ctx.strokeStyle = DK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(r * 0.05, 0, r * 0.46, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0b0e13'; this._rr(ctx, r * 0.16, -r * 0.22, r * 0.30, r * 0.44, 3); ctx.fill();   // feritoia
      ctx.fillStyle = '#0b0e13'; this._rr(ctx, -r * 0.02, -r * 0.06, r * 0.34, r * 0.12, 2); ctx.fill();
      ctx.fillStyle = steelDk; ctx.strokeStyle = DK; ctx.lineWidth = 2;                                   // cresta corta
      ctx.beginPath(); ctx.moveTo(-r * 0.16, -r * 0.10); ctx.quadraticCurveTo(-r * 0.62, -r * 0.06 + sway * r * 0.4, -r * 0.78, 0);
      ctx.quadraticCurveTo(-r * 0.62, r * 0.06 + sway * r * 0.4, -r * 0.16, r * 0.10); ctx.closePath(); ctx.fill(); ctx.stroke();
    },
    // ---- LADRO: cappuccio, mantellina corta, faretra, e l'arco disegnato di LATO — la curva ")" corre
    // lungo il fianco, non davanti: di fronte sarebbe uno scudo, non un arco.
    _heroLadro(ctx, r, t, atk, eq) {
      const _P = (eq && eq.pal) || {};
      const DK = '#0a0c12', cloth = _P.cloth || '#3c5140', clothDk = _P.clothDk || '#1d2a22', skin = _P.skin || '#c99a6a', wood = _P.wood || '#8a6534';
      const sway = Math.sin(t * 5) * 0.12, draw = atk;
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#25342b'; ctx.strokeStyle = DK; ctx.lineWidth = 2;      // mantellina dietro
      ctx.beginPath(); ctx.moveTo(-r * 0.10, -r * 0.58); ctx.quadraticCurveTo(-r * 1.20, -r * (0.62 + sway), -r * 1.10, 0);
      ctx.quadraticCurveTo(-r * 1.20, r * (0.62 - sway), -r * 0.10, r * 0.58); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = clothDk; ctx.strokeStyle = DK; ctx.lineWidth = 2; this._boot(ctx, -r * 0.5, -r * 0.34, r); this._boot(ctx, -r * 0.5, r * 0.34, r);
      ctx.strokeStyle = skin; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.38;
      if (eq && eq.civile) {                                    // v1.75 — senza arco le braccia stanno gia' giu'
        ctx.beginPath(); ctx.moveTo(0, -r * 0.45); ctx.lineTo(r * 0.58, -r * 0.22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, r * 0.45); ctx.lineTo(r * 0.58, r * 0.22); ctx.stroke();
      } else {
      ctx.beginPath(); ctx.moveTo(0, -r * 0.45); ctx.lineTo(r * 0.22, -r * 0.92); ctx.stroke();           // regge l'arco
      ctx.beginPath(); ctx.moveTo(0, r * 0.42); ctx.lineTo(r * (0.30 - draw * 0.34), -r * (0.12 + draw * 0.30)); ctx.stroke();
      }
      ctx.lineCap = 'butt'; ctx.lineWidth = 2; ctx.strokeStyle = DK;
      const gr = this._grad('h_torso|lad|' + r, () => { const q = ctx.createLinearGradient(-r * 0.6, 0, r * 0.4, 0); q.addColorStop(0, clothDk); q.addColorStop(1, cloth); return q; });
      ctx.fillStyle = gr; this._rr(ctx, -r * 0.60, -r * 0.50, r * 1.05, r * 1.0, r * 0.38); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#5a3d1e'; ctx.lineWidth = r * 0.20; ctx.beginPath(); ctx.moveTo(-r * 0.45, r * 0.42); ctx.lineTo(r * 0.30, -r * 0.42); ctx.stroke();
      ctx.strokeStyle = DK; ctx.lineWidth = 2;
      const _civL = !!(eq && eq.civile);   // v1.75 — il civile non porta arco ne' faretra
      if (!_civL) {
      ctx.fillStyle = '#5a3d1e'; ctx.save(); ctx.translate(-r * 0.52, r * 0.40); ctx.rotate(-0.5);        // faretra
      this._rr(ctx, -r * 0.10, -r * 0.34, r * 0.20, r * 0.62, 3); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ded4ab'; ctx.lineWidth = 1.8;
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * r * 0.06, -r * 0.34); ctx.lineTo(k * r * 0.09, -r * 0.60); ctx.stroke(); }
      ctx.restore(); ctx.strokeStyle = DK; ctx.lineWidth = 2;
      // l'arco lungo esce oltre la sagoma davanti e dietro, e la curva e' piu' profonda: da sopra e' la
      // sola cosa che distingue i due archi, e si vede subito.
      const lungo = eq && eq.wp === 'lad_arcolungo', BL = lungo ? 1.34 : 1, BC = lungo ? 0.62 : 0.46;
      const bx0 = -r * 0.56 * BL, bx1 = r * 0.80 * BL, by = -r * 1.00;         // ARCO ")" di lato
      ctx.strokeStyle = lungo ? '#a67c3d' : wood; ctx.lineCap = 'round'; ctx.lineWidth = r * (lungo ? 0.15 : 0.13);
      ctx.beginPath(); ctx.moveTo(bx0, by + r * 0.10); ctx.quadraticCurveTo(r * 0.12, by - r * BC, bx1, by + r * 0.10); ctx.stroke();
      ctx.strokeStyle = '#5a4326'; ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.moveTo(bx0, by + r * 0.10); ctx.quadraticCurveTo(r * 0.12, by - r * BC, bx1, by + r * 0.10); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,240,230,.9)'; ctx.lineWidth = 1.6; ctx.lineCap = 'butt';
      const pull = by + r * (0.10 + 0.60 * draw);                              // corda tirata mentre incocca
      ctx.beginPath(); ctx.moveTo(bx0, by + r * 0.10); ctx.lineTo(r * 0.12, pull); ctx.lineTo(bx1, by + r * 0.10); ctx.stroke();
      if (lungo) { ctx.strokeStyle = 'rgba(230,220,190,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx0, by + r * 0.10); ctx.quadraticCurveTo(r * 0.12, by - r * (BC - 0.10), bx1, by + r * 0.10); ctx.stroke(); ctx.strokeStyle = 'rgba(240,240,230,.9)'; ctx.lineWidth = 1.6; }
      if (draw > 0.05) {
        ctx.strokeStyle = '#efe7cf'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(r * 0.12, pull); ctx.lineTo(r * 1.22, pull - r * 0.04); ctx.stroke();
        ctx.fillStyle = '#e2e9f2'; ctx.beginPath(); ctx.moveTo(r * 1.36, pull - r * 0.05); ctx.lineTo(r * 1.18, pull - r * 0.14); ctx.lineTo(r * 1.18, pull + r * 0.04); ctx.closePath(); ctx.fill();
      }
      }
      ctx.lineCap = 'butt';
      ctx.fillStyle = skin; ctx.strokeStyle = DK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r * 0.05, 0, r * 0.48, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#33443a'; ctx.strokeStyle = DK; ctx.lineWidth = 2;      // cappuccio a punta
      ctx.beginPath(); ctx.moveTo(r * 0.20, -r * 0.44); ctx.quadraticCurveTo(-r * 0.45, -r * 0.50, -r * 0.92, -r * 0.10);
      ctx.quadraticCurveTo(-r * 0.98, 0, -r * 0.92, r * 0.10);
      ctx.quadraticCurveTo(-r * 0.45, r * 0.50, r * 0.20, r * 0.44); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0d1512'; ctx.beginPath(); ctx.ellipse(r * 0.30, 0, r * 0.18, r * 0.24, 0, 0, 7); ctx.fill();
    },
    _drawMonster(ctx, m) {
      // v1.34 — fascio dello SGUARDO dell'Occhio Vagante (colore in base al tipo di debuff)
      if (m.t === 'occhio' && m.gz && m.gtx != null) {
        const gcol = { weaken: '#ff7a5a', slow: '#5ad0ff', sunder: '#c48cff' }[m.gk] || '#c48cff';
        const ga = Math.atan2(m.gty - m.y, m.gtx - m.x); const glen = Math.hypot(m.gtx - m.x, m.gty - m.y);
        const half = 0.55, spread = Math.tan(half) * glen;
        ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(ga); ctx.globalCompositeOperation = 'lighter';
        const gg = ctx.createLinearGradient(0, 0, glen, 0); gg.addColorStop(0, this._rgba(gcol, 0.30)); gg.addColorStop(1, this._rgba(gcol, 0.02));
        ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(glen, -spread); ctx.lineTo(glen, spread); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = this._rgba(gcol, 0.45 + 0.3 * Math.sin(this.time * 14)); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(glen, 0); ctx.stroke();
        ctx.restore();
      }
      const def = MON[m.t] || BOSSES[m.t] || MON.skeleton; const rr = def.radius * (window.GAME.Constants.VIS_SCALE || 1) * (m.el ? 1.28 : 1) * (m.tr ? 1.15 : 1); const x = m.x, y = m.y; if (!def.puppet && !def.sheet) this._shadow(ctx, x, y, rr); /* v1.48 — puppet e sprite-sheet disegnano la PROPRIA ombra ai piedi (l'ombra generica sarebbe troppo bassa → sembra fluttuare) */
      ctx.save(); ctx.translate(x, y);
      if (def.fov) { // v1.39 — CONO VISIVO del Negromante (telegrafo): fioco, si accende quando ti vede (m.al) → allora spara sfere debilitanti
        const fov = def.fov, range = (def.sightRange || def.atkRange || 320), on = m.al ? 1 : 0, col = def.eye || '#a06bff';
        ctx.save(); ctx.rotate(m.f); ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createRadialGradient(0, 0, 10, 0, 0, range); gr.addColorStop(0, this._rgba(col, 0.05 + on * 0.13)); gr.addColorStop(1, this._rgba(col, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, range, -fov, fov); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = this._rgba(col, 0.1 + on * 0.28); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(-fov) * range, Math.sin(-fov) * range); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(fov) * range, Math.sin(fov) * range); ctx.stroke();
        ctx.restore();
      }
      if (def.puppet || def.sheet) { // alone emissivo tenue (puppet e sprite-sheet): più marcato e pulsante per lo SLIME (def.aura)
        const gc = def.eye || '#8bff86'; const aur = def.aura || 1; const pulse = def.aura ? (0.8 + 0.2 * Math.sin(this.time * 3 + x * 0.05)) : 1; const R2 = rr * (1.02 + (def.aura ? 0.4 : 0));
        // v1.64 — gradiente preso dalla cache (il pulsare passa da globalAlpha): era 1 allocazione per mostro per frame
        const gr = this._grad('au|' + gc + '|' + aur + '|' + R2.toFixed(1) + '|' + rr.toFixed(1), () => { const q = ctx.createRadialGradient(0, 0, rr * 0.2, 0, 0, R2); q.addColorStop(0, this._rgba(gc, 0.12 * aur)); q.addColorStop(1, this._rgba(gc, 0)); return q; });
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pulse; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R2, 0, 7); ctx.fill(); ctx.restore();
        if (def.bubbles && Math.random() < 0.35) { const bl = MU.rand(0.5, 0.9); this.particles.push({ x: x + MU.rand(-rr * 0.7, rr * 0.7), y: y + rr * 0.4, vx: MU.rand(-6, 6), vy: -MU.rand(18, 42), life: bl, t: bl, color: gc, r: MU.rand(1.5, 3), over: true }); } // v1.44 — bolle acide che salgono
      } else { const gc = def.eye || def.color || '#ff6b6b'; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = this._grad('a2|' + gc + '|' + rr.toFixed(1), () => { const q = ctx.createRadialGradient(0, 0, rr * 0.25, 0, 0, rr * 1.75); q.addColorStop(0, gc); q.addColorStop(1, 'rgba(0,0,0,0)'); return q; }); ctx.globalAlpha = (m.mg ? 0.55 : m.b ? 0.5 : m.el ? 0.42 : 0.3) * (0.85 + 0.15 * Math.sin(this.time * 4 + x * 0.05)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rr * 1.75, 0, 7); ctx.fill(); ctx.restore(); } // v1.15 alone emissivo
      if (m.tr) { ctx.strokeStyle = 'rgba(255,210,80,' + (0.6 + 0.3 * Math.sin(this.time * 7)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, rr + 8, 0, 7); ctx.stroke(); }
      else if (m.mg) { ctx.strokeStyle = 'rgba(255,45,85,' + (0.5 + 0.3 * Math.sin(this.time * 6)) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, rr + 12 + Math.sin(this.time * 4) * 3, 0, 7); ctx.stroke(); }
      else if (m.b) { ctx.strokeStyle = 'rgba(255,60,60,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, rr + 8 + Math.sin(this.time * 4) * 2, 0, 7); ctx.stroke(); }
      else if (m.el) { ctx.strokeStyle = 'rgba(255,180,40,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, rr + 5, 0, 7); ctx.stroke(); }
      if (m.sh) { ctx.strokeStyle = 'rgba(120,255,234,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, rr + 6, 0, 7); ctx.stroke(); }
      if (m.ps) { /* v1.38 — rimosso il disco verde attorno al nemico: il veleno si vede solo dalle particelle che salgono */ if (Math.random() < 0.3) this.particles.push({ x: x + MU.rand(-rr, rr), y: y - rr, vx: 0, vy: -20, life: 0.5, t: 0.5, color: '#7ee07e', r: 2, over: true }); }
      const bodyc = m.fl ? '#ffffff' : def.color; const dk = m.fl ? '#ffd0d0' : def.color2; const aa = this.mAtk[m.e]; const atk = aa ? Math.max(0, Math.min(1, aa.t / aa.dur)) : 0;
      // v1.46 — rilevamento movimento con ISTERESI + smoothing forte (per non tremolare, tipico dei mostri LENTI
      // come il Bruto la cui velocità sfiorava la soglia e faceva sfarfallare idle↔camminata = "parkinson").
      // v1.48 — soglie ABBASSATE + isteresi: i mostri LENTI (Troll speed 60, ~1px/frame; in vagabondaggio anche 0.5px)
      // ora attivano davvero l'animazione di CAMMINATA invece di restare in idle mentre scivolano.
      const moveInfo = (e) => { const gm = this._gmv || (this._gmv = {}); let pv = gm[e]; if (!pv) { pv = gm[e] = { x: m.x, y: m.y, mv: 0, on: 0, dir: 0 }; return pv; } const dx = m.x - pv.x, dy = m.y - pv.y, sp = Math.hypot(dx, dy); pv.mv = pv.mv != null ? pv.mv * 0.8 + sp * 0.2 : sp; if (pv.on) { if (pv.mv < 0.10) pv.on = 0; } else { if (pv.mv > 0.28) pv.on = 1; } if (sp > 0.05) pv.dir = Math.atan2(dy, dx); pv.x = m.x; pv.y = m.y; return pv; };
      if (def.topdown) { const pv = moveInfo(m.e); this._slimePuddle(ctx, m, rr, def, atk, !!pv.on, pv.dir); } // v1.46 — MELMA top-down (pozza fluo)
      else if (def.fungus) { this._fungusF(ctx, m, rr, def, atk); }   // v1.58 — immobile: nessuna camminata da animare
      else if (def.roller) { this._rollerF(ctx, m, rr, def, atk); }   // v1.58 — rotola: l'animazione e una rotazione
      else if (def.bats) { this._batsF(ctx, m, rr, def, atk); }       // v1.61 — sciame: 11 sagome in orbita, nessuna camminata
      else if (def.wisp) { this._wispF(ctx, m, rr, def, atk); }       // v1.61 — fiamma sospesa: sinusoidi, nessun frame
      else if (def.beholder) { const pv = moveInfo(m.e); this._beholderPuppet(ctx, m, rr, def, atk, !!pv.on, pv.dir); } // v1.49 — BEHOLDER (raster puppet: corpo ritagliato + iris che segue + eyestalks che avvampano nel colore dello sguardo)
      else if (def.sheet) { const pv = moveInfo(m.e); const flip = Math.cos(m.f) < 0 ? -1 : 1; // v1.47 — SPRITE SHEET (troll animato)
        if (!this._drawSheet(def.sheet, ctx, m, rr, def, atk, !!pv.on, flip, m.fl > 0, pv)) { ctx.rotate(m.f); this._shape(ctx, def.shape || 'imp', rr, bodyc, dk, def.eye || '#fff', this.time, atk); } }
      else if (def.front) { const flip = Math.cos(m.f) < 0 ? -1 : 1; const back = Math.sin(m.f) < -0.35; let moving = false; if (def.puppet) { moving = !!moveInfo(m.e).on; } this._front(ctx, def.shape, rr, bodyc, dk, def.eye || '#fff', this.time, atk, back, flip, moving, m.fl > 0, m.el); } // v1.30 billboard · v1.36 movimento · v1.38 hit · v1.39 elite (tint)
      else { ctx.rotate(m.f); this._shape(ctx, def.shape || 'imp', rr, bodyc, dk, def.eye || '#fff', this.time, atk); }
      ctx.restore();
      if (m.tr) { ctx.fillStyle = '#ffd24a'; ctx.font = 'bold 15px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('👑', x, y - rr - 14); ctx.textAlign = 'left'; }
      if (m.hp < m.mhp) { const bw = Math.max(24, rr * 2.2); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - bw / 2, y - rr - 12, bw, m.b ? 6 : 4); ctx.fillStyle = m.tr ? '#ffd24a' : (m.mg ? '#ff2d55' : (m.b ? '#ff3b5b' : (m.el ? '#ffb020' : '#ff6b6b'))); ctx.fillRect(x - bw / 2, y - rr - 12, bw * Math.max(0, m.hp / m.mhp), m.b ? 6 : 4); }
    },
    // v1.26 — segnala un attacco (swing) per il mostro eid
    hitAttack(eid, dur) { if (eid == null) return; this.mAtk[eid] = { t: 0, dur: dur || 0.34 }; },
    // v1.26 — genera uno sprite di morte effimero (crolla/svanisce; volute per il negromante)
    spawnDeath(ev) { const def = MON[ev.id] || BOSSES[ev.id]; if (!def) return; this.deaths.push({ x: ev.x, y: ev.y, f: ev.f || 0, eid: ev.eid, type: ev.id, el: !!ev.elite, boss: !!ev.boss, t: 0, dur: ev.boss ? 0.9 : (def.sheet ? 0.7 : (def.puppet ? 0.8 : 0.6)) }); }, // v1.39/1.47 — morte puppet/sheet un filo più lunga
    _drawDeaths(ctx) {
      for (const d of this.deaths) {
        const def = MON[d.type] || BOSSES[d.type]; if (!def) continue;
        const p = Math.min(1, d.t / d.dur); const rr = def.radius * (window.GAME.Constants.VIS_SCALE || 1) * (d.el ? 1.28 : 1);
        ctx.save(); ctx.translate(d.x, d.y);
        if (def.sheet && SHEETS[def.sheet] && SHEETS[def.sheet].ready) { // v1.47 — morte SPRITE-SHEET: il frame idle cade in avanti e svanisce
          ctx.globalAlpha = Math.max(0, 1 - p); const flip = Math.cos(d.f) < 0 ? -1 : 1;
          ctx.translate(0, rr * 0.5 * p); ctx.rotate(flip * p * 0.5); ctx.scale(1 + p * 0.06, 1 - p * 0.5);
          this._drawSheet(def.sheet, ctx, { e: d.eid || 0, f: d.f, fl: 0 }, rr, def, 0, false, flip, false);
          ctx.globalAlpha = 1;
        }
        else if (def.topdown && PUPPETS.slime && PUPPETS.slime.ready) { // v1.46 — morte MELMA top-down: la pozza si restringe e svanisce
          const img = PUPPETS.slime.imgs.body; const gc = def.eye || '#a6ff3a';
          if (img) { const base = (rr * 2.7) / Math.max(img.width, img.height) * (1 - p * 0.5); ctx.globalAlpha = Math.max(0, 1 - p); ctx.drawImage(img, -img.width * base / 2, -img.height * base / 2, img.width * base, img.height * base); ctx.globalAlpha = 1; }
          ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(0, 0, rr * 0.3, 0, 0, rr * 1.3); gr.addColorStop(0, this._rgba(gc, 0.4 * (1 - p))); gr.addColorStop(1, this._rgba(gc, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rr * 1.3, 0, 7); ctx.fill();
          if (Math.random() < 0.5) this.particles.push({ x: d.x + MU.rand(-rr, rr), y: d.y + MU.rand(-rr, rr), vx: MU.rand(-10, 10), vy: -MU.rand(6, 24), life: 0.5, t: 0.5, color: gc, r: MU.rand(1.5, 3), over: true });
        }
        else if (def.beholder && PUPPETS.beholder && PUPPETS.beholder.ready) { // v1.49 — morte BEHOLDER: l'occhio si chiude/implode e svanisce
          const img = PUPPETS.beholder.imgs.body; const gc = def.eye || '#ff5ad0';
          if (img) { const base = (2.6 * rr) / Math.max(img.width, img.height); const sx = base * (1 + p * 0.3), sy = base * Math.max(0.04, 1 - p * 0.92);
            ctx.globalAlpha = Math.max(0, 1 - p); ctx.drawImage(img, -img.width * sx / 2, -img.height * sy / 2, img.width * sx, img.height * sy); ctx.globalAlpha = 1; }
          ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(0, 0, rr * 0.2, 0, 0, rr * 1.3 * (1 - p * 0.4)); gr.addColorStop(0, this._rgba(gc, 0.5 * (1 - p))); gr.addColorStop(1, this._rgba(gc, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rr * 1.3, 0, 7); ctx.fill();
          if (Math.random() < 0.5) this.particles.push({ x: d.x + MU.rand(-rr, rr), y: d.y + MU.rand(-rr, rr), vx: MU.rand(-14, 14), vy: -MU.rand(8, 30), life: 0.5, t: 0.5, color: gc, r: MU.rand(1.5, 3), over: true });
        }
        else if (def.bats) {   // v1.61 — morte NUGOLO: si sparpaglia (le sagome fuggono verso l'esterno) e svanisce
          ctx.globalAlpha = Math.max(0, 1 - p);
          const N = def.swarmN || 9;
          for (let i = 0; i < N; i++) {
            const ph = i * 2.399963, an = this.time * (1.5 + ((i * 0.53) % 1) * 1.6) + ph;
            const rad = rr * (0.30 + 0.66 * ((i * 0.37) % 1)) * (1 + p * 2.6);
            this._bat1(ctx, Math.cos(an) * rad * 1.18, Math.sin(an * 0.9 + ph) * rad * 0.6 - rr * 0.22 - p * rr,
              rr * 0.155 * (0.78 + 0.44 * ((i * 0.71) % 1)), 0.9, def.eye || '#c9a0ff', Math.cos(an) < 0 ? -1 : 1);
          }
          ctx.globalAlpha = 1;
        }
        else if (def.wisp) {   // v1.61 — morte FUOCO FATUO: la fiamma implode nel nucleo e si spegne
          const gc = def.eye || '#7dffea';
          ctx.globalCompositeOperation = 'lighter';
          const gr = ctx.createRadialGradient(0, 0, 1, 0, 0, rr * (1.8 * (1 - p) + 0.2));
          gr.addColorStop(0, this._rgba(gc, 0.85 * (1 - p))); gr.addColorStop(1, this._rgba(gc, 0));
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rr * (1.8 * (1 - p) + 0.2), 0, 7); ctx.fill();
          if (Math.random() < 0.6) this.particles.push({ x: d.x + MU.rand(-rr, rr), y: d.y + MU.rand(-rr, rr),
            vx: MU.rand(-30, 30), vy: -MU.rand(10, 50), life: 0.5, t: 0.5, color: gc, r: MU.rand(1.2, 2.6), over: true });
        }
        else if (def.puppet && PUPPETS[def.shape] && PUPPETS[def.shape].ready) { // v1.39 — morte PUPPET dedicata (crollo pezzi)
          const flip = Math.cos(d.f) < 0 ? -1 : 1; this._puppetDeath(def.shape, ctx, rr, def.eye || '#fff', this.time, flip, p);
        } else {
          ctx.globalAlpha = Math.max(0, 1 - p);
          if (def.front) { ctx.scale(1 - p * 0.1, 1 - p * 0.55); const flip = Math.cos(d.f) < 0 ? -1 : 1; this._front(ctx, def.shape, rr, def.color, def.color2, def.eye || '#fff', this.time, 0, false, flip); } // v1.30 — collasso frontale
          else { ctx.rotate(d.f + p * (d.boss ? 0.3 : 0.7)); ctx.scale(1 - p * 0.15, 1 - p * 0.5); this._shape(ctx, def.shape || 'imp', rr, def.color, def.color2, def.eye || '#fff', this.time, 0); }
        }
        ctx.restore();
        if ((def.shape === 'mage' || def.shape === 'lich') && Math.random() < 0.4) this.particles.push({ x: d.x + MU.rand(-rr, rr), y: d.y + MU.rand(-rr, rr), vx: MU.rand(-20, 20), vy: -MU.rand(10, 40), life: 0.6, t: 0.6, color: def.eye || '#b48cff', r: MU.rand(1.5, 3), over: true });
      }
    },
    // ============================ v1.30 — SPRITE FRONTALI (billboard) ============================
    _shade(hex, amt) { const n = parseInt(hex.slice(1), 16); let R = (n >> 16) + amt, G = ((n >> 8) & 255) + amt, B = (n & 255) + amt; R = Math.max(0, Math.min(255, R)); G = Math.max(0, Math.min(255, G)); B = Math.max(0, Math.min(255, B)); return 'rgb(' + R + ',' + G + ',' + B + ')'; },
    _rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; },
    _front(ctx, shape, r, col, dk, eye, t, atk, back, flip, moving, hit, elite) {
      ctx.save(); if (flip < 0) ctx.scale(-1, 1);
      if (shape === 'zombie') this._zombieF(ctx, r, col, dk, eye, t, atk, back);
      else if (shape === 'troll') this._trollF(ctx, r, col, dk, eye, t, atk, back);
      else if (shape === 'occhio') this._eyeF(ctx, r, col, dk, eye, t, atk, back);
      else if (shape === 'spettro') this._spettroF(ctx, r, col, dk, eye, t, atk, back);
      else if (shape === 'ghoul') this._puppet('ghoul', ctx, r, eye, t, atk, back, moving, hit, elite);
      else if (shape === 'mage') this._puppet('mage', ctx, r, eye, t, atk, back, moving, hit, elite);
      else if (shape === 'brute') this._puppet('brute', ctx, r, eye, t, atk, back, moving, hit, elite);
      else if (shape === 'slime') this._puppet('slime', ctx, r, eye, t, atk, back, moving, hit, elite);
      ctx.restore();
    },
    // ===== v1.39 — MOTORE PUPPET GENERICO: compone i pezzi PNG ruotandoli attorno ai pivot secondo il
    // profilo (PROF[key]) + overlay vettoriale (occhi/orbe) + ombra a terra. Migliorie v1.39:
    //  • hit-reaction del corpo (squash + rinculo)  • inclinazione nel movimento  • ombra che si allunga
    //  • tint per gli elite (ctx.filter)  • morte dedicata con crollo dei pezzi (vedi _puppetDeath).
    _puppet(key, ctx, r, eye, t, atk, back, moving, hit, elite) {
      const reg = PUPPETS[key], prof = PROF[key]; reg.load();
      if (!reg.ready) { this._zombieF(ctx, r, '#3a3d3a', '#181a18', eye, t, atk, back); return; } // fallback finché carica
      const man = reg.man, SC = 0.5, OX = man.originX, OY0 = prof.OY0, CH = man.charH;
      const s = (prof.K * r) / CH, si = s / SC, D2R = Math.PI / 180, S = Math.sin;
      const st = prof.pose(t, moving, atk); const P = st.P, bob = st.bob, lungeX = st.lungeX, tilt = st.tilt || 0, swing = st.swing || 0;
      // ---- OMBRA A TERRA (si allunga/segue il movimento e l'affondo) ----
      { const fy = (man.feetY - OY0) * s; const lift = Math.max(0, -bob) / 22;
        const stretch = moving ? 1.22 : 1; const off = (moving ? 6 : 0) + lungeX * 0.6;
        const sw = r * 0.62 * stretch * (1 - lift * 0.3), sh = r * 0.20 * (1 - lift * 0.3);
        ctx.save(); ctx.filter = 'blur(' + Math.max(1, r * 0.11).toFixed(1) + 'px)';
        ctx.fillStyle = 'rgba(0,0,0,' + (0.5 - lift * 0.16).toFixed(2) + ')';
        ctx.beginPath(); ctx.ellipse(off * s, fy, sw, sh, 0, 0, 7); ctx.fill(); ctx.restore();
      }
      // ---- HIT-REACTION + SQUASH&STRETCH: scala l'intero puppet attorno alla riga dei piedi ----
      // Il profilo può restituire st.sx/st.sy (es. lo SLIME che si comprime/allunga saltando); l'hit aggiunge lo squash.
      const hb = hit ? 1 : 0;
      const sqx = (st.sx || 1) * (hb ? 1.06 : 1), sqy = (st.sy || 1) * (hb ? 0.9 : 1);
      ctx.save();
      { const fy = (man.feetY - OY0) * s; if (hb) ctx.translate(-5, 0); if (sqx !== 1 || sqy !== 1) { ctx.translate(0, fy); ctx.scale(sqx, sqy); ctx.translate(0, -fy); } }
      // tint elite (facoltativo): applicato ai soli pezzi raster
      const partFilter = elite ? prof.eliteFilter : (st.alpha != null ? '' : '');
      const byName = {}; for (const p of man.parts) byName[p.name] = p;
      for (const name of prof.order) {
        const p = byName[name], img = reg.imgs[name]; if (!p || !img) continue;
        const tr = P[name] || [0, 0, 0];
        const extraRot = (name === 'torso' || name === 'head' || name === 'robe') ? tilt : (tilt * 0.4);
        const wx = (p.ax + tr[1] + lungeX - OX) * s, wy = (p.ay + tr[2] + bob - OY0) * s;
        ctx.save(); ctx.translate(wx, wy); ctx.rotate((tr[0] + extraRot) * D2R);
        if (st.alpha != null) ctx.globalAlpha = st.alpha;
        if (partFilter) ctx.filter = partFilter;
        ctx.drawImage(img, -p.ox * si, -p.oy * si, p.w * si, p.h * si);
        ctx.restore();
      }
      // ---- OVERLAY VETTORIALE: orbe del bastone (mage) + occhi pulsanti (avvampano se colpito) ----
      // orbe/cast (solo mage)
      if (man.orb && byName.armStaff && reg.imgs.armStaff) { const asp = byName.armStaff, atr = P.armStaff || [0, 0, 0];
        ctx.save(); ctx.translate((asp.ax + atr[1] + lungeX - OX) * s, (asp.ay + atr[2] + bob - OY0) * s); ctx.rotate((atr[0] + tilt * 0.4) * D2R);
        ctx.globalCompositeOperation = 'lighter';
        const ox = (man.orb[0] - asp.ax) * s, oy = (man.orb[1] - asp.ay) * s, cast = st.cast || 0;
        const R0 = r * (0.34 + cast * 0.18) * (0.9 + 0.1 * S(t * 5));
        const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, R0);
        gr.addColorStop(0, this._rgba(eye, Math.min(1, 0.85 + cast * 0.15))); gr.addColorStop(0.5, this._rgba(eye, 0.4 + cast * 0.3)); gr.addColorStop(1, this._rgba(eye, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ox, oy, R0, 0, 7); ctx.fill();
        ctx.fillStyle = '#f3e9ff'; ctx.beginPath(); ctx.arc(ox, oy, R0 * 0.28, 0, 7); ctx.fill(); ctx.restore();
      }
      // ---- CORE emissivo (SLIME): nucleo verde acido pulsante che avvampa se colpito ----
      if (man.core && byName.body) { const bp = byName.body, btr = P.body || [0, 0, 0];
        ctx.save(); ctx.translate((bp.ax + btr[1] + lungeX - OX) * s, (bp.ay + btr[2] + bob - OY0) * s); ctx.globalCompositeOperation = 'lighter';
        const cx = (man.core[0] - bp.ax) * s, cy = (man.core[1] - bp.ay) * s;
        const pulse = 0.7 + 0.3 * S(t * 3) + hb * 0.6 + swing * 0.4;
        const R0 = r * 0.55 * (0.92 + 0.08 * S(t * 4));
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R0);
        gr.addColorStop(0, this._rgba(eye, Math.min(1, 0.6 * pulse))); gr.addColorStop(0.5, this._rgba(eye, Math.min(1, 0.26 * pulse))); gr.addColorStop(1, this._rgba(eye, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R0, 0, 7); ctx.fill();
        ctx.fillStyle = this._rgba('#eaffbf', Math.min(1, 0.6 * pulse)); ctx.beginPath(); ctx.arc(cx, cy, R0 * 0.16, 0, 7); ctx.fill(); ctx.restore();
      }
      const noBack = (key === 'slime'); // il blob non ha "dorso": mostra sempre gli occhi
      const hp = byName.head || byName.body, htr = (hp && P[hp.name]) || [0, 0, 0];
      if (hp) {
        ctx.save(); ctx.translate((hp.ax + htr[1] + lungeX - OX) * s, (hp.ay + htr[2] + bob - OY0) * s); ctx.rotate((htr[0] + (byName.head ? tilt : 0)) * D2R);
        if (!back || noBack) {
          ctx.globalCompositeOperation = 'lighter';
          // v1.45 — occhi che si ILLUMINANO nella DIREZIONE DI MOVIMENTO: più intensi mentre si muove, con
          // la pupilla luminosa spostata in avanti (il contesto è già specchiato verso il verso di marcia).
          const mv = st.moving ? 1 : 0;
          const pulse = Math.min(1.9, 0.6 + 0.3 * S(t * 4) + swing * 0.4 + hb * 0.95 + mv * 0.5);
          for (const e of (man.eyes || [])) {
            const ex = (e[0] - hp.ax) * s, ey = (e[1] - hp.ay) * s, R0 = r * (0.16 + swing * 0.05 + hb * 0.07 + mv * 0.03);
            const gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, R0 * 3);
            gr.addColorStop(0, this._rgba(eye, Math.min(1, 0.9 * pulse))); gr.addColorStop(0.4, this._rgba(eye, Math.min(1, 0.5 * pulse))); gr.addColorStop(1, this._rgba(eye, 0));
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ex, ey, R0 * 3, 0, 7); ctx.fill();
            const fwd = mv * R0 * 0.5; // pupilla spostata in avanti (verso il movimento)
            ctx.fillStyle = '#f4fff0'; ctx.beginPath(); ctx.arc(ex + fwd, ey, R0 * (0.5 + hb * 0.25 + mv * 0.12), 0, 7); ctx.fill();
          }
        } else {
          ctx.fillStyle = 'rgba(8,10,14,0.5)'; ctx.beginPath(); ctx.ellipse(0, -r * 0.25, r * 0.72, r * 0.86, 0, 0, 7); ctx.fill();
          if (hb) { ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(0, -r * 0.25, 0, 0, -r * 0.25, r * 0.9); gr.addColorStop(0, this._rgba(eye, 0.75)); gr.addColorStop(1, this._rgba(eye, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, -r * 0.25, r * 0.9, 0, 7); ctx.fill(); }
        }
        ctx.restore();
      }
      ctx.restore();
    },
    // v1.39 — MORTE PUPPET DEDICATA: i pezzi crollano (gambe cedono, testa rotola, veste si accascia) con dissolvenza.
    _puppetDeath(key, ctx, r, eye, t, flip, p) {
      const reg = PUPPETS[key], prof = PROF[key]; reg.load();
      if (!reg.ready || !prof.death) return false;
      const man = reg.man, SC = 0.5, OX = man.originX, OY0 = prof.OY0, CH = man.charH;
      const s = (prof.K * r) / CH, si = s / SC, D2R = Math.PI / 180;
      ctx.save(); if (flip < 0) ctx.scale(-1, 1);
      const st = prof.death(p); const P = st.P, bob = st.bob, alpha = st.alpha;
      // ombra che si dissolve e allarga
      { const fy = (man.feetY - OY0) * s; ctx.save(); ctx.filter = 'blur(' + Math.max(1, r * 0.12).toFixed(1) + 'px)';
        ctx.fillStyle = 'rgba(0,0,0,' + (0.42 * (1 - p)).toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(0, fy, r * 0.7 * (1 + p * 0.4), r * 0.22, 0, 0, 7); ctx.fill(); ctx.restore(); }
      // v1.44 — squash&stretch anche in morte (lo SLIME si scioglie appiattendosi)
      if (st.sx != null || st.sy != null) { const fy = (man.feetY - OY0) * s; ctx.translate(0, fy); ctx.scale(st.sx || 1, st.sy || 1); ctx.translate(0, -fy); }
      const byName = {}; for (const q of man.parts) byName[q.name] = q;
      for (const name of prof.order) {
        const q = byName[name], img = reg.imgs[name]; if (!q || !img) continue;
        const tr = P[name] || [0, 0, 0];
        const wx = (q.ax + tr[1] - OX) * s, wy = (q.ay + tr[2] + bob - OY0) * s;
        ctx.save(); ctx.globalAlpha = Math.max(0, alpha); ctx.translate(wx, wy); ctx.rotate(tr[0] * D2R);
        ctx.drawImage(img, -q.ox * si, -q.oy * si, q.w * si, q.h * si); ctx.restore();
      }
      // occhi che si spengono
      const hp = byName.head; if (hp && alpha > 0.05) { const htr = P.head || [0, 0, 0];
        ctx.save(); ctx.translate((hp.ax + htr[1] - OX) * s, (hp.ay + htr[2] + bob - OY0) * s); ctx.rotate(htr[0] * D2R); ctx.globalCompositeOperation = 'lighter';
        for (const e of (man.eyes || [])) { const ex = (e[0] - hp.ax) * s, ey = (e[1] - hp.ay) * s, R0 = r * 0.16 * alpha; const gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, R0 * 3); gr.addColorStop(0, this._rgba(eye, 0.8 * alpha)); gr.addColorStop(1, this._rgba(eye, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ex, ey, R0 * 3, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      ctx.restore(); return true;
    },
    // v1.46 — MELMA CORROSIVA in vista TOP-DOWN: pozza fluo che striscia sul pavimento. Niente billboard/ombra:
    // il PNG (con edge-glow bakeato) è già "a terra". Animazione: WOBBLE gelatinoso (scala non uniforme lenta),
    // STIRAMENTO nella direzione di marcia, leggera rotazione ondeggiante, edge-glow additivo pulsante e
    // "spruzzo" in attacco. Il contesto è già traslato su (m.x, m.y).
    // v1.49 — BEHOLDER (raster puppet): disegna il corpo ritagliato (billboard fluttuante, leggero respiro),
    // poi sovrappone l'IRIDE centrale che SEGUE il bersaglio e si DILATA in attacco, gli occhi delle eyestalks
    // che AVVAMPANO nel colore dello sguardo ATTIVO (m.gk: weaken/slow/sunder) e un edge-glow magenta pulsante.
    // Il contesto e' gia' traslato su (m.x, m.y). Mirror non necessario (simmetrico).
    _beholderPuppet(ctx, m, r, def, atk, moving, dir) {
      const reg = PUPPETS.beholder; reg.load(); const img = reg.imgs.body; const man = reg.man; const t = this.time;
      const swing = Math.sin((atk || 0) * Math.PI);
      const GAZE = { weaken: '#ff7a5a', slow: '#5ad0ff', sunder: '#c48cff' };
      const gcolHex = GAZE[m.gk] || def.eye || '#ff5ad0';
      const gcol = this._hexToRgb(gcolHex);
      if (!reg.ready || !img) { // fallback: alone + iride finche' carica
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.3); gr.addColorStop(0, this._rgba(gcolHex, 0.6)); gr.addColorStop(1, this._rgba(gcolHex, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r * 1.3, 0, 7); ctx.fill(); ctx.restore(); return;
      }
      const base = (2.6 * r) / Math.max(img.width, img.height);   // il corpo ~2.6*raggio
      // v1.59 — stato per-entita': serve per le cose che non sono funzioni pure del tempo
      // (l'inclinazione va smorzata, le saccadi devono TENERE la posizione fra uno scatto e l'altro).
      const ST = this._behS = this._behS || {};
      const S = ST[m.e] = ST[m.e] || { lean: 0, sx: 1, sy: 0, sacT: 0, gk: m.gk, flare: 0, lt: t };
      const dt = Math.max(0.001, Math.min(0.05, t - S.lt)); S.lt = t;

      // (1) INCLINAZIONE nella direzione del moto: prima ondeggiava identico fermo o in corsa.
      const leanT = moving ? Math.cos(dir || 0) * 0.17 : 0;
      S.lean += (leanT - S.lean) * Math.min(1, dt * 6);

      // (4) TELEGRAFO del cambio sguardo. gt arriva dal server: 0 = sta per cambiare.
      // Il corpo si contrae PRIMA (anticipo leggibile), poi lampeggia quando e' cambiato.
      const gt = (m.gt != null) ? m.gt : 1;
      const tell = gt < 0.16 ? (1 - gt / 0.16) : 0;
      if (S.gk !== m.gk) { S.gk = m.gk; S.flare = 1; }
      S.flare = Math.max(0, S.flare - dt * 2.4);
      const squash = tell * 0.11 + S.flare * 0.07;

      const breath = 0.03 * Math.sin(t * 1.7 + m.e);              // respiro gelatinoso
      let sx = base * (1 + breath - squash * 0.55), sy = base * (1 - breath + squash);
      const rot = 0.05 * Math.sin(t * 0.8 + m.e) + S.lean;
      const bob = -3 * Math.sin(t * 1.7 + m.e) - swing * r * 0.06;
      const act = 0.5 + 0.4 * Math.sin(t * 3.4 + m.e) + (moving ? 0.15 : 0) + swing * 0.45 + tell * 0.55 + S.flare * 0.55;

      // ombra morbida sotto (fluttua)
      ctx.save(); ctx.filter = 'blur(' + Math.max(1, r * 0.12).toFixed(1) + 'px)'; ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.beginPath(); ctx.ellipse(0, r * 1.02, r * 0.72, r * 0.2, 0, 0, 7); ctx.fill(); ctx.restore();

      // (2) EYESTALKS come APPENDICI, disegnate DIETRO il corpo cosi' spuntano da dietro il bulbo.
      // Prima erano 7 aloni fissi: tutto si muoveva in blocco. Ora ogni stelo ha frequenza e fase sue,
      // quindi non tornano mai in sincrono; nel telegrafo si drizzano e si allungano.
      const NST = 7;
      for (let i = 0; i < NST; i++) {
        const a0 = -Math.PI * 0.5 + (i - (NST - 1) / 2) * 0.40;
        const rate = 1.55 + (i % 4) * 0.47, ph = i * 1.93 + m.e * 0.31;
        const sway = Math.sin(t * rate + ph) * (0.22 - tell * 0.18);
        const len = r * (0.70 + 0.15 * Math.sin(t * rate * 0.7 + ph)) * (1 + tell * 0.25);
        const a = a0 + sway;
        const bx0 = Math.cos(a0) * r * 0.50, by0 = Math.sin(a0) * r * 0.50 - r * 0.16 + bob;
        const ex = Math.cos(a) * (r * 0.50 + len), ey = Math.sin(a) * (r * 0.50 + len) - r * 0.16 + bob;
        const bend = Math.sin(t * rate + ph) * len * 0.30;
        const mxc = (bx0 + ex) / 2 + Math.cos(a + 1.5708) * bend, myc = (by0 + ey) / 2 + Math.sin(a + 1.5708) * bend;
        ctx.save(); ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(34,10,30,.95)'; ctx.lineWidth = Math.max(2, r * 0.115);
        ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.quadraticCurveTo(mxc, myc, ex, ey); ctx.stroke();
        ctx.strokeStyle = this._rgba(gcolHex, 0.22 + 0.28 * Math.min(1, act)); ctx.lineWidth = Math.max(1, r * 0.045);
        ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.quadraticCurveTo(mxc, myc, ex, ey); ctx.stroke();
        ctx.restore();
        const R0 = r * 0.145 * (0.85 + 0.35 * Math.sin(t * 5 + i));
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gr0 = ctx.createRadialGradient(ex, ey, 0, ex, ey, R0 * 2.6);
        gr0.addColorStop(0, this._rgba(gcolHex, Math.min(1, 0.85 * act))); gr0.addColorStop(0.5, this._rgba(gcolHex, 0.38 * Math.min(1, act))); gr0.addColorStop(1, this._rgba(gcolHex, 0));
        ctx.fillStyle = gr0; ctx.beginPath(); ctx.arc(ex, ey, R0 * 2.6, 0, 7); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#fff0fb'; ctx.beginPath(); ctx.arc(ex, ey, R0 * 0.5, 0, 7); ctx.fill();
        ctx.fillStyle = '#120612'; ctx.beginPath(); ctx.arc(ex + Math.cos(m.f) * R0 * 0.26, ey + Math.sin(m.f) * R0 * 0.26, R0 * 0.22, 0, 7); ctx.fill();
      }

      // corpo raster
      ctx.save(); ctx.rotate(rot);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -img.width * sx / 2, -img.height * sy / 2 + bob, img.width * sx, img.height * sy);
      ctx.restore();

      // ---- IRIDE: (3) MICROSACCADI invece dell'inseguimento fluido. L'occhio scatta e poi TIENE:
      // e' lo scatto a farlo sembrare vivo, il moto continuo lo faceva sembrare una torretta.
      const cx = man.core ? (man.core[0] - man.centerX) * base : 0;
      const cy = man.core ? (man.core[1] - man.centerY) * base + bob : bob + r * 0.15;
      S.sacT -= dt;
      if (S.sacT <= 0) {
        S.sacT = 0.28 + ((m.e * 37) % 7) * 0.09 + Math.random() * 0.26;
        const j = 0.24; S.sx = Math.cos(m.f) + (Math.random() - 0.5) * j; S.sy = Math.sin(m.f) + (Math.random() - 0.5) * j;
      }
      const look = 0.16 * r, fx = S.sx * look, fy2 = S.sy * look;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const irisR = r * (0.42 + swing * 0.06);
      const ig = ctx.createRadialGradient(cx + fx * 0.4, cy + fy2 * 0.4, 1, cx + fx * 0.4, cy + fy2 * 0.4, irisR);
      ig.addColorStop(0, this._rgba(gcolHex, 0.55)); ig.addColorStop(0.55, this._rgba(gcolHex, 0.30)); ig.addColorStop(1, this._rgba(gcolHex, 0));
      ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(cx + fx * 0.4, cy + fy2 * 0.4, irisR, 0, 7); ctx.fill();
      ctx.restore();
      const pupR = r * (0.14 + swing * 0.16);
      ctx.fillStyle = '#080308'; ctx.beginPath(); ctx.arc(cx + fx, cy + fy2, pupR, 0, 7); ctx.fill();
      ctx.fillStyle = this._rgba(gcolHex, 0.9); ctx.beginPath(); ctx.arc(cx + fx - pupR * 0.3, cy + fy2 - pupR * 0.3, pupR * 0.28, 0, 7); ctx.fill();

      // ---- (3b) PALPEBRA: un occhio che non ammicca mai e' un occhio finto. Periodo irregolare per entita'.
      const per = 4.2 + ((m.e * 13) % 9) * 0.42;
      const bt2 = (t + m.e * 0.7) % per;
      const blink = bt2 < 0.17 ? Math.sin((bt2 / 0.17) * Math.PI) : 0;
      if (blink > 0.02) {
        const R3 = irisR * 1.4, k = R3 * blink;
        ctx.save(); ctx.fillStyle = '#1b0c18';
        ctx.beginPath(); ctx.moveTo(cx - R3, cy - R3); ctx.lineTo(cx + R3, cy - R3); ctx.lineTo(cx + R3, cy - R3 + k);
        ctx.quadraticCurveTo(cx, cy - R3 + k * 1.3, cx - R3, cy - R3 + k); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - R3, cy + R3); ctx.lineTo(cx + R3, cy + R3); ctx.lineTo(cx + R3, cy + R3 - k);
        ctx.quadraticCurveTo(cx, cy + R3 - k * 1.3, cx - R3, cy + R3 - k); ctx.closePath(); ctx.fill();
        ctx.restore();
      }

      // ---- edge-glow pulsante (avvampa se colpito/attacca/cambia sguardo) ----
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const pr = 0.10 + 0.06 * Math.sin(t * 3 + m.e) + swing * 0.18 + tell * 0.22 + S.flare * 0.26 + (m.fl > 0 ? 0.35 : 0);
      const R2 = r * 1.32; const eg = ctx.createRadialGradient(0, bob, r * 0.6, 0, bob, R2);
      eg.addColorStop(0, this._rgba(gcolHex, 0)); eg.addColorStop(0.84, this._rgba(gcolHex, Math.min(0.6, pr))); eg.addColorStop(1, this._rgba(gcolHex, 0));
      ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(0, bob, R2, 0, 7); ctx.fill(); ctx.restore();
    },
    _hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 }; },
    _slimePuddle(ctx, m, r, def, atk, moving, dir) {
      const reg = PUPPETS.slime; reg.load(); const img = reg.imgs.body; const gc = def.eye || '#a6ff3a'; const t = this.time;
      const swing = Math.sin((atk || 0) * Math.PI);
      if (!reg.ready || !img) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.2); gr.addColorStop(0, this._rgba(gc, 0.5)); gr.addColorStop(1, this._rgba(gc, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r * 1.2, 0, 7); ctx.fill(); ctx.restore(); return; }
      const base = (r * 2.7) / Math.max(img.width, img.height);   // la pozza copre ~2.7·raggio
      const w1 = 0.06 * Math.sin(t * 1.8 + m.e * 1.3);             // wobble gelatinoso lento
      let sx = base * (1 + w1), sy = base * (1 - w1 * 0.85);
      sx *= (1 + swing * 0.16); sy *= (1 + swing * 0.16);          // "gonfia" nello sputo
      ctx.save();
      const rot = 0.06 * Math.sin(t * 0.9 + m.e) + (moving && dir != null ? dir * 0.12 : 0); // leggero ondeggio + accenno alla marcia
      ctx.rotate(rot);
      if (moving) { sx *= 1.12; sy *= 0.94; }                       // si allunga strisciando
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -img.width * sx / 2, -img.height * sy / 2, img.width * sx, img.height * sy);
      ctx.restore();
      // edge-glow additivo pulsante (rinforza il bordo fluo, avvampa se colpito/attacca)
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const pr = 0.10 + 0.06 * Math.sin(t * 3 + m.e) + swing * 0.18 + (m.fl > 0 ? 0.35 : 0);
      const R2 = r * 1.28; const gr = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, R2);
      gr.addColorStop(0, this._rgba(gc, 0)); gr.addColorStop(0.82, this._rgba(gc, Math.min(0.6, pr))); gr.addColorStop(1, this._rgba(gc, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R2, 0, 7); ctx.fill(); ctx.restore();
    },
    // v1.47 — RENDER SPRITE-SHEET: sceglie l'animazione (idle/walk/attack), il frame (dal tempo o dalla fase
    // d'attacco), ritaglia la cella dalla griglia e la disegna ancorata ai PIEDI. Mirror orizzontale per direzione.
    // Il contesto è già traslato su (m.x, m.y). Ritorna false se gli asset non sono pronti (fallback al chiamante).
    _drawSheet(key, ctx, m, r, def, atk, moving, flip, hit, pv) {
      const reg = SHEETS[key]; reg.load(); if (!reg.ready) return false;
      const man = reg.man, cell = man.cell, cols = man.cols, t = this.time;
      // v1.60 — stato per-entita'. Serve per tre cose che una funzione pura del tempo non puo' fare:
      // la DISTANZA percorsa (per agganciare il passo al terreno), la DISSOLVENZA fra due animazioni
      // e il VERSO smorzato. Senza, i piedi slittano e ogni cambio di stato e' uno scatto.
      const ST = this._shS = this._shS || {};
      const S = ST[m.e] = ST[m.e] || { x: m.x, y: m.y, d: 0, anim: null, prev: null, prevFi: 0, fi: 0, fade: 1, flip: flip, lt: t };
      const dt = Math.max(0.001, Math.min(0.05, t - S.lt)); S.lt = t;
      S.d += Math.hypot(m.x - S.x, m.y - S.y); S.x = m.x; S.y = m.y;

      const animName = (atk && atk > 0.001) ? 'attack' : (moving ? 'walk' : 'idle');
      if (S.anim !== animName) { S.prev = S.anim; S.prevFi = S.fi; S.anim = animName; S.fade = 0; }
      S.fade = Math.min(1, S.fade + dt / (man.blend || 0.14));

      const frameOf = (A) => {
        if (A.oneShot) {
          // v1.60 — mappatura a DUE TRATTI ancorata al fotogramma d'impatto. Prima era lineare:
          // con 25 fotogrammi la martellata si vedeva al 15 (0.60) ma il danno arriva a slamHit (0.72),
          // cioe' tre fotogrammi dopo. Si vedeva colpire e si subiva un attimo dopo.
          // In piu' i primi 7 fotogrammi sono una posa ferma: la curva (^0.72) li brucia in fretta e
          // indugia sul caricamento, che e' dove serve l'anticipo.
          const hf = (A.hitFrame != null) ? A.hitFrame : Math.round(A.frames * 0.6);
          const hp = def.slamHit || 0.72;
          const a = Math.max(0, Math.min(1, atk || 0));
          const f = (a <= hp) ? Math.pow(a / (hp || 1), 0.72) * hf
                              : hf + ((a - hp) / (1 - hp)) * (A.frames - 1 - hf);
          return Math.max(0, Math.min(A.frames - 1, Math.round(f)));
        }
        if (A.cyclePx) {
          // v1.60 — PASSO AGGANCIATO AL TERRENO: la fase viene dalla distanza percorsa, non dall'orologio.
          // Cosi' i piedi non slittano mai, e se la velocita' cambia (elite, rallentamenti, scaling)
          // la cadenza si adegua da sola invece di restare a fps fisso.
          return Math.floor((S.d / A.cyclePx) * A.frames + (m.e || 0) * 0.7) % A.frames;
        }
        return Math.floor(t * A.fps + (m.e || 0) * 0.7) % A.frames;
      };

      // v1.60 — il verso non si ribalta di scatto: passa per lo zero, quindi il troll si "gira" schiacciandosi
      S.flip += (flip - S.flip) * Math.min(1, dt * 13);
      const fx = Math.abs(S.flip) < 0.05 ? (S.flip < 0 ? -0.05 : 0.05) : S.flip;

      // ombra propria ai piedi (l'anchor cade sull'origine): non ruota col verso
      ctx.save(); ctx.filter = 'blur(' + Math.max(1, r * 0.10).toFixed(1) + 'px)'; ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.beginPath(); ctx.ellipse(0, -r * 0.04, r * 0.72, r * 0.24, 0, 0, 7); ctx.fill(); ctx.restore();

      const s = (2.9 * r) / man.charH, dw = cell * s, dh = cell * s;
      const drawOne = (nm, fi, alpha) => {
        const A = man.anims[nm]; const img = reg.imgs[nm]; if (!A || !img) return;
        const c0 = fi % cols, r0 = (fi / cols) | 0;
        ctx.save(); ctx.globalAlpha = ctx.globalAlpha * alpha; ctx.scale(fx, 1);
        if (hit) ctx.filter = 'brightness(1.7) saturate(1.2)';
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, c0 * cell, r0 * cell, cell, cell, -A.ax * s, -A.ay * s, dw, dh);
        ctx.restore();
      };

      const A = man.anims[animName] || man.anims.idle;
      if (!reg.imgs[animName] && !reg.imgs.idle) return false;
      const fi = frameOf(A); S.fi = fi;
      // dissolvenza: l'animazione uscente sfuma mentre entra la nuova (prima era un taglio netto)
      if (S.prev && S.prev !== animName && S.fade < 1) drawOne(S.prev, S.prevFi, 1 - S.fade);
      drawOne(animName, fi, S.fade);
      return true;
    },

    _zombieF(ctx, r, col, dk, eye, t, atk, back) {
      const D = '#0a0c12'; const phase = t * 7; const walk = Math.sin(phase); const bob = Math.sin(phase * 2) * r * 0.05;
      const swing = Math.sin((atk || 0) * Math.PI); const lp = (a, b) => a + (b - a) * swing;
      ctx.save(); ctx.filter = 'blur(1.5px)'; ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, r * 1.12, r * 0.5, r * 0.16, 0, 0, 7); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(0, bob); ctx.lineJoin = 'round';
      const foot = (sgn, sw) => { ctx.strokeStyle = dk; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(3, r * 0.26); ctx.beginPath(); ctx.moveTo(sgn * r * 0.22, r * 0.42); ctx.lineTo(sgn * r * 0.26, r * 0.98 + sw * r * 0.12); ctx.stroke(); ctx.fillStyle = dk; ctx.strokeStyle = D; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sgn * r * 0.28, r * 1.02 + sw * r * 0.12, r * 0.15, r * 0.09, 0, 0, 7); ctx.fill(); ctx.stroke(); };
      foot(-1, walk); foot(1, -walk);
      const bg = ctx.createLinearGradient(-r, 0, r, 0); bg.addColorStop(0, dk); bg.addColorStop(1, col); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.62, r * 0.7, 0, 0, 7); ctx.fill(); ctx.stroke();
      if (!back) { ctx.fillStyle = 'rgba(74,20,24,.5)'; ctx.beginPath(); ctx.ellipse(r * 0.14, r * 0.26, r * 0.15, r * 0.19, 0.3, 0, 7); ctx.fill(); ctx.strokeStyle = this._rgba(dk, 0.8); ctx.lineWidth = 1.4; for (let i = 0; i < 3; i++) { const yy = -r * 0.12 + i * r * 0.18; ctx.beginPath(); ctx.moveTo(-r * 0.14, yy); ctx.lineTo(r * 0.14, yy + 2); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(0, -r * 0.28); ctx.lineTo(0, r * 0.4); ctx.stroke(); }
      for (const sgn of [-1, 1]) { const sway = Math.sin(phase + (sgn < 0 ? 0 : Math.PI)) * r * 0.06; const shx = sgn * r * 0.48, shy = -r * 0.26; const elx = sgn * lp(r * 0.58, r * 0.46), ely = lp(r * 0.34, -r * 0.12) + sway; const hnx = sgn * lp(r * 0.6, r * 0.3), hny = lp(r * 0.84, -r * 0.4) + sway; ctx.strokeStyle = dk; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.2; ctx.beginPath(); ctx.moveTo(shx, shy); ctx.lineTo(elx, ely); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = r * 0.17; ctx.beginPath(); ctx.moveTo(elx, ely); ctx.lineTo(hnx, hny); ctx.stroke(); ctx.fillStyle = col; ctx.strokeStyle = D; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hnx, hny, r * 0.16, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = dk; ctx.lineWidth = r * 0.05; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(hnx, hny); ctx.lineTo(hnx + sgn * r * 0.02, hny + lp(r * 0.18, -r * 0.04) + k * r * 0.07); ctx.stroke(); } }
      ctx.save(); ctx.translate(0, -r * 0.52); ctx.fillStyle = col; ctx.strokeStyle = D; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, 7); ctx.fill(); ctx.stroke();
      if (!back) { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(-r * 0.15, -r * 0.02, r * 0.11, r * 0.14, 0, 0, 7); ctx.ellipse(r * 0.15, -r * 0.02, r * 0.11, r * 0.14, 0, 0, 7); ctx.fill(); ctx.fillStyle = eye; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4); ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.02, r * 0.045, 0, 7); ctx.arc(r * 0.15, -r * 0.02, r * 0.045, 0, 7); ctx.fill(); ctx.globalAlpha = 1; const jaw = r * (0.05 + swing * 0.14); ctx.fillStyle = '#2a0d0d'; ctx.beginPath(); ctx.ellipse(0, r * 0.24, r * 0.12, jaw + r * 0.03, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#cfc7b0'; for (let k = -1; k <= 1; k++) ctx.fillRect(k * r * 0.08 - r * 0.02, r * 0.16, r * 0.035, r * 0.06); }
      else { ctx.strokeStyle = this._rgba(dk, 0.7); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-r * 0.16, -r * 0.12); ctx.lineTo(r * 0.04, r * 0.1); ctx.moveTo(r * 0.16, -r * 0.12); ctx.lineTo(-r * 0.02, r * 0.12); ctx.stroke(); }
      ctx.restore(); ctx.restore();
    },
    _necroF(ctx, r, col, dk, eye, t, atk, back) {
      const D = '#0a0713'; const phase = t * 5; const bob = Math.sin(phase) * r * 0.04; const sway = Math.sin(phase) * 0.05; const swing = Math.sin((atk || 0) * Math.PI); const pulse = 0.6 + 0.4 * Math.sin(t * 5);
      ctx.save(); ctx.filter = 'blur(1.5px)'; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, r * 1.05, r * 0.42, r * 0.14, 0, 0, 7); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(0, bob); ctx.lineJoin = 'round';
      const hemY = r * 1.02, hemW = r * 0.82, topW = r * 0.32, topY = -r * 0.26;
      const rg = ctx.createLinearGradient(0, topY, 0, hemY); rg.addColorStop(0, col); rg.addColorStop(1, dk); ctx.fillStyle = rg; ctx.strokeStyle = D; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-topW, topY); ctx.quadraticCurveTo(-hemW * 0.9, r * 0.4, -hemW * (1 + sway), hemY); const waves = 5; for (let i = 0; i <= waves; i++) { const xx = -hemW * (1 + sway) + 2 * hemW * (i / waves); const yy = hemY + Math.sin(i * 1.7 + phase) * r * 0.06; ctx.lineTo(xx, yy); } ctx.quadraticCurveTo(hemW * 0.9, r * 0.4, topW, topY); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(6,4,12,.5)'; ctx.lineWidth = 1.4; for (const fx of [-0.4, 0, 0.4]) { ctx.beginPath(); ctx.moveTo(fx * topW * 1.4, topY + r * 0.1); ctx.quadraticCurveTo(fx * hemW * 1.1, r * 0.5, fx * hemW * 1.05, hemY - r * 0.05); ctx.stroke(); }
      ctx.save(); ctx.globalAlpha = 0.5 * pulse + 0.25; ctx.fillStyle = eye; for (let i = 0; i < 7; i++) { const xx = -hemW * 0.8 + i * (hemW * 1.6 / 6); ctx.beginPath(); ctx.arc(xx, hemY - r * 0.16, r * 0.03, 0, 7); ctx.fill(); } ctx.restore();
      const castUp = swing; { const shx = -r * 0.32, shy = -r * 0.02; const hx = -r * 0.6, hy = (0.5 - castUp * 1.1) * r * 0.6 + r * 0.1; ctx.strokeStyle = dk; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.24; ctx.beginPath(); ctx.moveTo(shx, shy); ctx.quadraticCurveTo(-r * 0.58, r * 0.15, hx, hy); ctx.stroke(); ctx.strokeStyle = '#cfc8b4'; ctx.lineWidth = r * 0.05; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - r * 0.1, hy - r * 0.12 + k * r * 0.09); ctx.stroke(); } if (!back) { ctx.save(); ctx.globalAlpha = 0.4 + 0.6 * castUp; ctx.fillStyle = eye; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(hx - r * 0.16 - k * r * 0.08, hy - r * 0.16 - k * r * 0.05, r * (0.05 + castUp * 0.05) * (1 - k * 0.2), 0, 7); ctx.fill(); } ctx.restore(); } }
      { const shx = r * 0.32, shy = -r * 0.02; const hx = r * 0.48, hy = r * 0.2 - swing * r * 0.25; ctx.strokeStyle = dk; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.24; ctx.beginPath(); ctx.moveTo(shx, shy); ctx.quadraticCurveTo(r * 0.58, r * 0.1, hx, hy); ctx.stroke(); const topx = hx + r * 0.04, topy = -r * 0.92 - swing * r * 0.2, botx = hx - r * 0.02, boty = r * 0.82; ctx.strokeStyle = '#2a2118'; ctx.lineWidth = r * 0.09; ctx.beginPath(); ctx.moveTo(botx, boty); ctx.lineTo(topx, topy); ctx.stroke(); const orbR = r * (0.2 + swing * 0.12); const og = ctx.createRadialGradient(topx, topy, 0, topx, topy, orbR * 2.4); og.addColorStop(0, 'rgba(235,220,255,.9)'); og.addColorStop(0.4, this._rgba(eye, 0.55 * pulse + 0.2)); og.addColorStop(1, this._rgba(eye, 0)); ctx.fillStyle = og; ctx.beginPath(); ctx.arc(topx, topy, orbR * 2.4, 0, 7); ctx.fill(); ctx.fillStyle = eye; ctx.strokeStyle = this._shade(eye, 40); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(topx, topy, orbR, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(topx - orbR * 0.3, topy - orbR * 0.3, orbR * 0.35, 0, 7); ctx.fill(); }
      const cg = ctx.createLinearGradient(0, -r * 0.4, 0, 0); cg.addColorStop(0, dk); cg.addColorStop(1, col); ctx.fillStyle = cg; ctx.strokeStyle = D; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * 0.48, -r * 0.02); ctx.quadraticCurveTo(-r * 0.52, -r * 0.4, -r * 0.16, -r * 0.48); ctx.quadraticCurveTo(0, -r * 0.4, r * 0.16, -r * 0.48); ctx.quadraticCurveTo(r * 0.52, -r * 0.4, r * 0.48, -r * 0.02); ctx.quadraticCurveTo(0, r * 0.12, -r * 0.48, -r * 0.02); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(0, -r * 0.6); ctx.fillStyle = dk; ctx.strokeStyle = D; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.32, r * 0.38, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#050308'; ctx.beginPath(); ctx.ellipse(0, r * 0.03, r * 0.22, r * 0.28, 0, 0, 7); ctx.fill(); if (!back) { ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4); ctx.fillStyle = eye; ctx.shadowColor = eye; ctx.shadowBlur = 6; ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 0.05, r * 0.07, 0, 0, 7); ctx.ellipse(r * 0.1, 0, r * 0.05, r * 0.07, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.restore(); } ctx.restore();
      ctx.save(); ctx.translate(0, -r * 0.84); ctx.fillStyle = dk; ctx.strokeStyle = D; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.6, r * 0.2, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.02); ctx.quadraticCurveTo(-r * 0.18, -r * 0.7, r * 0.16, -r * 0.92); ctx.quadraticCurveTo(r * 0.02, -r * 0.5, r * 0.3, -r * 0.02); ctx.closePath(); const hg = ctx.createLinearGradient(-r * 0.3, 0, r * 0.3, 0); hg.addColorStop(0, '#0d0d10'); hg.addColorStop(1, col); ctx.fillStyle = hg; ctx.fill(); ctx.stroke(); ctx.save(); ctx.globalAlpha = 0.7 * pulse + 0.3; ctx.fillStyle = eye; ctx.beginPath(); ctx.arc(0, -r * 0.02, r * 0.05, 0, 7); ctx.fill(); ctx.restore(); ctx.restore();
      ctx.restore();
    },
    _trollF(ctx, r, col, dk, eye, t, atk, back) {
      const D = '#0b1108', CLAW = '#cfc8b4'; const phase = t * 6; const walk = Math.sin(phase); const bob = Math.abs(Math.sin(phase)) * r * 0.05 - r * 0.02; const breathe = Math.sin(t * 3) * r * 0.02; const swing = Math.sin((atk || 0) * Math.PI); const lp = (a, b) => a + (b - a) * swing; const LT = this._shade(col, 18);
      ctx.save(); ctx.filter = 'blur(1.8px)'; ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(0, r * 1.2, r * 0.72, r * 0.18, 0, 0, 7); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(0, bob); ctx.lineJoin = 'round';
      const stub = (sgn, sw) => { ctx.strokeStyle = dk; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.4; ctx.beginPath(); ctx.moveTo(sgn * r * 0.32, r * 0.55); ctx.lineTo(sgn * r * 0.4, r * 1.0 + sw * r * 0.06); ctx.stroke(); ctx.fillStyle = dk; ctx.strokeStyle = D; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sgn * r * 0.44, r * 1.05 + sw * r * 0.06, r * 0.26, r * 0.14, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = CLAW; ctx.lineWidth = r * 0.05; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(sgn * r * 0.56 + k * r * 0.1, r * 1.08 + sw * r * 0.06); ctx.lineTo(sgn * r * 0.6 + k * r * 0.1, r * 1.14 + sw * r * 0.06); ctx.stroke(); } };
      stub(-1, walk); stub(1, -walk);
      const drawArm = (sgn, isBack, lift) => { const shx = sgn * r * 0.58, shy = -r * 0.3; const elx = sgn * lp(r * 0.98, r * 0.58), ely = lp(r * 0.3, -r * 0.34) - lift * r * 0.55; const hnx = sgn * lp(r * 0.9, r * 0.32), hny = lp(r * 1.12, -r * 0.6) - lift * r * 0.18; ctx.strokeStyle = isBack ? dk : this._shade(col, -6); ctx.lineCap = 'round'; ctx.lineWidth = r * 0.3; ctx.beginPath(); ctx.moveTo(shx, shy); ctx.quadraticCurveTo(sgn * r * 1.02, lp(-r * 0.02, -r * 0.3), elx, ely); ctx.stroke(); ctx.strokeStyle = isBack ? dk : col; ctx.lineWidth = r * 0.28; ctx.beginPath(); ctx.moveTo(elx, ely); ctx.lineTo(hnx, hny); ctx.stroke(); }; // v1.32 — braccia SENZA mani (rimosso pugno + nocche + artigli)
      const armLift = (atk || 0) > 0 ? swing : Math.max(0, -Math.sin(phase)) * 0.35;
      drawArm(-1, true, 0);
      const bg = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.7); bg.addColorStop(0, LT); bg.addColorStop(0.55, col); bg.addColorStop(1, dk); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.32); ctx.quadraticCurveTo(-r * 0.9, -r * 0.1, -r * 0.7, r * 0.55); ctx.quadraticCurveTo(-r * 0.4, r * 0.84, 0, r * 0.8 + breathe); ctx.quadraticCurveTo(r * 0.4, r * 0.84, r * 0.7, r * 0.55); ctx.quadraticCurveTo(r * 0.9, -r * 0.1, r * 0.6, -r * 0.32); ctx.quadraticCurveTo(0, -r * 0.46, -r * 0.6, -r * 0.32); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!back) { ctx.fillStyle = this._rgba(LT, 0.5); ctx.beginPath(); ctx.ellipse(0, r * 0.42 + breathe, r * 0.32, r * 0.34, 0, 0, 7); ctx.fill(); ctx.fillStyle = this._rgba(dk, 0.85); for (const w of [[-0.3, -0.1], [0.24, 0.05], [-0.1, 0.3], [0.32, -0.15]]) { ctx.beginPath(); ctx.arc(w[0] * r, w[1] * r, r * 0.05, 0, 7); ctx.fill(); } }
      drawArm(1, false, armLift);
      ctx.save(); ctx.translate(0, -r * 0.42); ctx.fillStyle = col; ctx.strokeStyle = D; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.4, r * 0.34, 0, 0, 7); ctx.fill(); ctx.stroke();
      if (!back) { const EYE = '#ff2e2e'; ctx.fillStyle = EYE; ctx.shadowColor = EYE; ctx.shadowBlur = 7; ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.02, r * 0.06, 0, 7); ctx.arc(r * 0.15, -r * 0.02, r * 0.06, 0, 7); ctx.fill(); ctx.shadowBlur = 0; const mo = r * (0.04 + swing * 0.12); ctx.fillStyle = '#2a0f10'; ctx.beginPath(); ctx.ellipse(0, r * 0.16, r * 0.2, mo + r * 0.04, 0, 0, 7); ctx.fill(); } // v1.32 — occhi ROSSI, niente ellisse-fascia sugli occhi, niente zanne (non è un vampiro)
      ctx.restore(); ctx.restore();
    },
    // v1.32 — OCCHIO VAGANTE: bulbo oculare con eye-stalks superiori e tentacoli, aura emissiva, iride che segue e pupilla che dilata in attacco
    _eyeF(ctx, r, col, dk, eye, t, atk, back) {
      r = r * 0.8; // v1.34 — sprite ridotto del 20%
      const D = '#0a0810'; const bob = Math.sin(t * 2.2) * r * 0.08; const swing = Math.sin((atk || 0) * Math.PI); const look = Math.sin(t * 1.3) * r * 0.06;
      ctx.save(); ctx.filter = 'blur(2px)'; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, r * 1.35, r * 0.5, r * 0.14, 0, 0, 7); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(0, bob);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const ag = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.6); ag.addColorStop(0, this._rgba(eye, 0.35 + swing * 0.3)); ag.addColorStop(1, this._rgba(eye, 0)); ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0, 0, r * 1.6, 0, 7); ctx.fill(); ctx.restore();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // v1.34 — tentacoli disposti TUTT'INTORNO al bulbo (raggiera), che ondeggiano dietro l'occhio
      const NT = 11;
      for (let i = 0; i < NT; i++) {
        const a = (i / NT) * Math.PI * 2 + t * 0.12;
        const ca = Math.cos(a), sa = Math.sin(a);
        const baseR = r * 0.8, len = r * (0.62 + 0.16 * Math.sin(t * 2.3 + i * 1.7));
        const sway = Math.sin(t * 2.6 + i * 1.3) * r * 0.2;
        const px = -sa, py = ca; // perpendicolare radiale
        const bx = ca * baseR, by = sa * baseR;
        const mx = ca * (baseR + len * 0.55) + px * sway, my = sa * (baseR + len * 0.55) + py * sway;
        const tx = ca * (baseR + len) + px * sway * 0.5, ty = sa * (baseR + len) + py * sway * 0.5;
        ctx.strokeStyle = dk; ctx.lineWidth = r * (0.15 - (i % 2) * 0.03);
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(tx, ty, r * 0.06, 0, 7); ctx.fill();
        ctx.fillStyle = eye; ctx.beginPath(); ctx.arc(tx, ty, r * 0.028, 0, 7); ctx.fill();
      }
      const sg = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r * 1.05); sg.addColorStop(0, '#f0ead6'); sg.addColorStop(0.6, '#d9cdb0'); sg.addColorStop(1, '#9b8c70'); ctx.fillStyle = sg; ctx.strokeStyle = D; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, 7); ctx.fill(); ctx.stroke();
      if (!back) {
        ctx.strokeStyle = 'rgba(150,20,24,0.5)'; ctx.lineWidth = r * 0.03;
        for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86); ctx.quadraticCurveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, Math.cos(a + 0.4) * r * 0.34, Math.sin(a + 0.4) * r * 0.34); ctx.stroke(); }
        const irx = look, iry = look * 0.6; const irisR = r * 0.42 * (1 - swing * 0.18);
        const ig = ctx.createRadialGradient(irx, iry, r * 0.05, irx, iry, irisR); ig.addColorStop(0, this._shade(eye, 50)); ig.addColorStop(0.5, eye); ig.addColorStop(1, this._shade(eye, -60)); ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(irx, iry, irisR, 0, 7); ctx.fill();
        ctx.strokeStyle = this._shade(eye, -40); ctx.lineWidth = r * 0.02; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(irx + Math.cos(a) * irisR * 0.4, iry + Math.sin(a) * irisR * 0.4); ctx.lineTo(irx + Math.cos(a) * irisR * 0.92, iry + Math.sin(a) * irisR * 0.92); ctx.stroke(); }
        ctx.fillStyle = '#080308'; ctx.beginPath(); ctx.arc(irx, iry, irisR * (0.42 + swing * 0.3), 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(irx - irisR * 0.35, iry - irisR * 0.4, r * 0.08, 0, 7); ctx.fill(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(irx + irisR * 0.2, iry + irisR * 0.3, r * 0.04, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      } else { ctx.fillStyle = 'rgba(120,20,24,0.35)'; ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, 7); ctx.fill(); }
      ctx.fillStyle = col; ctx.strokeStyle = D; ctx.lineWidth = 2;
      const lid = (top) => { const s = top ? 1 : -1; ctx.beginPath(); ctx.moveTo(-r * 0.92, 0); ctx.quadraticCurveTo(0, -s * r * 1.15, r * 0.92, 0); ctx.quadraticCurveTo(0, -s * r * 0.5, -r * 0.92, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); };
      const openA = r * (0.0 - swing * 0.12);
      ctx.save(); ctx.translate(0, -r * 0.5 + openA); lid(true); ctx.restore();
      ctx.save(); ctx.translate(0, r * 0.5 - openA); lid(false); ctx.restore();
      ctx.restore();
    },
    // v1.32 — SPETTRO: cappa spettrale translucida che sfuma in code ondulate, scie/wisp emissive, artigli protesi e occhi ardenti
    _spettroF(ctx, r, col, dk, eye, t, atk, back) {
      const phase = t * 3; const bob = Math.sin(phase) * r * 0.08; const swing = Math.sin((atk || 0) * Math.PI); const drift = Math.sin(t * 1.6) * r * 0.06;
      ctx.save(); ctx.translate(drift, bob);
      const baseA = 0.62 + 0.12 * Math.sin(t * 2.2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(0, -r * 0.1, r * 0.2, 0, -r * 0.1, r * 1.5); glow.addColorStop(0, this._rgba(eye, 0.18)); glow.addColorStop(1, this._rgba(eye, 0)); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 1.5, 0, 7); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = baseA * 0.5;
      ctx.fillStyle = this._rgba(col, 0.5);
      for (let i = 0; i < 4; i++) { const a = t * 1.2 + i * 1.7; const wx = Math.cos(a) * r * 0.5, wy = -r * 0.2 + Math.sin(a) * r * 0.3; ctx.beginPath(); ctx.ellipse(wx, wy, r * 0.16, r * 0.1, a, 0, 7); ctx.fill(); }
      ctx.globalAlpha = baseA;
      const bg = ctx.createLinearGradient(0, -r * 0.9, 0, r * 1.3); bg.addColorStop(0, this._shade(col, 30)); bg.addColorStop(0.45, col); bg.addColorStop(1, this._rgba(dk, 0)); ctx.fillStyle = bg; ctx.strokeStyle = this._rgba(this._shade(col, 40), 0.5); ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.62, -r * 0.2);
      ctx.quadraticCurveTo(-r * 0.72, -r * 0.85, 0, -r * 0.9);
      ctx.quadraticCurveTo(r * 0.72, -r * 0.85, r * 0.62, -r * 0.2);
      ctx.quadraticCurveTo(r * 0.7, r * 0.4, r * 0.5, r * 0.7);
      const tails = 5; for (let i = 0; i <= tails; i++) { const xx = r * 0.5 - (r * 1.0) * (i / tails); const yy = r * 1.15 + Math.sin(i * 1.6 + phase) * r * 0.18; ctx.lineTo(xx, yy); }
      ctx.quadraticCurveTo(-r * 0.7, r * 0.4, -r * 0.62, -r * 0.2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = this._rgba(col, 0.7); ctx.lineCap = 'round'; ctx.lineWidth = r * 0.14;
      for (const sgn of [-1, 1]) { const reach = swing * r * 0.3; const sx = sgn * r * 0.45, sy = r * 0.05; const ex = sgn * (r * 0.75 + reach), ey = r * 0.2 - swing * r * 0.15; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sgn * r * 0.8, -r * 0.1, ex, ey); ctx.stroke(); ctx.strokeStyle = this._rgba(this._shade(col, 50), 0.8); ctx.lineWidth = r * 0.04; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + sgn * r * 0.12, ey + r * 0.14 + k * r * 0.06); ctx.stroke(); } ctx.strokeStyle = this._rgba(col, 0.7); ctx.lineWidth = r * 0.14; }
      const hg = ctx.createLinearGradient(0, -r * 0.9, 0, -r * 0.2); hg.addColorStop(0, this._shade(col, 40)); hg.addColorStop(1, col); ctx.fillStyle = hg; ctx.strokeStyle = this._rgba(this._shade(col, 50), 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * 0.34, -r * 0.28); ctx.quadraticCurveTo(-r * 0.4, -r * 0.82, 0, -r * 0.86); ctx.quadraticCurveTo(r * 0.4, -r * 0.82, r * 0.34, -r * 0.28); ctx.quadraticCurveTo(0, -r * 0.12, -r * 0.34, -r * 0.28); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = baseA * 0.9; ctx.fillStyle = 'rgba(6,10,16,0.7)'; ctx.beginPath(); ctx.ellipse(0, -r * 0.46, r * 0.24, r * 0.3, 0, 0, 7); ctx.fill();
      if (!back) { const eb = 0.7 + 0.3 * Math.max(swing, Math.sin(t * 4) * 0.5 + 0.5); ctx.globalAlpha = eb; ctx.fillStyle = eye; ctx.shadowColor = eye; ctx.shadowBlur = 10; ctx.beginPath(); ctx.ellipse(-r * 0.11, -r * 0.46, r * 0.05, r * 0.08, 0, 0, 7); ctx.ellipse(r * 0.11, -r * 0.46, r * 0.05, r * 0.08, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
      ctx.restore();
      ctx.globalAlpha = 1;
    },
    _shape(ctx, shape, r, col, dark, eye, t, atk) {
      atk = atk || 0; // v1.26 — 0..1 fase di attacco (0 = idle/camminata)
      const swing = Math.sin(atk * Math.PI); // 0→1→0 arco d'attacco
      ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; const D = '#0a0c12';
      const walk = Math.sin(t * 9 + (r * 1.3));
      const eyes = (ex, ey, er, c) => { ctx.fillStyle = c || eye; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 7); ctx.arc(ex, -ey, er, 0, 7); ctx.fill(); ctx.fillStyle = '#0a0c12'; ctx.beginPath(); ctx.arc(ex + er * .3, ey, er * .45, 0, 7); ctx.arc(ex + er * .3, -ey, er * .45, 0, 7); ctx.fill(); };
      const leg = (bx, by, sw, c2) => { ctx.strokeStyle = c2 || dark; ctx.lineWidth = Math.max(2.5, r * .22); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - r * .1, by + r * .55 + sw * r * .18); ctx.stroke(); };
      const limb = (x1, y1, x2, y2, w, c) => { ctx.strokeStyle = c || col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
      ctx.strokeStyle = D; ctx.lineWidth = 2;
      switch (shape) {
        case 'zombie': { // v1.26 — zombie: braccia laterali con mani, occhi neri vuoti, morso in attacco
          leg(-r * .15, r * .42, walk, dark); leg(-r * .15, -r * .42, -walk, dark);
          // corpo PRIMA, così le braccia (disegnate dopo) risultano ben staccate dai fianchi
          const bg = ctx.createLinearGradient(-r, 0, r, 0); bg.addColorStop(0, dark); bg.addColorStop(1, col); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(-r * .05, 0, r * .8, r * .66, 0, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(74,20,24,.6)'; ctx.beginPath(); ctx.ellipse(r * .05, r * .2, r * .16, r * .2, .3, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(20,26,16,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-r * .4, 0); ctx.lineTo(-r * .02, 0); ctx.stroke();
          // v1.27.1 — BRACCIA ai lati con spalla, gomito e MANO (lungo i fianchi a riposo, in avanti in attacco)
          const lp = (a, b) => a + (b - a) * swing; // riposo → attacco
          for (const sgn of [-1, 1]) {
            const sx = -r * .04, sy = sgn * r * .5;                 // spalla (staccata dal centro)
            const ex = lp(r * .02, r * .58), ey = sgn * lp(r * .82, r * .42); // gomito
            const hnx = lp(r * .18, r * 1.12), hny = sgn * lp(r * 1.0, r * .3); // mano
            ctx.strokeStyle = dark; ctx.lineCap = 'round'; ctx.lineWidth = r * .2; // spalla scura = stacco
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.strokeStyle = col; ctx.lineWidth = r * .17;                        // avambraccio
            ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hnx, hny); ctx.stroke();
            ctx.fillStyle = col; ctx.strokeStyle = D; ctx.lineWidth = 1.5;         // MANO
            ctx.beginPath(); ctx.arc(hnx, hny, r * .17, 0, 7); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = dark; ctx.lineWidth = r * .05; ctx.lineCap = 'round'; // artigli
            const cdir = swing > .1 ? 1 : 0; // a riposo puntano fuori, in attacco in avanti
            for (let k = -1; k <= 1; k++) { const ax = hnx + lp(r * .02, r * .2), ay = hny + sgn * lp(r * .2, r * .04) + k * r * .07; ctx.beginPath(); ctx.moveTo(hnx, hny); ctx.lineTo(ax, ay); ctx.stroke(); }
          }
          ctx.save(); ctx.translate(-r * .3, 0); // v1.26.1 — testa centrata sul corpo (top-down, viso visibile)
          ctx.fillStyle = col; ctx.strokeStyle = D; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r * .42, 0, r * .44, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(r * .5, r * .16, r * .12, r * .15, 0, 0, 7); ctx.ellipse(r * .5, -r * .16, r * .12, r * .15, 0, 0, 7); ctx.fill();
          ctx.fillStyle = eye; ctx.globalAlpha = .5 + .3 * Math.sin(t * 4); ctx.beginPath(); ctx.arc(r * .52, r * .16, r * .04, 0, 7); ctx.arc(r * .52, -r * .16, r * .04, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
          const jaw = r * (.05 + swing * .22); ctx.fillStyle = '#2a0d0d'; ctx.beginPath(); ctx.ellipse(r * .7, 0, r * .1, jaw + r * .03, 0, 0, 7); ctx.fill();
          ctx.restore();
          break; }
        case 'imp': {
          leg(-r * .2, r * .5, walk, dark); leg(-r * .2, -r * .5, -walk, dark);
          limb(-r * .1, -r * .2, r * .7, -r * .1 + walk * r * .12, r * .18, col);
          const bg = ctx.createLinearGradient(-r, 0, r, 0); bg.addColorStop(0, dark); bg.addColorStop(1, col); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(-r * .05, 0, r * .82, r * .72, 0, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(-r * .2, -r * .5); ctx.lineTo(-r * .9, -r * 1.15); ctx.lineTo(-r * .05, -r * .55); ctx.fill();
          ctx.beginPath(); ctx.moveTo(-r * .2, r * .5); ctx.lineTo(-r * .9, r * 1.15); ctx.lineTo(-r * .05, r * .55); ctx.fill();
          ctx.fillStyle = col; ctx.strokeStyle = D; ctx.beginPath(); ctx.arc(r * .35, 0, r * .5, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(r * .55, r * .18); ctx.lineTo(r * .62, r * .42); ctx.lineTo(r * .7, r * .18); ctx.fill();
          eyes(r * .45, r * .2, r * .13); break; }
        case 'brute': { // v1.26 — orco berserker: ascia, zanne, occhi rossi, fendente in attacco
          leg(-r * .3, r * .55, walk, dark); leg(-r * .3, -r * .55, -walk, dark);
          const axA = -0.5 + swing * 1.6; // ascia: da alzata a fendente
          ctx.save(); ctx.translate(r * .2, -r * .6); ctx.rotate(axA);
          ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = r * .14; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(0, r * .1); ctx.lineTo(r * .9, -r * .7); ctx.stroke();
          const hx = r * .9, hy = -r * .7; const mg = ctx.createLinearGradient(hx - r * .4, hy, hx + r * .4, hy); mg.addColorStop(0, '#6b6f77'); mg.addColorStop(.5, '#c2c6ce'); mg.addColorStop(1, '#5a5e66');
          ctx.fillStyle = mg; ctx.strokeStyle = D; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx, hy - r * .32); ctx.quadraticCurveTo(hx + r * .5, hy - r * .1, hx + r * .4, hy + r * .24); ctx.lineTo(hx, hy + r * .12); ctx.quadraticCurveTo(hx - r * .5, hy - r * .1, hx - r * .4, hy + r * .24); ctx.lineTo(hx, hy + r * .12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
          const bg = ctx.createLinearGradient(-r, -r, r, r); bg.addColorStop(0, dark); bg.addColorStop(1, col); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2.5;
          this._rr(ctx, -r * .75, -r * .95, r * 1.5, r * 1.9, r * .45); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = 'rgba(20,30,14,.55)'; ctx.lineWidth = r * .06; ctx.beginPath(); ctx.moveTo(-r * .5, 0); ctx.lineTo(r * .3, 0); ctx.stroke();
          ctx.fillStyle = dark; ctx.strokeStyle = D; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-r * .1, -r * .9, r * .42, 0, 7); ctx.arc(-r * .1, r * .9, r * .42, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#8a8f97'; for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-r * .3, sy * r * .9); ctx.lineTo(-r * .55, sy * r * 1.05); ctx.lineTo(-r * .05, sy * r * 1.02); ctx.closePath(); ctx.fill(); }
          const lean = swing * r * .18;
          limb(0, r * .8, r * .8 + lean, r * .5 - walk * r * .1, r * .3, col); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(r * .85 + lean, r * .5 - walk * r * .1, r * .26, 0, 7); ctx.fill(); ctx.stroke();
          ctx.save(); ctx.translate(-r * .3, 0); // v1.26.1 — testa centrata sul corpo (top-down, viso visibile)
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(r * .45 + lean, 0, r * .42, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(25,38,16,.5)'; ctx.beginPath(); ctx.ellipse(r * .4 + lean, 0, r * .42, r * .16, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#e8e2cf'; ctx.beginPath(); ctx.moveTo(r * .6 + lean, r * .15); ctx.lineTo(r * .74 + lean, r * .04); ctx.lineTo(r * .64 + lean, r * .24); ctx.fill(); ctx.beginPath(); ctx.moveTo(r * .6 + lean, -r * .15); ctx.lineTo(r * .74 + lean, -r * .04); ctx.lineTo(r * .64 + lean, -r * .24); ctx.fill();
          if (swing > .3) { ctx.fillStyle = '#2a1510'; ctx.beginPath(); ctx.ellipse(r * .66 + lean, 0, r * .1, r * .14, 0, 0, 7); ctx.fill(); }
          eyes(r * .5 + lean, r * .18, r * .12, eye); ctx.restore(); break; }
        case 'skeleton': {
          ctx.fillStyle = '#6a6f7a'; ctx.strokeStyle = D; this._rr(ctx, r * .55, -r * .55, r * .3, r * 1.1, 3); ctx.fill(); ctx.stroke();
          leg(-r * .2, r * .35, walk, '#c9c4b0'); leg(-r * .2, -r * .35, -walk, '#c9c4b0');
          ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(-r * .05, 0, r * .5, r * .62, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = '#eae6d8'; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(-r * .05, r * .3 * i, r * .34, -0.7, 0.7); ctx.stroke(); }
          ctx.fillStyle = col; ctx.strokeStyle = D; ctx.beginPath(); ctx.arc(r * .3, 0, r * .46, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#1a1c24'; ctx.beginPath(); ctx.arc(r * .38, r * .18, r * .12, 0, 7); ctx.arc(r * .38, -r * .18, r * .12, 0, 7); ctx.fill();
          ctx.fillStyle = '#39d5ff'; ctx.beginPath(); ctx.arc(r * .4, r * .18, r * .06, 0, 7); ctx.arc(r * .4, -r * .18, r * .06, 0, 7); ctx.fill();
          ctx.strokeStyle = D; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(r * .5 + i * r * .06, r * .12); ctx.lineTo(r * .5 + i * r * .06, -r * .12); ctx.stroke(); } break; }
        case 'mage': { // v1.26 — negromante: cappuccio, occhi viola, bastone con orbe che divampa in cast
          const fl = Math.sin(t * 2.4) * r * .06;
          const bg = ctx.createLinearGradient(-r, 0, r, 0); bg.addColorStop(0, dark); bg.addColorStop(1, col); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-r * 1.05, r * .5); ctx.quadraticCurveTo(-r * .2, r * .1, r * .2, r * .28 + fl); ctx.quadraticCurveTo(r * .55, 0, r * .2, -r * .28 - fl); ctx.quadraticCurveTo(-r * .2, -r * .1, -r * 1.05, -r * .5); ctx.quadraticCurveTo(-r * .7, 0, -r * 1.05, r * .5); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(120,90,200,.5)'; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(-r * 1.05, i * r * .11); ctx.lineTo(-r * 1.22, i * r * .11 + r * .05); ctx.lineTo(-r * 1.05, i * r * .11 + r * .1); ctx.fill(); }
          const orbF = 0.5 + swing * 0.9;
          ctx.strokeStyle = '#3a2b1a'; ctx.lineWidth = r * .1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r * .2, r * .5); ctx.lineTo(r * .95, -r * .5); ctx.stroke();
          const ox = r * .95, oy = -r * .5, orbR = r * .5 * (0.7 + swing * 0.8); const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, orbR); og.addColorStop(0, 'rgba(200,160,255,' + orbF + ')'); og.addColorStop(.5, 'rgba(120,70,210,.7)'); og.addColorStop(1, 'rgba(70,30,130,0)');
          ctx.fillStyle = og; ctx.beginPath(); ctx.arc(ox, oy, orbR, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(230,210,255,' + (0.85 * orbF) + ')'; ctx.beginPath(); ctx.arc(ox, oy, r * .13, 0, 7); ctx.fill();
          ctx.save(); ctx.translate(-r * .26, 0); // v1.26.1 — cappuccio centrato sul corpo (top-down, viso visibile)
          const hg = ctx.createLinearGradient(0, -r * .5, 0, r * .5); hg.addColorStop(0, col); hg.addColorStop(1, dark); ctx.fillStyle = hg; ctx.strokeStyle = D; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-r * .1, -r * .5); ctx.quadraticCurveTo(r * .7, -r * .3, r * .72, 0); ctx.quadraticCurveTo(r * .7, r * .3, -r * .1, r * .5); ctx.quadraticCurveTo(-r * .2, 0, -r * .1, -r * .5); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#05040a'; ctx.beginPath(); ctx.ellipse(r * .36, 0, r * .28, r * .3, 0, 0, 7); ctx.fill();
          const eb = 0.6 + 0.4 * Math.max(swing, Math.sin(t * 6) * 0.5 + 0.5); ctx.fillStyle = eye; ctx.shadowColor = eye; ctx.shadowBlur = 8; ctx.globalAlpha = eb;
          ctx.beginPath(); ctx.ellipse(r * .42, r * .1, r * .06, r * .09, 0, 0, 7); ctx.ellipse(r * .42, -r * .1, r * .06, r * .09, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
          ctx.restore();
          break; }
        case 'lich': {
          const fl = Math.sin(t * 3) * r * .08;
          const bg = ctx.createLinearGradient(0, -r, 0, r * 1.4); bg.addColorStop(0, col); bg.addColorStop(1, dark); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-r * .9, r * 1.2 + fl); ctx.quadraticCurveTo(-r * .2, -r * .2, 0, -r * 1.35 + fl); ctx.quadraticCurveTo(r * .2, -r * .2, r * .9, r * 1.2 + fl);
          ctx.quadraticCurveTo(0, r * .9 + fl, -r * .9, r * 1.2 + fl); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#05060a'; ctx.beginPath(); ctx.arc(0, -r * .35 + fl, r * .42, 0, 7); ctx.fill();
          ctx.fillStyle = eye; ctx.shadowColor = eye; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(r * .14, -r * .4 + fl, r * .1, 0, 7); ctx.arc(-r * .14, -r * .4 + fl, r * .1, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = eye; ctx.globalAlpha = 0.45 + 0.3 * Math.sin(t * 6); ctx.beginPath(); ctx.arc(r * .8, r * .25 + fl, r * .26, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
          ctx.strokeStyle = eye; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(r * .8, r * .25 + fl, r * .26, 0, 7); ctx.stroke(); break; }
        case 'mimic': {
          leg(-r * .5, r * .5, walk, dark); leg(-r * .5, -r * .5, -walk, dark); leg(r * .3, r * .5, -walk, dark); leg(r * .3, -r * .5, walk, dark);
          const bg = ctx.createLinearGradient(0, -r, 0, r); bg.addColorStop(0, col); bg.addColorStop(1, dark); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2.5;
          this._rr(ctx, -r * .95, -r * .2, r * 1.9, r * .95, 4); ctx.fill(); ctx.stroke();
          ctx.save(); ctx.translate(-r * .95, -r * .2); ctx.rotate(-0.5); ctx.fillStyle = dark; this._rr(ctx, 0, -r * .5, r * 1.9, r * .55, 4); ctx.fill(); ctx.stroke(); ctx.restore();
          ctx.fillStyle = '#c9a94a'; ctx.fillRect(-r * .95, r * .05, r * 1.9, r * .16);
          ctx.fillStyle = '#3a0d12'; this._rr(ctx, -r * .8, -r * .12, r * 1.6, r * .34, 2); ctx.fill();
          ctx.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * r * .24, -r * .12); ctx.lineTo(i * r * .24 + r * .1, r * .1); ctx.lineTo(i * r * .24 + r * .2, -r * .12); ctx.fill(); ctx.beginPath(); ctx.moveTo(i * r * .24, r * .22); ctx.lineTo(i * r * .24 + r * .1, r * .02); ctx.lineTo(i * r * .24 + r * .2, r * .22); ctx.fill(); }
          ctx.fillStyle = '#e0506a'; ctx.beginPath(); ctx.ellipse(0, r * .16, r * .28, r * .12, 0, 0, 7); ctx.fill();
          eyes(-r * .3, r * .5, r * .12, '#ff3b3b'); break; }
        case 'troll': {
          leg(-r * .2, r * .55, walk, dark); leg(-r * .2, -r * .55, -walk, dark);
          const bg = ctx.createLinearGradient(-r, -r, r, r); bg.addColorStop(0, col); bg.addColorStop(1, dark); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.ellipse(0, 0, r * .95, r * 1.02, 0, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(-r * .35, -r * .45, r * .4, 0, 7); ctx.fill();
          limb(r * .1, r * .3, r * 1.0, r * .8 - walk * r * .12, r * .38, col); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(r * 1.05, r * .8 - walk * r * .12, r * .32, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(r * .5, -r * .25, r * .32, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(r * .58, -r * .05); ctx.lineTo(r * .6, r * .2); ctx.lineTo(r * .7, -r * .05); ctx.fill();
          eyes(r * .55, r * .12, r * .12, eye); break; }
        case 'assassin': { // v1.28.1 — assassino ombra: mantello a freccia, doppie lame, occhi magenta, scia di fumo
          // scia di fumo/ombra dietro
          ctx.fillStyle = 'rgba(40,30,60,.5)';
          for (let i = 0; i < 5; i++) { const a = Math.PI + (i - 2) * 0.18; const dd = r * (0.9 + i * 0.12); ctx.globalAlpha = 0.26 - i * 0.04; ctx.beginPath(); ctx.ellipse(Math.cos(a) * dd, Math.sin(a) * dd, r * .3, r * .2, a, 0, 7); ctx.fill(); }
          ctx.globalAlpha = 1;
          leg(-r * .1, r * .38, walk, dark); leg(-r * .1, -r * .38, -walk, dark);
          // mantello appuntito (freccia verso il fronte)
          const bg = ctx.createLinearGradient(-r, 0, r, 0); bg.addColorStop(0, dark); bg.addColorStop(1, col); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(r * .85, 0); ctx.quadraticCurveTo(r * .1, -r * .7, -r * .7, -r * .55); ctx.quadraticCurveTo(-r * 1.0, 0, -r * .7, r * .55); ctx.quadraticCurveTo(r * .1, r * .7, r * .85, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
          // DUE LAME (ai lati a riposo, incrociate avanti in attacco)
          for (const sgn of [-1, 1]) { const bx = r * .2, by = sgn * r * .42; const tx = bx + (r * .5 + swing * r * .6), ty = sgn * (r * .5 - swing * r * .42); ctx.strokeStyle = '#c9ccd6'; ctx.lineCap = 'round'; ctx.lineWidth = r * .09; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke(); ctx.fillStyle = '#e8ebf2'; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - r * .1, ty - sgn * r * .05); ctx.lineTo(tx + r * .12, ty + sgn * r * .02); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2a2030'; ctx.beginPath(); ctx.arc(bx, by, r * .06, 0, 7); ctx.fill(); }
          // cappuccio a punta
          ctx.fillStyle = col; ctx.strokeStyle = D; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * .35, 0); ctx.quadraticCurveTo(-r * .1, -r * .34, r * .5, -r * .24); ctx.quadraticCurveTo(r * .66, 0, r * .5, r * .24); ctx.quadraticCurveTo(-r * .1, r * .34, -r * .35, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
          // viso in ombra + occhi magenta affilati
          ctx.fillStyle = '#050308'; ctx.beginPath(); ctx.ellipse(r * .24, 0, r * .2, r * .22, 0, 0, 7); ctx.fill();
          const eba = 0.6 + 0.4 * Math.max(swing, Math.sin(t * 7) * .5 + .5); ctx.fillStyle = eye; ctx.shadowColor = eye; ctx.shadowBlur = 8; ctx.globalAlpha = eba;
          ctx.beginPath(); ctx.moveTo(r * .3, r * .02); ctx.lineTo(r * .4, r * .12); ctx.lineTo(r * .42, r * .06); ctx.closePath(); ctx.moveTo(r * .3, -r * .02); ctx.lineTo(r * .4, -r * .12); ctx.lineTo(r * .42, -r * .06); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 1; ctx.shadowBlur = 0; break; }
        case 'wyvern': {
          const wf = walk;
          ctx.fillStyle = dark; ctx.strokeStyle = D; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-r * .1, -r * .2); ctx.lineTo(-r * 1.2, -r * (1.0 + wf * .4)); ctx.lineTo(-r * .2, -r * .5); ctx.lineTo(-r * .9, -r * .3); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-r * .1, r * .2); ctx.lineTo(-r * 1.2, r * (1.0 + wf * .4)); ctx.lineTo(-r * .2, r * .5); ctx.lineTo(-r * .9, r * .3); ctx.closePath(); ctx.fill(); ctx.stroke();
          const bg = ctx.createLinearGradient(-r, 0, r, 0); bg.addColorStop(0, dark); bg.addColorStop(1, col); ctx.fillStyle = bg;
          ctx.beginPath(); ctx.moveTo(r * 1.05, 0); ctx.quadraticCurveTo(r * .2, -r * .62, -r * .5, -r * .28); ctx.quadraticCurveTo(-r * .9, 0, -r * .5, r * .28); ctx.quadraticCurveTo(r * .2, r * .62, r * 1.05, 0); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#e8e0cf'; ctx.lineWidth = r * .1; ctx.beginPath(); ctx.moveTo(r * .8, -r * .12); ctx.lineTo(r * 1.05, -r * .5); ctx.stroke();
          eyes(r * .7, r * .14, r * .1, eye); break; }
        case 'dragon': {
          const wf = Math.sin(t * 3) * 0.35;
          ctx.fillStyle = dark; ctx.strokeStyle = D; ctx.lineWidth = 2.5;
          for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-r * .1, sgn * r * .25); ctx.lineTo(-r * 1.5, sgn * r * (1.35 + wf)); ctx.lineTo(-r * .5, sgn * r * .55); ctx.lineTo(-r * 1.1, sgn * r * .5); ctx.lineTo(-r * .1, sgn * r * .7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
          ctx.strokeStyle = col; ctx.lineWidth = r * .3; ctx.beginPath(); ctx.moveTo(-r * .5, 0); ctx.quadraticCurveTo(-r * 1.2, r * .2 * Math.sin(t * 2), -r * 1.5, 0); ctx.stroke();
          const bg = ctx.createLinearGradient(0, -r, 0, r); bg.addColorStop(0, col); bg.addColorStop(1, dark); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.ellipse(0, 0, r * .95, r * .8, 0, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(r * .5, -r * .3); ctx.lineTo(r * 1.25, -r * .15); ctx.lineTo(r * 1.25, r * .15); ctx.lineTo(r * .5, r * .3); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(r * 1.2, 0, r * .34, 0, 7); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#e8e0cf'; ctx.lineWidth = r * .12; ctx.beginPath(); ctx.moveTo(r * 1.15, -r * .28); ctx.lineTo(r * 1.4, -r * .62); ctx.moveTo(r * 1.28, -r * .2); ctx.lineTo(r * 1.55, -r * .42); ctx.stroke();
          ctx.fillStyle = eye; ctx.shadowColor = eye; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(r * 1.28, -r * .05, r * .1, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
          if (Math.random() < 0.3) this.particles.push({ x: r * 1.5, y: 0, vx: 40, vy: 0, life: 0.6, t: 0, fire: true, r: 3, over: true }); break; }
        default: { const bg = ctx.createLinearGradient(-r, -r, r, r); bg.addColorStop(0, dark); bg.addColorStop(1, col); ctx.fillStyle = bg; ctx.strokeStyle = D; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.stroke(); eyes(r * .3, r * .3, r * .15); }
      }
    },
    // ===================== v1.64 — CACHE DEI GRADIENTI =====================
    // Misurato con 80 mostri in campo: il renderer creava 558 gradienti OGNI frame (33.500 al secondo),
    // quasi tutti identici a quelli del frame prima. Il frame mediano stava benissimo (6,5ms) ma il peggiore
    // arrivava a 39,7ms: non lentezza, SINGHIOZZO — ed e' la firma del garbage collector, non del disegno.
    // Un CanvasGradient e' un oggetto riusabile e le sue coordinate stanno nello SPAZIO UTENTE: basta
    // costruirlo attorno all'ORIGINE e disegnarlo col contesto gia' traslato sull'entita'. Quello che
    // cambia a ogni frame (il pulsare) si ottiene con globalAlpha, che non alloca niente.
    _grad(key, make) {
      const c = this._gcache || (this._gcache = new Map());
      let g = c.get(key);
      if (g === undefined) { g = make(); if (c.size > 512) c.clear(); c.set(key, g); }
      return g;
    },
    _rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); },
  };
  window.Renderer = R;
})();
