# ⚔️ DUNGEON RIFT — Caratteristiche complete del gioco

**Versione attuale:** `2.14.0`
Roguelike co-op frenetico per **fino a 6 giocatori**, motore **custom a dipendenze zero** (Node.js + Canvas 2D):
niente `npm install`, niente asset esterni — grafica, musica ed effetti sono **generati proceduralmente**.

> ⚠️ **Manopola spenta al momento** — quello che il documento descrive ma che nel gioco oggi **non c'e'**:
> la **Faglia ai margini** (`EDGE_MARGIN: 0`, vedi la sezione *LA FAGLIA E' SPENTA*).
>
> *(Le **abilita' attive**, spente dal v1.66 e promesse dal v1.69, sono state accese in **v1.85**: quattro
> per classe, agli slot Q ed E.)*

---

## 🎚️ COME CRESCE IL PERSONAGGIO *(rifatto in v1.79)*

### Il tetto e le sei scelte *(v1.87)*
- **Livello massimo: 15.** Oltre non si sale; l'esperienza raccolta dopo non serve piu' a niente.
- **Sei scelte in tutta la partita**: **quattro passive** (livelli **3, 6, 9, 12**) e **due abilita'
  attive** (livelli **8** e **14**, tasti **Q** ed **E**). Le attive **si aggiungono** alle passive, non
  ne prendono il posto.
- Una passiva mostra **quattro carte**: due della tua classe e due neutre. Un'abilita' attiva ne mostra
  **due**, entrambe della tua classe. In tutti e due i casi se ne sceglie **una**, e vale per la run.
- Le abilita' di classe le vede **solo** quella classe: un mago non sa nemmeno che esistono quelle del
  guerriero. E' voluto — e' la rigiocabilita' a cambiare personaggio.
- **Niente impilamento**: ogni passiva si prende una volta sola.
- Al **livello 15** si sceglie la **specializzazione** fra due: e' passiva, e **alza del 30% la potenza
  delle abilita' attive** che hai scelto.

| Livello | Cosa arriva | Cosa deve fare |
|---|---|---|
| 3 | Passiva **non comune** | Da' forma al colpo base. Piccola, ma si sente subito. |
| 6 | Passiva **rara** | Aggiunge una **regola** a come combatti, non solo una percentuale. |
| 8 | **Abilita' attiva — tasto Q** | Un gesto nuovo, con 30s di ricarica: cambia cosa puoi fare, non quanto fai. |
| 9 | Passiva **epica** | Definisce la build, e puo' avere un prezzo o una condizione. |
| 12 | Passiva **divina** | **Riscrive una regola** del gioco. |
| 14 | **Abilita' attiva — tasto E** | Il momento in cui l'ondata gira. Ricarica 45s. |

> *Nella 1.85 le attive stavano al 6 e al 12 e le passive erano scese a due: un baratto che toglieva meta'
> della crescita del personaggio per aggiungere un tasto. Dalla **1.87** le passive sono di nuovo quattro
> ai loro livelli e le attive stanno all'**8** e al **14**, che prima non davano niente.*

---

## ⚡ LE ABILITA' ATTIVE *(v1.85)*

Quattro per classe, due per slot: **una si sceglie al livello 8** (tasto Q) e **una al 14** (tasto E). Si
aggiungono alle quattro passive, non le sostituiscono. La ricarica e' lunga apposta: non sono una seconda
arma, sono il momento in cui l'ondata cambia. Nessuna risorsa nuova da guardare — solo il tempo.

| Classe | Slot **Q** — livello 8, ricarica 30s | Slot **E** — livello 14, ricarica 45s |
|---|---|---|
| 🛡️ **Guerriero** | ⚡ **Carica** — scatto corazzato di 300px che sfonda: doppio fendente, spinta e **stordimento**, e sei immune mentre corri<br>📣 **Grido di Guerra** — i nemici intorno puntano **te** per 3s, e tu e i compagni nel raggio subite **−25% danni** per 4s (**i boss non danno retta**) | 🌀 **Turbine** — tre giri a 360° in 1,2s, ognuno al 70% del fendente<br>✨ **Giuramento** — per 5s tu e i compagni entro 220px siete **immuni al primo colpo** |
| 🔮 **Mago** | 🔥 **Muro di Fuoco** — barriera di fiamme lunga 220px per 5s: brucia chi la attraversa<br>🫧 **Scudo di Mana** — assorbe danni per 6s, poi **esplode** respingendo e rallentando | ☄️ **Meteora** — tre impatti telegrafati sul punto mirato<br>⛓️ **Catena Nera** — fulmine che rimbalza fra **otto** nemici, a danno calante |
| 🏹 **Ladro** | 🌫️ **Velo d'Ombra** — nube di 150px per 5s: dentro sei **invisibile**, e il primo colpo dall'ombra e' critico<br>🪤 **Tagliola** — trappola armata 25s: il primo che entra resta **bloccato 2,5s** (fino a tre in campo) | 🎯 **Marchio** — il bersaglio prende **+50% danni da chiunque** per 8s; se muore marchiato, meta' ricarica torna<br>🏹 **Salva** — quindici frecce in due secondi, perforanti |

**Le regole comuni:** il danno delle abilita' e' una **quota del colpo base**, quindi non invecchia con le
ondate; la **Destrezza** accorcia la ricarica (`cdrMult`) e la **specializzazione** ne alza la potenza del
**30%**; un'abilita' che non trova bersaglio (il Marchio) **non parte e non spende la ricarica**. Il
**mercenario non ha abilita'**: come per l'XP, le monete e la chiave dei prigionieri, non e' un giocatore
per le regole.

**Cosa lasciano sul campo:** il muro di fuoco, le tagliole e la nube d'ombra sono **oggetti veri** nel
mondo, mandati nello snapshot e disegnati come tali — non effetti sopra lo schermo. Il marchio si vede
sopra la testa del nemico **da tutta la squadra**.

### 🐛 Il bug dei livelli 8 e 14 *(corretto in v2.9.4)*

**Non venivano offerte.** Segnalato giocando, e misurato: in una run normale — un livello per ondata — lo
slot **Q arrivava in ritardo**, al livello 9, appeso alla passiva; e lo slot **E non arrivava MAI**. A fine
partita `E = null` e l'abilita' ancora in coda. **Perso in ogni singola run**, perche' dopo il 12 non c'e'
piu' nessuno scaglione che possa riaprire il pannello e trascinarsi dietro cio' che era rimasto sotto.

**Le code sono DUE** — `scaglioniDovuti` (le passive: 3, 6, 9, 12) e `abilDovute` (gli slot attivi: 8 e
14) — e in **tre punti** il codice ne interrogava **una sola**:

| Dove | Cosa faceva | Conseguenza |
|---|---|---|
| `_inviaPannello` | apriva la scelta solo `if (scaglioniDovuti.length > 0)` | un'ondata che portava **solo** all'8 o **solo** al 14 finiva nell'`else`: «niente da scegliere» |
| dopo aver preso una passiva | ripresentava il pannello solo se restavano **altre passive** | chi prendeva passiva e attiva nella stessa ondata vedeva sparire il pannello dopo la prima |
| dopo aver preso **rango o specializzazione** | non passava la mano a nessuno | il 15 aveva la precedenza e si mangiava l'abilita' del 14 presa nella stessa ondata |

La correzione e' una riga condivisa — `_scelteInCoda(p)`, che somma le due code — usata in tutti e tre i
punti. La domanda «c'e' qualcosa da scegliere?» adesso ha **una risposta sola**, e non tre che possono
divergere.

**Il test legge i MESSAGGI, non lo stato.** E' la parte che conta: un test che avesse guardato
`p.abilDovute` avrebbe detto che l'abilita' c'era — e c'era davvero, in coda — senza accorgersi che al
giocatore non veniva mostrata mai. Il TEST 69 invece decodifica il JSON che il server manda al client,
esattamente come farebbe il browser, e poi "clicca" su cio' che gli e' stato offerto: percorre le
quattordici ondate di una run per tutte e tre le classi e verifica **dove** ogni scelta compare.
Rimettendo il codice vecchio, fallisce con quattordici errori.

### 🧪 …e poi la STRADA VERA *(v2.11.2)*

Il test qui sopra aveva comunque un buco: chiamava `_inviaPannello` **a mano**. Provare quella funzione
dimostra che *quella funzione* e' giusta, non che il gioco ci passi davvero — la stessa distinzione che con
le guardie del villaggio era costata una versione buttata.

Adesso c'e' anche un blocco che **gioca l'ondata**: si ammazzano i mostri con `killMonster` (la porta vera,
quella che conta i morti, chiude l'ondata e apre la faglia), si attraversa la faglia, e il gioco arriva al
negozio da solo. Poi si guarda cosa ha ricevuto il client.

Perche' isoli davvero il bug, il personaggio deve aver **gia' preso** le passive dei livelli precedenti —
come chiunque giochi. Se restassero in coda terrebbero acceso il vecchio controllo
(`scaglioniDovuti.length > 0`) e il pannello si aprirebbe lo stesso, **per il motivo sbagliato**: il test
passerebbe su codice rotto. Con il codice vecchio, adesso, dice *«offre: niente»* ai livelli 8 e 14.

### 🖱️ E il clic mentre il pannello si chiude *(v2.11.2)*

`hideShop()` azzera `_boons`. Se il pannello si chiudeva **nello stesso fotogramma** in cui cliccavi una
carta — cambia la fase: parte l'ondata, o si va al villaggio — il gestore del clic scriveva su `null` e
sollevava un'eccezione: la scelta **arrivava al server**, ma il pannello non si ridisegnava e a schermo
restava la carta come se il clic non fosse mai avvenuto. Trovato guardando davvero il browser, non
immaginato. Una riga di guardia, e un controllo che prova a rifarlo.

### La curva dell'esperienza *(ritarata in v1.79.1)*
Cumulata al livello 15: **9.470**. La taratura viene dall'esperienza che i mostri di un'ondata mettono
davvero a terra, **senza combo e senza extra** — la prima versione era tarata su una simulazione a
uccisioni istantanee, dove la combo restava al massimo e l'XP risultava piu' che doppia di quella vera.
Condizione garantita dal test: col solo bottino dei nemici il livello **2** arriva entro la **seconda**
ondata e il primo scaglione (livello **3**) entro la **quarta**. Combo, casse e premio di velocita'
anticipano; non servono ad arrivarci.

| livello | 2 | 3 | 6 | 9 | 12 | **15** |
|---|---|---|---|---|---|---|
| XP cumulata | 200 | 500 | 2.040 | 4.230 | 6.640 | **9.470** |
| ondata attesa | 2 | 3-4 | 6-7 | 10-11 | 13-14 | **16-17** |

### Quanti nemici *(v1.79.1, tetto rivisto in v1.79.2)*
Il conteggio e `10 + 1,6·ondata`: **12 nemici alla prima ondata** (erano 7), 16 alla quarta, 40 alla
diciannovesima (erano 39). Le prime ondate quasi raddoppiano, le ultime restano dov'erano. I nemici
**vivi insieme** li decide il tetto, che dalla v1.79.2 e **uno solo: 40**. In singolo nessuna ondata lo
supera, quindi si vedono tutti; in gruppo l eccesso resta in coda — cambia quanto dura l'ondata, non quanti se ne vedono.

### L'esperienza e' condivisa
Ogni uccisione vale per **tutti i giocatori vivi**: la crescita e' del gruppo, la corsa alla sfera non e'
un gioco. Le ondate pero' crescono col gruppo **meno che proporzionalmente** — misurato, un trio genera
solo il **+27%** di XP totale rispetto a un solista — quindi ognuno riceve il valore pieno moltiplicato
per un **fattore di gruppo** (1 · 0,80 · 0,69 · 0,58 · 0,52 · 0,50), tarato perche' la curva valga
identica da 1 a 6 giocatori. Le **monete** no: restano di chi le raccoglie.

### I punti statistica
**18 in tutta la run** (14 dai livelli, 4 dai ranghi) e **1 punto per livello** di statistica, a
qualunque altezza. Il conto e' esatto: cappare una statistica costa **12**, portarne una seconda a 6 ne
costa altri **6**. Cappare **due** statistiche resta impossibile.

### I ranghi
Cadono insieme agli scaglioni: **3 / 6 / 9 / 12 / 15**. Sei fasce, sei titoli per classe.

| Fascia | Livello | Guerriero | Mago | Ladro |
|---|---|---|---|---|
| — | 1-2 | Guerriero | Apprendista | Ladro |
| I | 3-5 | Guerriero Esperto | Mago Giovane | Furfante |
| II | 6-8 | Veterano | Mago | Predone |
| III | 9-11 | Campione | Mago Anziano | Ombra |
| IV | 12-14 | Signore delle Lame | Magister | Spettro |
| V | 15 | *(specializzazione)* | *(idem)* | *(idem)* |

## 🎴 LE 32 ABILITA' PASSIVE *(ritarate in v1.79.2)*

Regola della taratura: **un'abilita', un effetto**. Prima quasi ognuna ne faceva due — "+15% critico *e*
+0,5x danno critico" — cioe' erano due carte in una, ed e' per questo che il personaggio finiva troppo
forte.

**Neutre — le vede chiunque**

| Scaglione | | |
|---|---|---|
| Non comune | 🎯 Occhio di Falco — +10% critico | 🏃 Passo Rapido — +10% velocita, -8% scatto |
| Raro | ☠️ Tossina — veleno: 5% del danno del colpo al secondo, per 3s | 💠 Scudo Vitale — -5% danni subiti |
| Epico | 🪓 Giustiziere — +5% critico e +30% danno critico | 🧱 Baluardo — -10% danni subiti |
| Divino | ⏳ Ultima Occasione — due volte risorgi a meta vita | 🗡️ Colpo di Grazia — esecuzione sotto il 20% |

**⚔️ Guerriero** — sta in mezzo alla mischia, la ricompensa e' la folla

| Scaglione | | |
|---|---|---|
| Non comune | 🗡 Arma Pesante — +8% danno | 🪓 Colpo Ampio — +5% per ogni nemico in piu nello stesso fendente (max +15%) |
| Raro | 🛡 Presa Salda — +60% rinculo dei tuoi colpi, -6% ai danni subiti *(v1.93, al posto di Vampirismo)* | 💢 Rappresaglia — onda ampia quando incassi |
| Epico | 🔥 Adrenalina Pura — +8% cadenza per uccisione, fino a +48% | 🧍 Colosso — +35% PV massimi, +8% velocita |
| Divino | ☄️ Deflagrazione Cadaverica — i morti esplodono | 🌀 Onda di Ritorno — meta delle uccisioni emette una nova |

**🔮 Mago** — pochi colpi, ognuno deve fare rumore

| Scaglione | | |
|---|---|---|
| Non comune | ⭕ Bolla Densa — +35% dimensione, +18% danno | ❄️ Tocco Gelido — rallenta del 50% per 1,5s |
| Raro | ⛓️ Catena di Fulmini — rimbalza su 2 nemici al 25% | ↩️ Rimbalzo — +2 rimbalzi, senza perdere danno |
| Epico | 💣 Colpi Esplosivi — ogni 4° colpo esplode al 35% in 90px | 🧠 Concentrazione — mezzo secondo fermo: +10% al colpo dopo |
| Divino | 🔮 Frattura Arcana — la bolla che uccide si divide in due (50%) | ⏳ Campo di Lentezza — i nemici entro 200px vanno il 25% piu lenti |

**🏹 Ladro / assassino** — colpire da dietro, far sanguinare, sparire

| Scaglione | | |
|---|---|---|
| Non comune | 🏹 Perforazione — +1 nemico perforato | 🔭 Tiro Lungo — +10% a piena gittata |
| Raro | 🗡 Colpo alle Spalle — +20% su chi non ti sta guardando | 💃 Passo di Danza — +15% velocita per uccisione, fino a +30% |
| Epico | 🩸 Lama Sporca — i critici aprono un emorragia (20% del colpo in 3s) | 🌫 Passo d'Ombra — dopo lo scatto, il primo colpo e critico |
| Divino | 🎯 Punto Vitale — ogni 5° colpo e un critico garantito | 🌑 Uscita di Scena — sotto il 30% dei PV sparisci per 1,5s (ogni 20s) |

**Le sinergie** restano sei, ognuna raggiungibile da **una sola classe** e a cavallo di **due scaglioni**:
🌊 Onda d'Urto (Colpo Ampio + Rappresaglia) · 🛡 Muro d'Acciaio (Presa Salda + Adrenalina) · 🧊 Catena
Gelida (Tocco Gelido + Catena) · 🧪 Deflagrazione Tossica (Tossina + Colpi Esplosivi) · 🩸 Frecce Sporche
(Perforazione + Lama Sporca) · 🎯 Cacciatore di Teste (Colpo alle Spalle + Colpo di Grazia).

**Ritirate**: 🪙 Avidita', 🍀 Fortuna Sfacciata, 🧲 Fame Vorace *(bonus XP, inutili col tetto)*, e in
v1.79.2 🌵 Aura di Spine, ⛏️ Piede di Porco, 🔱 Sdoppiamento, 🎯 Mira Guidata, 😈 Furia Cieca, 🧿 Egida
Ostinata, 🚩 Doppia Bolla, 🔊 Eco Arcana, 🌌 Implosione.

## 🔒 I PRIGIONIERI *(v1.84)*

Ogni tanto (**una mappa su tre**) in un angolo lontano c'e' un recinto di pali con dentro della gente.

| | |
|---|---|
| Quanti | da 1 a 5; il tetto cresce con le ondate (alla prima uno o due, dalla dodicesima anche cinque) |
| Ricompensa | **100 monete a testa** |
| La chiave | addosso a un **elite** se l'ondata ne prevede uno — cade quando cade lui — se no **a terra vicino alle casse**. **Non si vede da lontano**: compare solo entro ~118 px, sfumando |
| Obbligatorio | **no**: l'ondata si chiude lo stesso |
| Ondate del boss | niente recinto |

Il recinto **non blocca il passaggio** (i pali si leggono, non fanno da muro: un muro che il pathfinding
non conosce incastrerebbe i mostri). L'alone e' **giallo quando hai la chiave**, spento quando non ce
l'hai. Il recinto ha **due bracieri accesi** *(v1.87)*: sulla minimappa non c'e', quindi lo si deve trovare
guardandosi intorno — e allora dev'essere una cosa che si vede, un fuoco nel buio. Sta a **420-950 px** dal
giocatore: fuori vista, dentro la stanza in cui si combatte.
Sulla minimappa **non c'e' ne' il recinto ne' la chiave** *(v1.84.1)*: si vede solo la faglia
d'uscita. La deviazione dei prigionieri si trova **esplorando** — una mappa che te la indica non e' una
cosa nascosta, e' una lista di cose da fare. Il mercenario non raccoglie la chiave e non libera nessuno.

---

## 🌀 LA FAGLIA D'USCITA *(v1.84, al posto del pulsante EXIT · disegnata come PORTALE in v1.87.1)*

> 🌀 **E' un portale tondo e frontale**, quello che chiunque abbia giocato a un gioco riconosce senza
> spiegazioni: anello di energia con sei rune incastonate che girano, **vortice a quattro braccia** dentro,
> bocca **scura al centro** e accesa verso il bordo (un portale e' un buco: al centro dev'essere piu' scuro,
> non piu' chiaro), pulviscolo risucchiato verso l'interno, luce viola a terra e nel sistema di
> illuminazione. Fino alla 1.87 era uno *squarcio* verticale di macchie morbide: si leggeva come un'ombra o
> un effetto, non come una cosa in cui si entra.

A mappa ripulita si apre uno squarcio **a un passo dal giocatore** — in vista, mai dentro la roccia, mai
addosso (se no ci si finisce dentro mentre si raccoglie). Ci si passa dentro per chiudere l'ondata. Il
conto alla rovescia anti-AFK resta, e in cooperativa la scritta dice quanti sono gia' passati.

---

## 🗡️ I MERCENARI *(v1.82)*

Al **Banditore**, nel villaggio, c'e' un candidato al banco. Lo assoldi e dalla mappa dopo combatte con te.

| | |
|---|---|
| Quanti | uno solo per volta, solo in **partita singola** |
| Costo | **50 monete** a livello 1, **+40 per livello** (610 al quindicesimo) |
| Classe | a caso fra guerriero, mago e ladro |
| Forza | la classe base **al tuo livello**, coi punti statistica spesi due sulla statistica di classe e uno sulla Costituzione. **Nessuna abilita'** |
| Morte | muore e basta: niente "a terra", niente rianimazione. Poi se ne assolda un altro |
| Fine ondata | **sparisce** (non ti segue al villaggio) e torna sulla mappa dopo **curato del tutto** |
| XP e monete | restano **tue**: non ne prende e non ne raccoglie |

**Cosa NON cambia perche' hai un mercenario.** L'ondata ha gli stessi nemici e la stessa durezza; l'XP non
si divide; la quota di nemici che si fanno sotto (v1.80) resta sei e non dodici; a fine ondata il gioco non
lo aspetta; e la sua morte non chiude la partita, mentre la tua si'. Serve ad **aiutare chi non e'
bravissimo**, non ad alzare l'asticella — ogni riga di questo paragrafo ha il suo controllo nei test.

**Come combatte** *(distanze riviste in v1.82.3)*. E' una **scorta**, non un cacciatore: si occupa di cio'
che minaccia **te**, cioe' dei nemici entro **360 px dal capo** — non di quello che vede lui dall'altra
parte della stanza. Contro il bersaglio tiene la distanza della **sua** arma, si sgancia sotto il 40% di
vita e in mischia molla il contatto mentre l'arma ricarica. Sta a **120 px** da te quando non c'e' niente
da fare e non scende sotto **70** — ma **solo finche' non ha un nemico a tiro**: sotto l'arma non arretra
per far spazio a nessuno, la priorita' e' colpire. Oltre **300** molla tutto e rientra — con un piccolo bonus di velocita' mentre torna, se no a parita' di passo non ti
riprenderebbe mai. E' la stessa testa dei bot che guidano le partite simulate dei test, spostata in
`shared/mercenari.js`.

**Come si vede.** Stessa sagoma e stesso vestito della sua classe, ma di un **colore suo** — quattro tinte
per classe, non sfumature: ruggine/ferro/viola/ottone il guerriero, cremisi/lime/brace/porpora il mago,
bordeaux/blu notte/viola/cuoio il ladro. La tinta arriva dove si vede davvero: mantellina e cappuccio del
ladro, metallo dell'armatura del guerriero, veste del mago. Sopra la testa ha nome, livello e rango.
Quindici nomi per classe.

**Se trova un ostacolo.** Un nemico dietro a un masso non e' un bersaglio: serve la linea di vista, e senza
vale solo chi gli e' addosso (140 px). E se comunque si ritrova a spingere contro la roccia senza
spostarsi, dopo un quarto di secondo cammina **di traverso** per otto decimi — una spallata e via, invece
di restare piantato li'.

---

## 🪜 LA RAMPA DEGLI ARCHETIPI *(rifatta in v1.81)*

Ogni ondata dalla 1 alla 12 mette in campo un archetipo che prima non c'era. Una volta entrato non esce
piu' dal pool, e nessuna ondata resta senza novita':

| Ondata | Entra | Cosa insegna |
|---:|---|---|
| 1 | Zombie Putrido | la mischia di base |
| 2 | Melma Corrosiva | si divide: uccidere non basta |
| 3 | Negromante | bersaglio prioritario, evoca |
| 4 | Fungo Sporifero | nega il terreno: non stare fermo |
| 5 | Nugolo di Pipistrelli | serpeggia: guida il tiro |
| 6 | Sfera d'Ossa | carica dritta: togliti di lato |
| 7 | Fuoco Fatuo | attraversa i muri: il riparo non basta |
| **8** | **Vedova delle Volte** *(nuova)* + **Occhio Viola** *(era 9)* | **la tela ti toglie le gambe** · il raggio consuma vita |
| **9** | **Larva Fetida** *(nuova)* | **non stare incollato a chi stai finendo** |
| **10** | **Ragno della Cripta** *(nuovo)* + **Occhio di Carne** *(era 12)* | tele piu' larghe · lo stesso occhio, piu' duro |
| **11** | **Tessitrice Verde** *(nuova)* | la tela piu' larga e piu' frequente |
| **12** | **Occhio Spettrale** *(era 15)* | raggio lungo, e passa nella roccia |

**Alla dodicesima il bestiario e' tutto in campo** — 14 archetipi. Prima della v1.81 la rampa si fermava
alla settima: le ondate 8, 10, 11, 13, 14 e tutte dalla 16 alla 19 non portavano niente, e all'ondata 19 la
composizione del pool era identica a quella della 15.

### 🕷️ I tre Ragni delle Volte
Non inseguono: orbitano a media distanza e **tessono una ragnatela sul punto dove sei**. La tela non fa un
solo punto di danno — ti **rallenta del 42%** finche' ci stai sopra.

| | Ondata | PV | Tela | Durata | Ogni |
|---|---:|---:|---:|---:|---:|
| Vedova delle Volte | 8 | 88 | 92 px | 5,0 s | 5,5 s |
| Ragno della Cripta | 10 | 148 | 104 px | 6,0 s | 5,0 s |
| Tessitrice Verde | 11 | 196 | 112 px | 6,5 s | 4,4 s |

Da vicino **mordono**: se no bastava stargli addosso per annullarli. Lo **scatto strappa la tela** (chi
scatta non e' rallentato), il rallentamento **si spegne poco dopo che ne sei uscito** — la tela e' un
posto, non una maledizione — e c'e' un **tetto di 14 tele** in campo perche' tre ragni per due minuti
d'ondata coprirebbero mezza stanza. Le tele spariscono col cambio mappa.

### 🐛 Larva Fetida
Corre addosso come uno zombi e da sola fa poco male: il punto e' la sua morte. Quando cade lascia a terra
il cerchio telegrafato delle zone, che detona dopo **3 s** su **104 px** per **2,4x il suo danno**. Chi
arretra di un passo non prende niente. Le zone fanno male ai giocatori e non ai mostri: niente catene.

---

## 🚫 NIENTE CURE DALLE ABILITA', DALLE ARMI E DALLE ARMATURE *(regola, v1.93)*

**Nessuna carta, sinergia, specializzazione, patto o pezzo di equipaggiamento rimette un solo PV.**
Non e' una taratura, e' una regola: rimettersi in piedi deve costare qualcosa che si vede — monete,
una carica di pozione, un giro dall'Ostessa. Una cura che arriva da sola mentre picchi cancella tutte
e tre le cose insieme.

Che cosa e' stato tolto in v1.93:

| | Cosa faceva |
|---|---|
| 🩸 **Vampirismo** (carta rara, guerriero) | +9% del danno inflitto ti curava |
| 🩸 **Sete di Sangue** (sinergia) | +6% di cura dal danno inflitto, sopra al Vampirismo |
| 🩸 **Patto Sanguinario** (Mercante Nero) | +10% di vampirismo per 70 monete |
| ✨ **Aura del Paladino** (rango V) | curava i compagni nel cerchio, 2% dei PV massimi al secondo |
| ➕ **Vigore** (buff) | 8 PV/s per 10 s |
| `stats.lifesteal`, `stats.regen` | **i due campi del motore**: tolti, non azzerati |

Quei due campi sono il punto. Finche' `lifesteal` esiste fra le statistiche, prima o poi qualcosa lo
riempie — ed e' esattamente cosi' che la cura era tornata. Adesso non c'e' proprio il posto dove metterla.

Al posto di Vampirismo, perche' la griglia e' **2 carte per classe e per rarita'**: 🛡 **Presa Salda**
(+60% rinculo dei tuoi colpi, -6% ai danni subiti), e la sinergia con Adrenalina Pura diventa
🛡 **Muro d'Acciaio** (-6% in piu' ai danni subiti). Premiano lo stesso mestiere — stare in mezzo — senza
restituire vita.

**Il test 64 la impone.** Non controlla i nomi: prende **tutte** le carte, tutti i ranghi, tutti i patti e
tutti i pezzi di equipaggiamento, e li prova uno per uno **giocando** — mezza vita, cinque secondi di colpi
su un bersaglio eterno. Se i PV salgono di uno, il test fallisce e dice quale. Vale anche per la carta che
verra' aggiunta domani.

### Chi cura ancora, e a che prezzo

| | Prezzo |
|---|---|
| 🍺 **Ostessa** | monete, al villaggio |
| ❤️ **Pozione di Cura** e ➕ **Rigenerazione** | una carica della cintura, comprata dall'Erborista |
| 🩹 **Bende del Viandante** | 45 monete dal Mercante Errante |
| ❤️ **Pozione di Salute** a terra | va raccolta |
| 🔥 **Combo di 40** | +25% PV: va costruita una catena di quaranta uccisioni |
| ⏳ **Ultima Occasione** (carta divina) | non cura: invece di cadere, risorgi a meta' vita. Due volte |

---

## 📖 LA STORIA *(v2.7 · testo riscritto e l’oracolo in v2.9)*

Fino alla v2.6 la partita cominciava con l'ondata 1: apparivi in una grotta e ti venivano addosso. Il boss
dell'ondata 20 — AZ'GAROTH — esisteva da sempre e **non lo nominava nessuno**. Quello era il buco.

Adesso la partita comincia con uno che **si sveglia**.

### 🛏️ La tua stanza

Fase nuova (`PHASE_PROLOGO`), mappa nuova (`generatePrologo`): **20x14**, assi per terra, muri di
**conci**, un letto, una cassapanca, un tavolo, una lanterna accesa sul comodino. E in mezzo, dove ieri
c'era il pavimento, un **portale**.

*(Nella v2.7 era una cella di roccia, e non reggeva quello che dice il testo: il personaggio si sveglia e
chiede «perche' si e' aperto un portale nella mia stanza». Con la roccia viva attorno quella frase non
sta in piedi.)*

**Non ha uscite, ed e' voluto**: e' una camera da letto, non un livello. Se ci fosse una porta uno
proverebbe ad aprirla, e il primo minuto di gioco diventerebbe una caccia alla maniglia. Niente nemici,
niente casse, niente mercanti: c'e' un portale, e non c'e' nient'altro da fare che andarci.

Dichiara `lit` — che non vuol dire "illuminata" ma *il buio lo fanno le **sorgenti** invece del campo
visivo*. Le sorgenti sono due: la lanterna e il portale. E' notte.

### 🖼️ Il riquadro del dialogo

Un **riquadro al centro dello schermo**, opaco, bordato d'oro, con dentro il **ritratto** di chi parla.

*(Nella v2.7 era una striscia in basso col testo sopra uno sfondo sfumato: elegante e illeggibile. Su un
pavimento chiaro le lettere sparivano, e comunque durante il gioco l'occhio sta al centro.)*

I ritratti sono disegnati a codice come tutto il resto — zero asset:

| Chi | Come lo riconosci |
|---|---|
| **Guerriero** | elmo con la feritoia, e due occhi che brillano dentro |
| **Mago** | cappello a punta con la stella, barba |
| **Ladro** | cappuccio calato, fazzoletto sul viso |
| **Oracolo** | corna, cappuccio, barba bianca |
| **Guardia** *(v2.9.2)* | elmo **aperto** col nasale e la borchia d'ottone, bocca dritta — l'elmo del guerriero e' chiuso e ha la feritoia: li' dentro non c'e' nessuno da guardare negli occhi, e per un eroe va bene. Una guardia invece deve poterti guardare **male** |
| *la voce del risveglio* | **nessun ritratto** — ed e' la scena, non una mancanza |

Sono di **fronte**, non dall'alto: una testa vista dall'alto dentro un riquadro di dialogo non si legge
come una faccia. E semplici apposta — ottanta pixel non reggono i dettagli, quello che li fa riconoscere
e' la **silhouette**.

**Mentre parla qualcuno non ci si muove**, e il blocco sta sul **server** (`setInput`): il client puo'
anche smettere di mandare i comandi, ma quello che decide dove sta un giocatore e' il server. Si ferma il
movimento e tutto quello che si fa con le mani; la mira no, quella non sposta niente.

### 🎁 E la schermata di fine ondata lo dice *(v2.8.1)*

Una rivelazione che spiega una regola vale solo se **la regola poi la dice anche l'interfaccia**. Dopo il
colpo di scena la schermata fra un'ondata e l'altra affermava il contrario: *«PUNTI — dove metti quello che
hai imparato»*. Lui non impara niente: riceve.

| Dove | Prima | Adesso |
|---|---|---|
| Cornice del riepilogo | — | *Statistiche della partita* |
| Titolo dei punti | dove metti quello che hai imparato | **cosa gli concedi** |
| Sotto | — | *Non impara: riceve. Ogni punto che spendi qui è una cosa che tu gli dai.* |
| Carta a fine ondata | 🎴 SCEGLI UN'ABILITÀ | **🎴 CONCEDIGLI UN'ABILITÀ** · *Dona al tuo avatar una nuova abilità* |
| Elenco delle carte | LE TUE ABILITÀ | **I poteri che hai concesso all'avatar** |
| Rango | — | *Le tue azioni hanno permesso al tuo avatar di salire di livello* |
| Emporio | — | *Le monete sono sue: questo se lo compra da solo.* |
| Sotto il pulsante | — | *Prosegui* |

**Il patto per esteso si legge una volta sola**, a fine ondata 1. Queste righe si rileggono venti volte, e
la letteratura letta venti volte stanca: dalla seconda in poi restano solo quelle corte.

E l'invito a donare compare **solo se c'e' davvero qualcosa da dare**: con la scelta chiusa il titolo
diventa *«nessuna scelta questa volta»*, e sotto restava un invito a fare una cosa impossibile — che e'
peggio di nessun testo.

L'unica cosa in tutta la schermata che **non** passa dalla divinita' sono le **monete**: quelle se le
guadagna lui, e dirlo serve a far capire perche' ci sono due monete diverse.

### 🎭 Il colpo di scena

Il discorso dell’oracolo e' un **dialogo**: l'avatar non capisce e continua a chiedere, ed e' giusto —
e' lui il posseduto, non l'informato.

> **TU** — Diverso come?
> **ORACOLO** — Sei stato scelto.
> **TU** — Da chi?
> **ORACOLO** — *(pausa)* Da qualcuno che non vive in questo mondo.
> **ORACOLO** — *(pausa)* Un Dio.
> …
> **TU** — Ma chi e'?
> **ORACOLO** — *(pausa)* Non lo hai ancora capito?
> **ORACOLO** — *(pausa)* E' quello che tiene gli occhi su di te in questo momento.
> **TU** — …

**Non e' «l'eroe sei tu»: e' «sei lo strumento di un Dio, e il Dio e' chi tiene il mouse».** La
differenza non e' di gusto: la seconda versione **spiega una regola**. Le carte potere che arrivano a
fine ondata sono i doni della divinita' — *«Avrai bisogno dei suoi poteri per arrivare in fondo.»*

*(v2.9 — la rivelazione non pronuncia piu' la parola **schermo**. Indicare lo schermo e' spiegare la
battuta: *«tiene gli occhi su di te in questo momento»* dice la stessa cosa e lascia al giocatore l'ultimo
passo. Il test adesso pretende **divinita'**, **ti sta guardando**, **poteri**.)*

Una rivelazione che spiega una regola vale dieci rivelazioni che strizzano l'occhio, e quelle tre cose
devono restare nel testo anche se un domani lo si riscrive da capo.

### 🕯️ (v2.7) La scena del risveglio

Fase nuova (`PHASE_PROLOGO`), mappa nuova (`generatePrologo`): **22x16**, una sala sola, quasi nera, con
una **faglia viola** in mezzo e un braciere mezzo spento accanto al giaciglio.

**Piccola e senza svolte, apposta.** Se ci fosse un corridoio uno lo esplorerebbe, e il primo minuto di
gioco diventerebbe una caccia al tesoro al buio. Niente nemici, niente casse, niente mercanti: c'e' una
faglia, e non c'e' nient'altro da fare che andarci.

Dichiara `lit` come il villaggio — che non vuol dire "illuminata" ma *il buio lo fanno le **sorgenti**
invece del campo visivo*. Di sorgenti ce ne sono due: il braciere e la faglia. E la barra in cima sparisce:
"ONDATA 0/20 · NEMICI 0" sopra il risveglio dice al giocatore che sta giocando a un gioco a ondate prima
ancora che il gioco gli abbia detto dov'e'.

### 🗣️ Il registro: secco

Frasi corte, nessuna spiegazione. Chi parla sa piu' di quello che dice e non ha nessuna intenzione di dirlo
tutto. Niente *«o valoroso eroe»*, niente profezie recitate, niente aggettivi in fila.

> **TU** — *«Cos'e' quella luce?»* · *«No…»* · *«C'e' un portale. Nella mia stanza.»*
> **VOCE** — *«Non temere.»*
> **TU** — *«Chi sei?»*
> **VOCE** — *«Qualcuno che ti sta aspettando.»*
> **TU** — *«E perche' dovrei attraversarlo?»*
> **VOCE** — *«Perche' e' gia' troppo tardi per tornare indietro.»*
> **TU** — *«Non hai ancora risposto.»*
> **VOCE** — *«Attraversa. Le risposte sono dall'altra parte.»*

**La voce non si presenta mai, e `chi: ''` non e' una dimenticanza: e' il punto.** E' l’oracolo, e il
giocatore lo scopre solo quando gli parla: al villaggio la stessa voce dice *«Eccoti. Ora vieni da me»*, e
la casa con le ossa appese e' la sua.

Se uno gira invece di entrare, la voce insiste **una volta sola** e poi tace — *«Non e' la finestra.»* —
perche' insistere la trasformerebbe in un tutorial.

### 🧿 L’oracolo

*(In v2.6 era la **cartomante**, in v2.7-2.8 lo **sciamano**. Dalla v2.9 e' l'**oracolo**: stesso antro,
stessa casa con le ossa appese, stesso ritratto — corna, cappuccio, barba. Il nome sta in `mapgen` come
`kind: 'oracolo'` e da li' lo leggono renderer, HUD e server: uno solo, non cinque.)*

Si arriva al villaggio all'**ondata 0** con la missione in evidenza — **«Trova l'oracolo · Villaggio, la
casa con le ossa appese»**. Avvicinandosi parte il discorso, ed e' li' che il gioco dice di cosa parla:
sotto il villaggio dorme una cosa che non avrebbe mai dovuto svegliarsi, si chiama **AZ'GAROTH**, e le
**venti fratture** sono la strada per arrivarci. *«Poi scopriremo se il Dio ha scelto bene.»*

Dopo, la missione diventa **"Scendi fino ad AZ'GAROTH"**, e dal villaggio d'apertura la faglia porta
**all'ondata 1** invece che al menu di fine ondata: all'ondata 0 non c'e' nessun menu a cui tornare.

**Tornandogli davanti** non ripete il discorso: dalla v2.9 dice un **congedo** di cinque righe
(`oracoloAncora`) che si chiude con l'unico dubbio di tutto il racconto — *«Il resto… lo decide lui. O
forse lo decidi tu.»* Fino alla v2.8 era **una riga sola** sparata al singolo giocatore: non si vedeva in
due, non si saltava, non bloccava i piedi. Adesso e' una scena come le altre.

All'inizio dell'ondata 20 una riga sola chiude il cerchio: *«E' sotto di te. Non sa che esisti, e per ora
e' l'unico vantaggio che abbiamo.»*

### 💬 I sottotitoli si scrivono

Nel riquadro al centro, le lettere **una alla volta** (34 ms l'una). **Non e' un vezzo**: una riga che
appare tutta insieme si legge in un colpo d'occhio e si preme subito, e la voce non ha il tempo di essere
una voce. Le lettere che arrivano danno il ritmo del parlato, ed e' quello che fa la differenza fra un
dialogo e una didascalia.

### ⏸️ E ogni tanto tacciono *(v2.9)*

Il copione dell'oracolo ha delle **didascalie**: *«Pausa.»*, *«l'oracolo osserva il giocatore per qualche
istante»*, *«sorride appena»*. Stamparle a schermo sarebbe l'errore piu' facile del mondo — una didascalia
**dice** al giocatore cosa dovrebbe provare, e dirglielo e' il modo piu' sicuro perche' non lo provi.

Quindi non si scrivono: si **sentono**. Una riga marcata `p: 1` in `storia.js` resta **900 ms in silenzio**
col volto gia' a schermo e il cursore che lampeggia, e solo dopo comincia a scriversi. Otto righe del
discorso sono marcate cosi', e sono esattamente le tre rivelazioni e i loro appoggi: *«Da qualcuno che non
vive in questo mondo.»* · *«Un Dio.»* · *«E ti sta guidando.»* · *«Non lo hai ancora capito?»*

Tecnicamente la pausa e' un **`t0` spostato in avanti**, non un `setTimeout`: cosi' e' lo stesso orologio
che governa le lettere, e lo Spazio che ha fretta la salta senza dover anche spegnere un timer. L'unica
trappola e' che durante la pausa il contatore delle lettere e' **negativo**, e `slice(0, -3)` taglierebbe
dalla *fine*: si tiene a zero, se no la riga comparirebbe a pezzi al contrario.

**Il gioco non si ferma mai**: si continua a vedere il personaggio e la mappa. E' una voce fuori campo, non
un filmato.

| Tasto | Cosa fa |
|---|---|
| **Spazio** | continua — ma il **primo** Spazio *finisce la riga* invece di passarla: chi ha gia' letto non aspetta |
| **Esc** | salta la scena |
| *(niente)* | dopo 5,5 s la riga passa da sola: chi legge piano non deve premere niente |

**Saltare salta la SCENA, non la partita.** Si arriva al villaggio lo stesso, la missione cambia lo stesso,
si scende lo stesso. E' l'errore facile — "salta il filmato" che diventa "salta il gioco" — ed e' coperto
da un test suo.

**In due o piu' il dialogo lo fa scorrere chi ha aperto la stanza**, gli altri leggono. Se dovessero premere
tutti, ogni riga diventerebbe l'attesa dell'ultimo distratto. A chi non comanda il suggerimento dei tasti
non si mostra nemmeno: dirgli "premi Spazio" sarebbe una bugia, e le bugie dell'interfaccia si pagano in
fiducia.

### 📜 Dove sta il testo, e perche' li'

Tutto in **`shared/storia.js`**, UMD come il resto. Il testo si riscrive dieci volte prima di suonare
giusto, e riscriverlo dentro il codice del server vuol dire rileggere la logica ogni volta per trovare la
riga. Il nome del boss e il numero delle ondate stanno li' dentro pure: la storia li pronuncia, e se un
domani cambiano devono cambiare in un posto solo.

### 🔌 Le tre scelte tecniche che valgono una riga

1. **La riga corrente sta sul SERVER** e viaggia nello snapshot (due campi). Poteva stare sul client e
   costare zero banda: ma in due schermi diversi le due voci andrebbero per conto loro, e chi entra a meta'
   scena non vedrebbe niente.
2. **Il client rincorre lo snapshot**, non reagisce a un evento. Un evento si perde (scheda in secondo
   piano, ingresso a meta'); lo snapshot no. E se la riga e' gia' quella giusta non fa niente — se no la
   riscriverebbe venti volte al secondo.
3. **`startGame(da, senzaStoria)`**: la suite fa partire una cinquantina di partite per misurare ondate,
   bilanciamento e collisioni. Farle passare tutte dal risveglio vorrebbe dire provare cinquanta volte il
   prologo e zero volte quello che si voleva provare. L'uscita e' dichiarata **in un posto solo**, in cima
   a `test/simulate.js`; il gioco chiama `startGame()` e il prologo c'e'.

---

## 🛡️ LE GUARDIE DEL VILLAGGIO — TOLTE *(provate in v2.9.2, rimosse in v2.9.3)*

> ❌ **NON C'E' PIU'.** Nel villaggio si puo' attaccare come prima, e non succede niente. Il testo delle tre
> scene (`guardia1/2/3` in `storia.js`), il ritratto della guardia nell'HUD e i due numeri in `constants.js`
> sono rimasti nel progetto, ma **non li legge nessuno**.

L'idea era: se attacchi nel villaggio il gioco si ferma, una guardia ti avvisa, alla terza volta la run
finisce. Ha funzionato nei test e si e' rivelata **ingiocabile** al primo minuto vero. Vale la pena scrivere
perche', perche' e' un errore che si rifa' identico.

### 💥 Il motivo: **Spazio spara**

In `public/js/input.js` l'attacco e':

```js
const shoot = this.mouse.down || !!this.keys['Space'];
```

E **Spazio e' anche il tasto che fa scorrere i dialoghi**. Quindi ogni Spazio premuto per leggere la
ramanzina della guardia era, nel tick dopo la chiusura del riquadro, **un attacco nuovo**: la guardia
ripartiva, il giocatore premeva Spazio per leggerla, e cosi' all'infinito. La partita si piantava.

### 🔍 E perche' i test non l'hanno visto

Questa e' la parte che conta. C'erano nove controlli sul server e una prova nel browser, e **sono passati
tutti**:

- I **test sul server** chiamavano `setInput` a mano, quindi «premere Spazio per continuare» e «premere
  Spazio per sparare» erano due cose scollegate: nella simulazione il legame che ha rotto il gioco **non
  esisteva proprio**.
- La **prova nel browser** guidava i tre avvertimenti e verificava che comparissero *nell'ordine giusto*.
  Comparivano — ma non per i clic che credevo: erano gli Spazio dello script a far ripartire la guardia.
  **Il test verificava l'effetto e non la causa**, quindi il bug lo ha attraversato senza toccarlo.

La lezione, in una riga: *un test che guarda solo se la cosa giusta e' comparsa non sa dire se e' comparsa
per il motivo giusto.*

### 🔧 Cosa servirebbe per rifarla

Prima **separare le due cose**, e sono due strade sole:

1. l'attacco non sta piu' su Spazio (ma Spazio spara dalla prima versione, e cambiarlo tocca tutti);
2. il colpo che chiude un dialogo **non conta come colpo** — cioe' dopo `storia_fine` l'attacco resta
   disarmato finche' il giocatore non rilascia *e ripreme*.

La seconda e' quella giusta, ed e' piccola. Ma va provata **con una prova che parta dai tasti veri**, non
da `setInput`.

---

## 🏘️ IL VILLAGGIO SOTTERRANEO *(pianta rifatta in v2.6)*

> La sezione che segue descrive la pianta della **v2.0** ed e' **superata**: la trovi qui sotto perche' il
> ragionamento sulle porte e sulle strade vale ancora. La pianta viva e' questa.

Fino alla v2.5 il villaggio era 56x40: una sala grande con le stanze appese dove capitava. Si leggeva come
un **livello**, non come un paese. La v2.6 lo ricostruisce su un'idea sola — quella che rende un villaggio
riconoscibile a colpo d'occhio dall'alto: **due file di case che si guardano**, e in mezzo lo spazio comune.

```
 x:  0..2   rocce          3..16  fila di PONENTE      17..19  via di ponente
    20..39  lo spiazzo (e dentro, la PIAZZA di terra)  40..42  via di levante
    43..56  fila di LEVANTE                            57..59  rocce
```

**60x46 tessere**, tredici edifici:

| Dove | Cosa |
|---|---|
| **Fila di ponente** | casa del portale · **osteria** · **fucina** · due case |
| **Fila di levante** | **erboristeria** · **antro dell’oracolo** · **gilda** · due case |
| **Nello spiazzo** | una casa a settentrione, due a mezzogiorno |
| **Al centro** | la **piazza**: 16x18 di terra battuta, il falo' nel mezzo, il pozzo di fianco |
| **Attorno alla piazza** | **dodici torce** e **dodici bancarelle**, alternate, girate verso il centro |
| **Le strade** | le due **vie lunghe** davanti alle porte delle file, la via alta e la via bassa a chiudere |
| **Oltre** | la roccia delle grotte, e poi il nero: non c'e' un bordo mappa, c'e' la montagna |

### 🪨 Fuori e' grotta, dentro e' casa

Il villaggio aveva una tavolozza sua — pietra calda — e si vedeva: una **sala beige** con dentro delle case,
mentre tutto il resto del gioco e' roccia fredda. Adesso il tema e' quello della **cripta** e la cottura e'
la **stessa delle ondate** (`_bakeCaverna`): massi tondi, ombre proiettate, contrasto vero.

Il `muri` del villaggio non e' la griglia — la griglia dice solo passa/non passa — dice **di che cosa** e'
fatto ogni muro, e lo legge solo chi disegna:

- **2 = concio**, pietra squadrata: le pareti delle case;
- **0 = roccia di grotta**: il perimetro del paese e la massa in cui e' scavato.

Il giro esterno non ha **un solo concio**: fuori dal villaggio c'e' la montagna, non una cinta muraria. E
**dentro le case il pavimento resta quello di prima** — assi, lastre, terra: e' li' che si sta al caldo.

### 🟫 La piazza: terra battuta, col bordo sfrangiato

Il primo battuto era una tinta al 58% con dieci trattini scuri sopra. Sotto la luce diventava una **lastra
di grigio uniforme** — la stessa cosa che chiamavamo patina, perche' **mancava il nero**. Il battuto ha
bisogno di tre cose: chiazze piu' scure (la terra non e' omogenea), **ghiaia chiara E scura** (solo scura e'
fuliggine) e un solco ogni tanto.

E il bordo non e' dritto. Era un rettangolo pieno, e da lassu' si leggeva come un **tappeto srotolato sulla
roccia**: una piazza si consuma dove ci si cammina. Il giro si allarga di una tessera e si copre in modo
irregolare — piena dentro, a chiazze sull'orlo, qualche macchia fuori.

### 🌀 Il portale sta nella casa delle guardie

Stava **in mezzo alla piazza**, ed era il difetto piu' grosso della vecchia pianta: uno spiazzo con un buco
viola nel centro non e' una piazza, e' una **sala del portale con delle case attorno**. Adesso e' dentro la
casa del portale, la prima della fila di ponente, con **due guardie sulla soglia** — elmo con la cresta,
fessura per gli occhi, lancia piantata a terra; scenografia, non mercanti.

Dallo spawn sono **una quindicina di tessere**, tre secondi e mezzo di cammino. Il vincolo del test non e'
un gusto ma il tempo: sotto le 8 tessere ci si atterrerebbe sopra, sopra le 20 diventerebbe una tassa.

### 💡 Piazza chiara, resto buio

`VILL_PIAZZA: 0.60` · `VILL_PZ_ORLO: 1.4`. Dentro il rettangolo della piazza il buio di base vale meno, e
fra i due si passa **sfumando** per qualche tessera. **Non e' una luce appoggiata sopra** — quella sarebbe
di nuovo una patina — e' buio che si toglie, con lo stesso `destination-out` delle sorgenti. Ed e' un
**ovale**, non un rettangolo: un alone quadrato con gli spigoli si legge come una finestra.

Il falo' e' sceso da **430 a 340** di raggio. Con la vecchia sala calda era la luce della stanza; sul
pavimento freddo della grotta era diventato un alone bianco largo mezzo schermo.

### 🚪 La porta e' un DATO della stanza, non una deduzione

Ogni stanza dichiara `porta: [tessera x, tessera y, lato]` e i varchi si generano da li'. Prima la porta si
indovinava confrontando le coordinate dei varchi con quelle della stanza, e **bastava spostare una stanza**
per far arredare una casa **col letto sulla soglia**. Adesso l'arredamento sa da che parte si entra senza
doverlo dedurre — e ogni varco e' largo **due tessere**, sempre.

### 🩶 La patina era uno SFASAMENTO

Il buio si bucava con un raggio e il bagliore caldo si disegnava con un **altro**: l'alone dell'eroe usciva
a 190x1,45 = **275 px** dentro un buco di **130**. Quei 145 px di differenza sono luce appoggiata sul buio,
cioe' esattamente una patina — e ti seguiva, perche' l'eroe sei tu.

**Il rimedio non e' limare un numero: e' che i due passaggi leggano LA STESSA LISTA.** Le sorgenti del
villaggio si dichiarano una volta sola — `[x, y, raggio, colore, alfa, forza]` — si bucano con quel raggio e
si accendono con lo stesso. *Nessun bagliore senza il suo buco, nessun buco piu' piccolo del suo bagliore*,
e il test verifica proprio questo.

Piu' due colpevoli minori, trovati guardando **quello che non avevo toccato**: la cottura piatta del
villaggio e la fascia viola della faglia, spenta a schermo dalla v2.1 ma ancora **cotta** sui bordi.

**Misurato**: 5880 posizioni libere a mezza tessera, **zero isolate** coi mobili al loro posto. Tutte e
tredici le stanze raggiungibili, ogni mercante avvicinabile, il portale compreso.

---

## 🏘️ LA VECCHIA PIANTA *(v2.0 — superata dalla v2.6, tenuta per il ragionamento)*

Fino alla v1.99 la sosta era una **Sala dei Mercanti**: 34x26 tessere, cinque stanze attorno a una piazza.
Funzionava, ma non era un posto: era un menu con dei muri. Adesso e' un **villaggio di nani scavato nella
roccia**, 56x40 — il doppio abbondante — e la differenza non e' la dimensione: e' che qui **ci vive
qualcuno**.

| Pezzo | Cosa c'e' |
|---|---|
| **La piazza** | 13x11 al centro, col **pozzo** e il falo'. Nel suo centro esatto: **il portale** |
| **Le tre botteghe grandi** | osteria, fucina, erboristeria — 12x9 ciascuna, edifici separati |
| **Le due piccole** | l'antro della cartomante e la gilda del capitano |
| **Sette case abitate** | porta aperta, focolare acceso in mezzo, letto, tavolo, madia, e la gente dentro |
| **Le strade** | la via alta sotto le botteghe, la via bassa davanti alle case, la **via maestra** che taglia tutto da nord a sud passando per la piazza |
| **Oltre** | roccia, e poi il nero: non c'e' un bordo mappa, c'e' la montagna |

**Le tre regole della pianta**, da rispettare se un giorno la si allarga:
1. **Il portale sta al centro.** Non e' una porta in fondo a un corridoio: e' la prima cosa che vedi
   arrivando e l'ultima che tocchi andando via.
2. **Ogni porta e' larga due tessere.** Il personaggio e' largo 35 px su tessere da 48: con una sola tessera
   ci si passa sfregando lo stipite (imparato nella v1.75.1).
3. **Fra una stanza e la sua strada resta una riga di roccia.** E' li' che si apre la porta. Senza, il lato
   della casa e' tutto aperto e non e' piu' una casa.

**Le strade non sono corridoi da una porta all'altra**: attraversano il paese da parte a parte, e le botteghe
e le case si aprono su quelle. E' la differenza fra un villaggio e un corridoio con delle stanze.

**Misurato**: 1213 tessere calpestabili, connesse al 100%, e — la misura che conta, perche' dalla v1.75.2 i
mobili hanno un corpo — **il 99,9% raggiungibile coi mobili al loro posto**. Ogni bottega, ogni casa, ogni
mercante e il portale si raggiungono a piedi.

### 🔥 Le case

Sette, e tutte arredate dalla **stessa funzione**. Una casa di nani ha sempre le stesse quattro cose — il
focolare in mezzo (e' la ragione per cui la stanza esiste), il letto contro la parete lontana dalla porta, il
tavolo dall'altra parte, la madia contro un muro — e a cambiare e' solo il verso. Piazzarle a mano sette volte
avrebbe prodotto sette errori diversi; cosi' l'errore, se c'e', e' uno solo e si corregge una volta.

**L'unica regola dura: la colonna della porta resta sgombra.** Un tavolo sulla soglia e' una casa in cui non
si entra.

Ma sette case uguali sarebbero sette volte la stessa casa, quindi **a decidere e' l'indice della casa**, non
il caso (nel villaggio il seme non cambia niente, e la pianta dev'essere sempre quella): il verso si
specchia, **una su tre ha due letti** — e' una famiglia — una su quattro la rastrelliera degli attrezzi,
un'altra lo scaffale, una su cinque un tappeto davanti al fuoco. Risultato: **cinque arredamenti diversi su
sette**.

Il **focolare e' una sorgente di luce viva**, come il falo': la pietra e le braci si cuociono nella mappa, la
fiamma no. E' quella luce che esce dalla porta aperta a dire, da fuori, che la casa e' abitata.

### 🧍 Gli abitanti

Ventidue, e **fanno qualcosa**: chi si scalda al fuoco e dondola, chi **martella**, chi **rimesta** la
pentola, chi si guarda attorno, chi va e viene per la strada. Il movimento e' **piccolo apposta** — deve
leggersi con la coda dell'occhio mentre compri, non rubare la scena — e il loro **corpo resta fermo** dov'e',
se no ci si passerebbe attraverso mentre ondeggiano. Stanno tutti **in piedi**: dall'alto una figura seduta
non si legge (regola della v1.75).

### 💡 La luce *(v2.0.2 — l'unica mappa illuminata del gioco)*

Il villaggio nasceva al buio come tutto il resto: il falo' della piazza, i sette focolari e gli aloni dei
mercanti, e attorno il nero. Bastava a 34x26; su 56x40 non vedevi dove fossero le botteghe.

**La causa non erano le poche torce.** Su ogni mappa il gioco stende un velo scuro attorno al giocatore
(`_drawLighting`), e su una mappa larga quel velo lascia nere le strade. Nelle ondate quel velo *e'* il
gioco — non sai cosa c'e' dietro l'angolo. In una sosta non serve a niente.

Quindi nel villaggio il velo **non si stende**. La pianta dichiara `lit: 1`, e:

| | |
|---|---|
| **Chi lo dichiara** | solo `generateMarket`. Nessuna mappa di combattimento ha `lit` |
| **Chi lo legge** | il renderer, da quella bandiera — non dal tipo di mappa |
| **Cosa cambia** | niente campo visivo ne ombre dai muri. Il villaggio e **buio** (`VILL_BUIO: 0.90`) e la luce la fanno **solo le sorgenti**, che ci scavano dentro i loro buchi |
| **Il tasto L** | il cono torcia non rimette al buio il villaggio |

*Se un giorno si aggiunge un'altra mappa illuminata, si aggiunge `lit` a quella pianta e basta. Ma le ondate
non devono averlo: meta' della loro tensione e' il velo.*

### La patina, e perche non era un problema di numeri *(v2.4)*

Dalla v2.2 alla v2.3 sopra al villaggio c'era una **velatura**: un rettangolo semitrasparente steso su
tutto. Piu la si caricava (0,18 → 0,26 → 0,55) e piu si vedeva per quello che era.

**Un velo uniforme non scurisce: SBIANCA.** Schiarisce i neri esattamente quanto spegne i chiari, quindi
comprime tutto verso il grigio — ed e per questo che sembrava una pellicola appoggiata sul disegno invece
di un posto buio. *Il difetto non era il valore: era il metodo.*

Adesso il villaggio e **quasi nero** e la luce la fanno **solo le sorgenti**, che ci scavano dentro i loro
buchi. E lo **stesso meccanismo del campo visivo delle grotte** — una tela a parte, si cancella, si sfoca,
si appoggia — applicato alle sorgenti invece che alla vista. La differenza e tutta qui: **la si aggiungeva
grigio, qui si toglie buio**.

| Sorgente | Raggio base | Nel villaggio (x1,45) |
|---|---|---|
| falo della piazza | 430 | **624** |
| focolare di casa | 200 | **290** |
| braciere / candelabro | 120 | **174** |
| alone del mercante | 100 | **145** |
| lanterna di un girovago | 104 | **151** |
| il portale | 220 | **319** |
| e il cerchietto che ti porti dietro | — | **130** (`VILL_EROE`) |

**Il numero da non sbagliare.** `VILL_LUCE` moltiplica il RAGGIO, e l'area va col quadrato: "area doppia" e
**radice di due** (1,45), non due. Col raggio raddoppiato l'area e quadrupla, e al primo tentativo il
villaggio si e acceso tutto — le pozze si sovrapponevano e del buio non restava niente. Il test pretende
che `K*K` sia vicino a 2.

Il moltiplicatore vale **anche per il colore caldo** degli aloni, non solo per il buco nel buio: se
crescesse solo il buco resterebbe un alone grigio con un puntino caldo in mezzo. Sta in un posto solo
(`KL`), e fuori dal villaggio vale 1.

Tolto il velo sono servite altre due cose. La **tavolozza** del villaggio era tarata per essere guardata
attraverso il velo (pavimento `#1c1813`, roccia `#050607`): senza, era una macchia marrone quasi nera —
adesso sono i colori di una sala scavata e illuminata a fuoco, con la roccia comunque molto piu' scura del
pavimento, se no il muro non si legge piu' come muro. E **fuori dai bordi della mappa** si vedeva il fondo
viola della pagina, che prima il buio copriva: adesso si riempie di roccia, perche' fuori dal paese c'e' la
montagna, non il vuoto.

*(Nella v2.0.1 avevo provato la strada opposta — 57 torce a muro, bracieri e lanterne — e non funzionava:
erano una tappezzeria di fiammelle messa li' a combattere un velo che bastava togliere. Rimosse.)*

### 🚶 I girovaghi *(v2.3)*

Gli abitanti della v2.0 stanno **fermi**, ognuno al suo posto con un mestiere in corso: davano vita alle
stanze ma non alle strade, e un paese in cui nessuno cammina non e un paese. Adesso ci sono **dieci
girovaghi** che percorrono le vie.

| Dove | Chi |
|---|---|
| **Via alta** | due corsie in versi opposti, piu uno che fa un tratto corto |
| **Via bassa** | due corsie, davanti alle case |
| **Via maestra** | una sola corsia, quella di ponente |
| **Piazza** | due che **girano in tondo attorno al portale** |
| **I vicoli** | due che vanno e vengono dalla fucina e dalla gilda |

**Non si muovono: sono una funzione del tempo.** Ognuno ha una rotta (una polilinea che segue le strade) e
la sua posizione si calcola dal `tick` della partita. Tre conseguenze, tutte volute:

- il **server non manda niente**: zero banda, zero codice di movimento;
- **tutti i giocatori li vedono nello stesso punto**, perche il tempo della partita e lo stesso;
- chi entra a meta sosta li trova dove devono essere, **senza nessuna sincronizzazione**.

Camminano, si fermano al capolinea, si guardano attorno e tornano indietro; quelli dell'anello girano e
basta.

**Non hanno un corpo solido, e non e una dimenticanza.** Il corpo lo calcola il server dalle posizioni, e
qui le posizioni non esistono — esiste una formula. Un corpo fermo sotto una persona che cammina sarebbe
peggio di nessun corpo: ci sbatteresti contro il vuoto. Sono scenografia, e ci si passa attraverso; i
mercanti e la gente ferma il corpo ce l'hanno.

**La lanterna.** Col villaggio buio (v2.3) chi cammina diventava una sagoma nera: la vita c'era e non si
vedeva. Ognuno se la porta dietro, ed e anche il motivo per cui le strade si leggono.

*Se un domani si aggiunge una rotta: deve stare sulle strade. Li dentro non c'e nessun controllo sui muri —
non serve, se la rotta e fatta bene, e costerebbe a ogni fotogramma. Il test lo verifica campionando ogni
12 px.*

### 🩶 La patina vera era la nebbia *(v2.5)*

Con la v2.4 il velo era sparito e il villaggio restava **appannato lo stesso**. Il difetto non stava dove lo
cercavo: `_drawFog` stende sull'inquadratura **quattordici macchie grigio-azzurre** (`rgba(150,160,185)`) a
**ogni fotogramma**, e quelle non le aveva toccate nessuno. Nelle grotte ci vogliono — sono l'aria umida del
sottosuolo — ma sopra un paese illuminato a fuoco sono esattamente quello che si vedeva: una pellicola.

Adesso la nebbia sta dietro una guardia sola:

```js
if (!this.map.lit) this._drawFog(ctx, camX, camY, dt);
```

**La lezione vale piu' della riga.** Avevo tolto la velatura e dichiarato chiuso il problema senza guardare
*che altro* dipingeva sopra la stessa mappa. Quando si rimuove una cosa si controlla anche **quello che non
si e' toccato**, se no si consegna meta' del difetto. Il test pretende due cose: che la guardia ci sia, e che
`_drawFog` si chiami **da un posto solo** — con due punti di chiamata la guardia servirebbe a poco.

### 🧰 Le bancarelle di contorno *(v2.5)*

Cinque negozi usabili e sette case non fanno un villaggio: fanno un menu con delle stanze attorno. Sulle due
vie ci sono ora **sei bancarelle** che non si possono usare — e' il loro mestiere non servire a niente.

| Banco | Colore | Merce disegnata |
|---|---|---|
| **PANE** | `#d9a55c` | pagnotte e ceste |
| **CARNE** | `#b04a48` | tagli appesi al telaio |
| **PESCE** | `#8fb6c8` | pesci in fila sul ghiaccio |
| **VASI** | `#a4703e` | orci e anfore |
| **TESSUTI** | `#7a6bb0` | pezze arrotolate |
| **CANDELE** | `#e8d08a` | candele a file |

Ognuna ha tendone a righe, banco, due casse ai piedi e la sua **insegna**. **Non sono mercanti**: non
compaiono fra gli `npcs`, non hanno `kind` da negozio, non aprono niente. Ma hanno un **corpo solido**
(`INGOMBRI.bancarella`, 35×15, che ruota col verso del banco): ci si gira attorno invece di passarci dentro.
Il test verifica tutte e tre le cose — sei banchi, sei mestieri distinti, e per ognuno un rettangolo solido —
piu' la **raggiungibilita'** del villaggio col flood fill a mezza tessera, che resta al 99,9%.

### 🧍 I sette paesani *(v2.5)*

Fino alla v2.4 ogni abitante era **la sagoma del ladro ricolorata**: da lontano il villaggio era una fila di
gemelli in tinte diverse. Adesso ci sono **sette tipi**, disegnati da zero, ognuno con veste, statura e **una
cosa sola** che lo distingue.

| Tipo | Statura | Il segno |
|---|---|---|
| **paesano** | piena | cintura e sacco in spalla |
| **paesana** | piena | fazzoletto in testa, cesto al fianco |
| **vecchio** | 0,90 | barba lunga in avanti, bastone |
| **bimbo** | 0,66 | una palla in mano |
| **bottegaio** | piena | grembiule chiaro |
| **monaco** | piena | cappuccio, e dentro un filo di faccia |
| **minatore** | piena | elmetto con lampada, piccone in spalla |

**Una sola per tipo, e non e' pigrizia.** A quella dimensione due segni si sovrappongono e non se ne legge
piu' nessuno: si riconosce la silhouette, non i dettagli.

**Due tentativi buttati prima di trovarla.** Il primo era un ovale con un pallino di fianco: leggeva *sassi
con la faccia*. Il secondo un cerchio con due moncherini dietro: leggeva *Topolino*, corpo tondo e due
orecchie. Dall'alto una persona si legge dalla **proporzione**, non dai pezzi:

- il **corpo e' schiacciato** davanti-dietro e **largo di traverso** — sono le spalle (`rx 0.46`, `ry 0.84`);
- la **testa sporge** davanti alle spalle (`hx 0.50` > `rx 0.46`), non ci sta dentro;
- le **braccia stanno ai lati e sopra** il corpo, non dietro, e sono **piu' chiare** della veste, se no si
  rifondono col busto e tornano a sembrare orecchie;
- in punta a ogni braccio c'e' la **mano**: due macchie di pelle grandi come niente, e sono loro a far
  leggere le braccia come braccia.

Il passo (`Math.sin(t * 3.1)`) fa oscillare le braccia in controtempo, il respiro (`Math.sin(t * 1.6)`)
scala del 2%. **I quattro eroi non sono stati toccati**: il test verifica che `_ePaesano` dica di no a
guerriero, ladro, mago e arciere, e che i sette colori di veste siano tutti diversi fra loro.

### 🪤 Il mimic e' una rarita' *(v2.5)*

`MIMIC_PROB` scende da **0,30 a 0,06** per cassa. Il numero che conta non e' quello: e' **la probabilita' per
ondata**, perche' le casse si aprono a gruppi.

| | per cassa | almeno uno su 4 casse |
|---|---|---|
| **prima** | 30% | **76%** — tre a ondata |
| **adesso** | 6% | **22%** — circa uno ogni cinque ondate |

Al 76% il mimic non era una sorpresa: era **una tassa** sull'aprire le casse, e si smetteva di aprirle. Una
trappola funziona quando e' rara abbastanza da farsi dimenticare. Il test controlla la quota per cassa **e**
rifa' il conto per ondata, perche' e' li' che al primo colpo il numero sembrava ragionevole e non lo era.

### 🌀 Il portale, e niente timer

L'uscita non e' piu' un quadrato verde in fondo alla piazza: e' **la faglia**, la stessa che si apre quando
hai ripulito un'ondata *(vedi LA FAGLIA D'USCITA)*, piantata nel mezzo del villaggio. Stesso disegno, stesso
gesto, stesso raggio, e la si vede da qualunque strada. Attraversarla riporta al **menu di fine ondata**.
Nella griglia **non c'e' piu' nessuna tessera EXIT**: la pianta dichiara solo il posto, il portale lo apre il
server entrando in sosta e lo chiude uscendo.

E **il timer non c'e' piu'**. In multiplayer la sosta si chiudeva da sola dopo 120 secondi: adesso si riparte
solo quando qualcuno entra nel portale. Il villaggio e' un posto in cui si sta, non una schermata da
sbrigare. In cambio, se uno resta fermo la partita aspetta — e' il prezzo, ed e' voluto.

---

## 🏠 LA SCHERMATA PRINCIPALE *(rifatta in v2.2)*

Prima era un pannello solo, alto e stretto: dentro ci stavano il titolo, il nome, gli eroi, il pulsante e —
**chiusa in un accordion che nessuno apre mai** — tutta la guida del gioco. Chi arrivava nuovo non sapeva
niente, e chi ci tornava dopo un mese doveva ricordarsi da solo cosa fa il tasto E.

| Pezzo | Dove sta adesso |
|---|---|
| **Il titolo** | fuori dal pannello, sullo **sfondo**, grande. E l'insegna del gioco, non una riga di un modulo |
| **Colonna sinistra** | nome, stanza, scelta dell'eroe, ENTRA IN PARTITA, modalita di prova |
| **Colonna destra** | la guida, **aperta**: comandi e le cinque cose che contano in una run |

**Perche aperta e non in un accordion.** In una schermata di avvio un accordion e un modo elegante di non
far leggere niente a nessuno: il pannello c'era gia da versioni, e chiuso non l'ha aperto mai nessuno.

Ogni colonna **scorre per conto suo** (`max-height` + `overflow:auto`): il titolo resta sempre in cima, e su
uno schermo basso non si perde ne il pulsante di sinistra ne la guida di destra. Sotto i **1080 px** le due
colonne si **impilano** — e impilate tornano alte quanto il loro contenuto, se no il `flex:1 1 0` le
schiaccerebbe a un centinaio di pixel.

Vale **solo per la schermata principale**: la sala d'attesa e il menu di fine ondata restano com'erano.

### I comandi, tutti

Movimento, mira, sparo, **scatto**, le tre **pozioni** (1 2 3), le due **abilita attive** (Q ed E, coi
livelli a cui si sbloccano), **L** (luce — che dalla v2.1.4 e acceso all'avvio e che nessuno sapeva
esistesse), **M** (musica), **Invio** (chat), **T** (modalita di prova).

*Il test li pretende uno per uno: se un domani si aggiunge un tasto e ci si dimentica di scriverlo qui, e li
che ce lo si ricorda.*

### Le cinque cose che contano

Venti ondate e due boss col tempo obiettivo · le due vite · i **quattro modi separati di crescere** (XP →
statistiche, livelli 3·6·9·12 → carte, 8·14 → abilita attive, monete → equipaggiamento) e la
specializzazione al 15 · l'evoluzione delle armi · il villaggio fra un'ondata e l'altra.

**Niente immagini**, testo e icone: una guida fatta di schermate invecchia alla prima modifica alla grafica,
questa no.

---

## 💾 IL SALVATAGGIO *(v2.11)*

Si salva **dall'Ostessa**, per **10 monete**, **quando lo decidi tu**. Niente salvataggi automatici:
scegliere quando salvare *e'* il salvataggio, e uno automatico toglie quella scelta senza chiedere.

| | |
|---|---|
| **Dove si salva** | dal pannello dell'Ostessa, nel villaggio — la locanda e' il posto dove si salva in ogni gioco di ruolo da quarant'anni, e cosi' non c'e' niente da spiegare |
| **Quanto costa** | 10 monete: abbastanza da essere un gesto, troppo poco da essere una scelta |
| **Quanti** | **uno solo**: salvare sovrascrive. C'e' o non c'e' |
| **Dove vive** | nel **browser** (`localStorage`). Il server non lo tiene |
| **Come si riprende** | pulsante **RIPRENDI** nella prima schermata, con su scritto ondata, classe, livello e quando hai salvato |
| **Da dove riparti** | dal **villaggio** di quell'ondata, con tutto quello che avevi |
| **Se muori** | il salvataggio **resta**. Nessuno lo cancella: e' il punto di averlo |
| **In cooperativa** | per ora no. Il pulsante lo dice |

### 🔑 La regola: si salvano le CAUSE, non gli EFFETTI

Un personaggio all'ondata 12 ha `stats.dmgMult = 1.08`, `perk.parata = 2`, `maxHp = 290`. Sono tutti numeri
**calcolati** — da `_recomputeBoons` e `_recomputeGear` — a partire da cose piu' semplici: i punti che hai
speso (`buys`), le carte che hai preso (`boonsOwned`), l'equipaggiamento che porti (`gear`).

**Se salvassimo i numeri calcolati**, il giorno che ritari il costo di una statistica o il danno di
un'armatura ogni partita salvata resterebbe con i numeri **vecchi** — e non si vedrebbe: nessun errore,
nessun crash, solo un personaggio leggermente sbagliato che nessuno sa spiegare. Salvando le cause e
ricalcolando al caricamento, un salvataggio vecchio prende automaticamente il bilanciamento nuovo.

E' anche il motivo per cui `shared/salvataggio.js` e' corto: le cause sono diciassette campi, gli effetti
sono cento.

### 🧩 I tre dettagli che non si vedono

1. **Il pacchetto si costruisce PRIMA di pagare.** Cosi' contiene le monete che avevi *prima* della sosta:
   ricaricando non ti ritrovi a pagare la stessa sosta una seconda volta. Dieci monete si pagano una volta.
2. **Si riparte da `startGame(1)`, non da `startGame(ondata)`.** Passare un'ondata alta accende la
   **modalita' di prova** — `this.prova`, e il personaggio finto di `_preparaProva`. Una partita ripresa
   non e' una prova: e' la tua, e i suoi record valgono. L'ondata gliela si dice a parte.
3. **Le scelte in sospeso tornano a galla.** Chi salva con una carta ancora da scegliere se la ritrova
   appena riprende — e' lo stesso errore della v2.9.4, che qui sarebbe stato facilissimo rifare.

### 🧱 Un pacchetto rotto si rifiuta INTERO

Formato sbagliato, classe che non esiste, livello impossibile: si rifiuta e la partita **non parte**. Un
caricamento a meta' produce un personaggio impossibile, che e' molto peggio di un *«non si puo'»*. I numeri
ritoccati a mano si stringono nei loro limiti — non e' antifrode (e' un gioco in singolo: chi vuole barare
apre la console e bara), e' che un salvataggio corrotto non deve poter mandare per aria il server.

### 🎭 Riprendendo comanda il salvataggio, non il menu *(v2.11.3)*

Segnalato giocando: *«ho salvato come ladro, ho riaperto col guerriero selezionato, ho premuto RIPRENDI ed
ero ladro ma con la skin del guerriero»*. Due difetti diversi, tutti e due veri.

**1. La skin — il server.** Nome ed eroe viaggiano nello snapshot **una volta sola** (`p._sent`), perche' in
partita non cambiano mai: e' l'ottimizzazione dello "snapshot magro". Ma **riprendere e' l'unico momento in
cui la classe cambia sotto i piedi del client**: sei entrato guerriero e il salvataggio ti rifa' ladro.
Senza riabbassare quella bandiera il client non lo sa e continua a disegnare la classe vecchia — ladro nei
numeri, guerriero a vedersi. `riprendi()` adesso fa `p._sent = 0`, e lo snapshot dopo glielo ridice.

**2. La barra delle abilita' e il ritratto — il client.** In `entra()` c'era `G.meHero = HUD.selectedHero`
secco, e cancellava la classe appena letta dal salvataggio: il client restava convinto di essere un
guerriero anche per la barra dei tasti e per il ritratto nei dialoghi. Adesso, riprendendo, comanda il
salvataggio.

### ⚠️ Il prezzo di tenerlo nel browser

Cambi browser, o cancelli i dati del sito, e il salvataggio non c'e' piu'. E' il compromesso che si e'
scelto: zero infrastruttura, nessun account, nessuna cartella da gestire sul server. `localStorage` inoltre
**solleva un'eccezione** — non torna `null` — in finestra anonima, con i dati del sito bloccati e a spazio
esaurito: ogni lettura e scrittura sta dentro `try/catch`, e se non si puo' scrivere **si dice**, invece di
far finta di aver salvato. Un salvataggio che il giocatore crede di avere e non ha e' peggio di nessuno.

---

## 🎯 IL MIRINO AL GUINZAGLIO *(v2.10)*

Il mirino non si allontana piu' di **200 px** dal personaggio. Il cursore lo muovi come vuoi: il mirino lo
segue finche' sta dentro il raggio, e oltre si ferma sul bordo **conservando la direzione**.

### 🚫 Perche' non si puo' "limitare il cursore"

Una pagina web **non puo' spostare il cursore del sistema**: non esiste un'API per farlo, ed e' voluto —
un sito che ti muove il puntatore e' un sito che ti fa cliccare dove vuole lui. L'unica strada e' il
**pointer lock**: si chiede al browser di *nascondere* il cursore vero e di mandare solo gli **spostamenti**
(`movementX/Y`). Da li' in poi il mirino e' roba nostra: lo teniamo noi, lo disegniamo noi, lo fermiamo dove
vogliamo. E' come si controllano i twin-stick.

### 🪢 Il guinzaglio e' un vettore dal centro

Il personaggio sta **sempre al centro dello schermo** — la camera lo insegue — quindi il mirino e'
semplicemente uno scostamento da li': si accumulano i movimenti e si **accorcia il vettore** quando supera
il raggio. Accorciare non ruota: la direzione resta quella che hai scelto, ed e' l'unica cosa che il server
riceve. Nessuna conversione fra mondo e schermo, perche' la mappa e' disegnata **1:1**.

### 🔓 Si gioca anche senza il blocco

Il pointer lock lo concede il browser, e solo dopo un clic; l'utente puo' uscirne con **Esc** quando vuole,
e su un telefono non esiste. Se non c'e', il mirino segue il cursore vero — **clampato allo stesso raggio**.
La regola del gioco e' identica nei due casi: cambia solo se il puntatore che vedi e' il tuo o il nostro.
Per questo il guinzaglio sta in **un posto solo**, `_clamp()`: due strade e un clamp per ciascuna sarebbero
due regole che prima o poi divergono.

### 🏘️ Ma NEL VILLAGGIO il guinzaglio si spegne *(v2.11.1)*

Non e' un'eccezione estetica: e' che nel villaggio il mouse **serve per cliccare**. Fabbro, Ostessa,
Erborista e Banditore hanno dei pannelli con dei pulsanti, e col pointer lock **il cursore non esiste**:
quei pulsanti non si potevano piu' premere. Era un bug vero, non un fastidio.

Quindi dentro il villaggio: niente pointer lock, il **cursore del sistema torna visibile**, il guinzaglio e'
spento e il mirino **non si disegna affatto** — se no ce ne sarebbero due a schermo. Li' dentro non si spara.

Riaccendendolo (uscendo dalla faglia) il mirino **rientra subito** nei 200 px: nel villaggio puo' essere
finito a seicento pixel, e senza questo resterebbe disegnato lontanissimo fino al primo movimento del mouse.

### 👁️ Un puntatore solo

Il cursore del sistema sul canvas e' **nascosto** in combattimento (`cursor:none`): se restasse visibile,
senza pointer lock si vedrebbero **due puntatori separarsi** appena superi il raggio — quello vero che va
avanti e il mirino che si ferma. Uno solo, e la regola si legge da se'.

*(v2.10 disegnava anche un **anello** a 200 px, acceso mentre il mirino premeva contro il limite, per
spiegare perche' non andasse piu' in la'. All'occhio non funzionava — un cerchio che si accende e si spegne
addosso al personaggio e' rumore — ed e' stato **tolto** in v2.11.1. Il limite si capisce lo stesso: il
mirino si ferma.)*

### ⚠️ Cosa NON cambia (e va detto)

**Nessuna meccanica.** Il client manda al server solo `aim`, che e' un **angolo**: frecce, magie, fendente e
perfino la Meteora partono da li', con una gittata loro gia' scritta. La **distanza** del mouse non e' mai
stata mandata e non e' mai stata usata. Il guinzaglio cambia **come si sente il gioco in mano**, non dove
arrivano i colpi. Se un domani si vorra' una gittata vera, e' un lavoro di bilanciamento, non di input.

### 🧪 Il test prova la regola, non il disegno

`test/client.js` carica `input.js` davvero, gli manda eventi di mouse finti e guarda **dove finisce il
mirino**: dentro il raggio segue, fuori si ferma a 200 e l'angolo resta quello, in diagonale idem,
sul personaggio esatto l'angolo non diventa `NaN`, e agganciato accumula spostamenti senza mai sfondare il
guinzaglio. E' la parte che decide dove spari: vale la pena che si rompa li' e non in mano a chi gioca.

---

## 🔦 LA TORCIA — il campo visivo *(v2.1, solo nelle mappe di combattimento)*

Fino alla v2.0 il buio era un velo **tondo** attorno al giocatore: vedevi un cerchio — davanti, di fianco,
dietro, uguale — e una stanza dietro una roccia si vedeva come una stanza aperta, perche' il velo non sapeva
niente dei muri. Adesso si vede **quello che si puo' vedere**.

**Come funziona.** Si tirano raggi dal giocatore su tutto il giro. Ognuno cammina a passetti di un terzo di
tessera finche' non sbatte in un muro o finisce la portata; le punte disegnano una **macchia**, e quella
macchia e' il buco ritagliato nel buio. Dietro un muro il raggio non arriva, quindi la luce non arriva:
**l'occlusione non e' un calcolo a parte, e' la stessa cosa**.

A cambiare non e' *quali* raggi esistono ma **quanto lontano arrivano**:

### Due luci, non una *(v2.1.2)*

Una torcia vera fa due cose insieme: un **alone** largo che ti illumina attorno, e un **fascio** stretto che
va lontano dove la punti. Fino alla 2.1.1 c'era una goccia sola e doveva fare entrambe — o era corta e non
illuminava lontano, o era lunga e si allargava troppo.

| Angolo | Alone | Fascio |
|---|---|---|
| davanti | 470 | **1150** |
| 20 gradi | 455 | 1049 |
| 40 gradi | 414 | 792 |
| 60 gradi | 353 | 485 |
| 90 gradi | 251 | 144 |
| alle spalle | 118 | **0** |

**E si integrano perche il cono non e una forma nuova: e la stessa formula con numeri diversi.** Due curve
continue, il fascio si spegne da solo girandosi, e verso i 60 gradi il comando passa dall'uno all'altra
senza che si veda dove. Il test lo pretende come numero: il salto massimo di portata da un grado al
successivo e il **3,8%** — sotto il 6% oltre cui l'occhio vedrebbe uno spigolo.

E si **sommano** invece di sovrapporsi: cancellare il velo e moltiplicativo, quindi dove l'alone ha gia
tolto meta velo il fascio toglie meta di quel che resta. Nel cuore le due luci si sommano senza gradino.

### Le sfumature, che sono il punto

Ogni luce ha la sua curva, e la curva ha un numero che decide tutto: **fino a che frazione della portata la
luce resta piena** prima di calare.

| | resta piena fino a | poi |
|---|---|---|
| **alone** | 22% | sfuma tutto: e luce diffusa, non deve avere un bordo |
| **fascio** | 34% | cala piano: 100% fino a 400 px, 82% a 600, 64% a 750, 51% a 900 |

Al primo tentativo il fascio calava da subito e **sembrava corto per quanto lontano arrivasse la sua
portata**: su un pavimento di grotta, gia scuro di suo, sotto il 60% di luce non si distingue piu niente.
Il fascio era li, semplicemente non si vedeva.

**E la luce calda.** Togliere il velo non basta: senza velo il pavimento di una grotta e comunque scuro, e
il fascio si leggeva come *meno buio* invece che come luce. Tre lampade calde in fila lungo la direzione in
cui guardi (a 14%, 36% e 60% della portata) sono cio che lo rende una torcia. Sono dentro il ritaglio del
campo visivo come tutte le altre luci: un muro le ferma.

Tre numeri in constants (`FOV_AVANTI`, `FOV_DIETRO`, `FOV_FORMA`) e la forma cambia.

### Le due strade sbagliate, e perche

**Ritagliare sulla tela del gioco.** Con `destination-out` non si cancella il velo: si cancellano i PIXEL,
mondo compreso, e la zona illuminata diventa un buco trasparente sul nero della pagina. Il velo si
costruisce su una **tela sua** (meta risoluzione), ci si ritaglia dentro la macchia, e poi la si appoggia.

**Un cono piu un cerchietto.** Era il primo disegno: un cono davanti per la vista lunga, un cerchietto
attorno ai piedi per non essere ciechi da vicino. Due forme cucite insieme, e **la cucitura si vedeva** — un
cerchio netto con un triangolo attaccato. Adesso e' **una forma sola**: il cerchietto non esiste, e' la
stessa macchia che dietro si accorcia.

**E la sfumatura non e' un gradiente radiale**: un gradiente e' un cerchio, e questa forma non lo e'. Sono
quattordici contorni annidati, dal piu largo al piu stretto, ognuno cancella un altro po di velo — cosi la
luce cala seguendo la goccia, e accanto ai muri si ferma dove si ferma la vista.

### L'ombra la fanno solo i muri *(v2.1.1)*

La griglia del gioco e **binaria**: per lei una lapide del cimitero e un masso sono la stessa tessera. Il
campo visivo se ne accorgeva, e ogni lapide proiettava il suo cono d'ombra — un campo di lapidi diventava
una **grattugia di ombre**.

Il tipo vero della tessera c'era gia: e `m.muri`, l'array che dalla v1.97 dice al renderer *cosa* disegnare.
Adesso lo legge anche la luce.

| Tessera | Ferma la luce? |
|---|---|
| **lapide** (1) | **no** — e alta un ginocchio, ci si vede sopra |
| roccia (0) | si |
| pietra squadrata delle cappelle (2) | si |
| cinta (3) | si |
| **albero secco** (4) | si — e alto, e fa da bordo alla mappa: se passasse la luce si vedrebbe fuori dal cimitero |

Se un giorno servisse far passare anche i muretti bassi, si aggiunge un numero in `_fovBlocca` e basta: e
l'unico punto del gioco in cui questa distinzione esiste.

**Vale solo per la LUCE.** Per le collisioni e per l'IA una lapide resta un muro, e deve restarlo — se no i
mostri ci passerebbero attraverso.

### La penombra *(v2.1.3)*

Il bordo dell'ombra proiettata da un muro era un **taglio netto**: giusto in geometria (un raggio o passa o
non passa), sbagliato all'occhio — nessuna luce vera fa un bordo cosi.

Il velo si **sfoca** quando lo si appoggia sopra la scena (`FOV_SFUMA`, 6 px). Si sfoca il velo **intero,
una volta sola**: costa un'operazione per fotogramma invece di una per ogni contorno, e ammorbidisce
insieme i bordi delle ombre e la coda delle due luci. Con `FOV_SFUMA: 0` si torna al taglio netto.

**Il margine.** Sfocando un rettangolo il suo bordo diventa semitrasparente: se quel bordo coincidesse col
bordo dello schermo si vedrebbe una cornice chiara tutt'attorno al gioco. Per questo la tela del velo e piu
grande dello schermo di **26 px per lato** (`_veloM`) e la si appoggia partendo da `-M`. **I due numeri
vanno insieme**: il margine dev'essere piu largo del doppio della sfocatura, e il test lo pretende.

### Il secondo strato: il tasto L *(acceso di suo dalla v2.1.4)*

Oltre al campo visivo c'e' un **secondo velo**, che esiste dalla v1.16: una mano di buio bucata da **aloni
tondi** — uno grande attorno all'eroe, e uno piccolo per ogni torcia, braciere e pozza di pericolo. Da solo
era una modalita alternativa; insieme al campo visivo e **l'illuminazione giusta**: il campo visivo da la
forma e le ombre dei muri, questo scava i tondi di luce attorno alle sorgenti e ammorbidisce il resto.

Si accende e si spegne col tasto **L**, e nasce **acceso**. Il valore predefinito era gia quello, ma chi
l'aveva spento anche una volta sola si ritrovava uno `0` salvato nel browser che comandava per sempre:
percio nella v2.1.4 la chiave ha cambiato nome (`dr_torch` -> `dr_torcia`). Chi aveva spento riparte acceso
una volta sola; da li in poi la L continua a ricordarsi la scelta. *Cambiare nome alla chiave e il modo
pulito di dare un valore predefinito nuovo senza buttare via la memoria della scelta.*

Nel villaggio questo strato non si applica: la L non puo rimettere al buio la sosta.

### Le regole che ne discendono

- **Gli aloni di luce sono ritagliati sulla macchia**: una torcia dietro una roccia non illumina la roccia.
- **In cooperativa la visuale e condivisa**: quello che vede un compagno lo vedi anche tu, se no in due si
  gioca peggio che da soli.
- **Il villaggio e escluso**: dichiara `lit` (v2.0.2) e resta illuminato. Il renderer decide da quella
  bandiera, non dal tipo di mappa.
- **I nemici alle spalle non si vedono.** E' voluto. Restano sulla minimappa, che e l'altro modo di sapere
  dove sono.

---

## 🌋 LA CALDERA *(v1.99 · arena sgombrata in v1.99.1 · centro arredato in v1.99.2 — ondate 10 e 20, quelle dei boss)*

Le due ondate dei boss non si giocano piu in una caverna come tutte le altre. La caldera non e costruita
da nessuno: e successa.

| Pezzo | Cosa fa, giocando |
|---|---|
| **La conca** | bordo irregolare su tre frequenze, **1404-1427 tessere calpestabili** |
| **I massi del bordo** | 6-10, appoggiati alla parete: danno profondita, non stanno mai sulla strada |
| **L'arena** | **sgombra**. Nessun ostacolo isolato in mezzo: e li che si combatte il boss |
| **Gli ornamenti** *(v1.99.2)* | sassi piccoli, **bracieri**, ossa e macerie sparsi in mezzo: arredano il centro senza togliere spazio |

**Perche sgombra** *(v1.99.1)*: fino alla v1.99.0 c'erano una **cresta** di roccia a meta pendio e 10-14
**speroni** sparsi nella conca. Erano coperture per il giocatore, ma per un boss di raggio 38-52 erano
trappole: fra uno sperone e l'altro ci si incastrava. Tolti. Misurato su cinque semi: **0 rocce isolate**
nell'arena, **1202-1224 caselle larghe 3x3 connesse al 100,0%** (erano ~730 al 98,5-100%).

**Niente pozze** *(v1.99.2)*: fino alla v1.99.1 dal centro si aprivano le **crepe della faglia**, pozze di
pericolo a raggiera. Funzionavano, ma in mezzo all'arena facevano un brutto effetto — una macchia arancione
larga mezza conca. Tolte, e con loro anche le pozze normali: nella caldera adesso ce ne sono **zero**. Nelle
altre ondate le pozze sono al loro posto, invariate.

**Al loro posto gli ORNAMENTI**: sassi piccoli (scala 0,5-0,85: devono leggersi come terreno, non come
coperture), **bracieri** con due sassi ai piedi, ossa di chi e venuto prima, macerie. Non costano **una
tessera di spazio**: sono props, cioe disegno puro — la griglia binaria non li conosce, e nemmeno
collisioni, linea di vista e campo di flusso. L'arena resta sgombra e il boss ci gira. *Sgombra non vuol
dire vuota.*

Sono cercati **al contrario di tutte le altre decorazioni**: quelle stanno in nicchia contro un muro, questi
devono stare lontani dai muri, perche qui il vuoto da riempire e il centro. E restano fuori dalle 7 tessere
attorno alla partenza, come ogni altra cosa che nasce sulla mappa.

**Non e costata una riga di renderer**: i massi del bordo sono roccia come quella della caverna (la cottura
li disegna gia), e gli ornamenti sono i props che il motore disegna dalla v1.23.

Le ondate sono un elenco in constants (`CALDERA_ONDATE: [10, 20]`). La zona si chiama *La Caldera* alla 10
e *La Faglia Aperta* alla 20.

### 🧍 Il Colosso della Faglia — ritarato in v1.99.1

Era lento e la sua unica botta si schivava stando indietro e girandogli attorno. Adesso il problema non e
piu *entrare nella sua portata*, ma *dove sarai fra un secondo*.

| | Prima | Adesso |
|---|---|---|
| Velocita | 74 | **92** |
| Pugno | colpisce dove sei | **anticipa il tuo movimento** (`slamPredizione: 0.55`) |
| Da lontano | niente | **carica addosso** oltre i 200 px: telegrafo 0,45 s, poi 3x velocita per 0,9 s, danno 120% |
| Onda d'urto | ogni 7,0 s | ogni **5,6 s** |

Se la carica sbatte contro un muro si ferma e il boss resta scoperto 0,7 s. In fase 2 e 3 la ricarica della
carica scende a 0,82x e 0,65x.

Misurato con una simulazione che gira attorno al boss sparando: a 300 px lo scontro passa da **43 s a 31 s**
e il giocatore incassa **175 → 255 PV** (su ~325 di un Campione, **+46%**); a 450 px da 197 a 253 PV.

---

## 🪦 IL CIMITERO *(v1.97 · ristretto in v1.98 · **IN STAND-BY dalla v2.9.1**)*

> ⏸️ **SPENTO AL MOMENTO — `CIMITERO_FINO_A: 0`.** Dalla v2.9.1 **anche la prima ondata si gioca nelle
> grotte**. Il cimitero non e' stato cancellato: la pianta (`piantaCimitero`), i tipi di tessera (lapide,
> cinta, mausoleo, albero secco), il modo in cui il renderer li dipinge e i nomi di zona sono **tutti
> ancora qui**, e i test continuano a provarli forzando la pianta — `MG.generate(seed, 1, true)` — perche'
> una pianta che non genera piu' nessuno marcisce in silenzio e il giorno che la riaccendi non funziona.
> **Per riaccenderlo: rimettere `CIMITERO_FINO_A: 1`.** Tutto il resto di questa sezione descrive com'e'
> fatto, e resta valido.

Dalla v1.97 le piante sono **due**. La **prima ondata** si giocava in un **cimitero**, dalla seconda
tornava la **caverna** di sempre (`CIMITERO_FINO_A` in constants: alzalo, abbassalo, o mettilo a 0 e
sparisce — ed e' esattamente quello che si e' fatto in v2.9.1).

Un cimitero non e roba sparsa: e **settori** separati da **vialetti**, e dentro ogni settore **file
regolari**. E l ordine a dire che non e una grotta — la caverna e tutta disordine organico.

| Pezzo | Cosa fa, giocando |
|---|---|
| **Muro di cinta** | ce un dentro e un fuori; tre-cinque brecce lo rompono |
| **Vialetti** (3-4 tessere) | le strade: ci passa anche il boss piu grosso |
| **File di lapidi** | **bloccano il tiro ma non il passo**: ci giri intorno in un passo |
| **Mausolei** | stanze vere con una porta: ci si entra |
| **Rovine** | muri crollati: copertura |
| **Fosse** | chiazze tonde che cancellano le file e rompono la griglia |

**La griglia resta binaria.** Le lapidi sono tessere-muro normali; il loro TIPO viaggia in un array
parallelo che legge solo il renderer. Percio il cimitero non ha toccato una riga di IA, di collisioni o
di pathfinding.

**Due funzioni della caverna qui sono spente**:  e  vedono una lapide
isolata come un imbuto e se ne mangiavano l 85% (da 155 a 19, misurato). Nel cimitero il passaggio e
garantito per costruzione.

**Quanto e grande** *(v1.98)*: ~1620 tessere libere, cioe' quanto una caverna. Nella v1.97 erano ~2350 e il
posto sembrava una piazza d'armi: il bosco attorno lo ha stretto.

**I temi scendono a quattro** (via la lava) e la zona prende un nome suo: *Il Vecchio Camposanto*,
*Il Cimitero Sommerso*, *Il Campo di Gelo*, *Il Sepolcreto Arcano*.

---

## 🐾 COME TI CERCANO I NEMICI *(v1.92 — si torna al vagabondaggio della v1.43)*

Ogni nemico che cammina ha tre modi di muoversi, e la differenza fra loro e' la **velocita'**:

| Stato | Come si muove | Velocita' |
|---|---|---|
| **Ti vede** (entro `sightRange` e con linea di vista libera) | ti insegue, attacca | 1,00 |
| **Ti ha visto** (memoria, `def.memory` ~3,5 s) | va all'ultima posizione nota | 0,95 |
| **Non ti vede** | **vaga**: sceglie un punto raggiungibile a caso entro 90-350 px e ci cammina | ≤ 0,60 |

**Non sa dove sei.** E' il punto della v1.92. Fra la v1.80 e la v1.91 l'ultima riga diceva *ti cerca*: chi
non ti vedeva seguiva comunque il campo di flusso verso tutti i giocatori vivi. Funzionava fin troppo bene
— alle ondate alte l'ondata **intera** ti arrivava addosso — e toglieva al gioco la cosa che rende viva una
mappa: un nemico deve **accorgersi** di te. Adesso ti trova con gli occhi, non con la mappa.

**Le eccezioni.** Il **Fungo Sporifero** non si muove mai: e' una sentinella, nega il terreno invece di
inseguirti. Il **Fuoco Fatuo** attraversa i muri e va in linea retta. La **Sfera d'Ossa** rotola piano in
giro finche' non ti trova, poi si carica e parte.

### Quanti ne vedi in campo *(v1.96)*

Due tetti diversi, che non vanno confusi:

| | Cosa limita | Valore |
|---|---|---|
| **Tetto dei vivi** | quanti nemici esistono in mappa nello stesso momento | **40** fino all ondata 8, **22** dalla 9 |
| **Tetto alla folla** | quanti di quelli ti si fanno addosso | **6** per giocatore |

Il tetto dei vivi era uno solo e alto (40) dalla v1.79.2. Con le ondate di adesso, alla 19 erano quaranta
mostri in campo insieme e la mappa non si vedeva piu'. Dalla nona scende a 22: il **totale dell ondata non
cambia**, chi non ci sta aspetta in coda ed entra quando ne muore uno. In campo insieme, prima -> dopo:
ondata 9 da 28 a 22, 12 da 35 a 22, 15 da 38 a 22, 19 da 40 a 22. Il tempo per chiudere l ondata resta
quello di prima (21-24 s con un giocatore che uccide uno ogni 0,7 s).

### Il tetto alla folla *(v1.80, non toccato)*

Anche vagando, non devono potersi accumulare tutti addosso. Solo i **`FOLLA_MAX` = 6 piu' vicini** a
ciascun giocatore hanno il permesso di avvicinarsi; gli altri risalgono fino all'**`ANELLO_ATTESA` = 900
px** e li' girano, fuori dallo sguardo (il rientro all'anello lo fa un `seek` diretto, dalla v1.92, perche'
la caccia non esiste piu'). L'assegnazione si rifa' ogni 0,4 s in ordine di distanza: **uccidi quello che
hai addosso e il piu' vicino fra quelli in attesa si avvia.**

L'anello ha adesso un secondo compito, ed e' quello che tiene in piedi l'ondata: impedisce che il branco
si **dissolva** in un angolo della mappa. Vagano, ma vagano *dalle tue parti*.

| Eccezione | Perche' |
|---|---|
| chi ti **vede** | un nemico che ti ha davanti agli occhi e si gira a passeggiare non e' un gioco piu' facile, e' un gioco rotto |
| chi e' **in mezzo a un'azione** (rotolata, slam, balzo) | interromperla a meta' si vedrebbe |
| i **boss** e gli **immobili** | non sono folla |

### Quanto cambia, misurato

Giocatore **fermo**, in singolo, nemici entro 620 px:

| | v1.91 (ti cercavano) | **v1.92 (vagano)** |
|---|---|---|
| Ondata 1, a 45 s | 12 / 12 | **0 / 12** |
| Ondata 6, a 60 s | 6 / 20 | **7 / 20** |
| Ondata 12, a 60 s | 18 / 33 | **14 / 33** |

Giocatore che **esplora** (tre semi, media) — l'ondata la incontri lo stesso, ma perche' vai a cercarla:

| | v1.91 | **v1.92** |
|---|---|---|
| Ondata 12, addosso a 15 s | 11,0 | **5,7** |
| Ondata 12, incontrati entro 90 s | 24 / 29 | **22,7 / 32** |
| Ondata 16, addosso a 15 s | 8,3 | **6,7** |

La differenza vera e' **all'inizio dell'ondata**: alla 12 il branco che ti trova nei primi quindici secondi
si dimezza. Il **recupero di distanza** che faceva correre i lontani fino a 2,1x resta **spento** (v1.80).

**Non compaiono, arrivano**: la regola della v1.76.1 non e' stata toccata — nessun nemico in vista guadagna
distanza di scatto, e il recupero anti-stallo sposta solo chi e' davvero bloccato, oltre i 950 px e fuori
dallo sguardo.

---

## 🧪 LA MODALITA' DI PROVA *(v1.91 · nascosta dalla v1.96.1)*

> **Non si vede.** Dalla v1.96.1 il pannello nasce nascosto: e uno strumento di sviluppo, non una voce
> del menu. Per aprirlo, **?test** nell indirizzo (`http://localhost:8080/?test`) oppure il **tasto T**
> stando fermi nel menu. Il codice e tutto al suo posto: nascosto non vuol dire tolto.

Nel menu principale, sotto **ENTRA IN PARTITA**, un pannello a scomparsa con **venti pulsanti**, uno per
ondata (la **10** e la **20** marcate ☠: sono i boss). Si clicca e si gioca — stanza tutta propria, nessuna
sala d'attesa, la run parte dall'ondata scelta. Serve a guardare **prestazioni e giocabilita'** senza
rigiocare quattordici livelli per vedere il quindicesimo.

Il personaggio non parte nudo: `Room._preparaProva()` ricostruisce quello che a quel punto **avresti**.

| | Come si ricava |
|---|---|
| **Livello** | `1 + (onda - 1) x 0,95`, arrotondato, limitato al massimo |
| **Punti statistica** | spesi tutti, a rotazione sulle statistiche disponibili |
| **Passive e abilita'** | tutte quelle dovute fino a quel livello (presa la prima di ogni offerta) |
| **Equipaggiamento** | il **grado** che ci si sarebbe potuti permettere: scarso (1-3), comune (4-7), raro (8-11), leggendario (12-15), divino (16+) — carattere equilibrato, che e' quello senza penalita'. Le soglie vengono da `test/monete.js`, non da una sensazione. |
| **Monete** | 68 per ogni ondata saltata |

Esempio verificato in un browser vero, cliccando la **12**: *Ondata 12/20 · Lv.11 Campione · 375 PV · 748
monete · Q sbloccata, E chiusa fino al 14*.

---

## 👁 I TRE BEHOLDER *(v1.79.2)*
Erano uno solo, disegnato come una marionetta di pezzi raster, e **non attaccavano**: applicavano debuff e
basta. Adesso sono tre creature della stessa famiglia, **dipinte a codice** come la caverna, e mordono.

| | PV | Danno | Raggio | Morso | Entra |
|---|---|---|---|---|---|
| 👁 Occhio Viola | 120 | 13 | 320 px, 45% del danno a tick | 90 px | ondata 9 |
| 👁 Occhio di Carne | 210 | 18 | 340 px, 50% | 105 px | ondata 12 |
| 👁 Occhio Spettrale | 260 | 22 | 400 px, 60%, attraversa i muri | 95 px | ondata 15 |

Il raggio ruota i tre sguardi (indebolimento, rallentamento, corrosione) **e consuma vita** finche' ti
tiene nel cono; sotto la distanza di morso smette di guardare e azzanna. Una cosa alla volta.

## 🧭 IL MENU DI FINE ONDATA *(rifatto in v1.79)*
Quattro sezioni con una barra in basso, e sotto — **da solo e centrato** — il pulsante che fa partire la
mappa successiva. Separarlo non e' estetica: e' l'unico comando che chiude il menu.

| Sezione | Contenuto |
|---|---|
| **📊 Riepilogo** | Le statistiche dell'ondata appena chiusa. Si apre da sola. |
| **🧍 Personaggio** | Le quattro statistiche da salire, e l'**inventario**: salute, vite, arma, equipaggiamento per slot, cintura delle pozioni. |
| **🎴 Abilita'** | La scelta in sospeso e l'elenco per scaglione, con scritto quando arrivano quelle che mancano. Solo le tue. |
| **🏕️ Vai al villaggio** | Ci si entra solo da qui, ed e' sempre visitabile. Mappa condivisa: si entra tutti insieme. **L'uscita riporta al menu.** |

Due regole che il menu fa rispettare da solo: finche' hai una **scelta in sospeso** il pulsante della
mappa successiva resta **spento**, e la mappa parte **solo** da quel pulsante.

## 🔮 LA CARTOMANTE E' CHIUSA *(v1.79)*
Struttura, porta e insegna restano nel villaggio; la funzione no. Con quattro abilita' in tutta la run,
tutte sempre accese, non c'e' piu' niente da accendere o spegnere: il tetto delle cinque carte attive e
il concetto stesso di carta *spenta* sono spariti con lei. Verra' ridisegnata.

## ✔ LA MAPPA RIPULITA E IL PULSANTE EXIT *(novita v1.78)*
- Ucciso l'ultimo nemico l'ondata **non finisce da sola**: la fase diventa **MAPPA RIPULITA**, con la
  scritta `ONDATA COMPLETATA` in alto al centro e il pulsante **EXIT** sotto il personaggio.
- Prima l'ultimo nemico che cadeva ti spediva nel pannello del negozio nello stesso fotogramma: non
  facevi in tempo a capire di aver vinto, e quello che era rimasto a terra lo raccoglieva il gioco al
  posto tuo.
- Il **cronometro si ferma** all'ultima uccisione: il premio di velocita' si calcola sul tempo di
  combattimento, non su quanto ci metti a raccogliere.
- **Niente scade** finche' la mappa e' ripulita: sfere di esperienza, monete e oggetti a terra vivono
  30 secondi, e senza questa regola sparirebbero mentre li vai a prendere. Si ferma la scadenza, non
  la calamita che li tira verso di te.
- In cooperativa si aspettano **tutti i giocatori in piedi** (i caduti no: non potrebbero premere
  niente) e il pulsante dice a che punto e' l'attesa. Dopo **120 s** (`EXIT_TIMEOUT`) si esce comunque.

## 🎴 LE CARTE ARRIVANO DAI LIVELLI *(v1.78 — SUPERATA dalla v1.79)*

> Dalla v1.79 le abilita non arrivano a ogni livello ma solo ai quattro SCAGLIONI (3, 6, 9, 12): vedi la
> sezione in cima. Questa resta per capire da dove si e passati.
- **Una carta per livello guadagnato.** Prima ne arrivava una a ogni fine ondata: il potere arrivava
  col calendario, non col merito.
- Chi sale di tre livelli in un'ondata sceglie **tre carte**, una dopo l'altra: il mazzo si riapre
  finche' il debito non e' chiuso.
- Se non sei salito di livello il mazzo **non si apre**, e il pannello scrive quanta XP manca al
  livello successivo invece di restare muto.
- Ritmo misurato: la prima carta arriva a fine **seconda** ondata (prima era la prima), ma all'ottava
  un giocatore solo ne ha **10** contro le 8 di prima.

## 📊 IL RIEPILOGO DI FINE LIVELLO *(v1.78 — dalla v1.79 e una delle quattro sezioni del menu)*
In cima al pannello di fine ondata: **nemici uccisi**, **esperienza** e **monete** raccolte in
quell'ondata, **durata** contro il tempo obiettivo, **livelli** guadagnati, e il **premio del
cronometro** se sei rimasto sotto. Fuori tempo lo dice, invece di tacere.

## 🗑 UNA SOLA MODALITA' *(novita v1.78)*
Orda, Caccia, Sopravvivenza e Tesoro sono state **tolte**: ogni ondata e' un'ondata normale, e
l'indicazione della modalita' e' sparita dalla mappa perche' non indicava piu' niente. Con loro se ne
vanno lo **scrigno fuggitivo**, i suoi eventi, i moltiplicatori di XP e monete che valevano solo per
lui, e le ondate a tempo fisso. La **cassa-mima** resta, come mostro normale.

## 🔤 FONT DEL TESTO +1px *(novita v1.78)*
Cento regole del foglio di stile e quindici scritte disegnate sul canvas. Invariati: i **titoli**
(h1 44px, h2 19px), le **icone e le emoji** (sono disegni, non testo) e i numeroni gia' grandi
(vita, combo, contatori).

## 🚫 DAI NEMICI NON CADE PIU' NIENTE *(novita v1.77)*
- Nessun oggetto e nessuna pozione, da nessun nemico: ne' comuni, ne' elite, ne' boss, ne' cassa-mima.
  Prima cadeva qualcosa nel 9% delle uccisioni (35% sugli elite, sempre su boss e mime).
- Il motivo e' di ruoli: una cura che arriva gratis dal nulla mentre combatti toglie il mestiere
  all'**Ostessa** e all'**Erborista**, che si fanno pagare per la stessa cosa.
- Restano **esperienza**, **monete** e il contenuto delle **casse** — che non sono nemici.

## 🧪 LE TRE POZIONI FORTI *(novita v1.77)*
| Pozione | Effetto | Prezzo |
|---|---|---|
| 🔺 Nucleo Instabile | +50% danno per 12 s | 110 |
| 💥 Ira Berserk | danno raddoppiato e +40% cadenza per 8 s | 185 |
| ✨ Egida Divina | invulnerabile per 5 s | 270 |
- Sono gli effetti rari che prima cadevano a terra: riusano le stesse chiavi, l'effetto e' identico,
  cambia chi te lo da'. La piu' economica costa **piu' del doppio** della piu' cara fra le sei di base.
- **Le vite extra non si comprano dall'Erborista** *(v1.77.1)*. Per un giorno il Cuore di Fenice e'
  stato una pozione da cintura con una carica sola: non bastava. L'Erborista e' **sempre** li', quindi
  una vita comprabile da lui e' una vita comprabile a ogni passaggio dal villaggio, e le vite si
  accumulano senza attrito. Resta solo dal **Mercante Errante**, che compare a caso durante le ondate:
  e' quella incertezza a dargli il prezzo vero.

## ⏱ IL CRONOMETRO DELL'ONDATA *(novita v1.77)*
- Sotto il nome della mappa: **tempo trascorso / tempo obiettivo**. Verde sei dentro, ambra ti restano
  meno di dieci secondi, spento obiettivo perso.
- Il tempo obiettivo si calcola dal contenuto: **25 s + 3,2 s per mostro, diviso i giocatori in piedi**.
  Ondata 1 da solo 47 s, ondata 3 da solo 73 s, ondata 20 da solo 156 s; in tre rispettivamente 36, 49
  e 88 s.
- Chi chiude dentro il tempo prende **+25 XP +8 per ondata** e **+12 monete +3 per ondata**.
- Le ondate a **sopravvivenza** sono escluse: durano un tempo fisso, e un premio che tocca sempre non e'
  un premio.
- I due numeri stanno in `constants.js` e sono la manopola: `PAR_BASE` regala tempo a tutte le ondate,
  `PAR_PER_MOSTRO` soprattutto a quelle affollate.

## 👹 I NEMICI SI VEDONO ARRIVARE, NON COMPARIRE *(novita v1.76.1)*
- **Il recupero anti-stallo** serve a non lasciare un'ondata aperta per sempre quando un mostro finisce
  dove non puo' raggiungerti. Prima teletrasportava **tutti** i mostri a 240 px da un giocatore se per
  6 secondi non ne moriva nessuno: scappare senza uccidere e' esattamente quella condizione.
- Adesso guarda il singolo mostro e ne sposta uno solo se: **nessun progresso da 5 secondi**, e' oltre
  **640 px**, e non e' fermo per costruzione (il Fungo sta piantato). Chi si sposta va **oltre i 950 px
  e fuori dalla linea di vista**; se un posto cosi' non c'e', non si sposta niente.
- **Le caselle di generazione** dei nemici sono scelte lontane dalla partenza, ma un'ondata dura minuti
  e il giocatore si sposta: adesso si tiene conto di dov'e' **adesso** — almeno 520 px e possibilmente
  fuori vista.
- Verificato con sei partite da 60 secondi di fuga continua: **10.800 tick, zero scatti in vista**.

## 🗺️ LE MAPPE DI COMBATTIMENTO *(rifatte in v1.76)*

### La pianta
- **64x46 tessere** (3072x2208 px). Area calpestabile ~1330 tessere contro le 1041 di prima (+28%),
  spazio libero attorno da 0,78 a 1,16 (+49%).
- **Zero tessere-strozzatura**: nessuna tessera, tolta, spezza la mappa in due. Da ogni camera si
  esce sempre da almeno due parti. Un passaggio le cerca con la visita di Tarjan e le allarga finche'
  non ce n'e' piu'.
- Si scava UNA caverna grande e irregolare, poi ci si mettono dentro **masse di roccia** a scolpire
  le camere: lo spazio resta grande e continuo, la struttura la fanno gli ostacoli. La quantita' di
  roccia e' un **budget** — il 26% della caverna — non un numero scelto a mano.
- Tre archetipi: **anello**, **quadrifoglio**, **stella**, piu' le **dorsali**, schiene di pietra che
  attraversano e obbligano a scegliere da che parte girarle.
- **Il boss ci passa**: il grafo delle celle abbastanza larghe per un boss dev'essere collegato, e
  dove non lo e' si scava solo il cammino piu' corto fra i pezzi.
- **La partenza e' una radura**: la piu' ampia della mappa, e a parita' la piu' vicina al centro.
  Raggio libero minimo misurato su 80 mappe: 4 tessere.

### L'aspetto
- **Pavimento QUIETO** (macchie morbide, crepe lunghe, nessun contorno) e **muri RUMOROSI** (massa
  quasi nera, massi col contorno spesso, ombra proiettata dentro la stanza). E' questa scala di
  rumore a dire all'occhio dove si cammina — e sbagliarla e' l'errore che rende una mappa illeggibile.
- **Pietrisco** col contorno a inchiostro: massi, grappoli di macerie, ossa sparse, chiazze di
  sporco. Tutti piu' chiari del pavimento su cui stanno, se no dall'alto sono buche.
- **La palette esce dal tema**: cripta, lava, ghiaccio, foresta e arcano restano diversi.
- Misurato: luminanza mediana da 18 a 48, densita' di contorni dall'1,3% all'8,3% (le battlemap
  dipinte prese a riferimento stanno a 44 e 6,6%).

### La faglia segue la caverna *(regola valida a faglia accesa: oggi e' spenta — vedi la sezione «LA FAGLIA E' SPENTA»)*
- La profondita' nel margine si misura dalla **roccia esterna** — quella che confina col bordo della
  mappa — non dai bordi del rettangolo e non dai massi interni. Dietro un masso al centro si sta al
  riparo; contro la parete della caverna no. Fascia profonda due tessere, copertura 34%.

## 🏘️ IL VILLAGGIO A MICRO-STANZE *(novita v1.75 — la pianta e stata rifatta in v2.0, le persone e i mobili no)*

### La pianta
- Una **piazza centrale** col falo': ci si atterra, e li' sta il portale per l'ondata successiva.
- **Le porte sono larghe due tile** (96 px) e il **varco verso il portale tre** *(v1.75.1)*. Una tile
  sola lasciava sei pixel per parte a un personaggio largo 35: si passava sfregando lo stipite. La
  griglia lavora a tile intere, quindi fra una e due non c'e' nulla in mezzo.
- Attorno, **cinque stanze** attaccate alla piazza da corridoi di una o due tile. Nessuna e' a piu' di due
  passi, e dalla piazza si vedono tutte le porte: il villaggio si **attraversa**, non si esplora.
- La mappa passa da **26x22 a 34x26** tile. Si scava nella roccia piena: fuori da piazza, stanze e corridoi
  non c'e' nulla. **Ogni tile calpestabile e' raggiungibile a piedi dallo spawn** — 352 su 352.

### Le cinque stanze
| Stanza | Chi ci sta | Pavimento | Cosa c'e' dentro |
|---|---|---|---|
| **Taverna** | Ostessa | assi di legno | bancone, credenza con le bottiglie alle sue spalle, due file di tavoli con gli sgabelli attorno, botti in fila, lanterne appese, braciere |
| **Antro** | Cartomante | lastre viola | tappeto, tavolo, due candelabri, scaffale di libri e mazzi, grappoli di cristallo viola, teschio |
| **Erboristeria** | Erborista | terra battuta | bancone, alambicco, mortaio, due scaffali, **tre aiuole allineate**, botte e sacco |
| **Fucina** | Fabbro | lastre rossastre | bancone, incudine, **quattro rastrelliere d'armi**, colata di lava in fondo, braciere, casse |
| **Gilda dei Contratti** | Capitano | lastre | bacheca **TAGLIE**, bancone, due stendardi, scaffali dell'usato, rastrelliera, casse in ordine |

### I mobili e le persone sono ostacoli veri *(novita v1.75.2)*
- Attraversare un tavolo da parte a parte faceva sembrare il villaggio un disegno invece che un posto.
  Adesso **mobili e persone hanno un corpo**: ci sbatti contro e ci giri attorno.
- **Solido**: tavoli, banconi, credenza, scaffali, rastrelliere, incudine, aiuole, alambicco, mortaio,
  casse, botti, sacchi, bracieri, candelabri, cristalli, il cartello, il falo' — e **le persone**, i cinque
  mercanti e le otto comparse.
- **Attraversabile**: cio' che e' basso, appeso o dipinto a terra — tappeti, pozze di lava, ragnatele,
  stendardi, teschi, lanterne (stanno sul soffitto), le pietre attorno al falo' e **gli sgabelli**: solidi
  darebbero solo fastidio fra il tavolo e chi ci gira attorno.
- **Se ti ritrovi incastrato, ti spinge fuori**: si esce dal lato piu' vicino, mai dentro la roccia. Stretto
  *fra due* corpi le spinte si annullerebbero a vicenda, e allora si cerca il punto libero piu' vicino.
- **Vale solo nel villaggio.** Fuori non ci sono mobili, e nelle ondate un secondo insieme di corpi solidi
  in mezzo a mostri e proiettili sarebbe un rischio senza guadagno.
- **La soglia resta sgombra** *(v1.75.3)*. Un mobile appoggiato accanto a una porta, finche' era
  decorazione, non dava fastidio; con un corpo e' uno spigolo che prendi a ogni ingresso. Sono spariti le
  due casse davanti a osteria e taglie e la rastrelliera davanti alla fucina, e un test impedisce che
  qualcosa torni a meno di 1,9 tile da una porta. Tutte e cinque le porte danno lo stesso passaggio
  libero: **98 px**, tre volte e mezzo la larghezza del personaggio; il varco del portale ne da' 146.

### Le persone
- **I mercanti si vedono dall'alto**, come il tuo eroe. Prima erano ritratti frontali: in una mappa vista
  dall'alto stonavano. Adesso nascono dalla **stessa silhouette dei tre eroi** — guerriero, mago, ladro —
  ricolorata mestiere per mestiere e **disarmata**: niente elmo, niente scudo, niente arco, niente bastone.
  In mano tengono solo l'attrezzo del loro lavoro.
- **Ognuno ha il suo alone di luce**, del suo colore (arancio il Fabbro, verde l'Erborista, viola la
  Cartomante, ambra l'Ostessa, rosso il Capitano): e' cosi' che lo riconosci da lontano, al buio.
- **Il Banditore e' diventato il Capitano** della Gilda dei Contratti — un ufficiale che appende le taglie
  e ricompra l'attrezzatura dei caduti. Era il personaggio meno riuscito, un tizio con un cartello. La
  chiave interna resta la stessa: cambia la persona, non l'impianto.
- **Otto comparse** in piedi attorno ai tavoli e per le strade. Non parlano e non vendono, ma senza di loro
  il posto sembrava abbandonato invece che abitato. Sedute non funzionavano: vista dall'alto, una figura
  seduta e' un ovale con una testa sopra.

### Come si aggiunge una stanza
Una riga in `ROOMS` (rettangolo, tipo di pavimento, colore) e una in `LINKS` (il corridoio che la attacca
alla piazza). L'arredo sta in una sezione per stanza dentro `generateMarket`. La mappa espone `floors`, un
rettangolo di pavimento per stanza, che il renderer disegna prima di tutto il resto.

## ❤️ NESSUNA CURA AUTOMATICA *(novita v1.74.1)*
- A ogni fine ondata il gioco curava il **25% dei PV massimi**, in silenzio e gratis: era li' da molte
  versioni e rendeva l'Ostessa un lusso invece che un servizio — bastava aspettare. **Rimosso.**
- I danni **si portano dietro**: per rimettersi in piedi si paga l'Ostessa, si beve una pozione o si
  raccoglie un potenziamento.
- **Chi e' a terra viene comunque rialzato** al 60%: quello non e' curare, e' rimettere in gioco chi
  altrimenti resterebbe fuori per sempre.
- Allineate due porte secondarie: l'offerta "+PV massimi" del **Mercante Errante** e la Benedizione
  "+40 PV" del **Mercante Nero** ora alzano il tetto e basta.
- *(Aggiornato in v1.93: le vie per curarsi sono scese a sei, e **nessuna** passa piu' da una carta, un
  rango, un patto o un pezzo di equipaggiamento — vedi la sezione **NIENTE CURE DALLE ABILITA'**.)*

## 🍺 L'OSTESSA e la regola sui PV *(novita v1.74)*
- Il villaggio e' **completo**: tutte e cinque le botteghe lavorano. L'Ostessa per ora fa una cosa sola,
  rimetterti in piedi; il resto verra'.
- Si paga **a punto vita**: **0,4 monete per ogni PV mancante**. Un prezzo fisso sarebbe un affare quando
  sei quasi morto e uno spreco quando ti manca poco — in nessuno dei due casi una scelta.
- **Se le monete non bastano compri quello che puoi**: con 28 monete ti rende 70 PV. Da li' non si esce mai
  a mani vuote.
- Resta **piu' conveniente della pozione di Cura** (0,4 contro 0,54 a PV): la pozione pero' la bevi in mezzo
  ai nemici, e quella differenza e' il prezzo della comodita'.
- **ALZARE I PV MASSIMI NON CURA PIU'.** Un punto di Costituzione alza il massimo di 20 e non restituisce un
  solo PV (prima ne curava 20); lo stesso vale per le carte **Colosso** (+45) e **Scudo Vitale** (+30).
  Senza questa regola l'Ostessa non avrebbe mestiere. Ci si rimette in piedi in tre modi: pozione di Cura,
  potenziamenti raccolti a terra, Ostessa.
- **Il dettaglio che poteva rompersi.** Spegnere una carta dalla Cartomante abbassa il massimo e taglia i PV
  in eccesso: se riaccendendola non tornassero, ogni giro costerebbe vita. Il taglio quindi non si perde, si
  **segna**, e torna solo quando il massimo risale — mai piu' di quanto era stato tolto. Il riposo comprato
  cancella il segno: quei PV sono gia' stati pagati.

## 🔮 LA CARTOMANTE: cinque carte accese *(novita v1.73)*
- Quarta bottega. Niente previsione delle ondate e niente respec: fa una cosa sola, decidere **quali carte
  tieni accese**, al massimo **cinque**.
- Il limite conta **carte diverse**: Rimbalzo x3 occupa un posto solo, cosi' approfondire una carta resta
  una strategia e non una tassa.
- Se ne scegli una a fine ondata con gia' cinque accese, **la prendi lo stesso ma arriva spenta**: non ti
  blocca mai, e ti da' un motivo per passare dalla Cartomante. Le carte spente **restano tue**.
- Le **sinergie** seguono le carte accese: spegnerne una spegne anche la sinergia che formava.
- **Sotto il cofano.** Fino alla 1.72 le carte si sommavano dentro il personaggio e non uscivano piu'. Ora
  tutto si **ricostruisce da zero** a ogni cambio (statistiche base -> statistiche comprate -> carte accese
  -> sinergie), come gia' faceva l'equipaggiamento dalla 1.67: con effetti che si possono togliere,
  sommare i delta lascerebbe in giro il bonus della carta spenta per sempre.
- Due casi delicati, entrambi sotto test: i **PV** (alzare il massimo cura, abbassarlo taglia, e spegnere e
  riaccendere non e' una pompa di vita) e **Ultima Occasione** (la carica spesa non torna).

## 🧑 IL BOX DEL PERSONAGGIO *(novita v1.73)*
- Fra la barra delle abilita' e la boccetta della vita c'era un vuoto: ora c'e' un box con **nome, livello,
  rango, barra dell'esperienza** e le **cinque caselle delle carte**.
- **Sopra la tua testa non c'e' piu' nulla.** Nome e livello erano scritte fisse in mezzo all'azione. Sopra
  i **compagni** restano: senza, in co-op tre sagome uguali diventano indistinguibili.
- Le caselle **vuote si vedono**: il tetto di cinque e' una regola, e una regola che non si vede non esiste.
- La vecchia barra dei gettoni in basso e' stata **rimossa**: mostrava le stesse icone senza dire a chi
  appartenessero ne' quante se ne potessero tenere accese.

## 🪧 IL BANDITORE: magazzino e taglie *(novita v1.72)*
- Terza bottega ad aprire, e fa due mestieri.
- **MAGAZZINO.** Fino alla 1.71 comprare l'alabarda faceva **sparire nel nulla** lo spadone gia' pagato.
  Ora tutto cio' che compri **resta tuo**: dal **Fabbro** lo rimetti addosso **gratis** (e il negozio lo
  dichiara, *GIA' TUO - GRATIS*), dal **Banditore** lo vendi a **meta' prezzo**.
- Vendere diventa una scelta e non un automatismo: incassi 235 per l'alabarda adesso, ma per riaverla la
  ripaghi 470. **Non si vende** cio' che si ha addosso, ne' l'equipaggiamento di partenza (vale zero e
  toglierlo lascerebbe lo slot senza un fondo a cui tornare).
- **TAGLIE.** Al banco ne trovi **tre**, sempre di tipo diverso, e ne accetti **una**. Vale finche' non la
  completi: **nessuna scadenza**. Le offerte si generano una volta e restano quelle — riavvicinarsi non le
  rimescola, altrimenti sarebbe una slot machine da ripescare finche' non esce quella comoda.
- **Sei tipi**: Caccia grossa (N nemici), Contratto mirato (N di una specie), Teste grosse (N elite),
  Saccheggio (N casse), Catena di sangue (una combo di N), Nessun caduto (un'ondata senza perdere vite).
  Bersagli e paga crescono con l'ondata: all'ondata 6 si va da 91 a 172 monete.
- Una taglia vale circa **due o tre ondate di guadagno** e ne richiede altrettante. Sono **personali**: in
  co-op ognuno ha la sua.
- La taglia accettata resta **visibile in partita**, in alto a sinistra, con la barra di avanzamento: una
  taglia senza scadenza che non si vede mentre giochi e' una taglia che si dimentica.
- Restano chiusi solo **Cartomante** e **Ostessa**.

## 🧪 L'ERBORISTA e la CINTURA *(novita v1.71)*
- Il secondo mestiere del villaggio apre bottega. Vende l'unica cosa del gioco che si **consuma**.
- **Tre slot** in cintura, tasti **1 2 3**, **massimo 3 cariche** per slot. Si beve all'istante mentre corri
  e spari: nessun menu', nessuna finestra, nessuna animazione bloccante. `Q` ed `E` restano liberi per le
  abilita' di classe che arriveranno.
- **Il tipo di ogni slot lo scegli tu** all'Erborista, e li' sta la strategia: 3 slot su 6 pozioni. **Un tipo
  per slot** — niente cintura di sole cure.
- **Sei pozioni**: Cura (40% dei PV, istantanea, 45), Pelle di Pietra (-50% danni, 5s, 40), Fretta (+45%
  velocita', 6s, 30), Furia (+50% danno, 6s, 35), Frenesia (+60% cadenza, 5s, 35), Rigenerazione (10 PV/s,
  8s, 40).
- **Le statistiche contano, una per aspetto**: **Costituzione** quanto curano (al 12 la Cura passa dal 40%
  al 64% dei PV), **Intelligenza** quanto durano (Furia da 6 a 8,9s), **Forza** quanto picchiano Furia e
  Frenesia (+50% -> +68%), **Destrezza** quanto in fretta ribevi (cooldown da 6 a 3,84s).
- **Due freni**: cooldown di 6s **condiviso dai tre slot** (uno per slot si aggirerebbe alternandoli) e
  **nessun cumulo** — la seconda dose fa ripartire il timer, non raddoppia l'effetto.
- **Le cariche si comprano, non si ricaricano.** Cambiare il tipo di uno slot **rimborsa meta'** delle
  cariche rimaste. Le cariche **sopravvivono alla morte**.
- Restano chiusi **Cartomante, Banditore e Ostessa** (il Banditore apre in v1.72). Il quarto banchetto, che nel codice si chiamava
  Rigattiere e nei documenti Banditore, ora e' **Banditore** ovunque.

## 🟣 LA FAGLIA E' SPENTA *(stato attuale, dal v1.78)*

> **La faglia dei margini oggi NON e' attiva.** In `shared/constants.js` la manopola `EDGE_MARGIN` vale
> **0**: nessuna tessera finisce nella fascia, il bordo non drena vita, l'alone viola non compare e sulla
> minimappa non c'e' nessuna fascia segnata. Si puo' stare sul bordo quanto si vuole senza perdere un
> punto ferita.
>
> Le due sezioni piu' sotto (*Il fascio della Faglia*, v1.65, e *La Faglia ai margini*, v1.63) descrivono
> come funziona **quando e' accesa**: il codice c'e' tutto e non e' stato tolto, e' solo a riposo.
> Per riaccenderla basta rimettere `EDGE_MARGIN` maggiore di zero (le altre manopole — `EDGE_GRACE`,
> `EDGE_RAMP`, `EDGE_DPS_MIN/MAX`, `EDGE_RECOVER` — sono al loro posto).
>
> **I test seguono la manopola, non impongono una scelta**: con `EDGE_MARGIN` a 0 verificano che la
> faglia sia spenta *davvero* (nessuna tessera nella fascia, venti secondi sul bordo senza perdere un
> punto ferita, carica a zero); con un valore maggiore di zero verificano che morda come descritto.

## 🔮 Il fascio della Faglia *(novita v1.65)* — *descrizione a faglia accesa*
- L'effetto che segnalava il danno del bordo era troppo discreto: si vedeva appena. Ora e' un **fascio** che
  esce dalla roccia piu' vicina a te, con filamenti che ti **arrivano addosso** e un nucleo che pulsa — la
  stessa lettura del fascio dello sguardo del Beholder, che a colpo d'occhio si capisce sempre.
- I filamenti che **toccano il personaggio** sono la parte importante: collegano la causa all'effetto, cosi'
  e' evidente che a farti male e' **quel muro**, non un malessere generico.
- In un **angolo** partono due fasci, uno per lato.

## ⚡ Prestazioni: via il singhiozzo *(novita v1.64)*
- Con molti nemici il gioco scattava. Misurato: non era **lento** — il frame tipico stava benissimo — ma un
  frame ogni tanto costava sei volte gli altri. La causa erano **trentatremila oggetti al secondo** creati e
  buttati via subito dal disegno, che il sistema doveva poi ripulire tutti insieme.
- Ora quegli oggetti si riusano. Il frame peggiore e' **piu' che dimezzato**.
- Il **Nugolo di Pipistrelli** era da solo il nemico piu' costoso del gioco: le pose del battito d'ali sono
  ora disegnate una volta sola e poi ricopiate. Costa **un quarto** di prima.
- Non viene piu' disegnato quello che sta **fuori dallo schermo**.
- **Nemici in campo: da 8 a 30, secondo l'ondata** *(curva, dalla v1.70)*: l'ondata non diventa piu' corta,
  i nemici in eccesso aspettano il turno ed entrano appena si fa posto — quasi subito, se l'arena e' gia'
  stata piena.
  Si combatte meglio e si capisce meglio cosa sta succedendo.
- La **Faglia** ora si vede anche nel mondo e non solo a schermo: il bordo della mappa e' tinto di viola sulla
  roccia — piu' carico negli angoli — e quando la carica sale ne escono **tentacoli**, dal lato piu' vicino a te.

## 🟣 La Faglia ai margini *(novita v1.63)* — *descrizione a faglia accesa*
- Restare attaccati al **bordo esterno** della mappa era il modo piu' facile di rompere il gioco: con le
  spalle coperte dalla roccia i nemici potevano arrivare solo da un ottavo di cerchio. Misurato: nell'angolo
  si subivano **4,8 volte meno danni** che al centro.
- Ora il bordo **ti consuma**. Non subito: hai due secondi e mezzo per uscirne (uno e mezzo in un angolo),
  poi la faglia comincia a drenarti vita, e piu' resti piu' morde. **Uscire la ferma all'istante**:
  attraversare il margine non costa niente, viverci si'.
- Ti **avvisa prima di farti male**: un alone viola si chiude dai bordi dello schermo appena entri nella
  fascia, molto prima del primo danno, e la fascia e' segnata sulla minimappa.
- Nella sala del **Mercato** la faglia e' spenta.
- **Casse e armi compaiono solo nella zona centrale**: ogni ondata c'e' un motivo per attraversare la mappa,
  non solo un motivo per non stare fermo sul bordo.

## 🔥 Il terreno conta *(novita v1.62)*
- **Pozze di pericolo** in ogni mappa: lava nelle caverne, ghiaccio nelle cripte gelate, melma nelle rovine.
  Ti fanno male se ci resti dentro — ma le fanno anche ai mostri, quindi diventano un'arma se sai attirarli.
- Non possono **mai** chiudere un passaggio: nascono solo dove c'e' spazio per aggirarle. Non ti costringono
  mai a incassare danno per passare.
- **Non si parte piu' sempre dallo stesso punto** e non si esce piu' sempre dallo stesso angolo. Sembra poco,
  ma era il motivo per cui il percorso mentale di ogni partita era identico.
- **Piu' oggetti sparsi** fra una zona tematica e l'altra: la differenza fra una stanza arredata e una stanza
  che sembra vissuta.
- Ogni zona ha un **nome** ("Cripta Dimenticata", "Caverne di Lava", "Tempio Arcano"): erano gia' scritti nel
  gioco da sempre e non li vedeva nessuno.

## 🦇 Lo sciame e il fuoco fatuo *(novita v1.61)*
- **Nugolo di Pipistrelli**: non e' un nemico, e' **nove pipistrelli** che si muovono insieme. Poca vita, ma
  arriva prima di quanto tu possa allontanarti, e **non vola dritto**: serpeggia, quindi sparare dove si trova
  non basta — bisogna sparare dove sara'.
- **Fuoco Fatuo**: **passa attraverso la roccia**. E' l'unico nemico contro cui mettersi al riparo non serve a
  niente; in compenso e' lento, e la risposta giusta e' continuare a muoversi. Quando ti raggiunge ti **succhia
  vita e si cura** con quella che ti ha tolto.
- Nessuno dei due ha un'immagine: sono matematica, come il Fungo e la Sfera d'Ossa. Il vincolo tecnico
  (niente animazioni di camminata complesse) e' di nuovo il criterio con cui sono stati scelti.
- Il **Nugolo entra dall'ondata 6**, il **Fuoco Fatuo dall'ondata 8** *(v1.61.1)*. In quest'ordine perche' il
  Nugolo insegna a **guidare il tiro** e il Fatuo **toglie il riparo**: prima si impara una risposta, poi si
  scopre che contro qualcosa non basta. Ora c'e' un archetipo nuovo per ogni ondata dalla 1 alla 8.
- Il **Fungo Sporifero** non si sposta piu' se lo urti: e' piantato per davvero.

## 🪓 Il Troll smette di essere legnoso *(novita v1.60)*
- Con le lastre nuove, tre difetti che sembravano di disegno erano in realta' **di numeri**, trovati misurando
  i fotogrammi uno per uno: l'attacco era ancorato 11px troppo in alto (il troll *saltava* colpendo), la
  martellata si vedeva **tre fotogrammi prima** del momento in cui il danno arriva davvero, e il passo andava
  a cadenza fissa mentre il corpo si muoveva a un'altra velocita' (i piedi slittavano).
- Ora le tre animazioni poggiano sulla stessa linea, l'impatto coincide con il danno, e il **passo e'
  agganciato alla distanza percorsa**: se il troll rallenta o accelera, la camminata lo segue.
- I passaggi fra fermo, cammino e attacco hanno una **dissolvenza**, e il cambio di direzione e' un giro
  invece di uno specchiamento istantaneo.
- Il **Beholder** compare dall'ondata 10 invece che dalla 15.

## 👁️ Il Beholder smette di essere una boa *(novita v1.59)*
- Gli **eyestalks** non sono piu' sette aloni fissi: sono **steli curvi** che ondeggiano ognuno con la sua
  frequenza, spuntano da dietro il bulbo e hanno un occhietto con pupilla in punta.
- **Ammicca** a intervalli irregolari, e l'iride **scatta** verso il bersaglio invece di inseguirlo in modo
  continuo: e' lo scatto a farlo sembrare vivo.
- **Si inclina** nella direzione in cui si muove, invece di ondeggiare sempre uguale.
- Poco prima di cambiare tipo di sguardo **si contrae e drizza gli steli**: il cambio ora si vede sul corpo,
  non solo dal colore del fascio.
- Tutto questo senza nessuno sprite nuovo.

## 👾 Tre aggiunte al bestiario, nessuna con le gambe *(novita v1.58)*
- **🍄 Fungo Sporifero** (dall'ondata 5): **non si muove mai**. Se ti vede semina zone di spore telegrafate
  dove ti trovi. E' il primo nemico che rende pericoloso restare fermi.
- **💀 Sfera d'Ossa** (dall'ondata 7): si carica, poi **rotola in linea retta** rimbalzando sui muri e
  travolgendo chi trova. Ti obbliga a schivare di lato, cosa che nessun altro nemico faceva.
- **🟢 La Melma Corrosiva si divide**: alla morte lascia due **Melme Minori**. Le minori non si dividono a
  loro volta.
- **👁️ Il Beholder e' stato messo al guinzaglio**: compare solo dall'**ondata 15** e non piu' di **8 alla
  volta**. Il tetto vale anche in Sopravvivenza.
- Entrambi i nemici nuovi sono disegnati **senza sprite e senza cicli di camminata**: uno sta fermo,
  l'altro rotola. Il vincolo tecnico e' diventato il criterio con cui sono stati scelti.

## ⛏️ Il mercato e' una SALA SCAVATA *(novita v1.57 — SUPERATA dalla v2.0: vedi IL VILLAGGIO SOTTERRANEO)*
- Siamo **sottoterra**, e ora si vede: niente case, alberi o staccionate. Il mercato e' una **camera scavata
  nella roccia**, con pareti quasi nere. Fuori dalla sala non c'e' mappa: c'e' pietra piena.
- **Un solo varco**, a sud, largo tre tile, su un corridoio corto con il **portale EXIT** in fondo.
- **Buio, e la luce nasce dal falo'** al centro: un unico grande alone circolare scopre i cinque banchetti e
  si spegne contro le pareti. Le lanterne appese ai pali dei banchi fanno da luci di appoggio.
- **Cinque banchetti** a ferro di cavallo attorno al fuoco — bancone, tendone a strisce, lanterna e merce
  diversa per mestiere — **piu' grandi dei mercanti**. Dalla v1.74 lavorano **tutte e cinque**: **Fabbro**,
  **Erborista**, **Banditore**, **Cartomante** e **Ostessa**.
- I **mercanti** sono al doppio della taglia e piu' dettagliati (mantellina, cintura, pieghe, mani, occhi
  accesi, l'attrezzo del mestiere), e stanno **dietro** al proprio banco.
- Nel menu di pausa il pulsante e' **"VAI AL VILLAGGIO"**, affiancato a quello dell'ondata successiva.

## 🏘️ Il mercato e' un VILLAGGIO *(novita v1.56 — SUPERATA dalla v1.57 e poi dalla v2.0)*
- La sosta ha una **mappa sua**, disegnata a mano: **32x24 tile** contro le 46x34 del combattimento (circa la
  **meta'**), **senza muri interni**. Gli unici ostacoli sono i cinque edifici, che sono blocchi solidi.
- **Cinque costruzioni** attorno a una piazza col pozzo: **Fucina, Locanda, Magazzino, Cappella e Torre della
  Gilda**, ognuna con tetto, finestre illuminate, insegna sopra la porta, lanterna e targa col nome.
- **Cinque abitanti, tutti al lavoro**: **Fabbro** (equipaggiamento), **Erborista** (pozioni, v1.71),
  **Banditore** (usato e taglie, v1.72), **Cartomante** (carte, v1.73) e **Ostessa** (riposo, v1.74) — e lo dichiarano — pronte a diventare
  le prossime destinazioni.
- Il villaggio e' **illuminato**: niente torcia, niente buio. La piazza e' ripulita dai detriti da caverna;
  restano pozzo, lampioni, banchi, casse, barili, alberi, staccionate e il cartello MERCATO.
- Si arriva da sud: il fabbro e' a 7 tile, il portale **EXIT** a 13, con la via centrale sgombra.

## ✦ Costi XP a tabella: primi sei x3, ultimi due x2 *(novita v1.55)*
- Scaletta dei costi con base 10: **90 · 144 · 198 · 555 · 1551 · 4347 · 4926 · 8374**. Il primo livello costa
  90 contro i ~130 XP della prima ondata: se ne compra uno solo, e va scelto.
- Portare **una sola** statistica al tetto costa **20.185 XP**, piu' di quanta se ne raccolga in una run intera
  (~18.000). L'albero completo, 121.110, e' fuori portata per progetto: non esiste una run che massimizzi tutto.
- I costi sono una **tabella** di moltiplicatori, uno per livello, non una formula: si ritocca il singolo
  livello senza deformare il resto della curva.
- *Nota:* il 7° livello costa solo il 13% piu' del 6°, mentre ogni salto precedente e' +180%. E' un gradino
  piatto voluto dal ritocco (tronco x3, coda x2): se in partita sembra regalato, e' il primo numero da alzare.

## ✦ Esperienza: tronco triplicato, coda smorzata *(novita v1.54)*
- I **primi sei livelli** di ogni statistica costano il **triplo** di prima: con base 10 la scaletta e'
  **30 · 48 · 66 · 185 · 517 · 1449**. La prima ondata frutta circa 56 XP e il primo livello ne costa 30, quindi
  si decide dove spendere fin dall'inizio.
- Il **settimo** livello e' adeguato al nuovo tronco (2.463) e l'**ottavo** solo ritoccato (4.187): la coda e'
  volutamente smorzata, altrimenti gli ultimi due livelli sarebbero irraggiungibili in qualsiasi partita.
- *(Superata dalla v1.55, che ha triplicato ancora il tronco e raddoppiato la coda — vedi sopra.)*

## 🎯 Il mercato si sceglie, il portale si vede, l'esperienza costa *(novita v1.53)*
- **Destinazioni nel menu di pausa.** Fra un'ondata e l'altra, dopo la carta e il negozio XP, scegli dove
  andare: **prossima ondata** oppure **dal fabbro**. Il mercato non arriva piu' a cadenza fissa: ci vai quando
  ti serve, a qualunque ondata. In co-op vale la scelta di chi preme per primo.
- **Il portale EXIT si vede.** Nella mappa del mercato il fabbro sta a poche tile dal punto in cui atterri e il
  portale poco oltre, dalla parte opposta: prima compri, poi esci. Prima l'uscita era la cella piu' lontana dal
  centro della mappa, quindi fuori schermo.
- **Esperienza molto piu' cara.** Curva spezzata in due regimi: primi 3 livelli quasi lineari, poi x2.8 a
  livello. *(Superata dalla v1.54, che ha triplicato tutto il tronco — vedi sopra.)*

## 🏪 Il MERCATO: l'Emporio diventa un luogo *(novita v1.52)*
- Ogni **3 ondate** si entra in una **mappa di sosta senza nemici**. Al centro c'e' il **fabbro
  dell'equipaggiamento**: i 3 slot (Armatura, Stivali, Arma) si potenziano avvicinandosi a lui, non piu' da un
  pannello a fine ondata. Si prosegue entrando nel **portale EXIT**, evidenziato con colonna di luce ed etichetta.
- La sosta e' **interstiziale**: non consuma un numero d'ondata, quindi i boss restano ogni 5 e il mercato li
  **segue**. E' anche il momento in cui hai piu' monete: il grosso del bottino di una run arriva dai boss.
- Nel mercato **non** ci sono casse (una cassa-mima sarebbe un nemico in una stanza che promette sicurezza) ne'
  il **Mercante Errante**, che resta l'incontro nascosto delle ondate normali con le sue offerte uniche.
- **Co-op:** il **primo** che entra nel portale porta avanti tutti; in multiplayer c'e' un timeout anti-AFK.
- **Fix:** Mercante Errante e Mercante Nero erano **invisibili in mappa** (non venivano mai disegnati); ora si
  vedono, col beacon e il marker sulla minimappa.

## 🎴 Level up fra le ondate, rivisto *(novita v1.51)*

Il momento fra un'ondata e l'altra chiedeva **tre** decisioni (potere, statistiche a XP, equipaggiamento a monete),
ma una sola era davvero una scelta. Ora il potere torna protagonista e il negozio XP costringe a specializzarsi.

- **Si sceglie 1 potere su 3.** Erano 2 dalla v1.10, mentre il catalogo cresceva: piu poteri e meno pescate
  significa vedere una frazione sempre piu piccola del gioco. Le carte tornano tre, la scelta resta una.
- **Dieci poteri nuovi** (catalogo 23 → **33**), ognuno pensato per cambiare *come* giochi, non solo di quanto:

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

- **Due nuove sinergie:** 🎯 **Cacciatore di Teste** (Colpo di Grazia + Piede di Porco → soglia di esecuzione piu
  alta) e 🌊 **Onda d'Urto** (Rappresaglia + Aura di Spine → onda molto piu ampia).
- **Negozio XP molto piu severo.** Costi da `1.55^n` a `2.05^n` e **tetto di 8 livelli** per statistica.
  Massimizzare l'intero albero passa da 3.526 a **17.768 XP**, contro le ~7.528 raccolte in una run intera: ne
  massimizzi al piu una parte, e la **combo** (che moltiplica l'XP fino a x2.5) decide quanta. Le carte mostrano
  `Lv.3/8` e diventano **MAX ★** quando la statistica e esaurita.
- **Emporio a monete nascosto** in attesa di ridisegno. Non e stato rimosso nulla: le monete cadono ancora e i
  **mercanti** in mappa restano il modo per spenderle.
- **Barra dei poteri attivi** sopra la barra abilita: ogni potere posseduto con icona, colore della rarita e
  moltiplicatore, sinergie evidenziate, descrizione al passaggio del mouse.
- Test: **273 passati, 0 falliti**, piu la nuova suite `test/client.js` che verifica l'interfaccia con un DOM finto.

## 🧭 Consolidamento: curva di difficolta, elite tarati, documentazione *(novita v1.50)*
- **Curva di introduzione dei nemici ripristinata.** Gli archetipi tornano a entrare **scaglionati**: 🟢 Zombie
  Putrido (ondata 1) → 🟢 Melma Corrosiva (2) → 🟣 Negromante (3) → 🟠 Troll delle Caverne (4) → 👁️ Beholder (6,
  dopo il primo boss). Le comparse "dal primo stage" introdotte in v1.44 e v1.49 erano **temporanee**, servivano a
  valutare i nuovi sprite: erano rimaste nel codice e appiattivano la rampa di difficolta.
- **Elite tarati sui nemici robusti.** Il moltiplicatore PV degli elite e ora dichiarato **per nemico**
  (`def.eliteHp`, default 2.4 invariato). Il **Troll** usa 1.5 e il **Beholder** 1.9: un Troll elite all'ondata 4
  scende da ~845 a ~528 PV, cifra sostenibile con l'equipaggiamento di quel punto della run.
- **Documentazione riallineata** e **checklist di release** aggiornata: il commit git sostituisce il vecchio
  "ripacchettizza come .txt", e `ROSTER.md` entra finalmente nella lista dei file da aggiornare a ogni versione.
- Test: **256 passati, 0 falliti**.

## 👁️ Beholder: l'Occhio Tiranno torna nel roster *(novita v1.49)*
- Reintrodotto l'**Occhio Vagante** come **BEHOLDER**: bulbo oculare fluttuante con **eye-stalks** e **tentacoli
  tutt'intorno**. **Non spara**: il suo attacco e lo **SGUARDO** — se entri nel suo **campo visivo** subisci un
  **debuff** che si rinnova finche resti in vista.
- **Eyestalks che RUOTANO:** alterna ciclicamente i tre sguardi (**weaken** = attacco indebolito, **slow** =
  velocita ridotta, **sunder** = meno difesa) ogni ~4s; il **fascio cambia colore** col tipo attivo.
- **Reso col metodo RASTER PUPPET** (illustrazione ritagliata → manifest + profilo, come gli altri mostri puppet):
  render dedicato con **iride centrale che segue** il bersaglio, **pupilla che si dilata** in attacco, **eyestalks
  che avvampano** nel colore dello sguardo e **edge-glow** magenta.
- tier 3, 130 PV, gittata 340. Nel pool dal primo stage (per valutazione). Test: **246 passati, 0 falliti**.

## 🐛 Fix Troll: cammina davvero + ombra ai piedi *(novita v1.48)*
- **Camminata**: i mostri **lenti** (Troll) non restano più in **idle mentre scivolano** — soglie del rilevamento
movimento abbassate con **isteresi** (0.28/0.10): walk/idle ora si attivano correttamente.
- **Grounding**: lo sprite-sheet non **fluttua** più e disegna la **propria ombra ai piedi** (prima riceveva l'ombra
generica ~28px troppo bassa, che lo faceva sembrare sospeso). Test: **234 passati, 0 falliti**.

## 👹 Troll delle Caverne: SPRITE SHEET animato *(novita v1.47)*
- Il **Troll delle Caverne** (ex Bruto) ora usa un **vero sprite sheet** frame-by-frame disegnato a mano (3 fogli 5×5
@256px: idle, walk, attack) → **camminata naturale** e **martellata** completa; **mirror L/R** per la direzione.
- Nuovo **motore sprite-sheet** (`SHEETS`+`_drawSheet`): stato→animazione, frame dal tempo/fase d'attacco, ancoraggio
ai piedi, ombra a terra + hit-flash. Il danno/scossa dello slam scatta al **72%** dello swing (coincide con l'impatto).
- Test: **234 passati, 0 falliti**.

## 👹 Bruto senza tremore + 🟢 Melma TOP-DOWN *(novita v1.46)*
- **Bruto**: camminata **rifatta** senza "parkinson" — un solo dondolio lento, braccia enormi **in sincronia**, piede
che si **solleva morbido**, fase continua; rilevamento movimento con **isteresi** (i mostri lenti non tremolano più).
Parti ritagliate meglio.
- **Melma Corrosiva**: ora in **vista TOP‑DOWN** — una **pozza fluo** che striscia sul pavimento (wobble gelatinoso +
edge‑glow pulsante), con **sputo di bolle d'acido** ad alto danno invariato. Morte: la pozza si restringe e svanisce.
- Test: **226 passati, 0 falliti**.

## 🟢 Melma: striscia + salta e sputa acido *(novita v1.45)*
- La Melma ora **striscia** lenta (onda peristaltica, resta a terra: **niente più saltelli**); il **salto** avviene
**solo in attacco**, quando **sputa un ventaglio di bolle d'acido ad ALTO danno** a distanza ravvicinata (IA blob).
- Nuovo **sprite senza bocca** + **edge‑glow** verde; **occhi che si illuminano nella direzione di movimento**.
- Test: **226 passati, 0 falliti**.

## 🟢 Melma Corrosiva (squash & stretch) + Bruto affinato *(novita v1.44)*
- **Melma Corrosiva** (4° puppet): blob acido reso con **UN pezzo** in **squash & stretch** (idle jiggle, saltello che
si appiattisce a terra/allunga in aria, attacco che comprime→schizza). Effetti: **aura verde** pulsante, **nucleo verde
acido** al centro, **occhi che avvampano** al colpo, **bolle acide** che salgono. tier 1, 90 PV. Nel pool dal 1° stage.
- **Bruto**: la camminata **solleva i piedi** (falcata più ampia, passo leggibile); **slam più impattante** (doppia onda
d'urto + polvere + hit-stop + scossone forte).
- Test: **221 passati, 0 falliti**.

## 👹 Bruto ridisegnato, vagabondaggio & anti-incastro *(novita v1.43)*
- **Bruto**: camminata **lumbering** distinta dallo zombie (braccia in sincronia + waddle) e **SLAM overhead** (alza i
pugni sopra la testa → schianto a terra ad **area** con forte **respinta**) quando entri nel suo **campo visivo**.
- **Vagabondaggio**: i nemici che **non ti vedono** ora **vagano a caso** per la mappa; ti inseguono quando ti individuano
e **investigano** l'ultima posizione nota prima di tornare a vagare.
- **Anti-incastro** per **tutti** (boss compresi): rilevatore di wedge + recupero/scivolamento; 0 mostri nei muri, boss 100%.
- Test: **213 passati, 0 falliti**.

## 👹 Bruto delle Caverne: tank PUPPET con slam ad area *(novita v1.42)*
- **Bruto delle Caverne** (3° puppet, tank): enorme e lento, **braccia enormi** con grande dondolio in camminata e
**SLAM ad area** in due tempi (carica → schianto del busto in avanti/giù) con onda d'urto e respinta. tier 2, 220 PV,
vel. 60, danno 28, raggio slam 96. Nel pool dall'ondata 4.
- **Artwork del bestiario** aggiunti in `public/assets/art/` (overview + concept del Bruto); scheda `ROSTER.md` aggiornata.
- Incluso: sfere del Negromante **+30%** (projSpeed 250→325, da v1.41). Test: **206 passati, 0 falliti**.

## 🧙 Negromante PUPPET + motore puppet generico + migliorie *(novita v1.39)*
- **Negromante** (2° puppet, mago incappucciato): fluttua, **evoca zombi minori** (tetto 4) e **spara sfere debilitanti**
  (curse) **solo quando entri nel suo CAMPO VISIVO** (cono fov con telegrafo). Nel pool dall'ondata 3.
- **Motore puppet generico** (`PUPPETS[key]`+`PROF[key]`): aggiungere un nemico = "manifest + profilo".
- **Migliorie a tutti i puppet:** hit-reaction (squash + rinculo), **morte con crollo dei pezzi**, inclinazione nel
  movimento, ombra dinamica che si allunga, **tint per gli elite**.
- Test: **193 passati, 0 falliti**.

## 👁️ Occhi che avvampano al colpo · via il cerchio verde *(novita v1.38)*
- Quando lo Zombie Putrido viene **colpito**, gli **occhi verdi avvampano** (feedback di danno); un lampo verde
  anche se colpito **di spalle**.
- Rimosso il **cerchio/disco verde** attorno al nemico: il veleno si vede solo dalle particelle; l'alone dei puppet
  è ora molto tenue (niente anello verde).

## 🧟 Roster essenziale: SOLO lo Zombie Putrido (render PUPPET) *(novita v1.37)*
- **Un solo nemico d'ondata**: rimossi Negromante, Spettro e Occhio Vagante. Lo **Zombie Putrido** è ora reso col
  **RENDER PUPPET** (6 pezzi PNG scomposti + overlay vettoriale) e **sostituisce** il vecchio zombie vettoriale.
- **Attacco in due tempi** (carica → colpo) con **affondo del corpo in avanti**; **camminata più aggressiva e lenta**.
- **Ombra a terra sfocata** alla base dei piedi per radicare il mostro sulla mappa (niente più effetto "appiccicato").
- Test: **190 passati, 0 falliti**.

## 🩹 Troll rimosso · Mercante Nero riempito · Occhio Vagante "Sguardo" *(novita v1.34)*

- **🗑️ Troll delle Caverne rimosso** dal roster (sprite non soddisfacente): tolto da `MONSTERS`, dall'`ORDER` e dal
  pool ondate, che scende a **4 archetipi** (Zombie · Spettro · Negromante · Occhio Vagante).
- **🖤 Fix Mercante Nero "vuoto"** — il box appariva **centrato ma senza offerte**. Causa: `HUD._renderMerchant()`
  gira a ogni snapshot per aggiornare le monete e faceva `innerHTML=''` **ricreando le card ogni frame**; le card del
  Nero hanno l'animazione `darkCardIn` (opacity 0→1 con delay) e, ricreate di continuo, restavano a **opacity 0**.
  Ora le card si **ricostruiscono solo al cambio offerta**; ogni frame si aggiornano solo monete e stato "acquistabile".
- **👁 Occhio Vagante — attacco "Sguardo" (gaze debuff)** — l'occhio **non spara più**. Applica un **debuff** a chi entra
  nel suo **campo visivo** (cono attorno alla direzione dello sguardo, in gittata e con **LOS libera**), rinnovato finché
  resti in vista. Tre tipi (uno fisso per ogni occhio): **weaken** (attacco indebolito), **slow** (velocità ridotta),
  **sunder** (meno difesa). Grafica: **sprite -20%**, **tentacoli tutt'intorno** al bulbo, **fascio/cono** colorato per
  tipo e **aura tratteggiata** sul giocatore debuffato. IA `gazer` (sostituisce `strafer`). Test: **176 passati, 0 falliti**.

## 👻 Bestiario ampliato: Spettro & Occhio Vagante *(novita v1.32)*

Due nuovi archetipi si aggiungono al roster frontale, più la rifinitura di Troll e Mercante Nero:

- **👻 Spettro** — figura eterea/translucida: **cappa spettrale** che sfuma in **code ondulate**, scie/wisp emissive,
  artigli protesi e **occhi ardenti**; il corpo "respira" con alfa animata. IA **`wraith`**: avanza rapido in mischia
  e periodicamente **"sfasa" (phase-blink)** verso il bersaglio, riemergendo alle sue spalle **attraverso gli ostacoli**
  (poi un breve stordimento). *Tier 2 · 92 PV · veloce · nel pool dall'ondata 2.*
- **👁️ Occhio Vagante** — grande **bulbo oculare** fluttuante con **eye-stalks** superiori (piccoli occhietti su stelo),
  **tentacoli** inferiori, aura emissiva, vene rosse, **iride che segue** e **pupilla che dilata in attacco**, palpebre
  carnose a mandorla. IA **`strafer`**: orbita a distanza e scaglia **raggi arcani**. *Tier 3 · 118 PV · gittata 320 ·
  nel pool dall'ondata 4.*
- **🪓 Troll rifinito** — braccia massicce **senza mani/artigli**, **occhi rossi** (niente fascia-occhi né zanne),
  passo e respiro animati, slam invariato.
- **💀 Mercante Nero "al top"** — veste con gradiente, **bordo runico pulsante**, spalle a punta bordate, cappuccio
  definito, volto-teschio con **occhi viola ardenti** e **mani ossute** che presentano la merce; beacon a **doppia
  colonna** (viola + cremisi) e anello pulsante.

Pool ondate a **5 archetipi**: Zombie · Spettro · Negromante · Occhio Vagante · Troll. Test: **177 passati, 0 falliti**.

---

## 👾 Bestiario essenziale in vista frontale *(novita v1.30)*

Il roster è stato **ridotto a tre soli archetipi**, tutti ridisegnati come **billboard frontali** (guardano la camera,
si specchiano verso il movimento, mostrano il dorso allontanandosi) e ridipinti in **grigio molto molto scuro** con
**occhi/accento luminosi** per la personalità:

- **🧟 Zombie Putrido** — corpo ingobbito, braccia penzolanti con mani ad artiglio, occhiaie nere con bagliore verde,
  **mascella che si spalanca** in attacco, ferite e suture.
- **🧙 Negromante** — veste a campana con orlo ondeggiante e **rune luminose**, colletto, **cappuccio-vuoto** con occhi
  viola, **cappello a punta** e **bastone con orbe** che divampa durante il cast.
- **👹 Troll delle Caverne** — torso a masso, **braccia lunghissime** con pugni enormi e artigli, gambe tozze, **zanne**
  e occhi ambra; solleva il pugno per lo **slam**.

Sono stati **rimossi** Orco, Assassino d'Ombra, Piccolo di Viverna, Lich e il Drago regolare dal bestiario giocabile.
La **Bestia Mimica** è **mantenuta esclusivamente come cassa** (cassa-mima + modalità Tesoro): non compare mai tra i
nemici delle ondate, solo quando una cassa si rivela un mimic. I **boss** restano invariati e continuano a evocare
Zombie. Test: **175 passati, 0 falliti**.

---

## 🧙 Negromante tattico: proiettili in vista, evocazioni al buio *(novita v1.29)*

Il **Negromante** ora **legge la linea di vista** verso il bersaglio e cambia tattica di conseguenza:

- **Nel campo visivo** (LOS libera **e** entro gittata) → lancia **proiettili magici** (colpo singolo, con un
  **ventaglio da 3** ogni terzo tiro) mantenendo le distanze in kiting, e continua ad **applicare la maledizione**.
- **Fuori vista** (giocatore nascosto dietro i muri) → **evoca scheletri** (2 alla volta, ogni 8s) e **avanza** verso
  la tua ultima posizione per **stanarti** e riottenere la linea di tiro.

L'evocazione mostra ora un **anello viola** (colore del Negromante). Comportamento IA dedicato `necromancer`.

---

## 💀 Maledizione del Negromante & cunicoli a prova di boss *(novita v1.28)*

Il **Negromante** ora lancia incantesimi che **fanno danno e maledicono**: per **4,5s** il colpito è **indebolito**
(danno −40%, velocità −20%) e vede la notifica **"SEI STATO MALEDETTO"** con un'aura viola.
Sul fronte mappa, una nuova passata **garantisce corridoi di almeno 3 tile (144px)**: così **tutti i boss**, mega
dragon compreso, passano ovunque (**100%** delle mappe verificate, prima 83%). I blob-caverna restano intatti.

## 🦾 Braccia ai lati & roster aggiornato *(novita v1.27)*

Le braccia dello **Zombie Putrido** scendono ora **lungo i fianchi** a riposo e si protendono in avanti **solo in
attacco** (niente più effetto "insetto"). Il **Predone Goblin** è stato **rimosso** dal gioco: il Signore della
Guerra evoca ora **Zombie**, e ondate/fallback usano lo Zombie Putrido. Roster attuale: **9 nemici** standard + 3 boss.

## 👹 Nemici ridisegnati + animazioni attacco/morte *(novita v1.26)*

Tre nemici sono stati **ridisegnati** in stile dark-fantasy vettoriale, con nuove **animazioni di attacco e morte**
(oltre a idle e camminata già presenti). **Canvas 2D puro, zero dipendenze.**
- **🧟 Zombie Putrido** — braccia protese, occhi neri vuoti, morso in attacco; strascica verso i giocatori.
- **🧙 Negromante** — cappuccio con occhi viola, bastone con orbe che **divampa** quando evoca.
- **🪓 Orco Berserker** — ascia a doppia lama, zanne, occhi rossi; **alza e cala l'ascia** in attacco.
- **Morte**: ogni nemico **crolla e svanisce** (il negromante si **dissolve in volute viola**).

Per ora sono coinvolti **solo questi 3** nemici.

## 🗿 Terzo lotto di oggetti scenografici *(novita v1.25)*

Aggiunti **6 nuovi oggetti** distribuiti come **zone tematiche** legate ai biomi (cap 3-4 per tipo): **ponti di
legno**, **scale a chiocciola** (scendono nel buio), **pozzi/cisterne** (acqua luminosa), **grate/inferriate**,
**cristalli giganti** (landmark luminoso) e **statue rituali con gemma** (luminosa). Con i tre lotti la mappa
dispone ora di **18 oggetti scenografici** totali, sempre coerenti col tema. **Canvas 2D puro, zero dipendenze**.

## 🗿 Secondo lotto di oggetti scenografici *(novita v1.24)*

Aggiunti **6 nuovi oggetti** distribuiti come **zone tematiche** legate ai biomi (cap 3-4 per tipo): **archi
diroccati**, **stalattiti** dal soffitto, **forche/patiboli** con teschio, **obelischi arcani** (rune pulsanti +
glow), **lanterne appese** (che illuminano) e **macchie di sangue** a terra. Insieme al primo lotto (v1.23) la
mappa ha ora un'ampia varieta scenografica, sempre coerente col tema. **Canvas 2D puro, zero dipendenze**.

## 🖤 Muri neri, terreno vivo & nuovi oggetti *(novita v1.23)*

I **muri** sono ora **quasi neri** (contrasto 0.15) e si staccano nettamente dal pavimento; il **terreno** e meno
"piatto" grazie a **rocce, massi, ciottoli e buche** sparse. Le vecchie rune pulsanti sono state **rimosse** in
favore di **2-3 crepe grandi** (spaccature profonde). Primo lotto di **6 nuovi oggetti scenografici** distribuiti
per **tema**: **stalagmiti**, **pile di teschi**, **macerie**, **ragnatele giganti**, **cristalli luminosi** e
**altari rituali** (con luce), sempre col **cap 3-4 per tipo**. Gli **animaletti** sono piu grandi (~2x). Il
**Mercante Errante** e stato corretto (il click ora funziona) e reso **piu visibile** (beacon dorato sempre acceso +
marker sulla minimappa). Tutto in **Canvas 2D puro, zero dipendenze**.

## 🕳️ Caverna organica, ombre & animaletti *(novita v1.22)*

La mappa torna a una **conformazione organica** (caverna varia con anfratti e nicchie), piu interessante del layout
a stanze; la **connettivita e garantita**. I **muri** hanno **contrasto 0.50** e una **ombra marcata** al confine col
pavimento (linea di contatto scura) per uno **stacco** netto. Piccoli **animaletti** (ratti, ragni, scarafaggi)
sfrecciano sul pavimento evitando i muri. Le **decorazioni** sono ora a **cluster coerenti** (cimitero, ossario,
deposito, fungaia, gabbia) con **max 3-4 istanze per tipo** — solo le **torce** ai muri restano numerose. Aggiunte
**casse scenografiche**: circa il **30% delle casse** può rivelarsi un **mimic** (unica fonte di mimic, insieme alla
modalità Tesoro) — **dalla v2.5 la quota è scesa al 6%**, vedi *Il mimic è una rarità*. Tutto in **Canvas 2D puro,
zero dipendenze**.

## 🌫️ Muri scuri, nebbia & rune *(novita v1.21)*

I **muri** sono ora **molto piu scuri** (quasi neri, ~30% del colore del tema), cosi si **distinguono nettamente**
dal **pavimento** (invariato). L'atmosfera e arricchita da una **nebbia volumetrica a strati** che deriva lentamente
e da **rune/crepe che pulsano** sul pavimento — decal luminose (crepe ramificate e sigilli) del colore del tema, con
glow additivo, visibili anche nel buio della torcia. **Rimossi** laghi/pozze, colonne, pilastri e statue; restano
bracieri, gabbie, depositi e fungaie bioluminescenti. Tutto in **Canvas 2D puro, zero dipendenze**.

## 🏛️ Stanze, pozze-lago & decorazioni *(novita v1.20)*

Ogni livello ha ora un **layout a stanze**: una **stanza centrale grande** con **4 stanze angolari** (NO/NE/SO/SE)
collegate da **corridoi larghi 3 tile**, cosi il **boss di fine livello passa ovunque** e i nemici non si incastrano
(connettivita garantita). Le **pozze** sono ora **1-2 per mappa**, di **forma organica tipo lago** (colore desaturato,
profondita al centro), del colore del tema. Le mappe sono arricchite di **decorazioni bilanciate**: **bracieri** e
**candelabri** (che illuminano), **funghi bioluminescenti** (glow nel buio), **casse/barili/sacchi**, **statue
demoniache** con occhi luminosi, **gabbie sospese con scheletro** e **pilastri**.

## 🪨 Texture roccia & stanze *(novita v1.19)*

Pavimento e muri usano ora una **texture roccia realistica** generata proceduralmente: **rilievo/bump** (una heightmap
a rumore illuminata da luce direzionale, con creste chiare e incavi scuri), **domain warping** e **Voronoi** per massi
irregolari e crepe organiche (niente griglia), piu **umidita** e **muschio**. E' **colorata sul tema** e generata una
volta per mappa come pattern — **Canvas 2D puro, zero dipendenze**. La mappa e anche **meno "quadratona"**: nuovi
**tramezzi con varchi** creano **stanze minori attigue** comunicanti (con **connettivita garantita**). Il **glow**
(bloom) e stato **rimosso**; restano la modalita **torcia** (tasto `L`) e l'alone tondo attorno all'eroe.

## 🕳️ Caverna: terra, roccia & pozze *(novita v1.18)*

L'ambiente ha ora un vero look da **caverna**: **pavimento "terra"** e **muri "roccia"** organici (mottling morbido,
crepe, ombre ai bordi) **senza griglia** ne piastrelle. Le **pozze** (acido/fuoco/freddo/arcano, del colore del tema)
sono ora una **forma unica irregolare** con **profondita** — conca scura scavata, centro piu scuro e riflesso in
superficie — e brillano intravedendosi nel buio. **Decorazioni ripristinate** (bare, scheletri, ossa, accampamenti,
rocce, colonne...) e **torce molto meno frequenti** e irregolari lungo i lati.

## 🧱 Dungeon di pietra & pozze *(novita v1.17)*

Il livello ha ora un **look in pietra**: pavimento a **lastre** con fughe e rilievo, **muri a blocchi** con volume,
tenendo la struttura attuale (niente micro-stanze). La mappa e stata **ripulita** (molte meno decorazioni sparse) e
i pericoli a pavimento sono cambiati: **niente piu spuntoni ne "pallini"**, ma **pozze** (acido/fuoco/freddo/arcano)
**del colore della mappa**, con bordo luminoso, che **brillano** intravedendosi nel buio. L'illuminazione usa un
**grande alone tondo** attorno a ogni eroe (al posto del cono), la mappa e un filo meno scura, e nuove **torce ai
lati** illuminano il perimetro. Parametri tarabili in `renderer.js`: `haloR`, `darkness`, `bloomStrength`.

## 🔦 Torcia nel buio *(novita v1.16)*

La mappa e ora **quasi nera** e il giocatore la illumina con un **cono di luce** nella direzione di mira, piu un
**alone ravvicinato** attorno a se (in co-op ogni alleato ha il suo cono). Torce, falo, portale, mercanti e
**proiettili** restano visibili nel buio; **boss/elite/scrigno** si **intravedono** col loro alone. Realizzato con
una dark-mask offscreen (`destination-out`): **leggera, zero dipendenze**. Fluttua anche un **pulviscolo** che
brilla nel fascio. Il **bloom** e stato reso piu tenue. Tasto **`L`** per accendere/spegnere la torcia, **`B`** per
il bloom (scelte salvate).

## 🌟 Dungeon neon: bloom & glow *(novita v1.15)*

Un **bloom** (glow diffuso) illumina proiettili, torce, occhi/aure dei nemici e accenti degli eroi, dando un look
**twin-stick moderno** pur restando nel **tema dungeon cupo**. E realizzato in **Canvas 2D puro** (offscreen a
bassa risoluzione + blur additivo): **leggero** e **senza dipendenze**. I proiettili sono scie neon (nucleo bianco
+ alone saturo) e i nemici hanno un **alone emissivo** stile "orb". Premi **`B`** per attivare/disattivare il bloom
(scelta salvata) sui PC meno potenti.

## 🔎 Dimensioni & fluidita *(novita v1.13)*

Personaggio, nemici, **boss** e **oggetti di scena** sono resi un po' **piu grandi** (visivo +45%) per un
colpo d'occhio piu imponente, MA la **collisione resta quasi invariata** (~1.08x, come la v1.12) e il
giocatore ha un **+5% di velocita**: cosi il gioco resta **fluido e immediato**. Mappa e densita non cambiano.

## 🔧 Mercante: un solo per round *(fix v1.13)*

A fine round compare **un solo** mercante: con ~30% di probabilita il **Mercante Nero AL POSTO** di quello
ufficiale, altrimenti l'ufficiale. **Mai entrambi insieme.**

## 🎮 Comandi

| Azione | Tasto |
|---|---|
| Movimento | WASD / frecce |
| Mira | Mouse |
| Spara | Click sinistro / Spazio |
| Scatto (dash) | Tasto destro del mouse (o Shift) — attraversa i nemici |
| ~~Abilità 1 / 2~~ | *sospese in v1.66* |
| Negozio: pronto | Spazio |
| Musica on/off | M |
| Chat | Invio |
| Minimappa | sempre visibile, in basso a sinistra |

---

## 🕹️ Loop di gioco

1. **Ondata di combattimento** (una sola modalita, dal v1.78).
2. I nemici lasciano **XP** ✦ e **monete** 🪙 — oggetti no, dal v1.77.
3. Uccisioni consecutive → **COMBO** con moltiplicatore XP crescente. *(v1.6)*
4. Ripulita la mappa: **EXIT**, poi il **riepilogo**, le **carte** dovute ai livelli presi e i **punti** da spendere.
5. **Due boss in tutta la run** *(v1.89)*: **il Colosso della Faglia alla 10ª** e **AZ'GAROTH alla 20ª**.

---

## ⏸️ Pausa & flusso *(novità v1.9)*

A fine ondata il gioco va in **pausa**: durante la scelta dei poteri, il negozio a XP e l'emporio a monete il mondo
è **congelato**. In singolo giocatore si riparte **solo** col tasto **Continua** (in multiplayer c'è un timeout
anti-AFK). I drop rimasti a terra (XP e monete) vengono **raccolti automaticamente**.

## 🎚️ Livelli, ranghi e punti *(v1.69, rivisti in v1.70)*

La XP non e' una valuta da spendere ma una **barra che sale**, e arriva da piu' fonti.

| | Regola |
|---|---|
| **Tetto ai livelli** | **nessuno**: si sale finche' si accumula esperienza |
| **Curva** | `107 · L^1,54` — 10.670 XP per il livello 20, 20.040 per il 30 |
| **Fonti dell'esperienza** | nemici uccisi · **casse aperte** (45 + 9/ondata) · **potenziamenti raccolti** (30 + 6/ondata) |
| **Monete dalle casse** *(v1.84.1)* | una cassa su due lascia un mucchietto di monete invece del potenziamento: **22 + 3/ondata**, ±25% |
| **Ranghi** | **5**, uno ogni 5 livelli: danno il titolo nuovo e un punto in piu' |
| **Punti** | 1 per livello + 1 per rango |
| **Statistica al tetto** | **22 punti** — o ti specializzi, o ti distribuisci |
| **Livello raggiunto in una run** | ~30, misurato |

**I cinque ranghi**

| Rango | Liv. | 🛡️ Guerriero | 🔮 Mago | 🏹 Ladro |
|---|---:|---|---|---|
| I | 1 | Guerriero | Apprendista | Ladro |
| II | 5 | Guerriero Esperto | Mago Giovane | Furfante |
| III | 10 | Veterano | Mago | Predone |
| IV | 15 | Campione | Mago Anziano | Ombra |
| V | 20 | **Paladino** / **Maestro d'Armi** | **Arcimago** / **Stregone** | **Assassino** / **Cacciatore di Teste** |

Il rango V e' un **bivio** fra due specializzazioni ed e' l'unico che **si vede addosso al personaggio**.
Le **carte di rango** della v1.69 sono state rimosse: al loro posto arriveranno le **abilita' di classe**,
sbloccate a livelli specifici. Il contenitore nel codice e' gia' pronto.

**Salire di livello si vede e si sente**: la scritta LEVEL UP compare sopra la testa del personaggio con il
numero del livello, resta agganciata a lui mentre combatte, e a chi sale parte un jingle dedicato.

## 🔢 Quanti nemici in campo *(curva, dalla v1.70)*

| Ondata | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10+ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Vivi al massimo | 8 | 10 | 12 | 14 | 16 | 18 | 21 | 23 | 26 | **30** |

L'ondata non perde nessuno: i nemici in eccesso restano in coda ed entrano appena si fa posto.

## 🔨 Il fabbro e l'equipaggiamento *(rifatto in v1.67)*

Il fabbro del **Mercato** (ogni 3 ondate) vende un **catalogo di oggetti per classe**, pagato in **monete**.
Ogni classe ha **i suoi slot** e vede **solo la propria roba**: il filtro sta sul server.

**Quattro ranghi per ogni slot** *(v1.88)*, uno per rarita': ⚪ **comune** (di partenza, gratis) · 🔵 **raro**
· 🟠 **leggendario** · ✨ **divino**. Otto slot fra le tre classi, **32 oggetti**.

| Slot | ⚪ comune | 🔵 raro | 🟠 leggendario | ✨ divino |
|---|---|---|---|---|
| 🛡️ **Arma** | Spada | Spadone 🪙230 | Alabarda 🪙520 | Falce della Faglia 🪙1000 |
| 🛡️ **Armatura** | Maglia di Ferro | Armatura a Piastre 🪙250 | Corazza del Baluardo 🪙560 | Egida di Ossidiana 🪙1050 |
| 🛡️ **Scudo** | Scudo | Scudo a Torre 🪙290 | Muro d'Acciaio 🪙620 | Aegis della Faglia 🪙1100 |
| 🔮 **Arma** | Bacchetta di Frassino | Scettro Runico 🪙240 | Bastone del Vuoto 🪙500 | Scettro delle Stelle Morte 🪙1050 |
| 🔮 **Armatura** | Veste da Apprendista | Manto dell'Arcanista 🪙270 | Toga del Conclave 🪙580 | Manto delle Ere 🪙1020 |
| 🏹 **Arma** | Arco Corto | Arco Lungo 🪙300 | Arco Composito 🪙560 | Arco delle Ombre 🪙1020 |
| 🏹 **Armatura** | Giaco di Pelle | Corazza di Cuoio 🪙240 | Giustacuore Ombroso 🪙540 | Pelle del Vuoto 🪙990 |
| 🏹 **Calzature** | Scarpe di Corda | Stivali del Passo Lieve 🪙260 | Stivali del Vento 🪙520 | Passi della Faglia 🪙950 |

**Il rango 1 costa 0 ed e' cio' che hai addosso alla partenza**: nel pannello e' marcato *DI BASE*. Un rango
piu' alto costa di piu' e vale di piu', sempre — niente scambi alla pari e niente svantaggi nascosti.

**Il cambio e' libero**: qualunque oggetto dello slot, in qualunque momento, a prezzo pieno; il vecchio viene
rimpiazzato, anche tornando indietro. I bonus vengono **ricalcolati da zero** a ogni cambio.

**Le armi cambiano il modo di combattere, non solo i numeri.** Per il guerriero, piu' l'arma e' lunga piu'
l'arco del fendente e' **stretto** (alabarda 152px/71°, spada 100px/109°): si sceglie fra tenere lontano e
coprire i fianchi. Per il mago la **cadenza resta la stessa** su tutte le bacchette — quella la alza
l'Intelligenza — e cambiano danno, velocita' e grandezza della bolla, cioe' quante ne vanno a segno.

**SI VEDE COSA HAI ADDOSSO** *(rifatto in v1.88)*. Ogni oggetto porta una `tinta` e un rango, e il renderer
li traduce in colori e forme:

| | Cosa cambia a schermo |
|---|---|
| **Armatura** | ridipinge i pezzi grossi: il **metallo** di elmo, piastra e spalline del guerriero, la **veste** del mago, **mantellina e cappuccio** del ladro |
| **Scudo** | **arco piu' ampio e lastra piu' spessa** a ogni rango, un rivetto in piu', bordo del colore dell'oggetto. E' l'unico pezzo che cambia la sagoma vista dall'alto — e nel gioco e' quello che para davvero, quindi la forma dice quanto copre senza scrivere un numero. L'Aegis ha una **runa accesa** lungo il bordo |
| **Arco** | quattro **lunghezze**, quattro legni; dal leggendario in su il dorso e' acceso del colore dell'arma |
| **Bacchetta** | l'**orbe** cambia colore e grandezza |
| **Rango divino** | un **alone che respira** del colore del pezzo. Uno solo anche con tre pezzi divini: tre aloni sovrapposti sarebbero una lampadina |

Tecnicamente lo snapshot porta adesso **tutti e quattro** gli slot (prima solo arma e scudo), e la chiave
della cache dei gradienti include la tinta dello scudo — la stessa attenzione che era servita per il bug dei
mercenari nella 1.82.1.

**Prezzi** tarati sull'economia misurata (~65-70 monete a ondata): al primo mercato ci si permette un rango 2,
al secondo un rango 3 oppure due rango 2.

Il catalogo vive in **`shared/gear.js`**: aggiungere un oggetto e' una riga sola.

## 🦸 Le tre classi *(v1.66)*

**GUERRIERO 🛡️ · MAGO 🔮 · LADRO 🏹** hanno sostituito Enforcer-7, Sgt. Viper e NULL: il gioco e' un dungeon
con troll, lich e beholder, e i tre protagonisti erano un poliziotto cibernetico, un sergente col fucile
d'assalto e un hacker.

| | Arma | Come colpisce | Danno/s | PV | Passo |
|---|---|---|---:|---:|---:|
| 🛡️ **Guerriero** | Spada | **semicerchio** davanti a se, 100px / 109° | 99 sul piu' vicino | 200 | 194 |
| 🔮 **Mago** | Bolla di Energia | proiettile lento (430 px/s) e grosso | 96 | 100 | 200 |
| 🏹 **Ladro** | Arco | freccia veloce (900 px/s), perfora 1 | 87 *(v1.83)* | 112 | 218 |

> 🛡️ **Lo scudo para davanti** *(v1.83)*. Oltre allo sconto piatto, gli scudi del guerriero tagliano i
> colpi che arrivano nel cono frontale — **70° per lato**: −45% lo Scudo, −60% lo Scudo a Torre. Di fianco
> e alle spalle non c'e' niente, e i colpi senza sorgente (le esplosioni) non si parano. Misurato coi bot:
> i danni subiti dal guerriero passano da 4,3 a 2,9 al secondo e il tempo di sopravvivenza da 80 a 119 s.
> E' l'unica classe che non puo' tenere le distanze: adesso ha una risposta, ed e' una risposta che si
> gioca — girarsi verso chi colpisce.
>
> 🏹 **L'arco** *(v1.83)*: cadenza da 3,0 a **2,3** al secondo, freccia da 31 a **38** danni. Cinque frecce
> al secondo (Destrezza al massimo) erano un rubinetto, non un arco.

Il **fendente** del guerriero non e' un proiettile: colpisce chi sta nel settore davanti al personaggio.
**Raggio e apertura vengono dall'arma** — la spada corta fara' 74px/131°, l'alabarda 144px/71°: *piu' lunga =
piu' stretta*. Il client disegna esattamente l'arco che ferisce. E' ad area ma limitata: il bersaglio piu'
vicino incassa tutto, gli altri il 55%, non piu' di 5 per colpo.

## 📊 Le quattro statistiche *(v1.66, al posto delle sei da sparatutto)*

| Statistica | Per livello (1→12) |
|---|---|
| 💪 **Forza** | +9% danno in mischia, +3% rinculo |
| ❤️ **Costituzione** | +20 PV massimi, −1,2% danni subiti |
| 🔮 **Intelligenza** | +9% danno magico, **+7% cadenza delle magie** |
| 🏹 **Destrezza** | +8% danno dei dardi, +6% cadenza, **+2,5% velocita'** |

Il legame fra statistica e attacco e' la **scuola dell'arma** (`weapon.school`: `melee` / `magic` / `ranged`).
Ogni statistica alza danno e cadenza *della sua scuola*, non un danno generico. **Chiunque puo' comprare
qualunque statistica**: cio' che si compra fuori scuola non e' sprecato, e' l'investimento sulle **classi miste**
previste nella progressione dopo il boss.

**Curva**: con l'XP di una run intera (~18.000) si cappa **esattamente una** statistica (17.980 XP). Tutte e
quattro costerebbero 71.920, cioe' quattro run pulite.

## ⚔️ Abilità *(sospese in v1.66)*

Le due abilita' Q ed E introdotte in v1.9 erano cucite sui tre eroi eliminati (torretta, granata, colpo del
cecchino, bullet-time, rift) e sono state **rimosse in blocco**: vanno ripensate sulle nuove classi, dove i
poteri arriveranno dall'**evoluzione dopo il boss** e non da uno slot fisso. Restano lo **scatto** universale
(tasto destro) e il fuoco.

## 💀 Mercante Nero *(novità v1.12)*

Un **secondo mercante** sinistro e ben distinto dal primo: figura incappucciata dal **volto di teschio**, altare di
pietra con rune, **lanterna viola** e relíquie fluttuanti. Vende **patti rischio/ricompensa** — potenziamenti forti
ma con una **maledizione** (es. +danno ma −PV, +cadenza ma +danni subiti, +vite ma −monete, un potere ma −PV, o un
**azzardo** dall'esito casuale). **Non è sempre presente**: appare a caso (~35% delle mappe) e si nasconde nel punto
più lontano dallo spawn. Il suo pannello mostra chiaramente **beneficio** e **rischio** di ogni patto.

## 🎨 HUD *(ridisegnato in v1.12)*

**Barra abilità più grande e caratteristica** (icone molto più grandi, badge del tasto, etichetta dell'azione,
pulsazione quando l'abilità è pronta) e **eventi al centro** dello schermo — grandi e molto visibili — al posto
delle piccole notifiche in alto a destra.

## 🧙 NPC Mercante *(novità v1.11)*

Un **mercante errante** neutrale appare in mappa (spesso in una micro-area), con bancarella e lanterna.
Avvicinandoti si apre un pannello con **3 offerte casuali** acquistabili con le **monete**: cura, +PV massimi,
cassa armi, un potere, vita extra, +danno, +velocità o riduzione danni. I nemici lo ignorano.

## 📦 Cosa c'e' dentro una cassa *(aggiornato in v1.84.1)*

Aprendone una: **~30%** e' una **cassa-mima** (un nemico), e del resto **meta' e' un mucchietto di monete**
(`22 + 3 per ondata`, con uno scarto del ±25%, sparso a terra da raccogliere) e meta' un **potenziamento a
tempo**. Prima era sempre il potenziamento: aprire una cassa mentre stai per comprare l'equipaggiamento
adesso puo' anche essere il pezzo che ti mancava.

## 👹 Nemici *(ridisegnati in v1.11)*

I mostri sono **creature dettagliate** (non più pallini): corpo, arti animati, corna, zanne, ali e occhi,
in stile coerente con gli eroi. Attacchi **più vari ispirati a Hades**: **zone telegrafate** a terra (cerchi che
esplodono), **ventagli** di proiettili, **raffiche** e **affondi** rapidi.

## 🔥 Sistema COMBO *(novità v1.6)*

- Le uccisioni consecutive riempiono il **combo meter** (in alto al centro).
- Il **moltiplicatore XP** cresce con la catena, fino a **x2.5**.
- La combo **decade** in ~3,6 s se smetti di uccidere: premia l'aggressività.
- Milestone ogni 5 uccisioni con feedback visivo e sonoro.

## 🗺️ Minimappa *(novità v1.6)*

Riquadro in basso a sinistra con: muri, portale d'uscita, **alleati**, **nemici**
(boss in rosso, élite in oro) e **scrigno del tesoro** 👑.

---

## 🪙 Monete & Emporio *(novita v1.8)*

Oltre all'XP, i nemici droppano **monete** di vario taglio: 🟤 **Bronzo** (1), ⚪ **Argento** (5),
🟡 **Oro** (20). Boss ed elite ne lasciano di piu; si raccolgono con la **calamita** come l'XP.

A fine ondata apri l'**Emporio** (a monete, parallelo al negozio a XP) con **3 slot** potenziabili per **5 tier**
(Lv. I → V, rarita crescente):
- 🛡️ **Armatura** — riduzione danni + PV massimi
- 👟 **Stivali** — velocita di movimento
- ⚔️ **Arma** — danno + cadenza di fuoco

*(v1.10)* Le icone dell'emporio sono **immagini generate uniche per ciascun eroe**; gli oggetti sono **molto piu costosi** (scelta di lungo periodo). Anello e Amuleto sono stati rimossi.

Ogni tier costa **piu** del precedente: **XP** per micro-potenziamenti ripetibili, **monete** per l'equipaggiamento.

## 🏆 Statistiche di fine partita *(novita v1.7)*

Al termine di ogni run compare un **riepilogo** con la **classifica co-op** ordinata per uccisioni
(medaglie 🥇🥈🥉). Per ogni giocatore: uccisioni, **combo massima** 🔥, **danni totali**,
**boon** raccolti, **sinergie** 🔗 e **arma** (con evoluzione). Mostrata anche la **durata** ⏱ della partita.

## 🔥 Ricompense combo a soglie *(novita v1.7)*

La combo non premia solo con XP: a **15** sblocchi la **Frenesia** (cadenza di fuoco), a **25** una **Nova**
ad area, a **40** una **Cura + Egida**. Tenere alta la catena diventa una decisione tattica.

## 🔗 Sinergie tra Boon *(novita v1.7)*

Possedere due boon compatibili sblocca un effetto potenziato una tantum:
- **🧪 Deflagrazione Tossica** — Tossina + Colpi Esplosivi → le esplosioni diffondono veleno.
- **🧊 Catena Gelida** — Catena di Fulmini + Tocco Gelido → le catene rallentano i nemici.
- **🔮 Cercatore** — Mira Guidata + Perforazione → i proiettili guidati perforano +1.
- **🛡 Muro d'Acciaio** *(v1.93, al posto di Sete di Sangue)* — Presa Salda + Adrenalina Pura → -6% in piu' ai danni subiti.

## 🎴 Poteri a scelta (Boon, stile Hades)

*(v1.10)* Catalogo ampliato a **23 poteri**; a fine ondata si sceglie **1 di 2** carte.

Effetti **unici e impilabili**, pescati per rarità a fine ondata:

- **Base:** Rimbalzo, Perforazione, Catena di Fulmini, Tossina, Colpi Esplosivi, Onda di Ritorno, Vampirismo,
  Sdoppiamento, Occhio di Falco, Proiettili Giganti, Tocco Gelido, Aura di Spine, Adrenalina Pura, Scudo Vitale.
- **Nuovi v1.6:** 🎯 **Mira Guidata** (homing), 🪙 **Avidità** (+XP), 🧱 **Baluardo** (-danni).

## 🔫 Armi ed evoluzioni

3 armi raccoglibili (Dispersore, Raffica, Cannone a Fascio), 3 livelli ciascuna. A **Lv.3** con la statistica
richiesta si **evolvono**: **Uragano d'Acciaio**, **Tempesta di Piombo**, **Lancia del Giudizio**.

## 💥 Game feel

Hit-stop (freeze-frame) su critici e uccisioni di boss/élite, screen shake, particelle, illuminazione dinamica.

---

## 🦸 Eroi (3) *(rifatti in v1.66)*

- **Guerriero** 🛡️ — fendente ad arco in mischia, il piu' resistente (200 PV, −12% danni subiti).
- **Mago** 🔮 — bolle di energia lente e pesanti; l'Intelligenza ne alza danno e cadenza.
- **Ladro** 🏹 — frecce veloci che perforano, il piu' rapido; la Destrezza ne alza danno, cadenza e passo.

## 👹 Nemici e boss

**3 mostri** in vista frontale (Zombie Putrido, Negromante, Troll delle Caverne) *(dal v1.30)*, più i **boss** con fasi
(Signore della Guerra, Re Lich…) e il **MEGA BOSS finale AZ'GAROTH** con meteore e ondate multiple.

## 🌍 Modalità ondata *(tolte in v1.78)*

Orda, Caccia, Sopravvivenza e Tesoro non esistono piu: ogni ondata e un'ondata normale. Quello che
cambia da un'ondata all'altra e il **contenuto** (quanti nemici, quante elite) e il **tempo obiettivo**.

## 🎨 Temi mappa

Cripta, Lava, Foresta, Ghiaccio, Arcano — generati proceduralmente con connettività garantita e portale d'uscita.
Elementi scenografici tematici *(ampliati in v1.9)*: colonne, cristalli, statue, funghi, catene, pozze, stendardi, sarcofagi, torce, accampamenti.
*(v1.10)* Atmosfera **piu tetra**: tombe, cadaveri, strumenti di tortura, gabbie sospese, piu ragnatele/catene/teschi; pavimenti oscurati.
*(v1.11)* Mappe ancora **piu scure** (illuminazione intima, vignetta marcata) e con **micro-aree**: nicchie/stanzette laterali arredate da esplorare.

---

## 🗂️ Architettura (file dedicati, dipendenze zero)

```
shared/  constants (+combo +MONETE), mathutils, loot (BOON + EVO + item + XP + EQUIPAGGIAMENTO),
         monsters, heroes, mapgen (temi), pathfinding, ai, waves (MODALITÀ)
server/  index, ws, Room (boon, hit-stop, modalità, evoluzioni, vite, XP, COMBO, homing, RICOMPENSE-COMBO, SINERGIE, STATS, MONETE, EMPORIO)
public/  index.html (scelta boon + combo meter), style.css
public/js/ net (+fix input), audio, renderer (boon-fx, tesoro, MINIMAPPA, MONETE, PROP-TETRI), hud (boon+modalità+COMBO+STATS+EMPORIO+ICONE-IMG), main (hit-stop, combo, sinergie, monete)
shared/gear.js — catalogo dell equipaggiamento per classe
test/    simulate.js — 499 test automatici headless · client.js — controlli su HUD e renderer
```

## 🚀 Avvio

```bash
docker compose up --build      # → http://localhost:8080
# oppure, con solo Node ≥ 18:
npm start
```

Test: `npm test`

---

## 🌐 Rete / netcode

Netcode **autoritativo** lato server (30 tick/s), snapshot a 20 Hz con interpolazione client.
Fino a **6 giocatori** per stanza, matchmaking o stanze private per nome.

---

> Buon divertimento nel Rift! 🗡️ · Per lo storico completo delle versioni vedi **CHANGELOG.md**.
