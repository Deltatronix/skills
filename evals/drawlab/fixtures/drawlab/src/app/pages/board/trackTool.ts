import { distance, type Point } from '../../shared/geometry.ts';

export interface Track {
  points: Point[];
  closed: boolean;
}

/** Tracks may only run at multiples of 45°, like a PCB router. */
const STEP = Math.PI / 4;

function constrain(from: Point, to: Point): Point {
  const length = distance(from, to);
  if (length === 0) return to;
  const angle = Math.round(Math.atan2(to.y - from.y, to.x - from.x) / STEP) * STEP;
  return { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length };
}

/** Track routing tool for the board page: click to add vertices, finish to commit, 45° constrained. */
export function createTrackTool() {
  const tracks: Track[] = [];
  let current: Point[] | null = null;
  let cursor: Point | null = null;

  return {
    click(p: Point) {
      if (!current) {
        current = [p];
        return;
      }
      const last = current[current.length - 1];
      const next = constrain(last, p);
      if (distance(last, next) < 1e-9) return;
      current.push(next);
    },
    move(p: Point) {
      if (current) cursor = constrain(current[current.length - 1], p);
    },
    finish() {
      if (current && current.length >= 2) tracks.push({ points: current, closed: false });
      current = null;
      cursor = null;
    },
    cancel() {
      current = null;
      cursor = null;
    },
    get preview() {
      if (!current) return null;
      return cursor ? [...current, cursor] : [...current];
    },
    get shapes() {
      return tracks;
    },
  };
}
