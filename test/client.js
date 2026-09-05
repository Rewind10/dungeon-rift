/* client.js — smoke test dell'INTERFACCIA con un DOM finto (v1.51).
   simulate.js copre il server; questo copre hud.js, che finora non era testato da nulla.
   Non serve un browser: si stuba il minimo di document/window e si verifica che il codice giri
   e produca il DOM atteso (barra dei poteri attivi, 3 carte potere, tetto delle statistiche, Emporio nascosto). */
const fs = require('fs'), path = require('path'); const ROOT = path.join(__dirname, '..') + path.sep;
const nodes = {};
function mkEl(id) {
  const el = { id, className: '', _html: '', textContent: '', style: { setProperty() {}, }, dataset: {}, children: [],
    classList: { _s: new Set(['hidden']), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c, v) { v === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c)) : (v ? this._s.add(c) : this._s.delete(c)); }, contains(c) { return this._s.has(c); } },
    appendChild(c) { this.children.push(c); }, removeChild(c) { this.children = this.children.filter(x => x !== c); },
    querySelector() { return mkEl('q'); }, setAttribute() {}, get firstChild() { return this.children[0]; } };
  // innerHTML fedele: assegnarlo azzera i figli, come nel DOM vero
  Object.defineProperty(el, 'innerHTML', { get() { return el._html; }, set(v) { el._html = v; el.children = []; } });
  return el;
}
global.document = { getElementById: id => (nodes[id] = nodes[id] || mkEl(id)), createElement: () => mkEl('new'), querySelector: () => mkEl('q') };
global.window = { GAME: {} };
global.setTimeout = () => {}; global.clearTimeout = () => {};
for (const f of ['constants', 'mathutils', 'monsters', 'heroes', 'loot', 'gear', 'levels', 'potions', 'bounties', 'mapgen']) {
  const src = fs.readFileSync(ROOT + 'shared/' + f + '.js', 'utf8');
  new Function('self', 'window', 'module', src)(window, window, undefined);
}
new Function('window', 'document', 'setTimeout', 'clearTimeout', fs.readFileSync(ROOT + 'public/js/hud.js', 'utf8'))(window, document, () => {}, () => {});
const HUD = window.HUD, L = window.GAME.Loot, C = window.GAME.Constants;
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ FAIL ') + m); if (!c) fails++; };

// 1) le carte attive — v1.73: non piu' una barra di gettoni ma le caselle del box del personaggio
HUD.setActiveBoons([
  { id: 'execute', icon: '🗡️', name: 'Colpo di Grazia', rarity: 'epic', n: 2, desc: 'esegue', on: 1 },
  { id: 'aegis', icon: '🧿', name: 'Egida Ostinata', rarity: 'rare', n: 1, desc: 'para', on: 1 },
  { id: 'headhunter', icon: '🎯', name: 'Cacciatore di Teste', n: 1, syn: 1, desc: 'sinergia' },
]);
const bar = document.getElementById('heroCards');
ok((bar.innerHTML.match(/cchip/g) || []).length === window.GAME.Constants.MAX_CARDS, 'le caselle sono sempre ' + window.GAME.Constants.MAX_CARDS);
ok((bar.innerHTML.match(/cchip empty/g) || []).length === 2, 'tre carte accese lasciano due caselle vuote');
ok(bar.innerHTML.includes('×2'), 'il moltiplicatore ×2 compare');
ok(bar.innerHTML.includes('syn'), 'la sinergia e evidenziata');
HUD.setActiveBoons([]);
ok((bar.innerHTML.match(/cchip empty/g) || []).length === window.GAME.Constants.MAX_CARDS, 'senza carte le caselle restano, tutte vuote');

// 2) v1.79 — il menu: quattro abilita' dello scaglione, statistiche con tetto, emporio assente
const boons = L.offerteScaglione('ladro', 'rare', {}).map(b => ({ id: b.id, name: b.name, icon: b.icon, rarity: b.rarity, hero: b.hero, desc: 'x', owned: 0, max: b.max }));
HUD.setBoons({ boons, picked: false, tier: 'rare', tierName: 'Raro', tierColor: '#3aa0ff', scaglione: 2, tot: 4, resta: 1, liv: 6 }, () => {});
HUD.setStats({ xp: 500, level: 6, rankName: 'Predone', points: 5, wave: 6, stats: L.XP_STATS.map((s, i) => { const lvl = i === 0 ? L.STAT_MAX_LEVEL : 2; const maxed = lvl >= L.STAT_MAX_LEVEL; return { id: s.id, name: s.name, icon: s.icon, color: s.color, desc: s.desc, cost: maxed ? 0 : L.statCost(s.base, lvl), lvl, max: L.STAT_MAX_LEVEL, maxed }; }) }, () => {}, () => {});
ok(document.getElementById('boonCards').children.length === 4, 'il menu disegna le quattro abilita dello scaglione');
ok(String(document.getElementById('boonSub').innerHTML).indexOf('Raro') > 0, 'e dice di quale scaglione si tratta');
const cards = document.getElementById('upgradeCards').children;
ok(cards.length === L.XP_STATS.length, 'una carta per statistica');
ok(cards[0].className.includes('maxed') && cards[0].innerHTML.includes('MAX'), 'la statistica al tetto e marcata MAX');
ok(cards[1].innerHTML.includes('Lv.2/' + L.STAT_MAX_LEVEL), 'le altre mostrano Lv.x/12');
ok(document.getElementById('gearSection').classList.contains('hidden'), 'la sezione Emporio resta nascosta senza dati equipaggiamento');
// 3) v1.67 — pannello del FABBRO: catalogo per classe, una riga per slot
const G = window.GAME.Gear;
const gearPayload = (heroId, coins, indosso) => ({ coins, near: 1, slots: G.slotsFor(heroId).map(slot => ({
  slot, name: G.SLOT_NAME[slot], icon: G.SLOT_ICON[slot],
  items: G.itemsFor(heroId, slot).map(it => ({ id: it.id, name: it.name, desc: it.desc, color: it.color, rank: it.rank, cost: it.cost, rarity: G.rarityOf(it), owned: (indosso || {})[slot] === it.id ? 1 : 0 })) })) });
let comprato = null;
HUD.showGear(gearPayload('guerriero', 300, G.startingGear('guerriero')), (id) => { comprato = id; });
const gw = document.getElementById('gearNpcCards');
ok(gw.children.length === 3, 'il guerriero vede tre slot (arma, armatura, scudo)');
const righe = gw.children.map(b => b.children.filter(c => c.className === 'gslot-row')[0]).filter(Boolean);
ok(righe.length === 3, 'ogni slot ha la sua riga di oggetti');
ok(righe[0].children.length === 3, 'lo slot arma mostra le tre armi del guerriero');
const carte = righe[0].children;
ok(carte[0].className.includes('maxed') && carte[0].innerHTML.includes('IN USO'), 'l oggetto indosso e marcato IN USO');
ok(carte[1].innerHTML.includes('Spadone') && carte[1].innerHTML.includes('230'), 'lo spadone mostra nome e prezzo');
ok(!carte[1].className.includes('disabled'), 'con 300 monete lo spadone e acquistabile');
ok(carte[2].className.includes('disabled'), 'l alabarda (470) non e acquistabile con 300 monete');
carte[1].onclick(); ok(comprato === 'gue_spadone', 'il clic manda l id dell oggetto, non lo slot');
carte[0].onclick(); ok(comprato === 'gue_spadone', 'cliccare l oggetto gia indosso non ricompra nulla');
HUD.hideGear();
HUD.showGear(gearPayload('mago', 1000, G.startingGear('mago')), () => {});
ok(document.getElementById('gearNpcCards').children.length === 2, 'il mago vede due soli slot: niente scudo, niente calzature');


// 4) v1.68 — SNAPSHOT MAGRO: il giro completo server → rete → client.
// E' il controllo che conta davvero su questa modifica: se la ricostruzione lato client perde un campo,
// in partita si vedrebbero mostri senza tipo o barre della vita sbagliate, e nessun test del server
// se ne accorgerebbe. Qui si prende una stanza VERA, le si chiede la sequenza di snapshot magri che
// manderebbe in rete, li si passa a Net._reidrata e si confronta record per record con lo snapshot PIENO
// dello stesso identico istante.
{
  const { Room } = require(ROOT + 'server/Room.js');
  const Waves = require(ROOT + 'shared/waves.js');
  new Function('window', 'performance', 'WebSocket', 'location', 'setInterval',
    fs.readFileSync(ROOT + 'public/js/net.js', 'utf8'))(window, { now: () => 0 }, function () {}, { protocol: 'http:', host: 'x' }, () => {});
  const Net = window.Net;
  const room = new Room('rete'); const p = room.addPlayer('a', { send() {} }, 'A', 'guerriero');
  room.startGame(); room.phase = C.MSG ? 'combat' : 'combat'; room.wave = 9;
  for (let i = 0; i < 12; i++) { const q = room.randomSpawnPos(); room.spawnMonster(i % 3 === 0 ? 'darkmage' : 'skeleton', q.x, q.y, { scaling: Waves.scaling(9, 1) }); }
  const confronta = (etichetta) => {
    const pieno = room.snapshot();                       // la verita'
    const magro = Net._reidrata(room.snapshot(true));    // cio' che il client ricostruisce
    let differenze = [];
    for (const atteso of pieno.mon) {
      const avuto = magro.mon.find(m => m.e === atteso.e);
      if (!avuto) { differenze.push('mostro ' + atteso.e + ' mancante'); continue; }
      for (const k of Object.keys(atteso)) if (JSON.stringify(atteso[k]) !== JSON.stringify(avuto[k])) differenze.push('mostro ' + atteso.e + '.' + k + ': ' + atteso[k] + ' != ' + avuto[k]);
    }
    for (const atteso of pieno.players) {
      const avuto = magro.players.find(x => x.i === atteso.i);
      if (!avuto) { differenze.push('giocatore ' + atteso.i + ' mancante'); continue; }
      for (const k of Object.keys(atteso)) if (JSON.stringify(atteso[k]) !== JSON.stringify(avuto[k])) differenze.push('giocatore ' + atteso.i + '.' + k + ': ' + atteso[k] + ' != ' + avuto[k]);
    }
    ok(differenze.length === 0, etichetta + (differenze.length ? ' → ' + differenze.slice(0, 3).join(' · ') : ''));
  };
  confronta('primo snapshot: il client ricostruisce tutto');
  for (let i = 0; i < 20; i++) room.update(1 / C.TICK_RATE);
  confronta('dopo 20 tick: la parte immutabile e ancora quella giusta');
  // un mostro nuovo entra in scena
  const q = room.randomSpawnPos(); room.spawnMonster('occhio', q.x, q.y, { scaling: Waves.scaling(9, 1) });
  confronta('un mostro comparso dopo viene ricostruito');
  // un mostro muore: la cache non deve trattenerlo
  const vittima = room.monsters[0]; room.killMonster(vittima, null); room.monsters = room.monsters.filter(m => !m.dead);
  Net._reidrata(room.snapshot(true));
  ok(!Net._statMon.has(vittima.eid), 'la cache lascia andare i mostri morti');
  // i flag transitori NON devono restare accesi da un frame all'altro
  const vivo = room.monsters[0]; vivo.hitFlash = 0.1;
  ok(Net._reidrata(room.snapshot(true)).mon.find(m => m.e === vivo.eid).fl === 1, 'un flag acceso arriva');
  vivo.hitFlash = 0;
  ok(Net._reidrata(room.snapshot(true)).mon.find(m => m.e === vivo.eid).fl === 0, 'e quando si spegne torna 0, non resta acceso');
}


// 5) v1.70 — pannello del RANGO: le carte generiche non ci sono piu', resta il bivio del rango V
{
  const LV = window.GAME.Levels;
  ok(Object.keys(LV.CARD_BY_ID).length === 0, 'non ci sono piu carte di rango da mostrare');
  let scelto = null;
  HUD.setRank({ spec: 1, rank: 5, title: 'SCEGLI LA TUA STRADA',
    cards: LV.specsFor('mago').map(s => ({ id: s.id, name: s.name, icon: s.icon, color: s.color, desc: s.desc, abilita: s.abilita })) }, (id) => { scelto = id; });
  const rsec = document.getElementById('rankSection'), rrow = document.getElementById('rankCards');
  ok(!rsec.classList.contains('hidden'), 'al rango V il pannello compare');
  ok(rrow.children.length === 2, 'le strade sono due');
  ok(rrow.className === 'spec', 'e usa la disposizione a due colonne');
  ok(rrow.children[0].innerHTML.includes('SPECIALIZZAZIONE'), 'sono marcate come specializzazione');
  ok(rrow.children[0].innerHTML.includes('Meteora') || rrow.children[1].innerHTML.includes('Meteora'), 'e mostrano l abilita che arrivera');
  rrow.children[0].onclick();
  ok(scelto === LV.specsFor('mago')[0].id, 'il clic manda l id della specializzazione');
  HUD.setRank({ spec: 0, rank: 2, title: 'x', cards: [] }, () => {});
  ok(document.getElementById('rankSection').classList.contains('hidden'), 'senza carte da offrire il pannello resta nascosto');
  // il negozio parla di PUNTI, non piu di XP
  HUD.setStats({ points: 3, level: 7, rankName: 'Veterano', xp: 2500,
    stats: L.XP_STATS.map((s, i) => ({ id: s.id, name: s.name, icon: s.icon, color: s.color, desc: s.desc, lvl: i, max: 12, maxed: false, cost: i < 4 ? 1 : 2 })) }, () => {}, () => {});
  ok(String(document.getElementById('shopXp').textContent) === '3', 'la cifra grande sono i punti, non la XP');
  ok(String(document.getElementById('shopLevel').textContent) === '7', 'accanto c e il livello');
  ok(document.getElementById('shopRank').textContent === 'Veterano', 'e il nome del rango');
  const uc = document.getElementById('upgradeCards').children;
  ok(uc[0].innerHTML.includes('1 punto') && !uc[0].innerHTML.includes('XP'), 'il prezzo e in punti e non nomina piu la XP');
}

// ============================================================================================
// v1.64 — GUARDIA DI PRESTAZIONE SUL RENDERER
// Il gioco singhiozzava con molti nemici. Profilato: il frame MEDIANO stava bene (6,5ms) ma il
// peggiore arrivava a 39,7ms, e la causa erano 558 gradienti creati a OGNI frame (33.500 al
// secondo) — allocazioni che il garbage collector deve poi ripulire, tutte insieme.
// Questo test conta le allocazioni con un contesto 2D finto: e' l'unico modo per accorgersi di
// una regressione senza aprire un browser. Se qualcuno rimette un createGradient dentro un ciclo
// per-nemico, qui salta fuori subito invece che tra sei mesi giocando.
// ============================================================================================
(function testRenderPerf() {
  console.log('\n[CLIENT 2] Renderer — allocazioni per frame (v1.64)');
  const counters = { rad: 0, lin: 0 };
  const grad = { addColorStop() {} };
  const mkCtx = () => {
    const base = {
      canvas: { width: 1280, height: 720 },
      createRadialGradient() { counters.rad++; return grad; },
      createLinearGradient() { counters.lin++; return grad; },
      createPattern() { return null; },
      measureText() { return { width: 10 }; },
      getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(Math.max(4, (w | 0) * (h | 0) * 4)), width: w | 0, height: h | 0 }; },
      createImageData(w, h) { const ww = (w && w.width) ? w.width : (w | 0), hh = (w && w.height) ? w.height : (h | 0); return { data: new Uint8ClampedArray(Math.max(4, ww * hh * 4)), width: ww, height: hh }; },
    };
    return new Proxy(base, {
      get(t, k) { if (k in t) return t[k]; if (typeof k !== 'string') return undefined; return (t[k] = function () {}); },
      set(t, k, v) { t[k] = v; return true; },
    });
  };
  const mkCanvas = () => { const c = { width: 1, height: 1, style: {}, _ctx: null }; c.getContext = () => (c._ctx = c._ctx || mkCtx()); return c; };
  const prevCreate = document.createElement;
  document.createElement = (tag) => (tag === 'canvas' ? mkCanvas() : prevCreate(tag));
  global.Image = function () { this.onload = null; this.onerror = null; };
  window.innerWidth = 1280; window.innerHeight = 720; window.devicePixelRatio = 1;
  window.addEventListener = () => {};
  window.localStorage = { getItem() { return null; }, setItem() {} };
  window.performance = { now: () => Date.now() };
  // renderer.js usa innerWidth/innerHeight nudi (globali del browser): vanno passati come parametri
  new Function('window', 'document', 'Image', 'localStorage', 'performance', 'requestAnimationFrame', 'innerWidth', 'innerHeight',
    fs.readFileSync(ROOT + 'public/js/renderer.js', 'utf8'))(window, document, global.Image, window.localStorage, window.performance, () => {}, 1280, 720);
  const R = window.Renderer;
  ok(!!R, 'il renderer si carica con un contesto 2D finto');
  R.init(mkCanvas());
  const MG = window.GAME.MapGen || window.GAME.Mapgen;
  ok(!!MG, 'il generatore di mappe e disponibile al test');
  const map = MG.generate(4242, 10);
  R.setMap(map);

  const TYPES = ['skeleton', 'slime', 'darkmage', 'spore_fungus', 'bone_roller', 'bat_swarm', 'wisp', 'occhio'];
  const N = 60;
  const cx = map.spawn.x, cy = map.spawn.y;
  const mon = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 6.283, r = 60 + (i % 8) * 55;
    mon.push({ e: i, t: TYPES[i % TYPES.length], x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, f: a, hp: 50, mhp: 80, el: 0, b: 0, mg: 0, tr: 0, fl: 0, sh: 0, ps: 0, eg: 0 });
  }
  const bul = []; for (let i = 0; i < 30; i++) { const a = (i / 30) * 6.283; bul.push({ e: i, x: cx + Math.cos(a) * 150, y: cy + Math.sin(a) * 150, r: 5, c: '#9fe0ff' }); }
  const me = { i: 'a', h: 'enforcer', x: cx, y: cy, a: 0.5, hp: 90, mhp: 130, d: 0, dn: 0, lv: 3, tb: [], eg: 0.5 };
  const world = { players: [me], me, mon, bul, orbs: [], met: [], crates: [], wdrops: [], xp: [], coins: [], items: [], zones: [] };

  for (let i = 0; i < 6; i++) R.render(1 / 60, world);   // riscaldamento: la cache si riempie
  counters.rad = 0; counters.lin = 0;
  const FRAMES = 10;
  for (let i = 0; i < FRAMES; i++) R.render(1 / 60, world);
  const perFrame = (counters.rad + counters.lin) / FRAMES;
  console.log('     ' + N + ' nemici in campo -> ' + perFrame.toFixed(0) + ' gradienti per frame (' + (perFrame * 60).toFixed(0) + '/s a 60fps)');
  ok(perFrame < 240, 'meno di 240 gradienti per frame con ' + N + ' nemici (misurato ' + perFrame.toFixed(0) + ' — prima della v1.64 erano oltre 400)');
  ok(perFrame / N < 3.2, 'meno di 3,2 gradienti per nemico per frame (misurato ' + (perFrame / N).toFixed(2) + ')');

  // il Nugolo dev'essere COTTO: i suoi fotogrammi esistono e non si ridisegnano a mano
  const FR = R._batFrames('#c9a0ff');
  ok(!!FR && FR.frames.length >= 8, 'i fotogrammi del Nugolo sono precotti (' + (FR ? FR.frames.length : 0) + ' pose)');
  const before = counters.rad + counters.lin;
  R._batFrames('#c9a0ff');
  ok((counters.rad + counters.lin) === before, 'richiederli di nuovo NON ricuoce niente (sono in cache)');

  // lo scarto fuori inquadratura: un mostro lontanissimo non deve costare nulla
  const far = { e: 999, t: 'skeleton', x: cx + 9000, y: cy + 9000, f: 0, hp: 50, mhp: 80, el: 0, b: 0, mg: 0, tr: 0, fl: 0, sh: 0, ps: 0 };
  world.mon = [far];
  counters.rad = 0; counters.lin = 0;
  const solo = { players: [me], me, mon: [], bul: [], orbs: [], met: [], crates: [], wdrops: [], xp: [], coins: [], items: [], zones: [] };
  R.render(1 / 60, world); const withFar = counters.rad + counters.lin;
  counters.rad = 0; counters.lin = 0;
  R.render(1 / 60, solo); const without = counters.rad + counters.lin;
  ok(withFar === without, 'un nemico fuori inquadratura non viene disegnato affatto (' + withFar + ' = ' + without + ')');
  document.createElement = prevCreate;
})();


// ===== v1.71 — LA CINTURA E IL BANCO DELL'ERBORISTA =====
// La cintura si disegna dallo STESSO oggetto `me` che arriva nello snapshot: se cambia il formato di
// `bt` lato server, questo test se ne accorge prima che se ne accorga Paolo guardando lo schermo.
(function () {
  const P = window.GAME.Potions;
  HUD.updateBelt({ bt: [[0, 3], [3, 2], [2, 1]], pcd: 0 });
  const belt = document.getElementById('beltBar');
  ok(!belt.classList.contains('hidden'), 'la cintura si mostra quando il giocatore esiste');
  ok((belt.innerHTML.match(/pot-slot/g) || []).length === P.SLOTS, 'tre slot, quanti ne dichiara il catalogo');
  const s0 = document.getElementById('pot0');
  ok(s0.classList.contains('has'), 'lo slot con dentro una pozione e acceso');
  ok(!s0.classList.contains('empty'), 'e non e marcato vuoto');
  ok(String(s0.title).indexOf('Cura') === 0, 'il suggerimento porta il nome della pozione');
  // slot esaurito: assegnato ma senza cariche
  HUD._beltSig = null; HUD.updateBelt({ bt: [[0, 0], 0, 0], pcd: 0 });
  ok(document.getElementById('pot0').classList.contains('empty'), 'lo slot esaurito si spegne pur restando assegnato');
  ok(document.getElementById('pot1').classList.contains('empty'), 'e lo slot mai assegnato pure');
  // senza giocatore la cintura sparisce (schermata di fine partita, lobby)
  HUD.updateBelt(null);
  ok(belt.classList.contains('hidden'), 'senza giocatore la cintura si nasconde');

  // --- il banco ---
  const bel = [{ id: 'p_cura', n: 2 }, { id: 'p_furia', n: 3 }, null];
  const offerta = { coins: 310, max: P.MAX_CHARGES, near: 1, belt: bel,
    list: P.POTIONS.map(it => ({ id: it.id, name: it.name, icon: it.icon, color: it.color, cost: it.cost, desc: it.desc, dur: it.durTxt,
      slot: bel.findIndex(x => x && x.id === it.id) })) };
  let scelto = null, comprato = null;
  HUD._potSel = 1;
  HUD.showPotions(offerta, { pick: (slot, id) => { scelto = [slot, id]; }, buy: (slot) => { comprato = slot; } });
  const panel = document.getElementById('potionPanel');
  ok(!panel.classList.contains('hidden'), 'il banco si apre');
  ok(String(document.getElementById('potionHead').innerHTML).indexOf('310') > 0, 'e dice quante monete hai');
  const row = document.getElementById('potionBelt');
  ok(row.children.length === P.SLOTS, 'tre slot nel banco');
  ok(String(row.children[2].innerHTML).indexOf('vuoto') > 0, 'lo slot senza tipo dice di essere vuoto');
  ok(String(row.children[1].innerHTML).indexOf('piena') > 0, 'lo slot con 3 cariche non offre di comprarne una quarta');
  ok(String(row.children[0].innerHTML).indexOf('+1 carica') > 0, 'quello a meta strada si');
  const cat = document.getElementById('potionCat');
  ok(cat.children.length === P.POTIONS.length, 'il catalogo mostra tutte le pozioni');
  const cura = cat.children[0];
  ok(String(cura.className).indexOf('in') >= 0, 'quella gia in cintura e spenta');
  ok(String(cura.innerHTML).indexOf('slot 1') > 0, 'e dice in quale slot sta');
  ok(!cura.onclick, 'e non si puo cliccare: un tipo per slot');
  const libera = cat.children[1];   // Pelle di Pietra: non e in cintura
  ok(!!libera.onclick, 'una pozione libera si puo scegliere');
  libera.onclick();
  ok(scelto && scelto[0] === 1 && scelto[1] === 'p_pelle', 'e finisce nello slot selezionato');
  ok(String(document.getElementById('potionCatSub').textContent).indexOf('slot 2') > 0, 'il sottotitolo dice a quale slot stai lavorando');
  HUD.hidePotions();
  ok(panel.classList.contains('hidden'), 'e il banco si chiude quando ti allontani');
})();


// ===== v1.72 — LA TAGLIA IN PARTITA E IL BANCO DEL BANDITORE =====
(function () {
  const B = window.GAME.Bounties, G = window.GAME.Gear;
  // la riga in alto a sinistra
  const b = B.istanza('caccia', 6); b.have = 23;
  HUD.updateBounty({ bo: { k: b.k, h: b.have, n: b.n, i: b.icon, c: b.color, t: b.testo } });
  const hud = document.getElementById('bountyHud');
  ok(!hud.classList.contains('hidden'), 'la taglia in corso si vede in partita');
  ok(String(hud.innerHTML).indexOf(String(b.n)) > 0, 'e mostra il bersaglio');
  ok(String(hud.innerHTML).indexOf('23/') > 0, 'e a che punto sei');
  HUD.updateBounty({});
  ok(hud.classList.contains('hidden'), 'senza taglia la riga sparisce');

  // --- il banco, senza taglia accettata ---
  const tre = [B.istanza('specie', 6, 'slime', 'Melma Corrosiva'), B.istanza('elite', 6), B.istanza('casse', 6)];
  let presa = null, assoldato = 0;
  const cbB = { take: (i) => { presa = i; }, hire: () => { assoldato++; } };
  HUD.showBandit({ coins: 180, near: 1, bounty: null,
    merc: { assunto: null, off: { nome: 'Ghisla', hero: 'guerriero', lvl: 4, costo: 170 }, motivo: null },
    offers: tre.map(o => ({ k: o.k, n: o.n, pay: o.pay, nome: o.nome, icon: o.icon, color: o.color, testo: o.testo })) }, cbB);
  const panel = document.getElementById('banditPanel');
  ok(!panel.classList.contains('hidden'), 'il banco si apre');
  ok(String(document.getElementById('banditHead').innerHTML).indexOf('180') > 0, 'e dice quante monete hai');
  const tg = document.getElementById('banditBounty').children[0];
  ok(tg.children.length === 3, 'tre taglie fra cui scegliere');
  ok(String(tg.children[0].innerHTML).indexOf('Melma Corrosiva') > 0, 'il contratto mirato nomina la specie');
  ok(String(tg.children[0].innerHTML).indexOf('alla consegna') > 0, 'e ognuna dice quanto paga');
  tg.children[2].onclick();
  ok(presa === 2, 'cliccarne una la accetta, per indice');

  // --- v1.82: il banco dei mercenari ---
  const bm = document.getElementById('banditMerc');
  ok(bm.children.length === 1, 'al banco c e un candidato per volta');
  const riga0 = bm.children[0].innerHTML;
  ok(String(riga0).indexOf('Ghisla') > 0, 'con il suo nome');
  ok(String(riga0).indexOf('livello 4') > 0, 'e il suo livello');
  ok(String(riga0).indexOf('170') > 0, 'e quanto vuole');
  ok(String(riga0).indexOf('abilit') > 0, 'e dice che non ha abilita');
  ok(String(riga0).indexOf('disabled') < 0, 'con 180 monete il bottone e attivo');
  ok(typeof bm.children[0].onclick === 'function', 'e la riga si puo cliccare');
  bm.children[0].onclick();
  ok(assoldato === 1, 'cliccare assolda');
  // senza monete il bottone e spento
  HUD._bndSig = null;
  HUD.showBandit({ coins: 30, near: 1, bounty: null, offers: [],
    merc: { assunto: null, off: { nome: 'Ghisla', hero: 'guerriero', lvl: 4, costo: 170 }, motivo: null } }, cbB);
  const bmPoco = document.getElementById('banditMerc');
  ok(String(bmPoco.children[0].innerHTML).indexOf('disabled') > 0, 'con 30 monete il bottone e spento');
  ok(typeof bmPoco.children[0].onclick !== 'function', 'e la riga non fa niente');
  // gia assunto: il banco lo ricorda e non ne offre un altro
  HUD._bndSig = null;
  HUD.showBandit({ coins: 900, near: 1, bounty: null, offers: [],
    merc: { assunto: { nome: 'Vesper', hero: 'mago', lvl: 7 }, off: null, motivo: null } }, cbB);
  const bm2 = document.getElementById('banditMerc');
  ok(String(bm2.children[0].innerHTML).indexOf('Vesper') > 0, 'con uno gia al soldo il banco mostra lui');
  ok(String(bm2.children[0].innerHTML).indexOf('assolda') < 0, 'e non se ne puo assoldare un secondo');
  // in multiplayer il banco lo dice e basta
  HUD._bndSig = null;
  HUD.showBandit({ coins: 900, near: 1, bounty: null, offers: [], merc: { assunto: null, off: null, motivo: 'solo' } }, cbB);
  ok(document.getElementById('banditMerc').children.length === 0, 'in multiplayer non si assolda nessuno');
  ok(String(document.getElementById('mercSub').textContent).indexOf('singola') > 0, 'e il banco spiega perche');

  // --- il banco, con la taglia gia accettata ---
  const att = B.istanza('caccia', 6); att.have = 12;
  HUD._bndSig = null;
  HUD.showBandit({ coins: 400, near: 1, offers: [], merc: { assunto: null, off: null, motivo: null },
    bounty: { k: att.k, n: att.n, have: att.have, pay: att.pay, nome: att.nome, icon: att.icon, color: att.color, testo: att.testo } },
    { take: () => {}, hire: () => {} });
  const riga = document.getElementById('banditBounty').children[0];
  ok(String(riga.className).indexOf('att') >= 0, 'con una taglia aperta il banco mostra quella, non le offerte');
  ok(String(riga.innerHTML).indexOf('12 / ') > 0, 'con il conteggio');
  HUD.hideBandit();
  ok(panel.classList.contains('hidden'), 'e si chiude quando ti allontani');

  // --- v1.82 FIX: due personaggi della STESSA classe con tinte diverse non si spartiscono i colori ---
  // La cache dei gradienti era chiusa su 'h_torso|lad|<raggio>': il secondo ladro disegnato riusava il
  // gradiente del primo, cioe' i suoi colori. Con i mercenari il giocatore si e' ritrovato addosso la
  // tinta del compagno. La chiave adesso porta la firma della palette.
  {
    const M = require('../shared/mercenari.js');
    const RR = window.Renderer;
    const pk = (p) => RR._palKey(p);
    ok(pk(null) === '', 'chi non ha tinta ha firma vuota: continua a condividere il gradiente di sempre');
    const tinte = M.TINTE.ladro.map(pk);
    ok(new Set(tinte).size === tinte.length, 'le quattro tinte del ladro hanno quattro firme diverse');
    ok(tinte.every(x => x !== ''), 'e nessuna e vuota: non si confondono con chi non ha tinta');
    for (const cl of ['guerriero', 'mago', 'ladro']) {
      const f = M.TINTE[cl].map(pk);
      ok(new Set(f).size === f.length, cl + ': tinte tutte distinguibili');
      ok(!f.includes(''), cl + ': nessuna tinta produce la chiave di "nessuna tinta"');
    }
    // la chiave completa, quella che finisce davvero nella cache
    const chiave = (cl, r, p) => 'h_torso|' + cl + '|' + r + '|' + pk(p);
    ok(chiave('lad', 16, null) !== chiave('lad', 16, M.TINTE.ladro[0]), 'giocatore e mercenario della stessa classe: due chiavi diverse');
    ok(chiave('lad', 16, M.TINTE.ladro[0]) !== chiave('lad', 16, M.TINTE.ladro[1]), 'due mercenari di tinta diversa: due chiavi diverse');
    ok(chiave('lad', 16, null) === chiave('lad', 16, null), 'e senza tinta la chiave resta stabile');
  }

  // --- il Fabbro deve dire cosa e gia tuo ---
  const card = HUD._gearCard({ id: 'gue_spadone', name: 'Spadone', desc: 'x', color: '#e0a52c', rank: 2, cost: 230,
    rarity: 'uncommon', owned: 0, have: 1 }, 0, () => {});
  ok(String(card.innerHTML).indexOf('GIÀ TUO') > 0, 'un oggetto in magazzino si riequipaggia gratis, e il Fabbro lo scrive');
  ok(String(card.className).indexOf('disabled') < 0, 'e non e spento anche se non hai monete');
})();


// ===== v1.73 — IL BOX DEL PERSONAGGIO E IL TAVOLO DELLA CARTOMANTE =====
(function () {
  const L = window.GAME.Loot, MAXC = window.GAME.Constants.MAX_CARDS;
  const carta = (id, n, on) => { const b = L.BOON_BY_ID[id]; return { id, icon: b.icon, name: b.name, rarity: b.rarity, n, desc: b.desc, on }; };
  // --- il box ---
  HUD.setActiveBoons([carta('ricochet', 3, 1), carta('crit', 2, 1), carta('execute', 1, 1)]);
  HUD.updateHeroBox({ n: 'Paolo', h: 'guerriero', lvl: 12, prg: 0.62, sp: null });
  const box = document.getElementById('heroBox');
  ok(!box.classList.contains('hidden'), 'il box del personaggio si vede');
  ok(String(document.getElementById('heroBoxName').textContent) === 'Paolo', 'con il nome, che non sta piu sopra la testa');
  ok(String(document.getElementById('heroBoxLv').innerHTML).indexOf('Lv.12') >= 0, 'con il livello');
  ok(String(document.getElementById('heroBoxLv').innerHTML).indexOf('Signore delle Lame') > 0, 'e il rango di quel livello (v1.79: al 12 e il quinto titolo)');
  const cards = document.getElementById('heroCards');
  ok((String(cards.innerHTML).match(/cchip/g) || []).length === MAXC, 'e ' + MAXC + ' caselle: anche quelle vuote si vedono');
  ok((String(cards.innerHTML).match(/empty/g) || []).length === 2, 'due caselle libere con tre carte accese');
  ok(String(cards.innerHTML).indexOf('×3') > 0, 'gli esemplari multipli si vedono');
  HUD.updateHeroBox(null);
  ok(box.classList.contains('hidden'), 'senza giocatore il box sparisce');
  // le carte spente NON entrano nel box
  HUD.setActiveBoons([carta('ricochet', 1, 1), carta('giant', 1, 0)]);
  HUD.updateHeroBox({ n: 'Paolo', h: 'guerriero', lvl: 3, prg: 0.1 });
  ok((String(document.getElementById('heroCards').innerHTML).match(/empty/g) || []).length === MAXC - 1,
     'una carta spenta non occupa una casella del box');

  // --- il tavolo ---
  let toccata = null;
  const tutte = [carta('ricochet', 3, 1), carta('crit', 2, 1), carta('execute', 1, 1), carta('spalle', 1, 1), carta('lamasporca', 1, 1), carta('giant', 1, 0)];
  HUD.showSeer({ near: 1, max: MAXC, active: 5, cards: tutte, syn: [{ id: 's', icon: '🔗', name: 'Tempesta', desc: 'x' }] }, (id) => { toccata = id; });
  const panel = document.getElementById('seerPanel');
  ok(!panel.classList.contains('hidden'), 'il tavolo si apre');
  ok(String(document.getElementById('seerHead').innerHTML).indexOf('5') > 0, 'e dice quante ne hai accese');
  ok(String(document.getElementById('seerSub').textContent).indexOf('limite') > 0, 'al limite lo dichiara');
  const w = document.getElementById('seerCards');
  ok(w.children.length === 6, 'elenca tutte le carte, accese e spente');
  ok(String(w.children[0].className).indexOf('on') >= 0, 'le accese sono in cima e marcate');
  const spenta = Array.prototype.slice.call(w.children).find(el => String(el.className).indexOf('lock') >= 0);
  ok(!!spenta, 'con il tetto pieno la spenta e bloccata');
  ok(!spenta.onclick, 'e non si puo cliccare');
  const rim = Array.prototype.slice.call(w.children).find(el => String(el.innerHTML).indexOf('Rimbalzo') > 0);
  ok(!!rim, 'le carte si trovano per nome');
  rim.onclick();
  ok(toccata === 'ricochet', 'cliccare una accesa la manda a spegnere');
  ok(!document.getElementById('seerSyn').classList.contains('hidden'), 'le sinergie attive si vedono');
  // con un posto libero la spenta torna cliccabile
  HUD._seerSig = null;
  HUD.showSeer({ near: 1, max: MAXC, active: 4, cards: tutte, syn: [] }, (id) => { toccata = id; });
  const w2 = document.getElementById('seerCards');
  const libera = Array.prototype.slice.call(w2.children).find(el => String(el.className).indexOf('lock') >= 0);
  ok(!libera, 'con un posto libero nessuna carta e bloccata');
  ok(String(document.getElementById('seerSub').textContent).indexOf('ancora 1') > 0, 'e dice quante ne puoi ancora accendere');
  HUD.hideSeer();
  ok(panel.classList.contains('hidden'), 'e si chiude quando ti allontani');
})();


// ===== v1.74 — IL FOCOLARE DELL'OSTESSA =====
(function () {
  const C = window.GAME.Constants;
  const mostra = (hp, mx, coins) => {
    const manca = Math.max(0, mx - hp), pieno = Math.ceil(manca * C.INN_PER_HP);
    const curabili = Math.min(manca, Math.floor(coins / C.INN_PER_HP));
    HUD._innSig = null;
    HUD.showInn({ near: 1, coins, hp, mx, manca, pieno, curabili, spesa: Math.ceil(curabili * C.INN_PER_HP), perHp: C.INN_PER_HP }, () => { chiesto = true; });
  };
  let chiesto = false;
  // ferito, monete a sufficienza
  mostra(100, 275, 430);
  const panel = document.getElementById('innPanel'), btn = document.getElementById('innBtn');
  ok(!panel.classList.contains('hidden'), 'il focolare si apre');
  ok(String(document.getElementById('innHp').innerHTML).indexOf('100') >= 0, 'mostra la vita che hai');
  ok(String(document.getElementById('innText').innerHTML).indexOf('175') > 0, 'e quanti PV ti mancano');
  ok(String(btn.innerHTML).indexOf('70') > 0, 'il bottone dice quanto costa la cura piena');
  ok(String(btn.className).indexOf('off') < 0, 'ed e cliccabile');
  btn.onclick(); ok(chiesto, 'cliccarlo chiede il riposo');
  // monete corte: cura parziale
  mostra(100, 275, 28);
  ok(String(document.getElementById('innBtn').innerHTML).indexOf('+70 PV') > 0, 'con poche monete offre la cura parziale');
  ok(String(document.getElementById('innBtn').className).indexOf('parz') >= 0, 'e si vede che e parziale');
  // nessuna moneta
  mostra(100, 275, 0);
  ok(String(document.getElementById('innBtn').className).indexOf('off') >= 0, 'senza monete il bottone e spento');
  ok(!document.getElementById('innBtn').onclick, 'e non risponde al clic');
  ok(String(document.getElementById('innText').innerHTML).indexOf('70') > 0, 'ma dice comunque quanto servirebbe');
  // gia al massimo
  mostra(275, 275, 430);
  ok(String(document.getElementById('innBtn').className).indexOf('off') >= 0, 'a PV pieni non c e niente da comprare');
  ok(String(document.getElementById('innText').textContent).indexOf('niente da farti curare') > 0, 'e lo dice chiaramente');
  HUD.hideInn();
  ok(panel.classList.contains('hidden'), 'e si chiude quando ti allontani');
})();


// ===== v1.78 — USCITA DALLA MAPPA RIPULITA, RIEPILOGO, CARTE DAI LIVELLI ====================
(function () {
  console.log('\n-- v1.78: pulsante EXIT, riepilogo di fine livello, carte dai livelli');
  const top = document.getElementById('clearTop'), btn = document.getElementById('exitBtn'), sub = document.getElementById('clearSub');
  const snap = (o) => Object.assign({ wave: 3, mcount: 0, pend: 0, phase: 'combat', wt: 30, wp: 60 }, o);
  // in combattimento non si vede niente
  HUD.updateTop(snap({}), null);
  ok(top.classList.contains('hidden') && btn.classList.contains('hidden'), 'in combattimento il pulsante EXIT non c e');
  // mappa ripulita, in singolo
  HUD.updateTop(snap({ phase: 'cleared', ex: { n: 0, tot: 1, t: 118 } }), null);
  ok(!top.classList.contains('hidden') && !btn.classList.contains('hidden'), 'a mappa ripulita compaiono avviso e pulsante');
  ok(document.getElementById('hud').classList.contains('ripulita'), 'e gli annunci al centro si spostano per non coprire la scritta');
  ok(btn.textContent === 'EXIT', 'il pulsante dice EXIT');
  ok(document.getElementById('boonTitle') !== null, 'il titolo del mazzo ha un id, per poterlo cambiare');
  ok(String(sub.innerHTML).indexOf('EXIT') > 0, 'e la scritta in alto spiega di premerlo');
  ok(String(sub.innerHTML).indexOf('118') > 0, 'dicendo anche fra quanto si esce da soli');
  // premuto: il pulsante passa in attesa
  HUD.exitPremuto();
  ok(btn.classList.contains('attesa'), 'premuto, il pulsante passa in attesa');
  HUD.updateTop(snap({ phase: 'cleared', ex: { n: 1, tot: 3, t: 90 } }), null);
  ok(String(btn.textContent).indexOf('1/3') > 0, 'in cooperativa dice a quanti si sta aspettando');
  // fase cambiata: tutto sparisce e il pulsante torna come nuovo
  HUD.updateTop(snap({ phase: 'shop' }), null);
  ok(top.classList.contains('hidden') && btn.classList.contains('hidden'), 'finita l attesa spariscono');
  ok(!document.getElementById('hud').classList.contains('ripulita'), 'e gli annunci tornano al loro posto');
  HUD.updateTop(snap({ phase: 'cleared', ex: { n: 0, tot: 1, t: 120 } }), null);
  ok(btn.textContent === 'EXIT' && !btn.classList.contains('attesa'), 'e all ondata dopo il pulsante e di nuovo premibile');
  // e il contatore di combo non deve stare sopra alla scritta
  HUD.updateTop(snap({ phase: 'combat', ex: null }), { cmb: 9, cmx: 1.4, cmt: 0.5, hp: 10, mhp: 10, lv: 1, k: 0, xp: 0, co: 0, lives: 2, pot: [], cards: [] });
  ok(!document.getElementById('comboMeter').classList.contains('hidden'), 'in combattimento la combo si vede');
  HUD.updateTop(snap({ phase: 'cleared', ex: { n: 0, tot: 1, t: 100 } }), { cmb: 9, cmx: 1.4, cmt: 0.5, hp: 10, mhp: 10, lv: 1, k: 0, xp: 0, co: 0, lives: 2, pot: [], cards: [] });
  ok(document.getElementById('comboMeter').classList.contains('hidden'), 'a mappa ripulita sparisce, per non coprire la scritta');
  HUD.updateTop(snap({ phase: 'combat' }), null);

  // il riepilogo di fine livello
  const box = document.getElementById('waveStats');
  HUD.setWaveStats({ wave: 4, uccisi: 23, xp: 310, monete: 88, livelli: 2, durata: 71.4, par: 90, bonus: { xp: 57, monete: 24 }, carte: 2, livello: 6 });
  ok(!box.classList.contains('hidden'), 'il riepilogo di fine livello compare');
  const h = String(box.innerHTML);
  ok(h.indexOf('23') > 0 && h.indexOf('310') > 0 && h.indexOf('88') > 0, 'con nemici uccisi, esperienza e monete');
  ok(h.indexOf('1:11') > 0 && h.indexOf('1:30') > 0, 'con la durata e il tempo obiettivo in minuti');
  ok(h.indexOf('+57') > 0 && h.indexOf('+24') > 0, 'e il premio del cronometro quando c e');
  ok(h.indexOf('2') > 0 && h.indexOf('livelli') > 0, 'e i livelli guadagnati');
  HUD.setWaveStats({ wave: 5, uccisi: 9, xp: 40, monete: 12, livelli: 0, durata: 140, par: 90, bonus: null });
  ok(String(box.innerHTML).indexOf('nessun premio') > 0, 'fuori tempo lo dice invece di tacere');
  ok(String(box.innerHTML).indexOf('livelli') < 0, 'e senza livelli non mostra la casella dei livelli');

  // le carte: quando non se ne deve nessuna, il pannello spiega perche
  HUD.setBoons({ boons: [], resta: 0, liv: 4, manca: 140, prossimo: 6 }, () => {});
  const bsec = document.getElementById('boonSection'), bsub = document.getElementById('boonSub');
  ok(!bsec.classList.contains('hidden'), 'senza scelte in sospeso la sezione resta visibile');
  ok(String(document.getElementById('boonTitle').textContent).indexOf('NESSUNA') > 0, 'e il titolo non promette una scelta che non c e');
  ok(String(bsub.innerHTML).indexOf('140') > 0 && String(bsub.innerHTML).indexOf('livello 6') > 0, 'e dice a che livello arriva la prossima e quanta XP manca');
  HUD.setBoons({ boons: [], resta: 0, liv: 15, cap: 1, max: 15 }, () => {});
  ok(String(bsub.innerHTML).indexOf('massimo') > 0, 'al tetto dice che la crescita finisce li');
  HUD.setBoons({ boons: [{ id: 'pierce', name: 'Perforazione', icon: '🏹', rarity: 'rare', hero: 'ladro', desc: 'passa attraverso' }], tier: 'rare', tierName: 'Raro', tierColor: '#3aa0ff', scaglione: 2, tot: 4, resta: 1, liv: 6 }, () => {});
  ok(String(bsub.innerHTML).indexOf('2 di 4') > 0, 'a scelta aperta dice a quale scaglione sei');
  ok(String(document.getElementById('boonTitle').textContent).indexOf('SCEGLI') > 0, 'e il titolo torna quello della scelta');
  ok(String((document.getElementById('boonCards').children[0] || {}).innerHTML).indexOf('DELLA TUA CLASSE') > 0, 'e marca quali sono le abilita della tua classe');
})();


// ===== v1.79 — IL MENU A SEZIONI ===========================================================
(function () {
  console.log('\n-- v1.79: menu a quattro sezioni, scelta in sospeso, inventario');
  const L2 = window.GAME.Loot;
  // le quattro sezioni si sfogliano e una sola resta accesa
  HUD.mostraSezione('personaggio');
  ok(document.getElementById('secPersonaggio').classList.contains('hidden') === false, 'la sezione Personaggio si apre');
  ok(document.getElementById('secRiepilogo').classList.contains('hidden'), 'e le altre si chiudono');
  ok(document.getElementById('tabPersonaggio').classList.contains('on'), 'il pulsante della sezione aperta e evidenziato');
  HUD.mostraSezione('riepilogo');
  ok(!document.getElementById('secRiepilogo').classList.contains('hidden'), 'si torna al riepilogo');

  // finche' c'e' una scelta in sospeso, la mappa successiva non parte
  const quattro = L2.offerteScaglione('mago', 'epic', {}).map(b => ({ id: b.id, name: b.name, icon: b.icon, rarity: b.rarity, hero: b.hero, desc: 'x' }));
  HUD.setBoons({ boons: quattro, tier: 'epic', tierName: 'Epico', tierColor: '#b061ff', scaglione: 3, tot: 4, resta: 1, liv: 9 }, () => {});
  ok(document.getElementById('nextWaveBtn').disabled === true, 'con una scelta aperta il pulsante della mappa e spento');
  ok(!document.getElementById('tabBadge').classList.contains('hidden'), 'e la sezione Abilita porta il richiamo');
  ok(String(document.getElementById('goNota').innerHTML).indexOf('ABILIT') > 0, 'con scritto perche');
  // scelta fatta: si riparte
  HUD.setBoons({ boons: [], resta: 0, liv: 9, prossimo: 12, manca: 500 }, () => {});
  ok(document.getElementById('nextWaveBtn').disabled === false, 'scelta l abilita, il pulsante si accende');
  ok(document.getElementById('tabBadge').classList.contains('hidden'), 'e il richiamo sparisce');

  // l'elenco per scaglione: quattro righe, sempre
  HUD.setActiveBoons([{ id: 'crit', icon: '🎯', name: 'Occhio di Falco', rarity: 'uncommon', n: 1, desc: 'critico', on: 1 }]);
  const righe = document.getElementById('abilElenco').innerHTML;
  ok((righe.match(/ab-sc/g) || []).length === 4, 'l elenco ha una riga per scaglione');
  ok(righe.indexOf('Occhio di Falco') > 0, 'con dentro l abilita gia presa');
  ok(righe.indexOf('si sblocca al livello 12') > 0, 'e dice quando arrivano quelle che mancano');

  // l'inventario
  HUD.setStats({ points: 3, level: 9, rankName: 'Campione', wave: 9, stats: [], inv: {
    hp: 180, hpMax: 240, vite: 2, monete: 77, uccisi: 40, combo: 9,
    arma: { nome: 'Arco Corto', icona: '🏹', livello: 0, evo: '', scuola: 'ranged' },
    gear: [{ slot: 'weapon', slotName: 'Arma', icona: '⚔️', nome: 'Arco Corto', colore: '#8a6534', rango: 1, desc: 'perfora 1' }],
    belt: [{ id: 'p_cura', nome: 'Pozione di Cura', icona: '🧪', n: 2, max: 3 }, null, null],
  } }, () => {}, () => {});
  const inv = document.getElementById('inventario').innerHTML;
  ok(inv.indexOf('180 / 240 PV') > 0, 'l inventario mostra i PV');
  ok(inv.indexOf('Arco Corto') > 0, 'l equipaggiamento');
  ok(inv.indexOf('Pozione di Cura') > 0 && inv.indexOf('2/3') > 0, 'e la cintura con le cariche');
  ok((inv.match(/Arco Corto/g) || []).length === 1, 'e l arma non e scritta due volte');
  ok(inv.indexOf('slot 2 vuoto') > 0, 'gli slot vuoti si vedono');
})();

console.log('=================================================='); console.log(fails ? '  CLIENT: ' + fails + ' FALLITI' : '  CLIENT: tutti i controlli passati'); console.log('==================================================');


process.exit(fails ? 1 : 0);
