/* consigli.js — i consigli della schermata di avvio (client) ====================================
 *
 * v2.26 — IL BOX DEI COMANDI DICE QUALI TASTI, QUESTO DICE COME SI GIOCA.
 *
 * Il gioco ha venti meccaniche che non stanno in una legenda dei tasti — che i barili fanno male
 * anche a te, che il Cubo ferma i proiettili, che scaduto il tempo i mostri ti cercano — e l'unico
 * modo di scoprirle era morirci contro. Una riga a caso a ogni caricamento non insegna il gioco, ma
 * in venti partite lo racconta tutto.
 *
 * REGOLA PER CHI AGGIUNGE UNA RIGA: deve essere una cosa VERA e VERIFICABILE nel codice, non
 * atmosfera. Un consiglio sbagliato e' peggio di nessun consiglio: il giocatore ci costruisce sopra
 * una strategia e poi muore per un motivo che non capisce. C'e' un test che pesca i numeri citati
 * qui dentro e li confronta con le costanti vere.
 */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Consigli = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CONSIGLI = [
    // --- le cose che ti uccidono e non te lo aspetti ---------------------------------------
    'I <b>barili</b> esplodono e fanno male <b>anche a te</b>, a metà danno. Si riconoscono dalle doghe scure e dalla miccia accesa.',
    'Un barile che esplode <b>innesca quelli vicini</b>. Una fila di barili è una bomba sola.',
    'Le <b>larve</b> scoppiano quando le uccidi: non restare incollato a quella che stai finendo.',
    'Le <b>casse</b> non sono tutte casse. Qualcuna ha i denti.',
    // --- come si risponde a chi hai davanti ------------------------------------------------
    'La <b>Lama Errante</b> si carica mezzo secondo prima di scattare, e va dritta: quando la vedi brillare, spostati <b>di lato</b>.',
    'Il <b>Cubo Gelatinoso</b> ferma i proiettili, anche quelli perforanti. Non sparargli attraverso: giraci intorno.',
    'Il <b>Padrone</b> rende più veloci e più forti i mostri intorno a sé. Se un\'ondata picchia più del solito, cerca lui.',
    'Se stai addosso al Padrone ti <b>frusta</b>, se scappi ti <b>condanna</b>. Non c\'è un posto comodo.',
    'Il <b>Negromante</b> continua a chiamarne altri finché è vivo: è il primo da togliere di mezzo.',
    'La <b>Melma</b> si divide quando muore. Ucciderla non basta: bisogna finire i pezzi.',
    'Il <b>Fuoco Fatuo</b> attraversa i muri. Dietro un angolo non sei al riparo da lui.',
    'Le <b>tele dei ragni</b> non fanno danno: ti rallentano del 42% finché ci stai sopra. Esci, non combattere lì dentro.',
    'La <b>Sfera d\'Ossa</b> carica in linea retta e rimbalza sui muri. Toglierti di lato basta; correre davanti a lei no.',
    // --- il ritmo dell'ondata --------------------------------------------------------------
    'A metà ondata la coda si ferma e non entra più nessuno: è il momento di <b>raccogliere le monete</b> e rimettersi a posto.',
    'Quando scade il <b>tempo obiettivo</b> i mostri smettono di vagare e <b>vengono a cercarti</b>, da tutta la mappa. Prendersela comoda costa.',
    'Chiudere l\'ondata <b>sotto il tempo obiettivo</b> paga in XP e monete. Il cronometro è sotto il nome della mappa.',
    // --- cose che il giocatore ha e non usa ------------------------------------------------
    'Lo <b>scatto</b> attraversa i nemici. È una via d\'uscita, non solo un modo per andare più veloce.',
    'La <b>torcia</b> illumina davanti e quasi niente alle spalle. Quello che non vedi resta comunque sulla <b>minimappa</b>.',
    'Le due pozioni della cintura (<b>Q</b> ed <b>E</b>) le scegli tu dall\'<b>Erborista</b>, in villaggio.',
    'La partita si salva <b>dalla locanda</b>, in villaggio. Morire non cancella il salvataggio.',
  ];

  // Uno a caso. Non tiene memoria dell'ultimo: la schermata si apre una volta per sessione, e
  // ricordarsi fra un caricamento e l'altro vorrebbe dire scrivere nel browser per una riga di testo.
  function aCaso() { return CONSIGLI[(Math.random() * CONSIGLI.length) | 0]; }

  return { CONSIGLI, aCaso };
});
