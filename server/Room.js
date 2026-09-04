/* Room.js — sessione di gioco autoritativa (server) — v1.9 pausa-shop/nuove-abilita/scenografia */
'use strict';
const C = require('../shared/constants.js');
const MU = require('../shared/mathutils.js');
const Heroes = require('../shared/heroes.js');
const Mon = require('../shared/monsters.js');
const Loot = require('../shared/loot.js');
const Gear = require('../shared/gear.js');
const Lv = require('../shared/levels.js');
const Pot = require('../shared/potions.js');
const Bnt = require('../shared/bounties.js');
const MapGen = require('../shared/mapgen.js');
const PF = require('../shared/pathfinding.js');
const AI = require('../shared/ai.js');
const Waves = require('../shared/waves.js');
let NEXT = 1;

// v1.69 — le CARTE DI RANGO scrivono qui. Separato dai boon di proposito: i boon sono generici e
// valgono per chiunque, le carte sono di classe. Tenerli in due blocchi rende ovvio, leggendo il codice
// di un effetto, da quale dei due sistemi arriva.
function newPerk() {
  return {
    // guerriero
    parata: 0, sfondamento: 0, sangueFreddo: 0, rotante: 0, sprone: 0, muro: 0, furia: 0,
    // mago
    bollaDensa: 0, bulletSpeed: 0, mana: 0, runa: 0, detona: 0, detonaR: 70, detonaQ: 0.4, passoVuoto: 0, convergenza: 0,
    // ladro
    doppiaCocca: 0, dashLong: 0, ombra: 0, spalle: 0, spalleCrit: 0, pioggia: 0, elusione: 0,
    // rango V
    aura: 0, auraCura: 0, auraDR: 0, arcoPiu: 0, catena: 0, catenaPiena: 0,
  };
}
// v1.73 — LE STATISTICHE BASE, in un posto solo. Prima erano un letterale dentro addPlayer: per poter
// SPEGNERE una carta bisogna saper ricostruire il personaggio da zero, e ricostruirlo richiede sapere da
// dove si parte. Stessa idea del ricalcolo dell'equipaggiamento (v1.67), estesa ai poteri.
// v1.66 — le quattro statistiche da gioco di ruolo non agiscono su un danno generico ma sulla SCUOLA
// dell'arma (shared/heroes.js -> weapon.school): Forza sul melee, Intelligenza sulla magia, Destrezza sul
// tiro. Cosi' le classi miste previste in progressione hanno gia' il binario giusto.
function newStats() {
  // v1.79 — maxHpMult: i bonus ai PV delle abilita' neutre sono PERCENTUALI, non in cifra fissa. Il
  // guerriero ha 200 PV e il mago 100: "+30 PV" varrebbe il triplo per il mago. maxHpFlat resta per le
  // statistiche e per l'equipaggiamento, che sono scelte di quel personaggio.
  return { dmgFlat: 0, dmgMult: 1, fireRateMult: 1, maxHpFlat: 0, maxHpMult: 1, speedMult: 1, critChance: 0.03, critMult: 2.0,
    pierce: 0, extraProjectiles: 0, lifesteal: 0, cdrMult: 1, knockMult: 1, novaEvery: 0, abilityMult: 1,
    regen: 0, xpMult: 1, dmgReduce: 0,
    schoolDmg: { melee: 1, magic: 1, ranged: 1 }, schoolRate: { melee: 1, magic: 1, ranged: 1 } };
}
// L'effetto di UNA statistica comprata. Estratto da buyStat perche' il ricalcolo deve riapplicarle tutte.
function applicaStat(p, statId) {
  if (statId === 'st_for') { p.stats.schoolDmg.melee += 0.09; p.stats.knockMult += 0.03; }
  else if (statId === 'st_cos') { p.stats.maxHpFlat += 20; p.stats.dmgReduce = Math.min(0.85, (p.stats.dmgReduce || 0) + 0.012); }
  else if (statId === 'st_int') { p.stats.schoolDmg.magic += 0.09; p.stats.schoolRate.magic += 0.07; }
  else if (statId === 'st_des') { p.stats.schoolDmg.ranged += 0.08; p.stats.schoolRate.ranged += 0.06; p.stats.speedMult += 0.025; }
}
function newBoon() {
  return {
    bounce: 0, pierce: 0, chain: 0, poison: 0, explodeEvery: 0, killNova: 0, bulletSize: 0, slow: 0, thorns: 0,
    killHaste: 0, homing: 0, toxicBurst: 0, frostChain: 0,
    // v1.51 — nuovi poteri
    crowbar: 0, longshot: 0, killStep: 0, magnet: 0, retaliate: 0, aegis: 0, corpseBlast: 0, execute: 0, echo: 0, defiance: 0,
    executeBonus: 0, retaliateWide: 0,
    // v1.79 — thornsPct: quota del danno subito rimandata al mittente (Aura di Spine).
    // implodeEvery: ogni quante bolle una implode (Implosione, scaglione divino del mago).
    thornsPct: 0, implodeEvery: 0, poisonQuota: 0,
    // v1.79.2 — le abilita' rifatte: fendente largo (guerriero), concentrazione/frattura/lentezza (mago),
    // emorragia sui critici, critico dopo lo scatto, critico ogni N colpi, sparizione sotto soglia (ladro).
    ampio: 0, explodeQuota: 0, concentra: 0, frattura: 0, lentezza: 0,
    bleedCrit: 0, ombraDash: 0, critOgni: 0, scomparsa: 0,
  };
}

class Room {
  constructor(id) {
    this.id = id; this.players = new Map(); this.monsters = []; this.bullets = []; this.orbs = []; this.meteors = [];
    this.crates = []; this.weaponDrops = []; this.groundXp = []; this.groundCoins = []; this.items = []; this.zones = []; this.merchant = null; this.darkMerchant = null; this.gearMerchant = null; this.events = [];
    this.phase = C.PHASE_LOBBY; this.wave = 0; this.time = 0; this.map = null;
    this.waveT0 = 0; this.parT = 0; this.waveMostri = 0; this.parPreso = 0;   // v1.77.2 — sempre numeri, mai undefined
    this.pending = 0; this.spawnTimer = 0; this.shopTimer = 0; this.flow = null; this.flowTimer = 0;
    this.bossAlive = false; this.dt = 1 / C.TICK_RATE; this.mode = Waves.MODES.assault;
    this.newMap(1234 + (id.charCodeAt ? id.charCodeAt(0) : 0), 1);
  }
  get alivePlayers() { const a = []; for (const p of this.players.values()) if (p.connected && !p.dead) a.push(p); return a; }
  get anyConnected() { for (const p of this.players.values()) if (p.connected) return true; return false; }
  get anyRevivable() { for (const p of this.players.values()) if (p.connected && (!p.dead || (p.down && p.lives > 1))) return true; return false; }
  broadcast(o) { const s = JSON.stringify(o); for (const p of this.players.values()) if (p.conn) try { p.conn.send(s); } catch (_) {} }
  sendTo(pid, o) { const p = this.players.get(pid); if (p && p.conn) try { p.conn.send(JSON.stringify(o)); } catch (_) {} }

  newMap(seed, level, market) {
    // v1.56 — il MERCATO ha un generatore suo: villaggio costruito a mano, meta' mappa, senza muri interni.
    this.map = market ? MapGen.generateMarket(seed >>> 0) : MapGen.generate(seed >>> 0, level); this.flow = null;
    // v1.75.2 — i corpi solidi del villaggio (mobili e persone). Fuori dal villaggio resta null, e la
    // collisione torna a costare esattamente quanto prima: un solo confronto con null.
    this.solids = (this.map.solids && this.map.solids.length) ? this.map.solids : null;
    this.crates.length = 0; this.weaponDrops.length = 0; this.groundXp.length = 0; this.groundCoins.length = 0; this.items.length = 0;
    for (const p of this.players.values()) { p.x = this.map.spawn.x + MU.rand(-40, 40); p.y = this.map.spawn.y + MU.rand(-40, 40); p.edgeT = 0; p.edgeLv = 0; p.edgeTick = 0; p._edgeWarn = 0; }
    this.merchant = null; this.darkMerchant = null; this.gearMerchant = null;
    if (market) {
      // v1.52 — sosta senza nemici: niente casse (il 30% sarebbe un mimic, cioe' un nemico in una stanza che
      // promette sicurezza) e niente Mercante Errante, che resta un incontro delle ondate normali.
      // v1.56 — posizioni di fabbro, portale e botteghe arrivano dal villaggio, non piu' calcolate a runtime.
      this._layoutMarket();
      this.broadcast({ t: C.MSG.MAP, map: this.map, wave: this.wave, market: 1 });
      return;
    }
    this.spawnCrates();
    this.broadcast({ t: C.MSG.MAP, map: this.map, wave: this.wave });
    // v1.13 — UN SOLO mercante per round: il Nero SOSTITUISCE casualmente l'ufficiale (mai entrambi).
    if (Math.random() < 0.30) this.spawnDarkMerchant(); // 30% mercato nero al posto di quello ufficiale
    else this.spawnMerchant();
  }
  spawnCrates() { const s = (this.map.crateSpawns || []).slice(); if (!s.length) return; const n = 3 + Math.floor(Math.random() * 3); for (let i = 0; i < n && s.length; i++) { const c = s.splice((Math.random() * s.length) | 0, 1)[0]; this.crates.push({ eid: NEXT++, x: c.x, y: c.y, r: 16, mimic: Math.random() < 0.30, opened: false }); } }
  // v1.66 — le armi non si raccolgono piu' dalla mappa: saranno disponibili SOLO dal negozio, e l'acquisto
  // e' a sua volta sospeso finche' l'arsenale non viene ripensato attorno alle nuove scuole (melee/magic/
  // ranged). La funzione resta come stub perche' `weaponDrops` e il suo canale di rete restino validi.
  spawnWeapons() { /* disattivata in v1.66 */ }

  addPlayer(pid, conn, name, heroId) {
    const hero = Heroes.HEROES[heroId] || Heroes.HEROES.guerriero;
    const p = {
      id: pid, conn, connected: true, name: (name || 'Eroe').slice(0, 16), heroId: hero.id, hero,
      x: this.map.spawn.x + MU.rand(-40, 40), y: this.map.spawn.y + MU.rand(-40, 40), vx: 0, vy: 0, aim: 0, radius: C.PLAYER_RADIUS * (C.COL_SCALE || 1),
      hp: hero.hp, maxHp: hero.hp, dead: false, down: false, downT: 0, fireCd: 0, facing: 0,
      input: { mx: 0, my: 0, aim: 0, shoot: false, q: false, e: false, dash: false, pot: 0 }, cdQ: 0, cdE: 0, cdDash: 0, buffs: {},
      // v1.71 — LA CINTURA: tre slot, ognuno null oppure { id, n }. Il cooldown e' UNO SOLO per tutti e
      // tre (potCd), altrimenti basterebbe alternare gli slot per bere tre volte di fila.
      belt: Pot.newBelt(), potCd: 0, potCdMax: Pot.COOLDOWN,
      // v1.72 — MAGAZZINO: cio' che hai comprato resta tuo anche quando lo togli. Rimetterlo addosso e'
      // gratis (l'hai gia' pagato); il Banditore lo ricompra a meta'. E la TAGLIA accettata, una sola.
      owned: {}, bounty: null, bountyOffer: null, noLifeLost: true,
      lives: C.START_LIVES, buys: {}, weapon2: null, coins: 0,
      // v1.69 — la XP non e' piu' una valuta da spendere ma una barra che sale: `xpPool` e' il TOTALE
      // raccolto nella run e non cala mai. Cio' che si spende sono i PUNTI, uno per livello piu' uno
      // per boss. Il livello vive dentro la run: alla morte si riparte da 1 (vedi PROGRESSIONE.md).
      xpPool: 0, level: 1, points: 0, cards: [], spec: null, rankOffer: null, specOffer: null,
      perk: newPerk(), manaShield: 0, manaT: 0, swingCount: 0, furiaBonus: 0, idleShot: 0, runaT: 0,
      // v1.67 — l'equipaggiamento non e' piu' tre contatori di livello ma tre ID di oggetto: si parte con
      // il rango 1 di ogni slot della classe (shared/gear.js). `gearBonus` e' la somma dei loro bonus,
      // RICALCOLATA da zero a ogni cambio: col cambio libero sommare i delta lascerebbe in giro il bonus
      // dell'oggetto sostituito.
      gear: Gear.startingGear(hero.id), gearBonus: { maxHpFlat: 0, dmgReduce: 0, speedMult: 0 },
      boon: newBoon(), boonsOwned: {}, boonOffer: null, boonPicked: false, boonShot: 0, defianceLeft: 0, aegisT: 0,
      // v1.79 — LE ABILITA' PASSIVE SI SCELGONO AGLI SCAGLIONI: livelli 3, 6, 9 e 12. `scaglioniDovuti`
      // e' la coda delle scelte in sospeso ('uncommon', 'rare', 'epic', 'divine'): si riempie salendo di
      // livello e si svuota nel menu di fine ondata. Se e' vuota non si sceglie niente.
      scaglioniDovuti: [],
      // v1.78 — il conto dell'ondata in corso, per il riepilogo di fine livello. Si azzera a ogni ondata:
      // il box racconta QUESTA ondata, non tutta la partita (quella e' la tabella di fine run).
      ondata: { uccisi: 0, xp: 0, monete: 0, livelli: 0 }, exitOk: false,
      // v1.73 — LE CARTE SI SPENGONO. `boonsOwned` e' cio' che possiedi, `cardOn` cio' che e' ACCESO
      // (al massimo C.MAX_CARDS carte diverse). `defianceUsed` tiene il conto delle cariche di Ultima
      // Occasione gia' spese, altrimenti ogni ricalcolo te le regalerebbe di nuovo.
      cardOn: {}, defianceUsed: 0, hpDebt: 0,
      stats: newStats(),
      shotCount: 0, kills: 0, damageDealt: 0, combo: 0, comboBest: 0, comboT: 0, synActive: {}, comboRewT: 0,
    };
    for (const k in p.gear) p.owned[p.gear[k]] = 1;   // v1.72 — l'equipaggiamento di partenza e' gia' tuo
    this._recomputeGear(p); p._needFull = true; this.players.set(pid, p); return p;
  }
  removePlayer(pid) { const p = this.players.get(pid); if (p) { p.connected = false; p.conn = null; } }
  setInput(pid, i) { const p = this.players.get(pid); if (!p) return; p.input.mx = MU.clamp(i.mx || 0, -1, 1); p.input.my = MU.clamp(i.my || 0, -1, 1); p.input.aim = i.aim || 0; p.input.shoot = !!i.shoot; p.input.q = !!i.q; p.input.e = !!i.e; p.input.dash = !!i.dash; p.input.pot = Math.max(0, Math.min(Pot.SLOTS, i.pot | 0)); }

  startGame() {
    if (this.phase !== C.PHASE_LOBBY && this.phase !== C.PHASE_GAMEOVER && this.phase !== C.PHASE_VICTORY) return;
    this.wave = 0; this.monsters.length = 0; this.bullets.length = 0;
    for (const p of this.players.values()) { p.dead = false; p.down = false; p.hp = p.maxHp; p.kills = 0; p.buffs = {}; p.weapon2 = null; p.lives = C.START_LIVES; p.xpPool = 0; p.level = 1; p.points = 0; p.cards = []; p.spec = null; p.rankOffer = null; p.specOffer = null; p.perk = newPerk(); p.manaShield = 0; p.swingCount = 0; p.furiaBonus = 0; p.buys = {}; p.boon = newBoon(); p.boonsOwned = {}; p.scaglioniDovuti = []; p.ondata = { uccisi: 0, xp: 0, monete: 0, livelli: 0 }; p.exitOk = false; p.cardOn = {}; p.defianceUsed = 0; p.hpDebt = 0; p.stats = newStats(); p.boonShot = 0; p.defianceLeft = 0; p.aegisT = 0; p.combo = 0; p.comboBest = 0; p.comboT = 0; p.synActive = {}; p.comboRewT = 0; p.damageDealt = 0; p.coins = 0; p.gear = Gear.startingGear(p.heroId); p.belt = Pot.newBelt(); p.potCd = 0; p.owned = {}; p.bounty = null; p.bountyOffer = null; p.noLifeLost = true; for (const k in p.gear) p.owned[p.gear[k]] = 1; this._recomputeGear(p); p.hp = this.effMaxHp(p); this.sendBoons(p); }
    this.runStart = this.time; this.newMap((Math.random() * 1e9) | 0, 1); this.nextWave();
  }
  nextWave() {
    this.wave++;
    this.mode = Waves.modeForWave(this.wave);
    this.phase = Waves.isBossWave(this.wave) ? C.PHASE_BOSS : C.PHASE_COMBAT;
    if (this.wave > 1 && (this.wave % 2 === 1 || this._forceNewMap)) { this._forceNewMap = false; this.newMap((Math.random() * 1e9) | 0, this.wave); }  // v1.52 — uscendo dal MERCATO la mappa va rigenerata comunque, altrimenti si combatterebbe nella stanza del mercante
    else { if (!this.crates.length) this.spawnCrates(); }
    if (Waves.isBossWave(this.wave)) { this.spawnBoss(); this.pending = Math.round(4 + this.wave * 0.5); }
    else { const w = Waves.buildWave(this.wave, this.alivePlayers.length || 1, this.mode); this.waveList = w.list; this.waveScaling = w.scaling; this.pending = w.list.length; }
    for (const p of this.players.values()) p.noLifeLost = true;   // v1.72 — la lavagna si pulisce a ogni ondata
    // v1.77.2 — ATTENZIONE AL RIPIEGO. Qui c'era scritto `this.time - (this.waveT0 || this.time)`:
    // alla PRIMA ondata waveT0 vale esattamente 0, che in JavaScript e' falso, quindi scattava il
    // ripiego e il tempo trascorso risultava sempre zero — il cronometro restava fermo su 0:00 per
    // tutta la partita. Adesso waveT0 e' sempre un numero valido e non serve nessun ripiego.
    // v1.77 — il cronometro parte con l'ondata. Il tempo obiettivo si calcola dal contenuto vero
    // dell'ondata (mostri in coda piu' quelli gia' in campo) diviso i giocatori in piedi.
    this.waveT0 = this.time;
    this.waveMostri = this.pending + this.monsters.filter(x => !x.dead).length;
    // v1.78 — con una modalita' sola non esistono piu' ondate a tempo fisso: il tempo obiettivo vale
    // per tutte, senza eccezioni da spiegare.
    this.parT = Math.round(C.PAR_BASE + C.PAR_PER_MOSTRO * this.waveMostri / Math.max(1, this.alivePlayers.length || 1));
    this.parPreso = 0; this.waveDur = null; this.parBonus = null;
    for (const p of this.players.values()) { p.ondata = { uccisi: 0, xp: 0, monete: 0, livelli: 0 }; p.exitOk = false; }
    this.spawnTimer = 0; this._peakAlive = 0; this.broadcast({ t: C.MSG.EVENT, ev: { t: 'wave', wave: this.wave, boss: Waves.isBossWave(this.wave), final: this.wave >= Waves.FINAL_WAVE } });
  }
  // v1.78 — QUI C'ERA spawnTreasure(). Generava una cassa-mima gonfiata che scappava dai giocatori
  // con un timer di fuga: era il cuore della modalita' Tesoro, tolta insieme alle altre tre. Con essa
  // se ne vanno il campo m.treasure, il campo this.treasure, gli eventi treasure_spawn/dead/escape e i
  // moltiplicatori di XP e monete che valevano solo per lei. La cassa-mima normale ('mimic') resta un
  // mostro come gli altri.
  // v1.76.1 — I MOSTRI NON DEVONO NASCERE ADDOSSO A TE. Le caselle di generazione sono scelte
  // lontane dalla PARTENZA, ma un'ondata dura minuti e tu nel frattempo ti sei spostato: una casella
  // lontana dal punto di atterraggio puo' trovarsi a due passi da dove sei adesso, e il mostro ti
  // spunta accanto. Vale lo stesso principio del recupero anti-stallo: si vede arrivare, non
  // comparire. Si pescano piu' caselle e si tiene la migliore — lontana, e possibilmente fuori vista.
  randomSpawnPos() { const sp = this.map.enemySpawns;
    if (sp && sp.length) {
      const ap = this.alivePlayers;
      const mondo = (c) => ({ x: c.x * C.TILE + C.TILE / 2, y: c.y * C.TILE + C.TILE / 2 });
      if (!ap.length) return mondo(sp[(Math.random() * sp.length) | 0]);
      let meglio = null, megDist = -1;
      for (let k = 0; k < 24; k++) {
        const w = mondo(sp[(Math.random() * sp.length) | 0]);
        let d = Infinity; for (const p of ap) { const dd = MU.dist(w.x, w.y, p.x, p.y); if (dd < d) d = dd; }
        if (d < 520) continue;                      // troppo vicino: scartata
        let visto = false; for (const p of ap) if (this.losClear(p.x, p.y, w.x, w.y)) { visto = true; break; }
        if (!visto) return w;                        // lontana E fuori vista: e' quella giusta
        if (d > megDist) { megDist = d; meglio = w; }
      }
      if (meglio) return meglio;
      // nessuna casella lontana: si prende comunque la piu' lontana che c'e', non una a caso
      let piuLontana = null, dMax = -1;
      for (let k = 0; k < 40; k++) { const w = mondo(sp[(Math.random() * sp.length) | 0]);
        let d = Infinity; for (const p of ap) { const dd = MU.dist(w.x, w.y, p.x, p.y); if (dd < d) d = dd; }
        if (d > dMax) { dMax = d; piuLontana = w; } }
      return piuLontana || mondo(sp[(Math.random() * sp.length) | 0]);
    } return { x: this.map.spawn.x, y: this.map.spawn.y }; }
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
  _blk(x, y, r) { return this.isWallAt(x - r, y) || this.isWallAt(x + r, y) || this.isWallAt(x, y - r) || this.isWallAt(x, y + r) || this._corpo(x, y, r); }
  // v1.75.2 — un cerchio di raggio r, in (x,y), tocca un mobile o una persona del villaggio?
  _corpo(x, y, r) {
    const S = this.solids; if (!S) return false;
    for (let i = 0; i < S.length; i++) { const s = S[i];
      if (s.t === 'c') { const dx = x - s.x, dy = y - s.y, rr = s.r + r; if (dx * dx + dy * dy < rr * rr) return true; }
      else if (Math.abs(x - s.x) < s.hw + r && Math.abs(y - s.y) < s.hh + r) return true; }
    return false;
  }
  // v1.75.2 — LA SPINTA. La collisione impedisce di ENTRARE in un mobile, ma dentro ci si puo' trovare lo
  // stesso: un teletrasporto, uno scatto, o semplicemente una persona che si sposta addosso a te. Allora si
  // esce dal lato piu' vicino, un po' per volta, e mai dentro la roccia — quella la sistema _unstuck.
  _spingiFuori(e) {
    const S = this.solids; if (!S) return;
    const r = e.radius * 0.8;
    for (let giro = 0; giro < 4; giro++) {
      let mosso = false;
      for (let i = 0; i < S.length; i++) { const s = S[i];
        let px = 0, py = 0;
        if (s.t === 'c') {
          const dx = e.x - s.x, dy = e.y - s.y, rr = s.r + r, d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          const d = Math.sqrt(d2);
          const nx = d > 0.01 ? dx / d : 1, ny = d > 0.01 ? dy / d : 0;
          px = nx * (rr - d + 0.5); py = ny * (rr - d + 0.5);
        } else {
          const dx = e.x - s.x, dy = e.y - s.y;
          const ox = s.hw + r - Math.abs(dx), oy = s.hh + r - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;
          if (ox < oy) px = (dx < 0 ? -1 : 1) * (ox + 0.5); else py = (dy < 0 ? -1 : 1) * (oy + 0.5);
        }
        // si esce solo verso lo spazio libero: se di la' c'e' roccia si prova dal lato opposto
        if (!this.isWallAt(e.x + px, e.y + py)) { e.x += px; e.y += py; mosso = true; }
        else if (!this.isWallAt(e.x - px, e.y - py)) { e.x -= px; e.y -= py; mosso = true; }
      }
      if (!mosso) break;
    }
    // Incastrato FRA DUE corpi (fra il tavolo e chi ci sta attorno) le due spinte si annullano a vicenda e
    // il ciclo qui sopra fa avanti e indietro. Allora si smette di negoziare: si cerca il punto libero piu'
    // vicino, girando in tondo e allargando, e ci si mette li'. Costa qualcosa solo quando serve davvero.
    if (!this._blk(e.x, e.y, r)) return;
    for (let d = 6; d <= 96; d += 6) for (let k = 0; k < 16; k++) {
      const ang = k * Math.PI / 8, nx = e.x + Math.cos(ang) * d, ny = e.y + Math.sin(ang) * d;
      if (!this._blk(nx, ny, r)) { e.x = nx; e.y = ny; return; }
    }
  }
  _snap(cur, tgt, oth, r, isX) { const st = tgt > cur ? 1 : -1; let v = cur; for (let i = 0; i < 12; i++) { const t = v + st * 2; const bx = isX ? t : oth, by = isX ? oth : t; if (this._blk(bx, by, r)) break; v = t; } return v; }
  // v1.63 — PROFONDITA' NEL MARGINE: 0 = sei al sicuro, cresce avvicinandosi al bordo giocabile.
  // I due assi si SOMMANO, quindi un angolo (dove sei coperto su due lati, il posto piu' abusato)
  // vale il doppio di un bordo dritto e la faglia ti mangia il doppio piu' in fretta.
  _edgeDepth(x, y) {
    const T = C.TILE, M = C.EDGE_MARGIN;
    const gx = (x / T) | 0, gy = (y / T) | 0;
    // v1.76 — se la mappa porta il campo della faglia (le mappe di combattimento lo fanno), la
    // profondita' e' quella misurata sulla forma vera della caverna. Il calcolo sul rettangolo qui
    // sotto resta per il villaggio e per qualunque mappa senza campo.
    const F = this.map && this.map.edgeField;
    if (F) { if (gx < 0 || gy < 0 || gx >= this.map.w || gy >= this.map.h) return M * 2;
      return F[gy * this.map.w + gx] || 0; }
    const dx = Math.min(gx - 2, (this.map.w - 3) - gx);
    const dy = Math.min(gy - 2, (this.map.h - 3) - gy);
    return Math.max(0, M - dx) + Math.max(0, M - dy);
  }
  // v1.76 — la ricerca era +-3 tessere. Con le masse di roccia della pianta nuova, chi finisce
  // dentro una massa grande non trova pavimento entro tre tessere e ci resta incastrato: misurato,
  // 7 mostri piantati nel muro su una partita. Adesso +-8, che copre la massa piu' larga.
  _unstuck(e) { const T = C.TILE; const gx = (e.x / T) | 0, gy = (e.y / T) | 0; let best = null, bd = Infinity; for (let ry = -8; ry <= 8; ry++) for (let rx = -8; rx <= 8; rx++) { const nx = gx + rx, ny = gy + ry; if (nx < 0 || ny < 0 || nx >= this.map.w || ny >= this.map.h) continue; if (this.map.grid[ny * this.map.w + nx] === C.T_WALL) continue; const cx = nx * T + T / 2, cy = ny * T + T / 2; const d = MU.dist2(e.x, e.y, cx, cy); if (d < bd) { bd = d; best = { x: cx, y: cy }; } } if (best) { const n = MU.norm(best.x - e.x, best.y - e.y); e.x += n.x * 6; e.y += n.y * 6; if (this.isWallAt(e.x, e.y) && bd < 9999) { e.x = best.x; e.y = best.y; } } }
  // v1.43 — RECUPERO da INCASTRO (per QUALSIASI mostro, boss compresi). Il monster è "incastrato" quando prova a
  // muoversi ma non avanza (wedge in un angolo, senza essere dentro un muro). Qui prova a SCIVOLARE: tra 8 direzioni
  // sceglie quella non bloccata più allineata all'intento; se persiste, fa un piccolo salto verso una cella libera.
  _recoverStuck(m, aim) {
    if (m.def && m.def.immobile) return;   // v1.58 — il fungo non e incastrato: sta fermo per design
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
      ANELLO: C.ANELLO_ATTESA,
      flowStep(m) { if (!self.flow) return { x: 0, y: 0, d: -1 }; const gx = (m.x / C.TILE) | 0, gy = (m.y / C.TILE) | 0; return PF.stepDir(self.flow, self.map.grid, self.map.w, self.map.h, gx, gy); },
      losClear: (a, b, c, d) => self.losClear(a, b, c, d),
      isWallAt: (x, y) => self.isWallAt(x, y),
      shoot(m, dx, dy, spd, dmg, color) { self.bullets.push({ eid: NEXT++, hostile: true, x: m.x, y: m.y, vx: dx * spd, vy: dy * spd, r: C.BULLET_RADIUS + 1, dmg, color: color || '#ff5252', life: 3.2, pierce: 0, owner: m.eid, curse: m.def.curse ? 1 : 0 }); },
      summon(id, x, y) { if (self._postiLiberi() <= 0) return; const s = self.waveScaling || Waves.scaling(self.wave, self.alivePlayers.length || 1); self.spawnMonster(id, x, y, { scaling: s }); },
      // v1.39 — evocazione OWNED (con proprietario) per il tetto di minion del Negromante
      summonMinion(id, x, y, owner) { if (self._postiLiberi() <= 0) return; const s = self.waveScaling || Waves.scaling(self.wave, self.alivePlayers.length || 1); const mm = self.spawnMonster(id, x, y, { scaling: s }); if (mm) { mm.owner = owner; mm.minion = true; } return mm; },
      countMinions(owner) { let c = 0; for (const mm of self.monsters) { if (!mm.dead && mm.owner === owner) c++; } return c; },
      melee(m, p, dmg, kn) { self.damagePlayer(p, dmg, m.x, m.y, kn || 1);
        // v1.79 — le spine rimandano un forfait PIU' una quota del colpo incassato: cosi' restano utili
        // anche all'ondata 18, quando i nemici picchiano forte e 25 danni fissi non si notano piu'.
        if (p.boon && p.boon.thorns > 0 && !m.dead) self.damageMonster(m, Math.round(p.boon.thorns + dmg * (p.boon.thornsPct || 0)), p.x, p.y, 0, p); },
      areaDamage(x, y, r, dmg, color, kn) { self.events.push({ t: 'area', x, y, r, c: color }); for (const p of self.alivePlayers) if (MU.dist(x, y, p.x, p.y) <= r + p.radius) self.damagePlayer(p, dmg, x, y, kn || 1); },
      meteor(x, y, r, dmg) { self.meteors.push({ eid: NEXT++, x, y, r, dmg, t: 1.1, max: 1.1 }); self.events.push({ t: 'meteor_tell', x, y, r }); },
      zone(x, y, r, delay, dmg, color) { self.zones.push({ eid: NEXT++, x, y, r, dmg, t: delay || 0.9, max: delay || 0.9, col: color || '#ff3b3b', done: false }); self.events.push({ t: 'zone_tell', x, y, r, delay: delay || 0.9, c: color || '#ff3b3b' }); },
      spread(m, cx, cy, n, arc, spd, dmg, color) { const base = Math.atan2(cy, cx); for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * arc; self.bullets.push({ eid: NEXT++, hostile: true, x: m.x, y: m.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: C.BULLET_RADIUS + 1, dmg, color: color || '#ff5252', life: 3.2, pierce: 0, owner: m.eid, curse: m.def.curse ? 1 : 0 }); } },
      emit(ev) { self.events.push(ev); },
      GAZE_TICK: C.GAZE_TICK,
      gaze(m, p, kind) { self.gazePlayer(p, kind); },
      // v1.79.2 — IL BEHOLDER ADESSO ATTACCA. Prima applicava solo debuff: potevi restargli davanti tutto
      // il giorno e non ti succedeva niente. Il raggio fa danno a ogni tick finche' ti tiene nel cono, e
      // sotto la distanza di morso smette di guardarti e ti azzanna.
      gazeHit(m, p, dmg) { self.damagePlayer(p, dmg, m.x, m.y, 0); self.events.push({ t: 'gaze_hit', x: p.x, y: p.y, d: dmg }); },
    };
  }
  // v1.69 — OMBRA: chi e' nascosto non viene proprio considerato come bersaglio. Se pero' sono TUTTI
  // nascosti si torna a considerarli, altrimenti i mostri resterebbero fermi a fissare il vuoto.
  // v1.69 — quanti posti restano sotto il tetto dei vivi. I mostri morti sono ancora nell'array finche'
  // non viene filtrato, quindi contarli farebbe rifiutare comparse che invece ci starebbero.
  _postiLiberi() { let vivi = 0; for (const m of this.monsters) if (!m.dead) vivi++; return this.tettoVivi() - vivi; }
  // v1.79.2 — quanti nemici possono stare in campo insieme: un numero solo, quaranta, uguale a ogni
  // ondata. La curva che li centellinava nelle prime ondate e' stata tolta — teneva nascosta meta'
  // dell'ondata proprio dove serviva vedere che i nemici erano aumentati. Se un giorno tornasse una
  // curva, basta rimettere MAX_ALIVE_CURVE a un array e questa funzione la rilegge.
  tettoVivi() {
    const cur = C.MAX_ALIVE_CURVE;
    if (!cur || !cur.length) return C.MAX_ALIVE || 40;
    const w = Math.max(1, this.wave | 0);
    return w >= cur.length ? (C.MAX_ALIVE || 40) : cur[w - 1];
  }
  _nearestPlayer(x, y) {
    let best = null, bd = Infinity;
    for (const p of this.alivePlayers) { if (p.buffs.hidden > 0) continue; const d = MU.dist2(x, y, p.x, p.y); if (d < bd) { bd = d; best = p; } }
    if (best) return best;
    for (const p of this.alivePlayers) { const d = MU.dist2(x, y, p.x, p.y); if (d < bd) { bd = d; best = p; } }
    return best;
  }

  // ===== MERCATO (v1.52) — mappa di sosta ogni MARKET_EVERY ondate =====
  // Sostituisce l'acquisto diretto dell'equipaggiamento a fine ondata: ora l'Emporio e' un LUOGO.
  // v1.53 — layout del MERCATO. mapgen mette l'uscita nella cella PIU' LONTANA dal centro: in una mappa
  // di combattimento ha senso, in una sosta no — atterri al centro e il portale e' fuori schermo.
  // Qui riposizioniamo entrambi: fabbro a ~SMITH_DIST tile dallo spawn, portale a ~EXIT_DIST dalla parte
  // opposta. Cosi' appena arrivi vedi il fabbro, e girandoti vedi la via d'uscita.
  // v1.56 — il villaggio arriva gia' disposto dal generatore: qui si aggancia solo il fabbro.
  // (Il calcolo a runtime delle distanze della v1.53 non serve piu': le posizioni sono scelte a mano.)
  _layoutMarket() {
    const v = this.map && this.map.village;
    const pos = (v && v.smith) || { x: this.map.spawn.x, y: this.map.spawn.y };
    this.gearMerchant = { x: pos.x, y: pos.y, r: 18 };
    // v1.71 — l'ERBORISTA e' la seconda bottega che apre. Sta gia' nel villaggio disegnato da mapgen:
    // qui si aggancia solo la sua posizione, esattamente come si fa col fabbro.
    const erb = (v && v.npcs) ? v.npcs.find(n => n.pot) : null;
    this.herbalist = erb ? { x: erb.x, y: erb.y, r: 18 } : null;
    // v1.72 — il BANDITORE: terza bottega ad aprire. Ricompra l'usato e appende le taglie.
    const bnd = (v && v.npcs) ? v.npcs.find(n => n.bnd) : null;
    this.bandit = bnd ? { x: bnd.x, y: bnd.y, r: 18 } : null;
    // v1.73 — la CARTOMANTE: quarta bottega. Non prevede il futuro e non ridistribuisce i punti (idee
    // scartate da Paolo): decide quali carte tieni ACCESE, al massimo C.MAX_CARDS per volta.
    const sgr = (v && v.npcs) ? v.npcs.find(n => n.crd) : null;
    this.seer = sgr ? { x: sgr.x, y: sgr.y, r: 18 } : null;
    // v1.74 — l'OSTESSA: l'ultima bottega. Per ora fa una cosa sola, rimetterti in piedi a pagamento.
    const inn = (v && v.npcs) ? v.npcs.find(n => n.inn) : null;
    this.innkeeper = inn ? { x: inn.x, y: inn.y, r: 18 } : null;
    for (const p of this.players.values()) { p._nearGear = false; p._nearHerb = false; p._nearBnd = false; p._nearSeer = false; p._nearInn = false; }
  }
  updateInn() {
    if (!this.innkeeper) return; const RANGE = C.MARKET_MERCH_RANGE;
    for (const p of this.alivePlayers) {
      const near = MU.dist(p.x, p.y, this.innkeeper.x, this.innkeeper.y) <= RANGE;
      if (near && !p._nearInn) { p._nearInn = true; this.offerInn(p, 1); }
      else if (!near && p._nearInn) { p._nearInn = false; this.sendTo(p.id, { t: C.MSG.EVENT, ev: { t: 'inn_leave' } }); }
    }
  }
  updateSeer() {
    if (!this.seer) return; const RANGE = C.MARKET_MERCH_RANGE;
    for (const p of this.alivePlayers) {
      const near = MU.dist(p.x, p.y, this.seer.x, this.seer.y) <= RANGE;
      if (near && !p._nearSeer) { p._nearSeer = true; this.offerSeer(p, 1); }
      else if (!near && p._nearSeer) { p._nearSeer = false; this.sendTo(p.id, { t: C.MSG.EVENT, ev: { t: 'seer_leave' } }); }
    }
  }
  updateBandit() {
    if (!this.bandit) return; const RANGE = C.MARKET_MERCH_RANGE;
    for (const p of this.alivePlayers) {
      const near = MU.dist(p.x, p.y, this.bandit.x, this.bandit.y) <= RANGE;
      if (near && !p._nearBnd) { p._nearBnd = true; this.offerBandit(p, 1); }
      else if (!near && p._nearBnd) { p._nearBnd = false; this.sendTo(p.id, { t: C.MSG.EVENT, ev: { t: 'bnd_leave' } }); }
    }
  }
  updateHerbalist() {
    if (!this.herbalist) return; const RANGE = C.MARKET_MERCH_RANGE;
    for (const p of this.alivePlayers) {
      const near = MU.dist(p.x, p.y, this.herbalist.x, this.herbalist.y) <= RANGE;
      if (near && !p._nearHerb) { p._nearHerb = true; this.offerPotions(p, 1); }
      else if (!near && p._nearHerb) { p._nearHerb = false; this.sendTo(p.id, { t: C.MSG.EVENT, ev: { t: 'herb_leave' } }); }
    }
  }
  updateGearMerchant() {
    if (!this.gearMerchant) return; const RANGE = C.MARKET_MERCH_RANGE;
    for (const p of this.alivePlayers) {
      const near = MU.dist(p.x, p.y, this.gearMerchant.x, this.gearMerchant.y) <= RANGE;
      if (near && !p._nearGear) { p._nearGear = true; this.offerGear(p, 1); }
      else if (!near && p._nearGear) { p._nearGear = false; this.sendTo(p.id, { t: C.MSG.EVENT, ev: { t: 'gear_leave' } }); }
    }
  }
  enterMarket() {
    this.phase = C.PHASE_MARKET; this.marketTimer = 120;  // anti-AFK: come il negozio, scatta solo in multiplayer
    this.monsters.length = 0; this.bullets.length = 0; this.pending = 0; this.waveList = [];
    this.newMap((Math.random() * 1e9) | 0, this.wave, true);
    for (const p of this.players.values()) { if (!p.connected) continue; p._nearGear = false; p._nearHerb = false; p._nearBnd = false; p._nearSeer = false; p._nearInn = false; this.offerGear(p, 0); this.offerPotions(p, 0); this.offerBandit(p, 0); this.offerSeer(p, 0); this.offerInn(p, 0); }
    this.broadcast({ t: C.MSG.EVENT, ev: { t: 'market', wave: this.wave, next: this.wave + 1 } });
  }
  // Uscita dal mercato: CO-OP — il primo che entra nel portale EXIT trascina tutti.
  _checkMarketExit() {
    if (!this.map || !this.map.exit) return;
    const T = C.TILE, ex = this.map.exit.x * T + T / 2, ey = this.map.exit.y * T + T / 2;
    for (const p of this.alivePlayers) {
      if (MU.dist(p.x, p.y, ex, ey) > C.MARKET_EXIT_RADIUS) continue;
      this.gearMerchant = null; this.herbalist = null; this.bandit = null; this.seer = null; this.innkeeper = null;
      for (const q of this.players.values()) { q._nearGear = false; q._nearHerb = false; q._nearBnd = false; q._nearSeer = false; q._nearInn = false; }
      this.broadcast({ t: C.MSG.EVENT, ev: { t: 'market_exit', who: p.id, name: p.name } });
      this._forceNewMap = true; this.riapriMenu(); return;
    }
  }
  // v1.53 — dopo il pannello di fine ondata la DESTINAZIONE la sceglie il giocatore (pulsanti del menu di
  // pausa), non piu' una cadenza fissa ogni N ondate. In co-op vale la PRIMA scelta espressa, coerente con
  // la regola del portale ("il primo che entra decide"). Aggiungere una destinazione nuova = un altro
  // valore di dest qui e un pulsante in piu' in #shopActions.
  // v1.79 — dal menu si esce in un modo solo: la mappa successiva. Il villaggio non e' piu' una
  // destinazione scelta qui, e' una sezione del menu da cui si torna indietro.
  _afterShop() { this.shopDest = null; this.nextWave(); }

  // ===== NPC MERCANTE (v1.11) — neutrale, vende 3 offerte casuali per MONETE =====
  merchantWaresPool() {
    return [
      { id: 'heal', name: 'Bende del Viandante', icon: '❤️', color: '#ff5a7a', cost: 45, kind: 'heal', desc: 'Ripristina il 55% dei PV' },
      { id: 'maxhp', name: 'Talismano Vitale', icon: '🧿', color: '#4bd66b', cost: 130, kind: 'maxhp', val: 30, desc: '+30 PV massimi (permanente)' },
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
    else if (w.kind === 'maxhp') { p.stats.maxHpFlat += w.val; }   // v1.74.1 — alza il massimo, NON cura
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
      // v1.79.2 — QUI C'ERA L'OFFERTA DI SANGUE: +2 vite in cambio di meta' delle monete. Il prezzo non
      // era un prezzo: chi aveva poche monete pagava poco o niente e si portava a casa due vite, cioe'
      // esattamente chi non se le sarebbe dovute permettere. Tolta.
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
    else if (w.kind === 'dark_relic') { p.stats.maxHpFlat = Math.max(-p.maxHp + 20, p.stats.maxHpFlat - 20); if (p.hp > this.effMaxHp(p)) p.hp = this.effMaxHp(p); this.offerBoon(p); note = 'Potere maledetto'; }
    else if (w.kind === 'gamble') { const good = Math.random() < 0.5; if (good) { const r = Math.random(); if (r < 0.34) { p.stats.dmgMult += 0.25; note = 'Benedizione: +25% danno!'; } else if (r < 0.67) { p.stats.maxHpFlat += 40; note = 'Benedizione: +40 PV massimi!'; } else { p.lives += 1; note = 'Benedizione: +1 vita!'; } } else { const r = Math.random(); if (r < 0.5) { p.stats.dmgReduce = (p.stats.dmgReduce || 0) - 0.10; note = 'Maledizione: +10% danni subiti'; } else { p.stats.speedMult = Math.max(0.4, p.stats.speedMult - 0.10); note = 'Maledizione: -10% velocita'; } } }
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'dark_buy', id: w.id, name: w.name, icon: w.icon, color: w.color, note, x: p.x, y: p.y } });
    this.sendTo(pid, { t: C.MSG.OFFER_MERCHANT, wares: this.darkMerchant.wares, near: 1, dark: 1, coins: p.coins });
  }

  damagePlayer(p, dmg, sx, sy, kn = 1) {
    if (p.dead || p.down || p.buffs.iframe || p.buffs.i_invuln) return;
    // v1.69 — ELUSIONE (carta del ladro): il colpo non arriva proprio. Prima di tutto il resto, cosi'
    // non consuma ne' l'egida ne' lo scudo di mana.
    if (p.perk.elusione > 0 && MU.chance(p.perk.elusione)) { this.events.push({ t: 'dodge', x: p.x, y: p.y, who: p.id }); return; }
    // v1.51 — EGIDA OSTINATA: annulla per intero un colpo, poi va in ricarica.
    if (p.boon && p.boon.aegis > 0 && (p.aegisT || 0) <= 0) {
      p.aegisT = p.boon.aegis >= 2 ? 5 : 8;   // v1.79 — Egida Ostinata vale 2: un colpo assorbito ogni 5s
      this.events.push({ t: 'aegis', x: p.x, y: p.y, who: p.id });
      return;
    }
    let d = dmg;
    if (p.heroId === 'guerriero') d *= 0.88;  // v1.66 — passiva Piastra: -12% danni subiti
    // v1.69 — PARATA: vale solo sui colpi che arrivano da DAVANTI, cioe' da dove stai guardando.
    if (p.perk.parata && p.buffs.parry > 0 && sx !== undefined) {
      const ang = Math.atan2(sy - p.y, sx - p.x);
      if (Math.abs(((ang - p.aim + Math.PI) % (2 * Math.PI)) - Math.PI) < 1.2) d *= 0.65;
    }
    // MURO: sconto per chi tiene la posizione. Il movimento e' quello richiesto, non quello ottenuto:
    // altrimenti bastava spingersi contro un muro per avere lo sconto restando "fermo".
    if (p.perk.muro > 0 && Math.abs(p.input.mx) < 0.01 && Math.abs(p.input.my) < 0.01) d *= (1 - p.perk.muro);
    // AURA DEL PALADINO: protegge chi ce l'ha e i compagni dentro il cerchio
    let auraDR = p.perk.auraDR || 0;
    for (const q of this.alivePlayers) if (q !== p && q.perk.aura > 0 && MU.dist(q.x, q.y, p.x, p.y) <= q.perk.aura) auraDR = Math.max(auraDR, q.perk.auraDR);
    if (auraDR > 0) d *= (1 - auraDR);
    if (p.buffs.phase) d *= 0.7;
    if (p.buffs.b_shield) d *= 0.5;
    if (p.buffs.i_armor) d *= 0.45;
    if (p.buffs.po_armor) d *= Pot.EFF.armor;
    const dr = (p.stats.dmgReduce || 0) + (p.gearBonus ? p.gearBonus.dmgReduce : 0);
    if (dr > 0) d *= (1 - Math.min(0.85, dr));
    if (p.buffs.gz_sunder > 0) d *= (C.GAZE_SUNDER_MULT || 1.32); // v1.34 — "meno difesa": danni subiti aumentati dallo sguardo
    if (p.buffs.barrier > 0) { const ang = Math.atan2(sy - p.y, sx - p.x); let diff = Math.abs(((ang - p.facing + Math.PI) % (2 * Math.PI)) - Math.PI); if (diff < 1.2) { this.events.push({ t: 'block', x: p.x, y: p.y }); return; } }
    d = Math.max(1, Math.round(d));
    // SCUDO DI MANA: assorbe prima dei PV e si ricarica solo dopo un po' che non prendi colpi.
    p.manaT = 0;
    if (p.manaShield > 0) {
      const ass = Math.min(p.manaShield, d); p.manaShield -= ass; d -= ass;
      this.events.push({ t: 'manahit', x: p.x, y: p.y, left: Math.round(p.manaShield) });
      if (d <= 0) return;
    }
    p.hp -= d; const n = MU.norm(p.x - sx, p.y - sy); p.vx += n.x * 40 * kn; p.vy += n.y * 40 * kn; p.hitFlash = 0.15;
    this.events.push({ t: 'phit', x: p.x, y: p.y, d });
    // v1.79.2 — USCITA DI SCENA: scendendo sotto il 30% dei PV il ladro sparisce dalla vista dei mostri.
    // Non cura e non annulla il colpo: da' i secondi per sganciarsi, ed e' la sua unica via d'uscita.
    if (p.hp > 0 && p.boon && p.boon.scomparsa > 0 && (p.scomparsaCd || 0) <= 0 && p.hp < this.effMaxHp(p) * 0.30) {
      p.buffs.hidden = Math.max(p.buffs.hidden || 0, p.boon.scomparsa); p.scomparsaCd = 20;
      this.events.push({ t: 'scomparsa', x: p.x, y: p.y, who: p.id, dur: p.boon.scomparsa });
    }
    // v1.51 — RAPPRESAGLIA: farsi colpire diventa una risposta, non solo una perdita. Scatta anche sul colpo fatale.
    if (p.boon && p.boon.retaliate > 0) {
      const rad = (p.boon.retaliateWide ? 150 : 100) + 20 * p.boon.retaliate;
      const rd = Math.max(1, Math.round(this.effDamage(p) * 0.8 * p.boon.retaliate));
      for (const o of this.monsters) { if (o.dead) continue; if (MU.dist2(p.x, p.y, o.x, o.y) <= rad * rad) this.damageMonster(o, rd, p.x, p.y, 26, p); }
      this.events.push({ t: 'retaliate', x: p.x, y: p.y, r: rad });
    }
    if (p.hp <= 0) this.downPlayer(p);
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
  downPlayer(p) {
    // v1.51 — ULTIMA OCCASIONE: consuma una carica e rimette in piedi invece di far cadere.
    if ((p.defianceLeft || 0) > 0) {
      p.defianceLeft--; p.defianceUsed = (p.defianceUsed || 0) + 1; p.hp = Math.round(this.effMaxHp(p) * 0.5); p.buffs.iframe = 2;
      this.events.push({ t: 'defiance', x: p.x, y: p.y, who: p.id, name: p.name, left: p.defianceLeft });
      return;
    }
    p.hp = 0; p.down = true; p.downT = C.DOWN_BLEED_TIME; this.events.push({ t: 'down', x: p.x, y: p.y, name: p.name, lives: p.lives }); if (!this.anyRevivable) this.gameOver();
  }
  gameOver() { this.phase = C.PHASE_GAMEOVER; this.broadcast({ t: C.MSG.EVENT, ev: { t: 'gameover', wave: this.wave, stats: this.buildRunStats(), dur: Math.round(this.time - (this.runStart || 0)) } }); }
  victory() { this.phase = C.PHASE_VICTORY; this.broadcast({ t: C.MSG.EVENT, ev: { t: 'victory', wave: this.wave, stats: this.buildRunStats(), dur: Math.round(this.time - (this.runStart || 0)) } }); }

  // v1.67 — l'ARMA arriva dall'oggetto equipaggiato, non piu' dalla classe: e' l'unico punto da cui
  // leggerla. La scuola resta quella dell'eroe, altrimenti comprare un'arma spegnerebbe la statistica
  // su cui il giocatore ha investito la run intera.
  effWeapon(p) {
    const it = p.gear && Gear.BY_ID[p.gear.weapon];
    if (!it || !it.weapon) return p.hero.weapon;
    if (!it._w || it._w.school !== p.hero.weapon.school) it._w = Object.assign({}, it.weapon, { school: p.hero.weapon.school });
    return it._w;
  }
  // Ricalcola da zero i bonus degli oggetti indossati e riporta i PV dentro il nuovo massimo.
  _recomputeGear(p) {
    p.gearBonus = Gear.bonusOf(p.gear);
    p.stats.pierce = this.effWeapon(p).pierce || 0;
    p.hp = Math.min(p.hp, this.effMaxHp(p));
  }
  effMaxHp(p) { return Math.round((p.maxHp + p.stats.maxHpFlat + (p.gearBonus ? p.gearBonus.maxHpFlat : 0)) * (p.stats.maxHpMult || 1)); }
  effSpeed(p) { let s = p.hero.speed * (p.stats.speedMult + (p.gearBonus ? p.gearBonus.speedMult : 0)) * 1.05; if (p.buffs.b_speed) s *= 1.45; if (p.buffs.i_speed) s *= 1.4; if (p.buffs.po_speed) s *= (1 + Pot.EFF.speed); if (p.buffs.curse > 0) s *= (C.CURSE_SPEED_MULT || 0.8); if (p.buffs.gz_slow > 0) s *= (C.GAZE_SLOW_MULT || 0.72); if (p.buffs.killStep > 0) s *= (1 + 0.20 * Math.min(2, p.killStepStacks || 1)); if (p.buffs.dash > 0) s *= C.DASH_SPEED; return s; }
  weaponTier(p) { if (!p.weapon2) return null; if (p.weapon2.evolved) return Loot.WEAPON_EVOS[p.weapon2.evolved]; const w = Loot.WEAPONS[p.weapon2.type]; return w && w.tiers[p.weapon2.level - 1]; }
  effFireDelay(p) { let base = this.effWeapon(p).fireRate; const tr = this.weaponTier(p); if (tr) base *= tr.rate; let rate = base * p.stats.fireRateMult * this.schoolRate(p); if (p.buffs.b_rate) rate *= 1.7; if (p.buffs.i_rage) rate *= 1.4; if (p.buffs.po_rate) rate *= (1 + Pot.EFF.rate * Pot.powMult(p.buys.st_for || 0)); if (p.buffs.killHaste > 0) rate *= (1 + Math.min(0.6, p.killHasteStacks * 0.08)); return 1 / rate; }
  effDamage(p) { let d = (this.effWeapon(p).dmg + p.stats.dmgFlat) * p.stats.dmgMult * this.schoolDmg(p);
    if (p.perk.sangueFreddo && this.effWeapon(p).melee && p.hp / this.effMaxHp(p) < 0.40) d *= 1.25;
    if (p.perk.convergenza > 0 && (this.time - (p.lastShotT || 0)) >= p.perk.convergenza) d *= 3; if (p.buffs.guerrilla > 0) d *= 1.3; if (p.buffs.zeroday > 0) d *= 1.35; if (p.buffs.b_dmg) d *= 1.6; if (p.buffs.po_dmg) d *= (1 + Pot.EFF.dmg * Pot.powMult(p.buys.st_for || 0)); if (p.buffs.i_power) d *= 1.5; if (p.buffs.i_rage) d *= 2.0; if (p.buffs.curse > 0) d *= (C.CURSE_DMG_MULT || 0.6); if (p.buffs.gz_weaken > 0) d *= (C.GAZE_WEAKEN_MULT || 0.7); return d; }
  // v1.66 — moltiplicatori della scuola dell'arma impugnata (1 se l'arma non ne dichiara una).
  schoolDmg(p) { const k = this.effWeapon(p).school; return (k && p.stats.schoolDmg && p.stats.schoolDmg[k]) || 1; }
  schoolRate(p) { const k = this.effWeapon(p).school; return (k && p.stats.schoolRate && p.stats.schoolRate[k]) || 1; }
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
    const w = this.effWeapon(p); if (p.fireCd > 0) return; p.fireCd = this.effFireDelay(p); p.lastShotT = this.time;
    const base = p.aim; let pc = 1 + p.stats.extraProjectiles + (p.buffs.b_quad ? 2 : 0);
    // v1.69 — ventagli periodici delle carte del ladro: contano i TIRI, non il tempo, cosi' il ritmo
    // resta leggibile ("il terzo e' doppio") invece di dipendere dalla cadenza.
    p.shotSeq = (p.shotSeq || 0) + 1;
    if (p.perk.doppiaCocca > 0 && p.shotSeq % p.perk.doppiaCocca === 0) pc += 1;
    if (p.perk.pioggia > 0 && p.shotSeq % p.perk.pioggia === 0) pc = Math.max(pc, 5);
    let dmg = this.effDamage(p); let crit = MU.chance(p.stats.critChance);
    if (crit) dmg *= p.stats.critMult; dmg = Math.round(dmg);
    // v1.66 — il GUERRIERO non spara: descrive un semicerchio davanti a se'. Raggio e apertura vengono
    // dall'arma (arcRadius/arcHalf), non dall'eroe, perche' spada corta, spada lunga e alabarda dovranno
    // dare tre archi diversi allo stesso personaggio.
    if (w.melee) { this._meleeSwing(p, w, dmg, crit); return; }
    // colpo esplosivo periodico (boon)
    // v1.79.2 — CONCENTRAZIONE: mezzo secondo fermo e il colpo dopo pesa di piu'. Si consuma: e' un colpo
    // piazzato, non uno stato permanente di chi gioca fermo.
    if (p.boon.concentra > 0 && (p.fermoT || 0) >= 0.5) { dmg = Math.round(dmg * (1 + p.boon.concentra)); p.fermoT = 0; this.events.push({ t: 'concentra', x: p.x, y: p.y, who: p.id }); }
    // v1.79.2 — PUNTO VITALE (ogni N colpi) e PASSO D'OMBRA (il primo colpo dopo lo scatto): critici
    // garantiti. Si contano qui, dove il colpo parte davvero.
    if (p.boon.critOgni > 0) { p.critShot = (p.critShot || 0) + 1; if (p.critShot % p.boon.critOgni === 0) crit = true; }
    if (p.boon.ombraDash > 0 && (p.ombraT || 0) > 0) { crit = true; p.ombraT = 0; }
    let explosive = false; if (p.boon.explodeEvery > 0) { p.boonShot++; if (p.boonShot % p.boon.explodeEvery === 0) explosive = true; }
    // v1.79 — IMPLOSIONE (scaglione divino del mago): una bolla ogni cinque non esplode verso fuori ma
    // risucchia verso dentro. Conta i colpi per conto suo, se no due abilita' si contenderebbero lo
    // stesso contatore e il ritmo di entrambe cambierebbe a seconda di quale hai preso.
    let implode = false; if (p.boon.implodeEvery > 0) { p.impShot = (p.impShot || 0) + 1; if (p.impShot % p.boon.implodeEvery === 0) implode = true; }
    const mkBullet = (a, ov = {}) => this.bullets.push(Object.assign({ eid: NEXT++, hostile: false, owner: p.id, x: p.x, y: p.y, vx: Math.cos(a) * (ov.speed || w.bulletSpeed) * (1 + (p.perk.bulletSpeed || 0)), vy: Math.sin(a) * (ov.speed || w.bulletSpeed) * (1 + (p.perk.bulletSpeed || 0)), r: ((ov.r || w.r || C.BULLET_RADIUS) * (1 + (p.perk.bollaDensa || 0))) + p.boon.bulletSize, dmg: ov.dmg != null ? ov.dmg : dmg, color: crit ? '#fff36b' : (ov.color || w.projColor), life: (ov.range || w.range) / (ov.speed || w.bulletSpeed), crit, pierce: (ov.pierce || 0) + p.stats.pierce + p.boon.pierce, hitSet: ((ov.pierce || 0) + p.stats.pierce + p.boon.pierce) > 0 ? new Set() : null, knock: (ov.knock != null ? ov.knock : w.knockback) * p.stats.knockMult, bounce: (ov.bounce || 0) + p.boon.bounce, bleed: 0, bubble: !!w.bubble, arrow: !!w.arrow, explosive: explosive || !!p.perk.detona, boomR: p.perk.detona ? p.perk.detonaR : 0, boomQ: p.perk.detona ? p.perk.detonaQ : 0, chain: p.boon.chain + (p.perk.catena || 0), chainFull: p.perk.catenaPiena ? 1 : 0, poison: p.boon.poison ? Math.max(1, Math.round((ov.dmg != null ? ov.dmg : dmg) * (p.boon.poisonQuota || 0.05))) : 0, slow: p.boon.slow, homing: p.boon.homing, implode, frattura: p.boon.frattura }, {}));
    const volley = () => {
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
      for (let i = 0; i < pc; i++) { const sb = w.spread + (pc > 1 ? 0.09 * (i - (pc - 1) / 2) : 0); const a = base + sb + MU.rand(-w.spread, w.spread); mkBullet(a); }
    }
    };
    volley();
    // v1.51 — ECO ARCANA: una quota dei colpi parte una seconda volta, gratis (stesso danno, stessa mira).
    if (p.boon.echo > 0 && MU.chance(0.20 * p.boon.echo)) { volley(); this.events.push({ t: 'echo', x: p.x, y: p.y, a: base }); }
    this.events.push({ t: 'shot', x: p.x, y: p.y, a: base, who: p.id, hero: p.heroId, wt: p.weapon2 ? (p.weapon2.evolved || p.weapon2.type) : null });
  }
  // v1.66 — FENDENTE. Colpisce i mostri il cui centro cade nel settore [aim ± arcHalf] entro arcRadius,
  // con la tolleranza del raggio del bersaglio: un mostro grosso viene preso anche se il centro e' appena
  // fuori dall'arco, altrimenti i tank sembrano schivare la spada restando fermi. Un solo colpo per bersaglio
  // per fendente. L'evento porta raggio e apertura perche' il client disegni ESATTAMENTE l'area che ferisce.
  _meleeSwing(p, w, dmg, crit) {
    p.swingCount = (p.swingCount || 0) + 1;
    const rad = w.arcRadius || 100;
    // v1.69 — l'apertura dell'arco arriva dall'arma, la allarga il Maestro d'Armi, e ogni N fendenti
    // il Colpo Rotante la porta a giro pieno.
    let half = (w.arcHalf || 0.95) * (1 + (p.perk.arcoPiu || 0));
    const giro = p.perk.rotante > 0 && (p.swingCount % p.perk.rotante === 0);
    if (giro) half = Math.PI;
    if (p.perk.parata) p.buffs.parry = 0.6;
    dmg = Math.round(dmg * (1 + (p.furiaBonus || 0)));   // FURIA: il bonus maturato col fendente precedente
    const hit = [];
    for (const m of this.monsters) {
      if (m.dead) continue;
      // NOTA: il raggio del mostro e' m.radius, NON m.r (m.r non esiste). Scriverlo sbagliato non da'
      // errore: 'd > rad + undefined' e 'diff > half + NaN' sono entrambi FALSE, quindi il fendente
      // colpiva TUTTI i mostri della mappa, anche alle spalle. Se ne e' accorto il test del bersaglio dietro.
      const mr = m.radius || 12;
      const d = MU.dist(p.x, p.y, m.x, m.y); if (d > rad + mr) continue;
      const a = Math.atan2(m.y - p.y, m.x - p.x);
      const diff = Math.abs(((a - p.aim + Math.PI) % (2 * Math.PI)) - Math.PI);
      const tol = d > 1 ? Math.atan2(mr * 0.8, d) : Math.PI;
      if (diff > half + tol) continue;
      hit.push({ m, d });
    }
    // MISURATO: senza limiti, il fendente che colpisce TUTTI a piena potenza faceva 300-640 uccisioni per
    // partita contro le ~50 a testa dei tiratori, e la squadra si autodistruggeva perche' le ondate
    // avanzavano al doppio della velocita'. Il colpo resta ad area, ma con la regola classica: il bersaglio
    // piu' vicino incassa tutto, gli altri il 55%, e non piu' di MELEE_MAX_TARGETS per fendente.
    hit.sort((x, y) => x.d - y.d);
    const cap = (C.MELEE_MAX_TARGETS || 5) + (p.perk.sfondamento ? 2 : 0);
    const splash = p.perk.sfondamento ? 0.70 : (C.MELEE_SPLASH || 0.55);
    // v1.79.2 — COLPO AMPIO: piu' nemici prende lo stesso fendente, piu' quel fendente fa male. Il bonus
    // si calcola PRIMA di distribuire il danno, se no il primo bersaglio non ne beneficerebbe.
    if (p.boon.ampio > 0) { const extra = Math.min(3, Math.max(0, Math.min(hit.length, cap) - 1)); dmg = Math.round(dmg * (1 + p.boon.ampio * extra)); }
    for (let i = 0; i < hit.length && i < cap; i++) {
      const m = hit[i].m, d = i === 0 ? dmg : Math.max(1, Math.round(dmg * splash));
      const kn = (w.knockback || 0) * p.stats.knockMult;
      this.damageMonster(m, d, p.x, p.y, kn, p, { crit: crit && i === 0, poison: p.boon.poison ? Math.max(1, Math.round(d * (p.boon.poisonQuota || 0.05))) : 0, slow: p.boon.slow });
      if (p.boon.chain > 0) this._chain(m, p, p.boon.chain, p.perk.catenaPiena ? d : Math.round(d * 0.25));
    }
    const colpiti = Math.min(hit.length, cap);
    if (p.perk.furia > 0) p.furiaBonus = Math.min(0.40, colpiti * p.perk.furia);   // matura per il PROSSIMO colpo
    this.events.push({ t: 'swing', x: p.x, y: p.y, a: p.aim, rad, half, crit, hits: colpiti, who: p.id, giro: giro ? 1 : 0 });
  }
  useDash(p) {
    if (p.cdDash > 0 || p.buffs.dash > 0) return;
    p.cdDash = C.DASH_CD * p.stats.cdrMult;
    p.buffs.dash = C.DASH_TIME * (1 + (p.perk.dashLong || 0));   // Passo Felpato
    p.buffs.iframe = C.DASH_IFRAME;
    const n = MU.norm(p.input.mx, p.input.my);
    p.dashDir = (n.x || n.y) ? n : { x: Math.cos(p.aim), y: Math.sin(p.aim) };
    // v1.69 — PASSO DEL VUOTO: lo scatto del mago diventa un salto, non una corsa. Si atterra al primo
    // punto libero andando a ritroso: senza il controllo si finirebbe dentro la roccia.
    if (p.perk.passoVuoto) {
      const D = 190;
      for (let k = 0; k <= 8; k++) {
        const d = D * (1 - k / 8), tx = p.x + p.dashDir.x * d, ty = p.y + p.dashDir.y * d;
        if (d < 20 || !this.isWallAt(tx, ty)) { this.events.push({ t: 'blink', x: p.x, y: p.y, x2: tx, y2: ty }); p.x = tx; p.y = ty; break; }
      }
      p.buffs.dash = 0.12;
    }
    if (p.perk.ombra > 0) p.buffs.hidden = p.perk.ombra;         // OMBRA: i nemici smettono di vederti
    if (p.boon.ombraDash > 0) p.ombraT = p.boon.ombraDash;       // v1.79.2 — PASSO D'OMBRA: il colpo dopo lo scatto e' critico
    this.events.push({ t: 'ability', k: 'dash', x: p.x, y: p.y });
  }

  // v1.66 — le abilita' Q/E sono SOSPESE: erano cucite sui tre eroi rimossi (enforcer/recon/glitch) e vanno
  // ripensate sulle nuove classi, dove i poteri arriveranno dall'evoluzione dopo il boss e non da uno slot
  // fisso. Le funzioni restano come stub perche' input, rete e HUD non abbiano bisogno di rami condizionali.
  // ===== v1.71 — LA CINTURA =====
  // Bere e' istantaneo: nessuna finestra, nessuna animazione bloccante, il personaggio continua a muoversi
  // e sparare. Cio' che regola l'abuso e' il COOLDOWN CONDIVISO fra i tre slot, ridotto dalla Destrezza.
  usePotion(p, slot) {
    if (!p || p.dead || p.down) return false;
    if (p.potCd > 0) return false;
    const s = p.belt[slot]; if (!s || s.n <= 0) return false;
    const it = Pot.BY_ID[s.id]; if (!it) return false;
    s.n--;
    if (it.kind === 'heal') {
      const mx = this.effMaxHp(p);
      const cura = Math.round(mx * it.heal * Pot.healMult(p.buys.st_cos || 0));
      p.hp = Math.min(mx, p.hp + cura);
      this.events.push({ t: 'potion', x: p.x, y: p.y, who: p.id, id: it.id, name: it.name, color: it.color, icon: it.icon, heal: cura });
    } else {
      // ASSEGNA, non somma: bere la seconda Furia fa ripartire il timer, non raddoppia l'effetto.
      p.buffs[it.buff] = it.dur * Pot.durMult(p.buys.st_int || 0);
      this.events.push({ t: 'potion', x: p.x, y: p.y, who: p.id, id: it.id, name: it.name, color: it.color, icon: it.icon });
    }
    p.potCdMax = Pot.COOLDOWN * Pot.cdMult(p.buys.st_des || 0);
    p.potCd = p.potCdMax;
    return true;
  }
  // Il banco. Come per il fabbro, si manda l'intero catalogo con dentro lo stato della cintura: il client
  // non ricalcola nulla, disegna quello che riceve.
  offerPotions(p, near) {
    const belt = p.belt.map(s => s ? { id: s.id, n: s.n } : null);
    const list = Pot.POTIONS.map(it => ({ id: it.id, name: it.name, icon: it.icon, color: it.color, cost: it.cost,
      desc: it.desc, dur: it.durTxt, slot: p.belt.findIndex(s => s && s.id === it.id) }));
    this.sendTo(p.id, { t: C.MSG.OFFER_POTION, coins: p.coins, belt, list, max: Pot.MAX_CHARGES, near: near ? 1 : 0 });
  }
  _alBanco(p) {
    return this.phase === C.PHASE_MARKET && !!this.herbalist &&
      MU.dist(p.x, p.y, this.herbalist.x, this.herbalist.y) <= C.MARKET_MERCH_RANGE + 12;
  }
  // Assegnare un TIPO a uno slot. Le cariche rimaste del tipo vecchio tornano a meta' prezzo: cambiare
  // idea deve costare, ma non azzerare la spesa (regola scelta da Paolo).
  pickPotion(pid, slot, potId) {
    const p = this.players.get(pid); if (!p || p.dead) return;
    if (!this._alBanco(p)) return;
    slot = slot | 0; if (slot < 0 || slot >= Pot.SLOTS) return;
    const it = Pot.BY_ID[potId]; if (!it) return;
    const cur = p.belt[slot];
    if (cur && cur.id === potId) return;                 // gia' quello: niente da fare
    if (Pot.altrove(p.belt, slot, potId)) return;        // un tipo per slot
    let rimborso = 0;
    if (cur && cur.n > 0) { rimborso = Pot.refundFor(cur.id, cur.n); p.coins += rimborso; }
    p.belt[slot] = { id: potId, n: 0 };
    this.offerPotions(p, 1);
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'potion_set', x: p.x, y: p.y, slot, id: it.id, name: it.name, color: it.color, icon: it.icon, back: rimborso } });
  }
  buyPotion(pid, slot) {
    const p = this.players.get(pid); if (!p || p.dead) return;
    if (!this._alBanco(p)) return;
    slot = slot | 0; const s = p.belt[slot]; if (!s) return;
    if (s.n >= Pot.MAX_CHARGES) return;
    const it = Pot.BY_ID[s.id]; if (!it || p.coins < it.cost) return;
    p.coins -= it.cost; s.n++;
    this.offerPotions(p, 1);
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'potion_buy', x: p.x, y: p.y, slot, id: it.id, name: it.name, color: it.color, icon: it.icon, n: s.n } });
  }
  // ===== v1.72 — IL BANDITORE: l'usato e le taglie =====
  // Le tre offerte si generano UNA VOLTA e restano quelle finche' non ne accetti una: rigenerarle a ogni
  // avvicinamento trasformerebbe la scelta in una slot machine da ripescare finche' non esce quella comoda.
  _offerteTaglie(p) {
    if (p.bounty || p.bountyOffer) return p.bountyOffer;
    const pool = Waves.poolForWave(this.wave).map(x => ({ id: x.id, nome: (Mon.MONSTERS[x.id] || {}).name || x.id }));
    p.bountyOffer = Bnt.offerte(this.wave, pool);
    return p.bountyOffer;
  }
  // Il magazzino: tutto cio' che possiedi della TUA classe, con dentro cosa hai addosso e quanto rende.
  _magazzino(p) {
    const out = [];
    for (const id of Object.keys(p.owned)) {
      const it = Gear.BY_ID[id]; if (!it || it.hero !== p.heroId) continue;
      out.push({ id: it.id, name: it.name, color: it.color, slot: it.slot, slotName: Gear.SLOT_NAME[it.slot] || it.slot,
        icon: Gear.SLOT_ICON[it.slot] || '⚔️', rank: it.rank, cost: it.cost,
        pay: Math.floor(it.cost * C.SELL_BACK), worn: p.gear[it.slot] === it.id ? 1 : 0 });
    }
    out.sort((a, b) => a.slot === b.slot ? a.rank - b.rank : (a.slot < b.slot ? -1 : 1));
    return out;
  }
  offerBandit(p, near) {
    const b = p.bounty;
    this.sendTo(p.id, { t: C.MSG.OFFER_BANDIT, coins: p.coins, near: near ? 1 : 0,
      bounty: b ? { k: b.k, n: b.n, have: b.have, pay: b.pay, nome: b.nome, icon: b.icon, color: b.color, testo: b.testo } : null,
      offers: b ? [] : this._offerteTaglie(p).map(o => ({ k: o.k, n: o.n, pay: o.pay, nome: o.nome, icon: o.icon, color: o.color, testo: o.testo })),
      stock: this._magazzino(p) });
  }
  _alBanditore(p) {
    return this.phase === C.PHASE_MARKET && !!this.bandit &&
      MU.dist(p.x, p.y, this.bandit.x, this.bandit.y) <= C.MARKET_MERCH_RANGE + 12;
  }
  takeBounty(pid, i) {
    const p = this.players.get(pid); if (!p || p.dead) return;
    if (!this._alBanditore(p) || p.bounty) return;
    const off = this._offerteTaglie(p); const scelta = off && off[i | 0]; if (!scelta) return;
    p.bounty = scelta; p.bountyOffer = null;
    this.offerBandit(p, 1);
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'bounty_take', x: p.x, y: p.y, nome: scelta.nome, testo: scelta.testo, color: scelta.color, icon: scelta.icon } });
  }
  // Vendere: solo cio' che NON hai addosso e che e' costato qualcosa. L'oggetto di partenza vale zero e
  // toglierlo dal magazzino lascerebbe uno slot senza fondo a cui tornare.
  sellGear(pid, itemId) {
    const p = this.players.get(pid); if (!p || p.dead) return;
    if (!this._alBanditore(p)) return;
    const it = Gear.BY_ID[itemId]; if (!it || !p.owned[itemId]) return;
    if (it.hero !== p.heroId || !it.cost) return;
    if (p.gear[it.slot] === itemId) return;                 // quello che hai addosso non si vende
    const pay = Math.floor(it.cost * C.SELL_BACK);
    delete p.owned[itemId]; p.coins += pay;
    this.offerBandit(p, 1);
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'gear_sold', x: p.x, y: p.y, id: itemId, name: it.name, color: it.color, pay } });
  }
  // Il contatore. Un tipo che nessuno incrementa resta a zero per sempre: ogni tipo di bounties.js ha una
  // chiamata a questo metodo da qualche parte, e il test lo verifica.
  bountyTick(p, kind, quanti, extra) {
    const b = p && p.bounty; if (!b || b.k !== kind) return;
    if (kind === 'specie' && extra !== b.tipo) return;
    if (kind === 'combo') b.have = Math.max(b.have, quanti);   // la combo e' un RECORD, non una somma
    else b.have += quanti;
    if (b.have >= b.n) {
      p.coins += b.pay; p.bounty = null; p.bountyOffer = null;
      this.events.push({ t: 'bounty_done', x: p.x, y: p.y, who: p.id, name: p.name, nome: b.nome, testo: b.testo, pay: b.pay, color: b.color, icon: b.icon });
    }
  }
  // ===== v1.74 — L'OSTESSA =====
  // Si paga a PUNTO VITA, non a forfait: paghi per quello che ti serve. Un prezzo fisso sarebbe un affare
  // quando sei quasi morto e uno spreco quando ti manca poco, e in tutti e due i casi non e' una scelta.
  // Se le monete non bastano si compra quello che si puo': nessuno esce di li' a mani vuote.
  _contoOstessa(p) {
    const mx = this.effMaxHp(p), manca = Math.max(0, Math.round(mx - p.hp));
    const pieno = Math.ceil(manca * C.INN_PER_HP);
    const curabili = Math.min(manca, Math.floor((p.coins || 0) / C.INN_PER_HP));
    return { mx: Math.round(mx), hp: Math.round(p.hp), manca, pieno, curabili, spesa: Math.ceil(curabili * C.INN_PER_HP) };
  }
  offerInn(p, near) {
    const c = this._contoOstessa(p);
    this.sendTo(p.id, { t: C.MSG.OFFER_INN, near: near ? 1 : 0, coins: p.coins || 0,
      hp: c.hp, mx: c.mx, manca: c.manca, pieno: c.pieno, curabili: c.curabili, spesa: c.spesa, perHp: C.INN_PER_HP });
  }
  _dallOstessa(p) {
    return this.phase === C.PHASE_MARKET && !!this.innkeeper &&
      MU.dist(p.x, p.y, this.innkeeper.x, this.innkeeper.y) <= C.MARKET_MERCH_RANGE + 12;
  }
  restAtInn(pid) {
    const p = this.players.get(pid); if (!p || p.dead) return;
    if (!this._dallOstessa(p)) return;
    const c = this._contoOstessa(p);
    if (c.manca <= 0 || c.curabili <= 0) return;
    p.coins -= c.spesa; p.hp = Math.min(this.effMaxHp(p), p.hp + c.curabili);
    // v1.74 — i PV comprati cancellano anche il debito: quello e' cio' che il ricalcolo deve ancora
    // restituire, e restituirlo dopo che hai gia' pagato ti regalerebbe vita.
    p.hpDebt = Math.max(0, (p.hpDebt || 0) - c.curabili);
    this.offerInn(p, 1);
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'rest', x: p.x, y: p.y, who: p.id, hp: c.curabili, spesa: c.spesa, pieno: c.curabili >= c.manca ? 1 : 0 } });
  }
  // v1.79 — LA CARTOMANTE E' CHIUSA. La struttura resta nel villaggio — porta, interno, insegna, e la
  // si puo' avvicinare — ma non offre piu' niente: con quattro abilita' passive in tutta la run, tutte
  // sempre accese, non c'e' piu' niente da accendere o spegnere. Verra' ridisegnata. Il pannello non si
  // apre nemmeno: `C.CARTOMANTE_ATTIVA` a true riaccende tutto com'era.
  offerSeer(p, near) {
    if (!C.CARTOMANTE_ATTIVA) { if (near) this.sendTo(p.id, { t: C.MSG.EVENT, ev: { t: 'seer_chiusa' } }); return; }
    const carte = [];
    for (const id in p.boonsOwned) {
      const b = Loot.BOON_BY_ID[id]; const n = p.boonsOwned[id]; if (!b || n <= 0) continue;
      carte.push({ id, name: b.name, icon: b.icon, rarity: b.rarity, n, on: p.cardOn[id] ? 1 : 0,
        desc: b.desc.replace('{v}', b.v ? b.v(p) : '') });
    }
    const syn = [];
    for (const id in (p.synActive || {})) { const sy = Loot.SYNERGY_BY_ID[id]; if (sy) syn.push({ id, name: sy.name, icon: sy.icon, desc: sy.desc }); }
    this.sendTo(p.id, { t: C.MSG.OFFER_SEER, near: near ? 1 : 0, cards: carte, syn, max: C.MAX_CARDS, active: this._carteAccese(p) });
  }
  _dallaCartomante(p) {
    return this.phase === C.PHASE_MARKET && !!this.seer &&
      MU.dist(p.x, p.y, this.seer.x, this.seer.y) <= C.MARKET_MERCH_RANGE + 12;
  }
  // Accendere e spegnere. Spegnere e' sempre concesso; accendere solo se c'e' posto — il limite vive qui,
  // non nel client, perche' il client puo' mentire.
  toggleCard(pid, cardId) {
    const p = this.players.get(pid); if (!p || p.dead) return;
    if (!C.CARTOMANTE_ATTIVA) return;   // v1.79 — chiusa: nemmeno un messaggio costruito a mano la riapre
    if (!this._dallaCartomante(p)) return;
    if (!(p.boonsOwned[cardId] > 0)) return;
    const era = !!p.cardOn[cardId];
    if (era) delete p.cardOn[cardId];
    else { if (this._carteAccese(p) >= C.MAX_CARDS) return; p.cardOn[cardId] = 1; }
    this._recomputeBoons(p);
    const b = Loot.BOON_BY_ID[cardId];
    this.offerSeer(p, 1); this.sendBoons(p);
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'card_toggle', x: p.x, y: p.y, id: cardId, name: b ? b.name : cardId, icon: b ? b.icon : '', on: era ? 0 : 1 } });
  }
  useQ(p) { /* nessuna abilita' in v1.66 */ }
  useE(p) { /* nessuna abilita' in v1.66 */ }

  damageMonster(m, dmg, sx, sy, kn, src, opts = {}) {
    if (m.dead) return; if (m.shielded > 0) { this.events.push({ t: 'block', x: m.x, y: m.y }); return; }
    let d = dmg;
    // v1.69 — COLPO ALLE SPALLE: conta da dove arriva il colpo rispetto a dove GUARDA il mostro.
    if (src && src.perk && src.perk.spalle > 0 && sx !== undefined) {
      const ang = Math.atan2(sy - m.y, sx - m.x);
      if (Math.abs(((ang - (m.facing || 0) + Math.PI) % (2 * Math.PI)) - Math.PI) > 1.9) {
        d *= (1 + src.perk.spalle);
        if (src.perk.spalleCrit) opts = Object.assign({}, opts, { crit: true });
      }
    } if (m.def.blockFront && sx !== undefined) { const ang = Math.atan2(sy - m.y, sx - m.x); let diff = Math.abs(((ang - m.facing + Math.PI) % (2 * Math.PI)) - Math.PI); if (diff < 1.0) d *= (1 - m.def.blockFront); }
    // v1.51 — PIEDE DI PORCO: bonus contro i bersagli ancora integri (apre bene i tank).
    if (src && src.boon) {
      if (src.boon.crowbar > 0 && m.hp >= m.maxHp * 0.9) d *= (1 + 0.40 * src.boon.crowbar);
      // v1.51 — TIRO LUNGO: premia il combattimento a distanza (fino a +22% per carica a piena gittata).
      if (src.boon.longshot > 0) d *= 1 + Math.min(1, MU.dist(src.x, src.y, m.x, m.y) / 700) * 0.22 * src.boon.longshot;
    }
    d = Math.max(1, Math.round(d)); m.hp -= d; m.hitFlash = 0.1;
    // v1.51 — COLPO DI GRAZIA: esecuzione sotto soglia. Mai sui boss, altrimenti banalizza le ondate 5/10/15/20.
    if (m.hp > 0 && !m.boss && src && src.boon && src.boon.execute > 0) {
      const thr = 0.08 + 0.06 * src.boon.execute + (src.boon.executeBonus || 0);   // v1.79 — con execute 2: 20%
      if (m.hp <= m.maxHp * thr) { m.hp = 0; this.events.push({ t: 'execute', x: m.x, y: m.y }); }
    }
    if (kn && !m.boss) { const n = MU.norm(m.x - sx, m.y - sy); this.moveCircle(m, n.x * kn * 0.2, n.y * kn * 0.2); }
    if (opts.stun) m.stun = Math.max(m.stun || 0, opts.stun);
    if (opts.slow) m.slowT = Math.max(m.slowT || 0, 1.5);   // v1.79 — Tocco Gelido: 50% per 1,5s
    // v1.79.2 — LAMA SPORCA: un critico apre un'emorragia che vale il 20% del colpo, spalmato su 3s.
    // Non si somma a se stessa: si rinnova, se no bastava sparare veloce per moltiplicarla.
    if (opts.crit && src && src.boon && src.boon.bleedCrit > 0) {
      m.bleed = Math.max(m.bleed || 0, Math.max(1, Math.round(d * src.boon.bleedCrit / 6)));
      m.bleedT = 3; m.bleedSrc = src.id;
    }
    // v1.79 — IL VELENO NON SI SOMMA PIU' A OGNI COLPO. Sommandolo, la stessa abilita' rendeva il doppio
    // in mano al ladro (3 colpi al secondo) rispetto al mago (1,5): non era una scelta di build, era la
    // cadenza dell arma. Adesso e' una forza PER BERSAGLIO, che il colpo rinnova senza accumulare.
    // v1.79.2 — `opts.poison` non e' piu' una forza ma il DANNO AL SECONDO gia' calcolato dal colpo.
    if (opts.poison) { m.poison = Math.max(m.poison || 0, opts.poison); m.poisonT = 3; m.poisonSrc = src ? src.id : null; }
    if (src) { src.damageDealt += d; if (src.stats.lifesteal > 0) src.hp = Math.min(this.effMaxHp(src), src.hp + d * src.stats.lifesteal); }
    // hit-stop feedback per crit / colpi grossi
    if (opts.crit) this.events.push({ t: 'hitstop', d: 0.05 });
    this.events.push({ t: 'mhit', x: m.x, y: m.y, d, crit: !!opts.crit });
    if (m.hp <= 0) this.killMonster(m, src);
  }
  // catena di fulmini (boon chain)
  // v1.69 — `pieno` e' il danno da usare al posto di quello ridotto: e' cio' che distingue la Catena
  // Nera dello Stregone (rimbalzo a danno pieno) dal boon Catena di Fulmini (rimbalzo di striscio).
  _chain(m, src, jumps, pieno) {
    if (!src || jumps <= 0) return;
    let best = null, bd = 220 * 220;
    for (const o of this.monsters) { if (o === m || o.dead) continue; const dd = MU.dist2(m.x, m.y, o.x, o.y); if (dd < bd) { bd = dd; best = o; } }
    if (best) { const dmg = pieno > 0 ? pieno : (6 + 4 * (src.boon.chain || 0)); this.events.push({ t: 'chain', x1: m.x, y1: m.y, x2: best.x, y2: best.y }); this.damageMonster(best, dmg, m.x, m.y, 0, src, src.boon.frostChain ? { slow: true } : {}); if (jumps > 1) this._chain(best, src, jumps - 1, pieno); }
  }
  // v1.58 — tetto di presenze per tipo (def.maxAlive): serve per i nemici che in gruppo diventano
  // insopportabili (il Beholder debilita, otto Beholder ti spengono). Se il tetto e' pieno si ripiega
  // sullo sciame base invece di saltare lo spawn, cosi' il conteggio dell'ondata resta quello previsto.
  _capType(typeId) {
    const def = Mon.MONSTERS[typeId]; if (!def || !def.maxAlive) return typeId;
    let alive = 0; for (const m of this.monsters) if (!m.dead && m.type === typeId) alive++;
    return alive >= def.maxAlive ? 'skeleton' : typeId;
  }
  killMonster(m, src) {
    m.dead = true;
    // v1.58 — DIVISIONE: la Melma alla morte lascia due melme minori (che non si dividono a loro volta).
    // v1.64 — anche la divisione rispetta il tetto: e' l'unico modo perche' "mai piu' di N in campo" sia
    // una promessa vera e non un auspicio. Il mostro che si divide libera comunque il proprio posto.
    // v1.69 — il tetto va contato SUI VIVI e va rispettato anche dalla scissione. Prima bastava che ci
    // fosse un posto libero perche' la Melma ne generasse due: con 29 in campo si finiva a 31, e "mai piu'
    // di 30" tornava a essere un auspicio. La melma che muore libera il proprio posto, quindi non conta.
    if (m.def.splitInto && !m.minion) {
      let vivi = 0; for (const x of this.monsters) if (!x.dead) vivi++;
      const spazio = this.tettoVivi() - vivi;
      const n = Math.max(0, Math.min(m.def.splitCount || 2, spazio));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random(), r = 16 + Math.random() * 14;
        const mm = this.spawnMonster(m.def.splitInto, m.x + Math.cos(a) * r, m.y + Math.sin(a) * r,
          { scaling: this.waveScaling || Waves.scaling(this.wave, this.alivePlayers.length || 1) });
        if (mm) { mm.minion = true; mm.awake = true; }
      }
      if (n > 0) this.events.push({ t: 'split', x: m.x, y: m.y, c: m.def.eye });
    }
    // v1.81 — LA LARVA SCOPPIA. Non un colpo immediato: lascia a terra la stessa zona telegrafata che
    // usano il mago oscuro e il fungo, che detona dopo `ritardo` secondi. L'esplosione e' quindi una cosa
    // che VEDI arrivare e da cui puoi uscire: punisce chi resta incollato al nemico che sta finendo, non
    // chi passava di li'. Le zone fanno male ai giocatori e non ai mostri, quindi niente reazioni a catena.
    if (m.def.esplode) {
      const e = m.def.esplode, rit = e.ritardo || 0.75;
      this.zones.push({ eid: 0, x: m.x, y: m.y, r: e.r || 100, dmg: Math.max(1, Math.round((m.dmg || m.def.dmg) * (e.mul || 2))), t: rit, max: rit, col: m.def.eye, done: false });
      this.events.push({ t: 'zone_tell', x: m.x, y: m.y, r: e.r || 100, delay: rit, c: m.def.eye });
      this.events.push({ t: 'larva_pop', x: m.x, y: m.y, c: m.def.eye });
    }
    this.events.push({ t: 'mkill', x: m.x, y: m.y, id: m.type, f: +(m.facing || 0).toFixed(2), boss: m.boss, elite: m.elite, mega: m.mega });
    if (m.boss || m.elite) this.events.push({ t: 'hitstop', d: m.mega ? 0.16 : (m.boss ? 0.12 : 0.06) });
    if (src) {
      src.kills++;
      if (src.ondata) src.ondata.uccisi++;   // v1.78 — per il riepilogo di fine livello
      src.combo = (src.combo || 0) + 1; src.comboT = C.COMBO_TIME; if (src.combo > (src.comboBest || 0)) src.comboBest = src.combo;
      // v1.72 — le taglie contano qui, dove le uccisioni gia' accadono: caccia grossa, contratto mirato
      // (solo se e' la specie giusta) e teste grosse (solo elite, boss esclusi: hanno gia' la loro ricompensa).
      this.bountyTick(src, 'caccia', 1);
      this.bountyTick(src, 'specie', 1, m.type);
      if (m.elite && !m.boss) this.bountyTick(src, 'elite', 1);
      this.bountyTick(src, 'combo', src.combo);
      if (src.combo >= C.COMBO_MIN && src.combo % 5 === 0) this.events.push({ t: 'combo', x: m.x, y: m.y, n: src.combo, mult: +this.comboMult(src).toFixed(2), who: src.id });
      this._comboReward(src, m);
      if (src.boon.killHaste) { src.killHasteStacks = Math.min(6, (src.killHasteStacks || 0) + 1); src.buffs.killHaste = 3; }
      // v1.51 — PASSO DI DANZA: scatto di velocita' a ogni uccisione (premia chi non si ferma).
      if (src.boon.killStep > 0) { src.killStepStacks = Math.min(2, (src.killStepStacks || 0) + 1); src.buffs.killStep = 3; }
      // v1.51 — DEFLAGRAZIONE CADAVERICA: il cadavere esplode. Il flag _inCorpse impedisce la catena infinita
      // (esplosione -> uccide -> esplode -> ...): solo il primo cadavere della catena deflagra.
      if (src.boon.corpseBlast > 0 && !this._inCorpse) {
        this._inCorpse = true;
        const rad = 90 + 20 * src.boon.corpseBlast, dmgB = Math.round(this.effDamage(src) * (0.5 + 0.2 * src.boon.corpseBlast));
        for (const o of this.monsters) { if (o === m || o.dead) continue; if (MU.dist2(m.x, m.y, o.x, o.y) <= rad * rad) this.damageMonster(o, dmgB, m.x, m.y, 12, src); }
        this.events.push({ t: 'corpse_blast', x: m.x, y: m.y, r: rad });
        this._inCorpse = false;
      }
      if (src.boon.killNova > 0 && MU.chance(0.25 * src.boon.killNova)) { for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; this.bullets.push({ eid: NEXT++, hostile: false, owner: src.id, x: m.x, y: m.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 6, dmg: Math.round(this.effDamage(src) * 0.7), color: '#ffd24a', life: 0.45, pierce: 2, knock: 30 }); } this.events.push({ t: 'nova', x: m.x, y: m.y }); }
    }
    const comboMul = src ? this.comboMult(src) : 1; const xpMul = src ? (src.stats.xpMult || 1) : 1;
    const xpVal = Math.round(m.xp * comboMul * xpMul); const orbs = m.boss ? 8 : (m.elite ? 3 : 1);
    for (let i = 0; i < orbs; i++) { const a = Math.random() * Math.PI * 2, r = m.boss ? MU.rand(10, 60) : MU.rand(4, 18); this.groundXp.push({ eid: NEXT++, x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, v: Math.max(1, Math.round(xpVal / orbs)), t: 30 }); }
    // MONETE (v1.8): valore in base al tipo di nemico, distribuito in tagli diversi.
    const coinVal = Math.max(1, Math.round((m.def.xp || 4) * 0.6 * (m.boss ? 6 : m.elite ? 2.2 : 1)));
    const coinPieces = Loot.coinsFor(coinVal, C.COINS);
    for (const cp of coinPieces) { const a = Math.random() * Math.PI * 2, r = m.boss ? MU.rand(12, 66) : MU.rand(4, 20); this.groundCoins.push({ eid: NEXT++, x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, v: cp.v, cid: cp.id, t: 30 }); }
    // v1.77 — I NEMICI NON LASCIANO PIU' OGGETTI NE' POZIONI. Nessuno: ne' i comuni, ne' gli elite,
    // ne' i boss, ne' la cassa-mima. Una Pozione di Salute che cade dal nulla mentre combatti toglie
    // il mestiere all'Ostessa (che si fa pagare per rimetterti in piedi) e all'Erborista (che si fa
    // pagare per la stessa cosa in boccetta). Se la cura arriva gratis dai mostri, quei due sono
    // decorazione. Le pozioni forti che cadevano di qui sono passate all'Erborista, a caro prezzo.
    // Restano: esperienza, monete, e quello che c'e' dentro le CASSE — che non sono nemici.
    if (m.boss) this.bossAlive = false;
  }

  applyItem(p, it) {
    if (it.kind === 'heal') { p.hp = Math.min(this.effMaxHp(p), p.hp + Math.round(this.effMaxHp(p) * it.heal)); }
    else if (it.kind === 'life') { p.lives += 1; }
    else if (it.kind === 'buff') { p.buffs[it.buff] = it.dur; }
    // v1.70 — anche raccogliere un potenziamento sulla mappa da' esperienza
    this.xpCondivisa(C.XP_OGGETTO + this.wave * C.XP_OGGETTO_ONDATA, 'oggetto');
    this.events.push({ t: 'item_pickup', x: p.x, y: p.y, id: it.id, name: it.name, icon: it.icon, color: it.color, who: p.id, name2: p.name });
  }
  _giveWeapon(p, wt) { if (p.weapon2 && p.weapon2.type === wt && !p.weapon2.evolved) p.weapon2.level = Math.min(3, p.weapon2.level + 1); else if (!p.weapon2 || p.weapon2.type !== wt) p.weapon2 = { type: wt, level: 1, evolved: null }; this._checkEvo(p); }
  _checkEvo(p) { if (!p.weapon2 || p.weapon2.evolved) return; const w = Loot.WEAPONS[p.weapon2.type]; if (!w || !w.evo) return; if (p.weapon2.level >= 3 && (p.buys[w.evo.stat] || 0) >= w.evo.need) { p.weapon2.evolved = w.evo.id; this.events.push({ t: 'weapon_evo', x: p.x, y: p.y, name: w.evo.name, color: w.evo.color, who: p.id, name2: p.name }); } }

  // ===== v1.69 — LIVELLI, PUNTI, RANGHI ========================================================
  // La XP raccolta entra da qui e da nessun'altra parte: e' l'unico punto in cui si sale di livello,
  // cosi' non esiste il caso "ho aggiunto XP e il livello non e' cambiato".
  // v1.70 — NESSUN TETTO ai livelli: si sale finche' si accumula esperienza. E l'esperienza non arriva
  // piu' solo dai nemici: casse aperte e oggetti raccolti sulla mappa ne danno, e altre fonti si
  // agganciano qui. `fonte` serve solo a raccontarlo a schermo, non cambia il conto.
  // v1.79 — L'ESPERIENZA E' CONDIVISA. Ogni uccisione vale per TUTTI i giocatori vivi, non per chi
  // arriva primo sulla sfera: la crescita e' del gruppo, la corsa al bottino non e' un gioco.
  // Il fattore `XP_GRUPPO` esiste perche' le ondate crescono col gruppo MENO che proporzionalmente
  // (misurato: un trio genera solo il +27% di XP totale rispetto a un solista). Senza correzione un
  // gruppo arriverebbe al tetto con ondate d'anticipo, e la curva sarebbe giusta per una taglia sola.
  xpCondivisa(v, fonte) {
    if (v <= 0) return;
    const vivi = [];
    for (const p of this.players.values()) if (p.connected && !p.dead) vivi.push(p);
    if (!vivi.length) return;
    const k = C.XP_GRUPPO[Math.min(C.XP_GRUPPO.length - 1, vivi.length)] || 1;
    const q = Math.max(1, Math.round(v * k));
    for (const p of vivi) this.addXp(p, q, fonte);
  }
  addXp(p, v, fonte) {
    if (!p || v <= 0) return;
    // v1.79 — TETTO AL 15: l'esperienza raccolta dopo non serve piu' a niente, come in un gioco di
    // ruolo. Non si accumula nemmeno nel serbatoio, cosi' la barra resta piena e onesta.
    if (p.level >= Lv.MAX_LEVEL) return;
    p.xpPool += v;
    if (p.ondata) p.ondata.xp += v;
    const nuovo = Lv.levelForXp(p.xpPool);
    while (p.level < nuovo) {
      p.level++; p.points += Lv.POINTS_PER_LEVEL;
      if (p.ondata) p.ondata.livelli++;
      // v1.79 — le abilita' passive si scelgono SOLO agli scaglioni: 3, 6, 9 e 12. La scelta non si apre
      // qui: in mezzo alla battaglia nessuno legge quattro abilita', e in cooperativa non si puo' mettere
      // in pausa il mondo per uno solo. Resta in coda e si paga nel menu di fine ondata.
      const tier = Lv.tierForLevel(p.level);
      if (tier) { p.scaglioniDovuti = p.scaglioniDovuti || []; p.scaglioniDovuti.push(tier); }
      const r = Lv.rankForLevel(p.level);
      if (r > Lv.rankForLevel(p.level - 1)) this._rankUp(p, r);
      // l'evento parte SEMPRE, anche in mezzo alla battaglia: il "LEVEL UP" sopra la testa e il suo
      // jingle sono il momento in cui il giocatore sente di essere cresciuto.
      this.events.push({ t: 'levelup', x: p.x, y: p.y, who: p.id, lv: p.level, name: p.name, rank: Lv.rankName(p.heroId, p.level, p.spec), tier: tier || '', spec: p.level >= Lv.MAX_LEVEL ? 1 : 0 });
    }
    if (fonte) this.events.push({ t: 'xpfonte', x: p.x, y: p.y, who: p.id, v, k: fonte });
  }
  // Salire di rango da' un punto in piu' e mette in coda una SCELTA: tre carte ai ranghi II-IV, il
  // bivio fra due specializzazioni al V. L'offerta e' in coda, non immediata, perche' va presentata
  // nel pannello di fine ondata: in mezzo alla battaglia nessuno legge tre carte.
  // v1.70 — il rango da' il titolo e un punto. Le CARTE generiche sono state tolte: al loro posto
  // arriveranno le abilita' di classe, sbloccate a livelli specifici. `cardsFor` oggi risponde vuoto,
  // quindi l'offerta semplicemente non parte — nessun ramo da aggiungere quando le abilita' ci saranno.
  // v1.79 — il rango da' un punto (non la prima fascia, che e' il titolo di partenza, e non l'ultima,
  // che da' la SPECIALIZZAZIONE). Le carte di rango non esistono: al loro posto ci sono gli scaglioni.
  _rankUp(p, r) {
    p.points += Lv.puntiPerRango(r);
    if (r >= Lv.RANK_SPEC) { p.specOffer = Lv.specsFor(p.heroId).map(x => x.id); p.rankOffer = null; }
    this.events.push({ t: 'rankup', x: p.x, y: p.y, who: p.id, name: p.name, rank: r, title: Lv.rankName(p.heroId, p.level, p.spec), spec: r >= Lv.RANK_SPEC ? 1 : 0 });
  }

  offerRank(p) {
    if (p.specOffer && p.specOffer.length) {
      const specs = p.specOffer.map(id => Lv.SPEC_BY_ID[id]).filter(Boolean)
        .map(x => ({ id: x.id, name: x.name, icon: x.icon, color: x.color, desc: x.desc, abilita: x.abilita }));
      this.sendTo(p.id, { t: C.MSG.OFFER_RANK, spec: 1, rank: 5, title: 'SCEGLI LA TUA STRADA', cards: specs });
      return true;
    }
    if (p.rankOffer && p.rankOffer.length) {
      const r = Lv.rankForLevel(p.level);
      const cards = p.rankOffer.map(id => Lv.CARD_BY_ID[id]).filter(Boolean)
        .map(c => ({ id: c.id, name: c.name, icon: c.icon, desc: c.desc }));
      this.sendTo(p.id, { t: C.MSG.OFFER_RANK, spec: 0, rank: r, title: Lv.rankName(p.heroId, p.level, p.spec).toUpperCase(), cards });
      return true;
    }
    return false;
  }
  pickRank(pid, id) {
    const p = this.players.get(pid); if (!p || this.phase !== C.PHASE_SHOP) return;
    if (p.specOffer && p.specOffer.includes(id)) {
      const sp = Lv.SPEC_BY_ID[id]; if (!sp || sp.hero !== p.heroId) return;
      p.spec = id; p.specOffer = null; sp.apply(p); this._recomputeGear(p);
      this.broadcast({ t: C.MSG.EVENT, ev: { t: 'spec', x: p.x, y: p.y, who: p.id, name: p.name, id, title: sp.name, color: sp.color, icon: sp.icon } });
      this.offerShop(p); return;
    }
    if (p.rankOffer && p.rankOffer.includes(id)) {
      const c = Lv.CARD_BY_ID[id]; if (!c || c.hero !== p.heroId) return;
      if (p.cards.includes(id)) return;                       // una carta non si prende due volte
      p.cards.push(id); p.rankOffer = null; c.apply(p); this._recomputeGear(p);
      this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'card', x: p.x, y: p.y, id, name: c.name, icon: c.icon } });
      this.offerShop(p); return;
    }
  }

  // v1.78 — IL RIEPILOGO DI FINE LIVELLO. Un box piccolo con quello che l'ondata ti ha fruttato: nemici
  // uccisi, XP e monete raccolte, quanto ci hai messo e il premio di velocita' se sei rimasto sotto il
  // tempo obiettivo. E' il momento in cui il giocatore vede il risultato del suo lavoro: senza, l'ondata
  // finisce e non resta niente in mano.
  inviaRiepilogo(p) {
    const o = p.ondata || { uccisi: 0, xp: 0, monete: 0, livelli: 0 };
    this.sendTo(p.id, {
      t: C.MSG.WAVE_STATS, wave: this.wave,
      uccisi: o.uccisi, xp: o.xp, monete: o.monete, livelli: o.livelli,
      durata: +(this.waveDur != null ? this.waveDur : 0).toFixed(1), par: this.parT || 0,
      bonus: this.parPreso && this.parBonus ? this.parBonus : null,
      carte: (p.scaglioniDovuti || []).length,
      livello: p.level, uccisiTot: p.kills, moneteTot: p.coins,
    });
  }
  offerShop(p) {
    // v1.69 — il pannello mostra i PUNTI, non la XP: il prezzo di una statistica non e' piu' un numero a
    // quattro cifre ma "1, 2 o 3 punti", che si legge senza calcolatrice.
    const stats = Loot.XP_STATS.map(s => {
      const lvl = p.buys[s.id] || 0, maxed = lvl >= Loot.STAT_MAX_LEVEL;
      return { id: s.id, name: s.name, icon: s.icon, color: s.color, desc: s.desc, cost: maxed ? 0 : Lv.statPointCost(lvl), lvl, max: Loot.STAT_MAX_LEVEL, maxed };
    });
    const pr = Lv.progress(p.xpPool);
    // v1.79 — la sezione PERSONAGGIO del menu mostra anche l'inventario: arma impugnata, equipaggiamento
    // per slot, cintura delle pozioni, vite e PV. Viaggia con l'offerta delle statistiche perche' e' la
    // stessa schermata: due messaggi per un pannello solo si sarebbero disallineati al primo cambiamento.
    const arma = this.effWeapon(p), tier = this.weaponTier(p);
    const inv = {
      arma: { nome: (tier && tier.name) || arma.name || 'Arma', icona: (Loot.WEAPONS[p.weapon2 && p.weapon2.type] || {}).icon || '⚔️',
              livello: p.weapon2 ? p.weapon2.level : 0, evo: p.weapon2 ? (p.weapon2.evolved || '') : '', scuola: arma.school || '' },
      gear: (Gear.slotsFor(p.heroId) || []).map(sl => {
        const it = Gear.BY_ID[p.gear && p.gear[sl]];
        return { slot: sl, slotName: Gear.SLOT_NAME[sl] || sl, icona: Gear.SLOT_ICON[sl] || '▫',
                 nome: it ? it.name : '—', colore: it ? it.color : '#6f7890', rango: it ? it.rank : 0, desc: it ? it.desc : '' };
      }),
      belt: (p.belt || []).map(sl => {
        if (!sl) return null;
        const d = Pot.BY_ID[sl.id];
        return { id: sl.id, nome: d ? d.name : sl.id, icona: d ? d.icon : '🧪', n: sl.n || 0, max: Pot.MAX_CHARGES };
      }),
      vite: p.lives, hp: Math.round(p.hp), hpMax: this.effMaxHp(p),
      monete: p.coins, uccisi: p.kills, combo: p.comboBest || 0,
    };
    this.sendTo(p.id, { t: C.MSG.OFFER_SHOP, points: p.points, xp: p.xpPool, level: p.level, max: Lv.MAX_LEVEL, cap: pr.cap ? 1 : 0, rank: Lv.rankForLevel(p.level), rankName: Lv.rankName(p.heroId, p.level, p.spec), prog: +pr.frac.toFixed(3), stats, wave: this.wave, inv });
  }
  // v1.67 — il fabbro mostra SOLO il catalogo della classe di chi sta guardando, slot per slot. Il client
  // non filtra niente: cio' che non e' della tua classe non attraversa nemmeno la rete.
  offerGear(p, near) {
    const slots = Gear.slotsFor(p.heroId).map(slot => ({
      slot, name: Gear.SLOT_NAME[slot] || slot, icon: Gear.SLOT_ICON[slot] || '⚔️',
      items: Gear.itemsFor(p.heroId, slot).map(it => ({
        id: it.id, name: it.name, desc: it.desc, color: it.color, rank: it.rank, cost: it.cost,
        rarity: Gear.rarityOf(it), owned: p.gear[slot] === it.id ? 1 : 0, have: p.owned[it.id] ? 1 : 0,
      })),
    }));
    this.sendTo(p.id, { t: C.MSG.OFFER_GEAR, coins: p.coins, slots, near: near ? 1 : 0 });
  }
  buyGear(pid, itemId) {
    const p = this.players.get(pid); if (!p || p.dead) return;
    // v1.52 — l'equipaggiamento si compra SOLO dal fabbro, nella mappa MERCATO (il pannello di fine
    // ondata resta disponibile solo se SHOP_GEAR_ENABLED viene riacceso).
    const atMarket = this.phase === C.PHASE_MARKET && !!this.gearMerchant && MU.dist(p.x, p.y, this.gearMerchant.x, this.gearMerchant.y) <= C.MARKET_MERCH_RANGE + 12;
    const atPanel = this.phase === C.PHASE_SHOP && C.SHOP_GEAR_ENABLED;
    if (!atMarket && !atPanel) return;
    const it = Gear.BY_ID[itemId]; if (!it) return;
    if (it.hero !== p.heroId) return;                       // la roba di un'altra classe non si compra
    if (p.gear[it.slot] === it.id) return;                  // gia' addosso
    // v1.72 — se l'oggetto e' gia' nel MAGAZZINO l'hai gia' pagato: rimetterlo addosso non costa nulla.
    // Il vecchio non sparisce piu' nel nulla, resta tuo — e il Banditore lo ricompra a meta'.
    const posseduto = !!p.owned[it.id];
    if (!posseduto && p.coins < it.cost) return;
    if (!posseduto) p.coins -= it.cost;
    p.owned[it.id] = 1; p.gear[it.slot] = it.id;
    this._recomputeGear(p);
    this.offerGear(p, atMarket ? 1 : 0);
    if (p._nearBnd) this.offerBandit(p, 1);                 // il magazzino e' cambiato: il banco si aggiorna
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'geared', x: p.x, y: p.y, slot: it.slot, id: it.id, name: it.name, color: it.color, rank: it.rank, free: posseduto ? 1 : 0 } });
  }
  // v1.79 — QUANDO NON C'E' NIENTE DA SCEGLIERE il pannello non deve restare muto: un riquadro vuoto
  // senza spiegazione si legge come un guasto. Si dice a che livello arriva la prossima scelta e quanta
  // esperienza manca. Al tetto si dice che non ne arrivano piu'.
  nienteCarta(p) {
    p.boonOffer = null; p.boonPicked = true;
    const pr = Lv.progress(p.xpPool);
    let prossimo = 0;
    for (const sc of Lv.SCAGLIONI) if (sc.lvl > p.level) { prossimo = sc.lvl; break; }
    this.sendTo(p.id, {
      t: C.MSG.OFFER_BOON, boons: [], resta: 0, liv: p.level,
      manca: pr.cap ? 0 : Math.max(0, Math.round(pr.need - pr.cur)),
      prossimo, cap: pr.cap ? 1 : 0, max: Lv.MAX_LEVEL,
    });
  }
  // Lo scaglione in cima alla coda decide COSA vedi: le due abilita' della tua classe piu' le due neutre.
  // Non si sorteggia niente — con una sola scelta per scaglione, nascondere un'opzione non aggiungerebbe
  // varieta' ma solo frustrazione.
  offerBoon(p) {
    const coda = p.scaglioniDovuti || [];
    const tier = coda[0];
    if (!tier) return this.nienteCarta(p);
    const choices = Loot.offerteScaglione(p.heroId, tier, p.boonsOwned);
    p.boonOffer = choices.map(b => b.id); p.boonPicked = choices.length === 0;
    const rar = C.RARITY[tier] || {};
    this.sendTo(p.id, {
      t: C.MSG.OFFER_BOON, tier, tierName: rar.name || tier, tierColor: rar.color || '#fff',
      resta: coda.length, liv: p.level, scaglione: Lv.SCAGLIONI.findIndex(x => x.tier === tier) + 1, tot: Lv.SCAGLIONI.length,
      boons: choices.map(b => ({ id: b.id, name: b.name, icon: b.icon, rarity: b.rarity, hero: b.hero, desc: b.desc.replace('{v}', b.v ? b.v(p) : ''), owned: p.boonsOwned[b.id] || 0, max: b.max })),
    });
  }
  buyStat(pid, statId) {
    const p = this.players.get(pid); if (!p || this.phase !== C.PHASE_SHOP) return;
    const s = Loot.XP_STATS.find(x => x.id === statId); if (!s) return;
    if ((p.buys[statId] || 0) >= Loot.STAT_MAX_LEVEL) return;  // v1.51 — tetto di livello per statistica
    // v1.69 — si paga in PUNTI, e il costo cresce a scaglioni (1 fino al 4°, 2 fino al 10°, 3 gli ultimi
    // due): portare una statistica al tetto costa 22 punti sui 23 di una run intera.
    const cost = Lv.statPointCost(p.buys[statId] || 0); if (p.points < cost) return;
    p.points -= cost; p.buys[statId] = (p.buys[statId] || 0) + 1;
    // v1.66 — quattro statistiche da gioco di ruolo. FORZA e COSTITUZIONE reggono il guerriero,
    // INTELLIGENZA il mago (danno E cadenza delle magie), DESTREZZA il ladro (danno, cadenza e passo).
    // Nessuna e' riservata a una classe: chiunque puo' comprarle tutte, ma agiscono sulla scuola dell'arma.
    // v1.74 — il punto di COSTITUZIONE alza il massimo ma NON cura: se curasse, l'Ostessa non servirebbe
    // a nulla e la scelta fra spendere monete per rimettersi in piedi e spendere punti per crescere non
    // esisterebbe. I PV correnti sono quelli di prima, tetto nuovo o no.
    const hpPrima = p.hp;
    this._recomputeBoons(p);
    p.hp = Math.min(this.effMaxHp(p), hpPrima);
    this._checkEvo(p);
    this.offerShop(p); this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'bought', id: statId } });
  }
  // v1.73 — RICOSTRUISCE IL PERSONAGGIO DA ZERO: statistiche base, poi le statistiche comprate coi punti,
  // poi le carte ACCESE (con i loro esemplari), poi le sinergie fra le sole carte accese. E' lo stesso
  // principio del ricalcolo dell'equipaggiamento (v1.67): con effetti che si possono TOGLIERE, sommare i
  // delta lascerebbe in giro il bonus della carta spenta, per sempre e senza che nulla se ne accorga.
  //
  // I due punti delicati, entrambi coperti dai test:
  //  - i PV. Alcune carte alzano il massimo E curano di altrettanto. Al ricalcolo la cura non va rifatta,
  //    ma se il massimo SALE quella differenza va data (e se scende, i PV vanno tagliati al nuovo tetto).
  //  - Ultima Occasione. La carica si consuma giocando: si riparte da quante ne danno le carte accese,
  //    meno quelle gia' spese, altrimenti spegnere e riaccendere sarebbe un modo per resuscitare gratis.
  _recomputeBoons(p) {
    const maxPrima = this.effMaxHp(p), hpPrima = p.hp;
    p.stats = newStats(); p.boon = newBoon(); p.synActive = {}; p.defianceLeft = 0;
    for (const id in p.buys) for (let i = 0; i < p.buys[id]; i++) applicaStat(p, id);
    const accese = {};
    for (const id in p.cardOn) { const n = p.boonsOwned[id] || 0; if (!p.cardOn[id] || n <= 0) continue; accese[id] = n; }
    for (const id in accese) { const b = Loot.BOON_BY_ID[id]; if (!b) continue; for (let i = 0; i < accese[id]; i++) b.apply(p); }
    for (const sy of Loot.detectSynergies(accese, {})) { sy.apply(p); p.synActive[sy.id] = 1; }
    if (p.spec) { const sp = Lv.SPEC_BY_ID[p.spec]; if (sp && sp.apply) sp.apply(p); }
    p.defianceLeft = Math.max(0, p.defianceLeft - (p.defianceUsed || 0));
    // v1.74 — ALZARE IL MASSIMO NON CURA MAI. Ne' comprare Costituzione, ne' prendere Colosso o Scudo
    // Vitale: rimettere in piedi il personaggio e' il mestiere dell'OSTESSA, e se lo facesse anche il
    // negozio quel mestiere non esisterebbe.
    //
    // Resta pero' da non trasformare la Cartomante in una tassa: spegnere una carta abbassa il massimo e
    // taglia i PV in eccesso, e se riaccendendola non tornassero, ogni giro costerebbe vita. Quindi il
    // taglio non si perde, si SEGNA (hpDebt) e viene restituito solo quando il massimo risale — mai piu'
    // di quanto era stato tolto. Cosi' accendere/spegnere e' neutro e nessuna via cura di striscio.
    const maxDopo = this.effMaxHp(p);
    if (maxDopo < maxPrima) {
      p.hpDebt = (p.hpDebt || 0) + Math.max(0, hpPrima - maxDopo);
      p.hp = Math.min(hpPrima, maxDopo);
    } else if (maxDopo > maxPrima) {
      const resa = Math.min(maxDopo - maxPrima, p.hpDebt || 0);
      p.hpDebt = (p.hpDebt || 0) - resa;
      p.hp = Math.min(maxDopo, hpPrima + resa);
    } else p.hp = Math.min(hpPrima, maxDopo);
    if (p.hp < 1 && !p.dead && !p.down) p.hp = 1;
  }
  // Quante carte DIVERSE sono accese adesso.
  _carteAccese(p) { let n = 0; for (const id in p.cardOn) if (p.cardOn[id] && (p.boonsOwned[id] || 0) > 0) n++; return n; }
  pickBoon(pid, boonId) {
    const p = this.players.get(pid); if (!p || this.phase !== C.PHASE_SHOP || !p.boonOffer) return;
    if (!p.boonOffer.includes(boonId)) return;
    const b = Loot.BOON_BY_ID[boonId]; if (!b) return;
    if ((p.boonsOwned[boonId] || 0) >= b.max) return;
    p.boonsOwned[boonId] = (p.boonsOwned[boonId] || 0) + 1; p.boonOffer = null; p.boonPicked = true;
    // v1.79 — L'ABILITA' E' SEMPRE ACCESA. Il concetto di carta "spenta" e il tetto delle cinque attive
    // erano il mestiere della Cartomante, che e' chiusa: con quattro passive in tutta la run non c'e'
    // niente da scegliere di tenere acceso.
    p.cardOn[boonId] = 1;
    const spenta = false;
    const synPrima = Object.keys(p.synActive || {}).length;
    this._recomputeBoons(p);
    this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'boon_ok', id: boonId, name: b.name, icon: b.icon, off: spenta ? 1 : 0 } });
    // SINERGIE (v1.7): se la carta appena presa completa una coppia, annunciala una sola volta.
    if (Object.keys(p.synActive || {}).length > synPrima)
      for (const id in p.synActive) { const sy = Loot.SYNERGY_BY_ID[id]; if (sy) this.sendTo(pid, { t: C.MSG.EVENT, ev: { t: 'synergy', id: sy.id, name: sy.name, icon: sy.icon, desc: sy.desc } }); }
    this.sendBoons(p);  // v1.51 — aggiorna la barra dei poteri attivi
    // v1.79 — uno scaglione speso esce dalla coda. Chi ne ha due in sospeso (capita se un'ondata sola
    // porta dal livello 5 al 7) vede subito il secondo, senza aspettare l'ondata dopo.
    if (p.scaglioniDovuti && p.scaglioniDovuti.length) p.scaglioniDovuti.shift();
    if (p.scaglioniDovuti && p.scaglioniDovuti.length && this.phase === C.PHASE_SHOP) this.offerBoon(p);
    else if (this.phase === C.PHASE_SHOP) this.nienteCarta(p);
  }
  // v1.51 — elenco dei poteri attivi, per la barra in basso nell'HUD. Inviato solo quando cambia qualcosa
  // (scelta di un boon, sinergia, inizio partita): non entra nello snapshot, che gira 20 volte al secondo.
  sendBoons(p) {
    const list = [];
    for (const id in p.boonsOwned) { const b = Loot.BOON_BY_ID[id]; if (b && p.boonsOwned[id] > 0) list.push({ id, icon: b.icon, name: b.name, rarity: b.rarity, n: p.boonsOwned[id], desc: b.desc.replace('{v}', b.v ? b.v(p) : ''), on: p.cardOn[id] ? 1 : 0 }); }
    for (const id in (p.synActive || {})) { const sy = Loot.SYNERGY_BY_ID[id]; if (sy) list.push({ id, icon: sy.icon, name: sy.name, n: 1, syn: 1, desc: sy.desc, on: 1 }); }
    this.sendTo(p.id, { t: C.MSG.BOONS, boons: list, max: C.MAX_CARDS, active: this._carteAccese(p) });
  }
  // v1.79 — il pulsante centrale del menu: "sono pronto per la mappa successiva". Non sceglie piu' una
  // destinazione — il villaggio ha un pulsante suo.
  shopReady(pid, dest) { const p = this.players.get(pid); if (!p) return; p.ready = true; }
  // v1.79 — VAI AL VILLAGGIO. E' una mappa condivisa: ci si entra tutti insieme, come si usciva tutti
  // insieme dal portale. Vale la stessa regola del portale — il primo che decide trascina la stanza.
  vaiAlVillaggio(pid) {
    const p = this.players.get(pid); if (!p || !p.connected) return;
    if (this.phase !== C.PHASE_SHOP) return;
    if (this.wave >= Waves.FINAL_WAVE) return;
    this.broadcast({ t: C.MSG.EVENT, ev: { t: 'al_villaggio', who: pid, name: p.name } });
    this.enterMarket();
  }

  // v1.80 — CHI SI FA SOTTO. Ogni 0,4 s si guarda chi e' piu' vicino a ciascun giocatore: i primi
  // C.FOLLA_MAX hanno il permesso di avvicinarsi (mon.impegnato = 1), gli altri aspettano all'anello.
  // L'ordine e' la distanza, quindi il rimpiazzo e' automatico: uccidi quello che hai addosso e il
  // piu' vicino fra quelli in attesa prende il suo posto e si avvia. Quando ne restano pochi sono
  // tutti dentro il tetto, e allora ti cercano tutti: la coda di fine ondata non esiste piu'.
  _assegnaFolla() {
    const ap = this.alivePlayers;
    if (!ap.length) { for (const m of this.monsters) m.impegnato = 1; return; }
    const code = new Map();
    for (const m of this.monsters) {
      if (m.dead) continue;
      m.impegnato = 0;
      let best = null, bd = Infinity;
      for (const p of ap) { const d = MU.dist2(m.x, m.y, p.x, p.y); if (d < bd) { bd = d; best = p; } }
      if (!best) { m.impegnato = 1; continue; }
      m._dFolla = bd;
      let q = code.get(best.id); if (!q) { q = []; code.set(best.id, q); }
      q.push(m);
    }
    const tetto = C.FOLLA_MAX || 6;
    for (const q of code.values()) {
      q.sort((a, b) => a._dFolla - b._dFolla);
      for (let i = 0; i < q.length && i < tetto; i++) q[i].impegnato = 1;
    }
  }

  update(dt) {
    this.time += dt; this.dt = dt; this.flowTimer -= dt;
    if (this.flowTimer <= 0) { this.flowTimer = 0.12; const t = this.alivePlayers.map(p => ({ gx: (p.x / C.TILE) | 0, gy: (p.y / C.TILE) | 0 })); if (t.length) this.flow = PF.build(this.map.grid, this.map.w, this.map.h, t); }
    const inCombat = (this.phase === C.PHASE_COMBAT || this.phase === C.PHASE_BOSS);
    this.follaTimer = (this.follaTimer || 0) - dt;
    if (this.follaTimer <= 0) { this.follaTimer = 0.4; this._assegnaFolla(); }
    // v1.78 — qui c'era il timer della modalita' Sopravvivenza e, piu' sotto, il suo rifornimento
    // continuo di mostri. Tolta la modalita', sono spariti tutti e due insieme al campo `surviveT`.
    // v1.68 — il tetto dei vivi e' sceso da 50 a 30 e i nemici in eccesso restano in CODA: l'ondata non
    // perde nessuno, cambia solo quanti se ne vedono insieme. Perche' il tetto non si trasformi in
    // un'ondata piu' lenta, il rifornimento ha due velocita': mentre l'arena si riempie per la prima volta
    // resta il ritmo di sempre (0,25-0,6s, e' la salita che da' il senso di ondata che monta), ma quando
    // e' gia' stata piena e si sono aperti dei buchi il rimpiazzo e' quasi immediato (0,10-0,22s).
    if (inCombat && this.monsters.length > (this._peakAlive || 0)) this._peakAlive = this.monsters.length;
    if (inCombat && this.pending > 0 && this._postiLiberi() > 0) { this.spawnTimer -= dt; if (this.spawnTimer <= 0) { this.spawnTimer = (this.monsters.length < (this._peakAlive || 0)) ? MU.rand(0.10, 0.22) : MU.rand(0.25, 0.6); if (Waves.isBossWave(this.wave)) { const pos = this.randomSpawnPos(); this.spawnMonster('skeleton', pos.x, pos.y, { scaling: Waves.scaling(this.wave, this.alivePlayers.length || 1) }); this.pending--; } else if (this.waveList && this.waveList.length) { const it = this.waveList.shift(); const pos = this.randomSpawnPos(); this.spawnMonster(this._capType(it.type), pos.x, pos.y, { scaling: this.waveScaling, elite: it.elite }); this.pending--; } } }
    // durante SOPRAVVIVENZA rifornisci finché il timer non scade
    // v1.70 — il rifornimento della SOPRAVVIVENZA aveva un 14 scritto a mano che scavalcava il tetto:
    // all ondata 2 (tetto 10) si arrivava a 14 vivi. Ora passa dalla stessa porta di tutti gli altri.
    // v1.9 — PAUSA: durante il negozio/scelta poteri il mondo e congelato (nessuna simulazione).
    const running = (this.phase !== C.PHASE_SHOP && this.phase !== C.PHASE_LOBBY && this.phase !== C.PHASE_GAMEOVER && this.phase !== C.PHASE_VICTORY);
    if (running) {
      this.updatePlayers(dt); this.updateMonsters(dt); this.updateBullets(dt); this.updateOrbs(dt); this.updateMeteors(dt); this.updateZones(dt); this.updatePickups(dt); this.updateMerchant(dt); this.updateDarkMerchant(dt); this.updateGearMerchant(); this.updateHerbalist(); this.updateBandit(); this.updateSeer(); this.updateInn();
      if (this.bulletTime) { this.bulletTime.t -= dt; if (this.bulletTime.t <= 0) this.bulletTime = null; }
    }
    // failsafe anti-stallo
    // =====================================================================================
    // v1.76.1 — IL RECUPERO ANTI-STALLO, rifatto.
    //
    // Serve a una cosa sola: che un'ondata non resti aperta per sempre perche' un mostro e' finito
    // dove non puo' piu' raggiungerti. Ma com'era scritto faceva molto di piu': se per 6 secondi il
    // NUMERO di mostri non calava, teletrasportava TUTTI i mostri a 240 px da un giocatore.
    // Scappare senza uccidere e' esattamente questo — e allora il branco ti compariva addosso.
    // Non e' un aiuto al gioco, e' una bugia: toglie credibilita' a tutto il resto.
    //
    // La regola giusta guarda il SINGOLO mostro, e sposta solo chi e' davvero bloccato:
    //   1. non si e' avvicinato di un metro al giocatore piu' vicino da 5 secondi, E
    //   2. sta comunque LONTANO (oltre 640 px): se ti e' addosso non e' bloccato, sta combattendo, E
    //   3. non e' uno di quelli fermi per costruzione (il Fungo sta piantato: e' il suo mestiere).
    // E chi si sposta non compare addosso a te: va a 600-900 px, preferendo un punto da cui NON ti
    // vede — cosi' non lo vedi mai apparire, lo vedi arrivare.
    if (inCombat && this.pending <= 0 && this.monsters.length > 0) {
      const ap = this.alivePlayers;
      if (ap.length) for (const m of this.monsters) {
        if (m.dead || (m.def && m.def.immobile)) continue;
        if (m.impegnato === 0) { m._fermoT = 0; m._avvicinaMin = undefined; continue; }   // v1.80 — non e' bloccato: sta aspettando il turno
        let d = Infinity, vicino = null;
        for (const p of ap) { const dd = MU.dist(m.x, m.y, p.x, p.y); if (dd < d) { d = dd; vicino = p; } }
        if (m._avvicinaMin === undefined || d < m._avvicinaMin - 40) { m._avvicinaMin = d; m._fermoT = 0; continue; }
        m._fermoT = (m._fermoT || 0) + dt;
        if (m._fermoT < 5 || d < 640) continue;
        // Bloccato davvero: lo si rimette in gioco. DOVE conta quanto il quando — al primo tentativo
        // lo mettevo a 600-900 px, e 600 px sono dentro lo schermo: il mio stesso test lo ha beccato,
        // 619 px guadagnati in un tick sotto gli occhi del giocatore. Adesso va oltre i 900 px E in
        // un punto da cui il giocatore non lo vede. Se un posto cosi' non si trova non si sposta
        // niente: si riprova fra cinque secondi. Meglio un'ondata che dura qualche secondo in piu'
        // che un mostro che si materializza in mezzo allo schermo.
        let dove = null;
        for (let k = 0; k < 64; k++) {
          const a = Math.random() * Math.PI * 2, r = 950 + Math.random() * 550;
          const nx = vicino.x + Math.cos(a) * r, ny = vicino.y + Math.sin(a) * r;
          if (this.isWallAt(nx, ny) || this._blk(nx, ny, m.radius * 0.8)) continue;
          let visto = false, troppoVicino = false;
          for (const p of ap) {
            if (MU.dist(nx, ny, p.x, p.y) < 900) troppoVicino = true;
            if (this.losClear(p.x, p.y, nx, ny)) visto = true;
          }
          if (visto || troppoVicino) continue;
          dove = { x: nx, y: ny }; break;
        }
        if (dove) { m.x = dove.x; m.y = dove.y; m._avvicinaMin = undefined; }
        m._fermoT = 0;
      }
    }
    // condizioni di fine ondata per modalità
    if (inCombat) this._checkWaveClear();
    // v1.78 — mappa ripulita: si aspetta il pulsante EXIT di tutti, con un tetto di tempo anti-AFK.
    if (this.phase === C.PHASE_CLEARED) { this.exitT -= dt; if (this.exitT <= 0) this._waveDone(); }
    if (this.phase === C.PHASE_MARKET) {
      this._checkMarketExit();
      if (this.phase === C.PHASE_MARKET) { this.marketTimer -= dt; let conn = 0; for (const p of this.players.values()) if (p.connected && !p.dead) conn++;
        if (conn > 1 && this.marketTimer <= 0) { this.gearMerchant = null; this._forceNewMap = true; this.nextWave(); } }
    }
    if (this.phase === C.PHASE_SHOP) { this.shopTimer -= dt; let all = true, conn = 0; for (const p of this.players.values()) if (p.connected && !p.dead) { conn++; if (!p.ready) all = false; }
      // v1.9 — pausa: in singolo si attende il click su "Continua" (nessun timeout forzato); in multiplayer resta un timeout anti-AFK.
      const timedOut = conn > 1 && this.shopTimer <= 0;
      if (all || timedOut) this._afterShop(); }
  }
  _checkWaveClear() {
    if (Waves.isBossWave(this.wave)) { if (this.pending <= 0 && this.monsters.length === 0) return this._waveDone(); return; }
    // v1.78 — qui c'erano i due rami delle modalita' Sopravvivenza (finisce a tempo) e Tesoro (finisce
    // quando lo scrigno muore). Tolte le modalita', l'ondata finisce in un modo solo: quando non resta
    // piu' nessuno.
    if (this.pending <= 0 && this.monsters.length === 0) return this._mappaRipulita();
  }
  // v1.78 — L'ULTIMO NEMICO NON TI SBATTE FUORI. Cadeva, e nello stesso fotogramma eri nel pannello del
  // negozio: non facevi in tempo a capire di aver vinto, e quello che era rimasto a terra lo raccoglieva
  // il gioco al posto tuo. Adesso la mappa resta tua: il cronometro si ferma qui (aspettare non costa il
  // premio di velocita'), e si esce col pulsante EXIT. La partita finale non passa di qui: la vittoria
  // e' la vittoria, non ha un'uscita da cercare.
  _mappaRipulita() {
    if (this.wave >= Waves.FINAL_WAVE) return this._waveDone();
    this.waveDur = this.time - this.waveT0;
    this.phase = C.PHASE_CLEARED; this.exitT = C.EXIT_TIMEOUT;
    for (const p of this.players.values()) p.exitOk = false;
    const inTempo = this.parT > 0 && this.waveDur <= this.parT;
    this.broadcast({ t: C.MSG.EVENT, ev: { t: 'cleared', wave: this.wave, durata: +this.waveDur.toFixed(1), par: this.parT || 0, tempo: inTempo ? 1 : 0 } });
  }
  // Quanti giocatori devono premere EXIT perche' si esca, e quanti l'hanno gia' fatto.
  // Chi e' caduto non puo' premere niente: non lo si aspetta, o si resterebbe fermi fino al timeout.
  _contaUscita() { let n = 0, tot = 0; for (const p of this.players.values()) { if (!p.connected || p.dead) continue; tot++; if (p.exitOk) n++; } return { n, tot }; }
  exitWave(pid) {
    if (this.phase !== C.PHASE_CLEARED) return;
    const p = this.players.get(pid); if (!p) return;
    p.exitOk = true;
    const c = this._contaUscita();
    this.broadcast({ t: C.MSG.EVENT, ev: { t: 'exit_ready', who: pid, name: p.name, n: c.n, tot: c.tot } });
    if (c.n >= c.tot || c.tot === 0) this._waveDone();
  }
  _waveDone() {
    // v1.72 — l'ondata e' finita: chi non ha perso vite chiude la taglia "Nessun caduto".
    for (const p of this.players.values()) { if (p.connected && p.noLifeLost && !p.dead) this.bountyTick(p, 'illeso', 1); }
    // v1.77 — IL PREMIO DI VELOCITA'. Le ondate a sopravvivenza sono escluse per costruzione: durano
    // un tempo fisso, non si possono chiudere prima, e un premio che tocca sempre non e' un premio.
    const durata = this.waveDur != null ? this.waveDur : this.time - this.waveT0;
    if (this.parT > 0 && durata <= this.parT) {
      this.parPreso = 1;
      const xp = Math.round(C.PAR_XP + C.PAR_XP_ONDATA * this.wave);
      const monete = Math.round(C.PAR_MONETE + C.PAR_MONETE_ONDATA * this.wave);
      for (const p of this.players.values()) {
        if (!p.connected || p.dead) continue;
        p.coins += monete;
      }
      // il premio di velocita' e' esperienza come tutte le altre: passa dalla stessa porta, cosi' vale la
      // stessa curva e lo stesso fattore di gruppo.
      this.xpCondivisa(xp, 'tempo');
      this.parBonus = { xp, monete };
      this.broadcast({ t: C.MSG.EVENT, ev: { t: 'par_ok', wave: this.wave, secondi: +durata.toFixed(1), par: this.parT, xp, monete } });
    }
    if (this.wave >= Waves.FINAL_WAVE) this.victory(); else this.enterShop();
  }
  enterShop() {
    this.phase = C.PHASE_SHOP; this.shopTimer = 45; this.shopDest = null;
    // v1.9 — raccolta automatica dei drop rimasti a terra (la pausa non fa perdere nulla).
    const recip = this.alivePlayers[0] || [...this.players.values()].find(p => p.connected) || null;
    if (recip) {
      let gx = 0, gc = 0;
      for (const o of this.groundXp) if (!o.dead) { this.xpCondivisa(o.v); gx += o.v; }
      for (const o of this.groundCoins) if (!o.dead) { recip.coins += o.v; if (recip.ondata) recip.ondata.monete += o.v; gc += o.v; }
      this.groundXp.length = 0; this.groundCoins.length = 0;
      if (gx > 0) this.events.push({ t: 'xp', x: recip.x, y: recip.y - 10, v: gx });
      if (gc > 0) this.events.push({ t: 'coin', x: recip.x, y: recip.y - 10, v: gc, cid: 'gold', who: recip.id });
    }
    for (const p of this.players.values()) { if (!p.connected) continue;
      // v1.74.1 — VIA LA CURA AUTOMATICA DI FINE ONDATA. Chiudere un'ondata regalava il 25% dei PV massimi:
      // una cura gratuita, silenziosa e ripetuta, che rendeva l'Ostessa un lusso e non un servizio. Adesso
      // i danni si portano dietro finche' non si paga (o non si beve). Chi e' A TERRA viene comunque
      // rialzato, perche' quello non e' curare: e' rimettere in gioco chi altrimenti resterebbe fuori.
      if (p.down || p.dead) { p.down = false; p.dead = false; p.hp = Math.round(this.effMaxHp(p) * 0.6); if (p.lives < 1) p.lives = 1; }
      // v1.69 — una scelta alla volta: se c'e' una carta di rango in sospeso, il boon salta questo giro.
      // Il rango arriva sui boss, quindi in pratica alle ondate 5/10/15/20 si sceglie la carta di classe
      // e nelle altre il boon generico, senza mai due mazzi aperti insieme.
      p.ready = false; p.killHasteStacks = 0; p.killStepStacks = 0;
      this._inviaPannello(p);
    }
    this.broadcast({ t: C.MSG.EVENT, ev: { t: 'shop', next: this.wave + 1 } });
  }

  // v1.78 — MENTRE LA MAPPA E' RIPULITA NIENTE SCADE. Le sfere di esperienza e le monete vivono 30
  // secondi: con l'uscita a pulsante il giocatore puo' girare per la mappa anche un minuto, e senza
  // questa regola si troverebbe il bottino svanito sotto gli occhi proprio mentre lo va a prendere.
  // Il tempo riprende a correre quando ricomincia il combattimento.
  // v1.79 — TUTTO IL MENU DI FINE ONDATA IN UN POSTO SOLO. Le quattro sezioni (riepilogo, personaggio,
  // abilita', villaggio) leggono messaggi diversi, e vanno rimandati sia quando l'ondata finisce sia
  // quando si torna dal villaggio: se stessero scritti in due punti, tornando dal villaggio ne
  // mancherebbe sempre uno.
  _inviaPannello(p) {
    // Una scelta alla volta: la specializzazione del 15 ha la precedenza sullo scaglione.
    if (this.offerRank(p)) { p.boonOffer = null; p.boonPicked = true; }
    else if ((p.scaglioniDovuti || []).length > 0) this.offerBoon(p);
    else this.nienteCarta(p);
    this.inviaRiepilogo(p);
    this.offerShop(p); this.sendBoons(p);
    if (C.SHOP_GEAR_ENABLED) this.offerGear(p);  // v1.51 — Emporio a monete nascosto in attesa di ridisegno
  }
  // v1.79 — SI TORNA AL MENU, NON ALL'ONDATA. Dal villaggio si rientra qui: il riepilogo e' quello
  // dell'ondata appena chiusa (non si ricalcola niente, non si premia niente una seconda volta) e la
  // prossima mappa parte solo col pulsante apposta.
  riapriMenu() {
    this.phase = C.PHASE_SHOP; this.shopTimer = 45;
    for (const p of this.players.values()) { if (!p.connected) continue; p.ready = false; this._inviaPannello(p); }
    this.broadcast({ t: C.MSG.EVENT, ev: { t: 'shop', next: this.wave + 1, dalVillaggio: 1 } });
  }
  updatePickups(dt) {
    // ATTENZIONE: si ferma solo la SCADENZA, non il resto. Azzerare dt qui spegnerebbe anche la calamita
    // che tira le sfere verso il giocatore, cioe proprio il gesto che questa regola vuole permettere.
    const scade = this.phase === C.PHASE_CLEARED ? 0 : dt;
    for (const o of this.groundXp) { if (o.dead) continue; o.t -= scade; if (o.t <= 0) { o.dead = true; continue; } let target = null, bd = Infinity, tr = C.XP_MAGNET; for (const p of this.alivePlayers) { const mr = C.XP_MAGNET * (1 + 0.9 * ((p.boon && p.boon.magnet) || 0)); const d = MU.dist2(o.x, o.y, p.x, p.y); if (d < mr * mr && d < bd) { bd = d; target = p; tr = mr; } } if (target) { const n = MU.norm(target.x - o.x, target.y - o.y); const pull = 90 + (1 - Math.sqrt(bd) / tr) * 260; o.x += n.x * pull * dt; o.y += n.y * pull * dt; if (MU.dist(o.x, o.y, target.x, target.y) < target.radius + 6) { this.xpCondivisa(o.v); o.dead = true; this.events.push({ t: 'xp', x: target.x, y: target.y, v: o.v }); } } }
    if (this.groundXp.some(o => o.dead)) this.groundXp = this.groundXp.filter(o => !o.dead);
    // Raccolta MONETE (calamita come l'XP)
    for (const o of this.groundCoins) { if (o.dead) continue; o.t -= scade; if (o.t <= 0) { o.dead = true; continue; } let target = null, bd = Infinity, tr = C.COIN_MAGNET; for (const p of this.alivePlayers) { const mr = C.COIN_MAGNET * (1 + 0.9 * ((p.boon && p.boon.magnet) || 0)); const d = MU.dist2(o.x, o.y, p.x, p.y); if (d < mr * mr && d < bd) { bd = d; target = p; tr = mr; } } if (target) { const n = MU.norm(target.x - o.x, target.y - o.y); const pull = 90 + (1 - Math.sqrt(bd) / tr) * 260; o.x += n.x * pull * dt; o.y += n.y * pull * dt; if (MU.dist(o.x, o.y, target.x, target.y) < target.radius + 6) { target.coins += o.v; if (target.ondata) target.ondata.monete += o.v; o.dead = true; this.events.push({ t: 'coin', x: target.x, y: target.y, v: o.v, cid: o.cid, who: target.id }); } } }
    if (this.groundCoins.some(o => o.dead)) this.groundCoins = this.groundCoins.filter(o => !o.dead);
    for (const it of this.items) { if (it.dead) continue; it.t -= scade; if (it.t <= 0) { it.dead = true; continue; } for (const p of this.alivePlayers) { if (MU.dist(it.x, it.y, p.x, p.y) < p.radius + it.r + 6) { const def = Loot.ITEMS.find(x => x.id === it.id); if (def) this.applyItem(p, def); it.dead = true; break; } } }
    if (this.items.some(o => o.dead)) this.items = this.items.filter(o => !o.dead);
    for (const c of this.crates) { if (c.opened) continue; for (const p of this.alivePlayers) { if (MU.dist(c.x, c.y, p.x, p.y) < p.radius + c.r + 6) { c.opened = true; if (c.mimic && this._postiLiberi() > 0) { const mm = this.spawnMonster('mimic', c.x, c.y, { scaling: this.waveScaling || Waves.scaling(this.wave, this.alivePlayers.length || 1) }); mm.awake = true; this.events.push({ t: 'crate_mimic', x: c.x, y: c.y }); } else { const b = Loot.CRATE_BUFFS[(Math.random() * Loot.CRATE_BUFFS.length) | 0]; p.buffs[b.id] = b.dur; this.events.push({ t: 'crate_buff', x: c.x, y: c.y, id: b.id, name: b.name, icon: b.icon, color: b.color, name2: p.name }); }
        // v1.70 — aprire una cassa e' esperienza: esplorare deve far crescere quanto combattere.
        this.xpCondivisa(C.XP_CASSA + this.wave * C.XP_CASSA_ONDATA, 'cassa');
        this.bountyTick(p, 'casse', 1);
        break; } } }
    if (this.crates.some(c => c.opened)) this.crates = this.crates.filter(c => !c.opened);
    for (const d of this.weaponDrops) { if (d.taken) continue; for (const p of this.alivePlayers) { if (MU.dist(d.x, d.y, p.x, p.y) < p.radius + d.r + 6) { d.taken = true; this._giveWeapon(p, d.wt); if (d.level >= 2 && p.weapon2 && p.weapon2.type === d.wt && !p.weapon2.evolved) p.weapon2.level = Math.min(3, Math.max(p.weapon2.level, d.level)); const w = Loot.WEAPONS[d.wt]; this.events.push({ t: 'weapon_pickup', x: d.x, y: d.y, wt: d.wt, name: w.name, icon: w.icon, color: w.color, level: p.weapon2.level, name2: p.name }); this._checkEvo(p); break; } } }
    if (this.weaponDrops.some(d => d.taken)) this.weaponDrops = this.weaponDrops.filter(d => !d.taken);
  }

  updatePlayers(dt) {
    for (const p of this.players.values()) {
      if (!p.connected) continue;
      p.fireCd = Math.max(0, p.fireCd - dt); p.cdQ = Math.max(0, p.cdQ - dt); p.cdE = Math.max(0, p.cdE - dt); p.cdDash = Math.max(0, p.cdDash - dt);
      // v1.79.2 — quanto sei fermo (Concentrazione: conta il movimento CHIESTO, non quello ottenuto, se no
      // bastava spingersi contro un muro), la finestra del critico dopo lo scatto e la ricarica dell'uscita.
      p.fermoT = (Math.abs(p.input.mx) < 0.01 && Math.abs(p.input.my) < 0.01) ? (p.fermoT || 0) + dt : 0;
      if (p.ombraT > 0) p.ombraT = Math.max(0, p.ombraT - dt);
      if (p.scomparsaCd > 0) p.scomparsaCd = Math.max(0, p.scomparsaCd - dt);
      p.potCd = Math.max(0, p.potCd - dt);
      if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) { p.comboT = 0; p.combo = 0; } }
      if (p.hitFlash) p.hitFlash = Math.max(0, p.hitFlash - dt);
      for (const k of Object.keys(p.buffs)) { p.buffs[k] -= dt; if (p.buffs[k] <= 0) { delete p.buffs[k]; if (k === 'killHaste') p.killHasteStacks = 0; if (k === 'killStep') p.killStepStacks = 0; } }
      if (p.aegisT > 0) p.aegisT -= dt;  // v1.51 — ricarica dell'Egida Ostinata
      if (p.stats.regen && !p.dead && !p.down) p.hp = Math.min(this.effMaxHp(p), p.hp + p.stats.regen * dt);
      // v1.69 — AURA DEL PALADINO: cura i COMPAGNI dentro il cerchio (la riduzione danni la applica
      // damagePlayer). Cura anche chi la porta, ma meta': in solitaria non deve essere il ramo migliore.
      if (p.perk.aura > 0 && !p.dead && !p.down) {
        for (const q of this.alivePlayers) {
          const d = MU.dist(p.x, p.y, q.x, q.y); if (d > p.perk.aura) continue;
          const quota = (q === p ? 0.5 : 1) * p.perk.auraCura;
          q.hp = Math.min(this.effMaxHp(q), q.hp + this.effMaxHp(q) * quota * dt);
        }
      }
      // SCUDO DI MANA: si ricarica solo dopo 8s senza prendere colpi (manaT azzerato in damagePlayer)
      if (p.perk.mana > 0 && !p.dead) {
        p.manaT = (p.manaT || 0) + dt;
        if (p.manaT >= 8 && p.manaShield < p.perk.mana) { p.manaShield = p.perk.mana; this.events.push({ t: 'manafull', x: p.x, y: p.y, who: p.id }); }
      }
      // RUNA VAGANTE: spara da sola una bolla ogni 3s al nemico piu' vicino in vista
      if (p.perk.runa > 0 && !p.dead && !p.down && (this.phase === C.PHASE_COMBAT || this.phase === C.PHASE_BOSS)) {
        p.runaT = (p.runaT || 0) + dt;
        if (p.runaT >= 3) {
          p.runaT = 0;
          let best = null, bd = 520 * 520;
          for (const m of this.monsters) { if (m.dead) continue; const dd = MU.dist2(p.x, p.y, m.x, m.y); if (dd < bd && this.losClear(p.x, p.y, m.x, m.y)) { bd = dd; best = m; } }
          if (best) {
            const a = Math.atan2(best.y - p.y, best.x - p.x), w = this.effWeapon(p);
            this.bullets.push({ eid: NEXT++, hostile: false, owner: p.id, x: p.x, y: p.y, vx: Math.cos(a) * 470, vy: Math.sin(a) * 470,
              r: 8, dmg: Math.round(this.effDamage(p) * 0.5), color: '#c48cff', life: 1.2, pierce: 0, knock: 30, bubble: true });
            this.events.push({ t: 'runa', x: p.x, y: p.y, a });
          }
        }
      }
      if (p.buffs.b_regen && !p.dead && !p.down) p.hp = Math.min(this.effMaxHp(p), p.hp + 8 * dt);
      if (p.buffs.po_regen && !p.dead && !p.down) p.hp = Math.min(this.effMaxHp(p), p.hp + Pot.EFF.regen * Pot.healMult(p.buys.st_cos || 0) * dt);
      if (p.down) {
        p.downT -= dt; p.vx *= 0.8; p.vy *= 0.8;
        for (const a of this.alivePlayers) { if (a === p) continue; if (MU.dist(a.x, a.y, p.x, p.y) < 46) { p.reviveProg = (p.reviveProg || 0) + dt; break; } }
        if ((p.reviveProg || 0) > 2.2) { p.down = false; p.hp = Math.round(this.effMaxHp(p) * 0.5); p.reviveProg = 0; p.buffs.iframe = C.REVIVE_IFRAME; this.events.push({ t: 'revive', x: p.x, y: p.y }); }
        if (p.downT <= 0) {
          if (p.lives > 1) { p.lives -= 1; p.noLifeLost = false; p.down = false; p.hp = Math.round(this.effMaxHp(p) * 0.6); p.buffs.iframe = C.REVIVE_IFRAME; p.reviveProg = 0; this.events.push({ t: 'life_lost', x: p.x, y: p.y, name: p.name, lives: p.lives }); }
          else { p.lives = 0; p.noLifeLost = false; p.dead = true; p.down = false; this.events.push({ t: 'dead', x: p.x, y: p.y, name: p.name }); if (!this.anyRevivable) this.gameOver(); }
        }
        continue;
      }
      if (p.dead) continue;
      const sp = this.effSpeed(p); let mx = p.input.mx, my = p.input.my; const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
      let dvx = mx * sp, dvy = my * sp; if (p.buffs.dash > 0 && p.dashDir) { dvx = p.dashDir.x * sp; dvy = p.dashDir.y * sp; }
      p.vx *= 0.86; p.vy *= 0.86; this.moveCircle(p, (dvx + p.vx) * dt, (dvy + p.vy) * dt);
      // v1.69 — SPRONE: lo scatto travolge. Un colpo solo per nemico per scatto, altrimenti chi ti resta
      // addosso incasserebbe una volta per tick.
      if (p.perk.sprone > 0 && p.buffs.dash > 0) {
        if (!p._spronati) p._spronati = new Set();
        const dn = Math.round(this.effDamage(p) * p.perk.sprone);
        for (const m of this.monsters) {
          if (m.dead || p._spronati.has(m.eid)) continue;
          if (MU.dist(p.x, p.y, m.x, m.y) > p.radius + m.radius + 6) continue;
          p._spronati.add(m.eid);
          this.damageMonster(m, dn, p.x, p.y, 220 * p.stats.knockMult, p, {});
        }
      } else if (p._spronati) p._spronati = null;
      if (this.isWallAt(p.x, p.y)) this._unstuck(p); // v1.11 — rete di sicurezza anti-blocco
      if (this.solids) this._spingiFuori(p);         // v1.75.2 — e se sei finito dentro un mobile, fuori
      const t = this.tileAtWorld(p.x, p.y);
      if (t === C.T_HAZARD && !p.buffs.iframe && !p.buffs.i_invuln) { p.hazT = (p.hazT || 0) + dt; if (p.hazT > 0.25) { this.damagePlayer(p, 6, p.x + 1, p.y, 0); p.hazT = 0; } }
      else if (t === C.T_TRAP && !p.buffs.iframe && !p.buffs.i_invuln) { p.trapT = (p.trapT || 0) + dt; if (p.trapT > 0.6) { this.damagePlayer(p, 14, p.x, p.y - 1, 0); p.trapT = 0; this.events.push({ t: 'trap', x: p.x, y: p.y }); } }
      // v1.63 — LA FAGLIA CONSUMA CHI RESTA AI MARGINI. Non un danno secco: una carica che sale solo
      // mentre sei nella fascia (piu' in fretta quanto piu' sei incastrato nell'angolo), ha 2.5s di grazia
      // e poi drena in modo crescente. Uscire la riassorbe al doppio della velocita': passare dal bordo
      // non costa niente, ACCAMPARSI si'. Solo in combattimento: al mercato la sala e' tutta margine.
      if ((this.phase === C.PHASE_COMBAT || this.phase === C.PHASE_BOSS) && !p.dead && !p.down) {
        const dep = this._edgeDepth(p.x, p.y);
        if (dep > 0) p.edgeT = (p.edgeT || 0) + dt * (dep / C.EDGE_MARGIN);
        else p.edgeT = Math.max(0, (p.edgeT || 0) - dt * C.EDGE_RECOVER);
        p.edgeLv = Math.max(0, Math.min(1, (p.edgeT || 0) / (C.EDGE_GRACE + C.EDGE_RAMP)));
        const over = (p.edgeT || 0) - C.EDGE_GRACE;
        // il danno richiede di ESSERE nella fascia: uscirne lo ferma sul colpo. La carica invece resta e
        // si riassorbe piano, cosi' rientrare subito ricomincia a mordere quasi immediatamente — ma non si
        // continua a perdere vita stando al sicuro, che sarebbe solo incomprensibile.
        if (dep > 0 && over > 0 && !p.buffs.iframe && !p.buffs.i_invuln) {
          const k = Math.max(0, Math.min(1, over / C.EDGE_RAMP));
          p.edgeTick = (p.edgeTick || 0) + dt;
          if (p.edgeTick >= 0.25) {
            const dps = C.EDGE_DPS_MIN + (C.EDGE_DPS_MAX - C.EDGE_DPS_MIN) * k;
            this.damagePlayer(p, Math.max(1, Math.round(dps * p.edgeTick)), p.x + 1, p.y, 0);
            p.edgeTick = 0;
            if (!p._edgeWarn) { p._edgeWarn = 1; this.events.push({ t: 'rift_edge', who: p.id, x: p.x, y: p.y }); }
          }
        } else { p.edgeTick = 0; if (over <= 0 || dep === 0) p._edgeWarn = 0; }
      } else { p.edgeT = 0; p.edgeLv = 0; p.edgeTick = 0; p._edgeWarn = 0; }
      p.aim = p.input.aim; p.facing = p.input.aim;
      if (p.input.shoot && !p.buffs.dash) this.firePlayerWeapon(p);
      if (p.input.q && !p._qH) this.useQ(p); if (p.input.e && !p._eH) this.useE(p); if (p.input.dash && !p._dH) this.useDash(p);
      // v1.71 — il tasto della cintura vale sul FRONTE di salita: tenerlo premuto beve una volta sola.
      if (p.input.pot && p.input.pot !== p._potH) this.usePotion(p, p.input.pot - 1);
      p._qH = p.input.q; p._eH = p.input.e; p._dH = p.input.dash; p._potH = p.input.pot;
    }
  }
  updateMonsters(dt) {
    const ctx = this.makeCtx(); const tf = this.bulletTime ? this.bulletTime.factor : 1;
    for (const m of this.monsters) { if (m.dead) continue; if (m.hitFlash) m.hitFlash = Math.max(0, m.hitFlash - dt);
      // veleno (boon)
      // v1.79.2 — il veleno fa una QUOTA DEL COLPO che l'ha applicato (5% al secondo), non un numero
      // fisso: cosi' non diventa irrilevante all'ondata 15 ne' sproporzionato alla prima.
      if (m.poison > 0 && m.poisonT > 0) { m.poisonT -= dt; m.poisonTick = (m.poisonTick || 0) + dt; if (m.poisonTick > 0.5) { m.poisonTick = 0; this.damageMonster(m, Math.max(1, Math.round(m.poison * 0.5)), m.x, m.y - 1, 0, this.players.get(m.poisonSrc)); if (m.dead) continue; } }
      let slow = 1; if (m.slowT > 0) { m.slowT -= dt; slow = 0.5; }
      // v1.79.2 — CAMPO DI LENTEZZA: un'aura passiva attorno al mago. Non fa danno: rende lo spazio suo.
      for (const q of this.alivePlayers) { if (!(q.boon && q.boon.lentezza > 0)) continue; if (MU.dist2(q.x, q.y, m.x, m.y) <= q.boon.lentezza * q.boon.lentezza) { slow *= 0.75; break; } }
      const ld = dt * tf; const pd = ctx.dt; ctx.dt = ld; AI.update(m, ctx); ctx.dt = pd; const cu = 1;   // v1.80 — RECUPERO DI DISTANZA SPENTO: chi stava oltre 340 px correva fino a 2,1x per rientrare. Serviva quando i lontani vagavano a caso; adesso che ti cercano tutti faceva arrivare l'ondata in blocco. Senza, arriva a scaglioni.
      const px0 = m.x, py0 = m.y; const wantMove = (Math.abs(m.mx) + Math.abs(m.my)) > 4; // v1.43 — misura intento vs spostamento reale
      // v1.61 — ATTRAVERSA I MURI (def.phasing, Fuoco Fatuo): niente moveCircle, niente _unstuck, niente
      // anti-incastro — quelle tre cose esistono per RIMETTERE FUORI dai muri, qui il muro non conta.
      // Resta il solo vincolo dei bordi mappa, altrimenti uscirebbe dalla griglia.
      if (m.def.phasing) {
        const T = C.TILE;
        m.x = MU.clamp(m.x + (m.mx || 0) * ld * cu * slow, T * 0.5, (this.map.w - 0.5) * T);
        m.y = MU.clamp(m.y + (m.my || 0) * ld * cu * slow, T * 0.5, (this.map.h - 0.5) * T);
        m._stuckT = 0;
      } else {
      this.moveCircle(m, (m.mx || 0) * ld * cu * slow, (m.my || 0) * ld * cu * slow); if (this.isWallAt(m.x, m.y)) this._unstuck(m);
      // v1.43 — RILEVA INCASTRO (per TUTTI, boss compresi): se voleva muoversi ma non ha avanzato, accumula; poi recupera.
      if (wantMove) { const moved = MU.dist(m.x, m.y, px0, py0); const want = MU.len(m.mx, m.my) * ld * cu * slow; if (moved < want * 0.3) { m._stuckT = (m._stuckT || 0) + dt; if (m._stuckT > 0.35) { this._recoverStuck(m, Math.atan2(m.my, m.mx)); if (m._stuckT > 1.4) { m._stuckT = 0; } } } else m._stuckT = 0; } else m._stuckT = 0;
      }
      const t = this.tileAtWorld(m.x, m.y); if (t === C.T_HAZARD) { m.hazT = (m.hazT || 0) + dt; if (m.hazT > 0.3) { m.hp -= 8; m.hazT = 0; if (m.hp <= 0) this.killMonster(m, null); } } }
    this._separate(); this._pushOff();
    if (this.monsters.some(m => m.dead)) this.monsters = this.monsters.filter(m => !m.dead);
  }
  _separate() { const a = this.monsters; for (let i = 0; i < a.length; i++) { const x = a[i]; if (x.def.phasing) continue; for (let j = i + 1; j < Math.min(a.length, i + 8); j++) { const y = a[j]; if (y.def.phasing) continue; const dx = y.x - x.x, dy = y.y - x.y, rr = x.radius + y.radius, d2 = dx * dx + dy * dy; if (d2 < rr * rr && d2 > 0.0001) { const d = Math.sqrt(d2), ov = (rr - d) * 0.5, nx = dx / d, ny = dy / d; if (!x.def.immobile && !this.isWallAt(x.x - nx * ov, x.y - ny * ov)) { x.x -= nx * ov; x.y -= ny * ov; } if (!y.def.immobile && !this.isWallAt(y.x + nx * ov, y.y + ny * ov)) { y.x += nx * ov; y.y += ny * ov; } } } } }
  // v1.61 — i nemici IMMOBILI (Fungo) non vengono spinti ne dai giocatori ne dagli altri mostri:
  // sono piantati per design, e se scivolano il loro presidio del terreno perde senso.
  _pushOff() { for (const p of this.alivePlayers) { if (p.buffs.dash > 0) continue; const clear = p.radius + 4; for (const m of this.monsters) { if (m.dead || m.def.immobile) continue; const dx = m.x - p.x, dy = m.y - p.y; const minD = clear + m.radius * 0.6; const d2 = dx * dx + dy * dy; if (d2 < minD * minD && d2 > 0.0001) { const d = Math.sqrt(d2), ov = minD - d, nx = dx / d, ny = dy / d; let tx = m.x + nx * ov, ty = m.y + ny * ov; if (!this.isWallAt(tx, ty)) { m.x = tx; m.y = ty; continue; } const tanx = -ny, tany = nx; for (const s of [1, -1]) { const sx = m.x + tanx * s * ov, sy = m.y + tany * s * ov; if (!this.isWallAt(sx, sy)) { m.x = sx; m.y = sy; break; } } } } } }
  updateBullets(dt) {
    const tf = this.bulletTime ? this.bulletTime.factor : 1;
    for (const b of this.bullets) { if (b.dead) continue; const bdt = b.hostile ? dt * tf : dt; if (b.grenade) { b.vx *= 0.96; b.vy *= 0.96; b.fuse -= dt; }
      if (b.homing > 0 && !b.grenade) { let tgt = null, bd = 260 * 260; for (const mm of this.monsters) { if (mm.dead) continue; const dd = MU.dist2(b.x, b.y, mm.x, mm.y); if (dd < bd) { bd = dd; tgt = mm; } } if (tgt) { const sp = Math.hypot(b.vx, b.vy) || 1; const cur = Math.atan2(b.vy, b.vx); const des = Math.atan2(tgt.y - b.y, tgt.x - b.x); const na = MU.turnToward(cur, des, Math.min(0.32, 0.14 * b.homing)); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; } }
      b.x += b.vx * bdt; b.y += b.vy * bdt; b.life -= bdt;
      if (this.isWallAt(b.x, b.y)) { if (b.bounce > 0) { b.bounce--; if (this.isWallAt(b.x - b.vx * bdt, b.y)) b.vx *= -1; if (this.isWallAt(b.x, b.y - b.vy * bdt)) b.vy *= -1; } else if (b.grenade) { b.fuse = Math.min(b.fuse, 0.02); } else { b.dead = true; this.events.push({ t: 'spark', x: b.x, y: b.y, c: b.color }); } }
      if (b.life <= 0 && !b.grenade) b.dead = true; if (b.grenade && b.fuse <= 0) { this._explode(b); b.dead = true; continue; } if (b.dead) continue;
      if (b.hostile) { for (const p of this.alivePlayers) { if (p.buffs.iframe || p.buffs.i_invuln) continue; if (MU.circleHit(b.x, b.y, b.r, p.x, p.y, p.radius)) { this.damagePlayer(p, b.dmg, b.x, b.y, 1); if (b.curse) this.cursePlayer(p); b.dead = true; break; } } }
      else { for (const m of this.monsters) { if (m.dead) continue; if (MU.circleHit(b.x, b.y, b.r, m.x, m.y, m.radius)) { if (b.hitSet && b.hitSet.has(m.eid)) continue; const src = this.players.get(b.owner); this.damageMonster(m, b.dmg, b.x, b.y, b.knock || 0, src, { crit: b.crit, stun: b.stun, slow: b.slow, poison: b.poison }); if (b.bleed) { m.bleed = (m.bleed || 0) + b.bleed; m.bleedT = 3; m.bleedSrc = b.owner; } if (b.chain && src && !m.dead) this._chain(m, src, b.chain, b.chainFull ? b.dmg : Math.round(b.dmg * 0.25));
          // v1.79.2 — FRATTURA ARCANA: se la bolla ha ucciso, si spacca in due bolle minori. Le figlie
          // portano `figlia` e non si dividono a loro volta: senza quel freno una folla fitta genererebbe
          // una reazione a catena senza fine.
          if (m.dead && b.frattura && !b.figlia && src) {
            const ang0 = Math.atan2(b.vy, b.vx), vel = Math.hypot(b.vx, b.vy) || 320;
            for (const dv of [-0.45, 0.45]) { const a2 = ang0 + dv;
              this.bullets.push({ eid: NEXT++, hostile: false, owner: b.owner, x: m.x, y: m.y, vx: Math.cos(a2) * vel, vy: Math.sin(a2) * vel, r: Math.max(4, b.r * 0.7), dmg: Math.max(1, Math.round(b.dmg * 0.5)), color: b.color, life: 0.55, crit: false, pierce: 0, knock: 0, bubble: b.bubble, figlia: 1 }); }
            this.events.push({ t: 'frattura', x: m.x, y: m.y, c: b.color });
          } if (b.implode) { this._implodeAt(b.x, b.y, 150, Math.round(b.dmg * 0.6), src); b.dead = true; break; }
          if (b.explosive) { this._explodeAt(b.x, b.y, b.boomR || 90, Math.round(b.dmg * (b.boomQ || (src && src.boon.explodeQuota) || 1.2)), src); if (src && src.boon.toxicBurst) this._toxicBurst(b.x, b.y, 90, src); this.events.push({ t: 'explosion', x: b.x, y: b.y, r: b.boomR || 90, toxic: (src && src.boon.toxicBurst) ? 1 : 0 }); b.dead = true; break; } if (b.pierce > 0) { b.pierce--; if (!b.hitSet) b.hitSet = new Set(); b.hitSet.add(m.eid); } else { b.dead = true; break; } } } }
    }
    if (this.bullets.some(b => b.dead)) this.bullets = this.bullets.filter(b => !b.dead);
    for (const m of this.monsters) { if (m.bleedT > 0) { m.bleedT -= dt; m.bleedTick = (m.bleedTick || 0) + dt; if (m.bleedTick > 0.5) { m.bleedTick = 0; this.damageMonster(m, m.bleed * 2, m.x, m.y - 1, 0, this.players.get(m.bleedSrc)); } } }
  }
  _explode(b) { this.events.push({ t: 'explosion', x: b.x, y: b.y, r: b.boomR }); this._explodeAt(b.x, b.y, b.boomR, b.boomDmg, this.players.get(b.owner)); }
  _explodeAt(x, y, r, dmg, src) { for (const m of this.monsters) if (!m.dead && MU.dist(x, y, m.x, m.y) <= r + m.radius) this.damageMonster(m, dmg, x, y, 120, src); }
  // v1.79 — IMPLOSIONE. Non e' un'esplosione al contrario per modo di dire: i nemici nel raggio vengono
  // TIRATI verso il punto d'impatto e restano fermi otto decimi di secondo. Serve a fare quello che al
  // mago manca — radunare una folla sparsa in un punto solo — non a fare danno, che infatti e' il 60%.
  // I boss non si spostano: trascinare un boss sarebbe piu' forte di qualunque altra abilita' del gioco.
  _implodeAt(x, y, r, dmg, src) {
    for (const m of this.monsters) {
      if (m.dead) continue;
      const d = MU.dist(x, y, m.x, m.y);
      if (d > r + m.radius) continue;
      this.damageMonster(m, dmg, x, y, 0, src);
      if (m.dead || m.boss) continue;
      const n = MU.norm(x - m.x, y - m.y);
      const passo = Math.min(d * 0.6, 120);
      this.moveCircle(m, n.x * passo, n.y * passo);
      if (this.isWallAt(m.x, m.y)) this._unstuck(m);
      m.stun = Math.max(m.stun || 0, 0.8);
    }
    this.events.push({ t: 'implode', x, y, r });
  }
  _toxicBurst(x, y, r, src) { const pz = 1 + (src.boon.poison || 0); for (const m of this.monsters) { if (m.dead) continue; if (MU.dist(x, y, m.x, m.y) <= r + m.radius) { m.poison = Math.max(m.poison || 0, pz); m.poisonT = 3; m.poisonSrc = src.id; } } }
  updateOrbs(dt) { for (const o of this.orbs) { if (o.dead) continue; o.t -= dt; if (o.t <= 0) { o.dead = true; continue; }
      if (o.turret) { o.fireCd -= dt; let tgt = null, bd = o.range * o.range; for (const m of this.monsters) { if (m.dead) continue; const d2 = MU.dist2(o.x, o.y, m.x, m.y); if (d2 < bd && this.losClear(o.x, o.y, m.x, m.y)) { bd = d2; tgt = m; } } if (tgt) { o.aim = Math.atan2(tgt.y - o.y, tgt.x - o.x); if (o.fireCd <= 0) { o.fireCd = 0.3; const sp = 820; this.bullets.push({ eid: NEXT++, hostile: false, owner: o.owner, x: o.x, y: o.y, vx: Math.cos(o.aim) * sp, vy: Math.sin(o.aim) * sp, r: 5, dmg: o.dmg, color: '#9fe0ff', life: o.range / sp, pierce: 0, knock: 40 }); this.events.push({ t: 'turret_fire', x: o.x, y: o.y, a: o.aim }); } } continue; }
      if (o.rift) { for (const m of this.monsters) { const d = MU.dist(o.x, o.y, m.x, m.y); if (d < o.r && !m.boss) { const n = MU.norm(o.x - m.x, o.y - m.y); this.moveCircle(m, n.x * 120 * dt, n.y * 120 * dt); m.tickR = (m.tickR || 0) + dt; if (m.tickR > 0.25) { m.tickR = 0; this.damageMonster(m, o.dmg * 0.25, o.x, o.y, 0, this.players.get(o.owner)); } } } } } if (this.orbs.some(o => o.dead)) this.orbs = this.orbs.filter(o => !o.dead); }
  updateMeteors(dt) { for (const mt of this.meteors) { mt.t -= dt; if (mt.t <= 0 && !mt.done) { mt.done = true; this.events.push({ t: 'explosion', x: mt.x, y: mt.y, r: mt.r }); for (const p of this.alivePlayers) if (MU.dist(mt.x, mt.y, p.x, p.y) <= mt.r + p.radius && !p.buffs.iframe && !p.buffs.i_invuln) this.damagePlayer(p, mt.dmg, mt.x, mt.y, 2); } } this.meteors = this.meteors.filter(m => !m.done); }
  updateZones(dt) { for (const z of this.zones) { if (z.done) continue; z.t -= dt; if (z.t <= 0) { z.done = true; this.events.push({ t: 'zone_hit', x: z.x, y: z.y, r: z.r, c: z.col }); for (const p of this.alivePlayers) if (MU.dist(z.x, z.y, p.x, p.y) <= z.r + p.radius && !p.buffs.iframe && !p.buffs.i_invuln) this.damagePlayer(p, z.dmg, z.x, z.y, 2.4); } } if (this.zones.some(z => z.done)) this.zones = this.zones.filter(z => !z.done); }

  // v1.68 — SNAPSHOT MAGRO. I mostri erano il 90% del traffico (120 byte l'uno, 20 volte al secondo), ma
  // due terzi di quei byte non cambiavano MAI dopo la comparsa: il tipo, i PV massimi, i flag elite/boss/
  // mega/tesoro. Ora la parte immutabile viaggia UNA VOLTA SOLA, nel primo snapshot in cui il mostro
  // compare, e il client se la tiene (net.js -> _reidrata). I flag che valgono 0 non si mandano affatto:
  // "assente" e "0" sono la stessa cosa e il client li rimette a 0.
  //
  //   modalita' `slim`  → per la trasmissione continua: parte immutabile solo per i mostri nuovi
  //   modalita' piena   → per chi ENTRA adesso (non ha nessuna cache) e per i test: tutto, sempre
  //
  // Il default e' PIENO di proposito: chiamare snapshot() senza argomenti deve dare un oggetto completo
  // e autosufficiente, altrimenti un test o un futuro chiamante otterrebbe record monchi senza accorgersene.
  snapshot(slim) {
    const players = [];
    for (const p of this.players.values()) {
      const tb = []; for (const k of ['b_dmg', 'b_speed', 'b_rate', 'b_shield', 'b_regen', 'b_quad', 'i_speed', 'i_armor', 'i_power', 'i_rage', 'i_invuln', 'po_dmg', 'po_rate', 'po_speed', 'po_armor', 'po_regen']) if (p.buffs[k] > 0) tb.push(k);
      const nuovo = !slim || !p._sent; if (slim) p._sent = 1;
      const pr = Lv.progress(p.xpPool);
      const o = { i: p.id, x: Math.round(p.x), y: Math.round(p.y), a: +p.aim.toFixed(2), hp: Math.round(p.hp), mhp: Math.round(this.effMaxHp(p)), lv: p.lives, cd: +p.cdDash.toFixed(1), k: p.kills, xp: p.xpPool, co: p.coins || 0, cmx: +this.comboMult(p).toFixed(2), lvl: p.level, prg: +pr.frac.toFixed(2), pt: p.points };
      if (p.spec) o.sp = p.spec;
      if (nuovo) { o.n = p.name; o.h = p.heroId; }                       // nome ed eroe: immutabili in partita
      o.wp = p.gear ? p.gear.weapon : null; o.sh = p.gear ? p.gear.shield : null;
      if (p.dead) o.d = 1;
      if (p.down) { o.dn = 1; o.dt = +Math.max(0, p.downT).toFixed(1); }
      if (p.hitFlash > 0) o.bf = 1;
      if (p.buffs.barrier > 0) o.bar = 1;
      if (p.buffs.dash > 0) o.dash = 1;
      if (p.buffs.phase > 0) o.ph = 1;
      if (p.buffs.i_invuln > 0 || p.buffs.iframe > 0) o.iv = 1;
      if (p.buffs.curse > 0) o.cu = 1;
      if (tb.length) o.tb = tb;
      if (p.weapon2) { o.w2 = p.weapon2.evolved || p.weapon2.type; o.w2l = p.weapon2.level; if (p.weapon2.evolved) o.evo = 1; }
      if (p.combo) o.cmb = p.combo;
      if (p.comboT > 0) o.cmt = +(p.comboT / C.COMBO_TIME).toFixed(2);
      if (p.edgeLv > 0.001) o.eg = +p.edgeLv.toFixed(2);
      if (p._nearMerch) o.nm = 1;
      if (p._nearDark) o.nmd = 1;
      if (p._nearGear) o.ng = 1;
      if (p._nearHerb) o.nh = 1;
      if (p._nearBnd) o.nb = 1;
      if (p._nearSeer) o.ns = 1;
      if (p._nearInn) o.ni = 1;
      // v1.72 — la taglia in corso viaggia sempre: senza vederla in partita te ne dimentichi.
      if (p.bounty) o.bo = { k: p.bounty.k, h: p.bounty.have, n: p.bounty.n, i: p.bounty.icon, c: p.bounty.color, t: p.bounty.testo };
      // v1.71 — la cintura viaggia compatta: uno 0 per lo slot vuoto, [indice, cariche] per gli altri.
      if (p.belt.some(s => s)) o.bt = p.belt.map(s => s ? [Pot.BY_ID[s.id].idx, s.n] : 0);
      if (p.potCd > 0) o.pcd = +(p.potCd / (p.potCdMax || Pot.COOLDOWN)).toFixed(2);
      const gz = p.buffs.gz_weaken > 0 ? 'weaken' : p.buffs.gz_slow > 0 ? 'slow' : p.buffs.gz_sunder > 0 ? 'sunder' : 0;
      if (gz) o.gz = gz;
      players.push(o);
    }
    // v1.59 — per il Beholder si manda anche gt: quanto manca al cambio di sguardo (0 = sta per cambiare).
    // Serve al client per ANTICIPARE il telegrafo sul corpo invece di limitarsi a reagire dopo.
    const mon = [];
    for (const m of this.monsters) {
      const nuovo = !slim || !m._sent; if (slim) m._sent = 1;
      const o = { e: m.eid, x: Math.round(m.x), y: Math.round(m.y), f: +m.facing.toFixed(2), hp: Math.round(m.hp) };
      if (nuovo) {                                                        // parte immutabile: una volta sola
        o.t = m.type; o.mhp = m.maxHp;
        if (m.elite) o.el = 1; if (m.boss) o.b = 1; if (m.mega) o.mg = 1;
      }
      if (m.hitFlash > 0) o.fl = 1;
      if (m.shielded > 0) o.sh = 1;
      if (m.poison > 0 && m.poisonT > 0) o.ps = 1;
      if (m.type === 'occhio') {
        o.gk = m.gazeKind; o.gt = +Math.max(0, Math.min(1, (m.gazeCycleT || 0) / (m.def.gazeCycle || 4))).toFixed(2);
        if (m.gazeActive) { o.gz = 1; o.gtx = Math.round(m.gazeTx); o.gty = Math.round(m.gazeTy); }
      }
      if (m.type === 'darkmage' && m.alert) o.al = 1;
      mon.push(o);
    }
    const bul = []; for (const b of this.bullets) { const o = { e: b.eid, x: Math.round(b.x), y: Math.round(b.y), h: b.hostile ? 1 : 0, c: b.color, r: b.r, g: b.grenade ? 1 : 0 }; if (b.bubble) o.bb = 1; if (b.arrow) { o.ar = 1; o.a = Math.round(Math.atan2(b.vy, b.vx) * 100); } bul.push(o); }
    const orbs = []; for (const o of this.orbs) orbs.push({ e: o.eid, x: Math.round(o.x), y: Math.round(o.y), r: Math.round(o.r), k: o.turret ? 'turret' : (o.rift ? 'rift' : 'fire'), f: o.aim != null ? +o.aim.toFixed(2) : 0, tt: o.turret ? +Math.max(0, o.t).toFixed(1) : 0 });
    const met = []; for (const m of this.meteors) met.push({ x: Math.round(m.x), y: Math.round(m.y), r: m.r, p: +(1 - m.t / m.max).toFixed(2) });
    const zones = []; for (const z of this.zones) zones.push({ x: Math.round(z.x), y: Math.round(z.y), r: z.r, p: +(1 - z.t / z.max).toFixed(2), c: z.col });
    const crates = []; for (const c of this.crates) crates.push({ e: c.eid, x: Math.round(c.x), y: Math.round(c.y) });
    const wdrops = []; for (const d of this.weaponDrops) wdrops.push({ e: d.eid, x: Math.round(d.x), y: Math.round(d.y), wt: d.wt, lv: d.level });
    const xp = []; for (const o of this.groundXp) xp.push({ e: o.eid, x: Math.round(o.x), y: Math.round(o.y) });
    const coins = []; for (const o of this.groundCoins) coins.push({ e: o.eid, x: Math.round(o.x), y: Math.round(o.y), c: o.cid });
    const items = []; for (const it of this.items) items.push({ e: it.eid, x: Math.round(it.x), y: Math.round(it.y), id: it.id });
    const s = { t: C.MSG.SNAPSHOT, tick: this.time, phase: this.phase, wave: this.wave, wt: +Math.max(0, this.phase === C.PHASE_CLEARED && this.waveDur != null ? this.waveDur : this.time - this.waveT0).toFixed(1), wp: this.parT || 0, ex: this.phase === C.PHASE_CLEARED ? Object.assign(this._contaUscita(), { t: Math.max(0, Math.ceil(this.exitT || 0)) }) : null, players, mon, bul, orbs, met, crates, wdrops, xp, coins, items, zones, merch: this.merchant ? { x: Math.round(this.merchant.x), y: Math.round(this.merchant.y) } : null, merchD: this.darkMerchant ? { x: Math.round(this.darkMerchant.x), y: Math.round(this.darkMerchant.y) } : null, gmerch: this.gearMerchant ? { x: Math.round(this.gearMerchant.x), y: Math.round(this.gearMerchant.y) } : null, pend: this.pending, mcount: this.monsters.length, bt: this.bulletTime ? 1 : 0, ev: this.events };
    this.events = []; return s;
  }
}
module.exports = { Room };
