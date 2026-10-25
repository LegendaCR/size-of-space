// A generative soundtrack built entirely with the Web Audio API: no audio files.
// It starts as a quiet pad and, as you travel to larger scales, layers in a
// sub-bass, an arpeggio, a choir, a string swell, timpani and shimmering bells,
// so the music grows with the size of what you're looking at.

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

// D minor-ish progression: Dm9 · Bb · F · C/E, voiced low to high.
const CHORDS = [
  [38, 50, 57, 62, 65, 69, 74],
  [34, 46, 53, 58, 62, 65, 70],
  [41, 48, 57, 60, 65, 69, 72],
  [36, 48, 55, 60, 64, 67, 72],
];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class Ambient {
  private ctx: BaseAudioContext | null = null;
  private master!: GainNode;
  private dry!: GainNode;
  private wet!: GainNode;
  private noise!: AudioBuffer;
  private timer = 0;
  private nextChord = 0;
  private nextStep = 0;
  private chordIndex = 0;
  private step = 0;
  private intensity = 0;
  private target = 0;
  private motion = 0;
  on = false;
  started = false;

  private build(ctx: BaseAudioContext = new AudioContext()) {
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    comp.attack.value = 0.05;
    comp.release.value = 0.4;
    comp.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp);

    this.dry = ctx.createGain();
    this.dry.connect(this.master);

    // Long, dark hall reverb from a synthesised impulse response.
    const conv = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 6);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4;
        d[i] = lp * Math.pow(1 - i / len, 2.6);
      }
    }
    conv.buffer = ir;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.9;
    this.wet.connect(conv).connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = this.noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    this.nextChord = ctx.currentTime + 0.1;
    this.nextStep = ctx.currentTime + 0.5;
    if (ctx instanceof AudioContext) this.timer = window.setInterval(() => this.schedule(), 100);
  }

  /** Route a voice to dry + reverb, with stereo position. */
  private out(node: AudioNode, pan = 0, send = 0.5) {
    const ctx = this.ctx!;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    node.connect(p);
    const d = ctx.createGain();
    d.gain.value = 1 - send * 0.6;
    const w = ctx.createGain();
    w.gain.value = send;
    p.connect(d).connect(this.dry);
    p.connect(w).connect(this.wet);
  }

  private envGain(t: number, attack: number, hold: number, release: number, peak: number) {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    return g;
  }

  // ---------- voices ----------

  private pad(t: number, chord: number[], dur: number, I: number) {
    const ctx = this.ctx!;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 0.6;
    f.frequency.setValueAtTime(350 + 900 * I, t);
    f.frequency.linearRampToValueAtTime(500 + 2600 * I + 600 * this.motion, t + dur * 0.6);
    const g = this.envGain(t, 2.5, dur - 2.5, 3.5, 0.045 + 0.03 * I);
    f.connect(g);
    this.out(g, 0, 0.6);
    chord.slice(1, 5).forEach((n, i) => {
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midi(n);
        o.detune.value = det + i;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 4);
      }
    });
  }

  private sub(t: number, root: number, dur: number, level: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = midi(root);
    const g = this.envGain(t, 1.5, dur - 1.5, 2.5, level);
    o.connect(g);
    this.out(g, 0, 0.15);
    o.start(t);
    o.stop(t + dur + 3);
  }

  private choir(t: number, chord: number[], dur: number, level: number) {
    const ctx = this.ctx!;
    const g = this.envGain(t, 3, dur - 3, 4, level);
    // Two formant filters give a soft "aah".
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.frequency.value = 750; f1.Q.value = 6;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 8;
    f1.connect(g); f2.connect(g);
    this.out(g, 0, 0.85);
    chord.slice(3, 7).forEach((n) => {
      for (const det of [-9, 0, 9]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midi(n);
        o.detune.value = det;
        const vib = ctx.createOscillator();
        vib.frequency.value = 4.5 + Math.random();
        const vg = ctx.createGain();
        vg.gain.value = 6;
        vib.connect(vg).connect(o.detune);
        o.connect(f1); o.connect(f2);
        o.start(t); vib.start(t);
        o.stop(t + dur + 5); vib.stop(t + dur + 5);
      }
    });
  }

  private strings(t: number, chord: number[], dur: number, level: number) {
    const ctx = this.ctx!;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(4500, t + dur * 0.9); // crescendo within the chord
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + dur * 0.85);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 2);
    f.connect(g);
    this.out(g, 0, 0.55);
    [chord[0] + 12, chord[1], chord[2], chord[3], chord[4] + 12].forEach((n, i) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midi(n);
      o.detune.value = (i % 2 ? 5 : -5);
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 2.5);
    });
  }

  private pluck(t: number, note: number, level: number, pan: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = midi(note);
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = midi(note + 12);
    const g = this.envGain(t, 0.005, 0.02, 1.6, level);
    const g2 = this.envGain(t, 0.005, 0.0, 0.5, level * 0.4);
    o.connect(g); o2.connect(g2);
    this.out(g, pan, 0.7);
    this.out(g2, pan, 0.7);
    o.start(t); o2.start(t);
    o.stop(t + 2); o2.stop(t + 1);
  }

  private timpani(t: number, note: number, level: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(midi(note) * 1.5, t);
    o.frequency.exponentialRampToValueAtTime(midi(note), t + 0.12);
    const g = this.envGain(t, 0.004, 0.05, 2.2, level);
    o.connect(g);
    this.out(g, 0, 0.5);
    o.start(t);
    o.stop(t + 2.5);
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const nf = ctx.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = 900;
    const ng = this.envGain(t, 0.002, 0.0, 0.35, level * 0.5);
    n.connect(nf).connect(ng);
    this.out(ng, 0, 0.5);
    n.start(t);
    n.stop(t + 0.5);
  }

  private bell(t: number, note: number, level: number) {
    const ctx = this.ctx!;
    [1, 2.76, 5.4].forEach((m, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = midi(note) * m;
      const g = this.envGain(t, 0.01, 0, 4 - i, level / (1 + i * 2));
      o.connect(g);
      this.out(g, Math.random() * 1.4 - 0.7, 0.9);
      o.start(t);
      o.stop(t + 5);
    });
  }

  // ---------- sequencer ----------

  private schedule(now = this.ctx!.currentTime) {
    if (!this.on) return;
    this.intensity += (this.target - this.intensity) * 0.08;
    this.motion *= 0.9;
    const I = this.intensity;
    const ahead = now + 0.4;

    const chordDur = 9 - 3 * I;
    while (this.nextChord < ahead) {
      const t = this.nextChord;
      const chord = CHORDS[this.chordIndex % CHORDS.length];
      this.pad(t, chord, chordDur, I);
      this.sub(t, chord[0], chordDur, 0.12 * smooth(0.08, 0.35, I));
      const ch = smooth(0.3, 0.55, I);
      if (ch > 0.01) this.choir(t, chord, chordDur, 0.05 * ch);
      const st = smooth(0.5, 0.8, I);
      if (st > 0.01) this.strings(t, chord, chordDur, 0.035 * st + 0.0001);
      const tp = smooth(0.6, 0.85, I);
      if (tp > 0.01) {
        this.timpani(t, chord[0], 0.35 * tp);
        this.timpani(t + chordDur / 2, chord[0], 0.22 * tp);
        if (I > 0.85) this.timpani(t + chordDur * 0.875, chord[0] + 7, 0.18 * tp);
      }
      this.chordIndex++;
      this.nextChord += chordDur;
    }

    const bpm = 64 + 44 * I;
    const stepDur = 60 / bpm / 2;
    while (this.nextStep < ahead) {
      const t = this.nextStep;
      const chord = CHORDS[(this.chordIndex - 1 + CHORDS.length) % CHORDS.length];
      const ar = smooth(0.12, 0.4, I);
      const pattern = [2, 3, 4, 5, 4, 3, 5, 6];
      if (ar > 0.01 && Math.random() < 0.55 + 0.4 * I) {
        const n = chord[pattern[this.step % pattern.length]] + 12;
        this.pluck(t, n, 0.05 * ar, Math.sin(this.step * 0.7) * 0.6);
      }
      const be = smooth(0.75, 1, I);
      if (be > 0.01 && this.step % 8 === 0 && Math.random() < 0.6) {
        this.bell(t, chord[3 + Math.floor(Math.random() * 3)] + 12, 0.04 * be);
      }
      this.step++;
      this.nextStep += stepDur;
    }

    this.master.gain.setTargetAtTime(0.32 + 0.4 * I, now, 1.5);
  }

  start() {
    if (this.started && this.on) return;
    if (!this.ctx) this.build();
    const ctx = this.ctx as AudioContext;
    if (ctx.state === 'suspended') void ctx.resume();
    this.started = true;
    this.on = true;
    this.nextChord = Math.max(this.nextChord, ctx.currentTime + 0.05);
    this.nextStep = Math.max(this.nextStep, ctx.currentTime + 0.05);
  }

  stop() {
    this.on = false;
    if (this.ctx) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.6);
  }

  toggle() {
    if (this.on) this.stop();
    else this.start();
    return this.on;
  }

  /** 0..1 progress through the universe. */
  setDepth(t: number) {
    this.target = t;
  }

  /** Called with scroll speed; briefly opens the pad filter. */
  nudge(v: number) {
    this.motion = Math.min(1, this.motion + v);
  }

  /**
   * Render the soundtrack offline (e.g. for a video): `depthAt(t)` gives the
   * 0..1 progress at each moment, exactly like `setDepth` while browsing.
   */
  static async renderOffline(duration: number, depthAt: (t: number) => number, sampleRate = 48000) {
    const ctx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
    const a = new Ambient();
    a.build(ctx);
    a.on = a.started = true;
    a.intensity = depthAt(0);
    for (let t = 0; t < duration; t += 0.1) {
      a.target = depthAt(t);
      a.schedule(t);
    }
    a.master.gain.setTargetAtTime(0, Math.max(0, duration - 2), 0.5);
    return ctx.startRendering();
  }

  dispose() {
    clearInterval(this.timer);
    if (this.ctx instanceof AudioContext) void this.ctx.close();
  }
}
