import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSketchPage } from '../src/app/pages/sketch/SketchPage.ts';
import { createBoardPage } from '../src/app/pages/board/BoardPage.ts';
import { createSchematicPage } from '../src/app/pages/schematic/SchematicPage.ts';

test('sketch: grid snapping, free angles, no closing snap', () => {
  const page = createSketchPage();
  page.click({ x: 0, y: 0 });
  page.click({ x: 10, y: 30 }); // 71.6°: an angle-constrained tool would move this
  page.click({ x: 3, y: 4 });
  page.finish();
  assert.equal(page.shapes[0].closed, false);
  assert.deepEqual(page.shapes[0].points, [{ x: 0, y: 0 }, { x: 10, y: 30 }, { x: 0, y: 0 }]);
  page.undo();
  assert.equal(page.shapes.length, 0);
});

test('board: tracks still constrained to 45°, dimensions unchanged', () => {
  const page = createBoardPage();
  page.click({ x: 0, y: 0 });
  page.click({ x: 10, y: 1 });
  page.finish();
  const p = page.shapes[0].points[1];
  assert.ok(Math.abs(p.x - Math.sqrt(101)) < 1e-6 && Math.abs(p.y) < 1e-6, JSON.stringify(p));
  assert.equal(page.addDimension(0, 500), '12.7 mm');
});

test('schematic: labels and junctions unchanged', () => {
  const page = createSchematicPage();
  page.placeLabel('VCC', { x: 10, y: 20 });
  page.addJunction({ x: 5, y: 5 });
  assert.match(page.render(), /<circle class="junction" cx="5" cy="5" r="2" \/><text x="10" y="20">VCC<\/text>/);
});
