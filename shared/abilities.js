/* abilities.js — LE ABILITA' ATTIVE (UMD) — v1.85

   Dal v1.66 al v1.84 gli slot Q ed E sono stati un contenitore vuoto: i tasti li leggeva `input.js`, il
   server aveva `useQ`/`useE` come stub, i cooldown `cdQ`/`cdE` scendevano ogni tick e la barra dell'HUD
   aveva il posto. Mancava solo cosa metterci. Qui c'e' cosa metterci.

   LE REGOLE:
   1. QUATTRO ABILITA' PER CLASSE, due per slot. Lo slot Q si sblocca al livello 6, lo slot E al 12, e a
      quei due livelli si sceglie fra le DUE abilita' di quello slot. La scelta e' definitiva, come le
      passive: le due che non prendi sono il motivo per rigiocare la classe.
   2. RICARICHE LUNGHE — 30s per lo slot Q, 45s per lo slot E. Non sono colpi in piu': sono il momento
      in cui l'ondata cambia. Una ricarica corta le trasformerebbe in una seconda arma, e a quel punto
      il gioco lo giocherebbero loro.
   3. NIENTE RISORSA NUOVA. Solo la ricarica, abbassata da `cdrMult` e potenza alzata da `abilityMult`
      (che la specializzazione del 15 aumenta): due manopole che esistevano gia' e non facevano niente.
   4. IL MERCENARIO NON HA ABILITA'. Come per l'XP, le monete e la chiave dei prigionieri: non e' un
      giocatore per le regole, e' un compagno d'arme.

   I sei nomi del livello 12 (Turbine, Giuramento, Meteora, Catena Nera, Marchio, Salva) erano gia'
   promessi dalle specializzazioni in levels.js e non erano mai stati scritti. Adesso esistono, e la
   specializzazione al 15 non li regala piu': li POTENZIA, alzando `abilityMult`. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Abilities = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CD_Q = 30, CD_E = 45;          // le due ricariche, uguali per tutte le classi
  const LVL_Q = 6, LVL_E = 12;

  // Ogni abilita' porta i propri numeri: il server non ne ha nessuno cucito addosso, li legge da qui.
  // I danni sono MOLTIPLICATORI del colpo base (effDamage), non numeri fissi: cosi' un'abilita' presa al
  // livello 6 vale ancora qualcosa all'ondata 18, senza tabelle di scala separate da tenere allineate.
  const ABIL = {
    guerriero: [
      { id: 'ab_carica', slot: 'q', lvl: LVL_Q, name: 'Carica', icon: '⚡', color: '#ffd27a', cd: CD_Q,
        desc: 'Scatti in avanti attraversando i nemici: chi tocchi prende il doppio del fendente, vola via ed e stordito. Sei immune durante la corsa.',
        breve: 'Scatto corazzato che sfonda e stordisce',
        durata: 0.42, spinta: 1.25, raggio: 46, dmgMult: 2.0, stun: 0.9, knock: 260 },
      { id: 'ab_grido', slot: 'q', lvl: LVL_Q, name: 'Grido di Guerra', icon: '📣', color: '#ffb45a', cd: CD_Q,
        desc: 'Un urlo: i nemici intorno prendono di mira TE per 3s, e tu e i compagni nel raggio subite il 25% di danni in meno per 4s. I boss non ti danno retta.',
        breve: 'Attiri i nemici e proteggi la squadra',
        raggio: 260, taunt: 3, dur: 4, dr: 0.25 },
      { id: 'ab_turbine', slot: 'e', lvl: LVL_E, name: 'Turbine', icon: '🌀', color: '#ffe9a8', cd: CD_E,
        desc: 'Tre rotazioni a giro pieno in 1,2s: ogni giro colpisce tutto intorno a te per il 70% del fendente. Ti muovi piu piano mentre giri.',
        breve: 'Tre fendenti a 360 gradi',
        giri: 3, dur: 1.2, raggio: 115, quota: 0.7, lento: 0.7 },
      { id: 'ab_giuramento', slot: 'e', lvl: LVL_E, name: 'Giuramento', icon: '✨', color: '#ffe9a8', cd: CD_E,
        desc: 'Per 5s tu e i compagni entro 220px siete immuni al PRIMO colpo che arriva. Non fa danno: e il momento in cui si regge l ondata.',
        breve: 'Tu e i compagni immuni al primo colpo',
        raggio: 220, dur: 5 },
    ],
    mago: [
      { id: 'ab_muro', slot: 'q', lvl: LVL_Q, name: 'Muro di Fuoco', icon: '🔥', color: '#ff8a3b', cd: CD_Q,
        desc: 'Una barriera di fiamme lunga 220px davanti a te, per 5s: chi la attraversa brucia. Non uccide, decide da dove ti arrivano addosso.',
        breve: 'Barriera di fiamme che sbarra il passo',
        len: 220, dur: 5, spessore: 24, dmgMult: 0.55, tick: 0.25 },
      { id: 'ab_scudo', slot: 'q', lvl: LVL_Q, name: 'Scudo di Mana', icon: '🫧', color: '#7dffea', cd: CD_Q,
        desc: 'Una bolla che assorbe danni per 6s. Quando si rompe (o scade) esplode: respinge e rallenta chi ti sta addosso.',
        breve: 'Assorbe danni, poi esplode',
        quota: 1.1, dur: 6, ondaR: 150, ondaKnock: 220 },
      { id: 'ab_meteora', slot: 'e', lvl: LVL_E, name: 'Meteora', icon: '☄️', color: '#ff7a3b', cd: CD_E,
        desc: 'Tre impatti a caduta attorno al punto mirato, telegrafati a terra. Danno grosso su chi non si muove: si mira dove SARANNO.',
        breve: 'Tre impatti a caduta sul punto mirato',
        colpi: 3, r: 92, sparg: 78, ritardo: 0.5, passo: 0.32, dmgMult: 2.2, gittata: 560 },
      { id: 'ab_catena', slot: 'e', lvl: LVL_E, name: 'Catena Nera', icon: '⛓️', color: '#b061ff', cd: CD_E,
        desc: 'Un fulmine che rimbalza fra otto nemici, con danno calante a ogni salto. Il contrario della Meteora: quasi niente su uno, devastante su venti.',
        breve: 'Fulmine che rimbalza fra otto nemici',
        salti: 8, dmgMult: 1.6, calo: 0.84, gittata: 420, salto: 260 },
    ],
    ladro: [
      { id: 'ab_velo', slot: 'q', lvl: LVL_Q, name: "Velo d'Ombra", icon: '🌫️', color: '#9ef0b0', cd: CD_Q,
        desc: 'Una nube di 150px per 5s: finche ci stai dentro i nemici ti perdono di vista, e il primo colpo che spari uscendo dall ombra e critico.',
        breve: 'Nube che ti rende invisibile',
        r: 150, dur: 5 },
      { id: 'ab_tagliola', slot: 'q', lvl: LVL_Q, name: 'Tagliola', icon: '🪤', color: '#cfd8dc', cd: CD_Q,
        desc: 'Piazzi una trappola dove sei: il primo che ci entra resta bloccato 2,5s e prende danno. Resta armata 25s, fino a tre in campo.',
        breve: 'Trappola che blocca il primo che passa',
        r: 34, arma: 25, blocco: 2.5, dmgMult: 2.5, max: 3 },
      { id: 'ab_marchio', slot: 'e', lvl: LVL_E, name: 'Marchio', icon: '🎯', color: '#ff5a7a', cd: CD_E,
        desc: 'Segni il nemico che stai mirando: per 8s prende il 50% di danni in piu DA CHIUNQUE. Se muore marchiato, meta ricarica torna indietro.',
        breve: 'Il bersaglio prende +50% danni da tutti',
        dur: 8, mult: 1.5, gittata: 560, rimborso: 0.5 },
      { id: 'ab_salva', slot: 'e', lvl: LVL_E, name: 'Salva', icon: '🏹', color: '#9ef0b0', cd: CD_E,
        desc: 'Quindici frecce in due secondi verso dove miri, perforanti. La finestra in cui il ladro smette di scappare.',
        breve: 'Quindici frecce in due secondi',
        colpi: 15, dur: 2, dmgMult: 0.8, sparg: 0.10, pierce: 1 },
    ],
  };

  const BY_ID = {};
  for (const h in ABIL) for (const a of ABIL[h]) { a.hero = h; BY_ID[a.id] = a; }

  // Le due abilita' offerte a un eroe per uno slot ('q' o 'e').
  function perSlot(heroId, slot) { return (ABIL[heroId] || []).filter(a => a.slot === slot); }
  // Lo slot che si sblocca a un certo livello, o null.
  function slotPerLivello(L) { return L === LVL_Q ? 'q' : L === LVL_E ? 'e' : null; }
  function livelloDiSlot(slot) { return slot === 'q' ? LVL_Q : LVL_E; }

  return { ABIL, BY_ID, perSlot, slotPerLivello, livelloDiSlot, CD_Q, CD_E, LVL_Q, LVL_E };
});
