# 🪜 PIANO — LA PROGRESSIONE DEL PERSONAGGIO

**Scritto il 19 settembre 2026, a partire dalla versione 2.15.3.**
Come il piano dell'equipaggiamento, questo file esiste per **poter riprendere da zero**: chi lo legge —
io fra una settimana, in una conversazione nuova che non ricorda niente — deve poter continuare senza
chiedere niente a Paolo. Se una decisione non è scritta qui, non è stata presa.

---

## 📌 DA DOVE NASCE

Parole di Paolo: *«non mi convince il metodo di livellamento dei personaggi»*, e poi, messo a fuoco:
*«ci sono abilità passive e solo 2 attive»*.

Misurato, per capire se era una sensazione o un fatto. Le abilità attive si sbloccano ai livelli **8** e
**14**. Incrociando la curva dell'esperienza con quella che le ondate mettono davvero a terra (stessa
formula del TEST 53, quello che tiene in riga il rapporto XP/livelli):

| Livello | Arriva all'ondata |
|---|---|
| 8 → **prima** abilità attiva | **12** di 20 |
| 14 → **seconda** abilità attiva | **18** di 20 |

Cioè: per **undici ondate su venti** il giocatore ha in mano il clic sinistro e lo scatto, e basta. La
seconda abilità arriva a due ondate dalla fine e in pratica non si usa mai. Nel frattempo le passive
arrivano dall'ondata 4 in poi, e sono quattro.

E c'è uno spreco nascosto: ogni classe ha **quattro** abilità attive in catalogo e il giocatore ne sceglie
due, tardi. Metà del contenuto delle abilità non lo vede nessuno.

---

> # ✅ FATTO NELLA v2.16.0 (19 settembre 2026)
> Tutto quello che c'è scritto qui sotto è stato realizzato, tranne la **terza attiva del livello 13**,
> che Paolo deve ancora pensare: fino ad allora il terzo riquadro si vede tratteggiato con scritto «in
> arrivo» e il livello 13 dà solo il punto statistica.
> Il punto aperto n.1 (i 4 punti persi coi ranghi) è stato **chiuso: si accetta il calo a 14 punti**.
> Restano aperti il buco fra l'ondata 4 e l'8 e, appunto, la terza attiva.

## 🪜 LA NUOVA SCALETTA (decisa da Paolo)

| Livello | Cosa | Arriva all'ondata |
|---|---|---|
| **1** | **1ª attiva** — scelta obbligatoria prima di entrare nel primo livello | **1** |
| **3** | 1ª passiva (non comune) | **4** |
| **5** | 2ª passiva (rara) | **8** |
| **7** | **2ª attiva** | **11** |
| **9** | 3ª passiva (epica) | **13** |
| **11** | 4ª passiva (divina) | **15** |
| **13** | **3ª attiva** — *da definire, Paolo ci vuole riflettere* | **17** |
| **15** | cap + specializzazione (come adesso) | **19** |

Otto momenti distribuiti su venti ondate, invece dei sei di adesso ammassati in fondo. **Ogni livello
continua a dare un punto statistica**, come oggi.

Le ondate della colonna di destra sono misurate, non stimate: XP delle ondate secondo la composizione
vera, 500 per ogni ondata di boss, 2.400 per il mega boss finale.

---

## ✅ LE DECISIONI DI PAOLO, per esteso

### 1. I ranghi diventano SOLO SCENICI
Oggi i ranghi (1-3-6-9-12-15) danno un titolo nuovo **e un punto statistica extra**. D'ora in poi danno
solo il titolo: `puntiPerRango()` torna sempre 0.

> ⚠️ **La conseguenza, in cifre, perché non la scopra giocando.** Il budget di punti passa da **18 a 14**:
> 14 dai livelli (uno per livello, dal 2° al 15°) più 4 dai ranghi, che spariscono. È **−22%** di punti
> statistica per tutta la partita, su un sistema in cui i punti sono l'unica cosa che alza danno e PV.
> Va deciso se accettarlo o se rimettere quei 4 punti da un'altra parte — **punto aperto, vedi in fondo**.

I ranghi restando scenici si possono lasciare a 1-3-6-9-12-15 senza che si "sfasino" da niente: non
danno più nulla di meccanico, quindi non c'è più un allineamento da difendere.

### 2. Le pozioni passano da 3 slot a 2, e i salvataggi vecchi si rifiutano
La cintura di un salvataggio è scritta come tre slot. Invece di tagliarne uno in silenzio, si alza il
**`FORMATO` da 2 a 3**: chi ha un salvataggio di prima riceve un messaggio chiaro e non lo può riprendere.
Stessa scelta fatta nella v2.12.0 quando cambiarono i 104 id dell'equipaggiamento — netta e senza partite
mezze sbagliate.

### 3. Il livello 13 mostra lo slot spento
Finché la terza attiva non esiste, il terzo slot si **vede nell'interfaccia ed è spento**, scritto «in
arrivo». Il livello 13 per ora dà solo il punto statistica.

### 4. La prima attiva si sceglie PRIMA di entrare
Il flusso: si parla con l'anziano → il **portale della faglia** porta alla schermata di riepilogo → lì la
scelta dell'abilità è **necessaria per proseguire** (il pulsante che entra nel livello resta spento
finché non si è scelto).

### 5. I tasti cambiano mestiere
| | Oggi | Domani |
|---|---|---|
| **1 2 3** | pozioni (3 slot) | **abilità attive** (3 slot, il terzo spento) |
| **Q E** | abilità attive | **pozioni** (2 slot) |

---

## 🔧 COSA SI TOCCA, file per file

**`shared/levels.js`** — il cuore, e per fortuna è già in un posto solo.
- `SCAGLIONI` da `[3, 6, 9, 12]` a `[3, 5, 9, 11]` (i gradi delle carte restano nell'ordine: non comune,
  rara, epica, divina).
- `ABIL_SLOT` da `[{8,'q'}, {14,'e'}]` a tre voci: livelli **1, 7, 13**. I nomi degli slot non possono
  più essere `q`/`e` (vedi sotto): diventano `1`, `2`, `3`.
- `puntiPerRango()` torna 0 sempre.
- `prossimaScelta()` continua a funzionare da sola: legge le due tabelle.

**`shared/abilities.js`** — `a.slot` su ogni abilità passa da `'q'`/`'e'` a `'1'`/`'2'`, e `CD_Q`/`CD_E`
diventano il tempo di ricarica del primo e del secondo slot. Le dodici abilità restano quelle: nessun
contenuto nuovo in questo giro.

**`shared/potions.js`** — `SLOTS` da 3 a 2. `newBelt()` segue da solo.

**`shared/salvataggio.js`** — `FORMATO` da 2 a 3.

**`server/Room.js`** — `p.abil` non è più `{q, e}` ma tre slot; `applicaStat` e il resto non si toccano.
Il messaggio di input porta `q`/`e` booleani e `pot` numerico: diventa **`ab` numerico (0-3) e `pot`
numerico (0-2)**, che è più pulito e non lascia in giro due campi che hanno cambiato significato.
Va aggiunto il **blocco all'uscita** dal villaggio finché al livello 1 l'abilità non è scelta.

**`public/js/input.js`** — la riga 106-107: `Digit1/2/3` → abilità, `KeyQ`/`KeyE` → pozioni.

**`public/js/hud.js` + `index.html` + `style.css`** — la barra delle abilità (tre riquadri, il terzo
spento), la cintura (due slot invece di tre), le scritte dell'Erborista che dicono «slot 1, 2, 3», e la
banda della scelta nella schermata di riepilogo, che al livello 1 deve mostrare le attive e bloccare
l'uscita.

**`test/simulate.js`** — i test che affermano la vecchia scaletta vanno **riscritti, non tolti**:
- TEST su `puntiPerRango` (righe ~2040): oggi pretende che le fasce 2-5 diano un punto.
- Il budget dei punti (riga ~2051).
- Il TEST 53, che controlla che il livello 3 arrivi entro la quarta ondata: resta valido.
- I test delle abilità ai livelli 8 e 14.

---

## ❓ PUNTI APERTI

1. **I 4 punti statistica persi coi ranghi.** Si accetta il calo da 18 a 14 (−22%), o si rimettono
   altrove? Le due vie pulite: alzare `POINTS_PER_LEVEL` non si può (verrebbero 28), quindi o si dà un
   punto in più su quattro livelli scelti, o si rialzano gli effetti dei singoli punti. **Decide Paolo.**
2. **Il buco fra l'ondata 4 e l'8.** Con la nuova scaletta, fra la 1ª e la 2ª passiva passano quattro
   ondate senza niente: è il vuoto più largo della partita e sta proprio all'inizio. Basterebbe la 2ª
   passiva al livello **4** invece che al 5. Segnalato, non deciso.
3. **La terza attiva (livello 13).** Paolo ci vuole riflettere. Fino ad allora lo slot resta spento.

---

## 🧪 COME SI VERIFICA

- La scaletta si prova **leggendo le tabelle**, non giocando: un test che, data la curva dell'XP e la
  composizione delle ondate, dice a quale ondata arriva ogni momento della progressione. È la stessa
  misura che ha fatto emergere il problema, e diventa il test che impedisce di ricrearlo.
- Il blocco al livello 1 si prova dal **punto d'ingresso vero** (il messaggio che il client manda per
  uscire dal villaggio), controllando che senza abilità scelta il server **rifiuti** — non che il
  pulsante sia grigio, che è un'altra cosa.
- I tasti si provano **nel browser**: premere `1` deve mandare l'abilità e `Q` la pozione, non il
  contrario.
- E, come sempre: dopo la modifica si controlla anche ciò che **non** è stato toccato — la cintura da due
  slot non deve rompere l'Erborista, e il salvataggio rifiutato deve dirlo invece di crollare.
