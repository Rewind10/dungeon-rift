/* storia.js — IL TESTO DELLA STORIA (UMD, condiviso client/server)
 *
 * v2.7 — Tutto quello che qualcuno DICE sta qui dentro, e solo qui. Non e' pignoleria: il testo si
 * riscrive dieci volte prima di suonare giusto, e riscriverlo dentro il codice del server vuol dire
 * rileggere la logica ogni volta per trovare la riga. Cosi' invece si apre un file e si scrive.
 *
 * v2.8 — OGNI RIGA HA IL SUO INTERLOCUTORE. Prima la scena aveva UNA voce sola; adesso sono dialoghi, e
 * `chi` sta sulla riga:
 *     'tu'      — l'avatar: ritratto della classe scelta, nome della classe
 *     'oracolo' — l'oracolo
 *     ''        — la voce senza volto del risveglio (e' lui, ma non si sa ancora)
 * Nel testo, `{eroe}` diventa il nome della classe di chi sta leggendo: in tre a schermo ognuno si sente
 * nominare la sua.
 *
 * v2.9 — LE PAUSE. Una riga puo' avere `p: 1`: prima di cominciare a scriversi aspetta un attimo in
 * silenzio. Sono le "Pause" e le didascalie del copione (`l'oracolo osserva`, `sorride appena`) — non si
 * scrivono a schermo, si SENTONO. Una didascalia stampata dice al giocatore cosa dovrebbe provare; un
 * silenzio di mezzo secondo prima di «Un Dio.» glielo fa provare.
 *
 * IL REGISTRO: secco, frasi corte, nessuna spiegazione di troppo. Chi parla sa piu' di quello che dice.
 *
 * IL FILO. La voce del risveglio e l'ORACOLO sono la stessa persona, e il giocatore lo scopre quando gli
 * parla. E' per questo che la voce non si presenta e non ha ritratto: `chi: ''` e' il punto, non una
 * dimenticanza.
 *
 * LA RIVELAZIONE. Non e' "l'eroe sei tu": e' "sei lo strumento di un Dio, e il Dio e' chi tiene il mouse".
 * Detta cosi' spiega anche una REGOLA — i poteri che arrivano a fine ondata sono i suoi doni — e una
 * rivelazione che spiega una regola vale dieci rivelazioni che strizzano l'occhio.
 */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Storia = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // scorciatoie per scrivere il dialogo senza rumore attorno. Il secondo argomento e' la PAUSA: la riga
  // aspetta un attimo prima di cominciare a scriversi.
  const TU = (t, p) => ({ chi: 'tu', t, p: p ? 1 : 0 });
  const OR = (t, p) => ({ chi: 'oracolo', t, p: p ? 1 : 0 });
  const VO = (t, p) => ({ chi: '', t, p: p ? 1 : 0 });

  const S = {
    // il nome del boss dell'ondata 20 e quante volte si scende. La storia li pronuncia, quindi stanno
    // qui: se un domani cambiano, cambiano in un posto solo.
    BOSS: 'AZ’GAROTH',
    ONDATE: 20,

    // ===================== 1. IL RISVEGLIO =====================
    // La TUA stanza, e in mezzo un portale che si apre. Non si spiega niente: uno si sveglia, c'e' un
    // portale dove ieri c'era il pavimento, e una voce gli dice di attraversarlo.
    prologo: {
      righe: [
        TU('Cos’è quella luce?'),
        TU('No…'),
        TU('C’è un portale. Nella mia stanza.'),
        VO('Non temere.'),
        TU('Chi sei?'),
        VO('Qualcuno che ti sta aspettando.'),
        TU('Dove?'),
        VO('Dall’altra parte.'),
        TU('E perché dovrei attraversarlo?'),
        VO('Perché è già troppo tardi per tornare indietro.'),
        TU('Non hai ancora risposto.'),
        VO('Attraversa. Le risposte sono dall’altra parte.'),
      ],
      // se uno gira per la stanza invece di entrare. Una volta sola: insistere la trasformerebbe in un
      // tutorial, e questa non e' una voce che spiega le cose.
      sollecito: VO('Non è la finestra.'),
    },

    // ===================== 2. L'ARRIVO AL VILLAGGIO =====================
    arrivo: {
      righe: [
        VO('Eccoti.'),
        VO('Ora vieni da me.'),
        VO('Cerca la casa con le ossa appese alla porta.'),
        VO('È lì che scoprirai perché sei stato chiamato.'),
      ],
    },

    // ===================== 3. L'ORACOLO =====================
    // Il discorso vero, ed e' un DIALOGO: l'avatar non capisce, e il fatto che non capisca e' giusto —
    // e' lui lo strumento, non l'informato. Le sue battute scandiscono, non spiegano.
    //
    // La rivelazione arriva in tre gradini e non in uno: «sei stato scelto» / «da un Dio» / «quel Dio ti
    // sta guardando in questo momento». Ogni gradino ha la sua pausa, perche' e' il silenzio prima della
    // frase a farla atterrare — non il punto esclamativo dopo.
    oracolo: {
      righe: [
        OR('Finalmente.'),
        TU('Sei tu che mi hai trascinato qui?'),
        OR('Io ho aperto il portale.'),
        TU('Perché?'),
        OR('Perché avevamo bisogno di te.'),
        TU('Per cosa?'),
        // (l'oracolo lo osserva per qualche istante)
        OR('Sotto questo villaggio dorme qualcosa.', 1),
        OR('Qualcosa che non avrebbe mai dovuto svegliarsi.'),
        OR('Si chiama AZ’GAROTH.'),
        OR('E si sta svegliando.'),
        TU('E cosa c’entro io?'),
        OR('Tutto.'),
        TU('Non capisco.'),
        OR('Nemmeno gli altri avrebbero capito.'),
        OR('Ma tu sei diverso.'),
        TU('Diverso come?'),
        OR('Sei stato scelto.'),
        TU('Da chi?'),
        // (l'oracolo guarda verso di te — cioe' verso lo schermo)
        OR('Da qualcuno che non vive in questo mondo.', 1),
        OR('Un Dio.', 1),
        TU('Un Dio?'),
        OR('Sì.'),
        OR('E ora viene la parte che sarà difficile da accettare.'),
        TU('Cioè?'),
        OR('Quel Dio ti sta guardando.'),
        OR('E ti sta guidando.', 1),
        TU('Come?'),
        OR('Attraverso di te.'),
        OR('Ogni passo che farai…'),
        OR('ogni nemico che ucciderai…'),
        OR('ogni potere che otterrai…'),
        OR('sarà perché lui lo vorrà.'),
        TU('Ma chi è?'),
        // (sorride appena)
        OR('Non lo hai ancora capito?', 1),
        OR('È quello che tiene gli occhi su di te in questo momento.', 1),
        TU('…'),
        OR('Non cercare di capire.'),
        OR('Lascia che ti guidi.'),
        OR('Avrai bisogno dei suoi poteri per arrivare in fondo.'),
        TU('In fondo a cosa?'),
        OR('Alla faglia.'),
        OR('Attraversala.'),
        OR('Supera ciò che ti aspetta dall’altra parte.'),
        OR('E quando avrai attraversato tutte le venti fratture…'),
        OR('troverai AZ’GAROTH.', 1),
        TU('E poi?'),
        OR('Poi scopriremo se il Dio ha scelto bene.'),
      ],
    },

    // se gli si torna davanti dopo. Non e' un riassunto: e' un vecchio che ha gia' detto tutto e che
    // nell'ultima riga si concede l'unico dubbio di tutto il discorso.
    oracoloAncora: {
      righe: [
        OR('Non hai bisogno di altre risposte.'),
        OR('Hai il cammino davanti a te.'),
        OR('Il resto…'),
        OR('lo decide lui.'),
        OR('O forse lo decidi tu.', 1),
      ],
    },

    // ===================== 4. L'ULTIMA DISCESA =====================
    // All'inizio dell'ondata 20. Non e' un discorso: e' una riga sola.
    finale: {
      righe: [OR('È sotto di te. Non sa che esisti, e per ora è l’unico vantaggio che abbiamo.')],
    },

    // ===================== IL MENU DI FINE ONDATA =====================
    // v2.8.1 — Dopo il colpo di scena, la schermata fra un'ondata e l'altra diceva una cosa FALSA:
    // "PUNTI — dove metti quello che hai imparato". Lui non impara niente. Quello che compare li' dentro
    // — forza, costituzione, abilita' — sono DONI di chi tiene il mouse, ed e' esattamente la regola che
    // l'oracolo ha promesso: «ogni potere che otterrai sara' perche' lui lo vorra'».
    //
    // Queste righe si leggono VENTI VOLTE, quindi sono corte e non fanno battute: una battuta letta venti
    // volte diventa un fastidio. La spiegazione per esteso compare una volta sola, a fine ondata 1, e poi
    // non si rivede piu'.
    menu: {
      // v2.8.2 — riscritte piu' PIANE. La prima versione era letteraria e in una schermata che si legge
      // venti volte la letteratura stanca: qui serve che si capisca cosa fa un pulsante, non che suoni
      // bene. Il colpo di scena lo regge la parola «avatar», che dice da sola chi e' lui e chi sei tu.
      cornice:  'Statistiche della partita',
      // solo a fine ondata 1: il patto, detto una volta e mai piu'
      patto:    'Da qui lo guardi. Quello che gli dai in questa schermata — forza, costituzione, abilità — lui non se lo guadagna: lo riceve. È il patto.',
      punti:    'Non impara: riceve. Ogni punto che spendi qui è una cosa che tu gli dai, e che prima non aveva.',
      // le monete sono SUE: e' l'unica cosa in tutta la schermata che non passa da te, e dirlo serve a
      // far capire perche' ci sono due monete diverse.
      emporio:  'Le monete sono sue: questo se lo compra da solo.',
      abilita:  'Dona al tuo avatar una nuova abilità',
      rango:    'Le tue azioni hanno permesso al tuo avatar di salire di livello',
      // l'intestazione dell'elenco di quelle gia' date
      poteri:   'I poteri che hai concesso all’avatar',
      riparti:  'Prosegui',
    },

    // ===================== LE MISSIONI =====================
    // v2.8 — la missione PRINCIPALE resta accesa per tutta la partita (e' il filo della storia), ma non
    // toglie niente: taglie, prigionieri e tutto il resto continuano a funzionare come sempre. Per questo
    // il riquadro si chiama "missione principale" e non "missione": non e' l'unica cosa da fare.
    missioni: {
      faglia:  { t: 'Attraversa il portale', d: 'In mezzo alla stanza' },
      oracolo: { t: 'Trova l’oracolo',     d: 'Villaggio, la casa con le ossa appese' },
      discesa: { t: 'Scendi fino ad AZ’GAROTH', d: 'Venti ondate' },
    },
  };

  return S;
});
