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
for (const f of ['constants', 'mathutils', 'monsters', 'heroes', 'loot']) {
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
ok(cards[1].innerHTML.includes('Lv.2/' + L.STAT_MAX_LEVEL), 'le altre mostrano Lv.x/8');
ok(document.getElementById('gearSection').classList.contains('hidden'), 'la sezione Emporio resta nascosta senza dati equipaggiamento');
console.log('=================================================='); console.log(fails ? '  CLIENT: ' + fails + ' FALLITI' : '  CLIENT: tutti i controlli passati'); console.log('==================================================');
process.exit(fails ? 1 : 0);
