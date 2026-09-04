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
    slime: { id: 'slime', name: 'Melma Corrosiva', tier: 1, hp: 90, speed: 52, radius: 22, dmg: 12, atkRange: 150, atkCd: 1.7, ai: 'blob', atk: 'ranged', xp: 9, weight: 12, color: '#2f3a1c', color2: '#141a0c', eye: '#a6ff3a', shape: 'slime', topdown: true, puppet: true, bubbles: true, sightRange: 560, projSpeed: 205, projColor: '#a6ff3a', acidMult: 1.8, acidCount: 3, splitInto: 'slime_mini', splitCount: 2 },  // v1.58 — alla morte si DIVIDE in due melme minori
    // v1.49 — BEHOLDER (id 'occhio'): reintrodotto. Bulbo oculare fluttuante con eye-stalks e tentacoli
    // tutt'intorno (render _eyeF). NON spara: il suo attacco e' lo SGUARDO (debuff nel campo visivo, gazer).
    // Le EYESTALKS RUOTANO -> alterna ciclicamente i 3 tipi di sguardo (weaken/slow/sunder); fascio ricolorato.
    // ===== v1.79.2 — I TRE BEHOLDER ============================================================
    // Erano uno solo, disegnato come una marionetta di pezzi raster e senza attacchi veri. Adesso sono
    // TRE creature della stessa famiglia, dipinte a codice (`dipinto: true`), con lo stesso mestiere —
    // raggio che debilita E fa male da lontano, morso da vicino — e tre taglie di pericolo. Entrano in
    // ondate diverse, cosi' la famiglia si presenta un pezzo per volta invece che tutta insieme.
    // A — OCCHIO VIOLA: il piu' debole, il primo che si incontra.
    occhio: { id: 'occhio', name: 'Occhio Viola', tier: 3, hp: 120, speed: 92, radius: 21, dmg: 13, atkRange: 320, atkCd: 1.0, ai: 'gazer', atk: 'gaze', xp: 22, weight: 9, color: '#7a2f6a', color2: '#2a1022', eye: '#ff6fd0', shape: 'beholder', dipinto: 'viola', beholder: true, aura: 2.4, gazeFov: 0.6, gazeRange: 320, gazeDmg: 0.45, biteRange: 90, biteCd: 1.2, biteMul: 1.4, strafeDist: 240, gazeCycle: 4, eliteHp: 1.9, maxAlive: 8 },
    // B — OCCHIO DI CARNE: piu' resistente, morde piu' forte, sta piu' vicino.
    occhio_carne: { id: 'occhio_carne', name: 'Occhio di Carne', tier: 3, hp: 210, speed: 86, radius: 24, dmg: 18, atkRange: 340, atkCd: 1.0, ai: 'gazer', atk: 'gaze', xp: 34, weight: 7, color: '#6b2e26', color2: '#2b1410', eye: '#ffb08a', shape: 'beholder', dipinto: 'carne', beholder: true, aura: 2.6, gazeFov: 0.62, gazeRange: 340, gazeDmg: 0.5, biteRange: 105, biteCd: 1.1, biteMul: 1.6, strafeDist: 210, gazeCycle: 4, eliteHp: 1.8, maxAlive: 6 },
    // C — OCCHIO SPETTRALE: il piu' pericoloso. Raggio piu' lungo e piu' pesante, e attraversa i muri.
    occhio_spettro: { id: 'occhio_spettro', name: 'Occhio Spettrale', tier: 3, hp: 260, speed: 100, radius: 23, dmg: 22, atkRange: 400, atkCd: 1.0, ai: 'gazer', atk: 'gaze', xp: 46, weight: 5, color: '#12303f', color2: '#071016', eye: '#ffb347', shape: 'beholder', dipinto: 'spettro', beholder: true, phasing: true, aura: 2.8, gazeFov: 0.66, gazeRange: 400, gazeDmg: 0.6, biteRange: 95, biteCd: 1.0, biteMul: 1.7, strafeDist: 280, gazeCycle: 3.2, eliteHp: 1.7, maxAlive: 5 },
    // v1.58 — FUNGO SPORIFERO: immobile. Vive dove nasce e semina zone di spore dove ti trovi: e' il nemico
    // che punisce chi resta fermo, ruolo che al roster mancava. Zero animazione di camminata (non cammina).
    spore_fungus: { id: 'spore_fungus', name: 'Fungo Sporifero', tier: 1, hp: 110, speed: 0, radius: 20, dmg: 11, atkRange: 340, atkCd: 3.1, ai: 'sentry', atk: 'zone', xp: 12, weight: 0, color: '#2f3a24', color2: '#151c10', eye: '#c8ff6a', shape: 'fungus', front: true, fungus: true, immobile: true, sightRange: 340, spores: 2, zoneRadius: 62, zoneDelay: 1.05, zoneMult: 1.0, projColor: '#a6ff3a', eliteHp: 2.0 },
    // v1.58 — SFERA D'OSSA: niente gambe. Carica, poi rotola in linea retta rimbalzando sui muri.
    // Ti obbliga a schivare di lato, cosa che nessun altro nemico faceva.
    bone_roller: { id: 'bone_roller', name: 'Sfera d\'Ossa', tier: 2, hp: 120, speed: 96, radius: 19, dmg: 20, atkRange: 30, atkCd: 0.8, ai: 'roller', atk: 'melee', xp: 18, weight: 0, color: '#cfc7b0', color2: '#5d574a', eye: '#ff7a3b', shape: 'roller', front: true, roller: true, sightRange: 470, rollWind: 0.62, rollTime: 2.3, rollSpeed: 3.1, rollCd: 1.5, rollKnock: 3.2, eliteHp: 1.9 },
    // v1.58 — MELMA MINORE: nasce dalla divisione della Melma Corrosiva. Riusa lo stesso sprite a raggio
    // ridotto (come lo Zombie Minore col ghoul): zero asset nuovi. NON si divide a sua volta.
    slime_mini: { id: 'slime_mini', name: 'Melma Minore', tier: 0, hp: 34, speed: 66, radius: 13, dmg: 7, atkRange: 110, atkCd: 1.6, ai: 'blob', atk: 'ranged', xp: 4, weight: 0, color: '#2f3a1c', color2: '#141a0c', eye: '#a6ff3a', shape: 'slime', topdown: true, puppet: true, bubbles: true, minion: true, sightRange: 420, projSpeed: 190, projColor: '#a6ff3a', acidMult: 1.4, acidCount: 2 },
    // v1.61 — NUGOLO DI PIPISTRELLI: una sola entita' disegnata come 11 sagome che orbitano attorno al
    // centro con fasi diverse. Nessun ciclo di camminata: le ali sono due rotazioni contrapposte. Fragile
    // e velocissimo, ondeggia mentre insegue (weave): copre lo spazio come nessun altro nemico del roster.
    bat_swarm: { id: 'bat_swarm', name: 'Nugolo di Pipistrelli', tier: 1, hp: 76, speed: 175, radius: 24, dmg: 6, atkRange: 30, atkCd: 0.5, ai: 'flock', atk: 'melee', xp: 13, weight: 0, color: '#2a2136', color2: '#0f0c16', eye: '#c9a0ff', shape: 'bats', bats: true, puppet: true, aura: 1.1, swarmN: 9, sightRange: 620, memory: 4, weave: 2.7, weaveAmp: 0.62, eliteHp: 1.4 },
    // v1.61 — FUOCO FATUO: primo nemico che IGNORA I MURI (def.phasing). Non lo semini spezzando la linea
    // di vista: ti trova sempre, ma e' lento, quindi la risposta e' muoversi. Quando ti raggiunge DRENA
    // (danno + si cura di leech). Dentro la roccia accelera e non puo' drenare: non ci resta mai dentro.
    // v1.81 — LARVA FETIDA: corre addosso come uno zombi, ma non e' il colpo che da' che devi temere:
    // e' la sua morte. Quando cade si gonfia e SCOPPIA — non subito, dopo tre quarti di secondo, e sul
    // pavimento resta il cerchio che vedi accendersi. Insegna una cosa sola e la insegna bene: non stare
    // incollato al nemico che stai finendo. Chi arretra di un passo non prende niente.
    larva: { id: 'larva', name: 'Larva Fetida', tier: 2, hp: 66, speed: 104, radius: 17, dmg: 9, atkRange: 36, atkCd: 1.2, ai: 'swarm', atk: 'melee', xp: 14, weight: 0, color: '#46561a', color2: '#1b2408', eye: '#e8ff6a', shape: 'larva', larva: true, sightRange: 560, memory: 3, esplode: { r: 104, mul: 2.4, ritardo: 0.75 }, eliteHp: 1.5 },
    // v1.81 — SPETTRO: c'era nella v1.32, e' uscito nella v1.37 quando il bestiario fu ridotto a un
    // archetipo solo. Il disegno non e' mai stato buttato (_spettroF) e nemmeno la sua IA (wraith):
    // torna quello, con lo SFASAMENTO reso leggibile. Avanza rapido in mischia e ogni tanto si sfasa e
    // riemerge ALLE TUE SPALLE attraverso la roccia. Toglie la sicurezza della distanza.
    spettro: { id: 'spettro', name: 'Spettro', tier: 2, hp: 132, speed: 138, radius: 19, dmg: 15, atkRange: 46, atkCd: 0.95, ai: 'wraith', atk: 'melee', xp: 26, weight: 0, color: '#5b6fa8', color2: '#141a2c', eye: '#9fe8ff', shape: 'spettro', front: true, aura: 1.8, sightRange: 640, memory: 4.5, blinkCd: 4.6, blinkWind: 0.38, eliteHp: 1.6 },
    wisp: { id: 'wisp', name: 'Fuoco Fatuo', tier: 2, hp: 68, speed: 74, radius: 15, dmg: 9, atkRange: 96, atkCd: 0.9, ai: 'drifter', atk: 'melee', xp: 15, weight: 0, color: '#123a3a', color2: '#06181a', eye: '#7dffea', shape: 'wisp', wisp: true, puppet: true, aura: 2.6, phasing: true, leech: 0.9, bobAmp: 6, eliteHp: 1.7 },
    // v1.30 — Mimic MANTENUTO solo come CASSA: non entra nel pool delle ondate (weight 0),
    // compare esclusivamente dalle casse-mima e dalla modalità TESORO. Sprite top-down a forziere.
    mimic: { id: 'mimic', name: 'Bestia Mimica', tier: 2, hp: 150, speed: 150, radius: 19, dmg: 26, atkRange: 40, atkCd: 1.0, ai: 'ambush', atk: 'melee', xp: 14, weight: 0, color: '#8a5a2b', color2: '#4a2f16', eye: '#ff3b3b', shape: 'mimic', chestOnly: true },
  };
  const BOSSES = {
    orc_warlord: { id: 'orc_warlord', name: 'Signore della Guerra Orchesco', tier: 4, boss: true, hp: 1600, speed: 140, radius: 32, dmg: 34, atkRange: 60, atkCd: 1.0, ai: 'boss_warlord', atk: 'melee', xp: 150, weight: 0, color: '#2f5d2f', color2: '#16301a', eye: '#ff5252', shape: 'brute', enrageAtHp: 0.5, enrageSpeed: 1.7, enrageDmg: 1.5, slamRadius: 90, summon: 'skeleton', summonCd: 7, summonCount: 4 },
    lich_king: { id: 'lich_king', name: 'Re Lich', tier: 4, boss: true, hp: 2200, speed: 116, radius: 30, dmg: 26, atkRange: 420, atkCd: 1.1, ai: 'boss_lich', atk: 'ranged', xp: 200, weight: 0, color: '#2f4a6a', color2: '#12233a', eye: '#7dffea', shape: 'lich', projSpeed: 280, projColor: '#7dffea', summon: 'skeleton', summonCd: 5, summonCount: 5, shieldCd: 7, shieldTime: 3.5 },
    mega_dragon: { id: 'mega_dragon', name: 'AZ\'GAROTH, il Divoratore di Mondi', tier: 6, boss: true, mega: true, hp: 9000, speed: 104, radius: 52, dmg: 52, atkRange: 520, atkCd: 0.9, ai: 'boss_dragon', atk: 'special', xp: 800, weight: 0, color: '#5a0d2a', color2: '#2a0512', eye: '#ff2d55', shape: 'dragon', projSpeed: 340, projColor: '#ff2d55', enrageAtHp: 0.4 },
  };
  // v1.79.2 — 'cave_brute' (il Troll delle Caverne) e' fuori dal bestiario: non compare piu' in nessuna
  // ondata. La sua definizione resta qui sopra — con lo sprite-sheet, lo slam ad area e la sua IA — perche'
  // toglierla butterebbe via del lavoro che potrebbe tornare utile, ma non e' piu' raggiungibile: non e' in
  // ORDER e non e' nel pool delle ondate.
  const ORDER = ['skeleton', 'slime', 'slime_mini', 'bat_swarm', 'darkmage', 'spore_fungus', 'bone_roller', 'wisp', 'larva', 'spettro', 'occhio', 'occhio_carne', 'occhio_spettro'];
  return { MONSTERS, BOSSES, ORDER };
});
