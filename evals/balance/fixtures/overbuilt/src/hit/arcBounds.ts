import { tessellateArc, ARC_SEGMENTS, type Arc } from '../geometry/arc.ts';

export function arcBounds(arc: Arc) {
  const points = tessellateArc(arc, ARC_SEGMENTS);
  return {
    minX: Math.min(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxX: Math.max(...points.map((p) => p.x)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}
