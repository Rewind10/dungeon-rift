# 🪓 Prompt — ridisegnare il Barbaro vettoriale

Da incollare a chi (o a cosa) deve riscrivere il disegno. Sotto al prompt ci sono i vincoli tecnici
veri, presi dal codice: **sono quelli che fanno la differenza fra un risultato che si incolla e uno
che va buttato.** Se il prompt lo dai a un modello, dagli anche la sezione 2.

---

## 1. IL PROMPT

> You are writing a **single JavaScript function** that draws a top-down fantasy **barbarian** on an
> HTML5 Canvas 2D context, for a real-time game. No images, no SVG, no external assets, no libraries —
> everything is drawn with path commands. The result must look hand-crafted and expensive, not
> programmer-art.
>
> **Signature and frame of reference**
> ```js
> _heroGuerriero(ctx, r, t, atk, eq) { /* ... */ }
> ```
> - The context is **already translated** to the character's position and **already rotated** so that
>   **+x is the direction the character is facing**. Draw around the origin; never translate to an
>   absolute position.
> - `r` is the character's radius in pixels: **28** at the current size. Express *every* coordinate as
>   a multiple of `r` — never a raw pixel number — so the drawing scales exactly.
> - `t` is game time in seconds: use it for idle motion (breathing, swaying, hair).
> - `atk` goes 0 → 1 over one attack. Drive the swing from `Math.sin(atk * Math.PI)` so the blow
>   accelerates and returns instead of snapping.
>
> **What must be visible at 56 px across — this is the real brief**
> The figure is seen from **directly above** and is about as wide as a thumbnail. Build it out of
> **large, separable shapes with a dark outline**, not detail: at that size, silhouette and two or
> three colour blocks are the whole character. Specifically:
> - a **mane and beard** reading as a shaggy ring around the head — the barbarian is the only
>   bare-headed hero, and that is how you tell him from the other six at a glance;
> - **fur over the shoulders**, with an irregular, ragged outer edge: the fur's outline is more
>   important than the fur's texture;
> - **thick bare arms**, skin-coloured, clearly outside the torso mass;
> - a **two-handed axe** held to one side, handle and head drawn separately, big enough to read.
>
> **Lighting**
> The sprite rotates under a fixed camera, so there is **no light direction**. Use flat fills with
> internal shading that comes from *the material*, not from a sun: darker where a shape is under
> another shape. No drop shadow (the engine draws one), no glow, no gradient that implies a light
> source from one side.
>
> **Outline**
> Every solid shape is stroked with a near-black outline, `lineWidth` proportional to `r` (around
> `r * 0.07`). The outline is what keeps the figure readable against a dark cave floor — it is not
> decoration.
>
> **Colour**
> Take every colour from the palette object, never hard-code one:
> `_P.cloth`, `_P.clothDk`, `_P.criniera` (mane), `_P.pelo` (fur), `_P.pelle` (skin),
> `_P.metallo` (metal), `_P.orlo` (trim). Derive shades with `this._shade(hex, amount)`.
> Hard-coded greys are the specific mistake that broke this drawing before: the player buys coloured
> armour and expects to see it on the character.
>
> **Performance**
> This runs up to six times per frame at 60 fps. Build no `createRadialGradient` / `createLinearGradient`
> inside the function without caching it through `this._grad(key, make)`; allocate no arrays or objects
> per call; prefer a handful of long paths over dozens of short ones.
>
> **Deliver** the function body only, readable, with the geometry expressed in multiples of `r`.

---

## 2. I VINCOLI VERI (dal codice — da allegare al prompt)

Queste cose non si possono indovinare, e sbagliarne una vuol dire riscrivere.

### Il sistema di riferimento
`_drawPlayer` fa `ctx.translate(x, y)` e `ctx.rotate(p.a)` **prima** di chiamare il corpo. Quindi
dentro la funzione: origine = il personaggio, **+x = dove guarda**, +y = la sua destra. Chi disegna
"in alto" la testa produce un personaggio che cammina di fianco.

### La grandezza
`r = PLAYER_RADIUS (16) × HERO_VIS (1.75) = 28`. Il corpo fisico resta **16**: la sagoma e' piu' larga
del corpo, quindi non ha senso disegnare dettagli oltre `r * 1.1` — escono dal personaggio.

### Gli aiuti che esistono gia'
```js
this._shade(hex, amt)      // schiarisce o scurisce un colore esadecimale, ritorna 'rgb(...)'
this._rgba(hex, a)         // lo stesso colore con alpha
this._rr(ctx, x, y, w, h, raggio)   // rettangolo con gli angoli tondi (apre il path, non riempie)
this._grad(chiave, fabbrica)        // cache dei gradienti: la chiave DEVE contenere i colori usati
```
> `_grad` ha una storia: nella v1.82 la chiave non conteneva la tavolozza e due giocatori con lo stesso
> raggio si spartivano lo stesso gradiente — uno si ritrovava addosso i colori del compagno. La chiave
> deve includere raggio **e** firma dei colori.

### La tavolozza
```js
const st  = (eq && eq._st) || {};                       // la riga di STILE della classe
const _P  = Object.assign({}, st, (eq && eq.pal) || {}); // l'equipaggiamento VINCE sulla classe
const DK  = '#0a0c12';                                   // il nero del contorno
```
Le tinte del barbaro, oggi:

| chiave | colore | cos'e' |
|---|---|---|
| `criniera` | `#5a3a1e` | capelli e barba |
| `pelo` | `#6a5a44` | la pelliccia sulle spalle |
| `pelle` | `#c08050` | braccia e viso |
| `metallo` | `#8a7a63` | la lama e le fibbie |
| `cloth` / `clothDk` | `#6b4a2a` / `#3a2716` | il vestito e la sua ombra |
| `orlo` | `#d8a33a` | bordure e dettagli d'oro |

**Nota misurata:** queste tinte sono tarate *sul disegno vettoriale*, dove le forme sono grandi e
piatte col contorno nero. Provate su un corpo dipinto diventavano marrone-su-marrone e la figura si
impastava. Se il disegno nuovo e' piu' morbido o piu' dettagliato, il contrasto caldo/freddo va
ricostruito: pelliccia chiara, vestito scuro, oro acceso.

### Il campo di gioco
- `eq._hid` dice quale classe e': **lo stesso corpo serve barbaro, paladino e maestro d'armi**, che si
  distinguono per testa, spalle e arma. Chi ridisegna solo il barbaro deve lasciare quei tre bivi.
- `eq.sp` e `eq._rk` disegnano aloni *fuori* dal corpo e non riguardano questa funzione.
- `atk` arriva gia' normalizzato 0..1: non va diviso per niente.

### Come si prova
Non serve una partita: si disegna la funzione su un canvas fuori schermo e si guarda il ritaglio a
grandezza vera. Quello che conta non e' come viene a 3×, e' **come viene a 56 px** — e la prova
onesta e' metterlo accanto alle altre sei classi e vedere se lo si riconosce senza leggere l'etichetta.

---

## 3. Una cosa da decidere prima

Questo prompt chiede **codice**, perche' e' quello che il gioco esegue. Se invece preferisci partire da
un'**illustrazione** — che e' piu' facile da far fare bene — allora quella diventa un riferimento, e
qualcuno deve comunque tradurla in path. In quel caso chiedi l'illustrazione **vista rigorosamente
dall'alto, su fondo trasparente, con poche campiture piatte e un contorno netto**: un dipinto morbido
non si traduce in vettoriale, si puo' solo ricalcare male.
