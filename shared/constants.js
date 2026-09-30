/* constants.js — costanti condivise client/server (UMD) */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Constants = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const C = {
    VERSION: '2.31.0',
    // v2.26 — LE NOVITA' IN SCHERMATA. Paolo pubblica una versione ogni due giorni e chi gioca non se
    // ne accorge: il changelog sta in un file .md che nessuno apre. Tre righe, nel menu, accanto al
    // numero di versione. `v` DEVE stare al passo con VERSION qui sopra — un box che annuncia le
    // novita' della versione sbagliata e' peggio che non averlo, e c'e' un test che lo pretende.
    NOVITA: {
      v: '2.31.0',
      righe: [
        'Il <b>Banditore</b> ha undici taglie nuove: bracieri da accendere, sarcofagi da aprire, campane da suonare.',
        'E due <b>scommesse</b>: paga e triplica, oppure lascia crescere il montante finch&eacute; ti regge il fegato.',
        'Tasto <b>F</b>: contatore dei fotogrammi al secondo, acceso e spento quando vuoi.',
      ],
    },
    // v1.66 — limiti del fendente in mischia (misurati: senza cap l'arco valeva 6x le uccisioni di un tiratore)
    MELEE_MAX_TARGETS: 5, MELEE_SPLASH: 0.55,
    // v1.51 — level up fra le ondate
    BOON_CHOICES: 3,          // carte potere offerte a fine ondata (se ne sceglie UNA)
    // v2.12 — RESTA SPENTO, e adesso il motivo e' un altro. Non e' piu' «in attesa di ridisegno»: il
    // fabbro del VILLAGGIO funziona e vende il catalogo intero. Accendere anche questo vorrebbe dire due
    // negozi che vendono la stessa roba in due posti diversi — e il giocatore che ne trova uno smette di
    // cercare l'altro. Deciso con Paolo: uno solo, quello del villaggio, dove c'e' anche la rivendita.
    SHOP_GEAR_ENABLED: false,

    VIS_SCALE: 1.45, COL_SCALE: 1.08,  // v1.13 — ridimensionamento LEGGERO: occhi grandi, hitbox quasi invariata (fluidita preservata)
    TICK_RATE: 30, SNAPSHOT_RATE: 20, MAX_PLAYERS: 6,
    TILE: 48, MAP_W: 64, MAP_H: 46,
    T_FLOOR: 0, T_WALL: 1, T_TRAP: 2, T_HAZARD: 3, T_DECO: 4, T_EXIT: 5,
    PLAYER_RADIUS: 16, PLAYER_BASE_SPEED: 210,
    START_LIVES: 2, DOWN_BLEED_TIME: 4.0, REVIVE_IFRAME: 1.6,
    CURSE_TIME: 4.5, CURSE_DMG_MULT: 0.6, CURSE_SPEED_MULT: 0.8, // v1.28 — maledizione del Negromante (indebolimento)
    // v1.34 — Sguardo dell'Occhio Vagante: debuff applicato quando il giocatore è nel campo visivo (cono) del bulbo.
    GAZE_TIME: 2.6, GAZE_TICK: 0.4, GAZE_FOV: 0.6, GAZE_RANGE: 340,
    // v1.83 — quanto e' largo il cono coperto dallo scudo, in radianti a mezzo (1,22 = 70 gradi per lato).
    // Largo abbastanza da poterci contare girandosi, stretto abbastanza che essere circondati faccia male.
    SCUDO_CONO: 1.22,
    // v1.84 — I PRIGIONIERI. Ogni tanto una mappa ha un recinto con dentro della gente: la chiave e'
    // nascosta altrove (addosso a un elite, o accanto alle casse) e liberarli paga. Non e' obbligatorio:
    // e' una deviazione che si sceglie, e il prezzo e' il tempo che passi a cercare invece che a uccidere.
    // v1.84.1 — quante casse contengono monete invece di un potenziamento a tempo, e quanto danno.
    // v2.5 — LA CASSA-MIMICA E' RARA. Era il 30%: con tre-cinque casse a ondata voleva dire incontrarne una
    // quasi ogni volta, e una trappola che scatta sempre non e' una trappola, e' una regola. Al 6% ne
    // capita una ogni quattro-cinque ondate: abbastanza di rado da fartene dimenticare, che e' il punto.
    MIMIC_PROB: 0.06,
    CASSA_MONETE_PROB: 0.5, CASSA_MONETE: 22, CASSA_MONETE_ONDATA: 3,
    // v2.28 — LE CASSE SI VEDONO POCO, e il motivo misurato non era la dimensione: era la LUCE. La
    // cassa si illuminava da sola per 60 px mentre il fascio della torcia arriva a 350, quindi la
    // vedevi solo quando c'eri quasi sopra. Raddoppiarla — l'idea di partenza — l'avrebbe portata a
    // 56x44, quanto il Cubo Gelatinoso, e avrebbe raddoppiato anche il raggio di raccolta: si
    // sarebbero aperte passandoci accanto. Invece: disegno una volta e mezza, e luce doppia.
    CASSA_SCALA: 1.5, CASSA_LUCE: 120,
    // v2.21 — GLI OGGETTI CHE SI ROMPONO. L'urna e' una mancia, non un forziere: vale meno di mezza
    // cassa, altrimenti aprire le casse smetterebbe di essere la ragione per attraversare il centro.
    // Il barile fa male ai mostri e fa male anche a chi lo fa scoppiare: a meta' danno sui giocatori,
    // che e' abbastanza per insegnare a starne lontani e non abbastanza per uccidere per distrazione.
    URNA_MONETE: 9, URNA_MONETE_ONDATA: 1.5, URNA_XP: 8,
    BARILE_RAGGIO: 112, BARILE_DANNO: 34, BARILE_DANNO_ONDATA: 6, BARILE_QUOTA_GIOCATORE: 0.5,
    GRATA_RAGGIO: 34,
    // ===================== v2.28 — SEI OGGETTI INTERATTIVI IN PIU' =====================
    // L'ELENCO DEI TIPI STA QUI E SOLO QUI. Lo leggono il server (per costruire gli oggetti), lo
    // snapshot (che manda l'INDICE, non la parola: un numero al posto di 'sarcofago' sessanta volte
    // al secondo) e il renderer (per sapere cosa disegnare). Tre posti con tre elenchi scritti a mano
    // e' il modo piu' rapido di ritrovarsi con un oggetto che il server mette in campo e il client non
    // disegna — successo davvero in v2.21 con la cassa del deposito, invisibile per ventisette
    // versioni. Aggiungere un tipo vuol dire aggiungerlo QUI, e il test lo pretende disegnabile.
    OGG_TIPI: ['urna', 'barile', 'campana', 'braciere', 'masso', 'sarcofago', 'fonte', 'cristallo'],
    // COME SI USANO. Due famiglie, e la differenza non e' un capriccio: quello che si ROMPE lo si
    // colpisce da lontano (e quindi puo' entrare nella catena dei barili), quello che si USA lo si
    // calpesta, come le casse e le leve — il gioco non ha un tasto "usa" e non e' questo il momento
    // di inventarlo.
    //   colpendo   → urna · barile · campana · braciere · masso · cristallo
    //   calpestando → sarcofago · fonte
    //
    // LA CAMPANA: la colpisci e per otto secondi ogni mostro in campo va LI'. E' il rovescio della
    // braccata (v2.25): invece di essere cercato, decidi tu dove si radunano. Mentre camminano non
    // attaccano — e' il motivo per cui la ricarica e' lunga — ma non e' un pulsante di salvezza
    // gratis: otto secondi in cui nessuno muore sono otto secondi tolti al tempo obiettivo, e i boss
    // la ignorano.
    CAMPANA_DUR: 8, CAMPANA_RICARICA: 26,
    // IL BRACIERE: si accende e resta acceso. Serve a una cosa sola, ed e' il motivo per cui esiste in
    // un gioco al buio: la stanza illuminata resta illuminata anche quando gli volti le spalle.
    BRACIERE_LUCE: 250,
    // IL MASSO: gli spari e rotola nella direzione del colpo finche' non trova roccia. Schiaccia i
    // mostri e schiaccia anche te — come il barile, e per lo stesso motivo: una macina gratis non
    // sarebbe una scelta.
    MASSO_VEL: 420, MASSO_DANNO: 58, MASSO_DANNO_ONDATA: 7, MASSO_RAGGIO: 30, MASSO_QUOTA_GIOCATORE: 0.6,
    // IL SARCOFAGO: o bottino o un inquilino. La differenza col mimic e' che il mimic ti frega — sembra
    // una cassa — mentre una bara si vede che e' una bara: il rischio e' dichiarato dalla forma.
    SARCOFAGO_PROB_MOSTRO: 0.45, SARCOFAGO_MONETE: 26, SARCOFAGO_MONETE_ONDATA: 4, SARCOFAGO_XP: 22,
    // LA FONTE: cura una volta e si prosciuga. In due e' una decisione: chi la beve.
    FONTE_CURA: 0.35,
    // IL CRISTALLO: lo rompi e le ricariche delle abilita' tornano a zero, a te e a chi ti sta vicino.
    CRISTALLO_RAGGIO: 220,
    // Quanti tipi NUOVI compaiono su una mappa: due o tre, sorteggiati. Tutti e sei su ogni mappa
    // sarebbe un parco giochi, e ognuno smetterebbe di essere una cosa che trovi.
    OGG_NUOVI_PER_MAPPA: [2, 3],
    PRIGIONE_PROB: 0.35,        // quante mappe hanno un recinto
    PRIGIONE_MONETE: 100,       // per testa
    PRIGIONE_MAX: 5,
    PRIGIONE_RAGGIO: 62,        // il recinto
    CHIAVE_RAGGIO: 26,          // quanto vicino devi passarci per raccoglierla
    // v1.84 — LA FAGLIA D'USCITA. Al posto del pulsante EXIT in mezzo allo schermo: si apre uno squarcio
    // sulla mappa e ci si passa dentro. Il gesto e' lo stesso (uscire), ma succede nel gioco e non nell'UI.
    FAGLIA_RAGGIO: 46,
    // ===== v2.1 — IL CAMPO VISIVO =====
    // Fino alla v2.0 il buio era un velo TONDO attorno a te: vedevi un cerchio, muri compresi, e dietro
    // una roccia si vedeva lo stesso. Adesso si vede quello che si PUO' vedere, e si vede come lo vedrebbe
    // uno con una TORCIA IN MANO: una sola macchia di luce, lunga davanti e corta dietro, tagliata dai
    // muri. Non un cono piu' un cerchio — quelli erano due forme cucite insieme e si vedeva la cucitura.
    //
    // La forma e' una goccia: il raggio dipende dall'angolo rispetto a dove guardi.
    //   R(a) = DIETRO + (AVANTI - DIETRO) * ((1 + cos a) / 2) ^ FORMA
    // davanti (a=0) arriva a AVANTI, di fianco (a=90') a circa un terzo, alle spalle (a=180') a DIETRO.
    // v2.1.2 — DUE LUCI, NON UNA. Una torcia vera fa due cose insieme: un ALONE largo che ti illumina
    // attorno, e un FASCIO stretto che va lontano dove la punti. Fino alla 2.1.1 c'era una goccia sola e
    // doveva fare entrambe: o era corta e non illuminava lontano, o era lunga e si allargava troppo.
    //
    // Adesso sono due, e la seconda non ha bordi da cucire con la prima perche' e' LA STESSA FORMULA con
    // numeri diversi: stessa goccia, molto piu' concentrata. Due curve continue che si sommano non fanno
    // nessuna giuntura — e' per questo che il cono si integra invece di stare appiccicato sopra.
    //   R(a) = DIETRO + (AVANTI - DIETRO) * ((1 + cos a) / 2) ^ FORMA
    FOV_AVANTI: 470,     // L'ALONE: quanto si vede davanti a se
    FOV_DIETRO: 118,     // e quanto alle spalle: poco, ma non zero (non si e' ciechi dietro la nuca)
    FOV_FORMA: 1.4,      // quanto e' schiacciato l'alone all'indietro
    FOV_CONO: 1150,      // IL FASCIO: quanto lontano arriva dove punti
    FOV_CONO_FORMA: 3.0, // quanto e' stretto: a 3,0 e' un cuneo che si LEGGE, non una lama invisibile
    FOV_RAGGI: 256,      // raggi su tutto il giro
    FOV_BUIO: 0.93,      // quanto e scuro cio che non vedi (1 = nero pieno)
    // v2.1.3 — LA PENOMBRA. Il bordo dell'ombra proiettata da un muro era un taglio netto: geometricamente
    // giusto (il raggio o passa o non passa) ma sbagliato all'occhio, perche' nessuna luce vera fa un
    // bordo cosi'. Questi sono i pixel di sfocatura stesi sul velo: 0 = taglio netto, 6-8 = morbido.
    FOV_SFUMA: 6,
    // ===== v2.4 — LA LUCE DEL VILLAGGIO =====
    // Dalla v2.2 il villaggio aveva sopra una VELATURA: un rettangolo semitrasparente steso su tutto. Piu'
    // la si caricava e piu' si vedeva per quello che era — una PATINA che sbianca invece di scurire, perche'
    // un velo uniforme schiarisce i neri tanto quanto spegne i chiari.
    // Adesso il villaggio e' BUIO VERO — quasi nero — e la luce la fanno solo le SORGENTI, che ci scavano
    // dentro i loro buchi: focolari, falo', bracieri, torce, gli aloni dei mercanti, il portale e le
    // lanterne dei girovaghi. Stesso meccanismo del campo visivo delle grotte (una tela a parte, si
    // cancella, si sfoca, si appoggia), applicato alle sorgenti invece che alla vista.
    VILL_BUIO: 0.90,     // quanto e' scuro il villaggio dove non arriva nessuna luce
    // ATTENZIONE al significato: questo moltiplica il RAGGIO, e l'area va col quadrato. "Area doppia"
    // vuol dire radice di 2 = 1,41 — non 2, che darebbe area QUADRUPLA e infatti al primo tentativo il
    // villaggio si e' acceso tutto.
    VILL_LUCE: 1.45,     // raggio x1,45 = area x2,1: una sorgente illumina il doppio di prima
    VILL_EROE: 130,      // e il cerchietto che ti porti dietro, per non essere ciechi fra una luce e l'altra
    // v2.6 — LA PIAZZA E' CHIARA, IL RESTO NO. Non e' una luce in piu' appoggiata sopra: e' che il buio
    // di base, dentro il rettangolo della piazza, vale meno. Cosi' la piazza si legge tutta — banchi,
    // gente, insegne — e appena ne esci torni a cercare i fuochi, che era il punto del villaggio buio.
    // Il bordo non e' un taglio: sfuma per VILL_PZ_ORLO tessere oltre il rettangolo.
    VILL_PIAZZA: 0.60,   // quanto resta del buio dentro la piazza (0 = giorno pieno, VILL_BUIO = come fuori)
    VILL_PZ_ORLO: 1.4,   // e in quante tessere si passa dall'uno all'altro
    GAZE_WEAKEN_MULT: 0.7, GAZE_SLOW_MULT: 0.72, GAZE_SUNDER_MULT: 1.32,
    // v1.81 — RAGNATELA: quanto rallenta chi ci sta dentro, e per quanto il rallentamento resta addosso
    // dopo esserne usciti (breve: la tela e' un posto, non una maledizione che ti porti dietro).
    RAGNATELA_MULT: 0.58, RAGNATELA_CODA: 0.25, RAGNATELE_MAX: 14,
    // v1.82 — MERCENARI. Uno solo per volta, solo in singolo. Serve ad aiutare chi non e' bravissimo:
    // per questo NON conta come giocatore in niente che regoli la difficolta' — l'ondata resta identica,
    // l'XP resta tutto tuo, e la sua morte non chiude la partita. Fra un'ondata e l'altra sparisce (non
    // ti segue al villaggio) e torna in campo curato del tutto.
    MERC_MAX: 1, MERC_SOLO_SINGOLO: true, MERC_CURA_FINE_ONDATA: true, MERC_RIENTRO_MULT: 1.28,
    DASH_CD: 3.2, DASH_TIME: 0.20, DASH_IFRAME: 0.28, DASH_SPEED: 3.0,
    BULLET_RADIUS: 5, XP_MAGNET: 120, FINAL_WAVE: 20,
    // v1.63 — LA FAGLIA AI MARGINI. Restare attaccati al bordo esterno riduceva l'arco da difendere da
    // ~240 a ~80 gradi: misurato, all'ondata 6 significava subire 4,8 volte meno danni stando fermi.
    // Non e' un muro invisibile: e' una pressione che cresce solo se INDUGI, e si riassorbe se rientri.
    // STATO ATTUALE: SPENTA, per scelta. EDGE_MARGIN a 0 significa nessuna fascia, nessun drenaggio,
    // nessun alone: si puo' stare sul bordo quanto si vuole. Il resto del meccanismo e' intatto e si
    // riaccende rimettendo questo numero sopra lo zero. I test seguono la manopola in tutte e due le
    // posizioni: a 0 verificano che la faglia sia spenta davvero, sopra lo zero che morda come descritto.
    EDGE_MARGIN: 0,        // tessere di fascia dal bordo giocabile (la profondita' pesa: vedi _edgeDepth)
    EDGE_GRACE: 30,       // secondi di carica prima che il drenaggio inizi (a profondita' piena)
    EDGE_RAMP: 900,          // secondi perche' il drenaggio arrivi al massimo
    EDGE_DPS_MIN: 2, EDGE_DPS_MAX: 10,
    EDGE_RECOVER: 2,       // la carica si riassorbe al doppio della velocita' con cui sale
    // v1.64 — TETTO AI NEMICI VIVI. Non riduce la dimensione dell'ondata: la RITMA. I mostri in eccesso
    // restano in coda (pending) ed entrano man mano che gli altri muoiono, quindi il totale da uccidere
    // non cambia — cambia quanti ne hai addosso insieme, che e' cio' che costava frame e leggibilita'.
    // v1.70 — il tetto dei vivi non e' piu' un numero fisso ma una CURVA: all'ondata 1 se ne vedono 8,
    // al tetto pieno di 30 si arriva solo alla 10ª. Il tetto fisso della 1.68, unito al rifornimento
    // rapido, riempiva l'arena di 30 nemici gia' alla terza ondata (misurato) anche se l'ondata ne
    // prevedeva 10: il tetto diventava il numero, invece di essere un limite.
    // v1.70 — l'esperienza non arriva piu' solo dai nemici: le fonti stanno tutte qui, in chiaro, cosi'
    // aggiungerne una e' una riga sola. Il termine per ondata tiene il passo con l'XP dei mostri, che cresce.
    XP_CASSA: 45, XP_CASSA_ONDATA: 9,
    XP_OGGETTO: 30, XP_OGGETTO_ONDATA: 6,
    // v1.77 — IL TEMPO OBIETTIVO DELL'ONDATA. Non e' un numero fisso: un'ondata da 7 mostri e una da
    // 41 non possono avere lo stesso limite. Si calcola dal CONTENUTO — quanti mostri, diviso quanti
    // giocatori — piu' una base che copre l'ingresso in campo e i primi contatti.
    //   ondata 1 da solo (7 mostri)  -> 47 s        ondata 3 da solo (15) -> 73 s
    //   ondata 1 in tre (10 mostri)  -> 36 s        ondata 20 da solo (41) -> 156 s
    // Misurato: il "pavimento" assoluto (giocatori che uccidono all'istante) sta fra 1,4 e 7,6 s, cioe'
    // i mostri entrano in campo subito e il tempo lo fa il combattimento, non la coda di generazione.
    // Questi due numeri sono la manopola: alzare PAR_BASE regala tempo a tutte le ondate, alzare
    // PAR_PER_MOSTRO regala tempo soprattutto alle ondate affollate.
    PAR_BASE: 25, PAR_PER_MOSTRO: 3.2,
    // v2.25 — LA BRACCATA. Scaduto il tempo obiettivo i mostri smettono di vagare e vengono a
    // cercarti: nessuno resta piu' in attesa all'anello e chi non ti vede non gira a vuoto, ti
    // raggiunge. Prima della scadenza non cambia niente — il comportamento e' quello di sempre.
    // BRACCATA_VEL e' l'andatura della marcia: non e' una carica (chi ti vede resta piu' veloce),
    // e' una convergenza. Metterla a 1 li fa arrivare tutti insieme, abbassarla li sparpaglia.
    BRACCATA_VEL: 0.9,
    // il premio per chi ci sta dentro, in scala con l'ondata
    PAR_XP: 25, PAR_XP_ONDATA: 8, PAR_MONETE: 12, PAR_MONETE_ONDATA: 3,
    // v1.78 — QUANTO SI PUO' RESTARE nella mappa ripulita prima che l'uscita scatti da sola. Non e' una
    // fretta: e' l'anti-AFK. Chi vuole raccogliere con calma ha tutto questo tempo, chi si e' alzato dalla
    // sedia non blocca gli altri per sempre.
    EXIT_TIMEOUT: 120,
    // v1.79.2 — I NEMICI DI UN'ONDATA SI VEDONO TUTTI. C'era una curva che teneva in campo 8 mostri alla
    // prima ondata, 10 alla seconda e cosi' via fino a 30: gli altri restavano in coda. Risultato: si
    // aggiungevano nemici all'ondata e a schermo non cambiava niente — dodici in lista, otto davanti.
    // Adesso il tetto e' UNO SOLO e alto: quaranta. Tutte le ondate in singolo ci stanno sotto (la
    // diciannovesima ne ha 40), quindi si vedono tutti; in gruppo, dove le ondate scalano, l'eccesso
    // continua a entrare in coda man mano che si fa posto.
    // v1.97 — FINO A CHE ONDATA SI GIOCA NEL CIMITERO. Dalla successiva torna la caverna. E un solo
    // numero apposta: se domani il cimitero convince, si alza; se stanca, si abbassa a zero e sparisce.
    //
    // v2.9.1 — IL CIMITERO E' IN STAND-BY, non cancellato. Messo a ZERO: l'ondata 1 riparte dalle grotte.
    // La pianta (`piantaCimitero`), i tipi di tessera (lapide, cinta, mausoleo), il modo in cui il
    // renderer li dipinge e il nome della zona sono TUTTI ancora qui e ancora provati dai test — per
    // riaccenderlo basta rimettere 1. E' esattamente il motivo per cui questo era un numero solo.
    CIMITERO_FINO_A: 0,
    // v2.9.3 — LE GUARDIE DEL VILLAGGIO SONO STATE TOLTE. Questi due numeri restano perche' il testo delle
    // tre scene e il ritratto della guardia sono ancora nel progetto, ma NON LI LEGGE NESSUNO: in v2.9.2 la
    // regola "nel villaggio non si sguaina" si e' rivelata irricevibile per un motivo solo, e va scritto
    // qui perche' chiunque ci riprovi ci sbatta contro subito.
    //
    // IL MOTIVO: in `public/js/input.js` l'attacco e' `mouse.down || keys['Space']`. SPAZIO SPARA. Ed e'
    // anche il tasto che fa scorrere i dialoghi. Quindi ogni Spazio premuto per leggere la ramanzina era
    // un attacco nuovo appena la ramanzina finiva: la guardia ripartiva all'infinito e la partita si
    // piantava. Per rifarla bisogna prima separare le due cose — o l'attacco non sta piu' su Spazio, o il
    // colpo che chiude un dialogo non conta come colpo.
    VILL_AVVISI: 3,
    VILL_CONDANNA: 2.6,
    // v1.99 — LE ONDATE CHE SI GIOCANO NELLA CALDERA: quelle dei due boss. E un elenco apposta —
    // aggiungerne una costa una virgola, e svuotarlo spegne la caldera senza toccare altro.
    CALDERA_ONDATE: [10, 20],
    // ===== v2.24 — L'AZZARDO DI PAOLO: ondate corte e affollamento fisso ==================
    // *«i nemici contemporanei non possono essere piu' di 14; in totale nelle ondate successive
    // alla sesta saranno 20 con 6 riserve che entreranno quando i nemici rimasti sono 7»*.
    // E' un cambio grosso e voluto: prima l'ondata 20 in solitario aveva 42 nemici totali e 22 in
    // campo, adesso ne ha 20 e 14. Si accorcia l'ondata e si abbassa la calca; in cambio ogni
    // nemico conta di piu', e la varieta' la garantisce il costruttore dell'ondata (sotto).
    // v2.29 — E IL TETTO SALE A 16. Paolo, provando la v2.28: *«il gioco mi sembra diventato troppo
    // facile, considererei di aumentare leggermente i nemici a schermo»*. Aveva ragione e il conto lo
    // conferma: dalla v2.24 in poi l'intera run mette a terra 124.027 PV contro i 196.415 di prima
    // (il 63%), e l'ondata 19 esattamente la meta'. Il tetto passa da 14 a 16 e il totale da 20 a 24:
    // +22% di roba da smaltire per ondata, misurato, senza rimettere la calca di quaranta mostri.
    MAX_ALIVE: 16,                 // in campo, in solitario   (era 14)
    MAX_ALIVE_GIOC: 2,             // +2 per ogni giocatore oltre il primo (18 in due)
    ONDATA_TOT: 24,                // totale dall'ondata 7 in poi, in solitario  (era 20)
    ONDATA_TOT_GIOC: 4,            // +4 per ogni giocatore oltre il primo (28 in due)
    ONDATA_TOT_DA: 7,              // da che ondata vale il totale fisso
    // le riserve entrano TUTTE INSIEME quando in campo ne restano meta' del tetto: 8 su 16 in
    // solitario, 9 su 18 in due. Non e' il rifornimento a goccia di prima — e' una seconda ondata,
    // e la pausa in mezzo e' il momento in cui si respira e si raccolgono le monete.
    RISERVE_SOGLIA_Q: 0.5,
    // v2.31 — la taglia DECAPITAZIONE: quanti secondi hai da quando l'elite ENTRA IN CAMPO (non
    // dall'inizio dell'ondata: uno che entra con le riserve deve avere gli stessi secondi del primo).
    DECAP_SEC: 30,

    // ===== v2.29 — I CAMPIONI: un grado sopra l'elite ====================================
    // Paolo: *«sarebbe bello avere delle versioni molto piu' forti dei nemici (magari di colore
    // diverso); ci sono gia' gli elite ma sarebbe carino ampliare»*.
    // Il problema degli elite e' che sono UN SOLO gradino e sempre lo stesso gradino: piu' PV, piu'
    // danno, piu' grossi. Alzarne la quota era la leva piu' debole che avessi in mano (misurata:
    // +8% di pressione portandoli dal 26% al 35%, +14% al 45%) perche' aggiunge quantita' a una cosa
    // che il giocatore ha gia' imparato a leggere.
    // Il CAMPIONE invece e' uno solo (due dall'undicesima) e non si combatte come gli altri: porta un
    // MODIFICATORE, e il modificatore cambia la risposta giusta — lo si aggira, lo si finisce in
    // fretta, gli si tolgono le scorte, o si sta larghi quando si infuria. Misurato: due campioni
    // sull'ondata 19 valgono +27% di pressione da soli.
    // IL COLORE LO DECIDE IL MODIFICATORE, non il grado: il giocatore deve capire COSA ha davanti
    // prima di arrivare a tiro, non che e' "uno forte".
    CAMPIONE_DA: 5,                // prima ondata in cui ne puo' comparire uno
    CAMPIONE_DUE_DA: 11,           // da qui in poi ne compaiono due
    CAMPIONE_MOD: ['corazzato', 'rigenerante', 'scortato', 'infuriato'],
    // i PV si moltiplicano SOPRA quelli dell'elite, che sono gia' tarati nemico per nemico
    // (def.eliteHp): cosi' un campione tank non diventa un muro fuori scala nelle ondate medie.
    // Con l'elite standard (x2,4) fa x5,04 sul nemico base — il numero su cui e' stata fatta la misura.
    CAMPIONE_HP_Q: 2.1,
    CAMPIONE_DMG: 1.9,             // (l'elite e' a 1,5)
    CAMPIONE_RAGGIO: 1.45,         // (l'elite e' a 1,28) — si vede da lontano che non e' un elite
    CAMPIONE_XP: 5,                // (l'elite e' a 2,5)
    // CORAZZATO — incassa poco DI FRONTE. Non e' invulnerabile: e' una questione di dove stai.
    // Il cono e' quello del blockFront che il gioco ha gia' (Scudo d'Ossa), con gli stessi numeri
    // ma piu' largo e piu' duro: qui la corazza E' il combattimento, li' era un dettaglio.
    CORAZZA_ARCO: 1.25,            // semiampiezza del cono frontale, in radianti (~72 gradi per lato)
    CORAZZA_RID: 0.70,             // quanto assorbe dentro al cono
    // RIGENERANTE — se non lo finisci, torna su. Non e' un tank: e' un cronometro.
    RIGEN_QUOTA: 0.06,             // quota dei PV massimi al secondo
    RIGEN_ATTESA: 3.0,             // secondi senza incassare prima di ricominciare
    // SCORTATO — gli altri gli restano attorno e finche' ce n'e' uno in piedi lui incassa meta'.
    // E' l'unico modificatore che chiede di NON sparare al bersaglio grosso.
    SCORTA_RAGGIO: 300,            // entro quanto si cercano le scorte
    SCORTA_ANELLO: 130,            // a che distanza gli stanno attorno
    SCORTA_MAX: 4,
    SCORTA_RID: 0.5,
    // INFURIATO — sotto meta' vita raddoppia la velocita'. Chi lo ammorbidisce e poi lo lascia li'
    // se lo ritrova addosso.
    INFURIA_SOGLIA: 0.5,
    INFURIA_VEL: 2.0,
    INFURIA_DMG: 1.25,
    // il colore e' del MODIFICATORE. Stesso ordine di CAMPIONE_MOD.
    CAMPIONE_COL: ['#9fc4e8', '#6fe08a', '#ffd257', '#ff5a3c'],
    CAMPIONE_FILTRO: [
      'saturate(0.45) brightness(1.22) contrast(1.15)',   // corazzato — metallo slavato
      'hue-rotate(95deg) saturate(1.7) brightness(1.06)', // rigenerante — verde linfa
      'hue-rotate(38deg) saturate(1.9) brightness(1.18)', // scortato — oro
      'hue-rotate(-32deg) saturate(2.2) brightness(1.1)', // infuriato — brace
    ],
    // v1.96 — DALL'ONDATA 9 IN POI SE NE VEDONO 22 ALLA VOLTA. Il tetto unico di quaranta era giusto
    // finche' le ondate erano piccole, ma dalla nona in avanti la mappa si riempiva: alla 19 erano
    // quaranta mostri in campo insieme, e non e' piu' un combattimento, e' una calca. Il TOTALE
    // dell'ondata non cambia di un nemico: quelli che non ci stanno restano in CODA ed entrano man mano
    // che ne muore uno, come gia' faceva il rifornimento. Cambia quanti ne hai addosso, non quanti ne devi
    // uccidere.
    MAX_ALIVE_TARDI: 22,
    MAX_ALIVE_TARDI_DA: 9,
    // v1.80 — TETTO ALLA FOLLA. I nemici ti cercano, ma non si fanno sotto tutti insieme: solo i
    // FOLLA_MAX piu' vicini a ciascun giocatore si avvicinano davvero. Gli altri risalgono fino
    // all'ANELLO_ATTESA e li' girano, fuori dallo sguardo, finche' non si libera un posto — e un
    // posto si libera quando ne uccidi uno. Cosi' l'ondata arriva a scaglioni invece che in blocco.
    // Chi ti VEDE fa eccezione e viene addosso comunque: un nemico che ti ha davanti agli occhi e si
    // gira a passeggiare non e' un gioco piu' facile, e' un gioco rotto.
    FOLLA_MAX: 6,
    ANELLO_ATTESA: 900,
    MAX_ALIVE_CURVE: null,
    // v1.53 — il MERCATO non ha piu' una cadenza fissa: e' una DESTINAZIONE che si sceglie dal menu di
    // pausa fra un'ondata e l'altra. Resta interstiziale (non consuma un numero d'ondata).
    // v1.56 — le distanze di fabbro e portale non si calcolano piu' a runtime: il villaggio e' disegnato
    // a mano in mapgen (VILLAGE), quindi restano solo i raggi di interazione.
    MARKET_EXIT_RADIUS: 42, MARKET_MERCH_RANGE: 84,
    SELL_BACK: 0.5,     // v1.72 — quanto rende un oggetto venduto al Banditore (meta', come il rimborso delle pozioni)
    // v1.79 — QUESTO NUMERO NON LIMITA PIU' NIENTE. Con quattro abilita' passive in tutta la run, e tutte
    // sempre accese, non c'e' niente da accendere o spegnere: e' il motivo per cui la Cartomante si e'
    // potuta chiudere senza perdere nulla. Resta a 5 perche' l'HUD disegna ancora le caselle del box del
    // personaggio, e quattro passive + specializzazione fanno esattamente cinque caselle piene.
    MAX_CARDS: 5,
    // v1.79 — LA CARTOMANTE E' CHIUSA. La struttura resta nel villaggio (porta, interno, insegna): si
    // spegne solo la funzione, che verra' ridisegnata. Rimettere questo a true la riaccende com'era.
    CARTOMANTE_ATTIVA: false,
    // v2.28 — IL MERCANTE ERRANTE E' SPENTO. Paolo: *«per il momento lo disattiverei perche' non ha
    // piu' senso. Non cancellarlo pero'»*. Il motivo non e' un bug: il suo catalogo e' fermo alla
    // v1.11, quando equipaggiamento e statistiche non esistevano. Quattro delle sette voci sono bonus
    // percentuali permanenti (+8% velocita', +12% danno, -6% danni subiti, +30 PV massimi) che oggi
    // fanno esattamente il mestiere del fabbro e dei punti statistica, solo peggio: non si vedono, non
    // si scelgono e non cambiano niente dell'ondata in cui li compri. E il prezzo non cresce con
    // l'ondata, quindi dalla decima in poi non e' nemmeno piu' una spesa.
    //
    // Spento vuol dire che non compare in campo. Il codice — il catalogo, il banco, l'acquisto, il
    // «un oggetto solo e poi sparisce» della v2.19.8 — resta tutto dov'e': rimettere questo a true lo
    // riaccende com'era, e il giorno che il catalogo verra' rifatto si riparte da li'.
    //
    // ATTENZIONE A COSA COMPORTA: la generazione tirava il 30% per il Mercante NERO e, se falliva,
    // metteva in campo l'errante. Spegnendo solo l'errante, il Nero resta al suo 30% e nel restante
    // 70% delle ondate non c'e' nessun mercante. E' voluto: il Nero vende PATTI, cioe' scelte con un
    // prezzo, e quelli non hanno smesso di avere senso.
    MERCANTE_ATTIVO: false,
    // v2.28.1 — E ANCHE IL MERCANTE NERO. Nella v2.28 lo avevo lasciato acceso di mia iniziativa,
    // ragionando che i suoi PATTI sono scelte con un prezzo e quindi reggono ancora. Paolo: *«il
    // mercante nero e' ancora attivo..»* — e la sua era una richiesta sui MERCANTI, non su uno solo.
    // Stesso trattamento: spento, non cancellato. Adesso durante le ondate non compare nessun banco.
    MERCANTE_NERO_ATTIVO: false,
    // v1.79 — XP CONDIVISA. Ogni uccisione da' esperienza a TUTTI i giocatori vivi, non a chi arriva
    // primo sulla sfera. Ma le ondate crescono col gruppo meno che proporzionalmente (misurato: un trio
    // genera solo il +27% di XP totale rispetto a un solista), quindi senza correzione un gruppo
    // arriverebbe al tetto con ondate di anticipo. Ognuno riceve il valore pieno moltiplicato per questo
    // fattore, tarato perche' la curva dei livelli valga identica da 1 a 6 giocatori.
    // Misura in PROGRESSIONE-2.md §4. NB: a sei giocatori il tetto dei mostri vivi taglia la crescita
    // dell'ondata, ed e' per questo che l'ultimo valore non segue la formula: si usa la tabella.
    XP_GRUPPO: [1, 1, 0.80, 0.69, 0.58, 0.52, 0.50],   // indice = numero di giocatori vivi
    // Le MONETE no: restano di chi le raccoglie. La cooperazione riguarda la crescita, non il portafoglio.
    // v1.74 — quanto costa un punto vita all'OSTESSA. Deve restare piu' conveniente della pozione di Cura
    // (0,54 monete a PV): la pozione la bevi in mezzo ai nemici, l'Ostessa no.
    INN_PER_HP: 0.4,
    COMBO_TIME: 3.6, COMBO_STEP: 0.05, COMBO_CAP: 1.5, COMBO_MIN: 3,
    COIN_MAGNET: 130,
    COINS: [
      { id: 'bronze', v: 1, color: '#c8894a', r: 4 },
      { id: 'silver', v: 5, color: '#cbd5e6', r: 5 },
      { id: 'gold', v: 20, color: '#ffcf4a', r: 6 },
    ],
    // v1.85 — la specializzazione del livello 15 non regala piu' un'abilita' (adesso si scelgono al 6
    // e al 12): alza la POTENZA di quelle che hai. Vale su danno, assorbimento e cura delle abilita'.
    SPEC_ABIL_MULT: 1.30,
    // v1.91 — MODALITA' DI PROVA: dal menu si puo' partire da un'ondata qualunque fino a questa.
    PROVA_MAX_ONDATA: 20,
    RARITY: {
      // v2.12 — SCARSO: il grado sotto il comune, e ha un motivo solo. L'equipaggiamento di partenza
      // prima era "comune", cioe' gia' a posto, e non dava nessuna fretta di andare dal fabbro. Adesso
      // si parte con della ferraglia (~20% sotto il comune) e il primo acquisto ha senso subito.
      // Peso 0 di proposito: non si sorteggia mai, non e' bottino — e' solo cio' con cui cominci.
      scarso: { name: 'Scarso', color: '#7a7f8a', weight: 0, mult: 0.80 },
      common: { name: 'Comune', color: '#b8c0cc', weight: 60, mult: 1.00 },
      uncommon: { name: 'Non comune', color: '#4bd66b', weight: 26, mult: 1.18 },
      rare: { name: 'Raro', color: '#3aa0ff', weight: 10, mult: 1.40 },
      epic: { name: 'Epico', color: '#b061ff', weight: 3.2, mult: 1.75 },
      // v1.79 — DIVINO: il quarto scaglione delle abilita' passive, quello del livello 12. I pesi non
      // servono piu' a niente per le abilita' (non si sorteggiano: lo scaglione decide cosa vedi), ma
      // restano perche' equipaggiamento e oggetti li usano ancora.
      divine: { name: 'Divino', color: '#ffe9a8', weight: 0.5, mult: 2.60 },
      legendary: { name: 'Leggendario', color: '#ffb020', weight: 0.8, mult: 2.30 },
    },
    MSG: {
      HELLO: 'hello', WELCOME: 'welcome', INPUT: 'input', SNAPSHOT: 'snapshot',
      EVENT: 'event', MAP: 'map', BUY_STAT: 'buy_stat', SHOP_READY: 'shop_ready',
      OFFER_SHOP: 'offer_shop', PICK_BOON: 'pick_boon', OFFER_BOON: 'offer_boon',
      BUY_GEAR: 'buy_gear', OFFER_GEAR: 'offer_gear',
      PICK_RANK: 'pick_rank', OFFER_RANK: 'offer_rank',   // v1.69 — carte di rango e bivio finale
      PICK_POTION: 'pick_potion', BUY_POTION: 'buy_potion', OFFER_POTION: 'offer_potion',  // v1.71 — cintura
      TAKE_BOUNTY: 'take_bounty', SELL_GEAR: 'sell_gear', OFFER_BANDIT: 'offer_bandit',      // v1.72 — Banditore
      CASH_BOUNTY: 'cash_bounty',                                                              // v2.31 — riscuoti l'Interesse composto
      HIRE_MERC: 'hire_merc',                                                                  // v1.82 — reclutamento
      TOGGLE_CARD: 'toggle_card', OFFER_SEER: 'offer_seer',                                  // v1.73 — Cartomante
      REST: 'rest', OFFER_INN: 'offer_inn',                                                    // v1.74 — Ostessa
      // v2.11 — IL SALVATAGGIO. `SALVA` e' la richiesta (compro il salvataggio dall'Ostessa), `SALVATO`
      // e' la risposta col pacchetto che il client si mette in tasca, `RIPRENDI` e' il pacchetto che
      // torna indietro quando si riparte. Il server non tiene niente: costruisce e applica, e basta.
      SALVA: 'salva', SALVATO: 'salvato', RIPRENDI: 'riprendi',
      VENDI_GEAR: 'vendi_gear',                            // v2.12 — la rivendita dal fabbro, a meta' prezzo
      EQUIPAGGIA: 'equipaggia',                            // v2.13 — rimettersi addosso roba del baule, gratis
      BUY_MERCHANT: 'buy_merchant', OFFER_MERCHANT: 'offer_merchant',
      CHAT: 'chat', PING: 'ping', PONG: 'pong',
      BOONS: 'boons', // v1.51 — elenco poteri attivi del giocatore (per la barra in basso)
      EXIT_WAVE: 'exit_wave', WAVE_STATS: 'wave_stats',   // v1.78 — il pulsante EXIT e il riepilogo di fine livello
      GO_VILLAGE: 'go_village',                            // v1.79 — la sezione Villaggio del menu di fine ondata
      STORIA_AVANTI: 'storia_avanti',                      // v2.7 — chi comanda fa scorrere il dialogo (o lo salta)
    },
    PHASE_LOBBY: 'lobby', PHASE_COMBAT: 'combat', PHASE_SHOP: 'shop',
    PHASE_BOSS: 'boss', PHASE_GAMEOVER: 'gameover', PHASE_VICTORY: 'victory',
    PHASE_MARKET: 'market',  // v1.52 — mappa di sosta: nessun nemico, mercante equipaggiamento, uscita dal portale EXIT
    // v1.78 — MAPPA RIPULITA. Prima l'ultimo nemico che cadeva sbatteva il giocatore nel pannello di fine
    // ondata nello stesso istante: brusco, e senza il tempo di raccogliere quello che era rimasto a terra.
    // Adesso c'e' una fase in mezzo: nessun nemico, il tempo si ferma, e si esce quando si vuole.
    PHASE_CLEARED: 'cleared',
    // v2.7 — LA CELLA DEL RISVEGLIO. La partita non comincia piu' con un'ondata: comincia con uno che si
    // sveglia al buio davanti a una faglia. Nessun nemico, nessun timer, nessun bottone: si attraversa.
    PHASE_PROLOGO: 'prologo',
    // ogni quanto la voce insiste, se uno gira invece di entrare nella faglia. Una volta sola: insistere
    // la trasformerebbe in un tutorial, e questa non e' una voce che spiega le cose.
    PROLOGO_SOLLECITO: 22,
    // quanto tempo resta a schermo una riga prima che si possa passare alla successiva senza premere
    // niente. Serve ai distratti e a chi legge piano; chi preme Spazio va piu' veloce.
    STORIA_RIGA: 5.5,
  };
  return C;
});
