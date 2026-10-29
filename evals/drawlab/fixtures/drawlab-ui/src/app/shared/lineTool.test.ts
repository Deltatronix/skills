import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLineTool } from './lineTool.ts';

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test('by default a vertex lands exactly where it was clicked', () => {
  const tool = createLineTool();
  tool.click({ x: 3, y: 4 });
  tool.click({ x: 10, y: 1 });
  tool.finish();
  assert.deepEqual(tool.shapes, [{ points: [{ x: 3, y: 4 }, { x: 10, y: 1 }], closed: false }]);
});

test('angleStep snaps vertices to the nearest 45° direction, keeping the length', () => {
  const tool = createLineTool({ angleStep: Math.PI / 4 });
  tool.click({ x: 0, y: 0 });
  tool.click({ x: 10, y: 1 });
  tool.finish();
  const p = tool.shapes[0].points[1];
  assert.ok(near(p.x, Math.sqrt(101)) && near(p.y, 0), JSON.stringify(p));
});

test('angleStep constrains the preview as well', () => {
  const tool = createLineTool({ angleStep: Math.PI / 4 });
  tool.click({ x: 0, y: 0 });
  tool.move({ x: 7, y: 8 });
  const p = tool.preview![1];
  const l = Math.sqrt(113) / Math.SQRT2;
  assert.ok(near(p.x, l) && near(p.y, l), JSON.stringify(p));
});

test('grid snaps every point to the pitch, angleStep off leaves the direction alone', () => {
  const tool = createLineTool({ grid: 10 });
  tool.click({ x: 13, y: 14 });
  tool.click({ x: 47, y: 52 });
  tool.finish();
  assert.deepEqual(tool.shapes, [{ points: [{ x: 10, y: 10 }, { x: 50, y: 50 }], closed: false }]);
});

test('a click that repeats the last vertex is ignored', () => {
  const tool = createLineTool({ grid: 10 });
  tool.click({ x: 0, y: 0 });
  tool.click({ x: 2, y: 3 });
  tool.finish();
  assert.deepEqual(tool.shapes, []); // one vertex is not a line
});

test('cancel drops the line in progress, finish needs two vertices', () => {
  const tool = createLineTool();
  tool.click({ x: 0, y: 0 });
  tool.move({ x: 5, y: 5 });
  assert.deepEqual(tool.preview, [{ x: 0, y: 0 }, { x: 5, y: 5 }]);
  tool.cancel();
  assert.equal(tool.preview, null);
  tool.finish();
  assert.deepEqual(tool.shapes, []);
});

test('undo takes back the last committed line', () => {
  const tool = createLineTool();
  tool.click({ x: 0, y: 0 });
  tool.click({ x: 20, y: 0 });
  tool.finish();
  tool.click({ x: 0, y: 20 });
  tool.click({ x: 20, y: 20 });
  tool.finish();
  tool.undo();
  assert.equal(tool.shapes.length, 1);
});
