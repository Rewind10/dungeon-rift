/* mercenari.js — v1.82: la compagnia di ventura (UMD, condiviso client/server).
   Un mercenario e' un GIOCATORE a tutti gli effetti — corpo, collisione, bersaglio dei mostri, morte —
   guidato dal server invece che da una tastiera. Qui dentro c'e' tutto cio' che lo definisce: i nomi, le
   tinte, quanto costa, come spende i punti, e come pensa. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Mercenari = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ===== NOMI ============================================================================
  // Quindici per classe, corti: devono stare sopra la testa senza coprire mezzo schermo.
  const NOMI = {
    guerriero: ['Bardo', 'Ghisla', 'Torbe', 'Corvin', 'Orsa', 'Ruggero', 'Vanda', 'Malco', 'Brenna',
                'Ottone', 'Drusa', 'Gervas', 'Ilda', 'Rocco', 'Berta'],
    mago:      ['Vesper', 'Anselma', 'Morrin', 'Ilbe', 'Cinira', 'Ordo', 'Selva', 'Tibald', 'Numa',
                'Erasmo', 'Livia', 'Cardan', 'Nebbia', 'Ostro', 'Rea'],
    ladro:     ['Guizzo', 'Renza', 'Nibbio', 'Cardo', 'Bissa', 'Furio', 'Serpe', 'Lena', 'Tasso',
                'Mirta', 'Sghembo', 'Nadia', 'Zaffo', 'Corva', 'Pece'],
  };

  // ===== TINTE ===========================================================================
  // Stessa sagoma, stessi vestiti, stessa silhouette: cambia il TONO. Il renderer ha gia' il gancio
  // (`eq.pal` in _heroGuerriero/_heroMago/_heroLadro, mai usato da nessuno finora): basta passargli
  // questi colori nello snapshot. Quattro varianti per classe — abbastanza perche' due mercenari di
  // fila non si somiglino, poche perche' restino riconoscibili come "un guerriero", non come il TUO.
  // v1.82.2 — COLORI DAVVERO DIVERSI. La prima passata spostava il tono di poco e in gioco, con la luce
  // della caverna addosso, due ladri restavano due macchie verdi uguali. Adesso ogni variante e' un COLORE
  // suo — rosso, blu, viola, ocra — non una sfumatura: a colpo d'occhio devi sapere subito chi sei tu.
  // Restano scuri e sporchi (la caverna e' scura: un colore acceso pieno sembrerebbe incollato sopra), ma
  // la tinta si legge. Ogni chiave qui dentro finisce nella firma della palette (renderer._palKey), quindi
  // due varianti non possono mai spartirsi un gradiente in cache.
  const TINTE = {
    guerriero: [
      { cloth: '#7a2f22', clothDk: '#3c1610', steelDk: '#5a3a30', metallo: '#96685a', pelo: '#2a1a10', skin: '#c98f5e' },  // ruggine
      { cloth: '#25406e', clothDk: '#101f36', steelDk: '#2f3f5a', metallo: '#6a7d9c', pelo: '#4a4030', skin: '#d6ad82' },  // ferro
      { cloth: '#54306e', clothDk: '#271636', steelDk: '#4a3358', metallo: '#8a7a9e', pelo: '#241826', skin: '#bb8a68' },  // viola
      { cloth: '#8a6a1e', clothDk: '#3f300c', steelDk: '#5a4a24', metallo: '#9e8f60', pelo: '#5a4420', skin: '#e0b487' },  // ottone
    ],
    mago: [
      { body: '#7a1230', bodyDk: '#2c0713', accent: '#ffcf4a', skin: '#e2d6c6', orlo: 'rgba(255,207,74,.75)' },   // cremisi e oro
      { body: '#1d5a3a', bodyDk: '#0a2416', accent: '#a6ff3a', skin: '#cfc8bb', orlo: 'rgba(166,255,58,.75)' },   // verde e lime
      { body: '#2a2a30', bodyDk: '#0c0c10', accent: '#ff7a2b', skin: '#d8cec2', orlo: 'rgba(255,122,43,.75)' },   // cenere e brace
      { body: '#5e1d6e', bodyDk: '#230a2c', accent: '#ff5ad0', skin: '#e6dcd2', orlo: 'rgba(255,90,208,.75)' },   // porpora
    ],
    ladro: [
      { cloth: '#6a1f2c', clothDk: '#2e0d13', mant: '#3a1119', capp: '#5c1b28', skin: '#c08a5e', wood: '#5e3a1e' },   // bordeaux
      { cloth: '#1f3560', clothDk: '#0d1730', mant: '#101c33', capp: '#1c2f56', skin: '#d3ab80', wood: '#6a4a28' },   // blu notte
      { cloth: '#4a2a68', clothDk: '#1e1030', mant: '#251434', capp: '#3e2358', skin: '#b8845c', wood: '#4e3520' },   // viola
      { cloth: '#8a5a1e', clothDk: '#3c260a', mant: '#472c0e', capp: '#70481a', skin: '#e0b487', wood: '#a07440' },   // cuoio
    ],
  };

  const CLASSI = ['guerriero', 'mago', 'ladro'];

  // ===== QUANTO COSTA ====================================================================
  // Cinquanta monete un livello 1, quaranta in piu' per ogni livello: al quindicesimo sono 610.
  // La proporzione conta piu' del numero: un mercenario deve costare come un pezzo di equipaggiamento
  // buono, non come una serata al villaggio — se no diventa la scelta ovvia e non una scelta.
  const COSTO_BASE = 50, COSTO_PASSO = 40;
  function costo(lvl) { return COSTO_BASE + (Math.max(1, lvl | 0) - 1) * COSTO_PASSO; }

  // ===== QUANTO E' FORTE =================================================================
  // Un mercenario non ha carte, ne' passive ne' attive: ha la classe e i punti statistica. I punti sono
  // gli stessi che avresti tu a quel livello (uno per livello dal secondo, piu' uno a ogni rango fino al
  // quinto), spesi come li spenderebbe uno che fa quel mestiere e basta: due sulla statistica di classe
  // e uno sulla Costituzione, in giro. Al quindicesimo fanno 12 e 6 — la stessa forma della tua run.
  function punti(lvl) {
    const L = Math.max(1, Math.min(15, lvl | 0));
    let n = L - 1;
    for (const s of [3, 6, 9, 12]) if (L >= s) n++;
    return n;
  }
  const STAT_CLASSE = { guerriero: 'st_for', mago: 'st_int', ladro: 'st_des' };
  function distribuisci(heroId, lvl, maxPerStat) {
    const cap = maxPerStat || 12;
    const principale = STAT_CLASSE[heroId] || 'st_for';
    const buys = {}; buys[principale] = 0; buys.st_cos = 0;
    const n = punti(lvl);
    for (let i = 0; i < n; i++) {
      const vuole = (i % 3 === 2) ? 'st_cos' : principale;
      const altro = vuole === 'st_cos' ? principale : 'st_cos';
      if (buys[vuole] < cap) buys[vuole]++;
      else if (buys[altro] < cap) buys[altro]++;
    }
    if (!buys[principale]) delete buys[principale];
    if (!buys.st_cos) delete buys.st_cos;
    return buys;
  }

  // ===== IL CANDIDATO AL BANCO ===========================================================
  function genera(lvl, rnd) {
    const R = rnd || Math.random;
    const heroId = CLASSI[Math.floor(R() * CLASSI.length) % CLASSI.length];
    const nomi = NOMI[heroId];
    return {
      heroId,
      nome: nomi[Math.floor(R() * nomi.length) % nomi.length],
      tinta: Math.floor(R() * TINTE[heroId].length) % TINTE[heroId].length,
      lvl: Math.max(1, Math.min(15, lvl | 0)),
      costo: costo(lvl),
    };
  }
  function palette(heroId, tinta) { const t = TINTE[heroId] || TINTE.guerriero; return t[(tinta | 0) % t.length]; }

  // ===== COME PENSA ======================================================================
  // Questa non e' nuova: e' la testa dei bot che guidano le partite simulate dei test, rifinita in dieci
  // versioni. Sa le tre cose che servono: stare col capo, tenere la distanza giusta per l'arma che ha, e
  // sganciarsi quando e' ridotto male. Qui in piu' c'e' il guinzaglio — se il capo si allontana troppo
  // molla tutto e lo raggiunge: un mercenario che resta indietro a picchiare non serve a niente.
  const FERMO = { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false };
  const LEASH = 380, RIENTRO = 150, INGAGGIO = 620, CORPO_A_CORPO = 140;
  // v1.82.2 — quanto tempo di spinta a vuoto conta come "incastrato", e per quanto si aggira l'ostacolo
  const BLOCCO_T = 0.28, AGGIRA_T = 0.85, AGGIRA_ANG = 1.25;

  // Un mercenario si incastra in due modi, e sono lo stesso modo: spinge contro qualcosa che non cede.
  // Il motore fa scivolare lungo i muri (moveCircle muove un asse per volta), ma se spingi PERPENDICOLARE
  // alla roccia non c'e' niente su cui scivolare — e chi punta dritto a un nemico che sta dall'altra parte
  // di un masso spinge esattamente cosi'. Qui si misura l'INTENTO contro lo SPOSTAMENTO VERO: se per un
  // quarto di secondo il primo c'e' e il secondo no, per un secondo scarso si cammina di traverso (un lato
  // per volta, alternandolo) invece che dritto. E' l'equivalente di dare una spallata e girare attorno.
  function _incastro(m, dt) {
    const mosso = (m._px == null) ? 999 : Math.hypot(m.x - m._px, m.y - m._py);
    m._px = m.x; m._py = m.y;
    if (m._aggiraT > 0) { m._aggiraT -= dt; return; }
    if (m._voleva && mosso < 0.7) m._bloccoT = (m._bloccoT || 0) + dt; else m._bloccoT = 0;
    if (m._bloccoT > BLOCCO_T) { m._bloccoT = 0; m._aggiraT = AGGIRA_T; m._lato = (m._lato === 1 ? -1 : 1); }
  }
  // la direzione da tenere: dritta, oppure di traverso se si sta aggirando qualcosa
  function _dir(m, ang) {
    const a = (m._aggiraT > 0) ? ang + (m._lato || 1) * AGGIRA_ANG : ang;
    return { x: Math.cos(a), y: Math.sin(a) };
  }
  function pensa(room, m, capo, rnd) {
    const R = rnd || Math.random;
    const dt = room.dt || 1 / 30;
    _incastro(m, dt);
    if (!capo || m.dead || m.down) { m._voleva = 0; return FERMO; }
    const dxC = capo.x - m.x, dyC = capo.y - m.y;
    const dC = Math.hypot(dxC, dyC) || 1;
    const aC = Math.atan2(dyC, dxC);
    const esci = (i) => { m._voleva = (Math.abs(i.mx) + Math.abs(i.my)) > 0.1 ? 1 : 0; return i; };
    // 1) GUINZAGLIO. Oltre questa distanza dal capo non esiste altro che tornare da lui, e non si molla
    //    finche' non si e' rientrati per bene (RIENTRO): senza l'isteresi il mercenario oscilla sul bordo,
    //    un tick insegue e un tick torna, e sembra rotto anche se sta facendo esattamente cio' che deve.
    if (dC > LEASH) m._torna = 1; else if (dC < RIENTRO) m._torna = 0;
    if (m._torna) { const v = _dir(m, aC); return esci({ mx: v.x + (R() - 0.5) * 0.3, my: v.y + (R() - 0.5) * 0.3, aim: aC, shoot: false, q: false, e: false, dash: false }); }
    // 2) IL BERSAGLIO: il piu' vicino che si possa DAVVERO raggiungere. Prendere il piu' vicino e basta
    //    voleva dire puntare quello dietro al masso e restare li' a spingere: adesso serve la linea di
    //    vista, e senza linea di vista vale solo chi ti e' praticamente addosso (dietro l'angolo).
    let n = null, bd = Infinity;
    for (const mo of room.monsters) {
      if (mo.dead) continue;
      const d2 = (mo.x - m.x) * (mo.x - m.x) + (mo.y - m.y) * (mo.y - m.y);
      if (d2 >= bd) continue;
      if (d2 > CORPO_A_CORPO * CORPO_A_CORPO && !room.losClear(m.x, m.y, mo.x, mo.y)) continue;
      bd = d2; n = mo;
    }
    const d = n ? Math.sqrt(bd) : Infinity;
    if (!n || d > INGAGGIO) {
      if (dC < 110 && m._aggiraT <= 0) return esci({ mx: 0, my: 0, aim: aC, shoot: false, q: false, e: false, dash: false });
      const v = _dir(m, aC);
      return esci({ mx: v.x, my: v.y, aim: aC, shoot: false, q: false, e: false, dash: false });
    }
    // 3) DA QUI IN GIU' E' LA TESTA DEI BOT DEI TEST, rifinita dalla v1.52 alla v1.66: la distanza giusta
    //    e' quella della SUA arma (chi mena a 100 px non puo' tenersi a 160), ci si sgancia quando si e'
    //    ridotti male, e in mischia si molla il contatto mentre l'arma ricarica invece di restare
    //    appoggiati al nemico. Guidava le partite simulate; adesso guida un compagno vero.
    const aim = Math.atan2(n.y - m.y, n.x - m.x);
    const w = (m.hero && m.hero.weapon) || {};
    const rMax = w.melee ? (w.arcRadius || 100) : 320, rMin = w.melee ? rMax * 0.55 : 160;
    const ferito = m.hp / (m.maxHp + (m.stats ? m.stats.maxHpFlat || 0 : 0)) < 0.40;
    const ricarica = w.melee && m.fireCd > 0.35 / (w.fireRate || 1);
    const dir = (ferito || ricarica) ? 1 : (d < rMin ? -1 : (d > rMax ? 1 : 0));
    const v = _dir(m, aim + (dir < 0 ? Math.PI : 0));
    const passo = dir === 0 && m._aggiraT <= 0 ? 0 : 1;
    const i = { mx: v.x * passo + (R() - 0.5) * 0.5, my: v.y * passo + (R() - 0.5) * 0.5, aim,
      shoot: false, q: false, e: false, dash: false };
    if (ferito && m.cdDash <= 0 && R() < 0.10) i.dash = true;
    // si spara solo se il colpo puo' arrivare: contro un muro si sprecherebbe la ricarica
    i.shoot = d <= (w.melee ? rMax + 20 : 520) && (w.melee || room.losClear(m.x, m.y, n.x, n.y));
    return esci(i);                            // niente q/e: un mercenario non ha abilita', ne' attive ne' passive
  }

  return { NOMI, TINTE, CLASSI, COSTO_BASE, COSTO_PASSO, costo, punti, distribuisci, genera, palette, pensa, STAT_CLASSE, LEASH, INGAGGIO };
});
