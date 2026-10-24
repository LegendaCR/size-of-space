// A generative ambient drone built from WebAudio oscillators: no audio files.

export class Ambient {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private oscs: OscillatorNode[] = [];
  on = false;

  private build() {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.7;
    filter.connect(master);
    master.connect(ctx.destination);

    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.9;
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    delay.connect(fb).connect(delay);
    delay.connect(master);
    filter.connect(delay);

    // A wide, slowly breathing chord.
    const notes = [55, 82.41, 110, 164.81, 246.94, 329.63];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i % 2 ? 1 : -1) * (3 + i);
      const g = ctx.createGain();
      g.gain.value = 0.06 / (1 + i * 0.4);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + i * 0.017;
      const lg = ctx.createGain();
      lg.gain.value = g.gain.value * 0.8;
      lfo.connect(lg).connect(g.gain);
      o.connect(g).connect(filter);
      o.start();
      lfo.start();
      this.oscs.push(o);
    });

    this.ctx = ctx;
    this.master = master;
    this.filter = filter;
  }

  toggle() {
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    if (ctx.state === 'suspended') void ctx.resume();
    this.on = !this.on;
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(this.on ? 0.5 : 0, ctx.currentTime, 0.8);
    return this.on;
  }

  /** 0..1 progress through the universe: deeper scales sound darker and lower. */
  setDepth(t: number) {
    if (!this.ctx || !this.on) return;
    const now = this.ctx.currentTime;
    this.filter!.frequency.setTargetAtTime(1400 - t * 1000, now, 0.5);
    this.oscs.forEach((o) => o.detune.setTargetAtTime(-t * 500, now, 1.5));
  }
}
