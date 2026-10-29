import { distance, type Point } from './geometry.ts';

export interface Shape {
  points: Point[];
  closed: boolean;
}

export interface LineToolOptions {
  /** Snap every point to a grid of this pitch. Off by default. */
  grid?: number;
  /**
   * Constrain each new vertex to the nearest multiple of this angle (radians) from the previous
   * vertex, keeping the segment's length — 45° routing is `Math.PI / 4`. Off by default.
   */
  angleStep?: number;
}

/** Polyline tool: click to add vertices, finish to commit, cancel to drop, undo to take back the last shape. */
export function createLineTool({ grid, angleStep }: LineToolOptions = {}) {
  const shapes: Shape[] = [];
  const history: Shape[][] = [];
  let current: Point[] | null = null;
  let cursor: Point | null = null;

  const snap = (p: Point): Point =>
    grid ? { x: Math.round(p.x / grid) * grid, y: Math.round(p.y / grid) * grid } : p;

  /** Where a click at `to` puts the next vertex, given the previous one. */
  const place = (from: Point, to: Point): Point => {
    const p = snap(to);
    const length = distance(from, p);
    if (!angleStep || length === 0) return p;
    const angle = Math.round(Math.atan2(p.y - from.y, p.x - from.x) / angleStep) * angleStep;
    return { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length };
  };

  return {
    click(p: Point) {
      if (!current) {
        current = [snap(p)];
        return;
      }
      const last = current[current.length - 1];
      const next = place(last, p);
      if (distance(last, next) < 1e-9) return; // repeated click on the same vertex
      current.push(next);
    },
    move(p: Point) {
      if (current) cursor = place(current[current.length - 1], p);
    },
    finish() {
      if (current && current.length >= 2) {
        history.push([...shapes]);
        shapes.push({ points: current, closed: false });
      }
      current = null;
      cursor = null;
    },
    cancel() {
      current = null;
      cursor = null;
    },
    undo() {
      const previous = history.pop();
      if (previous) shapes.splice(0, shapes.length, ...previous);
    },
    get preview() {
      if (!current) return null;
      return cursor ? [...current, cursor] : [...current];
    },
    get shapes() {
      return shapes;
    },
  };
}
