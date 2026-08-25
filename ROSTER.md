# 👹 ROSTER.md — Scheda dei nemici di Dungeon Rift

> Scheda di riferimento rapido di **tutti** i nemici del gioco. Per la **tecnica** di realizzazione (raster puppet,
> sprite sheet, slicing, animazioni) vedi `ENEMIES.md`. Per la cronologia versioni vedi `CHANGELOG.md`.

**Versione:** `1.50.0` · **Render:** due metodi convivono — **RASTER PUPPET** (illustrazione ritagliata in pezzi,
animata via rig) per Zombie, Negromante, Melma e Beholder; **SPRITE SHEET** frame-by-frame per il Troll (dalla 1.47).

> ⚠️ **Gli id nel codice non corrispondono ai nomi.** `skeleton` = Zombie Putrido · `cave_brute` = Troll delle
> Caverne · `occhio` = Beholder · `darkmage` = Negromante · `slime` = Melma Corrosiva. Sono id **storici**
> (compatibilità con boss e `summon`): cercare "Troll" nel codice non trova nulla, si cerca `cave_brute`.

## 🖼️ Artwork
- **Overview del bestiario:** `public/assets/art/roster_overview.png`
- **Concept del Troll (ex Bruto):** `public/assets/art/cave_brute_concept.png`

---

## 🎯 Filosofia degli archetipi

Ogni nemico mette pressione in un modo diverso, così che l'ondata non sia mai "più dello stesso":

| Pilastro | Ruolo | Nemico | Accento |
|---|---|---|---|
| 🟢 **Sciame** | mischia veloce e numerosa | Zombie Putrido (+ Zombi Minori) | verde acido |
| 🟢 **Zona** | lento, punisce chi resta fermo | Melma Corrosiva | verde fluo |
| 🟣 **Caster** | distanza, controllo, evocazione | Negromante | viola |
| 🟠 **Tank** | mischia lenta e devastante (area) | Troll delle Caverne | ambra |
| 👁️ **Debuffer** | non fa danno diretto: ti indebolisce | Beholder | magenta |

## 🌊 Curva di introduzione *(v1.50)*

Gli archetipi entrano **scaglionati**, uno ogni 1-2 ondate. La rampa è definita in `shared/waves.js` →
`poolForWave(w)`; il **peso è quello scritto lì**, non il campo `weight` della def in `monsters.js` (vestigiale
per i nemici d'ondata).

| Ondata | Entra | Peso nel pool |
|---:|---|---:|
| 1 | 🟢 Zombie Putrido | 40 |
| 2 | 🟢 Melma Corrosiva | 16 |
| 3 | 🟣 Negromante | 12 |
| 4 | 🟠 Troll delle Caverne | 8 |
| 6 | 👁️ Beholder *(dopo il primo boss)* | 9 |

La rampa è **monotona**: una volta entrato, un archetipo non esce più dal pool (verificato da `testV150`).

---

## 🟢 Zombie Putrido · `skeleton`
Il nemico base d'ondata: uno sciame che avanza e ti travolge di numero.

- **Tier:** 1 · **PV:** 78 · **Velocità (def):** 100 · **Raggio:** 18 · **Danno:** 14
- **IA:** `swarm` (mischia) · **Gittata att.:** 44 · **Cooldown:** 1.1s · **XP:** 8
- **Occhi:** `#8bff86` · **Render:** puppet `ghoul` (6 pezzi) · **Comparsa:** ondata 1
- **Meccaniche:** attacco melee in **due tempi** (carica → colpo con affondo). Occhi che avvampano quando è
  colpito, ombra a terra propria, morte con crollo dei pezzi. Se non ti vede **vaga**; se ti ha visto **investiga**
  l'ultima posizione nota.

## 🟢 Zombie Minore · `zombie_mini` *(evocato)*
Versione in miniatura: debole, fastidiosa in gruppo. **Non compare nelle ondate.**

- **Tier:** 0 · **PV:** 26 · **Velocità (def):** 120 · **Raggio:** 12 · **Danno:** 8
- **IA:** `swarm` · **Gittata att.:** 34 · **XP:** 3 · **Render:** puppet `ghoul` a raggio ridotto
- **Comparsa:** SOLO evocato dal Negromante, fino a **4 vivi** contemporaneamente.

## 🟢 Melma Corrosiva · `slime`
Pozza acida vista **dall'alto** che striscia lenta; quando è vicina **salta e sputa bolle d'acido**.

- **Tier:** 1 · **PV:** 90 · **Velocità (def):** 52 · **Raggio:** 22 · **Danno contatto:** 12
- **IA:** `blob` · **Gittata att.:** 150 · **Cooldown:** 1.7s · **XP:** 9 · **Vista:** 560
- **Accento:** `#a6ff3a` · **Render:** puppet `slime` (**1 pezzo**, top-down, squash & stretch) · **Comparsa:** ondata 2
- **Meccaniche:** avanza **strisciando** (onda peristaltica, resta a terra); a distanza ravvicinata **salta** e
  sputa un **ventaglio di 3 bolle** (`acidCount 3`) ad alto danno (`acidMult 1.8`, `projSpeed 205`).
- **Effetti:** edge-glow verde pulsante (`aura`), occhi che si illuminano nella direzione di movimento, bolle
  acide che salgono (`bubbles`). Morte: la pozza si restringe e svanisce.

## 🟣 Negromante · `darkmage`
Caster incappucciato: tiene la distanza, evoca non-morti e ti debilita a distanza.

- **Tier:** 2 · **PV:** 96 · **Velocità (def):** 72 · **Raggio:** 18 · **Danno:** 14
- **IA:** `necromancer` · **Gittata att.:** 340 · **Cooldown:** 1.5s · **XP:** 16
- **Accento:** `#a06bff` · **Render:** puppet `mage` (5 pezzi) · **Comparsa:** ondata 3
- **Meccaniche:**
  - **Fluttua** (niente camminata), veste che ondeggia; **cast in due tempi** (alza il bastone → proietta l'orbe).
  - **Sfere debilitanti** (`curse`: −danno e −velocità al colpito) **solo** se entri nel suo **campo visivo**
    — cono `fov 0.55` (≈63° totali), `sightRange 360`, testa che ruota lenta (`turn 1.7` rad/s ≈ 97°/s → **aggirabile**).
    Un cono-telegrafo si accende quando ti individua. `projSpeed 325`. Ogni 3° tiro è un ventaglio da 3.
  - **Evoca Zombi Minori** ogni 6s (2 alla volta) fino a un tetto di **4**; rievoca solo per rimpiazzare i caduti.

## 🟠 Troll delle Caverne · `cave_brute`
Tank da mischia: lento e telegrafato, ma se ti raggiunge fa malissimo. Colpo ad **area** con onda d'urto.

- **Tier:** 2 · **PV:** 220 · **Velocità (def):** 60 · **Raggio:** 26 · **Danno:** 28
- **IA:** `brute` · **Gittata att.:** 72 · **Cooldown:** 2.1s · **Raggio slam:** 108 · **XP:** 26
- **Accento:** `#ffb14a` · **Render:** **SPRITE SHEET** `troll` (idle/walk/attack, 3 fogli 5×5 @256px) · **Comparsa:** ondata 4
- **Elite:** `eliteHp 1.5` *(v1.50)* — moltiplicatore PV ridotto rispetto al 2.4 standard, altrimenti fuori scala.
- **Meccaniche:**
  - **SLAM a due tempi** guidato dagli eventi: `slam_wind` (con eid) avvia i 25 frame d'attacco, il danno scatta
    a `slamHit 0.72` dello swing — l'istante in cui il martello tocca terra a schermo. `slamWind 0.78`,
    `slamKnock 4.2` (respinta).
  - **Percezione:** `sightRange 400`, `memory 4` — ti insegue se ti vede, investiga la tua ultima posizione, poi vaga.

## 👁️ Beholder · `occhio`
Bulbo oculare fluttuante con eye-stalks e tentacoli. **Non spara**: ti **debilita** con lo Sguardo.

- **Tier:** 3 · **PV:** 130 · **Velocità (def):** 92 · **Raggio:** 22 · **Danno contatto:** 16
- **IA:** `gazer` · **Gittata sguardo:** 340 · **Cooldown:** 1.0s · **Distanza di orbita:** 240 · **XP:** 24
- **Accento:** `#ff5ad0` · **Render:** puppet `beholder` (1 pezzo + overlay iride) · **Comparsa:** ondata 6
- **Elite:** `eliteHp 1.9` *(v1.50)*.
- **Meccaniche:**
  - **SGUARDO:** se entri nel suo campo visivo (`gazeFov 0.6`, `gazeRange 340`, LOS libera) subisci un **debuff**
    che si **rinnova** finché resti in vista.
  - **Eyestalks che ruotano:** alterna i tre sguardi ogni `gazeCycle 4`s — 🟠 **weaken** (attacco indebolito) ·
    🔵 **slow** (velocità ridotta) · 🟣 **sunder** (meno difesa). Il **fascio cambia colore** col tipo attivo.
  - Iride centrale che **segue** il bersaglio, pupilla che si **dilata** in attacco, edge-glow magenta (`aura 2.4`).

---

## 📊 Tabella comparativa (nemici d'ondata)

| Nemico | id | Tier | PV | Vel. | Raggio | Danno | Gittata | IA | Archetipo | Ondata |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|
| 🟢 Zombie Putrido | `skeleton` | 1 | 78 | 100 | 18 | 14 | 44 | swarm | sciame mischia | 1+ |
| 🟢 Melma Corrosiva | `slime` | 1 | 90 | 52 | 22 | 12 | 150 | blob | zona / acido | 2+ |
| 🟣 Negromante | `darkmage` | 2 | 96 | 72 | 18 | 14 | 340 | necromancer | caster / evoca | 3+ |
| 🟠 Troll delle Caverne | `cave_brute` | 2 | 220 | 60 | 26 | 28 | 72 | brute | tank area | 4+ |
| 👁️ Beholder | `occhio` | 3 | 130 | 92 | 22 | 16 | 340 | gazer | debuffer | 6+ |
| 🟢 Zombie Minore | `zombie_mini` | 0 | 26 | 120 | 12 | 8 | 34 | swarm | evocato | — |

### ⚠️ La "Vel." in tabella NON è la velocità in gioco
`Waves.applyScaling` moltiplica la velocità per `sizeFactor = clamp(16 / raggio, 0.6, 1.45)`: i mostri grossi
vanno più lenti di quanto dica la def. Velocità effettive **al netto dello scaling d'ondata**:

| Nemico | Vel. def | ×sizeFactor | Vel. reale |
|---|---:|---:|---:|
| Zombie Putrido | 100 | 0.89 | **~89** |
| Melma Corrosiva | 52 | 0.73 | **~38** |
| Negromante | 72 | 0.89 | **~64** |
| Troll delle Caverne | 60 | 0.62 | **~37** |
| Beholder | 92 | 0.73 | **~67** |

Se tocchi la `speed` di un mostro, ricordati che stai tarando un valore **prima** di questo fattore.

## 📏 Confronto dimensioni (raggio)
`Zombie Minore (12) < Zombie Putrido / Negromante (18) < Melma / Beholder (22) < Troll (26)`

## ⚔️ Elite
`applyScaling` promuove a **elite** una quota crescente di mostri (`eliteChance`, fino al 26%; la modalità
**CACCIA** la moltiplica ×3.2). Un elite ha: **PV ×`def.eliteHp`** (default **2.4**, Troll 1.5, Beholder 1.9),
**danno ×1.5**, **raggio ×1.28**, **velocità ×1.12**, **XP ×2.5**, tint colorato e — nel 50% dei casi — **+8 rigenerazione**.

---

## 👑 Boss (riferimento)
Non entrano nel pool ondate; compaiono alle **ondate multiple di 5**.

| Boss | id | PV | Comparsa | Note |
|---|---|---:|---|---|
| Signore della Guerra Orchesco | `orc_warlord` | 1600 | ondata 5/10 | melee, slam ad area, evoca zombie, enrage sotto il 50% PV |
| Re Lich | `lich_king` | 2200 | ondata 5/15 | caster, scudo, nova di proiettili, evoca zombie |
| AZ'GAROTH, il Divoratore di Mondi | `mega_dragon` | 9000 | ondata 20 | mega-boss multi-fase (respiro, nova, enrage) |

Alle ondate 5 il boss è tirato a caso fra Warlord e Lich; la 10 è sempre il Warlord, la 15 sempre il Lich.

---

*Aggiornare questa scheda ad ogni aggiunta/modifica di nemico — è il punto 7 della checklist di release in `ENEMIES.md` §12.*
