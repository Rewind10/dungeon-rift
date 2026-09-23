/* loot.js — buff casse, armi (+EVOLUZIONI), item, negozio XP, BOON a scelta (UMD) */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Loot = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CRATE_BUFFS = [
    { id: 'b_dmg', name: 'Furia', icon: '⚔️', color: '#ff6b6b', dur: 12, desc: '+60% danno' },
    { id: 'b_speed', name: 'Fretta', icon: '💨', color: '#8bd6ff', dur: 12, desc: '+45% velocità' },
    { id: 'b_rate', name: 'Frenesia', icon: '⚡', color: '#ffd24a', dur: 12, desc: '+70% cadenza' },
    { id: 'b_shield', name: 'Egida', icon: '🛡️', color: '#7dffea', dur: 10, desc: '-50% danni' },
    // v1.93 — QUI C'ERA VIGORE (8 PV/s per 10 s). Nessuno lo assegnava piu' da tempo, ma era una cura
    // pronta all'uso: tolta la definizione, non puo' rientrare per sbaglio.
    { id: 'b_quad', name: 'Salve Multiple', icon: '🔱', color: '#b061ff', dur: 10, desc: '+2 proiettili' },
  ];

  // Armi raccoglibili (3 tipi × 3 livelli). A Lv.3 + statistica richiesta → EVOLUZIONE.
  const WEAPONS = {
    scatter: { id: 'scatter', name: 'Dispersore', icon: '🔫', color: '#ffb020',
      evo: { stat: 'st_for', need: 3, id: 'scatter_evo', name: 'Uragano d\'Acciaio', desc: 'Ventaglio di 12 pallini con onda d\'urto', color: '#ffe45e' },
      tiers: [
        { pellets: 4, dmg: 0.55, spread: 0.24, knock: 2.2, rate: 0.85, range: 340 },
        { pellets: 6, dmg: 0.58, spread: 0.22, knock: 2.6, rate: 0.9, range: 380 },
        { pellets: 8, dmg: 0.62, spread: 0.20, knock: 3.0, rate: 1.0, range: 420 }] },
    burst: { id: 'burst', name: 'Raffica', icon: '⚡', color: '#00f0c8',
      evo: { stat: 'st_des', need: 3, id: 'burst_evo', name: 'Tempesta di Piombo', desc: 'Cadenza estrema, proiettili perforanti', color: '#7dffea' },
      tiers: [
        { pellets: 1, dmg: 0.80, spread: 0.05, rate: 1.8, pierce: 0, range: 560, speed: 900 },
        { pellets: 2, dmg: 0.80, spread: 0.07, rate: 2.1, pierce: 0, range: 580, speed: 940 },
        { pellets: 3, dmg: 0.82, spread: 0.08, rate: 2.4, pierce: 1, range: 600, speed: 980 }] },
    beam: { id: 'beam', name: 'Cannone a Fascio', icon: '🔷', color: '#3aa0ff',
      evo: { stat: 'st_int', need: 3, id: 'beam_evo', name: 'Lancia del Giudizio', desc: 'Fascio devastante che perfora e rimbalza', color: '#b061ff' },
      tiers: [
        { pellets: 1, dmg: 1.7, spread: 0.0, rate: 0.65, pierce: 3, range: 720, speed: 1000, big: 3, knock: 1.6 },
        { pellets: 1, dmg: 2.1, spread: 0.0, rate: 0.7, pierce: 5, range: 760, speed: 1050, big: 4, knock: 1.9 },
        { pellets: 1, dmg: 2.6, spread: 0.0, rate: 0.75, pierce: 8, range: 820, speed: 1100, big: 5, knock: 2.2, bounce: 1 }] },
  };
  // Livelli EVOLUTI (tier singolo, potentissimo)
  const WEAPON_EVOS = {
    scatter_evo: { pellets: 12, dmg: 0.7, spread: 0.28, knock: 3.6, rate: 1.15, range: 460, nova: true },
    burst_evo: { pellets: 4, dmg: 0.9, spread: 0.09, rate: 3.0, pierce: 3, range: 640, speed: 1050 },
    beam_evo: { pellets: 1, dmg: 3.4, spread: 0.0, rate: 0.9, pierce: 14, range: 900, speed: 1200, big: 7, knock: 2.6, bounce: 2 },
  };
  const WEAPON_ORDER = ['scatter', 'burst', 'beam'];

  const ITEMS = [
    { id: 'i_health', name: 'Pozione di Salute', icon: '❤️', color: '#ff5a7a', rarity: 'common', weight: 42, kind: 'heal', heal: 0.35, glyph: '+' },
    { id: 'i_shoes', name: 'Stivali Alati', icon: '👟', color: '#8bd6ff', rarity: 'uncommon', weight: 16, kind: 'buff', buff: 'i_speed', dur: 16, glyph: '»' },
    { id: 'i_armor', name: 'Corazza Rinforzata', icon: '🛡️', color: '#7dffea', rarity: 'uncommon', weight: 16, kind: 'buff', buff: 'i_armor', dur: 16, glyph: '▣' },
    { id: 'i_power', name: 'Nucleo Instabile', icon: '🔺', color: '#b061ff', rarity: 'rare', weight: 7, kind: 'buff', buff: 'i_power', dur: 12, glyph: '△' },
    { id: 'i_rage', name: 'Ira Berserk', icon: '💥', color: '#ff3b3b', rarity: 'epic', weight: 2.6, kind: 'buff', buff: 'i_rage', dur: 8, glyph: '‼' },
    { id: 'i_invuln', name: 'Egida Divina', icon: '✨', color: '#ffd24a', rarity: 'legendary', weight: 1.1, kind: 'buff', buff: 'i_invuln', dur: 5, glyph: '◈' },
    { id: 'i_life', name: 'Cuore Fenice', icon: '💗', color: '#ff77cc', rarity: 'legendary', weight: 0.8, kind: 'life', glyph: '♥' },
  ];

  // v1.66 — le sei statistiche "da sparatutto" (Vitalità/Potenza/Cadenza/Abilità/Agilità/Precisione) sono
  // sostituite dalle classiche da gioco di ruolo. Ogni statistica ha una scuola d'elezione
  // (weapon.school in shared/heroes.js): FORZA muove il melee, INTELLIGENZA la magia, DESTREZZA il tiro.
  //
  // v2.18 — LA QUINTA: IL CARISMA. Con le sette classi, paladino e warlock lanciano magie che NON
  // scalano con l'Intelligenza. Farle scalare con l'INT avrebbe voluto dire che il Carisma e' un nome
  // diverso per la stessa casella, cioe' non una statistica. Decisione di Paolo, presa sapendo che i
  // 14 punti della partita si spalmano ora su CINQUE righe invece di quattro: *«la difficolta' o la
  // scelta e' proprio il saper distribuire i punti»*. Il budget NON e' stato alzato per compensare, ed
  // e' voluto: non "sistemarlo" in seguito.
  //
  // La Destrezza governa DUE scuole (tiro e mischia leggera, per l'assassino): la seconda sta in
  // `school2` perche' il pannello ne mostra una sola e il server le applica tutte e due.
  const XP_STATS = [
    { id: 'st_for', name: 'Forza', icon: '💪', color: '#ff8a5b', base: 10, school: 'melee',
      desc: '+9% danno in mischia, +3% rinculo' },
    { id: 'st_cos', name: 'Costituzione', icon: '❤️', color: '#ff5a7a', base: 10, school: null,
      desc: '+20 PV massimi, -1.2% danni subiti' },
    { id: 'st_des', name: 'Destrezza', icon: '🏹', color: '#4bd66b', base: 10, school: 'ranged', school2: 'agile',
      desc: '+8% danno con archi e lame leggere, +6% cadenza, +2.5% velocità' },
    { id: 'st_int', name: 'Intelligenza', icon: '🔮', color: '#b061ff', base: 10, school: 'magic',
      desc: '+9% danno magico, +7% cadenza delle magie' },
    { id: 'st_car', name: 'Carisma', icon: '✨', color: '#ffd24a', base: 10, school: 'pact',
      desc: '+9% danno delle magie di classe, +7% cadenza' },
  ];
  // v1.51 — La curva era 1.55^n con livelli ILLIMITATI: con ~7.500 XP raccolti in una run intera il negozio
  // non era una scelta ma un rubinetto. Da allora il costo di ogni livello e' una TABELLA esplicita di
  // moltiplicatori su `base`, un valore per livello: la taratura procede per interventi diretti sui numeri
  // e nessuna formula unica riesce a seguirli senza distorcere il resto della curva.
  //
  // v1.66 — tetto portato da 8 a 12 e curva ricalcolata su una regola sola, chiesta esplicitamente:
  // *con l'XP di una run intera si deve poter cappare esattamente UNA statistica*. Una run vale nell'ordine
  // dei 18.000 XP (misurato su partita vera). Con base 10:
  //
  //   livello     1    2    3    4    5    6    7     8     9    10    11    12
  //   costo      60  100  160  250  380  560  820  1200  1750  2600  4000  6100   → totale 17.980
  //   salto       —  +67% +60% +56% +52% +47% +46%  +46%  +46%  +49%  +54%  +53%
  //
  // Il gradino piatto del 7° livello della vecchia tabella (+13%) e' sparito: la crescita non scende mai
  // sotto il +46%, quindi ogni livello successivo e' sempre una rinuncia sentita. Cappare UNA statistica
  // consuma la run per intero; portarne quattro al tetto costerebbe 71.920 XP, cioe' quattro run pulite.
  const STAT_MAX_LEVEL = 12;
  const STAT_COST_STEPS = [6, 10, 16, 25, 38, 56, 82, 120, 175, 260, 400, 610];
  function statCost(base, bought) {
    const k = STAT_COST_STEPS[Math.max(0, Math.min(bought, STAT_COST_STEPS.length - 1))];
    return Math.round(base * k);
  }

  // ===== BOON a scelta (stile Hades): effetti UNICI impilabili =====
  // apply(p): imposta flag/valori letti in Room.js. maxStacks per limitarli.
  // ===== v1.79 — LE ABILITA' PASSIVE, A SCAGLIONI E PER CLASSE ==================================
  // Non sono piu' carte pescate a caso a fine ondata. Sono 32 abilita' divise in quattro SCAGLIONI
  // (non comune, raro, epico, divino) e si sceglie UNA abilita' per scaglione, ai livelli 3, 6, 9 e 12.
  //
  // Ogni scaglione mostra QUATTRO abilita': le DUE della tua classe piu' le DUE neutre. Le abilita' di
  // classe le vede solo quella classe — un mago non sa nemmeno che esistono quelle del guerriero, ed e'
  // voluto: e' la rigiocabilita' a cambiare personaggio.
  //
  // NIENTE IMPILAMENTO: `max` vale 1 per tutte. Con quattro scelte in tutta la run, spendere uno
  // scaglione per raddoppiare la stessa abilita' sarebbe sempre la mossa sbagliata. Per questo i valori
  // NON sono quelli di prima: sono circa il doppio della singola copia della v1.78, alzati negli
  // scaglioni alti. I numeri interni (`+= 2`, `forza 3`) sono la stessa manopola di prima portata al
  // valore giusto, non un'abilita' presa due volte.
  //
  // La griglia completa, coi valori vecchi accanto ai nuovi, sta in PROGRESSIONE-2.md §7.
  //
  // Due correzioni di EQUITA' FRA CLASSI, non di grandezza:
  //  - i bonus ai PV neutri sono PERCENTUALI, non in cifra fissa: il guerriero ha 200 PV e il mago 100,
  //    "+30 PV" varrebbe il triplo per il mago;
  //  - il veleno si misura PER BERSAGLIO e non per colpo, se no la stessa abilita' rende il doppio in
  //    mano al ladro (3 colpi al secondo) rispetto al mago (1,5).
  // ============================================================================================
  // v2.20.0 — IL MAZZO RIFATTO: ottantaquattro carte, tre vie, nessuna condivisa
  // ============================================================================================
  // Paolo, guardando il mazzo vecchio: *«Secondo me vanno ripensate: qualcuna puo' anche andare bene ma
  // la maggior parte non e' indicata per la classe. Riduci da 4 a 3 opzioni per i 4 step, ma che siano
  // davvero indicate alle classi in gioco»*.
  //
  // Il mazzo vecchio era quello dei TRE eroi allargato a sette: ai livelli 3 e 5 barbaro, paladino e
  // maestro d'armi vedevano le STESSE due carte, e mago e warlock pure. Le classi si separavano solo
  // dal 9 in su. Adesso:
  //
  //   1. TRE OPZIONI, non quattro, e tutte e tre DELLA CLASSE. Il mazzo neutro e' sciolto: le carte
  //      neutre che valevano la pena sono state date alla classe a cui appartengono davvero (il Colpo
  //      di Grazia all'assassino, il Campo di Lentezza all'arciere e al warlock, la Tossina
  //      all'assassino, il Baluardo al paladino), le altre sono sparite.
  //   2. LE TRE VIE SONO SEMPRE LE STESSE, a ogni livello e per ogni classe, cosi' la griglia si impara
  //      una volta sola:
  //        `colpo`     potenzia il modo in cui QUELLA classe fa male
  //        `tenuta`    copre la sua debolezza, con lo strumento che le e' proprio
  //        `mestiere`  la cosa che solo quella classe fa — ed e' qui che le sette smettono di somigliarsi
  //   3. NESSUNA CARTA E' CONDIVISA. Se una carta va bene a tre classi non e' la carta di nessuna.
  //   4. NIENTE CURE, di nessun tipo, e NIENTE RESURREZIONI (*«togli qualsiasi abilita' che possa curare
  //      i personaggi, di qualsiasi tipo... togli magie che portano in vita»*). Restano ammessi gli
  //      SCUDI e gli ASSORBIMENTI, che non curano e non riportano in vita.
  //   5. TUTTE LE MAGNITUDINI DIMEZZATE (*«dimezza gli effetti di bonus a danni, punti vita o altro»*).
  //      Dove l'effetto e' binario — «perfora un nemico in piu'» — non c'e' niente da dimezzare; dove
  //      l'effetto E' la frequenza (Punto Vitale, Scudo Arcano) e' l'intervallo a raddoppiare.
  //   6. NIENTE «BOLLA DENSA» per mago e warlock: tolta su richiesta esplicita.
  //
  // La griglia approvata, casella per casella, sta in PIANO-CLASSI-SETTAGGI.md. Se un giorno si cambia
  // un numero qui, si cambia anche li': quel file e' il registro delle decisioni, non un riassunto.
  //
  // UNA COSA DA SAPERE PRIMA DI RITOCCARE I NUMERI. Quattro carte, dopo il dimezzamento, stanno sotto
  // la soglia in cui un giocatore SENTE la differenza (Presenza, Pelle di Patto, Faro, Doppia Guardia,
  // tutte fra il 3 e il 4%). E' stato segnalato a Paolo e la scelta e' sua: la strada indicata, se un
  // giorno si volesse rimediare, e' DARE MENO CARTE (tre livelli invece di quattro), non rialzare i
  // numeri — che vorrebbe dire disfare il dimezzamento appena chiesto.
  const BOONS = [
    // ============================== BARBARO ==============================
    { id: 'bar_peso', name: 'Peso del Colpo', icon: '🪓', rarity: 'uncommon', hero: 'barbaro', via: 'colpo', max: 1,
      desc: '+5% danno quando impugni un arma pesante',
      apply: p => { p.boon.armaPesante += 0.05; } },
    { id: 'bar_pellaccia', name: 'Pellaccia', icon: '🧿', rarity: 'uncommon', hero: 'barbaro', via: 'tenuta', max: 1,
      desc: '+12 PV e -5% dai nemici che ti stanno addosso',
      apply: p => { p.stats.maxHpFlat += 12; p.boon.drMischia += 0.05; } },
    { id: 'bar_caldo', name: 'Sangue Caldo', icon: '🔥', rarity: 'uncommon', hero: 'barbaro', via: 'mestiere', max: 1,
      desc: 'Sotto meta vita fai +6% danno',
      apply: p => { p.boon.sangueCaldo += 0.06; } },
    { id: 'bar_spallata', name: 'Spallata', icon: '💥', rarity: 'rare', hero: 'barbaro', via: 'colpo', max: 1,
      desc: '+30% rinculo, e chi sbatte contro un muro prende un altro 8% del colpo',
      apply: p => { p.stats.knockMult += 0.30; p.boon.muroSbatte += 0.08; } },
    { id: 'bar_cicatrici', name: 'Cuoio e Cicatrici', icon: '🩹', rarity: 'rare', hero: 'barbaro', via: 'tenuta', max: 1,
      desc: '-3% danni subiti per ogni nemico entro 120px, fino a -12%',
      apply: p => { p.boon.drVicini += 0.03; } },
    { id: 'bar_carica', name: 'Carica Continua', icon: '🐗', rarity: 'rare', hero: 'barbaro', via: 'mestiere', max: 1,
      desc: 'Ogni uccisione toglie mezzo secondo alla ricarica dello scatto',
      apply: p => { p.boon.dashKill += 0.5; } },
    { id: 'bar_furia', name: 'Furia Crescente', icon: '⚡', rarity: 'epic', hero: 'barbaro', via: 'colpo', max: 1,
      desc: 'Ogni uccisione da +4% cadenza per 3s, fino a +24%',
      apply: p => { p.boon.killHaste += 1; } },
    { id: 'bar_colosso', name: 'Colosso', icon: '🧍', rarity: 'epic', hero: 'barbaro', via: 'tenuta', max: 1,
      desc: '+17% PV massimi (non curano) e +4% velocita',
      apply: p => { p.stats.maxHpMult += 0.17; p.stats.speedMult += 0.04; } },
    { id: 'bar_terremoto', name: 'Terremoto', icon: '🌋', rarity: 'epic', hero: 'barbaro', via: 'mestiere', max: 1,
      desc: 'Lo scatto sbalza i nemici che attraversi e li stordisce per 0,3s',
      apply: p => { p.boon.terremoto = 0.3; } },
    { id: 'bar_spacca', name: 'Spacca in Due', icon: '🪚', rarity: 'divine', hero: 'barbaro', via: 'colpo', max: 1,
      desc: 'Il colpo che uccide prosegue sul nemico dietro, al 50%',
      apply: p => { p.boon.spacca += 0.5; } },
    { id: 'bar_zoccolo', name: 'Zoccolo Duro', icon: '🛡', rarity: 'divine', hero: 'barbaro', via: 'tenuta', max: 1,
      desc: 'I colpi che ti tolgono meno del 10% dei PV fanno il 25% in meno',
      apply: p => { p.boon.zoccolo += 0.25; } },
    { id: 'bar_deflagrazione', name: 'Deflagrazione Cadaverica', icon: '☄️', rarity: 'divine', hero: 'barbaro', via: 'mestiere', max: 1,
      desc: 'I nemici che uccidi esplodono, al 50% del danno',
      apply: p => { p.boon.corpseBlast += 1; } },
    // ============================== PALADINO ==============================
    { id: 'pal_martello', name: 'Giuramento del Martello', icon: '🔨', rarity: 'uncommon', hero: 'paladino', via: 'colpo', max: 1,
      desc: '+5% danno quando impugni uno scudo',
      apply: p => { p.boon.conScudo += 0.05; } },
    { id: 'pal_alzato', name: 'Scudo Alzato', icon: '🛡', rarity: 'uncommon', hero: 'paladino', via: 'tenuta', max: 1,
      desc: '-6% in piu sui colpi che arrivano da davanti',
      apply: p => { p.boon.frontalePiu += 0.06; } },
    { id: 'pal_presenza', name: 'Presenza', icon: '✨', rarity: 'uncommon', hero: 'paladino', via: 'mestiere', max: 1,
      desc: 'Gli alleati entro 200px prendono il 3% di danni in meno',
      apply: p => { p.boon.presenza = Math.max(p.boon.presenza, 0.03); } },
    { id: 'pal_giusto', name: 'Martello del Giusto', icon: '⚖️', rarity: 'rare', hero: 'paladino', via: 'colpo', max: 1,
      desc: '+8% danno contro elite e boss',
      apply: p => { p.boon.vsElite += 0.08; } },
    { id: 'pal_ira', name: 'Ira Giusta', icon: '💢', rarity: 'rare', hero: 'paladino', via: 'tenuta', max: 1,
      desc: 'L 8% del danno che subisci torna a chi te l ha dato',
      apply: p => { p.boon.thornsPct += 0.08; } },
    { id: 'pal_faro', name: 'Faro', icon: '🔦', rarity: 'rare', hero: 'paladino', via: 'mestiere', max: 1,
      desc: 'I nemici vicini bersagliano te, e tu prendi il 4% di danni in meno',
      apply: p => { p.boon.faro = Math.max(p.boon.faro, 220); p.stats.dmgReduce = Math.min(0.85, p.stats.dmgReduce + 0.04); } },
    { id: 'pal_consacra', name: 'Consacrazione', icon: '🌟', rarity: 'epic', hero: 'paladino', via: 'colpo', max: 1,
      desc: 'I nemici entro 200px prendono il 5% di danni in piu',
      apply: p => { p.boon.consacra = Math.max(p.boon.consacra, 0.05); } },
    { id: 'pal_baluardo', name: 'Baluardo', icon: '🧱', rarity: 'epic', hero: 'paladino', via: 'tenuta', max: 1,
      desc: '-5% a tutti i danni subiti',
      apply: p => { p.stats.dmgReduce = Math.min(0.85, p.stats.dmgReduce + 0.05); } },
    { id: 'pal_condiviso', name: 'Scudo Condiviso', icon: '🤝', rarity: 'epic', hero: 'paladino', via: 'mestiere', max: 1,
      desc: 'Il 10% dei danni degli alleati entro 200px lo prendi tu al posto loro',
      apply: p => { p.boon.condiviso = Math.max(p.boon.condiviso, 0.10); } },
    { id: 'pal_giudizio', name: 'Giudizio', icon: '⚡', rarity: 'divine', hero: 'paladino', via: 'colpo', max: 1,
      desc: 'Ogni sesto colpo toglie l 8% dei PV massimi del bersaglio (boss: 3%)',
      apply: p => { p.boon.giudizioOgni = 6; p.boon.giudizioQuota = 0.08; } },
    { id: 'pal_fede', name: 'Fede Salda', icon: '🙏', rarity: 'divine', hero: 'paladino', via: 'tenuta', max: 1,
      desc: 'Sotto meta vita prendi il 10% di danni in meno',
      apply: p => { p.boon.fedeSalda += 0.10; } },
    { id: 'pal_egida', name: 'Egida', icon: '🕊', rarity: 'divine', hero: 'paladino', via: 'mestiere', max: 1,
      desc: 'Una volta per ondata, l alleato vicino che sta per cadere ha 0,8s di invulnerabilita',
      apply: p => { p.boon.egida = Math.max(p.boon.egida, 0.8); } },
    // ============================== MAESTRO D'ARMI ==============================
    { id: 'mae_doppio', name: 'Colpo Doppio', icon: '⚔️', rarity: 'uncommon', hero: 'maestro', via: 'colpo', max: 1,
      desc: 'Ogni quarto fendente colpisce due volte, il secondo al 25%',
      apply: p => { p.boon.colpoDoppio = 4; p.boon.colpoDoppioQuota = 0.25; } },
    { id: 'mae_parata', name: 'Parata Istintiva', icon: '🤺', rarity: 'uncommon', hero: 'maestro', via: 'tenuta', max: 1,
      desc: 'Il 5% dei colpi che ricevi viene parato del tutto',
      apply: p => { p.perk.elusione += 0.05; } },
    { id: 'mae_danza', name: 'Passo di Danza', icon: '💃', rarity: 'uncommon', hero: 'maestro', via: 'mestiere', max: 1,
      desc: 'Ogni uccisione da +8% velocita per 2,5s, fino a +15%',
      apply: p => { p.boon.killStep += 1; } },
    { id: 'mae_ritmo', name: 'Ritmo', icon: '🥁', rarity: 'rare', hero: 'maestro', via: 'colpo', max: 1,
      desc: 'Ogni colpo a segno di fila da +1,5% cadenza, fino a +12%. Si azzera se manchi',
      apply: p => { p.boon.ritmo += 0.015; } },
    { id: 'mae_guardia', name: 'Doppia Guardia', icon: '🗡', rarity: 'rare', hero: 'maestro', via: 'tenuta', max: 1,
      desc: 'Con due armi impugnate prendi il 4% di danni in meno',
      apply: p => { p.boon.dueArmiDR += 0.04; } },
    { id: 'mae_risposta', name: 'Risposta', icon: '↩️', rarity: 'rare', hero: 'maestro', via: 'mestiere', max: 1,
      desc: 'Dopo una parata, il colpo successivo fa +20%',
      apply: p => { p.boon.risposta += 0.20; } },
    { id: 'mae_sporca', name: 'Lama Sporca', icon: '🩸', rarity: 'epic', hero: 'maestro', via: 'colpo', max: 1,
      desc: 'I colpi critici aprono un emorragia: 10% del colpo in 3s',
      apply: p => { p.boon.bleedCrit += 0.10; } },
    { id: 'mae_contrattacco', name: 'Contrattacco', icon: '⚡', rarity: 'epic', hero: 'maestro', via: 'tenuta', max: 1,
      desc: 'Chi ti colpisce in mischia si becca il 20% del tuo colpo',
      apply: p => { p.boon.contrattacco += 0.20; } },
    { id: 'mae_catena', name: 'Catena di Colpi', icon: '🔗', rarity: 'epic', hero: 'maestro', via: 'mestiere', max: 1,
      desc: 'Tre nemici diversi di fila: +10% danno per 3s',
      apply: p => { p.boon.catenaColpi += 0.10; } },
    { id: 'mae_vitale', name: 'Punto Vitale', icon: '🎯', rarity: 'divine', hero: 'maestro', via: 'colpo', max: 1,
      desc: 'Ogni decimo colpo e un critico garantito',
      apply: p => { p.boon.critOgni = 10; } },
    { id: 'mae_maestria', name: 'Maestria', icon: '🏅', rarity: 'divine', hero: 'maestro', via: 'tenuta', max: 1,
      desc: 'La seconda arma rende il 67% della sua quota invece del 35%',
      apply: p => { p.boon.maestria = Math.max(p.boon.maestria, 1.9); } },
    { id: 'mae_mulinello', name: 'Mulinello', icon: '🌀', rarity: 'divine', hero: 'maestro', via: 'mestiere', max: 1,
      desc: 'Ogni sei uccisioni parte un giro di lama gratuito, al 50%',
      apply: p => { p.boon.mulinello = 6; } },
    // ============================== ASSASSINO ==============================
    { id: 'ass_agguato', name: 'Agguato', icon: '🗡️', rarity: 'uncommon', hero: 'assassino', via: 'colpo', max: 1,
      desc: 'Il primo colpo su un nemico ancora a vita piena fa +8%',
      apply: p => { p.boon.agguato += 0.08; } },
    { id: 'ass_schivata', name: 'Schivata', icon: '💨', rarity: 'uncommon', hero: 'assassino', via: 'tenuta', max: 1,
      desc: 'Il 5% dei colpi ti manca del tutto',
      apply: p => { p.perk.elusione += 0.05; } },
    { id: 'ass_silenzioso', name: 'Silenzioso', icon: '🤫', rarity: 'uncommon', hero: 'assassino', via: 'mestiere', max: 1,
      desc: 'I nemici ti notano da un ottavo piu vicino',
      apply: p => { p.boon.silenzioso = Math.max(p.boon.silenzioso, 0.125); } },
    { id: 'ass_spalle', name: 'Colpo alle Spalle', icon: '🔪', rarity: 'rare', hero: 'assassino', via: 'colpo', max: 1,
      desc: '+10% danno sui nemici che non ti stanno guardando',
      apply: p => { p.perk.spalle += 0.10; } },
    { id: 'ass_uscita', name: 'Uscita Rapida', icon: '🏃', rarity: 'rare', hero: 'assassino', via: 'tenuta', max: 1,
      desc: 'Dopo un uccisione la ricarica dello scatto cala del 20%',
      apply: p => { p.boon.dashKillQuota += 0.20; } },
    { id: 'ass_tossina', name: 'Tossina', icon: '☠️', rarity: 'rare', hero: 'assassino', via: 'mestiere', max: 1,
      desc: 'I colpi avvelenano: 2,5% del danno al secondo per 3s',
      apply: p => { p.boon.poison = 1; p.boon.poisonQuota = 0.025; } },
    { id: 'ass_esecuzione', name: 'Esecuzione', icon: '💀', rarity: 'epic', hero: 'assassino', via: 'colpo', max: 1,
      desc: '+25% danno contro i nemici sotto il 35% dei PV',
      apply: p => { p.boon.esecuzione += 0.25; } },
    { id: 'ass_ombra', name: 'Passo d Ombra', icon: '🌫', rarity: 'epic', hero: 'assassino', via: 'tenuta', max: 1,
      desc: 'Dopo uno scatto, il primo colpo entro 0,8s e critico garantito',
      apply: p => { p.boon.ombraDash = Math.max(p.boon.ombraDash, 0.8); } },
    { id: 'ass_corrosivo', name: 'Veleno Corrosivo', icon: '🧪', rarity: 'epic', hero: 'assassino', via: 'mestiere', max: 1,
      desc: 'Il tuo veleno toglie anche l 8% del danno al nemico',
      apply: p => { p.boon.velenoCorrode += 0.08; } },
    { id: 'ass_grazia', name: 'Colpo di Grazia', icon: '🗡️', rarity: 'divine', hero: 'assassino', via: 'colpo', max: 1,
      desc: 'I nemici sotto il 10% dei PV muoiono all istante (boss esclusi)',
      apply: p => { p.boon.execute += 1; } },
    { id: 'ass_scena', name: 'Uscita di Scena', icon: '🌑', rarity: 'divine', hero: 'assassino', via: 'tenuta', max: 1,
      desc: 'Sotto il 30% dei PV sparisci dalla vista per 0,8s (una volta ogni 20s)',
      apply: p => { p.boon.scomparsa = Math.max(p.boon.scomparsa, 0.8); } },
    { id: 'ass_fredda', name: 'Mano Fredda', icon: '❄️', rarity: 'divine', hero: 'assassino', via: 'mestiere', max: 1,
      desc: 'Ogni colpo non critico alza del 2,5% la probabilita di critico. Si azzera al critico',
      apply: p => { p.boon.manoFredda += 0.025; } },
    // ============================== ARCIERE ==============================
    { id: 'arc_lungo', name: 'Tiro Lungo', icon: '🔭', rarity: 'uncommon', hero: 'arciere', via: 'colpo', max: 1,
      desc: 'Piu lontano e il bersaglio, piu fai male (+5% a piena gittata)',
      apply: p => { p.boon.longshot += 1; } },
    { id: 'arc_piede', name: 'Piede Leggero', icon: '👟', rarity: 'uncommon', hero: 'arciere', via: 'tenuta', max: 1,
      desc: '-12% ricarica dello scatto',
      apply: p => { p.boon.dashCd += 0.12; } },
    { id: 'arc_perfora', name: 'Perforazione', icon: '🏹', rarity: 'uncommon', hero: 'arciere', via: 'mestiere', max: 1,
      desc: 'Le frecce perforano un nemico in piu',
      apply: p => { p.boon.pierce += 1; } },
    { id: 'arc_vento', name: 'Vento in Poppa', icon: '💨', rarity: 'rare', hero: 'arciere', via: 'colpo', max: 1,
      desc: 'Le frecce viaggiano il 12% piu veloci e la gittata cresce dell 8%',
      apply: p => { p.perk.bulletSpeed = (p.perk.bulletSpeed || 0) + 0.12; p.perk.gittata = (p.perk.gittata || 0) + 0.08; } },
    { id: 'arc_radici', name: 'Radici', icon: '🌿', rarity: 'rare', hero: 'arciere', via: 'tenuta', max: 1,
      desc: 'Fermo da un secondo, prendi l 8% di danni in meno finche non ti muovi',
      apply: p => { p.boon.radici += 0.08; } },
    { id: 'arc_incendiaria', name: 'Freccia Incendiaria', icon: '🔥', rarity: 'rare', hero: 'arciere', via: 'mestiere', max: 1,
      desc: 'Ogni quarta freccia lascia a terra una fiamma per 1s',
      apply: p => { p.boon.frecciaFuoco = 4; } },
    { id: 'arc_concentra', name: 'Concentrazione', icon: '🧠', rarity: 'epic', hero: 'arciere', via: 'colpo', max: 1,
      desc: 'Stando fermo mezzo secondo, il colpo successivo fa +10% danno',
      apply: p => { p.boon.concentra += 0.10; } },
    { id: 'arc_guizzo', name: 'Guizzo', icon: '✨', rarity: 'epic', hero: 'arciere', via: 'tenuta', max: 1,
      desc: 'Dopo lo scatto resti invulnerabile altri 0,2s',
      apply: p => { p.boon.guizzo += 0.2; } },
    { id: 'arc_teste', name: 'Cacciatore di Teste', icon: '🎯', rarity: 'epic', hero: 'arciere', via: 'mestiere', max: 1,
      desc: '+12% danno contro elite e boss',
      apply: p => { p.boon.vsElite += 0.12; } },
    { id: 'arc_vitale', name: 'Punto Vitale', icon: '🏹', rarity: 'divine', hero: 'arciere', via: 'colpo', max: 1,
      desc: 'Ogni decimo colpo e un critico garantito',
      apply: p => { p.boon.critOgni = 10; } },
    { id: 'arc_lentezza', name: 'Campo di Lentezza', icon: '⏳', rarity: 'divine', hero: 'arciere', via: 'tenuta', max: 1,
      desc: 'I nemici entro 200px si muovono il 12% piu lenti',
      apply: p => { p.boon.lentezza = Math.max(p.boon.lentezza, 200); p.boon.lentezzaQ = Math.max(p.boon.lentezzaQ, 0.12); } },
    { id: 'arc_raffica', name: 'Raffica', icon: '🎯', rarity: 'divine', hero: 'arciere', via: 'mestiere', max: 1,
      desc: 'Ogni ottavo colpo partono tre frecce a ventaglio, le laterali al 50%',
      apply: p => { p.boon.raffica = 8; } },
    // ============================== MAGO ==============================
    { id: 'mag_studio', name: 'Studio', icon: '📖', rarity: 'uncommon', hero: 'mago', via: 'colpo', max: 1,
      desc: '+5% danno delle scariche',
      apply: p => { p.stats.schoolDmg.magic += 0.05; } },
    { id: 'mag_gelido', name: 'Tocco Gelido', icon: '❄️', rarity: 'uncommon', hero: 'mago', via: 'tenuta', max: 1,
      desc: 'I colpi rallentano i nemici del 25% per 1,5s',
      apply: p => { p.boon.slow += 1; p.boon.slowQ = Math.max(p.boon.slowQ, 0.25); } },
    { id: 'mag_mana', name: 'Mana Sottile', icon: '🔹', rarity: 'uncommon', hero: 'mago', via: 'mestiere', max: 1,
      desc: '-6% alla ricarica delle abilita',
      apply: p => { p.stats.cdrMult *= 0.94; } },
    { id: 'mag_catena', name: 'Catena di Fulmini', icon: '⛓️', rarity: 'rare', hero: 'mago', via: 'colpo', max: 1,
      desc: 'Il colpo rimbalza su 2 nemici vicini, al 12% del danno',
      apply: p => { p.boon.chain += 2; p.boon.chainQ = Math.max(p.boon.chainQ, 0.12); } },
    { id: 'mag_scudo', name: 'Scudo Arcano', icon: '🔮', rarity: 'rare', hero: 'mago', via: 'tenuta', max: 1,
      desc: 'Ogni 16 secondi assorbi per intero un colpo',
      apply: p => { p.boon.aegis += 1; p.boon.aegisCd = Math.max(p.boon.aegisCd, 16); } },
    { id: 'mag_rimbalzo', name: 'Rimbalzo', icon: '↩️', rarity: 'rare', hero: 'mago', via: 'mestiere', max: 1,
      desc: 'Le scariche rimbalzano una volta in piu sui muri, senza perdere danno',
      apply: p => { p.boon.bounce += 1; } },
    { id: 'mag_esplosivi', name: 'Colpi Esplosivi', icon: '💣', rarity: 'epic', hero: 'mago', via: 'colpo', max: 1,
      desc: 'Ogni quarto colpo esplode: 18% del danno in un raggio di 90px',
      apply: p => { p.boon.explodeEvery = 4; p.boon.explodeQuota = 0.18; } },
    { id: 'mag_vuoto', name: 'Passo del Vuoto', icon: '🌀', rarity: 'epic', hero: 'mago', via: 'tenuta', max: 1,
      desc: 'Lo scatto diventa un salto istantaneo: attraversi quello che c e in mezzo',
      apply: p => { p.perk.passoVuoto = 1; } },
    { id: 'mag_puro', name: 'Elementalista Puro', icon: '☄️', rarity: 'epic', hero: 'mago', via: 'mestiere', max: 1,
      desc: 'La Palla di Fuoco ha il 12% di raggio in piu',
      apply: p => { p.boon.pallaRaggio += 0.12; } },
    { id: 'mag_frattura', name: 'Frattura Arcana', icon: '🔮', rarity: 'divine', hero: 'mago', via: 'colpo', max: 1,
      desc: 'La scarica che uccide si divide in due scariche minori (25% del danno)',
      apply: p => { p.boon.frattura = 1; p.boon.fratturaQ = Math.max(p.boon.fratturaQ, 0.25); } },
    { id: 'mag_barriera', name: 'Barriera di Mana', icon: '🛡', rarity: 'divine', hero: 'mago', via: 'tenuta', max: 1,
      desc: 'Sotto il 35% dei PV alzi uno scudo pari al 10% dei tuoi PV (una volta per ondata)',
      apply: p => { p.boon.barriera = Math.max(p.boon.barriera, 0.10); } },
    { id: 'mag_doppia', name: 'Doppia Incantazione', icon: '✨', rarity: 'divine', hero: 'mago', via: 'mestiere', max: 1,
      desc: 'La Palla di Fuoco ha una seconda carica',
      apply: p => { p.boon.pallaDoppia = 1; } },
    // ============================== WARLOCK ==============================
    { id: 'war_patto', name: 'Patto di Sangue', icon: '🩸', rarity: 'uncommon', hero: 'warlock', via: 'colpo', max: 1,
      desc: '+6% danno, ma -4% PV massimi',
      apply: p => { p.stats.dmgMult *= 1.06; p.stats.maxHpMult -= 0.04; } },
    { id: 'war_pelle', name: 'Pelle di Patto', icon: '🖤', rarity: 'uncommon', hero: 'warlock', via: 'tenuta', max: 1,
      desc: '+12 PV e -3% a tutti i danni subiti',
      apply: p => { p.stats.maxHpFlat += 12; p.stats.dmgReduce = Math.min(0.85, p.stats.dmgReduce + 0.03); } },
    { id: 'war_sussurri', name: 'Sussurri', icon: '👁', rarity: 'uncommon', hero: 'warlock', via: 'mestiere', max: 1,
      desc: '-6% alla ricarica delle abilita',
      apply: p => { p.stats.cdrMult *= 0.94; } },
    { id: 'war_diffusa', name: 'Maledizione Diffusa', icon: '🕸', rarity: 'rare', hero: 'warlock', via: 'colpo', max: 1,
      desc: 'I colpi su un maledetto rimbalzano sul nemico piu vicino, al 12%',
      apply: p => { p.boon.maledRimbalzo += 0.12; } },
    { id: 'war_carne', name: 'Carne Debitrice', icon: '⛓', rarity: 'rare', hero: 'warlock', via: 'tenuta', max: 1,
      desc: 'Il 12% del danno che subisci lo prende anche il maledetto piu vicino',
      apply: p => { p.boon.carneDebito += 0.12; } },
    { id: 'war_tributo', name: 'Tributo di Sangue', icon: '🩸', rarity: 'rare', hero: 'warlock', via: 'mestiere', max: 1,
      desc: 'Ogni nemico che muore vicino da +3% danno per 4s, fino a +18%',
      apply: p => { p.boon.killDmg += 1; } },
    { id: 'war_marchio', name: 'Marchio del Patrono', icon: '🔗', rarity: 'epic', hero: 'warlock', via: 'colpo', max: 1,
      desc: 'Ogni sesto colpo maledice il bersaglio: +12% danni subiti per 4s',
      apply: p => { p.perk.maledOgni = 6; p.perk.maledMult = 1.12; p.perk.maledDur = 4; } },
    { id: 'war_zombie', name: 'Zombie Tenace', icon: '🧟', rarity: 'epic', hero: 'warlock', via: 'tenuta', max: 1,
      desc: 'Il tuo zombie ha il 25% di PV in piu',
      apply: p => { p.boon.zombiePv += 0.25; } },
    { id: 'war_legame', name: 'Legame Osseo', icon: '🦴', rarity: 'epic', hero: 'warlock', via: 'mestiere', max: 1,
      desc: 'L 8% dei danni che subisci li prende il tuo zombie al posto tuo',
      apply: p => { p.boon.legameOsseo += 0.08; } },
    { id: 'war_perpetua', name: 'Maledizione Perpetua', icon: '♾', rarity: 'divine', hero: 'warlock', via: 'colpo', max: 1,
      desc: 'La maledizione non scade finche il bersaglio e vivo',
      apply: p => { p.boon.maledPerpetua = 1; } },
    { id: 'war_lentezza', name: 'Campo di Lentezza', icon: '⏳', rarity: 'divine', hero: 'warlock', via: 'tenuta', max: 1,
      desc: 'I nemici entro 200px si muovono il 12% piu lenti',
      apply: p => { p.boon.lentezza = Math.max(p.boon.lentezza, 200); p.boon.lentezzaQ = Math.max(p.boon.lentezzaQ, 0.12); } },
    { id: 'war_debito', name: 'Debito di Sangue', icon: '💀', rarity: 'divine', hero: 'warlock', via: 'mestiere', max: 1,
      desc: 'Il 12% del danno accumulato su un maledetto scoppia quando muore (mai piu di un tuo colpo)',
      apply: p => { p.boon.debito += 0.12; } },
  ];
  // v1.79 — TRE RITIRATE: Avidita, Fortuna Sfacciata e Fame Vorace davano bonus all XP raccolta. Col
  // tetto ai livelli sono spazzatura per costruzione — al livello 12, dove si sceglie lo scaglione
  // divino, varrebbero esattamente zero. Se un giorno servissero, il posto giusto e un bonus alle
  // MONETE gestito dal Banditore, fuori dagli scaglioni.
  const BOON_BY_ID = {}; for (const b of BOONS) BOON_BY_ID[b.id] = b;

  // ===== SINERGIE tra Boon (v1.7): possedere entrambi sblocca un effetto potenziato =====
  // v2.20.0 — LE SINERGIE SEGUONO IL MAZZO NUOVO. Le sei di prima chiedevano coppie come
  // «Tossina + Colpi Esplosivi» o «Perforazione + Lama Sporca», che nel mazzo vecchio potevano capitare
  // perche' le carte erano condivise fra classi. Adesso nessuna carta e' condivisa, quindi una coppia
  // mista non e' piu' RAGGIUNGIBILE DA NESSUNO: sarebbero rimaste scritte e morte.
  // Le nuove sono SETTE, una per classe, e ognuna chiede due carte di QUELLA classe prese a livelli
  // diversi — cioe' un premio a chi ha seguito una linea invece di raccogliere a caso.
  // Gli effetti sono volutamente piccoli: dopo il dimezzamento del mazzo, una sinergia grossa
  // rimetterebbe dalla finestra quello che Paolo ha tolto dalla porta.
  const SYNERGIES = [
    { id: 'syn_barbaro', name: 'Muro di Carne', icon: '🧱', need: ['bar_pellaccia', 'bar_cicatrici'],
      desc: 'Un altro 3% di danni subiti in meno', apply: p => { p.stats.dmgReduce = Math.min(0.85, p.stats.dmgReduce + 0.03); } },
    { id: 'syn_paladino', name: 'Fortezza', icon: '🏰', need: ['pal_alzato', 'pal_baluardo'],
      desc: 'Un altro 3% di danni subiti in meno', apply: p => { p.stats.dmgReduce = Math.min(0.85, p.stats.dmgReduce + 0.03); } },
    { id: 'syn_maestro', name: 'Scuola di Scherma', icon: '🤺', need: ['mae_parata', 'mae_risposta'],
      desc: 'La Risposta dopo la parata vale il doppio', apply: p => { p.boon.risposta += 0.20; } },
    { id: 'syn_assassino', name: 'Lama Avvelenata', icon: '🧪', need: ['ass_tossina', 'ass_corrosivo'],
      desc: 'Il veleno dura un secondo in piu', apply: p => { p.boon.velenoDur = (p.boon.velenoDur || 0) + 1; } },
    { id: 'syn_arciere', name: 'Mira', icon: '🎯', need: ['arc_concentra', 'arc_lungo'],
      desc: '+5% probabilita di critico', apply: p => { p.stats.critChance += 0.05; } },
    { id: 'syn_mago', name: 'Convergenza', icon: '🔮', need: ['mag_esplosivi', 'mag_frattura'],
      desc: '+5% danno delle scariche', apply: p => { p.stats.schoolDmg.magic += 0.05; } },
    { id: 'syn_warlock', name: 'Patto Profondo', icon: '⛓', need: ['war_marchio', 'war_perpetua'],
      desc: 'La maledizione pesa un altro 4%', apply: p => { p.perk.maledMult = (p.perk.maledMult || 1) + 0.04; } },
  ];
  // Ritorna le sinergie appena attivate (need tutti posseduti) non ancora presenti in activeIds.
  function detectSynergies(ownedCounts, activeIds) {
    const out = [];
    for (const sy of SYNERGIES) { if (activeIds[sy.id]) continue; if (sy.need.every(id => (ownedCounts[id] || 0) > 0)) out.push(sy); }
    return out;
  }
  const SYNERGY_BY_ID = {}; for (const sy of SYNERGIES) SYNERGY_BY_ID[sy.id] = sy;

  const BOON_CHOICES = 3;  // v2.20.0 — TRE abilita' in vista, tutte e tre della tua classe
  function pickWeighted(list, rng) { let tot = 0; for (const it of list) tot += (it.weight || 0); let r = (rng ? rng() : Math.random()) * tot; for (const it of list) { r -= (it.weight || 0); if (r <= 0) return it; } return list[list.length - 1]; }
  // v1.79 — LE OFFERTE NON SI SORTEGGIANO PIU'. Lo scaglione decide cosa vedi: le DUE abilita' della tua
  // classe di quello scaglione, piu' le DUE neutre. Sempre quelle, sempre tutte e quattro. Nascondere una
  // delle quattro non aggiungerebbe varieta' — con una sola scelta per scaglione aggiungerebbe solo
  // frustrazione; la varieta' sta nel cambiare classe e nella specializzazione del 15.
  // L'ordine e' voluto: prima le tue, poi le neutre.
  // ============================================================================================
  // v2.20.0 — CHI VEDE COSA: non serve piu' una tabella
  // ============================================================================================
  // Fino alla 2.19 c'era `CARTE_CLASSE`, un elenco di id per classe, perche' la stessa carta poteva
  // essere di tre classi diverse e `hero` sull'oggetto non bastava a dirlo. Adesso ogni carta e' di UNA
  // classe sola e se lo porta scritto addosso (`hero`), quindi la tabella era una seconda verita' da
  // tenere allineata a mano — cioe' il posto da cui, prima o poi, nasce lo sfasamento.
  //
  // L'ORDINE DELLE TRE E' VOLUTO e non si sorteggia: colpo, tenuta, mestiere. Sempre le stesse tre
  // colonne, a ogni livello e per ogni classe: e' cio' che rende la griglia leggibile senza spiegarla.
  const VIE = ['colpo', 'tenuta', 'mestiere'];
  function carteDi(heroId) { return BOONS.filter(b => b.hero === heroId).map(b => b.id); }
  function offerteScaglione(heroId, tier, ownedCounts) {
    const gia = ownedCounts || {};
    const mie = BOONS.filter(b => b.hero === heroId && b.rarity === tier && !(gia[b.id] > 0));
    return mie.slice().sort((a, b) => VIE.indexOf(a.via) - VIE.indexOf(b.via));
  }
  // Tutte le abilita' che una classe puo' incontrare in una run. Serve al pannello delle abilita' e ai
  // test — un mago non deve mai vedere quelle del guerriero.
  function boonsPerClasse(heroId) { return BOONS.filter(b => b.hero === heroId); }

  // ===== EQUIPAGGIAMENTO a slot (v1.8): acquistabile con MONETE. 5 slot x 5 tier. =====
  // Ogni tier aggiunge `per` alle statistiche del giocatore (delta additivo, campi gia esistenti in p.stats).
  // v1.67 — l'EMPORIO generico (tre slot da salire a livelli: GEAR, GEAR_BY_SLOT, gearCost, GEAR_RANK,
  // GEAR_RARITY) e' stato rimosso: al suo posto c'e' il catalogo di oggetti per classe in shared/gear.js,
  // dove ogni pezzo ha un nome, un prezzo e statistiche proprie. Qui restava solo una scala di numeri.

  // ===== MONETE (v1.8): converte un valore in "monete" di vario taglio per il drop a terra. =====
  function coinsFor(value, denoms) {
    const out = []; let v = Math.max(0, Math.round(value));
    const sorted = denoms.slice().sort((a, b) => b.v - a.v);
    for (const d of sorted) { while (v >= d.v && out.length < 12) { out.push(d); v -= d.v; } }
    if (!out.length && value > 0) out.push(sorted[sorted.length - 1]);
    return out;
  }

  return { CRATE_BUFFS, WEAPONS, WEAPON_EVOS, WEAPON_ORDER, ITEMS, XP_STATS, statCost, STAT_MAX_LEVEL, STAT_COST_STEPS, BOON_CHOICES, BOONS, BOON_BY_ID, offerteScaglione, boonsPerClasse, carteDi, VIE, pickWeighted, SYNERGIES, SYNERGY_BY_ID, detectSynergies, coinsFor };
});
