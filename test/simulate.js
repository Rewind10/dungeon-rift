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
// v1.78 — da qui in poi un'ondata ripulita non finisce da sola: si ferma sulla fase 'cleared' e aspetta
// che i giocatori premano EXIT. I test che chiudevano un'ondata svuotando la mappa devono premerlo, se no
// misurano la fase sbagliata. Questo e' il gesto del giocatore, in una riga.
function chiudiOndata(room) {
  room._checkWaveClear();
  if (room.phase === C.PHASE_CLEARED) for (const p of room.players.values()) room.exitWave(p.id);
}
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
  // v1.76 — il campo si costruisce dalla PARTENZA, non dal centro geometrico: con la caverna il
  // centro della mappa puo' essere dentro una massa di roccia, e allora non si raggiungeva nulla.
  const PF = require('../shared/pathfinding.js'); const seen = {}; let cf = 0, ef = 0;
  for (let i = 0; i < 50; i++) { const map = MapGen.generate((Math.random() * 1e9) | 0, 1 + (i % 20)); seen[map.theme.id] = 1; const dist = PF.build(map.grid, map.w, map.h, [{ gx: (map.spawn.x / C.TILE) | 0, gy: (map.spawn.y / C.TILE) | 0 }]); let r = 0, t = 0; for (const s of map.enemySpawns) { t++; if (dist[s.y * map.w + s.x] >= 0) r++; } if (t && r / t < 0.98) cf++; if (!map.exit) ef++; }
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
  // v1.79 — l'offerta arriva da uno SCAGLIONE: quattro abilita', due della classe e due neutre.
  p.scaglioniDovuti = ['uncommon'];
  room.offerBoon(p); assert(p.boonOffer && p.boonOffer.length === 4, 'lo scaglione offre quattro abilita (' + (p.boonOffer || []).length + ')');
  const pierceBefore = p.boon.pierce;
  p.boonOffer = ['pierce']; room.pickBoon('b', 'pierce'); assert(p.boon.pierce === pierceBefore + 1, 'Perforazione applicata col valore nuovo (+1)'); assert(p.boonsOwned.pierce === 1, 'conteggio aggiornato');
  p.boonOffer = ['chain']; room.pickBoon('b', 'chain'); assert(p.boon.chain === 2, 'Catena di Fulmini applicata (2 rimbalzi)');
  // spara e verifica che i proiettili portino i flag delle passive
  room.bullets.length = 0; p.fireCd = 0; room.firePlayerWeapon(p); const b = room.bullets.find(x => !x.hostile); assert(b && b.pierce >= 1 && b.chain === 2, 'i proiettili ereditano le passive');
  // boon vampire cura
  p.boonOffer = ['vampire']; const ls0 = p.stats.lifesteal; room.pickBoon('b', 'vampire'); assert(p.stats.lifesteal > ls0, 'boon Vampirismo aumenta lifesteal');
  // v1.79 — NIENTE IMPILAMENTO: ogni abilita' si prende una volta sola, e riproporla non fa niente.
  p.boonOffer = ['pierce']; const pv = p.boon.pierce; room.pickBoon('b', 'pierce'); assert(p.boon.pierce === pv, 'la stessa abilita non si prende due volte');
  assert(Loot.BOONS.every(x => x.max === 1), 'e nessuna abilita e impilabile');
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
  console.log('\n[TEST 5] Una modalita sola');
  // v1.78 — Orda, Caccia, Sopravvivenza e Tesoro sono state tolte: ogni ondata e' un'ondata normale.
  // Il test non prova piu' che le varianti esistano — prova che NON esistano, che e' la cosa che si
  // puo' rompere per sbaglio rimettendo un ramo in modeForWave.
  const ids = new Set();
  for (let w = 1; w <= 20; w++) ids.add(Waves.modeForWave(w).id);
  for (let i = 0; i < 300; i++) ids.add(Waves.modeForWave(1 + (i % 20), Math.random).id);
  assert(ids.size === 1, 'una sola modalita in venti ondate e trecento sorteggi (' + [...ids].join(', ') + ')');
  assert(ids.has('assault'), 'ed e quella normale');
  assert(Object.keys(Waves.MODES).length === 1, 'e nella tabella ce n e una sola (' + Object.keys(Waves.MODES).join(', ') + ')');
  for (const sparita of ['horde', 'hunt', 'survival', 'treasure'])
    assert(!Waves.MODES[sparita], 'la modalita ' + sparita + ' non esiste piu');
  const m = Waves.MODES.assault;
  assert(m.survive === 0 && !m.treasure, 'e non ha ne durata fissa ne scrigno');
  // v1.78 — e nel motore non deve restare nemmeno l attrezzatura dello scrigno fuggitivo
  assert(typeof (new Room('v178m')).spawnTreasure !== 'function', 'il metodo spawnTreasure e sparito dal server');
  // e nessuna ondata ha piu' un tempo di sopravvivenza: il cronometro vale per tutte
  const room = new Room('mod'); room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  assert(room.surviveT === undefined && room.parT > 0, 'ogni ondata ha un tempo obiettivo, e del tempo fisso non e rimasto nemmeno il campo');
  ok('una modalita sola verificata');
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
  while (ticks < C.TICK_RATE * 240) { for (const p of room.players.values()) if (!p.dead && !p.down) room.setInput(p.id, bot(room, p)); const t0 = process.hrtime.bigint(); room.update(dt); const t1 = process.hrtime.bigint(); const ms = Number(t1 - t0) / 1e6; maxMs = Math.max(maxMs, ms); tot += ms; ticks++; maxMon = Math.max(maxMon, room.monsters.length); for (const p of room.players.values()) if (!p.dead && room.isWallAt(p.x, p.y)) pWall++; const nn = hasNaN(room); if (nn) { nan = nn; break; } if (room.phase === C.PHASE_GAMEOVER || room.phase === C.PHASE_VICTORY) break; if (room.phase === C.PHASE_CLEARED) for (const p of room.players.values()) room.exitWave(p.id);   /* v1.78 — il bot preme EXIT: senza, resterebbe fermo sulla mappa ripulita fino al timeout */ if (room.phase === C.PHASE_SHOP) for (const p of room.players.values()) { if (p.boonOffer && p.boonOffer.length) room.pickBoon(p.id, p.boonOffer[0]); if (p.points > 0) room.buyStat(p.id, Loot.XP_STATS[MU.randInt(0, Loot.XP_STATS.length - 1)].id); if (!p.ready) room.shopReady(p.id, Math.random() < 0.25 ? 'market' : 'wave'); } }
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
  room.phase = C.PHASE_SHOP;   // il resto del test compra ancora abilita: la stanza deve restare nel menu
  // v1.79.2 — Mira Guidata e' stata tolta (era troppo forte e non c'entrava col ladro). Al suo posto,
  // qui si verifica FRATTURA ARCANA: la bolla che uccide si spacca in due, e le figlie non si dividono.
  const rm = new Room('frat'); const pm = rm.addPlayer('m', { send() {} }, 'M', 'mago'); rm.startGame();
  rm.phase = C.PHASE_SHOP; pm.boonOffer = ['frattura']; rm.pickBoon('m', 'frattura');
  assert(pm.boon.frattura === 1, 'Frattura Arcana applicata');
  rm.phase = C.PHASE_COMBAT; rm.monsters.length = 0; rm.bullets.length = 0;
  const vitt = rm.spawnMonster('skeleton', pm.x + 60, pm.y, { scaling: Waves.scaling(1, 1) }); vitt.hp = 1;
  rm.bullets.push({ eid: 99991, hostile: false, owner: 'm', x: vitt.x - 6, y: vitt.y, vx: 300, vy: 0, r: 8, dmg: 50, color: '#fff', life: 1, crit: false, pierce: 0, knock: 0, frattura: 1 });
  rm.updateBullets(1 / C.TICK_RATE);
  const figlie = rm.bullets.filter(x => x.figlia);
  assert(vitt.dead, 'la bolla uccide il bersaglio');
  assert(figlie.length === 2, 'e si spacca in due bolle minori (' + figlie.length + ')');
  assert(figlie.every(f => f.dmg <= 25 && !f.frattura), 'le figlie fanno meta danno e non si dividono a loro volta');
  // boon avidita: aumenta xpMult
  // v1.79 — Avidita, Fortuna Sfacciata e Fame Vorace sono RITIRATE: col tetto ai livelli un bonus all'XP
  // raccolta e' spazzatura per costruzione, e allo scaglione divino varrebbe esattamente zero.
  for (const id of ['greed', 'lucky', 'gluttony']) assert(!Loot.BOON_BY_ID[id], 'il potere ' + id + ' e stato ritirato');
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
  // v1.79.2 — la coppia del ladro adesso e' Perforazione + Lama Sporca (Mira Guidata e' stata tolta).
  // Ogni abilita' presa e' sempre attiva: il tetto delle carte accese non esiste piu'.
  p.boonOffer = ['pierce']; room.pickBoon('b', 'pierce');
  p.boonOffer = ['lamasporca']; room.pickBoon('b', 'lamasporca'); const bl0 = p.boon.bleedCrit;
  assert(!!p.cardOn.lamasporca, 'ogni abilita presa e sempre accesa');
  assert(p.synActive.frecce_sporche === 1 && p.boon.bleedCrit > 0.10, 'Perforazione + Lama Sporca attiva Frecce Sporche (' + bl0 + ')');
  const again = Loot.detectSynergies(p.boonsOwned, p.synActive); assert(!again.some(x => x.id === 'frecce_sporche'), 'la sinergia gia attiva non viene rilevata di nuovo');
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
  room.wave = 3; room.phase = C.PHASE_SHOP; room.vaiAlVillaggio('b');   // v1.79 — il villaggio e una sezione del menu
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
  p.scaglioniDovuti = ['epic'];
  room.offerBoon(p); assert(p.boonOffer && p.boonOffer.length === 4, 'si sceglie 1 di 4 (offerti: ' + (p.boonOffer || []).length + ')');
  // --- catalogo ---
  assert(Loot.BOONS.length === 32, 'il catalogo ha 32 abilita (' + Loot.BOONS.length + ')');
  for (const id of ['swift', 'juggernaut', 'executioner', 'ampio', 'spalle']) assert(Loot.BOON_BY_ID[id], 'abilita presente: ' + id);
  // --- i boon applicano effetti ---
  const d0 = p.stats.dmgMult; p.boonOffer = ['longshot']; room.pickBoon('b', 'longshot'); assert(p.boon.longshot > 0, 'Tiro Lungo applicato');
  const hp0 = room.effMaxHp(p); p.boonOffer = ['juggernaut']; room.pickBoon('b', 'juggernaut'); assert(room.effMaxHp(p) > hp0, 'Colosso aumenta i PV massimi');
  const cc0 = p.stats.critChance; p.boonOffer = ['executioner']; room.pickBoon('b', 'executioner'); assert(p.stats.critChance > cc0, 'Giustiziere aumenta la probabilita di critico');
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
  // v1.79.2 — L'OFFERTA DI SANGUE E' STATA TOLTA: dava due vite in cambio di meta' delle monete, e chi
  // ne aveva poche le prendeva quasi gratis. Non deve esistere piu' da nessuna parte.
  assert(!room.darkWaresPool().some(w => w.kind === 'blood_coin'), 'l offerta di sangue non e piu nel catalogo del Mercante Errante');
  p.coins = 200; const lv0 = p.lives;
  room.darkMerchant.wares[1] = { id: 'blood_coin', name: 'x', cost: 40, kind: 'blood_coin' };
  room.buyDark('b', 'blood_coin');
  assert(p.lives === lv0, 'e nemmeno costruendo l offerta a mano si comprano vite');
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
  // roster PUPPET: zombie + negromante (entrambi puppet); lo Spettro vettoriale resta fuori.
  assert(!Mon.MONSTERS.spettro, 'nemico vettoriale ancora rimosso: spettro');
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
  // v1.79.2 — IL TROLL E' USCITO DAL GIOCO. La definizione resta (sprite-sheet, slam, IA) e si puo'
  // ancora generare a mano — i controlli qui sotto lo fanno — ma non e' nel bestiario ne' in nessuna ondata.
  assert(!Mon.ORDER.includes('cave_brute'), 'cave_brute non e piu nell ORDER del bestiario');
  for (let w = 1; w <= 20; w++) assert(!Waves.poolForWave(w).some(x => x.id === 'cave_brute'), 'e non compare in nessuna ondata (ondata ' + w + ')');
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
  assert(oc && oc.dipinto === 'viola' && !oc.puppet, 'v1.79.2 — il Beholder e DIPINTO a codice, non piu una marionetta raster');
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
  assert(Loot.BOON_CHOICES === 4, 'la costante di offerta e 4 abilita');
  // --- 2) dieci poteri nuovi, tutti applicabili ---
  const NEW = ['longshot', 'killstep', 'retaliate', 'corpseblast', 'execute', 'defiance'];
  assert(NEW.every(id => !!Loot.BOON_BY_ID[id]), 'i poteri storici rimasti sono nel catalogo');
  assert(Loot.BOONS.length === 32, 'catalogo a 32 abilita: ' + Loot.BOONS.length);
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
  pl.scaglioniDovuti = ['rare'];
  room.offerBoon(pl);
  assert(pl.boonOffer && pl.boonOffer.length === 4, 'lo scaglione offre 4 abilita, una sola selezionabile');
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
  // v1.79.2 — tolto il Troll, gli archetipi dietro di lui si sono fatti avanti di un'ondata.
  assert(!at(3).includes('spore_fungus') && at(4).includes('spore_fungus'), 'Fungo introdotto all ondata 4');
  assert(!at(4).includes('bat_swarm') && at(5).includes('bat_swarm'), 'Nugolo di Pipistrelli introdotto all ondata 5');
  assert(!at(6).includes('wisp') && at(7).includes('wisp'), 'Fuoco Fatuo introdotto all ondata 7');
  assert(!at(7).includes('occhio') && at(8).includes('occhio'), 'Beholder introdotto all ondata 8 (v1.81: era la 9)');
  // v1.81 — LA RAMPA NON HA BUCHI e non arriva tardi: ogni ondata dalla 1 alla 12 aggiunge almeno un
  // archetipo che prima non c'era, e alla 12 il bestiario e' tutto in campo. Dalla 8 in poi qualche
  // ondata ne aggiunge due (i tre Ragni si intrecciano ai tre Beholder), quindi non si conta piu' "un
  // tipo per ondata": si conta che il pool CRESCA sempre, e che si chiuda entro la dodicesima.
  for (let w = 1; w <= 7; w++) assert(at(w).length === w, 'ondata ' + w + ': ' + w + ' archetipi nel pool');
  for (let w = 8; w <= 12; w++) assert(at(w).length > at(w - 1).length, 'ondata ' + w + ': porta qualcosa che prima non c era');
  assert(at(12).length === 14 && at(13).length === 14, 'alla dodicesima il bestiario e tutto in campo (14 archetipi) e li resta');
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
  room.wave = 3; room.phase = C.PHASE_SHOP; room.vaiAlVillaggio('b');   // v1.79 — il villaggio e una sezione del menu
  assert(room.phase === C.PHASE_MARKET, 'dopo l\'ondata 3 si entra nel MERCATO');
  assert(room.wave === 3, 'il mercato e\' INTERSTIZIALE: non consuma un numero d\'ondata');
  assert(room.monsters.length === 0 && room.pending === 0, 'nel mercato non ci sono nemici');
  assert(!room.merchant && !room.darkMerchant, 'niente Mercante Errante nel mercato: resta un incontro delle ondate');
  assert(room.crates.length === 0, 'niente casse nel mercato (il 30% sarebbe una cassa-mima, cioe\' un nemico)');
  assert(!!room.gearMerchant, 'il fabbro dell\'equipaggiamento e\' presente');
  assert(!!room.map.exit, 'la mappa del mercato ha un portale EXIT');
  // v1.75 — al centro adesso c'e' la PIAZZA col falo': il fabbro sta nella sua fucina, a un corridoio da li'.
  const cxw = (room.map.w / 2) * T, cyw = (room.map.h / 2) * T;
  assert(MU.dist(room.map.village.fire.x, room.map.village.fire.y, cxw, cyw) < T * 4, 'la piazza col falo sta al centro della mappa');
  assert(MU.dist(room.gearMerchant.x, room.gearMerchant.y, room.map.village.fire.x, room.map.village.fire.y) < T * 14, 'e la fucina si apre sulla piazza');
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
  const ondataPrima = room.wave;
  room._checkMarketExit();
  // v1.79 — IL PORTALE DEL VILLAGGIO RIPORTA AL MENU, non all'ondata: il villaggio e' una sezione del
  // menu di fine ondata, e da una sezione si torna indietro.
  assert(room.wave === ondataPrima, 'uscire dal villaggio non fa avanzare l ondata');
  assert(room.phase === C.PHASE_SHOP, 'si torna al menu di fine ondata');
  assert(room._forceNewMap === true, 'ma la mappa e segnata come da rigenerare: non si combattera nella stanza del fabbro');
  assert(!room.gearMerchant, 'il fabbro sparisce fuori dal mercato');
  // dal menu, il pulsante centrale porta sempre e solo alla mappa successiva
  room.wave = 4; room.phase = C.PHASE_SHOP; room._afterShop();
  assert(room.phase !== C.PHASE_MARKET && room.wave === 5, 'dal menu si va all ondata successiva');
  assert(room.map !== mapBefore, 'e la mappa e nuova');
  // essendo interstiziale, il mercato non consuma mai un'ondata: nemmeno quelle boss
  room.wave = 15; room.phase = C.PHASE_SHOP; room.vaiAlVillaggio('b');   // v1.79 — il villaggio e una sezione del menu
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
  room.wave = 2; room.phase = C.PHASE_SHOP; room.vaiAlVillaggio('b');   // v1.79 — il villaggio e una sezione del menu
  assert(room.phase === C.PHASE_MARKET, 'scegliendo "market" si entra dal fabbro, a qualunque ondata');
  assert(room.wave === 2, 'la sosta non consuma un numero d ondata');

  // --- 2) fabbro E portale vicini al punto di atterraggio ---
  const sx = room.map.spawn.x, sy = room.map.spawn.y;
  const ex = room.map.exit.x * T + T / 2, ey = room.map.exit.y * T + T / 2;
  const dSmith = MU.dist(sx, sy, room.gearMerchant.x, room.gearMerchant.y) / T;
  const dExit = MU.dist(sx, sy, ex, ey) / T;
  // v1.75 — il fabbro non e' piu' a due passi dallo spawn: si attraversa la piazza ed si entra in fucina.
  assert(dSmith <= 13, 'il fabbro e a una traversata dallo spawn (' + dSmith.toFixed(1) + ' tile)');
  assert(dExit <= 16, 'il portale EXIT e in vista dallo spawn (' + dExit.toFixed(1) + ' tile)');
  // v1.57 — si compare dentro la sala e si esce dal varco a sud: il portale e vicino, i banchi attorno
  // la tile EXIT e' stata spostata NELLA GRIGLIA (il client disegna il portale da li)
  let nExit = 0, exitIdx = -1;
  for (let i = 0; i < room.map.grid.length; i++) if (room.map.grid[i] === C.T_EXIT) { nExit++; exitIdx = i; }
  assert(nExit === 1, 'nella griglia c e una sola tile EXIT (' + nExit + ')');
  assert(exitIdx === room.map.exit.y * room.map.w + room.map.exit.x, 'la tile EXIT nella griglia coincide con map.exit');
  assert(room.map.grid[Math.round(room.gearMerchant.y / T - 0.5) * room.map.w + Math.round(room.gearMerchant.x / T - 0.5)] !== C.T_WALL, 'il fabbro non e dentro un muro');

  // --- 3) v1.79 — LA DESTINAZIONE NON SI SCEGLIE PIU'. Il villaggio e' una sezione del menu e ci si
  // entra tutti insieme; il pulsante centrale e' il "pronto" per la mappa successiva.
  const r2 = new Room('v153b'); r2.addPlayer('a', { send() {} }, 'A', 'ladro'); r2.addPlayer('c', { send() {} }, 'C', 'ladro'); r2.startGame();
  r2.wave = 4; r2.phase = C.PHASE_SHOP;
  r2.shopReady('a'); assert(r2.phase === C.PHASE_SHOP, 'un solo pronto non fa partire niente');
  r2.vaiAlVillaggio('a');
  assert(r2.phase === C.PHASE_MARKET, 'chiunque prema Villaggio ci porta tutta la stanza');
  const T3 = C.TILE; const pa = r2.players.get('a');
  pa.x = r2.map.exit.x * T3 + T3 / 2; pa.y = r2.map.exit.y * T3 + T3 / 2; r2._checkMarketExit();
  assert(r2.phase === C.PHASE_SHOP && r2.wave === 4, 'e uscendo si torna al menu, sulla stessa ondata');

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
  // v1.75 — la SALA unica e' diventata un VILLAGGIO A MICRO-STANZE: una piazza col falo' e cinque
  // stanze attaccate da corridoi corti, una per mestiere. Il test verifica la pianta, non i mobili.
  console.log('\n[TEST 28] Il villaggio — piazza col falo, cinque stanze scavate, tutto raggiungibile');
  const MapGen = require('../shared/mapgen.js');
  const T = C.TILE, m = MapGen.generateMarket(4242), V = MapGen.VILLAGE;
  const at = (x, y) => m.grid[y * m.w + x];
  const isFloor = (x, y) => at(x, y) !== C.T_WALL;
  const dentro = (x, y, r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

  assert(m.w === V.w && m.h === V.h, 'la mappa e ' + m.w + 'x' + m.h + ' tile');
  assert(V.rooms.length === 5, 'cinque stanze, una per mestiere');

  // --- si SCAVA: pavimento SOLO dentro piazza, stanze e corridoi; e li' dentro mai roccia ---
  const inLink = (x, y) => V.links.some(L => x >= L[0] && x <= L[2] && y >= L[1] && y <= L[3]);
  let stray = 0, vuoti = 0, area = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const dovuto = dentro(x, y, V.piazza) || V.rooms.some(r => dentro(x, y, r)) || inLink(x, y);
    if (isFloor(x, y)) { area++; if (!dovuto) stray++; } else if (dovuto) vuoti++;
  }
  assert(stray === 0, 'niente pavimento fuori da piazza, stanze e corridoi (' + stray + ' anomalie)');
  assert(vuoti === 0, 'niente roccia dentro le stanze (' + vuoti + ' buchi)');
  assert(area > 250, 'c e spazio per muoversi (' + area + ' tile calpestabili)');

  // --- ogni stanza tocca la piazza: dallo spawn si arriva OVUNQUE, portale compreso ---
  assert(at(m.exit.x, m.exit.y) === C.T_EXIT, 'il portale EXIT e sulla griglia');
  assert(!dentro(m.exit.x, m.exit.y, V.piazza), 'il portale sta fuori dalla piazza, in fondo al corridoio sud');
  const seen = new Set(), q = [[(m.spawn.x / T) | 0, (m.spawn.y / T) | 0]];
  while (q.length) { const [x, y] = q.pop(); const k = y * m.w + x;
    if (seen.has(k) || x < 0 || y < 0 || x >= m.w || y >= m.h || !isFloor(x, y)) continue;
    seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  assert(seen.size === area, 'dallo spawn si raggiunge ogni angolo del villaggio (' + seen.size + '/' + area + ')');
  assert(seen.has(m.exit.y * m.w + m.exit.x), 'dallo spawn si raggiunge il portale a piedi');
  for (const r of V.rooms) {
    const cx = (r.x0 + r.x1) >> 1, cy = (r.y0 + r.y1) >> 1;
    assert(seen.has(cy * m.w + cx), 'la stanza ' + r.id + ' e collegata alla piazza');
  }

  // --- v1.75.1: ogni PORTA e larga almeno due tile. Una sola tile (48 px) contro un personaggio largo
  // 35 lasciava sei pixel per parte: ci si passava a pelo, sfregando lo stipite.
  const rettangoli = [{ id: 'piazza', x0: V.piazza.x0, y0: V.piazza.y0, x1: V.piazza.x1, y1: V.piazza.y1 }].concat(V.rooms);
  let stretta = '';
  for (const L of V.links) for (const r of rettangoli) {
    let bordo = 0;
    for (let y = L[1]; y <= L[3]; y++) for (let x = L[0]; x <= L[2]; x++)
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + d[0], ny = y + d[1];
        if (nx >= r.x0 && nx <= r.x1 && ny >= r.y0 && ny <= r.y1) bordo++;
      }
    if (bordo > 0 && bordo < 2) stretta += ' ' + r.id + '(' + bordo + ')';
  }
  assert(stretta === '', 'ogni porta e larga almeno due tile:' + (stretta || ' tutte ok'));
  const varco = V.links[V.links.length - 1];
  assert(varco[2] - varco[0] + 1 >= 3, 'e il varco del portale e largo tre tile: e la strada principale');

  // --- il falo' sta nella piazza, ed e' l'unica sorgente di luce dichiarata ---
  assert(!!m.village.fire, 'il falo e esposto nella mappa (e la sorgente di luce)');
  const fireT = { x: (m.village.fire.x / T) | 0, y: (m.village.fire.y / T) | 0 };
  assert(fireT.x === V.fire.x && fireT.y === V.fire.y, 'il falo e dove lo mette la pianta');
  assert(dentro(fireT.x, fireT.y, V.piazza), 'e il falo sta nella piazza centrale');
  assert(m.props.filter(p => p.type === 'bonfire').length === 1, 'un solo falo');

  // --- i pavimenti per stanza: sei rettangoli (piazza + cinque stanze) ---
  assert(Array.isArray(m.floors) && m.floors.length === V.rooms.length + 1, 'il renderer riceve un pavimento per stanza, piu la piazza');
  assert(m.floors.every(f => f.kind && f.col), 'ogni pavimento dichiara tipo e colore');

  // --- cinque mercanti, ognuno nella SUA stanza, dietro il suo banco ---
  assert(m.props.filter(p => p.type === 'stall').length === 0, 'i banchetti sono spariti in v1.75: restano le persone');
  assert(m.village.npcs.length === 5, 'ci sono 5 mercanti');
  assert(m.village.npcs.filter(n => n.shop).length === 1, 'uno solo vende equipaggiamento: il fabbro');
  assert(m.village.npcs.filter(n => n.soon).length === 0, 'il villaggio e completo: nessuna bottega chiusa');
  assert(m.village.npcs.filter(n => n.crd).length === 1, 'la Cartomante ha aperto in v1.73');
  assert(m.village.npcs.filter(n => n.inn).length === 1, "e l'Ostessa in v1.74");
  assert(m.village.npcs.filter(n => n.bnd).length === 1, 'e il Banditore ha aperto in v1.72');
  assert(m.village.npcs.filter(n => n.pot).length === 1, "e l'Erborista e aperto");
  assert(m.village.npcs.every(n => n.col), 'ogni mercante ha il suo colore: e cosi che lo riconosci da lontano');
  assert(new Set(m.village.npcs.map(n => n.col)).size === 5, 'i cinque colori sono tutti diversi');
  let fuori = 0;
  for (let i2 = 0; i2 < V.stalls.length; i2++) {
    const s2 = V.stalls[i2], r = V.rooms.find(x => x.id === s2.room);
    if (!r || !dentro(Math.floor(s2.x), Math.floor(s2.y), r)) fuori++;
  }
  assert(fuori === 0, 'ogni mercante sta dentro la stanza del suo mestiere (' + fuori + ' fuori posto)');
  assert(m.village.npcs.every(n => n.name && n.name.length > 2), 'ognuno ha un nome');
  assert(V.stalls.find(s => s.bnd).name === 'Capitano', 'il Banditore e diventato il Capitano della Gilda dei Contratti');

  // --- la gente del villaggio: comparse che non vendono nulla ---
  assert(Array.isArray(m.village.extras) && m.village.extras.length >= 6, 'ci sono comparse: il posto e abitato, non abbandonato');
  assert(m.village.extras.every(e => !e.shop && !e.pot && !e.bnd && !e.crd && !e.inn), 'le comparse non vendono niente');

  // --- niente mercanti, comparse o arredo dentro la roccia ---
  const inWall = (o) => at((o.x / T) | 0, (o.y / T) | 0) === C.T_WALL;
  assert(!m.village.npcs.some(inWall), 'nessun mercante dentro la roccia');
  assert(!m.village.extras.some(inWall), 'nessuna comparsa dentro la roccia');
  assert(!m.props.some(inWall), 'nessun arredo dentro la roccia');

  // --- il villaggio e BUIO: la luce la fanno il falo e gli aloni dei mercanti ---
  assert(!m.lit, 'il villaggio non e illuminato a giorno: resta al buio');
  assert(m.props.filter(p => p.type === 'glowspot').length === 5, "un alone di luce per mercante");
  assert(m.market === 1, 'la mappa si dichiara mercato');
  assert(m.enemySpawns.length === 0 && m.crateSpawns.length === 0, 'niente spawn nemici ne casse');

  // --- la stanza vera del Room coincide, e nessuno nasce nella roccia ---
  const room = new Room('v157'); room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  room.wave = 3; room.phase = C.PHASE_SHOP; room.vaiAlVillaggio('b');   // v1.79 — il villaggio e una sezione del menu
  assert(room.map.village && room.map.village.npcs.length === 5, 'la stanza mercato usa il villaggio');
  assert(room.monsters.length === 0 && room.crates.length === 0, 'nel villaggio non ci sono nemici ne casse');
  assert(MU.dist(room.gearMerchant.x, room.gearMerchant.y, room.map.village.smith.x, room.map.village.smith.y) < 1, 'il mercante e agganciato al fabbro');
  let inside = false;
  for (let i2 = 0; i2 < 40; i2++) { room.newMap(1000 + i2, 3, true); for (const q2 of room.players.values()) if (room.isWallAt(q2.x, q2.y)) inside = true; }
  assert(!inside, 'nessun giocatore compare dentro la roccia');
  ok('il villaggio v1.75 verificato');
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
  assert(!Waves.poolForWave(7).some(x => x.id === 'occhio'), 'niente Beholder prima dell ondata 8');
  assert(Waves.poolForWave(8).some(x => x.id === 'occhio'), 'Beholder nel pool dall ondata 8');
  const r4 = new Room('v158d'); r4.addPlayer('b', { send() {} }, 'B', 'ladro'); r4.startGame();
  r4.pending = 0; r4.waveList = []; r4.monsters.length = 0;
  for (let i = 0; i < 12; i++) { const t = r4._capType('occhio'); const pos = r4.randomSpawnPos();
    r4.spawnMonster(t, pos.x, pos.y, { scaling: Waves.scaling(15, 1) }); }
  const alive = r4.monsters.filter(x => x.type === 'occhio' && !x.dead).length;
  assert(alive <= oc.maxAlive, 'oltre il tetto non ne compaiono altri (' + alive + ' vivi su 12 tentativi)');
  assert(r4.monsters.filter(x => x.type === 'skeleton').length > 0, 'oltre il tetto si ripiega sullo sciame base');

  // ---------- la rampa resta monotona e ordinata ----------
  const at2 = w => Waves.poolForWave(w).map(x => x.id);
  assert(!at2(3).includes('spore_fungus') && at2(4).includes('spore_fungus'), 'Fungo introdotto all ondata 4');
  assert(!at2(5).includes('bone_roller') && at2(6).includes('bone_roller'), 'Sfera d\'Ossa introdotta all ondata 6');
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

  // LA FAGLIA E' UNA MANOPOLA, e il test la segue invece di imporre una scelta. EDGE_MARGIN a 0
  // significa "spenta": nessuna fascia, nessun drenaggio. E' una decisione di gioco legittima — la
  // faglia serve a scoraggiare chi si accampa sul bordo, e si puo' preferire di lasciar fare. Quello
  // che il test deve garantire e' che la manopola FUNZIONI in tutte e due le posizioni: se e' spenta,
  // deve essere spenta davvero e non mordere di nascosto.
  if (M <= 0) {
    let fascia = 0, tessere = 0;
    for (let y = 2; y < m0.h - 2; y++) for (let x = 2; x < m0.w - 2; x++) {
      if (m0.grid[y * m0.w + x] === C.T_WALL) continue;
      tessere++; if (at(x, y) > 0) fascia++;
    }
    assert(fascia === 0, 'con EDGE_MARGIN a 0 nessuna tessera e nella fascia (' + fascia + ' su ' + tessere + ')');
    // e chi si accampa sul bordo non deve perdere un solo punto ferita
    const rs = new Room('v163off'); const ps = rs.addPlayer('s', { send() {} }, 'S', 'ladro'); rs.startGame();
    rs.pending = 0; rs.waveList = []; rs.monsters.length = 0;
    const cc = rs.map.spawn;
    rs.spawnMonster('spore_fungus', cc.x, cc.y, { scaling: Waves.scaling(1, 1) });
    // La casella di prova va scelta LONTANA dal Fungo, se no i suoi colpi entrano nella misura e
    // sembra che morda la faglia: alla prima stesura il giocatore perdeva 108 PV in venti secondi, e
    // non era la faglia — era il Fungo. Si prende la tessera calpestabile piu' lontana da lui.
    let bordo = null, dLontano = -1;
    for (let y = 2; y < rs.map.h - 2; y++) for (let x = 2; x < rs.map.w - 2; x++) {
      if (rs.map.grid[y * rs.map.w + x] !== C.T_FLOOR) continue;
      const d = MU.dist(x * T2 + T2 / 2, y * T2 + T2 / 2, cc.x, cc.y);
      if (d > dLontano) { dLontano = d; bordo = { x, y }; }
    }
    assert(dLontano > 700, 'la casella di prova e lontana dal Fungo (' + dLontano.toFixed(0) + ' px)');
    ps.hp = 500; ps.maxHp = 500; const hp0 = ps.hp;
    for (let i = 0; i < C.TICK_RATE * 20; i++) {
      ps.x = bordo.x * T2 + T2 / 2; ps.y = bordo.y * T2 + T2 / 2;
      rs.setInput('s', { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false });
      rs.update(1 / C.TICK_RATE);
    }
    assert(ps.hp === hp0, 'e venti secondi sul bordo non tolgono un punto ferita (' + hp0 + ' -> ' + ps.hp + ')');
    assert((ps.edgeLv || 0) === 0, 'e la carica resta a zero (' + (ps.edgeLv || 0) + ')');
    ok('la faglia e SPENTA per scelta (EDGE_MARGIN 0) e non morde di nascosto');
    return;
  }
  // v1.76 — la fascia non e' piu' il bordo del RETTANGOLO: segue la forma della caverna. Percio' non
  // si prova piu' "l angolo della mappa vale il doppio" (l angolo e' roccia piena), si prova la cosa
  // che conta davvero: attaccati alla parete esterna morde al massimo, due tessere dentro non morde
  // piu', e i massi INTERNI non hanno alone — se no stare al riparo dietro un sasso sarebbe letale.
  const suoloAt = (gx, gy) => m0.grid[gy * m0.w + gx] !== C.T_WALL;
  // la roccia ESTERNA e' quella che comunica col bordo della mappa: i massi interni non contano,
  // ed e' apposta — dietro un masso al centro si deve poter stare al riparo senza morire.
  const esterna = new Uint8Array(m0.w * m0.h);
  { const q = [];
    for (let x = 0; x < m0.w; x++) q.push([x, 0], [x, m0.h - 1]);
    for (let y = 0; y < m0.h; y++) q.push([0, y], [m0.w - 1, y]);
    while (q.length) { const p = q.pop(), x = p[0], y = p[1];
      if (x < 0 || y < 0 || x >= m0.w || y >= m0.h) continue;
      const i = y * m0.w + x;
      if (esterna[i] || m0.grid[i] !== C.T_WALL) continue;
      esterna[i] = 1; q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]); } }
  const controParete = (gx, gy) => { for (const d of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const nx = gx + d[0], ny = gy + d[1];
    if (nx < 0 || ny < 0 || nx >= m0.w || ny >= m0.h) continue;
    if (esterna[ny * m0.w + nx]) return true; } return false; };
  const fuoriRoccia = (gx, gy) => { for (const d of [[1,0],[-1,0],[0,1],[0,-1]])
    if (!suoloAt(gx + d[0], gy + d[1])) return true; return false; };
  let attaccate = 0, attaccateMax = 0, dentro = 0, dentroFuori = 0;
  for (let y = 2; y < m0.h - 2; y++) for (let x = 2; x < m0.w - 2; x++) {
    if (!suoloAt(x, y)) continue;
    if (!controParete(x, y)) continue;
    attaccate++; if (at(x, y) === M * 2) attaccateMax++;
  }
  assert(attaccateMax / attaccate > 0.9, 'chi sta attaccato alla parete ESTERNA e nella fascia piena (' + (attaccateMax / attaccate * 100).toFixed(0) + '% delle tessere a contatto)');
  // Un masso INTERNO non deve avere alone: dietro un sasso in mezzo alla caverna si deve poter stare
  // al riparo. La prima versione cercava solo nella finestra 6..h-6 e chiedeva "tocca roccia": su
  // qualche mappa quella finestra non conteneva massi interni e il test falliva a intermittenza —
  // colpa della prova, non del gioco. Adesso si cerca su tutta la mappa e si chiede la cosa esatta:
  // una tessera che tocca roccia NON esterna. Se una mappa non ne avesse nemmeno una sarebbe una
  // mappa senza ripari interni, e quello si' sarebbe un difetto da segnalare.
  let masso = null, toccaInterna = 0;
  for (let y = 2; y < m0.h - 2 && !masso; y++) for (let x = 2; x < m0.w - 2; x++) {
    if (!suoloAt(x, y)) continue;
    let interna = false;
    for (const d of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + d[0], ny = y + d[1];
      if (nx < 0 || ny < 0 || nx >= m0.w || ny >= m0.h) continue;
      const i = ny * m0.w + nx;
      if (m0.grid[i] === C.T_WALL && !esterna[i]) interna = true; }
    if (!interna) continue;
    toccaInterna++;
    if (at(x, y) === 0) { masso = [x, y]; break; }
  }
  assert(toccaInterna > 0, 'la caverna ha massi interni dietro cui ripararsi (' + toccaInterna + ' tessere a contatto)');
  assert(!!masso, 'e almeno uno di quei ripari e fuori dalla fascia della faglia: dietro un masso al centro non si muore');
  // La copertura si misura su PIU' MAPPE: su una sola oscilla parecchio — misurato 46% su una,
  // 34% di media su dieci — e il test diventava un lancio di dadi.
  let band = 0, tot = 0;
  for (let k = 0; k < 6; k++) { const mk = MapGen.generate(31337 + k * 977, 4);
    for (let i = 0; i < mk.grid.length; i++) { if (mk.grid[i] === C.T_WALL) continue; tot++; if (mk.edgeField[i] > 0) band++; } }
  assert(band / tot > 0.18 && band / tot < 0.48, 'la fascia copre una quota sensata della mappa (' + (band / tot * 100).toFixed(0) + '%, su sei mappe)');

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
  assert(!at(4).includes('bat_swarm') && at(5).includes('bat_swarm'), 'il Nugolo entra dall ondata 5');
  assert(!at(6).includes('wisp') && at(7).includes('wisp'), 'il Fuoco Fatuo entra dall ondata 7');
  assert(!at(1).includes('bat_swarm') && !at(1).includes('wisp'), 'nessuno dei due e piu nell ondata 1');
  const wBat = Waves.poolForWave(6).find(x => x.id === 'bat_swarm').weight;
  const wWisp = Waves.poolForWave(8).find(x => x.id === 'wisp').weight;
  assert(wBat === 10 && wWisp === 8, 'pesi nel pool: Nugolo 10, Fuoco Fatuo 8 (sotto lo sciame base a 40)');
  assert(bs.weight === 0 && wp.weight === 0, 'peso 0 nella def: la comparsa la decide solo poolForWave');

  // --- IL FATUO ATTRAVERSA DAVVERO I MURI ---
  // Un mostro normale messo dentro un muro viene ESPULSO da _unstuck (salto secco).
  // Il fatuo invece deve proseguire di suo, passo dopo passo, e uscire da solo.
  const room = new Room('v161'); const pl = room.addPlayer('a', { send() {} }, 'A', 'ladro'); room.startGame();
  // v1.76 — prima si prendeva la PRIMA tessera di muro scandendo da (2,2): con la caverna quella e'
  // in mezzo all'anello di roccia esterno, a otto tessere dal pavimento piu' vicino, e nessun recupero
  // anti-incastro puo' tirarti fuori da li'. Ma non e' nemmeno un caso che capiti giocando. La prova
  // giusta e' una tessera di roccia che TOCCA il pavimento: quella si', ci si finisce dentro davvero.
  let wx = -1, wy = -1;
  for (let gy = 2; gy < room.map.h - 2 && wx < 0; gy++) for (let gx = 2; gx < room.map.w - 2; gx++) {
    if (room.map.grid[gy * room.map.w + gx] !== C.T_WALL) continue;
    let tocca = false;
    for (const d of [[1,0],[-1,0],[0,1],[0,-1]])
      if (room.map.grid[(gy + d[1]) * room.map.w + (gx + d[0])] !== C.T_WALL) tocca = true;
    if (tocca) { wx = gx; wy = gy; break; }
  }
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
  assert(!Waves.poolForWave(7).some(x => x.id === 'occhio'), 'niente Beholder alla 7');
  assert(Waves.poolForWave(8).some(x => x.id === 'occhio'), 'Beholder dalla 8');
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
  room.wave = 3; room.phase = C.PHASE_SHOP; room.vaiAlVillaggio('b');   // v1.79 — il villaggio e una sezione del menu
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
  assert(C.MAX_ALIVE === 40, 'il tetto dei nemici vivi e 40');
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
  console.log('\n[TEST 39] Livelli, ranghi e punti — impianto v1.79 (tetto 15, scaglioni, 18 punti)');
  const Lv = require('../shared/levels.js');
  // --- 1) IL TETTO E' 15 ---
  assert(Lv.MAX_LEVEL === 15, 'il tetto ai livelli e 15');
  assert(Lv.levelForXp(0) === 1 && Lv.levelForXp(199) === 1, 'sotto la prima soglia si resta al livello 1');
  assert(Lv.levelForXp(200) === 2, 'a 200 XP si sale al 2');
  assert(Lv.levelForXp(9470) === 15, 'a 9.470 XP si e di livello 15');
  assert(Lv.levelForXp(999999) === 15, 'e oltre non si sale piu, per quanta esperienza si raccolga');
  let cresce = true; for (let L = 3; L <= 15; L++) if (Lv.xpStep(L) <= Lv.xpStep(L - 1)) cresce = false;
  assert(cresce, 'ogni livello costa piu del precedente');
  // gli ultimi due scalini sono i piu' cari: e' cio' che tiene il livello 15 oltre l'ondata 16
  assert(Lv.xpStep(15) > Lv.xpStep(13) && Lv.xpStep(14) > Lv.xpStep(12), 'gli ultimi due scalini sono i piu ripidi');
  const pr = Lv.progress(Lv.xpForLevel(7) + 100);
  assert(pr.level === 7 && pr.frac > 0 && pr.frac < 1 && !pr.cap, 'il progresso fra due livelli e una frazione sensata');
  const prTop = Lv.progress(Lv.xpForLevel(15) + 5000);
  assert(prTop.cap === true && prTop.frac === 1 && prTop.need === 0, 'al tetto la barra e piena e non si divide per zero');

  // --- 2) GLI SCAGLIONI: quattro, ai livelli 3, 6, 9 e 12 ---
  assert(Lv.SCAGLIONI.length === 4, 'gli scaglioni sono quattro');
  assert(Lv.SCAGLIONI.map(x => x.lvl).join(',') === '3,6,9,12', 'cadono ai livelli 3, 6, 9 e 12');
  assert(Lv.SCAGLIONI.map(x => x.tier).join(',') === 'uncommon,rare,epic,divine', 'e in ordine: non comune, raro, epico, divino');
  assert(Lv.tierForLevel(9) === 'epic' && !Lv.tierForLevel(10) && !Lv.tierForLevel(15), 'solo quei quattro livelli danno una scelta');

  // --- 3) I RANGHI: 3/6/9/12/15, con la specializzazione in fondo ---
  assert(Lv.RANK_LEVELS.join(',') === '1,3,6,9,12,15', 'le fasce sono 1, 3, 6, 9, 12 e 15');
  assert(Lv.rankForLevel(1) === 1 && Lv.rankForLevel(2) === 1, 'ai livelli 1-2 si porta il titolo di partenza');
  assert(Lv.rankForLevel(3) === 2 && Lv.rankForLevel(12) === 5 && Lv.rankForLevel(15) === Lv.RANK_SPEC, 'e si sale di fascia a ogni scaglione');
  assert(Lv.puntiPerRango(1) === 0 && Lv.puntiPerRango(Lv.RANK_SPEC) === 0, 'la prima fascia e quella della specializzazione non danno punti');
  assert([2, 3, 4, 5].every(r => Lv.puntiPerRango(r) === 1), 'le quattro fasce in mezzo danno un punto ciascuna');
  for (const h of ['guerriero', 'mago', 'ladro']) {
    assert(Lv.RANK_NAMES[h].length === 6, 'sei titoli per ' + h);
    assert(Lv.RANK_NAMES[h][4] && Lv.RANK_NAMES[h][5] === null, 'il quinto titolo esiste e il sesto e la specializzazione (' + h + ')');
    assert(Lv.rankName(h, 13, null) === Lv.RANK_NAMES[h][4], 'al livello 13 si porta il quinto titolo (' + h + ')');
  }

  // --- 4) I PUNTI: 18 esatti, costo fisso 1 ---
  assert(Lv.statPointCost(0) === 1 && Lv.statPointCost(11) === 1, 'ogni livello di statistica costa 1 punto, a qualunque altezza');
  assert(Lv.statPointsTo(12) === 12, 'cappare una statistica costa 12 punti');
  const budget = (Lv.MAX_LEVEL - 1) * Lv.POINTS_PER_LEVEL + [1, 2, 3, 4, 5, 6].reduce((a, r) => a + Lv.puntiPerRango(r), 0);
  assert(budget === 18, 'in tutta la run si guadagnano 18 punti (' + budget + ')');
  assert(12 + 6 === budget, 'una statistica al tetto (12) piu una seconda a 6 fanno esattamente il bilancio');
  assert(12 * 2 > budget, 'e cappare DUE statistiche resta impossibile');

  // --- 5) il conto vero, giocato: 18 punti in mano al livello 15 ---
  const room = new Room('v169'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  room.addXp(p, 99999);
  assert(p.level === 15, 'con esperienza a volonta si arriva al 15 (' + p.level + ')');
  assert(p.points === 18, 'e in mano ci sono 18 punti (' + p.points + ')');
  assert((p.scaglioniDovuti || []).join(',') === 'uncommon,rare,epic,divine', 'con le quattro scelte in coda');
  assert(p.specOffer && p.specOffer.length === 2, 'e il bivio della specializzazione aperto');
  const xp0 = p.xpPool; room.addXp(p, 5000);
  assert(p.xpPool === xp0, 'oltre il tetto l esperienza non si accumula nemmeno');
  // spendere: una cappata piu una a 6, e non resta niente
  room.phase = C.PHASE_SHOP;
  for (let i = 0; i < 12; i++) room.buyStat('b', 'st_des');
  for (let i = 0; i < 6; i++) room.buyStat('b', 'st_cos');
  assert(p.buys.st_des === 12 && p.buys.st_cos === 6 && p.points === 0, 'una al tetto, una a 6, zero punti avanzati');
  room.buyStat('b', 'st_for');
  assert(!p.buys.st_for, 'e senza punti non si compra piu niente');
  ok('livelli, scaglioni, ranghi e punti verificati');
}
function testV170() {
  console.log('\n[TEST 40] Novita v1.70 — tetto progressivo, XP da piu fonti, LEVEL UP');
  const Lv = require('../shared/levels.js');
  // --- 1) v1.79.2 — IL TETTO E' UNO SOLO, ALTO, UGUALE A OGNI ONDATA ---
  // Prima era una curva (8 alla prima ondata, 30 dalla decima): teneva in coda meta' dell'ondata proprio
  // dove serviva vedere che i nemici erano aumentati.
  const room = new Room('v170'); const p = room.addPlayer('b', { send() {} }, 'B', 'ladro'); room.startGame();
  assert(C.MAX_ALIVE === 40, 'il tetto dei nemici vivi e 40');
  for (const w of [1, 2, 5, 10, 19, 30]) { room.wave = w; assert(room.tettoVivi() === 40, 'ondata ' + w + ': il tetto e 40 (letto ' + room.tettoVivi() + ')'); }
  // e in singolo NESSUNA ondata supera il tetto: si vedono tutti, sempre
  for (let w = 1; w <= 19; w++) if (!Waves.isBossWave(w))
    assert(Waves.scaling(w, 1).count <= C.MAX_ALIVE, 'ondata ' + w + ' in singolo ci sta tutta in campo (' + Waves.scaling(w, 1).count + ')');
  // --- 2) in GRUPPO le ondate crescono e l eccesso resta in coda, senza perdere nessuno ---
  const r2 = new Room('v170b'); const q = r2.addPlayer('c', { send() {} }, 'C', 'ladro'); r2.startGame();
  r2.wave = 12; r2.mode = Waves.modeForWave(12); r2.phase = C.PHASE_COMBAT;
  const w3 = Waves.buildWave(12, 6, r2.mode); r2.waveList = w3.list; r2.waveScaling = w3.scaling; r2.pending = w3.list.length; r2._peakAlive = 0;
  assert(w3.list.length > C.MAX_ALIVE, 'in sei, l ondata 12 ha piu nemici del tetto (' + w3.list.length + ')');
  const dt = 1 / C.TICK_RATE; let picco = 0;
  for (let i = 0; i < C.TICK_RATE * 45; i++) { q.hp = r2.effMaxHp(q); q.down = false; q.dead = false; r2.update(dt); let vivi = 0; for (const m of r2.monsters) if (!m.dead) vivi++; picco = Math.max(picco, vivi); }
  assert(picco <= C.MAX_ALIVE, 'in campo non se ne vedono mai piu di 40 (picco ' + picco + ')');
  assert(picco >= 20, 'ma l arena si riempie davvero (picco ' + picco + ')');
  assert(r2.pending > 0 || r2.monsters.length > 0, 'e quelli in eccesso restano in coda, non spariscono');
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

  // --- 2) v1.82: LA RICOMPRA NON C'E' PIU'. Il Banditore non ricompra le armi: quel posto al banco
  // adesso e' il reclutamento dei mercenari. Cio' che possiedi resta tuo e si rimette addosso gratis dal
  // Fabbro, che e' il comportamento che conta ed e' verificato qui sopra.
  assert(typeof r.sellGear !== 'function', 'la rivendita delle armi al Banditore e stata tolta');
  assert(!!p.owned.gue_alabarda && !!p.owned.gue_spadone, 'e cio che hai comprato resta comunque tuo');

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
  rn.monsters.length = 0; rn.pending = 0; chiudiOndata(rn);
  assert(w.bounty && w.bounty.have === 0, "e l'ondata finita non chiude la taglia");
  // ondata nuova, questa volta pulita
  const rn2 = new Room('v172n2'); const w2 = rn2.addPlayer('f', conn, 'F', 'guerriero'); rn2.startGame(); rn2.phase = C.PHASE_COMBAT;
  w2.bounty = Bnt.istanza('illeso', 3); const c5 = w2.coins;
  rn2.monsters.length = 0; rn2.pending = 0; chiudiOndata(rn2);
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
  console.log('\n[TEST 43] La Cartomante e chiusa (v1.79) — e con lei il tetto delle carte accese');
  const conn = () => { const box = []; return { box, send(s) { box.push(JSON.parse(s)); } }; };
  // --- 1) la funzione non risponde piu, nemmeno stando addosso al banco ---
  const c1 = conn();
  const room = new Room('v173'); const p = room.addPlayer('b', c1, 'B', 'ladro'); room.startGame();
  assert(C.CARTOMANTE_ATTIVA === false, 'la manopola dice che e chiusa');
  room.phase = C.PHASE_MARKET; room.seer = { x: p.x, y: p.y };
  c1.box.length = 0;
  room.offerSeer(p, 1);
  assert(!c1.box.some(m => m.t === C.MSG.OFFER_SEER), 'il tavolo della Cartomante non si apre piu');
  assert(c1.box.some(m => m.ev && m.ev.t === 'seer_chiusa'), 'ma il gioco dice che la struttura c e e la funzione no');
  // --- 2) nemmeno un messaggio costruito a mano riapre la porta ---
  room.phase = C.PHASE_SHOP; p.scaglioniDovuti = ['uncommon'];
  room.offerBoon(p); room.pickBoon('b', p.boonOffer[0]);
  const presa = Object.keys(p.boonsOwned)[0];
  assert(!!presa, 'un abilita e stata presa');
  room.phase = C.PHASE_MARKET;
  room.toggleCard('b', presa);
  assert(p.cardOn[presa] === 1, 'e non si puo spegnere: le abilita sono sempre attive');
  // --- 3) IL TETTO DELLE CINQUE NON ESISTE PIU: quattro passive, tutte accese ---
  const r2 = new Room('v173b'); const q = r2.addPlayer('c', conn(), 'C', 'guerriero'); r2.startGame(); r2.phase = C.PHASE_SHOP;
  for (const t of ['uncommon', 'rare', 'epic', 'divine']) {
    q.scaglioniDovuti = [t]; r2.offerBoon(q); r2.pickBoon('c', q.boonOffer[0]);
  }
  const prese = Object.keys(q.boonsOwned).filter(id => q.boonsOwned[id] > 0);
  assert(prese.length === 4, 'quattro abilita prese in una run (' + prese.length + ')');
  assert(prese.every(id => q.cardOn[id] === 1), 'e sono accese tutte e quattro');
  assert(r2._carteAccese(q) === 4, 'il conteggio delle attive dice quattro');
  // --- 4) il ricalcolo da zero regge lo stesso: e la rete di sicurezza di tutti i bonus ---
  const dm = q.stats.dmgMult; r2._recomputeBoons(q);
  assert(Math.abs(q.stats.dmgMult - dm) < 1e-9, 'ricalcolare da zero non cambia niente (' + dm + ' -> ' + q.stats.dmgMult + ')');
  ok('la Cartomante e chiusa e le abilita restano sempre attive');
}
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

  // --- 2) v1.79 — le abilita' non si spengono piu' (Cartomante chiusa): il tetto dei PV sale e basta.
  const r2 = new Room('v174b'); const q = r2.addPlayer('b', conn, 'B', 'guerriero'); r2.startGame(); r2.phase = C.PHASE_SHOP;
  const mxPrima = r2.effMaxHp(q); q.hp = mxPrima;
  prendi(r2, q, 'juggernaut');
  assert(r2.effMaxHp(q) > mxPrima, 'Colosso alza il tetto dei PV');
  assert(q.hp === mxPrima, 'ma non cura: i PV correnti restano quelli');
  r2.toggleCard('b', 'juggernaut');
  assert(q.cardOn.juggernaut === 1 && r2.effMaxHp(q) > mxPrima, 'e non si puo spegnere');
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
  r4.enterMarket();
  h.hp = 100;                                    // si combatte e ci si fa male
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


// ===================== v1.74.1 — NIENTE CURE AUTOMATICHE =====================
// Chiudere un'ondata regalava il 25% dei PV massimi: una cura gratuita, silenziosa e ripetuta ogni ondata,
// che rendeva l'Ostessa un lusso invece che un servizio. Questi test tengono chiusa quella porta e tutte
// quelle vicine: i PV salgono solo se qualcuno paga, beve, raccoglie o compie qualcosa.
function testV1741() {
  console.log('\n[TEST 45] v1.74.1 — nessuna cura automatica fra un ondata e l altra');
  const conn = { send() {} };

  // --- 1) fine ondata: i danni restano addosso ---
  const r = new Room('v1741a'); const p = r.addPlayer('a', conn, 'A', 'guerriero'); r.startGame();
  r.phase = C.PHASE_COMBAT; p.hp = 80;
  r.monsters.length = 0; r.pending = 0; chiudiOndata(r);
  assert(r.phase === C.PHASE_SHOP, "l'ondata si chiude");
  assert(p.hp === 80, 'e i PV restano quelli con cui l hai finita: nessuna cura di fine ondata');
  // nemmeno tre ondate di fila la rimettono
  for (let w = 0; w < 3; w++) { r.phase = C.PHASE_COMBAT; r.monsters.length = 0; r.pending = 0; chiudiOndata(r); }
  assert(p.hp === 80, 'nemmeno dopo tre ondate');

  // --- 2) chi e a TERRA viene comunque rialzato: quello non e curare ---
  const r2 = new Room('v1741b'); const q = r2.addPlayer('b', conn, 'B', 'mago'); r2.startGame();
  r2.phase = C.PHASE_COMBAT; q.down = true; q.hp = 0;
  r2.monsters.length = 0; r2.pending = 0; chiudiOndata(r2);
  assert(!q.down && q.hp > 0, 'chi era a terra torna in gioco, altrimenti resterebbe fuori per sempre');

  // --- 3) le uniche vie che alzano i PV sono quelle che qualcuno ha CHIESTO ---
  const r3 = new Room('v1741c'); const g = r3.addPlayer('c', conn, 'C', 'guerriero'); r3.startGame(); r3.phase = C.PHASE_COMBAT;
  const mx = r3.effMaxHp(g);
  // pozione della cintura
  g.hp = 50; g.belt[0] = { id: 'p_cura', n: 1 }; r3.usePotion(g, 0);
  assert(g.hp > 50, 'la pozione di Cura cura (l hai comprata e bevuta)');
  // oggetto raccolto a terra
  g.hp = 50; r3.applyItem(g, Loot.ITEMS.find(i => i.kind === 'heal'));
  assert(g.hp > 50, 'la Pozione di Salute raccolta a terra cura');
  // l'Ostessa
  const r4 = new Room('v1741d'); const h = r4.addPlayer('d', conn, 'D', 'ladro'); r4.startGame();
  r4.enterMarket(); h.x = r4.innkeeper.x; h.y = r4.innkeeper.y; h.hp = 50; h.coins = 500;
  r4.restAtInn('d');
  assert(h.hp > 50 && h.coins < 500, "l'Ostessa cura, e si paga");

  // --- 4) alzare il massimo non cura MAI, da nessuna porta ---
  const r5 = new Room('v1741e'); const z = r5.addPlayer('e', conn, 'E', 'guerriero'); r5.startGame(); r5.phase = C.PHASE_SHOP;
  z.hp = 100; z.points = 30; z.coins = 2000;
  r5.buyStat('e', 'st_cos'); assert(z.hp === 100, 'Costituzione: no');
  z.boonOffer = ['juggernaut']; r5.pickBoon('e', 'juggernaut'); assert(z.hp === 100, 'carta Colosso: no');
  z.boonOffer = ['overheal']; r5.pickBoon('e', 'overheal'); assert(z.hp === 100, 'carta Scudo Vitale: no');
  // mercante errante, offerta "+PV massimi"
  r5.phase = C.PHASE_COMBAT;
  r5.merchant = { x: z.x, y: z.y, wares: [{ id: 'w1', kind: 'maxhp', val: 30, cost: 10, name: 'Talismano' }] };
  r5.buyMerchant('e', 'w1');
  assert(z.hp === 100, 'offerta del Mercante Errante che alza il massimo: no');
  assert(r5.effMaxHp(z) > 100, 'il massimo pero e salito, in tutti e quattro i casi');
  // l'equipaggiamento non ha mai curato, ma che resti cosi'
  const gearHp = z.hp; z.gear.armor = Gear.itemsFor('guerriero', 'armor').slice(-1)[0].id; r5._recomputeGear(z);
  assert(z.hp === gearHp, "l'equipaggiamento non cura");

  // --- 5) il codice non deve tornare ad avere scorciatoie: nessun `p.hp +=` in giro ---
  const room = fs.readFileSync(require('path').join(__dirname, '..', 'server', 'Room.js'), 'utf8');
  assert(!/\bp\.hp \+=/.test(room), 'nessun aumento diretto dei PV sparso nel codice (si passa sempre da un min col massimo)');
  ok('novita v1.74.1 verificate');
}

console.log('=================================================='); console.log('  DUNGEON RIFT — SUITE DI TEST (v1.74.1)'); console.log('==================================================');
const T0 = Date.now();
function testV175() {
  console.log('\n[TEST 46] Novita v1.75 — arredo e persone del villaggio: nulla di invisibile, nulla nel muro');
  const MapGen = require('../shared/mapgen.js');
  const path = require('path'), fs2 = require('fs');
  const m = MapGen.generateMarket(777), T = C.TILE;
  const src = fs2.readFileSync(path.join(__dirname, '..', 'public', 'js', 'renderer.js'), 'utf8');

  // --- ogni mobile che la mappa piazza dev'essere DISEGNATO: un tipo scritto male e' un oggetto invisibile ---
  const disegnati = new Set();
  for (const mm of src.matchAll(/case '([a-z_]+)'/g)) disegnati.add(mm[1]);
  disegnati.add('glowspot'); disegnati.add('bonfire');   // non sono case: diventano luci, gestite prima dello switch
  const usati = [...new Set(m.props.map(p => p.type))];
  const orfani = usati.filter(t => !disegnati.has(t));
  assert(orfani.length === 0, 'il renderer sa disegnare tutti i ' + usati.length + ' tipi di arredo (orfani: ' + orfani.join(', ') + ')');

  // --- i mobili nuovi della v1.75 ci sono davvero, uno per stanza ---
  const conta = (t) => m.props.filter(p => p.type === t).length;
  assert(conta('bancone') >= 4, 'ogni mestiere ha il suo bancone (' + conta('bancone') + ')');
  assert(conta('tavolo') >= 4 && conta('panca') >= 8, 'la taverna ha i tavoli con gli sgabelli attorno');
  assert(conta('credenza') === 1, 'e dietro l ostessa la credenza con le bottiglie');
  assert(conta('incudine') === 1 && conta('rastrelliera') >= 4, 'la fucina ha incudine e rastrelliere');
  assert(conta('lavapool') >= 2, 'e la colata di lava in fondo');
  assert(conta('aiuola') === 3 && conta('alambicco') === 1 && conta('mortaio') === 1, 'l erborista ha le piantagioni e i suoi strumenti');
  assert(conta('tappeto') === 1 && conta('scaffale') >= 4, 'la cartomante ha il tappeto, e ci sono scaffali in giro');
  assert(m.props.some(p => p.type === 'signpost' && p.txt === 'TAGLIE'), 'la bacheca delle taglie e nella stanza del Capitano');
  assert(conta('bones') === 0, 'niente ossa sparse: sembravano asterischi bianchi');

  // --- l'arredo sta ORDINATO nella sua stanza, non sparso a caso ---
  const V = MapGen.VILLAGE;
  const dentro = (x, y, r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
  const inLink2 = (x, y) => V.links.some(L => x >= L[0] && x <= L[2] && y >= L[1] && y <= L[3]);
  let sparsi = 0, inCorridoio = 0;
  for (const p of m.props) {
    const tx = (p.x / T) | 0, ty = (p.y / T) | 0;
    if (V.rooms.some(r => dentro(tx, ty, r)) || dentro(tx, ty, V.piazza)) continue;
    if (inLink2(tx, ty)) inCorridoio++; else sparsi++;
  }
  assert(sparsi === 0, 'ogni mobile sta in una stanza, nella piazza o lungo un corridoio (' + sparsi + ' fuori posto)');
  assert(inCorridoio <= 2, 'e nei corridoi si passa: al massimo il cartello del portale (' + inCorridoio + ')');

  // --- le persone: il mercante e' un EROE ricolorato e disarmato, non piu' un ritratto frontale ---
  assert(/_vendorPal/.test(src) && /_vendorBase/.test(src), 'i mercanti nascono dalla silhouette degli eroi, con la loro tavolozza');
  assert(/civile/.test(src), 'e sono disarmati: niente elmo, scudo, arco o bastone dietro il bancone');
  assert(/village.extras/.test(src), 'e il renderer disegna anche le comparse');
  assert(m.village.extras.every(e => !e.seated), 'le comparse stanno in piedi: dall alto una figura seduta non si legge');
  ok('novita v1.75 verificate');
}
function testV1752() {
  console.log('\n[TEST 47] Novita v1.75.2 — mobili e persone hanno un corpo: ci sbatti contro, e se ci finisci dentro ti spinge fuori');
  const MapGen = require('../shared/mapgen.js');
  const T = C.TILE;

  // --- i corpi solidi esistono SOLO nel villaggio ---
  const m = MapGen.generateMarket(4242);
  assert(Array.isArray(m.solids) && m.solids.length > 30, 'il villaggio ha i suoi corpi solidi (' + (m.solids || []).length + ')');
  const dungeon = MapGen.generate(1234, 3);
  assert(!dungeon.solids || dungeon.solids.length === 0, 'nelle mappe delle ondate non ce ne sono: li' + "'" + ' in mezzo ai mostri sarebbero un rischio senza guadagno');

  // --- cosa e solido e cosa no ---
  const SOLIDI = ['tavolo', 'bancone', 'incudine', 'alambicco', 'crystal_cluster', 'barrel', 'sack', 'brazier',
                  'candelabra', 'signpost', 'mortaio', 'bonfire', 'credenza', 'scaffale', 'rastrelliera', 'aiuola', 'cratebox'];
  const PASSANTI = ['tappeto', 'lavapool', 'web', 'flag', 'panca', 'skull', 'hanging_lantern', 'rock', 'glowspot'];
  for (const t of SOLIDI) assert(m.props.some(p => p.type === t), 'nel villaggio c e almeno un "' + t + '"');
  for (const t of PASSANTI) assert(m.props.some(p => p.type === t), 'e almeno un "' + t + '"');
  const persone = m.solids.filter(s2 => s2.chi);
  const nMobili = m.props.filter(p => SOLIDI.indexOf(p.type) >= 0).length;
  const nPassanti = m.props.filter(p => PASSANTI.indexOf(p.type) >= 0).length;
  assert(m.solids.length === nMobili + persone.length,
    'ha un corpo esattamente cio che deve averlo: ' + nMobili + ' mobili + ' + persone.length + ' persone = ' + m.solids.length);
  assert(nMobili + nPassanti === m.props.length,
    'e ogni oggetto del villaggio e classificato, o solido o attraversabile (' + (nMobili + nPassanti) + '/' + m.props.length + ')');
  assert(persone.length === m.village.npcs.length + m.village.extras.length, 'ogni persona del villaggio ha un corpo (' + persone.length + ')');

  // --- la stanza vera: si cammina, si arriva da tutti, e nessuna zona resta tagliata fuori ---
  const room = new Room('v1752'); room.addPlayer('b', { send() {} }, 'B', 'guerriero'); room.startGame();
  room.wave = 3; room.phase = C.PHASE_SHOP; room.vaiAlVillaggio('b');   // v1.79 — il villaggio e una sezione del menu
  const p = [...room.players.values()][0];
  assert(!!room.solids && room.solids.length > 30, 'la stanza carica i corpi del villaggio');
  const r = p.radius * 0.8, mm = room.map;
  const libero = (x, y) => !room._blk(x, y, r);
  assert(libero(mm.spawn.x, mm.spawn.y), 'si atterra su spazio libero, non dentro un mobile');

  // riempimento fine (passo 8 px) che rispetta muri E corpi
  const STEP = 8, W = Math.ceil(mm.w * T / STEP), H = Math.ceil(mm.h * T / STEP);
  const visto = new Uint8Array(W * H), coda = [[Math.round(mm.spawn.x / STEP), Math.round(mm.spawn.y / STEP)]];
  const dMin = new Array(mm.village.npcs.length).fill(Infinity);
  let dExit = Infinity, celle = 0;
  const ex = mm.exit.x * T + T / 2, ey = mm.exit.y * T + T / 2;
  while (coda.length) {
    const c = coda.pop(), gx = c[0], gy = c[1], k = gy * W + gx;
    if (gx < 0 || gy < 0 || gx >= W || gy >= H || visto[k]) continue;
    const wx = gx * STEP, wy = gy * STEP;
    if (!libero(wx, wy)) continue;
    visto[k] = 1; celle++;
    for (let i = 0; i < mm.village.npcs.length; i++) {
      const d = MU.dist(wx, wy, mm.village.npcs[i].x, mm.village.npcs[i].y); if (d < dMin[i]) dMin[i] = d; }
    const de = MU.dist(wx, wy, ex, ey); if (de < dExit) dExit = de;
    coda.push([gx + 1, gy], [gx - 1, gy], [gx, gy + 1], [gx, gy - 1]);
  }
  assert(celle > 6000, 'resta spazio in abbondanza per muoversi (' + celle + ' posizioni)');
  for (let i = 0; i < mm.village.npcs.length; i++)
    assert(dMin[i] <= C.MARKET_MERCH_RANGE, 'si arriva a parlare con ' + mm.village.npcs[i].name + ' (' + dMin[i].toFixed(0) + ' px, serve ' + C.MARKET_MERCH_RANGE + ')');
  assert(dExit <= C.MARKET_EXIT_RADIUS, 'e si arriva al portale (' + dExit.toFixed(0) + ' px)');
  let isolate = 0;
  for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++)
    if (!visto[gy * W + gx] && libero(gx * STEP, gy * STEP)) isolate++;
  assert(isolate === 0, 'nessuna zona libera resta tagliata fuori dai mobili (' + isolate + ' posizioni isolate)');

  // --- v1.75.3: LA PORTA RESTA LIBERA. Da quando i mobili hanno un corpo, quello che sta sulla soglia
  // non e piu un dettaglio grafico. Misurare la "distanza dal mobile piu vicino" pero non distingue una
  // cassa piantata davanti alla porta da un tavolo che sta due tile dentro la stanza: escono lo stesso
  // numero. Quello che conta e la LUCE, cioe quanto passaggio libero resta davvero attraversando.
  const V2 = MapGen.VILLAGE;
  let stretta2 = '';
  for (const L of V2.links) {
    const cx = ((L[0] + L[2]) / 2 + 0.5) * T, cy = ((L[1] + L[3]) / 2 + 0.5) * T;
    const misura = (vert) => { let tot = 0;
      for (let d = -160; d <= 160; d += 2) { const x = vert ? cx + d : cx, y = vert ? cy : cy + d;
        if (!room._blk(x, y, r)) tot += 2; }
      return tot; };
    // la piu stretta delle due misure: l'altra e la lunghezza del corridoio, non la sua luce
    const luce = Math.min(misura(true), misura(false));
    if (luce < r * 2 * 2) stretta2 += ' ' + luce + 'px';
  }
  assert(stretta2 === '', 'da ogni porta passa almeno il doppio del personaggio, corpi solidi inclusi:' + (stretta2 || ' tutte larghe'));

  // e la piazza resta sgombra: le due casse che stavano davanti all osteria e alle taglie sono andate via
  const PZ = V2.piazza;
  const nellaPiazza = m.props.filter(q => { const tx = (q.x / T) | 0, ty = (q.y / T) | 0;
    return tx >= PZ.x0 && tx <= PZ.x1 && ty >= PZ.y0 && ty <= PZ.y1 && q.type === 'cratebox'; });
  assert(nellaPiazza.length === 0, 'nella piazza non ci sono casse davanti alle porte (' + nellaPiazza.length + ')');

  // --- non si attraversa piu un tavolo ---
  const tav = mm.props.find(q => q.type === 'tavolo');
  assert(!libero(tav.x, tav.y), 'sul tavolo non ci si sale');
  const banco = mm.props.find(q => q.type === 'bancone');
  assert(!libero(banco.x, banco.y), 'e il bancone si aggira, non si attraversa');
  assert(!libero(mm.village.npcs[0].x, mm.village.npcs[0].y), 'e nemmeno si passa attraverso un mercante');

  // --- LA SPINTA: dovunque ti ritrovi incastrato, al tick dopo sei fuori ---
  for (const dentro of [tav, banco, { x: mm.village.npcs[0].x, y: mm.village.npcs[0].y },
                        { x: mm.village.extras[0].x, y: mm.village.extras[0].y }]) {
    p.x = dentro.x; p.y = dentro.y;
    room._spingiFuori(p);
    assert(libero(p.x, p.y), 'spinto fuori da (' + (dentro.type || 'una persona') + ')');
    assert(!room.isWallAt(p.x, p.y), 'e non dentro la roccia');
    assert(MU.dist(p.x, p.y, dentro.x, dentro.y) < 110, 'e a due passi, non teletrasportato dall altra parte');
  }
  // e non si muove di un pixel quando NON e incastrato
  p.x = mm.spawn.x; p.y = mm.spawn.y; room._spingiFuori(p);
  assert(p.x === mm.spawn.x && p.y === mm.spawn.y, 'chi non e incastrato non viene toccato');

  // --- CAMMINARE: in nessuna direzione, e per nessun numero di passi, si finisce dentro un corpo ---
  let dentroMai = 0, passi = 0;
  for (let k = 0; k < 16; k++) {
    p.x = mm.spawn.x; p.y = mm.spawn.y;
    const a = k * Math.PI / 8, vx = Math.cos(a) * 7, vy = Math.sin(a) * 7;
    for (let i = 0; i < 260; i++) { room.moveCircle(p, vx, vy); passi++; if (!libero(p.x, p.y)) dentroMai++; }
  }
  assert(dentroMai === 0, 'camminando in tutte le direzioni non si finisce mai dentro un corpo (' + dentroMai + ' su ' + passi + ' passi)');
  ok('novita v1.75.2 verificate');
}
function testV1761() {
  console.log('\n[TEST 48] v1.76.1 — chi scappa non si vede comparire i nemici addosso');
  const dt = 1 / C.TICK_RATE;
  const room = new Room('v1761'); const p = room.addPlayer('a', { send() {} }, 'A', 'ladro'); room.startGame();
  room.pending = 0; room.waveList = []; room.monsters.length = 0;
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2;
    const mx = p.x + Math.cos(a) * 300, my = p.y + Math.sin(a) * 300;
    if (room.isWallAt(mx, my)) continue;
    room.spawnMonster('skeleton', mx, my, { scaling: Waves.scaling(1, 1) }); }
  assert(room.monsters.length >= 5, 'ci sono mostri in campo per la prova (' + room.monsters.length + ')');

  // 25 secondi di fuga senza uccidere nessuno: e' esattamente la condizione che prima faceva
  // scattare il vecchio recupero anti-stallo e faceva comparire il branco a 240 px dal giocatore.
  let peggio = 0, chi = '', casi = 0;
  const prima = new Map();
  for (let i = 0; i < C.TICK_RATE * 25; i++) {
    prima.clear();
    for (const m of room.monsters) if (!m.dead) prima.set(m.eid, MU.dist(m.x, m.y, p.x, p.y));
    p.hp = p.maxHp; // non deve morire: la prova riguarda i movimenti, non la sopravvivenza
    room.setInput('a', { mx: 1, my: 0.35, aim: 0, shoot: false, q: false, e: false, dash: false });
    room.update(dt);
    for (const m of room.monsters) {
      if (m.dead || !prima.has(m.eid)) continue;
      const d0 = prima.get(m.eid), d1 = MU.dist(m.x, m.y, p.x, p.y);
      // Il filtro va messo sulla distanza DOPO, non prima. Al primo tentativo guardavo quella prima
      // e scartavo tutto cio che stava oltre 800 px: cioe scartavo esattamente il caso che conta,
      // il mostro lontano che ti compare addosso. Con quel filtro il test passava anche col codice
      // vecchio — cioe non provava niente.
      if (d1 > 900) continue;   // resta fuori dallo sguardo anche dopo: non rompe l illusione
      const guadagno = d0 - d1;
      // Il margine copre spinta, rinculo, scivolamento e le spintarelle dell ANTI-INCASTRO
      // (_recoverStuck/_unstuck spostano di una decina di px chi si e' wedgiato in un angolo). Resta
      // larghissimo rispetto a cio' che deve prendere: il difetto della v1.76.1 faceva guadagnare 619 px
      // in un tick, venti volte questa soglia.
      const massimo = (m.speed || 120) * dt * 3 + 34;
      if (guadagno > massimo) { casi++; if (guadagno > peggio) { peggio = guadagno; chi = m.t; } }
    }
  }
  assert(casi === 0, 'in 25 secondi di fuga nessun nemico in vista si avvicina di scatto (' + casi + ' casi, il peggiore ' + peggio.toFixed(0) + ' px in un tick' + (chi ? ' — ' + chi : '') + ')');

  // ...ma il recupero deve restare vivo, se no un mostro bloccato tiene aperta l ondata per sempre.
  const room2 = new Room('v1761b'); const p2 = room2.addPlayer('b', { send() {} }, 'B', 'ladro'); room2.startGame();
  room2.pending = 0; room2.waveList = []; room2.monsters.length = 0;
  // un mostro parcheggiato lontanissimo e tenuto fermo a forza: e' il caso "non ti raggiungera mai"
  let lontano = null, dMax = 0;
  for (let gy = 2; gy < room2.map.h - 2; gy++) for (let gx = 2; gx < room2.map.w - 2; gx++) {
    if (room2.map.grid[gy * room2.map.w + gx] !== C.T_FLOOR) continue;
    const wx = gx * C.TILE + C.TILE / 2, wy = gy * C.TILE + C.TILE / 2;
    const d = MU.dist(wx, wy, p2.x, p2.y); if (d > dMax) { dMax = d; lontano = { x: wx, y: wy }; } }
  assert(dMax > 640, 'trovato un angolo abbastanza lontano per la prova (' + dMax.toFixed(0) + ' px)');
  const bloccato = room2.spawnMonster('skeleton', lontano.x, lontano.y, { scaling: Waves.scaling(1, 1) });
  let spostato = false;
  for (let i = 0; i < C.TICK_RATE * 9 && !spostato; i++) {
    bloccato.x = lontano.x; bloccato.y = lontano.y;   // lo si tiene fermo: simula "non fa progressi"
    p2.hp = p2.maxHp;
    room2.setInput('b', { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false });
    room2.update(dt);
    if (MU.dist(bloccato.x, bloccato.y, lontano.x, lontano.y) > 300) spostato = true;
  }
  assert(spostato, 'un mostro che non fa progressi da cinque secondi viene comunque rimesso in gioco: l ondata non resta aperta per sempre');
  const dFin = MU.dist(bloccato.x, bloccato.y, p2.x, p2.y);
  assert(dFin > 500, 'e viene rimesso LONTANO, non addosso al giocatore (' + dFin.toFixed(0) + ' px)');
  ok('novita v1.76.1 verificate');
}
function testV177() {
  console.log('\n[TEST 49] Novita v1.77 — dai nemici non cade piu niente, e le ondate hanno un cronometro');
  const dt = 1 / C.TICK_RATE;

  // --- 1. NESSUN OGGETTO DAI NEMICI. Ne comuni, ne elite, ne boss, ne la cassa-mima.
  const room = new Room('v177'); const p = room.addPlayer('a', { send() {} }, 'A', 'ladro'); room.startGame();
  room.items.length = 0;
  let uccisi = 0;
  for (const [id, opz] of [['skeleton', {}], ['skeleton', { elite: 1 }], ['slime', {}], ['bat_swarm', {}]])
    for (let k = 0; k < 90; k++) {
      const m = room.spawnMonster(id, p.x + 40, p.y, { scaling: Waves.scaling(3, 1), elite: opz.elite });
      if (opz.elite) m.elite = 1;
      room.killMonster(m, p); uccisi++;
    }
  const boss = room.spawnMonster('orc_warlord', p.x + 60, p.y, { scaling: Waves.scaling(10, 1) });
  boss.boss = true; room.killMonster(boss, p); uccisi++;
  const mima = room.spawnMonster('mimic', p.x + 60, p.y, { scaling: Waves.scaling(7, 1) });
  room.killMonster(mima, p); uccisi++;   // v1.78 — non e piu uno "scrigno": la modalita Tesoro non esiste, la mima e un mostro come gli altri
  assert(room.items.length === 0, 'su ' + uccisi + ' nemici uccisi (elite, boss e cassa-mima compresi) non e caduto un solo oggetto (' + room.items.length + ')');
  // ...ma esperienza e monete devono continuare a cadere, se no si e rotta l economia
  assert(room.groundXp.length > 0, 'l esperienza continua a cadere');
  assert(room.groundCoins.length > 0, 'e le monete anche');

  // --- 2. LE POZIONI FORTI SONO DALL ERBORISTA, e costano
  const forti = Pot.POTIONS.filter(x => x.cost >= 100);
  assert(forti.length === 3, 'l Erborista ha tre pozioni forti (' + forti.length + ')');
  const base = Pot.POTIONS.filter(x => x.cost < 100);
  const maxBase = Math.max(...base.map(x => x.cost));
  assert(Math.min(...forti.map(x => x.cost)) > maxBase * 2, 'la piu economica delle forti costa piu del doppio della piu cara delle base');
  for (const id of ['i_power', 'i_rage', 'i_invuln'])
    assert(Pot.POTIONS.some(x => x.buff === id), 'l effetto ' + id + ', che prima cadeva a terra, adesso si compra');

  // la vita in boccetta: si beve, da una vita, e non se ne possono tenere tre
  // v1.77.1 — LE VITE EXTRA NON SI COMPRANO DALL'ERBORISTA. Per un giorno il Cuore di Fenice e' stato
  // una pozione da cintura con una carica sola: sbagliato lo stesso, perche' l'Erborista e' sempre
  // raggiungibile e una vita comprabile da lui e' una vita comprabile a ogni passaggio dal villaggio.
  // Resta solo dal Mercante Errante, che compare a caso durante le ondate.
  assert(!Pot.POTIONS.some(x => x.kind === 'life'), 'nel catalogo dell Erborista non c e nessuna vita extra');
  assert(!Pot.POTIONS.some(x => /fenice/i.test(x.name)), 'e nemmeno il Cuore di Fenice sotto altro nome');
  const errante = room.merchantWaresPool().filter(w => w.kind === 'life');
  assert(errante.length === 1, 'il Cuore di Fenice resta dal Mercante Errante (' + errante.length + ')');
  assert(errante[0].cost >= 150, 'e li costa ' + errante[0].cost + ' monete');

  // --- 3. IL CRONOMETRO E IL PREMIO
  const r2 = new Room('v177b'); const p2 = r2.addPlayer('b', { send() {} }, 'B', 'ladro'); r2.startGame();
  assert(r2.parT > 0, 'l ondata 1 ha un tempo obiettivo (' + r2.parT + ' s)');
  assert(r2.waveMostri > 0, 'e sa da quanti mostri e fatta (' + r2.waveMostri + ')');
  const snap = r2.snapshot();
  assert(snap.wp === r2.parT && snap.wt >= 0, 'lo snapshot porta cronometro e obiettivo al client (wt ' + snap.wt + ', wp ' + snap.wp + ')');

  // v1.77.2 — IL CRONOMETRO DEVE CAMMINARE, e va provato sulla PRIMA ondata. E' l'unica in cui
  // waveT0 vale esattamente 0, e `this.time - (this.waveT0 || this.time)` trattava quello zero come
  // "non impostato": scattava il ripiego e il tempo trascorso restava zero per tutta la partita.
  // Provarlo a ondata avanzata non avrebbe visto niente, perche' li' waveT0 e' un numero diverso da 0.
  assert(r2.wave === 1, 'la prova si fa sulla PRIMA ondata: e li che waveT0 vale zero');
  assert(r2.waveT0 === 0, 'e infatti waveT0 vale ' + r2.waveT0);
  const letture = [];
  for (const secondi of [3, 8, 15]) {
    while (r2.time < secondi) { r2.setInput('b', { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false }); r2.update(dt); }
    letture.push([secondi, r2.snapshot().wt]);
  }
  for (const [atteso, letto] of letture)
    assert(Math.abs(letto - atteso) < 0.5, 'dopo ' + atteso + ' s il cronometro segna ' + letto + ' s');
  assert(letture[2][1] > letture[0][1], 'e cammina: da ' + letture[0][1] + ' s a ' + letture[2][1] + ' s');
  // il tempo obiettivo scala col contenuto: un ondata affollata ne ha di piu
  const parPochi = Math.round(C.PAR_BASE + C.PAR_PER_MOSTRO * 7 / 1);
  const parTanti = Math.round(C.PAR_BASE + C.PAR_PER_MOSTRO * 41 / 1);
  assert(parTanti > parPochi * 2, 'il tempo obiettivo scala col numero di mostri (' + parPochi + ' s contro ' + parTanti + ' s)');

  // chiudendo l ondata dentro il tempo, arriva il premio
  const xp0 = p2.xpTot !== undefined ? p2.xpTot : 0, mon0 = p2.coins;
  r2.monsters.length = 0; r2.pending = 0; r2.waveT0 = r2.time - 3;   // tre secondi: dentro qualunque obiettivo
  r2._waveDone();
  assert(r2.parPreso === 1, 'chiudendo in tre secondi il premio scatta');
  assert(p2.coins > mon0, 'e porta monete (' + mon0 + ' -> ' + p2.coins + ')');

  // chiudendo fuori tempo, niente premio
  const r3 = new Room('v177c'); const p3 = r3.addPlayer('c', { send() {} }, 'C', 'ladro'); r3.startGame();
  const mon3 = p3.coins;
  r3.monsters.length = 0; r3.pending = 0; r3.waveT0 = r3.time - (r3.parT + 30);
  r3._waveDone();
  assert(!r3.parPreso, 'chiudendo trenta secondi oltre l obiettivo il premio non scatta');
  assert(p3.coins === mon3, 'e le monete restano quelle (' + p3.coins + ')');

  // v1.78 — le ondate a sopravvivenza non esistono piu': il tempo obiettivo vale per TUTTE, senza
  // eccezioni da spiegare. Si controlla proprio quello.
  const r4 = new Room('v177d'); r4.addPlayer('d', { send() {} }, 'D', 'ladro'); r4.startGame();
  let senzaObiettivo = 0;
  for (let w = 1; w <= 12; w++) {
    r4.wave = w - 1; r4.phase = C.PHASE_SHOP; r4.shopReady('d', 'next'); r4._afterShop();
    if (!(r4.parT > 0)) senzaObiettivo++;
  }
  assert(senzaObiettivo === 0, 'tutte le prime dodici ondate hanno un tempo obiettivo (' + senzaObiettivo + ' senza)');
  ok('novita v1.77 verificate');
}
function testPonteClient() {
  console.log('\n[TEST 50] Il ponte fra server e HUD: nessun campo dello snapshot si perde per strada');
  // PERCHE' QUESTO TEST ESISTE. Il cronometro dell'ondata (v1.77) e' rimasto fermo su 0:00 per due
  // versioni. La prima volta era un bug del server; la seconda — quella vera — era che l'HUD non
  // riceve affatto lo snapshot del server. Riceve G.world, lo stato interpolato del client, e i campi
  // non-giocatore vanno copiati a mano uno per uno in main.js con `w.X = next.X`. Il server mandava
  // wt e wp, il client li buttava, e non c'era nessun errore da nessuna parte: nessun test se ne
  // accorgeva, perche' provare lo snapshot del server non prova il ponte.
  // Qui si confrontano le due liste: cio' che l'HUD LEGGE contro cio' che il client COPIA.
  const path = require('path'), fsx = require('fs');
  const dirPub = path.join(__dirname, '..', 'public', 'js');
  const hud = fsx.readFileSync(path.join(dirPub, 'hud.js'), 'utf8');
  const main = fsx.readFileSync(path.join(dirPub, 'main.js'), 'utf8');

  // 1) il corpo di updateTop, preso contando le graffe
  const inizio = hud.indexOf('updateTop(snap, me) {');
  assert(inizio >= 0, 'updateTop esiste in hud.js');
  let liv = 0, fine = -1;
  for (let i = hud.indexOf('{', inizio); i < hud.length; i++) {
    if (hud[i] === '{') liv++;
    else if (hud[i] === '}') { liv--; if (liv === 0) { fine = i; break; } }
  }
  assert(fine > inizio, 'e se ne trova la fine');
  let corpo = hud.slice(inizio, fine);
  // v1.78 — updateTop delega: _aggiornaUscita legge snap.ex e vive fuori da updateTop. Se si guardasse
  // solo il corpo di updateTop, un campo letto da un metodo delegato passerebbe sotto il radar — che e'
  // esattamente il buco da cui e' nato il cronometro fermo.
  for (const m of corpo.matchAll(/this\.(_[a-zA-Z0-9_]+)\(snap/g)) {
    // la DEFINIZIONE, non la chiamata: la chiamata e' preceduta da 'this.', la definizione da un a capo.
    const i2 = hud.indexOf('\n    ' + m[1] + '(snap');
    if (i2 < 0) continue;
    let l2 = 0, f2 = -1;
    for (let i = hud.indexOf('{', i2); i < hud.length; i++) { if (hud[i] === '{') l2++; else if (hud[i] === '}') { l2--; if (l2 === 0) { f2 = i; break; } } }
    if (f2 > i2) corpo += hud.slice(i2, f2);
  }
  const letti = new Set();
  for (const m of corpo.matchAll(/\bsnap\.([a-zA-Z_][a-zA-Z0-9_]*)/g)) letti.add(m[1]);
  assert(letti.size > 3, 'updateTop legge piu di tre campi dallo snapshot (' + [...letti].join(', ') + ')');

  // 2) i campi che main.js copia nel mondo del client
  const copiati = new Set();
  for (const m of main.matchAll(/\bw\.([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*next\./g)) copiati.add(m[1]);
  assert(copiati.size > 3, 'main.js copia piu di tre campi (' + [...copiati].join(', ') + ')');

  // 3) uno snapshot VERO del server, per sapere quali di quei campi esistono davvero
  const room = new Room('ponte'); room.addPlayer('a', { send() {} }, 'A', 'ladro'); room.startGame();
  const snap = room.snapshot();
  const persi = [...letti].filter(k => Object.prototype.hasOwnProperty.call(snap, k) && !copiati.has(k) && k !== 'players');
  assert(persi.length === 0,
    'ogni campo che l HUD legge e che il server manda viene copiato nel mondo del client (persi: ' + (persi.join(', ') || 'nessuno') + ')');

  // e il cronometro in particolare, che e' il caso da cui e nato tutto
  assert(copiati.has('wt') && copiati.has('wp'), 'il cronometro (wt) e il tempo obiettivo (wp) arrivano fino all HUD');
  assert(letti.has('ex'), 'il ponte vede anche i campi letti dai metodi delegati (ex, lo stato dell uscita)');
  assert(copiati.has('ex'), 'e lo stato dell uscita (ex) arriva fino all HUD');
  ok('il ponte fra server e HUD regge');
}
// ===================== v1.78 — USCITA, CARTE DAI LIVELLI, RIEPILOGO =====================
// Le cinque richieste di questa versione, ognuna con la sua prova:
//  1. i font del testo cresciuti di 1px, i titoli no
//  2. la mappa ripulita non ti sbatte fuori: c'e' il pulsante EXIT
//  3. le carte si scelgono salendo di livello, non finendo un'ondata
//  4. una sola modalita' (la prova sta nel TEST 5, riscritto)
//  5. il riepilogo di fine livello
function testV178() {
  const Lv2 = require('../shared/levels.js');
  console.log('\n[TEST 51] Novita v1.78 — uscita col pulsante EXIT, carte dai livelli, riepilogo di fine livello');
  const conn = () => { const box = []; return { box, send(s) { box.push(JSON.parse(s)); } }; };

  // --- 1. LA MAPPA RIPULITA NON CHIUDE DA SOLA ---
  const c1 = conn();
  const r = new Room('v178a'); const p = r.addPlayer('a', c1, 'A', 'guerriero'); r.startGame();
  r.phase = C.PHASE_COMBAT; r.monsters.length = 0; r.pending = 0;
  r._checkWaveClear();
  assert(r.phase === C.PHASE_CLEARED, 'uccisi tutti i nemici la fase e "mappa ripulita", non il negozio');
  assert(r.snapshot().ex && r.snapshot().ex.tot === 1, 'lo snapshot dice a quanti si sta aspettando');
  assert(r.snapshot().ex.n === 0, 'e che nessuno ha ancora premuto EXIT');
  const clearEv = c1.box.filter(m => m.ev && m.ev.t === 'cleared');
  assert(clearEv.length === 1, 'l avviso di mappa ripulita parte una volta sola');
  // il tempo si ferma qui: aspettare non deve costare il premio di velocita'
  const t1 = r.snapshot().wt;
  for (let i = 0; i < C.TICK_RATE * 20; i++) r.update(1 / C.TICK_RATE);
  assert(r.phase === C.PHASE_CLEARED, 'venti secondi dopo si e ancora li: nessuno ha premuto');
  assert(Math.abs(r.snapshot().wt - t1) < 0.01, 'e il cronometro e fermo (' + t1 + ' -> ' + r.snapshot().wt + ')');
  r.exitWave('a');
  assert(r.phase === C.PHASE_SHOP, 'premuto EXIT si va al pannello di fine ondata');

  // --- 2. IN COOPERATIVA SI ASPETTANO TUTTI, MA NON I CADUTI ---
  const r2 = new Room('v178b');
  const a = r2.addPlayer('a', conn(), 'A', 'guerriero'), b = r2.addPlayer('b', conn(), 'B', 'mago'), d = r2.addPlayer('d', conn(), 'D', 'ladro');
  r2.startGame(); r2.phase = C.PHASE_COMBAT; r2.monsters.length = 0; r2.pending = 0; r2._checkWaveClear();
  assert(r2.phase === C.PHASE_CLEARED, 'in tre la mappa ripulita aspetta');
  r2.exitWave('a');
  assert(r2.phase === C.PHASE_CLEARED, 'uno solo non basta a portare via gli altri');
  assert(r2.snapshot().ex.n === 1 && r2.snapshot().ex.tot === 3, 'e si vede 1 su 3');
  d.dead = true;                              // un caduto non puo' premere niente
  r2.exitWave('b');
  assert(r2.phase === C.PHASE_SHOP, 'chi e caduto non si aspetta: premuto da tutti i vivi si esce');

  // --- 3. L ANTI-AFK: dopo EXIT_TIMEOUT si esce comunque ---
  const r3 = new Room('v178c'); r3.addPlayer('a', conn(), 'A', 'guerriero'); r3.addPlayer('b', conn(), 'B', 'mago');
  r3.startGame(); r3.phase = C.PHASE_COMBAT; r3.monsters.length = 0; r3.pending = 0; r3._checkWaveClear();
  let sec = 0; while (r3.phase === C.PHASE_CLEARED && sec < C.EXIT_TIMEOUT + 30) { for (let i = 0; i < C.TICK_RATE; i++) r3.update(1 / C.TICK_RATE); sec++; }
  assert(r3.phase === C.PHASE_SHOP, 'nessuno preme: dopo il tempo massimo si esce lo stesso');
  assert(sec >= C.EXIT_TIMEOUT - 2, 'ma non prima del tempo massimo (' + sec + 's su ' + C.EXIT_TIMEOUT + ')');

  // --- 4. ASPETTARE NON COSTA IL PREMIO DI VELOCITA ---
  const c4 = conn();
  const r4 = new Room('v178d'); const q = r4.addPlayer('a', c4, 'A', 'guerriero'); r4.startGame();
  r4.phase = C.PHASE_COMBAT; r4.waveT0 = r4.time; r4.parT = 40; r4.monsters.length = 0; r4.pending = 0;
  for (let i = 0; i < C.TICK_RATE * 10; i++) r4.update(1 / C.TICK_RATE);   // ondata chiusa in ~10s
  assert(r4.phase === C.PHASE_CLEARED, 'la mappa e ripulita');
  for (let i = 0; i < C.TICK_RATE * 60; i++) r4.update(1 / C.TICK_RATE);   // un minuto a raccogliere con calma
  r4.exitWave('a');
  assert(r4.parPreso === 1, 'il premio di velocita si guadagna sul tempo di COMBATTIMENTO, non sul tempo passato a raccogliere');

  // --- 4bis. QUELLO CHE E' A TERRA TI ASPETTA ---
  // Con l'uscita a pulsante si puo' girare per la mappa un minuto intero: se le sfere continuassero a
  // scadere, il bottino sparirebbe sotto gli occhi di chi lo sta andando a prendere.
  const r45 = new Room('v178d2'); const k = r45.addPlayer('a', conn(), 'A', 'guerriero'); r45.startGame();
  r45.phase = C.PHASE_COMBAT;
  for (let i = 0; i < 6; i++) { const m = r45.spawnMonster('skeleton', k.x + 900, k.y, { scaling: Waves.scaling(2, 1) }); r45.killMonster(m, k); }
  const sfere = r45.groundXp.length, soldi = r45.groundCoins.length;
  assert(sfere > 0 && soldi > 0, 'i nemici hanno lasciato esperienza e monete per terra');
  r45.monsters.length = 0; r45.pending = 0; r45._checkWaveClear();
  assert(r45.phase === C.PHASE_CLEARED, 'mappa ripulita');
  for (let i = 0; i < C.TICK_RATE * 60; i++) r45.update(1 / C.TICK_RATE);   // un minuto buono a girare
  assert(r45.groundXp.length === sfere && r45.groundCoins.length === soldi,
    'dopo un minuto sulla mappa ripulita la roba a terra e ancora li (' + r45.groundXp.length + '/' + sfere + ' sfere, ' + r45.groundCoins.length + '/' + soldi + ' monete)');

  // --- 5. LE ABILITA' ARRIVANO AGLI SCAGLIONI (v1.79: livelli 3, 6, 9, 12) ---
  const c5 = conn();
  const r5 = new Room('v178e'); const z = r5.addPlayer('a', c5, 'A', 'guerriero'); r5.startGame();
  assert((z.scaglioniDovuti || []).length === 0, 'a inizio partita non si deve nessuna scelta');
  r5.phase = C.PHASE_COMBAT; r5.monsters.length = 0; r5.pending = 0; c5.box.length = 0;
  r5._checkWaveClear(); r5.exitWave('a');
  const offerte0 = c5.box.filter(m => m.t === C.MSG.OFFER_BOON && m.boons.length);
  assert(offerte0.length === 0, 'chiudere un ondata senza raggiungere uno scaglione NON offre niente');
  const vuoto = c5.box.filter(m => m.t === C.MSG.OFFER_BOON && !m.boons.length);
  assert(vuoto.length === 1 && vuoto[0].prossimo === 3 && vuoto[0].manca > 0, 'ma il pannello dice a che livello arriva la prossima e quanto manca');

  // due scaglioni in un'ondata sola: si scelgono uno dopo l'altro
  const r6 = new Room('v178f'); const y = r6.addPlayer('a', conn(), 'A', 'mago'); r6.startGame();
  r6.phase = C.PHASE_COMBAT;
  r6.addXp(y, Lv2.xpForLevel(7));
  assert(y.level >= 7, 'con l esperienza di sette livelli si arriva almeno al 7 (' + y.level + ')');
  assert((y.scaglioniDovuti || []).join(',') === 'uncommon,rare', 'e si devono i primi due scaglioni');
  r6.monsters.length = 0; r6.pending = 0; r6._checkWaveClear(); r6.exitWave('a');
  const dovuti = (y.scaglioniDovuti || []).length;
  let scelte = 0;
  while (y.boonOffer && y.boonOffer.length && scelte < 12) {
    assert(y.boonOffer.length === 4, 'ogni scaglione mostra quattro abilita');
    r6.pickBoon('a', y.boonOffer[0]); scelte++;
  }
  assert(scelte === dovuti, 'il pannello si riapre finche gli scaglioni dovuti non sono finiti (' + scelte + '/' + dovuti + ')');
  assert((y.scaglioniDovuti || []).length === 0, 'poi la coda e vuota');
  // le abilita' scelte sono di quelle che il MAGO puo' vedere: mai di un'altra classe
  for (const id in y.boonsOwned) {
    const b = Loot.BOON_BY_ID[id];
    assert(b && (b.hero === 'mago' || b.hero === '*'), 'il mago non puo aver preso ' + id + ' (di ' + (b ? b.hero : '?') + ')');
  }
  // e nell'ondata dopo, senza nuovi scaglioni, non si offre piu' niente
  r6.nextWave(); r6.phase = C.PHASE_COMBAT; r6.monsters.length = 0; r6.pending = 0;
  r6._checkWaveClear(); r6.exitWave('a');
  assert(!(y.boonOffer && y.boonOffer.length), 'ondata successiva senza scaglioni: nessuna scelta');

  // --- 6. IL RIEPILOGO DI FINE LIVELLO ---
  const c7 = conn();
  const r7 = new Room('v178g'); const w = r7.addPlayer('a', c7, 'A', 'ladro'); r7.startGame();
  r7.phase = C.PHASE_COMBAT; r7.waveT0 = r7.time; r7.parT = 300;
  const uccisi = 5;
  for (let i = 0; i < uccisi; i++) { const m = r7.spawnMonster('skeleton', w.x + 200, w.y, { scaling: Waves.scaling(2, 1) }); r7.killMonster(m, w); }
  assert(w.ondata.uccisi === uccisi, 'il contatore dell ondata conta i nemici uccisi (' + w.ondata.uccisi + ')');
  // l'esperienza si conta quando la RACCOGLI, non quando cade: le sfere restano a terra finche' non le
  // prendi, ed e' giusto che il riepilogo dica cosa hai in tasca e non cosa era per terra.
  assert(w.ondata.xp === 0, 'l esperienza per terra non e ancora tua');
  r7.addXp(w, 40);
  assert(w.ondata.xp === 40, 'quella raccolta invece si (' + w.ondata.xp + ')');
  c7.box.length = 0;
  r7.monsters.length = 0; r7.pending = 0; r7._checkWaveClear(); r7.exitWave('a');
  const rep = c7.box.filter(m => m.t === C.MSG.WAVE_STATS);
  assert(rep.length === 1, 'il riepilogo arriva una volta sola');
  const R = rep[0];
  assert(R.uccisi === uccisi, 'e riporta i nemici uccisi (' + R.uccisi + ')');
  assert(R.xp > 0 && R.monete >= 0, 'esperienza e monete dell ondata');
  assert(R.durata >= 0 && R.par === 300, 'quanto e durata e qual era il tempo obiettivo');
  assert(R.bonus && R.bonus.xp > 0 && R.bonus.monete > 0, 'e il premio del cronometro, visto che siamo rimasti sotto');
  // fuori tempo: il riepilogo c e lo stesso, senza premio
  const c8 = conn();
  const r8 = new Room('v178h'); const v = r8.addPlayer('a', c8, 'A', 'ladro'); r8.startGame();
  r8.phase = C.PHASE_COMBAT; r8.parT = 5; r8.waveT0 = r8.time - 60;
  r8.monsters.length = 0; r8.pending = 0; c8.box.length = 0; r8._checkWaveClear(); r8.exitWave('a');
  const R8 = c8.box.filter(m => m.t === C.MSG.WAVE_STATS)[0];
  assert(!!R8 && !R8.bonus, 'fuori tempo il riepilogo arriva comunque, ma senza premio');
  // il conto si azzera all ondata nuova
  assert(v.ondata.uccisi === 0 && v.ondata.xp === 0, 'e a ondata nuova il conto riparte da zero');

  // --- 7. I FONT DEL TESTO SONO CRESCIUTI DI 1px, I TITOLI NO ---
  const css = fs.readFileSync(__dirname + '/../public/style.css', 'utf8');
  assert(/h1\{font-size:44px/.test(css), 'il titolo grande e rimasto a 44px');
  assert(/h2\{font-size:19px/.test(css), 'i titoli di sezione sono rimasti a 19px');
  assert(/#hud\{[^}]*font-size:15px/.test(css), 'il testo dell interfaccia e passato a 15px');
  assert(/\.kf\{[^}]*font-size:13px/.test(css), 'il registro delle uccisioni e passato a 13px');
  // e nessun colore rotto: e' successo davvero (un "#ffc" seguito da una parola) e non si vede finche'
  // non guardi quella riga a schermo.
  // e nessun colore rotto: e' successo davvero (un "#ffc" seguito da una parola, e un ideogramma in
  // mezzo a un esadecimale) e non te ne accorgi finche' non guardi QUELLA riga a schermo.
  // Si controllano solo i VALORI delle dichiarazioni: i selettori cominciano per # anche loro.
  const valori = [...css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)[;}]/g)];
  assert(valori.length > 300, 'il foglio di stile ha le sue dichiarazioni (' + valori.length + ')');
  const rotti = [];
  for (const m of valori) {
    const prop = m[1], grezzo = m[2].trim();
    // ogni esadecimale dev essere lungo 3, 4, 6 o 8 cifre: "#12<qualcosa>7040" si spezza e si vede subito
    for (const h of grezzo.match(/#[0-9a-zA-Z]*/g) || [])
      if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(h)) rotti.push(prop + ':' + grezzo);
    // e un colore e' UN valore solo: "#ffc martedi" sono due parole, quindi e un errore di battitura
    if (/color$/.test(prop)) {
      let senzaFunzioni = grezzo;   // le funzioni si annidano (var dentro var): si sbucciano finche restano
      for (let g = 0; g < 6; g++) { const q = senzaFunzioni.replace(/[a-z-]*\([^()]*\)/gi, 'F'); if (q === senzaFunzioni) break; senzaFunzioni = q; }
      if (/\s/.test(senzaFunzioni) || !/^(#[0-9a-fA-F]{3,8}|F|[a-zA-Z]+)$/.test(senzaFunzioni)) rotti.push(prop + ':' + grezzo);
    }
  }
  assert(rotti.length === 0, 'nessun colore e scritto male (' + rotti.slice(0, 3).join(' | ') + ')');
  // un ideogramma dentro un colore esadecimale non e' una scelta di stile: e' un tasto sbagliato.
  const strani = css.match(/[\u2E80-\u9FFF\uAC00-\uD7AF]/g) || [];
  assert(strani.length === 0, 'e nessun ideogramma finito li per sbaglio (' + strani.slice(0, 3).join(' ') + ')');

  ok('novita v1.78 verificate');
}

// ===================== v1.79 — TETTO 15, SCAGLIONI, XP CONDIVISA, MENU =====================
// L'impianto nuovo per intero: quello che il giocatore vede (quattro scelte, una per scaglione) e
// quello che non vede ma regge tutto (la curva, il fattore di gruppo, il tetto).
function testV179() {
  console.log('\n[TEST 52] Novita v1.79 — tetto 15, abilita a scaglioni, XP condivisa, menu a sezioni');
  const Lv = require('../shared/levels.js');
  const conn = () => { const box = []; return { box, send(s) { box.push(JSON.parse(s)); } }; };

  // --- 1) LA GRIGLIA: 32 abilita, 2 di classe + 2 neutre per scaglione, niente impilamento ---
  assert(Loot.BOONS.length === 32, 'trentadue abilita in tutto (' + Loot.BOONS.length + ')');
  for (const h of ['guerriero', 'mago', 'ladro']) {
    for (const t of ['uncommon', 'rare', 'epic', 'divine']) {
      const o = Loot.offerteScaglione(h, t, {});
      assert(o.length === 4, h + '/' + t + ': quattro abilita offerte (' + o.length + ')');
      assert(o.filter(b => b.hero === h).length === 2, h + '/' + t + ': due sono della sua classe');
      assert(o.filter(b => b.hero === '*').length === 2, h + '/' + t + ': e due sono neutre');
      assert(o.every(b => b.rarity === t), h + '/' + t + ': e sono tutte di quello scaglione');
    }
    // un mago non deve MAI poter vedere un'abilita' del guerriero
    const cat = Loot.boonsPerClasse(h);
    assert(cat.length === 16, h + ': il suo catalogo sono 16 abilita (8 sue + 8 neutre)');
    assert(cat.every(b => b.hero === h || b.hero === '*'), h + ': e non ci sono abilita di altre classi');
  }
  assert(Loot.BOONS.every(b => b.max === 1), 'nessuna abilita e impilabile');
  assert(new Set(Loot.BOONS.map(b => b.id)).size === 32, 'nessun id duplicato');
  for (const id of ['greed', 'lucky', 'gluttony']) assert(!Loot.BOON_BY_ID[id], 'ritirata: ' + id);

  // --- 2) LE SINERGIE restano raggiungibili, ognuna da UNA classe sola e in DUE scaglioni diversi ---
  for (const sy of Loot.SYNERGIES) {
    const ab = sy.need.map(id => Loot.BOON_BY_ID[id]);
    assert(ab.every(Boolean), 'la sinergia ' + sy.id + ' punta ad abilita che esistono');
    const classi = new Set(ab.map(b => b.hero).filter(h => h !== '*'));
    assert(classi.size <= 1, 'la sinergia ' + sy.id + ' e raggiungibile da una classe sola (' + [...classi].join('+') + ')');
    assert(new Set(ab.map(b => b.rarity)).size === ab.length, 'e sta a cavallo di scaglioni diversi (' + sy.id + ')');
  }

  // --- 3) LA SCELTA: una per scaglione, e solo agli scaglioni ---
  const r1 = new Room('v179a'); const p = r1.addPlayer('a', conn(), 'A', 'guerriero'); r1.startGame();
  r1.addXp(p, Lv.xpForLevel(3) - 1);
  assert(p.level === 2 && (p.scaglioniDovuti || []).length === 0, 'al livello 2 non si sceglie niente');
  r1.addXp(p, 5);
  assert(p.level === 3 && p.scaglioniDovuti.join(',') === 'uncommon', 'al 3 arriva il primo scaglione');
  r1.addXp(p, Lv.xpForLevel(5) - p.xpPool);
  assert(p.level === 5 && p.scaglioniDovuti.length === 1, 'al 4 e al 5 non arriva niente di nuovo');
  r1.addXp(p, Lv.xpForLevel(12) - p.xpPool);
  assert(p.scaglioniDovuti.join(',') === 'uncommon,rare,epic,divine', 'e al 12 la coda ha tutti e quattro');
  r1.phase = C.PHASE_SHOP;
  let n = 0;
  while (p.scaglioniDovuti.length && n < 10) { r1.offerBoon(p); r1.pickBoon('a', p.boonOffer[0]); n++; }
  assert(n === 4, 'si scelgono esattamente quattro abilita in una run (' + n + ')');
  const prese = Object.keys(p.boonsOwned).map(id => Loot.BOON_BY_ID[id]);
  assert(new Set(prese.map(b => b.rarity)).size === 4, 'una per scaglione, mai due dello stesso');
  assert(prese.every(b => b.hero === 'guerriero' || b.hero === '*'), 'e mai una di un altra classe');

  // --- 4) IL TETTO: al 15 si sceglie la specializzazione, e l esperienza smette di contare ---
  const r2 = new Room('v179b'); const q = r2.addPlayer('a', conn(), 'A', 'mago'); r2.startGame();
  r2.addXp(q, 99999);
  assert(q.level === 15 && q.specOffer && q.specOffer.length === 2, 'al 15 arriva il bivio fra due specializzazioni');
  assert(q.specOffer.every(id => Lv.SPEC_BY_ID[id].hero === 'mago'), 'e sono le due del mago');
  const pool = q.xpPool; r2.addXp(q, 10000);
  assert(q.xpPool === pool && q.level === 15, 'oltre il tetto l esperienza non serve piu a niente');
  r2.phase = C.PHASE_SHOP; r2.pickRank('a', q.specOffer[0]);
  assert(q.spec === 'arcimago' || q.spec === 'stregone', 'la specializzazione si sceglie e resta');
  assert(Lv.rankName('mago', 15, q.spec) === Lv.SPEC_BY_ID[q.spec].name, 'e da il titolo del rango V');

  // --- 5) XP CONDIVISA: stessa quantita a tutti, col fattore di gruppo ---
  for (const np of [1, 2, 3, 6]) {
    const r = new Room('v179c' + np); const ps = [];
    for (let i = 0; i < np; i++) ps.push(r.addPlayer('p' + i, conn(), 'P' + i, 'ladro'));
    r.startGame();
    r.xpCondivisa(1000);
    const atteso = Math.max(1, Math.round(1000 * C.XP_GRUPPO[Math.min(C.XP_GRUPPO.length - 1, np)]));
    assert(ps.every(x => x.xpPool === atteso), np + ' giocatori: tutti prendono ' + atteso + ' XP (' + ps.map(x => x.xpPool).join(',') + ')');
  }
  assert(C.XP_GRUPPO[1] === 1, 'il solista prende il valore pieno');
  let cala = true; for (let i = 2; i < C.XP_GRUPPO.length; i++) if (C.XP_GRUPPO[i] > C.XP_GRUPPO[i - 1]) cala = false;
  assert(cala, 'e piu si e, meno vale la singola uccisione: le ondate crescono meno che proporzionalmente');
  // un caduto non prende esperienza
  const r5 = new Room('v179d'); const a5 = r5.addPlayer('a', conn(), 'A', 'ladro'), b5 = r5.addPlayer('b', conn(), 'B', 'mago');
  r5.startGame(); b5.dead = true; r5.xpCondivisa(500);
  assert(a5.xpPool > 0 && b5.xpPool === 0, 'chi e caduto non guadagna esperienza');

  // --- 6) I PUNTI: 18, costo fisso, una cappata e una a 6 ---
  const r6 = new Room('v179e'); const g = r6.addPlayer('a', conn(), 'A', 'guerriero'); r6.startGame();
  r6.addXp(g, 99999); r6.phase = C.PHASE_SHOP;
  assert(g.points === 18, 'diciotto punti a fine crescita (' + g.points + ')');
  for (let i = 0; i < 20; i++) r6.buyStat('a', 'st_for');
  assert(g.buys.st_for === 12 && g.points === 6, 'una statistica al tetto costa 12 e ne restano 6');
  for (let i = 0; i < 20; i++) r6.buyStat('a', 'st_cos');
  assert(g.buys.st_cos === 6 && g.points === 0, 'la seconda arriva a 6 e il bilancio finisce li');

  // --- 7) IL MENU: dal villaggio si torna al menu, e la mappa parte solo col pulsante ---
  const c7 = conn();
  const r7 = new Room('v179f'); const h = r7.addPlayer('a', c7, 'A', 'ladro'); r7.startGame();
  r7.phase = C.PHASE_COMBAT; r7.monsters.length = 0; r7.pending = 0; r7._checkWaveClear(); r7.exitWave('a');
  assert(r7.phase === C.PHASE_SHOP, 'chiusa l ondata si e nel menu');
  const ondata = r7.wave;
  r7.vaiAlVillaggio('a');
  assert(r7.phase === C.PHASE_MARKET, 'il pulsante Villaggio porta al villaggio');
  const T = C.TILE; h.x = r7.map.exit.x * T + T / 2; h.y = r7.map.exit.y * T + T / 2;
  c7.box.length = 0; r7._checkMarketExit();
  assert(r7.phase === C.PHASE_SHOP && r7.wave === ondata, 'e uscendo si torna al menu, sulla stessa ondata');
  // tornando dal villaggio il pannello e' completo: riepilogo, statistiche, abilita'
  for (const tipo of [C.MSG.WAVE_STATS, C.MSG.OFFER_SHOP, C.MSG.OFFER_BOON, C.MSG.BOONS])
    assert(c7.box.some(m => m.t === tipo), 'tornando dal villaggio il menu si ricostruisce tutto (' + tipo + ')');
  r7.shopReady('a'); r7.update(0.1);
  assert(r7.phase !== C.PHASE_SHOP && r7.wave === ondata + 1, 'e solo il pulsante centrale fa partire la mappa dopo');

  // --- 8) I VALORI NUOVI delle passive, quelli che il motore legge davvero ---
  const r8 = new Room('v179g'); const m8 = r8.addPlayer('a', conn(), 'A', 'mago'); r8.startGame(); r8.phase = C.PHASE_SHOP;
  const prendi = (id) => { m8.boonOffer = [id]; r8.pickBoon('a', id); };
  // v1.79.2 — Scudo Vitale non alza piu' i PV ne' rigenera: da' resistenza, e basta.
  const dr0 = m8.stats.dmgReduce; prendi('overheal');
  assert(Math.abs(m8.stats.dmgReduce - (dr0 + 0.05)) < 1e-9, 'Scudo Vitale da -5% ai danni subiti');
  assert(m8.stats.regen === 0, 'e non rigenera piu un solo PV');
  prendi('chain'); assert(m8.boon.chain === 2, 'Catena di Fulmini: due rimbalzi');
  prendi('concentra'); assert(m8.boon.concentra === 0.10, 'Concentrazione: +10% al colpo piazzato');
  prendi('lentezza'); assert(m8.boon.lentezza === 200, 'Campo di Lentezza: raggio 200');
  // il campo rallenta davvero i nemici vicini, e non quelli lontani
  r8.phase = C.PHASE_COMBAT; r8.monsters.length = 0;
  // v1.80 — si misura LO STESSO nemico, dallo STESSO punto, col campo acceso e col campo spento. Prima
  // il confronto era fra un nemico vicino e uno a 900 px: reggeva solo perche' i lontani correvano di
  // piu' (il recupero di distanza, spento nella v1.80), e senza quello il test diventava un lancio di dadi.
  const dentro = r8.spawnMonster('skeleton', m8.x + 120, m8.y, { scaling: Waves.scaling(2, 1) });
  dentro.awake = true; dentro.impegnato = 1;
  const p0 = { x: dentro.x, y: dentro.y };
  for (let i = 0; i < C.TICK_RATE; i++) r8.update(1 / C.TICK_RATE);
  const dLento = MU.dist(dentro.x, dentro.y, p0.x, p0.y);
  dentro.x = p0.x; dentro.y = p0.y; m8.boon.lentezza = 0;   // stesso punto, campo spento
  for (let i = 0; i < C.TICK_RATE; i++) r8.update(1 / C.TICK_RATE);
  const dPieno = MU.dist(dentro.x, dentro.y, p0.x, p0.y);
  m8.boon.lentezza = 200;
  assert(dLento < dPieno * 0.92, 'dentro al campo lo stesso nemico si muove meno (' + dLento.toFixed(0) + ' contro ' + dPieno.toFixed(0) + ' px in un secondo)');
  // le abilita' che alzano i PV in percentuale restano equilibrate fra classi: lo verifica Colosso,
  // che e' rimasto percentuale (il guerriero ha 200 PV, il mago 100).
  const rG = new Room('v179h'); const gg = rG.addPlayer('a', conn(), 'A', 'guerriero'); rG.startGame(); rG.phase = C.PHASE_SHOP;
  const gHp0 = rG.effMaxHp(gg); gg.boonOffer = ['juggernaut']; rG.pickBoon('a', 'juggernaut');
  assert(Math.abs(rG.effMaxHp(gg) / gHp0 - 1.35) < 0.02, 'Colosso alza i PV in proporzione, non in cifra fissa');

  ok('impianto v1.79 verificato');
}

// ===================== v1.79.1 — PIU' NEMICI PRESTO, E LA CURVA CHE CI STA DIETRO ==========
// La v1.79 aveva tarato la curva su una misura sbagliata (uccisioni istantanee = combo incollata al
// massimo): sul campo, alla quinta ondata si era ancora di livello 2. Qui si fissa il rapporto vero fra
// quello che le ondate mettono a terra e quello che i livelli costano, cosi' non puo' ricapitare.
function testV1791() {
  console.log('\n[TEST 53] v1.79.1 — le prime ondate sono piu' + "'" + ` piene, e la curva ci sta dietro`);
  const Lv = require('../shared/levels.js');
  // --- 1) piu' nemici presto, gli stessi alla fine ---
  const n = (w) => Waves.scaling(w, 1).count;
  assert(n(1) >= 11, 'la prima ondata ha almeno 11 nemici (' + n(1) + ', erano 7)');
  assert(n(4) >= 15, 'la quarta ne ha almeno 15 (' + n(4) + ', erano 12)');
  assert(n(19) >= 38 && n(19) <= 44, 'la diciannovesima resta dov era (' + n(19) + ', erano 39)');
  let cresce = true; for (let w = 2; w <= 20; w++) if (n(w) <= n(w - 1)) cresce = false;
  assert(cresce, 'e la curva del numero cresce sempre');
  // il numero di VIVI insieme non cambia: quello lo decide il tetto, non il conteggio dell ondata
  const room = new Room('v1791'); room.addPlayer('a', { send() {} }, 'A', 'ladro'); room.startGame();
  // v1.79.2 — e adesso si vedono TUTTI: il tetto (40) sta sopra al numero dell'ondata.
  room.wave = 1; assert(room.tettoVivi() >= n(1), 'alla prima ondata ci stanno in campo tutti e ' + n(1) + ' i nemici');

  // --- 2) L'ESPERIENZA CHE UN ONDATA METTE DAVVERO A TERRA, senza combo ---
  // Questa e' la misura che era stata sbagliata: si conta l'xp dei mostri dell'ondata, punto.
  const Mon = require('../shared/monsters.js');
  const xpOndata = (w, giri) => {
    let tot = 0;
    for (let k = 0; k < giri; k++) {
      const l = Waves.buildWave(w, 1, Waves.modeForWave(w)).list;
      for (const it of l) tot += Math.round((Mon.MONSTERS[it.type].xp || 0) * (it.elite ? 2.5 : 1));
    }
    return Math.round(tot / giri);
  };
  const o1 = xpOndata(1, 40);
  assert(o1 > 85, 'la prima ondata mette a terra almeno 85 XP (' + o1 + ', erano 60)');
  // e la prima scelta deve arrivare presto: il livello 3 costa meno di quello che danno le prime quattro
  let cum = 0; for (let w = 1; w <= 4; w++) cum += xpOndata(w, 30);
  assert(Lv.xpForLevel(3) < cum, 'il primo scaglione (livello 3, ' + Lv.xpForLevel(3) + ' XP) arriva entro la quarta ondata (' + cum + ' a terra)');
  assert(Lv.xpForLevel(2) < xpOndata(1, 30) + xpOndata(2, 30), 'e il livello 2 entro la seconda');

  // --- 3) IL RAPPORTO CHE NON DEVE PIU' SBALLARE ---
  // Tutta l'esperienza che le venti ondate mettono a terra, contro quello che costa arrivare al 15.
  let tutta = 0;
  for (let w = 1; w <= 19; w++) tutta += Waves.isBossWave(w) ? 500 : xpOndata(w, 20);
  tutta += 2400;  // il MEGA BOSS finale
  const rapporto = tutta / Lv.xpForLevel(15);
  assert(rapporto > 1.0 && rapporto < 1.6,
    'il livello 15 costa fra il 60% e il 100% di tutta l esperienza della partita (rapporto ' + rapporto.toFixed(2) + '): ' +
    'sopra e irraggiungibile, sotto si arriva al tetto a meta gioco');
  ok('conteggio dei nemici e curva verificati uno contro l altro');
}

// ===================== v1.79.2 — LE PASSIVE RIFATTE ========================================
// Erano troppo forti e alcune erano doppioni. Qui si verificano una per una quelle nuove, e soprattutto
// che facciano quello che c'e' scritto sulla carta — che e' la cosa che il giocatore legge.
function testV1792() {
  console.log('\n[TEST 54] v1.79.2 — passive ritarate e rifatte');
  const conn = () => ({ send() {} });
  const nuova = (eroe, id) => { const r = new Room('p' + id); const p = r.addPlayer('a', conn(), 'A', eroe); r.startGame(); r.phase = C.PHASE_SHOP; p.boonOffer = [id]; r.pickBoon('a', id); return { r, p }; };

  // --- le tarature semplici ---
  { const { p } = nuova('ladro', 'crit'); assert(Math.abs(p.stats.critChance - (0.03 + 0.10)) < 1e-9, 'Occhio di Falco: +10% critico e basta'); }
  { const { p } = nuova('ladro', 'executioner'); assert(Math.abs(p.stats.critChance - 0.08) < 1e-9 && Math.abs(p.stats.critMult - 2.30) < 1e-9, 'Giustiziere: +5% critico e +30% danno critico'); }
  { const { p } = nuova('ladro', 'bulwark'); assert(Math.abs(p.stats.dmgReduce - 0.10) < 1e-9, 'Baluardo: -10%'); }
  { const { p } = nuova('ladro', 'overheal'); assert(Math.abs(p.stats.dmgReduce - 0.05) < 1e-9 && p.stats.regen === 0, 'Scudo Vitale: -5% e nessuna cura'); }
  { const { p } = nuova('guerriero', 'heavyarm'); assert(Math.abs(p.stats.dmgMult - 1.08) < 1e-9 && !p.perk.arcoPiu, 'Arma Pesante: +8% danno, niente altro'); }

  // --- TOSSINA: una quota del colpo, non un numero fisso ---
  { const { r, p } = nuova('mago', 'poison');
    r.phase = C.PHASE_COMBAT; r.monsters.length = 0;
    const m = r.spawnMonster('skeleton', p.x + 60, p.y, { scaling: Waves.scaling(3, 1) }); m.hp = m.maxHp = 5000;
    r.damageMonster(m, 200, p.x, p.y, 0, p, { poison: Math.round(200 * 0.05) });
    assert(m.poison === 10, 'il veleno vale il 5% del colpo (' + m.poison + ' su 200)');
    const hp0 = m.hp; for (let i = 0; i < C.TICK_RATE * 2; i++) r.update(1 / C.TICK_RATE);
    assert(m.hp < hp0, 'e fa danno nel tempo (' + (hp0 - m.hp) + ' in due secondi)'); }

  // --- GUERRIERO: Colpo Ampio, piu' nemici piu' male, col tetto ---
  { const { r, p } = nuova('guerriero', 'ampio');
    assert(p.boon.ampio === 0.05, 'Colpo Ampio applicato');
    r.phase = C.PHASE_COMBAT; r.monsters.length = 0;
    const solo = r.spawnMonster('skeleton', p.x + 50, p.y, { scaling: Waves.scaling(2, 1) }); solo.hp = solo.maxHp = 9000;
    p.aim = 0; p.fireCd = 0; solo.x = p.x + 50; solo.y = p.y;
    let hp0 = solo.hp; r._meleeSwing(p, r.effWeapon(p), 100, false); const danno1 = hp0 - solo.hp;
    // gli altri tre vanno messi PIU LONTANI, se no uno di loro diventa il bersaglio piu vicino e quello
    // che misuriamo passa a prendere lo splash: misureremmo l ordine dei bersagli, non il bonus.
    for (let i = 0; i < 3; i++) { const m = r.spawnMonster('skeleton', p.x + 72 + i * 6, p.y + 10 + i * 8, { scaling: Waves.scaling(2, 1) }); m.hp = m.maxHp = 9000; }
    // il primo fendente lo ha respinto: va rimesso davanti, se no il piu vicino diventa un altro
    solo.x = p.x + 50; solo.y = p.y;
    hp0 = solo.hp; r._meleeSwing(p, r.effWeapon(p), 100, false); const danno4 = hp0 - solo.hp;
    assert(danno4 > danno1, 'colpendone quattro il fendente fa piu male che colpendone uno (' + danno1 + ' -> ' + danno4 + ')');
    assert(danno4 <= Math.round(danno1 * 1.15) + 1, 'ma non oltre il +15% (' + danno4 + ')'); }

  // --- MAGO: Concentrazione si carica da fermo e si consuma ---
  { const { r, p } = nuova('mago', 'concentra');
    r.phase = C.PHASE_COMBAT; p.input.mx = 0; p.input.my = 0;
    for (let i = 0; i < C.TICK_RATE; i++) r.update(1 / C.TICK_RATE);
    assert(p.fermoT >= 0.5, 'stando fermo la concentrazione si carica (' + p.fermoT.toFixed(2) + 's)');
    // il critico va SPENTO per questa misura: due colpi confrontati fra loro, uno dei due che fa critico
    // e il test diventa un lancio di dadi (e' successo: 70 contro 128, con la Concentrazione funzionante).
    p.stats.critChance = 0;
    r.bullets.length = 0; p.fireCd = 0; r.firePlayerWeapon(p);
    const carico = r.bullets.find(x => !x.hostile);
    assert(p.fermoT === 0, 'e il colpo la consuma');
    r.bullets.length = 0; p.fireCd = 0; r.firePlayerWeapon(p);
    const scarico = r.bullets.find(x => !x.hostile);
    assert(carico && scarico && carico.dmg > scarico.dmg, 'il colpo piazzato fa piu male del successivo (' + carico.dmg + ' > ' + scarico.dmg + ')'); }

  // --- LADRO: Colpo alle Spalle, Lama Sporca, Passo d Ombra, Punto Vitale, Uscita di Scena ---
  { const { r, p } = nuova('ladro', 'spalle');
    assert(p.perk.spalle === 0.20, 'Colpo alle Spalle: +20%');
    r.phase = C.PHASE_COMBAT; r.monsters.length = 0;
    const m = r.spawnMonster('skeleton', p.x + 60, p.y, { scaling: Waves.scaling(2, 1) }); m.hp = m.maxHp = 9000;
    m.facing = 0; let hp0 = m.hp; r.damageMonster(m, 100, m.x + 50, m.y, 0, p, {}); const davanti = hp0 - m.hp;
    hp0 = m.hp; r.damageMonster(m, 100, m.x - 50, m.y, 0, p, {}); const dietro = hp0 - m.hp;
    assert(dietro > davanti, 'da dietro fa piu male (' + dietro + ' contro ' + davanti + ')'); }
  { const { r, p } = nuova('ladro', 'lamasporca');
    r.phase = C.PHASE_COMBAT; r.monsters.length = 0;
    const m = r.spawnMonster('skeleton', p.x + 60, p.y, { scaling: Waves.scaling(2, 1) }); m.hp = m.maxHp = 9000;
    r.damageMonster(m, 100, p.x, p.y, 0, p, { crit: false });
    assert(!m.bleedT, 'un colpo normale non fa sanguinare');
    r.damageMonster(m, 100, p.x, p.y, 0, p, { crit: true });
    assert(m.bleedT > 0 && m.bleed > 0, 'un critico apre l emorragia (' + m.bleed + '/mezzo secondo)'); }
  { const { r, p } = nuova('ladro', 'ombra');
    r.phase = C.PHASE_COMBAT; p.cdDash = 0; r.useDash(p);
    assert(p.ombraT > 0, 'lo scatto apre la finestra del critico'); }
  { const { r, p } = nuova('ladro', 'puntovitale');
    assert(p.boon.critOgni === 5, 'Punto Vitale: un critico ogni cinque colpi');
    r.phase = C.PHASE_COMBAT; r.bullets.length = 0;
    let critici = 0;
    for (let k = 0; k < 10; k++) { p.fireCd = 0; r.bullets.length = 0; r.firePlayerWeapon(p); const b = r.bullets.find(x => !x.hostile); if (b && b.crit) critici++; }
    assert(critici >= 2, 'su dieci colpi almeno due sono critici garantiti (' + critici + ')'); }
  { const { r, p } = nuova('ladro', 'scomparsa');
    r.phase = C.PHASE_COMBAT; p.hp = Math.round(r.effMaxHp(p) * 0.35); p.buffs = {};
    r.damagePlayer(p, Math.round(r.effMaxHp(p) * 0.10), p.x + 30, p.y, 0);
    assert(p.buffs.hidden > 0, 'sotto il 30% dei PV si sparisce dalla vista');
    assert(p.scomparsaCd > 0, 'e parte la ricarica');
    const cd = p.scomparsaCd; p.buffs.hidden = 0;
    r.damagePlayer(p, 5, p.x + 30, p.y, 0);
    assert(!p.buffs.hidden, 'e non si ripete finche la ricarica non e finita'); }

  // --- LE SINERGIE puntano tutte ad abilita che esistono ---
  for (const sy of Loot.SYNERGIES) {
    const ab = sy.need.map(id => Loot.BOON_BY_ID[id]);
    assert(ab.every(Boolean), 'la sinergia ' + sy.name + ' punta ad abilita esistenti (' + sy.need.join(' + ') + ')');
    const classi = new Set(ab.map(b => b.hero).filter(h => h !== '*'));
    assert(classi.size <= 1, 'ed e raggiungibile da una classe sola (' + sy.name + ')');
  }
  ok('passive rifatte verificate');
}

// ===================== v1.79.2 — I TRE BEHOLDER =============================================
// Erano uno solo, dipinto come una marionetta, e soprattutto NON ATTACCAVANO: si poteva restare davanti
// a un Beholder tutto il giorno e non succedeva niente. Adesso sono tre, dipinti a codice, e mordono.
function testBeholder179() {
  console.log('\n[TEST 55] v1.79.2 — i tre Beholder: dipinti, e adesso attaccano');
  const Mon = require('../shared/monsters.js');
  const TRE = ['occhio', 'occhio_carne', 'occhio_spettro'];
  // --- 1) la famiglia ---
  for (const id of TRE) {
    const d = Mon.MONSTERS[id];
    assert(!!d, 'esiste ' + id);
    assert(d.ai === 'gazer' && d.beholder, id + ': stessa IA e stessa famiglia');
    assert(d.dipinto && !d.puppet, id + ': dipinto a codice, niente marionetta');
    assert(d.gazeDmg > 0 && d.biteRange > 0, id + ': ha il raggio che fa danno E il morso');
    assert(Mon.ORDER.includes(id), id + ': e nel bestiario');
  }
  const [A, B, Cc] = TRE.map(id => Mon.MONSTERS[id]);
  assert(A.hp < B.hp && B.hp < Cc.hp, 'la scala di pericolo cresce: viola < carne < spettrale (' + A.hp + ' < ' + B.hp + ' < ' + Cc.hp + ')');
  assert(A.dmg < B.dmg && B.dmg < Cc.dmg, 'e anche il danno');
  assert(A.xp < B.xp && B.xp < Cc.xp, 'e l esperienza che valgono');
  // --- 2) entrano in ondate diverse, uno per volta ---
  const at = w => Waves.poolForWave(w).map(x => x.id);
  assert(!at(7).includes('occhio') && at(8).includes('occhio'), 'il Viola entra alla 8');
  assert(!at(9).includes('occhio_carne') && at(10).includes('occhio_carne'), 'quello di Carne alla 10');
  assert(!at(11).includes('occhio_spettro') && at(12).includes('occhio_spettro'), 'lo Spettrale alla 12');
  // i tre Ragni, intrecciati ai Beholder
  assert(!at(7).includes('ragno') && at(8).includes('ragno'), 'la Vedova delle Volte entra alla 8');
  assert(!at(9).includes('ragno_cripta') && at(10).includes('ragno_cripta'), 'il Ragno della Cripta alla 10');
  assert(!at(10).includes('ragno_veleno') && at(11).includes('ragno_veleno'), 'la Tessitrice Verde alla 11');
  const R1 = Mon.MONSTERS.ragno, R2 = Mon.MONSTERS.ragno_cripta, R3 = Mon.MONSTERS.ragno_veleno;
  assert(R1.ai === 'weaver' && R2.ai === 'weaver' && R3.ai === 'weaver', 'i tre Ragni hanno lo stesso comportamento');
  assert(R1.hp < R2.hp && R2.hp < R3.hp, 'e crescono di pericolo (' + R1.hp + ' < ' + R2.hp + ' < ' + R3.hp + ')');
  assert(R1.pal !== R2.pal && R2.pal !== R3.pal, 'tre palette diverse');
  // --- 3) IL RAGGIO FA MALE ---
  const room = new Room('beh179'); const p = room.addPlayer('b', { send() {} }, 'B', 'guerriero'); room.startGame();
  room.phase = C.PHASE_COMBAT; room.monsters.length = 0;
  const spot = losSpot(room, p, 220);
  const occ = room.spawnMonster('occhio', spot.x, spot.y, { scaling: Waves.scaling(9, 1) });
  occ.awake = true; occ.facing = Math.atan2(p.y - occ.y, p.x - occ.x); occ.gazeKind = 'weaken';
  p.hp = room.effMaxHp(p); const hp0 = p.hp; p.buffs = {};
  for (let i = 0; i < C.TICK_RATE * 3; i++) { p.input = { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false }; room.update(1 / C.TICK_RATE); if (p.hp < hp0) break; }
  assert(p.hp < hp0, 'restare nel raggio costa vita (' + (hp0 - p.hp) + ' danni)');
  // --- 4) DA VICINO MORDE, e smette di guardare ---
  const r2 = new Room('beh179b'); const q = r2.addPlayer('c', { send() {} }, 'C', 'guerriero'); r2.startGame();
  r2.phase = C.PHASE_COMBAT; r2.monsters.length = 0;
  const occ2 = r2.spawnMonster('occhio_carne', q.x + 60, q.y, { scaling: Waves.scaling(12, 1) });
  occ2.awake = true; occ2.atkT = 0;
  q.hp = r2.effMaxHp(q); const hq0 = q.hp; q.buffs = {};
  let morso = false;
  for (let i = 0; i < C.TICK_RATE * 3; i++) {
    occ2.x = q.x + 60; occ2.y = q.y;   // lo si tiene addosso: si misura il morso, non l inseguimento
    q.input = { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false };
    r2.update(1 / C.TICK_RATE);
    if (r2.events.some(e => e.t === 'bite')) morso = true;
    if (morso && q.hp < hq0) break;
  }
  assert(morso, 'sotto la distanza ravvicinata azzanna');
  assert(q.hp < hq0, 'e il morso fa danno (' + (hq0 - q.hp) + ')');
  assert(!occ2.gazeActive, 'mentre morde non sta guardando: una cosa alla volta');
  ok('i tre Beholder verificati');
}

// ============================================================================
// TEST 56 — v1.80: i nemici ti CERCANO
// Il difetto era questo: chi non ti vedeva sceglieva un punto a caso entro 350 px e ci andava.
// Su una mappa da 64x46 tile questo vuol dire che meta' dell'ondata gira in un angolo dove non
// passerai mai, e l'ondata si trascina. Adesso chi non ti vede segue il campo di flusso verso di
// te, piu' piano di chi ti vede. Le due cose da provare sono che ARRIVA e che NON COMPARE.
// ============================================================================
function testV180() {
  console.log('\n[TEST 56] v1.80 — i nemici ti cercano, ma non si fanno sotto tutti insieme');
  const dt = 1 / C.TICK_RATE;
  const AI = require('../shared/ai.js');

  // --- 1) la caccia esiste, e va piu' piano dell'inseguimento a vista ---
  assert(typeof AI.caccia === 'function', 'shared/ai.js espone la caccia');
  {
    const fake = { dt, flowStep: () => ({ x: 1, y: 0, d: 5 }), nearest: () => ({ x: 900, y: 0, radius: 14 }), isWallAt: () => false, losClear: () => true };
    const a = { x: 0, y: 0, mx: 0, my: 0, speed: 100, def: {} };
    const b = { x: 0, y: 0, mx: 0, my: 0, speed: 100, def: {} };
    AI.caccia(a, fake, 0.75);
    AI.behaviors.charger(b, Object.assign({}, fake, { melee() {}, emit() {} }));
    const va = Math.hypot(a.mx, a.my), vb = Math.hypot(b.mx, b.my);
    assert(va > 40, 'chi caccia si muove davvero (' + va.toFixed(0) + ' px/s)');
    assert(va < vb, 'ma piu' + String.fromCharCode(39) + ' piano di chi ti vede (' + va.toFixed(0) + ' < ' + vb.toFixed(0) + '): vederti conta ancora');
  }

  // --- 2) messo lontano e SENZA linea di vista, il nemico arriva ---
  // Si prova il caso peggiore: fuori dalla portata dei sensi (sightRange 560) e dietro la roccia.
  const room = new Room('v180'); const p = room.addPlayer('a', { send() {} }, 'A', 'guerriero'); room.startGame();
  room.pending = 0; room.waveList = []; room.monsters.length = 0;
  let spot = null;
  for (let ty = 1; ty < room.map.h - 1 && !spot; ty++) for (let tx = 1; tx < room.map.w - 1; tx++) {
    const x = (tx + 0.5) * C.TILE, y = (ty + 0.5) * C.TILE;
    if (room.isWallAt(x, y)) continue;
    const d = MU.dist(x, y, p.x, p.y);
    if (d < 700 || d > 1050) continue;   // oltre, su una mappa a corridoi, 40 s non bastano a piedi: si misurerebbe la mappa
    if (room.losClear(p.x, p.y, x, y)) continue;   // deve essere nascosto: non ti vede e non lo vedi
    spot = { x, y }; break;
  }
  assert(!!spot, 'trovato un angolo lontano e cieco da cui partire');
  const m = room.spawnMonster('skeleton', spot.x, spot.y, { scaling: Waves.scaling(1, 1) });
  m.awake = true;
  const d0 = MU.dist(m.x, m.y, p.x, p.y);
  let peggioScatto = 0, scatti = 0;
  let dMin = d0;
  for (let i = 0; i < C.TICK_RATE * 40 && !m.dead; i++) {
    const pr = MU.dist(m.x, m.y, p.x, p.y);
    p.hp = room.effMaxHp(p);                        // fermo e immortale: si misura l IA, non lo scontro
    room.setInput('a', { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false });
    room.update(dt);
    const po = MU.dist(m.x, m.y, p.x, p.y);
    if (po < dMin) dMin = po;
    // niente teletrasporti sotto gli occhi: il guadagno per tick resta quello che le gambe consentono
    // (con il recupero di distanza previsto in Room, fino a 2.1x) finche' il mostro e in vista.
    if (po <= 900) { const g = pr - po, max = (m.speed || 120) * dt * 1.5 + 34; if (g > max) { scatti++; if (g > peggioScatto) peggioScatto = g; } }
  }
  assert(dMin < 160, 'in 40 s ti raggiunge partendo da ' + d0.toFixed(0) + ' px al buio (arriva a ' + dMin.toFixed(0) + ' px)');
  assert(scatti === 0, 'e ci arriva camminando, non comparendo (' + scatti + ' scatti, il peggiore ' + peggioScatto.toFixed(0) + ' px/tick)');

  // --- 3) l ondata converge: dieci scheletri sparsi non restano sparsi ---
  const r2 = new Room('v180b'); const q = r2.addPlayer('b', { send() {} }, 'B', 'guerriero'); r2.startGame();
  r2.pending = 0; r2.waveList = []; r2.monsters.length = 0;
  let messi = 0;
  for (let k = 0; k < 40 && messi < 10; k++) {
    const a = (k / 40) * Math.PI * 2, rr = 700 + (k % 5) * 130;
    const x = q.x + Math.cos(a) * rr, y = q.y + Math.sin(a) * rr;
    if (x < C.TILE || y < C.TILE || x > (r2.map.w - 1) * C.TILE || y > (r2.map.h - 1) * C.TILE) continue;
    if (r2.isWallAt(x, y)) continue;
    const mm = r2.spawnMonster('skeleton', x, y, { scaling: Waves.scaling(1, 1) }); mm.awake = true; messi++;
  }
  assert(messi >= 6, 'ci sono abbastanza nemici sparsi per la prova (' + messi + ')');
  const media = () => { let s = 0, n = 0; for (const x of r2.monsters) if (!x.dead) { s += MU.dist(x.x, x.y, q.x, q.y); n++; } return n ? s / n : 0; };
  const addosso = () => { let v = 0; for (const x of r2.monsters) if (!x.dead && MU.dist(x.x, x.y, q.x, q.y) < 620) v++; return v; };
  const mediaPrima = media();
  let picco = 0;
  for (let i = 0; i < C.TICK_RATE * 40; i++) {
    for (const x of r2.monsters) x.hp = x.maxHp;    // nessuno muore: si misura la convergenza, non lo scontro
    q.hp = r2.effMaxHp(q);
    r2.setInput('b', { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false });
    r2.update(dt);
    const a = addosso(); if (a > picco) picco = a;
  }
  const mediaDopo = media();
  assert(mediaDopo < mediaPrima * 0.55, 'in 40 s il branco si avvicina: distanza media da ' + mediaPrima.toFixed(0) + ' a ' + mediaDopo.toFixed(0) + ' px');
  // ...ma NON si accalcano tutti: il tetto della folla lascia passare i piu' vicini e tiene gli altri
  // all anello. Il margine e per chi ti VEDE, che viene addosso comunque: e la regola, non un buco.
  assert(picco <= C.FOLLA_MAX + 4, 'e non si accalcano: mai piu' + String.fromCharCode(39) + ' di ' + picco + ' addosso su ' + messi + ' (tetto ' + C.FOLLA_MAX + ')');
  assert(picco >= 4, 'ma qualcuno arriva davvero (' + picco + ')');

  // --- 3-bis) il posto si libera uccidendo: chi aspetta prende il turno ---
  {
    let vivi = r2.monsters.filter(x => !x.dead);
    const impegnatiPrima = vivi.filter(x => x.impegnato === 1).length;
    const attesaPrima = vivi.filter(x => x.impegnato === 0).length;
    assert(attesaPrima > 0, 'con dieci nemici qualcuno sta aspettando il turno (' + attesaPrima + ')');
    for (const x of vivi.filter(y => y.impegnato === 1).slice(0, 3)) { x.dead = true; }
    r2._assegnaFolla();
    const impegnatiDopo = r2.monsters.filter(x => !x.dead && x.impegnato === 1).length;
    assert(impegnatiDopo >= Math.min(C.FOLLA_MAX, r2.monsters.filter(x => !x.dead).length), 'uccidendone tre, tre che aspettavano si avviano (impegnati ' + impegnatiPrima + ' -> ' + impegnatiDopo + ')');
  }

  // --- 3-ter) nessun recupero di distanza: chi e lontano cammina come chiunque altro ---
  assert(!/cu = 1 \+ Math\.min/.test(fs.readFileSync(__dirname + '/../server/Room.js', 'utf8')), 'il recupero di distanza (fino a 2,1x oltre i 340 px) e spento');

  // --- 4) chi e fermo per mestiere resta fermo: il Fungo non insegue nessuno ---
  const r3 = new Room('v180c'); const z = r3.addPlayer('c', { send() {} }, 'C', 'mago'); r3.startGame();
  r3.pending = 0; r3.waveList = []; r3.monsters.length = 0;
  const sp = losSpot(r3, z, 420);
  const fun = r3.spawnMonster('spore_fungus', sp.x, sp.y, { scaling: Waves.scaling(4, 1) }); fun.awake = true;
  const fx = fun.x, fy = fun.y;
  for (let i = 0; i < C.TICK_RATE * 8 && !fun.dead; i++) { z.hp = r3.effMaxHp(z); r3.setInput('c', { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false }); r3.update(dt); }
  assert(MU.dist(fun.x, fun.y, fx, fy) < 45, 'il Fungo Sporifero resta piantato dov e (' + MU.dist(fun.x, fun.y, fx, fy).toFixed(0) + ' px): non cammina, al massimo lo spingono');

  ok('la caccia verificata: arrivano a scaglioni, li vedi arrivare, e non ti seppelliscono');
}

// ============================================================================
// TEST 57 — v1.81: la Larva scoppia, i Ragni tessono
// ============================================================================
function testV181() {
  console.log('\n[TEST 57] v1.81 — la Larva scoppia, i tre Ragni tessono');
  const dt = 1 / C.TICK_RATE;
  const Mon = require('../shared/monsters.js');

  // --- 1) LA LARVA: quando muore lascia una zona, e la zona detona DOPO, non subito ---
  const r1 = new Room('v181a'); const p = r1.addPlayer('a', { send() {} }, 'A', 'guerriero'); r1.startGame();
  r1.phase = C.PHASE_COMBAT; r1.monsters.length = 0; r1.pending = 0; r1.waveList = []; r1.zones.length = 0;
  const sp1 = losSpot(r1, p, 200);
  const lv = r1.spawnMonster('larva', sp1.x, sp1.y, { scaling: Waves.scaling(9, 1) }); lv.awake = true;
  const rit = Mon.MONSTERS.larva.esplode.ritardo;
  assert(rit === 3, 'la Larva scoppia dopo 3 secondi (' + rit + ')');
  r1.killMonster(lv, p);
  const z = r1.zones.find(x => Math.abs(x.x - sp1.x) < 1 && Math.abs(x.y - sp1.y) < 1);
  assert(!!z, 'alla morte lascia a terra la zona telegrafata');
  assert(Math.abs(z.max - rit) < 1e-9, 'con il conto alla rovescia di ' + rit + ' s');
  assert(z.r === Mon.MONSTERS.larva.esplode.r, 'e il raggio dichiarato (' + z.r + ' px)');
  // chi resta dentro la prende, chi esce no
  const q1 = new Room('v181b'); const g1 = q1.addPlayer('b', { send() {} }, 'B', 'guerriero'); q1.startGame();
  q1.phase = C.PHASE_COMBAT; q1.monsters.length = 0; q1.pending = 0; q1.waveList = []; q1.zones.length = 0;
  const lv2 = q1.spawnMonster('larva', g1.x + 40, g1.y, { scaling: Waves.scaling(9, 1) }); lv2.awake = true;
  q1.killMonster(lv2, g1);
  g1.hp = q1.effMaxHp(g1); const hp0 = g1.hp;
  for (let i = 0; i < C.TICK_RATE * 4; i++) { q1.setInput('b', { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false }); q1.update(dt); }
  assert(g1.hp < hp0, 'restare sull esplosione costa vita (' + (hp0 - g1.hp) + ' danni)');

  // --- 2) I TRE RAGNI: stessa famiglia, tre pericoli ---
  for (const id of ['ragno', 'ragno_cripta', 'ragno_veleno']) {
    const d = Mon.MONSTERS[id];
    assert(!!d && d.ai === 'weaver', id + ': esiste e tesse');
    assert(d.ragno && d.pal, id + ': dipinto a codice, con la sua palette');
    assert(d.telaR > 0 && d.telaDur > 0 && d.telaCd > 0, id + ': ha la tela');
    assert(Mon.ORDER.includes(id), id + ': e nel bestiario');
  }

  // --- 3) LA TELA RALLENTA, e non fa danno ---
  const r3 = new Room('v181c'); const p3 = r3.addPlayer('c', { send() {} }, 'C', 'ladro'); r3.startGame();
  r3.phase = C.PHASE_COMBAT; r3.monsters.length = 0; r3.pending = 0; r3.waveList = []; r3.ragnatele.length = 0;
  const sp3 = losSpot(r3, p3, 240);
  const rg = r3.spawnMonster('ragno', sp3.x, sp3.y, { scaling: Waves.scaling(8, 1) }); rg.awake = true; rg.telaT = 0;
  p3.hp = r3.effMaxHp(p3); const hp3 = p3.hp;
  let tessuto = false;
  for (let i = 0; i < C.TICK_RATE * 6 && !tessuto; i++) {
    p3.hp = r3.effMaxHp(p3);
    r3.setInput('c', { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false });
    r3.update(dt);
    if (r3.ragnatele.length) tessuto = true;
  }
  assert(tessuto, 'il ragno tesse una tela dove sei');
  const tela = r3.ragnatele[0];
  p3.buffs.ragnatela = 0;                     // il ragno ha gia' tessuto sotto ai piedi: si azzera per misurare
  const vPiena = r3.effSpeed(p3);
  p3.x = tela.x; p3.y = tela.y; p3.buffs.dash = 0;
  r3.updateRagnatele(dt);
  const vLenta = r3.effSpeed(p3);
  assert(vLenta < vPiena * 0.75, 'dentro la tela vai piu' + String.fromCharCode(39) + ' piano (' + vLenta.toFixed(0) + ' contro ' + vPiena.toFixed(0) + ')');
  // e non fa danno: il colpo del ragno e il morso, non il pavimento
  const hpTela = p3.hp;
  for (let i = 0; i < C.TICK_RATE; i++) { p3.x = tela.x; p3.y = tela.y; r3.updateRagnatele(dt); }
  assert(p3.hp === hpTela, 'e la tela non fa un solo punto di danno');
  // uscendo, il rallentamento si spegne da solo
  p3.x = tela.x + 900; p3.y = tela.y + 900;
  for (let i = 0; i < C.TICK_RATE; i++) { r3.updateRagnatele(dt); p3.buffs.ragnatela = Math.max(0, (p3.buffs.ragnatela || 0) - dt); }
  assert(!(p3.buffs.ragnatela > 0), 'uscito dalla tela torni veloce: non te la porti dietro');
  // la tela scade da sola
  const quante = r3.ragnatele.length;
  for (let i = 0; i < C.TICK_RATE * 10; i++) r3.updateRagnatele(dt);
  assert(r3.ragnatele.length < quante || r3.ragnatele.every(w => w.t > 0), 'le tele scadono col tempo');
  // tetto: non si copre la stanza
  r3.ragnatele.length = 0;
  const ctx3 = r3.makeCtx();
  for (let i = 0; i < 40; i++) ctx3.ragnatela(100 + i, 100, 90, 6, '#fff', 1);
  assert(r3.ragnatele.length <= (C.RAGNATELE_MAX || 14), 'c e un tetto alle tele in campo (' + r3.ragnatele.length + ')');

  // --- 4) le tele spariscono col cambio mappa: sono un posto, non un oggetto ---
  const r4 = new Room('v181d'); r4.addPlayer('d', { send() {} }, 'D', 'mago'); r4.startGame();
  r4.makeCtx().ragnatela(300, 300, 90, 6, '#fff', 1);
  assert(r4.ragnatele.length === 1, 'tela messa');
  r4.newMap(12345, 3);
  assert(r4.ragnatele.length === 0, 'e sparita con la mappa vecchia');

  ok('Larva e Ragni verificati');
}

// ============================================================================
// TEST 58 — v1.82: i mercenari
// La parte difficile non e' il mercenario: e' che il motore lo tratta come un GIOCATORE (corpo,
// bersaglio, morte) mentre le REGOLE non devono trattarlo cosi'. Ogni esclusione ha qui il suo
// controllo, perche' sbagliarne una non da' errore: cambia il bilanciamento in silenzio.
// ============================================================================
function testV182() {
  console.log('\n[TEST 58] v1.82 — mercenari: aiutano, e non contano come giocatori');
  const dt = 1 / C.TICK_RATE;
  const Mrc = require('../shared/mercenari.js');
  const conn = { send() {} };

  // --- 1) il listino e la scheda ---
  assert(Mrc.costo(1) === 50, 'un livello 1 costa 50 monete');
  assert(Mrc.costo(15) === 50 + 14 * 40, 'un livello 15 costa ' + Mrc.costo(15));
  for (let l = 2; l <= 15; l++) assert(Mrc.costo(l) > Mrc.costo(l - 1), 'il prezzo sale sempre col livello');
  assert(Mrc.punti(15) === 18, 'a livello 15 ha i 18 punti che avresti tu');
  const b15 = Mrc.distribuisci('guerriero', 15, Loot.STAT_MAX_LEVEL);
  assert(b15.st_for === 12 && b15.st_cos === 6, 'e li spende come la tua run: uno cappato (12) e sei sull altro');
  for (const cl of ['guerriero', 'mago', 'ladro']) {
    assert(Mrc.NOMI[cl].length === 15, cl + ': quindici nomi');
    assert(Mrc.NOMI[cl].every(n => n.length <= 8), cl + ': nomi corti, ci stanno sopra la testa');
    assert(new Set(Mrc.NOMI[cl]).size === 15, cl + ': tutti diversi');
    assert(Mrc.TINTE[cl].length >= 3, cl + ': almeno tre tinte');
  }

  // --- 2) si assolda al Banditore, in singolo, uno solo ---
  const r = new Room('v182a'); const p = r.addPlayer('a', conn, 'A', 'guerriero'); r.startGame();
  p.level = 5; r.enterMarket();
  p.x = r.bandit.x; p.y = r.bandit.y; p.coins = 1000;
  const off = r._offertaMerc(p);
  assert(!!off && off.lvl === 5, 'il candidato al banco ha il TUO livello');
  assert(off.costo === Mrc.costo(5), 'e il prezzo del listino (' + off.costo + ')');
  const prima = p.coins;
  r.assumiMercenario('a');
  assert(prima - p.coins === off.costo, 'assoldarlo costa esattamente quel prezzo');
  assert(!!r.mercData && r.mercData.nome === off.nome, 'e la scheda resta in camera');
  const secondo = r._offertaMerc(p);
  assert(!secondo, 'con uno al soldo il banco non ne offre un altro');
  // e non si paga due volte
  const c2 = p.coins; r.assumiMercenario('a');
  assert(p.coins === c2, 'e riprovare non toglie monete');
  // senza monete non si assolda
  const r0 = new Room('v182z'); const p0 = r0.addPlayer('a', conn, 'A', 'mago'); r0.startGame();
  p0.level = 8; r0.enterMarket(); p0.x = r0.bandit.x; p0.y = r0.bandit.y; p0.coins = 10;
  r0.assumiMercenario('a');
  assert(!r0.mercData, 'con dieci monete non si assolda nessuno');

  // --- 3) scende in campo con l ondata, non prima ---
  assert(!r.mercenario, 'al villaggio il mercenario non esiste: non ti segue');
  r.nextWave();
  const m = r.mercenario;
  assert(!!m, 'alla mappa dopo e in campo');
  assert(m.merc === true && m.mercOwner === 'a', 'ed e marcato come mercenario, col suo capo');
  assert(m.level === 5 && m.buys.st_cos >= 0, 'del livello giusto e coi punti spesi');
  assert(Math.abs(m.hp - r.effMaxHp(m)) < 1, 'e arriva curato del tutto');
  assert(!!m.pal, 'con la sua tinta');
  assert(Object.keys(m.boons || {}).length === 0 || !m.boonList || m.boonList.length === 0, 'nessuna abilita: ne passiva ne attiva');

  // --- 4) L ONDATA NON CRESCE. E' il punto di tutta la funzione: aiutare, non alzare l asticella. ---
  const senza = new Room('v182b'); const ps = senza.addPlayer('a', conn, 'A', 'guerriero'); senza.startGame();
  ps.level = 5;
  const con = new Room('v182b'); const pc = con.addPlayer('a', conn, 'A', 'guerriero'); con.startGame();
  pc.level = 5; con.enterMarket(); pc.x = con.bandit.x; pc.y = con.bandit.y; pc.coins = 1000; con.assumiMercenario('a');
  for (let w = 0; w < 4; w++) { senza.nextWave(); con.nextWave(); }
  assert(!!con.mercenario, 'nella stanza col mercenario c e il mercenario');
  assert(con.veri.length === 1, 'ma i giocatori VERI restano uno');
  assert(con.pending + con.waveList.length === senza.pending + senza.waveList.length,
    'e l ondata ha esattamente gli stessi nemici (' + (con.pending + con.waveList.length) + ' contro ' + (senza.pending + senza.waveList.length) + ')');
  assert(JSON.stringify(con.waveScaling) === JSON.stringify(senza.waveScaling), 'e la stessa durezza, voce per voce');

  // --- 5) L XP RESTA TUTTO TUO ---
  const xp0 = pc.xpPool, xpm = con.mercenario.xpPool;
  con.xpCondivisa(100, 'prova');
  assert(pc.xpPool - xp0 === 100, 'con un mercenario in campo prendi il 100% dell XP (' + (pc.xpPool - xp0) + ')');
  assert(con.mercenario.xpPool === xpm, 'e lui non ne prende un punto');

  // --- 6) non raccoglie niente da terra ---
  const mm = con.mercenario;
  con.groundXp.length = 0; con.groundCoins.length = 0;
  con.groundXp.push({ eid: 1, x: mm.x, y: mm.y, v: 50, t: 30, dead: false });
  con.groundCoins.push({ eid: 2, x: mm.x, y: mm.y, cid: 'c', t: 30, dead: false, v: 10 });
  pc.x = mm.x + 4000; pc.y = mm.y + 4000;
  const xpA = pc.xpPool, coA = pc.coins;
  for (let i = 0; i < C.TICK_RATE * 2; i++) con.updatePickups(dt);
  assert(con.groundXp.length === 1 && con.groundCoins.length === 1, 'sfere e monete sotto i piedi del mercenario restano li');
  assert(pc.xpPool === xpA && pc.coins === coA, 'e non arrivano nemmeno a te per magia');

  // --- 7) la quota della folla non raddoppia ---
  const rf = new Room('v182c'); const pf = rf.addPlayer('a', conn, 'A', 'guerriero'); rf.startGame();
  pf.level = 5; rf.enterMarket(); pf.x = rf.bandit.x; pf.y = rf.bandit.y; pf.coins = 1000; rf.assumiMercenario('a');
  rf.nextWave(); rf.phase = C.PHASE_COMBAT; rf.monsters.length = 0; rf.pending = 0; rf.waveList = [];
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2, x = pf.x + Math.cos(a) * 500, y = pf.y + Math.sin(a) * 500;
    if (rf.isWallAt(x, y)) continue;
    const mo = rf.spawnMonster('skeleton', x, y, { scaling: Waves.scaling(5, 1) }); if (mo) mo.awake = true;
  }
  rf._assegnaFolla();
  const impegnati = rf.monsters.filter(x => !x.dead && x.impegnato === 1).length;
  assert(impegnati <= C.FOLLA_MAX, 'col mercenario in campo si fanno sotto sempre e solo ' + C.FOLLA_MAX + ' nemici (' + impegnati + ')');

  // --- 8) il gioco non lo aspetta a fine ondata ---
  rf.monsters.length = 0; rf.pending = 0; rf.waveList = [];
  const c = rf._contaUscita();
  assert(c.tot === 1, 'a fine ondata si aspetta un solo giocatore, non due (' + c.tot + ')');

  // --- 9) LA SUA MORTE NON CHIUDE LA RUN, LA TUA SI ---
  const rd = new Room('v182d'); const pd = rd.addPlayer('a', conn, 'A', 'guerriero'); rd.startGame();
  pd.level = 6; rd.enterMarket(); pd.x = rd.bandit.x; pd.y = rd.bandit.y; pd.coins = 1000; rd.assumiMercenario('a');
  rd.nextWave();
  const md = rd.mercenario; assert(!!md, 'mercenario in campo');
  rd.downPlayer(md);
  assert(md.dead && !md.down, 'il mercenario muore e basta: niente "a terra", niente rianimazione');
  assert(rd.phase !== C.PHASE_GAMEOVER, 'e la partita continua');
  assert(!rd.mercenario, 'e non e piu in campo');
  // ...e adesso al banco se ne puo assoldare un altro
  rd._waveDone();
  assert(!rd.mercData, 'caduto lui, la scheda si libera: al banco se ne assolda un altro');
  // il contrario: il giocatore cade con un mercenario vivo
  const rg = new Room('v182e'); const pg = rg.addPlayer('a', conn, 'A', 'guerriero'); rg.startGame();
  pg.level = 6; rg.enterMarket(); pg.x = rg.bandit.x; pg.y = rg.bandit.y; pg.coins = 1000; rg.assumiMercenario('a');
  rg.nextWave();
  assert(!!rg.mercenario, 'mercenario vivo');
  pg.dead = true; pg.down = false;
  assert(rg.anyRevivable === false, 'se sei fuori TU non c e piu nessuno da rialzare: il mercenario vivo non tiene aperta la partita');

  // --- 10) fra un ondata e l altra sparisce, e torna curato ---
  const rw = new Room('v182f'); const pw = rw.addPlayer('a', conn, 'A', 'ladro'); rw.startGame();
  pw.level = 9; rw.enterMarket(); pw.x = rw.bandit.x; pw.y = rw.bandit.y; pw.coins = 1000; rw.assumiMercenario('a');
  rw.nextWave();
  const m1 = rw.mercenario; m1.hp = 3;
  rw._waveDone();
  assert(!rw.mercenario, 'a fine ondata non ti segue al villaggio');
  assert(!!rw.mercData, 'ma resta al tuo soldo');
  rw.nextWave();
  const m2 = rw.mercenario;
  assert(!!m2, 'e lo ritrovi sulla mappa dopo');
  assert(Math.abs(m2.hp - rw.effMaxHp(m2)) < 1, 'curato del tutto (' + Math.round(m2.hp) + '/' + Math.round(rw.effMaxHp(m2)) + ')');
  assert(m2.name === m1.name, 'ed e lo stesso: stesso nome');

  // --- 11) solo in singolo, e uno solo ---
  const r2 = new Room('v182g'); const q1 = r2.addPlayer('a', conn, 'A', 'guerriero'); r2.addPlayer('b', conn, 'B', 'mago'); r2.startGame();
  r2.enterMarket(); q1.x = r2.bandit.x; q1.y = r2.bandit.y; q1.coins = 1000;
  r2.assumiMercenario('a');
  assert(!r2.mercData, 'in due non si assoldano mercenari');

  // --- 12) la testa: segue il capo e attacca ---
  const ra = new Room('v182h'); const pa = ra.addPlayer('a', conn, 'A', 'guerriero'); ra.startGame();
  pa.level = 6; ra.enterMarket(); pa.x = ra.bandit.x; pa.y = ra.bandit.y; pa.coins = 1000; ra.assumiMercenario('a');
  // ATTENZIONE: l ondata va tenuta APERTA. Svuotando il campo, update() la chiude al primo tick e ritira
  // il mercenario — che e' esattamente cio' che deve fare, ma qui si misura altro. Con `pending` a 5 e la
  // lista vuota non entra nessuno e l ondata non finisce mai: campo pulito e cronometro fermo.
  ra.nextWave(); ra.phase = C.PHASE_COMBAT; ra.monsters.length = 0; ra.pending = 5; ra.waveList = [];
  const ma = ra.mercenario;
  assert(!!ma, 'mercenario in campo per la prova');
  // Il punto dove metterlo serve LIBERO PER UN CORPO, non solo non-muro: losSpot guarda un punto, ma un
  // giocatore ha un raggio. Al primo tentativo finiva incastrato nella roccia e il test misurava
  // l anti-incastro invece dell IA — restava fermo a 592 px e sembrava che il guinzaglio non funzionasse.
  const largo = (dist) => {
    for (let k = 0; k < 96; k++) {
      const a = (k / 96) * Math.PI * 2, x = pa.x + Math.cos(a) * dist, y = pa.y + Math.sin(a) * dist;
      if (ra.isWallAt(x, y) || !ra.losClear(pa.x, pa.y, x, y)) continue;
      let ok2 = true;
      for (const [dx, dy] of [[30, 0], [-30, 0], [0, 30], [0, -30], [22, 22], [-22, -22]]) if (ra.isWallAt(x + dx, y + dy)) { ok2 = false; break; }
      if (ok2) return { x, y };
    }
    return null;
  };
  const via = largo(560);
  assert(!!via, 'trovato un punto libero a 560 px dal capo');
  ma.x = via.x; ma.y = via.y;
  const d0 = MU.dist(ma.x, ma.y, pa.x, pa.y);
  const fermo = { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false };
  for (let i = 0; i < C.TICK_RATE * 5; i++) { pa.hp = ra.effMaxHp(pa); ra.setInput('a', fermo); ra.update(dt); }
  const d1 = MU.dist(ma.x, ma.y, pa.x, pa.y);
  assert(d1 < d0 * 0.5, 'se resta indietro torna dal capo (da ' + d0.toFixed(0) + ' a ' + d1.toFixed(0) + ' px)');

  // un mostro accanto al capo: se lo prende lui
  const sp = largo(170) || losSpot(ra, pa, 170);
  const bersaglio = ra.spawnMonster('skeleton', sp.x, sp.y, { scaling: Waves.scaling(2, 1) });
  assert(!!bersaglio, 'bersaglio piazzato');
  bersaglio.awake = true;
  const hp0 = bersaglio.hp;
  for (let i = 0; i < C.TICK_RATE * 8 && !bersaglio.dead; i++) {
    pa.hp = ra.effMaxHp(pa); bersaglio.x = sp.x; bersaglio.y = sp.y;   // tenuto fermo: si misura il mercenario
    ra.setInput('a', fermo); ra.update(dt);
  }
  assert(bersaglio.dead || bersaglio.hp < hp0, 'e i nemici vicini se li prende lui (' + Math.round(hp0 - bersaglio.hp) + ' danni)');

  // --- 13) v1.82.2: NON SI INCASTRA ---
  // Il difetto: un nemico entra nel campo visivo ma fra i due c'e' un masso o un cunicolo stretto. Il
  // mercenario puntava dritto e restava li' a spingere contro la roccia — il motore fa scivolare lungo i
  // muri, ma se spingi PERPENDICOLARE non c'e' niente su cui scivolare. Due rimedi, uno per causa.
  {
    const capoF = { x: -100, y: 0, dead: false };
    const mF = { x: 0, y: 0, hp: 100, maxHp: 100, hero: Heroes.HEROES.guerriero, stats: { maxHpFlat: 0 }, fireCd: 0, cdDash: 0 };
    const meta = () => 0.5;   // niente jitter: si misura la direzione, non il caso
    // a) SENZA LINEA DI VISTA un nemico lontano non e' un bersaglio: si torna dal capo invece di spingere
    const cieco = { dt: 1 / C.TICK_RATE, monsters: [{ x: 300, y: 0, dead: false }], losClear: () => false };
    let i1 = Mrc.pensa(cieco, mF, capoF, meta);
    assert(i1.mx < 0, 'col nemico dietro al masso non ci punta contro: torna verso il capo');
    // b) e se comunque resta a spingere senza spostarsi, dopo un attimo cammina DI TRAVERSO
    const dir0 = Math.atan2(i1.my, i1.mx);
    let i2 = i1;
    for (let k = 0; k < 14; k++) i2 = Mrc.pensa(cieco, mF, capoF, meta);   // mF non si muove mai: e' incastrato
    const dir1 = Math.atan2(i2.my, i2.mx);
    let scarto = Math.abs(((dir1 - dir0 + Math.PI) % (Math.PI * 2)) - Math.PI);
    assert(scarto > 0.8, 'spinge e non si sposta: dopo un quarto di secondo cambia direzione (' + (scarto * 57).toFixed(0) + ' gradi)');
    // c) col nemico A PORTATA DI MANO lo prende comunque, linea di vista o no (e' dietro l angolo)
    const vicino = { dt: 1 / C.TICK_RATE, monsters: [{ x: 90, y: 0, dead: false }], losClear: () => false };
    const mG = { x: 0, y: 0, hp: 100, maxHp: 100, hero: Heroes.HEROES.guerriero, stats: { maxHpFlat: 0 }, fireCd: 0, cdDash: 0 };
    const i3 = Mrc.pensa(vicino, mG, capoF, meta);
    assert(i3.aim === 0, 'un nemico a novanta px lo affronta comunque: dietro l angolo si mena lo stesso');
    // d) il mago non spara contro il muro
    const mM = { x: 0, y: 0, hp: 100, maxHp: 100, hero: Heroes.HEROES.mago, stats: { maxHpFlat: 0 }, fireCd: 0, cdDash: 0 };
    const conVista = { dt: 1 / C.TICK_RATE, monsters: [{ x: 300, y: 0, dead: false }], losClear: () => true };
    const senzaVista = { dt: 1 / C.TICK_RATE, monsters: [{ x: 120, y: 0, dead: false }], losClear: () => false };
    assert(Mrc.pensa(conVista, mM, capoF, meta).shoot === true, 'con la strada libera il mago spara');
    assert(Mrc.pensa(senzaVista, { x: 0, y: 0, hp: 100, maxHp: 100, hero: Heroes.HEROES.mago, stats: { maxHpFlat: 0 }, fireCd: 0, cdDash: 0 }, capoF, meta).shoot === false, 'contro il muro no: sprecherebbe la ricarica');
  }
  // e) sul campo vero: messo con la faccia contro la roccia, dopo qualche secondo si e' spostato
  {
    const rb = new Room('v182i'); const pb = rb.addPlayer('a', conn, 'A', 'guerriero'); rb.startGame();
    pb.level = 4; rb.enterMarket(); pb.x = rb.bandit.x; pb.y = rb.bandit.y; pb.coins = 1000; rb.assumiMercenario('a');
    rb.nextWave(); rb.phase = C.PHASE_COMBAT; rb.monsters.length = 0; rb.pending = 5; rb.waveList = [];
    const mb = rb.mercenario;
    // si cerca un punto libero con la ROCCIA a ridosso: e' li che prima restava a spingere
    let posato = null;
    for (let k = 0; k < 200 && !posato; k++) {
      const a = (k / 200) * Math.PI * 2, x = pb.x + Math.cos(a) * 150, y = pb.y + Math.sin(a) * 150;
      if (rb.isWallAt(x, y)) continue;
      for (const [dx, dy] of [[34, 0], [-34, 0], [0, 34], [0, -34]]) if (rb.isWallAt(x + dx, y + dy)) { posato = { x, y, mx: dx, my: dy }; break; }
    }
    if (posato) {
      mb.x = posato.x; mb.y = posato.y;
      // un nemico oltre la roccia, nella direzione del muro
      const mo = rb.spawnMonster('skeleton', posato.x + posato.mx * 6, posato.y + posato.my * 6, { scaling: Waves.scaling(3, 1) });
      if (mo) mo.awake = true;
      const sx = mb.x, sy = mb.y;
      const fermo2 = { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false };
      let percorso = 0, px2 = mb.x, py2 = mb.y;
      for (let i = 0; i < C.TICK_RATE * 5; i++) {
        pb.hp = rb.effMaxHp(pb); rb.setInput('a', fermo2); rb.update(dt);
        percorso += MU.dist(mb.x, mb.y, px2, py2); px2 = mb.x; py2 = mb.y;
      }
      assert(percorso > 90, 'con la roccia davanti non resta piantato: in 5 s percorre ' + percorso.toFixed(0) + ' px');
    } else { assert(true, 'nessun angolo di roccia utile su questa mappa: prova saltata'); }
  }

  ok('mercenari verificati: aiutano, e non contano come giocatori');
}

testMapThemes(); testLives(); testBoons(); testWeaponEvo(); testModes(); testHitstop(); testXpItems(); testV16(); testV17(); testV18(); testV19(); testV110(); testV111(); testV112(); testV113(); testV139(); testV142(); testV143(); testV145(); testV147(); testV149(); testV150(); testV151(); testV152(); testV153(); testV157(); testV158(); testV159(); testV160(); testV161(); testV162(); testV163(); testV164(); testV166(); testV167(); testV168(); testV169(); testV170(); testV171(); testV172(); testV173(); testV174(); testV1741(); testV175(); testV1752(); testV1761(); testV177(); testV178(); testV179(); testV1791(); testV1792(); testBeholder179(); testV180(); testV181(); testV182(); testPonteClient(); testSanity(); testFullRun(1, 'solo'); testFullRun(3, 'trio'); testFullRun(6, 'stress');
console.log('\n=================================================='); console.log(`  RISULTATO: ${PASS} passati, ${FAIL} falliti  (${((Date.now() - T0) / 1000).toFixed(1)}s)`); console.log('==================================================');
process.exit(FAIL > 0 ? 1 : 0);
