import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSchematicPage } from '../src/app/pages/schematic/SchematicPage.ts';

test('schematic: a click within 8px of the first vertex snaps onto it and closes the wire', () => {
  const page = createSchematicPage() as any;
  for (const name of ['click', 'move', 'finish', 'cancel']) {
    assert.equal(typeof page[name], 'function', `the wire tool is exposed on the page: ${name}`);
  }
  assert.ok('preview' in page && 'shapes' in page, 'the wire tool is exposed on the page: preview and shapes');
  page.click({ x: 0, y: 0 });
  page.click({ x: 30, y: 0 });
  page.click({ x: 30, y: 30 });
  page.click({ x: 3, y: 4 }); // 5px from the first vertex
  assert.equal(page.shapes.length, 1, 'the closing click finishes the wire');
  const wire = page.shapes[0];
  assert.equal(wire.closed, true, 'the wire is closed');
  assert.deepEqual(wire.points[0], { x: 0, y: 0 }, 'the wire starts on the first vertex');
  assert.deepEqual(wire.points[1], { x: 30, y: 0 }, 'the second vertex is kept as clicked');
  assert.ok(!wire.points.some((p: any) => p.x === 3 && p.y === 4), 'the near click was snapped, not stored');
  assert.ok(
    wire.points.length === 3 || (wire.points.length === 4 && wire.points[3].x === 0 && wire.points[3].y === 0),
    `the closing point is not repeated: ${JSON.stringify(wire.points)}`,
  );
});

test('schematic: wire vertices are not snapped to the sketch grid', () => {
  const page = createSchematicPage() as any;
  page.click({ x: 0, y: 0 });
  page.click({ x: 13, y: 14 });
  page.finish();
  assert.equal(page.shapes.length, 1);
  assert.deepEqual(page.shapes[0].points, [{ x: 0, y: 0 }, { x: 13, y: 14 }], 'no grid snapping on the schematic');
});

test('schematic: a click farther than 8px from the first vertex keeps drawing', () => {
  const page = createSchematicPage() as any;
  page.click({ x: 0, y: 0 });
  page.click({ x: 30, y: 0 });
  page.click({ x: 30, y: 30 });
  page.click({ x: 9, y: 0 }); // 9px away: no close
  assert.equal(page.shapes.length, 0, 'nothing is committed yet');
  assert.equal(page.preview.length, 4, 'the fourth vertex was added to the wire in progress');
});

test('schematic: labels and junctions unchanged', () => {
  const page = createSchematicPage();
  page.placeLabel('VCC', { x: 10, y: 20 });
  page.addJunction({ x: 5, y: 5 });
  assert.match(page.render(), /<circle class="junction" cx="5" cy="5" r="2" \/><text x="10" y="20">VCC<\/text>/);
});
