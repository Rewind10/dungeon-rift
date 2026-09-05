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
  // v1.88 — QUATTRO RANGHI PER OGNI SLOT, con i nomi che il giocatore legge nel negozio. Il rango 1 e'
  // quello che hai addosso alla partenza e costa 0: e' il metro con cui si leggono gli altri.
  const RANK_RARITY = ['common', 'rare', 'legendary', 'divine'];

  // `weapon` sostituisce INTERAMENTE l'arma dell'eroe (la scuola resta quella della classe, altrimenti
  // le statistiche smetterebbero di funzionare). `bonus` e' additivo e viene ricalcolato da zero.
  const ITEMS = [
    // ===================== GUERRIERO =====================
    // Le armi non sono la stessa arma piu' grande: piu' e' lunga, piu' l'arco e' STRETTO. Si sceglie fra
    // tenere lontano e coprire i fianchi. `tinta` e' cio' che il renderer usa per far VEDERE il cambio.
    { id: 'gue_spada', hero: 'guerriero', slot: 'weapon', rank: 1, cost: 0, name: 'Spada', color: '#c2c9d4',
      desc: 'Portata 100 · arco 109° · 99 danni/s',
      weapon: { name: 'Spada', melee: true, dmg: 55, fireRate: 1.8, arcRadius: 100, arcHalf: 0.95, knockback: 150,
                projColor: '#ffd27a', spread: 0, bulletSpeed: 0, range: 100, pierce: 0 } },
    { id: 'gue_spadone', hero: 'guerriero', slot: 'weapon', rank: 2, cost: 230, name: 'Spadone', color: '#3aa0ff',
      desc: 'Portata 122 · arco 94° · 115 danni/s · rinculo forte',
      weapon: { name: 'Spadone', melee: true, dmg: 82, fireRate: 1.4, arcRadius: 122, arcHalf: 0.82, knockback: 210,
                projColor: '#cfe6ff', spread: 0, bulletSpeed: 0, range: 122, pierce: 0 } },
    { id: 'gue_alabarda', hero: 'guerriero', slot: 'weapon', rank: 3, cost: 520, name: 'Alabarda', color: '#ffb020',
      desc: 'Portata 152 · arco 71° · 130 danni/s · rinculo devastante',
      weapon: { name: 'Alabarda', melee: true, dmg: 118, fireRate: 1.1, arcRadius: 152, arcHalf: 0.62, knockback: 260,
                projColor: '#ffd27a', spread: 0, bulletSpeed: 0, range: 152, pierce: 0 } },
    { id: 'gue_falce', hero: 'guerriero', slot: 'weapon', rank: 4, cost: 1000, name: 'Falce della Faglia', color: '#ffe9a8',
      desc: 'Portata 168 · arco 60° · 157 danni/s · rinculo che sposta le folle',
      weapon: { name: 'Falce della Faglia', melee: true, dmg: 150, fireRate: 1.05, arcRadius: 168, arcHalf: 0.52, knockback: 300,
                projColor: '#e6d0ff', spread: 0, bulletSpeed: 0, range: 168, pierce: 0 } },

    { id: 'gue_maglia', hero: 'guerriero', slot: 'armor', rank: 1, cost: 0, name: 'Maglia di Ferro', color: '#8d97a5',
      desc: '+10 PV massimi · −3% danni subiti', bonus: { maxHpFlat: 10, dmgReduce: 0.03 },
      tinta: { metallo: '#7f8895', cloth: '#3f5a2c', clothDk: '#243516', steelDk: '#3a424e' } },
    { id: 'gue_piastre', hero: 'guerriero', slot: 'armor', rank: 2, cost: 250, name: 'Armatura a Piastre', color: '#3aa0ff',
      desc: '+45 PV massimi · −10% danni subiti', bonus: { maxHpFlat: 45, dmgReduce: 0.10 },
      tinta: { metallo: '#9fb3cc', cloth: '#2b4a72', clothDk: '#16283f', steelDk: '#39465c' } },
    { id: 'gue_baluardo', hero: 'guerriero', slot: 'armor', rank: 3, cost: 560, name: 'Corazza del Baluardo', color: '#ffb020',
      desc: '+80 PV massimi · −16% danni subiti', bonus: { maxHpFlat: 80, dmgReduce: 0.16 },
      tinta: { metallo: '#c9a44e', cloth: '#5e3f18', clothDk: '#33210b', steelDk: '#4a3a1c' } },
    { id: 'gue_ossidiana', hero: 'guerriero', slot: 'armor', rank: 4, cost: 1050, name: 'Egida di Ossidiana', color: '#ffe9a8',
      desc: '+130 PV massimi · −22% danni subiti', bonus: { maxHpFlat: 130, dmgReduce: 0.22 },
      tinta: { metallo: '#4a4460', cloth: '#2a1f4a', clothDk: '#150f2a', steelDk: '#2a2440' } },

    // v1.83 — LO SCUDO STA DAVANTI, e conta: oltre allo sconto che vale da ogni parte, para i colpi che
    // arrivano dal cono frontale. Alle spalle non c'e' niente, e si sente.
    { id: 'gue_scudo', hero: 'guerriero', slot: 'shield', rank: 1, cost: 0, name: 'Scudo', color: '#8d97a5',
      desc: '−5% danni subiti · −45% dai colpi FRONTALI', bonus: { dmgReduce: 0.05, frontale: 0.45 },
      tinta: { scudo: '#8d97a5', orlo: '#c8a23a' } },
    { id: 'gue_torre', hero: 'guerriero', slot: 'shield', rank: 2, cost: 290, name: 'Scudo a Torre', color: '#3aa0ff',
      desc: '−13% danni subiti · −60% dai colpi FRONTALI · +20 PV massimi', bonus: { dmgReduce: 0.13, maxHpFlat: 20, frontale: 0.60 },
      tinta: { scudo: '#93a9c6', orlo: '#c8a23a' } },
    { id: 'gue_muro', hero: 'guerriero', slot: 'shield', rank: 3, cost: 620, name: "Muro d'Acciaio", color: '#ffb020',
      desc: '−18% danni subiti · −70% dai colpi FRONTALI · +35 PV massimi', bonus: { dmgReduce: 0.18, maxHpFlat: 35, frontale: 0.70 },
      tinta: { scudo: '#c9a44e', orlo: '#fff0c0' } },
    { id: 'gue_aegis', hero: 'guerriero', slot: 'shield', rank: 4, cost: 1100, name: 'Aegis della Faglia', color: '#ffe9a8',
      desc: '−24% danni subiti · −80% dai colpi FRONTALI · +55 PV massimi', bonus: { dmgReduce: 0.24, maxHpFlat: 55, frontale: 0.80 },
      tinta: { scudo: '#6a5aa8', orlo: '#e6d0ff' } },

    // ===================== MAGO =====================
    // La CADENZA resta 1,5/s su tutte le bacchette: e' la firma della classe, ed e' l'Intelligenza a
    // farla salire. Quelle migliori danno danno, velocita' e GRANDEZZA della bolla — su un proiettile
    // lento, quante ne vanno a segno conta quanto il danno.
    { id: 'mag_bacchetta', hero: 'mago', slot: 'weapon', rank: 1, cost: 0, name: 'Bacchetta di Frassino', color: '#8d97a5',
      desc: 'Bolla 430 px/s · 96 danni/s',
      weapon: { name: 'Bacchetta di Frassino', dmg: 64, fireRate: 1.5, spread: 0.02, bulletSpeed: 430, range: 620,
                pierce: 0, projColor: '#00f0c8', knockback: 45, bubble: true, r: 9 } },
    { id: 'mag_scettro', hero: 'mago', slot: 'weapon', rank: 2, cost: 240, name: 'Scettro Runico', color: '#3aa0ff',
      desc: 'Bolla 470 px/s, piu grande · 114 danni/s',
      weapon: { name: 'Scettro Runico', dmg: 76, fireRate: 1.5, spread: 0.02, bulletSpeed: 470, range: 660,
                pierce: 0, projColor: '#c48cff', knockback: 55, bubble: true, r: 10 } },
    { id: 'mag_bastone', hero: 'mago', slot: 'weapon', rank: 3, cost: 500, name: 'Bastone del Vuoto', color: '#ffb020',
      desc: 'Bolla 520 px/s, enorme, perfora 1 · 129 danni/s',
      weapon: { name: 'Bastone del Vuoto', dmg: 86, fireRate: 1.5, spread: 0.02, bulletSpeed: 520, range: 700,
                pierce: 1, projColor: '#7ffbe4', knockback: 70, bubble: true, r: 12 } },
    { id: 'mag_stelle', hero: 'mago', slot: 'weapon', rank: 4, cost: 1050, name: 'Scettro delle Stelle Morte', color: '#ffe9a8',
      desc: 'Bolla 560 px/s, enorme, perfora 2 · 156 danni/s',
      weapon: { name: 'Scettro delle Stelle Morte', dmg: 104, fireRate: 1.5, spread: 0.02, bulletSpeed: 560, range: 740,
                pierce: 2, projColor: '#ffd9ff', knockback: 85, bubble: true, r: 14 } },

    { id: 'mag_veste', hero: 'mago', slot: 'armor', rank: 1, cost: 0, name: 'Veste da Apprendista', color: '#8d97a5',
      desc: '+10 PV massimi', bonus: { maxHpFlat: 10 },
      tinta: { body: '#3d3c8c', bodyDk: '#14133a', orlo: '#6f6ad8', accent: '#00f0c8' } },
    { id: 'mag_manto', hero: 'mago', slot: 'armor', rank: 2, cost: 270, name: "Manto dell'Arcanista", color: '#3aa0ff',
      desc: '+40 PV massimi · −8% danni subiti', bonus: { maxHpFlat: 40, dmgReduce: 0.08 },
      tinta: { body: '#2a4f8f', bodyDk: '#101f3d', orlo: '#7fc0ff', accent: '#7fdcff' } },
    { id: 'mag_conclave', hero: 'mago', slot: 'armor', rank: 3, cost: 580, name: 'Toga del Conclave', color: '#ffb020',
      desc: '+75 PV massimi · −14% danni subiti', bonus: { maxHpFlat: 75, dmgReduce: 0.14 },
      tinta: { body: '#6b2f86', bodyDk: '#2a0f38', orlo: '#f0c060', accent: '#e0a2ff' } },
    { id: 'mag_ere', hero: 'mago', slot: 'armor', rank: 4, cost: 1020, name: 'Manto delle Ere', color: '#ffe9a8',
      desc: '+120 PV massimi · −20% danni subiti', bonus: { maxHpFlat: 120, dmgReduce: 0.20 },
      tinta: { body: '#1b1730', bodyDk: '#0a0817', orlo: '#ffe9a8', accent: '#fff0c0' } },

    // ===================== LADRO =====================
    // v1.88 — l'ARCO CORTO torna in linea con la taratura della 1.83 (38 danni, 2,3 tiri/s). Era rimasta
    // scritta solo in heroes.js, ma l'arma vera arriva SEMPRE dall'oggetto equipaggiato: il ribilanciamento
    // del ladro non era mai entrato in partita.
    { id: 'lad_arcocorto', hero: 'ladro', slot: 'weapon', rank: 1, cost: 0, name: 'Arco Corto', color: '#8a6534',
      desc: 'Freccia 900 px/s, perfora 1 · 87 danni/s',
      weapon: { name: 'Arco Corto', dmg: 38, fireRate: 2.3, spread: 0.04, bulletSpeed: 900, range: 700,
                pierce: 1, projColor: '#9ef0b0', knockback: 25, arrow: true } },
    { id: 'lad_arcolungo', hero: 'ladro', slot: 'weapon', rank: 2, cost: 300, name: 'Arco Lungo', color: '#3aa0ff',
      desc: 'Freccia 1050 px/s, gittata 840, perfora 2 · 114 danni/s',
      weapon: { name: 'Arco Lungo', dmg: 44, fireRate: 2.6, spread: 0.03, bulletSpeed: 1050, range: 840,
                pierce: 2, projColor: '#9ef0b0', knockback: 35, arrow: true, long: true } },
    { id: 'lad_composito', hero: 'ladro', slot: 'weapon', rank: 3, cost: 560, name: 'Arco Composito', color: '#ffb020',
      desc: 'Freccia 1150 px/s, gittata 900, perfora 2 · 139 danni/s',
      weapon: { name: 'Arco Composito', dmg: 58, fireRate: 2.4, spread: 0.025, bulletSpeed: 1150, range: 900,
                pierce: 2, projColor: '#ffd27a', knockback: 40, arrow: true, long: true } },
    { id: 'lad_ombre', hero: 'ladro', slot: 'weapon', rank: 4, cost: 1020, name: 'Arco delle Ombre', color: '#ffe9a8',
      desc: 'Freccia 1250 px/s, gittata 950, perfora 3 · 170 danni/s',
      weapon: { name: 'Arco delle Ombre', dmg: 74, fireRate: 2.3, spread: 0.02, bulletSpeed: 1250, range: 950,
                pierce: 3, projColor: '#d9b6ff', knockback: 45, arrow: true, long: true } },

    { id: 'lad_pelle', hero: 'ladro', slot: 'armor', rank: 1, cost: 0, name: 'Giaco di Pelle', color: '#8d97a5',
      desc: '+10 PV massimi', bonus: { maxHpFlat: 10 },
      tinta: { cloth: '#3c5140', clothDk: '#1d2a22', mant: '#2f4436', capp: '#25382c' } },
    { id: 'lad_cuoio', hero: 'ladro', slot: 'armor', rank: 2, cost: 240, name: 'Corazza di Cuoio', color: '#3aa0ff',
      desc: '+35 PV massimi · −7% danni subiti', bonus: { maxHpFlat: 35, dmgReduce: 0.07 },
      tinta: { cloth: '#5a4326', clothDk: '#2e2013', mant: '#4a3620', capp: '#3a2a19' } },
    { id: 'lad_giustacuore', hero: 'ladro', slot: 'armor', rank: 3, cost: 540, name: 'Giustacuore Ombroso', color: '#ffb020',
      desc: '+65 PV massimi · −12% danni subiti · +4% velocita', bonus: { maxHpFlat: 65, dmgReduce: 0.12, speedMult: 0.04 },
      tinta: { cloth: '#3a2f56', clothDk: '#1b1630', mant: '#4a3d6e', capp: '#2c2445' } },
    { id: 'lad_vuoto', hero: 'ladro', slot: 'armor', rank: 4, cost: 990, name: 'Pelle del Vuoto', color: '#ffe9a8',
      desc: '+105 PV massimi · −17% danni subiti · +8% velocita', bonus: { maxHpFlat: 105, dmgReduce: 0.17, speedMult: 0.08 },
      tinta: { cloth: '#16202c', clothDk: '#080d14', mant: '#1d2b3a', capp: '#111a24' } },

    { id: 'lad_scarpe', hero: 'ladro', slot: 'boots', rank: 1, cost: 0, name: 'Scarpe di Corda', color: '#8d97a5',
      desc: '+3% velocita di movimento', bonus: { speedMult: 0.03 }, tinta: { steelDk: '#4a4030' } },
    { id: 'lad_stivali', hero: 'ladro', slot: 'boots', rank: 2, cost: 260, name: 'Stivali del Passo Lieve', color: '#3aa0ff',
      desc: '+12% velocita di movimento · +15 PV massimi', bonus: { speedMult: 0.12, maxHpFlat: 15 }, tinta: { steelDk: '#2f4a5c' } },
    { id: 'lad_vento', hero: 'ladro', slot: 'boots', rank: 3, cost: 520, name: 'Stivali del Vento', color: '#ffb020',
      desc: '+20% velocita di movimento · +25 PV massimi', bonus: { speedMult: 0.20, maxHpFlat: 25 }, tinta: { steelDk: '#6a5220' } },
    { id: 'lad_passi', hero: 'ladro', slot: 'boots', rank: 4, cost: 950, name: 'Passi della Faglia', color: '#ffe9a8',
      desc: '+28% velocita di movimento · +45 PV massimi', bonus: { speedMult: 0.28, maxHpFlat: 45 }, tinta: { steelDk: '#4a3d6e' } },
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
