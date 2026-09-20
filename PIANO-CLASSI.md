# ⚔️ SCHEMA — LE CLASSI MISTE

**Scritto il 19 settembre 2026, a partire dalla v2.17.1. Non è un piano approvato: è lo schema da
analizzare.** Nessuna riga di codice è stata scritta. Dove c'è una domanda, la domanda è per Paolo.

---

## 📌 COSA HA CHIESTO PAOLO

> *«Vorrei aggiungere delle classi miste tipiche di D&D come: assassino, evocatore, warlock, stregone,
> paladino, maestro d'armi, barbaro, arciere. Il cambiamento sarebbe quello di aggiungere 2 negozi al
> villaggio, uno per equipaggiamento da ladro e l'altro per quello da mago. In questo modo si potrebbero
> impostare classi con vincoli: il paladino non può equipaggiare spadone e scudo ma solo quelle
> piccole/medie. Il barbaro usa armi pesanti, il maestro d'armi può usare 2 armi medie, assassino 2 armi
> leggere. Le armi le abbiamo, basta solo avere dei vincoli. Ogni classe partirà con dei punti base
> propri. Andranno create anche delle abilità aggiuntive come evocazioni per l'evocatore o magie
> elementari per l'incantatore.»*
>
> E in aggiunta: **i ranghi spariscono**, e nel menu principale servono **mini artwork delle classi con
> l'anteprima delle statistiche**.

---

## ✅ DECISIONI GIÀ PRESE DA PAOLO (19 settembre, sera)

Queste non si discutono più: sono il terreno su cui poggia il resto.

1. **Le specializzazioni del livello 15 spariscono.** *«Non avrebbe senso.»* Per ora **al 15 non succede
   niente**: resta il tetto della crescita e basta. Cosa metterci si deciderà dopo, senza fretta.
2. **I vincoli si scrivono su due assi insieme: FAMIGLIA (mischia / arcana / tiro) e TIPOLOGIA (leggera /
   equilibrata / pesante).** E l'accesso **può essere misto**: parole di Paolo — *«un assassino può usare
   arco o armi leggere, così come un'armatura leggera del guerriero»*. Quindi la classe non dichiara una
   famiglia: dichiara **una matrice** famiglia → tipologie ammesse. I due campi ci sono già su tutti i
   117 pezzi, quindi è lavoro di tabella, non di tassonomia.
3. **Negromante: interessa.** **Chierico: no** — *«rischia di rompere degli equilibri»*, e aveva ragione
   chi nella v1.93 aveva chiuso quella porta.
4. **Stregone e Warlock restano due classi distinte**, e la differenza non è di storia ma di
   equipaggiamento: **il Warlock usa armi e armature leggere, lo Stregone no.**
5. **Due armi — versione semplice, decisa:** *«graficamente basta fare due archi più piccoli; per il
   resto somma il danno delle due armi leggere con una piccola penalità»*. Niente secondo sistema di
   tiro, niente alternanza. **E in sede di bilanciamento le armi pesanti devono fare più danno** — se no
   due leggere battono una pesante e la scelta non esiste.
6. **Le evocazioni si appoggiano al sistema che c'è già** (mercenari + evocazioni dei mostri). Come
   farle di preciso si decide dopo.
7. **NIENTE PEZZI NUOVI, per ora.** *«Non vorrei armi o armature aggiuntive: basta vincolare quelle
   attuali.»* Il catalogo resta 117.
8. **Quante classi al debutto: si vede dopo.** *«Rifletteremo bene sul da farsi riguardo le classi.»*
9. **La modalità di prova si aggiorna dopo**, quando le classi ci sono.

---

## 🔮 LA COSA NUOVA DECISA STASERA: LE BOLLE DEL MAGO DIVENTANO ELEMENTI

Parole di Paolo: *«la bolla che spara il mago fa un po' ridere. Ai bastoni/verghe, al posto della
grandezza della bolla, creerei lo sparo in base alla tipologia: fuoco, gelo, fulmine e veleno.»*

**Ha ragione, e i numeri lo confermano.** Oggi le tredici armi del mago si distinguono quasi solo per il
RAGGIO della bolla — il resto è la solita scala:

| | pesante | equilibrata | leggera |
|---|---|---|---|
| grado 2 | r16 · 99 danni · 1,0/s | r10 · 66 · 1,5/s | r6 · 41 · 2,4/s |
| grado 5 | r24 · 158 danni · 1,0/s | r14 · 105 · 1,5/s | r7,5 · 66 · 2,4/s |

Cioè: **una palla verdina che cresce**. Tredici armi che fanno tutte la stessa cosa, un po' più grossa.

**La proposta**: ogni arma arcana dichiara un `elemento` — `fuoco`, `gelo`, `fulmine`, `veleno` — e il
proiettile si disegna come quell'elemento invece che come una bolla. Il disegno è il grosso del lavoro
ed è tutto in `_drawBubble` (una funzione sola, in `renderer.js`), quindi è contenuto:

- 🔥 **fuoco** — nucleo bianco-giallo, alone arancione, scia di braci che si spengono;
- ❄️ **gelo** — scheggia azzurra sfaccettata che ruota, scia di cristallini;
- ⚡ **fulmine** — non una palla ma un segmento spezzato che guizza, bagliore bianco;
- ☠️ **veleno** — goccia verde che pulsa e lascia gocce.

**Da decidere quando ci si mette mano:** l'elemento è solo un vestito, o fa anche qualcosa? Il motore
saprebbe già farli mordere senza inventare niente — il fuoco brucia a terra (c'è il muro), il gelo
rallenta (c'è lo sguardo gelido), il fulmine rimbalza (c'è la Catena Nera), il veleno avvelena (c'è la
melma). Ma sono quattro effetti nuovi da bilanciare: **prima il vestito, poi semmai i denti.**

---

## 🎯 LE ABILITÀ: UNA FIRMA PER CLASSE, IL RESTO PER FAMIGLIA

Idea di Paolo, ed è quella che fa crollare il costo del piano:

> *«Alcune delle abilità attuali possono essere assegnate alle nuove classi: "Carica" del guerriero va
> bene per paladino o barbaro. Difatti le distinguerei per FAMIGLIA piuttosto che per classe. Stavo
> pensando che l'abilità attiva al primo livello debba essere SPECIFICA della classe: l'evocatore avrà
> "evocazione", il paladino "benedizione". Meno lavoro per te e più caratterizzazione del personaggio.»*

### Il modello

| Slot | Livello | Da dove viene |
|---|---|---|
| **1** | 1 | **LA FIRMA — una sola, propria della classe.** Non si sceglie: è quello che sei. |
| **2** | 7 | Dal **serbatoio della famiglia** (mischia / arcana / tiro), filtrato dalla classe |
| **3** | 13 | Idem, dal serbatoio della famiglia |

Le dodici abilità di oggi diventano i tre serbatoi, senza toccarle:

| Famiglia | Quello che c'è già |
|---|---|
| **mischia** | Carica · Grido di Guerra · Turbine · Giuramento |
| **arcana** | Muro di Fuoco · Scudo di Mana · Meteora · Catena Nera |
| **tiro / ombra** | Tempo Rubato · Tagliola · Marchio · Salva |

### Quanto si risparmia, in cifre

| | Abilità da scrivere |
|---|---|
| Modello «4 per classe» (prima stesura) | **32** |
| Modello a firme + serbatoi | **8 firme** + i 12 serbatoi che esistono già (+ 2-3 di riempimento) |

**Da 32 a una decina.** Ed è anche più bello da giocare: la firma dice subito *chi sei*, e le due scelte
dopo dicono *come lo giochi*.

### ⚠️ Il rischio, e come si chiude
Se il serbatoio è solo per famiglia, **tre classi di mischia avrebbero le stesse identiche scelte** ai
livelli 7 e 13, e si distinguerebbero solo per la firma. Si chiude con un filtro per classe: il
serbatoio è della famiglia, ma **ogni classe ne vede un sottoinsieme**.

```
barbaro:  { famiglia: 'mischia', firma: 'ab_furia',    puo: ['ab_carica','ab_turbine'] }
paladino: { famiglia: 'mischia', firma: 'ab_benedizione', puo: ['ab_grido','ab_giuramento'] }
```

Così il Barbaro non prende mai Giuramento (protegge gli altri: non è lui) e il Paladino non prende mai
Turbine. Stesso serbatoio, due personaggi diversi — e **zero abilità nuove da scrivere**.

### Le firme, come le vedo

| Classe | Firma | Cosa fa | Costo |
|---|---|---|---|
| **Barbaro** | 🩸 **Furia** | Più danno, meno difesa, non ti fermi: per 8s incassi peggio e picchi molto più forte | i buff esistono già |
| **Paladino** | ✨ **Benedizione** | Aura che riduce i danni a te e ai compagni vicini e **riflette** una quota al mittente | `thornsPct` e `dmgReduce` esistono |
| **Maestro d'Armi** | ⚔️ **Danza delle Lame** | Una raffica di fendenti corti mentre ti muovi: il contrario del Turbine, che ti inchioda | vicino al Turbine |
| **Assassino** | 🌑 **Colpo alle Spalle** | Sparisci e ricompari dietro il bersaglio, colpo critico garantito | il `blink` dei mostri esiste |
| **Arciere** | 🏹 **Pioggia di Frecce** | Una salva su un'area scelta, non su un bersaglio | vicino a Salva + Meteora |
| **Stregone** | 🔥 **Scarica Elementale** | Un'esplosione dell'**elemento dell'arma impugnata** — fuoco, gelo, fulmine o veleno | **si lega agli elementi**: una firma, quattro facce |
| **Warlock** | ⛓️ **Patto** | Maledici un nemico: prende più danni e, quando muore, ti restituisce qualcosa | vicino al Marchio |
| **Evocatore** | 👹 **Evocazione** | Chiami un compagno a tempo dove punti | mercenari |
| **Negromante** | 💀 **Rialzata** | L'ultimo mostro che hai ucciso si rialza e combatte per te | mercenari + evocazioni dei mostri |

> La firma dello **Stregone** è la più elegante delle nove: **cambia faccia a seconda dell'arma**, quindi
> una sola abilità scritta dà quattro giocate diverse — e lega la classe al sistema degli elementi
> deciso ieri sera. Se si dovesse cominciare da una, comincerei da questa.

### ✅ La scelta del livello 1: DECISO
Parole di Paolo: *«la scelta diventa una sorta di abilità di classe che ti viene data in base al
personaggio, perciò non sparisce — semplicemente non c'è scelta»*.

Quindi la schermata prima di scendere **resta** e cambia mestiere: da «scegli» a «**ecco cosa sai
fare**». Mostra la firma della classe con la sua descrizione e il pulsante per entrare. Il blocco del
server (`shopReady` che rifiuta con una scelta appesa) resta valido per gli altri livelli.

---

## 📋 LE NOVE CLASSI, SCHEDA PER SCHEDA

**Come si legge.** `Profilo` è FOR/COS/DES/INT di partenza (somma 22, come oggi). `Firma` è l'attiva del
livello 1: **si riceve, non si sceglie** — la schermata prima di scendere la presenta e basta (deciso da
Paolo). Al **7** e al **13** si sceglie fra i candidati elencati. Le **passive** sono le carte che quella
classe può vedersi offrire agli scaglioni 3-5-9-11, pescate dalle 32 che esistono.
Le voci con ✨ sono **da scrivere**; tutte le altre esistono già.

---

### 🪓 BARBARO · famiglia mischia
**Profilo 9/8/4/1** — il più forte e il più scoperto. Corpo: guerriero.
**Vincoli**: mischia *pesante* · **niente scudo** · armatura *leggera / equilibrata*.

| | |
|---|---|
| **Firma (liv. 1)** | ✨ 🩸 **Furia** — per 8s fai il 50% di danno in più e ne incassi il 25% in più. Mentre dura non puoi bere: si va avanti e basta. |
| **Candidati 7 / 13** | **Carica** · **Turbine** · ✨ 🪓 **Spaccaossa** (il prossimo colpo sfonda in linea retta e stordisce tutti quelli che tocca) |
| **Passive** | Arma Pesante · Colpo Ampio · Adrenalina Pura · Colosso · Presa Salda · Deflagrazione Cadaverica + le 8 universali |

---

### ✨ PALADINO · famiglia mischia
**Profilo 7/9/3/3** — regge e protegge. Corpo: guerriero.
**Vincoli**: mischia *equilibrata / leggera* · scudo *equilibrato / leggero* · armatura *pesante*.

| | |
|---|---|
| **Firma (liv. 1)** | ✨ ✨ **Benedizione** — aura di 220px per 6s: tu e i compagni dentro subite il 25% di danni in meno, e il 20% di quello che incassate torna al mittente. |
| **Candidati 7 / 13** | **Grido di Guerra** · **Giuramento** · ✨ 🛡️ **Muro di Scudi** (pianti lo scudo: per 4s i colpi frontali non ti toccano e chi ti sbatte contro rimbalza) |
| **Passive** | Scudo Vitale · Baluardo · Presa Salda · Rappresaglia · Colosso · Ultima Occasione + le universali |

---

### ⚔️ MAESTRO D'ARMI · famiglia mischia · **due armi**
**Profilo 8/6/6/2** — ritmo altissimo, nessuna difesa extra. Corpo: guerriero.
**Vincoli**: mischia *equilibrata* **×2** · **niente scudo** · armatura *equilibrata / leggera*.

| | |
|---|---|
| **Firma (liv. 1)** | ✨ ⚔️ **Danza delle Lame** — per 2,5s la cadenza sale del 60% e ti muovi a velocità piena mentre colpisci. È il contrario del Turbine, che ti inchioda. |
| **Candidati 7 / 13** | **Turbine** · **Carica** · ✨ 🗡️ **Parata Perfetta** (finestra di 1s: il primo colpo che arriva non ti tocca e parte un contrattacco doppio) |
| **Passive** | Arma Pesante · Colpo Ampio · Adrenalina Pura · Giustiziere · Occhio di Falco · Onda di Ritorno + le universali |

---

### 🌑 ASSASSINO · famiglia mischia + tiro · **due armi**
**Profilo 5/4/10/3** — il più fragile e il più letale. Corpo: ladro.
**Vincoli**: mischia *leggera* **×2** · tiro *leggero* · armatura *leggera*.

| | |
|---|---|
| **Firma (liv. 1)** | ✨ 🌑 **Ombra Lunga** — sparisci e ricompari **dietro** il bersaglio mirato: il colpo che segue è un critico garantito. |
| **Candidati 7 / 13** | **Tempo Rubato** · **Tagliola** · **Marchio** |
| **Passive** | Colpo alle Spalle · Lama Sporca · Punto Vitale · Passo d'Ombra · Uscita di Scena · Giustiziere + le universali |

> ⚠️ **Conflitto di nomi da sciogliere**: esiste già una CARTA PASSIVA che si chiama *«Colpo alle
> Spalle»* (+20% sui nemici che non ti guardano). Per questo la firma qui sopra si chiama **Ombra
> Lunga** e non «Colpo alle Spalle»: due cose con lo stesso nome in due elenchi diversi sono un modo
> garantito di fare confusione, a schermo e nel codice.

---

### 🏹 ARCIERE · famiglia tiro
**Profilo 4/5/10/3** — tiene la distanza e non la molla. Corpo: ladro.
**Vincoli**: tiro *qualunque* · mischia *leggera* (per difendersi) · armatura *leggera / equilibrata*.

| | |
|---|---|
| **Firma (liv. 1)** | ✨ 🏹 **Pioggia di Frecce** — una salva su un'**area scelta**, non su un bersaglio: si tira dove *saranno*. |
| **Candidati 7 / 13** | **Salva** · **Marchio** · ✨ 🎯 **Tiro Ancorato** (se resti fermo il danno cresce a ogni colpo, fino a +60%; ti muovi e riparte da zero) |
| **Passive** | Perforazione · Tiro Lungo · Occhio di Falco · Punto Vitale · Giustiziere · Passo Rapido + le universali |

---

### 🔥 STREGONE · famiglia arcana
**Profilo 2/4/6/10** — danno puro, **nessuna armatura addosso**. Corpo: mago.
**Vincoli**: arcana *equilibrata / pesante* · **niente armatura** (solo calzature).

| | |
|---|---|
| **Firma (liv. 1)** | ✨ 🔥 **Scarica Elementale** — un'esplosione dell'**elemento dell'arma che impugni**: fuoco, gelo, fulmine o veleno. Una firma, quattro facce. |
| **Candidati 7 / 13** | **Meteora** · **Catena Nera** · **Muro di Fuoco** |
| **Passive** | Bolla Densa · Colpi Esplosivi · Concentrazione · Frattura Arcana · Catena di Fulmini · Tossina + le universali |

> È la firma che regge meglio il rapporto fra lavoro e resa: **una sola abilità scritta dà quattro
> giocate**, e lega la classe al sistema degli elementi. Se si comincia da una, si comincia da qui.

---

### ⛓️ WARLOCK · famiglia arcana
**Profilo 3/6/4/9** — si difende e lavora di maledizioni. Corpo: mago.
**Vincoli**: arcana *leggera* · armatura *leggera* · mischia *leggera*.

| | |
|---|---|
| **Firma (liv. 1)** | ✨ ⛓️ **Patto** — maledici un nemico: per 10s prende il 35% di danni in più, e se muore maledetto il tuo colpo successivo vale doppio. |
| **Candidati 7 / 13** | **Scudo di Mana** · **Catena Nera** · ✨ 💀 **Emorragia d'Anima** (i nemici che uccidi lasciano una scheggia: raccoglierla accorcia le tue ricariche) |
| **Passive** | Tossina · Tocco Gelido · Campo di Lentezza · Scudo Vitale · Baluardo · Ultima Occasione + le universali |

---

### 👹 EVOCATORE · famiglia arcana
**Profilo 2/6/4/10** — non combatte: manda gli altri. Corpo: mago.
**Vincoli**: arcana *pesante* · armatura *equilibrata*.

| | |
|---|---|
| **Firma (liv. 1)** | ✨ 👹 **Evocazione** — chiami un compagno dove punti: combatte da solo per 20s. Uno alla volta. |
| **Candidati 7 / 13** | **Muro di Fuoco** · **Scudo di Mana** · ✨ 🌀 **Richiamo** (l'evocato torna da te ed esplode, oppure ne chiami due più deboli invece di uno) |
| **Passive** | Campo di Lentezza · Scudo Vitale · Colosso · Tossina · Concentrazione · Ultima Occasione + le universali |

---

### 💀 NEGROMANTE · famiglia arcana
**Profilo 2/5/5/10** — il campo di battaglia è il suo magazzino. Corpo: mago.
**Vincoli**: arcana *equilibrata* · armatura *leggera*.

| | |
|---|---|
| **Firma (liv. 1)** | ✨ 💀 **Rialzata** — l'**ultimo mostro che hai ucciso** si rialza e combatte per te finché non cade di nuovo. Più grosso era, meglio è. |
| **Candidati 7 / 13** | **Muro di Fuoco** · **Catena Nera** · ✨ ☠️ **Pestilenza** (i tuoi morti rilasciano una nube che avvelena e rallenta) |
| **Passive** | **Deflagrazione Cadaverica** · Tossina · Campo di Lentezza · Tocco Gelido · Scudo Vitale · Concentrazione + le universali |

> Deflagrazione Cadaverica esiste già ed è oggi una carta del guerriero: sul Negromante ci sta molto
> meglio di dov'è adesso.

---

## 🧾 IL CONTO DI QUESTO ELENCO

| | |
|---|---|
| Abilità attive **che esistono già** e si riusano | **12** |
| **Firme** da scrivere (una per classe) | **9** |
| Attive di classe in più, dai candidati | **7** (Spaccaossa · Muro di Scudi · Parata Perfetta · Tiro Ancorato · Emorragia d'Anima · Richiamo · Pestilenza) |
| Carte passive da scrivere | **0** — le 32 di oggi si ridistribuiscono |

**Il minimo per giocarci**: le **9 firme**. Senza le sette attive extra, ogni classe ha comunque firma +
due scelte prese dal serbatoio della sua famiglia: si gioca, e le sette si aggiungono dopo una per volta.

---

## ⚠️ IL FATTO CHE CAMBIA TUTTO, E VA DECISO PER PRIMO

**Quattro delle otto classi che hai elencato esistono già nel gioco — come SPECIALIZZAZIONI del livello
15.** Sono in `shared/levels.js`:

| Specializzazione | Classe di partenza |
|---|---|
| **Paladino** | guerriero |
| **Maestro d'Armi** | guerriero |
| **Arcimago** | mago |
| **Stregone** | mago |
| **Assassino** | ladro |
| Cacciatore di Teste | ladro |

Oggi la progressione dice: *scegli fra tre archetipi, e a fine corsa ti specializzi in uno dei due rami
del tuo*. La tua proposta dice: *scegli fra otto classi specializzate dall'inizio*. **Le due cose non
possono convivere così come sono** — non avrebbe senso cominciare come Paladino e al livello 15 scegliere
di diventare Paladino.

Tre uscite possibili, e la scelta cambia tutto il resto:

**A — Le specializzazioni diventano classi.** Le otto classi sono le specializzazioni promosse a inizio
partita. Al 15 si sceglie qualcos'altro: un *dono leggendario* (una carta divina, un'abilità unica, un
potenziamento grosso). È la strada più pulita: niente doppioni, e i nomi che hai già scritto restano.

**B — Le classi stanno SOPRA le specializzazioni.** Otto classi, e ognuna al 15 sceglie fra due
sotto-rami suoi. Vuol dire scrivere **sedici** specializzazioni nuove.

**C — Restano tre archetipi (guerriero / mago / ladro) e le otto sono "build" dentro l'archetipo.** Cioè
quello che il gioco fa già oggi, con nomi diversi. Costa pochissimo e cambia poco.

> ✅ **DECISO: la via A**, con una semplificazione. Le specializzazioni spariscono e **al livello 15 non
> succede niente per ora** — non si sostituiscono subito con un dono leggendario, si lascia il posto
> vuoto e si decide con calma. Il resto dello schema poggia su questo.

---

## 🧱 L'ARCHITETTURA: DA «EQUIPAGGIAMENTO PER EROE» A «FAMIGLIE + VINCOLI»

### Com'è oggi
Ogni pezzo porta scritto in faccia di chi è: `{ id: 'gue_w_spadone', hero: 'guerriero', slot: 'weapon',
carattere: 'pesante', rank: 2, ... }`. Sono **117 pezzi**: 13 per slot, tre slot per classe, tre classi.

Con otto classi e la stessa regola servirebbero **312 pezzi**, e la maggior parte sarebbero fotocopie —
la spada del paladino e quella del guerriero sono la stessa spada.

### Come diventa
Il pezzo smette di appartenere a una classe e appartiene a una **famiglia**. La classe dichiara **a quali
famiglie può attingere e con quali vincoli**.

```
PEZZO   { id, famiglia: 'mischia' | 'arcana' | 'tiro' | 'armatura' | 'scudo' | 'calzature',
          carattere: 'pesante' | 'equilibrata' | 'leggera', rank, bonus, tinta, ... }

CLASSE  { id, corpo, slot: [...], puo: { mischia: ['equilibrata','leggera'], scudo: ['leggera'] },
          armi: 1 | 2, profilo: { st_for, st_cos, st_des, st_int }, abilita: [...] }
```

**Il catalogo non cresce quasi per niente**: le 117 righe di oggi si ri-etichettano per famiglia, e i
pezzi in più servono solo dove manca roba (per esempio armi da tiro vere, che oggi sono solo dell'arco).

**E i tuoi due negozi nuovi diventano la conseguenza naturale**: tre botteghe, una per famiglia d'arma
— il **Fabbro** (mischia), il **Rigattiere** (tiro e roba da ladro), l'**Arcanista** (arcana). Ognuna
vende anche la difesa che le compete. Il pannello del fabbro è già generico: mostra gli slot che la
classe ha e i pezzi che può portare. **Le tre botteghe sono lo stesso pannello con un catalogo diverso.**

### I vincoli si scrivono con i campi CHE CI SONO GIÀ
Il `carattere` (pesante / equilibrata / leggera) è esattamente l'asse «spadone vs spada vs pugnale» che
hai descritto, e c'è su tutti i 117 pezzi dalla v2.12. La `school` dell'arma (melee / magic / ranged) è
già quella che decide quale statistica la fa crescere. **Non serve inventare tassonomie nuove.**

**E i vincoli sono una MATRICE, non un'etichetta.** Questa è la precisazione di Paolo, ed è quella che
rende il sistema interessante invece che rigido: una classe non appartiene a una famiglia, **dichiara
per ogni famiglia quali tipologie può portare**. Così l'accesso misto viene gratis:

```
assassino:  { mischia: ['leggera'], tiro: ['leggera','equilibrata'], armatura: ['leggera'] }
guerriero:  { mischia: ['pesante','equilibrata','leggera'], scudo: [...], armatura: ['pesante','equilibrata','leggera'] }
warlock:    { arcana: ['leggera'], armatura: ['leggera'] }
stregone:   { arcana: ['equilibrata','pesante'], armatura: [] }
```

Una funzione sola — `Gear.puoPortare(classe, pezzo)` — legge la matrice e risponde sì o no. Negozio,
inventario, equipaggia e salvataggio passano tutti di lì: se il controllo si sparge in più punti, prima
o poi due punti diranno cose diverse.

---

## 🛡️ LE OTTO CLASSI, COME LE VEDO

`FOR/COS/DES/INT` è il profilo di partenza (somma **22**, come oggi, così restano confrontabili).
`Armi` è quante se ne impugnano.

| Classe | Corpo | Famiglie · caratteri ammessi | Armi | FOR/COS/DES/INT | Identità in una riga |
|---|---|---|---|---|---|
| **Barbaro** | guerriero | mischia **pesante** · niente scudo · armatura leggera | 1 | 9/8/4/1 | Picchia forte, incassa male, non si ferma |
| **Paladino** | guerriero | mischia **equilibrata/leggera** · scudo **equilibrato/leggero** · armatura pesante | 1 | 7/9/3/3 | Regge e protegge gli altri |
| **Maestro d'Armi** | guerriero | mischia **equilibrata** ×2 · niente scudo | **2** | 8/6/6/2 | Due lame medie, ritmo altissimo |
| **Assassino** | ladro | mischia **leggera** ×2 · armatura leggera | **2** | 5/4/10/3 | Colpisce alle spalle e sparisce |
| **Arciere** | ladro | tiro **qualunque** · armatura leggera/equilibrata | 1 | 4/5/10/3 | Tiene la distanza, perfora |
| **Stregone** | mago | arcana **equilibrata/pesante** · **niente armatura** | 1 | 2/4/6/10 | Magia elementale grezza, danno puro, nessuna difesa |
| **Warlock** | mago | arcana **leggera** · armatura **leggera** | 1 | 3/6/4/9 | Patto: maledice e prende in prestito — e a differenza dello Stregone **si veste e si arma** |
| **Evocatore** | mago | arcana **pesante** · armatura equilibrata | 1 | 2/6/4/10 | Non combatte: manda gli altri a combattere |

### Le tre che aggiungerei io

| Classe | Corpo | Perché |
|---|---|---|
| **Negromante** | mago | Rialza i mostri che uccidi. **Il motore lo sa già fare**: il Negromante nemico evoca (`summon` in `monsters.js`), e il sistema dei **mercenari** è già un compagno che combatte da solo. È l'abilità più spettacolare che si può fare con codice che esiste. |
| ~~Chierico~~ | — | ❌ **SCARTATO da Paolo**: *«rischia di rompere degli equilibri»*. Ed è coerente con la v1.93, che aveva tolto `lifesteal` e `regen` di proposito e li fa sorvegliare dal TEST 58. Nel gioco continua a curare solo l'Ostessa. |
| **Monaco** | ladro | L'unico che **non usa armi**: combatte a mani nude e i suoi «pezzi» sono bende e cavigliere. È il vincolo più estremo e il più economico da scrivere — e fa capire a colpo d'occhio che i vincoli sono veri. |

> Avevo obiettato che **Stregone e Warlock** fossero due sfumature della stessa cosa. Risposta di Paolo,
> che chiude la questione meglio della mia obiezione: **sono diversi nell'EQUIPAGGIAMENTO** — il Warlock
> usa armi e armature leggere, lo Stregone no. È una distinzione che si vede giocando, non una di lore:
> lo Stregone è scoperto e picchia forte, il Warlock si difende e lavora di maledizioni.
> **Il Negromante entra comunque**, non al posto di uno dei due.

---

## 💰 QUANTO COSTA, PEZZO PER PEZZO

### Praticamente gratis (l'impianto c'è già)
- **Profilo di statistiche per classe.** `Heroes.STAT_BASE` esiste e dalla v2.16 **morde**: otto righe
  invece di tre. Un'ora.
- **Via i ranghi.** Dalla v2.16 sono solo scenici (`puntiPerRango()` torna 0): resta da togliere titoli
  e riquadro. Mezz'ora.
- **I corpi.** Le otto classi **non hanno bisogno di otto disegni**: riusano i tre corpi
  (`_heroGuerriero`, `_heroMago`, `_heroLadro`) con palette e tinte diverse. È lo stesso meccanismo con
  cui l'equipaggiamento ridipinge già il personaggio (`_palGear`).
- **Le tre botteghe.** Il pannello del fabbro (v2.16) è già generico: cambia il catalogo, non il codice.

### Lavoro vero ma lineare
- **Il catalogo per famiglie.** Ri-etichettare 117 pezzi, riscrivere `itemsFor`/`slotsFor`/
  `startingGear`, e **alzare il `FORMATO` del salvataggio**: le partite vecchie si rifiutano (sarebbe la
  terza volta, e per lo stesso buon motivo). ✅ **Nessun pezzo nuovo**, per decisione di Paolo: si
  vincola quello che c'è. Da verificare quando ci si mette mano: con le sole armi di oggi, ogni classe
  deve avere **almeno tre o quattro pezzi per slot a ogni grado**, se no il negozio le mostra due caselle
  e la scelta sparisce.
- **I vincoli.** Una tabella per classe e un controllo unico in `equipaggia`/`buyGear`. Il rischio è
  spargerli in dieci punti: devono stare in **una funzione sola** (`Gear.puoPortare(classe, pezzo)`).
- **Il menu con i mini artwork e le statistiche.** Il ritratto disegnato esiste già — è
  `Renderer._hero`, quello che nella schermata di fine livello disegna il personaggio con addosso
  l'equipaggiamento. Nel menu diventa otto riquadri con sotto quattro barrette FOR/COS/DES/INT.

### Caro, e va deciso a parte
- **DUE ARMI (Maestro d'Armi, Assassino).** È l'unica **meccanica nuova** del piano, ma Paolo l'ha
  ridotta alla versione economica, ed è la scelta giusta:
  **un colpo solo che somma il danno delle due armi, con una piccola penalità** — niente alternanza,
  niente secondo sistema di tiro. **Graficamente: due archi più piccoli** invece di uno.
  ⚠️ **Il vincolo di bilanciamento che ne discende, e che va scritto adesso perché non si perda:** le
  **armi pesanti devono fare più danno** di due leggere sommate, se no la scelta «una pesante o due
  leggere» non esiste e tutti impugnano due pugnali. Oggi (grado 5): pesante 158 contro leggera 66 ×2 =
  132 — il margine c'è, ma è il numero da ricontrollare a ogni ritocco.
- **Le evocazioni.** Qui la buona notizia: il sistema dei **mercenari** è già un compagno che combatte
  da solo, con le sue statistiche e la sua IA (`shared/mercenari.js`), e i mostri sanno già evocare. Un
  evocato è un mercenario a tempo, gratis, che compare dove punti. Resta da decidere: quanti, per quanto,
  e cosa succede se muori tu.
- **Le magie elementali.** Fuoco / gelo / fulmine come *comportamenti del proiettile*. Il motore ha già i
  mattoni (il muro brucia, lo sguardo gelido rallenta, la Catena Nera rimbalza): serve metterli su
  un'arma invece che su un'abilità.
- ~~**Le abilità: 32 da scrivere.**~~ ✅ **RISOLTO dall'idea delle firme** (vedi la sezione apposita):
  **una firma per classe + i serbatoi di famiglia che esistono già**. Da 32 si scende a una decina, e le
  dodici di oggi si riusano tutte. È il risparmio più grosso di tutto il piano.

---

## 🔥 DOVE SI ROMPE — le cose che questo piano tocca e che oggi funzionano

1. **I salvataggi.** `FORMATO` da 3 a 4: gli id dei pezzi e la classe cambiano significato.
2. **Le specializzazioni del 15.** Vedi la decisione in cima: con la via A vanno sostituite, non tolte.
3. **I mercenari.** `mercenari.js` ha le sue `CLASSI` e `STAT_CLASSE`, tarate sui tre eroi: con otto
   classi o si allineano o restano indietro in silenzio.
4. **La modalità di prova.** `_preparaProva` costruisce il personaggio «come sarebbe»: con vincoli e
   famiglie va rifatta.
5. **I test.** Ce ne sono un centinaio che nominano `guerriero`/`mago`/`ladro`. Non si buttano: si
   riscrivono sulle famiglie.
6. **`Renderer._hero`.** Regge tre id: va reso una mappa classe → corpo, se no l'ottava classe non si
   disegna.

---

## 🗺️ COME LO FAREI, SE SI FA

Non tutto insieme. Quattro consegne, ognuna giocabile:

| # | Cosa | Perché in quest'ordine |
|---|---|---|
| **1** | **Le famiglie e i vincoli**, con le TRE classi di oggi. Tre botteghe. Niente classi nuove. | Si cambia l'impianto mentre il gioco resta quello che conosci: se si rompe qualcosa, si vede subito e si sa dov'è. |
| **2** | **Le classi nuove senza meccaniche nuove**: Barbaro, Paladino, Arciere, Stregone (+ profilo, vincoli, corpo, 4 abilità pescate da quelle esistenti). | Otto classi giocabili senza aprire nessun cantiere. |
| **3** | **Il menu**: mini artwork, statistiche in anteprima, via i ranghi. | È la cosa che si vede e che dà senso alle otto scelte. |
| **4** | **Le meccaniche nuove**, una per volta: due armi → evocazioni → elementi. | Ognuna è una versione a sé, con i suoi test. |

---

## ❓ COSA RESTA APERTO

Le prime cinque domande della prima stesura hanno avuto risposta (vedi le decisioni in cima). Restano:

1. **Quante e quali classi al debutto.** Col modello a firme il costo non è più proibitivo (una firma
   per classe invece di quattro abilità), ma resta: ogni classe è firma + filtro del serbatoio + profilo
   + vincoli + palette. Paolo ci vuole riflettere.
2. ~~La scelta del livello 1~~ ✅ **DECISO**: la schermata resta e **presenta** la firma. Non si sceglie.
3. **Il filtro del serbatoio, classe per classe**: quali due o tre abilità di famiglia vede ogni classe.
   È la tabella che rende due classi della stessa famiglia diverse davvero.
4. **La matrice dei vincoli, classe per classe.** La forma è decisa, i valori no: vanno scritti insieme,
   guardando quante caselle restano in negozio per ogni classe a ogni grado.
5. **Gli elementi del mago: vestito o denti?** Prima il disegno (fuoco, gelo, fulmine, veleno), poi si
   decide se fanno anche qualcosa. E quale elemento va su quale delle tredici armi arcane.
6. **Le evocazioni**: quante, per quanto, cosa succede se muori tu.
7. **Cosa succede al livello 15**, un giorno. Per ora: niente.
8. **Il menu coi mini artwork.** Deciso che si fa, da fare: otto riquadri col personaggio disegnato e
   sotto le quattro barrette FOR/COS/DES/INT.

---

## 📍 DOVE SIAMO

Schema aggiornato la sera del 19 settembre con le decisioni di Paolo. **Non è ancora partito niente**, e
non deve: la frase con cui si è chiuso è *«con calma analizzeremo tutto e solo allora partiremo»*.
