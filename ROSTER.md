# 👹 ROSTER.md — Scheda dei nemici di Dungeon Rift

> Scheda di riferimento rapido di tutti i nemici del gioco. Per la **tecnica** di realizzazione (puppet raster
> ibrido, slicing, animazioni) vedi `ENEMIES.md`. Per la cronologia versioni vedi `CHANGELOG.md`.

**Versione:** `1.47.0` · **Render:** tutti i nemici d'ondata usano il **RENDER PUPPET** (raster ibrido, 5–6 pezzi + overlay vettoriale).

## 🖼️ Artwork
- **Overview del bestiario:** `public/assets/art/roster_overview.png` (Negromante + Zombie/Zombi Mini, con stati e animazioni).
- **Concept del Bruto delle Caverne:** `public/assets/art/cave_brute_concept.png` (illustrazione da cui è stato ricavato il puppet).

---

## 🎯 Filosofia degli archetipi

Il roster è costruito su **tre pilastri** complementari, così ogni ondata mette pressione in modi diversi:

| Pilastro | Ruolo | Nemico | Accento |
|---|---|---|---|
| 🟢 **Sciame** | mischia veloce e numerosa | Zombie Putrido (+ Zombi Minori) | verde acido |
| 🟣 **Caster** | distanza, controllo, evocazione | Negromante | viola |
| 🟠 **Tank** | mischia lenta e devastante (area) | **Bruto delle Caverne** ✅ | ambra |

---

## 🟢 Zombie Putrido  ·  `skeleton`
Il nemico base d'ondata: uno sciame che avanza e ti travolge di numero.

- **Tier:** 1 · **PV:** 78 · **Velocità:** 100 · **Raggio:** 18 · **Danno:** 14
- **IA:** `swarm` (mischia) · **Gittata att.:** 44 · **XP:** 8 · **Peso pool:** 22
- **Occhi:** `#8bff86` (verde acido) · **Render:** puppet `ghoul` (6 pezzi)
- **Comparsa:** da sempre (ondata 1).
- **Note:** attacco melee in due tempi (carica → colpo con affondo). Occhi che avvampano se colpito, ombra a terra, morte con crollo dei pezzi.

## 🟢 Zombie Minore  ·  `zombie_mini`  *(evocato)*
Versione in miniatura dello zombie: debole ma fastidiosa in gruppo.

- **Tier:** 0 · **PV:** 26 · **Velocità:** 120 · **Raggio:** 12 · **Danno:** 8
- **IA:** `swarm` (mischia) · **Gittata att.:** 34 · **XP:** 3 · **Peso pool:** 0 *(non compare nelle ondate)*
- **Render:** puppet `ghoul` a raggio ridotto (mini).
- **Comparsa:** SOLO evocato dal Negromante (fino a 4 vivi contemporaneamente).

## 🟣 Negromante  ·  `darkmage`
Caster incappucciato: tiene la distanza, evoca non‑morti e ti debilita a distanza.

- **Tier:** 2 · **PV:** 96 · **Velocità:** 72 · **Raggio:** 18 · **Danno:** 14
- **IA:** `necromancer` (distanza) · **Gittata att.:** 340 · **XP:** 16 · **Peso pool:** 12
- **Occhi/accento:** `#a06bff` (viola) · **Render:** puppet `mage` (5 pezzi: cappuccio, torso, veste a campana, braccio‑bastone, mano ossuta)
- **Comparsa:** dal **pool ondata 3**.
- **Meccaniche chiave:**
  - **Fluttua** (niente camminata), veste che ondeggia; **cast in due tempi** (alza il bastone → proietta l'orbe).
  - **Sfere debilitanti** (curse: −danno e −velocità al colpito) **solo** quando entri nel suo **campo visivo** (cono `fov 0.55` ≈ 63°, `sightRange 360`), con **testa a rotazione lenta** (`turn 1.7` rad/s ≈ 97°/s → aggirabile). Un cono‑telegrafo si accende quando ti individua.
  - **Velocità sfere:** `projSpeed 325` *(v1.41: +30%, più difficili da schivare)*.
  - **Evoca Zombi Minori** ogni 6 s (2 alla volta) fino a un **tetto di 4**; rievoca solo per rimpiazzare i caduti.

## 🟠 Troll delle Caverne  ·  `cave_brute`  ✅ *(sprite sheet, v1.47)*
Tank da mischia: lento e telegrafato, ma se ti raggiunge fa malissimo. Colpo ad **area** con onda d'urto.

- **Tier:** 2 · **PV:** 220 · **Velocità:** 60 (molto lento) · **Raggio:** 24 · **Danno:** 28
- **IA:** `brute` (mischia con **slam ad area** + knockback) · **Gittata att.:** 62 · **Raggio slam:** 96 · **XP:** 26 · **Peso pool:** 6 (raro)
- **Occhi/accento:** ambra `#ffb14a` · **Render:** puppet `brute` (6 pezzi: testa, torso, **2 braccia enormi**, 2 gambe)
- **Comparsa:** dal **pool ondata 4** (dopo il Negromante), peso basso.
- **Meccaniche chiave:**
  - **Braccia enormi** con pivot alla **spalla**: grandi **dondolii in opposizione** in camminata (la sua firma).
  - **SLAM ad area** in due tempi: **carica** (si erge, pugni cocked all'indietro) → **schianto** (tutto il busto affonda in avanti/giù, onda d'urto `areaDamage` raggio 96 + respinta). L'attacco anima il puppet (evento `slam` con eid).
  - **Migliorie ereditate:** hit‑reaction (squash), morte con crollo dei pezzi, tint elite (ambra), ombra dinamica.

---

## 🟢 Melma Corrosiva  ·  `slime`  ✅ *(implementata v1.44 · rifatta v1.45)*
Blob acido gelatinoso: **striscia** lento e coriaceo; quando è vicino **salta e sputa bolle d'acido** ad alto danno.

- **Tier:** 1 · **PV:** 90 · **Velocità:** 52 (molto lento) · **Raggio:** 20 · **Danno contatto:** 12
- **IA:** `blob` (striscia + sputo acido ravvicinato) · **Gittata att.:** 150 · **XP:** 9 · **Peso pool:** 16
- **Occhi/accento:** verde acido `#a6ff3a` · **Render:** puppet `slime` (**1 pezzo**, squash & stretch), sprite **senza bocca** + **edge‑glow**
- **Comparsa:** dal **primo stage**.
- **Meccaniche:** avanza **strisciando** (onda peristaltica, resta a terra); a distanza ravvicinata **SALTA** e **sputa un ventaglio di 3 bolle d'acido** ad **alto danno** (`acidMult 1.8`).
- **Effetti:** **aura/edge‑glow verde** pulsante, **occhi che si illuminano nella direzione di movimento** (e avvampano al colpo), **bolle acide** che salgono.
- **Animazione:** idle = respira; movimento = **striscia** (si stira/contrae orizzontalmente, NIENTE salto); attacco = si comprime → **salta e sputa**; morte = si scioglie appiattendosi.

## 📊 Tabella comparativa (nemici d'ondata)

| Nemico | Tier | PV | Vel. | Danno | Gittata | IA | Archetipo | Ondata |
|---|---:|---:|---:|---:|---:|---|---|---:|
| 🟢 Zombie Putrido | 1 | 78 | 100 | 14 | 44 | swarm | sciame mischia | 1+ |
| 🟢 Zombie Minore *(evocato)* | 0 | 26 | 120 | 8 | 34 | swarm | sciame mischia | — |
| 🟣 Negromante | 2 | 96 | 72 | 14 | 340 | necromancer | caster/evoca | 3+ |
| 🟠 Bruto delle Caverne | 2 | 220 | 60 | 28 | 62 | brute | tank area | 4+ |

## 📏 Confronto dimensioni (raggio)
`Zombie Minore (12)  <  Zombie Putrido / Negromante (18)  <  Bruto delle Caverne (24)`

---

## 👑 Boss (riferimento)
Non entrano nel pool ondate; compaiono alle ondate‑boss.

- **Signore della Guerra Orchesco** (`orc_warlord`) — melee, slam ad area, evoca zombie, enrage sotto il 50% PV.
- **Re Lich** (`lich_king`) — caster, scudo, nova di proiettili, evoca zombie.
- **AZ'GAROTH, il Divoratore di Mondi** (`mega_dragon`) — mega‑boss multi‑fase (respiro, nova, enrage).

---

*Aggiornare questa scheda ad ogni aggiunta/modifica di nemico (vedi checklist di release in `ENEMIES.md`).*
