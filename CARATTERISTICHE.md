# ⚔️ DUNGEON RIFT — Caratteristiche complete del gioco

**Versione attuale:** `1.84.1`
Roguelike co-op frenetico per **fino a 6 giocatori**, motore **custom a dipendenze zero** (Node.js + Canvas 2D):
niente `npm install`, niente asset esterni — grafica, musica ed effetti sono **generati proceduralmente**.

> ⚠️ **Manopole spente al momento** — quello che il documento descrive ma che nel gioco oggi **non c'e'**:
> la **Faglia ai margini** (`EDGE_MARGIN: 0`, vedi la sezione *LA FAGLIA E' SPENTA*) e le **abilita' attive**
> delle sei specializzazioni (dichiarate dal v1.69, per ora esistono solo le passive).

---

## 🎚️ COME CRESCE IL PERSONAGGIO *(rifatto in v1.79)*

### Il tetto e le quattro scelte
- **Livello massimo: 15.** Oltre non si sale; l'esperienza raccolta dopo non serve piu' a niente.
- **Quattro abilita' passive in tutta la partita**, una per **scaglione**, ai livelli **3, 6, 9 e 12**.
- Ogni scaglione mostra **quattro abilita': due della tua classe e due neutre**. Se ne sceglie **una**.
- Le abilita' di classe le vede **solo** quella classe: un mago non sa nemmeno che esistono quelle del
  guerriero. E' voluto — e' la rigiocabilita' a cambiare personaggio.
- **Niente impilamento**: ogni abilita' si prende una volta sola, e vale circa il doppio di prima.
- Al **livello 15** si sceglie la **specializzazione** fra due, ed e' passiva.

| Scaglione | Livello | Cosa deve fare |
|---|---|---|
| Non comune | 3 | Da' forma al colpo base. Piccola, ma si sente subito. |
| Raro | 6 | Aggiunge una **regola** a come combatti, non solo una percentuale. |
| Epico | 9 | Definisce la build, e puo' avere un prezzo o una condizione. |
| Divino | 12 | **Riscrive una regola** del gioco, e punta verso la specializzazione. |

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
| Raro | 🩸 Vampirismo — +9% del danno ti cura | 💢 Rappresaglia — onda ampia quando incassi |
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
🌊 Onda d'Urto (Colpo Ampio + Rappresaglia) · 🩸 Sete di Sangue (Vampirismo + Adrenalina) · 🧊 Catena
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
l'hai. Sulla minimappa **non c'e' ne' il recinto ne' la chiave** *(v1.84.1)*: si vede solo la faglia
d'uscita. La deviazione dei prigionieri si trova **esplorando** — una mappa che te la indica non e' una
cosa nascosta, e' una lista di cose da fare. Il mercenario non raccoglie la chiave e non libera nessuno.

---

## 🌀 LA FAGLIA D'USCITA *(v1.84, al posto del pulsante EXIT)*

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

## 🐾 COME TI CERCANO I NEMICI *(v1.80)*

Ogni nemico che cammina ha tre modi di muoversi, e la differenza fra loro e' la **velocita'**:

| Stato | Come si muove | Velocita' |
|---|---|---|
| **Ti vede** (entro `sightRange` e con linea di vista libera) | ti insegue, attacca | 1,00 |
| **Ti ha visto** (memoria, `def.memory` ~3,5 s) | va all'ultima posizione nota | 0,95 |
| **Non ti vede** | **ti cerca** seguendo il campo di flusso | 0,68 – 0,90 |

Il campo di flusso e' un BFS su tutta la griglia verso **tutti** i giocatori vivi, ricostruito ogni 0,12 s:
il nemico che ti cerca fa il giro dei corridoi, non prova ad attraversare la roccia.

Prima della v1.80 l'ultima riga diceva *vagabondaggio*: un punto a caso entro 350 px. Su una mappa da
64x46 tile significava che meta' dell'ondata non ti incontrava mai. Il vagabondaggio resta solo come
ripiego quando la caccia non porta da nessuna parte (nessun giocatore vivo, o mostro incastrato contro un
muro da 0,8 s).

**Le eccezioni.** Il **Fungo Sporifero** non si muove mai: e' una sentinella, nega il terreno invece di
inseguirti. Il **Fuoco Fatuo** attraversa i muri e va in linea retta, non gli serve il flusso. La **Sfera
d'Ossa** dalla v1.80 rotola piano verso di te finche' non ti trova, poi si carica e parte.

### Il tetto alla folla

Cercarti non vuol dire arrivarti addosso tutti insieme. Solo i **`FOLLA_MAX` = 6 piu' vicini** a ciascun
giocatore hanno il permesso di avvicinarsi; gli altri risalgono fino all'**`ANELLO_ATTESA` = 900 px** e
li' girano, fuori dallo sguardo. L'assegnazione si rifa' ogni 0,4 s in ordine di distanza, quindi il
rimpiazzo e' automatico: **uccidi quello che hai addosso e il piu' vicino fra quelli in attesa si avvia.**

| Eccezione | Perche' |
|---|---|
| chi ti **vede** | un nemico che ti ha davanti agli occhi e si gira a passeggiare non e' un gioco piu' facile, e' un gioco rotto |
| chi e' **in mezzo a un'azione** (rotolata, slam, balzo) | interromperla a meta' si vedrebbe |
| i **boss** e gli **immobili** | non sono folla |

Quando ne restano pochi sono tutti dentro il tetto, e ti cercano tutti: la coda di fine ondata non esiste.

**Quanto ci mettono ad arrivare, e quanti** (giocatore fermo, in singolo, nemici entro 620 px sul totale
vivo): ondata 1 → 6/12 a 20 s; ondata 3 → 6/15 a 45 s; ondata 6 → 9/20 a 45 s (l'eccedenza sono quelli che
ti vedono). Il **recupero di distanza** che faceva correre i lontani fino a 2,1x e' **spento** dalla v1.80:
serviva quando vagavano a caso, adesso farebbe arrivare l'ondata in blocco.

**Non compaiono, arrivano**: la regola della v1.76.1 non e' stata toccata — nessun nemico in vista guadagna
distanza di scatto, e il recupero anti-stallo sposta solo chi e' davvero bloccato, oltre i 950 px e fuori
dallo sguardo.

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

## 🏘️ IL VILLAGGIO A MICRO-STANZE *(novita v1.75)*

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
- Restano tredici vie per curarsi, e tutte chiedono di pagare, bere, raccogliere o compiere qualcosa:
  Ostessa, pozioni di Cura e Rigenerazione, Pozione di Salute a terra, Bende del Viandante, buff Vigore,
  carte **Vampirismo**, **Scudo Vitale** e **Ultima Occasione**, sinergia **Sete di Sangue**, **aura del
  Paladino**, ricompensa della **combo di 40**, e la rianimazione.

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

## ⛏️ Il mercato e' una SALA SCAVATA *(novita v1.57)*
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

## 🏘️ Il mercato e' un VILLAGGIO *(novita v1.56)*
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
modalità Tesoro). Tutto in **Canvas 2D puro, zero dipendenze**.

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
5. Ogni 5 ondate → **BOSS**. Alla 20ª → **MEGA BOSS AZ'GAROTH**.

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

| | 🛡️ Guerriero | 🔮 Mago | 🏹 Ladro |
|---|---|---|---|
| **Arma** | Spada · Spadone 🪙230 · Alabarda 🪙470 | Bacchetta di Frassino · Scettro Runico 🪙240 · Bastone del Vuoto 🪙500 | Arco Corto · Arco Lungo 🪙300 |
| **Armatura** | Maglia di Ferro · Armatura a Piastre 🪙250 | Veste da Apprendista · Manto dell'Arcanista 🪙270 | Giaco di Pelle · Corazza di Cuoio 🪙240 |
| **Scudo** | Scudo · Scudo a Torre 🪙290 | — | — |
| **Calzature** | — | — | Scarpe di Corda · Stivali del Passo Lieve 🪙260 |

**Il rango 1 costa 0 ed e' cio' che hai addosso alla partenza**: nel pannello e' marcato *DI BASE*. Un rango
piu' alto costa di piu' e vale di piu', sempre — niente scambi alla pari e niente svantaggi nascosti.

**Il cambio e' libero**: qualunque oggetto dello slot, in qualunque momento, a prezzo pieno; il vecchio viene
rimpiazzato, anche tornando indietro. I bonus vengono **ricalcolati da zero** a ogni cambio.

**Le armi cambiano il modo di combattere, non solo i numeri.** Per il guerriero, piu' l'arma e' lunga piu'
l'arco del fendente e' **stretto** (alabarda 152px/71°, spada 100px/109°): si sceglie fra tenere lontano e
coprire i fianchi. Per il mago la **cadenza resta la stessa** su tutte le bacchette — quella la alza
l'Intelligenza — e cambiano danno, velocita' e grandezza della bolla, cioe' quante ne vanno a segno.

**Si vede cio' che si compra**: scudo a torre piu' grande e spesso, arco lungo che sporge davanti e dietro,
orbe della bacchetta che cresce e cambia colore, e l'arco del fendente che segue l'arma. Armature, vesti e
calzature restano invisibili: da sopra, a questa scala, non si leggerebbero.

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
- **🩸 Sete di Sangue** — Vampirismo + Adrenalina Pura → +6% cura dal danno inflitto.

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
