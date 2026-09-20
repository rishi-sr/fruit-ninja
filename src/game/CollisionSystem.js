// CollisionSystem.js - Fast line segment circle collision detection

import { lineIntersectsCircle } from './Physics.js';

export class CollisionSystem {
  checkCollisions(segments, fruits, bombs) {
    const slicedFruits = [];
    const hitBombs = [];

    if (!segments || segments.length === 0) {
      return { slicedFruits, hitBombs };
    }

    // Check fruit collisions
    for (let f = 0; f < fruits.length; f++) {
      const fruit = fruits[f];
      if (!fruit.active || fruit.sliced) continue;

      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        if (lineIntersectsCircle(seg.p1, seg.p2, fruit.x, fruit.y, fruit.radius)) {
          slicedFruits.push({
            fruit,
            cutAngle: seg.angle,
            cutPoint: { x: fruit.x, y: fruit.y }
          });
          break; // Avoid multiple cuts on same fruit in single frame
        }
      }
    }

    // Check bomb collisions
    for (let b = 0; b < bombs.length; b++) {
      const bomb = bombs[b];
      if (!bomb.active || bomb.detonated) continue;

      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        if (lineIntersectsCircle(seg.p1, seg.p2, bomb.x, bomb.y, bomb.radius)) {
          hitBombs.push({
            bomb,
            cutPoint: { x: bomb.x, y: bomb.y }
          });
          break;
        }
      }
    }

    return { slicedFruits, hitBombs };
  }
}

export default CollisionSystem;

