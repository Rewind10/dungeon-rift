/* waves.js — direttore ondate / difficoltà / MODALITÀ (server) */
(function (root, factory) {
  const m = factory(
    (typeof module !== 'undefined' && module.exports) ? require('./monsters.js') : root.GAME.Monsters,
    (typeof module !== 'undefined' && module.exports) ? require('./mathutils.js') : root.GAME.Math
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Waves = m; }
})(typeof self !== 'undefined' ? self : this, function (Mon, MU) {
  'use strict';
  const MONSTERS = Mon.MONSTERS, BOSSES = Mon.BOSSES;
  const BOSS_EVERY = 5, FINAL_WAVE = 20;

  // Modalità ondata (le ondate boss restano a parte)
  const MODES = {
    horde:    { id: 'horde', name: 'ORDA', color: '#ff9a3b', desc: 'Sciami di nemici deboli', countMul: 1.5, eliteMul: 0.4, survive: 0 },
    hunt:     { id: 'hunt', name: 'CACCIA', color: '#b061ff', desc: 'Pochi nemici d\'élite', countMul: 0.55, eliteMul: 3.2, survive: 0 },
    survival: { id: 'survival', name: 'SOPRAVVIVENZA', color: '#7dffea', desc: 'Resisti all\'assalto continuo', countMul: 1.0, eliteMul: 1.0, survive: 30 },
    treasure: { id: 'treasure', name: 'TESORO', color: '#ffd24a', desc: 'Uccidi lo scrigno prima che fugga!', countMul: 0.8, eliteMul: 0.6, survive: 0, treasure: true },
    assault:  { id: 'assault', name: 'ASSALTO', color: '#ff5252', desc: 'Ondata standard', countMul: 1.0, eliteMul: 1.0, survive: 0 },
  };
  function modeForWave(wave, rng) {
    if (isBossWave(wave)) return MODES.assault;
    if (wave <= 1) return MODES.assault;
    const r = (rng ? rng() : Math.random());
    if (wave % 4 === 0) return MODES.hunt;
    if (wave % 4 === 2) return MODES.survival;
    if (r < 0.20) return MODES.treasure;
    if (r < 0.55) return MODES.horde;
    return MODES.assault;
  }

  // v1.50 — CURVA DI INTRODUZIONE ripristinata. Un archetipo nuovo ogni 1-2 ondate, secondo i tre pilastri
  // del roster (sciame -> blob -> caster -> tank -> debuffer). Le comparse "dal primo stage" introdotte in
  // v1.44 (slime, cave_brute) e v1.49 (occhio) erano TEMPORANEE, servivano a valutare i nuovi sprite: erano
  // rimaste nel codice appiattendo la rampa di difficolta'.
  function poolForWave(w) {
    const p = []; const add = (id, x) => { if (MONSTERS[id]) p.push({ id, weight: x }); };
    add('skeleton', 40);                // sciame mischia — sempre presente
    if (w >= 2) add('slime', 16);       // blob acido, minaccia ravvicinata
    if (w >= 3) add('darkmage', 12);    // caster / evocatore
    if (w >= 4) add('cave_brute', 8);   // tank con slam ad area
    if (w >= 6) add('occhio', 9);       // debuffer tier 3, dopo il primo boss
    return p;
  }

  function scaling(w, players) { const p = Math.max(1, players); return { hp: 1 + w * 0.15 + (p - 1) * 0.14, dmg: 1 + w * 0.055, speed: 1 + Math.min(0.30, w * 0.015), count: Math.round((5 + w * 1.8) * (0.78 + p * 0.22)), eliteChance: Math.min(0.26, 0.03 + w * 0.019) }; }
  function isBossWave(w) { return w > 0 && w % BOSS_EVERY === 0; }
  function bossForWave(w, players) {
    let def;
    if (w >= FINAL_WAVE) def = BOSSES.mega_dragon;
    else if (w === 15) def = BOSSES.lich_king;
    else if (w === 10) def = BOSSES.orc_warlord;
    else def = MU.chance(0.5) ? BOSSES.orc_warlord : BOSSES.lich_king;
    const p = Math.max(1, players);
    return { def, hpMul: 1 + (w - BOSS_EVERY) * 0.10 + (p - 1) * 0.5, dmgMul: 1 + w * 0.03 };
  }
  function buildWave(w, players, mode) {
    const s = scaling(w, players); const pool = poolForWave(w);
    const count = Math.max(3, Math.round(s.count * (mode ? mode.countMul : 1)));
    const eliteChance = Math.min(0.6, s.eliteChance * (mode ? mode.eliteMul : 1));
    const list = [];
    for (let i = 0; i < count; i++) { const pick = MU.weighted(pool); const elite = MU.chance(eliteChance) && !MONSTERS[pick.id].boss; list.push({ type: pick.id, elite }); }
    return { list, scaling: s, mode };
  }
  // v1.50 — moltiplicatore PV degli elite reso PER-NEMICO (def.eliteHp, default ELITE_HP). Il 2.4x fisso
  // era tarato sui nemici da ~80-100 PV: applicato ai tank produceva mostri fuori scala nelle prime ondate
  // (Troll elite ~845 PV all'ondata 4, contro l'arma iniziale).
  const ELITE_HP = 2.4;
  function applyScaling(mon, s, elite) {
    const eh = (mon.def.eliteHp != null) ? mon.def.eliteHp : ELITE_HP;
    mon.maxHp = Math.round(mon.def.hp * s.hp * (elite ? eh : 1)); mon.hp = mon.maxHp;
    mon.dmg = Math.round(mon.def.dmg * s.dmg * (elite ? 1.5 : 1));
    mon.radius = mon.def.radius * (elite ? 1.28 : 1);
    const sizeFactor = MU.clamp(16 / mon.radius, 0.6, 1.45);
    mon.speed = mon.def.speed * s.speed * (elite ? 1.12 : 1) * sizeFactor;
    mon.xp = Math.round(mon.def.xp * (elite ? 2.5 : 1)); mon.elite = !!elite;
    if (elite && MU.chance(0.5)) mon.def = Object.assign({}, mon.def, { regen: (mon.def.regen || 0) + 8 });
  }
  return { BOSS_EVERY, FINAL_WAVE, MODES, modeForWave, poolForWave, scaling, isBossWave, bossForWave, buildWave, applyScaling };
});
