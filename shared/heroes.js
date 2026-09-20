/* heroes.js — LE SETTE CLASSI (UMD)

   v2.18 — DA TRE EROI A SETTE CLASSI. Fino alla 2.17 c'erano guerriero, mago e ladro. Adesso sono
   sette: barbaro, paladino, maestro d'armi, assassino, arciere, mago, warlock. Le decisioni, con le
   parole di Paolo accanto a ciascuna, stanno in PIANO-CLASSI-SETTAGGI.md; qui c'e' solo il risultato.

   ============================================================================================
   LA REGOLA CHE TIENE IN PIEDI TUTTO IL RESTO: `corpo`
   ============================================================================================
   Ogni classe dichiara un `corpo`, che e' uno dei tre eroi di prima. Non e' un residuo storico: e' la
   scelta di progetto che rende il passaggio da tre a sette una cosa fattibile invece di una riscrittura.
   Il `corpo` e' l'IMPALCATURA — come si disegna dall'alto, quali slot di equipaggiamento ha, che
   mercenario gli somiglia. Le sette classi si spartiscono TRE impalcature:

       pesante (corpo 'guerriero')  ->  barbaro · paladino · maestro d'armi
       agile   (corpo 'ladro')      ->  assassino · arciere
       arcana  (corpo 'mago')       ->  mago · warlock

   Chiunque debba scegliere "come disegno questo" o "che pezzi puo' indossare" guarda `corpo`.
   Chiunque debba scegliere "quanto fa male" o "cosa sa fare" guarda l'id della classe. Sbagliare
   questa distinzione e' il modo piu' rapido per rompere il gioco in silenzio.

   ============================================================================================
   LE CINQUE SCUOLE DI DANNO
   ============================================================================================
   Ogni arma dichiara la scuola che la governa, e una statistica ne alza danno e cadenza:

       melee  <- Forza          armi da mischia pesanti e medie
       agile  <- Destrezza      armi da mischia leggere (i pugnali dell'assassino)
       ranged <- Destrezza      archi
       magic  <- Intelligenza   il mago
       pact   <- Carisma        paladino e warlock

   Le scuole erano tre e sono diventate cinque per due motivi, entrambi scritti nel documento:
   il CARISMA e' una statistica nuova che scala le magie di paladino e warlock (e non puo' essere la
   stessa casella dell'Intelligenza, altrimenti non e' una statistica ma un'etichetta), e l'ASSASSINO
   vive di Destrezza ma combatte in mischia — con una scuola 'melee' sola, la sua statistica primaria
   non gli avrebbe alzato niente. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Heroes = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Le cinque scuole e la statistica che le governa. Una mappa sola, letta dal server quando applica
  // un punto statistica: aggiungere una scuola qui e non altrove e' sufficiente.
  const SCUOLA_STAT = { melee: 'st_for', agile: 'st_des', ranged: 'st_des', magic: 'st_int', pact: 'st_car' };
  const SCUOLE = ['melee', 'agile', 'ranged', 'magic', 'pact'];

  // Le cinque statistiche, nell'ordine in cui si leggono sulla scheda.
  const STATS = ['st_for', 'st_cos', 'st_des', 'st_int', 'st_car'];

  const HEROES = {
    // ---- IMPALCATURA PESANTE ---------------------------------------------------------------
    barbaro: {
      id: 'barbaro', corpo: 'guerriero', famiglia: 'pesante',
      name: 'BARBARO', title: 'Furia della Faglia',
      color: '#8a7a63', color2: '#3a2716', accent: '#c4542f', hp: 210, speed: 190, radius: 16,
      statPrim: 'st_for', statMagia: null,
      desc: 'Il più forte e il più scoperto. Vive di armi pesanti e non si ferma mai: è l’unico che può impugnare un due mani e imbracciare lo scudo.',
      // TARATURA. L'ascia e' il colpo piu' pesante e il piu' lento del gioco: 64 danni ogni 0,69s
      // fanno 93 al secondo, in linea con le altre sei. L'arco e' PIU' STRETTO e PIU' LUNGO della
      // spada del paladino — e' cio' che la rende un'arma diversa invece che solo piu' grande.
      weapon: {
        name: 'Ascia da Guerra', school: 'melee', melee: true, dmg: 64, fireRate: 1.45,
        arcRadius: 108, arcHalf: 0.85, knockback: 190, projColor: '#c6cdd8',
        spread: 0, bulletSpeed: 0, range: 108, pierce: 0,
      },
      passives: [{ id: 'bonus_pesante', name: 'Braccia Grosse', desc: 'Le armi pesanti fanno l 8% di danno in piu.' }],
      abilities: {},
      strengths: 'Il colpo piu pesante, e i PV per restare in mezzo.', weakness: 'Lento, e quasi senza armatura.',
    },
    paladino: {
      id: 'paladino', corpo: 'guerriero', famiglia: 'pesante',
      name: 'PALADINO', title: 'Scudo della Faglia',
      color: '#9aa3b0', color2: '#16264a', accent: '#c9a227', hp: 200, speed: 186, radius: 16,
      statPrim: 'st_for', statMagia: 'st_car',
      desc: 'Regge i colpi e protegge chi gli sta accanto. Combatte con la Forza e prega con il Carisma: due statistiche da far crescere, metà punti per ognuna.',
      weapon: {
        name: 'Spada Consacrata', school: 'melee', melee: true, dmg: 50, fireRate: 1.8,
        arcRadius: 96, arcHalf: 0.98, knockback: 150, projColor: '#ffe9a8',
        spread: 0, bulletSpeed: 0, range: 96, pierce: 0,
      },
      // v2.18 — 'plate' era del GUERRIERO ed e' passata al paladino, che di quel guerriero e' l'erede
      // difensivo. Si applica in `hurt()` dentro server/Room.js, dov'e' sempre stata: un moltiplicatore
      // sul danno subito, non una voce di `dmgReduce`. Barbaro e maestro d'armi, gli altri due eredi,
      // non la prendono — il primo e' scoperto per carattere, il secondo si difende non facendosi
      // prendere.
      passives: [{ id: 'plate', name: 'Piastra', desc: 'Riduce del 12% i danni subiti.' }],
      abilities: {},
      strengths: 'Il piu difficile da abbattere, e l unico che protegge gli altri.', weakness: 'Divide i punti su due statistiche.',
    },
    maestro: {
      id: 'maestro', corpo: 'guerriero', famiglia: 'pesante',
      name: 'MAESTRO D ARMI', title: 'Lama della Faglia',
      color: '#7e838d', color2: '#1e1917', accent: '#b4463c', hp: 150, speed: 205, radius: 16,
      statPrim: 'st_des', statMagia: null,
      desc: 'Due lame e una cadenza che non si ferma. Nessuna difesa in più: la sua armatura è non farsi prendere.',
      weapon: {
        name: 'Lame Gemelle', school: 'melee', melee: true, dmg: 34, fireRate: 2.7,
        arcRadius: 86, arcHalf: 1.05, knockback: 90, projColor: '#dfe5ee',
        spread: 0, bulletSpeed: 0, range: 86, pierce: 0,
      },
      passives: [{ id: 'ambidestro', name: 'Ambidestro', desc: 'Con due armi la cadenza sale dell 8%.' }],
      abilities: {},
      strengths: 'Il ritmo piu alto fra le armi da mischia.', weakness: 'Niente scudo, niente piastra pesante.',
    },
    // ---- IMPALCATURA AGILE -----------------------------------------------------------------
    assassino: {
      id: 'assassino', corpo: 'ladro', famiglia: 'agile',
      name: 'ASSASSINO', title: 'Ombra della Faglia',
      color: '#2b2f42', color2: '#14172a', accent: '#7d8ab0', hp: 105, speed: 224, radius: 16,
      statPrim: 'st_des', statMagia: null,
      // La scuola 'agile' esiste per questa riga: pugnali da mischia che scalano con la Destrezza.
      weapon: {
        name: 'Pugnali Gemelli', school: 'agile', melee: true, dmg: 26, fireRate: 3.5,
        arcRadius: 74, arcHalf: 1.20, knockback: 55, projColor: '#cfd8dc',
        spread: 0, bulletSpeed: 0, range: 74, pierce: 0,
      },
      desc: 'Colpisce alle spalle e sparisce prima che si giri. Il più fragile del gruppo e il più letale.',
      passives: [{ id: 'bonus_doppia', name: 'Doppia Lama', desc: 'Due armi leggere fanno il 10% di danno in piu.' }],
      abilities: {},
      strengths: 'Il piu veloce, e il colpo che apre.', weakness: 'Cade per primo, sempre.',
    },
    arciere: {
      id: 'arciere', corpo: 'ladro', famiglia: 'agile',
      name: 'ARCIERE', title: 'Occhio della Faglia',
      color: '#3c5140', color2: '#1d2a22', accent: '#4e8a4a', hp: 112, speed: 218, radius: 16,
      statPrim: 'st_des', statMagia: null,
      desc: 'Tiene la distanza e non la molla. Più resta fermo e più fa male: la sua forza è la pazienza.',
      weapon: {
        name: 'Arco Lungo', school: 'ranged', dmg: 38, fireRate: 2.3, spread: 0.04,
        bulletSpeed: 900, range: 700, pierce: 1, projColor: '#9ef0b0', knockback: 25, arrow: true,
      },
      passives: [{ id: 'bonus_arco', name: 'Mano Ferma', desc: 'Gli archi fanno l 8% di danno in piu.' }],
      abilities: {},
      strengths: 'Colpisce prima che arrivino.', weakness: 'Poco danno per colpo, niente in mischia.',
    },
    // ---- IMPALCATURA ARCANA ----------------------------------------------------------------
    mago: {
      id: 'mago', corpo: 'mago', famiglia: 'arcana',
      name: 'MAGO', title: 'Custode della Faglia',
      color: '#2a3a6a', color2: '#141c36', accent: '#5aa8ff', hp: 100, speed: 200, radius: 16,
      statPrim: 'st_int', statMagia: 'st_int',
      desc: 'Danno puro da lontano, e niente addosso per incassare. Prima di scendere sceglie la sua scuola, e ne prende il titolo.',
      weapon: {
        name: 'Bolla di Energia', school: 'magic', dmg: 64, fireRate: 1.5, spread: 0.02,
        bulletSpeed: 430, range: 620, pierce: 0, projColor: '#5aa8ff', knockback: 45, bubble: true, r: 9,
      },
      passives: [{ id: 'bonus_staffa', name: 'Staffa', desc: 'Le staffe fanno l 8% di danno in piu.' }],
      abilities: {},
      // Le tre scuole. Non sono classi: danno un TITOLO e decidono l'abilita' del livello 1 (e, di
      // conseguenza, quelle del 7 e del 13, perche' ogni scuola ha le sue).
      scuole: [
        { id: 'elementale', titolo: 'Elementalista', desc: 'fuoco, gelo, fulmine o veleno' },
        { id: 'evocazione', titolo: 'Evocatore', desc: 'manda avanti ciò che chiama' },
        { id: 'negromanzia', titolo: 'Negromante', desc: 'i morti non restano a terra' },
      ],
      strengths: 'Colpi pesanti che si vedono arrivare da lontano.', weakness: 'Lento a ripetere, fragile.',
    },
    warlock: {
      id: 'warlock', corpo: 'mago', famiglia: 'arcana',
      name: 'WARLOCK', title: 'Patto della Faglia',
      color: '#3a1f52', color2: '#1a0e28', accent: '#c06bff', hp: 120, speed: 196, radius: 16,
      statPrim: 'st_car', statMagia: 'st_car',
      desc: 'Maledice, logora, e si nutre di ciò che muore intorno a lui. Le sue magie scalano con il Carisma, non con l’Intelligenza.',
      weapon: {
        name: 'Dardo del Patto', school: 'pact', dmg: 46, fireRate: 2.0, spread: 0.03,
        bulletSpeed: 520, range: 640, pierce: 0, projColor: '#c06bff', knockback: 40, bubble: true, r: 7,
      },
      passives: [{ id: 'patto', name: 'Patto', desc: 'Il Carisma alza danno e cadenza delle tue magie.' }],
      abilities: {},
      strengths: 'Logora, maledice, e regge piu del mago.', weakness: 'Nessun colpo che risolve da solo.',
    },
  };
  // L'ordine in cui si scorrono nella schermata di scelta: le tre impalcature in fila, cosi' chi sfoglia
  // con le frecce vede le classi affini una accanto all'altra.
  const ORDER = ['barbaro', 'paladino', 'maestro', 'assassino', 'arciere', 'mago', 'warlock'];

  // v2.18 — I TRE CORPI, per chi deve disegnare o vestire invece che bilanciare.
  const CORPI = { pesante: 'guerriero', agile: 'ladro', arcana: 'mago' };
  function corpoDi(heroId) { const h = HEROES[heroId]; return (h && h.corpo) || 'guerriero'; }

  // ============================================================================================
  // v2.18.1 — LE DUE MANI
  // ============================================================================================
  // L'equipaggiamento non e' piu' «un'arma, un'armatura, uno scudo»: sono DUE MANI piu' armatura e
  // calzature. Quello che ogni classe puo' tenerci dentro viene dalle tabelle del documento:
  //
  //   `doppia`  — i caratteri di arma che puo' impugnare in DUE ESEMPLARI insieme (null = niente
  //               doppia arma). Il carattere e' quello di gear.js: leggera, equilibrata, pesante.
  //   `scudo`   — i caratteri di arma che puo' tenere nell'altra mano INSIEME a uno scudo
  //               (null = niente scudo).
  //   `pesanteUnaMano` — il BARBARO e nessun altro. Un'arma pesante e' a due mani per tutti e occupa
  //               entrambi gli slot; per lui no, ed e' proprio il suo privilegio: *«unica classe che
  //               puo' portare arma pesante e scudo»*, e quindi anche due armi pesanti.
  //
  // La regola vive qui e non nel server perche' la deve sapere anche il client, per spegnere i pezzi
  // che non puoi impugnare invece di lasciarti cliccare e non succedere niente.
  const MANI = {
    barbaro:   { doppia: ['leggera', 'equilibrata', 'pesante'], scudo: ['leggera', 'equilibrata', 'pesante'], pesanteUnaMano: 1 },
    paladino:  { doppia: null,                                   scudo: ['leggera', 'equilibrata'] },
    maestro:   { doppia: ['leggera', 'equilibrata'],             scudo: ['leggera', 'equilibrata'] },
    assassino: { doppia: ['leggera'],                            scudo: null },
    arciere:   { doppia: null,                                   scudo: null },
    mago:      { doppia: ['leggera'],                            scudo: null },
    warlock:   { doppia: null,                                   scudo: null },
  };
  function maniDi(heroId) { return MANI[heroId] || MANI.arciere; }

  // ============================================================================================
  // LE STATISTICHE DI PARTENZA — la matrice 7 x 5
  // ============================================================================================
  // Il tetto resta 20 anche adesso che i picchi sono a 10, ed e' una decisione esplicita di Paolo
  // («lascia cosi' anche il tetto, so cosa faccio»): chi parte da 10 e spende tutti i 12 punti
  // spendibili arriverebbe a 22 e viene tagliato a 20. NON E' UN BACO DA CORREGGERE.
  //
  // Stessa cosa per il WARLOCK, che somma 23 invece di 22: segnalato, e lasciato cosi'.
  //
  // Come si legge la matrice: picco 10 = classe che vive su una statistica sola (barbaro, assassino,
  // arciere, mago) e puo' spendere i 14 punti in profondita'. Picco 6-7 = classe che ne ha due
  // (paladino FOR+CAR, maestro FOR+DES) e deve dividere. E' la difficolta' voluta, non un difetto.
  // Gli 1 sono voluti anche loro: cinque statistiche, ma nessuna classe le usa tutte.
  const STAT_MAX = 20;
  const STAT_BASE = {
    barbaro:   { st_for: 10, st_cos: 8, st_des: 2,  st_int: 1,  st_car: 1 },
    paladino:  { st_for: 6,  st_cos: 7, st_des: 2,  st_int: 1,  st_car: 6 },
    maestro:   { st_for: 7,  st_cos: 6, st_des: 6,  st_int: 2,  st_car: 1 },
    assassino: { st_for: 6,  st_cos: 4, st_des: 10, st_int: 1,  st_car: 1 },
    arciere:   { st_for: 2,  st_cos: 5, st_des: 10, st_int: 3,  st_car: 2 },
    mago:      { st_for: 1,  st_cos: 5, st_des: 5,  st_int: 10, st_car: 1 },
    warlock:   { st_for: 3,  st_cos: 5, st_des: 4,  st_int: 3,  st_car: 8 },
  };
  function statBase(heroId, statId) { return (STAT_BASE[heroId] || {})[statId] || 0; }

  // ============================================================================================
  // IL PROFILO DELLA CLASSE — v2.15, ricentrato nella v2.18
  // ============================================================================================
  // Conta lo SCARTO dal centro, non il valore assoluto: chi sta sopra guadagna, chi sta sotto perde, e
  // la somma per classe resta vicina a zero. Le classi si allontanano fra loro senza che la potenza
  // media si muova.
  //
  // IL CENTRO ERA 5,5 ED E' DIVENTATO 4,4. Non e' un ritocco: 5,5 era la media di QUATTRO statistiche
  // che sommavano 22 (22/4). Con cinque caselle la media e' 22/5 = 4,4, e lasciando 5,5 ogni classe
  // sarebbe risultata sotto la media — il profilo avrebbe tolto PV a chiunque, cioe' l'esatto
  // contrario del suo mestiere.
  //
  // IL PESO SCENDE DA 0,5 A 0,38. Con i picchi a 10 invece che a 8 e il centro piu' basso, lo scarto
  // massimo passa da 2,5 a 5,6: piu' del doppio. A peso invariato il barbaro avrebbe preso +112 PV di
  // solo profilo contro i +50 di prima, e il profilo avrebbe smesso di essere una sfumatura per
  // diventare la cosa principale. 0,38 riporta lo scarto massimo (5,6 x 0,38 = 2,1) vicino a quello
  // che c'era (2,5 x 0,5 = 1,25) senza appiattire le differenze fra le sette classi.
  //
  // IL PROFILO NON TOCCA DANNO NE' CADENZA, e questa resta la scelta che salva il bilanciamento: ogni
  // classe ha il valore piu' alto proprio nella statistica della sua scuola di danno, quindi lasciarlo
  // contare sul danno vorrebbe dire moltiplicare il vantaggio per se stesso. Gli effetti veri stanno
  // in `applicaProfilo()` in server/Room.js, accanto ad `applicaStat()`.
  const STAT_CENTRO = 4.4;
  const PROFILO_PESO = 0.38;
  function profiloPunti(heroId, statId) {
    const b = (STAT_BASE[heroId] || {})[statId];
    if (b == null) return 0;
    return (b - STAT_CENTRO) * PROFILO_PESO;
  }

  // v2.18 — I BONUS DI CLASSE del documento, in un posto solo. Sono moltiplicatori sul danno
  // dell'arma quando l'arma e' quella giusta per la classe; li applica `bonusDiClasse()` in Room.js.
  // Il barbaro con la pesante, l'assassino con la doppia leggera, l'arciere con l'arco, il mago con la
  // staffa: quattro righe nel documento, quattro righe qui.
  const BONUS_CLASSE = {
    barbaro:   { carattere: 'pesante', mult: 1.08 },
    assassino: { carattere: 'leggera', mult: 1.10 },
    arciere:   { scuola: 'ranged',     mult: 1.08 },
    mago:      { scuola: 'magic',      mult: 1.08 },
  };

  return {
    HEROES, ORDER, CORPI, corpoDi, STATS, SCUOLE, SCUOLA_STAT, BONUS_CLASSE, MANI, maniDi,
    STAT_BASE, STAT_MAX, statBase, STAT_CENTRO, PROFILO_PESO, profiloPunti,
  };
});
