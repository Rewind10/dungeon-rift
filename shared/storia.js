/* storia.js — IL TESTO DELLA STORIA (UMD, condiviso client/server)
 *
 * v2.7 — Tutto quello che qualcuno DICE sta qui dentro, e solo qui. Non e' pignoleria: il testo si
 * riscrive dieci volte prima di suonare giusto, e riscriverlo dentro il codice del server vuol dire
 * rileggere la logica ogni volta per trovare la riga. Cosi' invece si apre un file e si scrive.
 *
 * v2.8 — OGNI RIGA HA IL SUO INTERLOCUTORE. Prima la scena aveva UNA voce sola; adesso sono dialoghi, e
 * `chi` sta sulla riga:
 *     'tu'       — l'avatar: ritratto della classe scelta, nome della classe
 *     'sciamano' — lo sciamano
 *     ''         — la voce senza volto del risveglio (e' lui, ma non si sa ancora)
 * Nel testo, `{eroe}` diventa il nome della classe di chi sta leggendo: in tre a schermo ognuno si sente
 * nominare la sua.
 *
 * IL REGISTRO: secco, frasi corte, nessuna spiegazione di troppo. Chi parla sa piu' di quello che dice.
 * Se una riga si puo' accorciare, si accorcia; se spiega una cosa che il giocatore vede da solo, si toglie.
 *
 * IL FILO. La voce del risveglio e lo SCIAMANO sono la stessa persona, e il giocatore lo scopre quando
 * gli parla. E' per questo che la voce non si presenta e non ha ritratto: `chi: ''` e' il punto, non una
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

  // scorciatoie per scrivere il dialogo senza rumore attorno
  const TU = (t) => ({ chi: 'tu', t });
  const SC = (t) => ({ chi: 'sciamano', t });
  const VO = (t) => ({ chi: '', t });

  const S = {
    // il nome del boss dell'ondata 20 e quante volte si scende. La storia li pronuncia, quindi stanno
    // qui: se un domani cambiano, cambiano in un posto solo.
    BOSS: 'AZ’GAROTH',
    ONDATE: 20,

    // ===================== 1. IL RISVEGLIO =====================
    // Si apre nella TUA stanza, con un portale acceso in mezzo. Non si spiega niente: uno si sveglia, c'e'
    // un portale dove ieri c'era il pavimento, e una voce gli dice di attraversarlo.
    prologo: {
      righe: [
        TU('Cos’è quella luce?'),
        TU('Si è aperto un portale. Nella mia stanza.'),
        TU('Nella. Mia. Stanza.'),
        VO('Non aver paura. L’ho aperto io.'),
        TU('E tu chi saresti?'),
        VO('Uno che ti aspetta dall’altra parte.'),
        VO('Attraversa. Ti spiego tutto quando arrivi.'),
        TU('E se non attraverso?'),
        VO('Attraversi.'),
      ],
      // se uno gira per la stanza invece di entrare. Una volta sola: insistere la trasformerebbe in un
      // tutorial, e questa non e' una voce che spiega le cose.
      sollecito: VO('Il portale. Non la finestra.'),
    },

    // ===================== 2. L'ARRIVO AL VILLAGGIO =====================
    arrivo: {
      righe: [
        VO('Sei passato. Bene.'),
        VO('Ora trovami. Fila di levante, la casa con le ossa appese.'),
      ],
    },

    // ===================== 3. LO SCIAMANO =====================
    // Il discorso vero, ed e' un dialogo: l'avatar non capisce, e il fatto che non capisca e' giusto —
    // e' lui il posseduto, non l'informato. Le sue righe servono a scandire, non a fare domande retoriche.
    sciamano: {
      righe: [
        SC('Ti sei fatto aspettare.'),
        TU('Mi hai aperto un portale in camera.'),
        SC('E tu l’hai attraversato. Questo dice di te più di quanto credi.'),
        SC('Sotto questo villaggio dorme una cosa vecchia di mille anni. Si chiama AZ’GAROTH, e si sta svegliando.'),
        TU('Cosa volete da me?'),
        SC('Tu sei stato scelto. Da una divinità.'),
        TU('Non capisco.'),
        SC('Sei lo strumento di un Dio.'),
        TU('…'),
        SC('Al di là del nostro mondo, seduto davanti a uno schermo, c’è qualcuno che ti muove.'),
        SC('Sì. Dico a te che ci stai guardando.'),
        TU('Continuo a non capire.'),
        SC('Capirai. Per ora ti basti questo: sei l’eletto, scelto da un Dio per salvarci tutti.'),
        TU('Cosa devo fare?'),
        SC('Làsciati guidare. Ti donerà i poteri che ti servono.'),
        TU('Ma…'),
        SC('Ora va’. Attraversa la faglia. Venti volte la terra si aprirà, e in fondo ci sarà lui.'),
        SC('Compi il destino che la divinità ha scelto per te.'),
      ],
      // se gli si torna davanti dopo. Una riga sola: un vecchio che ha gia' detto tutto.
      ancora: SC('Ti ho detto tutto. Adesso tocca a te. A te davvero.'),
    },

    // ===================== 4. L'ULTIMA DISCESA =====================
    // All'inizio dell'ondata 20. Non e' un discorso: e' una riga sola.
    finale: {
      righe: [SC('È sotto di te. Non sa che esisti, e per ora è l’unico vantaggio che abbiamo.')],
    },

    // ===================== IL MENU DI FINE ONDATA =====================
    // v2.8.1 — Dopo il colpo di scena, la schermata fra un'ondata e l'altra diceva una cosa FALSA:
    // "PUNTI — dove metti quello che hai imparato". Lui non impara niente. Quello che compare li' dentro
    // — forza, costituzione, abilita' — sono DONI di chi tiene il mouse, ed e' esattamente la regola che
    // lo sciamano ha promesso: «Lasciati guidare. Ti donera' i poteri che ti servono».
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
      faglia:   { t: 'Attraversa il portale', d: 'In mezzo alla stanza' },
      sciamano: { t: 'Trova lo sciamano',     d: 'Villaggio, fila di levante' },
      discesa:  { t: 'Scendi fino ad AZ’GAROTH', d: 'Venti ondate' },
    },
  };

  return S;
});
