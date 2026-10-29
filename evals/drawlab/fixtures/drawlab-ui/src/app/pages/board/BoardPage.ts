import type { Point } from '../../shared/geometry.ts';
import { shapeEl } from '../../shared/svg.ts';
import { toolbarHtml, type ToolButtonDef } from '../../shared/toolbar.ts';

const TOOLS: ToolButtonDef[] = [
  { id: 'line', icon: 'route', label: 'Line', shortcut: 'X' },
  { id: 'dimension', icon: 'ruler', label: 'Dimension', shortcut: 'D' },
];
import { createLineTool } from '../../shared/lineTool.ts';
import { formatMm } from './units.ts';

export interface Dimension {
  fromMils: number;
  toMils: number;
  label: string;
}

/** Board page: 45°-constrained tracks plus dimension annotations in mm. */
export function createBoardPage() {
  const tool = createLineTool({ angleStep: Math.PI / 4 }); // 45° routing
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
    toolbar: () => TOOLS,
    toolbarHtml: () => toolbarHtml(TOOLS),
    header(lastSaved: Date): string {
      const d = `${lastSaved.getDate()}`.padStart(2, '0');
      const m = `${lastSaved.getMonth() + 1}`.padStart(2, '0');
      return `Saved ${d}.${m}.${lastSaved.getFullYear()}`;
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
