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
  const TINTE = {
    guerriero: [
      { cloth: '#5a3a2c', clothDk: '#2e1c14', steelDk: '#454b56', pelo: '#3a2a18', skin: '#c08a5e' },
      { cloth: '#2c4a5a', clothDk: '#14262e', steelDk: '#38404a', pelo: '#5a4a2a', skin: '#d0a578' },
      { cloth: '#5a2c3a', clothDk: '#2c141c', steelDk: '#4a4048', pelo: '#221a12', skin: '#b8845c' },
      { cloth: '#4a4a2c', clothDk: '#242414', steelDk: '#3e4652', pelo: '#6a5a3a', skin: '#c9a074' },
    ],
    mago: [
      { body: '#3a2c6a', bodyDk: '#150f2c', accent: '#c88cff', skin: '#d8cfc4', orlo: 'rgba(200,140,255,.75)' },
      { body: '#2c5a4a', bodyDk: '#0f2620', accent: '#7dffc0', skin: '#cfc6bb', orlo: 'rgba(125,255,192,.75)' },
      { body: '#6a3a2c', bodyDk: '#2c1610', accent: '#ffb066', skin: '#dcd2c6', orlo: 'rgba(255,176,102,.75)' },
      { body: '#243a5a', bodyDk: '#0e1828', accent: '#8ac8ff', skin: '#d2cabf', orlo: 'rgba(138,200,255,.75)' },
    ],
    ladro: [
      { cloth: '#4a3a2c', clothDk: '#241c14', skin: '#c08a5e', wood: '#6a4a28' },
      { cloth: '#2c3a52', clothDk: '#141c28', skin: '#d0a578', wood: '#7a5a34' },
      { cloth: '#52304a', clothDk: '#281826', skin: '#b8845c', wood: '#5e422a' },
      { cloth: '#2c4a34', clothDk: '#14261a', skin: '#c9a074', wood: '#8a6534' },
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
  const LEASH = 380, RIENTRO = 150, INGAGGIO = 620;
  function pensa(room, m, capo, rnd) {
    const R = rnd || Math.random;
    if (!capo || m.dead || m.down) return FERMO;
    const dxC = capo.x - m.x, dyC = capo.y - m.y;
    const dC = Math.hypot(dxC, dyC) || 1;
    const aC = Math.atan2(dyC, dxC);
    // 1) GUINZAGLIO. Oltre questa distanza dal capo non esiste altro che tornare da lui, e non si molla
    //    finche' non si e' rientrati per bene (RIENTRO): senza l'isteresi il mercenario oscilla sul bordo,
    //    un tick insegue e un tick torna, e sembra rotto anche se sta facendo esattamente cio' che deve.
    if (dC > LEASH) m._torna = 1; else if (dC < RIENTRO) m._torna = 0;
    if (m._torna) return { mx: Math.cos(aC) + (R() - 0.5) * 0.4, my: Math.sin(aC) + (R() - 0.5) * 0.4, aim: aC, shoot: false, q: false, e: false, dash: false };
    // 2) il bersaglio: il mostro vivo piu' vicino, dentro il raggio d'ingaggio
    let n = null, bd = Infinity;
    for (const mo of room.monsters) { if (mo.dead) continue; const d2 = (mo.x - m.x) * (mo.x - m.x) + (mo.y - m.y) * (mo.y - m.y); if (d2 < bd) { bd = d2; n = mo; } }
    const d = n ? Math.sqrt(bd) : Infinity;
    if (!n || d > INGAGGIO) {
      if (dC < 110) return { mx: 0, my: 0, aim: aC, shoot: false, q: false, e: false, dash: false };
      return { mx: Math.cos(aC), my: Math.sin(aC), aim: aC, shoot: false, q: false, e: false, dash: false };
    }
    // 3) DA QUI IN GIU' E' LA TESTA DEI BOT DEI TEST, rifinita dalla v1.52 alla v1.66: la distanza giusta
    //    e' quella della SUA arma (chi mena a 100 px non puo' tenersi a 160), ci si sgancia quando si e'
    //    ridotti male, e in mischia si molla il contatto mentre l'arma ricarica invece di restare
    //    appoggiati al nemico. Guidava le partite simulate; adesso guida un compagno vero.
    const i = { mx: 0, my: 0, aim: Math.atan2(n.y - m.y, n.x - m.x), shoot: false, q: false, e: false, dash: false };
    const w = (m.hero && m.hero.weapon) || {};
    const rMax = w.melee ? (w.arcRadius || 100) : 320, rMin = w.melee ? rMax * 0.55 : 160;
    const ferito = m.hp / (m.maxHp + (m.stats ? m.stats.maxHpFlat || 0 : 0)) < 0.40;
    const ricarica = w.melee && m.fireCd > 0.35 / (w.fireRate || 1);
    const dir = (ferito || ricarica) ? 1 : (d < rMin ? -1 : (d > rMax ? 1 : 0));
    i.mx = Math.cos(i.aim) * dir + (R() - 0.5) * 0.6;
    i.my = Math.sin(i.aim) * dir + (R() - 0.5) * 0.6;
    if (ferito && m.cdDash <= 0 && R() < 0.10) i.dash = true;
    i.shoot = d <= (w.melee ? rMax + 20 : 520);
    return i;                                  // niente q/e: un mercenario non ha abilita', ne' attive ne' passive
  }

  return { NOMI, TINTE, CLASSI, COSTO_BASE, COSTO_PASSO, costo, punti, distribuisci, genera, palette, pensa, STAT_CLASSE, LEASH, INGAGGIO };
});
