/* gear.js — CATALOGO DELL'EQUIPAGGIAMENTO (UMD)
   v2.12 — CENTOQUATTRO PEZZI, E DENTRO OGNI GRADO UN BIVIO.

   Da dove nasce. Parole di Paolo: «la gestione dell'inventario e delle abilita' non mi piace molto perche'
   secondo me il personaggio si sviluppa troppo poco». Misurato: in una run intera il giocatore prendeva 4
   carte passive, 2 abilita' attive, 1 specializzazione, ~14 punti statistica — e ZERO decisioni
   sull'equipaggiamento. L'equipaggiamento c'era ma era una SCALA: si comprava il pezzo dopo quando si
   avevano le monete. Una scala non e' una scelta.

   ================================ LA REGOLA CHE SI E' RIBALTATA ================================
   Fino alla 2.11 qui c'era scritto: «un rango piu' alto costa di piu' e ha statistiche migliori, SEMPRE —
   niente scambi alla pari, niente svantaggi nascosti». Era onesto ed era il problema.

   Adesso la regola e' un'altra, e ha due meta' che vanno tenute insieme:
   1. FRA UN GRADO E L'ALTRO SI SALE. Il divino batte il leggendario, sempre. Questo non e' cambiato.
   2. DENTRO LO STESSO GRADO NON SI SALE: SI SCEGLIE. I tre pezzi di uno stesso grado costano uguale e
      rendono uguale — sulle armi il danno al secondo sta dentro il 4% — e cambiano solo in COME si gioca.

   Il perche' del vincolo sul danno: se un'arma dello stesso grado rendesse di piu' non sarebbe un bivio,
   sarebbe una scelta giusta e due sbagliate, e il giocatore che se ne accorge smette di leggere.
   Il vincolo e' controllato da un test: se qualcuno ritocca un numero e sfonda il 4%, il test lo prende.

   ================================ I TRE CARATTERI ================================
   Gli stessi a ogni grado e per ogni classe, cosi' si imparano una volta sola:

     PESANTE      colpo forte, cadenza bassa   ·  difese: piu' protezione, RALLENTA e abbassa la cadenza
     EQUILIBRATA  la via di mezzo              ·  difese: la via di mezzo, senza penalita'
     LEGGERA      colpo debole, cadenza alta   ·  difese: meno protezione, VELOCIZZA e alza la cadenza

   E ogni carattere e' il migliore in UNA cosa e il peggiore nelle altre due — se no il "bivio" torna a
   essere una scala mascherata:

                    Guerriero        Mago               Ladro
     Pesante        rinculo          bolla grande       gittata
     Equilibrata    portata          gittata            perforazione
     Leggera        arco largo       bolla veloce       cadenza

   ================================ CINQUE GRADI ================================
   Deciso da Paolo: «nulla di gratuito, e l'equipaggiamento iniziale lo definirei come scarso, cosi' ha
   senso iniziare subito l'upgrade con armi perlomeno comuni».

     SCARSO       1 pezzo per slot   non si compra: e' cio' che hai addosso, ~20% sotto il comune
     COMUNE       3 pezzi per slot   si compra
     RARO         3                  si compra
     LEGGENDARIO  3                  si compra
     DIVINO       3                  si compra

   Fa 13 pezzi per slot e 104 in tutto (guerriero 3 slot, mago 2, ladro 3).

   ================================ LE TRE REGOLE DI SEMPRE ================================
   1. OGNI OGGETTO APPARTIENE A UNA CLASSE. Il guerriero vede solo roba da guerriero. La lista che arriva
      al client e' gia' filtrata dal server sull'eroe di chi guarda.
   2. GLI SLOT CAMBIANO DA CLASSE A CLASSE. Il guerriero ha lo scudo, il ladro le calzature, il mago
      nessuno dei due. Lo slot non e' una proprieta' del gioco ma della classe.
   3. IL CAMBIO E' LIBERO. Si compra qualunque pezzo dello slot in qualunque momento e quello vecchio
      viene rimpiazzato. Per questo i bonus NON si sommano man mano: il server ricalcola il totale da zero
      a ogni cambio (Room._recomputeGear), altrimenti sostituire un pezzo lascerebbe in giro il bonus di
      quello tolto.

   ================================ PREZZI ================================
   Armi 170 / 380 / 650 / 1100 · armature 150 / 340 / 600 / 1050 · scudi 160 / 360 / 620 / 1100 ·
   calzature 140 / 320 / 580 / 1000. Rivendita a META' prezzo; i pezzi scarsi, che non sono costati nulla,
   valgono VENDITA_SCARSO monete — simbolico, ma non zero: buttarli non dev'essere gratis.

   ATTENZIONE, un errore che e' gia' costato una taratura sbagliata: fino alla 2.11 qui c'era scritto che
   «il Mercato apre ogni 3 ondate». E' FALSO. Il villaggio si raggiunge alla fine di OGNI ondata —
   `vaiAlVillaggio` controlla solo che la fase sia PHASE_SHOP e che non sia l'ultima ondata. I prezzi di
   oggi sono tarati su quello, misurando le monete di una run vera.

   ================================ COME SI AGGIUNGE UN PEZZO ================================
   Una riga in ITEMS con hero/slot/rank/carattere/cost e il blocco `bonus` (oppure `weapon` per lo slot
   arma). Nient'altro: negozio, HUD, ricalcolo e test lo pescano da qui. Se lo slot e' nuovo per quella
   classe, aggiungerlo anche in SLOTS.

   E una cosa da NON dimenticare: il campo `tinta`. Il renderer lo legge in `_palGear` per RIDIPINGERE il
   personaggio quando cambi equipaggiamento. Se manca non crasha niente — `_palGear` controlla — ma il
   personaggio smette di cambiare aspetto, cioe' sparisce proprio la soddisfazione che questo catalogo
   esiste per dare. Un pezzo difensivo senza `tinta` e' un pezzo sbagliato.

   Le `desc` di questo file sono state generate dai numeri, non scritte a mano. Motivo: nella prima
   stesura una descrizione prometteva «bolla lenta e grossa» e il campo per la grandezza (`weapon.r`) non
   era nemmeno impostato. Una descrizione scritta a mano puo' mentire; una calcolata no. Chi tocca un
   numero aggiorni la desc nella stessa riga. */
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

  // v2.12 — CINQUE GRADI, non piu' quattro. L'indice e' `rank - 1`: chi scrive un array indicizzato per
  // rango da qualche altra parte si ricordi che adesso sono cinque (e' gia' successo: in renderer.js un
  // array di quattro valori faceva sparire l'arco del ladro al grado divino).
  const RANK_RARITY = ['scarso', 'common', 'rare', 'legendary', 'divine'];

  // I tre caratteri, con l'ordine in cui vanno mostrati. L'ordine e' pesante -> equilibrata -> leggera
  // perche' e' quello in cui si leggono naturalmente: dal piu' lento al piu' svelto.
  const CARATTERI = {
    pesante:     { name: 'Pesante',     icon: '▰', ord: 0, desc: 'Colpo forte, cadenza bassa. Sulle difese: piu\' protezione, ma rallenta.' },
    equilibrata: { name: 'Equilibrata', icon: '▱', ord: 1, desc: 'La via di mezzo, senza penalita\'.' },
    leggera:     { name: 'Leggera',     icon: '▫', ord: 2, desc: 'Colpo debole, cadenza alta. Sulle difese: meno protezione, ma velocizza.' },
  };
  const CAR_ORD = c => (CARATTERI[c] ? CARATTERI[c].ord : 1);

  // ================================ IL LISTINO, IN UN POSTO SOLO ================================
  // v2.12 — I prezzi NON stanno piu' scritti su ogni pezzo. Stavano, e c'erano 104 occasioni perche' due
  // pezzi dello stesso grado finissero a prezzi diversi per una distrazione — che e' esattamente la cosa
  // che il bivio non puo' permettersi: se il pesante costa meno dell'equilibrato, il bivio e' truccato.
  // Qui c'e' una riga per slot, indicizzata per grado, e il costo viene stampato sui pezzi qui sotto.
  // Cambiare la taratura dei prezzi vuol dire cambiare QUESTE quattro righe e nient'altro.
  //
  // Da dove vengono questi numeri: da una misura, non da una sensazione. `test/monete.js` conta le monete
  // che ogni ondata CONTIENE (stessa formula di Room._killMonster, stessa composizione di Waves.buildWave)
  // e le somma. Chi vuole ritarare il listino faccia girare quello prima, non dopo.
  const PREZZI = {
    weapon: [0, 170, 380, 650, 1100],
    armor:  [0, 150, 340, 600, 1050],
    shield: [0, 160, 360, 620, 1100],
    boots:  [0, 140, 320, 580, 1000],
  };

  // `weapon` sostituisce INTERAMENTE l'arma dell'eroe (la scuola resta quella della classe, altrimenti
  // le statistiche smetterebbero di funzionare). `bonus` e' additivo e viene ricalcolato da zero.
  const ITEMS = [

    // ============================== GUERRIERO ==============================
    // ARMI. Dentro ogni grado il danno al secondo e' lo stesso a meno del 4%: cio' che cambia e'
    // la portata contro l'arco contro il rinculo.
    { id: 'gue_w_spada_scheggiata', hero: 'guerriero', slot: 'weapon', rank: 1, carattere: 'equilibrata',
      name: 'Spada Scheggiata', color: '#7a7f8a', desc: 'Portata 88 · arco 109° · 79 danni/s · rinculo 120',
      weapon: { name: 'Spada Scheggiata', melee: true, dmg: 44, fireRate: 1.8, arcRadius: 88, arcHalf: 0.95, knockback: 120, projColor: '#bdb39a', spread: 0, bulletSpeed: 0, range: 88, pierce: 0 } },
    { id: 'gue_w_spadone', hero: 'guerriero', slot: 'weapon', rank: 2, carattere: 'pesante',
      name: 'Spadone', color: '#b8c0cc', desc: 'Portata 86 · arco 94° · 99 danni/s · rinculo 300',
      weapon: { name: 'Spadone', melee: true, dmg: 86, fireRate: 1.15, arcRadius: 86, arcHalf: 0.82, knockback: 300, projColor: '#ffd27a', spread: 0, bulletSpeed: 0, range: 86, pierce: 0 } },
    { id: 'gue_w_spada', hero: 'guerriero', slot: 'weapon', rank: 2, carattere: 'equilibrata',
      name: 'Spada', color: '#b8c0cc', desc: 'Portata 100 · arco 109° · 99 danni/s · rinculo 150',
      weapon: { name: 'Spada', melee: true, dmg: 55, fireRate: 1.8, arcRadius: 100, arcHalf: 0.95, knockback: 150, projColor: '#ffd27a', spread: 0, bulletSpeed: 0, range: 100, pierce: 0 } },
    { id: 'gue_w_sciabola', hero: 'guerriero', slot: 'weapon', rank: 2, carattere: 'leggera',
      name: 'Sciabola', color: '#b8c0cc', desc: 'Portata 88 · arco 140° · 97 danni/s · rinculo 82',
      weapon: { name: 'Sciabola', melee: true, dmg: 36, fireRate: 2.7, arcRadius: 88, arcHalf: 1.22, knockback: 82, projColor: '#ffd27a', spread: 0, bulletSpeed: 0, range: 88, pierce: 0 } },
    { id: 'gue_w_ascia_da_guerra', hero: 'guerriero', slot: 'weapon', rank: 3, carattere: 'pesante',
      name: 'Ascia da Guerra', color: '#3aa0ff', desc: 'Portata 96 · arco 94° · 116 danni/s · rinculo 330',
      weapon: { name: 'Ascia da Guerra', melee: true, dmg: 105, fireRate: 1.1, arcRadius: 96, arcHalf: 0.82, knockback: 330, projColor: '#cfe6ff', spread: 0, bulletSpeed: 0, range: 96, pierce: 0 } },
    { id: 'gue_w_spada_lunga', hero: 'guerriero', slot: 'weapon', rank: 3, carattere: 'equilibrata',
      name: 'Spada Lunga', color: '#3aa0ff', desc: 'Portata 112 · arco 109° · 115 danni/s · rinculo 165',
      weapon: { name: 'Spada Lunga', melee: true, dmg: 82, fireRate: 1.4, arcRadius: 112, arcHalf: 0.95, knockback: 165, projColor: '#cfe6ff', spread: 0, bulletSpeed: 0, range: 112, pierce: 0 } },
    { id: 'gue_w_scimitarra', hero: 'guerriero', slot: 'weapon', rank: 3, carattere: 'leggera',
      name: 'Scimitarra', color: '#3aa0ff', desc: 'Portata 99 · arco 140° · 117 danni/s · rinculo 90',
      weapon: { name: 'Scimitarra', melee: true, dmg: 52, fireRate: 2.25, arcRadius: 99, arcHalf: 1.22, knockback: 90, projColor: '#cfe6ff', spread: 0, bulletSpeed: 0, range: 99, pierce: 0 } },
    { id: 'gue_w_maglio', hero: 'guerriero', slot: 'weapon', rank: 4, carattere: 'pesante',
      name: 'Maglio', color: '#ffb020', desc: 'Portata 110 · arco 94° · 131 danni/s · rinculo 370',
      weapon: { name: 'Maglio', melee: true, dmg: 145, fireRate: 0.9, arcRadius: 110, arcHalf: 0.82, knockback: 370, projColor: '#ffe1a0', spread: 0, bulletSpeed: 0, range: 110, pierce: 0 } },
    { id: 'gue_w_alabarda', hero: 'guerriero', slot: 'weapon', rank: 4, carattere: 'equilibrata',
      name: 'Alabarda', color: '#ffb020', desc: 'Portata 128 · arco 109° · 130 danni/s · rinculo 185',
      weapon: { name: 'Alabarda', melee: true, dmg: 118, fireRate: 1.1, arcRadius: 128, arcHalf: 0.95, knockback: 185, projColor: '#ffe1a0', spread: 0, bulletSpeed: 0, range: 128, pierce: 0 } },
    { id: 'gue_w_falcione', hero: 'guerriero', slot: 'weapon', rank: 4, carattere: 'leggera',
      name: 'Falcione', color: '#ffb020', desc: 'Portata 113 · arco 140° · 130 danni/s · rinculo 100',
      weapon: { name: 'Falcione', melee: true, dmg: 62, fireRate: 2.1, arcRadius: 113, arcHalf: 1.22, knockback: 100, projColor: '#ffe1a0', spread: 0, bulletSpeed: 0, range: 113, pierce: 0 } },
    { id: 'gue_w_maglio_del_vuoto', hero: 'guerriero', slot: 'weapon', rank: 5, carattere: 'pesante',
      name: 'Maglio del Vuoto', color: '#ffe9a8', desc: 'Portata 125 · arco 94° · 157 danni/s · rinculo 420',
      weapon: { name: 'Maglio del Vuoto', melee: true, dmg: 185, fireRate: 0.85, arcRadius: 125, arcHalf: 0.82, knockback: 420, projColor: '#e6d0ff', spread: 0, bulletSpeed: 0, range: 125, pierce: 0 } },
    { id: 'gue_w_falce_della_faglia', hero: 'guerriero', slot: 'weapon', rank: 5, carattere: 'equilibrata',
      name: 'Falce della Faglia', color: '#ffe9a8', desc: 'Portata 145 · arco 109° · 158 danni/s · rinculo 210',
      weapon: { name: 'Falce della Faglia', melee: true, dmg: 150, fireRate: 1.05, arcRadius: 145, arcHalf: 0.95, knockback: 210, projColor: '#e6d0ff', spread: 0, bulletSpeed: 0, range: 145, pierce: 0 } },
    { id: 'gue_w_lama_d_ossidiana', hero: 'guerriero', slot: 'weapon', rank: 5, carattere: 'leggera',
      name: 'Lama d’Ossidiana', color: '#ffe9a8', desc: 'Portata 128 · arco 140° · 160 danni/s · rinculo 115',
      weapon: { name: 'Lama d’Ossidiana', melee: true, dmg: 76, fireRate: 2.1, arcRadius: 128, arcHalf: 1.22, knockback: 115, projColor: '#e6d0ff', spread: 0, bulletSpeed: 0, range: 128, pierce: 0 } },

    { id: 'gue_a_casacca_rattoppata', hero: 'guerriero', slot: 'armor', rank: 1, carattere: 'equilibrata',
      name: 'Casacca Rattoppata', color: '#7a7f8a', desc: '+6 PV · −2% danni subiti',
      bonus: { maxHpFlat: 6, dmgReduce: 0.02 }, tinta: { metallo: '#6b6f78', cloth: '#4a4438', clothDk: '#2a251d', steelDk: '#33373d' } },
    { id: 'gue_a_corazza_di_ferro', hero: 'guerriero', slot: 'armor', rank: 2, carattere: 'pesante',
      name: 'Corazza di Ferro', color: '#b8c0cc', desc: '+50 PV · −13% danni subiti · −6% passo · −6% cadenza',
      bonus: { maxHpFlat: 50, dmgReduce: 0.13, speedMult: -0.06, fireRateMult: -0.06 }, tinta: { metallo: '#68707a', cloth: '#344a24', clothDk: '#1e2b12', steelDk: '#303640' } },
    { id: 'gue_a_maglia_di_ferro', hero: 'guerriero', slot: 'armor', rank: 2, carattere: 'equilibrata',
      name: 'Maglia di Ferro', color: '#b8c0cc', desc: '+35 PV · −10% danni subiti',
      bonus: { maxHpFlat: 35, dmgReduce: 0.1 }, tinta: { metallo: '#7f8895', cloth: '#3f5a2c', clothDk: '#243516', steelDk: '#3a424e' } },
    { id: 'gue_a_giaco_imbottito', hero: 'guerriero', slot: 'armor', rank: 2, carattere: 'leggera',
      name: 'Giaco Imbottito', color: '#b8c0cc', desc: '+20 PV · −6% danni subiti · +5% passo · +5% cadenza',
      bonus: { maxHpFlat: 20, dmgReduce: 0.06, speedMult: 0.05, fireRateMult: 0.05 }, tinta: { metallo: '#939ba6', cloth: '#5e744e', clothDk: '#47553b', steelDk: '#5a606a' } },
    { id: 'gue_a_piastre_pesanti', hero: 'guerriero', slot: 'armor', rank: 3, carattere: 'pesante',
      name: 'Piastre Pesanti', color: '#3aa0ff', desc: '+85 PV · −17% danni subiti · −8% passo · −8% cadenza',
      bonus: { maxHpFlat: 85, dmgReduce: 0.17, speedMult: -0.08, fireRateMult: -0.08 }, tinta: { metallo: '#8293a7', cloth: '#233d5d', clothDk: '#122134', steelDk: '#2f394b' } },
    { id: 'gue_a_armatura_a_piastre', hero: 'guerriero', slot: 'armor', rank: 3, carattere: 'equilibrata',
      name: 'Armatura a Piastre', color: '#3aa0ff', desc: '+60 PV · −14% danni subiti',
      bonus: { maxHpFlat: 60, dmgReduce: 0.14 }, tinta: { metallo: '#9fb3cc', cloth: '#2b4a72', clothDk: '#16283f', steelDk: '#39465c' } },
    { id: 'gue_a_corsaletto_leggero', hero: 'guerriero', slot: 'armor', rank: 3, carattere: 'leggera',
      name: 'Corsaletto Leggero', color: '#3aa0ff', desc: '+40 PV · −9% danni subiti · +7% passo · +7% cadenza',
      bonus: { maxHpFlat: 40, dmgReduce: 0.09, speedMult: 0.07, fireRateMult: 0.07 }, tinta: { metallo: '#aebfd4', cloth: '#4d6789', clothDk: '#3b4a5e', steelDk: '#596476' } },
    { id: 'gue_a_corazza_del_baluardo', hero: 'guerriero', slot: 'armor', rank: 4, carattere: 'pesante',
      name: 'Corazza del Baluardo', color: '#ffb020', desc: '+120 PV · −21% danni subiti · −9% passo · −9% cadenza',
      bonus: { maxHpFlat: 120, dmgReduce: 0.21, speedMult: -0.09, fireRateMult: -0.09 }, tinta: { metallo: '#a58640', cloth: '#4d3414', clothDk: '#2a1b09', steelDk: '#3d3017' } },
    { id: 'gue_a_usbergo_di_maglia', hero: 'guerriero', slot: 'armor', rank: 4, carattere: 'equilibrata',
      name: 'Usbergo di Maglia', color: '#ffb020', desc: '+90 PV · −17% danni subiti',
      bonus: { maxHpFlat: 90, dmgReduce: 0.17 }, tinta: { metallo: '#c9a44e', cloth: '#5e3f18', clothDk: '#33210b', steelDk: '#4a3a1c' } },
    { id: 'gue_a_scaglie_slanciate', hero: 'guerriero', slot: 'armor', rank: 4, carattere: 'leggera',
      name: 'Scaglie Slanciate', color: '#ffb020', desc: '+60 PV · −12% danni subiti · +9% passo · +9% cadenza',
      bonus: { maxHpFlat: 60, dmgReduce: 0.12, speedMult: 0.09, fireRateMult: 0.09 }, tinta: { metallo: '#d2b36a', cloth: '#785e3d', clothDk: '#544532', steelDk: '#675a40' } },
    { id: 'gue_a_egida_di_ossidiana', hero: 'guerriero', slot: 'armor', rank: 5, carattere: 'pesante',
      name: 'Egida di Ossidiana', color: '#ffe9a8', desc: '+165 PV · −26% danni subiti · −10% passo · −10% cadenza',
      bonus: { maxHpFlat: 165, dmgReduce: 0.26, speedMult: -0.1, fireRateMult: -0.1 }, tinta: { metallo: '#3d384f', cloth: '#22193d', clothDk: '#110c22', steelDk: '#221e34' } },
    { id: 'gue_a_corazza_delle_ere', hero: 'guerriero', slot: 'armor', rank: 5, carattere: 'equilibrata',
      name: 'Corazza delle Ere', color: '#ffe9a8', desc: '+130 PV · −21% danni subiti',
      bonus: { maxHpFlat: 130, dmgReduce: 0.21 }, tinta: { metallo: '#4a4460', cloth: '#2a1f4a', clothDk: '#150f2a', steelDk: '#2a2440' } },
    { id: 'gue_a_scaglie_del_vento', hero: 'guerriero', slot: 'armor', rank: 5, carattere: 'leggera',
      name: 'Scaglie del Vento', color: '#ffe9a8', desc: '+90 PV · −15% danni subiti · +11% passo · +11% cadenza',
      bonus: { maxHpFlat: 90, dmgReduce: 0.15, speedMult: 0.11, fireRateMult: 0.11 }, tinta: { metallo: '#676279', cloth: '#4c4367', clothDk: '#3a354c', steelDk: '#4c475f' } },

    { id: 'gue_s_tavola_inchiodata', hero: 'guerriero', slot: 'shield', rank: 1, carattere: 'equilibrata',
      name: 'Tavola Inchiodata', color: '#7a7f8a', desc: '−2% danni subiti · −25% dai colpi FRONTALI',
      bonus: { dmgReduce: 0.02, frontale: 0.25 }, tinta: { scudo: '#6b6f78', orlo: '#8a7a3a' } },
    { id: 'gue_s_scudo_a_torre', hero: 'guerriero', slot: 'shield', rank: 2, carattere: 'pesante',
      name: 'Scudo a Torre', color: '#b8c0cc', desc: '+20 PV · −12% danni subiti · −60% dai colpi FRONTALI · −5% passo · −5% cadenza',
      bonus: { dmgReduce: 0.12, maxHpFlat: 20, frontale: 0.6, speedMult: -0.05, fireRateMult: -0.05 }, tinta: { scudo: '#747c87', orlo: '#a48530' } },
    { id: 'gue_s_scudo', hero: 'guerriero', slot: 'shield', rank: 2, carattere: 'equilibrata',
      name: 'Scudo', color: '#b8c0cc', desc: '+10 PV · −9% danni subiti · −48% dai colpi FRONTALI',
      bonus: { dmgReduce: 0.09, maxHpFlat: 10, frontale: 0.48 }, tinta: { scudo: '#8d97a5', orlo: '#c8a23a' } },
    { id: 'gue_s_brocchiere', hero: 'guerriero', slot: 'shield', rank: 2, carattere: 'leggera',
      name: 'Brocchiere', color: '#b8c0cc', desc: '−5% danni subiti · −35% dai colpi FRONTALI · +5% passo · +6% cadenza',
      bonus: { dmgReduce: 0.05, frontale: 0.35, speedMult: 0.05, fireRateMult: 0.06 }, tinta: { scudo: '#9fa8b3', orlo: '#d1b15a' } },
    { id: 'gue_s_pavese', hero: 'guerriero', slot: 'shield', rank: 3, carattere: 'pesante',
      name: 'Pavese', color: '#3aa0ff', desc: '+35 PV · −16% danni subiti · −70% dai colpi FRONTALI · −6% passo · −6% cadenza',
      bonus: { dmgReduce: 0.16, maxHpFlat: 35, frontale: 0.7, speedMult: -0.06, fireRateMult: -0.06 }, tinta: { scudo: '#798ba2', orlo: '#a48530' } },
    { id: 'gue_s_scudo_rinforzato', hero: 'guerriero', slot: 'shield', rank: 3, carattere: 'equilibrata',
      name: 'Scudo Rinforzato', color: '#3aa0ff', desc: '+22 PV · −13% danni subiti · −58% dai colpi FRONTALI',
      bonus: { dmgReduce: 0.13, maxHpFlat: 22, frontale: 0.58 }, tinta: { scudo: '#93a9c6', orlo: '#c8a23a' } },
    { id: 'gue_s_targa_leggera', hero: 'guerriero', slot: 'shield', rank: 3, carattere: 'leggera',
      name: 'Targa Leggera', color: '#3aa0ff', desc: '+10 PV · −8% danni subiti · −42% dai colpi FRONTALI · +6% passo · +7% cadenza',
      bonus: { dmgReduce: 0.08, maxHpFlat: 10, frontale: 0.42, speedMult: 0.06, fireRateMult: 0.07 }, tinta: { scudo: '#a4b7cf', orlo: '#d1b15a' } },
    { id: 'gue_s_muro_dacciaio', hero: 'guerriero', slot: 'shield', rank: 4, carattere: 'pesante',
      name: 'Muro d\'Acciaio', color: '#ffb020', desc: '+50 PV · −20% danni subiti · −78% dai colpi FRONTALI · −7% passo · −7% cadenza',
      bonus: { dmgReduce: 0.2, maxHpFlat: 50, frontale: 0.78, speedMult: -0.07, fireRateMult: -0.07 }, tinta: { scudo: '#a58640', orlo: '#d1c59d' } },
    { id: 'gue_s_scudo_del_baluardo', hero: 'guerriero', slot: 'shield', rank: 4, carattere: 'equilibrata',
      name: 'Scudo del Baluardo', color: '#ffb020', desc: '+34 PV · −16% danni subiti · −66% dai colpi FRONTALI',
      bonus: { dmgReduce: 0.16, maxHpFlat: 34, frontale: 0.66 }, tinta: { scudo: '#c9a44e', orlo: '#fff0c0' } },
    { id: 'gue_s_rotella_veloce', hero: 'guerriero', slot: 'shield', rank: 4, carattere: 'leggera',
      name: 'Rotella Veloce', color: '#ffb020', desc: '+16 PV · −10% danni subiti · −48% dai colpi FRONTALI · +8% passo · +9% cadenza',
      bonus: { dmgReduce: 0.1, maxHpFlat: 16, frontale: 0.48, speedMult: 0.08, fireRateMult: 0.09 }, tinta: { scudo: '#d2b36a', orlo: '#fff2ca' } },
    { id: 'gue_s_aegis_della_faglia', hero: 'guerriero', slot: 'shield', rank: 5, carattere: 'pesante',
      name: 'Aegis della Faglia', color: '#ffe9a8', desc: '+70 PV · −25% danni subiti · −85% dai colpi FRONTALI · −8% passo · −8% cadenza',
      bonus: { dmgReduce: 0.25, maxHpFlat: 70, frontale: 0.85, speedMult: -0.08, fireRateMult: -0.08 }, tinta: { scudo: '#574a8a', orlo: '#bdabd1' } },
    { id: 'gue_s_egida_delle_ere', hero: 'guerriero', slot: 'shield', rank: 5, carattere: 'equilibrata',
      name: 'Egida delle Ere', color: '#ffe9a8', desc: '+50 PV · −20% danni subiti · −74% dai colpi FRONTALI',
      bonus: { dmgReduce: 0.2, maxHpFlat: 50, frontale: 0.74 }, tinta: { scudo: '#6a5aa8', orlo: '#e6d0ff' } },
    { id: 'gue_s_rotella_dombra', hero: 'guerriero', slot: 'shield', rank: 5, carattere: 'leggera',
      name: 'Rotella d\'Ombra', color: '#ffe9a8', desc: '+24 PV · −12% danni subiti · −52% dai colpi FRONTALI · +10% passo · +11% cadenza',
      bonus: { dmgReduce: 0.12, maxHpFlat: 24, frontale: 0.52, speedMult: 0.1, fireRateMult: 0.11 }, tinta: { scudo: '#8274b6', orlo: '#ead8ff' } },

    // ============================== MAGO ==============================
    // ARMI. Dentro ogni grado il danno al secondo e' lo stesso a meno del 4%: cio' che cambia e'
    // la GRANDEZZA della bolla contro la sua velocita' contro la gittata.
    { id: 'mag_w_bastone_nodoso', hero: 'mago', slot: 'weapon', rank: 1, carattere: 'equilibrata',
      name: 'Bastone Nodoso', color: '#7a7f8a', desc: 'Bolla r9 · 420 px/s · gittata 520 · 78 danni/s',
      weapon: { name: 'Bastone Nodoso', dmg: 52, fireRate: 1.5, spread: 0.02, bulletSpeed: 420, range: 520, pierce: 0, projColor: '#8fa0a8', knockback: 30, bubble: true, r: 9 } },
    { id: 'mag_w_scettro_di_piombo', hero: 'mago', slot: 'weapon', rank: 2, carattere: 'pesante',
      name: 'Scettro di Piombo', color: '#b8c0cc', desc: 'Bolla r16 · 330 px/s · gittata 520 · 99 danni/s',
      weapon: { name: 'Scettro di Piombo', dmg: 99, fireRate: 1, spread: 0.02, bulletSpeed: 330, range: 520, pierce: 0, projColor: '#00f0c8', knockback: 72, bubble: true, r: 16 } },
    { id: 'mag_w_bacchetta_di_frassino', hero: 'mago', slot: 'weapon', rank: 2, carattere: 'equilibrata',
      name: 'Bacchetta di Frassino', color: '#b8c0cc', desc: 'Bolla r10 · 450 px/s · gittata 640 · 99 danni/s',
      weapon: { name: 'Bacchetta di Frassino', dmg: 66, fireRate: 1.5, spread: 0.02, bulletSpeed: 450, range: 640, pierce: 0, projColor: '#00f0c8', knockback: 45, bubble: true, r: 10 } },
    { id: 'mag_w_verga_scintillante', hero: 'mago', slot: 'weapon', rank: 2, carattere: 'leggera',
      name: 'Verga Scintillante', color: '#b8c0cc', desc: 'Bolla r6 · 700 px/s · gittata 520 · 98 danni/s',
      weapon: { name: 'Verga Scintillante', dmg: 41, fireRate: 2.4, spread: 0.02, bulletSpeed: 700, range: 520, pierce: 0, projColor: '#00f0c8', knockback: 23, bubble: true, r: 6 } },
    { id: 'mag_w_scettro_runico', hero: 'mago', slot: 'weapon', rank: 3, carattere: 'pesante',
      name: 'Scettro Runico', color: '#3aa0ff', desc: 'Bolla r18 · 350 px/s · gittata 540 · 115 danni/s · perfora 1',
      weapon: { name: 'Scettro Runico', dmg: 115, fireRate: 1, spread: 0.02, bulletSpeed: 350, range: 540, pierce: 1, projColor: '#c48cff', knockback: 96, bubble: true, r: 18 } },
    { id: 'mag_w_bastone_d_ebano', hero: 'mago', slot: 'weapon', rank: 3, carattere: 'equilibrata',
      name: 'Bastone d’Ebano', color: '#3aa0ff', desc: 'Bolla r11 · 480 px/s · gittata 680 · 116 danni/s',
      weapon: { name: 'Bastone d’Ebano', dmg: 77, fireRate: 1.5, spread: 0.02, bulletSpeed: 480, range: 680, pierce: 0, projColor: '#c48cff', knockback: 60, bubble: true, r: 11 } },
    { id: 'mag_w_verga_crepitante', hero: 'mago', slot: 'weapon', rank: 3, carattere: 'leggera',
      name: 'Verga Crepitante', color: '#3aa0ff', desc: 'Bolla r6.5 · 760 px/s · gittata 540 · 115 danni/s',
      weapon: { name: 'Verga Crepitante', dmg: 48, fireRate: 2.4, spread: 0.02, bulletSpeed: 760, range: 540, pierce: 0, projColor: '#c48cff', knockback: 30, bubble: true, r: 6.5 } },
    { id: 'mag_w_bastone_del_vuoto', hero: 'mago', slot: 'weapon', rank: 4, carattere: 'pesante',
      name: 'Bastone del Vuoto', color: '#ffb020', desc: 'Bolla r21 · 370 px/s · gittata 560 · 130 danni/s · perfora 2',
      weapon: { name: 'Bastone del Vuoto', dmg: 130, fireRate: 1, spread: 0.02, bulletSpeed: 370, range: 560, pierce: 2, projColor: '#7ffbe4', knockback: 120, bubble: true, r: 21 } },
    { id: 'mag_w_scettro_del_conclave', hero: 'mago', slot: 'weapon', rank: 4, carattere: 'equilibrata',
      name: 'Scettro del Conclave', color: '#ffb020', desc: 'Bolla r12 · 510 px/s · gittata 720 · 131 danni/s · perfora 1',
      weapon: { name: 'Scettro del Conclave', dmg: 87, fireRate: 1.5, spread: 0.02, bulletSpeed: 510, range: 720, pierce: 1, projColor: '#7ffbe4', knockback: 75, bubble: true, r: 12 } },
    { id: 'mag_w_verga_delle_schegge', hero: 'mago', slot: 'weapon', rank: 4, carattere: 'leggera',
      name: 'Verga delle Schegge', color: '#ffb020', desc: 'Bolla r7 · 820 px/s · gittata 560 · 130 danni/s',
      weapon: { name: 'Verga delle Schegge', dmg: 54, fireRate: 2.4, spread: 0.02, bulletSpeed: 820, range: 560, pierce: 0, projColor: '#7ffbe4', knockback: 38, bubble: true, r: 7 } },
    { id: 'mag_w_rovina_delle_ere', hero: 'mago', slot: 'weapon', rank: 5, carattere: 'pesante',
      name: 'Rovina delle Ere', color: '#ffe9a8', desc: 'Bolla r24 · 390 px/s · gittata 580 · 158 danni/s · perfora 3',
      weapon: { name: 'Rovina delle Ere', dmg: 158, fireRate: 1, spread: 0.02, bulletSpeed: 390, range: 580, pierce: 3, projColor: '#ffd9ff', knockback: 144, bubble: true, r: 24 } },
    { id: 'mag_w_scettro_delle_stelle_morte', hero: 'mago', slot: 'weapon', rank: 5, carattere: 'equilibrata',
      name: 'Scettro delle Stelle Morte', color: '#ffe9a8', desc: 'Bolla r14 · 540 px/s · gittata 760 · 158 danni/s · perfora 2',
      weapon: { name: 'Scettro delle Stelle Morte', dmg: 105, fireRate: 1.5, spread: 0.02, bulletSpeed: 540, range: 760, pierce: 2, projColor: '#ffd9ff', knockback: 90, bubble: true, r: 14 } },
    { id: 'mag_w_verga_del_vuoto', hero: 'mago', slot: 'weapon', rank: 5, carattere: 'leggera',
      name: 'Verga del Vuoto', color: '#ffe9a8', desc: 'Bolla r7.5 · 880 px/s · gittata 580 · 158 danni/s',
      weapon: { name: 'Verga del Vuoto', dmg: 66, fireRate: 2.4, spread: 0.02, bulletSpeed: 880, range: 580, pierce: 0, projColor: '#ffd9ff', knockback: 45, bubble: true, r: 7.5 } },

    { id: 'mag_a_saio_liso', hero: 'mago', slot: 'armor', rank: 1, carattere: 'equilibrata',
      name: 'Saio Liso', color: '#7a7f8a', desc: '+6 PV',
      bonus: { maxHpFlat: 6 }, tinta: { body: '#4a4438', bodyDk: '#221f18', orlo: '#6b6357', accent: '#9aa0a8' } },
    { id: 'mag_a_manto_pesante', hero: 'mago', slot: 'armor', rank: 2, carattere: 'pesante',
      name: 'Manto Pesante', color: '#b8c0cc', desc: '+45 PV · −10% danni subiti · −5% passo · −5% cadenza',
      bonus: { maxHpFlat: 45, dmgReduce: 0.1, speedMult: -0.05, fireRateMult: -0.05 }, tinta: { body: '#323173', bodyDk: '#101030', orlo: '#5b57b1', accent: '#00c5a4' } },
    { id: 'mag_a_veste_da_apprendista', hero: 'mago', slot: 'armor', rank: 2, carattere: 'equilibrata',
      name: 'Veste da Apprendista', color: '#b8c0cc', desc: '+30 PV · −7% danni subiti',
      bonus: { maxHpFlat: 30, dmgReduce: 0.07 }, tinta: { body: '#3d3c8c', bodyDk: '#14133a', orlo: '#6f6ad8', accent: '#00f0c8' } },
    { id: 'mag_a_tunica_leggera', hero: 'mago', slot: 'armor', rank: 2, carattere: 'leggera',
      name: 'Tunica Leggera', color: '#b8c0cc', desc: '+18 PV · −4% danni subiti · +6% passo · +6% cadenza',
      bonus: { maxHpFlat: 18, dmgReduce: 0.04, speedMult: 0.06, fireRateMult: 0.06 }, tinta: { body: '#5c5b9e', bodyDk: '#3a395a', orlo: '#8682de', accent: '#29f2d1' } },
    { id: 'mag_a_toga_del_conclave', hero: 'mago', slot: 'armor', rank: 3, carattere: 'pesante',
      name: 'Toga del Conclave', color: '#3aa0ff', desc: '+78 PV · −14% danni subiti · −6% passo · −6% cadenza',
      bonus: { maxHpFlat: 78, dmgReduce: 0.14, speedMult: -0.06, fireRateMult: -0.06 }, tinta: { body: '#224175', bodyDk: '#0d1932', orlo: '#689dd1', accent: '#68b4d1' } },
    { id: 'mag_a_manto_dellarcanista', hero: 'mago', slot: 'armor', rank: 3, carattere: 'equilibrata',
      name: 'Manto dell\'Arcanista', color: '#3aa0ff', desc: '+55 PV · −11% danni subiti',
      bonus: { maxHpFlat: 55, dmgReduce: 0.11 }, tinta: { body: '#2a4f8f', bodyDk: '#101f3d', orlo: '#7fc0ff', accent: '#7fdcff' } },
    { id: 'mag_a_seta_runica', hero: 'mago', slot: 'armor', rank: 3, carattere: 'leggera',
      name: 'Seta Runica', color: '#3aa0ff', desc: '+36 PV · −7% danni subiti · +8% passo · +8% cadenza',
      bonus: { maxHpFlat: 36, dmgReduce: 0.07, speedMult: 0.08, fireRateMult: 0.08 }, tinta: { body: '#4c6ba1', bodyDk: '#36435c', orlo: '#93caff', accent: '#93e2ff' } },
    { id: 'mag_a_paramento_di_pietra', hero: 'mago', slot: 'armor', rank: 4, carattere: 'pesante',
      name: 'Paramento di Pietra', color: '#ffb020', desc: '+110 PV · −18% danni subiti · −7% passo · −7% cadenza',
      bonus: { maxHpFlat: 110, dmgReduce: 0.18, speedMult: -0.07, fireRateMult: -0.07 }, tinta: { body: '#58276e', bodyDk: '#220c2e', orlo: '#c59d4f', accent: '#b885d1' } },
    { id: 'mag_a_toga_delle_rune', hero: 'mago', slot: 'armor', rank: 4, carattere: 'equilibrata',
      name: 'Toga delle Rune', color: '#ffb020', desc: '+82 PV · −14% danni subiti',
      bonus: { maxHpFlat: 82, dmgReduce: 0.14 }, tinta: { body: '#6b2f86', bodyDk: '#2a0f38', orlo: '#f0c060', accent: '#e0a2ff' } },
    { id: 'mag_a_velo_rapido', hero: 'mago', slot: 'armor', rank: 4, carattere: 'leggera',
      name: 'Velo Rapido', color: '#ffb020', desc: '+55 PV · −10% danni subiti · +10% passo · +10% cadenza',
      bonus: { maxHpFlat: 55, dmgReduce: 0.1, speedMult: 0.1, fireRateMult: 0.1 }, tinta: { body: '#835099', bodyDk: '#4c3558', orlo: '#f2ca79', accent: '#e5b1ff' } },
    { id: 'mag_a_manto_delle_ere', hero: 'mago', slot: 'armor', rank: 5, carattere: 'pesante',
      name: 'Manto delle Ere', color: '#ffe9a8', desc: '+150 PV · −22% danni subiti · −8% passo · −8% cadenza',
      bonus: { maxHpFlat: 150, dmgReduce: 0.22, speedMult: -0.08, fireRateMult: -0.08 }, tinta: { body: '#161327', bodyDk: '#080713', orlo: '#d1bf8a', accent: '#d1c59d' } },
    { id: 'mag_a_paramento_stellare', hero: 'mago', slot: 'armor', rank: 5, carattere: 'equilibrata',
      name: 'Paramento Stellare', color: '#ffe9a8', desc: '+118 PV · −18% danni subiti',
      bonus: { maxHpFlat: 118, dmgReduce: 0.18 }, tinta: { body: '#1b1730', bodyDk: '#0a0817', orlo: '#ffe9a8', accent: '#fff0c0' } },
    { id: 'mag_a_velo_del_vuoto', hero: 'mago', slot: 'armor', rank: 5, carattere: 'leggera',
      name: 'Velo del Vuoto', color: '#ffe9a8', desc: '+80 PV · −13% danni subiti · +12% passo · +12% cadenza',
      bonus: { maxHpFlat: 80, dmgReduce: 0.13, speedMult: 0.12, fireRateMult: 0.12 }, tinta: { body: '#3f3c51', bodyDk: '#31303c', orlo: '#ffedb6', accent: '#fff2ca' } },

    // ============================== LADRO ==============================
    // ARMI. Dentro ogni grado il danno al secondo e' lo stesso a meno del 4%: cio' che cambia e'
    // la gittata contro la perforazione contro la cadenza.
    { id: 'lad_w_arco_sfibrato', hero: 'ladro', slot: 'weapon', rank: 1, carattere: 'equilibrata',
      name: 'Arco Sfibrato', color: '#7a7f8a', desc: 'Gittata 560 · 800 px/s · 78 danni/s · dispersione ±3°',
      weapon: { name: 'Arco Sfibrato', dmg: 34, fireRate: 2.3, spread: 0.06, bulletSpeed: 800, range: 560, pierce: 0, projColor: '#a89a7a', knockback: 15, arrow: true } },
    { id: 'lad_w_arco_lungo', hero: 'ladro', slot: 'weapon', rank: 2, carattere: 'pesante',
      name: 'Arco Lungo', color: '#b8c0cc', desc: 'Gittata 900 · 1050 px/s · 99 danni/s · dispersione ±1°',
      weapon: { name: 'Arco Lungo', dmg: 62, fireRate: 1.6, spread: 0.02, bulletSpeed: 1050, range: 900, pierce: 0, projColor: '#9ef0b0', knockback: 40, arrow: true } },
    { id: 'lad_w_arco_corto', hero: 'ladro', slot: 'weapon', rank: 2, carattere: 'equilibrata',
      name: 'Arco Corto', color: '#b8c0cc', desc: 'Gittata 680 · 880 px/s · 99 danni/s · perfora 1 · dispersione ±2°',
      weapon: { name: 'Arco Corto', dmg: 43, fireRate: 2.3, spread: 0.04, bulletSpeed: 880, range: 680, pierce: 1, projColor: '#9ef0b0', knockback: 25, arrow: true } },
    { id: 'lad_w_arco_ricurvo', hero: 'ladro', slot: 'weapon', rank: 2, carattere: 'leggera',
      name: 'Arco Ricurvo', color: '#b8c0cc', desc: 'Gittata 560 · 820 px/s · 99 danni/s · dispersione ±5°',
      weapon: { name: 'Arco Ricurvo', dmg: 31, fireRate: 3.2, spread: 0.08, bulletSpeed: 820, range: 560, pierce: 0, projColor: '#9ef0b0', knockback: 13, arrow: true } },
    { id: 'lad_w_arco_composito', hero: 'ladro', slot: 'weapon', rank: 3, carattere: 'pesante',
      name: 'Arco Composito', color: '#3aa0ff', desc: 'Gittata 980 · 1100 px/s · 115 danni/s · perfora 1 · dispersione ±1°',
      weapon: { name: 'Arco Composito', dmg: 72, fireRate: 1.6, spread: 0.02, bulletSpeed: 1100, range: 980, pierce: 1, projColor: '#bfe8ff', knockback: 51, arrow: true } },
    { id: 'lad_w_arco_da_caccia', hero: 'ladro', slot: 'weapon', rank: 3, carattere: 'equilibrata',
      name: 'Arco da Caccia', color: '#3aa0ff', desc: 'Gittata 720 · 920 px/s · 115 danni/s · perfora 2 · dispersione ±2°',
      weapon: { name: 'Arco da Caccia', dmg: 50, fireRate: 2.3, spread: 0.04, bulletSpeed: 920, range: 720, pierce: 2, projColor: '#bfe8ff', knockback: 32, arrow: true } },
    { id: 'lad_w_arco_doppio', hero: 'ladro', slot: 'weapon', rank: 3, carattere: 'leggera',
      name: 'Arco Doppio', color: '#3aa0ff', desc: 'Gittata 590 · 860 px/s · 115 danni/s · dispersione ±5°',
      weapon: { name: 'Arco Doppio', dmg: 36, fireRate: 3.2, spread: 0.08, bulletSpeed: 860, range: 590, pierce: 0, projColor: '#bfe8ff', knockback: 16, arrow: true } },
    { id: 'lad_w_arco_del_vento', hero: 'ladro', slot: 'weapon', rank: 4, carattere: 'pesante',
      name: 'Arco del Vento', color: '#ffb020', desc: 'Gittata 1060 · 1160 px/s · 130 danni/s · perfora 1 · dispersione ±1°',
      weapon: { name: 'Arco del Vento', dmg: 81, fireRate: 1.6, spread: 0.02, bulletSpeed: 1160, range: 1060, pierce: 1, projColor: '#ffd27a', knockback: 64, arrow: true } },
    { id: 'lad_w_arco_ombroso', hero: 'ladro', slot: 'weapon', rank: 4, carattere: 'equilibrata',
      name: 'Arco Ombroso', color: '#ffb020', desc: 'Gittata 760 · 960 px/s · 131 danni/s · perfora 3 · dispersione ±2°',
      weapon: { name: 'Arco Ombroso', dmg: 57, fireRate: 2.3, spread: 0.04, bulletSpeed: 960, range: 760, pierce: 3, projColor: '#ffd27a', knockback: 40, arrow: true } },
    { id: 'lad_w_arco_fulmineo', hero: 'ladro', slot: 'weapon', rank: 4, carattere: 'leggera',
      name: 'Arco Fulmineo', color: '#ffb020', desc: 'Gittata 620 · 900 px/s · 131 danni/s · dispersione ±5°',
      weapon: { name: 'Arco Fulmineo', dmg: 41, fireRate: 3.2, spread: 0.08, bulletSpeed: 900, range: 620, pierce: 0, projColor: '#ffd27a', knockback: 20, arrow: true } },
    { id: 'lad_w_arco_delle_ere', hero: 'ladro', slot: 'weapon', rank: 5, carattere: 'pesante',
      name: 'Arco delle Ere', color: '#ffe9a8', desc: 'Gittata 1140 · 1220 px/s · 158 danni/s · perfora 2 · dispersione ±1°',
      weapon: { name: 'Arco delle Ere', dmg: 99, fireRate: 1.6, spread: 0.02, bulletSpeed: 1220, range: 1140, pierce: 2, projColor: '#d9b6ff', knockback: 77, arrow: true } },
    { id: 'lad_w_arco_delle_ombre', hero: 'ladro', slot: 'weapon', rank: 5, carattere: 'equilibrata',
      name: 'Arco delle Ombre', color: '#ffe9a8', desc: 'Gittata 800 · 1000 px/s · 159 danni/s · perfora 4 · dispersione ±2°',
      weapon: { name: 'Arco delle Ombre', dmg: 69, fireRate: 2.3, spread: 0.04, bulletSpeed: 1000, range: 800, pierce: 4, projColor: '#d9b6ff', knockback: 48, arrow: true } },
    { id: 'lad_w_arco_del_vuoto', hero: 'ladro', slot: 'weapon', rank: 5, carattere: 'leggera',
      name: 'Arco del Vuoto', color: '#ffe9a8', desc: 'Gittata 650 · 940 px/s · 160 danni/s · dispersione ±5°',
      weapon: { name: 'Arco del Vuoto', dmg: 50, fireRate: 3.2, spread: 0.08, bulletSpeed: 940, range: 650, pierce: 0, projColor: '#d9b6ff', knockback: 24, arrow: true } },

    { id: 'lad_a_stracci', hero: 'ladro', slot: 'armor', rank: 1, carattere: 'equilibrata',
      name: 'Stracci', color: '#7a7f8a', desc: '+6 PV',
      bonus: { maxHpFlat: 6 }, tinta: { cloth: '#4a4a42', clothDk: '#26261f', mant: '#3a3a33', capp: '#2e2e28' } },
    { id: 'lad_a_corazza_di_cuoio', hero: 'ladro', slot: 'armor', rank: 2, carattere: 'pesante',
      name: 'Corazza di Cuoio', color: '#b8c0cc', desc: '+42 PV · −10% danni subiti · −4% passo · −5% cadenza',
      bonus: { maxHpFlat: 42, dmgReduce: 0.1, speedMult: -0.04, fireRateMult: -0.05 }, tinta: { cloth: '#314234', clothDk: '#18221c', mant: '#27382c', capp: '#1e2e24' } },
    { id: 'lad_a_giaco_di_pelle', hero: 'ladro', slot: 'armor', rank: 2, carattere: 'equilibrata',
      name: 'Giaco di Pelle', color: '#b8c0cc', desc: '+28 PV · −7% danni subiti',
      bonus: { maxHpFlat: 28, dmgReduce: 0.07 }, tinta: { cloth: '#3c5140', clothDk: '#1d2a22', mant: '#2f4436', capp: '#25382c' } },
    { id: 'lad_a_panciotto_leggero', hero: 'ladro', slot: 'armor', rank: 2, carattere: 'leggera',
      name: 'Panciotto Leggero', color: '#b8c0cc', desc: '+16 PV · −4% danni subiti · +6% passo · +6% cadenza',
      bonus: { maxHpFlat: 16, dmgReduce: 0.04, speedMult: 0.06, fireRateMult: 0.06 }, tinta: { cloth: '#5b6d5f', clothDk: '#414c45', mant: '#506256', capp: '#48584e' } },
    { id: 'lad_a_cuoio_borchiato', hero: 'ladro', slot: 'armor', rank: 3, carattere: 'pesante',
      name: 'Cuoio Borchiato', color: '#3aa0ff', desc: '+72 PV · −14% danni subiti · −5% passo · −6% cadenza',
      bonus: { maxHpFlat: 72, dmgReduce: 0.14, speedMult: -0.05, fireRateMult: -0.06 }, tinta: { cloth: '#4a371f', clothDk: '#261a10', mant: '#3d2c1a', capp: '#302215' } },
    { id: 'lad_a_giustacuore_ombroso', hero: 'ladro', slot: 'armor', rank: 3, carattere: 'equilibrata',
      name: 'Giustacuore Ombroso', color: '#3aa0ff', desc: '+52 PV · −10% danni subiti · +3% passo',
      bonus: { maxHpFlat: 52, dmgReduce: 0.1, speedMult: 0.03 }, tinta: { cloth: '#5a4326', clothDk: '#2e2013', mant: '#4a3620', capp: '#3a2a19' } },
    { id: 'lad_a_pelle_sottile', hero: 'ladro', slot: 'armor', rank: 3, carattere: 'leggera',
      name: 'Pelle Sottile', color: '#3aa0ff', desc: '+34 PV · −6% danni subiti · +8% passo · +8% cadenza',
      bonus: { maxHpFlat: 34, dmgReduce: 0.06, speedMult: 0.08, fireRateMult: 0.08 }, tinta: { cloth: '#746149', clothDk: '#4f4439', mant: '#675644', capp: '#5a4c3e' } },
    { id: 'lad_a_scaglie_di_cuoio', hero: 'ladro', slot: 'armor', rank: 4, carattere: 'pesante',
      name: 'Scaglie di Cuoio', color: '#ffb020', desc: '+105 PV · −18% danni subiti · −6% passo · −7% cadenza',
      bonus: { maxHpFlat: 105, dmgReduce: 0.18, speedMult: -0.06, fireRateMult: -0.07 }, tinta: { cloth: '#302747', clothDk: '#161227', mant: '#3d325a', capp: '#241e39' } },
    { id: 'lad_a_pelle_del_vuoto', hero: 'ladro', slot: 'armor', rank: 4, carattere: 'equilibrata',
      name: 'Pelle del Vuoto', color: '#ffb020', desc: '+78 PV · −14% danni subiti · +5% passo',
      bonus: { maxHpFlat: 78, dmgReduce: 0.14, speedMult: 0.05 }, tinta: { cloth: '#3a2f56', clothDk: '#1b1630', mant: '#4a3d6e', capp: '#2c2445' } },
    { id: 'lad_a_seconda_pelle', hero: 'ladro', slot: 'armor', rank: 4, carattere: 'leggera',
      name: 'Seconda Pelle', color: '#ffb020', desc: '+52 PV · −9% danni subiti · +10% passo · +10% cadenza',
      bonus: { maxHpFlat: 52, dmgReduce: 0.09, speedMult: 0.1, fireRateMult: 0.1 }, tinta: { cloth: '#5a5071', clothDk: '#3f3b51', mant: '#675c85', capp: '#4e4763' } },
    { id: 'lad_a_corazza_dombra', hero: 'ladro', slot: 'armor', rank: 5, carattere: 'pesante',
      name: 'Corazza d\'Ombra', color: '#ffe9a8', desc: '+142 PV · −22% danni subiti · −7% passo · −8% cadenza',
      bonus: { maxHpFlat: 142, dmgReduce: 0.22, speedMult: -0.07, fireRateMult: -0.08 }, tinta: { cloth: '#121a24', clothDk: '#070b10', mant: '#182330', capp: '#0e151e' } },
    { id: 'lad_a_pelle_delle_ere', hero: 'ladro', slot: 'armor', rank: 5, carattere: 'equilibrata',
      name: 'Pelle delle Ere', color: '#ffe9a8', desc: '+112 PV · −17% danni subiti · +7% passo',
      bonus: { maxHpFlat: 112, dmgReduce: 0.17, speedMult: 0.07 }, tinta: { cloth: '#16202c', clothDk: '#080d14', mant: '#1d2b3a', capp: '#111a24' } },
    { id: 'lad_a_velo_dombra', hero: 'ladro', slot: 'armor', rank: 5, carattere: 'leggera',
      name: 'Velo d\'Ombra', color: '#ffe9a8', desc: '+76 PV · −12% danni subiti · +13% passo · +12% cadenza',
      bonus: { maxHpFlat: 76, dmgReduce: 0.12, speedMult: 0.13, fireRateMult: 0.12 }, tinta: { cloth: '#3b444e', clothDk: '#30343a', mant: '#414d5a', capp: '#373f47' } },

    { id: 'lad_b_pezze_ai_piedi', hero: 'ladro', slot: 'boots', rank: 1, carattere: 'equilibrata',
      name: 'Pezze ai Piedi', color: '#7a7f8a', desc: '+1% passo',
      bonus: { speedMult: 0.01 }, tinta: { steelDk: '#3a352a' } },
    { id: 'lad_b_stivali_ferrati', hero: 'ladro', slot: 'boots', rank: 2, carattere: 'pesante',
      name: 'Stivali Ferrati', color: '#b8c0cc', desc: '+22 PV · −5% danni subiti · +2% passo · −4% cadenza',
      bonus: { maxHpFlat: 22, dmgReduce: 0.05, speedMult: 0.02, fireRateMult: -0.04 }, tinta: { steelDk: '#3d3427' } },
    { id: 'lad_b_stivali_del_passo_lieve', hero: 'ladro', slot: 'boots', rank: 2, carattere: 'equilibrata',
      name: 'Stivali del Passo Lieve', color: '#b8c0cc', desc: '+12 PV · +8% passo',
      bonus: { speedMult: 0.08, maxHpFlat: 12 }, tinta: { steelDk: '#4a4030' } },
    { id: 'lad_b_sandali_rapidi', hero: 'ladro', slot: 'boots', rank: 2, carattere: 'leggera',
      name: 'Sandali Rapidi', color: '#b8c0cc', desc: '+12% passo · +5% cadenza',
      bonus: { speedMult: 0.12, fireRateMult: 0.05 }, tinta: { steelDk: '#675f51' } },
    { id: 'lad_b_gambali_rinforzati', hero: 'ladro', slot: 'boots', rank: 3, carattere: 'pesante',
      name: 'Gambali Rinforzati', color: '#3aa0ff', desc: '+38 PV · −8% danni subiti · +4% passo · −5% cadenza',
      bonus: { maxHpFlat: 38, dmgReduce: 0.08, speedMult: 0.04, fireRateMult: -0.05 }, tinta: { steelDk: '#273d4b' } },
    { id: 'lad_b_stivali_del_vento', hero: 'ladro', slot: 'boots', rank: 3, carattere: 'equilibrata',
      name: 'Stivali del Vento', color: '#3aa0ff', desc: '+20 PV · +13% passo',
      bonus: { speedMult: 0.13, maxHpFlat: 20 }, tinta: { steelDk: '#2f4a5c' } },
    { id: 'lad_b_calzari_fulminei', hero: 'ladro', slot: 'boots', rank: 3, carattere: 'leggera',
      name: 'Calzari Fulminei', color: '#3aa0ff', desc: '+18% passo · +7% cadenza',
      bonus: { speedMult: 0.18, fireRateMult: 0.07 }, tinta: { steelDk: '#506776' } },
    { id: 'lad_b_schinieri_del_baluardo', hero: 'ladro', slot: 'boots', rank: 4, carattere: 'pesante',
      name: 'Schinieri del Baluardo', color: '#ffb020', desc: '+56 PV · −11% danni subiti · +6% passo · −6% cadenza',
      bonus: { maxHpFlat: 56, dmgReduce: 0.11, speedMult: 0.06, fireRateMult: -0.06 }, tinta: { steelDk: '#57431a' } },
    { id: 'lad_b_passi_della_faglia', hero: 'ladro', slot: 'boots', rank: 4, carattere: 'equilibrata',
      name: 'Passi della Faglia', color: '#ffb020', desc: '+30 PV · +18% passo',
      bonus: { speedMult: 0.18, maxHpFlat: 30 }, tinta: { steelDk: '#6a5220' } },
    { id: 'lad_b_ali_ai_talloni', hero: 'ladro', slot: 'boots', rank: 4, carattere: 'leggera',
      name: 'Ali ai Talloni', color: '#ffb020', desc: '+24% passo · +9% cadenza',
      bonus: { speedMult: 0.24, fireRateMult: 0.09 }, tinta: { steelDk: '#826e44' } },
    { id: 'lad_b_gambali_delle_ere', hero: 'ladro', slot: 'boots', rank: 5, carattere: 'pesante',
      name: 'Gambali delle Ere', color: '#ffe9a8', desc: '+78 PV · −14% danni subiti · +9% passo · −7% cadenza',
      bonus: { maxHpFlat: 78, dmgReduce: 0.14, speedMult: 0.09, fireRateMult: -0.07 }, tinta: { steelDk: '#3d325a' } },
    { id: 'lad_b_passi_del_vuoto', hero: 'ladro', slot: 'boots', rank: 5, carattere: 'equilibrata',
      name: 'Passi del Vuoto', color: '#ffe9a8', desc: '+42 PV · +24% passo',
      bonus: { speedMult: 0.24, maxHpFlat: 42 }, tinta: { steelDk: '#4a3d6e' } },
    { id: 'lad_b_soffio_del_vento', hero: 'ladro', slot: 'boots', rank: 5, carattere: 'leggera',
      name: 'Soffio del Vento', color: '#ffe9a8', desc: '+30% passo · +11% cadenza',
      bonus: { speedMult: 0.3, fireRateMult: 0.11 }, tinta: { steelDk: '#675c85' } },
  ];

  // Il prezzo lo stampa il listino, non il pezzo. Un pezzo senza uno slot nel listino costerebbe
  // `undefined` e il negozio lo regalerebbe in silenzio: meglio che si rompa subito e si veda.
  for (const it of ITEMS) {
    const riga = PREZZI[it.slot];
    if (!riga) throw new Error('gear.js: nessun listino per lo slot ' + it.slot + ' (' + it.id + ')');
    it.cost = riga[it.rank - 1];
    if (typeof it.cost !== 'number') throw new Error('gear.js: nessun prezzo per ' + it.id + ' al grado ' + it.rank);
  }

  const BY_ID = {}; for (const it of ITEMS) BY_ID[it.id] = it;

  // Oggetti di una classe per uno slot: prima per grado, poi pesante -> equilibrata -> leggera. L'ordine
  // e' deciso qui e non nel client, cosi' negozio, inventario e test vedono sempre la stessa sequenza.
  function itemsFor(heroId, slot) {
    return ITEMS.filter(i => i.hero === heroId && i.slot === slot)
      .sort((a, b) => (a.rank - b.rank) || (CAR_ORD(a.carattere) - CAR_ORD(b.carattere)));
  }
  // I pezzi di UN grado solo. Serve a chi ragiona per grado (il salto a un'ondata, i test): prendere il
  // pezzo per POSIZIONE nella lista era giusto quando i ranghi erano quattro e i pezzi quattro, adesso
  // che sono tredici la posizione non c'entra piu' niente col grado.
  function itemsOfRank(heroId, slot, rank) { return itemsFor(heroId, slot).filter(i => i.rank === rank); }
  function slotsFor(heroId) { return SLOTS[heroId] || []; }
  function maxRank() { return RANK_RARITY.length; }

  // Cio' che si ha addosso all'inizio: il pezzo di GRADO MINIMO di ogni slot — quello scarso, che non si
  // compra. Si cerca il minimo invece di prendere il primo della lista: l'ordinamento e' gia' giusto, ma
  // il giorno che qualcuno lo cambia questa funzione non deve diventare sbagliata in silenzio.
  function startingGear(heroId) {
    const out = {};
    for (const s of slotsFor(heroId)) {
      const l = itemsFor(heroId, s); if (!l.length) continue;
      out[s] = l.reduce((a, b) => (b.rank < a.rank ? b : a)).id;
    }
    return out;
  }
  // Somma dei bonus degli oggetti indossati. Si RICALCOLA sempre da zero: col cambio libero non si puo'
  // sommare il delta, o il bonus dell'oggetto sostituito resterebbe attaccato al personaggio per sempre.
  // Le chiavi elencate qui sono quelle che ESISTONO SEMPRE (anche a zero) perche' chi legge non debba
  // difendersi dall'undefined; una chiave nuova in un `bonus` si somma lo stesso.
  function bonusOf(gear) {
    const b = { maxHpFlat: 0, dmgReduce: 0, speedMult: 0, frontale: 0, fireRateMult: 0 };
    for (const k in (gear || {})) {
      const it = BY_ID[gear[k]]; if (!it || !it.bonus) continue;
      for (const s in it.bonus) b[s] = (b[s] || 0) + it.bonus[s];
    }
    return b;
  }
  function rarityOf(it) { return RANK_RARITY[Math.min(RANK_RARITY.length - 1, (it.rank || 1) - 1)]; }
  function caratteroOf(it) { return CARATTERI[it && it.carattere] || CARATTERI.equilibrata; }
  // v2.12 — QUANTO TI DA' IL FABBRO. Meta' prezzo, ed e' una regola sola perche' si impari una volta:
  // comprare e rivendere lo stesso pezzo costa meta' del suo prezzo, sempre. I pezzi di partenza non sono
  // costati niente e quindi non varrebbero niente: gli si da' una cifra simbolica, se no rivenderli
  // sarebbe un gesto a vuoto.
  const VENDITA_SCARSO = 8;
  function prezzoVendita(it) { return !it ? 0 : (it.cost > 0 ? Math.round(it.cost / 2) : VENDITA_SCARSO); }

  return { ITEMS, BY_ID, SLOTS, PREZZI, SLOT_NAME, SLOT_ICON, RANK_RARITY, CARATTERI, VENDITA_SCARSO,
           itemsFor, itemsOfRank, slotsFor, maxRank, startingGear, bonusOf, rarityOf, caratteroOf, prezzoVendita };
});
