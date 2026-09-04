/* ai.js — comportamenti IA (server) */
(function (root, factory) {
  const m = factory((typeof module !== 'undefined' && module.exports) ? require('./mathutils.js') : root.GAME.Math);
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.AI = m; }
})(typeof self !== 'undefined' ? self : this, function (MU) {
  'use strict';
  function seek(mon, ctx, sm = 1) { const s = ctx.flowStep(mon); let dx = s.x, dy = s.y; if (dx === 0 && dy === 0) { const p = ctx.nearest(mon); if (p) { const n = MU.norm(p.x - mon.x, p.y - mon.y); dx = n.x; dy = n.y; } } dx += (Math.random() - 0.5) * 0.15; dy += (Math.random() - 0.5) * 0.15; const n = MU.norm(dx, dy); const sp = mon.speed * sm; mon.mx = n.x * sp; mon.my = n.y * sp; if (n.x || n.y) mon.facing = Math.atan2(n.y, n.x); }
  function flee(mon, ctx, sm = 1) { const p = ctx.nearest(mon); if (!p) { mon.mx = mon.my = 0; return; } const s = ctx.flowStep(mon); const n = MU.norm(-s.x, -s.y); const sp = mon.speed * sm; mon.mx = n.x * sp; mon.my = n.y * sp; mon.facing = Math.atan2(p.y - mon.y, p.x - mon.x); }
  function stop(mon, p) { mon.mx = mon.my = 0; if (p) mon.facing = Math.atan2(p.y - mon.y, p.x - mon.x); }
  // v1.43 — VAGABONDAGGIO: quando il nemico NON vede il giocatore si muove a caso per la mappa.
  // Sceglie un bersaglio casuale raggiungibile (niente muri, LOS libera) e ci cammina; ne prende uno nuovo
  // al raggiungimento, allo scadere del timer o se resta bloccato (rilevato dal poco spostamento reale).
  function wander(mon, ctx, sm = 0.55) {
    // rilevamento "bloccato" tra un tick e l'altro (l'IA gira prima del movimento)
    if (mon._wpx != null) { const moved = MU.dist(mon.x, mon.y, mon._wpx, mon._wpy); mon._wstuck = (moved < 0.6 && (Math.abs(mon.mx) + Math.abs(mon.my) > 1)) ? (mon._wstuck || 0) + ctx.dt : 0; }
    mon._wpx = mon.x; mon._wpy = mon.y;
    mon.wanT = (mon.wanT != null ? mon.wanT : 0) - ctx.dt;
    const reached = mon.wx != null && MU.dist(mon.x, mon.y, mon.wx, mon.wy) < 34;
    if (mon.wx == null || reached || mon.wanT <= 0 || (mon._wstuck || 0) > 0.4) {
      let ok = false;
      for (let i = 0; i < 14 && !ok; i++) { const a = Math.random() * Math.PI * 2, r = 90 + Math.random() * 260; const tx = mon.x + Math.cos(a) * r, ty = mon.y + Math.sin(a) * r; if (!ctx.isWallAt(tx, ty) && ctx.losClear(mon.x, mon.y, tx, ty)) { mon.wx = tx; mon.wy = ty; ok = true; } }
      mon.wanT = MU.rand(1.4, 3.2); mon._wstuck = 0;
      if (!ok) { mon.mx = mon.my = 0; return; }
    }
    const n = MU.norm(mon.wx - mon.x, mon.wy - mon.y); const sp = mon.speed * sm;
    mon.mx = n.x * sp; mon.my = n.y * sp; if (n.x || n.y) mon.facing = Math.atan2(n.y, n.x);
  }
  // v1.43 — PERCEZIONE: il nemico "vede" il giocatore se entro senseRange e con linea di vista libera.
  // Ritorna { p, d, sees }. Aggiorna la memoria dell'ultima posizione vista (per "investigare" prima di vagare).
  function perceive(mon, ctx, senseR) {
    const p = ctx.nearest(mon); if (!p) return { p: null, d: Infinity, sees: false };
    const d = MU.dist(mon.x, mon.y, p.x, p.y);
    const sees = d <= (senseR || 560) && ctx.losClear(mon.x, mon.y, p.x, p.y);
    if (sees) { mon.lkx = p.x; mon.lky = p.y; mon.seeT = mon.def.memory || 3.5; }
    return { p, d, sees };
  }
  // Investiga l'ultima posizione nota; ritorna true finché è "in caccia" (memoria attiva).
  function investigate(mon, ctx) {
    mon.seeT = (mon.seeT || 0) - ctx.dt; if (mon.seeT <= 0 || mon.lkx == null) return false;
    if (MU.dist(mon.x, mon.y, mon.lkx, mon.lky) < 44) { mon.seeT = 0; return false; }
    seek(mon, ctx, 0.95); return true;
  }
  // v1.80 — CACCIA: il nemico che non ti vede non vaga piu' a caso, ti CERCA. Segue lo stesso campo di
  // flusso dell'inseguimento (ricostruito verso tutti i giocatori ogni 0.12 s) ma a velocita' ridotta:
  // vederti conta ancora, perche' chi ti vede corre e chi ti fiuta cammina. Su una mappa grande questo
  // e' l'unica cosa che tiene insieme l'ondata: senza, meta' dei mostri gira in un angolo che non vedrai
  // mai. Il vagabondaggio resta come RIPIEGO per i due casi in cui la caccia non porta da nessuna parte:
  // nessun giocatore vivo, oppure il mostro e' incastrato e il flusso continua a spingerlo contro il muro.
  function caccia(mon, ctx, sm = 0.75) {
    if (mon._cacciaBlk > 0) { mon._cacciaBlk -= ctx.dt; wander(mon, ctx, sm); return; }
    if (mon._cpx != null && (Math.abs(mon.mx) + Math.abs(mon.my)) > 1 && MU.dist(mon.x, mon.y, mon._cpx, mon._cpy) < 0.6) mon._cstuck = (mon._cstuck || 0) + ctx.dt; else mon._cstuck = 0;
    mon._cpx = mon.x; mon._cpy = mon.y;
    if (mon._cstuck > 0.8) { mon._cstuck = 0; mon._cacciaBlk = 1.6; mon.wx = null; wander(mon, ctx, sm); return; }
    if (!ctx.nearest(mon)) { wander(mon, ctx, sm); return; }
    seek(mon, ctx, sm);
  }
  // v1.80 — ATTESA: chi e' oltre il tetto della folla non sparisce dall'altra parte della mappa e non
  // ti viene addosso: risale fino all'anello e li' gira. Resta a portata di richiamo — appena si libera
  // un posto e' a pochi secondi da te — ma sta fuori dallo sguardo.
  function attesa(mon, ctx) {
    const p = ctx.nearest(mon);
    if (p && MU.dist(mon.x, mon.y, p.x, p.y) > (ctx.ANELLO || 900)) { caccia(mon, ctx, 0.6); return; }
    wander(mon, ctx, 0.5);
  }
  // Vede il giocatore? Come perceive, ma senza toccare la memoria: serve solo a decidere se uno che
  // sta aspettando il turno puo' restare fermo. Chi ti ha in vista non aspetta niente.
  function vedeIl(mon, ctx) {
    const p = ctx.nearest(mon); if (!p) return false;
    const r = mon.def.sightRange || mon.def.gazeRange || mon.def.atkRange || 560;
    return MU.dist(mon.x, mon.y, p.x, p.y) <= r && ctx.losClear(mon.x, mon.y, p.x, p.y);
  }
  function melee(mon, ctx, p, dm = 1, kn = 1) { if (!p) return; const d = MU.dist(mon.x, mon.y, p.x, p.y); if (d <= mon.def.atkRange + p.radius && mon.atkT <= 0) { ctx.melee(mon, p, mon.dmg * dm, kn); mon.atkT = mon.def.atkCd; ctx.emit({ t: 'melee', e: mon.eid, x: mon.x, y: mon.y, f: mon.facing, id: mon.type }); } }
  const behaviors = {
    // v1.43 — Zombie: insegue e si avventa SOLO se ti vede (senseRange + LOS); ricorda l'ultima posizione e
    // la "investiga"; se non ti vede da un po', VAGA a caso per la mappa (comportamento più organico).
    swarm(m, ctx) {
      m.lungeT = (m.lungeT || MU.rand(1.5, 3.5)) - ctx.dt;
      if (m.lunge > 0) { m.lunge -= ctx.dt; m.mx = (m.ldx || 0) * m.speed * 2.3; m.my = (m.ldy || 0) * m.speed * 2.3; const pp = ctx.nearest(m); if (pp) m.facing = Math.atan2(m.my, m.mx); melee(m, ctx, pp, 1.2, 1.6); return; }
      const { p, d, sees } = perceive(m, ctx, m.def.sightRange || 560);
      if (sees) {
        if (m.lungeT <= 0 && d < 220 && d > 40) { const n = MU.norm(p.x - m.x, p.y - m.y); m.ldx = n.x; m.ldy = n.y; m.lunge = 0.28; m.lungeT = MU.rand(2.2, 4.0); ctx.emit({ t: 'lunge', e: m.eid, x: m.x, y: m.y, f: Math.atan2(n.y, n.x) }); return; }
        seek(m, ctx, 1); melee(m, ctx, p);
      } else if (!investigate(m, ctx)) { caccia(m, ctx, 0.82); }
    },
    charger(m, ctx) { const p = ctx.nearest(m); const e = m.hp / m.maxHp <= (m.def.enrageAtHp || 0); seek(m, ctx, e ? (m.def.enrageSpeed || 1.5) : 1); melee(m, ctx, p, e ? (m.def.enrageDmg || 1.4) : 1, 1.4); if (e && !m.enraged) { m.enraged = true; ctx.emit({ t: 'enrage', x: m.x, y: m.y }); } },
    shielded(m, ctx) { const p = ctx.nearest(m); seek(m, ctx, 1); if (p) m.facing = Math.atan2(p.y - m.y, p.x - m.x); melee(m, ctx, p); },
    caster(m, ctx) { const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; return; } const d = MU.dist(m.x, m.y, p.x, p.y); const id = m.def.atkRange * 0.72; if (d < id * 0.75) flee(m, ctx, 0.9); else if (d > m.def.atkRange) seek(m, ctx, 0.9); else stop(m, p);
      m.zoneT = (m.zoneT || MU.rand(2.5, 4.5)) - ctx.dt;
      if (m.zoneT <= 0 && d <= m.def.atkRange && ctx.losClear(m.x, m.y, p.x, p.y)) { ctx.zone(p.x, p.y, 60, 0.95, m.dmg * 1.4, m.def.projColor); m.zoneT = MU.rand(3.5, 6.0); m.atkT = Math.max(m.atkT, 0.6); return; }
      if (m.atkT <= 0 && d <= m.def.atkRange && ctx.losClear(m.x, m.y, p.x, p.y)) { const n = MU.norm(p.x - m.x, p.y - m.y); ctx.emit({ t: 'cast', e: m.eid, x: m.x, y: m.y }); if ((m.castN = (m.castN || 0) + 1) % 3 === 0) { ctx.spread(m, n.x, n.y, 3, 0.22, m.def.projSpeed, Math.round(m.dmg * 0.7), m.def.projColor); } else { ctx.shoot(m, n.x, n.y, m.def.projSpeed, m.dmg, m.def.projColor); } m.atkT = m.def.atkCd; } },
    // v1.39 — Negromante (PUPPET): tiene la distanza (kiting), EVOCA zombi minori fino a minionCap, e SPARA sfere
    // DEBILITANTI (curse) SOLO quando il bersaglio è nel suo CAMPO VISIVO (cono fov). La testa ruota LENTAMENTE verso
    // il bersaglio (turn rate limitato): così il giocatore può uscire dal cono aggirandolo, e deve "rientrare in vista".
    necromancer(m, ctx) {
      const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; m.alert = 0; return; }
      const d = MU.dist(m.x, m.y, p.x, p.y);
      const range = m.def.sightRange || m.def.atkRange || 340;
      const fov = m.def.fov || 0.62;
      // KITING: se troppo vicino fugge, se troppo lontano avanza, altrimenti tiene posizione.
      const id = m.def.atkRange * 0.75;
      if (d < id * 0.7) flee(m, ctx, 0.95); else if (d > m.def.atkRange) seek(m, ctx, 0.8); else { m.mx = m.my = 0; }
      // ROTAZIONE LENTA del facing verso il bersaglio (il cono "insegue" con ritardo).
      const des = Math.atan2(p.y - m.y, p.x - m.x);
      m.facing = MU.turnToward(m.facing != null ? m.facing : des, des, (m.def.turn || 2.1) * ctx.dt);
      // TEST CAMPO VISIVO: dentro il cono (attorno al facing), entro gittata e con LOS libera.
      const diff = Math.abs(((des - m.facing + Math.PI) % (2 * Math.PI)) - Math.PI);
      const inView = d <= range && diff <= fov && ctx.losClear(m.x, m.y, p.x, p.y);
      m.alert = inView ? 1 : 0;
      // SFERE DEBILITANTI: solo se il bersaglio è nel campo visivo. Ogni 3° tiro è un ventaglio da 3.
      if (inView && m.atkT <= 0) {
        const n = MU.norm(p.x - m.x, p.y - m.y);
        ctx.emit({ t: 'cast', e: m.eid, x: m.x, y: m.y });
        if ((m.castN = (m.castN || 0) + 1) % 3 === 0) { ctx.spread(m, n.x, n.y, 3, 0.18, m.def.projSpeed, Math.round(m.dmg * 0.8), m.def.projColor); }
        else { ctx.shoot(m, n.x, n.y, m.def.projSpeed, m.dmg, m.def.projColor); }
        m.atkT = m.def.atkCd;
      }
      // EVOCAZIONE zombi minori, con TETTO (minionCap): evoca solo per riempire i posti liberi.
      m.summonT = (m.summonT != null ? m.summonT : (m.def.summonCd || 6)) - ctx.dt;
      if (m.summonT <= 0) {
        m.summonT = m.def.summonCd || 6;
        const cap = m.def.minionCap || 4, alive = ctx.countMinions ? ctx.countMinions(m.eid) : 0;
        const cnt = Math.min(Math.max(0, cap - alive), m.def.summonCount || 2);
        for (let i = 0; i < cnt; i++) { const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 34; (ctx.summonMinion || ctx.summon)(m.def.summon || 'zombie_mini', m.x + Math.cos(a) * r, m.y + Math.sin(a) * r, m.eid); }
        if (cnt > 0) ctx.emit({ t: 'summon', x: m.x, y: m.y, c: m.def.projColor });
      }
    },
    // v1.45 — Melma Corrosiva: STRISCIA lenta verso il giocatore; quando è VICINA (entro atkRange) SALTA e SPUTA
    // un ventaglio di BOLLE D'ACIDO ad ALTO danno. Il contatto ravvicinato fa comunque danno (melee). Se non ti vede, VAGA.
    blob(m, ctx) {
      const { p, d, sees } = perceive(m, ctx, m.def.sightRange || 560);
      if (!sees) { if (!investigate(m, ctx)) caccia(m, ctx, 0.72); return; }
      const range = m.def.atkRange || 150;
      if (d > range * 0.72) seek(m, ctx, 1); else stop(m, p);   // striscia fin quando è a tiro, poi si pianta
      if (m.atkT <= 0 && d <= range && ctx.losClear(m.x, m.y, p.x, p.y)) {
        const n = MU.norm(p.x - m.x, p.y - m.y);
        const cnt = m.def.acidCount || 3;
        ctx.spread(m, n.x, n.y, cnt, 0.22, m.def.projSpeed || 205, Math.round(m.dmg * (m.def.acidMult || 1.8)), m.def.projColor || '#a6ff3a');
        ctx.emit({ t: 'acid', e: m.eid, x: m.x, y: m.y }); // → il client fa SALTARE il blob + FX di sputo acido
        m.atkT = m.def.atkCd;
      }
      melee(m, ctx, p, 1, 1); // contatto ravvicinato
    },
    ambush(m, ctx) { const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; return; } const d = MU.dist(m.x, m.y, p.x, p.y); if (!m.awake) { m.mx = m.my = 0; if (d < 150) { m.awake = true; ctx.emit({ t: 'reveal', x: m.x, y: m.y }); } return; } seek(m, ctx, 1); melee(m, ctx, p, 1, 1.6); },
    // v1.32 — Spettro: si avventa rapido in mischia e periodicamente "sfasa" (phase-blink) verso il bersaglio, riemergendo alle sue spalle attraverso gli ostacoli.
    wraith(m, ctx) {
      const p = ctx.nearest(m);
      m.blinkT = (m.blinkT != null ? m.blinkT : MU.rand(2.4, 4.2)) - ctx.dt;
      if (p && m.blinkT <= 0) {
        const d = MU.dist(m.x, m.y, p.x, p.y);
        if (d > 96 && d < 480) {
          const n = MU.norm(p.x - m.x, p.y - m.y);
          const tx = p.x - n.x * 72, ty = p.y - n.y * 72;
          if (!ctx.isWallAt(tx, ty)) { ctx.emit({ t: 'blink_out', x: m.x, y: m.y }); m.x = tx; m.y = ty; ctx.emit({ t: 'blink_in', x: m.x, y: m.y }); m.stun = 0.18; m.blinkT = m.def.blinkCd || MU.rand(3.0, 5.0); return; }
        }
        m.blinkT = 0.6;
      }
      if (m.stun > 0) { m.stun -= ctx.dt; m.mx = m.my = 0; stop(m, p); return; }
      seek(m, ctx, 1.12); melee(m, ctx, p, 1, 1.0);
    },
    // v1.43 — Bruto: tank lento. Quando ti VEDE (senseRange + LOS) e sei a tiro, ALZA le braccia (wind-up
    // telegrafato) e le SCHIANTA a terra: danno ad AREA con forte respinta ("ti scaglia via"). Se non ti vede, VAGA.
    brute(m, ctx) {
      if (m.def.regen) m.hp = Math.min(m.maxHp, m.hp + m.def.regen * ctx.dt);
      // SLAM in corso: resta piantato, alza le braccia e al momento giusto colpisce ad area una sola volta.
      if (m.winding > 0) {
        const p2 = ctx.nearest(m); stop(m, p2); m.windT = (m.windT || 0) + ctx.dt;
        if (!m.slammed && m.windT >= m.winding * (m.def.slamHit || 0.62)) { m.slammed = true; ctx.areaDamage(m.x, m.y, m.def.slamRadius || 96, m.dmg, '#ffb020', m.def.slamKnock || 4.0); ctx.emit({ t: 'slam', x: m.x, y: m.y, r: m.def.slamRadius || 96 }); }
        if (m.windT >= m.winding) { m.winding = 0; }
        return;
      }
      const { p, d, sees } = perceive(m, ctx, m.def.sightRange || 380);
      if (sees) {
        m.facing = Math.atan2(p.y - m.y, p.x - m.x);
        if (d <= m.def.atkRange + p.radius && m.atkT <= 0) { // AVVIA lo slam: alza le braccia (anim client) → schianto
          const dur = m.def.slamWind || 0.72; m.winding = dur; m.windT = 0; m.slammed = false; m.atkT = m.def.atkCd;
          ctx.emit({ t: 'slam_wind', e: m.eid, x: m.x, y: m.y, dur }); stop(m, p); return;
        }
        seek(m, ctx, 1);
      } else if (!investigate(m, ctx)) { caccia(m, ctx, 0.68); }
    },
    flanker(m, ctx) { const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; return; } m.blinkT = (m.blinkT || 0) - ctx.dt; const d = MU.dist(m.x, m.y, p.x, p.y); if (m.blinkT <= 0 && d > 120 && d < 520) { const bx = p.x - Math.cos(p.facing || 0) * 60, by = p.y - Math.sin(p.facing || 0) * 60; if (!ctx.isWallAt(bx, by)) { ctx.emit({ t: 'blink_out', x: m.x, y: m.y }); m.x = bx; m.y = by; m.blinkT = m.def.blinkCd || 3.2; m.stun = 0.35; ctx.emit({ t: 'blink_in', x: m.x, y: m.y }); } } if (m.stun > 0) { m.stun -= ctx.dt; m.mx = m.my = 0; stop(m, p); } else { seek(m, ctx, 1); melee(m, ctx, p, 1, 1.2); } },
    strafer(m, ctx) { const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; return; } const d = MU.dist(m.x, m.y, p.x, p.y); const id = m.def.strafeDist || 210; const toP = MU.norm(p.x - m.x, p.y - m.y); let rad = 0; if (d < id - 30) rad = -1; else if (d > id + 30) rad = 1; if (m.orbit === undefined) m.orbit = Math.random() < 0.5 ? 1 : -1; const tg = { x: -toP.y * m.orbit, y: toP.x * m.orbit }; const n = MU.norm(toP.x * rad + tg.x, toP.y * rad + tg.y); m.mx = n.x * m.speed; m.my = n.y * m.speed; m.facing = Math.atan2(p.y - m.y, p.x - m.x); if (m.atkT <= 0 && d <= m.def.atkRange && ctx.losClear(m.x, m.y, p.x, p.y)) { if ((m.burstN = (m.burstN || 0) + 1) % 2 === 0) { ctx.spread(m, toP.x, toP.y, 3, 0.14, m.def.projSpeed, Math.round(m.dmg * 0.8), m.def.projColor); } else { ctx.shoot(m, toP.x, toP.y, m.def.projSpeed, m.dmg, m.def.projColor); } m.atkT = m.def.atkCd; } },
    // v1.34 — Occhio Vagante: fluttua orbitando a distanza. NON spara: il suo attacco è lo SGUARDO.
    // Se il giocatore è dentro al cono visivo (gazeFov attorno al facing), entro gittata e con LOS libera,
    // applica ripetutamente un debuff (weaken/slow/sunder). Il campo visivo "segue" lo sguardo del bulbo.
    gazer(m, ctx) {
      const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; m.gazeActive = 0; return; }
      if (m.def.gazeCycle) { m.gazeCycleT = (m.gazeCycleT != null ? m.gazeCycleT : m.def.gazeCycle) - ctx.dt; if (m.gazeCycleT <= 0) { m.gazeCycleT = m.def.gazeCycle; var _K = ['weaken', 'slow', 'sunder']; var _gi = _K.indexOf(m.gazeKind); m.gazeKind = _K[((_gi + 1) % 3 + 3) % 3]; } } // v1.49 — eyestalks che ruotano
      const d = MU.dist(m.x, m.y, p.x, p.y);
      const id = m.def.strafeDist || 230; const toP = MU.norm(p.x - m.x, p.y - m.y);
      let rad = 0; if (d < id - 30) rad = -1; else if (d > id + 30) rad = 1;
      if (m.orbit === undefined) m.orbit = Math.random() < 0.5 ? 1 : -1;
      const tg = { x: -toP.y * m.orbit, y: toP.x * m.orbit };
      const n = MU.norm(toP.x * rad + tg.x, toP.y * rad + tg.y);
      m.mx = n.x * m.speed * 0.9; m.my = n.y * m.speed * 0.9;
      m.facing = Math.atan2(p.y - m.y, p.x - m.x);
      const range = m.def.gazeRange || m.def.atkRange || 320;
      const fov = m.def.gazeFov || 0.6;
      const ang = Math.atan2(p.y - m.y, p.x - m.x);
      let diff = Math.abs(((ang - m.facing + Math.PI) % (Math.PI * 2)) - Math.PI);
      // v1.79.2 — MORSO: sotto la distanza ravvicinata il Beholder smette di guardare e attacca. Un
      // nemico che ti debilita ma non ti tocca mai non e' una minaccia: e' un fastidio.
      const morso = m.def.biteRange || 90;
      if (d <= morso + p.radius) {
        m.gazeActive = 0;
        m.atkT = (m.atkT || 0);
        if (m.atkT <= 0) { m.atkT = m.def.biteCd || 1.2; ctx.melee(m, p, Math.round((m.dmg || m.def.dmg) * (m.def.biteMul || 1.4)), 1.2); ctx.emit({ t: 'bite', x: m.x, y: m.y, tx: p.x, ty: p.y, c: m.def.eye }); }
        return;
      }
      const inView = d <= range && diff <= fov && ctx.losClear(m.x, m.y, p.x, p.y);
      if (inView) {
        if (!m.gazeKind) m.gazeKind = ['weaken', 'slow', 'sunder'][(Math.random() * 3) | 0];
        m.gazeActive = 1; m.gazeTx = p.x; m.gazeTy = p.y;
        m.gazeTick = (m.gazeTick || 0) - ctx.dt;
        if (m.gazeTick <= 0) { m.gazeTick = ctx.GAZE_TICK || 0.4; ctx.gaze(m, p, m.gazeKind);
          // il raggio non e' piu' solo un debuff: consuma vita finche' resti esposto
          if (ctx.gazeHit && m.def.gazeDmg) ctx.gazeHit(m, p, Math.max(1, Math.round((m.dmg || m.def.dmg) * m.def.gazeDmg)));
        }
      } else { m.gazeActive = 0; }
    },
    // v1.58 — SENTINELLA (Fungo Sporifero): non si muove MAI. Nessun ciclo di camminata da animare, e in
    // cambio nega il terreno: se ti vede, semina zone di spore dove sei. Punisce chi resta fermo.
    sentry(m, ctx) {
      m.mx = m.my = 0;
      const p = ctx.nearest(m); if (!p) { m.alert = 0; return; }
      const d = MU.dist(m.x, m.y, p.x, p.y);
      const seen = d <= (m.def.sightRange || 340) && ctx.losClear(m.x, m.y, p.x, p.y);
      m.alert = seen ? 1 : 0;
      if (!seen) return;
      m.facing = Math.atan2(p.y - m.y, p.x - m.x);
      if (m.atkT > 0) return;
      m.atkT = m.def.atkCd;
      ctx.emit({ t: 'spore', e: m.eid, x: m.x, y: m.y, c: m.def.projColor });
      const n = m.def.spores || 2;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = i === 0 ? 0 : MU.rand(46, 104);
        ctx.zone(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, m.def.zoneRadius || 62,
          m.def.zoneDelay || 1.05, Math.round(m.dmg * (m.def.zoneMult || 1)), m.def.projColor || '#9fe06a');
      }
    },
    // v1.58 — ROTOLANTE (Sfera d'Ossa): niente gambe, niente camminata. Si carica, poi CORRE in linea retta
    // e rimbalza sui muri finche' non si esaurisce. L'animazione e' una rotazione: la fa il renderer.
    roller(m, ctx) {
      const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; return; }
      const d = MU.dist(m.x, m.y, p.x, p.y);
      if (!m.rolling) {
        m.mx = m.my = 0; m.rollCd = (m.rollCd || 0) - ctx.dt;
        m.facing = Math.atan2(p.y - m.y, p.x - m.x);
        if (m.rollCd > 0) { m.windT = 0; return; }
        // v1.80 — se non ti vede non resta piantato ad aspettare: rotola piano verso di te finche' non ti trova.
        if (d > (m.def.sightRange || 470) || !ctx.losClear(m.x, m.y, p.x, p.y)) { m.windT = 0; caccia(m, ctx, 0.55); return; }
        if (!m.windT) ctx.emit({ t: 'roll_wind', e: m.eid, x: m.x, y: m.y, dur: m.def.rollWind || 0.62 });
        m.windT = (m.windT || 0) + ctx.dt;
        if (m.windT >= (m.def.rollWind || 0.62)) {
          const n = MU.norm(p.x - m.x, p.y - m.y);
          m.rolling = 1; m.windT = 0; m.rollLeft = m.def.rollTime || 2.3; m.rvx = n.x; m.rvy = n.y;
          ctx.emit({ t: 'roll_go', e: m.eid, x: m.x, y: m.y });
        }
        return;
      }
      const sp = m.speed * (m.def.rollSpeed || 3.1);
      const step = sp * ctx.dt + m.radius * 0.9;
      if (ctx.isWallAt(m.x + m.rvx * step, m.y)) { m.rvx = -m.rvx; ctx.emit({ t: 'roll_hit', x: m.x, y: m.y }); }
      if (ctx.isWallAt(m.x, m.y + m.rvy * step)) { m.rvy = -m.rvy; ctx.emit({ t: 'roll_hit', x: m.x, y: m.y }); }
      m.mx = m.rvx * sp; m.my = m.rvy * sp; m.facing = Math.atan2(m.rvy, m.rvx);
      if (d <= m.def.atkRange + p.radius && m.atkT <= 0) { ctx.melee(m, p, m.dmg, m.def.rollKnock || 3.2); m.atkT = m.def.atkCd; }
      m.rollLeft -= ctx.dt;
      if (m.rollLeft <= 0) { m.rolling = 0; m.rollCd = m.def.rollCd || 1.5; }
    },
    // v1.61 — NUGOLO (Nugolo di Pipistrelli): insegue ONDEGGIANDO. Al vettore di inseguimento somma una
    // componente PERPENDICOLARE sinusoidale, poi rinormalizza: la velocita' resta quella, ma la traiettoria
    // e' una serpentina — difficile da colpire in linea retta senza guidare il tiro.
    flock(m, ctx) {
      const { p, d, sees } = perceive(m, ctx, m.def.sightRange || 620);
      if (!sees) { if (!investigate(m, ctx)) caccia(m, ctx, 0.9); return; }
      seek(m, ctx, 1);
      if (m.wv == null) m.wv = Math.random() * 6.283;      // fase iniziale casuale: due nugoli non ondeggiano uguale
      m.wv += ctx.dt * (m.def.weave || 2.7);
      const s = Math.sin(m.wv) * (m.def.weaveAmp || 0.62) * (d < 90 ? 0.35 : 1);   // a contatto smette di ballare
      const n = MU.norm(m.mx - m.my * s, m.my + m.mx * s);
      m.mx = n.x * m.speed; m.my = n.y * m.speed;
      if (n.x || n.y) m.facing = Math.atan2(n.y, n.x);
      melee(m, ctx, p, 1, 0.35);
    },
    // v1.61 — FUOCO FATUO: rotta diretta sul giocatore SENZA pathfinding e senza linea di vista — attraversa
    // i muri (il movimento senza collisione e' in Room.updateMonsters, def.phasing). Si ferma a distanza di
    // drenaggio e succhia vita; dentro la roccia accelera e non attacca.
    drifter(m, ctx) {
      const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; return; }
      const d = MU.dist(m.x, m.y, p.x, p.y);
      const range = m.def.atkRange || 96;
      const inWall = ctx.isWallAt(m.x, m.y);
      const n = MU.norm(p.x - m.x, p.y - m.y);
      m.facing = Math.atan2(n.y, n.x);
      m.phased = inWall ? 1 : 0;
      const sp = m.speed * (inWall ? 1.7 : 1);
      if (inWall || d > range * 0.72) { m.mx = n.x * sp; m.my = n.y * sp; } else { m.mx = m.my = 0; }
      if (inWall) return;
      if (d <= range + p.radius && m.atkT <= 0) {
        m.atkT = m.def.atkCd;
        ctx.melee(m, p, m.dmg, 0.2);
        m.hp = Math.min(m.maxHp, m.hp + Math.round(m.dmg * (m.def.leech || 0.9)));
        ctx.emit({ t: 'drain', e: m.eid, x: m.x, y: m.y, tx: p.x, ty: p.y, c: m.def.eye });
      }
    },
    summoner(m, ctx) { const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; return; } const d = MU.dist(m.x, m.y, p.x, p.y); if (d < m.def.atkRange * 0.5) flee(m, ctx, 0.85); else if (d > m.def.atkRange) seek(m, ctx, 0.85); else stop(m, p); m.summonT = (m.summonT || 0) - ctx.dt; if (m.summonT <= 0) { m.summonT = m.def.summonCd || 6.5; for (let i = 0; i < (m.def.summonCount || 3); i++) { const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 40; ctx.summon(m.def.summon || 'skeleton', m.x + Math.cos(a) * r, m.y + Math.sin(a) * r); } ctx.emit({ t: 'summon', x: m.x, y: m.y }); } m.shieldT = (m.shieldT || 0) - ctx.dt; if (m.shieldT <= 0) { m.shieldT = m.def.shieldCd || 8; m.shielded = m.def.shieldTime || 3; ctx.emit({ t: 'shield', x: m.x, y: m.y }); } if (m.shielded > 0) m.shielded -= ctx.dt; m.zoneT = (m.zoneT || MU.rand(3, 5)) - ctx.dt; if (m.zoneT <= 0 && d <= m.def.atkRange) { ctx.zone(p.x, p.y, 66, 1.0, m.dmg * 1.3, m.def.projColor); m.zoneT = MU.rand(4.5, 7); } if (m.atkT <= 0 && d <= m.def.atkRange && ctx.losClear(m.x, m.y, p.x, p.y)) { const n = MU.norm(p.x - m.x, p.y - m.y); ctx.shoot(m, n.x, n.y, m.def.projSpeed, m.dmg, m.def.projColor); m.atkT = m.def.atkCd; } },
    boss_warlord(m, ctx) { const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; return; } const e = m.hp / m.maxHp <= (m.def.enrageAtHp || 0.5); m.summonT = (m.summonT || 3) - ctx.dt; if (m.summonT <= 0) { m.summonT = m.def.summonCd || 7; for (let i = 0; i < (m.def.summonCount || 4); i++) { const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 50; ctx.summon(m.def.summon || 'skeleton', m.x + Math.cos(a) * r, m.y + Math.sin(a) * r); } ctx.emit({ t: 'summon', x: m.x, y: m.y }); } seek(m, ctx, e ? (m.def.enrageSpeed || 1.7) : 1.1); const d = MU.dist(m.x, m.y, p.x, p.y); if (d <= m.def.atkRange && m.atkT <= 0) { ctx.areaDamage(m.x, m.y, m.def.slamRadius || 90, m.dmg * (e ? 1.5 : 1), '#ff5252', 2.6); m.atkT = m.def.atkCd; ctx.emit({ t: 'slam', x: m.x, y: m.y, r: m.def.slamRadius || 90 }); } },
    boss_lich(m, ctx) { const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; return; } const d = MU.dist(m.x, m.y, p.x, p.y); if (d < 260) flee(m, ctx, 0.9); else if (d > m.def.atkRange) seek(m, ctx, 0.9); else stop(m, p); m.summonT = (m.summonT || 2) - ctx.dt; if (m.summonT <= 0) { m.summonT = m.def.summonCd || 5; for (let i = 0; i < (m.def.summonCount || 5); i++) { const a = Math.random() * Math.PI * 2, r = 50 + Math.random() * 50; ctx.summon(m.def.summon || 'skeleton', m.x + Math.cos(a) * r, m.y + Math.sin(a) * r); } ctx.emit({ t: 'summon', x: m.x, y: m.y }); } m.shieldT = (m.shieldT || 4) - ctx.dt; if (m.shieldT <= 0) { m.shieldT = m.def.shieldCd || 7; m.shielded = m.def.shieldTime || 3.5; ctx.emit({ t: 'shield', x: m.x, y: m.y }); } if (m.shielded > 0) m.shielded -= ctx.dt; m.novaT = (m.novaT || 3) - ctx.dt; if (m.novaT <= 0) { m.novaT = 5.5; for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; ctx.shoot(m, Math.cos(a), Math.sin(a), m.def.projSpeed * 0.8, m.dmg * 0.7, m.def.projColor); } ctx.emit({ t: 'nova', x: m.x, y: m.y }); } if (m.atkT <= 0 && d <= m.def.atkRange && ctx.losClear(m.x, m.y, p.x, p.y)) { const n = MU.norm(p.x - m.x, p.y - m.y); ctx.shoot(m, n.x, n.y, m.def.projSpeed, m.dmg, m.def.projColor); m.atkT = m.def.atkCd; } },
    boss_dragon(m, ctx) {
      const p = ctx.nearest(m); if (!p) { m.mx = m.my = 0; return; }
      const d = MU.dist(m.x, m.y, p.x, p.y); m.phase = m.phase || 'chase'; m.phaseT = (m.phaseT || 0) - ctx.dt;
      const mega = !!m.def.mega; const enraged = mega && m.hp / m.maxHp <= (m.def.enrageAtHp || 0.4); const spd = enraged ? 1.4 : 1;
      if (m.phase === 'chase') { if (d > 220) seek(m, ctx, spd); else stop(m, p);
        if (m.phaseT <= 0) { const r = Math.random(); if (r < 0.36) { m.phase = 'breath'; m.phaseT = 1.4; m.windup = 0.55; ctx.emit({ t: 'boss_tell', x: m.x, y: m.y, k: 'breath' }); } else if (r < 0.68) { m.phase = 'meteor'; m.phaseT = 2.2; m.meteorT = 0; ctx.emit({ t: 'boss_tell', x: m.x, y: m.y, k: 'meteor' }); } else if (mega && r < 0.84) { m.phase = 'nova'; m.phaseT = 0.7; m.windup = 0.5; ctx.emit({ t: 'boss_tell', x: m.x, y: m.y, k: 'nova' }); } else { m.phase = 'sweep'; m.phaseT = 0.9; m.windup = 0.5; ctx.emit({ t: 'boss_tell', x: m.x, y: m.y, k: 'sweep' }); } } }
      else if (m.phase === 'breath') { stop(m, p); if (m.windup > 0) m.windup -= ctx.dt; else { const base = Math.atan2(p.y - m.y, p.x - m.x); const arc = enraged ? 3 : 2; for (let k = -arc; k <= arc; k++) { const a = base + k * 0.11; ctx.shoot(m, Math.cos(a), Math.sin(a), m.def.projSpeed, m.dmg * 0.55, m.def.projColor); } if (m.phaseT <= 0) { m.phase = 'chase'; m.phaseT = enraged ? 1.0 : 1.6; } } }
      else if (m.phase === 'meteor') { stop(m, p); m.meteorT -= ctx.dt; if (m.meteorT <= 0) { m.meteorT = enraged ? 0.18 : 0.28; ctx.meteor(p.x + (Math.random() - 0.5) * 340, p.y + (Math.random() - 0.5) * 340, mega ? 74 : 64, m.dmg * 1.05); } if (m.phaseT <= 0) { m.phase = 'chase'; m.phaseT = 1.6; } }
      else if (m.phase === 'nova') { stop(m, p); if (m.windup > 0) m.windup -= ctx.dt; else { for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; ctx.shoot(m, Math.cos(a), Math.sin(a), m.def.projSpeed * 0.85, m.dmg * 0.6, m.def.projColor); } ctx.emit({ t: 'nova', x: m.x, y: m.y }); m.phase = 'chase'; m.phaseT = 1.4; } }
      else if (m.phase === 'sweep') { stop(m, p); if (m.windup > 0) m.windup -= ctx.dt; else { ctx.areaDamage(m.x, m.y, mega ? 180 : 150, m.dmg * 1.3, '#ff6a1f', 3.4); ctx.emit({ t: 'slam', x: m.x, y: m.y, r: mega ? 180 : 150 }); m.phase = 'chase'; m.phaseT = 1.4; } }
    },
  };
  function update(mon, ctx) {
    mon.atkT = (mon.atkT || 0) - ctx.dt;
    if (mon.stun > 0 && mon.def.ai !== 'flanker') { mon.stun -= ctx.dt; mon.mx = mon.my = 0; return; }
    // v1.80 — TETTO ALLA FOLLA: solo i piu' vicini si fanno sotto (Room assegna mon.impegnato), gli
    // altri aspettano il turno all'anello. Non si applica a chi e' immobile per mestiere, ai boss, a
    // chi ti vede, e a chi e' in mezzo a un'azione gia' partita (rotolata, slam, balzo): interromperla
    // a meta' si vedrebbe.
    const azione = mon.rolling || mon.winding > 0 || mon.lunge > 0;
    if (mon.impegnato === 0 && !mon.def.immobile && !mon.def.boss && !azione && !vedeIl(mon, ctx)) { attesa(mon, ctx); return; }
    (behaviors[mon.def.ai] || behaviors.swarm)(mon, ctx);
  }
  return { update, behaviors, caccia, wander, attesa };
});
