/* potions.js — CATALOGO DEI CONSUMABILI: la CINTURA (UMD)
   v1.71 — Il primo mestiere del villaggio che apre dopo il Fabbro e' l'ERBORISTA, e vende l'unica cosa
   del gioco che si consuma. Tutto il sistema sta in tre regole, decise da Paolo:

   1. TRE SLOT, UN TIPO PER SLOT, TRE CARICHE. La cintura non e' un inventario da sfogliare: e' una scelta
      fatta PRIMA, all'Erborista, e poi tre tasti (1 2 3) da premere senza mai aprire un menu'. Un tipo per
      slot significa che ti porti sempre tre risposte DIVERSE: niente cintura di sole cure.
   2. LE CARICHE SI COMPRANO, NON SI RICARICANO. Finite quelle, quell'ondata la fai a secco. Il tetto di 3
      per slot e' cio' che impedisce di incatenare pozioni fino a rendere il danno irrilevante.
   3. LE STATISTICHE CONTANO. Una per aspetto, senza sovrapposizioni: COSTITUZIONE quanto curano,
      INTELLIGENZA quanto durano, FORZA quanto picchiano le due offensive, DESTREZZA quanto in fretta
      ribevi. Cosi' la stessa boccetta si comporta diversamente in mano a classi diverse, senza bisogno di
      cataloghi separati per eroe (a differenza di gear.js, dove lo slot E' una proprieta' della classe).

   IL FRENO. Un COOLDOWN GLOBALE condiviso dai tre slot (non uno per slot): puoi bere in emergenza, non
   berne tre di fila. E gli effetti NON si cumulano — la seconda Furia fa ripartire il timer, non raddoppia
   il danno; il codice lo ottiene ASSEGNANDO la durata invece di sommarla.

   PREZZI. Tarati sull'economia vera (~65-70 monete a ondata, mercato ogni 3 ondate): riempire la cintura
   intera costa sui 300, cioe' quanto un pezzo di equipaggiamento di rango 2. Deve restare una rinuncia.

   COME SI AGGIUNGE UNA POZIONE (Paolo ne aggiungera' altre): una riga in POTIONS. Se e' `kind: 'heal'`
   basta `heal` (frazione dei PV massimi). Se e' `kind: 'buff'` servono `buff` (la chiave scritta in
   p.buffs) e `dur`; la chiave va poi LETTA in server/Room.js dov'e' il suo effetto — un buff che nessuno
   legge non fa nulla e nessun test se ne accorge. Le due marcate `off: 1` sono quelle che scala la Forza. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Potions = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SLOTS = 3;          // slot della cintura
  const MAX_CHARGES = 3;    // cariche per slot
  const COOLDOWN = 6;       // secondi fra un consumabile e l'altro, CONDIVISO fra i tre slot
  const REFUND = 0.5;       // rimborso sulle cariche rimaste quando si cambia il tipo di uno slot

  // I valori base. Le percentuali qui sono quelle a statistiche a zero: le funzioni piu' sotto le alzano.
  const POTIONS = [
    { id: 'p_cura', name: 'Cura', icon: '❤️', color: '#ff5a7a', cost: 45, kind: 'heal', heal: 0.40, dur: 0,
      desc: 'Ripristina il 40% dei PV massimi', durTxt: 'istantanea' },
    { id: 'p_pelle', name: 'Pelle di Pietra', icon: '🪨', color: '#9fb0d0', cost: 40, kind: 'buff', buff: 'po_armor', dur: 5,
      desc: '−50% danni subiti', durTxt: '5 s' },
    { id: 'p_fretta', name: 'Fretta', icon: '💨', color: '#8bd6ff', cost: 30, kind: 'buff', buff: 'po_speed', dur: 6,
      desc: '+45% velocità', durTxt: '6 s' },
    { id: 'p_furia', name: 'Furia', icon: '⚔️', color: '#ff6b6b', cost: 35, kind: 'buff', buff: 'po_dmg', dur: 6, off: 1,
      desc: '+50% danno', durTxt: '6 s' },
    { id: 'p_frenesia', name: 'Frenesia', icon: '⚡', color: '#ffd24a', cost: 35, kind: 'buff', buff: 'po_rate', dur: 5, off: 1,
      desc: '+60% cadenza', durTxt: '5 s' },
    { id: 'p_rigen', name: 'Rigenerazione', icon: '➕', color: '#4bd66b', cost: 40, kind: 'buff', buff: 'po_regen', dur: 8, cura: 1,
      desc: 'Rigeneri 10 PV/s', durTxt: '8 s' },
  ];
  const BY_ID = {}; POTIONS.forEach((p, i) => { BY_ID[p.id] = p; p.idx = i; });

  // Le grandezze degli effetti, in un posto solo: Room.js le legge da qui invece di riscriverle a mano,
  // altrimenti cambiare il catalogo e cambiare l'effetto diventerebbero due modifiche scollegate.
  const EFF = {
    heal: 0.40,        // p_cura: frazione dei PV massimi
    regen: 10,         // p_rigen: PV al secondo
    armor: 0.50,       // p_pelle: moltiplicatore sui danni subiti
    speed: 0.45,       // p_fretta: bonus di velocita'
    dmg: 0.50,         // p_furia: bonus di danno   (scalato dalla Forza)
    rate: 0.60,        // p_frenesia: bonus di cadenza (scalato dalla Forza)
  };

  // I quattro moltiplicatori. `lvl` e' quante volte quella statistica e' stata comprata (0-12, p.buys).
  function healMult(cos) { return 1 + 0.05 * (cos || 0); }   // Costituzione: quanto curano
  function durMult(int) { return 1 + 0.04 * (int || 0); }    // Intelligenza: quanto durano
  function powMult(forza) { return 1 + 0.03 * (forza || 0); }// Forza: quanto picchiano Furia e Frenesia
  function cdMult(des) { return Math.max(0.6, 1 - 0.03 * (des || 0)); } // Destrezza: quanto in fretta ribevi

  // Una cintura vuota. Ogni slot: null oppure { id, n }.
  function newBelt() { const b = []; for (let i = 0; i < SLOTS; i++) b.push(null); return b; }

  // Il rimborso quando si CAMBIA il tipo di uno slot che ha ancora cariche dentro. Meta' prezzo, arrotondato
  // per difetto: cambiare idea costa qualcosa, ma non azzera la spesa.
  function refundFor(potId, n) { const it = BY_ID[potId]; if (!it || !n) return 0; return Math.floor(it.cost * n * REFUND); }

  // Vero se quel tipo e' gia' in un ALTRO slot (la regola "un tipo per slot" vive qui, non nel chiamante).
  function altrove(belt, slot, potId) {
    for (let i = 0; i < belt.length; i++) if (i !== slot && belt[i] && belt[i].id === potId) return true;
    return false;
  }

  return { SLOTS, MAX_CHARGES, COOLDOWN, REFUND, POTIONS, BY_ID, EFF,
           healMult, durMult, powMult, cdMult, newBelt, refundFor, altrove };
});
