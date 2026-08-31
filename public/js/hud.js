/* hud.js — interfaccia: vite, XP, negozio, BOON, modalità, barra abilità */
(function () {
  'use strict';
  const HERO = window.GAME.Heroes.HEROES, HORDER = window.GAME.Heroes.ORDER, MON = window.GAME.Monsters.MONSTERS, BOSSES = window.GAME.Monsters.BOSSES, LOOT = window.GAME.Loot, RAR = window.GAME.Constants.RARITY;
  const POT = window.GAME.Potions, BNT = window.GAME.Bounties;
  const $ = (id) => document.getElementById(id); const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const iconHTML = (ic, cls) => (typeof ic === 'string' && /\.(png|svg|webp|jpg)$/i.test(ic)) ? `<img class="${cls || ''}" src="/${ic}" alt="" draggable="false">` : `<span class="emoji">${ic}</span>`; const HeroIcon = { guerriero: '🛡️', mago: '🔮', ladro: '🏹' };
  const EVO_NAME = {}; for (const k of Object.keys(LOOT.WEAPONS)) { const w = LOOT.WEAPONS[k]; if (w.evo) EVO_NAME[w.evo.id] = { name: w.evo.name, icon: w.icon, color: w.evo.color }; }
  const HUD = {
    selectedHero: 'guerriero', _boons: null, _stats: null, _gear: null, _active: [],
    buildHeroSelect(cb) { const w = $('heroSelect'); w.innerHTML = ''; HORDER.forEach(id => { const h = HERO[id]; const el = document.createElement('div'); el.className = 'hero-chip' + (id === this.selectedHero ? ' sel' : ''); el.style.setProperty('--pick', h.color); el.innerHTML = `<div class="avatar" style="background:${h.color2};color:${h.accent}">${HeroIcon[id]}</div><div class="hname">${h.name}</div><div class="hrole">${h.title}</div>`; el.onclick = () => { this.selectedHero = id; this.buildHeroSelect(cb); this.showHeroDetail(id); if (cb) cb(id); }; w.appendChild(el); }); this.showHeroDetail(this.selectedHero); },
    // v1.66 — la scheda non mostra piu' Q/E (rimosse): al loro posto l'ARMA e la statistica che la governa,
    // che sono le due cose da sapere per scegliere la classe adesso.
    showHeroDetail(id) { const h = HERO[id]; const SCH = { melee: ['💪', 'Forza', 'semicerchio in mischia'], magic: ['🔮', 'Intelligenza', 'proiettili magici'], ranged: ['🏹', 'Destrezza', 'tiro a distanza'] }[h.weapon.school] || ['⚔️', '—', '']; $('heroDetail').innerHTML = `<h3 style="color:${h.accent}">${h.name} — <span style="color:#c9d2e6;font-weight:600">${h.title}</span></h3><div class="ab"><span class="k">SX</span><b>${h.weapon.name}</b> — ${SCH[2]}, ${h.weapon.dmg} danni, ${h.weapon.fireRate}/s</div><div class="ab"><span class="k">${SCH[0]}</span><b>${SCH[1]}</b> — alza danno e cadenza di quest'arma</div><div class="ab"><span class="k">🖱▸</span><b>Scatto</b> — tasto destro: attraversa i nemici.</div><div class="ab pas">🛡️ ${h.passives.map(p => '<b>' + p.name + '</b>').join(' · ')}</div><div class="sw"><span class="s">▲ ${h.strengths}</span><br><span class="w">▼ ${h.weakness}</span></div>`; },
    // v1.66 — niente piu' slot Q/E: la barra tiene solo cio' che il giocatore puo' davvero premere.
    buildAbilityBar(id) { const h = HERO[id]; const bar = $('abilityBar'); bar.innerHTML = ''; const wi = { melee: '🗡️', magic: '🔮', ranged: '🏹' }[h.weapon.school] || '🔫'; [{ k: 'DX', ic: '💨', t: 'Scatto' }, { k: 'SX', ic: wi, t: h.weapon.name }].forEach((s, i) => { const el = document.createElement('div'); el.className = 'ab-slot'; el.id = 'ab' + i; el.title = s.t || ''; el.innerHTML = `<span class="key">${s.k}</span><span class="ic">${s.ic}</span><span class="lbl">${s.t || ''}</span><div class="cd hidden"></div>`; bar.appendChild(el); }); },
    updateAbilities(me) { if (!me) return; const set = (i, cd) => { const el = $('ab' + i); if (!el) return; const c = el.querySelector('.cd'); if (cd > 0.1) { c.classList.remove('hidden'); c.textContent = cd.toFixed(1); el.classList.remove('ready'); } else { c.classList.add('hidden'); el.classList.add('ready'); } }; set(0, me.cd || 0); const f = $('ab1'); if (f) f.classList.add('ready'); },
    // v1.62 — didascalia con il nome della zona (theme.name). Persistente: non e' un annuncio, e' il
    // posto in cui ti trovi. Cambia solo quando arriva una mappa nuova.
    zoneName(th) { const e = $('zoneName'); if (!e) return; if (!th || !th.name) { e.classList.add('hidden'); return; } e.textContent = th.name; e.style.color = th.accent || '#8be9ff'; e.classList.remove('hidden'); },
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
      // v1.77 — il cronometro dell'ondata e il tempo obiettivo
      const wt = $('waveTimer');
      if (wt) {
        const inCorso = snap.phase === 'combat' || snap.phase === 'boss';
        if (!inCorso) wt.classList.add('hidden');
        else {
          const el = Math.max(0, snap.wt || 0), par = snap.wp || 0;
          const mm = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
          if (par > 0) {
            const resta = par - el;
            wt.textContent = '\u23F1 ' + mm(el) + ' / ' + mm(par);
            wt.className = resta <= 0 ? 'tardi' : (resta < 10 ? 'quasi' : 'ok');
          } else { wt.textContent = '\u23F1 ' + mm(el); wt.className = ''; }
          wt.classList.remove('hidden');
        }
      }
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
    // v1.69 — CARTE DI RANGO. Stesso pannello dei boon, mazzo diverso: qui si sceglie cio' che rende
    // la classe *tua*, non un potenziamento generico. Al rango V le carte sono due e piu' grandi:
    // e' un bivio, non una scelta fra tre pari.
    setRank(data, onPick) { this._rank = data; this._pickRank = onPick; if (!$('upgradeScreen').classList.contains('hidden')) this._render(); else this.showShop(); },
    _renderRank() {
      const sec = $('rankSection'), row = $('rankCards');
      if (!sec || !row) return;
      const d = this._rank;
      if (!d || !d.cards || !d.cards.length || d.picked) { sec.classList.add('hidden'); row.innerHTML = ''; return; }
      sec.classList.remove('hidden');
      $('rankTitle').textContent = (d.spec ? '★ ' : '') + (d.title || 'RANGO');
      $('rankSub').textContent = d.spec
        ? 'La scelta vale per questa partita e si vede addosso al tuo personaggio'
        : 'Rango ' + ['I', 'II', 'III', 'IV', 'V'][(d.rank || 1) - 1] + ' — scegli una carta, resta per tutta la partita';
      row.className = d.spec ? 'spec' : '';
      row.innerHTML = '';
      d.cards.forEach(c => {
        const el = document.createElement('div'); el.className = 'bc';
        el.style.borderColor = c.color || '#c8a23a';
        el.innerHTML = '<span class="rar">' + (d.spec ? 'SPECIALIZZAZIONE' : 'CARTA DI RANGO') + '</span>'
          + '<div class="icon">' + (c.icon || '★') + '</div><div class="nm">' + esc(c.name) + '</div>'
          + '<div class="ds">' + esc(c.desc) + '</div>'
          + (c.abilita ? '<div class="ab">' + esc(c.abilita) + '</div>' : '');
        el.onclick = () => { if (this._pickRank) this._pickRank(c.id); this._rank.picked = true; this._render(); };
        row.appendChild(el);
      });
    },
    setBoons(data, onPick) { this._boons = data; this._pick = onPick; if (!$('upgradeScreen').classList.contains('hidden')) this._render(); else this.showShop(); },
    // v1.67 — il pannello del fabbro non mostra piu' tre barre da riempire ma il CATALOGO della classe,
    // una riga per slot. Ogni carta e' un oggetto con un nome: quello indosso e' marcato IN USO, gli altri
    // portano il prezzo. Il cambio e' libero, quindi non si "sblocca" niente — si sceglie.
    _gearCard(it, coins, onBuy) {
      const rar = RAR[it.rarity] || RAR.common;
      const inUso = !!it.owned, tuo = !inUso && !!it.have, afford = tuo || coins >= it.cost;
      const el = document.createElement('div');
      el.className = 'gc' + (inUso ? ' maxed' : (afford ? '' : ' disabled'));
      el.style.borderColor = it.color;
      const pips = []; for (let i = 0; i < 3; i++) pips.push('<span class="' + (i < it.rank ? 'on' : '') + '" style="' + (i < it.rank ? 'background:' + it.color : '') + '"></span>');
      // il rango 1 costa 0: scrivere "🪙 0" fa sembrare un affare cio' che e' semplicemente l'equipaggiamento
      // di partenza. Si scrive DI BASE, che e' l'informazione vera.
      const foot = inUso
        ? '<div class="cost maxed" style="color:' + it.color + '">IN USO ★</div>'
        : tuo
        ? '<div class="cost" style="color:#9fe06a">GIÀ TUO · GRATIS</div>'
        : (it.cost > 0
          ? '<div class="cost" style="color:' + (afford ? it.color : '#ff8a8a') + '">🪙 ' + it.cost + '</div>'
          : '<div class="cost" style="color:#8d97ab">DI BASE</div>');
      el.innerHTML = '<span class="rar" style="color:' + rar.color + '">' + esc(rar.name) + '</span>'
        + '<div class="nm">' + esc(it.name) + '</div><div class="ds">' + esc(it.desc) + '</div>'
        + '<div class="pips">' + pips.join('') + '</div>' + foot;
      el.onclick = () => { if (!inUso && afford && onBuy) onBuy(it.id); };
      return el;
    },
    _gearSlots(wrap, data, onBuy) {
      wrap.innerHTML = '';
      (data.slots || []).forEach(sl => {
        const box = document.createElement('div'); box.className = 'gslot';
        const h = document.createElement('div'); h.className = 'gslot-h';
        h.innerHTML = '<span class="ic">' + sl.icon + '</span> ' + esc(sl.name);
        box.appendChild(h);
        const row = document.createElement('div'); row.className = 'gslot-row';
        (sl.items || []).forEach(it => row.appendChild(this._gearCard(it, data.coins || 0, onBuy)));
        box.appendChild(row); wrap.appendChild(box);
      });
    },
    setGear(data, onBuyGear) { this._gear = data; this._buyGear = onBuyGear; if (!$('upgradeScreen').classList.contains('hidden')) this._render(); else this.showShop(); },
    _render() {
      this._renderRank();
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
        this._gearSlots($('gearCards'), this._gear, (id) => { if (this._buyGear) this._buyGear(id); });
      }
      // v1.51 — le statistiche hanno un TETTO di livello e costi molto piu' ripidi: la carta mostra Lv.x/max
      // e diventa MAX quando e' esaurita, cosi' si vede a colpo d'occhio dove hai gia' investito.
      if (this._stats) {
        // v1.69 — la cifra grande non e' piu' l'XP ma i PUNTI, e accanto ci sono livello e rango: e' li'
        // che il giocatore capisce a che punto e' della sua storia, non nel totale di esperienza raccolta.
        $('shopXp').textContent = this._stats.points != null ? this._stats.points : this._stats.xp;
        const sl = $('shopLevel'); if (sl) sl.textContent = this._stats.level || 1;
        const sr = $('shopRank'); if (sr) sr.textContent = this._stats.rankName || '';
        const cont = $('upgradeCards'); cont.innerHTML = '';
        this._stats.stats.forEach(s => {
          const punti = this._stats.points != null ? this._stats.points : this._stats.xp;
          const maxed = !!s.maxed, afford = !maxed && punti >= s.cost;
          const el = document.createElement('div');
          el.className = 'uc' + (maxed ? ' maxed' : (afford ? '' : ' disabled'));
          el.style.borderColor = s.color;
          const lvlTxt = s.max ? 'Lv.' + s.lvl + '/' + s.max : 'Lv.' + s.lvl;
          const foot = maxed ? `<div class="cost maxed" style="color:${s.color}">MAX ★</div>` : `<div class="cost" style="color:${s.color}">◆ ${s.cost} ${s.cost === 1 ? 'punto' : 'punti'}</div>`;
          el.innerHTML = `<span class="rar" style="color:${s.color}">${lvlTxt}</span><div class="icon">${s.icon}</div><div class="nm">${s.name}</div><div class="ds">${s.desc}</div>${foot}`;
          el.onclick = () => { if (afford && this._buy) this._buy(s.id); };
          cont.appendChild(el);
        });
      }
    },
    // v1.51 — barra dei POTERI ATTIVI, sopra la barra abilita'. Aggiornata solo quando il server manda
    // l'elenco (scelta di un potere / sinergia / inizio partita), non a ogni frame.
    // v1.73 — la barra dei gettoni in basso e' stata SOSTITUITA dal box del personaggio (updateHeroBox):
    // mostrava le stesse icone senza dire a chi appartenevano ne' quante ne potevi tenere accese.
    setActiveBoons(list) { this._active = list || []; this._cardMax = 0; this._heroSig = null; this._renderHeroCards(); },
    _renderHeroCards() {
      const wrap = $('heroCards'); if (!wrap) return;
      const max = window.GAME.Constants.MAX_CARDS || 5;
      const on = (this._active || []).filter(b => b.on !== 0);   // le sinergie non hanno il flag: contano come accese
      let html = '';
      for (let i = 0; i < max; i++) {
        const b = on[i];
        if (!b) { html += '<span class="cchip empty"></span>'; continue; }
        const col = b.syn ? '#7dffea' : ((RAR[b.rarity] || RAR.common).color);
        const n = (b.n || 1) > 1 ? '<i>×' + b.n + '</i>' : '';
        html += '<span class="cchip' + (b.syn ? ' syn' : '') + '" style="border-color:' + col + ';color:' + col + '" title="' +
                esc(b.name) + (b.desc ? ' — ' + esc(b.desc) : '') + '">' + b.icon + n + '</span>';
      }
      if (on.length > max) html += '<span class="cmore">+' + (on.length - max) + '</span>';
      wrap.innerHTML = html;
    },
    // ===== v1.73 — IL BOX DEL PERSONAGGIO =====
    // Sta nel vuoto fra la barra abilita' e la boccetta della vita. Raccoglie le tre cose che prima erano
    // sparse: il NOME e il LIVELLO (che stavano sopra la testa, dove coprivano il gioco) e le CARTE ATTIVE
    // (che erano una fila di gettoni senza contesto). Gli slot vuoti si vedono: il tetto di 5 e' una regola,
    // e una regola che non si vede non esiste.
    updateHeroBox(me) {
      const box = $('heroBox'); if (!box) return;
      if (!me) { box.classList.add('hidden'); return; }
      const LV = window.GAME.Levels, h = HERO[me.h] || HERO.guerriero;
      const rk = (LV && me.lvl) ? LV.rankName(me.h, me.lvl, me.sp || null) : '';
      const sig = [me.n, me.h, me.lvl, rk, (this._active || []).map(b => b.id + (b.on === 0 ? '-' : '+') + (b.n || 1)).join(',')].join('|');
      if (sig !== this._heroSig) {
        this._heroSig = sig;
        $('heroBoxName').textContent = me.n || '';
        $('heroBoxName').style.color = h.accent;
        $('heroBoxLv').innerHTML = me.lvl ? ('<b>Lv.' + me.lvl + '</b> · ' + esc(rk)) : '';
        this._renderHeroCards();
      }
      const xp = $('heroBoxXp'); if (xp) xp.style.width = Math.round((me.prg || 0) * 100) + '%';
      box.classList.remove('hidden');
    },

    // ===== v1.74 — IL FOCOLARE DELL'OSTESSA =====
    // Un pannello piccolo: una cosa sola da fare, e il prezzo che si legge senza calcoli. La barra mostra
    // quanto ti manca, non quanto hai: e' quello che stai comprando.
    showInn(data, onRest) {
      if (data) this._inn = data; if (onRest) this._innCb = onRest;
      const panel = $('innPanel'); if (!panel || !this._inn) return;
      panel.classList.remove('hidden'); this._renderInn();
    },
    hideInn() { const panel = $('innPanel'); if (panel) panel.classList.add('hidden'); this._innSig = null; },
    _renderInn() {
      const d = this._inn; if (!d) return;
      const hd = $('innHead');
      if (hd) hd.innerHTML = '\uD83C\uDF7A <b>Ostessa</b> \u2014 hai <b>' + (d.coins || 0) + '</b> \uD83E\uDE99';
      const sig = [d.hp, d.mx, d.coins].join('|');
      if (sig === this._innSig) return; this._innSig = sig;
      const bar = $('innBar'), txt = $('innText'), btn = $('innBtn');
      const f = Math.max(0, Math.min(1, d.hp / (d.mx || 1)));
      bar.style.width = Math.round(f * 100) + '%';
      $('innHp').innerHTML = '<b>' + d.hp + '</b> / ' + d.mx;
      if (!d.manca) {
        txt.textContent = 'Sei a posto così: non hai niente da farti curare.';
        btn.textContent = 'niente da curare'; btn.className = 'off'; btn.onclick = null;
      } else if (d.curabili <= 0) {
        txt.innerHTML = 'Ti mancano <b>' + d.manca + '</b> PV. Servono <b>' + d.pieno + '</b> \uD83E\uDE99 e non hai monete.';
        btn.textContent = 'monete insufficienti'; btn.className = 'off'; btn.onclick = null;
      } else if (d.curabili >= d.manca) {
        txt.innerHTML = 'Ti mancano <b>' + d.manca + '</b> PV \u00b7 ' + d.perHp + ' \uD83E\uDE99 al punto vita.';
        btn.innerHTML = 'rimettimi a nuovo \u2014 <b>\uD83E\uDE99' + d.pieno + '</b>'; btn.className = '';
        btn.onclick = () => { if (this._innCb) this._innCb(); };
      } else {
        txt.innerHTML = 'Ti mancano <b>' + d.manca + '</b> PV, ma con quello che hai te ne rendo <b>' + d.curabili + '</b>.';
        btn.innerHTML = 'quel che posso \u2014 <b>+' + d.curabili + ' PV</b> per <b>\uD83E\uDE99' + d.spesa + '</b>'; btn.className = 'parz';
        btn.onclick = () => { if (this._innCb) this._innCb(); };
      }
    },

    // ===== v1.73 — IL TAVOLO DELLA CARTOMANTE =====
    showSeer(data, onToggle) {
      if (data) this._seer = data; if (onToggle) this._seerCb = onToggle;
      const panel = $('seerPanel'); if (!panel || !this._seer) return;
      panel.classList.remove('hidden'); this._renderSeer();
    },
    hideSeer() { const panel = $('seerPanel'); if (panel) panel.classList.add('hidden'); this._seerSig = null; },
    _renderSeer() {
      const d = this._seer; if (!d) return;
      const hd = $('seerHead');
      if (hd) hd.innerHTML = '\uD83D\uDD2E <b>Cartomante</b> \u2014 <b>' + d.active + '</b> di <b>' + d.max + '</b> carte accese';
      const sig = JSON.stringify([d.cards, d.syn, d.active]);
      if (sig === this._seerSig) return; this._seerSig = sig;
      const cb = this._seerCb;
      const pieno = d.active >= d.max;
      const sub = $('seerSub');
      if (sub) sub.textContent = pieno
        ? 'Sei al limite: per accenderne un\'altra devi prima spegnerne una.'
        : 'Puoi accenderne ancora ' + (d.max - d.active) + '. Le carte spente restano tue.';
      const wrap = $('seerCards'); wrap.innerHTML = '';
      const ord = (d.cards || []).slice().sort((a, b) => (b.on - a.on) || a.name.localeCompare(b.name));
      ord.forEach(c => {
        const col = (RAR[c.rarity] || RAR.common).color;
        const el = document.createElement('div');
        const bloccata = !c.on && pieno;
        el.className = 'sc' + (c.on ? ' on' : '') + (bloccata ? ' lock' : '');
        el.style.setProperty('--c', col);
        el.innerHTML = '<div class="ic">' + c.icon + '</div><div class="mid"><div class="nm" style="color:' + col + '">' +
          esc(c.name) + ((c.n || 1) > 1 ? ' <i>×' + c.n + '</i>' : '') + '</div><div class="ds">' + esc(c.desc || '') + '</div></div>' +
          '<span class="sw">' + (c.on ? 'ACCESA' : (bloccata ? 'LIMITE' : 'spenta')) + '</span>';
        if (!bloccata) el.onclick = () => { if (cb) cb(c.id); };
        wrap.appendChild(el);
      });
      if (!ord.length) wrap.innerHTML = '<div class="vuoto">Non hai ancora nessuna carta. Se ne guadagna una a fine ondata.</div>';
      const sy = $('seerSyn');
      if (sy) {
        sy.innerHTML = (d.syn || []).map(s => '<span class="syn">' + s.icon + ' <b>' + esc(s.name) + '</b> — ' + esc(s.desc) + '</span>').join('');
        sy.classList.toggle('hidden', !(d.syn || []).length);
      }
    },
    onBoonPicked() { if (this._boons) { this._boons.picked = true; this._render(); } },
    hideShop() { $('upgradeScreen').classList.add('hidden'); this._boons = null; this._stats = null; this._gear = null; this._rank = null; },
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
    // ===== v1.52 — MERCATO: pannello del mercante dell'equipaggiamento =====
    // Riusa le carte .gc dell'Emporio. Come per il Mercante Nero (fix v1.34) le carte si ricostruiscono
    // SOLO quando cambia qualcosa: ricrearle a ogni snapshot riavvierebbe le animazioni e le renderebbe invisibili.
    showGear(data, onBuy) {
      if (data) this._gearNpc = data; if (onBuy) this._buyGearNpc = onBuy;
      const panel = $('gearPanel'); if (!panel || !this._gearNpc) return;
      panel.classList.remove('hidden'); this._renderGearNpc();
    },
    hideGear() { const panel = $('gearPanel'); if (panel) panel.classList.add('hidden'); this._gearNpcSig = null; },

    // ===== v1.71 — LA CINTURA =====
    // Tre riquadri accanto alla barra abilita'. Si ricostruiscono SOLO quando cambia qualcosa (firma):
    // ridisegnarli 20 volte al secondo farebbe ripartire l'animazione dei pallini a ogni snapshot.
    // Il velo del cooldown, invece, si muove ogni frame — ma e' un'altezza in CSS, non HTML nuovo.
    buildBelt() {
      const bar = $('beltBar'); if (!bar) return;
      let html = '';
      for (let i = 0; i < POT.SLOTS; i++) {
        html += '<div class="pot-slot empty" id="pot' + i + '"><span class="key">' + (i + 1) + '</span>' +
                '<span class="ic">\uD83E\uDDEA</span><div class="pips"></div><div class="cdveil hidden"></div></div>';
      }
      bar.innerHTML = html; this._beltSig = null;
    },
    updateBelt(me) {
      const bar = $('beltBar'); if (!bar) return;
      if (!me) { bar.classList.add('hidden'); return; }
      if (!bar.children.length) this.buildBelt();
      const bt = me.bt || [];
      const sig = JSON.stringify(bt);
      if (sig !== this._beltSig) {
        this._beltSig = sig;
        for (let i = 0; i < POT.SLOTS; i++) {
          const el = $('pot' + i); if (!el) continue;
          const s = bt[i]; const it = s ? POT.POTIONS[s[0]] : null; const n = s ? s[1] : 0;
          el.classList.toggle('has', !!it);
          el.classList.toggle('empty', !it || !n);
          el.style.setProperty('--c', it ? it.color : '#2c3350');
          el.title = it ? (it.name + ' — ' + it.desc) : 'Slot vuoto — assegnalo dall\'Erborista';
          el.querySelector('.ic').textContent = it ? it.icon : '\uD83E\uDDEA';
          let pips = ''; for (let k = 0; k < POT.MAX_CHARGES; k++) pips += '<i class="' + (k < n ? 'on' : '') + '"></i>';
          el.querySelector('.pips').innerHTML = pips;
        }
      }
      // il cooldown e' CONDIVISO: il velo scende su tutti e tre insieme, come la regola che rappresenta
      const f = me.pcd || 0;
      for (let i = 0; i < POT.SLOTS; i++) {
        const el = $('pot' + i); if (!el) continue; const v = el.querySelector('.cdveil');
        if (f > 0.01) { v.classList.remove('hidden'); v.style.height = Math.round(f * 100) + '%'; }
        else v.classList.add('hidden');
      }
      bar.classList.remove('hidden');
    },

    updateBounty(me) {
      const el = $('bountyHud'); if (!el) return;
      const b = me && me.bo;
      if (!b) { el.classList.add('hidden'); this._boSig = null; return; }
      const sig = b.k + '|' + b.h + '|' + b.n;
      if (sig !== this._boSig) {
        this._boSig = sig;
        const f = Math.max(0, Math.min(1, b.h / b.n));
        el.style.setProperty('--c', b.c || '#ff9a8a');
        el.innerHTML = '<span class="ic">' + b.i + '</span><span class="tx">' + esc(b.t) + '</span>' +
                       '<span class="cnt">' + b.h + '/' + b.n + '</span>' +
                       '<div class="bar"><i style="width:' + Math.round(f * 100) + '%"></i></div>';
      }
      el.classList.remove('hidden');
    },

    // ===== v1.72 — IL BANCO DEL BANDITORE: taglie sopra, magazzino sotto =====
    showBandit(data, cb) {
      if (data) this._bnd = data; if (cb) this._bndCb = cb;
      const panel = $('banditPanel'); if (!panel || !this._bnd) return;
      panel.classList.remove('hidden'); this._renderBandit();
    },
    hideBandit() { const panel = $('banditPanel'); if (panel) panel.classList.add('hidden'); this._bndSig = null; },
    _renderBandit() {
      const d = this._bnd; if (!d) return;
      const hd = $('banditHead');
      if (hd) hd.innerHTML = '\uD83E\uDEA7 <b>Banditore</b> \u2014 hai <b>' + (d.coins || 0) + '</b> \uD83E\uDE99';
      const sig = JSON.stringify([d.coins, d.bounty, d.offers, d.stock]);
      if (sig === this._bndSig) return; this._bndSig = sig;
      const cb = this._bndCb || {};
      // --- taglie ---
      const sub = $('banditSub'), tg = $('banditBounty');
      tg.innerHTML = '';
      if (d.bounty) {
        const b = d.bounty; const f = Math.max(0, Math.min(1, b.have / b.n));
        if (sub) sub.textContent = 'Nessuna scadenza — il conto continua ondata dopo ondata.';
        const el = document.createElement('div'); el.className = 'att'; el.style.setProperty('--c', b.color);
        el.innerHTML = '<div class="ic">' + b.icon + '</div><div class="mid"><div class="nm">' + esc(b.nome) + '</div>' +
          '<div class="ds">' + esc(b.testo) + '</div><div class="bar"><i style="width:' + Math.round(f * 100) + '%"></i></div></div>' +
          '<div class="cnt">' + b.have + ' / ' + b.n + '<b>\uD83E\uDE99 ' + b.pay + '</b></div>';
        tg.appendChild(el);
      } else {
        if (sub) sub.textContent = 'Clicca quella che vuoi accettare. Vale finché non la completi, senza scadenza.';
        const row = document.createElement('div'); row.className = 'tg';
        (d.offers || []).forEach((o, i) => {
          const el = document.createElement('div'); el.className = 'tc'; el.style.borderColor = o.color + '55';
          el.innerHTML = '<div class="ic">' + o.icon + '</div><div class="nm" style="color:' + o.color + '">' + esc(o.nome) + '</div>' +
            '<div class="ds">' + esc(o.testo) + '</div><div class="pay">\uD83E\uDE99 ' + o.pay + '<span>alla consegna</span></div>';
          el.onclick = () => { if (cb.take) cb.take(i); };
          row.appendChild(el);
        });
        tg.appendChild(row);
      }
      // --- magazzino ---
      const mag = $('banditStock'); mag.innerHTML = '';
      (d.stock || []).forEach(it => {
        const el = document.createElement('div'); el.className = 'mi' + (it.worn ? ' on' : '');
        el.innerHTML = '<div class="sl">' + it.icon + '</div><div><div class="nm" style="color:' + it.color + '">' + esc(it.name) + '</div>' +
          '<div class="ds">' + esc(it.slotName) + ' \u00b7 rango ' + it.rank + '</div></div>' +
          (it.worn ? '<span class="add">addosso</span>'
                   : (it.cost ? '<button data-sell="' + it.id + '">vendi <b>\uD83E\uDE99' + it.pay + '</b></button>'
                              : '<span class="add" style="color:#6f7890">di partenza</span>'));
        const b = el.querySelector('button');
        if (b) el.onclick = (e) => { const t = e.target.closest('button'); if (t && cb.sell) cb.sell(t.dataset.sell); };
        mag.appendChild(el);
      });
    },

    // ===== v1.71 — IL BANCO DELL'ERBORISTA =====
    // Sopra i tre slot con dentro cio' che porti, sotto il catalogo. Si clicca uno slot per selezionarlo,
    // poi una pozione del catalogo per assegnarla: due gesti, nessun trascinamento, nessun menu' annidato.
    showPotions(data, cb) {
      if (data) this._pot = data; if (cb) this._potCb = cb;
      const panel = $('potionPanel'); if (!panel || !this._pot) return;
      panel.classList.remove('hidden'); this._renderPotions();
    },
    hidePotions() { const panel = $('potionPanel'); if (panel) panel.classList.add('hidden'); this._potSig = null; },
    _renderPotions() {
      const d = this._pot; if (!d) return;
      const hd = $('potionHead');
      if (hd) hd.innerHTML = '\uD83C\uDF3F <b>Erborista</b> \u2014 hai <b>' + (d.coins || 0) + '</b> \uD83E\uDE99';
      if (this._potSel == null) this._potSel = 0;
      const sig = JSON.stringify(d.belt) + '|' + (d.coins || 0) + '|' + this._potSel;
      if (sig === this._potSig) return; this._potSig = sig;
      const cb = this._potCb || {};
      // --- i tre slot ---
      const row = $('potionBelt'); row.innerHTML = '';
      d.belt.forEach((s, i) => {
        const it = s ? POT.BY_ID[s.id] : null;
        const el = document.createElement('div');
        el.className = 'bs' + (i === this._potSel ? ' sel' : '');
        if (it) el.style.setProperty('--c', it.color);
        let html = '<span class="slotno">SLOT ' + (i + 1) + ' \u2014 TASTO ' + (i + 1) + '</span>';
        if (!it) html += '<div class="vuoto">\u2014 vuoto \u2014<br>scegli una pozione</div>';
        else {
          let pips = ''; for (let k = 0; k < POT.MAX_CHARGES; k++) pips += '<i class="' + (k < s.n ? 'on' : '') + '"></i>';
          const pieno = s.n >= POT.MAX_CHARGES, caro = (d.coins || 0) < it.cost;
          html += '<div class="ic">' + it.icon + '</div><div class="nm" style="color:' + it.color + '">' + esc(it.name) + '</div>' +
                  '<div class="ds">' + esc(it.desc) + '<br><span class="dur">' + esc(it.durTxt) + '</span></div>' +
                  '<div class="pips">' + pips + '</div><div class="row">' +
                  '<button class="buy' + (pieno || caro ? ' off' : '') + '" data-buy="' + i + '">' +
                  (pieno ? 'piena' : '+1 carica <b>\uD83E\uDE99' + it.cost + '</b>') + '</button>' +
                  '<button data-sel="' + i + '">cambia</button></div>';
        }
        el.innerHTML = html;
        el.onclick = (e) => {
          const b = e.target.closest('button');
          if (b && b.dataset.buy != null) { if (cb.buy) cb.buy(+b.dataset.buy); return; }
          this._potSel = i; this._potSig = null; this._renderPotions();
        };
        row.appendChild(el);
      });
      // --- il catalogo ---
      const sub = $('potionCatSub');
      if (sub) sub.textContent = 'Clicca una pozione per metterla nello slot ' + (this._potSel + 1) + '. Un tipo per slot: quelle già in cintura sono spente.';
      const cat = $('potionCat'); cat.innerHTML = '';
      d.list.forEach(it => {
        const dove = d.belt.findIndex(s => s && s.id === it.id);
        const suo = dove === this._potSel;
        const el = document.createElement('div');
        el.className = 'pc' + (dove >= 0 && !suo ? ' in' : '') + (suo ? ' pick' : '');
        el.innerHTML = '<div class="ic">' + it.icon + '</div><div><div class="nm" style="color:' + it.color + '">' + esc(it.name) + '</div>' +
          '<div class="ds">' + esc(it.desc) + ' \u00b7 ' + esc(it.dur) + '</div>' +
          (dove >= 0 && !suo ? '<span class="tag">\u2014 già nello slot ' + (dove + 1) + '</span>' : '') +
          '</div><div class="cost">\uD83E\uDE99' + it.cost + '</div>';
        if (dove < 0) el.onclick = () => { if (cb.pick) cb.pick(this._potSel, it.id); };
        cat.appendChild(el);
      });
    },
    _renderGearNpc() {
      const d = this._gearNpc; if (!d) return;
      const hd = $('gearHead');
      if (hd) hd.innerHTML = '\uD83D\uDD28 <b>Fabbro</b> \u2014 hai <b>' + (d.coins || 0) + '</b> \uD83E\uDE99';
      // la firma evita di ricostruire il pannello 20 volte al secondo mentre resti vicino al fabbro
      const sig = JSON.stringify((d.slots || []).map(sl => [sl.slot, (sl.items || []).map(i => [i.id, i.owned])])) + '|' + (d.coins || 0);
      if (sig === this._gearNpcSig) return; this._gearNpcSig = sig;
      const wrap = $('gearNpcCards'); if (!wrap) return;
      this._gearSlots(wrap, d, (id) => { if (this._buyGearNpc) this._buyGearNpc(id); });
    },
    lobby(room, players, meId, onStart, onChange) { $('lobby').classList.remove('hidden'); $('lobbyRoom').textContent = room; const lp = $('lobbyPlayers'); lp.innerHTML = ''; players.forEach(p => { const h = HERO[p.h] || HERO.guerriero; const el = document.createElement('div'); el.className = 'lp'; el.innerHTML = `<span class="dot" style="background:${h.color}"></span>${HeroIcon[p.h] || '🎮'} <b>${p.n}</b> ${p.i === meId ? '(tu)' : ''}`; lp.appendChild(el); }); $('startBtn').onclick = onStart; $('changeHeroBtn').onclick = onChange; },
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
          const h = HERO[r.h] || HERO.guerriero; const mine = me && r.i === me.i;
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
