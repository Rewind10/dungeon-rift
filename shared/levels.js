/* levels.js — LIVELLI, RANGHI, PUNTI E CARTE (UMD)
   v1.69 — Fino alla 1.68 la XP era una VALUTA: la raccoglievi e la spendevi al negozio di fine ondata.
   Da qui la XP e' una BARRA: sale, ti fa salire di livello, e a ogni livello ti da' un punto da spendere.
   E' la differenza fra comprare un potenziamento e diventare qualcosa.

   Il progetto completo, con le misure da cui escono tutti i numeri, sta in PROGRESSIONE.md.

   LE TRE REGOLE che reggono il file:
   1. CAP 20, UN LIVELLO PER ONDATA. La run finisce all'ondata 20, quindi la crescita del personaggio e
      quella del dungeon sono la stessa curva: non ci si ferma a livellare, si sale perche' si avanza.
      La curva `107 * L^1,54` e' tarata sull'XP MISURATA (una run intera rende ~11.000 XP, il cap ne
      chiede 10.670): chi arriva in fondo arriva al cap, chi gioca bene ci arriva un paio di ondate prima.
   2. UN RANGO OGNI 5 LIVELLI, cioe' su ogni boss. Il rango da' un punto in piu' e una carta a scelta
      fra tre; il quinto, invece delle carte, da' il BIVIO fra due specializzazioni.
   3. UNA STATISTICA AL TETTO COSTA 22 PUNTI SUI 23 di una run intera. E' la regola della 1.66 tradotta
      da valuta a punti: o ti specializzi, o ti distribuisci, e nessuna delle due e' sbagliata. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Levels = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAX_LEVEL = 20;
  // 1 punto per livello (19 in una run) piu' 1 per rango (4): 23 in tutto, contro i 22 che costa
  // portare una statistica al tetto. I ranghi cadono sui boss, quindi il punto arriva proprio li'.
  const POINTS_PER_LEVEL = 1, POINTS_PER_RANK = 1;
  const XP_TO_COIN = 8;                 // oltre il cap la XP diventa monete: le ultime uccisioni valgono ancora

  // XP necessaria per passare dal livello L-1 al livello L (indice = livello raggiunto).
  // Ricavata da `107 * L^1,54` e arrotondata a numeri leggibili; il cumulato finale e' 10.670.
  const XP_STEP = [0, 0, 200, 270, 320, 370, 410, 450, 490, 520, 560, 590, 620, 640, 670, 700, 720, 750, 770, 800, 820];
  const XP_CUM = (() => { const a = [0, 0]; let t = 0; for (let L = 2; L <= MAX_LEVEL; L++) { t += XP_STEP[L]; a[L] = t; } return a; })();
  const XP_FOR_CAP = XP_CUM[MAX_LEVEL];

  function levelForXp(xp) { let L = 1; while (L < MAX_LEVEL && xp >= XP_CUM[L + 1]) L++; return L; }
  function xpForLevel(L) { return XP_CUM[Math.max(1, Math.min(MAX_LEVEL, L))] || 0; }
  // Quanto manca al prossimo livello e a che punto sei fra i due (0..1): serve alla barra dell'HUD.
  function progress(xp) {
    const L = levelForXp(xp);
    if (L >= MAX_LEVEL) return { level: L, cur: 0, need: 0, frac: 1 };
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
  function pointsForLevel(L) { return Math.max(0, (Math.min(MAX_LEVEL, L) - 1) * POINTS_PER_LEVEL); }

  // ===== CARTE DI RANGO ======================================================================
  // Ai ranghi II, III e IV si sceglie 1 carta su 3. Sono potenziamenti DI CLASSE: e' la differenza
  // con i boon, che restano generici e validi per chiunque. Le carte non si tolgono mai e non si
  // ripetono, quindi `apply` viene chiamata una volta sola e puo' scrivere additivo senza paura.
  //
  // Ogni carta scrive su `p.perk`, il blocco che Room.js legge in partita. Aggiungere una carta
  // significa: una riga qui + il punto in Room.js che legge la sua bandiera. Nient'altro.
  const CARDS = {
    guerriero: {
      2: [
        { id: 'gue_parata', name: 'Parata', icon: '🛡️',
          desc: 'Per 0,6s dopo ogni fendente i danni frontali sono ridotti del 35%', apply: p => p.perk.parata = 1 },
        { id: 'gue_sfondamento', name: 'Sfondamento', icon: '💥',
          desc: 'Il fendente colpisce 2 bersagli in piu e i secondari incassano il 70% invece del 55%', apply: p => p.perk.sfondamento = 1 },
        { id: 'gue_sangue', name: 'Sangue Freddo', icon: '🩸',
          desc: 'Sotto il 40% dei PV, +25% danno in mischia', apply: p => p.perk.sangueFreddo = 1 },
      ],
      3: [
        { id: 'gue_rotante', name: 'Colpo Rotante', icon: '🌀',
          desc: 'Ogni 4° fendente colpisce a 360° invece che nel solo arco frontale', apply: p => p.perk.rotante = 4 },
        { id: 'gue_sprone', name: 'Sprone', icon: '🐎',
          desc: 'Lo scatto travolge: chi attraversi subisce il 60% del danno dell arma e viene respinto', apply: p => p.perk.sprone = 0.6 },
        { id: 'gue_pelle', name: 'Seconda Pelle', icon: '❤️‍🩹',
          desc: 'Rigenera 1,5 PV al secondo, sempre', apply: p => p.stats.regen += 1.5 },
      ],
      4: [
        { id: 'gue_esecuzione', name: 'Esecuzione', icon: '☠️',
          desc: 'I nemici sotto il 15% dei PV muoiono al primo colpo (mai i boss)', apply: p => { p.boon.execute += 1; p.boon.executeBonus = (p.boon.executeBonus || 0) + 0.03; } },
        { id: 'gue_muro', name: 'Muro', icon: '🧱',
          desc: 'Mentre stai fermo, −30% danni subiti', apply: p => p.perk.muro = 0.30 },
        { id: 'gue_furia', name: 'Furia Crescente', icon: '🔥',
          desc: 'Ogni nemico colpito nello stesso fendente da +8% danno al fendente successivo (max +40%)', apply: p => p.perk.furia = 0.08 },
      ],
    },
    mago: {
      2: [
        { id: 'mag_densa', name: 'Bolla Densa', icon: '🫧',
          desc: '+35% raggio della bolla, e chi viene colpito rallenta', apply: p => { p.perk.bollaDensa = 0.35; p.boon.slow += 1; } },
        { id: 'mag_eco', name: 'Eco Arcana', icon: '🔁',
          desc: 'Il 20% dei lanci parte doppio, gratis', apply: p => p.boon.echo += 1 },
        { id: 'mag_mente', name: 'Mente Lucida', icon: '🧠',
          desc: '+12% cadenza e +8% velocita delle bolle', apply: p => { p.stats.schoolRate.magic += 0.12; p.perk.bulletSpeed = (p.perk.bulletSpeed || 0) + 0.08; } },
      ],
      3: [
        { id: 'mag_frattura', name: 'Frattura', icon: '➰',
          desc: 'Le bolle perforano 1 nemico in piu', apply: p => p.boon.pierce += 1 },
        { id: 'mag_scudo', name: 'Scudo di Mana', icon: '🔷',
          desc: 'Assorbe 60 danni; si ricarica dopo 8s senza subire colpi', apply: p => { p.perk.mana = 60; p.manaShield = 60; } },
        { id: 'mag_runa', name: 'Runa Vagante', icon: '🔯',
          desc: 'Una runa ti orbita attorno e spara una bolla ogni 3s', apply: p => p.perk.runa = 1 },
      ],
      4: [
        { id: 'mag_detona', name: 'Detonazione', icon: '💣',
          desc: 'Le bolle esplodono all impatto: 40% del danno in un raggio di 70px', apply: p => p.perk.detona = 1 },
        { id: 'mag_vuoto', name: 'Passo del Vuoto', icon: '🌌',
          desc: 'Lo scatto diventa teletrasporto e attraversa i muri', apply: p => p.perk.passoVuoto = 1 },
        { id: 'mag_converg', name: 'Convergenza', icon: '⏳',
          desc: 'Se non lanci per 1,5s, la bolla successiva fa danno TRIPLO', apply: p => p.perk.convergenza = 1.5 },
      ],
    },
    ladro: {
      2: [
        { id: 'lad_cocca', name: 'Doppia Cocca', icon: '🏹',
          desc: 'Ogni 3° tiro parte con una seconda freccia a fianco', apply: p => p.perk.doppiaCocca = 3 },
        { id: 'lad_felpato', name: 'Passo Felpato', icon: '👣',
          desc: '+12% velocita e +20% durata dello scatto', apply: p => { p.stats.speedMult += 0.12; p.perk.dashLong = (p.perk.dashLong || 0) + 0.2; } },
        { id: 'lad_veleno', name: 'Punta Avvelenata', icon: '🧪',
          desc: 'Le frecce avvelenano: danno nel tempo cumulativo', apply: p => p.boon.poison += 1 },
      ],
      3: [
        { id: 'lad_rapido', name: 'Tiro Rapido', icon: '⚡',
          desc: '+25% cadenza per 3s dopo ogni uccisione', apply: p => p.boon.killHaste += 1 },
        { id: 'lad_pesanti', name: 'Frecce Pesanti', icon: '🪨',
          desc: '+30% danno, −15% cadenza', apply: p => { p.stats.schoolDmg.ranged += 0.30; p.stats.schoolRate.ranged -= 0.15; } },
        { id: 'lad_ombra', name: 'Ombra', icon: '🌑',
          desc: 'Dopo lo scatto sei invisibile ai nemici per 1,5s', apply: p => p.perk.ombra = 1.5 },
      ],
      4: [
        { id: 'lad_spalle', name: 'Colpo alle Spalle', icon: '🗡️',
          desc: '+80% danno contro i nemici che non ti stanno guardando', apply: p => p.perk.spalle = 0.8 },
        { id: 'lad_pioggia', name: 'Pioggia', icon: '🌧️',
          desc: 'Ogni 5° tiro e un ventaglio di 5 frecce', apply: p => p.perk.pioggia = 5 },
        { id: 'lad_elusione', name: 'Elusione', icon: '💨',
          desc: '15% di probabilita di schivare del tutto un colpo', apply: p => p.perk.elusione = 0.15 },
      ],
    },
  };

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
    MAX_LEVEL, POINTS_PER_LEVEL, POINTS_PER_RANK, XP_TO_COIN, XP_STEP, XP_CUM, XP_FOR_CAP,
    levelForXp, xpForLevel, progress,
    RANK_LEVELS, RANK_NAMES, rankForLevel, levelForRank, rankName,
    statPointCost, statPointsTo, pointsForLevel,
    CARDS, CARD_BY_ID, cardsFor, SPECS, SPEC_BY_ID, specsFor,
  };
});
