import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSchematicPage } from '../src/app/pages/schematic/SchematicPage.ts';

test('schematic: a click within 8px of the first vertex snaps onto it and closes the wire', () => {
  const page = createSchematicPage() as any;
  page.click({ x: 0, y: 0 });
  page.click({ x: 100, y: 0 });
  page.click({ x: 100, y: 100 });
  page.click({ x: 3, y: 4 });
  assert.equal(page.shapes.length, 1, 'closing click finishes the wire');
  const shape = page.shapes[0];
  assert.equal(shape.closed, true);
  assert.deepEqual(shape.points[0], { x: 0, y: 0 });
  assert.ok(!shape.points.some((p: any) => p.x === 3 && p.y === 4), 'the near-click was snapped, not stored');
  assert.ok(shape.points.length === 3 || (shape.points.length === 4 && shape.points[3].x === 0 && shape.points[3].y === 0));
});

test('schematic: a farther click keeps drawing and is not grid-snapped', () => {
  const page = createSchematicPage() as any;
  page.click({ x: 0, y: 0 });
  page.click({ x: 100, y: 0 });
  page.click({ x: 100, y: 100 });
  page.click({ x: 6, y: 6 }); // 8.49px away: no close; no grid: stays (6,6)
  assert.equal(page.shapes.length, 0);
  page.finish();
  assert.equal(page.shapes.length, 1);
  assert.equal(page.shapes[0].closed, false);
  assert.deepEqual(page.shapes[0].points.at(-1), { x: 6, y: 6 });
});

test('schematic: labels and junctions still work', () => {
  const page = createSchematicPage();
  page.placeLabel('VCC', { x: 10, y: 20 });
  page.addJunction({ x: 5, y: 5 });
  assert.equal(page.labels.length, 1);
  assert.equal(page.junctions.length, 1);
});
