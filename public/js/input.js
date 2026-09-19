/* input.js — tastiera + mouse (dash = tasto destro/Shift)
 *
 * v2.10 — IL MIRINO AL GUINZAGLIO. Il mirino non si allontana piu' di MIRA_R pixel dal personaggio.
 *
 * PERCHE' NON BASTA "limitare il cursore". Una pagina web NON PUO' spostare il cursore del sistema: non
 * esiste un'API per farlo, ed e' voluto — un sito che ti muove il puntatore e' un sito che ti fa cliccare
 * dove vuole lui. L'unica strada e' il POINTER LOCK: si chiede al browser di NASCONDERE il cursore vero e
 * di mandarci solo gli SPOSTAMENTI (`movementX/Y`). A quel punto il mirino e' roba nostra — lo teniamo
 * noi, lo disegniamo noi, e lo fermiamo dove vogliamo. E' come si controllano i twin-stick.
 *
 * IL GUINZAGLIO E' UN VETTORE DAL CENTRO. Il personaggio sta sempre al centro dello schermo (la camera lo
 * insegue), quindi il mirino e' semplicemente uno SCOSTAMENTO dal centro: si accumulano i movimenti e si
 * accorcia il vettore quando supera il raggio. Nessuna conversione fra mondo e schermo: la mappa e'
 * disegnata 1:1, un pixel di mondo e' un pixel di schermo.
 *
 * SI PUO' GIOCARE ANCHE SENZA. Il pointer lock lo concede il browser, e solo dopo un clic; l'utente puo'
 * uscirne con Esc quando vuole, e su un telefono non esiste. Se non c'e', il mirino segue il cursore vero
 * — CLAMPATO ALLO STESSO RAGGIO. Cosi' la regola del gioco e' identica nei due casi: cambia solo se il
 * puntatore che vedi e' il tuo o il nostro. Per questo il guinzaglio sta in un posto solo, `_clamp()`.
 *
 * v2.11.1 — NEL VILLAGGIO IL GUINZAGLIO SI SPEGNE, e non e' un'eccezione estetica: e' che nel villaggio
 * il mouse serve per CLICCARE — il fabbro, l'Ostessa, l'Erborista hanno dei pannelli con dei pulsanti.
 * Col pointer lock il cursore non esiste proprio, quindi quei pulsanti non si potevano premere; e anche
 * senza pointer lock, un mirino fermo a 200px mentre il puntatore vero va avanti e' la confusione che
 * volevamo evitare. Li' dentro non si spara: comanda il cursore del sistema, e basta.
 *
 * `guinzaglio` lo decide il gioco (main.js, guardando la fase). Qui si obbedisce e basta.
 */
(function () {
  'use strict';
  const Input = {
    keys: {}, mouse: { x: 0, y: 0, down: false, right: false }, dashEdge: false,
    // il MIRINO: scostamento in pixel dal centro dello schermo, cioe' dal personaggio.
    mira: { x: 140, y: 0 },
    MIRA_R: 200,              // il guinzaglio
    guinzaglio: true,         // v2.11.1 — acceso in combattimento, spento nel villaggio (lo decide main.js)
    locked: false,            // il browser ci ha dato il pointer lock?
    alBordo: false,           // sta premendo contro il limite
    // L'UNICO punto in cui il guinzaglio viene applicato. Col pointer lock e senza si passa di qui, ed e'
    // il motivo per cui le due strade non possono divergere.
    _clamp() {
      let d = Math.hypot(this.mira.x, this.mira.y);
      if (!d) { this.mira.x = 1; d = 1; }        // a distanza zero non esiste un angolo: si tiene a destra
      if (!this.guinzaglio) { this.alBordo = false; return; }   // nel villaggio il mirino va dove vuole
      if (d > this.MIRA_R) { const k = this.MIRA_R / d; this.mira.x *= k; this.mira.y *= k; this.alBordo = true; }
      else this.alBordo = d > this.MIRA_R - 6;
    },
    // si aggancia al primo clic sul canvas: prima non si puo', il browser lo concede solo su un gesto.
    // A guinzaglio spento NON si aggancia mai: li' il cursore serve per cliccare, e il pointer lock lo
    // farebbe sparire — che e' esattamente il bug per cui nel villaggio non si apriva piu' niente.
    aggancia() {
      if (!this.guinzaglio || this.locked || !this.canvas || !this.canvas.requestPointerLock) return;
      try { this.canvas.requestPointerLock(); } catch (_) {}
    },
    sgancia() { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {} },
    // acceso/spento dal gioco a seconda della fase. RIACCENDENDOLO si riaccorcia subito il mirino: nel
    // villaggio puo' essere finito a seicento pixel, e uscendo dalla faglia resterebbe li' — disegnato
    // lontanissimo — fino al primo movimento del mouse.
    setGuinzaglio(v) {
      v = !!v; if (v === this.guinzaglio) return;
      this.guinzaglio = v; this._clamp();
    },
    init(canvas) {
      this.canvas = canvas;
      document.addEventListener('pointerlockchange', () => {
        this.locked = document.pointerLockElement === canvas;
        // uscendo dal blocco il cursore vero ricompare dove gli pare: si riallinea il mirino al prossimo
        // movimento invece di lasciarlo saltare da solo.
        if (!this.locked) { this.mouse.down = false; this._riallinea = true; }
      });
      document.addEventListener('pointerlockerror', () => { this.locked = false; });
      window.addEventListener('keydown', (e) => { if (this._typing()) return; this.keys[e.code] = true; if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab','ShiftLeft','ShiftRight'].includes(e.code)) e.preventDefault(); if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.dashEdge = true; });
      window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
      canvas.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top;
        // AGGANCIATO: contano solo gli spostamenti, il cursore vero non esiste piu'.
        if (this.locked) { this.mira.x += e.movementX || 0; this.mira.y += e.movementY || 0; }
        // LIBERO: il mirino punta dove punta il cursore, ma non oltre il guinzaglio.
        else { this.mira.x = this.mouse.x - r.width / 2; this.mira.y = this.mouse.y - r.height / 2; this._riallinea = false; }
        this._clamp();
      });
      canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this.mouse.down = true; if (e.button === 2) { this.mouse.right = true; this.dashEdge = true; } });
      window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouse.down = false; if (e.button === 2) this.mouse.right = false; });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener('touchstart', (e) => this._touch(e), { passive: false });
      canvas.addEventListener('touchmove', (e) => this._touch(e), { passive: false });
      canvas.addEventListener('touchend', () => { this.mouse.down = false; });
      // v1.10/v1.11 — FIX input: su perdita focus/visibilita azzeriamo lo stato (evita tasti "incollati").
      // NB (v1.11): NON azzerare su 'contextmenu' — il dash usa il tasto destro e cancellava il movimento!
      window.addEventListener('blur', () => this.clearKeys());
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearKeys(); });
      canvas.addEventListener('mouseleave', () => { this.mouse.down = false; });
      this._clamp();
    },
    clearKeys() { this.keys = {}; this.mouse.down = false; this.mouse.right = false; this.dashEdge = false; },
    _typing() { const el = document.activeElement; return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'); },
    _touch(e) { e.preventDefault(); const r = this.canvas.getBoundingClientRect(); for (const t of e.touches) { const x = t.clientX - r.left, y = t.clientY - r.top; if (x >= r.width * 0.4) { this.mouse.x = x; this.mouse.y = y; this.mouse.down = true;
      // sul telefono non esiste pointer lock: il dito fa da cursore, e il guinzaglio vale lo stesso
      this.mira.x = x - r.width / 2; this.mira.y = y - r.height / 2; this._clamp(); } } },
    moveVec() { let x = 0, y = 0; if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1; if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1; if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1; if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1; return { x, y }; },
    // v2.10 — l'angolo arriva dal MIRINO, non piu' dal cursore. `px, py` restano nella firma perche' e' il
    // centro dello schermo e chi chiama lo passa gia': il mirino e' relativo a quel punto per costruzione.
    build(px, py) { if (this._typing()) { this.dashEdge = false; return { mx: 0, my: 0, aim: Math.atan2(this.mira.y, this.mira.x), shoot: false, ab: 0, dash: false, pot: 0 }; } const mv = this.moveVec(); const aim = Math.atan2(this.mira.y, this.mira.x); const shoot = this.mouse.down || !!this.keys['Space']; const dash = this.dashEdge; this.dashEdge = false; // v1.71 — la cintura: 1 2 3. Si manda QUALE slot e' premuto (0 = nessuno); il fronte di salita lo
    // riconosce il server, cosi' tenere premuto non svuota lo slot.
    // v2.16 — I TASTI SI SONO SCAMBIATI IL MESTIERE. I numeri erano le pozioni e Q/E le abilita';
    // adesso i numeri sono le ABILITA' (che sono diventate tre) e Q/E le POZIONI (che sono diventate
    // due). Vanno insieme: tre abilita' non stanno su due tasti, e due pozioni non hanno bisogno di tre.
    // Come gia' faceva la cintura, si manda UN NUMERO e non un booleano per tasto: il server fa partire
    // l'abilita' sul fronte di salita, quindi tenere premuto non la ripete.
    const ab = this.keys['Digit1'] ? 1 : (this.keys['Digit2'] ? 2 : (this.keys['Digit3'] ? 3 : 0));
    const pot = this.keys['KeyQ'] ? 1 : (this.keys['KeyE'] ? 2 : 0);
    return { mx: mv.x, my: mv.y, aim, shoot, ab, dash, pot }; },
  };
  window.Input = Input;
})();
