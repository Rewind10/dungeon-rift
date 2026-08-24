/* Room.js — sessione di gioco autoritativa (server) — v1.9 pausa-shop/nuove-abilita/scenografia */
'use strict';
const C = require('../shared/constants.js');
const MU = require('../shared/mathutils.js');
const Heroes = require('../shared/heroes.js');
const Mon = require('../shared/monsters.js');
const Loot = require('../shared/loot.js');
const MapGen = require('../shared/mapgen.js');
const PF = require('../shared/pathfinding.js');
const AI = require('../shared/ai.js');
const Waves = require('../shared/waves.js');
let NEXT = 1;

function newBoon() { return { bounce: 0, pierce: 0, chain: 0, poison: 0, explodeEvery: 0, killNova: 0, bulletSize: 0, slow: 0, thorns: 0, killHaste: 0, homing: 0, toxicBurst: 0, frostChain: 0 }; }

class Room {
  constructor(id) {
    this.id = id; this.players = new Map(); this.monsters = []; this.bullets = []; this.orbs = []; this.meteors = [];
    this.crates = []; this.weaponDrops = []; this.groundXp = []; this.groundCoins = []; this.items = []; this.zones = []; this.merchant = null; this.darkMerchant = null; this.events = [];
    this.phase = C.PHASE_LOBBY; this.wave = 0; this.time = 0; this.map = null;
    this.pending = 0; this.spawnTimer = 0; this.shopTimer = 0; this.flow = null; this.flowTimer = 0;
    this.bossAlive = false; this.dt = 1 / C.TICK_RATE; this.mode = Waves.MODES.assault; this.surviveT = 0;
    this.newMap(1234 + (id.charCodeAt ? id.charCodeAt(0) : 0), 1);
  }
  get alivePlayers() { const a = []; for (const p of this.players.values()) if (p.connected && !p.dead) a.push(p); return a; }
  get anyConnected() { for (const p of this.players.values()) if (p.connected) return true; return false; }
  get anyRevivable() { for (const p of this.players.values()) if (p.connected && (!p.dead || (p.down && p.lives > 1))) return true; return false; }
  broadcast(o) { const s = JSON.stringify(o); for (const p of this.players.values()) if (p.conn) try { p.conn.send(s); } catch (_) {} }
  sendTo(pid, o) { const p = this.players.get(pid); if (p && p.conn) try { p.conn.send(JSON.stringify(o)); } catch (_) {} }

  newMap(seed, level) {
    this.map = MapGen.generate(seed >>> 0, level); this.flow = null;
    this.crates.length = 0; this.weaponDrops.length = 0; this.groundXp.length = 0; this.groundCoins.length = 0; this.items.length = 0;
    for (const p of this.players.values()) { p.x = this.map.spawn.x + MU.rand(-40, 40); p.y = this.map.spawn.y + MU.rand(-40, 40); }
    this.spawnCrates(); this.spawnWeapons();
    this.broadcast({ t: C.MSG.MAP, map: this.map, wave: this.wave });
    // v1.13 — UN SOLO mercante per round: il Nero SOSTITUISCE casualmente l'ufficiale (mai entrambi).
    this.merchant = null; this.darkMerchant = null;
    if (Math.random() < 0.30) this.spawnDarkMerchant(); // 30% mercato nero al posto di quello ufficiale
    else this.spawnMerchant();
  }
  spawnCrates() { const s = (this.map.crateSpawns || []).slice(); if (!s.length) return; const n = 3 + Math.floor(Math.random() * 3); for (let i = 0; i < n && s.length; i++) { const c = s.splice((Math.random() * s.length) | 0, 1)[0]; this.crates.push({ eid: NEXT++, x: c.x, y: c.y, r: 16, mimic: Math.random() < 0.30, opened: false }); } }
  spawnWeapons() { const s = (this.map.crateSpawns || []).slice(); if (!s.length) return; const n = 2 + Math.floor(Math.random() * 2); for (let i = 0; i < n && s.length; i++) { const c = s.splice((Math.random() * s.length) | 0, 1)[0]; if (this.crates.some(x => MU.dist(x.x, x.y, c.x, c.y) < 40)) { i--; continue; } const wt = Loot.WEAPON_ORDER[(Math.random() * Loot.WEAPON_ORDER.length) | 0]; this.weaponDrops.push({ eid: NEXT++, x: c.x, y: c.y, r: 14, wt, level: 1 + (Math.random() < 0.3 ? 1 : 0), taken: false }); } }

  addPlayer(pid, conn, name, heroId) {
    const hero = Heroes.HEROES[heroId] || Heroes.HEROES.enforcer;
    const p = {
      id: pid, conn, connected: true, name: (name || 'Eroe').slice(0, 16), heroId: hero.id, hero,
      x: this.map.spawn.x + MU.rand(-40, 40), y: this.map.spawn.y + MU.rand(-40, 40), vx: 0, vy: 0, aim: 0, radius: C.PLAYER_RADIUS * (C.COL_SCALE || 1),
      hp: hero.hp, maxHp: hero.hp, dead: false, down: false, downT: 0, fireCd: 0, facing: 0,
      input: { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false }, cdQ: 0, cdE: 0, cdDash: 0, buffs: {},
      lives: C.START_LIVES, xpPool: 0, buys: {}, weapon2: null, coins: 0, gear: { armor: 0, boots: 0, weapon: 0 },
      boon: newBoon(), boonsOwned: {}, boonOffer: null, boonPicked: false, boonShot: 0,
      stats: { dmgFlat: 0, dmgMult: 1, fireRateMult: 1, maxHpFlat: 0, speedMult: 1, critChance: hero.id === 'glitch' ? 0.05 : 0.03, critMult: 2.0, pierce: hero.weapon.pierce || 0, extraProjectiles: 0, lifesteal: 0, cdrMult: 1, knockMult: 1, novaEvery: 0, abilityMult: 1, regen: 0, xpMult: 1, dmgReduce: 0 },
      shotCount: 0, kills: 0, damageDealt: 0, combo: 0, comboBest: 0, comboT: 0, synActive: {}, comboRewT: 0,
    };
    this.players.set(pid, p); return p;
  }
  removePlayer(pid) { const p = this.players.get(pid); if (p) { p.connected = false; p.conn = null; } }
  setInput(pid, i) { const p = this.players.get(pid); if (!p) return; p.input.mx = MU.clamp(i.mx || 0, -1, 1); p.input.my = MU.clamp(i.my || 0, -1, 1); p.input.aim = i.aim || 0; p.input.shoot = !!i.shoot; p.input.q = !!i.q; p.input.e = !!i.e; p.input.dash = !!i.dash; }

  startGame() {
    if (this.phase !== C.PHASE_LOBBY && this.phase !== C.PHASE_GAMEOVER && this.phase !== C.PHASE_VICTORY) return;
    this.wave = 0; this.monsters.length = 0; this.bullets.length = 0;
    for (const p of this.players.values()) { p.dead = false; p.down = false; p.hp = p.maxHp; p.kills = 0; p.buffs = {}; p.weapon2 = null; p.lives = C.START_LIVES; p.xpPool = 0; p.buys = {}; p.boon = newBoon(); p.boonsOwned = {}; p.boonShot = 0; p.combo = 0; p.comboBest = 0; p.comboT = 0; p.synActive = {}; p.comboRewT = 0; p.damageDealt = 0; p.coins = 0; p.gear = { armor: 0, boots: 0, weapon: 0 }; }
    this.runStart = this.time; this.newMap((Math.random() * 1e9) | 0, 1); this.nextWave();
  }
  nextWave() {
    this.wave++;
    this.mode = Waves.modeForWave(this.wave); this.surviveT = this.mode.survive || 0; this.treasure = null;
    this.phase = Waves.isBossWave(this.wave) ? C.PHASE_BOSS : C.PHASE_COMBAT;
    if (this.wave > 1 && this.wave % 2 === 1) this.newMap((Math.random() * 1e9) | 0, this.wave);
    else { if (!this.crates.length) this.spawnCrates(); if (!this.weaponDrops.length) this.spawnWeapons(); }
    if (Waves.isBossWave(this.wave)) { this.spawnBoss(); this.pending = Math.round(4 + this.wave * 0.5); }
    else { const w = Waves.buildWave(this.wave, this.alivePlayers.length || 1, this.mode); this.waveList = w.list; this.waveScaling = w.scaling; this.pending = w.list.length; if (this.mode.treasure) this.spawnTreasure(); }
    this.spawnTimer = 0; this.broadcast({ t: C.MSG.EVENT, ev: { t: 'wave', wave: this.wave, boss: Waves.isBossWave(this.wave), final: this.wave >= Waves.FINAL_WAVE, mode: this.mode.id, modeName: this.mode.name, modeColor: this.mode.color, modeDesc: this.mode.desc } });
  }
  spawnTreasure() { const pos = this.randomSpawnPos(); const m = this.spawnMonster('mimic', pos.x, pos.y, { scaling: this.waveScaling }); m.treasure = true; m.awake = true; m.maxHp = Math.round(m.maxHp * 2.4); m.hp = m.maxHp; m.speed = 210; m.escapeT = 26; this.treasure = m; this.events.push({ t: 'treasure_spawn', x: m.x, y: m.y }); }
  randomSpawnPos() { const sp = this.map.enemySpawns; if (sp && sp.length) { const c = sp[(Math.random() * sp.length) | 0]; return { x: c.x * C.TILE + C.TILE / 2, y: c.y * C.TILE + C.TILE / 2 }; } return { x: this.map.spawn.x, y: this.map.spawn.y }; }
  spawnMonster(typeId, x, y, opts = {}) {
    const def = Mon.MONSTERS[typeId] || Mon.BOSSES[typeId] || Mon.MONSTERS.skeleton;
    const m = { eid: NEXT++, type: def.id, def: Object.assign({}, def), x, y, mx: 0, my: 0, facing: 0, hp: def.hp, maxHp: def.hp, dmg: def.dmg, speed: def.speed, radius: def.radius, xp: def.xp, atkT: MU.rand(0, def.atkCd), stun: 0, elite: false, hitFlash: 0, boss: !!def.boss, mega: !!def.mega, awake: def.ai !== 'ambush', slowT: 0, poison: 0, poisonT: 0 };
    if (opts.scaling) Waves.applyScaling(m, opts.scaling, opts.elite);
    if (opts.hpMul) { m.maxHp = Math.round(m.maxHp * opts.hpMul); m.hp = m.maxHp; }
    if (opts.dmgMul) m.dmg = Math.round(m.dmg * opts.dmgMul);
    m.radius = m.radius * (C.COL_SCALE || 1); // v1.13 — collisione leggermente piu grande (velocita invariata)
    if (def.id === 'occhio') { m.gazeKind = ['weaken', 'slow', 'sunder'][(Math.random() * 3) | 0]; m.gazeActive = 0; } // v1.34 — tipo di sguardo fisso per l'occhio
    this.monsters.push(m); return m;
  }
  spawnBoss() { const b = Waves.bossForWave(this.wave, this.alivePlayers.length || 1); const pos = this.randomSpawnPos(); const m = this.spawnMonster(b.def.id, pos.x, pos.y, { hpMul: b.hpMul, dmgMul: b.dmgMul }); m.boss = true; this.bossAlive = true; this.broadcast({ t: C.MSG.EVENT, ev: { t: 'boss_spawn', name: b.def.name, mega: !!b.def.mega } }); }

  tileAtWorld(x, y) { const gx = (x / C.TILE) | 0, gy = (y / C.TILE) | 0; if (gx < 0 || gy < 0 || gx >= this.map.w || gy >= this.map.h) return C.T_WALL; return this.map.grid[gy * this.map.w + gx]; }
  isWallAt(x, y) { return this.tileAtWorld(x, y) === C.T_WALL; }
  moveCircle(e, dx, dy) { const r = e.radius * 0.8; let nx = e.x + dx; if (!this._blk(nx, e.y, r)) e.x = nx; else e.x = this._snap(e.x, nx, e.y, r, true); let ny = e.y + dy; if (!this._blk(e.x, ny, r)) e.y = ny; else e.y = this._snap(e.y, ny, e.x, r, false); }
  _blk(x, y, r) { return this.isWallAt(x - r, y) || this.isWallAt(x + r, y) || this.isWallAt(x, y - r) || this.isWallAt(x, y + r); }
  _snap(cur, tgt, oth, r, isX) { const st = tgt > cur ? 1 : -1; let v = cur; for (let i = 0; i < 12; i++) { const t = v + st * 2; const bx = isX ? t : oth, by = isX ? oth : t; if (this._blk(bx, by, r)) break; v = t; } return v; }
  _unstuck(e) { const T = C.TILE; const gx = (e.x / T) | 0, gy = (e.y / T) | 0; let best = null, bd = Infinity; for (let ry = -3; ry <= 3; ry++) for (let rx = -3; rx <= 3; rx++) { const nx = gx + rx, ny = gy + ry; if (nx < 0 || ny < 0 || nx >= this.map.w || ny >= this.map.h) continue; if (this.map.grid[ny * this.map.w + nx] === C.T_WALL) continue; const cx = nx * T + T / 2, cy = ny * T + T / 2; const d = MU.dist2(e.x, e.y, cx, cy); if (d < bd) { bd = d; best = { x: cx, y: cy }; } } if (best) { const n = MU.norm(best.x - e.x, best.y - e.y); e.x += n.x * 6; e.y += n.y * 6; if (this.isWallAt(e.x, e.y) && bd < 9999) { e.x = best.x; e.y = best.y; } } }
  // v1.43 — RECUPERO da INCASTRO (per QUALSIASI mostro, boss compresi). Il monster è "incastrato" quando prova a
  // muoversi ma non avanza (wedge in un angolo, senza essere dentro un muro). Qui prova a SCIVOLARE: tra 8 direzioni
  // sceglie quella non bloccata più allineata all'intento; se persiste, fa un piccolo salto verso una cella libera.
  _recoverStuck(m, aim) {
    const r = m.radius * 0.8; const step = Math.max(8, m.speed * this.dt * 1.2);
    let bx = null, by = null, best = -Infinity;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; const nx = m.x + Math.cos(a) * step, ny = m.y + Math.sin(a) * step; if (this._blk(nx, ny, r)) continue; const score = 1 + Math.cos(a - aim); if (score > best) { best = score; bx = nx; by = ny; } }
    if (bx != null) { m.x = bx; m.y = by; return; }
    // completamente circondato al passo attuale → piccolo salto verso il centro della cella libera più vicina
    const T = C.TILE, gx = (m.x / T) | 0, gy = (m.y / T) | 0; let tgt = null, bd = Infinity;
    for (let ry = -2; ry <= 2; ry++) for (let rx = -2; rx <= 2; rx++) { if (!rx && !ry) continue; const nx = gx + rx, ny = gy + ry; if (nx < 1 || ny < 1 || nx >= this.map.w - 1 || ny >= this.map.h - 1) continue; if (this.map.grid[ny * this.map.w + nx] === C.T_WALL) continue; const cx = nx * T + T / 2, cy = ny * T + T / 2; if (this._blk(cx, cy, r)) continue; const d = MU.dist2(m.x, m.y, cx, cy); if (d < bd) { bd = d; tgt = { x: cx, y: cy }; } }
    if (tgt) { const n = MU.norm(tgt.x - m.x, tgt.y - m.y); m.x += n.x * Math.min(step * 1.5, Math.sqrt(bd)); m.y += n.y * Math.min(step * 1.5, Math.sqrt(bd)); }
  }
  losClear(ax, ay, bx, by) { const steps = Math.ceil(MU.dist(ax, ay, bx, by) / (C.TILE * 0.5)); for (let i = 1; i < steps; i++) { const t = i / steps; if (this.isWallAt(MU.lerp(ax, bx, t), MU.lerp(ay, by, t))) return false; } return true; }

  makeCtx() {
    const self = this;
    return {
      dt: this.dt, now: this.time,
      nearest(m) { return self._nearestPlayer(m.x, m.y); },
      flowStep(m) { if (!self.flow) return { x: 0, y: 0, d: -1 }; const gx = (m.x / C.TILE) | 0, gy = (m.y / C.TILE) | 0; return PF.stepDir(self.flow, self.map.grid, self.map.w, self.map.h, gx, gy); },
      losClear: (a, b, c, d) => self.losClear(a, b, c, d),
      isWallAt: (x, y) => self.isWallAt(x, y),
      shoot(m, dx, dy, spd, dmg, color) { self.bullets.push({ eid: NEXT++, hostile: true, x: m.x, y: m.y, vx: dx * spd, vy: dy * spd, r: C.BULLET_RADIUS + 1, dmg, color: color || '#ff5252', life: 3.2, pierce: 0, owner: m.eid, curse: m.def.curse ? 1 : 0 }); },
      summon(id, x, y) { if (self.monsters.length > 260) return; const s = self.waveScaling || Waves.scaling(self.wave, self.alivePlayers.length || 1); self.spawnMonster(id, x, y, { scaling: s }); },
      // v1.39 — evocazione OWNED (con proprietario) per il tetto di minion del Negromante
      summonMinion(id, x, y, owner) { if (self.monsters.length > 260) return; const s = self.waveScaling || Waves.scaling(self.wave, self.alivePlayers.length || 1); const mm = self.spawnMonster(id, x, y, { scaling: s }); if (mm) { mm.owner = owner; mm.minion = true; } return mm; },
      countMinions(owner) { let c = 0; for (const mm of self.monsters) { if (!mm.dead && mm.owner === owner) c++; } return c; },
      melee(m, p, dmg, kn) { self.damagePlayer(p, dmg, m.x, m.y, kn || 1); if (p.boon && p.boon.thorns > 0 && !m.dead) self.damageMonster(m, p.boon.thorns, p.x, p.y, 0, p); },
      areaDamage(x, y, r, dmg, color, kn) { self.events.push({ t: 'area', x, y, r, c: color }); for (const p of self.alivePlayers) if (MU.dist(x, y, p.x, p.y) <= r + p.radius) self.damagePlayer(p, dmg, x, y, kn || 1); },
      meteor(x, y, r, dmg) { self.meteors.push({ eid: NEXT++, x, y, r, dmg, t: 1.1, max: 1.1 }); self.events.push({ t: 'meteor_tell', x, y, r }); },
      zone(x, y, r, delay, dmg, color) { self.zones.push({ eid: NEXT++, x, y, r, dmg, t: delay || 0.9, max: delay || 0.9, col: color || '#ff3b3b', done: false }); self.events.push({ t: 'zone_tell', x, y, r, delay: delay || 0.9, c: color || '#ff3b3b' }); },
      spread(m, cx, cy, n, arc, spd, dmg, color) { const base = Math.atan2(cy, cx); for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * arc; self.bullets.push({ eid: NEXT++, hostile: true, x: m.x, y: m.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: C.BULLET_RADIUS + 1, dmg, color: color || '#ff5252', life: 3.2, pierce: 0, owner: m.eid, curse: m.def.curse ? 1 : 0 }); } },
      emit(ev) { self.events.push(ev); },
      GAZE_TICK: C.GAZE_TICK,
      gaze(m, p, kind) { self.gazePlayer(p, kind); },
    };
  }
  _nearestPlayer(x, y) { let best = null, bd = Infinity; for (const p of this.alivePlayers) { const d = MU.dist2(x, y, p.x, p.y); if (d < bd) { bd = d; best = p; } } return best; }

  // ===== NPC MERCANTE (v1.11) — neutrale, vende 3 offerte casuali per MONETE =====
  merchantWaresPool() {
    return [
      { id: 'heal', name: 'Bende del Viandante', icon: '❤️', color: '#ff5a7a', cost: 45, kind: 'heal', desc: 'Ripristina il 55% dei PV' },
      { id: 'maxhp', name: 'Talismano Vitale', icon: '🧿', color: '#4bd66b', cost: 130, kind: 'maxhp', val: 30, desc: '+30 PV massimi (permanente)' },
      { id: 'weapon', name: 'Cassa Armi', icon: '🔫', color: '#ffb020', cost: 100, kind: 'weapon', desc: 'Un\'arma casuale' },
      { id: 'boon', name: 'Reliquia Arcana', icon: '🎴', color: '#b061ff', cost: 120, kind: 'boon', desc: 'Scegli subito un Potere' },
      { id: 'life', name: 'Cuore di Fenice', icon: '💗', color: '#ff77cc', cost: 180, kind: 'life', desc: '+1 vita' },
      { id: 'dmg', name: 'Olio Affilante', icon: '⚔️', color: '#ff8a5b', cost: 110, kind: 'dmg', val: 0.12, desc: '+12% danno (permanente)' },
      { id: 'speed', name: 'Sandali del Vento', icon: '👟', color: '#8bd6ff', cost: 85, kind: 'speed', val: 0.08, desc: '+8% velocita (permanente)' },
      { id: 'shield', name: 'Egida Tascabile', icon: '🛡️', color: '#7dffea', cost: 95, kind: 'shield', val: 0.06, desc: '-6% danni subiti (permanente)' },
    ];
  }
  spawnMerchant() {
    const pool = this.merchantWaresPool(); const wares = [];
    const idxs = pool.map((_, i) => i);
    for (let i = 0; i < 3 && idxs.length; i++) { const k = idxs.splice((Math.random() * idxs.length) | 0, 1)[0]; wares.push(Object.assign({}, pool[k])); }
    // posizione: preferisci una micro-area, altrimenti vicino allo spawn
    let pos = null; const ma = (this.map && this.map.microAreas) || [];
    if (ma.length) pos = ma[(Math.random() * ma.length) | 0];
    if (!pos || this.isWallAt(pos.x, pos.y)) pos = { x: this.map.spawn.x + MU.rand(-120, 120), y: this.map.spawn.y + MU.rand(-120, 120) };
    if (this.isWallAt(pos.x, pos.y)) pos = { x: this.map.spawn.x, y: this.map.spawn.y };
    this.merchant = { x: pos.x, y: pos.y, r: 18, wares };
    for (const p of this.players.values()) p._nearMerch = false;
    this.broadcast({ t: C.MSG.OFFER_MERCHANT, wares });
  }
  updateMerchant(dt) {
    if (!this.merchant) return; const RANGE = 74;
    for (const p of this.alivePlayers) {
      const near = MU.dist(p.x, p.y, this.merchant.x, this.merchant.y) <= RANGE;
      if (near && !p._nearMerch) { p._nearMerch = true; this.sendTo(p.id, { t: C.MSG.OFFER_MERCHANT, wares: this.merchant.wares, near: 1 }); }
      else if (!near && p._nearMerch) { p._nearMerch = false; this.sendTo(p.id, { t: C.MSG.EVENT, ev: { t: 'merchant_leave' } }); }
    }
  }
  buyMerchant(pid, wareId) {
    const p = this.players.get(pid); if (!p || !this.merchant || p.dead) return;
    if (MU.dist(p.x, p.y, this.merchant.x, this.merchant.y) > 84) return; // deve essere vicino
    const w = this.merchant.wares.find(x => x.id === wareId); if (!w) return;
    if (p.coins < w.cost) return;
    p.coins -= w.cost;
    if (w.kind === 'heal') { p.hp = Math.min(this.effMaxHp(p), p.hp + Math.round(this.effMaxHp(p) * 0.55)); }
    else if (w.kind === 'maxhp') { p.stats.maxHpFlat += w.val; p.hp += w.val; }
    else if (w.kind === 'weapon') { const wt = Loot.WEAPON_ORDER[(Math.random() * Loot.WEAPON_ORDER.length) | 0]; this._giveWeapon(p, wt); }
    else if (w.kind === 'life') { p.lives += 1; }
    else if (w.kind === 'dmg') { p.stats.dmgMult += w.val; }
    else if (w.kind === 'speed') { p.stats.speedMult += w.val; }
    else if (w.kind === 'shield') { p.stats.dmgReduce = Math.min(0.85, (p.stats.dmgReduce || 0) + w.val); }
    else if (w.kind === 'boon') { this.phase === C.PHASE_SHOP || this.offerBoon(p); }
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'merchant_buy', id: w.id, name: w.name, icon: w.icon, color: w.color, x: p.x, y: p.y } });
    this.sendTo(pid, { t: C.MSG.OFFER_MERCHANT, wares: this.merchant.wares, near: 1, coins: p.coins });
  }

  // ===== MERCANTE NERO (v1.12) — patti RISCHIO/RICOMPENSA, appare a caso e nascosto =====
  darkWaresPool() {
    return [
      { id: 'pact_berserk', name: 'Patto del Berserker', icon: '😈', color: '#ff3b3b', cost: 60, kind: 'pact_berserk', desc: '+35% danno, ma -25 PV massimi' },
      { id: 'pact_glass', name: 'Patto di Cristallo', icon: '🔮', color: '#ff6ad5', cost: 55, kind: 'pact_glass', desc: '+30% cadenza, ma +12% danni subiti' },
      { id: 'pact_leech', name: 'Patto Sanguinario', icon: '🩸', color: '#a4133c', cost: 70, kind: 'pact_leech', desc: '+10% vampirismo, ma -8% velocita' },
      { id: 'pact_swift', name: 'Patto dell\'Ombra', icon: '💨', color: '#9b5de5', cost: 55, kind: 'pact_swift', desc: '+18% velocita, ma -12% danno' },
      { id: 'blood_coin', name: 'Offerta di Sangue', icon: '🩸', color: '#c1121f', cost: 40, kind: 'blood_coin', desc: '+2 vite, ma perdi meta delle monete' },
      { id: 'dark_relic', name: 'Reliquia Maledetta', icon: '💀', color: '#7b2cbf', cost: 90, kind: 'dark_relic', desc: 'Un Potere subito, ma -20 PV massimi' },
      { id: 'gamble', name: 'Azzardo del Diavolo', icon: '🎲', color: '#ffba08', cost: 30, kind: 'gamble', desc: 'Effetto casuale: benedizione o maledizione' },
    ];
  }
  spawnDarkMerchant() {
    const pool = this.darkWaresPool(); const wares = []; const idxs = pool.map((_, i) => i);
    for (let i = 0; i < 3 && idxs.length; i++) { const k = idxs.splice((Math.random() * idxs.length) | 0, 1)[0]; wares.push(Object.assign({}, pool[k])); }
    // v1.13 — posizione ACCESSIBILE (sostituisce l'ufficiale): micro-area casuale, altrimenti vicino allo spawn
    let pos = null; const ma = (this.map && this.map.microAreas) || [];
    if (ma.length) pos = ma[(Math.random() * ma.length) | 0];
    if (!pos || this.isWallAt(pos.x, pos.y)) pos = { x: this.map.spawn.x + MU.rand(-120, 120), y: this.map.spawn.y + MU.rand(-120, 120) };
    if (this.isWallAt(pos.x, pos.y)) pos = { x: this.map.spawn.x, y: this.map.spawn.y };
    this.darkMerchant = { x: pos.x, y: pos.y, r: 18, wares };
    for (const p of this.players.values()) p._nearDark = false;
    this.broadcast({ t: C.MSG.OFFER_MERCHANT, wares, dark: 1 });
  }
  updateDarkMerchant(dt) {
    if (!this.darkMerchant) return; const RANGE = 74;
    for (const p of this.alivePlayers) {
      const near = MU.dist(p.x, p.y, this.darkMerchant.x, this.darkMerchant.y) <= RANGE;
      if (near && !p._nearDark) { p._nearDark = true; this.sendTo(p.id, { t: C.MSG.OFFER_MERCHANT, wares: this.darkMerchant.wares, near: 1, dark: 1, coins: p.coins }); }
      else if (!near && p._nearDark) { p._nearDark = false; this.sendTo(p.id, { t: C.MSG.EVENT, ev: { t: 'merchant_leave', dark: 1 } }); }
    }
  }
  buyDark(pid, wareId) {
    const p = this.players.get(pid); if (!p || !this.darkMerchant || p.dead) return;
    if (MU.dist(p.x, p.y, this.darkMerchant.x, this.darkMerchant.y) > 84) return;
    const w = this.darkMerchant.wares.find(x => x.id === wareId); if (!w) return;
    if (p.coins < w.cost) return; p.coins -= w.cost;
    let note = '';
    if (w.kind === 'pact_berserk') { p.stats.dmgMult += 0.35; p.stats.maxHpFlat = Math.max(-p.maxHp + 20, p.stats.maxHpFlat - 25); if (p.hp > this.effMaxHp(p)) p.hp = this.effMaxHp(p); note = 'Furia oscura'; }
    else if (w.kind === 'pact_glass') { p.stats.fireRateMult += 0.30; p.stats.dmgReduce = (p.stats.dmgReduce || 0) - 0.12; note = 'Fragile ma letale'; }
    else if (w.kind === 'pact_leech') { p.stats.lifesteal += 0.10; p.stats.speedMult = Math.max(0.4, p.stats.speedMult - 0.08); note = 'Assetato'; }
    else if (w.kind === 'pact_swift') { p.stats.speedMult += 0.18; p.stats.dmgMult = Math.max(0.3, p.stats.dmgMult - 0.12); note = 'Rapido come un\'ombra'; }
    else if (w.kind === 'blood_coin') { p.lives += 2; p.coins = Math.floor(p.coins / 2); note = 'Sangue per vita'; }
    else if (w.kind === 'dark_relic') { p.stats.maxHpFlat = Math.max(-p.maxHp + 20, p.stats.maxHpFlat - 20); if (p.hp > this.effMaxHp(p)) p.hp = this.effMaxHp(p); this.offerBoon(p); note = 'Potere maledetto'; }
    else if (w.kind === 'gamble') { const good = Math.random() < 0.5; if (good) { const r = Math.random(); if (r < 0.34) { p.stats.dmgMult += 0.25; note = 'Benedizione: +25% danno!'; } else if (r < 0.67) { p.stats.maxHpFlat += 40; p.hp += 40; note = 'Benedizione: +40 PV!'; } else { p.lives += 1; note = 'Benedizione: +1 vita!'; } } else { const r = Math.random(); if (r < 0.5) { p.stats.dmgReduce = (p.stats.dmgReduce || 0) - 0.10; note = 'Maledizione: +10% danni subiti'; } else { p.stats.speedMult = Math.max(0.4, p.stats.speedMult - 0.10); note = 'Maledizione: -10% velocita'; } } }
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'dark_buy', id: w.id, name: w.name, icon: w.icon, color: w.color, note, x: p.x, y: p.y } });
    this.sendTo(pid, { t: C.MSG.OFFER_MERCHANT, wares: this.darkMerchant.wares, near: 1, dark: 1, coins: p.coins });
  }

  damagePlayer(p, dmg, sx, sy, kn = 1) {
    if (p.dead || p.down || p.buffs.iframe || p.buffs.i_invuln) return;
    let d = dmg;
    if (p.heroId === 'enforcer') d *= 0.82;
    if (p.buffs.phase) d *= 0.7;
    if (p.buffs.b_shield) d *= 0.5;
    if (p.buffs.i_armor) d *= 0.45;
    if (p.stats.dmgReduce > 0) d *= (1 - Math.min(0.85, p.stats.dmgReduce));
    if (p.buffs.gz_sunder > 0) d *= (C.GAZE_SUNDER_MULT || 1.32); // v1.34 — "meno difesa": danni subiti aumentati dallo sguardo
    if (p.buffs.barrier > 0) { const ang = Math.atan2(sy - p.y, sx - p.x); let diff = Math.abs(((ang - p.facing + Math.PI) % (2 * Math.PI)) - Math.PI); if (diff < 1.2) { this.events.push({ t: 'block', x: p.x, y: p.y }); return; } }
    d = Math.max(1, Math.round(d)); p.hp -= d; const n = MU.norm(p.x - sx, p.y - sy); p.vx += n.x * 40 * kn; p.vy += n.y * 40 * kn; p.hitFlash = 0.15;
    this.events.push({ t: 'phit', x: p.x, y: p.y, d }); if (p.hp <= 0) this.downPlayer(p);
  }
  cursePlayer(p) { // v1.28 — maledizione: indebolisce (danno/velocità ridotti) per alcuni secondi + notifica
    if (p.dead || p.down) return;
    const was = p.buffs.curse || 0; const dur = C.CURSE_TIME || 4.5;
    p.buffs.curse = Math.max(was, dur);
    if (was <= 0.1) this.events.push({ t: 'cursed', who: p.id, x: p.x, y: p.y, dur: Math.round(dur) });
  }
  gazePlayer(p, kind) { // v1.34 — Sguardo dell'Occhio Vagante: applica/rinnova un debuff mentre sei nel suo campo visivo.
    if (p.dead || p.down || p.buffs.iframe || p.buffs.i_invuln) return;
    const key = kind === 'slow' ? 'gz_slow' : kind === 'sunder' ? 'gz_sunder' : 'gz_weaken';
    const dur = C.GAZE_TIME || 2.6; const was = p.buffs[key] || 0;
    p.buffs[key] = Math.max(was, dur);
    if (was <= 0.1) this.events.push({ t: 'gazed', who: p.id, x: p.x, y: p.y, kind, dur: Math.round(dur) });
  }
  downPlayer(p) { p.hp = 0; p.down = true; p.downT = C.DOWN_BLEED_TIME; this.events.push({ t: 'down', x: p.x, y: p.y, name: p.name, lives: p.lives }); if (!this.anyRevivable) this.gameOver(); }
  gameOver() { this.phase = C.PHASE_GAMEOVER; this.broadcast({ t: C.MSG.EVENT, ev: { t: 'gameover', wave: this.wave, stats: this.buildRunStats(), dur: Math.round(this.time - (this.runStart || 0)) } }); }
  victory() { this.phase = C.PHASE_VICTORY; this.broadcast({ t: C.MSG.EVENT, ev: { t: 'victory', wave: this.wave, stats: this.buildRunStats(), dur: Math.round(this.time - (this.runStart || 0)) } }); }

  effMaxHp(p) { return p.maxHp + p.stats.maxHpFlat; }
  effSpeed(p) { let s = p.hero.speed * p.stats.speedMult * 1.05; if (p.heroId === 'recon' && p.hp / this.effMaxHp(p) < 0.5) s *= 1.2; if (p.buffs.b_speed) s *= 1.45; if (p.buffs.i_speed) s *= 1.4; if (p.buffs.curse > 0) s *= (C.CURSE_SPEED_MULT || 0.8); if (p.buffs.gz_slow > 0) s *= (C.GAZE_SLOW_MULT || 0.72); if (p.buffs.dash > 0) s *= C.DASH_SPEED; return s; }
  weaponTier(p) { if (!p.weapon2) return null; if (p.weapon2.evolved) return Loot.WEAPON_EVOS[p.weapon2.evolved]; const w = Loot.WEAPONS[p.weapon2.type]; return w && w.tiers[p.weapon2.level - 1]; }
  effFireDelay(p) { let base = p.hero.weapon.fireRate; const tr = this.weaponTier(p); if (tr) base *= tr.rate; let rate = base * p.stats.fireRateMult; if (p.buffs.b_rate) rate *= 1.7; if (p.buffs.i_rage) rate *= 1.4; if (p.buffs.killHaste > 0) rate *= (1 + Math.min(0.6, p.killHasteStacks * 0.08)); return 1 / rate; }
  effDamage(p) { let d = (p.hero.weapon.dmg + p.stats.dmgFlat) * p.stats.dmgMult; if (p.heroId === 'recon' && p.hp / this.effMaxHp(p) < 0.5) d *= 1.15; if (p.buffs.guerrilla > 0) d *= 1.3; if (p.buffs.zeroday > 0) d *= 1.35; if (p.buffs.b_dmg) d *= 1.6; if (p.buffs.i_power) d *= 1.5; if (p.buffs.i_rage) d *= 2.0; if (p.buffs.curse > 0) d *= (C.CURSE_DMG_MULT || 0.6); if (p.buffs.gz_weaken > 0) d *= (C.GAZE_WEAKEN_MULT || 0.7); return d; }
  abilPow(p) { return p.stats.abilityMult; }
  comboMult(p) { if (!p || (p.combo || 0) < C.COMBO_MIN) return 1; return 1 + Math.min(C.COMBO_CAP, (p.combo - C.COMBO_MIN + 1) * C.COMBO_STEP); }
  // Ricompense combo a soglie (v1.7): scattano esattamente al raggiungimento della soglia.
  _comboReward(p, m) {
    const c = p.combo;
    if (c === 15) { p.buffs.b_rate = Math.max(p.buffs.b_rate || 0, 5); this.events.push({ t: 'combo_reward', tier: 1, k: 'rate', x: p.x, y: p.y, who: p.id }); }
    else if (c === 25) { for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; this.bullets.push({ eid: NEXT++, hostile: false, owner: p.id, x: p.x, y: p.y, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, r: 6, dmg: Math.round(this.effDamage(p) * 1.1), color: '#ffd24a', life: 0.5, pierce: 3, knock: 60 }); } this.events.push({ t: 'combo_reward', tier: 2, k: 'nova', x: p.x, y: p.y, who: p.id }); }
    else if (c === 40) { p.hp = Math.min(this.effMaxHp(p), p.hp + Math.round(this.effMaxHp(p) * 0.25)); p.buffs.b_shield = Math.max(p.buffs.b_shield || 0, 5); this.events.push({ t: 'combo_reward', tier: 3, k: 'heal', x: p.x, y: p.y, who: p.id }); }
  }
  // Statistiche di fine run (v1.7): una riga per giocatore, ordinata per uccisioni.
  buildRunStats() {
    const rows = [];
    for (const p of this.players.values()) {
      let evo = null, w = null; if (p.weapon2) { w = p.weapon2.type; if (p.weapon2.evolved) evo = p.weapon2.evolved; }
      const boons = Object.values(p.boonsOwned || {}).reduce((a, b) => a + b, 0);
      const syn = Object.keys(p.synActive || {}).length;
      rows.push({ i: p.id, n: p.name, h: p.heroId, k: p.kills || 0, cb: p.comboBest || 0, dmg: Math.round(p.damageDealt || 0), boons, syn, w, evo, dead: p.dead ? 1 : 0 });
    }
    rows.sort((a, b) => b.k - a.k);
    return rows;
  }

  firePlayerWeapon(p) {
    const w = p.hero.weapon; if (p.fireCd > 0) return; p.fireCd = this.effFireDelay(p);
    const base = p.aim; let pc = 1 + p.stats.extraProjectiles + (p.buffs.b_quad ? 2 : 0);
    let dmg = this.effDamage(p); let crit = MU.chance(p.stats.critChance);
    if (p.heroId === 'glitch') { p.shotCount++; if (p.shotCount % 5 === 0) crit = true; }
    if (crit) dmg *= p.stats.critMult; dmg = Math.round(dmg);
    // colpo esplosivo periodico (boon)
    let explosive = false; if (p.boon.explodeEvery > 0) { p.boonShot++; if (p.boonShot % p.boon.explodeEvery === 0) explosive = true; }
    const mkBullet = (a, ov = {}) => this.bullets.push(Object.assign({ eid: NEXT++, hostile: false, owner: p.id, x: p.x, y: p.y, vx: Math.cos(a) * (ov.speed || w.bulletSpeed), vy: Math.sin(a) * (ov.speed || w.bulletSpeed), r: (ov.r || C.BULLET_RADIUS) + p.boon.bulletSize, dmg: ov.dmg != null ? ov.dmg : dmg, color: crit ? '#fff36b' : (ov.color || w.projColor), life: (ov.range || w.range) / (ov.speed || w.bulletSpeed), crit, pierce: (ov.pierce || 0) + p.stats.pierce + p.boon.pierce, hitSet: ((ov.pierce || 0) + p.stats.pierce + p.boon.pierce) > 0 ? new Set() : null, knock: (ov.knock != null ? ov.knock : w.knockback) * p.stats.knockMult, bounce: (ov.bounce || 0) + p.boon.bounce, bleed: p.heroId === 'recon' ? 1 : 0, explosive, chain: p.boon.chain, poison: p.boon.poison, slow: p.boon.slow, homing: p.boon.homing }, {}));
    if (p.weapon2) {
      const tr = this.weaponTier(p);
      const speed = tr.speed || w.bulletSpeed, range = tr.range || w.range;
      const pellets = (tr.pellets || 1) + (p.buffs.b_quad ? 1 : 0);
      const col = p.weapon2.evolved ? (Loot.WEAPONS[p.weapon2.type].evo.color) : Loot.WEAPONS[p.weapon2.type].color;
      const pd = Math.max(1, Math.round(dmg * (tr.dmg || 1)));
      const kn = (tr.knock ? w.knockback * tr.knock : w.knockback);
      for (let i = 0; i < pellets; i++) { const off = pellets > 1 ? (i - (pellets - 1) / 2) * (tr.spread || 0.1) : 0; const a = base + off + MU.rand(-(tr.spread || 0) * 0.4, (tr.spread || 0) * 0.4); mkBullet(a, { speed, range, r: C.BULLET_RADIUS + (tr.big || 0), dmg: pd, color: col, pierce: tr.pierce || 0, knock: kn, bounce: tr.bounce || 0 }); }
      if (tr.nova) { for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; mkBullet(a, { speed: 480, range: 220, dmg: Math.round(pd * 0.5), color: col }); } }
    } else {
      for (let i = 0; i < pc; i++) { const sb = w.spread + (pc > 1 ? 0.09 * (i - (pc - 1) / 2) : 0); let a = base + sb + MU.rand(-w.spread, w.spread); if (p.heroId === 'enforcer') { const near = this._coneNear(p.x, p.y, base, 0.5, w.range); if (near) { const ta = Math.atan2(near.y - p.y, near.x - p.x); a = MU.turnToward(a, ta, 0.06); } } mkBullet(a); }
    }
    this.events.push({ t: 'shot', x: p.x, y: p.y, a: base, hero: p.heroId, wt: p.weapon2 ? (p.weapon2.evolved || p.weapon2.type) : null });
  }
  _coneNear(x, y, ang, ha, range) { let best = null, bd = Infinity; for (const m of this.monsters) { const d = MU.dist(x, y, m.x, m.y); if (d > range) continue; const a = Math.atan2(m.y - y, m.x - x); let diff = Math.abs(((a - ang + Math.PI) % (2 * Math.PI)) - Math.PI); if (diff <= ha && d < bd) { bd = d; best = m; } } return best; }

  useDash(p) { if (p.cdDash > 0 || p.buffs.dash > 0) return; p.cdDash = C.DASH_CD * p.stats.cdrMult; p.buffs.dash = C.DASH_TIME; p.buffs.iframe = C.DASH_IFRAME; const n = MU.norm(p.input.mx, p.input.my); p.dashDir = (n.x || n.y) ? n : { x: Math.cos(p.aim), y: Math.sin(p.aim) }; this.events.push({ t: 'ability', k: 'dash', x: p.x, y: p.y }); }
  useQ(p) {
    if (p.cdQ > 0) return; const ap = this.abilPow(p);
    if (p.heroId === 'enforcer') { p.cdQ = 6 * p.stats.cdrMult; for (let k = -3; k <= 3; k++) { const a = p.aim + k * 0.10; this.bullets.push({ eid: NEXT++, hostile: false, owner: p.id, x: p.x, y: p.y, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, r: 7, dmg: Math.round(this.effDamage(p) * 2.2 * ap), color: '#9fe0ff', life: 0.6, pierce: 3, knock: 140, stun: 0.7 }); } this.events.push({ t: 'ability', k: 'justice', x: p.x, y: p.y }); }
    else if (p.heroId === 'recon') { p.cdQ = 7 * p.stats.cdrMult; this.bullets.push({ eid: NEXT++, hostile: false, owner: p.id, grenade: true, x: p.x, y: p.y, vx: Math.cos(p.aim) * 420, vy: Math.sin(p.aim) * 420, r: 6, dmg: 0, color: '#c7f06a', life: 0.8, fuse: 0.8, boomR: 120, boomDmg: Math.round(this.effDamage(p) * 3.2 * ap) }); this.events.push({ t: 'ability', k: 'grenade', x: p.x, y: p.y }); }
    else if (p.heroId === 'glitch') { let dur = 4; p.cdQ = 16 * p.stats.cdrMult; this.bulletTime = { t: dur, factor: 0.35, owner: p.id }; this.events.push({ t: 'ability', k: 'bullettime', x: p.x, y: p.y }); }
  }
  useE(p) {
    if (p.cdE > 0) return; const ap = this.abilPow(p);
    // ENFORCER — Torretta Schierabile (v1.9): piazza una torretta che spara ai nemici per 8s.
    if (p.heroId === 'enforcer') { p.cdE = 15 * p.stats.cdrMult; const tx = p.x, ty = p.y; this.orbs.push({ eid: NEXT++, turret: true, x: tx, y: ty, r: 14, t: 8, fireCd: 0.3, aim: p.aim, dmg: Math.round(this.effDamage(p) * 0.9 * ap), range: 340, owner: p.id }); this.events.push({ t: 'ability', k: 'turret', x: tx, y: ty }); }
    // RECON — Colpo del Cecchino (v1.9): proiettile perforante devastante a lunga gittata.
    else if (p.heroId === 'recon') { p.cdE = 8 * p.stats.cdrMult; const a = p.aim; this.bullets.push({ eid: NEXT++, hostile: false, owner: p.id, sniper: true, x: p.x, y: p.y, vx: Math.cos(a) * 1700, vy: Math.sin(a) * 1700, r: 8, dmg: Math.round(this.effDamage(p) * 5.5 * ap), color: '#c7f06a', life: 0.7, pierce: 99, hitSet: new Set(), knock: 160, crit: true }); this.events.push({ t: 'ability', k: 'sniper', x: p.x, y: p.y, a }); }
    // GLITCH — Frattura di Dati (invariata): rift che risucchia e danneggia.
    else if (p.heroId === 'glitch') { p.cdE = 9 * p.stats.cdrMult; const rx = p.x + Math.cos(p.aim) * 200, ry = p.y + Math.sin(p.aim) * 200; this.orbs.push({ eid: NEXT++, rift: true, x: rx, y: ry, r: 140, t: 1.6, dmg: this.effDamage(p) * 0.5 * ap, owner: p.id }); this.events.push({ t: 'ability', k: 'rift', x: rx, y: ry }); }
  }

  damageMonster(m, dmg, sx, sy, kn, src, opts = {}) {
    if (m.dead) return; if (m.shielded > 0) { this.events.push({ t: 'block', x: m.x, y: m.y }); return; }
    let d = dmg; if (m.def.blockFront && sx !== undefined) { const ang = Math.atan2(sy - m.y, sx - m.x); let diff = Math.abs(((ang - m.facing + Math.PI) % (2 * Math.PI)) - Math.PI); if (diff < 1.0) d *= (1 - m.def.blockFront); }
    d = Math.max(1, Math.round(d)); m.hp -= d; m.hitFlash = 0.1;
    if (kn && !m.boss) { const n = MU.norm(m.x - sx, m.y - sy); this.moveCircle(m, n.x * kn * 0.2, n.y * kn * 0.2); }
    if (opts.stun) m.stun = Math.max(m.stun || 0, opts.stun);
    if (opts.slow) m.slowT = Math.max(m.slowT || 0, 0.7);
    if (opts.poison) { m.poison = (m.poison || 0) + opts.poison; m.poisonT = 3; m.poisonSrc = src ? src.id : null; }
    if (src) { src.damageDealt += d; if (src.stats.lifesteal > 0) src.hp = Math.min(this.effMaxHp(src), src.hp + d * src.stats.lifesteal); }
    // hit-stop feedback per crit / colpi grossi
    if (opts.crit) this.events.push({ t: 'hitstop', d: 0.05 });
    this.events.push({ t: 'mhit', x: m.x, y: m.y, d, crit: !!opts.crit });
    if (m.hp <= 0) this.killMonster(m, src);
  }
  // catena di fulmini (boon chain)
  _chain(m, src, jumps) {
    if (!src || jumps <= 0) return;
    let best = null, bd = 220 * 220;
    for (const o of this.monsters) { if (o === m || o.dead) continue; const dd = MU.dist2(m.x, m.y, o.x, o.y); if (dd < bd) { bd = dd; best = o; } }
    if (best) { const dmg = 6 + 4 * (src.boon.chain || 0); this.events.push({ t: 'chain', x1: m.x, y1: m.y, x2: best.x, y2: best.y }); this.damageMonster(best, dmg, m.x, m.y, 0, src, src.boon.frostChain ? { slow: true } : {}); if (jumps > 1) this._chain(best, src, jumps - 1); }
  }
  killMonster(m, src) {
    m.dead = true;
    this.events.push({ t: 'mkill', x: m.x, y: m.y, id: m.type, f: +(m.facing || 0).toFixed(2), boss: m.boss, elite: m.elite, mega: m.mega });
    if (m.boss || m.elite || m.treasure) this.events.push({ t: 'hitstop', d: m.mega ? 0.16 : (m.boss ? 0.12 : 0.06) });
    if (src) {
      src.kills++;
      src.combo = (src.combo || 0) + 1; src.comboT = C.COMBO_TIME; if (src.combo > (src.comboBest || 0)) src.comboBest = src.combo;
      if (src.combo >= C.COMBO_MIN && src.combo % 5 === 0) this.events.push({ t: 'combo', x: m.x, y: m.y, n: src.combo, mult: +this.comboMult(src).toFixed(2), who: src.id });
      this._comboReward(src, m);
      if (src.boon.killHaste) { src.killHasteStacks = Math.min(6, (src.killHasteStacks || 0) + 1); src.buffs.killHaste = 3; }
      if (src.boon.killNova > 0 && MU.chance(0.25 * src.boon.killNova)) { for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; this.bullets.push({ eid: NEXT++, hostile: false, owner: src.id, x: m.x, y: m.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 6, dmg: Math.round(this.effDamage(src) * 0.7), color: '#ffd24a', life: 0.45, pierce: 2, knock: 30 }); } this.events.push({ t: 'nova', x: m.x, y: m.y }); }
    }
    const comboMul = src ? this.comboMult(src) : 1; const xpMul = src ? (src.stats.xpMult || 1) : 1;
    const xpVal = Math.round(m.xp * (m.treasure ? 6 : 1) * comboMul * xpMul); const orbs = (m.boss || m.treasure) ? 8 : (m.elite ? 3 : 1);
    for (let i = 0; i < orbs; i++) { const a = Math.random() * Math.PI * 2, r = (m.boss || m.treasure) ? MU.rand(10, 60) : MU.rand(4, 18); this.groundXp.push({ eid: NEXT++, x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, v: Math.max(1, Math.round(xpVal / orbs)), t: 30 }); }
    // MONETE (v1.8): valore in base al tipo di nemico, distribuito in tagli diversi.
    const coinVal = Math.max(1, Math.round((m.def.xp || 4) * 0.6 * (m.treasure ? 8 : m.boss ? 6 : m.elite ? 2.2 : 1)));
    const coinPieces = Loot.coinsFor(coinVal, C.COINS);
    for (const cp of coinPieces) { const a = Math.random() * Math.PI * 2, r = (m.boss || m.treasure) ? MU.rand(12, 66) : MU.rand(4, 20); this.groundCoins.push({ eid: NEXT++, x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, v: cp.v, cid: cp.id, t: 30 }); }
    const dropChance = m.treasure ? 1 : (m.boss ? 1 : (m.elite ? 0.35 : 0.09));
    if (MU.chance(dropChance)) { const it = Loot.pickWeighted(Loot.ITEMS); this.items.push({ eid: NEXT++, x: m.x, y: m.y, r: 13, id: it.id, t: 30 }); if (m.treasure) { const wt = Loot.WEAPON_ORDER[(Math.random() * 3) | 0]; this.weaponDrops.push({ eid: NEXT++, x: m.x + 20, y: m.y, r: 14, wt, level: 2, taken: false }); } }
    if (m.treasure) { this.treasure = null; this.events.push({ t: 'treasure_dead', x: m.x, y: m.y }); }
    if (m.boss) this.bossAlive = false;
  }

  applyItem(p, it) {
    if (it.kind === 'heal') { p.hp = Math.min(this.effMaxHp(p), p.hp + Math.round(this.effMaxHp(p) * it.heal)); }
    else if (it.kind === 'life') { p.lives += 1; }
    else if (it.kind === 'weapon') { const wt = Loot.WEAPON_ORDER[(Math.random() * Loot.WEAPON_ORDER.length) | 0]; this._giveWeapon(p, wt); }
    else if (it.kind === 'buff') { p.buffs[it.buff] = it.dur; }
    this.events.push({ t: 'item_pickup', x: p.x, y: p.y, id: it.id, name: it.name, icon: it.icon, color: it.color, who: p.id, name2: p.name });
  }
  _giveWeapon(p, wt) { if (p.weapon2 && p.weapon2.type === wt && !p.weapon2.evolved) p.weapon2.level = Math.min(3, p.weapon2.level + 1); else if (!p.weapon2 || p.weapon2.type !== wt) p.weapon2 = { type: wt, level: 1, evolved: null }; this._checkEvo(p); }
  _checkEvo(p) { if (!p.weapon2 || p.weapon2.evolved) return; const w = Loot.WEAPONS[p.weapon2.type]; if (!w || !w.evo) return; if (p.weapon2.level >= 3 && (p.buys[w.evo.stat] || 0) >= w.evo.need) { p.weapon2.evolved = w.evo.id; this.events.push({ t: 'weapon_evo', x: p.x, y: p.y, name: w.evo.name, color: w.evo.color, who: p.id, name2: p.name }); } }

  offerShop(p) { const stats = Loot.XP_STATS.map(s => ({ id: s.id, name: s.name, icon: s.icon, color: s.color, desc: s.desc, cost: Loot.statCost(s.base, p.buys[s.id] || 0), lvl: p.buys[s.id] || 0 })); this.sendTo(p.id, { t: C.MSG.OFFER_SHOP, xp: p.xpPool, stats, wave: this.wave }); }
  offerGear(p) {
    const slots = Loot.GEAR.map(g => { const owned = p.gear[g.slot] || 0; const maxed = owned >= g.max; return { slot: g.slot, name: g.name, icon: 'assets/gear/' + p.heroId + '_' + g.slot + '.png', color: g.color, tier: owned, max: g.max, rank: owned > 0 ? Loot.GEAR_RANK[owned - 1] : '', nextRank: maxed ? '' : Loot.GEAR_RANK[owned], rarity: maxed ? Loot.GEAR_RARITY[owned - 1] : Loot.GEAR_RARITY[owned], cost: maxed ? 0 : Loot.gearCost(g, owned), desc: g.desc(owned + (maxed ? 0 : 1)), maxed }; });
    this.sendTo(p.id, { t: C.MSG.OFFER_GEAR, coins: p.coins, slots });
  }
  buyGear(pid, slot) {
    const p = this.players.get(pid); if (!p || this.phase !== C.PHASE_SHOP) return;
    const def = Loot.GEAR_BY_SLOT[slot]; if (!def) return;
    const owned = p.gear[slot] || 0; if (owned >= def.max) return;
    const cost = Loot.gearCost(def, owned); if (p.coins < cost) return;
    p.coins -= cost; p.gear[slot] = owned + 1;
    // applica il delta del tier alle statistiche (campi additivi gia esistenti in p.stats)
    for (const k of Object.keys(def.per)) { if (k === 'maxHpFlat') { p.stats.maxHpFlat += def.per[k]; p.hp += def.per[k]; } else p.stats[k] = (p.stats[k] || 0) + def.per[k]; }
    this.offerGear(p); this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'geared', slot, tier: p.gear[slot], name: def.name, icon: 'assets/gear/' + p.heroId + '_' + slot + '.png', color: def.color, rank: Loot.GEAR_RANK[p.gear[slot] - 1] } });
  }
  offerBoon(p) {
    const choices = Loot.offerBoons(C.RARITY, p.boonsOwned);
    p.boonOffer = choices.map(b => b.id); p.boonPicked = choices.length === 0;
    this.sendTo(p.id, { t: C.MSG.OFFER_BOON, boons: choices.map(b => ({ id: b.id, name: b.name, icon: b.icon, rarity: b.rarity, desc: b.desc.replace('{v}', b.v ? b.v(p) : ''), owned: p.boonsOwned[b.id] || 0, max: b.max })) });
  }
  buyStat(pid, statId) {
    const p = this.players.get(pid); if (!p || this.phase !== C.PHASE_SHOP) return;
    const s = Loot.XP_STATS.find(x => x.id === statId); if (!s) return;
    const cost = Loot.statCost(s.base, p.buys[statId] || 0); if (p.xpPool < cost) return;
    p.xpPool -= cost; p.buys[statId] = (p.buys[statId] || 0) + 1;
    if (statId === 'st_hp') { p.stats.maxHpFlat += 22; p.hp += 22; }
    else if (statId === 'st_dmg') p.stats.dmgMult += 0.09;
    else if (statId === 'st_rate') p.stats.fireRateMult += 0.08;
    else if (statId === 'st_power') { p.stats.abilityMult += 0.14; p.stats.cdrMult *= 0.96; }
    else if (statId === 'st_speed') p.stats.speedMult += 0.05;
    else if (statId === 'st_crit') p.stats.critChance += 0.04;
    this._checkEvo(p);
    this.offerShop(p); this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'bought', id: statId } });
  }
  pickBoon(pid, boonId) {
    const p = this.players.get(pid); if (!p || this.phase !== C.PHASE_SHOP || !p.boonOffer) return;
    if (!p.boonOffer.includes(boonId)) return;
    const b = Loot.BOON_BY_ID[boonId]; if (!b) return;
    if ((p.boonsOwned[boonId] || 0) >= b.max) return;
    b.apply(p); p.boonsOwned[boonId] = (p.boonsOwned[boonId] || 0) + 1; p.boonOffer = null; p.boonPicked = true;
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'boon_ok', id: boonId, name: b.name, icon: b.icon } });
    // SINERGIE (v1.7): se il boon appena preso completa una coppia, attivala una sola volta.
    const newSyn = Loot.detectSynergies(p.boonsOwned, p.synActive);
    for (const sy of newSyn) { sy.apply(p); p.synActive[sy.id] = 1; this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'synergy', id: sy.id, name: sy.name, icon: sy.icon, desc: sy.desc } }); }
  }
  shopReady(pid) { const p = this.players.get(pid); if (p) p.ready = true; }

  update(dt) {
    this.time += dt; this.dt = dt; this.flowTimer -= dt;
    if (this.flowTimer <= 0) { this.flowTimer = 0.12; const t = this.alivePlayers.map(p => ({ gx: (p.x / C.TILE) | 0, gy: (p.y / C.TILE) | 0 })); if (t.length) this.flow = PF.build(this.map.grid, this.map.w, this.map.h, t); }
    const inCombat = (this.phase === C.PHASE_COMBAT || this.phase === C.PHASE_BOSS);
    // MODALITÀ sopravvivenza: timer + respawn continuo
    if (inCombat && this.surviveT > 0) { this.surviveT -= dt; }
    if (inCombat && this.pending > 0) { this.spawnTimer -= dt; if (this.spawnTimer <= 0) { this.spawnTimer = MU.rand(0.25, 0.6); if (Waves.isBossWave(this.wave)) { const pos = this.randomSpawnPos(); this.spawnMonster('skeleton', pos.x, pos.y, { scaling: Waves.scaling(this.wave, this.alivePlayers.length || 1) }); this.pending--; } else if (this.waveList && this.waveList.length) { const it = this.waveList.shift(); const pos = this.randomSpawnPos(); this.spawnMonster(it.type, pos.x, pos.y, { scaling: this.waveScaling, elite: it.elite }); this.pending--; } } }
    // durante SOPRAVVIVENZA rifornisci finché il timer non scade
    if (inCombat && this.mode.survive > 0 && this.surviveT > 0 && this.pending <= 0 && this.monsters.length < 14) { const it = MU.weighted(Waves.poolForWave(this.wave)); const pos = this.randomSpawnPos(); this.spawnMonster(it.id, pos.x, pos.y, { scaling: this.waveScaling, elite: MU.chance(this.waveScaling.eliteChance) }); }
    // v1.9 — PAUSA: durante il negozio/scelta poteri il mondo e congelato (nessuna simulazione).
    const running = (this.phase !== C.PHASE_SHOP && this.phase !== C.PHASE_LOBBY && this.phase !== C.PHASE_GAMEOVER && this.phase !== C.PHASE_VICTORY);
    if (running) {
      this.updatePlayers(dt); this.updateMonsters(dt); this.updateBullets(dt); this.updateOrbs(dt); this.updateMeteors(dt); this.updateZones(dt); this.updatePickups(dt); this.updateMerchant(dt); this.updateDarkMerchant(dt);
      if (this.bulletTime) { this.bulletTime.t -= dt; if (this.bulletTime.t <= 0) this.bulletTime = null; }
    }
    // failsafe anti-stallo
    if (inCombat && this.pending <= 0 && this.mode.survive === 0 && this.monsters.length > 0 && !this.mode.treasure) { if (this.monsters.length !== this._lastMon) { this._lastMon = this.monsters.length; this._stallT = 0; } else { this._stallT = (this._stallT || 0) + dt; } if (this._stallT > 6) { const ap = this.alivePlayers; if (ap.length) { for (const m of this.monsters) { const p = ap[(Math.random() * ap.length) | 0]; const a = Math.random() * Math.PI * 2; const nx = p.x + Math.cos(a) * 240, ny = p.y + Math.sin(a) * 240; if (!this.isWallAt(nx, ny)) { m.x = nx; m.y = ny; } } this._stallT = 0; } } } else { this._lastMon = undefined; this._stallT = 0; }
    // condizioni di fine ondata per modalità
    if (inCombat) this._checkWaveClear();
    if (this.phase === C.PHASE_SHOP) { this.shopTimer -= dt; let all = true, conn = 0; for (const p of this.players.values()) if (p.connected && !p.dead) { conn++; if (!p.ready) all = false; }
      // v1.9 — pausa: in singolo si attende il click su "Continua" (nessun timeout forzato); in multiplayer resta un timeout anti-AFK.
      const timedOut = conn > 1 && this.shopTimer <= 0;
      if (all || timedOut) this.nextWave(); }
  }
  _checkWaveClear() {
    if (Waves.isBossWave(this.wave)) { if (this.pending <= 0 && this.monsters.length === 0) return this._waveDone(); return; }
    if (this.mode.survive > 0) { if (this.surviveT <= 0) { for (const m of this.monsters.slice()) this.killMonster(m, null); return this._waveDone(); } return; }
    if (this.mode.treasure) { const treasureGone = !this.treasure; if (treasureGone && this.pending <= 0 && this.monsters.length === 0) return this._waveDone(); return; }
    if (this.pending <= 0 && this.monsters.length === 0) return this._waveDone();
  }
  _waveDone() { if (this.wave >= Waves.FINAL_WAVE) this.victory(); else this.enterShop(); }
  enterShop() {
    this.phase = C.PHASE_SHOP; this.shopTimer = 45;
    // v1.9 — raccolta automatica dei drop rimasti a terra (la pausa non fa perdere nulla).
    const recip = this.alivePlayers[0] || [...this.players.values()].find(p => p.connected) || null;
    if (recip) {
      let gx = 0, gc = 0;
      for (const o of this.groundXp) if (!o.dead) { recip.xpPool += o.v; gx += o.v; }
      for (const o of this.groundCoins) if (!o.dead) { recip.coins += o.v; gc += o.v; }
      this.groundXp.length = 0; this.groundCoins.length = 0;
      if (gx > 0) this.events.push({ t: 'xp', x: recip.x, y: recip.y - 10, v: gx });
      if (gc > 0) this.events.push({ t: 'coin', x: recip.x, y: recip.y - 10, v: gc, cid: 'gold', who: recip.id });
    }
    for (const p of this.players.values()) { if (!p.connected) continue;
      if (p.down || p.dead) { p.down = false; p.dead = false; p.hp = Math.round(this.effMaxHp(p) * 0.6); if (p.lives < 1) p.lives = 1; }
      else p.hp = Math.min(this.effMaxHp(p), p.hp + Math.round(this.effMaxHp(p) * 0.25));
      p.ready = false; p.killHasteStacks = 0; this.offerBoon(p); this.offerShop(p); this.offerGear(p);
    }
    this.broadcast({ t: C.MSG.EVENT, ev: { t: 'shop', next: this.wave + 1 } });
  }

  updatePickups(dt) {
    for (const o of this.groundXp) { if (o.dead) continue; o.t -= dt; if (o.t <= 0) { o.dead = true; continue; } let target = null, bd = C.XP_MAGNET * C.XP_MAGNET; for (const p of this.alivePlayers) { const d = MU.dist2(o.x, o.y, p.x, p.y); if (d < bd) { bd = d; target = p; } } if (target) { const n = MU.norm(target.x - o.x, target.y - o.y); const pull = 90 + (1 - Math.sqrt(bd) / C.XP_MAGNET) * 260; o.x += n.x * pull * dt; o.y += n.y * pull * dt; if (MU.dist(o.x, o.y, target.x, target.y) < target.radius + 6) { target.xpPool += o.v; o.dead = true; this.events.push({ t: 'xp', x: target.x, y: target.y, v: o.v }); } } }
    if (this.groundXp.some(o => o.dead)) this.groundXp = this.groundXp.filter(o => !o.dead);
    // Raccolta MONETE (calamita come l'XP)
    for (const o of this.groundCoins) { if (o.dead) continue; o.t -= dt; if (o.t <= 0) { o.dead = true; continue; } let target = null, bd = C.COIN_MAGNET * C.COIN_MAGNET; for (const p of this.alivePlayers) { const d = MU.dist2(o.x, o.y, p.x, p.y); if (d < bd) { bd = d; target = p; } } if (target) { const n = MU.norm(target.x - o.x, target.y - o.y); const pull = 90 + (1 - Math.sqrt(bd) / C.COIN_MAGNET) * 260; o.x += n.x * pull * dt; o.y += n.y * pull * dt; if (MU.dist(o.x, o.y, target.x, target.y) < target.radius + 6) { target.coins += o.v; o.dead = true; this.events.push({ t: 'coin', x: target.x, y: target.y, v: o.v, cid: o.cid, who: target.id }); } } }
    if (this.groundCoins.some(o => o.dead)) this.groundCoins = this.groundCoins.filter(o => !o.dead);
    for (const it of this.items) { if (it.dead) continue; it.t -= dt; if (it.t <= 0) { it.dead = true; continue; } for (const p of this.alivePlayers) { if (MU.dist(it.x, it.y, p.x, p.y) < p.radius + it.r + 6) { const def = Loot.ITEMS.find(x => x.id === it.id); if (def) this.applyItem(p, def); it.dead = true; break; } } }
    if (this.items.some(o => o.dead)) this.items = this.items.filter(o => !o.dead);
    for (const c of this.crates) { if (c.opened) continue; for (const p of this.alivePlayers) { if (MU.dist(c.x, c.y, p.x, p.y) < p.radius + c.r + 6) { c.opened = true; if (c.mimic) { const mm = this.spawnMonster('mimic', c.x, c.y, { scaling: this.waveScaling || Waves.scaling(this.wave, this.alivePlayers.length || 1) }); mm.awake = true; this.events.push({ t: 'crate_mimic', x: c.x, y: c.y }); } else { const b = Loot.CRATE_BUFFS[(Math.random() * Loot.CRATE_BUFFS.length) | 0]; p.buffs[b.id] = b.dur; this.events.push({ t: 'crate_buff', x: c.x, y: c.y, id: b.id, name: b.name, icon: b.icon, color: b.color, name2: p.name }); } break; } } }
    if (this.crates.some(c => c.opened)) this.crates = this.crates.filter(c => !c.opened);
    for (const d of this.weaponDrops) { if (d.taken) continue; for (const p of this.alivePlayers) { if (MU.dist(d.x, d.y, p.x, p.y) < p.radius + d.r + 6) { d.taken = true; this._giveWeapon(p, d.wt); if (d.level >= 2 && p.weapon2 && p.weapon2.type === d.wt && !p.weapon2.evolved) p.weapon2.level = Math.min(3, Math.max(p.weapon2.level, d.level)); const w = Loot.WEAPONS[d.wt]; this.events.push({ t: 'weapon_pickup', x: d.x, y: d.y, wt: d.wt, name: w.name, icon: w.icon, color: w.color, level: p.weapon2.level, name2: p.name }); this._checkEvo(p); break; } } }
    if (this.weaponDrops.some(d => d.taken)) this.weaponDrops = this.weaponDrops.filter(d => !d.taken);
  }

  updatePlayers(dt) {
    for (const p of this.players.values()) {
      if (!p.connected) continue;
      p.fireCd = Math.max(0, p.fireCd - dt); p.cdQ = Math.max(0, p.cdQ - dt); p.cdE = Math.max(0, p.cdE - dt); p.cdDash = Math.max(0, p.cdDash - dt);
      if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) { p.comboT = 0; p.combo = 0; } }
      if (p.hitFlash) p.hitFlash = Math.max(0, p.hitFlash - dt);
      for (const k of Object.keys(p.buffs)) { p.buffs[k] -= dt; if (p.buffs[k] <= 0) { delete p.buffs[k]; if (k === 'killHaste') p.killHasteStacks = 0; } }
      if (p.stats.regen && !p.dead && !p.down) p.hp = Math.min(this.effMaxHp(p), p.hp + p.stats.regen * dt);
      if (p.buffs.b_regen && !p.dead && !p.down) p.hp = Math.min(this.effMaxHp(p), p.hp + 8 * dt);
      if (p.down) {
        p.downT -= dt; p.vx *= 0.8; p.vy *= 0.8;
        for (const a of this.alivePlayers) { if (a === p) continue; if (MU.dist(a.x, a.y, p.x, p.y) < 46) { p.reviveProg = (p.reviveProg || 0) + dt; break; } }
        if ((p.reviveProg || 0) > 2.2) { p.down = false; p.hp = Math.round(this.effMaxHp(p) * 0.5); p.reviveProg = 0; p.buffs.iframe = C.REVIVE_IFRAME; this.events.push({ t: 'revive', x: p.x, y: p.y }); }
        if (p.downT <= 0) {
          if (p.lives > 1) { p.lives -= 1; p.down = false; p.hp = Math.round(this.effMaxHp(p) * 0.6); p.buffs.iframe = C.REVIVE_IFRAME; p.reviveProg = 0; this.events.push({ t: 'life_lost', x: p.x, y: p.y, name: p.name, lives: p.lives }); }
          else { p.lives = 0; p.dead = true; p.down = false; this.events.push({ t: 'dead', x: p.x, y: p.y, name: p.name }); if (!this.anyRevivable) this.gameOver(); }
        }
        continue;
      }
      if (p.dead) continue;
      if (p.heroId === 'glitch') { if (Math.abs(p.input.mx) < 0.01 && Math.abs(p.input.my) < 0.01) { p.stillT = (p.stillT || 0) + dt; if (p.stillT > 1.2) p.buffs.phase = 0.2; } else p.stillT = 0; }
      const sp = this.effSpeed(p); let mx = p.input.mx, my = p.input.my; const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
      let dvx = mx * sp, dvy = my * sp; if (p.buffs.dash > 0 && p.dashDir) { dvx = p.dashDir.x * sp; dvy = p.dashDir.y * sp; }
      p.vx *= 0.86; p.vy *= 0.86; this.moveCircle(p, (dvx + p.vx) * dt, (dvy + p.vy) * dt);
      if (this.isWallAt(p.x, p.y)) this._unstuck(p); // v1.11 — rete di sicurezza anti-blocco
      const t = this.tileAtWorld(p.x, p.y);
      if (t === C.T_HAZARD && !p.buffs.iframe && !p.buffs.i_invuln) { p.hazT = (p.hazT || 0) + dt; if (p.hazT > 0.25) { this.damagePlayer(p, 6, p.x + 1, p.y, 0); p.hazT = 0; } }
      else if (t === C.T_TRAP && !p.buffs.iframe && !p.buffs.i_invuln) { p.trapT = (p.trapT || 0) + dt; if (p.trapT > 0.6) { this.damagePlayer(p, 14, p.x, p.y - 1, 0); p.trapT = 0; this.events.push({ t: 'trap', x: p.x, y: p.y }); } }
      p.aim = p.input.aim; p.facing = p.input.aim;
      if (p.input.shoot && !p.buffs.dash) this.firePlayerWeapon(p);
      if (p.input.q && !p._qH) this.useQ(p); if (p.input.e && !p._eH) this.useE(p); if (p.input.dash && !p._dH) this.useDash(p);
      p._qH = p.input.q; p._eH = p.input.e; p._dH = p.input.dash;
    }
  }
  updateMonsters(dt) {
    const ctx = this.makeCtx(); const tf = this.bulletTime ? this.bulletTime.factor : 1;
    for (const m of this.monsters) { if (m.dead) continue; if (m.hitFlash) m.hitFlash = Math.max(0, m.hitFlash - dt);
      // veleno (boon)
      if (m.poison > 0 && m.poisonT > 0) { m.poisonT -= dt; m.poisonTick = (m.poisonTick || 0) + dt; if (m.poisonTick > 0.5) { m.poisonTick = 0; this.damageMonster(m, m.poison * 2, m.x, m.y - 1, 0, this.players.get(m.poisonSrc)); if (m.dead) continue; } }
      let slow = 1; if (m.slowT > 0) { m.slowT -= dt; slow = 0.5; }
      if (m.treasure) { // fugge dai giocatori
        m.escapeT -= dt; const np = this._nearestPlayer(m.x, m.y); if (np) { const n = MU.norm(m.x - np.x, m.y - np.y); m.mx = n.x * m.speed; m.my = n.y * m.speed; m.facing = Math.atan2(np.y - m.y, np.x - m.x); } else { m.mx = m.my = 0; }
        this.moveCircle(m, m.mx * dt * tf * slow, m.my * dt * tf * slow); if (this.isWallAt(m.x, m.y)) this._unstuck(m);
        if (m.escapeT <= 0) { m.dead = true; this.treasure = null; this.events.push({ t: 'treasure_escape', x: m.x, y: m.y }); }
        continue;
      }
      const ld = dt * tf; const pd = ctx.dt; ctx.dt = ld; AI.update(m, ctx); ctx.dt = pd; let cu = 1; const np = this._nearestPlayer(m.x, m.y); if (np) { const nd = MU.dist(m.x, m.y, np.x, np.y); if (nd > 340) cu = 1 + Math.min(1.1, (nd - 340) / 420); }
      const px0 = m.x, py0 = m.y; const wantMove = (Math.abs(m.mx) + Math.abs(m.my)) > 4; // v1.43 — misura intento vs spostamento reale
      this.moveCircle(m, (m.mx || 0) * ld * cu * slow, (m.my || 0) * ld * cu * slow); if (this.isWallAt(m.x, m.y)) this._unstuck(m);
      // v1.43 — RILEVA INCASTRO (per TUTTI, boss compresi): se voleva muoversi ma non ha avanzato, accumula; poi recupera.
      if (wantMove) { const moved = MU.dist(m.x, m.y, px0, py0); const want = MU.len(m.mx, m.my) * ld * cu * slow; if (moved < want * 0.3) { m._stuckT = (m._stuckT || 0) + dt; if (m._stuckT > 0.35) { this._recoverStuck(m, Math.atan2(m.my, m.mx)); if (m._stuckT > 1.4) { m._stuckT = 0; } } } else m._stuckT = 0; } else m._stuckT = 0;
      const t = this.tileAtWorld(m.x, m.y); if (t === C.T_HAZARD) { m.hazT = (m.hazT || 0) + dt; if (m.hazT > 0.3) { m.hp -= 8; m.hazT = 0; if (m.hp <= 0) this.killMonster(m, null); } } }
    this._separate(); this._pushOff();
    if (this.monsters.some(m => m.dead)) this.monsters = this.monsters.filter(m => !m.dead);
  }
  _separate() { const a = this.monsters; for (let i = 0; i < a.length; i++) { const x = a[i]; for (let j = i + 1; j < Math.min(a.length, i + 8); j++) { const y = a[j]; const dx = y.x - x.x, dy = y.y - x.y, rr = x.radius + y.radius, d2 = dx * dx + dy * dy; if (d2 < rr * rr && d2 > 0.0001) { const d = Math.sqrt(d2), ov = (rr - d) * 0.5, nx = dx / d, ny = dy / d; if (!this.isWallAt(x.x - nx * ov, x.y - ny * ov)) { x.x -= nx * ov; x.y -= ny * ov; } if (!this.isWallAt(y.x + nx * ov, y.y + ny * ov)) { y.x += nx * ov; y.y += ny * ov; } } } } }
  _pushOff() { for (const p of this.alivePlayers) { if (p.buffs.dash > 0) continue; const clear = p.radius + 4; for (const m of this.monsters) { if (m.dead) continue; const dx = m.x - p.x, dy = m.y - p.y; const minD = clear + m.radius * 0.6; const d2 = dx * dx + dy * dy; if (d2 < minD * minD && d2 > 0.0001) { const d = Math.sqrt(d2), ov = minD - d, nx = dx / d, ny = dy / d; let tx = m.x + nx * ov, ty = m.y + ny * ov; if (!this.isWallAt(tx, ty)) { m.x = tx; m.y = ty; continue; } const tanx = -ny, tany = nx; for (const s of [1, -1]) { const sx = m.x + tanx * s * ov, sy = m.y + tany * s * ov; if (!this.isWallAt(sx, sy)) { m.x = sx; m.y = sy; break; } } } } } }
  updateBullets(dt) {
    const tf = this.bulletTime ? this.bulletTime.factor : 1;
    for (const b of this.bullets) { if (b.dead) continue; const bdt = b.hostile ? dt * tf : dt; if (b.grenade) { b.vx *= 0.96; b.vy *= 0.96; b.fuse -= dt; }
      if (b.homing > 0 && !b.grenade) { let tgt = null, bd = 260 * 260; for (const mm of this.monsters) { if (mm.dead) continue; const dd = MU.dist2(b.x, b.y, mm.x, mm.y); if (dd < bd) { bd = dd; tgt = mm; } } if (tgt) { const sp = Math.hypot(b.vx, b.vy) || 1; const cur = Math.atan2(b.vy, b.vx); const des = Math.atan2(tgt.y - b.y, tgt.x - b.x); const na = MU.turnToward(cur, des, Math.min(0.32, 0.14 * b.homing)); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; } }
      b.x += b.vx * bdt; b.y += b.vy * bdt; b.life -= bdt;
      if (this.isWallAt(b.x, b.y)) { if (b.bounce > 0) { b.bounce--; if (this.isWallAt(b.x - b.vx * bdt, b.y)) b.vx *= -1; if (this.isWallAt(b.x, b.y - b.vy * bdt)) b.vy *= -1; } else if (b.grenade) { b.fuse = Math.min(b.fuse, 0.02); } else { b.dead = true; this.events.push({ t: 'spark', x: b.x, y: b.y, c: b.color }); } }
      if (b.life <= 0 && !b.grenade) b.dead = true; if (b.grenade && b.fuse <= 0) { this._explode(b); b.dead = true; continue; } if (b.dead) continue;
      if (b.hostile) { for (const p of this.alivePlayers) { if (p.buffs.iframe || p.buffs.i_invuln) continue; if (MU.circleHit(b.x, b.y, b.r, p.x, p.y, p.radius)) { this.damagePlayer(p, b.dmg, b.x, b.y, 1); if (b.curse) this.cursePlayer(p); b.dead = true; break; } } }
      else { for (const m of this.monsters) { if (m.dead) continue; if (MU.circleHit(b.x, b.y, b.r, m.x, m.y, m.radius)) { if (b.hitSet && b.hitSet.has(m.eid)) continue; const src = this.players.get(b.owner); this.damageMonster(m, b.dmg, b.x, b.y, b.knock || 0, src, { crit: b.crit, stun: b.stun, slow: b.slow, poison: b.poison }); if (b.bleed) { m.bleed = (m.bleed || 0) + b.bleed; m.bleedT = 3; m.bleedSrc = b.owner; } if (b.chain && src && !m.dead) this._chain(m, src, b.chain); if (b.explosive) { this._explodeAt(b.x, b.y, 90, Math.round(b.dmg * 1.2), src); if (src && src.boon.toxicBurst) this._toxicBurst(b.x, b.y, 90, src); this.events.push({ t: 'explosion', x: b.x, y: b.y, r: 90, toxic: (src && src.boon.toxicBurst) ? 1 : 0 }); b.dead = true; break; } if (b.pierce > 0) { b.pierce--; if (!b.hitSet) b.hitSet = new Set(); b.hitSet.add(m.eid); } else { b.dead = true; break; } } } }
    }
    if (this.bullets.some(b => b.dead)) this.bullets = this.bullets.filter(b => !b.dead);
    for (const m of this.monsters) { if (m.bleedT > 0) { m.bleedT -= dt; m.bleedTick = (m.bleedTick || 0) + dt; if (m.bleedTick > 0.5) { m.bleedTick = 0; this.damageMonster(m, m.bleed * 2, m.x, m.y - 1, 0, this.players.get(m.bleedSrc)); } } }
  }
  _explode(b) { this.events.push({ t: 'explosion', x: b.x, y: b.y, r: b.boomR }); this._explodeAt(b.x, b.y, b.boomR, b.boomDmg, this.players.get(b.owner)); }
  _explodeAt(x, y, r, dmg, src) { for (const m of this.monsters) if (!m.dead && MU.dist(x, y, m.x, m.y) <= r + m.radius) this.damageMonster(m, dmg, x, y, 120, src); }
  _toxicBurst(x, y, r, src) { const pz = 1 + (src.boon.poison || 0); for (const m of this.monsters) { if (m.dead) continue; if (MU.dist(x, y, m.x, m.y) <= r + m.radius) { m.poison = Math.max(m.poison || 0, pz); m.poisonT = 3; m.poisonSrc = src.id; } } }
  updateOrbs(dt) { for (const o of this.orbs) { if (o.dead) continue; o.t -= dt; if (o.t <= 0) { o.dead = true; continue; }
      if (o.turret) { o.fireCd -= dt; let tgt = null, bd = o.range * o.range; for (const m of this.monsters) { if (m.dead) continue; const d2 = MU.dist2(o.x, o.y, m.x, m.y); if (d2 < bd && this.losClear(o.x, o.y, m.x, m.y)) { bd = d2; tgt = m; } } if (tgt) { o.aim = Math.atan2(tgt.y - o.y, tgt.x - o.x); if (o.fireCd <= 0) { o.fireCd = 0.3; const sp = 820; this.bullets.push({ eid: NEXT++, hostile: false, owner: o.owner, x: o.x, y: o.y, vx: Math.cos(o.aim) * sp, vy: Math.sin(o.aim) * sp, r: 5, dmg: o.dmg, color: '#9fe0ff', life: o.range / sp, pierce: 0, knock: 40 }); this.events.push({ t: 'turret_fire', x: o.x, y: o.y, a: o.aim }); } } continue; }
      if (o.rift) { for (const m of this.monsters) { const d = MU.dist(o.x, o.y, m.x, m.y); if (d < o.r && !m.boss) { const n = MU.norm(o.x - m.x, o.y - m.y); this.moveCircle(m, n.x * 120 * dt, n.y * 120 * dt); m.tickR = (m.tickR || 0) + dt; if (m.tickR > 0.25) { m.tickR = 0; this.damageMonster(m, o.dmg * 0.25, o.x, o.y, 0, this.players.get(o.owner)); } } } } } if (this.orbs.some(o => o.dead)) this.orbs = this.orbs.filter(o => !o.dead); }
  updateMeteors(dt) { for (const mt of this.meteors) { mt.t -= dt; if (mt.t <= 0 && !mt.done) { mt.done = true; this.events.push({ t: 'explosion', x: mt.x, y: mt.y, r: mt.r }); for (const p of this.alivePlayers) if (MU.dist(mt.x, mt.y, p.x, p.y) <= mt.r + p.radius && !p.buffs.iframe && !p.buffs.i_invuln) this.damagePlayer(p, mt.dmg, mt.x, mt.y, 2); } } this.meteors = this.meteors.filter(m => !m.done); }
  updateZones(dt) { for (const z of this.zones) { if (z.done) continue; z.t -= dt; if (z.t <= 0) { z.done = true; this.events.push({ t: 'zone_hit', x: z.x, y: z.y, r: z.r, c: z.col }); for (const p of this.alivePlayers) if (MU.dist(z.x, z.y, p.x, p.y) <= z.r + p.radius && !p.buffs.iframe && !p.buffs.i_invuln) this.damagePlayer(p, z.dmg, z.x, z.y, 2.4); } } if (this.zones.some(z => z.done)) this.zones = this.zones.filter(z => !z.done); }

  snapshot() {
    const players = [];
    for (const p of this.players.values()) {
      const tb = []; for (const k of ['b_dmg', 'b_speed', 'b_rate', 'b_shield', 'b_regen', 'b_quad', 'i_speed', 'i_armor', 'i_power', 'i_rage', 'i_invuln']) if (p.buffs[k] > 0) tb.push(k);
      players.push({ i: p.id, n: p.name, h: p.heroId, x: Math.round(p.x), y: Math.round(p.y), a: +p.aim.toFixed(2), hp: Math.round(p.hp), mhp: Math.round(this.effMaxHp(p)), d: p.dead ? 1 : 0, dn: p.down ? 1 : 0, dt: p.down ? +Math.max(0, p.downT).toFixed(1) : 0, lv: p.lives, cq: +p.cdQ.toFixed(1), ce: +p.cdE.toFixed(1), cd: +p.cdDash.toFixed(1), k: p.kills, xp: p.xpPool, bf: p.hitFlash > 0 ? 1 : 0, bar: p.buffs.barrier > 0 ? 1 : 0, dash: p.buffs.dash > 0 ? 1 : 0, ph: p.buffs.phase > 0 ? 1 : 0, iv: (p.buffs.i_invuln > 0 || p.buffs.iframe > 0) ? 1 : 0, cu: p.buffs.curse > 0 ? 1 : 0, tb, w2: p.weapon2 ? (p.weapon2.evolved || p.weapon2.type) : null, w2l: p.weapon2 ? p.weapon2.level : 0, evo: p.weapon2 && p.weapon2.evolved ? 1 : 0, cmb: p.combo || 0, cmt: p.comboT > 0 ? +(p.comboT / C.COMBO_TIME).toFixed(2) : 0, cmx: +this.comboMult(p).toFixed(2), co: p.coins || 0, nm: p._nearMerch ? 1 : 0, nmd: p._nearDark ? 1 : 0, gz: (p.buffs.gz_weaken > 0 ? 'weaken' : p.buffs.gz_slow > 0 ? 'slow' : p.buffs.gz_sunder > 0 ? 'sunder' : 0) });
    }
    const mon = []; for (const m of this.monsters) { const o = { e: m.eid, t: m.type, x: Math.round(m.x), y: Math.round(m.y), f: +m.facing.toFixed(2), hp: Math.round(m.hp), mhp: m.maxHp, el: m.elite ? 1 : 0, b: m.boss ? 1 : 0, mg: m.mega ? 1 : 0, tr: m.treasure ? 1 : 0, fl: m.hitFlash > 0 ? 1 : 0, sh: m.shielded > 0 ? 1 : 0, ps: m.poison > 0 && m.poisonT > 0 ? 1 : 0 }; if (m.type === 'occhio') { o.gk = m.gazeKind; if (m.gazeActive) { o.gz = 1; o.gtx = Math.round(m.gazeTx); o.gty = Math.round(m.gazeTy); } } if (m.type === 'darkmage') { o.al = m.alert ? 1 : 0; } mon.push(o); }
    const bul = []; for (const b of this.bullets) bul.push({ e: b.eid, x: Math.round(b.x), y: Math.round(b.y), h: b.hostile ? 1 : 0, c: b.color, r: b.r, g: b.grenade ? 1 : 0 });
    const orbs = []; for (const o of this.orbs) orbs.push({ e: o.eid, x: Math.round(o.x), y: Math.round(o.y), r: Math.round(o.r), k: o.turret ? 'turret' : (o.rift ? 'rift' : 'fire'), f: o.aim != null ? +o.aim.toFixed(2) : 0, tt: o.turret ? +Math.max(0, o.t).toFixed(1) : 0 });
    const met = []; for (const m of this.meteors) met.push({ x: Math.round(m.x), y: Math.round(m.y), r: m.r, p: +(1 - m.t / m.max).toFixed(2) });
    const zones = []; for (const z of this.zones) zones.push({ x: Math.round(z.x), y: Math.round(z.y), r: z.r, p: +(1 - z.t / z.max).toFixed(2), c: z.col });
    const crates = []; for (const c of this.crates) crates.push({ e: c.eid, x: Math.round(c.x), y: Math.round(c.y) });
    const wdrops = []; for (const d of this.weaponDrops) wdrops.push({ e: d.eid, x: Math.round(d.x), y: Math.round(d.y), wt: d.wt, lv: d.level });
    const xp = []; for (const o of this.groundXp) xp.push({ e: o.eid, x: Math.round(o.x), y: Math.round(o.y) });
    const coins = []; for (const o of this.groundCoins) coins.push({ e: o.eid, x: Math.round(o.x), y: Math.round(o.y), c: o.cid });
    const items = []; for (const it of this.items) items.push({ e: it.eid, x: Math.round(it.x), y: Math.round(it.y), id: it.id });
    const s = { t: C.MSG.SNAPSHOT, tick: this.time, phase: this.phase, wave: this.wave, mode: this.mode.id, survive: +Math.max(0, this.surviveT).toFixed(1), players, mon, bul, orbs, met, crates, wdrops, xp, coins, items, zones, merch: this.merchant ? { x: Math.round(this.merchant.x), y: Math.round(this.merchant.y) } : null, merchD: this.darkMerchant ? { x: Math.round(this.darkMerchant.x), y: Math.round(this.darkMerchant.y) } : null, pend: this.pending, mcount: this.monsters.length, bt: this.bulletTime ? 1 : 0, ev: this.events };
    this.events = []; return s;
  }
}
module.exports = { Room };
