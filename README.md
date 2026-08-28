# ⚔️ DUNGEON RIFT v1.67.0 — Roguelike Co-op Multiplayer 2D

Roguelike frenetico per **fino a 6 giocatori**. Motore **custom a dipendenze zero** (Node.js + Canvas 2D):
niente `npm install`, niente asset esterni — grafica, musica ed effetti sono **generati proceduralmente**.

## 🚀 Avvio
```bash
docker compose up --build      # → http://localhost:8080
# oppure, con solo Node ≥ 18:
npm start
```
Test: `npm test`

## 🎮 Comandi
| Azione | Tasto |
|---|---|
| Movimento | WASD / frecce |
| Mira | Mouse |
| Spara | Click sinistro / Spazio |
| **Scatto (dash)** | Tasto destro del mouse (o Shift) — attraversa i nemici |
| ~~Abilità 1 / 2~~ | *sospese in v1.66 — torneranno con l'evoluzione delle classi* |
| Negozio: pronto | Spazio |
| Musica | M |
| Minimappa | sempre visibile (in basso a sinistra) |

## 🆕 Novita v1.67 (il fabbro vende oggetti, non livelli)
- **🔨 Catalogo per classe**: l'Emporio a tre barre e' sostituito da **oggetti con un nome**, e ogni classe
  vede solo la propria roba, con i propri slot — il guerriero ha lo scudo, il ladro le calzature, il mago no.
- **⚔️ Guerriero**: Spada · **Spadone** 🪙230 · **Alabarda** 🪙470 — piu' e' lunga, piu' l'arco e' **stretto**
  (152px/71° contro 100px/109°). Armatura a Piastre 🪙250, Scudo a Torre 🪙290.
- **🔮 Mago**: Bacchetta di Frassino · **Scettro Runico** 🪙240 · **Bastone del Vuoto** 🪙500 — stessa cadenza
  per tutte (quella la alza l'Intelligenza), cambiano danno, velocita' e **grandezza della bolla**. Manto
  dell'Arcanista 🪙270.
- **🏹 Ladro**: Arco Corto · **Arco Lungo** 🪙300, Corazza di Cuoio 🪙240, Stivali del Passo Lieve 🪙260.
- **🔁 Cambio libero**: si compra qualunque oggetto dello slot, anche tornando indietro; il vecchio viene
  rimpiazzato e i bonus vengono **ricalcolati da zero** (niente bonus fantasma).
- **👁️ Cio' che compri si vede**: scudo a torre piu' grande, arco lungo che sporge, orbe della bacchetta,
  e l'arco del fendente che cambia con l'arma.

## 🆕 Novita v1.66 (Guerriero, Mago, Ladro)
- **🦸 Tre classi nuove al posto dei tre eroi cyberpunk**: il **Guerriero** colpisce con un **semicerchio**
  davanti a se (raggio e apertura vengono dall'arma), il **Mago** lancia **bolle di energia** lente e pesanti,
  il **Ladro** tira **frecce** veloci che perforano un nemico.
- **📊 Quattro statistiche da gioco di ruolo** — **Forza, Costituzione, Intelligenza, Destrezza**, da 1 a 12 —
  al posto delle sei da sparatutto. Ognuna alza danno e cadenza della **sua scuola** (mischia / magia /
  distanza): chiunque puo' comprarle tutte, e cio' che compri fuori scuola servira' alle **classi miste**.
- **💰 Curva XP rifatta**: con l'XP di **una run intera** si cappa **esattamente una** statistica (17.980 XP).
- **➖ Abilita' Q/E sospese** (erano cucite sui vecchi eroi: torneranno con l'evoluzione dopo il boss),
  **niente piu' armi a terra** e **acquisto armi sospeso** — l'arsenale va ripensato sulle tre scuole.

## 🆕 Novita v1.65 (il fascio della Faglia)
- **🔮 L'effetto del bordo ora si vede davvero**: un **ventaglio** che si apre dalla roccia piu' vicina, con
  filamenti che ti **arrivano addosso** e un nucleo pulsante — lo stesso linguaggio del fascio dello sguardo
  del Beholder. Prima erano tentacoli sottili e passavano inosservati.
- In un **angolo** partono **due fasci**, uno per lato.
- Il buio si apre alla radice del fascio, altrimenti l'effetto restava nascosto proprio dove serve vederlo.
- Nessun costo in piu': i gradienti sono in cache come tutto il resto dalla v1.64.

## 🆕 Novita v1.64 (prestazioni)
- **⚡ Via il singhiozzo**: il frame peggiore con 80 nemici passa da **39,7 ms a 18,5 ms**. La causa erano
  **33.494 gradienti creati al secondo** e buttati via subito — ora sono in cache.
- **🦇 Il Nugolo di Pipistrelli** era il nemico piu' caro del gioco (116 µs l'uno): le pose delle ali sono
  ora **precotte**, e costa **31 µs**.
- **✂️ Non si disegna piu' cio' che sta fuori schermo** (11-15% del frame).
- **🔢 Tetto di 50 nemici vivi**: l'ondata non si accorcia, si **ritma** — i nemici in eccesso entrano man
  mano che gli altri muoiono.
- **🟣 La Faglia si vede nel mondo**: la fascia e' dipinta sulla roccia (piu' carica negli angoli) e i
  **tentacoli** escono dal bordo piu' vicino a te.
- Test: **475 passati, 0 falliti**, piu' una nuova guardia di prestazione che conta le allocazioni del renderer.

## 🆕 Novita v1.63 (la Faglia ai margini)
- **🟣 Il bordo della mappa ti consuma** se ci resti: 2,5s di grazia, poi un drenaggio crescente (3 → 20 PV/s).
  Negli **angoli** la grazia dura la meta'. Uscire ferma il danno all'istante — passare non costa niente,
  accamparsi si'.
- **⚠️ Avvisa prima di punire**: alone viola che si chiude, filamenti quando morde, e la fascia segnata
  sulla **minimappa**.
- **📦 Casse e armi solo al centro**: ogni ondata ti obbliga ad attraversare lo spazio aperto per prenderle.
- Misurato: nell'angolo si subiva **4,8 volte meno danno** (arco da difendere 79° contro 243°). Ora chi si
  accampa sul bordo sopravvive **26s invece di 81**, mentre il gioco normale e' invariato.
- Test: **468 passati, 0 falliti**.

## 🆕 Novita v1.62 (il terreno conta)
- **🔥 Pozze di pericolo** in ogni mappa (lava, ghiaccio sottile, melma): fanno danno a te **e ai mostri**.
  Non possono mai tappare un passaggio — si puo' sempre girarci intorno.
- **🪨 Piu' oggetti di scena**: da ~30 a ~46 per mappa, uno strato di pulviscolo oltre alle zone tematiche.
- **🧭 Partenza e uscita non sono piu' fisse**: prima si partiva sempre dal centro esatto e si usciva sempre
  dal punto piu' lontano. Ora variano, e tutte le distanze si misurano dalla partenza.
- **🗺️ Il nome della zona** ("Cripta Dimenticata", "Caverne di Lava"...) compare sotto la barra in alto:
  c'era gia' scritto nel codice e non lo vedeva nessuno.
- Test: **448 passati, 0 falliti**.

## 🆕 Novita v1.61.1 (i due nuovi prendono posto)
- **🦇 Nugolo dall'ondata 6**, **🔵 Fuoco Fatuo dall'ondata 8**. Il Nugolo prima perche' insegna a guidare
  il tiro; il Fatuo dopo perche' toglie il riparo, e una risposta si toglie solo dopo averla insegnata.
- **📈 Rampa senza buchi**: un archetipo nuovo per ogni ondata dalla 1 alla 8 (prima la 6 e la 8 erano vuote).
- Test: **421 passati, 0 falliti**.

## 🆕 Novita v1.61 (lo sciame e il fuoco fatuo)
- **🦇 Nugolo di Pipistrelli**: una sola entita' disegnata come **9 sagome in orbita**, ali = una sinusoide di
  battito. Fragile ma velocissimo, e **ondeggia** mentre insegue: non lo colpisci sparando dritto.
- **🔵 Fuoco Fatuo**: **attraversa i muri**. Non lo semini rompendo la linea di vista — e' lento, quindi la
  risposta e' muoversi. Quando ti raggiunge **drena vita** e si cura.
- Nessuno dei due ha asset o cicli di camminata: tutto vettoriale, come Fungo e Sfera d'Ossa.
- **🍄 Il Fungo ora e' davvero piantato**: non lo spingono piu' ne i giocatori ne gli altri mostri.
- Test: **408 passati, 0 falliti**.

## 🆕 Novita v1.60 (il Troll smette di essere legnoso)
- **📏 Ancora dell'attacco corretta**: era sbagliata di 11px e il troll *saltava* ogni volta che colpiva.
  Misurata sui PNG nuovi frame per frame.
- **🔨 Impatto allineato al danno**: la martellata si vedeva 3 fotogrammi prima di quando il server fa danno.
  Nuova mappatura a due tratti ancorata al fotogramma d'impatto.
- **👣 Passo agganciato al terreno**: la camminata va a distanza percorsa, non a fps fisso. Niente slittamento,
  e la cadenza si adegua se la velocita' cambia.
- **🎞️ Dissolvenza di 0.14s** fra le animazioni (prima tagli netti) e giro del verso smorzato.
- **👁️ Beholder dall'ondata 10** invece che dalla 15.
- Test: **384 passati, 0 falliti**.

## 🆕 Novita v1.59 (il Beholder smette di essere una boa)
- **🦑 Eyestalks come appendici**: steli curvi con frequenza e fase proprie, non piu' 7 aloni fissi. Spuntano
  da dietro il bulbo e hanno un occhietto con pupilla in punta.
- **👁️ Ammicca** con periodo irregolare, e l'iride **scatta** verso il bersaglio invece di inseguirlo fluida.
- **🪁 Si inclina** nella direzione in cui si sposta.
- **⏳ Il cambio di sguardo si telegrafa sul corpo**: si contrae e drizza gli steli poco prima di cambiare.
  Il server manda `gt` (quanto manca) cosi' il client anticipa invece di reagire.
- Nessuno sprite nuovo: tutta matematica sullo stesso PNG. Test: **367 passati, 0 falliti**.

## 🆕 Novita v1.58 (due nemici senza gambe, Melma che si divide, Beholder col tetto)
- **🍄 Fungo Sporifero** (ondata 5+): **immobile**, semina zone di spore dove sei. Il primo nemico che
  punisce chi resta fermo. Vettoriale, zero asset.
- **💀 Sfera d'Ossa** (ondata 7+): si carica e **rotola in linea retta** rimbalzando sui muri. Ti obbliga a
  schivare di lato. L'animazione e' una rotazione ricavata dallo spostamento: niente frame da disegnare.
- **🟢 La Melma si divide**: alla morte lascia 2 Melme Minori (stesso sprite a raggio ridotto). Le minori
  non si dividono.
- **👁️ Beholder**: entra solo dall'**ondata 15** e ha un **tetto di 8 presenze**; oltre il tetto lo spawn
  ripiega sullo sciame base.
- Test: **361 passati, 0 falliti**.

## 🆕 Novita v1.57 (il mercato e' una SALA SCAVATA)
- **⛏️ Siamo sottoterra**: via case, alberi e staccionate della v1.56. Il generatore parte da **roccia piena**
  e scava la sala; fuori non c'e' mappa, c'e' pietra. Pareti quasi nere.
- **🚪 Un solo varco**, a sud, con il corridoio e il **portale EXIT** in fondo. Gli altri lati sono chiusi.
- **🔥 Buio con la luce dal falo'**: un unico grande alone circolare centrato sul fuoco scopre i banchetti e
  si spegne contro le pareti; le lanterne dei banchi fanno da luci di appoggio.
- **🛖 Cinque banchetti** attorno al fuoco, **piu' grandi dei mercanti**; i mercanti sono al doppio della
  taglia e piu' dettagliati, e stanno dietro al proprio banco.
- **🎛️ Menu di pausa**: il pulsante e' "VAI AL VILLAGGIO" e i due pulsanti stanno affiancati.
- Test: **333 passati, 0 falliti**.

## 🆕 Novita v1.56 (il mercato e' un VILLAGGIO)
- **🏘️ Mappa dedicata**: 32x24 tile invece di 46x34 (**meta' area**), **senza muri interni** — gli unici blocchi
  solidi sono i 5 edifici. Generatore separato da quello delle ondate.
- **🏠 Cinque costruzioni**: Fucina, Locanda, Magazzino, Cappella e Torre della Gilda attorno a una piazza col
  pozzo, con insegne, finestre illuminate e targhe.
- **🧑‍🌾 Cinque abitanti**: il **Fabbro** vende l'equipaggiamento, gli altri quattro sono botteghe **chiuse** —
  i posti gia' pronti per le prossime destinazioni.
- **💡 Villaggio illuminato**: niente maschera della torcia, e la piazza e' ripulita da massi, buche e crepe del
  generatore da caverna.
- Test: **334 passati, 0 falliti**.

## 🆕 Novita v1.55 (costi XP a tabella: primi sei x3, ultimi due x2)
- **✦ Nuova scaletta** (base 10): **90 · 144 · 198 · 555 · 1551 · 4347 · 4926 · 8374**. Massimizzare UNA
  statistica costa **20.185 XP**, piu' di una run intera; l'albero completo 121.110, fuori portata per progetto.
- **📏 Modello di reddito corretto**: le tarature precedenti stimavano l'ondata 2 a ~99 XP, in partita vera ne
  frutta **240**. Una run vale ~18.000 XP, non ~7.500 — ecco perche' il negozio sembrava ancora facile.
- **🧰 I costi sono una tabella** (`STAT_COST_STEPS`), non una formula: si tocca il singolo livello senza
  distorcere il resto della curva.
- Test: **309 passati, 0 falliti**.

## 🆕 Novita v1.54 (esperienza: tronco triplicato, coda smorzata)
- **✦ I primi 6 livelli di ogni statistica costano il TRIPLO**: con base 10 la scaletta passa da
  10/16/22/62/172/483 a **30/48/66/185/517/1449**. La prima ondata frutta ~56 XP e il primo livello ne costa 30:
  si sceglie dove spendere dalla partita numero uno.
- **Il 7° livello e' adeguato** al nuovo tronco (1.352 → 2.463) e l'**8° solo ritoccato** (3.786 → 4.187): la coda
  e' smorzata apposta, altrimenti gli ultimi due livelli sarebbero fuori portata in qualunque run.
- Massimizzare UNA statistica costa ora **8.945 XP**, piu' dell'intera raccolta di una run: il tetto si tocca
  solo giocando la **combo**, che diventa la seconda economia del gioco.
- Test: **312 passati, 0 falliti**.

## 🆕 Novita v1.53 (il mercato si sceglie, il portale si vede, l'esperienza costa)
- **🎯 Il MERCATO e' una destinazione, non una cadenza**: nel menu di pausa fra un'ondata e l'altra ci sono due
  pulsanti — **PROSSIMA ONDATA** e **VAI DAL FABBRO**. Ci vai quando ti serve. In co-op decide chi sceglie per primo.
- **🚪 Il portale EXIT ora si vede**: nel mercato fabbro e portale sono disposti vicino al punto in cui atterri
  (~4 e ~9 tile) invece che nella cella piu' lontana dal centro, che era fuori schermo.
- **✦ Esperienza molto piu' cara**: curva spezzata — i primi 3 livelli costano MENO di prima (10/16/22), poi si
  sale di 2.8x. Massimizzare UNA statistica costa ~5.900 XP, quanto l'intera raccolta di una run; l'albero
  completo ~35.400. Ci si specializza per forza, e la combo diventa la leva vera.
- Test: **309 passati, 0 falliti**.

## 🆕 Novita v1.52 (MERCATO: l'Emporio diventa un luogo, non un pannello)
- **🏪 Mappa MERCATO ogni 3 ondate**: nessun nemico, il **fabbro dell'equipaggiamento** al centro, si prosegue
  entrando nel **portale EXIT**. E' **interstiziale** (non consuma un'ondata), quindi la cadenza dei boss resta
  intatta e la sosta cade dopo il boss — cioe' quando hai appena incassato.
- **🔨 I 3 slot si comprano solo dal fabbro**, avvicinandosi: niente piu' acquisto dal pannello di fine ondata.
- **🧙 Il Mercante Errante resta dov'era**: e' l'incontro nascosto delle ondate normali, con le sue offerte uniche.
- **🐛 FIX grosso: i mercanti erano invisibili.** `merch`/`merchD` non venivano mai copiati dallo snapshot, quindi
  Mercante Errante e Mercante Nero non venivano **mai disegnati** (beacon e marker minimappa compresi): li si
  trovava solo camminandoci addosso.
- Test: **292 passati, 0 falliti**.

## 🆕 Novita v1.51 (level up rivisto: 1 di 3 carte, dieci poteri nuovi, negozio XP severo)
- **🎴 Si sceglie 1 potere su 3** (erano 2 dalla v1.10): il catalogo era cresciuto mentre le pescate calavano.
- **✨ Dieci poteri nuovi** (catalogo 23 → **33**), ispirati ad altri roguelike:

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

- **🔗 Due nuove sinergie**: 🎯 Cacciatore di Teste (Grazia + Piede di Porco) e 🌊 Onda d'Urto (Rappresaglia + Spine).
- **✦ Negozio XP che obbliga a scegliere**: curva da `1.55^n` a `2.05^n` e **tetto di 8 livelli**. Massimizzare
  tutto passa da **3.526** a **17.768 XP**, contro le ~7.528 raccolte in una run: ci si specializza, e la **combo**
  (moltiplicatore XP fino a ×2.5) diventa la leva vera su quanto puoi permetterti.
- **🪙 Emporio a monete nascosto** per ora (`C.SHOP_GEAR_ENABLED = false`): niente è stato rimosso, le monete
  continuano a cadere e i **mercanti** in mappa restano attivi.
- **🎒 Barra dei poteri attivi** sopra la barra abilita: icone, rarita, moltiplicatore e sinergie, con descrizione al passaggio del mouse.
- Test: **273 passati, 0 falliti** + nuova suite `test/client.js` per l'interfaccia (`npm test` lancia entrambe).

## 🆕 Novita v1.50 (consolidamento: curva di difficolta, elite tarati, documentazione riallineata)
- **🌊 Curva di introduzione ripristinata**: i nemici tornano a entrare **scaglionati** — Zombie (1) → Melma (2) →
  Negromante (3) → Troll (4) → Beholder (6). Le comparse "dal primo stage" di v1.44/v1.49 erano temporanee (servivano
  a valutare i nuovi sprite) ed erano rimaste: all'ondata 1 uscivano gia 4 archetipi su 5, tank compreso.
- **⚔️ Elite tarati sui tank**: il moltiplicatore PV degli elite e ora **per-nemico** (`def.eliteHp`, default 2.4).
  Un **Troll elite** all'ondata 4 passa da **~845** a **~528 PV**; gli altri nemici restano invariati.
- **📚 Documentazione riallineata**: `ROSTER.md` riscritto (mancavano Melma e Beholder, il Troll era ancora
  "Bruto"), titolo del README corretto, **checklist di release** aggiornata (commit git al posto dello zip `.txt`,
  con `ROSTER.md` finalmente in lista).
- Test: **256 passati, 0 falliti**.

## 🆕 Novita v1.49 (Beholder: l'Occhio Tiranno torna con lo Sguardo multi-raggio)
- **👁️ Beholder** (ex Occhio Vagante) reintrodotto nel roster: **non spara**, ti **DEBILITA con lo Sguardo** se
  entri nel suo **campo visivo**. Le **eyestalks ruotano** e alternano i tre sguardi (**weaken/slow/sunder**) ogni
  ~4s, con il **fascio che cambia colore**. **Render RASTER PUPPET** (illustrazione ritagliata: `beholder/body.png`)
  con **iride che segue** e **pupilla che si dilata**. tier 3, 130 PV, gittata 340. Nel pool dal primo stage.
- Test: **246 passati, 0 falliti**.

## 🆕 Novita v1.48 (fix Troll: cammina davvero + ombra ai piedi)
- **🐛 Camminata**: i mostri **lenti** (Troll) non restano più in **idle mentre scivolano** — soglie del rilevamento
movimento abbassate con isteresi (0.28/0.10). Ora walk/idle si attivano correttamente.
- **🐛 Grounding**: lo sprite-sheet non **fluttua** più e l'**ombra è ai piedi** (prima l'ombra generica era ~28px sotto).
- Test: **234 passati, 0 falliti**.

## 🆕 Novita v1.47 (Troll delle Caverne: SPRITE SHEET animato)
- **👹 Troll delle Caverne** (ex Bruto): ora reso con un **vero sprite sheet** frame-by-frame (idle/walk/attack, 3 fogli
5×5 @256px) disegnato a mano → **camminata naturale** e **martellata** completa; **mirror L/R** per la direzione.
- **🧩 Nuovo motore sprite-sheet** (`SHEETS`+`_drawSheet`): stato→animazione, frame dal tempo o dalla fase d'attacco,
ancoraggio ai piedi, ombra e hit-flash. Il danno dello slam scatta al 72% dello swing (coincide con l'impatto).
- Test: **234 passati, 0 falliti**.

## 🆕 Novita v1.46 (Bruto senza tremore + Melma TOP-DOWN)
- **👹 Bruto**: camminata **rifatta** (niente più "parkinson"): un dondolio lento, braccia in sincronia, piede che si
solleva morbido; anti‑sfarfallio con **isteresi**. Parti ritagliate meglio.
- **🟢 Melma Corrosiva**: ora è una **pozza fluo vista dall'alto** che **striscia** (wobble + edge‑glow), mantiene lo
**sputo di bolle d'acido** ad alto danno.
- Test: **226 passati, 0 falliti**.

## 🆕 Novita v1.45 (Melma: striscia + salta e sputa acido)
- **🟢 Melma Corrosiva rifatta**: ora **striscia** lenta (niente più saltelli su‑e‑giù); il **salto** avviene **solo
in attacco**, quando **sputa un ventaglio di bolle d'acido ad ALTO danno** a distanza ravvicinata (IA blob).
- **🎨 Sprite senza bocca** + **edge‑glow** verde; **occhi che si illuminano nella direzione di movimento**.
- Test: **226 passati, 0 falliti**.

## 🆕 Novita v1.44 (Melma Corrosiva squash&stretch + Bruto affinato)
- **🟢 Melma Corrosiva** (4° puppet): blob acido in **squash & stretch** (respira, saltella appiattendosi/allungandosi,
schizza in avanti) con **aura verde**, **nucleo pulsante**, occhi che avvampano e **bolle acide**. Nel pool dal 1° stage.
- **👹 Bruto**: la camminata ora **solleva i piedi** (falcata più ampia) e lo **slam è più impattante** (doppia onda + polvere + hit-stop + scossone).
- Melma e Bruto compaiono **dal primo stage** per valutazione. Test: **221 passati, 0 falliti**.

## 🆕 Novita v1.43 (Bruto ridisegnato, vagabondaggio & anti-incastro)
- **👹 Bruto**: camminata **lumbering** distinta dallo zombie (braccia in sincronia, waddle) e **SLAM overhead** —
alza i pugni sopra la testa e li **schianta a terra** (area + forte respinta) quando entri nel suo campo visivo.
- **🧭 Vagabondaggio**: i nemici che **non ti vedono** ora **vagano a caso** per la mappa (ti inseguono solo quando ti individuano).
- **🧱 Anti-incastro**: nessun nemico (**boss compresi**) resta più incastrato — rilevatore di wedge + recupero/scivolamento.
- Test: **213 passati, 0 falliti**.

## 🆕 Novita v1.42 (Bruto delle Caverne: tank PUPPET con slam ad area)
- **👹 Bruto delle Caverne** (3° puppet, tank): enorme e lento, **braccia enormi** con grande dondolio in camminata e
**SLAM ad area** in due tempi (carica → schianto del busto in avanti/giù) con onda d'urto e respinta. Nel pool dall'ondata 4.
- **🖼️ Artwork del bestiario** aggiunti in `public/assets/art/` (overview + concept del Bruto); `ROSTER.md` aggiornato.
- **🟣 Incluso:** sfere del Negromante +30% (`projSpeed` 250→325, da v1.41).
- Test: **206 passati, 0 falliti**.

## 🆕 Novita v1.39 (Negromante PUPPET + motore puppet generico + migliorie)
- **🧙 Negromante** (2° puppet): fluttua, **evoca zombi minori** (max 4) e **spara sfere debilitanti** (curse) **solo quando entri nel suo campo visivo** (cono fov con telegrafo). Nel pool dall'ondata 3.
- **🧩 Motore puppet generico** (`PUPPETS[key]` + `PROF[key]`): nuovo nemico = "manifest + profilo".
- **✨ Migliorie a tutti i puppet:** hit-reaction (squash+rinculo), **morte con crollo dei pezzi**, inclinazione nel movimento, ombra dinamica, tint per gli **elite**.
- Test: **193 passati, 0 falliti**.

## 🆕 Novita v1.38 (occhi che avvampano al colpo · via il cerchio verde)
- **👁️ Occhi verdi che avvampano** quando lo zombie viene colpito (feedback di danno); lampo verde anche di spalle.
- **🟢 Rimosso il cerchio verde** attorno al nemico (disco veleno + alone puppet reso molto tenue).
- Test: **190 passati, 0 falliti**.

## 🆕 Novita v1.37 (roster essenziale: SOLO lo Zombie Putrido in render PUPPET)
- **🧟 Un solo nemico d'ondata**: rimossi Negromante, Spettro e Occhio Vagante. Lo **Zombie Putrido** è ora reso col
**RENDER PUPPET** (6 pezzi PNG + overlay vettoriale) e **sostituisce** il vecchio zombie vettoriale.
- **🎞️ Attacco in due tempi** (carica → colpo) con **affondo del corpo in avanti**.
- **🌑 Ombra a terra sfocata** alla base dei piedi (radica il mostro sulla mappa) e **camminata più aggressiva e lenta**.
- Test: **190 passati, 0 falliti**.

## 🆕 Novita v1.35 (Troll rimosso · Mercante Nero riempito · Occhio Vagante: lo Sguardo)
- **🗑️ Troll rimosso**: il Troll delle Caverne esce dal roster (sprite non convincente). Pool a **4 archetipi**:
  Zombie · Spettro · Negromante · Occhio Vagante.
- **🖤 Fix Mercante Nero "vuoto"**: il box appariva centrato ma senza offerte. Le card ora si **ricostruiscono solo
  al cambio offerta** (prima venivano ricreate ~20 volte/sec, riavviando l'animazione d'ingresso → restavano invisibili).
- **👁 Occhio Vagante — attacco "Sguardo"**: non spara più. Se sei nel suo **campo visivo** (cono, con LOS libera)
  subisci un **debuff** che si rinnova finché resti sotto lo sguardo. Tre tipi (uno per occhio): **weaken** (attacco
  indebolito), **slow** (velocità ridotta), **sunder** (meno difesa). **Sprite -20%** e **tentacoli tutt'intorno** al bulbo,
  con **fascio dello sguardo** colorato per tipo. Test: **176 passati, 0 falliti**.

## 🆕 Novita v1.32 (Bestiario ampliato: Spettro & Occhio Vagante, Troll rifinito, Mercante Nero al top)
- **👻 Spettro (nuovo)**: nemico etereo/translucido, veloce, con **occhi ardenti** e corpo che sfuma in code
  ondulate. IA **`wraith`**: si avventa in mischia e **"sfasa" (phase-blink)** verso di te attraversando gli
  ostacoli. Nel pool dall'**ondata 2** (tier 2, 92 PV).
- **👁️ Occhio Vagante (nuovo)**: bulbo oculare fluttuante con **eye-stalks** e tentacoli, iride che segue e
  pupilla che dilata in attacco. IA **`strafer`**: orbita a distanza e scaglia **raggi arcani**. Nel pool
  dall'**ondata 4** (tier 3, 118 PV, gittata 320).
- **🪓 Troll rifinito**: braccia massicce **senza mani/artigli**, occhi **rossi**, animazioni di passo/respiro.
- **💀 Mercante Nero "al top"**: veste con gradiente, **bordo runico pulsante**, spalle a punta bordate,
  volto-teschio con occhi viola ardenti e **mani ossute** che presentano la merce; beacon a doppia colonna.
- **🧟 Pool a 5 archetipi**: Zombie · Spettro · Negromante · Occhio Vagante · Troll. Test: **177 passati, 0 falliti**.

## 🆕 Novita v1.31 (Ampolla della salute, Troll anticipato, Mercante Nero al centro)
- **🧪 Ampolla dei Punti Salute**: gli HP sono ora una **boccetta** che si riempie di liquido rosso in base alla
percentuale di salute (numero PV al centro), con la fila **VITE** e i cuori sotto. Spostata **a fianco della barra
abilità** e resa **molto più grande**; sotto il 30% pulsa in rosso acceso.
- **👹 Troll dall'ondata 3**: il Troll delle Caverne entra nel pool già dalla wave 3 (prima dalla 5).
- **🕯️ Mercante Nero centrato**: la sua finestra compare al **centro dello schermo** con velo scuro di sfondo;
il Mercante Errante normale resta in basso.

## 🆕 Novita v1.30 (Bestiario essenziale: Zombie, Negromante, Troll in vista frontale)
- **👾 Roster ridotto a 3**: rimossi tutti gli altri nemici delle ondate. Restano **solo Zombie Putrido, Negromante e
Troll delle Caverne**, tutti ridipinti in **grigio molto molto scuro** con occhi/accento luminosi per la personalità.
- **🪤 Mimic mantenuto come cassa**: la **Bestia Mimica** resta nel gioco **solo come cassa-mima** (e in modalità Tesoro),
fuori dal pool delle ondate — aprire una cassa-mima evoca di nuovo un vero mimic.
- **🖼️ Vista FRONTALE (billboard)**: i tre mostri **guardano la camera**, si specchiano verso il movimento e mostrano il
dorso quando si allontanano — nuovo stile **dark-cartoon** ricco di dettaglio (mascella che si spalanca sullo zombie,
cappello + bastone-orbe sul negromante, braccia-mazza e zanne sul troll). Test: **175 passati, 0 falliti**.

## 🆕 Novita v1.29 (Negromante: proiettili in vista, evocazioni al buio)
- **🧙 IA reattiva alla linea di vista**: il **Negromante** spara **proiettili magici** quando ti ha **nel campo visivo**
(LOS libera e in gittata); se invece sei **nascosto** dietro i muri, **evoca scheletri** (2 ogni 8s) e **avanza** per stanarti.
- **🟣 Evocazione viola**: l'anello dell'evocazione ora usa il colore del mostro (viola per il Negromante).

## 🆕 Novita v1.28 (maledizione del Negromante + cunicoli a prova di boss)
- **💀 Maledizione**: gli incantesimi del Negromante fanno danno **e** indeboliscono per **4,5s** (danno −40%,
velocità −20%), con notifica **"SEI STATO MALEDETTO"** e aura viola sul personaggio.
- **🕳️ Cunicoli boss-proof**: nuova passata che allarga i colli di bottiglia a **≥3 tile** → **100%** delle mappe
ora fa passare anche il mega-boss (prima 83%). Verificato su 2100 mappe.

## 🆕 Novita v1.27 (braccia ai lati & rimozione Predone Goblin)
- **🦾 Zombie**: le braccia ora scendono **lungo i fianchi** a riposo e si protendono **in avanti solo in attacco**(via l'effetto "insetto"). Testa già centrata.
- **🗑️ Rimosso il Predone Goblin**: tolto dal roster; il Signore della Guerra ora evoca **Zombie**, ondate e
fallback usano lo **Zombie Putrido**. Roster: **9 nemici** + 3 boss. Test: **180 passati, 0 falliti**.

## 🆕 Novita v1.26 (nemici ridisegnati + animazioni attacco/morte)

Tre nemici **ridisegnati** (dark-fantasy vettoriale) con nuove animazioni di **attacco** e **morte** (idle/camminata
già presenti): **🧟 Zombie Putrido** (braccia protese, occhi neri, morso), **🧙 Negromante** (cappuccio, occhi viola,
orbe che divampa) e **🪓 Orco Berserker** (ascia a doppia lama, zanne, fendente). Alla morte i nemici **crollano e
svaniscono** (il negromante si **dissolve in volute viola**). Solo questi **3** per ora. Canvas 2D puro, zero dipendenze.

## 🆕 Novita v1.25 (terzo lotto di oggetti scenografici)
Aggiunti **6 nuovi oggetti** (per tema, cap 3-4): **🌉 ponti di legno**, **🪜 scale a chiocciola**, **⛲ pozzi/cisterne**
(acqua luminosa), **⚙️ grate/inferriate**, **💠 cristalli giganti** (landmark luminoso) e **🗿 statue rituali con
gemma** (luminosa). Con i 3 lotti la mappa ha ora **18 oggetti scenografici** totali.

## 🆕 Novita v1.24 (secondo lotto di oggetti scenografici)
Aggiunti **6 nuovi oggetti** (per tema, cap 3-4): **🏛️ archi diroccati**, **🧊 stalattiti**, **☠️ forche/patiboli**,
**🔮 obelischi arcani** (rune pulsanti + glow), **🏮 lanterne appese** (illuminano) e **🩸 macchie di sangue** a terra.
Distribuiti come **zone tematiche coerenti** legate ai biomi (Cripta/Lava/Foresta/Ghiaccio/Arcano).

## 🆕 Novita v1.23 (muri neri, terreno vivo, nuovi oggetti & fix mercante)
1. **🖤 Muri QUASI NERI** (contrasto 0.50→0.15) nettamente staccati dal pavimento; **terreno meno piatto** con rocce,
   massi, ciottoli e buche sparse.
2. **⚡ Crepe grandi** (2-3 per mappa, molto piu grandi) al posto delle rune pulsanti (rimosse).
3. **🗿 6 nuovi oggetti scenografici** (per tema): stalagmiti, pile di teschi, macerie, ragnatele giganti, cristalli
   luminosi, altari rituali. Cap 3-4 per tipo.
4. **🐀 Animaletti piu grandi** (~2x). **🛒 Mercante Errante**: fix del click + beacon sempre visibile + marker minimappa.

## 🆕 Novita v1.22 (caverna organica, ombre nette, animaletti & cluster)
1. **🗺️ Conformazione ORGANICA** (caverna varia) al posto del layout a stanze "piatto"; connettivita garantita.
2. **🖤 Muri a contrasto 0.50** + **ombra MARCATA** muro→pavimento (linea di contatto scura): stacco netto.
3. **🐀 Animaletti** (ratti, ragni, scarafaggi) che sfrecciano sul pavimento evitando i muri.
4. **🕯️ Decorazioni a CLUSTER** coerenti (cimitero/ossario/deposito/fungaia/gabbia), **max 3-4 per tipo**; solo le
   **torce** restano numerose. **Casse scenografiche** + **mimic solo dalle casse** (casse-mima al 30%).

## 🆕 Novita v1.21 (muri quasi neri, nebbia volumetrica & rune pulsanti)
1. **🖤 Muri MOLTO piu scuri** (quasi neri): la roccia dei muri e scurita ~30% del colore del tema, distinta dal
   pavimento (invariato).
2. **🌫️ Nebbia volumetrica a strati** che deriva lentamente + **rune/crepe che pulsano** sul pavimento (glow del
   colore del tema, visibili anche nel buio della torcia).
3. **🗑️ Rimossi** laghi/pozze, colonne, pilastri e statue.

## 🆕 Novita v1.20 (stanze grandi, pozze-lago & decorazioni ricche)
1. **🏛️ Layout a STANZE** — stanza centrale grande + 4 stanze angolari (NO/NE/SO/SE) con **corridoi larghi 3 tile**:
   il **boss passa ovunque**, niente piu cunicoli stretti o nemici incastrati. Connettivita garantita.
2. **💧 Pozze naturali** — solo 1-2 per mappa, forma organica tipo **lago** (desaturata, con profondita), del colore del tema.
3. **🕯️ Decorazioni ricche e bilanciate** — bracieri e candelabri (che illuminano), funghi bioluminescenti, casse,
   barili, sacchi, statue demoniache (occhi luminosi), gabbie sospese con scheletro, pilastri.

## 🆕 Novita v1.19 (texture roccia realistica, stanze attigue & niente glow)
1. **🪨 Texture ROCCIA realistica** su pavimento e muri: rilievo/bump (illuminazione 3D), domain-warp, crepe, umidita e
   muschio — colorata sul tema. Canvas 2D puro, zero dipendenze.
2. **🚪 Mappa meno "quadratona"** — tramezzi con varchi creano **stanze minori attigue** (connettivita garantita).
3. **🚫 Glow rimosso** (bloom + tasto B): schermo piu pulito. Restano torcia (L) e alone tondo.

## 🆕 Novita v1.18 (caverna vera: terra/roccia, pozze uniche & decorazioni)
1. **🕳️ Look da CAVERNA** — pavimento "terra" e muri "roccia" organici, **senza griglia** (mottling + ombre ai bordi).
2. **🩸 Pozze come forma UNICA irregolare** con profondita (conca scura + centro scuro), del colore del tema.
3. **🪦 Decorazioni ripristinate** (bare, scheletri, accampamenti, rocce...) e mix per tema di nuovo ricco.
4. **🔥 Torce molto meno frequenti** e irregolari (niente piu griglia di aloni).

## 🆕 Novita v1.17 (dungeon di pietra: mappa ripulita, pozze & torce ai lati)
1. **⭕ Alone tondo grande** attorno all'eroe (niente piu cono direzionale); mappa un filo meno scura.
2. **🧱 Pavimento e muri in pietra** (lastre + blocchi) e **mappa ripulita** (molte meno decorazioni "alla rinfusa").
3. **☠️ Pavimento rivisto**: via spuntoni e "pallini"; ora **pozze** acido/fuoco/freddo/arcano **del colore della mappa** che brillano.
4. **🔥 Torce ai lati** della mappa (perimetro) come nuove fonti di luce.

## 🆕 Novita v1.16 (torcia nel buio: mappa oscura & cono di luce)
1. **🔦 Modalita torcia** — mappa quasi nera "bucata" da un **cono di luce** nella direzione di mira + alone attorno
   al giocatore. Torce, proiettili e sorgenti restano visibili; boss/elite si intravedono. Tasto **`L`** on/off.
2. **🌑 Bloom piu tenue** — glow generale ridotto (0.85→0.5): resta su nemici/spari/eroi/effetti senza esagerare.
3. **✨ Pulviscolo ambientale** — polvere che fluttua e brilla nel fascio di luce (atmosfera).

## 🆕 Novita v1.15 (dungeon neon: bloom & glow)
1. **🌟 Bloom / glow diffuso** — proiettili, torce, occhi dei nemici e accenti degli eroi "irradiano" luce (look
   twin-stick moderno) restando nel **tema dungeon cupo**. Canvas 2D puro, offscreen a bassa risoluzione: leggero.
2. **🔫 Proiettili neon** — nucleo bianco + alone saturo + scia: vere scie luminose.
3. **👁️ Nemici emissivi** — alone colorato attorno a ogni mostro (piu forte per elite/boss), stile "orb neon".
4. **⌨️ Tasto `B`** per attivare/disattivare il bloom (salvato) — utile sui PC lenti.

## 🆕 Novita v1.13 (entita un po' piu grandi, senza perdere fluidita)
1. **🔎 Personaggio, nemici, boss e prop piu grandi** (visivo +45%) per un colpo d'occhio piu imponente.
2. **⚡ Fluidita preservata** — la collisione resta quasi invariata (~1.08x, come la v1.12) e c'e un **+5% velocita**:
   occhi grandi, hitbox piccola. Nessuna modifica a mappa/densita.
3. **🔧 Fix Mercante Nero** — a fine round compare **un solo** mercante: il Nero **al posto** di quello ufficiale
   (~30%), altrimenti l'ufficiale. Mai entrambi.

## 🆕 Novita v1.12 (Mercante Nero & HUD ridisegnato)
1. **💀 Mercante Nero** — secondo mercante sinistro (teschio, altare, lanterna viola) con **patti rischio/ricompensa**:
   potenziamenti forti ma con una maledizione. Ben differenziato dal Mercante Errante.
2. **🎲 Apparizione casuale** — il Mercante Nero non e sempre presente: compare a caso (~35%) e si nasconde lontano.
3. **🎨 HUD ridisegnato** — barra abilita piu grande e caratteristica (icone grandi, etichette, pulsazione);
   gli **eventi ora compaiono al centro**, grandi e molto visibili.

## 🆕 Novita v1.11 (mercante, creature & attacchi alla Hades)
1. **🧙 NPC Mercante Errante** — appare in mappa (spesso in una micro-area); avvicinati per comprare **3 offerte
   casuali** con le monete (cura, +PV, arma, potere, vita, buff).
2. **👹 Nemici ridisegnati** — non piu pallini: creature dettagliate con corpo, arti, corna, zanne, ali e occhi.
3. **⚔️ Attacchi vari (stile Hades)** — **zone telegrafate** a terra, **ventagli** di proiettili, **raffiche** e **affondi**.
4. **🕯️ Mappe piu scure + micro-aree** — nicchie/stanzette laterali arredate; illuminazione piu intima e cupa.
5. **🐛 Fix movimento** — risolto il blocco del personaggio (era lo scatto col tasto destro che azzerava i tasti).

## 🆕 Novita v1.10 (icone emporio, poteri & dungeon tetri)
1. **🎨 Icone emporio uniche per personaggio** — armatura, stivali e arma hanno icone-immagine dedicate e
   **diverse per i 3 eroi** (dalla v1.66: Guerriero acciaio, Mago viola, Ladro verde).
2. **🎴 Piu poteri, scelta tra 2** — catalogo boon ampliato (23 totali, +6 nuovi); a fine ondata si sceglie 1 di 2.
3. **🛒 Emporio a 3 slot e piu costoso** — rimossi Anello e Amuleto; oggetti molto piu cari (scelta di lungo periodo).
4. **🪦 Dungeon piu tetri** — tombe, cadaveri, strumenti di tortura, gabbie, piu ragnatele/catene/teschi; atmosfera oscurata.
5. **🐛 Fix "movimento autonomo"** — azzeramento input su perdita focus/chat: niente piu personaggio che si muove da solo.

## 🆕 Novita v1.9 (pausa, nuove abilita & scenografia)
1. **⏸️ Pausa nel negozio** — a fine ondata (scelta poteri / negozio / emporio) il mondo si **congela**;
   in singolo riparte solo col tasto **Continua**. I drop rimasti a terra vengono **raccolti in automatico**.
2. **⚔️ 2 abilita per eroe + nuove** — 🎯 **Torretta Schierabile** (Enforcer) e 🎯 **Colpo del Cecchino**
   (Recon, sostituisce lo scatto ridondante). Lo **scatto** universale (tasto destro) resta invariato; Glitch mantiene
   Bullet-Time + Frattura di Dati.
3. **🏛️ Piu elementi scenografici** — colonne, cristalli, statue, funghi, catene, pozze, stendardi, sarcofagi.
4. **🏷️ Versione nel titolo** — mostrata nella scheda del browser e come badge nel menu.

## 🆕 Novita v1.8 (monete & emporio equipaggiamento)
1. **🪙 Monete di vario taglio** — i nemici droppano monete oltre all'XP: 🟤 Bronzo (1),
   ⚪ Argento (5), 🟡 Oro (20). Boss ed elite ne lasciano di piu; raccolta con calamita come l'XP.
2. **🏪 Emporio dell'equipaggiamento** — un secondo negozio (a monete) con **3 slot** (Armatura, Stivali, Arma) potenziabili per
   **5 tier**: 🛡️ Armatura, 👟 Stivali, ⚔️ Arma, 💍 Anello, 📿 Amuleto.
   Ogni tier costa piu del precedente: costruisci il tuo personaggio nel tempo.
3. **Due economie complementari** — **XP** per micro-potenziamenti ripetibili, **monete** per equipaggiamento a slot.

## 🆕 Novita v1.7 (stats, ricompense combo & sinergie)
1. **🏆 Schermata di fine partita con statistiche** — riepilogo della run con **classifica co-op**
   (uccisioni, **combo massima** 🔥, danni, boon, sinergie e arma) e **durata** ⏱, con medaglie 🥇🥈🥉.
2. **🔥 Ricompense combo a soglie** — la combo ora sblocca bonus: **15** = Frenesia (cadenza),
   **25** = Nova ad area, **40** = Cura + Egida. Mantenere la catena diventa una scelta tattica.
3. **🔗 Sinergie tra Boon** — coppie compatibili sbloccano effetti potenziati: **Deflagrazione Tossica**
   (Tossina+Esplosivi), **Catena Gelida** (Catena+Gelo), **Cercatore** (Homing+Perforazione), **Sete di Sangue**
   (Vampirismo+Adrenalina).

## 🆕 Novita v1.6 (combo, minimappa & homing)
1. **🔥 Sistema COMBO / streak** — le uccisioni consecutive riempiono un **combo meter**: ogni catena
   fa salire un **moltiplicatore di XP** (fino a **x2.5**). Se smetti di uccidere per qualche secondo la combo
   **decade** e riparte da zero. Punteggi alti = crescita esponenziale (stile Hades / Vampire Survivors).
2. **🗺️ Minimappa in tempo reale** — in basso a sinistra: muri, portale d'uscita, **alleati**,
   **nemici** (con boss in rosso ed **elite** in oro) e lo **scrigno del tesoro** 👑. Colpo d'occhio
   costante sul campo di battaglia, utile soprattutto in co-op fino a 6.
3. **🎯 3 nuovi Boon** — **Mira Guidata** (proiettili che curvano verso i nemici),
   **Avidita** (+30% XP raccolta, potenzia le combo) e **Baluardo** (-12% a tutti i danni subiti).

## ✨ Novita v1.5 (profondita & game feel)
1. **🎴 Poteri a scelta (stile Hades)** — a fine ondata scegli **1 di 3 carte** con **effetti unici e impilabili**:
   Rimbalzo, Perforazione, **Catena di Fulmini**, **Tossina** (veleno), **Colpi Esplosivi**, Onda di Ritorno,
   Vampirismo, Sdoppiamento, Occhio di Falco, Proiettili Giganti, **Tocco Gelido**, Aura di Spine,
   Adrenalina Pura, Scudo Vitale. Combinali per creare **build** sempre diverse.
2. **💥 Hit-stop + evoluzione armi** — micro **freeze-frame** sui critici e sulle uccisioni di boss/élite
   (game feel "pesante"). Porta un'arma a **Lv.3** con la statistica giusta e si **evolve** in una versione
   potentissima con nome proprio (Uragano d'Acciaio, Tempesta di Piombo, Lancia del Giudizio).
3. **🌊 Modalità ondata** — ogni ondata è un evento diverso: **Orda** (sciami), **Caccia** (élite),
   **Sopravvivenza** (resisti al timer), **Tesoro** 👑 (uccidi lo scrigno fuggitivo prima che scappi con il loot),
   Assalto (standard).

Include (dalle versioni precedenti): sistema di **vite** (2), **XP raccoglibile + negozio statistiche**,
**item drop** (pozioni, stivali, corazza, casse armi, +100% danno, invulnerabilità, Cuore Fenice),
**20 livelli** con **MEGA boss finale** AZ'GAROTH, **temi mappa** (Cripta, Lava, Foresta, Ghiaccio, Arcano),
dash che attraversa i nemici, 3 armi raccoglibili, musica tetra da dungeon, casse con bonus/mimic,
3 classi (guerriero, mago, ladro), 10 mostri + boss, netcode autoritativo.

## 🗂️ Architettura (file dedicati)
```
shared/  constants (VERSION), mathutils, loot (BOON + EVO + item + XP + equipaggiamento), monsters (roster + boss),
         heroes, mapgen (temi), pathfinding, ai (swarm/necromancer/brute/blob/gazer), waves (MODALITÀ + pool + scaling)
server/  index, ws, Room (boon, hit-stop, modalità, evoluzioni, vite, XP, combo, evocazioni, anti-incastro)
public/  index.html (scelta boon + badge versione), style.css
public/js/ net, input, audio, renderer (puppet + sprite-sheet + boon-fx + MINIMAPPA), hud, main
public/assets/enemies/  pezzi raster + manifest dei mostri (ghoul, mage, brute, slime, beholder, troll_sheet)
public/assets/art/      artwork del bestiario
tools/   slicer e anteprime rig — Python offline, NON servono a runtime
test/    simulate.js — suite headless server (273 test) · client.js — smoke test interfaccia (DOM finto)
```

Buon divertimento nel Rift! 🗡️
