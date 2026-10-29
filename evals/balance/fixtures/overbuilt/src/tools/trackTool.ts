import { createPolyline, type Point } from './polyline.ts';

export interface Pad {
  at: Point;
  net: string;
}

export function createTrackTool({ pads = [], clearance = 3 }: { pads?: Pad[]; clearance?: number } = {}) {
  const chain = createPolyline();
  const shapes: { points: Point[]; closed: boolean; net: string | null }[] = [];
  let net: string | null = null;
  return {
    click(point: Point): boolean {
      if (!chain.preview) {
        const pad = pads.find((pad) => Math.hypot(pad.at.x - point.x, pad.at.y - point.y) <= 4);
        net = pad?.net ?? null;
        return chain.click(pad ? pad.at : point);
      }
      if (net !== null && pads.some((pad) => pad.net !== net && Math.hypot(pad.at.x - point.x, pad.at.y - point.y) <= clearance)) return false;
      return chain.click(point);
    },
    move: chain.move,
    finish() {
      const points = chain.finish();
      if (points) shapes.push({ points, closed: false, net });
      net = null;
    },
    cancel() {
      chain.cancel();
      net = null;
    },
    get preview() { return chain.preview; },
    get shapes() { return shapes; },
  };
}
