# 📜 CHANGELOG — DUNGEON RIFT

Tutte le modifiche rilevanti del progetto, versione per versione (dalla più recente).

### [1.77.2] — 2026-08-30 · "Il cronometro cammina"

Segnalato da Paolo: **a inizio partita il cronometro restava fermo su 0:00**.

Un errore da manuale, e vale la pena scriverlo per esteso. Il tempo trascorso si calcolava cosi':

```js
this.time - (this.waveT0 || this.time)
```

Il `||` doveva coprire il caso "waveT0 non ancora impostato". Ma alla **prima ondata** waveT0 vale
*esattamente* 0 — la partita comincia al tempo zero — e in JavaScript lo zero e' falso: scattava il
ripiego, il calcolo diventava `this.time - this.time` e il cronometro segnava zero per tutta la
partita. Dalla seconda ondata in poi funzionava, perche' li' waveT0 e' un numero diverso da zero.

Adesso `waveT0` nasce con la stanza insieme a `parT`, `waveMostri` e `parPreso`: sono sempre numeri
validi, e il ripiego non serve piu' a niente. Il tempo si calcola e basta.

Il **font del cronometro** passa da 13 a 17 px: a 13 si leggeva male mentre si combatte.

#### ✅ Verificato
**1033 test, 0 falliti.** La prova nuova si fa sulla **prima** ondata — e' l'unica in cui waveT0 vale
zero, quindi provarlo a ondata avanzata non avrebbe visto nulla: si lascia scorrere la partita e si
controlla che a 3, 8 e 15 secondi il cronometro segni 3, 8 e 15. Provata contro il codice col bug:
**fallisce tutte e tre le letture** (segnava 0 s ogni volta).

---

### [1.77.1] — 2026-08-30 · "Le vite extra non si comprano dall'Erborista"

Correzione della 1.77, segnalata da Paolo. Il **Cuore di Fenice** era finito nel catalogo
dell'Erborista come pozione da cintura, con un tetto di una carica per slot. Il tetto non bastava:
**l'Erborista e' sempre li'**. Una vita comprabile da lui e' una vita comprabile *ogni volta* che
passi dal villaggio, e le vite si accumulano senza attrito.

Resta solo dal **Mercante Errante**, che compare a caso durante le ondate: e' quella incertezza a
dargli il prezzo vero, non le 180 monete.

- Via la pozione dal catalogo: l'Erborista torna a nove voci, tre delle quali forti.
- Via anche il meccanismo che le serviva — il ramo `kind: 'life'` in `usePotion` e il tetto di cariche
  per singola pozione. Erano stati aggiunti per lei sola e non li usava piu' nessuno: un meccanismo che
  nessuno usa e' una trappola per chi legge. Nel catalogo c'e' scritto dov'e' il posto giusto se un
  domani servisse di nuovo (erano tre righe).

#### E una prova instabile, mia, sistemata
Il test della v1.76 "dietro un masso al centro non si muore" cercava un riparo interno solo nella
finestra centrale della mappa: su qualche seme quella finestra non conteneva massi interni e il test
falliva una volta su sei. Colpa della prova, non del gioco. Adesso cerca su tutta la mappa e chiede la
cosa esatta — una tessera che tocca roccia **non esterna** — con due assunti separati: che i ripari
interni esistano, e che almeno uno sia fuori dalla fascia della faglia.

#### ✅ Verificato
**1027 test, 0 falliti**, sei esecuzioni di fila. I nuovi: nel catalogo dell'Erborista non c'e' nessuna
vita extra, ne' sotto altro nome; il Cuore di Fenice e' ancora fra le merci del Mercante Errante e li'
costa 180 monete.

---

### [1.77.0] — 2026-08-30 · "Niente cade dal cielo, e le ondate hanno un cronometro"

#### I nemici non lasciano piu' oggetti
Nessuno: ne' i comuni, ne' gli elite, ne' i boss, ne' la cassa-mima. Prima cadeva un oggetto nel 9%
delle uccisioni (35% sugli elite, sempre su boss e mime), e fra quelli c'era la **Pozione di Salute**.
Una cura che arriva gratis dal nulla mentre combatti toglie il mestiere all'**Ostessa**, che si fa
pagare per rimetterti in piedi, e all'**Erborista**, che si fa pagare per la stessa cosa in boccetta:
se la cura piove dai mostri, quei due sono decorazione.

Restano **esperienza**, **monete** e quello che c'e' dentro le **casse** — che non sono nemici.

#### Le quattro pozioni forti, dall'Erborista
Gli effetti rari che cadevano a terra non spariscono: si comprano. Riusano le stesse chiavi che il
motore leggeva gia' per gli oggetti, quindi l'effetto e' identico — cambia chi te lo da'.

| Pozione | Effetto | Prezzo |
|---|---|---|
| 🔺 **Nucleo Instabile** | +50% danno per 12 s | 110 |
| 💥 **Ira Berserk** | danno raddoppiato e +40% cadenza per 8 s | 185 |
| ✨ **Egida Divina** | invulnerabile per 5 s | 270 |
| 💗 **Cuore di Fenice** | +1 vita — **una sola carica per slot** | 240 |

Sono deliberatamente care: la piu' economica costa piu' del doppio della piu' cara fra le sei di
base, e una sola carica di Egida costa piu' di una cintura intera delle vecchie. La regola e' che una
risposta potente si **paghi**, non che **capiti**. Il Cuore di Fenice ha un tetto suo di **una**
carica: tre vite di scorta in cintura renderebbero la morte una formalita'.

#### Il cronometro dell'ondata
Sotto il nome della mappa compare **⏱ tempo trascorso / tempo obiettivo**. Il colore e' l'informazione:
**verde** sei dentro, **ambra** ti restano meno di dieci secondi, **spento** obiettivo perso. Chi non
guarda i numeri legge comunque il colore con la coda dell'occhio.

Il tempo obiettivo **non e' un numero fisso**: un'ondata da 7 mostri e una da 41 non possono avere lo
stesso limite. Si calcola dal contenuto — `25 s + 3,2 s per mostro, diviso i giocatori in piedi`:

| | ondata 1 (7 mostri) | ondata 3 (15) | ondata 11 (38) | ondata 20 (41) |
|---|---|---|---|---|
| da solo | 47 s | 73 s | 147 s | 156 s |
| in tre | 36 s | 49 s | 83 s | 88 s |

Chi chiude dentro il tempo prende **+25 XP +8 per ondata** e **+12 monete +3 per ondata** — all'ondata
10 sono 105 XP e 42 monete, quanto un pezzo di equipaggiamento leggero.

Le ondate a **sopravvivenza** sono escluse per costruzione: durano un tempo fisso, non si possono
chiudere prima, e un premio che tocca sempre non e' un premio. Li' il cronometro conta e basta.

I due numeri (`PAR_BASE` e `PAR_PER_MOSTRO`) sono la manopola, e stanno in `constants.js` con scritto
cosa fa ciascuno: il primo regala tempo a tutte le ondate, il secondo soprattutto a quelle affollate.

#### Come ho scelto i tempi
Misurando. Il **pavimento assoluto** — giocatori invincibili che uccidono all'istante — sta fra 1,4 e
7,6 secondi: i mostri entrano in campo subito, quindi il tempo lo fa il combattimento e non la coda di
generazione, e un limite basato sul numero di mostri ha senso. Il pilota automatico dei test e' troppo
scarso per fare da metro (chiude l'ondata 1 in 115 secondi mediani, con punte di 473): i numeri qui
sopra sono tarati generosi apposta, e restano da ritoccare dopo averci giocato davvero.

#### ✅ Verificato
**1029 test, 0 falliti**, tre esecuzioni di fila. I nuovi: su 362 nemici uccisi — elite, boss e
cassa-mima compresi — non cade un solo oggetto, mentre esperienza e monete continuano a cadere; le
quattro pozioni forti esistono, costano piu' del doppio delle base e coprono i tre effetti che prima
cadevano a terra; del Cuore di Fenice si compra una carica sola e bevendolo si guadagna una vita; il
tempo obiettivo scala col numero di mostri; chiudendo in tre secondi il premio scatta e porta monete,
chiudendo trenta secondi oltre no; e nelle ondate a sopravvivenza il tempo obiettivo non esiste.

---

### [1.76.1] — 2026-08-30 · "I nemici non si teletrasportano"

Segnalato provando la 1.76: **scappando, ogni tanto i nemici comparivano addosso**. Non era
un'impressione, ed erano due meccanismi diversi.

#### Il recupero anti-stallo
Esisteva per una ragione buona — che un'ondata non resti aperta per sempre perche' un mostro e'
finito dove non puo' piu' raggiungerti — ma era scritto male: **se per 6 secondi il numero di mostri
non calava, teletrasportava TUTTI i mostri a 240 px da un giocatore**. Scappare senza uccidere e'
esattamente quella condizione, e allora il branco ti compariva addosso.

Adesso la regola guarda il **singolo mostro**, e ne sposta uno solo se tutte e tre valgono:

1. non si e' avvicinato di un metro al giocatore piu' vicino **da 5 secondi**;
2. sta comunque **oltre 640 px** — se ti e' addosso non e' bloccato, sta combattendo;
3. non e' uno di quelli fermi per costruzione (il Fungo sta piantato: e' il suo mestiere).

E chi si sposta va **oltre i 950 px e in un punto da cui non lo vedi**. Se un posto cosi' non si
trova, non si sposta niente e si riprova fra cinque secondi: meglio un'ondata piu' lunga di qualche
secondo che un mostro che si materializza in mezzo allo schermo.

#### Le caselle di generazione
Le caselle da cui nascono i nemici sono scelte lontane dalla **partenza**. Ma un'ondata dura minuti e
tu nel frattempo ti sei spostato: una casella lontana dal punto di atterraggio puo' trovarsi a due
passi da dove sei adesso. Adesso se ne pescano ventiquattro e si tiene la migliore — lontana almeno
520 px **e possibilmente fuori dalla tua linea di vista**.

#### ✅ Verificato
**992 test, 0 falliti**, sei esecuzioni di fila.

Il test nuovo riproduce esattamente la segnalazione: 25 secondi di fuga senza uccidere nessuno, e
**nessun nemico in vista puo' avvicinarsi piu' di quanto le sue gambe permettano** in un tick. Piu'
la controprova, che il recupero funzioni ancora: un mostro che non fa progressi da cinque secondi
viene comunque rimesso in gioco, e lontano.

Il test e' stato provato contro il codice VECCHIO e **fallisce** (75 px guadagnati in un tick, e il
mostro rimesso a 240 px): non e' una prova che passa per costruzione.

Due errori miei lungo la strada, tenuti nei commenti:
- la prima versione del test filtrava sulla distanza **prima** del tick e scartava tutto oltre gli
  800 px — cioe' scartava esattamente il caso che conta, il mostro lontano che ti compare addosso.
  Con quel filtro passava anche col codice vecchio: non provava niente.
- il primo ricollocamento mandava il mostro a 600-900 px, e 600 px sono **dentro lo schermo**. Se
  n'e' accorto il test stesso: 619 px guadagnati in un tick sotto gli occhi del giocatore.

Prova di tenuta fuori dalla suite: **sei partite da 60 secondi di fuga continua, 10.800 tick, zero
scatti in vista**.

---

### [1.76.0] — 2026-08-30 · "La caverna dipinta"

Le mappe di combattimento erano il punto debole del gioco: pietra piatta, muri disegnati come
rettangoli neri, e quasi niente sopra. Rifatte da capo — pianta, pavimento, muri, pietrisco — con le
battlemap disegnate come bersaglio. Il villaggio non e' toccato: ha il suo aspetto e se lo tiene.

#### Prima la pianta, perche' e' quella che decide se si gioca bene
La mappa passa da **46x34 a 64x46 tessere** (3072x2208 px invece di 2208x1632). Area calpestabile da
**1041 a ~1330 tessere** (+28%), e lo spazio libero attorno — quello che conta per non farsi
incastrare — da **0,78 a 1,16** (+49%).

Il vincolo che tiene tutto in piedi e' misurato, non sperato: **zero tessere-strozzatura**. Una
tessera-strozzatura e' una tessera che, tolta, spezza la mappa in due; zero significa che da ogni
camera si esce sempre da almeno due parti. C'e' un passaggio che le cerca (visita di Tarjan, una
sola passata) e le allarga finche' non ce n'e' piu'.

Tre archetipi — **anello**, **quadrifoglio**, **stella** — piu' le **dorsali**, schiene di pietra che
attraversano e obbligano a scegliere da che parte girarle.

Come si costruisce: si scava UNA caverna grande e irregolare, poi ci si mettono dentro **masse di
roccia** a scolpire le camere. Lo spazio giocabile resta grande e continuo, la struttura la fanno gli
ostacoli. La quantita' di roccia non e' un numero scelto a mano — e' un **budget**: la roccia interna
arriva al 26% della caverna e ci si ferma li'.

#### Poi l'aspetto
- **Il pavimento e' QUIETO**: macchie morbide, crepe lunghe e sottili, giunti appena accennati,
  nessun contorno. **I muri sono RUMOROSI**: massa quasi nera, massi col contorno spesso, ombra
  proiettata dentro la stanza. E' questa scala di rumore a dire all'occhio dove si cammina.
- **Il pietrisco**: massi, grappoli di macerie, ossa sparse, chiazze di sporco — tutti col contorno a
  inchiostro, tutti piu' chiari del pavimento su cui stanno.
- **La palette esce dal tema**: cripta, lava, ghiaccio, foresta e arcano restano diversi. Cambia il
  modo di disegnare, non l'identita' della mappa.

Misurato con lo stesso metodo sulle immagini di riferimento: **luminanza mediana da 18 a 48** (le
battlemap dipinte stanno a 44 — a 18 era cosi' buio che non si vedeva niente di quello che c'era) e
**densita' di contorni dall'1,3% all'8,3%** (il riferimento sta al 6,6%).

#### Quattro bug veri, trovati portandolo nel motore
- **`floodReach` murava la mappa intera.** Partiva dal centro geometrico; con la caverna il centro
  puo' essere roccia, la visita non partiva e il blocco che mura le sacche staccate murava tutto: 4
  mappe su 400 senza portale, con 2944 tessere di muro su 2944. Corretto una prima volta partendo
  dalla prima tessera libera — e sbagliato di nuovo, perche' la prima che si incontra puo' essere una
  sacca isolata da una tessera. La regola giusta non e' "da dove parto" ma "cosa tengo": si tiene la
  **componente piu' grande**.
- **La faglia aveva smesso di mordere.** La profondita' si misurava dai bordi del rettangolo; con la
  caverna rientrata, la fascia toccava il 10% delle tessere invece del 30% e arrivava a profondita' 3
  invece di 6. Adesso si misura dalla **roccia esterna** — quella che confina col bordo della mappa,
  non i massi interni, se no stare al riparo dietro un sasso sarebbe letale. Fascia profonda due
  tessere, copertura 34%, tarata sulla misura e non a occhio.
- **La radura di partenza non era piu' garantita.** Si cercava solo entro 7 tessere dal centro; se
  quella zona era roccia si ripiegava su una tessera qualunque, magari incastrata. Mezzo gioco da'
  per scontato che attorno alla partenza ci sia spazio (i nemici nascono a 200-260 px con la linea di
  vista libera). Adesso si cerca la radura piu' ampia su tutta la mappa, e a parita' la piu' vicina
  al centro. Raggio libero minimo misurato su 80 mappe: **4 tessere**.
- **Il recupero anti-incastro non bastava piu'.** Cercava pavimento entro 3 tessere: dentro una massa
  di roccia della pianta nuova non ce n'e'. Sette mostri piantati nel muro in una partita. Portato a 8.

#### Due errori miei, scritti nel codice perche' non li rifaccia
- **Allargare "dove e' stretto"** invece che i ponti che servono: ogni scavo crea nuove tessere che
  soddisfano la condizione, l'erosione va a cascata e in otto passate si mangia tutta la roccia
  (area da 1350 a 2470 su 2944). Adesso si guarda il grafo delle celle larghe abbastanza per un boss
  e si scava **solo il cammino piu' corto** fra i pezzi scollegati.
- **Cercare le strozzature a forza bruta**, un flood fill per tessera: su 1350 tessere sono 1,8
  milioni di passi per chiamata e la suite dei test e' andata in timeout. Rifatto con la visita di
  Tarjan: 10 mappe in 154 ms.

#### ✅ Verificato
**987 test, 0 falliti**, sei esecuzioni di fila. Su 400 mappe generate: nessuna rotta, pavimento
minimo 736 tessere, zero tessere-strozzatura, e il boss arriva all'uscita in tutte. Tre prove che
fallivano a intermittenza sono state stabilizzate alla radice (la radura di partenza), non zittite.

---

### [1.75.3] — 2026-08-30 · "Soglie sgombre"

Tre correzioni trovate provando la 1.75.2. Finche' i mobili erano decorazione non davano fastidio; da quando
hanno un corpo, un mobile appoggiato accanto a una porta e' uno spigolo che prendi **ogni volta** che entri.

- **Via le due casse della piazza**: stavano davanti all'osteria e davanti alla gilda delle taglie.
- **Via la rastrelliera davanti all'ingresso della fucina** (ne restano quattro, alle spalle del fabbro e
  sulla parete est in basso).
- Adesso tutte e cinque le porte hanno lo **stesso passaggio libero: 98 px**, tre volte e mezzo la larghezza
  del personaggio. Il varco del portale ne ha 146.

#### ✅ Verificato
**989 test, 0 falliti** (erano 987).

Il primo test che avevo scritto misurava la **distanza dal mobile piu' vicino** e non funzionava: una cassa
piantata davanti alla porta e un tavolo che sta due tile *dentro* la stanza danno lo stesso numero (66, 83 e
90 px le tre cose tolte; 85 px il primo tavolo della taverna, che ci sta benissimo dov'e'). Nessuna soglia
numerica li separa.

Quello che si misura adesso e' la **luce**: quanto passaggio libero resta davvero attraversando la porta,
corpi solidi inclusi. Deve essere almeno il doppio della larghezza del personaggio — oggi e' tre volte e
mezzo. In piu' un controllo diretto: **nella piazza non ci sono casse**, che e' esattamente cio' che
stava davanti all'osteria e alle taglie.

---

### [1.75.2] — 2026-08-30 · "I mobili hanno un corpo"

Attraversare un tavolo da parte a parte faceva sembrare il villaggio un disegno invece che un posto. Adesso
**mobili e persone sono ostacoli veri**: ci sbatti contro e ci giri attorno.

- **Hanno un corpo**: tavoli, banconi, credenza, scaffali, rastrelliere, incudine, aiuole, alambicco,
  mortaio, casse, botti, sacchi, bracieri, candelabri, cristalli, il cartello e il falo'.
- **Anche le persone**: i cinque mercanti e le otto comparse. Dietro il bancone non ci si passa piu' in
  mezzo.
- **Si attraversa** cio' che e' basso, appeso o dipinto a terra: tappeti, pozze di lava, ragnatele,
  stendardi, teschi, lanterne (stanno sul soffitto), le pietre attorno al falo' e **gli sgabelli** — solidi
  darebbero solo fastidio fra il tavolo e chi ci gira attorno.
- **Se ti ritrovi incastrato, ti spinge fuori.** Un teletrasporto o uno scatto possono depositarti dentro un
  mobile: si esce dal lato piu' vicino, mai dentro la roccia. E se sei stretto *fra due* corpi — fra il
  tavolo e chi ci sta seduto attorno — le due spinte si annullerebbero a vicenda, quindi in quel caso si
  smette di negoziare e si cerca il punto libero piu' vicino girando in tondo.
- **Vale solo nel villaggio.** Fuori non ci sono mobili, e nelle ondate un secondo insieme di corpi solidi
  in mezzo a mostri e proiettili sarebbe un rischio senza guadagno. Fuori dal villaggio la collisione costa
  esattamente quanto prima: un confronto con `null`.

#### ✅ Verificato
**987 test, 0 falliti** (erano 929).
I nuovi: i corpi esistono solo nel villaggio; ha un corpo **esattamente** cio' che deve averlo (26 mobili +
13 persone = 39 corpi) e ogni oggetto del villaggio e' classificato, o solido o attraversabile; con i corpi
attivi si arriva ancora **a parlare con tutti e cinque i mercanti** e al portale; **nessuna zona libera
resta tagliata fuori** dai mobili; camminando in **sedici direzioni per 260 passi ciascuna** non si finisce
mai dentro un corpo; messi dentro un tavolo, un bancone, un mercante o una comparsa si viene spinti fuori
entro 110 px e mai nella roccia; e chi non e' incastrato non viene spostato di un pixel.

---

### [1.75.1] — 2026-08-30 · "Porte piu' larghe"

Correzione trovata provando la 1.75: **le porte fra le stanze erano larghe una sola tile** — 48 pixel
contro un personaggio largo 35. Ci si passava a pelo, sfregando lo stipite a ogni ingresso.

- **Ogni porta e' larga due tile** (96 px): il doppio dello spazio, e il passaggio si legge come una porta
  invece che come una fessura. La griglia lavora a tile intere: fra una e due non c'e' nulla in mezzo.
- **Il varco verso il portale e' largo tre tile**: e' la strada principale del villaggio, e con un numero
  dispari resta centrata sull'uscita.
- **Taverna ed erboristeria guadagnano una riga** (fino a y=11): serviva perche' la loro porta si affacci
  sul fianco della piazza e non sullo spigolo, dove qualunque corridoio resterebbe stretto una tile.

#### ✅ Verificato
**927 test, 0 falliti.** Il nuovo controlla il **confine di ogni porta**: se un corridoio tocca una stanza
o la piazza con una sola tile, il test fallisce. Tutte e 385 le tile calpestabili restano raggiungibili a
piedi dallo spawn, e nessun mobile o personaggio finisce nella roccia.

---

### [1.75.0] — 2026-08-30 · "Il villaggio a micro-stanze"

La sala unica e' finita. Cinque figure in piedi dentro un rettangolo non raccontavano niente, e le nicchie
erano una mezza misura. Adesso **ogni mestiere ha la sua stanza**, con la sua porta, il suo pavimento e i
suoi mobili: e' la **pianta** a dire chi fa cosa, prima ancora dei nomi.

#### La pianta
Una **piazza centrale** col falo' — si atterra li', e li' torna il portale. Attorno, cinque stanze
attaccate da corridoi corti: **nessuna e' a piu' di due passi dalla piazza**, e da li' si vedono tutte le
porte. Il villaggio si attraversa, non si esplora.

| Stanza | Chi ci sta | Cosa c'e' dentro |
|---|---|---|
| **Taverna** (pavimento di legno) | Ostessa | bancone, credenza con le bottiglie alle sue spalle, due file di tavoli con gli sgabelli, botti, lanterne appese |
| **Antro** (lastre viola) | Cartomante | tappeto, tavolo, candelabri, scaffale di libri e mazzi, grappoli di cristallo viola |
| **Erboristeria** (terra battuta) | Erborista | bancone, alambicco, mortaio, scaffali, **tre aiuole in fila** (niente piu' funghi a caso) |
| **Fucina** (lastre rossastre) | Fabbro | bancone, incudine, **quattro rastrelliere d'armi**, la colata di lava in fondo, bracieri |
| **Gilda dei Contratti** (lastre) | Capitano | bacheca **TAGLIE**, bancone, stendardi, scaffali dell'usato, casse in ordine |

#### Le persone
- **I mercanti non sono piu' ritratti frontali.** Erano un pugno in un occhio in una mappa vista dall'alto.
  Adesso nascono dalla **stessa silhouette dei tre eroi**, ricolorata mestiere per mestiere e **disarmata**
  (niente elmo, scudo, arco o bastone): in mano hanno solo l'attrezzo del loro lavoro.
- **Ognuno ha il suo alone di luce**, del suo colore: e' cosi' che lo riconosci da lontano, al buio.
- **Il Banditore e' diventato il Capitano** della Gilda dei Contratti: un ufficiale che appende le taglie e
  ricompra l'attrezzatura dei caduti. Era il personaggio meno riuscito — un tizio con un cartello. La chiave
  interna resta `crier`/`bnd`: cambia la persona, non l'impianto.
- **Otto comparse** in piedi attorno ai tavoli e per le strade. Non parlano e non vendono, ma senza di loro
  il posto sembrava abbandonato invece che abitato. (Sedute non funzionavano: dall'alto una figura seduta e'
  un ovale con una testa.)

#### Come si aggiunge una stanza
Una riga in `ROOMS` (rettangolo, pavimento, colore) e una in `LINKS` (il corridoio che la attacca alla
piazza). L'arredo sta in una sezione per stanza dentro `generateMarket`. La mappa passa da **26x22 a 34x26**
tile e adesso espone `floors`, un rettangolo di pavimento per stanza, che il renderer disegna prima di tutto
il resto.

#### ✅ Verificato
**927 test, 0 falliti** (erano 893) piu' i controlli del client.
I nuovi: si scava solo dove previsto e non resta roccia dentro le stanze; **dallo spawn si raggiunge ogni
singola tile calpestabile** (352 su 352), portale compreso; ogni stanza e' collegata alla piazza; ogni
mercante sta dentro la stanza del suo mestiere e ha un colore diverso dagli altri; niente mercanti, comparse
o mobili dentro la roccia; **il renderer sa disegnare tutti i 26 tipi di arredo** (un tipo scritto male
sarebbe un oggetto invisibile); l'arredo sta in una stanza, nella piazza o lungo un corridoio, mai altrove.

---

### [1.74.1] — 2026-08-30 · "Nessuna cura automatica"

Correzione trovata provando la 1.74: **a ogni fine ondata il gioco curava il 25% dei PV massimi**, in
silenzio e gratis. Era lì da molte versioni, e rendeva l'Ostessa un lusso invece che un servizio: bastava
aspettare la fine dell'ondata. Rimossa.

- **I danni si portano dietro.** Chiudere un'ondata non ridà più niente: per rimettersi in piedi si paga
  l'Ostessa, si beve una pozione o si raccoglie un potenziamento.
- **Chi è a terra viene comunque rialzato** al 60%: quello non è curare, è rimettere in gioco chi
  altrimenti resterebbe fuori per sempre.
- Allineate due porte secondarie che sfuggivano alla regola della 1.74: l'offerta **"+PV massimi" del
  Mercante Errante** e la **Benedizione "+40 PV" del Mercante Nero** ora alzano il tetto e basta.

#### Le vie che restano per curarsi
Tutte richiedono che qualcuno paghi, beva, raccolga o compia qualcosa:

| Via | Quanto | Come si ottiene |
|---|---|---|
| **Ostessa** | quanto paghi | 0,4 monete a PV |
| **Pozione di Cura** | 40% dei PV max | comprata dall'Erborista |
| **Pozione di Rigenerazione** | 10 PV/s per 8 s | comprata dall'Erborista |
| **Pozione di Salute** | 35% dei PV max | raccolta a terra |
| **Bende del Viandante** | 55% dei PV max | 45 monete al Mercante Errante |
| **buff Vigore** | 8 PV/s per 10 s | uscito da una cassa |
| carta **Vampirismo** | 4% del danno inflitto | carta scelta a fine ondata |
| carta **Scudo Vitale** | 2 PV/s | carta scelta a fine ondata |
| carta **Ultima Occasione** | risorgi al 50% | carta scelta, una carica |
| sinergia **Sete di Sangue** | +6% dal danno | Vampirismo + Adrenalina Pura |
| **aura del Paladino** | 2%/s ai compagni, 1%/s a sé | specializzazione di rango V |
| **combo di 40** | 25% dei PV max | 40 uccisioni concatenate |
| rianimazione | 50-60% | un compagno, o la fine dell'ondata se sei a terra |

#### ✅ Verificato
**893 test, 0 falliti.** I nuovi: i PV con cui finisci un'ondata sono quelli con cui inizi la successiva,
e restano tali anche dopo tre ondate; chi è a terra torna comunque in gioco; pozione, oggetto e Ostessa
curano ancora; nessuna delle quattro porte che alzano il massimo (Costituzione, Colosso, Scudo Vitale,
Mercante Errante) restituisce un PV; l'equipaggiamento non cura; e un controllo sul codice sorgente che
non ricompaia da nessuna parte un aumento diretto dei punti ferita.

---

### [1.74.0] — 2026-08-30 · "L'Ostessa, e i PV massimi non curano più"

Il villaggio è **completo**: tutte e cinque le botteghe lavorano.

#### 🍺 L'Ostessa — il riposo a pagamento
Per ora fa una cosa sola: ti rimette in piedi. Il resto verrà.

- Si paga **a punto vita**, non a forfait: **0,4 monete per ogni PV** che ti manca. Un prezzo fisso sarebbe
  un affare quando sei quasi morto e uno spreco quando ti manca poco — in entrambi i casi non una scelta.
- **Se le monete non bastano compri quello che puoi**: con 28 monete ti rende 70 PV. Da lì non si esce mai
  a mani vuote.
- Resta **più conveniente della pozione di Cura** (0,4 contro 0,54 a PV): la pozione però la bevi in mezzo
  ai nemici, e quella differenza è il prezzo della comodità.

#### ❤️ La regola nuova: alzare i PV massimi non cura
Questa tocca tutto il gioco, ed è la ragione per cui l'Ostessa ha un mestiere.

- Un punto di **Costituzione** alza il massimo di 20 e **non restituisce un solo PV**. Prima ne curava 20:
  con quella regola l'Ostessa sarebbe stata inutile dal primo giorno.
- Stessa cosa per le carte **Colosso** (+45) e **Scudo Vitale** (+30): danno massimo, non salute. Le loro
  descrizioni ora lo dicono.
- Rimettersi in piedi resta possibile in tre modi: la **pozione di Cura**, i **potenziamenti** raccolti a
  terra e l'**Ostessa**.

**Il dettaglio che poteva rompersi.** Spegnere una carta dalla Cartomante abbassa il massimo e taglia i PV
in eccesso; se riaccendendola non tornassero, ogni giro costerebbe vita e la Cartomante diventerebbe una
tassa. Quindi il taglio non si perde, si **segna**, e viene restituito solo quando il massimo risale — mai
più di quanto era stato tolto. Accendere e spegnere resta **neutro al punto**, e nessuna via cura di
striscio. Il riposo comprato all'Ostessa **cancella il segno**: quei PV li hai già pagati.

#### 🏘️ Villaggio
**Nessuna bottega chiusa.** Fabbro, Erborista, Banditore, Cartomante e Ostessa.

#### ✅ Verificato
**879 test, 0 falliti.** Fra gli altri: sei punti di Costituzione di fila non curano di un PV, né lo fanno
Colosso e Scudo Vitale; il prezzo del riposo è proporzionale e non forfettario; la cura parziale rende
esattamente i PV pagati; a PV pieni non si paga; da lontano il focolare non risponde; il riposo è più
economico a PV della pozione, come da taratura; e la sequenza completa spegni-carta → prendi-danni →
paga-l'Ostessa → riaccendi-carta non regala neanche un punto vita. Più 15 controlli sull'interfaccia nei
cinque stati del pannello.

---

### [1.73.0] — 2026-08-30 · "Cinque carte, e un posto dove guardarle"

Quarta bottega, e una riorganizzazione dell'HUD.

#### 🔮 La Cartomante — cinque carte accese
Niente previsione delle ondate e niente respec (idee scartate). Fa una cosa sola: decidere **quali carte
tieni accese**, al massimo **cinque**.

- Il limite conta **carte diverse**: Rimbalzo ×3 occupa un posto solo, così approfondire una carta resta
  una strategia e non una tassa.
- Quando ne scegli una a fine ondata e ne hai già cinque accese, **la prendi lo stesso ma arriva spenta** —
  non ti blocca mai a fine ondata, e ti dà un motivo per passare dalla Cartomante.
- Le carte spente **restano tue** per sempre. Spegnere è sempre concesso, accendere solo se c'è posto.
- Le **sinergie** seguono le carte accese: spegnerne una spegne anche la sinergia che formava.

#### ⚙️ Il pezzo rischioso: il ricalcolo da zero
Fino alla 1.72 le carte, quando le sceglievi, **si sommavano dentro il personaggio e non uscivano più**.
Per poterle spegnere, ora tutto si ricostruisce da zero a ogni cambio — statistiche base → statistiche
comprate coi punti → carte accese → sinergie — esattamente come già faceva l'equipaggiamento dalla 1.67.
Con effetti che si possono togliere, sommare i delta lascerebbe in giro il bonus della carta spenta per
sempre, e nulla se ne accorgerebbe.

Due punti delicati, entrambi coperti dai test:
- **I PV.** Alcune carte alzano il massimo *e* curano di altrettanto. Al ricalcolo la cura non va rifatta,
  ma se il massimo sale quella differenza va data, e se scende i PV vanno tagliati al nuovo tetto —
  altrimenti spegnere e riaccendere sarebbe una pompa di vita infinita.
- **Ultima Occasione.** La carica si consuma giocando: spegnere e riaccendere la carta non la resuscita.

#### 🧑 Il box del personaggio
Fra la barra delle abilità e la boccetta della vita c'era un vuoto. Ora c'è un box che raccoglie tre cose
che prima erano sparse o invisibili:
- **nome, livello e rango**, che stavano **sopra la testa** — in mezzo all'azione, proprio dove serve
  vedere. Sopra la tua testa non c'è più nulla; sopra i **compagni** restano, altrimenti in co-op tre
  sagome uguali diventano indistinguibili;
- la **barra dell'esperienza**;
- le **cinque caselle delle carte**, con quelle vuote ben visibili: il tetto di cinque è una regola, e una
  regola che non si vede non esiste.

La vecchia barra dei gettoni in basso (`#boonBar`) è stata **rimossa**: mostrava le stesse icone senza dire
a chi appartenessero né quante se ne potessero tenere accese.

#### 🏘️ Villaggio
Resta chiusa solo l'**Ostessa**.

#### ✅ Verificato
**847 test, 0 falliti.** Il grosso è sul ricalcolo: spegnere toglie davvero il bonus (non resta attaccato),
riaccendere riporta al valore **identico**, dieci giri di spegni/accendi non fanno derivare i numeri di un
millesimo, le statistiche comprate coi punti sopravvivono, il tetto non si aggira dal client, i PV si
comportano nei tre casi (sale, scende, pieni) e otto giri non regalano vita, la carica di Ultima Occasione
spesa non torna, e le sinergie si accendono e si spengono con le carte. Più 22 controlli sull'interfaccia.

---

### [1.72.0] — 2026-08-29 · "Il Banditore: niente si butta"

Terza bottega ad aprire, e fa due mestieri.

#### 📦 Il magazzino — l'equipaggiamento non sparisce più
Fino alla 1.71, comprare l'alabarda faceva **svanire nel nulla** lo spadone che avevi pagato 230 monete.
Adesso tutto quello che compri resta **tuo**:
- dal **Fabbro** lo rimetti addosso **gratis** — l'hai già pagato, e il negozio ora lo dichiara (*GIÀ TUO ·
  GRATIS*) invece di richiedere il prezzo pieno;
- dal **Banditore** lo vendi a **metà prezzo**.

Così vendere diventa una scelta e non un automatismo: incassi 235 per l'alabarda adesso, ma se poi la
rivuoi la ripaghi 470. Gli oggetti di partenza non si vendono — valgono zero e toglierli lascerebbe lo
slot senza un fondo a cui tornare. Nemmeno quello che hai addosso si vende.

#### 🪧 Le taglie
Al banco trovi **tre incarichi**, sempre di **tipo diverso**, e ne accetti **uno**. Vale finché non lo
completi: **nessuna scadenza**, il conto prosegue ondata dopo ondata. Le offerte si generano una volta e
restano quelle finché non ne prendi una — riavvicinarsi non le rimescola, altrimenti sarebbe una slot
machine da ripescare finché non esce quella comoda.

| Taglia | Cosa chiede | All'ondata 6 | Paga |
|---|---|---|---:|
| 💀 Caccia grossa | uccidi N nemici | 38 nemici | 108 |
| 🎯 Contratto mirato | uccidi N di una specie | 11 × Melma Corrosiva | 124 |
| 👑 Teste grosse | uccidi N élite | 3 élite | 156 |
| 📦 Saccheggio | apri N casse | 4 casse | 91 |
| 🔥 Catena di sangue | raggiungi una combo di N | combo 24 | 129 |
| 🛡️ Nessun caduto | supera un'ondata senza perdere una vita | — | 172 |

Bersagli e paga crescono con l'ondata. Una taglia vale circa **due o tre ondate di guadagno** e ne richiede
altrettante: paga bene senza scavalcare la progressione. Le taglie sono **personali**: in co-op ognuno ha
la sua.

La taglia accettata resta **visibile in partita**, in alto a sinistra, con la barra di avanzamento — una
taglia senza scadenza che non si vede mentre giochi è una taglia che si dimentica.

#### 🏘️ Villaggio
Restano chiusi solo **Cartomante** e **Ostessa**.

#### ✅ Verificato
**809 test, 0 falliti.** Fra gli altri: il magazzino che parte con l'equipaggiamento iniziale, il
riequipaggiamento a costo zero, la rivendita a metà esatta, il rifiuto di vendere ciò che si ha addosso o
ciò che è di partenza, il banco che non risponde da lontano, le tre offerte tutte di tipo diverso che **non
si rigenerano**, la taglia unica, **ognuno dei sei tipi portato a compimento** con la paga dichiarata, il
contratto mirato che ignora la specie sbagliata, la combo contata come **record** e non come somma, gli
agganci veri (uccidere, aprire una cassa, perdere una vita) verificati sul gioco e non sul contatore, e un
controllo che nessun tipo del catalogo resti senza qualcuno che lo incrementa in `Room.js`. Più 21
controlli sull'interfaccia con DOM finto.

---

### [1.71.0] — 2026-08-29 · "L'Erborista apre bottega"

Il villaggio aveva cinque banchetti e un solo mestiere che vendeva davvero. Apre il secondo: **l'Erborista**,
e con lui l'unica cosa del gioco che si **consuma**.

#### 🧪 La cintura: tre slot, tre tasti
Tre slot, tasti **1 2 3**, massimo **3 cariche** per slot. Si beve all'istante mentre corri e spari: nessun
menù da aprire, nessuna finestra, nessuna animazione che ti blocca. `Q` ed `E` restano liberi per le
abilità di classe che arriveranno.

Il tipo di pozione di ogni slot **lo scegli tu** all'Erborista, ed è lì la strategia: con 3 slot su 6
pozioni ti porti dietro una decisione, non un magazzino. **Un tipo per slot** — niente cintura di sole cure.

#### 🌿 Il catalogo

| | Effetto | Durata | Costo a carica |
|---|---|---|---:|
| ❤️ Cura | ripristina il 40% dei PV massimi | istantanea | 45 |
| 🪨 Pelle di Pietra | −50% danni subiti | 5 s | 40 |
| 💨 Fretta | +45% velocità | 6 s | 30 |
| ⚔️ Furia | +50% danno | 6 s | 35 |
| ⚡ Frenesia | +60% cadenza | 5 s | 35 |
| ➕ Rigenerazione | 10 PV/s | 8 s | 40 |

#### 📊 Le statistiche contano, una per aspetto
Nessuna sovrapposizione, così ogni classe usa le stesse boccette in modo diverso senza bisogno di cataloghi
separati per eroe:

| Statistica | Cosa cambia | Al livello 12 |
|---|---|---|
| **Costituzione** | quanto curano | Cura dal 40% al **64%** dei PV |
| **Intelligenza** | quanto durano | Furia da 6 a **8,9 s** |
| **Forza** | quanto picchiano Furia e Frenesia | +50% → **+68%** danno |
| **Destrezza** | quanto in fretta ribevi | cooldown da 6 a **3,84 s** |

#### 🚦 I due freni
Un **cooldown globale** di 6 s **condiviso dai tre slot** (non uno per slot, altrimenti basterebbe alternarli
per berne tre di fila), e **nessun cumulo**: la seconda Furia fa ripartire il timer, non raddoppia il danno.

#### 💰 Le regole del banco
- **Le cariche si comprano, non si ricaricano**: finite quelle, l'ondata la fai a secco.
- **Cambiare il tipo di uno slot rimborsa metà** delle cariche rimaste: cambiare idea costa, ma non azzera.
- **Le cariche sopravvivono alla morte**: quello che hai comprato è tuo finché non lo bevi.

#### 🏘️ Villaggio
- L'**Erborista** non è più una bottega chiusa. Restano chiusi Cartomante, Banditore e Ostessa.
- Il quarto banchetto si chiamava **Rigattiere** nel codice e **Banditore** nei documenti: ora è Banditore
  ovunque, che è anche il mestiere che il disegno rappresenta.

#### 🔊 e 🎨
Suono della bevuta (un tonfo sordo e due note che salgono), alone del colore della pozione attorno al
personaggio, e per la Cura il numero di PV recuperati — che dipende dalla Costituzione e quindi va visto.

#### ✅ Verificato
**755 test, 0 falliti.** Fra gli altri: il tetto di 3 cariche, il rifiuto del doppione, il rimborso a metà
esatto, il cooldown che blocca anche gli **altri** slot, la durata che riparte invece di raddoppiare, le
cariche che restano dopo aver perso una vita, i quattro moltiplicatori misurati fino al **valore effettivo**
(danno, cadenza, velocità, cura, durata, cooldown), e un controllo che nessuna chiave di buff del catalogo
resti senza qualcuno che la legge in `Room.js` — un buff che nessuno legge non farebbe nulla e nessun test
se ne accorgerebbe. Più 27 controlli sull'interfaccia con DOM finto.

---

### [1.70.0] — 2026-08-29 · "Più morbido all'inizio, senza tetto alla fine"

Quattro correzioni chieste dopo aver provato la 1.69.

#### 🔢 Il numero dei nemici ora è progressivo
Il tetto dei vivi era **fisso a 30** e, unito al rifornimento rapido della 1.68, riempiva l'arena di 30
nemici **già alla terza ondata** — misurato — anche se l'ondata ne prevedeva 10. Il tetto era diventato il
numero, invece di essere un limite. Ora è una **curva**:

| Ondata | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Vivi al massimo | 8 | 10 | 12 | 14 | 16 | 18 | 21 | 23 | 26 | **30** |

Misurato dopo la modifica, il picco reale di nemici in campo segue la curva senza mai superarla: 7 alla
prima, **12 alla terza**, 18 alla sesta, 30 solo dall'undicesima.

Nel farlo è saltato fuori che la modalità **Sopravvivenza** rifornit fino a un **14 scritto a mano** che
scavalcava il tetto: all'ondata 2 (tetto 10) si arrivava davvero a 14 vivi. Ora passa dalla stessa porta
di tutti gli altri.

#### 🎚️ Niente più tetto ai livelli
Il cap al livello 20 coincideva con la fine della partita: gli ultimi livelli si prendevano sui titoli di
coda invece di giocarli. **Il tetto non esiste più**: si sale finché si accumula esperienza, la curva
(`107 · L^1,54`) continua all'infinito e i costi si calcolano man mano. `MAX_LEVEL` non esiste più nel
codice, e la conversione dell'XP in monete oltre il cap è sparita con lui (non c'è più un cap da superare).

#### ✦ L'esperienza arriva da più fonti
Non solo dai nemici uccisi. Ora anche:

| Fonte | XP |
|---|---|
| **Cassa aperta** | 45 + 9 per ondata |
| **Potenziamento raccolto** sulla mappa | 30 + 6 per ondata |

I valori stanno in `shared/constants.js`, in chiaro: aggiungere una fonte è una riga. Il termine per ondata
tiene il passo con l'XP dei mostri, che cresce anche lei. Ogni raccolta manda al client quanta esperienza
ha dato e da dove, e la si vede salire sopra il personaggio.

Misurato dopo il cambio: una run completa porta ora al **livello 30** invece del 20, con le tappe a
Lv.10 all'ondata 9, Lv.20 alla 15, Lv.30 alla 19.

#### 🔔 LEVEL UP sopra la testa, con jingle
Salire di livello non aspetta più il pannello di fine ondata: la scritta **LEVEL UP** compare sopra la
testa del personaggio con sotto il numero del livello, resta agganciata a lui mentre si muove e combatte,
sale piano e svanisce in 1,6 secondi. La vedono anche i compagni. A chi sale parte un **jingle** dedicato:
un arpeggio maggiore do-mi-sol-do con la fondamentale tenuta sotto — una frase, non un effetto.

#### 🃏 Via le carte di rango
Le 27 carte generiche introdotte in v1.69 sono state rimosse: al loro posto arriveranno le **abilità di
classe**, sbloccate a livelli specifici come in un gioco di ruolo. Il **rango resta** (titolo nuovo e punto
in più a ogni scatto) e il contenitore è già pronto: `cardsFor()` risponde vuoto, quindi l'offerta
semplicemente non parte — quando le abilità arriveranno basta riempire la tabella, senza toccare il resto.
Il **bivio del rango V** (Paladino / Maestro d'Armi e i suoi gemelli) resta com'era.

#### 🧪 Test
- **692 passati, 0 falliti**, più 45 controlli sull'interfaccia.
- Il test nuovo verifica la curva del tetto ondata per ondata, che alla terza non si superino i 12 vivi in
  una partita vera, che l'esperienza arrivi davvero da casse e oggetti, e che l'annuncio del livello parta
  anche in mezzo al combattimento — uno per ogni livello salito, anche saltandone più in un colpo.
- La monotonia della curva XP è ora garantita a mano e non lasciata all'arrotondamento: verificato che
  nessun livello, fino al 500°, costi quanto il precedente.

### [1.69.0] — 2026-08-29 · "Guerriero, Guerriero Esperto, Veterano…"

Fino alla 1.68 la XP era una **valuta**: la raccoglievi e la spendevi al negozio di fine ondata. Da questa
versione la XP e' una **barra**: sale, ti fa salire di livello, e a ogni livello ti da' un punto da spendere.
E' la differenza fra comprare un potenziamento e diventare qualcosa. Il progetto completo, con le misure da
cui escono tutti i numeri, sta in **`PROGRESSIONE.md`**.

#### 🎚️ Venti livelli, uno per ondata
Il cap e' **20** perche' la run finisce all'ondata 20: la crescita del personaggio e quella del dungeon sono
la stessa curva, e non ci si ferma mai a "livellare". La curva (`107 · L^1,54`) e' tarata sull'XP **misurata**:
il cap chiede **10.670 XP** contro gli ~11.000 che rende una run intera. Chi arriva in fondo arriva al cap;
chi gioca bene, con le combo, ci arriva due o tre ondate prima.

Misurato dopo il cambio, con un giocatore tenuto in vita per misurare l'ondata e non il bot:

| | livello 5 | livello 10 | livello 15 | livello 20 |
|---|---|---|---|---|
| Guerriero | ondata 5 | ondata 9 | ondata 14 | ondata 18 |
| Ladro | ondata 5 | ondata 9 | ondata 14 | ondata 15 |

**Oltre il cap** la XP si converte in monete (8 XP = 1 moneta): le uccisioni dell'ultima ondata continuano a
valere qualcosa, e finiscono nell'unica cosa che a quel punto serve ancora, l'equipaggiamento.

#### ★ Cinque ranghi, uno ogni cinque livelli
Cadono **sui boss**, cosi' il rango arriva sempre in un momento che il giocatore ricorda.

| Rango | Liv. | 🛡️ Guerriero | 🔮 Mago | 🏹 Ladro |
|---|---:|---|---|---|
| I | 1 | Guerriero | Apprendista | Ladro |
| II | 5 | Guerriero Esperto | Mago Giovane | Furfante |
| III | 10 | Veterano | Mago | Predone |
| IV | 15 | Campione | Mago Anziano | Ombra |
| V | 20 | **Paladino** / **Maestro d'Armi** | **Arcimago** / **Stregone** | **Assassino** / **Cacciatore di Teste** |

Ogni rango da' **un punto in piu'** e **una carta a scelta fra tre** — potenziamenti *di classe*, non
generici: e' la differenza con i boon, che restano quelli di sempre. Sono **27 carte** in tutto (3 classi ×
3 ranghi × 3), tutte implementate: Parata, Sfondamento, Colpo Rotante, Sprone, Esecuzione, Muro, Furia
Crescente per il guerriero; Bolla Densa, Eco Arcana, Frattura, Scudo di Mana, Runa Vagante, Detonazione,
Passo del Vuoto, Convergenza per il mago; Doppia Cocca, Passo Felpato, Punta Avvelenata, Tiro Rapido,
Frecce Pesanti, Ombra, Colpo alle Spalle, Pioggia, Elusione per il ladro.

Le combinazioni per classe sono 3 × 3 × 3 × 2 = **54**: due run non si somigliano.

#### ⚔️ Il bivio del rango V
Al livello 20 non arrivano tre carte ma **due strade**, e non sono lo stesso personaggio piu' forte. In ogni
coppia una rende **subito** e una rende **di piu' ma chiede qualcosa** — una squadra, un bersaglio grosso,
il posizionamento:

- **Paladino** (aura che cura i compagni e taglia il 18% dei danni, a te e a loro) / **Maestro d'Armi**
  (+35% cadenza del fendente, +20% apertura dell'arco, rinculo ×1,5)
- **Arcimago** (ogni bolla esplode) / **Stregone** (la bolla rimbalza su 3 nemici a danno pieno)
- **Assassino** (critico al 35%, ×3, colpi alle spalle sempre critici) / **Cacciatore di Teste** (ogni tiro
  e' un ventaglio di 3 frecce che perforano 3 nemici)

**E' l'unico rango che si vede addosso**: cerchio dell'aura del Paladino (tratteggiato, col raggio vero),
cresta rossa e lama di luce del Maestro d'Armi, rune dorate dell'Arcimago, nucleo rosso dello Stregone,
scia scura e pugnale dell'Assassino, seconda faretra del Cacciatore. I primi quattro ranghi cambiano solo il
nome sotto la barra della vita: il lavoro grafico va dove c'e' una scelta da riconoscere.

#### 💠 I punti: 23 in una run, 22 per una statistica al tetto
Un punto per livello (19) piu' uno per rango (4). Il costo di una statistica cresce a scaglioni — **1 punto**
fino al 4° livello, **2** fino al 10°, **3** per gli ultimi due — quindi portarne una al tetto costa **22
punti su 23**. E' la regola della v1.66 ("con l'XP di una run si cappa una sola statistica") tradotta da
valuta a punti, e questa volta si legge a colpo d'occhio invece di stare nascosta in una tabella di costi a
sei cifre. Le tre strade che 23 punti permettono davvero: una statistica a 12; una a 8 e una a 7; tre a 5 e
una a 4.

Il pannello di fine ondata non dice piu' "hai 4.435 XP" ma **"Livello 7 · Veterano — hai 3 punti"**.

#### 🃏 Una scelta alla volta
Se c'e' una carta di rango in attesa, il **boon salta quel giro**. Siccome i ranghi cadono sui boss, in
pratica alle ondate 5/10/15/20 si sceglie la carta di classe e nelle altre il boon generico: mai due mazzi
aperti nello stesso istante.

#### 🐛 Il tetto dei nemici era ancora un auspicio
Cercando altro e' saltata fuori una falla della v1.68: il tetto dei vivi contava `monsters.length`, che
comprende i **morti non ancora filtrati**, e soprattutto la **scissione** della Melma controllava solo che
ci fosse *un* posto libero prima di generarne *due*. Con 29 in campo si finiva a 31. Ora tutte le porte
(ondata, evocazioni, scissione, mimic delle casse) passano da `_postiLiberi()`, che conta i vivi e dice
quanti ne stanno ancora: "mai piu' di 30" e' tornata una promessa.

#### 🧪 Test
- **710 passati, 0 falliti** (+76), piu' 48 controlli sull'interfaccia.
- Il test dei livelli verifica la curva, i punti (23 in una run, 22 per il tetto), i ranghi che cadono ogni
  5 livelli, le 27 carte complete e della loro classe, e i casi cattivi: una carta di un'altra classe non si
  prende, la stessa carta non si prende due volte, saltare piu' livelli in un colpo non perde ne' punti ne'
  ranghi, al rango V arriva il bivio e non le carte.
- Bilanciamento rimisurato: ondata media 3/4/4 per guerriero/mago/ladro, **identica alla v1.68**. Il
  passaggio da negozio-a-XP a punti non ha reso il gioco ne' piu' facile ne' piu' difficile.

#### ➖ Cosa NON c'e' ancora
Le **abilita' attive** delle specializzazioni (Giuramento, Turbine, Meteora, Catena Nera, Marchio, Salva)
sono descritte nel pannello ma non ancora giocabili: arrivano con la barra delle abilita', insieme al
ritorno dei tasti Q/E. Di ogni specializzazione e' implementato il **passivo**, che e' la parte che cambia
davvero come si combatte.

### [1.68.0] — 2026-08-28 · "Trenta in campo, il resto in coda"

Prima di toccare qualsiasi cosa ho **profilato server e client separatamente**, come nella 1.64, per non
ottimizzare a sensazione.

#### 📊 Dove sta davvero il costo (misurato)
| | 30 mostri | 50 mostri | 80 mostri |
|---|---:|---:|---:|
| **Tick del server** (budget 33,3 ms) | 0,31 ms | 0,33 ms | 0,38 ms |
| **Snapshot** per giocatore | 4,5 KB | 6,5 KB | 10,1 KB |
| **Banda in uscita** (6 giocatori, 20 Hz) | 554 KB/s | 834 KB/s | 1,3 MB/s |

**La CPU del server non e' un problema e non lo e' mai stata**: usa l'1% del tempo che ha a disposizione,
anche con 80 mostri e 4 giocatori. Il costo vero e' la **banda**, e i mostri sono il **90%** dello snapshot.

#### 🔢 Tetto a 30 vivi, il resto in coda
`C.MAX_ALIVE` scende da 50 a 30. L'ondata **non perde nessuno**: i nemici in eccesso restano in coda ed
entrano man mano che si fa posto (alla 20ª ondata in sei l'ondata ne prevede 86, e tutti e 86 arrivano).

Perche' il tetto non si traducesse in ondate piu' lente, il rifornimento ha **due velocita'**:
- mentre l'arena si riempie **la prima volta**, il ritmo di sempre (0,25-0,6 s fra un ingresso e l'altro):
  e' la salita che da' il senso dell'ondata che monta;
- quando l'arena e' **gia' stata piena** e si aprono dei buchi, il rimpiazzo e' quasi immediato
  (0,10-0,22 s). Uccidi, ne entra un altro.

#### 📉 Snapshot magro: −52% di traffico a parita' di nemici
Ogni mostro pesava **120 byte, 20 volte al secondo**, ma due terzi di quei byte **non cambiavano mai** dopo
la comparsa: il tipo, i PV massimi, i flag elite/boss/mega/tesoro. Ora la parte immutabile viaggia **una
volta sola**, nel primo snapshot in cui il mostro compare, e il client se la tiene. Stessa cosa per nome ed
eroe dei giocatori. In piu', **i flag che valgono 0 non si mandano affatto**: "assente" e "0" sono la stessa
cosa, e il client li rimette a 0. Un record di mostro passa da **120 a 46 byte** in regime.

| a parita' di nemici in campo | prima | ora |
|---|---:|---:|
| 30 mostri, 1 giocatore | 80 KB/s | **37 KB/s** |
| 30 mostri, 6 giocatori | 554 KB/s | **295 KB/s** |
| 50 mostri, 6 giocatori | 834 KB/s | **402 KB/s** |

Sommando le due cose — tetto a 30 **e** snapshot magro — una partita in sei passa da **834 KB/s a 295 KB/s
in uscita: −65%**.

Chi **entra adesso** non ha ancora nessuna cache, quindi riceve uno snapshot **pieno**: una serializzazione
in piu', e solo nel tick in cui qualcuno si collega. `snapshot()` senza argomenti resta completo di
proposito — un chiamante distratto (o un test) deve ottenere un oggetto autosufficiente, non record monchi.

#### 🧪 Test
- **634 passati, 0 falliti** (+24).
- Il controllo che conta su una modifica del genere e' **il giro completo**: `test/client.js` prende una
  stanza vera, le chiede la sequenza di snapshot magri che manderebbe in rete, la passa alla ricostruzione
  di `net.js` e confronta **campo per campo** con lo snapshot pieno dello stesso istante. Verifica anche che
  un mostro comparso dopo venga presentato, che la cache lasci andare i morti, e che un flag acceso in un
  frame **torni a 0** nel successivo invece di restare acceso.
- Lato server: il tetto regge (picco mai oltre 30), coda e contatore restano allineati (nessuno perso),
  e dopo le uccisioni la coda ricomincia davvero a versare.

#### 📝 Nota su cio' che NON e' stato fatto
Restano sul tavolo due interventi piu' invasivi, misurati ma non applicati: **non mandare a ogni giocatore
i mostri lontani da lui** (−50-70% con sei giocatori, ma la minimappa smetterebbe di vedere i nemici
lontani) e **abbassare la frequenza degli snapshot da 20 a 15 Hz** (−25% gratis, il client gia' interpola).
Vanno decisi quando la banda tornera' a essere un problema, non prima.

### [1.67.0] — 2026-08-28 · "Il fabbro vende oggetti, non livelli"

L'Emporio erano **tre barre da riempire** — Armatura, Stivali, Arma, cinque livelli l'una, uguali per tutti e
tre gli eroi. Una barra da riempire e' una decisione sola: *ho abbastanza monete?* Da questa versione il
fabbro vende **oggetti con un nome**, e la decisione diventa un'altra: *mi serve la portata dell'alabarda o
la cadenza dello spadone?*

#### 🔨 Un catalogo per classe
Ogni classe vede **solo la propria roba**, e ha **i suoi slot**: il guerriero lo scudo, il ladro le calzature,
il mago nessuno dei due. Il filtro sta sul server — cio' che non e' della tua classe non attraversa la rete.

| | 🛡️ Guerriero | 🔮 Mago | 🏹 Ladro |
|---|---|---|---|
| **Arma** | Spada · Spadone 🪙230 · Alabarda 🪙470 | Bacchetta di Frassino · Scettro Runico 🪙240 · Bastone del Vuoto 🪙500 | Arco Corto · Arco Lungo 🪙300 |
| **Armatura** | Maglia di Ferro · Armatura a Piastre 🪙250 | Veste da Apprendista · Manto dell'Arcanista 🪙270 | Giaco di Pelle · Corazza di Cuoio 🪙240 |
| **Scudo** | Scudo · Scudo a Torre 🪙290 | — | — |
| **Calzature** | — | — | Scarpe di Corda · Stivali del Passo Lieve 🪙260 |

Il **rango 1 costa 0 ed e' quello che hai gia' addosso alla partenza**: non e' un oggetto vuoto, e' il metro
con cui si leggono gli altri. Nel pannello e' marcato **DI BASE**, non "🪙 0", che farebbe sembrare un affare
cio' che possiedi gia'.

Le tre armi del guerriero non sono la stessa arma piu' grande: **piu' e' lunga, piu' l'arco e' stretto**.
L'alabarda arriva a 152px ma copre 71°, lo spadone 122px per 94°, la spada 100px per 109°. Si sceglie fra
tenere lontano e coprire i fianchi. Le tre bacchette hanno invece **la stessa cadenza**: quella e' la firma
del mago e la alza l'Intelligenza, non il portafoglio — le bacchette migliori danno danno, velocita' e
grandezza della bolla, cioe' *quante ne vanno a segno*, che su un proiettile lento conta quanto il danno.

#### 🔁 Il cambio e' libero
Si compra qualunque oggetto dello slot in qualunque momento, a prezzo pieno, e il vecchio viene rimpiazzato.
Anche all'indietro: se l'alabarda non ti piace, torni allo spadone. Per questo i bonus **non si sommano man
mano**: il server li **ricalcola da zero** a ogni cambio, altrimenti il bonus del pezzo tolto resterebbe
attaccato al personaggio per sempre. C'e' un test apposta che compra, torna indietro e verifica che la
velocita' sia esattamente quella di prima.

#### 👁️ Cio' che si compra si vede
- **Scudo a torre**: arco piu' ampio, lamiera piu' spessa, seconda nervatura. E' l'unico pezzo d'armatura che
  cambia la sagoma vista dall'alto, quindi vale la pena disegnarlo diverso.
- **Arco lungo**: sporge davanti e dietro la sagoma, con la curva piu' profonda e il legno piu' chiaro.
- **Bacchette**: l'orbe cresce e cambia colore (viola per lo Scettro, ciano chiaro per il Bastone), e la
  **bolla che spara** e' quella dell'arma — raggio, velocita' e colore.
- **Fendente**: l'arco disegnato e' sempre *esattamente* l'area che ferisce, quindi cambiando arma si vede
  subito quanto arriva.

Armature, vesti e calzature restano invisibili per ora: da sopra, a questa scala, non si leggerebbero.

#### 💰 Prezzi tarati sull'economia vera
Misurata: **65-70 monete a ondata**, e il Mercato apre ogni 3 ondate. Al primo mercato si hanno ~200 monete
(un oggetto di rango 2), al secondo ~400 (un rango 3, oppure due rango 2). Nessun oggetto e' fuori portata,
nessuno e' regalato.

#### 🧪 Test
- **609 passati, 0 falliti** (+111): il catalogo e' verificato a tappeto — ogni oggetto sta in uno slot che la
  sua classe possiede, ogni rango superiore **costa di piu' E vale di piu'** (danni al secondo per le armi,
  somma pesata dei bonus per il resto), e nessuna classe puo' comprare la roba di un'altra.
- Nuovi controlli anche sul pannello del fabbro (`test/client.js`): il guerriero vede tre slot, il mago due,
  l'oggetto indosso e' marcato IN USO e non si ricompra, e il clic manda **l'id dell'oggetto**, non lo slot.
- Bilanciamento rimisurato: a parita' di tutto il resto, il guerriero passa da 35 uccisioni per partita con la
  spada a 38 con lo spadone e **46 con l'alabarda**, e sopravvive 95s invece di 73s. La scala funziona.

#### ➖ Rimosso
`Loot.GEAR`, `GEAR_BY_SLOT`, `gearCost`, `GEAR_RANK`, `GEAR_RARITY`: erano una scala di numeri uguale per
tutti. Con loro non serve piu' nessuna delle icone in `public/assets/gear/` (le carte ora portano il NOME
dell'oggetto e le sue statistiche, che e' cio' che si legge): i file sono ancora sul disco e si possono
cancellare a mano. Il catalogo vive in **`shared/gear.js`**, e aggiungere un oggetto e' una
riga sola — negozio, HUD, ricalcolo dei bonus e test lo pescano tutti da li'.

### [1.66.0] — 2026-08-28 · "Guerriero, Mago, Ladro"

Il gioco e' un dungeon con troll, lich e beholder, e i tre protagonisti erano un poliziotto cibernetico, un
sergente col fucile d'assalto e un hacker. **ENFORCER-7, SGT. VIPER e NULL sono stati sostituiti da GUERRIERO,
MAGO e LADRO**, e con loro e' cambiato tutto cio' che li riguardava: come attaccano, come crescono, cosa
comprano. E' la versione piu' invasiva dalla 1.51.

#### 🦸 Tre classi, tre modi di colpire
| | Arma | Come colpisce | Danno/s | PV |
|---|---|---|---:|---:|
| 🛡️ **GUERRIERO** | Spada | **semicerchio** davanti a se, 100px / 109° | 99 sul piu' vicino | 200 |
| 🔮 **MAGO** | Bolla di Energia | proiettile lento (430 px/s) e grosso | 96 | 100 |
| 🏹 **LADRO** | Arco | freccia veloce (900 px/s) che perfora 1 nemico | 93 | 112 |

Il **fendente** non e' un proiettile: colpisce chi sta nel settore davanti al personaggio. **Raggio e apertura
vengono dall'arma, non dall'eroe** — la spada corta fara' 74px/131°, l'alabarda 144px/71°: *piu' lunga = piu'
stretta*, che e' cio' che le rende diverse invece che solo piu' grandi. Il client disegna **esattamente** l'arco
che ferisce, quindi la portata si impara guardando.

Il fendente e' ad area ma **non illimitata**: il bersaglio piu' vicino incassa tutto, gli altri il 55%, e non
piu' di 5 per colpo. Senza questo tetto, misurato, il guerriero faceva **300-640 uccisioni** per partita contro
le ~50 dei due tiratori: le ondate avanzavano al doppio della velocita' e la squadra si autodistruggeva.

Il **mago** parte volutamente lento (1,5 colpi/s contro i 6,5-9,5/s dei vecchi fucilieri): e' l'Intelligenza a
fargli salire cadenza *e* danno. I PV del guerriero sono a 200 perche' e' l'unico che non puo' tenere le
distanze: a 150 moriva sistematicamente un'ondata prima degli altri due, e non per mancanza di danno (alzarlo
non cambiava niente) ma per il tempo passato a contatto.

#### 📊 Quattro statistiche da gioco di ruolo (al posto di sei da sparatutto)
Vitalita'/Potenza/Cadenza/Abilita'/Agilita'/Precisione sono sostituite da **FORZA, COSTITUZIONE, INTELLIGENZA,
DESTREZZA**, da 1 a **12** (prima 8).

| Statistica | Per livello |
|---|---|
| 💪 **Forza** | +9% danno in mischia, +3% rinculo |
| ❤️ **Costituzione** | +20 PV massimi, −1,2% danni subiti |
| 🔮 **Intelligenza** | +9% danno magico, **+7% cadenza delle magie** |
| 🏹 **Destrezza** | +8% danno dei dardi, +6% cadenza, **+2,5% velocita'** |

Il meccanismo che le lega agli attacchi e' la **scuola dell'arma** (`weapon.school`: `melee`, `magic`,
`ranged`). Ogni statistica alza danno e cadenza *della sua scuola*, non un danno generico. **Chiunque puo'
comprare qualunque statistica**: un guerriero che compra Intelligenza non guadagna niente sulla spada, ma
guadagnera' tutto sulla prima magia che gli si mette in mano — che e' esattamente cio' che serve alle classi
miste previste nella progressione dopo il boss.

**Curva rifatta su una regola sola**: con l'XP di **una run intera** (nell'ordine dei 18.000, misurato su
partita vera) si deve poter cappare **esattamente una** statistica.

| livello | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| costo | 60 | 100 | 160 | 250 | 380 | 560 | 820 | 1200 | 1750 | 2600 | 4000 | 6100 |
| salto | — | +67% | +60% | +56% | +52% | +47% | +46% | +46% | +46% | +49% | +54% | +53% |

Totale per una statistica al tetto: **17.980 XP**. Tutte e quattro: 71.920, cioe' quattro run pulite. Il
**gradino piatto** della vecchia tabella (il 7° livello costava solo il 13% piu' del 6°) e' sparito: la
crescita non scende mai sotto il +46%, quindi ogni livello e' sempre una rinuncia sentita.

#### ➖ Cosa e' stato tolto (per ora)
- **Abilita' Q ed E**: erano cucite sui tre eroi eliminati (torretta, granata, colpo del cecchino,
  bullet-time, rift). Vanno ripensate sulle nuove classi, dove i poteri arriveranno dall'**evoluzione dopo il
  boss** e non da uno slot fisso. Lo **scatto** (tasto destro) resta.
- **Armi a terra**: non si raccolgono piu' dalla mappa e non escono piu' dalle casse. Saranno solo da negozio.
- **Acquisto delle armi**: sospeso (via la Cassa Armi dal mercante) finche' l'arsenale non viene ripensato
  attorno alle tre scuole.

#### 🎨 Grafica
I tre eroi sono disegnati **dall'alto**, riusando l'impalcatura del vecchio `_hero` (stivali, braccia come
tratti, torso arrotondato, testa a `r*0.5`) — e' quella che si legge alla scala di gioco. Il **mago** ha il
mantello ampio con l'orlo mosso e il cappuccio a punta, bastone e orbe; il **guerriero** ha armatura abbozzata
(pochi solchi, non dettagli), spallacci scuri, elmo chiaro con feritoia e **scudo ad arco " ) "** davanti; il
**ladro** ha cappuccio, mantellina, faretra e **arco " ) " di lato** — di fronte sarebbe uno scudo. Nessuno dei
tre ha occhi disegnati: sotto la feritoia e dentro il cappuccio c'e' solo ombra.

Nuovi disegni anche per i proiettili: **bolla** translucida con membrana pulsante e riflesso, **freccia** con
asta, punta e impennaggio orientati sulla traiettoria. Il **fendente** e' un settore che si apre in 70ms, in
oro (bianco sui critici). Un timbro audio per scuola: colpo sordo, tono basso e morbido, schiocco secco.

#### 🐛 Due bug trovati dai test, non dal codice
- Il fendente usava `m.r` per il raggio del mostro, che **non esiste** (e' `m.radius`). In JavaScript non da'
  errore: `d > rad + undefined` e `diff > half + NaN` sono entrambi `false`, quindi il colpo **prendeva tutti i
  mostri della mappa, anche alle spalle**. Se n'e' accorto il test del bersaglio dietro le spalle.
- Il raggio dichiarato dall'arma (`weapon.r`) veniva ignorato: la bolla del mago, che deve essere grossa
  proprio perche' e' lenta, volava larga come un proiettile qualunque.

#### 🧪 Test
- **499 passati, 0 falliti** (+31 nuovi) + suite client aggiornata al tetto di 12 livelli.
- Il **bot** dei test e' stato istruito a giocare in mischia: prima indietreggiava sotto i 160px, quindi con
  un'arma da 100px non arrivava mai a contatto e "moriva disarmato". Ora tiene la distanza della *sua* arma,
  si stacca mentre l'arma e' in ricarica e si sgancia sotto il 40% dei PV. Senza questa correzione il dato
  diceva "la classe e' fragile" quando diceva "il bot non sa giocarla".
- Bilanciamento verificato **contro la versione precedente**, con lo stesso bot: in trio le nuove classi
  arrivano alle ondate 3-7 contro le 5-7 delle vecchie, in singolo restano entro un'ondata.

### [1.65.0] — 2026-08-27 · "Il fascio della Faglia"

I tentacoli della 1.64 erano troppo timidi: si vedevano appena, e un avviso che non si vede non e' un avviso.
Rifatto l'effetto con il **linguaggio visivo del fascio dello sguardo del Beholder**, che nel gioco funziona.

#### 🔮 Cosa cambia
- **Ventaglio pieno** che si apre dal punto della roccia piu' vicino a te, con gradiente forte alla radice —
  come il fascio del Beholder, non piu' quattro tratti sottili.
- **I filamenti ARRIVANO addosso al giocatore** invece di allungarsi a caso nel vuoto. E' la differenza che
  conta: la linea collega **causa ed effetto**, quindi si capisce a colpo d'occhio che e' *quel muro* a farti
  male, non "l'aria".
- **Nucleo pulsante ad alta frequenza** lungo l'asse (stesso trucco della linea centrale dello sguardo).
- **Bagliore alla radice**: la ferita nella roccia da cui esce tutto.
- In un **angolo** partono due fasci, uno per lato — coerente col fatto che li' la faglia morde il doppio.
- **Buco nel buio** alla radice: il bordo mappa e' la zona piu' buia, e senza aprire la nebbia proprio li'
  l'effetto restava invisibile esattamente dove serviva vederlo.

#### ⚡ Costo
Zero regressioni sulle prestazioni della 1.64: i gradienti del ventaglio e del bagliore sono **in cache**
(chiave sulla lunghezza arrotondata a 40px), e il fascio si disegna solo quando sei nei paraggi del bordo.
La guardia di prestazione in `test/client.js` misura **114 gradienti per frame** con 60 nemici, invariata.

#### 🧪 Test
- **475 passati, 0 falliti** + suite client invariata.

### [1.64.0] — 2026-08-27 · "Prestazioni: il singhiozzo era il garbage collector"

Il gioco scattava con molti nemici. Prima di toccare una riga ho profilato **server e client separatamente**.

#### 🔍 Il server non c'entrava niente
300 tick misurati per configurazione, budget di un tick = 33,3 ms:

| mostri | giocatori | `update` medio | % del budget |
|---:|---:|---:|---:|
| 60 | 1 | 0,35 ms | 1,1% |
| 100 | 4 | 0,52 ms | 1,5% |
| 150 | 6 | 0,75 ms | 2,3% |

#### 🔍 E il client non era *lento*: **singhiozzava**

| mostri | mediana | p95 | p99 | massimo |
|---:|---:|---:|---:|---:|
| 10 | 2,8 ms | 4,5 | 5,2 | 9,4 ms |
| 50 | 4,8 ms | 6,2 | 13,0 | 29,5 ms |
| 80 | 6,5 ms | 9,1 | 13,4 | **39,7 ms** |

Il frame peggiore era **6 volte** la mediana. Una mediana ottima con code lunghissime ha quasi sempre una
causa sola, e infatti: **558 gradienti creati a OGNI frame** con 80 nemici — **33.494 al secondo** — quasi
tutti identici a quelli del frame precedente. Non era il disegno, era il garbage collector.

#### ✅ 1. Cache dei gradienti
Un `CanvasGradient` e' un oggetto riusabile e le sue coordinate stanno nello **spazio utente**: basta
costruirlo attorno all'origine e disegnarlo col contesto gia' traslato sull'entita'. Quello che cambia a ogni
frame (il pulsare) si ottiene con `globalAlpha`, che non alloca. Applicato all'alone dei mostri, alla
funzione `light()` dell'illuminazione e agli aloni del buio.

**Risultato: da 558 a 184 gradienti per frame (−67%). Frame peggiore da 39,7 ms a 18,5 ms.**

#### ✅ 2. Il Nugolo di Pipistrelli era il nemico piu' caro del gioco
Misurato per singolo nemico per frame: **116 µs**, tre volte lo scheletro e quindici volte la melma. Colpa
mia (v1.61): 9 sagome × (2 gradienti lineari + una ventina di operazioni di path) = **18 gradienti e ~180
operazioni per nugolo, 60 volte al secondo**. Ma il battito d'ali e' una sinusoide, cioe' ha un numero finito
di pose: ora le 12 pose si disegnano **una volta sola** su canvas piccole (`_batFrames`) e a schermo si fa
`drawImage`, che e' una copia di pixel.

**Risultato: da 116 µs a 30,8 µs (−73%).** Da nemico piu' caro a meta' classifica.

| nemico | prima | dopo |
|---|---:|---:|
| Nugolo di Pipistrelli | 116 µs | **31 µs** |
| Zombie Putrido | 39 µs | 41 µs |
| Negromante | 28 µs | 30 µs |
| Melma | 7 µs | 7 µs |

#### ✅ 3. Scarto fuori inquadratura
Mostri e proiettili venivano disegnati **tutti**, anche fuori schermo: la canvas li ritagliava, ma il costo di
costruire i tracciati era gia' stato pagato. L'illuminazione lo faceva gia', il disegno no. **11-15% del frame.**

#### 🔢 4. Tetto di 50 nemici vivi
Non riduce l'ondata: la **ritma**. I nemici in eccesso restano in coda ed entrano man mano che gli altri
muoiono, quindi il totale da uccidere non cambia — cambia quanti ne hai addosso insieme. Il tetto vale anche
per **evocazioni e divisioni**, altrimenti "mai piu' di 50" sarebbe un auspicio e non una promessa.

#### 🟣 La Faglia adesso si vede nel mondo, non solo sullo schermo
La vignetta della v1.63 diceva "sei in pericolo" ma non diceva **da dove**: e' un effetto di interfaccia.
Ora ci sono due cose in piu', entrambe nel mondo di gioco:
- **La fascia dipinta sulla roccia**, cotta dentro l'immagine della mappa (costo a schermo: **zero**). Quattro
  sfumature, una per lato, che partono dal bordo e sfumano verso l'interno; negli **angoli si sovrappongono**,
  quindi il viola e' piu' carico esattamente dove la faglia morde il doppio. Si vede **prima** di entrarci.
- **I tentacoli**, che escono dalla roccia del bordo **piu' vicino a te** e si allungano mentre la carica sale.
  In un angolo escono da due lati. 18 tratti, nessun gradiente, e solo quando sei nei paraggi.

Scartato il cono: il gioco usa gia' il cono per il **campo visivo del Negromante**, e riusare la stessa forma
per un significato diverso confonde.

#### 🧪 Test
- Nuovo `testV164` (server): il tetto regge su un'ondata da 6 giocatori all'ondata 18, la coda **non perde
  nessuno**, e appena si fa spazio riprende a scorrere.
- Nuovo **[CLIENT 2]** in `test/client.js`: una **guardia di prestazione** vera. Carica il renderer con un
  contesto 2D finto che **conta le allocazioni**, disegna 60 nemici e pretende meno di 240 gradienti per frame
  (misurati: **115**) e meno di 3,2 per nemico (misurati: 1,92); verifica che i fotogrammi del Nugolo siano
  precotti e che un nemico fuori inquadratura non costi **niente**. Se qualcuno rimette un `createGradient`
  dentro un ciclo per-nemico, salta fuori subito invece che tra sei mesi giocando.
- Corrette due flakiness pre-esistenti: il test della Sfera d'Ossa metteva il giocatore accanto alla sfera
  **una volta sola** mentre la sfera stava rotolando via; e il conteggio dei mostri vivi ora esclude quelli
  gia' marcati morti (la rimozione dall'array avviene al tick dopo).
- **475 passati, 0 falliti** + suite client.

### [1.63.0] — 2026-08-27 · "La Faglia ai margini"

Chiude un exploit: restare attaccati al bordo esterno della mappa rendeva il gioco molto piu' facile.

#### 📐 Prima la misura
Bot fermo, 40 secondi, 5 prove, ondata 6:

| posizione | danno subito/s | arco occupato dai nemici | nemici a contatto |
|---|---:|---:|---:|
| centro | 85,7 | 243° | 4,7 |
| bordo | 27,6 | 76° | 1,3 |
| angolo | **17,7** | **79°** | 0,7 |

**Nell'angolo si subiva 4,8 volte meno.** La causa e' tutta nella terza colonna: al centro l'arco da
difendere e' 243°, nell'angolo 79°. E non e' solo difesa — con tutti i nemici dentro un ottavo di cerchio,
sono anche tutti dentro il cono di tiro. Meno danni in entrata **e** piu' danni in uscita insieme.

#### 🟣 La Faglia
L'anello esterno della mappa (3 tessere) carica una pressione mentre ci resti:
- **2,5s di grazia** a profondita' piena, poi un drenaggio che **cresce** da 3 a 20 PV/s in 6 secondi.
- La profondita' somma i **due assi**: un **angolo** vale il doppio di un bordo dritto, quindi li' la grazia
  dura 1,25s. Il posto piu' abusato e' il piu' punito.
- **Uscire ferma il danno sul colpo.** La carica invece resta e si riassorbe al doppio della velocita' con
  cui sale: attraversare il margine di corsa non costa niente, **accamparsi** si'.
- Solo in combattimento: nella sala del **Mercato** e' spenta (quella sala e' quasi tutta margine).
- **Avvisa prima di punire**: l'alone viola comincia a chiudersi appena entri nella fascia, cioe' 2,5s prima
  del primo danno; i filamenti compaiono solo quando il drenaggio morde davvero. La fascia e' anche segnata
  sulla **minimappa**, piu' marcata negli angoli: la regola si impara guardando, non leggendo.

#### 📦 Casse e armi solo al centro
Sono l'unico richiamo periodico del gioco: se compaiono ovunque, chi si accampa sul bordo se le ritrova
servite. Confinate nella zona centrale (36% del lato), ogni ondata obbliga ad attraversare lo spazio aperto.
E' la spinta che accompagna la spinta contraria.

#### 📊 Poi la verifica
Bot che **kita** (si allontana dalla minaccia e spara), fino alla morte, 6 prove:

| modalita' | Faglia | ondata raggiunta | secondi sopravvissuti |
|---|---|---:|---:|
| libero | OFF | 3,5 | 161 |
| libero | **ON** | 4,2 | 156 |
| bordo | OFF | 2,3 | 81 |
| bordo | **ON** | **1,0** | **26** |

Il gioco normale **non e' toccato** (161 → 156 s, rumore statistico). Chi resta incollato al bordo passa da
81 a 26 secondi. E' esattamente la forma voluta: nessuna tassa su chi gioca, un muro per chi si accampa.

#### 🧪 Test
- Nuovo `testV163`: geometria del margine (centro 0, bordo 3, **angolo 6**), grazia senza danno ma con la
  carica gia' visibile, drenaggio crescente misurato su due finestre, avviso `rift_edge` emesso **una volta
  sola**, riassorbimento uscendo, attraversamento ripetuto a costo zero, faglia spenta al Mercato, `eg`
  esposto nello snapshot, casse e armi tutte dentro il raggio centrale su 120 mappe.
- Scrivere questo test ha fatto emergere tre comportamenti del motore che vale la pena avere annotati:
  svuotare i mostri **chiude l'ondata e la stanza cura i giocatori**; un mostro puo' **morire nelle pozze**
  della v1.62; e il **recupero anti-stallo** (v1.43) teletrasporta i mostri a 240px dal giocatore se per 6
  secondi il conteggio non cala — cioe' esisteva gia' un anti-campeggio, solo molto piu' rozzo.
- **468 passati, 0 falliti** (verificato su 12 esecuzioni consecutive).

### [1.62.0] — 2026-08-27 · "Il terreno conta"

Primo blocco del lavoro sulla varieta' delle mappe: tutto quello che si poteva fare **senza toccare la pianta**.
Tre delle quattro cose erano gia' scritte nel progetto e non le usava nessuno.

#### 🔥 Le pozze di pericolo esistevano da sempre e non le generava nessuno
`T_HAZARD` era implementato **da cima a fondo**: il server toglie 6 PV ogni 0.25s ai giocatori e 8 ai mostri,
il renderer scava la conca, versa il liquido, ci mette riflesso e profondita', accende una luce del colore del
tema e lo disegna sulla minimappa. `mapgen` non ne piazzava **nemmeno uno**.
- Ora ogni mappa ne ha, in quantita' decisa da `theme.hazMul` — l'altro parametro dichiarato che moltiplicava
  il nulla. Misurato: lava **~18 tessere/mappa**, ghiaccio **~7**.
- Le pozze crescono come una **passeggiata casuale**: forma organica, mai un rettangolo.
- **Regola di sicurezza:** una pozza puo' nascere solo dove il 3×3 attorno non tocca muro. Cosi' non puo' mai
  tappare un corridoio — in un passaggio da 3 tessere solo la corsia centrale e' ammessa e le due laterali
  restano libere. Si deve sempre poter **girare intorno**, mai essere costretti a incassare.
- Mai sopra il portale d'uscita, mai entro 7 tessere dalla partenza.
- Fanno danno anche ai mostri: la pozza e' un alleato, non solo una trappola.

#### 🪨 Strato ambientale (`theme.propMix`)
Terzo parametro dichiarato in tutti i temi e mai letto. Non e' un doppione delle zone tematiche: quelle sono i
**punti di interesse** (grandi, max 3-4 per tipo, raccontano una scena), questo e' la **texture** fra un punto
e l'altro — oggetti piccoli (scala 0.6-0.9) sparsi lungo le pareti. Da ~30 a **~46 oggetti per mappa**.

#### 🧭 Partenza e uscita non sono piu' due costanti
- La partenza era il **centro geometrico esatto**, l'uscita **LA** cella piu' lontana: il percorso mentale era
  identico a ogni partita. Ora la partenza e' una **radura** scelta col seed fra le piu' ampie vicine al centro
  (68 posizioni distinte su 300 mappe), e l'uscita e' una a caso fra il **20% piu' lontano** — la traversata da
  fare non cambia, ma non finisce piu' sempre nello stesso angolo.
- Cambio di significato importante: **tutte le distanze a valle** — decorazioni, bracieri, casse, punti di
  spawn dei nemici — ora si misurano **dalla partenza** e non dal centro. Prima le due cose coincidevano solo
  perche' la partenza *era* il centro.

#### 🗺️ Il nome della zona si vede
"Cripta Dimenticata", "Caverne di Lava", "Tempio Arcano", "Sala dei Mercanti": erano scritti in `THEMES[].name`
e non comparivano da nessuna parte. Ora sono una didascalia sotto la barra in alto, nel colore d'accento del tema.

#### ⚠️ `blobMul` NON e' stato collegato, e non e' una dimenticanza
E' stato provato e **misurato**, e collegarlo non cambia niente. Il perche' e' annotato in `mapgen.js` perche'
e' la stessa ragione per cui tutte le mappe si somigliano:
1. **La posa satura.** `areaFree` pretende 2 tessere libere attorno a ogni masso: la mappa esaurisce i posti
   legali a **~15 blob** e i 700 tentativi finiscono sempre. Chiederne 20 o 38 e' identico — quindi dalla v1.22
   `blobCount` e' di fatto una **costante**, e anche il termine sul livello non fa nulla: la mappa dell'ondata
   20 ha la stessa roccia di quella dell'ondata 1.
2. **`widenForBoss` livella tutto.** Forzando la posa (pad 1 → 26 massi, 769 tessere di muro contro 611), il
   risultato finale non cambia: misurato su 60 mappe, **pad 1 → 513 muri, pad 2 → 536, pad 3 → 513**. Non e' un
   correttore di corridoi, e' un **regolatore di densita'**: cancella qualunque mappa piu' chiusa di "campo
   aperto con pilastri", che e' esattamente l'unica pianta che il gioco sa produrre.

La varieta' di pianta non si ottiene di qui: va rifatto `widenForBoss` (garantire il passaggio dei boss **lungo
un percorso**, non ovunque).

> **Nota (agosto 2026):** la varieta' di PIANTA e' stata poi **accantonata per scelta**. La misura qui sopra
> resta vera e utile — spiega perche' tutte le mappe si somigliano — ma non c'e' nessun lavoro in corso sugli
> archetipi. Se un giorno si riprende, si riparte da \`widenForBoss\`.

#### 🧪 Test
- Nuovo `testV162` su 240 mappe: pozze presenti in ogni tema, **zero** adiacenti a un muro, zero sull'uscita,
  zero entro 7 tessere dalla partenza, nessun giocatore che nasce dentro una; `hazMul` verificato (lava > 1.4×
  ghiaccio); oltre 30 oggetti per mappa e sacchetto del tema sempre usato; partenza e uscita variabili con
  uscita **sempre raggiungibile** e **sempre lontana**; nessuno spawn nemici a ridosso della partenza; danno
  della pozza verificato in partita su giocatore **e** mostro.
- Corretti tre test della 1.45/1.58 che erano **intermittenti**: piazzavano il nemico a un offset fisso dal
  giocatore (+90, +120, +260px) dando per scontato che li' ci fosse pavimento libero e linea di vista — cosa
  vera solo finche' la partenza era il centro sgombro. Ora usano `losSpot()`, che cerca un punto alla distanza
  voluta **senza muro e in vista**: e' la condizione che quei test volevano davvero esprimere.
- **448 passati, 0 falliti** (verificato su 10 esecuzioni consecutive).

### [1.61.1] — 2026-08-26 · "I due nuovi prendono posto nella rampa"

I nemici della 1.61 escono dalla prova e vanno alla loro soglia. Niente altro cambia: stesse def, stessa IA,
stesso render.

#### 🌊 Dove entrano, e perché lì
- **🦇 Nugolo di Pipistrelli → ondata 6** (peso 10). Sta **prima** della Sfera d'Ossa perché insegna la stessa
  lezione dal lato del tiro: il Nugolo chiede di **guidare il colpo** (serpeggia), la Sfera di **schivare di
  lato**. Prima si impara a mirare dove il nemico sarà, poi a togliersi dalla linea. Alla 6 il giocatore ha
  già l'arma evoluta e qualche potere: un nemico veloce e fragile lì è pressione, non muro.
- **🔵 Fuoco Fatuo → ondata 8** (peso 8). Arriva **dopo** perché il suo effetto è *togliere una risposta* —
  mettersi al riparo — e una regola si toglie solo dopo averla insegnata. Fino alla 7 spezzare la linea di
  vista funziona contro Negromante, Fungo e Sfera; dall'8 c'è una cosa a cui il muro non serve.
- Pesi **sotto** lo sciame base (40): sono nemici che cambiano il ritmo, non che riempiono il campo.

#### 📈 La rampa non ha più buchi
Un archetipo nuovo **per ogni ondata dalla 1 alla 8**, poi il Beholder alla 10:
`1 Zombie · 2 Melma · 3 Negromante · 4 Troll · 5 Fungo · 6 Nugolo · 7 Sfera d'Ossa · 8 Fuoco Fatuo · 10 Beholder`.
Prima la 6 e la 8 erano vuote.

#### 🧪 Test
- `testV150` torna a pretendere il **solo** scheletro nell'ondata 1 (l'eccezione `INPROVA` è stata rimossa) e
  verifica le due nuove soglie; aggiunto il controllo che il pool dell'ondata *w* contenga esattamente *w*
  archetipi da 1 a 8 — così un buco nella rampa fa fallire il test invece di passare inosservato.
- `testV161` verifica soglie e pesi al posto della comparsa in prova.
- Reso deterministico un test del Fungo (v1.58) che era **intermittente**: piantava il fungo a offset fisso
  dal giocatore, e se quel punto cadeva dentro un muro il server lo spostava — giustamente — con `_unstuck`,
  facendo fallire l'assertion "non si sposta di un pixel". Ora il punto libero viene cercato.
- **422 passati, 0 falliti.**

### [1.61.0] — 2026-08-26 · "Due nemici che non camminano: lo sciame e il fuoco fatuo"

Continuazione della linea aperta con la v1.58: nemici scelti **perché** il motore non ha cicli di camminata
disegnati a mano da spendere. Nessuno dei due ha gambe, nessuno dei due ha un asset.

> ⚠️ **(Superato dalla 1.61.1: Nugolo dall'ondata 6, Fuoco Fatuo dall'ondata 8.)** Sono in PROVA dall'ondata 1. Serve a vederli subito in partita per decidere da che tier farli
> comparire davvero. Quando la soglia è decisa, in `shared/waves.js` vanno riportati dietro un `if (w >= N)`
> e l'assertion `INPROVA` in `testV150` torna a pretendere il solo scheletro nell'ondata 1.

#### 🦇 Nugolo di Pipistrelli (`bat_swarm`)
- **Una sola entità** disegnata come **9 sagome** che orbitano attorno al centro, ognuna con fase e velocità
  proprie (angolo aureo: non si allineano mai). Le ali sono **una sinusoide di battito**, non fotogrammi.
- **Fragile e velocissimo** (76 PV, vel. 175): il primo nemico da cui non ti allontani camminando.
- **Ondeggia mentre insegue** (IA `flock`): al vettore d'inseguimento somma una componente perpendicolare
  sinusoidale e poi rinormalizza — la velocità resta quella, la traiettoria diventa una **serpentina**.
  Colpirlo in linea retta senza guidare il tiro non funziona. A contatto smette di ballare.
- In attacco il nugolo **si stringe** e scatta; alla morte **si sparpaglia**.
- Contrasto: su roccia quasi nera un pipistrello nero sparisce. Corpo **grigio-viola** con bordo chiaro,
  venature sulle ali e un **alone viola tenue** sotto la massa, così lo sciame si legge a colpo d'occhio.

#### 🔵 Fuoco Fatuo (`wisp`)
- **Il primo nemico che ignora i muri** (`def.phasing`): non lo semini rompendo la linea di vista, ti trova
  sempre. È **lento** (vel. 74), quindi la risposta è muoversi, non nascondersi.
- Quando ti raggiunge **drena**: danno più cura di sé (`leech 0.9`). Evento `drain` → il client disegna le
  scintille che risalgono **dal giocatore verso il fatuo**, così si vede chi sta rubando a chi.
- **Dentro la roccia accelera (×1.7) e non può drenare**: non ci resta mai dentro, e non può spararti da un
  punto dove non puoi rispondere.
- Reso come **fiamma fredda sospesa**: nucleo additivo, lingua di fuoco modulata da tre sinusoidi sfasate,
  tre scintille in orbita, ondeggio verticale lento e due occhietti vuoti dentro il nucleo.

#### 🔧 Server
- `Room.updateMonsters`: i mostri `phasing` si muovono **senza collisione** — niente `moveCircle`, niente
  `_unstuck`, niente anti-incastro (esistono tutti e tre per *rimettere fuori* dai muri). Resta il vincolo
  dei bordi mappa, altrimenti uscirebbero dalla griglia.
- `_separate` salta i `phasing`, così il fatuo non spinge in giro chi attraversa.
- **I nemici `immobile` non vengono più spinti** né dai giocatori (`_pushOff`) né dagli altri mostri
  (`_separate`): il Fungo Sporifero era piantato per design ma scivolava se lo urtavi, e un presidio del
  terreno che si sposta non presidia niente.

#### 🧪 Test
- Nuovo `testV161`: il fatuo **non viene espulso** dal muro (si sposta di meno di mezza tessera contro il
  salto secco di `_unstuck`) ed **esce da solo**; controprova con uno scheletro nella stessa tessera; il
  drenaggio fa danno **e** cura; il nugolo devia lateralmente **oltre 0.30** normalizzato (il solo jitter
  arriverebbe a ~0.08) **cambiando lato**; morso a contatto; niente NaN e nessuno fuori griglia.
- Il conteggio "nessun mostro dentro un muro" esclude ora i `phasing`.
- **408 passati, 0 falliti.**

### [1.60.0] — 2026-08-26 · "Il Troll smette di essere legnoso"

Lastre nuove fornite dall'artista (stessa griglia 5×5 @256px). Prima di toccare il codice le ho **misurate
frame per frame** con Pillow: l'alpha di ogni cella dice dove sono i piedi, la testa e il centro. Tre difetti
venivano dai numeri, non dal disegno.

#### 📏 L'ancora dell'attacco era sbagliata di 11px
- Misurato sui PNG: piedi a y **196-199** (idle), **196-202** (walk), **215-221** (attack). Il manifest
  dichiarava `ay 205` per l'attacco: il troll **saltava di 11px** ogni volta che colpiva, e ne rientrava
  finita l'animazione. È il classico difetto che si legge come "legnoso" senza che si capisca perché.
- Corretto a **216**. Ora le tre animazioni poggiano sulla stessa linea del terreno.

#### 🔨 La martellata arrivava tre fotogrammi prima del danno
- L'impatto visivo è al **fotogramma 15** (misurato: piedi a 221, il punto più basso; testa che crolla da 5 a
  88). Il server infligge il danno a `slamHit 0.72`, che con la mappatura lineare mostrava il **fotogramma
  18** — la posa di recupero. Vedevi colpire e incassavi un attimo dopo.
- Nuova mappatura a **due tratti** ancorata a `hitFrame`: 0→15 su 0→slamHit, 15→24 su slamHit→1. L'impatto
  cade esattamente sul danno **qualunque** valore abbia `slamHit`.
- I primi **7 fotogrammi sono una posa ferma** (area e posizione identiche): la curva `^0.72` li brucia in
  fretta e indugia sul caricamento, dove l'anticipo serve davvero.

#### 👣 Il passo è agganciato al terreno
- La camminata non va più a fps fisso ma a **distanza percorsa** (`cyclePx`, come per la Sfera d'Ossa). I
  piedi non slittano più, e se la velocità cambia — elite, rallentamenti, scaling d'ondata — la cadenza si
  adegua da sola invece di restare inchiodata a 13 fps.

#### 🎞️ Dissolvenza fra animazioni e giro del verso
- I cambi idle↔walk↔attack erano **tagli netti**. Ora c'è una dissolvenza di **0.14s** (`blend` nel manifest).
- Il verso non si ribalta di scatto: passa per lo zero, quindi il troll si **gira** schiacciandosi invece di
  specchiarsi in un fotogramma.

#### 👁️ Beholder dall'ondata 10
- Era alla 15, ora entra dalla **10** (secondo boss). Il tetto di 8 presenze resta.

#### 🧪 Test
- Nuovo **testV160**: verifica che il manifest descriva davvero le lastre, che le tre ancore stiano sulla
  linea dei piedi **misurata**, che la mappatura a due tratti mandi `hitFrame` esattamente su `slamHit` e
  non torni mai indietro, e che la cadenza del passo a velocità nominale sia plausibile.
  **384 passati, 0 falliti.**

---

### [1.59.0] — 2026-08-26 · "Il Beholder smette di essere una boa"

Nella 1.58 del Beholder erano cambiati solo i numeri (ondata 15, tetto di 8). Qui cambia come si muove.
**Nessuno sprite nuovo**: è tutta matematica sullo stesso PNG. Lo spritesheet è stato valutato e scartato —
il §1 di `ENEMIES.md` spiega perché il frame-by-frame perde contro il rig, e il Troll fu l'eccezione solo
perché una camminata bipede è difficile da fingere. Il Beholder non ha gambe.

Il difetto non era la mancanza di animazione: era che **si muoveva tutto insieme**. Quattro interventi:

#### 🦑 Gli eyestalks diventano appendici
- Erano **7 aloni fissi** disposti ad arco. Ora sono **steli curvi** che partono da dietro il bulbo, ognuno
  con **frequenza e fase proprie** (`rate 1.55 + (i%4)*0.47`), quindi non tornano mai in sincrono. In punta
  un occhietto con la sua pupilla, che guarda il bersaglio.
- Disegnati **prima** del corpo: spuntano da dietro invece di stare appiccicati sopra.

#### 👁️ Palpebra e microsaccadi
- **Ammicca** con periodo irregolare per entità (4.2s + un offset ricavato dall'eid): due palpebre che si
  chiudono e riaprono in 0.17s. Un occhio che non ammicca mai è un occhio finto.
- L'iride non insegue più il bersaglio in modo continuo: **scatta** ogni 0.3-0.6s e poi **tiene** la
  posizione, con un filo di jitter. È lo scatto a farlo sembrare vivo; il moto fluido lo faceva sembrare
  una torretta.

#### 🪁 Inclinazione nel movimento
- Si **inclina** nella direzione in cui si sposta, con smorzamento (`lean` interpolato, non istantaneo).
  Prima ondeggiava identico fermo o in corsa.

#### ⏳ Il cambio di sguardo si telegrafa sul corpo
- Il server espone `gt` nello snapshot: quanto manca al prossimo cambio, normalizzato 0-1. Serve per
  **anticipare**, non per reagire dopo.
- Nell'ultimo 16% del ciclo il corpo si **contrae** e gli steli si **drizzano e allungano**; al cambio parte
  un lampo (`flare`) che decade. Prima il cambio lo diceva solo il colore del fascio.

#### 🧪 Test
- Nuovo **testV159**: lo snapshot espone `gt` normalizzato, `gt` **cala** col tempo (il client può
  anticipare) e **riparte** dopo il cambio di sguardo. **367 passati, 0 falliti.**
- Reso e verificato con Chromium nei quattro stati (riposo, ammiccamento, movimento, telegrafo) prima di
  toccare il progetto.

---

### [1.58.0] — 2026-08-26 · "Due nemici senza gambe, la Melma che si divide, il Beholder col guinzaglio"

Tre aggiunte al bestiario scelte per **non richiedere cicli di camminata**: il vincolo tecnico diventa il
criterio di design invece di un ostacolo.

#### 🍄 Fungo Sporifero (`spore_fungus`) — ondata 5+
- **Immobile**: `speed 0`, IA `sentry`. Non insegue, non vaga, non cammina. Se ti vede (LOS libera,
  340px) semina **zone di spore telegrafate** dove ti trovi, due per volta.
- Riempie il buco meccanico che il roster aveva: **nessun nemico puniva lo stare fermi**. Ora il terreno
  sotto i piedi diventa una risorsa.
- Render vettoriale, **zero asset**: cappello che respira, lamelle luminose, gonfiata prima dello sbuffo.
- L'anti-incastro del server lo **ignora** (`def.immobile`): non è bloccato, sta fermo per design.

#### 💀 Sfera d'Ossa (`bone_roller`) — ondata 7+
- Niente gambe: si **carica** (telegrafo `roll_wind`, 0.62s), poi **corre in linea retta** rimbalzando sui
  muri per ~2.3s a 3.1× la sua velocità, e travolge chi trova.
- Anche qui un buco colmato: nessun nemico ti obbligava a **schivare di lato**.
- L'animazione è una **rotazione ricavata dallo spostamento reale**, non da frame: rotola davvero, e se sta
  ferma non gira. Scia di polvere in corsa, schiacciamento in carica.

#### 🟢 La Melma si divide
- `slime` alla morte lascia **2 Melme Minori** (`slime_mini`), che riusano lo stesso sprite a raggio
  ridotto — **nessun asset nuovo**, come lo Zombie Minore col ghoul.
- Le minori **non si dividono**: niente catena infinita. Verificato dal test.

#### 👁️ Beholder col guinzaglio
- Entra nel pool solo dall'**ondata 15** (prima: 6) e ha un **tetto di 8 presenze contemporanee**
  (`def.maxAlive`). Otto debuffer addosso non sono una sfida, sono un interruttore.
- Il tetto è un meccanismo **generico**: quando è pieno lo spawn ripiega sullo sciame base invece di
  saltare, così il conteggio dell'ondata resta quello previsto. Vale anche per la modalità Sopravvivenza.

#### 🌊 Rampa aggiornata
| Ondata | 1 | 2 | 3 | 4 | 5 | 7 | 15 |
|---|---|---|---|---|---|---|---|
| Entra | Zombie | Melma | Negromante | Troll | **Fungo** | **Sfera d'Ossa** | Beholder |

#### 🧪 Test
- Nuovo **testV158**: il Fungo non si sposta di un pixel e semina zone telegrafate; la Sfera si carica,
  parte, percorre distanza e travolge; la Melma lascia esattamente 2 minori e le minori non si dividono;
  il tetto del Beholder regge a 12 tentativi di spawn e ripiega sullo sciame; la rampa resta monotona.
  Aggiornati testV139/V149/V150 (Beholder spostato alla 15). **361 passati, 0 falliti.**

---

### [1.57.0] — 2026-08-25 · "Il mercato è una sala scavata, non un villaggio"

La v1.56 aveva un errore di ambientazione: case col tetto spiovente, alberi e staccionate **sottoterra**.
Rifatto da capo come camera scavata nella roccia.

#### ⛏️ Generatore ribaltato: si scava, non si costruisce
- `generateMarket()` parte da **roccia piena** e *scava* la sala, invece di partire da uno spiazzo e murarlo.
  Fuori dalla sala non c'è mappa: c'è pietra. Pareti **quasi nere** (`wall #050607`).
- **Un solo varco**, a sud, largo 3 tile, su un corridoio corto col **portale EXIT** in fondo. Nord, est e
  ovest sono chiusi — verificato dal test, non a occhio.
- Niente lastricato: il pavimento è la roccia nuda, come nel resto del dungeon.

#### 🔥 Buio, con la luce che nasce dal falò
- La maschera dell'oscurità **torna attiva** anche qui (in v1.56 era disattivata). La sala è illuminata da
  **un'unica grande sorgente circolare centrata sul falò** (`bigLight`, raggio 430px): scopre i cinque
  banchetti e si spegne contro le pareti. Le lanterne appese ai pali fanno da luci di appoggio.
- Il falò entra anche nel passaggio di luce colorata, così la sala è calda e non grigia.

#### 🛖 Banchetti e mercanti
- **Cinque banchetti** a ferro di cavallo attorno al fuoco, aperti verso il varco sud: bancone di pietra e
  legno, tendone a strisce, lanterna accesa sul palo, merce diversa per mestiere. Scalati **1.7×**: il banco
  è più grande del mercante, non viceversa.
- I **mercanti** sono al doppio della taglia della v1.56 e più dettagliati — mantellina, cintura con fibbia,
  pieghe della veste, due braccia con le mani, occhi accesi, l'attrezzo del mestiere in mano — mantenendo la
  silhouette incappucciata di prima.
- Stanno a **2.1 tile** dal proprio banco. A 1.75 finivano *dentro* il tendone: in vista dall'alto "stare
  dietro" vuol dire stare più in alto sullo schermo, ed è lì che sta la tenda.
- Targa del **Fabbro** corretta: era "🔨 Fabbro — Emporio" su una riga e sforava sul banco; ora è "Fabbro"
  con "— emporio —" sotto, come il "— chiuso —" degli altri quattro.

#### 🎛️ Menu di pausa
- Il pulsante diventa **"🏕️ VAI AL VILLAGGIO"** e i due pulsanti stanno **affiancati**: `button.primary` e
  `button.ghost` hanno `width:100%`, che li impilava — annullato dentro `#shopActions`.

#### 🧹 Pulizia
- Rimossi `_bakeBuilding` e i prop di superficie della v1.56 (`house`, `tree`, `fence`, `lamp_post`,
  `market_stall`): non li usava più nessuno.

#### 🧪 Test
- `testV157` sostituisce `testV156`: verifica che la sala sia scavata (niente pavimento fuori, niente muri
  dentro), che il varco sia **uno solo** e a sud, che dallo spawn si **raggiunga il portale a piedi**
  (flood fill), che i banchetti siano 5, tutti diversi e più grandi dei mercanti, che ogni mercante stia
  **dietro** il suo banco, che nessuno finisca dentro la roccia e che la mappa resti **buia**.
  **333 passati, 0 falliti.**
- La sala è stata renderizzata con Chromium e **approvata su anteprima prima** di toccare il codice del
  progetto: due giri di correzioni (mercanti dentro il tendone, targa che copriva la faccia) sono avvenuti
  in sandbox, non sul repository.

---

### [1.56.0] — 2026-08-25 · "Il mercato è un villaggio"

La sosta smette di essere una caverna riciclata: mappa dedicata, disegnata a mano.

#### 🏘️ Mappa dedicata, metà misura, senza muri
- Nuovo generatore `MapGen.generateMarket()`, separato da quello delle ondate. **32×24 tile contro 46×34**
  (il **49%** dell'area): una sosta va letta a colpo d'occhio, non esplorata.
- **Nessun muro interno.** Gli unici blocchi solidi sono i **5 edifici** — e sono solidi *nella griglia*, così la
  collisione arriva gratis dal sistema di tile invece di richiedere una collisione per-oggetto.
- **Villaggio illuminato** (`map.lit`): la maschera della torcia viene saltata. Un rifugio al buio pesto,
  con la lanterna che scopre un metro alla volta, contraddiceva l'idea stessa di posto sicuro.
- **Tema dedicato** (`village`), caldo, e piazza ripulita: nel mercato spariscono massi, buche e le crepe
  profonde del generatore da caverna, che facevano sembrare la piazza un crollo. Restano i ciottoli.

#### 🏠 Cinque costruzioni, cinque abitanti
- **Fucina · Locanda · Magazzino · Cappella · Torre della Gilda**, disposte attorno a una piazza col pozzo.
  Ognuna con tetto spiovente, finestre illuminate, insegna sopra la porta, lanterna accesa e targa col nome.
  La Fucina ha il comignolo che fuma.
- **5 NPC**: il **Fabbro** è l'unico che vende (i 3 slot dell'equipaggiamento); **Erborista, Locandiere,
  Cartomante e Banditore** sono botteghe **ancora chiuse** e lo dicono, così nessuno resta lì a premere tasti
  aspettando un pannello che non esiste. Sono i posti già pronti per le prossime destinazioni.
- Arredo: pozzo centrale, lampioni che illuminano davvero, banchi del mercato, casse, barili, alberi,
  staccionate, stendardi e il cartello **MERCATO**.
- Il percorso è leggibile: si arriva da sud, il fabbro è a **7 tile**, il portale **EXIT** a **13**, con la
  colonna centrale sgombra.

#### 🧪 Test
- Nuovo **testV156**: proporzione dell'area, assenza di muri interni oltre agli edifici, 5 costruzioni tutte
  diverse e solide nella griglia, 5 abitanti di cui uno solo attivo, **nessun abitante o arredo dentro un
  edificio**, corridoio centrale sgombro, mappa dichiarata illuminata e priva di spawn nemici e casse, e
  40 rigenerazioni di fila senza che un giocatore compaia dentro un muro. **334 passati, 0 falliti.**
- Verifica visiva: la mappa è stata renderizzata fuori dal gioco con Chromium per controllare il disegno di
  edifici, arredo e abitanti prima della consegna.

---

### [1.55.0] — 2026-08-25 · "Costi XP a tabella: primi sei ×3, ultimi due ×2"

#### 📏 Prima di tutto: il modello di reddito era sbagliato
Le tarature 1.51→1.54 sono state calcolate su una stima **senza combo**, che valutava l'ondata 2 a ~99 XP.
Misurata in partita vera ne frutta **240**: il modello sottostimava di circa **2.4×**. Una run non vale ~7.500
XP ma **~18.000**. Tutte le conclusioni precedenti su "quanto puoi permetterti" erano ottimistiche di
conseguenza — ed e' il motivo per cui il negozio continuava a sembrare facile nonostante due giri di rincari.

#### ✦ Nuova scaletta
| Livello | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| v1.54 (base 10) | 30 | 48 | 66 | 185 | 517 | 1449 | 2463 | 4187 |
| **v1.55** | **90** | **144** | **198** | **555** | **1551** | **4347** | **4926** | **8374** |
| rapporto | ×3 | ×3 | ×3 | ×3 | ×3 | ×3 | ×2 | ×2 |

- Portare **una** statistica al tetto: da 8.945 a **20.185 XP** — piu' di una run intera anche col reddito
  reale. L'albero completo: da 53.670 a **121.110**, cioe' fuori portata per progetto.
- Il primo livello costa **90** contro i ~130 XP della prima ondata: si compra una cosa sola, e si sceglie.

#### 🧰 I costi sono ora una TABELLA, non una formula
- `STAT_COST_STEPS` elenca un moltiplicatore per livello. La taratura procede per interventi diretti sui
  numeri ("triplica i primi sei, raddoppia gli ultimi due") e nessuna formula unica li segue senza distorcere
  il resto della curva — la v1.54 aveva gia' richiesto tre regimi e due costanti di raccordo. Con la tabella si
  tocca esattamente il livello che si vuole toccare, e la scaletta si legge a colpo d'occhio.

#### ⚠️ Nota sul 7° livello
Triplicando il tronco e raddoppiando la coda, il **7° costa solo il 13% piu' del 6°** (4.926 contro 4.347),
mentre ogni salto precedente era di +180%. E' un gradino piatto in mezzo al muro: dopo aver pagato il 6°, il 7°
sembra regalato. Se in partita da' fastidio, e' il primo numero da alzare — riga `STAT_COST_STEPS`, settimo
valore.

#### 🧪 Test
- `testV153` verifica il fattore ×3 sui primi sei livelli, il ×2 sugli ultimi due, la monotonia, la
  proporzionalita' al `base` della statistica e le soglie di costo complessivo. **309 passati, 0 falliti.**

---

### [1.54.0] — 2026-08-25 · "Esperienza: tronco triplicato, coda smorzata"

Ritaratura della sola curva del negozio XP: la v1.53 era ancora troppo generosa nel tratto in cui si spende
davvero. Nessun'altra modifica.

#### ✦ Tre regimi invece di due
- **Livelli 1-6 × 3.** Tutto il tronco costa il triplo della v1.53. La prima ondata frutta ~56 XP e il primo
  livello ne costa **30**: la spesa diventa una decisione dalla partita numero uno, non da metà run.
- **Livello 7 adeguato** al nuovo tronco (1.352 → **2.463**): triplicandolo sarebbe finito a 4.056, cioè sopra
  l'ottavo della v1.53 — la curva si sarebbe ribaltata.
- **Livello 8 solo ritoccato** (3.786 → **4.187**, +11%). Gli ultimi due livelli sono smorziati apposta
  (`STAT_TAIL_MULT` 1.7 invece di 2.8): triplicati sarebbero diventati **decorativi**, fuori portata in
  qualunque run. Così restano trofei di fine partita.

  | Livello | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|
  | v1.53 (base 10) | 10 | 16 | 22 | 62 | 172 | 483 | 1352 | 3786 |
  | **v1.54** | **30** | **48** | **66** | **185** | **517** | **1449** | **2463** | **4187** |
  | rapporto | ×3.00 | ×3.00 | ×3.00 | ×2.98 | ×3.01 | ×3.00 | ×1.82 | ×1.11 |

- Portare **una** statistica al tetto passa da 5.903 a **8.945 XP** — più dell'intera raccolta di una run
  (~7.500). L'albero completo da 35.418 a **53.670**. Il tetto di una singola statistica è ora raggiungibile
  solo giocando la **COMBO** (moltiplicatore XP fino a ×2.5), che diventa a tutti gli effetti la seconda
  economia del gioco.
- Segnale misurato: i bot dei test (che comprano a caso) passano da ondata 7 a ondata 4 nello stesso tempo
  simulato. Sono bot stupidi — indicatore di direzione, non verdetto.

#### 🧪 Test
- `testV153` aggiornato: verifica il fattore ×3 sui primi sei livelli, l'adeguamento del settimo, il ritocco
  contenuto dell'ottavo, la monotonia della curva e che il bottino della prima ondata basti per **un solo**
  livello. **312 passati, 0 falliti.**

---

### [1.53.0] — 2026-08-25 · "Il mercato si sceglie, il portale si vede, l'esperienza costa"

#### 🚪 Il portale EXIT del mercato ora si vede
- `mapgen` piazza l'uscita nella cella **più lontana dal centro**: in una mappa di combattimento ha senso, in
  una **sosta** no — atterri al centro e il portale è fuori schermo. Il mercato ora si dispone da sé
  (`_layoutMarket`): **fabbro a ~4 tile** dal punto di atterraggio, **portale a ~9 dalla parte opposta**.
  Appena arrivi vedi il fabbro; girandoti vedi la via d'uscita.
- La tile `T_EXIT` viene spostata **nella griglia**, non solo in `map.exit`: il client disegna il portale
  scandendo le tile quando riceve la mappa, quindi cambiare solo `map.exit` avrebbe lasciato il bagliore
  vecchio dov'era.

#### 🎯 Il mercato è una destinazione, non una cadenza
- Sparisce la regola "ogni 3 ondate". Il menu di pausa fra un'ondata e l'altra ha ora **due pulsanti**:
  **▶ PROSSIMA ONDATA** e **🔨 VAI DAL FABBRO**. Ci vai quando ti serve, a qualunque ondata.
- **Co-op:** vale la **prima scelta espressa**, coerente con la regola del portale ("il primo che entra decide").
- I pulsanti stanno in `#shopActions`: aggiungere una destinazione futura = un `<button>` in più lì e un
  valore di `dest` in più in `_afterShop()`. **Spazio** resta la scorciatoia per l'ondata successiva.

#### ✦ Esperienza: apertura più dolce, coda molto più dura
- La curva della v1.51 (`2.05^n` uniforme) era ripida **già al secondo livello** — 10 → 21 → 42 quando ancora
  non hai reddito — e comunque troppo mite in fondo. Ora è **spezzata**: i primi 3 livelli sono quasi lineari,
  poi si sale di **2.8× a livello**.

  | Livello | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|
  | v1.51 (base 10) | 10 | 21 | 42 | 86 | 177 | 362 | 742 | 1522 |
  | **v1.53** | 10 | **16** | **22** | 62 | 172 | **483** | **1352** | **3786** |

- Portare **una** statistica al tetto passa da **2.968** a **5.903 XP**, cioè circa **l'intera raccolta di una
  run**. L'albero completo passa da 17.760 a **35.418 XP**. Specializzarsi non è più consigliato: è obbligato,
  e la **COMBO** (moltiplicatore XP fino a ×2.5) diventa la leva che decide quanto puoi permetterti.
- Segnale misurato: i bot dei test, che compravano a caso, ora si fermano quasi sempre al **boss dell'ondata 5**
  invece di superarlo. Sono bot stupidi, quindi è un indicatore di direzione, non un verdetto — ma la direzione
  è quella richiesta.

#### 🧪 Test
- Nuovo **testV153**: destinazioni del menu di pausa, prima-scelta-vince in co-op, distanze di fabbro e portale
  dal punto di atterraggio, unicità della tile EXIT nella griglia, monotonia e severità della nuova curva XP.
  `testV18` e `testV152` aggiornati alla scelta esplicita; i bot dei full-run passano dal fabbro nel 25% dei
  casi. **309 passati, 0 falliti.**

---

### [1.52.0] — 2026-08-25 · "MERCATO: l'Emporio smette di essere un pannello e diventa un luogo"

L'acquisto diretto dell'equipaggiamento a fine ondata — nascosto in v1.51 — è sostituito da una **mappa di sosta**
in cui il mercante è un NPC a cui ci si avvicina, come il Mercante Errante.

#### 🏪 La mappa MERCATO
- Ogni **3 ondate** (`C.MARKET_EVERY`) si entra in una mappa **senza nemici**, col **fabbro dell'equipaggiamento**
  piazzato al **centro**.
- È **INTERSTIZIALE**: non consuma un numero d'ondata. Così la cadenza dei boss (ogni 5) resta intatta e sparisce
  la collisione all'ondata 15 — il mercato la **segue** invece di sostituirla. Ed è il momento giusto: **il 58%
  delle monete di una run arriva dai boss**, quindi la sosta cade quando sei appena diventato ricco.
- Niente **casse** (il 30% è una cassa-mima, cioè un nemico in una stanza che promette sicurezza) e niente
  **Mercante Errante**: quello resta un incontro delle ondate normali, con le sue offerte uniche.
- Si prosegue entrando nel **portale EXIT**: nel mercato è disegnato più grande, verde, con colonna di luce ed
  etichetta leggibile anche col buio della torcia. **Co-op: il primo che entra porta avanti tutti**; timeout
  anti-AFK a 120s solo in multiplayer, come già fa il negozio.
- Uscendo, la mappa viene **rigenerata a forza** (`_forceNewMap`): senza, l'ondata successiva si sarebbe
  combattuta dentro la stanza del fabbro, perché la rigenerazione avviene solo alle ondate dispari.

#### 🔨 Il fabbro dell'equipaggiamento
- I 3 slot (Armatura, Stivali, Arma) si comprano **solo** stando vicino a lui: `buyGear` verifica **fase e
  distanza**, non più solo la fase.
- Render dedicato `_drawGearMerchant`: forgia con carboni che tremolano, incudine con scintille, martello che
  batte. Beacon ambra sempre acceso e marker sulla minimappa.
- Il pannello riusa le carte `.gc` dell'Emporio e si ricostruisce **solo al cambio di offerta o monete** — la
  stessa precauzione del fix v1.34 sul Mercante Nero, che ricreando le card a ogni frame le rendeva invisibili.

#### 🐛 FIX — i mercanti erano invisibili sulla mappa
- `merch` e `merchD` non venivano **mai** copiati dallo snapshot dentro `buildWorld()`: `world.merch` restava
  `null` per sempre, quindi `_drawMerchant` e `_drawDarkMerchant` non venivano **mai** chiamati. Mercante
  Errante e Mercante Nero erano **invisibili** — beacon "sempre visibile" e marker sulla minimappa compresi —
  e li si trovava solo per caso, camminandoci addosso. Ora vengono aggiornati insieme al resto del mondo.

#### 🧪 Test
- Nuovo **testV152**: cadenza interstiziale, assenza di nemici/casse/mercante errante nel mercato, fabbro al
  centro, acquisto negato da lontano e concesso da vicino, apertura/chiusura del pannello per prossimità,
  uscita dal portale con rigenerazione della mappa. `testV18` aggiornato (l'equipaggiamento ora si compra dal
  fabbro) e i bot dei test sanno raggiungere il portale EXIT. **292 passati, 0 falliti.**

---

### [1.51.0] — 2026-08-25 · "Level up rivisto: 1 di 3 carte, dieci poteri nuovi, negozio XP che obbliga a scegliere"

Il momento fra un'ondata e l'altra chiedeva **tre** decisioni al giocatore, ma una sola era davvero una decisione.
Questa versione rimette al centro le **carte potere** e trasforma il negozio XP da rubinetto a scelta.

#### 🎴 Si sceglie 1 potere su 3 (erano 2 dalla v1.10)
- Il catalogo era stato ampliato a 23 poteri **riducendo** contemporaneamente le carte offerte da 3 a 2: catalogo più
  grande e meno pescate significa vedere una frazione sempre più piccola del design. Ora si torna a **3 carte**,
  sempre con **una sola selezionabile**.
- Con la composizione attuale del catalogo, un'estrazione è al 63% *non comune*, 28% *rara*, 9% *epica*: la terza
  carta è ciò che rende probabile vedere almeno qualcosa di raro quando conta.

#### ✨ Dieci poteri nuovi (catalogo da 23 → 33)

  | Potere | Rarità | Effetto | Ispirazione |
  |---|---|---|---|
  | ⛏️ **Piede di Porco** | non comune | +40% danno sui nemici sopra il 90% dei PV | *Risk of Rain* — Crowbar |
  | 🔭 **Tiro Lungo** | non comune | più lontano è il bersaglio, più fai male | *Risk of Rain* — Laser Scope |
  | 💃 **Passo di Danza** | non comune | +25% velocità per 2s a ogni uccisione | *Hades* |
  | 🧲 **Fame Vorace** | non comune | raggio di raccolta molto più ampio, +15% XP | *Vampire Survivors* |
  | 💢 **Rappresaglia** | raro | farsi colpire emette un'onda che danneggia e respinge | *Dead Cells* |
  | 🧿 **Egida Ostinata** | raro | annulla per intero un colpo ogni 8s | *Hades* — Stubborn Defiance |
  | ☄️ **Deflagrazione Cadaverica** | raro | i nemici uccisi esplodono | *Risk of Rain* — Gasoline |
  | 🗡️ **Colpo di Grazia** | epico | esegue i nemici sotto il 12% dei PV (mai i boss) | *Dead Cells* |
  | 🔊 **Eco Arcana** | epico | il 20% dei colpi parte una seconda volta, gratis | *Binding of Isaac* |
  | ⏳ **Ultima Occasione** | epico | invece di cadere risorgi al 50% dei PV | *Hades* — Death Defiance |

- Nessuno è un semplice "+X%": ognuno cambia **come** giochi — apri i tank, tieni la distanza, non ti fermi mai,
  ti fai colpire di proposito, chiudi le esecuzioni.
- **Due nuove sinergie** legano il nuovo al vecchio: 🎯 **Cacciatore di Teste** (Colpo di Grazia + Piede di Porco →
  soglia di esecuzione +6 punti) e 🌊 **Onda d'Urto** (Rappresaglia + Aura di Spine → onda molto più ampia).

#### ✦ Negozio XP: da rubinetto a scelta
- **Il problema, in numeri.** La curva era `base × 1.55^n` con livelli **illimitati**. Portare tutte e sei le
  statistiche a Lv.8 costava **3.526 XP**, contro le **~7.528 XP** raccolte in una run intera: si comprava tutto,
  e l'ordine degli acquisti non aveva conseguenze.
- **La correzione.** Curva a `2.05^n` e **tetto di 8 livelli** per statistica. L'albero completo costa ora
  **17.768 XP**: circa il **42%** è alla portata di una run normale, fino a **~84%** giocando la combo (che
  moltiplica l'XP fino a ×2.5). Specializzarsi diventa obbligatorio, e la **combo** smette di essere decorativa.
- Le carte del negozio mostrano ora `Lv.3/8` e diventano **MAX ★** quando la statistica è esaurita.

#### 🪙 Emporio a monete temporaneamente nascosto
- L'Emporio (Armatura / Stivali / Arma) **non compare più** a fine ondata: flag `C.SHOP_GEAR_ENABLED = false`.
  Nulla è stato cancellato — `offerGear`, `buyGear`, le icone e la UI restano al loro posto e si riaccendono
  rimettendo il flag a `true`. Le **monete continuano a cadere** e restano spendibili dai due **mercanti** in mappa.
- Motivo tecnico che rendeva l'Emporio ridondante: comprava quasi le stesse statistiche del negozio XP con una valuta
  diversa (Stivali +5% velocità ≡ Agilità +5% velocità; Arma +8% danno ≈ Potenza +9%).

#### 🎒 Barra dei poteri attivi (HUD)
- Nuova riga di gettoni sopra la barra abilità: mostra ogni potere posseduto con **icona, colore della rarità e
  moltiplicatore** (×2, ×3), più le **sinergie** attive evidenziate. Passandoci sopra compare nome e descrizione.
- Non passa dallo snapshot (che gira 20 volte al secondo): il server invia l'elenco solo **quando cambia**
  (scelta di un potere, sinergia sbloccata, inizio partita) con il nuovo messaggio `C.MSG.BOONS`.

#### 🧪 Test
- Nuovo **testV151**: le 3 carte, la presenza e applicabilità dei 10 poteri, l'assenza di id duplicati, il tetto di
  livello davvero invalicabile, il costo dell'albero completo, l'Emporio che non viene più offerto, il Colpo di
  Grazia che esegue, l'Ultima Occasione che consuma una carica, l'Egida che para una volta sola, e una run con
  **tutti e dieci** i poteri al massimo senza NaN. Aggiornato testV110 (2 → 3 carte). **273 passati, 0 falliti.**
- Nuova suite **`test/client.js`**: smoke test dell'interfaccia con un DOM finto (niente browser). `hud.js` non era
  coperto da nulla, e questa versione lo tocca parecchio. `npm test` ora lancia entrambe le suite.
- `ROSTER.md` ed `ENEMIES.md` non sono stati toccati: questa versione non modifica alcun nemico.

---

### [1.50.0] — 2026-08-25 · "Consolidamento: curva di difficoltà ripristinata, elite tarati, documentazione riallineata"

Versione di **consolidamento**: nessun mostro nuovo. Dalla 1.37 alla 1.49 — tredici versioni — il lavoro è stato
quasi interamente sul **rendering** dei nemici; nel frattempo si era accumulato debito su **bilanciamento** e
**documentazione**. Questa versione lo salda prima di rimettere mano al gameplay.

#### 🌊 Curva di introduzione dei nemici ripristinata (`shared/waves.js`)
- Le comparse **"dal primo stage"** aggiunte in v1.44 (Melma, Bruto) e v1.49 (Beholder) erano **temporanee**:
  servivano a valutare i nuovi sprite, ma sono rimaste nel codice. Risultato: all'ondata 1 il pool conteneva già
  **4 archetipi su 5**, tank tier 2 e debuffer tier 3 compresi, e la rampa di difficoltà era di fatto sparita.
- Nuova rampa — un archetipo nuovo ogni 1-2 ondate, coerente coi **tre pilastri** descritti in `ROSTER.md`:

  | Ondata | Entra nel pool | Archetipo |
  |---:|---|---|
  | 1 | 🟢 Zombie Putrido | sciame mischia |
  | 2 | 🟢 Melma Corrosiva | blob acido ravvicinato |
  | 3 | 🟣 Negromante | caster / evocatore |
  | 4 | 🟠 Troll delle Caverne | tank con slam ad area |
  | 6 | 👁️ Beholder | debuffer, dopo il primo boss |

#### ⚔️ Moltiplicatore PV degli elite reso PER-NEMICO (`def.eliteHp`)
- Il `2.4x` fisso sugli elite era tarato sui nemici da ~80-100 PV. Applicato ai più robusti produceva mostri
  fuori scala: un **Troll elite** all'ondata 4 arrivava a **~845 PV** contro l'arma iniziale.
- Ora ogni def può dichiarare `eliteHp` (default invariato `2.4`): **Troll `1.5`** (~528 PV all'ondata 4),
  **Beholder `1.9`**. Tutti gli altri nemici mantengono esattamente il comportamento precedente.

#### 📚 Documentazione riallineata
- **`ROSTER.md`** era il più arretrato (fermo alla 1.47): mancavano **Melma Corrosiva** e **Beholder** dalla tabella
  comparativa, il Troll era ancora chiamato "Bruto delle Caverne" e descritto come puppet (dalla 1.47 è uno
  **sprite sheet**), e l'intestazione dichiarava "tutti i nemici d'ondata usano il RENDER PUPPET". **Riscritto.**
- **`README.md`**: il titolo diceva ancora `v1.28.1`; sezione **Architettura** aggiornata (mancavano `public/assets`
  e `tools/`, cioè proprio le cartelle nate col metodo puppet).
- **`ENEMIES.md`** §12: la **checklist di release** conteneva ancora il punto *"ripacchettizzare come `.txt`
  (zip mascherato)"* — il workflow precedente al repository git. Sostituito col **commit**; aggiunti `ROSTER.md`
  ed `ENEMIES.md` fra i documenti da aggiornare (ROSTER **non era in lista**: è la causa del suo arretramento).
- Aggiunta alla checklist la **trappola degli id**: `skeleton` = Zombie Putrido · `cave_brute` = Troll ·
  `occhio` = Beholder.

#### 🧪 Test
- Nuovo **testV150**: verifica la rampa ondata per ondata, la sua **monotonia** (nessun archetipo che sparisce
  crescendo di ondata) e il tetto PV degli elite tank. Aggiornati testV142 / testV145 / testV149, che asserivano
  la vecchia comparsa "dal primo stage". **256 passati, 0 falliti.**

---

### [1.49.0] — 2026-08-11 · "Beholder: l'Occhio Tiranno torna nel roster (Sguardo multi-raggio)"

##### 👁️ Ritorna il BEHOLDER (id `occhio`)
- Reintrodotto l'**Occhio Vagante** come **BEHOLDER**: bulbo oculare fluttuante con **eye-stalks** e **tentacoli
  tutt'intorno**, aura emissiva magenta, iride che segue e pupilla che si dilata in attacco. Vista frontale (`_eyeF`).
- **Attacco = SGUARDO** (niente proiettili): se entri nel suo **campo visivo** (cono attorno allo sguardo, in
  gittata e con **LOS libera**) subisci un **debuff** che si rinnova finche resti "sotto gli occhi".
- **EYESTALKS CHE RUOTANO (novita):** il Beholder **alterna ciclicamente** i tre tipi di sguardo (multi-raggio)
  ogni ~4s — 🟠 **weaken** (attacco indebolito) · 🔵 **slow** (velocita ridotta) · 🟣 **sunder** (meno difesa) —
  e il **fascio si ricolora** in base al tipo attivo.
- **Stat:** tier 3, **130 PV**, gittata sguardo **340**, danno contatto 16, IA **gazer** (orbita a distanza).
  Aggiunto a `ORDER` e al **pool dal primo stage** (per valutazione), peso basso.

##### 🎨 Render RASTER PUPPET (metodo puppet, non piu vettoriale)
- Il Beholder usa il **RENDER PUPPET raster** (illustrazione ritagliata → manifest + profilo), come ghoul/negromante/
  bruto/melma: nuovo asset `public/assets/enemies/beholder/body.png` + `beholder.json` (slicer `tools/slice_beholder.py`).
- Render **dedicato** `_beholderPuppet`: corpo billboard che fluttua e "respira", **IRIDE centrale che SEGUE** il
  bersaglio e **pupilla che si dilata** in attacco, **eyestalks che avvampano** nel colore dello sguardo attivo,
  **edge-glow** magenta pulsante. Morte dedicata (l'occhio implode e svanisce). La meccanica IA (gazer) resta.

##### 🧪 Test
- Nuovo **testV149** (Sguardo debilitante nel campo visivo + eyestalks che ruotano) e testV139 aggiornato
  (occhio non e piu "rimosso"): **246 passati, 0 falliti**.

---

### [1.48.0] — 2026-08-10 · "Fix Troll sprite-sheet: cammina davvero, non fluttua, ombra ai piedi"

#### 🐛 Fix animazione & grounding dello sprite-sheet
- **Camminata che non partiva:** i mostri **lenti** (Troll, speed 60 ≈ 1px/frame; in vagabondaggio anche 0.5px)
  restavano in **idle mentre scivolavano** perché la soglia del rilevamento movimento (`pv.mv > 0.95`) era troppo alta.
  Ora le soglie con **isteresi** sono **0.28/0.10**: il Troll passa correttamente allo stato **walk** (verificato: 60px/s
  e 30px/s → animazione di camminata; 0px/s → idle).
- **"Fluttua" + ombra troppo distante:** lo sprite-sheet ancora i **piedi** su `(m.x, m.y)`, ma riceveva anche
  l'**ombra generica** disegnata a `y + rr·0.75` (~28px **sotto** i piedi) → sembrava galleggiare sopra la sua ombra.
  Ora lo sprite-sheet è **escluso** dall'ombra generica e disegna una **propria ombra sfocata esattamente ai piedi**:
  il Troll è ben "piantato" a terra, niente più fluttuazione.

#### 🧪 Test
- Nessuna regressione: **234 passati, 0 falliti**.

---

### [1.47.0] — 2026-08-10 · "Troll delle Caverne: SPRITE SHEET animato (idle/walk/attack) al posto del puppet"

#### 👹 Nuovo render: SPRITE SHEET frame-by-frame (stile 2.5D "da sala")
- Il **Troll delle Caverne** (ex Bruto, id `cave_brute`) non è più un puppet a pezzi: ora usa un **vero sprite sheet
  animato** disegnato a mano — **3 fogli 5×5 @256px** (idle, walk, attack). La camminata è **naturale** (nessun rig da
  tarare) e l'attacco è una **martellata** completa (25 frame).
- **Nuovo motore SPRITE SHEET** nel renderer (`SHEETS[key]` + `_drawSheet`): sceglie l'animazione dallo stato
  (idle/walk/attack), il frame dal tempo (loop, con sfasamento per‑nemico) o dalla fase d'attacco (one‑shot), ritaglia
  la cella dalla griglia e la disegna **ancorata ai piedi** con **mirror L/R** per la direzione. Hit‑flash e ombra inclusi.
- **Attacco pilotato dall'evento slam:** parte al `slam_wind` (con eid) e i 25 frame coprono l'intera martellata; il
  **danno ad area** e la scossa scattano al **72%** dello swing (`slamHit`) per coincidere con l'impatto a schermo.
- Il Troll mantiene l'IA v1.43 (vede/insegue, vagabondaggio, anti‑incastro). Rinominato in "Troll delle Caverne".

#### 🧪 Test
- Nuovo `testV147` (il Troll ora è `sheet:'troll'`, wind‑up + danno d'impatto): **234 passati, 0 falliti**.

---

### [1.46.0] — 2026-08-10 · "Bruto: camminata senza tremore + parti ritagliate meglio · Melma in vista TOP-DOWN"

#### 👹 Bruto — via il "tremore" (camminata rifatta) + nuovi ritagli
- **Camminata rifatta** per eliminare l'effetto "parkinson": **un solo dondolio lento e ampio**, braccia enormi che
  oscillano **in sincronia** (rimosso il rollio nervoso delle spalle), **sollevamento del piede morbido** (mezzo‑coseno,
  niente scatti) e **fase sempre continua**.
- **Anti‑sfarfallio:** il rilevamento movimento ora usa **isteresi + forte smoothing**. I mostri **lenti** (come il Bruto,
  che sfiorava la soglia) non alternano più di continuo idle↔camminata → niente più tremolio.
- **Parti ritagliate meglio:** sostituiti i 6 PNG del Bruto con i tuoi ritagli puliti (stesso manifest, cuciture migliori).

#### 🟢 Melma Corrosiva — ora in vista TOP‑DOWN (pozza fluo)
- La Melma non è più un blob "in piedi": è una **pozza fluorescente vista dall'alto** che **striscia** sul pavimento.
  Render dedicato `_slimePuddle` (niente billboard/ombra): **wobble gelatinoso**, **stiramento** nella direzione di
  marcia, leggero ondeggio e **edge‑glow verde** pulsante che avvampa in attacco/quando colpita; **bolle acide** che salgono.
  Morte: la pozza **si restringe e svanisce**. Invariata la meccanica (striscia lenta + **sputo di bolle d'acido** ad alto danno).

#### 🧪 Test
- Suite aggiornata (Melma top‑down): **226 passati, 0 falliti** · boss‑navigabilità **2100/2100 (100%)**.

---

### [1.45.0] — 2026-08-10 · "Melma Corrosiva: STRISCIA lenta + SALTA e SPUTA acido · sprite senza bocca + edge-glow"

#### 🟢 Movimento rifatto: la Melma STRISCIA (niente più saltelli)
- In movimento la Melma non fa più su‑e‑giù: ora **striscia** con un'onda **peristaltica** (si stira in avanti →
si contrae) **restando sempre a terra**. Movimento **lento** (velocità 66 → **52**).
- Il **SALTO** avviene **solo durante l'attacco** (unico momento in cui si stacca da terra).

#### 💥 Attacco: salta e SPUTA bolle d'acido ad ALTO danno (ravvicinato)
- Nuova IA **blob**: la Melma si avvicina strisciando e, **quando è vicina** (in gittata, con linea di vista libera),
**SALTA** e **sputa un ventaglio di bolle d'acido** ad **alto danno** (`acidMult 1.8`, 3 bolle, `atkRange 150`).
Il contatto ravvicinato fa comunque danno. Nuovo evento `acid` (salto + FX di sputo). Se non ti vede, **vaga**.

#### 🎨 Sprite & effetti
- Nuovo sprite **senza bocca** e senza nucleo centrale (solo occhi), con **bagliore verde sul bordo** (edge‑glow) che
maschera l'effetto ritaglio. **Occhi che si illuminano nella DIREZIONE DI MOVIMENTO** (più intensi in marcia, pupilla
spostata in avanti). Restano **aura verde** pulsante e **bolle acide** che salgono.

#### 🧪 Test
- `testV145` aggiornato (IA blob, sputo acido ostile ad alto danno, lentezza, primo stage): **226 passati, 0 falliti**.

---

### [1.44.0] — 2026-08-10 · "Melma Corrosiva (squash & stretch) + Bruto affinato (passo & slam) + entrambi nel primo stage"

#### 🟢 Nuovo nemico: Melma Corrosiva (render PUPPET, squash & stretch)
- Quarto puppet: un **blob acido** reso con **UN solo pezzo** animato in **SQUASH & STRETCH** (scala non uniforme
  attorno alla base), non a giunti. Idle: **gelatina che respira** (jiggle). Movimento: **saltello** — si **appiattisce**
  a terra (largo/basso) e si **allunga** in aria (stretto/alto). Attacco: si **comprime** (carica) poi **schizza** in avanti.
- **Effetti grafici** (come richiesto): **AURA VERDE** pulsante marcata (`def.aura`), **nucleo verde acido** che pulsa
  al centro (man.core), **occhi che avvampano** al colpo, e **bolle acide** che salgono (`def.bubbles`).
- Il motore puppet ora supporta lo **squash & stretch** (`pose` può restituire `sx/sy`), riusabile da tutti i puppet.
- **Stat:** tier 1, 90 PV, lento (66), danno 12. Nel pool **dal primo stage**.

#### 👹 Bruto — passo e slam affinati
- **Camminata: il piede si SOLLEVA da terra** (nuovo `WALK.lift`) e la **falcata è più ampia** (`leg` 22→34): ora si
  "muovono i piedi", il passo è ben leggibile.
- **SLAM più impattante:** affondo del corpo più **profondo e deciso** (bob/tilt/lungeX aumentati) e FX di **schianto
  potenziati** — **doppia onda d'urto** + **anello di polvere**, **burst di detriti**, **hit-stop** e **scossone più forte**.

#### 🧪 Test
- Nuovo `testV144` (Melma puppet, aura/bolle, slime+bruto nel primo stage): **221 passati, 0 falliti**.

---

### [1.43.0] — 2026-08-10 · "Bruto ridisegnato (camminata lumbering + slam overhead), vagabondaggio & anti-incastro"

#### 👹 Bruto delle Caverne — movimento e attacco rifatti
- **Camminata distinta dallo zombie:** niente più braccia in grande opposizione (troppo simili allo zombie). Ora è
  un **incedere lumbering** da ogre: le braccia **dondolano poco e in sincronia** (knuckle-drag), con **grande rollio
  delle spalle**, **waddle laterale marcato**, busto **proteso in avanti** e cadenza più lenta.
- **Attacco = SLAM overhead:** quando ti **VEDE** (campo visivo `sightRange` + linea di vista) ed sei a tiro, il Bruto
  **ALZA entrambi i pugni sopra la testa** (wind-up telegrafato) e li **SCHIANTA a terra** — danno ad **AREA** con
  **forte respinta** (ti scaglia via). Il telegrafo (~0.7s) ti dà il tempo di schivare. Nuovi parametri: `slamWind`,
  `slamKnock`, `slamRadius 104`, `atkRange 70`.

#### 🧭 Vagabondaggio quando il nemico non ti vede
- Se un nemico **non ti vede** (fuori dal `sightRange` o senza linea di vista) e non ha una posizione recente da
  investigare, ora **VAGA a caso** per la mappa (bersagli casuali raggiungibili) invece di puntarti sempre come un
  laser. Quando ti individua ti insegue; se ti perde di vista, **investiga** l'ultima posizione nota e poi torna a
  vagare. Applicato a Zombie e Bruto (perceive/investigate/wander in `ai.js`).

#### 🧱 Anti-incastro per TUTTI i nemici (boss compresi)
- Nuovo **rilevatore di incastro** per ogni mostro: se prova a muoversi ma **non avanza** (wedge in un angolo, pur non
  essendo dentro un muro) parte un **recupero** che lo fa **scivolare** nella direzione libera più utile; se persiste,
  un **piccolo salto** verso la cella libera più vicina. `_unstuck` potenziato. Verificato: **0 mostri/boss** restano
  dentro un muro dopo stress con tutti i boss in campo; boss-navigabilità mappe **2100/2100 (100%)**.

#### 🧪 Test
- Nuovo `testV143` (vagabondaggio, wind-up slam, anti-incastro con boss): **213 passati, 0 falliti**.

---

### [1.42.0] — 2026-08-10 · "Bruto delle Caverne (tank PUPPET con slam ad area) + artwork bestiario"

#### 👹 Nuovo nemico: Bruto delle Caverne (render PUPPET)
- Terzo puppet e **terzo pilastro** del roster: un **tank da mischia** enorme e ingobbito, scomposto in **6 pezzi**
  (testa con zanne, torso con spallacci d'osso, **due braccia enormi**, due gambe tozze) + overlay vettoriale
  (**occhi ambra** pulsanti). Accento **ambra** per distinguerlo dal verde zombie e dal viola negromante.
- **Animazione delle BRACCIA** (la sua firma, curata come richiesto): pivot alla **spalla** → grandi **dondolii in
  opposizione** durante la camminata pesante; **SLAM ad area in due tempi** (carica: si erge coi pugni cocked
  all'indietro → schianto: tutto il busto affonda in avanti/giù, i pugni guidano il colpo) con onda d'urto e respinta.
- **Stat (tank):** tier 2, **220 PV**, molto lento (**vel. 60**), raggio 24, **danno 28**, `ai 'brute'`, slam raggio 96.
  Entra nel **pool dall'ondata 4**, peso basso (raro ma temibile). Eredita hit-reaction, morte con crollo dei pezzi,
  tint elite (ambra) e ombra dinamica del motore puppet.
- **Client:** l'evento `slam` ora porta l'eid → il Bruto **riproduce l'animazione** dello slam (prima non animava).

#### 🖼️ Artwork del bestiario nel progetto
- Aggiunti in `public/assets/art/`: **`roster_overview.png`** (scheda illustrata del bestiario) e
  **`cave_brute_concept.png`** (concept del Bruto). Aggiornata la scheda **`ROSTER.md`** con il Bruto implementato
  (stat reali) e i riferimenti agli artwork.

#### 🟣 Incluso: sfere del Negromante +30% (da v1.41)
- Ri-applicata la taratura approvata: `darkmage.projSpeed` **250 → 325** (le sfere debilitanti sono più difficili
  da schivare). Era andata persa nel pacchetto v1.41.

#### 🧪 Test
- Nuovo `testV142` (roster, tank, slam ad area con eid, pool ondata 4): **206 passati, 0 falliti**.

---

### [1.40.0] — 2026-08-10 · "Taratura campo visivo del Negromante"

- **Cono visivo più stretto/focalizzato:** `fov` da **0.62 → 0.55** rad (cono totale **~71° → ~63°**). Premia il
  fiancheggiamento: è più facile restare fuori dalla sua vista aggirandolo.
- **Rotazione testa più lenta/deliberata:** `turn` ora **1.7 rad/s** (~97°/s, prima ~120°/s), reso **parametro
  esplicito** della def (`darkmage.turn`) così è tarabile in un unico punto. Telegrafa meglio e concede una finestra
  per rompere la linea di vista.
- Invariati `sightRange 360`, curse e tetto evocazioni. Test: **193 passati, 0 falliti**.

---

### [1.39.0] — 2026-08-10 · "Negromante PUPPET + motore puppet generico + migliorie animazioni/effetti"

#### 🧙 Nuovo nemico: Negromante (render PUPPET)
- Secondo puppet del gioco (mago incappucciato con bastone e orbe), scomposto in **5 pezzi** (cappuccio/testa,
  torso, veste a campana, braccio-bastone, mano ossuta) + overlay vettoriale (**occhi viola** + **orbe** che divampa in cast).
- **Fluttua** (niente camminata), con veste che ondeggia a pendolo; **attacco/cast in due tempi** (alza il bastone → proietta).
- **IA:** tiene la distanza (kiting), la testa **ruota lentamente** verso il bersaglio → il suo **CAMPO VISIVO** (cono fov)
  insegue con ritardo. **Spara SFERE DEBILITANTI** (curse: riduce danno e velocità del colpito) **solo** quando il bersaglio
  è **dentro il cono**, in gittata e con linea di vista libera. Un **cono-telegrafo** fioco si accende quando ti individua.
- **Evoca ZOMBI MINORI** (nuovo `zombie_mini`, puppet ghoul in miniatura) fino a un **massimo di 4** (minionCap):
  evoca solo per rimpiazzare i caduti. Entra nel pool ondate **dall'ondata 3**.

#### 🧩 Motore PUPPET generico (refactor)
- Astratto in `PUPPETS[key]` (registry asset) + `PROF[key]` (profilo animazione): aggiungere un nemico puppet ora è
  **"manifest + profilo"**. `_ghoulPuppet` → `_puppet(key, …)` generico; nuovo `_puppetDeath(key, …)`.

#### ✨ Migliorie animazioni & effetti (a tutti i puppet)
- **Hit-reaction del corpo:** al colpo il mostro fa uno **squash** verticale + piccolo **rinculo** all'indietro (oltre agli occhi che avvampano).
- **Morte PUPPET dedicata:** i pezzi **crollano** (gambe che cedono, testa che rotola, veste che si accascia) con dissolvenza e occhi che si spengono.
- **Inclinazione nel movimento:** il corpo si **inclina** leggermente nella direzione di marcia (più "presenza").
- **Ombra dinamica:** l'ombra a terra **si allunga** e segue la direzione del movimento/affondo.
- **Varianti ELITE:** i pezzi vengono **ritinti** (ctx.filter) per distinguere gli elite a colpo d'occhio.

#### 🧪 Test
- Suite aggiornata (nuovo `testV139`, roster + tetto evocazioni + campo visivo): **193 passati, 0 falliti**.

---

### [1.38.0] — 2026-08-10 · "Occhi che avvampano quando lo zombie è colpito · via il cerchio verde"

#### 👁️ Occhi verdi che avvampano al colpo (feedback di danno)
- Quando lo Zombie Putrido (puppet) viene **colpito**, gli **occhi verdi avvampano** con un lampo luminoso
  (pulse e raggio del glow aumentati per la durata dell'hit-flash). Sostituisce il flash bianco che il puppet
  raster non poteva mostrare. Anche **di spalle**, un colpo produce un lampo verde sulla nuca.

#### 🟢 Rimosso il "cerchio verde" attorno al nemico
- Eliminato il **disco verde** che compariva attorno allo zombie quando era **avvelenato** (indicatore veleno):
  ora il veleno si legge **solo** dalle piccole particelle verdi che salgono.
- Per i **puppet** l'**alone emissivo** generico è stato reso **molto più tenue e stretto** (niente più anello
  verde evidente); resta solo un filo di visibilità nel buio. L'alone pieno resta invariato per boss/elite.

#### 🧪 Test
- Nessuna regressione: **190 passati, 0 falliti**.

---

### [1.37.0] — 2026-08-10 · "Roster essenziale: SOLO lo Zombie Putrido (render PUPPET), attacco carica→colpo & ombra a terra"

#### 🧟 Un solo nemico: lo Zombie Putrido (PUPPET) sostituisce il vettoriale
- **Rimossi tutti gli altri nemici vettoriali** dal pool ondate: **Negromante**, **Spettro** e **Occhio Vagante**
  escono da `MONSTERS`, dall'`ORDER` e da `poolForWave`. Il bestiario d'ondata riparte da **un solo archetipo**.
- Lo **Zombie Putrido** (id `skeleton`, così boss/summon restano compatibili) ora è reso con il **RENDER PUPPET**
  (raster ibrido: 6 pezzi PNG + overlay vettoriale) e **sostituisce** il vecchio zombie vettoriale (shape `zombie`).
  Stat riviste: 78 PV, vel. 100, raggio 18, danno 14.

#### 🎞️ Nuova animazione d'ATTACCO in due tempi (carica → colpo)
- L'attacco non è più un semplice "protendersi": ora fa una **carica** (braccia alzate/indietro, busto reclinato,
  testa su) seguita dal **colpo** (braccia scagliate in avanti, **affondo del corpo in avanti**, testa protesa,
  spinta sulle gambe) e recupero. Guidato dall'evento `melee` esistente.

#### 🌑 Ombra a terra & maggiore realismo
- Aggiunta una **piccola ellisse nera sfocata alla base** dei piedi (Gaussian blur), che si **stringe** quando il
  passo solleva il corpo e **segue l'affondo** in attacco: il mostro appare **radicato sulla mappa**, non "appiccicato".
- La vecchia ombra generica dei mostri è **disattivata per i puppet** (niente doppia ombra).

#### 🚶 Camminata ritarata (più aggressiva e pesante)
- **Falcata più ampia** (`leg` 26→37, `arm` 20→26) e **cadenza più lenta** (`cad` 1.35→1.05), con più ondeggio e
  waddle: incedere da bruto. Costanti raggruppate in `WALK` dentro `_ghoulPuppet`.

#### 🧪 Test
- Suite aggiornata al nuovo roster: **190 passati, 0 falliti**.

---

## [1.35.0] — 2026-08-09 · "Troll rimosso · Mercante Nero riempito · Occhio Vagante: lo Sguardo"

### 🗑️ Troll delle Caverne rimosso
- Il **Troll** è stato **rimosso dal roster** (sprite non soddisfacente): tolto da `MONSTERS`, dall'`ORDER`
  del bestiario e dal pool delle ondate. Il pool passa a **4 archetipi** (zombie, spettro, negromante, occhio).

### 🖤 Fix Mercante Nero "vuoto"
- **Sintomo:** il box del Mercante Nero appariva **centrato ma senza offerte** (finestra vuota).
- **Causa:** `HUD._renderMerchant()` viene richiamato a **ogni snapshot** (~20/s) per aggiornare le monete e
  faceva `innerHTML=''` **ricreando le card** ogni frame. Le card del Nero hanno l'animazione d'ingresso
  `darkCardIn` (opacity 0→1 con delay): ricreandole in continuazione restavano di fatto a **opacity 0**.
- **Soluzione:** le card ora vengono **ricostruite solo quando cambia l'offerta** (firma degli id); a ogni
  frame si aggiorna **solo** il conteggio monete e lo stato "acquistabile". Nessun restart dell'animazione.

### 👁 Occhio Vagante — nuovo attacco "SGUARDO" (gaze debuff)
- **Niente più proiettili:** l'Occhio ora **non spara**. Il suo attacco è lo **Sguardo**: se il giocatore entra
  nel suo **campo visivo** (cono attorno alla direzione dello sguardo, entro gittata e con **LOS libera**) subisce
  un **debuff** che si rinnova finché resta "sotto gli occhi".
- **Tre tipi di sguardo** (uno fisso per ogni occhio, assegnato allo spawn):
  - 🟠 **weaken** — *attacco indebolito* (danno inflitto ridotto)
  - 🔵 **slow** — *velocità ridotta*
  - 🟣 **sunder** — *meno difesa* (danni subiti aumentati)
- **Grafica:** **sprite ridotto del 20%**, **tentacoli disposti tutt'intorno** al bulbo (a raggiera, ondeggianti),
  **cono/fascio dello sguardo** colorato per tipo e **aura tratteggiata** sul giocatore mentre è debuffato.
- IA `gazer` (sostituisce `strafer` per l'occhio): continua a fluttuare orbitando a distanza ("vagante").

---

## [1.33.0] — 2026-08-09 · "Mercante Nero: box centrato e cliccabile (fix definitivo)"

### 🖤 Fix Mercante Nero
- Il box con le 3 offerte del **Mercante Nero** ora appare **esattamente al centro dello schermo**,
  non più troppo in basso e **senza sovrapporsi alla barra delle abilità/oggetti**.
- **Causa risolta:** il centraggio dipendeva dallo stesso `transform` usato anche dall'animazione di
  scala; qualsiasi interferenza faceva ricadere il pannello sulla posizione base (`bottom:96px`).
- **Soluzione robusta:** centraggio disaccoppiato dal transform tramite `inset:0 + margin:auto`
  (con `!important`), mentre l'animazione usa ora **solo `scale()`** attorno al centro. Il box resta
  centrato in ogni condizione.
- Aggiunti `max-height:88vh` + `overflow:auto` per sicurezza su schermi piccoli.
- **Cliccabilità verificata:** `pointer-events:auto` su pannello e card, `z-index:36` (il più alto
  in-game: i menu a schermo intero sono nascosti durante la partita), overlay a `box-shadow` che non
  intercetta i click. Le 3 offerte restano selezionabili col mouse.

---

## [1.32.0] — 2026-08-09 · "Bestiario ampliato: Spettro & Occhio Vagante, Troll rifinito, Mercante Nero al top"

### 👻 Nuovo nemico — SPETTRO
- **Sprite etereo/translucido** in vista frontale: cappa spettrale che sfuma in **code ondulate**, scie/wisp
  emissive, artigli protesi e **occhi ardenti**. Corpo con alfa animata (respiro spettrale).
- **IA `wraith`** (nuova): avanza rapido in mischia e periodicamente **"sfasa" (phase-blink)** verso il
  bersaglio, riemergendo alle sue spalle **attraversando gli ostacoli**. Breve stordimento dopo il blink.
- Stat: tier 2, 92 PV, veloce (134), 19 dmg, mischia. Entra nel pool dall'**ondata 2**.

### 👁️ Nuovo nemico — OCCHIO VAGANTE
- **Sprite bulbo oculare** fluttuante con **eye-stalks** superiori e **tentacoli** inferiori, aura emissiva,
  vene rosse, **iride che segue** e **pupilla che dilata in attacco**, palpebre carnose a mandorla.
- **IA `strafer`**: orbita a distanza e scaglia **raggi arcani**. Stat: tier 3, 118 PV, 15 dmg, gittata 320.
  Entra nel pool dall'**ondata 4**.

### 🪓 Troll — sprite rifinito
- Confermata la resa v1.32 in vista frontale: braccia massicce **senza mani/artigli**, occhi **rossi**,
  niente fascia-occhi né zanne (non è un vampiro), passo e respiro animati.

### 💀 Mercante Nero — restyle "al top"
- Figura incappucciata più curata: **veste con gradiente**, **bordo runico pulsante**, **spalle a punta
  bordate**, **cappuccio definito**, volto-teschio con **occhi ardenti viola** e **mani ossute** che
  presentano la merce. Beacon a **doppia colonna** (viola + cremisi) e anello pulsante per individuarlo.

### 🧟 Pool ondate — 5 archetipi
- Pool aggiornato a **zombie · spettro · negromante · occhio vagante · troll** con sblocco progressivo.

### ✅ Qualità
- Suite: **177 test automatici, 0 falliti**.

---

## [1.31.0] — 2026-08-09 · "Ampolla della salute, Troll anticipato e Mercante Nero al centro"

### 🧪 HUD — Ampolla dei Punti Salute + Vite (a fianco della barra abilità)
- **Nuovo indicatore scenografico**: i **punti salute** ora sono mostrati come un'**ampolla/boccetta** di vetro
  che si riempie di liquido rosso in base alla percentuale di HP, con il **numero PV** al centro e il totale sotto.
- Sotto l'ampolla una **fila "VITE"** con i cuori corrispondenti alle vite rimanenti.
- Il gruppo è stato **spostato a fianco della barra abilità** ed è **molto più grande** di prima.
- **Effetto low-HP**: sotto il 30% il liquido diventa rosso acceso e l'ampolla **pulsa**.
- 🔴 **Ampolla rossa**: il liquido usa ora una gradiente **rosso vivo** (`#ff2e2e → #e01020 → #8a0410`) con superficie
  rossa più marcata; il low-HP passa al **rosso puro** (`#ff1520`).

### 🕯️ Mercante Nero — animazione d'ingresso
- La finestra `dark` ora **compare con un'animazione** (`darkMerchIn`): sale in scala con un piccolo overshoot e un
  leggero *rotate*, mentre l'**aura viola/cremisi pulsa** (`darkMerchAura`) e il titolo ha un **glow ritmico**
  (`darkHeadGlow`). Le tre carte entrano **sfalsate** dal basso (`darkCardIn`).
- I vecchi chip `❤️ hp/mhp` e `vite` sono stati **rimossi** dal blocco statistiche in basso a destra
  (restano uccisioni 💀, XP ✦ e monete 🪙).

### 👹 Troll dall'ondata 3 (prima era dall'ondata 5)
- Il **Troll delle Caverne** entra ora nel pool delle ondate a partire dalla **wave 3** (`poolForWave`).

### 🕯️ Mercante Nero al centro dello schermo
- La finestra del **Mercante Nero** (variante `dark`) ora compare **centrata verticalmente e orizzontalmente**
  con un leggero ingrandimento e un **velo scuro** di sfondo per farla risaltare come una scelta importante.
  Il **Mercante Errante** normale resta ancorato in basso.

---

## [1.30.0] — 2026-08-09 · "Bestiario essenziale: Zombie, Negromante, Troll in vista frontale"

### 👾 Roster ridotto a 3 archetipi (grigio molto molto scuro)
- **Rimossi tutti gli altri nemici**: via `orc`, `assassin`, `wyvern`, `lich` e il `dragon` regolare dal
  bestiario giocabile. Restano **solo tre** mostri d'ondata: **Zombie Putrido** (`skeleton`), **Negromante**
  (`darkmage`) e **Troll delle Caverne** (`troll`).
- 🪤 **Mimic MANTENUTO come cassa**: la **Bestia Mimica** (`mimic`) resta nel gioco **esclusivamente come cassa-mima**
  e nella modalità **TESORO**. È fuori dal pool delle ondate (`weight: 0`, flag `chestOnly`), quindi non appare mai
  tra i nemici normali ma solo quando una cassa si rivela un mimic. Recuperata la sua def (150 HP, IA `ambush`, sprite
  a forziere top-down): aprire una cassa-mima ora evoca di nuovo un **vero mimic** e non un ripiego.
- 🎨 **Nuova palette**: i tre mostri d'ondata ridipinti in **grigio molto molto scuro** (`#2c2e2c` / `#26272c` /
  `#2e302d`), con **occhi/accento luminosi** a dare personalità (zombie verde acido, negromante viola, troll ambra).

### 🖼️ Sprite in VISTA FRONTALE (billboard) — nuovo stile dark-cartoon
- I tre mostri non ruotano più con la direzione (top-down): sono **billboard frontali** che **guardano la camera**,
  si **specchiano** in orizzontale verso il movimento e mostrano il **dorso** quando si allontanano verso l'alto.
- 🧟 **Zombie**: corpo ingobbito, braccia penzolanti con mani ad artiglio, occhiaie nere con bagliore, **mascella che
  si spalanca** in attacco, ferite e punti di sutura.
- 🧙 **Negromante**: **veste a campana** con orlo ondeggiante e rune luminose, mantellina/colletto, **cappuccio-vuoto**
  con occhi ardenti, **cappello a punta** a tesa larga e **bastone con orbe** che divampa durante il cast.
- 👹 **Troll**: **torso a masso** ingobbito, **braccia lunghissime** con pugni enormi e artigli che sfiorano il suolo,
  gambe tozze, **zanne** e occhi ambra; alza il pugno per lo **slam**.
- ⚙️ Nuove routine `_front` / `_zombieF` / `_necroF` / `_trollF` nel `renderer.js`, con flag `front: true` sul def del
  mostro. La morte usa un **collasso frontale** dedicato (niente più rotazione).

### 🌊 Ondate & bilanciamento
- `poolForWave` semplificato al nuovo trio: **Zombie** (base, peso 40), **Negromante** (dall'ondata 3, peso 16),
  **Troll** (dall'ondata 5, peso 9). Il **mimic non è nel pool** (compare solo dalle casse). I boss restano invariati
  e continuano a evocare zombie.

### 🧪 Test
- **175 passati, 0 falliti** (`node test/simulate.js`).

---

## [1.29.0] — 2026-08-09 · "Negromante: proiettili in vista, evocazioni al buio"

### 💀 IA del Negromante ridisegnata (nuovo comportamento `necromancer`)
- Il **Negromante** (`darkmage`) ora adatta la tattica alla **linea di vista** verso il bersaglio:
  - **Se sei nel campo visivo** (LOS libera **e** entro gittata), lancia **proiettili magici** — colpo singolo con
    ogni terzo tiro a **ventaglio (3 proiettili)** — mantenendo le distanze (kiting) come prima.
  - **Se sei nascosto** (nessuna LOS), **evoca scheletri** a cadenza (`summonCount: 2` ogni `summonCd: 8s`) e
    **avanza** verso la tua ultima posizione per **stanarti** e riguadagnare la linea di tiro.
- ⚙️ Nuovi parametri sul def `darkmage`: `summon: 'skeleton'`, `summonCd: 8`, `summonCount: 2`, `ai: 'necromancer'`.
- 🎨 L'anello dell'evento `summon` è ora **color-aware**: l'evocazione del Negromante appare nel suo **viola** (`projColor`)
  invece del ciano del Lich (client `main.js`, evento `summon` con campo `c`).
- 🧪 Il vecchio comportamento generico `caster` resta nel codice ma non è più usato da nessun mostro.
- 🧪 Test: **180 passati, 0 falliti**.

## [1.28.1] — 2026-08-08 · "Assassino d'Ombra ridisegnato"

- 🗡️ Nuovo sprite per l'**Assassino d'Ombra** (shape `assassin`), nello stile dark-fantasy vettoriale:
**mantello a freccia** rivolto in avanti, **doppie lame** (ai lati a riposo, incrociate in avanti durante l'attacco),
**cappuccio a punta**, viso in ombra con **occhi magenta affilati** e una **scia di fumo/ombra** dietro che
sottolinea la sua agilità. Lo swing d'attacco è pilotato dall'evento `melee` già esistente (AI `flanker`).
- 🧪 Test: **180 passati, 0 falliti**.
- ℹ️ Nota: la proposta del **Troll** è stata scartata (nessuna modifica al Troll in questa release).

## [1.28.0] — 2026-08-08 · "Maledizione del Negromante + cunicoli a prova di boss"

### 💀 Maledizione del Negromante (danno + indebolimento)
- Gli incantesimi del **Negromante** ora, oltre a fare danno, **maledicono** il bersaglio: per **4,5s** il giocatore
è **indebolito** — danno inflitto **−40%** e velocità **−20%** (costanti `CURSE_TIME`, `CURSE_DMG_MULT`,
`CURSE_SPEED_MULT`).
- Compare la **notifica "💀 SEI STATO MALEDETTO"** (banner viola + floater), con **aura viola** e volute attorno al
personaggio finché dura l'effetto. Nuovo flag `cu` nello snapshot; evento `cursed` gestito dal client.
- Il flag viaggia sul proiettile (`curse`) partendo dalla def del mostro (`darkmage.curse = true`), quindi è
riutilizzabile per futuri lanciatori.

### 🕳️ Cunicoli a prova di boss (larghezza garantita)
- Nuova passata `widenForBoss()` nel mapgen: **allarga automaticamente i colli di bottiglia** portando ogni
corridoio ad **almeno 3 tile (144px)**, così anche il mega-boss (**AZ'GAROTH**, raggio 52) passa ovunque.
- **Prima:** solo **83,3%** delle mappe erano pienamente boss-navigabili (spawn↔uscita). **Ora: 100%**
(verificato su 2100 combinazioni seed×livello con `test/verify_boss_paths.js`).
- I blob-caverna restano intatti: la densità dei muri resta ~34% (nessuna mappa "svuotata").

### 🧪 Test
- **node test/simulate.js: 180 passati, 0 falliti** · **verify_boss_paths: 2100/2100 (100%)**.

## [1.27.1] — 2026-08-08 · "Braccia dello zombie con mani (staccate dal corpo)"

- 🖐️ Le braccia dello **Zombie Putrido** sono ora disegnate **sopra il corpo** (non più inglobate dall'ellisse):
hanno **spalla** distinta (tono scuro = stacco), **gomito** e una **mano** tonda con **artigli** in fondo.
A riposo pendono ai lati; in attacco si protendono in avanti con le mani. Niente più braccia "attaccate al corpo".
- 🧪 Test: **180 passati, 0 falliti**.

## [1.27.0] — 2026-08-08 · "Braccia ai lati & rimozione del Predone Goblin"

### 🦾 Zombie — braccia ai lati
- Le braccia dello **Zombie Putrido** ora scendono **lungo i fianchi** a riposo (idle/camminata) e si protendono
**in avanti solo durante l'attacco** (morso). Eliminato l'effetto "insettoide" delle braccia sempre protese.
La testa resta centrata (fix v1.26.1). Anche l'animazione di morte eredita la nuova posa.

### 🗑️ Rimosso il Predone Goblin
- Il nemico **goblin** (Predone Goblin) è stato **rimosso** dal roster: tolto da MONSTERS e dall'array ORDER.
- **Dipendenze gestite** per evitare crash:
  - Il **Signore della Guerra Orchesco** ora evoca **Zombie Putridi** (summon 'goblin' → 'skeleton').
  - Il **filler** delle ondate boss (server) e il **pool** delle ondate usano ora lo **Zombie Putrido** al posto
del goblin (peso ribilanciato: skeleton 34).
  - **Fallback** MONSTERS.goblin → MONSTERS.skeleton in Room.js e renderer.js.
- Roster attuale: **9 nemici** standard + 3 boss.

### 🧪 Test
- Suite aggiornata (riferimenti goblin → skeleton): **node test/simulate.js: 180 passati, 0 falliti**
(un test in meno nel "sanity" perché c'è un tipo di nemico in meno — atteso).

## [1.26.1] — 2026-08-08 · "Testa centrata (top-down con viso visibile)"

- 🎯 **Fix estetico** sui 3 nuovi sprite (`zombie`, `brute`/orco, `mage`/negromante): la **testa** era disegnata
troppo in avanti e "sporgeva" dal corpo. Ora è **centrata sopra il corpo** (offset all'indietro tramite `translate`),
per un effetto **vista dall'alto con volto visibile**. Braccia protese, ascia, bastone/orbe e animazioni di
attacco/morte restano invariati. Anche il Signore della Guerra (shape `brute`) eredita il fix.
- 🧪 Test: **181 passati, 0 falliti**.

## [1.26.0] — 2026-08-08 · "Nemici ridisegnati + animazioni di attacco e morte"

### 👹 3 nemici ridisegnati (stile dark-fantasy vettoriale)
- **🧟 Zombie Putrido** (ex "Guerriero Scheletro", id interno invariato) — corpo curvo con **braccia protese**,
**occhi neri vuoti** dal fioco bagliore verdastro, macchia di sangue e spina esposta. Ora **strascica** verso i
giocatori (AI `swarm`, niente più parata frontale) ed è un po' più coriaceo e lento.
- **🧙 Negromante** (ex "Mago Oscuro") — **cappuccio** profondo con **occhi viola ardenti**, **veste a campana** con
orlo runico e **bastone** con **orbe** che pulsa.
- **🪓 Orco Berserker** — **ascia a doppia lama** impugnata, **zanne**, **occhi rossi**, spalle con **spuntoni** e
muscolatura verde. (Anche il Signore della Guerra ne eredita la resa.)

### 🎞️ Animazioni di ATTACCO e MORTE (nuove)
- **Attacco** (parametrico, guidato dagli eventi del server): lo **zombie** spalanca la mascella e allunga le braccia
nel morso, il **negromante** fa **divampare l'orbe** mentre evoca, l'**orco** **alza e cala l'ascia** con un ruggito.
Nuovo evento `cast` per i lanciatori; gli eventi `melee`/`lunge` ora trasportano l'`eid` del mostro.
- **Morte**: ogni nemico ucciso lascia uno **sprite di morte effimero** che **crolla, si accascia e svanisce**
(dissolvenza + rotazione + schiacciamento). Il **negromante** si **dissolve in volute viola**. L'evento `mkill`
trasporta ora il `facing`.

### 🧰 Note tecniche
- Nessuna nuova dipendenza (Canvas 2D puro). Sprite **parametrici** `_shape(ctx, …, t, atk)`: idle/camminata dal
tempo, attacco dalla fase `atk`, morte gestita da sprite effimeri lato client (`R.mAtk` / `R.deaths`).
- Solo questi **3** nemici sono stati ridisegnati/animati in questa release (gli altri seguiranno).

### 🧪 Test
- **node test/simulate.js: 181 passati, 0 falliti** (stabile).

## [1.25.0] — 2026-08-04 · "Terzo lotto di oggetti scenografici"

### 🗿 6 nuovi oggetti scenografici (terzo lotto, per tema)
- **🌉 Ponti di legno** (`bridge`) — assi con travi e chiodi, sopra una fenditura scura.
- **🪜 Scale a chiocciola** (`spiral_stairs`) — gradini a spirale che scendono in un pozzo buio.
- **⛲ Pozzi / cisterne** (`well`) — con acqua che luccica (glow del tema), arco e carrucola.
- **⚙️ Grate / inferriate** (`grate`) — griglia metallica su un pozzo scuro nel pavimento.
- **💠 Cristalli giganti** (`giant_crystal`) — **landmark** luminoso a più facce (glow ampio del tema).
- **🗿 Statue rituali con gemma** (`gem_statue`) — figura incappucciata che regge una **gemma luminosa**.
- Nuove **zone tematiche** (passaggio, discesa, cisterna, officina, geode, reliquiario) legate ai **temi**
  (Cripta/Lava/Foresta/Ghiaccio/Arcano), sempre col **cap 3-4 istanze per tipo**.

### 📦 Totale scenografia
- Con i 3 lotti la mappa dispone ora di **18 oggetti scenografici** (oltre a bracieri, torce, tombe, casse, ecc.).

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile); verificato su 200 mappe/5 temi: 0 crash, cap ≤4,
  tutti i nuovi oggetti presenti.

---

## [1.24.0] — 2026-08-04 · "Secondo lotto di oggetti scenografici"

### 🗿 6 nuovi oggetti scenografici (secondo lotto, per tema)
- **🏛️ Archi diroccati** (`arch`) — architettura in rovina, un pilastro spezzato.
- **🧊 Stalattiti** (`stalactite`) — pendono dal soffitto (con goccia; ghiaccioli nel tema Ghiaccio).
- **☠️ Forche / patiboli** (`gallows`) — con cappio e teschio appeso.
- **🔮 Obelischi arcani** (`obelisk`) — rune incise **pulsanti** ed emissione di **glow** del colore del tema.
- **🏮 Lanterne appese** (`hanging_lantern`) — **illuminano** con luce calda.
- **🩸 Macchie di sangue** (`bloodstain`) — decal piatte a terra (racconto ambientale).
- Distribuiti come **zone tematiche coerenti** (rovine, grotta, patibolo, santuario, sala illuminata, massacro) e
  legati ai **temi** (Cripta/Lava/Foresta/Ghiaccio/Arcano). Sempre col **cap 3-4 istanze per tipo**.

### 🧰 Note tecniche
- Tutto in **Canvas 2D puro, zero dipendenze**. Lanterne e obelischi si agganciano al sistema di luci (torce/glow).
- Aggiunto un **guard** nel piazzatore feature per robustezza (nomi zona sconosciuti ignorati).

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile); verificato su 150 mappe/5 temi: 0 crash, cap ≤4,
  tutti i nuovi oggetti presenti.

---

## [1.23.0] — 2026-08-04 · "Muri neri, terreno vivo, nuovi oggetti & fix mercante"

### 🖤 Ambiente
- **Muri QUASI NERI** — contrasto muri/pavimento portato da `0.50` a **`0.15`**: la roccia dei muri è ora quasi nera
  e si stacca nettamente dal pavimento (invariato). Con l'ombra marcata di bordo lo stacco è fortissimo.
- **Terreno meno "piatto"** — il pavimento è ora punteggiato di **rocce, massi, ciottoli e buche/crateri** sparsi
  (dettagli cosmetici baked, non bloccanti) → varietà e profondità.
- **Crepe grandi (2-3 per mappa)** — rimosse le rune/glifi pulsanti (non piacevano); al loro posto **2-3 fissure**
  molto più **grandi** (≈5-6× più lunghe, ~2× più larghe), ramificate e scure, come vere spaccature del terreno.

### 🗿 Primo lotto di 6 nuovi oggetti scenografici (per tema)
- **🪨 Stalagmiti**, **💀 Pile di teschi (catacomba)**, **🧱 Macerie / muro crollato**, **🕸️ Ragnatele giganti
  d'angolo**, **💎 Cristalli luminosi** (emettono glow), **🔥 Altari rituali** con candele accese (illuminano).
- Distribuiti con **coerenza per tema** (Cripta/Lava/Foresta/Ghiaccio/Arcano) come **zone**, sempre col **cap 3-4
  istanze per tipo** (solo le torce restano numerose).

### 🐀 Animaletti
- **Più grandi (≈2×)** — ratti, ragni e scarafaggi ora ben visibili sul pavimento.

### 🛒 Mercante Errante (fix + visibilità)
- **Fix click**: il pannello del mercante non rispondeva ai click (ereditava `pointer-events:none` dall'HUD) →
  ora **`pointer-events:auto`**: si può acquistare cliccando le offerte.
- **Più visibile**: **beacon sempre acceso** sul mercante (colonna di luce dorata + anello pulsante + etichetta
  "🪙 Mercante" sempre visibile), **marker sulla minimappa** (oro per l'ufficiale, viola per il Nero) e alone più
  ampio nel buio della torcia.

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile su run ripetute).

---

## [1.22.0] — 2026-08-04 · "Caverna organica, ombre nette, animaletti & decorazioni a cluster"

### 🗺️ Conformazione mappa (torna organica)
- **Generazione ORGANICA (caverna varia)** — abbandonato il layout a stanze (troppo "piatto/vuoto"): la mappa torna
  al metodo a **blob di roccia** con anfratti, nicchie e passaggi irregolari, **connettività garantita** (le sacche
  isolate vengono murate; verificato su run ripetute).

### 🖤 Muri & profondità
- **Contrasto muri/pavimento a 0.50** — la roccia dei muri è scurita al 50% del colore del tema: netta distinzione
  dal pavimento (invariato).
- **Ombra MARCATA muro→pavimento** — drop-shadow forte + **linea di contatto scura** al bordo: lo **stacco** tra
  muro e pavimento ora si legge chiaramente (profondità/rilievo).

### 🐀 Vita nel dungeon
- **Animaletti** — piccoli **ratti, ragni e scarafaggi** che sfrecciano a scatti sul pavimento (cosmetici, evitano
  i muri, si riciclano attorno alla telecamera). Puramente atmosferici.

### 🕯️ Decorazioni coerenti e limitate
- **A CLUSTER, non a caso** — le decorazioni sono ora raggruppate in **zone tematiche** coerenti: **cimitero**
  (tombe + ragnatele + sarcofago), **ossario** (falò + ossa/teschi + cadavere), **deposito** (casse/barili/sacchi +
  **cassa scenografica/forziere**), **fungaia** (funghi bioluminescenti), **gabbia** (con catene e resti), più
  **bracieri** sparsi come luce.
- **Cap 3-4 per tipo** — nessun oggetto ripetuto 20 volte: ogni tipo compare **al massimo 3-4 volte**. **Unica
  eccezione: le torce appese ai muri**, numerose e distribuite regolarmente.

### 👹 Mimic
- **Mimic più presenti** — compaiono già dall'**ondata 4** (peso aumentato) e le **casse-mima** salgono al **30%**
  (le casse scenografiche possono rivelare un mimic).

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile); connettività della caverna organica e "giocatori
  mai nei muri" verificate.

---

## [1.21.0] — 2026-08-04 · "Muri quasi neri, nebbia volumetrica & rune pulsanti"

### 🖤 Muri più scuri
- **Muri MOLTO più scuri (quasi neri)** — la texture roccia dei muri è ora scurita al ~30% del colore del tema
  (`#080a10`-ish), così si **distingue nettamente** dal pavimento (rimasto invariato, che andava benissimo).

### 🌫️ Atmosfera
- **Nebbia volumetrica a strati** — banchi di foschia semitrasparenti che **derivano lentamente** in world-space,
  con leggera pulsazione: profondità e atmosfera. Si dirada nel buio della modalità torcia.
- **✨ Rune / crepe che pulsano sul pavimento** — decal luminose (crepe ramificate e sigilli runici) sparse sul
  terreno, del **colore del tema**, con **glow additivo pulsante**. Emettono luce (si intravedono anche col buio
  della torcia) e danno un tocco "arcano" al dungeon.

### 🗑️ Rimozioni (richieste)
- **Rimossi i laghi/pozze** (hazard `T_HAZARD`) dalla generazione.
- **Rimossi colonne, pilastri e statue** (incl. statue demoniache) da tutte le stanze e dal mix decorativo; al loro
  posto, al centro, qualche fungo bioluminescente. Restano bracieri, gabbie, depositi (casse/barili/sacchi) e fungaie.

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile); connettività e "giocatori mai nei muri" ok.

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Nebbia e rune sono **Canvas 2D puro**, disegnate a runtime (le rune pulsano). Le rune
  sono generate deterministicamente dal seed della mappa.

---

## [1.20.0] — 2026-08-04 · "Stanze grandi, pozze-lago & decorazioni ricche"

### 🏛️ Architettura mappa (niente più cunicoli stretti)
- **Layout a STANZE garantito** — ogni livello ha ora una **stanza centrale grande** con **4 stanze angolari**
  (NO / NE / SO / SE) collegate da **corridoi larghi 3 tile**: il **boss di fine livello passa ovunque** e i nemici
  non restano più incastrati. Un **anello** di corridoi opzionale fra le stanze aggiunge varietà.
- **Connettività garantita** (flood dal centro; sacche isolate murate). Spawn al centro, **uscita** nella stanza
  angolare più lontana, spawn nemici distribuiti nelle stanze.

### 💧 Pozze naturali (tipo lago)
- **Solo 1-2 pozze per mappa** (prima erano troppe), collocate **dentro le stanze** angolari.
- **Forma organica irregolare** cresciuta a random-walk (niente più "pallini"): resa più da **lago/stagno** —
  colore **desaturato** (meno fumettoso), profondità al centro, riflesso tenue in superficie. Del colore del tema,
  brilla intravedendosi nel buio. La meccanica (danno) resta.

### 🕯️ Decorazioni ricche e bilanciate
- Nuovi elementi scenografici disegnati in Canvas 2D: **🔥 bracieri** e **🕯️ candelabri** (che **illuminano** davvero),
  **🍄 funghi bioluminescenti** (glow nel buio), **📦 casse**, **🛢️ barili**, **🧺 sacchi**, **😈 statue demoniache**
  (occhi luminosi), **⛓️ gabbie sospese con scheletro** (teschio + costole), più **🏛️ pilastri**.
- Distribuite **con criterio**: bracieri/pilastri lungo i muri, una **feature caratteristica** per stanza angolare
  (statua / gabbia / stash di casse-barili-sacchi / fungaia / candelabro), una statua imponente al centro, e un
  leggero scatter macabro. Niente affollamento.

### 🎨 Texture
- Il pavimento e i muri mantengono la **texture roccia realistica** (rilievo/bump) della v1.19; le nuove decorazioni
  sono realizzate allo stesso livello di dettaglio (ombre, gradienti di volume, luci).

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile su run ripetute); connettività e "giocatori mai nei
  muri" verificate sul nuovo layout a stanze.

---

## [1.19.0] — 2026-08-04 · "Texture roccia realistica, stanze attigue & niente glow"

### ✨ Grafica ambiente
- **🪨 Texture ROCCIA realistica** (pavimento e muri) — sostituito il vecchio "mottling" con vera roccia procedurale:
  - **Rilievo/bump**: una *heightmap* a rumore viene illuminata da una luce direzionale → superficie **scolpita in 3D**
    (creste chiare, incavi scuri, luccichii minerali).
  - **Domain warping** + **Voronoi**: massi irregolari e crepe organiche, **niente griglia**.
  - **Umidità** (macchie scure) e **muschio** (chiazze verdastre) sul pavimento; muri più scuri con crepe marcate.
  - Le texture sono **colorate sul tema** corrente (cripta/lava/foresta/ghiaccio/arcano) e generate una volta per mappa
    come *pattern* — **Canvas 2D puro, zero dipendenze**.
- **🚪 Mappa meno "quadratona" → STANZE minori attigue** — nuovi **tramezzi** parziali con **varchi/porte** che spezzano
  i grandi open-space in stanze comunicanti (agganciati ai muri, per sembrare pareti vere). **Connettività garantita**:
  ogni tramezzo è applicato solo se la mappa resta *interamente* percorribile, altrimenti annullato.
- **🚫 Glow rimosso** — eliminato il bloom/post-processing (e il tasto `B`): schermo più pulito e nitido, come richiesto.
  La modalità **torcia** (tasto `L`) e l'alone tondo restano.

### 🐛 Correzioni (test)
- Risolta la regressione di connettività introdotta dai tramezzi → **collaudo a 0 falliti** su 10 run consecutive.

### 🧪 Test
- **`node test/simulate.js`: 0 falliti** (stabile su 10 run).

---

## [1.18.0] — 2026-08-04 · "Caverna vera: terra/roccia, pozze uniche & decorazioni"

### ✨ Ambiente (revisione richiesta)
- **🕳️ Look da CAVERNA (niente più griglia)** — pavimento e muri completamente ridisegnati:
  - **Pavimento "terra"** organico: base uniforme + **mottling** morbido (macchie sovrapposte) + qualche ciottolo,
    **senza** più checkerboard né linee di piastrella.
  - **Muri "roccia"** grezza: chiazze chiare/scure, crepe sparse e **cresta illuminata** in cima ai muri esposti.
  - **Bordo caverna**: ombra morbida (ambient occlusion) sul pavimento accanto ai muri → senso di profondità.
- **🩸 Pozze come forma UNICA irregolare con profondità** — niente più "pallini attaccati": le celle-pozza
  adiacenti si **fondono in una sola macchia organica** (union di cerchi), con **conca scura** attorno (il pozzo
  scavato), **centro più scuro** (profondità) e riflesso sulla superficie. Restano del **colore del tema**
  (acido/fuoco/freddo/arcano) e brillano intravedendosi nel buio.

### 🧹 Decorazioni & torce (revisione richiesta)
- **🪦 Rimesse le decorazioni** — bare, scheletri, ossa, accampamenti, rocce, cadaveri, colonne, ecc. (mix per tema
  di nuovo ricco) e densità decori ripristinata (scatter 12 → **34+**).
- **🔥 Torce molto meno frequenti** — rimossa la passata casuale fitta sui muri; lungo i lati **poche** torce a
  **grande distanza e irregolari** (niente più griglia di aloni arancioni).

### 🐛 Correzione (test)
- Stabilizzati i test intermittenti (mercante + homing + soglia snapshot) → **collaudo a 0 falliti** su run ripetute.

### 🧪 Test
- **`node test/simulate.js`: 0 falliti** (stabile su più run).

---

## [1.17.0] — 2026-08-04 · "Dungeon di pietra: mappa ripulita, pozze & torce ai lati"

### ✨ Illuminazione
- **⭕ Alone tondo grande (niente più cono)** — rimosso il cono di luce direzionale; ora ogni eroe è avvolto da un
  **grande alone circolare** (raggio `haloR` 130 → **260**), morbido ai bordi. In co-op uno per ciascuno.
- **🌗 Mappa un filo meno scura** — `darkness` 0.94 → **0.86**, così si legge meglio l'ambiente attorno.
- **🔥 Torce ai LATI della mappa** — nuove torce disposte lungo il **perimetro** a intervalli regolari: illuminano
  i bordi e danno punti di riferimento nel buio.

### 🗺️ Mappa (stile pietra, più pulita)
- **🧱 Pavimento e muri in pietra** — bake ridisegnato: **lastre** di pietra con fughe/rilievo e variazione tonale,
  **muri a blocchi** con luce in alto, ombra in basso, giunzioni e crepe. Struttura del livello invariata (niente
  micro-stanze), solo resa migliore.
- **🧹 Meno "roba alla rinfusa"** — densità decorazioni ridotta drasticamente (scatter 42→**12**, meno oggetti negli
  accampamenti e nelle nicchie) e **mix per tema semplificato** (pochi elementi caratteristici invece di tanti
  ammassati).

### ☠️ Pericoli a pavimento
- **🗑️ Rimossi gli spuntoni** (trappole `T_TRAP`): non compaiono più sul pavimento.
- **🟢 Rimosso il "pavimento a pallini"**: l'hazard è ora una **pozza** vera.
- **🩸 Nuove pozze tematiche** — acido / fuoco / freddo / arcano **del colore della mappa** (verde, arancio, azzurro,
  viola a seconda del tema): forma organica, bordo luminoso, e **brillano** intravedendosi nel buio. La meccanica
  (danno calpestandole) resta.

### 🐛 Correzione (test)
- Stabilizzato il test intermittente del mercante (a fine round lo spawn è casuale ufficiale/nero) → **collaudo a
  0 falliti** su run ripetute.

### 🎛️ Parametri regolabili (`renderer.js`)
- `haloR` (alone attorno all'eroe), `darkness` (buio mappa), `bloomStrength` (glow). Facili da tarare.

### 🧪 Test
- **182 test** con `node test/simulate.js`: **182 passati, 0 falliti** (stabile su 5 run).

---

## [1.16.0] — 2026-08-04 · "Torcia nel buio: mappa oscura & cono di luce"

### ✨ Grafica (tema dungeon, atmosfera horror)
- **🔦 Modalità torcia** — la mappa è ora **quasi nera** e il giocatore la "buca" con un **cono di luce** nella
  direzione di mira + un **alone ravvicinato** attorno a sé (per non essere cieco ai lati). In co-op ogni alleato
  ha il proprio cono. Realizzato con una **dark-mask** offscreen (nero + `destination-out`) → leggera, zero dipendenze.
  - Le **sorgenti** (torce, falò, portale, mercanti) e i **proiettili** restano visibili nel buio.
  - **Boss / élite / scrigno** si **intravedono** col loro alone → tensione "cosa si nasconde nel buio".
  - **Tasto `L`** per attivare/disattivare la torcia (scelta salvata in `localStorage`).
- **🌑 Bloom più tenue** — su tua indicazione il glow generale è stato ridotto (`bloomStrength` 0.85 → **0.5**):
  resta bello attorno a nemici, spari, eroi ed effetti, senza "lavare" lo schermo.
- **✨ Pulviscolo ambientale** — leggere particelle di **polvere** fluttuano nell'aria e diventano visibili quando
  entrano nel fascio di luce → profondità e atmosfera (come nello screenshot di riferimento).

### 🎛️ Parametri regolabili (in `renderer.js`)
- `darkness` (quanto è nera la mappa), `coneLen` / `coneHalf` (lunghezza/apertura del cono), `haloR` (alone attorno
  al player), `bloomStrength` (intensità glow). Tutti facilmente tarabili.

### 🧪 Test
- **182 test** con `node test/simulate.js`: **182 passati, 0 falliti** (stabile su run ripetute).

---

## [1.15.0] — 2026-08-04 · "Dungeon neon: bloom & glow"

### ✨ Grafica (tema dungeon mantenuto)
- **🌟 Bloom post-processing** — nuovo effetto di **glow diffuso** su tutta la scena: le parti luminose (proiettili,
  torce, occhi/aure dei nemici, accenti degli eroi) "irradiano" luce come nei twin-stick moderni, restando nel
  **tema dungeon cupo**. Implementato in Canvas 2D puro con canvas offscreen **a bassa risoluzione** (~1/3) +
  blur additivo → **leggero** e **zero dipendenze**.
  - **Tasto `B`** per attivare/disattivare il bloom (impostazione salvata in `localStorage`), utile sui PC lenti.
- **🔫 Proiettili neon** — nucleo bianco incandescente + alone colorato saturo + scia più lunga (blend additivo):
  con il bloom diventano vere **scie luminose**.
- **👁️ Nemici emissivi** — ogni mostro ha ora un **alone di luce** del proprio colore (più intenso per élite/boss),
  che il bloom accende dando il look "orb neon" — il corpo dungeon resta invariato.

### 🧰 Note tecniche
- Nessuna nuova dipendenza npm, nessun asset esterno. Il bloom legge il frame già renderizzato, lo scala e lo
  ricompone in `lighter`; HUD e minimappa restano nitidi (bloom applicato prima di essi).
- Le aree scure contribuiscono in modo trascurabile al blend additivo → il bloom evidenzia **solo** ciò che è luminoso.

### 🧪 Test
- **182 test** con `node test/simulate.js`: **182 passati, 0 falliti** (stabile su run ripetute).

---

## [1.13.0] — 2026-08-05 · "Entità un po' più grandi (senza perdere fluidità) & Fix Mercante Nero"

### ✨ Modifiche
- **🔎 Entità e prop leggermente più grandi, ma il gioco resta fluido** — dopo il test del raddoppio 2× (troppo
  pesante), qui si adotta un ingrandimento **leggero e mirato**:
  - **Visivo +45%** (`VIS_SCALE = 1.45`) per giocatore, nemici, **boss** e **oggetti di scena** → colpo d'occhio
    più imponente.
  - **Collisione quasi invariata** (`COL_SCALE = 1.08`): la "hitbox" resta vicinissima a quella della v1.12, così
    movimento e immediatezza **non cambiano**.
  - **Nessuna modifica** a mappa, densità nemici o `moveCircle` (restano come la v1.12 fluida).
  - **+5% velocità base** del giocatore per un feel ancora più reattivo.
  - Proiettili resi un filo più grandi (solo visivamente) per leggibilità.

### 🐛 Correzioni
- **Fix Mercante Nero** — ora, al termine del round, compare **un solo mercante**, scelto a caso: **~30%** il
  **Nero al posto** di quello ufficiale, altrimenti l'ufficiale. **Mai entrambi insieme.** Il Mercante Nero spawna
  ora in una posizione **accessibile** (micro-area o vicino allo spawn), non più nascosto lontano.

### 🧪 Test
- Aggiornato il test del mercante (mutua esclusività: mai entrambi, sempre almeno uno) e aggiunto il test del
  ridimensionamento leggero (visivo > collisione, hitbox quasi invariata, velocità mostri invariata, +5% giocatore)
  → **182 test totali**, 0 falliti; invariante "giocatori mai nei muri" verificata su solo/trio/stress.

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Costanti `VIS_SCALE`/`COL_SCALE` (valori leggeri); raggio **visivo** e di **collisione**
  separati; velocità mostri calcolata sul raggio originale (invariata). Nessuna modifica al protocollo di rete.

---

## [1.12.0] — 2026-08-04 · "Mercante Nero & HUD Ridisegnato"

### ✨ Aggiunte
- **💀 Secondo mercante: il Mercante Nero** — una figura sinistra (incappucciata dal **volto di teschio**, altare di
  pietra con rune, lanterna **viola** e relíquie fluttuanti) nettamente diversa dal Mercante Errante. Vende **patti
  rischio/ricompensa**: potenziamenti forti ma con una **maledizione** (es. *Patto del Berserker* +35% danno ma −25
  PV massimi; *Patto di Cristallo* +30% cadenza ma +12% danni subiti; *Offerta di Sangue* +2 vite ma dimezza le
  monete; *Reliquia Maledetta* un potere ma −20 PV; *Azzardo del Diavolo* effetto casuale benedizione/maledizione).
- **🎲 Apparizione casuale** — il Mercante Nero **non è sempre presente**: compare a caso (~35% delle mappe) e si
  nasconde nel punto **più lontano** dallo spawn. Il suo pannello ha uno **stile dedicato** (viola/rosso) e mostra
  chiaramente **beneficio** (verde) e **rischio** ⚠ (rosso) di ogni patto.
- **🎨 HUD ridisegnato** —
  - **Barra abilità più grande e caratteristica**: slot più ampi con **icone molto più grandi**, badge del tasto
    a pillola, **etichetta** dell'azione sotto ogni slot, cornice con vetro smerigliato e **pulsazione** quando
    l'abilità è pronta.
  - **Eventi al centro**: le notifiche (uccisioni boss, ondate, acquisti, combo, sinergie…) non compaiono più
    piccole in alto a destra, ma **al centro dello schermo**, grandi e molto visibili, con animazione di comparsa.

### 🧪 Test
- **12 nuovi test** (Mercante Nero: spawn/acquisto/prossimità, effetti rischio/ricompensa, differenziazione dal
  mercante normale, apparizione casuale, snapshot) → **172 test totali**, 0 falliti.

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Riusa i messaggi `offer_merchant`/`buy_merchant` con un flag `dark`; nuovi campi
  snapshot `merchD` e `nmd`.

---

## [1.11.0] — 2026-08-04 · "Mercante, Creature & Attacchi alla Hades"

### ✨ Aggiunte
- **🧙 NPC Mercante Errante** — un venditore neutrale (con bancarella, tenda a strisce e lanterna) appare in mappa,
  preferibilmente in una **micro-area**. Avvicinandoti si apre un pannello con **3 offerte casuali** acquistabili
  con le **monete** (cura, +PV massimi, cassa armi, potere, vita extra, +danno, +velocità, riduzione danni).
  Neutrale: i nemici lo ignorano.
- **👹 Nemici ridisegnati** — i mostri non sono più "pallini": ora sono **creature dettagliate** con corpo, arti,
  gambe animate, corna, zanne, ali e occhi (goblin gobbo, orco muscoloso, scheletro con scudo e costole, mago/lich
  incappucciato con orbe, mimic con fauci e lingua, troll con braccione, assassino con pugnale e mantello, viverna
  e drago alati). Stile coerente con l'art degli eroi.
- **⚔️ Attacchi più vari (ispirati a Hades)** — nuovo sistema di **zone telegrafate a terra** (cerchi che si
  riempiono e poi esplodono). Il **Mago Oscuro** alterna colpo mirato, **ventaglio a 3**, e zona sotto i piedi;
  la **Viverna** spara **raffiche a 3**; il **Lich** piazza zone; i **Goblin** eseguono **affondi** rapidi.
- **🕯️ Micro-aree nel dungeon** — piccole nicchie/stanzette laterali scavate nei muri, arredate con oggetti macabri
  e una torcia: più esplorazione e nascondigli. La mappa è anche **più scura** (illuminazione più intima, vignetta marcata).

### 🐛 Correzioni
- **Fix bug "il personaggio si blocca e non si muove"** — era una **regressione della v1.10**: l'handler
  `contextmenu → azzera tasti` scattava a ogni **scatto col tasto destro**, cancellando il movimento. Rimosso.
  Aggiunta inoltre una **rete di sicurezza lato server** che libera il giocatore se dovesse incastrarsi in un muro.

### 🧪 Test
- **14 nuovi test** (mercante: spawn/acquisto/prossimità, zone telegrafate, ventagli, micro-aree, snapshot) →
  **160 test totali**, 0 falliti.

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Nuovi messaggi di rete `buy_merchant`/`offer_merchant`; il mercante riusa lo snapshot.

---

## [1.10.0] — 2026-08-04 · "Icone Emporio, Poteri & Dungeon Tetri"

### ✨ Aggiunte
- **🎨 Icone dell'emporio generate e uniche per personaggio** — armatura, stivali e arma ora hanno **icone-immagine**
  dedicate e **diverse per ciascuno dei 3 eroi** (Enforcer blu/polizia, Recon verde/militare, Glitch cyan/hacker),
  al posto delle emoji. Renderizzate come `<img>` nell'emporio e nel killfeed di equipaggiamento.
- **🎴 Catalogo poteri ampliato, scelta tra 2** — aggiunti **6 nuovi boon** (Furia Cieca, Passo Rapido, Fortuna Sfacciata,
  Colosso, Giustiziere, Bombardiere → **23 totali**). A fine ondata ora si sceglie **1 di 2** carte (più mirato).
- **🪦 Dungeon più tetri** — nuovi elementi macabri: **tombe**, **cadaveri**, **strumenti di tortura** (ruota dentata),
  **gabbie sospese** con resti, oltre a più **ragnatele**, **catene**, **teschi** e **ossa**. Pavimenti e atmosfera
  **oscurati** per un tono più cupo.

### 🔧 Modifiche
- **Emporio ridotto a 3 slot**: rimossi **Anello** e **Amuleto** (restano Armatura, Stivali, Arma).
- **Oggetti molto più costosi**: costi base aumentati (~80/70/95 monete) e scaling per tier più ripido (×2.1–2.2),
  per rendere l'equipaggiamento una scelta di lungo periodo.

### 🐛 Correzioni
- **Fix "il personaggio si muove da solo"** — se la finestra perdeva il focus (alt-tab, click fuori, apertura chat)
  mentre tenevi un tasto, il `keyup` non arrivava e il tasto restava "premuto". Ora lo stato input viene **azzerato**
  su `blur`, cambio di visibilità della scheda, uscita del mouse dal canvas e all'apertura/chiusura della chat.
  Inoltre, mentre digiti in chat il movimento è **neutralizzato**.

### 🧪 Test
- **15 nuovi test** (scelta tra 2 poteri, nuovi boon, emporio a 3 slot costoso, icone per eroe) → **146 test totali**, 0 falliti.

### 🧰 Note tecniche
- Le icone sono PNG con trasparenza in `public/assets/gear/{eroe}_{slot}.png`, ottimizzate (~110 KB ciascuna).

---

## [1.9.0] — 2026-08-04 · "Pausa, Nuove Abilità & Scenografia"

### ✨ Aggiunte
- **⏸️ Pausa nel negozio** — quando l'ondata finisce e sei nel negozio / scelta poteri / emporio, **il mondo si
  congela** (nemici, proiettili e movimento fermi). In singolo giocatore non c'è timer forzato: il gioco riparte
  **solo** premendo **Continua** (in multiplayer resta un timeout anti-AFK). A fine ondata i drop rimasti a terra
  (XP e monete) vengono **raccolti automaticamente**, così la pausa non fa perdere nulla.
- **⚔️ Abilità riviste — 2 per eroe + nuove** (lo **scatto** universale col tasto destro resta invariato):
  - 🎯 **Torretta Schierabile** (Enforcer, E) — piazza una torretta che spara ai nemici per 8s *(stile TF2/Risk of Rain)*.
  - 🎯 **Colpo del Cecchino** (Recon, E) — proiettile perforante devastante a lunga gittata *(stile Overwatch/Valorant)*.
    Sostituisce il vecchio "Scatto di Combattimento", che era **ridondante** con lo scatto universale (tasto destro).
  - Glitch mantiene le sue due abilità già uniche (⏱️ Bullet-Time + 🌀 Frattura di Dati).
  - La barra abilità mostra le **icone specifiche** di ogni eroe.
- **🏛️ Più elementi scenografici nel dungeon** — nuovi prop tematici: **colonne**, **cristalli**, **statue**,
  **funghi luminescenti**, **catene**, **pozze**, **pozze di lava**, **stendardi**, **sarcofagi**. Densità aumentata
  e colonne appoggiate ai muri per maggiore profondità.
- **🏷️ Versione nel titolo** — il numero di versione compare nel titolo della scheda e come badge nel menu
  (sincronizzato da `C.VERSION`).
- **🧪 20 nuovi test** automatici (pausa, raccolta auto, torretta, cecchino, scatto universale, "2 abilità per eroe")
  → **130 test totali**; test homing reso deterministico (niente più flakiness).

### 🔧 Modifiche
- La simulazione del mondo è ora **gated** dalla fase: gira solo in combattimento/boss, non nel negozio/lobby/fine.
- Rimossa l'abilità ridondante di Recon; aggiunte `VERSION` e nuove voci abilità (con icone) in `heroes.js`.

### 🧰 Note tecniche
- Nessuna nuova dipendenza. La torretta riusa l'array `orbs` (nessun nuovo canale di rete).

---

## [1.8.0] — 2026-08-04 · "Monete & Emporio dell'Equipaggiamento"

### ✨ Aggiunte
- **🪙 Monete di vario taglio** — i nemici droppano **monete** oltre all'XP: 🟤 Bronzo (1), ⚪ Argento (5),
  🟡 Oro (20). I **boss** e le **élite** ne lasciano di più e di taglio superiore; lo **scrigno del tesoro**
  è una miniera. Raccolta con **calamita** come l'XP.
- **🏪 Emporio dell'equipaggiamento** — a fine ondata, un secondo negozio (a **monete**, parallelo a quello a XP)
  con **5 slot** potenziabili per **5 tier** (Lv. I → V, rarità crescente):
  - 🛡️ **Armatura** → riduzione danni + PV massimi
  - 👟 **Stivali** → velocità di movimento
  - ⚔️ **Arma** → danno + cadenza di fuoco
  - 💍 **Anello** → probabilità e moltiplicatore critico
  - 📿 **Amuleto** → potenza abilità + assorbimento vitale
  Ogni tier costa più del precedente: costruisci il tuo personaggio nel tempo.
- **🎨 Resa grafica** — monete animate a terra con luccichio e luce dedicata; contatore monete 🪙 nell'HUD;
  carte equipaggiamento con indicatori di tier (pip) e costo.
- **🧪 19 nuovi test** automatici (drop/raccolta monete, acquisto e stat degli slot, costo crescente, tier massimo,
  cap riduzione danni, snapshot) → **110 test totali**.

### 🔧 Modifiche
- Due economie **distinte e complementari**: **XP** per micro-potenziamenti ripetibili, **monete** per
  equipaggiamento a slot con tier discreti.
- Nuovi messaggi di rete `buy_gear` / `offer_gear`; `Room` traccia `coins` e `gear` per giocatore.
- La riduzione danni totale è ora **limitata all'85%** (per evitare invulnerabilità con più fonti cumulative).

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Gli effetti dell'equipaggiamento si sommano ai campi statistici esistenti (delta additivo).

---

## [1.7.0] — 2026-08-04 · "Stats, Ricompense Combo & Sinergie"

### ✨ Aggiunte
- **🏆 Schermata di fine partita con statistiche** — riepilogo completo della run: **ondata** raggiunta,
  **durata** ⏱, e una **classifica co-op** (ordinata per uccisioni) con medaglie 🥇🥈🥉. Per ogni giocatore:
  **uccisioni**, **combo massima** 🔥, **danni totali**, numero di **boon** raccolti, **sinergie** attive 🔗 e
  **arma** (con evoluzione ✨). I caduti sono barrati.
- **🔥 Ricompense combo a soglie** — la combo non dà più solo XP: a **15** sblocchi la **Frenesia** (buff cadenza),
  a **25** una **Nova** ad area, a **40** una **Cura + Egida**. Mantenere la combo diventa una scelta tattica.
- **🔗 Sinergie tra Boon** — possedere due boon compatibili sblocca un effetto potenziato una tantum:
  - **🧪 Deflagrazione Tossica** (Tossina + Colpi Esplosivi) → le esplosioni diffondono veleno ad area.
  - **🧊 Catena Gelida** (Catena di Fulmini + Tocco Gelido) → le catene rallentano i nemici colpiti.
  - **🔮 Cercatore** (Mira Guidata + Perforazione) → i proiettili guidati perforano +1 nemico.
  - **🩸 Sete di Sangue** (Vampirismo + Adrenalina Pura) → +6% cura dal danno inflitto.
- **🧪 18 nuovi test** automatici (ricompense combo, sinergie, deflagrazione tossica, stats/classifica) → **91 test totali**.

### 🔧 Modifiche
- `Room` traccia `runStart`, `comboBest`, `damageDealt` e `synActive` per giocatore.
- Gli eventi `gameover`/`victory` ora trasportano `stats` (classifica) e `dur` (durata run).
- Nuovi eventi client: `combo_reward` (ricompense a soglie) e `synergy` (sinergia sbloccata).

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Retro-compatibile con i salvataggi di logica della v1.6.

---

## [1.6.0] — 2026-08-04 · "Combo, Minimappa & Homing"

### ✨ Aggiunte
- **🔥 Sistema COMBO / streak** — le uccisioni consecutive riempiono un **combo meter** in alto al centro.
  Ogni catena aumenta un **moltiplicatore di XP** progressivo (fino a **x2.5**). Milestone ogni 5 uccisioni con
  feedback visivo/sonoro; oltre 20 combo compare un avviso nel killfeed.
- **⏳ Decadimento combo** — se non uccidi entro `COMBO_TIME` (3,6 s) la combo si azzera: premia il gioco aggressivo.
- **🗺️ Minimappa in tempo reale** — riquadro in basso a sinistra con muri, portale d'uscita, **alleati**,
  **nemici** (boss in rosso, élite in oro) e lo **scrigno del tesoro** 👑.
- **🎯 Boon "Mira Guidata" (homing)** — i proiettili curvano dolcemente verso il nemico più vicino (max 2 stack).
- **🪙 Boon "Avidità"** — +30% XP raccolta per stack (potenzia le combo).
- **🧱 Boon "Baluardo"** — -12% a tutti i danni subiti per stack (fino a -60%).
- **🧪 12 nuovi test** automatici (combo, homing, avidità, baluardo, snapshot combo) → **73 test totali**.

### 🔧 Modifiche
- `snapshot()` ora espone `cmb` (combo), `cmt` (frazione timer), `cmx` (moltiplicatore) per l'HUD.
- Statistiche giocatore estese con `xpMult` e `dmgReduce`.
- Descrizione e versione aggiornate in `package.json` e nella suite di test.

### 🧰 Note tecniche
- Nessuna nuova dipendenza (motore custom a dipendenze zero invariato).
- Retro-compatibile: le partite e i salvataggi di logica restano validi; nessuna modifica di rete "breaking".

---

## [1.5.0] — "Profondità & Game Feel"

### ✨ Aggiunte
- **🎴 Poteri a scelta (Boon, stile Hades)** — a fine ondata scegli 1 di 3 carte con effetti unici e impilabili
  (Rimbalzo, Perforazione, Catena di Fulmini, Tossina, Colpi Esplosivi, Onda di Ritorno, Vampirismo, Sdoppiamento,
  Occhio di Falco, Proiettili Giganti, Tocco Gelido, Aura di Spine, Adrenalina Pura, Scudo Vitale).
- **💥 Hit-stop + evoluzione armi** — micro freeze-frame sui critici/uccisioni di boss; armi a Lv.3 con la statistica
  giusta si evolvono (Uragano d'Acciaio, Tempesta di Piombo, Lancia del Giudizio).
- **🌊 Modalità ondata** — Orda, Caccia, Sopravvivenza, Tesoro 👑, Assalto.

### Incluse dalle versioni precedenti
- Sistema di **vite** (2), **XP raccoglibile + negozio statistiche**, **item drop**, **20 livelli** con
  **MEGA boss finale AZ'GAROTH**, **temi mappa** (Cripta, Lava, Foresta, Ghiaccio, Arcano), dash che attraversa
  i nemici, 3 armi raccoglibili, musica procedurale, 3 eroi, 10 mostri + boss, netcode autoritativo.

---

> Formato ispirato a [Keep a Changelog](https://keepachangelog.com) · Versioni secondo [SemVer](https://semver.org).
> Ad ogni nuova versione aggiungi qui in cima una sezione con la data e le modifiche.
