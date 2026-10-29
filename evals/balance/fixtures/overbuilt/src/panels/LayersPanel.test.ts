import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLayersPanel } from './LayersPanel.ts';

test('layers panel maps all rail item fields and dispatches enabled actions', () => {
  const calls: string[] = [];
  const registry = { 'layer.add': { enabled: true, shortcut: 'A' }, 'layer.remove': { enabled: false } };
  const panel = createLayersPanel(registry, (id) => calls.push(id));
  assert.equal(panel.items.length, 2);
  assert.equal(panel.items[0].id, 'layer.add');
  assert.equal(panel.items[0].icon, 'plus');
  assert.equal(panel.items[0].label, 'Add layer');
  assert.equal(panel.items[0].shortcut, 'A');
  assert.equal(panel.items[0].disabled, false);
  assert.equal(panel.items[1].id, 'layer.remove');
  assert.equal(panel.items[1].icon, 'minus');
  assert.equal(panel.items[1].label, 'Remove layer');
  assert.equal(panel.items[1].shortcut, '');
  assert.equal(panel.items[1].disabled, true);
  panel.items[0].run();
  panel.items[1].run();
  assert.deepEqual(calls, ['layer.add']);
});
