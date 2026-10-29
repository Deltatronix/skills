import { tessellateArc, ARC_SEGMENTS, type Arc } from '../geometry/arc.ts';

export function arcPath(arc: Arc): string {
  const points = tessellateArc(arc, ARC_SEGMENTS);
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
}
