// MenuCanvas.jsx - Interactive 60 FPS Home Screen Canvas with Sliceable Fruits, Juice Splatters & Blade Trail

import React, { useRef, useEffect } from 'react';
import { FRUIT_TYPES, FruitPiece } from '../../game/Fruit.js';
import { SliceSystem } from '../../game/SliceSystem.js';
import { ParticleSystem } from '../../game/ParticleSystem.js';
import { SplashSystem } from '../../game/SplashSystem.js';
import { calculateSplitImpulses } from '../../game/Physics.js';
import assetManager from '../../game/AssetManager.js';
import audioManager from '../../game/AudioManager.js';
import hapticManager from '../../game/HapticManager.js';

class MenuFruit {
  constructor(type, xRatio, yRatio, radius, isMainStart = false) {
    this.type = type;
    this.config = FRUIT_TYPES[type];
    this.xRatio = xRatio;
    this.yRatio = yRatio;
    this.radius = radius;
    this.isMainStart = isMainStart;

    this.sliced = false;
    this.pieces = [];
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 1.5;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.respawnTimer = 0;
    this.opacity = 1;
    this.scale = 1;
  }

  update(dt, width, height) {
    this.bobPhase += dt * 2.0;

    if (this.sliced) {
      for (let i = 0; i < this.pieces.length; i++) {
        this.pieces[i].update(dt, height);
      }
      this.pieces = this.pieces.filter(p => p.active);

      if (!this.isMainStart) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0 && this.pieces.length === 0) {
          this.sliced = false;
          this.scale = 0.1;
        }
      }
      return;
    }

    if (this.scale < 1.0) {
      this.scale = Math.min(1.0, this.scale + dt * 4);
    }

    this.rotation += this.rotationSpeed * dt;
  }

  getPos(width, height) {
    const x = this.xRatio * width;
    const y = this.yRatio * height + Math.sin(this.bobPhase) * 9;
    return { x, y };
  }

  slice(cutAngle, cutPoint, splashSystem, particleSystem) {
    if (this.sliced) return false;
    this.sliced = true;
    this.respawnTimer = 3.5;

    const { piece1, piece2 } = calculateSplitImpulses(cutAngle, 0, -40, 240);

    const p1 = new FruitPiece(
      this.type,
      cutPoint.x,
      cutPoint.y,
      piece1.vx,
      piece1.vy,
      this.rotation,
      piece1.angularVelocity,
      cutAngle,
      1
    );

    const p2 = new FruitPiece(
      this.type,
      cutPoint.x,
      cutPoint.y,
      piece2.vx,
      piece2.vy,
      this.rotation,
      piece2.angularVelocity,
      cutAngle,
      -1
    );

    this.pieces = [p1, p2];

    // Splat on the wood background
    splashSystem.addSplash(
      cutPoint.x,
      cutPoint.y,
      cutAngle,
      this.config.juiceColor,
      this.config.pulpColor
    );

    // Airborne juice and pulp
    particleSystem.spawnSliceJuice(
      cutPoint.x,
      cutPoint.y,
      cutAngle,
      this.config.juiceColor,
      this.config.pulpColor,
      16
    );

    audioManager.playSlice(this.type);
    hapticManager.medium();

    return true;
  }

  draw(ctx, width, height) {
    if (this.sliced) {
      for (let i = 0; i < this.pieces.length; i++) {
        this.pieces[i].draw(ctx);
      }
      return;
    }

    const { x, y } = this.getPos(width, height);
    const r = this.radius * this.scale;

    ctx.save();
    ctx.translate(x, y);

    // 1. Soft 3D Drop shadow on wood
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 14;
    ctx.beginPath();
    ctx.arc(0, 6, r * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fill();
    ctx.restore();

    // 2. Main Central Fruit Glow & Blade Orbit Ring
    if (this.isMainStart) {
      const ringRadius = r * 1.35;
      const t = performance.now() / 1000;

      // Outer pulsing celestial electric cyan ring
      ctx.save();
      ctx.rotate(t * 0.8);
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.55)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([14, 8, 4, 8]);
      ctx.shadowColor = '#00F5FF';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Inner counter-rotating indicator ring
      ctx.save();
      ctx.rotate(-t * 1.2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius * 0.88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw 3D Fruit Texture
    ctx.rotate(this.rotation);
    const img = assetManager.get(this.type);
    if (img && img.complete) {
      ctx.drawImage(img, -r, -r, r * 2, r * 2);

      // Subtle gloss sheen & delicate cyan rim reflection
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      const gloss = ctx.createRadialGradient(-r * 0.32, -r * 0.32, 2, -r * 0.32, -r * 0.32, r * 0.65);
      gloss.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      gloss.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)');
      gloss.addColorStop(1, 'transparent');
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      const rimGrad = ctx.createRadialGradient(0, 0, r * 0.72, 0, 0, r);
      rimGrad.addColorStop(0, 'transparent');
      rimGrad.addColorStop(1, 'rgba(0, 245, 255, 0.20)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = this.config.juiceColor;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default function MenuCanvas({ onStartGame, isStarting }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });

    let width = canvas.parentElement.clientWidth;
    let height = canvas.parentElement.clientHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    const resize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Systems
    const sliceSystem = new SliceSystem();
    const particleSystem = new ParticleSystem();
    const splashSystem = new SplashSystem(12);

    // Floating Interactive Menu Fruits:
    // Center: Big Sliceable Watermelon
    // Side: Companion sliceable Apple, Orange, Kiwi
    const menuFruits = [
      new MenuFruit('watermelon', 0.5, 0.56, 58, true),
      new MenuFruit('apple', 0.18, 0.28, 36, false),
      new MenuFruit('orange', 0.2, 0.78, 36, false),
      new MenuFruit('kiwi', 0.82, 0.34, 34, false)
    ];

    // Ambient floating neon dust particles
    const ambientDust = [];
    for (let i = 0; i < 22; i++) {
      ambientDust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8,
        speedX: (Math.random() - 0.5) * 12,
        speedY: -Math.random() * 15 - 6,
        alpha: Math.random() * 0.3 + 0.1,
        color: i % 3 === 0 ? '#00F5FF' : (i % 3 === 1 ? '#7C3AED' : '#FFFFFF')
      });
    }

    let hasTriggeredStart = false;

    // Check slices against menu fruits
    const checkMenuSlices = () => {
      const segments = sliceSystem.getActiveSegments();
      if (segments.length === 0) return;

      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        for (let f = 0; f < menuFruits.length; f++) {
          const fruit = menuFruits[f];
          if (fruit.sliced) continue;

          const pos = fruit.getPos(width, height);
          // Distance from segment to fruit center
          const p1 = seg.p1;
          const p2 = seg.p2;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const lenSq = dx * dx + dy * dy;
          let u = 0;
          if (lenSq > 0) {
            u = Math.max(0, Math.min(1, ((pos.x - p1.x) * dx + (pos.y - p1.y) * dy) / lenSq));
          }
          const closestX = p1.x + u * dx;
          const closestY = p1.y + u * dy;
          const distSq = (pos.x - closestX) * (pos.x - closestX) + (pos.y - closestY) * (pos.y - closestY);

          if (distSq <= fruit.radius * fruit.radius) {
            const cutAngle = seg.angle;
            const cutPoint = { x: closestX, y: closestY };
            fruit.slice(cutAngle, cutPoint, splashSystem, particleSystem);

            if (fruit.isMainStart && !hasTriggeredStart) {
              hasTriggeredStart = true;
              audioManager.playLevelUp();
              hapticManager.heavy();
              setTimeout(() => {
                onStartGame();
              }, 340);
            }
          }
        }
      }
    };

    // Pointer handlers for slicing
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handlePointerDown = (e) => {
      audioManager.resume();
      const pos = getPos(e);
      sliceSystem.startStroke(pos.x, pos.y);
    };

    const handlePointerMove = (e) => {
      const pos = getPos(e);
      sliceSystem.addPoint(pos.x, pos.y);
      checkMenuSlices();
    };

    const handlePointerUp = () => {
      sliceSystem.endStroke();
    };

    canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    canvas.addEventListener('touchend', handlePointerUp, { passive: true });

    canvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    // Animation Loop
    let lastTime = performance.now();
    let animId = null;

    const loop = (timestamp) => {
      const dt = Math.min(0.064, (timestamp - lastTime) / 1000);
      lastTime = timestamp;

      // Update systems
      sliceSystem.update();
      particleSystem.update(dt);
      splashSystem.update(dt);

      for (let i = 0; i < menuFruits.length; i++) {
        menuFruits[i].update(dt, width, height);
      }

      for (let i = 0; i < ambientDust.length; i++) {
        const p = ambientDust[i];
        p.x += p.speedX * dt;
        p.y += p.speedY * dt;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
      }

      // Draw Frame
      ctx.save();

      // 1. Background image (fnbg.png with cover scaling)
      const bgImg = assetManager.get('fnbg');
      if (bgImg && bgImg.complete && bgImg.width > 0) {
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = width / height;
        let dw = width;
        let dh = height;
        let dx = 0;
        let dy = 0;
        if (canvasRatio > imgRatio) {
          dh = width / imgRatio;
          dy = (height - dh) / 2;
        } else {
          dw = height * imgRatio;
          dx = (width - dw) / 2;
        }
        ctx.drawImage(bgImg, dx, dy, dw, dh);

        // Dark cinematic vignette
        const overlay = ctx.createLinearGradient(0, 0, 0, height);
        overlay.addColorStop(0, 'rgba(5, 6, 8, 0.35)');
        overlay.addColorStop(0.5, 'rgba(5, 6, 8, 0.12)');
        overlay.addColorStop(1, 'rgba(5, 6, 8, 0.52)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, height);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#24140B');
        bgGrad.addColorStop(0.5, '#1A0E07');
        bgGrad.addColorStop(1, '#0F0905');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Dynamic Ambient Neon Lighting Layer over the Wood Board
      const t = performance.now() / 1000;
      const breathe = 0.9 + 0.1 * Math.sin(t * 1.2);

      // Top-left soft Electric Cyan glow
      const cyanGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, width * 0.72 * breathe);
      cyanGlow.addColorStop(0, 'rgba(0, 245, 255, 0.16)');
      cyanGlow.addColorStop(0.5, 'rgba(0, 245, 255, 0.04)');
      cyanGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = cyanGlow;
      ctx.fillRect(0, 0, width, height);

      // Bottom-right subtle Violet reflection
      const violetGlow = ctx.createRadialGradient(width, height, 10, width, height, width * 0.68 * breathe);
      violetGlow.addColorStop(0, 'rgba(124, 58, 237, 0.14)');
      violetGlow.addColorStop(0.5, 'rgba(124, 58, 237, 0.03)');
      violetGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = violetGlow;
      ctx.fillRect(0, 0, width, height);

      // Deep blue perimeter shading / soft ambient shadows
      const blueShadow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        width * 0.35,
        width * 0.5,
        height * 0.5,
        width * 0.85
      );
      blueShadow.addColorStop(0, 'transparent');
      blueShadow.addColorStop(0.7, 'rgba(22, 119, 255, 0.05)');
      blueShadow.addColorStop(1, 'rgba(10, 16, 26, 0.42)');
      ctx.fillStyle = blueShadow;
      ctx.fillRect(0, 0, width, height);

      // 2. Wall Juice Splatters on Wood Background
      splashSystem.draw(ctx);

      // 3. Ambient luminescent dust motes
      for (let i = 0; i < ambientDust.length; i++) {
        const p = ambientDust[i];
        ctx.fillStyle = p.color || '#FFFFFF';
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 4. Draw Floating Menu Fruits
      for (let i = 0; i < menuFruits.length; i++) {
        menuFruits[i].draw(ctx, width, height);
      }

      // 5. Draw Particles
      particleSystem.draw(ctx);

      // 6. Draw Tapered Blade Trail
      sliceSystem.draw(ctx);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchend', handlePointerUp);
      canvas.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [onStartGame]);

  return (
    <canvas
      ref={canvasRef}
      className="menu-interactive-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        touchAction: 'none',
        zIndex: 1
      }}
    />
  );
}

