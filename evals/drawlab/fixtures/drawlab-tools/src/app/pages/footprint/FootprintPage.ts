import type { Point } from '../../shared/geometry.ts';
import { formatMm } from '../board/units.ts';

export interface Pad {
  number: string;
  at: Point;
  sizeMils: number;
  label: string;
}

/** Footprint page: today only pads can be placed; each pad carries its size label in mm. */
export function createFootprintPage() {
  const pads: Pad[] = [];
  return {
    placePad(number: string, at: Point, sizeMils: number): string {
      const label = formatMm(sizeMils);
      pads.push({ number, at, sizeMils, label });
      return label;
    },
    get pads() {
      return pads;
    },
    render(): string {
      const circles = pads
        .map((p) => `<circle cx="${p.at.x}" cy="${p.at.y}" r="${p.sizeMils / 2}" data-pad="${p.number}"><title>${p.label}</title></circle>`)
        .join('');
      return `<svg class="footprint">${circles}</svg>`;
    },
  };
}
