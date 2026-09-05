# 🎚️ PROGRESSIONE.md — Livelli, ranghi e punti *(impianto v1.69-1.78)*

> ⛔ **SUPERATO DA [PROGRESSIONE-2.md](PROGRESSIONE-2.md).** Dopo le partite di prova sulla v1.78 l impianto
> e stato rifatto: tetto ai livelli a 15, carte diventate abilita passive divise in quattro scaglioni
> (livelli 3/6/9/12), specializzazione al 15, ranghi a 3/6/9/12/15, XP condivisa e curva raddoppiata,
> Cartomante chiusa, menu di fine ondata a sezioni. **Dove i due documenti si contraddicono vale il
> secondo.** Questo resta come storia di come ci siamo arrivati e per i numeri misurati sulla v1.68.

> **AGGIORNAMENTO v1.78 — le carte si pagano coi LIVELLI.** Il boon generico non arriva piu a ogni
> fine ondata: ne arriva **uno per livello guadagnato**, e chi in un ondata sale di tre livelli sceglie
> tre carte una dopo l altra. Chi non e salito non sceglie niente, e il pannello scrive quanta XP manca.
> Misurato: la prima carta arriva a fine seconda ondata invece che della prima, ma all ottava un
> giocatore solo ne ha 10 invece di 8. La riga "Scelte gratuite" della tabella delle valute va letta
> cosi: **livello / rango**, non piu **fine ondata / rango**.
>
> **REALIZZATO nella v1.69, RIVISTO nella v1.70.** Quattro cose sono cambiate dopo la prova sul campo,
> e il documento le riporta: **niente piu' tetto ai livelli**, **esperienza da piu' fonti**, **carte di
> rango rimosse** (le sostituiranno le abilita' di classe) e **annuncio del LEVEL UP in partita**.
> ~~Restano da fare le abilita' attive delle specializzazioni.~~ **Fatte in v1.85**, ma agli slot Q/E dei livelli 6 e 12: vedi CARATTERISTICHE.md. Descrive per intero come cresce il personaggio: la scala dei
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
| **Cap** | **nessuno** *(v1.70)* — si sale finche' si accumula esperienza |
| **Esperienza** | da nemici, **casse aperte** e **potenziamenti raccolti** *(v1.70)* |
| **Ranghi** | **5**, uno ogni 5 livelli, cioe' **su ogni boss** |
| **Punti** | 1 per livello + 1 per rango = **23 in una run** |
| **Statistica al tetto** | **22 punti su 23** — o ti specializzi, o ti distribuisci |
| **Carte di rango** | **rimosse in v1.70** — al loro posto le abilita' di classe · al rango V resta la **specializzazione** |
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

**Nessun tetto** *(deciso nella v1.70)*. Il cap a 20 coincideva con la fine della partita: gli ultimi
livelli si prendevano sui titoli di coda invece di giocarli. Ora si sale finche' si accumula esperienza, e
la curva `107 · L^1,54` continua all'infinito — i costi si calcolano man mano che servono.

| Liv. | XP per salire | XP totale |
|---:|---:|---:|
| 2 | 200 | 200 |
| 5 | 370 | 1.160 |
| 10 | 560 | 3.590 |
| 15 | 700 | 6.810 |
| 20 | 820 | 10.670 |
| 25 | 930 | 15.240 |
| 30 | 1.020 | 20.040 |

La monotonia e' garantita nella generazione (`step[i] = max(arrotondato, step[i-1] + 10)`), non lasciata
all'arrotondamento: **nessun livello costa quanto il precedente**, verificato fino al 500°.

### Da dove arriva l'esperienza *(v1.70)*

Non solo dai nemici uccisi:

| Fonte | XP |
|---|---|
| Nemico ucciso | come prima, cresce con l'ondata |
| **Cassa aperta** | 45 + 9 per ondata |
| **Potenziamento raccolto** sulla mappa | 30 + 6 per ondata |

I valori stanno in `shared/constants.js`, in chiaro: aggiungere una fonte e' una riga. **Misurato**: una run
completa porta ora al **livello 30**, con Lv.10 all'ondata 9, Lv.20 alla 15, Lv.30 alla 19.

### L'annuncio in partita *(v1.70)*

Salire di livello non aspetta il pannello di fine ondata: la scritta **LEVEL UP** compare sopra la testa
con il numero del livello, resta agganciata al personaggio mentre si muove e combatte, e svanisce in 1,6s.
La vedono anche i compagni; a chi sale parte un **jingle** dedicato.

## 3. I cinque ranghi

Un rango ogni 5 livelli. Con l'esperienza che arriva da piu' fonti (v1.70) i ranghi non cadono piu'
esattamente sui boss come nella prima stesura: arrivano quando li hai guadagnati.

| Rango | Liv. | 🛡️ Guerriero | 🔮 Mago | 🏹 Ladro |
|---|---:|---|---|---|
| **I** | 1 | Guerriero | Apprendista | Ladro |
| **II** | 5 | Guerriero Esperto | Mago Giovane | Furfante |
| **III** | 10 | Veterano | Mago | Predone |
| **IV** | 15 | Campione | Mago Anziano | Ombra |
| **V** | 20 | **Paladino** *o* **Maestro d'Armi** | **Arcimago** *o* **Stregone** | **Assassino** *o* **Cacciatore di Teste** |

Ogni rango da' **due cose**:

1. **+1 punto** (oltre a quello del livello);
2. **il nome nuovo** sotto la barra della vita, visibile anche ai compagni.

Le carte di rango della v1.69 sono state **rimosse** (§5): al loro posto arriveranno le **abilita' di
classe**, sbloccate a livelli specifici. Il **rango V** resta diverso: e' un **bivio fra due
specializzazioni** (§6), ed e' l'unico rango che **si vede addosso al personaggio**. I primi quattro cambiano solo il nome: il
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
| **Scelte gratuite** | livello *(v1.78)* / rango | boon generici / carte di classe |

---

## 5. Le carte di rango — RIMOSSE in v1.70

Le 27 carte generiche (Parata, Sfondamento, Bolla Densa, Colpo alle Spalle…) sono state tolte. Al loro
posto arriveranno le **abilita' di classe**, sbloccate a **livelli specifici** come in un gioco di ruolo:
le magie del mago, i colpi del guerriero, i tiri del ladro.

Il **rango resta** il momento in cui il personaggio evolve — da' il titolo nuovo e un punto in piu' — e nel
codice il contenitore e' gia' pronto: `Levels.cardsFor()` risponde vuoto, quindi il server salta l'offerta
senza rami condizionali. Quando le abilita' saranno definite, basta riempire quella tabella.

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
