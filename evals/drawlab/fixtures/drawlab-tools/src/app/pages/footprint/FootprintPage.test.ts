import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFootprintPage } from './FootprintPage.ts';

test('footprint page places pads with a size label in mm', () => {
  const page = createFootprintPage();
  assert.equal(page.placePad('1', { x: 0, y: 0 }, 500), '12.7 mm');
  assert.match(page.render(), /data-pad="1"><title>12.7 mm<\/title>/);
});
