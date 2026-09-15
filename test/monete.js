/* monete.js — QUANTE MONETE CONTIENE UN'ONDATA, ondata per ondata.
 *
 * Perche' esiste. Fino alla 2.11 i prezzi dell'equipaggiamento erano tarati su un commento SBAGLIATO
 * dentro gear.js («il Mercato apre ogni 3 ondate»): il villaggio si raggiunge invece alla fine di OGNI
 * ondata. Un prezzo tarato su un'ipotesi e' un prezzo inventato. Questo file misura.
 *
 * COME MISURA, e perche' non con un bot. Il primo tentativo faceva giocare tre bot e contava le monete
 * in mano. Non ha funzionato, e il motivo va scritto: un bot scritto per un file di misura gioca molto
 * peggio di una persona — si impantanava all'ondata 4 e la misura finiva li'. La mortalita' del bot
 * diceva qualcosa sul bot, niente sull'economia.
 *
 * Quindi si contano le monete che l'ondata CONTIENE: si costruisce la stessa lista di mostri che
 * costruisce il gioco (Waves.buildWave), e per ognuno si applica la stessa formula del valore in monete
 * che sta in Room._killMonster. E' il TETTO — quello che prende chi ammazza tutto e raccoglie tutto —
 * e per decidere un listino prezzi il tetto e' il numero giusto da guardare: se il tetto non basta a
 * comprare niente, il prezzo e' sbagliato di sicuro.
 *
 * Le tre voci sono tenute separate perche' non si guadagnano allo stesso modo:
 *   DROP     cade dai mostri. Lo prendi se uccidi.
 *   PAR      il premio di velocita' (C.PAR_MONETE + C.PAR_MONETE_ONDATA * ondata). Lo prendi se sei svelto.
 *   TAGLIA   la taglia del Banditore. La prendi se la accetti e la porti a termine.
 *
 *   node test/monete.js [numero di campioni per ondata]
 */
'use strict';
const C = require('../shared/constants.js');
const MU = require('../shared/mathutils.js');
const Mon = require('../shared/monsters.js');
const Waves = require('../shared/waves.js');
const Bnt = require('../shared/bounties.js');
const Gear = require('../shared/gear.js');

const CAMPIONI = +(process.argv[2] || 200);
const GIOCATORI = 1;                       // in solo: e' cosi' che ci gioca Paolo

// La stessa riga che sta in Room._killMonster. Se la' cambia, qui va cambiata: sono due copie della
// stessa regola e non c'e' modo di condividerle senza spostare mezzo Room in shared.
function moneteDi(def, elite, boss) {
  return Math.max(1, Math.round((def.xp || 4) * 0.6 * (boss ? 6 : elite ? 2.2 : 1)));
}

const med = a => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };

const righe = [];
for (let w = 1; w <= Waves.FINAL_WAVE; w++) {
  const camp = [];
  for (let k = 0; k < CAMPIONI; k++) {
    const mode = Waves.modeForWave(w, Math.random);
    const ond = Waves.buildWave(w, GIOCATORI, mode);
    let tot = 0;
    for (const e of ond.list) { const def = Mon.MONSTERS[e.type]; if (def) tot += moneteDi(def, e.elite, !!def.boss); }
    if (Waves.isBossWave(w)) { const b = Waves.bossForWave(w, GIOCATORI); if (b && b.def) tot += moneteDi(b.def, false, true); }
    camp.push(tot);
  }
  const drop = med(camp);
  const par = Math.round(C.PAR_MONETE + C.PAR_MONETE_ONDATA * w);
  // la taglia: si prende la mediana di quanto pagano i tipi di taglia a quell'ondata
  const paghe = Object.keys(Bnt.KINDS || {}).map(k => Math.round(Bnt.KINDS[k].pay(w))).filter(v => v > 0);
  const taglia = paghe.length ? med(paghe) : 0;
  righe.push({ w, drop, par, taglia });
}

console.log('\nMONETE CHE UN\'ONDATA CONTIENE — solo, mediana su ' + CAMPIONI + ' composizioni\n');
console.log('  ondata    drop    par   taglia    totale    cumulato');
let cum = 0, cumSecco = 0;
for (const r of righe) {
  const tot = r.drop + r.par + r.taglia; cum += tot; cumSecco += r.drop;
  console.log('  ' + String(r.w).padStart(5) + String(r.drop).padStart(9) + String(r.par).padStart(7)
    + String(r.taglia).padStart(8) + String(tot).padStart(10) + String(cum).padStart(12));
}
console.log('\n  cumulato SENZA par ne\' taglia (chi gioca lento e non accetta taglie): ' + cumSecco);

console.log('\nIL LISTINO, e a che ondata te lo puoi permettere (col cumulato pieno):');
const kit = {};
for (const h of ['guerriero', 'mago', 'ladro']) {
  kit[h] = [];
  for (let r = 2; r <= 5; r++) {
    let t = 0;
    for (const s of Gear.slotsFor(h)) { const l = Gear.itemsOfRank(h, s, r); if (l.length) t += l[0].cost; }
    kit[h].push(t);
  }
}
function ondataPer(costo) {
  let c = 0;
  for (const r of righe) { c += r.drop + r.par + r.taglia; if (c >= costo) return r.w; }
  return null;
}
for (const h of ['guerriero', 'mago', 'ladro']) {
  const parti = kit[h].map((c, i) => {
    const o = ondataPer(c);
    return Gear.RANK_RARITY[i + 1] + ' ' + c + ' (ondata ' + (o || '>' + Waves.FINAL_WAVE) + ')';
  });
  console.log('  ' + h.padEnd(11) + parti.join(' · '));
}
console.log('\n  N.B. il kit e\' CUMULATIVO nel senso sbagliato: comprare il raro dopo il comune costa la');
console.log('  somma dei due, perche\' non c\'e\' permuta. La rivendita a meta\' prezzo esiste per questo.');
console.log('  Singolo pezzo, arma: ' + [170, 380, 650, 1100].map(c => c + ' (onda ' + (ondataPer(c) || '>20') + ')').join(' · '));
