import { tessellateArc, ARC_SEGMENTS, type Arc } from '../geometry/arc.ts';

export function arcPreview(arc: Arc) {
  return tessellateArc(arc, ARC_SEGMENTS);
}
