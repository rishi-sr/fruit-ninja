// Bomb.js - 3D Real Tactical Bomb Model with Live Spark Fuse

import { GRAVITY } from './Physics.js';
import assetManager from './AssetManager.js';

export class Bomb {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 38;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 2.2;
    this.active = true;
    this.detonated = false;
    this.hasPeaked = false;
    this.age = 0;
    this.sparkTimer = 0;
  }

  update(dt, screenHeight, particleSystem) {
    if (this.detonated || !this.active) return;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += GRAVITY * dt;
    this.rotation += this.rotationSpeed * dt;
    this.age += dt;

    if (this.vy > 0 && !this.hasPeaked) {
      this.hasPeaked = true;
    }

    // Spawn sparks from fuse tip
    this.sparkTimer += dt;
    if (this.sparkTimer > 0.04 && particleSystem) {
      this.sparkTimer = 0;
      const fuseTip = this.getFuseTip();
      particleSystem.spawnFuseSpark(fuseTip.x, fuseTip.y);
    }

    if (this.y > screenHeight + 80 && this.hasPeaked) {
      this.active = false;
    }
  }

  getFuseTip() {
    const localX = this.radius * 0.45;
    const localY = -this.radius * 1.1;
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    return {
      x: this.x + localX * cos - localY * sin,
      y: this.y + localX * sin + localY * cos
    };
  }

  detonate() {
    this.detonated = true;
    this.active = false;
  }

  draw(ctx) {
    if (!this.active || this.detonated) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const r = this.radius * 1.15;

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();
    ctx.restore();

    // Draw 3D Bomb Model
    const img = assetManager.get('bomb');
    if (img && img.complete) {
      ctx.drawImage(img, -r, -r, r * 2, r * 2);

      // Subtle metallic brushed gunmetal specular sheen
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      const sheen = ctx.createLinearGradient(-r, -r, r, r);
      sheen.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      sheen.addColorStop(0.3, 'rgba(255, 255, 255, 0.04)');
      sheen.addColorStop(0.5, 'transparent');
      sheen.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = sheen;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Dark metallic sphere fallback
      const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 2, 0, 0, r);
      grad.addColorStop(0, '#5A6472');
      grad.addColorStop(0.5, '#222831');
      grad.addColorStop(1, '#0E1117');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Danger warning pulse core
    const pulse = 0.5 + 0.5 * Math.sin(this.age * 9);
    ctx.shadowColor = '#FF3B30';
    ctx.shadowBlur = 10 * pulse;
    ctx.fillStyle = `rgba(255, 59, 48, ${0.45 * pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export default Bomb;
