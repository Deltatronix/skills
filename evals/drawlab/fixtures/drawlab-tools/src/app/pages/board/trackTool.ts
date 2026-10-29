import { distance, type Point } from '../../shared/geometry.ts';

export interface Pad {
  at: Point;
  net: string;
}

export type CopperLayer = 'F.Cu' | 'B.Cu';

export interface Track {
  points: Point[];
  closed: boolean;
  /** Net inherited from the pad the track started on; null for a bare track. */
  net: string | null;
  /** Track width in mm. */
  width: number;
  layer: CopperLayer;
}

export interface TrackToolOptions {
  /** Pads on the board; a track starting within PAD_REACH of one inherits its net. */
  pads?: Pad[];
  /** Width in mm for every track this tool commits. */
  width?: number;
  layer?: CopperLayer;
}

/** Tracks may only run at multiples of 45°, like a PCB router. */
const STEP = Math.PI / 4;
/** A first click this close to a pad centre starts the track ON the pad. */
export const PAD_REACH = 5;
/** A leg may not end this close to a pad of another net. */
export const CLEARANCE = 3;

function constrain(from: Point, to: Point): Point {
  const length = distance(from, to);
  if (length === 0) return to;
  const angle = Math.round(Math.atan2(to.y - from.y, to.x - from.x) / STEP) * STEP;
  return { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length };
}

/** Distance from `p` to the segment `a`–`b`. */
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Track routing tool for the board page: click to add vertices, finish to commit, 45° constrained,
 *  net inherited from the starting pad, clearance kept from foreign-net pads. */
export function createTrackTool(options: TrackToolOptions = {}) {
  const pads = options.pads ?? [];
  const width = options.width ?? 0.25;
  const layer = options.layer ?? 'F.Cu';
  const tracks: Track[] = [];
  let current: Point[] | null = null;
  let cursor: Point | null = null;
  let net: string | null = null;

  const padNear = (p: Point) => pads.find((pad) => distance(pad.at, p) <= PAD_REACH) ?? null;
  const foreignPadNear = (p: Point) =>
    net !== null && pads.some((pad) => pad.net !== net && distance(pad.at, p) <= CLEARANCE);

  return {
    /** Returns false when the leg is refused by the clearance rule. */
    click(p: Point): boolean {
      if (!current) {
        const pad = padNear(p);
        net = pad ? pad.net : null;
        current = [pad ? { ...pad.at } : p];
        return true;
      }
      const last = current[current.length - 1];
      const next = constrain(last, p);
      if (distance(last, next) < 1e-9) return true;
      if (foreignPadNear(next)) return false;
      current.push(next);
      return true;
    },
    move(p: Point) {
      if (current) cursor = constrain(current[current.length - 1], p);
    },
    finish() {
      if (current && current.length >= 2) tracks.push({ points: current, closed: false, net, width, layer });
      current = null;
      cursor = null;
      net = null;
    },
    cancel() {
      current = null;
      cursor = null;
      net = null;
    },
    get preview() {
      if (!current) return null;
      return cursor ? [...current, cursor] : [...current];
    },
    get shapes() {
      return tracks;
    },
    /** Index of the track under `p` within `tol` px, or -1 — tracks are hit along their segments. */
    hitTest(p: Point, tol: number): number {
      for (let i = tracks.length - 1; i >= 0; i--) {
        const pts = tracks[i].points;
        for (let k = 0; k + 1 < pts.length; k++) {
          if (distanceToSegment(p, pts[k], pts[k + 1]) <= tol) return i;
        }
      }
      return -1;
    },
  };
}
