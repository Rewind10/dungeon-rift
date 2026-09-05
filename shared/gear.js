/* gear.js — CATALOGO DELL'EQUIPAGGIAMENTO (UMD)
   v1.67 — L'Emporio generico (Armatura / Stivali / Arma, tre barre da salire a livelli) e' stato sostituito
   da un catalogo di OGGETTI CON UN NOME. La differenza non e' cosmetica: una barra da riempire e' una
   decisione sola ("ho abbastanza monete?"), un oggetto con un nome e' una scelta ("mi serve la portata
   dell'alabarda o la cadenza dello spadone?").

   TRE REGOLE che reggono tutto il file:
   1. OGNI OGGETTO APPARTIENE A UNA CLASSE. Il guerriero vede solo roba da guerriero. Niente cataloghi
      condivisi: la lista che arriva al client e' gia' filtrata dal server sull'eroe di chi guarda.
   2. GLI SLOT CAMBIANO DA CLASSE A CLASSE. Il guerriero ha lo scudo, il ladro le calzature, il mago
      nessuno dei due. Lo slot non e' una proprieta' del gioco ma della classe.
   3. IL RANGO 1 E' CIO' CHE HAI ADDOSSO ALLA PARTENZA e costa 0. Non e' un oggetto "vuoto": e' il metro
      con cui si leggono gli altri. Un rango piu' alto costa di piu' e ha statistiche migliori, sempre —
      niente scambi alla pari, niente svantaggi nascosti.

   Il cambio e' LIBERO: si compra qualunque oggetto dello slot in qualunque momento e quello vecchio viene
   rimpiazzato (a prezzo pieno, senza permuta). Per questo i bonus NON si sommano man mano: il server
   ricalcola il totale da zero a ogni cambio (Room._recomputeGear), altrimenti sostituire un oggetto
   lascerebbe in giro il bonus di quello tolto.

   PREZZI. Misurati sull'economia vera: ~65-70 monete a ondata, e il Mercato apre ogni 3 ondate. Quindi al
   primo mercato si hanno ~200 monete (un oggetto di rango 2) e al secondo ~400 (un rango 3, o due rango 2).

   COME SI AGGIUNGE UN OGGETTO (Paolo ne aggiungera' altri): una riga in ITEMS con hero/slot/rank/cost e
   il blocco `bonus` (oppure `weapon` per lo slot arma). Nient'altro: negozio, HUD, ricalcolo e test lo
   pescano da qui. Se lo slot e' nuovo per quella classe, aggiungerlo anche in SLOTS. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Gear = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Slot per classe, nell'ordine in cui devono comparire nel negozio.
  const SLOTS = {
    guerriero: ['weapon', 'armor', 'shield'],
    mago: ['weapon', 'armor'],
    ladro: ['weapon', 'armor', 'boots'],
  };
  const SLOT_NAME = { weapon: 'Arma', armor: 'Armatura', shield: 'Scudo', boots: 'Calzature' };
  const SLOT_ICON = { weapon: '⚔️', armor: '🛡️', shield: '🛡️', boots: '👢' };
  const RANK_RARITY = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

  // `weapon` sostituisce INTERAMENTE l'arma dell'eroe (la scuola resta quella della classe, altrimenti
  // le statistiche smetterebbero di funzionare). `bonus` e' additivo e viene ricalcolato da zero.
  const ITEMS = [
    // ===================== GUERRIERO =====================
    // Le tre armi non sono la stessa arma piu' grande: piu' e' lunga, piu' l'arco e' STRETTO. L'alabarda
    // arriva a 152px ma copre 71°, lo spadone 122px per 94°. Si sceglie fra tenere lontano e coprire i fianchi.
    { id: 'gue_spada', hero: 'guerriero', slot: 'weapon', rank: 1, cost: 0, name: 'Spada', color: '#c2c9d4',
      desc: 'Portata 100 · arco 109° · 99 danni/s',
      weapon: { name: 'Spada', melee: true, dmg: 55, fireRate: 1.8, arcRadius: 100, arcHalf: 0.95, knockback: 150,
                projColor: '#ffd27a', spread: 0, bulletSpeed: 0, range: 100, pierce: 0 } },
    { id: 'gue_spadone', hero: 'guerriero', slot: 'weapon', rank: 2, cost: 230, name: 'Spadone', color: '#e0a52c',
      desc: 'Portata 122 · arco 94° · 115 danni/s · rinculo forte',
      weapon: { name: 'Spadone', melee: true, dmg: 82, fireRate: 1.4, arcRadius: 122, arcHalf: 0.82, knockback: 210,
                projColor: '#ffd27a', spread: 0, bulletSpeed: 0, range: 122, pierce: 0 } },
    { id: 'gue_alabarda', hero: 'guerriero', slot: 'weapon', rank: 3, cost: 470, name: 'Alabarda', color: '#ff8a5b',
      desc: 'Portata 152 · arco 71° · 130 danni/s · rinculo devastante',
      weapon: { name: 'Alabarda', melee: true, dmg: 118, fireRate: 1.1, arcRadius: 152, arcHalf: 0.62, knockback: 260,
                projColor: '#ffd27a', spread: 0, bulletSpeed: 0, range: 152, pierce: 0 } },
    { id: 'gue_maglia', hero: 'guerriero', slot: 'armor', rank: 1, cost: 0, name: 'Maglia di Ferro', color: '#8d97a5',
      desc: '+10 PV massimi · −3% danni subiti', bonus: { maxHpFlat: 10, dmgReduce: 0.03 } },
    { id: 'gue_piastre', hero: 'guerriero', slot: 'armor', rank: 2, cost: 250, name: 'Armatura a Piastre', color: '#e2e7ee',
      desc: '+45 PV massimi · −10% danni subiti', bonus: { maxHpFlat: 45, dmgReduce: 0.10 } },
    // v1.83 — LO SCUDO STA DAVANTI, e adesso conta. Oltre allo sconto che vale da ogni parte, para i
    // colpi che arrivano dal cono frontale (`frontale`): il guerriero e' l'unico che non puo' tenere le
    // distanze, e quindi l'unico che puo' fare qualcosa di meglio che incassare — girarsi verso chi
    // colpisce. Alle spalle lo scudo non c'e', e si sente.
    { id: 'gue_scudo', hero: 'guerriero', slot: 'shield', rank: 1, cost: 0, name: 'Scudo', color: '#8d97a5',
      desc: '−5% danni subiti · −45% dai colpi FRONTALI', bonus: { dmgReduce: 0.05, frontale: 0.45 } },
    { id: 'gue_torre', hero: 'guerriero', slot: 'shield', rank: 2, cost: 290, name: 'Scudo a Torre', color: '#c8a23a',
      desc: '−13% danni subiti · −60% dai colpi FRONTALI · +20 PV massimi', bonus: { dmgReduce: 0.13, maxHpFlat: 20, frontale: 0.60 } },

    // ===================== MAGO =====================
    // La CADENZA delle bacchette resta 1,5/s su tutte e tre: e' la firma della classe, ed e' l'Intelligenza
    // a farla salire. Le bacchette migliori danno danno, velocita' e grandezza della bolla — cioe' quante
    // ne vanno a segno, che su un proiettile lento conta quanto il danno.
    { id: 'mag_bacchetta', hero: 'mago', slot: 'weapon', rank: 1, cost: 0, name: 'Bacchetta di Frassino', color: '#8d97a5',
      desc: 'Bolla 430 px/s · 96 danni/s',
      weapon: { name: 'Bacchetta di Frassino', dmg: 64, fireRate: 1.5, spread: 0.02, bulletSpeed: 430, range: 620,
                pierce: 0, projColor: '#00f0c8', knockback: 45, bubble: true, r: 9 } },
    { id: 'mag_scettro', hero: 'mago', slot: 'weapon', rank: 2, cost: 240, name: 'Scettro Runico', color: '#b061ff',
      desc: 'Bolla 470 px/s, piu grande · 114 danni/s',
      weapon: { name: 'Scettro Runico', dmg: 76, fireRate: 1.5, spread: 0.02, bulletSpeed: 470, range: 660,
                pierce: 0, projColor: '#c48cff', knockback: 55, bubble: true, r: 10 } },
    { id: 'mag_bastone', hero: 'mago', slot: 'weapon', rank: 3, cost: 500, name: 'Bastone del Vuoto', color: '#00f0c8',
      desc: 'Bolla 520 px/s, enorme, perfora 1 · 129 danni/s',
      weapon: { name: 'Bastone del Vuoto', dmg: 86, fireRate: 1.5, spread: 0.02, bulletSpeed: 520, range: 700,
                pierce: 1, projColor: '#7ffbe4', knockback: 70, bubble: true, r: 12 } },
    { id: 'mag_veste', hero: 'mago', slot: 'armor', rank: 1, cost: 0, name: 'Veste da Apprendista', color: '#8d97a5',
      desc: '+10 PV massimi', bonus: { maxHpFlat: 10 } },
    { id: 'mag_manto', hero: 'mago', slot: 'armor', rank: 2, cost: 270, name: "Manto dell'Arcanista", color: '#b061ff',
      desc: '+40 PV massimi · −8% danni subiti', bonus: { maxHpFlat: 40, dmgReduce: 0.08 } },

    // ===================== LADRO =====================
    { id: 'lad_arcocorto', hero: 'ladro', slot: 'weapon', rank: 1, cost: 0, name: 'Arco Corto', color: '#8a6534',
      desc: 'Freccia 900 px/s, perfora 1 · 93 danni/s',
      weapon: { name: 'Arco Corto', dmg: 31, fireRate: 3.0, spread: 0.04, bulletSpeed: 900, range: 700,
                pierce: 1, projColor: '#9ef0b0', knockback: 25, arrow: true } },
    { id: 'lad_arcolungo', hero: 'ladro', slot: 'weapon', rank: 2, cost: 300, name: 'Arco Lungo', color: '#9ef0b0',
      desc: 'Freccia 1050 px/s, gittata 840, perfora 2 · 114 danni/s',
      weapon: { name: 'Arco Lungo', dmg: 44, fireRate: 2.6, spread: 0.03, bulletSpeed: 1050, range: 840,
                pierce: 2, projColor: '#9ef0b0', knockback: 35, arrow: true, long: true } },
    { id: 'lad_pelle', hero: 'ladro', slot: 'armor', rank: 1, cost: 0, name: 'Giaco di Pelle', color: '#8d97a5',
      desc: '+10 PV massimi', bonus: { maxHpFlat: 10 } },
    { id: 'lad_cuoio', hero: 'ladro', slot: 'armor', rank: 2, cost: 240, name: 'Corazza di Cuoio', color: '#8a6534',
      desc: '+35 PV massimi · −7% danni subiti', bonus: { maxHpFlat: 35, dmgReduce: 0.07 } },
    { id: 'lad_scarpe', hero: 'ladro', slot: 'boots', rank: 1, cost: 0, name: 'Scarpe di Corda', color: '#8d97a5',
      desc: '+3% velocita di movimento', bonus: { speedMult: 0.03 } },
    { id: 'lad_stivali', hero: 'ladro', slot: 'boots', rank: 2, cost: 260, name: 'Stivali del Passo Lieve', color: '#9ef0b0',
      desc: '+12% velocita di movimento · +15 PV massimi', bonus: { speedMult: 0.12, maxHpFlat: 15 } },
  ];

  const BY_ID = {}; for (const it of ITEMS) BY_ID[it.id] = it;

  // Oggetti di una classe per uno slot, dal rango piu' basso al piu' alto.
  function itemsFor(heroId, slot) {
    return ITEMS.filter(i => i.hero === heroId && i.slot === slot).sort((a, b) => a.rank - b.rank);
  }
  function slotsFor(heroId) { return SLOTS[heroId] || []; }
  // Cio' che si ha addosso all'inizio: il rango 1 di ogni slot della classe.
  function startingGear(heroId) {
    const out = {};
    for (const s of slotsFor(heroId)) { const l = itemsFor(heroId, s); if (l.length) out[s] = l[0].id; }
    return out;
  }
  // Somma dei bonus degli oggetti indossati. Si RICALCOLA sempre da zero: col cambio libero non si puo'
  // sommare il delta, o il bonus dell'oggetto sostituito resterebbe attaccato al personaggio per sempre.
  function bonusOf(gear) {
    const b = { maxHpFlat: 0, dmgReduce: 0, speedMult: 0, frontale: 0 };
    for (const k in (gear || {})) {
      const it = BY_ID[gear[k]]; if (!it || !it.bonus) continue;
      for (const s in it.bonus) b[s] = (b[s] || 0) + it.bonus[s];
    }
    return b;
  }
  function rarityOf(it) { return RANK_RARITY[Math.min(RANK_RARITY.length - 1, (it.rank || 1) - 1)]; }

  return { ITEMS, BY_ID, SLOTS, SLOT_NAME, SLOT_ICON, RANK_RARITY, itemsFor, slotsFor, startingGear, bonusOf, rarityOf };
});
