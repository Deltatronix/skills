export interface Arc {
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export const ARC_SEGMENTS = 32;

export function tessellateArc(arc: Arc, segments: number) {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const angle = arc.startAngle + (arc.endAngle - arc.startAngle) * i / segments;
    return { x: arc.cx + arc.radius * Math.cos(angle), y: arc.cy + arc.radius * Math.sin(angle) };
  });
}
