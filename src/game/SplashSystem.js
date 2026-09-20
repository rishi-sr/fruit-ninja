// SplashSystem.js - Organic Fruit Ninja Juice Splatters on Wood Cutting Board

export class JuiceSplash {
  constructor(x, y, cutAngle, juiceColor, pulpColor) {
    this.x = x;
    this.y = y;
    this.cutAngle = cutAngle;
    this.juiceColor = juiceColor;
    this.pulpColor = pulpColor || juiceColor;

    this.life = 3.6; // 3.6 seconds total lifetime
    this.maxLife = 3.6;
    this.alpha = 0.78; // Lighter, fresh liquid translucency
    this.age = 0;
    this.active = true;

    // Rapid elastic expansion impact on spawn (scale 0.25 -> target)
    this.scale = 0.25;
    this.targetScale = Math.random() * 0.3 + 0.85;

    // Base radius of the splat
    const baseRadius = Math.random() * 16 + 48; // 48-64px
    this.baseRadius = baseRadius;

    // Main splat lobes radiating outward (jagged organic splash perimeter)
    this.lobes = [];
    const lobeCount = Math.floor(Math.random() * 4) + 8; // 8 to 11 lobes
    for (let i = 0; i < lobeCount; i++) {
      const angle = (i / lobeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      // Slight elongation along cut angle direction
      const angleDiff = Math.abs(Math.sin(angle - cutAngle));
      const distMult = 0.7 + (1 - angleDiff * 0.35) * (Math.random() * 0.65 + 0.55);
      const lobeRadius = (Math.random() * 0.4 + 0.35) * baseRadius;
      this.lobes.push({
        angle,
        dist: baseRadius * distMult * 0.78,
        radius: lobeRadius
      });
    }

    // Satellite droplets sprayed outwards along slice axis
    this.droplets = [];
    const dropCount = Math.floor(Math.random() * 6) + 12; // 12 to 17 droplets
    for (let i = 0; i < dropCount; i++) {
      const angle = cutAngle + (Math.random() - 0.5) * 2.2 + (Math.random() < 0.5 ? 0 : Math.PI);
      const dist = baseRadius * (Math.random() * 1.6 + 0.85);
      const r = Math.random() * 3.8 + 2;
      this.droplets.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        radius: r
      });
    }

    // Realistic gravity drip trails running down the wood cutting board
    this.drips = [];
    const dripCount = Math.floor(Math.random() * 2) + 1; // 1 to 2 drips
    for (let i = 0; i < dripCount; i++) {
      this.drips.push({
        offsetX: (Math.random() - 0.5) * (baseRadius * 0.75),
        offsetY: Math.random() * 12 + 6,
        currentLength: 0,
        targetLength: Math.random() * 30 + 18,
        width: Math.random() * 1.8 + 2.8
      });
    }
  }

  update(dt) {
    if (!this.active) return;
    this.age += dt;

    // Rapid elastic expansion impact on spawn
    if (this.scale < this.targetScale) {
      this.scale = Math.min(this.targetScale, this.scale + dt * 14);
    }

    // Drips slowly run down the wood
    for (let i = 0; i < this.drips.length; i++) {
      const drip = this.drips[i];
      if (drip.currentLength < drip.targetLength) {
        drip.currentLength += dt * 18;
      }
    }

    // Stay solid for 1.8s, then dissolve into wood over remaining duration
    if (this.age > 1.8) {
      const fadeProgress = (this.age - 1.8) / (this.maxLife - 1.8);
      this.alpha = Math.max(0, 0.78 * (1 - fadeProgress));
    }

    if (this.age >= this.maxLife) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active || this.alpha <= 0.01) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.globalAlpha = this.alpha;

    // 1. Soft glowing outer juice halo (no dark black shadow!)
    ctx.save();
    ctx.shadowColor = this.juiceColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = this.juiceColor;
    ctx.beginPath();
    // Center pool
    ctx.arc(0, 0, this.baseRadius * 0.68, 0, Math.PI * 2);
    // Radiating lobes
    for (let i = 0; i < this.lobes.length; i++) {
      const l = this.lobes[i];
      const lx = Math.cos(l.angle) * l.dist;
      const ly = Math.sin(l.angle) * l.dist;
      ctx.arc(lx, ly, l.radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    // 2. Light luminous pulp core (makes the juice look luminous, light and appetizing)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, this.baseRadius * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // 3. Gravity drips running down the wood cutting board
    for (let i = 0; i < this.drips.length; i++) {
      const d = this.drips[i];
      if (d.currentLength > 2) {
        ctx.strokeStyle = this.juiceColor;
        ctx.lineWidth = d.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(d.offsetX, d.offsetY);
        ctx.lineTo(d.offsetX, d.offsetY + d.currentLength);
        ctx.stroke();

        // Droplet tear at the tip of the drip
        ctx.beginPath();
        ctx.arc(d.offsetX, d.offsetY + d.currentLength, d.width * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Satellite specks & droplets
    for (let i = 0; i < this.droplets.length; i++) {
      const dp = this.droplets[i];
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, dp.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Crisp wet liquid specular light reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(
      -this.baseRadius * 0.16,
      -this.baseRadius * 0.18,
      this.baseRadius * 0.3,
      this.baseRadius * 0.15,
      -0.45,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }
}

export class SplashSystem {
  constructor(maxSplashes = 14) {
    this.maxSplashes = maxSplashes;
    this.splashes = [];
  }

  addSplash(x, y, cutAngle, juiceColor, pulpColor) {
    // If pool is full, make oldest fade out quickly
    if (this.splashes.length >= this.maxSplashes) {
      const oldest = this.splashes[0];
      if (oldest) {
        oldest.age = Math.max(oldest.age, 2.6);
      }
    }

    const splash = new JuiceSplash(x, y, cutAngle, juiceColor, pulpColor);
    this.splashes.push(splash);
  }

  update(dt) {
    for (let i = 0; i < this.splashes.length; i++) {
      this.splashes[i].update(dt);
    }
    this.splashes = this.splashes.filter(s => s.active);
  }

  draw(ctx) {
    for (let i = 0; i < this.splashes.length; i++) {
      this.splashes[i].draw(ctx);
    }
  }

  clear() {
    this.splashes = [];
  }
}

export default SplashSystem;

