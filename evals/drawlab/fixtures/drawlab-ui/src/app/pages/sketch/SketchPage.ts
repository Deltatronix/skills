import type { Point } from '../../shared/geometry.ts';
import { createLineTool } from '../../shared/lineTool.ts';
import { shapeEl } from '../../shared/svg.ts';
import { toolbarHtml, type ToolButtonDef } from '../../shared/toolbar.ts';

const TOOLS: ToolButtonDef[] = [
  { id: 'line', icon: 'pen', label: 'Draw line', shortcut: 'L' },
  { id: 'undo', icon: 'undo', label: 'Undo', shortcut: 'Z' },
];

/** Sketch page: pen strokes on a 10 px grid, undo, and a mils→mm cursor readout in the status bar. */
export function createSketchPage() {
  const tool = createLineTool({ grid: 10 });
  return {
    click: (p: Point) => tool.click(p),
    move: (p: Point) => tool.move(p),
    finish: () => tool.finish(),
    cancel: () => tool.cancel(),
    undo: () => tool.undo(),
    get preview() {
      return tool.preview;
    },
    get shapes() {
      return tool.shapes;
    },
    /** Status-bar readout for a cursor distance measured in mils. */
    readout: (mils: number) => `${mils * 0.0254} mm`,
    toolbar: () => TOOLS,
    toolbarHtml: () => toolbarHtml(TOOLS),
    /** Status-bar text for the last save. */
    header(lastSaved: Date): string {
      const d = String(lastSaved.getDate()).padStart(2, '0');
      const m = String(lastSaved.getMonth() + 1).padStart(2, '0');
      return `Last saved ${d}/${m}/${lastSaved.getFullYear()}`;
    },
    render(): string {
      return `<svg class="sketch">${tool.shapes.map((s) => shapeEl(s.points, s.closed)).join('')}</svg>`;
    },
  };
}
