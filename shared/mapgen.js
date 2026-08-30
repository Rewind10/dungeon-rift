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
  // v1.76 — QUESTA FUNZIONE HA ROTTO LA MAPPA DUE VOLTE, in due modi diversi, ed e' istruttivo.
  // Serve a trovare la parte di mappa "buona": chi resta fuori viene murato dal chiamante.
  //   1o errore (originale): partiva dal CENTRO GEOMETRICO. Con la pianta nuova il centro puo'
  //      essere dentro una massa di roccia: la visita non partiva, seen restava vuoto e il
  //      chiamante murava LA MAPPA INTERA. 4 mappe su 400.
  //   2o errore (la mia prima correzione): partiva dalla prima tessera libera vicino al centro.
  //      Ma la prima che si incontra puo' essere una SACCA ISOLATA da una tessera: si murava
  //      tutto il resto lo stesso. Ancora 4 mappe su 300, con una sola tessera di pavimento.
  // La regola giusta non e' "da dove parto" ma "cosa tengo": si tiene la COMPONENTE PIU' GRANDE.
  function floodReach(g) {
    const N = W * H, comp = new Int32Array(N).fill(-1), dim = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i0b = idx(x, y);
      if (g[i0b] === C.T_WALL || comp[i0b] >= 0) continue;
      const id = dim.length; let n = 0; const st = [i0b];
      while (st.length) { const i = st.pop();
        if (comp[i] >= 0 || g[i] === C.T_WALL) continue;
        comp[i] = id; n++;
        const px = i % W, py = (i / W) | 0;
        if (px > 0) st.push(i - 1);
        if (px < W - 1) st.push(i + 1);
        if (py > 0) st.push(i - W);
        if (py < H - 1) st.push(i + W);
      }
      dim.push(n);
    }
    const seen = new Uint8Array(N);
    if (!dim.length) return { seen, count: 0 };
    let big = 0; for (let i = 1; i < dim.length; i++) if (dim[i] > dim[big]) big = i;
    for (let i = 0; i < N; i++) if (comp[i] === big) seen[i] = 1;
    return { seen, count: dim[big] };
  }
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
  // =====================================================================================
  // v1.76 — LA PIANTA DELLE MAPPE DI COMBATTIMENTO, rifatta.
  //
  // Cosa c'era prima, e perche' non andava (era gia' scritto qui sotto dalla v1.62, senza rimedio):
  // massi di roccia sparsi a caso piu' widenForBoss, che e' un REGOLATORE DI DENSITA' e cancella
  // qualunque pianta piu' chiusa di "campo aperto con pilastri". Risultato: tutte le mappe uguali,
  // apertura media 0,78 tessere, nessun carattere.
  //
  // Adesso si lavora per SOTTRAZIONE, come la caverna di una battlemap disegnata: si scava UNA
  // caverna grande e irregolare, poi si mettono dentro MASSE DI ROCCIA a scolpire le camere. Lo
  // spazio giocabile resta grande e continuo, la struttura la fanno gli ostacoli.
  //
  // DUE VINCOLI, e sono misurati dai test, non sperati:
  //   1. ZERO TESSERE-STROZZATURA. Nessuna singola tessera, tolta, deve spezzare la mappa in due:
  //      da ogni camera si esce sempre da almeno due parti. Se la mappa diventa un imbuto il
  //      giocatore muore incastrato, non per bravura del mostro.
  //   2. AREA MINIMA. Un seme sfortunato produceva caverne da 720 tessere invece di 1300: si
  //      rigenera col seme perturbato finche' non si sta sopra la soglia.
  //
  // La QUANTITA' di roccia non si sceglie a numeri magici — provato, oscillava fra 795 e 1330
  // tessere secondo archetipo e dimensione. C'e' un BUDGET: la roccia interna arriva al 26% della
  // caverna e ci si ferma li'.
  const ARCHETIPI = ['anello', 'quadrifoglio', 'stella'];

  // Le TESSERE-STROZZATURA sono i punti di articolazione del grafo del pavimento: tolta quella
  // tessera, la mappa si spezza in due. La prima versione le cercava a forza bruta — un flood fill
  // per ogni tessera, cioe' O(area^2): su una mappa da 1350 tessere sono 1,8 milioni di passi per
  // chiamata, e la suite dei test e' andata in timeout. Questa e' la visita di Tarjan: una sola
  // passata, O(tessere). Iterativa e non ricorsiva, perche' su 1350 celle in fila la pila di
  // JavaScript non regge.
  function tessereStrozzatura(g) {
    const N = W * H;
    const suolo = (i) => g[i] !== C.T_WALL;
    const disc = new Int32Array(N).fill(-1), low = new Int32Array(N), padre = new Int32Array(N).fill(-1);
    const art = new Uint8Array(N);
    let tempo = 0;
    const vicini = (i) => { const x = i % W, y = (i / W) | 0; const out = [];
      if (x > 0 && suolo(i - 1)) out.push(i - 1);
      if (x < W - 1 && suolo(i + 1)) out.push(i + 1);
      if (y > 0 && suolo(i - W)) out.push(i - W);
      if (y < H - 1 && suolo(i + W)) out.push(i + W);
      return out; };
    for (let r = 0; r < N; r++) {
      if (!suolo(r) || disc[r] >= 0) continue;
      let figliRadice = 0;
      const pila = [[r, 0, vicini(r)]];
      disc[r] = low[r] = tempo++;
      while (pila.length) {
        const cima = pila[pila.length - 1];
        const u = cima[0], vic = cima[2];
        if (cima[1] < vic.length) {
          const v = vic[cima[1]++];
          if (disc[v] < 0) {
            padre[v] = u; if (u === r) figliRadice++;
            disc[v] = low[v] = tempo++;
            pila.push([v, 0, vicini(v)]);
          } else if (v !== padre[u]) { if (disc[v] < low[u]) low[u] = disc[v]; }
        } else {
          pila.pop();
          const p = padre[u];
          if (p >= 0) { if (low[u] < low[p]) low[p] = low[u];
            if (p !== r && low[u] >= disc[p]) art[p] = 1; }
        }
      }
      if (figliRadice > 1) art[r] = 1;
    }
    const out = [];
    for (let i = 0; i < N; i++) if (art[i]) out.push([i % W, (i / W) | 0]);
    return out;
  }

  function piantaGrezza(rng, archetipo) {
    const rr = (a, b) => a + rng() * (b - a), ri = (a, b) => Math.floor(rr(a, b + 1));
    const g = new Uint8Array(W * H).fill(C.T_WALL);
    const dentro = (x, y) => x >= 2 && y >= 2 && x < W - 2 && y < H - 2;
    const disco = (cx, cy, r, v) => { for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
      for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++)
        if (dentro(x, y) && Math.hypot(x - cx, y - cy) <= r) g[idx(x, y)] = v; };
    const cx0 = W / 2, cy0 = H / 2, SX = W / 56, SY = H / 40;
    const fase = rng() * Math.PI * 2;

    // (1) la caverna: il bordo ondeggia su tre frequenze, cosi' non si legge una formula
    const RX = W / 2 - 3, RY = H / 2 - 3;
    const f1 = rr(0, 6.28), f2 = rr(0, 6.28), f3 = rr(0, 6.28);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!dentro(x, y)) continue;
      const dx = (x - cx0) / RX, dy = (y - cy0) / RY, a = Math.atan2(dy, dx);
      const onda = 1 + 0.11 * Math.sin(a * 3 + f1) + 0.07 * Math.sin(a * 5 - f2) + 0.05 * Math.sin(a * 8 + f3);
      if (Math.hypot(dx, dy) <= onda * 0.99) g[idx(x, y)] = C.T_FLOOR;
    }
    // insenature: morsi nella roccia dal bordo, danno angoli e ripari
    for (let k = 0, nk = ri(3, 5); k < nk; k++) {
      const a = rng() * Math.PI * 2, d = rr(.72, 1.0);
      disco(cx0 + Math.cos(a) * RX * d, cy0 + Math.sin(a) * RY * d, rr(2, 3.4) * SX, C.T_WALL);
    }

    // (2) dove stanno le camere
    let n, rxA, ryA;
    if (archetipo === 'anello') { n = 6; rxA = 17 * SX; ryA = 12 * SY; }
    else if (archetipo === 'quadrifoglio') { n = 4; rxA = 16 * SX; ryA = 11.5 * SY; }
    else { n = 5; rxA = 17.5 * SX; ryA = 12 * SY; }
    const camere = [{ x: cx0, y: cy0 }];
    for (let i = 0; i < n; i++) { const a = fase + i / n * Math.PI * 2 + rr(-.12, .12);
      camere.push({ x: cx0 + Math.cos(a) * rxA, y: cy0 + Math.sin(a) * ryA }); }

    // (3) le masse, col budget
    let cavernaArea = 0;
    for (let i = 0; i < g.length; i++) if (g[i] !== C.T_WALL) cavernaArea++;
    const daTogliere = cavernaArea * 0.26;
    const candidati = [];
    // (a) DORSALI: schiene di pietra che attraversano e obbligano a scegliere da che parte girarle
    for (let k = 0, nk = ri(2, 3); k < nk; k++) {
      const a0 = rng() * Math.PI * 2;
      let px = cx0 + Math.cos(a0) * rr(5, 13) * SX, py = cy0 + Math.sin(a0) * rr(4, 9) * SY, dir = rng() * Math.PI * 2;
      for (let i = 0, lung = ri(5, 9); i < lung; i++) {
        dir += rr(-.25, .25);
        candidati.push({ x: px, y: py, r: rr(1.5, 2.3) * SX, sottile: 1 });
        px += Math.cos(dir) * 2.4 * SX; py += Math.sin(dir) * 2.4 * SX;
      }
    }
    // (b) le masse GROSSE fra due camere vicine: sono quelle che separano
    for (let i = 0; i < n; i++) {
      const A = camere[i + 1], B = camere[(i + 1) % n + 1];
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, d = Math.hypot(mx - cx0, my - cy0) || 1;
      candidati.push({ x: mx + (mx - cx0) / d * rr(1.5, 3.5), y: my + (my - cy0) / d * rr(1, 2.5), r: rr(3.4, 5) * SX });
      candidati.push({ x: cx0 + (mx - cx0) * rr(.42, .58), y: cy0 + (my - cy0) * rr(.42, .58), r: rr(2.4, 3.6) * SX });
    }
    // (c) i massi di COPERTURA dentro le camere: servono a combattere, non a separare
    for (let k = 0; k < 40; k++) { const c = camere[ri(0, camere.length - 1)];
      candidati.push({ x: c.x + rr(-7, 7) * SX, y: c.y + rr(-5, 5) * SY, r: rr(1.3, 2.4) * SX }); }

    let tolto = 0;
    const segna = (cx, cy, r) => { for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
      for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++)
        if (dentro(x, y) && Math.hypot(x - cx, y - cy) <= r && g[idx(x, y)] === C.T_FLOOR) { g[idx(x, y)] = C.T_WALL; tolto++; } };
    for (const m of candidati) {
      if (tolto >= daTogliere) break;
      if (m.sottile) segna(m.x, m.y, m.r);
      else for (let d = 0; d < 3; d++) segna(m.x + rr(-1, 1), m.y + rr(-1, 1), m.r * rr(.58, .95));
    }

    // (4) riparazione: nessuna strozzatura sopravvive
    for (let giro = 0; giro < 14; giro++) {
      const brutte = tessereStrozzatura(g);
      if (!brutte.length) break;
      for (const b of brutte) disco(b[0], b[1], 2.4, C.T_FLOOR);
    }
    // (5) cornice invalicabile
    for (let x = 0; x < W; x++) { g[idx(x, 0)] = g[idx(x, 1)] = g[idx(x, H - 1)] = g[idx(x, H - 2)] = C.T_WALL; }
    for (let y = 0; y < H; y++) { g[idx(0, y)] = g[idx(1, y)] = g[idx(W - 1, y)] = g[idx(W - 2, y)] = C.T_WALL; }
    return { g, camere, archetipo };
  }

  // v1.76 — LE DUE RIPARAZIONI, e girano su tutta la pianta FINITA, dopo che il resto del
  // generatore ha fatto la sua parte. Farle solo dentro piantaGrezza non basta: misurato, alcuni
  // semi uscivano con 2-4 tessere-strozzatura e il grafo "largo" spezzato in nove pezzi.
  //
  // (A) IL PASSAGGIO DEI BOSS. Un boss ha raggio 32: gli serve piu' di una tessera. La condizione
  //     giusta e' che il 3x3 attorno sia libero. Dove non lo e', se il restringimento e' SOTTILE
  //     (al massimo tre tessere di roccia nel 3x3) si scava; se e' una massa vera la si lascia
  //     stare, e il boss ci gira attorno. E' la differenza fra allargare un passaggio e demolire
  //     la mappa — che e' quello che faceva widenForBoss da solo.
  // PRIMA VERSIONE, SBAGLIATA, e vale la pena tenerne il ricordo: "se attorno a una tessera ci sono
  // al massimo tre tessere di roccia, scavale". Sembra prudente e non lo e': ogni scavo crea nuove
  // tessere che soddisfano la condizione, l'erosione va a cascata e in otto passate si mangia tutta
  // la roccia. Misurato: area da 1350 a 2470 su 2944, apertura da 1,15 a 7,32. Cioe' la mappa intera.
  //
  // La versione giusta non allarga DOVE E' STRETTO, allarga SOLO I PONTI CHE SERVONO: si guarda il
  // grafo delle celle larghe (3x3 libero, che e' la condizione perche' ci passi un boss di raggio 32),
  // e se e' spezzato in piu' pezzi si scava un corridoio da tre tessere lungo il cammino piu' corto
  // fra il pezzo grande e ognuno degli altri. Tutto il resto della roccia resta dov'e'.
  function allargaPerBoss(g) {
    const largo = (x, y) => {
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
        if (g[idx(x + dx, y + dy)] === C.T_WALL) return false;
      return true;
    };
    const suolo = (x, y) => x >= 0 && y >= 0 && x < W && y < H && g[idx(x, y)] !== C.T_WALL;
    for (let giro = 0; giro < 6; giro++) {
      // componenti del grafo "largo"
      const comp = new Int32Array(W * H).fill(-1); const dim = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (comp[idx(x, y)] >= 0 || !largo(x, y)) continue;
        const id = dim.length; let n = 0; const q = [[x, y]];
        while (q.length) { const p = q.pop(), a = p[0], b = p[1];
          if (!largo(a, b) || comp[idx(a, b)] >= 0) continue;
          comp[idx(a, b)] = id; n++; q.push([a+1,b],[a-1,b],[a,b+1],[a,b-1]); }
        dim.push(n);
      }
      if (dim.length <= 1) return giro;
      let grande = 0; for (let i = 1; i < dim.length; i++) if (dim[i] > dim[grande]) grande = i;
      // i pezzi troppo piccoli non valgono un corridoio: sono angoli, non stanze
      const orfani = []; for (let i = 0; i < dim.length; i++) if (i !== grande && dim[i] >= 14) orfani.push(i);
      if (!orfani.length) return giro;
      // cammino piu' corto sul PAVIMENTO dal pezzo grande al primo orfano, e lo si allarga
      const prev = new Int32Array(W * H).fill(-2); const q = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
        if (comp[idx(x, y)] === grande) { prev[idx(x, y)] = -1; q.push(idx(x, y)); }
      let arrivo = -1;
      for (let h = 0; h < q.length && arrivo < 0; h++) {
        const i = q[h], x = i % W, y = (i / W) | 0;
        if (orfani.indexOf(comp[i]) >= 0) { arrivo = i; break; }
        const vic = [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
        for (const v of vic) { if (!suolo(v[0], v[1])) continue; const j = idx(v[0], v[1]);
          if (prev[j] !== -2) continue; prev[j] = i; q.push(j); }
      }
      if (arrivo < 0) return giro;
      for (let i = arrivo; i >= 0; i = prev[i]) {
        const cx = i % W, cy = (i / W) | 0;
        for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++)
          if (x >= 2 && y >= 2 && x < W - 2 && y < H - 2 && Math.hypot(x - cx, y - cy) <= 1.6) g[idx(x, y)] = C.T_FLOOR;
        if (prev[i] === -1) break;
      }
    }
    return -1;
  }
  // (B) NIENTE STROZZATURE. Nessuna singola tessera, tolta, deve spezzare la mappa in due.
  function togliStrozzature(g) {
    for (let giro = 0; giro < 20; giro++) {
      const brutte = tessereStrozzatura(g);
      if (!brutte.length) return giro;
      for (const b of brutte) {
        const cx = b[0], cy = b[1];
        for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++)
          if (x >= 2 && y >= 2 && x < W - 2 && y < H - 2 && Math.hypot(x - cx, y - cy) <= 2.4) g[idx(x, y)] = C.T_FLOOR;
      }
    }
    return -1;
  }

  function piantaCaverna(rng, level) {
    const AREA_MINIMA = Math.round(W * H * 0.40);
    const arc = ARCHETIPI[Math.floor(rng() * ARCHETIPI.length)];
    let ultima = null;
    for (let tent = 0; tent < 6; tent++) {
      const p = piantaGrezza(rng, arc);
      let area = 0; for (let i = 0; i < p.g.length; i++) if (p.g[i] !== C.T_WALL) area++;
      ultima = p; ultima.area = area;
      if (area >= AREA_MINIMA) break;
    }
    return ultima;
  }

  function generate(seed, level) {
    const rng = MU.seedRng(seed >>> 0); const rint = (a, b) => Math.floor(a + rng() * (b - a + 1));
    const theme = THEMES[Math.floor(rng() * THEMES.length)];
    const TILE = C.TILE, cxm = W >> 1, cym = H >> 1;
    // v1.22 — CONFORMAZIONE ORGANICA (caverna varia, non "piatta"): blob di muro + connettivita garantita
    // v1.76 — la pianta arriva da piantaCaverna(): caverna scavata + masse a scolpire le camere,
    // con zero tessere-strozzatura garantite. Il vecchio blocco (massi a caso + apertura dei muri
    // per connettivita') stava qui e produceva sempre la stessa mappa: e' scritto sopra il perche'.
    const _p = piantaCaverna(rng, level);
    const grid = _p.g; const camere = _p.camere; const archetipo = _p.archetipo;
    let seen;   // la usa il blocco di sicurezza qui sotto (murare le sacche staccate)
    widenForBoss(grid); // v1.28 — garantisce corridoi >= 3 tile per il passaggio dei boss
    allargaPerBoss(grid);   // v1.76 — e allarga i restringimenti sottili, senza demolire le masse
    ({ seen } = floodReach(grid)); for (let i = 0; i < grid.length; i++) if (grid[i] !== C.T_WALL && !seen[i]) grid[i] = C.T_WALL;
    togliStrozzature(grid); // v1.76 — e questa e' l'ultima parola: zero imbuti, misurato dai test
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
    // v1.76 — LA RADURA DI PARTENZA, e questa e' una garanzia su cui poggia mezzo gioco: i nemici
    // nascono a 200-260 px dal giocatore con la linea di vista libera, e mezza dozzina di prove danno
    // per scontato che attorno alla partenza ci sia spazio. Prima si cercava solo entro 7 tessere dal
    // centro geometrico; con la caverna il centro puo' essere roccia, la lista usciva vuota e si
    // ripiegava su free[0] — cioe' un angolo qualunque, magari incastrato. Sintomo: prove che
    // fallivano una volta su quattro senza che ci fosse niente di rotto.
    // Adesso si cerca su TUTTA la mappa la radura piu' ampia, e a parita' si preferisce quella piu'
    // vicina al centro: la partenza resta centrale quando si puo', ma prima di tutto e' larga.
    let start = null;
    { let bestR = 0; const scored = [];
      for (const c of free) { let r = 0; while (r < 6 && areaFree(grid, c.x, c.y, r + 1, r + 1, 0)) r++;
        if (r >= 2) { scored.push({ c, r }); if (r > bestR) bestR = r; } }
      const top = scored.filter(o => o.r >= bestR).map(o => o.c);
      if (top.length) {
        let dMin = Infinity; for (const c of top) { const d = Math.hypot(c.x - cxm, c.y - cym); if (d < dMin) dMin = d; }
        const vicine = top.filter(c => Math.hypot(c.x - cxm, c.y - cym) <= dMin + 6);
        start = vicine[(rng() * vicine.length) | 0];
      } }
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
    // v1.76 — IL CAMPO DELLA FAGLIA. Prima la profondita' si misurava dai bordi del RETTANGOLO della
    // mappa. Con la caverna, che e' rientrata rispetto al rettangolo, la fascia toccava il 10% delle
    // tessere calpestabili invece del 30% e arrivava a profondita' 3 invece di 6: chi si accampava
    // contro la parete non veniva piu' punito, cioe' la faglia aveva smesso di fare il suo mestiere.
    // Adesso la profondita' si misura dalla ROCCIA ESTERNA — quella che confina col bordo della mappa,
    // non i massi interni, se no ogni sasso avrebbe il suo alone di morte e stare al riparo dietro un
    // masso diventerebbe un suicidio. Distanza 0 dalla parete = 6, la stessa intensita' che prima
    // aveva l'angolo della mappa.
    const edgeField = (() => {
      const fuori = new Uint8Array(W * H);      // roccia che comunica col bordo della mappa
      const q = [];
      for (let x = 0; x < W; x++) { q.push([x, 0], [x, H - 1]); }
      for (let y = 0; y < H; y++) { q.push([0, y], [W - 1, y]); }
      while (q.length) { const p = q.pop(), x = p[0], y = p[1];
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = idx(x, y);
        if (fuori[i] || grid[i] !== C.T_WALL) continue;
        fuori[i] = 1; q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
      // distanza (in tessere) dalla roccia esterna, camminando sul pavimento
      const dist = new Int16Array(W * H).fill(-1); const q2 = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!fuori[idx(x, y)]) continue;
        for (const d of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + d[0], ny = y + d[1];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = idx(nx, ny);
          if (grid[j] !== C.T_WALL && dist[j] < 0) { dist[j] = 0; q2.push(j); } } }
      for (let h = 0; h < q2.length; h++) { const i = q2[h], x = i % W, y = (i / W) | 0;
        for (const d of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + d[0], ny = y + d[1];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = idx(nx, ny);
          if (grid[j] !== C.T_WALL && dist[j] < 0) { dist[j] = dist[i] + 1; q2.push(j); } } }
      const M = C.EDGE_MARGIN, out = new Uint8Array(W * H);
      // La fascia va tarata sulla COPERTURA, non a occhio. Misurato su 10 mappe: le tessere attaccate
      // alla parete esterna sono il 17%, entro una tessera il 34%, entro due il 48%. Il gioco ne vuole
      // fra il 15% e il 45% (e prima, sul rettangolo, ne toccava circa il 30%): quindi la fascia e'
      // profonda DUE tessere — 6 attaccati alla parete, 3 a una tessera, niente da li' in poi.
      for (let i = 0; i < W * H; i++) if (dist[i] >= 0) out[i] = Math.max(0, 2 * M - M * dist[i]);
      return Array.from(out);
    })();
    return { w: W, h: H, tile: TILE, seed, level, theme, archetipo, camere, edgeField, grid: Array.from(grid), spawn: { x: wcx(start), y: wcy(start) }, exit: exit ? { x: exit.x, y: exit.y } : null, enemySpawns: spawnCells, crateSpawns, props, microAreas };
  }

  // ===================== v1.56 — MAPPA MERCATO: un VILLAGGIO, non una caverna =====================
  // Il generatore procedurale delle ondate qui non serve: una sosta deve essere leggibile a colpo d'occhio,
  // non esplorabile. Mappa costruita a mano, circa META' di quella di combattimento (32x24 contro 46x34),
  // SENZA muri interni: solo il bordo e i cinque edifici, che sono blocchi solidi cosi' la collisione arriva
  // gratis dalla griglia. Illuminata (`lit`): un rifugio al buio della torcia sarebbe assurdo.
  // v1.57 — SIAMO SOTTOTERRA. Niente case, niente alberi, niente piazza lastricata: una SALA scavata
  // nella roccia, pareti quasi nere, un FALO' al centro che e' l'unica sorgente di luce, i mercanti
  // disposti attorno col loro banchetto. Un solo varco, a sud, dove sta il portale d'uscita.
  // ===================== v1.75 — IL VILLAGGIO A MICRO-STANZE =====================
  // La sala unica e' finita. Cinque figure in piedi in un rettangolo non raccontavano niente, e le
  // nicchie erano una mezza misura. Adesso ogni mestiere ha la SUA STANZA, con la sua porta, il suo
  // pavimento e i suoi mobili: e' la pianta a dire chi fa cosa, prima ancora dei nomi.
  //
  // LA REGOLA CHE TIENE TUTTO INSIEME: una PIAZZA centrale col falo', dove si arriva e dove sta il
  // portale. Nessuna stanza e' a piu' di due passi da li', e da li' si vedono tutte le porte. Cosi' il
  // "paesello da attraversare" non diventa un labirinto e l'uscita e' sempre alle spalle.
  //
  // COME SI AGGIUNGE UNA STANZA: una riga in ROOMS (rettangolo, pavimento, colore) e una in LINKS (il
  // corridoio che la attacca alla piazza). L'arredo sta in arreda(), una funzione per stanza.
  const VILLAGE = {
    w: 34, h: 26,
    piazza: { x0: 13, y0: 10, x1: 20, y1: 16 },
    fire: { x: 16, y: 13 },
    spawn: { x: 16, y: 15 },
    exit: { x: 16, y: 20 },
    // le stanze: rettangolo INTERNO (la roccia attorno e' il muro)
    rooms: [
      { id: 'taverna',  x0: 3,  y0: 3,  x1: 11, y1: 11, pav: 'legno',  col: 'rgba(92,62,32,.62)' },
      { id: 'antro',    x0: 14, y0: 2,  x1: 20, y1: 7,  pav: 'lastre', col: 'rgba(58,42,84,.42)' },
      { id: 'erbe',     x0: 23, y0: 4,  x1: 30, y1: 11, pav: 'terra',  col: 'rgba(46,58,36,.44)' },
      { id: 'fucina',   x0: 3,  y0: 13, x1: 10, y1: 19, pav: 'lastre', col: 'rgba(72,38,24,.48)' },
      { id: 'retro',    x0: 23, y0: 13, x1: 30, y1: 19, pav: 'lastre', col: 'rgba(70,40,38,.42)' },
    ],
    // i corridoi verso la piazza: una lista di rettangoli da scavare, porta compresa
    // v1.75.1 — le porte erano larghe UNA tile (48 px) contro un personaggio largo 35: ci si passava a
    // pelo, sfregando lo stipite. Adesso ogni porta e' larga DUE tile, e il varco del portale TRE: e' la
    // strada principale del villaggio, e cosi' resta centrata sull'uscita.
    links: [
      [12, 10, 12, 11],   // taverna  -> piazza
      [16, 8,  17, 9],    // antro    -> piazza
      [21, 10, 22, 11],   // erbe     -> piazza
      [11, 15, 12, 16],   // fucina   -> piazza
      [21, 15, 22, 16],   // retro    -> piazza
      [15, 17, 17, 20],   // piazza   -> portale (il varco grande)
    ],
    // dove sta ogni mercante, e il colore della sua luce
    stalls: [
      { x: 15.1, y: 4.4, kind: 'seer',      name: 'Cartomante', crd: 1, sub: 'carte',
        col: '#c9a0ff', room: 'antro' },
      // v1.75 — il Banditore era il meno riuscito: un tizio col cartello. Ora e' il CAPITANO della Gilda
      // dei Contratti — un ufficiale che appende le taglie e ricompra l'attrezzatura dei caduti. La chiave
      // interna resta `crier`/`bnd` (la usano server, test e messaggi): cambia il personaggio, non l'impianto.
      { x: 27, y: 14, kind: 'crier',     name: 'Capitano',   bnd: 1, sub: 'taglie e usato',
        col: '#ff9a8a', room: 'retro' },
      { x: 6.5, y: 4,  kind: 'innkeeper', name: 'Ostessa',    inn: 1, sub: 'riposo',
        col: '#ffd97a', room: 'taverna' },
      { x: 5,  y: 14, kind: 'smith',     name: 'Fabbro',     shop: 1,
        col: '#ffb14a', room: 'fucina' },
      { x: 27, y: 5.2, kind: 'herbalist', name: 'Erborista',  pot: 1, sub: 'pozioni',
        col: '#9fe06a', room: 'erbe' },
    ],
  };
  const VILLAGE_THEME = {
    id: 'village', name: 'Sala dei Mercanti',
    floorA: '#1c1813', floorB: '#221d17', wall: '#050607', wallTop: '#0d1013',
    hazard: '#ffb020', accent: '#ffb14a', blobMul: 0, hazMul: 0, propMix: [], tint: 'rgba(60,40,20,.10)',
  };
  // ===================== v1.75.2 — GLI OSTACOLI FISICI =====================
  // Attraversare un tavolo da parte a parte faceva sembrare il villaggio un disegno invece che un posto.
  // Qui i mobili e le persone hanno un CORPO: ci sbatti contro e ci giri attorno.
  //
  // Vale SOLO nel villaggio. Fuori non ci sono mobili, e nelle ondate un secondo insieme di corpi solidi
  // in mezzo ai mostri e ai proiettili sarebbe un rischio senza guadagno.
  //
  // Ogni voce e' l'ingombro del mobile a SCALA 1, in pixel di mondo, misurato su come lo disegna
  // renderer.js:  c = cerchio (raggio)  ·  r = rettangolo (mezza larghezza, mezza altezza).
  // Quello che NON e' in questa tabella si attraversa: tappeti, pozze di lava, ragnatele, stendardi,
  // teschi, lanterne appese (stanno sul soffitto) e gli sgabelli, che sono bassi e solo darebbero fastidio
  // fra il tavolo e chi ci gira attorno.
  const INGOMBRI = {
    tavolo: { c: 20 }, incudine: { c: 15 }, alambicco: { c: 11 }, crystal_cluster: { c: 13 },
    barrel: { c: 10 }, sack: { c: 10 }, brazier: { c: 12 }, candelabra: { c: 8 },
    signpost: { c: 8 }, mortaio: { c: 9 }, bonfire: { c: 26 },
    bancone: { r: [32, 11] }, credenza: { r: [27, 12] }, scaffale: { r: [25, 13] },
    rastrelliera: { r: [23, 8] }, aiuola: { r: [23, 19] }, cratebox: { r: [12, 12] },
  };
  // questi quattro il renderer li gira di 90 gradi quando il prop ha r > 0.5: l'ingombro deve girare con loro
  const GIRANO = { bancone: 1, credenza: 1, scaffale: 1, rastrelliera: 1 };
  // il corpo di una persona: piu' stretto della sagoma disegnata, cosi' ci si passa accanto senza incastri
  const CORPO = 14;

  function ingombri(props, village) {
    const out = [];
    for (const p of props) {
      const d = INGOMBRI[p.type]; if (!d) continue;
      const s = p.s || 1;
      if (d.c) { out.push({ t: 'c', x: p.x, y: p.y, r: d.c * s }); continue; }
      let hw = d.r[0] * s, hh = d.r[1] * s;
      if (GIRANO[p.type] && (p.r || 0) > 0.5) { const t = hw; hw = hh; hh = t; }
      out.push({ t: 'r', x: p.x, y: p.y, hw, hh });
    }
    for (const n of village.npcs) out.push({ t: 'c', x: n.x, y: n.y, r: CORPO, chi: 1 });
    for (const e of village.extras) out.push({ t: 'c', x: e.x, y: e.y, r: CORPO, chi: 1 });
    return out;
  }

  function generateMarket(seed) {
    const w = VILLAGE.w, h = VILLAGE.h, TILE = C.TILE;
    const g = new Uint8Array(w * h).fill(C.T_WALL);   // si parte da roccia piena e si SCAVA
    const at = (x, y) => y * w + x;
    const scava = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[at(x, y)] = C.T_FLOOR; };

    const PZ = VILLAGE.piazza;
    scava(PZ.x0, PZ.y0, PZ.x1, PZ.y1);
    for (const r of VILLAGE.rooms) scava(r.x0, r.y0, r.x1, r.y1);
    for (const L of VILLAGE.links) scava(L[0], L[1], L[2], L[3]);
    g[at(VILLAGE.exit.x, VILLAGE.exit.y)] = C.T_EXIT;

    // il pavimento di ogni stanza (la piazza compresa): lo disegna il renderer da questa lista
    const floors = [{ x0: PZ.x0, y0: PZ.y0, x1: PZ.x1, y1: PZ.y1, kind: 'lastre', col: 'rgba(60,52,40,.34)' }];
    for (const r of VILLAGE.rooms) floors.push({ x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, kind: r.pav, col: r.col });

    const props = [];
    const P = (type, tx, ty, s, extra) => props.push(Object.assign({ type, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, s: s || 1, r: ((tx * 31 + ty * 17) % 100) / 100 }, extra || {}));

    // --- LA PIAZZA: il falo' e il suo anello di pietre ---
    P('bonfire', VILLAGE.fire.x, VILLAGE.fire.y, 1.45);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2;
      P('rock', VILLAGE.fire.x + Math.cos(a) * 1.4, VILLAGE.fire.y + Math.sin(a) * 1.0, 0.5); }
    P('signpost', 16, 17.6, 1);
    // v1.75.3 — qui c'erano due casse: stavano esattamente sulla soglia dell'osteria e della gilda, e da
    // quando i mobili hanno un corpo (v1.75.2) erano un ostacolo piantato in mezzo alla porta. Via.

    // --- LA TAVERNA: l'ostessa DIETRO il bancone, la credenza alle sue spalle, gli avventori ai tavoli ---
    P('credenza', 6.5, 3.2, 1, { r: 0 });                       // contro il muro nord, dietro di lei
    P('bancone', 6.5, 5.0, 1, { r: 0 });                        // il bancone la separa dalla sala
    P('hanging_lantern', 3.8, 3.4, 1.05); P('hanging_lantern', 10.4, 3.4, 1.05);
    for (const [x, y] of [[3.6, 6.4], [3.6, 7.6], [3.6, 8.8]]) P('barrel', x, y, 0.95);   // le botti in fila
    for (const [tx, ty] of [[6.5, 7.4], [10, 7.4], [6.5, 9.6], [10, 9.6]]) {              // due file di tavoli
      P('tavolo', tx, ty, 1);
      P('panca', tx - 1.2, ty, 0.95); P('panca', tx + 1.2, ty, 0.95);
    }
    P('brazier', 10.6, 3.6, 1.05);

    // --- L'ANTRO: lei SEDUTA al tavolo, sul tappeto, con le sue cose attorno ---
    P('tappeto', 16.4, 4.4, 1.2, { col: '#5a2f6b' });
    P('tavolo', 16.4, 4.4, 0.9);
    P('candelabra', 14.4, 2.8, 1); P('candelabra', 18.6, 2.8, 1);
    P('scaffale', 19.4, 4.4, 1, { r: 1, col: '#c9a0ff' });      // libri e mazzi, contro il muro est
    P('crystal_cluster', 14.4, 6.6, 0.85, { col: '#c9a0ff', gr: 58, ga: 0.26 });
    P('crystal_cluster', 19.4, 6.6, 0.85, { col: '#c9a0ff', gr: 58, ga: 0.26 });
    P('skull', 15.4, 2.6, 0.9); P('web', 20.4, 2.4, 0.85);

    // --- L'ERBORISTERIA: bancone davanti a lei, gli strumenti, e le PIANTAGIONI in fila ---
    P('bancone', 27, 6.4, 1, { r: 0 });
    P('scaffale', 25, 4.2, 1, { r: 0 }); P('scaffale', 29, 4.2, 1, { r: 0 });
    P('alambicco', 25.4, 5.4, 1.05, { col: '#9fe06a' });
    P('mortaio', 28.6, 5.4, 1.1, { col: '#9fe06a' });
    for (const [x, y] of [[24.6, 9], [27, 9], [29.4, 9]])       // tre aiuole allineate
      P('aiuola', x, y, 1, { col: '#9fe06a', glow: 1 });
    P('barrel', 23.6, 6.6, 0.95); P('sack', 30.4, 6.6, 0.9);

    // --- LA FUCINA: lui dietro il bancone, la colata in fondo, le armi appese in fila ---
    P('bancone', 5, 15.2, 1, { r: 0 });                          // il banco fra lui e chi compra
    P('rastrelliera', 4.4, 13.2, 1, { r: 0 });                   // le armi alle sue spalle
    P('rastrelliera', 7.4, 13.2, 1, { r: 0 });
    P('rastrelliera', 9.6, 17.4, 1, { r: 1 });                   // e una sulla parete est, in basso
    // v1.75.3 — la seconda rastrelliera est stava a 9.6,15.4: proprio davanti all'ingresso della fucina.
    P('incudine', 7.6, 16.6, 1.15);
    for (const [x, y, sc] of [[4.4, 18.4, 1.5], [5.7, 18.6, 1.35], [4.7, 17.6, 1.2]]) P('lavapool', x, y, sc);
    P('brazier', 7.4, 18.6, 1);
    for (const [x, y] of [[9.6, 19.4], [8.6, 19.4]]) P('cratebox', x, y, 0.95);
    P('barrel', 3.6, 16.6, 0.95);

    // --- LA GILDA: la bacheca delle taglie, il banco del capitano, l'usato in ordine sugli scaffali ---
    P('signpost', 27, 12.6, 1.05, { txt: 'TAGLIE' });            // la bacheca, sul muro nord
    P('bancone', 27, 15.2, 1, { r: 0 });
    P('flag', 24, 13.4, 1.25, { col: '#ff9a8a' });
    P('flag', 30, 13.4, 1.25, { col: '#ff9a8a' });
    P('scaffale', 24.4, 18.6, 1, { r: 0 }); P('scaffale', 29.6, 18.6, 1, { r: 0 });
    P('rastrelliera', 23.6, 16.6, 1, { r: 1 });
    for (const [x, y] of [[27, 18.4], [28, 18.4], [26, 18.4]]) P('cratebox', x, y, 0.95);
    P('barrel', 30.4, 16.6, 0.95);

    // --- l'alone del colore di ogni mercante: lo stacca dalla roccia e dice chi e' da lontano ---
    for (const s of VILLAGE.stalls) P('glowspot', s.x, s.y, 1, { col: s.col, gr: 100, ga: 0.34 });

    // --- ragnatele e catene negli angoli: siamo pur sempre sottoterra ---
    for (const [x, y] of [[3.4, 3.4], [30.4, 4.4], [3.4, 19.4], [30.4, 19.4]]) P('web', x, y, 0.9);

    const village = (() => {
        // v1.75 — senza banchetto il mercante sta AL SUO POSTO, non piu' 2.1 tile piu' indietro: quello
        // scarto serviva solo a non farlo coprire dal banco.
        // Ogni mercante sta nella SUA stanza, girato verso la porta che da' sulla piazza.
        const mk = (s) => { const dx = s.x - VILLAGE.fire.x, dy = s.y - VILLAGE.fire.y;
          return { x: s.x * TILE + TILE / 2, y: s.y * TILE + TILE / 2,
                   kind: s.kind, name: s.name, shop: s.shop || 0, pot: s.pot || 0, bnd: s.bnd || 0, crd: s.crd || 0, inn: s.inn || 0, sub: s.sub || '', col: s.col || '',
                   soon: s.soon || 0, seated: s.seated || 0, face: Math.atan2(-dy, -dx) }; };
        const npcs = VILLAGE.stalls.map(mk);
        // v1.75 — LA GENTE DEL VILLAGGIO: avventori seduti ai tavoli e qualche passante. Non parlano e
        // non vendono, ma senza di loro il posto sembra abbandonato invece che abitato.
        const extras = [
          { x: 5.4, y: 7.4, kind: 'patron', face: 0 },
          { x: 7.6, y: 7.4, kind: 'patron', face: Math.PI },
          { x: 8.9, y: 9.6, kind: 'patron', face: 0 },
          { x: 11.1, y: 9.6, kind: 'patron', face: Math.PI },
          { x: 10, y: 6.2, kind: 'patron', face: 1.9 },
          { x: 14.2, y: 12.2, kind: 'patron', face: 0.5 },
          { x: 19, y: 14.4, kind: 'patron', face: 3.4 },
          { x: 25.4, y: 17.2, kind: 'patron', face: 4.6 },
        ].map(e => ({ x: e.x * TILE + TILE / 2, y: e.y * TILE + TILE / 2, kind: e.kind, seated: e.seated || 0, face: e.face || 0, name: '', sub: '' }));
        const sm = npcs.find(n => n.shop) || npcs[0];
      return { smith: { x: sm.x, y: sm.y }, smithFace: sm.face, npcs, extras, fire: { x: VILLAGE.fire.x * TILE + TILE / 2, y: VILLAGE.fire.y * TILE + TILE / 2 } };
    })();

    return {
      w, h, tile: TILE, seed, level: 0, theme: VILLAGE_THEME, market: 1,
      grid: Array.from(g), floors,
      spawn: { x: VILLAGE.spawn.x * TILE + TILE / 2, y: VILLAGE.spawn.y * TILE + TILE / 2 },
      exit: { x: VILLAGE.exit.x, y: VILLAGE.exit.y },
      enemySpawns: [], crateSpawns: [], props, microAreas: [],
      village, solids: ingombri(props, village),
    };
  }

  // piantaCaverna e tessereStrozzatura escono anche da sole: i test le provano senza dover
  // generare una mappa intera, ed e' cosi' che si tiene onesto il vincolo delle strozzature.
  return { generate, generateMarket, idx, W, H, THEMES, VILLAGE, VILLAGE_THEME, piantaCaverna, tessereStrozzatura };
});
