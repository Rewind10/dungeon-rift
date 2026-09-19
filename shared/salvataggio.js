/* salvataggio.js — COSA C'E' DENTRO UNA PARTITA SALVATA (UMD, condiviso client/server)
 *
 * v2.11 — Si salva dall'OSTESSA, per dieci monete, quando lo decidi tu. Niente salvataggi automatici:
 * scegliere quando salvare e' il salvataggio, e uno automatico toglie quella scelta senza chiedere.
 *
 * ================================ LA REGOLA, UNA SOLA ================================
 * SI SALVANO LE CAUSE, NON GLI EFFETTI.
 *
 * Un personaggio all'ondata 12 ha `stats.dmgMult = 1.08`, `perk.parata = 2`, `maxHp = 290`. Sono tutti
 * numeri CALCOLATI, da `_recomputeBoons` e `_recomputeGear`, a partire da cose piu' semplici: i punti che
 * hai speso (`buys`), le carte che hai preso (`boonsOwned`), l'equipaggiamento che porti (`gear`).
 *
 * Se salvassimo i numeri calcolati, il giorno che ritari il costo di una statistica o il danno di
 * un'armatura, ogni partita salvata resterebbe con i numeri VECCHI — e non si vedrebbe: nessun errore,
 * nessun crash, solo un personaggio leggermente sbagliato che nessuno sa spiegare. Salvando le cause e
 * ricalcolando al caricamento, un salvataggio vecchio prende automaticamente il bilanciamento nuovo.
 *
 * E' anche il motivo per cui questo file e' corto: le cause sono poche, gli effetti sono cento.
 *
 * ================================ DOVE VIVE ================================
 * Il SERVER lo costruisce e lo applica; il CLIENT lo tiene, in `localStorage`. Cosi' il server resta
 * senza memoria — non ha cartelle da gestire, file da ripulire, nomi da riconoscere — e il salvataggio
 * segue il browser di chi gioca. Il prezzo, che va detto: cambi browser o cancelli i dati del sito e il
 * salvataggio non c'e' piu'.
 *
 * ================================ UNO SOLO ================================
 * Un salvataggio per volta: salvare sovrascrive. E' la regola piu' facile da tenere in testa mentre
 * giochi — c'e' o non c'e' — e non chiede nessun pannello di scelta.
 */
(function (root, factory) {
  const m = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = m;
  else { root.GAME = root.GAME || {}; root.GAME.Salvataggio = m; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Cambia SOLO quando cambia la FORMA del salvataggio (un campo nuovo indispensabile, uno che sparisce).
  // Un salvataggio con un numero diverso viene rifiutato con un messaggio, non caricato a meta': un
  // caricamento parziale produce un personaggio impossibile, ed e' molto peggio di un "non si puo'".
  // v2.12 — DA 1 A 2, e il motivo non e' un campo nuovo: e' che `gear` e `owned` contengono ID DI OGGETTI
  // e con i 104 pezzi nuovi nessuno di quegli ID esiste piu'. Un salvataggio della 2.11 caricato oggi non
  // esploderebbe — `effWeapon` e `bonusOf` ignorano gli ID che non conoscono — e sarebbe molto peggio:
  // ripartiresti disarmato e senza bonus, senza nessun errore, con un personaggio che sembra rotto senza
  // che si capisca perche'. Meglio un rifiuto pulito: si rigioca dall'inizio, e si sa il motivo.
  // v2.16 — FORMATO 3. La cintura e' passata da tre slot a due e le abilita' attive da due slot a tre:
  // un pacchetto vecchio ha la cintura lunga tre e `abil` scritto come {q, e}. Si potrebbe convertire,
  // ma un salvataggio mezzo convertito e' peggio di uno rifiutato — e la regola di questo file e' che un
  // salvataggio si carica INTERO o si rifiuta INTERO. Come nella v2.12, quando cambiarono i 104 id
  // dell'equipaggiamento: chi ha un pacchetto di prima riceve un messaggio chiaro, non una partita
  // sbagliata di nascosto.
  const FORMATO = 3;

  const CHIAVE = 'dr_salvataggio';     // dove sta in localStorage
  const COSTO = 10;                    // le monete dell'Ostessa

  // i campi del giocatore che sono CAUSE. Chi aggiunge una causa nuova al gioco la aggiunge qui, e il
  // test se ne accorge: c'e' un controllo che confronta un personaggio salvato-e-ricaricato con
  // l'originale, campo per campo.
  const CAMPI = ['heroId', 'xpPool', 'level', 'points', 'cards', 'spec', 'boonsOwned', 'cardOn',
    'buys', 'gear', 'owned', 'belt', 'coins', 'lives', 'abil', 'scaglioniDovuti', 'abilDovute'];

  const copia = (v) => (v === undefined || v === null) ? v : JSON.parse(JSON.stringify(v));

  // Costruisce il salvataggio a partire da una partita in corso. `room` serve per l'ondata e la modalita'.
  function costruisci(room, p) {
    if (!room || !p) return null;
    const d = { f: FORMATO, v: room.VERSIONE || '', quando: Date.now(), ondata: room.wave | 0, modo: room.mode || null, nome: p.name || '' };
    for (const k of CAMPI) d[k] = copia(p[k]);
    return d;
  }

  // Cosa scrivere sul pulsante "Riprendi", senza dover aprire il salvataggio vero.
  const NOMI = { guerriero: 'Guerriero', mago: 'Mago', ladro: 'Ladro' };
  function etichetta(d) {
    if (!valido(d)) return null;
    return { ondata: d.ondata | 0, livello: d.level | 0, classe: NOMI[d.heroId] || d.heroId, nome: d.nome || '', quando: d.quando || 0 };
  }

  // Un salvataggio si rifiuta INTERO o si carica INTERO. Qui si guarda solo la forma: che sia un oggetto,
  // del formato giusto, con una classe che esiste e dei numeri che stanno nel loro intervallo. Non e'
  // antifrode — e' un gioco in singolo, chi vuole barare apre la console e bara — e' che un salvataggio
  // corrotto a meta' non deve poter mandare il server per aria.
  function valido(d) {
    if (!d || typeof d !== 'object') return false;
    if (d.f !== FORMATO) return false;
    if (!NOMI[d.heroId]) return false;
    if (!(d.ondata >= 0 && d.ondata <= 99)) return false;
    if (!(d.level >= 1 && d.level <= 99)) return false;
    return true;
  }

  // Applica il salvataggio a un giocatore. Torna false se non si puo': chi chiama deve dirlo, non
  // proseguire a meta'. NON ricalcola niente e non cambia la fase: quello e' mestiere della stanza, che
  // sa in che ordine vanno fatte le cose.
  function applica(p, d) {
    if (!p || !valido(d)) return false;
    for (const k of CAMPI) if (d[k] !== undefined) p[k] = copia(d[k]);
    // i numeri che arrivano da fuori si stringono comunque nei loro limiti: un salvataggio ritoccato a
    // mano non deve produrre un personaggio impossibile, deve produrne uno brutto.
    p.level = Math.max(1, Math.min(99, p.level | 0));
    p.points = Math.max(0, p.points | 0);
    p.coins = Math.max(0, p.coins | 0);
    p.lives = Math.max(0, Math.min(9, p.lives | 0));
    p.xpPool = Math.max(0, p.xpPool | 0);
    if (!p.abil || typeof p.abil !== 'object') p.abil = { q: null, e: null };
    if (!Array.isArray(p.belt)) p.belt = [null, null, null];
    if (!Array.isArray(p.cards)) p.cards = [];
    if (!Array.isArray(p.scaglioniDovuti)) p.scaglioniDovuti = [];
    if (!Array.isArray(p.abilDovute)) p.abilDovute = [];
    return true;
  }

  return { FORMATO, CHIAVE, COSTO, CAMPI, costruisci, etichetta, valido, applica };
});
