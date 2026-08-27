# 🧟 ENEMIES.md — Tecnica di creazione dei mostri (RENDER PUPPET raster ibrido)

> **Scopo di questo documento.** Descrivere in modo esaustivo *come* sono realizzati i nemici di **Dungeon Rift**
> a partire dalla v1.36–1.37, così che il metodo sia **ricostruibile da zero** anche riaprendo una nuova chat/sessione.
> Contiene: filosofia, pipeline completa, prompt di generazione, algoritmo di slicing, formato del manifest con i
> **valori reali**, matematica del renderer, sistema di animazione con **tutte le costanti**, ombra a terra, overlay
> vettoriale, integrazione dati, checklist di release, ricetta "aggiungi un nuovo puppet" e troubleshooting.

**Versione di riferimento:** `1.64.0` · **Motore:** JavaScript **Canvas 2D** puro, **zero dipendenze** runtime
(gli script di preparazione asset usano **Python + Pillow + scipy**, solo offline).

---

## 1. Filosofia: perché "raster puppet ibrido"

Abbiamo valutato 3 approcci e scelto il terzo:

| Approccio | Pro | Contro | Verdetto |
|---|---|---|---|
| **Vettoriale procedurale** (le vecchie `_zombieF`, `_necroF`, …) | leggero, animazione dinamica infinita | dettaglio povero, stile "geometrico" non gradito | ❌ sostituito |
| **Frame-by-frame** (sprite sheet PNG) | massimo controllo per frame | l'AI **non è frame-consistent**, servono 6–8+ pose identiche, peso alto | ❌ scartato |
| **Raster puppet (cutout)** ✅ | dettaglio raster del PNG + animazione **continua** interpolata, 1 solo PNG per nemico | serve rig di pivot, gestione cuciture | ✅ **scelto** |

**Ibrido** = i **pezzi raster** (PNG ritagliati dall'illustrazione) animati con trasformazioni + un **overlay vettoriale
procedurale** disegnato a runtime sopra (occhi luminosi pulsanti, aura, ombra a terra). Così otteniamo il dettaglio
dell'illustrazione **e** gli effetti dinamici del motore, senza "cuocere" nulla nell'immagine.

**Vantaggio chiave sull'animazione:** col puppet **non servono N frame statici**. Il movimento è **interpolato in
continuo** con curve sinusoidali sui giunti → più fluido di 12 frame, a costo di memoria ~nullo.

---

## 2. Pipeline completa (dall'idea al gioco)

```
[1] Concept art (AI image_gen)  →  PNG 1024×1536, chibi dark-fantasy, sfondo scuro "bakeato"
        │
[2] Slicing offline (Python/Pillow/scipy)  →  6 PNG pezzi + ghoul.json (pivot/anchor)
        │        slice_puppet.py
        │
[3] Validazione rig offline (Python)  →  strip idle/walk/attack (specchia la matematica JS)
        │        preview_rig.py / preview_v137.py
        │
[4] Integrazione runtime (JS)  →  GHOUL loader + _ghoulPuppet() in renderer.js
        │
[5] Dati di gioco  →  monsters.js (def), waves.js (pool)
        │
[6] Test + versioning  →  test/simulate.js, constants.js, package.json, index.html, docs
```

> **Regola d'oro:** la matematica dell'animazione negli script Python di anteprima è **identica** a quella in
> `renderer.js`. Prima si valida a occhio in Python, poi si **porta 1:1** in JS. Se cambi una costante, cambiala in
> entrambi.

---

## 3. [Fase 1] Concept art — generazione immagine

**Stile richiesto:** *chibi dark-fantasy*, testa grande centrata, corpo tozzo umanoide (NON "pallini attaccati"),
palette grigio quasi-nero desaturato, **occhi emissivi** come accento, silhouette pulita, contorni scuri, sfondo scuro.

**Prompt usato per lo Zombie Putrido** (riferimento, `image_gen`, `transparent_background: true`, `portrait`):

```
Chibi dark fantasy enemy sprite for a 2D roguelike game, front-facing billboard view.
A 'Putrid Zombie': hunched humanoid body in very dark near-black desaturated grey (#2c2e2c),
oversized head centered on a stocky small body (chibi proportions), clear humanoid silhouette
with arms hanging at the sides ending in claw hands, black hollow eye sockets glowing acid-green,
wide-open dripping jaw with a few teeth, exposed stitches and wound marks, subtle emissive green aura.
Vector art style with clean dark outlines, soft volume gradients, high contrast,
atmospheric dark dungeon mood. Single centered character, transparent background.
```

**Requisiti dell'immagine per lo slicing (importante):**
- **Posa a T/A rilassata, frontale**, braccia staccate dal corpo e leggermente distanti dai fianchi (per poterle
  ritagliare senza tagliare il torso).
- **Gambe leggermente separate**, piedi visibili in basso.
- **Testa grande e ben separata** dal collo/spalle.
- Sfondo uniforme (chiaro o scuro) e **soggetto molto più scuro/chiaro dello sfondo** → segmentazione facile.
- Personaggio **centrato orizzontalmente**.

> Nota: anche se chiediamo `transparent_background`, spesso il modello "cuoce" comunque uno sfondo/alone. Non è un
> problema: lo slicing **ricava la maschera per luminanza**, non dall'alpha.

---

## 4. [Fase 2] Slicing — da 1 PNG a 6 pezzi + manifest

**Script:** `slice_puppet.py` (offline). **Dipendenze:** `Pillow`, `numpy`, `scipy`.

### 4.1 Algoritmo passo-passo

1. **Carica** il PNG in RGB (`1024×1536`).
2. **Segmenta il soggetto per luminanza:** `lum = 0.299R + 0.587G + 0.699B`; maschera `= lum < 150`
   (il soggetto scuro su sfondo chiaro; **invertire la soglia** se lo sfondo è scuro).
3. **Tieni solo la componente connessa più grande** (`scipy.ndimage.label`) per eliminare granelli nello sfondo.
4. **Riempi i buchi interni** (`binary_fill_holes`) così occhi/bocca luminosi diventano corpo pieno (i pezzi non
   devono avere fori).
5. **Feather del bordo:** blur gaussiano ~1.2px sull'alpha per un ritaglio pulito in composizione.
6. Costruisci l'**RGBA** unendo l'RGB originale con l'alpha = maschera.
7. Per **ogni pezzo** definito a mano in `PARTS` (box + pivot + z):
   - ritaglia il **box**, poi **trimma** i margini completamente trasparenti;
   - calcola il **pivot locale** `(ox, oy)` = pivot originale − angolo del box − offset del trim;
   - **downscala** di `SCALE = 0.5` (Lanczos) e salva `pezzo.png`;
   - registra nel manifest `w,h` (post-scale), `ox,oy` (post-scale), `ax,ay` (pivot in spazio-originale), `z`.
8. Ordina i pezzi per `z` e scrivi `ghoul.json`.
9. Genera un **contact sheet di riassemblaggio** (`reassembled.png`) per verificare che i pezzi combacino.

### 4.2 Definizione dei pezzi (i box sono nello spazio ORIGINALE 1024×1536)

I **box si sovrappongono sul lato del giunto** (spalla/anca) di alcuni px: così, quando il pezzo ruota, non si apre
un buco alla giunzione (**seam-hiding**). Il pivot sta **sul giunto**.

```python
# name      box=(x0,y0,x1,y1)              pivot(orig)   z (0=dietro … 3=davanti)
'legR':  ((230, 940, 520, 1420),  (430, 985),  0),   # gamba a sinistra nell'immagine
'legL':  ((504, 940, 800, 1420),  (595, 985),  0),   # gamba a destra nell'immagine
'armR':  ((60,  560, 340, 1300),  (312, 640),  1),   # braccio a sinistra
'armL':  ((690, 560, 960, 1300),  (712, 640),  1),   # braccio a destra
'torso': ((288, 520, 736, 1040),  (512, 560),  2),   # busto
'head':  ((190, 60,  824, 610),   (512, 585),  3),   # testa + faccia
```

> **Convenzione nomi:** `R`/`L` seguono il **lato nell'immagine** (R = image-left), non l'anatomia. Non ha impatto
> sul gioco perché il **mirror** orizzontale gestisce la direzione.

### 4.3 Parametri globali dello slicer

- `SCALE = 0.5` — fattore di downscale degli asset (tiene i file piccoli ma nitidi).
- `CHAR_ORIGIN_X = 512` — centro orizzontale del personaggio (→ `originX`).
- `CHAR_FEET_Y = 1408` — riga dei piedi/terreno (→ `feetY`).
- `CHAR_TOP_Y = 76`, `CHAR_H = 1408 − 76 = 1332` (→ `charH`).
- `eyes = [[392,486],[578,486]]`, `mouth = [485,640]` — punti in spazio-originale per l'overlay.

---

## 5. [Manifest] `public/assets/enemies/ghoul/ghoul.json` (valori REALI v1.37)

```json
{
 "name": "ghoul",
 "charH": 1332,
 "originX": 512,
 "feetY": 1408,
 "eyes": [[392, 486], [578, 486]],
 "mouth": [485, 640],
 "parts": [
  { "name": "legR",  "z": 0, "w": 145, "h": 231, "ox": 100.0, "oy": 22.5,  "ax": 430, "ay": 985 },
  { "name": "legL",  "z": 0, "w": 148, "h": 236, "ox": 45.5,  "oy": 22.5,  "ax": 595, "ay": 985 },
  { "name": "armR",  "z": 1, "w": 135, "h": 370, "ox": 121.0, "oy": 40.0,  "ax": 312, "ay": 640 },
  { "name": "armL",  "z": 1, "w": 132, "h": 370, "ox": 11.0,  "oy": 40.0,  "ax": 712, "ay": 640 },
  { "name": "torso", "z": 2, "w": 224, "h": 260, "ox": 112.0, "oy": 20.0,  "ax": 512, "ay": 560 },
  { "name": "head",  "z": 3, "w": 313, "h": 265, "ox": 157.0, "oy": 252.5, "ax": 512, "ay": 585 }
 ]
}
```

**Semantica dei campi di ogni pezzo:**
- `w,h` — dimensioni del PNG del pezzo **dopo** il downscale (in px del file).
- `ox,oy` — posizione del **pivot dentro il PNG del pezzo** (px del file, post-scale). È il punto attorno a cui ruota.
- `ax,ay` — **àncora**: dove sta il pivot nello **spazio-originale del personaggio** (1024×1536). Definisce la posa
  di riposo (T-pose ricomposta).
- `z` — ordine di disegno (0 dietro … 3 davanti).

**Dimensioni reali dei PNG dei pezzi** (coerenti con `w,h`): `armL 132×370 · armR 135×370 · head 313×265 ·
legL 148×236 · legR 145×231 · torso 224×260`.

**File asset:** `public/assets/enemies/ghoul/{legR,legL,armR,armL,torso,head}.png` + `ghoul.json`.

---

## 6. [Fase 4] Integrazione runtime — `public/js/renderer.js`

### 6.1 Loader asincrono (una sola volta)

Definito **prima** di `const R = {`. Carica manifest + immagini; finché non è pronto, `_ghoulPuppet` fa **fallback**
al vecchio zombie vettoriale `_zombieF` (nessun "buco" a schermo, nessun crash).

```js
const GHOUL = {
  ready: false, man: null, imgs: {}, _started: false, base: 'assets/enemies/ghoul/',
  load() {
    if (this._started) return; this._started = true; const self = this;
    fetch(this.base + 'ghoul.json').then(r => r.json()).then(man => {
      self.man = man; let need = man.parts.length, got = 0;
      man.parts.forEach(p => {
        const im = new Image();
        im.onload  = () => { self.imgs[p.name] = im; if (++got >= need) self.ready = true; };
        im.onerror = () => { if (++got >= need) self.ready = (Object.keys(self.imgs).length >= need); };
        im.src = self.base + p.name + '.png';
      });
    }).catch(() => {});
  }
};
```

`GHOUL.load()` è chiamato in `R.init(canvas)` e, per sicurezza, anche all'inizio di `_ghoulPuppet`.

### 6.2 Sistema di coordinate e scale

- `SC = 0.5` — deve combaciare col `SCALE` dello slicer.
- `K = 2.7` — moltiplicatore che mappa il **raggio di gioco `r`** all'altezza a schermo del personaggio.
- `OX = man.originX` (512), `CH = man.charH` (1332), `OY0 = 890` — **riga d'ancoraggio verticale** (attorno ai
  fianchi/centro); tutte le `ay` sono riferite a questa.
- `s = (K * r) / CH` — scala **px-originali → px-schermo**.
- `si = s / SC` — scala **px-del-file-pezzo → px-schermo** (perché i pezzi sono già downscalati di `SC`).

### 6.3 Disegno di un pezzo (posa + rotazione attorno al pivot)

Per ogni pezzo, con trasformazione `tr = [rotGradi, dx, dy]` (dx,dy in px-originali):

```js
const wx = (p.ax + tr[1] + lungeX - OX) * s;   // pivot X a schermo
const wy = (p.ay + tr[2] + bob    - OY0) * s;   // pivot Y a schermo
ctx.save(); ctx.translate(wx, wy); ctx.rotate(tr[0] * D2R);
ctx.drawImage(img, -p.ox * si, -p.oy * si, p.w * si, p.h * si);  // pivot all'origine
ctx.restore();
```

Il segreto è disegnare il PNG spostato di `(-ox, -oy)` così il **pivot cade sull'origine** del sistema traslato/ruotato.

### 6.4 Firma della funzione e dispatch

```js
// in _front(...): il billboard passa flip (mirror) e moving (idle/camminata)
else if (shape === 'ghoul') this._ghoulPuppet(ctx, r, col, dk, eye, t, atk, back, moving);
```

`moving` è calcolato in `_drawMonster` confrontando la posizione corrente con quella del frame precedente (cache
`this._gmv[m.e]`, soglia velocità > 0.35). `flip = Math.cos(m.f) < 0 ? -1 : 1`; `back = Math.sin(m.f) < -0.35`.

---

## 7. [Animazione] Costanti REALI e formule (v1.37)

Ogni pezzo ha un vettore `P[name] = [rotazione°, dx, dy]` (dx,dy in px-originali). Tutto è funzione di:
- `t` — tempo globale (secondi).
- `moving` — booleano idle/camminata.
- `atk` (0→1) — fase dell'evento melee, guida l'attacco.

Costanti trigonometriche: `S = Math.sin`, `TAU = 2π`, `PI = π`, `D2R = π/180`.

### 7.1 CAMMINATA (blocco taratura in un solo oggetto)

```js
const WALK = { cad: 1.05, leg: 37, arm: 26, torso: 7, head: 3, bob: 11, sway: 4.5 };
const ph = moving ? (t * WALK.cad) % 1 : (t * 0.55) % 1;   // fase 0..1

// dentro if(moving):
bob      = -WALK.bob + WALK.bob * Math.abs(S(TAU*ph));   // tonfo verticale, 2 per ciclo
const lat = WALK.sway * S(TAU*ph);                        // waddle (peso laterale)
P.legR  = [ WALK.leg  * S(TAU*ph),        0, 0];
P.legL  = [ WALK.leg  * S(TAU*ph + PI),   0, 0];          // gamba opposta (fase +π)
P.armR  = [-WALK.arm  * S(TAU*ph),        0, 0];          // braccia in contro-oscillazione
P.armL  = [-WALK.arm  * S(TAU*ph + PI),   0, 0];
P.torso = [ WALK.torso* S(TAU*ph),      lat, 0];
P.head  = [-WALK.head * S(TAU*ph),  lat*0.6, 0];
```

| Costante | Valore | Significato | Effetto se aumenta |
|---|---|---|---|
| `cad` | **1.05** | cadenza (passi/sec) | più veloce/nervoso |
| `leg` | **37** | ampiezza falcata (°) | passi più larghi |
| `arm` | **26** | oscillazione braccia (°) | swing più marcato |
| `torso` | **7** | rotazione busto (°) | corpo più mosso |
| `head` | **3** | contro-rotazione testa (°) | testa più stabile/mossa |
| `bob` | **11** | tonfo verticale (px orig) | passo più "pesante" |
| `sway` | **4.5** | waddle laterale (px orig) | più dondolìo |

> **Storia taratura:** v1.36.0 `cad 1.7 / leg 17 / arm 13 / bob 6 / sway 0` → v1.36.1 `cad 1.35 / leg 26 / arm 20 /
> bob 9 / sway 3.5` → **v1.37 (attuale)** `cad 1.05 / leg 37 / arm 26 / bob 11 / sway 4.5` (più aggressiva e lenta).

### 7.2 IDLE (respiro)

```js
bob     = 6 * S(TAU*ph);
P.head  = [3 * S(TAU*ph), 0, 2 * S(TAU*ph + 0.5)];
P.armR  = [4 * S(TAU*ph), 0, 0];
P.armL  = [-4 * S(TAU*ph), 0, 0];
P.torso = [1.5 * S(TAU*ph), 0, 0];
```

### 7.3 ATTACCO in DUE TEMPI (carica → colpo), additivo sopra idle/walk

Funzione impulso triangolare `bump(x,c,w) = max(0, 1 − |x−c|/w)` → picco 1 in `x=c`, larghezza `±w`.

```js
const a = atk || 0;
const wind   = bump(a, 0.30, 0.30);   // CARICA (picco a 30% dell'evento)
const strike = bump(a, 0.62, 0.30);   // COLPO  (picco a 62%)
let lungeX = 0;                        // affondo dell'INTERO corpo in avanti (px orig)

// CARICA: braccia alzate/indietro, busto reclinato, testa su
P.armR[0] += -30*wind;  P.armR[2] += -30*wind;
P.armL[0] +=  30*wind;  P.armL[2] += -30*wind;
P.torso[0] += -5*wind;  P.head[2] += -10*wind;
// COLPO: braccia scagliate avanti/giù, affondo + testa protesa, spinta gambe
P.armR[0] += 74*strike; P.armR[2] += 26*strike;
P.armL[0] += -74*strike; P.armL[2] += 26*strike;
P.torso[0] += 11*strike; P.head[2] += 24*strike;
P.legR[0] += 10*strike; P.legL[0] += -10*strike;
lungeX += 30*strike;                   // il corpo si spinge in avanti al colpo
```

`lungeX` viene **sommato alla X** di ogni pezzo **e** dell'overlay occhi, così l'affondo è coerente su tutto il corpo.

---

## 8. [Ombra a terra] Radicare il mostro sulla mappa

Piccola **ellisse nera sfocata** disegnata **prima** dei pezzi, alla riga dei piedi (`feetY`). Si **stringe** quando il
tonfo solleva il corpo (`bob` negativo) e **segue** l'affondo d'attacco.

```js
{ const fy = (man.feetY - OY0) * s;                   // riga piedi (schermo)
  const lift = Math.max(0, -bob) / (WALK.bob * 2);    // 0..~0.5: quanto è "sollevato"
  const sw = r * 0.62 * (1 - lift*0.35);              // semiasse X
  const sh = r * 0.20 * (1 - lift*0.30);              // semiasse Y (schiacciata)
  ctx.save();
  ctx.filter = 'blur(' + Math.max(1, r*0.11).toFixed(1) + 'px)';
  ctx.fillStyle = 'rgba(0,0,0,' + (0.5 - lift*0.18).toFixed(2) + ')';
  ctx.beginPath();
  ctx.ellipse(lungeX * s * 0.6, fy, sw, sh, 0, 0, 7); // segue l'affondo (0.6×)
  ctx.fill();
  ctx.restore();
}
```

**Importante:** l'ombra generica dei mostri (`this._shadow(...)`) è **disattivata per i puppet** in `_drawMonster`
(`if (!def.puppet) this._shadow(...)`) per evitare **doppia ombra**.

---

## 9. [Overlay vettoriale] Occhi pulsanti + variante "di spalle"

Disegnato **dopo** i pezzi, agganciato al pivot testa (con `lungeX`). In modalità additiva (`'lighter'`):

```js
const pulse = Math.min(1.2, 0.65 + 0.35*S(t*4) + swing*0.4);   // battito + boost in attacco
for (const e of man.eyes) {
  const ex = (e[0] - hp.ax) * s, ey = (e[1] - hp.ay) * s;      // occhi relativi al pivot testa
  const R0 = r * (0.16 + swing*0.05);                          // raggio glow (si dilata in attacco)
  const gr = ctx.createRadialGradient(ex, ey, 0, ex, ey, R0*3);
  gr.addColorStop(0,   this._rgba(eye, Math.min(1, 0.9*pulse)));
  gr.addColorStop(0.4, this._rgba(eye, 0.5*pulse));
  gr.addColorStop(1,   this._rgba(eye, 0));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ex, ey, R0*3, 0, 7); ctx.fill();
  ctx.fillStyle = '#eaffe0'; ctx.beginPath(); ctx.arc(ex, ey, R0*0.5, 0, 7); ctx.fill();  // nocciolo
}
```

`swing = Math.max(wind*0.5, strike)` → gli occhi "avvampano" durante l'attacco. Con `back` (di spalle) niente occhi,
solo un velo scuro sulla nuca.

---

## 10. [Dati di gioco] Integrazione roster e ondate

### 10.1 `shared/monsters.js` — la def del nemico

Lo Zombie Putrido usa l'**id `skeleton`** (compatibilità con boss/`summon`) ma è un **puppet**:

```js
skeleton: {
  id: 'skeleton', name: 'Zombie Putrido', tier: 1,
  hp: 78, speed: 100, radius: 18, dmg: 14,
  atkRange: 44, atkCd: 1.1, ai: 'swarm', atk: 'melee', xp: 8, weight: 22,
  color: '#3a3d3a', color2: '#181a18', eye: '#8bff86',
  shape: 'ghoul',    // ← instrada il render su _ghoulPuppet
  front: true,       // ← billboard frontale (mirror/back)
  puppet: true       // ← usa render puppet + ombra propria (no _shadow generica)
}
```

**Flag che contano per il renderer:** `shape:'ghoul'` (dispatch), `front:true` (billboard), `puppet:true`
(ombra propria + eventuale logica dedicata). `eye` colora il glow degli occhi.

### 10.2 `shared/waves.js` — pool ondate

```js
function poolForWave(w) {
  const p = []; const add = (id, x) => { if (MONSTERS[id]) p.push({ id, weight: x }); };
  add('skeleton', 40);   // v1.37: UNICO archetipo d'ondata
  return p;
}
```

`ORDER = ['skeleton']` in `monsters.js`. (In v1.37 gli altri archetipi vettoriali — Negromante, Spettro, Occhio —
sono stati rimossi.)

---

## 11. [Fase 3] Validazione offline del rig (Python)

Gli script `preview_rig.py` / `preview_v137.py` **replicano la matematica JS** e generano una "strip" con idle,
camminata (più fasi) e attacco (carica/colpo) + ombra, su fondo scuro. Servono a **tarare a occhio** prima di
toccare il gioco.

**Composizione di un pezzo in Python (equivalente a `drawImage` ruotato):**
1. riscala il pezzo a `w/SC * K , h/SC * K` (torna a scala schermo);
2. mettilo in un canvas 3× con pivot al centro; ruota di `-rot` attorno al centro;
3. posiziona così che il pivot cada su `((ax+dx+lungeX−OX)*K + cx, (ay+dy+bob−OY0)*K + cy)`.

> **Nota di coerenza:** in Python usiamo `K` come scala diretta (es. `250/charH`), in JS usiamo `s=(K*r)/CH`. Sono lo
> stesso concetto (px-originali → px-schermo); cambia solo come si definisce la dimensione target.

---

## 12. Checklist di RELEASE (ad ogni versione)

> **Regola fissa del progetto.** I `.md` si aggiornano **nella stessa sessione** in cui si tocca il codice, mai
> "dopo". Servono a riprendere il lavoro dal punto in cui lo si è interrotto: se restano indietro, alla ripresa
> successiva si riparte da una descrizione **falsa** del gioco. Lo scivolone 1.47→1.49 nasce esattamente da qui —
> `ROSTER.md`, la scheda che si rilegge per prima, non era in questa lista.

Aggiornare **sempre** tutti questi punti:

1. `shared/constants.js` → `VERSION: 'X.Y.Z'`
2. `package.json` → `"version": "X.Y.Z"`
3. `public/index.html` → `<title>` **e** badge `#verBadge` (`vX.Y.Z`)
4. `CHANGELOG.md` → nuova sezione in cima
5. `README.md` → **titolo** `# ⚔️ DUNGEON RIFT vX.Y.Z` **e** blocco "Novita vX.Y"
6. `CARATTERISTICHE.md` → "Versione attuale" + blocco novità
7. `ROSTER.md` → scheda del nemico toccato, **tabella comparativa** e **ondata di comparsa**
8. `ENEMIES.md` → "Versione di riferimento" + nuova sezione tecnica se cambia il metodo di render
9. `test/simulate.js` (server) e `test/client.js` (interfaccia) → test aggiornati/aggiunti → **eseguire `npm test`
   (lancia entrambe le suite; devono dare 0 falliti)**
10. **Commit git** — sostituisce il vecchio "ripacchettizza come `.txt`", che era il workflow di quando il
    progetto non era ancora su repository.

Comandi tipici:
```bash
npm test                                       # simulate.js (server) + client.js (interfaccia)
git add -A && git commit -m "vX.Y.Z — <titolo>"
git tag vX.Y.Z
```

> **Trappola nota — un commento in coda a una riga lunga NE UCCIDE LA FINE.**
> In `server/Room.js` (e in `renderer.js`) molte "righe" sono **un'unica istruzione lunghissima**: la riga
> dello snapshot, `_separate`, `_pushOff`, `updateMonsters`. Un `// commento` messo **in coda** commenta via
> tutto quello che segue sulla stessa riga — `}` di chiusura compresi — e il file non compila più, con un
> `SyntaxError` che punta a **una funzione più in basso** e non alla riga colpevole. È successo in v1.59
> (riga dello snapshot) e di nuovo in v1.61 (`_pushOff`). **I commenti vanno SOPRA la riga, mai in coda.**

> **Trappola nota — gli id nel codice non corrispondono ai nomi visibili.**
> `skeleton` = **Zombie Putrido** · `cave_brute` = **Troll delle Caverne** · `occhio` = **Beholder** ·
> `darkmage` = Negromante · `slime` = Melma Corrosiva. Cercare "Troll" nel codice non trova nulla: cercare
> `cave_brute`. Gli id sono storici (compatibilità con boss/`summon`) e **non vanno rinominati** alla leggera.

---

## 13. RICETTA — Aggiungere un NUOVO nemico puppet (da zero)

1. **Genera** l'illustrazione (Fase 3) rispettando i requisiti di posa (braccia staccate, gambe separate, testa
   grande, soggetto ben separato dallo sfondo, centrato).
2. **Copia `slice_puppet.py`** in `slice_<nome>.py`; aggiorna:
   - `SRC` (path immagine), `OUT` (`public/assets/enemies/<nome>`), `name` nel manifest;
   - la **soglia di luminanza** (e invertila se lo sfondo è scuro);
   - i **box `PARTS`** e i **pivot** (aprendo l'immagine e misurando spalle/anche/collo);
   - `CHAR_ORIGIN_X`, `CHAR_FEET_Y`, `CHAR_TOP_Y`, `eyes`, `mouth`.
3. **Esegui** lo slicer, poi **controlla `reassembled.png`**: i pezzi devono ricomporre il personaggio senza buchi.
   Aggiusta i box (specialmente overlap sui giunti) finché le cuciture spariscono su fondo scuro.
4. **Valida il rig** con una copia di `preview_v137.py` (stesse costanti che userai in JS).
5. **Renderer:** o riusa `GHOUL`/`_ghoulPuppet` generalizzandoli (consigliato: un oggetto `PUPPETS[name]` +
   `_puppet(name, …)`), oppure duplica loader e funzione. Assicura `shape` dedicata nel dispatch di `_front`.
6. **Dati:** aggiungi la def in `monsters.js` con `shape:'<nome>'`, `front:true`, `puppet:true`, e inseriscila in
   `ORDER` e in `poolForWave`.
7. **Test + versioning** come da §12.

> **Refactor consigliato (futuro):** astrarre `GHOUL` → `PUPPETS[name]` e `_ghoulPuppet` → `_puppet(name, …)` con
> il set di costanti (`WALK`, attacco) preso da un profilo per-nemico. Così ogni mostro puppet è solo *manifest +
> profilo animazione*.

---

## 14. Vincoli noti & troubleshooting

- **⚠️ PRESTAZIONI — mai creare un gradiente dentro un ciclo per-entita'** *(misurato v1.64)*. Un
  `createRadialGradient`/`createLinearGradient` per mostro (o per proiettile, o per pipistrello) sembra
  innocuo e invece e' la prima causa di singhiozzo: con 80 nemici si arrivava a **558 gradienti per frame,
  33.494 al secondo**, e il frame peggiore era **6 volte** la mediana pur avendo una mediana ottima. Un
  `CanvasGradient` e' riusabile e le sue coordinate stanno nello spazio utente: si costruisce attorno
  all'ORIGINE, si mette in cache (`R._grad(chiave, fabbrica)`) e si disegna col contesto gia' traslato
  sull'entita'. Cio' che varia a ogni frame si fa con `globalAlpha`. **`test/client.js` ha una guardia che
  conta le allocazioni**: se una regressione rimette un gradiente in un ciclo, il test fallisce.
- **⚠️ PRESTAZIONI — un nemico disegnato a mano vettorialmente costa quanto la sua complessita'**. Il Nugolo
  (9 sagome × ~20 operazioni) costava **116 µs per nemico per frame**, tre volte lo scheletro. Quando
  l'animazione e' **periodica** (un battito d'ali, una rotazione) le pose sono un numero finito: vanno
  **cotte** su canvas piccole una volta sola (`_batFrames`) e poi ricopiate con `drawImage`. Da 116 a 31 µs.
- **⚠️ PRESTAZIONI — disegnare cio' che e' fuori inquadratura non e' gratis.** La canvas ritaglia, ma il costo
  di costruire i tracciati e' gia' stato pagato. Il ciclo dei mostri e dei proiettili in `render()` ha ora un
  test di visibilita' (l'illuminazione ce l'aveva da sempre): vale l'11-15% del frame.

- **⚠️ MAPPE — `widenForBoss` e' un regolatore di densita', non un correttore di corridoi** *(misurato v1.62)*.
  Fa 4 passate e allarga a 3 tessere ogni corridoio piu' stretto. Effetto collaterale: **azzera qualunque
  differenza di densita' in ingresso**. Misurato su 60 mappe con la stessa posa forzata a densita' diverse —
  pad 1 → 769 tessere di muro alla posa, **513 dopo**; pad 2 → 611, **536 dopo**; pad 3 → 513, **513 dopo**.
  Tutto converge a "campo aperto con pilastri". Conseguenze da tenere a mente:
  - `theme.blobMul` **non e' collegato di proposito**: collegarlo non cambia niente (provato e misurato).
  - Anche il termine sul livello in `blobCount` non fa nulla: la mappa dell'ondata 20 ha la stessa roccia
    di quella dell'ondata 1. In piu' la posa **satura a ~15 blob** perche' `areaFree` pretende 2 tessere
    libere attorno a ogni masso, e i 700 tentativi finiscono sempre.
  - **Qualunque archetipo di pianta con corridoi stretti (catacombe, labirinto) va in conflitto con questa
    funzione**: e' la prima cosa da rifare quando si affrontano gli archetipi. La direzione e' garantire il
    passaggio dei boss **lungo un percorso** (spawn → uscita) invece che su tutta la mappa.
- **⚠️ MAPPE — non dare per scontato che vicino al giocatore ci sia pavimento libero** *(v1.62)*. Fino alla
  1.61 la partenza era il centro geometrico, di fatto sempre sgombro, e diversi test piazzavano il nemico a
  un offset fisso (+90, +260px) contando su quello. Con la partenza variabile la garanzia non c'e' piu':
  in `test/simulate.js` si usa `losSpot(room, p, dist)`, che cerca un punto alla distanza voluta senza muro
  e con linea di vista libera.

- **Solo vista frontale.** Il puppet frontale non mostra bene la schiena: allontanandosi (`back`) togliamo gli occhi
  e mettiamo un velo scuro. Per un vero "dorso" servirebbe un set di pezzi "back".
- **AI non frame-consistent** → per questo NON usiamo sprite sheet: 1 sola illustrazione, animata via rig.
- **Cuciture ai giunti.** Se si vedono buchi ruotando un arto: aumenta l'**overlap** del box sul lato del giunto e/o
  sposta il **pivot** più dentro il corpo; l'ordine `z` (torso sopra le braccia? o sotto?) va scelto per nascondere
  la giunzione.
- **Doppia ombra.** Ricorda `if (!def.puppet) this._shadow(...)` in `_drawMonster`.
- **`ctx.filter='blur(...)'`** per l'ombra: supportato dai browser moderni; su canvas molto vecchi degraderebbe
  (l'ombra apparirebbe netta ma funzionale).
- **Coerenza SC.** `SC` in `renderer.js` **deve** essere uguale a `SCALE` nello slicer, altrimenti i pezzi risultano
  di dimensione sbagliata.
- **Performance:** 6 `drawImage` + 1 ellisse sfocata + overlay per mostro. Con decine di mostri è trascurabile (i test
  di stress girano a `perf avg ~0.2ms`).

---

## 14-bis. AGGIORNAMENTO v1.39 — Motore generico, Negromante, migliorie

### A) Motore PUPPET generico (`PUPPETS[key]` + `PROF[key]`)
- **`PUPPETS[key]`** (registry): `makePuppet(base, file)` crea `{ready, man, imgs, load()}`. In `R.init` si fa
  `for (const k in PUPPETS) PUPPETS[k].load();`. Esistono `ghoul` e `mage`.
- **`PROF[key]`** (profilo animazione): espone `OY0` (riga d'ancoraggio), `K` (scala), `order` (ordine disegno),
  `gait` ('walk'|'float'), `eliteFilter` (stringa `ctx.filter` per gli elite) e due funzioni:
  - `pose(t, moving, atk) → {P, bob, lungeX, tilt, swing, [cast]}`
  - `death(p) → {P, bob, alpha}` (p = 0..1 avanzamento morte)
- **`_puppet(key, ctx, r, eye, t, atk, back, moving, hit, elite)`**: funzione generica che fa transform/ombra/
  hit-reaction/tint/overlay per QUALSIASI puppet. **`_puppetDeath(key, …, p)`**: crollo dei pezzi.
- Dispatch in `_front`: `shape==='ghoul' → _puppet('ghoul',…)`, `shape==='mage' → _puppet('mage',…)`.
- **Aggiungere un puppet ora = "manifest + profilo"**: slicer → `PUPPETS[nuovo]` → `PROF[nuovo]` → def in monsters.js.

### B) Migliorie applicate a TUTTI i puppet (in `_puppet`)
- **Hit-reaction:** se `hit`, wrap dei pezzi in `translate(-5,0)` (rinculo) + `scale(1.06, 0.9)` attorno alla riga
  dei piedi (squash). Gli occhi avvampano (pulse + raggio).
- **Inclinazione (tilt):** il profilo ritorna `tilt` (gradi) aggiunto a torso/testa/veste (0.4× agli altri pezzi);
  in movimento `tilt≈2.5–3.5°`, in attacco cresce.
- **Ombra dinamica:** ellisse sfocata alla `feetY`; in movimento `stretch=1.22` e offset lungo il moto; segue `lungeX`.
- **Tint ELITE:** se `elite`, prima di `drawImage` si imposta `ctx.filter = prof.eliteFilter`
  (ghoul: `hue-rotate(-38deg) saturate(1.5)`, mage: `hue-rotate(20deg) saturate(1.6) brightness(1.12)`).
- **Morte dedicata:** `_drawDeaths` usa `_puppetDeath` per i def con `puppet`; `spawnDeath` allunga la durata a 0.8s.

### C) Negromante (mage) — manifest & profilo
- **Slicer:** `tools/slice_mage.py`. Punti chiave della maschera: soglia `lum<170` + **fill SOLO dei buchi piccoli**
  (area < 4000 px) per NON riempire la tasca di sfondo racchiusa dal braccio-bastone (altrimenti sliver bianco).
- **Manifest** `public/assets/enemies/mage/mage.json`: `charH≈1232`, `originX 512`, `feetY 1420`,
  `eyes [[448,545],[585,545]]`, `orb [175,360]`. Parti (z): `robe`(0), `armStaff`(1), `torso`(2), `armHand`(3), `head`(4).
- **Profilo `PROF.mage`:** `OY0 900`, `gait 'float'`. `pose`: fluttua (`bob=5·sin`), veste a pendolo, bastone dondola;
  **cast in due tempi** (`wind@0.32` alza il bastone, `strike@0.66` proietta con rinculo). Ritorna anche `cast`
  (intensità) usato dall'**overlay orbe** (glow viola sul `man.orb`). `death`: veste si accascia, cappuccio cade, bastone crolla.

### D) IA Negromante (`shared/ai.js` → `necromancer`) — REQUISITI IMPLEMENTATI
- **Kiting:** se troppo vicino fugge, se lontano avanza, altrimenti tiene posizione.
- **Campo visivo:** `m.facing` ruota **lentamente** verso il bersaglio con `MU.turnToward(cur, des, turn·dt)`.
  `inView = d≤sightRange && angolo≤fov && LOS libera`. `m.alert = inView?1:0`.
  **Taratura (v1.40):** `fov 0.55` (semi-angolo rad → cono totale ~63°) e `turn 1.7` rad/s (~97°/s), `sightRange 360`.
  Tutti e tre sono campi della def `darkmage` in `monsters.js`: alza `fov` per un cono più ampio, abbassa `turn`
  per una testa più lenta/aggirabile. Anteprima di taratura: `tools/preview_cone.py` (confronto larghezze cono).
- **Sfere DEBILITANTI:** solo se `inView` e `atkT≤0` → `ctx.shoot/spread` con `def.curse=true` ⇒ il proiettile chiama
  `cursePlayer` all'impatto (riduce danno & velocità). Ogni 3° tiro è un ventaglio da 3.
- **Evocazione con TETTO:** `alive = ctx.countMinions(m.eid)`, `cnt = min(cap-alive, summonCount)`,
  `ctx.summonMinion(summon, x, y, m.eid)` (tagga `owner=eid`, `minion=true`). `minionCap=4`, `summon='zombie_mini'`.
- **Server (`Room.js`):** aggiunti `ctx.summonMinion(id,x,y,owner)` e `ctx.countMinions(owner)`; snapshot invia
  `o.al` (alert) per `darkmage`. **Client** disegna il **cono-telegrafo** (in `_drawMonster`, gate `def.fov`),
  fioco e più acceso quando `m.al`.

### E) Def di gioco (`shared/monsters.js`) — v1.39
- `skeleton` (Zombie Putrido): puppet `ghoul`, mischia.
- `zombie_mini` (Zombie Minore): puppet `ghoul` **raggio 12** (mini), `weight 0` (solo evocato), `minion:true`.
- `darkmage` (Negromante): puppet `mage`, `ai 'necromancer'`, `curse:true`, `fov 0.62`, `sightRange 360`,
  `summon 'zombie_mini'`, `summonCd 6`, `summonCount 2`, `minionCap 4`, `projSpeed 250`, `projColor '#a06bff'`.
- `ORDER = ['skeleton','darkmage']`. `poolForWave`: `skeleton` sempre, `darkmage` da w≥3.

---

## 14-ter. AGGIORNAMENTO v1.42 — Bruto delle Caverne (tank, focus BRACCIA)

### A) Asset & slicer
- **Illustrazione:** un unico PNG frontale (bruto ingobbito, braccia enormi, zanne, occhi ambra). Slicer
  `tools/slice_brute.py` → 6 pezzi in `public/assets/enemies/brute/` + `brute.json`.
- **Pivot chiave (le braccia sono la firma):** i pivot di `armR`/`armL` sono alla **SPALLA** (in alto sul braccio),
  così una rotazione fa oscillare tutto il braccio + pugno come un pendolo pesante.
- **Manifest** `brute.json`: `charH≈986`, `originX 512`, `feetY 1220`, `eyes [[467,500],[556,500]]`.
  Parti (z): `legR`(0) `legL`(0) `torso`(1) `armR`(2) `armL`(2) `head`(3). Le braccia (z2) stanno **davanti** al
  busto ma **dietro** la testa (z3), così i pugni si leggono e il volto resta visibile.
- **Nota slicing:** alzare il bordo superiore dei box delle braccia (`y0≈322`) per includere gli spallacci,
  altrimenti resta una tacca rettangolare sopra la spalla. `fill_holes` solo per buchi < 5000 px (occhi/bocca).

### B) Profilo `PROF.brute` (renderer.js)
- `OY0 760`, `K 2.55`, `gait 'walk'`, `eliteFilter 'hue-rotate(-12deg) saturate(1.6) brightness(1.12)'` (ambra).
- **Camminata pesante:** `WALK {cad:0.9, leg:20, arm:24, torso:4, head:2, bob:13, sway:5}` → falcata lenta, **grande
  dondolio delle braccia in opposizione** (`armR=-arm·sin`, `armL=-arm·sin(+π)`), waddle marcato.
- **Idle:** respiro pesante (`bob 7·sin`), braccia che ciondolano lente (`±5°`).
- **SLAM a due tempi** (guidato dall'evento `slam`): `wind@0.32` = si erge (`bob −12`), busto reclinato, pugni cocked
  verso l'esterno-alto (`armR +30·wind`, `armL −30·wind`), testa su; `strike@0.66` = **schianto**: il corpo affonda
  (`bob +20`), **affondo** in avanti (`lungeX +34`), busto/testa si inclinano (`tilt +12`, `head +24`), i pugni
  convergono avanti (`armR −22·strike`, `armL +22·strike`). **Nota:** con questo pivot alla spalla NON si fa un
  "overhead" pulito (servirebbero ~180°); lo slam sfrutta l'affondo del corpo + i pugni che guidano.
- **Morte:** crollo in avanti (braccia che si accasciano, testa che cade, corpo abbattuto), con dissolvenza.

### C) IA & dati
- `shared/monsters.js` → `cave_brute`: puppet `brute`, `ai 'brute'`, tier 2, **hp 220**, **speed 60**, radius 24,
  **dmg 28**, `atkRange 62`, `slamRadius 96`, `eye '#ffb14a'`. In `ORDER`; nel pool da **w≥4** (peso 6).
- `shared/ai.js` → `brute`: insegue; a portata fa `ctx.areaDamage(slamRadius, dmg, '#ffb020', kn)` ed **emette
  `{t:'slam', e:m.eid, ...}`**. L'`e` (eid) è essenziale: senza, il puppet non riproduce l'animazione.
- `public/js/main.js` → `case 'slam'`: `if (ev.e != null) R.hitAttack(ev.e, 0.6)` (durata slam più lunga del melee).

### D) Artwork nel progetto
- `public/assets/art/roster_overview.png` (scheda bestiario) e `public/assets/art/cave_brute_concept.png` (concept).
  Scheda testuale in `ROSTER.md`.

---

## 14-quater. AGGIORNAMENTO v1.43 — Bruto (walk/slam), IA di percezione & anti-incastro

### A) Renderer `PROF.brute` (pose)
- **Camminata LUMBERING** (distinta dallo zombie): braccia con **piccolo swing IN SINCRONIA** (`armSwing 8`) + **rollio
  verticale delle spalle** (`armRoll 10`, applicato come `dy` opposto tra i due bracci), **waddle** ampio (`sway 8`),
  **lean** costante in avanti (`7`), cadenza lenta (`cad 0.72`). NIENTE più braccia in grande opposizione.
- **SLAM overhead** (due tempi): WIND (`_bump@0.30`) alza i pugni **sopra la testa** (`armR +140`, `armL −140`), si
  erge (`bob −16`) e si inarca (`tilt −8`); STRIKE (`_bump@0.66`) i pugni **scendono a martello** convergendo avanti
  (`armR +34`, `armL −34`), il corpo **si abbatte** (`bob +22`, `tilt +16`, `lungeX +22`). Nota: l'arco overhead→terra
  nasce dalla transizione wind→strike (le due gaussiane si alternano nel tempo).
- **Anteprima:** `tools/preview_brute_v143.py` (rispecchia la matematica; free, non usa image_gen).

### B) IA (`shared/ai.js`) — percezione, memoria, vagabondaggio
- `perceive(m, ctx, senseR)`: sees = `d ≤ senseR && ctx.losClear(...)`; aggiorna `m.lkx/lky` e `m.seeT = def.memory`.
- `investigate(m, ctx)`: finché `seeT>0` va all'ultima posizione nota (seek), poi si spegne.
- `wander(m, ctx, sm)`: sceglie un bersaglio casuale raggiungibile (`!isWallAt && losClear`), lo raggiunge, ne prende
  uno nuovo a target raggiunto / timer scaduto / **incastro** (poco spostamento reale tra i tick, `_wstuck`).
- `swarm` (zombie) e `brute` ora fanno: **vede → insegue/attacca**, **memoria → investiga**, **altrimenti → vaga**.
- **Brute FOV-slam:** in vista+gittata avvia `m.winding` (wind-up) ed **emette `slam_wind` (con eid)** per l'anim;
  al `windT ≥ winding*0.62` applica `areaDamage(slamRadius, dmg, colore, slamKnock)` ed **emette `slam`** (FX).
  Def: `sightRange 400, memory 4, slamWind 0.72, slamKnock 4.2, slamRadius 104, atkRange 70`.
- **Client** (`main.js`): `slam_wind` → `R.hitAttack(e, dur)` (alza le braccia); `slam` → onda d'urto + scossone.

### C) Anti-incastro server (`Room.js`) — vale per TUTTI (boss compresi)
- Nel loop `updateMonsters`: misura **intento vs spostamento reale**; se voleva muoversi ma `moved < want*0.3`
  accumula `m._stuckT`; oltre 0.35s chiama `_recoverStuck(m, aim)` che **scivola** nella direzione libera più allineata
  (tra 8) o fa un **piccolo salto** verso la cella libera più vicina; reset dopo 1.4s. `_unstuck` invariato per i casi
  "dentro un muro". Verifica: 0 mostri nei muri sotto stress con tutti i boss; `verify_boss_paths` **2100/2100**.

---

## 14-quinquies. AGGIORNAMENTO v1.44 — Melma Corrosiva (squash & stretch) + Bruto affinato

### A) Motore puppet — supporto SQUASH & STRETCH
- `PROF[key].pose(...)` può ora restituire **`sx`/`sy`** (scala non uniforme). In `_puppet` e `_puppetDeath` la scala
  è applicata **attorno alla riga dei piedi** (`translate(0,fy); scale(sx,sy); translate(0,-fy)`), combinata con lo
  squash dell'hit. Riusabile da qualunque puppet.

### B) Slime — asset & profilo
- **Slicer** `tools/slice_slime.py`: sfondo baked = **grigio chiaro a bassa saturazione** → subject = `lum<150 | sat>85`
  (dark o verde saturo) per escludere l'aura translucida; `closing+fill+opening`; knock-out finale dell'alpha sui pixel
  bg residui. UN solo pezzo `body`, pivot alla **base** (originX, feetY).
- **Manifest** `slime.json`: `charH≈954`, `originX 627`, `feetY 1088`, `eyes [[520,431],[742,434]]`, `core [632,858]`.
- **`PROF.slime`** (`OY0 706`, `K 2.5`, `order:['body']`): idle jiggle (`sx/sy ±0.05`), saltello (a terra `sx>1,sy<1`,
  in aria `sx<1,sy>1`, `bob` negativo al salto), attacco (comprime in `wind`, schizza avanti in `strike`), morte = melt
  (`sy→0`, `sx→+`, alpha→0).
- **Overlay** (in `_puppet`): **nucleo** verde pulsante su `man.core` (avvampa se `hit`), **occhi** con fallback su
  `byName.body` e `noBack` (il blob mostra sempre gli occhi). **Aura**: in `_drawMonster` il ramo puppet usa `def.aura`
  (moltiplicatore) → aura verde più marcata e pulsante; `def.bubbles` spawna bolle acide che salgono.
- **Def** `monsters.js`: `slime` puppet `shape:'slime'`, `ai:'swarm'`, `aura:3`, `bubbles:true`. In `ORDER`; nel pool
  **dal primo stage** (peso 16). Bruto anch'esso nel pool dal primo stage (peso 8).

### C) Bruto — passo & slam (v1.44)
- **Camminata:** aggiunto `WALK.lift` (il piede si solleva: `legR dy=-lift·max(0,sin)`, `legL` sfasato di π) e falcata
  ampliata (`leg 22→34`). Passo ben leggibile.
- **Slam:** strike più profondo (`bob +34`, `tilt +22`, `lungeX +30`). FX client (`main.js` `case 'slam'`): **doppia
  onda d'urto** (chiara + ambra) + **anello di polvere**, **burst** di detriti, **hit-stop** (0.05) e **scossone 13**.

---

## 14-sexies. AGGIORNAMENTO v1.47 — SPRITE SHEET (Troll delle Caverne)

Alternativa al puppet: **sprite sheet frame-by-frame** (quando l'artista fornisce i frame già disegnati → camminata
naturale, niente rig, niente frame-consistency da combattere perché i frame sono coerenti per costruzione).

### A) Asset & manifest
- `public/assets/enemies/troll_sheet/{idle,walk,attack}.png` — 3 fogli **5×5 @256px** (1280×1280). Alpha vera.
- `troll.json`: `cols 5, rows 5, cell 256, charH 150` (altezza contenuto ~150px), e per ogni animazione:
  `{file, frames, fps, ax, ay, oneShot?}`. **ax/ay = anchor nella cella ai PIEDI** (idle ~132/198, walk ~130/199,
  attack ~137/205). Il foglio è disegnato **verso destra** → mirror per andare a sinistra.

### B) Renderer (`SHEETS[key]` + `_drawSheet`)
- Loader `makeSheet(base,file)` come i puppet, ma carica un PNG per animazione. Preload in `R.init`.
- `_drawSheet(key, ctx, m, r, def, atk, moving, flip, hit)`: stato→anim (`atk>0`→attack, `moving`→walk, altrimenti
  idle); frame: **one-shot** (attack) `floor(atk*frames)`; **loop** `floor(time*fps + eid*0.7) % frames` (sfasa i
  cloni). Scala `s=(2.9*r)/charH`; ritaglia la cella `(col*cell,row*cell)` e disegna con offset `(-ax*s,-ay*s)` così
  l'anchor cade sul punto-terra. `flip<0`→`ctx.scale(-1,1)`. `hit`→`ctx.filter='brightness(1.7)'`.
- Dispatch in `_drawMonster`: `else if (def.sheet) { flip=cos(m.f)<0?-1:1; _drawSheet(...) }` **prima** di `def.front`.
  Aura tenue via ramo `def.puppet||def.sheet`. Morte in `_drawDeaths`: frame idle che **cade in avanti** (rotate+scale).
- **v1.48 — grounding & moving:** lo sprite-sheet è **escluso dall'ombra generica** (`if(!def.puppet && !def.sheet)`)
  e disegna la **propria ombra sfocata AI PIEDI** dentro `_drawSheet` (contesto già su `m.x,m.y` → piedi all'origine),
  altrimenti l'ombra generica (a `y+rr·0.75`) sembra staccata e il mostro "fluttua". Il rilevamento `moveInfo` usa
  soglie **basse con isteresi** (`on>0.28`, `off<0.10`) così i mostri LENTI (Troll ~1px/frame, vagabondaggio 0.5px)
  attivano davvero la **camminata** invece di restare in idle scivolando.

### C) Dati & IA
- `monsters.js` → `cave_brute`: `sheet:'troll'` (rimossi `puppet/front`), `slamWind 0.78`, **`slamHit 0.72`** (istante
  del danno = frame d'impatto a schermo), `slamRadius 108`. IA invariata (`brute`: FOV-slam, vagabondaggio, anti-incastro).
- L'attacco è pilotato dal `slam_wind` (con eid): `R.hitAttack(e, dur)` avvia i 25 frame; l'evento `slam` (senza eid)
  aggiunge la scossa/onda d'urto all'impatto.

### C-bis) v1.60 — quello che va MISURATO, non stimato
Con lastre nuove, prima di toccare il codice conviene misurarle: uno script Pillow che per ogni cella calcola
il bounding box dell'alpha dice tre cose che a occhio non si vedono.
- **`ay` per animazione** = la riga dei piedi (y massimo del contenuto). Se le animazioni hanno `ay` diversi
  dalla loro riga dei piedi reale, il mostro **salta** passando da una all'altra. Nella v1.60 l'attacco era
  ancorato a 205 con i piedi a 216: 11px di scarto.
- **Fotogramma d'impatto** = quello col contenuto piu' basso (i piedi affondano) e la testa piu' bassa. Va
  dichiarato come `hitFrame` e agganciato a `slamHit`, altrimenti il colpo si vede prima del danno.
- **Fotogrammi morti** = celle con area e posizione identiche in testa all'animazione. Vanno bruciati con una
  curva (`^0.72`) invece di occupare un quinto del tempo utile.
Il passo va poi agganciato alla **distanza percorsa** (`cyclePx`), mai a fps fisso: e' l'unico modo perche' i
piedi non slittino quando la velocita' cambia.

### C-ter) v1.61 — nemici SENZA asset: quando il vincolo è il criterio

Il motore non ha budget per nuovi cicli di camminata disegnati a mano. Invece di subirlo, dalla v1.58 il
vincolo **sceglie** i nemici: le famiglie che non hanno gambe da animare. Tre schemi già in uso, tutti
vettoriali puri (`_fungusF`, `_rollerF`, `_batsF`, `_wispF`) e tutti agganciati in `_drawMonster` con un
flag nella def (`def.fungus`, `def.roller`, `def.bats`, `def.wisp`):

- **Immobile** (Fungo) — l'animazione è il respiro e lo sbuffo. `def.immobile` lo esclude da anti-incastro,
  `_separate` e `_pushOff`: è piantato, e nessuno lo sposta.
- **Rotolante** (Sfera d'Ossa) — l'animazione è una rotazione ricavata dallo **spostamento reale**: se sta
  ferma non gira.
- **Sciame** (Nugolo) — **una entità, N sagome**. Le fasi si distribuiscono con l'**angolo aureo**
  (`i * 2.399963`) così non si allineano mai, e le sagome si **ordinano per y** prima di disegnarle, altrimenti
  la sovrapposizione è casuale e lo sciame "sfarfalla". Le ali sono **una sinusoide**, non fotogrammi.
- **Fluttuante** (Fuoco Fatuo) — nessun contatto col terreno da giustificare: bob verticale + **tre sinusoidi
  sfasate** per la fiamma. Al posto dell'ombra, un **riflesso di luce** a terra: un'ombra lo farebbe poggiare.

**Regola di contrasto.** Il pavimento è quasi nero: un nemico scuro senza bordo chiaro e senza alone **sparisce**.
La prima resa del Nugolo (corpo `#171320`) era illeggibile in anteprima; corpo grigio-viola con bordo, venature
sulle ali e alone tenue sotto la massa hanno risolto. **Vale la pena renderizzare l'anteprima prima di dire
che è fatto.**

**Nemici che ATTRAVERSANO i muri (`def.phasing`).** Il movimento normale passa da `moveCircle` + `_unstuck` +
rilevamento incastro: tre meccanismi che esistono per **rimettere fuori** dai muri, quindi vanno saltati tutti
e tre, insieme a `_separate`. Restano due obblighi: **clamp ai bordi** della griglia (altrimenti esce dalla
mappa) e **accelerazione + divieto di attacco mentre è dentro la roccia** — un nemico che colpisce da dentro un
muro è ingiocabile, perché i proiettili del giocatore muoiono sul muro. Ricordarsi anche di **escluderli dal
test** "nessun mostro resta dentro un muro": lì ci stanno per design.

### D) Aggiungere un altro sprite-sheet (ricetta)
1. PNG (una griglia per animazione, celle uniformi) + `nome.json` (`cols/rows/cell/charH` e per anim `frames/fps/ax/ay`).
2. `SHEETS[nome] = makeSheet('assets/enemies/nome_sheet/', 'nome.json')`.
3. Nel mostro: `sheet:'nome'` (niente `puppet`/`front`). Fatto.

---

### 14-septies. AGGIORNAMENTO v1.49 — BEHOLDER (raster puppet single-piece + render dedicato)

Variante del metodo raster con **UN solo pezzo** (come lo SLIME): l'illustrazione del beholder viene ritagliata
in un unico `body.png` e animata via **render dedicato** (niente rig a giunti).

- **Slicer:** `tools/slice_beholder.py`. Sfondo baked a scacchiera chiara -> subject = `~bg` (`lum>168 & sat<42`),
  poi componente connessa piu grande, closing+fill+opening. Salva `body.png` + `beholder.json` (pivot = CENTRO;
  `core` = centro dell'occhio grande in spazio-originale, per l'overlay dell'iride).
- **Render dedicato** `_beholderPuppet` (renderer.js): billboard che **fluttua** e respira (leggero squash),
  ombra morbida sotto. Overlay: **iride centrale che SEGUE** il bersaglio (spostata di ~0.16*r verso `m.f`) con
  **pupilla che si dilata** in attacco; **corona di eyestalks** (7 glow additivi) che **avvampano**; **edge-glow**
  magenta pulsante (flare su hit/attacco).
- **Sguardo multi-raggio:** colore di iride/eyestalks/edge-glow da `m.gk` (weaken `#ff7a5a`, slow `#5ad0ff`,
  sunder `#c48cff`); l'IA `gazer` alterna `m.gk` ogni `gazeCycle` s -> le eyestalks "ruotano" tra i tre sguardi,
  coerenti col **fascio** in `_drawMonster` (gate `m.t==='occhio'`).
- **Dati:** `monsters.js` -> `occhio` ("Beholder") `shape:'beholder'`, `puppet:true`, `beholder:true`, `aura:2.4`,
  `ai:'gazer'`. Dispatch nel ramo `def.beholder`; morte dedicata (l'occhio implode). `PROF.beholder` minimale.

## 15. Mappa dei file coinvolti

| File | Ruolo |
|---|---|
| `public/assets/enemies/ghoul/*.png` + `ghoul.json` | i 6 pezzi raster dello Zombie + manifest |
| `public/assets/enemies/mage/*.png` + `mage.json` | i 5 pezzi del Negromante + manifest (`orb`, `eyes`) |
| `public/assets/enemies/brute/*.png` + `brute.json` | i 6 pezzi del Bruto (braccia enormi, pivot alla spalla) |
| `public/assets/art/roster_overview.png`, `cave_brute_concept.png` | artwork del bestiario + concept del Bruto |
| `public/js/renderer.js` | `PUPPETS[key]`+`PROF[key]` + `_puppet()`/`_puppetDeath()` + dispatch in `_front` + cono-telegrafo & no-doppia-ombra in `_drawMonster` |
| `shared/monsters.js` | def `skeleton` (ghoul), `zombie_mini` (ghoul mini), `darkmage` (mage) + `ORDER` |
| `shared/waves.js` | `poolForWave` (`skeleton` sempre, `darkmage` da w≥3) |
| `shared/ai.js` | IA `necromancer` (FOV + curse + evocazione con tetto) |
| `server/Room.js` | `ctx.summonMinion`/`countMinions` + snapshot `o.al` (alert mage) |
| `test/simulate.js` | test roster/puppet/negromante (`testV139`) |
| `tools/slice_puppet.py`, `tools/slice_mage.py` *(offline)* | generano pezzi + manifest dalle illustrazioni |
| `tools/preview_v137.py`, `tools/preview_v139.py` *(offline)* | anteprime rig per taratura |

---

*Fine documento — se apri una nuova chat, questo file da solo basta per ricostruire l'intera tecnica dei mostri.*
