import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSchematicPage } from './SchematicPage.ts';

test('schematic page places net labels and junctions', () => {
  const page = createSchematicPage();
  page.placeLabel('VCC', { x: 10, y: 20 });
  page.addJunction({ x: 5, y: 5 });
  assert.equal(page.labels.length, 1);
  assert.match(page.render(), /<circle class="junction" cx="5" cy="5" r="2" \/><text x="10" y="20">VCC<\/text>/);
});

test('schematic toolbar offers label and junction, header shows the last save', () => {
  const page = createSchematicPage();
  assert.match(page.toolbarHtml(), /data-tool="label"/);
  assert.equal(page.header(new Date(2026, 8, 9)), 'Last saved 09/09/2026');
});
