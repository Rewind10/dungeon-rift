/* constants.js — costanti condivise client/server (UMD) */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Constants = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const C = {
    VERSION: '1.61.1',
    // v1.51 — level up fra le ondate
    BOON_CHOICES: 3,          // carte potere offerte a fine ondata (se ne sceglie UNA)
    SHOP_GEAR_ENABLED: false, // Emporio a monete NASCOSTO in attesa di ridisegno

    VIS_SCALE: 1.45, COL_SCALE: 1.08,  // v1.13 — ridimensionamento LEGGERO: occhi grandi, hitbox quasi invariata (fluidita preservata)
    TICK_RATE: 30, SNAPSHOT_RATE: 20, MAX_PLAYERS: 6,
    TILE: 48, MAP_W: 46, MAP_H: 34,
    T_FLOOR: 0, T_WALL: 1, T_TRAP: 2, T_HAZARD: 3, T_DECO: 4, T_EXIT: 5,
    PLAYER_RADIUS: 16, PLAYER_BASE_SPEED: 210,
    START_LIVES: 2, DOWN_BLEED_TIME: 4.0, REVIVE_IFRAME: 1.6,
    CURSE_TIME: 4.5, CURSE_DMG_MULT: 0.6, CURSE_SPEED_MULT: 0.8, // v1.28 — maledizione del Negromante (indebolimento)
    // v1.34 — Sguardo dell'Occhio Vagante: debuff applicato quando il giocatore è nel campo visivo (cono) del bulbo.
    GAZE_TIME: 2.6, GAZE_TICK: 0.4, GAZE_FOV: 0.6, GAZE_RANGE: 340,
    GAZE_WEAKEN_MULT: 0.7, GAZE_SLOW_MULT: 0.72, GAZE_SUNDER_MULT: 1.32,
    DASH_CD: 3.2, DASH_TIME: 0.20, DASH_IFRAME: 0.28, DASH_SPEED: 3.0,
    BULLET_RADIUS: 5, XP_MAGNET: 120, FINAL_WAVE: 20,
    // v1.53 — il MERCATO non ha piu' una cadenza fissa: e' una DESTINAZIONE che si sceglie dal menu di
    // pausa fra un'ondata e l'altra. Resta interstiziale (non consuma un numero d'ondata).
    // v1.56 — le distanze di fabbro e portale non si calcolano piu' a runtime: il villaggio e' disegnato
    // a mano in mapgen (VILLAGE), quindi restano solo i raggi di interazione.
    MARKET_EXIT_RADIUS: 42, MARKET_MERCH_RANGE: 84,
    COMBO_TIME: 3.6, COMBO_STEP: 0.05, COMBO_CAP: 1.5, COMBO_MIN: 3,
    COIN_MAGNET: 130,
    COINS: [
      { id: 'bronze', v: 1, color: '#c8894a', r: 4 },
      { id: 'silver', v: 5, color: '#cbd5e6', r: 5 },
      { id: 'gold', v: 20, color: '#ffcf4a', r: 6 },
    ],
    RARITY: {
      common: { name: 'Comune', color: '#b8c0cc', weight: 60, mult: 1.00 },
      uncommon: { name: 'Non comune', color: '#4bd66b', weight: 26, mult: 1.18 },
      rare: { name: 'Raro', color: '#3aa0ff', weight: 10, mult: 1.40 },
      epic: { name: 'Epico', color: '#b061ff', weight: 3.2, mult: 1.75 },
      legendary: { name: 'Leggendario', color: '#ffb020', weight: 0.8, mult: 2.30 },
    },
    MSG: {
      HELLO: 'hello', WELCOME: 'welcome', INPUT: 'input', SNAPSHOT: 'snapshot',
      EVENT: 'event', MAP: 'map', BUY_STAT: 'buy_stat', SHOP_READY: 'shop_ready',
      OFFER_SHOP: 'offer_shop', PICK_BOON: 'pick_boon', OFFER_BOON: 'offer_boon',
      BUY_GEAR: 'buy_gear', OFFER_GEAR: 'offer_gear',
      BUY_MERCHANT: 'buy_merchant', OFFER_MERCHANT: 'offer_merchant',
      CHAT: 'chat', PING: 'ping', PONG: 'pong',
      BOONS: 'boons', // v1.51 — elenco poteri attivi del giocatore (per la barra in basso)
    },
    PHASE_LOBBY: 'lobby', PHASE_COMBAT: 'combat', PHASE_SHOP: 'shop',
    PHASE_BOSS: 'boss', PHASE_GAMEOVER: 'gameover', PHASE_VICTORY: 'victory',
    PHASE_MARKET: 'market',  // v1.52 — mappa di sosta: nessun nemico, mercante equipaggiamento, uscita dal portale EXIT
  };
  return C;
});
