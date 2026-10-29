import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLineTool, createTrackTool } from '../main.ts';

for (const create of [createLineTool, createTrackTool]) {
  test(`${create.name}: preview, finish and cancel`, () => {
    const tool = create();
    tool.click({ x: 0, y: 0 });
    tool.move({ x: 7, y: 8 });
    assert.deepEqual(tool.preview, [{ x: 0, y: 0 }, { x: 7, y: 8 }]);
    tool.click({ x: 10, y: 20 });
    tool.finish();
    assert.deepEqual(tool.shapes[0].points, [{ x: 0, y: 0 }, { x: 10, y: 20 }]);
    tool.click({ x: 3, y: 4 });
    tool.cancel();
    assert.equal(tool.preview, null);
    assert.equal(tool.shapes.length, 1);
  });
}

test('track identity includes inheritance and clearance refusal', () => {
  const tool = createTrackTool({ pads: [{ at: { x: 0, y: 0 }, net: 'VCC' }, { at: { x: 20, y: 0 }, net: 'GND' }] });
  tool.click({ x: 1, y: 1 });
  assert.equal(tool.click({ x: 19, y: 0 }), false);
  tool.click({ x: 10, y: 0 });
  tool.finish();
  assert.equal(tool.shapes[0].net, 'VCC');
});
