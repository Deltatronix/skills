import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFootprintPage } from '../src/app/pages/footprint/FootprintPage.ts';

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

test('footprint: vertices snap to the nearest 45° direction from the previous vertex, length kept, no grid', () => {
  const page = createFootprintPage() as any;
  page.click({ x: 0, y: 0 });
  page.click({ x: 10, y: 1 }); // 5.7° → 0°, length √101
  page.finish();
  const a = page.shapes[0].points[1];
  assert.ok(near(a.x, Math.sqrt(101)) && near(a.y, 0), `got ${JSON.stringify(a)}`);

  page.click({ x: 1, y: 1 }); // no grid snapping on the footprint page
  page.click({ x: 8, y: 9 }); // 48.8° → 45°, length √113
  page.finish();
  assert.deepEqual(page.shapes[1].points[0], { x: 1, y: 1 });
  const b = page.shapes[1].points[1];
  const l = Math.sqrt(113) / Math.SQRT2;
  assert.ok(near(b.x, 1 + l) && near(b.y, 1 + l), `got ${JSON.stringify(b)}`);
  assert.equal(page.shapes[1].closed, false);
});

test('footprint: pads still work', () => {
  const page = createFootprintPage();
  assert.equal(page.placePad('1', { x: 0, y: 0 }, 500), '12.7 mm');
  assert.equal(page.pads.length, 1);
});
