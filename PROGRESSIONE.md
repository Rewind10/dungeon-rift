# 🎚️ PROGRESSIONE.md — Livelli, ranghi e punti

> **REALIZZATO nella v1.69.** Il codice implementa questa specifica per intero, tranne le abilita'
> ATTIVE delle specializzazioni (i passivi ci sono), che arrivano con la barra delle abilita'.
> Scritto originariamente come progetto: Descrive per intero come cresce il personaggio: la scala dei
> livelli, i cinque ranghi di ogni classe, il costo in punti delle statistiche e tutte le carte di rango.
> Lo sviluppo di nuove versioni resta fermo finche' questo impianto non e' approvato.
>
> **Le cifre sono misurate sulla v1.68, non stimate.** La tabella dell'XP viene da sei partite simulate
> fino all'ondata 19 con un giocatore tenuto in vita apposta: cosi' si misura quanto *rende l'ondata*,
> non quanto sopravvive il bot. Ogni volta che qui compare un numero, e' uscito da una misura.

---

## 0. In breve

| | Regola |
|---|---|
| **Cap** | Livello **20** — uno per ondata, perche' la run finisce all'ondata 20 |
| **XP per il cap** | **10.670**, contro gli ~11.000 che rende una run intera |
| **Ranghi** | **5**, uno ogni 5 livelli, cioe' **su ogni boss** |
| **Punti** | 1 per livello + 1 per rango = **23 in una run** |
| **Statistica al tetto** | **22 punti su 23** — o ti specializzi, o ti distribuisci |
| **Carte di rango** | 1 su 3 a scelta ai ranghi II, III, IV · al rango V si sceglie la **specializzazione** |
| **Fra una run e l'altra** | il livello riparte da 1; resta sbloccato solo il ramo del rango V raggiunto |

---

## 1. Perche' il livello vive dentro la run

Un roguelike ha due modi di far crescere un personaggio, incompatibili fra loro: **dentro la partita**
(parti Guerriero all'ondata 1 e arrivi Maestro d'Armi alla 18ª, poi si ricomincia) oppure **fra le partite**
(il personaggio si porta dietro il livello).

Qui vale la prima, e non e' un ripiego: il gioco e' gia' costruito cosi'. Le ondate scalano sull'**ondata
corrente** (`Waves.scaling`), non sulla forza del giocatore, quindi un personaggio che arrivasse
all'ondata 1 gia' di livello 12 non troverebbe avversari — andrebbe ribilanciato tutto da capo. E in co-op
un veterano e un novellino nella stessa stanza sono un problema di progetto che non abbiamo motivo di
aprire adesso.

**Cio' che resta fra una run e l'altra e' cio' che hai sbloccato, non cio' che eri.** La prima volta che
arrivi a Paladino, quel ramo diventa scegliibile anche nelle run successive; ma il livello riparte sempre
da 1. Serve un `localStorage` sul client, nessun salvataggio sul server.

---

## 2. La scala dei livelli

Il cap e' **20** perche' la run finisce all'ondata 20 (`Waves.FINAL_WAVE`): **un livello per ondata**, e la
crescita del personaggio e quella del dungeon diventano la stessa curva. Non ci si ferma mai a "livellare":
si sale perche' si avanza.

Curva: **`XP cumulata(L) = 107 · L^1,54`**, arrotondata a numeri leggibili.

| Liv. | XP per salire | XP totale | Ondata in cui ci arrivi | Punti | Rango |
|---:|---:|---:|---:|---:|---|
| 1 | — | 0 | 1 | 0 | **I** |
| 2 | 200 | 200 | 2 | 1 | |
| 3 | 270 | 470 | 3 | 2 | |
| 4 | 320 | 790 | 5 | 3 | |
| 5 | 370 | 1.160 | 5 · 🐲 | 4 **+1** | **II** |
| 6 | 410 | 1.570 | 6 | 6 | |
| 7 | 450 | 2.020 | 7 | 7 | |
| 8 | 490 | 2.510 | 9 | 8 | |
| 9 | 520 | 3.030 | 10 | 9 | |
| 10 | 560 | 3.590 | 11 · 🐲 | 10 **+1** | **III** |
| 11 | 590 | 4.180 | 12 | 12 | |
| 12 | 620 | 4.800 | 13 | 13 | |
| 13 | 640 | 5.440 | 14 | 14 | |
| 14 | 670 | 6.110 | 15 | 15 | |
| 15 | 700 | 6.810 | 15 · 🐲 | 16 **+1** | **IV** |
| 16 | 720 | 7.530 | 17 | 18 | |
| 17 | 750 | 8.280 | 18 | 19 | |
| 18 | 770 | 9.050 | 19 | 20 | |
| 19 | 800 | 9.850 | 19 | 21 | |
| 20 | 820 | **10.670** | 20 · 🐲 | 22 **+1** | **V** |

🐲 = ondata di boss. **Totale: 23 punti.**

Una run intera rende **~11.000 XP** misurate, e fino a ~18.000 con combo alte e boon di raccolta. Quindi:
chi arriva in fondo arriva al cap; chi gioca *bene* ci arriva due o tre ondate prima e si gode il rango
massimo piu' a lungo. E' il modo giusto di dare finalmente un peso alla combo, che oggi conta poco.

**Oltre il livello 20** l'XP si converte in monete: **8 XP = 1 moneta**. Le uccisioni dell'ultima ondata
continuano a valere qualcosa, e la conversione finisce nell'unica cosa che a quel punto serve ancora
(l'equipaggiamento dal fabbro).

**Chi entra a partita iniziata** parte al livello che avrebbe raggiunto a quell'ondata, meno uno: entrare
all'ondata 12 significa cominciare al livello 10. Senza questa regola un nuovo arrivato sarebbe inutile,
e con una regola troppo generosa converrebbe entrare tardi.

---

## 3. I cinque ranghi

Un rango ogni 5 livelli, cioe' **su ogni boss**: la scala dei livelli e la struttura del gioco si
incastrano da sole, e il rango arriva sempre in un momento che il giocatore ricorda.

| Rango | Liv. | 🛡️ Guerriero | 🔮 Mago | 🏹 Ladro |
|---|---:|---|---|---|
| **I** | 1 | Guerriero | Apprendista | Ladro |
| **II** | 5 | Guerriero Esperto | Mago Giovane | Furfante |
| **III** | 10 | Veterano | Mago | Predone |
| **IV** | 15 | Campione | Mago Anziano | Ombra |
| **V** | 20 | **Paladino** *o* **Maestro d'Armi** | **Arcimago** *o* **Stregone** | **Assassino** *o* **Cacciatore di Teste** |

Ogni rango da' **tre cose**:

1. **+1 punto** (oltre a quello del livello);
2. **una carta a scelta fra tre** — potenziamenti di classe, non generici (§5);
3. **il nome nuovo** sotto la barra della vita, visibile anche ai compagni.

Il **rango V** e' diverso: al posto delle tre carte c'e' un **bivio fra due specializzazioni** (§6), che e'
anche l'unico rango che **si vede addosso al personaggio**. I primi quattro cambiano solo il nome: il
lavoro grafico va concentrato dove c'e' una scelta da riconoscere a colpo d'occhio.

---

## 4. Le statistiche e il costo in punti

Le quattro statistiche restano quelle della v1.66, con gli stessi effetti e lo stesso tetto (12). Cambia
**come si comprano**: non piu' con l'XP a costi crescenti, ma con i **punti** guadagnati salendo di livello.

| Statistica | Per livello | Al tetto (12) |
|---|---|---|
| 💪 **Forza** | +9% danno in mischia, +3% rinculo | +108% danno, +36% rinculo |
| ❤️ **Costituzione** | +20 PV massimi, −1,2% danni subiti | +240 PV, −14,4% danni subiti |
| 🔮 **Intelligenza** | +9% danno magico, +7% cadenza delle magie | +108% danno, +84% cadenza |
| 🏹 **Destrezza** | +8% danno dei dardi, +6% cadenza, +2,5% velocita' | +96% danno, +72% cadenza, +30% velocita' |

Ogni statistica agisce sulla **scuola dell'arma** (`weapon.school`), quindi chiunque puo' comprarle tutte:
cio' che si compra fuori scuola e' l'investimento sulle classi miste.

### Costo in punti

| Livello della statistica | Costo | Punti spesi in totale |
|---:|---:|---:|
| 1 · 2 · 3 · 4 | 1 punto l'uno | 4 |
| 5 · 6 · 7 · 8 · 9 · 10 | 2 punti l'uno | 16 |
| 11 · 12 | 3 punti l'uno | **22** |

**Portare UNA statistica al tetto costa 22 punti sui 23 di una run intera.** E' la regola della v1.66
("con l'XP di una run si cappa una sola statistica") tradotta da valuta a punti — e questa volta e'
leggibile a colpo d'occhio, invece di stare nascosta dentro una tabella di costi a sei cifre.

### Tre modi di spendere 23 punti

| Build | Come | Cosa ottieni |
|---|---|---|
| **Specialista** | una statistica a **12** — 22 punti | il massimo assoluto in una cosa sola, e un punto avanzato |
| **Due gambe** | una a **8** e una a **7** — 12 + 10 | forte in due scuole: e' la build delle classi miste |
| **Completo** | tre a **5** e una a **4** — 6+6+6+4 | nessuna debolezza e nessun picco |

Nessuna delle tre e' sbagliata, ed e' questo il punto: se una fosse chiaramente migliore, non sarebbe una
scelta ma un tutorial.

### Cosa NON si compra con i punti

L'equipaggiamento resta a **monete** dal fabbro (v1.67) e i **boon** restano gratuiti a fine ondata. Tre
valute con tre scopi distinti, e nessuna che si converta nell'altra (tranne l'XP oltre il cap):

| Valuta | Da dove | Per cosa |
|---|---|---|
| **XP** | uccisioni | livelli → punti → statistiche |
| **Monete** | uccisioni | equipaggiamento dal fabbro |
| **Scelte gratuite** | fine ondata / rango | boon generici / carte di classe |

---

## 5. Le carte di rango

Ai ranghi **II, III e IV** si sceglie **1 carta su 3**. Sono potenziamenti **di classe**, non generici: e'
la differenza con i boon, che restano quelli di sempre e valgono per chiunque.

Le carte sono **cumulative**: a fine run ne hai tre addosso, piu' la specializzazione. Le combinazioni per
classe sono 3 × 3 × 3 × 2 = **54**, abbastanza perche' due run non si somiglino.

### 🛡️ GUERRIERO

**Rango II — Guerriero Esperto** *(liv. 5)*

| Carta | Effetto |
|---|---|
| **Parata** | Per 0,6s dopo ogni fendente, i danni che arrivano da davanti sono ridotti del 35% |
| **Sfondamento** | Il fendente colpisce 2 bersagli in piu' (da 5 a 7) e il calo sui secondari passa dal 55% al 70% |
| **Sangue Freddo** | Sotto il 40% dei PV, +25% danno in mischia |

**Rango III — Veterano** *(liv. 10)*

| Carta | Effetto |
|---|---|
| **Colpo Rotante** | Ogni 4° fendente e' a 360° invece che nel solo arco frontale |
| **Sprone** | Lo scatto travolge: chi attraversi subisce il 60% del danno dell'arma e viene respinto |
| **Seconda Pelle** | Rigenera 1,5 PV al secondo, sempre |

**Rango IV — Campione** *(liv. 15)*

| Carta | Effetto |
|---|---|
| **Esecuzione** | I nemici sotto il 15% dei PV muoiono al primo colpo (mai i boss) |
| **Muro** | Mentre stai fermo, −30% danni subiti |
| **Furia Crescente** | Ogni nemico colpito nello stesso fendente da' +8% danno al fendente successivo (max +40%) |

### 🔮 MAGO

**Rango II — Mago Giovane** *(liv. 5)*

| Carta | Effetto |
|---|---|
| **Bolla Densa** | +35% raggio della bolla, e chi viene colpito rallenta del 30% per 1,5s |
| **Eco Arcana** | Il 20% dei lanci parte doppio, gratis |
| **Mente Lucida** | +12% cadenza e +8% velocita' delle bolle |

**Rango III — Mago** *(liv. 10)*

| Carta | Effetto |
|---|---|
| **Frattura** | Le bolle perforano 1 nemico in piu' |
| **Scudo di Mana** | Assorbe 60 danni; si ricarica dopo 8s senza subire colpi |
| **Runa Vagante** | Una runa ti orbita attorno e spara una bolla ogni 3s (50% del tuo danno) |

**Rango IV — Mago Anziano** *(liv. 15)*

| Carta | Effetto |
|---|---|
| **Detonazione** | Le bolle esplodono all'impatto: 40% del danno in un raggio di 70px |
| **Passo del Vuoto** | Lo scatto diventa teletrasporto e attraversa i muri |
| **Convergenza** | Se non lanci per 1,5s, la bolla successiva fa danno **triplo** |

### 🏹 LADRO

**Rango II — Furfante** *(liv. 5)*

| Carta | Effetto |
|---|---|
| **Doppia Cocca** | Ogni 3° tiro parte con una seconda freccia a fianco |
| **Passo Felpato** | +12% velocita' e +20% durata dello scatto |
| **Punta Avvelenata** | Le frecce avvelenano: danno nel tempo cumulativo |

**Rango III — Predone** *(liv. 10)*

| Carta | Effetto |
|---|---|
| **Tiro Rapido** | +25% cadenza per 3s dopo ogni uccisione |
| **Frecce Pesanti** | +30% danno, −15% cadenza |
| **Ombra** | Dopo lo scatto sei invisibile ai nemici per 1,5s |

**Rango IV — Ombra** *(liv. 15)*

| Carta | Effetto |
|---|---|
| **Colpo alle Spalle** | +80% danno contro i nemici che non ti stanno guardando |
| **Pioggia** | Ogni 5° tiro e' un ventaglio di 5 frecce |
| **Elusione** | 15% di probabilita' di schivare del tutto un colpo |

---

## 6. Il bivio del rango V

Al livello 20 non arrivano tre carte ma **due strade**, e non sono lo stesso personaggio piu' forte: sono
due modi diversi di stare in campo. La scelta vale per quella run, e **si vede addosso**.

### 🛡️ Guerriero

| | **PALADINO** | **MAESTRO D'ARMI** |
|---|---|---|
| **Idea** | Il muro che tiene in piedi la squadra | La lama che non si ferma mai |
| **Passivo** | Aura di 220px: cura il 2% dei PV al secondo ai compagni dentro; −18% danni subiti a te e a loro | +35% cadenza del fendente, +20% apertura dell'arco, rinculo ×1,5 |
| **Abilita'** | **Giuramento** — per 5s tu e i compagni nell'aura siete immuni al primo colpo che subite | **Turbine** — tre fendenti a 360° in 1,2s |
| **Si vede** | Mantello bianco-oro, aura tonda a terra | Elmo crestato, scia dorata sull'arco del fendente |
| **In solitaria** | Piu' debole (l'aura cura solo te) | Piu' forte |
| **In squadra** | Cambia la partita | Forte ma egoista |

### 🔮 Mago

| | **ARCIMAGO** | **STREGONE** |
|---|---|---|
| **Idea** | Cancella i gruppi | Cancella il bersaglio |
| **Passivo** | Ogni bolla esplode: 60% del danno in un raggio di 90px | La bolla diventa un dardo che rimbalza su 3 nemici a danno pieno |
| **Abilita'** | **Meteora** — tre esplosioni a caduta sul punto mirato | **Catena Nera** — fulmine che rimbalza fra 8 nemici |
| **Si vede** | Mantello che si allunga, rune dorate che orbitano | Mantello nero-viola, orbe spenta con nucleo rosso |
| **Contro le orde** | Devastante | Discreto |
| **Contro i boss** | Discreto | Devastante |

### 🏹 Ladro

| | **ASSASSINO** | **CACCIATORE DI TESTE** |
|---|---|---|
| **Idea** | Un colpo, un morto | Riempire lo schermo di frecce |
| **Passivo** | Critico al 35%, danno critico ×3, i colpi alle spalle sono **sempre** critici | Ogni tiro e' un ventaglio di 3 frecce che perforano 3 nemici |
| **Abilita'** | **Marchio** — segna un nemico: prende +50% danni da chiunque | **Salva** — 15 frecce in 2s |
| **Si vede** | Cappuccio nero, lama alla cintura, scia scura | Faretra doppia, arco enorme, frecce accese |
| **Chiede** | Posizionamento | Nulla, solo mirare |

**Regola di equilibrio:** ogni coppia ha un ramo **piu' facile** e uno **piu' esigente**, non uno piu'
forte. Maestro d'Armi, Arcimago e Cacciatore rendono subito; Paladino, Stregone e Assassino rendono di piu'
ma chiedono qualcosa (una squadra, un bersaglio grosso, il posizionamento). Se dalle misure uscisse che un
ramo e' semplicemente migliore, va corretto quello — non il suo gemello.

---

## 7. Come si incastra con cio' che esiste gia'

### I boon (la questione aperta della scorsa versione — proposta)

Oggi a fine ondata succedono **due cose insieme**: scegli 1 potere su 3 *e* spendi l'XP nel negozio. Con le
carte di rango diventerebbero tre scelte nello stesso istante, che e' una di troppo.

**Proposta: alle ondate di boss la carta di rango PRENDE IL POSTO del boon.** Alle ondate normali si
sceglie un boon come sempre; alle ondate 5, 10, 15 e 20 si sceglie la carta di rango. Il momento resta uno
solo, la scelta resta una sola, e il boss diventa ancora piu' un traguardo. Costa quasi niente da
costruire: il pannello e' lo stesso, cambia il mazzo da cui pesca.

### Il negozio di fine ondata

Il pannello XP diventa il **pannello dei punti**: stesse quattro carte, al posto del prezzo in XP c'e' il
prezzo in punti, e in alto "hai **3 punti**" invece di "hai **4.435 XP**". Se non hai punti da spendere, la
sezione non compare e il pannello mostra solo il boon.

### L'HUD in partita

Accanto alla barra della vita: **barra dell'XP sottile**, il numero del livello e il nome del rango. Il
rango compare anche sotto i compagni, cosi' si sa con chi si sta giocando.

### L'equipaggiamento

Non cambia niente. Il fabbro resta a monete, gli oggetti restano quelli della v1.67. Livelli e
equipaggiamento sono due assi indipendenti: il livello dice *chi sei*, l'equipaggiamento *cosa impugni*.

---

## 8. Piano di lavoro

| # | File | Cosa |
|---|---|---|
| 1 | `shared/levels.js` *(nuovo)* | Tabella XP→livello, ranghi per classe, costo in punti, mazzi delle carte, bivi del rango V. Come `gear.js`: **il posto unico** da cui negozio, HUD e test pescano |
| 2 | `shared/loot.js` | Via `STAT_COST_STEPS` e `statCost`: l'XP non si spende piu'. `XP_STATS` resta identico |
| 3 | `server/Room.js` | `addXp` fa salire di livello · `p.level`, `p.points`, `p.rank`, `p.spec`, `p.cards` · `buyStat` spende punti · +1 punto a ogni rango · XP oltre il cap → monete · chi entra tardi parte al livello dell'ondata −1 |
| 4 | `server/Room.js` | `offerRankCard(p)` quando si sale di rango, `pickRankCard(pid, id)` · alle ondate di boss sostituisce `offerBoon` |
| 5 | `public/js/hud.js` | Pannello dei punti · carte di rango (riusa il pannello dei boon) · barra XP + livello + rango |
| 6 | `public/js/renderer.js` | Nome del rango sotto il personaggio · aspetto del rango V (sei varianti) |
| 7 | `test/simulate.js` | Curva dei livelli, punti guadagnati, costo delle statistiche, carte non ripetute, cap dei punti |
| 8 | `test/client.js` | Il pannello dei punti e quello delle carte di rango disegnano cio' che devono |

### Due trappole gia' viste su questo progetto

1. **L'XP oggi e' una valuta di negozio.** Diventando una barra di livello, tutto cio' che la tratta come
   "soldi" va ripensato, non adattato. In particolare il boon che moltiplica l'XP raccolta ora accelera i
   **livelli**: e' molto piu' forte di prima e va rimisurato prima di lasciarlo com'e'.
2. **I bonus dei punti sono additivi e permanenti nella run**, quindi valgono le regole del `gearBonus`
   della v1.67: tenerli in un blocco **ricalcolabile da zero**, non sommarli dentro `p.stats` alla cieca.
   Le carte di rango sono cumulative e non si tolgono mai, quindi li' l'additivo va bene — ma vanno
   applicate **una volta sola**, con un elenco di quelle gia' prese.

---

## 9. Numeri da rimisurare quando il codice c'e'

Questa e' la lista di controllo per la v1.69, da confrontare con la v1.68:

| Misura | Valore atteso | Perche' |
|---|---|---|
| Livello medio raggiunto in una run | ≈ ondata raggiunta | E' l'ipotesi su cui e' costruita tutta la curva |
| XP a fine run | ~11.000 senza combo | Se cambia, la curva dei livelli va ritarata |
| Ondata media raggiunta | non peggiore della v1.68 | 23 punti non devono rendere il gioco piu' facile o piu' difficile per sbaglio |
| Potenza a fine run | vicina a quella della v1.68 | Oggi l'XP compra ~11 livelli di statistica; 23 punti ne comprano 10-12: deve restare cosi' |
| Uso dei rami del rango V | nessuno sotto il 30% | Se un ramo non lo prende nessuno, non e' una scelta |
