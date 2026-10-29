import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTrackTool } from './trackTool.ts';

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test('track vertices snap to the nearest 45° direction, keeping the length', () => {
  const tool = createTrackTool();
  tool.click({ x: 0, y: 0 });
  tool.click({ x: 10, y: 1 });
  tool.finish();
  const p = tool.shapes[0].points[1];
  assert.ok(near(p.x, Math.sqrt(101)) && near(p.y, 0), JSON.stringify(p));
});

test('the preview is constrained as well', () => {
  const tool = createTrackTool();
  tool.click({ x: 0, y: 0 });
  tool.move({ x: 7, y: 8 });
  const p = tool.preview![1];
  const l = Math.sqrt(113) / Math.SQRT2;
  assert.ok(near(p.x, l) && near(p.y, l), JSON.stringify(p));
});
