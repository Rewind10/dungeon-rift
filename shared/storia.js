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
    prologo: {
      righe: [
        TU('Cos’è quella luce?'),
        TU('No…'),
        TU('C’è un portale.'),
        TU('Nella mia stanza.'),
        VO('Non temere.'),
        TU('Chi sei?'),
        VO('Qualcuno che ti sta aspettando.'),
        TU('Dove?'),
        VO('Dall’altra parte.'),
        TU('E perché dovrei attraversarlo?'),
        VO('Perché il tuo cammino è già iniziato.'),
        TU('Non hai ancora risposto.'),
        VO('Attraversa.'),
        VO('Le risposte sono dall’altra parte.'),
      ],
      // se uno gira per la stanza invece di entrare. Una volta sola: insistere la trasformerebbe in un
      // tutorial, e questa non e' una voce che spiega le cose.
      sollecito: VO('Non troverai le risposte qui.'),
    },

    // ===================== 2. L'ARRIVO AL VILLAGGIO =====================
    arrivo: {
      righe: [
        VO('Eccoti.'),
        VO('L’Oracolo ti aspetta.'),
        VO('Trova la sua casa.'),
        VO('Lui saprà dirti perché sei stato chiamato.'),
      ],
    },

    // ===================== 3. L'ORACOLO =====================
    // v2.20.2 — RISCRITTO DA PAOLO, parola per parola. Cosa e' cambiato rispetto alla versione
    // precedente, perche' non lo si riscopra per caso fra sei mesi:
    //
    //   · LA RIVELAZIONE NON SI SPIEGA PIU'. Prima l'oracolo diceva «un Dio», «ti sta guardando»,
    //     «ogni potere che otterrai sara' perche' lui lo vorra'»: tre gradini e una regola spiegata.
    //     Adesso non nomina nessun Dio. Chiede all'avatar se ha SCELTO lui di attraversare il portale,
    //     e aspetta che sia l'avatar a non saper rispondere. La rivelazione la fa il giocatore da solo.
    //   · C'E' IL CICLO. «Non sei il primo», «sono tornati all'inizio», «tutto questo e' gia' successo».
    //     E' la cosa nuova del discorso, e spiega la morte: non sei finito, sei ricominciato.
    //   · L'ULTIMA BATTUTA E' DELL'AVATAR. «Sempre che io mi ricordi di te» — «Esatto». Chi perde la
    //     memoria fra un giro e l'altro e' lui, non tu, e l'oracolo glielo conferma senza consolarlo.
    //   · NON SI NOMINANO PIU' il boss ne' le venti discese: quelli restano nel riquadro della missione
    //     (`missioni.discesa`), che e' il posto dove servono davvero — li' si leggono quando servono,
    //     qui sarebbero due numeri in mezzo a un dialogo che parla d'altro.
    //
    // Le righe fra parentesi sono FUORI CAMPO (`DI`): si vedono a schermo, in corsivo, piu' spente e
    // senza ritratto — *«inserisci anche le frasi tra parentesi come fuori campo, danno profondita'»*.
    // Portano anche la PAUSA (`p: 1`): prima di scriversi aspettano un attimo in silenzio, cosi' il
    // «(Pausa.)» non e' solo una parola che dice di aspettare — e' un'attesa vera.
    oracolo: {
      righe: [
        OR('Siediti.'),
        TU('Immagino che tu sappia perché sono qui.'),
        OR('Non sei venuto qui per avere risposte.'),
        OR('Sei venuto perché qualcuno ti ha condotto fino a qui.'),
        OR('Dimmi una cosa…'),
        OR('Quando hai attraversato il portale…'),
        OR('hai scelto tu di farlo?'),
        TU('…Certo.'),
        OR('Ne sei sicuro?'),
        TU('…'),
        OR('E quando sei arrivato al villaggio?'),
        OR('Hai scelto tu dove andare?'),
        TU('Io… non lo so.'),
        TU('È come se qualcuno mi guidasse.'),
        OR('Lo so.'),
        DI('(Pausa.)', 1),
        TU('Qualcuno ci osserva?'),
        OR('Sì.'),
        TU('…Anche adesso?'),
        OR('Sì.'),
        OR('Ci sta osservando in questo istante.'),
        DI('(Pausa.)', 1),
        OR('Sei stato scelto.'),
        OR('Sei il suo strumento.'),
        TU('E cosa vuole che faccia?'),
        OR('Sopravvivere.'),
        DI('(Pausa.)', 1),
        OR('Nelle profondità della terra dorme qualcosa…'),
        OR('qualcosa che non avrebbe mai dovuto svegliarsi.'),
        OR('Ora si sta risvegliando.'),
        OR('Dovrai combatterlo.'),
        OR('Altrimenti, per noi, sarà la fine.'),
        TU('E se fallissi?'),
        OR('Ci proverai ancora.'),
        TU('Ancora?'),
        DI('(L’Oracolo lo osserva in silenzio.)', 1),
        OR('Non sei il primo.'),
        TU('Quanti sono venuti prima di me?'),
        OR('Abbastanza.'),
        TU('E dove sono?'),
        OR('Sono tornati all’inizio.'),
        TU('Quindi tutto questo è già successo?'),
        OR('Molte volte.'),
        DI('(Pausa.)', 1),
        TU('E nessuno è riuscito?'),
        OR('Forse qualcuno sì.'),
        TU('Allora perché sono qui?'),
        OR('Perché qualcuno vuole vedere se questa volta sarà diverso.'),
        DI('(L’Oracolo guarda verso lo schermo.)', 1),
        OR('Vai.'),
        TU('E se morirò?'),
        OR('Ci rivedremo.'),
        DI('(Pausa.)', 1),
        TU('Sempre che io mi ricordi di te.'),
        OR('Esatto.'),
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
