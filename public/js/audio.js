/* audio.js — musica tetra da dungeon + SFX procedurali */
(function () {
  'use strict';
  const A = {
    ctx: null, master: null, musicGain: null, sfxGain: null, musicOn: true, sfxOn: true,
    tempo: 74, step: 0, nextTime: 0, timer: null, bossMode: false,
    init() { if (this.ctx) return; const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.42; this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.6; this.musicGain.connect(this.master); this.sfxGain.connect(this.master); this.master.connect(this.ctx.destination); this.conv = this.ctx.createConvolver(); this.conv.buffer = this._imp(3.4, 3.0); this.reverbGain = this.ctx.createGain(); this.reverbGain.gain.value = 0.32; this.conv.connect(this.reverbGain); this.reverbGain.connect(this.master); this.musicLP = this.ctx.createBiquadFilter(); this.musicLP.type = 'lowpass'; this.musicLP.frequency.value = 2200; },
    resume() { this.init(); if (this.ctx.state === 'suspended') this.ctx.resume(); },
    _imp(dur, dec) { const rate = this.ctx.sampleRate, len = rate * dur; const b = this.ctx.createBuffer(2, len, rate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, dec); } return b; },
    startMusic(boss) { this.resume(); this.bossMode = !!boss; this.tempo = boss ? 96 : 74; if (this.timer) return; this.step = 0; this.nextTime = this.ctx.currentTime + 0.1; this._drone(); this.timer = setInterval(() => this._sched(), 30); },
    setBoss(b) { this.bossMode = b; this.tempo = b ? 96 : 74; if (this.dOsc2) this.dOsc2.frequency.setTargetAtTime(this._n(b ? -19 : -17), this.ctx.currentTime, 1.5); },
    stopMusic() { if (this.timer) { clearInterval(this.timer); this.timer = null; } if (this.dGain) { try { this.dGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4); } catch (_) {} } this.dOsc = this.dOsc2 = this.dGain = null; },
    _n(s) { return 220 * Math.pow(2, s / 12); },
    _drone() { if (this.dGain) return; const t = this.ctx.currentTime; this.dGain = this.ctx.createGain(); this.dGain.gain.value = 0; this.dGain.gain.setTargetAtTime(0.16, t, 2.0); this.dGain.connect(this.musicLP); this.musicLP.connect(this.musicGain); this.dGain.connect(this.conv); this.dOsc = this.ctx.createOscillator(); this.dOsc.type = 'sine'; this.dOsc.frequency.value = this._n(-24); this.dOsc2 = this.ctx.createOscillator(); this.dOsc2.type = 'triangle'; this.dOsc2.frequency.value = this._n(-17) * 1.004; this.lfo = this.ctx.createOscillator(); this.lfo.frequency.value = 0.06; this.lfoG = this.ctx.createGain(); this.lfoG.gain.value = 700; this.lfo.connect(this.lfoG); this.lfoG.connect(this.musicLP.frequency); this.dOsc.connect(this.dGain); this.dOsc2.connect(this.dGain); this.dOsc.start(t); this.dOsc2.start(t); this.lfo.start(t); },
    _sched() { if (!this.musicOn) return; const spb = 60 / this.tempo; while (this.nextTime < this.ctx.currentTime + 0.3) { this._pstep(this.step, this.nextTime, spb); this.nextTime += spb; this.step = (this.step + 1) % 16; } },
    _pstep(step, t, spb) { const phr = [0, 1, 3, 5, 7, 8, 10]; const roots = this.bossMode ? [-12, -13, -10, -12] : [-12, -10, -13, -12]; const root = roots[Math.floor(step / 4) % roots.length]; if (step % 4 === 0) { this._pad(this._n(root), t, spb * 5.5, 0.09); this._pad(this._n(root + 3), t, spb * 5.5, 0.06); if (this.bossMode) this._pad(this._n(root + 1), t, spb * 5.0, 0.05); } if (step % 4 === 0) { this._heart(t); this._heart(t + spb * 0.28); } if (Math.random() < (this.bossMode ? 0.5 : 0.32)) { const deg = phr[Math.floor(Math.random() * 5)]; this._toll(this._n(root + deg + (Math.random() < 0.5 ? 12 : 24)), t + Math.random() * spb * 0.4, spb * 2.4); } if (step % 8 === 3 && Math.random() < 0.7) this._wind(t, spb * 3); },
    _pad(f, t, dur, g) { const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; const o2 = this.ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 1.003; const gg = this.ctx.createGain(); gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(g, t + dur * 0.4); gg.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(gg); o2.connect(gg); gg.connect(this.musicLP); gg.connect(this.conv); o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1); },
    _toll(f, t, dur) { const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.10, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(this.musicGain); g.connect(this.conv); o.start(t); o.stop(t + dur + 0.05); },
    _heart(t) { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.16); g.gain.setValueAtTime(0.34, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22); o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + 0.24); },
    _wind(t, dur) { const s = this.ctx.createBufferSource(); const len = Math.floor(this.ctx.sampleRate * dur); const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; s.buffer = b; const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.7; const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(bp); bp.connect(g); g.connect(this.conv); s.start(t); s.stop(t + dur); },
    _blip(f, dur, type, g, slide) { if (!this.sfxOn) return; this.resume(); if (!this.ctx) return; const t = this.ctx.currentTime; const o = this.ctx.createOscillator(), gg = this.ctx.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur); gg.gain.setValueAtTime(g || 0.2, t); gg.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(gg); gg.connect(this.sfxGain); o.start(t); o.stop(t + dur + 0.02); },
    _noise(dur, g, ff, type) { if (!this.sfxOn || !this.ctx) return; const t = this.ctx.currentTime; const len = Math.floor(this.ctx.sampleRate * dur); const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; const s = this.ctx.createBufferSource(); s.buffer = b; const fl = this.ctx.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.value = ff || 1200; const gg = this.ctx.createGain(); gg.gain.setValueAtTime(g || 0.3, t); gg.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(fl); fl.connect(gg); gg.connect(this.sfxGain); s.start(t); s.stop(t + dur); },
    shoot(hero, weapon) {
      if (!this.sfxOn) return; this.resume(); if (!this.ctx) return; const t = this.ctx.currentTime;
      let f0 = 560, f1 = 150, type = 'square', dur = 0.09, sub0 = 140, cHp = 1400, cG = 0.32, bG = 0.22;
      // v1.66 — un timbro per scuola: il fendente e' un colpo sordo e corto, la bolla un tono basso e morbido,
      // la freccia uno schiocco secco e acuto. Servono a distinguere le tre classi anche a orecchio.
      if (hero === 'guerriero') { f0 = 260; f1 = 70; type = 'triangle'; dur = 0.13; sub0 = 90; cHp = 700; cG = 0.40; }
      else if (hero === 'mago') { f0 = 420; f1 = 180; type = 'sine'; dur = 0.16; sub0 = 110; cHp = 1800; cG = 0.16; bG = 0.26; }
      else if (hero === 'ladro') { f0 = 900; f1 = 420; type = 'square'; dur = 0.05; sub0 = 80; cHp = 2400; cG = 0.26; bG = 0.12; }
      if (weapon === 'scatter' || weapon === 'scatter_evo') { f0 = 380; f1 = 90; dur = 0.14; sub0 = 180; cHp = 900; cG = 0.42; bG = 0.26; }
      else if (weapon === 'burst' || weapon === 'burst_evo') { f0 = 1050; f1 = 500; type = 'sawtooth'; dur = 0.05; sub0 = 90; cHp = 2200; cG = 0.20; bG = 0.16; }
      else if (weapon === 'beam' || weapon === 'beam_evo') { f0 = 300; f1 = 700; type = 'sawtooth'; dur = 0.22; sub0 = 70; cHp = 700; cG = 0.30; bG = 0.24; }
      const len = Math.floor(this.ctx.sampleRate * 0.05); const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len); const s = this.ctx.createBufferSource(); s.buffer = b; const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = cHp; const ng = this.ctx.createGain(); ng.gain.setValueAtTime(cG, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05); s.connect(hp); hp.connect(ng); ng.connect(this.sfxGain); s.start(t); s.stop(t + 0.06);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (weapon && weapon.indexOf('beam') === 0) o.frequency.linearRampToValueAtTime(f1, t + dur); else o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(bG, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + dur + 0.02);
      const sub = this.ctx.createOscillator(), sg = this.ctx.createGain(); sub.type = 'sine'; sub.frequency.setValueAtTime(sub0, t); sub.frequency.exponentialRampToValueAtTime(50, t + 0.08); sg.gain.setValueAtTime(0.18, t); sg.gain.exponentialRampToValueAtTime(0.001, t + 0.09); sub.connect(sg); sg.connect(this.sfxGain); sub.start(t); sub.stop(t + 0.1);
    },
    hitMonster() { this._blip(300, 0.05, 'square', 0.08, 180); },
    kill(boss) { if (boss) { this._blip(160, 0.5, 'sawtooth', 0.3, 40); this._noise(0.6, 0.35, 800); } else { this._blip(200, 0.14, 'square', 0.18, 80); this._noise(0.12, 0.15, 900); } },
    playerHit() { this._blip(180, 0.18, 'sawtooth', 0.22, 70); this._noise(0.1, 0.12, 500); },
    explosion() { this._noise(0.4, 0.45, 700); this._blip(90, 0.4, 'sawtooth', 0.28, 28); this._noise(0.2, 0.2, 2600, 'highpass'); },
    ability(k) { if (k === 'bullettime') this._blip(700, 0.6, 'sine', 0.25, 180); else if (k === 'dash') { this._blip(520, 0.14, 'sine', 0.18, 1100); this._noise(0.12, 0.12, 3000, 'highpass'); } else if (k === 'barrier') this._blip(300, 0.25, 'sine', 0.2, 500); else if (k === 'grenade') this._blip(400, 0.1, 'square', 0.15, 200); else if (k === 'rift') this._blip(200, 0.4, 'sawtooth', 0.2, 600); else this._blip(600, 0.12, 'square', 0.15); },
    xp() { this._blip(1200, 0.05, 'sine', 0.08, 1600); },
    item(rare) { if (rare) { [660, 880, 1170, 1560].forEach((f, i) => setTimeout(() => this._blip(f, 0.14, 'triangle', 0.22), i * 55)); } else { this._blip(720, 0.12, 'sine', 0.2, 1080); } },
    weapon() { [523, 784, 1046].forEach((f, i) => setTimeout(() => this._blip(f, 0.13, 'square', 0.22, f * 1.2), i * 55)); this._blip(160, 0.2, 'sawtooth', 0.2, 60); },
    evo() { [523, 659, 880, 1174, 1568].forEach((f, i) => setTimeout(() => this._blip(f, 0.16, 'triangle', 0.25, f * 1.3), i * 70)); this._noise(0.5, 0.2, 3000, 'highpass'); },
    // v1.70 — JINGLE DEL LIVELLO. Un arpeggio maggiore che sale (do-mi-sol-do) con la fondamentale
    // tenuta sotto: e' un traguardo, non un effetto, quindi deve suonare come una frase e non come un
    // colpo. Piu' lento e piu' pieno di quello dell'evoluzione, che e' un lampo.
    levelUp() {
      if (!this.sfxOn) return; this.resume(); if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [[523.25, 0], [659.25, 0.09], [783.99, 0.18], [1046.5, 0.27]].forEach(([f, d]) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(f, t + d);
        g.gain.setValueAtTime(0.0001, t + d);
        g.gain.exponentialRampToValueAtTime(0.30, t + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.55);
        o.connect(g); g.connect(this.sfxGain); o.start(t + d); o.stop(t + d + 0.6);
      });
      // fondamentale tenuta sotto: da' corpo all'accordo senza coprire l'arpeggio
      const b = this.ctx.createOscillator(), bg = this.ctx.createGain();
      b.type = 'sine'; b.frequency.setValueAtTime(130.81, t);
      bg.gain.setValueAtTime(0.0001, t); bg.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
      b.connect(bg); bg.connect(this.sfxGain); b.start(t); b.stop(t + 1);
      this._noise(0.7, 0.10, 4200, 'highpass');
    },
    boon() { [440, 660, 990].forEach((f, i) => setTimeout(() => this._blip(f, 0.16, 'triangle', 0.24, f * 1.2), i * 80)); },
    crate() { [392, 523, 659].forEach((f, i) => setTimeout(() => this._blip(f, 0.12, 'triangle', 0.22), i * 60)); },
    // v1.71 — BEVUTA. Un tonfo sordo (il tappo) e due note che salgono: si sente che qualcosa e'
    // entrato in circolo, ma resta corto perche' si beve mentre i nemici arrivano.
    drink() {
      this._blip(150, 0.16, 'sine', 0.22, 90);
      this._noise(0.14, 0.09, 900);
      [520, 780].forEach((f, i) => setTimeout(() => this._blip(f, 0.16, 'triangle', 0.17, f * 1.25), 70 + i * 80));
    },
    crateBad() { this._blip(300, 0.25, 'sawtooth', 0.3, 90); this._noise(0.3, 0.25, 700); },
    buy() { this._blip(880, 0.08, 'square', 0.2, 1320); this._blip(440, 0.12, 'sine', 0.14, 660); },
    lifeLost() { this._blip(220, 0.5, 'sawtooth', 0.3, 60); this._noise(0.4, 0.2, 500); },
    wave() { [349, 440].forEach((f, i) => setTimeout(() => this._blip(f, 0.22, 'sawtooth', 0.18, f * 0.7), i * 140)); },
    boss() { this._blip(60, 1.0, 'sawtooth', 0.42, 45); this._noise(1.2, 0.32, 380); },
    gameover() { [330, 262, 196].forEach((f, i) => setTimeout(() => this._blip(f, 0.5, 'triangle', 0.24), i * 300)); },
    victory() { [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._blip(f, 0.3, 'triangle', 0.24), i * 160)); },
    toggleMusic() { this.musicOn = !this.musicOn; if (this.dGain) this.dGain.gain.setTargetAtTime(this.musicOn ? 0.16 : 0, this.ctx.currentTime, 0.3); return this.musicOn; },
  };
  window.GameAudio = A;
})();
