import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSketchPage } from '../src/app/pages/sketch/SketchPage.ts';
import { createBoardPage } from '../src/app/pages/board/BoardPage.ts';

test('sketch: the pen draws exactly as before', () => {
  const page = createSketchPage() as any;
  page.click({ x: 0, y: 0 });
  page.click({ x: 10, y: 30 }); // 71.6°: an angle-constrained tool would move this
  page.click({ x: 3, y: 4 }); // grid → (0,0): the pen has no closing snap
  page.finish();
  assert.equal(page.shapes.length, 1, 'the stroke is committed by finish, not by the click near the start');
  assert.equal(page.shapes[0].closed, false, 'sketch strokes stay open');
  assert.deepEqual(
    page.shapes[0].points,
    [{ x: 0, y: 0 }, { x: 10, y: 30 }, { x: 0, y: 0 }],
    'grid snapping keeps the free angle and appends the returning click',
  );
  page.click({ x: 13, y: 14 });
  page.click({ x: 12, y: 13 }); // the same grid point again: dropped
  page.click({ x: 47, y: 52 });
  page.finish();
  assert.deepEqual(page.shapes[1].points, [{ x: 10, y: 10 }, { x: 50, y: 50 }], 'grid snapping, repeated grid point dropped');
  page.undo();
  assert.equal(page.shapes.length, 1, 'undo removes the last stroke');
  assert.equal(page.readout(500), '12.7 mm', 'the mils → mm readout is unchanged');
});

test('board: the track tool keeps its identity', () => {
  const page = createBoardPage() as any;
  assert.equal(page.click({ x: 102, y: 101 }), true, 'a: the first click is accepted');
  assert.equal(page.preview.length, 1, 'a: the track in progress has one point');
  assert.deepEqual(page.preview[0], { x: 100, y: 100 }, 'a: the first click snapped onto the VCC pad');

  assert.equal(page.click({ x: 198, y: 101 }), false, 'b: a leg ending on the GND pad is refused');
  assert.equal(page.preview.length, 1, 'b: the refused leg was not added');

  assert.equal(page.click({ x: 150, y: 100 }), true, 'c: a leg clear of foreign pads is accepted');
  page.finish();
  assert.deepEqual(page.shapes[0].points, [{ x: 100, y: 100 }, { x: 150, y: 100 }], 'c: the committed track');
  assert.equal(page.shapes[0].net, 'VCC', 'c: the net is inherited from the starting pad');
  assert.equal(page.shapes[0].width, 0.25, 'c: the default width is stamped on the track');
  assert.equal(page.shapes[0].layer, 'F.Cu', 'c: the default copper layer is stamped on the track');

  const angles = createBoardPage() as any;
  angles.click({ x: 100, y: 100 });
  angles.click({ x: 110, y: 101 });
  angles.finish();
  const v = angles.shapes[0].points[1];
  assert.ok(
    Math.abs(v.x - (100 + Math.sqrt(101))) < 1e-6 && Math.abs(v.y - 100) < 1e-6,
    `d: the leg is constrained to 45° keeping its length: ${JSON.stringify(v)}`,
  );

  const thick = createBoardPage({ width: 0.5, layer: 'B.Cu' }) as any;
  thick.click({ x: 0, y: 0 });
  thick.click({ x: 30, y: 0 });
  thick.finish();
  assert.equal(thick.shapes[0].width, 0.5, 'e: the page width option reaches the committed track');
  assert.equal(thick.shapes[0].layer, 'B.Cu', 'e: the page layer option reaches the committed track');

  const bare = createBoardPage() as any;
  bare.click({ x: 20, y: 20 });
  assert.equal(bare.click({ x: 198, y: 101 }), true, 'f: a track with no net is not held back by the clearance rule');
  bare.finish();
  assert.equal(bare.shapes[0].net, null, 'f: a track that did not start on a pad carries no net');

  assert.equal(page.hitTest({ x: 150, y: 100 }, 2), 0, 'g: the track under the click is selected');
  assert.equal(page.hitTest({ x: 150, y: 110 }, 2), -1, 'g: a click 10 px away selects nothing');

  assert.equal(page.addDimension(0, 500), '12.7 mm', 'h: the dimension label is unchanged');
  assert.ok(page.render().includes('data-net="VCC"'), 'i: the net is rendered on the track');
});
