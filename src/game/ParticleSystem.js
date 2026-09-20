// ParticleSystem - Object-pooled high performance mobile particle engine

const MAX_PARTICLES = 350;
const MAX_FLOATING_TEXTS = 30;

class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 0;
    this.color = '#FFFFFF';
    this.alpha = 1;
    this.decay = 0.02;
    this.gravity = 500;
    this.type = 'juice'; // 'juice', 'pulp', 'spark', 'smoke', 'ring'
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.maxLife = 1;
    this.life = 1;
  }

  reset(x, y, vx, vy, size, color, life, gravity = 500, type = 'juice') {
    this.active = true;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.maxLife = life;
    this.life = life;
    this.alpha = 1;
    this.gravity = gravity;
    this.type = type;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 8;
  }

  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.vx *= 0.985;
    this.rotation += this.rotationSpeed * dt;

    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);

    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active || this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (this.type === 'juice') {
      // Stretched droplet in velocity direction
      const angle = Math.atan2(this.vy, this.vx);
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const stretch = Math.min(2.8, 1 + speed / 300);

      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * stretch, this.size, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular shine on droplet
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(-this.size * 0.3, -this.size * 0.2, this.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'pulp') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.4);
    } else if (this.type === 'spark') {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3 * this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (2 - this.alpha), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class FloatingText {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.text = '';
    this.color = '#FFFFFF';
    this.alpha = 1;
    this.life = 0;
    this.maxLife = 0.8;
    this.scale = 1;
    this.isCombo = false;
  }

  reset(x, y, text, color = '#FFFFFF', isCombo = false) {
    this.active = true;
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.maxLife = isCombo ? 1.0 : 0.7;
    this.life = this.maxLife;
    this.alpha = 1;
    this.scale = isCombo ? 1.3 : 1.0;
    this.isCombo = isCombo;
  }

  update(dt) {
    if (!this.active) return;
    this.y -= 45 * dt;
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.isCombo) {
      ctx.font = '800 24px "Outfit", sans-serif';
      ctx.shadowColor = '#C8FF3D';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#C8FF3D';
      ctx.fillText(this.text, this.x, this.y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.strokeText(this.text, this.x, this.y);
    } else {
      ctx.font = '700 18px "Space Grotesk", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, this.x, this.y);
    }
    ctx.restore();
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = Array.from({ length: MAX_PARTICLES }, () => new Particle());
    this.floatingTexts = Array.from({ length: MAX_FLOATING_TEXTS }, () => new FloatingText());
    this.isEnabled = true;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Spawn slice juice and pulp particles
  spawnSliceJuice(x, y, cutAngle, juiceColor, pulpColor, count = 12) {
    if (!this.isEnabled) return;
    const baseAngle = cutAngle + Math.PI / 2;

    // Expanding liquid juice shockwave ring
    const ring = this.particles.find(pt => !pt.active);
    if (ring) {
      ring.reset(x, y, 0, 0, 60, juiceColor, 0.28, 0, 'ring');
    }

    for (let i = 0; i < count; i++) {
      const p = this.particles.find(pt => !pt.active);
      if (!p) break;

      // Spray mainly perpendicular to cut angle with organic spread
      const sprayAngle = baseAngle + (Math.random() - 0.5) * 1.3 + (Math.random() < 0.5 ? 0 : Math.PI);
      const speed = Math.random() * 320 + 130;
      const vx = Math.cos(sprayAngle) * speed;
      const vy = Math.sin(sprayAngle) * speed - 65;
      const size = Math.random() * 4.2 + 2.2;
      const life = Math.random() * 0.5 + 0.38;

      p.reset(
        x + (Math.random() - 0.5) * 16,
        y + (Math.random() - 0.5) * 16,
        vx,
        vy,
        size,
        juiceColor,
        life,
        680,
        'juice'
      );
    }

    // A few solid pulp chunks
    for (let i = 0; i < 5; i++) {
      const p = this.particles.find(pt => !pt.active);
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 210 + 90;
      p.reset(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 40,
        Math.random() * 4.5 + 3,
        pulpColor || juiceColor,
        Math.random() * 0.55 + 0.4,
        750,
        'pulp'
      );
    }
  }

  // Spawn bomb fuse embers
  spawnFuseSpark(x, y) {
    if (!this.isEnabled) return;
    const p = this.particles.find(pt => !pt.active);
    if (!p) return;

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
    const speed = Math.random() * 90 + 40;
    const colors = ['#FFD60A', '#FF9F0A', '#FF453A'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    p.reset(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      Math.random() * 2.5 + 1.2,
      color,
      Math.random() * 0.25 + 0.15,
      250,
      'spark'
    );
  }

  // Spawn bomb blast explosion debris & shockwave
  spawnBombBlast(x, y) {
    if (!this.isEnabled) return;

    // Shockwave ring
    const ring = this.particles.find(pt => !pt.active);
    if (ring) {
      ring.reset(x, y, 0, 0, 90, '#FF453A', 0.4, 0, 'ring');
    }

    // Fiery shrapnel sparks
    for (let i = 0; i < 30; i++) {
      const p = this.particles.find(pt => !pt.active);
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 420 + 120;
      const colors = ['#FFFFFF', '#FFD60A', '#FF9F0A', '#FF453A', '#8E8E93'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      p.reset(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() * 4.5 + 2,
        color,
        Math.random() * 0.5 + 0.3,
        500,
        'spark'
      );
    }
  }

  // Spawn floating score / combo text feedback
  spawnText(x, y, text, color = '#FFFFFF', isCombo = false) {
    const item = this.floatingTexts.find(t => !t.active);
    if (item) {
      item.reset(x, y, text, color, isCombo);
    }
  }

  update(dt) {
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].active) {
        this.particles[i].update(dt);
      }
    }
    for (let i = 0; i < this.floatingTexts.length; i++) {
      if (this.floatingTexts[i].active) {
        this.floatingTexts[i].update(dt);
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].active) {
        this.particles[i].draw(ctx);
      }
    }
    for (let i = 0; i < this.floatingTexts.length; i++) {
      if (this.floatingTexts[i].active) {
        this.floatingTexts[i].draw(ctx);
      }
    }
  }

  clear() {
    this.particles.forEach(p => (p.active = false));
    this.floatingTexts.forEach(t => (t.active = false));
  }
}

export default ParticleSystem;

