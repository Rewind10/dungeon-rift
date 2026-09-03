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

  // v1.79 — IL TETTO TORNA, E VALE 15. Dalla 1.70 alla 1.78 non c'era: si saliva finche' c'era XP, e
  // dall'ondata 12 in poi si saliva a vuoto. Adesso la crescita finisce al 15, dove si sceglie la
  // specializzazione, e l'XP raccolta dopo non serve piu' a niente — come in un gioco di ruolo.
  const POINTS_PER_LEVEL = 1, POINTS_PER_RANK = 1;
  const MAX_LEVEL = 15;

  // I LIVELLI DOVE SI SCEGLIE UN'ABILITA' PASSIVA, uno per scaglione. Il 15 non e' qui: quello e' la
  // specializzazione, che e' un'altra cosa.
  const SCAGLIONI = [
    { lvl: 3,  tier: 'uncommon' },
    { lvl: 6,  tier: 'rare' },
    { lvl: 9,  tier: 'epic' },
    { lvl: 12, tier: 'divine' },
  ];
  const SCAGLIONE_BY_LVL = {}; for (const s of SCAGLIONI) SCAGLIONE_BY_LVL[s.lvl] = s.tier;
  function tierForLevel(L) { return SCAGLIONE_BY_LVL[L] || null; }

  // XP_STEP[L] = quanto costa arrivare al livello L. Non e' una formula: e' una TABELLA scritta a mano,
  // perche' ogni scalino e' stato scelto guardando quanta esperienza l'ondata corrispondente mette
  // davvero a terra.
  //
  // v1.79.1 — RITARATA, ED E' STATO UN ERRORE DI MISURA. La prima taratura veniva da una simulazione in
  // cui il giocatore uccideva tutto ISTANTANEAMENTE: cosi' facendo la combo restava incollata al massimo
  // (x2,5) e l'esperienza risultava piu' che doppia di quella vera. Sul campo, alla quinta ondata si era
  // ancora di livello 2. La misura onesta e' l'XP che i mostri di un'ondata mettono a terra senza combo:
  // 102 alla prima ondata, 598 cumulate alla quarta, 6.394 alla sedicesima (col conteggio nuovo dei
  // nemici, v1.79.1). Su quella base — piu' un margine ragionevole per combo, casse e premio di velocita' —
  // il livello 15 costa 9.470 invece di 14.100, e i primi due scalini sono tarati perche il livello 2
  // arrivi entro la SECONDA ondata e il primo scaglione (il 3) entro la QUARTA, coi soli nemici uccisi:
  // e la condizione che il TEST 53 verifica ondata per ondata.
  //
  // Gli ultimi scalini restano i piu' cari: sono loro a tenere il 15 nell'ultimo quarto di partita.
  // Nel dubbio si toccano quelli, non tutta la curva.
  const XP_STEP = [0, 0, 200, 300, 420, 520, 600, 680, 740, 770, 780, 800, 830, 880, 950, 1000];
  const XP_CUM = [0, 0];
  for (let L = 2; L <= MAX_LEVEL; L++) XP_CUM[L] = XP_CUM[L - 1] + XP_STEP[L];
  // cumulate: 400 · 1100 · 1830 · 2600 · 3400 · 4300 · 5250 · 6300 · 7400 · 8550 · 9750 · 11050 · 12500 · 14100

  function levelForXp(xp) { let L = 1; while (L < MAX_LEVEL && xp >= XP_CUM[L + 1]) L++; return L; }
  function xpForLevel(L) { return XP_CUM[Math.max(1, Math.min(MAX_LEVEL, L))] || 0; }
  function xpStep(L) { return XP_STEP[Math.max(2, Math.min(MAX_LEVEL, L))] || 0; }
  function alTetto(L) { return L >= MAX_LEVEL; }
  // Quanto manca al prossimo livello e a che punto sei fra i due (0..1): serve alla barra dell'HUD.
  // Al tetto la barra e' piena e `need` vale 0: chi la disegna deve leggere `cap`, non dividere per need.
  function progress(xp) {
    const L = levelForXp(xp);
    if (L >= MAX_LEVEL) return { level: L, cur: 0, need: 0, frac: 1, cap: true };
    const base = XP_CUM[L], next = XP_CUM[L + 1];
    return { level: L, cur: xp - base, need: next - base, frac: (xp - base) / (next - base), cap: false };
  }

  // ===== RANGHI ==============================================================================
  // v1.79 — i ranghi coincidono coi momenti di scelta: 3, 6, 9, 12 e 15. La prima fascia (livelli 1-2)
  // e' il titolo di partenza e non e' un rango guadagnato; l'ultima (15) non da' un punto ma la
  // SPECIALIZZAZIONE. In mezzo, quattro ranghi da un punto l'uno: 14 punti dai livelli + 4 dai ranghi
  // fanno i 18 punti di una run intera (PROGRESSIONE-2.md §12).
  const RANK_LEVELS = [1, 3, 6, 9, 12, 15];
  const RANK_SPEC = 6;          // la sesta fascia e' la specializzazione
  function rankForLevel(L) { let r = 1; for (let i = 0; i < RANK_LEVELS.length; i++) if (L >= RANK_LEVELS[i]) r = i + 1; return r; }
  function levelForRank(r) { return RANK_LEVELS[Math.max(0, Math.min(RANK_LEVELS.length - 1, r - 1))]; }
  // Punti guadagnati salendo di rango: la fascia di partenza e quella della specializzazione non ne danno.
  function puntiPerRango(r) { return (r >= 2 && r <= 5) ? POINTS_PER_RANK : 0; }

  // Sei fasce, non piu' cinque: la prima e' il titolo con cui si comincia (livelli 1-2), l'ultima e' la
  // specializzazione e non ha un nome fisso.
  const RANK_NAMES = {
    guerriero: ['Guerriero', 'Guerriero Esperto', 'Veterano', 'Campione', 'Signore delle Lame', null],
    mago: ['Apprendista', 'Mago Giovane', 'Mago', 'Mago Anziano', 'Magister', null],
    ladro: ['Ladro', 'Furfante', 'Predone', 'Ombra', 'Spettro', null],
  };
  function rankName(heroId, level, specId) {
    const r = rankForLevel(level);
    if (r >= RANK_SPEC) { const s = SPEC_BY_ID[specId]; return s ? s.name : 'Leggenda'; }
    return (RANK_NAMES[heroId] || RANK_NAMES.guerriero)[r - 1];
  }

  // ===== PUNTI ===============================================================================
  // Costo per portare una statistica DA `lvl` A `lvl+1`. Cresce a scaglioni: 1 fino al 4°, 2 fino al
  // 10°, 3 per gli ultimi due. Totale per il tetto: 22 punti, contro i 23 di una run intera.
  // v1.79 — COSTO FISSO: 1 punto per livello, a qualunque altezza. Gli scaglioni 1/2/3 sono spariti.
  // Il conto e' esatto: 18 punti in una run, cappare una statistica ne costa 12 e portarne una seconda
  // a 6 ne costa 6. Cappare DUE statistiche (24) resta impossibile, che e' la regola voluta.
  function statPointCost(lvl) { return 1; }
  function statPointsTo(lvl) { return lvl; }
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
    POINTS_PER_LEVEL, POINTS_PER_RANK, XP_STEP, XP_CUM, MAX_LEVEL, alTetto,
    SCAGLIONI, tierForLevel,
    levelForXp, xpForLevel, xpStep, progress,
    RANK_LEVELS, RANK_NAMES, RANK_SPEC, rankForLevel, levelForRank, rankName, puntiPerRango,
    statPointCost, statPointsTo, pointsForLevel,
    CARDS, CARD_BY_ID, cardsFor, SPECS, SPEC_BY_ID, specsFor,
  };
});
