import type { Point } from './geometry.ts';

export const pointsAttr = (points: Point[]): string => points.map((p) => `${p.x},${p.y}`).join(' ');

/** A closed shape renders as a polygon, an open one as a polyline. */
export function shapeEl(points: Point[], closed = false): string {
  return closed ? `<polygon points="${pointsAttr(points)}" />` : `<polyline points="${pointsAttr(points)}" />`;
}

export const textEl = (text: string, at: Point): string => `<text x="${at.x}" y="${at.y}">${text}</text>`;
