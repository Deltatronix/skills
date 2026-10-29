import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFootprintPage } from './FootprintPage.ts';

test('footprint page places pads with a size label in mm', () => {
  const page = createFootprintPage();
  assert.equal(page.placePad('1', { x: 0, y: 0 }, 500), '12.7 mm');
  assert.match(page.render(), /data-pad="1"><title>12.7 mm<\/title>/);
});

test('footprint lines are constrained to 45° steps and are not grid-snapped', () => {
  const page = createFootprintPage();
  page.click({ x: 3, y: 4 });
  page.click({ x: 13, y: 5 });
  page.finish();
  const [start, end] = page.shapes[0].points;
  assert.deepEqual(start, { x: 3, y: 4 }); // no grid snapping
  assert.ok(Math.abs(end.x - (3 + Math.sqrt(101))) < 1e-9 && Math.abs(end.y - 4) < 1e-9, JSON.stringify(end));
});

test('footprint previews the line in progress, cancel drops it, and pads still render', () => {
  const page = createFootprintPage();
  page.placePad('1', { x: 0, y: 0 }, 500);
  page.click({ x: 0, y: 0 });
  page.move({ x: 30, y: 1 });
  assert.equal(page.preview!.length, 2);
  page.cancel();
  assert.equal(page.preview, null);
  page.click({ x: 0, y: 0 });
  page.click({ x: 30, y: 0 });
  page.finish();
  assert.match(page.render(), /data-pad="1"><title>12.7 mm<\/title><\/circle><polyline points="0,0 30,0" \/>/);
});
