import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTrackTool, type Pad } from './trackTool.ts';

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

const pads: Pad[] = [
  { at: { x: 100, y: 100 }, net: 'VCC' },
  { at: { x: 200, y: 100 }, net: 'GND' },
];

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

test('a track started on a pad snaps onto it and inherits its net', () => {
  const tool = createTrackTool({ pads });
  tool.click({ x: 102, y: 101 });
  tool.click({ x: 150, y: 100 });
  tool.finish();
  assert.deepEqual(tool.shapes[0].points[0], { x: 100, y: 100 });
  assert.equal(tool.shapes[0].net, 'VCC');
});

test('a leg ending too close to a foreign-net pad is refused', () => {
  const tool = createTrackTool({ pads });
  tool.click({ x: 102, y: 101 });
  assert.equal(tool.click({ x: 198, y: 101 }), false);
  assert.equal(tool.preview!.length, 1);
  assert.equal(tool.click({ x: 150, y: 100 }), true);
  assert.equal(tool.preview!.length, 2);
});

test('the tool stamps its width and layer on every track it commits', () => {
  const thick = createTrackTool({ width: 0.5, layer: 'B.Cu' });
  thick.click({ x: 0, y: 0 });
  thick.click({ x: 30, y: 0 });
  thick.finish();
  assert.equal(thick.shapes[0].width, 0.5);
  assert.equal(thick.shapes[0].layer, 'B.Cu');
  const tool = createTrackTool();
  tool.click({ x: 0, y: 0 });
  tool.click({ x: 30, y: 0 });
  tool.finish();
  assert.equal(tool.shapes[0].width, 0.25);
  assert.equal(tool.shapes[0].layer, 'F.Cu');
});

test('a bare track carries no net, so the clearance rule does not apply', () => {
  const tool = createTrackTool({ pads });
  tool.click({ x: 20, y: 20 });
  assert.equal(tool.click({ x: 198, y: 101 }), true);
  tool.finish();
  assert.equal(tool.shapes[0].net, null);
});

test('a committed track is hit by a click on the line between its vertices', () => {
  const tool = createTrackTool();
  tool.click({ x: 100, y: 100 });
  tool.click({ x: 200, y: 100 });
  tool.finish();
  assert.equal(tool.hitTest({ x: 150, y: 100 }, 2), 0);
  assert.equal(tool.hitTest({ x: 150, y: 110 }, 2), -1);
});
