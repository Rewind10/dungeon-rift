/* storia.js — IL TESTO DELLA STORIA (UMD, condiviso client/server)
 *
 * v2.7 — Tutto quello che qualcuno DICE sta qui dentro, e solo qui. Non e' pignoleria: il testo si
 * riscrive dieci volte prima di suonare giusto, e riscriverlo dentro il codice del server vuol dire
 * rileggere la logica ogni volta per trovare la riga. Cosi' invece si apre un file e si scrive.
 *
 * v2.8 — OGNI RIGA HA IL SUO INTERLOCUTORE. Prima la scena aveva UNA voce sola; adesso sono dialoghi, e
 * `chi` sta sulla riga:
 *     'tu'      — l'avatar: ritratto della classe scelta, nome della classe
 *     'anziano' — l'Anziano (fino alla v2.26 si chiamava 'oracolo')
 *     ''        — la voce senza volto del risveglio (e' lui, ma non si sa ancora)
 * Nel testo, `{eroe}` diventa il nome della classe di chi sta leggendo: in tre a schermo ognuno si sente
 * nominare la sua.
 *
 * v2.9 — LE PAUSE. Una riga puo' avere `p: 1`: prima di cominciare a scriversi aspetta un attimo in
 * silenzio. Sono le "Pause" e le didascalie del copione (`l'Anziano osserva`, `sorride appena`) — non si
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
  const AN = (t, p) => ({ chi: 'anziano', t, p: p ? 1 : 0 });
  const GU = (t, p) => ({ chi: 'guardia', t, p: p ? 1 : 0 });
  const VO = (t, p) => ({ chi: '', t, p: p ? 1 : 0 });
  // v2.20.2 — LA DIDASCALIA. Paolo: *«aggiungi anche le scritte tra parentesi, aiutano a dare
  // profondita' al dialogo»*. Fino a ieri erano commenti nel codice e non le leggeva nessuno; adesso
  // sono righe a tutti gli effetti, con la loro voce: niente ritratto, niente nome, testo in corsivo e
  // piu' spento (vedi `#dial .d-txt.nota` in style.css). Non sono un personaggio che parla: sono la
  // regia, e devono vedersi come tali.
  const DI = (t, p) => ({ chi: 'nota', t, p: p ? 1 : 0 });

  const S = {
    // il nome del boss dell'ondata 20 e quante volte si scende. La storia li pronuncia, quindi stanno
    // qui: se un domani cambiano, cambiano in un posto solo.
    BOSS: 'AZ’GAROTH',
    ONDATE: 20,

    // ===================== 1. IL RISVEGLIO =====================
    // La TUA stanza, e in mezzo un portale che si apre. Non si spiega niente: uno si sveglia, c'e' un
    // portale dove ieri c'era il pavimento, e una voce gli dice di attraversarlo.
    //
    // v2.27 — RISCRITTO DA PAOLO, parola per parola. Le battute erano di due o tre parole
    // («No…», «Dove?», «Attraversa.») e in un gioco in cui la storia dura due minuti quel taglio
    // secco somigliava piu' a un promemoria che a una scena. Adesso ogni riga e' una frase intera: si
    // capisce cosa sta succedendo anche a chi apre il gioco per la prima volta e non sa niente.
    prologo: {
      righe: [
        TU('Cos’è quella luce? Non dovrebbe esserci nulla di simile nella mia stanza.'),
        TU('No… aspetta. Quella non è una luce. È come se ci fosse qualcosa dall’altra parte.'),
        TU('C’è un portale… proprio qui, nella mia stanza.'),
        TU('Ma com’è possibile? Da dove è arrivato?'),
        VO('Non temere. Non tutto ciò che appare davanti ai tuoi occhi è venuto per farti del male.'),
        TU('Chi sei? E come fai a parlarmi?'),
        VO('Sono qualcuno che ti sta aspettando da molto più tempo di quanto tu possa immaginare.'),
        TU('Dove mi stai aspettando?'),
        VO('Dall’altra parte. Oltre quella soglia che ancora non hai deciso di attraversare.'),
        TU('E perché dovrei farlo? Non so chi sei, né cosa ci sia là fuori.'),
        VO('Perché il tuo cammino è già iniziato, anche se tu ancora non ne conosci la direzione.'),
        TU('Parli come se sapessi qualcosa di me. Ma non hai ancora risposto alla mia domanda.'),
        VO('Le risposte che cerchi non sono qui. Se vuoi trovarle, dovrai attraversare.'),
        VO('Vai. Tutto ciò che devi sapere ti aspetta dall’altra parte.'),
      ],
      // se uno gira per la stanza invece di entrare. Una volta sola: insistere la trasformerebbe in un
      // tutorial, e questa non e' una voce che spiega le cose.
      sollecito: VO('Puoi cercare quanto vuoi, ma qui non troverai le risposte che cerchi. Il tuo cammino è dall’altra parte.'),
    },

    // ===================== 2. L'ARRIVO AL VILLAGGIO =====================
    arrivo: {
      righe: [
        VO('Eccoti finalmente. Questo luogo ti aspettava, anche se tu non sapevi ancora di doverci arrivare.'),
        VO('Non perdere tempo. Nel villaggio troverai una casa diversa dalle altre: è lì che vive l’Anziano.'),
        VO('Trova la sua casa e parla con lui. Conosce la storia di coloro che sono venuti prima di te.'),
        VO('E, forse, saprà dirti perché sei stato chiamato qui.'),
      ],
    },

    // ===================== 3. L'ANZIANO =====================
    // v2.27 — L'ORACOLO E' DIVENTATO L'ANZIANO, e il discorso e' riscritto DA PAOLO parola per parola.
    // Non e' solo un nome nuovo: e' un'altra persona. L'oracolo pronunciava sentenze di tre parole e
    // sapeva tutto in anticipo; l'Anziano CONVERSA — chiede all'avatar cosa lo abbia portato fin li',
    // aspetta la risposta, e la rivelazione arriva dal confronto invece che da un annuncio.
    //
    // Cosa NON e' cambiato, ed e' la spina dorsale della scena: il ciclo («non sei il primo», «sono
    // tornati all'inizio»), il fatto che qualcuno ti osservi mentre giochi, e l'ultima battuta in mano
    // all'avatar — «sempre che io mi ricordi di te», «esatto». Chi perde la memoria fra un giro e
    // l'altro e' lui, non tu.
    //
    // Le righe fra parentesi sono FUORI CAMPO (`DI`): si vedono a schermo, in corsivo, piu' spente e
    // senza ritratto. Portano anche la PAUSA (`p: 1`): prima di scriversi aspettano un attimo in
    // silenzio, cosi' il «(Pausa.)» non e' solo una parola che dice di aspettare — e' un'attesa vera.
    // Le sette pause stanno dove stavano, perche' e' il ritmo della scena e quello non e' cambiato.
    anziano: {
      righe: [
        AN('Siediti. Hai camminato abbastanza.'),
        TU('Immagino che tu sappia perché sono qui.'),
        AN('Forse. Ma prima di parlare di te, vorrei che fossi tu a dirmelo. Cosa pensi ti abbia portato fin qui?'),
        TU('Non lo so. Ho visto un portale nella mia stanza. Una voce mi ha parlato e mi ha detto di attraversarlo.'),
        AN('E tu hai obbedito.'),
        TU('Non avevo molte alternative.'),
        AN('È questo che ti racconti per sentirti più tranquillo?'),
        TU('Cosa vuoi dire?'),
        AN('Quando hai attraversato il portale… hai scelto davvero di farlo?'),
        TU('…Certo.'),
        AN('Ne sei sicuro?'),
        TU('…'),
        AN('E quando sei arrivato al villaggio? Nessuno ti ha indicato questa strada. Nessuno ti ha detto dove andare. Eppure sei arrivato qui.'),
        TU('Io… non lo so. È come se, in qualche modo, qualcuno mi stesse guidando.'),
        AN('Lo so.'),
        DI('(Pausa.)', 1),
        TU('Qualcuno ci sta osservando?'),
        AN('Sì. E non da molto tempo.'),
        TU('Chi?'),
        AN('Non posso darti un nome. Forse non ne ha uno che tu possa comprendere.'),
        TU('Allora come fai a sapere che ci osserva?'),
        AN('Perché non siamo i primi a trovarci qui. E perché, ogni volta che qualcuno attraversa quel portale, lui è già lì ad aspettare.'),
        TU('…Anche adesso?'),
        AN('Sì. Ci sta osservando proprio in questo istante.'),
        DI('(Pausa.)', 1),
        AN('Sei stato scelto.'),
        TU('Scelto da chi?'),
        AN('Da colui che ti ha condotto fin qui. Tu sei il suo strumento, che tu lo voglia oppure no.'),
        TU('E cosa vuole che faccia?'),
        AN('Quello che tutti coloro che sono venuti prima di te hanno dovuto fare: sopravvivere.'),
        DI('(Pausa.)', 1),
        AN('Nelle profondità della terra dorme qualcosa che non avrebbe mai dovuto essere risvegliato.'),
        AN('Per molto tempo è rimasto sepolto, lontano dagli uomini e dalla loro memoria. Ma qualcosa è cambiato.'),
        AN('Ora si sta risvegliando.'),
        TU('E cosa succederà quando lo farà?'),
        AN('Le creature che lo servono emergeranno dalle profondità e si riverseranno su queste terre. Tu dovrai affrontarle, una dopo l’altra, fino a raggiungere ciò che si nasconde alla fine del cammino.'),
        TU('E poi?'),
        AN('Poi dovrai affrontare colui che le ha chiamate.'),
        TU('E se non dovessi riuscirci?'),
        AN('Fallirai.'),
        TU('Questo dovrebbe rassicurarmi?'),
        AN('No. Dovrebbe prepararti.'),
        AN('Ma se fallirai, non sarà necessariamente la fine. Ci proverai ancora.'),
        TU('Ancora?'),
        DI('(L’Anziano lo osserva in silenzio.)', 1),
        AN('Non sei il primo ad arrivare davanti a me.'),
        TU('Quanti sono venuti prima di me?'),
        AN('Abbastanza da riempire questo villaggio più volte. E abbastanza da rendere inutile ricordare i loro nomi.'),
        TU('E dove sono adesso?'),
        AN('Sono tornati all’inizio.'),
        TU('Al villaggio?'),
        AN('No. All’inizio del cammino.'),
        TU('Quindi tutto questo è già successo?'),
        AN('Non una volta sola. È accaduto molte volte. Ogni volta con un volto diverso, ogni volta con la stessa promessa di riuscire dove gli altri avevano fallito.'),
        DI('(Pausa.)', 1),
        TU('E nessuno ci è mai riuscito?'),
        AN('Non posso dirlo. Forse qualcuno è arrivato fino alla fine. Forse qualcuno ha sconfitto ciò che si nasconde nelle profondità.'),
        TU('Se è successo, perché sono qui?'),
        AN('Perché qualcuno vuole vedere se questa volta sarà diverso.'),
        DI('(L’Anziano guarda verso lo schermo.)', 1),
        AN('Non cercare di capire tutto prima di cominciare. Alcune risposte possono essere trovate soltanto attraversando il cammino.'),
        TU('E se morirò?'),
        AN('Allora ci rivedremo.'),
        DI('(Pausa.)', 1),
        TU('Sempre che io mi ricordi di te.'),
        AN('Esatto.'),
      ],
    },

    // se gli si torna davanti dopo. Non e' un riassunto: e' un vecchio che ha gia' detto tutto e che
    // nell'ultima riga si concede l'unico dubbio di tutto il discorso.
    anzianoAncora: {
      righe: [
        AN('Non hai bisogno di altre risposte. Almeno, non ancora.'),
        AN('Hai davanti a te un cammino che non puoi comprendere finché non avrai iniziato a percorrerlo.'),
        AN('Il resto… non dipende da ciò che io posso dirti.'),
        AN('Lo decide lui.'),
        AN('O forse, questa volta, lo decidi tu.', 1),
      ],
    },

    // ===================== LE GUARDIE: NEL VILLAGGIO NON SI SGUAINA =====================
    // v2.9.2 — Tre colpi e sei fuori. Non e' una punizione per il gusto di punire: e' l'unica regola che
    // il villaggio ha, e senza una regola il villaggio e' un negozio con le case attorno.
    //
    // PERCHE' IL GIOCO SI FERMA. Un messaggio in un angolo verrebbe letto da nessuno, e al terzo colpo il
    // giocatore direbbe "e chi lo sapeva". Fermarlo e' l'unico modo di essere sicuri che l'abbia letto —
    // ed e' anche il motivo per cui il primo avvertimento non punisce niente: copre il clic per sbaglio.
    //
    // IL REGISTRO: una guardia non spiega, non minaccia due volte e non fa discorsi. Conta.
    guardia1: {
      righe: [
        GU('Ferma quella mano.'),
        GU('Qui dentro non si sguaina. Vale per te come per chiunque altro.'),
      ],
    },
    // il secondo. Piu' corto del primo, ed e' voluto: chi ripete non merita altre parole.
    guardia2: {
      righe: [
        GU('Due.', 1),
        GU('Non ci sarà un terzo avvertimento.'),
      ],
    },
    // il terzo. Una riga sola, e quello che viene dopo non lo dice nessuno.
    guardia3: {
      righe: [GU('Ti avevo avvisato.', 1)],
    },

    // ===================== 4. L'ULTIMA DISCESA =====================
    // All'inizio dell'ondata 20. Non e' un discorso: e' una riga sola.
    finale: {
      righe: [AN('È sotto di te. Non sa che esisti, e per ora è l’unico vantaggio che abbiamo.')],
    },

    // ===================== IL MENU DI FINE ONDATA =====================
    // v2.8.1 — Dopo il colpo di scena, la schermata fra un'ondata e l'altra diceva una cosa FALSA:
    // "PUNTI — dove metti quello che hai imparato". Lui non impara niente. Quello che compare li' dentro
    // — forza, costituzione, abilita' — sono DONI di chi tiene il mouse, ed e' esattamente la regola che
    // l'Anziano ha promesso: «ogni potere che otterrai sara' perche' lui lo vorra'».
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
      anziano: { t: 'Trova l’Anziano',     d: 'Villaggio, la casa con le guardie sulla soglia' },
      discesa: { t: 'Scendi fino ad AZ’GAROTH', d: 'Venti ondate' },
    },
  };

  return S;
});
