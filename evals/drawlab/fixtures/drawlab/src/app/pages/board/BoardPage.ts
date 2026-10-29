import type { Point } from '../../shared/geometry.ts';
import { shapeEl } from '../../shared/svg.ts';
import { createTrackTool } from './trackTool.ts';
import { formatMm } from './units.ts';

export interface Dimension {
  fromMils: number;
  toMils: number;
  label: string;
}

/** Board page: 45°-constrained tracks plus dimension annotations in mm. */
export function createBoardPage() {
  const tool = createTrackTool();
  const dimensions: Dimension[] = [];
  return {
    click: (p: Point) => tool.click(p),
    move: (p: Point) => tool.move(p),
    finish: () => tool.finish(),
    cancel: () => tool.cancel(),
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
      const tracks = tool.shapes.map((t) => shapeEl(t.points, t.closed)).join('');
      const dims = dimensions
        .map((d) => `<g class="dimension" data-from="${d.fromMils}" data-to="${d.toMils}"><text>${d.label}</text></g>`)
        .join('');
      return `<svg class="board">${tracks}${dims}</svg>`;
    },
  };
}
