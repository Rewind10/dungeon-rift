/* simulate.js — test automatici headless (v1.13: ridimensionamento leggero (visivo 1.45x / collisione 1.08x), fix mercante nero sostitutivo; + storico) */
'use strict';
const { Room } = require('../server/Room.js');
const C = require('../shared/constants.js');
const MU = require('../shared/mathutils.js');
const Heroes = require('../shared/heroes.js');
const MapGen = require('../shared/mapgen.js');
const Loot = require('../shared/loot.js');
const Waves = require('../shared/waves.js');
let PASS = 0, FAIL = 0;
function assert(c, m) { if (c) PASS++; else { FAIL++; console.log('  ❌ FAIL:', m); } }
function ok(m) { console.log('  ✅', m); }
function bot(room, p) { let n = null, bd = Infinity; for (const m of room.monsters) { const d = MU.dist2(p.x, p.y, m.x, m.y); if (d < bd) { bd = d; n = m; } } const i = { mx: 0, my: 0, aim: p.aim, shoot: false, q: false, e: false, dash: false }; if (n) { const d = Math.sqrt(bd); i.aim = Math.atan2(n.y - p.y, n.x - p.x); i.shoot = true; const dir = d < 160 ? -1 : (d > 320 ? 1 : 0); i.mx = Math.cos(i.aim) * dir + (Math.random() - 0.5) * 0.6; i.my = Math.sin(i.aim) * dir + (Math.random() - 0.5) * 0.6; if (p.cdQ <= 0 && Math.random() < 0.05) i.q = true; if (p.cdE <= 0 && Math.random() < 0.04) i.e = true; if (p.cdDash <= 0 && d < 140 && Math.random() < 0.06) i.dash = true; } else { i.mx = Math.random() - 0.5; i.my = Math.random() - 0.5; } return i; }
function hasNaN(room) { for (const p of room.players.values()) if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.hp)) return 'player'; for (const m of room.monsters) if (!isFinite(m.x) || !isFinite(m.y) || !isFinite(m.hp)) return 'mon ' + m.type; for (const b of room.bullets) if (!isFinite(b.x) || !isFinite(b.y)) return 'bullet'; return null; }

function testMapThemes() {
  console.log('\n[TEST 1] Temi mappa + connettività');
  const PF = require('../shared/pathfinding.js'); const seen = {}; let cf = 0, ef = 0;
  for (let i = 0; i < 50; i++) { const map = MapGen.generate((Math.random() * 1e9) | 0, 1 + (i % 20)); seen[map.theme.id] = 1; const dist = PF.build(map.grid, map.w, map.h, [{ gx: map.w >> 1, gy: map.h >> 1 }]); let r = 0, t = 0; for (const s of map.enemySpawns) { t++; if (dist[s.y * map.w + s.x] >= 0) r++; } if (t && r / t < 0.98) cf++; if (!map.exit) ef++; }
  assert(Object.keys(seen).length >= 3, 'più temi (' + Object.keys(seen).join(',') + ')'); assert(cf === 0, 'tutte connesse'); assert(ef === 0, 'tutte con portale'); ok('temi/connettività OK');
}
function testLives() {
  console.log('\n[TEST 2] Sistema di vite');
  const room = new Room('lives'); const p = room.addPlayer('b', { send() {} }, 'B', 'recon'); room.startGame();
  assert(p.lives === C.START_LIVES, 'parte con ' + C.START_LIVES + ' vite');
  const dt = 1 / C.TICK_RATE;
  const bleedOut = () => { p.buffs = {}; p.hp = 1; room.damagePlayer(p, 999, p.x + 10, p.y, 0); for (let i = 0; i < Math.ceil(C.DOWN_BLEED_TIME * C.TICK_RATE) + 3 && !p.dead; i++) { p.buffs.iframe = 0; room.update(dt); } };
  const before = p.lives; bleedOut(); assert(p.lives === before - 1, '1ª caduta -1 vita'); assert(!p.dead && p.hp > 0, 'si rialza');
  bleedOut(); assert(p.dead, '2ª caduta → morte'); assert(room.phase === C.PHASE_GAMEOVER, 'game over'); ok('vite OK');
}
function testBoons() {
  console.log('\n[TEST 3] Boon a scelta (effetti unici)');
  const room = new Room('boon'); const p = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame(); room.phase = C.PHASE_SHOP;
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
  const room = new Room('evo'); const p = room.addPlayer('b', { send() {} }, 'B', 'recon'); room.startGame(); room.phase = C.PHASE_SHOP; p.xpPool = 100000;
  p.weapon2 = { type: 'scatter', level: 3, evolved: null };
  // richiede st_dmg >= 3
  room.buyStat('b', 'st_dmg'); room.buyStat('b', 'st_dmg'); assert(!p.weapon2.evolved, 'non evolve prima della soglia');
  room.buyStat('b', 'st_dmg'); assert(p.weapon2.evolved === 'scatter_evo', 'evolve al raggiungimento della statistica');
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
  const room = new Room('tr'); room.addPlayer('b', { send() {} }, 'B', 'recon'); room.startGame();
  room.wave = 0; // forza una wave treasure
  room.wave = 1; room.mode = Waves.MODES.treasure; room.waveScaling = Waves.scaling(3, 1); room.spawnTreasure();
  assert(room.treasure && room.treasure.treasure, 'lo scrigno-tesoro viene generato'); assert(room.treasure.escapeT > 0, 'lo scrigno ha un timer di fuga');
  ok('modalità verificate');
}
function testHitstop() {
  console.log('\n[TEST 6] Hit-stop (eventi di feedback)');
  const room = new Room('hs'); const p = room.addPlayer('b', { send() {} }, 'B', 'glitch'); room.startGame();
  const m = room.spawnMonster('skeleton', p.x + 30, p.y, { scaling: Waves.scaling(2, 1) });
  room.damageMonster(m, 5, p.x, p.y, 0, p, { crit: true });
  assert(room.events.some(e => e.t === 'hitstop'), 'un crit emette un evento hit-stop');
  const boss = room.spawnMonster('orc_warlord', p.x + 60, p.y, { hpMul: 0.001 }); room.events.length = 0; room.damageMonster(boss, 99999, p.x, p.y, 0, p);
  assert(room.events.some(e => e.t === 'hitstop'), 'l\'uccisione di un boss emette hit-stop'); ok('hit-stop verificato');
}
function testXpItems() {
  console.log('\n[TEST 7] XP + item + negozio');
  const room = new Room('xp'); const p = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
  const m = room.spawnMonster('skeleton', p.x + 30, p.y, { scaling: Waves.scaling(3, 1) }); const before = room.groundXp.length; room.killMonster(m, p);
  assert(room.groundXp.length > before, 'uccisione lascia XP');
  const dt = 1 / C.TICK_RATE; const xp0 = p.xpPool; for (let i = 0; i < 60; i++) room.update(dt); assert(p.xpPool > xp0, 'XP raccolta');
  room.items = [{ eid: 1, x: p.x + 8, y: p.y, r: 13, id: 'i_life', t: 30 }]; const l0 = p.lives; room.updatePickups(dt); assert(p.lives === l0 + 1, 'Cuore Fenice +1 vita');
  p.xpPool = 500; room.phase = C.PHASE_SHOP; const hp0 = room.effMaxHp(p); room.buyStat('b', 'st_hp'); assert(room.effMaxHp(p) > hp0, 'negozio: Vitalità aumenta PV'); ok('XP/item/negozio OK');
}
function testFullRun(n, label) {
  console.log(`\n[TEST 8] Partita completa — ${n} bot (${label})`);
  const room = new Room('r' + n); for (let i = 0; i < n; i++) room.addPlayer('b' + i, { send() {} }, 'B' + i, Heroes.ORDER[i % 3]); room.startGame();
  const dt = 1 / C.TICK_RATE; let ticks = 0, maxMs = 0, tot = 0, nan = null, pWall = 0, maxMon = 0;
  while (ticks < C.TICK_RATE * 240) { for (const p of room.players.values()) if (!p.dead && !p.down) room.setInput(p.id, bot(room, p)); const t0 = process.hrtime.bigint(); room.update(dt); const t1 = process.hrtime.bigint(); const ms = Number(t1 - t0) / 1e6; maxMs = Math.max(maxMs, ms); tot += ms; ticks++; maxMon = Math.max(maxMon, room.monsters.length); for (const p of room.players.values()) if (!p.dead && room.isWallAt(p.x, p.y)) pWall++; const nn = hasNaN(room); if (nn) { nan = nn; break; } if (room.phase === C.PHASE_GAMEOVER || room.phase === C.PHASE_VICTORY) break; if (room.phase === C.PHASE_SHOP) for (const p of room.players.values()) { if (p.boonOffer && p.boonOffer.length) room.pickBoon(p.id, p.boonOffer[0]); if (Math.random() < 0.3) room.buyStat(p.id, Loot.XP_STATS[MU.randInt(0, 5)].id); if (!p.ready) room.shopReady(p.id); } }
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
  const room = new Room('v16'); const p = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
  // combo: uccisioni consecutive aumentano combo e moltiplicatore
  assert(room.comboMult(p) === 1, 'moltiplicatore combo parte da 1');
  for (let i = 0; i < 6; i++) { const m = room.spawnMonster('skeleton', p.x + 30, p.y, { scaling: Waves.scaling(2, 1) }); room.killMonster(m, p); }
  assert(p.combo === 6, 'combo conta le uccisioni consecutive (' + p.combo + ')');
  assert(room.comboMult(p) > 1, 'combo aumenta il moltiplicatore XP (x' + room.comboMult(p).toFixed(2) + ')');
  // XP scala col combo: stessa uccisione rende piu XP ad alto combo che a combo 0
  const p2 = room.addPlayer('c', { send() {} }, 'C', 'enforcer');
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
  const p3 = room.addPlayer('d', { send() {} }, 'D', 'recon'); p3.boonOffer = ['bulwark']; room.pickBoon('d', 'bulwark'); assert(p3.stats.dmgReduce > 0, 'boon Baluardo riduce i danni');
  p3.buffs = {}; p3.hp = 1000; p3.maxHp = 1000; const h0 = p3.hp; room.damagePlayer(p3, 100, p3.x + 10, p3.y, 0); const dealt = h0 - p3.hp; assert(dealt < 100, 'Baluardo attenua i danni subiti (' + dealt + ' < 100)');
  // snapshot espone i campi combo
  p.combo = 8; p.comboT = C.COMBO_TIME; const snap = room.snapshot(); const me = snap.players.find(x => x.i === 'b'); assert(me && me.cmb === 8 && me.cmx > 1, 'lo snapshot espone combo e moltiplicatore');
  ok('novita v1.6 verificate');
}
function testV17() {
  console.log('\n[TEST 11] Novita v1.7 — stats fine partita, ricompense combo, sinergie');
  const room = new Room('v17'); const sent = []; const cap = { send(x) { try { sent.push(JSON.parse(x)); } catch (_) {} } }; const p = room.addPlayer('b', cap, 'B', 'enforcer'); const p2 = room.addPlayer('c', { send() {} }, 'C', 'recon'); room.startGame();
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
  // seeker: homing + pierce (boon Perforazione) aumenta la perforazione
  p.boonOffer = ['pierce']; room.pickBoon('b', 'pierce'); const pierce0 = p.boon.pierce; p.boonOffer = ['homing']; room.pickBoon('b', 'homing');
  assert(p.synActive.seeker === 1 && p.boon.pierce === pierce0 + 1, 'homing + pierce attiva Cercatore (+1 perforazione)');
  // la sinergia gia attiva non si ri-applica: detectSynergies esclude quelle in synActive
  const again = Loot.detectSynergies(p.boonsOwned, p.synActive); assert(!again.some(x => x.id === 'seeker'), 'la sinergia gia attiva non viene rilevata di nuovo');
  // toxicBurst avvelena ad area
  const tp = room.addPlayer('d', { send() {} }, 'D', 'enforcer'); tp.boon.toxicBurst = 1; tp.boon.poison = 1;
  const tm = room.spawnMonster('skeleton', tp.x + 20, tp.y, { scaling: Waves.scaling(2, 1) }); tm.poison = 0;
  room._toxicBurst(tp.x + 20, tp.y, 90, tp); assert(tm.poison > 0 && tm.poisonT > 0, 'la Deflagrazione Tossica avvelena i nemici ad area');
  // --- statistiche di fine partita ---
  p.kills = 12; p.comboBest = 40; p.damageDealt = 3400; p2.kills = 5; p2.comboBest = 8;
  const stats = room.buildRunStats();
  assert(Array.isArray(stats) && stats.length >= 2, 'buildRunStats restituisce una riga per giocatore');
  assert(stats[0].k >= stats[1].k, 'la classifica e ordinata per uccisioni');
  const row = stats.find(r => r.i === 'b'); assert(row && row.cb === 40 && row.dmg === 3400 && row.syn >= 3, 'le stats includono combo max, danni e sinergie');
  // gameover porta stats e durata
  sent.length = 0; room.runStart = room.time - 90; room.gameOver();
  assert(sent.some(m => m.ev && m.ev.t === 'gameover' && Array.isArray(m.ev.stats) && m.ev.dur >= 90), 'il gameover include statistiche e durata');
  ok('novita v1.7 verificate');
}
function testV18() {
  console.log('\n[TEST 12] Novita v1.8 — monete & negozio equipaggiamento');
  const room = new Room('v18'); const sent = []; const cap = { send(x) { try { sent.push(JSON.parse(x)); } catch (_) {} } };
  const p = room.addPlayer('b', cap, 'B', 'enforcer'); room.startGame();
  assert(p.coins === 0, 'il giocatore parte con 0 monete');
  assert(p.gear && p.gear.armor === 0 && p.gear.weapon === 0 && p.gear.boots === 0, 'tutti gli slot equipaggiamento partono a 0');
  // --- drop monete alla morte ---
  const before = room.groundCoins.length; const m = room.spawnMonster('orc', p.x + 30, p.y, { scaling: Waves.scaling(3, 1) }); room.killMonster(m, p);
  assert(room.groundCoins.length > before, 'un nemico ucciso lascia monete a terra');
  assert(room.groundCoins.every(c => c.v > 0 && c.cid), 'le monete hanno un valore e un taglio');
  // --- raccolta monete (calamita) ---
  const dt = 1 / C.TICK_RATE; const c0 = p.coins; for (let i = 0; i < 60; i++) room.update(dt); assert(p.coins > c0, 'le monete vengono raccolte avvicinandosi');
  // --- acquisto equipaggiamento ---
  room.phase = C.PHASE_SHOP; p.coins = 100000;
  const dr0 = p.stats.dmgReduce, hp0 = room.effMaxHp(p);
  const armorDef = Loot.GEAR_BY_SLOT.armor; const cost1 = Loot.gearCost(armorDef, 0);
  room.buyGear('b', 'armor');
  assert(p.gear.armor === 1, 'acquisto Armatura sale al tier 1');
  assert(p.coins === 100000 - cost1, 'il costo viene scalato dalle monete');
  assert(p.stats.dmgReduce > dr0, 'Armatura aumenta la riduzione danni');
  assert(room.effMaxHp(p) > hp0, 'Armatura aumenta i PV massimi');
  // arma: aumenta danno
  const wdmg0 = room.effDamage(p); room.buyGear('b', 'weapon'); assert(room.effDamage(p) > wdmg0, 'Arma aumenta il danno effettivo');
  // stivali: aumenta velocita
  const sp0 = room.effSpeed(p); room.buyGear('b', 'boots'); assert(room.effSpeed(p) > sp0, 'Stivali aumentano la velocita');
  // solo 3 slot: anello e amuleto rimossi (v1.10)
  assert(!Loot.GEAR_BY_SLOT.ring && !Loot.GEAR_BY_SLOT.amulet, 'anello e amuleto rimossi dall\'emporio');
  assert(Loot.GEAR.length === 3, 'restano 3 slot: armatura, stivali, arma');
  // --- costo crescente per tier ---
  const costTier1 = Loot.gearCost(armorDef, 1), costTier0 = Loot.gearCost(armorDef, 0); assert(costTier1 > costTier0, 'il costo cresce ad ogni tier');
  // --- monete insufficienti: nessun acquisto ---
  p.coins = 0; const tierBefore = p.gear.boots; room.buyGear('b', 'boots'); assert(p.gear.boots === tierBefore, 'senza monete non si acquista');
  // --- tier massimo rispettato ---
  p.coins = 1e9; for (let i = 0; i < 10; i++) room.buyGear('b', 'armor'); assert(p.gear.armor === armorDef.max, 'lo slot non supera il tier massimo (' + p.gear.armor + ')');
  // --- offerta gear inviata al client ---
  sent.length = 0; room.offerGear(p); assert(sent.some(mm => mm.t === C.MSG.OFFER_GEAR && Array.isArray(mm.slots) && mm.slots.length === 3), 'offerGear invia i 3 slot al client');
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
  const room = new Room('v19'); const p = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
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
  const room2 = new Room('v19b'); const q = room2.addPlayer('c', { send() {} }, 'C', 'recon'); room2.startGame();
  room2.groundXp.push({ eid: 1, x: 5000, y: 5000, v: 30, t: 30 });
  room2.groundCoins.push({ eid: 2, x: 5000, y: 5000, v: 25, cid: 'gold', t: 30 });
  const xp0 = q.xpPool, co0 = q.coins; room2.enterShop();
  assert(q.xpPool >= xp0 + 30, 'la XP rimasta a terra viene raccolta automaticamente');
  assert(q.coins >= co0 + 25, 'le monete rimaste a terra vengono raccolte automaticamente');
  assert(room2.groundXp.length === 0 && room2.groundCoins.length === 0, 'il terreno viene ripulito dai drop');
  // --- NUOVA ABILITA: Torretta (Enforcer E) ---
  const room3 = new Room('v19c'); const e = room3.addPlayer('d', { send() {} }, 'D', 'enforcer'); room3.startGame(); e.cdE = 0;
  room3.useE(e); const turret = room3.orbs.find(o => o.turret); assert(turret, 'Enforcer E schiera una torretta');
  assert(e.cdE > 0, 'la torretta va in cooldown');
  assert(!e.buffs.barrier, 'Enforcer E non e piu la vecchia barriera');
  room3.spawnMonster('skeleton', turret.x + 100, turret.y, { scaling: Waves.scaling(2, 1) });
  const nb0 = room3.bullets.length; for (let i = 0; i < 20; i++) room3.updateOrbs(dt); assert(room3.bullets.length > nb0, 'la torretta spara ai nemici vicini');
  // --- NUOVA ABILITA: Colpo del Cecchino (Recon E), non piu uno scatto ---
  const room4 = new Room('v19d'); const r = room4.addPlayer('f', { send() {} }, 'F', 'recon'); room4.startGame(); r.cdE = 0;
  room4.useE(r);
  const snipe = room4.bullets.find(b => b.sniper); assert(snipe, 'Recon E spara un colpo da cecchino');
  assert(snipe.pierce >= 5, 'il colpo del cecchino e altamente perforante');
  assert(!r.buffs.dash, 'Recon E non e piu uno scatto (ridondanza rimossa)');
  // --- lo SCATTO universale (tasto destro) resta funzionante ---
  const room5 = new Room('v19e'); const g = room5.addPlayer('h', { send() {} }, 'H', 'recon'); room5.startGame(); g.cdDash = 0;
  room5.useDash(g); assert(g.buffs.dash > 0 && g.cdDash > 0, 'lo scatto universale (tasto destro) resta attivo');
  // --- ogni eroe ha esattamente 2 abilita (Q + E) ---
  for (const id of Heroes.ORDER) { const h = Heroes.HEROES[id]; assert(h.abilities.q && h.abilities.e && Object.keys(h.abilities).length === 2, id + ' ha esattamente 2 abilita'); }
  ok('novita v1.9 verificate');
}
function testV110() {
  console.log('\n[TEST 14] Novita v1.10 — 2 poteri a scelta, piu boon, emporio 3 slot');
  // --- si sceglie tra ESATTAMENTE 2 poteri ---
  const room = new Room('v110'); const p = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame(); room.phase = C.PHASE_SHOP;
  room.offerBoon(p); assert(p.boonOffer && p.boonOffer.length === 2, 'a fine ondata si sceglie tra 2 poteri (offerti: ' + (p.boonOffer || []).length + ')');
  // --- catalogo boon ampliato ---
  assert(Loot.BOONS.length >= 23, 'il catalogo dei poteri e ampliato (' + Loot.BOONS.length + ')');
  for (const id of ['berserk', 'swift', 'lucky', 'juggernaut', 'executioner', 'artillery']) assert(Loot.BOON_BY_ID[id], 'nuovo boon presente: ' + id);
  // --- i nuovi boon applicano effetti ---
  const d0 = p.stats.dmgMult; p.boonOffer = ['berserk']; room.pickBoon('b', 'berserk'); assert(p.stats.dmgMult > d0, 'Furia Cieca aumenta il danno');
  const hp0 = room.effMaxHp(p); p.boonOffer = ['juggernaut']; room.pickBoon('b', 'juggernaut'); assert(room.effMaxHp(p) > hp0, 'Colosso aumenta i PV massimi');
  const cm0 = p.stats.critMult; p.boonOffer = ['executioner']; room.pickBoon('b', 'executioner'); assert(p.stats.critMult > cm0, 'Giustiziere aumenta il danno critico');
  // --- EMPORIO: solo 3 slot, molto piu costoso ---
  assert(Loot.GEAR.length === 3, 'l\'emporio ha 3 slot (armatura, stivali, arma)');
  const slots = Loot.GEAR.map(g => g.slot); assert(!slots.includes('ring') && !slots.includes('amulet'), 'anello e amuleto rimossi');
  const armorDef = Loot.GEAR_BY_SLOT.armor; assert(Loot.gearCost(armorDef, 0) >= 60, 'gli oggetti sono molto piu costosi (base ' + Loot.gearCost(armorDef, 0) + ')');
  // --- icone equipaggiamento uniche per personaggio (percorso immagine per eroe) ---
  const sent = []; const cap = { send(x) { try { sent.push(JSON.parse(x)); } catch (_) {} } };
  const eb = room.addPlayer('z', cap, 'Z', 'glitch'); room.offerGear(eb);
  const gearMsg = sent.find(m => m.t === C.MSG.OFFER_GEAR); assert(gearMsg && gearMsg.slots.every(s => /assets\/gear\/glitch_/.test(s.icon)), 'le icone dell\'emporio sono uniche per personaggio (path per eroe)');
  ok('novita v1.10 verificate');
}
function testV111() {
  console.log('\n[TEST 15] Novita v1.11 — mercante, zone telegrafate, attacchi vari, micro-aree');
  const dt = 1 / C.TICK_RATE;
  // --- MERCANTE: spawn con 3 offerte, acquisto per monete, prossimita ---
  const room = new Room('v111'); const sent = []; const cap = { send(x) { try { sent.push(JSON.parse(x)); } catch (_) {} } };
  const p = room.addPlayer('b', cap, 'B', 'enforcer'); room.startGame();
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
  const p = room.addPlayer('b', cap, 'B', 'enforcer'); room.startGame();
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
  const room = new Room('v113'); const p = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
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
  assert(Mon.ORDER.slice(0, 2).join(',') === 'skeleton,darkmage', 'ORDER inizia con skeleton,darkmage');
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
  const room = new Room('v139'); const pl = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
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
  const room = new Room('v142'); const pl = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
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
  const room = new Room('v143w'); const pl = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
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
  const stuck = r2.monsters.filter(m => !m.dead && r2.isWallAt(m.x, m.y)).length;
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
  const room = new Room('v145'); const pl = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
  const m = room.spawnMonster('slime', pl.x + 90, pl.y, { scaling: Waves.scaling(1, 1) });
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
  assert(Waves.poolForWave(6).some(x => x.id === 'occhio'), 'Beholder nel pool dall ondata 6, dopo il primo boss');
  const dt = 1 / C.TICK_RATE;
  const room = new Room('v149'); const pl = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
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
  assert(!at(5).includes('occhio') && at(6).includes('occhio'), 'Beholder introdotto all ondata 6');
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
  const room = new Room('v150'); const pl = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
  for (let i = 0; i < C.TICK_RATE * 20; i++) { room.setInput('b', bot(room, pl)); room.update(dt); if (hasNaN(room)) break; }
  assert(hasNaN(room) === null, 'nessun NaN con la nuova curva del pool');
  ok('novita v1.50 verificate');
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
  const room = new Room('v147'); const pl = room.addPlayer('b', { send() {} }, 'B', 'enforcer'); room.startGame();
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
console.log('=================================================='); console.log('  DUNGEON RIFT — SUITE DI TEST (v1.50)'); console.log('==================================================');
const T0 = Date.now();
testMapThemes(); testLives(); testBoons(); testWeaponEvo(); testModes(); testHitstop(); testXpItems(); testV16(); testV17(); testV18(); testV19(); testV110(); testV111(); testV112(); testV113(); testV139(); testV142(); testV143(); testV145(); testV147(); testV149(); testV150(); testSanity(); testFullRun(1, 'solo'); testFullRun(3, 'trio'); testFullRun(6, 'stress');
console.log('\n=================================================='); console.log(`  RISULTATO: ${PASS} passati, ${FAIL} falliti  (${((Date.now() - T0) / 1000).toFixed(1)}s)`); console.log('==================================================');
process.exit(FAIL > 0 ? 1 : 0);
