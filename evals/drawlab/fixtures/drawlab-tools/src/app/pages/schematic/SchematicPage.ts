import type { Point } from '../../shared/geometry.ts';
import { textEl } from '../../shared/svg.ts';

export interface NetLabel {
  text: string;
  at: Point;
}

/** Schematic page: net labels and junction dots. Wires cannot be drawn yet. */
export function createSchematicPage() {
  const labels: NetLabel[] = [];
  const junctions: Point[] = [];
  return {
    placeLabel(text: string, at: Point) {
      labels.push({ text, at });
    },
    addJunction(at: Point) {
      junctions.push(at);
    },
    get labels() {
      return labels;
    },
    get junctions() {
      return junctions;
    },
    render(): string {
      const dots = junctions.map((j) => `<circle class="junction" cx="${j.x}" cy="${j.y}" r="2" />`).join('');
      return `<svg class="schematic">${dots}${labels.map((l) => textEl(l.text, l.at)).join('')}</svg>`;
    },
  };
}
