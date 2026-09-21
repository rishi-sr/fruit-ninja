// Fruit.js - Integration with User's Uploaded 3D Real Fruit Models & Split Halves

import { GRAVITY, calculateSplitImpulses } from './Physics.js';
import assetManager from './AssetManager.js';

export const FRUIT_TYPES = {
  apple: {
    name: 'Apple',
    radius: 42,
    points: 10,
    juiceColor: 'rgba(255, 85, 120, 0.88)',
    pulpColor: '#FFF0F2',
    mass: 1.0,
    scale: 1.25
  },
  watermelon: {
    name: 'Watermelon',
    radius: 52,
    points: 15,
    juiceColor: 'rgba(255, 110, 140, 0.88)',
    pulpColor: '#FEE2E2',
    mass: 1.35,
    scale: 1.3
  },
  orange: {
    name: 'Orange',
    radius: 42,
    points: 10,
    juiceColor: 'rgba(255, 180, 65, 0.9)',
    pulpColor: '#FFEDD5',
    mass: 1.1,
    scale: 1.25
  },
  strawberry: {
    name: 'Strawberry',
    radius: 38,
    points: 15,
    juiceColor: 'rgba(255, 125, 165, 0.88)',
    pulpColor: '#FFE4E6',
    mass: 0.85,
    scale: 1.25
  },
  kiwi: {
    name: 'Kiwi',
    radius: 38,
    points: 15,
    juiceColor: 'rgba(168, 238, 75, 0.9)',
    pulpColor: '#ECFCCB',
    mass: 0.95,
    scale: 1.25
  }
};

export class FruitPiece {
  constructor(fruitType, x, y, vx, vy, rotation, angularVelocity, cutAngle, side) {
    this.type = fruitType;
    this.config = FRUIT_TYPES[fruitType];
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.rotation = rotation;
    this.angularVelocity = angularVelocity;
    this.cutAngle = cutAngle;
    this.side = side; // 1 (primary half) or -1 (flipped complementary half)
    this.radius = this.config.radius;
    this.active = true;
    this.age = 0;
  }

  update(dt, screenHeight) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += GRAVITY * dt * 1.08;
    this.rotation += this.angularVelocity * dt;
    this.age += dt;

    if (this.y > screenHeight + 140) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Complementary half mirror along cut axis
    if (this.side === -1) {
      ctx.scale(-1, 1);
    }

    const r = this.radius * this.config.scale;

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fill();
    ctx.restore();

    // Render user's uploaded 3D Cut Model (e.g. applecut, watermeloncut, etc.)
    const cutKey = `${this.type}cut`;
    const cutImg = assetManager.get(cutKey);

    if (cutImg && cutImg.complete) {
      ctx.drawImage(cutImg, -r, -r, r * 2, r * 2);

      // Delicate ambient neon reflection along edge
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      const rimGrad = ctx.createRadialGradient(0, 0, r * 0.72, 0, 0, r);
      rimGrad.addColorStop(0, 'transparent');
      rimGrad.addColorStop(1, 'rgba(0, 245, 255, 0.16)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Fallback
      ctx.fillStyle = this.config.juiceColor;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class Fruit {
  constructor(type, x, y, vx, vy) {
    this.type = type;
    this.config = FRUIT_TYPES[type];
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = this.config.radius;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 3.6;
    this.sliced = false;
    this.active = true;
    this.missed = false;
    this.pieces = [];
    this.hasPeaked = false;
    this.tumblePhase = Math.random() * Math.PI * 2;
  }

  update(dt, screenHeight) {
    if (this.sliced) {
      this.pieces.forEach((piece) => piece.update(dt, screenHeight));
      if (this.pieces.every((p) => !p.active)) {
        this.active = false;
      }
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += GRAVITY * dt;
    this.rotation += this.rotationSpeed * dt;
    this.tumblePhase += dt * 3.5;

    if (this.vy > 0 && !this.hasPeaked) {
      this.hasPeaked = true;
    }

    if (this.y > screenHeight + 80 && this.hasPeaked) {
      this.active = false;
      this.missed = true;
    }
  }

  slice(cutAngle) {
    if (this.sliced) return [];
    this.sliced = true;

    const { piece1, piece2 } = calculateSplitImpulses(cutAngle, this.vx, this.vy, 280);

    // Initial piece rotations slightly offset along cut angle
    const p1 = new FruitPiece(
      this.type,
      this.x,
      this.y,
      piece1.vx,
      piece1.vy,
      cutAngle,
      piece1.angularVelocity,
      cutAngle,
      1
    );

    const p2 = new FruitPiece(
      this.type,
      this.x,
      this.y,
      piece2.vx,
      piece2.vy,
      cutAngle,
      piece2.angularVelocity,
      cutAngle,
      -1
    );

    this.pieces = [p1, p2];
    return this.pieces;
  }

  draw(ctx) {
    if (this.sliced) {
      this.pieces.forEach((p) => p.draw(ctx));
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const r = this.radius * this.config.scale;

    // Subtle 3D pseudo-perspective depth
    const scaleY = 0.96 + 0.08 * Math.cos(this.tumblePhase);
    ctx.scale(1.0, scaleY);

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();
    ctx.restore();

    // Render user's uploaded 3D Whole Fruit Model (apple, watermelon, orange, kiwi, strawberry)
    const img = assetManager.get(this.type);
    if (img && img.complete) {
      ctx.drawImage(img, -r, -r, r * 2, r * 2);

      // Subtle specular gloss and delicate neon rim lighting conforming to fruit surface
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';

      // Top-left specular gloss sheen
      const gloss = ctx.createRadialGradient(-r * 0.32, -r * 0.32, 2, -r * 0.32, -r * 0.32, r * 0.65);
      gloss.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
      gloss.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)');
      gloss.addColorStop(1, 'transparent');
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Delicate electric cyan ambient rim reflection on outer contour
      const rimGrad = ctx.createRadialGradient(0, 0, r * 0.72, 0, 0, r);
      rimGrad.addColorStop(0, 'transparent');
      rimGrad.addColorStop(0.7, 'rgba(0, 245, 255, 0.04)');
      rimGrad.addColorStop(1, 'rgba(0, 245, 255, 0.20)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else {
      // Fallback
      ctx.fillStyle = this.config.juiceColor;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default Fruit;
