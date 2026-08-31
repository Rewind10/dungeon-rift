/* loot.js — buff casse, armi (+EVOLUZIONI), item, negozio XP, BOON a scelta (UMD) */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Loot = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CRATE_BUFFS = [
    { id: 'b_dmg', name: 'Furia', icon: '⚔️', color: '#ff6b6b', dur: 12, desc: '+60% danno' },
    { id: 'b_speed', name: 'Fretta', icon: '💨', color: '#8bd6ff', dur: 12, desc: '+45% velocità' },
    { id: 'b_rate', name: 'Frenesia', icon: '⚡', color: '#ffd24a', dur: 12, desc: '+70% cadenza' },
    { id: 'b_shield', name: 'Egida', icon: '🛡️', color: '#7dffea', dur: 10, desc: '-50% danni' },
    { id: 'b_regen', name: 'Vigore', icon: '➕', color: '#4bd66b', dur: 10, desc: 'Rigeneri 8 PV/s' },
    { id: 'b_quad', name: 'Salve Multiple', icon: '🔱', color: '#b061ff', dur: 10, desc: '+2 proiettili' },
  ];

  // Armi raccoglibili (3 tipi × 3 livelli). A Lv.3 + statistica richiesta → EVOLUZIONE.
  const WEAPONS = {
    scatter: { id: 'scatter', name: 'Dispersore', icon: '🔫', color: '#ffb020',
      evo: { stat: 'st_for', need: 3, id: 'scatter_evo', name: 'Uragano d\'Acciaio', desc: 'Ventaglio di 12 pallini con onda d\'urto', color: '#ffe45e' },
      tiers: [
        { pellets: 4, dmg: 0.55, spread: 0.24, knock: 2.2, rate: 0.85, range: 340 },
        { pellets: 6, dmg: 0.58, spread: 0.22, knock: 2.6, rate: 0.9, range: 380 },
        { pellets: 8, dmg: 0.62, spread: 0.20, knock: 3.0, rate: 1.0, range: 420 }] },
    burst: { id: 'burst', name: 'Raffica', icon: '⚡', color: '#00f0c8',
      evo: { stat: 'st_des', need: 3, id: 'burst_evo', name: 'Tempesta di Piombo', desc: 'Cadenza estrema, proiettili perforanti', color: '#7dffea' },
      tiers: [
        { pellets: 1, dmg: 0.80, spread: 0.05, rate: 1.8, pierce: 0, range: 560, speed: 900 },
        { pellets: 2, dmg: 0.80, spread: 0.07, rate: 2.1, pierce: 0, range: 580, speed: 940 },
        { pellets: 3, dmg: 0.82, spread: 0.08, rate: 2.4, pierce: 1, range: 600, speed: 980 }] },
    beam: { id: 'beam', name: 'Cannone a Fascio', icon: '🔷', color: '#3aa0ff',
      evo: { stat: 'st_int', need: 3, id: 'beam_evo', name: 'Lancia del Giudizio', desc: 'Fascio devastante che perfora e rimbalza', color: '#b061ff' },
      tiers: [
        { pellets: 1, dmg: 1.7, spread: 0.0, rate: 0.65, pierce: 3, range: 720, speed: 1000, big: 3, knock: 1.6 },
        { pellets: 1, dmg: 2.1, spread: 0.0, rate: 0.7, pierce: 5, range: 760, speed: 1050, big: 4, knock: 1.9 },
        { pellets: 1, dmg: 2.6, spread: 0.0, rate: 0.75, pierce: 8, range: 820, speed: 1100, big: 5, knock: 2.2, bounce: 1 }] },
  };
  // Livelli EVOLUTI (tier singolo, potentissimo)
  const WEAPON_EVOS = {
    scatter_evo: { pellets: 12, dmg: 0.7, spread: 0.28, knock: 3.6, rate: 1.15, range: 460, nova: true },
    burst_evo: { pellets: 4, dmg: 0.9, spread: 0.09, rate: 3.0, pierce: 3, range: 640, speed: 1050 },
    beam_evo: { pellets: 1, dmg: 3.4, spread: 0.0, rate: 0.9, pierce: 14, range: 900, speed: 1200, big: 7, knock: 2.6, bounce: 2 },
  };
  const WEAPON_ORDER = ['scatter', 'burst', 'beam'];

  const ITEMS = [
    { id: 'i_health', name: 'Pozione di Salute', icon: '❤️', color: '#ff5a7a', rarity: 'common', weight: 42, kind: 'heal', heal: 0.35, glyph: '+' },
    { id: 'i_shoes', name: 'Stivali Alati', icon: '👟', color: '#8bd6ff', rarity: 'uncommon', weight: 16, kind: 'buff', buff: 'i_speed', dur: 16, glyph: '»' },
    { id: 'i_armor', name: 'Corazza Rinforzata', icon: '🛡️', color: '#7dffea', rarity: 'uncommon', weight: 16, kind: 'buff', buff: 'i_armor', dur: 16, glyph: '▣' },
    { id: 'i_power', name: 'Nucleo Instabile', icon: '🔺', color: '#b061ff', rarity: 'rare', weight: 7, kind: 'buff', buff: 'i_power', dur: 12, glyph: '△' },
    { id: 'i_rage', name: 'Ira Berserk', icon: '💥', color: '#ff3b3b', rarity: 'epic', weight: 2.6, kind: 'buff', buff: 'i_rage', dur: 8, glyph: '‼' },
    { id: 'i_invuln', name: 'Egida Divina', icon: '✨', color: '#ffd24a', rarity: 'legendary', weight: 1.1, kind: 'buff', buff: 'i_invuln', dur: 5, glyph: '◈' },
    { id: 'i_life', name: 'Cuore Fenice', icon: '💗', color: '#ff77cc', rarity: 'legendary', weight: 0.8, kind: 'life', glyph: '♥' },
  ];

  // v1.66 — le sei statistiche "da sparatutto" (Vitalità/Potenza/Cadenza/Abilità/Agilità/Precisione) sono
  // sostituite dalle quattro classiche da gioco di ruolo. Ogni statistica ha una scuola d'elezione
  // (weapon.school in shared/heroes.js): FORZA muove il melee, INTELLIGENZA la magia, DESTREZZA il tiro.
  // Chi compra fuori scuola non spreca: le classi miste previste in progressione useranno quelle scuole.
  const XP_STATS = [
    { id: 'st_for', name: 'Forza', icon: '💪', color: '#ff8a5b', base: 10, school: 'melee',
      desc: '+9% danno in mischia, +3% rinculo' },
    { id: 'st_cos', name: 'Costituzione', icon: '❤️', color: '#ff5a7a', base: 10, school: null,
      desc: '+20 PV massimi, -1.2% danni subiti' },
    { id: 'st_int', name: 'Intelligenza', icon: '🔮', color: '#b061ff', base: 10, school: 'magic',
      desc: '+9% danno magico, +7% cadenza delle magie' },
    { id: 'st_des', name: 'Destrezza', icon: '🏹', color: '#4bd66b', base: 10, school: 'ranged',
      desc: '+8% danno dei dardi, +6% cadenza, +2.5% velocità' },
  ];
  // v1.51 — La curva era 1.55^n con livelli ILLIMITATI: con ~7.500 XP raccolti in una run intera il negozio
  // non era una scelta ma un rubinetto. Da allora il costo di ogni livello e' una TABELLA esplicita di
  // moltiplicatori su `base`, un valore per livello: la taratura procede per interventi diretti sui numeri
  // e nessuna formula unica riesce a seguirli senza distorcere il resto della curva.
  //
  // v1.66 — tetto portato da 8 a 12 e curva ricalcolata su una regola sola, chiesta esplicitamente:
  // *con l'XP di una run intera si deve poter cappare esattamente UNA statistica*. Una run vale nell'ordine
  // dei 18.000 XP (misurato su partita vera). Con base 10:
  //
  //   livello     1    2    3    4    5    6    7     8     9    10    11    12
  //   costo      60  100  160  250  380  560  820  1200  1750  2600  4000  6100   → totale 17.980
  //   salto       —  +67% +60% +56% +52% +47% +46%  +46%  +46%  +49%  +54%  +53%
  //
  // Il gradino piatto del 7° livello della vecchia tabella (+13%) e' sparito: la crescita non scende mai
  // sotto il +46%, quindi ogni livello successivo e' sempre una rinuncia sentita. Cappare UNA statistica
  // consuma la run per intero; portarne quattro al tetto costerebbe 71.920 XP, cioe' quattro run pulite.
  const STAT_MAX_LEVEL = 12;
  const STAT_COST_STEPS = [6, 10, 16, 25, 38, 56, 82, 120, 175, 260, 400, 610];
  function statCost(base, bought) {
    const k = STAT_COST_STEPS[Math.max(0, Math.min(bought, STAT_COST_STEPS.length - 1))];
    return Math.round(base * k);
  }

  // ===== BOON a scelta (stile Hades): effetti UNICI impilabili =====
  // apply(p): imposta flag/valori letti in Room.js. maxStacks per limitarli.
  // ===== v1.79 — LE ABILITA' PASSIVE, A SCAGLIONI E PER CLASSE ==================================
  // Non sono piu' carte pescate a caso a fine ondata. Sono 32 abilita' divise in quattro SCAGLIONI
  // (non comune, raro, epico, divino) e si sceglie UNA abilita' per scaglione, ai livelli 3, 6, 9 e 12.
  //
  // Ogni scaglione mostra QUATTRO abilita': le DUE della tua classe piu' le DUE neutre. Le abilita' di
  // classe le vede solo quella classe — un mago non sa nemmeno che esistono quelle del guerriero, ed e'
  // voluto: e' la rigiocabilita' a cambiare personaggio.
  //
  // NIENTE IMPILAMENTO: `max` vale 1 per tutte. Con quattro scelte in tutta la run, spendere uno
  // scaglione per raddoppiare la stessa abilita' sarebbe sempre la mossa sbagliata. Per questo i valori
  // NON sono quelli di prima: sono circa il doppio della singola copia della v1.78, alzati negli
  // scaglioni alti. I numeri interni (`+= 2`, `forza 3`) sono la stessa manopola di prima portata al
  // valore giusto, non un'abilita' presa due volte.
  //
  // La griglia completa, coi valori vecchi accanto ai nuovi, sta in PROGRESSIONE-2.md §7.
  //
  // Due correzioni di EQUITA' FRA CLASSI, non di grandezza:
  //  - i bonus ai PV neutri sono PERCENTUALI, non in cifra fissa: il guerriero ha 200 PV e il mago 100,
  //    "+30 PV" varrebbe il triplo per il mago;
  //  - il veleno si misura PER BERSAGLIO e non per colpo, se no la stessa abilita' rende il doppio in
  //    mano al ladro (3 colpi al secondo) rispetto al mago (1,5).
  const BOONS = [
    // ---- NEUTRE: le vede chiunque -----------------------------------------------------------
    { id: 'crit', name: 'Occhio di Falco', icon: '🎯', rarity: 'uncommon', hero: '*', max: 1,
      desc: '+15% critico e +0.5x danno critico',
      apply: p => { p.stats.critChance += 0.15; p.stats.critMult += 0.5; } },
    { id: 'swift', name: 'Passo Rapido', icon: '🏃', rarity: 'uncommon', hero: '*', max: 1,
      desc: '+15% velocita e -12% ricarica dello scatto',
      apply: p => { p.stats.speedMult += 0.15; p.stats.cdrMult *= 0.88; } },
    { id: 'poison', name: 'Tossina', icon: '☠️', rarity: 'rare', hero: '*', max: 1,
      desc: 'I colpi avvelenano: danno nel tempo, per bersaglio',
      apply: p => { p.boon.poison = Math.max(p.boon.poison, 2); } },
    { id: 'overheal', name: 'Scudo Vitale', icon: '💠', rarity: 'rare', hero: '*', max: 1,
      desc: '+25% PV massimi (non curano) e rigeneri 3 PV/s',
      apply: p => { p.stats.maxHpMult += 0.25; p.stats.regen += 3; } },
    { id: 'executioner', name: 'Giustiziere', icon: '🪓', rarity: 'epic', hero: '*', max: 1,
      desc: '+70% danno critico e +10% critico',
      apply: p => { p.stats.critMult += 0.70; p.stats.critChance += 0.10; } },
    { id: 'bulwark', name: 'Baluardo', icon: '🧱', rarity: 'epic', hero: '*', max: 1,
      desc: '-22% a tutti i danni subiti',
      apply: p => { p.stats.dmgReduce = Math.min(0.6, p.stats.dmgReduce + 0.22); } },
    { id: 'defiance', name: 'Ultima Occasione', icon: '⏳', rarity: 'divine', hero: '*', max: 1,
      desc: 'Due volte, invece di cadere risorgi a meta vita con 2s di invulnerabilita',
      apply: p => { p.boon.defiance += 2; p.defianceLeft = (p.defianceLeft || 0) + 2; } },
    { id: 'execute', name: 'Colpo di Grazia', icon: '🗡️', rarity: 'divine', hero: '*', max: 1,
      desc: 'I nemici sotto il 20% dei PV muoiono all istante (boss esclusi)',
      apply: p => { p.boon.execute += 2; } },

    // ---- GUERRIERO: sta in mezzo alla mischia, la ricompensa e' la folla ---------------------
    { id: 'heavyarm', name: 'Arma Pesante', icon: '🗡', rarity: 'uncommon', hero: 'guerriero', max: 1,
      desc: '+25% apertura del fendente e +18% danno',
      apply: p => { p.perk.arcoPiu = (p.perk.arcoPiu || 0) + 0.25; p.stats.dmgMult += 0.18; } },
    { id: 'thorns', name: 'Aura di Spine', icon: '🌵', rarity: 'uncommon', hero: 'guerriero', max: 1,
      desc: 'Chi ti colpisce in mischia si prende 25 danni piu il 10% di quelli che ti ha inflitto',
      apply: p => { p.boon.thorns += 25; p.boon.thornsPct += 0.10; } },
    { id: 'vampire', name: 'Vampirismo', icon: '🩸', rarity: 'rare', hero: 'guerriero', max: 1,
      desc: '+9% del danno inflitto ti cura',
      apply: p => { p.stats.lifesteal += 0.09; } },
    { id: 'retaliate', name: 'Rappresaglia', icon: '💢', rarity: 'rare', hero: 'guerriero', max: 1,
      desc: 'Quando vieni colpito emetti un onda ampia che danneggia e respinge',
      apply: p => { p.boon.retaliate += 2; } },
    { id: 'adrenaline', name: 'Adrenalina Pura', icon: '🔥', rarity: 'epic', hero: 'guerriero', max: 1,
      desc: 'Ogni uccisione da +8% cadenza per 3s, fino a +48%',
      apply: p => { p.boon.killHaste = 1; } },
    { id: 'juggernaut', name: 'Colosso', icon: '🧍', rarity: 'epic', hero: 'guerriero', max: 1,
      desc: '+35% PV massimi (non curano) e +8% velocita',
      apply: p => { p.stats.maxHpMult += 0.35; p.stats.speedMult += 0.08; } },
    { id: 'corpseblast', name: 'Deflagrazione Cadaverica', icon: '☄️', rarity: 'divine', hero: 'guerriero', max: 1,
      desc: 'I nemici uccisi esplodono, ampiamente e a danno pieno',
      apply: p => { p.boon.corpseBlast += 3; } },
    { id: 'nova', name: 'Onda di Ritorno', icon: '🌀', rarity: 'divine', hero: 'guerriero', max: 1,
      desc: 'Meta delle uccisioni emette una nova di proiettili',
      apply: p => { p.boon.killNova += 2; } },

    // ---- MAGO: pochi colpi, ognuno deve fare rumore ------------------------------------------
    { id: 'giant', name: 'Bolla Densa', icon: '⭕', rarity: 'uncommon', hero: 'mago', max: 1,
      desc: 'Bolla molto piu grossa (+35%) e +18% danno',
      apply: p => { p.boon.bulletSize += 3; p.stats.dmgMult += 0.18; } },
    { id: 'freeze', name: 'Tocco Gelido', icon: '❄️', rarity: 'uncommon', hero: 'mago', max: 1,
      desc: 'I colpi rallentano i nemici del 50% per 1,5s',
      apply: p => { p.boon.slow += 1; } },
    { id: 'chain', name: 'Catena di Fulmini', icon: '⛓️', rarity: 'rare', hero: 'mago', max: 1,
      desc: 'Il colpo rimbalza su 2 nemici vicini, al 25% del danno',
      apply: p => { p.boon.chain += 2; } },
    { id: 'ricochet', name: 'Rimbalzo', icon: '↩️', rarity: 'rare', hero: 'mago', max: 1,
      desc: 'Le bolle rimbalzano 2 volte in piu sui muri, senza perdere danno',
      apply: p => { p.boon.bounce += 2; } },
    { id: 'explode', name: 'Colpi Esplosivi', icon: '💣', rarity: 'epic', hero: 'mago', max: 1,
      desc: 'Ogni 3° colpo esplode ad area',
      apply: p => { p.boon.explodeEvery = 3; } },
    { id: 'artillery', name: 'Doppia Bolla', icon: '🚩', rarity: 'epic', hero: 'mago', max: 1,
      desc: '+1 bolla per colpo e +15% danno',
      apply: p => { p.stats.extraProjectiles += 1; p.stats.dmgMult += 0.15; } },
    { id: 'echo', name: 'Eco Arcana', icon: '🔊', rarity: 'divine', hero: 'mago', max: 1,
      desc: 'Il 40% dei colpi viene sparato una seconda volta, gratis',
      apply: p => { p.boon.echo += 2; } },
    { id: 'implode', name: 'Implosione', icon: '🌌', rarity: 'divine', hero: 'mago', max: 1,
      desc: 'Ogni 5° bolla implode: risucchia i nemici vicini e li blocca per 0,8s',
      apply: p => { p.boon.implodeEvery = 5; } },

    // ---- LADRO: distanza, cadenza, e nessun margine d errore ---------------------------------
    { id: 'pierce', name: 'Perforazione', icon: '🏹', rarity: 'uncommon', hero: 'ladro', max: 1,
      desc: 'Le frecce perforano 2 nemici in piu',
      apply: p => { p.boon.pierce += 2; } },
    { id: 'longshot', name: 'Tiro Lungo', icon: '🔭', rarity: 'uncommon', hero: 'ladro', max: 1,
      desc: 'Piu lontano e il bersaglio, piu fai male (+44% a piena gittata)',
      apply: p => { p.boon.longshot += 2; } },
    { id: 'crowbar', name: 'Piede di Porco', icon: '⛏️', rarity: 'rare', hero: 'ladro', max: 1,
      desc: '+80% danno sui nemici ancora integri (sopra il 90% dei PV)',
      apply: p => { p.boon.crowbar += 2; } },
    { id: 'killstep', name: 'Passo di Danza', icon: '💃', rarity: 'rare', hero: 'ladro', max: 1,
      desc: 'Ogni uccisione da +20% velocita per 3s, fino a +40%',
      apply: p => { p.boon.killStep += 1; } },
    { id: 'multishot', name: 'Sdoppiamento', icon: '🔱', rarity: 'epic', hero: 'ladro', max: 1,
      desc: '+1 freccia per tiro e +10% cadenza',
      apply: p => { p.stats.extraProjectiles += 1; p.stats.fireRateMult *= 1.10; } },
    { id: 'homing', name: 'Mira Guidata', icon: '🎯', rarity: 'epic', hero: 'ladro', max: 1,
      desc: 'Le frecce curvano decisamente verso i nemici vicini',
      apply: p => { p.boon.homing += 2; } },
    { id: 'berserk', name: 'Furia Cieca', icon: '😈', rarity: 'divine', hero: 'ladro', max: 1,
      desc: '+45% danno, ma incassi il 15% in piu',
      apply: p => { p.stats.dmgMult += 0.45; p.stats.dmgReduce = Math.max(-0.5, p.stats.dmgReduce - 0.15); } },
    { id: 'aegis', name: 'Egida Ostinata', icon: '🧿', rarity: 'divine', hero: 'ladro', max: 1,
      desc: 'Assorbe completamente un colpo ogni 5s',
      apply: p => { p.boon.aegis += 2; } },
  ];
  // v1.79 — TRE RITIRATE: Avidita, Fortuna Sfacciata e Fame Vorace davano bonus all XP raccolta. Col
  // tetto ai livelli sono spazzatura per costruzione — al livello 12, dove si sceglie lo scaglione
  // divino, varrebbero esattamente zero. Se un giorno servissero, il posto giusto e un bonus alle
  // MONETE gestito dal Banditore, fuori dagli scaglioni.
  const BOON_BY_ID = {}; for (const b of BOONS) BOON_BY_ID[b.id] = b;

  // ===== SINERGIE tra Boon (v1.7): possedere entrambi sblocca un effetto potenziato =====
  const SYNERGIES = [
    { id: 'toxic_burst', name: 'Deflagrazione Tossica', icon: '🧪', need: ['poison', 'explode'], desc: 'Le esplosioni diffondono veleno', apply: p => p.boon.toxicBurst = 1 },
    { id: 'frost_chain', name: 'Catena Gelida', icon: '🧊', need: ['chain', 'freeze'], desc: 'Le catene di fulmini rallentano i nemici', apply: p => p.boon.frostChain = 1 },
    { id: 'seeker', name: 'Cercatore', icon: '🔮', need: ['homing', 'pierce'], desc: 'I proiettili guidati perforano +1 nemico', apply: p => p.boon.pierce += 1 },
    { id: 'bloodlust', name: 'Sete di Sangue', icon: '🩸', need: ['vampire', 'adrenaline'], desc: '+6% cura dal danno inflitto', apply: p => p.stats.lifesteal += 0.06 },
    // v1.51 — legano i poteri nuovi a quelli storici
    { id: 'headhunter', name: 'Cacciatore di Teste', icon: '🎯', need: ['execute', 'crowbar'], desc: 'La soglia del Colpo di Grazia sale di 6 punti', apply: p => p.boon.executeBonus = 0.06 },
    { id: 'shockwave', name: 'Onda d\'Urto', icon: '🌊', need: ['retaliate', 'thorns'], desc: 'L\'onda di Rappresaglia e\' molto piu\' ampia', apply: p => p.boon.retaliateWide = 1 },
  ];
  // Ritorna le sinergie appena attivate (need tutti posseduti) non ancora presenti in activeIds.
  function detectSynergies(ownedCounts, activeIds) {
    const out = [];
    for (const sy of SYNERGIES) { if (activeIds[sy.id]) continue; if (sy.need.every(id => (ownedCounts[id] || 0) > 0)) out.push(sy); }
    return out;
  }
  const SYNERGY_BY_ID = {}; for (const sy of SYNERGIES) SYNERGY_BY_ID[sy.id] = sy;

  const BOON_CHOICES = 4;  // v1.79 — quattro abilita' in vista: due della tua classe, due neutre
  function pickWeighted(list, rng) { let tot = 0; for (const it of list) tot += (it.weight || 0); let r = (rng ? rng() : Math.random()) * tot; for (const it of list) { r -= (it.weight || 0); if (r <= 0) return it; } return list[list.length - 1]; }
  // v1.79 — LE OFFERTE NON SI SORTEGGIANO PIU'. Lo scaglione decide cosa vedi: le DUE abilita' della tua
  // classe di quello scaglione, piu' le DUE neutre. Sempre quelle, sempre tutte e quattro. Nascondere una
  // delle quattro non aggiungerebbe varieta' — con una sola scelta per scaglione aggiungerebbe solo
  // frustrazione; la varieta' sta nel cambiare classe e nella specializzazione del 15.
  // L'ordine e' voluto: prima le tue, poi le neutre.
  function offerteScaglione(heroId, tier, ownedCounts) {
    const gia = ownedCounts || {};
    const libera = b => !(gia[b.id] > 0);
    const mie = BOONS.filter(b => b.rarity === tier && b.hero === heroId && libera(b));
    const neutre = BOONS.filter(b => b.rarity === tier && b.hero === '*' && libera(b));
    return mie.concat(neutre);
  }
  // Tutte le abilita' che una classe puo' incontrare in una run: le sue piu' le neutre. Serve al pannello
  // delle abilita' e ai test — un mago non deve mai vedere quelle del guerriero.
  function boonsPerClasse(heroId) { return BOONS.filter(b => b.hero === heroId || b.hero === '*'); }

  // ===== EQUIPAGGIAMENTO a slot (v1.8): acquistabile con MONETE. 5 slot x 5 tier. =====
  // Ogni tier aggiunge `per` alle statistiche del giocatore (delta additivo, campi gia esistenti in p.stats).
  // v1.67 — l'EMPORIO generico (tre slot da salire a livelli: GEAR, GEAR_BY_SLOT, gearCost, GEAR_RANK,
  // GEAR_RARITY) e' stato rimosso: al suo posto c'e' il catalogo di oggetti per classe in shared/gear.js,
  // dove ogni pezzo ha un nome, un prezzo e statistiche proprie. Qui restava solo una scala di numeri.

  // ===== MONETE (v1.8): converte un valore in "monete" di vario taglio per il drop a terra. =====
  function coinsFor(value, denoms) {
    const out = []; let v = Math.max(0, Math.round(value));
    const sorted = denoms.slice().sort((a, b) => b.v - a.v);
    for (const d of sorted) { while (v >= d.v && out.length < 12) { out.push(d); v -= d.v; } }
    if (!out.length && value > 0) out.push(sorted[sorted.length - 1]);
    return out;
  }

  return { CRATE_BUFFS, WEAPONS, WEAPON_EVOS, WEAPON_ORDER, ITEMS, XP_STATS, statCost, STAT_MAX_LEVEL, STAT_COST_STEPS, BOON_CHOICES, BOONS, BOON_BY_ID, offerteScaglione, boonsPerClasse, pickWeighted, SYNERGIES, SYNERGY_BY_ID, detectSynergies, coinsFor };
});
