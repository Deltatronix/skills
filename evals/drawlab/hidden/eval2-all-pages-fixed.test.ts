import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBoardPage } from '../src/app/pages/board/BoardPage.ts';
import { createSketchPage } from '../src/app/pages/sketch/SketchPage.ts';
import { createFootprintPage } from '../src/app/pages/footprint/FootprintPage.ts';

test('board page: dimension label has no float artefact', () => {
  const page = createBoardPage();
  assert.equal(page.addDimension(0, 1002), '25.4508 mm');
  assert.equal(page.addDimension(0, 500), '12.7 mm');
});

test('sketch page: the inline readout is fixed too', () => {
  const page = createSketchPage();
  assert.equal(page.readout(1002), '25.4508 mm');
  assert.equal(page.readout(500), '12.7 mm');
});

test('footprint page: pad size labels are fixed too', () => {
  const page = createFootprintPage();
  assert.equal(page.placePad('1', { x: 0, y: 0 }, 1002), '25.4508 mm');
});
