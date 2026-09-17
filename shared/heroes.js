/* heroes.js — 3 eroi (UMD)
   v1.66 — I tre eroi cyberpunk (ENFORCER-7, SGT. VIPER, NULL) sono stati sostituiti da GUERRIERO, MAGO e
   LADRO: il gioco e' un dungeon con troll, lich e beholder, e un poliziotto cibernetico col cannone di
   servizio non c'entrava niente. Le ABILITA' Q/E sono state RIMOSSE in blocco: erano cucite addosso ai
   vecchi personaggi (torretta, granata, bullet-time) e vanno ripensate insieme alle classi.

   SCUOLA DI DANNO (weapon.school). E' la chiave del nuovo sistema di statistiche: ogni arma dichiara se
   colpisce in 'melee', 'magic' o 'ranged', e la statistica corrispondente ne alza DANNO e CADENZA.
   Cosi le classi miste future funzionano da sole: un guerriero che compra Intelligenza non guadagna
   niente sulla spada, ma guadagnera' sulla prima magia che gli si mette in mano. */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Heroes = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const HEROES = {
    guerriero: {
      id: 'guerriero', name: 'GUERRIERO', title: 'Lama della Faglia',
      color: '#7f8895', color2: '#2f3742', accent: '#e0a52c', hp: 200, speed: 194, radius: 16,
      // MISCHIA: nessun proiettile. Colpisce in un SEMICERCHIO davanti a se, raggio e apertura dall'arma.
      // Le armi piu' lunghe hanno l'arco piu' STRETTO: e' cio' che le rende diverse invece che solo piu' grandi.
      // TARATURA MISURATA: 99 danni/s sul bersaglio piu' vicino. I PV sono
      // saliti a 200 perche' e' l'unico che non puo' tenere le distanze: a 150 moriva sistematicamente
      // un'ondata prima degli altri due nelle simulazioni, e non per mancanza di danno (alzarlo non
      // cambiava nulla) ma per il tempo passato a contatto.
      weapon: {
        name: 'Spada', school: 'melee', melee: true, dmg: 55, fireRate: 1.8,
        arcRadius: 100, arcHalf: 0.95, knockback: 150, projColor: '#ffd27a',
        spread: 0, bulletSpeed: 0, range: 100, pierce: 0,
      },
      passives: [{ id: 'plate', name: 'Piastra', desc: 'Riduce del 12% i danni subiti.' }],
      abilities: {},
      strengths: 'Regge i colpi e colpisce piu nemici insieme.', weakness: 'Deve stare addosso.',
    },
    mago: {
      id: 'mago', name: 'MAGO', title: 'Custode della Faglia',
      color: '#3d3c8c', color2: '#14133a', accent: '#00f0c8', hp: 100, speed: 200, radius: 16,
      // MAGIA: bolle lente e grosse. Cadenza BASSA di partenza (1,5/s contro i 6,5-9,5/s dei vecchi
      // fucilieri): e' l'Intelligenza a farla salire, insieme al danno. Il danno per colpo e' alto proprio
      // perche' i colpi sono pochi: 96 danni/s, in linea con le altre due classi, ma concentrati.
      weapon: {
        name: 'Bolla di Energia', school: 'magic', dmg: 64, fireRate: 1.5, spread: 0.02,
        bulletSpeed: 430, range: 620, pierce: 0, projColor: '#00f0c8', knockback: 45, bubble: true, r: 9,
      },
      passives: [{ id: 'arcane', name: 'Arcano', desc: 'Intelligenza alza danno e cadenza delle magie.' }],
      abilities: {},
      strengths: 'Colpi pesanti che si vedono arrivare da lontano.', weakness: 'Lento a ripetere, fragile.',
    },
    ladro: {
      id: 'ladro', name: 'LADRO', title: 'Ombra della Faglia',
      color: '#3c5140', color2: '#1d2a22', accent: '#9ef0b0', hp: 112, speed: 218, radius: 16,
      // DISTANZA: frecce veloci e sottili che perforano un nemico. La Destrezza alza danno, cadenza e passo.
      // v1.83 — LA CADENZA SCENDE da 3,0 a 2,3 al secondo e il danno per freccia sale da 31 a 38. Tre
      // frecce al secondo di partenza (che con la Destrezza al massimo diventavano CINQUE) facevano un
      // arco automatico: il gesto spariva e restava il rubinetto. Il danno al secondo scende poco
      // (93 → 87, meno 6%), il ritmo cambia molto — ed e' il ritmo il problema.
      weapon: {
        name: 'Arco', school: 'ranged', dmg: 38, fireRate: 2.3, spread: 0.04,
        bulletSpeed: 900, range: 700, pierce: 1, projColor: '#9ef0b0', knockback: 25, arrow: true,
      },
      passives: [{ id: 'nimble', name: 'Passo Lieve', desc: 'Destrezza alza danno, cadenza e velocita.' }],
      abilities: {},
      strengths: 'Il piu veloce, colpisce da lontano.', weakness: 'Poco danno per colpo.',
    },
  };
  const ORDER = ['guerriero', 'mago', 'ladro'];

  // ============================================================================================
  // v2.13.1 — IL PROFILO DELLA CLASSE, come su una scheda da GDR
  // ============================================================================================
  // Le quattro statistiche partivano tutte da zero e salivano coi punti spesi. Vero, ma illeggibile:
  // un guerriero e un mago appena nati mostravano gli stessi quattro zeri, quando sono due cose
  // opposte. Questi numeri dicono a colpo d'occhio CHI E' la classe — il guerriero e' forte e robusto,
  // il mago sa e non regge un colpo, il ladro sta in mezzo e corre.
  //
  // Il tetto e' 20: 8 (il massimo di partenza) + 12 (Loot.STAT_MAX_LEVEL, i punti spendibili in una
  // statistica). Un mago non arrivera' mai a 20 di Forza, e va benissimo cosi'.
  const STAT_MAX = 20;
  const STAT_BASE = {
    guerriero: { st_for: 8, st_cos: 8, st_des: 4, st_int: 2 },
    ladro:     { st_for: 4, st_cos: 6, st_des: 8, st_int: 4 },
    mago:      { st_for: 2, st_cos: 4, st_des: 6, st_int: 8 },
  };
  function statBase(heroId, statId) { return (STAT_BASE[heroId] || {})[statId] || 0; }

  // ============================================================================================
  // v2.15 — IL PROFILO MORDE, MA SOLO DOVE NON ROMPE NIENTE
  // ============================================================================================
  // Fino alla v2.14 questi quattro numeri erano decorazione dichiarata: si leggevano e basta. Adesso
  // contano. COME contano e' stato deciso misurando, e le due scelte qui sotto vanno spiegate perche'
  // nessuna delle due e' quella che verrebbe in mente per prima.
  //
  // PRIMA SCELTA — conta lo SCARTO dal centro, non il valore assoluto.
  // Se COS 8 valesse "otto quarti di punto in piu'", ogni classe guadagnerebbe e basta, e il gioco
  // diventerebbe piu' facile per tutti senza che nessuno sia piu' diverso di prima. Contando invece
  // quanto la statistica si DISCOSTA da 5,5 (il centro delle quattro), chi sta sopra guadagna e chi
  // sta sotto perde: la somma per classe e' quasi zero. Le classi si allontanano fra loro, la potenza
  // media resta dov'era. Il guerriero (COS 8, DES 4) regge di piu' e va piu' piano; il mago (COS 4)
  // e' davvero il primo a cadere; il ladro (DES 8) corre davvero.
  //
  // SECONDA SCELTA — il profilo NON tocca danno ne' cadenza.
  // Questa e' la meno ovvia ed e' quella che salva il bilanciamento. Le tre classi sono tarate alla
  // pari (99/96/87 danni al secondo sulla carta, misurati; 79/78/78 con l'equipaggiamento di
  // partenza) e la taratura e' scritta nei commenti delle tre armi qui sopra. Ma ogni classe ha il
  // suo valore PIU' ALTO proprio nella statistica della sua scuola di danno — mago INT 8, ladro DES
  // 8, guerriero FOR 8 — e per di piu' INT e DES alzano danno E cadenza mentre FOR alza solo il
  // danno. Risultato misurato lasciando che il profilo contasse su tutto: 93/105/102, cioe' la
  // parita' rotta e il MAGO diventato il piu' forte dei tre. Non e' un numero da ritoccare, e'
  // strutturale. Quindi il profilo si ferma prima: PV, riduzione, passo e rinculo — la FORMA della
  // classe. Quanto picchia resta deciso dall'arma e dai punti che spendi, e li' non si tocca niente.
  //
  // Gli effetti veri stanno in `applicaProfilo()` in server/Room.js, accanto ad `applicaStat()`: qui
  // c'e' solo quanto pesa un punto di scarto. Spostare PESO e' l'unico modo di rendere il profilo
  // piu' o meno marcato, e il TEST 71 controlla che spostarlo muova i PV e NON muova il danno.
  const STAT_CENTRO = 5.5;
  const PROFILO_PESO = 0.5;
  // Quanti punti (frazionari) vale il profilo della classe su una statistica. Positivo sopra il
  // centro, negativo sotto. Un guerriero: COS +1,25 punti, DES -0,75.
  function profiloPunti(heroId, statId) {
    const b = (STAT_BASE[heroId] || {})[statId];
    if (b == null) return 0;
    return (b - STAT_CENTRO) * PROFILO_PESO;
  }

  return { HEROES, ORDER, STAT_BASE, STAT_MAX, statBase, STAT_CENTRO, PROFILO_PESO, profiloPunti };
});
