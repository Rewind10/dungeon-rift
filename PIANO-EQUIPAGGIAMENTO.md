# 🗺️ PIANO — EQUIPAGGIAMENTO, INVENTARIO E SCHERMATA DI FINE LIVELLO

**Scritto il 14 settembre 2026, a partire dalla versione 2.11.3.**
Questo file esiste per un motivo solo: **poter riprendere da zero**. Chi lo legge — me fra una settimana, in
una conversazione nuova che non ricorda niente — deve poter continuare senza chiedere niente a Paolo.
Se una decisione non è scritta qui, non è stata presa.

Il catalogo dei 104 pezzi non sta in questo file: sta nella pagina **«Armeria di Dungeon Rift»** →
<https://claude.ai/artifact/QWzc3D6mGRQLPRR5QaWCeU> (privata, di Paolo). È la fonte da cui nascerà
`shared/gear.js`.

---

## 📌 DA DOVE NASCE

Parole di Paolo: *«la gestione dell'inventario e delle abilità non mi piace molto perché secondo me il
personaggio si sviluppa troppo poco»*.

Misurato, per capire se era una sensazione o un fatto. In una run intera il giocatore decide:

| | |
|---|---|
| carte passive | **4 scelte** su 32 carte esistenti |
| abilità attive | **2 scelte** su 4 per classe |
| specializzazione | 1 |
| punti statistica | ~14, su 4 statistiche |
| **equipaggiamento** | **0 scelte** |

Era un fatto. E la riga che pesa è l'ultima: l'equipaggiamento esiste (4 gradi per slot, con i nomi già
scritti) ma è una **scala**, non una scelta — si compra il pezzo dopo quando si hanno le monete, non c'è
mai un bivio. In più **il fabbro è spento**: `SHOP_GEAR_ENABLED: false`, «Emporio a monete nascosto in
attesa di ridisegno». In una partita vera non si compra niente: l'equipaggiamento lo assegna il gioco in
base all'ondata.

---

## 🧭 LE TRE FASI, IN QUEST'ORDINE

L'ordine non è casuale ed è stato scelto da Paolo: **prima gli oggetti, poi il contenitore**. Così dopo la
fase 1 il gioco è già giocabile e si può dire se il personaggio si sviluppa meglio, senza aspettare
l'interfaccia nuova.

| Fase | Cosa | Stato |
|---|---|---|
| **1** | Il **negozio**: 104 pezzi coi bivi, la vendita a metà prezzo | ✅ **fatta nella v2.12.0** |
| **2** | La **schermata di fine livello unica**, con dentro l'**inventario** | ✅ **fatta nella v2.13.0** |
| **3** | Il **negozio ridisegnato** con lo stesso stile a icone quadrate della fase 2 | ✅ **fatta nella v2.14.0** |

> # ✅ IL PIANO È CHIUSO (v2.14.0)
>
> Tutte e tre le fasi sono fatte. Quello che resta non è più questo piano: sono **tre decisioni di Paolo**
> rimaste in sospeso, e vanno chiuse una per volta. **Ne resta una e mezza: la 3 è chiusa nella v2.15.0.**
>
> **E una cosa trovata strada facendo, ancora da decidere:** il passivo **Piastra** del guerriero — «riduce
> del 12% i danni subiti», scritto nella scheda che il giocatore legge alla scelta del personaggio —
> **non è applicato da nessuna parte nel motore**. `plate` e `passives` non compaiono in nessun calcolo:
> si disegnano e basta. È un -12% che il giocatore crede di avere e non ha. Detto a Paolo il 17 settembre,
> non toccato senza il suo via.
>
> ### 1. I prezzi sono troppo bassi, ed è misurato
> `test/monete.js` dice che una run di 20 ondate contiene **~14.200 monete** (~9.900 senza premi di
> velocità né taglie). La scala completa del guerriero — comune, raro, leggendario, divino, con la
> rivendita a metà che restituisce 1.715 — costa **~4.965 nette**: finita **verso l'ondata 11 su 20**. Da
> lì in poi al fabbro non c'è più niente da volere. **Il listino approvato è quello che gira**: non è
> stato cambiato senza chiedere. Se si alzano gli ultimi due gradi, si rimisura con quel file.
>
> ### 2. I due testi in fondo alla colonna di sinistra
> «Non impara: riceve...» e «Statistiche della partita / Da qui lo guardi...» sono ~200px e sono il motivo
> per cui quella colonna resta la più alta delle tre. Il secondo compare solo all'ondata 1. Sono testi di
> Paolo: da accorciare, togliere o lasciare — decide lui.
>
> ### 3. ~~Il profilo delle classi conta o no?~~ ✅ **CHIUSA nella v2.15.0**
> Conta, ma solo su **PV, riduzione, passo e rinculo** — mai su danno e cadenza — e conta lo **scarto dal
> centro (5,5)**, non il valore assoluto. Paolo ha scelto fra tre varianti misurate («vai con la C»).
> Dettagli e numeri nel blocco della v2.15.0 qui sotto.

> ## ✅ COSA È STATO FATTO NELLA v2.15.0 (decisione 3: il profilo delle classi)
>
> **La domanda era: il profilo conta o no?** Paolo ha scelto «frazione di punto» — un punto di base vale
> una frazione di un punto speso — e come verifica «la tabella dei numeri», non una partita simulata. La
> tabella ha fatto emergere un problema che ha cambiato la forma della risposta, ed è il motivo per cui
> questo blocco è lungo: chi riprende da qui deve sapere **perché** non è stato fatto nel modo ovvio.
>
> ### Il problema che la misura ha tirato fuori
> Facendo contare la base su tutto (un quarto di punto), i danni al secondo passavano da **79/78/78** a
> **93/105/102**: parità rotta, e **il mago diventava il più forte dei tre**. Non è un numero da ritoccare,
> è strutturale — ogni classe ha il suo valore più alto proprio nella statistica della propria scuola di
> danno (mago INT 8, ladro DES 8, guerriero FOR 8), e per di più INT e DES alzano danno **e** cadenza
> mentre FOR alza solo il danno. Qualunque peso dato alla base gonfia il danno, e lo gonfia di più a chi
> ha due effetti invece di uno.
>
> ### Le tre varianti messe sul tavolo, tutte misurate sul motore vero
> | | DPS | PV efficaci | passo |
> |---|---|---|---|
> | **A** — un quarto su tutto | 93 / 105 / 102 (parità rotta) | +22% / +20% / +28% | +2,5% / +3,8% / +5% |
> | **B** — un quarto, non su danno e cadenza | invariato | +22% / +20% / +28% | idem |
> | **C** — metà dello scarto, non su danno e cadenza | invariato | **+14% / -15% / +5%** | -1,9% / +0,6% / +3,1% |
>
> (ordine: guerriero / mago / ladro). **Paolo ha scelto la C.**
>
> ### Com'è fatta
> - `Heroes.profiloPunti(heroId, statId)` = `(base - 5,5) × 0,5`. `STAT_CENTRO` e `PROFILO_PESO` sono due
>   costanti dichiarate accanto a `STAT_BASE`: spostare `PROFILO_PESO` è l'unico modo di rendere il
>   profilo più o meno marcato.
> - `applicaProfilo(p)` in `server/Room.js`, **accanto** ad `applicaStat()` e deliberatamente **separata**:
>   riusare `applicaStat` con un peso sarebbe più corto e sarebbe sbagliato, perché trascinerebbe dentro
>   `schoolDmg`/`schoolRate`. Tocca `maxHpFlat`, `dmgReduce`, `speedMult`, `knockMult`. Basta.
> - Si applica nei **tre** punti in cui le statistiche di un giocatore ripartono da zero: `addPlayer`, il
>   reset di `startGame`, e `_recomputeBoons`. Se ne saltasse uno, il profilo sparirebbe la prima volta che
>   si accende o spegne una carta.
> - **La riduzione non scende mai sotto zero.** Chi subisce un colpo passa da `if (dr > 0)`, quindi una
>   riduzione negativa non farebbe male davvero: comparirebbe solo nel pannello, come un'armatura «-0,9%»
>   che non esiste. Chi sta sotto il centro in Costituzione paga in PV, e quello si sente.
> - In `addPlayer` i PV vengono riallineati subito (`p.hp = this.effMaxHp(p)`): un mago nascerebbe con 100
>   PV su un massimo di 91 e la barra partirebbe oltre il fondo.
>
> ### I numeri finali, letti dal codice della v2.15.0
> | classe | DPS | PV | riduzione | PV efficaci | passo |
> |---|---|---|---|---|---|
> | Guerriero | 79,2 (invariato) | 206 → **231** | 0 → **1,5%** | 206 → 234,5 (**+13,8%**) | 203,7 → 199,9 (**-1,9%**) |
> | Mago | 78,0 (invariato) | 106 → **91** | 0 | 106 → 91 (**-14,2%**) | 210,0 → 211,3 (+0,6%) |
> | Ladro | 78,2 (invariato) | 118 → **123** | 0 → **0,3%** | 118 → 123,4 (**+4,6%**) | 231,2 → 238,3 (**+3,1%**) |
>
> **Il prezzo, detto in chiaro:** il mago passa da **7 a 6 morsi di zombie** all'ondata 1 (14 danni × il
> fattore d'ondata). È un colpo di margine in meno sul personaggio già più fragile, ed era previsto.
>
> ### I test
> - **TEST 71** diceva l'opposto («il profilo NON entra nei calcoli») ed è stato **riscritto, non tolto**:
>   ora controlla i due lati insieme — spostare il profilo a 99 deve muovere PV e passo, e **non** deve
>   muovere danno né cadenza. Controlla anche che nessuna classe nasca con riduzione negativa e che
>   rimettendo il profilo a posto si torni esattamente ai PV di prima.
> - **TEST 54** (Baluardo, Scudo Vitale) misurava la riduzione in **assoluto**: il ladro ora nasce con un
>   mezzo punto di riduzione dal profilo e falliva per il motivo sbagliato. Ora misura la **differenza**
>   prima/dopo la carta, che è quello che quelle prove volevano dire.
> - Suite completa: **3155 passati, 0 falliti**.
>
> ## ✅ COSA È STATO FATTO NELLA v2.14.0 (fase 3)
>
> - **Una linguetta per slot**: 13 pezzi per volta invece di 39. La linguetta aperta si ricorda per classe,
>   e sfogliarle non parla col server. Sulla linguetta un **pallino verde** quando dentro c'è qualcosa che
>   ti puoi permettere e non hai addosso.
> - **Caselle quadrate**, le stesse del baule e della banda delle scelte: **quattro per riga**, celle `1fr`
>   che si allargano a riempire il pannello (110px) e `aspect-ratio` che le tiene quadrate.
> - **Ordine per prezzo** (a pari prezzo: pesante, equilibrata, leggera). Deciso da Paolo.
> - **Via i titoli dei gradi e la colonna dei prezzi a destra**, su sua richiesta: il colore della cella
>   dice già il grado, e il prezzo è scritto sulla cella.
> - **Stati in chiaro** sulla casella (*in uso*, *già tuo*, prezzo, spenta se non basta) e **statistiche
>   nel titolo** col grado, il carattere e il prezzo di rivendita.
>
> ### 🔧 Ritoccato nella v2.15.1, su richiesta di Paolo
> - **La finestra era la più piccola delle tre** (Fabbro 620 max e ~494 a schermo, Erborista 760,
>   Banditore 860). Ora è **760 come l'Erborista**, con `width` e non solo `max-width`.
> - **Le statistiche sono tornate DENTRO la cella** e il tooltip è stato tolto: restano 4 per riga, quindi
>   le celle sono 175px e ci sta una piccola scheda (nome, grado a parole, statistiche una per riga,
>   stato, rivendita). Il `title` non c'è più — l'informazione o è a schermo o non c'è.
> - Il controllo nel browser adesso guarda **tutte e tre le classi e 8 slot**, e cerca anche il testo
>   **tagliato dai puntini**, che non traboccherebbe e sparirebbe in silenzio.
>
> ### ⚠️ Cosa si è perso, e va saputo
> Fino alla 2.12 le tre colonne del negozio erano i **caratteri**, sempre nello stesso ordine: due pesanti
> di grado diverso stavano incolonnati e si confrontavano senza cercarli. Con quattro per riga in ordine di
> prezzo quell'incolonnamento non c'è più — il carattere si legge dal simbolo in cima alla cella (▰ ▱ ▫) e
> dal titolo. È il prezzo del layout richiesto, ed è stato detto a Paolo prima di consegnare.

> ## ✅ COSA È STATO FATTO NELLA v2.13.0 (fase 2)
>
> Le tre decisioni che questo piano lasciava aperte, chiuse da Paolo:
> - **Larghezza: 1280px** («una via di mezzo»), non full width e non i 960 di prima.
> - **L'inventario a destra: clic = si equipaggia subito.** Non si vende da lì: vendere resta del fabbro.
> - **Il villaggio è un pulsante in fondo**, non più una linguetta.
>
> Fatto: tre colonne (chi sei / cosa porti / cosa hai), due linguette a sinistra, il **ritratto** al centro
> disegnato da `Renderer._hero` con l'equipaggiamento vero addosso, le **quattro derivate** (danno,
> armatura, cadenza, passo) prese dalle funzioni del motore, il **baule** a icone quadrate con
> `MSG.EQUIPAGGIA` — una porta nuova che *non compra*, non vale in combattimento e non accetta roba di
> un'altra classe. La scelta in sospeso è diventata una **banda a tutta larghezza in cima**.
>
> Nota su cosa NON è stato fatto: le abilità nella linguetta di sinistra sono ancora l'elenco di prima, non
> icone quadrate. Il restyle a icone è materiale della fase 3, insieme al negozio.

> ## ✅ COSA È STATO FATTO NELLA v2.12.0 (fase 1)
>
> Tutto quello che questo piano chiedeva per la fase 1, più tre cose che il piano non sapeva:
>
> - `shared/gear.js` riscritto: 104 pezzi con `carattere` e `tinta`, `RANK_RARITY` a cinque voci,
>   `CARATTERI`, `itemsOfRank`, `maxRank`, `startingGear` sul **grado minimo**. Le `desc` **nascono dai
>   numeri**: erano scritte a mano e mentivano.
> - Il **listino sta in un posto solo** (`PREZZI`, una riga per slot): prima era scritto su ogni pezzo,
>   104 occasioni perché due pezzi dello stesso grado divergessero di prezzo.
> - `C.RARITY.scarso` aggiunto · le tre cose del renderer sistemate · `effFireDelay` legge
>   `gearBonus.fireRateMult` · vendita completa (server + client) · commento falso sul Mercato corretto.
> - **`SHOP_GEAR_ENABLED` resta SPENTO** — questo piano diceva di riaccenderlo, ed era sbagliato: il
>   fabbro del villaggio funziona già e vende tutto. Due negozi con la stessa merce = chi ne trova uno
>   smette di cercare l'altro. Deciso con Paolo.
> - `shared/salvataggio.js`: **formato da 1 a 2**. I salvataggi vecchi contengono ID che non esistono più.
> - `Room._preparaProva` sceglieva il pezzo per **posizione** nella lista, non per grado: con 13 pezzi per
>   slot, `l[3]` all'ondata 16 dava un pezzo **comune**.
> - `test/monete.js`, nuovo. 3119 test passati, 0 falliti (TEST 12, 37 e 62 riscritti: **codificavano la
>   regola vecchia**, cioè erano diventati test che difendevano il bug).
>
> ### ⚠️ LA COSA APERTA: i prezzi sono troppo bassi, e adesso è misurato
> Una run intera di 20 ondate contiene **~14.200 monete** (~9.900 senza premi di velocità né taglie).
> La scala completa per il guerriero — comune, poi raro, poi leggendario, poi divino, con la rivendita a
> metà che restituisce 1.715 — costa **~4.965 nette**, cioè è finita **verso l'ondata 11 su 20**.
> Da lì in poi al fabbro non c'è più niente da volere. **Il listino approvato è quello che gira**: non è
> stato cambiato senza chiedere. Se Paolo vuole, si alzano gli ultimi due gradi e si rimisura.

---

# FASE 1 — IL NEGOZIO

## La regola che si ribalta

In `shared/gear.js` c'è scritto nero su bianco: *«un rango più alto costa di più e ha statistiche migliori,
SEMPRE — niente scambi alla pari, niente svantaggi nascosti»*. Era onesto ed era il problema. **Va
riscritto**, perché adesso dentro ogni grado ci sono tre oggetti di pari valore e caratteri diversi.

**Il vincolo che li tiene onesti: dentro lo stesso grado il danno al secondo è quasi identico (±8%).** Se
un'arma dello stesso grado rendesse di più non sarebbe un bivio: sarebbe una scelta giusta e due sbagliate.
La differenza sta in **come** si gioca — portata, arco, rinculo, perforazione, velocità del dardo — non in
quanto rende. Fra un grado e l'altro invece si sale, come sempre.

## I tre caratteri

Gli stessi a ogni grado, così la regola si impara una volta:

| | Armi | Difensive |
|---|---|---|
| **Pesante** | colpo forte, cadenza bassa, rinculo alto, portata corta | più difesa · **rallenta** e **abbassa la cadenza** |
| **Equilibrata** | la via di mezzo | la via di mezzo |
| **Leggera** | colpo debole, cadenza alta, rinculo basso | meno difesa · **velocizza** e **alza la cadenza** |

Per il **ladro** il carattere dell'arco è **gittata contro cadenza**: l'arco lungo tiene lontano ma è lento,
il ricurvo tira una freccia dopo l'altra ma vuole che tu stia addosso.
Per il **mago** è la **bolla**: pesante = lenta e grossa, leggera = svelta e minuta.

## Cinque gradi, non quattro

Deciso da Paolo: *«nulla di gratuito, e l'equipaggiamento iniziale lo definirei come scarso, così ha senso
iniziare subito l'upgrade con armi perlomeno comuni»*.

| Grado | Quanti | Si compra? |
|---|---|---|
| **Scarso** | 1 per slot | no — è quello che hai addosso |
| **Comune** | 3 per slot | sì |
| **Raro** | 3 | sì |
| **Leggendario** | 3 | sì |
| **Divino** | 3 | sì |

Fa **13 pezzi per slot** e **104 in tutto** (guerriero 3 slot, mago 2, ladro 3).

## I numeri confermati

- **Scarso** ≈ **20% sotto** il comune (l'arma di partenza del guerriero passa da 99 a 79 danni/s).
- **Comune** = i valori di oggi (~99 danni/s), a **170 monete** l'arma.
- **Rivendita** = **metà prezzo**. I pezzi scarsi valgono **8 monete** — simbolico, ma non zero: buttarli
  non dev'essere gratis.
- Si vende **ciò che si ha in inventario**, non quello che si ha addosso.

Scala dei costi: armi 170 / 380 / 650 / 1100 · armature 150 / 340 / 600 / 1050 · scudi 160 / 360 / 620 /
1100 · calzature 140 / 320 / 580 / 1000.

> ⚠️ **I prezzi vanno MISURATI, non creduti.** Quelli vecchi erano tarati su un commento sbagliato in
> `gear.js` («il Mercato apre ogni 3 ondate»): **falso**, il villaggio si raggiunge alla fine di **ogni**
> ondata — `vaiAlVillaggio` controlla solo che la fase sia `PHASE_SHOP` e che non sia l'ultima ondata.
> Quel commento va corretto. E prima di dire che i prezzi tornano, va simulata una run e contato quante
> monete si accumulano davvero.

## ⚠️ LE TRE COSE CHE IL PASSAGGIO A 5 GRADI ROMPE

Trovate leggendo, **prima** di scrivere i dati. Se si scrivono i 104 oggetti senza sistemarle, il gioco si
rompe in modi che i test non vedono.

**1. Il grado 5 fa sparire l'arco del ladro.** In `public/js/renderer.js` (~riga 3527):

```js
const BL = [1, 1.34, 1.48, 1.60][wrk - 1], BC = [0.46, 0.62, 0.70, 0.76][wrk - 1];
```

Quattro valori indicizzati per rango: con un'arma di grado **5** diventa `[4]` → `undefined` → tutta la
matematica del disegno va in `NaN`. Serve un quinto valore (o un clamp dell'indice). **È l'unico posto del
genere**: il file è già stato spazzato cercando altri array indicizzati per rango e non ce ne sono.

**2. Il campo `tinta` va riportato su tutti i pezzi nuovi.** Ogni oggetto difensivo porta una `tinta`
(`{ cloth, clothDk, mant, capp }` per le armature, `{ steelDk }` per le calzature) che il renderer usa in
`_palGear` per **ridipingere il personaggio**. Senza, niente crasha — `_palGear` controlla — ma il
personaggio smette di cambiare aspetto comprando roba nuova, cioè sparisce proprio la soddisfazione che
stiamo cercando di aggiungere. Le tinte vecchie sono recuperabili dalla versione 2.11.3 di `gear.js`.

**3. L'alone del pregiato va spostato a `>= 5`.** In `renderer.js` (~riga 3284) la soglia è `>= 4`: con
cinque gradi prenderebbe anche il leggendario. **Paolo ha deciso: deve brillare solo il divino.**

## Il resto del lavoro della fase 1

- **`shared/gear.js`**: riscrivere `ITEMS` (104 pezzi, con `carattere` e `tinta`), portare `RANK_RARITY` a
  cinque voci, aggiungere `prezzoVendita(it)` e `CARATTERI`. `startingGear` deve prendere il **rango
  minimo**, non il primo della lista.
- **`shared/constants.js`**: aggiungere la rarità **`scarso`** a `C.RARITY` (oggi non c'è) e rimettere
  `SHOP_GEAR_ENABLED: true`.
- **La cadenza dall'equipaggiamento non esiste.** `bonusOf` somma qualunque chiave, ma **nessuno legge**
  `gearBonus.fireRateMult`: `effFireDelay` guarda solo `p.stats.fireRateMult`. Serve una riga in
  `Room.effFireDelay`. La **velocità** invece funziona già: `effSpeed` legge `gearBonus.speedMult`, quindi
  un'armatura pesante rallenta mettendo un valore negativo.
- **La vendita**: nuovo messaggio (`VENDI`), handler in `server/index.js`, metodo in `Room` che toglie da
  `p.owned`, accredita `prezzoVendita`, e **rifiuta di vendere ciò che si ha addosso**. `p.owned` è già
  l'inventario: non serve inventare una struttura nuova.
- **Il tetto alla riduzione danni è 0,85** (`Room`, ~riga 850) — lo stack pesante è sicuro, ma tenere il
  kit più pesante intorno a 0,50-0,55 come oggi.

---

# FASE 2 — LA SCHERMATA DI FINE LIVELLO

Riferimento visivo: la schermata di **Baldur's Gate 3** che Paolo ha mandato. *«Ovviamente devi solo trarre
ispirazione, nessuno si aspetta che tu la possa riprodurre fedelmente.»*

Oggi il pannello ha **quattro linguette** (riepilogo, personaggio, abilità, villaggio) e una larghezza
bloccata a `min(960px, 94vw)` — su un monitor grande resta una colonna al centro col nero intorno.

**Le tre schede diventano una schermata sola, più l'inventario.** Impianto:

| Zona | Cosa |
|---|---|
| **Sinistra** | **due linguette**: (1) statistiche del personaggio **+ il riepilogo dell'ondata** — uccisi, combo, danni, tempo; (2) le **abilità**, a icone quadrate |
| **Centro** | il personaggio con addosso i suoi slot — arma, armatura, scudo/calzature *(dedotto dall'immagine; confermare)* |
| **Destra** | la **griglia di icone quadrate**: l'inventario |
| **In fondo** | **due soli pulsanti**: vai al villaggio, inizia ondata |

**Le statistiche a sinistra.** Le quattro del gioco ci sono già come punti spendibili — forza,
costituzione, intelligenza, destrezza — e si spiegano da sole come STR/DEX di un GDR. Paolo chiede di
aggiungere **tre voci derivate**: **danno, armatura, cadenza**.

**Sulla larghezza.** Paolo ha chiesto perché non si usa tutto lo schermo. Il tetto è `min(960px, 94vw)` in
`.upgrade-inner`. Va alzato — ma *full width* letterale non è meglio: a 2560px le righe di testo diventano
illeggibili. Proposta non ancora decisa: alzare a **1400-1600px** e far usare lo spazio in più alle
**griglie**, tenendo i testi in una colonna leggibile. **Decisione aperta.**

**Nota**: la schermata **SCONFITTA** di fine partita (`#endScreen`) è un'altra cosa e non è stata discussa.

---

# FASE 3 — IL NEGOZIO RIDISEGNATO

Stesso stile della fase 2, e riusa i pezzi già scritti là.

- **Linguette per slot**: guerriero *arma / armatura / scudo* · ladro *arco / armatura / calzature* ·
  mago *arma / armatura*.
- Dentro ogni linguetta **tutti** i pezzi come **icone quadrate**.
- **All'hover** compaiono le statistiche del pezzo.
- Da qui si **vende** anche.

---

## ✋ COME SI LAVORA SU QUESTO PROGETTO

Regole di Paolo, e vanno rispettate:

- **«Il capo sono io, tu esegui i miei desideri: meno iniziativa e più ascolto.»** Chiedere **prima** di
  decidere. Su questo piano ha detto esplicitamente: *«non partire a testa bassa, andiamo passo passo»*.
- **Niente immagini o anteprime** se non le chiede: consumano crediti.
- **Meno test e meno spesso.**
- **A ogni nuova versione si aggiornano i .md** — README, CARATTERISTICHE, CHANGELOG — così si può
  riprendere dal punto in cui si è interrotto.
- **Non si committa su git**, e si evita di eseguire git (lascia file `.git/*.lock` non cancellabili).
- La consegna è: scrivere i file in `C:\Www\dungeon-rift`.

### 🔬 E come si verifica — due lezioni pagate care, oggi

**1. Provare la funzione non è provare la strada.** Il TEST 69 chiamava `_inviaPannello` a mano: dimostrava
che *quella funzione* era giusta, non che il gioco ci passasse. Stessa cosa con le guardie del villaggio: i
test chiamavano `setInput` a mano, e lì dentro «Spazio continua» e «Spazio spara» erano scollegati — **il
legame che ha rotto il gioco non esisteva nella simulazione**. Nove assert verdi su un meccanismo che nella
realtà non poteva funzionare. Si gioca l'ondata vera.

**2. Un controllo nel browser che non tocca niente passa sempre.** Per la v2.9.4 avevo scritto
`if (window.HUD && window.HUD.offerBoon) window.HUD.offerBoon(payload)` — e `HUD.offerBoon` **non esiste**
(la funzione vera è `setBoons`). Quell'`if`, scritto per prudenza, ha reso la chiamata un buco nel vuoto, e
il controllo è passato senza verificare niente. **Si entra dal punto d'ingresso vero** (`Net.onOfferBoon`) e
si guarda cosa il client riceve e cosa manda.

**3. E si prova che il test fallisca sul bug.** Prima di dire «corretto», rimettere il codice rotto e
controllare che il test lo prenda. Un test che non fallisce sul bug che dovrebbe prendere non è un test.

---

## ▶️ LA PRIMA COSA DA FARE, DOMANI

1. Aprire l'**Armeria** (link in cima) e applicare le correzioni di Paolo a nomi e numeri.
2. Riscrivere `shared/gear.js` con i 104 pezzi, `carattere` e `tinta`.
3. Sistemare le **tre cose del renderer** elencate sopra.
4. Aggiungere la vendita, la cadenza dall'equipaggiamento, e riaccendere `SHOP_GEAR_ENABLED`.
5. **Misurare** le monete di una run vera, e solo allora dire se i prezzi tornano.
6. Consegnare una versione **giocabile**, così Paolo può dire se le prime ondate reggono.
