import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBoardPage } from './BoardPage.ts';

test('board page labels a dimension in mm', () => {
  const page = createBoardPage();
  assert.equal(page.addDimension(0, 500), '12.7 mm');
  assert.match(page.render(), /<text>12.7 mm<\/text>/);
});

test('board page renders routed tracks', () => {
  const page = createBoardPage();
  page.click({ x: 0, y: 0 });
  page.click({ x: 30, y: 0 });
  page.finish();
  assert.match(page.render(), /<polyline points="0,0 30,0" \/>/);
});

test('board page renders the net, layer and width of a track', () => {
  const page = createBoardPage();
  page.click({ x: 102, y: 101 });
  page.click({ x: 150, y: 100 });
  page.finish();
  assert.match(page.render(), /class="track" data-net="VCC" data-layer="F\.Cu" data-width="0\.25"/);
});

test('board page hands its layer to the track tool', () => {
  const page = createBoardPage({ layer: 'B.Cu' });
  page.click({ x: 0, y: 0 });
  page.click({ x: 30, y: 0 });
  page.finish();
  assert.match(page.render(), /data-layer="B\.Cu"/);
});
