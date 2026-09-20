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

> **Serve la tua risposta su questo prima di ogni altra cosa.** Il resto dello schema assume la **A**,
> che è quella che risponde davvero alla tua idea.

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
| **Stregone** | mago | arcana **leggera** · niente armatura pesante | 1 | 2/4/6/10 | Magia elementale grezza, danno puro |
| **Warlock** | mago | arcana **equilibrata** · armatura equilibrata | 1 | 3/6/4/9 | Patto: maledice e prende in prestito |
| **Evocatore** | mago | arcana **pesante** · armatura equilibrata | 1 | 2/6/4/10 | Non combatte: manda gli altri a combattere |

### Le tre che aggiungerei io

| Classe | Corpo | Perché |
|---|---|---|
| **Negromante** | mago | Rialza i mostri che uccidi. **Il motore lo sa già fare**: il Negromante nemico evoca (`summon` in `monsters.js`), e il sistema dei **mercenari** è già un compagno che combatte da solo. È l'abilità più spettacolare che si può fare con codice che esiste. |
| **Chierico** | guerriero | **Nel gioco non c'è nessuno che cura.** Oggi si cura solo l'Ostessa, fra un'ondata e l'altra: un supporto cambierebbe la cooperativa più di qualunque altra classe. Occhio: la v1.93 ha tolto `lifesteal` e `regen` di proposito, e il TEST 58 vieta il loro rientro — quindi il chierico va disegnato senza riaprire quella porta (cure a tempo, non a percentuale di danno). |
| **Monaco** | ladro | L'unico che **non usa armi**: combatte a mani nude e i suoi «pezzi» sono bende e cavigliere. È il vincolo più estremo e il più economico da scrivere — e fa capire a colpo d'occhio che i vincoli sono veri. |

> Sul tuo elenco ho un solo dubbio di merito: **Stregone e Warlock, in D&D, sono due sfumature della
> stessa cosa** (entrambi lanciano per carisma). In un gioco d'azione devono distinguersi col *gesto*,
> non con la storia: qui li ho separati come «danno elementale puro» contro «maledizioni e prestiti».
> Se non ti convince, uno dei due lo toglierei e terrei il Negromante.

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
  terza volta, e per lo stesso buon motivo).
- **I vincoli.** Una tabella per classe e un controllo unico in `equipaggia`/`buyGear`. Il rischio è
  spargerli in dieci punti: devono stare in **una funzione sola** (`Gear.puoPortare(classe, pezzo)`).
- **Il menu con i mini artwork e le statistiche.** Il ritratto disegnato esiste già — è
  `Renderer._hero`, quello che nella schermata di fine livello disegna il personaggio con addosso
  l'equipaggiamento. Nel menu diventa otto riquadri con sotto quattro barrette FOR/COS/DES/INT.

### Caro, e va deciso a parte
- **DUE ARMI (Maestro d'Armi, Assassino).** È l'unica **meccanica nuova** del piano. Oggi l'arma è una:
  `effWeapon(p)` ne restituisce una sola, e tutto il codice del colpo parte di lì. Vanno decise regole che
  oggi non esistono: si alternano o colpiscono insieme? il danno si somma o si dimezza? la cadenza? come
  si disegna il fendente? **Da solo vale quanto tutto il resto messo insieme.** Una via di mezzo onesta:
  «due armi» = un solo colpo che usa la somma dei due danni con una penalità di cadenza — si legge
  subito, non richiede un secondo sistema di tiro.
- **Le evocazioni.** Qui la buona notizia: il sistema dei **mercenari** è già un compagno che combatte
  da solo, con le sue statistiche e la sua IA (`shared/mercenari.js`), e i mostri sanno già evocare. Un
  evocato è un mercenario a tempo, gratis, che compare dove punti. Resta da decidere: quanti, per quanto,
  e cosa succede se muori tu.
- **Le magie elementali.** Fuoco / gelo / fulmine come *comportamenti del proiettile*. Il motore ha già i
  mattoni (il muro brucia, lo sguardo gelido rallenta, la Catena Nera rimbalza): serve metterli su
  un'arma invece che su un'abilità.
- **Le abilità.** È il vero costo nascosto: oggi sono **12** (4 per classe × 3). Con otto classi e la
  stessa densità diventano **32**. Ogni abilità è tabella + ramo del server + effetto grafico. **Più che
  il codice, è il tempo.**

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

## ❓ LE DOMANDE APERTE — decide Paolo

1. **Le specializzazioni del 15**: via A, B o C? *(È la prima, e blocca tutto il resto.)*
2. **Quante classi al debutto?** Otto è tanto: 32 abilità da scrivere e bilanciare. Ne farei **cinque**
   al primo giro e tre dopo. Quali cinque?
3. **Stregone e Warlock restano due**, o uno diventa il **Negromante**?
4. **Le due armi**: la versione economica («un colpo solo, danno sommato, cadenza penalizzata») basta, o
   le vuoi davvero alternate con due animazioni?
5. **Chierico sì o no?** È l'unica che cambia la cooperativa — ed è anche l'unica che sfiora una regola
   che tu avevi voluto: nessuno rimette PV fuori dall'Ostessa.
6. **I pezzi nuovi**: quanti ne vuoi davvero? Con le famiglie il catalogo si riusa, ma servono armi da
   **tiro** vere (oggi c'è solo l'arco) e armi **arcane** di più tipi.
