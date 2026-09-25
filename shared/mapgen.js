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
  // ============================================================================================
  // v2.20.3 — OGNI POSTO HA LA SUA PIETRA: `chiaro` e `scuro`
  // ============================================================================================
  // Paolo, guardando le mappe: *«c'e' modo di variare in modo piu' significativo? anche solo colori
  // delle rocce diversi»*. Aveva visto giusto, e il motivo per cui le cinque grotte si somigliavano
  // non era la mancanza di colori — quelli c'erano gia', uno per tema — ma il modo in cui venivano
  // usati: dentro `_bakeCaverna` il CHIARO con cui si schiarisce la pietra e lo SCURO con cui si
  // incide erano DUE COSTANTI UGUALI PER TUTTI (un grigio-azzurro e un nero-blu). Qualunque fosse il
  // colore del tema, la roccia veniva sempre impastata verso lo stesso grigio freddo: il colore c'era
  // ma se lo rimangiava la cottura.
  //
  // Adesso li porta il tema, e cambiano tutti e cinque:
  //   cripta   osso sporco    calcare vecchio
  //   lava     cenere rossa   basalto caldo
  //   foresta  verde lichene  pietra mangiata dal bosco
  //   ghiaccio bianco-ciano   ghiaccio vero
  //   arcano   lilla pallido  pietra incisa
  //
  // Il tema continua a SORTEGGIARSI come sempre (Paolo: *«preferisco la casualita'»*): non e' cambiato
  // niente su quale mappa esce quando, solo su come ogni mappa dipinge la sua pietra.
  //
  // Il VILLAGGIO non li ha, ed e' voluto: senza `chiaro`/`scuro` la cottura usa i valori di prima, e
  // il paese resta identico a com'era. Si cambia il sottosuolo, non casa della gente.
  const THEMES = [
    { id: 'crypt', name: 'Cripta Dimenticata', floorA: '#12161f', floorB: '#151a26', wall: '#1b2036', wallTop: '#262d4a', hazard: '#ff5a1e', accent: '#8be9ff', chiaro: '#d8cfb4', scuro: '#0a0c10', blobMul: 1.0, hazMul: 1.0, propMix: ['bones', 'skull', 'coffin', 'tomb', 'corpse', 'chain', 'rock', 'rockSmall', 'web', 'skull', 'bones', 'urna', 'loculo'], tint: 'rgba(40,60,45,.22)' },
    { id: 'lava', name: 'Caverne di Lava', floorA: '#1c1413', floorB: '#241615', wall: '#2a1a16', wallTop: '#4a2a1e', hazard: '#ff7a1e', accent: '#ffb020', chiaro: '#e0a271', scuro: '#140805', blobMul: 0.85, hazMul: 1.9, propMix: ['rock', 'rockSmall', 'bones', 'skull', 'chain', 'corpse', 'crystal', 'rock', 'skull', 'colata', 'colata', 'sfiatatoio'], tint: 'rgba(90,40,20,.24)' },
    { id: 'forest', name: 'Rovine nella Foresta', floorA: '#121a14', floorB: '#16221a', wall: '#1c2a1e', wallTop: '#2a3d2c', hazard: '#5adf5a', accent: '#8bff9a', chiaro: '#b9cfa0', scuro: '#08120a', blobMul: 1.15, hazMul: 1.1, propMix: ['rock', 'rockSmall', 'mushroom', 'bones', 'corpse', 'coffin', 'web', 'web', 'skull', 'felce', 'felce', 'tronco'], tint: 'rgba(30,70,40,.26)' },
    { id: 'ice', name: 'Cripta di Ghiaccio', floorA: '#121a22', floorB: '#16222e', wall: '#1c2a3a', wallTop: '#2a3d52', hazard: '#7de0ff', accent: '#a8f0ff', chiaro: '#cfe9f5', scuro: '#06121c', blobMul: 1.05, hazMul: 0.9, propMix: ['rock', 'rockSmall', 'crystal', 'bones', 'skull', 'coffin', 'web', 'corpse', 'ghiacciolo', 'ghiacciolo', 'congelato'], tint: 'rgba(40,70,95,.22)' },
    { id: 'arcane', name: 'Tempio Arcano', floorA: '#181322', floorB: '#1e1830', wall: '#2a1e3a', wallTop: '#3d2c52', hazard: '#c56bff', accent: '#d59bff', chiaro: '#d3bff0', scuro: '#0d0718', blobMul: 1.0, hazMul: 1.2, propMix: ['skull', 'bones', 'crystal', 'coffin', 'chain', 'corpse', 'web', 'cerchio', 'leggio'], tint: 'rgba(70,40,95,.24)' },
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

  // ===================== v1.97 — LA PIANTA DEL CIMITERO (ondate 1-2) =====================
  // Perche' esiste: fino alla 1.96 ogni mappa di combattimento veniva dalla stessa funzione — una
  // caverna scavata con dentro masse di roccia. Cambiavano palette e decorazioni, ma lo SPAZIO era
  // sempre quello, e dopo venti ondate si sente. Il cimitero e' la prima pianta alternativa, e per
  // cominciare vale solo per le prime due ondate: e' li' che il giocatore si forma l'idea del gioco.
  //
  // L'idea, in una riga: un cimitero non e' roba sparsa, e' SETTORI separati da VIALETTI, e dentro
  // ogni settore file regolari. E' l'ORDINE che si legge a occhio a dire "questo non e' una grotta" —
  // la caverna e' tutta disordine organico, qui ci sono linee rette e ripetizioni.
  //
  // La griglia resta BINARIA (pavimento/muro) perche' collisioni, linea di vista e campo di flusso
  // devono continuare a funzionare senza sapere niente di lapidi. Cio' che le lapidi hanno in piu' e'
  // un array parallelo `muri`, che dice al RENDERER come dipingere quella tessera: e' l'unico posto in
  // cui il cimitero esiste come tale.
  const M_ROCCIA = 0, M_LAPIDE = 1, M_PIETRA = 2, M_CINTA = 3, M_ALBERO = 4;

  function piantaCimitero(rng) {
    const rr = (a, b) => a + rng() * (b - a), ri = (a, b) => Math.floor(rr(a, b + 1));
    const g = new Uint8Array(W * H).fill(C.T_FLOOR);
    const muri = new Uint8Array(W * H);
    const set = (x, y, tipo) => { if (x < 0 || y < 0 || x >= W || y >= H) return; g[idx(x, y)] = C.T_WALL; muri[idx(x, y)] = tipo; };
    const libera = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; g[idx(x, y)] = C.T_FLOOR; muri[idx(x, y)] = 0; };
    const pieno = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? true : g[idx(x, y)] === C.T_WALL;
    const rett = (x0, y0, w, h, tipo) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, tipo); };
    const vuota = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) libera(x, y); };
    const cornice = (x0, y0, w, h, tipo) => { rett(x0, y0, w, 1, tipo); rett(x0, y0 + h - 1, w, 1, tipo); rett(x0, y0, 1, h, tipo); rett(x0 + w - 1, y0, 1, h, tipo); };

    // (1) IL BOSCO ATTORNO. v1.98: il cimitero era largo quanto tutta la mappa e per questo sembrava
    //     grande e vuoto. Adesso e' RACCOLTO: una fascia di vegetazione fitta e irregolare lo stringe da
    //     tutti i lati, e lo spazio calpestabile scende da ~2350 a ~1700 tessere, in linea con la caverna.
    const bordo = (x, y) => {
      const bx = Math.min(x, W - 1 - x), by = Math.min(y, H - 1 - y);
      const ondaX = 2.6 + Math.sin(x * 0.31 + 1.7) * 1.4 + Math.sin(x * 0.11) * 1.1;
      const ondaY = 2.6 + Math.cos(y * 0.27 + 0.9) * 1.4 + Math.sin(y * 0.13) * 1.1;
      return bx < ondaX + (rng() < 0.25 ? 1 : 0) || by < ondaY + (rng() < 0.25 ? 1 : 0);
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bordo(x, y)) set(x, y, M_ALBERO);

    // il rettangolo che resta dentro al bosco: e' il cimitero vero, ed e' su questo che si lavora
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!pieno(x, y)) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    x0 += 1; y0 += 1; x1 -= 1; y1 -= 1;
    const CW = x1 - x0 + 1, CH = y1 - y0 + 1;

    // (2) IL MURO DI CINTA, dentro il bosco. Tre-quattro brecce: e' un recinto, non una scatola.
    cornice(x0, y0, CW, CH, M_CINTA);
    for (let b = 0, n = ri(3, 4); b < n; b++) {
      const lato = ri(0, 3), lung = ri(4, 7);
      if (lato === 0) vuota(x0 + ri(4, Math.max(5, CW - 10)), y0, lung, 1);
      else if (lato === 1) vuota(x0 + ri(4, Math.max(5, CW - 10)), y1, lung, 1);
      else if (lato === 2) vuota(x0, y0 + ri(4, Math.max(5, CH - 10)), 1, lung);
      else vuota(x1, y0 + ri(4, Math.max(5, CH - 10)), 1, lung);
    }

    // (3) LE CAPPELLE. Nel riferimento sono POCHE e GROSSE — tre o quattro edifici che si vedono da
    //     lontano — non tanti mausolei uguali. Ognuna ha la sua camera, la sua porta, e a volte un
    //     tramezzo dentro: cosi' entrarci vuol dire qualcosa.
    const occupato = [];
    const liberoPer = (x, y, w, h, pad) => {
      if (x < x0 + 1 || y < y0 + 1 || x + w > x1 || y + h > y1) return false;
      for (const o of occupato) if (x < o.x + o.w + pad && x + w + pad > o.x && y < o.y + o.h + pad && y + h + pad > o.y) return false;
      return true;
    };
    const cappelle = [];
    for (let k = 0, tent = 0; k < ri(3, 4) && tent < 200; tent++) {
      const w = ri(8, 12), h = ri(6, 9);
      const x = x0 + 1 + ri(0, Math.max(0, CW - w - 3)), y = y0 + 1 + ri(0, Math.max(0, CH - h - 3));
      if (!liberoPer(x, y, w, h, 4)) continue;
      cornice(x, y, w, h, M_PIETRA);
      vuota(x + 1, y + 1, w - 2, h - 2);
      const lato = ri(0, 3);
      if (lato === 0) vuota(x + (w / 2 | 0) - 1, y, 2, 1);
      else if (lato === 1) vuota(x + (w / 2 | 0) - 1, y + h - 1, 2, 1);
      else if (lato === 2) vuota(x, y + (h / 2 | 0) - 1, 1, 2);
      else vuota(x + w - 1, y + (h / 2 | 0) - 1, 1, 2);
      if (w >= 10 && rng() < 0.55) { const mx = x + (w / 2 | 0); rett(mx, y + 1, 1, h - 2, M_PIETRA); libera(mx, y + ri(1, h - 2)); }
      occupato.push({ x, y, w, h }); cappelle.push({ x, y, w, h }); k++;
    }

    // (4) I CAMPI DI LAPIDI. Nel riferimento le lapidi non sono sparse su tutto: stanno in BLOCCHI FITTI,
    //     e fra un blocco e l'altro c'e' terra battuta. Un blocco e' una griglia serrata (passo 2 in tutte
    //     e due le direzioni): dentro ci si infila, ma il tiro lungo non passa. E' li' che si combatte.
    let lapidi = 0;
    for (let k = 0, tent = 0; k < ri(9, 13) && tent < 1200; tent++) {
      // i campi si rimpiccioliscono man mano che lo spazio si riempie: meglio quattro campi piccoli
      // che nessun campo grande. Sotto le 3 colonne non e' piu' un campo, e si smette.
      const stretto = tent > 300, cols = stretto ? ri(3, 4) : ri(4, 7), righe = stretto ? ri(2, 3) : ri(3, 5);
      const w = cols * 2 + 1, h = righe * 2 + 1;
      const x = x0 + 1 + ri(0, Math.max(0, CW - w - 3)), y = y0 + 1 + ri(0, Math.max(0, CH - h - 3));
      if (!liberoPer(x, y, w, h, 1)) continue;   // fra un campo e l'altro basta un passo: e' un cimitero, non un parco
      const vecchio = rng() < 0.35;                       // un campo su tre e' abbandonato: file storte e sdentate
      for (let r = 0; r < righe; r++) for (let c = 0; c < cols; c++) {
        if (vecchio && rng() < 0.3) continue;
        const jx = vecchio && rng() < 0.35 ? (rng() < 0.5 ? -1 : 0) : 0;
        const px = x + 1 + c * 2 + jx, py = y + 1 + r * 2;
        if (pieno(px, py)) continue;
        set(px, py, M_LAPIDE); lapidi++;
      }
      occupato.push({ x, y, w, h }); k++;
    }

    // (5) I MURETTI BASSI. Nel riferimento delimitano aree dentro il cimitero — un recinto qui, un
    //     tratto di muro caduto la'. Servono al gioco piu' delle lapidi: sono COPERTURA lunga, quella
    //     dietro cui ci si mette davvero.
    for (let k = 0, n = ri(5, 8); k < n; k++) {
      const orizz = rng() < 0.5, lung = ri(6, 14);
      const x = x0 + 2 + ri(0, Math.max(0, CW - 5)), y = y0 + 2 + ri(0, Math.max(0, CH - 5));
      for (let i = 0; i < lung; i++) {
        const xx = orizz ? x + i : x, yy = orizz ? y : y + i;
        if (xx >= x1 || yy >= y1) break;
        if (rng() < 0.18) continue;                        // il muretto e' crollato a tratti
        if (!pieno(xx, yy)) set(xx, yy, M_PIETRA);
      }
    }
    // e un recinto chiuso, come quello che nel riferimento circonda le tombe di riguardo
    for (let tent = 0; tent < 60; tent++) {
      const w = ri(9, 14), h = ri(7, 10);
      const x = x0 + 2 + ri(0, Math.max(0, CW - w - 4)), y = y0 + 2 + ri(0, Math.max(0, CH - h - 4));
      if (!liberoPer(x, y, w, h, 1)) continue;   // fra un campo e l'altro basta un passo: e' un cimitero, non un parco
      cornice(x, y, w, h, M_PIETRA);
      for (let b = 0; b < 3; b++) {                        // tre aperture: e' un recinto, si entra
        const lato = ri(0, 3);
        if (lato === 0) vuota(x + ri(1, w - 3), y, 2, 1);
        else if (lato === 1) vuota(x + ri(1, w - 3), y + h - 1, 2, 1);
        else if (lato === 2) vuota(x, y + ri(1, h - 3), 1, 2);
        else vuota(x + w - 1, y + ri(1, h - 3), 1, 2);
      }
      for (let r = y + 2; r < y + h - 2; r += 2) for (let c = x + 2; c < x + w - 2; c += 2)
        if (!pieno(c, r) && rng() < 0.75) { set(c, r, M_LAPIDE); lapidi++; }
      occupato.push({ x, y, w, h });
      break;
    }

    // (6) ALBERI SECCHI a gruppetti, e qualche fossa scavata che rompe l'ordine.
    for (let k = 0, n = ri(6, 10); k < n; k++) {
      const cx = x0 + 2 + ri(0, Math.max(0, CW - 5)), cy = y0 + 2 + ri(0, Math.max(0, CH - 5));
      for (let j = 0, m = ri(1, 3); j < m; j++) {
        const x = cx + ri(-2, 2), y = cy + ri(-2, 2);
        if (x <= x0 || y <= y0 || x >= x1 || y >= y1) continue;
        if (!pieno(x, y)) set(x, y, M_ALBERO);
      }
    }
    for (let k = 0, n = ri(2, 3); k < n; k++) {
      const cx = x0 + 4 + ri(0, Math.max(0, CW - 9)), cy = y0 + 4 + ri(0, Math.max(0, CH - 9)), r = ri(2, 4);
      for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
        const d = Math.hypot(x - cx, y - cy) + rng() * 0.9;
        if (d <= r && pieno(x, y) && (muri[idx(x, y)] === M_LAPIDE || muri[idx(x, y)] === M_ALBERO)) libera(x, y);
      }
    }

    const camere = cappelle.length ? cappelle.map(c => ({ x: c.x + c.w / 2, y: c.y + c.h / 2 }))
      : [{ x: (x0 + x1) / 2, y: (y0 + y1) / 2 }];
    camere.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2 });
    return { g, camere, archetipo: 'cimitero', muri, lapidi };
  }


  // ===================== v1.99 — LA CALDERA (ondate 10 e 20: i due boss) =====================
  // Perche' esiste: le due ondate dei boss si giocavano in una caverna come tutte le altre. Qui invece
  // il posto dice da solo che ondata e': una conca larga, il cielo di roccia attorno, e in mezzo la
  // FAGLIA aperta. Non e' costruita da nessuno — e' successa.
  //
  // La cosa importante e' che non serve una riga di renderer: gli speroni e la cresta sono ROCCIA come
  // quella della caverna (la cottura li disegna gia'), e le crepe sono T_HAZARD, cioe' le pozze di
  // pericolo che il motore ha dalla v1.62 — con il loro danno, il loro disegno e il loro suono.
  // Il pavimento della caldera fa male a chi ci cammina sopra: al giocatore E ai mostri, boss compreso.
  function piantaCaldera(rng) {
    const rr = (a, b) => a + rng() * (b - a), ri = (a, b) => Math.floor(rr(a, b + 1));
    const g = new Uint8Array(W * H).fill(C.T_WALL);
    const set = (x, y, v) => { if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g[idx(x, y)] = v; };
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? C.T_WALL : g[idx(x, y)];

    const cx = W / 2 + rr(-1.5, 1.5), cy = H / 2 + rr(-1, 1);
    const RX = 28, RY = 19.5;
    const f1 = rr(0, 6.283), f2 = rr(0, 6.283), f3 = rr(0, 6.283);
    // il bordo ondeggia su tre frequenze: e' un crollo, non un cerchio
    const raggio = (a) => 1 + Math.sin(a * 2 + f1) * 0.10 + Math.sin(a * 3 - f2) * 0.07 + Math.sin(a * 5 + f3) * 0.045;

    // (1) LA CONCA
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x - cx) / RX, dy = (y - cy) / RY, a = Math.atan2(dy, dx);
      if (Math.hypot(dx, dy) <= raggio(a) * 0.92) set(x, y, C.T_FLOOR);
    }

    // (2) L'ARENA E' SGOMBRA. v1.99.1: qui c'erano una CRESTA di roccia a meta' pendio e dieci-quattordici
    //     SPERONI sparsi nella conca. Erano coperture per il giocatore, ma per un boss di raggio 38-52
    //     erano trappole: ci si incastrava. In un'ondata di boss lo spazio libero vale piu' della
    //     copertura — il combattimento e' fatto di distanza e di tempo, non di ripari.
    //     Resta solo qualche masso ADDOSSATO al bordo, che frastaglia il perimetro senza mettere niente
    //     in mezzo: nessun ostacolo isolato dentro l'arena, per costruzione.
    {
      const messi = [];
      for (let k = 0, tent = 0; k < ri(6, 10) && tent < 300; tent++) {
        const a = rr(0, 6.283);
        const rBordo = raggio(a) * 0.92;
        const d = rBordo - rr(0.02, 0.07);              // appena dentro il bordo, mai al centro
        const x = cx + Math.cos(a) * RX * d, y = cy + Math.sin(a) * RY * d;
        let male = false;
        for (const m of messi) if (Math.hypot(x - m.x, y - m.y) < 6) { male = true; break; }
        if (male) continue;
        const rx = 1.2 + rr(0, 2.0), ry = 1.1 + rr(0, 1.5);
        for (let py = Math.round(y - ry - 1); py <= y + ry + 1; py++) for (let px = Math.round(x - rx - 1); px <= x + rx + 1; px++) {
          const dd = Math.hypot((px - x) / rx, (py - y) / ry) + rr(0, 0.25);
          if (dd <= 1 && at(px, py) === C.T_FLOOR) set(px, py, C.T_WALL);
        }
        messi.push({ x, y }); k++;
      }
    }

    // (4) LE CREPE DELLA FAGLIA non si scavano qui. Le pozze di pericolo hanno due regole loro, dalla
    //     v1.62, e sono giuste: non devono MAI toccare un muro (se no chiudono un passaggio invece di
    //     costringerti a scegliere) e non devono nascere addosso alla partenza. Tutte e due si possono
    //     controllare solo dopo, quando la partenza e' stata scelta: le crepe si aprono li', in generate().
    // le camere: il centro (dove nasce il boss) piu' quattro punti a meta' raggio, per le decorazioni
    const camere = [{ x: cx, y: cy }];
    for (let k = 0; k < 4; k++) { const a = rr(0, 6.283) + k * 1.57; camere.push({ x: cx + Math.cos(a) * RX * 0.45, y: cy + Math.sin(a) * RY * 0.45 }); }
    return { g, camere, archetipo: 'caldera' };
  }

  // `forzaCim` accende il cimitero comunque, e serve a UNA cosa sola: dalla v2.9.1 la pianta e' in
  // stand-by (`CIMITERO_FINO_A: 0`) e senza questo appiglio nessun test la genererebbe piu'. Una pianta
  // che non viene piu' generata da nessuno marcisce in silenzio, e quando la si riaccende non funziona.
  function generate(seed, level, forzaCim) {
    const rng = MU.seedRng(seed >>> 0); const rint = (a, b) => Math.floor(a + rng() * (b - a + 1));
    let theme = THEMES[Math.floor(rng() * THEMES.length)];
    const TILE = C.TILE, cxm = W >> 1, cym = H >> 1;
    // v1.22 — CONFORMAZIONE ORGANICA (caverna varia, non "piatta"): blob di muro + connettivita garantita
    // v1.76 — la pianta arriva da piantaCaverna(): caverna scavata + masse a scolpire le camere,
    // con zero tessere-strozzatura garantite. Il vecchio blocco (massi a caso + apertura dei muri
    // per connettivita') stava qui e produceva sempre la stessa mappa: e' scritto sopra il perche'.
    // v1.97 — DUE PIANTE, NON PIU' UNA. Le prime due ondate si giocano in un CIMITERO (settori, vialetti,
    // file di lapidi); dalla terza in poi torna la caverna di sempre. Il punto non e' la varieta' per la
    // varieta': e' che le prime due ondate sono quelle in cui il giocatore si fa un'idea del gioco, e
    // aprire dentro una grotta o dentro un camposanto non e' la stessa promessa.
    const _cim = !!forzaCim || level <= (C.CIMITERO_FINO_A || 0);
    // v1.99 — le ondate dei boss (10 e 20) si giocano nella CALDERA. E un elenco, non un confronto:
    // aggiungere o togliere un ondata e cambiare un numero in constants.
    const _cal = !_cim && (C.CALDERA_ONDATE || []).indexOf(level) >= 0;
    const _p = _cim ? piantaCimitero(rng) : _cal ? piantaCaldera(rng) : piantaCaverna(rng, level);
    const grid = _p.g; const camere = _p.camere; const archetipo = _p.archetipo;
    // il tipo di ogni tessera-muro (lapide, pietra squadrata, cinta, albero): lo legge SOLO il renderer.
    // La griglia resta binaria, quindi collisioni, linea di vista e campo di flusso non sanno niente di
    // tutto questo — ed e' il motivo per cui il cimitero non tocca una riga di IA.
    const muriTipo = _p.muri || null;
    // il cimitero non si gioca dentro un vulcano: dei cinque temi restano i quattro che gli somigliano,
    // e la zona prende un nome suo — quello che compare in alto a sinistra quando la mappa nasce.
    if (_cim) {
      const adatti = THEMES.filter(t => t.id !== 'lava');
      const t = adatti[Math.floor(rng() * adatti.length)];
      const nomi = { crypt: 'Il Vecchio Camposanto', forest: 'Il Cimitero Sommerso', ice: 'Il Campo di Gelo', arcane: 'Il Sepolcreto Arcano' };
      theme = Object.assign({}, t, { name: nomi[t.id] || 'Il Vecchio Camposanto' });
    }
    // la caldera prende un nome suo, e non si gioca in mezzo agli alberi: via la foresta.
    if (_cal) {
      const adatti = THEMES.filter(t => t.id !== 'forest');
      const t = adatti[Math.floor(rng() * adatti.length)];
      theme = Object.assign({}, t, { name: level >= 20 ? 'La Faglia Aperta' : 'La Caldera' });
    }
    let seen;   // la usa il blocco di sicurezza qui sotto (murare le sacche staccate)
    // v1.97 — QUESTE TRE FUNZIONI SONO SCRITTE PER LA CAVERNA, e sul cimitero fanno danno.
    // widenForBoss() allarga ogni corridoio stretto e togliStrozzature() toglie gli imbuti: una LAPIDE
    // isolata in mezzo a un vialetto e' esattamente un imbuto, quindi la prima passata se ne mangiava
    // l'85% (misurato: da 155 lapidi a 19). Nel cimitero il passaggio e' garantito per COSTRUZIONE — i
    // vialetti fra i settori sono larghi 3-4 tessere e nessun settore tocca la cinta — quindi qui non
    // servono. Resta allargaPerBoss(), che non demolisce niente a caso: scava solo se il grafo delle
    // celle larghe e' spezzato, e sul cimitero non lo e' mai. Ed e' la rete di sicurezza che serve.
    // la caldera sta con il cimitero: il passaggio e garantito per costruzione (i varchi della cresta
    // sono larghi), e widenForBoss() le mangerebbe gli speroni, che sono le uniche coperture che ha.
    if (!_cim && !_cal) { widenForBoss(grid); allargaPerBoss(grid); }
    else allargaPerBoss(grid);
    ({ seen } = floodReach(grid)); for (let i = 0; i < grid.length; i++) if (grid[i] !== C.T_WALL && !seen[i]) grid[i] = C.T_WALL;
    if (!_cim && !_cal) togliStrozzature(grid); // v1.76 — e questa e' l'ultima parola: zero imbuti, misurato dai test
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
      // v1.99.1 — QUI C'ERANO LE CREPE DELLA CALDERA: pozze di pericolo a raggiera dal centro.
      // Tolte in v1.99.2. Non per un difetto tecnico — funzionavano — ma perche' in mezzo all'arena
      // facevano un brutto effetto: una macchia arancione larga meta' conca. Al loro posto, piu' sotto,
      // c'e' lo STRATO DI ORNAMENTI: sassi, bracieri, ossa. Sono decorazioni vere (le disegna il
      // renderer, non toccano ne' la griglia ne' le collisioni), quindi l'arena resta sgombra come
      // l'ha voluta la v1.99.1 e il boss continua a girarci senza incastrarsi.
      // nella caldera NESSUNA pozza, nemmeno le normali: e' un'arena da boss, si legge sgombra.
      const pools = _cal ? 0 : Math.max(0, Math.round((1.6 + Math.min(2.4, level * 0.16)) * (theme.hazMul || 1)));
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
    // v2.21 — URNE E BARILI NON SONO DECORAZIONE. Si rompono, quindi devono poter SPARIRE: se finissero
    // fra i props verrebbero cotti una volta sola nel fondo della mappa e resterebbero disegnati anche
    // dopo essere stati distrutti. Escono di qui e diventano entita' del server, come le casse.
    const rompibili = [];
    const ROMPIBILE = { urna: 1, barile: 1 };
    const putW = (type, wx, wy, s) => { if (type !== 'torch') { if ((pcnt[type] || 0) >= CAP) return false; pcnt[type] = (pcnt[type] || 0) + 1; }
      if (ROMPIBILE[type]) { rompibili.push({ tipo: type, x: wx, y: wy, s: s || MU.rand(0.9, 1.15) }); return true; }
      props.push({ type, x: wx, y: wy, s: s || MU.rand(0.9, 1.15), r: rng() }); return true; };
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
      // v2.21 — LE SCENE ESCLUSIVE, due per tema. Fino alla v2.20.3 delle 24 scene ne esisteva UNA sola
      // che appartenesse a un tema solo (la `fungaia` della foresta): tutte le altre erano condivise da
      // due, tre o quattro temi. Per questo lava, ghiaccio e arcano non avevano niente che parlasse di
      // loro, e il colore della roccia da solo non bastava a distinguerli. Queste dieci non vanno MAI
      // aggiunte a piu' di un tema: e' tutto il loro scopo.
      sepolcreto(c) { const n = 2 + rint(0, 1); for (let j = 0; j < n; j++) putC('loculo', c, (j - (n - 1) / 2) * 44, MU.rand(-6, 6), MU.rand(0.95, 1.15)); if (rng() < 0.7) putC('urna', c, MU.rand(-26, 26), 26, MU.rand(0.9, 1.1)); if (rng() < 0.5) putC('bones', c, MU.rand(-20, 20), -24, 1); },
      veglia(c) { putC('catafalco', c, 0, 0, MU.rand(1.0, 1.15)); putC('candelabra', c, -30, 10, 1); if (rng() < 0.7) putC('candelabra', c, 30, 10, 1); if (rng() < 0.5) putC('urna', c, MU.rand(-16, 16), -26, 0.95); },
      colata_lavica(c) { const n = 2 + rint(0, 1); for (let j = 0; j < n; j++) { const a = rng() * 6.28, dd = rng() * 34; putC('colata', c, Math.cos(a) * dd, Math.sin(a) * dd, MU.rand(0.95, 1.3)); } if (rng() < 0.7) putC('sfiatatoio', c, MU.rand(-26, 26), 24, 1); },
      fumarole(c) { const n = 2 + rint(0, 1); for (let j = 0; j < n; j++) putC('sfiatatoio', c, (j - (n - 1) / 2) * 38, MU.rand(-8, 8), MU.rand(0.9, 1.2)); if (rng() < 0.6) putC('colata', c, MU.rand(-24, 24), 24, 1); },
      boschetto(c) { putC('tronco', c, 0, 0, MU.rand(1.0, 1.2)); const n = 2 + rint(0, 1); for (let j = 0; j < n; j++) { const a = rng() * 6.28, dd = 24 + rng() * 20; putC('felce', c, Math.cos(a) * dd, Math.sin(a) * dd, MU.rand(0.9, 1.25)); } },
      radici(c) { putC('radice', c, 0, 0, MU.rand(1.0, 1.2)); const n = 1 + rint(0, 1); for (let j = 0; j < n; j++) putC('felce', c, (j ? 28 : -28), MU.rand(-10, 16), MU.rand(0.9, 1.1)); if (rng() < 0.5) putC('rubble', c, MU.rand(-24, 24), 24, 0.95); },
      assideramento(c) { putC('congelato', c, 0, 0, MU.rand(1.0, 1.2)); const n = 1 + rint(0, 1); for (let j = 0; j < n; j++) putC('ghiacciolo', c, (j ? 30 : -30), MU.rand(-8, 10), MU.rand(0.9, 1.15)); if (rng() < 0.5) putC('bones', c, MU.rand(-20, 20), 26, 1); },
      gelicidio(c) { const n = 3 + rint(0, 1); for (let j = 0; j < n; j++) { const a = rng() * 6.28, dd = rng() * 38; putC('ghiacciolo', c, Math.cos(a) * dd, Math.sin(a) * dd, MU.rand(0.85, 1.25)); } },
      rituale(c) { putC('cerchio', c, 0, 0, MU.rand(1.0, 1.25)); if (rng() < 0.6) putC('skull', c, MU.rand(-30, 30), 30, 1); if (rng() < 0.5) putC('candelabra', c, 34, -6, 1); },
      studio(c) { putC('leggio', c, 0, 0, MU.rand(1.0, 1.15)); if (rng() < 0.7) putC('candelabra', c, -28, 6, 1); if (rng() < 0.5) putC('cerchio', c, MU.rand(-14, 14), 30, 0.8); },
    };
    // v1.23 — bag di feature per TEMA (coerenza) — poi mescolate e piazzate col cap 3-4 per tipo
    const themeFeats = {
      crypt: ['sepolcreto', 'veglia', 'cimitero', 'ossario', 'ragnatela', 'macerie', 'altare', 'gabbia', 'catacomba', 'rovine', 'patibolo', 'massacro', 'illuminata', 'discesa', 'cisterna', 'passaggio', 'reliquiario'],
      lava: ['colata_lavica', 'fumarole', 'stalagmiti', 'cristalli', 'macerie', 'ossario', 'deposito', 'catacomba', 'grotta', 'rovine', 'santuario', 'massacro', 'officina', 'passaggio', 'geode', 'discesa'],
      forest: ['boschetto', 'radici', 'fungaia', 'ragnatela', 'macerie', 'ossario', 'cimitero', 'catacomba', 'rovine', 'grotta', 'patibolo', 'illuminata', 'cisterna', 'passaggio', 'discesa'],
      ice: ['assideramento', 'gelicidio', 'stalagmiti', 'cristalli', 'macerie', 'ossario', 'gabbia', 'ragnatela', 'grotta', 'rovine', 'santuario', 'illuminata', 'geode', 'passaggio', 'cisterna', 'reliquiario'],
      arcane: ['rituale', 'studio', 'altare', 'cristalli', 'cimitero', 'ragnatela', 'deposito', 'catacomba', 'santuario', 'grotta', 'illuminata', 'massacro', 'geode', 'reliquiario', 'officina', 'discesa'],
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
          { const tp = bag[(rng() * bag.length) | 0], px = wcx(c) + MU.rand(-10, 10), py = wcy(c) + MU.rand(-10, 10), ps = MU.rand(0.62, 0.9);
            if (ROMPIBILE[tp]) rompibili.push({ tipo: tp, x: px, y: py, s: ps });
            else props.push({ type: tp, x: px, y: py, s: ps, r: rng() }); }
          put.push(c);
        }
      }
    }
    // micro-aree per il mercante = alcuni spot usati
    const microAreas = used.slice(0, 6).map(c => ({ x: wcx(c), y: wcy(c) }));
    // BRACIERI sparsi (luce), in celle aperte: max CAP
    { let open = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > 4 && !nearWall(c)); for (let z = open.length - 1; z > 0; z--) { const j = (rng() * (z + 1)) | 0; const t = open[z]; open[z] = open[j]; open[j] = t; } let bx = 0; for (const c of open) { if (bx >= 3 + rint(0, 1)) break; if (used.every(u => Math.hypot(u.x - c.x, u.y - c.y) > 4)) { putC('brazier', c, 0, 0, 1.05); used.push(c); bx++; } } }
    // v1.99.2 — GLI ORNAMENTI DELLA CALDERA. L'arena e' sgombra dalla v1.99.1 (il boss ci si incastrava),
    // ma sgombra non vuol dire vuota: senza niente in mezzo la conca sembrava una padella. Prima ci
    // stavano le crepe della faglia — pozze di pericolo — e facevano un effetto brutto; adesso ci stanno
    // SASSI, BRACIERI e OSSA. Sono props, cioe' disegno puro: il renderer li disegna, la griglia non li
    // conosce, le collisioni e il campo di flusso nemmeno. Quindi arredano senza togliere una tessera di
    // spazio al boss — che era tutto il punto della v1.99.1.
    // Vanno cercati LONTANO dai muri (il contrario di tutte le altre decorazioni, che stanno in nicchia):
    // qui il vuoto da riempire e' il centro.
    if (_cal) {
      let apert = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > 7 && !nearWall(c));
      for (let z = apert.length - 1; z > 0; z--) { const j = (rng() * (z + 1)) | 0; const t = apert[z]; apert[z] = apert[j]; apert[j] = t; }
      const orn = [];
      const libero = (c, d) => used.every(u => Math.hypot(u.x - c.x, u.y - c.y) > 3) && orn.every(u => Math.hypot(u.x - c.x, u.y - c.y) > d);
      const metti = (type, c, dx, dy, s) => props.push({ type, x: wcx(c) + dx, y: wcy(c) + dy, s, r: rng() });
      const sassi = ['rock', 'rockSmall', 'rockSmall', 'stalagmite'];
      let bracieri = 0, gruppi = 0;
      const quanti = 16 + rint(0, 7), maxBracieri = 3 + rint(0, 1);
      for (const c of apert) {
        if (gruppi >= quanti) break;
        if (!libero(c, 4)) continue;
        const sorte = rng();
        if (sorte < 0.20 && bracieri < maxBracieri) {
          // il braciere: una luce in mezzo al niente, con due sassi ai piedi. E' quello che da' un
          // fuoco a cui girare intorno mentre il boss carica.
          metti('brazier', c, 0, 0, MU.rand(0.95, 1.1));
          for (let j = 0, n = 1 + rint(0, 1); j < n; j++) { const a = rng() * 6.28; metti('rockSmall', c, Math.cos(a) * (26 + rng() * 12), Math.sin(a) * (22 + rng() * 10), MU.rand(0.6, 0.85)); }
          bracieri++;
        } else if (sorte < 0.42) {
          // le OSSA: chi e' venuto qui prima di te. Un corpo o una pila di teschi, e intorno quello che resta.
          metti(rng() < 0.5 ? 'corpse' : 'skullpile', c, MU.rand(-8, 8), MU.rand(-6, 6), MU.rand(0.8, 1.05));
          for (let j = 0, n = 1 + rint(0, 2); j < n; j++) { const a = rng() * 6.28, dd = 18 + rng() * 26; metti(rng() < 0.5 ? 'bones' : 'skull', c, Math.cos(a) * dd, Math.sin(a) * dd, MU.rand(0.7, 1.0)); }
        } else if (sorte < 0.60) {
          metti('rubble', c, MU.rand(-6, 6), MU.rand(-6, 6), MU.rand(0.75, 1.0));
          if (rng() < 0.6) metti('rockSmall', c, MU.rand(-30, 30), MU.rand(-24, 24), MU.rand(0.6, 0.85));
        } else {
          // i SASSI: il pulviscolo della conca. Piccoli — scala 0.5-0.85 — perche' devono leggersi come
          // terreno, non come coperture: se sembrano ostacoli il giocatore ci si nasconde dietro e scopre
          // che non riparano da niente.
          for (let j = 0, n = 2 + rint(0, 2); j < n; j++) { const a = rng() * 6.28, dd = rng() * 34; metti(sassi[(rng() * sassi.length) | 0], c, Math.cos(a) * dd, Math.sin(a) * dd, MU.rand(0.5, 0.85)); }
        }
        orn.push(c); gruppi++;
      }
    }

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
    // ===== v2.21 — IL RIPOSTIGLIO E LA LEVA ==========================================
    // Un vano chiuso da una grata, e da qualche parte la catena che la apre.
    // La regola che rende la cosa SICURA: il vano non si ricava da spazio esistente, si SCAVA nella
    // roccia piena. Cosi' aprirlo o non aprirlo non puo' in nessun caso tagliare in due la mappa —
    // che e' il modo in cui una porta a gioco in corso rompe di solito il campo di flusso. Tutto il
    // resto viene da se': il campo di flusso si ricostruisce ogni 0,12 s dalla griglia, e collisioni
    // e linea di vista leggono la griglia a ogni chiamata. Cambiata quella, sono cambiate tutte.
    const grate = [], leve = [];
    {
      const pieno = (x, y) => x > 1 && y > 1 && x < W - 2 && y < H - 2 && grid[idx(x, y)] === C.T_WALL;
      const DIR = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      let cand2 = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > 6);
      for (let z = cand2.length - 1; z > 0; z--) { const j = (rng() * (z + 1)) | 0; const t = cand2[z]; cand2[z] = cand2[j]; cand2[j] = t; }
      let fatto = null;
      for (const c of cand2) {
        if (fatto) break;
        for (let d = 0; d < 4 && !fatto; d++) {
          const dx = DIR[d][0], dy = DIR[d][1];
          const px = dx ? dy : 1, py = dx ? 1 : 0;              // versore perpendicolare alla direzione
          const qx = dx ? 0 : 1, qy = dx ? 1 : 0;
          const porta = { x: c.x + dx, y: c.y + dy };
          if (!pieno(porta.x, porta.y)) continue;
          // Il vano e' 3x3, ma NON basta che quelle nove tessere siano roccia: va chiesto che sia piena
          // anche la CONCHIGLIA attorno (5 di profondita' per 5 di larghezza, porta esclusa). Il primo
          // giro controllava solo le nove: in 195 mappe su 300 il vano toccava di fianco un corridoio
          // gia' esistente, quindi il premio si raggiungeva senza mai tirare la leva — e la grata non
          // chiudeva niente. Con la conchiglia il vano e' scavato nel pieno e l'unica via e' la porta.
          let ok = true;
          for (let p = 1; p <= 5 && ok; p++) for (let q = -2; q <= 2 && ok; q++) {
            if (p === 1 && q === 0) continue;                       // la porta: e' roccia gia' verificata
            const sx2 = c.x + dx * p + qx * q, sy2 = c.y + dy * p + qy * q;
            if (!pieno(sx2, sy2)) ok = false;
          }
          if (!ok) continue;
          const vano = [];
          for (let p = 2; p <= 4; p++) for (let q = -1; q <= 1; q++)
            vano.push({ x: c.x + dx * p + qx * q, y: c.y + dy * p + qy * q });
          for (const v of vano) grid[idx(v.x, v.y)] = C.T_FLOOR;   // si scava
          const centro = vano[4];
          grate.push({ id: grate.length, tiles: [idx(porta.x, porta.y)],
            x: porta.x * TILE + TILE / 2, y: porta.y * TILE + TILE / 2,
            premio: { x: centro.x * TILE + TILE / 2, y: centro.y * TILE + TILE / 2 } });
          fatto = { porta, c };
        }
      }
      // la leva: sul pavimento vero, non troppo vicina alla grata (deve costare un giro) ne' troppo
      // lontana (deve poterla trovare senza setacciare la mappa)
      if (fatto) {
        const gx = fatto.porta.x, gy = fatto.porta.y;
        let best = null, bd = 1e9;
        for (const c of cand2) {
          const d2 = Math.hypot(c.x - gx, c.y - gy);
          if (d2 < 7 || d2 > 22) continue;
          const pun = Math.abs(d2 - 13);
          if (pun < bd) { bd = pun; best = c; }
        }
        if (!best) best = cand2.find(c => Math.hypot(c.x - gx, c.y - gy) > 4) || null;
        if (best) leve.push({ id: 0, gid: 0, x: wcx(best), y: wcy(best) });
        else { for (const t of grate[0].tiles) grid[t] = C.T_FLOOR; grate.length = 0; }  // senza leva niente grata
      }
    }
    // v2.21 — i BARILI: pochi, sparsi, lontani dalla partenza. Due o tre per mappa bastano: sono una
    // scelta tattica, non un tappeto di mine.
    {
      let apc = free.filter(c => grid[c.i] === C.T_FLOOR && c.cd > 6);
      for (let z = apc.length - 1; z > 0; z--) { const j = (rng() * (z + 1)) | 0; const t = apc[z]; apc[z] = apc[j]; apc[j] = t; }
      const messi = [];
      for (const c of apc) {
        if (messi.length >= 2 + rint(0, 1)) break;
        if (!messi.every(u => Math.hypot(u.x - c.x, u.y - c.y) > 8)) continue;
        rompibili.push({ tipo: 'barile', x: wcx(c) + MU.rand(-8, 8), y: wcy(c) + MU.rand(-8, 8), s: MU.rand(0.95, 1.1) });
        messi.push(c);
      }
      // v2.21 — le URNE. Dal tema cripta ne arrivavano una e mezza per mappa, e solo li': su lava,
      // ghiaccio, foresta e arcano il giocatore non avrebbe mai imparato che gli oggetti si rompono.
      // Queste sono l'insegnamento, e stanno su tutte le mappe.
      const urne = [];
      for (const c of apc) {
        if (urne.length >= 3 + rint(0, 2)) break;
        if (!messi.every(u => Math.hypot(u.x - c.x, u.y - c.y) > 3)) continue;
        if (!urne.every(u => Math.hypot(u.x - c.x, u.y - c.y) > 6)) continue;
        rompibili.push({ tipo: 'urna', x: wcx(c) + MU.rand(-9, 9), y: wcy(c) + MU.rand(-9, 9), s: MU.rand(0.9, 1.1) });
        urne.push(c);
      }
    }
    return { w: W, h: H, tile: TILE, seed, level, theme, archetipo, camere, edgeField, muri: muriTipo ? Array.from(muriTipo) : null, grid: Array.from(grid), spawn: { x: wcx(start), y: wcy(start) }, exit: exit ? { x: exit.x, y: exit.y } : null, enemySpawns: spawnCells, crateSpawns, props, microAreas, rompibili, grate, leve };
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
  // ===================== IL VILLAGGIO SOTTERRANEO (v2.0) =====================
  // Fino alla v1.99 la sosta era una "Sala dei Mercanti": 34x26, cinque stanze attorno a una piazza e
  // niente altro. Funzionava, ma non era un posto: era un men— con dei muri. Adesso e' un VILLAGGIO DI
  // NANI scavato nella roccia — 56x40, il doppio abbondante — e la differenza non e' la dimensione: e'
  // che qui ci vive qualcuno. Le botteghe sono edifici separati, e attorno ci sono le CASE, con la porta
  // aperta, il focolare acceso in mezzo, il letto, e la gente dentro.
  //
  // Tre regole che tengono in piedi la pianta, e che vanno rispettate se un giorno la si allarga:
  //  1) IL PORTALE E' AL CENTRO. Non e' una porta in fondo a un corridoio: e' il primo che vedi quando
  //     arrivi, e ci torni quando hai finito. Tutto il resto gli sta attorno.
  //  2) OGNI PORTA E' LARGA DUE TESSERE. Il personaggio e' largo 35 px su tessere da 48: con una sola
  //     tessera ci si passa sfregando lo stipite (imparato nella v1.75.1).
  //  3) FUORI DAL VILLAGGIO C'E' ROCCIA, E POI IL NERO. Non c'e' un "bordo mappa": c'e' la montagna.
  // ============================================================================================
  // v2.6 — LA PIANTA NUOVA: DUE FILE DI EDIFICI E UNA PIAZZA IN MEZZO
  // ============================================================================================
  // La pianta della v2.0 era una sala con delle stanze appese dove capitava: si leggeva come un livello,
  // non come un paese. Questa e' costruita sull'unica cosa che rende un villaggio riconoscibile
  // dall'alto: DUE FILE DI CASE che si guardano, e in mezzo lo spazio comune.
  //
  //   x:  0..2   rocce          3..16  fila di PONENTE      17..19  via di ponente
  //      20..39  lo spiazzo (e dentro, la PIAZZA di terra)  40..42  via di levante
  //      43..56  fila di LEVANTE                            57..59  rocce
  //
  // Le due vie lunghe corrono davanti alle porte; la via alta e la via bassa le chiudono a nord e a sud.
  // Lo spiazzo in mezzo e' pavimento di grotta, e al suo centro la piazza e' TERRA BATTUTA: e' il
  // cambio di materiale a dire "qui ci si ferma", non un muretto.
  //
  // Ogni stanza dichiara la sua PORTA (tessera + lato). Prima la porta si indovinava dalla lista dei
  // varchi con un confronto di coordinate, e bastava spostare una stanza per far arredare una casa col
  // letto sulla soglia. Adesso la porta e' un dato della stanza: i varchi si generano da li', e
  // l'arredamento sa da che parte si entra senza doverlo dedurre.
  const VILLAGE = {
    w: 60, h: 46,
    // la PIAZZA: il rettangolo di terra battuta in mezzo allo spiazzo. Il falo' al centro, il pozzo di
    // fianco, e tutt'attorno il giro di torce e bancarelle.
    piazza: { x0: 22, y0: 13, x1: 37, y1: 30 },
    fire: { x: 29, y: 21 },
    pozzo: { x: 25, y: 25 },
    // v2.6 — IL PORTALE NON STA PIU' IN PIAZZA. Stava nel mezzo dello spiazzo, e uno spiazzo con un
    // buco viola al centro non e' una piazza: e' una sala del portale con delle case attorno. Adesso e'
    // dentro la CASA DEL PORTALE, la prima della fila di ponente, con due guardie sulla soglia.
    portale: { x: 9.5, y: 6.5 },
    exit: { x: 9.5, y: 6.5 },
    // v2.6 — si arriva sulla via di ponente, all'altezza della piazza: la piazza si apre a levante, la
    // fila delle botteghe corre a ponente e la casa del portale e' in fondo alla via. Non si atterra
    // addosso all'uscita — il portale adesso e' un posto dove si va, non un bottone sotto i piedi — ma
    // nemmeno dall'altra parte del paese: da qui sono una quindicina di tessere, tre secondi e mezzo.
    spawn: { x: 18, y: 21 },
    // le due guardie: ferme nella via, ai due lati della soglia. Scenografia, non mercanti.
    guardie: [{ x: 17.6, y: 5.4, face: 0 }, { x: 17.6, y: 8.6, face: 0 }],
    // LE STANZE. Rettangolo INTERNO: la roccia attorno e' il muro, e la porta si apre in quella roccia.
    //   kind 'bottega' = ci lavora un mercante · 'casa' = ci abita qualcuno · 'portale' = c'e' la faglia
    //   porta: [tessera x, tessera y, lato] — il lato e' quello da cui si ENTRA, visto dalla stanza
    rooms: [
      // ---- FILA DI PONENTE ----
      { id: 'portale', kind: 'portale', x0: 4, y0: 4,  x1: 15, y1: 9,  porta: [16, 6, 'e'], pav: 'lastre', col: '#4b3c45' },
      { id: 'taverna', kind: 'bottega', x0: 4, y0: 12, x1: 15, y1: 19, porta: [16, 15, 'e'], pav: 'legno',  col: '#5a422a' },
      { id: 'fucina',  kind: 'bottega', x0: 4, y0: 22, x1: 15, y1: 29, porta: [16, 25, 'e'], pav: 'lastre', col: '#50382a' },
      // v2.19 — ERA `casa_a`. Al suo posto la BOTTEGA DELL'ARCIERE: sta sotto la fucina, sulla stessa
      // via, perche' le due botteghe dove si compra da combattere stiano dalla stessa parte del paese e
      // si faccia un giro solo. Pavimento di terra battuta: e' un cortile da tiro, non un'officina.
      { id: 'archeria', kind: 'bottega', x0: 4, y0: 32, x1: 15, y1: 36, porta: [16, 34, 'e'], pav: 'terra', col: '#3d4a2c' },
      { id: 'casa_b',  kind: 'casa',    x0: 4, y0: 39, x1: 15, y1: 42, porta: [16, 40, 'e'], pav: 'legno',  col: '#554129' },
      // ---- FILA DI LEVANTE ----
      { id: 'erbe',    kind: 'bottega', x0: 44, y0: 4,  x1: 55, y1: 11, porta: [43, 7,  'o'], pav: 'terra',  col: '#454230' },
      { id: 'antro',   kind: 'bottega', x0: 44, y0: 14, x1: 55, y1: 20, porta: [43, 17, 'o'], pav: 'lastre', col: '#3c4a46' },
      { id: 'retro',   kind: 'bottega', x0: 44, y0: 23, x1: 55, y1: 29, porta: [43, 26, 'o'], pav: 'lastre', col: '#503b32' },
      // v2.19 — ERA `casa_c`. Al suo posto la BOTTEGA ARCANA, in fila con l'erborista e l'antro: la
      // via di levante e' quella di chi vende cose che non si affilano. Lastre viola, non legno.
      { id: 'arcano',  kind: 'bottega', x0: 44, y0: 32, x1: 55, y1: 36, porta: [43, 34, 'o'], pav: 'lastre', col: '#3a3358' },
      { id: 'casa_d',  kind: 'casa',    x0: 44, y0: 39, x1: 55, y1: 42, porta: [43, 40, 'o'], pav: 'legno',  col: '#554129' },
      // ---- LE TRE CASE DELLO SPIAZZO: due a mezzogiorno e una a settentrione ----
      { id: 'casa_e',  kind: 'casa',    x0: 21, y0: 38, x1: 27, y1: 42, porta: [24, 37, 'n'], pav: 'legno', col: '#554129' },
      { id: 'casa_f',  kind: 'casa',    x0: 31, y0: 38, x1: 38, y1: 42, porta: [34, 37, 'n'], pav: 'legno', col: '#554129' },
      { id: 'casa_g',  kind: 'casa',    x0: 25, y0: 3,  x1: 33, y1: 6,  porta: [29, 7,  's'], pav: 'legno', col: '#554129' },
    ],
    // LE STRADE. Le due vie lunghe corrono davanti alle porte delle due file; la via alta e la via bassa
    // le chiudono; lo spiazzo in mezzo e' tutt'uno con loro — non c'e' niente da attraversare.
    strade: [
      [17, 4,  19, 42],   // la via di ponente
      [40, 4,  42, 42],   // la via di levante
      [17, 8,  42, 10],   // la via alta, sotto la casa di settentrione
      [17, 33, 42, 35],   // la via bassa, davanti alle due case di mezzogiorno
      [20, 11, 39, 32],   // e lo spiazzo, con dentro la piazza
    ],
    // dove sta ogni mercante, e il colore della sua luce
    stalls: [
      { x: 6,    y: 15.5, kind: 'innkeeper', name: 'Ostessa',    inn: 1, sub: 'riposo',
        col: '#ffd97a', room: 'taverna' },
      // v2.19 — LE TRE BOTTEGHE DELL'EQUIPAGGIAMENTO. Erano una sola, ed e' per questo che `shop: 1`
      // bastava: c'era un banco e vendeva quello che vendeva. Adesso sono tre e ognuna ha il suo
      // CATALOGO (`cat`), che e' lo stesso identificatore con cui gear.js cataloga i pezzi. Chi entra
      // vede solo la parte del catalogo che la sua tabella gli concede — e per tre classi su sette
      // quella parte e' spalmata su due botteghe.
      { x: 6,    y: 25.5, kind: 'smith',     name: 'Fabbro',     shop: 1, cat: 'guerriero', sub: 'armi da mischia',
        col: '#ffb14a', room: 'fucina' },
      { x: 6,    y: 34,   kind: 'fletcher',  name: 'Arciera',    shop: 1, cat: 'ladro',     sub: 'archi e cuoio',
        col: '#8fd96a', room: 'archeria' },
      { x: 53.4, y: 34,   kind: 'arcanist',  name: 'Arcanista',  shop: 1, cat: 'mago',      sub: 'bastoni e vesti',
        col: '#a98cff', room: 'arcano' },
      { x: 53.4, y: 7.4,  kind: 'herbalist', name: 'Erborista',  pot: 1, sub: 'pozioni',
        col: '#9fe06a', room: 'erbe' },
      // v2.6 — LA CARTOMANTE E' DIVENTATA L’ORACOLO. Le sue carte erano spente da tempo
      // (CARTOMANTE_ATTIVA), quindi non si perde niente: cambia chi abita l'antro. Per ora non fa
      // nulla — niente `crd`, quindi il server non gli attacca nemmeno il richiamo di prossimita'.
      { x: 53.4, y: 17,   kind: 'oracolo',  name: 'Oracolo',   sub: 'spiriti',
        col: '#7fd6c0', room: 'antro' },
      { x: 53.4, y: 26,   kind: 'crier',     name: 'Capitano',   bnd: 1, sub: 'taglie e usato',
        col: '#ff9a8a', room: 'retro' },
    ],
  };
  // v2.6 — IL VILLAGGIO E' SCAVATO NELLA STESSA ROCCIA DELLE GROTTE. Prima aveva una tavolozza sua,
  // pietra calda, e si vedeva: una sala beige con dentro delle case, mentre tutto il resto del gioco e'
  // roccia fredda. Adesso fuori dalle case il pavimento e la roccia sono quelli della cripta — stesso
  // impasto, stessa cottura (_bakeCaverna) — e a scaldare ci pensano i fuochi. Dentro le case invece
  // resta il pavimento di prima: assi, lastre, terra. E' li' che si sta al caldo.
  const VILLAGE_THEME = {
    id: 'village', name: 'Il Villaggio',
    floorA: '#12161f', floorB: '#151a26', wall: '#1b2036', wallTop: '#262d4a',
    hazard: '#ffb020', accent: '#ffb14a', blobMul: 0, hazMul: 0, propMix: [], tint: 'rgba(40,60,45,.22)',
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
    // v2.0 — i tre mobili del villaggio. Il pozzo e il focolare sono tondi e ci si gira attorno; il letto
    // e' un rettangolo lungo appoggiato al muro. La panca resta attraversabile: e' bassa.
    pozzo: { c: 25 }, focolare: { c: 20 }, letto: { r: [31, 16] },
    bancone: { r: [32, 11] }, credenza: { r: [27, 12] }, scaffale: { r: [25, 13] },
    rastrelliera: { r: [23, 8] }, aiuola: { r: [23, 19] }, cratebox: { r: [12, 12] },
    // v2.5 — la bancarella e' un banco: ci sbatti contro come contro tutti gli altri
    bancarella: { r: [35, 15] },
    // v2.19 — il bersaglio dell'archeria e' una balla di paglia su un treppiede: ci si gira attorno
    bersaglio: { c: 14 },
  };
  // questi quattro il renderer li gira di 90 gradi quando il prop ha r > 0.5: l'ingombro deve girare con loro
  const GIRANO = { bancone: 1, credenza: 1, scaffale: 1, rastrelliera: 1, letto: 1, bancarella: 1 };
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
    const mur = new Uint8Array(w * h);                // il TIPO di ogni muro: 0 roccia di grotta, 2 concio
    const at = (x, y) => y * w + x;
    const scava = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[at(x, y)] = C.T_FLOOR; };

    for (const r of VILLAGE.rooms) scava(r.x0, r.y0, r.x1, r.y1);
    for (const S of VILLAGE.strade) scava(S[0], S[1], S[2], S[3]);
    // LE PORTE: si aprono dalla tessera dichiarata dalla stanza fino alla strada. Un varco solo, due
    // tessere di luce: quella nel muro e quella subito fuori, cosi' non resta mai un angolo cieco.
    for (const r of VILLAGE.rooms) {
      const [px, py, lato] = r.porta;
      // sempre DUE tessere di larghezza. Con una sola (48 px) contro un personaggio largo 35 restavano sei
      // pixel per parte: ci si passava sfregando lo stipite, ed e' una cosa che si sente subito.
      if (lato === 'e' || lato === 'o') scava(px, py, px, py + 1);
      else if (lato === 'n') scava(px, py - 1, px + 1, py);
      else scava(px, py, px + 1, py + 1);
    }
    // v2.6 — I MURI DELLE CASE SONO CONCI, LA CINTA E' ROCCIA. Il `muri` non e' la griglia: la griglia
    // dice solo passa/non passa, questo dice di che COSA e' fatto il muro, e lo legge solo chi disegna.
    // Le pareti delle case sono pietra squadrata (2), tutto il resto — il perimetro del villaggio, la
    // massa in cui e' scavato — resta roccia di grotta come nelle ondate: e' quello che ha chiesto.
    for (const r of VILLAGE.rooms) {
      for (let y = r.y0 - 1; y <= r.y1 + 1; y++) for (let x = r.x0 - 1; x <= r.x1 + 1; x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        if (x > r.x0 - 1 && x < r.x1 + 1 && y > r.y0 - 1 && y < r.y1 + 1) continue;   // l'interno no
        if (g[at(x, y)] === C.T_WALL) mur[at(x, y)] = 2;
      }
    }

    // il pavimento delle stanze e della piazza: lo disegna il renderer da questa lista. Lo SPIAZZO non
    // c'e': li' si vede la roccia cotta, che e' esattamente il pavimento delle grotte.
    const PZ = VILLAGE.piazza;
    const floors = [{ x0: PZ.x0, y0: PZ.y0, x1: PZ.x1, y1: PZ.y1, kind: 'terra', col: '#3b2e1e' }];
    for (const r of VILLAGE.rooms) floors.push({ x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, kind: r.pav, col: r.col });

    const props = [];
    const P = (type, tx, ty, s, extra) => props.push(Object.assign({ type, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, s: s || 1, r: ((tx * 31 + ty * 17) % 100) / 100 }, extra || {}));
    const R = (id) => VILLAGE.rooms.find(r => r.id === id);

    // ===================== LA PIAZZA =====================
    // Il falo' al centro, il pozzo di fianco, e tutt'attorno il giro: una torcia, una bancarella, una
    // torcia. E' il giro a dire che e' una piazza — senza, un rettangolo di terra e' solo un rettangolo.
    P('bonfire', VILLAGE.fire.x, VILLAGE.fire.y, 1.45);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2;
      P('rock', VILLAGE.fire.x + Math.cos(a) * 1.6, VILLAGE.fire.y + Math.sin(a) * 1.15, 0.5); }
    P('pozzo', VILLAGE.pozzo.x, VILLAGE.pozzo.y, 1.3);
    P('panca', 33.4, 25.2, 1, { r: 0 });
    P('panca', 25.4, 17.4, 1, { r: 0 });
    P('signpost', 31.6, 15.4, 1);

    // le TORCE attorno alla piazza: agli angoli e a meta' di ogni lato
    {
      const TORCE = [
        [PZ.x0 - 0.4, PZ.y0 - 0.4], [PZ.x1 + 0.4, PZ.y0 - 0.4],
        [PZ.x0 - 0.4, PZ.y1 + 0.4], [PZ.x1 + 0.4, PZ.y1 + 0.4],
        [25.2, PZ.y0 - 0.4], [33.8, PZ.y0 - 0.4],
        [25.2, PZ.y1 + 0.4], [33.8, PZ.y1 + 0.4],
        [PZ.x0 - 0.4, 17.5], [PZ.x0 - 0.4, 26.5],
        [PZ.x1 + 0.4, 17.5], [PZ.x1 + 0.4, 26.5],
      ];
      for (const [tx, ty] of TORCE) P('brazier', tx, ty, 1.1);
    }

    // ===================== v2.5/2.6 — LE BANCARELLE DI CONTORNO =====================
    // Non si comprano: non hanno mercante, non hanno alone, non succede niente ad avvicinarsi. Servono a
    // dire che il paese vive anche quando tu non ci sei. Dodici mestieri, tutti attorno alla piazza,
    // alternati alle torce e girati verso il centro.
    {
      const BANCHI = [
        // [x, y, verso, mestiere, colore della merce, cartello]
        [23.4, 11.9, 0, 'pane',     '#d9a55c', 'PANE'],
        [27.4, 11.9, 0, 'carne',    '#b04a48', 'CARNE'],
        [31.4, 11.9, 0, 'pesce',    '#8fb6c8', 'PESCE'],
        [35.4, 11.9, 0, 'frutta',   '#c87a3a', 'FRUTTA'],
        [23.4, 31.7, 0, 'vasi',     '#a4703e', 'VASI'],
        [27.4, 31.7, 0, 'tessuti',  '#7a6bb0', 'TESSUTI'],
        [31.4, 31.7, 0, 'candele',  '#e8d08a', 'CANDELE'],
        [35.4, 31.7, 0, 'formaggi', '#e0c070', 'FORMAGGI'],
        [20.6, 16.2, 1, 'spezie',   '#b8703a', 'SPEZIE'],
        [20.6, 27.8, 1, 'pellami',  '#8a5a34', 'PELLAMI'],
        [38.9, 16.2, 1, 'ferro',    '#8d97a5', 'FERRO'],
        [38.9, 27.8, 1, 'vino',     '#8e3b52', 'VINO'],
      ];
      for (const [bx, by, verso, mest, col, txt] of BANCHI) {
        P('bancarella', bx, by, 1, { col, mest, r: verso });
        P('signpost', bx + (verso ? 0.95 : 1.25), by + (verso ? 1.05 : (by < 20 ? -0.55 : 0.55)), 0.8, { txt });
      }
    }

    // ===================== LA CASA DEL PORTALE =====================
    // Una stanza sola, spoglia apposta: quello che ci si guarda dentro e' la faglia, e due candelabri
    // bastano a dire che qualcuno la tiene accesa. Le guardie stanno FUORI, nella via, ai lati della
    // soglia: dentro darebbero fastidio a chi attraversa.
    {
      const r = R('portale');
      // v2.19.2 — i due candelabri di levante e la rastrelliera stavano nella fascia della porta:
      // entrando nella casa della faglia ci si sfiorava contro. I candelabri si stringono verso i
      // due angoli, la rastrelliera passa alla parete di ponente insieme alle altre.
      P('candelabra', r.x0 + 1.4, r.y0 + 0.9, 1.05); P('candelabra', r.x1 - 3.4, r.y0 + 0.9, 1.05);
      P('candelabra', r.x0 + 1.4, r.y1 - 0.9, 1.05); P('candelabra', r.x1 - 3.4, r.y1 - 0.9, 1.05);
      P('flag', r.x0 + 0.8, r.y0 + 2.6, 1.2, { col: '#9a5cff' });
      P('flag', r.x0 + 0.8, r.y1 - 2.6, 1.2, { col: '#9a5cff' });
      P('rastrelliera', r.x0 + 4.2, r.y0 + 0.7, 0.9, { r: 0 });
      P('cratebox', r.x1 - 1.4, r.y1 - 1.2, 0.9);
      P('signpost', 18.9, 7.0, 1, { txt: 'FAGLIA' });
    }

    // ===================== LA TAVERNA =====================
    // Lei sta DIETRO il bancone, la credenza alle sue spalle, gli avventori ai tavoli. La porta e' a
    // levante, quindi il bancone e' verticale e i tavoli stanno in fondo alla stanza.
    {
      const r = R('taverna'), cy = (r.y0 + r.y1) / 2;
      P('credenza', r.x0 + 0.6, cy, 1, { r: 1 });
      P('bancone', r.x0 + 2.2, cy, 1, { r: 1 });
      P('hanging_lantern', r.x0 + 1.6, r.y0 + 0.7, 1.05); P('hanging_lantern', r.x1 - 1.6, r.y0 + 0.7, 1.05);
      for (const [x, y] of [[r.x0 + 0.8, r.y0 + 0.9], [r.x0 + 0.8, r.y1 - 0.9]]) P('barrel', x, y, 0.95);
      // v2.19.2 — la colonna di tavoli di levante era a x0+9.4, cioe' dentro la fascia della porta:
      // il primo tavolo lo prendevi in pieno entrando. Arretrata a x0+8.6, e i quattro tavoli restano
      // due per lato come prima.
      for (const [tx, ty] of [[r.x0 + 5.0, r.y0 + 1.7], [r.x0 + 8.6, r.y0 + 1.7], [r.x0 + 5.0, r.y1 - 1.7], [r.x0 + 8.6, r.y1 - 1.7]]) {
        P('tavolo', tx, ty, 1); P('panca', tx - 1.3, ty, 0.95); P('panca', tx + 1.3, ty, 0.95);
      }
      // v2.6 — qui c'era un braciere nell'angolo, e fra lui e il tavolo restava una tasca larga otto
      // pixel: irraggiungibile, invisibile, e il flood fill la trovava ogni volta. Due candelabri
      // lungo la parete del bancone fanno la stessa luce e ingombrano un terzo.
      P('candelabra', r.x0 + 3.4, r.y0 + 0.7, 1);
    }

    // ===================== LA FUCINA =====================
    // Il bancone sulla porta, l'incudine in mezzo, la colata in fondo e le armi appese lungo la parete.
    {
      const r = R('fucina'), cy = (r.y0 + r.y1) / 2;
      P('bancone', r.x0 + 2.2, cy, 1, { r: 1 });
      P('rastrelliera', r.x0 + 0.7, r.y0 + 1.4, 1, { r: 1 }); P('rastrelliera', r.x0 + 0.7, r.y1 - 1.4, 1, { r: 1 });
      P('rastrelliera', r.x0 + 5.5, r.y0 + 0.6, 1, { r: 0 }); P('rastrelliera', r.x1 - 2.5, r.y0 + 0.6, 1, { r: 0 });
      // v2.19.11 — L'INCUDINE STAVA IN MEZZO ALLA CORSIA DEL BANCO, a quattro passi dal fabbro: chi
      // entrava per comprare ci sbatteva contro. Adesso sta sul lato di settentrione, fra le due
      // rastrelliere — il fuoco resta a mezzogiorno, il ferro a settentrione, e in mezzo si cammina.
      P('incudine', r.x0 + 6.4, r.y0 + 1.5, 1.15);
      for (const [x, y, sc] of [[r.x1 - 1.4, r.y1 - 1.2, 1.5], [r.x1 - 2.8, r.y1 - 1.0, 1.35], [r.x1 - 1.8, r.y1 - 2.2, 1.2]]) P('lavapool', x, y, sc);
      P('brazier', r.x1 - 4.4, r.y1 - 1.2, 1);
      for (const [x, y] of [[r.x0 + 5.6, r.y1 - 1.1], [r.x0 + 6.6, r.y1 - 1.1]]) P('cratebox', x, y, 0.95);
      P('barrel', r.x0 + 0.8, cy + 2.4, 0.95);
    }

    // ===================== L'ARCHERIA (v2.19) =====================
    // Speculare alla fucina — bancone sulla porta, il mercante dietro — ma di un altro mestiere, e si
    // deve vedere da lontano: dove il fabbro ha il fuoco e il metallo, qui c'e' il legno e la corda.
    // In fondo alla stanza la LINEA DI TIRO: tre bersagli contro la parete di ponente, con le frecce
    // piantate dentro. E' la cosa che dice «archi» senza scrivere una parola sull'insegna.
    {
      const r = R('archeria'), cy = (r.y0 + r.y1) / 2;
      P('bancone', r.x0 + 2.2, cy, 1, { r: 1 });
      // le rastrelliere degli archi lungo la parete dietro al banco
      P('rastrelliera', r.x0 + 0.7, r.y0 + 0.9, 1, { r: 1 }); P('rastrelliera', r.x0 + 0.7, r.y1 - 0.9, 1, { r: 1 });
      // v2.19.2 — I BERSAGLI STAVANO DAVANTI ALLA PORTA, e uno in mezzo alla soglia. Adesso stanno in
      // FILA CONTRO LA PARETE DI SETTENTRIONE, che per un'archeria e' anche piu' giusto: sono un
      // tiro a segno visto di lato, non tre sagome piantate sull'uscio. Entrando li vedi tutti e tre
      // di fianco, e la soglia resta sgombra (vedi PORTA_SGOMBRA in fondo al file).
      P('bersaglio', r.x0 + 5.6, r.y0 + 0.8, 1.05); P('bersaglio', r.x0 + 7.2, r.y0 + 0.8, 1.15); P('bersaglio', r.x0 + 8.8, r.y0 + 0.8, 1.05);
      // le faretre e il cuoio da conciare, lungo la parete di mezzogiorno
      P('cratebox', r.x0 + 5.6, r.y1 - 0.8, 0.9); P('sack', r.x0 + 6.8, r.y1 - 0.8, 0.9);
      P('barrel', r.x0 + 0.8, cy + 1.6, 0.95);
      P('candelabra', r.x0 + 4.0, r.y0 + 0.7, 1); P('candelabra', r.x0 + 4.0, r.y1 - 0.7, 1);
      // gli stendardi restano accanto alla porta: si attraversano, quindi non ingombrano niente
      P('flag', r.x1 - 0.7, r.y0 + 0.8, 1.2, { col: '#8fd96a' });
      P('flag', r.x1 - 0.7, r.y1 - 0.8, 1.2, { col: '#8fd96a' });
    }

    // ===================== LA BOTTEGA ARCANA (v2.19) =====================
    // La porta e' a ponente, quindi il banco sta a ponente e il resto della stanza e' alle spalle del
    // mercante — come l'erborista, che e' sulla stessa via. Qui pero' non si distilla: si legge e si
    // incide. Scaffali di volumi, l'alambicco diventa un cerchio di cristalli, e sul pavimento un
    // tappeto con le rune, che e' l'unico posto del paese dove c'e' un disegno a terra.
    {
      const r = R('arcano'), cy = (r.y0 + r.y1) / 2;
      P('bancone', r.x1 - 2.2, cy, 1, { r: 1 });
      P('scaffale', r.x1 - 0.7, r.y0 + 0.9, 1, { r: 1, col: '#a98cff' });
      P('scaffale', r.x1 - 0.7, r.y1 - 0.9, 1, { r: 1, col: '#a98cff' });
      // v2.19.2 — I CRISTALLI STAVANO DAVANTI ALLA PORTA, e il piu' grosso proprio sulla soglia.
      // Adesso sono un CERCHIO attorno al tappeto runico: e' il posto che spiega cosa sono — un
      // circolo d'incantesimo, non tre sassi sull'uscio — e l'ingresso e' libero.
      //
      // v2.19.11 — MA IL PIU' GROSSO STAVA IN MEZZO ALLA CORSIA. Paolo: *«nel negozio di magia hai
      // piazzato un ostacolo proprio davanti al bancone del mago»*. Misurato: il cristallo grande
      // sedeva a 50,6 — sulla riga della porta (y 34) e a 2,8 tessere dal mercante — e insieme ai
      // candelabri e alle rastrelliere chiudeva la stanza: alla colonna x=51 restavano 0,75 tessere
      // libere, e per arrivare al banco bisognava rasentare il muro di settentrione.
      // Adesso il cerchio e' di QUATTRO cristalli, due per parete, e in mezzo non c'e' piu' niente:
      // il tappeto runico sta sotto i piedi (si attraversa) e la corsia porta->banco e' sgombra.
      // Tutto cio' che e' solido e' tirato verso le pareti (0,5 invece di 0,8), perche' la stanza e'
      // alta cinque tessere e con due file di mobili a 0,8 in mezzo ne restava una scarsa.
      // La regola adesso e' scritta e spacca da sola: vedi LA CORSIA DEL BANCO in fondo al file.
      P('tappeto', r.x0 + 4.4, cy, 1.35, { col: '#3a3368' });
      P('crystal_cluster', r.x0 + 3.2, r.y0 + 0.5, 1.0,  { col: '#a98cff', gr: 70, ga: 0.30 });
      P('crystal_cluster', r.x0 + 5.6, r.y0 + 0.5, 1.15, { col: '#c8b4ff', gr: 86, ga: 0.34 });
      P('crystal_cluster', r.x0 + 3.2, r.y1 - 0.5, 1.15, { col: '#c8b4ff', gr: 86, ga: 0.34 });
      P('crystal_cluster', r.x0 + 5.6, r.y1 - 0.5, 1.0,  { col: '#a98cff', gr: 70, ga: 0.30 });
      P('rastrelliera', r.x1 - 4.2, r.y0 + 0.45, 0.95, { r: 0 });   // i bastoni in piedi, come le armi dal fabbro
      P('rastrelliera', r.x1 - 4.2, r.y1 - 0.45, 0.95, { r: 0 });
      P('candelabra', r.x0 + 7.4, r.y0 + 0.5, 1.05); P('candelabra', r.x0 + 7.4, r.y1 - 0.5, 1.05);
      P('cratebox', r.x0 + 2.0, r.y1 - 0.5, 0.9);
    }

    // ===================== L'ERBORISTERIA =====================
    // Bancone sulla porta (che qui e' a ponente), strumenti alle spalle, e le piantagioni in fila in fondo.
    {
      const r = R('erbe'), cy = (r.y0 + r.y1) / 2;
      P('bancone', r.x1 - 2.2, cy, 1, { r: 1 });
      P('scaffale', r.x1 - 0.7, r.y0 + 1.4, 1, { r: 1 }); P('scaffale', r.x1 - 0.7, r.y1 - 1.4, 1, { r: 1 });
      P('alambicco', r.x1 - 4.0, r.y0 + 1.0, 1.05, { col: '#9fe06a' });
      P('mortaio', r.x1 - 4.0, r.y1 - 1.0, 1.1, { col: '#9fe06a' });
      // v2.19.2 — LE AIUOLE STAVANO SULL'USCIO. Il commento qui sopra dice «in fondo», ma con la porta
      // a PONENTE il fondo e' `x1`, non `x0`: erano tre casse lunghe in colonna proprio davanti a chi
      // entrava, e fra l'una e l'altra restavano 0,75 tessere — ci si infilava di sbieco. (Passabile,
      // misurato: non era una stanza chiusa. Era stretta, ed e' quello che Paolo ha visto.)
      // Adesso sono una FILA lungo la parete di mezzogiorno, in mezzo alla stanza: si leggono come
      // piantagioni — che e' cio' che sono — e la soglia resta libera.
      for (const [x, y] of [[r.x0 + 3.4, r.y1 - 0.9], [r.x0 + 5.6, r.y1 - 0.9], [r.x0 + 7.8, r.y1 - 0.9]])
        P('aiuola', x, y, 1, { col: '#9fe06a', glow: 1 });
      P('barrel', r.x0 + 4.4, r.y0 + 0.8, 0.95); P('sack', r.x0 + 6.0, r.y0 + 0.8, 0.9);
    }

    // ===================== L'ANTRO DELL’ORACOLO =====================
    // v2.6 — era la stanza della cartomante, col tappeto e il ventaglio di carte. Adesso ci abita lo
    // oracolo: il fuoco per terra, i cristalli, le ossa appese. Non vende niente e non parla — sta li'.
    {
      const r = R('antro'), cy = (r.y0 + r.y1) / 2;
      P('tappeto', r.x1 - 2.4, cy, 1.3, { col: '#2f5a52' });
      // v2.19.11 — il fuoco stava in mezzo alla strada fra l'uscio e l'oracolo: spostato di lato.
      P('focolare', r.x1 - 4.6, cy - 1.5, 1.05);
      P('candelabra', r.x1 - 0.9, r.y0 + 0.9, 1); P('candelabra', r.x1 - 0.9, r.y1 - 0.9, 1);
      P('scaffale', r.x0 + 0.8, cy - 1.6, 1, { r: 1, col: '#7fd6c0' });
      P('crystal_cluster', r.x0 + 1.4, r.y0 + 0.9, 0.9, { col: '#7fd6c0', gr: 58, ga: 0.26 });
      P('crystal_cluster', r.x0 + 1.4, r.y1 - 0.9, 0.9, { col: '#7fd6c0', gr: 58, ga: 0.26 });
      P('skull', r.x0 + 3.4, r.y0 + 0.8, 0.95); P('skull', r.x0 + 4.6, r.y1 - 0.8, 0.9);
      P('web', r.x1 - 0.6, cy + 2.2, 0.85);
    }

    // ===================== LA GILDA =====================
    {
      const r = R('retro'), cy = (r.y0 + r.y1) / 2;
      P('bancone', r.x1 - 2.2, cy, 1, { r: 1 });
      P('signpost', r.x1 - 4.2, r.y0 + 0.8, 1.05, { txt: 'TAGLIE' });
      P('flag', r.x1 - 0.8, r.y0 + 1.6, 1.25, { col: '#ff9a8a' });
      P('flag', r.x1 - 0.8, r.y1 - 1.6, 1.25, { col: '#ff9a8a' });
      P('scaffale', r.x0 + 0.8, r.y0 + 1.4, 1, { r: 1 }); P('scaffale', r.x0 + 0.8, r.y1 - 1.4, 1, { r: 1 });
      // v2.19.11 — le due casse dell'usato stavano sulla riga del banco, in mezzo al passaggio:
      // adesso sono accostate alla parete di settentrione, sotto lo scaffale.
      for (const [x, y] of [[r.x0 + 3.2, r.y0 + 0.9], [r.x0 + 4.2, r.y0 + 0.9]]) P('cratebox', x, y, 0.95);
      P('barrel', r.x0 + 3.4, r.y1 - 1.2, 0.95);
    }

    // ===================== LE CASE =====================
    // Sette case, e tutte arredate dalla STESSA funzione. Non e' pigrizia: e' che una casa di nani ha
    // sempre le stesse quattro cose — il focolare in mezzo (e' la ragione per cui la stanza esiste), il
    // letto contro la parete piu' lontana dalla porta, il tavolo dall'altra parte, la madia contro un
    // muro — e a cambiare e' solo il verso.
    //
    // L'UNICA REGOLA DURA: davanti alla porta non ci va niente. I mobili hanno un corpo (v1.75.2), e un
    // tavolo sulla soglia e' una casa in cui non si entra. v2.6 — la porta adesso e' un DATO della
    // stanza, non piu' una deduzione dalle coordinate dei varchi: prima bastava spostare una casa per
    // ritrovarsi il letto sull'ingresso.
    const abitanti = [];
    const arredaCasa = (r, k) => {
      const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
      const [px, py, lato] = r.porta;
      const oriz = lato === 'e' || lato === 'o';           // porta su una parete verticale?
      // la zona da tenere sgombra: la fascia davanti alla porta, larga un mobile
      const sgombro = (x, y) => oriz ? (Math.abs(y - py) > 1.5 || Math.abs(x - px) > 2.6)
                                     : (Math.abs(x - px) > 1.5 || Math.abs(y - py) > 2.6);
      // v2.6 — E DEVE ANCHE STARE DENTRO LA STANZA. Sembra ovvio e non lo era: nelle case basse quattro
      // tessere il conto "centro meno 1,8" finiva nella riga di muro, il mobile spuntava dentro la stanza
      // dal lato sbagliato e tappava il passaggio. Risultato: una casa intera irraggiungibile, e il test
      // del flood fill che la trovava senza sapere dire perche'. Adesso chi non ci sta, non ci va.
      // il mobile e' piazzato per CENTRO DI TESSERA, quindi sta dentro se la sua tessera sta dentro: il
      // margine di un decimo serve solo a non perdere un letto per un errore di virgola.
      const dentroStanza = (x, y) => x >= r.x0 - 0.1 && x <= r.x1 + 0.1 && y >= r.y0 - 0.1 && y <= r.y1 + 0.1;
      const M = (t, x, y, s, e) => { if (sgombro(x, y) && dentroStanza(x, y)) P(t, x, y, s, e); };
      const bassa = (r.y1 - r.y0) < 5 || (r.x1 - r.x0) < 6;   // le case piccole si arredano con meno roba

      // il FOCOLARE: sta in mezzo, e' il motivo per cui la stanza e' una casa.
      // v2.19.2 — MA NON SULL'USCIO. Era l'unico mobile piazzato con `P` invece che con `M`, cioe'
      // l'unico che saltava il controllo della soglia scritto due righe piu' sopra — e nella casa di
      // settentrione, che e' bassa quattro tessere, «in mezzo» cadeva dentro la fascia della porta.
      // Se il centro non e' libero, il focolare si sposta LUNGO LA PARETE, dalla parte opposta alla
      // porta: resta il fuoco di mezzo della stanza, senza stare davanti a chi entra.
      { let fx = cx, fy = cy;
        if (!sgombro(fx, fy)) {
          if (oriz) fx = lato === 'e' ? r.x0 + 1.8 : r.x1 - 1.8;
          else fy = lato === 'n' ? r.y1 - 1.2 : r.y0 + 1.2;
        }
        // e se nemmeno cosi' ci sta (stanza minuscola), si scosta di lato invece che in profondita'
        if (!sgombro(fx, fy)) { if (oriz) fy = cy + (cy - py > 0 ? 1.6 : -1.6); else fx = cx + (cx - px > 0 ? 1.8 : -1.8); }
        P('focolare', fx, fy, 1.15);
        abitanti._fuoco = { x: fx, y: fy };
      }
      // SETTE CASE UGUALI SAREBBERO SETTE VOLTE LA STESSA CASA. La variazione non e' casuale: e' l'indice
      // della casa a decidere, cosi' la pianta resta la stessa a ogni partita (nel villaggio il seme non
      // cambia niente) ma da una porta all'altra si vede gente diversa che vive diversamente.
      const spec = k % 2 ? -1 : 1;
      // il LETTO va contro la parete piu' lontana dalla porta, il TAVOLO dall'altra parte
      let bx, by, tx, ty, mx, my;
      if (oriz) {
        const dentro = lato === 'e' ? -1 : 1;              // da che parte si va entrando
        bx = lato === 'e' ? r.x0 + 1.6 : r.x1 - 1.6;
        by = cy + spec * Math.max(1.1, (r.y1 - r.y0) / 2 - 0.8);
        tx = bx; ty = cy - spec * Math.max(1.1, (r.y1 - r.y0) / 2 - 0.8);
        mx = cx + dentro * -1.0; my = cy + spec * ((r.y1 - r.y0) / 2 - 0.2);
      } else {
        const dentro = lato === 'n' ? 1 : -1;
        by = lato === 'n' ? r.y1 - 0.8 : r.y0 + 0.8;
        bx = cx + spec * Math.max(1.4, (r.x1 - r.x0) / 2 - 1.4);
        ty = by; tx = cx - spec * Math.max(1.4, (r.x1 - r.x0) / 2 - 1.4);
        mx = cx + spec * ((r.x1 - r.x0) / 2 - 0.2); my = cy + dentro * -1.0;
      }
      M('letto', bx, by, 1, { r: oriz ? 1 : 0 });
      M('tavolo', tx, ty, 0.9);
      M('panca', tx + (oriz ? 1.2 : 0), ty + (oriz ? 0 : 1.1), 0.9);
      M('credenza', mx, my, 0.95, { r: oriz ? 0 : 1 });
      const roba = [['sack', 0.85], ['barrel', 0.9], ['cratebox', 0.85]][k % 3];
      if (!bassa) {
        M(roba[0], cx - spec * 1.2, cy + (oriz ? -1.8 : 1.8), roba[1]);
        if (k % 4 === 1) M('rastrelliera', cx + spec * 1.8, cy + (oriz ? 1.8 : -1.8), 0.8, { r: oriz ? 1 : 0 });
        if (k % 4 === 2) M('scaffale', cx - spec * 1.8, cy + (oriz ? 1.8 : -1.8), 0.8, { r: oriz ? 1 : 0 });
      } else {
        M(roba[0], oriz ? r.x1 - 0.8 : cx + spec * 2.6, oriz ? cy + spec * 1.3 : (lato === 'n' ? r.y0 + 0.8 : r.y1 - 0.8), roba[1]);
      }
      if (k % 5 === 3) P('tappeto', cx + spec * 1.4, cy - 1.3, 1, { col: '#6b4630' });
      // e la gente attorno al fuoco: uno sempre, un secondo nelle case piu' larghe
      // v2.5 — OGNUNO HA LA SUA FACCIA. Prima erano tutti `patron`, cioe' il ladro ricolorato: dieci
      // gemelli travestiti. Adesso il tipo si sceglie dall'indice della casa — non a caso, cosi' il
      // villaggio e' sempre lo stesso e ogni porta ha i suoi abitanti.
      const ALFUOCO = ['vecchio', 'paesana', 'paesano', 'monaco', 'vecchio', 'paesana', 'paesano'];
      const ALLAVORO = ['bottegaio', 'paesano', 'paesana', 'bimbo', 'minatore', 'bottegaio', 'paesana'];
      // v2.19.2 — chi si scalda sta accanto al FUOCO, non al centro geometrico: da quando il focolare
      // puo' scostarsi dalla soglia, i due punti non coincidono piu' sempre.
      const F = abitanti._fuoco || { x: cx, y: cy };
      abitanti.push({ x: F.x + spec * 1.5, y: F.y + 0.15, kind: ALFUOCO[k % ALFUOCO.length], face: spec > 0 ? Math.PI : 0, act: 'fuoco' });
      if ((r.x1 - r.x0) >= 7) abitanti.push({ x: cx - spec * 1.5, y: cy + (k % 2 ? 0.9 : -0.9), kind: ALLAVORO[k % ALLAVORO.length], face: spec > 0 ? 0 : Math.PI, act: k % 3 === 0 ? 'martella' : 'rimesta' });
    };
    { let k = 0; for (const r of VILLAGE.rooms) if (r.kind === 'casa') arredaCasa(r, k++); }

    // --- l'alone del colore di ogni mercante: lo stacca dalla roccia e dice chi e' da lontano ---
    for (const s of VILLAGE.stalls) P('glowspot', s.x, s.y, 1, { col: s.col, gr: 100, ga: 0.34 });

    // --- ragnatele e catene negli angoli: siamo pur sempre sottoterra ---
    for (const [x, y] of [[18.4, 12.4], [41.4, 12.4], [18.4, 31.4], [41.4, 31.4]]) P('web', x, y, 0.9);
    // --- e qualche masso allo sbocco delle vie, perche' il paese e' scavato, non costruito ---
    for (const [x, y] of [[18.2, 24.5], [41.6, 18.5], [21.0, 11.6], [38.4, 32.4]]) P('rock', x, y, 0.55);

    // ============================================================================================
    // v2.19.2 — LA SOGLIA E' SACRA: nessun mobile davanti a una porta
    // ============================================================================================
    // Paolo: *«perche' metti oggetti all'ingresso delle case e/o negozi? toglili, rendono ingombrante
    // l'entrata»*. Aveva ragione, e non era un caso isolato: cinque stanze su tredici avevano roba
    // solida nella fascia della porta — le due botteghe nuove con tre mobili ciascuna (uno proprio in
    // mezzo alla soglia), piu' la casa della faglia, la taverna e la casa di settentrione.
    //
    // La regola c'era gia', ma valeva solo per le case (`sgombro` dentro `arredaCasa`): le botteghe
    // erano arredate a mano, una per una, e nessuno controllava. Adesso il controllo e' UNO e vale per
    // TUTTE le stanze, ed e' qui — dopo che i mobili sono stati messi — perche' e' l'unico punto in
    // cui si vede il villaggio finito.
    //
    // E SPACCA, non corregge. Un filtro silenzioso toglierebbe un mobile senza dirlo, e chi ha
    // arredato la stanza crederebbe di averlo messo. Il villaggio e' uguale a ogni partita: o questo
    // errore c'e' sempre, o non c'e' mai — quindi se c'e' deve fermare tutto al primo avvio e alla
    // prima riga di test, non nascondersi in una partita su cento.
    //
    // La fascia e' quella delle case: 1,5 tessere per lato della linea della porta, 2,6 di profondita'.
    // I mobili ATTRAVERSABILI (stendardi, tappeti, teschi, lanterne appese) non contano: non ingombrano.
    {
      const guasti = [];
      for (const r of VILLAGE.rooms) {
        const [px, py, lato] = r.porta, oriz = lato === 'e' || lato === 'o';
        for (const pr of props) {
          if (!INGOMBRI[pr.type]) continue;                 // si attraversa: non ingombra la soglia
          const x = pr.x / TILE - 0.5, y = pr.y / TILE - 0.5;
          if (x < r.x0 - 1 || x > r.x1 + 1 || y < r.y0 - 1 || y > r.y1 + 1) continue;   // non e' di questa stanza
          const dentro = oriz ? (Math.abs(y - py) <= 1.5 && Math.abs(x - px) <= 2.6)
                              : (Math.abs(x - px) <= 1.5 && Math.abs(y - py) <= 2.6);
          if (dentro) guasti.push(r.id + ': ' + pr.type + ' a ' + x.toFixed(1) + ',' + y.toFixed(1));
        }
      }
      if (guasti.length) throw new Error('mapgen: mobili davanti a una porta — ' + guasti.join(' · '));
    }

    // ============================================================================================
    // v2.19.11 — LA CORSIA DEL BANCO: fra la porta e il mercante non ci sta niente
    // ============================================================================================
    // Paolo: *«nel negozio di magia hai piazzato un ostacolo proprio davanti al bancone del mago»*.
    // La soglia era sgombra — il controllo qui sopra passava — ma tre passi piu' avanti, in mezzo
    // alla strada che porta al banco, c'era un cristallo. La regola della soglia guarda solo la
    // fascia dell'uscio: dentro la stanza nessuno controllava niente, e cosi' e' successo di nuovo.
    //
    // Questa guarda il TRAGITTO: dalla porta al mercante c'e' una corsia larga 1,2 tessere (0,6 per
    // lato della riga del banco) e dev'essere vuota. Vale per ogni bottega dove c'e' qualcuno dietro
    // un banco, e come quella della soglia SPACCA invece di correggere: il villaggio e' uguale a
    // ogni partita, quindi o l'errore c'e' sempre o non c'e' mai.
    // Il `bancone` non conta: e' il banco stesso, ed e' li' che ci si ferma.
    {
      const MEZZA_CORSIA = 0.6, guasti = [];
      for (const s of VILLAGE.stalls) {
        const r = VILLAGE.rooms.find(q => q.id === s.room); if (!r) continue;
        const [px, py, lato] = r.porta, oriz = lato === 'e' || lato === 'o';
        for (const pr of props) {
          const d = INGOMBRI[pr.type]; if (!d) continue;          // si attraversa: non ingombra
          if (pr.type === 'bancone') continue;                    // il banco E' il banco
          const x = pr.x / TILE - 0.5, y = pr.y / TILE - 0.5;
          if (x < r.x0 - 1 || x > r.x1 + 1 || y < r.y0 - 1 || y > r.y1 + 1) continue;   // non e' di questa stanza
          const sc = pr.s || 1;
          let hw, hh;
          if (d.c) { hw = hh = d.c * sc / TILE; }
          else {
            hw = d.r[0] * sc / TILE; hh = d.r[1] * sc / TILE;
            if (GIRANO[pr.type] && (pr.r || 0) > 0.5) { const t = hw; hw = hh; hh = t; }
          }
          // di traverso: il mobile invade la corsia?  di lungo: sta fra la porta e il banco?
          const invade = oriz ? Math.abs(y - s.y) < MEZZA_CORSIA + hh : Math.abs(x - s.x) < MEZZA_CORSIA + hw;
          const a = oriz ? x : y, mezzo = oriz ? hw : hh, q0 = oriz ? px : py, q1 = oriz ? s.x : s.y;
          const dentro = a + mezzo > Math.min(q0, q1) && a - mezzo < Math.max(q0, q1);
          if (invade && dentro) guasti.push(r.id + ': ' + pr.type + ' a ' + x.toFixed(1) + ',' + y.toFixed(1));
        }
      }
      if (guasti.length) throw new Error('mapgen: mobili sulla corsia del banco — ' + guasti.join(' · '));
    }

    const village = (() => {
        // Ogni mercante sta nella SUA stanza, girato verso il falo' della piazza.
        const mk = (s) => { const dx = s.x - VILLAGE.fire.x, dy = s.y - VILLAGE.fire.y;
          return { x: s.x * TILE + TILE / 2, y: s.y * TILE + TILE / 2,
                   kind: s.kind, name: s.name, shop: s.shop || 0, cat: s.cat || '', pot: s.pot || 0, bnd: s.bnd || 0, crd: s.crd || 0, inn: s.inn || 0, sub: s.sub || '', col: s.col || '',
                   soon: s.soon || 0, seated: s.seated || 0, face: Math.atan2(-dy, -dx) }; };
        const npcs = VILLAGE.stalls.map(mk);
        // v2.0 — LA GENTE. Gli avventori della taverna e i passanti stanno qui a mano; gli abitanti
        // delle case li ha gia' messi arredaCasa(), uno per focolare. Non parlano e non vendono: si
        // muovono un poco sul posto, ed e' quello che distingue un villaggio da un plastico.
        // v2.6 — piu' le DUE GUARDIE della casa del portale, ferme ai lati della soglia.
        const extras = [
          { x: 9.6,  y: 14.7, kind: 'paesano',   face: 0 },
          { x: 12.0, y: 14.7, kind: 'minatore',  face: Math.PI },
          { x: 9.6,  y: 17.3, kind: 'bottegaio', face: 0 },
          { x: 12.0, y: 17.3, kind: 'paesana',   face: Math.PI },
          { x: 6.0,  y: 13.2, kind: 'vecchio',   face: 1.9 },
          { x: 24.2, y: 14.4, kind: 'monaco',    face: 0.6, act: 'guarda' },
          { x: 34.6, y: 28.6, kind: 'paesana',   face: 3.4 },
          { x: 21.4, y: 34.2, kind: 'bimbo',     face: 0, act: 'cammina' },
          { x: 38.4, y: 9.4,  kind: 'paesano',   face: Math.PI, act: 'cammina' },
          { x: 46.4, y: 9.2,  kind: 'bottegaio', face: 1.4 },
        ].concat(VILLAGE.guardie.map(gd => ({ x: gd.x, y: gd.y, kind: 'guardia', face: gd.face, act: 'guarda' })))
         .concat(abitanti)
         .map(e => ({ x: e.x * TILE + TILE / 2, y: e.y * TILE + TILE / 2, kind: e.kind, seated: e.seated || 0, face: e.face || 0, act: e.act || '', name: '', sub: '' }));
      // ===================== v2.3 — I GIROVAGHI =====================
      // Gli `extras` di sopra sono gente FERMA: ognuno al suo posto, con un mestiere in corso. Dava vita
      // alle stanze ma non alle strade, e un paese in cui nessuno cammina non e' un paese.
      //
      // Questi camminano. Ognuno ha una ROTTA — una polilinea che segue le strade, quindi per costruzione
      // non attraversa mai un muro — e la sua posizione e' una FUNZIONE DEL TEMPO DELLA PARTITA, non uno
      // stato che qualcuno aggiorna. Tre conseguenze, tutte volute:
      //   · il server non manda niente: zero banda, zero codice di movimento;
      //   · tutti i giocatori li vedono nello stesso punto, perche' il tempo della partita e' lo stesso;
      //   · se uno entra a meta' sosta li trova dove devono essere, senza sincronizzazioni.
      //
      // NON hanno un corpo solido, e non e' una dimenticanza: il corpo lo calcola il server dalle
      // posizioni, che qui non esistono: esiste una formula. Un corpo fermo sotto una persona che cammina
      // sarebbe peggio di nessun corpo — ci sbatteresti contro il vuoto. Sono scenografia, e ci si passa
      // attraverso; i mercanti e la gente ferma il corpo ce l'hanno, come prima.
      // v2.5 — ognuno ha la sua faccia: il tipo lo passa chi definisce la rotta, e sono tutti diversi
      const RT = (pts, vel, fase, act, anello, tipo) => ({
        pts: pts.map(p => [p[0] * TILE + TILE / 2, p[1] * TILE + TILE / 2]),
        vel: vel * TILE, fase, kind: tipo, act: act || '', anello: anello ? 1 : 0,
      });
      const girovaghi = [
        // le due VIE LUNGHE, davanti alle porte: sono le strade piu' battute del paese
        RT([[18.0, 5], [18.0, 41]], 1.15, 0.00, 'cammina', 0, 'paesano'),
        RT([[18.9, 41], [18.9, 5]], 0.95, 0.35, 'cammina', 0, 'paesana'),
        RT([[41.0, 5], [41.0, 41]], 1.05, 0.18, 'cammina', 0, 'bottegaio'),
        RT([[41.9, 41], [41.9, 5]], 1.22, 0.74, 'cammina', 0, 'paesana'),
        // la VIA ALTA e la VIA BASSA, che chiudono lo spiazzo a nord e a sud
        RT([[18, 9.4], [41, 9.4]], 1.30, 0.62, 'cammina', 0, 'minatore'),
        RT([[41, 34.2], [18, 34.2]], 1.00, 0.50, 'cammina', 0, 'monaco'),
        // e il giro della PIAZZA, attorno al falo': un anello, non un avanti e indietro
        RT([[21, 12], [38.4, 12], [38.4, 31.6], [21, 31.6]], 0.85, 0.00, 'cammina', 1, 'vecchio'),
        RT([[38.4, 31.6], [21, 31.6], [21, 12], [38.4, 12]], 0.70, 0.30, 'cammina', 1, 'paesano'),
        // due che vanno e vengono dalle botteghe
        RT([[17.4, 25.5], [19.4, 25.5]], 0.55, 0.10, 'cammina', 0, 'bimbo'),
        RT([[40.6, 17], [42.6, 17]], 0.50, 0.66, 'cammina', 0, 'minatore'),
      ];
        // v2.19 — LE BOTTEGHE SONO TRE. `smith` resta — e resta il fabbro — perche' mezzo mondo lo
        // legge (il salvataggio, la telecamera d'arrivo, i test): toglierlo per fare eleganza avrebbe
        // rotto cose che non c'entrano niente con due negozi nuovi. Accanto c'e' `botteghe`, che e' la
        // lista vera: chi sa delle tre le usa, chi non lo sa continua a vedere il fabbro di prima.
        const botteghe = npcs.filter(n => n.shop).map(n => ({ x: n.x, y: n.y, cat: n.cat || 'guerriero', kind: n.kind, name: n.name, face: n.face }));
        const sm = botteghe[0] || { x: npcs[0].x, y: npcs[0].y, face: npcs[0].face };
      return { smith: { x: sm.x, y: sm.y }, smithFace: sm.face, botteghe, npcs, extras, girovaghi, fire: { x: VILLAGE.fire.x * TILE + TILE / 2, y: VILLAGE.fire.y * TILE + TILE / 2 } };
    })();

    return {
      w, h, tile: TILE, seed, level: 0, theme: VILLAGE_THEME, market: 1,
      // v2.0.2 — IL VILLAGGIO E' ILLUMINATO. `lit` vale SOLO qui: nessun'altra mappa lo dichiara, e il
      // renderer lo legge da questa bandiera, non dal tipo di mappa. Le ondate restano buie come sempre —
      // il velo che si stringe attorno a te e' meta' della loro tensione.
      lit: 1,
      grid: Array.from(g), muri: Array.from(mur), floors,
      // v2.6 — il rettangolo della piazza serve anche a chi fa la luce: e' li' che il buio vale meno
      piazza: { x0: PZ.x0, y0: PZ.y0, x1: PZ.x1, y1: PZ.y1 },
      spawn: { x: VILLAGE.spawn.x * TILE + TILE / 2, y: VILLAGE.spawn.y * TILE + TILE / 2 },
      exit: { x: VILLAGE.exit.x, y: VILLAGE.exit.y },
      // v2.6 — dove pianta il portale il server: dentro la casa del portale, non piu' in mezzo alla piazza.
      portale: { x: VILLAGE.portale.x, y: VILLAGE.portale.y },
      enemySpawns: [], crateSpawns: [], props, microAreas: [],
      village, solids: ingombri(props, village),
    };
  }

  // piantaCaverna e tessereStrozzatura escono anche da sole: i test le provano senza dover
  // generare una mappa intera, ed e' cosi' che si tiene onesto il vincolo delle strozzature.
  // ============================================================================================
  // v2.8 — LA TUA STANZA
  // ============================================================================================
  // La prima cosa che si vede del gioco. Nella v2.7 era una cella di roccia e non funzionava con quello
  // che dice il testo: il personaggio si sveglia e chiede "perche' si e' aperto un portale NELLA MIA
  // STANZA" — quindi dev'essere una stanza, non una grotta. Assi per terra, conci ai muri, un letto, una
  // cassapanca, una lanterna. E in mezzo, dove ieri c'era il pavimento, un portale acceso.
  //
  // E' PICCOLA (20x14) e non ha uscite: e' una camera da letto, non un livello. Se ci fosse una porta uno
  // proverebbe ad aprirla, e il primo minuto di gioco diventerebbe una caccia alla maniglia. Non c'e'
  // niente da raccogliere e niente da uccidere: c'e' un portale.
  //
  // Dichiara `lit`, che non vuol dire "illuminata" ma "il buio lo fanno le sorgenti invece del campo
  // visivo". Le sorgenti sono due: la lanterna sul comodino e il portale. E' notte.
  const PROLOGO = {
    w: 20, h: 14,
    stanza: { x0: 3, y0: 3, x1: 16, y1: 10 },
    faglia: { x: 11, y: 6.5 },
    letto: { x: 5, y: 7 },
    spawn: { x: 7, y: 7 },
  };
  function generatePrologo(seed) {
    const w = PROLOGO.w, h = PROLOGO.h, TILE = C.TILE, SA = PROLOGO.stanza;
    const g = new Uint8Array(w * h).fill(C.T_WALL);
    const mur = new Uint8Array(w * h);
    for (let y = SA.y0; y <= SA.y1; y++) for (let x = SA.x0; x <= SA.x1; x++) g[y * w + x] = C.T_FLOOR;
    // i muri della stanza sono CONCI (2), non roccia: e' una casa. Il resto della mappa non si vede.
    for (let y = SA.y0 - 1; y <= SA.y1 + 1; y++) for (let x = SA.x0 - 1; x <= SA.x1 + 1; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      if (g[y * w + x] === C.T_WALL) mur[y * w + x] = 2;
    }

    const props = [];
    const P = (type, tx, ty, s, extra) => props.push(Object.assign({ type, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, s: s || 1, r: ((tx * 31 + ty * 17) % 100) / 100 }, extra || {}));
    // il LETTO da cui ti sei appena alzato, con la lanterna accesa accanto
    P('letto', PROLOGO.letto.x, PROLOGO.letto.y, 1, { r: 0 });
    P('candelabra', PROLOGO.letto.x + 0.1, PROLOGO.letto.y - 1.6, 1);
    // e le cose di una stanza in cui vive qualcuno
    P('credenza', SA.x0 + 0.7, SA.y0 + 0.7, 0.95, { r: 1 });
    P('cratebox', SA.x0 + 0.8, SA.y1 - 0.7, 0.95);
    P('tavolo', SA.x0 + 3.2, SA.y1 - 0.9, 0.9);
    P('panca', SA.x0 + 3.2, SA.y1 - 2.0, 0.9);
    P('scaffale', SA.x0 + 6.0, SA.y0 + 0.7, 0.9, { r: 0 });
    P('barrel', SA.x1 - 0.8, SA.y1 - 0.8, 0.9);
    P('tappeto', SA.x0 + 3.4, SA.y0 + 2.6, 1.1, { col: '#6b4630' });
    P('rastrelliera', SA.x1 - 2.4, SA.y0 + 0.7, 0.85, { r: 0 });
    // e qualche segno che il portale ha rotto qualcosa aprendosi: sassi e una ragnatela nell'angolo
    for (const [x, y, sc] of [[PROLOGO.faglia.x - 1.6, PROLOGO.faglia.y + 1.4, 0.5], [PROLOGO.faglia.x + 1.7, PROLOGO.faglia.y - 1.3, 0.45]]) P('rock', x, y, sc);
    P('web', SA.x1 - 0.6, SA.y0 + 0.5, 0.8);

    return {
      w, h, tile: TILE, seed: seed >>> 0, level: 0, theme: THEMES[0], prologo: 1,
      lit: 1,
      grid: Array.from(g), muri: Array.from(mur),
      // il pavimento di casa: assi, come nelle case del villaggio
      floors: [{ x0: SA.x0, y0: SA.y0, x1: SA.x1, y1: SA.y1, kind: 'legno', col: '#554129' }],
      spawn: { x: PROLOGO.spawn.x * TILE + TILE / 2, y: PROLOGO.spawn.y * TILE + TILE / 2 },
      exit: { x: PROLOGO.faglia.x, y: PROLOGO.faglia.y },
      portale: { x: PROLOGO.faglia.x, y: PROLOGO.faglia.y },
      enemySpawns: [], crateSpawns: [], props, microAreas: [], village: null, solids: ingombri(props, { npcs: [], extras: [] }),
    };
  }

  // v2.19.2 — INGOMBRI esce allo scoperto: il test delle soglie deve poter distinguere un mobile
  // solido da uno che si attraversa, ed e questa tabella a saperlo.
  return { generate, generateMarket, generatePrologo, idx, W, H, THEMES, VILLAGE, VILLAGE_THEME, PROLOGO, INGOMBRI, piantaCaverna, tessereStrozzatura };
});
