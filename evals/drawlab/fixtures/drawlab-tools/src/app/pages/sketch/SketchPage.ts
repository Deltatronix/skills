import { distance, type Point } from '../../shared/geometry.ts';
import { shapeEl } from '../../shared/svg.ts';

export interface Stroke {
  points: Point[];
  closed: boolean;
}

/** Sketch grid pitch in px; every pen point lands on it. */
const GRID = 10;
const onGrid = (p: Point): Point => ({ x: Math.round(p.x / GRID) * GRID, y: Math.round(p.y / GRID) * GRID });

/** Sketch page: pen strokes on a 10 px grid, undo, and a mils→mm cursor readout in the status bar. */
export function createSketchPage() {
  const strokes: Stroke[] = [];
  const history: Stroke[][] = [];
  let pen: Point[] | null = null; // stroke in progress
  let cursor: Point | null = null;

  const endStroke = () => {
    if (pen && pen.length >= 2) {
      history.push([...strokes]);
      strokes.push({ points: pen, closed: false });
    }
    pen = null;
    cursor = null;
  };

  return {
    click(p: Point) {
      const g = onGrid(p);
      if (!pen) {
        pen = [g];
        return;
      }
      if (distance(pen[pen.length - 1], g) === 0) return; // repeated click on the same grid point
      pen.push(g);
    },
    move(p: Point) {
      if (pen) cursor = onGrid(p);
    },
    finish: () => endStroke(),
    cancel() {
      pen = null;
      cursor = null;
    },
    undo() {
      const previous = history.pop();
      if (previous) strokes.splice(0, strokes.length, ...previous);
    },
    get preview() {
      if (!pen) return null;
      return cursor ? [...pen, cursor] : [...pen];
    },
    get shapes() {
      return strokes;
    },
    /** Index of the stroke under `p` within `tol` px, or -1. */
    hitTest(p: Point, tol: number): number {
      // Sketch selection: a stroke is hit when the click is near one of its vertices.
      for (let i = strokes.length - 1; i >= 0; i--) {
        if (strokes[i].points.some((v) => distance(v, p) <= tol)) return i;
      }
      return -1;
    },
    /** Status-bar readout for a cursor distance measured in mils. */
    readout: (mils: number) => `${mils * 0.0254} mm`,
    render(): string {
      return `<svg class="sketch">${strokes.map((s) => shapeEl(s.points, s.closed)).join('')}</svg>`;
    },
  };
}
