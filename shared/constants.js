/* constants.js — costanti condivise client/server (UMD) */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Constants = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const C = {
    VERSION: '1.76.1',
    // v1.66 — limiti del fendente in mischia (misurati: senza cap l'arco valeva 6x le uccisioni di un tiratore)
    MELEE_MAX_TARGETS: 5, MELEE_SPLASH: 0.55,
    // v1.51 — level up fra le ondate
    BOON_CHOICES: 3,          // carte potere offerte a fine ondata (se ne sceglie UNA)
    SHOP_GEAR_ENABLED: false, // Emporio a monete NASCOSTO in attesa di ridisegno

    VIS_SCALE: 1.45, COL_SCALE: 1.08,  // v1.13 — ridimensionamento LEGGERO: occhi grandi, hitbox quasi invariata (fluidita preservata)
    TICK_RATE: 30, SNAPSHOT_RATE: 20, MAX_PLAYERS: 6,
    TILE: 48, MAP_W: 64, MAP_H: 46,
    T_FLOOR: 0, T_WALL: 1, T_TRAP: 2, T_HAZARD: 3, T_DECO: 4, T_EXIT: 5,
    PLAYER_RADIUS: 16, PLAYER_BASE_SPEED: 210,
    START_LIVES: 2, DOWN_BLEED_TIME: 4.0, REVIVE_IFRAME: 1.6,
    CURSE_TIME: 4.5, CURSE_DMG_MULT: 0.6, CURSE_SPEED_MULT: 0.8, // v1.28 — maledizione del Negromante (indebolimento)
    // v1.34 — Sguardo dell'Occhio Vagante: debuff applicato quando il giocatore è nel campo visivo (cono) del bulbo.
    GAZE_TIME: 2.6, GAZE_TICK: 0.4, GAZE_FOV: 0.6, GAZE_RANGE: 340,
    GAZE_WEAKEN_MULT: 0.7, GAZE_SLOW_MULT: 0.72, GAZE_SUNDER_MULT: 1.32,
    DASH_CD: 3.2, DASH_TIME: 0.20, DASH_IFRAME: 0.28, DASH_SPEED: 3.0,
    BULLET_RADIUS: 5, XP_MAGNET: 120, FINAL_WAVE: 20,
    // v1.63 — LA FAGLIA AI MARGINI. Restare attaccati al bordo esterno riduceva l'arco da difendere da
    // ~240 a ~80 gradi: misurato, all'ondata 6 significava subire 4,8 volte meno danni stando fermi.
    // Non e' un muro invisibile: e' una pressione che cresce solo se INDUGI, e si riassorbe se rientri.
    EDGE_MARGIN: 2,        // tessere di fascia dal bordo giocabile (la profondita' pesa: vedi _edgeDepth)
    EDGE_GRACE: 6,       // secondi di carica prima che il drenaggio inizi (a profondita' piena)
    EDGE_RAMP: 10,          // secondi perche' il drenaggio arrivi al massimo
    EDGE_DPS_MIN: 2, EDGE_DPS_MAX: 10,
    EDGE_RECOVER: 2,       // la carica si riassorbe al doppio della velocita' con cui sale
    // v1.64 — TETTO AI NEMICI VIVI. Non riduce la dimensione dell'ondata: la RITMA. I mostri in eccesso
    // restano in coda (pending) ed entrano man mano che gli altri muoiono, quindi il totale da uccidere
    // non cambia — cambia quanti ne hai addosso insieme, che e' cio' che costava frame e leggibilita'.
    // v1.70 — il tetto dei vivi non e' piu' un numero fisso ma una CURVA: all'ondata 1 se ne vedono 8,
    // al tetto pieno di 30 si arriva solo alla 10ª. Il tetto fisso della 1.68, unito al rifornimento
    // rapido, riempiva l'arena di 30 nemici gia' alla terza ondata (misurato) anche se l'ondata ne
    // prevedeva 10: il tetto diventava il numero, invece di essere un limite.
    // v1.70 — l'esperienza non arriva piu' solo dai nemici: le fonti stanno tutte qui, in chiaro, cosi'
    // aggiungerne una e' una riga sola. Il termine per ondata tiene il passo con l'XP dei mostri, che cresce.
    XP_CASSA: 45, XP_CASSA_ONDATA: 9,
    XP_OGGETTO: 30, XP_OGGETTO_ONDATA: 6,
    MAX_ALIVE: 30,
    MAX_ALIVE_CURVE: [8, 10, 12, 14, 16, 18, 21, 23, 26, 30],
    // v1.53 — il MERCATO non ha piu' una cadenza fissa: e' una DESTINAZIONE che si sceglie dal menu di
    // pausa fra un'ondata e l'altra. Resta interstiziale (non consuma un numero d'ondata).
    // v1.56 — le distanze di fabbro e portale non si calcolano piu' a runtime: il villaggio e' disegnato
    // a mano in mapgen (VILLAGE), quindi restano solo i raggi di interazione.
    MARKET_EXIT_RADIUS: 42, MARKET_MERCH_RANGE: 84,
    SELL_BACK: 0.5,     // v1.72 — quanto rende un oggetto venduto al Banditore (meta', come il rimborso delle pozioni)
    // v1.73 — quante CARTE possono essere attive insieme. Il limite conta carte DIVERSE: Rimbalzo x3 occupa
    // un posto solo, cosi' approfondire una carta resta una strategia e non una tassa.
    MAX_CARDS: 5,
    // v1.74 — quanto costa un punto vita all'OSTESSA. Deve restare piu' conveniente della pozione di Cura
    // (0,54 monete a PV): la pozione la bevi in mezzo ai nemici, l'Ostessa no.
    INN_PER_HP: 0.4,
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
      PICK_RANK: 'pick_rank', OFFER_RANK: 'offer_rank',   // v1.69 — carte di rango e bivio finale
      PICK_POTION: 'pick_potion', BUY_POTION: 'buy_potion', OFFER_POTION: 'offer_potion',  // v1.71 — cintura
      TAKE_BOUNTY: 'take_bounty', SELL_GEAR: 'sell_gear', OFFER_BANDIT: 'offer_bandit',      // v1.72 — Banditore
      TOGGLE_CARD: 'toggle_card', OFFER_SEER: 'offer_seer',                                  // v1.73 — Cartomante
      REST: 'rest', OFFER_INN: 'offer_inn',                                                    // v1.74 — Ostessa
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
