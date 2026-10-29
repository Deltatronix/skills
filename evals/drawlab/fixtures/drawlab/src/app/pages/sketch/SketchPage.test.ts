import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSketchPage } from './SketchPage.ts';

test('pen points land on the 10px grid', () => {
  const page = createSketchPage();
  page.click({ x: 13, y: 14 });
  page.click({ x: 47, y: 52 });
  page.finish();
  assert.deepEqual(page.shapes, [{ points: [{ x: 10, y: 10 }, { x: 50, y: 50 }], closed: false }]);
});

test('a repeated click on the same grid point is ignored', () => {
  const page = createSketchPage();
  page.click({ x: 0, y: 0 });
  page.click({ x: 2, y: 3 });
  page.click({ x: 20, y: 0 });
  page.finish();
  assert.equal(page.shapes[0].points.length, 2);
});

test('undo removes the last stroke', () => {
  const page = createSketchPage();
  page.click({ x: 0, y: 0 });
  page.click({ x: 20, y: 0 });
  page.finish();
  page.click({ x: 0, y: 20 });
  page.click({ x: 20, y: 20 });
  page.finish();
  page.undo();
  assert.equal(page.shapes.length, 1);
});

test('preview follows the cursor and cancel drops the stroke', () => {
  const page = createSketchPage();
  page.click({ x: 0, y: 0 });
  page.move({ x: 41, y: 39 });
  assert.deepEqual(page.preview, [{ x: 0, y: 0 }, { x: 40, y: 40 }]);
  page.cancel();
  assert.equal(page.preview, null);
});

test('sketch page renders strokes and converts the readout to mm', () => {
  const page = createSketchPage();
  page.click({ x: 0, y: 0 });
  page.click({ x: 20, y: 0 });
  page.finish();
  assert.match(page.render(), /<polyline points="0,0 20,0" \/>/);
  assert.equal(page.readout(500), '12.7 mm');
});
