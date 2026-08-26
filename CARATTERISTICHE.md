# ⚔️ DUNGEON RIFT — Caratteristiche complete del gioco

**Versione attuale:** `1.61.1`
Roguelike co-op frenetico per **fino a 6 giocatori**, motore **custom a dipendenze zero** (Node.js + Canvas 2D):
niente `npm install`, niente asset esterni — grafica, musica ed effetti sono **generati proceduralmente**.

---

## 🦇 Lo sciame e il fuoco fatuo *(novita v1.61)*
- **Nugolo di Pipistrelli**: non e' un nemico, e' **nove pipistrelli** che si muovono insieme. Poca vita, ma
  arriva prima di quanto tu possa allontanarti, e **non vola dritto**: serpeggia, quindi sparare dove si trova
  non basta — bisogna sparare dove sara'.
- **Fuoco Fatuo**: **passa attraverso la roccia**. E' l'unico nemico contro cui mettersi al riparo non serve a
  niente; in compenso e' lento, e la risposta giusta e' continuare a muoversi. Quando ti raggiunge ti **succhia
  vita e si cura** con quella che ti ha tolto.
- Nessuno dei due ha un'immagine: sono matematica, come il Fungo e la Sfera d'Ossa. Il vincolo tecnico
  (niente animazioni di camminata complesse) e' di nuovo il criterio con cui sono stati scelti.
- Il **Nugolo entra dall'ondata 6**, il **Fuoco Fatuo dall'ondata 8** *(v1.61.1)*. In quest'ordine perche' il
  Nugolo insegna a **guidare il tiro** e il Fatuo **toglie il riparo**: prima si impara una risposta, poi si
  scopre che contro qualcosa non basta. Ora c'e' un archetipo nuovo per ogni ondata dalla 1 alla 8.
- Il **Fungo Sporifero** non si sposta piu' se lo urti: e' piantato per davvero.

## 🪓 Il Troll smette di essere legnoso *(novita v1.60)*
- Con le lastre nuove, tre difetti che sembravano di disegno erano in realta' **di numeri**, trovati misurando
  i fotogrammi uno per uno: l'attacco era ancorato 11px troppo in alto (il troll *saltava* colpendo), la
  martellata si vedeva **tre fotogrammi prima** del momento in cui il danno arriva davvero, e il passo andava
  a cadenza fissa mentre il corpo si muoveva a un'altra velocita' (i piedi slittavano).
- Ora le tre animazioni poggiano sulla stessa linea, l'impatto coincide con il danno, e il **passo e'
  agganciato alla distanza percorsa**: se il troll rallenta o accelera, la camminata lo segue.
- I passaggi fra fermo, cammino e attacco hanno una **dissolvenza**, e il cambio di direzione e' un giro
  invece di uno specchiamento istantaneo.
- Il **Beholder** compare dall'ondata 10 invece che dalla 15.

## 👁️ Il Beholder smette di essere una boa *(novita v1.59)*
- Gli **eyestalks** non sono piu' sette aloni fissi: sono **steli curvi** che ondeggiano ognuno con la sua
  frequenza, spuntano da dietro il bulbo e hanno un occhietto con pupilla in punta.
- **Ammicca** a intervalli irregolari, e l'iride **scatta** verso il bersaglio invece di inseguirlo in modo
  continuo: e' lo scatto a farlo sembrare vivo.
- **Si inclina** nella direzione in cui si muove, invece di ondeggiare sempre uguale.
- Poco prima di cambiare tipo di sguardo **si contrae e drizza gli steli**: il cambio ora si vede sul corpo,
  non solo dal colore del fascio.
- Tutto questo senza nessuno sprite nuovo.

## 👾 Tre aggiunte al bestiario, nessuna con le gambe *(novita v1.58)*
- **🍄 Fungo Sporifero** (dall'ondata 5): **non si muove mai**. Se ti vede semina zone di spore telegrafate
  dove ti trovi. E' il primo nemico che rende pericoloso restare fermi.
- **💀 Sfera d'Ossa** (dall'ondata 7): si carica, poi **rotola in linea retta** rimbalzando sui muri e
  travolgendo chi trova. Ti obbliga a schivare di lato, cosa che nessun altro nemico faceva.
- **🟢 La Melma Corrosiva si divide**: alla morte lascia due **Melme Minori**. Le minori non si dividono a
  loro volta.
- **👁️ Il Beholder e' stato messo al guinzaglio**: compare solo dall'**ondata 15** e non piu' di **8 alla
  volta**. Il tetto vale anche in Sopravvivenza.
- Entrambi i nemici nuovi sono disegnati **senza sprite e senza cicli di camminata**: uno sta fermo,
  l'altro rotola. Il vincolo tecnico e' diventato il criterio con cui sono stati scelti.

## ⛏️ Il mercato e' una SALA SCAVATA *(novita v1.57)*
- Siamo **sottoterra**, e ora si vede: niente case, alberi o staccionate. Il mercato e' una **camera scavata
  nella roccia**, con pareti quasi nere. Fuori dalla sala non c'e' mappa: c'e' pietra piena.
- **Un solo varco**, a sud, largo tre tile, su un corridoio corto con il **portale EXIT** in fondo.
- **Buio, e la luce nasce dal falo'** al centro: un unico grande alone circolare scopre i cinque banchetti e
  si spegne contro le pareti. Le lanterne appese ai pali dei banchi fanno da luci di appoggio.
- **Cinque banchetti** a ferro di cavallo attorno al fuoco — bancone, tendone a strisce, lanterna e merce
  diversa per mestiere — **piu' grandi dei mercanti**. Il **Fabbro** e' l'unico che vende; **Rigattiere,
  Ostessa, Cartomante ed Erborista** sono ancora chiusi.
- I **mercanti** sono al doppio della taglia e piu' dettagliati (mantellina, cintura, pieghe, mani, occhi
  accesi, l'attrezzo del mestiere), e stanno **dietro** al proprio banco.
- Nel menu di pausa il pulsante e' **"VAI AL VILLAGGIO"**, affiancato a quello dell'ondata successiva.

## 🏘️ Il mercato e' un VILLAGGIO *(novita v1.56)*
- La sosta ha una **mappa sua**, disegnata a mano: **32x24 tile** contro le 46x34 del combattimento (circa la
  **meta'**), **senza muri interni**. Gli unici ostacoli sono i cinque edifici, che sono blocchi solidi.
- **Cinque costruzioni** attorno a una piazza col pozzo: **Fucina, Locanda, Magazzino, Cappella e Torre della
  Gilda**, ognuna con tetto, finestre illuminate, insegna sopra la porta, lanterna e targa col nome.
- **Cinque abitanti**: il **Fabbro** e' l'unico che vende (i 3 slot dell'equipaggiamento). **Erborista,
  Locandiere, Cartomante e Banditore** sono botteghe **ancora chiuse** — e lo dichiarano — pronte a diventare
  le prossime destinazioni.
- Il villaggio e' **illuminato**: niente torcia, niente buio. La piazza e' ripulita dai detriti da caverna;
  restano pozzo, lampioni, banchi, casse, barili, alberi, staccionate e il cartello MERCATO.
- Si arriva da sud: il fabbro e' a 7 tile, il portale **EXIT** a 13, con la via centrale sgombra.

## ✦ Costi XP a tabella: primi sei x3, ultimi due x2 *(novita v1.55)*
- Scaletta dei costi con base 10: **90 · 144 · 198 · 555 · 1551 · 4347 · 4926 · 8374**. Il primo livello costa
  90 contro i ~130 XP della prima ondata: se ne compra uno solo, e va scelto.
- Portare **una sola** statistica al tetto costa **20.185 XP**, piu' di quanta se ne raccolga in una run intera
  (~18.000). L'albero completo, 121.110, e' fuori portata per progetto: non esiste una run che massimizzi tutto.
- I costi sono una **tabella** di moltiplicatori, uno per livello, non una formula: si ritocca il singolo
  livello senza deformare il resto della curva.
- *Nota:* il 7° livello costa solo il 13% piu' del 6°, mentre ogni salto precedente e' +180%. E' un gradino
  piatto voluto dal ritocco (tronco x3, coda x2): se in partita sembra regalato, e' il primo numero da alzare.

## ✦ Esperienza: tronco triplicato, coda smorzata *(novita v1.54)*
- I **primi sei livelli** di ogni statistica costano il **triplo** di prima: con base 10 la scaletta e'
  **30 · 48 · 66 · 185 · 517 · 1449**. La prima ondata frutta circa 56 XP e il primo livello ne costa 30, quindi
  si decide dove spendere fin dall'inizio.
- Il **settimo** livello e' adeguato al nuovo tronco (2.463) e l'**ottavo** solo ritoccato (4.187): la coda e'
  volutamente smorzata, altrimenti gli ultimi due livelli sarebbero irraggiungibili in qualsiasi partita.
- *(Superata dalla v1.55, che ha triplicato ancora il tronco e raddoppiato la coda — vedi sopra.)*

## 🎯 Il mercato si sceglie, il portale si vede, l'esperienza costa *(novita v1.53)*
- **Destinazioni nel menu di pausa.** Fra un'ondata e l'altra, dopo la carta e il negozio XP, scegli dove
  andare: **prossima ondata** oppure **dal fabbro**. Il mercato non arriva piu' a cadenza fissa: ci vai quando
  ti serve, a qualunque ondata. In co-op vale la scelta di chi preme per primo.
- **Il portale EXIT si vede.** Nella mappa del mercato il fabbro sta a poche tile dal punto in cui atterri e il
  portale poco oltre, dalla parte opposta: prima compri, poi esci. Prima l'uscita era la cella piu' lontana dal
  centro della mappa, quindi fuori schermo.
- **Esperienza molto piu' cara.** Curva spezzata in due regimi: primi 3 livelli quasi lineari, poi x2.8 a
  livello. *(Superata dalla v1.54, che ha triplicato tutto il tronco — vedi sopra.)*

## 🏪 Il MERCATO: l'Emporio diventa un luogo *(novita v1.52)*
- Ogni **3 ondate** si entra in una **mappa di sosta senza nemici**. Al centro c'e' il **fabbro
  dell'equipaggiamento**: i 3 slot (Armatura, Stivali, Arma) si potenziano avvicinandosi a lui, non piu' da un
  pannello a fine ondata. Si prosegue entrando nel **portale EXIT**, evidenziato con colonna di luce ed etichetta.
- La sosta e' **interstiziale**: non consuma un numero d'ondata, quindi i boss restano ogni 5 e il mercato li
  **segue**. E' anche il momento in cui hai piu' monete: il grosso del bottino di una run arriva dai boss.
- Nel mercato **non** ci sono casse (una cassa-mima sarebbe un nemico in una stanza che promette sicurezza) ne'
  il **Mercante Errante**, che resta l'incontro nascosto delle ondate normali con le sue offerte uniche.
- **Co-op:** il **primo** che entra nel portale porta avanti tutti; in multiplayer c'e' un timeout anti-AFK.
- **Fix:** Mercante Errante e Mercante Nero erano **invisibili in mappa** (non venivano mai disegnati); ora si
  vedono, col beacon e il marker sulla minimappa.

## 🎴 Level up fra le ondate, rivisto *(novita v1.51)*

Il momento fra un'ondata e l'altra chiedeva **tre** decisioni (potere, statistiche a XP, equipaggiamento a monete),
ma una sola era davvero una scelta. Ora il potere torna protagonista e il negozio XP costringe a specializzarsi.

- **Si sceglie 1 potere su 3.** Erano 2 dalla v1.10, mentre il catalogo cresceva: piu poteri e meno pescate
  significa vedere una frazione sempre piu piccola del gioco. Le carte tornano tre, la scelta resta una.
- **Dieci poteri nuovi** (catalogo 23 → **33**), ognuno pensato per cambiare *come* giochi, non solo di quanto:

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

- **Due nuove sinergie:** 🎯 **Cacciatore di Teste** (Colpo di Grazia + Piede di Porco → soglia di esecuzione piu
  alta) e 🌊 **Onda d'Urto** (Rappresaglia + Aura di Spine → onda molto piu ampia).
- **Negozio XP molto piu severo.** Costi da `1.55^n` a `2.05^n` e **tetto di 8 livelli** per statistica.
  Massimizzare l'intero albero passa da 3.526 a **17.768 XP**, contro le ~7.528 raccolte in una run intera: ne
  massimizzi al piu una parte, e la **combo** (che moltiplica l'XP fino a x2.5) decide quanta. Le carte mostrano
  `Lv.3/8` e diventano **MAX ★** quando la statistica e esaurita.
- **Emporio a monete nascosto** in attesa di ridisegno. Non e stato rimosso nulla: le monete cadono ancora e i
  **mercanti** in mappa restano il modo per spenderle.
- **Barra dei poteri attivi** sopra la barra abilita: ogni potere posseduto con icona, colore della rarita e
  moltiplicatore, sinergie evidenziate, descrizione al passaggio del mouse.
- Test: **273 passati, 0 falliti**, piu la nuova suite `test/client.js` che verifica l'interfaccia con un DOM finto.

## 🧭 Consolidamento: curva di difficolta, elite tarati, documentazione *(novita v1.50)*
- **Curva di introduzione dei nemici ripristinata.** Gli archetipi tornano a entrare **scaglionati**: 🟢 Zombie
  Putrido (ondata 1) → 🟢 Melma Corrosiva (2) → 🟣 Negromante (3) → 🟠 Troll delle Caverne (4) → 👁️ Beholder (6,
  dopo il primo boss). Le comparse "dal primo stage" introdotte in v1.44 e v1.49 erano **temporanee**, servivano a
  valutare i nuovi sprite: erano rimaste nel codice e appiattivano la rampa di difficolta.
- **Elite tarati sui nemici robusti.** Il moltiplicatore PV degli elite e ora dichiarato **per nemico**
  (`def.eliteHp`, default 2.4 invariato). Il **Troll** usa 1.5 e il **Beholder** 1.9: un Troll elite all'ondata 4
  scende da ~845 a ~528 PV, cifra sostenibile con l'equipaggiamento di quel punto della run.
- **Documentazione riallineata** e **checklist di release** aggiornata: il commit git sostituisce il vecchio
  "ripacchettizza come .txt", e `ROSTER.md` entra finalmente nella lista dei file da aggiornare a ogni versione.
- Test: **256 passati, 0 falliti**.

## 👁️ Beholder: l'Occhio Tiranno torna nel roster *(novita v1.49)*
- Reintrodotto l'**Occhio Vagante** come **BEHOLDER**: bulbo oculare fluttuante con **eye-stalks** e **tentacoli
  tutt'intorno**. **Non spara**: il suo attacco e lo **SGUARDO** — se entri nel suo **campo visivo** subisci un
  **debuff** che si rinnova finche resti in vista.
- **Eyestalks che RUOTANO:** alterna ciclicamente i tre sguardi (**weaken** = attacco indebolito, **slow** =
  velocita ridotta, **sunder** = meno difesa) ogni ~4s; il **fascio cambia colore** col tipo attivo.
- **Reso col metodo RASTER PUPPET** (illustrazione ritagliata → manifest + profilo, come gli altri mostri puppet):
  render dedicato con **iride centrale che segue** il bersaglio, **pupilla che si dilata** in attacco, **eyestalks
  che avvampano** nel colore dello sguardo e **edge-glow** magenta.
- tier 3, 130 PV, gittata 340. Nel pool dal primo stage (per valutazione). Test: **246 passati, 0 falliti**.

## 🐛 Fix Troll: cammina davvero + ombra ai piedi *(novita v1.48)*
- **Camminata**: i mostri **lenti** (Troll) non restano più in **idle mentre scivolano** — soglie del rilevamento
movimento abbassate con **isteresi** (0.28/0.10): walk/idle ora si attivano correttamente.
- **Grounding**: lo sprite-sheet non **fluttua** più e disegna la **propria ombra ai piedi** (prima riceveva l'ombra
generica ~28px troppo bassa, che lo faceva sembrare sospeso). Test: **234 passati, 0 falliti**.

## 👹 Troll delle Caverne: SPRITE SHEET animato *(novita v1.47)*
- Il **Troll delle Caverne** (ex Bruto) ora usa un **vero sprite sheet** frame-by-frame disegnato a mano (3 fogli 5×5
@256px: idle, walk, attack) → **camminata naturale** e **martellata** completa; **mirror L/R** per la direzione.
- Nuovo **motore sprite-sheet** (`SHEETS`+`_drawSheet`): stato→animazione, frame dal tempo/fase d'attacco, ancoraggio
ai piedi, ombra a terra + hit-flash. Il danno/scossa dello slam scatta al **72%** dello swing (coincide con l'impatto).
- Test: **234 passati, 0 falliti**.

## 👹 Bruto senza tremore + 🟢 Melma TOP-DOWN *(novita v1.46)*
- **Bruto**: camminata **rifatta** senza "parkinson" — un solo dondolio lento, braccia enormi **in sincronia**, piede
che si **solleva morbido**, fase continua; rilevamento movimento con **isteresi** (i mostri lenti non tremolano più).
Parti ritagliate meglio.
- **Melma Corrosiva**: ora in **vista TOP‑DOWN** — una **pozza fluo** che striscia sul pavimento (wobble gelatinoso +
edge‑glow pulsante), con **sputo di bolle d'acido** ad alto danno invariato. Morte: la pozza si restringe e svanisce.
- Test: **226 passati, 0 falliti**.

## 🟢 Melma: striscia + salta e sputa acido *(novita v1.45)*
- La Melma ora **striscia** lenta (onda peristaltica, resta a terra: **niente più saltelli**); il **salto** avviene
**solo in attacco**, quando **sputa un ventaglio di bolle d'acido ad ALTO danno** a distanza ravvicinata (IA blob).
- Nuovo **sprite senza bocca** + **edge‑glow** verde; **occhi che si illuminano nella direzione di movimento**.
- Test: **226 passati, 0 falliti**.

## 🟢 Melma Corrosiva (squash & stretch) + Bruto affinato *(novita v1.44)*
- **Melma Corrosiva** (4° puppet): blob acido reso con **UN pezzo** in **squash & stretch** (idle jiggle, saltello che
si appiattisce a terra/allunga in aria, attacco che comprime→schizza). Effetti: **aura verde** pulsante, **nucleo verde
acido** al centro, **occhi che avvampano** al colpo, **bolle acide** che salgono. tier 1, 90 PV. Nel pool dal 1° stage.
- **Bruto**: la camminata **solleva i piedi** (falcata più ampia, passo leggibile); **slam più impattante** (doppia onda
d'urto + polvere + hit-stop + scossone forte).
- Test: **221 passati, 0 falliti**.

## 👹 Bruto ridisegnato, vagabondaggio & anti-incastro *(novita v1.43)*
- **Bruto**: camminata **lumbering** distinta dallo zombie (braccia in sincronia + waddle) e **SLAM overhead** (alza i
pugni sopra la testa → schianto a terra ad **area** con forte **respinta**) quando entri nel suo **campo visivo**.
- **Vagabondaggio**: i nemici che **non ti vedono** ora **vagano a caso** per la mappa; ti inseguono quando ti individuano
e **investigano** l'ultima posizione nota prima di tornare a vagare.
- **Anti-incastro** per **tutti** (boss compresi): rilevatore di wedge + recupero/scivolamento; 0 mostri nei muri, boss 100%.
- Test: **213 passati, 0 falliti**.

## 👹 Bruto delle Caverne: tank PUPPET con slam ad area *(novita v1.42)*
- **Bruto delle Caverne** (3° puppet, tank): enorme e lento, **braccia enormi** con grande dondolio in camminata e
**SLAM ad area** in due tempi (carica → schianto del busto in avanti/giù) con onda d'urto e respinta. tier 2, 220 PV,
vel. 60, danno 28, raggio slam 96. Nel pool dall'ondata 4.
- **Artwork del bestiario** aggiunti in `public/assets/art/` (overview + concept del Bruto); scheda `ROSTER.md` aggiornata.
- Incluso: sfere del Negromante **+30%** (projSpeed 250→325, da v1.41). Test: **206 passati, 0 falliti**.

## 🧙 Negromante PUPPET + motore puppet generico + migliorie *(novita v1.39)*
- **Negromante** (2° puppet, mago incappucciato): fluttua, **evoca zombi minori** (tetto 4) e **spara sfere debilitanti**
  (curse) **solo quando entri nel suo CAMPO VISIVO** (cono fov con telegrafo). Nel pool dall'ondata 3.
- **Motore puppet generico** (`PUPPETS[key]`+`PROF[key]`): aggiungere un nemico = "manifest + profilo".
- **Migliorie a tutti i puppet:** hit-reaction (squash + rinculo), **morte con crollo dei pezzi**, inclinazione nel
  movimento, ombra dinamica che si allunga, **tint per gli elite**.
- Test: **193 passati, 0 falliti**.

## 👁️ Occhi che avvampano al colpo · via il cerchio verde *(novita v1.38)*
- Quando lo Zombie Putrido viene **colpito**, gli **occhi verdi avvampano** (feedback di danno); un lampo verde
  anche se colpito **di spalle**.
- Rimosso il **cerchio/disco verde** attorno al nemico: il veleno si vede solo dalle particelle; l'alone dei puppet
  è ora molto tenue (niente anello verde).

## 🧟 Roster essenziale: SOLO lo Zombie Putrido (render PUPPET) *(novita v1.37)*
- **Un solo nemico d'ondata**: rimossi Negromante, Spettro e Occhio Vagante. Lo **Zombie Putrido** è ora reso col
  **RENDER PUPPET** (6 pezzi PNG scomposti + overlay vettoriale) e **sostituisce** il vecchio zombie vettoriale.
- **Attacco in due tempi** (carica → colpo) con **affondo del corpo in avanti**; **camminata più aggressiva e lenta**.
- **Ombra a terra sfocata** alla base dei piedi per radicare il mostro sulla mappa (niente più effetto "appiccicato").
- Test: **190 passati, 0 falliti**.

## 🩹 Troll rimosso · Mercante Nero riempito · Occhio Vagante "Sguardo" *(novita v1.34)*

- **🗑️ Troll delle Caverne rimosso** dal roster (sprite non soddisfacente): tolto da `MONSTERS`, dall'`ORDER` e dal
  pool ondate, che scende a **4 archetipi** (Zombie · Spettro · Negromante · Occhio Vagante).
- **🖤 Fix Mercante Nero "vuoto"** — il box appariva **centrato ma senza offerte**. Causa: `HUD._renderMerchant()`
  gira a ogni snapshot per aggiornare le monete e faceva `innerHTML=''` **ricreando le card ogni frame**; le card del
  Nero hanno l'animazione `darkCardIn` (opacity 0→1 con delay) e, ricreate di continuo, restavano a **opacity 0**.
  Ora le card si **ricostruiscono solo al cambio offerta**; ogni frame si aggiornano solo monete e stato "acquistabile".
- **👁 Occhio Vagante — attacco "Sguardo" (gaze debuff)** — l'occhio **non spara più**. Applica un **debuff** a chi entra
  nel suo **campo visivo** (cono attorno alla direzione dello sguardo, in gittata e con **LOS libera**), rinnovato finché
  resti in vista. Tre tipi (uno fisso per ogni occhio): **weaken** (attacco indebolito), **slow** (velocità ridotta),
  **sunder** (meno difesa). Grafica: **sprite -20%**, **tentacoli tutt'intorno** al bulbo, **fascio/cono** colorato per
  tipo e **aura tratteggiata** sul giocatore debuffato. IA `gazer` (sostituisce `strafer`). Test: **176 passati, 0 falliti**.

## 👻 Bestiario ampliato: Spettro & Occhio Vagante *(novita v1.32)*

Due nuovi archetipi si aggiungono al roster frontale, più la rifinitura di Troll e Mercante Nero:

- **👻 Spettro** — figura eterea/translucida: **cappa spettrale** che sfuma in **code ondulate**, scie/wisp emissive,
  artigli protesi e **occhi ardenti**; il corpo "respira" con alfa animata. IA **`wraith`**: avanza rapido in mischia
  e periodicamente **"sfasa" (phase-blink)** verso il bersaglio, riemergendo alle sue spalle **attraverso gli ostacoli**
  (poi un breve stordimento). *Tier 2 · 92 PV · veloce · nel pool dall'ondata 2.*
- **👁️ Occhio Vagante** — grande **bulbo oculare** fluttuante con **eye-stalks** superiori (piccoli occhietti su stelo),
  **tentacoli** inferiori, aura emissiva, vene rosse, **iride che segue** e **pupilla che dilata in attacco**, palpebre
  carnose a mandorla. IA **`strafer`**: orbita a distanza e scaglia **raggi arcani**. *Tier 3 · 118 PV · gittata 320 ·
  nel pool dall'ondata 4.*
- **🪓 Troll rifinito** — braccia massicce **senza mani/artigli**, **occhi rossi** (niente fascia-occhi né zanne),
  passo e respiro animati, slam invariato.
- **💀 Mercante Nero "al top"** — veste con gradiente, **bordo runico pulsante**, spalle a punta bordate, cappuccio
  definito, volto-teschio con **occhi viola ardenti** e **mani ossute** che presentano la merce; beacon a **doppia
  colonna** (viola + cremisi) e anello pulsante.

Pool ondate a **5 archetipi**: Zombie · Spettro · Negromante · Occhio Vagante · Troll. Test: **177 passati, 0 falliti**.

---

## 👾 Bestiario essenziale in vista frontale *(novita v1.30)*

Il roster è stato **ridotto a tre soli archetipi**, tutti ridisegnati come **billboard frontali** (guardano la camera,
si specchiano verso il movimento, mostrano il dorso allontanandosi) e ridipinti in **grigio molto molto scuro** con
**occhi/accento luminosi** per la personalità:

- **🧟 Zombie Putrido** — corpo ingobbito, braccia penzolanti con mani ad artiglio, occhiaie nere con bagliore verde,
  **mascella che si spalanca** in attacco, ferite e suture.
- **🧙 Negromante** — veste a campana con orlo ondeggiante e **rune luminose**, colletto, **cappuccio-vuoto** con occhi
  viola, **cappello a punta** e **bastone con orbe** che divampa durante il cast.
- **👹 Troll delle Caverne** — torso a masso, **braccia lunghissime** con pugni enormi e artigli, gambe tozze, **zanne**
  e occhi ambra; solleva il pugno per lo **slam**.

Sono stati **rimossi** Orco, Assassino d'Ombra, Piccolo di Viverna, Lich e il Drago regolare dal bestiario giocabile.
La **Bestia Mimica** è **mantenuta esclusivamente come cassa** (cassa-mima + modalità Tesoro): non compare mai tra i
nemici delle ondate, solo quando una cassa si rivela un mimic. I **boss** restano invariati e continuano a evocare
Zombie. Test: **175 passati, 0 falliti**.

---

## 🧙 Negromante tattico: proiettili in vista, evocazioni al buio *(novita v1.29)*

Il **Negromante** ora **legge la linea di vista** verso il bersaglio e cambia tattica di conseguenza:

- **Nel campo visivo** (LOS libera **e** entro gittata) → lancia **proiettili magici** (colpo singolo, con un
  **ventaglio da 3** ogni terzo tiro) mantenendo le distanze in kiting, e continua ad **applicare la maledizione**.
- **Fuori vista** (giocatore nascosto dietro i muri) → **evoca scheletri** (2 alla volta, ogni 8s) e **avanza** verso
  la tua ultima posizione per **stanarti** e riottenere la linea di tiro.

L'evocazione mostra ora un **anello viola** (colore del Negromante). Comportamento IA dedicato `necromancer`.

---

## 💀 Maledizione del Negromante & cunicoli a prova di boss *(novita v1.28)*

Il **Negromante** ora lancia incantesimi che **fanno danno e maledicono**: per **4,5s** il colpito è **indebolito**
(danno −40%, velocità −20%) e vede la notifica **"SEI STATO MALEDETTO"** con un'aura viola.
Sul fronte mappa, una nuova passata **garantisce corridoi di almeno 3 tile (144px)**: così **tutti i boss**, mega
dragon compreso, passano ovunque (**100%** delle mappe verificate, prima 83%). I blob-caverna restano intatti.

## 🦾 Braccia ai lati & roster aggiornato *(novita v1.27)*

Le braccia dello **Zombie Putrido** scendono ora **lungo i fianchi** a riposo e si protendono in avanti **solo in
attacco** (niente più effetto "insetto"). Il **Predone Goblin** è stato **rimosso** dal gioco: il Signore della
Guerra evoca ora **Zombie**, e ondate/fallback usano lo Zombie Putrido. Roster attuale: **9 nemici** standard + 3 boss.

## 👹 Nemici ridisegnati + animazioni attacco/morte *(novita v1.26)*

Tre nemici sono stati **ridisegnati** in stile dark-fantasy vettoriale, con nuove **animazioni di attacco e morte**
(oltre a idle e camminata già presenti). **Canvas 2D puro, zero dipendenze.**
- **🧟 Zombie Putrido** — braccia protese, occhi neri vuoti, morso in attacco; strascica verso i giocatori.
- **🧙 Negromante** — cappuccio con occhi viola, bastone con orbe che **divampa** quando evoca.
- **🪓 Orco Berserker** — ascia a doppia lama, zanne, occhi rossi; **alza e cala l'ascia** in attacco.
- **Morte**: ogni nemico **crolla e svanisce** (il negromante si **dissolve in volute viola**).

Per ora sono coinvolti **solo questi 3** nemici.

## 🗿 Terzo lotto di oggetti scenografici *(novita v1.25)*

Aggiunti **6 nuovi oggetti** distribuiti come **zone tematiche** legate ai biomi (cap 3-4 per tipo): **ponti di
legno**, **scale a chiocciola** (scendono nel buio), **pozzi/cisterne** (acqua luminosa), **grate/inferriate**,
**cristalli giganti** (landmark luminoso) e **statue rituali con gemma** (luminosa). Con i tre lotti la mappa
dispone ora di **18 oggetti scenografici** totali, sempre coerenti col tema. **Canvas 2D puro, zero dipendenze**.

## 🗿 Secondo lotto di oggetti scenografici *(novita v1.24)*

Aggiunti **6 nuovi oggetti** distribuiti come **zone tematiche** legate ai biomi (cap 3-4 per tipo): **archi
diroccati**, **stalattiti** dal soffitto, **forche/patiboli** con teschio, **obelischi arcani** (rune pulsanti +
glow), **lanterne appese** (che illuminano) e **macchie di sangue** a terra. Insieme al primo lotto (v1.23) la
mappa ha ora un'ampia varieta scenografica, sempre coerente col tema. **Canvas 2D puro, zero dipendenze**.

## 🖤 Muri neri, terreno vivo & nuovi oggetti *(novita v1.23)*

I **muri** sono ora **quasi neri** (contrasto 0.15) e si staccano nettamente dal pavimento; il **terreno** e meno
"piatto" grazie a **rocce, massi, ciottoli e buche** sparse. Le vecchie rune pulsanti sono state **rimosse** in
favore di **2-3 crepe grandi** (spaccature profonde). Primo lotto di **6 nuovi oggetti scenografici** distribuiti
per **tema**: **stalagmiti**, **pile di teschi**, **macerie**, **ragnatele giganti**, **cristalli luminosi** e
**altari rituali** (con luce), sempre col **cap 3-4 per tipo**. Gli **animaletti** sono piu grandi (~2x). Il
**Mercante Errante** e stato corretto (il click ora funziona) e reso **piu visibile** (beacon dorato sempre acceso +
marker sulla minimappa). Tutto in **Canvas 2D puro, zero dipendenze**.

## 🕳️ Caverna organica, ombre & animaletti *(novita v1.22)*

La mappa torna a una **conformazione organica** (caverna varia con anfratti e nicchie), piu interessante del layout
a stanze; la **connettivita e garantita**. I **muri** hanno **contrasto 0.50** e una **ombra marcata** al confine col
pavimento (linea di contatto scura) per uno **stacco** netto. Piccoli **animaletti** (ratti, ragni, scarafaggi)
sfrecciano sul pavimento evitando i muri. Le **decorazioni** sono ora a **cluster coerenti** (cimitero, ossario,
deposito, fungaia, gabbia) con **max 3-4 istanze per tipo** — solo le **torce** ai muri restano numerose. Aggiunte
**casse scenografiche**: circa il **30% delle casse** può rivelarsi un **mimic** (unica fonte di mimic, insieme alla
modalità Tesoro). Tutto in **Canvas 2D puro, zero dipendenze**.

## 🌫️ Muri scuri, nebbia & rune *(novita v1.21)*

I **muri** sono ora **molto piu scuri** (quasi neri, ~30% del colore del tema), cosi si **distinguono nettamente**
dal **pavimento** (invariato). L'atmosfera e arricchita da una **nebbia volumetrica a strati** che deriva lentamente
e da **rune/crepe che pulsano** sul pavimento — decal luminose (crepe ramificate e sigilli) del colore del tema, con
glow additivo, visibili anche nel buio della torcia. **Rimossi** laghi/pozze, colonne, pilastri e statue; restano
bracieri, gabbie, depositi e fungaie bioluminescenti. Tutto in **Canvas 2D puro, zero dipendenze**.

## 🏛️ Stanze, pozze-lago & decorazioni *(novita v1.20)*

Ogni livello ha ora un **layout a stanze**: una **stanza centrale grande** con **4 stanze angolari** (NO/NE/SO/SE)
collegate da **corridoi larghi 3 tile**, cosi il **boss di fine livello passa ovunque** e i nemici non si incastrano
(connettivita garantita). Le **pozze** sono ora **1-2 per mappa**, di **forma organica tipo lago** (colore desaturato,
profondita al centro), del colore del tema. Le mappe sono arricchite di **decorazioni bilanciate**: **bracieri** e
**candelabri** (che illuminano), **funghi bioluminescenti** (glow nel buio), **casse/barili/sacchi**, **statue
demoniache** con occhi luminosi, **gabbie sospese con scheletro** e **pilastri**.

## 🪨 Texture roccia & stanze *(novita v1.19)*

Pavimento e muri usano ora una **texture roccia realistica** generata proceduralmente: **rilievo/bump** (una heightmap
a rumore illuminata da luce direzionale, con creste chiare e incavi scuri), **domain warping** e **Voronoi** per massi
irregolari e crepe organiche (niente griglia), piu **umidita** e **muschio**. E' **colorata sul tema** e generata una
volta per mappa come pattern — **Canvas 2D puro, zero dipendenze**. La mappa e anche **meno "quadratona"**: nuovi
**tramezzi con varchi** creano **stanze minori attigue** comunicanti (con **connettivita garantita**). Il **glow**
(bloom) e stato **rimosso**; restano la modalita **torcia** (tasto `L`) e l'alone tondo attorno all'eroe.

## 🕳️ Caverna: terra, roccia & pozze *(novita v1.18)*

L'ambiente ha ora un vero look da **caverna**: **pavimento "terra"** e **muri "roccia"** organici (mottling morbido,
crepe, ombre ai bordi) **senza griglia** ne piastrelle. Le **pozze** (acido/fuoco/freddo/arcano, del colore del tema)
sono ora una **forma unica irregolare** con **profondita** — conca scura scavata, centro piu scuro e riflesso in
superficie — e brillano intravedendosi nel buio. **Decorazioni ripristinate** (bare, scheletri, ossa, accampamenti,
rocce, colonne...) e **torce molto meno frequenti** e irregolari lungo i lati.

## 🧱 Dungeon di pietra & pozze *(novita v1.17)*

Il livello ha ora un **look in pietra**: pavimento a **lastre** con fughe e rilievo, **muri a blocchi** con volume,
tenendo la struttura attuale (niente micro-stanze). La mappa e stata **ripulita** (molte meno decorazioni sparse) e
i pericoli a pavimento sono cambiati: **niente piu spuntoni ne "pallini"**, ma **pozze** (acido/fuoco/freddo/arcano)
**del colore della mappa**, con bordo luminoso, che **brillano** intravedendosi nel buio. L'illuminazione usa un
**grande alone tondo** attorno a ogni eroe (al posto del cono), la mappa e un filo meno scura, e nuove **torce ai
lati** illuminano il perimetro. Parametri tarabili in `renderer.js`: `haloR`, `darkness`, `bloomStrength`.

## 🔦 Torcia nel buio *(novita v1.16)*

La mappa e ora **quasi nera** e il giocatore la illumina con un **cono di luce** nella direzione di mira, piu un
**alone ravvicinato** attorno a se (in co-op ogni alleato ha il suo cono). Torce, falo, portale, mercanti e
**proiettili** restano visibili nel buio; **boss/elite/scrigno** si **intravedono** col loro alone. Realizzato con
una dark-mask offscreen (`destination-out`): **leggera, zero dipendenze**. Fluttua anche un **pulviscolo** che
brilla nel fascio. Il **bloom** e stato reso piu tenue. Tasto **`L`** per accendere/spegnere la torcia, **`B`** per
il bloom (scelte salvate).

## 🌟 Dungeon neon: bloom & glow *(novita v1.15)*

Un **bloom** (glow diffuso) illumina proiettili, torce, occhi/aure dei nemici e accenti degli eroi, dando un look
**twin-stick moderno** pur restando nel **tema dungeon cupo**. E realizzato in **Canvas 2D puro** (offscreen a
bassa risoluzione + blur additivo): **leggero** e **senza dipendenze**. I proiettili sono scie neon (nucleo bianco
+ alone saturo) e i nemici hanno un **alone emissivo** stile "orb". Premi **`B`** per attivare/disattivare il bloom
(scelta salvata) sui PC meno potenti.

## 🔎 Dimensioni & fluidita *(novita v1.13)*

Personaggio, nemici, **boss** e **oggetti di scena** sono resi un po' **piu grandi** (visivo +45%) per un
colpo d'occhio piu imponente, MA la **collisione resta quasi invariata** (~1.08x, come la v1.12) e il
giocatore ha un **+5% di velocita**: cosi il gioco resta **fluido e immediato**. Mappa e densita non cambiano.

## 🔧 Mercante: un solo per round *(fix v1.13)*

A fine round compare **un solo** mercante: con ~30% di probabilita il **Mercante Nero AL POSTO** di quello
ufficiale, altrimenti l'ufficiale. **Mai entrambi insieme.**

## 🎮 Comandi

| Azione | Tasto |
|---|---|
| Movimento | WASD / frecce |
| Mira | Mouse |
| Spara | Click sinistro / Spazio |
| Scatto (dash) | Tasto destro del mouse (o Shift) — attraversa i nemici |
| Abilità 1 / 2 | Q / E |
| Negozio: pronto | Spazio |
| Musica on/off | M |
| Chat | Invio |
| Minimappa | sempre visibile, in basso a sinistra |

---

## 🕹️ Loop di gioco

1. **Ondata di combattimento** con una **modalità** casuale (Orda, Caccia, Sopravvivenza, Tesoro, Assalto).
2. I nemici lasciano **XP** ✦ e talvolta **oggetti** 🎁.
3. Uccisioni consecutive → **COMBO** con moltiplicatore XP crescente. *(v1.6)*
4. A fine ondata: **scegli 1 Potere (Boon)** e spendi la XP nel **negozio statistiche**.
5. Ogni 5 ondate → **BOSS**. Alla 20ª → **MEGA BOSS AZ'GAROTH**.

---

## ⏸️ Pausa & flusso *(novità v1.9)*

A fine ondata il gioco va in **pausa**: durante la scelta dei poteri, il negozio a XP e l'emporio a monete il mondo
è **congelato**. In singolo giocatore si riparte **solo** col tasto **Continua** (in multiplayer c'è un timeout
anti-AFK). I drop rimasti a terra (XP e monete) vengono **raccolti automaticamente**.

## ⚔️ Abilità *(2 per eroe, novità v1.9)*

Ogni eroe ha **esattamente 2 abilità** (Q ed E), più lo **scatto** universale (tasto destro, invariato) e il fuoco.
Novità di questa versione, ispirate ad altri giochi:
- 🎯 **Torretta Schierabile** (Enforcer, E) — piazza una torretta che spara per 8s.
- 🎯 **Colpo del Cecchino** (Recon, E) — proiettile perforante a lunga gittata (sostituisce lo scatto ridondante).

## 💀 Mercante Nero *(novità v1.12)*

Un **secondo mercante** sinistro e ben distinto dal primo: figura incappucciata dal **volto di teschio**, altare di
pietra con rune, **lanterna viola** e relíquie fluttuanti. Vende **patti rischio/ricompensa** — potenziamenti forti
ma con una **maledizione** (es. +danno ma −PV, +cadenza ma +danni subiti, +vite ma −monete, un potere ma −PV, o un
**azzardo** dall'esito casuale). **Non è sempre presente**: appare a caso (~35% delle mappe) e si nasconde nel punto
più lontano dallo spawn. Il suo pannello mostra chiaramente **beneficio** e **rischio** di ogni patto.

## 🎨 HUD *(ridisegnato in v1.12)*

**Barra abilità più grande e caratteristica** (icone molto più grandi, badge del tasto, etichetta dell'azione,
pulsazione quando l'abilità è pronta) e **eventi al centro** dello schermo — grandi e molto visibili — al posto
delle piccole notifiche in alto a destra.

## 🧙 NPC Mercante *(novità v1.11)*

Un **mercante errante** neutrale appare in mappa (spesso in una micro-area), con bancarella e lanterna.
Avvicinandoti si apre un pannello con **3 offerte casuali** acquistabili con le **monete**: cura, +PV massimi,
cassa armi, un potere, vita extra, +danno, +velocità o riduzione danni. I nemici lo ignorano.

## 👹 Nemici *(ridisegnati in v1.11)*

I mostri sono **creature dettagliate** (non più pallini): corpo, arti animati, corna, zanne, ali e occhi,
in stile coerente con gli eroi. Attacchi **più vari ispirati a Hades**: **zone telegrafate** a terra (cerchi che
esplodono), **ventagli** di proiettili, **raffiche** e **affondi** rapidi.

## 🔥 Sistema COMBO *(novità v1.6)*

- Le uccisioni consecutive riempiono il **combo meter** (in alto al centro).
- Il **moltiplicatore XP** cresce con la catena, fino a **x2.5**.
- La combo **decade** in ~3,6 s se smetti di uccidere: premia l'aggressività.
- Milestone ogni 5 uccisioni con feedback visivo e sonoro.

## 🗺️ Minimappa *(novità v1.6)*

Riquadro in basso a sinistra con: muri, portale d'uscita, **alleati**, **nemici**
(boss in rosso, élite in oro) e **scrigno del tesoro** 👑.

---

## 🪙 Monete & Emporio *(novita v1.8)*

Oltre all'XP, i nemici droppano **monete** di vario taglio: 🟤 **Bronzo** (1), ⚪ **Argento** (5),
🟡 **Oro** (20). Boss ed elite ne lasciano di piu; si raccolgono con la **calamita** come l'XP.

A fine ondata apri l'**Emporio** (a monete, parallelo al negozio a XP) con **3 slot** potenziabili per **5 tier**
(Lv. I → V, rarita crescente):
- 🛡️ **Armatura** — riduzione danni + PV massimi
- 👟 **Stivali** — velocita di movimento
- ⚔️ **Arma** — danno + cadenza di fuoco

*(v1.10)* Le icone dell'emporio sono **immagini generate uniche per ciascun eroe**; gli oggetti sono **molto piu costosi** (scelta di lungo periodo). Anello e Amuleto sono stati rimossi.

Ogni tier costa **piu** del precedente: **XP** per micro-potenziamenti ripetibili, **monete** per l'equipaggiamento.

## 🏆 Statistiche di fine partita *(novita v1.7)*

Al termine di ogni run compare un **riepilogo** con la **classifica co-op** ordinata per uccisioni
(medaglie 🥇🥈🥉). Per ogni giocatore: uccisioni, **combo massima** 🔥, **danni totali**,
**boon** raccolti, **sinergie** 🔗 e **arma** (con evoluzione). Mostrata anche la **durata** ⏱ della partita.

## 🔥 Ricompense combo a soglie *(novita v1.7)*

La combo non premia solo con XP: a **15** sblocchi la **Frenesia** (cadenza di fuoco), a **25** una **Nova**
ad area, a **40** una **Cura + Egida**. Tenere alta la catena diventa una decisione tattica.

## 🔗 Sinergie tra Boon *(novita v1.7)*

Possedere due boon compatibili sblocca un effetto potenziato una tantum:
- **🧪 Deflagrazione Tossica** — Tossina + Colpi Esplosivi → le esplosioni diffondono veleno.
- **🧊 Catena Gelida** — Catena di Fulmini + Tocco Gelido → le catene rallentano i nemici.
- **🔮 Cercatore** — Mira Guidata + Perforazione → i proiettili guidati perforano +1.
- **🩸 Sete di Sangue** — Vampirismo + Adrenalina Pura → +6% cura dal danno inflitto.

## 🎴 Poteri a scelta (Boon, stile Hades)

*(v1.10)* Catalogo ampliato a **23 poteri**; a fine ondata si sceglie **1 di 2** carte.

Effetti **unici e impilabili**, pescati per rarità a fine ondata:

- **Base:** Rimbalzo, Perforazione, Catena di Fulmini, Tossina, Colpi Esplosivi, Onda di Ritorno, Vampirismo,
  Sdoppiamento, Occhio di Falco, Proiettili Giganti, Tocco Gelido, Aura di Spine, Adrenalina Pura, Scudo Vitale.
- **Nuovi v1.6:** 🎯 **Mira Guidata** (homing), 🪙 **Avidità** (+XP), 🧱 **Baluardo** (-danni).

## 🔫 Armi ed evoluzioni

3 armi raccoglibili (Dispersore, Raffica, Cannone a Fascio), 3 livelli ciascuna. A **Lv.3** con la statistica
richiesta si **evolvono**: **Uragano d'Acciaio**, **Tempesta di Piombo**, **Lancia del Giudizio**.

## 💥 Game feel

Hit-stop (freeze-frame) su critici e uccisioni di boss/élite, screen shake, particelle, illuminazione dinamica.

---

## 🦸 Eroi (3)

- **Enforcer** 🤖 — proiettili a ricerca leggera, **Torretta Schierabile** (nuova), resistenza.
- **Recon** 🎖️ — granata, **Colpo del Cecchino** (nuovo), danni aumentati a basso HP.
- **Glitch** 🕶️ — bullet-time, rift dimensionale, critici periodici.

## 👹 Nemici e boss

**3 mostri** in vista frontale (Zombie Putrido, Negromante, Troll delle Caverne) *(dal v1.30)*, più i **boss** con fasi
(Signore della Guerra, Re Lich…) e il **MEGA BOSS finale AZ'GAROTH** con meteore e ondate multiple.

## 🌍 Modalità ondata

- **Orda** — sciami di nemici deboli.
- **Caccia** — pochi nemici ma molte élite.
- **Sopravvivenza** — resisti al timer con respawn continuo.
- **Tesoro** 👑 — uccidi lo scrigno fuggitivo prima che scappi con il loot.
- **Assalto** — combattimento standard.

## 🎨 Temi mappa

Cripta, Lava, Foresta, Ghiaccio, Arcano — generati proceduralmente con connettività garantita e portale d'uscita.
Elementi scenografici tematici *(ampliati in v1.9)*: colonne, cristalli, statue, funghi, catene, pozze, stendardi, sarcofagi, torce, accampamenti.
*(v1.10)* Atmosfera **piu tetra**: tombe, cadaveri, strumenti di tortura, gabbie sospese, piu ragnatele/catene/teschi; pavimenti oscurati.
*(v1.11)* Mappe ancora **piu scure** (illuminazione intima, vignetta marcata) e con **micro-aree**: nicchie/stanzette laterali arredate da esplorare.

---

## 🗂️ Architettura (file dedicati, dipendenze zero)

```
shared/  constants (+combo +MONETE), mathutils, loot (BOON + EVO + item + XP + EQUIPAGGIAMENTO),
         monsters, heroes, mapgen (temi), pathfinding, ai, waves (MODALITÀ)
server/  index, ws, Room (boon, hit-stop, modalità, evoluzioni, vite, XP, COMBO, homing, RICOMPENSE-COMBO, SINERGIE, STATS, MONETE, EMPORIO)
public/  index.html (scelta boon + combo meter), style.css
public/js/ net (+fix input), audio, renderer (boon-fx, tesoro, MINIMAPPA, MONETE, PROP-TETRI), hud (boon+modalità+COMBO+STATS+EMPORIO+ICONE-IMG), main (hit-stop, combo, sinergie, monete)
public/assets/gear/ 9 icone PNG (3 slot x 3 eroi)
test/    simulate.js — 181 test automatici headless
```

## 🚀 Avvio

```bash
docker compose up --build      # → http://localhost:8080
# oppure, con solo Node ≥ 18:
npm start
```

Test: `npm test`

---

## 🌐 Rete / netcode

Netcode **autoritativo** lato server (30 tick/s), snapshot a 20 Hz con interpolazione client.
Fino a **6 giocatori** per stanza, matchmaking o stanze private per nome.

---

> Buon divertimento nel Rift! 🗡️ · Per lo storico completo delle versioni vedi **CHANGELOG.md**.
