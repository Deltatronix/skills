import type { Point } from '../../shared/geometry.ts';
import { createLineTool } from '../../shared/lineTool.ts';
import { shapeEl } from '../../shared/svg.ts';
import { formatMm } from '../board/units.ts';

export interface Pad {
  number: string;
  at: Point;
  sizeMils: number;
  label: string;
}

/** Footprint page: pads, each carrying its size label in mm, plus 45°-constrained outline lines. */
export function createFootprintPage() {
  const pads: Pad[] = [];
  const tool = createLineTool({ angleStep: Math.PI / 4 }); // 45° routing
  return {
    placePad(number: string, at: Point, sizeMils: number): string {
      const label = formatMm(sizeMils);
      pads.push({ number, at, sizeMils, label });
      return label;
    },
    get pads() {
      return pads;
    },
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
    render(): string {
      const circles = pads
        .map((p) => `<circle cx="${p.at.x}" cy="${p.at.y}" r="${p.sizeMils / 2}" data-pad="${p.number}"><title>${p.label}</title></circle>`)
        .join('');
      const lines = tool.shapes.map((s) => shapeEl(s.points, s.closed)).join('');
      return `<svg class="footprint">${circles}${lines}</svg>`;
    },
  };
}
