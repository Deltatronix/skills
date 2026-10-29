export interface Point {
  x: number;
  y: number;
}

export function createPolyline() {
  let points: Point[] | null = null;
  let cursor: Point | null = null;
  return {
    click(point: Point): boolean {
      if (!points) points = [{ ...point }];
      else if (points.at(-1)!.x !== point.x || points.at(-1)!.y !== point.y) points.push({ ...point });
      cursor = null;
      return true;
    },
    move(point: Point) {
      if (points) cursor = { ...point };
    },
    finish(): Point[] | null {
      const result = points && points.length >= 2 ? points : null;
      points = null;
      cursor = null;
      return result;
    },
    cancel() {
      points = null;
      cursor = null;
    },
    get preview() {
      if (!points) return null;
      return cursor ? [...points, cursor] : [...points];
    },
  };
}
