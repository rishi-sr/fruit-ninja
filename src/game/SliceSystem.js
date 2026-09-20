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

  draw(ctx) {
    if (this.points.length < 2) return;

    const now = performance.now() / 1000;
    const pts = this.points;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw multi-layered glowing tapered blade trail
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];

      const age1 = now - p1.time;
      const progress = 1 - Math.max(0, Math.min(1, age1 / MAX_TRAIL_AGE)); // 0 at tail, 1 at tip
      const indexRatio = (i + 1) / pts.length; // tapered along length
      const t = progress * indexRatio;

      if (t <= 0.01) continue;

      // Outer golden katana halo
      ctx.shadowColor = '#FFB800';
      ctx.shadowBlur = 10 * t;
      ctx.strokeStyle = `rgba(255, 184, 0, ${0.45 * t})`;
      ctx.lineWidth = Math.max(1, 7 * t);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Sharp white core
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#FFFFFF';
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * t})`;
      ctx.lineWidth = Math.max(1, 3 * t);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Glistening tip point
    if (this.points.length > 0) {
      const head = pts[pts.length - 1];
      ctx.shadowColor = '#FFB800';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
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

