# ⚔️ DUNGEON RIFT v2.19.3 — Roguelike Co-op Multiplayer 2D

Roguelike frenetico per **fino a 6 giocatori**. Motore **custom a dipendenze zero** (Node.js + Canvas 2D):
niente `npm install`, niente asset esterni — grafica, musica ed effetti sono **generati proceduralmente**.

## 🚀 Avvio
```bash
docker compose up --build      # → http://localhost:8080
# oppure, con solo Node ≥ 18:
npm start
```
Test: `npm test`

## 🎮 Comandi
| Azione | Tasto |
|---|---|
| Movimento | WASD / frecce |
| Mira | Mouse |
| Spara | Click sinistro / Spazio |
| **Scatto (dash)** | Tasto destro del mouse (o Shift) — attraversa i nemici |
| **Abilità attive** | **1 / 2 / 3** — si sbloccano ai livelli 1, 7 e 13 |
| **Pozioni della cintura** | **Q / E** — il tipo di ogni slot lo scegli dall'Erborista |
| Negozio: pronto | Spazio |
| Musica | M |
| Minimappa | sempre visibile (in basso a sinistra) |

## 🆕 Novità v2.19.3 (si vede cosa porti)

Nella schermata del personaggio, al centro c'è l'**artwork della classe** (lo stesso della scelta
iniziale) al posto del personaggio ridisegnato, che usciva tagliato. Nell'**inventario** quello che
stai portando ha il **bordo verde** e la fascia **IN USO · DX / SX / 2 MANI**; i pulsanti della mano
in cui sta già sono verdi. E ogni tentativo di indossare risponde **sopra l'inventario** — rosso col
motivo se non si può, verde con la mano se è fatto — invece di finire sotto il menu dove non si vedeva.

---

## 🆕 Novità v2.19.2 (soglie sgombre)

**Davanti a una porta non ci sta niente.** Cinque stanze su tredici avevano mobili sull'uscio — le due
botteghe nuove erano le peggiori, con tre mobili ciascuna e uno in mezzo alla soglia. I bersagli
dell'archeria sono passati in fila contro la parete, i cristalli della bottega arcana in cerchio
attorno al tappeto runico, e le aiuole dell'erboristeria (che lasciavano 0,75 tessere di passaggio)
lungo la parete di mezzogiorno.

La regola della soglia esisteva già ma valeva **solo per le case**: le botteghe erano arredate a mano
e nessuno controllava. Ora il controllo è uno, vale per tutte le stanze, ed è nel generatore — che si
**ferma** se qualcuno rimette un mobile davanti a una porta, invece di toglierlo in silenzio.

---

## 🆕 Novità v2.19.1 (l'assassino mena di pugnale)

L'assassino era **disegnato con due pugnali e tirava frecce**: su sette classi è l'unica in cui il
*corpo* (`ladro`, gli archi) e la *famiglia d'arma* (mischia leggera) non coincidono, e l'arma di
partenza seguiva il corpo. Adesso parte con i **Pugnali Sbeccati** — grado 1, leggera, mischia,
77 danni/s, scuola `agile`. La **doppia arma non è regalata**: la seconda lama si compra dal fabbro,
ed è lì che si accende il bonus di classe.

I pezzi marcati `avvio` sono pezzi di **partenza, non merce**: appartengono a una classe sola, non
stanno su nessun banco e non entrano nel listino (che resta 117 pezzi).

**Chiuso un buco della v2.19.0**: i pezzi di grado 1 costano zero, e con l'equipaggiamento misto si
compravano gratis dal catalogo di un'altra classe per rivenderli a 8 monete, in circolo. Adesso
**il grado scarso non è merce**.

---

## 🆕 Novità v2.19.0 (le tre botteghe, e l'equipaggiamento misto)

**Al villaggio si compra in tre posti.** Due case sono diventate l'**ARCHERIA** (fila di ponente,
sotto la fucina — bersagli di paglia con le frecce piantate, rastrelliere d'archi, cuoio da conciare)
e la **BOTTEGA ARCANA** (fila di levante — cristalli accesi, scaffali di volumi, tappeto runico).
Dentro ci stanno l'**Arciera** e l'**Arcanista**, con l'arco incordato e il bastone dalla gemma accesa
in mano. Ogni banco ha il suo colore — ambra, verde, viola — sull'alone a terra e sul minimappa.

| Bottega | Mercante | Vende |
|---|---|---|
| **Fucina** | Fabbro | armi da mischia, armature, scudi |
| **Archeria** | Arciera | archi, cuoio, calzature |
| **Bottega Arcana** | Arcanista | bastoni, vesti, calzari |

**L'equipaggiamento misto.** Chi compra cosa non è più «il tuo corpo» ma la **tabella della tua
classe**, trascritta da `PIANO-CLASSI-SETTAGGI.md` §3 in `Gear.PERMESSI`. I due assi del documento
erano già nel listino: la **tipologia** è il catalogo (mischia / arco / magia), il **peso** è il
`carattere` del pezzo (leggera / equilibrata / pesante).

| Classe | Fabbro | Arciera | Arcanista |
|---|---|---|---|
| **Barbaro** | armi tutte, armature **leggere**, scudi | armature e calzature **leggere** | — |
| **Paladino** | tutto | — | — |
| **Maestro d'Armi** | tutto | — | — |
| **Assassino** | armi e armature **leggere/medie** | armi, armature, calzature **leggere/medie** | — |
| **Arciere** | — | tutto | — |
| **Mago** | — | — | tutto |
| **Warlock** | armi e armature **leggere** | — | tutto |

**Barbaro, assassino e warlock** girano due botteghe: è quello che «equipaggiamento misto» vuol dire.
Ogni bottega **ricompra solo la sua roba**, e un banco che per te è vuoto lo scrive invece di aprirsi
senza righe.

**Anche le mani hanno la tipologia.** L'assassino fa doppia arma *«leggere, solo mischia»* — non due
archi; il mago *«leggere, mago»* — non due pugnali; lo scudo sta sempre accanto a un'arma da mischia.
Il barbaro resta l'unico con **arma pesante + scudo**.

---

## 🆕 Novità v2.18.0 (da tre eroi a sette classi)

**Le sette classi**: barbaro, paladino, maestro d'armi, assassino, arciere, mago, warlock. Le decisioni
per esteso, con le parole di Paolo accanto a ciascuna, stanno in **`PIANO-CLASSI-SETTAGGI.md`**: è il
file da aprire per primo per capire *perché* una cosa è com'è.

**Tre impalcature, non sette.** Ogni classe dichiara un `corpo` — pesante (guerriero), agile (ladro),
arcana (mago). Chi **disegna o veste** guarda il corpo; chi **bilancia** guarda la classe. È la
distinzione che ha reso il passaggio fattibile invece di una riscrittura: `gear.js`, il renderer e i
mercenari continuano a ragionare per tre.

**Il Carisma, quinta statistica.** Scala le magie di paladino e warlock. Il budget resta **14 punti**
su cinque righe: è voluto, distribuirli è la scelta. Le scuole di danno sono cinque — `melee` (Forza),
`agile` (Destrezza, lame leggere), `ranged` (Destrezza, archi), `magic` (Intelligenza), `pact`
(Carisma).

**Le statistiche di partenza** sono una matrice 7 × 5: picco 10 per chi vive di una statistica sola,
6-7 per chi ne ha due (paladino e maestro d'armi). Due sfasamenti — il tetto fermo a 20 con i picchi a
10, e il warlock che somma 23 invece di 22 — sono **decisioni esplicite di Paolo, non bachi**.

**Le abilità.** Al livello 1 la **firma** di classe si riceve, non si sceglie; il mago è l'unico che
sceglie, e sceglie la **scuola** (elementare / evocazione / negromanzia), da cui prende il titolo. Ai
livelli 7 e 13 si sceglie fra una abilità nuova e solo sua e una del serbatoio delle dodici di prima.
**Ogni effetto a tempo dura 10 secondi**, tranne Turbine, Salva e il blocco della Tagliola, che sono
azioni e non effetti; lo **Scudo di Mana** non scade affatto — assorbe 8 danni per punto di
Intelligenza e dura fino a fine ondata. Ricariche invariate: **30 / 45 / 60**.

**Le passive** passano da 32 a 38 carte: sei nuove, aggiunte *solo* alle classi che avevano una sola
opzione in qualche fascia. Adesso ognuna delle sette ne vede quattro a ogni fascia.

**Le specializzazioni del livello 15 non esistono più**: quattro dei sei rami sono diventati classi.

**L'estetica.** La scelta dell'eroe è un box quadrato con l'artwork a sinistra e i cinque attributi a
destra, scorribile con le frecce; in partita le sagome si distinguono per testa, spalle, arma e tinta.

I **salvataggi di prima si rifiutano** (`FORMATO` 4): `heroId: 'guerriero'` non è convertibile, quella
classe si è divisa in tre.

---

## 🆕 Novita v2.16.0 (la progressione rifatta: si comincia con un'abilita' in mano)

**Il problema, misurato.** Le abilita' attive si sbloccavano ai livelli 8 e 14. Incrociando la curva
dell'esperienza con quella che le ondate mettono davvero a terra: il livello 8 arriva all'**ondata 12 di
20** e il 14 all'**ondata 18**. Per undici ondate su venti il giocatore aveva in mano il clic sinistro e
lo scatto, e la seconda abilita' arrivava a due ondate dalla fine — la sceglievi e il gioco finiva.

**La scaletta nuova**, decisa da Paolo. I due elenchi si alternano sui dispari:

| Livello | Cosa | Arriva all'ondata |
|---|---|---|
| **1** | 1a attiva — obbligatoria prima di scendere | **1** |
| 3 | 1a passiva (non comune) | 4 |
| 5 | 2a passiva (rara) | 8 |
| **7** | 2a attiva | **11** |
| 9 | 3a passiva (epica) | 13 |
| 11 | 4a passiva (divina) | 15 |
| **13** | 3a attiva — *da definire, il riquadro si vede spento* | 17 |
| 15 | cap + specializzazione | 19 |

- **⚡ La prima attiva si sceglie PRIMA di entrare.** Si parla con l'anziano, si attraversa la faglia e ci
  si trova davanti la schermata di fine livello, dove la scelta e' necessaria per proseguire. Il blocco
  sta sul **server** (`shopReady` ripropone la scelta invece di far partire l'ondata), non sul pulsante:
  un bottone grigio si aggira, il metodo che decide se l'ondata parte no.
- **⌨️ I tasti si sono scambiati il mestiere.** I **numeri 1 2 3** fanno partire le **abilita'** (che sono
  passate da due a tre slot), **Q ed E** bevono le **pozioni** (che sono passate da tre slot a due). Vanno
  insieme: tre abilita' non stanno su due tasti, e due pozioni non hanno bisogno di tre.
- **🎖️ I ranghi sono solo scenici**: danno il titolo e non piu' un punto statistica. Il prezzo e' scritto
  perche' non lo si riscopra per caso — il budget di una partita passa da **18 punti a 14** (-22%).
  Deciso da Paolo sapendo la cifra; se il personaggio risultera' troppo magro, la via e' alzare le
  statistiche di base, non rimettere i punti sui ranghi.
- **💾 I salvataggi di prima si rifiutano** (`FORMATO` 2 → 3): la cintura e' scritta come tre slot e
  `abil` come `{q, e}`. Un salvataggio si carica intero o si rifiuta intero.
- **🧹 Dentro:** `p.abil` e le ricariche erano quattro variabili sciolte (`cdQ`, `cdE`, `cdQMax`,
  `cdEMax`) — col terzo slot sarebbero diventate sei. Adesso sono array, e lo snapshot porta un elenco
  (`ab`, `cab`) invece di quattro campi. Il Marchio non si cerca piu' «nello slot E» ma in quale slot e'.
- **🧪 3297 test passati, 0 falliti**, piu' tre controlli nel browser. Il nuovo **prova-tasti** preme
  davvero i tasti e guarda cosa esce da `Input.build`: se il client mandasse ancora i vecchi campi `q`/`e`
  il server leggerebbe zero e non succederebbe niente, in silenzio. E la prova della scaletta **rifa' il
  conto delle ondate a ogni esecuzione**: se qualcuno tocca l'XP e le scelte scivolano in fondo, si rompe
  li' e non in partita.
- **🎲 Una prova instabile seminata.** Il TEST 38 falliva una volta su quattro: se nell'ondata sorteggiata
  capitano delle **larve** si fanno esplodere da sole, liberano posto e la coda ne versa altre. Non era un
  difetto della coda ma un'asserzione che dipendeva dal sorteggio.

## 🆕 Novita v2.14.0 (il fabbro a icone quadrate — FASE 3, piano chiuso)
- **🔨 IL NEGOZIO DEL FABBRO ERANO 39 CARTE IN UNA COLONNA SOLA** (13 per slot, alte 150px, in un
  pannello da 620): due schermate di scorrimento per un posto in cui l'unica cosa che serve e' confrontare.
  Adesso **una linguetta per slot** — 13 per volta — e i pezzi come **quadrati**, gli stessi del baule e
  della banda delle scelte.
- **📐 Quattro per riga, su tutta la larghezza.** Le celle sono `1fr` e non 84px fissi: si allargano a
  riempire il pannello (110px l'una) e restano quadrate. Con la misura fissa restava mezzo pannello vuoto.
- **🪙 In ordine di PREZZO**, che e' la domanda vera davanti a un negozio. A pari prezzo resta pesante,
  equilibrata, leggera.
- **✂️ Via i titoli dei gradi e la colonna dei prezzi a destra.** Il colore della cella dice gia' il
  grado, e un test controlla che i cinque gradi abbiano davvero **cinque colori distinti**.
- **🟢 Tre aggiunte**: il **pallino verde** sulla linguetta («qui c'e' qualcosa che ti puoi permettere»),
  gli **stati scritti in chiaro** sulla casella (*in uso*, *gia' tuo*, il prezzo, spenta se non ti basta),
  e le **statistiche col mouse sopra** con grado, carattere e prezzo di rivendita.
- **🧪 3144 test passati, 0 falliti.** Il controllo del fabbro e' a 17 voci e misura: che le prime quattro
  celle stiano davvero sulla stessa riga e coprano tutta la larghezza, che i titoli siano zero, che i
  colori siano cinque, che l'ordine dei prezzi sia crescente.

## 🆕 Novita v2.13.6 (un punto in piu' sopra il full HD)
- **🔎 SOPRA IL FULL HD IL FONT CRESCE DI 1px**, e solo nel **riepilogo di fine livello**. Si guarda
  `screen.width` — la **risoluzione del monitor**, non la larghezza della finestra: su uno schermo 4K con
  la finestra a meta' il testo e' fisicamente piccolo lo stesso. E si legge in **pixel CSS, non fisici**:
  un portatile 4K al 200% riporta 1920 e il suo testo non e' piccolo, perche' ci pensa gia' il sistema.
- **🎯 `--fz` sta su `#upgradeScreen`, non sulla radice.** Sulla radice si erediterebbe ovunque, e
  basterebbe che un domani una regola fuori di li' la usasse per far crescere mezzo gioco.
- **🤖 Le 58 regole del blocco non sono scritte a mano**: sono state raccolte chiedendo al browser quali
  regole colpiscono davvero un elemento di quella schermata. Scegliendole a occhio ne erano entrate 104 —
  classi come `.ic`, `.nm`, `.ds` sono condivise con i pannelli dei mercanti.
- **🧪 `prova-font.js`, nuovo**: apre la pagina a **tre risoluzioni** e misura il font calcolato dal
  browser su **ogni** elemento con del testo. A 1920 non si muove niente; sopra, tutti e **121** i testi
  della schermata crescono di 1px e i **16** dell'HUD non si muovono.

## 🆕 Novita v2.13.5 (via le linguette, e le colonne si fermano dove finisce la roba)
- **🗂️ LE DUE LINGUETTE NON CI SONO PIU'.** Erano l'ultimo residuo del pannello a schede: con una
  schermata che mostra tutto insieme, una linguetta vuol dire «qui c'e' qualcosa che non vedi». I **poteri
  concessi** sono finiti nella colonna di destra sotto il baule — sono l'altra meta' di «cosa hai» — e
  danno alla colonna una forma stabile dalla prima ondata, perche' la scaletta dei sei scaglioni c'e'
  sempre, piena o vuota che sia.
- **📐 Niente piu' riquadri alti e neri.** A ondata 1 centro e destra erano due scatole quasi vuote: le
  colonne si allungavano **tutte fino alla piu' alta** (`align-items: stretch`). Ora ognuna si ferma dove
  finisce il suo contenuto. I bordi in basso non sono piu' allineati fra loro, ma un riquadro vuoto si
  legge come un errore e uno corto no.
- **✂️ Via il titolo sopra i poteri**: lo stacco dal baule lo fa un filetto. E **piu' aria fra i
  riquadri** — erano tutti a 3-4px di distanza, e il colpo d'occhio era una griglia unica.
- **🧪 3144 test passati, 0 falliti.** Il controllo nel browser non cerca piu' «quale linguetta e' aperta»:
  verifica che le sette cose della schermata siano **tutte visibili insieme**, misurandone il rettangolo.

## 🆕 Novita v2.13.4 (quadrati, non rettangoli allungati)
- **⬜ LE CARTE DELLA SCELTA SONO QUADRATE: 84x84.** Erano verticali (150px), poi rimpicciolite (84), poi
  girate in orizzontale — e li' erano diventate rettangoli lunghi. Adesso sono **gli stessi quadretti del
  baule**: una schermata dovrebbe avere un solo modo di disegnare «una cosa che si sceglie cliccandola», e
  adesso ce l'ha.
- **🔑 Cio' che rende possibile il quadrato** e' che la descrizione non sta piu' a schermo: sta nel titolo,
  con rarita' ed effetto per esteso. A schermo icona e nome — quanto serve per riconoscere una carta gia'
  vista; la prima volta ci si passa sopra.
- **📐 Due dettagli**: la griglia e' a **colonne fisse**, non `1fr` (con `1fr` le carte si riallargherebbero
  e tornerebbero rettangoli — e' cosi' che ci erano finite); e la banda si **stringe su cio' che contiene**,
  invece di lasciare due terzi di vuoto.
- **🧪 3144 test passati, 0 falliti.** Il controllo misura **larghezza E altezza** di ogni carta e verifica
  che coincidano: `width: 84px` non garantisce niente sull'altezza.

## 🆕 Novita v2.13.3 (le carte girate di novanta gradi)
- **↩️ CARTE DELLA SCELTA DIMEZZATE UN'ALTRA VOLTA: 42px.** A 84 erano ancora scatole — icona sopra, nome
  sotto, descrizione sotto ancora — e tre righe incolonnate non scendono oltre senza diventare illeggibili.
  Girate in **orizzontale** (icona a sinistra, nome e riga di effetto a destra) la stessa roba sta in meta'.

  | | v2.13 | v2.13.2 | v2.13.3 |
  |---|---|---|---|
  | carta | 150px | 84px | **42px** |
  | banda | 227px | 134px | **88px** |

  La banda e' passata da un terzo di schermo a una striscia, e la colonna di sinistra adesso si vede tutta
  senza scorrere anche con una scelta aperta.
- **🏷️ Nel titolo** cio' che a 42px non ci stava e che comunque si leggeva poco: la rarita' (la dice gia' il
  colore del bordo) e il «PER TUTTI / DELLA TUA CLASSE». A schermo resta cio' che serve per scegliere.
- **🧪 3144 test passati, 0 falliti.** Il controllo misura l'altezza vera di carta e banda e verifica che la
  carta sia davvero in orizzontale (flex-direction calcolato, non dichiarato).

## 🆕 Novita v2.13.2 (niente titolone sopra le carte)
- **✂️ VIA IL TITOLO.** Sopra le tre carte della scelta c'erano un `<h2>` («CONCEDIGLI UN'ABILITA'») e una
  riga di accompagnamento: due righe di testo per dire una cosa che le carte dicono da sole. Resta **una
  riga piccola**, che dice cio' che le carte non dicono — quale scaglione e', e su che tasto finisce
  un'abilita' attiva. Il nome della **specializzazione** e' entrato li' dentro invece di sparire: e' l'unica
  scelta della partita che non si puo' rifare.
- **📏 Carte dimezzate**: da 150px a **84px**, e tutta la banda da ~227 a **134px**. Erano tarate su una
  schermata che non esiste piu' (una colonna sola larga 960); nella banda della 2.13 spingevano il resto
  fuori dallo schermo. A rimpicciolire sono i vuoti: nome e riga di effetto sono rimasti quelli.
- **🧪 3144 test passati, 0 falliti.** Il controllo nel browser misura l'**altezza reale** della carta e
  della banda e cerca la parola «CONCEDIGLI» nel testo: provato rimettendo i bug, e li prende.

## 🆕 Novita v2.13.1 (la scheda, non quattro cartelloni)
- **📋 LE QUATTRO STATISTICHE SONO RIGHE, NON RIQUADRI.** Erano quattro riquadri da 150px con icona,
  nome, descrizione e prezzo: mezza colonna per dire quattro numeri. Ora sono righe alte 36px, come su una
  scheda da GDR — `💪 Forza 12 /20 [+]` — col **`+` accanto al numero**, che si accende solo quando hai i
  punti per premerlo.
- **🎭 Ogni classe ha il suo profilo.** Le statistiche partivano da zero per tutti: un guerriero e un mago
  appena nati mostravano gli stessi quattro zeri, quando sono due cose opposte.

  | | For | Cos | Des | Int |
  |---|---|---|---|---|
  | Guerriero | 8 | 8 | 4 | 2 |
  | Ladro | 4 | 6 | 8 | 4 |
  | Mago | 2 | 4 | 6 | 8 |

  Tetto **20** = 8 di base massima + 12 punti spendibili.

  **Dalla v2.15 il profilo MORDE** (prima era solo da leggere), ma dentro un perimetro stretto e per due
  scelte misurate. **Conta lo SCARTO dal centro (5,5), non il valore assoluto**: chi sta sopra guadagna,
  chi sta sotto perde, la somma per classe e' quasi zero — le classi si allontanano fra loro senza che la
  potenza media salga. E **non tocca ne' danno ne' cadenza**: quelli restano dell'arma e dei punti spesi.
  Il perche' e' un numero: ogni classe ha il valore piu' alto proprio nella statistica della propria
  scuola di danno (mago INT 8, ladro DES 8, guerriero FOR 8), e INT e DES alzano danno *e* cadenza mentre
  FOR alza solo il danno — lasciandolo contare sul danno i 79/78/78 danni al secondo diventavano
  **93/105/102, col mago in testa**. Il profilo cambia quindi la FORMA della classe: PV, riduzione, passo,
  rinculo. Misurato: guerriero **+14% PV efficaci e -1,9% di passo**, mago **-14% PV**, ladro **+5% PV e
  +3,1% di passo**; danno e cadenza fermi al millesimo. Il TEST 71 controlla entrambi i lati — che
  spostare il profilo muova PV e passo, e che NON muova danno e cadenza.
- **📐 Meno spazio sprecato ovunque**: i quadretti del baule da 96 a 68px (sei per riga invece di tre),
  derivate e slot piu' compatti, i testi di contorno rimpiccioliti. E **ordine nuovo**: statistiche →
  derivate → riepilogo. Prima le statistiche erano in fondo, cioe' sotto la piega: la cosa su cui devi
  agire era l'unica che non si vedeva.
- **🧪 3144 test passati, 0 falliti.** Il controllo nel browser misura l'**altezza reale** di una riga e il
  **lato reale** di un quadretto: non si fida del CSS.

## 🆕 Novita v2.13.0 (una schermata sola: chi sei, cosa porti, cosa hai)
- **🗺️ IL PANNELLO DI FINE ONDATA NON HA PIU' QUATTRO LINGUETTE.** Ne aveva quattro (riepilogo,
  personaggio, abilita', villaggio) perche' tutto in colonna non ci stava, dentro un tetto di 960px. Il
  prezzo: per sapere com'eri messo dovevi girare per tre schede, e il **baule** — la roba che possedevi e
  non indossavi — non si vedeva **da nessuna parte** se non dal fabbro, dall'altra parte del villaggio.
- **📐 Adesso e' una schermata sola, larga 1280, a tre colonne.** A sinistra **chi sei** (livello, le
  derivate, il riepilogo dell'ondata, i punti), al centro **cosa porti addosso**, a destra **cosa hai nel
  baule**. In fondo due soli pulsanti: vai al villaggio, prossima mappa.
- **🖼️ Il ritratto al centro e' il personaggio VERO**: e' `Renderer._hero`, la stessa funzione che lo
  disegna in partita, con addosso gli id dell'equipaggiamento. Le tinte dei 104 pezzi si vedono qui come si
  vedono sulla mappa, e l'alone del divino pure.
- **📊 Le quattro derivate.** Forza, Costituzione, Intelligenza e Destrezza si spendevano alla cieca: il
  pannello diceva quanti punti avevi messo, mai che effetto avessero. Ora ci sono **danno per colpo, danni
  assorbiti, cadenza, passo**, presi dalle funzioni del motore e non ricostruiti nel client.
- **🎒 Il baule, e il clic che equipaggia.** Tutto quello che compri resta tuo, e ora si vede: per slot,
  col pezzo indossato marcato, e **un clic te lo mette addosso** — gratis, l'hai gia' pagato. E' una porta
  nuova, non `buyGear` con un controllo in meno: **non compra**, non funziona in combattimento, e non
  accetta roba di un'altra classe.
- **🃏 La scelta in sospeso e' una banda in cima**, a tutta larghezza, e sparisce quando hai scelto. Tre
  carte da confrontare non stanno in una colonna laterale, e una scelta in sospeso non e' una scheda fra le
  altre: e' la cosa da fare adesso.
- **🧪 3135 test passati, 0 falliti.** Nuovo TEST 71 (15 controlli), e una **sfarfallata pre-esistente
  spenta**: il TEST 58 falliva una volta su tre per via della mappa generata a caso. Un test che fallisce a
  caso e' peggio di un test che non c'e'.

## 🆕 Novita v2.12.0 (centoquattro pezzi, e dentro ogni grado un bivio)
- **🎯 L'EQUIPAGGIAMENTO ERA UNA SCALA, NON UNA SCELTA.** Misurato prima di crederci: in una run intera si
  prendevano 4 carte passive, 2 abilita' attive, 1 specializzazione, ~14 punti statistica — e **zero**
  decisioni sull'equipaggiamento. Si comprava il pezzo dopo quando si avevano le monete, e basta.
- **♻️ La regola si ribalta, ma solo a meta'.** **Fra un grado e l'altro si sale** (il divino batte il
  leggendario, sempre). **Dentro lo stesso grado non si sale: si sceglie.** I tre pezzi di un grado costano
  uguale e rendono uguale — sulle armi il danno al secondo sta dentro il **4%** — e cambiano in *come* si gioca.
- **🗂️ Cinque gradi, 104 pezzi.** **Scarso** (1 per slot, non si compra: e' cio' con cui parti, ~20% sotto
  il comune), poi Comune, Raro, Leggendario, Divino, **tre pezzi ciascuno**. 13 per slot.
- **🎭 Tre caratteri, e ognuno e' il migliore in UNA cosa e il peggiore nelle altre due.**

  | | Guerriero | Mago | Ladro |
  |---|---|---|---|
  | ▰ Pesante | rinculo | bolla grande | gittata |
  | ▱ Equilibrata | portata | gittata | perforazione |
  | ▫ Leggera | arco largo | bolla veloce | cadenza |

  Sulle difensive e' protezione contro velocita' e cadenza. Guerriero divino: kit **pesante** 1,435 s fra un
  fendente e l'altro, 435 PV, −51% danni · kit **leggero** 0,390 s, 314 PV, −27%. Due modi di giocare.
- **💰 Si rivende a meta' prezzo**, dal fabbro, e si vende **cio' che sta nel baule** — mai cio' che si ha
  addosso (il fabbro rifiuta *dicendo perche'*).
- **🔍 Due difetti trovati rileggendo i numeri.** (1) Il danno al secondo era pari ma i secondari no:
  l'Alabarda aveva portata 152 contro i 112 del Maglio a pari danno — non un bivio, la risposta giusta e due
  sbagliate. (2) Le descrizioni del mago promettevano «bolla grossa» e il campo per la grandezza non era mai
  stato impostato, pur essendo letto dal motore. Ora la bolla va da r6 a r24. Da li' la regola: **le
  descrizioni di `gear.js` nascono dai numeri, non si scrivono a mano.**
- **⚙️ La cadenza dall'equipaggiamento non esisteva.** `bonusOf` sommava `fireRateMult` e **nessuno lo
  leggeva**: le armature pesanti promettevano di rallentarti e non ti toccavano.
- **📏 `test/monete.js`**, nuovo: conta le monete che ogni ondata **contiene**, separando drop, premio di
  velocita' e taglia. In `gear.js` c'era scritto che il Mercato apriva ogni 3 ondate — **falso**, il
  villaggio si raggiunge alla fine di **ogni** ondata, e i vecchi prezzi erano tarati su quell'ipotesi.
- **💾 Salvataggio: formato da 1 a 2.** I salvataggi della 2.11 non si caricano piu': contengono ID di
  oggetti che non esistono. Non esploderebbero — ripartiresti disarmato e senza bonus, senza nessun errore,
  che e' molto peggio di un rifiuto pulito.
- **🧪 3119 test passati, 0 falliti.** Tre test che **codificavano la regola vecchia** sono stati riscritti:
  un test che dice «ogni pezzo e' migliore del precedente nella lista» adesso difende il bug.

## 🆕 Novita v2.11.3 (riprendendo comanda il salvataggio, non il menu)
- **🎭 SALVATO DA LADRO, RIPRESO CON LA SKIN DEL GUERRIERO.** Segnalato giocando, e riprodotto. Erano
  **due** difetti diversi:
  - **La skin (server).** Nome ed eroe viaggiano nello snapshot **una volta sola** (`p._sent`), perche' in
    partita non cambiano mai. Ma riprendere e' l'unico momento in cui la classe **cambia sotto i piedi del
    client**: senza riabbassare quella bandiera il client resta con la classe vecchia e disegna il
    personaggio sbagliato. Adesso `riprendi()` la riabbassa.
  - **La barra delle abilita' e il ritratto (client).** In `entra()` c'era `G.meHero = HUD.selectedHero`
    secco, e cancellava la classe appena letta dal salvataggio.
- **🧪 Riprodotto prima di correggere**, e riprovato togliendo la correzione: senza, lo snapshot successivo
  alla ripresa **non contiene la classe** e il client resta guerriero.

## 🆕 Novita v2.11.2 (ricontrollato il bug delle abilita', e trovato un difetto vero)
- **✅ Le abilita' di 8 e 14 arrivano davvero.** Ricontrollato su richiesta, e stavolta per la **strada
  vera**: ondata giocata fino in fondo (mostri uccisi, faglia attraversata, negozio raggiunto dal gioco) e
  poi si guarda cosa riceve il client. Al livello 8 arriva l'abilita' del tasto Q. E nel browser: il
  pannello disegna le due carte, il clic manda `pick_boon`, e finche' non scegli PROSSIMA MAPPA resta
  spento con scritto *«Hai un'abilita' da scegliere nella sezione ABILITA'»*.
- **🔍 Il controllo nel browser della v2.9.4 non verificava niente.** Chiamava `HUD.offerBoon`, che **non
  esiste** (la funzione vera e' `setBoons`), dentro un `if` che rendeva la chiamata un buco nel vuoto. Il
  server era giusto, ma quando avevo scritto "verificato" il **client non era mai stato provato**.
- **🐛 E cosi' e' saltato fuori un difetto vero.** Cliccando una carta **nello stesso fotogramma** in cui il
  pannello si chiude (cambia la fase), il gestore scriveva su `null` e sollevava: la scelta arrivava al
  server ma il pannello non si ridisegnava, e a schermo restava la carta come se il clic non fosse
  avvenuto. Corretto.
- **🧪 Il test nuovo fallisce sul codice vecchio** — verificato rimettendolo: *«offre: niente»* ai livelli
  8 e 14. Un test che non fallisce sul bug che dovrebbe prendere non serve a niente.

## 🆕 Novita v2.11.1 (due correzioni al mirino)
- **🐛 NEL VILLAGGIO NON SI CLICCAVA PIU'.** Col pointer lock il cursore **non esiste**, e nel villaggio il
  mouse serve proprio a quello: cliccare i pulsanti di fabbro, Ostessa, Erborista e Banditore. Adesso
  dentro il villaggio il guinzaglio si **spegne**, il cursore del sistema torna visibile e il mirino non si
  disegna nemmeno — li' dentro non si spara. Uscendo dalla faglia il mirino rientra subito nei 200 px.
- **⭕ TOLTO L'ANELLO a 200 px.** Si accendeva quando il mirino premeva contro il limite: all'occhio non
  funzionava, un cerchio che lampeggia addosso al personaggio e' rumore. Il limite si capisce lo stesso —
  il mirino si ferma.

## 🆕 Novita v2.11.0 (si puo' SALVARE la partita, dall'Ostessa)
- **💾 SI SALVA DALL'OSTESSA, per 10 monete, quando lo decidi tu.** Niente salvataggi automatici:
  scegliere quando salvare *e'* il salvataggio. La locanda e' il posto dove si salva in ogni gioco di ruolo
  da quarant'anni, quindi non c'e' niente da spiegare: ti avvicini, c'e' un pulsante.
- **▶️ RIPRENDI, nella prima schermata.** Compare solo se c'e' davvero un salvataggio, e dice a che punto
  sei: *«ondata 11 · Ladro Lv.11 — salvata ieri»*. Si riparte dal **villaggio** di quell'ondata con tutto
  quello che avevi: livello, abilita', carte, monete, pozioni, equipaggiamento.
- **☠️ Morire NON cancella il salvataggio.** Nessuno lo cancella: e' il punto di averlo.
- **🔑 Si salvano le CAUSE, non gli EFFETTI.** Nel pacchetto ci sono i punti spesi, le carte prese e
  l'equipaggiamento — non `dmgMult` o `maxHp`, che sono **calcolati**. Se salvassimo i numeri calcolati, il
  giorno che ritari una statistica ogni partita salvata resterebbe col bilanciamento vecchio, in silenzio.
  Cosi' invece un salvataggio vecchio prende automaticamente il bilanciamento nuovo.
- **📦 Vive nel browser** (`localStorage`): zero infrastruttura, nessun account. Il prezzo, detto chiaro:
  cambi browser o cancelli i dati del sito e non c'e' piu'. E se il browser non permette di scrivere
  (finestra anonima, spazio finito) **te lo dice**, invece di far finta di aver salvato.
- **🧱 Un pacchetto rotto si rifiuta INTERO.** Formato di un'altra versione, classe inesistente, livello
  impossibile: non si carica a meta'. Un personaggio impossibile e' molto peggio di un «non si puo'».
- **👥 In cooperativa per ora no**, e il pulsante lo dice invece di restare spento e muto.

## 🆕 Novita v2.10.0 (il mirino non si allontana piu' di 200px)
- **🎯 IL MIRINO AL GUINZAGLIO.** Il cursore lo muovi come vuoi: il mirino lo segue finche' sta dentro
  **200px** dal personaggio, e oltre si ferma sul bordo **conservando la direzione**.
- **🚫 Perche' non bastava "limitare il cursore".** Una pagina web **non puo' spostare il cursore del
  sistema** — non esiste un'API, ed e' voluto. L'unica strada e' il **pointer lock**: il browser nasconde
  il cursore vero e ci manda solo gli spostamenti, e da li' il mirino e' roba nostra. Si aggancia al primo
  clic; **Esc** lo rilascia, e allora il mirino segue il cursore vero, clampato allo stesso raggio. La
  regola e' la stessa nei due casi.
- **👁️ Un puntatore solo.** Il cursore del sistema sul canvas e' nascosto: se restasse visibile se ne
  vedrebbero **due separarsi** appena superi il raggio. L'**anello a 200px** si accende solo mentre il
  mirino preme contro il limite — sempre acceso sarebbe un orpello, li' e' la risposta alla domanda
  *«perche' non va piu' in la'?»*.
- **⚠️ Nessuna meccanica cambia, e va detto.** Il client manda al server solo `aim`, che e' un **angolo**:
  la distanza del mouse non e' mai stata mandata ne' usata. Il guinzaglio cambia **come si sente il gioco
  in mano**, non dove arrivano i colpi. Una gittata vera delle armi, se la vorrai, e' un altro lavoro.

## 🆕 Novita v2.9.4 (BUG GROSSO: le abilita' attive dei livelli 8 e 14 non venivano date)
- **🐛 LO SLOT E NON ARRIVAVA MAI.** Segnalato giocando e misurato: in una run normale — un livello per
  ondata — l'abilita' del tasto **Q** arrivava in ritardo (al livello **9**, appesa alla passiva) e quella
  del tasto **E** **non arrivava affatto**. A fine partita `E = null`. **Perso in ogni singola run**, perche'
  dopo il livello 12 non c'e' piu' nessuno scaglione che possa riaprire il pannello.
- **🔎 Le code sono DUE, il codice ne guardava UNA.** `scaglioniDovuti` (passive: 3, 6, 9, 12) e
  `abilDovute` (attive: 8 e 14). In **tre punti** si chiedeva «c'e' qualcosa da scegliere?» guardando solo
  la prima: quando si apre il pannello, dopo aver preso una passiva, e dopo aver preso rango o
  specializzazione. Adesso la domanda ha **una risposta sola** (`_scelteInCoda`), usata da tutti e tre.
- **🎁 Due livelli in un'ondata danno DUE cose.** 8 e 9 insieme: prima l'attiva, poi la passiva. 14 e 15
  insieme: la specializzazione **e** l'abilita' del tasto E — prima la specializzazione se la mangiava.
- **🧪 Il test legge i messaggi, non lo stato interno.** Guardare `p.abilDovute` avrebbe detto che
  l'abilita' c'era — e c'era, in coda — senza accorgersi che al giocatore non veniva mostrata mai. Il
  TEST 69 decodifica il JSON che il server manda al client e "clicca" su cio' che gli viene offerto,
  percorrendo le quattordici ondate di una run per tutte e tre le classi. Rimesso il codice vecchio,
  fallisce con quattordici errori.

## 🆕 Novita v2.9.3 (le guardie del villaggio sono state tolte)
- **❌ LA REGOLA DEL VILLAGGIO NON C'E' PIU'.** La v2.9.2 aveva introdotto le guardie — attacchi nel
  villaggio, il gioco si ferma, tre avvertimenti e sei fuori. **Era ingiocabile** e la v2.9.3 la toglie:
  nel villaggio si attacca come prima, e non succede niente.
- **💥 Il motivo, che vale la pena sapere: SPAZIO SPARA.** In `public/js/input.js` l'attacco e'
  `mouse.down || keys['Space']`, e Spazio e' **anche** il tasto che fa scorrere i dialoghi. Ogni Spazio
  premuto per leggere la ramanzina era un attacco nuovo appena il riquadro si chiudeva: la guardia
  ripartiva all'infinito e la partita si piantava.
- **🔍 E i test non l'hanno visto.** Quelli sul server chiamavano `setInput` a mano, quindi il legame fra
  «Spazio continua» e «Spazio spara» li' dentro **non esisteva**; la prova nel browser verificava che i tre
  avvertimenti comparissero *nell'ordine giusto* — e comparivano, ma per gli Spazio dello script, non per i
  clic. Verificava l'effetto e non la causa.
- **🧰 Il materiale resta.** Testi delle tre scene, ritratto della guardia e i due numeri in `constants.js`
  sono ancora nel progetto, spenti. Per rifarla servirebbe prima separare le due cose — vedi la nota in
  `CARATTERISTICHE.md`.

## 🆕 Novita v2.9.1 (il cimitero in stand-by: si apre in grotta)
- **⏸️ IL CIMITERO E' SPENTO, non cancellato.** `CIMITERO_FINO_A` da **1 a 0**: adesso **anche la prima
  ondata si gioca nelle grotte**, come tutte le altre. La pianta, i tipi di tessera (lapide, cinta,
  mausoleo, albero secco), il modo in cui il renderer li dipinge e i nomi di zona restano **tutti nel
  progetto**. Per riaccenderlo basta rimettere `1`.
- **🧪 E resta provato lo stesso.** `MG.generate(seed, level, forzaCim)` ha un terzo argomento che accende
  la pianta comunque, e serve ai soli test: una pianta che non genera piu' nessuno marcisce in silenzio, e
  il giorno che la riaccendi scopri che non funziona. TEST 65 adesso verifica **due cose**: che dall'ondata
  1 in poi si giochi in grotta, e che il cimitero forzato sia ancora sano (connesso, con le sue lapidi, e
  mai dentro un vulcano).

## 🆕 Novita v2.9.0 (i dialoghi riscritti, e lo sciamano diventa l'ORACOLO)
- **🧿 Lo sciamano e' l'ORACOLO.** Stesso antro, stessa casa con le ossa appese, stesso ritratto — cambia
  il nome, e cambia dappertutto: `mapgen`, server, renderer, HUD, missione in evidenza (*«Trova
  l'oracolo»*), documenti e test. **79 occorrenze in 9 file**, perche' un nome che sopravvive in meta'
  progetto e' un nome che un domani torna fuori nel posto sbagliato.
- **✍️ Tutti i dialoghi riscritti da capo.** Il risveglio, l'arrivo al villaggio e il discorso
  dell'oracolo: testo nuovo, piu' secco, piu' botta-e-risposta. Il risveglio adesso comincia dal
  personaggio che **non capisce cosa sta guardando** (*«Cos'e' quella luce?» · «No…» · «C'e' un portale.
  Nella mia stanza.»*), e la voce risponde senza rispondere (*«Perche' e' gia' troppo tardi per tornare
  indietro.»*).
- **⏸️ LE PAUSE.** Il copione ha delle didascalie — *«Pausa.»*, *«l'oracolo sorride appena»*. Stamparle a
  schermo direbbe al giocatore cosa dovrebbe provare; **non si scrivono, si sentono**: una riga marcata
  aspetta 900 ms in silenzio col volto gia' a schermo, e solo dopo comincia a scriversi. Otto righe del
  discorso sono marcate cosi', e sono le tre rivelazioni e i loro appoggi — *«Un Dio.»*, *«E ti sta
  guidando.»*, *«Non lo hai ancora capito?»*
- **🎭 Il colpo di scena non dice piu' "schermo".** Adesso e' *«E' quello che tiene gli occhi su di te in
  questo momento.»* Indicare lo schermo era spiegare la battuta: cosi' l'ultimo passo lo fa il giocatore.
- **🗣️ Tornando dall'oracolo c'e' un CONGEDO, non una riga.** Prima era una riga sola sparata al singolo
  giocatore: non si vedeva in due, non si saltava, non bloccava i piedi. Adesso e' una scena di cinque
  righe come le altre, e si chiude con l'unico dubbio di tutto il racconto: *«Il resto… lo decide lui. O
  forse lo decidi tu.»*

## 🆕 Novita v2.8.2 (la schermata d'avvio invoglia invece di spiegare)
- **✨ Un RICHIAMO sotto il titolo, al posto delle regole.** La colonna di destra aveva *«Come funziona una
  run»*: cinque punti fitti di numeri — due boss, quattro vie di crescita, i livelli 3·6·9·12 — da leggere
  prima ancora di aver premuto un tasto. Chi arriva nuovo non vuole un manuale, vuole sapere se gli
  interessa. Adesso sotto il titolo ci sono tre frasi, vaghe di proposito:
  > *Scendi. Venti volte, e ogni volta piu' a fondo. Le armi che impugni cambiano forma, i nemici imparano
  > in fretta, e laggiu' qualcosa si e' appena svegliato. Fra una discesa e l'altra c'e' un villaggio dove
  > tirare il fiato — poi si torna giu'.*
  A destra restano i **comandi**, che servono davvero mentre si gioca.
- **🧪 La modalita' di prova torna nascosta** — nascosta, non tolta. E' uno strumento di sviluppo, e in una
  schermata d'avvio un pannello che dice "parti dall'ondata 14" e' rumore. Si riapre come sempre con
  **`?test`** nell'indirizzo o col **tasto T** stando nel menu, e la T resta scritta fra i comandi.

## 🆕 Novita v2.8.1 (la schermata di fine ondata parla la lingua del patto)
- **🎁 I potenziamenti sono DONI, e adesso lo dice.** Dopo il colpo di scena la schermata fra un'ondata e
  l'altra diceva una cosa falsa — *«PUNTI — dove metti quello che hai imparato»*. Lui non impara niente:
  **riceve**. Adesso: *«PUNTI — cosa gli concedi»*, *«🎴 CONCEDIGLI UN'ABILITÀ»*, *«Dona al tuo avatar una
  nuova abilità»*, *«I poteri che hai concesso all'avatar»*.
- **📜 Il patto, una volta sola.** A fine ondata 1 compare la spiegazione per esteso; dalla seconda in poi
  restano solo le righe corte. Queste si leggono venti volte: la letteratura, letta venti volte, stanca.
- **🔇 L'invito a donare compare solo se c'e' davvero qualcosa da dare.** Con la scelta chiusa il titolo
  diventa *«nessuna scelta questa volta»*, e sotto restava un invito a fare una cosa impossibile.

## 🆕 Novita v2.8 (la stanza, il riquadro coi ritratti, e il colpo di scena)
- **🐛 IL BUG GROSSO: dal villaggio non si scendeva.** Uscendo dal villaggio d'apertura si finiva
  all'ondata 1 *sulla mappa del villaggio*. `nextWave()` rigenerava la mappa solo
  `if (this.wave > 1 && (… || this._forceNewMap))`: la bandiera **"rigenera" era chiusa dentro un
  controllo che all'ondata 1 e' falso**. Finche' all'ondata 1 ci si arrivava solo da `startGame` (che la
  mappa se l'era gia' fatta) non si vedeva; dalla v2.7 ci si arriva anche dal villaggio, e il risultato
  erano dodici mostri piantati addosso al giocatore in mezzo alle botteghe, su una mappa con **zero**
  posti dove farli comparire. La bandiera adesso vuol dire *rigenera*, punto.
- **🛏️ Non e' piu' una cella: e' LA TUA STANZA.** Assi per terra, muri di conci, un letto, una
  cassapanca, una lanterna accesa sul comodino — e in mezzo, dove ieri c'era il pavimento, un portale.
  Il testo dice *«perche' si e' aperto un portale nella mia stanza»*: con la roccia viva attorno quella
  frase non stava in piedi.
- **🖼️ Il dialogo e' un RIQUADRO AL CENTRO, col ritratto di chi parla.** Prima era una striscia in basso
  col testo su uno sfondo sfumato: elegante e illeggibile. Adesso e' un riquadro opaco, bordato d'oro,
  con dentro la faccia di chi sta parlando — **guerriero, mago, ladro e oracolo**, disegnati a codice
  come tutto il resto. La voce senza volto del risveglio non ha ritratto, ed e' la scena.
- **🔒 Mentre parla qualcuno non ci si muove.** Il blocco sta sul **server**: il client puo' anche
  smettere di mandare i comandi, ma chi decide dove sta un giocatore e' il server.
- **🎭 IL COLPO DI SCENA.** L’oracolo non dice *«l'eroe sei tu»*: dice che dietro l'avatar c'e' una
  **divinita' seduta davanti a uno schermo**, e che e' lei a donare i poteri. Cosi' la rivelazione non
  strizza l'occhio — **spiega una regola**: le carte che arrivano a fine ondata sono i suoi doni.
  Ed e' un dialogo vero, con l'avatar che non capisce e continua a chiedere.
- **📋 "MISSIONE PRINCIPALE"**, non "missione": il filo della storia resta acceso per tutta la partita,
  ma taglie, prigionieri e tutto il resto continuano a funzionare come sempre.

## 🆕 Novita v2.7 (la storia: ci si sveglia, si attraversa, si parla, si scende)
- **🕯️ La partita comincia con uno che si SVEGLIA.** Non con un'ondata. Una cella piccola, quasi nera, una
  faglia viola in mezzo e una voce che non dice ne' dove sei ne' chi e':
  *«Sei sveglio. Non chiedere dove. Non te lo direi. Sei sceso da solo. Nessuno scende da solo.»*
  Non c'e' niente da raccogliere e niente da uccidere: c'e' una faglia. E' voluto — il primo minuto di
  gioco non deve avere alternative, se no diventa una caccia al tesoro al buio.
- **🏘️ Si arriva al VILLAGGIO con la missione in evidenza** (*«Cerca l’oracolo. Sa cosa sei.»*): un
  riquadro piccolo in alto a sinistra che dice cosa stai facendo, senza doverlo chiedere a nessuno.
- **🧿 L’ORACOLO dice di cosa parla il gioco.** Avvicinandosi parte il discorso: sotto c'e' una cosa che
  non dorme, si chiama **AZ'GAROTH**, venti volte la roccia si aprira', e *«noi ci abbiamo provato: siamo
  ancora qui, quindi hai capito com'e' andata»*. E una riga che riapre la scena della cella: **«Ti ho
  parlato mentre dormivi.»** — la voce del risveglio era lui, e non si presenta mai apposta.
- **💬 Sottotitoli che si SCRIVONO**, una lettera alla volta. Non e' un vezzo: una riga che appare tutta
  insieme si legge in un colpo d'occhio e si preme subito, e la voce non ha il tempo di essere una voce.
  **Spazio** continua (il primo finisce la riga, chi ha gia' letto non aspetta), **Esc** salta.
- **⏭️ Si salta sempre, ma non si spegne.** Saltare salta la SCENA, non la partita: si arriva al villaggio
  lo stesso, la missione cambia lo stesso, si scende lo stesso. In due o piu', il dialogo lo fa scorrere
  **chi ha aperto la stanza** — se dovessero premere tutti, ogni riga diventerebbe l'attesa dell'ultimo
  distratto.
- **📜 Tutto il testo sta in un file solo** (`shared/storia.js`). Si riscrive dieci volte prima di suonare
  giusto, e riscriverlo dentro il codice del server vorrebbe dire rileggere la logica ogni volta.

## 🆕 Novita v2.6 (il villaggio rifatto: due file di case, una piazza di terra, il portale nella casa delle guardie)
- **🏘️ PIANTA NUOVA — due file di edifici e lo spiazzo in mezzo.** La pianta della v2.0 era una sala con
  delle stanze appese dove capitava: si leggeva come un livello, non come un paese. Adesso il villaggio e'
  **60x46** ed e' costruito sull'unica cosa che lo rende riconoscibile dall'alto: **due file di case che si
  guardano**, le vie lunghe davanti alle porte, e in mezzo lo spazio comune. Cinque edifici per fila, tre
  case nello spiazzo (una a settentrione, due a mezzogiorno), tredici in tutto.
- **🪨 Fuori si cammina sulla ROCCIA DELLE GROTTE.** Il villaggio aveva una tavolozza sua — pietra calda — e
  si vedeva: una sala beige con dentro delle case, mentre tutto il resto del gioco e' roccia fredda. Adesso
  fuori dalle case il pavimento e la roccia sono quelli della cripta, cotti dalla **stessa cottura**
  (`_bakeCaverna`): massi tondi, ombre proiettate, contrasto vero. **Il perimetro del paese e' cinto dalle
  stesse rocce**, e le pareti delle case restano conci di pietra squadrata — perche' il paese e' *scavato*,
  non costruito. **Dentro le case il pavimento resta quello di prima**: assi, lastre, terra.
- **🟫 La piazza e' TERRA BATTUTA**, non un giardino: chiazze, ghiaia chiara e scura, qualche solco, e il
  **bordo sfrangiato** — una piazza si consuma dove ci si cammina, e un rettangolo pieno si leggeva come un
  tappeto srotolato sulla roccia. Attorno, il **giro di dodici torce** e **dodici bancarelle**.
- **🌀 Il portale non e' piu' in mezzo alla piazza**: sta nella **casa del portale**, la prima della fila di
  ponente, con **due guardie sulla soglia**. Uno spiazzo con un buco viola nel mezzo non e' una piazza.
- **💡 Piazza chiara, resto buio** (`VILL_PIAZZA`, `VILL_PZ_ORLO`): dentro il rettangolo della piazza il
  buio vale meno, e fra i due si passa sfumando. Non e' una luce appoggiata sopra — quella sarebbe di nuovo
  una patina — e' buio che si toglie.
- **🧿 La Cartomante e' diventata lo ORACOLO** (per ora non fa nulla). Le sue carte erano spente da tempo,
  quindi non si perde niente: cambia chi abita l'antro, e non e' piu' un mago viola col ventaglio di carte
  ma verderame, ossa e ciotola dei fumi.
- **🩶 E la patina, davvero.** Non era uno strato di troppo: era uno **sfasamento**. Il buio si bucava con un
  raggio e il bagliore caldo si disegnava con un altro — l'alone dell'eroe usciva a 275 px dentro un buco di
  130, e quei 145 px di differenza sono luce appoggiata sul buio. Adesso i due passaggi leggono **la stessa
  lista di sorgenti**: nessun bagliore senza il suo buco, nessun buco piu' piccolo del suo bagliore. Piu' due
  colpevoli minori: la **cottura piatta** del villaggio (una tinta uniforme senza nero) e la **fascia viola
  della faglia** cotta anche sui bordi del paese.

## 🆕 Novita v2.5 (la patina vera, le bancarelle, e la gente che non e' piu' tutta uguale)
- **🩶 La patina non era la velatura: era la NEBBIA.** In v2.4 il velo era sparito e il villaggio restava
  appannato lo stesso. `_drawFog` stende **quattordici macchie grigio-azzurre** sull'inquadratura a ogni
  fotogramma — nelle grotte ci vogliono, nel villaggio no, e nessuno le aveva toccate. Adesso la nebbia sta
  dietro un `if (!this.map.lit)`. **Quando si toglie una cosa si controlla anche quello che non si e'
  toccato**: e' l'unico modo di non lasciare in giro meta' del difetto.
- **🧰 Sei bancarelle di contorno** (pane, carne, pesce, vasi, tessuti, candele), con tendone a righe, banco,
  la merce del mestiere e la sua insegna. **Non sono negozi**: non si aprono, non hanno dialogo, non sono
  mercanti. Servono a far sembrare abitata la piazza — ma ingombrano, quindi ci si gira attorno.
- **🧍 Sette tipi di paesano, disegnati da zero** (paesano, paesana, vecchio, bimbo, bottegaio, monaco,
  minatore): prima erano tutti la sagoma del ladro ricolorata. Ognuno ha veste, statura e **una cosa sola**
  che lo distingue da lontano — il cesto, la barba e il bastone, il grembiule, l'elmetto col piccone, la
  palla, il sacco in spalla, il cappuccio. **I quattro eroi restano col loro pattern, intatto.**
  *Due tentativi buttati prima di arrivarci*: un ovale con un pallino di fianco (sassi con la faccia), poi
  un cerchio con due moncherini dietro (Topolino). Dall'alto una persona si legge dalla **proporzione**:
  corpo schiacciato davanti-dietro e largo di traverso (le spalle), testa che **sporge**, braccia ai lati
  con le **mani** in punta.
- **🪤 Il mimic torna a essere una sorpresa**: `MIMIC_PROB` da **30% a 6%** per cassa. Il conto giusto si fa
  per ondata, non per cassa: con quattro casse si passa da **76% a 22%** di trovarne almeno uno — da tre a
  ondata a circa uno ogni cinque ondate. Al 30% non era una rarita', era una tassa.

## 🆕 Novita v2.4 (via la patina: il villaggio e' buio, e la luce la fanno le sorgenti)
- **🩶 Cos'era la patina.** Dalla v2.2 il villaggio aveva sopra una velatura: un rettangolo semitrasparente
  steso su tutto. **Un velo uniforme non scurisce, SBIANCA** — schiarisce i neri quanto spegne i chiari — e
  il risultato era una pellicola grigia appoggiata sul disegno. Il difetto non era il valore, era il metodo.
- **🕯️ Adesso il villaggio e' quasi nero** (`VILL_BUIO: 0.90`) e la luce la fanno **solo le sorgenti**, che
  ci scavano dentro i loro buchi: focolari, falo', bracieri, aloni dei mercanti, portale e lanterne dei
  girovaghi. Stesso meccanismo del campo visivo delle grotte, applicato alle sorgenti invece che alla vista:
  **li' si aggiungeva grigio, qui si toglie buio**.
- **💡 E ogni sorgente illumina il doppio di area** (`VILL_LUCE: 1.45`). Attenzione al numero: "area doppia"
  e' radice di due sul raggio, non due — col raggio raddoppiato l'area e' quadrupla, e infatti al primo
  tentativo il villaggio si e' acceso tutto. Il test pretende che il conto torni a 2, non a 4.

## 🆕 Novita v2.3 (il villaggio di notte, e la gente che ci cammina)
- **🌑 Parecchio piu' scuro**: `VILL_OMBRA` da 0,26 a **0,55**. Non e' "meno visibile", e' un altro posto —
  un paese sottoterra di notte, dove a far vedere sono i fuochi: i focolari delle case, il falo' della
  piazza, gli aloni dei mercanti. Le botteghe si trovano seguendo la luce.
- **🚶 Dieci girovaghi camminano per le strade**: due corsie per verso sulla via alta e sulla via bassa,
  una sulla via maestra, due che **girano attorno al portale**, un paio che vanno e vengono dai vicoli.
  Si fermano al capolinea, si guardano attorno, tornano indietro.
- **🧮 Non si muovono: sono una funzione del tempo della partita.** Il server non manda niente, tutti li
  vedono nello stesso punto, e chi entra a meta' sosta li trova dove devono essere. Zero banda, zero
  sincronizzazione. Non hanno corpo solido: ci si passa attraverso, ed e' voluto.
- **🏮 Ognuno si porta una lanterna**: col villaggio buio erano sagome nere. E' anche il motivo per cui le
  strade si leggono — le percorre della gente con la luce in mano.

## 🆕 Novita v2.2 (la schermata principale, e il villaggio un po' piu' sottoterra)
- **🏠 Il titolo esce dal pannello** e va sullo sfondo; sotto, **due colonne**: a sinistra si entra in
  partita, a destra c'e' la guida **aperta**, senza accordion. Ogni colonna scorre per conto suo; sotto i
  1080 px si impilano. Vale solo per la schermata principale.
- **⌨️ E finalmente c'e' scritto cosa fanno i tasti** — tutti, **tasto L compreso**. Il test li pretende uno
  per uno: se un domani se ne aggiunge uno e non lo si scrive, casca li'.
- **🎯 Sotto, le cinque cose che contano** in una run: ondate e boss, le due vite, i quattro modi separati
  di crescere, l'evoluzione delle armi, il villaggio. Niente immagini: una guida fatta di schermate
  invecchia alla prima modifica alla grafica.
- **🕯️ Il villaggio e' un po' piu' sottoterra**: una velatura leggera (`VILL_OMBRA: 0.26`) al posto della
  luce piena della v2.0.2. Resta tutto leggibile — e' il motivo per cui quella mappa e' illuminata.

## 🆕 Novita v2.1.4 (la torcia parte accesa)
- **🔦 Lo strato del tasto L e' acceso all'avvio.** Insieme al campo visivo della v2.1 e' l'illuminazione
  giusta: il campo visivo da' la forma e le ombre dei muri, questo scava i tondi di luce attorno alle
  sorgenti. Il valore predefinito era gia' "acceso", ma chi l'aveva spento anche una volta si ritrovava uno
  `0` salvato nel browser che comandava per sempre.
- **🔑 Percio' la chiave ha cambiato nome** (`dr_torch` → `dr_torcia`): chi aveva spento riparte acceso **una
  volta sola**, e da li' in poi la L continua a spegnere, accendere e ricordarsi la scelta.

## 🆕 Novita v2.1.3 (la penombra)
- **🌒 Il bordo delle ombre non e' piu' un taglio netto.** Geometricamente era giusto — un raggio o passa o
  non passa — ma nessuna luce vera fa un bordo cosi'. Adesso il velo si **sfoca** quando lo si appoggia
  (`FOV_SFUMA: 6` px): una sola operazione per fotogramma, e ammorbidisce insieme i bordi delle ombre e la
  coda delle due luci. Con `0` si torna al taglio netto.
- **📐 E la tela del velo e' 26 px piu' grande dello schermo per lato**, se no il bordo sfumato cadrebbe sul
  bordo dello schermo e si vedrebbe una cornice chiara attorno al gioco. I due numeri vanno insieme, e il
  test lo pretende.

## 🆕 Novita v2.1.2 (due luci: l'alone e il fascio)
- **🔦 Una torcia fa due cose insieme**: un **alone** largo che illumina attorno (470 px davanti, 251 di
  fianco, 118 dietro) e un **fascio** stretto che va lontano dove punti (**1150 px**). Prima era una goccia
  sola e doveva fare entrambe.
- **🔗 E si integrano perche' il cono non e' una forma nuova**: e' *la stessa formula* dell'alone con numeri
  diversi. Due curve continue, il fascio si spegne da solo girandosi, e verso i 60 gradi il comando passa
  dall'uno all'altra senza che si veda dove. Il test lo pretende come numero: **salto massimo 3,8%** da un
  grado al successivo.
- **🌗 Le sfumature sono il punto.** Ogni luce ha la sua curva, e il numero che decide tutto e' *fino a dove
  resta piena*: l'alone per il 22% della portata, il fascio per il 34% (100% fino a 400 px, 64% a 750, 51%
  a 900). Al primo tentativo il fascio calava da subito e **sembrava corto** per quanto lontano arrivasse.
- **🔥 Tre lampade calde in fila** lungo la direzione in cui guardi: senza, il fascio si leggeva come *meno
  buio* invece che come luce. Sono dentro il ritaglio: un muro le ferma.

## 🆕 Novita v2.1.1 (fascio piu' lungo, ombra solo dai muri)
- **🔦 Il fascio arriva piu' lontano**: `FOV_AVANTI` da 690 a **1060 px** — davanti si vede oltre il bordo
  dello schermo. `FOV_FORMA` e' salita con lui (1,7 → 2,1) cosi' il fascio si allunga **senza allargarsi**:
  di fianco resta 338 px, alle spalle 118. Rapporto davanti/dietro: **9x**.
- **🪦 L'ombra la fanno solo i muri.** La griglia e' binaria e per lei una lapide e un masso sono uguali:
  ogni lapide proiettava il suo cono d'ombra, e un campo di lapidi diventava una grattugia. Adesso la luce
  legge il tipo vero della tessera (`m.muri`, l'array della v1.97): **la lapide non fa ombra**, roccia,
  pietra delle cappelle, cinta e alberi secchi si.
- **⚠️ Vale solo per la luce**: per le collisioni e per l'IA una lapide resta un muro, e deve restarlo.

## 🆕 Novita v2.1 (la torcia: si vede quello che si puo' vedere)
- **🔦 Il buio delle grotte non e' piu' un cerchio.** Prima vedevi un'area tonda attorno a te — davanti, di
  fianco, dietro, uguale — e una stanza dietro una roccia si vedeva come una stanza aperta. Adesso e' una
  **torcia in mano**: una sola macchia di luce, **lunga davanti e corta dietro**, tagliata dai muri.
- **📏 La forma**: 690 px davanti, 294 di fianco, **118 alle spalle** — 5,8 volte piu' lontano davanti che
  dietro. Tre numeri in `constants.js` (`FOV_AVANTI`, `FOV_DIETRO`, `FOV_FORMA`) e la si ritara.
- **🪨 I muri fanno ombra davvero.** Si tirano raggi su tutto il giro: ognuno si ferma dove sbatte, e le
  punte disegnano la macchia. Dietro il muro il raggio non arriva, quindi la luce non arriva. L'occlusione
  non e' un calcolo a parte: e' la stessa cosa.
- **💡 Anche le luci seguono la regola**: una torcia dietro una roccia non illumina piu' la roccia.
- **👥 In cooperativa la visuale e' condivisa**: quello che vede un compagno lo vedi anche tu.
- **🏘️ Il villaggio no**: la sosta e' illuminata (`lit`, v2.0.2) e resta com'e'. Il test lo pretende ondata
  per ondata.
- **⚠️ Conseguenza voluta**: i nemici alle spalle non si vedono piu'. Restano sulla minimappa.

## 🆕 Novita v2.0.2 (nel villaggio si vede)
- **💡 Il villaggio non e' piu' al buio.** Su ogni mappa il gioco stende un velo scuro attorno al giocatore:
  nelle ondate e' meta' del gioco, in una sosta e' solo un fastidio. Nel villaggio **quel velo non si stende
  piu'**, e la mappa si vede tutta.
- **🎯 Vale per UNA mappa sola.** La pianta della sosta dichiara `lit: 1`; nessun'altra lo fa, e il renderer
  legge quella bandiera, non il tipo di mappa. Le ondate restano buie come prima — il test lo pretende,
  ondata per ondata.
- **🔦 Rimosse le 57 torce della v2.0.1.** Risolvevano il problema al contrario: erano una tappezzeria di
  fiammelle messa li' a combattere un velo che bastava togliere. Il villaggio torna alle sue luci di sempre
  (il falo', i sette focolari, gli aloni dei mercanti).
- **🎨 Schiarita la tavolozza del villaggio**, che era tarata per essere guardata *attraverso* il velo: senza,
  il pavimento era una macchia quasi nera. E fuori dai bordi della mappa adesso c'e' roccia, non il fondo
  viola della pagina.
- **⚡ Resta il ritaglio delle fiamme** della v2.0.1: si disegnano solo quelle inquadrate, su tutte le mappe.

## 🆕 Novita v2.0.1 (il villaggio si accende)
- **🔦 Molte piu' torce.** Il villaggio aveva **tre** sorgenti di luce (il falo', i sette focolari e gli aloni
  dei mercanti): su 56x40 le strade restavano al buio. Adesso sono **84**: 57 torce a muro, 4 bracieri agli
  angoli della piazza, una **lanterna appesa sopra ogni porta**, piu' quelle di prima.
- **📏 Messe in modo regolare, non a caso**: una ogni quattro tessere sulle pareti rivolte a sud (quelle che
  si vedono dall'alto), una ogni otto sulle altre tre. Nelle caverne il 6% per tessera fa il pulviscolo di un
  posto abbandonato; qui e' un paese che qualcuno illumina apposta.
- **🏠 Dentro le case nessuna torcia**: hanno gia' il focolare acceso in mezzo e la lanterna sulla soglia.
- **⚡ E le fiamme adesso si ritagliano sul riquadro.** Un difetto che c'era da sempre: ogni torcia della
  mappa veniva disegnata a ogni fotogramma, anche fuori schermo, e ogni fiamma semina scintille. Con le 11
  torce di una caverna non si notava; col villaggio illuminato si sarebbe visto. Vale per **tutte** le mappe.

## 🆕 Novita v2.0 (il villaggio sotterraneo)
- **🏘️ La sosta e' un VILLAGGIO DI NANI.** Non piu' cinque stanze attorno a una piazza (34x26) ma un paese
  scavato nella roccia, **56x40**: la piazza al centro col **pozzo**, cinque **botteghe in edifici separati**
  (osteria, fucina ed erboristeria grandi; l'antro della cartomante e la gilda del capitano piu' piccole) e
  **sette case abitate**, con la porta aperta. Le strade attraversano il paese da parte a parte, non vanno da
  una porta all'altra: e' la differenza fra un villaggio e un corridoio con delle stanze.
- **🔥 Nelle case ci si entra.** Focolare acceso in mezzo, letto, tavolo, madia — e la gente dentro. Il
  focolare e' una **luce viva**: e' quella che esce dalla porta e dice, da fuori, che la casa e' abitata.
  Le sette case sono arredate dalla stessa funzione ma **si specchiano e variano**: una su tre ha due letti
  (una famiglia), chi ha la rastrelliera degli attrezzi, chi lo scaffale, chi un tappeto davanti al fuoco.
  Sono venuti fuori **cinque arredamenti diversi su sette**.
- **🧍 Ventidue abitanti, e fanno qualcosa**: chi si scalda al fuoco e dondola, chi martella, chi rimesta la
  pentola, chi va e viene per la strada. Movimento piccolo apposta — si legge con la coda dell'occhio mentre
  compri — e il loro corpo resta fermo dov'e', se no ci si passerebbe attraverso.
- **🌀 Il portale e' al centro della piazza**, ed e' **la stessa faglia** che si apre a fine ondata: stesso
  disegno, stesso gesto. Attraversarla riporta al menu di fine ondata. Nella griglia non c'e' piu' nessuna
  tessera EXIT.
- **⏳ Via il timer.** In multiplayer la sosta si chiudeva da sola dopo 120 s: adesso si riparte **solo**
  quando qualcuno entra nel portale. Il villaggio e' un posto in cui si sta, non una schermata da sbrigare.
- **🪑 Tre mobili nuovi** nello stile di tutti gli altri: pozzo, focolare e letto.
- **📐 Misurato**: 1213 tessere calpestabili, connesse al 100%, e **il 99,9% raggiungibile coi mobili al loro
  posto** — ogni bottega, ogni casa, ogni mercante e il portale si raggiungono a piedi.
- **🧪 Nuovo test 67** su tutto quanto sopra, camminata compresa. **2098 test, 0 falliti.**

## 🆕 Novita v1.99.2 (il centro della caldera si arreda)
- **🔥 Via le pozze dalla caldera.** Le crepe della faglia in mezzo all'arena facevano un brutto effetto: una
  macchia arancione larga mezza conca. Tolte, e con loro anche le pozze normali — nella caldera adesso ce ne
  sono **zero**. Le altre ondate non cambiano: 5 → 11 pozze, 7 → 11, 15 → 18, come sempre.
- **🪨 Al loro posto, ORNAMENTI**: sassi piccoli, **bracieri**, ossa e macerie, sparsi in campo aperto e
  lontani dai muri (il contrario delle altre decorazioni, che stanno in nicchia: qui il vuoto da riempire e'
  il centro). Restano fuori dalle 7 tessere attorno alla partenza.
- **🧱 Non costano una tessera.** Sono props: li disegna il renderer, la griglia non li conosce e le
  collisioni nemmeno. L'arena resta **sgombra** come nella v1.99.1 e il boss ci gira. Sgombra non vuol dire
  vuota.
- **🧪 Test 66**: pretende zero pozze nella caldera e, su cinque semi, almeno 10 sassi, 4 bracieri, 8 pezzi
  di ossa e **25 ornamenti lontani da ogni muro**. **oltre 1930 test, 0 falliti.**

## 🆕 Novita v1.99.1 (l'arena sgombra, il Colosso che ti viene addosso)
- **🌋 La caldera si apre.** Via la **cresta** e i **10-14 speroni** in mezzo alla conca: erano coperture per
  te, ma per un boss di raggio 38-52 erano trappole in cui incastrarsi. Restano **6-10 massi appoggiati al
  bordo**. Misurato su cinque semi: **1404-1427 tessere** calpestabili (erano 1208-1254), **0 rocce isolate**
  nell'arena, **1202-1224 caselle larghe 3x3 connesse al 100,0%** (erano ~730 al 98,5-100%).
- **🧍 Il Colosso non e' piu' un bersaglio fermo.** Cammina piu' svelto (`speed 74 → 92`), il **pugno anticipa
  il tuo movimento** (strafare in linea retta adesso ti porta dentro il colpo), e da oltre 200 px **ti carica
  addosso**: telegrafo 0,45 s, poi 3x velocita' per 0,9 s con danno al 120%. Se sbatte contro un muro resta
  scoperto 0,7 s. Onde d'urto ogni 5,6 s invece di 7,0.
- **📊 Misurato girandogli attorno sparando**: a 300 px lo scontro passa da **43 s a 31 s** e incassi
  **175 → 255 PV** su ~325 (**+46%**); a 450 px da 197 a 253. Nessun PV del boss e' stato toccato: cambia
  *come ti raggiunge*, non quanto e' duro.
- **🧪 Test 66 esteso**: nessuna roccia isolata nell'arena su cinque semi, e la carica del Colosso esiste e
  parte davvero a piu' del doppio della velocita' a piedi. **1920 test, 0 falliti.**

## 🆕 Novita v1.99 (la caldera dei boss, menu nero, prova visibile)
- **🌋 Le ondate 10 e 20 si giocano nella CALDERA.** Non e' costruita da nessuno: e' successa. Conca larga,
  **cresta** di roccia spezzata a meta' pendio, **speroni** come coperture *(rimossi in v1.99.1)*, e in
  mezzo la **faglia aperta** —
  crepe che fanno male a chi ci cammina *(rimosse in v1.99.2: al loro posto ci sono gli ornamenti)*.
- **🧱 Zero righe di renderer**: speroni e cresta sono roccia (la cottura li disegna gia'), le crepe sono le
  pozze di pericolo che il motore ha dalla v1.62. L'elenco delle ondate e' in `constants.js`
  (`CALDERA_ONDATE: [10, 20]`): una virgola per aggiungerne una, vuoto per spegnerla.
- **🗿 E il boss ci gira**: oltre **730 caselle larghe 3x3** connesse al 98,5-100% (e' su quelle che si muove
  un raggio 52). In partita: il Colosso si sposta di 1328 px in 40 s, AZ'GAROTH di 577.
- **🐞 Corretto un ciclo infinito vecchio dalla v1.22**: `_drawCritters` cercava all'infinito un punto
  non-muro dentro l'inquadratura. Se guardavi un angolo tutto roccia il gioco **si piantava** — con la
  caverna non capitava quasi mai, con la caldera bastava un angolo.
- **🖤 Il menu torna nero**: via l'illustrazione di sfondo da menu e sala d'attesa (i file restano in
  `assets/art/`).
- **🧪 La modalita' di prova e' di nuovo visibile** nel menu, con le sue venti ondate.

## 🆕 Novita v1.97 (il cimitero delle prime due ondate)
- **🪦 La prima pianta che non e' una grotta.** Fino alla 1.96 ogni mappa di combattimento veniva dalla
  stessa funzione — una caverna scavata. La **prima ondata** si gioca in un **cimitero** *(dalla v1.98:
  prima erano le prime due)*; dalla seconda torna la caverna di sempre. Il confine e' un numero solo:
  `CIMITERO_FINO_A` in `constants.js`.
- **📐 Com'e' fatto**: settori separati da vialetti (3-4 tessere: ci passa anche il boss piu' grosso),
  dentro file regolari di **lapidi**, e poi **mausolei** in cui si entra, **muri crollati** da cui
  ripararsi, **fosse** che rompono la griglia. E' l'ordine — linee rette, ripetizioni — a farlo sembrare
  un altro gioco: la caverna e' tutta disordine organico.
- **🎯 Le lapidi bloccano il tiro ma non il passo**: ci giri intorno in un passo solo. E' l'opposto della
  roccia, e cambia chi ci guadagna — il mago perde le linee lunghe, il guerriero no.
- **🧩 Zero righe di IA toccate**: la griglia resta binaria e i tipi delle tessere (lapide, cinta, pietra,
  albero) viaggiano in un array che legge **solo il renderer**.
- **🖌️ Il disegno costa zero a fotogramma**: lapidi, alberi secchi e conci squadrati si dipingono una volta
  per mappa sulla stessa tela fuori schermo della caverna.
- **🌫️ E' molto piu' aperto della caverna** (2350 tessere libere contro 1370): ci si vede da lontano, e
  quindi i nemici ti trovano prima. Alle prime due ondate e' un buon modo di cominciare.

## 🆕 Novita v1.96 (dall'ondata 9 se ne vedono 22 alla volta)
- **👥 Il tetto dei vivi diventa due numeri**: **40** fino all'ottava ondata, **22 dalla nona in poi**.
  Alla 19 erano quaranta mostri in campo insieme: non e' un combattimento, e' una calca, e la mappa
  sotto non si vede piu'.
- **🔢 Il totale dell'ondata non cambia di un nemico.** Cambia quanti ne hai addosso, non quanti ne devi
  uccidere: chi non ci sta aspetta in **coda** ed entra quando ne muore uno.
- **⏱ E l'ondata non si allunga**: con un giocatore che uccide a ritmo costante, la 15 si chiudeva in 21 s
  e adesso in 23, la 18 in 24 e adesso in 22. Nei limiti del rumore.
- **📉 In campo insieme, prima → dopo**: ondata 9 da 28 a **22**, 12 da 35 a **22**, 15 da 38 a **22**,
  19 da 40 a **22**.
- Il numero e' una riga in `constants.js` (`MAX_ALIVE_TARDI`), lo scaglione pure (`MAX_ALIVE_TARDI_DA`).

## 🆕 Novita v1.93 (nessuna abilita', arma o armatura cura piu')
- **🚫 Regola, non taratura.** Nessuna carta, sinergia, specializzazione, patto o pezzo di equipaggiamento
  rimette un solo PV. Rimettersi in piedi deve costare qualcosa che si vede: monete, una carica di pozione,
  un giro dall'Ostessa.
- **Cosa e' sparito**: 🩸 **Vampirismo** (+9% del danno inflitto ti curava), la sinergia 🩸 **Sete di
  Sangue** (+6%), il 🩸 **Patto Sanguinario** del Mercante Nero (+10%), la cura dell'✨ **aura del
  Paladino** e il buff ➕ **Vigore**. Col Vampirismo divino il 25% di ogni colpo tornava in vita.
- **🔧 E soprattutto i due campi del motore**, `stats.lifesteal` e `stats.regen`: **tolti, non azzerati**.
  Finche' il campo esiste, prima o poi qualcosa lo riempie — ed e' cosi' che la cura era sopravvissuta a
  tutte le pulizie precedenti.
- **🛡 Al suo posto** (la griglia e' 2 carte per classe e rarita'): **Presa Salda** — +60% rinculo dei tuoi
  colpi, -6% ai danni subiti — e la sinergia **Muro d'Acciaio** con Adrenalina Pura.
- **🧪 Test 64**: prova **tutte** le carte, i ranghi, i patti e l'equipaggiamento (51 casi) *giocando* —
  mezza vita, cinque secondi di colpi — e fallisce col nome del colpevole se i PV salgono di uno. Vale
  anche per la carta che verra' aggiunta domani.
- **Chi cura ancora**: Ostessa, pozioni, Bende del Viandante, Pozione di Salute a terra, ricompensa della
  combo di 40 e Ultima Occasione. Nessuna e' un'abilita', un'arma o un'armatura.

## 🆕 Novita v1.92 (i nemici tornano a cercarti con gli occhi)
- **🐾 Chi non ti vede VAGA, non ti cerca.** Dalla v1.80 chi non ti vedeva ti veniva a prendere lo stesso
  seguendo il campo di flusso: alle ondate alte l'ondata intera sapeva sempre dove sei e ti arrivava
  addosso in massa. Adesso gira per la mappa a caso finche' non entri nel suo **campo visivo**
  (`sightRange` + linea di vista libera), com'era fino alla v1.79. Un nemico deve **accorgersi** di te.
- **📉 Quanto cambia** (giocatore fermo, in singolo, nemici entro 620 px): ondata 1 dopo 45 s, da **12 su
  12** a **0 su 12**. Con un giocatore che esplora la differenza e' tutta all'**inizio** dell'ondata: alla
  12 quelli che ti trovano nei primi quindici secondi passano da **11 a 5,7**.
- **👥 Il tetto alla folla resta**: sei alla volta si fanno sotto, gli altri stanno all'anello dei 900 px —
  cosi' l'ondata resta a portata di esplorazione invece di dissolversi in un angolo.
- **🧪 Test 56 riscritto**: non misura piu' "quanto ti arriva vicino" (vagando, ogni tanto ti capita
  addosso davvero, ed e' giusto), misura il **modo**: o ti vede, o vaga. Il terzo stato non esiste piu'.

## 🆕 Novita v1.91 (modalita' di prova)
- **🙈 Dalla v1.96.1 e NASCOSTA**: si apre con **?test** nell indirizzo (`http://localhost:8080/?test`)
  o col **tasto T** stando nel menu. Il codice resta tutto: nascosto non vuol dire tolto.
- **🧪 Venti pulsanti, uno per ondata.** Nel menu, sotto ENTRA IN PARTITA, un pannello a scomparsa
  **"Modalita' di prova"**: si clicca l'ondata e la run parte da li', in una stanza tutta propria e senza
  passare dalla sala d'attesa. La **10** e la **20** sono marcate ☠ (i boss).
- **🎒 Il personaggio non parte nudo**: livello, punti spesi, passive, abilita', equipaggiamento del rango
  giusto e monete sono quelli che a quel punto **avresti** — se no alla 16 non si prova niente.
- Serve a guardare **prestazioni e giocabilita'** senza rigiocare quattordici livelli per vedere il quindicesimo.

## 🆕 Novita v1.90.2 (prestazioni: i ragni e il Beholder)
- **Il frame costa meno della metà.** Misurato con un profilo vero su una scena d'ondata 16: da **5,3 ms
  a 2,0 ms** di mediana; all'ondata 12 da **6,4 a 1,8 ms**.
- **I ragni erano il collo di bottiglia**: uno solo costava **1313 macchie a frame** (56 per zampa, sedici
  passaggi di zampa) — quasi cinque volte tutto il resto della scena messo insieme.
- **Il Beholder era il secondo**: 936 chiamate ciascuno.
- Per tutti e due la cura è quella che il Troll usa dal v1.47: **la posa si disegna una volta in un
  riquadro fuori schermo e poi si incolla**. Del Beholder si cuoce solo il corpo — l'occhio segue il
  bersaglio e resta disegnato vivo. Il disegno è identico: verificato affiancando le due versioni.
- 🎵 **La musica torna quella procedurale** (il brano non convinceva): i file restano in `assets/audio/`
  e l'impianto pure — si riaccende con un `true` in `audio.js`.

## 🆕 Novita v1.89 (i boss)
- **🗿 Boss solo al 10 e al 20.** Erano quattro, uno ogni cinque ondate: al quinto turno avevi visto tre
  nemici su dieci e ti arrivava gia' un boss. Adesso la prima meta' e' una salita vera.
- **Nuovo boss dell'ondata 10: IL COLOSSO DELLA FAGLIA.** Lastre di roccia tenute insieme dalla luce della
  faglia. **Tre fasi**: pugni ad area e onde d'urto concentriche → a 2/3 di vita **perde un braccio** e
  lancia le macerie → a 1/3 **si apre il nucleo**, corre di piu' ma incassa il **50% in piu'**. Non lo
  picchi e basta: aspetti che si apra.
- **☄️ AZ'GAROTH ridipinto**: volume vero al posto delle campiture piatte, ali a ventaglio con le dita e
  il bordo a festoni, coda a sei segmenti che ondeggia, mandibola che si apre e **gola che si accende prima
  del soffio**, e sotto il 40% di vita le crepe del corpo si accendono come magma.
- **Signore della Guerra e Re Lich fuori rotazione**: erano gli ultimi due nemici disegnati **di lato** in
  un gioco visto dall'alto — e' per quello che stonavano. Le definizioni restano nel codice.

## 🆕 Novita v1.88 (l'equipaggiamento si vede addosso)
- **⚔️ Quattro ranghi per ogni slot** invece di due o tre: **comune** (quello di partenza, gratis),
  **raro**, **leggendario**, **divino**. Otto slot fra le tre classi, **32 oggetti** in tutto — 15 nuovi.
- **🎨 Ogni pezzo cambia il personaggio a schermo.** L'armatura ridipinge metallo, veste e mantellina;
  lo **scudo** cresce di arco e spessore rango dopo rango (ed e' l'unico pezzo che cambia la sagoma vista
  dall'alto); l'**arco** del ladro si allunga e cambia legno; l'**orbe** del mago cambia colore e grandezza.
  Il rango **divino** aggiunge un alone che respira, del colore del pezzo.
- **🏹 Fix**: l'Arco Corto aveva ancora i numeri di prima della 1.83 (31 danni, 3,0/s). L'arma vera arriva
  **sempre** dall'oggetto equipaggiato, quindi il ribilanciamento del ladro non era mai entrato in partita.

## 🆕 Novita v1.87 (due rimedi)
- **🔒 I prigionieri si trovano di nuovo.** Con la 1.84.1 avevo tolto il segnalino dalla minimappa (giusto)
  senza accorgermi che era l'unico modo per sapere che il recinto esisteva: stava a **930 px di mediana**,
  con punte a 1700, e non lo vedeva piu' nessuno. Adesso nasce a **420-950 px** e ha **due bracieri accesi**
  che si leggono da mezzo schermo. Sulla minimappa continua a non esserci, e la chiave resta nascosta.
- **🎴 Le quattro passive tornano ai loro livelli** (3, 6, 9, 12) e le **abilita' attive si spostano all'8 e
  al 14**. Nella 1.85 le attive avevano preso il posto delle passive del 6 e del 12: si aggiungono, non
  sostituiscono. Sei scelte in una run invece di quattro.

## 🆕 Novita v1.86 (il menu illustrato)
- **🧹 Niente scheda della classe nel menu** *(v1.86.1)*: restano i tre riquadri degli eroi e il pulsante.
  Il pannello si accorcia di un terzo e l'illustrazione si vede sopra e sotto.
- **🖼️ Artwork a tutto schermo** nel menu iniziale: i tre eroi di fronte, l'orda e la faglia alle spalle.
  Sta in `public/assets/art/menu_key_art.jpg` (il brief e il prompt sono in **ARTWORK.md**).
- **🪟 Il pannello diventa vetro**: sfondo semitrasparente con sfocatura, filo d'oro in cima, entrata in
  dissolvenza. L'illustrazione si vede *attraverso* il menu invece di stare dietro una lastra.
- **🚪 Dalla v1.89.3 lo sfondo c'e' anche nella sala d'attesa** (quella con *AVVIA LA RUN*): stesse regole,
  niente CSS duplicato.
- **La velatura scurisce solo la fascia centrale**, quella dietro al pannello: le due fasce laterali —
  l'unica parte dell'artwork che si vede davvero — restano accese.
- **🌬️ L'immagine respira**: deriva lentissima (48s, avanti e indietro) e la faglia del titolo pulsa.
- Se il file dell'artwork non c'e', resta il vecchio sfondo scuro: il menu non si rompe.

## 🆕 Novita v1.85 (le abilità attive)
Gli slot **Q** ed **E** erano disegnati col lucchetto dal v1.79 e vuoti dal v1.66. Adesso hanno dentro
**dodici abilità**, quattro per classe: se ne sceglie **una al livello 6** e **una al livello 12**, e la
scelta vale per tutta la partita.

| Classe | Slot **Q** — livello 6, ricarica 30s | Slot **E** — livello 12, ricarica 45s |
|---|---|---|
| 🛡️ **Guerriero** | ⚡ **Carica** — scatto corazzato di 300px che sfonda: doppio fendente, spinta e **stordimento**, e sei immune mentre corri<br>📣 **Grido di Guerra** — i nemici intorno puntano **te** per 3s, e tu e i compagni nel raggio subite **−25% danni** per 4s (**i boss non danno retta**) | 🌀 **Turbine** — tre giri a 360° in 1,2s, ognuno al 70% del fendente<br>✨ **Giuramento** — per 5s tu e i compagni entro 220px siete **immuni al primo colpo** |
| 🔮 **Mago** | 🔥 **Muro di Fuoco** — barriera di fiamme lunga 220px per 5s: brucia chi la attraversa<br>🫧 **Scudo di Mana** — assorbe danni per 6s, poi **esplode** respingendo e rallentando | ☄️ **Meteora** — tre impatti telegrafati sul punto mirato<br>⛓️ **Catena Nera** — fulmine che rimbalza fra **otto** nemici, a danno calante |
| 🏹 **Ladro** | 🌫️ **Velo d'Ombra** — nube di 150px per 5s: dentro sei **invisibile**, e il primo colpo dall'ombra e' critico<br>🪤 **Tagliola** — trappola armata 25s: il primo che entra resta **bloccato 2,5s** (fino a tre in campo) | 🎯 **Marchio** — il bersaglio prende **+50% danni da chiunque** per 8s; se muore marchiato, meta' ricarica torna<br>🏹 **Salva** — quindici frecce in due secondi, perforanti |

- **Ricariche lunghe apposta**: 30s per lo slot Q, 45s per lo slot E. *(Dalla v1.87 gli slot si sbloccano
  ai livelli **8** e **14**.)* Non sono una seconda arma, sono il
  momento in cui l'ondata gira. Misurato coi bot: il danno al secondo cambia di poco (+14% il guerriero,
  ±2% mago e ladro) — quello che cambia è *cosa puoi fare*, non quanto picchi.
- ~~Le passive scendono da quattro a due.~~ **Annullato in v1.87**: le passive restano quattro ai livelli
  3, 6, 9 e 12, e le attive si prendono all'8 e al 14.
- **La specializzazione del 15 non regala più un'abilità** (erano promesse dal v1.69 e mai scritte): adesso
  quelle sei *sono* le attive del livello 12, e la specializzazione **le potenzia del 30%**.
- **Il mercenario non ha abilità** e **il Grido di Guerra non attira i boss**.

## 🆕 Novita v1.84.1 (la chiave si cerca, e le casse pagano)
- **🗝️ La chiave non si vede da lontano**: compare solo quando ci sei quasi sopra (~118 px, sfumando). La
  si trova **esplorando**, non seguendo un segnale.
- **🗺️ Sulla minimappa niente prigione**: resta solo la **faglia** d'uscita. Un segnalino sulla mappa
  trasformava la deviazione in una commissione da sbrigare.
- **📦 Le casse possono contenere monete**: una su due lascia un mucchietto (**22 + 3/ondata**, ±25%)
  invece del potenziamento a tempo.
- **🧪 Suite di test dimezzata**: 6,5 s invece di 10 — stesse garanzie, meta' dei campioni dove erano
  statistici (mappe generate, tempo simulato, ripetizioni).

## 🆕 Novita v1.84 (prigionieri, e la faglia al posto del pulsante)
- **🔒 Prigionieri da liberare**: una mappa su tre ha un recinto con dentro **1-5 persone**. La chiave e'
  nascosta — addosso a un elite, o a terra vicino alle casse — e **si vede solo da vicino** *(v1.84.1)*.
  Liberarli paga **100 monete a testa**. Non e' obbligatorio: e' una deviazione, e il prezzo e' il tempo.
- **🌀 La faglia**: il pulsante EXIT verde in mezzo allo schermo non c'e' piu'. A mappa ripulita si apre uno
  squarcio a un passo da te, e ci si passa dentro per proseguire. *(Dalla v1.87.1 e' un **portale tondo
  frontale**: anello con rune, vortice a quattro braccia, bocca scura al centro.)*

## 🆕 Novita v1.83 (ribilanciamento delle classi)
- **🛡️ Lo scudo del guerriero para davvero, e solo davanti**: −45% dai colpi che arrivano nel cono
  frontale (−60% con lo Scudo a Torre), 70° per lato. Alle spalle non c'e' niente. Misurato: incassa un
  terzo in meno e vive la meta' in piu', ma solo se ti giri verso chi colpisce.
- **🏹 L'arco rallenta**: da 3,0 a 2,3 frecce al secondo, con la freccia che passa da 31 a 38 danni. Il
  danno al secondo cala del 6%, il ritmo cambia del tutto — cinque frecce al secondo col massimo di
  Destrezza non erano un arco, erano un rubinetto.
- **🔮 Il mago non e' stato toccato**: era gia' quello in equilibrio, e le misure lo confermano.

## 🆕 Novita v1.82 (i mercenari)
- **🗡️ Assoldi un compagno al Banditore**, fra un'ondata e l'altra: classe a caso, **il tuo stesso
  livello**, **50 monete a livello 1** e +40 per livello. Uno per volta, solo in **partita singola**.
- **Combatte da solo**: ti segue, ingaggia chi ti sta vicino, tiene la distanza della sua arma e si
  sgancia quando e' ridotto male. Non ha abilita', ne' passive ne' attive.
- **Non conta come giocatore**: l'ondata resta identica, l'**XP resta tutto tuo**, non raccoglie niente da
  terra e la sua morte non chiude la partita. Serve ad aiutare, non ad alzare l'asticella.
- **Fra un'ondata e l'altra sparisce** (non ti segue al villaggio) e lo ritrovi dopo **curato del tutto**.
  Se cade, al banco se ne assolda un altro.
- **🪧 Il Banditore non ricompra piu' le armi**: quel posto al banco adesso e' il reclutamento. Cio' che
  possiedi resta tuo e lo rimetti addosso gratis dal Fabbro, come prima.

## 🆕 Novita v1.81 (quattro nemici nuovi, e la rampa non si ferma piu' alla settima)
- **🪜 Alla dodicesima ondata il bestiario e' tutto in campo** (prima ci arrivava alla quindicesima, e da
  li' in poi non succedeva piu' niente). Ogni ondata dalla 1 alla 12 aggiunge qualcosa che prima non c'era.
  Il bestiario passa da **10 archetipi a 14**.
- **🕷️ I tre Ragni delle Volte** *(ondate 8, 10, 11)*: non ti inseguono, **tessono**. La ragnatela non fa
  danno: ti **rallenta del 42%** finche' ci stai sopra. Sono l'unico nemico che ti toglie la mobilita'
  invece di aggiungere danno — lo scatto pero' strappa la tela. Un disegno solo, tre palette.
- **🐛 Larva Fetida** *(ondata 9)*: corre addosso e **scoppia quando la uccidi**, con tre secondi di
  preavviso e il cerchio a terra. Insegna a non stare incollato al nemico che stai finendo.
- **👁 I Beholder si fanno avanti**: Viola alla **8** (era 9), di Carne alla **10** (era 12), Spettrale alla
  **12** (era 15) — il piu' lavorato dei tre non compare piu' a cinque ondate dalla fine.

## 🆕 Novita v1.80 (i nemici ti cercano) — *superata dalla v1.92: adesso vagano*
- **🐾 Chi non ti vede ti CERCA.** Prima sceglieva un punto a caso entro 350 px: su una mappa grande meta'
  dell'ondata girava dove non saresti mai passato. Adesso segue il campo di flusso verso di te, ma **piu'
  piano di chi ti vede** (0,68-0,90 contro 1,00): vederti conta ancora.
- **⚫ La Sfera d'Ossa non aspetta piu'**: rotola piano finche' non ti trova, poi si carica e parte. Il
  Fungo Sporifero resta l'unico immobile, perche' e' il suo mestiere.
- **👥 Ma non si accalcano**: solo i **6 piu' vicini** si fanno sotto (`FOLLA_MAX`), gli altri aspettano il
  turno a 900 px, fuori dallo sguardo. Ne uccidi uno e ne parte un altro: l'ondata arriva **a scaglioni**.
  Chi ti vede viene addosso comunque — quello resta.
- **🐌 Spento il recupero di distanza** (chi era lontano correva fino a 2,1x): adesso i lontani camminano.
- **🚫 Nessuno compare addosso**: la regola della v1.76.1 vale ancora, i nemici li vedi **arrivare**.

## 🆕 Novita v1.79.2 (i nemici si vedono tutti, passive ritarate, tre Beholder)
- **👁 Tutti i nemici in campo**: il tetto dei vivi e uno solo e alto (40) — *dalla v1.96 vale fino all ottava ondata: dalla nona scende a 22*. Prima una curva ne teneva 8
  alla prima ondata e gli altri in coda: si aggiungevano nemici e a schermo non cambiava niente.
- **🎴 Passive ritarate**: quasi ognuna faceva due cose, adesso ne fa una. Via la rigenerazione di Scudo
  Vitale (era una cura gratis e continua), il veleno diventa una quota del colpo.
- **🆕 Cinque abilita nuove** al posto di altrettante sbagliate: Colpo Ampio (guerriero), Concentrazione,
  Frattura Arcana e Campo di Lentezza (mago), e il **ladro rifatto come classe** — Colpo alle Spalle,
  Lama Sporca, Passo d'Ombra, Punto Vitale, Uscita di Scena.
- **👁 Tre Beholder dipinti**: Occhio Viola (ondata 9), di Carne (12), Spettrale (15). Dipinti a codice,
  non piu marionette raster, e adesso **attaccano davvero**: raggio che consuma vita da lontano, morso da
  vicino.
- **🗡 Via il Troll delle Caverne** e via l'**Offerta di Sangue** del Mercante Errante (+2 vite a meta
  monete: chi ne aveva poche le prendeva quasi gratis).

## 🆕 Novita v1.79 (quindici livelli, quattro scelte)
- **🎚️ Tetto ai livelli: 15.** Oltre non si sale, e l'esperienza raccolta dopo non serve piu' a niente.
  Al 15 si sceglie la **specializzazione** fra due, ed e' passiva.
- **🎴 Le carte diventano abilita' passive a scaglioni**: **quattro in tutta la partita**, ai livelli
  **3, 5, 9 e 11** (dalla v2.16; prima 3-6-9-12). Ogni scaglione mostra 4 abilita' — 2 della tua classe e 2 neutre — e se ne sceglie 1.
  Le abilita' di classe le vede solo quella classe. Niente impilamento: i valori sono circa il doppio.
- **📈 Curva XP** tarata sull'esperienza che le ondate mettono davvero a terra *(ritarata in v1.79.1)*:
  il livello 2 arriva entro la seconda ondata e il primo scaglione entro la quarta, coi soli nemici uccisi.
- **👾 Prime ondate piu' piene** *(v1.79.1)*: da 7 a 12 nemici alla prima, da 12 a 16 alla quarta; le
  ultime restano dov'erano.
- **👥 Esperienza condivisa** fra i giocatori vivi, con un fattore di gruppo misurato: la stessa curva
  vale da 1 a 6 giocatori. Le monete restano di chi le raccoglie.
- **◆ 14 punti statistica** (erano 18 finche' i ranghi ne davano uno; dalla v2.16 i ranghi sono scenici), costo fisso di 1 per livello.
- **🧭 Menu di fine ondata a quattro sezioni** — Riepilogo · Personaggio (con l'inventario) · Abilita' ·
  Vai al villaggio — e sotto, da solo, il pulsante della mappa successiva. Dal villaggio si torna al menu.
- **🔮 La Cartomante e' chiusa**: la struttura resta nel villaggio, la funzione verra' ridisegnata.
- **🔒 Slot delle abilita' attive** ai livelli 6 e 12: si vedono, spenti col lucchetto. *(Accesi in v1.85.)*

## 🆕 Novita v1.78 (l'ondata finisce quando lo decidi tu)
- **✔ Pulsante EXIT sulla mappa ripulita**: ucciso l'ultimo nemico non si esce di scatto. Compare la
  scritta **ONDATA COMPLETATA** in alto e il pulsante **EXIT** al centro. Il cronometro si ferma li' (il
  premio di velocita' non si perde aspettando) e **quello che e' a terra non scade** finche' sei li'.
  In cooperativa si aspettano tutti i vivi; dopo 120 s si esce comunque.
- **🎴 Le carte arrivano dai livelli**: una per livello guadagnato, non piu' una per ondata. Se non sei
  salito, il pannello dice quanta XP manca invece di aprire un mazzo che non ti sei guadagnato.
- **📊 Riepilogo di fine livello**: nemici uccisi, XP e monete dell'ondata, durata contro il tempo
  obiettivo, livelli presi e il premio del cronometro.
- **🗑 Una sola modalita'**: Orda, Caccia, Sopravvivenza e Tesoro sono state tolte, e con loro
  l'indicazione della modalita' sulla mappa.
- **🔤 +1px a tutti i font del testo**, titoli e icone invariati.

## 🆕 Novita v1.77 (niente cade dal cielo, e le ondate hanno un cronometro)
- **🚫 I nemici non lasciano piu' oggetti**: nessuno, boss e cassa-mima compresi. Una cura gratis dal
  nulla toglieva il mestiere all'Ostessa e all'Erborista. Restano esperienza, monete e le casse.
- **🧪 Le tre pozioni forti si comprano dall'Erborista**: Nucleo Instabile (110), Ira Berserk (185),
  Egida Divina (270). Care apposta.
- **💗 Le vite extra no**: il Cuore di Fenice resta solo dal **Mercante Errante**, che compare a caso.
  L'Erborista e' sempre li', e una vita comprabile a ogni passaggio si accumulerebbe senza attrito.
- **⏱ Cronometro dell'ondata** sotto il nome della mappa, col tempo obiettivo. Verde sei dentro, ambra
  ultimi dieci secondi, spento obiettivo perso.
- **🏆 Chi chiude dentro il tempo** prende XP e monete in piu'. Il limite si calcola dal numero di
  mostri diviso i giocatori: 47 s l'ondata 1 da solo, 156 s l'ondata 20. Le ondate a sopravvivenza
  sono escluse: durano un tempo fisso.

## 🆕 Novita v1.76.1 (i nemici non si teletrasportano)
- **👹 Scappando non ti compaiono piu' addosso.** Il recupero anti-stallo teletrasportava tutti i
  mostri a 240 px da te se per 6 secondi non ne moriva nessuno — cioe' proprio mentre scappavi.
- Adesso si sposta **solo chi e' davvero bloccato** (nessun progresso da 5 s e oltre 640 px), e va
  **oltre i 950 px, fuori dalla tua vista**. Se un posto cosi' non c'e', non si sposta niente.
- **🥚 Anche le caselle di generazione** tengono conto di dove sei adesso, non solo di dov'eri
  atterrato: almeno 520 px e possibilmente fuori vista.

## 🆕 Novita v1.76 (la caverna dipinta)
- **🗺️ Mappe di combattimento rifatte da capo.** Da 46x34 a **64x46 tessere**: area calpestabile
  +28%, spazio libero attorno +49%.
- **🔓 Zero strozzature, garantite e misurate.** Nessuna tessera, tolta, spezza la mappa in due: da
  ogni camera si esce sempre da due parti. Tre archetipi di pianta piu' le dorsali di roccia.
- **🎨 Pavimento QUIETO, muri RUMOROSI.** Niente piu' rettangoli neri: massi con volume, contorno a
  inchiostro e ombra proiettata. Piu' il pietrisco — massi, macerie, ossa.
- **💡 E si vede.** Luminanza mediana da 18 a 48: prima era cosi' buio che non si vedeva niente di
  quello che c'era.
- Il **villaggio non e' toccato**: ha il suo aspetto e se lo tiene.

## 🆕 Novita v1.75.3 (soglie sgombre)
- **📦 Via le casse davanti all'osteria e alle taglie** e **la rastrelliera davanti alla fucina**: da quando
  i mobili hanno un corpo erano uno spigolo da prendere a ogni ingresso.
- **🚪 Tutte e cinque le porte hanno lo stesso passaggio libero**: 98 px, tre volte e mezzo il personaggio.

## 🆕 Novita v1.75.2 (i mobili hanno un corpo)
- **🪑 Nel villaggio non si attraversa piu' niente**: tavoli, banconi, scaffali, incudine, aiuole, casse,
  botti — e **le persone**, mercanti e avventori. Ci sbatti contro e ci giri attorno.
- **🤸 Se ti ritrovi incastrato ti spinge fuori** (un teletrasporto, uno scatto): esci dal lato piu' vicino,
  mai dentro la roccia.
- **🚶 Si attraversa cio' che e' basso o appeso**: tappeti, pozze, ragnatele, stendardi, lanterne e gli
  sgabelli. Vale **solo nel villaggio**: nelle ondate niente cambia.

## 🆕 Novita v1.75.1 (porte piu' larghe)
- **🚪 Le porte erano larghe una tile sola** (48 px contro un personaggio largo 35): ci si passava a pelo.
  Adesso ogni porta e' larga **due tile**, e il **varco verso il portale tre** — e' la strada principale.

## 🆕 Novita v1.75 (il villaggio a micro-stanze)
- **🏘️ Ogni mestiere ha la sua stanza.** Una piazza centrale col falo' — dove si atterra e dove sta il
  portale — e attorno cinque stanze attaccate da corridoi corti: **taverna**, **antro** della Cartomante,
  **erboristeria**, **fucina** e **Gilda dei Contratti**. Nessuna e' a piu' di due passi dalla piazza.
- **🪑 Ogni stanza ha il suo pavimento e i suoi mobili**: assi di legno e tavoli in taverna, aiuole di terra
  dall'Erborista, incudine, rastrelliere e colata di lava in fucina, bacheca delle taglie alla Gilda.
- **🧍 I mercanti si vedono dall'alto** come il tuo eroe: stessa silhouette, ricolorata mestiere per
  mestiere e **disarmata**, con in mano solo l'attrezzo del suo lavoro. Ognuno ha il **suo alone di luce**.
- **🎖️ Il Banditore e' ora il Capitano** della Gilda dei Contratti: appende le taglie e ricompra
  l'attrezzatura dei caduti.
- **👥 Otto comparse** in piedi attorno ai tavoli: il villaggio e' abitato, non abbandonato.

## 🆕 Novita v1.74.1 (nessuna cura automatica)
- **A fine ondata non si guarisce piu'.** Il gioco regalava il 25% dei PV massimi a ogni ondata chiusa, in
  silenzio: i danni adesso si portano dietro finche' non si paga l'Ostessa, si beve o si raccoglie.
- Chi e' **a terra** viene comunque rialzato: quella non e' cura, e' rimettere in gioco.

## 🆕 Novita v1.74 (l'Ostessa, e i PV massimi non curano piu')
- **🍺 L'Ostessa**: il riposo si paga **a punto vita** (0,4 monete a PV mancante). Se le monete non bastano
  compri quello che puoi. Piu' conveniente della pozione di Cura, che pero' si beve in combattimento.
- **❤️ Alzare i PV massimi non cura**: ne' la Costituzione, ne' le carte Colosso e Scudo Vitale. Rimettersi
  in piedi e' mestiere dell'Ostessa (o della pozione, o dei potenziamenti a terra).
- **🏘️ Villaggio completo**: nessuna bottega chiusa.

## 🆕 Novita v1.73 (cinque carte, e un posto dove guardarle)
- **🔮 La Cartomante**: decidi quali carte tenere **accese**, al massimo **cinque**. Il limite conta carte
  diverse (Rimbalzo x3 occupa un posto solo).
- **🃏 La sesta arriva spenta**: la prendi comunque, resta tua, la accendi quando fai spazio.
- **⚙️ I bonus si ricostruiscono da zero** a ogni cambio: spegnere una carta ne toglie l'effetto davvero.
- **🧑 Box del personaggio** fra la barra e la boccetta: nome, livello, rango, esperienza e le cinque
  caselle delle carte. Sopra la tua testa non c'e' piu' nulla; sopra i compagni si', per riconoscerli.

## 🆕 Novita v1.72 (il Banditore: niente si butta)
- **📦 Magazzino**: l'equipaggiamento sostituito non sparisce piu'. Cio' che hai comprato resta tuo e dal
  **Fabbro** lo rimetti addosso **gratis**.
- **💰 Il Banditore ricompra** cio' che non usi a **meta' prezzo** (non cio' che hai addosso, ne' quello di
  partenza).
- **🪧 Taglie**: tre al banco, tutte di tipo diverso, ne accetti **una**. Nessuna scadenza — il conto
  prosegue ondata dopo ondata, e la taglia resta visibile in partita in alto a sinistra.
- **🎯 Sei tipi**: N nemici, N di una specie, N elite, N casse, una combo di N, un'ondata senza cadute.
  Paga dai 91 ai 172 all'ondata 6, e cresce con le ondate.

## 🆕 Novita v1.71 (l'Erborista apre bottega)
- **🧪 La cintura**: tre slot, tasti **1 2 3**, massimo **3 cariche** per slot. Si beve all'istante mentre
  corri e spari — nessun menu' da aprire.
- **🌿 Il tipo di ogni slot lo scegli tu** all'Erborista, e li' sta la strategia: 3 slot su 6 pozioni, e
  **un tipo per slot** (niente cintura di sole cure).
- **📊 Le statistiche cambiano le pozioni**: Costituzione quanto curano, Intelligenza quanto durano, Forza
  quanto picchiano le offensive, Destrezza quanto in fretta ribevi.
- **🚦 Cooldown di 6s condiviso** dai tre slot e **nessun cumulo** dello stesso effetto.
- **💰 Le cariche si comprano, non si ricaricano.** Cambiare tipo rimborsa meta'; le cariche restano anche
  se muori.

## 🆕 Novita v1.70 (piu' morbido all'inizio, senza tetto alla fine)
- **🔢 Il numero dei nemici e' progressivo**: il tetto dei vivi non e' piu' fisso a 30 ma una curva —
  8 alla prima ondata, 12 alla terza, 18 alla sesta, 30 solo dalla decima. Prima si arrivava a 30 vivi
  gia' alla terza ondata.
- **🎚️ Niente piu' tetto ai livelli**: si sale finche' si accumula esperienza. Un cap che coincideva con
  la fine della partita non aveva senso. Una run completa porta ora al **livello 30**.
- **✦ L'esperienza arriva da piu' fonti**: non solo dai nemici uccisi, ma anche dalle **casse aperte**
  (45 XP + 9 per ondata) e dai **potenziamenti raccolti** sulla mappa (30 + 6). Aggiungerne altre e' una
  riga in `shared/constants.js`.
- **🔔 LEVEL UP sopra la testa, con jingle**: salire di livello si vede e si sente subito, in mezzo
  all'ondata, senza aspettare il pannello di fine round.
- **🃏 Via le carte di rango**: al loro posto arriveranno le abilita' di classe sbloccate a livelli
  specifici. Il rango resta (titolo e punto in piu') e il bivio finale pure.

## 🆕 Novita v1.69 (il personaggio cresce: livelli, ranghi e punti)
- **🎚️ Venti livelli, uno per ondata**: la XP non si spende piu', sale. Il cap chiede 10.670 XP contro gli
  ~11.000 che rende una run intera — chi arriva in fondo arriva al cap, chi gioca bene ci arriva prima.
- **★ Cinque ranghi, uno ogni cinque livelli (cioe' su ogni boss)**: Guerriero → Esperto → Veterano →
  Campione → **Paladino o Maestro d'Armi**. Apprendista → Mago Giovane → Mago → Mago Anziano → **Arcimago o
  Stregone**. Ladro → Furfante → Predone → Ombra → **Assassino o Cacciatore di Teste**.
- **🃏 27 carte di rango**: a ogni rango scegli 1 carta su 3, e sono potenziamenti *di classe*. 54
  combinazioni per classe: due run non si somigliano.
- **⚔️ Il bivio del rango V si vede addosso**: aura del Paladino, cresta del Maestro d'Armi, rune
  dell'Arcimago, nucleo rosso dello Stregone, pugnale dell'Assassino, seconda faretra del Cacciatore.
- **💠 23 punti in una run**, e portare una statistica al tetto ne costa 22: o ti specializzi, o ti
  distribuisci. Il pannello dice "Livello 7 · Veterano — hai 3 punti", non piu' "hai 4.435 XP".
- **🐛 Il tetto dei 30 nemici era ancora aggirabile** dalla scissione della Melma (con 29 in campo si finiva
  a 31): ora tutte le porte contano i vivi.

## 🆕 Novita v1.68 (trenta in campo, il resto in coda)
- **🔢 Tetto di 30 nemici vivi** (era 50). L'ondata **non perde nessuno**: gli altri restano in coda ed
  entrano man mano che si fa posto — alla 20ª in sei ne arrivano tutti e 86.
- **⚡ Rimpiazzo immediato**: mentre l'arena si riempie la prima volta il ritmo e' quello di sempre, ma
  quando e' gia' stata piena e si apre un buco il nemico successivo entra quasi subito (0,10-0,22s).
- **📉 −52% di traffico** a parita' di nemici: la parte immutabile di ogni mostro (tipo, PV massimi, flag
  elite/boss/tesoro) viaggia **una volta sola** invece di 20 volte al secondo, e i flag a zero non si
  mandano affatto. Un record di mostro passa da 120 a **46 byte**. Con il tetto a 30, una partita in sei
  passa da 834 a **295 KB/s** in uscita.
- **📊 Misurato prima di toccare**: la CPU del server usa l'**1%** del tempo disponibile anche con 80 mostri
  — non era li' il problema, e infatti non e' stata toccata.

## 🆕 Novita v1.67 (il fabbro vende oggetti, non livelli)
- **🔨 Catalogo per classe**: l'Emporio a tre barre e' sostituito da **oggetti con un nome**, e ogni classe
  vede solo la propria roba, con i propri slot — il guerriero ha lo scudo, il ladro le calzature, il mago no.
- **⚔️ Guerriero**: Spada · **Spadone** 🪙230 · **Alabarda** 🪙470 — piu' e' lunga, piu' l'arco e' **stretto**
  (152px/71° contro 100px/109°). Armatura a Piastre 🪙250, Scudo a Torre 🪙290.
- **🔮 Mago**: Bacchetta di Frassino · **Scettro Runico** 🪙240 · **Bastone del Vuoto** 🪙500 — stessa cadenza
  per tutte (quella la alza l'Intelligenza), cambiano danno, velocita' e **grandezza della bolla**. Manto
  dell'Arcanista 🪙270.
- **🏹 Ladro**: Arco Corto · **Arco Lungo** 🪙300, Corazza di Cuoio 🪙240, Stivali del Passo Lieve 🪙260.
- **🔁 Cambio libero**: si compra qualunque oggetto dello slot, anche tornando indietro; il vecchio viene
  rimpiazzato e i bonus vengono **ricalcolati da zero** (niente bonus fantasma).
- **👁️ Cio' che compri si vede**: scudo a torre piu' grande, arco lungo che sporge, orbe della bacchetta,
  e l'arco del fendente che cambia con l'arma.

## 🆕 Novita v1.66 (Guerriero, Mago, Ladro)
- **🦸 Tre classi nuove al posto dei tre eroi cyberpunk**: il **Guerriero** colpisce con un **semicerchio**
  davanti a se (raggio e apertura vengono dall'arma), il **Mago** lancia **bolle di energia** lente e pesanti,
  il **Ladro** tira **frecce** veloci che perforano un nemico.
- **📊 Quattro statistiche da gioco di ruolo** — **Forza, Costituzione, Intelligenza, Destrezza**, da 1 a 12 —
  al posto delle sei da sparatutto. Ognuna alza danno e cadenza della **sua scuola** (mischia / magia /
  distanza): chiunque puo' comprarle tutte, e cio' che compri fuori scuola servira' alle **classi miste**.
- **💰 Curva XP rifatta**: con l'XP di **una run intera** si cappa **esattamente una** statistica (17.980 XP).
- **➖ Abilita' Q/E sospese** (erano cucite sui vecchi eroi: torneranno con l'evoluzione dopo il boss),
  **niente piu' armi a terra** e **acquisto armi sospeso** — l'arsenale va ripensato sulle tre scuole.

## 🟣 Stato della Faglia: **spenta**

La faglia dei margini oggi non e' attiva: `EDGE_MARGIN` vale **0** in `shared/constants.js`, quindi il
bordo della mappa non drena vita e non c'e' nessuna fascia. Il codice non e' stato tolto — si riaccende
rimettendo `EDGE_MARGIN` maggiore di zero. Le due sezioni qui sotto la descrivono **da accesa**, e i test
seguono la manopola: a 0 verificano che sia spenta davvero.

## 🆕 Novita v1.65 (il fascio della Faglia) — *da accesa*
- **🔮 L'effetto del bordo ora si vede davvero**: un **ventaglio** che si apre dalla roccia piu' vicina, con
  filamenti che ti **arrivano addosso** e un nucleo pulsante — lo stesso linguaggio del fascio dello sguardo
  del Beholder. Prima erano tentacoli sottili e passavano inosservati.
- In un **angolo** partono **due fasci**, uno per lato.
- Il buio si apre alla radice del fascio, altrimenti l'effetto restava nascosto proprio dove serve vederlo.
- Nessun costo in piu': i gradienti sono in cache come tutto il resto dalla v1.64.

## 🆕 Novita v1.64 (prestazioni)
- **⚡ Via il singhiozzo**: il frame peggiore con 80 nemici passa da **39,7 ms a 18,5 ms**. La causa erano
  **33.494 gradienti creati al secondo** e buttati via subito — ora sono in cache.
- **🦇 Il Nugolo di Pipistrelli** era il nemico piu' caro del gioco (116 µs l'uno): le pose delle ali sono
  ora **precotte**, e costa **31 µs**.
- **✂️ Non si disegna piu' cio' che sta fuori schermo** (11-15% del frame).
- **🔢 Tetto di 50 nemici vivi**: l'ondata non si accorcia, si **ritma** — i nemici in eccesso entrano man
  mano che gli altri muoiono.
- **🟣 La Faglia si vede nel mondo**: la fascia e' dipinta sulla roccia (piu' carica negli angoli) e i
  **tentacoli** escono dal bordo piu' vicino a te.
- Test: **475 passati, 0 falliti**, piu' una nuova guardia di prestazione che conta le allocazioni del renderer.

## 🆕 Novita v1.63 (la Faglia ai margini) — *da accesa*
- **🟣 Il bordo della mappa ti consuma** se ci resti: 2,5s di grazia, poi un drenaggio crescente (3 → 20 PV/s).
  Negli **angoli** la grazia dura la meta'. Uscire ferma il danno all'istante — passare non costa niente,
  accamparsi si'.
- **⚠️ Avvisa prima di punire**: alone viola che si chiude, filamenti quando morde, e la fascia segnata
  sulla **minimappa**.
- **📦 Casse e armi solo al centro**: ogni ondata ti obbliga ad attraversare lo spazio aperto per prenderle.
- Misurato: nell'angolo si subiva **4,8 volte meno danno** (arco da difendere 79° contro 243°). Ora chi si
  accampa sul bordo sopravvive **26s invece di 81**, mentre il gioco normale e' invariato.
- Test: **468 passati, 0 falliti**.

## 🆕 Novita v1.62 (il terreno conta)
- **🔥 Pozze di pericolo** in ogni mappa (lava, ghiaccio sottile, melma): fanno danno a te **e ai mostri**.
  Non possono mai tappare un passaggio — si puo' sempre girarci intorno.
- **🪨 Piu' oggetti di scena**: da ~30 a ~46 per mappa, uno strato di pulviscolo oltre alle zone tematiche.
- **🧭 Partenza e uscita non sono piu' fisse**: prima si partiva sempre dal centro esatto e si usciva sempre
  dal punto piu' lontano. Ora variano, e tutte le distanze si misurano dalla partenza.
- **🗺️ Il nome della zona** ("Cripta Dimenticata", "Caverne di Lava"...) compare sotto la barra in alto:
  c'era gia' scritto nel codice e non lo vedeva nessuno.
- Test: **448 passati, 0 falliti**.

## 🆕 Novita v1.61.1 (i due nuovi prendono posto)
- **🦇 Nugolo dall'ondata 6**, **🔵 Fuoco Fatuo dall'ondata 8**. Il Nugolo prima perche' insegna a guidare
  il tiro; il Fatuo dopo perche' toglie il riparo, e una risposta si toglie solo dopo averla insegnata.
- **📈 Rampa senza buchi**: un archetipo nuovo per ogni ondata dalla 1 alla 8 (prima la 6 e la 8 erano vuote).
- Test: **421 passati, 0 falliti**.

## 🆕 Novita v1.61 (lo sciame e il fuoco fatuo)
- **🦇 Nugolo di Pipistrelli**: una sola entita' disegnata come **9 sagome in orbita**, ali = una sinusoide di
  battito. Fragile ma velocissimo, e **ondeggia** mentre insegue: non lo colpisci sparando dritto.
- **🔵 Fuoco Fatuo**: **attraversa i muri**. Non lo semini rompendo la linea di vista — e' lento, quindi la
  risposta e' muoversi. Quando ti raggiunge **drena vita** e si cura.
- Nessuno dei due ha asset o cicli di camminata: tutto vettoriale, come Fungo e Sfera d'Ossa.
- **🍄 Il Fungo ora e' davvero piantato**: non lo spingono piu' ne i giocatori ne gli altri mostri.
- Test: **408 passati, 0 falliti**.

## 🆕 Novita v1.60 (il Troll smette di essere legnoso)
- **📏 Ancora dell'attacco corretta**: era sbagliata di 11px e il troll *saltava* ogni volta che colpiva.
  Misurata sui PNG nuovi frame per frame.
- **🔨 Impatto allineato al danno**: la martellata si vedeva 3 fotogrammi prima di quando il server fa danno.
  Nuova mappatura a due tratti ancorata al fotogramma d'impatto.
- **👣 Passo agganciato al terreno**: la camminata va a distanza percorsa, non a fps fisso. Niente slittamento,
  e la cadenza si adegua se la velocita' cambia.
- **🎞️ Dissolvenza di 0.14s** fra le animazioni (prima tagli netti) e giro del verso smorzato.
- **👁️ Beholder dall'ondata 10** invece che dalla 15.
- Test: **384 passati, 0 falliti**.

## 🆕 Novita v1.59 (il Beholder smette di essere una boa)
- **🦑 Eyestalks come appendici**: steli curvi con frequenza e fase proprie, non piu' 7 aloni fissi. Spuntano
  da dietro il bulbo e hanno un occhietto con pupilla in punta.
- **👁️ Ammicca** con periodo irregolare, e l'iride **scatta** verso il bersaglio invece di inseguirlo fluida.
- **🪁 Si inclina** nella direzione in cui si sposta.
- **⏳ Il cambio di sguardo si telegrafa sul corpo**: si contrae e drizza gli steli poco prima di cambiare.
  Il server manda `gt` (quanto manca) cosi' il client anticipa invece di reagire.
- Nessuno sprite nuovo: tutta matematica sullo stesso PNG. Test: **367 passati, 0 falliti**.

## 🆕 Novita v1.58 (due nemici senza gambe, Melma che si divide, Beholder col tetto)
- **🍄 Fungo Sporifero** (ondata 5+): **immobile**, semina zone di spore dove sei. Il primo nemico che
  punisce chi resta fermo. Vettoriale, zero asset.
- **💀 Sfera d'Ossa** (ondata 7+): si carica e **rotola in linea retta** rimbalzando sui muri. Ti obbliga a
  schivare di lato. L'animazione e' una rotazione ricavata dallo spostamento: niente frame da disegnare.
- **🟢 La Melma si divide**: alla morte lascia 2 Melme Minori (stesso sprite a raggio ridotto). Le minori
  non si dividono.
- **👁️ Beholder**: entra solo dall'**ondata 15** e ha un **tetto di 8 presenze**; oltre il tetto lo spawn
  ripiega sullo sciame base.
- Test: **361 passati, 0 falliti**.

## 🆕 Novita v1.57 (il mercato e' una SALA SCAVATA)
- **⛏️ Siamo sottoterra**: via case, alberi e staccionate della v1.56. Il generatore parte da **roccia piena**
  e scava la sala; fuori non c'e' mappa, c'e' pietra. Pareti quasi nere.
- **🚪 Un solo varco**, a sud, con il corridoio e il **portale EXIT** in fondo. Gli altri lati sono chiusi.
- **🔥 Buio con la luce dal falo'**: un unico grande alone circolare centrato sul fuoco scopre i banchetti e
  si spegne contro le pareti; le lanterne dei banchi fanno da luci di appoggio.
- **🛖 Cinque banchetti** attorno al fuoco, **piu' grandi dei mercanti**; i mercanti sono al doppio della
  taglia e piu' dettagliati, e stanno dietro al proprio banco.
- **🎛️ Menu di pausa**: il pulsante e' "VAI AL VILLAGGIO" e i due pulsanti stanno affiancati.
- Test: **333 passati, 0 falliti**.

## 🆕 Novita v1.56 (il mercato e' un VILLAGGIO)
- **🏘️ Mappa dedicata**: 32x24 tile invece di 46x34 (**meta' area**), **senza muri interni** — gli unici blocchi
  solidi sono i 5 edifici. Generatore separato da quello delle ondate.
- **🏠 Cinque costruzioni**: Fucina, Locanda, Magazzino, Cappella e Torre della Gilda attorno a una piazza col
  pozzo, con insegne, finestre illuminate e targhe.
- **🧑‍🌾 Cinque abitanti**: il **Fabbro** vende l'equipaggiamento, gli altri quattro sono botteghe **chiuse** —
  i posti gia' pronti per le prossime destinazioni.
- **💡 Villaggio illuminato**: niente maschera della torcia, e la piazza e' ripulita da massi, buche e crepe del
  generatore da caverna.
- Test: **334 passati, 0 falliti**.

## 🆕 Novita v1.55 (costi XP a tabella: primi sei x3, ultimi due x2)
- **✦ Nuova scaletta** (base 10): **90 · 144 · 198 · 555 · 1551 · 4347 · 4926 · 8374**. Massimizzare UNA
  statistica costa **20.185 XP**, piu' di una run intera; l'albero completo 121.110, fuori portata per progetto.
- **📏 Modello di reddito corretto**: le tarature precedenti stimavano l'ondata 2 a ~99 XP, in partita vera ne
  frutta **240**. Una run vale ~18.000 XP, non ~7.500 — ecco perche' il negozio sembrava ancora facile.
- **🧰 I costi sono una tabella** (`STAT_COST_STEPS`), non una formula: si tocca il singolo livello senza
  distorcere il resto della curva.
- Test: **309 passati, 0 falliti**.

## 🆕 Novita v1.54 (esperienza: tronco triplicato, coda smorzata)
- **✦ I primi 6 livelli di ogni statistica costano il TRIPLO**: con base 10 la scaletta passa da
  10/16/22/62/172/483 a **30/48/66/185/517/1449**. La prima ondata frutta ~56 XP e il primo livello ne costa 30:
  si sceglie dove spendere dalla partita numero uno.
- **Il 7° livello e' adeguato** al nuovo tronco (1.352 → 2.463) e l'**8° solo ritoccato** (3.786 → 4.187): la coda
  e' smorzata apposta, altrimenti gli ultimi due livelli sarebbero fuori portata in qualunque run.
- Massimizzare UNA statistica costa ora **8.945 XP**, piu' dell'intera raccolta di una run: il tetto si tocca
  solo giocando la **combo**, che diventa la seconda economia del gioco.
- Test: **312 passati, 0 falliti**.

## 🆕 Novita v1.53 (il mercato si sceglie, il portale si vede, l'esperienza costa)
- **🎯 Il MERCATO e' una destinazione, non una cadenza**: nel menu di pausa fra un'ondata e l'altra ci sono due
  pulsanti — **PROSSIMA ONDATA** e **VAI DAL FABBRO**. Ci vai quando ti serve. In co-op decide chi sceglie per primo.
- **🚪 Il portale EXIT ora si vede**: nel mercato fabbro e portale sono disposti vicino al punto in cui atterri
  (~4 e ~9 tile) invece che nella cella piu' lontana dal centro, che era fuori schermo.
- **✦ Esperienza molto piu' cara**: curva spezzata — i primi 3 livelli costano MENO di prima (10/16/22), poi si
  sale di 2.8x. Massimizzare UNA statistica costa ~5.900 XP, quanto l'intera raccolta di una run; l'albero
  completo ~35.400. Ci si specializza per forza, e la combo diventa la leva vera.
- Test: **309 passati, 0 falliti**.

## 🆕 Novita v1.52 (MERCATO: l'Emporio diventa un luogo, non un pannello)
- **🏪 Mappa MERCATO ogni 3 ondate**: nessun nemico, il **fabbro dell'equipaggiamento** al centro, si prosegue
  entrando nel **portale EXIT**. E' **interstiziale** (non consuma un'ondata), quindi la cadenza dei boss resta
  intatta e la sosta cade dopo il boss — cioe' quando hai appena incassato.
- **🔨 I 3 slot si comprano solo dal fabbro**, avvicinandosi: niente piu' acquisto dal pannello di fine ondata.
- **🧙 Il Mercante Errante resta dov'era**: e' l'incontro nascosto delle ondate normali, con le sue offerte uniche.
- **🐛 FIX grosso: i mercanti erano invisibili.** `merch`/`merchD` non venivano mai copiati dallo snapshot, quindi
  Mercante Errante e Mercante Nero non venivano **mai disegnati** (beacon e marker minimappa compresi): li si
  trovava solo camminandoci addosso.
- Test: **292 passati, 0 falliti**.

## 🆕 Novita v1.51 (level up rivisto: 1 di 3 carte, dieci poteri nuovi, negozio XP severo)
- **🎴 Si sceglie 1 potere su 3** (erano 2 dalla v1.10): il catalogo era cresciuto mentre le pescate calavano.
- **✨ Dieci poteri nuovi** (catalogo 23 → **33**), ispirati ad altri roguelike:

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

- **🔗 Due nuove sinergie**: 🎯 Cacciatore di Teste (Grazia + Piede di Porco) e 🌊 Onda d'Urto (Rappresaglia + Spine).
- **✦ Negozio XP che obbliga a scegliere**: curva da `1.55^n` a `2.05^n` e **tetto di 8 livelli**. Massimizzare
  tutto passa da **3.526** a **17.768 XP**, contro le ~7.528 raccolte in una run: ci si specializza, e la **combo**
  (moltiplicatore XP fino a ×2.5) diventa la leva vera su quanto puoi permetterti.
- **🪙 Emporio a monete nascosto** per ora (`C.SHOP_GEAR_ENABLED = false`): niente è stato rimosso, le monete
  continuano a cadere e i **mercanti** in mappa restano attivi.
- **🎒 Barra dei poteri attivi** sopra la barra abilita: icone, rarita, moltiplicatore e sinergie, con descrizione al passaggio del mouse.
- Test: **273 passati, 0 falliti** + nuova suite `test/client.js` per l'interfaccia (`npm test` lancia entrambe).

## 🆕 Novita v1.50 (consolidamento: curva di difficolta, elite tarati, documentazione riallineata)
- **🌊 Curva di introduzione ripristinata**: i nemici tornano a entrare **scaglionati** — Zombie (1) → Melma (2) →
  Negromante (3) → Troll (4) → Beholder (6). Le comparse "dal primo stage" di v1.44/v1.49 erano temporanee (servivano
  a valutare i nuovi sprite) ed erano rimaste: all'ondata 1 uscivano gia 4 archetipi su 5, tank compreso.
- **⚔️ Elite tarati sui tank**: il moltiplicatore PV degli elite e ora **per-nemico** (`def.eliteHp`, default 2.4).
  Un **Troll elite** all'ondata 4 passa da **~845** a **~528 PV**; gli altri nemici restano invariati.
- **📚 Documentazione riallineata**: `ROSTER.md` riscritto (mancavano Melma e Beholder, il Troll era ancora
  "Bruto"), titolo del README corretto, **checklist di release** aggiornata (commit git al posto dello zip `.txt`,
  con `ROSTER.md` finalmente in lista).
- Test: **256 passati, 0 falliti**.

## 🆕 Novita v1.49 (Beholder: l'Occhio Tiranno torna con lo Sguardo multi-raggio)
- **👁️ Beholder** (ex Occhio Vagante) reintrodotto nel roster: **non spara**, ti **DEBILITA con lo Sguardo** se
  entri nel suo **campo visivo**. Le **eyestalks ruotano** e alternano i tre sguardi (**weaken/slow/sunder**) ogni
  ~4s, con il **fascio che cambia colore**. **Render RASTER PUPPET** (illustrazione ritagliata: `beholder/body.png`)
  con **iride che segue** e **pupilla che si dilata**. tier 3, 130 PV, gittata 340. Nel pool dal primo stage.
- Test: **246 passati, 0 falliti**.

## 🆕 Novita v1.48 (fix Troll: cammina davvero + ombra ai piedi)
- **🐛 Camminata**: i mostri **lenti** (Troll) non restano più in **idle mentre scivolano** — soglie del rilevamento
movimento abbassate con isteresi (0.28/0.10). Ora walk/idle si attivano correttamente.
- **🐛 Grounding**: lo sprite-sheet non **fluttua** più e l'**ombra è ai piedi** (prima l'ombra generica era ~28px sotto).
- Test: **234 passati, 0 falliti**.

## 🆕 Novita v1.47 (Troll delle Caverne: SPRITE SHEET animato)
- **👹 Troll delle Caverne** (ex Bruto): ora reso con un **vero sprite sheet** frame-by-frame (idle/walk/attack, 3 fogli
5×5 @256px) disegnato a mano → **camminata naturale** e **martellata** completa; **mirror L/R** per la direzione.
- **🧩 Nuovo motore sprite-sheet** (`SHEETS`+`_drawSheet`): stato→animazione, frame dal tempo o dalla fase d'attacco,
ancoraggio ai piedi, ombra e hit-flash. Il danno dello slam scatta al 72% dello swing (coincide con l'impatto).
- Test: **234 passati, 0 falliti**.

## 🆕 Novita v1.46 (Bruto senza tremore + Melma TOP-DOWN)
- **👹 Bruto**: camminata **rifatta** (niente più "parkinson"): un dondolio lento, braccia in sincronia, piede che si
solleva morbido; anti‑sfarfallio con **isteresi**. Parti ritagliate meglio.
- **🟢 Melma Corrosiva**: ora è una **pozza fluo vista dall'alto** che **striscia** (wobble + edge‑glow), mantiene lo
**sputo di bolle d'acido** ad alto danno.
- Test: **226 passati, 0 falliti**.

## 🆕 Novita v1.45 (Melma: striscia + salta e sputa acido)
- **🟢 Melma Corrosiva rifatta**: ora **striscia** lenta (niente più saltelli su‑e‑giù); il **salto** avviene **solo
in attacco**, quando **sputa un ventaglio di bolle d'acido ad ALTO danno** a distanza ravvicinata (IA blob).
- **🎨 Sprite senza bocca** + **edge‑glow** verde; **occhi che si illuminano nella direzione di movimento**.
- Test: **226 passati, 0 falliti**.

## 🆕 Novita v1.44 (Melma Corrosiva squash&stretch + Bruto affinato)
- **🟢 Melma Corrosiva** (4° puppet): blob acido in **squash & stretch** (respira, saltella appiattendosi/allungandosi,
schizza in avanti) con **aura verde**, **nucleo pulsante**, occhi che avvampano e **bolle acide**. Nel pool dal 1° stage.
- **👹 Bruto**: la camminata ora **solleva i piedi** (falcata più ampia) e lo **slam è più impattante** (doppia onda + polvere + hit-stop + scossone).
- Melma e Bruto compaiono **dal primo stage** per valutazione. Test: **221 passati, 0 falliti**.

## 🆕 Novita v1.43 (Bruto ridisegnato, vagabondaggio & anti-incastro)
- **👹 Bruto**: camminata **lumbering** distinta dallo zombie (braccia in sincronia, waddle) e **SLAM overhead** —
alza i pugni sopra la testa e li **schianta a terra** (area + forte respinta) quando entri nel suo campo visivo.
- **🧭 Vagabondaggio**: i nemici che **non ti vedono** ora **vagano a caso** per la mappa (ti inseguono solo quando ti individuano).
- **🧱 Anti-incastro**: nessun nemico (**boss compresi**) resta più incastrato — rilevatore di wedge + recupero/scivolamento.
- Test: **213 passati, 0 falliti**.

## 🆕 Novita v1.42 (Bruto delle Caverne: tank PUPPET con slam ad area)
- **👹 Bruto delle Caverne** (3° puppet, tank): enorme e lento, **braccia enormi** con grande dondolio in camminata e
**SLAM ad area** in due tempi (carica → schianto del busto in avanti/giù) con onda d'urto e respinta. Nel pool dall'ondata 4.
- **🖼️ Artwork del bestiario** aggiunti in `public/assets/art/` (overview + concept del Bruto); `ROSTER.md` aggiornato.
- **🟣 Incluso:** sfere del Negromante +30% (`projSpeed` 250→325, da v1.41).
- Test: **206 passati, 0 falliti**.

## 🆕 Novita v1.39 (Negromante PUPPET + motore puppet generico + migliorie)
- **🧙 Negromante** (2° puppet): fluttua, **evoca zombi minori** (max 4) e **spara sfere debilitanti** (curse) **solo quando entri nel suo campo visivo** (cono fov con telegrafo). Nel pool dall'ondata 3.
- **🧩 Motore puppet generico** (`PUPPETS[key]` + `PROF[key]`): nuovo nemico = "manifest + profilo".
- **✨ Migliorie a tutti i puppet:** hit-reaction (squash+rinculo), **morte con crollo dei pezzi**, inclinazione nel movimento, ombra dinamica, tint per gli **elite**.
- Test: **193 passati, 0 falliti**.

## 🆕 Novita v1.38 (occhi che avvampano al colpo · via il cerchio verde)
- **👁️ Occhi verdi che avvampano** quando lo zombie viene colpito (feedback di danno); lampo verde anche di spalle.
- **🟢 Rimosso il cerchio verde** attorno al nemico (disco veleno + alone puppet reso molto tenue).
- Test: **190 passati, 0 falliti**.

## 🆕 Novita v1.37 (roster essenziale: SOLO lo Zombie Putrido in render PUPPET)
- **🧟 Un solo nemico d'ondata**: rimossi Negromante, Spettro e Occhio Vagante. Lo **Zombie Putrido** è ora reso col
**RENDER PUPPET** (6 pezzi PNG + overlay vettoriale) e **sostituisce** il vecchio zombie vettoriale.
- **🎞️ Attacco in due tempi** (carica → colpo) con **affondo del corpo in avanti**.
- **🌑 Ombra a terra sfocata** alla base dei piedi (radica il mostro sulla mappa) e **camminata più aggressiva e lenta**.
- Test: **190 passati, 0 falliti**.

## 🆕 Novita v1.35 (Troll rimosso · Mercante Nero riempito · Occhio Vagante: lo Sguardo)
- **🗑️ Troll rimosso**: il Troll delle Caverne esce dal roster (sprite non convincente). Pool a **4 archetipi**:
  Zombie · Spettro · Negromante · Occhio Vagante.
- **🖤 Fix Mercante Nero "vuoto"**: il box appariva centrato ma senza offerte. Le card ora si **ricostruiscono solo
  al cambio offerta** (prima venivano ricreate ~20 volte/sec, riavviando l'animazione d'ingresso → restavano invisibili).
- **👁 Occhio Vagante — attacco "Sguardo"**: non spara più. Se sei nel suo **campo visivo** (cono, con LOS libera)
  subisci un **debuff** che si rinnova finché resti sotto lo sguardo. Tre tipi (uno per occhio): **weaken** (attacco
  indebolito), **slow** (velocità ridotta), **sunder** (meno difesa). **Sprite -20%** e **tentacoli tutt'intorno** al bulbo,
  con **fascio dello sguardo** colorato per tipo. Test: **176 passati, 0 falliti**.

## 🆕 Novita v1.32 (Bestiario ampliato: Spettro & Occhio Vagante, Troll rifinito, Mercante Nero al top)
- **👻 Spettro (nuovo)**: nemico etereo/translucido, veloce, con **occhi ardenti** e corpo che sfuma in code
  ondulate. IA **`wraith`**: si avventa in mischia e **"sfasa" (phase-blink)** verso di te attraversando gli
  ostacoli. Nel pool dall'**ondata 2** (tier 2, 92 PV).
- **👁️ Occhio Vagante (nuovo)**: bulbo oculare fluttuante con **eye-stalks** e tentacoli, iride che segue e
  pupilla che dilata in attacco. IA **`strafer`**: orbita a distanza e scaglia **raggi arcani**. Nel pool
  dall'**ondata 4** (tier 3, 118 PV, gittata 320).
- **🪓 Troll rifinito**: braccia massicce **senza mani/artigli**, occhi **rossi**, animazioni di passo/respiro.
- **💀 Mercante Nero "al top"**: veste con gradiente, **bordo runico pulsante**, spalle a punta bordate,
  volto-teschio con occhi viola ardenti e **mani ossute** che presentano la merce; beacon a doppia colonna.
- **🧟 Pool a 5 archetipi**: Zombie · Spettro · Negromante · Occhio Vagante · Troll. Test: **177 passati, 0 falliti**.

## 🆕 Novita v1.31 (Ampolla della salute, Troll anticipato, Mercante Nero al centro)
- **🧪 Ampolla dei Punti Salute**: gli HP sono ora una **boccetta** che si riempie di liquido rosso in base alla
percentuale di salute (numero PV al centro), con la fila **VITE** e i cuori sotto. Spostata **a fianco della barra
abilità** e resa **molto più grande**; sotto il 30% pulsa in rosso acceso.
- **👹 Troll dall'ondata 3**: il Troll delle Caverne entra nel pool già dalla wave 3 (prima dalla 5).
- **🕯️ Mercante Nero centrato**: la sua finestra compare al **centro dello schermo** con velo scuro di sfondo;
il Mercante Errante normale resta in basso.

## 🆕 Novita v1.30 (Bestiario essenziale: Zombie, Negromante, Troll in vista frontale)
- **👾 Roster ridotto a 3**: rimossi tutti gli altri nemici delle ondate. Restano **solo Zombie Putrido, Negromante e
Troll delle Caverne**, tutti ridipinti in **grigio molto molto scuro** con occhi/accento luminosi per la personalità.
- **🪤 Mimic mantenuto come cassa**: la **Bestia Mimica** resta nel gioco **solo come cassa-mima** (e in modalità Tesoro),
fuori dal pool delle ondate — aprire una cassa-mima evoca di nuovo un vero mimic.
- **🖼️ Vista FRONTALE (billboard)**: i tre mostri **guardano la camera**, si specchiano verso il movimento e mostrano il
dorso quando si allontanano — nuovo stile **dark-cartoon** ricco di dettaglio (mascella che si spalanca sullo zombie,
cappello + bastone-orbe sul negromante, braccia-mazza e zanne sul troll). Test: **175 passati, 0 falliti**.

## 🆕 Novita v1.29 (Negromante: proiettili in vista, evocazioni al buio)
- **🧙 IA reattiva alla linea di vista**: il **Negromante** spara **proiettili magici** quando ti ha **nel campo visivo**
(LOS libera e in gittata); se invece sei **nascosto** dietro i muri, **evoca scheletri** (2 ogni 8s) e **avanza** per stanarti.
- **🟣 Evocazione viola**: l'anello dell'evocazione ora usa il colore del mostro (viola per il Negromante).

## 🆕 Novita v1.28 (maledizione del Negromante + cunicoli a prova di boss)
- **💀 Maledizione**: gli incantesimi del Negromante fanno danno **e** indeboliscono per **4,5s** (danno −40%,
velocità −20%), con notifica **"SEI STATO MALEDETTO"** e aura viola sul personaggio.
- **🕳️ Cunicoli boss-proof**: nuova passata che allarga i colli di bottiglia a **≥3 tile** → **100%** delle mappe
ora fa passare anche il mega-boss (prima 83%). Verificato su 2100 mappe.

## 🆕 Novita v1.27 (braccia ai lati & rimozione Predone Goblin)
- **🦾 Zombie**: le braccia ora scendono **lungo i fianchi** a riposo e si protendono **in avanti solo in attacco**(via l'effetto "insetto"). Testa già centrata.
- **🗑️ Rimosso il Predone Goblin**: tolto dal roster; il Signore della Guerra ora evoca **Zombie**, ondate e
fallback usano lo **Zombie Putrido**. Roster: **9 nemici** + 3 boss. Test: **180 passati, 0 falliti**.

## 🆕 Novita v1.26 (nemici ridisegnati + animazioni attacco/morte)

Tre nemici **ridisegnati** (dark-fantasy vettoriale) con nuove animazioni di **attacco** e **morte** (idle/camminata
già presenti): **🧟 Zombie Putrido** (braccia protese, occhi neri, morso), **🧙 Negromante** (cappuccio, occhi viola,
orbe che divampa) e **🪓 Orco Berserker** (ascia a doppia lama, zanne, fendente). Alla morte i nemici **crollano e
svaniscono** (il negromante si **dissolve in volute viola**). Solo questi **3** per ora. Canvas 2D puro, zero dipendenze.

## 🆕 Novita v1.25 (terzo lotto di oggetti scenografici)
Aggiunti **6 nuovi oggetti** (per tema, cap 3-4): **🌉 ponti di legno**, **🪜 scale a chiocciola**, **⛲ pozzi/cisterne**
(acqua luminosa), **⚙️ grate/inferriate**, **💠 cristalli giganti** (landmark luminoso) e **🗿 statue rituali con
gemma** (luminosa). Con i 3 lotti la mappa ha ora **18 oggetti scenografici** totali.

## 🆕 Novita v1.24 (secondo lotto di oggetti scenografici)
Aggiunti **6 nuovi oggetti** (per tema, cap 3-4): **🏛️ archi diroccati**, **🧊 stalattiti**, **☠️ forche/patiboli**,
**🔮 obelischi arcani** (rune pulsanti + glow), **🏮 lanterne appese** (illuminano) e **🩸 macchie di sangue** a terra.
Distribuiti come **zone tematiche coerenti** legate ai biomi (Cripta/Lava/Foresta/Ghiaccio/Arcano).

## 🆕 Novita v1.23 (muri neri, terreno vivo, nuovi oggetti & fix mercante)
1. **🖤 Muri QUASI NERI** (contrasto 0.50→0.15) nettamente staccati dal pavimento; **terreno meno piatto** con rocce,
   massi, ciottoli e buche sparse.
2. **⚡ Crepe grandi** (2-3 per mappa, molto piu grandi) al posto delle rune pulsanti (rimosse).
3. **🗿 6 nuovi oggetti scenografici** (per tema): stalagmiti, pile di teschi, macerie, ragnatele giganti, cristalli
   luminosi, altari rituali. Cap 3-4 per tipo.
4. **🐀 Animaletti piu grandi** (~2x). **🛒 Mercante Errante**: fix del click + beacon sempre visibile + marker minimappa.

## 🆕 Novita v1.22 (caverna organica, ombre nette, animaletti & cluster)
1. **🗺️ Conformazione ORGANICA** (caverna varia) al posto del layout a stanze "piatto"; connettivita garantita.
2. **🖤 Muri a contrasto 0.50** + **ombra MARCATA** muro→pavimento (linea di contatto scura): stacco netto.
3. **🐀 Animaletti** (ratti, ragni, scarafaggi) che sfrecciano sul pavimento evitando i muri.
4. **🕯️ Decorazioni a CLUSTER** coerenti (cimitero/ossario/deposito/fungaia/gabbia), **max 3-4 per tipo**; solo le
   **torce** restano numerose. **Casse scenografiche** + **mimic solo dalle casse** (casse-mima al 30%, **dalla
   v2.5 al 6%**).

## 🆕 Novita v1.21 (muri quasi neri, nebbia volumetrica & rune pulsanti)
1. **🖤 Muri MOLTO piu scuri** (quasi neri): la roccia dei muri e scurita ~30% del colore del tema, distinta dal
   pavimento (invariato).
2. **🌫️ Nebbia volumetrica a strati** che deriva lentamente + **rune/crepe che pulsano** sul pavimento (glow del
   colore del tema, visibili anche nel buio della torcia).
3. **🗑️ Rimossi** laghi/pozze, colonne, pilastri e statue.

## 🆕 Novita v1.20 (stanze grandi, pozze-lago & decorazioni ricche)
1. **🏛️ Layout a STANZE** — stanza centrale grande + 4 stanze angolari (NO/NE/SO/SE) con **corridoi larghi 3 tile**:
   il **boss passa ovunque**, niente piu cunicoli stretti o nemici incastrati. Connettivita garantita.
2. **💧 Pozze naturali** — solo 1-2 per mappa, forma organica tipo **lago** (desaturata, con profondita), del colore del tema.
3. **🕯️ Decorazioni ricche e bilanciate** — bracieri e candelabri (che illuminano), funghi bioluminescenti, casse,
   barili, sacchi, statue demoniache (occhi luminosi), gabbie sospese con scheletro, pilastri.

## 🆕 Novita v1.19 (texture roccia realistica, stanze attigue & niente glow)
1. **🪨 Texture ROCCIA realistica** su pavimento e muri: rilievo/bump (illuminazione 3D), domain-warp, crepe, umidita e
   muschio — colorata sul tema. Canvas 2D puro, zero dipendenze.
2. **🚪 Mappa meno "quadratona"** — tramezzi con varchi creano **stanze minori attigue** (connettivita garantita).
3. **🚫 Glow rimosso** (bloom + tasto B): schermo piu pulito. Restano torcia (L) e alone tondo.

## 🆕 Novita v1.18 (caverna vera: terra/roccia, pozze uniche & decorazioni)
1. **🕳️ Look da CAVERNA** — pavimento "terra" e muri "roccia" organici, **senza griglia** (mottling + ombre ai bordi).
2. **🩸 Pozze come forma UNICA irregolare** con profondita (conca scura + centro scuro), del colore del tema.
3. **🪦 Decorazioni ripristinate** (bare, scheletri, accampamenti, rocce...) e mix per tema di nuovo ricco.
4. **🔥 Torce molto meno frequenti** e irregolari (niente piu griglia di aloni).

## 🆕 Novita v1.17 (dungeon di pietra: mappa ripulita, pozze & torce ai lati)
1. **⭕ Alone tondo grande** attorno all'eroe (niente piu cono direzionale); mappa un filo meno scura.
2. **🧱 Pavimento e muri in pietra** (lastre + blocchi) e **mappa ripulita** (molte meno decorazioni "alla rinfusa").
3. **☠️ Pavimento rivisto**: via spuntoni e "pallini"; ora **pozze** acido/fuoco/freddo/arcano **del colore della mappa** che brillano.
4. **🔥 Torce ai lati** della mappa (perimetro) come nuove fonti di luce.

## 🆕 Novita v1.16 (torcia nel buio: mappa oscura & cono di luce)
1. **🔦 Modalita torcia** — mappa quasi nera "bucata" da un **cono di luce** nella direzione di mira + alone attorno
   al giocatore. Torce, proiettili e sorgenti restano visibili; boss/elite si intravedono. Tasto **`L`** on/off.
2. **🌑 Bloom piu tenue** — glow generale ridotto (0.85→0.5): resta su nemici/spari/eroi/effetti senza esagerare.
3. **✨ Pulviscolo ambientale** — polvere che fluttua e brilla nel fascio di luce (atmosfera).

## 🆕 Novita v1.15 (dungeon neon: bloom & glow)
1. **🌟 Bloom / glow diffuso** — proiettili, torce, occhi dei nemici e accenti degli eroi "irradiano" luce (look
   twin-stick moderno) restando nel **tema dungeon cupo**. Canvas 2D puro, offscreen a bassa risoluzione: leggero.
2. **🔫 Proiettili neon** — nucleo bianco + alone saturo + scia: vere scie luminose.
3. **👁️ Nemici emissivi** — alone colorato attorno a ogni mostro (piu forte per elite/boss), stile "orb neon".
4. **⌨️ Tasto `B`** per attivare/disattivare il bloom (salvato) — utile sui PC lenti.

## 🆕 Novita v1.13 (entita un po' piu grandi, senza perdere fluidita)
1. **🔎 Personaggio, nemici, boss e prop piu grandi** (visivo +45%) per un colpo d'occhio piu imponente.
2. **⚡ Fluidita preservata** — la collisione resta quasi invariata (~1.08x, come la v1.12) e c'e un **+5% velocita**:
   occhi grandi, hitbox piccola. Nessuna modifica a mappa/densita.
3. **🔧 Fix Mercante Nero** — a fine round compare **un solo** mercante: il Nero **al posto** di quello ufficiale
   (~30%), altrimenti l'ufficiale. Mai entrambi.

## 🆕 Novita v1.12 (Mercante Nero & HUD ridisegnato)
1. **💀 Mercante Nero** — secondo mercante sinistro (teschio, altare, lanterna viola) con **patti rischio/ricompensa**:
   potenziamenti forti ma con una maledizione. Ben differenziato dal Mercante Errante.
2. **🎲 Apparizione casuale** — il Mercante Nero non e sempre presente: compare a caso (~35%) e si nasconde lontano.
3. **🎨 HUD ridisegnato** — barra abilita piu grande e caratteristica (icone grandi, etichette, pulsazione);
   gli **eventi ora compaiono al centro**, grandi e molto visibili.

## 🆕 Novita v1.11 (mercante, creature & attacchi alla Hades)
1. **🧙 NPC Mercante Errante** — appare in mappa (spesso in una micro-area); avvicinati per comprare **3 offerte
   casuali** con le monete (cura, +PV, arma, potere, vita, buff).
2. **👹 Nemici ridisegnati** — non piu pallini: creature dettagliate con corpo, arti, corna, zanne, ali e occhi.
3. **⚔️ Attacchi vari (stile Hades)** — **zone telegrafate** a terra, **ventagli** di proiettili, **raffiche** e **affondi**.
4. **🕯️ Mappe piu scure + micro-aree** — nicchie/stanzette laterali arredate; illuminazione piu intima e cupa.
5. **🐛 Fix movimento** — risolto il blocco del personaggio (era lo scatto col tasto destro che azzerava i tasti).

## 🆕 Novita v1.10 (icone emporio, poteri & dungeon tetri)
1. **🎨 Icone emporio uniche per personaggio** — armatura, stivali e arma hanno icone-immagine dedicate e
   **diverse per i 3 eroi** (dalla v1.66: Guerriero acciaio, Mago viola, Ladro verde).
2. **🎴 Piu poteri, scelta tra 2** — catalogo boon ampliato (23 totali, +6 nuovi); a fine ondata si sceglie 1 di 2.
3. **🛒 Emporio a 3 slot e piu costoso** — rimossi Anello e Amuleto; oggetti molto piu cari (scelta di lungo periodo).
4. **🪦 Dungeon piu tetri** — tombe, cadaveri, strumenti di tortura, gabbie, piu ragnatele/catene/teschi; atmosfera oscurata.
5. **🐛 Fix "movimento autonomo"** — azzeramento input su perdita focus/chat: niente piu personaggio che si muove da solo.

## 🆕 Novita v1.9 (pausa, nuove abilita & scenografia)
1. **⏸️ Pausa nel negozio** — a fine ondata (scelta poteri / negozio / emporio) il mondo si **congela**;
   in singolo riparte solo col tasto **Continua**. I drop rimasti a terra vengono **raccolti in automatico**.
2. **⚔️ 2 abilita per eroe + nuove** — 🎯 **Torretta Schierabile** (Enforcer) e 🎯 **Colpo del Cecchino**
   (Recon, sostituisce lo scatto ridondante). Lo **scatto** universale (tasto destro) resta invariato; Glitch mantiene
   Bullet-Time + Frattura di Dati.
3. **🏛️ Piu elementi scenografici** — colonne, cristalli, statue, funghi, catene, pozze, stendardi, sarcofagi.
4. **🏷️ Versione nel titolo** — mostrata nella scheda del browser e come badge nel menu.

## 🆕 Novita v1.8 (monete & emporio equipaggiamento)
1. **🪙 Monete di vario taglio** — i nemici droppano monete oltre all'XP: 🟤 Bronzo (1),
   ⚪ Argento (5), 🟡 Oro (20). Boss ed elite ne lasciano di piu; raccolta con calamita come l'XP.
2. **🏪 Emporio dell'equipaggiamento** — un secondo negozio (a monete) con **3 slot** (Armatura, Stivali, Arma) potenziabili per
   **5 tier**: 🛡️ Armatura, 👟 Stivali, ⚔️ Arma, 💍 Anello, 📿 Amuleto.
   Ogni tier costa piu del precedente: costruisci il tuo personaggio nel tempo.
3. **Due economie complementari** — **XP** per micro-potenziamenti ripetibili, **monete** per equipaggiamento a slot.

## 🆕 Novita v1.7 (stats, ricompense combo & sinergie)
1. **🏆 Schermata di fine partita con statistiche** — riepilogo della run con **classifica co-op**
   (uccisioni, **combo massima** 🔥, danni, boon, sinergie e arma) e **durata** ⏱, con medaglie 🥇🥈🥉.
2. **🔥 Ricompense combo a soglie** — la combo ora sblocca bonus: **15** = Frenesia (cadenza),
   **25** = Nova ad area, **40** = Cura + Egida. Mantenere la catena diventa una scelta tattica.
3. **🔗 Sinergie tra Boon** — coppie compatibili sbloccano effetti potenziati: **Deflagrazione Tossica**
   (Tossina+Esplosivi), **Catena Gelida** (Catena+Gelo), **Cercatore** (Homing+Perforazione), **Sete di Sangue**
   (Vampirismo+Adrenalina).

## 🆕 Novita v1.6 (combo, minimappa & homing)
1. **🔥 Sistema COMBO / streak** — le uccisioni consecutive riempiono un **combo meter**: ogni catena
   fa salire un **moltiplicatore di XP** (fino a **x2.5**). Se smetti di uccidere per qualche secondo la combo
   **decade** e riparte da zero. Punteggi alti = crescita esponenziale (stile Hades / Vampire Survivors).
2. **🗺️ Minimappa in tempo reale** — in basso a sinistra: muri, portale d'uscita, **alleati**,
   **nemici** (con boss in rosso ed **elite** in oro) e lo **scrigno del tesoro** 👑. Colpo d'occhio
   costante sul campo di battaglia, utile soprattutto in co-op fino a 6.
3. **🎯 3 nuovi Boon** — **Mira Guidata** (proiettili che curvano verso i nemici),
   **Avidita** (+30% XP raccolta, potenzia le combo) e **Baluardo** (-12% a tutti i danni subiti).

## ✨ Novita v1.5 (profondita & game feel)
1. **🎴 Poteri a scelta (stile Hades)** — a fine ondata scegli **1 di 3 carte** con **effetti unici e impilabili**:
   Rimbalzo, Perforazione, **Catena di Fulmini**, **Tossina** (veleno), **Colpi Esplosivi**, Onda di Ritorno,
   Vampirismo, Sdoppiamento, Occhio di Falco, Proiettili Giganti, **Tocco Gelido**, Aura di Spine,
   Adrenalina Pura, Scudo Vitale. Combinali per creare **build** sempre diverse.
2. **💥 Hit-stop + evoluzione armi** — micro **freeze-frame** sui critici e sulle uccisioni di boss/élite
   (game feel "pesante"). Porta un'arma a **Lv.3** con la statistica giusta e si **evolve** in una versione
   potentissima con nome proprio (Uragano d'Acciaio, Tempesta di Piombo, Lancia del Giudizio).
3. **🌊 Modalità ondata** — ogni ondata è un evento diverso: **Orda** (sciami), **Caccia** (élite),
   **Sopravvivenza** (resisti al timer), **Tesoro** 👑 (uccidi lo scrigno fuggitivo prima che scappi con il loot),
   Assalto (standard).

Include (dalle versioni precedenti): sistema di **vite** (2), **XP raccoglibile + negozio statistiche**,
**item drop** (pozioni, stivali, corazza, casse armi, +100% danno, invulnerabilità, Cuore Fenice),
**20 livelli** con **MEGA boss finale** AZ'GAROTH, **temi mappa** (Cripta, Lava, Foresta, Ghiaccio, Arcano),
dash che attraversa i nemici, 3 armi raccoglibili, musica tetra da dungeon, casse con bonus/mimic,
3 classi (guerriero, mago, ladro), 10 mostri + boss, netcode autoritativo.

## 🗂️ Architettura (file dedicati)
```
shared/  constants (VERSION), mathutils, loot (BOON + EVO + item + XP + equipaggiamento), monsters (roster + boss),
         heroes, mapgen (temi + VILLAGGIO + cella del risveglio), storia (v2.7 — TUTTO il testo della storia),
         pathfinding, ai (swarm/necromancer/brute/blob/gazer), waves (MODALITÀ + pool + scaling)
server/  index, ws, Room (boon, hit-stop, modalità, evoluzioni, vite, XP, combo, evocazioni, anti-incastro)
public/  index.html (scelta boon + badge versione), style.css
public/js/ net, input, audio, renderer (puppet + sprite-sheet + boon-fx + MINIMAPPA), hud, main
public/assets/enemies/  pezzi raster + manifest dei mostri (ghoul, mage, brute, slime, beholder, troll_sheet)
public/assets/art/      artwork del bestiario
tools/   slicer e anteprime rig — Python offline, NON servono a runtime
test/    simulate.js — suite headless server (273 test) · client.js — smoke test interfaccia (DOM finto)
```

Buon divertimento nel Rift! 🗡️
