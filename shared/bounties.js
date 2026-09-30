/* bounties.js — LE TAGLIE DEL BANDITORE (UMD)
   v1.72 — Il Banditore fa due mestieri: ricompra l'equipaggiamento che non usi (quello sta in gear.js e
   in Room.js) e appende al banco le TAGLIE, che stanno qui.

   TRE REGOLE, decise da Paolo:
   1. TRE OFFERTE, UNA SI ACCETTA. Al villaggio vedi tre incarichi diversi e ne prendi uno solo. La
      rinuncia e' il punto: prendi quello che si sposa con come stai giocando, non tutti.
   2. NIENTE SCADENZA. La taglia accettata vale finche' non la completi. Non e' un compito a tempo che ti
      obbliga a giocare diversamente per un'ondata: e' un obiettivo che ti accompagna.
   3. PAGA IN MONETE. Il Banditore e' un mercante, non un maestro: non tocca la curva dei livelli, che
      dipende dall'esperienza (vedi PROGRESSIONE.md).

   COME E' FATTA UNA TAGLIA. Un TIPO (`kind`) descrive cosa contare; la funzione `genera` ne crea
   un'istanza concreta tarata sull'ondata, con il suo bersaglio `n` e la sua ricompensa `pay`. Il conteggio
   vive sul giocatore (`p.bounty.have`) e lo aggiorna Room.js nei punti dove quelle cose gia' accadono.

   COME SE NE AGGIUNGE UNA (Paolo ne aggiungera'): una riga in KINDS con `n(w)` e `pay(w)`, e un punto in
   Room.js che chiami `bountyTick(p, kind, quanti)`. Un tipo che nessuno incrementa resta a zero per
   sempre e nessun test se ne accorge — per questo il test controlla che ogni tipo sia agganciato. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Bounties = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const OFFERTE = 3;   // quante ne mostra il banco
  const ATTIVE = 1;    // quante se ne possono tenere

  // v2.31 — i numeri delle due scommesse. Il costo del Doppio o niente lo ha scelto Paolo (120 → 360).
  // L'Interesse composto lo aveva lasciato in bianco: parte da 60 e raddoppia a ogni ondata chiusa in
  // piedi, ma con un TETTO a quattro raddoppi (60·16 = 960). Senza tetto, alla decima ondata sarebbero
  // trentamila monete e non sarebbe piu' una scommessa: sarebbe l'unica cosa da fare nel gioco.
  const COSTO_DOPPIO = 120;
  const INT_BASE = 60, INT_CAP = 4;

  // I bersagli crescono con l'ondata, ma piano: una taglia deve essere un obiettivo raggiungibile
  // giocando come giochi, non una seconda partita dentro la partita.
  // v2.31 — IL CATALOGO RIFATTO, scelto da Paolo riga per riga. Il metro che ha dato e' uno solo:
  // *«devono essere cose semplici per racimolare monete extra, specialmente nei primi livelli»*.
  // Quindi niente incarichi che chiedono di giocare un'altra partita: si completano facendo quello
  // che gia' si fa, o toccando una cosa che gia' c'e' sulla mappa.
  //
  // Sono spariti CACCIA GROSSA (uccidi N nemici: si completava da sola, non era una scelta),
  // TESTE GROSSE (uccidi N elite: la sostituisce Decapitazione, stessa preda ma chiede di essere
  // svelti invece di contare) e NESSUN CADUTO (il suo posto lo prendono le due scommesse in fondo).
  //
  // Tre famiglie, e si leggono dall'ordine: quelle che si chiudono giocando, quelle che chiedono di
  // usare la mappa, e le due scommesse.
  const KINDS = [
    // ---- SI CHIUDONO GIOCANDO COME GIOCHI -------------------------------------------------
    { id: 'specie', icon: '🎯', color: '#ff8a5b', nome: 'Contratto mirato',
      testo: (n, extra) => 'Uccidi ' + n + ' × ' + (extra || 'un tipo di nemico'),
      n: (w) => 6 + Math.round(w * 0.8), pay: (w) => 70 + w * 9, mirata: 1 },
    { id: 'casse', icon: '📦', color: '#ffcf4a', nome: 'Saccheggio',
      testo: (n) => 'Apri ' + n + ' casse',
      n: () => 4, pay: (w) => 55 + w * 6 },
    // la combo NON cresce piu' con l'ondata (era 12 + 2·ondata, cioe' 50 alla diciannovesima): dieci
    // e' un numero che si fa anche alla seconda ondata, ed e' il punto — questa deve pagare presto.
    { id: 'combo', icon: '🔥', color: '#ff5a2b', nome: 'Catena di sangue',
      testo: (n) => 'Raggiungi una combo di ' + n,
      n: () => 10, pay: (w) => 175 + w * 9 },
    { id: 'intempo', icon: '⚡', color: '#7dffea', nome: 'A tamburo battente',
      testo: () => 'Chiudi l\'ondata dentro il tempo obiettivo',
      n: () => 1, pay: (w) => 130 + w * 13, ondata: 1 },
    // PIEDI PER TERRA e' l'unica che chiede di RINUNCIARE a qualcosa, ed e' voluto: lo scatto e' la
    // cosa che si preme senza pensarci, quindi accorgersi di averlo premuto e' meta' dell'incarico.
    { id: 'nodash', icon: '👟', color: '#c9d2e6', nome: 'Piedi per terra',
      testo: () => 'Supera l\'ondata senza mai scattare',
      n: () => 1, pay: (w) => 120 + w * 12, ondata: 1 },

    // ---- CHIEDONO DI USARE LA MAPPA -------------------------------------------------------
    // Queste tre vivono sugli oggetti della v2.28, che non stanno su tutte le mappe (due o tre tipi
    // per mappa su otto). Perche' non restino appese per ondate intere, quando una di queste e'
    // accettata la generazione della mappa successiva ci mette dentro l'oggetto che serve: vedi
    // `oggettiRichiesti` in Room.js. Senza quella riga sarebbero incarichi che dipendono dalla sorte.
    { id: 'decap', icon: '👑', color: '#b061ff', nome: 'Decapitazione',
      testo: () => 'Uccidi un élite entro 30 secondi da quando entra in campo',
      n: () => 1, pay: (w) => 140 + w * 15 },
    { id: 'campana', icon: '🔔', color: '#ffd257', nome: 'Campanaro',
      testo: (n) => 'Suona la campana e uccidine ' + n + ' mentre accorrono',
      n: () => 5, pay: (w) => 170 + w * 17, oggetto: 'campana' },
    { id: 'bracieri', icon: '🔥', color: '#ff9a3b', nome: 'Lampionaio',
      testo: () => 'Accendi tutti i bracieri di una mappa',
      n: () => 1, pay: (w) => 120 + w * 10, oggetto: 'braciere' },
    { id: 'sarcofagi', icon: '⚰️', color: '#9fb0cd', nome: 'Tombarolo',
      testo: (n) => 'Apri ' + n + ' sarcofagi — sapendo cosa rischi',
      n: () => 3, pay: (w) => 150 + w * 15, oggetto: 'sarcofago' },

    // ---- LE DUE SCOMMESSE -----------------------------------------------------------------
    // Non contano niente: si vincono o si perdono. Sono le uniche che possono COSTARE, ed e' per
    // questo che stanno insieme e che il banco non ne offre mai due nello stesso giro (sotto).
    { id: 'doppio', icon: '🎰', color: '#ff5a9e', nome: 'Doppio o niente',
      testo: () => 'Paghi ' + COSTO_DOPPIO + ' monete. Chiudi l\'ondata senza cadere e ne prendi ' + (COSTO_DOPPIO * 3),
      n: () => 1, pay: () => COSTO_DOPPIO * 3, costo: () => COSTO_DOPPIO, ondata: 1, scommessa: 1 },
    { id: 'interesse', icon: '📈', color: '#7dffb0', nome: 'Interesse composto',
      testo: () => 'Ogni ondata chiusa raddoppia la paga (da ' + INT_BASE + ', fino a ' + (INT_BASE * Math.pow(2, INT_CAP)) + '). Se cadi perdi tutto. Si riscuote quando vuoi',
      n: () => 999, pay: () => INT_BASE, ondata: 1, scommessa: 1, riscuoti: 1 },
  ];
  const BY_ID = {}; for (const k of KINDS) BY_ID[k.id] = k;

  // Un'istanza concreta. `tipo`/`tipoNome` valorizzati solo per il contratto mirato.
  function istanza(kind, w, tipo, tipoNome) {
    const k = BY_ID[kind]; if (!k) return null;
    const n = Math.max(1, Math.round(k.n(w)));
    return { k: kind, n, have: 0, pay: Math.round(k.pay(w)), w,
             tipo: tipo || null, nome: k.nome, icon: k.icon, color: k.color,
             testo: k.testo(n, tipoNome) };
  }

  // Le tre offerte del banco: tipi tutti DIVERSI, cosi' la scelta e' fra tre cose diverse e non fra tre
  // varianti della stessa. `rng` e `pool` arrivano da chi chiama (il server sa quali mostri escono adesso).
  function offerte(w, pool, rnd) {
    const r = rnd || Math.random;
    const resto = KINDS.slice();
    const out = [];
    let scommesse = 0;
    while (out.length < OFFERTE && resto.length) {
      const i = Math.floor(r() * resto.length); const k = resto.splice(i, 1)[0];
      // v2.31 — MAI DUE SCOMMESSE NELLO STESSO GIRO. Sono le uniche due che non si completano
      // giocando: offrirle insieme vorrebbe dire un banco su cui, quel giro, non c'e' niente da
      // fare — solo due modi di puntare. Una per volta, e le altre due sono sempre incarichi.
      if (k.scommessa) { if (scommesse) continue; scommesse = 1; }
      if (k.mirata) {
        if (!pool || !pool.length) continue;             // senza un bestiario non ha senso
        const m = pool[Math.floor(r() * pool.length)];
        out.push(istanza(k.id, w, m.id, m.nome));
      } else out.push(istanza(k.id, w, null, null));
    }
    return out;
  }
  // quanto costa ACCETTARLA (solo il Doppio o niente costa qualcosa): serve al banco per dire di no
  // a chi non ha le monete, e a Room per scalarle.
  function costo(b) { const k = b && BY_ID[b.k]; return (k && k.costo) ? k.costo(b.w) : 0; }
  // l'oggetto della mappa senza il quale l'incarico non si puo' nemmeno cominciare
  function oggettoRichiesto(b) { const k = b && BY_ID[b.k]; return (k && k.oggetto) || null; }

  function completa(b) { return !!b && b.have >= b.n; }

  return { OFFERTE, ATTIVE, KINDS, BY_ID, istanza, offerte, completa, costo, oggettoRichiesto,
           COSTO_DOPPIO, INT_BASE, INT_CAP };
});
