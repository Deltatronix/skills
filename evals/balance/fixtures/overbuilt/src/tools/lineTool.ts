import { createPolyline, type Point } from './polyline.ts';

export function createLineTool() {
  const chain = createPolyline();
  const shapes: { points: Point[]; closed: boolean }[] = [];
  return {
    click: chain.click,
    move: chain.move,
    finish() {
      const points = chain.finish();
      if (points) shapes.push({ points, closed: false });
    },
    cancel: chain.cancel,
    get preview() { return chain.preview; },
    get shapes() { return shapes; },
  };
}
