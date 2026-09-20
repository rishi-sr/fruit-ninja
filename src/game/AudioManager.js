// AudioManager - Studio-grade Procedural Web Audio API Sound Engine

class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isMusicEnabled = true;
    this.isSoundEnabled = true;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientFilter = null;
    this.ambientLFO = null;
    this.isAmbientPlaying = false;
    this.lastWhooshTime = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isSoundEnabled ? 0.9 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music / Ambient bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.isMusicEnabled ? 0.35 : 0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setSoundEnabled(enabled) {
    this.isSoundEnabled = enabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(enabled ? 0.9 : 0, this.ctx.currentTime, 0.05);
    }
  }

  setMusicEnabled(enabled) {
    this.isMusicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.35 : 0, this.ctx.currentTime, 0.1);
    }
  }

  // Play a short tactile UI click
  playButton() {
    if (!this.isSoundEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  // Blade swoosh sound on fast swipe
  playWhoosh(velocity = 1) {
    if (!this.isSoundEnabled || !this.ctx) return;
    const now = performance.now();
    if (now - this.lastWhooshTime < 140) return; // rate limit whooshes
    this.lastWhooshTime = now;
    this.resume();

    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3.5;
    const startFreq = 400 + Math.min(600, velocity * 150);
    filter.frequency.setValueAtTime(startFreq, t);
    filter.frequency.exponentialRampToValueAtTime(startFreq * 2.2, t + 0.06);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.125);
  }

  // Realistic organic fruit slicing sound
  playSlice(fruitType = 'default') {
    if (!this.isSoundEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;

    // 1. Blade cut transient (high snappy edge)
    const bladeOsc = this.ctx.createOscillator();
    const bladeGain = this.ctx.createGain();
    bladeOsc.type = 'triangle';
    bladeOsc.frequency.setValueAtTime(1400, t);
    bladeOsc.frequency.exponentialRampToValueAtTime(220, t + 0.06);

    bladeGain.gain.setValueAtTime(0.45, t);
    bladeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    bladeOsc.connect(bladeGain);
    bladeGain.connect(this.sfxGain);
    bladeOsc.start(t);
    bladeOsc.stop(t + 0.075);

    // 2. Juicy squish burst (bandpass filtered noise)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoff = fruitType === 'watermelon' ? 1200 : fruitType === 'kiwi' ? 2400 : 1800;
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.14);

    const squishGain = this.ctx.createGain();
    squishGain.gain.setValueAtTime(0.5, t);
    squishGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    noise.connect(filter);
    filter.connect(squishGain);
    squishGain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.15);
  }

  // Perfect slice: resonant crystalline chime
  playPerfect() {
    if (!this.isSoundEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const frequencies = [880, 1320, 1760]; // A5, E6, A6

    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const delay = idx * 0.02;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.setValueAtTime(0.25 / (idx + 1), t + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.5);
    });
  }

  // Combo slice: ascending harmonic chime
  playCombo(comboCount = 2) {
    if (!this.isSoundEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Pentatonic scale degrees: C, D, E, G, A
    const baseFreq = 523.25; // C5
    const scale = [1, 1.122, 1.26, 1.498, 1.682, 2.0, 2.245, 2.52, 2.996];
    const multiplier = scale[Math.min(comboCount - 2, scale.length - 1)] || 1;
    const freq = baseFreq * multiplier;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.1);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  // Heavy bomb detonation
  playBomb() {
    if (!this.isSoundEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;

    // 1. Deep Sub Bass drop
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.5);

    subGain.gain.setValueAtTime(0.9, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.56);

    // 2. Explosion noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.38);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.42);
  }

  // Game over sound
  playGameOver() {
    if (!this.isSoundEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const chord = [329.63, 261.63, 196.0]; // E4, C4, G3 descending

    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const delay = i * 0.12;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, t + delay);
      filter.frequency.exponentialRampToValueAtTime(100, t + delay + 0.8);

      osc.frequency.setValueAtTime(freq, t + delay);
      gain.gain.setValueAtTime(0.2, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.95);
    });
  }

  // Progression / Tier upgrade chime (harmonic ascending chime)
  playLevelUp() {
    if (!this.isSoundEnabled || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.25, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.36);
    });
  }

  // Subtle dark cinematic ambient drone
  startAmbientMusic() {
    if (this.isAmbientPlaying || !this.ctx) return;
    this.resume();

    try {
      const t = this.ctx.currentTime;

      // Filter for dark warmth
      this.ambientFilter = this.ctx.createBiquadFilter();
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setValueAtTime(180, t);

      // Osc 1 - Deep drone
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'triangle';
      this.ambientOsc1.frequency.setValueAtTime(55, t); // A1 note (55 Hz)

      // Osc 2 - Subtle detune
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(55.6, t);

      this.ambientOsc1.connect(this.ambientFilter);
      this.ambientOsc2.connect(this.ambientFilter);
      this.ambientFilter.connect(this.musicGain);

      this.ambientOsc1.start(t);
      this.ambientOsc2.start(t);
      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Ambient music failed to start', e);
    }
  }

  stopAmbientMusic() {
    if (!this.isAmbientPlaying) return;
    try {
      if (this.ambientOsc1) {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
      }
      if (this.ambientOsc2) {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
      }
      this.isAmbientPlaying = false;
    } catch (e) {
      // Ignored
    }
  }
}

export const audioManager = new AudioManager();
export default audioManager;

