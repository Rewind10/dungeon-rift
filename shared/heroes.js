/* heroes.js — 3 eroi (UMD) */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Heroes = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const HEROES = {
    enforcer: {
      id: 'enforcer', name: 'ENFORCER-7', title: 'Agente della Legge Cibernetico',
      color: '#3aa0ff', color2: '#0d2b52', accent: '#9fe0ff', hp: 130, speed: 200, radius: 16,
      weapon: { name: 'Cannone di Servizio', dmg: 14, fireRate: 6.5, spread: 0.03, bulletSpeed: 720, range: 620, pierce: 0, projColor: '#9fe0ff', knockback: 60 },
      passives: [{ id: 'armor_plating', name: 'Corazza Servo-assistita', desc: 'Riduce del 18% i danni subiti.' }, { id: 'auto_target', name: 'Assistenza di Mira', desc: 'Proiettili corretti verso il nemico vicino.' }],
      abilities: { q: { id: 'justice_round', name: 'Colpo di Giustizia', key: 'Q', icon: '🔫', cd: 6, desc: 'Raffica a cono che stordisce e respinge.' }, e: { id: 'deploy_turret', name: 'Torretta Schierabile', key: 'E', icon: '🎯', cd: 15, desc: 'Piazza una torretta che spara ai nemici per 8s.' } },
      strengths: 'Robusto, ottimo contro le ondate.', weakness: 'DPS singolo inferiore.',
    },
    recon: {
      id: 'recon', name: 'SGT. VIPER', title: 'Commando Veterano della Giungla',
      color: '#5aa02b', color2: '#22330f', accent: '#c7f06a', hp: 105, speed: 224, radius: 16,
      weapon: { name: 'Fucile d\'Assalto Modificato', dmg: 10, fireRate: 9.5, spread: 0.07, bulletSpeed: 760, range: 560, pierce: 0, projColor: '#c7f06a', knockback: 20 },
      passives: [{ id: 'adrenaline', name: 'Adrenalina', desc: 'Sotto 50% PV: +20% velocità, +15% danno.' }, { id: 'bleed', name: 'Colpi Perforanti', desc: 'I colpi applicano sanguinamento.' }],
      abilities: { q: { id: 'frag_grenade', name: 'Granata a Frammentazione', key: 'Q', icon: '💣', cd: 7, desc: 'Esplosione ad area.' }, e: { id: 'sniper_shot', name: 'Colpo del Cecchino', key: 'E', icon: '🎯', cd: 8, desc: 'Proiettile perforante devastante a lunga gittata.' } },
      strengths: 'Massimo danno e mobilità.', weakness: 'Fragile.',
    },
    glitch: {
      id: 'glitch', name: 'NULL', title: 'Hacker che Piega la Realtà',
      color: '#111318', color2: '#000000', accent: '#00f0c8', hp: 95, speed: 210, radius: 16,
      weapon: { name: 'Pistola a Dati', dmg: 12, fireRate: 7.0, spread: 0.02, bulletSpeed: 800, range: 640, pierce: 1, projColor: '#00f0c8', knockback: 10 },
      passives: [{ id: 'overclock', name: 'Overclock', desc: 'Ogni 5 colpi il successivo è critico.' }, { id: 'phase_step', name: 'Passo di Fase', desc: 'Fermo 1.2s: -30% danni.' }],
      abilities: { q: { id: 'bullet_time', name: 'Bullet-Time', key: 'Q', icon: '⏱️', cd: 16, desc: 'Rallenta i nemici del 65% per 4s.' }, e: { id: 'data_rift', name: 'Frattura di Dati', key: 'E', icon: '🌀', cd: 9, desc: 'Rift che risucchia e danneggia.' } },
      strengths: 'Bullet-Time salva le run.', weakness: 'PV bassi.',
    },
  };
  const ORDER = ['enforcer', 'recon', 'glitch'];
  return { HEROES, ORDER };
});
