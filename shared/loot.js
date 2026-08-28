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
  const BOONS = [
    { id: 'ricochet', name: 'Rimbalzo', icon: '↩️', rarity: 'uncommon', max: 3, desc: 'I proiettili rimbalzano +1 volta sui muri', apply: p => p.boon.bounce += 1 },
    { id: 'pierce', name: 'Perforazione', icon: '🏹', rarity: 'uncommon', max: 3, desc: 'I proiettili perforano +1 nemico', apply: p => p.boon.pierce += 1 },
    { id: 'chain', name: 'Catena di Fulmini', icon: '⛓️', rarity: 'rare', max: 3, desc: 'I colpi rimbalzano su un nemico vicino (danno {v})', v: p => Math.round(6 + 4 * (p.boon.chain || 0)), apply: p => p.boon.chain = (p.boon.chain || 0) + 1 },
    { id: 'poison', name: 'Tossina', icon: '☠️', rarity: 'rare', max: 3, desc: 'I colpi avvelenano: danno nel tempo cumulativo', apply: p => p.boon.poison += 1 },
    { id: 'explode', name: 'Colpi Esplosivi', icon: '💣', rarity: 'epic', max: 2, desc: 'Ogni 5° colpo esplode ad area', apply: p => p.boon.explodeEvery = 5 },
    { id: 'nova', name: 'Onda di Ritorno', icon: '🌀', rarity: 'epic', max: 2, desc: 'Le uccisioni hanno il 25% di emettere una nova', apply: p => p.boon.killNova += 1 },
    { id: 'vampire', name: 'Vampirismo', icon: '🩸', rarity: 'rare', max: 3, desc: '+4% del danno inflitto ti cura', apply: p => p.stats.lifesteal += 0.04 },
    { id: 'multishot', name: 'Sdoppiamento', icon: '🔱', rarity: 'epic', max: 2, desc: '+1 proiettile per colpo', apply: p => p.stats.extraProjectiles += 1 },
    { id: 'crit', name: 'Occhio di Falco', icon: '🎯', rarity: 'uncommon', max: 3, desc: '+8% critico e +0.4x danno critico', apply: p => { p.stats.critChance += 0.08; p.stats.critMult += 0.4; } },
    { id: 'giant', name: 'Proiettili Giganti', icon: '⭕', rarity: 'uncommon', max: 2, desc: 'Proiettili più grossi (+colpiscono di più) e +15% danno', apply: p => { p.boon.bulletSize += 2; p.stats.dmgMult += 0.15; } },
    { id: 'freeze', name: 'Tocco Gelido', icon: '❄️', rarity: 'rare', max: 2, desc: 'I colpi rallentano brevemente i nemici', apply: p => p.boon.slow += 1 },
    { id: 'thorns', name: 'Aura di Spine', icon: '🌵', rarity: 'uncommon', max: 3, desc: 'Riflette danni a chi ti colpisce in mischia', apply: p => p.boon.thorns += 12 },
    { id: 'adrenaline', name: 'Adrenalina Pura', icon: '🔥', rarity: 'epic', max: 1, desc: 'Le uccisioni danno +cadenza per 3s (accumula)', apply: p => p.boon.killHaste = 1 },
    { id: 'overheal', name: 'Scudo Vitale', icon: '💠', rarity: 'rare', max: 2, desc: '+30 PV massimi e rigeneri 2 PV/s', apply: p => { p.stats.maxHpFlat += 30; p.hp += 30; p.stats.regen += 2; } },
    // ===== NOVITA v1.6 =====
    { id: 'homing', name: 'Mira Guidata', icon: '🎯', rarity: 'epic', max: 2, desc: 'I proiettili curvano verso i nemici vicini', apply: p => p.boon.homing += 1 },
    { id: 'greed', name: 'Avidita', icon: '🪙', rarity: 'uncommon', max: 3, desc: '+30% XP raccolta (potenzia le combo)', apply: p => p.stats.xpMult += 0.30 },
    { id: 'bulwark', name: 'Baluardo', icon: '🧱', rarity: 'rare', max: 3, desc: '-12% a tutti i danni subiti', apply: p => p.stats.dmgReduce = Math.min(0.6, p.stats.dmgReduce + 0.12) },
    // ===== NOVITA v1.10 =====
    { id: 'berserk', name: 'Furia Cieca', icon: '😈', rarity: 'epic', max: 2, desc: '+22% danno ma +8% danni subiti', apply: p => { p.stats.dmgMult += 0.22; p.stats.dmgReduce = Math.max(-0.5, p.stats.dmgReduce - 0.08); } },
    { id: 'swift', name: 'Passo Rapido', icon: '🏃', rarity: 'uncommon', max: 3, desc: '+8% velocita e -6% ricarica scatto', apply: p => { p.stats.speedMult += 0.08; p.stats.cdrMult *= 0.94; } },
    { id: 'lucky', name: 'Fortuna Sfacciata', icon: '🍀', rarity: 'rare', max: 2, desc: '+10% critico e +20% XP raccolta', apply: p => { p.stats.critChance += 0.10; p.stats.xpMult += 0.20; } },
    { id: 'juggernaut', name: 'Colosso', icon: '🧍', rarity: 'epic', max: 2, desc: '+45 PV massimi e +6% velocita', apply: p => { p.stats.maxHpFlat += 45; p.hp += 45; p.stats.speedMult += 0.06; } },
    { id: 'executioner', name: 'Giustiziere', icon: '🪓', rarity: 'epic', max: 2, desc: '+35% danno critico e +5% critico', apply: p => { p.stats.critMult += 0.35; p.stats.critChance += 0.05; } },
    { id: 'artillery', name: 'Bombardiere', icon: '🚩', rarity: 'rare', max: 2, desc: '+1 proiettile e +10% danno', apply: p => { p.stats.extraProjectiles += 1; p.stats.dmgMult += 0.10; } },
    // ===== NOVITA v1.51 — dieci poteri nuovi, ispirati ad altri roguelike =====
    { id: 'crowbar', name: 'Piede di Porco', icon: '⛏️', rarity: 'uncommon', max: 3, desc: '+40% danno sui nemici ancora integri (sopra il 90% dei PV)', apply: p => p.boon.crowbar += 1 },
    { id: 'longshot', name: 'Tiro Lungo', icon: '🔭', rarity: 'uncommon', max: 3, desc: 'Piu\' lontano e\' il bersaglio, piu\' fai male (+22% a piena gittata)', apply: p => p.boon.longshot += 1 },
    { id: 'killstep', name: 'Passo di Danza', icon: '💃', rarity: 'uncommon', max: 3, desc: 'Ogni uccisione ti da\' +25% velocita\' per 2s', apply: p => p.boon.killStep += 1 },
    { id: 'gluttony', name: 'Fame Vorace', icon: '🧲', rarity: 'uncommon', max: 3, desc: 'Raggio di raccolta molto piu\' ampio e +15% XP', apply: p => { p.boon.magnet += 1; p.stats.xpMult += 0.15; } },
    { id: 'retaliate', name: 'Rappresaglia', icon: '💢', rarity: 'rare', max: 3, desc: 'Quando vieni colpito emetti un\'onda che danneggia e respinge', apply: p => p.boon.retaliate += 1 },
    { id: 'aegis', name: 'Egida Ostinata', icon: '🧿', rarity: 'rare', max: 2, desc: 'Assorbe completamente un colpo ogni 8s (6s con 2 cariche)', apply: p => p.boon.aegis += 1 },
    { id: 'corpseblast', name: 'Deflagrazione Cadaverica', icon: '☄️', rarity: 'rare', max: 3, desc: 'I nemici uccisi esplodono e danneggiano chi e\' vicino', apply: p => p.boon.corpseBlast += 1 },
    { id: 'execute', name: 'Colpo di Grazia', icon: '🗡️', rarity: 'epic', max: 2, desc: 'I nemici sotto il 12% dei PV muoiono all\'istante (boss esclusi)', apply: p => p.boon.execute += 1 },
    { id: 'echo', name: 'Eco Arcana', icon: '🔊', rarity: 'epic', max: 2, desc: 'Il 20% dei colpi viene sparato una seconda volta, gratis', apply: p => p.boon.echo += 1 },
    { id: 'defiance', name: 'Ultima Occasione', icon: '⏳', rarity: 'epic', max: 2, desc: 'Invece di cadere risorgi al 50% dei PV. Una carica, si consuma', apply: p => { p.boon.defiance += 1; p.defianceLeft = (p.defianceLeft || 0) + 1; } },
  ];
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

  const BOON_CHOICES = 3;  // v1.51 — carte offerte a fine ondata
  function pickWeighted(list, rng) { let tot = 0; for (const it of list) tot += (it.weight || 0); let r = (rng ? rng() : Math.random()) * tot; for (const it of list) { r -= (it.weight || 0); if (r <= 0) return it; } return list[list.length - 1]; }
  // Offre fino a 3 boon casuali (esclude quelli al max), pesati per rarità.
  function offerBoons(rarityTable, ownedCounts) {
    const weighted = BOONS.filter(b => (ownedCounts[b.id] || 0) < b.max)
      .map(b => ({ b, weight: (rarityTable[b.rarity] || { weight: 1 }).weight }));
    const out = [];
    for (let i = 0; i < BOON_CHOICES && weighted.length; i++) {  // v1.51: si sceglie 1 di 3 (era 1 di 2 dalla v1.10)
      const w = pickWeighted(weighted);
      out.push(w.b);
      weighted.splice(weighted.indexOf(w), 1);
    }
    return out;
  }

  // ===== EQUIPAGGIAMENTO a slot (v1.8): acquistabile con MONETE. 5 slot x 5 tier. =====
  // Ogni tier aggiunge `per` alle statistiche del giocatore (delta additivo, campi gia esistenti in p.stats).
  const GEAR_RANK = ['I', 'II', 'III', 'IV', 'V'];
  const GEAR_RARITY = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const GEAR = [
    { slot: 'armor', name: 'Armatura', icon: 'assets/gear/armor.png', color: '#7dffea', max: 5, baseCost: 80, costMul: 2.15,
      per: { dmgReduce: 0.04, maxHpFlat: 15 }, desc: t => `-${t * 4}% danni subiti, +${t * 15} PV massimi` },
    { slot: 'boots', name: 'Stivali', icon: 'assets/gear/boots.png', color: '#8bd6ff', max: 5, baseCost: 70, costMul: 2.10,
      per: { speedMult: 0.05 }, desc: t => `+${t * 5}% velocita di movimento` },
    { slot: 'weapon', name: 'Arma', icon: 'assets/gear/weapon.png', color: '#ff8a5b', max: 5, baseCost: 95, costMul: 2.20,
      per: { dmgMult: 0.08, fireRateMult: 0.04 }, desc: t => `+${t * 8}% danno, +${t * 4}% cadenza` },
  ];
  const GEAR_BY_SLOT = {}; for (const g of GEAR) GEAR_BY_SLOT[g.slot] = g;
  // Costo per salire dal tier posseduto `owned` al successivo.
  function gearCost(def, owned) { return Math.round(def.baseCost * Math.pow(def.costMul, owned)); }

  // ===== MONETE (v1.8): converte un valore in "monete" di vario taglio per il drop a terra. =====
  function coinsFor(value, denoms) {
    const out = []; let v = Math.max(0, Math.round(value));
    const sorted = denoms.slice().sort((a, b) => b.v - a.v);
    for (const d of sorted) { while (v >= d.v && out.length < 12) { out.push(d); v -= d.v; } }
    if (!out.length && value > 0) out.push(sorted[sorted.length - 1]);
    return out;
  }

  return { CRATE_BUFFS, WEAPONS, WEAPON_EVOS, WEAPON_ORDER, ITEMS, XP_STATS, statCost, STAT_MAX_LEVEL, STAT_COST_STEPS, BOON_CHOICES, BOONS, BOON_BY_ID, offerBoons, pickWeighted, SYNERGIES, SYNERGY_BY_ID, detectSynergies, GEAR, GEAR_BY_SLOT, GEAR_RANK, GEAR_RARITY, gearCost, coinsFor };
});
