# 🧍 Lo spritesheet degli eroi — specifica e prompt

Come va costruito il foglio base perché io possa "vestirlo" sette volte, e il testo da incollare a chi
(o a cosa) lo disegna.

---

## 0. Tre decisioni da prendere PRIMA di disegnare

Non sono dettagli: cambiano il disegno, non il codice. Se le sbagliamo si rifà tutto.

### a) Vista zenitale, UNA sola direzione

Il gioco ruota il personaggio con `ctx.rotate(p.a)` seguendo il mouse: **una direzione sola**, e il
motore la gira. Quindi serve un unico verso — il personaggio **rivolto verso l'alto del fotogramma** —
e non otto direzioni.

Conseguenza diretta, ed è la cosa che più spesso si sbaglia: **niente luce direzionale cotta nel
disegno**. Se illumini da sinistra, quando il personaggio si gira la luce gli gira addosso e si vede
subito che è un cartonato. Illuminazione ambiente piatta, al massimo un filo di occlusione sotto le
braccia.

> Nota: il troll (`troll_sheet`) è **di profilo**, specchiato per direzione, ancorato ai piedi. Non è
> un precedente da copiare: quello è un mostro, gli eroi no.

### b) L'arma: dentro o fuori il foglio?

L'equipaggiamento cambia in partita (asce, archi, bastoni, scudi, e ogni pezzo ha la sua tinta). Due strade:

- **Mani vuote nel foglio** — io continuo a disegnare le armi in vettoriale sopra lo sprite, come
  adesso, e l'equipaggiamento continua a vedersi addosso. **È quella che consiglio.**
- **Arma disegnata nel foglio** — più bella e più coerente, ma ogni classe resta con quell'arma per
  sempre e il negozio smette di vedersi addosso.

### c) La sagoma: un corpo solo, o sette?

**Questo è il punto che la ricolorazione non può risolvere.** A quaranta pixel di diametro quello che
distingue una classe è la **sagoma**, non la texture: il cappuccio del warlock, i spallacci del
paladino, il cappello a tesa del mago, la pelliccia del barbaro. Ricolorare un corpo nudo sette volte
dà sette personaggi della stessa forma in sette colori.

Tre vie, in ordine di costo:

1. **Un corpo base + fogli accessorio** sulla stessa animazione e sulla stessa griglia: `mantello.png`,
   `cappuccio.png`, `spallacci.png`, `veste-lunga.png`, `pelliccia.png`. Trasparenti dove non c'è
   niente, io li sovrappongo. **Il migliore rapporto fra lavoro e resa.**
2. **Sette fogli completi**, uno per classe. Il massimo, e sette volte il lavoro.
3. **Un corpo solo**, differenze solo di colore. Costa poco e si vede che costa poco.

---

## 1. Il prompt da incollare

> **Top-down (zenithal) character spritesheet for a 2D action roguelike.**
>
> **Camera:** strictly orthographic, straight down from directly above (90°, true bird's eye). No
> perspective, no tilt, no 3/4 view. The character faces **toward the top of the frame** in every
> frame — a single facing only, the engine rotates the sprite at runtime.
>
> **Subject:** a human adventurer, neutral build, **bare base body**: simple sleeveless tunic, belt,
> trousers, boots, bare head, **empty hands**. No cloak, no hood, no pauldrons, no weapon, no shield —
> those are separate overlay layers. Read from above you mainly see head, shoulders, upper arms and
> the tips of the boots: that is correct, do not cheat the pose toward a 3/4 view to show the face.
>
> **Lighting:** flat ambient light, uniform from all directions. **No directional light, no sun, no rim
> light, no cast shadow on the ground, no glow.** Only a very soft ambient occlusion under the arms and
> around the belt. The sprite rotates under a fixed camera: any baked light direction will rotate with
> it and break the illusion.
>
> **Colour:** flat, clearly separated material zones with gentle internal shading — skin, hair, main
> cloth, leather, metal, trim. Each material must stay a distinct, unambiguous hue so it can be
> recoloured programmatically. No gradients that blend one material into another, no colour grading,
> no texture noise.
>
> **Outline:** a uniform 1–2 px dark outline, always the same colour `#07080C`. Never tinted.
>
> **Sheet layout:** grid of **6 columns × 4 rows**, cell **128 × 128 px**, frames in reading order
> (left to right, top to bottom). Transparent background, true alpha, PNG-32, no matte or halo.
>
> **Framing:** the character's body fits inside a **96 px circle centred on the cell**; limbs and
> motion may reach 128 px but must never touch the cell border. **The pivot stays at the exact centre
> of the cell (64, 64) in every single frame** — the body must not drift in the cell; all movement
> happens around that point.
>
> **Three animations, one PNG each, 24 frames each:**
> - `idle.png` — breathing, slight shoulder rise and fall, weight shifting. Seamless loop.
> - `walk.png` — a full walk cycle of **two steps** (left then right), seen from above: shoulders
>   counter-rotating, arms swinging out from the silhouette, boots alternating. **Seamless loop**, frame
>   24 flowing back into frame 1.
> - `attack.png` — a single swing, **not** a loop: wind-up, strike, recovery. The impact must land on
>   frame 15.
>
> **Do not include:** motion blur, outlines of varying colour, baked ground shadow, UI, background,
> text, frame numbers, borders or grid lines between cells.

---

## 2. Il secondo foglio: la MASCHERA

È quello che rende possibile la ricolorazione pulita. Stessa griglia, stesse celle, stessi fotogrammi,
**esattamente allineato** al foglio a colori — ma ogni materiale una tinta **piatta e pura**, senza
ombre, senza sfumature e **senza antialiasing**:

| zona | colore chiave |
|---|---|
| pelle (volto, mani, collo) | `#FF0000` |
| capelli / barba / pelliccia | `#00FF00` |
| tessuto principale (tunica, brache) | `#0000FF` |
| tessuto secondario (mantello, tabarro, cappuccio) | `#FFFF00` |
| cuoio (cinture, bracciali, stivali) | `#FF00FF` |
| metallo (piastre, fibbie, elmo) | `#00FFFF` |
| bordure, ricami, accenti | `#FF8000` |
| arma / oggetto in mano | `#FFFFFF` |
| contorno e tutto il resto | `#000000` |

**Se il foglio nasce da un render 3D la maschera costa un secondo passaggio di render**: stessi
fotogrammi, materiali sostituiti con tinte piatte emissive e luci spente. È mezza giornata di
differenza fra "ricolorazione perfetta" e "tinta approssimativa".

Se la maschera non è producibile, la seconda scelta è un foglio a colori dipinto **usando quelle tinte
chiave come colore di base** di ogni materiale, con sopra solo ombreggiatura in grigio. Classifico per
tonalità — funziona, ma sbaglia sui bordi.

---

## 3. Le tinte delle sette classi

Questi sono i colori che il gioco usa **oggi** per gli eroi vettoriali. Sono già tarati e distinguibili
fra loro a distanza: se mi mandi texture più specifiche, mandale organizzate su queste voci.

| classe | corpo | testa | spalle | tessuto | bordura | pelle |
|---|---|---|---|---|---|---|
| **Barbaro** | pesante | nuda | pelliccia | `#6b4a2a` | `#d8a33a` | `#c08050` |
| **Paladino** | pesante | elmo chiuso | acciaio | `#2e4a86` | `#e0b64a` | — |
| **Maestro d'armi** | pesante | elmo aperto | acciaio | `#3a2f2a` | `#c8a23a` | `#c79b6a` |
| **Assassino** | agile | cappuccio | — | `#2b2f42` | — | `#c2a184` |
| **Arciere** | agile | cappuccio | — | `#3c5140` | — | `#c99a6a` |
| **Mago** | arcano | cappello a tesa | — | `#2a3a6a` | `#5aa8ff` | `#d8d2c8` |
| **Warlock** | arcano | cappuccio a punta | — | `#3a1f52` | `#c06bff` | `#4c3a60` |

Le colonne **testa** e **spalle** sono sagoma, non colore: nessuna ricolorazione le può produrre. È la
decisione (c) del punto 0.

---

## 4. Prima di disegnare 72 fotogrammi: mandamene UNO

Il modo più economico di scoprire se la strada funziona:

1. una sola cella — `idle`, fotogramma 1 — a 128 × 128 con l'alpha;
2. la stessa cella in versione maschera.

Io la monto **nel gioco, accanto all'eroe vettoriale, alla dimensione vera (46 px di diametro)** e te
le mando affiancate. Se a quella dimensione la differenza non si vede, hai risparmiato il resto del
lavoro; se si vede, sappiamo già che il resto funzionerà.

---

## 5. Una avvertenza sulla coerenza

Un generatore di immagini da testo **non tiene 24 fotogrammi coerenti**: cambia la faccia, la piega
della tunica, la larghezza delle spalle, e in animazione si vede come uno sfarfallio. Il prompt qui
sopra è scritto bene per un singolo fotogramma; per l'animazione intera le strade che reggono sono tre:

- **render 3D** (modello riggato, camera ortografica a picco, 24 fotogrammi per clip) — la più solida, e
  regala la maschera quasi gratis;
- **rig 2D** (Spine, DragonBones, o le ossa di Blender su ritagli) — buona, più lavoro di setup;
- **disegnato a mano** — la più bella, la più lunga.

---

## 6. Cosa cambio io, dalla mia parte

Il caricatore dei fogli esiste già (`makeSheet` + manifest JSON, lo usa il troll), ma la via di disegno
degli eroi è un'altra: **ruota** col mouse e si ancora al **centro**, non ai piedi. Quindi scrivo:

- un `_drawSheetEroe` che ruota di `p.a` e ancora al centro della cella;
- la ricolorazione dal foglio maschera, una volta al caricamento, con una variante per classe tenuta in
  cache (non per fotogramma: sarebbe uno spreco);
- l'aggancio del passo alla distanza percorsa (`cyclePx`), come per il troll, così i piedi non slittano;
- il ripiego sull'eroe vettoriale se il foglio non è pronto o non carica.

Il manifest che mi serve accanto ai PNG:

```json
{
  "name": "eroe", "cols": 6, "rows": 4, "cell": 128, "charH": 96, "blend": 0.14,
  "anims": {
    "idle":   { "file": "idle.png",   "frames": 24, "fps": 8 },
    "walk":   { "file": "walk.png",   "frames": 24, "cyclePx": 110 },
    "attack": { "file": "attack.png", "frames": 24, "oneShot": true, "hitFrame": 15 }
  }
}
```

`cyclePx` è quanti pixel di mondo copre un ciclo completo di camminata: lo taro io guardando il
risultato, non serve che lo indovini tu.
