/* net.js — client di rete (WebSocket) + interpolazione */
(function () {
  'use strict';
  const C = window.GAME.Constants;
  const Net = {
    ws: null, id: null, room: null, connected: false,
    onWelcome: null, onMap: null, onSnapshot: null, onEvent: null, onOfferShop: null, onOfferBoon: null, onOfferRank: null, onOfferGear: null, onOfferMerchant: null, onOfferPotion: null, onOfferBandit: null, onOfferSeer: null, onOfferInn: null, onChat: null,
    snaps: [], maxSnaps: 3, ping: 0,
    connect(name, hero, room) { const pr = location.protocol === 'https:' ? 'wss' : 'ws'; this.ws = new WebSocket(pr + '://' + location.host); this.ws.onopen = () => { this.send({ t: C.MSG.HELLO, name, hero, room: room || '' }); this._ping(); }; this.ws.onmessage = e => this._recv(e.data); this.ws.onclose = () => { this.connected = false; if (this.onClose) this.onClose(); }; this.ws.onerror = () => {}; },
    send(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); },
    sendInput(i) { i.t = C.MSG.INPUT; this.send(i); },
    start() { this.send({ t: 'start' }); },
    buyStat(id) { this.send({ t: C.MSG.BUY_STAT, id }); },
    buyGear(id) { this.send({ t: C.MSG.BUY_GEAR, id }); },
    buyMerchant(id, dark) { this.send({ t: C.MSG.BUY_MERCHANT, id, dark: dark ? 1 : 0 }); },
    pickBoon(id) { this.send({ t: C.MSG.PICK_BOON, id }); },
    pickRank(id) { this.send({ t: C.MSG.PICK_RANK, id }); },
    pickPotion(slot, id) { this.send({ t: C.MSG.PICK_POTION, slot, id }); },
    buyPotion(slot) { this.send({ t: C.MSG.BUY_POTION, slot }); },
    takeBounty(i) { this.send({ t: C.MSG.TAKE_BOUNTY, i }); },
    sellGear(id) { this.send({ t: C.MSG.SELL_GEAR, id }); },
    toggleCard(id) { this.send({ t: C.MSG.TOGGLE_CARD, id }); },
    rest() { this.send({ t: C.MSG.REST }); },
    shopReady(dest) { this.send({ t: C.MSG.SHOP_READY, dest: dest || 'wave' }); },  // v1.53 — 'wave' | 'market'
    setHero(h) { this.send({ t: 'sethero', hero: h }); },
    chat(text) { this.send({ t: C.MSG.CHAT, text }); },
    // v1.68 — SNAPSHOT MAGRO: il server manda la parte immutabile di mostri e giocatori (tipo, PV massimi,
    // nome, eroe, flag elite/boss/tesoro) SOLO nel primo snapshot in cui l'entita' compare, e omette del
    // tutto i flag che valgono 0. Qui la si rimette a posto, cosi' il resto del client continua a vedere
    // record completi e non sa nulla di questa compressione.
    // La cache si svuota da sola: cio' che non e' nell'ultimo snapshot e' morto o sparito.
    _statMon: new Map(), _statPla: new Map(),
    _reidrata(s) {
      const M = this._statMon, P = this._statPla;
      if (Array.isArray(s.mon)) {
        const vivi = new Set();
        for (const m of s.mon) {
          vivi.add(m.e);
          if (m.t !== undefined) M.set(m.e, { t: m.t, mhp: m.mhp, el: m.el || 0, b: m.b || 0, mg: m.mg || 0, tr: m.tr || 0 });
          const st = M.get(m.e);
          if (st) { m.t = st.t; m.mhp = st.mhp; m.el = st.el; m.b = st.b; m.mg = st.mg; m.tr = st.tr; }
          m.fl = m.fl || 0; m.sh = m.sh || 0; m.ps = m.ps || 0; m.al = m.al || 0;
        }
        if (M.size > vivi.size) for (const k of [...M.keys()]) if (!vivi.has(k)) M.delete(k);
      }
      if (Array.isArray(s.players)) {
        const vivi = new Set();
        for (const p of s.players) {
          vivi.add(p.i);
          if (p.n !== undefined) P.set(p.i, { n: p.n, h: p.h });
          const st = P.get(p.i);
          if (st) { p.n = st.n; p.h = st.h; }
          p.d = p.d || 0; p.dn = p.dn || 0; p.dt = p.dt || 0; p.bf = p.bf || 0; p.bar = p.bar || 0;
          p.dash = p.dash || 0; p.ph = p.ph || 0; p.iv = p.iv || 0; p.cu = p.cu || 0;
          p.tb = p.tb || []; p.w2 = p.w2 || null; p.w2l = p.w2l || 0; p.evo = p.evo || 0;
          p.cmb = p.cmb || 0; p.cmt = p.cmt || 0; p.eg = p.eg || 0;
          p.nm = p.nm || 0; p.nmd = p.nmd || 0; p.ng = p.ng || 0; p.gz = p.gz || 0;
        }
        if (P.size > vivi.size) for (const k of [...P.keys()]) if (!vivi.has(k)) P.delete(k);
      }
      return s;
    },
    _ping() { setInterval(() => this.send({ t: C.MSG.PING, ts: performance.now() }), 2000); },
    _recv(data) { let m; try { m = JSON.parse(data); } catch (_) { return; } switch (m.t) {
      case C.MSG.WELCOME: this.id = m.id; this.room = m.room; this.connected = true; if (this.onWelcome) this.onWelcome(m); break;
      case C.MSG.MAP: if (this.onMap) this.onMap(m); break;
      case C.MSG.SNAPSHOT: this._reidrata(m); m._recv = performance.now(); this.snaps.push(m); while (this.snaps.length > this.maxSnaps + 1) this.snaps.shift(); if (this.onSnapshot) this.onSnapshot(m); break;
      case C.MSG.EVENT: if (this.onEvent) this.onEvent(m.ev); break;
      case C.MSG.OFFER_SHOP: if (this.onOfferShop) this.onOfferShop(m); break;
      case C.MSG.OFFER_BOON: if (this.onOfferBoon) this.onOfferBoon(m); break;
      case C.MSG.OFFER_RANK: if (this.onOfferRank) this.onOfferRank(m); break;
      case C.MSG.OFFER_GEAR: if (this.onOfferGear) this.onOfferGear(m); break;
      case C.MSG.OFFER_POTION: if (this.onOfferPotion) this.onOfferPotion(m); break;
      case C.MSG.OFFER_BANDIT: if (this.onOfferBandit) this.onOfferBandit(m); break;
      case C.MSG.OFFER_SEER: if (this.onOfferSeer) this.onOfferSeer(m); break;
      case C.MSG.OFFER_INN: if (this.onOfferInn) this.onOfferInn(m); break;
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
