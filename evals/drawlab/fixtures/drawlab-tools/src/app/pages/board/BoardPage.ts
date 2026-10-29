import type { Point } from '../../shared/geometry.ts';
import { shapeEl } from '../../shared/svg.ts';
import { createTrackTool, type CopperLayer, type Pad } from './trackTool.ts';
import { formatMm } from './units.ts';

export interface Dimension {
  fromMils: number;
  toMils: number;
  label: string;
}

/** Pads of the board under edit; a track started on one inherits its net. */
export const PADS: Pad[] = [{ at: { x: 100, y: 100 }, net: 'VCC' }, { at: { x: 200, y: 100 }, net: 'GND' }];

/** Board page: 45°-constrained tracks on the board's pads plus dimension annotations in mm. */
export function createBoardPage(options: { width?: number; layer?: CopperLayer } = {}) {
  const tool = createTrackTool({ pads: PADS, ...options });
  const dimensions: Dimension[] = [];
  return {
    click: (p: Point) => tool.click(p),
    move: (p: Point) => tool.move(p),
    finish: () => tool.finish(),
    cancel: () => tool.cancel(),
    hitTest: (p: Point, tol: number) => tool.hitTest(p, tol),
    get preview() {
      return tool.preview;
    },
    get shapes() {
      return tool.shapes;
    },
    addDimension(fromMils: number, toMils: number): string {
      const label = formatMm(Math.abs(toMils - fromMils));
      dimensions.push({ fromMils, toMils, label });
      return label;
    },
    get dimensions() {
      return dimensions;
    },
    render(): string {
      const tracks = tool.shapes
        .map(
          (t) =>
            `<g class="track" data-net="${t.net ?? ''}" data-layer="${t.layer}" data-width="${t.width}">${shapeEl(t.points, t.closed)}</g>`,
        )
        .join('');
      const dims = dimensions
        .map((d) => `<g class="dimension" data-from="${d.fromMils}" data-to="${d.toMils}"><text>${d.label}</text></g>`)
        .join('');
      return `<svg class="board">${tracks}${dims}</svg>`;
    },
  };
}
