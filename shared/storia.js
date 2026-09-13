/* storia.js — IL TESTO DELLA STORIA (UMD, condiviso client/server)
 *
 * v2.7 — Tutto quello che qualcuno DICE sta qui dentro, e solo qui. Non e' pignoleria: il testo si
 * riscrive dieci volte prima di suonare giusto, e riscriverlo dentro il codice del server vuol dire
 * rileggere la logica ogni volta per trovare la riga. Cosi' invece si apre un file e si scrive.
 *
 * IL REGISTRO, che e' la cosa da non perdere nelle riscritture: SECCO. Frasi corte. Nessuna
 * spiegazione. Chi parla sa piu' di quello che dice, e non ha nessuna intenzione di dirlo tutto.
 * Niente "o valoroso eroe", niente profezie recitate, niente aggettivi in fila. Se una riga si puo'
 * accorciare, si accorcia; se spiega una cosa che il giocatore vede da solo, si toglie.
 *
 * IL FILO. La voce del risveglio e lo SCIAMANO sono la stessa persona, e il giocatore lo scopre solo
 * quando gli parla ("Ti ho parlato mentre dormivi"). E' per questo che la voce non si presenta mai e
 * non ha un nome: `chi: ''` non e' una dimenticanza, e' il punto.
 */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Storia = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const S = {
    // il nome del boss dell'ondata 20. Sta qui perche' la storia lo pronuncia, e se un domani cambia
    // deve cambiare in un posto solo.
    BOSS: "AZ'GAROTH",
    ONDATE: 20,

    // ===================== 1. IL RISVEGLIO =====================
    // Si apre nel buio, con la faglia accesa in mezzo alla sala. La voce non dice dove sei, non dice
    // chi e', non dice cosa c'e' dall'altra parte. Dice solo di attraversare.
    prologo: {
      chi: '',
      righe: [
        'Sei sveglio.',
        'Non chiedere dove. Non te lo direi.',
        'Sei sceso da solo. Nessuno scende da solo.',
        'In mezzo alla sala c’è una faglia. La vedi.',
        'Attraversala.',
        'Quelli prima di te sono rimasti a guardarla.',
      ],
      // se uno si mette a girare invece di entrare. Una sola, e poi la voce tace: insistere la
      // trasformerebbe in un tutorial.
      sollecito: 'La faglia. Non il muro.',
    },

    // ===================== 2. L'ARRIVO AL VILLAGGIO =====================
    arrivo: {
      chi: '',
      righe: [
        'Questo era un posto tranquillo.',
        'Cerca lo sciamano. Sa cosa sei.',
      ],
    },

    // ===================== 3. LO SCIAMANO =====================
    // Il discorso vero. Deve dire tre cose e nessuna di piu': che sotto c'e' qualcosa, che si scende
    // venti volte, e che gli altri ci hanno gia' provato. Il "com'e' andata" non si spiega: si guarda
    // il villaggio mezzo vuoto e si capisce.
    sciamano: {
      chi: 'Sciamano',
      righe: [
        'Sei arrivato. Non ci speravo più.',
        'Ti ho parlato mentre dormivi. Non lo ricordi: è normale.',
        'Sotto di noi c’è una cosa che non dorme.',
        'Si chiama AZ’GAROTH. Il nome non serve a niente, ma la gente sta più tranquilla se le cose hanno un nome.',
        'Venti volte la roccia si aprirà. Venti volte ti verranno addosso.',
        'Ogni volta più in fondo. Ogni volta più vicino a lui.',
        'Noi ci abbiamo provato. Siamo ancora qui, quindi hai capito com’è andata.',
        'Tu no. Tu sei sceso da solo.',
        'Vai. La faglia è nella casa delle guardie.',
      ],
      // se gli si torna davanti dopo. Una riga sola: un vecchio che ha gia' detto tutto.
      ancora: 'Ti ho già detto tutto. Vai.',
    },

    // ===================== 4. L'ULTIMA DISCESA =====================
    // All'inizio dell'ondata 20, quando la storia si chiude. Non e' un discorso: e' una riga sola.
    finale: {
      chi: 'Sciamano',
      righe: ['È sotto di te. Non ti sta aspettando: non sa che esisti.'],
    },

    // ===================== LE MISSIONI IN EVIDENZA =====================
    // Il riquadro in alto a sinistra. Titolo corto, una riga di spiegazione sotto.
    missioni: {
      faglia:   { t: 'Attraversa la faglia', d: 'In mezzo alla sala' },
      sciamano: { t: 'Trova lo sciamano',    d: 'Nel villaggio, fila di levante' },
      discesa:  { t: 'Scendi fino ad AZ’GAROTH', d: 'Venti ondate' },
    },
  };

  return S;
});
