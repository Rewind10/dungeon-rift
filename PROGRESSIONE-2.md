# 🎚️ PROGRESSIONE-2.md — Il nuovo impianto (cap 15, abilità passive a scaglioni, menu di fine ondata)

> **STATO: IMPLEMENTATA nella v1.79.0, RITARATA nella v1.79.1.** ⚠️ La curva XP del §3 e il numero di
> nemici sono cambiati: la prima taratura veniva da una simulazione a uccisioni istantanee (combo
> incollata al massimo) e chiedeva piu esperienza di quanta ne esista nella partita. I numeri buoni sono
> nel CHANGELOG alla voce 1.79.1 — livello 15 a 9.470 XP, nemici `10 + 1,6·ondata`. Il resto
> dell impianto (scaglioni, tetto, punti, menu) e come scritto qui. Quello che segue e la specifica da cui e nata; il gioco oggi
> la rispetta, e le differenze introdotte scrivendo il codice sono annotate dove ci sono. Le misure di
> verifica (in che ondata arriva ogni livello, con gruppi da 1 a 6) stanno nel CHANGELOG alla voce 1.79.0.
>
> Nasce dalle partite di prova sulla v1.78:
> il sistema precedente (una carta a ogni fine ondata, livelli senza tetto, cinque carte accese da
> gestire con la Cartomante) aveva due falle — il potere arrivava col calendario invece che col merito,
> e dopo il livello 15 si continuava a salire a vuoto.
>
> Sostituisce PROGRESSIONE.md dove i due documenti si contraddicono. Le decisioni qui dentro sono di
> Paolo; i numeri vengono da misure fatte sul gioco vero, non da stime, e ogni volta che compare una
> cifra e' scritto da dove esce.
>
> Versione di destinazione: **1.79.0**.

---

## 1. Le decisioni, in breve

| # | Decisione |
|---|---|
| 1 | **Tetto ai livelli: 15.** Oltre non si sale. |
| 2 | Le carte diventano **abilita' passive**, divise in **4 scaglioni**: *non comune, raro, epico, divino*. Se ne sceglie **una per scaglione**, ai livelli **3, 6, 9, 12**. |
| 3 | Le passive sono **singole**: niente impilamento, ogni abilita' si prende una volta sola. |
| 4 | Ogni scaglione mostra **4 abilita' — 2 della tua classe e 2 neutre — e se ne sceglie 1**. Le abilita' di classe le vede **solo quella classe**: un mago non vede mai quelle del guerriero. |
| 5 | Al **livello 15** si sceglie la **specializzazione finale**, fra **due** per classe. E' **passiva**. |
| 6 | **Ranghi a 3 / 6 / 9 / 12 / 15**: coincidono con i momenti di scelta. |
| 7 | **XP condivisa** fra i giocatori vivi, con un fattore di gruppo (§4). Curva rifatta: il livello 15 non deve arrivare prima dell'ondata 16 in singolo. |
| 8 | Dopo il tetto **l'XP non serve piu' a niente**, come nei giochi di ruolo. Per ora nessuna conversione. |
| 9 | **Punti statistica**: costi abbassati. Con l'intero bilancio si puo' **cappare una sola statistica** e portarne **una seconda al massimo a 6**. |
| 10 | **Cartomante chiusa**: la struttura resta nel villaggio, la funzione e' disattivata (verra' ridisegnata). Con lei sparisce il tetto delle 5 carte accese. |
| 11 | Ritirate tre carte: **Avidita', Fortuna Sfacciata, Fame Vorace** (bonus XP, inutili col tetto). |
| 12 | ~~Le **due abilita' attive** per classe (livelli 6 e 12) restano progettate ma non implementate.~~ → **fatte in v1.85**: quattro per classe, due per slot, ricariche 30s e 45s. Le passive scendono a due (livelli 3 e 9). |
| 13 | Il **menu di fine ondata** viene rifatto: schermata di riepilogo con barra di sezioni (§10). |

---

## 2. Cosa comporta il tetto (conseguenze meccaniche, non opinioni)

- **L'impilamento muore.** Le carte di oggi hanno `max ×2 / ×3` perche' se ne prendono ~10 a run. Con 4
  scelte, spendere uno scaglione per raddoppiare la stessa abilita' e' sempre la mossa sbagliata.
- **Il budget di potenza per scelta raddoppia.** Le carte attuali sono tarate come piccoli incrementi da
  sommare (+8% critico, da prendere tre volte). Con 4 scelte totali i valori vanno **circa raddoppiati**
  rispetto al singolo stack, se no il personaggio al livello 12 e' piu' debole di quello di oggi
  all'ondata 6. **I numeri esatti delle 32 passive sono da definire prima di scrivere il codice.**
- **Il tetto delle 5 carte accese decade da solo**: con 4 passive sempre attive non c'e' niente da
  accendere o spegnere. E' il motivo per cui la Cartomante si chiude senza perdere nulla.
- **Il personaggio finisce la run piu' forte di oggi** (piu' punti statistica utili + passive raddoppiate).
  La curva di difficolta' delle ultime ondate andra' rimisurata dopo l'implementazione — non prima.

---

## 3. La curva dell'esperienza

### Misura di partenza (v1.78, giocatore invincibile che uccide tutto e raccoglie tutto — il tetto teorico)

| fine ondata | 4 | 8 | 11 | 12 | 14 | 16 | 17 | 19 |
|---|---|---|---|---|---|---|---|---|
| XP cumulata, in singolo | 1.343 | 3.875 | 6.785 | 7.966 | 11.638 | 13.730 | 15.421 | 21.925 |
| livello con la curva della v1.78 | 5 | 10 | 14 | 16 | 21 | 23 | 25 | 31 |

Con la curva vecchia il livello 15 arrivava all'**ondata 11-12**: da li' in poi si saliva a vuoto.

### La curva nuova

| Livello | XP per salire | XP cumulata | Cosa sblocca | Ondata attesa (singolo) |
|---|---|---|---|---|
| 2 | 400 | 400 | 1 punto | 2 |
| **3** | 700 | **1.100** | **1ª passiva — NON COMUNE** · rango I | 3-4 |
| 4 | 730 | 1.830 | 1 punto | 5 |
| 5 | 770 | 2.600 | 1 punto | 6 |
| **6** | 800 | **3.400** | **2ª passiva — RARO** · rango II · *(slot attiva 1, bloccato)* | 8 |
| 7 | 900 | 4.300 | 1 punto | 9 |
| 8 | 950 | 5.250 | 1 punto | 10 |
| **9** | 1.050 | **6.300** | **3ª passiva — EPICO** · rango III | 11 |
| 10 | 1.100 | 7.400 | 1 punto | 12 |
| 11 | 1.150 | 8.550 | 1 punto | 13 |
| **12** | 1.200 | **9.750** | **4ª passiva — DIVINO** · rango IV · *(slot attiva 2, bloccato)* | 13-14 |
| 13 | 1.300 | 11.050 | 1 punto | 15 |
| 14 | 1.450 | 12.500 | 1 punto | 16 |
| **15** | 1.600 | **14.100** | **SPECIALIZZAZIONE** · rango V | 16-17 |

- E' circa **il doppio** della curva attuale (cum. 15: 14.100 contro 6.810).
- Gli ultimi due scalini sono i piu' cari della curva: il 15 non e' raggiungibile prima dell'ondata 16
  nemmeno giocando alla perfezione (all'ondata 16 il tetto teorico e' 13.730 < 14.100).
- Un giocatore normale, che raccoglie l'80-90% di quello che cade, ci arriva fra la **17** e la **18**.
- **Da rimisurare dopo l'implementazione dell'XP condivisa**: se il livello 15 sfora oltre l'ondata 18 si
  abbassano gli ultimi due scalini, non tutta la curva.

---

## 4. XP condivisa — la regola e il perche' del fattore

Oggi l'XP la prende **chi passa sopra la sfera**: in gruppo si fa la corsa al bottino e la progressione
dipende da chi corre di piu'. Da qui in avanti **ogni uccisione da' esperienza a tutti i giocatori vivi**.

Il tranello sta nei numeri: le ondate scalano col numero di giocatori, ma **meno che proporzionalmente**.
Misurato sul gioco: all'ondata 19 un trio genera **27.767** XP totali contro i **21.925** di un solista,
cioe' solo **+27%** con il triplo dei giocatori. Quindi:

- se ognuno prendesse l'intero valore di ogni uccisione, in trio si arriverebbe al 15 con **2-3 ondate
  d'anticipo**;
- se lo prendessero diviso per il numero di giocatori, non ci arriverebbero **mai**.

**Regola:** ogni giocatore vivo riceve lo stesso ammontare, moltiplicato per un **fattore di gruppo**
`k(n)` tarato perche' la curva del §3 valga identica da 1 a 6 giocatori.

### I fattori, misurati

Due partite simulate per ogni taglia di gruppo, XP **totale generata** dalle ondate (non da chi la
raccoglie), confrontata con quella di un solista:

| Giocatori | XP totale all'ondata 12 | XP totale all'ondata 16 | **k(n)** |
|---|---|---|---|
| 1 | 7.695 | 12.928 | **1,00** |
| 2 | 9.741 | 16.079 | **0,80** |
| 3 | 10.809 | 19.066 | **0,69** |
| 4 | 13.035 | 22.422 | **0,58** |
| 5 | 14.441 | 25.428 | **0,52** |
| 6 | 15.392 | 25.312 | **0,50** |

Con questi fattori un giocatore, in qualsiasi gruppo, arriva al livello 15 nella stessa ondata di un
solista: la curva del §3 si tara **una volta sola**.

La formula `k(n) = 1 / (1 + 0,25·(n−1))` riproduce la misura entro il rumore per n da 1 a 5 (1 · 0,80 ·
0,67 · 0,57 · 0,50) ma e' troppo avara a 6 (0,44 contro 0,50 misurato): a sei giocatori il tetto dei
mostri vivi contemporanei taglia la crescita dell'ondata, e la formula non lo sa. **Si usa la tabella**,
non la formula.

Le **monete** restano come sono: si raccolgono da terra e chi arriva primo le prende. La cooperazione
riguarda la crescita, non il portafoglio.

---

## 5. Ranghi e titoli

Ranghi a **3 / 6 / 9 / 12 / 15** (prima erano 1/5/10/15/20). Ogni rango da' **1 punto** — tranne il
quinto, che da' la specializzazione. Ai livelli 1 e 2 si porta il titolo base.

| Rango | Livello | Guerriero | Mago | Ladro |
|---|---|---|---|---|
| — | 1-2 | Guerriero | Apprendista | Ladro |
| I | 3-5 | Guerriero Esperto | Mago Giovane | Furfante |
| II | 6-8 | Veterano | Mago | Predone |
| III | 9-11 | Campione | Mago Anziano | Ombra |
| IV | 12-14 | **Signore delle Lame** | **Magister** | **Spettro** |
| V | 15 | *(nome della specializzazione)* | *(idem)* | *(idem)* |

---

## 6. I quattro scaglioni

| Scaglione | Livello | Cosa deve fare |
|---|---|---|
| **Non comune** | 3 | Da' forma al colpo base. Piccola, ma si sente subito. |
| **Raro** | 6 | Aggiunge una **regola** a come combatti, non solo una percentuale. |
| **Epico** | 9 | Definisce la build, e puo' avere un prezzo o una condizione. |
| **Divino** | 12 | **Riscrive una regola** del gioco, e punta verso la specializzazione del 15. |

Ogni scaglione mostra **4 abilita': 2 della tua classe + 2 neutre**. Se ne sceglie **1**. Le abilita' di
classe sono visibili solo a quella classe — un mago non sa nemmeno che esistono quelle del guerriero, e
questo e' voluto: e' la rigiocabilita' a cambiare personaggio.

---

## 7. La griglia delle 32 abilita' passive, coi numeri

Le 33 carte di oggi ci entrano tutte tranne le tre ritirate (§8); una sola e' nuova.

**Come sono stati scelti i numeri.** Ogni passiva si prende **una volta sola** e le scelte in una run sono
**quattro**: il valore non e' quello di oggi, ne' quello di oggi moltiplicato per il numero massimo di
copie. La regola usata e' *circa il doppio della singola copia di oggi*, alzata dove l'abilita' e' di
scaglione alto e abbassata dove il massimo di oggi era gia' sbilanciato. La colonna **oggi** dice da dove
si parte, cosi' si vede sempre quanto e' cambiata.

> ⚠️ **Due correzioni di equita' fra classi**, non solo di grandezza:
> 1. **I PV in cifra fissa diventano percentuali.** Il guerriero ha 200 PV, il mago 100, il ladro 112:
>    "+30 PV" vale il triplo per il mago rispetto al guerriero. Ogni bonus PV neutro passa a percentuale.
> 2. **Le passive "a colpo" valgono il doppio per il ladro** (3 colpi al secondo) rispetto al mago (1,5).
>    Tossina e' neutra, quindi il veleno va misurato **al secondo per bersaglio**, non a colpo, se no la
>    stessa carta rende il doppio in mano al ladro.

### Neutre — le vedono tutte e tre le classi

| Scaglione | Abilita' | Valore proposto | Oggi (singola · max) |
|---|---|---|---|
| Non comune | 🎯 **Occhio di Falco** | **+15% critico, +0,5× danno critico** | +8% · +0,4× (×3) |
| Non comune | 🏃 **Passo Rapido** | **+15% velocita', −12% ricarica scatto** | +8% · −6% (×3) |
| Raro | ☠️ **Tossina** | **veleno di forza 2**, misurato al secondo per bersaglio (non a colpo) | forza 1 (×3) |
| Raro | 💠 **Scudo Vitale** | **+25% PV massimi** (non curano) e **+3 PV/s** | +30 PV · +2/s (×2) |
| Epico | 🪓 **Giustiziere** | **+70% danno critico, +10% critico** | +35% · +5% (×2) |
| Epico | 🧱 **Baluardo** | **−22% a tutti i danni subiti** | −12% (×3) |
| Divino | ⏳ **Ultima Occasione** | **2 cariche**: risorgi al 50% dei PV con **2s di invulnerabilita'** | 1 carica, 50% (×2) |
| Divino | 🗡️ **Colpo di Grazia** | esecuzione sotto il **20%** dei PV (boss esclusi) | 12% (×2) |

### ⚔️ Guerriero — sta in mezzo alla mischia, la ricompensa e' la folla

| Scaglione | Abilita' | Valore proposto | Oggi (singola · max) |
|---|---|---|---|
| Non comune | 🗡 **Arma Pesante** | **+25% apertura dell'arco, +18% danno** | +2 raggio · +15% (×2) |
| Non comune | 🌵 **Aura di Spine** | riflette **25 danni + 10% del danno subito** | 12 danni (×3) |
| Raro | 🩸 **Vampirismo** | **+9%** del danno inflitto ti cura | +4% (×3) |
| Raro | 💢 **Rappresaglia** | onda di **forza 2**: piu' ampia e piu' danno | forza 1 (×3) |
| Epico | 🔥 **Adrenalina Pura** | **+8% cadenza per uccisione, fino a +40%**, dura 3s | esiste, valori interni da fissare (×1) |
| Epico | 🧍 **Colosso** | **+35% PV massimi** (non curano) e **+8% velocita'** | +45 PV · +6% (×2) |
| Divino | ☄️ **Deflagrazione Cadaverica** | **forza 3**: esplosione ampia, a danno pieno | forza 1 (×3) |
| Divino | 🌀 **Onda di Ritorno** | **50%** delle uccisioni emette una nova, piu' ampia | 25% (×2) |

### 🔮 Mago — pochi colpi, ognuno deve fare rumore

| Scaglione | Abilita' | Valore proposto | Oggi (singola · max) |
|---|---|---|---|
| Non comune | ⭕ **Bolla Densa** | **+35% dimensione, +18% danno** | +2 raggio · +15% (×2) |
| Non comune | ❄️ **Tocco Gelido** | rallenta del **40% per 1,5s** | rallentamento breve (×2) |
| Raro | ⛓️ **Catena di Fulmini** | rimbalza su **2 nemici** al **25% del danno del colpo** | 1 nemico, 6-14 danni fissi (×3) |
| Raro | ↩️ **Rimbalzo** | **+2 rimbalzi**, e il colpo **non perde danno** rimbalzando | +1 rimbalzo (×3) |
| Epico | 💣 **Colpi Esplosivi** | **ogni 3° colpo** esplode, raggio aumentato | ogni 5° (×2) |
| Epico | 🚩 **Doppia Bolla** | **+1 bolla per colpo, +15% danno** | +1 · +10% (×2) |
| Divino | 🔊 **Eco Arcana** | **40%** dei colpi sparato una seconda volta, gratis | 20% (×2) |
| Divino | 🌌 **Implosione** *(nuova)* | una bolla ogni **5** implode: risucchia i nemici entro **150px** e li tiene fermi **0,8s**, al 60% del danno | — |

### 🏹 Ladro — distanza, cadenza, e nessun margine d'errore

| Scaglione | Abilita' | Valore proposto | Oggi (singola · max) |
|---|---|---|---|
| Non comune | 🏹 **Perforazione** | **+2 nemici** perforati | +1 (×3) |
| Non comune | 🔭 **Tiro Lungo** | **+40%** danno a piena gittata | +22% (×3) |
| Raro | ⛏️ **Piede di Porco** | **+80%** danno sui nemici sopra il 90% dei PV | +40% (×3) |
| Raro | 💃 **Passo di Danza** | **+35% velocita' per 3s**, si accumula fino a 2 volte | +25% per 2s (×3) |
| Epico | 🔱 **Sdoppiamento** | **+1 freccia e +10% cadenza** | +1 proiettile (×2) |
| Epico | 🎯 **Mira Guidata** | curvatura **forte** (pari a due copie di oggi) | curvatura base (×2) |
| Divino | 😈 **Furia Cieca** | **+45% danno, +15% danni subiti** | +22% · +8% (×2) |
| Divino | 🧿 **Egida Ostinata** | assorbe un colpo **ogni 5s** | ogni 8s (×2) |

### Perche' Sdoppiamento non da' due frecce

Sarebbe il valore "×2" naturale, ma al livello 15 il **Cacciatore di Teste** trasforma ogni tiro in un
ventaglio di tre: due passive che fanno la stessa cosa, una dentro l'altra, e la specializzazione
smetterebbe di essere un evento. Il ladro prende **una** freccia in piu' e un po' di cadenza; il ventaglio
resta il momento del 15.

### Cosa va misurato dopo, non deciso adesso

Questi numeri sono una **proposta di partenza**: la verifica vera e' il **tempo per uccidere** di ogni
classe al livello 3, 6, 9, 12 e 15, misurato contro le ondate corrispondenti. Se una classe finisce fuori
scala si tocca il numero, non l'impianto.

---

## 8. Le tre ritirate

🪙 **Avidita'**, 🍀 **Fortuna Sfacciata**, 🧲 **Fame Vorace**: sono bonus all'XP raccolta, e col tetto ai
livelli diventano **spazzatura per costruzione** — a maggior ragione se offerte allo scaglione divino,
dove varrebbero zero. Escono dal gioco. Se un giorno serviranno, il posto giusto e' un bonus alle
**monete** gestito dal Banditore, fuori dagli scaglioni.

---

## 9. Le sinergie diventano scelte di build

Verificato sulla griglia: tutte e sei restano raggiungibili, ognuna cade dentro **una sola classe** e in
**due scaglioni diversi**. Non sono piu' un colpo di fortuna: chi le vuole le pianifica dal livello 3.

| Sinergia | Classe | Come si ottiene |
|---|---|---|
| 🌊 Onda d'Urto | Guerriero | Aura di Spine (3) + Rappresaglia (6) |
| 🩸 Sete di Sangue | Guerriero | Vampirismo (6) + Adrenalina Pura (9) |
| 🧊 Catena Gelida | Mago | Tocco Gelido (3) + Catena di Fulmini (6) |
| 🧪 Deflagrazione Tossica | Mago | Tossina (6, neutra) + Colpi Esplosivi (9) |
| 🔮 Cercatore | Ladro | Perforazione (3) + Mira Guidata (9) |
| 🎯 Cacciatore di Teste | Ladro | Piede di Porco (6) + Colpo di Grazia (12, neutra) |

Due per classe, ognuna a cavallo di due scaglioni: prenderne una costa **meta' delle scelte della run**.
E' il prezzo giusto.

---

## 10. Livello 15 — la specializzazione

Due per classe, **passive**. Le abilita' attive che le accompagnavano sono diventate, in **v1.85**, le
attive del **livello 12** — e la specializzazione, al posto di regalarne una, **le potenzia del 30%** (§11).

| Classe | | |
|---|---|---|
| Guerriero | ✨ **Paladino** — aura che cura i compagni e riduce i danni, a te e a loro | ⚔️ **Maestro d'Armi** — molta piu' cadenza e apertura del fendente, rinculo aumentato |
| Mago | 🔮 **Arcimago** — ogni bolla esplode ad area | 🕯️ **Stregone** — la bolla diventa un dardo che rimbalza su tre nemici a danno pieno |
| Ladro | 🔪 **Assassino** — critico e danno critico altissimi, i colpi alle spalle sempre critici | 🎯 **Cacciatore di Teste** — ogni tiro e' un ventaglio di tre frecce perforanti |

E' l'ultimo punto in cui due run della stessa classe possono divergere: per questo resta **doppia**.

---

## 11. Le due abilita' attive — ~~progettate, non implementate~~ FATTE IN v1.85

> ⚠️ **Questa sezione e' storica.** Le abilita' attive esistono dalla **v1.85** e non sono quelle previste
> qui sotto: sono **quattro per classe** (due per slot, si sceglie una al livello 6 e una al 12), le sei
> gia' promesse sono diventate le opzioni del **livello 12**, e le ricariche sono **30s** e **45s**.
> L'elenco vero sta in CARATTERISTICHE.md, sezione *LE ABILITA' ATTIVE*.

Gli slot sono **livello 6** e **livello 12**. Nella barra in basso restano **disegnati e spenti, col
lucchetto**: si deve vedere che arriveranno. Le sei gia' progettate restano assegnate agli slot in attesa
delle nuove che Paolo aggiungera'.

| Classe | Livello 6 | Livello 12 |
|---|---|---|
| Guerriero | ⚔️ **Turbine** — tre fendenti a 360° in 1,2s | ✨ **Giuramento** — per 5s tu e i compagni vicini siete immuni al primo colpo |
| Mago | 🕯️ **Catena Nera** — fulmine che rimbalza fra otto nemici | ☄️ **Meteora** — tre esplosioni a caduta sul punto mirato |
| Ladro | 🔪 **Marchio** — segna un nemico: prende +50% danni da chiunque | 🎯 **Salva** — quindici frecce in due secondi |

---

## 12. I punti statistica

Il bilancio esce dalla regola di Paolo: **una statistica cappata, una seconda al massimo a 6**.

- **18 punti in tutta la run**: 14 dai livelli (2→15) + 4 dai ranghi (3, 6, 9, 12). Il rango del 15 da'
  la specializzazione, non un punto.
- **Costo fisso: 1 punto per livello** — spariscono gli scaglioni 1/2/3 di oggi. Tetto per statistica: 12.
- Cappare una statistica = **12** · portarne una seconda a 6 = **6** · **totale 18, esatto**.
- Cappare **due** statistiche e' impossibile (24 punti). Chi preferisce spalmare arriva a **tre
  statistiche a 6**.
- Rispetto a oggi (23 punti, ma 22 per cappare una sola) e' **piu' generoso**: e' un potenziamento
  voluto, da tenere presente quando si rimisurera' la difficolta' delle ultime ondate.

---

## 13. La Cartomante si chiude

- La **struttura resta nel villaggio**, con la sua porta e il suo interno: sparisce solo la funzione.
- Con lei spariscono il tetto delle **5 carte accese** e il concetto di carta *spenta*: le 4 passive sono
  sempre tutte attive.
- Verra' ridisegnata piu' avanti.

---

## 14. Il menu di fine ondata

Oggi il pannello fra un'ondata e l'altra mette tutto in colonna nella stessa schermata — riepilogo,
carte, punti, negozio, destinazione — ed e' confuso. Si divide in **sezioni**.

### Struttura

- **Schermata di RIEPILOGO** — e' quella che si apre da sola quando finisce l'ondata: le statistiche
  della partita (nemici uccisi, XP, monete, durata contro il tempo obiettivo, livelli guadagnati, premio
  del cronometro).
- **Barra delle sezioni, in basso — quattro pulsanti**: `RIEPILOGO` · `PERSONAGGIO` · `ABILITA'` · `VAI AL VILLAGGIO`. Sono sempre tutte attive e ci si passa liberamente.
- **Sotto la barra, centrato e da solo**: il pulsante che fa partire la **mappa successiva**. E' l'unico modo di ripartire, e sta da solo apposta: non si confonde con le quattro sezioni sopra.

### Le sezioni

| Sezione | Contenuto |
|---|---|
| **Riepilogo** | Le statistiche dell'ondata appena chiusa. E' la schermata di default. |
| **Personaggio** | Le 4 statistiche da incrementare (forza, costituzione, intelligenza, destrezza) con i punti disponibili, e il **riepilogo visivo dell'inventario**: arma, equipaggiamento, cintura delle pozioni, vite, livello e rango. |
| **Abilita'** | Le **tue** passive prese, divise per scaglione, con gli scaglioni ancora da scegliere in evidenza. Solo le tue: nessuna abilita' di un'altra classe. Qui si fa la scelta quando e' dovuta. |
| **Villaggio** | Ci si entra **solo da qui**, mai durante l'ondata. E' sempre visitabile a ogni fine ondata. Resta una **mappa condivisa**: si entra tutti insieme, come oggi. **L'uscita dal villaggio riporta al Riepilogo**, non fa partire l'ondata. |

### Cosa cambia rispetto a oggi

1. Il villaggio **non e' piu' una destinazione** scelta premendo "pronto": e' una sezione del menu, e ci
   si torna indietro. Il portale EXIT del villaggio riporta al menu, non all'ondata successiva.
2. L'ondata successiva parte **solo** col pulsante PROSSIMA ONDATA.
3. La scelta dell'abilita' vive nella sezione Abilita'. **Finche' c'e' una scelta in sospeso, il pulsante
   PROSSIMA ONDATA resta spento** — cosi' non si perde uno scaglione per distrazione.
4. In cooperativa, PROSSIMA ONDATA e' il segnale di *pronto* di ogni giocatore, come lo e' oggi: si parte
   quando l'hanno premuto tutti (col solito tempo massimo anti-AFK in multiplayer).

---

## 15. Cosa resta da fare

1. **Le nuove abilita' attive** che Paolo aggiungera' (§11).
2. **Rimisurare la difficolta'** delle ultime ondate dopo l'implementazione: il personaggio finisce la run
   piu' forte di oggi (§2, §12).
3. Un'idea messa da parte, non approvata: una **quinta passiva jolly** comprabile a caro prezzo dal
   Mercante Errante, pescata dal catalogo di un'altra classe — l'unico posto dove rimettere del caso in un
   impianto che ora e' tutto pianificato.
