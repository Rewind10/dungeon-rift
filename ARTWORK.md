# 🎨 ARTWORK.md — le illustrazioni di Dungeon Rift

Raccolta dei **brief** per le illustrazioni del gioco: cosa serve, dove va il file, e il **prompt pronto**
da dare al generatore di immagini. Il codice che le usa e' gia' scritto: basta mettere il file al suo posto.

| Illustrazione | File | Formato | Stato |
|---|---|---|---|
| Sfondo del menu iniziale | `public/assets/art/menu_key_art.jpg` | **1920×1080** (16:9) | **rifatta** (v1.89.2) — la prima versione resta in `menu_key_art_v1.png` |
| Scheda del bestiario | `public/assets/art/roster_overview.png` | 1024×1536 | fatta |
| Concept del Troll | `public/assets/art/cave_brute_concept.png` | — | fatto |

---

## 🖼️ Sfondo del menu iniziale *(v1.86)*

### Dove va
`public/assets/art/menu_key_art.jpg` — **esattamente questo nome**. Il CSS lo carica da solo; se il file non
c'e' resta il gradiente scuro di prima e non si rompe niente.

> ✅ **Rifatta in v1.89.2.** La seconda illustrazione arrivava a **1376×768**: portata a **1920×1080** e
> salvata a qualita' 92 (**521 KB**). La prima versione resta in `menu_key_art_v1.png`.
>
> **Come si ingrandisce senza sporcare** (e' quello che ho usato): taglio esatto a 16:9, ingrandimento in
> **due passaggi** — 2x Lanczos e poi giu' alla misura voluta, perche' un salto solo lascia i bordi molli —
> e infine una **maschera di contrasto leggera** (raggio 1,4 · 58% · soglia 3): la soglia serve a non
> alonare sui bordi netti, che in un'illustrazione dipinta sono dappertutto.
>
> ```python
> from PIL import Image, ImageFilter
> im = Image.open('sorgente.jpg').convert('RGB')
> tw = int(round(im.height * 16 / 9))
> if tw < im.width: x0 = (im.width - tw) // 2; im = im.crop((x0, 0, x0 + tw, im.height))
> big = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
> up = big.resize((1920, 1080), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.4, 58, 3))
> up.save('public/assets/art/menu_key_art.jpg', quality=92, subsampling=0, optimize=True, progressive=True)
> ```

### Requisiti tecnici
- **1920×1080**, 16:9. Si puo' generare a 2048×1152 e ridurre: meglio piu' grande che piu' piccolo.
- **JPEG qualita' 85-90**, sotto i **600 KB** se possibile (il menu e' la prima cosa che si carica).
- **Niente testo, niente logo, niente interfaccia** dentro l'immagine: il titolo *DUNGEON RIFT* e il pannello
  li disegna il gioco sopra.

### Attenzione alla composizione
Sopra l'immagine il gioco mette il **pannello del menu**: una card larga **560px** al **centro**, alta quasi
tutto lo schermo. Copre la fascia verticale centrale (circa il **30% della larghezza**). Quindi:
- i **tre eroi vanno larghi** — uno a sinistra, uno al centro ma **piu' arretrato**, uno a destra;
- il **terzo inferiore** dell'immagine viene scurito dalla velatura: niente di importante li' sotto;
- il dettaglio che si deve vedere sta nelle **due fasce laterali**.

*(Se preferisci una posa classica coi tre al centro, si puo' spostare il pannello del menu a sinistra: e'
una riga di CSS. Dimmelo e lo faccio.)*

---

## 📋 IL PROMPT (in inglese, da incollare)

```
Dark fantasy key art / splash screen for a co-op dungeon roguelike video game called "Dungeon Rift".
Cinematic wide shot, 16:9, painted digital illustration, hand-painted concept-art look with visible
brush texture — NOT a screenshot, NOT pixel art, NOT 3D render.

FOREGROUND — three heroes, seen from the FRONT, standing their ground, heroic but grounded, spread wide
across the frame with space between them (left, center-back, right):

1. THE WARRIOR (left) — broad-shouldered human fighter in worn steel plate, cool grey-blue armour
   (#7f8895 highlights, #2f3742 shadow) with warm gold trim (#e0a52c). Closed helm with a narrow visor,
   pauldrons, a heavy longsword held low in one hand, a round steel shield angled forward in the other.
   Scratched, dented, used metal — a veteran, not a parade knight.

2. THE MAGE (center, one step further back) — hooded figure in a deep indigo and midnight-blue robe
   (#3d3c8c over #14133a), long hem moving in the air, arcane runes faintly glowing along the fabric.
   Holding up an open palm with a sphere of bright cyan-teal energy (#00f0c8) hovering above it, casting
   cyan rim light on the face and on the other two heroes' armour.

3. THE ROGUE (right) — lean hooded archer in dark forest-green leathers and a short cloak
   (#3c5140 over #1d2a22) with pale mint-green accents (#9ef0b0). Recurve bow drawn low, one arrow
   nocked, quiver on the hip, face half in shadow under the hood.

BACKGROUND — the enemies, BEHIND the heroes, larger and darker, mostly SILHOUETTES with glowing eyes,
receding into the dark so they read as a horde and never compete with the heroes:
- a mass of rotting undead ghouls pressing forward, glowing acid-green eyes (#8bff86);
- a hooded necromancer floating above them, empty hood with two violet eyes (#a06bff), a staff with a
  burning purple orb, tattered bell-shaped robe;
- a huge hulking cave troll on one side, amber underlight (#ffb14a), enormous stone hammer raised;
- a floating beholder high on the other side: a single great eye with writhing eyestalks and tentacles,
  magenta glow (#ff5ad0), casting a thin magenta beam;
- pools of glowing acid-green corrosive slime on the ground between them;
- a swarm of bats crossing the upper dark.

SETTING AND LIGHT — a vast underground cavern of black rock. Behind the horde, a vertical TEAR IN REALITY
(the "rift"): a jagged violet-magenta wound in the air, bleeding light and floating embers, lighting the
whole scene from behind so every enemy is rim-lit and half-silhouetted. Warm orange torchlight from the
left foreground catches the heroes' faces and armour from the front. Cold cyan spill from the mage's
sphere. Volumetric haze, drifting dust motes, shafts of light, sparks.

MOOD — outnumbered but unbroken: three against a tide. High contrast, deep blacks, saturated coloured
light against desaturated stone. Rich painterly rendering, dramatic cinematic lighting, epic scale.

COMPOSITION — the vertical middle third must stay simple and darker (a menu panel is drawn over it):
keep the strongest detail in the left and right thirds. Bottom third fades into darkness. No horizon line
across the exact center.

NEGATIVE — no text, no letters, no logo, no watermark, no signature, no UI, no HUD, no frame or border,
no modern clothing, no firearms, no photorealism, no anime style, no chibi, no cluttered center,
no characters cut off at the edges.
```

### Versione corta (per i generatori con poco spazio)

```
Dark fantasy game key art, 16:9, painted concept-art style. Three heroes front and center, spread wide:
a steel-plated warrior with longsword and round shield (grey-blue armour, gold trim) on the left; a hooded
mage in indigo robes holding a glowing cyan energy sphere in the middle, one step back; a hooded archer in
dark green leathers with a drawn bow on the right. Behind them, a horde of shadowed enemies rim-lit from
behind: green-eyed undead ghouls, a floating necromancer with a purple orb staff, a huge cave troll with a
stone hammer, a magenta floating eye monster with eyestalks, glowing acid slime. Behind everything, a
jagged violet-magenta tear in reality bleeding light into a black rock cavern. Warm torchlight on the
heroes from the front, volumetric haze, embers, high contrast, cinematic, epic. Darker and simpler in the
vertical center. No text, no logo, no UI, no watermark.
```

### Se il risultato non convince
- **Eroi troppo piccoli** → aggiungi `heroes occupy the lower two thirds of the frame, waist-up framing`.
- **Nemici troppo in vista** → aggiungi `enemies almost entirely in silhouette, 70% darker than the heroes`.
- **Centro troppo pieno** → aggiungi `negative space in the vertical center of the frame`.
- **Sembra uno screenshot** → aggiungi `illustration, matte painting, visible brush strokes` e togli
  qualunque parola tipo *game screenshot* o *gameplay*.
- **Volti storti** → i tre sono **incappucciati o elmati** apposta: se il generatore sbaglia i visi, rinforza
  con `faces hidden in shadow under hood and helm`.

### Quando hai il file
Mettilo in `public/assets/art/menu_key_art.jpg` e ricarica: e' gia' collegato. Se e' troppo pesante:

```bash
# ridimensiona a 1920x1080 e comprime (serve ImageMagick)
magick input.png -resize 1920x1080^ -gravity center -extent 1920x1080 -quality 88 public/assets/art/menu_key_art.jpg
```
