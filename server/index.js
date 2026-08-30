/* index.js — entry point server */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { attach } = require('./ws.js');
const { Room } = require('./Room.js');
const C = require('../shared/constants.js');
const PORT = process.env.PORT || 8080;
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const PUBLIC_DIR = path.join(ROOT, 'public'), SHARED_DIR = path.join(ROOT, 'shared');
function serveStatic(req, res) {
  let url = decodeURIComponent(req.url.split('?')[0]); if (url === '/') url = '/public/index.html';
  let fp; if (url.startsWith('/shared/')) fp = path.join(ROOT, url); else if (url.startsWith('/public/')) fp = path.join(ROOT, url); else fp = path.join(PUBLIC_DIR, url);
  const r = path.resolve(fp);
  if (!(r.startsWith(PUBLIC_DIR + path.sep) || r.startsWith(SHARED_DIR + path.sep) || r === PUBLIC_DIR || r === SHARED_DIR)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(r, (err, data) => { if (err) { res.writeHead(404); res.end('not found'); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(r)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(data); });
}
const server = http.createServer(serveStatic);
const rooms = new Map(); let seq = 1;
function getRoom(id) { let r = rooms.get(id); if (!r) { r = new Room(id); rooms.set(id, r); } return r; }
function joinable() { for (const r of rooms.values()) if (r.players.size < C.MAX_PLAYERS && r.phase === C.PHASE_LOBBY) return r; return getRoom('room-' + Math.random().toString(36).slice(2, 7)); }
attach(server, (conn) => {
  const pid = 'p' + (seq++); let room = null, joined = false;
  conn.on('message', (data) => {
    let m; try { m = JSON.parse(data); } catch (_) { return; }
    switch (m.t) {
      case C.MSG.HELLO: { room = m.room ? getRoom(m.room) : joinable(); if (room.players.size >= C.MAX_PLAYERS) { conn.send(JSON.stringify({ t: 'full' })); conn.close(); return; } const p = room.addPlayer(pid, conn, m.name, m.hero); joined = true; conn.send(JSON.stringify({ t: C.MSG.WELCOME, id: pid, room: room.id, map: room.map, phase: room.phase, wave: room.wave, players: [...room.players.values()].map(x => ({ i: x.id, n: x.name, h: x.heroId })) })); room.broadcast({ t: C.MSG.EVENT, ev: { t: 'join', id: pid, name: p.name, count: room.players.size } }); break; }
      case C.MSG.INPUT: if (room) room.setInput(pid, m); break;
      case 'start': if (room) room.startGame(); break;
      case C.MSG.BUY_STAT: if (room) room.buyStat(pid, m.id); break;
      case C.MSG.BUY_GEAR: if (room) room.buyGear(pid, m.id); break;
      case C.MSG.BUY_MERCHANT: if (room) { if (m.dark) room.buyDark(pid, m.id); else room.buyMerchant(pid, m.id); } break;
      case C.MSG.PICK_BOON: if (room) room.pickBoon(pid, m.id); break;
      case C.MSG.PICK_RANK: if (room) room.pickRank(pid, m.id); break;
      case C.MSG.PICK_POTION: if (room) room.pickPotion(pid, m.slot, m.id); break;
      case C.MSG.BUY_POTION: if (room) room.buyPotion(pid, m.slot); break;
      case C.MSG.TAKE_BOUNTY: if (room) room.takeBounty(pid, m.i); break;
      case C.MSG.SELL_GEAR: if (room) room.sellGear(pid, m.id); break;
      case C.MSG.TOGGLE_CARD: if (room) room.toggleCard(pid, m.id); break;
      case C.MSG.REST: if (room) room.restAtInn(pid); break;
      case C.MSG.SHOP_READY: if (room) room.shopReady(pid, m.dest); break;
      case 'sethero': if (room) { const p = room.players.get(pid); if (p && room.phase === C.PHASE_LOBBY) { const H = require('../shared/heroes.js').HEROES; if (H[m.hero]) { p.heroId = m.hero; p.hero = H[m.hero]; p.maxHp = p.hero.hp; p.hp = p.hero.hp; room.broadcast({ t: C.MSG.EVENT, ev: { t: 'herochange', id: pid, hero: m.hero } }); } } } break;
      case C.MSG.CHAT: if (room) room.broadcast({ t: C.MSG.CHAT, from: (room.players.get(pid) || {}).name || '???', text: String(m.text || '').slice(0, 120) }); break;
      case C.MSG.PING: conn.send(JSON.stringify({ t: C.MSG.PONG, ts: m.ts })); break;
    }
  });
  conn.on('close', () => { if (room && joined) { room.removePlayer(pid); room.broadcast({ t: C.MSG.EVENT, ev: { t: 'leave', id: pid } }); setTimeout(() => { if (room && !room.anyConnected) rooms.delete(room.id); }, 2000); } });
});
const TICK = 1000 / C.TICK_RATE, SNAP = 1000 / C.SNAPSHOT_RATE; let last = Date.now();
setInterval(() => { const now = Date.now(); let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1; for (const r of rooms.values()) { if (!r.anyConnected) continue; r.update(dt); } }, TICK);
// v1.68 — lo snapshot continuo e' MAGRO (la parte immutabile dei mostri viaggia una volta sola). Chi entra
// adesso non ha ancora nessuna cache, quindi riceve uno snapshot PIENO: una sola serializzazione in piu',
// e solo nel tick in cui qualcuno si collega.
setInterval(() => {
  for (const r of rooms.values()) {
    if (!r.anyConnected) continue;
    const magro = JSON.stringify(r.snapshot(true)); let pieno = null;
    for (const p of r.players.values()) {
      if (!p.conn) continue;
      try {
        // NB: snapshot() svuota la coda degli eventi, e la svuota il PRIMO che la chiama — cioe' quello
        // magro, che va a tutti. Chi riceve il pieno in questo tick vede quindi ev vuoto: e' appena entrato,
        // e gli eventi di quel singolo tick sono scintille e righe di killfeed, non stato di gioco.
        if (p._needFull) { pieno = pieno || JSON.stringify(r.snapshot()); p.conn.send(pieno); p._needFull = false; }
        else p.conn.send(magro);
      } catch (_) {}
    }
  }
}, SNAP);
server.listen(PORT, () => { console.log('=================================================='); console.log('  ⚔️  DUNGEON RIFT — http://localhost:' + PORT); console.log('=================================================='); });
