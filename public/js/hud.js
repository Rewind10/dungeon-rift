/* hud.js — interfaccia: vite, XP, negozio, BOON, modalità, barra abilità */
(function () {
  'use strict';
  const HERO = window.GAME.Heroes.HEROES, HORDER = window.GAME.Heroes.ORDER, MON = window.GAME.Monsters.MONSTERS, BOSSES = window.GAME.Monsters.BOSSES, LOOT = window.GAME.Loot, RAR = window.GAME.Constants.RARITY, SLOT_ICO = window.GAME.Gear.SLOT_ICON;
  const POT = window.GAME.Potions, BNT = window.GAME.Bounties;
  const $ = (id) => document.getElementById(id); const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const iconHTML = (ic, cls) => (typeof ic === 'string' && /\.(png|svg|webp|jpg)$/i.test(ic)) ? `<img class="${cls || ''}" src="/${ic}" alt="" draggable="false">` : `<span class="emoji">${ic}</span>`; const HeroIcon = { guerriero: '🛡️', mago: '🔮', ladro: '🏹' };
  const EVO_NAME = {}; for (const k of Object.keys(LOOT.WEAPONS)) { const w = LOOT.WEAPONS[k]; if (w.evo) EVO_NAME[w.evo.id] = { name: w.evo.name, icon: w.icon, color: w.evo.color }; }
  const HUD = {
    selectedHero: 'guerriero', _boons: null, _stats: null, _gear: null, _active: [],
    // v1.91 — la griglia della modalita' di prova: un pulsante per ondata. Le ondate col boss sono
    // marcate, perche' sono quelle che uno vuole provare per prime.
    buildProva(max, cb) {
      const g = $('provaGrid'); if (!g) return;
      g.innerHTML = '';
      const BOSS = { 10: 1, 20: 1 };
      for (let n = 1; n <= max; n++) {
        const el = document.createElement('button');
        el.className = 'pw' + (BOSS[n] ? ' boss' : '');
        el.textContent = BOSS[n] ? (n + ' ☠') : String(n);
        el.title = BOSS[n] ? ('Ondata ' + n + ' — boss') : ('Ondata ' + n);
        el.onclick = () => cb(n);
        g.appendChild(el);
      }
    },
    buildHeroSelect(cb) { const w = $('heroSelect'); w.innerHTML = ''; HORDER.forEach(id => { const h = HERO[id]; const el = document.createElement('div'); el.className = 'hero-chip' + (id === this.selectedHero ? ' sel' : ''); el.style.setProperty('--pick', h.color); el.innerHTML = `<div class="avatar" style="background:${h.color2};color:${h.accent}">${HeroIcon[id]}</div><div class="hname">${h.name}</div><div class="hrole">${h.title}</div>`; el.onclick = () => { this.selectedHero = id; this.buildHeroSelect(cb); this.showHeroDetail(id); if (cb) cb(id); }; w.appendChild(el); }); this.showHeroDetail(this.selectedHero); },
    // v1.66 — la scheda non mostra piu' Q/E (rimosse): al loro posto l'ARMA e la statistica che la governa,
    // che sono le due cose da sapere per scegliere la classe adesso.
    // v1.86.1 — LA SCHEDA DELLA CLASSE NON STA PIU' NEL MENU. Era un riquadro di sei righe (arma, danni,
    // cadenza, statistica, scatto, passiva, pregi e difetti) fra i tre eroi e il pulsante: copriva
    // l'illustrazione e chiedeva di studiare una tabella prima di poter entrare in partita. Le tre classi
    // si scelgono dai loro tre riquadri, e cosa sanno fare si scopre giocandole. La funzione resta e non
    // fa niente finche' il riquadro non c'e': se un giorno lo si rimette altrove, torna a riempirlo.
    showHeroDetail(id) { const h = HERO[id]; const SCH = { melee: ['💪', 'Forza', 'semicerchio in mischia'], magic: ['🔮', 'Intelligenza', 'proiettili magici'], ranged: ['🏹', 'Destrezza', 'tiro a distanza'] }[h.weapon.school] || ['⚔️', '—', '']; const box = document.getElementById('heroDetail'); if (!box) return; box.innerHTML = `<h3 style="color:${h.accent}">${h.name} — <span style="color:#c9d2e6;font-weight:600">${h.title}</span></h3><div class="ab"><span class="k">SX</span><b>${h.weapon.name}</b> — ${SCH[2]}, ${h.weapon.dmg} danni, ${h.weapon.fireRate}/s</div><div class="ab"><span class="k">${SCH[0]}</span><b>${SCH[1]}</b> — alza danno e cadenza di quest'arma</div><div class="ab"><span class="k">🖱▸</span><b>Scatto</b> — tasto destro: attraversa i nemici.</div><div class="ab pas">🛡️ ${h.passives.map(p => '<b>' + p.name + '</b>').join(' · ')}</div><div class="sw"><span class="s">▲ ${h.strengths}</span><br><span class="w">▼ ${h.weakness}</span></div>`; },
    // v1.66 — niente piu' slot Q/E: la barra tiene solo cio' che il giocatore puo' davvero premere.
    // v1.85 — quattro slot: scatto, arma, e le due ABILITA' ATTIVE. Q ed E nascono col LUCCHETTO e
    // dicono a che livello si aprono — un riquadro vuoto si legge come un guasto, uno chiuso come una meta.
    buildAbilityBar(id) {
      const h = HERO[id]; const bar = $('abilityBar'); bar.innerHTML = '';
      const wi = { melee: '🗡️', magic: '🔮', ranged: '🏹' }[h.weapon.school] || '🔫';
      // v2.16 — TRE slot di abilita' sui tasti 1, 2 e 3 (prima erano due, su Q ed E). Il terzo non ha
      // ancora nessuna abilita' dentro: si vede spento e dice «in arrivo», perche' un posto vuoto
      // dichiarato e' meglio di un posto che non esiste e poi compare.
      const LV = (window.GAME && window.GAME.Levels) ? window.GAME.Levels.ABIL_SLOT : [{ lvl: 1 }, { lvl: 7 }, { lvl: 13 }];
      const AB3 = (window.GAME && window.GAME.Abilities) ? window.GAME.Abilities : null;
      const vuoto3 = !AB3 || !AB3.perSlot(id, 3).length;
      const slots = [{ k: 'DX', ic: '💨', t: 'Scatto' }, { k: 'SX', ic: wi, t: h.weapon.name },
        { k: '1', ic: '🔒', t: 'Livello ' + ((LV[0] || {}).lvl || 1), lock: 1 },
        { k: '2', ic: '🔒', t: 'Livello ' + ((LV[1] || {}).lvl || 7), lock: 1 },
        { k: '3', ic: vuoto3 ? '…' : '🔒', t: vuoto3 ? 'In arrivo' : ('Livello ' + ((LV[2] || {}).lvl || 13)), lock: 1, vuoto: vuoto3 }];
      slots.forEach((s, i) => {
        const el = document.createElement('div'); el.className = 'ab-slot' + (s.lock ? ' locked' : '') + (s.vuoto ? ' vuoto' : ''); el.id = 'ab' + i; el.title = s.t || '';
        el.innerHTML = '<span class="key">' + s.k + '</span><span class="ic">' + s.ic + '</span><span class="lbl">' + (s.t || '') + '</span><div class="cd hidden"></div>';
        bar.appendChild(el);
      });
      this._abSlot = [null, null, null];
      this._misuraBarra(bar);
    },
    // ============================================================================================
    // v2.16.2 — QUANTO E' LARGA LA BARRA: misurata DAVVERO, non una volta sola a vuoto
    // ============================================================================================
    // Cintura, riquadro dell'eroe e vitali si appoggiano ai fianchi della barra delle abilita' e si
    // posizionano da `--abw`. Nella v2.16.1 la misura si prendeva una volta, dentro `buildAbilityBar`.
    // Ed e' li' che ho sbagliato: `buildAbilityBar` gira quando si sceglie il personaggio, cioe' quando
    // l'HUD e' ancora NASCOSTO. Un elemento nascosto misura ZERO, la riga «se e' zero non scrivo niente»
    // faceva il suo dovere, e il CSS restava sul valore di riserva (480px) — cioe' esattamente lo
    // scostamento sbagliato di prima. In partita la cintura finiva di nuovo sopra la barra.
    //
    // La prova non l'aveva visto perche' il suo fixture misurava a HUD gia' visibile: provava che la
    // formula e' giusta, non che il numero ci arrivi. Adesso:
    //   · un ResizeObserver guarda la barra e scrive la misura quando passa da zero a larga;
    //   · e a ogni aggiornamento si ricontrolla, che costa una lettura e copre i browser senza observer.
    _misuraBarra(bar) {
      const el = bar || $('abilityBar'); if (!el) return;
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0 && w !== this._abw) {
        this._abw = w;
        document.documentElement.style.setProperty('--abw', w + 'px');
      }
      if (!this._abObs && typeof ResizeObserver === 'function') {
        try {
          this._abObs = new ResizeObserver(() => this._misuraBarra());
          this._abObs.observe(el);
        } catch (e) { this._abObs = null; }
      }
    },
    updateAbilities(me) {
      if (!me) return;
      this._misuraBarra();
      const set = (i, cd, pronta) => { const el = $('ab' + i); if (!el) return; const c = el.querySelector('.cd');
        if (cd > 0.1) { c.classList.remove('hidden'); c.textContent = cd < 10 ? cd.toFixed(1) : String(Math.ceil(cd)); el.classList.remove('ready'); }
        else { c.classList.add('hidden'); if (pronta !== false) el.classList.add('ready'); } };
      set(0, me.cd || 0);
      const f = $('ab1'); if (f) f.classList.add('ready');
      // l'abilita' arriva a partita in corso: il riquadro si riempie quando succede, non prima
      this._abSlot = this._abSlot || [null, null, null];
      const AB = (window.GAME && window.GAME.Abilities) ? window.GAME.Abilities.BY_ID : {};
      const riempi = (i, id) => {
        const el = $('ab' + i); if (!el) return;
        const a = id ? AB[id] : null;
        if (!a) return;
        el.classList.remove('locked'); el.title = a.name + ' — ' + a.desc;
        el.querySelector('.ic').textContent = a.icon;
        el.querySelector('.lbl').textContent = a.name;
        el.style.borderColor = a.color;
      };
      // v2.16 — tre slot, e arrivano come un elenco solo (`ab`) invece di due campi sciolti.
      const ab = me.ab || [], cab = me.cab || [];
      for (let k = 0; k < 3; k++) {
        if (ab[k] && this._abSlot[k] !== ab[k]) { this._abSlot[k] = ab[k]; riempi(2 + k, ab[k]); }
        set(2 + k, cab[k] || 0, !!ab[k]);
      }
    },
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
      // v2.7 — NELLA CELLA NON C'E' NESSUNA ONDATA. "ONDATA 0/20 · NEMICI 0" in cima al risveglio era
      // la cosa piu' stonata della scena: dice al giocatore che sta giocando a un gioco a ondate prima
      // ancora che il gioco gli abbia detto dov'e'. Li' la barra sparisce e basta.
      // ATTENZIONE: qui c'era un `return`, e si portava via tutto quello che viene DOPO in questa
      // funzione — compresa la fiala della vita, che nel prologo restava vuota con scritto "—/—".
      // Si nasconde la barra e si va avanti: nascondere un pezzo non vuol dire saltare il resto.
      const tb = $('topbar');
      const inPrologo = snap.phase === 'prologo';
      if (tb) tb.classList.toggle('hidden', inPrologo);
      // v2.7 — "ONDATA 0/20" non vuol dire niente: l'ondata 0 e' il villaggio d'apertura, quello in cui
      // si arriva dalla cella e non si e' ancora combattuto. Un trattino dice la stessa cosa senza mentire.
      if (!inPrologo) {
        $('waveNum').textContent = snap.wave > 0 ? (snap.wave + '/' + window.GAME.Constants.FINAL_WAVE) : '\u2014';
        $('ecNum').textContent = snap.mcount + (snap.pend > 0 ? '+' : '');
      }
      const ph = { combat: 'COMBATTIMENTO', boss: '⚠ BOSS', shop: 'POTENZIAMENTI', lobby: 'LOBBY', gameover: 'SCONFITTA', victory: 'VITTORIA', cleared: '✔ MAPPA RIPULITA' };
      let phase = ph[snap.phase] || '';
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
      // v1.78 — MAPPA RIPULITA: avviso in alto e pulsante EXIT al centro. Il pulsante torna al suo stato
      // di partenza appena la fase cambia, se no alla ondata dopo lo si troverebbe gia' "in attesa".
      this._aggiornaUscita(snap);
      if (me) {
        this._updateVitals(me);
        let chips = `<div class="chip">💀 ${me.k}</div><div class="chip" style="color:#8bffb0">✦ ${me.xp} XP</div><div class="chip" style="color:#ffcf4a" title="monete">🪙 ${me.co || 0}</div>`;
        if (me.w2) { let W = LOOT.WEAPONS[me.w2] || EVO_NAME[me.w2] || {}; const evo = me.evo || EVO_NAME[me.w2]; const nm = W.name || 'Arma'; const col = W.color || '#ffd24a'; const pips = me.evo ? '★★★' : ('●'.repeat(me.w2l || 1) + '○'.repeat(3 - (me.w2l || 1))); chips += `<div class="chip buff" style="border-color:${col};color:${col}">${W.icon || '🔫'} ${nm} <b>${pips}</b></div>`; }
        if (me.tb && me.tb.length) { const map = {}; for (const b of LOOT.CRATE_BUFFS) map[b.id] = b; for (const it of LOOT.ITEMS) if (it.buff) map[it.buff] = { name: it.name, icon: it.icon, color: it.color }; chips += me.tb.map(id => { const b = map[id]; return b ? `<div class="chip buff" style="border-color:${b.color};color:${b.color}">${b.icon} ${b.name}</div>` : ''; }).join(''); }
        this._coins = me.co || 0; if (!$('merchantPanel').classList.contains('hidden')) this._renderMerchant();
        $('statChips').innerHTML = chips;
        // v1.6 — combo meter
        const cm = $('comboMeter');
        // v1.78 — a mappa ripulita il contatore di combo sparisce: la combo e finita comunque, e li in
        // mezzo starebbe sopra alla scritta ONDATA COMPLETATA.
        if (me.cmb && me.cmb >= 3 && snap.phase !== 'cleared') {
          cm.classList.remove('hidden');
          $('comboN').textContent = me.cmb;
          $('comboMult').textContent = 'x' + (me.cmx || 1).toFixed(1);
          $('comboBar').style.width = Math.round((me.cmt || 0) * 100) + '%';
          if (me.cmb !== this._lastCombo) { cm.classList.remove('pop'); void cm.offsetWidth; cm.classList.add('pop'); this._lastCombo = me.cmb; }
        } else { cm.classList.add('hidden'); this._lastCombo = 0; }
      } else { $('comboMeter').classList.add('hidden'); }
    },
    // v1.78 — l'uscita dalla mappa ripulita. In singolo il pulsante chiude subito l'ondata; in
    // cooperativa aspetta che tutti abbiano premuto (i caduti non si aspettano) e nel frattempo dice a
    // che punto e' l'attesa. Il conto alla rovescia e' l'anti-AFK, non una fretta.
    _aggiornaUscita(snap) {
      const top = $('clearTop'); if (!top) return;
      const hud = $('hud');
      if (snap.phase !== 'cleared') {
        if (this._uscitaOn) { top.classList.add('hidden'); if (hud) hud.classList.remove('ripulita'); this._uscitaOn = false; this._exitPremuto = false; }
        return;
      }
      this._uscitaOn = true;
      // gli annunci al centro (LEVEL UP, rango nuovo) nascono al 20% dell'altezza, cioe' esattamente
      // sopra la scritta: finche' la mappa e' ripulita scendono piu' in basso.
      if (hud) hud.classList.add('ripulita');
      top.classList.remove('hidden');
      const ex = snap.ex || { n: 0, tot: 1, t: 0 };
      const sub = $('clearSub');
      // v1.84 — non c'e' piu' un pulsante da premere: si attraversa la faglia. La riga qui sotto dice
      // solo cosa fare e quanto tempo resta; l'uscita e' un gesto di gioco, non un clic sull'interfaccia.
      const mio = snap.players && snap.players.find(x => x.i === this._meId);
      if (sub) sub.innerHTML = this._exitPremuto
        ? (ex.tot > 1 ? 'Sei passato: <b>' + ex.n + ' su ' + ex.tot + '</b> — si parte quando ci siete tutti (o fra ' + ex.t + 's)' : 'Uscita in corso…')
        : 'Raccogli quello che resta, poi attraversa la <b>faglia</b>'
          + (ex.tot > 1 ? ' <span style="opacity:.75">(' + ex.n + '/' + ex.tot + ' passati)</span>' : '')
          + ' <span style="opacity:.6">— automatica fra ' + ex.t + 's</span>';
    },
    exitPremuto() { this._exitPremuto = true; },
    // v1.78 — IL RIEPILOGO DI FINE LIVELLO, in cima al pannello di fine ondata.
    setWaveStats(m) {
      this._wstats = m;
      const box = $('waveStats'); if (!box) return;
      if (!m) { box.classList.add('hidden'); return; }
      const mm = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
      const cella = (v, k, cl) => '<div class="ws-i ' + (cl || '') + '"><div class="v">' + v + '</div><div class="k">' + k + '</div></div>';
      let h = '<div class="ws-h">Ondata ' + m.wave + ' — riepilogo</div><div class="ws-row">';
      h += cella('💀 ' + (m.uccisi || 0), 'nemici');
      h += cella('✦ ' + (m.xp || 0), 'esperienza', 'xp');
      h += cella('🪙 ' + (m.monete || 0), 'monete', 'oro');
      h += cella('⏱ ' + mm(m.durata || 0), (m.par ? 'su ' + mm(m.par) : 'durata'));
      if (m.livelli > 0) h += cella('▲ ' + m.livelli, m.livelli === 1 ? 'livello' : 'livelli', 'liv');
      h += '</div>';
      if (m.bonus) h += '<div class="ws-b si">⚡ Sotto il tempo obiettivo: <b>+' + m.bonus.xp + ' XP</b> e <b>+' + m.bonus.monete + ' monete</b></div>';
      else if (m.par) h += '<div class="ws-b no">Fuori dal tempo obiettivo di ' + mm(m.par) + ' — nessun premio di velocita\u0300</div>';
      box.innerHTML = h; box.classList.remove('hidden');
    },
    updateBossBar(snap) { const boss = snap.mon.find(m => m.b); const wrap = $('bossBarWrap'); if (boss) { wrap.classList.remove('hidden'); const def = MON[boss.t] || BOSSES[boss.t] || {}; $('bossName').textContent = (def.name || 'BOSS').toUpperCase(); const bar = wrap.querySelector('#bossBar i'); bar.style.width = (100 * Math.max(0, boss.hp / boss.mhp)) + '%'; bar.style.background = boss.mg ? 'linear-gradient(90deg,#ff2d55,#b061ff)' : 'linear-gradient(90deg,#ff2d55,#ff7a3d)'; } else wrap.classList.add('hidden'); },
    killfeed(text) { const kf = $('centerFeed') || $('killfeed'); const el = document.createElement('div'); el.className = 'cf-item'; el.innerHTML = text; kf.appendChild(el); void el.offsetWidth; el.classList.add('show'); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 2600); while (kf.children.length > 4) kf.removeChild(kf.firstChild); },
    // NEGOZIO (statistiche XP) + BOON
    showShop() { $('upgradeScreen').classList.remove('hidden'); this.mostraSezione(this._sez || 'riepilogo'); this._render(); },
    setStats(data, onBuy, onReady, onEquip) { this._stats = data; this._buy = onBuy; this._ready = onReady; if (onEquip) this._equipaggia = onEquip;
      if (data) { this._heroId = data.heroId || this._heroId; this._spec = data.spec || 0; } if (!$('upgradeScreen').classList.contains('hidden')) this._render(); else this.showShop(); },
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
      // v2.13.2 — il titolo non c'e' piu' nel markup: quello che diceva («RANGO», «SPECIALIZZAZIONE»)
      // e' finito dentro la riga piccola qui sotto, che e' l'unica rimasta.
      // v2.13.2 — il titolo non c'e' piu': quello che diceva («SPECIALIZZAZIONE») e' entrato nella riga
      // piccola, che e' l'unica rimasta. Senza, una specializzazione sembrerebbe una carta di rango
      // qualunque — ed e' l'unica scelta della partita che non si puo' rifare.
      $('rankSub').innerHTML = d.spec
        ? '<b style="color:#c8a23a">\u2605 ' + esc(d.title || 'SPECIALIZZAZIONE') + '</b> \u2014 vale per questa partita e si vede addosso al tuo personaggio'
        : 'Carta di <b>rango ' + ['I', 'II', 'III', 'IV', 'V'][(d.rank || 1) - 1] + '</b> \u2014 resta per tutta la partita';
      row.className = d.spec ? 'spec' : '';
      row.innerHTML = '';
      d.cards.forEach(c => {
        const el = document.createElement('div'); el.className = 'bc';
        el.style.borderColor = c.color || '#c8a23a';
        // v2.13.3 — stessa forma della carta dei poteri: una riga, icona a sinistra. L'etichetta
        // ("SPECIALIZZAZIONE" / "CARTA DI RANGO") la dice gia' la riga sopra le carte, una volta per tutte
        // e tre, invece che tre volte in piccolo.
        el.title = (c.name || '') + ' \u2014 ' + (d.spec ? 'Specializzazione' : 'Carta di rango')
          + '\n' + (c.desc || '') + (c.abilita ? '\n' + c.abilita : '');
        el.innerHTML = '<div class="icon">' + (c.icon || '\u2605') + '</div>'
          + '<div class="tx"><div class="nm">' + esc(c.name) + '</div>'
          + '<div class="ds">' + esc(c.desc) + '</div>'
          + (c.abilita ? '<div class="ab">' + esc(c.abilita) + '</div>' : '') + '</div>';
        el.onclick = () => { if (this._pickRank) this._pickRank(c.id); if (this._rank) this._rank.picked = true; this._render(); };
        row.appendChild(el);
      });
    },
    setBoons(data, onPick) { this._boons = data; this._pick = onPick; if (!$('upgradeScreen').classList.contains('hidden')) this._render(); else this.showShop(); },
    // v1.67 — il pannello del fabbro non mostra piu' tre barre da riempire ma il CATALOGO della classe,
    // una riga per slot. Ogni carta e' un oggetto con un nome: quello indosso e' marcato IN USO, gli altri
    // portano il prezzo. Il cambio e' libero, quindi non si "sblocca" niente — si sceglie.
    // v2.12 — LE COLONNE SONO I CARATTERI, E NON SI SPOSTANO MAI. Ogni carta sta nella colonna del suo
    // carattere: pesante a sinistra, equilibrata al centro, leggera a destra, in tutti i gradi e in tutti
    // gli slot. E' l'unico modo perche' il bivio si legga: se le carte scorressero una dietro l'altra,
    // confrontare due pesanti di grado diverso vorrebbe dire cercarle. Il grado di partenza ha un pezzo
    // solo e sta al centro, perche' e' equilibrato.
    _carCol: { pesante: 1, equilibrata: 2, leggera: 3 },
    _carIcon: { pesante: '▰', equilibrata: '▱', leggera: '▫' },
    // v2.15.2 — l'icona grande della carta, come l'ampolla dell'Erborista. Gear.SLOT_ICON e' la
    // stessa fonte che nomina le linguette: un solo posto da cui esce il simbolo di uno slot.
    _gearCard(it, coins, onBuy, onSell, slot) {
      const inUso = !!it.owned, tuo = !inUso && !!it.have, afford = tuo || coins >= it.cost;
      const el = document.createElement('div');
      el.className = 'gq' + (inUso ? ' on' : (afford ? '' : ' no'));
      el.style.setProperty('--c', it.color);
      // il prezzo anche come dato sull'elemento: a schermo si legge solo su cio' che non hai ancora
      // ("gia' tuo" e "in uso" non lo mostrano), e l'ordine della griglia e' il prezzo. Senza questo
      // il controllo dovrebbe dedurlo dal testo, e dedurrebbe zero dove il testo non lo dice.
      el.dataset.cost = it.cost;
      el.dataset.rank = it.rank;
      // ============================================================================================
      // v2.15.2 — LA CELLA E' FATTA COME QUELLA DELL'ERBORISTA
      // ============================================================================================
      // Parole di Paolo: «prendi esempio dall'erborista, il suo catalogo l'hai fatto bene». E aveva
      // ragione: quel catalogo e' una CARTA ORIZZONTALE — icona a sinistra, nome nel suo colore,
      // descrizione sotto su una riga, prezzo in alto a destra — e si legge senza sforzo. Il quadrato
      // costringeva a incolonnare le statistiche una per riga e a rimpicciolire tutto per farcele stare:
      // il risultato era testo centrato e minuscolo, cioe' esattamente cio' che qui si voleva evitare.
      //
      // Quindi: TRE per riga invece di quattro (le carte sono larghe, non alte), testo a sinistra,
      // statistiche di seguito separate da '\u00b7' come le fa `gear.js`, e niente piu' tooltip.
      const rar = RAR[it.rarity] || RAR.common;
      const stato = inUso ? '<span class="tag on">\u2605 in uso</span>'
        : tuo ? '<span class="tag tuo">gi\u00e0 tuo</span>'
        : it.cost > 0 ? '' : '<span class="tag base">di base</span>';
      // la rivendita si scrive solo dove NON c'e' il pulsante Vendi, che porta gia' la cifra.
      const riv = (it.vendita > 0 && !(tuo && onSell)) ? '<span class="riv">rivendi ' + it.vendita + '</span>' : '';
      const zoccolo = (stato || riv || (tuo && it.vendita > 0 && onSell))
        ? '<div class="gfoot">' + stato + riv
          + (tuo && it.vendita > 0 && onSell ? '<button class="gsell" type="button">\uD83E\uDE99 vendi ' + it.vendita + '</button>' : '')
          + '</div>' : '';
      // L'ICONA: non l'emoji dello slot, che sarebbe la stessa su tutte e tredici le carte della
      // linguetta e non direbbe niente, ma il simbolo del CARATTERE (\u25b0 pesante, \u25b1 equilibrata,
      // \u25ab leggera) nel colore del grado. E' l'unica cosa che distingue una carta dall'altra a
      // colpo d'occhio, ed e' il simbolo che il giocatore vede gia' nel baule.
      // IL PREZZO sta sulla riga del grado, non in alto a destra come dall'Erborista: li' i nomi sono
      // corti ("Cura", "Fretta"), qui sono "Scettro delle Stelle Morte", e riservargli l'angolo
      // spezzava il nome in due righe su meta' delle carte.
      el.innerHTML = '<div class="ic">' + (this._carIcon[it.carattere] || '\u25b1') + '</div>'
        + '<div class="gtx">'
        + '<div class="nm" style="color:' + rar.color + '">' + esc(it.name) + '</div>'
        + '<div class="grd"><span>' + esc(rar.name) + (it.carattere ? ' \u00b7 ' + esc(it.carattere) : '') + '</span>'
        + (it.cost > 0 && !inUso && !tuo ? '<b class="cost' + (afford ? '' : ' no') + '">\uD83E\uDE99' + it.cost + '</b>' : '')
        + '</div>'
        + '<div class="ds">' + esc(it.desc || '') + '</div>'
        + zoccolo
        + '</div>'
        ;
      el.onclick = () => { if (!inUso && afford && onBuy) onBuy(it.id); };
      const b = el.querySelector('.gsell');
      if (b) b.onclick = (e) => { e.stopPropagation(); if (onSell) onSell(it.id); };
      return el;
    },
    // ============================================================================================
    // v2.14 — FASE 3: IL NEGOZIO A ICONE QUADRATE
    // ============================================================================================
    // Com'era, e perche' non andava. Dalla 2.12 il fabbro mostrava TUTTI i pezzi della classe in una
    // colonna sola: tredici per slot, tre slot, trentanove carte alte 150px dentro un pannello da
    // 620. Si scorreva per due schermate, e il confronto — che e' l'unica cosa che serve in un
    // negozio — si faceva a memoria.
    //
    // Adesso: una LINGUETTA PER SLOT (ne vedi 13 per volta invece di 39) e dentro i pezzi come ICONE
    // QUADRATE, le stesse del baule e della banda delle scelte. Il menu ha un solo modo di disegnare
    // «una cosa che si sceglie cliccandola», e adesso e' lo stesso in tutti e tre i posti.
    //
    // Cosa NON e' cambiato, ed e' il punto: le tre colonne restano i CARATTERI — pesante a sinistra,
    // equilibrata al centro, leggera a destra, in tutti i gradi — e le righe restano i gradi. E' la
    // griglia che rende leggibile il bivio della fase 1: due pesanti di grado diverso stanno una
    // sopra l'altra, e si confrontano senza cercarle.
    _gearSlots(wrap, data, onBuy, onSell) {
      const slots = data.slots || [];
      wrap.innerHTML = '';
      if (!slots.length) return;
      // la linguetta aperta si ricorda PER CLASSE: riaprire il fabbro e ritrovare lo slot che stavi
      // guardando e' la differenza fra un negozio e un modulo da riempire ogni volta.
      if (!this._gslot || !slots.some(x => x.slot === this._gslot)) this._gslot = slots[0].slot;

      const tabs = document.createElement('nav'); tabs.className = 'gtabs';
      slots.forEach(sl => {
        const b = document.createElement('button'); b.type = 'button';
        b.className = 'gtab' + (sl.slot === this._gslot ? ' on' : '');
        // il pallino dice «qui dentro c'e' qualcosa che puoi permetterti e non hai addosso»: senza,
        // per sapere se vale la pena aprire una linguetta bisogna aprirla.
        const pero = (sl.items || []).some(it => !it.owned && (it.have || (data.coins || 0) >= it.cost) && it.cost > 0);
        b.innerHTML = '<span class="ic">' + sl.icon + '</span>' + esc(sl.name) + (pero ? '<i class="pt"></i>' : '');
        b.onclick = () => { this._gslot = sl.slot; this._gearNpcSig = null; this._renderGearNpc(); };
        tabs.appendChild(b);
      });
      wrap.appendChild(tabs);

      // v2.14.1 — UNA GRIGLIA SOLA, QUATTRO PER RIGA, IN ORDINE DI PREZZO.
      // Prima erano cinque fasce, una per grado, con il nome del grado a sinistra e il prezzo a destra.
      // Paolo: i titoli non servono (il colore della cella dice gia' il grado) e la colonna dei prezzi
      // a destra «non vuol dire nulla», perche' il prezzo e' scritto sulla cella. Tolti entrambi, resta
      // il colore — che e' l'informazione, non l'etichetta.
      // L'ORDINE E' IL PREZZO: e' la domanda vera davanti a un negozio («cosa posso permettermi»), e
      // lasciando il grado a fare da ordine si leggeva una classifica che non si usa. A pari prezzo
      // resta pesante, equilibrata, leggera, se no due partite di fila mostrerebbero ordini diversi.
      const sl = slots.find(x => x.slot === this._gslot) || slots[0];
      const ord = { pesante: 0, equilibrata: 1, leggera: 2 };
      const pezzi = (sl.items || []).slice().sort((a, b) =>
        (a.cost - b.cost) || ((ord[a.carattere] || 0) - (ord[b.carattere] || 0)));
      const griglia = document.createElement('div'); griglia.className = 'ggriglia';
      pezzi.forEach(it => griglia.appendChild(this._gearCard(it, data.coins || 0, onBuy, onSell, sl.slot)));
      wrap.appendChild(griglia);
    },
    // v2.13 — il pannello di fine ondata non ha piu' un negozio dentro (SHOP_GEAR_ENABLED e' spento e
    // resta spento: il fabbro e' uno, al villaggio). Questa resta per non rompere il richiamo dal server
    // se qualcuno lo riaccende, ma non disegna piu' niente qui: si limita a tenere il dato.
    setGear(data, onBuyGear) { this._gear = data; this._buyGear = onBuyGear; },
    // ===== v1.79 — IL MENU A SEZIONI ========================================================
    // Il pannello di fine ondata non e' piu' una colonna sola con tutto dentro: sono quattro sezioni con
    // una barra in basso. `_sez` e' quella aperta; il riepilogo e' la sezione di default perche' e' quella
    // che risponde alla domanda che il giocatore ha appena finito di farsi ("com'e' andata?").
    // v2.13 — le linguette sono due e stanno nella colonna di sinistra: PERSONAGGIO e ABILITA'. Il
    // riepilogo dell'ondata non e' piu' una scheda (e' finito sotto le statistiche, dov'e' il suo posto:
    // "com'e' andata" e "come sono messo" sono la stessa domanda) e il villaggio e' un pulsante in fondo.
    // v2.13.5 — NON CI SONO PIU' SEZIONI DA MOSTRARE. Le linguette erano l'ultimo residuo del pannello
    // a schede: con una schermata che mostra tutto insieme, una linguetta vuol dire «qui c'e' qualcosa
    // che non vedi», cioe' il difetto che questa schermata e' nata per togliere. La funzione resta
    // perche' `showShop()` la chiama, e si limita a riportare in cima la colonna che scorre.
    mostraSezione() {
      const sx = document.querySelector('.col-sx'); if (sx) sx.scrollTop = 0;
    },
    // C'e' una scelta in sospeso? Finche' c'e', la mappa successiva non parte: uno scaglione saltato per
    // distrazione non si recupera piu'.
    _scelteInSospeso() {
      if (this._rank && this._rank.cards && this._rank.cards.length && !this._rank.picked) return 'spec';
      if (this._boons && this._boons.boons && this._boons.boons.length && !this._boons.picked) return 'abilita';
      return null;
    },
    _render() {
      this._renderRank();
      this._renderAbilita();
      this._renderPersonaggio();
      this._renderRiepilogo();
      this._renderBaule();
      this._renderAddosso();
      this._aggiornaBarra();
      this._avviaRitratto();
    },
    _aggiornaBarra() {
      const sosp = this._scelteInSospeso();
      const btn = $('nextWaveBtn'), nota = $('goNota');
      if (btn) {
        btn.classList.toggle('off', !!sosp);
        btn.disabled = !!sosp;
        btn.textContent = this._pronto ? '⏳  IN ATTESA DEGLI ALTRI' : '▶  PROSSIMA MAPPA';
      }
      if (nota) {
        // v2.13 — «nella sezione ABILITA'» non e' piu' vero: la scelta in sospeso non sta in una scheda,
        // sta nella banda in cima alla schermata, sotto gli occhi. E la coda «puoi passare dal villaggio»
        // e' sparita: il villaggio e' un pulsante a due centimetri da qui, ridirlo a parole e' rumore.
        nota.innerHTML = sosp === 'spec' ? 'Scegli prima la tua <b>specializzazione</b>, l\u00ec in cima.'
          : sosp === 'abilita' ? 'Hai un\'<b>abilità da scegliere</b>, l\u00ec in cima.'
          : (this._pronto ? 'Aspettiamo gli altri giocatori.'
            : ((window.GAME.Storia && window.GAME.Storia.menu && window.GAME.Storia.menu.riparti) || 'Quando sei pronto, rimandalo giù.'));
      }
      // v2.13 — il villaggio e' un pulsante, non una linguetta. All'ultima ondata non c'e' piu' villaggio
      // dove andare: si spegne invece di sparire, cosi' chi lo cercava capisce che c'era ed e' finito.
      const vil = $('villaggioBtn');
      if (vil) {
        const ultima = this._stats && this._stats.wave >= (window.GAME.Constants.FINAL_WAVE || 20);
        vil.classList.toggle('off', !!ultima); vil.disabled = !!ultima;
        vil.title = ultima ? 'L\'ultima ondata non passa piu\' dal villaggio' : 'Fabbro, Ostessa, Erborista, Banditore e Cartomante';
      }
    },
    _renderRiepilogo() {
      // v2.8.1 — LE RIGHE DEL DONO. Dopo il colpo di scena questa schermata diceva una cosa falsa: lui
      // non impara niente, riceve. Il testo sta in shared/storia.js come tutto il resto del parlato, e
      // da qui si limita ad atterrare negli elementi giusti. Il PATTO — la spiegazione per esteso —
      // compare solo a fine ondata 1: letta venti volte sarebbe rumore.
      // v2.13 — la riga "da qui puoi guardare il personaggio, le abilita', il villaggio..." e' sparita
      // insieme alle linguette che elencava. Adesso si vede tutto insieme: non c'e' piu' niente da spiegare.
      this._righeDono();
    },
    // ---- SEZIONE ABILITA': la scelta in sospeso, poi quello che hai gia' preso ----
    _renderAbilita() {
      const brow = $('boonCards'); if (!brow) return; brow.innerHTML = '';
      const bs = $('boonSub'), bt = $('boonTitle');
      // v2.8.2 — "Dona al tuo avatar una nuova abilita'" si mostra SOLO quando c'e' davvero una carta da
      // dare. Con la scelta chiusa il titolo diventa "nessuna scelta questa volta", e sotto restava un
      // invito a donare qualcosa che non c'e': un invito a fare una cosa impossibile e' peggio di niente.
      const na = $('notaAbilita');
      const aperta = !!(this._boons && this._boons.boons && this._boons.boons.length && !this._boons.picked);
      if (na) na.classList.toggle('hidden', !aperta);
      // v2.13 — LA BANDA IN CIMA. Compare solo se c'e' davvero qualcosa da scegliere, e prende tutta la
      // larghezza: tre carte da leggere e confrontare non stanno in una colonna laterale, e una scelta in
      // sospeso non e' una scheda fra le altre — e' la cosa da fare adesso.
      const rk = !!(this._rank && this._rank.cards && this._rank.cards.length && !this._rank.picked);
      const banda = $('sceltaBanda'); if (banda) banda.classList.toggle('hidden', !(aperta || rk));
      if (aperta) {
        $('boonSection').classList.remove('hidden');
        const rar = RAR[this._boons.tier] || {};
        // v2.8.1 — "CONCEDIGLI", non "scegli": la carta non se la prende lui, gliela dai tu.
        if (bt) bt.textContent = this._boons.abil ? ('\u26a1 ABILIT\u00c0 ATTIVA \u2014 TASTO ' + (this._boons.tasto || '1')) : '\uD83C\uDCCF CONCEDIGLI UN\'ABILIT\u00c0';
        if (bs && this._boons.abil) bs.innerHTML = '<b style="color:#7cc7ff">\u26a1 Abilit\u00e0 attiva</b> \u2014 si usa col tasto <b>' + (this._boons.tasto || '1') + '</b>, si ricarica in <b>'
          + ((this._boons.boons[0] && this._boons.boons[0].cd) || 30) + 's</b> · livello <b>' + (this._boons.liv || 6) + '</b>'
          + ' <span style="opacity:.75">— la scelta vale per tutta la partita</span>';
        else if (bs) bs.innerHTML = 'Scaglione <b>' + (this._boons.scaglione || 1) + ' di ' + (this._boons.tot || 4) + '</b> — '
          + '<b style="color:' + (this._boons.tierColor || '#fff') + '">' + (this._boons.tierName || '') + '</b>'
          + ' · livello <b>' + (this._boons.liv || 1) + '</b>'
          + (this._boons.resta > 1 ? ' <span style="opacity:.75">(ne restano ' + this._boons.resta + ')</span>' : '');
        this._boons.boons.forEach(b => {
          const r = RAR[b.rarity] || RAR.common;
          const el = document.createElement('div'); el.className = 'bc'; el.style.borderColor = r.color;
          const chi = b.hero && b.hero !== '*' ? 'DELLA TUA CLASSE' : 'PER TUTTI';
          // v2.13.3 — LA CARTA E' UNA RIGA. Quello che c'era scritto in piccolo sotto — la rarita' e il
          // "per tutti / della tua classe" — e' finito nel TITOLO: la rarita' si vede gia' dal colore del
          // bordo, e la classe conta una volta su dieci. Cio' che resta a schermo e' cio' che serve per
          // scegliere: icona, nome, e la riga che dice cosa fa.
          // v2.16.3 — NIENTE PIU' TOOLTIP, come al fabbro. Le carte della banda erano quadrati da 84px con
          // la descrizione nascosta nel `title`: si leggeva una carta per volta col mouse fermo sopra,
          // cioe' il contrario di quello che serve quando si deve SCEGLIERE fra tre. Adesso sono carte
          // orizzontali come quelle dell'armeria — icona a sinistra, nome nel colore del grado, grado e
          // «per tutti / della tua classe» sotto, e la descrizione scritta per esteso.
          el.innerHTML = '<div class="icon">' + b.icon + '</div>'
            + '<div class="tx">'
            + '<div class="nm" style="color:' + r.color + '">' + esc(b.name) + '</div>'
            // su un'ABILITA' ATTIVA il grado non esiste: il `tier` che arriva col pacchetto ('raro',
            // 'divino') e' solo il colore della banda, e scriverlo sulla carta direbbe una cosa falsa.
            // Li' si scrive cosa e' davvero: attiva, su che tasto, con che ricarica.
            + '<div class="rar">' + (this._boons.abil
                ? ('\u26a1 attiva \u00b7 tasto ' + (this._boons.tasto || '1') + (b.cd ? ' \u00b7 ricarica ' + b.cd + 's' : ''))
                : (esc(r.name || '') + ' \u00b7 ' + chi)) + '</div>'
            + '<div class="ds">' + esc(b.desc || '') + '</div>'
            + '</div>';
          // v2.11.2 — `if (this._boons)` non e' pignoleria. `hideShop()` azzera `_boons`, e se il pannello si
          // chiude nello stesso fotogramma in cui clicchi (cambia la fase: parte l'ondata, o si va al
          // villaggio) questa riga tirava un'eccezione: la scelta arrivava al server ma il pannello NON si
          // ridisegnava, e a schermo restava la carta come se il clic non fosse mai avvenuto.
          el.onclick = () => { if (this._pick) this._pick(b.id); if (this._boons) this._boons.picked = true; this._render(); };
          brow.appendChild(el);
        });
      } else if (this._boons && this._boons.boons && !this._boons.boons.length) {
        // niente da scegliere: si dice PERCHE', se no un riquadro vuoto si legge come un guasto
        $('boonSection').classList.remove('hidden');
        if (bt) bt.textContent = '🎴 NESSUNA SCELTA QUESTA VOLTA';
        if (bs) bs.innerHTML = this._boons.cap
          ? 'Sei al <b>livello ' + (this._boons.max || 15) + '</b>, il massimo: la crescita finisce qui.'
          : (function (L, prossimo, manca) {
            // v2.16.2 — i livelli non si scrivono piu' a mano: qui diceva ancora «3, 6, 9 e 12» e
            // «all'8 e al 14», cioe' la scaletta di due versioni fa. Si leggono da levels.js.
            const pas = L ? L.SCAGLIONI.map(x => x.lvl) : [3, 5, 9, 11];
            const att = L ? L.ABIL_SLOT.map(x => x.lvl) : [1, 7, 13];
            const elenco = (a) => a.length < 2 ? ('<b>' + a.join('') + '</b>')
              : ('<b>' + a.slice(0, -1).join('</b>, <b>') + '</b> e <b>' + a[a.length - 1] + '</b>');
            const base = 'Passive ai livelli ' + elenco(pas) + ', abilità attive ai livelli ' + elenco(att) + '.';
            return prossimo ? base + ' La prossima al <b>livello ' + prossimo + '</b>'
              + (manca ? ', fra <b>' + manca + ' XP</b>' : '') + '.' : base;
          })((window.GAME && window.GAME.Levels) || null, this._boons.prossimo, this._boons.manca);
      } else { $('boonSection').classList.add('hidden'); }
      this._renderElencoAbilita();
    },
    // L'elenco per scaglione: quattro righe fisse, cosi' si vede a colpo d'occhio cosa manca ancora.
    // v1.87 — SEI RIGHE in ordine di livello: le quattro passive (3, 6, 9, 12) piu' le due abilita'
    // attive (8 e 14). E' l'unico posto in cui si vede la run intera in una schermata: cosa hai preso,
    // cosa hai saltato e cosa manca ancora.
    _renderElencoAbilita() {
      const cont = $('abilElenco'); if (!cont) return;
      // v2.16 — la scaletta non si scrive piu' a mano qui: si legge da levels.js, che e' l'unico posto
      // che la decide. Scritta due volte, prima o poi le due copie si allontanano e il pannello mente.
      const LVv = (window.GAME && window.GAME.Levels) ? window.GAME.Levels : null;
      const SC = LVv
        ? LVv.SCAGLIONI.map(x => ({ lvl: x.lvl, tier: x.tier }))
            .concat(LVv.ABIL_SLOT.map(x => ({ lvl: x.lvl, slot: x.slot, tasto: String(x.slot) })))
            .sort((a, b) => a.lvl - b.lvl)
        : [{ lvl: 1, slot: 1, tasto: '1' }, { lvl: 3, tier: 'uncommon' }, { lvl: 5, tier: 'rare' },
           { lvl: 7, slot: 2, tasto: '2' }, { lvl: 9, tier: 'epic' }, { lvl: 11, tier: 'divine' },
           { lvl: 13, slot: 3, tasto: '3' }];
      const prese = (this._active || []).filter(b => !b.syn);
      const liv = this._stats ? (this._stats.level || 1) : 1;
      // v2.16.3 — ATTENZIONE AL `tier` DELLE ABILITA'. Quando il pannello offre un'ABILITA' ATTIVA, il
      // server ci mette dentro un `tier` ('rare' per il primo slot, 'divine' per gli altri) che serve
      // SOLO a dare un colore alla banda. Qui veniva preso per buono, e cosi' scegliendo l'attiva del
      // livello 1 si accendeva «da scegliere adesso» anche sulla riga della passiva RARA del livello 5:
      // due righe che chiedevano una scelta, quando la scelta era una sola.
      const offertaAperta = !!(this._boons && this._boons.boons && this._boons.boons.length && !this._boons.picked);
      const inArrivo = (offertaAperta && !this._boons.abil) ? this._boons.tier : null;
      const inArrivoSlot = (offertaAperta && this._boons.abil) ? this._boons.slot : null;
      const AB = (window.GAME && window.GAME.Abilities) ? window.GAME.Abilities.BY_ID : {};
      let html = '';
      for (const sc of SC) {
        let etichetta, colore, corpo;
        if (sc.slot) {
          // v2.16.2 — DUE BACHI IN UNA RIGA SOLA, ed erano tutti e due miei della v2.16.
          // (a) `_abSlot` e' diventato un ARRAY indicizzato da 0, ma qui si leggeva con `sc.slot`, che
          //     vale 1, 2, 3: lo slot 1 pescava il secondo e lo slot 3 pescava niente.
          // (b) e comunque `_abSlot` lo riempie lo SNAPSHOT del gioco: al livello 1, appena scelta
          //     l'abilita' e prima ancora di scendere, non e' ancora arrivato nessuno snapshot — quindi
          //     la riga diceva «saltata» su un'abilita' appena presa.
          // Adesso si legge da `inv.abil`, che il server manda col pannello, e `_abSlot` resta solo come
          // ripiego per i pannelli vecchi.
          const daServer = (this._stats && this._stats.inv && this._stats.inv.abil) || null;
          const id = daServer ? daServer[sc.slot - 1] : (this._abSlot || [])[sc.slot - 1];
          const a = id ? AB[id] : null;
          etichetta = 'attiva ' + sc.tasto; colore = a ? a.color : '#8d97ab';
          corpo = a
            ? '<div class="card"><span class="ic">' + a.icon + '</span><span><span class="nm">' + esc(a.name) + '</span><div class="ds">' + esc(a.breve || '') + ' · ricarica ' + a.cd + 's</div></span></div>'
            : (inArrivoSlot === sc.slot ? '<span class="attesa">▲ da scegliere adesso</span>'
              : (liv >= sc.lvl ? '<span class="vuota">— saltata</span>' : '<span class="vuota">si sblocca al livello ' + sc.lvl + '</span>'));
        } else {
          const r = RAR[sc.tier] || {};
          const mia = prese.find(b => b.rarity === sc.tier);
          etichetta = r.name || ''; colore = r.color || '#8d97ab';
          corpo = mia
            ? '<div class="card"><span class="ic">' + mia.icon + '</span><span><span class="nm">' + esc(mia.name) + '</span><div class="ds">' + (mia.desc || '') + '</div></span></div>'
            : (inArrivo === sc.tier ? '<span class="attesa">▲ da scegliere adesso</span>'
              : (liv >= sc.lvl ? '<span class="vuota">— saltata</span>' : '<span class="vuota">si sblocca al livello ' + sc.lvl + '</span>'));
        }
        html += '<div class="ab-sc"><span class="lv" style="color:' + colore + '">Liv. ' + sc.lvl + '<br>' + etichetta + '</span>' + corpo + '</div>';
      }
      cont.innerHTML = html;
      const syn = (this._active || []).filter(b => b.syn);
      let sbox = $('abilSyn');
      if (!sbox && syn.length) { sbox = document.createElement('div'); sbox.id = 'abilSyn'; cont.parentNode.appendChild(sbox); }
      if (sbox) sbox.innerHTML = syn.map(x => '<span class="syn">' + x.icon + ' <b>' + esc(x.name) + '</b> — ' + (x.desc || '') + '</span>').join('');
    },
    // ---- SEZIONE PERSONAGGIO: punti, statistiche, inventario ----
    _renderPersonaggio() {
      if (!this._stats) return;
      this._renderDerivate(this._stats.inv && this._stats.inv.derivate);
      $('shopXp').textContent = this._stats.points != null ? this._stats.points : this._stats.xp;
      const sl = $('shopLevel'); if (sl) sl.textContent = (this._stats.level || 1) + (this._stats.cap ? ' (max)' : '');
      const sr = $('shopRank'); if (sr) sr.textContent = this._stats.rankName || '';
      // v2.13.1 — LA SCHEDA, NON QUATTRO CARTELLONI. Erano quattro riquadri grandi con icona, nome,
      // descrizione e prezzo: prendevano mezza colonna per dire quattro numeri. Adesso sono quattro
      // RIGHE, come su una scheda da GDR — nome, valore, tetto, e un `+` accanto al numero che si
      // accende solo quando hai i punti per premerlo. La descrizione non e' sparita: e' nel titolo,
      // dove serve quando la cerchi e non occupa spazio quando non la cerchi.
      const cont = $('upgradeCards'); cont.innerHTML = '';
      this._stats.stats.forEach(s => {
        const punti = this._stats.points != null ? this._stats.points : this._stats.xp;
        const maxed = !!s.maxed, afford = !maxed && punti >= s.cost;
        const base = s.base || 0, tetto = s.tetto || 20;
        const val = base + (s.lvl || 0);
        const el = document.createElement('div');
        el.className = 'st-r' + (maxed ? ' maxed' : '');
        el.style.setProperty('--c', s.color);
        el.title = s.name + ' — ' + s.desc
          + '\n' + base + ' di base per la classe, +' + (s.lvl || 0) + ' dai punti spesi'
          + (maxed ? '\nal massimo' : '\ncosta ' + s.cost + (s.cost === 1 ? ' punto' : ' punti'));
        el.innerHTML = '<span class="ic">' + s.icon + '</span>'
          + '<span class="nm">' + esc(s.name) + '</span>'
          + '<span class="vl">' + val + '</span><span class="mx">/' + tetto + '</span>'
          + (maxed ? '<span class="pl max">\u2605</span>'
                   : '<button class="pl' + (afford ? '' : ' off') + '" type="button" '
                     + (afford ? '' : 'disabled ') + 'title="' + (afford ? 'Spendi ' + s.cost + (s.cost === 1 ? ' punto' : ' punti') : 'Ti servono ' + s.cost + (s.cost === 1 ? ' punto' : ' punti')) + '">+</button>');
        const b = el.querySelector('button.pl');
        if (b) b.onclick = (e) => { e.stopPropagation(); if (afford && this._buy) this._buy(s.id); };
        cont.appendChild(el);
      });
    },
    // v2.13 — LE TRE DERIVATE (piu' il passo). Forza, Costituzione, Intelligenza e Destrezza si
    // spendevano alla cieca: il pannello diceva quanti punti avevi messo, mai che effetto avevano. Questi
    // sono i numeri che il motore usa davvero, calcolati dal server con le sue funzioni — non una
    // ricostruzione fatta qui, che il giorno di una ritaratura direbbe una cosa e il gioco un'altra.
    _renderDerivate(d) {
      const box = $('derivate'); if (!box) return;
      if (!d) { box.innerHTML = ''; return; }
      const v = [['⚔️', d.danno, 'danno per colpo'], ['🛡️', d.armatura + '%', 'danni assorbiti'],
                 ['⏱', d.cadenza + '/s', 'cadenza'], ['👟', d.passo, 'passo']];
      box.innerHTML = v.map(x => '<div class="dv"><span class="ic">' + x[0] + '</span><b>' + x[1] + '</b><i>' + x[2] + '</i></div>').join('');
    },
    // ============================================================================================
    // v2.13 — IL CENTRO E LA DESTRA
    // ============================================================================================
    // Prima c'era `_renderInventario`: un elenco di righe di testo dentro la scheda PERSONAGGIO, una
    // riga per slot, con nome e descrizione. Diceva tutto e non faceva vedere niente — e soprattutto
    // mostrava solo cio' che avevi ADDOSSO. Quello che possedevi e non indossavi (`p.owned`, il baule)
    // non compariva da nessuna parte se non andando dal fabbro, dall'altra parte del villaggio.
    //
    // Adesso sono due cose distinte e in due posti distinti: al CENTRO cio' che porti, a DESTRA cio'
    // che hai. Ed e' la destra a essere cliccabile, perche' e' li' che c'e' una decisione da prendere.

    // ---- CENTRO: gli slot addosso, sotto il ritratto ----
    _renderAddosso() {
      const box = $('slotAddosso'); if (!box) return;
      const inv = this._stats && this._stats.inv;
      if (!inv) { box.innerHTML = ''; return; }
      box.innerHTML = (inv.gear || []).map(g =>
        '<div class="sa" style="--c:' + g.colore + '" title="' + esc(g.nome) + (g.desc ? ' — ' + esc(g.desc) : '') + '">'
        + '<span class="ic">' + g.icona + '</span>'
        + '<span class="tx"><b>' + esc(g.nome) + '</b><i>' + esc(g.slotName) + '</i></span></div>').join('');
      const belt = $('beltAddosso');
      if (belt) belt.innerHTML = '<div class="sa-belt">' + (inv.belt || []).map((b, i) => b
        ? '<span class="pz" title="' + esc(b.nome) + '">' + b.icona + ' <b>' + b.n + '/' + b.max + '</b></span>'
        : '<span class="pz vuoto" title="Slot vuoto — assegnalo dall\'Erborista">slot ' + (i + 1) + '</span>').join('')
        + '</div><div class="sa-vite">' + '❤'.repeat(Math.max(0, inv.vite)) + ' <i>' + inv.vite + ' vite · ' + inv.hp + '/' + inv.hpMax + ' PV · 🪙 ' + inv.monete + '</i></div>';
    },

    // ---- CENTRO: il ritratto ----
    // Non e' un'illustrazione: e' il personaggio VERO, disegnato dalla stessa funzione che lo disegna in
    // partita (`Renderer._hero`), con addosso gli id dell'equipaggiamento che porta. Quindi le `tinta`
    // dei 104 pezzi si vedono qui esattamente come si vedono sulla mappa, e l'alone del divino pure —
    // se un giorno cambia il disegno del personaggio, cambia anche qui, senza che nessuno se ne ricordi.
    _avviaRitratto() {
      const cv = $('ritratto'); if (!cv || !window.Renderer) return;
      if (this._ritrattoOn) return;
      this._ritrattoOn = true;
      const giro = () => {
        if ($('upgradeScreen').classList.contains('hidden')) { this._ritrattoOn = false; return; }
        this._disegnaRitratto();
        requestAnimationFrame(giro);
      };
      requestAnimationFrame(giro);
    },
    _disegnaRitratto() {
      const cv = $('ritratto'); const R = window.Renderer; if (!cv || !R) return;
      const ctx = cv.getContext('2d'); if (!ctx) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const inv = this._stats && this._stats.inv; if (!inv) return;
      const eq = {
        h: this._heroId || 'guerriero',
        wp: (inv.gear.find(g => g.slot === 'weapon') || {}).id || null,
        arm: (inv.gear.find(g => g.slot === 'armor') || {}).id || null,
        sh: (inv.gear.find(g => g.slot === 'shield') || {}).id || null,
        stv: (inv.gear.find(g => g.slot === 'boots') || {}).id || null,
        sp: this._spec || 0,
      };
      const t = performance.now() / 1000;
      ctx.save();
      // v2.13.5 — il centro sta a meta' e il raggio resta sotto un terzo del lato: il disegno del
      // personaggio esce fino a 1,7 raggi (l'alone del divino), e con un raggio piu' grande la figura
      // veniva tagliata dal bordo del riquadro.
      ctx.translate(cv.width / 2, cv.height * 0.50);
      // il raggio: grande quanto ci sta, cosi' si vedono i dettagli che in partita sono di 16 pixel
      const r = Math.min(cv.width, cv.height) * 0.30;
      // guarda verso il basso-destra e ondeggia piano: fermo sembrerebbe un cadavere in piedi
      ctx.rotate(0.5 + Math.sin(t * 0.7) * 0.12);
      try { R._hero(ctx, eq.h, r, t, false, 0, eq); } catch (_) { /* il ritratto non deve poter rompere il menu */ }
      ctx.restore();
    },

    // ---- DESTRA: il baule ----
    // Clic = te lo metti addosso. Non costa niente ed e' il punto: e' roba gia' pagata, e chiedere di
    // attraversare il villaggio per cambiarsi una corazza che e' nel proprio baule non e' una regola,
    // e' un attrito. Comprare invece resta un gesto del fabbro: da qui non si compra e non si vende.
    _renderBaule() {
      const box = $('baule'); if (!box) return;
      const inv = this._stats && this._stats.inv;
      if (!inv || !inv.baule) { box.innerHTML = ''; return; }
      box.innerHTML = '';
      let quanti = 0;
      inv.baule.forEach(sl => {
        if (!sl.pezzi || !sl.pezzi.length) return;
        const g = document.createElement('div'); g.className = 'bgr';
        const h = document.createElement('div'); h.className = 'bgr-h';
        h.innerHTML = '<span class="ic">' + sl.icona + '</span> ' + esc(sl.slotName);
        g.appendChild(h);
        const riga = document.createElement('div'); riga.className = 'bgr-row';
        sl.pezzi.forEach(it => {
          quanti++;
          const rar = RAR[it.rarita] || RAR.common;
          const el = document.createElement('div');
          el.className = 'bq' + (it.addosso ? ' on' : '');
          el.style.setProperty('--c', it.colore);
          el.title = it.nome + ' — ' + rar.name + ' ' + (it.carattere || '') + '\n' + (it.desc || '')
                   + (it.addosso ? '\n\n(lo stai portando)' : '\n\nClic per indossarlo');
          el.innerHTML = '<span class="car">' + (this._carIcon[it.carattere] || '') + '</span>'
            + '<span class="nm">' + esc(it.nome) + '</span>'
            + '<span class="rr" style="color:' + rar.color + '">' + esc(rar.name) + '</span>'
            + (it.addosso ? '<span class="on-b">★</span>' : '');
          el.onclick = () => { if (!it.addosso && this._equipaggia) this._equipaggia(it.id); };
          riga.appendChild(el);
        });
        g.appendChild(riga); box.appendChild(g);
      });
      const nota = $('bauleNota');
      // un baule con dentro solo cio' che hai addosso non e' un baule: si dice, invece di mostrare
      // una griglia che sembra rotta.
      if (nota) nota.innerHTML = quanti > (inv.gear || []).length
        ? 'Tutto quello che hai comprato resta tuo. <b>Clic per indossarlo</b> — non costa niente, l\'hai già pagato.'
        : 'Qui finisce tutto quello che compri dal <b>fabbro</b>, al villaggio. Per adesso porti addosso l\'unica roba che hai.';
    },
    // v1.51 — barra dei POTERI ATTIVI, sopra la barra abilita'. Aggiornata solo quando il server manda
    // l'elenco (scelta di un potere / sinergia / inizio partita), non a ogni frame.
    // v1.73 — la barra dei gettoni in basso e' stata SOSTITUITA dal box del personaggio (updateHeroBox):
    // mostrava le stesse icone senza dire a chi appartenevano ne' quante ne potevi tenere accese.
    setActiveBoons(list) { this._active = list || []; this._cardMax = 0; this._heroSig = null; this._renderHeroCards();
      if (!$('upgradeScreen').classList.contains('hidden')) this._render(); },
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
    showInn(data, onRest, onSalva) {
      if (data) this._inn = data; if (onRest) this._innCb = onRest; if (onSalva) this._salvaCb = onSalva;
      const panel = $('innPanel'); if (!panel || !this._inn) return;
      panel.classList.remove('hidden'); this._renderInn();
    },
    hideInn() { const panel = $('innPanel'); if (panel) panel.classList.add('hidden'); this._innSig = null; },
    // v2.11 — IL SALVATAGGIO, nello stesso pannello del riposo. Il pulsante dice sempre PERCHE' non si
    // puo', quando non si puo': un pulsante spento e muto si legge come un guasto, e chi gioca resta li'
    // a chiedersi se ha sbagliato qualcosa.
    _renderSalva(d) {
      const b = $('innSalva'); if (!b) return;
      if (!d || d.salvaOk === undefined) { b.classList.add('hidden'); return; }
      b.classList.remove('hidden');
      if (d.salvaOk === 2) {          // gia' salvato qui: si puo' rifare, ma si dice che e' gia' fatto
        b.innerHTML = '\uD83D\uDCBE salva di nuovo \u2014 <b>\uD83E\uDE99' + d.salvaCosto + '</b>';
        b.className = 'parz'; b.onclick = () => { if (this._salvaCb) this._salvaCb(); };
      } else if (d.salvaOk === 1) {
        b.innerHTML = '\uD83D\uDCBE salva la partita \u2014 <b>\uD83E\uDE99' + d.salvaCosto + '</b>';
        b.className = ''; b.onclick = () => { if (this._salvaCb) this._salvaCb(); };
      } else if (d.salvaOk === -1) {
        b.textContent = 'il salvataggio e per le partite in singolo';
        b.className = 'off'; b.onclick = null;
      } else if (d.salvaOk === 0) {
        b.innerHTML = 'per salvare servono <b>\uD83E\uDE99' + d.salvaCosto + '</b>';
        b.className = 'off'; b.onclick = null;
      } else { b.classList.add('hidden'); }
    },
    _renderInn() {
      const d = this._inn; if (!d) return;
      const hd = $('innHead');
      if (hd) hd.innerHTML = '\uD83C\uDF7A <b>Ostessa</b> \u2014 hai <b>' + (d.coins || 0) + '</b> \uD83E\uDE99';
      const sig = [d.hp, d.mx, d.coins, d.salvaCosto, d.salvaOk, d.ondata].join('|');
      if (sig === this._innSig) return; this._innSig = sig;
      this._renderSalva(d);
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
    hideShop() { $('upgradeScreen').classList.add('hidden'); this._boons = null; this._stats = null; this._gear = null; this._rank = null; this._pronto = false; this._sez = 'riepilogo'; },
    // v1.79 — premuto PROSSIMA MAPPA il menu NON si chiude: in cooperativa si aspettano gli altri, e
    // chiudere il pannello lascerebbe il giocatore a fissare una mappa ferma senza sapere perche'.
    prontoPerOndata() { this._pronto = true; this._aggiornaBarra(); },
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
    showGear(data, onBuy, onSell) {
      if (data) this._gearNpc = data; if (onBuy) this._buyGearNpc = onBuy; if (onSell) this._sellGearNpc = onSell;
      const panel = $('gearPanel'); if (!panel || !this._gearNpc) return;
      panel.classList.remove('hidden'); this._renderGearNpc();
    },
    hideGear() { const panel = $('gearPanel'); if (panel) panel.classList.add('hidden'); this._gearNpcSig = null; },

    // ===== v1.71 — LA CINTURA =====
    // v2.16 — DUE riquadri (erano tre) accanto alla barra abilita', e sui tasti Q ed E: i numeri sono
    // passati alle abilita' attive, che dalla v2.16 sono tre. Si ricostruiscono SOLO quando cambia qualcosa (firma):
    // ridisegnarli 20 volte al secondo farebbe ripartire l'animazione dei pallini a ogni snapshot.
    // Il velo del cooldown, invece, si muove ogni frame — ma e' un'altezza in CSS, non HTML nuovo.
    buildBelt() {
      const POT_TASTI = ['Q', 'E'];
      const bar = $('beltBar'); if (!bar) return;
      let html = '';
      for (let i = 0; i < POT.SLOTS; i++) {
        html += '<div class="pot-slot empty" id="pot' + i + '"><span class="key">' + (POT_TASTI[i] || (i + 1)) + '</span>' +
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
      const sig = JSON.stringify([d.coins, d.bounty, d.offers, d.merc]);
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
      // --- v1.82: la compagnia di ventura ---
      // Un candidato per volta, del tuo stesso livello, prendere o lasciare. Se ne hai gia' uno il banco
      // te lo ricorda e non ne offre un altro: uno solo per volta, e finche' e' vivo e' quello.
      const box = $('banditMerc'), msub = $('mercSub'); box.innerHTML = '';
      const M = d.merc || {};
      const ICO = { guerriero: '\u2694\uFE0F', mago: '\uD83D\uDD2E', ladro: '\uD83C\uDFF9' };
      const CLA = { guerriero: 'Guerriero', mago: 'Mago', ladro: 'Ladro' };
      if (M.assunto) {
        if (msub) msub.textContent = 'Ne hai gia\u2019 uno al soldo. Lo ritrovi sulla mappa, curato.';
        const el = document.createElement('div'); el.className = 'mi on';
        el.innerHTML = '<div class="sl">' + (ICO[M.assunto.hero] || '\u2694\uFE0F') + '</div><div><div class="nm">' + esc(M.assunto.nome) + '</div>' +
          '<div class="ds">' + (CLA[M.assunto.hero] || '') + ' \u00b7 livello ' + M.assunto.lvl + '</div></div><span class="add">al tuo soldo</span>';
        box.appendChild(el);
      } else if (M.motivo === 'solo') {
        if (msub) msub.textContent = 'I mercenari si assoldano solo in partita singola.';
      } else if (M.off) {
        if (msub) msub.textContent = 'Uno solo per volta. Ti segue nella mappa, non al villaggio, e se cade se ne assume un altro.';
        const o = M.off, puo = (d.coins || 0) >= o.costo;
        const el = document.createElement('div'); el.className = 'mi';
        el.innerHTML = '<div class="sl">' + (ICO[o.hero] || '\u2694\uFE0F') + '</div><div><div class="nm">' + esc(o.nome) + '</div>' +
          '<div class="ds">' + (CLA[o.hero] || '') + ' \u00b7 livello ' + o.lvl + ' \u00b7 nessuna abilit\u00e0</div></div>' +
          '<button data-hire="1"' + (puo ? '' : ' disabled') + '>assolda <b>\uD83E\uDE99' + o.costo + '</b></button>';
        if (puo) el.onclick = () => { if (cb.hire) cb.hire(); };   // tutta la riga e' il gesto: il bottone e' solo il prezzo
        box.appendChild(el);
      } else {
        if (msub) msub.textContent = 'Nessuno al banco in questo momento.';
      }
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
      // v2.16 — gli slot si chiamano col loro TASTO (Q ed E), non col numero: i numeri adesso sono le
      // abilita', e dire «slot 1» mandando il giocatore a premere 1 sarebbe un invito a sbagliare.
      const TASTI = ['Q', 'E'];
      if (sub) sub.textContent = 'Clicca una pozione per metterla nello slot ' + (TASTI[this._potSel] || (this._potSel + 1)) + '. Un tipo per slot: quelle già in cintura sono spente.';
      const cat = $('potionCat'); cat.innerHTML = '';
      d.list.forEach(it => {
        const dove = d.belt.findIndex(s => s && s.id === it.id);
        const suo = dove === this._potSel;
        const el = document.createElement('div');
        el.className = 'pc' + (dove >= 0 && !suo ? ' in' : '') + (suo ? ' pick' : '');
        el.innerHTML = '<div class="ic">' + it.icon + '</div><div><div class="nm" style="color:' + it.color + '">' + esc(it.name) + '</div>' +
          '<div class="ds">' + esc(it.desc) + ' \u00b7 ' + esc(it.dur) + '</div>' +
          (dove >= 0 && !suo ? '<span class="tag">\u2014 già nello slot ' + (TASTI[dove] || (dove + 1)) + '</span>' : '') +
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
      // v2.12 — nella firma entra anche `have`: senza, vendere un pezzo del BAULE non cambiava niente di
      // cio' che la firma guarda (id e `owned` restavano identici) e il pannello non si ridisegnava —
      // il pulsante "Vendi" restava li' su un pezzo che non avevi piu'.
      const sig = JSON.stringify((d.slots || []).map(sl => [sl.slot, (sl.items || []).map(i => [i.id, i.owned, i.have])])) + '|' + (d.coins || 0);
      if (sig === this._gearNpcSig) return; this._gearNpcSig = sig;
      const wrap = $('gearNpcCards'); if (!wrap) return;
      this._gearSlots(wrap, d, (id) => { if (this._buyGearNpc) this._buyGearNpc(id); },
                                (id) => { if (this._sellGearNpc) this._sellGearNpc(id); });
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
    _righeDono() {
      const M = (window.GAME.Storia && window.GAME.Storia.menu) || null; if (!M) return;
      const set = (id, t) => { const e = $(id); if (e) e.textContent = t; };
      set('menuCornice', M.cornice);
      set('notaPunti', M.punti); set('notaEmporio', M.emporio);
      set('notaAbilita', M.abilita); set('notaRango', M.rango);
      if (M.poteri) set('titoloPoteri', M.poteri);
      const w = this._stats ? this._stats.wave : 0;
      const pat = $('menuPatto');
      if (pat) { pat.textContent = M.patto; pat.classList.toggle('hidden', w !== 1); }
    },

    // ===== v2.7 — LA STORIA: sottotitoli e missione ==============================================
    // Il testo compare UNA LETTERA ALLA VOLTA. Non e' un vezzo: una riga che appare tutta insieme si
    // legge in un colpo d'occhio e si preme subito, e la voce non ha il tempo di essere una voce. Le
    // lettere che arrivano danno il ritmo del parlato, ed e' quello che fa la differenza fra un
    // dialogo e una didascalia.
    //
    // Chi ha gia' letto non aspetta: il primo Spazio FINISCE la riga invece di passare alla
    // successiva. E' la convenzione di tutti i giochi che hanno dialoghi, e chi la conosce la usa
    // senza pensarci.
    VEL: 34,                                    // millisecondi per lettera
    // v2.9 — LA PAUSA. Una riga marcata `p:1` nel copione aspetta questo prima di cominciare a scriversi:
    // sono le "Pause" e le didascalie (`l'oracolo osserva`, `sorride appena`). Scritte a schermo direbbero
    // al giocatore cosa dovrebbe provare; un silenzio di mezzo secondo prima di «Un Dio.» glielo fa
    // provare. Il riquadro col volto resta li' muto: e' il volto che fa la pausa, non il testo.
    PAUSA: 900,                                 // millisecondi di silenzio prima di una riga marcata
    _dial: null,

    // ===== v2.8 — I RITRATTI ======================================================================
    // Disegnati a codice come tutto il resto del gioco: zero asset, e cambiano colore col tema di chi
    // parla. Sono di FRONTE — gli eroi in campo si vedono dall'alto, e una testa vista dall'alto in un
    // riquadro di dialogo non si legge come una faccia. Qui invece guardano in camera, ed e' quello a
    // farli leggere come qualcuno che ti sta parlando.
    //
    // Semplici apposta: ottanta pixel non reggono i dettagli. Ognuno ha la sua SILHOUETTE — l'elmo con
    // la feritoia, il cappuccio col cappello a punta, la maschera, le corna — e quella basta.
    _rrc(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r);
      g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); },
    ritratto(chi, eroeId) {
      const cv = $('dialFaccia'); if (!cv || !cv.getContext) return;
      // la voce senza volto del risveglio non ha ritratto, e non e' una mancanza: e' la scena
      if (!chi) { cv.classList.add('vuoto'); return; }
      cv.classList.remove('vuoto');
      const g = cv.getContext('2d'), W = cv.width, H = cv.height;
      g.clearRect(0, 0, W, H);
      const P = {
        oracolo:  { veste: '#3f6b60', vesteDk: '#1c332e', pelle: '#d6b48f', acc: '#7fd6c0' },
        // v2.9.2 — la guardia: acciaio e ottone. Volutamente LONTANA dal verderame dell'oracolo, perche'
        // quando compare quel riquadro il giocatore deve capire in mezzo secondo che non e' il vecchio.
        guardia:   { veste: '#6b7382', vesteDk: '#262c36', pelle: '#dcae7e', acc: '#c9a227' },
        guerriero: { veste: '#7f8895', vesteDk: '#2f3742', pelle: '#e0b183', acc: '#e0a52c' },
        mago:      { veste: '#3d3c8c', vesteDk: '#14133a', pelle: '#e3c396', acc: '#00f0c8' },
        ladro:     { veste: '#3c5140', vesteDk: '#1d2a22', pelle: '#e6c79c', acc: '#9ef0b0' },
      }[chi === 'tu' ? (eroeId || 'guerriero') : chi] || { veste: '#6b5a3c', vesteDk: '#3a3020', pelle: '#e0b183', acc: '#ffcf4a' };

      // fondo: un alone del colore di chi parla, cosi' il riquadro non e' un buco nero
      const bg = g.createRadialGradient(W / 2, H * 0.62, 4, W / 2, H * 0.62, W * 0.72);
      bg.addColorStop(0, P.vesteDk); bg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);

      const cx = W / 2, cy = H * 0.56, R = W * 0.30;
      // le SPALLE, che stanno sotto a tutto e dicono la corporatura
      g.fillStyle = P.veste; g.strokeStyle = '#07080c'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(cx, cy + R * 1.72, R * (chi === 'tu' && eroeId === 'guerriero' ? 1.62 : 1.34), R * 0.82, 0, Math.PI, 0);
      g.closePath(); g.fill(); g.stroke();
      // la TESTA
      g.fillStyle = P.pelle; g.strokeStyle = '#07080c'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(cx, cy, R * 0.86, R, 0, 0, 7); g.fill(); g.stroke();

      const occhi = (dy, col) => { g.fillStyle = col || '#15171f';
        g.beginPath(); g.ellipse(cx - R * 0.33, cy + dy, R * 0.13, R * 0.17, 0, 0, 7);
        g.ellipse(cx + R * 0.33, cy + dy, R * 0.13, R * 0.17, 0, 0, 7); g.fill(); };

      if (chi === 'oracolo') {
        // CORNA e cappuccio: si riconosce dalla sagoma, prima ancora che dal colore
        g.strokeStyle = '#e8e0cc'; g.lineWidth = 5; g.lineCap = 'round';
        for (const lato of [-1, 1]) { g.beginPath(); g.moveTo(cx + lato * R * 0.7, cy - R * 0.5);
          g.quadraticCurveTo(cx + lato * R * 1.5, cy - R * 1.3, cx + lato * R * 1.05, cy - R * 1.85); g.stroke(); }
        g.lineCap = 'butt';
        g.fillStyle = P.veste; g.strokeStyle = '#07080c'; g.lineWidth = 3;
        g.beginPath(); g.ellipse(cx, cy - R * 0.34, R * 1.02, R * 0.86, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
        occhi(-R * 0.02, '#0b1512');
        g.fillStyle = P.acc;   // due punti di luce negli occhi: e' lui che ti guarda
        g.beginPath(); g.arc(cx - R * 0.33, cy - R * 0.06, R * 0.055, 0, 7); g.arc(cx + R * 0.33, cy - R * 0.06, R * 0.055, 0, 7); g.fill();
        g.strokeStyle = '#cfc7b4'; g.lineWidth = 2.4;   // la barba
        for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(cx + i * R * 0.24, cy + R * 0.6);
          g.lineTo(cx + i * R * 0.30, cy + R * 1.3); g.stroke(); }
      } else if (chi === 'guardia') {
        // v2.9.2 — ELMO APERTO COL NASALE. L'elmo del guerriero e' chiuso e ha la feritoia: li' dentro non
        // c'e' nessuno da guardare negli occhi, ed e' giusto cosi' per un eroe. La guardia invece deve
        // poterti guardare MALE, quindi la faccia si vede: occhi, bocca dritta, e una barra di ferro in
        // mezzo. Basta la sagoma a dire che non e' ne' l'oracolo ne' il tuo avatar.
        occhi(-R * 0.02);
        g.strokeStyle = '#3a2a1c'; g.lineWidth = 3.2; g.lineCap = 'round';       // la bocca: una linea dritta
        g.beginPath(); g.moveTo(cx - R * 0.30, cy + R * 0.60); g.lineTo(cx + R * 0.30, cy + R * 0.60); g.stroke();
        g.lineCap = 'butt';
        g.fillStyle = P.veste; g.strokeStyle = '#07080c'; g.lineWidth = 3;       // la calotta
        g.beginPath(); g.ellipse(cx, cy - R * 0.22, R * 1.00, R * 0.96, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
        this._rrc(g, cx - R * 0.11, cy - R * 0.30, R * 0.22, R * 0.66, R * 0.08); g.fill(); g.stroke();   // il nasale
        g.fillStyle = P.acc; g.strokeStyle = '#07080c'; g.lineWidth = 2;         // la borchia in fronte
        g.beginPath(); g.arc(cx, cy - R * 0.66, R * 0.12, 0, 7); g.fill(); g.stroke();
      } else if (eroeId === 'guerriero') {
        // ELMO con la feritoia: la cosa piu' riconoscibile che esista
        g.fillStyle = '#8d97a5'; g.strokeStyle = '#07080c'; g.lineWidth = 3;
        g.beginPath(); g.ellipse(cx, cy - R * 0.12, R * 1.0, R * 1.06, 0, Math.PI, 0);
        g.lineTo(cx + R, cy + R * 0.5); g.lineTo(cx - R, cy + R * 0.5); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#11141a';    // la feritoia
        this._rrc(g, cx - R * 0.72, cy - R * 0.22, R * 1.44, R * 0.36, R * 0.14); g.fill();
        g.fillStyle = P.acc; g.beginPath();  // e due occhi che brillano dentro
        g.arc(cx - R * 0.32, cy - R * 0.04, R * 0.085, 0, 7); g.arc(cx + R * 0.32, cy - R * 0.04, R * 0.085, 0, 7); g.fill();
        g.fillStyle = '#6f7a88'; this._rrc(g, cx - R * 0.09, cy - R * 1.0, R * 0.18, R * 1.5, R * 0.08); g.fill();  // la cresta
      } else if (eroeId === 'mago') {
        // CAPPELLO A PUNTA e barba: idem
        occhi(0);
        g.strokeStyle = '#d9d4c8'; g.lineWidth = 2.6;
        for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(cx + i * R * 0.26, cy + R * 0.55);
          g.lineTo(cx + i * R * 0.34, cy + R * 1.45); g.stroke(); }
        g.fillStyle = P.veste; g.strokeStyle = '#07080c'; g.lineWidth = 3;
        g.beginPath(); g.ellipse(cx, cy - R * 0.66, R * 1.36, R * 0.26, 0, 0, 7); g.fill(); g.stroke();  // la tesa
        g.beginPath(); g.moveTo(cx - R * 0.86, cy - R * 0.72);
        g.quadraticCurveTo(cx - R * 0.2, cy - R * 2.4, cx + R * 0.62, cy - R * 2.0);
        g.quadraticCurveTo(cx + R * 0.6, cy - R * 1.0, cx + R * 0.86, cy - R * 0.72);
        g.closePath(); g.fill(); g.stroke();
        g.fillStyle = P.acc; g.beginPath(); g.arc(cx + R * 0.5, cy - R * 1.9, R * 0.14, 0, 7); g.fill();  // la stella
      } else {
        // il LADRO: cappuccio calato e mezza faccia coperta
        g.fillStyle = '#2a3a2e'; g.strokeStyle = '#07080c'; g.lineWidth = 3;   // il fazzoletto sul viso
        this._rrc(g, cx - R * 0.9, cy + R * 0.12, R * 1.8, R * 0.9, R * 0.18); g.fill(); g.stroke();
        occhi(-R * 0.22);
        g.fillStyle = P.veste; g.strokeStyle = '#07080c'; g.lineWidth = 3;     // il cappuccio
        g.beginPath(); g.moveTo(cx - R * 1.12, cy + R * 0.7);
        g.quadraticCurveTo(cx - R * 1.16, cy - R * 1.5, cx, cy - R * 1.42);
        g.quadraticCurveTo(cx + R * 1.16, cy - R * 1.5, cx + R * 1.12, cy + R * 0.7);
        g.quadraticCurveTo(cx + R * 0.72, cy - R * 0.22, cx, cy - R * 0.3);
        g.quadraticCurveTo(cx - R * 0.72, cy - R * 0.22, cx - R * 1.12, cy + R * 0.7);
        g.closePath(); g.fill(); g.stroke();
      }
    },
    // riga: l'indice che comanda il server · testo: quello che c'e' da scrivere · pausa: il silenzio prima
    mostraDialogo(chi, testo, conSuggerimento, eroeId, nome, pausa) {
      const box = $('dial'); if (!box) return;
      $('dialChi').textContent = nome || '';
      this.ritratto(chi, eroeId);
      const h = $('dialHint'); if (h) h.style.display = conSuggerimento === false ? 'none' : '';
      box.classList.remove('hidden');
      // la pausa e' un t0 SPOSTATO IN AVANTI, non un setTimeout: cosi' e' lo stesso orologio che governa
      // le lettere, e lo Spazio che ha fretta la salta senza dover anche spegnere un timer.
      this._dial = { testo: testo || '', i: 0, t0: performance.now() + (pausa ? this.PAUSA : 0), finita: false };
      this._dialDisegna();
      if (!this._dialRaf) this._dialRaf = requestAnimationFrame(() => this._dialTick());
    },
    _dialTick() {
      this._dialRaf = 0;
      const d = this._dial; if (!d) return;
      if (!d.finita) {
        // durante la pausa `quante` e' negativo: si tiene a zero, altrimenti slice(0, -3) taglierebbe
        // dalla FINE e la riga comparirebbe a pezzi al contrario.
        const quante = Math.floor((performance.now() - d.t0) / this.VEL);
        const n = Math.max(0, Math.min(quante, d.testo.length));
        if (n !== d.i) { d.i = n; this._dialDisegna(); }
        if (quante >= d.testo.length) d.finita = true;
      }
      if (!d.finita) this._dialRaf = requestAnimationFrame(() => this._dialTick());
    },
    _dialDisegna() {
      const d = this._dial, e = $('dialTxt'); if (!d || !e) return;
      const visto = d.testo.slice(0, d.i);
      // il testo si scrive dentro textContent, non innerHTML: la storia e' testo e basta, e passarla
      // per innerHTML vorrebbe dire che un domani una riga con una parentesi angolata sparisce.
      e.textContent = visto;
      if (d.i < d.testo.length) { const c = document.createElement('span'); c.className = 'cur'; c.textContent = '\u258c'; e.appendChild(c); }
    },
    // il primo Spazio finisce la riga, il secondo passa oltre. Torna true se ha solo finito la riga.
    dialogoFretta() {
      const d = this._dial; if (!d) return false;
      if (d.finita) return false;
      d.i = d.testo.length; d.finita = true; this._dialDisegna(); return true;
    },
    nascondiDialogo() { const b = $('dial'); if (b) b.classList.add('hidden'); this._dial = null;
      if (this._dialRaf) { cancelAnimationFrame(this._dialRaf); this._dialRaf = 0; } },

    // la MISSIONE. `null` la nasconde: non c'e' uno stato "nessuna missione" da disegnare.
    missione(m) {
      const b = $('quest'); if (!b) return;
      if (!m) { b.classList.add('hidden'); this._quest = null; return; }
      if (this._quest === m.t) { b.classList.remove('hidden'); return; }
      this._quest = m.t;
      // v2.8 — "MISSIONE PRINCIPALE", non "missione": il filo della storia resta acceso per tutta la
      // partita, ma taglie, prigionieri e tutto il resto continuano a funzionare come sempre. La
      // parola serve a dirlo senza spiegarlo.
      $('questT').textContent = m.t; $('questD').textContent = m.d || '';
      b.classList.remove('hidden');
      // si rianima solo quando CAMBIA: una missione che pulsa a ogni fotogramma e' un fastidio
      b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    },
  };
  window.HUD = HUD;
})();
