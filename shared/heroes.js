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
      weapon: {
        name: 'Arco', school: 'ranged', dmg: 31, fireRate: 3.0, spread: 0.04,
        bulletSpeed: 900, range: 700, pierce: 1, projColor: '#9ef0b0', knockback: 25, arrow: true,
      },
      passives: [{ id: 'nimble', name: 'Passo Lieve', desc: 'Destrezza alza danno, cadenza e velocita.' }],
      abilities: {},
      strengths: 'Il piu veloce, colpisce da lontano.', weakness: 'Poco danno per colpo.',
    },
  };
  const ORDER = ['guerriero', 'mago', 'ladro'];
  return { HEROES, ORDER };
});
