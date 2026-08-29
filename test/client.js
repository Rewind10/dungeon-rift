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
global.document = { getElementById: id => (nodes[id] = nodes[id] || mkEl(id)), createElement: () => mkEl('new') };
global.window = { GAME: {} };
global.setTimeout = () => {}; global.clearTimeout = () => {};
for (const f of ['constants', 'mathutils', 'monsters', 'heroes', 'loot', 'gear', 'levels', 'mapgen']) {
  const src = fs.readFileSync(ROOT + 'shared/' + f + '.js', 'utf8');
  new Function('self', 'window', 'module', src)(window, window, undefined);
}
new Function('window', 'document', 'setTimeout', 'clearTimeout', fs.readFileSync(ROOT + 'public/js/hud.js', 'utf8'))(window, document, () => {}, () => {});
const HUD = window.HUD, L = window.GAME.Loot, C = window.GAME.Constants;
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ FAIL ') + m); if (!c) fails++; };

// 1) barra dei poteri attivi
HUD.setActiveBoons([
  { id: 'execute', icon: '🗡️', name: 'Colpo di Grazia', rarity: 'epic', n: 2, desc: 'esegue' },
  { id: 'aegis', icon: '🧿', name: 'Egida Ostinata', rarity: 'rare', n: 1, desc: 'para' },
  { id: 'headhunter', icon: '🎯', name: 'Cacciatore di Teste', n: 1, syn: 1, desc: 'sinergia' },
]);
const bar = document.getElementById('boonBar');
ok(!bar.classList.contains('hidden'), 'la barra poteri si mostra quando ci sono poteri');
ok((bar.innerHTML.match(/bchip/g) || []).length === 3, 'tre gettoni renderizzati');
ok(bar.innerHTML.includes('×2'), 'il moltiplicatore ×2 compare');
ok(bar.innerHTML.includes('syn'), 'la sinergia e evidenziata');
HUD.setActiveBoons([]);
ok(bar.classList.contains('hidden'), 'la barra si nasconde se non hai poteri');

// 2) negozio: 3 carte potere, statistiche con tetto, emporio assente
const boons = L.offerBoons(C.RARITY, {}).map(b => ({ id: b.id, name: b.name, icon: b.icon, rarity: b.rarity, desc: 'x', owned: 0, max: b.max }));
HUD.setBoons({ boons, picked: false }, () => {});
HUD.setStats({ xp: 500, stats: L.XP_STATS.map((s, i) => { const lvl = i === 0 ? L.STAT_MAX_LEVEL : 2; const maxed = lvl >= L.STAT_MAX_LEVEL; return { id: s.id, name: s.name, icon: s.icon, color: s.color, desc: s.desc, cost: maxed ? 0 : L.statCost(s.base, lvl), lvl, max: L.STAT_MAX_LEVEL, maxed }; }) }, () => {}, () => {});
ok(document.getElementById('boonCards').children.length === 3, 'il negozio disegna 3 carte potere');
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


// 5) v1.69 — pannello del RANGO: carte di classe ai ranghi II-IV, bivio al V
{
  const LV = window.GAME.Levels;
  let scelto = null;
  HUD.setRank({ spec: 0, rank: 2, title: 'GUERRIERO ESPERTO',
    cards: LV.cardsFor('guerriero', 2).map(c => ({ id: c.id, name: c.name, icon: c.icon, desc: c.desc })) }, (id) => { scelto = id; });
  const rsec = document.getElementById('rankSection'), rrow = document.getElementById('rankCards');
  ok(!rsec.classList.contains('hidden'), 'la sezione del rango compare quando c e una carta da scegliere');
  ok(rrow.children.length === 3, 'ai ranghi II-IV le carte sono tre');
  ok(document.getElementById('rankTitle').textContent === 'GUERRIERO ESPERTO', 'il titolo e il nome del rango raggiunto');
  ok(rrow.children[0].innerHTML.includes('CARTA DI RANGO'), 'le carte sono marcate come carte di rango');
  rrow.children[1].onclick();
  ok(scelto === LV.cardsFor('guerriero', 2)[1].id, 'il clic manda l id della carta');
  HUD.setRank({ spec: 0, rank: 2, title: 'x', cards: [], picked: true }, () => {});
  ok(document.getElementById('rankSection').classList.contains('hidden'), 'scelta la carta, la sezione sparisce');
  // il bivio del rango V: due carte, piu grandi, con l abilita in fondo
  HUD.setRank({ spec: 1, rank: 5, title: 'SCEGLI LA TUA STRADA',
    cards: LV.specsFor('mago').map(s => ({ id: s.id, name: s.name, icon: s.icon, color: s.color, desc: s.desc, abilita: s.abilita })) }, () => {});
  const rrow2 = document.getElementById('rankCards');
  ok(rrow2.children.length === 2, 'al rango V le strade sono due');
  ok(rrow2.className === 'spec', 'e il pannello usa la disposizione a due colonne');
  ok(rrow2.children[0].innerHTML.includes('SPECIALIZZAZIONE'), 'sono marcate come specializzazione');
  ok(rrow2.children[0].innerHTML.includes('Meteora') || rrow2.children[1].innerHTML.includes('Meteora'), 'e mostrano anche l abilita che arrivera');
  // il negozio parla di PUNTI, non piu di XP
  HUD.setStats({ points: 3, level: 7, rankName: 'Veterano', xp: 2500,
    stats: L.XP_STATS.map((s, i) => ({ id: s.id, name: s.name, icon: s.icon, color: s.color, desc: s.desc, lvl: i, max: 12, maxed: false, cost: i < 4 ? 1 : 2 })) }, () => {}, () => {});
  ok(String(document.getElementById('shopXp').textContent) === '3', 'la cifra grande sono i punti, non la XP');
  ok(String(document.getElementById('shopLevel').textContent) === '7', 'accanto c e il livello');
  ok(document.getElementById('shopRank').textContent === 'Veterano', 'e il nome del rango');
  const uc = document.getElementById('upgradeCards').children;
  ok(uc[0].innerHTML.includes('1 punto') && !uc[0].innerHTML.includes('XP'), 'il prezzo e in punti e non nomina piu la XP');
  ok(uc[3].className.includes('disabled') === false, 'con 3 punti una statistica da 2 resta acquistabile');
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

  const TYPES = ['skeleton', 'slime', 'darkmage', 'cave_brute', 'spore_fungus', 'bone_roller', 'bat_swarm', 'wisp', 'occhio'];
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

console.log('=================================================='); console.log(fails ? '  CLIENT: ' + fails + ' FALLITI' : '  CLIENT: tutti i controlli passati'); console.log('==================================================');


process.exit(fails ? 1 : 0);
