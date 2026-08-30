/* simulate.js — test automatici headless (v1.13: ridimensionamento leggero (visivo 1.45x / collisione 1.08x), fix mercante nero sostitutivo; + storico) */
'use strict';
const { Room } = require('../server/Room.js');
const C = require('../shared/constants.js');
const MU = require('../shared/mathutils.js');
const Heroes = require('../shared/heroes.js');
const MapGen = require('../shared/mapgen.js');
const Loot = require('../shared/loot.js');
const Waves = require('../shared/waves.js');
const Pot = require('../shared/potions.js');
const Bnt = require('../shared/bounties.js');
const Gear = require('../shared/gear.js');
const fs = require('fs');
let PASS = 0, FAIL = 0;
function assert(c, m) { if (c) PASS++; else { FAIL++; console.log('  ❌ FAIL:', m); } }
function ok(m) { console.log('  ✅', m); }
function bot(room, p) {
  // v1.52 — nella mappa MERCATO non ci sono nemici: il bot punta al portale EXIT (con un po' di
  // jitter, altrimenti si incastra sui muri andando in linea retta).
  if (room.phase === C.PHASE_MARKET && room.map && room.map.exit) {
    const ex = room.map.exit.x * C.TILE + C.TILE / 2, ey = room.map.exit.y * C.TILE + C.TILE / 2;
    const a = Math.atan2(ey - p.y, ex - p.x);
    return { mx: Math.cos(a) + (Math.random() - 0.5) * 0.7, my: Math.sin(a) + (Math.random() - 0.5) * 0.7, aim: a, shoot: false, q: false, e: false, dash: false };
  }
  let n = null, bd = Infinity; for (const m of room.monsters) { const d = MU.dist2(p.x, p.y, m.x, m.y); if (d < bd) { bd = d; n = m; } } const i = { mx: 0, my: 0, aim: p.aim, shoot: false, q: false, e: false, dash: false }; if (n) { const d = Math.sqrt(bd); i.aim = Math.atan2(n.y - p.y, n.x - p.x); i.shoot = true;
    // v1.66 — un bot che indietreggia sotto i 160px e' un TIRATORE. Il guerriero colpisce a 100px: con la
    // vecchia regola non arrivava mai a contatto e "moriva disarmato", il che diceva qualcosa del bot, non
    // del personaggio. Chi ha un'arma da mischia tiene la distanza della sua arma.
    const rMax = p.hero.weapon.melee ? (p.hero.weapon.arcRadius || 100) : 320, rMin = p.hero.weapon.melee ? rMax * 0.55 : 160;
    // ...e quando e' ridotto male si sgancia, come farebbe chiunque. Senza questa riga il bot in mischia
    // muore in piedi davanti all'ondata e il dato che ne esce misura il bot, non il bilanciamento.
    const hurt = p.hp / (p.maxHp + p.stats.maxHpFlat) < 0.40;
    // MORDI E FUGGI: chi combatte in mischia non resta appoggiato al nemico fra un fendente e l'altro,
    // si stacca mentre l'arma e' in ricarica e rientra per il colpo. Senza questa riga il bot restava a
    // contatto per tutta la partita, moriva sempre per primo, e il dato diceva 'la classe e' fragile'
    // quando diceva 'il bot non sa giocarla'.
    const ricarica = p.hero.weapon.melee && p.fireCd > 0.35 / (p.hero.weapon.fireRate || 1);
    const dir = (hurt || ricarica) ? 1 : (d < rMin ? -1 : (d > rMax ? 1 : 0));
    if (hurt && p.cdDash <= 0 && Math.random() < 0.12) i.dash = true; i.mx = Math.cos(i.aim) * dir + (Math.random() - 0.5) * 0.6; i.my = Math.sin(i.aim) * dir + (Math.random() - 0.5) * 0.6; if (p.cdQ <= 0 && Math.random() < 0.05) i.q = true; if (p.cdE <= 0 && Math.random() < 0.04) i.e = true; if (p.cdDash <= 0 && d < 140 && Math.random() < 0.06) i.dash = true; } else { i.mx = Math.random() - 0.5; i.my = Math.random() - 0.5; } return i; }
// v1.62 — con la partenza variabile (prima era il centro esatto, di fatto sempre sgombro) non si puo' piu'
// dare per scontato che "giocatore + 260px sull asse x" sia pavimento libero e in vista: puo' esserci roccia.
// Diversi test della 1.45/1.58 lo davano per scontato e fallivano a intermittenza a seconda della mappa.
// Questo helper cerca un punto alla distanza voluta girando attorno al giocatore finche' ne trova uno
// SENZA MURO e con LINEA DI VISTA libera — che e' la condizione che quei test volevano davvero esprimere.
function losSpot(room, p, dist) {
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    const x = p.x + Math.cos(a) * dist, y = p.y + Math.sin(a) * dist;
    if (room.isWallAt(x, y)) continue;
    if (!room.losClear(p.x, p.y, x, y)) continue;
    return { x, y };
  }
  return { x: p.x + dist, y: p.y };
}
function hasNaN(room) { for (const p of room.players.values()) if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.hp)) return 'player'; for (const m of room.monsters) if (!isFinite(m.x) || !isFinite(m.y) || !isFinite(m.hp)) return 'mon ' + m.type; for (const b of room.bullets) if (!isFinite(b.x) || !isFinite(b.y)) return 'bullet'; return null; }

function testMapThemes() {
  console.log('\n[TEST 1] Temi mappa + connettività');
  const PF = require('../shared/pathfinding.js'); const seen = {}; let cf = 0, ef = 0;
  for (let i = 0; i < 50; i++) { const map = MapGen.generate((Math.random() * 1e9) | 0, 1 + (i % 20)); seen[map.theme.id] = 1; const dist = PF.build(map.grid, map.w, map.h, [{ gx: map.w >> 1, gy: map.h >> 1 }]); let r = 0, t = 0; for (const s of map.enemySpawns) { t++; if (dist[s.y * map.w + s.x] >= 0) r++; } if (t && r / t < 0.98) cf++; if (!map.exit) ef++; }
  assert(Object.keys(seen).length >= 3, 'più temi (' + Object.keys(seen).join(',') + ')'); assert(cf === 0, 'tutte connesse'); assert(ef === 0, 'tutte con portale'); ok('temi/connettività OK');
}
function testLives() {
  console.log('\n[TEST 2] Sistema di vite');
  const room = new Room('lives'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  assert(p.lives === C.START_LIVES, 'parte con ' + C.START_LIVES + ' vite');
  const dt = 1 / C.TICK_RATE;
  const bleedOut = () => { p.buffs = {}; p.hp = 1; room.damagePlayer(p, 999, p.x + 10, p.y, 0); for (let i = 0; i < Math.ceil(C.DOWN_BLEED_TIME * C.TICK_RATE) + 3 && !p.dead; i++) { p.buffs.iframe = 0; room.update(dt); } };
  const before = p.lives; bleedOut(); assert(p.lives === before - 1, '1ª caduta -1 vita'); assert(!p.dead && p.hp > 0, 'si rialza');
  bleedOut(); assert(p.dead, '2ª caduta → morte'); assert(room.phase === C.PHASE_GAMEOVER, 'game over'); ok('vite OK');
}
function testBoons() {
  console.log('\n[TEST 3] Boon a scelta (effetti unici)');
  const room = new Room('boon'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame(); room.phase = C.PHASE_SHOP;
  room.offerBoon(p); assert(p.boonOffer && p.boonOffer.length > 0, 'offre boon a scelta (' + (p.boonOffer || []).length + ')');
  // applica boon 'pierce' se offerto, altrimenti forza
  const pierceBefore = p.boon.pierce; room.boonOfferForce = null;
  p.boonOffer = ['pierce']; room.pickBoon('b', 'pierce'); assert(p.boon.pierce === pierceBefore + 1, 'boon Perforazione applicato'); assert(p.boonsOwned.pierce === 1, 'conteggio boon aggiornato');
  // boon chain e verifica effetto in combattimento
  p.boonOffer = ['chain']; room.pickBoon('b', 'chain'); assert(p.boon.chain === 1, 'boon Catena applicato');
  // spara e verifica che i proiettili portino i flag boon
  room.bullets.length = 0; p.fireCd = 0; room.firePlayerWeapon(p); const b = room.bullets.find(x => !x.hostile); assert(b && b.pierce >= 1 && b.chain === 1, 'i proiettili ereditano i boon');
  // boon vampire cura
  p.boonOffer = ['vampire']; const ls0 = p.stats.lifesteal; room.pickBoon('b', 'vampire'); assert(p.stats.lifesteal > ls0, 'boon Vampirismo aumenta lifesteal');
  // max stacks rispettato
  p.boonsOwned.pierce = 3; p.boonOffer = ['pierce']; const pv = p.boon.pierce; room.pickBoon('b', 'pierce'); assert(p.boon.pierce === pv, 'boon al max non applicato oltre');
  ok('boon verificati');
}
function testWeaponEvo() {
  console.log('\n[TEST 4] Evoluzione armi');
  const room = new Room('evo'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame(); room.phase = C.PHASE_SHOP; p.points = 100000;
  p.weapon2 = { type: 'scatter', level: 3, evolved: null };
  // richiede st_for >= 3
  room.buyStat('b', 'st_for'); room.buyStat('b', 'st_for'); assert(!p.weapon2.evolved, 'non evolve prima della soglia');
  room.buyStat('b', 'st_for'); assert(p.weapon2.evolved === 'scatter_evo', 'evolve al raggiungimento della statistica');
  // il fuoco usa il tier evoluto (più pallini + nova)
  room.bullets.length = 0; p.fireCd = 0; room.firePlayerWeapon(p); const n = room.bullets.filter(x => !x.hostile).length; assert(n >= 12, 'arma evoluta spara molti proiettili (' + n + ')');
  ok('evoluzione verificata');
}
function testModes() {
  console.log('\n[TEST 5] Modalità ondata');
  const ids = new Set(); const r = MU.seedRng(1);
  for (let w = 2; w <= 19; w++) if (!Waves.isBossWave(w)) ids.add(Waves.modeForWave(w, Math.random).id);
  for (let i = 0; i < 200; i++) { const w = 2 + (i % 18); if (!Waves.isBossWave(w)) ids.add(Waves.modeForWave(w).id); }
  assert(ids.has('survival'), 'esiste la modalità Sopravvivenza'); assert(ids.has('hunt'), 'esiste la modalità Caccia'); assert(ids.has('treasure') || ids.has('horde') || ids.has('assault'), 'esistono altre modalità');
  // hunt genera meno nemici ma più élite; horde più nemici
  const hunt = Waves.buildWave(8, 1, Waves.MODES.hunt); const horde = Waves.buildWave(8, 1, Waves.MODES.horde);
  assert(horde.list.length > hunt.list.length, 'Orda ha più nemici della Caccia');
  // treasure: la modalità spawn-a uno scrigno fuggitivo
  const room = new Room('tr'); room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  room.wave = 0; // forza una wave treasure
  room.wave = 1; room.mode = Waves.MODES.treasure; room.waveScaling = Waves.scaling(3, 1); room.spawnTreasure();
  assert(room.treasure && room.treasure.treasure, 'lo scrigno-tesoro viene generato'); assert(room.treasure.escapeT > 0, 'lo scrigno ha un timer di fuga');
  ok('modalità verificate');
}
function testHitstop() {
  console.log('\n[TEST 6] Hit-stop (eventi di feedback)');
  const room = new Room('hs'); const p = room.addPlayer('b', { send() {} }, 'B', 'mago'); room.startGame();
  const m = room.spawnMonster('skeleton', p.x + 30, p.y, { scaling: Waves.scaling(2, 1) });
  room.damageMonster(m, 5, p.x, p.y, 0, p, { crit: true });
  assert(room.events.some(e => e.t === 'hitstop'), 'un crit emette un evento hit-stop');
  const boss = room.spawnMonster('orc_warlord', p.x + 60, p.y, { hpMul: 0.001 }); room.events.length = 0; room.damageMonster(boss, 99999, p.x, p.y, 0, p);
  assert(room.events.some(e => e.t === 'hitstop'), 'l\'uccisione di un boss emette hit-stop'); ok('hit-stop verificato');
}
function testXpItems() {
  console.log('\n[TEST 7] XP + item + negozio');
  const room = new Room('xp'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  const m = room.spawnMonster('skeleton', p.x + 30, p.y, { scaling: Waves.scaling(3, 1) }); const before = room.groundXp.length; room.killMonster(m, p);
  assert(room.groundXp.length > before, 'uccisione lascia XP');
  const dt = 1 / C.TICK_RATE; const xp0 = p.xpPool; for (let i = 0; i < 60; i++) room.update(dt); assert(p.xpPool > xp0, 'XP raccolta');
  room.items = [{ eid: 1, x: p.x + 8, y: p.y, r: 13, id: 'i_life', t: 30 }]; const l0 = p.lives; room.updatePickups(dt); assert(p.lives === l0 + 1, 'Cuore Fenice +1 vita');
  p.points = 20; room.phase = C.PHASE_SHOP; const hp0 = room.effMaxHp(p); room.buyStat('b', 'st_cos'); assert(room.effMaxHp(p) > hp0, 'negozio: Vitalità aumenta PV'); ok('XP/item/negozio OK');
}
function testFullRun(n, label) {
  console.log(`\n[TEST 8] Partita completa — ${n} bot (${label})`);
  const room = new Room('r' + n); for (let i = 0; i < n; i++) room.addPlayer('b' + i, { send() {} }, 'B' + i, Heroes.ORDER[i % 3]); room.startGame();
  const dt = 1 / C.TICK_RATE; let ticks = 0, maxMs = 0, tot = 0, nan = null, pWall = 0, maxMon = 0;
  while (ticks < C.TICK_RATE * 240) { for (const p of room.players.values()) if (!p.dead && !p.down) room.setInput(p.id, bot(room, p)); const t0 = process.hrtime.bigint(); room.update(dt); const t1 = process.hrtime.bigint(); const ms = Number(t1 - t0) / 1e6; maxMs = Math.max(maxMs, ms); tot += ms; ticks++; maxMon = Math.max(maxMon, room.monsters.length); for (const p of room.players.values()) if (!p.dead && room.isWallAt(p.x, p.y)) pWall++; const nn = hasNaN(room); if (nn) { nan = nn; break; } if (room.phase === C.PHASE_GAMEOVER || room.phase === C.PHASE_VICTORY) break; if (room.phase === C.PHASE_SHOP) for (const p of room.players.values()) { if (p.boonOffer && p.boonOffer.length) room.pickBoon(p.id, p.boonOffer[0]); if (p.points > 0) room.buyStat(p.id, Loot.XP_STATS[MU.randInt(0, Loot.XP_STATS.length - 1)].id); if (!p.ready) room.shopReady(p.id, Math.random() < 0.25 ? 'market' : 'wave'); } }
  console.log(`  fase: ${room.phase} · ondata: ${room.wave} · ~${(ticks / C.TICK_RATE) | 0}s · perf avg ${(tot / ticks).toFixed(3)}ms max ${maxMs.toFixed(2)}ms · picco ${maxMon} mostri`);
  assert(nan === null, 'nessun NaN (' + (nan || 'ok') + ')'); assert(maxMs < (1000 / C.TICK_RATE) * 3, 'no tick catastrofico'); assert((tot / ticks) < (1000 / C.TICK_RATE), 'perf media OK'); assert(pWall === 0, 'giocatori mai nei muri'); assert(room.wave >= 1, 'run progredita');
}
function testSanity() {
  console.log('\n[TEST 9] Sanity mostri/boss + snapshot');
  const Mon = require('../shared/monsters.js'); const room = new Room('s'); for (let i = 0; i < 6; i++) room.addPlayer('b' + i, { send() {} }, 'B' + i, Heroes.ORDER[i % 3]); room.startGame();
  const all = [...Object.keys(Mon.MONSTERS), ...Object.keys(Mon.BOSSES)]; for (const id of all) { const m = room.spawnMonster(id, room.map.spawn.x + 100, room.map.spawn.y); assert(m && isFinite(m.hp) && m.hp > 0, id + ' valido'); }
  const dt = 1 / C.TICK_RATE; for (let i = 0; i < C.TICK_RATE * 20; i++) { for (const p of room.players.values()) room.setInput(p.id, bot(room, p)); room.update(dt); if (hasNaN(room)) break; }
  assert(hasNaN(room) === null, 'nessun NaN con tutti i tipi');
  const snap = room.snapshot(); const json = JSON.stringify(snap); assert(json.length < 320000, 'snapshot compatto (' + (json.length / 1024).toFixed(1) + ' KB)'); // v1.17 — soglia con margine (scenario stress: tutti i tipi + 6 player) assert(snap.mode !== undefined && Array.isArray(snap.xp), 'snapshot con mode e xp'); ok('sanity/snapshot OK');
}
function testV16() {
  console.log('\n[TEST 10] Novita v1.6 — combo, homing, avidita');
  const room = new Room('v16'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  // combo: uccisioni consecutive aumentano combo e moltiplicatore
  assert(room.comboMult(p) === 1, 'moltiplicatore combo parte da 1');
  for (let i = 0; i < 6; i++) { const m = room.spawnMonster('skeleton', p.x + 30, p.y, { scaling: Waves.scaling(2, 1) }); room.killMonster(m, p); }
  assert(p.combo === 6, 'combo conta le uccisioni consecutive (' + p.combo + ')');
  assert(room.comboMult(p) > 1, 'combo aumenta il moltiplicatore XP (x' + room.comboMult(p).toFixed(2) + ')');
  // XP scala col combo: stessa uccisione rende piu XP ad alto combo che a combo 0
  const p2 = room.addPlayer('c', { send() {} }, 'C', 'ladro');
  const xpAt = (pl) => { room.groundXp.length = 0; const m = room.spawnMonster('skeleton', pl.x + 30, pl.y, { scaling: Waves.scaling(2, 1) }); const xp0 = m.xp; room.killMonster(m, pl); let tot = 0; for (const o of room.groundXp) tot += o.v; return { tot, base: xp0 }; };
  p2.combo = 0; p2.comboT = 0; const lo = xpAt(p2);
  p.combo = 20; p.comboT = C.COMBO_TIME; const hi = xpAt(p);
  assert(hi.tot > lo.tot, 'ad alto combo la stessa uccisione rende piu XP (' + hi.tot + ' > ' + lo.tot + ')');
  // combo decade nel tempo
  p.combo = 5; p.comboT = 0.05; const dt = 1 / C.TICK_RATE; for (let i = 0; i < 4; i++) room.update(dt); assert(p.combo === 0, 'la combo decade allo scadere del timer');
  // boon homing: i proiettili portano il flag e curvano
  room.phase = C.PHASE_SHOP; p.boonOffer = ['homing']; room.pickBoon('b', 'homing'); assert(p.boon.homing === 1, 'boon Mira Guidata applicato');
  // scenario deterministico: nessun mostro residuo, mira nota (verso destra), unico bersaglio sotto il proiettile
  room.monsters.length = 0; room.bullets.length = 0; p.aim = 0; p.input.aim = 0; p.fireCd = 0; room.firePlayerWeapon(p); const hb = room.bullets.find(x => !x.hostile); assert(hb && hb.homing === 1, 'i proiettili ereditano il flag homing');
  const tm = room.spawnMonster('skeleton', hb.x + 30, hb.y + 120, { scaling: Waves.scaling(2, 1) });
  const sp0 = Math.hypot(hb.vx, hb.vy) || 720; hb.vx = sp0; hb.vy = 0; // v1.17 — elimina lo spread dell'arma: test deterministico
  const a0 = Math.atan2(hb.vy, hb.vx); for (let i = 0; i < 3; i++) room.updateBullets(dt); const a1 = room.bullets[0] ? Math.atan2(room.bullets[0].vy, room.bullets[0].vx) : a0; assert(Math.abs(a1 - a0) > 0.001, 'il proiettile homing curva verso il bersaglio');
  // boon avidita: aumenta xpMult
  const g0 = p.stats.xpMult; p.boonOffer = ['greed']; room.pickBoon('b', 'greed'); assert(p.stats.xpMult > g0, 'boon Avidita aumenta la raccolta XP');
  // boon baluardo: riduce i danni
  const p3 = room.addPlayer('d', { send() {} }, 'D', 'ladro'); p3.boonOffer = ['bulwark']; room.pickBoon('d', 'bulwark'); assert(p3.stats.dmgReduce > 0, 'boon Baluardo riduce i danni');
  p3.buffs = {}; p3.hp = 1000; p3.maxHp = 1000; const h0 = p3.hp; room.damagePlayer(p3, 100, p3.x + 10, p3.y, 0); const dealt = h0 - p3.hp; assert(dealt < 100, 'Baluardo attenua i danni subiti (' + dealt + ' < 100)');
  // snapshot espone i campi combo
  p.combo = 8; p.comboT = C.COMBO_TIME; const snap = room.snapshot(); const me = snap.players.find(x => x.i === 'b'); assert(me && me.cmb === 8 && me.cmx > 1, 'lo snapshot espone combo e moltiplicatore');
  ok('novita v1.6 verificate');
}
function testV17() {
  console.log('\n[TEST 11] Novita v1.7 — stats fine partita, ricompense combo, sinergie');
  const room = new Room('v17'); const sent = []; const cap = { send(x) { try { sent.push(JSON.parse(x)); } catch (_) {} } }; const p = room.addPlayer('b', cap, 'B', 'ladro'); const p2 = room.addPlayer('c', { send() {} }, 'C', 'ladro'); room.startGame();
  // --- ricompense combo a soglie ---
  const killN = (pl, n) => { for (let i = 0; i < n; i++) { const m = room.spawnMonster('skeleton', pl.x + 30, pl.y, { scaling: Waves.scaling(2, 1) }); room.killMonster(m, pl); } };
  room.events.length = 0; p.combo = 14; killN(p, 1); assert(p.combo === 15 && room.events.some(e => e.t === 'combo_reward' && e.tier === 1), 'combo 15 sblocca ricompensa tier 1 (Frenesia)');
  assert(p.buffs.b_rate > 0, 'ricompensa 15 applica buff cadenza');
  room.events.length = 0; p.combo = 24; room.bullets.length = 0; killN(p, 1); assert(p.combo === 25 && room.events.some(e => e.t === 'combo_reward' && e.tier === 2), 'combo 25 sblocca Nova (tier 2)');
  assert(room.bullets.filter(b => !b.hostile).length >= 12, 'la Nova di combo genera proiettili');
  room.events.length = 0; p.combo = 39; p.hp = 1; p.maxHp = 200; killN(p, 1); assert(p.combo === 40 && room.events.some(e => e.t === 'combo_reward' && e.tier === 3), 'combo 40 sblocca Cura+Egida (tier 3)');
  assert(p.hp > 1, 'ricompensa 40 cura il giocatore');
  // --- sinergie boon ---
  room.phase = C.PHASE_SHOP;
  p.boonOffer = ['poison']; room.pickBoon('b', 'poison'); assert(!p.synActive.toxic_burst, 'un solo boon non attiva la sinergia');
  room.events.length = 0; p.boonOffer = ['explode']; room.pickBoon('b', 'explode');
  assert(p.synActive.toxic_burst === 1, 'poison + explode attiva Deflagrazione Tossica');
  assert(p.boon.toxicBurst === 1, 'la sinergia imposta il flag toxicBurst');
  assert(sent.some(m => m.ev && m.ev.t === 'synergy' && m.ev.id === 'toxic_burst'), 'la sinergia emette un evento al giocatore');
  // frost_chain: chain + freeze
  p.boonOffer = ['chain']; room.pickBoon('b', 'chain'); p.boonOffer = ['freeze']; room.pickBoon('b', 'freeze');
  assert(p.synActive.frost_chain === 1 && p.boon.frostChain === 1, 'chain + freeze attiva Catena Gelida');
  // seeker: homing + pierce. v1.73 — qui si arriverebbe a SEI carte, una oltre il tetto: la sesta arriva
  // spenta e la sinergia non scatta. Si libera un posto spegnendone una, che e' cio' che si fa giocando.
  p.boonOffer = ['pierce']; room.pickBoon('b', 'pierce'); const pierce0 = p.boon.pierce;
  p.boonOffer = ['homing']; room.pickBoon('b', 'homing');
  assert(!p.cardOn.homing, 'la SESTA carta arriva spenta: il tetto vale anche a fine ondata');
  assert(!p.synActive.seeker, 'e una carta spenta non completa la sinergia');
  delete p.cardOn.poison; p.cardOn.homing = 1; room._recomputeBoons(p);   // faccio spazio, come dalla Cartomante
  assert(p.synActive.seeker === 1 && p.boon.pierce === pierce0 + 1, 'homing + pierce attiva Cercatore (+1 perforazione)');
  assert(!p.synActive.toxic_burst, 'e spegnendo Tossina la sua sinergia si spegne con lei');
  // la sinergia gia attiva non si ri-applica: detectSynergies esclude quelle in synActive
  const again = Loot.detectSynergies(p.boonsOwned, p.synActive); assert(!again.some(x => x.id === 'seeker'), 'la sinergia gia attiva non viene rilevata di nuovo');
  // toxicBurst avvelena ad area
  const tp = room.addPlayer('d', { send() {} }, 'D', 'ladro'); tp.boon.toxicBurst = 1; tp.boon.poison = 1;
  const tm = room.spawnMonster('skeleton', tp.x + 20, tp.y, { scaling: Waves.scaling(2, 1) }); tm.poison = 0;
  room._toxicBurst(tp.x + 20, tp.y, 90, tp); assert(tm.poison > 0 && tm.poisonT > 0, 'la Deflagrazione Tossica avvelena i nemici ad area');
  // --- statistiche di fine partita ---
  p.kills = 12; p.comboBest = 40; p.damageDealt = 3400; p2.kills = 5; p2.comboBest = 8;
  const stats = room.buildRunStats();
  assert(Array.isArray(stats) && stats.length >= 2, 'buildRunStats restituisce una riga per giocatore');
  assert(stats[0].k >= stats[1].k, 'la classifica e ordinata per uccisioni');
  const row = stats.find(r => r.i === 'b'); assert(row && row.cb === 40 && row.dmg === 3400 && row.syn >= 1, 'le stats includono combo max, danni e sinergie');
  // gameover porta stats e durata
  sent.length = 0; room.runStart = room.time - 90; room.gameOver();
  assert(sent.some(m => m.ev && m.ev.t === 'gameover' && Array.isArray(m.ev.stats) && m.ev.dur >= 90), 'il gameover include statistiche e durata');
  ok('novita v1.7 verificate');
}
function testV18() {
  console.log('\n[TEST 12] Novita v1.8 — monete & negozio equipaggiamento');
  const room = new Room('v18'); const sent = []; const cap = { send(x) { try { sent.push(JSON.parse(x)); } catch (_) {} } };
  const p = room.addPlayer('b', cap, 'B', 'guerriero'); room.startGame();  // v1.67 — il guerriero e' quello con tutti e tre gli slot
  assert(p.coins === 0, 'il giocatore parte con 0 monete');
  assert(p.gear && p.gear.weapon === 'gue_spada' && p.gear.armor === 'gue_maglia' && p.gear.shield === 'gue_scudo', 'si parte col rango 1 di ogni slot della classe');
  // --- drop monete alla morte ---
  const before = room.groundCoins.length; const m = room.spawnMonster('orc', p.x + 30, p.y, { scaling: Waves.scaling(3, 1) }); room.killMonster(m, p);
  assert(room.groundCoins.length > before, 'un nemico ucciso lascia monete a terra');
  assert(room.groundCoins.every(c => c.v > 0 && c.cid), 'le monete hanno un valore e un taglio');
  // --- raccolta monete (calamita) ---
  const dt = 1 / C.TICK_RATE; const c0 = p.coins; for (let i = 0; i < 60; i++) room.update(dt); assert(p.coins > c0, 'le monete vengono raccolte avvicinandosi');
  // --- acquisto equipaggiamento ---
  // v1.52 — l'acquisto avviene nella mappa MERCATO, stando vicino al fabbro (non piu' dal pannello di fine ondata).
  room.wave = 3; room.phase = C.PHASE_SHOP; room.shopReady('b', 'market'); room._afterShop();
  p.coins = 100000; p.x = room.gearMerchant.x; p.y = room.gearMerchant.y;
  // v1.67 — l'Emporio a livelli e' un catalogo di OGGETTI per classe: si compra un id, non uno slot.
  const Gear = require('../shared/gear.js');
  const hp0 = room.effMaxHp(p);
  const piastre = Gear.BY_ID.gue_piastre, torre = Gear.BY_ID.gue_torre, alabarda = Gear.BY_ID.gue_alabarda;
  assert(p.gear.armor === 'gue_maglia' && p.gear.weapon === 'gue_spada' && p.gear.shield === 'gue_scudo', 'si parte col rango 1 di ogni slot');
  const dr0 = p.gearBonus.dmgReduce;
  room.buyGear('b', 'gue_piastre');
  assert(p.gear.armor === 'gue_piastre', 'l acquisto sostituisce l oggetto nello slot');
  assert(p.coins === 100000 - piastre.cost, 'il costo viene scalato dalle monete');
  assert(p.gearBonus.dmgReduce > dr0 && room.effMaxHp(p) > hp0, 'l armatura migliore da piu PV e piu riduzione');
  // il cambio e' LIBERO: si torna indietro, e il bonus del pezzo tolto sparisce (non resta appiccicato)
  room.buyGear('b', 'gue_maglia');
  assert(p.gear.armor === 'gue_maglia' && Math.abs(p.gearBonus.dmgReduce - dr0) < 1e-9, 'tornando indietro il bonus viene ricalcolato da zero');
  room.buyGear('b', 'gue_piastre');
  // arma: cambia danno E portata del fendente
  const dmg0 = room.effDamage(p), rad0 = room.effWeapon(p).arcRadius;
  room.buyGear('b', 'gue_alabarda');
  assert(room.effDamage(p) > dmg0 && room.effWeapon(p).arcRadius > rad0, 'l alabarda fa piu danno e arriva piu lontano');
  assert(room.effWeapon(p).arcHalf < Gear.BY_ID.gue_spada.weapon.arcHalf, 'ma copre un arco piu stretto');
  assert(room.effWeapon(p).school === 'melee', 'l arma comprata NON cambia la scuola della classe');
  // scudo
  const dr1 = p.gearBonus.dmgReduce; room.buyGear('b', 'gue_torre');
  assert(p.gearBonus.dmgReduce > dr1, 'lo scudo a torre riduce di piu');
  // roba di un'altra classe: non si compra
  room.buyGear('b', 'mag_bastone'); assert(p.gear.weapon === 'gue_alabarda', 'il guerriero non puo comprare oggetti del mago');
  // monete insufficienti
  p.coins = 0; room.buyGear('b', 'gue_spadone'); assert(p.gear.weapon === 'gue_alabarda', 'senza monete non si acquista');
  p.coins = 100000;
  // --- offerta gear inviata al client ---
  sent.length = 0; room.offerGear(p);
  const gm = sent.find(mm => mm.t === C.MSG.OFFER_GEAR);
  assert(gm && gm.slots.length === 3 && gm.slots.map(x => x.slot).join(',') === 'weapon,armor,shield', 'offerGear invia i 3 slot del guerriero');
  assert(gm.slots.every(sl => sl.items.length >= 2 && sl.items.every(i => i.name && i.desc && typeof i.cost === 'number')), 'ogni slot porta i suoi oggetti con nome, descrizione e prezzo');
  // --- snapshot espone le monete ---
  const snap = room.snapshot(); const me = snap.players.find(x => x.i === 'b'); assert(me && typeof me.co === 'number', 'lo snapshot espone le monete del giocatore'); assert(Array.isArray(snap.coins), 'lo snapshot espone le monete a terra');
  // --- riduzione danni con cap ---
  p.stats.dmgReduce = 2.0; p.buffs = {}; p.hp = 1000; p.maxHp = 1000; const h0 = p.hp; room.damagePlayer(p, 100, p.x + 10, p.y, 0); assert(p.hp < h0, 'la riduzione danni e limitata (subisce sempre almeno un po)');
  ok('novita v1.8 verificate');
}
function testV19() {
  console.log('\n[TEST 13] Novita v1.9 — pausa negozio, raccolta auto, nuove abilita');
  assert(C.VERSION && typeof C.VERSION === 'string', 'la versione e definita nelle costanti (' + C.VERSION + ')');
  const dt = 1 / C.TICK_RATE;
  // --- PAUSA durante il negozio: il mondo non si simula ---
  const room = new Room('v19'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  const mon = room.spawnMonster('skeleton', p.x + 120, p.y, { scaling: Waves.scaling(2, 1) }); mon.mx = 200; mon.my = 0;
  room.bullets.push({ eid: 99999, hostile: true, x: p.x + 40, y: p.y, vx: 300, vy: 0, r: 5, dmg: 5, life: 3 });
  room.phase = C.PHASE_SHOP; room.shopTimer = 45; p.ready = false;
  const mx0 = mon.x, my0 = mon.y, bx0 = room.bullets[0].x, px0 = p.x;
  room.setInput('b', { mx: 1, my: 0, aim: 0, shoot: true });
  for (let i = 0; i < 10; i++) room.update(dt);
  assert(mon.x === mx0 && mon.y === my0, 'in pausa i nemici non si muovono');
  assert(room.bullets[0] && room.bullets[0].x === bx0, 'in pausa i proiettili non avanzano');
  assert(p.x === px0, 'in pausa il giocatore non si muove');
  assert(room.phase === C.PHASE_SHOP, 'in singolo il negozio non avanza da solo (attende il click)');
  room.shopReady('b'); room.update(dt); assert(room.phase !== C.PHASE_SHOP, 'il pulsante Continua (shopReady) fa proseguire la partita');
  // --- RACCOLTA AUTOMATICA a fine ondata ---
  const room2 = new Room('v19b'); const q = room2.addPlayer('c', { send() {} }, 'C', 'ladro'); room2.startGame();
  room2.groundXp.push({ eid: 1, x: 5000, y: 5000, v: 30, t: 30 });
  room2.groundCoins.push({ eid: 2, x: 5000, y: 5000, v: 25, cid: 'gold', t: 30 });
  const xp0 = q.xpPool, co0 = q.coins; room2.enterShop();
  assert(q.xpPool >= xp0 + 30, 'la XP rimasta a terra viene raccolta automaticamente');
  assert(q.coins >= co0 + 25, 'le monete rimaste a terra vengono raccolte automaticamente');
  assert(room2.groundXp.length === 0 && room2.groundCoins.length === 0, 'il terreno viene ripulito dai drop');
  // --- v1.66: le abilita' Q/E sono state RIMOSSE (torretta, cecchino, bullet-time erano cucite sui tre
  // eroi cyberpunk eliminati). Il test non verifica piu' che ci siano, ma che non tornino di soppiatto:
  // gli eroi non ne dichiarano nessuna e useQ/useE non devono produrre NIENTE.
  const room3 = new Room('v19c'); const e = room3.addPlayer('d', { send() {} }, 'D', 'guerriero'); room3.startGame();
  e.cdQ = 0; e.cdE = 0; const nOrb = room3.orbs.length, nBul = room3.bullets.length;
  room3.useQ(e); room3.useE(e);
  assert(room3.orbs.length === nOrb && room3.bullets.length === nBul, 'Q/E non producono piu nulla');
  assert(e.cdQ === 0 && e.cdE === 0, 'Q/E non consumano nemmeno un cooldown');
  for (const id of Heroes.ORDER) { const h = Heroes.HEROES[id]; assert(h.abilities && Object.keys(h.abilities).length === 0, id + ' non dichiara abilita in v1.66'); }
  // --- lo SCATTO universale (tasto destro) resta funzionante ---
  const room5 = new Room('v19e'); const g = room5.addPlayer('h', { send() {} }, 'H', 'ladro'); room5.startGame(); g.cdDash = 0;
  room5.useDash(g); assert(g.buffs.dash > 0 && g.cdDash > 0, 'lo scatto universale (tasto destro) resta attivo');
  ok('novita v1.9 verificate');
}
function testV110() {
  console.log('\n[TEST 14] Novita v1.10 — 2 poteri a scelta, piu boon, emporio 3 slot');
  // --- si sceglie tra ESATTAMENTE 2 poteri ---
  const room = new Room('v110'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame(); room.phase = C.PHASE_SHOP;
  room.offerBoon(p); assert(p.boonOffer && p.boonOffer.length === 3, 'a fine ondata si sceglie 1 di 3 poteri — v1.51, era 1 di 2 (offerti: ' + (p.boonOffer || []).length + ')');
  // --- catalogo boon ampliato ---
  assert(Loot.BOONS.length >= 23, 'il catalogo dei poteri e ampliato (' + Loot.BOONS.length + ')');
  for (const id of ['berserk', 'swift', 'lucky', 'juggernaut', 'executioner', 'artillery']) assert(Loot.BOON_BY_ID[id], 'nuovo boon presente: ' + id);
  // --- i nuovi boon applicano effetti ---
  const d0 = p.stats.dmgMult; p.boonOffer = ['berserk']; room.pickBoon('b', 'berserk'); assert(p.stats.dmgMult > d0, 'Furia Cieca aumenta il danno');
  const hp0 = room.effMaxHp(p); p.boonOffer = ['juggernaut']; room.pickBoon('b', 'juggernaut'); assert(room.effMaxHp(p) > hp0, 'Colosso aumenta i PV massimi');
  const cm0 = p.stats.critMult; p.boonOffer = ['executioner']; room.pickBoon('b', 'executioner'); assert(p.stats.critMult > cm0, 'Giustiziere aumenta il danno critico');
  // --- v1.67: l'emporio a livelli non esiste piu' (catalogo per classe in shared/gear.js) ---
  assert(!Loot.GEAR && !Loot.GEAR_BY_SLOT && !Loot.gearCost, 'l emporio generico a livelli e stato rimosso da loot.js');
  const sent = []; const cap = { send(x) { try { sent.push(JSON.parse(x)); } catch (_) {} } };
  const eb = room.addPlayer('z', cap, 'Z', 'mago'); room.offerGear(eb);
  const gearMsg = sent.find(m => m.t === C.MSG.OFFER_GEAR);
  assert(gearMsg && gearMsg.slots.map(s => s.slot).join(',') === 'weapon,armor', 'il mago vede solo i suoi due slot (niente scudo, niente calzature)');
  ok('novita v1.10 verificate');
}
function testV111() {
  console.log('\n[TEST 15] Novita v1.11 — mercante, zone telegrafate, attacchi vari, micro-aree');
  const dt = 1 / C.TICK_RATE;
  // --- MERCANTE: spawn con 3 offerte, acquisto per monete, prossimita ---
  const room = new Room('v111'); const sent = []; const cap = { send(x) { try { sent.push(JSON.parse(x)); } catch (_) {} } };
  const p = room.addPlayer('b', cap, 'B', 'ladro'); room.startGame();
  room.spawnMerchant(); // v1.17 — forza il mercante ufficiale (a fine round e casuale: ufficiale O nero)
  assert(room.merchant && Array.isArray(room.merchant.wares) && room.merchant.wares.length === 3, 'il mercante appare con 3 offerte');
  assert(room.merchant.wares.every(w => w.cost > 0 && w.id && w.icon), 'le offerte hanno costo/icona/id');
  // porta il giocatore lontano: non deve poter comprare
  p.x = room.merchant.x + 1000; p.y = room.merchant.y; p.coins = 100000;
  const ware = room.merchant.wares.find(w => w.kind === 'heal') || room.merchant.wares[0];
  const c0 = p.coins; room.buyMerchant('b', ware.id); assert(p.coins === c0, 'lontano dal mercante non si acquista');
  // avvicina: acquisto valido
  p.x = room.merchant.x + 10; p.y = room.merchant.y; p.hp = 1; const before = p.coins; room.buyMerchant('b', ware.id);
  assert(p.coins === before - ware.cost, 'vicino al mercante si acquista e si scalano le monete');
  // maxhp permanente
  const mh = room.merchantWaresPool().find(w => w.kind === 'maxhp'); room.merchant.wares.push(mh); const hp0 = room.effMaxHp(p); p.coins = 100000; room.buyMerchant('b', 'maxhp'); assert(room.effMaxHp(p) > hp0, 'il talismano vitale aumenta i PV massimi');
  // prossimita: updateMerchant invia OFFER quando entri nel raggio
  sent.length = 0; p._nearMerch = false; p.x = room.merchant.x; p.y = room.merchant.y; room.updateMerchant(dt);
  assert(sent.some(m => m.t === C.MSG.OFFER_MERCHANT && m.near), 'avvicinandosi arriva l\'offerta del mercante');
  // --- ZONE telegrafate (Hades-style) ---
  const ctx = room.makeCtx(); const m = room.spawnMonster('skeleton', p.x + 100, p.y, { scaling: Waves.scaling(3, 1) });
  const z0 = room.zones.length; ctx.zone(p.x, p.y, 60, 0.4, 30, '#c56bff'); assert(room.zones.length === z0 + 1, 'una zona telegrafata viene creata');
  assert(room.events.some(e => e.t === 'zone_tell'), 'la zona emette un telegrafo');
  p.buffs = {}; p.hp = 500; p.maxHp = 500; const hpz = p.hp; for (let i = 0; i < 20; i++) room.updateZones(dt); assert(p.hp < hpz, 'la zona danneggia allo scadere del telegrafo');
  // --- ctx.spread genera piu proiettili ostili ---
  const b0 = room.bullets.length; ctx.spread(m, 1, 0, 3, 0.2, 200, 8, '#c56bff'); assert(room.bullets.filter(x => x.hostile).length >= b0 + 3, 'lo spread spara un ventaglio di proiettili');
  // --- MICRO-AREE nella mappa ---
  assert(Array.isArray(room.map.microAreas), 'la mappa espone le micro-aree');
  // --- snapshot espone mercante + zone ---
  const snap = room.snapshot(); assert(snap.merch && typeof snap.merch.x === 'number', 'lo snapshot espone il mercante'); assert(Array.isArray(snap.zones), 'lo snapshot espone le zone');
  const me = snap.players.find(x => x.i === 'b'); assert(me && 'nm' in me, 'lo snapshot espone il flag prossimita mercante');
  ok('novita v1.11 verificate');
}
function testV112() {
  console.log('\n[TEST 16] Novita v1.12 — Mercante Nero (rischio/ricompensa) + differenziazione');
  const dt = 1 / C.TICK_RATE;
  const room = new Room('v112'); const sent = []; const cap = { send(x) { try { sent.push(JSON.parse(x)); } catch (_) {} } };
  const p = room.addPlayer('b', cap, 'B', 'ladro'); room.startGame();
  // forza lo spawn del mercante nero (di norma e casuale ~35%)
  room.spawnDarkMerchant();
  assert(room.darkMerchant && Array.isArray(room.darkMerchant.wares) && room.darkMerchant.wares.length === 3, 'il mercante nero appare con 3 patti');
  assert(room.darkMerchant.wares.every(w => w.cost > 0 && /ma /.test(w.desc || '') || w.kind === 'gamble'), 'i patti hanno un rischio (\'ma ...\') o sono un azzardo');
  // differenziazione: i due mercanti attingono a cataloghi diversi
  const normalIds = new Set(room.merchantWaresPool().map(w => w.id));
  const darkIds = room.darkWaresPool().map(w => w.id);
  assert(darkIds.every(id => !normalIds.has(id)), 'i due mercanti offrono oggetti diversi');
  // lontano non si compra
  p.x = room.darkMerchant.x + 1000; p.y = room.darkMerchant.y; p.coins = 100000;
  const pact = room.darkMerchant.wares.find(w => w.kind === 'pact_berserk') || room.darkMerchant.wares[0];
  const c0 = p.coins; room.buyDark('b', pact.id); assert(p.coins === c0, 'lontano dal mercante nero non si acquista');
  // vicino: patto Berserker => +danno ma -PV massimi (rischio/ricompensa)
  room.darkMerchant.wares[0] = Object.assign({}, room.darkWaresPool().find(w => w.kind === 'pact_berserk'));
  p.x = room.darkMerchant.x + 10; p.y = room.darkMerchant.y; p.coins = 100000;
  const dmg0 = p.stats.dmgMult, mhp0 = room.effMaxHp(p); room.buyDark('b', 'pact_berserk');
  assert(p.stats.dmgMult > dmg0, 'il Patto del Berserker aumenta il danno');
  assert(room.effMaxHp(p) < mhp0, 'il Patto del Berserker riduce i PV massimi (il prezzo del patto)');
  // offerta di sangue: +vite ma dimezza monete
  room.darkMerchant.wares[1] = Object.assign({}, room.darkWaresPool().find(w => w.kind === 'blood_coin'));
  p.coins = 200; const lv0 = p.lives; room.buyDark('b', 'blood_coin'); assert(p.lives === lv0 + 2, 'l\'offerta di sangue da +2 vite'); assert(p.coins < 200 - 40, 'l\'offerta di sangue dimezza le monete');
  // prossimita invia offerta dark
  sent.length = 0; p._nearDark = false; p.x = room.darkMerchant.x; p.y = room.darkMerchant.y; room.updateDarkMerchant(dt);
  assert(sent.some(m => m.t === C.MSG.OFFER_MERCHANT && m.dark && m.near), 'avvicinandosi arriva l\'offerta del mercante nero');
  // snapshot espone merchD + flag prossimita dark
  const snap = room.snapshot(); assert(snap.merchD && typeof snap.merchD.x === 'number', 'lo snapshot espone il mercante nero'); const me = snap.players.find(x => x.i === 'b'); assert(me && 'nmd' in me, 'lo snapshot espone il flag prossimita mercante nero');
  // apparizione casuale IN SOSTITUZIONE dell'ufficiale: mai entrambi, il nero compare a volte si a volte no
  let appear = 0, both = 0, none = 0; for (let i = 0; i < 80; i++) { room.newMap((Math.random() * 1e9) | 0, 1 + (i % 10)); if (room.darkMerchant) appear++; if (room.merchant && room.darkMerchant) both++; if (!room.merchant && !room.darkMerchant) none++; }
  assert(appear > 0 && appear < 80, 'il mercante nero appare in modo casuale (non sempre): ' + appear + '/80');
  assert(both === 0, 'mai entrambi i mercanti insieme (il nero sostituisce quello ufficiale)');
  assert(none === 0, 'ce sempre almeno un mercante per round');
  ok('novita v1.12 verificate');
}
function testV113() {
  console.log('\n[TEST 17] Novita v1.13 — ridimensionamento LEGGERO + fluidita (visivo>collisione, velocita ok)');
  // costanti leggere: occhi grandi, hitbox quasi invariata
  assert(C.VIS_SCALE >= 1.3 && C.VIS_SCALE <= 1.6, 'VIS_SCALE leggero (~1.45): ' + C.VIS_SCALE);
  assert(C.COL_SCALE >= 1.0 && C.COL_SCALE <= 1.15, 'COL_SCALE quasi invariato (~1.08): ' + C.COL_SCALE);
  assert(C.VIS_SCALE > C.COL_SCALE + 0.2, 'il visivo e nettamente maggiore della collisione (occhi grandi, hitbox piccola)');
  const room = new Room('v113'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  // collisione giocatore quasi invariata
  const expP = C.PLAYER_RADIUS * C.COL_SCALE; assert(Math.abs(p.radius - expP) < 0.5, 'raggio collisione giocatore leggero (' + p.radius.toFixed(1) + ' ~ ' + expP.toFixed(1) + ')');
  assert(p.radius < C.PLAYER_RADIUS * 1.2, 'la hitbox giocatore resta vicina a quella originale (fluidita)');
  // mostro: velocita INVARIATA (calcolo sul raggio originale)
  const s = Waves.scaling(3, 1); const gob = room.spawnMonster('skeleton', p.x + 60, p.y, { scaling: s });
  const skDef = require('../shared/monsters.js').MONSTERS.skeleton; const defSpeed = skDef.speed; const baseR = skDef.radius;
  const sizeFactor = Math.min(1.45, Math.max(0.6, 16 / baseR)); const wantSpeed = defSpeed * s.speed * sizeFactor;
  assert(Math.abs(gob.speed - wantSpeed) < 1.0, 'velocita mostro coerente col def: ' + gob.speed.toFixed(0) + ' ~ ' + wantSpeed.toFixed(0));
  assert(Math.abs(gob.radius - baseR * C.COL_SCALE) < 0.6, 'collisione mostro leggera (~1.08x del raggio base)');
  // giocatore +5% velocita base (feel piu reattivo)
  const base = p.hero.speed; assert(room.effSpeed(p) > base * 1.03, 'il giocatore ha un +5% di velocita base');
  // moveCircle resta permissivo come v1.12 (0.8): il fattore non e stato reso piu stretto
  ok('novita v1.13 verificate');
}
function testV139() {
  console.log('\n[TEST 18] Novita v1.39 — Negromante PUPPET (sfere debilitanti nel campo visivo + evoca zombi minori) & migliorie');
  const Mon = require('../shared/monsters.js');
  // roster PUPPET: zombie + negromante (entrambi puppet); spettro/occhio restano rimossi
  for (const id of ['spettro']) assert(!Mon.MONSTERS[id], 'nemico vettoriale ancora rimosso: ' + id); // v1.49 — occhio reintrodotto (Beholder)
  assert(Mon.ORDER[0] === 'skeleton' && Mon.ORDER.includes('darkmage'), 'ORDER parte dallo sciame base e contiene il Negromante');
  const z = Mon.MONSTERS.skeleton, dm = Mon.MONSTERS.darkmage, mn = Mon.MONSTERS.zombie_mini;
  assert(z && z.puppet && z.shape === 'ghoul', 'Zombie Putrido = puppet ghoul');
  // Negromante: puppet 'mage', ranged, con curse + fov + evocazione limitata
  assert(dm && dm.puppet && dm.shape === 'mage' && dm.ai === 'necromancer', 'Negromante = puppet mage, IA necromancer');
  assert(dm && dm.curse === true, 'le sfere del Negromante sono DEBILITANTI (curse)');
  assert(dm && dm.fov > 0 && dm.sightRange > 0, 'il Negromante ha un CAMPO VISIVO (fov + sightRange)');
  assert(dm && dm.summon === 'zombie_mini' && dm.minionCap >= 3 && dm.minionCap <= 4, 'evoca zombi minori con tetto 3-4 (minionCap ' + dm.minionCap + ')');
  // Zombie Minore: puppet ghoul piccolo, non in ondata
  assert(mn && mn.minion && mn.puppet && mn.shape === 'ghoul' && mn.radius < z.radius, 'Zombie Minore = puppet ghoul piccolo');
  assert(mn && mn.weight === 0, 'lo Zombie Minore NON compare nelle ondate (solo evocato)');
  // pool: negromante entra dall'ondata 3
  assert(!Waves.poolForWave(2).some(x => x.id === 'darkmage'), 'niente Negromante prima dell\'ondata 3');
  assert(Waves.poolForWave(3).some(x => x.id === 'darkmage'), 'Negromante nel pool dall\'ondata 3');
  // simulazione: il Negromante evoca al massimo minionCap zombi minori e non supera il tetto
  const room = new Room('v139'); const pl = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  const nm = room.spawnMonster('darkmage', pl.x + 300, pl.y, { scaling: Waves.scaling(4, 1) });
  assert(nm && nm.type === 'darkmage', 'il Negromante si genera');
  const dt = 1 / C.TICK_RATE; for (let i = 0; i < C.TICK_RATE * 30; i++) { room.setInput('b', bot(room, pl)); room.update(dt); if (hasNaN(room)) break; }
  assert(hasNaN(room) === null, 'nessun NaN con Negromante + evocati in campo');
  const minions = room.monsters.filter(m => m.owner === nm.eid && !m.dead);
  assert(minions.length <= (dm.minionCap || 4), 'gli zombi minori evocati non superano il tetto (' + minions.length + '<=' + dm.minionCap + ')');
  assert(minions.every(m => m.type === 'zombie_mini'), 'gli evocati sono Zombi Minori');
  const snap = room.snapshot(); assert(snap.mon.every(mm => isFinite(mm.x)), 'snapshot valido');
  // i boss continuano a evocare skeleton (compat)
  assert(Mon.BOSSES.orc_warlord.summon === 'skeleton', 'i boss evocano ancora lo skeleton');
  ok('novita v1.39 verificate');
}
function testV142() {
  console.log('\n[TEST 19] Novita v1.42 — Bruto delle Caverne (tank PUPPET, slam ad area)');
  const Mon = require('../shared/monsters.js');
  const br = Mon.MONSTERS.cave_brute;
  assert(!!br, 'il Bruto delle Caverne esiste nel roster');
  assert(br && br.sheet === 'troll', 'Troll = render SPRITE-SHEET (sheet=troll)'); // v1.47 — sostituito il puppet con lo sprite sheet animato
  assert(br && br.ai === 'brute' && br.atk === 'melee', 'Bruto ha IA brute (slam) da mischia');
  assert(br && br.hp >= 180 && br.speed <= 80 && br.dmg >= 20, 'Bruto e un TANK: molti PV, lento, danno alto');
  assert(br && br.slamRadius > 0, 'Bruto ha un raggio di SLAM ad area');
  assert(Mon.ORDER.includes('cave_brute'), 'cave_brute e presente nell\'ORDER del bestiario');
  // v1.50 — il Troll entra nel pool dall'ondata 4 (la comparsa dal primo stage era temporanea)
  assert(Waves.poolForWave(4).some(x => x.id === 'cave_brute'), 'Troll nel pool dall ondata 4');
  // si genera e lo slam colpisce ad area emettendo l'evento con eid (per l'animazione client)
  const room = new Room('v142'); const pl = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  const m = room.spawnMonster('cave_brute', pl.x + 40, pl.y, { scaling: Waves.scaling(4, 1) });
  assert(m && m.type === 'cave_brute' && isFinite(m.hp) && m.hp > 0, 'il Bruto si genera correttamente (scalato)');
  // v1.43 — SLAM a due tempi: a bruciapelo (in vista) alza le braccia (slam_wind con eid) → poi schianta ad area.
  pl.x = m.x + 24; pl.y = m.y; pl.buffs = {}; pl.hp = 500; const hp0 = pl.hp; m.atkT = 0; room.events.length = 0;
  const dt = 1 / C.TICK_RATE;
  // primo tick: parte il telegrafo (alza le braccia) con l'eid per animare il puppet
  room.update(dt);
  const wind = room.events.find(e => e.t === 'slam_wind');
  assert(wind && wind.e === m.eid, 'il Bruto ALZA le braccia (slam_wind con eid) quando ti vede a tiro');
  // lascia completare il wind-up: lo schianto deve infliggere danni ad area e mandare l\'evento slam (FX)
  for (let i = 0; i < 30; i++) { room.update(dt); if (pl.hp < hp0) break; }
  assert(room.events.some(e => e.t === 'slam') || pl.hp < hp0, 'lo schianto emette l\'onda d\'urto (slam)');
  assert(pl.hp < hp0, 'lo schianto del Bruto infligge danni ad area al giocatore vicino');
  // stabilita: simula col Bruto in campo, nessun NaN
  for (let i = 0; i < C.TICK_RATE * 6; i++) { room.setInput('b', bot(room, pl)); room.update(dt); if (hasNaN(room)) break; }
  assert(hasNaN(room) === null, 'nessun NaN simulando col Bruto in campo');
  ok('novita v1.42 verificate');
}
function testV143() {
  console.log('\n[TEST 20] Novita v1.43 — Bruto (walk lumbering + slam overhead), vagabondaggio & anti-incastro');
  const Mon = require('../shared/monsters.js');
  const br = Mon.MONSTERS.cave_brute;
  assert(br && br.slamWind > 0 && br.sightRange > 0, 'il Bruto ha wind-up (slamWind) e un campo visivo (sightRange)');
  // VAGABONDAGGIO: uno zombie che NON vede il giocatore (troppo lontano) deve muoversi comunque (roaming), non restare fermo.
  const room = new Room('v143w'); const pl = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  const far = room.map.spawn;
  const z = room.spawnMonster('skeleton', far.x + 40, far.y + 40, { scaling: Waves.scaling(2, 1) });
  pl.x = far.x + 2000; pl.y = far.y + 2000; // porta il giocatore lontanissimo → fuori vista
  z.seeT = 0; const zx0 = z.x, zy0 = z.y; let roamed = 0; const dt = 1 / C.TICK_RATE;
  for (let i = 0; i < C.TICK_RATE * 5; i++) { room.update(dt); roamed = Math.max(roamed, Math.hypot(z.x - zx0, z.y - zy0)); if (hasNaN(room)) break; }
  assert(hasNaN(room) === null, 'nessun NaN durante il vagabondaggio');
  assert(roamed > 20, 'lo zombie VAGA per la mappa quando non vede il giocatore (spostato ' + roamed.toFixed(0) + 'px)');
  assert(!room.isWallAt(z.x, z.y), 'lo zombie che vaga non finisce dentro un muro');
  // ANTI-INCASTRO (tutti, boss compresi): dopo una simulazione stress nessun mostro resta dentro un muro.
  const r2 = new Room('v143s'); for (let i = 0; i < 3; i++) r2.addPlayer('p' + i, { send() {} }, 'P' + i, Heroes.ORDER[i % 3]); r2.startGame();
  for (const id of ['skeleton', 'darkmage', 'cave_brute', 'orc_warlord', 'lich_king', 'mega_dragon']) { const pos = r2.randomSpawnPos(); r2.spawnMonster(id, pos.x, pos.y, { scaling: Waves.scaling(5, 3) }); }
  for (let i = 0; i < C.TICK_RATE * 20; i++) { for (const p of r2.players.values()) r2.setInput(p.id, bot(r2, p)); r2.update(dt); if (hasNaN(r2)) break; }
  assert(hasNaN(r2) === null, 'nessun NaN nello stress con boss in campo');
  // v1.61 — i nemici con def.phasing (Fuoco Fatuo) stanno DENTRO i muri per design: esclusi dal conteggio.
  const stuck = r2.monsters.filter(m => !m.dead && !m.def.phasing && r2.isWallAt(m.x, m.y)).length;
  assert(stuck === 0, 'nessun mostro/boss resta dentro un muro (incastrati: ' + stuck + ')');
  ok('novita v1.43 verificate');
}
function testV145() {
  console.log('\n[TEST 21] Novita v1.46 — Melma Corrosiva TOP-DOWN (pozza fluo che striscia) + SALTA/sputa acido');
  const Mon = require('../shared/monsters.js');
  const sl = Mon.MONSTERS.slime;
  assert(!!sl, 'la Melma Corrosiva esiste nel roster');
  assert(sl && sl.topdown === true && !sl.front, 'Melma = render TOP-DOWN (niente billboard)');
  assert(sl && sl.puppet === true && sl.bubbles === true, 'la Melma usa asset puppet (pozza) + bolle acide');
  assert(sl && sl.ai === 'blob' && sl.atk === 'ranged', 'la Melma usa IA blob (striscia + sputo acido a distanza ravvicinata)');
  assert(sl && sl.speed <= 60, 'la Melma è LENTA (' + sl.speed + ')');
  assert(sl && sl.acidMult > 1 && sl.acidCount >= 2 && sl.projSpeed > 0, 'la Melma sputa bolle d\'acido ad ALTO danno (mult ' + sl.acidMult + ' x' + sl.acidCount + ')');
  assert(Mon.ORDER.includes('slime'), 'slime presente nell\'ORDER del bestiario');
  const p2 = Waves.poolForWave(2).map(x => x.id);
  assert(p2.includes('slime') && p2.includes('skeleton'), 'Melma nel pool dall ondata 2, insieme allo sciame base');
  // simulazione: a distanza ravvicinata deve SPUTARE proiettili d'acido OSTILI (danno elevato) ed emettere 'acid'
  const room = new Room('v145'); const pl = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  const sp145 = losSpot(room, pl, 90);
  const m = room.spawnMonster('slime', sp145.x, sp145.y, { scaling: Waves.scaling(1, 1) });
  assert(m && m.type === 'slime' && isFinite(m.hp) && m.hp > 0, 'la Melma si genera correttamente');
  pl.x = m.x + 80; pl.y = m.y; m.atkT = 0; room.bullets.length = 0; room.events.length = 0;
  const dt = 1 / C.TICK_RATE; let sawAcid = false, acidBullets = 0;
  for (let i = 0; i < 8; i++) { room.update(dt); if (room.events.some(e => e.t === 'acid')) sawAcid = true; acidBullets = room.bullets.filter(b => b.hostile).length; if (acidBullets > 0) break; }
  assert(sawAcid, 'la Melma emette l\'evento acid (salta e sputa) quando sei vicino');
  assert(acidBullets >= 2, 'lo sputo genera più bolle d\'acido ostili (' + acidBullets + ')');
  const hostile = room.bullets.find(b => b.hostile);
  assert(hostile && hostile.dmg >= Math.round(m.dmg * 1.5), 'le bolle d\'acido fanno MOLTI danni (' + (hostile ? hostile.dmg : 0) + ' >= ' + Math.round(m.dmg * 1.5) + ')');
  // stabilità: nessun NaN con la Melma in campo
  for (let i = 0; i < C.TICK_RATE * 6; i++) { room.setInput('b', bot(room, pl)); room.update(dt); if (hasNaN(room)) break; }
  assert(hasNaN(room) === null, 'nessun NaN simulando con la Melma in campo');
  ok('novita v1.45 verificate');
}
function testV149() {
  console.log('\n[TEST 23] Novita v1.49 - Beholder (occhio): Sguardo debilitante + eyestalks che ruotano');
  const Mon = require('../shared/monsters.js');
  const oc = Mon.MONSTERS.occhio;
  assert(!!oc, 'il Beholder (occhio) esiste nel roster');
  assert(oc && oc.ai === 'gazer' && oc.atk === 'gaze', 'Beholder usa IA gazer (Sguardo, niente proiettili)');
  assert(oc && oc.puppet && oc.shape === 'beholder', 'Beholder reso col RENDER PUPPET raster (shape beholder)');
  assert(oc && oc.gazeFov > 0 && oc.gazeRange > 0, 'ha un campo visivo (gazeFov + gazeRange)');
  assert(oc && oc.gazeCycle > 0, 'le eyestalks RUOTANO: alterna il tipo di sguardo (gazeCycle)');
  assert(Mon.ORDER.indexOf('occhio') >= 0, 'occhio presente nell ORDER del bestiario');
  assert(Waves.poolForWave(10).some(x => x.id === 'occhio'), 'Beholder nel pool dall ondata 10 (col tetto di presenze)');
  const dt = 1 / C.TICK_RATE;
  const room = new Room('v149'); const pl = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  room.pending = 0; room.waveList = []; pl.hp = 9999; pl.maxHp = 9999;
  const sp = room.map.spawn;
  const m = room.spawnMonster('occhio', sp.x, sp.y, { scaling: Waves.scaling(3, 1) });
  assert(m && m.type === 'occhio' && ['weaken', 'slow', 'sunder'].indexOf(m.gazeKind) >= 0, 'lo spawn assegna un tipo di sguardo');
  pl.x = sp.x + 60; pl.y = sp.y; pl.buffs = {}; m.facing = 0; m.gazeTick = 0;
  let gazed = false;
  for (let i = 0; i < C.TICK_RATE * 3 && !gazed; i++) { room.update(dt); if (pl.buffs.gz_weaken > 0 || pl.buffs.gz_slow > 0 || pl.buffs.gz_sunder > 0) gazed = true; }
  assert(gazed, 'il Beholder debilita il giocatore nel suo campo visivo (Sguardo)');
  const k0 = m.gazeKind; let changed = false;
  for (let i = 0; i < C.TICK_RATE * (oc.gazeCycle + 1) && !changed; i++) { room.update(dt); if (m.gazeKind !== k0) changed = true; }
  assert(changed, 'le eyestalks ruotano: il tipo di sguardo cambia nel tempo');
  const snap = room.snapshot(); const mo = snap.mon.find(x => x.t === 'occhio');
  assert(mo && mo.gk, 'lo snapshot espone il tipo di sguardo (gk)');
  for (let i = 0; i < C.TICK_RATE * 5; i++) { room.setInput('b', bot(room, pl)); room.update(dt); if (hasNaN(room)) break; }
  assert(hasNaN(room) === null, 'nessun NaN col Beholder in campo');
  ok('novita v1.49 verificate');
}
function testV151() {
  console.log('\n[TEST 25] Novita v1.51 — 1 di 3 poteri, +10 boon, negozio XP severo, Emporio nascosto');
  const Loot = require('../shared/loot.js');
  const dt = 1 / C.TICK_RATE;
  // --- 1) si sceglie 1 di 3 ---
  assert(Loot.BOON_CHOICES === 3, 'la costante di offerta e 3 carte');
  // --- 2) dieci poteri nuovi, tutti applicabili ---
  const NEW = ['crowbar', 'longshot', 'killstep', 'gluttony', 'retaliate', 'aegis', 'corpseblast', 'execute', 'echo', 'defiance'];
  assert(NEW.every(id => !!Loot.BOON_BY_ID[id]), 'i 10 nuovi poteri sono nel catalogo');
  assert(Loot.BOONS.length === 33, 'catalogo a 33 poteri (23 storici + 10 nuovi): ' + Loot.BOONS.length);
  assert(NEW.every(id => { const b = Loot.BOON_BY_ID[id]; return b.max >= 1 && typeof b.apply === 'function' && b.desc && b.icon; }), 'ogni nuovo potere ha icona, descrizione, max e apply');
  assert(new Set(Loot.BOONS.map(b => b.id)).size === Loot.BOONS.length, 'nessun id di potere duplicato');
  // --- 3) il negozio XP e ora una scelta, non un rubinetto ---
  assert(Loot.STAT_MAX_LEVEL === 12, 'tetto di 12 livelli per statistica (v1.66)');
  const fullTree = Loot.XP_STATS.reduce((a, s) => { let t = 0; for (let n = 0; n < Loot.STAT_MAX_LEVEL; n++) t += Loot.statCost(s.base, n); return a + t; }, 0);
  assert(fullTree > 15000, 'massimizzare tutto l albero costa oltre 15.000 XP (prima 3.526): ' + fullTree);
  // --- 4) prove a runtime ---
  const msgs = [];
  const room = new Room('v151');
  const pl = room.addPlayer('b', { send(s) { try { msgs.push(JSON.parse(s)); } catch (e) { } } }, 'B', 'ladro');
  room.startGame();
  room.offerBoon(pl);
  assert(pl.boonOffer && pl.boonOffer.length === 3, 'a fine ondata arrivano 3 carte (una sola selezionabile)');
  // tetto: comprando all infinito ci si ferma a 8
  room.phase = C.PHASE_SHOP; pl.points = 9999999;
  for (let i = 0; i < 25; i++) room.buyStat('b', 'st_for');
  assert((pl.buys.st_for || 0) === Loot.STAT_MAX_LEVEL, 'la statistica si ferma al tetto di 8 livelli (arrivata a ' + (pl.buys.st_for || 0) + ')');
  // Emporio NASCOSTO: entrando nel negozio non arriva piu l offerta di equipaggiamento
  msgs.length = 0; room.enterShop();
  assert(!msgs.some(m => m.t === C.MSG.OFFER_GEAR), 'l Emporio a monete non viene piu offerto (nascosto in v1.51)');
  assert(msgs.some(m => m.t === C.MSG.OFFER_SHOP), 'il negozio XP viene ancora offerto');
  assert(msgs.some(m => m.t === C.MSG.BOONS), 'il client riceve l elenco dei poteri attivi (barra in basso)');
  // COLPO DI GRAZIA: sotto soglia il nemico muore, ma il boss no
  pl.boon.execute = 1;
  const m1 = room.spawnMonster('skeleton', pl.x + 200, pl.y, { scaling: Waves.scaling(3, 1) });
  m1.hp = Math.round(m1.maxHp * 0.11) + 1;
  room.damageMonster(m1, 1, pl.x, pl.y, 0, pl);
  assert(m1.dead, 'il Colpo di Grazia esegue il nemico sotto soglia');
  // ULTIMA OCCASIONE: consuma una carica invece di far cadere
  pl.defianceLeft = 1; pl.hp = 1; pl.down = false; pl.dead = false;
  room.downPlayer(pl);
  assert(!pl.down && pl.hp > 1 && pl.defianceLeft === 0, 'Ultima Occasione rimette in piedi e consuma la carica');
  // EGIDA OSTINATA: il primo colpo e annullato, il secondo no
  pl.boon.aegis = 1; pl.aegisT = 0; pl.buffs = {}; pl.hp = 500;
  room.damagePlayer(pl, 60, pl.x + 10, pl.y, 0);
  assert(pl.hp === 500 && pl.aegisT > 0, 'l Egida Ostinata annulla il colpo e va in ricarica');
  room.damagePlayer(pl, 60, pl.x + 10, pl.y, 0);
  assert(pl.hp < 500, 'il colpo successivo passa (egida in ricarica)');
  // nessun NaN con i nuovi poteri tutti attivi
  const room2 = new Room('v151b'); const p2 = room2.addPlayer('c', { send() { } }, 'C', 'ladro'); room2.startGame();
  for (const id of NEW) { const b = Loot.BOON_BY_ID[id]; for (let k = 0; k < b.max; k++) { b.apply(p2); p2.boonsOwned[id] = (p2.boonsOwned[id] || 0) + 1; } }
  for (let i = 0; i < C.TICK_RATE * 25; i++) { room2.setInput('c', bot(room2, p2)); room2.update(dt); if (hasNaN(room2)) break; }
  assert(hasNaN(room2) === null, 'nessun NaN con tutti e 10 i nuovi poteri al massimo');
  ok('novita v1.51 verificate');
}
function testV150() {
  console.log('\n[TEST 24] Novita v1.50 — curva di introduzione dei nemici + elite tarati sui tank');
  const Mon = require('../shared/monsters.js');
  const at = w => Waves.poolForWave(w).map(x => x.id);
  // 1) la RAMPA: un archetipo nuovo ogni 1-2 ondate, non tutti dal primo stage
  const p1 = at(1);
  assert(p1.length === 1 && p1[0] === 'skeleton', 'ondata 1: solo lo sciame base (Zombie Putrido)');
  assert(!at(1).includes('slime') && at(2).includes('slime'), 'Melma Corrosiva introdotta all ondata 2');
  assert(!at(2).includes('darkmage') && at(3).includes('darkmage'), 'Negromante introdotto all ondata 3');
  assert(!at(3).includes('cave_brute') && at(4).includes('cave_brute'), 'Troll introdotto all ondata 4');
  assert(!at(5).includes('bat_swarm') && at(6).includes('bat_swarm'), 'Nugolo di Pipistrelli introdotto all ondata 6');
  assert(!at(7).includes('wisp') && at(8).includes('wisp'), 'Fuoco Fatuo introdotto all ondata 8');
  assert(!at(9).includes('occhio') && at(10).includes('occhio'), 'Beholder introdotto all ondata 10');
  // v1.61.1 — la rampa non salta piu' nessuna ondata da 1 a 8: un archetipo nuovo per ondata.
  for (let w = 1; w <= 8; w++) assert(at(w).length === w, 'ondata ' + w + ': ' + w + ' archetipi nel pool');
  let mono = true; for (let w = 1; w < 20; w++) { const a = at(w), b = at(w + 1); if (!a.every(id => b.includes(id))) mono = false; }
  assert(mono, 'rampa monotona: nessun archetipo sparisce al crescere delle ondate');
  // 2) ELITE: i nemici gia robusti non devono esplodere di PV
  const brute = Mon.MONSTERS.cave_brute;
  assert(brute.eliteHp && brute.eliteHp < 2.4, 'il Troll ha un moltiplicatore elite ridotto (def.eliteHp)');
  const mk = (id, w, elite) => { const m = { def: Mon.MONSTERS[id] }; Waves.applyScaling(m, Waves.scaling(w, 1), elite); return m; };
  const trollE = mk('cave_brute', 4, true);
  assert(trollE.maxHp < 600, 'Troll elite all ondata 4 sotto i 600 PV (prima ~845): maxHp=' + trollE.maxHp);
  const zomE = mk('skeleton', 4, true), zom = mk('skeleton', 4, false);
  assert(Math.abs(zomE.maxHp / zom.maxHp - 2.4) < 0.05, 'gli altri nemici mantengono il 2.4x degli elite');
  // 3) nessuna regressione a runtime con la nuova curva
  const dt = 1 / C.TICK_RATE;
  const room = new Room('v150'); const pl = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  for (let i = 0; i < C.TICK_RATE * 20; i++) { room.setInput('b', bot(room, pl)); room.update(dt); if (hasNaN(room)) break; }
  assert(hasNaN(room) === null, 'nessun NaN con la nuova curva del pool');
  ok('novita v1.50 verificate');
}
function testV152() {
  console.log('\n[TEST 26] Novita v1.52 — mappa MERCATO ogni 3 ondate + fabbro dell\'equipaggiamento');
  const dt = 1 / C.TICK_RATE, T = C.TILE;
  const room = new Room('v152'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  // v1.53 — niente piu' cadenza fissa: al mercato ci si va scegliendolo dal menu di pausa
  room.wave = 3; room.phase = C.PHASE_SHOP; room.shopReady('b', 'market'); room._afterShop();
  assert(room.phase === C.PHASE_MARKET, 'dopo l\'ondata 3 si entra nel MERCATO');
  assert(room.wave === 3, 'il mercato e\' INTERSTIZIALE: non consuma un numero d\'ondata');
  assert(room.monsters.length === 0 && room.pending === 0, 'nel mercato non ci sono nemici');
  assert(!room.merchant && !room.darkMerchant, 'niente Mercante Errante nel mercato: resta un incontro delle ondate');
  assert(room.crates.length === 0, 'niente casse nel mercato (il 30% sarebbe una cassa-mima, cioe\' un nemico)');
  assert(!!room.gearMerchant, 'il fabbro dell\'equipaggiamento e\' presente');
  assert(!!room.map.exit, 'la mappa del mercato ha un portale EXIT');
  const cxw = (room.map.w / 2) * T, cyw = (room.map.h / 2) * T;
  assert(MU.dist(room.gearMerchant.x, room.gearMerchant.y, cxw, cyw) < T * 8, 'il fabbro sta al centro della mappa');
  // acquisto: serve essere vicini al fabbro
  p.coins = 100000; p.x = room.map.spawn.x; p.y = room.map.spawn.y;
  if (MU.dist(p.x, p.y, room.gearMerchant.x, room.gearMerchant.y) > C.MARKET_MERCH_RANGE + 12) {
    room.buyGear('b', 'lad_cuoio'); assert(p.gear.armor === 'lad_pelle', 'lontano dal fabbro non si compra');
  }
  p.x = room.gearMerchant.x; p.y = room.gearMerchant.y;
  room.buyGear('b', 'lad_cuoio'); assert(p.gear.armor === 'lad_cuoio', 'vicino al fabbro l\'acquisto va a buon fine');
  p._nearGear = false; room.updateGearMerchant(); assert(p._nearGear === true, 'avvicinandosi si apre il pannello del fabbro');
  p.x = room.gearMerchant.x + 400; room.updateGearMerchant(); assert(p._nearGear === false, 'allontanandosi il pannello si chiude');
  // uscita: CO-OP, il primo che entra nel portale porta tutti avanti
  p.x = room.map.exit.x * T + T / 2; p.y = room.map.exit.y * T + T / 2;
  const mapBefore = room.map;
  room._checkMarketExit();
  assert(room.wave === 4, 'il portale EXIT porta all\'ondata successiva');
  assert(room.phase !== C.PHASE_MARKET, 'si esce dalla fase mercato');
  assert(room.map !== mapBefore, 'uscendo dal mercato la mappa viene rigenerata: non si combatte nella stanza del fabbro');
  assert(!room.gearMerchant, 'il fabbro sparisce fuori dal mercato');
  // ondate non multiple di 3: si tira dritto
  room.wave = 4; room.phase = C.PHASE_SHOP; room._afterShop();
  assert(room.phase !== C.PHASE_MARKET && room.wave === 5, 'dopo l\'ondata 4 si passa direttamente alla 5');
  // essendo interstiziale, il mercato non consuma mai un'ondata: nemmeno quelle boss
  room.wave = 15; room.phase = C.PHASE_SHOP; room.shopReady('b', 'market'); room._afterShop();
  assert(room.phase === C.PHASE_MARKET && room.wave === 15, 'il mercato SEGUE l\'ondata boss, non la sostituisce');
  // nessun NaN girando nel mercato
  const r2 = new Room('v152b'); const p2 = r2.addPlayer('b', { send() {} }, 'B', 'ladro'); r2.startGame();
  r2.wave = 3; r2.phase = C.PHASE_SHOP; r2.shopReady('b', 'market'); r2._afterShop();
  for (let i = 0; i < C.TICK_RATE * 5; i++) { r2.setInput('b', bot(r2, p2)); r2.update(dt); if (hasNaN(r2)) break; }
  assert(hasNaN(r2) === null, 'nessun NaN nel mercato');
  ok('novita v1.52 verificate');
}
function testV153() {
  console.log('\n[TEST 27] Novita v1.53/1.55 — mercato centrale, destinazioni nel menu di pausa, tabella dei costi XP');
  const T = C.TILE;
  const room = new Room('v153'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();

  // --- 1) il MERCATO si sceglie, non capita ---
  room.wave = 2; room.phase = C.PHASE_SHOP; room._afterShop();
  assert(room.phase !== C.PHASE_MARKET && room.wave === 3, 'senza scelta si va all ondata successiva');
  room.wave = 2; room.phase = C.PHASE_SHOP; room.shopReady('b', 'market'); room._afterShop();
  assert(room.phase === C.PHASE_MARKET, 'scegliendo "market" si entra dal fabbro, a qualunque ondata');
  assert(room.wave === 2, 'la sosta non consuma un numero d ondata');

  // --- 2) fabbro E portale vicini al punto di atterraggio ---
  const sx = room.map.spawn.x, sy = room.map.spawn.y;
  const ex = room.map.exit.x * T + T / 2, ey = room.map.exit.y * T + T / 2;
  const dSmith = MU.dist(sx, sy, room.gearMerchant.x, room.gearMerchant.y) / T;
  const dExit = MU.dist(sx, sy, ex, ey) / T;
  assert(dSmith <= 10, 'il fabbro e a portata di sguardo dallo spawn (' + dSmith.toFixed(1) + ' tile)');
  assert(dExit <= 16, 'il portale EXIT e in vista dallo spawn (' + dExit.toFixed(1) + ' tile)');
  // v1.57 — si compare dentro la sala e si esce dal varco a sud: il portale e vicino, i banchi attorno
  // la tile EXIT e' stata spostata NELLA GRIGLIA (il client disegna il portale da li)
  let nExit = 0, exitIdx = -1;
  for (let i = 0; i < room.map.grid.length; i++) if (room.map.grid[i] === C.T_EXIT) { nExit++; exitIdx = i; }
  assert(nExit === 1, 'nella griglia c e una sola tile EXIT (' + nExit + ')');
  assert(exitIdx === room.map.exit.y * room.map.w + room.map.exit.x, 'la tile EXIT nella griglia coincide con map.exit');
  assert(room.map.grid[Math.round(room.gearMerchant.y / T - 0.5) * room.map.w + Math.round(room.gearMerchant.x / T - 0.5)] !== C.T_WALL, 'il fabbro non e dentro un muro');

  // --- 3) in co-op vale la PRIMA scelta espressa ---
  const r2 = new Room('v153b'); r2.addPlayer('a', { send() {} }, 'A', 'ladro'); r2.addPlayer('c', { send() {} }, 'C', 'ladro'); r2.startGame();
  r2.wave = 4; r2.phase = C.PHASE_SHOP; r2.shopDest = null;
  r2.shopReady('a', 'market'); r2.shopReady('c', 'wave');
  assert(r2.shopDest === 'market', 'in co-op decide chi sceglie per primo');

  // --- 4) curva XP: apertura piu dolce, coda molto piu dura ---
  const base = 10;
  // v1.55 — rispetto alla v1.54: primi 6 livelli x3, ultimi 2 x2. Il reddito reale misurato in partita
  // (~240 XP alla sola ondata 2) e' circa 2.4x quello che stimava il vecchio modello senza combo.
  // v1.66 — la curva e' stata rifatta su una regola sola, dichiarata dal committente: con l'XP di UNA run
  // (nell'ordine dei 18.000, misurato su partita vera) si deve poter cappare ESATTAMENTE una statistica.
  // Il confronto con la tabella v1.54 non ha piu' senso: quella aveva 8 livelli, questa ne ha 12.
  assert(Array.isArray(Loot.STAT_COST_STEPS) && Loot.STAT_COST_STEPS.length === Loot.STAT_MAX_LEVEL, 'la tabella dei costi copre tutti i 12 livelli');
  let one = 0; for (let n = 0; n < Loot.STAT_MAX_LEVEL; n++) one += Loot.statCost(base, n);
  assert(one >= 17000 && one <= 19000, 'cappare UNA statistica costa quanto una run intera (' + one + ')');
  const tree = Loot.XP_STATS.reduce((a, s) => { let t = 0; for (let n = 0; n < Loot.STAT_MAX_LEVEL; n++) t += Loot.statCost(s.base, n); return a + t; }, 0);
  assert(tree >= one * 3.8, 'l albero completo resta fuori portata: ' + tree + ' XP, cioe piu di tre run');
  // nessun gradino piatto: il 7 livello della vecchia tabella costava solo il 13% piu del 6 e si sentiva
  let minStep = Infinity; for (let n = 1; n < Loot.STAT_MAX_LEVEL; n++) minStep = Math.min(minStep, Loot.statCost(base, n) / Loot.statCost(base, n - 1));
  assert(minStep >= 1.4, 'ogni livello costa almeno il 40% piu del precedente (minimo ' + Math.round((minStep - 1) * 100) + '%)');
  // la curva resta monotona: nessun livello costa meno del precedente
  let mono = true; for (let n = 1; n < Loot.STAT_MAX_LEVEL; n++) if (Loot.statCost(base, n) <= Loot.statCost(base, n - 1)) mono = false;
  assert(mono, 'la curva dei costi e monotona crescente');
  ok('novita v1.53 verificate');
}
function testV157() {
  console.log('\n[TEST 28] Novita v1.57 — il mercato e una SALA scavata: pareti nere, buio, falo, un solo varco');
  const MapGen = require('../shared/mapgen.js');
  const T = C.TILE, m = MapGen.generateMarket(4242), V = MapGen.VILLAGE;
  const at = (x, y) => m.grid[y * m.w + x];
  const isFloor = (x, y) => at(x, y) !== C.T_WALL;

  // --- si SCAVA nella roccia: fuori dalla sala e dal corridoio c'e' solo muro ---
  let stray = 0, roomFloor = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const inRoom = x >= V.room.x0 && x <= V.room.x1 && y >= V.room.y0 && y <= V.room.y1;
    const inGap = x >= V.gap.x0 && x <= V.gap.x1 && y > V.room.y1 && y <= V.gap.y1;
    if (isFloor(x, y) && !inRoom && !inGap) stray++;
    if (inRoom) { if (!isFloor(x, y)) stray++; else roomFloor++; }
  }
  assert(stray === 0, 'la sala e scavata: niente pavimento fuori, niente muri dentro (' + stray + ' anomalie)');
  assert(roomFloor > 100, 'la sala ha spazio per muoversi (' + roomFloor + ' tile)');

  // --- un solo varco, a sud ---
  let openings = 0;
  for (let x = 0; x < m.w; x++) if (isFloor(x, V.room.y1 + 1)) openings++;
  assert(openings === V.gap.x1 - V.gap.x0 + 1, 'il varco a sud e largo ' + openings + ' tile');
  for (let y = V.room.y0; y <= V.room.y1; y++) { if (isFloor(V.room.x0 - 1, y) || isFloor(V.room.x1 + 1, y)) openings += 10; }
  for (let x = V.room.x0; x <= V.room.x1; x++) { if (isFloor(x, V.room.y0 - 1)) openings += 10; }
  assert(openings < 10, 'nessun altro passaggio: pareti chiuse su nord, est e ovest');

  // --- il portale sta nel corridoio, e ci si arriva a piedi dallo spawn ---
  assert(at(m.exit.x, m.exit.y) === C.T_EXIT, 'il portale EXIT e sulla griglia');
  assert(m.exit.y > V.room.y1, 'il portale sta nel corridoio a sud, fuori dalla sala');
  const seen = new Set(), q = [[(m.spawn.x / T) | 0, (m.spawn.y / T) | 0]];
  while (q.length) { const [x, y] = q.pop(); const k = y * m.w + x;
    if (seen.has(k) || x < 0 || y < 0 || x >= m.w || y >= m.h || !isFloor(x, y)) continue;
    seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  assert(seen.has(m.exit.y * m.w + m.exit.x), 'dallo spawn si raggiunge il portale a piedi');

  // --- falo' al centro, cinque banchetti, cinque mercanti ---
  assert(!!m.village.fire, 'il falo e esposto nella mappa (e la sorgente di luce)');
  const fireT = { x: (m.village.fire.x / T) | 0, y: (m.village.fire.y / T) | 0 };
  assert(fireT.x === V.fire.x && fireT.y === V.fire.y, 'il falo e al centro della sala');
  const stalls = m.props.filter(p => p.type === 'stall');
  assert(stalls.length === 5, 'ci sono 5 banchetti (' + stalls.length + ')');
  assert(new Set(stalls.map(s => s.kind)).size === 5, 'i 5 banchetti sono tutti diversi');
  assert(stalls.every(s => s.s > 1.4), 'i banchetti sono piu grandi dei mercanti (scala ' + stalls[0].s + ')');
  assert(m.village.npcs.length === 5, 'ci sono 5 mercanti');
  assert(m.village.npcs.filter(n => n.shop).length === 1, 'uno solo vende: il fabbro');
  // v1.72 — hanno aperto Erborista e Banditore: restano chiusi Cartomante e Ostessa.
  assert(m.village.npcs.filter(n => n.soon).length === 0, 'in v1.74 il villaggio e completo: nessuna bottega chiusa');
  assert(m.village.npcs.filter(n => n.crd).length === 1, 'la Cartomante ha aperto in v1.73');
  assert(m.village.npcs.filter(n => n.inn).length === 1, "e l'Ostessa in v1.74");
  assert(m.village.npcs.filter(n => n.bnd).length === 1, 'e il Banditore ha aperto in v1.72');
  assert(m.village.npcs.filter(n => n.pot).length === 1, "e l'Erborista e aperto");
  // ogni mercante sta DIETRO il suo banco: piu' lontano dal fuoco
  let behind = true;
  for (let i = 0; i < stalls.length; i++) { const n = m.village.npcs[i];
    const ds = MU.dist(stalls[i].x, stalls[i].y, m.village.fire.x, m.village.fire.y);
    const dn = MU.dist(n.x, n.y, m.village.fire.x, m.village.fire.y);
    if (dn <= ds + 60) behind = false; }
  assert(behind, 'ogni mercante sta dietro al suo banco, non sopra');

  // --- niente mercanti o arredo dentro la roccia ---
  const inWall = (o) => at((o.x / T) | 0, (o.y / T) | 0) === C.T_WALL;
  assert(!m.village.npcs.some(inWall), 'nessun mercante dentro la roccia');
  assert(!m.props.some(inWall), 'nessun arredo dentro la roccia');

  // --- la sala e BUIA: la luce la fa il falo ---
  assert(!m.lit, 'la sala non e illuminata a giorno: resta al buio');
  assert(m.market === 1, 'la mappa si dichiara mercato');
  assert(m.enemySpawns.length === 0 && m.crateSpawns.length === 0, 'niente spawn nemici ne casse');

  // --- la stanza vera del Room coincide, e nessuno nasce nella roccia ---
  const room = new Room('v157'); room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  room.wave = 3; room.phase = C.PHASE_SHOP; room.shopReady('b', 'market'); room._afterShop();
  assert(room.map.village && room.map.village.npcs.length === 5, 'la stanza mercato usa la sala');
  assert(room.monsters.length === 0 && room.crates.length === 0, 'nella sala non ci sono nemici ne casse');
  assert(MU.dist(room.gearMerchant.x, room.gearMerchant.y, room.map.village.smith.x, room.map.village.smith.y) < 1, 'il mercante e agganciato al fabbro');
  let inside = false;
  for (let i = 0; i < 40; i++) { room.newMap(1000 + i, 3, true); for (const q2 of room.players.values()) if (room.isWallAt(q2.x, q2.y)) inside = true; }
  assert(!inside, 'nessun giocatore compare dentro la roccia');
  ok('novita v1.57 verificate');
}

function testV158() {
  console.log('\n[TEST 29] Novita v1.58 — Fungo immobile, Sfera d\'Ossa rotolante, Melma che si divide, tetto al Beholder');
  const Mon = require('../shared/monsters.js');
  const dt = 1 / C.TICK_RATE;

  // ---------- FUNGO SPORIFERO: non si muove, nega il terreno ----------
  const fg = Mon.MONSTERS.spore_fungus;
  assert(!!fg && fg.ai === 'sentry' && fg.immobile, 'il Fungo esiste, e immobile e usa la IA sentry');
  assert(fg.speed === 0, 'velocita zero: niente camminata da animare');
  const r1 = new Room('v158a'); const p1 = r1.addPlayer('b', { send() {} }, 'B', 'ladro'); r1.startGame();
  r1.pending = 0; r1.waveList = []; p1.hp = 9999; p1.maxHp = 9999;
  // v1.61.1 — la posizione va cercata LIBERA: a offset fisso il fungo puo nascere dentro un muro, e li
  // il server lo sposta con _unstuck (giustamente). Il test diventava intermittente per colpa della mappa.
  let fpos = { x: p1.x + 200, y: p1.y };
  for (let a = 0; a < 32 && r1.isWallAt(fpos.x, fpos.y); a++) {
    const an = a * 0.7, rr = 140 + (a % 4) * 40;
    fpos = { x: p1.x + Math.cos(an) * rr, y: p1.y + Math.sin(an) * rr };
  }
  assert(!r1.isWallAt(fpos.x, fpos.y), 'trovato un punto libero dove piantare il Fungo');
  const f = r1.spawnMonster('spore_fungus', fpos.x, fpos.y, { scaling: Waves.scaling(6, 1) });
  const fx = f.x, fy = f.y;
  r1.zones.length = 0;
  for (let i = 0; i < C.TICK_RATE * 5 && !r1.zones.length; i++) r1.update(dt);
  assert(Math.abs(f.x - fx) < 1 && Math.abs(f.y - fy) < 1, 'il Fungo non si sposta di un pixel');
  assert(r1.zones.length > 0, 'vedendo il giocatore semina zone di spore');
  assert(r1.zones.every(z => z.r > 0 && z.dmg > 0), 'le zone hanno raggio e danno');
  // il danno arriva solo dopo il telegrafo
  const z = r1.zones[0]; assert(z.t > 0, 'la zona e telegrafata: fa danno dopo un ritardo');

  // ---------- SFERA D'OSSA: carica, rotola, rimbalza ----------
  const br = Mon.MONSTERS.bone_roller;
  assert(!!br && br.ai === 'roller' && br.rollSpeed > 1, 'la Sfera d\'Ossa esiste e usa la IA roller');
  const r2 = new Room('v158b'); const p2 = r2.addPlayer('b', { send() {} }, 'B', 'ladro'); r2.startGame();
  r2.pending = 0; r2.waveList = []; p2.hp = 9999; p2.maxHp = 9999;
  const sp158 = losSpot(r2, p2, 260);
  const b2 = r2.spawnMonster('bone_roller', sp158.x, sp158.y, { scaling: Waves.scaling(8, 1) });
  r2.events.length = 0;
  let winded = false, rolled = false, moved = 0; let bx = b2.x, by = b2.y;
  for (let i = 0; i < C.TICK_RATE * 6; i++) { r2.update(dt);
    for (const e of r2.events) { if (e.t === 'roll_wind') winded = true; if (e.t === 'roll_go') rolled = true; }
    moved = Math.max(moved, MU.dist(b2.x, b2.y, bx, by)); }
  assert(winded, 'si carica prima di partire (telegrafo roll_wind)');
  assert(rolled, 'poi parte in carica (roll_go)');
  assert(moved > 40, 'durante la carica percorre distanza (' + Math.round(moved) + 'px)');
  // v1.64 — il giocatore va tenuto ADDOSSO alla sfera a ogni tick: la sfera sta rotolando, e in 20 tick
  // poteva allontanarsi dal punto dove il test lo aveva messo una volta sola. Era una flakiness rara.
  const hp0 = p2.hp; b2.atkT = 0;
  for (let i = 0; i < 40 && p2.hp >= hp0; i++) { p2.x = b2.x + 8; p2.y = b2.y; r2.update(dt); }
  assert(p2.hp < hp0, 'travolge il giocatore che colpisce');

  // ---------- MELMA CHE SI DIVIDE ----------
  assert(Mon.MONSTERS.slime.splitInto === 'slime_mini', 'la Melma si divide in melme minori');
  assert(!Mon.MONSTERS.slime_mini.splitInto, 'la Melma Minore NON si divide a sua volta (niente catena infinita)');
  const r3 = new Room('v158c'); const p3 = r3.addPlayer('b', { send() {} }, 'B', 'ladro'); r3.startGame();
  r3.pending = 0; r3.waveList = []; r3.monsters.length = 0;
  const sp158b = losSpot(r3, p3, 120);
  const sl = r3.spawnMonster('slime', sp158b.x, sp158b.y, { scaling: Waves.scaling(4, 1) });
  r3.killMonster(sl, p3);
  const minis = r3.monsters.filter(x => x.type === 'slime_mini' && !x.dead);
  assert(minis.length === (Mon.MONSTERS.slime.splitCount || 2), 'alla morte lascia ' + minis.length + ' melme minori');
  assert(minis.every(x => x.minion), 'le minori sono marcate come minion');
  const before = r3.monsters.filter(x => !x.dead).length;
  r3.killMonster(minis[0], p3);
  assert(r3.monsters.filter(x => !x.dead).length < before, 'uccidendo una minore non ne nascono altre');

  // ---------- BEHOLDER: tardi e col tetto ----------
  const oc = Mon.MONSTERS.occhio;
  assert(oc.maxAlive === 8, 'il Beholder ha un tetto di 8 presenze contemporanee');
  assert(!Waves.poolForWave(9).some(x => x.id === 'occhio'), 'niente Beholder prima dell ondata 10');
  assert(Waves.poolForWave(10).some(x => x.id === 'occhio'), 'Beholder nel pool dall ondata 10');
  const r4 = new Room('v158d'); r4.addPlayer('b', { send() {} }, 'B', 'ladro'); r4.startGame();
  r4.pending = 0; r4.waveList = []; r4.monsters.length = 0;
  for (let i = 0; i < 12; i++) { const t = r4._capType('occhio'); const pos = r4.randomSpawnPos();
    r4.spawnMonster(t, pos.x, pos.y, { scaling: Waves.scaling(15, 1) }); }
  const alive = r4.monsters.filter(x => x.type === 'occhio' && !x.dead).length;
  assert(alive <= oc.maxAlive, 'oltre il tetto non ne compaiono altri (' + alive + ' vivi su 12 tentativi)');
  assert(r4.monsters.filter(x => x.type === 'skeleton').length > 0, 'oltre il tetto si ripiega sullo sciame base');

  // ---------- la rampa resta monotona e ordinata ----------
  const at2 = w => Waves.poolForWave(w).map(x => x.id);
  assert(!at2(4).includes('spore_fungus') && at2(5).includes('spore_fungus'), 'Fungo introdotto all ondata 5');
  assert(!at2(6).includes('bone_roller') && at2(7).includes('bone_roller'), 'Sfera d\'Ossa introdotta all ondata 7');
  let mono2 = true; for (let w = 1; w < 20; w++) { const a = at2(w), b = at2(w + 1); if (!a.every(id => b.includes(id))) mono2 = false; }
  assert(mono2, 'la rampa resta monotona con i nemici nuovi');
  // niente NaN con tutti i nuovi in campo
  const r5 = new Room('v158e'); const p5 = r5.addPlayer('b', { send() {} }, 'B', 'ladro'); r5.startGame();
  r5.pending = 0; r5.waveList = [];
  for (const id of ['spore_fungus', 'bone_roller', 'slime', 'occhio']) { const pos = r5.randomSpawnPos(); r5.spawnMonster(id, pos.x, pos.y, { scaling: Waves.scaling(15, 1) }); }
  for (let i = 0; i < C.TICK_RATE * 8; i++) { r5.setInput('b', bot(r5, p5)); r5.update(dt); if (hasNaN(r5)) break; }
  assert(hasNaN(r5) === null, 'nessun NaN con i nemici nuovi in campo');
  ok('novita v1.58 verificate');
}
function testV159() {
  console.log('\n[TEST 30] Novita v1.59 — Beholder meno statico: telegrafo del cambio sguardo esposto al client');
  const dt = 1 / C.TICK_RATE, Mon = require('../shared/monsters.js');
  const room = new Room('v159'); const pl = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  room.pending = 0; room.waveList = []; pl.hp = 9999; pl.maxHp = 9999;
  const sp = room.map.spawn;
  const m = room.spawnMonster('occhio', sp.x + 80, sp.y, { scaling: Waves.scaling(15, 1) });
  pl.x = sp.x; pl.y = sp.y; m.facing = 0;
  room.update(dt);
  let snap = room.snapshot(); let mo = snap.mon.find(x => x.t === 'occhio');
  assert(mo && typeof mo.gt === 'number', 'lo snapshot espone gt (quanto manca al cambio di sguardo)');
  assert(mo.gt >= 0 && mo.gt <= 1, 'gt e normalizzato fra 0 e 1 (' + mo.gt + ')');
  const g0 = mo.gt;
  for (let i = 0; i < C.TICK_RATE; i++) room.update(dt);       // un secondo
  snap = room.snapshot(); mo = snap.mon.find(x => x.t === 'occhio');
  assert(mo.gt < g0, 'gt cala col passare del tempo: il client puo anticipare il cambio (' + g0 + ' -> ' + mo.gt + ')');
  // arrivato a zero il tipo di sguardo cambia e gt riparte
  const k0 = m.gazeKind; let changed = false, reset = false;
  for (let i = 0; i < C.TICK_RATE * (Mon.MONSTERS.occhio.gazeCycle + 1); i++) { room.update(dt);
    if (m.gazeKind !== k0) { changed = true; const s2 = room.snapshot().mon.find(x => x.t === 'occhio'); if (s2 && s2.gt > 0.5) reset = true; break; } }
  assert(changed, 'il tipo di sguardo cambia a fine ciclo');
  assert(reset, 'e gt riparte da capo dopo il cambio');
  for (let i = 0; i < C.TICK_RATE * 4; i++) { room.setInput('b', bot(room, pl)); room.update(dt); if (hasNaN(room)) break; }
  assert(hasNaN(room) === null, 'nessun NaN col Beholder aggiornato');
  ok('novita v1.59 verificate');
}
function testV164() {
  console.log('\n[TEST 35] Novita v1.64 — tetto ai nemici vivi (la coda non perde nessuno)');
  const dt = 1 / C.TICK_RATE;
  assert(C.MAX_ALIVE > 0, 'esiste un tetto ai nemici vivi (' + C.MAX_ALIVE + ')');

  // ondata pesante: 6 giocatori all ondata 18. Il totale da uccidere deve restare quello previsto,
  // ma non devono stare tutti in campo insieme.
  const room = new Room('v164'); const pls = [];
  for (let i = 0; i < 6; i++) pls.push(room.addPlayer('p' + i, { send() {} }, 'P' + i, 'ladro'));
  room.startGame();
  room.wave = 18; room.nextWave();
  const totale = room.pending + room.monsters.length;
  assert(totale > C.MAX_ALIVE, 'l ondata scelta e piu grande del tetto (' + totale + ' nemici previsti contro un tetto di ' + C.MAX_ALIVE + ')');

  // i giocatori non fanno nulla: i mostri si accumulano finche il tetto non li ferma
  let picco = 0;
  for (let i = 0; i < C.TICK_RATE * 90; i++) {
    for (const p of pls) { p.hp = 1e9; room.setInput(p.id, { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false }); }
    room.update(dt);
    // conta solo i VIVI: killMonster marca .dead e la rimozione dall array avviene al tick dopo, quindi
    // un mostro che si divide puo far vedere per un istante il proprio posto occupato due volte.
    picco = Math.max(picco, room.monsters.filter(x => !x.dead).length);
    if (room.phase !== C.PHASE_COMBAT && room.phase !== C.PHASE_BOSS) break;
  }
  assert(picco <= C.MAX_ALIVE, 'in campo non se ne vedono mai piu di ' + C.MAX_ALIVE + ' (picco ' + picco + ')');
  assert(room.pending > 0, 'i nemici in eccesso NON spariscono: restano in coda (' + room.pending + ' ancora da entrare)');
  assert(room.monsters.length + room.pending >= totale - 2, 'il totale da uccidere e rimasto quello: ' + (room.monsters.length + room.pending) + ' su ' + totale);

  // uccidendone qualcuno, la coda riprende a scorrere
  const codaPrima = room.pending;
  // vanno uccisi 12 mostri DISTINTI e ancora vivi: killMonster marca .dead ma la rimozione dall array
  // avviene dopo, quindi prendere sempre monsters[0] significherebbe ammazzare dodici volte lo stesso.
  for (const vittima of room.monsters.filter(x => !x.dead).slice(0, 12)) room.killMonster(vittima, null);
  for (let i = 0; i < C.TICK_RATE * 25; i++) {
    for (const p of pls) { p.hp = 1e9; room.setInput(p.id, { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false }); }
    room.update(dt);
  }
  assert(room.pending < codaPrima, 'appena si fa spazio la coda riprende a entrare (' + codaPrima + ' -> ' + room.pending + ')');
  assert(room.monsters.filter(x => !x.dead).length <= C.MAX_ALIVE, 'e il tetto continua a valere (' + room.monsters.filter(x => !x.dead).length + ')');
  ok('novita v1.64 verificate');
}
function testV163() {
  console.log('\n[TEST 34] Novita v1.63 — la Faglia consuma chi resta ai margini; casse solo al centro');
  const dt = 1 / C.TICK_RATE;

  // ---------- la geometria del margine ----------
  const r0 = new Room('v163g'); r0.addPlayer('a', { send() {} }, 'A', 'ladro'); r0.startGame();
  const m0 = r0.map, T2 = C.TILE, M = C.EDGE_MARGIN;
  const at = (gx, gy) => r0._edgeDepth(gx * T2 + T2 / 2, gy * T2 + T2 / 2);
  assert(at((m0.w / 2) | 0, (m0.h / 2) | 0) === 0, 'al centro la profondita nel margine e zero');
  assert(at(2, (m0.h / 2) | 0) === M, 'sul bordo dritto la profondita e ' + M);
  assert(at(2, 2) === M * 2, 'in un ANGOLO la profondita raddoppia (' + at(2, 2) + '): la faglia morde il doppio piu in fretta');
  assert(at(2 + M, (m0.h / 2) | 0) === 0, 'oltre ' + M + ' tessere dal bordo si e fuori dalla fascia');
  let band = 0, tot = 0;
  for (let y = 2; y < m0.h - 2; y++) for (let x = 2; x < m0.w - 2; x++) { tot++; if (at(x, y) > 0) band++; }
  assert(band / tot > 0.15 && band / tot < 0.45, 'la fascia copre una quota sensata della mappa (' + (band / tot * 100).toFixed(0) + '%)');

  // ---------- grazia, poi drenaggio crescente ----------
  const room = new Room('v163a'); const pl = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  // Svuotare del tutto i mostri chiude l'ondata: la stanza passa a 'shop' e li' CURA i giocatori, quindi il
  // drenaggio veniva rimborsato a ogni tick e il test misurava zero. Si tiene in campo UN Fungo Sporifero al
  // centro: e' immobile e la sua vista non arriva al bordo, quindi la stanza resta in combattimento senza
  // che nessuno interferisca con la misura.
  room.pending = 0; room.waveList = []; room.monsters.length = 0;
  const ccx = ((room.map.w / 2) | 0) * C.TILE + C.TILE / 2, ccy = ((room.map.h / 2) | 0) * C.TILE + C.TILE / 2;
  const fung = room.spawnMonster('spore_fungus', ccx, ccy, { scaling: Waves.scaling(1, 1) });
  let spot = null;
  for (let y = 2; y < room.map.h - 2 && !spot; y++) for (let x = 2; x < room.map.w - 2; x++)
    if (room.map.grid[y * room.map.w + x] === C.T_FLOOR && room._edgeDepth(x * T2 + T2 / 2, y * T2 + T2 / 2) === C.EDGE_MARGIN * 2) { spot = { x, y }; break; }
  if (!spot) for (let y = 2; y < room.map.h - 2 && !spot; y++) for (let x = 2; x < room.map.w - 2; x++)
    if (room.map.grid[y * room.map.w + x] === C.T_FLOOR && room._edgeDepth(x * T2 + T2 / 2, y * T2 + T2 / 2) > 0) { spot = { x, y }; break; }
  assert(!!spot, 'trovata una casella nel margine per la prova');
  const px = spot.x * T2 + T2 / 2, py = spot.y * T2 + T2 / 2;
  // il Fungo va tenuto VIVO a forza: puo' essere nato dentro una pozza (v1.62) e morirci in 4 secondi.
  // Se muore l'ondata si chiude, la stanza passa a 'shop' e li' CURA i giocatori — e la misura salta.
  // Due cose vanno neutralizzate perche' la misura riguardi SOLO la faglia:
  //  - il Fungo va tenuto vivo (puo' essere nato dentro una pozza v1.62 e morirci in 4 secondi; se muore
  //    l'ondata si chiude, la stanza passa a 'shop' e li' CURA i giocatori);
  //  - il RECUPERO ANTI-STALLO (v1.43): se per 6 secondi il numero di mostri non cala, la stanza li
  //    teletrasporta tutti a 240px da un giocatore. Con un solo Fungo fermo scatta sempre, e il Fungo
  //    si materializzava addosso al punto "al sicuro" seminandoci le spore.
  const pin = () => { pl.x = px; pl.y = py; fung.hp = fung.maxHp; room._stallT = 0; };
  pl.hp = 500; pl.maxHp = 500; pl.buffs = {};

  // 1 secondo dentro la fascia: siamo dentro la grazia, nessun danno
  let h = pl.hp;
  for (let i = 0; i < C.TICK_RATE * 1; i++) { pin(); room.setInput('b', { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false }); room.update(dt); }
  assert(pl.hp === h, 'il primo secondo nel margine NON fa danno: e la finestra di grazia');
  assert((pl.edgeLv || 0) > 0, 'ma la carica sta gia salendo (edgeLv ' + (pl.edgeLv || 0).toFixed(2) + '): il giocatore e avvisato prima di essere punito');

  // altri 4 secondi: ora deve drenare, e l evento deve essere partito una volta sola
  room.events.length = 0;
  for (let i = 0; i < C.TICK_RATE * 4; i++) { pin(); room.update(dt); }
  const lost1 = h - pl.hp;
  assert(lost1 > 0, 'passata la grazia il drenaggio comincia (persi ' + lost1 + ' PV)');
  const warn = room.events.filter(e => e.t === 'rift_edge');
  assert(warn.length === 1, 'l avviso rift_edge parte UNA volta sola, non a ogni tick (' + warn.length + ')');
  assert(warn[0].who === 'b', 'l avviso dice a CHI sta capitando');

  // il drenaggio CRESCE: gli stessi 4 secondi, piu avanti, tolgono di piu
  h = pl.hp;
  for (let i = 0; i < C.TICK_RATE * 4; i++) { pin(); room.update(dt); }
  const lost2 = h - pl.hp;
  assert(lost2 > lost1, 'il drenaggio CRESCE col tempo (' + lost1 + ' PV poi ' + lost2 + ' PV): indugiare costa sempre di piu');

  // ---------- uscire lo riassorbe ----------
  // il punto "al sicuro" non puo' essere il centro: li' c'e' il Fungo che tiene viva l'ondata, e le sue
  // spore falserebbero la misura. Serve una casella FUORI dalla fascia e fuori dalla sua vista (340px).
  let safe = null, bestD = -1;
  for (let y = 2; y < room.map.h - 2; y++) for (let x = 2; x < room.map.w - 2; x++) {
    if (room.map.grid[y * room.map.w + x] !== C.T_FLOOR) continue;
    if (room._edgeDepth(x * T2 + T2 / 2, y * T2 + T2 / 2) !== 0) continue;
    // la distanza va misurata dalla posizione REALE del fungo: se il centro era roccia, spawnMonster
    // lo ha spostato, e misurare dal centro teorico puo' scegliere un punto che il fungo vede benissimo.
    const d = Math.hypot(x * T2 + T2 / 2 - fung.x, y * T2 + T2 / 2 - fung.y);
    if (d > bestD) { bestD = d; safe = { x: x * T2 + T2 / 2, y: y * T2 + T2 / 2 }; }
  }
  assert(!!safe && bestD > 500, 'trovato un punto al sicuro fuori dalla fascia e fuori dalla vista del Fungo (' + bestD.toFixed(0) + 'px)');
  const cx = safe.x, cy = safe.y;
  const before = pl.edgeT;
  for (let i = 0; i < C.TICK_RATE * 3; i++) { pl.x = cx; pl.y = cy; fung.hp = fung.maxHp; room._stallT = 0; room.update(dt); }
  assert(pl.edgeT < before, 'tornando verso il centro la carica si riassorbe (' + before.toFixed(1) + 's -> ' + pl.edgeT.toFixed(1) + 's)');
  h = pl.hp;
  for (let i = 0; i < C.TICK_RATE * 5; i++) { pl.x = cx; pl.y = cy; fung.hp = fung.maxHp; room._stallT = 0; room.update(dt); }
  assert(pl.hp === h, 'al centro la faglia non tocca il giocatore [hp ' + pl.hp + ' era ' + h + ' fase ' + room.phase + ' mostri ' + room.monsters.length + ' edgeT ' + (pl.edgeT || 0).toFixed(2) + ' zone ' + room.zones.length + ' distFungo ' + Math.hypot(cx - fung.x, cy - fung.y).toFixed(0) + ']');

  // attraversare il margine di corsa non deve costare nulla
  pl.edgeT = 0; pl.hp = 500; h = pl.hp;
  for (let k = 0; k < 6; k++) {
    for (let i = 0; i < C.TICK_RATE * 1; i++) { pin(); room.update(dt); }
    for (let i = 0; i < C.TICK_RATE * 2; i++) { pl.x = cx; pl.y = cy; fung.hp = fung.maxHp; room._stallT = 0; room.update(dt); }
  }
  assert(pl.hp === h, 'passare dal margine e tornare indietro non costa niente: e l ACCAMPARSI a costare [hp ' + pl.hp + ' era ' + h + ' fase ' + room.phase + ' mostri ' + room.monsters.length + ' edgeT ' + (pl.edgeT || 0).toFixed(2) + ' depthSpot ' + room._edgeDepth(px, py) + ']');

  // ---------- al mercato la faglia non esiste ----------
  const r3 = new Room('v163m'); const p3 = r3.addPlayer('c', { send() {} }, 'C', 'ladro'); r3.startGame();
  r3.newMap(99, 3, true); r3.phase = C.PHASE_MARKET;
  let mspot = null;
  for (let y = 2; y < r3.map.h - 2 && !mspot; y++) for (let x = 2; x < r3.map.w - 2; x++)
    if (r3.map.grid[y * r3.map.w + x] === C.T_FLOOR && r3._edgeDepth(x * T2 + T2 / 2, y * T2 + T2 / 2) > 0) { mspot = { x, y }; break; }
  if (mspot) {
    p3.hp = 300; const mh = p3.hp;
    for (let i = 0; i < C.TICK_RATE * 8; i++) { p3.x = mspot.x * T2 + T2 / 2; p3.y = mspot.y * T2 + T2 / 2; r3.update(dt); }
    assert(p3.hp === mh, 'nella sala del MERCATO la faglia e spenta (la sala e quasi tutta margine)');
  } else assert(true, 'sala del mercato senza margine calpestabile');

  // ---------- lo snapshot porta la carica al client ----------
  // v1.68 — `eg` viene omesso dallo snapshot quando vale 0 (il client lo rimette a 0): la prova non e' piu'
  // "il campo esiste sempre" ma "quando la carica c'e', arriva".
  const plEg = room.players.get('b'); plEg.edgeLv = 0.42;
  const snap = room.snapshot();
  assert(snap.players[0].eg === 0.42, 'lo snapshot espone la carica della faglia (eg) per la vignetta');
  plEg.edgeLv = 0;
  assert(room.snapshot().players[0].eg === undefined, 'a carica zero il campo non viene nemmeno mandato');

  // ---------- CASSE E ARMI SOLO AL CENTRO ----------
  let fuori = 0, mappe = 0, minCelle = 1e9;
  for (let k = 0; k < 120; k++) {
    const mm = MapGen.generate(k * 104729 + 7, 1 + (k % 20));
    mappe++; minCelle = Math.min(minCelle, mm.crateSpawns.length);
    const lim = Math.min(mm.w, mm.h) * 0.36 + 1;
    for (const c of mm.crateSpawns) if (Math.hypot(c.x / mm.tile - mm.w / 2, c.y / mm.tile - mm.h / 2) > lim) fuori++;
  }
  assert(fuori === 0, 'casse e armi nascono solo nella zona centrale (fuori: ' + fuori + ' su ' + mappe + ' mappe)');
  assert(minCelle > 20, 'restano abbastanza posizioni centrali (minimo ' + minCelle + ')');
  ok('novita v1.63 verificate');
}
function testV162() {
  console.log('\n[TEST 33] Novita v1.62 — pozze di pericolo, strato ambientale, partenza e uscita variabili');
  const PF = require('../shared/pathfinding.js');
  const N = 240;
  const byTheme = {}; const spawns = new Set(), exits = new Set();
  let hazTot = 0, hazNearWall = 0, hazOnExit = 0, hazNearStart = 0, propTot = 0, offBag = 0, unreach = 0, startInHaz = 0;
  let farOK = 0, enemyClose = 0;

  for (let k = 0; k < N; k++) {
    const m = MapGen.generate(k * 7919 + 13, 1 + (k % 20));
    const th = m.theme; const a = byTheme[th.id] = byTheme[th.id] || { n: 0, haz: 0, name: th.name };
    a.n++;
    const sgx = (m.spawn.x / m.tile) | 0, sgy = (m.spawn.y / m.tile) | 0;
    spawns.add(sgx + ',' + sgy); if (m.exit) exits.add(m.exit.x + ',' + m.exit.y);
    if (m.grid[sgy * m.w + sgx] === C.T_HAZARD) startInHaz++;

    for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
      if (m.grid[y * m.w + x] !== C.T_HAZARD) continue;
      hazTot++; a.haz++;
      // GARANZIA: mai attaccata a un muro -> si puo' sempre girarle intorno invece di incassare danno
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
        if (m.grid[(y + dy) * m.w + (x + dx)] === C.T_WALL) hazNearWall++;
      if (m.exit && m.exit.x === x && m.exit.y === y) hazOnExit++;
      if (Math.hypot(x - sgx, y - sgy) <= 7) hazNearStart++;
    }

    propTot += m.props.length;
    const bag = th.propMix || [];
    if (bag.length) for (const p of m.props) { /* le feature usano tipi fuori dal bag: conta solo che il bag sia USATO */ }
    if (bag.length && !m.props.some(p => bag.indexOf(p.type) >= 0)) offBag++;

    // la mappa resta percorribile DALLA NUOVA PARTENZA fino all uscita
    const d = PF.build(m.grid, m.w, m.h, [{ gx: sgx, gy: sgy }]);
    if (!m.exit || d[m.exit.y * m.w + m.exit.x] < 0) unreach++;
    if (m.exit && Math.hypot(m.exit.x - sgx, m.exit.y - sgy) > Math.min(m.w, m.h) * 0.5) farOK++;
    for (const sp of m.enemySpawns) if (Math.hypot(sp.x - sgx, sp.y - sgy) < 8) { enemyClose++; break; }
  }

  // --- POZZE (T_HAZARD): il tile era gia gestito da server e renderer, non lo generava nessuno ---
  assert(hazTot > 0, 'le mappe generano pozze di pericolo (' + hazTot + ' tessere su ' + N + ' mappe)');
  assert(hazNearWall === 0, 'NESSUNA pozza tocca un muro: si puo' + String.fromCharCode(39) + ' sempre aggirare (violazioni: ' + hazNearWall + ')');
  assert(hazOnExit === 0, 'nessuna pozza sopra il portale di uscita');
  assert(hazNearStart === 0, 'nessuna pozza entro 7 tessere dalla partenza');
  assert(startInHaz === 0, 'i giocatori non nascono mai dentro una pozza');
  // hazMul: la lava deve averne molte piu del ghiaccio
  const lava = byTheme.lava, ice = byTheme.ice;
  if (lava && ice) assert((lava.haz / lava.n) > (ice.haz / ice.n) * 1.4,
    'theme.hazMul conta davvero: lava ' + (lava.haz / lava.n).toFixed(1) + ' tessere/mappa contro ghiaccio ' + (ice.haz / ice.n).toFixed(1));
  for (const id of Object.keys(byTheme)) assert(byTheme[id].haz > 0, 'il tema ' + id + ' genera pozze');

  // --- STRATO AMBIENTALE (theme.propMix) ---
  assert(propTot / N > 30, 'oggetti per mappa oltre i 30 (media ' + (propTot / N).toFixed(1) + ', prima ~30 di sole feature)');
  assert(offBag === 0, 'ogni mappa usa il sacchetto di oggetti del suo tema (theme.propMix)');

  // --- PARTENZA E USCITA VARIABILI ---
  assert(spawns.size > 10, 'la partenza non e piu una costante: ' + spawns.size + ' posizioni distinte su ' + N + ' mappe');
  assert(exits.size > N * 0.4, 'anche l uscita varia: ' + exits.size + ' posizioni distinte su ' + N);
  assert(unreach === 0, 'l uscita resta raggiungibile dalla nuova partenza in tutte le mappe');
  assert(farOK > N * 0.85, 'l uscita resta comunque lontana: la traversata da fare non e sparita (' + farOK + '/' + N + ')');
  assert(enemyClose === 0, 'nessun punto di spawn nemici a ridosso della partenza (le distanze si misurano da li)');

  // --- NOME DELLA ZONA: era scritto nei temi e non lo vedeva nessuno ---
  for (const th of MapGen.THEMES) assert(!!th.name && th.name.length > 3, 'il tema ' + th.id + ' ha un nome da mostrare ("' + th.name + '")');
  assert(!!MapGen.VILLAGE_THEME.name, 'anche il mercato ha un nome ("' + MapGen.VILLAGE_THEME.name + '")');

  // --- il pericolo del terreno FUNZIONA davvero in partita ---
  const dt = 1 / C.TICK_RATE;
  let room = null, pl = null, hc = null;
  for (let attempt = 0; attempt < 12 && !hc; attempt++) {
    room = new Room('v162_' + attempt); pl = room.addPlayer('h', { send() {} }, 'H', 'ladro'); room.startGame();
    for (let y = 2; y < room.map.h - 2 && !hc; y++) for (let x = 2; x < room.map.w - 2; x++)
      if (room.map.grid[y * room.map.w + x] === C.T_HAZARD) { hc = { x, y }; break; }
  }
  if (hc) {
    pl.x = hc.x * C.TILE + C.TILE / 2; pl.y = hc.y * C.TILE + C.TILE / 2;
    pl.hp = 200; pl.buffs = {}; const h0 = pl.hp;
    for (let i = 0; i < C.TICK_RATE * 2 && pl.hp >= h0; i++) { pl.x = hc.x * C.TILE + C.TILE / 2; pl.y = hc.y * C.TILE + C.TILE / 2; room.update(dt); }
    assert(pl.hp < h0, 'stare in una pozza fa danno al giocatore');
    const mo = room.spawnMonster('skeleton', pl.x, pl.y, { scaling: Waves.scaling(1, 1) });
    const m0 = mo.hp;
    for (let i = 0; i < C.TICK_RATE * 2 && mo.hp >= m0 && !mo.dead; i++) { mo.x = hc.x * C.TILE + C.TILE / 2; mo.y = hc.y * C.TILE + C.TILE / 2; room.update(dt); }
    assert(mo.hp < m0 || mo.dead, 'e fa danno anche ai mostri: la pozza e un alleato, non solo una trappola');
  } else { assert(false, 'trovata almeno una pozza nella mappa di prova'); }
  ok('novita v1.62 verificate');
}
function testV161() {
  console.log('\n[TEST 32] Novita v1.61 — Nugolo di Pipistrelli (sciame ondeggiante) e Fuoco Fatuo (attraversa i muri)');
  const Mon = require('../shared/monsters.js');
  const bs = Mon.MONSTERS.bat_swarm, wp = Mon.MONSTERS.wisp;
  const dt = 1 / C.TICK_RATE;

  // --- definizioni ---
  assert(bs && bs.ai === 'flock' && bs.bats && bs.swarmN >= 6, 'Nugolo: IA flock, reso come sciame di ' + (bs ? bs.swarmN : 0) + ' sagome');
  assert(wp && wp.ai === 'drifter' && wp.phasing === true, 'Fuoco Fatuo: IA drifter e attraversa i muri (phasing)');
  assert(!bs.sheet && !bs.front && !wp.sheet, 'nessuno dei due usa spritesheet o billboard: solo vettoriale');
  assert(bs.hp < 100 && bs.speed > 150, 'il Nugolo e fragile ma veloce (' + bs.hp + ' PV, ' + bs.speed + ' vel)');
  assert(wp.speed < 90 && wp.leech > 0, 'il Fatuo e lento ma drena vita (leech ' + wp.leech + ')');
  assert(Mon.ORDER.indexOf('bat_swarm') >= 0 && Mon.ORDER.indexOf('wisp') >= 0, 'entrambi presenti nel ROSTER (ORDER)');

  // --- comparsa (v1.61.1): il Nugolo dalla 6, il Fuoco Fatuo dalla 8 ---
  // Il Nugolo sta prima della Sfera d'Ossa: entrambi insegnano a mirare dove il nemico SARA, ma il
  // Nugolo lo chiede col tiro (guidare) e la Sfera coi piedi (schivare di lato).
  // Il Fuoco Fatuo sta dopo, perche' toglie una risposta che a quel punto il giocatore ha gia imparato:
  // mettersi al riparo. Arrivare prima sarebbe una regola tolta prima di averla insegnata.
  const at = w => Waves.poolForWave(w).map(x => x.id);
  assert(!at(5).includes('bat_swarm') && at(6).includes('bat_swarm'), 'il Nugolo entra dall ondata 6');
  assert(!at(7).includes('wisp') && at(8).includes('wisp'), 'il Fuoco Fatuo entra dall ondata 8');
  assert(!at(1).includes('bat_swarm') && !at(1).includes('wisp'), 'nessuno dei due e piu nell ondata 1');
  const wBat = Waves.poolForWave(6).find(x => x.id === 'bat_swarm').weight;
  const wWisp = Waves.poolForWave(8).find(x => x.id === 'wisp').weight;
  assert(wBat === 10 && wWisp === 8, 'pesi nel pool: Nugolo 10, Fuoco Fatuo 8 (sotto lo sciame base a 40)');
  assert(bs.weight === 0 && wp.weight === 0, 'peso 0 nella def: la comparsa la decide solo poolForWave');

  // --- IL FATUO ATTRAVERSA DAVVERO I MURI ---
  // Un mostro normale messo dentro un muro viene ESPULSO da _unstuck (salto secco).
  // Il fatuo invece deve proseguire di suo, passo dopo passo, e uscire da solo.
  const room = new Room('v161'); const pl = room.addPlayer('a', { send() {} }, 'A', 'ladro'); room.startGame();
  let wx = -1, wy = -1;
  for (let gy = 2; gy < room.map.h - 2 && wx < 0; gy++) for (let gx = 2; gx < room.map.w - 2; gx++)
    if (room.map.grid[gy * room.map.w + gx] === C.T_WALL) { wx = gx; wy = gy; break; }
  assert(wx >= 0, 'trovata una tessera di muro per la prova');
  const wcx = wx * C.TILE + C.TILE / 2, wcy = wy * C.TILE + C.TILE / 2;

  const w = room.spawnMonster('wisp', pl.x + 60, pl.y, { scaling: Waves.scaling(1, 1) });
  w.x = wcx; w.y = wcy;
  const bx0 = w.x, by0 = w.y;
  room.update(dt);
  const jump = Math.hypot(w.x - bx0, w.y - by0);
  // _unstuck riporta il mostro sul CENTRO della tessera libera piu vicina: uno scatto dell ordine della
  // tessera. Il fatuo invece avanza di suo, quindi qui deve muoversi di ben meno di mezza tessera.
  assert(jump < C.TILE * 0.5, 'il fatuo NON viene espulso dal muro (spostamento ' + jump.toFixed(2) + 'px, meno di mezza tessera)');
  assert(room.isWallAt(w.x, w.y), 'dopo un tick e ancora DENTRO la roccia: la sta attraversando, non e stato teletrasportato fuori');
  let out = false;
  for (let i = 0; i < C.TICK_RATE * 8 && !out; i++) { room.update(dt); if (!room.isWallAt(w.x, w.y)) out = true; }
  assert(out, 'il fatuo esce dalla roccia da solo (non ci resta intrappolato)');

  // confronto: uno scheletro nella stessa tessera viene rimesso fuori dal recupero anti-incastro
  const sk = room.spawnMonster('skeleton', pl.x + 60, pl.y, { scaling: Waves.scaling(1, 1) });
  sk.x = wcx; sk.y = wcy;
  let skOut = false;
  for (let i = 0; i < C.TICK_RATE * 3 && !skOut; i++) { room.update(dt); if (!room.isWallAt(sk.x, sk.y)) skOut = true; }
  assert(skOut, 'controprova: un nemico normale nel muro viene comunque rimesso fuori');

  // --- IL FATUO DRENA: danneggia e si cura ---
  const room2 = new Room('v161b'); const p2 = room2.addPlayer('b', { send() {} }, 'B', 'ladro'); room2.startGame();
  const w2 = room2.spawnMonster('wisp', p2.x + 40, p2.y, { scaling: Waves.scaling(1, 1) });
  w2.hp = Math.max(1, Math.round(w2.maxHp * 0.4)); const wh0 = w2.hp;
  p2.hp = 500; const ph0 = p2.hp; w2.atkT = 0; room2.events.length = 0;
  let drained = null;
  for (let i = 0; i < C.TICK_RATE * 3 && !drained; i++) { room2.update(dt); drained = room2.events.find(e => e.t === 'drain'); }
  assert(drained && drained.e === w2.eid, 'il fatuo emette l evento drain (il client disegna le scintille)');
  assert(p2.hp < ph0, 'il drenaggio fa danno al giocatore');
  assert(w2.hp > wh0, 'e il fatuo si cura drenando (' + wh0 + ' -> ' + w2.hp + ' PV)');
  assert(w2.hp <= w2.maxHp, 'la cura non supera i PV massimi');

  // --- IL NUGOLO ONDEGGIA: la traiettoria non e una retta verso il giocatore ---
  const room3 = new Room('v161c'); const p3 = room3.addPlayer('c', { send() {} }, 'C', 'ladro'); room3.startGame();
  const b = room3.spawnMonster('bat_swarm', p3.x + 300, p3.y, { scaling: Waves.scaling(1, 1) });
  let maxLat = 0, sgnPos = false, sgnNeg = false;
  for (let i = 0; i < C.TICK_RATE * 4; i++) {
    room3.update(dt);
    const len = Math.hypot(b.mx, b.my); if (len < 1) continue;
    const dx = p3.x - b.x, dy = p3.y - b.y, dl = Math.hypot(dx, dy) || 1;
    const cross = ((dx / dl) * (b.my / len) - (dy / dl) * (b.mx / len));   // deviazione laterale normalizzata
    if (cross > 0.12) sgnPos = true; if (cross < -0.12) sgnNeg = true;
    maxLat = Math.max(maxLat, Math.abs(cross));
  }
  assert(maxLat > 0.30, 'il nugolo devia lateralmente in modo netto (max ' + maxLat.toFixed(2) + ', il solo jitter arriverebbe a ~0.08)');
  assert(sgnPos && sgnNeg, 'e la deviazione cambia lato: serpentina, non una curva sola');

  // --- il nugolo fa danno a contatto ---
  const room4 = new Room('v161d'); const p4 = room4.addPlayer('d', { send() {} }, 'D', 'ladro'); room4.startGame();
  const b4 = room4.spawnMonster('bat_swarm', p4.x + 30, p4.y, { scaling: Waves.scaling(1, 1) });
  p4.hp = 400; const h4 = p4.hp; b4.atkT = 0;
  for (let i = 0; i < C.TICK_RATE * 3 && p4.hp >= h4; i++) room4.update(dt);
  assert(p4.hp < h4, 'il nugolo morde a contatto');

  // --- tenuta: una manciata di entrambi in campo senza NaN ---
  const room5 = new Room('v161e'); const p5 = room5.addPlayer('e', { send() {} }, 'E', 'ranger'); room5.startGame();
  for (let i = 0; i < 6; i++) room5.spawnMonster(i % 2 ? 'bat_swarm' : 'wisp', p5.x + 120 + i * 30, p5.y + i * 20, { scaling: Waves.scaling(3, 1) });
  for (let i = 0; i < C.TICK_RATE * 10; i++) { room5.setInput('e', bot(room5, p5)); room5.update(dt); if (hasNaN(room5)) break; }
  assert(hasNaN(room5) === null, 'nessun NaN con nugoli e fatui in campo');
  let inside = 0; for (const m of room5.monsters) if (m.x < 0 || m.y < 0 || m.x > room5.map.w * C.TILE || m.y > room5.map.h * C.TILE) inside++;
  assert(inside === 0, 'nessun fatuo e uscito dalla griglia attraversando il bordo');

  ok('novita v1.61 verificate');
}
function testV160() {
  console.log('\n[TEST 31] Novita v1.60 — Troll: ancora, impatto e passo allineati; Beholder dall ondata 10');
  const Mon = require('../shared/monsters.js');
  const man = JSON.parse(require('fs').readFileSync(__dirname + '/../public/assets/enemies/troll_sheet/troll.json', 'utf8'));
  const br = Mon.MONSTERS.cave_brute;

  // il manifest descrive davvero le lastre: 5x5 celle da 256 = 1280x1280
  assert(man.cols * man.cell === 1280 && man.rows * man.cell === 1280, 'la griglia del manifest copre la lastra (1280x1280)');
  assert(man.anims.idle.frames <= man.cols * man.rows && man.anims.walk.frames <= 25 && man.anims.attack.frames <= 25, 'i conteggi dei fotogrammi stanno nella griglia');

  // ANCORA: le tre animazioni devono poggiare sulla stessa linea del terreno.
  // Misurate sui PNG nuovi: piedi a y 196-199 (idle), 196-202 (walk), 215-221 (attack).
  // Prima l'attacco era ancorato a 205 e il troll "saltava" di 11px ogni volta che colpiva.
  const feet = { idle: 198, walk: 199, attack: 216 };
  for (const k of ['idle', 'walk', 'attack']) {
    assert(Math.abs(man.anims[k].ay - feet[k]) <= 3, 'ancora ' + k + ' sulla linea dei piedi (ay ' + man.anims[k].ay + ', atteso ~' + feet[k] + ')');
  }

  // IMPATTO: il fotogramma della martellata deve coincidere con l'istante in cui il server fa danno.
  assert(man.anims.attack.hitFrame != null, 'il manifest dichiara il fotogramma d impatto');
  assert(man.anims.attack.hitFrame === 15, 'l impatto e al fotogramma 15 (misurato: piedi a 221, testa a 88)');
  assert(br.slamHit > 0 && br.slamHit < 1, 'il server ha un istante di danno normalizzato (slamHit ' + br.slamHit + ')');
  // la mappatura a due tratti manda hitFrame esattamente su slamHit
  const A = man.anims.attack, hf = A.hitFrame, hp = br.slamHit;
  const frameAt = (a) => { const f = (a <= hp) ? Math.pow(a / hp, 0.72) * hf : hf + ((a - hp) / (1 - hp)) * (A.frames - 1 - hf);
    return Math.max(0, Math.min(A.frames - 1, Math.round(f))); };
  assert(frameAt(hp) === hf, 'a slamHit si vede esattamente il fotogramma d impatto');
  assert(frameAt(0) === 0 && frameAt(1) === A.frames - 1, 'la mappatura copre tutta l animazione');
  let mono = true; for (let i = 1; i <= 20; i++) if (frameAt(i / 20) < frameAt((i - 1) / 20)) mono = false;
  assert(mono, 'la mappatura non torna mai indietro');

  // PASSO AGGANCIATO AL TERRENO: il manifest dichiara quanti px copre un ciclo completo
  assert(man.anims.walk.cyclePx > 0, 'la camminata dichiara cyclePx (passo agganciato alla distanza)');
  const eff = br.speed * Math.max(0.6, Math.min(1.45, 16 / br.radius));
  const cyclesPerSec = eff / man.anims.walk.cyclePx;
  assert(cyclesPerSec > 0.1 && cyclesPerSec < 1.2, 'a velocita nominale la cadenza e plausibile (' + cyclesPerSec.toFixed(2) + ' cicli/s)');
  assert(man.blend > 0, 'e dichiarata la dissolvenza fra animazioni');

  // BEHOLDER dall ondata 10
  assert(!Waves.poolForWave(9).some(x => x.id === 'occhio'), 'niente Beholder alla 9');
  assert(Waves.poolForWave(10).some(x => x.id === 'occhio'), 'Beholder dalla 10');
  assert(Mon.MONSTERS.occhio.maxAlive === 8, 'il tetto di 8 presenze resta');
  ok('novita v1.60 verificate');
}
function testV147() {
  console.log('\n[TEST 22] Novita v1.47 — Troll delle Caverne reso con SPRITE SHEET animato (idle/walk/attack)');
  const Mon = require('../shared/monsters.js');
  const br = Mon.MONSTERS.cave_brute;
  assert(br && br.sheet === 'troll', 'il Troll usa un SPRITE SHEET (sheet=troll)');
  assert(br && !br.puppet && !br.front, 'il Troll non è più puppet/billboard');
  assert(br && br.ai === 'brute' && br.slamWind > 0 && br.slamHit > 0, 'mantiene IA brute + wind-up + istante d\'impatto');
  assert(br && br.name.indexOf('Troll') === 0, 'rinominato "Troll delle Caverne"');
  // simula lo slam a due tempi (invariato): parte il telegrafo e poi lo schianto danneggia ad area
  const room = new Room('v147'); const pl = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  const m = room.spawnMonster('cave_brute', pl.x + 40, pl.y, { scaling: Waves.scaling(4, 1) });
  assert(m && m.type === 'cave_brute' && m.hp > 0, 'il Troll si genera');
  pl.x = m.x + 26; pl.y = m.y; pl.buffs = {}; pl.hp = 500; const hp0 = pl.hp; m.atkT = 0; room.events.length = 0;
  const dt = 1 / C.TICK_RATE; room.update(dt);
  const wind = room.events.find(e => e.t === 'slam_wind');
  assert(wind && wind.e === m.eid, 'il Troll avvia il wind-up (slam_wind con eid) → anima l\'attacco dello sheet');
  for (let i = 0; i < 30; i++) { room.update(dt); if (pl.hp < hp0) break; }
  assert(pl.hp < hp0, 'lo schianto del Troll infligge danni ad area');
  for (let i = 0; i < C.TICK_RATE * 6; i++) { room.setInput('b', bot(room, pl)); room.update(dt); if (hasNaN(room)) break; }
  assert(hasNaN(room) === null, 'nessun NaN col Troll sprite-sheet in campo');
  ok('novita v1.47 verificate');
}
function testV166() {
  console.log('\n[TEST 36] Novita v1.66 — tre classi da dungeon, quattro statistiche, fendente in mischia');
  // --- 1) il roster e' cambiato: niente piu' eroi cyberpunk, niente piu' abilita' Q/E ---
  assert(Heroes.ORDER.join(',') === 'guerriero,mago,ladro', 'il roster e guerriero/mago/ladro');
  assert(!Heroes.HEROES.enforcer && !Heroes.HEROES.recon && !Heroes.HEROES.glitch, 'i tre eroi cyberpunk non esistono piu');
  const SCUOLE = { guerriero: 'melee', mago: 'magic', ladro: 'ranged' };
  for (const id of Heroes.ORDER) assert(Heroes.HEROES[id].weapon.school === SCUOLE[id], id + ' dichiara la scuola ' + SCUOLE[id]);
  // --- 2) quattro statistiche da gioco di ruolo, tetto 12 ---
  const ids = Loot.XP_STATS.map(s => s.id).join(',');
  assert(ids === 'st_for,st_cos,st_int,st_des', 'le statistiche sono Forza/Costituzione/Intelligenza/Destrezza');
  assert(Loot.STAT_MAX_LEVEL === 12, 'il tetto per statistica e 12');
  // --- 3) ogni statistica agisce sulla SCUOLA, non su un danno generico: e' cio' che rende
  //        sensate le classi miste future (chiunque puo comprare qualunque statistica) ---
  const room = new Room('v166'); room.startGame(); room.phase = C.PHASE_SHOP;
  const gue = room.addPlayer('g', { send() {} }, 'G', 'guerriero');
  const mag = room.addPlayer('m', { send() {} }, 'M', 'mago');
  const lad = room.addPlayer('l', { send() {} }, 'L', 'ladro');
  for (const p of [gue, mag, lad]) p.points = 9999999;
  const d0 = { g: room.effDamage(gue), m: room.effDamage(mag), l: room.effDamage(lad) };
  const c0 = { m: room.effFireDelay(mag), l: room.effFireDelay(lad), g: room.effFireDelay(gue) };
  room.buyStat('g', 'st_for');
  assert(room.effDamage(gue) > d0.g, 'la Forza alza il danno in mischia del guerriero');
  assert(Math.abs(room.effFireDelay(gue) - c0.g) < 1e-9, 'la Forza NON tocca la cadenza');
  room.buyStat('m', 'st_for');
  assert(Math.abs(room.effDamage(mag) - d0.m) < 1e-9, 'la Forza non fa nulla sulle magie del mago');
  room.buyStat('m', 'st_int');
  assert(room.effDamage(mag) > d0.m, 'l Intelligenza alza il danno delle magie');
  assert(room.effFireDelay(mag) < c0.m, 'l Intelligenza alza anche la cadenza delle magie');
  const sp0 = room.effSpeed(lad);
  room.buyStat('l', 'st_des');
  assert(room.effDamage(lad) > d0.l, 'la Destrezza alza il danno delle frecce');
  assert(room.effFireDelay(lad) < c0.l, 'la Destrezza alza la cadenza');
  assert(room.effSpeed(lad) > sp0, 'la Destrezza alza anche la velocita di movimento');
  const hp0 = room.effMaxHp(gue), dr0 = gue.stats.dmgReduce;
  room.buyStat('g', 'st_cos');
  assert(room.effMaxHp(gue) > hp0 && gue.stats.dmgReduce > dr0, 'la Costituzione da PV e riduzione dei danni');
  // il mago parte piu' LENTO dei vecchi fucilieri: e' l Intelligenza a farlo salire (richiesta esplicita)
  assert(Heroes.HEROES.mago.weapon.fireRate < 3, 'il mago parte con una cadenza bassa (' + Heroes.HEROES.mago.weapon.fireRate + '/s)');
  // --- 4) FENDENTE: nessun proiettile, danno nel settore davanti, niente alle spalle ---
  const r2 = new Room('v166b'); const p = r2.addPlayer('b', { send() {} }, 'B', 'guerriero'); r2.startGame();
  const w = p.hero.weapon; assert(w.melee && w.arcRadius > 0 && w.arcHalf > 0, 'la spada dichiara raggio e apertura dell arco');
  const avanti = losSpot(r2, p, w.arcRadius * 0.6);
  p.aim = Math.atan2(avanti.y - p.y, avanti.x - p.x); p.input.aim = p.aim;
  const m1 = r2.spawnMonster('skeleton', avanti.x, avanti.y, { scaling: Waves.scaling(2, 1) });
  const dietro = { x: p.x - Math.cos(p.aim) * w.arcRadius * 0.6, y: p.y - Math.sin(p.aim) * w.arcRadius * 0.6 };
  const m2 = r2.spawnMonster('skeleton', dietro.x, dietro.y, { scaling: Waves.scaling(2, 1) });
  m1.hp = m1.maxHp = 9999; m2.hp = m2.maxHp = 9999;
  r2.bullets.length = 0; r2.events.length = 0; p.fireCd = 0; r2.firePlayerWeapon(p);
  assert(r2.bullets.filter(b => !b.hostile).length === 0, 'il guerriero non spara proiettili');
  assert(m1.hp < 9999, 'il bersaglio DAVANTI incassa il fendente');
  assert(m2.hp === 9999, 'il bersaglio ALLE SPALLE non viene toccato');
  const sw = r2.events.find(e => e.t === 'swing');
  assert(sw && sw.rad === w.arcRadius && sw.half === w.arcHalf, 'l evento porta al client il raggio e l apertura REALI dell area');
  // il fendente e' ad AREA ma limitato: il piu' vicino incassa tutto, gli altri una quota, e c'e' un tetto
  const r3 = new Room('v166c'); const q = r3.addPlayer('c', { send() {} }, 'C', 'guerriero'); r3.startGame();
  const sp = losSpot(r3, q, 50); q.aim = Math.atan2(sp.y - q.y, sp.x - q.x); q.input.aim = q.aim;
  const mob = []; for (let i = 0; i < C.MELEE_MAX_TARGETS + 3; i++) {
    const off = (i - (C.MELEE_MAX_TARGETS + 2) / 2) * 0.12;
    const mm = r3.spawnMonster('skeleton', q.x + Math.cos(q.aim + off) * 55, q.y + Math.sin(q.aim + off) * 55, { scaling: Waves.scaling(2, 1) });
    if (mm) { mm.hp = mm.maxHp = 9999; mob.push(mm); }
  }
  q.fireCd = 0; r3.firePlayerWeapon(q);
  const colpiti = mob.filter(m => m.hp < 9999);
  assert(colpiti.length <= C.MELEE_MAX_TARGETS, 'un fendente colpisce al massimo ' + C.MELEE_MAX_TARGETS + ' bersagli (colpiti ' + colpiti.length + ')');
  if (colpiti.length > 1) { const danni = colpiti.map(m => 9999 - m.hp).sort((a, b) => b - a); assert(danni[danni.length - 1] < danni[0], 'i bersagli secondari incassano meno del primo'); }
  // --- 5) proiettili riconoscibili: bolla per il mago, freccia per il ladro ---
  const r4 = new Room('v166d'); const mg = r4.addPlayer('d', { send() {} }, 'D', 'mago'); r4.startGame();
  r4.bullets.length = 0; mg.fireCd = 0; r4.firePlayerWeapon(mg);
  const bolla = r4.bullets.find(b => !b.hostile); assert(bolla && bolla.bubble && !bolla.arrow, 'il mago spara bolle');
  const r5 = new Room('v166e'); const ld = r5.addPlayer('e', { send() {} }, 'E', 'ladro'); r5.startGame();
  r5.bullets.length = 0; ld.fireCd = 0; r5.firePlayerWeapon(ld);
  const frec = r5.bullets.find(b => !b.hostile); assert(frec && frec.arrow && !frec.bubble, 'il ladro spara frecce');
  const snap = r5.snapshot(); const sb = snap.bul.find(b => b.ar);
  assert(sb && sb.a != null, 'lo snapshot porta l orientamento della freccia (serve al client per disegnarla)');
  // --- 6) le armi non si raccolgono piu' dalla mappa e non si comprano ---
  const r6 = new Room('v166f'); r6.addPlayer('f', { send() {} }, 'F', 'ladro'); r6.startGame();
  assert(r6.weaponDrops.length === 0, 'nessuna arma a terra all inizio dell ondata');
  r6.spawnWeapons(); assert(r6.weaponDrops.length === 0, 'spawnWeapons e disattivata');
  assert(!r6.merchantWaresPool().some(w => w.kind === 'weapon'), 'il mercante non vende piu casse armi');
  assert(!Loot.ITEMS.some(i => i.kind === 'weapon'), 'le casse armi non escono piu dalle casse');
  ok('novita v1.66 verificate');
}
function testV167() {
  console.log('\n[TEST 37] Novita v1.67 — il fabbro vende OGGETTI, uno per classe');
  const Gear = require('../shared/gear.js');
  // --- 1) il catalogo e' ben formato e ogni classe ha i suoi slot ---
  assert(Object.keys(Gear.SLOTS).join(',') === 'guerriero,mago,ladro', 'gli slot sono definiti per tutte e tre le classi');
  assert(Gear.slotsFor('guerriero').join(',') === 'weapon,armor,shield', 'il guerriero ha arma, armatura e scudo');
  assert(Gear.slotsFor('mago').join(',') === 'weapon,armor', 'il mago ha arma e armatura');
  assert(Gear.slotsFor('ladro').join(',') === 'weapon,armor,boots', 'il ladro ha arma, armatura e calzature');
  assert(new Set(Gear.ITEMS.map(i => i.id)).size === Gear.ITEMS.length, 'nessun id di oggetto duplicato');
  for (const it of Gear.ITEMS) {
    assert(Gear.slotsFor(it.hero).includes(it.slot), it.id + ' sta in uno slot che la sua classe possiede');
    assert(it.name && it.desc && typeof it.cost === 'number' && it.rank >= 1, it.id + ' ha nome, descrizione, prezzo e rango');
    assert(it.slot === 'weapon' ? !!it.weapon : !!it.bonus, it.id + ' porta un blocco arma oppure un blocco bonus');
  }
  // --- 2) rango piu' alto = costa di piu' E vale di piu' (regola dichiarata: niente scambi alla pari) ---
  for (const hero of Object.keys(Gear.SLOTS)) for (const slot of Gear.slotsFor(hero)) {
    const l = Gear.itemsFor(hero, slot);
    assert(l.length >= 2, hero + '/' + slot + ' ha almeno due oggetti fra cui scegliere');
    assert(l[0].cost === 0, hero + '/' + slot + ': il rango 1 e quello di partenza e costa 0');
    for (let i = 1; i < l.length; i++) {
      assert(l[i].cost > l[i - 1].cost, hero + '/' + slot + ': ' + l[i].id + ' costa piu del rango precedente');
      if (slot === 'weapon') {
        const dps = w => w.dmg * w.fireRate;
        assert(dps(l[i].weapon) > dps(l[i - 1].weapon), l[i].id + ' fa piu danni al secondo del rango precedente');
      } else {
        const val = b => (b.maxHpFlat || 0) / 10 + (b.dmgReduce || 0) * 100 + (b.speedMult || 0) * 100;
        assert(val(l[i].bonus) > val(l[i - 1].bonus), l[i].id + ' da bonus migliori del rango precedente');
      }
    }
  }
  // --- 3) le tre armi del guerriero sono DIVERSE, non la stessa piu' grande: piu' lunga = piu' stretta ---
  const armi = Gear.itemsFor('guerriero', 'weapon');
  for (let i = 1; i < armi.length; i++) {
    assert(armi[i].weapon.arcRadius > armi[i - 1].weapon.arcRadius, armi[i].id + ' arriva piu lontano');
    assert(armi[i].weapon.arcHalf < armi[i - 1].weapon.arcHalf, armi[i].id + ' copre un arco piu STRETTO');
    assert(armi[i].weapon.fireRate < armi[i - 1].weapon.fireRate, armi[i].id + ' e piu lento a ripetere');
  }
  // la cadenza delle bacchette resta la firma della classe: la alza l'Intelligenza, non l'acquisto
  const bacch = Gear.itemsFor('mago', 'weapon');
  assert(bacch.every(b => b.weapon.fireRate === bacch[0].weapon.fireRate), 'tutte le bacchette hanno la stessa cadenza di base');
  // --- 4) a runtime: cambio libero, ricalcolo da zero, niente roba di altre classi ---
  const room = new Room('v167'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  room.wave = 3; room.phase = C.PHASE_SHOP; room.shopReady('b', 'market'); room._afterShop();
  p.coins = 100000; p.x = room.gearMerchant.x; p.y = room.gearMerchant.y;
  assert(room.effWeapon(p).name === 'Arco Corto', 'il ladro parte con l arco corto');
  const sp0 = room.effSpeed(p);
  room.buyGear('b', 'lad_stivali'); assert(room.effSpeed(p) > sp0, 'gli stivali migliori aumentano la velocita');
  room.buyGear('b', 'lad_scarpe'); assert(Math.abs(room.effSpeed(p) - sp0) < 1e-9, 'tornando alle scarpe la velocita torna esatta (nessun bonus rimasto appiccicato)');
  const d0 = room.effDamage(p); room.buyGear('b', 'lad_arcolungo');
  assert(room.effDamage(p) > d0 && room.effWeapon(p).bulletSpeed > 900, 'l arco lungo fa piu danno e tira piu veloce');
  assert(room.effWeapon(p).school === 'ranged', 'la scuola resta quella della classe, non dell oggetto');
  // le frecce dell'arco lungo perforano di piu': l'oggetto arriva davvero fino al proiettile
  room.bullets.length = 0; p.fireCd = 0; room.firePlayerWeapon(p);
  const fr = room.bullets.find(b => !b.hostile);
  assert(fr && fr.arrow && fr.pierce >= 2, 'la freccia dell arco lungo perfora due nemici');
  // --- 5) i PV non superano mai il massimo quando si scende di armatura ---
  const q = room.addPlayer('c', { send() {} }, 'C', 'guerriero');
  q.coins = 100000; q.x = room.gearMerchant.x; q.y = room.gearMerchant.y;
  room.buyGear('c', 'gue_piastre'); q.hp = room.effMaxHp(q);
  room.buyGear('c', 'gue_maglia');
  assert(q.hp <= room.effMaxHp(q), 'togliendo l armatura i PV rientrano nel nuovo massimo');
  // --- 6) lo snapshot porta al client cio' che si vede addosso ---
  const snap = room.snapshot(); const me = snap.players.find(x => x.i === 'b');
  assert(me && me.wp === 'lad_arcolungo', 'lo snapshot porta l arma equipaggiata (serve a disegnare l arco lungo)');
  const gg = snap.players.find(x => x.i === 'c');
  assert(gg && gg.sh === 'gue_scudo', 'e lo scudo equipaggiato (lo scudo a torre si disegna piu grande)');
  ok('novita v1.67 verificate');
}
function testV168() {
  console.log('\n[TEST 38] Novita v1.68 — tetto a 30 vivi con coda, e snapshot magro');
  // --- 1) il tetto e' 30 e l'ondata NON perde nessuno: gli altri restano in coda ---
  assert(C.MAX_ALIVE === 30, 'il tetto dei nemici vivi e 30');
  const room = new Room('v168'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  room.wave = 17; room.mode = Waves.modeForWave(17); room.phase = C.PHASE_COMBAT;
  const w = Waves.buildWave(20, 6, room.mode);      // ondata volutamente enorme: 80+ nemici
  room.waveList = w.list; room.waveScaling = w.scaling; room.pending = w.list.length; room._peakAlive = 0;
  const totale = w.list.length;
  assert(totale > C.MAX_ALIVE * 2, 'la prova usa un ondata piu che doppia del tetto (' + totale + ')');
  // il giocatore va tenuto in piedi: 30 nemici addosso a un fermo lo ammazzano, la partita finisce e con
  // essa la generazione — misureremmo il gameover, non la coda.
  const dt = 1 / C.TICK_RATE; let picco = 0;
  for (let i = 0; i < C.TICK_RATE * 60; i++) { p.hp = room.effMaxHp(p); p.down = false; p.dead = false; room.update(dt); picco = Math.max(picco, room.monsters.length); }
  assert(picco <= C.MAX_ALIVE, 'in campo non ce ne sono mai piu di ' + C.MAX_ALIVE + ' (picco ' + picco + ')');
  // nessuno sta uccidendo, quindi l'arena resta piena e la coda NON puo' svuotarsi: la prova e' che il
  // conto torni sempre — quelli che non entrano sono in coda, non spariti.
  // NB: in campo possono essercene piu' di quanti ne ha versati la coda, perche' negromanti e melme ne
  // aggiungono di loro (evocazioni e scissioni). L'invariante che conta e' un'altra: la coda e il contatore
  // dei mancanti devono dire la stessa cosa, cioe' nessuno viene perso per strada.
  assert(room.waveList.length === room.pending, 'coda e contatore coincidono: nessuno perso (' + room.waveList.length + ' vs ' + room.pending + ')');
  assert(room.pending > 0, 'i nemici in eccesso stanno aspettando in coda (' + room.pending + ' di ' + totale + ')');
  assert(totale - room.pending <= C.MAX_ALIVE, 'e ne e uscito solo quanti ne stanno in campo');
  assert(room.monsters.length === C.MAX_ALIVE, 'l arena resta piena fino al tetto');
  // ora si uccide: la coda deve ricominciare a versare
  for (let k = 0; k < 12; k++) { const m = room.monsters.find(x => !x.dead); if (m) room.killMonster(m, null); }
  room.monsters = room.monsters.filter(x => !x.dead);
  const inCoda = room.pending;
  for (let i = 0; i < C.TICK_RATE * 6; i++) { p.hp = room.effMaxHp(p); p.down = false; p.dead = false; room.update(dt); }
  assert(room.pending < inCoda, 'uccidendo, la coda ricomincia a versare (da ' + inCoda + ' a ' + room.pending + ')');
  assert(room.waveList.length === room.pending, 'e coda e contatore restano allineati anche dopo');
  // --- 2) due velocita' di rifornimento: salita normale, rimpiazzo quasi immediato ---
  // (si guarda il timer scelto, non il tempo reale: e' cio' che decide il ritmo)
  const r2 = new Room('v168b'); r2.addPlayer('c', { send() {} }, 'C', 'ladro'); r2.startGame();
  r2.wave = 17; r2.phase = C.PHASE_COMBAT; r2.mode = Waves.modeForWave(17);
  const w2 = Waves.buildWave(20, 6, r2.mode); r2.waveList = w2.list; r2.waveScaling = w2.scaling; r2.pending = w2.list.length; r2._peakAlive = 0;
  const q2 = r2.players.get('c');
  for (let i = 0; i < C.TICK_RATE * 60 && r2.monsters.length < C.MAX_ALIVE; i++) { q2.hp = r2.effMaxHp(q2); q2.down = false; q2.dead = false; r2.update(dt); }
  q2.hp = r2.effMaxHp(q2); q2.down = false; q2.dead = false; r2.update(dt);   // un tick in piu': il picco si registra a inizio update
  assert(r2.monsters.length === C.MAX_ALIVE, 'l arena si riempie fino al tetto');
  assert(r2._peakAlive === C.MAX_ALIVE, 'il picco raggiunto viene ricordato');
  for (let k = 0; k < 8; k++) { const m = r2.monsters.find(x => !x.dead); if (m) r2.killMonster(m, null); }
  r2.monsters = r2.monsters.filter(x => !x.dead);
  r2.spawnTimer = 0; r2.update(dt);
  assert(r2.spawnTimer <= 0.22, 'aperto un buco, il rimpiazzo e quasi immediato (' + r2.spawnTimer.toFixed(2) + 's)');
  // --- 3) SNAPSHOT MAGRO: la parte immutabile viaggia una volta sola ---
  const r3 = new Room('v168c'); const q = r3.addPlayer('d', { send() {} }, 'D', 'mago'); r3.startGame();
  r3.phase = C.PHASE_COMBAT; r3.wave = 8;
  for (let i = 0; i < 25; i++) { const pos = r3.randomSpawnPos(); r3.spawnMonster('skeleton', pos.x, pos.y, { scaling: Waves.scaling(8, 1) }); }
  const pieno = r3.snapshot();
  assert(pieno.mon.every(m => m.t && m.mhp), 'lo snapshot PIENO porta sempre tipo e PV massimi');
  assert(pieno.players.every(x => x.n && x.h), 'e nome ed eroe di ogni giocatore');
  const primo = r3.snapshot(true);
  assert(primo.mon.every(m => m.t && m.mhp), 'il primo snapshot magro presenta i mostri per intero');
  const dopo = r3.snapshot(true);
  assert(dopo.mon.every(m => m.t === undefined && m.mhp === undefined), 'nei successivi la parte immutabile non si ripete');
  assert(dopo.mon.every(m => m.e != null && m.x != null && m.y != null && m.hp != null), 'ma posizione e PV ci sono sempre');
  assert(dopo.players.every(x => x.n === undefined), 'idem per nome ed eroe del giocatore');
  assert(JSON.stringify(dopo).length < JSON.stringify(pieno).length * 0.75, 'lo snapshot magro pesa almeno un quarto in meno');
  // un mostro che compare DOPO va presentato lo stesso
  const pos = r3.randomSpawnPos(); const nuovo = r3.spawnMonster('darkmage', pos.x, pos.y, { scaling: Waves.scaling(8, 1) });
  const terzo = r3.snapshot(true);
  const rec = terzo.mon.find(m => m.e === nuovo.eid);
  assert(rec && rec.t === 'darkmage' && rec.mhp, 'un mostro comparso dopo viene presentato quando arriva');
  assert(terzo.mon.filter(m => m.t !== undefined).length === 1, 'e solo lui: gli altri restano magri');
  // chi ENTRA adesso non ha cache, quindi deve ricevere tutto
  const nuovoGioc = r3.addPlayer('e', { send() {} }, 'E', 'ladro');
  assert(nuovoGioc._needFull === true, 'chi si collega e marcato per ricevere uno snapshot pieno');
  assert(r3.snapshot().mon.every(m => m.t), 'e lo snapshot pieno gliele ridice tutte');
  // --- 4) i flag a zero non si mandano affatto ---
  const m0 = dopo.mon[0];
  assert(m0.fl === undefined && m0.el === undefined, 'i flag che valgono 0 non occupano spazio');
  ok('novita v1.68 verificate');
}
function testV169() {
  console.log('\n[TEST 39] Livelli, ranghi e punti (v1.69, rivisti in v1.70)');
  const Lv = require('../shared/levels.js');
  // --- 1) la scala NON ha piu un tetto: si sale finche si accumula esperienza ---
  assert(Lv.MAX_LEVEL === undefined, 'il tetto ai livelli non esiste piu');
  assert(Lv.levelForXp(0) === 1 && Lv.levelForXp(199) === 1, 'sotto la prima soglia si resta al livello 1');
  assert(Lv.levelForXp(200) === 2, 'a 200 XP si sale al 2');
  assert(Lv.levelForXp(10670) === 20, 'a 10.670 XP si e di livello 20');
  assert(Lv.levelForXp(30000) > 20 && Lv.levelForXp(100000) > Lv.levelForXp(30000), 'oltre il 20 si continua a salire');
  let cresce = true; for (let L = 3; L <= 40; L++) if (Lv.xpStep(L) <= Lv.xpStep(L - 1)) cresce = false;
  assert(cresce, 'ogni livello costa piu del precedente, anche molto oltre il 20');
  const pr = Lv.progress(Lv.xpForLevel(7) + 100);
  assert(pr.level === 7 && pr.frac > 0 && pr.frac < 1, 'il progresso fra due livelli e una frazione sensata');
  // --- 2) i punti ---
  assert(Lv.pointsForLevel(20) === 19, '19 punti dai primi 20 livelli');
  assert(Lv.statPointsTo(12) === 22, 'portare una statistica al tetto ne costa 22');
  assert(Lv.statPointCost(0) === 1 && Lv.statPointCost(5) === 2 && Lv.statPointCost(11) === 3, 'il costo cresce a scaglioni');
  // --- 3) i ranghi restano, le carte NO ---
  assert(Lv.rankForLevel(1) === 1 && Lv.rankForLevel(5) === 2 && Lv.rankForLevel(20) === 5, 'i ranghi cadono ogni 5 livelli');
  assert(Object.keys(Lv.CARD_BY_ID).length === 0, 'le carte di rango sono state rimosse (le sostituiranno le abilita di classe)');
  for (const h of ['guerriero', 'mago', 'ladro']) {
    assert(Lv.cardsFor(h, 2).length === 0, h + ': nessuna carta da offrire');
    assert(Lv.specsFor(h).length === 2, h + ' ha ancora due specializzazioni al rango V');
  }
  // --- 4) a runtime: si sale, si prende un punto, il rango NON offre carte ---
  const room = new Room('v169'); const p = room.addPlayer('b', { send() {} }, 'B', 'guerriero'); room.startGame();
  assert(p.level === 1 && p.points === 0 && p.xpPool === 0, 'si parte al livello 1 senza punti');
  room.addXp(p, 199); assert(p.level === 1 && p.points === 0, 'sotto soglia non succede niente');
  room.addXp(p, 1); assert(p.level === 2 && p.points === 1, 'alla soglia si sale e arriva il punto');
  assert(p.xpPool === 200, 'la XP non si consuma: e una barra, non una valuta');
  room.addXp(p, Lv.xpForLevel(5) - p.xpPool);
  assert(p.level === 5 && Lv.rankForLevel(p.level) === 2, 'si arriva al rango II');
  assert(p.points === 5, 'quattro punti dai livelli piu uno dal rango');
  assert(p.rankOffer === null, 'ma nessuna carta viene offerta: non ce ne sono piu');
  // saltare piu' livelli in un colpo solo non deve perdere ne punti ne ranghi
  const r2 = new Room('v169b'); const q = r2.addPlayer('c', { send() {} }, 'C', 'mago'); r2.startGame();
  r2.addXp(q, Lv.xpForLevel(11));
  assert(q.level === 11, 'una botta di XP fa salire di piu livelli in un colpo');
  assert(q.points === 10 + 2, 'e i punti dei ranghi attraversati ci sono tutti (10 livelli + 2 ranghi)');
  // --- 5) il bivio del rango V c'e' ancora ---
  const r3 = new Room('v169c'); const z = r3.addPlayer('d', { send() {} }, 'D', 'ladro'); r3.startGame();
  r3.addXp(z, Lv.xpForLevel(20));
  assert(z.level === 20 && z.specOffer && z.specOffer.length === 2, 'al livello 20 arriva il bivio');
  r3.phase = C.PHASE_SHOP;
  const crit0 = z.stats.critChance;
  r3.pickRank('d', 'assassino');
  assert(z.spec === 'assassino' && z.stats.critChance > crit0, 'la specializzazione viene applicata');
  const snapZ = r3.snapshot().players.find(x => x.i === 'd');
  assert(snapZ && snapZ.sp === 'assassino' && snapZ.lvl === 20, 'lo snapshot la porta al client');
  // e oltre il 20 si continua a salire, senza conversioni in monete
  const co0 = z.coins;
  r3.addXp(z, 20000);
  assert(z.level > 20, 'oltre il rango V il livello continua a salire');
  assert(z.coins === co0, 'e la XP non si converte piu in monete: non c e piu un tetto da superare');
  // --- 6) le statistiche si pagano in PUNTI, e la XP non cala mai ---
  const r4 = new Room('v169d'); const w = r4.addPlayer('e', { send() {} }, 'E', 'guerriero'); r4.startGame();
  r4.addXp(w, Lv.xpForLevel(6)); r4.phase = C.PHASE_SHOP;
  const punti0 = w.points, xpPrima = w.xpPool;
  r4.buyStat('e', 'st_for');
  assert(w.buys.st_for === 1 && w.points === punti0 - 1, 'il primo livello di una statistica costa 1 punto');
  assert(w.xpPool === xpPrima, 'e la XP resta dov era');
  w.points = 0; const b0 = w.buys.st_for;
  r4.buyStat('e', 'st_for'); assert(w.buys.st_for === b0, 'senza punti non si compra');
  // --- 7) senza carte in attesa il boon torna normale ---
  const r6 = new Room('v169f'); const v = r6.addPlayer('g', { send() {} }, 'G', 'mago'); r6.startGame();
  r6.addXp(v, 250); r6.enterShop();
  assert(v.boonOffer && v.boonOffer.length, 'a fine ondata il boon viene offerto');
  ok('livelli e ranghi verificati');
}
function testV170() {
  console.log('\n[TEST 40] Novita v1.70 — tetto progressivo, XP da piu fonti, LEVEL UP');
  const Lv = require('../shared/levels.js');
  // --- 1) il tetto dei nemici e' una CURVA, non un numero ---
  const room = new Room('v170'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  const attesi = [8, 10, 12, 14, 16, 18, 21, 23, 26, 30];
  for (let w = 1; w <= 10; w++) { room.wave = w; assert(room.tettoVivi() === attesi[w - 1], 'ondata ' + w + ': il tetto e ' + attesi[w - 1] + ' (letto ' + room.tettoVivi() + ')'); }
  room.wave = 11; assert(room.tettoVivi() === C.MAX_ALIVE, 'dalla 10ª in poi resta il tetto massimo');
  room.wave = 30; assert(room.tettoVivi() === C.MAX_ALIVE, 'e non lo supera mai');
  let cresce = true; for (let w = 2; w <= 10; w++) { room.wave = w; const a = room.tettoVivi(); room.wave = w - 1; if (a <= room.tettoVivi()) cresce = false; }
  assert(cresce, 'la curva cresce a ogni ondata');
  // --- 2) alla terza ondata NON si arriva a 30 vivi ---
  const r2 = new Room('v170b'); const q = r2.addPlayer('c', { send() {} }, 'C', 'ladro'); r2.startGame();
  r2.wave = 3; r2.mode = Waves.modeForWave(3); r2.phase = C.PHASE_COMBAT;
  const w3 = Waves.buildWave(3, 6, r2.mode); r2.waveList = w3.list; r2.waveScaling = w3.scaling; r2.pending = w3.list.length; r2._peakAlive = 0;
  const dt = 1 / C.TICK_RATE; let picco = 0;
  for (let i = 0; i < C.TICK_RATE * 45; i++) { q.hp = r2.effMaxHp(q); q.down = false; q.dead = false; r2.update(dt); let vivi = 0; for (const m of r2.monsters) if (!m.dead) vivi++; picco = Math.max(picco, vivi); }
  assert(picco <= 12, 'alla terza ondata non se ne vedono mai piu di 12 (picco ' + picco + ')');
  assert(picco >= 8, 'ma l arena si riempie comunque (picco ' + picco + ')');
  // --- 3) l esperienza arriva da piu fonti ---
  const r3 = new Room('v170c'); const z = r3.addPlayer('d', { send() {} }, 'D', 'mago'); r3.startGame();
  r3.wave = 4;
  const xp0 = z.xpPool;
  r3.applyItem(z, Loot.ITEMS.find(i => i.kind === 'buff'));
  assert(z.xpPool > xp0, 'raccogliere un potenziamento da esperienza');
  const xp1 = z.xpPool;
  r3.crates.length = 0; r3.crates.push({ eid: 1, x: z.x, y: z.y, r: 16, mimic: false, opened: false });
  r3.updatePickups(1 / C.TICK_RATE);
  assert(z.xpPool > xp1, 'aprire una cassa da esperienza');
  assert(C.XP_CASSA > 0 && C.XP_OGGETTO > 0, 'i valori delle fonti stanno nelle costanti, in chiaro');
  // la fonte viene raccontata al client, ma non cambia il conto
  const ev = r3.events.filter(e => e.t === 'xpfonte');
  assert(ev.length >= 2 && ev.every(e => e.k && e.v > 0), 'ogni fonte manda al client quanta XP ha dato e da dove');
  // --- 4) il LEVEL UP viene annunciato anche in mezzo all ondata ---
  const r4 = new Room('v170d'); const u = r4.addPlayer('e', { send() {} }, 'E', 'guerriero'); r4.startGame();
  r4.phase = C.PHASE_COMBAT; r4.events.length = 0;
  r4.addXp(u, Lv.xpForLevel(3));
  const lu = r4.events.filter(e => e.t === 'levelup');
  assert(lu.length === 2, 'salendo di due livelli partono due annunci');
  assert(lu[0].who === 'e' && lu[0].lv === 2 && lu[1].lv === 3, 'ognuno porta chi e salito e a che livello');
  assert(lu[0].rank, 'e il titolo del rango, per la scritta sopra la testa');
  ok('novita v1.70 verificate');
}

// ===================== v1.71 — LA CINTURA (consumabili dell'Erborista) =====================
// Le regole da difendere sono quelle decise da Paolo, e ognuna ha il suo assert: tre slot, un tipo per
// slot, tre cariche, rimborso a meta' quando si cambia tipo, cariche che sopravvivono alla morte,
// cooldown CONDIVISO fra i tre slot, nessun cumulo dello stesso effetto, e i quattro moltiplicatori
// delle statistiche che arrivano davvero fino al valore effettivo.
function testV171() {
  console.log('\n[TEST 41] Novita v1.71 — la cintura: pozioni, slot, cooldown, statistiche');
  const conn = { send() {} };

  // --- 1) il banco: assegnare, comprare, i due tetti ---
  const r = new Room('v171a'); const p = r.addPlayer('a', conn, 'A', 'guerriero'); r.startGame();
  assert(p.belt.length === Pot.SLOTS && p.belt.every(s => s === null), 'si parte con la cintura vuota');
  r.enterMarket();
  assert(!!r.herbalist, "l'Erborista ha un posto nel villaggio");
  assert(!r.map.village.npcs.find(n => n.pot).soon, "e la sua bottega non e' piu' chiusa");
  // lontano dal banco non si compra nulla
  p.x = r.herbalist.x + 900; p.y = r.herbalist.y; p.coins = 500;
  r.pickPotion('a', 0, 'p_cura');
  assert(p.belt[0] === null, 'da lontano il banco non risponde');
  p.x = r.herbalist.x; p.y = r.herbalist.y;
  r.pickPotion('a', 0, 'p_cura');
  assert(p.belt[0] && p.belt[0].id === 'p_cura' && p.belt[0].n === 0, 'assegnare un tipo non regala cariche');
  const c0 = p.coins;
  for (let i = 0; i < 6; i++) r.buyPotion('a', 0);
  assert(p.belt[0].n === Pot.MAX_CHARGES, 'lo slot si ferma a ' + Pot.MAX_CHARGES + ' cariche');
  assert(p.coins === c0 - Pot.BY_ID.p_cura.cost * Pot.MAX_CHARGES, 'e paga solo le cariche che entrano davvero');
  r.pickPotion('a', 1, 'p_cura');
  assert(p.belt[1] === null, 'lo stesso tipo non entra in due slot');
  r.pickPotion('a', 1, 'p_furia'); r.buyPotion('a', 1);
  assert(p.belt[1].id === 'p_furia' && p.belt[1].n === 1, 'un tipo diverso entra');
  // --- 2) cambio tipo: rimborso a META' delle cariche rimaste ---
  const prima = p.coins;
  r.pickPotion('a', 0, 'p_fretta');
  assert(p.coins - prima === Math.floor(Pot.BY_ID.p_cura.cost * Pot.MAX_CHARGES * 0.5), 'cambiare tipo rimborsa meta delle cariche rimaste');
  assert(p.belt[0].id === 'p_fretta' && p.belt[0].n === 0, 'e lo slot riparte vuoto col tipo nuovo');
  // senza monete non si compra
  p.coins = 0; r.buyPotion('a', 1);
  assert(p.belt[1].n === 1, 'senza monete la carica non arriva');

  // --- 3) bere: cooldown CONDIVISO, non uno per slot ---
  const r2 = new Room('v171b'); const q = r2.addPlayer('b', conn, 'B', 'mago'); r2.startGame(); r2.phase = C.PHASE_COMBAT;
  q.belt[0] = { id: 'p_cura', n: 2 }; q.belt[1] = { id: 'p_furia', n: 2 }; q.belt[2] = { id: 'p_fretta', n: 2 };
  q.hp = 10;
  assert(r2.usePotion(q, 0) === true, 'la prima bevuta passa');
  assert(q.hp > 10, 'la cura cura');
  assert(q.belt[0].n === 1, 'e consuma una carica');
  assert(r2.usePotion(q, 0) === false, 'la seconda subito dopo no');
  assert(r2.usePotion(q, 1) === false, 'e nemmeno da un ALTRO slot: il cooldown e uno solo');
  assert(q.belt[1].n === 2, 'lo slot rifiutato non perde la carica');
  q.potCd = 0;
  assert(r2.usePotion(q, 1) === true, 'passato il cooldown si ribeve');
  // slot vuoto e slot senza cariche non fanno nulla
  q.potCd = 0; q.belt[1].n = 0;
  assert(r2.usePotion(q, 1) === false, 'uno slot esaurito non beve');
  q.potCd = 0; const senza = new Room('v171c'); const z = senza.addPlayer('c', conn, 'C', 'ladro'); senza.startGame();
  assert(senza.usePotion(z, 0) === false, 'uno slot non assegnato non beve');

  // --- 4) niente cumulo: la seconda dose fa RIPARTIRE, non raddoppia ---
  q.potCd = 0; q.buffs = {}; q.belt[1] = { id: 'p_furia', n: 2 };
  r2.usePotion(q, 1); const d1 = q.buffs.po_dmg;
  r2.updatePlayers(1.0);   // un secondo di gioco: la durata cala
  assert(q.buffs.po_dmg < d1, 'la durata scende mentre giochi');
  q.potCd = 0; r2.usePotion(q, 1);
  assert(Math.abs(q.buffs.po_dmg - d1) < 0.001, 'la seconda dose riporta la durata al pieno, non al doppio');

  // --- 5) i quattro moltiplicatori arrivano fino al valore EFFETTIVO ---
  const r3 = new Room('v171d'); const g = r3.addPlayer('d', conn, 'D', 'guerriero'); r3.startGame(); r3.phase = C.PHASE_COMBAT;
  const dmg0 = r3.effDamage(g), del0 = r3.effFireDelay(g), spd0 = r3.effSpeed(g);
  g.belt[0] = { id: 'p_furia', n: 9 }; g.belt[1] = { id: 'p_frenesia', n: 9 }; g.belt[2] = { id: 'p_fretta', n: 9 };
  r3.usePotion(g, 0); g.potCd = 0; r3.usePotion(g, 1); g.potCd = 0; r3.usePotion(g, 2);
  assert(Math.abs(r3.effDamage(g) / dmg0 - (1 + Pot.EFF.dmg)) < 0.01, 'la Furia alza il danno del valore dichiarato');
  assert(Math.abs(del0 / r3.effFireDelay(g) - (1 + Pot.EFF.rate)) < 0.01, 'la Frenesia alza la cadenza');
  assert(Math.abs(r3.effSpeed(g) / spd0 - (1 + Pot.EFF.speed)) < 0.01, 'la Fretta alza la velocita');
  const senzaFor = r3.effDamage(g);
  g.buys.st_for = 12;
  assert(r3.effDamage(g) > senzaFor, 'la FORZA rende la Furia piu forte');
  assert(Math.abs(r3.effDamage(g) / dmg0 - (1 + Pot.EFF.dmg * Pot.powMult(12))) < 0.01, 'esattamente del moltiplicatore dichiarato');
  // Costituzione: quanto cura
  g.buffs = {}; g.potCd = 0; g.buys.st_cos = 0; g.hp = 1; g.belt[0] = { id: 'p_cura', n: 2 };
  const mx = r3.effMaxHp(g); r3.usePotion(g, 0); const curaBase = g.hp - 1;
  g.buys.st_cos = 12; g.hp = 1; g.potCd = 0; r3.usePotion(g, 0);
  const curaAlta = g.hp - 1;
  assert(curaAlta > curaBase, 'la COSTITUZIONE fa curare di piu');
  assert(Math.abs(curaAlta / (mx * Pot.EFF.heal * Pot.healMult(12)) - 1) < 0.05, 'quanto dichiarato dal catalogo');
  // Intelligenza: quanto dura
  g.buys.st_int = 0; g.potCd = 0; g.belt[1] = { id: 'p_furia', n: 9 }; r3.usePotion(g, 1); const durBase = g.buffs.po_dmg;
  g.buys.st_int = 12; g.potCd = 0; r3.usePotion(g, 1);
  assert(g.buffs.po_dmg > durBase, "l'INTELLIGENZA allunga gli effetti");
  // Destrezza: quanto in fretta ribevi
  g.buys.st_des = 0; g.potCd = 0; r3.usePotion(g, 1); const cdBase = g.potCd;
  g.buys.st_des = 12; g.potCd = 0; r3.usePotion(g, 1);
  assert(g.potCd < cdBase, 'la DESTREZZA accorcia il cooldown');
  assert(g.potCd >= Pot.COOLDOWN * 0.6 - 0.001, 'ma non sotto il pavimento previsto');

  // --- 6) le cariche SOPRAVVIVONO alla morte (regola scelta da Paolo) ---
  const r4 = new Room('v171e'); const h = r4.addPlayer('e', conn, 'E', 'guerriero'); r4.startGame(); r4.phase = C.PHASE_COMBAT;
  h.belt[0] = { id: 'p_cura', n: 2 }; h.belt[1] = { id: 'p_furia', n: 1 };
  h.down = true; h.downT = -1; h.lives = 2; r4.updatePlayers(1 / C.TICK_RATE);
  assert(h.lives === 1, 'la vita si perde');
  assert(h.belt[0].n === 2 && h.belt[1].n === 1, 'le cariche restano: quello che hai comprato e tuo finche non lo bevi');

  // --- 7) la cintura arriva al client, e compatta ---
  const snap = r4.snapshot();
  const me = snap.players.find(x => x.i === 'e');
  assert(Array.isArray(me.bt) && me.bt.length === Pot.SLOTS, 'lo snapshot porta i tre slot');
  assert(me.bt[0][0] === Pot.BY_ID.p_cura.idx && me.bt[0][1] === 2, 'per indice e cariche, non per nome');
  assert(me.bt[2] === 0, 'lo slot vuoto costa uno zero');
  h.potCd = 3; h.potCdMax = 6;
  assert(Math.abs(r4.snapshot().players.find(x => x.i === 'e').pcd - 0.5) < 0.01, 'e il cooldown viaggia come frazione, per il velo');

  // --- 8) il catalogo e coerente con se stesso ---
  const ids = {};
  for (const it of Pot.POTIONS) {
    assert(!ids[it.id], 'ogni pozione ha un id suo: ' + it.id); ids[it.id] = 1;
    assert(it.cost > 0 && it.name && it.icon && it.desc, it.name + ' e completa');
    if (it.kind === 'heal') assert(it.heal > 0, it.name + ' cura una frazione dei PV');
    else assert(it.buff && it.dur > 0, it.name + ' ha una chiave di buff e una durata');
  }
  // un buff che nessuno legge non farebbe nulla e nessun test se ne accorgerebbe: qui si controlla
  const room = fs.readFileSync(require('path').join(__dirname, '..', 'server', 'Room.js'), 'utf8');
  for (const it of Pot.POTIONS) if (it.buff) assert(room.includes('p.buffs.' + it.buff), 'la chiave ' + it.buff + ' e davvero letta da Room.js');
  ok('novita v1.71 verificate');
}


// ===================== v1.72 — IL BANDITORE: magazzino e taglie =====================
// Due mestieri in uno, e ognuno cambia una regola che c'era prima: l'equipaggiamento sostituito non
// sparisce piu' (magazzino, riequipaggiabile gratis) e la partita ha per la prima volta un obiettivo
// che sopravvive alla singola ondata (la taglia).
function testV172() {
  console.log('\n[TEST 42] Novita v1.72 — Banditore: magazzino, ricompra, taglie');
  const conn = { send() {} };

  // --- 1) il magazzino ---
  const r = new Room('v172a'); const p = r.addPlayer('a', conn, 'A', 'guerriero'); r.startGame();
  const partenza = Object.keys(p.owned);
  assert(partenza.length === Object.keys(p.gear).length, "l'equipaggiamento di partenza e gia nel magazzino");
  assert(partenza.every(id => Gear.BY_ID[id]), 'e sono oggetti veri');
  r.enterMarket();
  assert(!!r.bandit, 'il Banditore ha un posto nel villaggio');
  assert(!r.map.village.npcs.find(n => n.bnd).soon, "e la sua bottega non e piu chiusa");
  p.x = r.gearMerchant.x; p.y = r.gearMerchant.y; p.coins = 1000;
  r.buyGear('a', 'gue_spadone'); r.buyGear('a', 'gue_alabarda');
  assert(p.gear.weapon === 'gue_alabarda', "l'ultima comprata e quella addosso");
  assert(p.owned.gue_spadone && p.owned.gue_alabarda, 'ma la precedente resta TUA: non sparisce piu nel nulla');
  const c1 = p.coins;
  r.buyGear('a', 'gue_spadone');
  assert(p.coins === c1, 'rimettersi addosso un oggetto posseduto non costa nulla');
  assert(p.gear.weapon === 'gue_spadone', 'ed e davvero tornato addosso');

  // --- 2) la ricompra ---
  p.x = r.bandit.x; p.y = r.bandit.y;
  const c2 = p.coins;
  r.sellGear('a', 'gue_alabarda');
  assert(p.coins - c2 === Math.floor(Gear.BY_ID.gue_alabarda.cost * C.SELL_BACK), 'venduta a meta prezzo esatto');
  assert(!p.owned.gue_alabarda, 'e non e piu nel magazzino');
  r.sellGear('a', 'gue_spadone');
  assert(!!p.owned.gue_spadone, 'quello che hai ADDOSSO non si vende');
  r.sellGear('a', 'gue_spada');
  assert(!!p.owned.gue_spada, "e nemmeno quello di partenza: vale zero e lascerebbe lo slot senza fondo");
  const lontano = c2; p.x = r.bandit.x + 900;
  const c3 = p.coins; r.sellGear('a', 'gue_alabarda');
  assert(p.coins === c3, 'da lontano il banco non risponde');
  p.x = r.bandit.x;
  // riaverla dopo averla venduta costa di nuovo intero
  const c4 = p.coins; p.x = r.gearMerchant.x; p.y = r.gearMerchant.y; r.buyGear('a', 'gue_alabarda');
  assert(c4 - p.coins === Gear.BY_ID.gue_alabarda.cost, 'ricomprare cio che hai venduto costa di nuovo intero');

  // --- 3) le tre offerte ---
  p.x = r.bandit.x; p.y = r.bandit.y;
  const off = r._offerteTaglie(p);
  assert(off.length === Bnt.OFFERTE, 'il banco appende ' + Bnt.OFFERTE + ' taglie');
  assert(new Set(off.map(o => o.k)).size === off.length, 'tutte di tipo diverso: si sceglie fra tre cose diverse');
  assert(off.every(o => o.n > 0 && o.pay > 0 && o.testo), 'ognuna ha bersaglio, paga e una frase leggibile');
  const stesse = r._offerteTaglie(p);
  assert(JSON.stringify(stesse) === JSON.stringify(off), 'riavvicinarsi NON rigenera le offerte (niente slot machine)');
  r.takeBounty('a', 1);
  assert(p.bounty && p.bounty.k === off[1].k, 'si accetta quella che si clicca');
  assert(p.bountyOffer === null, 'e le altre due spariscono');
  const tenuta = p.bounty.k;
  r.takeBounty('a', 0);
  assert(p.bounty.k === tenuta, 'una taglia alla volta: la seconda non entra');

  // --- 4) ogni tipo di taglia si completa DAVVERO e paga il dichiarato ---
  for (const kind of Bnt.KINDS.map(k => k.id)) {
    const rr = new Room('v172_' + kind); const q = rr.addPlayer('b', conn, 'B', 'guerriero'); rr.startGame(); rr.phase = C.PHASE_COMBAT;
    q.bounty = Bnt.istanza(kind, 4, 'skeleton', 'Zombie Putrido');
    const bers = q.bounty.n, paga = q.bounty.pay, c0 = q.coins;
    for (let i = 1; i <= bers; i++) {
      if (kind === 'combo') rr.bountyTick(q, 'combo', i);
      else if (kind === 'specie') rr.bountyTick(q, 'specie', 1, 'skeleton');
      else rr.bountyTick(q, kind, 1);
    }
    assert(q.bounty === null, 'la taglia "' + kind + '" si chiude al bersaglio');
    assert(q.coins - c0 === paga, 'e paga esattamente quello che aveva promesso (' + kind + ')');
  }
  // la specie sbagliata non conta
  const rs = new Room('v172s'); const z = rs.addPlayer('c', conn, 'C', 'mago'); rs.startGame();
  z.bounty = Bnt.istanza('specie', 4, 'slime', 'Melma');
  for (let i = 0; i < 60; i++) rs.bountyTick(z, 'specie', 1, 'skeleton');
  assert(z.bounty && z.bounty.have === 0, 'il contratto mirato conta SOLO la specie giusta');
  // la combo e un record, non una somma
  z.bounty = Bnt.istanza('combo', 4);
  rs.bountyTick(z, 'combo', 5); rs.bountyTick(z, 'combo', 3);
  assert(z.bounty.have === 5, 'la combo tiene il RECORD, non somma i colpi');

  // --- 5) gli agganci veri: uccidere e aprire casse fanno salire il contatore da soli ---
  const rk = new Room('v172k'); const k = rk.addPlayer('d', conn, 'D', 'guerriero'); rk.startGame(); rk.phase = C.PHASE_COMBAT;
  k.bounty = Bnt.istanza('caccia', 3);
  const m1 = rk.spawnMonster('skeleton', k.x + 60, k.y); rk.killMonster(m1, k);
  assert(k.bounty.have === 1, 'uccidere un nemico fa salire la caccia grossa');
  k.bounty = Bnt.istanza('specie', 3, 'slime', 'Melma');
  const m2 = rk.spawnMonster('skeleton', k.x + 60, k.y); rk.killMonster(m2, k);
  assert(k.bounty.have === 0, 'ma non il contratto su un altro tipo');
  const m3 = rk.spawnMonster('slime', k.x + 60, k.y); rk.killMonster(m3, k);
  assert(k.bounty.have === 1, 'quello giusto si');
  k.bounty = Bnt.istanza('elite', 3);
  const m4 = rk.spawnMonster('skeleton', k.x + 60, k.y); m4.elite = true; rk.killMonster(m4, k);
  assert(k.bounty.have === 1, 'un elite conta per le teste grosse');
  k.bounty = Bnt.istanza('casse', 3);
  rk.crates.length = 0; rk.crates.push({ eid: 1, x: k.x, y: k.y, r: 16, mimic: false, opened: false });
  rk.updatePickups(1 / C.TICK_RATE);
  assert(k.bounty.have === 1, 'aprire una cassa conta per il saccheggio');

  // --- 6) "nessun caduto": si azzera se cade qualcuno, si chiude se l'ondata finisce pulita ---
  const rn = new Room('v172n'); const w = rn.addPlayer('e', conn, 'E', 'guerriero'); rn.startGame(); rn.phase = C.PHASE_COMBAT;
  w.bounty = Bnt.istanza('illeso', 3);
  assert(w.noLifeLost === true, "a inizio ondata la lavagna e pulita");
  w.down = true; w.downT = -1; w.lives = 2; rn.updatePlayers(1 / C.TICK_RATE);
  assert(w.noLifeLost === false, 'perdere una vita la sporca');
  rn.monsters.length = 0; rn.pending = 0; rn._checkWaveClear();
  assert(w.bounty && w.bounty.have === 0, "e l'ondata finita non chiude la taglia");
  // ondata nuova, questa volta pulita
  const rn2 = new Room('v172n2'); const w2 = rn2.addPlayer('f', conn, 'F', 'guerriero'); rn2.startGame(); rn2.phase = C.PHASE_COMBAT;
  w2.bounty = Bnt.istanza('illeso', 3); const c5 = w2.coins;
  rn2.monsters.length = 0; rn2.pending = 0; rn2._checkWaveClear();
  assert(w2.bounty === null && w2.coins > c5, "un'ondata senza cadute la chiude e la paga");

  // --- 7) la taglia arriva al client, e si vede in partita ---
  const rc = new Room('v172c'); const y = rc.addPlayer('g', conn, 'G', 'ladro'); rc.startGame();
  y.bounty = Bnt.istanza('caccia', 5); y.bounty.have = 7;
  const me = rc.snapshot().players.find(x => x.i === 'g');
  assert(me.bo && me.bo.h === 7 && me.bo.n === y.bounty.n, 'lo snapshot porta avanzamento e bersaglio');
  assert(me.bo.t && me.bo.i, 'con la frase e l icona, per la riga in alto a sinistra');
  y.bounty = null;
  assert(rc.snapshot().players.find(x => x.i === 'g').bo === undefined, 'senza taglia non si spende un byte');

  // --- 8) ogni tipo del catalogo e DAVVERO agganciato a qualcosa in Room.js ---
  const room = fs.readFileSync(require('path').join(__dirname, '..', 'server', 'Room.js'), 'utf8');
  for (const kk of Bnt.KINDS) assert(room.includes("'" + kk.id + "'"), 'il tipo ' + kk.id + ' e agganciato in Room.js');
  ok('novita v1.72 verificate');
}


// ===================== v1.73 — LA CARTOMANTE: 5 carte accese =====================
// La novita' rischiosa non e' il tetto: e' che per la prima volta un potere si puo' TOGLIERE. Fino alla
// 1.72 le carte si sommavano dentro il personaggio e non uscivano piu'. Ora tutto si ricostruisce da zero
// (statistiche base -> statistiche comprate -> carte accese -> sinergie), e questi test difendono proprio
// quello: che spegnere e riaccendere riporti ESATTAMENTE al punto di prima, senza lasciare residui.
function testV173() {
  console.log('\n[TEST 43] Novita v1.73 — Cartomante: 5 carte accese, ricalcolo da zero');
  const conn = { send() {} };
  const prendi = (r, p, id) => { p.boonOffer = [id]; r.pickBoon(p.id, id); };

  // --- 1) il tetto ---
  const r = new Room('v173a'); const p = r.addPlayer('a', conn, 'A', 'guerriero'); r.startGame(); r.phase = C.PHASE_SHOP;
  assert(C.MAX_CARDS === 5, 'il tetto e cinque, e sta nelle costanti');
  const sette = ['ricochet', 'pierce', 'crit', 'swift', 'thorns', 'giant', 'vampire'];
  for (const id of sette) prendi(r, p, id);
  assert(Object.keys(p.boonsOwned).length === 7, 'le carte si prendono tutte: restano tue');
  assert(r._carteAccese(p) === C.MAX_CARDS, 'ma accese ce ne stanno cinque');
  assert(!p.cardOn.giant && !p.cardOn.vampire, 'la sesta e la settima arrivano SPENTE, non bloccano la scelta');
  assert(p.cardOn.ricochet && p.cardOn.thorns, 'le prime cinque restano accese');

  // --- 2) lo stesso tipo preso due volte occupa UN posto solo ---
  const r2 = new Room('v173b'); const q = r2.addPlayer('b', conn, 'B', 'mago'); r2.startGame(); r2.phase = C.PHASE_SHOP;
  prendi(r2, q, 'ricochet'); prendi(r2, q, 'ricochet'); prendi(r2, q, 'ricochet');
  assert(q.boonsOwned.ricochet === 3, 'tre esemplari della stessa carta');
  assert(r2._carteAccese(q) === 1, 'ma un solo posto occupato: il tetto conta carte DIVERSE');
  assert(q.boon.bounce === 3, 'e i tre esemplari fanno effetto tutti e tre');

  // --- 3) spegnere toglie DAVVERO l'effetto, riaccendere lo rimette identico ---
  const r3 = new Room('v173c'); const g = r3.addPlayer('c', conn, 'C', 'guerriero'); r3.startGame(); r3.phase = C.PHASE_SHOP;
  prendi(r3, g, 'crit'); prendi(r3, g, 'crit');
  const critAcceso = g.stats.critChance, multAcceso = g.stats.critMult;
  r3.enterMarket(); assert(!!r3.seer, 'la Cartomante ha un posto nel villaggio');
  g.x = r3.seer.x + 900; r3.toggleCard('c', 'crit');
  assert(g.cardOn.crit, 'da lontano il tavolo non risponde');
  g.x = r3.seer.x; g.y = r3.seer.y;
  r3.toggleCard('c', 'crit');
  assert(!g.cardOn.crit, 'spenta');
  assert(Math.abs(g.stats.critChance - 0.03) < 1e-9, "e il bonus e sparito davvero, non e rimasto attaccato");
  r3.toggleCard('c', 'crit');
  assert(Math.abs(g.stats.critChance - critAcceso) < 1e-9 && Math.abs(g.stats.critMult - multAcceso) < 1e-9,
    'riaccesa: torna ESATTAMENTE come prima, senza raddoppiare ne perdere pezzi');
  // dieci giri di spegni/accendi non devono derivare di un millesimo
  for (let i = 0; i < 10; i++) { r3.toggleCard('c', 'crit'); r3.toggleCard('c', 'crit'); }
  assert(Math.abs(g.stats.critChance - critAcceso) < 1e-9, 'dieci giri non fanno derivare i valori');

  // --- 4) le statistiche comprate coi punti sopravvivono al ricalcolo ---
  const r4 = new Room('v173d'); const h = r4.addPlayer('d', conn, 'D', 'ladro'); r4.startGame(); r4.phase = C.PHASE_SHOP;
  h.points = 20; for (let i = 0; i < 4; i++) r4.buyStat('d', 'st_des');
  const desPrima = h.stats.schoolDmg.ranged;
  prendi(r4, h, 'swift');
  r4.enterMarket(); h.x = r4.seer.x; h.y = r4.seer.y;
  r4.toggleCard('d', 'swift'); r4.toggleCard('d', 'swift');
  assert(Math.abs(h.stats.schoolDmg.ranged - desPrima) < 1e-9, 'la Destrezza comprata resta intatta dopo il ricalcolo');
  assert(h.buys.st_des === 4, 'e i livelli comprati non si perdono');

  // --- 5) il limite non si aggira dal client ---
  const r5 = new Room('v173e'); const k = r5.addPlayer('e', conn, 'E', 'guerriero'); r5.startGame(); r5.phase = C.PHASE_SHOP;
  for (const id of ['ricochet', 'pierce', 'crit', 'swift', 'thorns', 'giant']) prendi(r5, k, id);
  r5.enterMarket(); k.x = r5.seer.x; k.y = r5.seer.y;
  r5.toggleCard('e', 'giant');
  assert(!k.cardOn.giant && r5._carteAccese(k) === C.MAX_CARDS, 'con cinque accese la sesta non entra');
  r5.toggleCard('e', 'thorns'); r5.toggleCard('e', 'giant');
  assert(k.cardOn.giant && !k.cardOn.thorns, 'ma liberando un posto entra');
  r5.toggleCard('e', 'boon_inesistente');
  assert(r5._carteAccese(k) === C.MAX_CARDS, 'una carta che non possiedi non si accende');

  // --- 6) i PV: alzare il massimo cura, abbassarlo taglia, e non si guadagna vita a ogni giro ---
  const r6 = new Room('v173f'); const v = r6.addPlayer('f', conn, 'F', 'guerriero'); r6.startGame(); r6.phase = C.PHASE_SHOP;
  const max0 = r6.effMaxHp(v);
  v.hp = 100;
  prendi(r6, v, 'juggernaut');
  assert(r6.effMaxHp(v) === max0 + 45, 'Colosso alza il massimo di 45');
  assert(v.hp === 100, 'ma NON cura (v1.74): rimettere in piedi e mestiere dell Ostessa');
  r6.enterMarket(); v.x = r6.seer.x; v.y = r6.seer.y;
  r6.toggleCard('f', 'juggernaut');
  assert(r6.effMaxHp(v) === max0 && v.hp === 100, 'spegnendolo il massimo torna giu e i PV correnti restano');
  r6.toggleCard('f', 'juggernaut');
  assert(v.hp === 100, 'e riaccendendolo restano quelli: niente cura di striscio');
  v.hp = r6.effMaxHp(v); r6.toggleCard('f', 'juggernaut');
  assert(v.hp === r6.effMaxHp(v) && v.hp === max0, 'con i PV pieni, spegnere li taglia al nuovo tetto');
  r6.toggleCard('f', 'juggernaut');
  assert(v.hp === max0 + 45, 'ma riaccendendolo il taglio torna: la Cartomante non e una tassa sulla vita');
  const hpA = v.hp; for (let i = 0; i < 8; i++) { r6.toggleCard('f', 'juggernaut'); r6.toggleCard('f', 'juggernaut'); }
  assert(v.hp === hpA, 'e otto giri non spostano di un punto, ne in su ne in giu');

  // --- 7) Ultima Occasione: la carica spesa non torna spegnendo e riaccendendo ---
  const r7 = new Room('v173g'); const d = r7.addPlayer('g', conn, 'G', 'mago'); r7.startGame(); r7.phase = C.PHASE_SHOP;
  prendi(r7, d, 'defiance');
  assert(d.defianceLeft === 1, 'Ultima Occasione da una carica');
  d.defianceLeft = 0; d.defianceUsed = 1;                     // consumata giocando
  r7.enterMarket(); d.x = r7.seer.x; d.y = r7.seer.y;
  r7.toggleCard('g', 'defiance'); r7.toggleCard('g', 'defiance');
  assert(d.defianceLeft === 0, 'spegnere e riaccendere NON la resuscita');

  // --- 8) le sinergie seguono le carte accese, in tutti e due i versi ---
  const r8 = new Room('v173h'); const y = r8.addPlayer('h', conn, 'H', 'mago'); r8.startGame(); r8.phase = C.PHASE_SHOP;
  prendi(r8, y, 'poison'); prendi(r8, y, 'explode');
  assert(y.synActive.toxic_burst === 1 && y.boon.toxicBurst === 1, 'due carte accese formano la sinergia');
  r8.enterMarket(); y.x = r8.seer.x; y.y = r8.seer.y;
  r8.toggleCard('h', 'poison');
  assert(!y.synActive.toxic_burst && !y.boon.toxicBurst, 'spegnerne una spegne anche la sinergia e il suo flag');
  r8.toggleCard('h', 'poison');
  assert(y.synActive.toxic_burst === 1, 'riaccenderla la rimette');

  // --- 9) cio' che arriva al client ---
  const inviati = []; const conn9 = { send(s) { inviati.push(JSON.parse(s)); } };
  const r9 = new Room('v173i'); const z = r9.addPlayer('i', conn9, 'I', 'guerriero'); r9.startGame(); r9.phase = C.PHASE_SHOP;
  for (const id of ['ricochet', 'pierce', 'crit', 'swift', 'thorns', 'giant']) prendi(r9, z, id);
  const boons = inviati.filter(m => m.t === C.MSG.BOONS).pop();
  assert(boons && boons.max === C.MAX_CARDS && boons.active === C.MAX_CARDS, 'il client sa quante ne stanno e quante ne hai accese');
  assert(boons.boons.some(b => b.id === 'giant' && b.on === 0), 'e sa quale e spenta');
  r9.enterMarket(); z.x = r9.seer.x; z.y = r9.seer.y; inviati.length = 0; r9.offerSeer(z, 1);
  const off = inviati.filter(m => m.t === C.MSG.OFFER_SEER).pop();
  assert(off && off.cards.length === 6, 'il tavolo elenca TUTTE le carte, accese e spente');
  assert(off.cards.every(c => c.name && c.icon && c.desc !== undefined), 'ognuna con nome, icona e cosa fa');
  ok('novita v1.73 verificate');
}


// ===================== v1.74 — L'OSTESSA, e la regola sui PV =====================
// Una bottega semplice e una regola che tocca tutto il gioco: ALZARE IL MASSIMO NON CURA MAI. Senza quella
// regola l'Ostessa non avrebbe mestiere, perche' un punto di Costituzione la sostituirebbe gratis.
function testV174() {
  console.log('\n[TEST 44] Novita v1.74 — Ostessa: riposo a pagamento, e i PV massimi non curano');
  const conn = { send() {} };
  const prendi = (r, p, id) => { p.boonOffer = [id]; r.pickBoon(p.id, id); };

  // --- 1) alzare il massimo non cura, da nessuna parte arrivi ---
  const r = new Room('v174a'); const p = r.addPlayer('a', conn, 'A', 'guerriero'); r.startGame(); r.phase = C.PHASE_SHOP;
  p.hp = 100; p.points = 30; const mx0 = r.effMaxHp(p);
  r.buyStat('a', 'st_cos');
  assert(r.effMaxHp(p) === mx0 + 20, 'la Costituzione alza il massimo di 20');
  assert(p.hp === 100, 'ma NON cura: altrimenti l Ostessa non servirebbe a niente');
  for (let i = 0; i < 5; i++) r.buyStat('a', 'st_cos');
  assert(p.hp === 100, 'nemmeno sei punti di fila curano di un solo PV');
  prendi(r, p, 'juggernaut'); assert(p.hp === 100, 'e nemmeno Colosso');
  prendi(r, p, 'overheal'); assert(p.hp === 100, 'e nemmeno Scudo Vitale');
  assert(r.effMaxHp(p) > mx0 + 100, 'il massimo pero e cresciuto davvero');

  // --- 2) il debito: spegnere e riaccendere resta neutro ---
  const r2 = new Room('v174b'); const q = r2.addPlayer('b', conn, 'B', 'mago'); r2.startGame(); r2.phase = C.PHASE_SHOP;
  prendi(r2, q, 'juggernaut');
  r2.enterMarket(); q.x = r2.seer.x; q.y = r2.seer.y;
  q.hp = r2.effMaxHp(q); const pieno = q.hp;
  r2.toggleCard('b', 'juggernaut');
  assert(q.hpDebt === 45, 'spegnendo, i PV tagliati vengono SEGNATI, non persi');
  r2.toggleCard('b', 'juggernaut');
  assert(q.hp === pieno && q.hpDebt === 0, 'riaccendendo tornano, e il debito si chiude');
  // ma il debito non restituisce piu' di quanto era stato tolto
  q.hp = 40; r2.toggleCard('b', 'juggernaut'); r2.toggleCard('b', 'juggernaut');
  assert(q.hp === 40, 'se non c era nulla da tagliare non c e nulla da rendere');

  // --- 3) l'Ostessa ---
  const r3 = new Room('v174c'); const g = r3.addPlayer('c', conn, 'C', 'guerriero'); r3.startGame();
  r3.enterMarket();
  assert(!!r3.innkeeper, "l'Ostessa ha un posto nel villaggio");
  assert(!r3.map.village.npcs.find(n => n.inn).soon, 'e la sua bottega non e piu chiusa');
  assert(r3.map.village.npcs.every(n => !n.soon), 'con lei il villaggio e completo: nessuna bottega chiusa');
  const mx = r3.effMaxHp(g);
  g.hp = 100; g.coins = 500;
  // da lontano non risponde
  g.x = r3.innkeeper.x + 900; g.y = r3.innkeeper.y;
  r3.restAtInn('c');
  assert(g.hp === 100 && g.coins === 500, 'da lontano il focolare non risponde');
  g.x = r3.innkeeper.x; g.y = r3.innkeeper.y;
  const conto = r3._contoOstessa(g);
  assert(conto.manca === mx - 100, 'il conto sa quanti PV mancano');
  assert(conto.pieno === Math.ceil((mx - 100) * C.INN_PER_HP), 'e il prezzo e proporzionale, non forfettario');
  r3.restAtInn('c');
  assert(g.hp === mx, 'pagando si torna al massimo');
  assert(g.coins === 500 - conto.pieno, 'e si paga esattamente il conto');
  // due volte non si paga
  const c2 = g.coins; r3.restAtInn('c');
  assert(g.coins === c2, 'a PV pieni non si paga nulla');
  // cura parziale
  g.hp = 100; g.coins = 20;
  const conto2 = r3._contoOstessa(g);
  assert(conto2.curabili > 0 && conto2.curabili < conto2.manca, 'con poche monete si compra una cura parziale');
  r3.restAtInn('c');
  assert(g.hp === 100 + conto2.curabili, 'e i PV comprati arrivano tutti');
  assert(g.coins === 20 - conto2.spesa, 'pagando solo quelli');
  // senza monete
  g.coins = 0; const hp0 = g.hp; r3.restAtInn('c');
  assert(g.hp === hp0, 'senza monete non si cura nulla');
  // piu' conveniente della pozione di Cura, come da taratura
  const Pot2 = require('../shared/potions.js');
  const perPvPozione = Pot2.BY_ID.p_cura.cost / (mx * Pot2.EFF.heal);
  assert(C.INN_PER_HP < perPvPozione, 'il riposo costa meno a PV della pozione, che pero si beve fra i nemici');

  // --- 4) il riposo comprato cancella il debito, altrimenti sarebbe vita regalata ---
  const r4 = new Room('v174d'); const h = r4.addPlayer('d', conn, 'D', 'guerriero'); r4.startGame(); r4.phase = C.PHASE_SHOP;
  prendi(r4, h, 'juggernaut');
  r4.enterMarket(); h.x = r4.seer.x; h.y = r4.seer.y; h.hp = r4.effMaxHp(h);
  r4.toggleCard('d', 'juggernaut');
  assert(h.hpDebt === 45, 'spegnendo con i PV pieni si apre un debito di 45');
  h.hp = 100;                                    // poi si combatte e ci si fa male
  h.x = r4.innkeeper.x; h.y = r4.innkeeper.y; h.coins = 500;
  r4.restAtInn('d');
  assert(h.hp === r4.effMaxHp(h), 'al focolare si torna al massimo');
  assert(h.hpDebt === 0, 'e i PV pagati cancellano il debito: non si viene rimborsati due volte');
  const hpPagato = h.hp;
  h.x = r4.seer.x; h.y = r4.seer.y; r4.toggleCard('d', 'juggernaut');
  assert(h.hp === hpPagato, 'e riaccendere la carta non regala i PV gia comprati');

  // --- 5) cio' che arriva al client ---
  const inviati = []; const conn5 = { send(x) { inviati.push(JSON.parse(x)); } };
  const r5 = new Room('v174e'); const z = r5.addPlayer('e', conn5, 'E', 'ladro'); r5.startGame();
  r5.enterMarket(); z.x = r5.innkeeper.x; z.y = r5.innkeeper.y; z.hp = 30; z.coins = 120;
  inviati.length = 0; r5.offerInn(z, 1);
  const off = inviati.filter(m => m.t === C.MSG.OFFER_INN).pop();
  assert(off && off.hp === 30 && off.mx === Math.round(r5.effMaxHp(z)), 'il pannello riceve vita e massimo');
  assert(off.manca > 0 && off.pieno > 0 && off.perHp === C.INN_PER_HP, 'quanto manca, quanto costa e il prezzo al PV');
  r5.updateInn();
  const snap = r5.snapshot().players.find(x => x.i === 'e');
  assert(snap.ni === 1, 'e avvicinandosi lo snapshot dice che sei al focolare');
  ok('novita v1.74 verificate');
}

console.log('=================================================='); console.log('  DUNGEON RIFT — SUITE DI TEST (v1.74)'); console.log('==================================================');
const T0 = Date.now();
testMapThemes(); testLives(); testBoons(); testWeaponEvo(); testModes(); testHitstop(); testXpItems(); testV16(); testV17(); testV18(); testV19(); testV110(); testV111(); testV112(); testV113(); testV139(); testV142(); testV143(); testV145(); testV147(); testV149(); testV150(); testV151(); testV152(); testV153(); testV157(); testV158(); testV159(); testV160(); testV161(); testV162(); testV163(); testV164(); testV166(); testV167(); testV168(); testV169(); testV170(); testV171(); testV172(); testV173(); testV174(); testSanity(); testFullRun(1, 'solo'); testFullRun(3, 'trio'); testFullRun(6, 'stress');
console.log('\n=================================================='); console.log(`  RISULTATO: ${PASS} passati, ${FAIL} falliti  (${((Date.now() - T0) / 1000).toFixed(1)}s)`); console.log('==================================================');
process.exit(FAIL > 0 ? 1 : 0);
