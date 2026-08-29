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

  // I bersagli crescono con l'ondata, ma piano: una taglia deve essere un obiettivo raggiungibile
  // giocando come giochi, non una seconda partita dentro la partita.
  const KINDS = [
    { id: 'caccia', icon: '💀', color: '#c9d2e6', nome: 'Caccia grossa',
      testo: (n) => 'Uccidi ' + n + ' nemici',
      n: (w) => 20 + w * 3, pay: (w) => 60 + w * 8 },
    { id: 'specie', icon: '🎯', color: '#ff8a5b', nome: 'Contratto mirato',
      testo: (n, extra) => 'Uccidi ' + n + ' × ' + (extra || 'un tipo di nemico'),
      n: (w) => 6 + Math.round(w * 0.8), pay: (w) => 70 + w * 9, mirata: 1 },
    { id: 'elite', icon: '👑', color: '#b061ff', nome: 'Teste grosse',
      testo: (n) => 'Uccidi ' + n + ' nemici élite',
      n: (w) => 2 + Math.floor(w / 4), pay: (w) => 90 + w * 11 },
    { id: 'casse', icon: '📦', color: '#ffcf4a', nome: 'Saccheggio',
      testo: (n) => 'Apri ' + n + ' casse',
      n: () => 4, pay: (w) => 55 + w * 6 },
    { id: 'combo', icon: '🔥', color: '#ff5a2b', nome: 'Catena di sangue',
      testo: (n) => 'Raggiungi una combo di ' + n,
      n: (w) => 12 + w * 2, pay: (w) => 75 + w * 9 },
    { id: 'illeso', icon: '🛡️', color: '#7dffea', nome: 'Nessun caduto',
      testo: () => 'Supera un\'ondata senza perdere una vita',
      n: () => 1, pay: (w) => 100 + w * 12 },
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
    while (out.length < OFFERTE && resto.length) {
      const i = Math.floor(r() * resto.length); const k = resto.splice(i, 1)[0];
      if (k.mirata) {
        if (!pool || !pool.length) continue;             // senza un bestiario non ha senso
        const m = pool[Math.floor(r() * pool.length)];
        out.push(istanza(k.id, w, m.id, m.nome));
      } else out.push(istanza(k.id, w, null, null));
    }
    return out;
  }

  function completa(b) { return !!b && b.have >= b.n; }

  return { OFFERTE, ATTIVE, KINDS, BY_ID, istanza, offerte, completa };
});
