/* hud.js — interfaccia: vite, XP, negozio, BOON, modalità, barra abilità */
(function () {
  'use strict';
  const HERO = window.GAME.Heroes.HEROES, HORDER = window.GAME.Heroes.ORDER, MON = window.GAME.Monsters.MONSTERS, BOSSES = window.GAME.Monsters.BOSSES, LOOT = window.GAME.Loot, RAR = window.GAME.Constants.RARITY;
  const $ = (id) => document.getElementById(id); const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const iconHTML = (ic, cls) => (typeof ic === 'string' && /\.(png|svg|webp|jpg)$/i.test(ic)) ? `<img class="${cls || ''}" src="/${ic}" alt="" draggable="false">` : `<span class="emoji">${ic}</span>`; const HeroIcon = { enforcer: '🤖', recon: '🎖️', glitch: '🕶️' };
  const EVO_NAME = {}; for (const k of Object.keys(LOOT.WEAPONS)) { const w = LOOT.WEAPONS[k]; if (w.evo) EVO_NAME[w.evo.id] = { name: w.evo.name, icon: w.icon, color: w.evo.color }; }
  const HUD = {
    selectedHero: 'enforcer', _boons: null, _stats: null, _gear: null, _active: [],
    buildHeroSelect(cb) { const w = $('heroSelect'); w.innerHTML = ''; HORDER.forEach(id => { const h = HERO[id]; const el = document.createElement('div'); el.className = 'hero-chip' + (id === this.selectedHero ? ' sel' : ''); el.style.setProperty('--pick', h.color); el.innerHTML = `<div class="avatar" style="background:${h.color2};color:${h.accent}">${HeroIcon[id]}</div><div class="hname">${h.name}</div><div class="hrole">${h.title}</div>`; el.onclick = () => { this.selectedHero = id; this.buildHeroSelect(cb); this.showHeroDetail(id); if (cb) cb(id); }; w.appendChild(el); }); this.showHeroDetail(this.selectedHero); },
    showHeroDetail(id) { const h = HERO[id]; $('heroDetail').innerHTML = `<h3 style="color:${h.accent}">${h.name} — <span style="color:#c9d2e6;font-weight:600">${h.title}</span></h3><div class="ab"><span class="k">Q</span><b>${h.abilities.q.name}</b> — ${h.abilities.q.desc}</div><div class="ab"><span class="k">E</span><b>${h.abilities.e.name}</b> — ${h.abilities.e.desc}</div><div class="ab"><span class="k">🖱▸</span><b>Scatto</b> — tasto destro: attraversa i nemici.</div><div class="ab pas">🛡️ ${h.passives.map(p => '<b>' + p.name + '</b>').join(' · ')}</div><div class="sw"><span class="s">▲ ${h.strengths}</span><br><span class="w">▼ ${h.weakness}</span></div>`; },
    buildAbilityBar(id) { const h = HERO[id]; const bar = $('abilityBar'); bar.innerHTML = ''; const qi = (h.abilities.q && h.abilities.q.icon) || '🅠'; const ei = (h.abilities.e && h.abilities.e.icon) || '🅔'; [{ k: 'Q', ic: qi, t: h.abilities.q ? h.abilities.q.name : 'Abilita 1' }, { k: 'E', ic: ei, t: h.abilities.e ? h.abilities.e.name : 'Abilita 2' }, { k: 'DX', ic: '💨', t: 'Scatto' }, { k: 'SX', ic: '🔫', t: 'Fuoco' }].forEach((s, i) => { const el = document.createElement('div'); el.className = 'ab-slot'; el.id = 'ab' + i; el.title = s.t || ''; el.innerHTML = `<span class="key">${s.k}</span><span class="ic">${s.ic}</span><span class="lbl">${s.t || ''}</span><div class="cd hidden"></div>`; bar.appendChild(el); }); },
    updateAbilities(me) { if (!me) return; const set = (i, cd) => { const el = $('ab' + i); if (!el) return; const c = el.querySelector('.cd'); if (cd > 0.1) { c.classList.remove('hidden'); c.textContent = cd.toFixed(1); el.classList.remove('ready'); } else { c.classList.add('hidden'); el.classList.add('ready'); } }; set(0, me.cq); set(1, me.ce); set(2, me.cd || 0); const f = $('ab3'); if (f) f.classList.add('ready'); },
    modeBanner(name, color, desc) { const b = $('modeBanner'); b.innerHTML = `<b style="color:${color}">${name}</b> — ${desc}`; b.style.borderColor = color; b.classList.remove('hidden'); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); clearTimeout(this._mbT); this._mbT = setTimeout(() => b.classList.add('hidden'), 3200); },
    _updateVitals(me) {
      if (!me) return;
      const liq = $('hpLiquid'), surf = $('hpSurface'), flask = $('hpFlask');
      const frac = Math.max(0, Math.min(1, me.hp / (me.mhp || 1)));
      if (liq) {
        const top = 20, bot = 138, yTop = bot - (bot - top) * frac;
        liq.setAttribute('y', yTop.toFixed(1));
        liq.setAttribute('height', (150 - yTop).toFixed(1));
        if (surf) surf.setAttribute('cy', yTop.toFixed(1));
      }
      const val = $('hpVal'), mx = $('hpMax');
      if (val) val.textContent = Math.max(0, Math.ceil(me.hp));
      if (mx) mx.textContent = '/' + me.mhp;
      if (flask) flask.classList.toggle('low', frac <= 0.3);
      const lr = $('lifeRow');
      if (lr) {
        const lv = Math.max(0, me.lv || 0);
        let html = '<span class="lbl">VITE</span>';
        if (lv <= 0) html += '<span class="pip">\uD83D\uDC80</span>';
        else for (let i = 0; i < lv; i++) html += '<span class="pip">\u2764\uFE0F</span>';
        lr.innerHTML = html;
      }
    },
    updateTop(snap, me) {
      $('waveNum').textContent = snap.wave + '/' + window.GAME.Constants.FINAL_WAVE; $('ecNum').textContent = snap.mcount + (snap.pend > 0 ? '+' : '');
      const ph = { combat: 'COMBATTIMENTO', boss: '⚠ BOSS', shop: 'POTENZIAMENTI', lobby: 'LOBBY', gameover: 'SCONFITTA', victory: 'VITTORIA' };
      let phase = ph[snap.phase] || '';
      if (snap.phase === 'combat' && snap.mode === 'survival' && snap.survive > 0) phase = 'SOPRAVVIVI: ' + Math.ceil(snap.survive) + 's';
      $('phaseInfo').textContent = phase;
      if (me) {
        this._updateVitals(me);
        let chips = `<div class="chip">💀 ${me.k}</div><div class="chip" style="color:#8bffb0">✦ ${me.xp} XP</div><div class="chip" style="color:#ffcf4a" title="monete">🪙 ${me.co || 0}</div>`;
        if (me.w2) { let W = LOOT.WEAPONS[me.w2] || EVO_NAME[me.w2] || {}; const evo = me.evo || EVO_NAME[me.w2]; const nm = W.name || 'Arma'; const col = W.color || '#ffd24a'; const pips = me.evo ? '★★★' : ('●'.repeat(me.w2l || 1) + '○'.repeat(3 - (me.w2l || 1))); chips += `<div class="chip buff" style="border-color:${col};color:${col}">${W.icon || '🔫'} ${nm} <b>${pips}</b></div>`; }
        if (me.tb && me.tb.length) { const map = {}; for (const b of LOOT.CRATE_BUFFS) map[b.id] = b; for (const it of LOOT.ITEMS) if (it.buff) map[it.buff] = { name: it.name, icon: it.icon, color: it.color }; chips += me.tb.map(id => { const b = map[id]; return b ? `<div class="chip buff" style="border-color:${b.color};color:${b.color}">${b.icon} ${b.name}</div>` : ''; }).join(''); }
        this._coins = me.co || 0; if (!$('merchantPanel').classList.contains('hidden')) this._renderMerchant();
        $('statChips').innerHTML = chips;
        // v1.6 — combo meter
        const cm = $('comboMeter');
        if (me.cmb && me.cmb >= 3) {
          cm.classList.remove('hidden');
          $('comboN').textContent = me.cmb;
          $('comboMult').textContent = 'x' + (me.cmx || 1).toFixed(1);
          $('comboBar').style.width = Math.round((me.cmt || 0) * 100) + '%';
          if (me.cmb !== this._lastCombo) { cm.classList.remove('pop'); void cm.offsetWidth; cm.classList.add('pop'); this._lastCombo = me.cmb; }
        } else { cm.classList.add('hidden'); this._lastCombo = 0; }
      } else { $('comboMeter').classList.add('hidden'); }
    },
    updateBossBar(snap) { const boss = snap.mon.find(m => m.b); const wrap = $('bossBarWrap'); if (boss) { wrap.classList.remove('hidden'); const def = MON[boss.t] || BOSSES[boss.t] || {}; $('bossName').textContent = (def.name || 'BOSS').toUpperCase(); const bar = wrap.querySelector('#bossBar i'); bar.style.width = (100 * Math.max(0, boss.hp / boss.mhp)) + '%'; bar.style.background = boss.mg ? 'linear-gradient(90deg,#ff2d55,#b061ff)' : 'linear-gradient(90deg,#ff2d55,#ff7a3d)'; } else wrap.classList.add('hidden'); },
    killfeed(text) { const kf = $('centerFeed') || $('killfeed'); const el = document.createElement('div'); el.className = 'cf-item'; el.innerHTML = text; kf.appendChild(el); void el.offsetWidth; el.classList.add('show'); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 2600); while (kf.children.length > 4) kf.removeChild(kf.firstChild); },
    // NEGOZIO (statistiche XP) + BOON
    showShop() { $('upgradeScreen').classList.remove('hidden'); this._render(); },
    setStats(data, onBuy, onReady) { this._stats = data; this._buy = onBuy; this._ready = onReady; if (!$('upgradeScreen').classList.contains('hidden')) this._render(); else this.showShop(); },
    setBoons(data, onPick) { this._boons = data; this._pick = onPick; if (!$('upgradeScreen').classList.contains('hidden')) this._render(); else this.showShop(); },
    setGear(data, onBuyGear) { this._gear = data; this._buyGear = onBuyGear; if (!$('upgradeScreen').classList.contains('hidden')) this._render(); else this.showShop(); },
    _render() {
      // BOON row (top)
      const brow = $('boonCards'); brow.innerHTML = '';
      if (this._boons && this._boons.boons && this._boons.boons.length && !this._boons.picked) {
        $('boonSection').classList.remove('hidden');
        this._boons.boons.forEach(b => { const rar = RAR[b.rarity] || RAR.common; const el = document.createElement('div'); el.className = 'bc'; el.style.borderColor = rar.color; el.innerHTML = `<span class="rar" style="color:${rar.color}">${rar.name}</span><div class="icon">${b.icon}</div><div class="nm">${b.name}</div><div class="ds">${b.desc}</div>${b.owned ? `<div class="own">posseduto ×${b.owned}</div>` : ''}`; el.onclick = () => { if (this._pick) this._pick(b.id); this._boons.picked = true; this._render(); }; brow.appendChild(el); });
      } else { $('boonSection').classList.add('hidden'); }
      // STAT shop
      // EMPORIO (equipaggiamento con monete)
      const gsec = $('gearSection');
      if (gsec) gsec.classList.toggle('hidden', !(this._gear && this._gear.slots && this._gear.slots.length));
      if (this._gear && this._gear.slots) {
        $('shopCoins').textContent = this._gear.coins;
        const gc = $('gearCards'); gc.innerHTML = '';
        this._gear.slots.forEach(g => {
          const rar = RAR[g.rarity] || RAR.common;
          const afford = !g.maxed && this._gear.coins >= g.cost;
          const el = document.createElement('div'); el.className = 'gc' + (g.maxed ? ' maxed' : (afford ? '' : ' disabled')); el.style.borderColor = g.color;
          const pips = []; for (let i = 0; i < g.max; i++) pips.push(`<span class="${i < g.tier ? 'on' : ''}" style="${i < g.tier ? 'background:' + g.color : ''}"></span>`);
          const foot = g.maxed ? `<div class="cost maxed" style="color:${g.color}">MAX ★</div>` : `<div class="cost" style="color:${g.color}">🪙 ${g.cost}</div>`;
          el.innerHTML = `<span class="rar" style="color:${rar.color}">${g.tier > 0 ? 'Lv.' + g.tier + '/' + g.max : 'Nuovo'}</span><div class="icon">${iconHTML(g.icon, "gicon")}</div><div class="nm">${g.name} ${g.maxed ? g.rank : (g.nextRank ? '→ ' + g.nextRank : '')}</div><div class="ds">${g.desc}</div><div class="pips">${pips.join('')}</div>${foot}`;
          el.onclick = () => { if (afford && this._buyGear) this._buyGear(g.slot); };
          gc.appendChild(el);
        });
      }
      // v1.51 — le statistiche hanno un TETTO di livello e costi molto piu' ripidi: la carta mostra Lv.x/max
      // e diventa MAX quando e' esaurita, cosi' si vede a colpo d'occhio dove hai gia' investito.
      if (this._stats) {
        $('shopXp').textContent = this._stats.xp;
        const cont = $('upgradeCards'); cont.innerHTML = '';
        this._stats.stats.forEach(s => {
          const maxed = !!s.maxed, afford = !maxed && this._stats.xp >= s.cost;
          const el = document.createElement('div');
          el.className = 'uc' + (maxed ? ' maxed' : (afford ? '' : ' disabled'));
          el.style.borderColor = s.color;
          const lvlTxt = s.max ? 'Lv.' + s.lvl + '/' + s.max : 'Lv.' + s.lvl;
          const foot = maxed ? `<div class="cost maxed" style="color:${s.color}">MAX ★</div>` : `<div class="cost" style="color:${s.color}">✦ ${s.cost} XP</div>`;
          el.innerHTML = `<span class="rar" style="color:${s.color}">${lvlTxt}</span><div class="icon">${s.icon}</div><div class="nm">${s.name}</div><div class="ds">${s.desc}</div>${foot}`;
          el.onclick = () => { if (afford && this._buy) this._buy(s.id); };
          cont.appendChild(el);
        });
      }
    },
    // v1.51 — barra dei POTERI ATTIVI, sopra la barra abilita'. Aggiornata solo quando il server manda
    // l'elenco (scelta di un potere / sinergia / inizio partita), non a ogni frame.
    setActiveBoons(list) { this._active = list || []; this._renderBoonBar(); },
    _renderBoonBar() {
      const bar = $('boonBar'); if (!bar) return;
      const list = this._active || [];
      if (!list.length) { bar.classList.add('hidden'); bar.innerHTML = ''; return; }
      bar.classList.remove('hidden');
      bar.innerHTML = list.map(b => {
        const col = b.syn ? '#7dffea' : ((RAR[b.rarity] || RAR.common).color);
        const n = (b.n || 1) > 1 ? `<i>×${b.n}</i>` : '';
        const title = esc(b.name) + (b.desc ? ' — ' + esc(b.desc) : '');
        return `<span class="bchip${b.syn ? ' syn' : ''}" style="border-color:${col};color:${col}" title="${title}">${b.icon}${n}</span>`;
      }).join('');
    },
    onBoonPicked() { if (this._boons) { this._boons.picked = true; this._render(); } },
    hideShop() { $('upgradeScreen').classList.add('hidden'); this._boons = null; this._stats = null; this._gear = null; },
    // v1.11 — pannello NPC mercante (compare quando sei vicino)
    showMerchant(wares, onBuy, coins, dark) { this._merchBuy = onBuy; this._merchWares = wares || this._merchWares; this._merchDark = !!dark; const panel = $('merchantPanel'); if (!panel || !this._merchWares) return; panel.classList.remove('hidden'); panel.classList.toggle('dark', !!dark); const hd = $('merchHead'); if (hd) hd.innerHTML = dark ? '\uD83D\uDC80 <b>Mercante Nero</b> \u2014 patti a caro prezzo \u00b7 hai <b id="merchCoins">' + (coins != null ? coins : (this._coins||0)) + '</b> \uD83E\uDE99' : '\uD83E\uDDD9 <b>Mercante Errante</b> \u2014 hai <b id="merchCoins">' + (coins != null ? coins : (this._coins||0)) + '</b> \uD83E\uDE99'; if (coins != null) this._coins = coins; this._renderMerchant(); },
    updateMerchantCoins(coins, dark) { if (coins != null) this._coins = coins; this._renderMerchant(); },
    _renderMerchant() {
      const cont = $('merchantCards'); if (!cont || !this._merchWares) return;
      const c = this._coins || 0; const cel = $('merchCoins'); if (cel) cel.textContent = c;
      // v1.34 FIX Mercante Nero vuoto: ricostruisci le carte SOLO quando cambia l'offerta.
      // _renderMerchant() e' chiamato a ogni snapshot per aggiornare le monete; prima faceva
      // cont.innerHTML='' ricreando i nodi ~20 volte/sec e riavviando l'animazione d'ingresso
      // "darkCardIn" delle carte del Nero (opacity 0 -> 1 con delay), che restavano a opacity 0
      // => box centrato ma "vuoto". Ora il DOM si ricrea solo al cambio offerta.
      const sig = this._merchWares.map(function (w) { return w.id; }).join('|') + '#' + (this._merchDark ? 'd' : 'n');
      if (this._merchSig !== sig) {
        this._merchSig = sig;
        cont.innerHTML = '';
        this._merchWares.forEach(function (w) {
          const el = document.createElement('div');
          el.className = 'mc'; el.dataset.cost = w.cost;
          el.style.borderColor = w.color;
          const dparts = (w.desc || '').split(', ma ');
          const dsHtml = dparts.length === 2 ? ('<span class="good">' + dparts[0] + '</span><span class="bad">\u26a0 ' + dparts[1] + '</span>') : (w.desc || '');
          el.innerHTML = '<div class="icon">' + w.icon + '</div><div class="nm" style="color:' + w.color + '">' + w.name + '</div><div class="ds">' + dsHtml + '</div><div class="cost" style="color:' + w.color + '">\uD83E\uDE99 ' + w.cost + '</div>';
          el.onclick = function () { if (this._merchBuy) this._merchBuy(w.id); }.bind(this);
          cont.appendChild(el);
        }, this);
      }
      // Ogni frame aggiorno SOLO l'accessibilita' (niente wipe del DOM => nessun restart animazione).
      Array.prototype.forEach.call(cont.children, function (el) { el.classList.toggle('disabled', c < (+el.dataset.cost || 0)); });
    },
    hideMerchant(dark) { const panel = $('merchantPanel'); if (panel) { panel.classList.add('hidden'); panel.classList.remove('dark'); } this._merchSig = null; },
    lobby(room, players, meId, onStart, onChange) { $('lobby').classList.remove('hidden'); $('lobbyRoom').textContent = room; const lp = $('lobbyPlayers'); lp.innerHTML = ''; players.forEach(p => { const h = HERO[p.h] || HERO.enforcer; const el = document.createElement('div'); el.className = 'lp'; el.innerHTML = `<span class="dot" style="background:${h.color}"></span>${HeroIcon[p.h] || '🎮'} <b>${p.n}</b> ${p.i === meId ? '(tu)' : ''}`; lp.appendChild(el); }); $('startBtn').onclick = onStart; $('changeHeroBtn').onclick = onChange; },
    hideLobby() { $('lobby').classList.add('hidden'); },
    end(victory, snap, me, runStats, dur) {
      const scr = $('endScreen');
      $('endTitle').textContent = victory ? '🏆 VITTORIA!' : '☠ SCONFITTA';
      $('endTitle').style.color = victory ? '#ffd24a' : '#ff4b6b';
      const fmtT = (s) => { s = s || 0; const m = Math.floor(s / 60), ss = s % 60; return m + ':' + String(ss).padStart(2, '0'); };
      let html = `<div class="big">Ondata ${snap.wave}/${window.GAME.Constants.FINAL_WAVE}${dur ? ' · ⏱ ' + fmtT(dur) : ''}</div>`;
      html += victory ? `<div class="sub">Hai sconfitto AZ'GAROTH, il Divoratore di Mondi!</div>` : `<div class="sub">La squadra è caduta. Riprova!</div>`;
      const WN = {}; for (const k of Object.keys(LOOT.WEAPONS)) { const w = LOOT.WEAPONS[k]; WN[k] = { name: w.name, icon: w.icon }; if (w.evo) WN[w.evo.id] = { name: w.evo.name, icon: w.icon }; }
      if (runStats && runStats.length) {
        html += '<table class="runtab"><thead><tr><th>Eroe</th><th>💀</th><th>🔥 Combo</th><th>Danni</th><th>🎴</th><th>Arma</th></tr></thead><tbody>';
        runStats.forEach((r, idx) => {
          const h = HERO[r.h] || HERO.enforcer; const mine = me && r.i === me.i;
          const medal = idx === 0 ? '🥇 ' : (idx === 1 ? '🥈 ' : (idx === 2 ? '🥉 ' : ''));
          const wpn = r.evo ? ('✨ ' + ((WN[r.evo] || {}).name || 'Evoluta')) : (r.w ? ((WN[r.w] || {}).icon || '') + ' ' + ((WN[r.w] || {}).name || '') : '—');
          const syn = r.syn ? ` <span style="color:#7dffea">+${r.syn}🔗</span>` : '';
          html += `<tr class="${mine ? 'me' : ''}${r.dead ? ' fallen' : ''}"><td>${medal}${HeroIcon[r.h] || ''} <b style="color:${h.accent}">${esc(r.n)}</b>${mine ? ' (tu)' : ''}</td><td>${r.k}</td><td>${r.cb}</td><td>${r.dmg}${syn}</td><td>${r.boons}</td><td>${wpn}</td></tr>`;
        });
        html += '</tbody></table>';
      } else if (me) { html += `<div class="sub">Uccisioni: <b>${me.k}</b></div>`; }
      $('endStats').innerHTML = html; scr.classList.remove('hidden');
    },
    hideEnd() { $('endScreen').classList.add('hidden'); },
  };
  window.HUD = HUD;
})();
