// Physics constants and vector utilities

export const GRAVITY = 720; // px/s^2 calibrated for mobile screen aspect ratio
export const DRAG = 0.998;

export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distSq(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Check intersection between two line segments (p1-p2 and p3-p4)
export function lineIntersection(p1, p2, p3, p4) {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1),
      ua,
      ub
    };
  }
  return null;
}

// Check if a line segment (p1->p2) intersects a circle (center cx, cy with radius r)
export function lineIntersectsCircle(p1, p2, cx, cy, r) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return distSq(p1.x, p1.y, cx, cy) <= r * r;
  }

  // Project center onto line segment
  const t = clamp(((cx - p1.x) * dx + (cy - p1.y) * dy) / lenSq, 0, 1);
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;

  const dSq = distSq(cx, cy, projX, projY);
  return dSq <= r * r;
}

// Compute dynamic split impulses given the cut angle
export function calculateSplitImpulses(cutAngle, baseVx, baseVy, separationForce = 220) {
  // Normal to the cut line
  const nx = -Math.sin(cutAngle);
  const ny = Math.cos(cutAngle);

  // Piece 1 moves in +normal direction with outward torque
  const piece1 = {
    vx: baseVx * 0.5 + nx * separationForce + (Math.random() - 0.5) * 40,
    vy: baseVy * 0.6 + ny * separationForce - 40,
    angularVelocity: (Math.random() * 4 + 2) * (Math.random() < 0.5 ? 1 : -1)
  };

  // Piece 2 moves in -normal direction with outward torque
  const piece2 = {
    vx: baseVx * 0.5 - nx * separationForce + (Math.random() - 0.5) * 40,
    vy: baseVy * 0.6 - ny * separationForce - 40,
    angularVelocity: (Math.random() * 4 + 2) * (Math.random() < 0.5 ? 1 : -1)
  };

  return { piece1, piece2 };
}

