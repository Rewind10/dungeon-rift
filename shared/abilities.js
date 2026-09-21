/* abilities.js — LE ABILITA' ATTIVE (UMD)

   ============================================================================================
   v2.18 — DA DODICI A TRENTA: LE FIRME DI CLASSE
   ============================================================================================
   Fino alla 2.17 c'erano dodici abilita' divise fra tre eroi, e ogni slot era una scelta fra due.
   Adesso le classi sono sette (piu' le tre scuole del mago) e il modello e' quello deciso da Paolo:

     LIVELLO 1  — la FIRMA. Non si sceglie: e' quello che sei. *«la scelta diventa una sorta di
                  abilita' di classe che ti viene data in base al personaggio, perciò non sparisce,
                  semplicemente non c'è scelta»*. L'unica eccezione e' il MAGO, che sceglie la
                  SCUOLA — elementare, evocazione o negromanzia — e da quella prende il titolo.
     LIVELLO 7  — una scelta fra DUE: una abilita' NUOVA, sua e di nessun altro, e una del
                  SERBATOIO, cioe' una delle dodici che esistevano gia', scelta perche' le calza.
     LIVELLO 13 — idem.

   Il serbatoio e' cio' che tiene basso il costo di tutto questo: le dodici vecchie non sono state
   toccate (tranne le durate, vedi sotto) e vengono riusate da piu' classi. Le nuove sono diciotto,
   piu' le nove firme.

   ============================================================================================
   LA REGOLA DEI 10 SECONDI, e le sue tre eccezioni
   ============================================================================================
   *«10 secondi a tutte quelle che hanno un tempo di effetto, altre come evocazioni non hanno limiti
   temporali»*. Una regola sola al posto di dodici numeri diversi. Le eccezioni sono tre e hanno tutte
   la stessa ragione — NON sono effetti a tempo:

     TURBINE (1,2s) e SALVA (2s) hanno un'AZIONE a tempo, non un effetto: tre rotazioni e quindici
     frecce. A 10s non si prolunga niente, diventano un'altra abilita'.
     TAGLIOLA blocca 2,5s: un blocco da 10 secondi non rallenta un mostro, lo cancella dalla partita.

   E una quarta cosa che esce dalla regola da un'altra parte: lo SCUDO DI MANA non scade affatto.
   *«lo scudo di mana di solito non e' a tempo, semplicemente la barriera dopo tot danni si rompe»*.
   Assorbe 8 danni per punto di Intelligenza e dura fino alla FINE DELL'ONDATA.

   ============================================================================================
   LE RICARICHE NON SI TOCCANO
   ============================================================================================
   30s / 45s / 60s, come prima che le durate salissero a 10. Con un effetto da 10 secondi su una
   ricarica da 30 un'abilita' del primo slot e' attiva un terzo del tempo: e' stato segnalato e Paolo
   lo accetta con una ragione di gioco precisa — *«spesso ci si dimentica di usarle»*, e una ricarica
   lunga peggiora quel problema invece di risolverlo. Se un giorno la partita risultasse facile, si
   guardi alla difficolta' delle ondate, non a queste tre cifre.

   ============================================================================================
   NESSUNA ABILITA' CURA. MAI.
   ============================================================================================
   Niente Tocco Vampirico, niente Imposizione delle Mani, per quanto siano le prime due cose che
   vengono in mente scrivendo un warlock e un paladino. Rimettere in piedi il personaggio e' il
   mestiere dell'OSTESSA, e il codice lo difende da dodici versioni (v1.74, v1.93, TEST 58). Chi
   aggiunge la trentunesima abilita' non lo scopra sbagliando. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Abilities = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CD_1 = 30, CD_2 = 45, CD_3 = 60;     // le ricariche, uguali per tutte le classi
  const LVL_1 = 1, LVL_2 = 7, LVL_3 = 13;
  const CD_Q = CD_1, CD_E = CD_2, LVL_Q = LVL_1, LVL_E = LVL_2;   // vecchi alias
  const DUR = 10;                            // la regola: ogni effetto a tempo dura 10 secondi

  // ============================================================================================
  // IL SERBATOIO — le dodici che esistevano gia'
  // ============================================================================================
  // Non sono state riscritte: sono le stesse, con le durate portate a 10 dove la regola si applica.
  // Ogni abilita' porta i propri numeri, il server non ne ha nessuno cucito addosso. I danni sono
  // MOLTIPLICATORI del colpo base (effDamage), non numeri fissi: cosi' un'abilita' presa presto vale
  // ancora qualcosa all'ondata 18, senza tabelle di scala separate da tenere allineate.
  const SERBATOIO = {
    ab_carica: { name: 'Carica', icon: '⚡', color: '#ffd27a',
      desc: 'Scatti in avanti attraversando i nemici: chi tocchi prende il doppio del fendente, vola via ed e stordito. Sei immune durante la corsa.',
      breve: 'Scatto corazzato che sfonda e stordisce',
      durata: 0.42, spinta: 1.25, raggio: 46, dmgMult: 2.0, stun: 0.9, knock: 260 },
    ab_grido: { name: 'Grido di Guerra', icon: '📣', color: '#ffb45a',
      desc: 'Un urlo: i nemici intorno prendono di mira TE, e tu e i compagni nel raggio subite il 25% di danni in meno. I boss non ti danno retta.',
      breve: 'Attiri i nemici e proteggi la squadra',
      raggio: 260, taunt: DUR, dur: DUR, dr: 0.25 },
    // ECCEZIONE 1 — azione a tempo, non effetto a tempo: resta 1,2s.
    ab_turbine: { name: 'Turbine', icon: '🌀', color: '#ffe9a8',
      desc: 'Tre rotazioni a giro pieno in 1,2s: ogni giro colpisce tutto intorno a te per il 70% del fendente. Ti muovi piu piano mentre giri.',
      breve: 'Tre fendenti a 360 gradi',
      giri: 3, dur: 1.2, raggio: 115, quota: 0.7, lento: 0.7, _noRegola10: 1 },
    ab_giuramento: { name: 'Giuramento', icon: '✨', color: '#ffe9a8',
      desc: 'Tu e i compagni entro 220px siete immuni al PRIMO colpo che arriva. Non fa danno: e il momento in cui si regge l ondata.',
      breve: 'Tu e i compagni immuni al primo colpo',
      raggio: 220, dur: DUR },
    ab_muro: { name: 'Muro di Fuoco', icon: '🔥', color: '#ff8a3b',
      desc: 'Una barriera di fiamme lunga 220px davanti a te: chi la attraversa brucia. Non uccide, decide da dove ti arrivano addosso.',
      breve: 'Barriera di fiamme che sbarra il passo',
      len: 220, dur: DUR, spessore: 24, dmgMult: 0.55, tick: 0.25 },
    // ECCEZIONE 4 — non ha `dur` affatto: assorbe e si rompe. `perInt` e' quanto assorbe per ogni
    // punto di Intelligenza; `fineOndata` dice al server di spegnerlo quando l'ondata finisce.
    ab_scudo: { name: 'Scudo di Mana', icon: '🫧', color: '#7dffea',
      desc: 'Una bolla che assorbe 8 danni per ogni punto di Intelligenza e dura fino a fine ondata. Quando si rompe esplode: respinge e rallenta chi ti sta addosso.',
      breve: 'Assorbe danni finche non si rompe',
      perInt: 8, fineOndata: 1, ondaR: 150, ondaKnock: 220 },
    ab_meteora: { name: 'Meteora', icon: '☄️', color: '#ff7a3b',
      desc: 'Tre impatti a caduta attorno al punto mirato, telegrafati a terra. Danno grosso su chi non si muove: si mira dove SARANNO.',
      breve: 'Tre impatti a caduta sul punto mirato',
      colpi: 3, r: 92, sparg: 78, ritardo: 0.5, passo: 0.32, dmgMult: 2.2, gittata: 560 },
    ab_catena: { name: 'Catena Nera', icon: '⛓️', color: '#b061ff',
      desc: 'Un fulmine che rimbalza fra otto nemici, con danno calante a ogni salto. Il contrario della Meteora: quasi niente su uno, devastante su venti.',
      breve: 'Fulmine che rimbalza fra otto nemici',
      salti: 8, dmgMult: 1.6, calo: 0.84, gittata: 420, salto: 260 },
    ab_tempo: { name: 'Tempo Rubato', icon: '⏳', color: '#8fd8ff',
      desc: 'Il mondo va al 35%: mostri, colpi nemici, tutto. Tu no. Non fa danno: ti da il tempo di deciderlo.',
      breve: 'Il mondo rallenta, tu no',
      dur: DUR, fattore: 0.35 },
    // ECCEZIONE 3 — il BLOCCO resta 2,5s. La durata dell'innesco (25s armata) non e' un effetto a
    // tempo addosso a qualcuno: e' quanto resta per terra, e non la tocca la regola.
    ab_tagliola: { name: 'Tagliola', icon: '🪤', color: '#cfd8dc',
      desc: 'Piazzi una trappola dove sei: il primo che ci entra resta bloccato 2,5s e prende danno. Resta armata 25s, fino a tre in campo.',
      breve: 'Trappola che blocca il primo che passa',
      r: 34, arma: 25, blocco: 2.5, dmgMult: 2.5, max: 3, _noRegola10: 1 },
    ab_marchio: { name: 'Marchio', icon: '🎯', color: '#ff5a7a',
      desc: 'Segni il nemico che stai mirando: prende il 50% di danni in piu DA CHIUNQUE. Se muore marchiato, meta ricarica torna indietro.',
      breve: 'Il bersaglio prende +50% danni da tutti',
      dur: DUR, mult: 1.5, gittata: 560, rimborso: 0.5 },
    // ECCEZIONE 2 — quindici frecce in due secondi: azione, non effetto.
    ab_salva: { name: 'Salva', icon: '🏹', color: '#9ef0b0',
      desc: 'Quindici frecce in due secondi verso dove miri, perforanti. La finestra in cui si smette di scappare.',
      breve: 'Quindici frecce in due secondi',
      colpi: 15, dur: 2, dmgMult: 0.8, sparg: 0.10, pierce: 1, _noRegola10: 1 },
  };

  // ============================================================================================
  // LE DICIOTTO NUOVE, piu' le nove firme
  // ============================================================================================
  // Fra parentesi, nella descrizione breve del documento, c'e' da dove viene l'ispirazione. Qui conta
  // che ognuna si appoggia a una meccanica che il motore sa gia' fare: buff a tempo, aura, blink,
  // salve, catene, campi a terra, esecuzione, veleno. Le uniche due che chiedono qualcosa di nuovo
  // sono le EVOCAZIONI, e si appoggiano alla macchina del MERCENARIO, che e' gia' un alleato guidato
  // dall'IA con i suoi PV e la sua arma.
  const NUOVE = {
    // ---- BARBARO ----------------------------------------------------------------------------
    ab_furia: { name: 'Furia', icon: '🩸', color: '#c4542f',
      desc: 'Fai il 50% di danno in piu e ne incassi il 25% in piu. Mentre dura non puoi bere: si va avanti e basta.',
      breve: 'Piu danno, piu danni presi, niente pozioni',
      dur: DUR, dmgMult: 1.5, presi: 1.25, nienteBere: 1 },
    ab_spaccaossa: { name: 'Spaccaossa', icon: '🪓', color: '#e08a3a',
      desc: 'Carichi il colpo e lo scarichi in linea retta: sfonda tutti quelli in fila e li stordisce.',
      breve: 'Colpo in linea retta che sfonda e stordisce',
      len: 300, largo: 52, dmgMult: 3.0, stun: 1.2, knock: 200 },
    ab_respiro: { name: 'Ultimo Respiro', icon: '💢', color: '#ff6b6b',
      desc: 'Non puoi scendere sotto 1 PV. Quando finisce ti torna addosso meta di quello che hai schivato — o sei ancora in piedi.',
      breve: 'Non puoi cadere, ma il conto arriva dopo',
      dur: DUR, quota: 0.5 },
    // ---- PALADINO ---------------------------------------------------------------------------
    ab_benedizione: { name: 'Benedizione', icon: '✨', color: '#e0b64a',
      desc: 'Aura di 220px: tu e i compagni dentro subite il 25% di danni in meno, e il 20% di quello che incassate torna al mittente.',
      breve: 'Aura che protegge e rimanda i colpi',
      raggio: 220, dur: DUR, dr: 0.25, spine: 0.20 },
    ab_punizione: { name: 'Punizione Divina', icon: '⚡', color: '#ffe9a8',
      desc: 'Il fendente esplode in luce: danno pieno sul bersaglio, meta su tutto intorno.',
      breve: 'Fendente che esplode in luce',
      raggio: 170, dmgMult: 2.6, quota: 0.5, knock: 160 },
    ab_baluardo: { name: 'Baluardo Sacro', icon: '🛡️', color: '#ffd27a',
      desc: 'Pianti lo scudo: i colpi frontali non ti toccano e chi ti sbatte contro rimbalza e brucia.',
      breve: 'I colpi davanti non passano',
      dur: DUR, cono: 1.25, knock: 240, dmgMult: 0.8 },
    // ---- MAESTRO D'ARMI ---------------------------------------------------------------------
    ab_danza: { name: 'Danza delle Lame', icon: '⚔️', color: '#b4463c',
      desc: 'La cadenza sale del 60% e ti muovi a velocita piena mentre colpisci. E il contrario del Turbine, che ti inchioda.',
      breve: 'Cadenza altissima senza rallentare',
      dur: DUR, rate: 1.6, passo: 1.0 },
    ab_parata: { name: 'Parata e Risposta', icon: '🗡️', color: '#dfe5ee',
      desc: 'Pari un colpo ogni 1,5s, e ogni parata fa partire un contrattacco.',
      breve: 'Pari e rispondi, un colpo ogni 1,5s',
      dur: DUR, passo: 1.5, dmgMult: 1.8, raggio: 110 },
    ab_impeto: { name: 'Impeto', icon: '⏱️', color: '#ffd27a',
      desc: 'Le ricariche di tutte le altre abilita scorrono al doppio, e ti muovi piu veloce.',
      breve: 'Ricariche al doppio',
      dur: DUR, cdr: 2.0, passo: 1.25 },
    // ---- ASSASSINO --------------------------------------------------------------------------
    ab_ombra: { name: 'Ombra Lunga', icon: '🌑', color: '#7d8ab0',
      desc: 'Sparisci e ricompari dietro il bersaglio mirato: il colpo che segue e un critico garantito.',
      breve: 'Riappari alle spalle, colpo critico',
      gittata: 420, dietro: 42, critGarantiti: 1 },
    ab_lame_verdi: { name: 'Lame Sporche di Verde', icon: '🧪', color: '#9ef0b0',
      desc: 'Ogni colpo avvelena, e il veleno si somma su chi lo prende piu volte.',
      breve: 'Ogni colpo avvelena, e il veleno si somma',
      dur: DUR, quota: 0.08, stackMax: 5, durVeleno: 3 },
    ab_mortale: { name: 'Colpo Mortale', icon: '💀', color: '#b061ff',
      desc: 'Qualunque nemico sotto il 30% di vita che colpisci muore sul posto. I boss no: prendono un danno enorme.',
      breve: 'Sotto il 30% muoiono sul colpo',
      dur: DUR, soglia: 0.30, bossMult: 4.0 },
    // ---- ARCIERE ----------------------------------------------------------------------------
    ab_pioggia: { name: 'Pioggia di Frecce', icon: '🏹', color: '#4e8a4a',
      desc: 'Una salva su un area scelta, non su un bersaglio: si tira dove SARANNO.',
      breve: 'Salva su un area, non su un bersaglio',
      // come la Salva: `dur` e' quanto ci mette a cadere la salva, non un effetto addosso a qualcuno.
      colpi: 18, r: 130, dur: 1.6, dmgMult: 0.75, gittata: 620, _noRegola10: 1 },
    ab_ancorato: { name: 'Tiro Ancorato', icon: '🎯', color: '#9ef0b0',
      desc: 'Se non ti muovi il danno cresce a ogni freccia fino al 60% in piu; al primo passo riparte da zero.',
      breve: 'Fermo, il danno cresce a ogni colpo',
      dur: DUR, passo: 0.06, tetto: 0.60 },
    ab_fulmine: { name: 'Freccia di Fulmine', icon: '🌩️', color: '#8fd8ff',
      desc: 'Una freccia che al primo impatto scarica un fulmine su tutti i nemici allineati dietro.',
      breve: 'Freccia che scarica un fulmine in linea',
      salti: 6, dmgMult: 2.2, calo: 0.90, gittata: 520, salto: 200 },
    // ---- WARLOCK ----------------------------------------------------------------------------
    // ============================================================================================
    // v2.19.7 — LO ZOMBIE DEL PATTO, la nuova firma del warlock
    // ============================================================================================
    // Paolo: *«si potrebbe assegnare l'evocazione al warlock, al posto di Patto, che e' un po' un
    // doppione di Maledizione Contagiosa. L'evocazione non avra' cooldown ma sara' possibile solo 1
    // volta per ondata. Il personaggio evocato deve essere uno zombie, simile a quelli nemici.»*
    //   · `unaPerOndata`: nessuna ricarica a tempo — si usa una volta, e torna all'ondata dopo;
    //   · lo zombie si SGRETOLA a fine ondata (scelta di Paolo): mai piu' di uno in campo;
    //   · PV e danno sono quote del warlock, e crescono col suo Carisma (tramite la potenza magica).
    // Il Patto resta definito qui sotto ma non lo ha piu' nessuna classe.
    ab_zombie: { name: 'Zombie del Patto', icon: '🧟', color: '#c06bff',
      desc: 'Alzi uno zombie che combatte per te fino alla fine dell ondata. Una volta per ondata, niente ricarica.',
      breve: 'Uno zombie alleato, una volta per ondata',
      evoca: 1, quanti: 1, hpQuota: 1.4, dmgQuota: 0.70, corpo: 'zombie', gittata: 420, unaPerOndata: 1 },
    ab_patto: { name: 'Patto', icon: '⛓️', color: '#c06bff',
      desc: 'Maledici un nemico: prende il 35% di danni in piu, e se muore maledetto il tuo colpo successivo vale doppio.',
      breve: 'Maledizione che pesa sul bersaglio',
      dur: DUR, mult: 1.35, gittata: 560, premio: 2.0 },
    ab_fame: { name: 'Fame delle Tenebre', icon: '🌑', color: '#8b43c4',
      desc: 'Una zona di buio: dentro si va piano e si perde vita di continuo.',
      breve: 'Zona di buio che rallenta e consuma',
      r: 190, dur: DUR, lento: 0.45, dmgMult: 0.35, tick: 0.25 },
    ab_contagio: { name: 'Maledizione Contagiosa', icon: '🔗', color: '#c06bff',
      desc: 'Maledici un nemico: prende piu danni, e quando muore la maledizione salta al nemico piu vicino.',
      breve: 'La maledizione salta di morto in morto',
      dur: DUR, mult: 1.35, salto: 240, gittata: 560 },
    // ---- MAGO · ELEMENTALE ------------------------------------------------------------------
    // Le due che leggono l'ELEMENTO dell'arma impugnata. Attenzione: gli elementi delle verghe (fuoco,
    // gelo, fulmine, veleno) NON ESISTONO ANCORA — oggi le armi del mago si distinguono quasi solo per
    // il raggio della bolla. Finche' non esistono, `elemento` resta 'fuoco' per tutti e queste due si
    // comportano come le loro versioni di fuoco. E' scritto nel documento come dipendenza.
    ab_scarica: { name: 'Scarica Elementale', icon: '🔥', color: '#ff8a3b',
      desc: 'Un esplosione dell elemento dell arma che impugni: fuoco, gelo, fulmine o veleno. Una abilita, quattro facce.',
      breve: 'Esplosione dell elemento che impugni',
      raggio: 160, dmgMult: 2.4, elementale: 1 },
    ab_impronta: { name: 'Impronta Elementale', icon: '💠', color: '#5aa8ff',
      desc: 'Ogni bolla lascia a terra una pozza dell elemento impugnato: brucia, rallenta, stordisce o avvelena.',
      breve: 'Le bolle lasciano pozze elementali',
      dur: DUR, r: 62, durPozza: 3, dmgMult: 0.30, tick: 0.25, elementale: 1 },
    ab_palla: { name: 'Palla di Fuoco', icon: '☄️', color: '#ff7a3b',
      desc: 'Danno ad area dell elemento impugnato: il fuoco esplode, il gelo congela la zona, il fulmine rimbalza fra i colpiti, il veleno lascia la pozza.',
      breve: 'Danno ad area, dell elemento che impugni',
      raggio: 175, dmgMult: 3.0, gittata: 560, elementale: 1 },
    // ---- MAGO · EVOCAZIONE ------------------------------------------------------------------
    // Le evocazioni NON hanno durata: *«altre come evocazioni non hanno limiti temporali»*. Restano
    // finche' non muoiono. Si appoggiano alla macchina del mercenario (un alleato con IA, PV e arma).
    ab_evoca: { name: 'Evocazione', icon: '👹', color: '#7dffea',
      desc: 'Chiami un compagno dove punti. Resta finche non muore.',
      breve: 'Un compagno evocato, senza limite di tempo',
      evoca: 1, quanti: 1, hpQuota: 1.2, dmgQuota: 0.60, corpo: 'guerriero', gittata: 420 },
    ab_branco: { name: 'Richiamo del Branco', icon: '🐺', color: '#9ef0b0',
      desc: 'Invece di una creatura ne chiami tre, piccole e veloci.',
      breve: 'Tre creature piccole e veloci',
      evoca: 1, quanti: 3, hpQuota: 0.55, dmgQuota: 0.34, corpo: 'ladro', gittata: 420 },
    ab_evoca_magg: { name: 'Evocazione Maggiore', icon: '🔱', color: '#5aa8ff',
      desc: 'Una sola creatura grande, che regge i colpi e picchia ad area.',
      breve: 'Una creatura grande che regge e picchia',
      evoca: 1, quanti: 1, hpQuota: 2.6, dmgQuota: 1.05, corpo: 'guerriero', grande: 1, gittata: 420 },
    // ---- MAGO · NEGROMANZIA -----------------------------------------------------------------
    ab_rialzata: { name: 'Rialzata', icon: '💀', color: '#b061ff',
      desc: 'L ultimo mostro che hai ucciso si rialza e combatte per te. Resta finche non muore.',
      breve: 'L ultimo ucciso combatte per te',
      evoca: 1, quanti: 1, hpQuota: 0.9, dmgQuota: 0.55, corpo: 'guerriero', dalCadavere: 1 },
    ab_nube: { name: 'Nube Mortifera', icon: '☠️', color: '#7bbf4a',
      desc: 'Una nube di veleno che avanza lentamente: dentro si perde vita e si va piano.',
      breve: 'Nube di veleno che avanza',
      r: 150, dur: DUR, lento: 0.6, dmgMult: 0.42, tick: 0.25, deriva: 34 },
    ab_dito: { name: 'Dito della Morte', icon: '⚰️', color: '#b061ff',
      desc: 'Un raggio che uccide sul colpo un nemico non boss, e quello si rialza al tuo fianco.',
      breve: 'Uccide e rialza il bersaglio',
      gittata: 520, bossMult: 3.2, evoca: 1, quanti: 1, hpQuota: 0.9, dmgQuota: 0.55, corpo: 'guerriero', dalBersaglio: 1 },
  };

  // ============================================================================================
  // CHI PUO' PRENDERE COSA
  // ============================================================================================
  // `firma` e' l'abilita' del livello 1, che si riceve. `2` e `3` sono le DUE candidate dei livelli 7
  // e 13, nell'ordine in cui vanno mostrate: prima la nuova di classe, poi quella del serbatoio.
  const PER_CLASSE = {
    barbaro:   { firma: 'ab_furia',        2: ['ab_spaccaossa', 'ab_carica'],   3: ['ab_respiro', 'ab_turbine'] },
    paladino:  { firma: 'ab_benedizione',  2: ['ab_punizione', 'ab_grido'],     3: ['ab_baluardo', 'ab_giuramento'] },
    maestro:   { firma: 'ab_danza',        2: ['ab_parata', 'ab_turbine'],      3: ['ab_impeto', 'ab_carica'] },
    assassino: { firma: 'ab_ombra',        2: ['ab_lame_verdi', 'ab_tagliola'], 3: ['ab_mortale', 'ab_marchio'] },
    arciere:   { firma: 'ab_pioggia',      2: ['ab_ancorato', 'ab_salva'],      3: ['ab_fulmine', 'ab_tempo'] },
    warlock:   { firma: 'ab_zombie',       2: ['ab_fame', 'ab_catena'],         3: ['ab_contagio', 'ab_scudo'] },
  };
  // Il MAGO e' l'unico con tre percorsi: la scuola scelta al livello 1 filtra anche il 7 e il 13.
  // Non e' una complicazione in piu': e' la conseguenza diretta di dare a ogni scuola le sue abilita'.
  // v2.19.7 — UNA SCUOLA SOLA. Evocazione e negromanzia sono tolte (Paolo: *«troppo simili»*); le loro
  // abilita' restano definite sopra ma non le offre piu' nessuno. La struttura a scuole resta, con una
  // voce: se un giorno ne nasce un'altra, si aggiunge qui.
  const SCUOLE_MAGO = {
    elementale:  { firma: 'ab_scarica',  2: ['ab_impronta', 'ab_muro'],  3: ['ab_palla', 'ab_meteora'] },
  };
  const TITOLO_SCUOLA = { elementale: 'Elementalista' };

  // ============================================================================================
  // Si costruisce BY_ID una volta sola, unendo serbatoio e nuove e stampandoci sopra id, cd e livello.
  // ============================================================================================
  const BY_ID = {};
  for (const id in SERBATOIO) { const a = SERBATOIO[id]; a.id = id; a.serbatoio = 1; BY_ID[id] = a; }
  for (const id in NUOVE)     { const a = NUOVE[id];     a.id = id; a.nuova = 1;     BY_ID[id] = a; }

  // Un'abilita' puo' comparire a slot diversi per classi diverse (il Turbine e' slot 3 per il barbaro e
  // slot 2 per il maestro d'armi): slot, livello e ricarica NON stanno sull'abilita', si chiedono al
  // momento. Era il difetto del vecchio modello, dove `a.slot` era scritto addosso e quindi un'abilita'
  // poteva appartenere a uno slot solo, per sempre.
  const CD = { 1: CD_1, 2: CD_2, 3: CD_3 };
  function cdDiSlot(slot) { return CD[slot] || CD_1; }
  function livelloDiSlot(slot) { return slot === 1 ? LVL_1 : slot === 2 ? LVL_2 : LVL_3; }
  function slotPerLivello(L) { return L === LVL_1 ? 1 : L === LVL_2 ? 2 : L === LVL_3 ? 3 : null; }

  function _tabella(heroId, scuola) {
    // v2.19.7 — senza scuola (o con una che non esiste piu', da un salvataggio vecchio) il mago e'
    // elementalista: e' l'unica.
    if (heroId === 'mago') return SCUOLE_MAGO[scuola] || SCUOLE_MAGO.elementale;
    return PER_CLASSE[heroId] || null;
  }
  // Le candidate di uno slot, gia' vestite con lo slot e la ricarica di QUESTO slot. Torna una lista
  // vuota se la classe non esiste o se e' un mago senza scuola scelta: chi chiama salta l'offerta.
  function perSlot(heroId, slot, scuola) {
    // IL MAGO SENZA SCUOLA, AL LIVELLO 1. E' il caso che regge tutta la sua progressione: finche' non ha
    // scelto, le sue candidate del primo slot sono LE TRE FIRME delle tre scuole. Senza questo ramo la
    // lista tornerebbe vuota, il server non metterebbe mai la scelta in coda, e il mago resterebbe senza
    // scuola — e quindi senza abilita' nemmeno al 7 e al 13, che dalla scuola dipendono.
    let ids;
    if (heroId === 'mago' && slot === 1 && !scuola && Object.keys(SCUOLE_MAGO).length > 1) {
      ids = Object.keys(SCUOLE_MAGO).map(k => SCUOLE_MAGO[k].firma);
    } else {
      const t = _tabella(heroId, scuola);
      if (!t) return [];
      ids = slot === 1 ? [t.firma] : (t[slot] || []);
    }
    return ids.map(id => BY_ID[id]).filter(Boolean)
      .map(a => Object.assign({}, a, { slot, lvl: livelloDiSlot(slot), cd: cdDiSlot(slot), hero: heroId }));
  }
  // La firma, cioe' l'abilita' del livello 1 che NON si sceglie.
  function firma(heroId, scuola) { const l = perSlot(heroId, 1, scuola); return l[0] || null; }
  // Le tre scuole del mago, per la schermata di scelta.
  function scuoleMago() {
    return Object.keys(SCUOLE_MAGO).map(id => ({
      id, titolo: TITOLO_SCUOLA[id], firma: BY_ID[SCUOLE_MAGO[id].firma],
    }));
  }
  // Vero se questa classe sceglie qualcosa al livello 1 (solo il mago: la sua scuola).
  // v2.19.7 — con una scuola sola non c'e' piu' niente da scegliere: il mago riceve la firma come tutti.
  function sceglieAlPrimo(heroId) { return heroId === 'mago' && Object.keys(SCUOLE_MAGO).length > 1; }
  // La scuola del mago a cui appartiene una firma, o null. Serve al server quando il giocatore sceglie:
  // l'id che arriva e' quello dell'ABILITA', e da li' si risale al titolo da assegnargli.
  function scuolaDiFirma(id) { for (const k in SCUOLE_MAGO) if (SCUOLE_MAGO[k].firma === id) return k; return null; }
  // A quale slot appartiene questa abilita' PER QUESTA CLASSE, o null se la classe non la puo' avere.
  //
  // v2.18 — QUESTA FUNZIONE SOSTITUISCE `a.hero === p.heroId`. Il vecchio controllo funzionava finche'
  // ogni abilita' apparteneva a un eroe solo; adesso il Turbine e' del barbaro E del maestro d'armi, a
  // slot diversi, quindi la domanda «di chi e' questa abilita'» non ha piu' una risposta. La domanda
  // giusta e' «questa classe puo' averla, e in che slot»: e chiederlo qui, in un posto solo, evita che
  // il controllo si sfasi fra offerta, scelta e modalita' di prova.
  function slotDi(heroId, id, scuola) {
    for (let sl = 1; sl <= SLOTS; sl++) if (perSlot(heroId, sl, scuola).some(a => a.id === id)) return sl;
    return null;
  }

  const SLOTS = 3;
  return {
    BY_ID, SERBATOIO, NUOVE, PER_CLASSE, SCUOLE_MAGO, TITOLO_SCUOLA,
    perSlot, firma, scuoleMago, sceglieAlPrimo, scuolaDiFirma, slotDi,
    slotPerLivello, livelloDiSlot, cdDiSlot, SLOTS, CD, DUR,
    CD_1, CD_2, CD_3, LVL_1, LVL_2, LVL_3, CD_Q, CD_E, LVL_Q, LVL_E,
    // v2.18 — `ABIL` non esiste piu' come mappa eroe -> lista: un'abilita' appartiene a piu' classi e a
    // slot diversi, quindi la domanda giusta e' sempre `perSlot(classe, slot, scuola)`. Chi cercava
    // `ABIL[heroId]` trovava una lista che adesso sarebbe una bugia, ed e' meglio un errore subito.
  };
});
