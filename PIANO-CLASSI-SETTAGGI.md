# ⚔️ SETTAGGI DELLE CLASSI — le decisioni prese

**Aperto il 20 settembre 2026, a partire dalla versione 2.17.1.**
Questo file è il **registro delle decisioni** di Paolo sulle classi: cosa impugna ciascuna, cosa
indossa, con quale statistica scala. Il ragionamento e le proposte stanno in
[`PIANO-CLASSI.md`](PIANO-CLASSI.md); **qui ci sono solo le cose decise**, scritte come sono state
dette. Se una riga è qui, è legge. Se non è qui, non è ancora stata decisa.

> ## ✅ REALIZZATO NELLA v2.18.0 (20 settembre 2026)
> Tutto quello che c'è scritto qui sotto **è nel gioco**: le sette classi, il Carisma, la matrice 7 × 5,
> le nove firme, le abilità del 7 e del 13, la regola dei 10 secondi, le passive con le sei carte nuove,
> la schermata di scelta con gli artwork e le sagome in partita. Test: **3949 passati, 0 falliti**.
>
> **Non sono state fatte** (e sono scritte come dipendenze, non come dimenticanze): gli **elementi delle
> verghe** — finché non esistono, le due abilità dell'elementalista che li leggono si comportano tutte
> come fuoco — e il modello **peso × tipologia** dell'equipaggiamento del punto 2, che per ora è servito
> dai 117 pezzi esistenti attraverso le tre impalcature.

---

## 1. 🆕 IL CARISMA DIVENTA UNA STATISTICA

> *«Per prima cosa va aggiunto il carisma come abilità. Il carisma scala le magie delle classi:
> paladino, stregone e warlock. Mi rendo conto che si tratta di una nuova abilità e va rivisto il
> danno delle magie ma dato che stiamo riprogettando il tutto non è un dramma.»*

- Le statistiche passano da **quattro a cinque**: Forza, Costituzione, Destrezza, Intelligenza,
  **Carisma**.
- Il Carisma **scala le magie** di **paladino e warlock**. (Nella frase originale c'era anche lo
  stregone: vedi la decisione qui sotto.)
- L'Intelligenza continua a scalare le magie del **mago**.
- Paolo mette in conto che **il danno delle magie vada ribilanciato**: è accettato in partenza.

**Cosa tocca, nel codice di oggi** (elenco per chi riprende, non una decisione):
`Loot.XP_STATS` ha esattamente quattro voci con la colonna `school` (`st_for`→melee, `st_int`→magic,
`st_des`→ranged, `st_cos`→nessuna); `applicaStat()` in `server/Room.js` le mappa una per una;
`Heroes.STAT_BASE` è una matrice 3 classi × 4 statistiche e `STAT_MAX = 20` (8 di partenza + 12
spendibili); il profilo di classe (`profiloPunti`) misura lo scarto dal centro 5,5 su quelle quattro;
il pannello GDR disegna quattro righe. La quinta statistica passa da tutti questi punti.

### ✅ Deciso: quinta statistica vera, budget invariato

> *«quinta statistica vera; sono 14 punti tot. ma la difficoltà o la scelta è proprio il saper
> distribuire i punti»*

- Il Carisma è una **statistica a sé**, la quinta, presente per **tutte** le classi: cinque righe nel
  pannello GDR, cinque caselle nella matrice di partenza, cinque voci acquistabili.
- Il budget **resta 14 punti** in tutta la partita. Non si compensa niente.
- **Questo è voluto**: con cinque statistiche e lo stesso budget, decidere dove mettere i punti diventa
  la scelta vera del giocatore. Una classe che vive su due statistiche (il paladino: Forza per le armi,
  Carisma per le magie) **deve** rinunciare a qualcosa; una che ne alza una sola va più in profondità.
  È la difficoltà, non un effetto collaterale da correggere.

**Conseguenza da tenere in conto quando si ribilancia:** con cinque caselle e 14 punti nessuno può più
salire vicino al tetto su due fronti. I numeri delle magie vanno quindi tarati su un Carisma
**realisticamente medio** per le classi ibride (il paladino, che deve alzare anche la Forza), non sul
massimo teorico. Sul tetto vero e proprio vedi il punto 4.

### ✅ Deciso: lo stregone non esiste, le classi sono sette

> *«hai ragione, ho rimosso lo stregone preferisco il warlock perciò sono 7»*

Lo **stregone è stato eliminato**: il suo posto — l'incantatore che scala con il Carisma — lo occupa il
**warlock**. Le classi del gioco sono quindi **sette**, quelle del punto 3 e nessun'altra:
barbaro · paladino · maestro d'armi · assassino · arciere · mago · warlock.

Questo **chiude anche il conto con `PIANO-CLASSI.md`**, che ne elencava nove: stregone tolto, evocatore
e negromante non sono classi ma **titoli del mago** (punto 3).

---

## 2. 📐 COME SI LEGGONO I VINCOLI

> *«Vincoli, "tutte" ovviamente significa (leggere, medie, pesanti) accanto c'è la tipologia
> (mischia, arco o magia). Posso esserci combinazioni (es. tutte le armature leggere mischia e/o
> arco). Se viene indicato solo 1 tipo es. "leggere, mischia" significa che può indossare solo quella
> tipologia.»*

Ogni vincolo ha **due assi**:

| Asse | Valori |
|---|---|
| **Peso / categoria** | leggere · medie · pesanti — «tutte» = tutte e tre |
| **Tipologia** | mischia · arco · magia |

Si leggono insieme: `leggere, mischia` = **solo** armi leggere da mischia. `tutte, mischia/arco` =
qualsiasi peso, purché da mischia o da arco. Più combinazioni si separano con `-`
(es. `leggere, mischia - tutte, magia`).

---

## 3. 🛡️ LE SETTE CLASSI

Righe trascritte come le ha scritte Paolo.

### BARBARO — **FORZA**
| | |
|---|---|
| **Armi** | tutte, mischia — **bonus di classe al danno con arma pesante** |
| **Armature** | leggere, mischia/arco |
| **Doppia arma su 2 mani** | tutte, mischia |
| **Spada + scudo** | tutte mischia + scudo — **unica classe che può portare arma pesante e scudo** |
| **Magie** | no |

### PALADINO — **CARISMA** (magie) / **FORZA** (armi)
| | |
|---|---|
| **Armi** | tutte, mischia |
| **Armature** | tutte, mischia |
| **Doppia arma** | no |
| **Spada + scudo** | leggere/medie + scudo, mischia — **con arma pesante non può indossare lo scudo** |
| **Magie** | sì — Carisma, **solo magie di classe** |

### MAESTRO D'ARMI — **DESTREZZA / FORZA**
| | |
|---|---|
| **Armi** | tutte, mischia |
| **Armature** | tutte, mischia |
| **Doppia arma** | leggere/medie, mischia |
| **Spada + scudo** | leggere/medie + scudo, mischia |
| **Magie** | no |

### ASSASSINO — **DESTREZZA / FORZA**
| | |
|---|---|
| **Armi** | leggere/medie, mischia/arco |
| **Armature** | leggere/medie, mischia/arco |
| **Doppia arma** | leggere, **solo mischia** — **bonus di classe al danno con doppia arma leggera da mischia** |
| **Spada + scudo** | no |
| **Magie** | no |

### ARCIERE — **DESTREZZA**
| | |
|---|---|
| **Armi** | tutte, arco — **bonus di classe al danno con arco** |
| **Armature** | tutte, arco |
| **Doppia arma** | no |
| **Spada + scudo** | no |
| **Magie** | no |

### MAGO — **INTELLIGENZA**
| | |
|---|---|
| **Armi** | tutte, mago — **bonus di classe con staffa** |
| **Armature** | tutte, mago |
| **Doppia arma** | leggere, mago |
| **Spada + scudo** | no |
| **Magie** | sì — scalano con Intelligenza |

> *«Il mago avrà magie elementari, evocazione o negromanzia. Sarà l'unica classe a cui dovrà essere
> decisa l'abilità iniziale: in base alla scelta diventerà: elementare, evocatore o negromante.
> Questo sarà solo un titolo che gli verrà affidato.»*

Quindi: **il mago è una classe sola**. La scelta della prima abilità attiva (elementare / evocazione /
negromanzia) gli assegna un **titolo**, non una classe diversa: non cambia armi, armature né statistica
di riferimento.

### WARLOCK — **CARISMA**
| | |
|---|---|
| **Armi** | leggere, mischia — tutte, magia |
| **Armature** | leggere, mischia — tutte, magia |
| **Doppia arma** | no |
| **Spada + scudo** | no |
| **Magie** | sì — scalano con Carisma |

---

## 4. 🎲 LE STATISTICHE DI PARTENZA — la matrice 7 × 5

Proposta mia, **corretta e approvata da Paolo**. Sostituisce `Heroes.STAT_BASE`, che oggi e' 3 × 4.

| Classe | FOR | COS | DES | INT | CAR | tot |
|---|---|---|---|---|---|---|
| **Barbaro** | **10** | 8 | 2 | 1 | 1 | 22 |
| **Paladino** | 6 | 7 | 2 | 1 | 6 | 22 |
| **Maestro d'armi** | 7 | 6 | 6 | 2 | 1 | 22 |
| **Assassino** | 6 | 4 | **10** | 1 | 1 | 22 |
| **Arciere** | 2 | 5 | **10** | 3 | 2 | 22 |
| **Mago** | 1 | 5 | 5 | **10** | 1 | 22 |
| **Warlock** | 3 | 5 | 4 | 3 | 8 | **23** |

### Come si legge

- **Picco 10 = classe monostatistica.** Barbaro (FOR), assassino e arciere (DES), mago (INT) nascono
  gia' forti nel loro mestiere e possono spendere i 14 punti in profondita'.
- **Picco 6-7 = classe a due statistiche.** Paladino (FOR 6 + CAR 6) e maestro d'armi (FOR 7 + DES 6)
  nascono piu' tondi ma devono dividere i punti. **E' la difficolta' voluta**, vedi il punto 1.
- **Assassino e arciere sono speculari**: stesso DES 10, ma 6/4 di FOR/COS contro 2/5. Vetro che
  colpisce in faccia contro tiratore che sta lontano e regge un po' di piu'.
- **Gli 1 sono voluti**: *«e' ovvio che int per un guerriero non serve, quindi si' sono 5 stat ma di
  fatto non si usano tutte»*.

### ✅ Due cose decise esplicitamente

> *«lascia cosi' anche il tetto. so cosa faccio»*

1. **Il warlock parte con 23 punti**, non 22. Segnalato come sfasamento, Paolo lo lascia cosi'.
2. **Il tetto `STAT_MAX = 20` non si tocca.** Segnalato che con i picchi a 10 il conto di oggi
   (8 di partenza + 12 spendibili = 20) non regge piu': chi parte da 10 arriverebbe a 22. Paolo lascia
   cosi' e sa come intende gestirlo. **Non va "corretto" di iniziativa.**

### ⚠️ Conseguenza ancora da tarare

Il **profilo di classe** (`profiloPunti`) misura lo scarto dal centro **5,5**, che era la media delle
quattro statistiche (22 / 4). Con cinque statistiche la media diventa **4,4** (22 / 5): lasciando 5,5
ogni classe risulterebbe sotto la media e il profilo toglierebbe PV a chiunque. Lo scarto pero' si
allarga (con i picchi a 10 ancora di piu'), quindi va probabilmente abbassato anche `PROFILO_PESO`,
oggi 0,5. **Da misurare quando si implementa, non da indovinare adesso.**

Nota storica: nella 3 × 4 di oggi guerriero e ladro totalizzano 22 ma il **mago 20** (2/4/6/8). Scarto
che c'era da sempre, quasi certamente non voluto; la nuova matrice lo chiude.

---

## 5. 🎯 L'ABILITÀ INIZIALE È DI CLASSE

Deciso prima di questo elenco e qui confermato:

> *«La scelta diventa una sorta di abilità di classe che ti viene data in base al personaggio, perciò
> non sparisce, semplicemente non c'è scelta.»*

Al **livello 1** l'abilità attiva non si sceglie più da un'offerta: **la dà la classe** (il paladino
riceve la sua, il barbaro la sua). L'**unica eccezione è il mago**, che sceglie fra elementare,
evocazione e negromanzia — e da quella scelta prende il titolo.
Le abilità dei livelli **7** e **13** restano a scelta (scaletta della v2.16, vedi
[`PIANO-PROGRESSIONE.md`](PIANO-PROGRESSIONE.md)).

---

## 6. ✨ LE ABILITÀ DEL LIVELLO 1 — approvate

> *«le abilità vanno bene»*

Si **ricevono, non si scelgono**: la schermata prima di scendere passa da «scegli» a «ecco cosa sai
fare». Nessuna di queste esiste nel codice: **vanno tutte scritte**.

| Classe | Firma | Cosa fa |
|---|---|---|
| 🪓 **Barbaro** | **Furia** | Fai il 50% di danno in più e ne incassi il 25% in più. Mentre dura non puoi bere. |
| ✨ **Paladino** | **Benedizione** | Aura di 220px: tu e i compagni dentro subite il 25% di danni in meno, e il 20% di quello che incassate torna al mittente. |
| ⚔️ **Maestro d'Armi** | **Danza delle Lame** | La cadenza sale del 60% e ti muovi a velocità piena mentre colpisci. È il contrario del Turbine, che ti inchioda. |
| 🌑 **Assassino** | **Ombra Lunga** | Sparisci e ricompari dietro il bersaglio mirato: il colpo che segue è un critico garantito. |
| 🏹 **Arciere** | **Pioggia di Frecce** | Una salva su un'area scelta, non su un bersaglio: si tira dove *saranno*. |
| ⛓️ **Warlock** | **Patto** | Maledici un nemico: prende il 35% di danni in più, e se muore maledetto il tuo colpo successivo vale doppio. |

### Il mago sceglie la scuola, e ne prende il titolo

| Scuola | Titolo | Abilità del livello 1 |
|---|---|---|
| Elementare | **Elementalista** | **Scarica Elementale** — esplosione dell'elemento dell'arma impugnata: fuoco, gelo, fulmine o veleno. Una abilità, quattro facce. |
| Evocazione | **Evocatore** | **Evocazione** — chiami un compagno dove punti. |
| Negromanzia | **Negromante** | **Rialzata** — l'ultimo mostro che hai ucciso si rialza e combatte per te. |

Il titolo e' solo un titolo: non cambia armi, armature ne' statistica di riferimento (punto 3).
**Scarica Elementale** era la firma dello stregone, ora eliminato; e' la piu' conveniente dell'elenco
perche' una sola abilita' scritta da' quattro giocate. **Evocazione** e **Rialzata** sono le due piu'
care: vogliono creature alleate gestite dal server, meccanica che oggi non esiste.

> ❓ **Non ancora deciso**: se la scuola del mago filtri anche le scelte dei livelli 7 e 13, o decida
> solo l'abilita' iniziale e il titolo. Parole di Paolo: *«piano, ci arriveremo»*.

---

## 7. ⏱️ LA REGOLA DEI 10 SECONDI

> *«10 secondi a tutte quelle che hanno un tempo di effetto, altre come evocazioni non hanno limiti
> temporali»*

**Ogni effetto a tempo dura 10 secondi.** Una regola sola al posto di dodici numeri diversi.

| Abilita' | Oggi | Domani |
|---|---|---|
| Danza delle Lame | 2,5s | **10s** |
| Benedizione | 6s | **10s** |
| Furia | 8s | **10s** |
| Patto | 10s | **10s** (gia' giusta) |
| Grido di Guerra | 4s | **10s** |
| Giuramento | 5s | **10s** |
| Muro di Fuoco | 5s | **10s** |
| Marchio | 8s | **10s** |
| Tempo Rubato | 4s | **10s** |

**Senza durata, non cambiano:** Carica, Meteora, Catena Nera, Ombra Lunga, Pioggia di Frecce, Scarica
Elementale. **Le evocazioni non hanno limite di tempo**: Evocazione e Rialzata restano finche' non
muoiono.

### ✅ Le tre eccezioni, decise

> *«quelle 3 lasciale come sono, le tue obiezioni sono corrette»*

| Abilita' | Resta | Perche' |
|---|---|---|
| **Turbine** | 1,2s | Non e' un effetto a tempo, e' un'**azione** a tempo: tre rotazioni. A 10s non si prolunga niente, diventa un'altra abilita'. |
| **Salva** | 2s | Idem: quindici frecce. A 10s sarebbero un centinaio. |
| **Tagliola** | blocco 2,5s | Un blocco da 10s non rallenta un mostro, **lo cancella dalla partita**. |

### ✅ Le ricariche NON si toccano

> *«lasciamole come sono quelle attuali, anche perche' spesso ci si dimentica di usarle»*

Restano **30s / 45s / 60s** per il primo, secondo e terzo slot.

Segnalato prima di decidere: quelle cifre furono tarate su effetti da 4-6 secondi, e con la durata
fissa a 10 un'abilita' del primo slot e' attiva **un terzo del tempo** (la Furia = +50% di danno per un
terzo della partita; il Tempo Rubato = dieci secondi di mondo al 35% ogni trenta). Paolo lo accetta
consapevolmente, e con una ragione di gioco precisa: **spesso il giocatore si dimentica di usarle**, e
una ricarica lunga peggiora il problema invece di risolverlo. Le abilita' devono farsi sentire.

**Non e' un numero da "sistemare" in seguito.** Se il gioco risultasse troppo facile, si guardi
altrove: alla difficolta' delle ondate, non a queste tre cifre.

---

### ✅ Lo Scudo di Mana non va a tempo

> *«lo scudo di mana di solito non e' a tempo, semplicemente la barriera dopo tot danni si rompe»*

Esce dalla regola dei 10 secondi: la barriera **assorbe una quantita' di danni e si rompe**, non scade.
Resta l'esplosione alla rottura (respinge e rallenta chi sta addosso), che era gia' prevista.

> *«il mago porta lo scudo fino al termine dell'ondata, non puo' protrarsi all'altra ondata. La
> quantita' di danni assorbiti scala con intelligenza.»*

- **Quanto assorbe**: **8 danni per ogni punto di Intelligenza**. Il mago parte con INT 10, quindi
  **80** — quattro quinti dei suoi 100 PV — e arriva a **160** portando l'Intelligenza a 20.
  Scartato il 10 per punto (raddoppiava i PV del mago e rendeva lo scudo la scelta obbligata di ogni
  ondata invece di una giocata) e il 6 (si rompeva subito, l'esplosione diventava il vero motivo del
  lancio).
- **Quanto dura**: **fino alla fine dell'ondata**. Dentro l'ondata non scade: resta finche' non lo
  rompono. **Non passa mai all'ondata successiva** — a ondata finita sparisce comunque.
- Dentro l'ondata l'unico limitatore e' quindi la **ricarica** dell'abilita', non il tempo.

---

## 8. 🎓 LE ABILITÀ DEI LIVELLI 7 E 13 — approvate

> *«vorrei crearne almeno 1 di classe (per mago 1 per ogni scuola di magia) al livello 7 e una al
> livello 13. L'altra puo' essere una di quelle che mi hai elencato che si adatti alla classe»* —
> e poi: *«belle mi piacciono»*.

**Il modello.** A ogni livello di abilita' (7 e 13) la classe vede **due candidati**:
1. una **abilita' nuova, sua e di nessun altro**;
2. una **del serbatoio** — le dodici che esistono gia' — scelta perche' le calza.

Il mago ha una coppia **per ogni scuola**, quindi la scuola scelta al livello 1 **filtra** anche il 7 e
il 13. (Era la domanda parcheggiata al punto 6: si risolve da sola.)

Fra parentesi, dove ho preso l'ispirazione.

### 🪓 Barbaro
| Liv. | ✨ Nuova, di classe | Dal serbatoio |
|---|---|---|
| **7** | **Spaccaossa** — carichi il colpo e lo scarichi in linea retta: sfonda tutti quelli in fila e li stordisce. *(Great Weapon Master)* | **Carica** |
| **13** | **Ultimo Respiro** — per 10s non puoi scendere sotto 1 PV. Quando finisce incassi tutto insieme quello che hai schivato — o sei ancora in piedi. *(Relentless Rage)* | **Turbine** |

### ✨ Paladino
| Liv. | ✨ Nuova, di classe | Dal serbatoio |
|---|---|---|
| **7** | **Punizione Divina** — il prossimo fendente esplode in luce: danno pieno sul bersaglio, meta' su tutto intorno. *(Divine Smite)* | **Grido di Guerra** |
| **13** | **Baluardo Sacro** — pianti lo scudo: per 10s i colpi frontali non ti toccano e chi ti sbatte contro rimbalza e brucia. *(Shield Master + Aura of Warding)* | **Giuramento** |

### ⚔️ Maestro d'Armi
| Liv. | ✨ Nuova, di classe | Dal serbatoio |
|---|---|---|
| **7** | **Parata e Risposta** — per 10s pari un colpo ogni 1,5s, e ogni parata fa partire un contrattacco. *(Battle Master: Parry + Riposte)* | **Turbine** |
| **13** | **Impeto** — per 10s le ricariche di tutte le altre abilita' scorrono al doppio. *(Action Surge)* | **Carica** |

### 🌑 Assassino
| Liv. | ✨ Nuova, di classe | Dal serbatoio |
|---|---|---|
| **7** | **Lame Sporche di Verde** — per 10s ogni colpo avvelena, e il veleno si somma su chi lo prende piu' volte. *(Assassin's Poisoner)* | **Tagliola** |
| **13** | **Colpo Mortale** — per 10s qualunque nemico sotto il 30% di vita che colpisci muore sul posto. I boss no: prendono un danno enorme. *(Death Strike)* | **Marchio** |

### 🏹 Arciere
| Liv. | ✨ Nuova, di classe | Dal serbatoio |
|---|---|---|
| **7** | **Tiro Ancorato** — se non ti muovi il danno cresce a ogni freccia fino a +60%; al primo passo riparte da zero. *(Sharpshooter + Steady Aim)* | **Salva** |
| **13** | **Freccia di Fulmine** — una freccia che al primo impatto scarica un fulmine su tutti i nemici allineati dietro. *(Arcane Archer: Lightning Arrow)* | **Tempo Rubato** |

### ⛓️ Warlock
| Liv. | ✨ Nuova, di classe | Dal serbatoio |
|---|---|---|
| **7** | **Fame delle Tenebre** — una zona di buio per 10s: dentro si va piano e si perde vita di continuo. *(Hunger of Hadar)* | **Catena Nera** |
| **13** | **Maledizione Contagiosa** — quando un maledetto muore, la maledizione salta al nemico piu' vicino. Si incatena con il Patto. *(Hex che si sposta alla morte)* | **Scudo di Mana** |

### 🔮 Mago — una coppia per ogni scuola
| Scuola | Liv. | ✨ Nuova | Dal serbatoio |
|---|---|---|---|
| **Elementalista** | **7** | **Impronta Elementale** — per 10s ogni bolla lascia a terra una pozza dell'elemento impugnato: brucia, rallenta, stordisce o avvelena. *(una abilita', quattro facce)* | **Muro di Fuoco** |
| | **13** | **Palla di Fuoco** — danno ad area, **dell'elemento impugnato**: il fuoco esplode, il gelo congela la zona, il fulmine rimbalza fra i colpiti, il veleno lascia la pozza. *(Fireball)* | **Meteora** |
| **Evocatore** | **7** | **Richiamo del Branco** — invece di una creatura ne chiami tre, piccole e veloci. | **Scudo di Mana** |
| | **13** | **Evocazione Maggiore** — una sola creatura grande, che regge i colpi e picchia ad area. *(Conjure Elemental)* | **Catena Nera** |
| **Negromante** | **7** | **Nube Mortifera** — una nube di veleno che avanza lentamente per 10s: dentro si perde vita e si va piano. *(Cloudkill)* | **Muro di Fuoco** |
| | **13** | **Dito della Morte** — un raggio che uccide sul colpo un nemico non boss, e quello si rialza al tuo fianco. *(Finger of Death)* | **Catena Nera** |

### 🧾 Il conto, e due regole da non perdere

**18 abilita' nuove** qui, piu' le **9 firme** del livello 1 (sei classi + tre scuole del mago):
**27 da scrivere** in tutto. Sedici delle 27 si appoggiano a meccaniche che esistono gia' (veleno,
esecuzione, catene, campi a terra, rimbalzi, rallentamenti, parate). Le care restano le **evocazioni**,
che vogliono creature alleate gestite dal server — meccanica che oggi non c'e'.

> 🚫 **Nessuna abilita' cura.** Niente Tocco Vampirico, niente Imposizione delle Mani: rimettere in
> piedi il personaggio e' il mestiere dell'**Ostessa**, e il codice lo difende da piu' versioni (v1.74:
> ne' comprare Costituzione ne' le carte curano mai). Chi scrivera' queste 27 non lo scopra sbagliando.

> ⏱️ Tutte le durate qui sono **10 secondi**, per la regola del punto 7. Le ricariche restano
> **30 / 45 / 60** per slot.

### ✅ La Palla di Fuoco cambia elemento

> *«ok con la seconda proposta»*

Sostituisce **Sovraccarico** (che raddoppiava il danno a prezzo di vita) ed **e' elementale come la
Scarica Elementale**: una abilita' scritta, quattro facce. Serviva a distinguerla dalla **Meteora**, con
cui divide il riquadro al livello 13: erano entrambe danno ad area lanciato a distanza e la scelta
sarebbe stata finta. Cosi' la differenza e' netta e si aggancia al sistema degli elementi delle verghe.

> ⚠️ **Dipendenza da non dimenticare.** Due abilita' dell'elementalista — **Scarica Elementale** (liv. 1)
> e **Palla di Fuoco** (liv. 13) — leggono l'**elemento dell'arma impugnata**, e quel sistema **non
> esiste ancora**: oggi le verghe del mago si distinguono quasi solo per il raggio della bolla. Gli
> elementi (fuoco / gelo / fulmine / veleno) vanno fatti **prima** di queste due, o le due abilita' non
> hanno su cosa poggiare.

---

## 9. 🃏 LE PASSIVE DEI LIVELLI 3, 5, 9 E 11 — approvate

Le **32 carte** esistenti sono gia' divise in quattro fasce che coincidono esatte con i livelli della
scaletta: **3 = non comune · 5 = rara · 9 = epica · 11 = divina**. Qui si decide **chi puo' vedersi
offrire cosa**, non si riscrivono le carte.

### Le 8 universali — le vede chiunque
| Fascia | Carte |
|---|---|
| **3** non comune | Occhio di Falco · Passo Rapido |
| **5** rara | Tossina · Scudo Vitale |
| **9** epica | Giustiziere · Baluardo |
| **11** divina | Ultima Occasione · Colpo di Grazia |

### Le carte proprie di ogni classe

**🪓 Barbaro** — tutto il serbatoio del guerriero
**3** Arma Pesante · Colpo Ampio — **5** Presa Salda · Rappresaglia — **9** Adrenalina Pura · Colosso —
**11** Deflagrazione Cadaverica · Onda di Ritorno

**✨ Paladino** — il guerriero che regge, non quello che sfonda
**3** Arma Pesante · Colpo Ampio — **5** Presa Salda · Rappresaglia — **9** Colosso · ✨ Ira Giusta —
**11** Onda di Ritorno · ✨ Consacrazione
> Niente Adrenalina Pura ne' Deflagrazione Cadaverica: sono la ferocia del barbaro, non la disciplina
> del paladino.

**⚔️ Maestro d'Armi** — mischia piu' il ritmo del ladro
**3** Arma Pesante · Colpo Ampio — **5** Presa Salda · Passo di Danza — **9** Adrenalina Pura · Lama
Sporca — **11** Onda di Ritorno · Punto Vitale

**🌑 Assassino** — critici, emorragie, sparizioni
**3** Perforazione · ✨ Agguato — **5** Colpo alle Spalle · Passo di Danza — **9** Lama Sporca · Passo
d'Ombra — **11** Punto Vitale · Uscita di Scena

**🏹 Arciere** — distanza e immobilita'
**3** Perforazione · Tiro Lungo — **5** Colpo alle Spalle · ✨ Vento in Poppa — **9** Concentrazione ·
Passo d'Ombra — **11** Punto Vitale · Campo di Lentezza
> **Concentrazione** e **Campo di Lentezza** vengono dal serbatoio del mago ma sull'arciere rendono di
> piu': si incastrano col **Tiro Ancorato** del livello 7. Sono anche cio' che separa l'arciere
> dall'assassino, che altrimenti pescherebbero dalle stesse carte.

**🔮 Mago** — tutto il suo serbatoio, **per tutte e tre le scuole**
**3** Bolla Densa · Tocco Gelido — **5** Catena di Fulmini · Rimbalzo — **9** Colpi Esplosivi ·
Concentrazione — **11** Frattura Arcana · Campo di Lentezza

**⛓️ Warlock** — il serbatoio arcano meno cio' che e' del mago
**3** Bolla Densa · Tocco Gelido — **5** Catena di Fulmini · Rimbalzo — **9** Colpi Esplosivi ·
✨ Tributo di Sangue — **11** ✨ Marchio del Patrono · Campo di Lentezza
> Niente **Frattura Arcana** (la bolla che uccide si sdoppia): e' il marchio del mago. Il carattere del
> warlock sta nelle maledizioni.

### ✅ Le sei carte nuove

> *«per le classi con poche alternative o troppo ripetitive prova ad aggiungere altre carte, ma solo
> per le classi che oggettivamente hanno poca scelta»*

Contate le carte proprie fascia per fascia, **quattro classi ne avevano una sola** da qualche parte
(paladino all'epica e alla divina, assassino alla non comune, arciere alla rara, warlock all'epica e
alla divina). Le altre tre — barbaro, maestro d'armi, mago — ne hanno due ovunque e **non sono state
toccate**. Sei buchi, sei carte; ognuna si appoggia a una meccanica gia' in piedi.

| Classe | Fascia | ✨ Carta | Cosa fa | Si appoggia a |
|---|---|---|---|---|
| Paladino | epica | **Ira Giusta** | Il 15% del danno che subisci torna a chi te l'ha dato. | `thornsPct`, dalla v1.79 |
| Paladino | divina | **Consacrazione** | I nemici entro 200px prendono il 10% di danni in piu'. | la stessa aura del Campo di Lentezza, rovesciata |
| Assassino | non comune | **Agguato** | Il primo colpo su un nemico ancora a vita piena fa +15%. | il gancio sul danno del colpo |
| Arciere | rara | **Vento in Poppa** | Le frecce viaggiano il 25% piu' veloci, la gittata cresce del 15%. | `bulletSpeed` e `range` dell'arma |
| Warlock | epica | **Tributo di Sangue** | Ogni nemico che muore entro 250px da' +6% danno per 4s, fino a +36%. | la macchina dell'Adrenalina Pura, ma sul danno e sulle morti altrui |
| Warlock | divina | **Marchio del Patrono** | Ogni sesto colpo maledice il bersaglio: +25% danni subiti per 4s. | il marchio che esiste gia' come abilita' |

### ⚠️ Le tre scuole del mago condividono le passive

Elementalista, evocatore e negromante vedono **le stesse otto carte**, comprese Bolla Densa e Frattura
Arcana, che parlano di bolle. **Deciso di non aggiungere carte qui**, e non per pigrizia: le passive che
distinguerebbero l'evocatore e il negromante parlerebbero tutte di creature evocate — piu' evocazioni,
evocazioni piu' dure, i rialzati che esplodono — e **le evocazioni non esistono ancora**. Non si
progetta una carta prima della meccanica che descrive: vanno fatte **insieme** alle evocazioni.

---

## 10. 🎨 L'ESTETICA — approvata

Due cose diverse, da non confondere mai (precisazione di Paolo):

| | Cos'e' | Dove vive |
|---|---|---|
| **Artwork** | Le sette illustrazioni, ritagliate da un'unica immagine | **Solo** nella schermata di scelta del personaggio |
| **Sagome in gioco** | I personaggi disegnati a Canvas, visti dall'alto | **In partita**, sono i pupazzi che si muovono |

### 10a. Gli artwork della selezione

Ritagliati dall'illustrazione unica e salvati in **`public/assets/classi/`**: `barbaro.png`,
`paladino.png`, `maestro.png`, `assassino.png`, `arciere.png`, `mago.png`, `warlock.png`
(174 × 452 ciascuno, senza la cornice dorata e senza la targhetta col nome — quella la fa il testo).

**La nuova schermata** (bozza approvata: `bozze/bozza-scelta-eroe.html`) sostituisce il riquadro con le
tre classi di oggi:

- un **box quadrato**: a sinistra l'artwork, a destra nome, epiteto, i **cinque punti attributo** a
  barre e una breve descrizione;
- per il **mago**, in fondo, le **tre scuole** con il titolo che ciascuna gli da';
- **frecce a destra e a sinistra** per scorrere le sette classi (e i tasti ← →);
- gli **epiteti** seguono lo schema gia' in uso («Lama della Faglia»): Furia · Scudo · Lama · Ombra ·
  Occhio · Custode · Patto **della Faglia**.

### 10b. Le sagome in gioco

Bozza approvata: `bozze/bozza-eroi.html` (animata, col tasto *Colpo* e la *scala di gioco*).

**La regola che tiene basso il costo: le impalcature restano TRE**, quelle di oggi.

| Impalcatura | Classi | Da dove viene |
|---|---|---|
| **pesante** | barbaro · paladino · maestro d'armi | `_heroGuerriero` |
| **agile** | assassino · arciere | `_heroLadro` |
| **arcana** | mago · warlock | `_heroMago` |

Dentro ciascuna cambiano **solo quattro cose**: la **testa** (elmo chiuso, elmo aperto, testa nuda,
cappuccio, cappello a tesa), le **spalle** (acciaio o pelliccia), l'**arma** (ascia, spada+scudo, due
spade, due pugnali, arco, bastone, sigillo) e la **tinta**. Nessuna impalcatura nuova da scrivere, e
l'equipaggiamento continua a ridipingere gli stessi pezzi di oggi.

| Classe | Cosa la distingue |
|---|---|
| **Barbaro** | Testa scoperta con criniera, codino e barba; **spalle di pelliccia** al posto degli spallacci; petto nudo con la cinghia di cuoio; **ascia a due mani** che si protende nel colpo. Niente elmo, niente piastra. |
| **Paladino** | Il guerriero di oggi portato a compimento: **elmo chiuso** con cresta, piastra lucida, **tabarro** chiaro col sole sul petto, scudo dall'orlo dorato, spada corta. |
| **Maestro d'Armi** | **Elmo aperto** col viso scoperto e la **sciarpa rossa** che svolazza, niente scudo, **due spade** che si aprono a forbice nel colpo, mantello scuro corto. |
| **Assassino** | Il ladro senza arco: **due pugnali** tesi in avanti, tinta carbone e indaco, **scia d'ombra** che lo segue. |
| **Arciere** | Il ladro che resta arciere: arco lungo di fianco, faretra, cappuccio. **Verde bosco** al posto del verde scuro, legno dell'arco piu' chiaro. |
| **Mago** | Quello di oggi piu' una cosa sola: il **cappello a tesa larga** invece del solo cappuccio — dall'alto e' la sagoma che lo rende riconoscibile a colpo d'occhio. Bastone, orbe e rune in orbita restano. |
| **Warlock** | Stessa veste del mago ma **orlo a brandelli**, niente bastone: un **sigillo** che ruota sospeso davanti al palmo, e tre filamenti che strisciano dietro. |

> ✅ **Il warlock NON ha occhi accesi.** Erano nella prima bozza; Paolo li ha fatti togliere. Sotto il
> cappuccio c'e' solo la fessura buia. Non vanno rimessi.

---

## 11. 🧭 DA TENERE PRESENTE (segnalato, non deciso)

Solo l'elenco: si affrontano **uno per volta**, in sequenza, quando Paolo lo dice.

1. Il pannello GDR va rifatto su **cinque** righe e **sette** classi (la matrice e' al punto 4; resta
   da tarare il centro del profilo).
2. `shared/gear.js` oggi ha 117 pezzi legati a **tre** eroi (`guerriero`, `mago`, `ladro`) con gli slot
   fissi per eroe: il modello «peso × tipologia» di questo file è un'altra cosa e va rifatto.
3. La **doppia arma** e lo **scudo** non esistono come meccaniche: oggi c'è uno slot `shield` solo per
   il guerriero e nessun concetto di impugnatura.
4. I **bonus di classe** (pesante per il barbaro, doppia leggera per l'assassino, arco per l'arciere,
   staffa per il mago) sono da quantificare.
5. I proiettili elementali del mago (fuoco / gelo / fulmine / veleno al posto della grandezza della
   bolla) restano in coda: *«prima il vestito, poi semmai i denti»*.

---

## ❓ LA DOMANDA APERTA ADESSO

Nessuna: **la progettazione e' chiusa**, dalle statistiche all'estetica. Resta da decidere solo
**l'ordine di realizzazione**, perche' i pezzi hanno dipendenze fra loro.
