// AudioManager - Studio-grade Procedural & Sampled Web Audio API Sound Engine

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
    this._distortionCurve = null;

    // slice.mp3 audio assets
    this.sliceBuffer = null;
    this.isSliceLoading = false;
    this.sliceAudioElement = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus (calibrated at 1.0 for punchy tactile impact)
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isSoundEnabled ? 1.0 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music / Ambient bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.isMusicEnabled ? 0.35 : 0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Preload slice.mp3 immediately
      this.loadSliceAudio();
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
    if (!this.sliceBuffer && !this.isSliceLoading) {
      this.loadSliceAudio();
    }
  }

  // Preload and decode user's slice.mp3 file
  loadSliceAudio() {
    if (this.sliceBuffer || this.isSliceLoading) return;
    this.isSliceLoading = true;

    const rawBase = import.meta.env.BASE_URL || '/';
    const base = rawBase.endsWith('/') ? rawBase : rawBase + '/';
    const sliceUrl = `${base}assets/sound/slice.mp3`;

    // HTML5 Audio element backup
    try {
      if (!this.sliceAudioElement) {
        this.sliceAudioElement = new Audio(sliceUrl);
        this.sliceAudioElement.preload = 'auto';
      }
    } catch (e) {
      // Ignored in non-browser envs
    }

    if (!this.ctx) {
      this.init();
    }

    fetch(sliceUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (this.ctx) {
          return this.ctx.decodeAudioData(arrayBuffer);
        }
        throw new Error('AudioContext not ready');
      })
      .then((decoded) => {
        this.sliceBuffer = decoded;
        this.isSliceLoading = false;
      })
      .catch((err) => {
        console.warn('slice.mp3 preload/decode note:', err);
        this.isSliceLoading = false;
      });
  }

  getDistortionCurve(amount = 35) {
    if (this._distortionCurve) return this._distortionCurve;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    this._distortionCurve = curve;
    return curve;
  }

  setSoundEnabled(enabled) {
    this.isSoundEnabled = enabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(enabled ? 1.0 : 0, this.ctx.currentTime, 0.05);
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
    if (!this.isSoundEnabled) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  // Blade swoosh sound on fast swipe
  playWhoosh(velocity = 1) {
    if (!this.isSoundEnabled) return;
    const now = performance.now();
    if (now - this.lastWhooshTime < 140) return; // rate limit whooshes
    this.lastWhooshTime = now;
    this.resume();
    if (!this.ctx) return;

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
    gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.125);
  }

  // Slice sound cutting fruit using slice.mp3 (with zero-latency Web Audio API & fallback)
  playSlice(fruitType = 'default') {
    if (!this.isSoundEnabled) return;
    this.resume();

    // 1. Play user's slice.mp3 through Web Audio API buffer (Zero latency, full polyphony)
    if (this.ctx && this.sliceBuffer) {
      try {
        const t = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = this.sliceBuffer;

        // Subtle organic pitch variation (0.95x - 1.05x) so consecutive cuts sound natural
        const pitch = 0.95 + Math.random() * 0.10;
        source.playbackRate.setValueAtTime(pitch, t);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(1.0, t);

        source.connect(gainNode);
        gainNode.connect(this.sfxGain);

        source.start(t);
        return;
      } catch (e) {
        console.warn('Error playing sliceBuffer:', e);
      }
    }

    // 2. Play using HTMLAudioElement backup if buffer not yet decoded
    if (this.sliceAudioElement) {
      try {
        const soundClone = this.sliceAudioElement.cloneNode();
        soundClone.volume = this.isSoundEnabled ? 0.95 : 0;
        soundClone.play().catch(() => {});
        return;
      } catch (e) {
        // Fall through to procedural synthesis
      }
    }

    // Trigger loading if not yet loaded
    if (!this.isSliceLoading) {
      this.loadSliceAudio();
    }

    // 3. Fallback procedural synthesis if audio file hasn't finished loading yet
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Razor blade cut transient
    const bladeOsc = this.ctx.createOscillator();
    const bladeGain = this.ctx.createGain();
    bladeOsc.type = 'triangle';
    bladeOsc.frequency.setValueAtTime(2400, t);
    bladeOsc.frequency.exponentialRampToValueAtTime(240, t + 0.055);
    bladeGain.gain.setValueAtTime(0.7, t);
    bladeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    bladeOsc.connect(bladeGain);
    bladeGain.connect(this.sfxGain);
    bladeOsc.start(t);
    bladeOsc.stop(t + 0.065);

    // Razor edge friction hiss / air slice
    const frictionLen = Math.floor(this.ctx.sampleRate * 0.06);
    const frictionBuf = this.ctx.createBuffer(1, frictionLen, this.ctx.sampleRate);
    const frictionData = frictionBuf.getChannelData(0);
    for (let i = 0; i < frictionLen; i++) {
      frictionData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (frictionLen * 0.3));
    }
    const frictionNoise = this.ctx.createBufferSource();
    frictionNoise.buffer = frictionBuf;
    const frictionFilter = this.ctx.createBiquadFilter();
    frictionFilter.type = 'highpass';
    frictionFilter.frequency.setValueAtTime(3400, t);
    frictionFilter.frequency.exponentialRampToValueAtTime(1400, t + 0.055);
    const frictionGain = this.ctx.createGain();
    frictionGain.gain.setValueAtTime(0.65, t);
    frictionGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    frictionNoise.connect(frictionFilter);
    frictionFilter.connect(frictionGain);
    frictionGain.connect(this.sfxGain);
    frictionNoise.start(t);
    frictionNoise.stop(t + 0.065);

    // Meaty flesh cleavage thud
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'sine';
    const startThud = fruitType === 'watermelon' ? 240 : fruitType === 'apple' ? 320 : 280;
    thudOsc.frequency.setValueAtTime(startThud, t);
    thudOsc.frequency.exponentialRampToValueAtTime(60, t + 0.045);
    thudGain.gain.setValueAtTime(0.6, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    thudOsc.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thudOsc.start(t);
    thudOsc.stop(t + 0.055);

    // Juicy organic flesh squish
    const squishDuration = fruitType === 'watermelon' ? 0.16 : fruitType === 'apple' ? 0.09 : 0.12;
    const squishSize = Math.floor(this.ctx.sampleRate * squishDuration);
    const squishBuffer = this.ctx.createBuffer(1, squishSize, this.ctx.sampleRate);
    const squishData = squishBuffer.getChannelData(0);
    for (let i = 0; i < squishSize; i++) {
      squishData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (squishSize * 0.35));
    }
    const squishNoise = this.ctx.createBufferSource();
    squishNoise.buffer = squishBuffer;
    const squishFilter = this.ctx.createBiquadFilter();
    squishFilter.type = 'bandpass';
    squishFilter.Q.value = 3.2;
    const cutoff = fruitType === 'watermelon' ? 1100 : fruitType === 'kiwi' ? 1900 : fruitType === 'apple' ? 2400 : 1600;
    squishFilter.frequency.setValueAtTime(cutoff, t);
    squishFilter.frequency.exponentialRampToValueAtTime(260, t + squishDuration * 0.9);
    const squishGain = this.ctx.createGain();
    squishGain.gain.setValueAtTime(0.8, t);
    squishGain.gain.exponentialRampToValueAtTime(0.001, t + squishDuration);
    squishNoise.connect(squishFilter);
    squishFilter.connect(squishGain);
    squishGain.connect(this.sfxGain);
    squishNoise.start(t);
    squishNoise.stop(t + squishDuration + 0.01);
  }

  // Perfect slice: resonant crystalline chime
  playPerfect() {
    if (!this.isSoundEnabled) return;
    this.resume();
    if (!this.ctx) return;

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
    if (!this.isSoundEnabled) return;
    this.resume();
    if (!this.ctx) return;

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

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  // Heavy cinematic bomb detonation blast
  playBomb() {
    if (!this.isSoundEnabled) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Detonation transient shockwave (ear-splitting distorted crack)
    const shockSize = Math.floor(this.ctx.sampleRate * 0.12);
    const shockBuffer = this.ctx.createBuffer(1, shockSize, this.ctx.sampleRate);
    const shockData = shockBuffer.getChannelData(0);
    for (let i = 0; i < shockSize; i++) {
      shockData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (shockSize * 0.18));
    }
    const shockNoise = this.ctx.createBufferSource();
    shockNoise.buffer = shockBuffer;

    // Distortion saturation for intense violent blast
    const distortion = this.ctx.createWaveShaper();
    distortion.curve = this.getDistortionCurve(35);
    distortion.oversample = '2x';

    const shockFilter = this.ctx.createBiquadFilter();
    shockFilter.type = 'bandpass';
    shockFilter.frequency.setValueAtTime(2200, t);
    shockFilter.frequency.exponentialRampToValueAtTime(300, t + 0.11);
    shockFilter.Q.value = 2.0;

    const shockGain = this.ctx.createGain();
    shockGain.gain.setValueAtTime(1.2, t);
    shockGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    shockNoise.connect(distortion);
    distortion.connect(shockFilter);
    shockFilter.connect(shockGain);
    shockGain.connect(this.sfxGain);

    shockNoise.start(t);
    shockNoise.stop(t + 0.13);

    // 2. High-impact gunpowder ignition snap (instant percussion)
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(450, t);
    snapOsc.frequency.exponentialRampToValueAtTime(60, t + 0.035);
    snapGain.gain.setValueAtTime(0.8, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    snapOsc.connect(snapGain);
    snapGain.connect(this.sfxGain);
    snapOsc.start(t);
    snapOsc.stop(t + 0.045);

    // 3. Deep concussive sub-bass drop (chest thumping shockwave)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(220, t);
    subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.65);

    subGain.gain.setValueAtTime(1.3, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.78);

    // 4. Mid-range saturation punch (critical for mobile phone speakers!)
    const midOsc = this.ctx.createOscillator();
    const midGain = this.ctx.createGain();
    midOsc.type = 'triangle';
    midOsc.frequency.setValueAtTime(160, t);
    midOsc.frequency.exponentialRampToValueAtTime(45, t + 0.45);

    midGain.gain.setValueAtTime(0.9, t);
    midGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    midOsc.connect(midGain);
    midGain.connect(this.sfxGain);
    midOsc.start(t);
    midOsc.stop(t + 0.52);

    // 5. Fireball roar & burning debris rumble tail
    const roarDuration = 0.95;
    const roarSize = Math.floor(this.ctx.sampleRate * roarDuration);
    const roarBuffer = this.ctx.createBuffer(1, roarSize, this.ctx.sampleRate);
    const roarData = roarBuffer.getChannelData(0);
    for (let i = 0; i < roarSize; i++) {
      // Noise with random crackling spikes in the tail
      const env = Math.exp(-i / (roarSize * 0.28));
      const crackle = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 1.5 : 0;
      roarData[i] = ((Math.random() * 2 - 1) * 0.8 + crackle) * env;
    }

    const roarNoise = this.ctx.createBufferSource();
    roarNoise.buffer = roarBuffer;

    const roarFilter = this.ctx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(1600, t);
    roarFilter.frequency.exponentialRampToValueAtTime(50, t + roarDuration * 0.85);

    const roarGain = this.ctx.createGain();
    roarGain.gain.setValueAtTime(1.0, t);
    roarGain.gain.exponentialRampToValueAtTime(0.001, t + roarDuration);

    roarNoise.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(this.sfxGain);

    roarNoise.start(t);
    roarNoise.stop(t + roarDuration + 0.05);
  }

  // Game over sound
  playGameOver() {
    if (!this.isSoundEnabled) return;
    this.resume();
    if (!this.ctx) return;

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
    if (!this.isSoundEnabled) return;
    this.resume();
    if (!this.ctx) return;

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
audioManager.loadSliceAudio();
export default audioManager;
