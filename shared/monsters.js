/* monsters.js — v1.42 roster PUPPET: Zombie Putrido + Negromante + Bruto delle Caverne (tank/slam) + Zombie Minore (summon) + mimic-cassa + boss (UMD).
   Il Negromante evoca Zombi Minori (max minionCap) e spara sfere debilitanti (curse) nel suo CAMPO VISIVO. Il Bruto attacca con SLAM ad area. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Monsters = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const MONSTERS = {
    // v1.37 — Zombie Putrido: nemico d'ondata base, reso col RENDER PUPPET (raster ibrido).
    // Sprite scomposto in 6 pezzi + overlay vettoriale (occhi/aura + ombra a terra). Stesso id 'skeleton' (compat boss/summon).
    skeleton: { id: 'skeleton', name: 'Zombie Putrido', tier: 1, hp: 78, speed: 100, radius: 18, dmg: 14, atkRange: 44, atkCd: 1.1, ai: 'swarm', atk: 'melee', xp: 8, weight: 22, color: '#3a3d3a', color2: '#181a18', eye: '#8bff86', shape: 'ghoul', front: true, puppet: true },
    // v1.39 — Zombie Minore: versione piccola/debole, NON compare nelle ondate (weight 0). Lo evoca il Negromante.
    // Riusa il puppet 'ghoul' a raggio ridotto → sembra uno zombi in miniatura, a costo zero di asset.
    zombie_mini: { id: 'zombie_mini', name: 'Zombie Minore', tier: 0, hp: 26, speed: 120, radius: 12, dmg: 8, atkRange: 34, atkCd: 1.0, ai: 'swarm', atk: 'melee', xp: 3, weight: 0, color: '#3a3d3a', color2: '#181a18', eye: '#8bff86', shape: 'ghoul', front: true, puppet: true, minion: true },
    // v1.39 — Negromante: nemico da distanza reso col RENDER PUPPET (mago incappucciato, bastone con orbe).
    //  • Evoca ZOMBI MINORI fino a un massimo (minionCap 4).
    //  • Spara SFERE DEBILITANTI (curse) SOLO quando il bersaglio entra nel suo CAMPO VISIVO (cono fov, LOS libera, in gittata).
    darkmage: { id: 'darkmage', name: 'Negromante', tier: 2, hp: 96, speed: 72, radius: 18, dmg: 14, atkRange: 340, atkCd: 1.5, ai: 'necromancer', atk: 'ranged', xp: 16, weight: 12, color: '#26272c', color2: '#111114', eye: '#a06bff', shape: 'mage', front: true, puppet: true, projSpeed: 325, projColor: '#a06bff', curse: true, summon: 'zombie_mini', summonCd: 6, summonCount: 2, minionCap: 4, sightRange: 360, fov: 0.55, turn: 1.7 }, // v1.41 — velocità sfere +30% (250→325) // v1.40 — cono più stretto/focalizzato (63°) e testa più lenta/deliberata (~97°/s): guardingo ma aggirabile
    // v1.42 — Bruto delle Caverne: TANK da mischia reso col RENDER PUPPET (6 pezzi: testa, torso, 2 braccia enormi, 2 gambe).
    // Lento e telegrafato ma devastante: attacca con uno SLAM ad AREA (onda d'urto + respinta). Accento AMBRA.
    // v1.47 — Troll delle Caverne: reso con SPRITE SHEET animato (idle/walk/attack, griglia 5x5 @256px, disegnati
    // a mano dall'artista → camminata naturale, niente rig). Mirror L/R per direzione. L'attacco (martellata) è
    // pilotato dall'evento slam (mAtk): la fase 0..1 mappa i 25 frame; il danno scatta all'impatto (slamHit).
    cave_brute: { id: 'cave_brute', name: 'Troll delle Caverne', tier: 2, hp: 220, speed: 60, radius: 26, dmg: 28, atkRange: 72, atkCd: 2.1, ai: 'brute', atk: 'melee', xp: 26, weight: 6, color: '#3b3d39', color2: '#171815', eye: '#ffb14a', shape: 'brute', sheet: 'troll', slamRadius: 108, slamWind: 0.78, slamHit: 0.72, slamKnock: 4.2, sightRange: 400, memory: 4, eliteHp: 1.5 },
    // v1.44 — Melma Corrosiva: blob acido reso col RENDER PUPPET (1 pezzo) animato in SQUASH & STRETCH.
    // Lento, coriaceo; overlay: nucleo verde pulsante + occhi che avvampano + AURA VERDE (def.aura) + bolle acide.
    // v1.45 — la Melma STRISCIA lenta; quando è VICINA SALTA e SPUTA bolle d'acido ad ALTO danno (attacco ravvicinato).
    // v1.46 — Melma Corrosiva in vista TOP-DOWN (pozza fluo che striscia): render dedicato _slimePuddle (niente billboard).
    slime: { id: 'slime', name: 'Melma Corrosiva', tier: 1, hp: 90, speed: 52, radius: 22, dmg: 12, atkRange: 150, atkCd: 1.7, ai: 'blob', atk: 'ranged', xp: 9, weight: 12, color: '#2f3a1c', color2: '#141a0c', eye: '#a6ff3a', shape: 'slime', topdown: true, puppet: true, bubbles: true, sightRange: 560, projSpeed: 205, projColor: '#a6ff3a', acidMult: 1.8, acidCount: 3 },
    // v1.49 — BEHOLDER (id 'occhio'): reintrodotto. Bulbo oculare fluttuante con eye-stalks e tentacoli
    // tutt'intorno (render _eyeF). NON spara: il suo attacco e' lo SGUARDO (debuff nel campo visivo, gazer).
    // Le EYESTALKS RUOTANO -> alterna ciclicamente i 3 tipi di sguardo (weaken/slow/sunder); fascio ricolorato.
    occhio: { id: 'occhio', name: 'Beholder', tier: 3, hp: 130, speed: 92, radius: 22, dmg: 16, atkRange: 340, atkCd: 1.0, ai: 'gazer', atk: 'gaze', xp: 24, weight: 9, color: '#7a2f6a', color2: '#2a1022', eye: '#ff5ad0', shape: 'beholder', puppet: true, beholder: true, aura: 2.4, gazeFov: 0.6, gazeRange: 340, strafeDist: 240, gazeCycle: 4, eliteHp: 1.9 },  // v1.49 — reso col RENDER PUPPET raster (illustrazione ritagliata) + iris che segue
    // v1.30 — Mimic MANTENUTO solo come CASSA: non entra nel pool delle ondate (weight 0),
    // compare esclusivamente dalle casse-mima e dalla modalità TESORO. Sprite top-down a forziere.
    mimic: { id: 'mimic', name: 'Bestia Mimica', tier: 2, hp: 150, speed: 150, radius: 19, dmg: 26, atkRange: 40, atkCd: 1.0, ai: 'ambush', atk: 'melee', xp: 14, weight: 0, color: '#8a5a2b', color2: '#4a2f16', eye: '#ff3b3b', shape: 'mimic', chestOnly: true },
  };
  const BOSSES = {
    orc_warlord: { id: 'orc_warlord', name: 'Signore della Guerra Orchesco', tier: 4, boss: true, hp: 1600, speed: 140, radius: 32, dmg: 34, atkRange: 60, atkCd: 1.0, ai: 'boss_warlord', atk: 'melee', xp: 150, weight: 0, color: '#2f5d2f', color2: '#16301a', eye: '#ff5252', shape: 'brute', enrageAtHp: 0.5, enrageSpeed: 1.7, enrageDmg: 1.5, slamRadius: 90, summon: 'skeleton', summonCd: 7, summonCount: 4 },
    lich_king: { id: 'lich_king', name: 'Re Lich', tier: 4, boss: true, hp: 2200, speed: 116, radius: 30, dmg: 26, atkRange: 420, atkCd: 1.1, ai: 'boss_lich', atk: 'ranged', xp: 200, weight: 0, color: '#2f4a6a', color2: '#12233a', eye: '#7dffea', shape: 'lich', projSpeed: 280, projColor: '#7dffea', summon: 'skeleton', summonCd: 5, summonCount: 5, shieldCd: 7, shieldTime: 3.5 },
    mega_dragon: { id: 'mega_dragon', name: 'AZ\'GAROTH, il Divoratore di Mondi', tier: 6, boss: true, mega: true, hp: 9000, speed: 104, radius: 52, dmg: 52, atkRange: 520, atkCd: 0.9, ai: 'boss_dragon', atk: 'special', xp: 800, weight: 0, color: '#5a0d2a', color2: '#2a0512', eye: '#ff2d55', shape: 'dragon', projSpeed: 340, projColor: '#ff2d55', enrageAtHp: 0.4 },
  };
  const ORDER = ['skeleton', 'darkmage', 'cave_brute', 'slime', 'occhio'];
  return { MONSTERS, BOSSES, ORDER };
});
