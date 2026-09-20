/* levels.js — LIVELLI, RANGHI, PUNTI E CARTE (UMD)
   v1.69 — Fino alla 1.68 la XP era una VALUTA: la raccoglievi e la spendevi al negozio di fine ondata.
   Da qui la XP e' una BARRA: sale, ti fa salire di livello, e a ogni livello ti da' un punto da spendere.
   E' la differenza fra comprare un potenziamento e diventare qualcosa.

   Il progetto completo, con le misure da cui escono tutti i numeri, sta in PROGRESSIONE.md.

   LE TRE REGOLE che reggono il file:
   1. NESSUN TETTO AI LIVELLI. Il livello non e' piu' agganciato all'ondata: si sale finche' si accumula
      esperienza, e l'esperienza arriva da PIU' FONTI (nemici uccisi, casse aperte, oggetti raccolti sulla
      mappa, e cio' che verra' aggiunto dopo). Un tetto che coincideva con la fine della partita non aveva
      senso: gli ultimi livelli si prendevano sui titoli di coda invece di giocarli.
   2. UN RANGO OGNI 5 LIVELLI. Il rango da' un punto in piu' e il titolo nuovo; il quinto da' il BIVIO fra
      due specializzazioni. E' il posto dove entreranno le ABILITA' DI CLASSE: il contenitore c'e' gia'.
   3. UNA STATISTICA AL TETTO COSTA 22 PUNTI. La curva dei costi cresce a scaglioni (1 fino al 4° livello,
      2 fino al 10°, 3 per gli ultimi due): o ti specializzi, o ti distribuisci. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Levels = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // v1.79 — IL TETTO TORNA, E VALE 15. Dalla 1.70 alla 1.78 non c'era: si saliva finche' c'era XP, e
  // dall'ondata 12 in poi si saliva a vuoto. Adesso la crescita finisce al 15, dove si sceglie la
  // specializzazione, e l'XP raccolta dopo non serve piu' a niente — come in un gioco di ruolo.
  const POINTS_PER_LEVEL = 1, POINTS_PER_RANK = 1;
  const MAX_LEVEL = 15;

  // I LIVELLI DOVE SI SCEGLIE UN'ABILITA' PASSIVA. Il 15 non e' qui: quello e' la specializzazione,
  // che e' un'altra cosa.
  //
  // ============================================================================================
  // v2.16 — LA SCALETTA RIFATTA: si alterna, e si comincia con un'abilita' in mano
  // ============================================================================================
  // Com'era, e perche' non andava. Le passive stavano ai livelli 3-6-9-12 e le attive a 8 e 14.
  // Misurato incrociando la curva dell'XP con quella che le ondate mettono davvero a terra: il livello 8
  // arriva all'ondata 12 di 20 e il 14 all'ondata 18. Cioe' per UNDICI ondate su venti il giocatore
  // aveva in mano il clic sinistro e lo scatto, e la seconda abilita' arrivava a due ondate dalla fine —
  // la sceglievi e il gioco finiva. Parole di Paolo: «ci sono abilita' passive e solo 2 attive».
  //
  // Adesso i due elenchi si ALTERNANO sui livelli dispari, e la prima attiva si prende al livello 1,
  // prima ancora di entrare nel primo livello. Le ondate a cui arrivano sono misurate, non stimate:
  //
  //    liv 1 -> ondata 1    ·  liv 3 -> ondata 4   ·  liv 5 -> ondata 8   ·  liv 7 -> ondata 11
  //    liv 9 -> ondata 13   ·  liv 11 -> ondata 15 ·  liv 13 -> ondata 17 ·  liv 15 -> ondata 19
  //
  // Otto momenti distribuiti invece di sei ammassati in fondo. Il TEST della scaletta rifa' questo conto
  // a ogni esecuzione: se qualcuno tocca l'XP o la composizione delle ondate, se ne accorge li'.
  const SCAGLIONI = [
    { lvl: 3,  tier: 'uncommon' },
    { lvl: 5,  tier: 'rare' },
    { lvl: 9,  tier: 'epic' },
    { lvl: 11, tier: 'divine' },
  ];
  // I livelli delle ABILITA' ATTIVE. Stanno qui e non in abilities.js perche' e' la progressione a
  // decidere QUANDO si sblocca uno slot; abilities.js decide COSA c'e' dentro. Gli slot sono numerati
  // come i tasti che li attivano (1, 2, 3) — dalla v2.16 le abilita' stanno sui numeri e le pozioni su
  // Q ed E, che e' il contrario di prima.
  // Il TERZO slot esiste gia' qui ma e' VUOTO in abilities.js: Paolo ci vuole riflettere. Fino ad allora
  // il livello 13 da' solo il punto statistica e il terzo riquadro si vede spento.
  const ABIL_SLOT = [{ lvl: 1, slot: 1 }, { lvl: 7, slot: 2 }, { lvl: 13, slot: 3 }];
  function slotPerLivello(L) { for (const a of ABIL_SLOT) if (a.lvl === L) return a.slot; return null; }
  // Il prossimo livello in cui si sceglie QUALCOSA (passiva o attiva), dopo il livello L.
  function prossimaScelta(L) {
    let best = 0;
    for (const s of SCAGLIONI) if (s.lvl > L && (!best || s.lvl < best)) best = s.lvl;
    for (const a of ABIL_SLOT) if (a.lvl > L && (!best || a.lvl < best)) best = a.lvl;
    return best;
  }
  const SCAGLIONE_BY_LVL = {}; for (const s of SCAGLIONI) SCAGLIONE_BY_LVL[s.lvl] = s.tier;
  function tierForLevel(L) { return SCAGLIONE_BY_LVL[L] || null; }

  // XP_STEP[L] = quanto costa arrivare al livello L. Non e' una formula: e' una TABELLA scritta a mano,
  // perche' ogni scalino e' stato scelto guardando quanta esperienza l'ondata corrispondente mette
  // davvero a terra.
  //
  // v1.79.1 — RITARATA, ED E' STATO UN ERRORE DI MISURA. La prima taratura veniva da una simulazione in
  // cui il giocatore uccideva tutto ISTANTANEAMENTE: cosi' facendo la combo restava incollata al massimo
  // (x2,5) e l'esperienza risultava piu' che doppia di quella vera. Sul campo, alla quinta ondata si era
  // ancora di livello 2. La misura onesta e' l'XP che i mostri di un'ondata mettono a terra senza combo:
  // 102 alla prima ondata, 598 cumulate alla quarta, 6.394 alla sedicesima (col conteggio nuovo dei
  // nemici, v1.79.1). Su quella base — piu' un margine ragionevole per combo, casse e premio di velocita' —
  // il livello 15 costa 9.470 invece di 14.100, e i primi due scalini sono tarati perche il livello 2
  // arrivi entro la SECONDA ondata e il primo scaglione (il 3) entro la QUARTA, coi soli nemici uccisi:
  // e la condizione che il TEST 53 verifica ondata per ondata.
  //
  // Gli ultimi scalini restano i piu' cari: sono loro a tenere il 15 nell'ultimo quarto di partita.
  // Nel dubbio si toccano quelli, non tutta la curva.
  const XP_STEP = [0, 0, 200, 300, 420, 520, 600, 680, 740, 770, 780, 800, 830, 880, 950, 1000];
  const XP_CUM = [0, 0];
  for (let L = 2; L <= MAX_LEVEL; L++) XP_CUM[L] = XP_CUM[L - 1] + XP_STEP[L];
  // cumulate: 400 · 1100 · 1830 · 2600 · 3400 · 4300 · 5250 · 6300 · 7400 · 8550 · 9750 · 11050 · 12500 · 14100

  function levelForXp(xp) { let L = 1; while (L < MAX_LEVEL && xp >= XP_CUM[L + 1]) L++; return L; }
  function xpForLevel(L) { return XP_CUM[Math.max(1, Math.min(MAX_LEVEL, L))] || 0; }
  function xpStep(L) { return XP_STEP[Math.max(2, Math.min(MAX_LEVEL, L))] || 0; }
  function alTetto(L) { return L >= MAX_LEVEL; }
  // Quanto manca al prossimo livello e a che punto sei fra i due (0..1): serve alla barra dell'HUD.
  // Al tetto la barra e' piena e `need` vale 0: chi la disegna deve leggere `cap`, non dividere per need.
  function progress(xp) {
    const L = levelForXp(xp);
    if (L >= MAX_LEVEL) return { level: L, cur: 0, need: 0, frac: 1, cap: true };
    const base = XP_CUM[L], next = XP_CUM[L + 1];
    return { level: L, cur: xp - base, need: next - base, frac: (xp - base) / (next - base), cap: false };
  }

  // ===== RANGHI ==============================================================================
  // v1.79 — i ranghi coincidono coi momenti di scelta: 3, 6, 9, 12 e 15. La prima fascia (livelli 1-2)
  // e' il titolo di partenza e non e' un rango guadagnato; l'ultima (15) non da' un punto ma la
  // SPECIALIZZAZIONE. In mezzo, quattro ranghi da un punto l'uno: 14 punti dai livelli + 4 dai ranghi
  // fanno i 18 punti di una run intera (PROGRESSIONE-2.md §12).
  const RANK_LEVELS = [1, 3, 6, 9, 12, 15];
  const RANK_SPEC = 6;          // la sesta fascia e' la specializzazione
  function rankForLevel(L) { let r = 1; for (let i = 0; i < RANK_LEVELS.length; i++) if (L >= RANK_LEVELS[i]) r = i + 1; return r; }
  function levelForRank(r) { return RANK_LEVELS[Math.max(0, Math.min(RANK_LEVELS.length - 1, r - 1))]; }
  // v2.16 — I RANGHI SONO SOLO SCENICI. Davano un punto statistica ciascuno (le fasce 2-5, quattro punti
  // in tutto); adesso danno il titolo e basta. Deciso da Paolo sapendo il prezzo, che e' stato misurato e
  // va scritto qui perche' non lo si riscopra per caso: il budget di una partita passa da 18 punti a 14,
  // cioe' -22%, su un sistema in cui i punti sono l'unica cosa che alza danno e PV. Se un giorno il
  // personaggio risultasse troppo magro, la via che Paolo ha in mente e' alzare le STATISTICHE DI BASE,
  // non rimettere i punti qui.
  function puntiPerRango(r) { return 0 * r * POINTS_PER_RANK; }

  // Sei fasce, non piu' cinque: la prima e' il titolo con cui si comincia (livelli 1-2), l'ultima e' la
  // specializzazione e non ha un nome fisso.
  // v2.18 — SETTE SCALE DI TITOLI, e la sesta non e' piu' vuota. Era `null` perche' al sesto rango
  // parlava la specializzazione; le specializzazioni non esistono piu' (vedi SPECS qui sotto), quindi
  // l'ultimo gradino ha un nome suo. I ranghi restano puramente scenici — `puntiPerRango()` torna 0.
  const RANK_NAMES = {
    barbaro:   ['Predone', 'Razziatore', 'Berserker', 'Distruttore', 'Furia del Nord', 'Flagello'],
    paladino:  ['Scudiero', 'Cavaliere', 'Giurato', 'Campione', 'Baluardo', 'Luce della Faglia'],
    maestro:   ['Schermidore', 'Duellante', 'Spadaccino', 'Maestro di Scherma', 'Lama Doppia', 'Mano Perfetta'],
    assassino: ['Tagliagole', 'Sicario', 'Lama Silente', 'Ombra', 'Spettro', 'Nome Dimenticato'],
    arciere:   ['Battitore', 'Tiratore', 'Cacciatore', 'Arciere Scelto', 'Occhio Lungo', 'Freccia Nera'],
    mago:      ['Apprendista', 'Mago Giovane', 'Mago', 'Mago Anziano', 'Magister', 'Arcimago'],
    warlock:   ['Iniziato', 'Patteggiato', 'Invocatore', 'Malediziere', 'Signore del Patto', 'Voce dell Abisso'],
  };
  function rankName(heroId, level, specId) {
    const r = rankForLevel(level);
    const scala = RANK_NAMES[heroId] || RANK_NAMES.barbaro;
    return scala[Math.max(0, Math.min(scala.length - 1, r - 1))];
  }

  // ===== PUNTI ===============================================================================
  // Costo per portare una statistica DA `lvl` A `lvl+1`. Cresce a scaglioni: 1 fino al 4°, 2 fino al
  // 10°, 3 per gli ultimi due. Totale per il tetto: 22 punti, contro i 23 di una run intera.
  // v1.79 — COSTO FISSO: 1 punto per livello, a qualunque altezza. Gli scaglioni 1/2/3 sono spariti.
  // Il conto e' esatto: 18 punti in una run, cappare una statistica ne costa 12 e portarne una seconda
  // a 6 ne costa 6. Cappare DUE statistiche (24) resta impossibile, che e' la regola voluta.
  function statPointCost(lvl) { return 1; }
  function statPointsTo(lvl) { return lvl; }
  // Punti guadagnati arrivando al livello L (senza contare quelli dei boss).
  function pointsForLevel(L) { return Math.max(0, (L - 1) * POINTS_PER_LEVEL); }

  // ===== CARTE DI RANGO — RIMOSSE in v1.70 ====================================================
  // Le 27 carte generiche (Parata, Sfondamento, Bolla Densa...) sono state tolte: al loro posto
  // arriveranno le ABILITA' DI CLASSE, sbloccate a livelli specifici come in un gioco di ruolo (le
  // magie del mago, i colpi del guerriero). Il rango resta il momento in cui il personaggio evolve e
  // il contenitore e' gia' pronto: `cardsFor()` risponde vuoto, quindi il server salta l'offerta senza
  // rami condizionali sparsi. Quando le abilita' arriveranno, basta riempire questa tabella.
  const CARDS = {};

  // ===== RANGO V — il bivio ==================================================================
  // Non sono lo stesso personaggio piu' forte: in ogni coppia uno rende SUBITO e uno rende DI PIU'
  // ma chiede qualcosa (una squadra, un bersaglio grosso, il posizionamento). Se dalle misure uscisse
  // che un ramo e' semplicemente migliore, va corretto quello — non il suo gemello.
  // v1.85 — LE SEI ABILITA' PROMESSE QUI SONO DIVENTATE LE ATTIVE DEL LIVELLO 12 (abilities.js), e non
  // si prendono piu' con la specializzazione: si scelgono a meta' partita e si giocano per mezza run.
  // La specializzazione tiene il suo passivo e in cambio ALZA LA POTENZA DELLE ABILITA' (abilityMult):
  // il campo `abilita` qui sotto resta come descrizione di cosa il ramo sa fare meglio.
  // ============================================================================================
  // v2.18 — LE SPECIALIZZAZIONI NON ESISTONO PIU'
  // ============================================================================================
  // Erano il bivio del livello 15: Paladino / Maestro d'Armi per il guerriero, Arcimago / Stregone per
  // il mago, Assassino / Cacciatore di Teste per il ladro. Parole di Paolo, quando abbiamo deciso le
  // sette classi: *«ovviamente le specializzazioni del livello 15 spariscono»* — ed e' inevitabile, non
  // una scelta di gusto: quattro di quei sei nomi (Paladino, Maestro d'Armi, Assassino, Stregone) sono
  // diventati CLASSI. Tenerli avrebbe voluto dire un assassino che al quindicesimo si specializza in
  // assassino, e due `SPEC_BY_ID['assassino']` e `HEROES['assassino']` che si somigliano abbastanza da
  // far sbagliare chiunque legga il codice fra sei mesi.
  //
  // La tabella resta VUOTA e non cancellata, con le sue funzioni: `specsFor()` risponde con una lista
  // vuota, quindi il server salta l'offerta del bivio senza che nessuno debba aggiungere un `if`, e il
  // moltiplicatore SPEC_ABIL_MULT non si applica mai perche' `p.spec` resta nullo. E' lo stesso modo in
  // cui la v1.70 ha svuotato CARDS.
  //
  // Cosa fa adesso il livello 15: e' il tetto, da' il punto statistica e il titolo dell'ultimo rango.
  const SPECS = {};
  const SPEC_BY_ID = {}; for (const h in SPECS) for (const s of SPECS[h]) SPEC_BY_ID[s.id] = s;
  const CARD_BY_ID = {}; for (const h in CARDS) for (const r in CARDS[h]) for (const c of CARDS[h][r]) { c.hero = h; c.rank = +r; CARD_BY_ID[c.id] = c; }

  function cardsFor(heroId, rank) { return (CARDS[heroId] && CARDS[heroId][rank]) || []; }
  function specsFor(heroId) { return SPECS[heroId] || []; }

  return {
    POINTS_PER_LEVEL, POINTS_PER_RANK, XP_STEP, XP_CUM, MAX_LEVEL, alTetto,
    SCAGLIONI, tierForLevel, ABIL_SLOT, slotPerLivello, prossimaScelta,
    levelForXp, xpForLevel, xpStep, progress,
    RANK_LEVELS, RANK_NAMES, RANK_SPEC, rankForLevel, levelForRank, rankName, puntiPerRango,
    statPointCost, statPointsTo, pointsForLevel,
    CARDS, CARD_BY_ID, cardsFor, SPECS, SPEC_BY_ID, specsFor,
  };
});
