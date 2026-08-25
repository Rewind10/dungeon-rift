/* net.js — client di rete (WebSocket) + interpolazione */
(function () {
  'use strict';
  const C = window.GAME.Constants;
  const Net = {
    ws: null, id: null, room: null, connected: false,
    onWelcome: null, onMap: null, onSnapshot: null, onEvent: null, onOfferShop: null, onOfferBoon: null, onOfferGear: null, onOfferMerchant: null, onChat: null,
    snaps: [], maxSnaps: 3, ping: 0,
    connect(name, hero, room) { const pr = location.protocol === 'https:' ? 'wss' : 'ws'; this.ws = new WebSocket(pr + '://' + location.host); this.ws.onopen = () => { this.send({ t: C.MSG.HELLO, name, hero, room: room || '' }); this._ping(); }; this.ws.onmessage = e => this._recv(e.data); this.ws.onclose = () => { this.connected = false; if (this.onClose) this.onClose(); }; this.ws.onerror = () => {}; },
    send(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); },
    sendInput(i) { i.t = C.MSG.INPUT; this.send(i); },
    start() { this.send({ t: 'start' }); },
    buyStat(id) { this.send({ t: C.MSG.BUY_STAT, id }); },
    buyGear(slot) { this.send({ t: C.MSG.BUY_GEAR, slot }); },
    buyMerchant(id, dark) { this.send({ t: C.MSG.BUY_MERCHANT, id, dark: dark ? 1 : 0 }); },
    pickBoon(id) { this.send({ t: C.MSG.PICK_BOON, id }); },
    shopReady(dest) { this.send({ t: C.MSG.SHOP_READY, dest: dest || 'wave' }); },  // v1.53 — 'wave' | 'market'
    setHero(h) { this.send({ t: 'sethero', hero: h }); },
    chat(text) { this.send({ t: C.MSG.CHAT, text }); },
    _ping() { setInterval(() => this.send({ t: C.MSG.PING, ts: performance.now() }), 2000); },
    _recv(data) { let m; try { m = JSON.parse(data); } catch (_) { return; } switch (m.t) {
      case C.MSG.WELCOME: this.id = m.id; this.room = m.room; this.connected = true; if (this.onWelcome) this.onWelcome(m); break;
      case C.MSG.MAP: if (this.onMap) this.onMap(m); break;
      case C.MSG.SNAPSHOT: m._recv = performance.now(); this.snaps.push(m); while (this.snaps.length > this.maxSnaps + 1) this.snaps.shift(); if (this.onSnapshot) this.onSnapshot(m); break;
      case C.MSG.EVENT: if (this.onEvent) this.onEvent(m.ev); break;
      case C.MSG.OFFER_SHOP: if (this.onOfferShop) this.onOfferShop(m); break;
      case C.MSG.OFFER_BOON: if (this.onOfferBoon) this.onOfferBoon(m); break;
      case C.MSG.OFFER_GEAR: if (this.onOfferGear) this.onOfferGear(m); break;
      case C.MSG.BOONS: if (this.onBoons) this.onBoons(m); break;  // v1.51 — poteri attivi
      case C.MSG.OFFER_MERCHANT: if (this.onOfferMerchant) this.onOfferMerchant(m); break;
      case C.MSG.CHAT: if (this.onChat) this.onChat(m); break;
      case C.MSG.PONG: this.ping = Math.round(performance.now() - m.ts); break;
      case 'full': if (this.onFull) this.onFull(); break;
    } },
    interpPair() { const now = performance.now(); const rt = now - 100; const s = this.snaps; if (!s.length) return null; if (s.length === 1) return [s[0], s[0], 0]; for (let i = s.length - 1; i > 0; i--) { if (s[i - 1]._recv <= rt && s[i]._recv >= rt) { const span = s[i]._recv - s[i - 1]._recv || 1; return [s[i - 1], s[i], Math.max(0, Math.min(1, (rt - s[i - 1]._recv) / span))]; } } return [s[s.length - 2], s[s.length - 1], 1]; },
    latest() { return this.snaps[this.snaps.length - 1] || null; },
  };
  window.Net = Net;
})();
