// GameEngine.js - 60 FPS Canvas Game Engine with Independent Loop

import { Fruit, FRUIT_TYPES } from './Fruit.js';
import { Bomb } from './Bomb.js';
import { SliceSystem } from './SliceSystem.js';
import { CollisionSystem } from './CollisionSystem.js';
import { ParticleSystem } from './ParticleSystem.js';
import { SplashSystem } from './SplashSystem.js';
import { GRAVITY } from './Physics.js';
import audioManager from './AudioManager.js';
import hapticManager from './HapticManager.js';
import assetManager from './AssetManager.js';

export const GAME_MODES = {
  CLASSIC: 'CLASSIC',
  ARCADE: 'ARCADE',
  ZEN: 'ZEN'
};

export class GameEngine {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.callbacks = callbacks; // { onScoreUpdate, onGameOver, onLifeLost }

    // Dimensions
    this.width = 390;
    this.height = 844;
    this.dpr = window.devicePixelRatio || 1;

    // Subsystems
    this.sliceSystem = new SliceSystem();
    this.collisionSystem = new CollisionSystem();
    this.particleSystem = new ParticleSystem();
    this.splashSystem = new SplashSystem();

    // Entities
    this.fruits = [];
    this.bombs = [];
    this.ambientParticles = [];

    // Game state
    this.mode = GAME_MODES.CLASSIC;
    this.isRunning = false;
    this.isPaused = false;
    this.score = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.timeLeft = 60; // For Arcade (60s) or Zen (90s)
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.fruitsSliced = 0;
    this.gameTime = 0;

    // Spawning wave timer
    this.spawnTimer = 0;
    this.waveInterval = 2.4; // seconds between launches
    this.difficulty = 1;

    // Visual FX
    this.screenShake = 0;
    this.screenFlash = 0; // 0 to 1
    this.screenFlashColor = 'rgba(255, 59, 48, 0.4)';
    this.bombPulse = 0; // 0 to 1: temporary red ambient wash overriding cyan upon bomb detonation
    this.settings = {
      sound: true,
      music: true,
      particles: true,
      haptics: true,
      screenShake: true
    };

    // Performance timing
    this.lastTime = performance.now();
    this.rafId = null;

    // Bound loop
    this.loop = this.loop.bind(this);

    // Initialize atmospheric floating background neon dust motes
    this.initAmbientParticles();
  }

  initAmbientParticles() {
    this.ambientParticles = [];
    for (let i = 0; i < 22; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 12,
        speedY: -Math.random() * 18 - 8,
        alpha: Math.random() * 0.28 + 0.08,
        color: i % 3 === 0 ? '#00F5FF' : (i % 3 === 1 ? '#7C3AED' : '#FFFFFF')
      });
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5); // Cap DPR at 2.5 for mobile GPU efficiency

    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    this.ctx.scale(this.dpr, this.dpr);
  }

  applySettings(settings) {
    this.settings = { ...this.settings, ...settings };
    audioManager.setSoundEnabled(this.settings.sound);
    audioManager.setMusicEnabled(this.settings.music);
    hapticManager.setEnabled(this.settings.haptics);
    this.particleSystem.setEnabled(this.settings.particles);
  }

  start(mode = GAME_MODES.CLASSIC) {
    this.mode = mode;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.fruitsSliced = 0;
    this.gameTime = 0;
    this.spawnTimer = 0.5; // Quick first spawn
    this.difficulty = 1;
    this.lastProgressionTier = 0;
    this.lastBombTier = 0;
    this.screenShake = 0;
    this.screenFlash = 0;

    if (mode === GAME_MODES.CLASSIC) {
      this.lives = 3;
      this.maxLives = 3;
      this.timeLeft = 0;
    } else if (mode === GAME_MODES.ARCADE) {
      this.lives = 0;
      this.timeLeft = 60;
    } else if (mode === GAME_MODES.ZEN) {
      this.lives = 0;
      this.timeLeft = 90;
    }

    this.fruits = [];
    this.bombs = [];
    this.particleSystem.clear();
    this.splashSystem.clear();
    this.sliceSystem.clear();

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    audioManager.startAmbientMusic();

    this.notifyHUD();

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.rafId = requestAnimationFrame(this.loop);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.isRunning = true;
    this.lastTime = performance.now();
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    audioManager.stopAmbientMusic();
  }

  // Pointer / Touch Event Routing
  handleTouchStart(x, y) {
    audioManager.resume();
    if (!this.isRunning || this.isPaused) return;
    this.sliceSystem.startStroke(x, y);
  }

  handleTouchMove(x, y) {
    if (!this.isRunning || this.isPaused) return;
    this.sliceSystem.addPoint(x, y);
  }

  handleTouchEnd() {
    this.sliceSystem.endStroke();
  }

  triggerScreenShake(intensity = 1.0) {
    if (this.settings.screenShake) {
      this.screenShake = Math.max(this.screenShake, intensity);
    }
  }

  triggerFlash(color = 'rgba(255, 59, 48, 0.45)') {
    this.screenFlash = 0.85;
    this.screenFlashColor = color;
  }

  // Exact progression logic:
  // Starting speed: 100%, Starting fruit amount: 100%
  // Every 300 points:
  // - Speed increases by 10%, stops at +50% max (150% from 1500+ pts)
  // - Fruit spawn amount increases by 5%, stops at +15% max (115% from 900+ pts)
  // Bomb progression:
  // - After 500 points: Number of bombs increases by 3% till it reaches 6% max (at 1000+ pts)
  getProgression() {
    const tiers = Math.floor(Math.max(0, this.score) / 300);
    const speedMultiplier = Math.min(1.50, 1.00 + tiers * 0.10);
    const fruitAmountMultiplier = Math.min(1.15, 1.00 + tiers * 0.05);

    // Bomb progression logic (after 500 points: +3% till it reaches 6% max)
    let bombTier = 0;
    let bombIncrease = 0;
    if (this.score >= 1000) {
      bombTier = 2;
      bombIncrease = 0.06; // 6% maximum
    } else if (this.score >= 500) {
      bombTier = 1;
      bombIncrease = 0.03; // 3%
    }
    const bombAmountMultiplier = 1.00 + bombIncrease;

    return {
      tiers,
      speedMultiplier,
      fruitAmountMultiplier,
      speedPercent: Math.round(speedMultiplier * 100),
      fruitPercent: Math.round(fruitAmountMultiplier * 100),
      bombTier,
      bombIncrease,
      bombAmountMultiplier,
      bombPercent: Math.round(bombAmountMultiplier * 100),
      bombIncreasePercent: Math.round(bombIncrease * 100)
    };
  }

  // Spawn a wave of fruits and possible bomb
  spawnWave() {
    const { fruitAmountMultiplier, bombIncrease } = this.getProgression();
    const fruitKeys = Object.keys(FRUIT_TYPES);

    // Starting fruit count: 100% (average 2.0 fruits).
    // Scales by fruitAmountMultiplier (+5% per 300 pts, capping at +15% / 115% at 900+ pts)
    const baseCount = (Math.random() * 1.8 + 1.1) * fruitAmountMultiplier;
    const count = Math.min(5, Math.max(1, Math.round(baseCount)));

    for (let i = 0; i < count; i++) {
      const type = fruitKeys[Math.floor(Math.random() * fruitKeys.length)];
      // Spawn near bottom spread across 70% of screen width
      const margin = this.width * 0.15;
      const x = margin + Math.random() * (this.width - margin * 2);
      const y = this.height + 25;

      // Arc towards opposite or center
      const targetX = this.width * 0.5 + (Math.random() - 0.5) * (this.width * 0.6);
      const targetPeakY = this.height * (0.16 + Math.random() * 0.28); // Reach top 16%-44% of screen

      // Calculate ballistic launch velocity
      const peakDist = y - targetPeakY;
      const vy = -Math.sqrt(2 * GRAVITY * Math.max(100, peakDist));
      const timeToPeak = -vy / GRAVITY;
      const vx = (targetX - x) / (timeToPeak * 1.5) + (Math.random() - 0.5) * 40;

      this.fruits.push(new Fruit(type, x, y, vx, vy));
    }

    // Bomb spawn logic
    if (this.mode === GAME_MODES.CLASSIC || this.mode === GAME_MODES.ARCADE) {
      const baseBombChance = this.mode === GAME_MODES.CLASSIC ? 0.22 : 0.28;
      // After 500 points, spawn rate increases by 3% till it reaches 6%
      const effectiveBombChance = baseBombChance + bombIncrease;

      if (Math.random() < effectiveBombChance && this.gameTime > 3) {
        const x = this.width * 0.25 + Math.random() * (this.width * 0.5);
        const y = this.height + 30;
        const targetPeakY = this.height * (0.24 + Math.random() * 0.25);
        const vy = -Math.sqrt(2 * GRAVITY * (y - targetPeakY));
        const vx = (Math.random() - 0.5) * 80;
        this.bombs.push(new Bomb(x, y, vx, vy));

        // After 500 points, chance to spawn multiple simultaneous bombs increases by 3% up to 6%
        if (bombIncrease > 0 && Math.random() < bombIncrease) {
          const x2 = this.width * 0.2 + Math.random() * (this.width * 0.6);
          const y2 = this.height + 35;
          const targetPeakY2 = this.height * (0.28 + Math.random() * 0.22);
          const vy2 = -Math.sqrt(2 * GRAVITY * (y2 - targetPeakY2));
          const vx2 = (Math.random() - 0.5) * 90;
          this.bombs.push(new Bomb(x2, y2, vx2, vy2));
        }
      }
    }
  }

  // Frame update
  update(dt) {
    this.gameTime += dt;
    const {
      speedMultiplier,
      fruitAmountMultiplier,
      tiers,
      speedPercent,
      fruitPercent,
      bombTier,
      bombIncrease,
      bombIncreasePercent
    } = this.getProgression();

    // Progression tier upgrade check (e.g. on passing 300, 600, 900, 1200, 1500)
    if (tiers > this.lastProgressionTier) {
      this.lastProgressionTier = tiers;
      audioManager.playLevelUp();
      hapticManager.medium();
      this.triggerFlash('rgba(255, 184, 0, 0.25)');
    }

    // Bomb progression tier upgrade check (after 500 pts: +3%, then reaches 6% max)
    if (bombTier > this.lastBombTier) {
      this.lastBombTier = bombTier;
      audioManager.playLevelUp();
      hapticManager.heavy();
      this.triggerFlash('rgba(255, 59, 48, 0.35)');
    }

    // Mode timer for Arcade / Zen
    if (this.mode === GAME_MODES.ARCADE || this.mode === GAME_MODES.ZEN) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.gameOver();
        return;
      }
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 3.5);
    }
    // Screen flash decay
    if (this.screenFlash > 0) {
      this.screenFlash = Math.max(0, this.screenFlash - dt * 3.0);
    }

    // Combo timer
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.notifyHUD();
      }
    }

    // Wave spawning cadence dynamically scales with speedMultiplier
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnWave();
      const baseInterval = 2.3 + (Math.random() - 0.5) * 0.4;
      this.spawnTimer = Math.max(1.1, baseInterval / speedMultiplier);
    }

    // Effective physics dt: applies exact speedMultiplier (100% to 150%)
    const effectiveDt = dt * speedMultiplier;

    // Update slice trail
    this.sliceSystem.update();

    // Check collisions
    const segments = this.sliceSystem.getActiveSegments();
    const { slicedFruits, hitBombs } = this.collisionSystem.checkCollisions(
      segments,
      this.fruits,
      this.bombs
    );

    // Process Sliced Fruits
    if (slicedFruits.length > 0) {
      let waveSlicePoints = 0;
      let multiCutBonus = slicedFruits.length > 1;

      for (let i = 0; i < slicedFruits.length; i++) {
        const { fruit, cutAngle, cutPoint } = slicedFruits[i];
        fruit.slice(cutAngle);
        this.fruitsSliced++;

        // Base points
        waveSlicePoints += fruit.config.points;

        // Juice splatter on wood background
        this.splashSystem.addSplash(
          cutPoint.x,
          cutPoint.y,
          cutAngle,
          fruit.config.juiceColor,
          fruit.config.pulpColor
        );

        // Airborne juice and pulp particles
        this.particleSystem.spawnSliceJuice(
          cutPoint.x,
          cutPoint.y,
          cutAngle,
          fruit.config.juiceColor,
          fruit.config.pulpColor,
          14
        );
      }

      // Combo handling
      this.combo += slicedFruits.length;
      this.comboTimer = 0.42; // Window for extending combo
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      // Bonus points for combo
      let bonus = 0;
      if (this.combo >= 2) {
        bonus = (this.combo - 1) * 10;
        waveSlicePoints += bonus;
      }

      this.score += waveSlicePoints;

      // Check for immediate progression tier upgrade upon scoring
      const progression = this.getProgression();
      if (progression.tiers > this.lastProgressionTier) {
        this.lastProgressionTier = progression.tiers;
        audioManager.playLevelUp();
        hapticManager.medium();
        this.triggerFlash('rgba(255, 184, 0, 0.3)');
      }

      // Check for immediate bomb tier upgrade upon scoring (after 500 pts: +3%, at 1000 pts: +6% max)
      if (progression.bombTier > this.lastBombTier) {
        this.lastBombTier = progression.bombTier;
        audioManager.playLevelUp();
        hapticManager.heavy();
        this.triggerFlash('rgba(255, 59, 48, 0.35)');
      }

      // Always play visceral slice sound for each sliced fruit
      for (let i = 0; i < slicedFruits.length; i++) {
        const fruitType = slicedFruits[i].fruit.type;
        if (i === 0) {
          audioManager.playSlice(fruitType);
        } else {
          setTimeout(() => {
            audioManager.playSlice(fruitType);
          }, i * 25);
        }
      }

      // Perfect Slice check for clean centered hit
      if (slicedFruits.length === 1) {
        const { fruit, cutPoint } = slicedFruits[0];
        const distFromCenter = Math.hypot(cutPoint.x - fruit.x, cutPoint.y - fruit.y);
        if (distFromCenter < fruit.radius * 0.22) {
          this.particleSystem.spawnPerfectSlice(cutPoint.x, cutPoint.y);
          this.triggerFlash('rgba(0, 245, 255, 0.22)');
          waveSlicePoints += 5;
        }
      }

      // Sound & Haptics based on combo level
      if (this.combo >= 2) {
        audioManager.playCombo(this.combo);
        hapticManager.medium();
        const center = slicedFruits[0].cutPoint;
        this.particleSystem.spawnText(
          center.x,
          center.y - 20,
          `${this.combo} COMBO +${waveSlicePoints}`,
          '#00F5FF',
          true,
          this.combo
        );
      } else {
        hapticManager.light();
        const center = slicedFruits[0].cutPoint;
        this.particleSystem.spawnText(center.x, center.y - 10, `+${waveSlicePoints}`, '#FFFFFF', false);
      }

      if (multiCutBonus) {
        this.triggerScreenShake(0.35);
      }

      this.notifyHUD();
    }

    // Process Hit Bombs
    if (hitBombs.length > 0) {
      for (let b = 0; b < hitBombs.length; b++) {
        const { bomb, cutPoint } = hitBombs[b];
        bomb.detonate();

        // Bomb visual & audio explosion
        this.particleSystem.spawnBombBlast(cutPoint.x, cutPoint.y);
        audioManager.playBomb();
        hapticManager.heavy();
        this.triggerScreenShake(1.2);
        this.triggerFlash('rgba(255, 59, 48, 0.65)');
        this.bombPulse = 1.0; // Override cyan ambient lighting with red pulse

        // Combo reset
        this.combo = 0;

        if (this.mode === GAME_MODES.CLASSIC) {
          this.loseLife();
        } else if (this.mode === GAME_MODES.ARCADE) {
          // Penalty in arcade mode
          this.score = Math.max(0, this.score - 15);
          this.particleSystem.spawnText(cutPoint.x, cutPoint.y - 20, '-15 BOMB!', '#FF3B30', true);
          this.notifyHUD();
        }
      }
    }

    // Update Fruits & check for missed fruits (with effectiveDt for exact speed scaling)
    for (let i = 0; i < this.fruits.length; i++) {
      const fruit = this.fruits[i];
      fruit.update(effectiveDt, this.height);

      if (fruit.missed && this.mode === GAME_MODES.CLASSIC) {
        fruit.missed = false; // consume missed event
        this.loseLife();
      }
    }
    // Remove inactive fruits
    this.fruits = this.fruits.filter(f => f.active);

    // Update Bombs (with effectiveDt for exact speed scaling)
    for (let i = 0; i < this.bombs.length; i++) {
      this.bombs[i].update(effectiveDt, this.height, this.particleSystem);
    }
    this.bombs = this.bombs.filter(b => b.active);

    // Update Splash & Particle Systems
    this.splashSystem.update(dt);
    this.particleSystem.update(dt);

    // Update Ambient Dust
    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      p.x += p.speedX * dt;
      p.y += p.speedY * dt;
      if (p.y < -10) {
        p.y = this.height + 10;
        p.x = Math.random() * this.width;
      }
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
    }

    // Decay bomb pulse smoothly over ~1.2s back to ambient cyan theme
    if (this.bombPulse > 0) {
      this.bombPulse = Math.max(0, this.bombPulse - dt * 0.85);
    }
  }

  loseLife() {
    this.lives--;
    this.combo = 0;
    hapticManager.heavy();
    this.triggerScreenShake(0.6);
    this.triggerFlash('rgba(255, 59, 48, 0.4)');

    if (this.callbacks.onLifeLost) {
      this.callbacks.onLifeLost(this.lives);
    }

    this.notifyHUD();

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.isRunning = false;
    audioManager.playGameOver();
    audioManager.stopAmbientMusic();

    if (this.callbacks.onGameOver) {
      const {
        speedPercent,
        fruitPercent,
        tiers,
        bombPercent,
        bombIncreasePercent,
        bombTier
      } = this.getProgression();

      this.callbacks.onGameOver({
        score: this.score,
        maxCombo: this.maxCombo,
        fruitsSliced: this.fruitsSliced,
        mode: this.mode,
        speedPercent,
        fruitPercent,
        tier: tiers,
        bombPercent,
        bombIncreasePercent,
        bombTier
      });
    }
  }

  notifyHUD() {
    if (this.callbacks.onScoreUpdate) {
      const {
        speedMultiplier,
        fruitAmountMultiplier,
        speedPercent,
        fruitPercent,
        tiers,
        bombPercent,
        bombIncreasePercent,
        bombTier
      } = this.getProgression();

      this.callbacks.onScoreUpdate({
        score: this.score,
        combo: this.combo,
        lives: this.lives,
        timeLeft: Math.ceil(this.timeLeft),
        maxCombo: this.maxCombo,
        fruitsSliced: this.fruitsSliced,
        speedMultiplier,
        fruitAmountMultiplier,
        speedPercent,
        fruitPercent,
        tier: tiers,
        bombPercent,
        bombIncreasePercent,
        bombTier
      });
    }
  }

  // Render frame
  draw() {
    const ctx = this.ctx;
    ctx.save();

    // Apply screen shake if active
    if (this.screenShake > 0) {
      const shakeMag = this.screenShake * 9;
      const ox = (Math.random() - 0.5) * shakeMag;
      const oy = (Math.random() - 0.5) * shakeMag;
      ctx.translate(ox, oy);
    }

    // 1. Background (fnbg.png with cover scaling and fallback)
    const bgImg = assetManager.get('fnbg');
    if (bgImg && bgImg.complete && bgImg.width > 0) {
      const imgRatio = bgImg.width / bgImg.height;
      const canvasRatio = this.width / this.height;
      let dw = this.width;
      let dh = this.height;
      let dx = 0;
      let dy = 0;
      if (canvasRatio > imgRatio) {
        dh = this.width / imgRatio;
        dy = (this.height - dh) / 2;
      } else {
        dw = this.height * imgRatio;
        dx = (this.width - dw) / 2;
      }
      ctx.drawImage(bgImg, dx, dy, dw, dh);

      // Subtle cinematic dark vignette overlay for high contrast
      const overlay = ctx.createLinearGradient(0, 0, 0, this.height);
      overlay.addColorStop(0, 'rgba(5, 6, 8, 0.35)');
      overlay.addColorStop(0.5, 'rgba(5, 6, 8, 0.12)');
      overlay.addColorStop(1, 'rgba(5, 6, 8, 0.50)');
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      bgGrad.addColorStop(0, '#24140B');
      bgGrad.addColorStop(0.5, '#1A0E07');
      bgGrad.addColorStop(1, '#0F0905');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-20, -20, this.width + 40, this.height + 40);
    }

    // 1.2. Dynamic Ambient Neon Lighting Layer over the Wood Board
    const t = this.gameTime;
    const breathe = 0.9 + 0.1 * Math.sin(t * 1.2);

    // Top-left soft Electric Cyan glow
    const cyanGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, this.width * 0.72 * breathe);
    cyanGlow.addColorStop(0, 'rgba(0, 245, 255, 0.16)');
    cyanGlow.addColorStop(0.5, 'rgba(0, 245, 255, 0.04)');
    cyanGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = cyanGlow;
    ctx.fillRect(0, 0, this.width, this.height);

    // Bottom-right subtle Violet reflection
    const violetGlow = ctx.createRadialGradient(this.width, this.height, 10, this.width, this.height, this.width * 0.68 * breathe);
    violetGlow.addColorStop(0, 'rgba(124, 58, 237, 0.14)');
    violetGlow.addColorStop(0.5, 'rgba(124, 58, 237, 0.03)');
    violetGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = violetGlow;
    ctx.fillRect(0, 0, this.width, this.height);

    // Deep blue perimeter shading / soft ambient shadows
    const blueShadow = ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.5,
      this.width * 0.35,
      this.width * 0.5,
      this.height * 0.5,
      this.width * 0.85
    );
    blueShadow.addColorStop(0, 'transparent');
    blueShadow.addColorStop(0.7, 'rgba(22, 119, 255, 0.05)');
    blueShadow.addColorStop(1, 'rgba(10, 16, 26, 0.42)');
    ctx.fillStyle = blueShadow;
    ctx.fillRect(0, 0, this.width, this.height);

    // Bomb Red Pulse Override: Temporarily overrides cyan lighting upon detonation
    if (this.bombPulse > 0) {
      const redPulse = ctx.createRadialGradient(
        this.width * 0.5,
        this.height * 0.5,
        20,
        this.width * 0.5,
        this.height * 0.5,
        this.width * 0.95
      );
      redPulse.addColorStop(0, `rgba(255, 59, 48, ${0.45 * this.bombPulse})`);
      redPulse.addColorStop(0.7, `rgba(255, 98, 0, ${0.28 * this.bombPulse})`);
      redPulse.addColorStop(1, `rgba(255, 59, 48, ${0.52 * this.bombPulse})`);
      ctx.fillStyle = redPulse;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 1.5. Draw Fruit Juice Splatters on Wood Background
    this.splashSystem.draw(ctx);

    // 2. Ambient neon-lit dust particles
    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      ctx.fillStyle = p.color || '#FFFFFF';
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 3. Draw Fruits & Fruit Halves
    for (let i = 0; i < this.fruits.length; i++) {
      this.fruits[i].draw(ctx);
    }

    // 4. Draw Bombs
    for (let i = 0; i < this.bombs.length; i++) {
      this.bombs[i].draw(ctx);
    }

    // 5. Draw Particles (juice drops, pulp, embers, shockwaves, floating text)
    this.particleSystem.draw(ctx);

    // 6. Draw Tapered Blade Trail with Combo Escalation
    this.sliceSystem.draw(ctx, this.combo);

    // 7. Screen flash overlay
    if (this.screenFlash > 0) {
      ctx.fillStyle = this.screenFlashColor;
      ctx.globalAlpha = this.screenFlash;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  loop(timestamp) {
    if (!this.isRunning) return;

    const dt = Math.min(0.064, (timestamp - this.lastTime) / 1000); // Prevent spiral of death on tab switch
    this.lastTime = timestamp;

    if (!this.isPaused) {
      this.update(dt);
      this.draw();
    }

    this.rafId = requestAnimationFrame(this.loop);
  }
}

export default GameEngine;

