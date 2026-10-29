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
