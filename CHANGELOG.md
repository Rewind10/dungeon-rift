# 📜 CHANGELOG — DUNGEON RIFT

Tutte le modifiche rilevanti del progetto, versione per versione (dalla più recente).

### [1.57.0] — 2026-08-25 · "Il mercato è una sala scavata, non un villaggio"

La v1.56 aveva un errore di ambientazione: case col tetto spiovente, alberi e staccionate **sottoterra**.
Rifatto da capo come camera scavata nella roccia.

#### ⛏️ Generatore ribaltato: si scava, non si costruisce
- `generateMarket()` parte da **roccia piena** e *scava* la sala, invece di partire da uno spiazzo e murarlo.
  Fuori dalla sala non c'è mappa: c'è pietra. Pareti **quasi nere** (`wall #050607`).
- **Un solo varco**, a sud, largo 3 tile, su un corridoio corto col **portale EXIT** in fondo. Nord, est e
  ovest sono chiusi — verificato dal test, non a occhio.
- Niente lastricato: il pavimento è la roccia nuda, come nel resto del dungeon.

#### 🔥 Buio, con la luce che nasce dal falò
- La maschera dell'oscurità **torna attiva** anche qui (in v1.56 era disattivata). La sala è illuminata da
  **un'unica grande sorgente circolare centrata sul falò** (`bigLight`, raggio 430px): scopre i cinque
  banchetti e si spegne contro le pareti. Le lanterne appese ai pali fanno da luci di appoggio.
- Il falò entra anche nel passaggio di luce colorata, così la sala è calda e non grigia.

#### 🛖 Banchetti e mercanti
- **Cinque banchetti** a ferro di cavallo attorno al fuoco, aperti verso il varco sud: bancone di pietra e
  legno, tendone a strisce, lanterna accesa sul palo, merce diversa per mestiere. Scalati **1.7×**: il banco
  è più grande del mercante, non viceversa.
- I **mercanti** sono al doppio della taglia della v1.56 e più dettagliati — mantellina, cintura con fibbia,
  pieghe della veste, due braccia con le mani, occhi accesi, l'attrezzo del mestiere in mano — mantenendo la
  silhouette incappucciata di prima.
- Stanno a **2.1 tile** dal proprio banco. A 1.75 finivano *dentro* il tendone: in vista dall'alto "stare
  dietro" vuol dire stare più in alto sullo schermo, ed è lì che sta la tenda.
- Targa del **Fabbro** corretta: era "🔨 Fabbro — Emporio" su una riga e sforava sul banco; ora è "Fabbro"
  con "— emporio —" sotto, come il "— chiuso —" degli altri quattro.

#### 🎛️ Menu di pausa
- Il pulsante diventa **"🏕️ VAI AL VILLAGGIO"** e i due pulsanti stanno **affiancati**: `button.primary` e
  `button.ghost` hanno `width:100%`, che li impilava — annullato dentro `#shopActions`.

#### 🧹 Pulizia
- Rimossi `_bakeBuilding` e i prop di superficie della v1.56 (`house`, `tree`, `fence`, `lamp_post`,
  `market_stall`): non li usava più nessuno.

#### 🧪 Test
- `testV157` sostituisce `testV156`: verifica che la sala sia scavata (niente pavimento fuori, niente muri
  dentro), che il varco sia **uno solo** e a sud, che dallo spawn si **raggiunga il portale a piedi**
  (flood fill), che i banchetti siano 5, tutti diversi e più grandi dei mercanti, che ogni mercante stia
  **dietro** il suo banco, che nessuno finisca dentro la roccia e che la mappa resti **buia**.
  **333 passati, 0 falliti.**
- La sala è stata renderizzata con Chromium e **approvata su anteprima prima** di toccare il codice del
  progetto: due giri di correzioni (mercanti dentro il tendone, targa che copriva la faccia) sono avvenuti
  in sandbox, non sul repository.

---

### [1.56.0] — 2026-08-25 · "Il mercato è un villaggio"

La sosta smette di essere una caverna riciclata: mappa dedicata, disegnata a mano.

#### 🏘️ Mappa dedicata, metà misura, senza muri
- Nuovo generatore `MapGen.generateMarket()`, separato da quello delle ondate. **32×24 tile contro 46×34**
  (il **49%** dell'area): una sosta va letta a colpo d'occhio, non esplorata.
- **Nessun muro interno.** Gli unici blocchi solidi sono i **5 edifici** — e sono solidi *nella griglia*, così la
  collisione arriva gratis dal sistema di tile invece di richiedere una collisione per-oggetto.
- **Villaggio illuminato** (`map.lit`): la maschera della torcia viene saltata. Un rifugio al buio pesto,
  con la lanterna che scopre un metro alla volta, contraddiceva l'idea stessa di posto sicuro.
- **Tema dedicato** (`village`), caldo, e piazza ripulita: nel mercato spariscono massi, buche e le crepe
  profonde del generatore da caverna, che facevano sembrare la piazza un crollo. Restano i ciottoli.

#### 🏠 Cinque costruzioni, cinque abitanti
- **Fucina · Locanda · Magazzino · Cappella · Torre della Gilda**, disposte attorno a una piazza col pozzo.
  Ognuna con tetto spiovente, finestre illuminate, insegna sopra la porta, lanterna accesa e targa col nome.
  La Fucina ha il comignolo che fuma.
- **5 NPC**: il **Fabbro** è l'unico che vende (i 3 slot dell'equipaggiamento); **Erborista, Locandiere,
  Cartomante e Banditore** sono botteghe **ancora chiuse** e lo dicono, così nessuno resta lì a premere tasti
  aspettando un pannello che non esiste. Sono i posti già pronti per le prossime destinazioni.
- Arredo: pozzo centrale, lampioni che illuminano davvero, banchi del mercato, casse, barili, alberi,
  staccionate, stendardi e il cartello **MERCATO**.
- Il percorso è leggibile: si arriva da sud, il fabbro è a **7 tile**, il portale **EXIT** a **13**, con la
  colonna centrale sgombra.

#### 🧪 Test
- Nuovo **testV156**: proporzione dell'area, assenza di muri interni oltre agli edifici, 5 costruzioni tutte
  diverse e solide nella griglia, 5 abitanti di cui uno solo attivo, **nessun abitante o arredo dentro un
  edificio**, corridoio centrale sgombro, mappa dichiarata illuminata e priva di spawn nemici e casse, e
  40 rigenerazioni di fila senza che un giocatore compaia dentro un muro. **334 passati, 0 falliti.**
- Verifica visiva: la mappa è stata renderizzata fuori dal gioco con Chromium per controllare il disegno di
  edifici, arredo e abitanti prima della consegna.

---

### [1.55.0] — 2026-08-25 · "Costi XP a tabella: primi sei ×3, ultimi due ×2"

#### 📏 Prima di tutto: il modello di reddito era sbagliato
Le tarature 1.51→1.54 sono state calcolate su una stima **senza combo**, che valutava l'ondata 2 a ~99 XP.
Misurata in partita vera ne frutta **240**: il modello sottostimava di circa **2.4×**. Una run non vale ~7.500
XP ma **~18.000**. Tutte le conclusioni precedenti su "quanto puoi permetterti" erano ottimistiche di
conseguenza — ed e' il motivo per cui il negozio continuava a sembrare facile nonostante due giri di rincari.

#### ✦ Nuova scaletta
| Livello | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| v1.54 (base 10) | 30 | 48 | 66 | 185 | 517 | 1449 | 2463 | 4187 |
| **v1.55** | **90** | **144** | **198** | **555** | **1551** | **4347** | **4926** | **8374** |
| rapporto | ×3 | ×3 | ×3 | ×3 | ×3 | ×3 | ×2 | ×2 |

- Portare **una** statistica al tetto: da 8.945 a **20.185 XP** — piu' di una run intera anche col reddito
  reale. L'albero completo: da 53.670 a **121.110**, cioe' fuori portata per progetto.
- Il primo livello costa **90** contro i ~130 XP della prima ondata: si compra una cosa sola, e si sceglie.

#### 🧰 I costi sono ora una TABELLA, non una formula
- `STAT_COST_STEPS` elenca un moltiplicatore per livello. La taratura procede per interventi diretti sui
  numeri ("triplica i primi sei, raddoppia gli ultimi due") e nessuna formula unica li segue senza distorcere
  il resto della curva — la v1.54 aveva gia' richiesto tre regimi e due costanti di raccordo. Con la tabella si
  tocca esattamente il livello che si vuole toccare, e la scaletta si legge a colpo d'occhio.

#### ⚠️ Nota sul 7° livello
Triplicando il tronco e raddoppiando la coda, il **7° costa solo il 13% piu' del 6°** (4.926 contro 4.347),
mentre ogni salto precedente era di +180%. E' un gradino piatto in mezzo al muro: dopo aver pagato il 6°, il 7°
sembra regalato. Se in partita da' fastidio, e' il primo numero da alzare — riga `STAT_COST_STEPS`, settimo
valore.

#### 🧪 Test
- `testV153` verifica il fattore ×3 sui primi sei livelli, il ×2 sugli ultimi due, la monotonia, la
  proporzionalita' al `base` della statistica e le soglie di costo complessivo. **309 passati, 0 falliti.**

---

### [1.54.0] — 2026-08-25 · "Esperienza: tronco triplicato, coda smorzata"

Ritaratura della sola curva del negozio XP: la v1.53 era ancora troppo generosa nel tratto in cui si spende
davvero. Nessun'altra modifica.

#### ✦ Tre regimi invece di due
- **Livelli 1-6 × 3.** Tutto il tronco costa il triplo della v1.53. La prima ondata frutta ~56 XP e il primo
  livello ne costa **30**: la spesa diventa una decisione dalla partita numero uno, non da metà run.
- **Livello 7 adeguato** al nuovo tronco (1.352 → **2.463**): triplicandolo sarebbe finito a 4.056, cioè sopra
  l'ottavo della v1.53 — la curva si sarebbe ribaltata.
- **Livello 8 solo ritoccato** (3.786 → **4.187**, +11%). Gli ultimi due livelli sono smorziati apposta
  (`STAT_TAIL_MULT` 1.7 invece di 2.8): triplicati sarebbero diventati **decorativi**, fuori portata in
  qualunque run. Così restano trofei di fine partita.

  | Livello | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|
  | v1.53 (base 10) | 10 | 16 | 22 | 62 | 172 | 483 | 1352 | 3786 |
  | **v1.54** | **30** | **48** | **66** | **185** | **517** | **1449** | **2463** | **4187** |
  | rapporto | ×3.00 | ×3.00 | ×3.00 | ×2.98 | ×3.01 | ×3.00 | ×1.82 | ×1.11 |

- Portare **una** statistica al tetto passa da 5.903 a **8.945 XP** — più dell'intera raccolta di una run
  (~7.500). L'albero completo da 35.418 a **53.670**. Il tetto di una singola statistica è ora raggiungibile
  solo giocando la **COMBO** (moltiplicatore XP fino a ×2.5), che diventa a tutti gli effetti la seconda
  economia del gioco.
- Segnale misurato: i bot dei test (che comprano a caso) passano da ondata 7 a ondata 4 nello stesso tempo
  simulato. Sono bot stupidi — indicatore di direzione, non verdetto.

#### 🧪 Test
- `testV153` aggiornato: verifica il fattore ×3 sui primi sei livelli, l'adeguamento del settimo, il ritocco
  contenuto dell'ottavo, la monotonia della curva e che il bottino della prima ondata basti per **un solo**
  livello. **312 passati, 0 falliti.**

---

### [1.53.0] — 2026-08-25 · "Il mercato si sceglie, il portale si vede, l'esperienza costa"

#### 🚪 Il portale EXIT del mercato ora si vede
- `mapgen` piazza l'uscita nella cella **più lontana dal centro**: in una mappa di combattimento ha senso, in
  una **sosta** no — atterri al centro e il portale è fuori schermo. Il mercato ora si dispone da sé
  (`_layoutMarket`): **fabbro a ~4 tile** dal punto di atterraggio, **portale a ~9 dalla parte opposta**.
  Appena arrivi vedi il fabbro; girandoti vedi la via d'uscita.
- La tile `T_EXIT` viene spostata **nella griglia**, non solo in `map.exit`: il client disegna il portale
  scandendo le tile quando riceve la mappa, quindi cambiare solo `map.exit` avrebbe lasciato il bagliore
  vecchio dov'era.

#### 🎯 Il mercato è una destinazione, non una cadenza
- Sparisce la regola "ogni 3 ondate". Il menu di pausa fra un'ondata e l'altra ha ora **due pulsanti**:
  **▶ PROSSIMA ONDATA** e **🔨 VAI DAL FABBRO**. Ci vai quando ti serve, a qualunque ondata.
- **Co-op:** vale la **prima scelta espressa**, coerente con la regola del portale ("il primo che entra decide").
- I pulsanti stanno in `#shopActions`: aggiungere una destinazione futura = un `<button>` in più lì e un
  valore di `dest` in più in `_afterShop()`. **Spazio** resta la scorciatoia per l'ondata successiva.

#### ✦ Esperienza: apertura più dolce, coda molto più dura
- La curva della v1.51 (`2.05^n` uniforme) era ripida **già al secondo livello** — 10 → 21 → 42 quando ancora
  non hai reddito — e comunque troppo mite in fondo. Ora è **spezzata**: i primi 3 livelli sono quasi lineari,
  poi si sale di **2.8× a livello**.

  | Livello | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|
  | v1.51 (base 10) | 10 | 21 | 42 | 86 | 177 | 362 | 742 | 1522 |
  | **v1.53** | 10 | **16** | **22** | 62 | 172 | **483** | **1352** | **3786** |

- Portare **una** statistica al tetto passa da **2.968** a **5.903 XP**, cioè circa **l'intera raccolta di una
  run**. L'albero completo passa da 17.760 a **35.418 XP**. Specializzarsi non è più consigliato: è obbligato,
  e la **COMBO** (moltiplicatore XP fino a ×2.5) diventa la leva che decide quanto puoi permetterti.
- Segnale misurato: i bot dei test, che compravano a caso, ora si fermano quasi sempre al **boss dell'ondata 5**
  invece di superarlo. Sono bot stupidi, quindi è un indicatore di direzione, non un verdetto — ma la direzione
  è quella richiesta.

#### 🧪 Test
- Nuovo **testV153**: destinazioni del menu di pausa, prima-scelta-vince in co-op, distanze di fabbro e portale
  dal punto di atterraggio, unicità della tile EXIT nella griglia, monotonia e severità della nuova curva XP.
  `testV18` e `testV152` aggiornati alla scelta esplicita; i bot dei full-run passano dal fabbro nel 25% dei
  casi. **309 passati, 0 falliti.**

---

### [1.52.0] — 2026-08-25 · "MERCATO: l'Emporio smette di essere un pannello e diventa un luogo"

L'acquisto diretto dell'equipaggiamento a fine ondata — nascosto in v1.51 — è sostituito da una **mappa di sosta**
in cui il mercante è un NPC a cui ci si avvicina, come il Mercante Errante.

#### 🏪 La mappa MERCATO
- Ogni **3 ondate** (`C.MARKET_EVERY`) si entra in una mappa **senza nemici**, col **fabbro dell'equipaggiamento**
  piazzato al **centro**.
- È **INTERSTIZIALE**: non consuma un numero d'ondata. Così la cadenza dei boss (ogni 5) resta intatta e sparisce
  la collisione all'ondata 15 — il mercato la **segue** invece di sostituirla. Ed è il momento giusto: **il 58%
  delle monete di una run arriva dai boss**, quindi la sosta cade quando sei appena diventato ricco.
- Niente **casse** (il 30% è una cassa-mima, cioè un nemico in una stanza che promette sicurezza) e niente
  **Mercante Errante**: quello resta un incontro delle ondate normali, con le sue offerte uniche.
- Si prosegue entrando nel **portale EXIT**: nel mercato è disegnato più grande, verde, con colonna di luce ed
  etichetta leggibile anche col buio della torcia. **Co-op: il primo che entra porta avanti tutti**; timeout
  anti-AFK a 120s solo in multiplayer, come già fa il negozio.
- Uscendo, la mappa viene **rigenerata a forza** (`_forceNewMap`): senza, l'ondata successiva si sarebbe
  combattuta dentro la stanza del fabbro, perché la rigenerazione avviene solo alle ondate dispari.

#### 🔨 Il fabbro dell'equipaggiamento
- I 3 slot (Armatura, Stivali, Arma) si comprano **solo** stando vicino a lui: `buyGear` verifica **fase e
  distanza**, non più solo la fase.
- Render dedicato `_drawGearMerchant`: forgia con carboni che tremolano, incudine con scintille, martello che
  batte. Beacon ambra sempre acceso e marker sulla minimappa.
- Il pannello riusa le carte `.gc` dell'Emporio e si ricostruisce **solo al cambio di offerta o monete** — la
  stessa precauzione del fix v1.34 sul Mercante Nero, che ricreando le card a ogni frame le rendeva invisibili.

#### 🐛 FIX — i mercanti erano invisibili sulla mappa
- `merch` e `merchD` non venivano **mai** copiati dallo snapshot dentro `buildWorld()`: `world.merch` restava
  `null` per sempre, quindi `_drawMerchant` e `_drawDarkMerchant` non venivano **mai** chiamati. Mercante
  Errante e Mercante Nero erano **invisibili** — beacon "sempre visibile" e marker sulla minimappa compresi —
  e li si trovava solo per caso, camminandoci addosso. Ora vengono aggiornati insieme al resto del mondo.

#### 🧪 Test
- Nuovo **testV152**: cadenza interstiziale, assenza di nemici/casse/mercante errante nel mercato, fabbro al
  centro, acquisto negato da lontano e concesso da vicino, apertura/chiusura del pannello per prossimità,
  uscita dal portale con rigenerazione della mappa. `testV18` aggiornato (l'equipaggiamento ora si compra dal
  fabbro) e i bot dei test sanno raggiungere il portale EXIT. **292 passati, 0 falliti.**

---

### [1.51.0] — 2026-08-25 · "Level up rivisto: 1 di 3 carte, dieci poteri nuovi, negozio XP che obbliga a scegliere"

Il momento fra un'ondata e l'altra chiedeva **tre** decisioni al giocatore, ma una sola era davvero una decisione.
Questa versione rimette al centro le **carte potere** e trasforma il negozio XP da rubinetto a scelta.

#### 🎴 Si sceglie 1 potere su 3 (erano 2 dalla v1.10)
- Il catalogo era stato ampliato a 23 poteri **riducendo** contemporaneamente le carte offerte da 3 a 2: catalogo più
  grande e meno pescate significa vedere una frazione sempre più piccola del design. Ora si torna a **3 carte**,
  sempre con **una sola selezionabile**.
- Con la composizione attuale del catalogo, un'estrazione è al 63% *non comune*, 28% *rara*, 9% *epica*: la terza
  carta è ciò che rende probabile vedere almeno qualcosa di raro quando conta.

#### ✨ Dieci poteri nuovi (catalogo da 23 → 33)

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

- Nessuno è un semplice "+X%": ognuno cambia **come** giochi — apri i tank, tieni la distanza, non ti fermi mai,
  ti fai colpire di proposito, chiudi le esecuzioni.
- **Due nuove sinergie** legano il nuovo al vecchio: 🎯 **Cacciatore di Teste** (Colpo di Grazia + Piede di Porco →
  soglia di esecuzione +6 punti) e 🌊 **Onda d'Urto** (Rappresaglia + Aura di Spine → onda molto più ampia).

#### ✦ Negozio XP: da rubinetto a scelta
- **Il problema, in numeri.** La curva era `base × 1.55^n` con livelli **illimitati**. Portare tutte e sei le
  statistiche a Lv.8 costava **3.526 XP**, contro le **~7.528 XP** raccolte in una run intera: si comprava tutto,
  e l'ordine degli acquisti non aveva conseguenze.
- **La correzione.** Curva a `2.05^n` e **tetto di 8 livelli** per statistica. L'albero completo costa ora
  **17.768 XP**: circa il **42%** è alla portata di una run normale, fino a **~84%** giocando la combo (che
  moltiplica l'XP fino a ×2.5). Specializzarsi diventa obbligatorio, e la **combo** smette di essere decorativa.
- Le carte del negozio mostrano ora `Lv.3/8` e diventano **MAX ★** quando la statistica è esaurita.

#### 🪙 Emporio a monete temporaneamente nascosto
- L'Emporio (Armatura / Stivali / Arma) **non compare più** a fine ondata: flag `C.SHOP_GEAR_ENABLED = false`.
  Nulla è stato cancellato — `offerGear`, `buyGear`, le icone e la UI restano al loro posto e si riaccendono
  rimettendo il flag a `true`. Le **monete continuano a cadere** e restano spendibili dai due **mercanti** in mappa.
- Motivo tecnico che rendeva l'Emporio ridondante: comprava quasi le stesse statistiche del negozio XP con una valuta
  diversa (Stivali +5% velocità ≡ Agilità +5% velocità; Arma +8% danno ≈ Potenza +9%).

#### 🎒 Barra dei poteri attivi (HUD)
- Nuova riga di gettoni sopra la barra abilità: mostra ogni potere posseduto con **icona, colore della rarità e
  moltiplicatore** (×2, ×3), più le **sinergie** attive evidenziate. Passandoci sopra compare nome e descrizione.
- Non passa dallo snapshot (che gira 20 volte al secondo): il server invia l'elenco solo **quando cambia**
  (scelta di un potere, sinergia sbloccata, inizio partita) con il nuovo messaggio `C.MSG.BOONS`.

#### 🧪 Test
- Nuovo **testV151**: le 3 carte, la presenza e applicabilità dei 10 poteri, l'assenza di id duplicati, il tetto di
  livello davvero invalicabile, il costo dell'albero completo, l'Emporio che non viene più offerto, il Colpo di
  Grazia che esegue, l'Ultima Occasione che consuma una carica, l'Egida che para una volta sola, e una run con
  **tutti e dieci** i poteri al massimo senza NaN. Aggiornato testV110 (2 → 3 carte). **273 passati, 0 falliti.**
- Nuova suite **`test/client.js`**: smoke test dell'interfaccia con un DOM finto (niente browser). `hud.js` non era
  coperto da nulla, e questa versione lo tocca parecchio. `npm test` ora lancia entrambe le suite.
- `ROSTER.md` ed `ENEMIES.md` non sono stati toccati: questa versione non modifica alcun nemico.

---

### [1.50.0] — 2026-08-25 · "Consolidamento: curva di difficoltà ripristinata, elite tarati, documentazione riallineata"

Versione di **consolidamento**: nessun mostro nuovo. Dalla 1.37 alla 1.49 — tredici versioni — il lavoro è stato
quasi interamente sul **rendering** dei nemici; nel frattempo si era accumulato debito su **bilanciamento** e
**documentazione**. Questa versione lo salda prima di rimettere mano al gameplay.

#### 🌊 Curva di introduzione dei nemici ripristinata (`shared/waves.js`)
- Le comparse **"dal primo stage"** aggiunte in v1.44 (Melma, Bruto) e v1.49 (Beholder) erano **temporanee**:
  servivano a valutare i nuovi sprite, ma sono rimaste nel codice. Risultato: all'ondata 1 il pool conteneva già
  **4 archetipi su 5**, tank tier 2 e debuffer tier 3 compresi, e la rampa di difficoltà era di fatto sparita.
- Nuova rampa — un archetipo nuovo ogni 1-2 ondate, coerente coi **tre pilastri** descritti in `ROSTER.md`:

  | Ondata | Entra nel pool | Archetipo |
  |---:|---|---|
  | 1 | 🟢 Zombie Putrido | sciame mischia |
  | 2 | 🟢 Melma Corrosiva | blob acido ravvicinato |
  | 3 | 🟣 Negromante | caster / evocatore |
  | 4 | 🟠 Troll delle Caverne | tank con slam ad area |
  | 6 | 👁️ Beholder | debuffer, dopo il primo boss |

#### ⚔️ Moltiplicatore PV degli elite reso PER-NEMICO (`def.eliteHp`)
- Il `2.4x` fisso sugli elite era tarato sui nemici da ~80-100 PV. Applicato ai più robusti produceva mostri
  fuori scala: un **Troll elite** all'ondata 4 arrivava a **~845 PV** contro l'arma iniziale.
- Ora ogni def può dichiarare `eliteHp` (default invariato `2.4`): **Troll `1.5`** (~528 PV all'ondata 4),
  **Beholder `1.9`**. Tutti gli altri nemici mantengono esattamente il comportamento precedente.

#### 📚 Documentazione riallineata
- **`ROSTER.md`** era il più arretrato (fermo alla 1.47): mancavano **Melma Corrosiva** e **Beholder** dalla tabella
  comparativa, il Troll era ancora chiamato "Bruto delle Caverne" e descritto come puppet (dalla 1.47 è uno
  **sprite sheet**), e l'intestazione dichiarava "tutti i nemici d'ondata usano il RENDER PUPPET". **Riscritto.**
- **`README.md`**: il titolo diceva ancora `v1.28.1`; sezione **Architettura** aggiornata (mancavano `public/assets`
  e `tools/`, cioè proprio le cartelle nate col metodo puppet).
- **`ENEMIES.md`** §12: la **checklist di release** conteneva ancora il punto *"ripacchettizzare come `.txt`
  (zip mascherato)"* — il workflow precedente al repository git. Sostituito col **commit**; aggiunti `ROSTER.md`
  ed `ENEMIES.md` fra i documenti da aggiornare (ROSTER **non era in lista**: è la causa del suo arretramento).
- Aggiunta alla checklist la **trappola degli id**: `skeleton` = Zombie Putrido · `cave_brute` = Troll ·
  `occhio` = Beholder.

#### 🧪 Test
- Nuovo **testV150**: verifica la rampa ondata per ondata, la sua **monotonia** (nessun archetipo che sparisce
  crescendo di ondata) e il tetto PV degli elite tank. Aggiornati testV142 / testV145 / testV149, che asserivano
  la vecchia comparsa "dal primo stage". **256 passati, 0 falliti.**

---

### [1.49.0] — 2026-08-11 · "Beholder: l'Occhio Tiranno torna nel roster (Sguardo multi-raggio)"

##### 👁️ Ritorna il BEHOLDER (id `occhio`)
- Reintrodotto l'**Occhio Vagante** come **BEHOLDER**: bulbo oculare fluttuante con **eye-stalks** e **tentacoli
  tutt'intorno**, aura emissiva magenta, iride che segue e pupilla che si dilata in attacco. Vista frontale (`_eyeF`).
- **Attacco = SGUARDO** (niente proiettili): se entri nel suo **campo visivo** (cono attorno allo sguardo, in
  gittata e con **LOS libera**) subisci un **debuff** che si rinnova finche resti "sotto gli occhi".
- **EYESTALKS CHE RUOTANO (novita):** il Beholder **alterna ciclicamente** i tre tipi di sguardo (multi-raggio)
  ogni ~4s — 🟠 **weaken** (attacco indebolito) · 🔵 **slow** (velocita ridotta) · 🟣 **sunder** (meno difesa) —
  e il **fascio si ricolora** in base al tipo attivo.
- **Stat:** tier 3, **130 PV**, gittata sguardo **340**, danno contatto 16, IA **gazer** (orbita a distanza).
  Aggiunto a `ORDER` e al **pool dal primo stage** (per valutazione), peso basso.

##### 🎨 Render RASTER PUPPET (metodo puppet, non piu vettoriale)
- Il Beholder usa il **RENDER PUPPET raster** (illustrazione ritagliata → manifest + profilo), come ghoul/negromante/
  bruto/melma: nuovo asset `public/assets/enemies/beholder/body.png` + `beholder.json` (slicer `tools/slice_beholder.py`).
- Render **dedicato** `_beholderPuppet`: corpo billboard che fluttua e "respira", **IRIDE centrale che SEGUE** il
  bersaglio e **pupilla che si dilata** in attacco, **eyestalks che avvampano** nel colore dello sguardo attivo,
  **edge-glow** magenta pulsante. Morte dedicata (l'occhio implode e svanisce). La meccanica IA (gazer) resta.

##### 🧪 Test
- Nuovo **testV149** (Sguardo debilitante nel campo visivo + eyestalks che ruotano) e testV139 aggiornato
  (occhio non e piu "rimosso"): **246 passati, 0 falliti**.

---

### [1.48.0] — 2026-08-10 · "Fix Troll sprite-sheet: cammina davvero, non fluttua, ombra ai piedi"

#### 🐛 Fix animazione & grounding dello sprite-sheet
- **Camminata che non partiva:** i mostri **lenti** (Troll, speed 60 ≈ 1px/frame; in vagabondaggio anche 0.5px)
  restavano in **idle mentre scivolavano** perché la soglia del rilevamento movimento (`pv.mv > 0.95`) era troppo alta.
  Ora le soglie con **isteresi** sono **0.28/0.10**: il Troll passa correttamente allo stato **walk** (verificato: 60px/s
  e 30px/s → animazione di camminata; 0px/s → idle).
- **"Fluttua" + ombra troppo distante:** lo sprite-sheet ancora i **piedi** su `(m.x, m.y)`, ma riceveva anche
  l'**ombra generica** disegnata a `y + rr·0.75` (~28px **sotto** i piedi) → sembrava galleggiare sopra la sua ombra.
  Ora lo sprite-sheet è **escluso** dall'ombra generica e disegna una **propria ombra sfocata esattamente ai piedi**:
  il Troll è ben "piantato" a terra, niente più fluttuazione.

#### 🧪 Test
- Nessuna regressione: **234 passati, 0 falliti**.

---

### [1.47.0] — 2026-08-10 · "Troll delle Caverne: SPRITE SHEET animato (idle/walk/attack) al posto del puppet"

#### 👹 Nuovo render: SPRITE SHEET frame-by-frame (stile 2.5D "da sala")
- Il **Troll delle Caverne** (ex Bruto, id `cave_brute`) non è più un puppet a pezzi: ora usa un **vero sprite sheet
  animato** disegnato a mano — **3 fogli 5×5 @256px** (idle, walk, attack). La camminata è **naturale** (nessun rig da
  tarare) e l'attacco è una **martellata** completa (25 frame).
- **Nuovo motore SPRITE SHEET** nel renderer (`SHEETS[key]` + `_drawSheet`): sceglie l'animazione dallo stato
  (idle/walk/attack), il frame dal tempo (loop, con sfasamento per‑nemico) o dalla fase d'attacco (one‑shot), ritaglia
  la cella dalla griglia e la disegna **ancorata ai piedi** con **mirror L/R** per la direzione. Hit‑flash e ombra inclusi.
- **Attacco pilotato dall'evento slam:** parte al `slam_wind` (con eid) e i 25 frame coprono l'intera martellata; il
  **danno ad area** e la scossa scattano al **72%** dello swing (`slamHit`) per coincidere con l'impatto a schermo.
- Il Troll mantiene l'IA v1.43 (vede/insegue, vagabondaggio, anti‑incastro). Rinominato in "Troll delle Caverne".

#### 🧪 Test
- Nuovo `testV147` (il Troll ora è `sheet:'troll'`, wind‑up + danno d'impatto): **234 passati, 0 falliti**.

---

### [1.46.0] — 2026-08-10 · "Bruto: camminata senza tremore + parti ritagliate meglio · Melma in vista TOP-DOWN"

#### 👹 Bruto — via il "tremore" (camminata rifatta) + nuovi ritagli
- **Camminata rifatta** per eliminare l'effetto "parkinson": **un solo dondolio lento e ampio**, braccia enormi che
  oscillano **in sincronia** (rimosso il rollio nervoso delle spalle), **sollevamento del piede morbido** (mezzo‑coseno,
  niente scatti) e **fase sempre continua**.
- **Anti‑sfarfallio:** il rilevamento movimento ora usa **isteresi + forte smoothing**. I mostri **lenti** (come il Bruto,
  che sfiorava la soglia) non alternano più di continuo idle↔camminata → niente più tremolio.
- **Parti ritagliate meglio:** sostituiti i 6 PNG del Bruto con i tuoi ritagli puliti (stesso manifest, cuciture migliori).

#### 🟢 Melma Corrosiva — ora in vista TOP‑DOWN (pozza fluo)
- La Melma non è più un blob "in piedi": è una **pozza fluorescente vista dall'alto** che **striscia** sul pavimento.
  Render dedicato `_slimePuddle` (niente billboard/ombra): **wobble gelatinoso**, **stiramento** nella direzione di
  marcia, leggero ondeggio e **edge‑glow verde** pulsante che avvampa in attacco/quando colpita; **bolle acide** che salgono.
  Morte: la pozza **si restringe e svanisce**. Invariata la meccanica (striscia lenta + **sputo di bolle d'acido** ad alto danno).

#### 🧪 Test
- Suite aggiornata (Melma top‑down): **226 passati, 0 falliti** · boss‑navigabilità **2100/2100 (100%)**.

---

### [1.45.0] — 2026-08-10 · "Melma Corrosiva: STRISCIA lenta + SALTA e SPUTA acido · sprite senza bocca + edge-glow"

#### 🟢 Movimento rifatto: la Melma STRISCIA (niente più saltelli)
- In movimento la Melma non fa più su‑e‑giù: ora **striscia** con un'onda **peristaltica** (si stira in avanti →
si contrae) **restando sempre a terra**. Movimento **lento** (velocità 66 → **52**).
- Il **SALTO** avviene **solo durante l'attacco** (unico momento in cui si stacca da terra).

#### 💥 Attacco: salta e SPUTA bolle d'acido ad ALTO danno (ravvicinato)
- Nuova IA **blob**: la Melma si avvicina strisciando e, **quando è vicina** (in gittata, con linea di vista libera),
**SALTA** e **sputa un ventaglio di bolle d'acido** ad **alto danno** (`acidMult 1.8`, 3 bolle, `atkRange 150`).
Il contatto ravvicinato fa comunque danno. Nuovo evento `acid` (salto + FX di sputo). Se non ti vede, **vaga**.

#### 🎨 Sprite & effetti
- Nuovo sprite **senza bocca** e senza nucleo centrale (solo occhi), con **bagliore verde sul bordo** (edge‑glow) che
maschera l'effetto ritaglio. **Occhi che si illuminano nella DIREZIONE DI MOVIMENTO** (più intensi in marcia, pupilla
spostata in avanti). Restano **aura verde** pulsante e **bolle acide** che salgono.

#### 🧪 Test
- `testV145` aggiornato (IA blob, sputo acido ostile ad alto danno, lentezza, primo stage): **226 passati, 0 falliti**.

---

### [1.44.0] — 2026-08-10 · "Melma Corrosiva (squash & stretch) + Bruto affinato (passo & slam) + entrambi nel primo stage"

#### 🟢 Nuovo nemico: Melma Corrosiva (render PUPPET, squash & stretch)
- Quarto puppet: un **blob acido** reso con **UN solo pezzo** animato in **SQUASH & STRETCH** (scala non uniforme
  attorno alla base), non a giunti. Idle: **gelatina che respira** (jiggle). Movimento: **saltello** — si **appiattisce**
  a terra (largo/basso) e si **allunga** in aria (stretto/alto). Attacco: si **comprime** (carica) poi **schizza** in avanti.
- **Effetti grafici** (come richiesto): **AURA VERDE** pulsante marcata (`def.aura`), **nucleo verde acido** che pulsa
  al centro (man.core), **occhi che avvampano** al colpo, e **bolle acide** che salgono (`def.bubbles`).
- Il motore puppet ora supporta lo **squash & stretch** (`pose` può restituire `sx/sy`), riusabile da tutti i puppet.
- **Stat:** tier 1, 90 PV, lento (66), danno 12. Nel pool **dal primo stage**.

#### 👹 Bruto — passo e slam affinati
- **Camminata: il piede si SOLLEVA da terra** (nuovo `WALK.lift`) e la **falcata è più ampia** (`leg` 22→34): ora si
  "muovono i piedi", il passo è ben leggibile.
- **SLAM più impattante:** affondo del corpo più **profondo e deciso** (bob/tilt/lungeX aumentati) e FX di **schianto
  potenziati** — **doppia onda d'urto** + **anello di polvere**, **burst di detriti**, **hit-stop** e **scossone più forte**.

#### 🧪 Test
- Nuovo `testV144` (Melma puppet, aura/bolle, slime+bruto nel primo stage): **221 passati, 0 falliti**.

---

### [1.43.0] — 2026-08-10 · "Bruto ridisegnato (camminata lumbering + slam overhead), vagabondaggio & anti-incastro"

#### 👹 Bruto delle Caverne — movimento e attacco rifatti
- **Camminata distinta dallo zombie:** niente più braccia in grande opposizione (troppo simili allo zombie). Ora è
  un **incedere lumbering** da ogre: le braccia **dondolano poco e in sincronia** (knuckle-drag), con **grande rollio
  delle spalle**, **waddle laterale marcato**, busto **proteso in avanti** e cadenza più lenta.
- **Attacco = SLAM overhead:** quando ti **VEDE** (campo visivo `sightRange` + linea di vista) ed sei a tiro, il Bruto
  **ALZA entrambi i pugni sopra la testa** (wind-up telegrafato) e li **SCHIANTA a terra** — danno ad **AREA** con
  **forte respinta** (ti scaglia via). Il telegrafo (~0.7s) ti dà il tempo di schivare. Nuovi parametri: `slamWind`,
  `slamKnock`, `slamRadius 104`, `atkRange 70`.

#### 🧭 Vagabondaggio quando il nemico non ti vede
- Se un nemico **non ti vede** (fuori dal `sightRange` o senza linea di vista) e non ha una posizione recente da
  investigare, ora **VAGA a caso** per la mappa (bersagli casuali raggiungibili) invece di puntarti sempre come un
  laser. Quando ti individua ti insegue; se ti perde di vista, **investiga** l'ultima posizione nota e poi torna a
  vagare. Applicato a Zombie e Bruto (perceive/investigate/wander in `ai.js`).

#### 🧱 Anti-incastro per TUTTI i nemici (boss compresi)
- Nuovo **rilevatore di incastro** per ogni mostro: se prova a muoversi ma **non avanza** (wedge in un angolo, pur non
  essendo dentro un muro) parte un **recupero** che lo fa **scivolare** nella direzione libera più utile; se persiste,
  un **piccolo salto** verso la cella libera più vicina. `_unstuck` potenziato. Verificato: **0 mostri/boss** restano
  dentro un muro dopo stress con tutti i boss in campo; boss-navigabilità mappe **2100/2100 (100%)**.

#### 🧪 Test
- Nuovo `testV143` (vagabondaggio, wind-up slam, anti-incastro con boss): **213 passati, 0 falliti**.

---

### [1.42.0] — 2026-08-10 · "Bruto delle Caverne (tank PUPPET con slam ad area) + artwork bestiario"

#### 👹 Nuovo nemico: Bruto delle Caverne (render PUPPET)
- Terzo puppet e **terzo pilastro** del roster: un **tank da mischia** enorme e ingobbito, scomposto in **6 pezzi**
  (testa con zanne, torso con spallacci d'osso, **due braccia enormi**, due gambe tozze) + overlay vettoriale
  (**occhi ambra** pulsanti). Accento **ambra** per distinguerlo dal verde zombie e dal viola negromante.
- **Animazione delle BRACCIA** (la sua firma, curata come richiesto): pivot alla **spalla** → grandi **dondolii in
  opposizione** durante la camminata pesante; **SLAM ad area in due tempi** (carica: si erge coi pugni cocked
  all'indietro → schianto: tutto il busto affonda in avanti/giù, i pugni guidano il colpo) con onda d'urto e respinta.
- **Stat (tank):** tier 2, **220 PV**, molto lento (**vel. 60**), raggio 24, **danno 28**, `ai 'brute'`, slam raggio 96.
  Entra nel **pool dall'ondata 4**, peso basso (raro ma temibile). Eredita hit-reaction, morte con crollo dei pezzi,
  tint elite (ambra) e ombra dinamica del motore puppet.
- **Client:** l'evento `slam` ora porta l'eid → il Bruto **riproduce l'animazione** dello slam (prima non animava).

#### 🖼️ Artwork del bestiario nel progetto
- Aggiunti in `public/assets/art/`: **`roster_overview.png`** (scheda illustrata del bestiario) e
  **`cave_brute_concept.png`** (concept del Bruto). Aggiornata la scheda **`ROSTER.md`** con il Bruto implementato
  (stat reali) e i riferimenti agli artwork.

#### 🟣 Incluso: sfere del Negromante +30% (da v1.41)
- Ri-applicata la taratura approvata: `darkmage.projSpeed` **250 → 325** (le sfere debilitanti sono più difficili
  da schivare). Era andata persa nel pacchetto v1.41.

#### 🧪 Test
- Nuovo `testV142` (roster, tank, slam ad area con eid, pool ondata 4): **206 passati, 0 falliti**.

---

### [1.40.0] — 2026-08-10 · "Taratura campo visivo del Negromante"

- **Cono visivo più stretto/focalizzato:** `fov` da **0.62 → 0.55** rad (cono totale **~71° → ~63°**). Premia il
  fiancheggiamento: è più facile restare fuori dalla sua vista aggirandolo.
- **Rotazione testa più lenta/deliberata:** `turn` ora **1.7 rad/s** (~97°/s, prima ~120°/s), reso **parametro
  esplicito** della def (`darkmage.turn`) così è tarabile in un unico punto. Telegrafa meglio e concede una finestra
  per rompere la linea di vista.
- Invariati `sightRange 360`, curse e tetto evocazioni. Test: **193 passati, 0 falliti**.

---

### [1.39.0] — 2026-08-10 · "Negromante PUPPET + motore puppet generico + migliorie animazioni/effetti"

#### 🧙 Nuovo nemico: Negromante (render PUPPET)
- Secondo puppet del gioco (mago incappucciato con bastone e orbe), scomposto in **5 pezzi** (cappuccio/testa,
  torso, veste a campana, braccio-bastone, mano ossuta) + overlay vettoriale (**occhi viola** + **orbe** che divampa in cast).
- **Fluttua** (niente camminata), con veste che ondeggia a pendolo; **attacco/cast in due tempi** (alza il bastone → proietta).
- **IA:** tiene la distanza (kiting), la testa **ruota lentamente** verso il bersaglio → il suo **CAMPO VISIVO** (cono fov)
  insegue con ritardo. **Spara SFERE DEBILITANTI** (curse: riduce danno e velocità del colpito) **solo** quando il bersaglio
  è **dentro il cono**, in gittata e con linea di vista libera. Un **cono-telegrafo** fioco si accende quando ti individua.
- **Evoca ZOMBI MINORI** (nuovo `zombie_mini`, puppet ghoul in miniatura) fino a un **massimo di 4** (minionCap):
  evoca solo per rimpiazzare i caduti. Entra nel pool ondate **dall'ondata 3**.

#### 🧩 Motore PUPPET generico (refactor)
- Astratto in `PUPPETS[key]` (registry asset) + `PROF[key]` (profilo animazione): aggiungere un nemico puppet ora è
  **"manifest + profilo"**. `_ghoulPuppet` → `_puppet(key, …)` generico; nuovo `_puppetDeath(key, …)`.

#### ✨ Migliorie animazioni & effetti (a tutti i puppet)
- **Hit-reaction del corpo:** al colpo il mostro fa uno **squash** verticale + piccolo **rinculo** all'indietro (oltre agli occhi che avvampano).
- **Morte PUPPET dedicata:** i pezzi **crollano** (gambe che cedono, testa che rotola, veste che si accascia) con dissolvenza e occhi che si spengono.
- **Inclinazione nel movimento:** il corpo si **inclina** leggermente nella direzione di marcia (più "presenza").
- **Ombra dinamica:** l'ombra a terra **si allunga** e segue la direzione del movimento/affondo.
- **Varianti ELITE:** i pezzi vengono **ritinti** (ctx.filter) per distinguere gli elite a colpo d'occhio.

#### 🧪 Test
- Suite aggiornata (nuovo `testV139`, roster + tetto evocazioni + campo visivo): **193 passati, 0 falliti**.

---

### [1.38.0] — 2026-08-10 · "Occhi che avvampano quando lo zombie è colpito · via il cerchio verde"

#### 👁️ Occhi verdi che avvampano al colpo (feedback di danno)
- Quando lo Zombie Putrido (puppet) viene **colpito**, gli **occhi verdi avvampano** con un lampo luminoso
  (pulse e raggio del glow aumentati per la durata dell'hit-flash). Sostituisce il flash bianco che il puppet
  raster non poteva mostrare. Anche **di spalle**, un colpo produce un lampo verde sulla nuca.

#### 🟢 Rimosso il "cerchio verde" attorno al nemico
- Eliminato il **disco verde** che compariva attorno allo zombie quando era **avvelenato** (indicatore veleno):
  ora il veleno si legge **solo** dalle piccole particelle verdi che salgono.
- Per i **puppet** l'**alone emissivo** generico è stato reso **molto più tenue e stretto** (niente più anello
  verde evidente); resta solo un filo di visibilità nel buio. L'alone pieno resta invariato per boss/elite.

#### 🧪 Test
- Nessuna regressione: **190 passati, 0 falliti**.

---

### [1.37.0] — 2026-08-10 · "Roster essenziale: SOLO lo Zombie Putrido (render PUPPET), attacco carica→colpo & ombra a terra"

#### 🧟 Un solo nemico: lo Zombie Putrido (PUPPET) sostituisce il vettoriale
- **Rimossi tutti gli altri nemici vettoriali** dal pool ondate: **Negromante**, **Spettro** e **Occhio Vagante**
  escono da `MONSTERS`, dall'`ORDER` e da `poolForWave`. Il bestiario d'ondata riparte da **un solo archetipo**.
- Lo **Zombie Putrido** (id `skeleton`, così boss/summon restano compatibili) ora è reso con il **RENDER PUPPET**
  (raster ibrido: 6 pezzi PNG + overlay vettoriale) e **sostituisce** il vecchio zombie vettoriale (shape `zombie`).
  Stat riviste: 78 PV, vel. 100, raggio 18, danno 14.

#### 🎞️ Nuova animazione d'ATTACCO in due tempi (carica → colpo)
- L'attacco non è più un semplice "protendersi": ora fa una **carica** (braccia alzate/indietro, busto reclinato,
  testa su) seguita dal **colpo** (braccia scagliate in avanti, **affondo del corpo in avanti**, testa protesa,
  spinta sulle gambe) e recupero. Guidato dall'evento `melee` esistente.

#### 🌑 Ombra a terra & maggiore realismo
- Aggiunta una **piccola ellisse nera sfocata alla base** dei piedi (Gaussian blur), che si **stringe** quando il
  passo solleva il corpo e **segue l'affondo** in attacco: il mostro appare **radicato sulla mappa**, non "appiccicato".
- La vecchia ombra generica dei mostri è **disattivata per i puppet** (niente doppia ombra).

#### 🚶 Camminata ritarata (più aggressiva e pesante)
- **Falcata più ampia** (`leg` 26→37, `arm` 20→26) e **cadenza più lenta** (`cad` 1.35→1.05), con più ondeggio e
  waddle: incedere da bruto. Costanti raggruppate in `WALK` dentro `_ghoulPuppet`.

#### 🧪 Test
- Suite aggiornata al nuovo roster: **190 passati, 0 falliti**.

---

## [1.35.0] — 2026-08-09 · "Troll rimosso · Mercante Nero riempito · Occhio Vagante: lo Sguardo"

### 🗑️ Troll delle Caverne rimosso
- Il **Troll** è stato **rimosso dal roster** (sprite non soddisfacente): tolto da `MONSTERS`, dall'`ORDER`
  del bestiario e dal pool delle ondate. Il pool passa a **4 archetipi** (zombie, spettro, negromante, occhio).

### 🖤 Fix Mercante Nero "vuoto"
- **Sintomo:** il box del Mercante Nero appariva **centrato ma senza offerte** (finestra vuota).
- **Causa:** `HUD._renderMerchant()` viene richiamato a **ogni snapshot** (~20/s) per aggiornare le monete e
  faceva `innerHTML=''` **ricreando le card** ogni frame. Le card del Nero hanno l'animazione d'ingresso
  `darkCardIn` (opacity 0→1 con delay): ricreandole in continuazione restavano di fatto a **opacity 0**.
- **Soluzione:** le card ora vengono **ricostruite solo quando cambia l'offerta** (firma degli id); a ogni
  frame si aggiorna **solo** il conteggio monete e lo stato "acquistabile". Nessun restart dell'animazione.

### 👁 Occhio Vagante — nuovo attacco "SGUARDO" (gaze debuff)
- **Niente più proiettili:** l'Occhio ora **non spara**. Il suo attacco è lo **Sguardo**: se il giocatore entra
  nel suo **campo visivo** (cono attorno alla direzione dello sguardo, entro gittata e con **LOS libera**) subisce
  un **debuff** che si rinnova finché resta "sotto gli occhi".
- **Tre tipi di sguardo** (uno fisso per ogni occhio, assegnato allo spawn):
  - 🟠 **weaken** — *attacco indebolito* (danno inflitto ridotto)
  - 🔵 **slow** — *velocità ridotta*
  - 🟣 **sunder** — *meno difesa* (danni subiti aumentati)
- **Grafica:** **sprite ridotto del 20%**, **tentacoli disposti tutt'intorno** al bulbo (a raggiera, ondeggianti),
  **cono/fascio dello sguardo** colorato per tipo e **aura tratteggiata** sul giocatore mentre è debuffato.
- IA `gazer` (sostituisce `strafer` per l'occhio): continua a fluttuare orbitando a distanza ("vagante").

---

## [1.33.0] — 2026-08-09 · "Mercante Nero: box centrato e cliccabile (fix definitivo)"

### 🖤 Fix Mercante Nero
- Il box con le 3 offerte del **Mercante Nero** ora appare **esattamente al centro dello schermo**,
  non più troppo in basso e **senza sovrapporsi alla barra delle abilità/oggetti**.
- **Causa risolta:** il centraggio dipendeva dallo stesso `transform` usato anche dall'animazione di
  scala; qualsiasi interferenza faceva ricadere il pannello sulla posizione base (`bottom:96px`).
- **Soluzione robusta:** centraggio disaccoppiato dal transform tramite `inset:0 + margin:auto`
  (con `!important`), mentre l'animazione usa ora **solo `scale()`** attorno al centro. Il box resta
  centrato in ogni condizione.
- Aggiunti `max-height:88vh` + `overflow:auto` per sicurezza su schermi piccoli.
- **Cliccabilità verificata:** `pointer-events:auto` su pannello e card, `z-index:36` (il più alto
  in-game: i menu a schermo intero sono nascosti durante la partita), overlay a `box-shadow` che non
  intercetta i click. Le 3 offerte restano selezionabili col mouse.

---

## [1.32.0] — 2026-08-09 · "Bestiario ampliato: Spettro & Occhio Vagante, Troll rifinito, Mercante Nero al top"

### 👻 Nuovo nemico — SPETTRO
- **Sprite etereo/translucido** in vista frontale: cappa spettrale che sfuma in **code ondulate**, scie/wisp
  emissive, artigli protesi e **occhi ardenti**. Corpo con alfa animata (respiro spettrale).
- **IA `wraith`** (nuova): avanza rapido in mischia e periodicamente **"sfasa" (phase-blink)** verso il
  bersaglio, riemergendo alle sue spalle **attraversando gli ostacoli**. Breve stordimento dopo il blink.
- Stat: tier 2, 92 PV, veloce (134), 19 dmg, mischia. Entra nel pool dall'**ondata 2**.

### 👁️ Nuovo nemico — OCCHIO VAGANTE
- **Sprite bulbo oculare** fluttuante con **eye-stalks** superiori e **tentacoli** inferiori, aura emissiva,
  vene rosse, **iride che segue** e **pupilla che dilata in attacco**, palpebre carnose a mandorla.
- **IA `strafer`**: orbita a distanza e scaglia **raggi arcani**. Stat: tier 3, 118 PV, 15 dmg, gittata 320.
  Entra nel pool dall'**ondata 4**.

### 🪓 Troll — sprite rifinito
- Confermata la resa v1.32 in vista frontale: braccia massicce **senza mani/artigli**, occhi **rossi**,
  niente fascia-occhi né zanne (non è un vampiro), passo e respiro animati.

### 💀 Mercante Nero — restyle "al top"
- Figura incappucciata più curata: **veste con gradiente**, **bordo runico pulsante**, **spalle a punta
  bordate**, **cappuccio definito**, volto-teschio con **occhi ardenti viola** e **mani ossute** che
  presentano la merce. Beacon a **doppia colonna** (viola + cremisi) e anello pulsante per individuarlo.

### 🧟 Pool ondate — 5 archetipi
- Pool aggiornato a **zombie · spettro · negromante · occhio vagante · troll** con sblocco progressivo.

### ✅ Qualità
- Suite: **177 test automatici, 0 falliti**.

---

## [1.31.0] — 2026-08-09 · "Ampolla della salute, Troll anticipato e Mercante Nero al centro"

### 🧪 HUD — Ampolla dei Punti Salute + Vite (a fianco della barra abilità)
- **Nuovo indicatore scenografico**: i **punti salute** ora sono mostrati come un'**ampolla/boccetta** di vetro
  che si riempie di liquido rosso in base alla percentuale di HP, con il **numero PV** al centro e il totale sotto.
- Sotto l'ampolla una **fila "VITE"** con i cuori corrispondenti alle vite rimanenti.
- Il gruppo è stato **spostato a fianco della barra abilità** ed è **molto più grande** di prima.
- **Effetto low-HP**: sotto il 30% il liquido diventa rosso acceso e l'ampolla **pulsa**.
- 🔴 **Ampolla rossa**: il liquido usa ora una gradiente **rosso vivo** (`#ff2e2e → #e01020 → #8a0410`) con superficie
  rossa più marcata; il low-HP passa al **rosso puro** (`#ff1520`).

### 🕯️ Mercante Nero — animazione d'ingresso
- La finestra `dark` ora **compare con un'animazione** (`darkMerchIn`): sale in scala con un piccolo overshoot e un
  leggero *rotate*, mentre l'**aura viola/cremisi pulsa** (`darkMerchAura`) e il titolo ha un **glow ritmico**
  (`darkHeadGlow`). Le tre carte entrano **sfalsate** dal basso (`darkCardIn`).
- I vecchi chip `❤️ hp/mhp` e `vite` sono stati **rimossi** dal blocco statistiche in basso a destra
  (restano uccisioni 💀, XP ✦ e monete 🪙).

### 👹 Troll dall'ondata 3 (prima era dall'ondata 5)
- Il **Troll delle Caverne** entra ora nel pool delle ondate a partire dalla **wave 3** (`poolForWave`).

### 🕯️ Mercante Nero al centro dello schermo
- La finestra del **Mercante Nero** (variante `dark`) ora compare **centrata verticalmente e orizzontalmente**
  con un leggero ingrandimento e un **velo scuro** di sfondo per farla risaltare come una scelta importante.
  Il **Mercante Errante** normale resta ancorato in basso.

---

## [1.30.0] — 2026-08-09 · "Bestiario essenziale: Zombie, Negromante, Troll in vista frontale"

### 👾 Roster ridotto a 3 archetipi (grigio molto molto scuro)
- **Rimossi tutti gli altri nemici**: via `orc`, `assassin`, `wyvern`, `lich` e il `dragon` regolare dal
  bestiario giocabile. Restano **solo tre** mostri d'ondata: **Zombie Putrido** (`skeleton`), **Negromante**
  (`darkmage`) e **Troll delle Caverne** (`troll`).
- 🪤 **Mimic MANTENUTO come cassa**: la **Bestia Mimica** (`mimic`) resta nel gioco **esclusivamente come cassa-mima**
  e nella modalità **TESORO**. È fuori dal pool delle ondate (`weight: 0`, flag `chestOnly`), quindi non appare mai
  tra i nemici normali ma solo quando una cassa si rivela un mimic. Recuperata la sua def (150 HP, IA `ambush`, sprite
  a forziere top-down): aprire una cassa-mima ora evoca di nuovo un **vero mimic** e non un ripiego.
- 🎨 **Nuova palette**: i tre mostri d'ondata ridipinti in **grigio molto molto scuro** (`#2c2e2c` / `#26272c` /
  `#2e302d`), con **occhi/accento luminosi** a dare personalità (zombie verde acido, negromante viola, troll ambra).

### 🖼️ Sprite in VISTA FRONTALE (billboard) — nuovo stile dark-cartoon
- I tre mostri non ruotano più con la direzione (top-down): sono **billboard frontali** che **guardano la camera**,
  si **specchiano** in orizzontale verso il movimento e mostrano il **dorso** quando si allontanano verso l'alto.
- 🧟 **Zombie**: corpo ingobbito, braccia penzolanti con mani ad artiglio, occhiaie nere con bagliore, **mascella che
  si spalanca** in attacco, ferite e punti di sutura.
- 🧙 **Negromante**: **veste a campana** con orlo ondeggiante e rune luminose, mantellina/colletto, **cappuccio-vuoto**
  con occhi ardenti, **cappello a punta** a tesa larga e **bastone con orbe** che divampa durante il cast.
- 👹 **Troll**: **torso a masso** ingobbito, **braccia lunghissime** con pugni enormi e artigli che sfiorano il suolo,
  gambe tozze, **zanne** e occhi ambra; alza il pugno per lo **slam**.
- ⚙️ Nuove routine `_front` / `_zombieF` / `_necroF` / `_trollF` nel `renderer.js`, con flag `front: true` sul def del
  mostro. La morte usa un **collasso frontale** dedicato (niente più rotazione).

### 🌊 Ondate & bilanciamento
- `poolForWave` semplificato al nuovo trio: **Zombie** (base, peso 40), **Negromante** (dall'ondata 3, peso 16),
  **Troll** (dall'ondata 5, peso 9). Il **mimic non è nel pool** (compare solo dalle casse). I boss restano invariati
  e continuano a evocare zombie.

### 🧪 Test
- **175 passati, 0 falliti** (`node test/simulate.js`).

---

## [1.29.0] — 2026-08-09 · "Negromante: proiettili in vista, evocazioni al buio"

### 💀 IA del Negromante ridisegnata (nuovo comportamento `necromancer`)
- Il **Negromante** (`darkmage`) ora adatta la tattica alla **linea di vista** verso il bersaglio:
  - **Se sei nel campo visivo** (LOS libera **e** entro gittata), lancia **proiettili magici** — colpo singolo con
    ogni terzo tiro a **ventaglio (3 proiettili)** — mantenendo le distanze (kiting) come prima.
  - **Se sei nascosto** (nessuna LOS), **evoca scheletri** a cadenza (`summonCount: 2` ogni `summonCd: 8s`) e
    **avanza** verso la tua ultima posizione per **stanarti** e riguadagnare la linea di tiro.
- ⚙️ Nuovi parametri sul def `darkmage`: `summon: 'skeleton'`, `summonCd: 8`, `summonCount: 2`, `ai: 'necromancer'`.
- 🎨 L'anello dell'evento `summon` è ora **color-aware**: l'evocazione del Negromante appare nel suo **viola** (`projColor`)
  invece del ciano del Lich (client `main.js`, evento `summon` con campo `c`).
- 🧪 Il vecchio comportamento generico `caster` resta nel codice ma non è più usato da nessun mostro.
- 🧪 Test: **180 passati, 0 falliti**.

## [1.28.1] — 2026-08-08 · "Assassino d'Ombra ridisegnato"

- 🗡️ Nuovo sprite per l'**Assassino d'Ombra** (shape `assassin`), nello stile dark-fantasy vettoriale:
**mantello a freccia** rivolto in avanti, **doppie lame** (ai lati a riposo, incrociate in avanti durante l'attacco),
**cappuccio a punta**, viso in ombra con **occhi magenta affilati** e una **scia di fumo/ombra** dietro che
sottolinea la sua agilità. Lo swing d'attacco è pilotato dall'evento `melee` già esistente (AI `flanker`).
- 🧪 Test: **180 passati, 0 falliti**.
- ℹ️ Nota: la proposta del **Troll** è stata scartata (nessuna modifica al Troll in questa release).

## [1.28.0] — 2026-08-08 · "Maledizione del Negromante + cunicoli a prova di boss"

### 💀 Maledizione del Negromante (danno + indebolimento)
- Gli incantesimi del **Negromante** ora, oltre a fare danno, **maledicono** il bersaglio: per **4,5s** il giocatore
è **indebolito** — danno inflitto **−40%** e velocità **−20%** (costanti `CURSE_TIME`, `CURSE_DMG_MULT`,
`CURSE_SPEED_MULT`).
- Compare la **notifica "💀 SEI STATO MALEDETTO"** (banner viola + floater), con **aura viola** e volute attorno al
personaggio finché dura l'effetto. Nuovo flag `cu` nello snapshot; evento `cursed` gestito dal client.
- Il flag viaggia sul proiettile (`curse`) partendo dalla def del mostro (`darkmage.curse = true`), quindi è
riutilizzabile per futuri lanciatori.

### 🕳️ Cunicoli a prova di boss (larghezza garantita)
- Nuova passata `widenForBoss()` nel mapgen: **allarga automaticamente i colli di bottiglia** portando ogni
corridoio ad **almeno 3 tile (144px)**, così anche il mega-boss (**AZ'GAROTH**, raggio 52) passa ovunque.
- **Prima:** solo **83,3%** delle mappe erano pienamente boss-navigabili (spawn↔uscita). **Ora: 100%**
(verificato su 2100 combinazioni seed×livello con `test/verify_boss_paths.js`).
- I blob-caverna restano intatti: la densità dei muri resta ~34% (nessuna mappa "svuotata").

### 🧪 Test
- **node test/simulate.js: 180 passati, 0 falliti** · **verify_boss_paths: 2100/2100 (100%)**.

## [1.27.1] — 2026-08-08 · "Braccia dello zombie con mani (staccate dal corpo)"

- 🖐️ Le braccia dello **Zombie Putrido** sono ora disegnate **sopra il corpo** (non più inglobate dall'ellisse):
hanno **spalla** distinta (tono scuro = stacco), **gomito** e una **mano** tonda con **artigli** in fondo.
A riposo pendono ai lati; in attacco si protendono in avanti con le mani. Niente più braccia "attaccate al corpo".
- 🧪 Test: **180 passati, 0 falliti**.

## [1.27.0] — 2026-08-08 · "Braccia ai lati & rimozione del Predone Goblin"

### 🦾 Zombie — braccia ai lati
- Le braccia dello **Zombie Putrido** ora scendono **lungo i fianchi** a riposo (idle/camminata) e si protendono
**in avanti solo durante l'attacco** (morso). Eliminato l'effetto "insettoide" delle braccia sempre protese.
La testa resta centrata (fix v1.26.1). Anche l'animazione di morte eredita la nuova posa.

### 🗑️ Rimosso il Predone Goblin
- Il nemico **goblin** (Predone Goblin) è stato **rimosso** dal roster: tolto da MONSTERS e dall'array ORDER.
- **Dipendenze gestite** per evitare crash:
  - Il **Signore della Guerra Orchesco** ora evoca **Zombie Putridi** (summon 'goblin' → 'skeleton').
  - Il **filler** delle ondate boss (server) e il **pool** delle ondate usano ora lo **Zombie Putrido** al posto
del goblin (peso ribilanciato: skeleton 34).
  - **Fallback** MONSTERS.goblin → MONSTERS.skeleton in Room.js e renderer.js.
- Roster attuale: **9 nemici** standard + 3 boss.

### 🧪 Test
- Suite aggiornata (riferimenti goblin → skeleton): **node test/simulate.js: 180 passati, 0 falliti**
(un test in meno nel "sanity" perché c'è un tipo di nemico in meno — atteso).

## [1.26.1] — 2026-08-08 · "Testa centrata (top-down con viso visibile)"

- 🎯 **Fix estetico** sui 3 nuovi sprite (`zombie`, `brute`/orco, `mage`/negromante): la **testa** era disegnata
troppo in avanti e "sporgeva" dal corpo. Ora è **centrata sopra il corpo** (offset all'indietro tramite `translate`),
per un effetto **vista dall'alto con volto visibile**. Braccia protese, ascia, bastone/orbe e animazioni di
attacco/morte restano invariati. Anche il Signore della Guerra (shape `brute`) eredita il fix.
- 🧪 Test: **181 passati, 0 falliti**.

## [1.26.0] — 2026-08-08 · "Nemici ridisegnati + animazioni di attacco e morte"

### 👹 3 nemici ridisegnati (stile dark-fantasy vettoriale)
- **🧟 Zombie Putrido** (ex "Guerriero Scheletro", id interno invariato) — corpo curvo con **braccia protese**,
**occhi neri vuoti** dal fioco bagliore verdastro, macchia di sangue e spina esposta. Ora **strascica** verso i
giocatori (AI `swarm`, niente più parata frontale) ed è un po' più coriaceo e lento.
- **🧙 Negromante** (ex "Mago Oscuro") — **cappuccio** profondo con **occhi viola ardenti**, **veste a campana** con
orlo runico e **bastone** con **orbe** che pulsa.
- **🪓 Orco Berserker** — **ascia a doppia lama** impugnata, **zanne**, **occhi rossi**, spalle con **spuntoni** e
muscolatura verde. (Anche il Signore della Guerra ne eredita la resa.)

### 🎞️ Animazioni di ATTACCO e MORTE (nuove)
- **Attacco** (parametrico, guidato dagli eventi del server): lo **zombie** spalanca la mascella e allunga le braccia
nel morso, il **negromante** fa **divampare l'orbe** mentre evoca, l'**orco** **alza e cala l'ascia** con un ruggito.
Nuovo evento `cast` per i lanciatori; gli eventi `melee`/`lunge` ora trasportano l'`eid` del mostro.
- **Morte**: ogni nemico ucciso lascia uno **sprite di morte effimero** che **crolla, si accascia e svanisce**
(dissolvenza + rotazione + schiacciamento). Il **negromante** si **dissolve in volute viola**. L'evento `mkill`
trasporta ora il `facing`.

### 🧰 Note tecniche
- Nessuna nuova dipendenza (Canvas 2D puro). Sprite **parametrici** `_shape(ctx, …, t, atk)`: idle/camminata dal
tempo, attacco dalla fase `atk`, morte gestita da sprite effimeri lato client (`R.mAtk` / `R.deaths`).
- Solo questi **3** nemici sono stati ridisegnati/animati in questa release (gli altri seguiranno).

### 🧪 Test
- **node test/simulate.js: 181 passati, 0 falliti** (stabile).

## [1.25.0] — 2026-08-04 · "Terzo lotto di oggetti scenografici"

### 🗿 6 nuovi oggetti scenografici (terzo lotto, per tema)
- **🌉 Ponti di legno** (`bridge`) — assi con travi e chiodi, sopra una fenditura scura.
- **🪜 Scale a chiocciola** (`spiral_stairs`) — gradini a spirale che scendono in un pozzo buio.
- **⛲ Pozzi / cisterne** (`well`) — con acqua che luccica (glow del tema), arco e carrucola.
- **⚙️ Grate / inferriate** (`grate`) — griglia metallica su un pozzo scuro nel pavimento.
- **💠 Cristalli giganti** (`giant_crystal`) — **landmark** luminoso a più facce (glow ampio del tema).
- **🗿 Statue rituali con gemma** (`gem_statue`) — figura incappucciata che regge una **gemma luminosa**.
- Nuove **zone tematiche** (passaggio, discesa, cisterna, officina, geode, reliquiario) legate ai **temi**
  (Cripta/Lava/Foresta/Ghiaccio/Arcano), sempre col **cap 3-4 istanze per tipo**.

### 📦 Totale scenografia
- Con i 3 lotti la mappa dispone ora di **18 oggetti scenografici** (oltre a bracieri, torce, tombe, casse, ecc.).

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile); verificato su 200 mappe/5 temi: 0 crash, cap ≤4,
  tutti i nuovi oggetti presenti.

---

## [1.24.0] — 2026-08-04 · "Secondo lotto di oggetti scenografici"

### 🗿 6 nuovi oggetti scenografici (secondo lotto, per tema)
- **🏛️ Archi diroccati** (`arch`) — architettura in rovina, un pilastro spezzato.
- **🧊 Stalattiti** (`stalactite`) — pendono dal soffitto (con goccia; ghiaccioli nel tema Ghiaccio).
- **☠️ Forche / patiboli** (`gallows`) — con cappio e teschio appeso.
- **🔮 Obelischi arcani** (`obelisk`) — rune incise **pulsanti** ed emissione di **glow** del colore del tema.
- **🏮 Lanterne appese** (`hanging_lantern`) — **illuminano** con luce calda.
- **🩸 Macchie di sangue** (`bloodstain`) — decal piatte a terra (racconto ambientale).
- Distribuiti come **zone tematiche coerenti** (rovine, grotta, patibolo, santuario, sala illuminata, massacro) e
  legati ai **temi** (Cripta/Lava/Foresta/Ghiaccio/Arcano). Sempre col **cap 3-4 istanze per tipo**.

### 🧰 Note tecniche
- Tutto in **Canvas 2D puro, zero dipendenze**. Lanterne e obelischi si agganciano al sistema di luci (torce/glow).
- Aggiunto un **guard** nel piazzatore feature per robustezza (nomi zona sconosciuti ignorati).

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile); verificato su 150 mappe/5 temi: 0 crash, cap ≤4,
  tutti i nuovi oggetti presenti.

---

## [1.23.0] — 2026-08-04 · "Muri neri, terreno vivo, nuovi oggetti & fix mercante"

### 🖤 Ambiente
- **Muri QUASI NERI** — contrasto muri/pavimento portato da `0.50` a **`0.15`**: la roccia dei muri è ora quasi nera
  e si stacca nettamente dal pavimento (invariato). Con l'ombra marcata di bordo lo stacco è fortissimo.
- **Terreno meno "piatto"** — il pavimento è ora punteggiato di **rocce, massi, ciottoli e buche/crateri** sparsi
  (dettagli cosmetici baked, non bloccanti) → varietà e profondità.
- **Crepe grandi (2-3 per mappa)** — rimosse le rune/glifi pulsanti (non piacevano); al loro posto **2-3 fissure**
  molto più **grandi** (≈5-6× più lunghe, ~2× più larghe), ramificate e scure, come vere spaccature del terreno.

### 🗿 Primo lotto di 6 nuovi oggetti scenografici (per tema)
- **🪨 Stalagmiti**, **💀 Pile di teschi (catacomba)**, **🧱 Macerie / muro crollato**, **🕸️ Ragnatele giganti
  d'angolo**, **💎 Cristalli luminosi** (emettono glow), **🔥 Altari rituali** con candele accese (illuminano).
- Distribuiti con **coerenza per tema** (Cripta/Lava/Foresta/Ghiaccio/Arcano) come **zone**, sempre col **cap 3-4
  istanze per tipo** (solo le torce restano numerose).

### 🐀 Animaletti
- **Più grandi (≈2×)** — ratti, ragni e scarafaggi ora ben visibili sul pavimento.

### 🛒 Mercante Errante (fix + visibilità)
- **Fix click**: il pannello del mercante non rispondeva ai click (ereditava `pointer-events:none` dall'HUD) →
  ora **`pointer-events:auto`**: si può acquistare cliccando le offerte.
- **Più visibile**: **beacon sempre acceso** sul mercante (colonna di luce dorata + anello pulsante + etichetta
  "🪙 Mercante" sempre visibile), **marker sulla minimappa** (oro per l'ufficiale, viola per il Nero) e alone più
  ampio nel buio della torcia.

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile su run ripetute).

---

## [1.22.0] — 2026-08-04 · "Caverna organica, ombre nette, animaletti & decorazioni a cluster"

### 🗺️ Conformazione mappa (torna organica)
- **Generazione ORGANICA (caverna varia)** — abbandonato il layout a stanze (troppo "piatto/vuoto"): la mappa torna
  al metodo a **blob di roccia** con anfratti, nicchie e passaggi irregolari, **connettività garantita** (le sacche
  isolate vengono murate; verificato su run ripetute).

### 🖤 Muri & profondità
- **Contrasto muri/pavimento a 0.50** — la roccia dei muri è scurita al 50% del colore del tema: netta distinzione
  dal pavimento (invariato).
- **Ombra MARCATA muro→pavimento** — drop-shadow forte + **linea di contatto scura** al bordo: lo **stacco** tra
  muro e pavimento ora si legge chiaramente (profondità/rilievo).

### 🐀 Vita nel dungeon
- **Animaletti** — piccoli **ratti, ragni e scarafaggi** che sfrecciano a scatti sul pavimento (cosmetici, evitano
  i muri, si riciclano attorno alla telecamera). Puramente atmosferici.

### 🕯️ Decorazioni coerenti e limitate
- **A CLUSTER, non a caso** — le decorazioni sono ora raggruppate in **zone tematiche** coerenti: **cimitero**
  (tombe + ragnatele + sarcofago), **ossario** (falò + ossa/teschi + cadavere), **deposito** (casse/barili/sacchi +
  **cassa scenografica/forziere**), **fungaia** (funghi bioluminescenti), **gabbia** (con catene e resti), più
  **bracieri** sparsi come luce.
- **Cap 3-4 per tipo** — nessun oggetto ripetuto 20 volte: ogni tipo compare **al massimo 3-4 volte**. **Unica
  eccezione: le torce appese ai muri**, numerose e distribuite regolarmente.

### 👹 Mimic
- **Mimic più presenti** — compaiono già dall'**ondata 4** (peso aumentato) e le **casse-mima** salgono al **30%**
  (le casse scenografiche possono rivelare un mimic).

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile); connettività della caverna organica e "giocatori
  mai nei muri" verificate.

---

## [1.21.0] — 2026-08-04 · "Muri quasi neri, nebbia volumetrica & rune pulsanti"

### 🖤 Muri più scuri
- **Muri MOLTO più scuri (quasi neri)** — la texture roccia dei muri è ora scurita al ~30% del colore del tema
  (`#080a10`-ish), così si **distingue nettamente** dal pavimento (rimasto invariato, che andava benissimo).

### 🌫️ Atmosfera
- **Nebbia volumetrica a strati** — banchi di foschia semitrasparenti che **derivano lentamente** in world-space,
  con leggera pulsazione: profondità e atmosfera. Si dirada nel buio della modalità torcia.
- **✨ Rune / crepe che pulsano sul pavimento** — decal luminose (crepe ramificate e sigilli runici) sparse sul
  terreno, del **colore del tema**, con **glow additivo pulsante**. Emettono luce (si intravedono anche col buio
  della torcia) e danno un tocco "arcano" al dungeon.

### 🗑️ Rimozioni (richieste)
- **Rimossi i laghi/pozze** (hazard `T_HAZARD`) dalla generazione.
- **Rimossi colonne, pilastri e statue** (incl. statue demoniache) da tutte le stanze e dal mix decorativo; al loro
  posto, al centro, qualche fungo bioluminescente. Restano bracieri, gabbie, depositi (casse/barili/sacchi) e fungaie.

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile); connettività e "giocatori mai nei muri" ok.

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Nebbia e rune sono **Canvas 2D puro**, disegnate a runtime (le rune pulsano). Le rune
  sono generate deterministicamente dal seed della mappa.

---

## [1.20.0] — 2026-08-04 · "Stanze grandi, pozze-lago & decorazioni ricche"

### 🏛️ Architettura mappa (niente più cunicoli stretti)
- **Layout a STANZE garantito** — ogni livello ha ora una **stanza centrale grande** con **4 stanze angolari**
  (NO / NE / SO / SE) collegate da **corridoi larghi 3 tile**: il **boss di fine livello passa ovunque** e i nemici
  non restano più incastrati. Un **anello** di corridoi opzionale fra le stanze aggiunge varietà.
- **Connettività garantita** (flood dal centro; sacche isolate murate). Spawn al centro, **uscita** nella stanza
  angolare più lontana, spawn nemici distribuiti nelle stanze.

### 💧 Pozze naturali (tipo lago)
- **Solo 1-2 pozze per mappa** (prima erano troppe), collocate **dentro le stanze** angolari.
- **Forma organica irregolare** cresciuta a random-walk (niente più "pallini"): resa più da **lago/stagno** —
  colore **desaturato** (meno fumettoso), profondità al centro, riflesso tenue in superficie. Del colore del tema,
  brilla intravedendosi nel buio. La meccanica (danno) resta.

### 🕯️ Decorazioni ricche e bilanciate
- Nuovi elementi scenografici disegnati in Canvas 2D: **🔥 bracieri** e **🕯️ candelabri** (che **illuminano** davvero),
  **🍄 funghi bioluminescenti** (glow nel buio), **📦 casse**, **🛢️ barili**, **🧺 sacchi**, **😈 statue demoniache**
  (occhi luminosi), **⛓️ gabbie sospese con scheletro** (teschio + costole), più **🏛️ pilastri**.
- Distribuite **con criterio**: bracieri/pilastri lungo i muri, una **feature caratteristica** per stanza angolare
  (statua / gabbia / stash di casse-barili-sacchi / fungaia / candelabro), una statua imponente al centro, e un
  leggero scatter macabro. Niente affollamento.

### 🎨 Texture
- Il pavimento e i muri mantengono la **texture roccia realistica** (rilievo/bump) della v1.19; le nuove decorazioni
  sono realizzate allo stesso livello di dettaglio (ombre, gradienti di volume, luci).

### 🧪 Test
- **`node test/simulate.js`: 181 passati, 0 falliti** (stabile su run ripetute); connettività e "giocatori mai nei
  muri" verificate sul nuovo layout a stanze.

---

## [1.19.0] — 2026-08-04 · "Texture roccia realistica, stanze attigue & niente glow"

### ✨ Grafica ambiente
- **🪨 Texture ROCCIA realistica** (pavimento e muri) — sostituito il vecchio "mottling" con vera roccia procedurale:
  - **Rilievo/bump**: una *heightmap* a rumore viene illuminata da una luce direzionale → superficie **scolpita in 3D**
    (creste chiare, incavi scuri, luccichii minerali).
  - **Domain warping** + **Voronoi**: massi irregolari e crepe organiche, **niente griglia**.
  - **Umidità** (macchie scure) e **muschio** (chiazze verdastre) sul pavimento; muri più scuri con crepe marcate.
  - Le texture sono **colorate sul tema** corrente (cripta/lava/foresta/ghiaccio/arcano) e generate una volta per mappa
    come *pattern* — **Canvas 2D puro, zero dipendenze**.
- **🚪 Mappa meno "quadratona" → STANZE minori attigue** — nuovi **tramezzi** parziali con **varchi/porte** che spezzano
  i grandi open-space in stanze comunicanti (agganciati ai muri, per sembrare pareti vere). **Connettività garantita**:
  ogni tramezzo è applicato solo se la mappa resta *interamente* percorribile, altrimenti annullato.
- **🚫 Glow rimosso** — eliminato il bloom/post-processing (e il tasto `B`): schermo più pulito e nitido, come richiesto.
  La modalità **torcia** (tasto `L`) e l'alone tondo restano.

### 🐛 Correzioni (test)
- Risolta la regressione di connettività introdotta dai tramezzi → **collaudo a 0 falliti** su 10 run consecutive.

### 🧪 Test
- **`node test/simulate.js`: 0 falliti** (stabile su 10 run).

---

## [1.18.0] — 2026-08-04 · "Caverna vera: terra/roccia, pozze uniche & decorazioni"

### ✨ Ambiente (revisione richiesta)
- **🕳️ Look da CAVERNA (niente più griglia)** — pavimento e muri completamente ridisegnati:
  - **Pavimento "terra"** organico: base uniforme + **mottling** morbido (macchie sovrapposte) + qualche ciottolo,
    **senza** più checkerboard né linee di piastrella.
  - **Muri "roccia"** grezza: chiazze chiare/scure, crepe sparse e **cresta illuminata** in cima ai muri esposti.
  - **Bordo caverna**: ombra morbida (ambient occlusion) sul pavimento accanto ai muri → senso di profondità.
- **🩸 Pozze come forma UNICA irregolare con profondità** — niente più "pallini attaccati": le celle-pozza
  adiacenti si **fondono in una sola macchia organica** (union di cerchi), con **conca scura** attorno (il pozzo
  scavato), **centro più scuro** (profondità) e riflesso sulla superficie. Restano del **colore del tema**
  (acido/fuoco/freddo/arcano) e brillano intravedendosi nel buio.

### 🧹 Decorazioni & torce (revisione richiesta)
- **🪦 Rimesse le decorazioni** — bare, scheletri, ossa, accampamenti, rocce, cadaveri, colonne, ecc. (mix per tema
  di nuovo ricco) e densità decori ripristinata (scatter 12 → **34+**).
- **🔥 Torce molto meno frequenti** — rimossa la passata casuale fitta sui muri; lungo i lati **poche** torce a
  **grande distanza e irregolari** (niente più griglia di aloni arancioni).

### 🐛 Correzione (test)
- Stabilizzati i test intermittenti (mercante + homing + soglia snapshot) → **collaudo a 0 falliti** su run ripetute.

### 🧪 Test
- **`node test/simulate.js`: 0 falliti** (stabile su più run).

---

## [1.17.0] — 2026-08-04 · "Dungeon di pietra: mappa ripulita, pozze & torce ai lati"

### ✨ Illuminazione
- **⭕ Alone tondo grande (niente più cono)** — rimosso il cono di luce direzionale; ora ogni eroe è avvolto da un
  **grande alone circolare** (raggio `haloR` 130 → **260**), morbido ai bordi. In co-op uno per ciascuno.
- **🌗 Mappa un filo meno scura** — `darkness` 0.94 → **0.86**, così si legge meglio l'ambiente attorno.
- **🔥 Torce ai LATI della mappa** — nuove torce disposte lungo il **perimetro** a intervalli regolari: illuminano
  i bordi e danno punti di riferimento nel buio.

### 🗺️ Mappa (stile pietra, più pulita)
- **🧱 Pavimento e muri in pietra** — bake ridisegnato: **lastre** di pietra con fughe/rilievo e variazione tonale,
  **muri a blocchi** con luce in alto, ombra in basso, giunzioni e crepe. Struttura del livello invariata (niente
  micro-stanze), solo resa migliore.
- **🧹 Meno "roba alla rinfusa"** — densità decorazioni ridotta drasticamente (scatter 42→**12**, meno oggetti negli
  accampamenti e nelle nicchie) e **mix per tema semplificato** (pochi elementi caratteristici invece di tanti
  ammassati).

### ☠️ Pericoli a pavimento
- **🗑️ Rimossi gli spuntoni** (trappole `T_TRAP`): non compaiono più sul pavimento.
- **🟢 Rimosso il "pavimento a pallini"**: l'hazard è ora una **pozza** vera.
- **🩸 Nuove pozze tematiche** — acido / fuoco / freddo / arcano **del colore della mappa** (verde, arancio, azzurro,
  viola a seconda del tema): forma organica, bordo luminoso, e **brillano** intravedendosi nel buio. La meccanica
  (danno calpestandole) resta.

### 🐛 Correzione (test)
- Stabilizzato il test intermittente del mercante (a fine round lo spawn è casuale ufficiale/nero) → **collaudo a
  0 falliti** su run ripetute.

### 🎛️ Parametri regolabili (`renderer.js`)
- `haloR` (alone attorno all'eroe), `darkness` (buio mappa), `bloomStrength` (glow). Facili da tarare.

### 🧪 Test
- **182 test** con `node test/simulate.js`: **182 passati, 0 falliti** (stabile su 5 run).

---

## [1.16.0] — 2026-08-04 · "Torcia nel buio: mappa oscura & cono di luce"

### ✨ Grafica (tema dungeon, atmosfera horror)
- **🔦 Modalità torcia** — la mappa è ora **quasi nera** e il giocatore la "buca" con un **cono di luce** nella
  direzione di mira + un **alone ravvicinato** attorno a sé (per non essere cieco ai lati). In co-op ogni alleato
  ha il proprio cono. Realizzato con una **dark-mask** offscreen (nero + `destination-out`) → leggera, zero dipendenze.
  - Le **sorgenti** (torce, falò, portale, mercanti) e i **proiettili** restano visibili nel buio.
  - **Boss / élite / scrigno** si **intravedono** col loro alone → tensione "cosa si nasconde nel buio".
  - **Tasto `L`** per attivare/disattivare la torcia (scelta salvata in `localStorage`).
- **🌑 Bloom più tenue** — su tua indicazione il glow generale è stato ridotto (`bloomStrength` 0.85 → **0.5**):
  resta bello attorno a nemici, spari, eroi ed effetti, senza "lavare" lo schermo.
- **✨ Pulviscolo ambientale** — leggere particelle di **polvere** fluttuano nell'aria e diventano visibili quando
  entrano nel fascio di luce → profondità e atmosfera (come nello screenshot di riferimento).

### 🎛️ Parametri regolabili (in `renderer.js`)
- `darkness` (quanto è nera la mappa), `coneLen` / `coneHalf` (lunghezza/apertura del cono), `haloR` (alone attorno
  al player), `bloomStrength` (intensità glow). Tutti facilmente tarabili.

### 🧪 Test
- **182 test** con `node test/simulate.js`: **182 passati, 0 falliti** (stabile su run ripetute).

---

## [1.15.0] — 2026-08-04 · "Dungeon neon: bloom & glow"

### ✨ Grafica (tema dungeon mantenuto)
- **🌟 Bloom post-processing** — nuovo effetto di **glow diffuso** su tutta la scena: le parti luminose (proiettili,
  torce, occhi/aure dei nemici, accenti degli eroi) "irradiano" luce come nei twin-stick moderni, restando nel
  **tema dungeon cupo**. Implementato in Canvas 2D puro con canvas offscreen **a bassa risoluzione** (~1/3) +
  blur additivo → **leggero** e **zero dipendenze**.
  - **Tasto `B`** per attivare/disattivare il bloom (impostazione salvata in `localStorage`), utile sui PC lenti.
- **🔫 Proiettili neon** — nucleo bianco incandescente + alone colorato saturo + scia più lunga (blend additivo):
  con il bloom diventano vere **scie luminose**.
- **👁️ Nemici emissivi** — ogni mostro ha ora un **alone di luce** del proprio colore (più intenso per élite/boss),
  che il bloom accende dando il look "orb neon" — il corpo dungeon resta invariato.

### 🧰 Note tecniche
- Nessuna nuova dipendenza npm, nessun asset esterno. Il bloom legge il frame già renderizzato, lo scala e lo
  ricompone in `lighter`; HUD e minimappa restano nitidi (bloom applicato prima di essi).
- Le aree scure contribuiscono in modo trascurabile al blend additivo → il bloom evidenzia **solo** ciò che è luminoso.

### 🧪 Test
- **182 test** con `node test/simulate.js`: **182 passati, 0 falliti** (stabile su run ripetute).

---

## [1.13.0] — 2026-08-05 · "Entità un po' più grandi (senza perdere fluidità) & Fix Mercante Nero"

### ✨ Modifiche
- **🔎 Entità e prop leggermente più grandi, ma il gioco resta fluido** — dopo il test del raddoppio 2× (troppo
  pesante), qui si adotta un ingrandimento **leggero e mirato**:
  - **Visivo +45%** (`VIS_SCALE = 1.45`) per giocatore, nemici, **boss** e **oggetti di scena** → colpo d'occhio
    più imponente.
  - **Collisione quasi invariata** (`COL_SCALE = 1.08`): la "hitbox" resta vicinissima a quella della v1.12, così
    movimento e immediatezza **non cambiano**.
  - **Nessuna modifica** a mappa, densità nemici o `moveCircle` (restano come la v1.12 fluida).
  - **+5% velocità base** del giocatore per un feel ancora più reattivo.
  - Proiettili resi un filo più grandi (solo visivamente) per leggibilità.

### 🐛 Correzioni
- **Fix Mercante Nero** — ora, al termine del round, compare **un solo mercante**, scelto a caso: **~30%** il
  **Nero al posto** di quello ufficiale, altrimenti l'ufficiale. **Mai entrambi insieme.** Il Mercante Nero spawna
  ora in una posizione **accessibile** (micro-area o vicino allo spawn), non più nascosto lontano.

### 🧪 Test
- Aggiornato il test del mercante (mutua esclusività: mai entrambi, sempre almeno uno) e aggiunto il test del
  ridimensionamento leggero (visivo > collisione, hitbox quasi invariata, velocità mostri invariata, +5% giocatore)
  → **182 test totali**, 0 falliti; invariante "giocatori mai nei muri" verificata su solo/trio/stress.

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Costanti `VIS_SCALE`/`COL_SCALE` (valori leggeri); raggio **visivo** e di **collisione**
  separati; velocità mostri calcolata sul raggio originale (invariata). Nessuna modifica al protocollo di rete.

---

## [1.12.0] — 2026-08-04 · "Mercante Nero & HUD Ridisegnato"

### ✨ Aggiunte
- **💀 Secondo mercante: il Mercante Nero** — una figura sinistra (incappucciata dal **volto di teschio**, altare di
  pietra con rune, lanterna **viola** e relíquie fluttuanti) nettamente diversa dal Mercante Errante. Vende **patti
  rischio/ricompensa**: potenziamenti forti ma con una **maledizione** (es. *Patto del Berserker* +35% danno ma −25
  PV massimi; *Patto di Cristallo* +30% cadenza ma +12% danni subiti; *Offerta di Sangue* +2 vite ma dimezza le
  monete; *Reliquia Maledetta* un potere ma −20 PV; *Azzardo del Diavolo* effetto casuale benedizione/maledizione).
- **🎲 Apparizione casuale** — il Mercante Nero **non è sempre presente**: compare a caso (~35% delle mappe) e si
  nasconde nel punto **più lontano** dallo spawn. Il suo pannello ha uno **stile dedicato** (viola/rosso) e mostra
  chiaramente **beneficio** (verde) e **rischio** ⚠ (rosso) di ogni patto.
- **🎨 HUD ridisegnato** —
  - **Barra abilità più grande e caratteristica**: slot più ampi con **icone molto più grandi**, badge del tasto
    a pillola, **etichetta** dell'azione sotto ogni slot, cornice con vetro smerigliato e **pulsazione** quando
    l'abilità è pronta.
  - **Eventi al centro**: le notifiche (uccisioni boss, ondate, acquisti, combo, sinergie…) non compaiono più
    piccole in alto a destra, ma **al centro dello schermo**, grandi e molto visibili, con animazione di comparsa.

### 🧪 Test
- **12 nuovi test** (Mercante Nero: spawn/acquisto/prossimità, effetti rischio/ricompensa, differenziazione dal
  mercante normale, apparizione casuale, snapshot) → **172 test totali**, 0 falliti.

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Riusa i messaggi `offer_merchant`/`buy_merchant` con un flag `dark`; nuovi campi
  snapshot `merchD` e `nmd`.

---

## [1.11.0] — 2026-08-04 · "Mercante, Creature & Attacchi alla Hades"

### ✨ Aggiunte
- **🧙 NPC Mercante Errante** — un venditore neutrale (con bancarella, tenda a strisce e lanterna) appare in mappa,
  preferibilmente in una **micro-area**. Avvicinandoti si apre un pannello con **3 offerte casuali** acquistabili
  con le **monete** (cura, +PV massimi, cassa armi, potere, vita extra, +danno, +velocità, riduzione danni).
  Neutrale: i nemici lo ignorano.
- **👹 Nemici ridisegnati** — i mostri non sono più "pallini": ora sono **creature dettagliate** con corpo, arti,
  gambe animate, corna, zanne, ali e occhi (goblin gobbo, orco muscoloso, scheletro con scudo e costole, mago/lich
  incappucciato con orbe, mimic con fauci e lingua, troll con braccione, assassino con pugnale e mantello, viverna
  e drago alati). Stile coerente con l'art degli eroi.
- **⚔️ Attacchi più vari (ispirati a Hades)** — nuovo sistema di **zone telegrafate a terra** (cerchi che si
  riempiono e poi esplodono). Il **Mago Oscuro** alterna colpo mirato, **ventaglio a 3**, e zona sotto i piedi;
  la **Viverna** spara **raffiche a 3**; il **Lich** piazza zone; i **Goblin** eseguono **affondi** rapidi.
- **🕯️ Micro-aree nel dungeon** — piccole nicchie/stanzette laterali scavate nei muri, arredate con oggetti macabri
  e una torcia: più esplorazione e nascondigli. La mappa è anche **più scura** (illuminazione più intima, vignetta marcata).

### 🐛 Correzioni
- **Fix bug "il personaggio si blocca e non si muove"** — era una **regressione della v1.10**: l'handler
  `contextmenu → azzera tasti` scattava a ogni **scatto col tasto destro**, cancellando il movimento. Rimosso.
  Aggiunta inoltre una **rete di sicurezza lato server** che libera il giocatore se dovesse incastrarsi in un muro.

### 🧪 Test
- **14 nuovi test** (mercante: spawn/acquisto/prossimità, zone telegrafate, ventagli, micro-aree, snapshot) →
  **160 test totali**, 0 falliti.

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Nuovi messaggi di rete `buy_merchant`/`offer_merchant`; il mercante riusa lo snapshot.

---

## [1.10.0] — 2026-08-04 · "Icone Emporio, Poteri & Dungeon Tetri"

### ✨ Aggiunte
- **🎨 Icone dell'emporio generate e uniche per personaggio** — armatura, stivali e arma ora hanno **icone-immagine**
  dedicate e **diverse per ciascuno dei 3 eroi** (Enforcer blu/polizia, Recon verde/militare, Glitch cyan/hacker),
  al posto delle emoji. Renderizzate come `<img>` nell'emporio e nel killfeed di equipaggiamento.
- **🎴 Catalogo poteri ampliato, scelta tra 2** — aggiunti **6 nuovi boon** (Furia Cieca, Passo Rapido, Fortuna Sfacciata,
  Colosso, Giustiziere, Bombardiere → **23 totali**). A fine ondata ora si sceglie **1 di 2** carte (più mirato).
- **🪦 Dungeon più tetri** — nuovi elementi macabri: **tombe**, **cadaveri**, **strumenti di tortura** (ruota dentata),
  **gabbie sospese** con resti, oltre a più **ragnatele**, **catene**, **teschi** e **ossa**. Pavimenti e atmosfera
  **oscurati** per un tono più cupo.

### 🔧 Modifiche
- **Emporio ridotto a 3 slot**: rimossi **Anello** e **Amuleto** (restano Armatura, Stivali, Arma).
- **Oggetti molto più costosi**: costi base aumentati (~80/70/95 monete) e scaling per tier più ripido (×2.1–2.2),
  per rendere l'equipaggiamento una scelta di lungo periodo.

### 🐛 Correzioni
- **Fix "il personaggio si muove da solo"** — se la finestra perdeva il focus (alt-tab, click fuori, apertura chat)
  mentre tenevi un tasto, il `keyup` non arrivava e il tasto restava "premuto". Ora lo stato input viene **azzerato**
  su `blur`, cambio di visibilità della scheda, uscita del mouse dal canvas e all'apertura/chiusura della chat.
  Inoltre, mentre digiti in chat il movimento è **neutralizzato**.

### 🧪 Test
- **15 nuovi test** (scelta tra 2 poteri, nuovi boon, emporio a 3 slot costoso, icone per eroe) → **146 test totali**, 0 falliti.

### 🧰 Note tecniche
- Le icone sono PNG con trasparenza in `public/assets/gear/{eroe}_{slot}.png`, ottimizzate (~110 KB ciascuna).

---

## [1.9.0] — 2026-08-04 · "Pausa, Nuove Abilità & Scenografia"

### ✨ Aggiunte
- **⏸️ Pausa nel negozio** — quando l'ondata finisce e sei nel negozio / scelta poteri / emporio, **il mondo si
  congela** (nemici, proiettili e movimento fermi). In singolo giocatore non c'è timer forzato: il gioco riparte
  **solo** premendo **Continua** (in multiplayer resta un timeout anti-AFK). A fine ondata i drop rimasti a terra
  (XP e monete) vengono **raccolti automaticamente**, così la pausa non fa perdere nulla.
- **⚔️ Abilità riviste — 2 per eroe + nuove** (lo **scatto** universale col tasto destro resta invariato):
  - 🎯 **Torretta Schierabile** (Enforcer, E) — piazza una torretta che spara ai nemici per 8s *(stile TF2/Risk of Rain)*.
  - 🎯 **Colpo del Cecchino** (Recon, E) — proiettile perforante devastante a lunga gittata *(stile Overwatch/Valorant)*.
    Sostituisce il vecchio "Scatto di Combattimento", che era **ridondante** con lo scatto universale (tasto destro).
  - Glitch mantiene le sue due abilità già uniche (⏱️ Bullet-Time + 🌀 Frattura di Dati).
  - La barra abilità mostra le **icone specifiche** di ogni eroe.
- **🏛️ Più elementi scenografici nel dungeon** — nuovi prop tematici: **colonne**, **cristalli**, **statue**,
  **funghi luminescenti**, **catene**, **pozze**, **pozze di lava**, **stendardi**, **sarcofagi**. Densità aumentata
  e colonne appoggiate ai muri per maggiore profondità.
- **🏷️ Versione nel titolo** — il numero di versione compare nel titolo della scheda e come badge nel menu
  (sincronizzato da `C.VERSION`).
- **🧪 20 nuovi test** automatici (pausa, raccolta auto, torretta, cecchino, scatto universale, "2 abilità per eroe")
  → **130 test totali**; test homing reso deterministico (niente più flakiness).

### 🔧 Modifiche
- La simulazione del mondo è ora **gated** dalla fase: gira solo in combattimento/boss, non nel negozio/lobby/fine.
- Rimossa l'abilità ridondante di Recon; aggiunte `VERSION` e nuove voci abilità (con icone) in `heroes.js`.

### 🧰 Note tecniche
- Nessuna nuova dipendenza. La torretta riusa l'array `orbs` (nessun nuovo canale di rete).

---

## [1.8.0] — 2026-08-04 · "Monete & Emporio dell'Equipaggiamento"

### ✨ Aggiunte
- **🪙 Monete di vario taglio** — i nemici droppano **monete** oltre all'XP: 🟤 Bronzo (1), ⚪ Argento (5),
  🟡 Oro (20). I **boss** e le **élite** ne lasciano di più e di taglio superiore; lo **scrigno del tesoro**
  è una miniera. Raccolta con **calamita** come l'XP.
- **🏪 Emporio dell'equipaggiamento** — a fine ondata, un secondo negozio (a **monete**, parallelo a quello a XP)
  con **5 slot** potenziabili per **5 tier** (Lv. I → V, rarità crescente):
  - 🛡️ **Armatura** → riduzione danni + PV massimi
  - 👟 **Stivali** → velocità di movimento
  - ⚔️ **Arma** → danno + cadenza di fuoco
  - 💍 **Anello** → probabilità e moltiplicatore critico
  - 📿 **Amuleto** → potenza abilità + assorbimento vitale
  Ogni tier costa più del precedente: costruisci il tuo personaggio nel tempo.
- **🎨 Resa grafica** — monete animate a terra con luccichio e luce dedicata; contatore monete 🪙 nell'HUD;
  carte equipaggiamento con indicatori di tier (pip) e costo.
- **🧪 19 nuovi test** automatici (drop/raccolta monete, acquisto e stat degli slot, costo crescente, tier massimo,
  cap riduzione danni, snapshot) → **110 test totali**.

### 🔧 Modifiche
- Due economie **distinte e complementari**: **XP** per micro-potenziamenti ripetibili, **monete** per
  equipaggiamento a slot con tier discreti.
- Nuovi messaggi di rete `buy_gear` / `offer_gear`; `Room` traccia `coins` e `gear` per giocatore.
- La riduzione danni totale è ora **limitata all'85%** (per evitare invulnerabilità con più fonti cumulative).

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Gli effetti dell'equipaggiamento si sommano ai campi statistici esistenti (delta additivo).

---

## [1.7.0] — 2026-08-04 · "Stats, Ricompense Combo & Sinergie"

### ✨ Aggiunte
- **🏆 Schermata di fine partita con statistiche** — riepilogo completo della run: **ondata** raggiunta,
  **durata** ⏱, e una **classifica co-op** (ordinata per uccisioni) con medaglie 🥇🥈🥉. Per ogni giocatore:
  **uccisioni**, **combo massima** 🔥, **danni totali**, numero di **boon** raccolti, **sinergie** attive 🔗 e
  **arma** (con evoluzione ✨). I caduti sono barrati.
- **🔥 Ricompense combo a soglie** — la combo non dà più solo XP: a **15** sblocchi la **Frenesia** (buff cadenza),
  a **25** una **Nova** ad area, a **40** una **Cura + Egida**. Mantenere la combo diventa una scelta tattica.
- **🔗 Sinergie tra Boon** — possedere due boon compatibili sblocca un effetto potenziato una tantum:
  - **🧪 Deflagrazione Tossica** (Tossina + Colpi Esplosivi) → le esplosioni diffondono veleno ad area.
  - **🧊 Catena Gelida** (Catena di Fulmini + Tocco Gelido) → le catene rallentano i nemici colpiti.
  - **🔮 Cercatore** (Mira Guidata + Perforazione) → i proiettili guidati perforano +1 nemico.
  - **🩸 Sete di Sangue** (Vampirismo + Adrenalina Pura) → +6% cura dal danno inflitto.
- **🧪 18 nuovi test** automatici (ricompense combo, sinergie, deflagrazione tossica, stats/classifica) → **91 test totali**.

### 🔧 Modifiche
- `Room` traccia `runStart`, `comboBest`, `damageDealt` e `synActive` per giocatore.
- Gli eventi `gameover`/`victory` ora trasportano `stats` (classifica) e `dur` (durata run).
- Nuovi eventi client: `combo_reward` (ricompense a soglie) e `synergy` (sinergia sbloccata).

### 🧰 Note tecniche
- Nessuna nuova dipendenza. Retro-compatibile con i salvataggi di logica della v1.6.

---

## [1.6.0] — 2026-08-04 · "Combo, Minimappa & Homing"

### ✨ Aggiunte
- **🔥 Sistema COMBO / streak** — le uccisioni consecutive riempiono un **combo meter** in alto al centro.
  Ogni catena aumenta un **moltiplicatore di XP** progressivo (fino a **x2.5**). Milestone ogni 5 uccisioni con
  feedback visivo/sonoro; oltre 20 combo compare un avviso nel killfeed.
- **⏳ Decadimento combo** — se non uccidi entro `COMBO_TIME` (3,6 s) la combo si azzera: premia il gioco aggressivo.
- **🗺️ Minimappa in tempo reale** — riquadro in basso a sinistra con muri, portale d'uscita, **alleati**,
  **nemici** (boss in rosso, élite in oro) e lo **scrigno del tesoro** 👑.
- **🎯 Boon "Mira Guidata" (homing)** — i proiettili curvano dolcemente verso il nemico più vicino (max 2 stack).
- **🪙 Boon "Avidità"** — +30% XP raccolta per stack (potenzia le combo).
- **🧱 Boon "Baluardo"** — -12% a tutti i danni subiti per stack (fino a -60%).
- **🧪 12 nuovi test** automatici (combo, homing, avidità, baluardo, snapshot combo) → **73 test totali**.

### 🔧 Modifiche
- `snapshot()` ora espone `cmb` (combo), `cmt` (frazione timer), `cmx` (moltiplicatore) per l'HUD.
- Statistiche giocatore estese con `xpMult` e `dmgReduce`.
- Descrizione e versione aggiornate in `package.json` e nella suite di test.

### 🧰 Note tecniche
- Nessuna nuova dipendenza (motore custom a dipendenze zero invariato).
- Retro-compatibile: le partite e i salvataggi di logica restano validi; nessuna modifica di rete "breaking".

---

## [1.5.0] — "Profondità & Game Feel"

### ✨ Aggiunte
- **🎴 Poteri a scelta (Boon, stile Hades)** — a fine ondata scegli 1 di 3 carte con effetti unici e impilabili
  (Rimbalzo, Perforazione, Catena di Fulmini, Tossina, Colpi Esplosivi, Onda di Ritorno, Vampirismo, Sdoppiamento,
  Occhio di Falco, Proiettili Giganti, Tocco Gelido, Aura di Spine, Adrenalina Pura, Scudo Vitale).
- **💥 Hit-stop + evoluzione armi** — micro freeze-frame sui critici/uccisioni di boss; armi a Lv.3 con la statistica
  giusta si evolvono (Uragano d'Acciaio, Tempesta di Piombo, Lancia del Giudizio).
- **🌊 Modalità ondata** — Orda, Caccia, Sopravvivenza, Tesoro 👑, Assalto.

### Incluse dalle versioni precedenti
- Sistema di **vite** (2), **XP raccoglibile + negozio statistiche**, **item drop**, **20 livelli** con
  **MEGA boss finale AZ'GAROTH**, **temi mappa** (Cripta, Lava, Foresta, Ghiaccio, Arcano), dash che attraversa
  i nemici, 3 armi raccoglibili, musica procedurale, 3 eroi, 10 mostri + boss, netcode autoritativo.

---

> Formato ispirato a [Keep a Changelog](https://keepachangelog.com) · Versioni secondo [SemVer](https://semver.org).
> Ad ogni nuova versione aggiungi qui in cima una sezione con la data e le modifiche.
