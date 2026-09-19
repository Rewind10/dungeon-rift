/* main.js — orchestrazione client (boon, hit-stop, modalità) */
(function () {
  'use strict';
  const C = window.GAME.Constants;
  const Net = window.Net, Input = window.Input, R = window.Renderer, HUD = window.HUD, A = window.GameAudio;
  const SV = window.GAME.Salvataggio;   // v2.11 — cosa c'e' dentro una partita salvata
  const $ = (id) => document.getElementById(id);

  // ============================================================================================
  // v2.13.6 — UN PUNTO IN PIU' SOPRA IL FULL HD
  // ============================================================================================
  // Tutte le misure dei caratteri, in style.css, sono scritte `calc(<n>px + var(--fz))`. Qui si
  // decide quanto vale `--fz`, e vale 1px quando il monitor e' piu' largo del full HD.
  //
  // Si guarda `screen.width`, non la larghezza della finestra: e' la RISOLUZIONE, che e' quello che
  // chiedeva Paolo, e su uno schermo 4K con la finestra a meta' il testo e' fisicamente piccolo lo
  // stesso — ed e' li' che il punto in piu' serve.
  //
  // E si guarda in PIXEL CSS, non fisici, ed e' giusto cosi': un portatile 4K al 200% riporta 1920 e
  // il suo testo NON e' piccolo, perche' ci pensa gia' il sistema. Se qui usassimo i pixel fisici
  // ingrandiremmo una cosa che e' gia' grande.
  //
  // Si ricontrolla a ogni `resize` perche' spostare la finestra su un altro monitor cambia
  // `screen.width` senza ricaricare la pagina.
  const FULL_HD = 1920;
  function taraFont() {
    const grande = (window.screen && window.screen.width ? window.screen.width : window.innerWidth) > FULL_HD;
    // si mette su #upgradeScreen, non sulla radice: il punto in piu' vale SOLO nel riepilogo di fine
    // livello, e mettendolo sulla radice si erediterebbe ovunque — bastava che un domani una regola
    // fuori di qui usasse `--fz` per far crescere mezzo gioco senza che nessuno l'avesse chiesto.
    const sc = document.getElementById('upgradeScreen');
    if (sc) sc.style.setProperty('--fz', grande ? '1px' : '0px');
  }
  taraFont();
  window.addEventListener('resize', taraFont);
  const G = { started: false, meHero: 'guerriero', hitstop: 0, world: { players: [], mon: [], bul: [], orbs: [], met: [], crates: [], wdrops: [], xp: [], coins: [], items: [], zones: [], muri: [], trap: [], nebb: [], tele: [], rec: null, chv: null, chIn: 0, fg: null, merch: null, merchD: null, gmerch: null, me: null, bt: 0, wave: 1, phase: 'lobby', mcount: 0, pend: 0, ex: null }, lastInput: 0 };

  // ===== v2.11 — L'ARCHIVIO: il salvataggio vive nel browser =====================================
  // Il server lo costruisce e lo applica, ma non lo TIENE: cosi' non ha cartelle da gestire, file da
  // ripulire, nomi da riconoscere. Il salvataggio segue il browser di chi gioca.
  //
  // TUTTO DENTRO try/catch, e non per pignoleria: `localStorage` SOLLEVA un'eccezione — non torna null —
  // in finestra anonima, con i dati del sito bloccati, e quando lo spazio e' finito. Una riga scoperta
  // qui dentro vuol dire il menu che non si apre, e il giocatore che non capisce perche'.
  const Archivio = {
    leggi() {
      try { const t = localStorage.getItem(SV.CHIAVE); if (!t) return null;
        const d = JSON.parse(t); return SV.valido(d) ? d : null; } catch (_) { return null; }
    },
    scrivi(d) { try { localStorage.setItem(SV.CHIAVE, JSON.stringify(d)); return true; } catch (_) { return false; } },
    // non si cancella mai da soli: morire NON toglie il salvataggio. E' il punto di averlo.
  };
  // quando e' stato salvato, detto come lo direbbe una persona
  function quandoTesto(ms) {
    if (!ms) return '';
    const m = Math.floor((Date.now() - ms) / 60000);
    if (m < 2) return 'adesso';
    if (m < 60) return m + ' minuti fa';
    const h = Math.floor(m / 60); if (h < 24) return h === 1 ? 'un\'ora fa' : h + ' ore fa';
    const g = Math.floor(h / 24); return g === 1 ? 'ieri' : g + ' giorni fa';
  }
  // Il pulsante RIPRENDI c'e' solo se c'e' davvero un salvataggio, e dice a che punto sei: "riprendi"
  // e basta non dice se stai per tornare all'ondata 3 o alla 17, ed e' l'unica cosa che vuoi sapere.
  function aggiornaRiprendi() {
    const b = $('riprendiBtn'); if (!b) return null;
    const d = Archivio.leggi(); const e = d && SV.etichetta(d);
    if (!e) { b.classList.add('hidden'); b.onclick = null; return null; }
    b.classList.remove('hidden');
    b.innerHTML = '\u25B6\uFE0F  RIPRENDI \u2014 ondata <b>' + e.ondata + '</b> \u00b7 ' + e.classe +
      ' Lv.' + e.livello + '<small style="display:block;opacity:.7;font-weight:400">salvata ' + quandoTesto(e.quando) + '</small>';
    return d;
  }
  function initMenu() {
    $('nameInput').value = 'Eroe' + Math.floor(Math.random() * 900 + 100);
    HUD.buildHeroSelect(id => { G.meHero = id; }); G.meHero = HUD.selectedHero;
    $('connectBtn').onclick = () => { G.provaOnda = 0; G.riprendiDati = null; entra($('roomInput').value.trim()); };
    // v2.11 — RIPRENDI. Entra in una stanza tutta sua (come la modalita' di prova: il salvataggio e' di
    // uno solo, e portarlo in una stanza con altri non vorrebbe dire niente) e appena il server risponde
    // gli manda il pacchetto. Il salvataggio NON si cancella caricandolo: si resta dove si era, e se
    // muori di nuovo puoi ripartire di li'.
    const sv = aggiornaRiprendi();
    if (sv) $('riprendiBtn').onclick = () => {
      const d = Archivio.leggi(); if (!d) { aggiornaRiprendi(); return; }
      G.provaOnda = 0; G.riprendiDati = d; G.meHero = d.heroId || G.meHero;
      entra('ripresa-' + Math.floor(Math.random() * 9000 + 1000));
    };
    // v1.91 — MODALITA' DI PROVA: venti pulsanti, uno per ondata. Serve a guardare prestazioni e
    // giocabilita' di un'ondata alta senza rigiocare le quattordici che vengono prima. Si entra in una
    // stanza tutta propria (nome a caso) e la run parte da sola: niente sala d'attesa da attraversare.
    HUD.buildProvaAbil(HUD.selectedHero);
    HUD.buildProva((C.PROVA_MAX_ONDATA || 20), (n) => {
      G.provaOnda = n;
      // v2.17 — le attive scelte viaggiano con la partenza: il server le mette in mano al personaggio
      // anche all'ondata 1, dove il personaggio di prova non viene nemmeno costruito.
      G.provaAbil = (HUD.provaAbil || []).filter(Boolean);
      entra('prova' + n + '-' + Math.floor(Math.random() * 9000 + 1000));
    });
    // v1.99 — la modalita' di prova e' di nuovo VISIBILE nel menu (in v1.96.1 era nascosta). Le due
    // scorciatoie che la aprivano restano, e servono ancora se un giorno la si richiude:
    //   · ?test (o #test) nell'indirizzo  —  http://localhost:8080/?test
    //   · il tasto T mentre si e' fermi nel menu
    const prova = $('provaBox');
    const mostraProva = () => { if (prova) { prova.classList.remove('hidden'); prova.open = true; } };
    if (/[?&#]test\b/.test(location.search + location.hash)) mostraProva();
    window.addEventListener('keydown', (e) => {
      if (e.key !== 't' && e.key !== 'T') return;
      if ($('menu').classList.contains('hidden')) return;    // solo nel menu: in partita la T non fa niente
      const a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return;   // stai scrivendo il nome
      mostraProva();
    });
  }
  function entra(room) {
    A.resume();
    const name = $('nameInput').value.trim() || 'Eroe';
    // v2.11.3 — RIPRENDENDO comanda il SALVATAGGIO, non la casella selezionata nel menu. Qui c'era
    // `G.meHero = HUD.selectedHero` secco, e cancellava la classe appena letta dal salvataggio: entravi
    // come guerriero, il server ti rifaceva ladro, e il client restava convinto di essere un guerriero —
    // barra delle abilita' e ritratto nei dialoghi compresi.
    G.meHero = (G.riprendiDati && G.riprendiDati.heroId) || HUD.selectedHero;
    $('menuMsg').textContent = G.provaOnda ? ('Prova dall\u2019ondata ' + G.provaOnda + '\u2026') : 'Connessione\u2026';
    Net.connect(name, G.meHero, room);
  }

  Net.onWelcome = (m) => {
    $('menu').classList.add('hidden'); R.setMap(m.map);
    // in prova non si passa dalla sala d'attesa: si e' soli e la run parte subito dall'ondata scelta
    if (G.riprendiDati && m.phase === C.PHASE_LOBBY) { Net.riprendi(G.riprendiDati); G.riprendiDati = null; return; }
    if (G.provaOnda && m.phase === C.PHASE_LOBBY) { Net.start(G.provaOnda, G.provaAbil || []); return; }
    if (m.phase === C.PHASE_LOBBY) showLobby(m.players); else enterGame();
  };
  Net.onMap = (m) => { R.setMap(m.map); HUD.zoneName(m.map && m.map.theme); };   // v1.62 — nome della zona in HUD
  Net.onFull = () => { $('menuMsg').textContent = 'Stanza piena, riprova.'; };
  Net.onClose = () => { $('menuMsg').textContent = 'Connessione persa.'; };
  let lobbyPlayers = [];
  function showLobby(players) { A.scene('lobby'); lobbyPlayers = players || lobbyPlayers; HUD.lobby(Net.room, lobbyPlayers, Net.id, () => Net.start(), () => { HUD.hideLobby(); $('menu').classList.remove('hidden'); $('connectBtn').textContent = 'Aggiorna eroe'; $('connectBtn').onclick = () => { G.meHero = HUD.selectedHero; Net.setHero(G.meHero); $('menu').classList.add('hidden'); showLobby(lobbyPlayers); }; }); }
  function enterGame() { if (G.started) return; G.started = true; HUD.hideLobby(); $('hud').classList.remove('hidden'); HUD.buildAbilityBar(G.meHero); A.scene('wave'); }

  Net.onOfferShop = (m) => { HUD.setStats(m, (id) => Net.buyStat(id), () => Net.shopReady(), (id) => Net.equipaggia(id)); };
  // v1.79 — LA BARRA DEL MENU DI FINE ONDATA. Le tre sezioni si sfogliano senza mandare niente al
  // server; il villaggio e la mappa successiva sono le uniche due che gli parlano.
  // v2.13.5 — le linguette non ci sono piu': la schermata mostra tutto insieme. Restano i due pulsanti
  // in fondo, che sono le due cose che portano via da qui — e stare vicine e' quello che sono.
  $('villaggioBtn').onclick = () => { if ($('villaggioBtn').disabled) return; Net.goVillage(); };
  $('nextWaveBtn').onclick = () => { if ($('nextWaveBtn').disabled) return; Net.shopReady(); HUD.prontoPerOndata(); };
  Net.onOfferBoon = (m) => { HUD.setBoons(m, (id) => Net.pickBoon(id)); };
  Net.onWaveStats = (m) => { HUD.setWaveStats(m); };   // v1.78 — riepilogo di fine livello
  // v1.84 — il pulsante EXIT non c'e' piu': si esce attraversando la faglia che si apre sulla mappa.
  Net.onOfferRank = (m) => { HUD.setRank(m, (id) => Net.pickRank(id)); };
  // v1.52 — l'offerta arriva sia dal pannello di fine ondata (se riabilitato) sia dal mercante del MERCATO:
  // 'near' distingue i due casi.
  Net.onOfferGear = (m) => {
    G.gearData = m;
    if (m.near) HUD.showGear(m, (id) => Net.buyGear(id), (id) => Net.vendiGear(id));
    else if (C.SHOP_GEAR_ENABLED) HUD.setGear(m, (id) => Net.buyGear(id));
  };
  // v1.71 — il banco dell'Erborista: stesso schema del fabbro, 'near' distingue l'aggiornamento
  // silenzioso (mentre sei lontano) dall'apertura vera.
  Net.onOfferPotion = (m) => { G.potData = m; if (m.near) HUD.showPotions(m, potCb); };
  // v1.72 — il banco del Banditore: taglie sopra, magazzino sotto.
  Net.onOfferBandit = (m) => { G.bndData = m; if (m.near) HUD.showBandit(m, bndCb); };
  // v1.73 — il tavolo della Cartomante: quali carte tieni accese.
  Net.onOfferSeer = (m) => { G.seerData = m; if (m.near) HUD.showSeer(m, (id) => Net.toggleCard(id)); };
  // v1.74 — il focolare dell'Ostessa: rimetterti in piedi a pagamento.
  Net.onOfferInn = (m) => { G.innData = m; if (m.near) HUD.showInn(m, () => Net.rest(), () => Net.salva()); };
  // v2.11 — il pacchetto arriva dal server e si mette in tasca QUI, nel browser. Se `localStorage` non
  // ne vuole sapere (finestra anonima, spazio finito) si dice, invece di far finta di aver salvato: un
  // salvataggio che il giocatore crede di avere e non ha e' peggio di nessun salvataggio.
  Net.onSalvato = (m) => {
    const ok = Archivio.scrivi(m.dati);
    aggiornaRiprendi();
    if (ok) HUD.killfeed('\uD83D\uDCBE <b style="color:#9fe06a">Partita salvata</b> \u2014 ondata <b>' + (m.eti && m.eti.ondata) + '</b>, la riprendi dal menu');
    else HUD.modeBanner('\uD83D\uDCBE NON SI PUO SALVARE', '#ff7a5a', 'Il browser non permette di conservare dati: finestra anonima, o spazio finito');
  };
  Net.onBoons = (m) => { HUD.setActiveBoons(m.boons || []); };  // v1.51 — barra dei poteri attivi
  G.merchWares = null; G.darkWares = null;
  Net.onOfferMerchant = (m) => { if (m.dark) { G.darkWares = m.wares || G.darkWares; if (m.near) HUD.showMerchant(G.darkWares, (id) => Net.buyMerchant(id, 1), m.coins, true); else if (m.coins != null) HUD.updateMerchantCoins(m.coins, true); } else { G.merchWares = m.wares || G.merchWares; if (m.near) HUD.showMerchant(G.merchWares, (id) => Net.buyMerchant(id), m.coins, false); else if (m.coins != null) HUD.updateMerchantCoins(m.coins, false); } };
  const potCb = { pick: (slot, id) => Net.pickPotion(slot, id), buy: (slot) => Net.buyPotion(slot) };
  const bndCb = { take: (i) => Net.takeBounty(i), hire: () => Net.hireMerc() };
  Net.onChat = (m) => { const log = $('chatLog'); const el = document.createElement('div'); el.className = 'cm'; el.innerHTML = `<b>${esc(m.from)}:</b> ${esc(m.text)}`; log.appendChild(el); setTimeout(() => el.remove(), 8000); while (log.children.length > 6) log.removeChild(log.firstChild); };
  Net.onSnapshot = (snap) => { if (!G.started && snap.phase !== C.PHASE_LOBBY) enterGame(); A.setBoss(snap.phase === C.PHASE_BOSS);
    // v1.90 — la musica segue la SCHERMATA: il brano nelle ondate, il sintetizzatore al mercato e nel
    // riepilogo di fine ondata. La regola sta in A.scene(), qui si dice solo dove siamo.
    A.scene(snap.phase === C.PHASE_MARKET ? 'village' : snap.phase === C.PHASE_SHOP ? 'shop' : 'wave'); if (snap.phase !== C.PHASE_SHOP) HUD.hideShop(); if (snap.ev && snap.ev.length) for (const ev of snap.ev) onEv(ev);
    // v2.7 — LA STORIA ARRIVA DALLO SNAPSHOT, non solo dagli eventi. Un evento si perde: se arriva
    // mentre la scheda e' in secondo piano, o se uno entra a meta' scena, la riga non si vede piu' e
    // resta il silenzio. Lo snapshot invece dice a ogni giro QUALE riga e' in corso, e il client si
    // limita a rincorrerla — se e' gia' quella giusta non fa niente.
    G.capo = !snap.cp || snap.cp === Net.id; storiaDaSnap(snap.st); HUD.missione(snap.ms ? STORIA.missioni[snap.ms] : null); };
  Net.onEvent = (ev) => onEv(ev);

  // ===== v2.7 — LA STORIA =====================================================================
  // Il server dice scena e riga; qui si scrive. `_st` ricorda cosa si sta gia' mostrando, cosi' lo
  // snapshot (venti volte al secondo) non fa ripartire la stessa riga da capo venti volte al secondo.
  const STORIA = (window.GAME && window.GAME.Storia) || { missioni: {} };
  G._st = null;
  function storiaDaSnap(st) {
    if (!st) { if (G._st) { G._st = null; HUD.nascondiDialogo(); } return; }
    const k = st.s + '|' + st.r;
    if (G._st === k) return;
    G._st = k;
    const sc = STORIA[st.s]; if (!sc || !sc.righe[st.r]) { HUD.nascondiDialogo(); return; }
    // il suggerimento dei tasti si mostra solo a chi puo' davvero premerli: in due o piu' il dialogo lo
    // fa scorrere chi ha aperto la stanza, e dire agli altri "premi Spazio" sarebbe una bugia.
    riga(sc.righe[st.r], G.capo !== false);
  }
  // v2.8 — una riga e' `{ chi, t }`. `chi` decide RITRATTO e nome: 'tu' e' l'avatar (quindi la classe di
  // chi sta leggendo — in tre a schermo ognuno vede il suo), 'oracolo' e' lui, '' e' la voce senza volto
  // del risveglio. E `{eroe}` dentro il testo diventa il nome della classe: e' quando l’oracolo nomina
  // "quel guerriero" che la rivelazione smette di essere astratta.
  function riga(r, conTasti) {
    const H = (window.GAME.Heroes && window.GAME.Heroes.HEROES) || {};
    const mio = G.meHero || 'guerriero';
    const nomeEroe = (H[mio] && H[mio].name) ? H[mio].name.charAt(0) + H[mio].name.slice(1).toLowerCase() : 'eroe';
    const testo = String(r.t || '').replace(/\{eroe\}/g, nomeEroe);
    const NOMI = { oracolo: 'Oracolo', guardia: 'Guardia' };
    const nome = r.chi === 'tu' ? nomeEroe : (NOMI[r.chi] || '');
    // v2.9 — `p` e' la PAUSA del copione: la riga aspetta un attimo in silenzio prima di scriversi.
    HUD.mostraDialogo(r.chi, testo, conTasti, mio, nome, !!r.p);
  }

  function onEv(ev) {
    switch (ev.t) {
      // v2.7 — una riga sola, senza scena attorno: il sollecito della voce nella stanza e la riga
      // dell'ultima discesa. Non ha un indice sul server perche' non ha un dopo.
      case 'storia_riga_sola': riga({ chi: ev.chi, t: ev.testo }, false);
        clearTimeout(G._rigaT); G._rigaT = setTimeout(() => { if (!G._st) HUD.nascondiDialogo(); }, 5200); break;
      case 'storia_fine': G._st = null; HUD.nascondiDialogo(); break;
      case 'missione': HUD.missione(STORIA.missioni[ev.id] || null); break;
      case 'prologo': HUD.zoneName({ name: 'Non hai idea di dove sei', accent: '#9a5cff' }); break;
      // v1.69 — la progressione deve VEDERSI mentre giochi, non solo nel pannello di fine ondata.
      case 'levelup': R.ring(ev.x, ev.y, '#ffd27a', 6, 80, 0.55); R.burst(ev.x, ev.y, '#ffe9a8', 22, 200, 0.7);
        R.levelUp(ev.who, ev.lv);                       // la scritta sopra la testa vale per tutti, anche per i compagni
        if (ev.who === Net.id) { A.levelUp && A.levelUp(); R.addShake(2); }
        break;
      case 'rankup': R.ring(ev.x, ev.y, '#ffd27a', 9, 130, 0.8); R.burst(ev.x, ev.y, '#ffd27a', 30, 260, 0.9); R.addShake(5);
        HUD.killfeed('★ <b style="color:#ffd27a">' + esc(ev.name || '') + '</b> è ora <b>' + esc(ev.title || '') + '</b>');
        if (ev.who === Net.id) HUD.modeBanner('★ ' + (ev.title || '').toUpperCase(), '#ffd27a', 'Scegli la tua carta di rango a fine ondata');
        break;
      case 'spec': R.ring(ev.x, ev.y, ev.color || '#ffd27a', 10, 180, 1); R.burst(ev.x, ev.y, ev.color || '#ffd27a', 40, 320, 1); R.addShake(8);
        HUD.killfeed((ev.icon || '★') + ' <b style="color:' + (ev.color || '#ffd27a') + '">' + esc(ev.name || '') + '</b> ha scelto: <b>' + esc(ev.title || '') + '</b>');
        break;
      case 'card': R.floater(ev.x, ev.y - 22, (ev.icon || '★') + ' ' + ev.name, '#ffd27a', true); break;
      case 'xpfonte': if (ev.who === Net.id) R.floater(ev.x, ev.y - 30, '+' + ev.v + ' XP', '#8bd6ff'); break;
      case 'dodge': R.floater(ev.x, ev.y - 18, 'schivata', '#9ef0b0'); R.burst(ev.x, ev.y, '#9ef0b0', 6, 120, 0.3); break;
      case 'manahit': R.ring(ev.x, ev.y, '#7dffea', 4, 34, 0.25); break;
      case 'manafull': R.ring(ev.x, ev.y, '#7dffea', 3, 42, 0.4); break;
      case 'blink': R.burst(ev.x, ev.y, '#b061ff', 14, 200, 0.4); R.burst(ev.x2, ev.y2, '#b061ff', 14, 200, 0.4); R.ring(ev.x2, ev.y2, '#b061ff', 5, 40, 0.35); break;
      case 'runa': R.burst(ev.x + Math.cos(ev.a) * 16, ev.y + Math.sin(ev.a) * 16, '#c48cff', 3, 80, 0.2); break;
      case 'shot': A.shoot(ev.hero, ev.wt); R.heroAtk(ev.who); R.burst(ev.x + Math.cos(ev.a) * 14, ev.y + Math.sin(ev.a) * 14, ev.hero === 'mago' ? '#7ffbe4' : '#ffe', 2, 60, 0.15); break;
      // v1.66 — FENDENTE del guerriero: l'arco disegnato e' esattamente l'area che ha ferito.
      case 'swing': R.heroAtk(ev.who); R.swing(ev.x, ev.y, ev.a, ev.rad, ev.half, ev.crit); A.shoot('guerriero', null); if (ev.hits > 1) R.addShake(2); break;
      case 'turret_fire': R.burst(ev.x + Math.cos(ev.a) * 14, ev.y + Math.sin(ev.a) * 14, '#9fe0ff', 2, 80, 0.12); break;
      case 'mhit': A.hitMonster(); R.floater(ev.x, ev.y - 10, '' + ev.d, ev.crit ? '#fff36b' : '#ffd9d9', ev.crit); R.burst(ev.x, ev.y, '#ffb0b0', ev.crit ? 6 : 3, ev.crit ? 130 : 90, 0.25); break;
      case 'hitstop': G.hitstop = Math.max(G.hitstop, ev.d || 0.05); break;
      case 'chain': R.chain(ev.x1, ev.y1, ev.x2, ev.y2); break;
      case 'phit': A.playerHit(); R.floater(ev.x, ev.y - 14, '-' + ev.d, '#ff6b6b'); R.addShake(3); break;
      case 'cursed': if (ev.who === Net.id) { R.floater(ev.x, ev.y - 22, '\uD83D\uDC80 MALEDETTO!', '#b98bff', true); R.addShake(4); HUD.modeBanner('\uD83D\uDC80 SEI STATO MALEDETTO', '#9c6bff', 'Danno e velocit\u00e0 ridotti per ' + (ev.dur || 4) + 's'); } R.burst(ev.x, ev.y, '#9c6bff', 14, 150, 0.5); R.ring(ev.x, ev.y, '#9c6bff', 6, 44, 0.4); break;
      case 'gazed': { const gi = { weaken: ['\uD83D\uDC41 SGUARDO DEBILITANTE', '#ff7a5a', 'Attacco indebolito'], slow: ['\uD83D\uDC41 SGUARDO GELIDO', '#5ad0ff', 'Velocit\u00e0 ridotta'], sunder: ['\uD83D\uDC41 SGUARDO CORROSIVO', '#c48cff', 'Difesa ridotta'] }[ev.kind] || ['\uD83D\uDC41 SGUARDO', '#c48cff', 'Debuff']; if (ev.who === Net.id) { R.floater(ev.x, ev.y - 22, gi[0], gi[1], true); R.addShake(3); HUD.modeBanner(gi[0], gi[1], gi[2] + ' finch\u00e9 sei nel campo visivo'); } R.ring(ev.x, ev.y, gi[1], 5, 40, 0.4); break; }
      case 'mkill': R.spawnDeath(ev); A.kill(ev.boss); R.burst(ev.x, ev.y, ev.boss ? '#ff7a3b' : (ev.elite ? '#ffb020' : '#9fd6a0'), ev.boss ? 40 : 12, ev.boss ? 260 : 140, ev.boss ? 0.9 : 0.5); R.ring(ev.x, ev.y, ev.boss ? '#ff7a3b' : '#fff', 6, ev.boss ? 130 : 40, 0.4); if (ev.boss) { R.addShake(ev.mega ? 22 : 14); HUD.killfeed('💀 <b style="color:#ff7a3b">' + (ev.mega ? 'MEGA BOSS' : 'BOSS') + ' ABBATTUTO!</b>'); } break;
      case 'explosion': A.explosion(); R.ring(ev.x, ev.y, '#ff9a3b', 8, ev.r, 0.35); R.burst(ev.x, ev.y, '#ff7a2b', 20, 220, 0.5); R.fire(ev.x, ev.y, 18, 90); R.addShake(6); break;
      case 'slam_wind': if (ev.e != null) R.hitAttack(ev.e, ev.dur || 0.72); R.ring(ev.x, ev.y, '#ffb020', 3, (ev.r || 60) * 0.4, 0.5); break; // v1.43 — il Bruto ALZA le braccia (telegrafo dello slam)
      case 'slam': if (ev.e != null) R.hitAttack(ev.e, 0.6); // v1.44 — SCHIANTO più IMPATTANTE: doppia onda + polvere + crepe + hit-stop + scossone forte
        R.ring(ev.x, ev.y, '#fff2c8', 9, (ev.r || 96) * 0.55, 0.22); R.ring(ev.x, ev.y, '#ffb020', 7, ev.r, 0.4); R.ring(ev.x, ev.y, '#8a5a2b', 4, (ev.r || 96) * 1.15, 0.5);
        R.burst(ev.x, ev.y, '#ffcf5a', 28, 300, 0.5); R.burst(ev.x, ev.y + 6, '#7a5a3a', 20, 160, 0.65);
        R.addShake(13); G.hitstop = Math.max(G.hitstop, 0.05); break;
      // v2.17 — la vampata quando un mostro striscia contro il muro di fuoco
      case 'muro_urto': R.burst(ev.x, ev.y, ev.c || '#ff9a3b', 5, 130, 0.3); break;
      // v2.17 — il tempo rubato: anello che parte dal ladro, scossone corto e la fascia che dice cosa sta succedendo
      case 'tempo_rubato': R.ring(ev.x, ev.y, ev.c || '#8fd8ff', 7, 220, 0.6); R.burst(ev.x, ev.y, ev.c || '#8fd8ff', 18, 240, 0.55); R.addShake(4);
        if (ev.who === Net.id) HUD.modeBanner('\u23f3 TEMPO RUBATO', '#8fd8ff', 'Il mondo va al 35% per ' + (ev.dur || 4) + 's');
        A.ability && A.ability('rift'); break;
      case 'zone_tell': A.ability && A.ability('rift'); R.ring(ev.x, ev.y, ev.c || '#ff3b3b', 4, ev.r, 0.35); break;
      // v1.84 — i prigionieri: la chiave e chi la libera
      case 'crate_monete': A.crate && A.crate(); R.floater(ev.x, ev.y - 20, '+' + ev.v + ' \uD83E\uDE99', '#ffcf4a', true); break;
      case 'chiave_elite': R.ring(ev.x, ev.y, '#ffd24a', 5, 60, 0.6); break;
      case 'chiave_cade': R.ring(ev.x, ev.y, '#ffd24a', 6, 54, 0.5); R.burst(ev.x, ev.y, '#ffe08a', 16, 150, 0.6); break;
      case 'chiave_presa': A.item && A.item(true); R.ring(ev.x, ev.y, '#ffd24a', 6, 46, 0.45); R.floater(ev.x, ev.y - 26, '\uD83D\uDD11 CHIAVE', '#ffd24a', true); break;
      case 'liberati': A.levelUp && A.levelUp(); R.ring(ev.x, ev.y, '#9ef0b0', 8, 150, 0.7); R.burst(ev.x, ev.y, '#d8ffe4', 30, 220, 0.9);
        R.floater(ev.x, ev.y - 40, '+' + ev.monete + ' \uD83E\uDE99', '#ffcf4a', true); R.addShake(4); break;
      // v1.83 — colpo parato con lo scudo: l'arco si accende dalla parte in cui guardi
      case 'para': R.para(ev.x, ev.y, ev.a, (window.GAME.Constants.SCUDO_CONO || 1.22)); break;
      // ===== v1.89 — IL COLOSSO DELLA FAGLIA =====
      case 'colosso_wind': R.ring(ev.tx, ev.ty, '#b061ff', 6, ev.r || 132, ev.dur || 0.7); R.hitAttack(ev.e, (ev.dur || 0.7) + 0.2); break;
      case 'colosso_pugno': A.explosion && A.explosion(); R.ring(ev.x, ev.y, '#b061ff', 10, ev.r || 132, 0.4); R.burst(ev.x, ev.y, '#c9a8ff', 26, 260, 0.55); R.addShake(9); break;
      case 'colosso_onda': A.ability && A.ability('rift'); for (let k = 0; k < 3; k++) R.ring(ev.x, ev.y, '#b061ff', 20 + k * 40, 120 + k * 90, 0.7 + k * 0.2); R.addShake(4); break;
      case 'colosso_braccio': A.kill && A.kill(false); R.burst(ev.x, ev.y, '#8d97a5', 34, 300, 0.9); R.ring(ev.x, ev.y, '#b061ff', 8, 140, 0.6); R.addShake(7);
        HUD.killfeed('\uD83D\uDDFF <b style="color:#b061ff">Il Colosso perde un braccio</b> \u2014 ora lancia le macerie'); break;
      case 'colosso_nucleo': A.levelUp && A.levelUp(); R.ring(ev.x, ev.y, '#e0ccff', 10, 200, 0.9); R.burst(ev.x, ev.y, '#ffffff', 40, 330, 1); R.addShake(12);
        HUD.killfeed('\uD83D\uDCA0 <b style="color:#e0ccff">Il nucleo e scoperto</b> \u2014 incassa il 50% in piu'); break;
      case 'colosso_macerie': R.burst(ev.x + Math.cos(ev.a) * 30, ev.y + Math.sin(ev.a) * 30, '#8d97a5', 10, 150, 0.4); break;
      // ===== v1.85 — le abilita' attive =====
      case 'abil': { const AB = (window.GAME.Abilities || {}).BY_ID || {}; const a = AB[ev.k] || {};
        A.ability && A.ability(ev.k); R.ring(ev.x, ev.y, ev.c || a.color || '#ffd27a', 8, 70, 0.35);
        if (ev.who === Net.id) R.floater(ev.x, ev.y - 34, (a.icon || '⚡') + ' ' + (a.name || ''), ev.c || '#ffd27a', true); break; }
      case 'abil_presa': HUD.killfeed('⚡ <b style="color:' + (ev.c || '#ffd27a') + '">' + ev.icon + ' ' + ev.name + '</b> — tasto <b>' + ev.tasto + '</b>, ricarica ' + ev.cd + 's'); break;
      case 'sfonda': R.hitAttack(ev.e, 0.3); R.burst(ev.x, ev.y, '#ffd9a0', 10, 190, 0.35); R.floater(ev.x, ev.y - 16, 'stordito', '#ffd27a'); break;
      case 'grido': A.ability && A.ability('grido'); R.grido(ev.x, ev.y, ev.r); R.addShake(4);
        if (ev.who === Net.id && ev.n) R.floater(ev.x, ev.y - 46, ev.n + ' addosso a te', '#ffb45a', true); break;
      case 'giuramento': R.ring(ev.x, ev.y, '#ffe9a8', 10, ev.r, 0.6); R.burst(ev.x, ev.y, '#ffe9a8', 26, 210, 0.7); break;
      case 'giur_para': R.para(ev.x, ev.y, 0, 3.14); R.ring(ev.x, ev.y, '#ffe9a8', 4, 40, 0.35); R.floater(ev.x, ev.y - 20, '✨ giuramento', '#ffe9a8'); break;
      case 'scudo_hit': R.ring(ev.x, ev.y, '#7dffea', 4, 34, 0.25); break;
      case 'scudo_rotto': A.explosion && A.explosion(); R.ring(ev.x, ev.y, '#7dffea', 8, ev.r, 0.45); R.burst(ev.x, ev.y, '#bffff4', 26, 260, 0.6); R.addShake(4); break;
      case 'meteora_tell': A.ability && A.ability('rift'); R.ring(ev.x, ev.y, '#ff7a3b', 5, ev.r + 20, 0.5); break;
      case 'tagliola': A.hitMonster && A.hitMonster(); R.ring(ev.x, ev.y, '#cfd8dc', 3, 40, 0.35); R.burst(ev.x, ev.y, '#e8eef2', 12, 130, 0.4); R.floater(ev.x, ev.y - 16, 'bloccato', '#cfd8dc'); break;
      case 'marchio': R.ring(ev.x, ev.y, '#ff5a7a', 6, 46, 0.4); R.floater(ev.x, ev.y - 24, '🎯', '#ff5a7a', true); break;
      case 'marchio_ok': if (ev.who === Net.id) R.floater(ev.x, ev.y - 26, 'marchio · mezza ricarica', '#ff5a7a'); break;
      // v1.81 — il ragno tesse: un anello che si apre e qualche filo che schizza
      case 'tela': R.ring(ev.x, ev.y, ev.c || '#cfe0ea', 3, ev.r, 0.45); R.burst(ev.x, ev.y, '#e6f1f8', 10, 90, 0.5); break;
      // v1.81 — LA LARVA SCOPPIA: il corpo si apre in uno sbuffo di spore, poi la zona telegrafata (che
      // arriva con lo stesso evento zone_tell di tutti) fa il conto alla rovescia sul pavimento.
      case 'larva_pop': R.burst(ev.x, ev.y, ev.c || '#e8ff6a', 18, 150, 0.55); R.ring(ev.x, ev.y, ev.c || '#e8ff6a', 5, 26, 0.3); break;
      // v1.81 — LO SPETTRO SI SFASA. Tre eventi, uno per momento: si annuncia (anello che si stringe
      // addosso a lui), sparisce, riappare. Senza questi tre e' un teletrasporto muto — cioe' il difetto
      // che abbiamo tolto nella v1.76.1.
      case 'blink_wind': if (ev.e != null) R.hitAttack(ev.e, ev.dur || 0.38); R.ring(ev.x, ev.y, ev.c || '#9fe8ff', 3, 30, ev.dur || 0.38); R.burst(ev.x, ev.y, ev.c || '#9fe8ff', 8, 60, 0.4); break;
      case 'blink_out': R.ring(ev.x, ev.y, ev.c || '#9fe8ff', 6, 46, 0.28); R.burst(ev.x, ev.y, ev.c || '#9fe8ff', 16, 190, 0.45); break;
      case 'blink_in': R.ring(ev.x, ev.y, ev.c || '#9fe8ff', 7, 54, 0.32); R.burst(ev.x, ev.y, ev.c || '#9fe8ff', 20, 210, 0.5); R.addShake(3); break;
      case 'zone_hit': A.explosion(); R.ring(ev.x, ev.y, ev.c || '#ff3b3b', 8, ev.r, 0.4); R.burst(ev.x, ev.y, ev.c || '#ff5a5a', 22, 230, 0.5); R.addShake(6); break;
      case 'lunge': R.hitAttack(ev.e, 0.3); R.burst(ev.x, ev.y, '#ffd9a0', 6, 130, 0.25); break;
      case 'melee': R.hitAttack(ev.e, 0.32); break; // v1.26 — swing d'attacco
      case 'cast': R.hitAttack(ev.e, 0.5); break; // v1.26 — negromante evoca (orbe divampa)
      case 'acid': if (ev.e != null) R.hitAttack(ev.e, 0.55); R.burst(ev.x, ev.y - 6, '#a6ff3a', 14, 150, 0.5); R.ring(ev.x, ev.y, '#a6ff3a', 4, 26, 0.3); break; // v1.45 — la Melma salta e sputa acido
      // v2.0 — non e' piu' un "mercato" con un portale EXIT in fondo: e' un VILLAGGIO, e la faglia sta
      // nel mezzo della piazza. Il testo lo dice, se no si continua a cercare una porta sul bordo.
      case 'market': HUD.modeBanner('\uD83C\uDFD8\uFE0F VILLAGGIO', '#ffcf4a', 'Nessun nemico \u00b7 le botteghe sono aperte, la faglia \u00e8 nella casa a ponente, fra le due guardie'); HUD.killfeed('\uD83C\uDFD8\uFE0F <b style="color:#ffcf4a">VILLAGGIO</b> \u2014 la <b>faglia</b> nella casa delle guardie porta all\'ondata ' + ev.next); break;
      case 'market_exit': HUD.killfeed('\uD83C\uDF00 <b>' + esc(ev.name || 'Qualcuno') + '</b> ha attraversato la faglia'); break;
      case 'gear_leave': G._gearOpen = false; HUD.hideGear(); break;
      case 'herb_leave': G._herbOpen = false; HUD.hidePotions(); break;
      case 'bnd_leave': G._bndOpen = false; HUD.hideBandit(); break;
      case 'seer_leave': G._seerOpen = false; HUD.hideSeer(); break;
      case 'inn_leave': G._innOpen = false; HUD.hideInn(); break;
      // v2.11 — il salvataggio: l'effetto sul posto (lo vedono anche i compagni) e il perche' del no.
      case 'salvato': R.ring(ev.x, ev.y, '#9fe06a', 5, 70, 0.6); R.burst(ev.x, ev.y - 8, '#9fe06a', 20, 170, 0.7);
        if (ev.who === Net.id) A.item && A.item(true); break;
      case 'salva_no': HUD.modeBanner('\uD83D\uDCBE NON SI PUO SALVARE', '#ff7a5a',
        ev.perche === 'coop' ? 'Il salvataggio e per le partite in singolo' :
        ev.perche === 'monete' ? 'Servono ' + (C.SALVA_COSTO || 10) + ' monete' : 'Qualcosa non ha funzionato'); break;
      case 'ripreso': HUD.modeBanner('\uD83D\uDCBE PARTITA RIPRESA', '#9fe06a',
        'Ondata ' + ev.ondata + ' \u00b7 livello ' + ev.livello + ' \u2014 sei al villaggio, la faglia ti porta gi\u00f9'); break;
      case 'riprendi_no': HUD.modeBanner('\uD83D\uDCBE SALVATAGGIO NON VALIDO', '#ff7a5a',
        'E di una versione diversa del gioco, o e rovinato'); break;
      case 'rest': R.ring(ev.x, ev.y, '#ffd97a', 5, 62, 0.5); R.burst(ev.x, ev.y - 8, '#ffd97a', 18, 150, 0.6);
        if (ev.who === Net.id) { A.item && A.item(true); R.floater(ev.x, ev.y - 34, '+' + ev.hp + ' PV', '#ff5a7a');
          HUD.killfeed('\uD83C\uDF7A ' + (ev.pieno ? 'rimesso a nuovo' : 'un po\' di riposo') + ' \u2014 <b style="color:#ff5a7a">+' + ev.hp + ' PV</b> per <b style="color:#ffcf4a">' + ev.spesa + '</b> \uD83E\uDE99'); }
        break;
      case 'card_toggle': A.ability && A.ability('barrier'); HUD.killfeed((ev.icon || '\uD83C\uDCCF') + ' <b>' + esc(ev.name) + '</b> ' + (ev.on ? '<b style="color:#9fe06a">accesa</b>' : '<b style="color:#8b93a7">spenta</b>')); break;
      case 'bounty_take': HUD.killfeed('\uD83E\uDEA7 taglia accettata \u2014 <b style="color:' + (ev.color || '#ff9a8a') + '">' + esc(ev.nome) + '</b>: ' + esc(ev.testo)); break;
      // la consegna e' il momento che ripaga tutte le ondate passate a contare: si vede e si sente
      case 'bounty_done': A.item && A.item(true); R.ring(ev.x, ev.y, ev.color || '#ffcf4a', 6, 90, 0.6); R.burst(ev.x, ev.y, '#ffcf4a', 24, 210, 0.75);
        if (ev.who === Net.id) R.floater(ev.x, ev.y - 32, '+' + ev.pay + ' \uD83E\uDE99', '#ffcf4a');
        HUD.killfeed((ev.icon || '\uD83E\uDEA7') + ' <b>' + esc(ev.name || '') + '</b> ha chiuso la taglia <b style="color:' + (ev.color || '#ffcf4a') + '">' + esc(ev.nome) + '</b> \u2014 <b style="color:#ffcf4a">' + ev.pay + '</b> \uD83E\uDE99');
        break;
      case 'gear_sold': A.item && A.item(false); HUD.killfeed('\uD83E\uDEA7 venduto <b style="color:' + (ev.color || '#c9d2e6') + '">' + esc(ev.name) + '</b> \u2014 <b style="color:#ffcf4a">' + ev.pay + '</b> \uD83E\uDE99'); break;
      // v1.71 — bevuta: fiala che si svuota, alone del colore della pozione e il gorgoglio. La cura
      // dice anche quanti PV ha reso, perche' quel numero dipende dalla Costituzione e va visto.
      case 'potion': R.ring(ev.x, ev.y, ev.color || '#9fe06a', 5, 54, 0.42); R.burst(ev.x, ev.y - 8, ev.color || '#9fe06a', 14, 130, 0.5);
        if (ev.who === Net.id) { A.drink && A.drink(); R.floater(ev.x, ev.y - 34, ev.heal ? ('+' + ev.heal + ' PV') : ev.name, ev.color || '#9fe06a'); }
        break;
      case 'potion_buy': A.item && A.item(false); break;
      case 'potion_set': if (ev.back) HUD.killfeed('\uD83C\uDF3F rimborsate <b style="color:#ffcf4a">' + ev.back + '</b> \uD83E\uDE99 delle cariche rimaste'); break;
      case 'spore': if (ev.e != null) R.hitAttack(ev.e, 0.9); R.ring(ev.x, ev.y - 6, ev.c || '#a6ff3a', 4, 34, 0.45); R.burst(ev.x, ev.y - 8, ev.c || '#a6ff3a', 12, 120, 0.6); break;  // v1.58 — il fungo sbuffa
      case 'roll_wind': if (ev.e != null) R.hitAttack(ev.e, ev.dur || 0.62); R.ring(ev.x, ev.y, '#ff7a3b', 3, 26, 0.35); break;  // v1.58 — la sfera si carica
      case 'roll_go': A.kill && A.kill(false); R.burst(ev.x, ev.y, '#cfc7b0', 10, 150, 0.35); break;
      case 'rift_edge': if (ev.who === Net.id) { HUD.modeBanner('\u26A0 LA FAGLIA TI STA CONSUMANDO', '#b25cff', 'Sei troppo vicino al bordo \u00b7 torna verso il centro'); R.addShake(4); R.ring(ev.x, ev.y, '#b25cff', 6, 70, 0.5); } break;  // v1.63
      case 'drain': if (ev.e != null) R.hitAttack(ev.e, 0.5); R.drain(ev.tx, ev.ty, ev.x, ev.y, ev.c || '#7dffea'); break;  // v1.61 — il fuoco fatuo succhia vita: scia di scintille dal giocatore verso il fatuo
      case 'roll_hit': R.addShake(4); R.burst(ev.x, ev.y, '#cfc7b0', 8, 130, 0.3); R.ring(ev.x, ev.y, '#8a8270', 4, 30, 0.25); break;  // rimbalzo sul muro
      case 'split': R.ring(ev.x, ev.y, ev.c || '#a6ff3a', 5, 40, 0.4); R.burst(ev.x, ev.y, ev.c || '#a6ff3a', 16, 160, 0.5); break;  // v1.58 — la melma si divide
      case 'merchant_leave': if (ev.dark) { G._darkOpen = false; HUD.hideMerchant(true); } else { G._merchOpen = false; HUD.hideMerchant(false); } break;
      case 'merchant_buy': A.buy(); R.ring(ev.x, ev.y, ev.color || '#ffd24a', 8, 60, 0.5); R.burst(ev.x, ev.y, ev.color || '#ffd24a', 16, 160, 0.5); HUD.killfeed(`${ev.icon} <b style="color:${ev.color}">${esc(ev.name)}</b> acquistato dal mercante!`); break;
      case 'dark_buy': A.evo(); R.ring(ev.x, ev.y, ev.color || '#7b2cbf', 10, 90, 0.6); R.burst(ev.x, ev.y, ev.color || '#a4133c', 22, 200, 0.6); R.addShake(5); HUD.killfeed(`${ev.icon} <b style="color:${ev.color}">${esc(ev.name)}</b> \u2014 ${esc(ev.note || 'patto siglato')}`); break;
      case 'nova': R.ring(ev.x, ev.y, '#7dffea', 6, 110, 0.45); break;
      // ===== v1.51 — feedback dei nuovi poteri =====
      case 'execute': A.kill(false); R.floater(ev.x, ev.y - 16, 'GRAZIA', '#ff5a7a', true); R.ring(ev.x, ev.y, '#ff5a7a', 5, 34, 0.28); R.burst(ev.x, ev.y, '#ff9ab0', 10, 150, 0.35); break;
      case 'corpse_blast': A.explosion(); R.ring(ev.x, ev.y, '#c48cff', 6, ev.r || 100, 0.4); R.burst(ev.x, ev.y, '#a06bff', 18, 200, 0.5); R.addShake(4); break;
      case 'retaliate': R.ring(ev.x, ev.y, '#ffb020', 6, ev.r || 120, 0.35); R.burst(ev.x, ev.y, '#ffd24a', 14, 190, 0.4); break;
      case 'aegis': if (ev.who === Net.id) { A.buy(); R.floater(ev.x, ev.y - 20, 'PARATO', '#7dffea', true); } R.ring(ev.x, ev.y, '#7dffea', 6, 44, 0.35); break;
      case 'defiance': if (ev.who === Net.id) { A.evo(); R.addShake(10); HUD.modeBanner('\u23F3 ULTIMA OCCASIONE', '#ffd24a', 'Sei tornato in piedi' + (ev.left > 0 ? ' \u00b7 ' + ev.left + ' carica/he rimasta/e' : ' \u00b7 era l\'ultima')); } R.ring(ev.x, ev.y, '#ffd24a', 10, 120, 0.7); R.burst(ev.x, ev.y, '#ffe89a', 26, 240, 0.7); break;
      case 'echo': R.burst(ev.x, ev.y, '#b061ff', 3, 70, 0.18); break;
      case 'combo': if (ev.who === Net.id) { A.xp(); R.floater(ev.x, ev.y - 20, ev.n + 'x COMBO! x' + (ev.mult || 1).toFixed(1), '#ffcf5a', true); R.addShake(2); if (ev.n >= 20) HUD.killfeed('\uD83D\uDD25 <b style=\"color:#ff8a3b\">COMBO ' + ev.n + '!</b> (moltiplicatore XP x' + (ev.mult || 1).toFixed(1) + ')'); } break;
      case 'combo_reward': { const RW = { 1: { c: '#ffd24a', t: '\u26a1 COMBO 15 \u2014 Frenesia!' }, 2: { c: '#ffd24a', t: '\uD83D\uDCA5 COMBO 25 \u2014 Nova!' }, 3: { c: '#4bd66b', t: '\uD83D\uDC9A COMBO 40 \u2014 Cura + Egida!' } }; const rw = RW[ev.tier] || RW[1]; R.ring(ev.x, ev.y, rw.c, 8, ev.tier === 2 ? 130 : 70, 0.6); R.burst(ev.x, ev.y, rw.c, 18, 200, 0.6); if (ev.tier >= 2) R.addShake(ev.tier === 3 ? 8 : 5); if (ev.who === Net.id) { A.boon(); HUD.killfeed('<b style="color:' + rw.c + '">' + rw.t + '</b>'); } break; }
      case 'synergy': A.evo(); HUD.killfeed(`\uD83D\uDD17 <b style="color:#7dffea">SINERGIA: ${esc(ev.name)}</b> \u2014 ${esc(ev.desc)}`); break;
      case 'ability': A.ability(ev.k); if (ev.k === 'bullettime') { R.ring(ev.x, ev.y, '#00f0c8', 10, 260, 0.6); R.addShake(4); HUD.killfeed('⏱ <b style="color:#00f0c8">BULLET-TIME</b>'); } else if (ev.k === 'barrier') R.ring(ev.x, ev.y, '#78c8ff', 8, 40, 0.4); else if (ev.k === 'rift') R.ring(ev.x, ev.y, '#00f0c8', 8, 140, 0.5); else if (ev.k === 'justice') R.burst(ev.x, ev.y, '#9fe0ff', 10, 200, 0.3); else if (ev.k === 'dash') R.burst(ev.x, ev.y, '#cfe8ff', 8, 150, 0.25); else if (ev.k === 'turret') { R.ring(ev.x, ev.y, '#9fe0ff', 8, 50, 0.5); R.burst(ev.x, ev.y, '#9fe0ff', 14, 150, 0.4); R.addShake(3); HUD.killfeed('\uD83C\uDFAF <b style="color:#9fe0ff">Torretta schierata!</b>'); } else if (ev.k === 'sniper') { const dx = Math.cos(ev.a), dy = Math.sin(ev.a); R.chain(ev.x, ev.y, ev.x + dx * 1200, ev.y + dy * 1200); R.burst(ev.x, ev.y, '#c7f06a', 10, 240, 0.3); R.addShake(6); } break;
      case 'boss_tell': R.ring(ev.x, ev.y, '#ff3b3b', 10, 80, 0.5); break;
      case 'boss_spawn': A.boss(); R.addShake(ev.mega ? 22 : 16); HUD.killfeed('⚠ <b style="color:' + (ev.mega ? '#ff2d55' : '#ff5252') + '">' + esc(ev.name) + '</b> ' + (ev.mega ? 'INCOMBE!' : 'è apparso!')); break;
      case 'par_ok': HUD.killfeed('\u23F1 ONDATA VELOCE \u2014 +' + ev.xp + ' XP, +' + ev.monete + ' \uD83E\uDE99'); break;
      case 'wave': A.wave(); HUD.killfeed((ev.final ? '☠ ONDATA FINALE ' : (ev.boss ? '⚠ ONDATA BOSS ' : '🌊 Ondata ')) + ev.wave); /* v1.78 — qui si annunciava la modalita dell ondata: non esistono piu, l ondata e una sola. */ break;
      case 'shop': HUD.killfeed('✨ Scegli un potere e spendi la XP'); break;
      case 'xp': A.xp(); R.floater(ev.x, ev.y - 8, '+' + ev.v, '#8bffb0'); break;
      case 'coin': if (ev.who === Net.id) { A.buy(); R.floater(ev.x, ev.y - 8, '\uD83E\uDE99 +' + ev.v, '#ffcf4a'); } break;
      case 'geared': { A.evo(); R.ring(ev.x, ev.y, ev.color || '#ffcf4a', 8, 80, 0.6); R.burst(ev.x, ev.y, ev.color || '#ffcf4a', 18, 190, 0.6); const st = { weapon: '⚔️', armor: '🛡️', shield: '🛡️', boots: '👢' }[ev.slot] || '🔨'; HUD.killfeed(`${st} <b style="color:${ev.color}">${esc(ev.name)}</b> equipaggiato!`); break; }
      // v2.12 — la rivendita. Due risposte, perche' le due cose vanno dette in modo diverso: quando il
      // pezzo e' andato si vede il lampo e il totale; quando il fabbro rifiuta si dice PERCHE'. Un
      // rifiuto muto sul pulsante "Vendi" si legge come un pulsante rotto.
      case 'venduto': { A.buy(); R.ring(ev.x, ev.y, ev.color || '#ffcf4a', 6, 70, 0.5); HUD.killfeed(`🪙 <b style="color:${ev.color}">${esc(ev.name)}</b> venduto al fabbro per <b>${ev.reso}</b> 🪙`); break; }
      case 'vendi_no': HUD.killfeed(ev.perche === 'addosso'
        ? '🔨 Il fabbro non compra quello che hai <b>addosso</b>: cambialo prima, poi torna a vendere.'
        : '🔨 Il fabbro non può comprare quel pezzo.'); break;
      case 'boon_ok': if (ev.off) HUD.killfeed('\uD83C\uDCCF <b>' + esc(ev.name) + '</b> \u2014 <b style="color:#ffcf4a">presa ma SPENTA</b>: hai gi\u00e0 5 carte attive, accendila dalla Cartomante'); A.boon(); HUD.killfeed(`🎴 Potere ottenuto: ${ev.icon} <b>${esc(ev.name)}</b>`); HUD.onBoonPicked(); break;
      case 'weapon_evo': A.evo(); R.ring(ev.x, ev.y, ev.color || '#b061ff', 10, 90, 0.7); R.burst(ev.x, ev.y, ev.color || '#b061ff', 26, 220, 0.7); R.addShake(8); HUD.killfeed(`✦ <b style="color:${ev.color}">${esc(ev.name2 || '')}</b> → ARMA EVOLUTA: <b>${esc(ev.name)}</b>!`); break;
      // v1.78 — qui c'erano i tre annunci dello Scrigno del Tesoro (comparsa, morte, fuga). La
      // modalita' Tesoro non esiste piu', quindi il server non manda piu' quegli eventi.
      case 'item_pickup': { const rare = ['i_rage', 'i_invuln', 'i_life', 'i_power'].includes(ev.id); A.item(rare); R.ring(ev.x, ev.y, ev.color || '#ffd24a', 8, 70, 0.5); R.burst(ev.x, ev.y, ev.color || '#ffd24a', rare ? 22 : 12, 180, 0.6); HUD.killfeed(`${ev.icon} <b style="color:${ev.color}">${esc(ev.name2 || '')}</b> → ${esc(ev.name)}`); break; }
      case 'weapon_pickup': A.weapon(); R.ring(ev.x, ev.y, ev.color || '#ffd24a', 8, 70, 0.5); R.burst(ev.x, ev.y, ev.color, 16, 170, 0.6); HUD.killfeed(`${ev.icon} <b style="color:${ev.color}">${esc(ev.name2 || '')}</b> → ${esc(ev.name)} <b>Lv.${ev.level}</b>`); break;
      case 'crate_buff': A.crate(); R.ring(ev.x, ev.y, ev.color, 8, 60, 0.5); R.burst(ev.x, ev.y, ev.color, 16, 160, 0.6); HUD.killfeed(`${ev.icon} <b style="color:${ev.color}">${esc(ev.name2 || '')}</b> → ${esc(ev.name)}!`); break;
      case 'crate_mimic': A.crateBad(); R.addShake(8); R.burst(ev.x, ev.y, '#ff3b3b', 20, 200, 0.5); HUD.killfeed('🪤 <b style="color:#ff5252">Era un MIMIC!</b>'); break;
      case 'bought': A.buy(); break;
      case 'block': R.ring(ev.x, ev.y, '#7dffea', 4, 24, 0.25); break;
      case 'revive': R.ring(ev.x, ev.y, '#4bd66b', 6, 50, 0.5); HUD.killfeed('❤️ Alleato rianimato'); break;
      case 'down': HUD.killfeed('⚠ <b>' + esc(ev.name || '') + '</b> è a terra! (' + ev.lives + ' ❤)'); R.addShake(6); break;
      case 'life_lost': A.lifeLost(); R.ring(ev.x, ev.y, '#ff5a7a', 8, 60, 0.6); R.addShake(8); HUD.killfeed('💔 <b>' + esc(ev.name || '') + '</b> perde una vita! (' + ev.lives + ' rimaste)'); break;
      case 'dead': HUD.killfeed('☠ <b>' + esc(ev.name || '') + '</b> è caduto'); break;
      case 'gameover': A.gameover(); A.scene('off'); showEnd(false, ev); break;
      case 'victory': A.victory(); A.scene('off'); showEnd(true, ev); break;
      case 'summon': R.ring(ev.x, ev.y, ev.c || '#7dffea', 6, 60, 0.4); break;
      case 'trap': R.burst(ev.x, ev.y, '#c8d0e0', 6, 100, 0.3); break;
      case 'reveal': R.ring(ev.x, ev.y, '#ff3b3b', 6, 50, 0.4); R.addShake(4); break;
    }
  }
  function showEnd(victory, ev) { G.started = false; const st = ev && ev.stats; const dur = ev && ev.dur; setTimeout(() => { const snap = Net.latest() || { wave: G.world.wave }; HUD.end(victory, snap, G.world.me, st, dur); $('hud').classList.add('hidden'); }, 900); }
  $('restartBtn').onclick = () => { HUD.hideEnd(); location.reload(); };

  // v2.10 — si sta giocando davvero? Cioe': nessuno dei pannelli a tutto schermo e' aperto. Lo decide lo
  // stato del DOM e non una variabile nostra, perche' i pannelli li aprono e chiudono cinque punti diversi
  // e una variabile che devono ricordarsi di aggiornare tutti prima o poi resta indietro.
  function inPartita() {
    if (!G.started) return false;
    for (const id of ['menu', 'lobby', 'upgradeScreen', 'endScreen']) {
      const el = $(id); if (el && !el.classList.contains('hidden')) return false;
    }
    return true;
  }
  function buildWorld() {
    const pair = Net.interpPair(); if (!pair) return; const [prev, next, a] = pair; const w = G.world;
    const pm = {}; for (const p of prev.players) pm[p.i] = p;
    w.players = next.players.map(np => { const pp = pm[np.i] || np; return Object.assign({}, np, { x: lerp(pp.x, np.x, a), y: lerp(pp.y, np.y, a), a: lerpA(pp.a, np.a, a) }); });
    w.me = w.players.find(p => p.i === Net.id) || null;
    if (w.me) {
      if (w.me.nm && !G._merchOpen && G.merchWares) { G._merchOpen = true; HUD.showMerchant(G.merchWares, (id) => Net.buyMerchant(id), null, false); } else if (!w.me.nm && G._merchOpen) { G._merchOpen = false; HUD.hideMerchant(false); }
      if (w.me.nmd && !G._darkOpen && G.darkWares) { G._darkOpen = true; HUD.showMerchant(G.darkWares, (id) => Net.buyMerchant(id, 1), null, true); } else if (!w.me.nmd && G._darkOpen) { G._darkOpen = false; HUD.hideMerchant(true); }
      if (w.me.ng && G.gearData) { if (!G._gearOpen) { G._gearOpen = true; } HUD.showGear(G.gearData, (id) => Net.buyGear(id), (id) => Net.vendiGear(id)); } else if (!w.me.ng && G._gearOpen) { G._gearOpen = false; HUD.hideGear(); }
      if (w.me.nh && G.potData) { if (!G._herbOpen) G._herbOpen = true; HUD.showPotions(G.potData, potCb); } else if (!w.me.nh && G._herbOpen) { G._herbOpen = false; HUD.hidePotions(); }
      if (w.me.nb && G.bndData) { if (!G._bndOpen) G._bndOpen = true; HUD.showBandit(G.bndData, bndCb); } else if (!w.me.nb && G._bndOpen) { G._bndOpen = false; HUD.hideBandit(); }
      if (w.me.ns && G.seerData) { if (!G._seerOpen) G._seerOpen = true; HUD.showSeer(G.seerData, (id) => Net.toggleCard(id)); } else if (!w.me.ns && G._seerOpen) { G._seerOpen = false; HUD.hideSeer(); }
      if (w.me.ni && G.innData) { if (!G._innOpen) G._innOpen = true; HUD.showInn(G.innData, () => Net.rest(), () => Net.salva()); } else if (!w.me.ni && G._innOpen) { G._innOpen = false; HUD.hideInn(); }
      HUD.updateBelt(w.me); HUD.updateBounty(w.me); HUD.updateHeroBox(w.me);
    }
    const mm = {}; for (const m of prev.mon) mm[m.e] = m;
    w.mon = next.mon.map(nm => { const p = mm[nm.e] || nm; return Object.assign({}, nm, { x: lerp(p.x, nm.x, a), y: lerp(p.y, nm.y, a), f: lerpA(p.f, nm.f, a) }); });
    const bm = {}; for (const b of prev.bul) bm[b.e] = b;
    w.bul = next.bul.map(nb => { const pb = bm[nb.e]; const o = Object.assign({}, nb); if (pb) { o.vx = (nb.x - pb.x) * C.SNAPSHOT_RATE; o.vy = (nb.y - pb.y) * C.SNAPSHOT_RATE; o.x = lerp(pb.x, nb.x, a); o.y = lerp(pb.y, nb.y, a); } return o; });
    w.orbs = next.orbs; w.met = next.met; w.crates = next.crates || []; w.wdrops = next.wdrops || [];
    w.xp = next.xp || []; w.coins = next.coins || []; w.items = next.items || []; w.zones = next.zones || []; w.tele = next.tele || []; w.rec = next.rec || null; w.chv = next.chv || null; w.chIn = next.chIn || 0; w.fg = next.fg || null;
    // v2.17 — ED E' RICAPITATO, esattamente come dice l'avvertimento qui sotto. `muri`, `trap` e `nebb`
    // stanno nello snapshot dalla v1.85 e non erano MAI stati copiati qui: il server li mandava, il
    // client li buttava, e il renderer disegnava tre array vuoti. Risultato: il muro di fuoco, la
    // tagliola e il velo non si sono mai visti — nessun errore da nessuna parte, solo abilita' che
    // sembravano non fare niente. Paolo: «il muro di fuoco non ha nessun effetto grafico».
    w.muri = next.muri || []; w.trap = next.trap || []; w.nebb = next.nebb || [];
    // e `tick`, il tempo della PARTITA: il renderer ci mette i girovaghi del villaggio, che sono una
    // funzione del tempo del server apposta perche' tutti li vedano nello stesso punto. Senza questa
    // riga il renderer ripiegava sull'orologio locale, e in cooperativa ognuno li vedeva altrove.
    w.tick = next.tick;
    // v1.52 FIX — merch/merchD non venivano mai copiati dallo snapshot: i mercanti erano invisibili in mappa
    // (beacon e marker sulla minimappa compresi). Ora vengono aggiornati insieme al resto del mondo.
    w.merch = next.merch || null; w.merchD = next.merchD || null; w.gmerch = next.gmerch || null;
    // ATTENZIONE — QUI SI PERDONO I CAMPI NUOVI. L'HUD non riceve lo snapshot del server: riceve
    // G.world, che e' lo stato interpolato del client, e i campi non-giocatore vanno copiati QUI a mano
    // uno per uno. Chi aggiunge un campo allo snapshot e si dimentica di questa riga vede il campo
    // arrivare sul filo e sparire prima dell'HUD, senza nessun errore da nessuna parte.
    // E' successo col cronometro dell'ondata (v1.77): il server mandava wt e wp, il client li buttava,
    // e il cronometro restava fermo su 0:00. C'e' un controllo in test/client.js che confronta i campi
    // letti da updateTop con quelli copiati qui, apposta perche' non ricapiti.
    w.bt = next.bt; w.wave = next.wave; w.phase = next.phase; w.mcount = next.mcount; w.pend = next.pend;
    w.wt = next.wt; w.wp = next.wp; w.ex = next.ex;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpA(a, b, t) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * t; }

  let last = performance.now();
  function loop(now) {
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    // HIT-STOP: freeze-frame breve (juice). Continua a inviare input ma congela mondo/particelle.
    let frozen = false;
    if (G.hitstop > 0) { G.hitstop -= dt; frozen = true; }
    if (G.started || Net.latest()) {
      if (!frozen) buildWorld();
      if (G.world.me && (now - G.lastInput) > 33) { G.lastInput = now; Net.sendInput(Input.build(R.w / 2, R.h / 2)); }
      // v2.10 — IL POINTER LOCK VA SGANCIATO QUANDO SI APRE UN PANNELLO. Non e' un dettaglio: agganciati,
      // il cursore non esiste e i pulsanti del menu di fine ondata non si potrebbero cliccare. Si guarda
      // quale pannello e' a schermo, non si tiene un flag: i flag si dimenticano di essere spenti.
      //
      // v2.11.1 — E NEL VILLAGGIO IL GUINZAGLIO SI SPEGNE DEL TUTTO. Li' il mouse non serve a sparare:
      // serve a CLICCARE i banchi — fabbro, Ostessa, Erborista, Banditore hanno dei pulsanti. Col pointer
      // lock il cursore non esiste, quindi quei pulsanti non si potevano premere: era un bug vero, non un
      // fastidio. Dentro il villaggio torna il cursore del sistema e il mirino non si disegna nemmeno.
      const inVillaggio = (Net.latest() || {}).phase === C.PHASE_MARKET;
      Input.setGuinzaglio(!inVillaggio);
      if (Input.locked && (inVillaggio || !inPartita())) Input.sgancia();
      // il cursore del sistema sul canvas si rivede quando serve cliccare: nel villaggio, e quando il
      // gioco non e' in mano al giocatore. In combattimento resta nascosto — li' il puntatore e' il mirino.
      $('game').classList.toggle('libero', inVillaggio || !inPartita());
      if (!frozen) R.updateFx(dt);
      R.render(frozen ? 0 : dt, G.world);
      const snap = Net.latest();
      if (snap && G.started) { HUD.updateTop(G.world, G.world.me); HUD.updateBossBar(G.world); HUD.updateAbilities(G.world.me); }
    }
    requestAnimationFrame(loop);
  }
  window.addEventListener('keydown', (e) => {
    // v2.7 — mentre parla qualcuno, Spazio ed Esc sono suoi. Vengono PRIMA di tutto il resto: Spazio e'
    // anche "spara" e "pronto per l'ondata", ed e' quello il motivo per cui questo blocco sta in cima e
    // finisce con un return. Chi non comanda preme a vuoto, e va bene cosi': sta leggendo.
    if (G._st && !$('dial').classList.contains('hidden')) {
      if (e.code === 'Space') { e.preventDefault();
        if (!HUD.dialogoFretta() && G.capo !== false) Net.storiaAvanti(false); return; }
      if (e.code === 'Escape') { e.preventDefault(); if (G.capo !== false) Net.storiaAvanti(true); return; }
    }
    if (e.code === 'Enter') { const ci = $('chatInput'); if (ci.classList.contains('hidden')) { Input.clearKeys(); ci.classList.remove('hidden'); ci.focus(); } else { const t = ci.value.trim(); if (t) Net.chat(t); ci.value = ''; ci.classList.add('hidden'); Input.clearKeys(); Input.canvas && Input.canvas.focus(); } e.preventDefault(); }
    else if (e.code === 'Escape') { const ci = $('chatInput'); if (!ci.classList.contains('hidden')) { ci.value = ''; ci.classList.add('hidden'); } }
    else if (e.code === 'Space' && !$('upgradeScreen').classList.contains('hidden')) { const b = $('nextWaveBtn'); if (b && !b.disabled) { Net.shopReady(); HUD.prontoPerOndata(); } }
    else if (e.code === 'KeyM') A.toggleMusic();
  });
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  window.addEventListener('load', () => {
    const v = (C && C.VERSION) ? C.VERSION : '';
    if (v) { document.title = 'DUNGEON RIFT v' + v + ' — Roguelike Co-op'; const vb = $('verBadge'); if (vb) vb.textContent = 'v' + v; }
    R.init($('game')); Input.init($('game'));
    // v2.10 — il pointer lock si chiede al CLIC, perche' il browser lo concede solo su un gesto
    // dell'utente: chiederlo al caricamento verrebbe rifiutato e basta. Il clic che aggancia e' anche il
    // clic che spara — sono due cose diverse e non si disturbano.
    $('game').addEventListener('mousedown', () => { if (inPartita()) Input.aggancia(); });
    initMenu(); requestAnimationFrame(loop);
    // v1.90 — la musica del menu. Il browser non fa partire l'audio prima di un gesto dell'utente:
    // A.scene() se ne accorge e riprova da solo al primo click o al primo tasto.
    A.scene('menu');
  });
})();
