/* levels.js — LIVELLI, RANGHI, PUNTI E CARTE (UMD)
   v1.69 — Fino alla 1.68 la XP era una VALUTA: la raccoglievi e la spendevi al negozio di fine ondata.
   Da qui la XP e' una BARRA: sale, ti fa salire di livello, e a ogni livello ti da' un punto da spendere.
   E' la differenza fra comprare un potenziamento e diventare qualcosa.

   Il progetto completo, con le misure da cui escono tutti i numeri, sta in PROGRESSIONE.md.

   LE TRE REGOLE che reggono il file:
   1. NESSUN TETTO AI LIVELLI. Il livello non e' piu' agganciato all'ondata: si sale finche' si accumula
      esperienza, e l'esperienza arriva da PIU' FONTI (nemici uccisi, casse aperte, oggetti raccolti sulla
      mappa, e cio' che verra' aggiunto dopo). Un tetto che coincideva con la fine della partita non aveva
      senso: gli ultimi livelli si prendevano sui titoli di coda invece di giocarli.
   2. UN RANGO OGNI 5 LIVELLI. Il rango da' un punto in piu' e il titolo nuovo; il quinto da' il BIVIO fra
      due specializzazioni. E' il posto dove entreranno le ABILITA' DI CLASSE: il contenitore c'e' gia'.
   3. UNA STATISTICA AL TETTO COSTA 22 PUNTI. La curva dei costi cresce a scaglioni (1 fino al 4° livello,
      2 fino al 10°, 3 per gli ultimi due): o ti specializzi, o ti distribuisci. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Levels = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // v1.70 — NESSUN TETTO. La curva resta `107 * L^1,54` ma non si ferma piu' al 20: i costi si calcolano
  // a richiesta e si tengono in cache man mano che servono, cosi' non c'e' un limite scritto da nessuna
  // parte. `MAX_LEVEL` non esiste piu': cercarlo nel codice non deve trovare niente.
  const POINTS_PER_LEVEL = 1, POINTS_PER_RANK = 1;

  // XP per passare dal livello L-1 al livello L. Arrotondata per essere leggibile a schermo.
  // NB: arrotondare a 25 sopra i 1000 sembrava piu' pulito, ma oltre il livello 30 la curva cresce di
  // ~20 XP a livello: due livelli vicini finivano allo stesso prezzo. Un livello non deve MAI costare
  // quanto il precedente, quindi il passo dell'arrotondamento resta 10.
  function arrotonda(x) { return x < 100 ? Math.round(x / 5) * 5 : Math.round(x / 10) * 10; }
  function stepGrezzo(L) { return 107 * (Math.pow(L, 1.54) - Math.pow(L - 1, 1.54)); }
  const XP_STEP = [0, 0];       // XP_STEP[L] = quanto costa arrivare al livello L
  const XP_CUM = [0, 0];        // XP_CUM[L]  = XP totale necessaria per essere di livello L
  function estendiFino(L) {
    // la monotonia e' garantita a mano, non lasciata all'arrotondamento: un livello non deve MAI costare
    // quanto o meno del precedente, a nessuna altezza della curva.
    for (let i = XP_STEP.length; i <= L; i++) {
      const g = arrotonda(stepGrezzo(i));
      XP_STEP[i] = i > 2 ? Math.max(g, XP_STEP[i - 1] + 10) : g;
      XP_CUM[i] = XP_CUM[i - 1] + XP_STEP[i];
    }
  }
  estendiFino(30);              // i primi 30 sono precalcolati: coprono qualunque partita normale

  function levelForXp(xp) {
    let L = 1;
    while (true) { estendiFino(L + 1); if (xp < XP_CUM[L + 1]) return L; L++; if (L > 999) return L; }
  }
  function xpForLevel(L) { estendiFino(Math.max(1, L)); return XP_CUM[Math.max(1, L)] || 0; }
  function xpStep(L) { estendiFino(Math.max(2, L)); return XP_STEP[Math.max(2, L)] || 0; }
  // Quanto manca al prossimo livello e a che punto sei fra i due (0..1): serve alla barra dell'HUD.
  function progress(xp) {
    const L = levelForXp(xp); estendiFino(L + 1);
    const base = XP_CUM[L], next = XP_CUM[L + 1];
    return { level: L, cur: xp - base, need: next - base, frac: (xp - base) / (next - base) };
  }

  // ===== RANGHI ==============================================================================
  // Soglie in livelli: I dal 1, II dal 5, III dal 10, IV dal 15, V dal 20 — cioe' su ogni boss.
  const RANK_LEVELS = [1, 5, 10, 15, 20];
  function rankForLevel(L) { let r = 1; for (let i = 0; i < RANK_LEVELS.length; i++) if (L >= RANK_LEVELS[i]) r = i + 1; return r; }
  function levelForRank(r) { return RANK_LEVELS[Math.max(0, Math.min(RANK_LEVELS.length - 1, r - 1))]; }

  const RANK_NAMES = {
    guerriero: ['Guerriero', 'Guerriero Esperto', 'Veterano', 'Campione', null],
    mago: ['Apprendista', 'Mago Giovane', 'Mago', 'Mago Anziano', null],
    ladro: ['Ladro', 'Furfante', 'Predone', 'Ombra', null],
  };
  // Il rango V non ha un nome fisso: e' quello della specializzazione scelta.
  function rankName(heroId, level, specId) {
    const r = rankForLevel(level);
    if (r >= 5) { const s = SPEC_BY_ID[specId]; return s ? s.name : 'Leggenda'; }
    return (RANK_NAMES[heroId] || RANK_NAMES.guerriero)[r - 1];
  }

  // ===== PUNTI ===============================================================================
  // Costo per portare una statistica DA `lvl` A `lvl+1`. Cresce a scaglioni: 1 fino al 4°, 2 fino al
  // 10°, 3 per gli ultimi due. Totale per il tetto: 22 punti, contro i 23 di una run intera.
  function statPointCost(lvl) { return lvl < 4 ? 1 : (lvl < 10 ? 2 : 3); }
  function statPointsTo(lvl) { let t = 0; for (let i = 0; i < lvl; i++) t += statPointCost(i); return t; }
  // Punti guadagnati arrivando al livello L (senza contare quelli dei boss).
  function pointsForLevel(L) { return Math.max(0, (L - 1) * POINTS_PER_LEVEL); }

  // ===== CARTE DI RANGO — RIMOSSE in v1.70 ====================================================
  // Le 27 carte generiche (Parata, Sfondamento, Bolla Densa...) sono state tolte: al loro posto
  // arriveranno le ABILITA' DI CLASSE, sbloccate a livelli specifici come in un gioco di ruolo (le
  // magie del mago, i colpi del guerriero). Il rango resta il momento in cui il personaggio evolve e
  // il contenitore e' gia' pronto: `cardsFor()` risponde vuoto, quindi il server salta l'offerta senza
  // rami condizionali sparsi. Quando le abilita' arriveranno, basta riempire questa tabella.
  const CARDS = {};

  // ===== RANGO V — il bivio ==================================================================
  // Non sono lo stesso personaggio piu' forte: in ogni coppia uno rende SUBITO e uno rende DI PIU'
  // ma chiede qualcosa (una squadra, un bersaglio grosso, il posizionamento). Se dalle misure uscisse
  // che un ramo e' semplicemente migliore, va corretto quello — non il suo gemello.
  // v1.69 — di ogni specializzazione e' implementato il PASSIVO. Le abilita' attive (Giuramento,
  // Turbine, Meteora, Catena Nera, Marchio, Salva) arrivano con la barra delle abilita'.
  const SPECS = {
    guerriero: [
      { id: 'paladino', name: 'Paladino', icon: '✨', color: '#ffe9a8', hero: 'guerriero',
        desc: 'Aura di 220px: cura i compagni e riduce del 18% i danni subiti, a te e a loro',
        abilita: 'Giuramento — per 5s tu e i compagni nell aura siete immuni al primo colpo',
        apply: p => { p.perk.aura = 220; p.perk.auraCura = 0.02; p.perk.auraDR = 0.18; } },
      { id: 'maestro', name: "Maestro d'Armi", icon: '⚔️', color: '#ffd27a', hero: 'guerriero',
        desc: '+35% cadenza del fendente, +20% apertura dell arco, rinculo x1,5',
        abilita: 'Turbine — tre fendenti a 360° in 1,2s',
        apply: p => { p.stats.schoolRate.melee += 0.35; p.perk.arcoPiu = 0.20; p.stats.knockMult *= 1.5; } },
    ],
    mago: [
      { id: 'arcimago', name: 'Arcimago', icon: '🔮', color: '#c48cff', hero: 'mago',
        desc: 'Ogni bolla esplode: 60% del danno in un raggio di 90px',
        abilita: 'Meteora — tre esplosioni a caduta sul punto mirato',
        apply: p => { p.perk.detona = 1; p.perk.detonaR = 90; p.perk.detonaQ = 0.6; } },
      { id: 'stregone', name: 'Stregone', icon: '🕯️', color: '#ff5a7a', hero: 'mago',
        desc: 'La bolla diventa un dardo che rimbalza su 3 nemici a danno pieno',
        abilita: 'Catena Nera — fulmine che rimbalza fra 8 nemici',
        apply: p => { p.perk.catena = 3; p.perk.catenaPiena = 1; } },
    ],
    ladro: [
      { id: 'assassino', name: 'Assassino', icon: '🔪', color: '#9b5de5', hero: 'ladro',
        desc: 'Critico al 35%, danno critico x3, i colpi alle spalle sono SEMPRE critici',
        abilita: 'Marchio — segna un nemico: prende +50% danni da chiunque',
        apply: p => { p.stats.critChance = Math.max(p.stats.critChance, 0.35); p.stats.critMult = Math.max(p.stats.critMult, 3.0); p.perk.spalleCrit = 1; if (!p.perk.spalle) p.perk.spalle = 0.8; } },
      { id: 'cacciatore', name: 'Cacciatore di Teste', icon: '🎯', color: '#9ef0b0', hero: 'ladro',
        desc: 'Ogni tiro e un ventaglio di 3 frecce che perforano 3 nemici',
        abilita: 'Salva — 15 frecce in 2s',
        apply: p => { p.stats.extraProjectiles += 2; p.boon.pierce += 2; } },
    ],
  };
  const SPEC_BY_ID = {}; for (const h in SPECS) for (const s of SPECS[h]) SPEC_BY_ID[s.id] = s;
  const CARD_BY_ID = {}; for (const h in CARDS) for (const r in CARDS[h]) for (const c of CARDS[h][r]) { c.hero = h; c.rank = +r; CARD_BY_ID[c.id] = c; }

  function cardsFor(heroId, rank) { return (CARDS[heroId] && CARDS[heroId][rank]) || []; }
  function specsFor(heroId) { return SPECS[heroId] || []; }

  return {
    POINTS_PER_LEVEL, POINTS_PER_RANK, XP_STEP, XP_CUM,
    levelForXp, xpForLevel, xpStep, progress,
    RANK_LEVELS, RANK_NAMES, rankForLevel, levelForRank, rankName,
    statPointCost, statPointsTo, pointsForLevel,
    CARDS, CARD_BY_ID, cardsFor, SPECS, SPEC_BY_ID, specsFor,
  };
});
