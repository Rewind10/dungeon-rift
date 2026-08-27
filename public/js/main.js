/* main.js — orchestrazione client (boon, hit-stop, modalità) */
(function () {
  'use strict';
  const C = window.GAME.Constants;
  const Net = window.Net, Input = window.Input, R = window.Renderer, HUD = window.HUD, A = window.GameAudio;
  const $ = (id) => document.getElementById(id);
  const G = { started: false, meHero: 'enforcer', hitstop: 0, world: { players: [], mon: [], bul: [], orbs: [], met: [], crates: [], wdrops: [], xp: [], coins: [], items: [], zones: [], merch: null, merchD: null, gmerch: null, me: null, bt: 0, wave: 1, phase: 'lobby', mcount: 0, pend: 0, mode: 'assault', survive: 0 }, lastInput: 0 };

  function initMenu() { $('nameInput').value = 'Eroe' + Math.floor(Math.random() * 900 + 100); HUD.buildHeroSelect(id => { G.meHero = id; }); G.meHero = HUD.selectedHero; $('connectBtn').onclick = () => { A.resume(); const name = $('nameInput').value.trim() || 'Eroe'; const room = $('roomInput').value.trim(); G.meHero = HUD.selectedHero; $('menuMsg').textContent = 'Connessione…'; Net.connect(name, G.meHero, room); }; }

  Net.onWelcome = (m) => { $('menu').classList.add('hidden'); R.setMap(m.map); if (m.phase === C.PHASE_LOBBY) showLobby(m.players); else enterGame(); };
  Net.onMap = (m) => { R.setMap(m.map); HUD.zoneName(m.map && m.map.theme); };   // v1.62 — nome della zona in HUD
  Net.onFull = () => { $('menuMsg').textContent = 'Stanza piena, riprova.'; };
  Net.onClose = () => { $('menuMsg').textContent = 'Connessione persa.'; };
  let lobbyPlayers = [];
  function showLobby(players) { lobbyPlayers = players || lobbyPlayers; HUD.lobby(Net.room, lobbyPlayers, Net.id, () => Net.start(), () => { HUD.hideLobby(); $('menu').classList.remove('hidden'); $('connectBtn').textContent = 'Aggiorna eroe'; $('connectBtn').onclick = () => { G.meHero = HUD.selectedHero; Net.setHero(G.meHero); $('menu').classList.add('hidden'); showLobby(lobbyPlayers); }; }); }
  function enterGame() { if (G.started) return; G.started = true; HUD.hideLobby(); $('hud').classList.remove('hidden'); HUD.buildAbilityBar(G.meHero); A.startMusic(false); }

  Net.onOfferShop = (m) => { HUD.setStats(m, (id) => Net.buyStat(id), (dest) => Net.shopReady(dest || 'wave')); };
  Net.onOfferBoon = (m) => { HUD.setBoons(m, (id) => Net.pickBoon(id)); };
  // v1.52 — l'offerta arriva sia dal pannello di fine ondata (se riabilitato) sia dal mercante del MERCATO:
  // 'near' distingue i due casi.
  Net.onOfferGear = (m) => {
    G.gearData = m;
    if (m.near) HUD.showGear(m, (slot) => Net.buyGear(slot));
    else if (C.SHOP_GEAR_ENABLED) HUD.setGear(m, (slot) => Net.buyGear(slot));
  };
  Net.onBoons = (m) => { HUD.setActiveBoons(m.boons || []); };  // v1.51 — barra dei poteri attivi
  G.merchWares = null; G.darkWares = null;
  Net.onOfferMerchant = (m) => { if (m.dark) { G.darkWares = m.wares || G.darkWares; if (m.near) HUD.showMerchant(G.darkWares, (id) => Net.buyMerchant(id, 1), m.coins, true); else if (m.coins != null) HUD.updateMerchantCoins(m.coins, true); } else { G.merchWares = m.wares || G.merchWares; if (m.near) HUD.showMerchant(G.merchWares, (id) => Net.buyMerchant(id), m.coins, false); else if (m.coins != null) HUD.updateMerchantCoins(m.coins, false); } };
  Net.onChat = (m) => { const log = $('chatLog'); const el = document.createElement('div'); el.className = 'cm'; el.innerHTML = `<b>${esc(m.from)}:</b> ${esc(m.text)}`; log.appendChild(el); setTimeout(() => el.remove(), 8000); while (log.children.length > 6) log.removeChild(log.firstChild); };
  Net.onSnapshot = (snap) => { if (!G.started && snap.phase !== C.PHASE_LOBBY) enterGame(); A.setBoss(snap.phase === C.PHASE_BOSS); if (snap.phase !== C.PHASE_SHOP) HUD.hideShop(); if (snap.ev && snap.ev.length) for (const ev of snap.ev) onEv(ev); };
  Net.onEvent = (ev) => onEv(ev);

  function onEv(ev) {
    switch (ev.t) {
      case 'shot': A.shoot(ev.hero, ev.wt); R.burst(ev.x, ev.y, '#ffe', 2, 60, 0.15); break;
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
      case 'zone_tell': A.ability && A.ability('rift'); R.ring(ev.x, ev.y, ev.c || '#ff3b3b', 4, ev.r, 0.35); break;
      case 'zone_hit': A.explosion(); R.ring(ev.x, ev.y, ev.c || '#ff3b3b', 8, ev.r, 0.4); R.burst(ev.x, ev.y, ev.c || '#ff5a5a', 22, 230, 0.5); R.addShake(6); break;
      case 'lunge': R.hitAttack(ev.e, 0.3); R.burst(ev.x, ev.y, '#ffd9a0', 6, 130, 0.25); break;
      case 'melee': R.hitAttack(ev.e, 0.32); break; // v1.26 — swing d'attacco
      case 'cast': R.hitAttack(ev.e, 0.5); break; // v1.26 — negromante evoca (orbe divampa)
      case 'acid': if (ev.e != null) R.hitAttack(ev.e, 0.55); R.burst(ev.x, ev.y - 6, '#a6ff3a', 14, 150, 0.5); R.ring(ev.x, ev.y, '#a6ff3a', 4, 26, 0.3); break; // v1.45 — la Melma salta e sputa acido
      case 'market': HUD.modeBanner('\uD83C\uDFEA MERCATO', '#ffcf4a', 'Nessun nemico \u00b7 potenzia l\'equipaggiamento e prosegui dal portale EXIT'); HUD.killfeed('\uD83C\uDFEA <b style="color:#ffcf4a">MERCATO</b> \u2014 il portale <b>EXIT</b> porta all\'ondata ' + ev.next); break;
      case 'market_exit': HUD.killfeed('\uD83D\uDEAA <b>' + esc(ev.name || 'Qualcuno') + '</b> ha varcato il portale EXIT'); break;
      case 'gear_leave': G._gearOpen = false; HUD.hideGear(); break;
      case 'spore': if (ev.e != null) R.hitAttack(ev.e, 0.9); R.ring(ev.x, ev.y - 6, ev.c || '#a6ff3a', 4, 34, 0.45); R.burst(ev.x, ev.y - 8, ev.c || '#a6ff3a', 12, 120, 0.6); break;  // v1.58 — il fungo sbuffa
      case 'roll_wind': if (ev.e != null) R.hitAttack(ev.e, ev.dur || 0.62); R.ring(ev.x, ev.y, '#ff7a3b', 3, 26, 0.35); break;  // v1.58 — la sfera si carica
      case 'roll_go': A.kill && A.kill(false); R.burst(ev.x, ev.y, '#cfc7b0', 10, 150, 0.35); break;
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
      case 'wave': A.wave(); HUD.killfeed((ev.final ? '☠ ONDATA FINALE ' : (ev.boss ? '⚠ ONDATA BOSS ' : '🌊 Ondata ')) + ev.wave); if (ev.modeName && !ev.boss) HUD.modeBanner(ev.modeName, ev.modeColor, ev.modeDesc); break;
      case 'shop': HUD.killfeed('✨ Scegli un potere e spendi la XP'); break;
      case 'xp': A.xp(); R.floater(ev.x, ev.y - 8, '+' + ev.v, '#8bffb0'); break;
      case 'coin': if (ev.who === Net.id) { A.buy(); R.floater(ev.x, ev.y - 8, '\uD83E\uDE99 +' + ev.v, '#ffcf4a'); } break;
      case 'geared': { A.evo(); R.ring(ev.x, ev.y, ev.color || '#ffcf4a', 8, 80, 0.6); R.burst(ev.x, ev.y, ev.color || '#ffcf4a', 18, 190, 0.6); const gic = /\.(png|svg|webp|jpg)$/i.test(ev.icon || '') ? `<img class="gearmini" src="/${ev.icon}" alt="">` : (ev.icon || ''); HUD.killfeed(`${gic} <b style="color:${ev.color}">${esc(ev.name)} ${esc(ev.rank || '')}</b> equipaggiato!`); break; }
      case 'boon_ok': A.boon(); HUD.killfeed(`🎴 Potere ottenuto: ${ev.icon} <b>${esc(ev.name)}</b>`); HUD.onBoonPicked(); break;
      case 'weapon_evo': A.evo(); R.ring(ev.x, ev.y, ev.color || '#b061ff', 10, 90, 0.7); R.burst(ev.x, ev.y, ev.color || '#b061ff', 26, 220, 0.7); R.addShake(8); HUD.killfeed(`✦ <b style="color:${ev.color}">${esc(ev.name2 || '')}</b> → ARMA EVOLUTA: <b>${esc(ev.name)}</b>!`); break;
      case 'treasure_spawn': HUD.killfeed('👑 <b style="color:#ffd24a">Scrigno del Tesoro!</b> Uccidilo prima che fugga!'); break;
      case 'treasure_dead': R.burst(ev.x, ev.y, '#ffd24a', 30, 240, 0.8); R.ring(ev.x, ev.y, '#ffd24a', 8, 120, 0.6); HUD.killfeed('💰 <b style="color:#ffd24a">Tesoro conquistato!</b>'); break;
      case 'treasure_escape': HUD.killfeed('💨 <b style="color:#ff8a5b">Lo scrigno è fuggito…</b>'); break;
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
      case 'gameover': A.gameover(); A.stopMusic(); showEnd(false, ev); break;
      case 'victory': A.victory(); A.stopMusic(); showEnd(true, ev); break;
      case 'summon': R.ring(ev.x, ev.y, ev.c || '#7dffea', 6, 60, 0.4); break;
      case 'trap': R.burst(ev.x, ev.y, '#c8d0e0', 6, 100, 0.3); break;
      case 'reveal': R.ring(ev.x, ev.y, '#ff3b3b', 6, 50, 0.4); R.addShake(4); break;
    }
  }
  function showEnd(victory, ev) { G.started = false; const st = ev && ev.stats; const dur = ev && ev.dur; setTimeout(() => { const snap = Net.latest() || { wave: G.world.wave }; HUD.end(victory, snap, G.world.me, st, dur); $('hud').classList.add('hidden'); }, 900); }
  $('restartBtn').onclick = () => { HUD.hideEnd(); location.reload(); };

  function buildWorld() {
    const pair = Net.interpPair(); if (!pair) return; const [prev, next, a] = pair; const w = G.world;
    const pm = {}; for (const p of prev.players) pm[p.i] = p;
    w.players = next.players.map(np => { const pp = pm[np.i] || np; return Object.assign({}, np, { x: lerp(pp.x, np.x, a), y: lerp(pp.y, np.y, a), a: lerpA(pp.a, np.a, a) }); });
    w.me = w.players.find(p => p.i === Net.id) || null;
    if (w.me) {
      if (w.me.nm && !G._merchOpen && G.merchWares) { G._merchOpen = true; HUD.showMerchant(G.merchWares, (id) => Net.buyMerchant(id), null, false); } else if (!w.me.nm && G._merchOpen) { G._merchOpen = false; HUD.hideMerchant(false); }
      if (w.me.nmd && !G._darkOpen && G.darkWares) { G._darkOpen = true; HUD.showMerchant(G.darkWares, (id) => Net.buyMerchant(id, 1), null, true); } else if (!w.me.nmd && G._darkOpen) { G._darkOpen = false; HUD.hideMerchant(true); }
      if (w.me.ng && G.gearData) { if (!G._gearOpen) { G._gearOpen = true; } HUD.showGear(G.gearData, (slot) => Net.buyGear(slot)); } else if (!w.me.ng && G._gearOpen) { G._gearOpen = false; HUD.hideGear(); }
    }
    const mm = {}; for (const m of prev.mon) mm[m.e] = m;
    w.mon = next.mon.map(nm => { const p = mm[nm.e] || nm; return Object.assign({}, nm, { x: lerp(p.x, nm.x, a), y: lerp(p.y, nm.y, a), f: lerpA(p.f, nm.f, a) }); });
    const bm = {}; for (const b of prev.bul) bm[b.e] = b;
    w.bul = next.bul.map(nb => { const pb = bm[nb.e]; const o = Object.assign({}, nb); if (pb) { o.vx = (nb.x - pb.x) * C.SNAPSHOT_RATE; o.vy = (nb.y - pb.y) * C.SNAPSHOT_RATE; o.x = lerp(pb.x, nb.x, a); o.y = lerp(pb.y, nb.y, a); } return o; });
    w.orbs = next.orbs; w.met = next.met; w.crates = next.crates || []; w.wdrops = next.wdrops || [];
    w.xp = next.xp || []; w.coins = next.coins || []; w.items = next.items || []; w.zones = next.zones || [];
    // v1.52 FIX — merch/merchD non venivano mai copiati dallo snapshot: i mercanti erano invisibili in mappa
    // (beacon e marker sulla minimappa compresi). Ora vengono aggiornati insieme al resto del mondo.
    w.merch = next.merch || null; w.merchD = next.merchD || null; w.gmerch = next.gmerch || null;
    w.bt = next.bt; w.wave = next.wave; w.phase = next.phase; w.mcount = next.mcount; w.pend = next.pend; w.mode = next.mode; w.survive = next.survive;
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
      if (!frozen) R.updateFx(dt);
      R.render(frozen ? 0 : dt, G.world);
      const snap = Net.latest();
      if (snap && G.started) { HUD.updateTop(G.world, G.world.me); HUD.updateBossBar(G.world); HUD.updateAbilities(G.world.me); }
    }
    requestAnimationFrame(loop);
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') { const ci = $('chatInput'); if (ci.classList.contains('hidden')) { Input.clearKeys(); ci.classList.remove('hidden'); ci.focus(); } else { const t = ci.value.trim(); if (t) Net.chat(t); ci.value = ''; ci.classList.add('hidden'); Input.clearKeys(); Input.canvas && Input.canvas.focus(); } e.preventDefault(); }
    else if (e.code === 'Escape') { const ci = $('chatInput'); if (!ci.classList.contains('hidden')) { ci.value = ''; ci.classList.add('hidden'); } }
    else if (e.code === 'Space' && !$('upgradeScreen').classList.contains('hidden')) { Net.shopReady('wave'); HUD.hideShop(); }
    else if (e.code === 'KeyM') A.toggleMusic();
  });
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  window.addEventListener('load', () => {
    const v = (C && C.VERSION) ? C.VERSION : '';
    if (v) { document.title = 'DUNGEON RIFT v' + v + ' — Roguelike Co-op'; const vb = $('verBadge'); if (vb) vb.textContent = 'v' + v; }
    R.init($('game')); Input.init($('game')); initMenu(); requestAnimationFrame(loop);
  });
})();
