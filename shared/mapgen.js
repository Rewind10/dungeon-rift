/* mapgen.js — generazione procedurale con TEMI (server) */
(function (root, factory) {
  const m = factory(
    (typeof module !== 'undefined' && module.exports) ? require('./constants.js') : root.GAME.Constants,
    (typeof module !== 'undefined' && module.exports) ? require('./mathutils.js') : root.GAME.Math
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.MapGen = m; }
})(typeof self !== 'undefined' ? self : this, function (C, MU) {
  'use strict';
  const W = C.MAP_W, H = C.MAP_H;
  function idx(x, y) { return y * W + x; }
  const THEMES = [
    { id: 'crypt', name: 'Cripta Dimenticata', floorA: '#12161f', floorB: '#151a26', wall: '#1b2036', wallTop: '#262d4a', hazard: '#ff5a1e', accent: '#8be9ff', blobMul: 1.0, hazMul: 1.0, propMix: ['bones', 'skull', 'coffin', 'tomb', 'corpse', 'chain', 'rock', 'rockSmall', 'web', 'skull', 'bones'], tint: 'rgba(40,60,45,.22)' },
    { id: 'lava', name: 'Caverne di Lava', floorA: '#1c1413', floorB: '#241615', wall: '#2a1a16', wallTop: '#4a2a1e', hazard: '#ff7a1e', accent: '#ffb020', blobMul: 0.85, hazMul: 1.9, propMix: ['rock', 'rockSmall', 'bones', 'skull', 'chain', 'corpse', 'crystal', 'rock', 'skull'], tint: 'rgba(90,40,20,.24)' },
    { id: 'forest', name: 'Rovine nella Foresta', floorA: '#121a14', floorB: '#16221a', wall: '#1c2a1e', wallTop: '#2a3d2c', hazard: '#5adf5a', accent: '#8bff9a', blobMul: 1.15, hazMul: 1.1, propMix: ['rock', 'rockSmall', 'mushroom', 'bones', 'corpse', 'coffin', 'web', 'web', 'skull'], tint: 'rgba(30,70,40,.26)' },
    { id: 'ice', name: 'Cripta di Ghiaccio', floorA: '#121a22', floorB: '#16222e', wall: '#1c2a3a', wallTop: '#2a3d52', hazard: '#7de0ff', accent: '#a8f0ff', blobMul: 1.05, hazMul: 0.9, propMix: ['rock', 'rockSmall', 'crystal', 'bones', 'skull', 'coffin', 'web', 'corpse'], tint: 'rgba(40,70,95,.22)' },
    { id: 'arcane', name: 'Tempio Arcano', floorA: '#181322', floorB: '#1e1830', wall: '#2a1e3a', wallTop: '#3d2c52', hazard: '#c56bff', accent: '#d59bff', blobMul: 1.0, hazMul: 1.2, propMix: ['skull', 'bones', 'crystal', 'coffin', 'chain', 'corpse', 'web'], tint: 'rgba(70,40,95,.24)' },
  ];
  function stampBlob(g, cx, cy, rw, rh, v) { for (let y = cy - rh; y <= cy + rh; y++) for (let x = cx - rw; x <= cx + rw; x++) { if (x <= 1 || y <= 1 || x >= W - 2 || y >= H - 2) continue; g[idx(x, y)] = v; } }
  function areaFree(g, cx, cy, rw, rh, pad) { for (let y = cy - rh - pad; y <= cy + rh + pad; y++) for (let x = cx - rw - pad; x <= cx + rw + pad; x++) { if (x < 0 || y < 0 || x >= W || y >= H) return false; if (g[idx(x, y)] !== C.T_FLOOR) return false; } return true; }
  function floodReach(g) { const seen = new Uint8Array(W * H); const sx = W >> 1, sy = H >> 1; const st = [[sx, sy]]; seen[idx(sx, sy)] = 1; let c = 0; while (st.length) { const [x, y] = st.pop(); c++; const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]; for (const [nx, ny] of nb) { if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const i = idx(nx, ny); if (seen[i] || g[i] === C.T_WALL) continue; seen[i] = 1; st.push([nx, ny]); } } return { seen, count: c }; }
  // v1.28 — allarga i "colli di bottiglia": ogni corridoio deve essere >= 3 tile (144px) per far passare i boss (mega dragon r=52)
  function widenForBoss(g) {
    for (let pass = 0; pass < 4; pass++) {
      const kill = [];
      for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
        if (g[idx(x, y)] !== C.T_FLOOR) continue;
        let l = 0; while (g[idx(x - 1 - l, y)] === C.T_FLOOR) l++;
        let r = 0; while (g[idx(x + 1 + r, y)] === C.T_FLOOR) r++;
        const hRun = l + r + 1;
        let u = 0; while (g[idx(x, y - 1 - u)] === C.T_FLOOR) u++;
        let d = 0; while (g[idx(x, y + 1 + d)] === C.T_FLOOR) d++;
        const vRun = u + d + 1;
        // corridoio stretto in orizzontale (ma sviluppato in verticale) → allarga di 1 tile sul lato con muro
        if (hRun < 3 && vRun >= 3) { if (g[idx(x - 1, y)] === C.T_WALL && x - 1 > 1) kill.push(idx(x - 1, y)); else if (g[idx(x + 1, y)] === C.T_WALL && x + 1 < W - 2) kill.push(idx(x + 1, y)); }
        if (vRun < 3 && hRun >= 3) { if (g[idx(x, y - 1)] === C.T_WALL && y - 1 > 1) kill.push(idx(x, y - 1)); else if (g[idx(x, y + 1)] === C.T_WALL && y + 1 < H - 2) kill.push(idx(x, y + 1)); }
      }
      if (!kill.length) break;
      for (const i of kill) g[i] = C.T_FLOOR;
    }
  }
  function generate(seed, level) {
    const rng = MU.seedRng(seed >>> 0); const rint = (a, b) => Math.floor(a + rng() * (b - a + 1));
    const theme = THEMES[Math.floor(rng() * THEMES.length)];
    const TILE = C.TILE, cxm = W >> 1, cym = H >> 1;
    // v1.22 — CONFORMAZIONE ORGANICA (caverna varia, non "piatta"): blob di muro + connettivita garantita
    const grid = new Uint8Array(W * H).fill(C.T_FLOOR);
    for (let x = 0; x < W; x++) { grid[idx(x, 0)] = C.T_WALL; grid[idx(x, 1)] = C.T_WALL; grid[idx(x, H - 1)] = C.T_WALL; grid[idx(x, H - 2)] = C.T_WALL; }
    for (let y = 0; y < H; y++) { grid[idx(0, y)] = C.T_WALL; grid[idx(1, y)] = C.T_WALL; grid[idx(W - 1, y)] = C.T_WALL; grid[idx(W - 2, y)] = C.T_WALL; }
    // ⚠️ v1.62 — theme.blobMul RESTA SCOLLEGATO, e non per dimenticanza: e' stato provato e MISURATO,
    // e collegarlo non cambia niente. Vale la pena scrivere perche', perche' e' la stessa ragione per cui
    // tutte le mappe si somigliano.
    //   1) La posa satura. `areaFree` pretende 2 tessere di pavimento libero attorno a ogni masso: la mappa
    //      esaurisce i posti legali a ~15 blob e i 700 tentativi finiscono sempre. Chiederne 20 o 38 e'
    //      identico. Quindi dalla v1.22 blobCount e' di fatto una COSTANTE — e anche il termine sul livello
    //      non fa nulla: la mappa dell'ondata 20 ha la stessa roccia di quella dell'ondata 1.
    //   2) Anche forzando la posa (pad 1 -> 26 massi, 769 tessere di muro contro 611), `widenForBoss`
    //      RIPORTA TUTTO INDIETRO: misurato su 60 mappe, pad 1 -> 513 muri finali, pad 2 -> 536, pad 3 -> 513.
    //      Non e' un correttore di corridoi, e' un REGOLATORE DI DENSITA': cancella qualunque mappa piu'
    //      chiusa di "campo aperto con pilastri", che e' esattamente l'unica pianta che il gioco produce.
    // Morale: la varieta' di pianta non si ottiene da qui. Va rifatto `widenForBoss` (garantire il passaggio
    // dei boss lungo un percorso, non ovunque), e quello e' il lavoro degli ARCHETIPI DI PIANTA, non di qui.
    const blobCount = Math.round(14 + Math.min(12, Math.floor(level * 0.7)) + rint(0, 6)); let placed = 0, tries = 0;
    while (placed < blobCount && tries < 700) { tries++; const rw = rint(1, 3), rh = rint(1, 3); const cx = rint(4, W - 5), cy = rint(4, H - 5); if (Math.abs(cx - cxm) < 6 && Math.abs(cy - cym) < 6) continue; if (!areaFree(grid, cx, cy, rw, rh, 2)) continue; stampBlob(grid, cx, cy, rw, rh, C.T_WALL); placed++; }
    // connettivita: apri i muri che separano zone raggiungibili, poi mura le sacche isolate
    let { seen, count } = floodReach(grid); let ft = 0; for (let i = 0; i < grid.length; i++) if (grid[i] !== C.T_WALL) ft++; let gd = 0;
    while (count < ft * 0.985 && gd < 40) { gd++; for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { const i = idx(x, y); if (grid[i] !== C.T_WALL || seen[i]) continue; const ar = [idx(x + 1, y), idx(x - 1, y), idx(x, y + 1), idx(x, y - 1)]; let ts = false, tf = false; for (const a of ar) { if (seen[a]) ts = true; if (grid[a] !== C.T_WALL) tf = true; } if (ts && tf) grid[i] = C.T_FLOOR; } const r = floodReach(grid); seen = r.seen; count = r.count; ft = 0; for (let k = 0; k < grid.length; k++) if (grid[k] !== C.T_WALL) ft++; }
    ({ seen } = floodReach(grid)); for (let i = 0; i < grid.length; i++) if (grid[i] !== C.T_WALL && !seen[i]) grid[i] = C.T_WALL;
    widenForBoss(grid); // v1.28 — garantisce corridoi >= 3 tile per il passaggio dei boss
    ({ seen } = floodReach(grid)); for (let i = 0; i < grid.length; i++) if (grid[i] !== C.T_WALL && !seen[i]) grid[i] = C.T_WALL;
    const free = []; for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { const i = idx(x, y); if (grid[i] === C.T_FLOOR && seen[i]) free.push({ x, y, i, cd: 0 }); }
    const isW = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? true : grid[idx(x, y)] === C.T_WALL;
    const nearWall = (c) => isW(c.x - 1, c.y) || isW(c.x + 1, c.y) || isW(c.x, c.y - 1) || isW(c.x, c.y + 1);
    const wcx = (c) => c.x * TILE + TILE / 2, wcy = (c) => c.y * TILE + TILE / 2;

    // v1.62 — PARTENZA VARIABILE. Prima lo spawn era il centro ESATTO della mappa e l'uscita LA cella piu'
    // lontana: due costanti, quindi il percorso mentale era identico a ogni partita. Ora la partenza e' una
    // radura vicina al centro scelta col seed (serve spazio libero: i giocatori nascono sparpagliati su
    // +-40px), e TUTTE le distanze a valle — decorazioni, bracieri, casse, spawn dei nemici — si misurano
    // da li' invece che dal centro geometrico. E' un cambio di significato, non solo di numero: "lontano
    // dallo spawn" e "lontano dal centro" coincidevano solo perche' lo spawn ERA il centro.
    // La radura non basta che sia libera: deve essere AMPIA quanto lo era il centro. Il centro geometrico
    // era di fatto sgombro perche i blob di roccia lo evitano (|dx|,|dy| < 6), e mezzo gioco lo dava per
    // scontato: nemici generati a 200-260px dal giocatore con linea di vista libera. Quindi qui si misura
    // il raggio libero di ogni candidata e si sceglie solo fra le PIU AMPIE.
    let start = null;
    { const cand = free.filter(c => Math.hypot(c.x - cxm, c.y - cym) <= 7);
      let bestR = 0; const scored = [];
      for (const c of cand) { let r = 0; while (r < 6 && areaFree(grid, c.x, c.y, r + 1, r + 1, 0)) r++; if (r >= 2) { scored.push({ c, r }); if (r > bestR) bestR = r; } }
      const top = scored.filter(o => o.r >= bestR);
      if (top.length) start = top[(rng() * top.length) | 0].c; }
    if (!start) start = free.find(c => c.x === cxm && c.y === cym) || free[0] || { x: cxm, y: cym, i: idx(cxm, cym) };
    for (const c of free) c.cd = Math.hypot(c.x - start.x, c.y - start.y);

    // v1.62 — USCITA VARIABILE: non piu' LA cella piu' lontana ma una a caso fra il 20% piu' lontano.
    // La traversata da fare resta la stessa, ma non finisce piu' sempre nello stesso angolo.
    let exit = null;
    { const far = free.filter(c => grid[c.i] === C.T_FLOOR).sort((a, b) => b.cd - a.cd);
      const pick = far.slice(0, Math.max(1, Math.floor(far.length * 0.2)));
      if (pick.length) exit = pick[(rng() * pick.length) | 0]; }
    if (exit) grid[exit.i] = C.T_EXIT;

    // ===== v1.62 — POZZE DI PERICOLO (T_HAZARD) =====
    // Il tile esisteva gia' DA CIMA A FONDO e non lo generava nessuno: il server toglie 6 PV ogni 0.25s ai
    // giocatori e 8 ai mostri, il renderer scava la conca, versa il liquido, ci mette riflesso e profondita',
    // accende una luce del colore del tema e lo disegna sulla minimappa. Mancava solo chi lo mettesse.
    // La quantita' la decide theme.hazMul (lava 1.9, arcano 1.2, foresta 1.1, cripta 1.0, ghiaccio 0.9),
    // l'altro parametro che era dichiarato e moltiplicava il nulla.
    //
    // REGOLA DI SICUREZZA: una pozza puo' nascere solo dove il 3x3 attorno NON tocca muro. Cosi' una pozza
    // non puo' MAI tappare un corridoio: in un corridoio da 3 tessere solo la corsia centrale e' ammessa e
    // le due laterali restano libere. Si deve sempre poter girare intorno invece di dover incassare danno.
    const hazCells = [];
    { const openSpot = (c) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const t = grid[idx(c.x + dx, c.y + dy)];
          if (t === C.T_WALL || t === C.T_EXIT) return false;
        }
        return true;
      };
      const pools = Math.max(0, Math.round((1.6 + Math.min(2.4, level * 0.16)) * (theme.hazMul || 1)));
      let spots = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > 7 && openSpot(c));
      for (let z = spots.length - 1; z > 0; z--) { const j = (rng() * (z + 1)) | 0; const t = spots[z]; spots[z] = spots[j]; spots[j] = t; }
      const centers = [];
      for (const c of spots) {
        if (centers.length >= pools) break;
        if (!centers.every(u => Math.hypot(u.x - c.x, u.y - c.y) > 7)) continue;
        centers.push(c);
        // la pozza cresce come una passeggiata casuale: forma organica, mai un rettangolo
        let cur = c; const steps = 3 + rint(0, 5);
        for (let k = 0; k < steps; k++) {
          // la passeggiata puo tornare verso il centro: il vincolo di distanza dalla partenza va
          // ricontrollato a OGNI passo, non solo sul punto di partenza della pozza.
          if (grid[cur.i] === C.T_FLOOR && openSpot(cur) && Math.hypot(cur.x - start.x, cur.y - start.y) > 7) { grid[cur.i] = C.T_HAZARD; hazCells.push(cur.i); }
          const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][(rng() * 4) | 0];
          const nx = cur.x + d[0], ny = cur.y + d[1];
          if (nx < 2 || ny < 2 || nx >= W - 2 || ny >= H - 2) break;
          const ni = idx(nx, ny);
          if (grid[ni] !== C.T_FLOOR) break;
          cur = { x: nx, y: ny, i: ni };
        }
      }
    }

    // ===== DECORAZIONI a CLUSTER coerenti, LIMITATE (max 3-4 per tipo; le TORCE fanno eccezione) =====
    const props = []; const pcnt = {}; const CAP = 4;
    const putW = (type, wx, wy, s) => { if (type !== 'torch') { if ((pcnt[type] || 0) >= CAP) return false; pcnt[type] = (pcnt[type] || 0) + 1; } props.push({ type, x: wx, y: wy, s: s || MU.rand(0.9, 1.15), r: rng() }); return true; };
    const putC = (type, c, dx, dy, s) => putW(type, wcx(c) + (dx || 0), wcy(c) + (dy || 0), s);
    // candidate: nicchie (nearWall) lontane dallo spawn, ben distanziate fra loro
    let cand = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > 6 && nearWall(c));
    for (let z = cand.length - 1; z > 0; z--) { const j = (rng() * (z + 1)) | 0; const t = cand[z]; cand[z] = cand[j]; cand[j] = t; }
    const used = []; const takeSpot = (minDist) => { for (let k = 0; k < cand.length; k++) { const c = cand[k]; if (used.every(u => Math.hypot(u.x - c.x, u.y - c.y) >= minDist)) { used.push(c); cand.splice(k, 1); return c; } } return null; };
    // feature builders (cluster tematici coerenti)
    const feats = {
      cimitero(c) { const n = 2 + rint(0, 1); for (let j = 0; j < n; j++) putC('tomb', c, (j - (n - 1) / 2) * 34, MU.rand(-4, 4), MU.rand(1.0, 1.2)); putC('web', c, MU.rand(-24, 24), -22, MU.rand(1.0, 1.3)); if (rng() < 0.6) putC('web', c, MU.rand(-24, 24), 22, 1.1); if (rng() < 0.5) putC('coffin', c, MU.rand(-20, 20), 30, 1); },
      ossario(c) { putC('camp', c, 0, 0, MU.rand(1.0, 1.2)); const n = 2 + rint(0, 1); for (let j = 0; j < n; j++) { const a = rng() * 6.28, dd = 30 + rng() * 34; putC((rng() < 0.5 ? 'bones' : 'skull'), c, Math.cos(a) * dd, Math.sin(a) * dd, MU.rand(0.9, 1.2)); } if (rng() < 0.6) putC('corpse', c, MU.rand(-24, 24), 26, 1.05); },
      deposito(c) { putC('cratebox', c, -16, -2, 1); putC('barrel', c, 14, -8, 1); putC('sack', c, -2, 16, 1); putC('chest', c, 20, 12, 1.1); if (rng() < 0.5) putC('barrel', c, -22, 14, 0.95); },
      fungaia(c) { const n = 3 + rint(0, 1); for (let j = 0; j < n; j++) { const a = rng() * 6.28, dd = rng() * 40; putC('mushroom', c, Math.cos(a) * dd, Math.sin(a) * dd, MU.rand(0.85, 1.25)); } },
      gabbia(c) { putC('cage', c, 0, -6, MU.rand(1.05, 1.25)); putC('chain', c, -18, 6, 1); if (rng() < 0.6) putC('chain', c, 18, 2, 1); putC('skull', c, MU.rand(-10, 10), 16, 1); },
      // v1.23 — nuove zone tematiche (primo lotto di 6 oggetti)
      stalagmiti(c) { const n = 3 + rint(0, 1); for (let j = 0; j < n; j++) { const a = rng() * 6.28, dd = rng() * 38; putC('stalagmite', c, Math.cos(a) * dd, Math.sin(a) * dd, MU.rand(0.9, 1.3)); } },
      catacomba(c) { putC('skullpile', c, 0, 0, MU.rand(1.05, 1.3)); if (rng() < 0.6) putC('bones', c, MU.rand(-26, 26), 22, 1); if (rng() < 0.5) putC('skull', c, MU.rand(-22, 22), -20, 1); },
      macerie(c) { const n = 2 + rint(0, 1); for (let j = 0; j < n; j++) putC('rubble', c, (j - (n - 1) / 2) * 32, MU.rand(-6, 6), MU.rand(1.0, 1.25)); if (rng() < 0.6) putC('rock', c, MU.rand(-24, 24), 20, 1); },
      ragnatela(c) { putC('bigweb', c, MU.rand(-6, 6), MU.rand(-8, 2), MU.rand(1.0, 1.3)); if (rng() < 0.7) putC('web', c, MU.rand(-24, 24), 22, 1.1); putC('skull', c, MU.rand(-14, 14), 16, 0.9); },
      cristalli(c) { putC('crystal_cluster', c, 0, 0, MU.rand(1.0, 1.3)); if (rng() < 0.6) putC('crystal', c, MU.rand(-26, 26), 8, MU.rand(0.9, 1.1)); },
      altare(c) { putC('altar', c, 0, 0, MU.rand(1.0, 1.2)); if (rng() < 0.6) putC('skull', c, -22, 12, 1); if (rng() < 0.6) putC('skull', c, 22, 12, 1); },
      // v1.24 — secondo lotto di 6 oggetti
      rovine(c) { putC('arch', c, 0, 0, MU.rand(1.0, 1.2)); if (rng() < 0.6) putC('rubble', c, MU.rand(-24, 24), 22, 1); if (rng() < 0.5) putC('bloodstain', c, MU.rand(-20, 20), 18, MU.rand(0.7, 1.1)); },
      grotta(c) { const n = 3 + rint(0, 1); for (let j = 0; j < n; j++) { const a = rng() * 6.28, dd = rng() * 40; putC('stalactite', c, Math.cos(a) * dd, Math.sin(a) * dd - 8, MU.rand(0.85, 1.25)); } if (rng() < 0.6) putC('stalagmite', c, MU.rand(-20, 20), 16, 1); },
      patibolo(c) { putC('gallows', c, 0, -4, MU.rand(1.05, 1.25)); if (rng() < 0.7) putC('bloodstain', c, MU.rand(-14, 14), 20, MU.rand(0.8, 1.2)); if (rng() < 0.5) putC('bones', c, MU.rand(-18, 18), 24, 1); },
      santuario(c) { putC('obelisk', c, 0, 0, MU.rand(1.0, 1.2)); if (rng() < 0.6) putC('crystal', c, -22, 10, 1); if (rng() < 0.6) putC('crystal', c, 22, 10, 1); },
      illuminata(c) { const n = 2 + rint(0, 1); for (let j = 0; j < n; j++) putC('hanging_lantern', c, (j - (n - 1) / 2) * 34, MU.rand(-8, 4), MU.rand(1.0, 1.2)); },
      massacro(c) { const n = 2 + rint(0, 1); for (let j = 0; j < n; j++) { const a = rng() * 6.28, dd = rng() * 32; putC('bloodstain', c, Math.cos(a) * dd, Math.sin(a) * dd, MU.rand(0.8, 1.3)); } if (rng() < 0.7) putC('corpse', c, MU.rand(-16, 16), 4, 1.05); if (rng() < 0.5) putC('skull', c, MU.rand(-20, 20), -14, 1); },
      // v1.25 — terzo lotto di 6 oggetti
      passaggio(c) { putC('bridge', c, 0, 0, MU.rand(1.0, 1.2)); if (rng() < 0.5) putC('rock', c, MU.rand(-30, 30), 24, 1); },
      discesa(c) { putC('spiral_stairs', c, 0, 0, MU.rand(1.0, 1.25)); if (rng() < 0.5) putC('rubble', c, MU.rand(-26, 26), 20, 0.9); if (rng() < 0.4) putC('bones', c, MU.rand(-18, 18), -18, 1); },
      cisterna(c) { putC('well', c, 0, 0, MU.rand(1.0, 1.2)); if (rng() < 0.6) putC('barrel', c, -24, 10, 0.95); if (rng() < 0.5) putC('sack', c, 22, 12, 0.95); },
      officina(c) { const n = 1 + rint(0, 1); for (let j = 0; j < n; j++) putC('grate', c, (j - (n - 1) / 2) * 40, MU.rand(-6, 6), MU.rand(1.0, 1.2)); if (rng() < 0.6) putC('rubble', c, MU.rand(-24, 24), 22, 1); },
      geode(c) { putC('giant_crystal', c, 0, 2, MU.rand(1.0, 1.25)); const n = 1 + rint(0, 1); for (let j = 0; j < n; j++) putC('crystal', c, (j ? 26 : -26), 12, MU.rand(0.9, 1.1)); },
      reliquiario(c) { putC('gem_statue', c, 0, 0, MU.rand(1.05, 1.25)); if (rng() < 0.6) putC('candelabra', c, -24, 8, 1); if (rng() < 0.6) putC('candelabra', c, 24, 8, 1); },
    };
    // v1.23 — bag di feature per TEMA (coerenza) — poi mescolate e piazzate col cap 3-4 per tipo
    const themeFeats = {
      crypt: ['cimitero', 'ossario', 'ragnatela', 'macerie', 'altare', 'gabbia', 'catacomba', 'rovine', 'patibolo', 'massacro', 'illuminata', 'discesa', 'cisterna', 'passaggio', 'reliquiario'],
      lava: ['stalagmiti', 'cristalli', 'macerie', 'ossario', 'deposito', 'catacomba', 'grotta', 'rovine', 'santuario', 'massacro', 'officina', 'passaggio', 'geode', 'discesa'],
      forest: ['fungaia', 'ragnatela', 'macerie', 'ossario', 'cimitero', 'catacomba', 'rovine', 'grotta', 'patibolo', 'illuminata', 'cisterna', 'passaggio', 'discesa'],
      ice: ['stalagmiti', 'cristalli', 'macerie', 'ossario', 'gabbia', 'ragnatela', 'grotta', 'rovine', 'santuario', 'illuminata', 'geode', 'passaggio', 'cisterna', 'reliquiario'],
      arcane: ['altare', 'cristalli', 'cimitero', 'ragnatela', 'deposito', 'catacomba', 'santuario', 'grotta', 'illuminata', 'massacro', 'geode', 'reliquiario', 'officina', 'discesa'],
    };
    const order = (themeFeats[theme.id] || Object.keys(feats)).slice();
    for (let z = order.length - 1; z > 0; z--) { const j = (rng() * (z + 1)) | 0; const t = order[z]; order[z] = order[j]; order[j] = t; }
    // piazza le zone tematiche (2 passate) col cap dei tipi che evita le ripetizioni eccessive
    let placedFeat = 0; for (let pass = 0; pass < 2 && placedFeat < 9; pass++) { for (const name of order) { if (placedFeat >= 9) break; if (!feats[name]) continue; const c = takeSpot(7); if (!c) break; feats[name](c); placedFeat++; } }
    // v1.62 — STRATO AMBIENTALE (theme.propMix). Anche questo era dichiarato in tutti i temi e mai letto.
    // Non e' un doppione delle feature: le feature sono i PUNTI DI INTERESSE (grandi, max 3-4 per tipo,
    // raccontano una scena), questi sono la TEXTURE fra un punto e l'altro — piccoli (scala 0.6-0.9),
    // sparsi lungo le pareti, e volutamente FUORI dal cap per tipo, che serve a limitare le scene, non il
    // pulviscolo. E' la differenza fra una stanza arredata e una stanza arredata che sembra vissuta.
    { const bag = theme.propMix || [];
      if (bag.length) {
        let amb = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > 5 && nearWall(c));
        for (let z = amb.length - 1; z > 0; z--) { const j = (rng() * (z + 1)) | 0; const t = amb[z]; amb[z] = amb[j]; amb[j] = t; }
        const want = 9 + rint(0, 5); const put = [];
        for (const c of amb) {
          if (put.length >= want) break;
          if (!used.every(u => Math.hypot(u.x - c.x, u.y - c.y) > 3)) continue;
          if (!put.every(u => Math.hypot(u.x - c.x, u.y - c.y) > 3)) continue;
          props.push({ type: bag[(rng() * bag.length) | 0], x: wcx(c) + MU.rand(-10, 10), y: wcy(c) + MU.rand(-10, 10), s: MU.rand(0.62, 0.9), r: rng() });
          put.push(c);
        }
      }
    }
    // micro-aree per il mercante = alcuni spot usati
    const microAreas = used.slice(0, 6).map(c => ({ x: wcx(c), y: wcy(c) }));
    // BRACIERI sparsi (luce), in celle aperte: max CAP
    { let open = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > 4 && !nearWall(c)); for (let z = open.length - 1; z > 0; z--) { const j = (rng() * (z + 1)) | 0; const t = open[z]; open[z] = open[j]; open[j] = t; } let bx = 0; for (const c of open) { if (bx >= 3 + rint(0, 1)) break; if (used.every(u => Math.hypot(u.x - c.x, u.y - c.y) > 4)) { putC('brazier', c, 0, 0, 1.05); used.push(c); bx++; } } }
    // TORCE appese ai muri, REGOLARI e numerose (unica eccezione al cap)
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { if (grid[idx(x, y)] !== C.T_FLOOR) continue; if (grid[idx(x, y - 1)] === C.T_WALL && rng() < 0.06) putW('torch', x * TILE + TILE / 2, y * TILE + 6, 1); }

    // v1.63 — CASSE E ARMI SOLO AL CENTRO. Sono l'unico richiamo periodico del gioco: se compaiono
    // ovunque, chi si accampa sul bordo se le ritrova servite. Confinate nella zona centrale, ogni
    // ondata obbliga ad attraversare lo spazio aperto per prenderle. E' la spinta, non la punizione.
    const cRad = Math.min(W, H) * 0.36;
    let crateSpawns = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > 5 && Math.hypot(c.x - cxm, c.y - cym) <= cRad).map(c => ({ x: wcx(c), y: wcy(c) }));
    // rete di sicurezza: se il centro fosse troppo roccioso si torna alla regola vecchia
    if (crateSpawns.length < 10) crateSpawns = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > 5).map(c => ({ x: wcx(c), y: wcy(c) }));
    const spawnCells = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > Math.min(W, H) * 0.28).map(c => ({ x: c.x, y: c.y }));
    return { w: W, h: H, tile: TILE, seed, level, theme, grid: Array.from(grid), spawn: { x: wcx(start), y: wcy(start) }, exit: exit ? { x: exit.x, y: exit.y } : null, enemySpawns: spawnCells, crateSpawns, props, microAreas };
  }

  // ===================== v1.56 — MAPPA MERCATO: un VILLAGGIO, non una caverna =====================
  // Il generatore procedurale delle ondate qui non serve: una sosta deve essere leggibile a colpo d'occhio,
  // non esplorabile. Mappa costruita a mano, circa META' di quella di combattimento (32x24 contro 46x34),
  // SENZA muri interni: solo il bordo e i cinque edifici, che sono blocchi solidi cosi' la collisione arriva
  // gratis dalla griglia. Illuminata (`lit`): un rifugio al buio della torcia sarebbe assurdo.
  // v1.57 — SIAMO SOTTOTERRA. Niente case, niente alberi, niente piazza lastricata: una SALA scavata
  // nella roccia, pareti quasi nere, un FALO' al centro che e' l'unica sorgente di luce, i mercanti
  // disposti attorno col loro banchetto. Un solo varco, a sud, dove sta il portale d'uscita.
  const VILLAGE = {
    w: 26, h: 22,
    room: { x0: 4, y0: 2, x1: 20, y1: 13 },   // interno della sala (inclusivo, in tile)
    gap: { x0: 11, x1: 13, y1: 17 },          // varco a sud + corridoio fino all'uscita
    spawn: { x: 12, y: 12 },
    exit: { x: 12, y: 16 },
    fire: { x: 12, y: 9 },
    // banchetti a ferro di cavallo attorno al fuoco, aperti verso il varco sud
    stalls: [
      { x: 12, y: 5,  kind: 'seer',      name: 'Cartomante', crd: 1, sub: 'carte' },
      { x: 8,  y: 6,  kind: 'crier',     name: 'Banditore',  bnd: 1, sub: 'taglie e usato' },
      { x: 16, y: 6,  kind: 'innkeeper', name: 'Ostessa',    soon: 1 },
      { x: 8,  y: 10, kind: 'smith',     name: 'Fabbro',     shop: 1 },
      { x: 16, y: 10, kind: 'herbalist', name: 'Erborista',  pot: 1, sub: 'pozioni' },
    ],
    stallScale: 1.7,   // il banchetto deve essere piu' grande del mercante
  };
  const VILLAGE_THEME = {
    id: 'village', name: 'Sala dei Mercanti',
    floorA: '#1c1813', floorB: '#221d17', wall: '#050607', wallTop: '#0d1013',
    hazard: '#ffb020', accent: '#ffb14a', blobMul: 0, hazMul: 0, propMix: [], tint: 'rgba(60,40,20,.10)',
  };
  function generateMarket(seed) {
    const w = VILLAGE.w, h = VILLAGE.h, TILE = C.TILE, R = VILLAGE.room, G = VILLAGE.gap;
    const g = new Uint8Array(w * h).fill(C.T_WALL);   // si parte da roccia piena e si SCAVA
    const at = (x, y) => y * w + x;
    for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) g[at(x, y)] = C.T_FLOOR;
    for (let y = R.y1 + 1; y <= G.y1; y++) for (let x = G.x0; x <= G.x1; x++) g[at(x, y)] = C.T_FLOOR;
    g[at(VILLAGE.exit.x, VILLAGE.exit.y)] = C.T_EXIT;

    const props = [];
    const P = (type, tx, ty, s, extra) => props.push(Object.assign({ type, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, s: s || 1, r: ((tx * 31 + ty * 17) % 100) / 100 }, extra || {}));
    P('bonfire', VILLAGE.fire.x, VILLAGE.fire.y, 1.45);
    for (const s of VILLAGE.stalls) {
      const dx = VILLAGE.fire.x - s.x, dy = VILLAGE.fire.y - s.y;
      props.push({ type: 'stall', kind: s.kind, x: s.x * TILE + TILE / 2, y: s.y * TILE + TILE / 2,
        s: VILLAGE.stallScale, r: ((s.x * 31 + s.y * 17) % 100) / 100, face: Math.atan2(dy, dx) });
    }
    // arredo della sala, tenuto ai bordi: la luce del falo' lo sfiora appena
    for (const [x, y] of [[5, 13], [19, 12], [5, 3], [19, 4]]) P('cratebox', x, y, 1);
    for (const [x, y] of [[6, 12], [18, 13], [9, 13], [15, 12]]) P('barrel', x, y, 1);
    for (const [x, y] of [[4, 8], [20, 8], [11, 2], [14, 2]]) P('stalagmite', x, y, 1.1);
    P('signpost', 12, 14, 1);

    return {
      w, h, tile: TILE, seed, level: 0, theme: VILLAGE_THEME, market: 1,
      grid: Array.from(g),
      spawn: { x: VILLAGE.spawn.x * TILE + TILE / 2, y: VILLAGE.spawn.y * TILE + TILE / 2 },
      exit: { x: VILLAGE.exit.x, y: VILLAGE.exit.y },
      enemySpawns: [], crateSpawns: [], props, microAreas: [],
      village: (() => {
        // il mercante sta DIETRO il suo banco (piu' lontano dal fuoco), non sopra
        const mk = (s) => { const dx = s.x - VILLAGE.fire.x, dy = s.y - VILLAGE.fire.y, d = Math.hypot(dx, dy) || 1;
          return { x: (s.x + dx / d * 2.1) * TILE + TILE / 2, y: (s.y + dy / d * 2.1) * TILE + TILE / 2,
                   kind: s.kind, name: s.name, shop: s.shop || 0, pot: s.pot || 0, bnd: s.bnd || 0, crd: s.crd || 0, sub: s.sub || '',
                   soon: s.soon || 0, face: Math.atan2(-dy, -dx) }; };
        const npcs = VILLAGE.stalls.map(mk);
        const sm = npcs.find(n => n.shop) || npcs[0];
        return { smith: { x: sm.x, y: sm.y }, npcs, fire: { x: VILLAGE.fire.x * TILE + TILE / 2, y: VILLAGE.fire.y * TILE + TILE / 2 } };
      })(),
    };
  }

  return { generate, generateMarket, idx, W, H, THEMES, VILLAGE, VILLAGE_THEME };
});
