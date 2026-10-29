import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSketchPage } from '../src/app/pages/sketch/SketchPage.ts';
import { createBoardPage } from '../src/app/pages/board/BoardPage.ts';

test('sketch: grid snapping, no closing snap, undo and readout unchanged', () => {
  const page = createSketchPage();
  page.click({ x: 0, y: 0 });
  page.click({ x: 100, y: 0 });
  page.click({ x: 100, y: 100 });
  page.click({ x: 3, y: 4 }); // grid → (0,0), which the sketch pen appends: no closing snap here
  page.finish();
  assert.equal(page.shapes.length, 1);
  assert.equal(page.shapes[0].closed, false);
  assert.deepEqual(page.shapes[0].points, [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 0 }]);
  page.click({ x: 13, y: 14 });
  page.click({ x: 47, y: 52 });
  page.finish();
  assert.deepEqual(page.shapes[1].points, [{ x: 10, y: 10 }, { x: 50, y: 50 }]);
  page.undo();
  assert.equal(page.shapes.length, 1);
  assert.equal(page.readout(500), '12.7 mm');
});

test('board: tracks still constrained to 45°', () => {
  const page = createBoardPage();
  page.click({ x: 0, y: 0 });
  page.click({ x: 10, y: 1 });
  page.finish();
  const p = page.shapes[0].points[1];
  assert.ok(Math.abs(p.x - Math.sqrt(101)) < 1e-6 && Math.abs(p.y) < 1e-6, JSON.stringify(p));
  assert.equal(page.addDimension(0, 500), '12.7 mm');
});
