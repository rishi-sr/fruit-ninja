// SliceSystem.js - Tapered Spline Blade Trail with Instant Touch Response

import { dist } from './Physics.js';
import audioManager from './AudioManager.js';

const MAX_TRAIL_AGE = 0.16; // 160ms for crisp, sharp blade feel
const MIN_DISTANCE_BETWEEN_POINTS = 3; // px

export class SliceSystem {
  constructor() {
    this.points = []; // [{x, y, time}]
    this.isSwiping = false;
    this.lastSoundTime = 0;
  }

  startStroke(x, y) {
    this.isSwiping = true;
    this.points = [{ x, y, time: performance.now() / 1000 }];
  }

  addPoint(x, y) {
    const now = performance.now() / 1000;
    if (this.points.length > 0) {
      const last = this.points[this.points.length - 1];
      const d = dist(last.x, last.y, x, y);
      if (d < MIN_DISTANCE_BETWEEN_POINTS) {
        return;
      }

      // Calculate swipe velocity for blade swoosh audio
      const dt = now - last.time;
      if (dt > 0) {
        const speed = d / dt;
        if (speed > 1200) {
          audioManager.playWhoosh(speed / 1200);
        }
      }
    }

    this.points.push({ x, y, time: now });
  }

  endStroke() {
    this.isSwiping = false;
  }

  update(currentTime) {
    const now = currentTime || performance.now() / 1000;
    // Discard points older than MAX_TRAIL_AGE
    this.points = this.points.filter(p => now - p.time < MAX_TRAIL_AGE);
    if (this.points.length <= 1 && !this.isSwiping) {
      this.points = [];
    }
  }

  // Returns list of line segments created during the current frame for collision detection
  getActiveSegments() {
    if (this.points.length < 2) return [];

    const segments = [];
    // Only check segments created very recently (e.g. within the last 70ms)
    const now = performance.now() / 1000;
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      if (now - p2.time < 0.08) {
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        segments.push({ p1, p2, angle });
      }
    }
    return segments;
  }

  draw(ctx, combo = 0) {
    if (this.points.length < 2) return;

    const now = performance.now() / 1000;
    const pts = this.points;

    // Subtle combo evolution scaling (up to +6px blur, +0.15 alpha)
    const comboBoost = Math.min(6, Math.max(0, (combo - 1) * 0.75));
    const comboAlpha = Math.min(0.15, Math.max(0, (combo - 1) * 0.02));

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Layer 1: Outer subtle deep blue bloom
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const age = now - p1.time;
      const progress = 1 - Math.max(0, Math.min(1, age / MAX_TRAIL_AGE));
      const indexRatio = (i + 1) / pts.length;
      const t = progress * indexRatio;
      if (t <= 0.01) continue;

      ctx.shadowColor = '#1677FF';
      ctx.shadowBlur = (14 + comboBoost) * t;
      ctx.strokeStyle = `rgba(22, 119, 255, ${(0.3 + comboAlpha) * t})`;
      ctx.lineWidth = Math.max(1.5, 6 * t);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Layer 2: Electric cyan outer glow
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const age = now - p1.time;
      const progress = 1 - Math.max(0, Math.min(1, age / MAX_TRAIL_AGE));
      const indexRatio = (i + 1) / pts.length;
      const t = progress * indexRatio;
      if (t <= 0.01) continue;

      ctx.shadowColor = '#00F5FF';
      ctx.shadowBlur = (8 + comboBoost) * t;
      ctx.strokeStyle = `rgba(0, 245, 255, ${(0.8 + comboAlpha) * t})`;
      ctx.lineWidth = Math.max(1.2, 3.8 * t);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Layer 3: Thin bright razor-sharp white core
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const age = now - p1.time;
      const progress = 1 - Math.max(0, Math.min(1, age / MAX_TRAIL_AGE));
      const indexRatio = (i + 1) / pts.length;
      const t = progress * indexRatio;
      if (t <= 0.01) continue;

      ctx.shadowBlur = 3;
      ctx.shadowColor = '#FFFFFF';
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.98 * t})`;
      ctx.lineWidth = Math.max(0.8, 2.2 * t);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Glistening tip point: cyan aura + crisp white spark
    if (this.points.length > 0) {
      const head = pts[pts.length - 1];
      ctx.shadowColor = '#00F5FF';
      ctx.shadowBlur = 12 + comboBoost;
      ctx.fillStyle = 'rgba(0, 245, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  clear() {
    this.points = [];
    this.isSwiping = false;
  }
}

export default SliceSystem;

